import { spawnSync } from 'node:child_process';
import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { HAOO_MEASUREMENT_EVENTS, type HaooMeasurementEvent } from '../products/haoo';
import {
  deltaLabel,
  HAOO_REPORT_EVENTS,
  periodWindows,
  REPORT_STAGE_ORDER,
  REPORT_STAGES,
  reportLabel,
  stageOf,
  stageTotals,
  type ReportStageId,
} from '../reporting/haoo-report';
import { parseGoalCounts } from '../reporting/stats-response';
import { validateEchoedQuery } from '../reporting/query-provenance';
import {
  escapeHtml,
  renderReport,
  REPORT_STYLES,
  type ReportModel,
} from '../reporting/render';
import {
  generateHaooReport,
  type ReportFetch,
  type ReportFs,
} from '../reporting/generate';

/**
 * MEAS-01 / MEAS-08 report contracts.
 *
 * Every count this report renders is an occurrence of a browser action recorded through
 * the Phase 3 closed allowlist. The suite below pins three things that prose cannot:
 * that the report dictionary and the Phase 3 event tuple are exhaustive against each
 * other in both directions (so an eleventh event can never render as a blank row), that
 * an untrusted provider response is refused rather than partially rendered (threat
 * T-04-04), and that the generated document never carries a credential, a script
 * element, an external resource, or a word that claims more than a browser observed
 * (threats T-04-02, T-04-03, T-04-05).
 */

const ROOT = resolve(import.meta.dirname, '../..');

/** A fixture key that must never appear in a rendered document (threat T-04-02). */
const FIXTURE_API_KEY = 'fixture-query-api-key-do-not-render';

/**
 * The project the fixture command was configured with. It is rendered in the metadata
 * line exactly once, and it is deliberately a string the document cannot produce by any
 * other route, so a single-occurrence assertion is meaningful.
 */
const FIXTURE_PROJECT_ID = '70707';
const FIXTURE_ENDPOINT = `https://provider.invalid/api/projects/${FIXTURE_PROJECT_ID}/query/`;

/** The terminal-only failure sentence from the UI-SPEC Copywriting Contract. */
const ERROR_STATE_SENTENCE =
  'Report not updated. A query or validation check failed, so the previous report file '
  + 'was left unchanged. Check the API key and network connection, then run the command '
  + 'again.';

/** UI-SPEC "Event labels (exactly one per closed event name)" — one row per event. */
interface EventLabelRow {
  readonly event: HaooMeasurementEvent;
  readonly stage: ReportStageId;
  readonly label: string;
}

const EVENT_LABEL_TABLE: readonly EventLabelRow[] = [
  { event: 'haoo_page_view', stage: 'discovery', label: 'HAOO page views' },
  {
    event: 'haoo_brochure_preview',
    stage: 'brochure-interest',
    label: 'Brochure preview became available',
  },
  { event: 'haoo_brochure_open', stage: 'brochure-interest', label: 'Brochure open clicks' },
  {
    event: 'haoo_brochure_download',
    stage: 'brochure-interest',
    label: 'Brochure download clicks',
  },
  { event: 'haoo_qualify_start', stage: 'qualification', label: 'Qualification form starts' },
  {
    event: 'haoo_qualify_submit',
    stage: 'qualification',
    label: 'Validated form send attempts',
  },
  {
    event: 'haoo_assisted_whatsapp',
    stage: 'assisted-and-self-onboarding',
    label: 'Outbound WhatsApp clicks',
  },
  {
    event: 'haoo_assisted_phone',
    stage: 'assisted-and-self-onboarding',
    label: 'Outbound phone clicks',
  },
  {
    event: 'haoo_assisted_email',
    stage: 'assisted-and-self-onboarding',
    label: 'Outbound email clicks',
  },
  {
    event: 'haoo_self_onboarding',
    stage: 'assisted-and-self-onboarding',
    label: 'Outbound self-onboarding clicks',
  },
];

/** UI-SPEC "Stage labels and clarifiers" — the four locked stage labels. */
const STAGE_LABELS: Readonly<Record<ReportStageId, string>> = {
  discovery: 'Discovery',
  'brochure-interest': 'Brochure interest',
  qualification: 'Qualification',
  'assisted-and-self-onboarding': 'Assisted and self-onboarding',
};

/**
 * UI-SPEC "Locked banned vocabulary (report, disclosure, and email summary)", copied
 * verbatim. Each term claims more than a browser observed, or expresses a proportion the
 * anonymous event stream cannot prove (D-04).
 *
 * The list's twenty-second entry, `%`, has no word boundary and is asserted separately by
 * `BANNED_REPORT_PERCENT_SIGN` below, together with the "any percentage figure" clause it
 * stands for.
 */
const BANNED_REPORT_VOCABULARY = [
  'visitor', 'visitors', 'user', 'users', 'people', 'unique', 'session', 'lead', 'leads',
  'score', 'customer', 'conversion', 'converted', 'conversion rate', 'drop-off',
  'funnel drop', 'journey', 'delivered', 'received', 'onboarded', 'signed up',
] as const;

/** The locked list's percentage entry: a sign, not a word, so it is matched literally. */
const BANNED_REPORT_PERCENT_SIGN = '%';

/** The id of the authored caveat block, excluded from the vocabulary scan below. */
const CAVEAT_BLOCK_ID = 'report-caveats';

/**
 * The document's rendered text with the style element and the authored caveat block
 * removed.
 *
 * The style element goes because CSS units would false-positive the percentage check and
 * declaration names could mask a real hit. The caveat block goes because it is the
 * report's *denial* of the claims the banned list forbids: to be truthful it has to say
 * the counts are "not people, sessions, or enquiries" and that a click is "not ... a
 * customer". Scanning it would force those denials out of the document and leave the
 * report less honest, not more. The exclusion is safe only because the block is pinned
 * separately by exact text against the authored copy, so no other sentence can hide
 * inside it, and because a contract asserts every banned term found anywhere in the
 * document lies inside this one block.
 */
function documentText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const node of doc.querySelectorAll(`style, #${CAVEAT_BLOCK_ID}`)) {
    node.remove();
  }

  return doc.documentElement.textContent ?? '';
}

/**
 * The HogQL projection this report submits, authored here rather than imported from
 * `src/reporting/stats-response.ts`, so the column-pair assertion is checked against an
 * independent second copy. A rename in the source pair fails here instead of passing by
 * construction.
 */
const INDEPENDENT_HOGQL_COLUMNS = ['event', 'occurrences'] as const;

/**
 * A HogQL aggregate response: a `columns` pair naming the projection and `results` as
 * positional two-element rows. The provider returns a row only for a name with
 * occurrences in the range, so an absent name is a real zero rather than an omission.
 */
function goalRows(counts: Partial<Record<HaooMeasurementEvent, number>>) {
  return {
    columns: [...INDEPENDENT_HOGQL_COLUMNS],
    results: Object.entries(counts).map(([goal, value]) => [goal, value]),
  };
}

const INDEPENDENT_GOAL_FILTER = [
  'haoo_page_view',
  'haoo_brochure_preview',
  'haoo_brochure_open',
  'haoo_brochure_download',
  'haoo_qualify_start',
  'haoo_qualify_submit',
  'haoo_assisted_whatsapp',
  'haoo_assisted_phone',
  'haoo_assisted_email',
  'haoo_self_onboarding',
] as const;

/** One submitted query: a bounded range, the unbounded all-time aggregate, or the first day. */
type SubmittedQuery =
  | { readonly start: string; readonly end: string }
  | 'all'
  | 'first-day';

/**
 * The reporting timezone and the row limit as the SQL carries them, authored here rather
 * than imported. The timezone now lives inside the submitted query text instead of in a
 * remote site setting, so the provider cannot disagree with the report about a day
 * boundary — the mismatch failure mode is retired rather than ported.
 */
const INDEPENDENT_TIMEZONE = 'Africa/Nairobi';

/**
 * Comfortably above the ten allowlisted names, so an eleventh name could never be
 * truncated by the provider's default page into a silently wrong zero.
 */
const INDEPENDENT_ROW_LIMIT = 100;

function independentEventLiterals(): string {
  return INDEPENDENT_GOAL_FILTER.map((event) => `'${event}'`).join(', ');
}

/**
 * A byte-for-byte second copy of the SQL `src/reporting/generate.ts` submits.
 *
 * The echo validator compares the response's echoed query against the submitted text
 * without normalising whitespace, so this copy is what proves the submitted text is what
 * the report thinks it is. A change to the source builder — including a reformatting —
 * fails here rather than passing by construction.
 */
function independentSql(submitted: SubmittedQuery): string {
  if (submitted === 'first-day') {
    return `SELECT toString(toDate(toTimeZone(min(timestamp), '${INDEPENDENT_TIMEZONE}'))) AS first_day\n`
      + 'FROM events\n'
      + `WHERE event IN (${independentEventLiterals()})\n`
      + 'LIMIT 1';
  }

  const bounds = submitted === 'all'
    ? ''
    : `\n  AND toDate(toTimeZone(timestamp, '${INDEPENDENT_TIMEZONE}')) >= toDate('${submitted.start}')`
      + `\n  AND toDate(toTimeZone(timestamp, '${INDEPENDENT_TIMEZONE}')) <= toDate('${submitted.end}')`;

  return 'SELECT event, count() AS occurrences\n'
    + 'FROM events\n'
    + `WHERE event IN (${independentEventLiterals()})${bounds}\n`
    + 'GROUP BY event\n'
    + 'ORDER BY event\n'
    + `LIMIT ${INDEPENDENT_ROW_LIMIT}`;
}

/**
 * The eight queries one run submits, in order: current and previous for 7, 30 and 90
 * days, the unbounded all-time aggregate, and the single-value first-recorded-day query
 * that replaces the range echo the previous provider supplied.
 */
const DEFAULT_SUBMITTED_QUERIES: readonly SubmittedQuery[] = [
  { start: '2026-02-23', end: '2026-03-01' },
  { start: '2026-02-16', end: '2026-02-22' },
  { start: '2026-01-31', end: '2026-03-01' },
  { start: '2026-01-01', end: '2026-01-30' },
  { start: '2025-12-02', end: '2026-03-01' },
  { start: '2025-09-03', end: '2025-12-01' },
  'all',
  'first-day',
];

/** A first-recorded-day response: one column and at most one single-element row. */
function firstDayRows(day: string | null) {
  return { columns: ['first_day'], results: day === null ? [] : [[day]] };
}

const FIXTURE_FIRST_DAY = firstDayRows('2025-11-04');

const FIXTURE_CURRENT = goalRows({
  haoo_page_view: 124,
  haoo_brochure_preview: 41,
  haoo_brochure_open: 18,
  haoo_brochure_download: 9,
  haoo_qualify_start: 12,
  haoo_qualify_submit: 5,
  haoo_assisted_whatsapp: 7,
  haoo_assisted_phone: 3,
  haoo_assisted_email: 2,
  haoo_self_onboarding: 6,
});

const FIXTURE_PREVIOUS = goalRows({
  haoo_page_view: 100,
  haoo_brochure_preview: 41,
  haoo_brochure_open: 25,
  haoo_qualify_start: 12,
  haoo_qualify_submit: 5,
  haoo_assisted_whatsapp: 7,
  haoo_assisted_phone: 3,
  haoo_assisted_email: 2,
  haoo_self_onboarding: 6,
});

interface StubCall {
  readonly url: string;
  readonly body: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
}

function stubFetch(
  bodies: readonly unknown[],
  submittedQueries: readonly SubmittedQuery[] = DEFAULT_SUBMITTED_QUERIES,
  firstDayBody: unknown = FIXTURE_FIRST_DAY,
) {
  const calls: StubCall[] = [];
  let index = 0;
  const fetchSpy = vi.fn<ReportFetch>(async (url, init) => {
    calls.push({ url, body: init.body, headers: init.headers, signal: init.signal });
    const submitted = submittedQueries[Math.min(index, submittedQueries.length - 1)];
    // The first-day query answers a different projection, so it is fixtured separately
    // rather than being handed an aggregate row it could never parse.
    const supplied = submitted === 'first-day'
      ? firstDayBody
      : bodies[Math.min(index, bodies.length - 1)];
    index += 1;
    const responseBody =
      typeof supplied === 'object' && supplied !== null && !Array.isArray(supplied)
        ? {
            ...supplied,
            query: {
              kind: INDEPENDENT_QUERY_KIND,
              query: independentSql(submitted),
              ...('query' in supplied
                && typeof supplied.query === 'object'
                && supplied.query !== null
                ? supplied.query
                : {}),
            },
          }
        : supplied;
    return { ok: true, json: async () => responseBody };
  });

  return { fetchSpy, calls };
}

/** The SQL a recorded call actually submitted, read back out of its request body. */
function submittedSqlOf(call: StubCall | undefined): string {
  const body: unknown = JSON.parse(call?.body ?? '{}');
  const query = typeof body === 'object' && body !== null && 'query' in body
    ? (body as { query?: unknown }).query
    : undefined;
  const text = typeof query === 'object' && query !== null && 'query' in query
    ? (query as { query?: unknown }).query
    : undefined;

  return typeof text === 'string' ? text : '';
}

/**
 * The provider echoes the query it answered, so the whole provenance question becomes one
 * exact-equality check against the SQL this repository submitted. The submitted text is
 * repository-owned and byte-stable, so a whitespace difference is evidence rather than
 * formatting — and because the SQL carries the event allowlist and both range bounds, one
 * equality subsumes every per-member echo check the previous provider needed.
 *
 * The query kind is authored here rather than imported, so a rename in the source fails
 * this suite instead of passing by construction.
 */
const INDEPENDENT_QUERY_KIND = 'HogQLQuery';

describe('validateEchoedQuery', () => {
  const submitted = "SELECT event, count() AS occurrences\nFROM events\n"
    + "WHERE event IN ('haoo_page_view')\nGROUP BY event\nORDER BY event\nLIMIT 100";
  const expected = { sql: submitted } as const;

  it('accepts an echoed object carrying the query kind and the exact submitted text', () => {
    expect(validateEchoedQuery(
      { query: { kind: INDEPENDENT_QUERY_KIND, query: submitted } },
      expected,
    )).toEqual({ ok: true, provenance: { query: submitted } });
  });

  it('accepts a bare echoed query string equal to the exact submitted text', () => {
    expect(validateEchoedQuery({ query: submitted }, expected)).toEqual({
      ok: true,
      provenance: { query: submitted },
    });
  });

  it('tolerates provider-owned extra members beside the echoed query', () => {
    expect(validateEchoedQuery(
      {
        hogql: 'SELECT event, count() FROM events',
        query: { kind: INDEPENDENT_QUERY_KIND, query: submitted, name: 'haoo-funnel' },
        results: [],
      },
      expected,
    )).toEqual({ ok: true, provenance: { query: submitted } });
  });

  it.each([
    ['a non-object body', 'not-an-object' as unknown],
    ['a null body', null as unknown],
    ['an array body', [] as unknown],
    ['a body carrying neither echo shape', {} as unknown],
    // `hogql` is the provider's compiled rewriting of the submitted text, not the
    // submitted text, so it can never stand in for the echo this report checks.
    ['a body echoing only the compiled hogql', { hogql: submitted } as unknown],
    ['a null echo', { query: null } as unknown],
    ['a numeric echo', { query: 7 } as unknown],
    ['an echoed object with no query text', { query: { kind: INDEPENDENT_QUERY_KIND } } as unknown],
    [
      'an echoed object with a non-string query text',
      { query: { kind: INDEPENDENT_QUERY_KIND, query: ['x'] } } as unknown,
    ],
    [
      'an echoed object declaring another query kind',
      { query: { kind: 'EventsQuery', query: submitted } } as unknown,
    ],
    // The equivalent of the previous provider's wrong-dimension refusal: the response
    // answered a question this report did not ask.
    [
      'an echoed query that is not the one submitted',
      { query: { kind: INDEPENDENT_QUERY_KIND, query: submitted.replace('event', 'uuid') } } as unknown,
    ],
    ['an echoed query differing only by whitespace', { query: `${submitted} ` } as unknown],
    [
      'an echoed query differing only by an internal newline',
      { query: submitted.replace('\n', ' ') } as unknown,
    ],
  ])('rejects %s', (_label, body) => {
    expect(validateEchoedQuery(body, expected)).toEqual({ ok: false, reason: 'invalid' });
  });
});

/** In-memory capability so a document contract never touches the real filesystem. */
function memoryFs() {
  const files = new Map<string, string>();
  const fs: ReportFs = {
    mkdirSync: () => {},
    reserveTempSync: (path) => {
      if (files.has(path)) throw new Error(`already exists ${path}`);
      files.set(path, '');
    },
    writeFileSync: (path, data) => {
      files.set(path, data);
    },
    renameSync: (from, to) => {
      const data = files.get(from);
      if (data === undefined) throw new Error(`missing ${from}`);
      files.delete(from);
      files.set(to, data);
    },
    rmSync: (path) => {
      files.delete(path);
    },
  };

  return { fs, files };
}

const OUTPUT_PATH = '/virtual/.reports/haoo-funnel-report.html';

function generateOptions(
  fetchImpl: ReportFetch,
  fs: ReportFs,
  outputPath: string = OUTPUT_PATH,
) {
  return {
    query: {
      endpoint: FIXTURE_ENDPOINT,
      apiKey: FIXTURE_API_KEY,
      projectId: FIXTURE_PROJECT_ID,
    },
    fetch: fetchImpl,
    now: () => new Date('2026-03-01T09:30:00.000Z'),
    fs,
    outputPath,
  };
}

describe('report dictionary', () => {
  it('is exhaustive against the Phase 3 closed event tuple in both directions', () => {
    expect([...HAOO_REPORT_EVENTS].sort()).toEqual([...HAOO_MEASUREMENT_EVENTS].sort());
    for (const event of HAOO_MEASUREMENT_EVENTS) {
      expect(HAOO_REPORT_EVENTS, event).toContain(event);
    }
    for (const event of HAOO_REPORT_EVENTS) {
      expect([...HAOO_MEASUREMENT_EVENTS] as string[], event).toContain(event);
    }
  });

  it('preserves the Phase 3 tuple order', () => {
    expect([...HAOO_REPORT_EVENTS]).toEqual([...HAOO_MEASUREMENT_EVENTS]);
  });

  it.each(EVENT_LABEL_TABLE)(
    'maps $event to stage $stage with the literal label $label',
    ({ event, stage, label }) => {
      expect(reportLabel(event)).toBe(label);
      expect(stageOf(event)).toBe(stage);
    },
  );

  it('places every event in exactly one stage and lists no event twice', () => {
    const listed = REPORT_STAGE_ORDER.flatMap((stage) => [...REPORT_STAGES[stage].events]);
    expect([...listed].sort()).toEqual([...HAOO_REPORT_EVENTS].sort());
    expect(new Set(listed).size).toBe(listed.length);
  });

  it('renders the four locked stage labels in the locked order', () => {
    expect([...REPORT_STAGE_ORDER]).toEqual([
      'discovery',
      'brochure-interest',
      'qualification',
      'assisted-and-self-onboarding',
    ]);
    for (const stage of REPORT_STAGE_ORDER) {
      expect(REPORT_STAGES[stage].label).toBe(STAGE_LABELS[stage]);
      expect(REPORT_STAGES[stage].clarifier.length).toBeGreaterThan(0);
    }
  });

  it('sums a stage total from the literal counts inside that stage only', () => {
    const counts = Object.fromEntries(
      HAOO_REPORT_EVENTS.map((event, index) => [event, index + 1]),
    );

    expect(stageTotals('discovery', counts)).toBe(1);
    expect(stageTotals('brochure-interest', counts)).toBe(2 + 3 + 4);
    expect(stageTotals('qualification', counts)).toBe(5 + 6);
    expect(stageTotals('assisted-and-self-onboarding', counts)).toBe(7 + 8 + 9 + 10);
  });
});

describe('period windows and change values', () => {
  it('returns an inclusive current window and a non-overlapping previous window', () => {
    expect(periodWindows(30, '2026-03-01')).toEqual({
      current: { start: '2026-01-31', end: '2026-03-01' },
      previous: { start: '2026-01-01', end: '2026-01-30' },
    });
  });

  it('returns the documented 7-day windows', () => {
    expect(periodWindows(7, '2026-03-01')).toEqual({
      current: { start: '2026-02-23', end: '2026-03-01' },
      previous: { start: '2026-02-16', end: '2026-02-22' },
    });
  });

  it.each([
    { current: 10, previous: 4, days: 30, expected: '+6 vs previous 30 days' },
    { current: 4, previous: 10, days: 30, expected: '−6 vs previous 30 days' },
    { current: 7, previous: 7, days: 7, expected: 'No change vs previous 7 days' },
    { current: 0, previous: 0, days: 90, expected: 'No change vs previous 90 days' },
  ])('renders $expected', ({ current, previous, days, expected }) => {
    expect(deltaLabel(current, previous, days)).toBe(expected);
  });

  it('never renders a plus-zero change and never renders a ratio', () => {
    for (const days of [7, 30, 90]) {
      for (let value = 0; value <= 3; value += 1) {
        const label = deltaLabel(value, value, days);
        expect(label).not.toContain('+0');
        expect(label).not.toContain('%');
      }
    }
  });
});

describe('parseGoalCounts', () => {
  const allowed = HAOO_REPORT_EVENTS;
  const columns = [...INDEPENDENT_HOGQL_COLUMNS];

  it('zero-fills every allowlisted goal absent from the response', () => {
    const parsed = parseGoalCounts(goalRows({ haoo_page_view: 5 }), allowed);

    expect(parsed).not.toBeNull();
    expect(Object.keys(parsed ?? {}).sort()).toEqual([...allowed].sort());
    expect(parsed?.haoo_page_view).toBe(5);
    expect(parsed?.haoo_self_onboarding).toBe(0);
  });

  it('accepts an empty result set as an all-zero period', () => {
    const parsed = parseGoalCounts({ columns, results: [] }, allowed);

    expect(parsed).not.toBeNull();
    expect(Object.keys(parsed ?? {})).toHaveLength(allowed.length);
    expect(Object.values(parsed ?? {}).every((count) => count === 0)).toBe(true);
  });

  it('reads rows positionally and in the fixed allowlist order, not the row order', () => {
    // The provider orders its own rows; the report's order is the allowlist's.
    const parsed = parseGoalCounts(
      { columns, results: [['haoo_self_onboarding', 6], ['haoo_page_view', 5]] },
      allowed,
    );

    expect(Object.keys(parsed ?? {})).toEqual([...allowed]);
    expect(parsed?.haoo_page_view).toBe(5);
    expect(parsed?.haoo_self_onboarding).toBe(6);
  });

  it.each([
    { label: 'non-object body', body: 'not-json' as unknown },
    { label: 'null body', body: null as unknown },
    { label: 'array body', body: [] as unknown },
    { label: 'missing columns', body: { results: [] } as unknown },
    { label: 'non-array columns', body: { columns: 'event', results: [] } as unknown },
    { label: 'short columns', body: { columns: ['event'], results: [] } as unknown },
    {
      label: 'long columns',
      body: { columns: [...columns, 'extra'], results: [] } as unknown,
    },
    {
      label: 'renamed column',
      body: { columns: ['event', 'count'], results: [] } as unknown,
    },
    // A reordered projection would otherwise swap the name and the count and parse
    // cleanly into wrong numbers, so the pair is asserted for exact equality.
    {
      label: 'reordered column pair',
      body: { columns: [...columns].reverse(), results: [] } as unknown,
    },
    { label: 'missing results', body: { columns, meta: {} } as unknown },
    { label: 'non-array results', body: { columns, results: {} } as unknown },
    { label: 'non-array row', body: { columns, results: ['x'] } as unknown },
    { label: 'object row', body: { columns, results: [{ event: 'x' }] } as unknown },
    {
      label: 'short row',
      body: { columns, results: [['haoo_page_view']] } as unknown,
    },
    {
      label: 'long row',
      body: { columns, results: [['haoo_page_view', 1, 'extra']] } as unknown,
    },
    {
      label: 'unknown goal',
      body: { columns, results: [['haoo_unknown_event', 1]] } as unknown,
    },
    {
      label: 'duplicate goal',
      body: {
        columns,
        results: [['haoo_page_view', 1], ['haoo_page_view', 2]],
      } as unknown,
    },
    { label: 'non-integer count', body: { columns, results: [['haoo_page_view', 1.5]] } as unknown },
    { label: 'negative count', body: { columns, results: [['haoo_page_view', -1]] } as unknown },
    {
      label: 'non-finite count',
      body: { columns, results: [['haoo_page_view', Number.POSITIVE_INFINITY]] } as unknown,
    },
    { label: 'string count', body: { columns, results: [['haoo_page_view', '4']] } as unknown },
    {
      label: 'non-string goal',
      body: { columns, results: [[7, 1]] } as unknown,
    },
  ])('returns null for a $label', ({ body }) => {
    expect(parseGoalCounts(body, allowed)).toBeNull();
  });
});

describe('escapeHtml', () => {
  it.each([
    { raw: '&', expected: '&amp;' },
    { raw: '<', expected: '&lt;' },
    { raw: '>', expected: '&gt;' },
    { raw: '"', expected: '&quot;' },
    { raw: "'", expected: '&#39;' },
    { raw: '<script>alert(1)</script>', expected: '&lt;script&gt;alert(1)&lt;/script&gt;' },
  ])('escapes $raw', ({ raw, expected }) => {
    expect(escapeHtml(raw)).toBe(expected);
  });
});

describe('renderReport', () => {
  const model: ReportModel = {
    title: 'HAOO funnel report',
    generatedAt: '2026-03-01T09:30:00.000Z',
    timezone: 'Africa/Nairobi',
    projectScope: FIXTURE_PROJECT_ID,
    periods: [
      {
        id: 'last-30-days',
        days: 30,
        label: 'Last 30 days',
        heading: 'Last 30 days · 2026-01-31 to 2026-03-01',
        comparisonLine:
          'Compared with the previous 30 days, 2026-01-01 to 2026-01-30.',
        window: { start: '2026-01-31', end: '2026-03-01' },
        empty: false,
        counts: Object.fromEntries(HAOO_REPORT_EVENTS.map((event) => [event, 1])),
        previousCounts: Object.fromEntries(HAOO_REPORT_EVENTS.map((event) => [event, 0])),
      },
    ],
  };

  it('emits one self-contained document with no script and no external resource', () => {
    const html = renderReport(model);

    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<title>');
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html.match(/<style[\s>]/g)).toHaveLength(1);
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<link');
    expect(html).not.toContain('<img');
    expect(html).not.toMatch(/@import|https?:\/\//);
  });

  it('escapes every interpolated value', () => {
    const html = renderReport({ ...model, timezone: '<script>x</script>' });

    expect(html).not.toContain('<script');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('generateHaooReport', () => {
  it('writes a document carrying every literal event label and stage label', async () => {
    const { fetchSpy } = stubFetch([FIXTURE_CURRENT, FIXTURE_PREVIOUS]);
    const { fs, files } = memoryFs();

    const result = await generateHaooReport(generateOptions(fetchSpy, fs));

    expect(result.ok).toBe(true);
    const html = files.get(OUTPUT_PATH) ?? '';
    expect(html.length).toBeGreaterThan(0);

    for (const row of EVENT_LABEL_TABLE) {
      expect(html, row.label).toContain(row.label);
    }
    for (const stage of REPORT_STAGE_ORDER) {
      expect(html, STAGE_LABELS[stage]).toContain(STAGE_LABELS[stage]);
    }
    expect(html).not.toContain('<script');
  });

  it('never writes the credential, the Authorization header, or an event identifier', async () => {
    const { fetchSpy } = stubFetch([FIXTURE_CURRENT, FIXTURE_PREVIOUS]);
    const { fs, files } = memoryFs();

    await generateHaooReport(generateOptions(fetchSpy, fs));
    const html = files.get(OUTPUT_PATH) ?? '';

    expect(html).not.toContain(FIXTURE_API_KEY);
    expect(html).not.toContain('Authorization');
    expect(html).not.toContain('Bearer');
    for (const event of HAOO_REPORT_EVENTS) {
      expect(html, event).not.toContain(event);
    }
  });

  it('renders no banned vocabulary and no percentage figure', async () => {
    const { fetchSpy } = stubFetch([FIXTURE_CURRENT, FIXTURE_PREVIOUS]);
    const { fs, files } = memoryFs();

    await generateHaooReport(generateOptions(fetchSpy, fs));
    const text = documentText(files.get(OUTPUT_PATH) ?? '');

    for (const term of BANNED_REPORT_VOCABULARY) {
      expect(text.toLowerCase(), term).not.toMatch(
        new RegExp(`\\b${term.replace(/[-]/g, '\\-')}\\b`),
      );
    }
    expect(text).not.toContain('%');
  });

  it('passes the credential only in the Authorization header and submits one named HogQL query', async () => {
    const { fetchSpy, calls } = stubFetch([FIXTURE_CURRENT, FIXTURE_PREVIOUS]);
    const { fs } = memoryFs();

    await generateHaooReport(generateOptions(fetchSpy, fs));

    expect(calls.length).toBeGreaterThanOrEqual(2);
    for (const call of calls) {
      expect(call.url).toBe(FIXTURE_ENDPOINT);
      expect(call.headers.Authorization).toBe(`Bearer ${FIXTURE_API_KEY}`);
      expect(call.body).not.toContain(FIXTURE_API_KEY);
      expect(call.body).not.toContain('91d');

      const body = JSON.parse(call.body) as {
        query?: { kind?: unknown; query?: unknown };
        name?: unknown;
      };
      expect(body.query?.kind).toBe(INDEPENDENT_QUERY_KIND);
      expect(typeof body.query?.query).toBe('string');
      // A descriptive name so a query the owner finds in the provider's own activity log
      // is identifiable as this report's rather than anonymous.
      expect(typeof body.name).toBe('string');
      expect((body.name as string).length).toBeGreaterThan(0);
    }
  });

  /**
   * The counts must be the provider's answer over the events it holds, never this
   * project's arithmetic over rows it fetched. One aggregate per range is what makes the
   * report's numbers the provider's claim rather than this repository's.
   */
  it('aggregates in the query rather than fetching rows to count locally', async () => {
    const { fetchSpy, calls } = stubFetch([FIXTURE_CURRENT, FIXTURE_PREVIOUS]);
    const { fs } = memoryFs();

    await generateHaooReport(generateOptions(fetchSpy, fs));

    for (const call of calls) {
      const sql = submittedSqlOf(call);
      expect(sql).toMatch(/count\(\)|min\(timestamp\)/);
      expect(sql).toContain('LIMIT ');
      expect(sql).not.toContain('OFFSET');
      expect(sql).not.toContain('SELECT *');
    }
  });

  /**
   * Deriving "today" in UTC would place a run made between midnight and 03:00 in
   * Nairobi on the previous calendar day, so the report would name a window the
   * provider did not aggregate. 22:00Z on 1 March is already 2 March in Africa/Nairobi.
   */
  it('derives the inclusive window from the reporting timezone, not from UTC', async () => {
    const marchSecondQueries: readonly SubmittedQuery[] = [
      { start: '2026-02-24', end: '2026-03-02' },
      { start: '2026-02-17', end: '2026-02-23' },
      { start: '2026-02-01', end: '2026-03-02' },
      { start: '2026-01-02', end: '2026-01-31' },
      { start: '2025-12-03', end: '2026-03-02' },
      { start: '2025-09-04', end: '2025-12-02' },
      'all',
      'first-day',
    ];
    const { fetchSpy, calls } = stubFetch(
      [FIXTURE_CURRENT, FIXTURE_PREVIOUS],
      marchSecondQueries,
    );
    const { fs } = memoryFs();

    // Every echo below is validated against this independent list, so a single wrong
    // boundary aborts the run and leaves the later calls unmade.
    const result = await generateHaooReport({
      ...generateOptions(fetchSpy, fs),
      now: () => new Date('2026-03-01T22:00:00.000Z'),
    });

    expect(result.ok).toBe(true);
    expect(submittedSqlOf(calls[0])).toContain("toDate('2026-02-24')");
    expect(submittedSqlOf(calls[0])).toContain("toDate('2026-03-02')");
    expect(submittedSqlOf(calls[2])).toContain("toDate('2026-02-01')");
    expect(submittedSqlOf(calls[3])).toContain("toDate('2026-01-02')");
    expect(submittedSqlOf(calls[3])).toContain("toDate('2026-01-31')");
  });

  /**
   * The day boundary is pinned inside the submitted SQL rather than checked against a
   * remote setting, so the provider cannot disagree with the report about which day an
   * action falls in. Both bounds are inclusive: an action on the first day and one on the
   * last day are both counted, and one step outside either bound is not.
   */
  it('pins the reporting timezone inside the query and compares both bounds inclusively', async () => {
    const { fetchSpy, calls } = stubFetch([FIXTURE_CURRENT, FIXTURE_PREVIOUS]);
    const { fs } = memoryFs();

    await generateHaooReport(generateOptions(fetchSpy, fs));
    const sql = submittedSqlOf(calls[0]);

    expect(sql).toContain(`toTimeZone(timestamp, '${INDEPENDENT_TIMEZONE}')`);
    expect(sql).toContain(">= toDate('2026-02-23')");
    expect(sql).toContain("<= toDate('2026-03-01')");
    expect(sql).not.toContain("> toDate('2026-02-23')\n");
    expect(sql).toBe(independentSql({ start: '2026-02-23', end: '2026-03-01' }));
  });

  it.each([
    { label: 'empty api key', apiKey: '', projectId: FIXTURE_PROJECT_ID },
    { label: 'blank api key', apiKey: '   ', projectId: FIXTURE_PROJECT_ID },
    { label: 'empty project id', apiKey: FIXTURE_API_KEY, projectId: '' },
  ])('refuses to run and issues no request for an $label', async ({ apiKey, projectId }) => {
    const { fetchSpy } = stubFetch([FIXTURE_CURRENT]);
    const { fs, files } = memoryFs();

    const result = await generateHaooReport({
      ...generateOptions(fetchSpy, fs),
      query: { endpoint: FIXTURE_ENDPOINT, apiKey, projectId },
    });

    expect(result.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(files.size).toBe(0);
  });

  it('writes nothing when the provider response fails validation', async () => {
    const { fetchSpy } = stubFetch([
      { columns: [...INDEPENDENT_HOGQL_COLUMNS], results: [['nope', 1]] },
    ]);
    const { fs, files } = memoryFs();

    const result = await generateHaooReport(generateOptions(fetchSpy, fs));

    expect(result.ok).toBe(false);
    expect(files.size).toBe(0);
  });

  it('leaves the filesystem untouched when the echo is not the query this report submitted', async () => {
    const mismatched = {
      ...FIXTURE_CURRENT,
      query: { query: independentSql({ start: '2026-02-23', end: '2026-02-28' }) },
    };
    const { fetchSpy } = stubFetch([mismatched]);
    const { fs, files } = memoryFs();

    const result = await generateHaooReport(generateOptions(fetchSpy, fs));

    expect(result).toEqual({ ok: false, reason: 'invalid-current-7' });
    expect(files.size).toBe(0);
  });

  it('gives every provider request an abort budget rather than letting the run hang forever', async () => {
    // Node's fetch has no default timeout, so an unbudgeted request wedges the whole
    // owner command with no output at all.
    const { fetchSpy, calls } = stubFetch([FIXTURE_CURRENT]);
    const { fs } = memoryFs();

    const result = await generateHaooReport(generateOptions(fetchSpy, fs));

    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(8);
    for (const call of calls) {
      expect(call.signal).toBeInstanceOf(AbortSignal);
      // The budget outlives the request it guards and is cleared once it settles.
      expect(call.signal?.aborted).toBe(false);
    }
  });

  it('leaves a previous report byte-identical and leaves no temp file when a query rejects', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'haoo-report-'));
    const outputPath = join(directory, 'haoo-funnel-report.html');
    const sentinel = '<!doctype html><html lang="en"><body>previous report</body></html>';
    writeFileSync(outputPath, sentinel, 'utf8');
    const before = readFileSync(outputPath);

    const rejecting = vi.fn<ReportFetch>(async () => {
      throw new Error('network refused');
    });
    const { fs } = memoryFs();

    try {
      const result = await generateHaooReport(
        generateOptions(rejecting, fs, outputPath),
      );

      expect(result.ok).toBe(false);
      expect(readFileSync(outputPath).equals(before)).toBe(true);
      expect(existsSync(`${outputPath}.tmp`)).toBe(false);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('removes its real temporary sibling and preserves the previous report when rename fails', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'haoo-report-rename-'));
    const outputPath = join(directory, 'haoo-funnel-report.html');
    const sentinel = '<!doctype html><html lang="en"><body>previous report</body></html>';
    writeFileSync(outputPath, sentinel, 'utf8');
    const before = readFileSync(outputPath);
    const { fetchSpy } = stubFetch([FIXTURE_CURRENT, FIXTURE_PREVIOUS]);
    const realFs = {
      mkdirSync: () => {},
      reserveTempSync: (path: string) => closeSync(openSync(path, 'wx')),
      writeFileSync,
      renameSync: () => {
        throw new Error('rename refused');
      },
      rmSync: (path: string, options: { readonly force: true }) => rmSync(path, options),
    };

    try {
      const result = await generateHaooReport(generateOptions(fetchSpy, realFs, outputPath));

      expect(result).toEqual({ ok: false, reason: 'generation-failed' });
      expect(readFileSync(outputPath).equals(before)).toBe(true);
      expect(existsSync(`${outputPath}.tmp`)).toBe(false);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('removes an owned temporary sibling after a partial write throws', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'haoo-report-write-'));
    const outputPath = join(directory, 'haoo-funnel-report.html');
    const sentinel = '<!doctype html><html lang="en"><body>previous report</body></html>';
    writeFileSync(outputPath, sentinel, 'utf8');
    const before = readFileSync(outputPath);
    const { fetchSpy } = stubFetch([FIXTURE_CURRENT, FIXTURE_PREVIOUS]);
    const realFs = {
      mkdirSync: () => {},
      reserveTempSync: (path: string) => closeSync(openSync(path, 'wx')),
      writeFileSync: (path: string, data: string) => {
        writeFileSync(path, data.slice(0, 64), 'utf8');
        throw new Error('disk full');
      },
      renameSync,
      rmSync: (path: string, options: { readonly force: true }) => rmSync(path, options),
    };

    try {
      const result = await generateHaooReport(generateOptions(fetchSpy, realFs, outputPath));

      expect(result).toEqual({ ok: false, reason: 'generation-failed' });
      expect(readFileSync(outputPath).equals(before)).toBe(true);
      expect(existsSync(`${outputPath}.tmp`)).toBe(false);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('fails a concurrent loser closed without deleting the active invocation temporary file', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'haoo-report-concurrent-'));
    const outputPath = join(directory, 'haoo-funnel-report.html');
    const temporaryPath = `${outputPath}.tmp`;
    const activeBytes = 'active invocation owns this file';
    writeFileSync(temporaryPath, activeBytes, 'utf8');
    const { fetchSpy } = stubFetch([FIXTURE_CURRENT, FIXTURE_PREVIOUS]);
    const realFs = {
      mkdirSync: () => {},
      reserveTempSync: (path: string) => closeSync(openSync(path, 'wx')),
      writeFileSync,
      renameSync,
      rmSync: (path: string, options: { readonly force: true }) => rmSync(path, options),
    };

    try {
      const result = await generateHaooReport(generateOptions(fetchSpy, realFs, outputPath));

      // Named, not folded into the generic reason: a leftover sibling can never be
      // fixed by checking the API key, and the owner cannot guess the path otherwise.
      expect(result).toEqual({
        ok: false,
        reason: `temp-path-in-use:${temporaryPath}`,
      });
      expect(readFileSync(temporaryPath, 'utf8')).toBe(activeBytes);
      expect(existsSync(outputPath)).toBe(false);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('keeps the primary generation failure when owned-temp cleanup also fails', async () => {
    const { fetchSpy } = stubFetch([FIXTURE_CURRENT, FIXTURE_PREVIOUS]);
    const fs: ReportFs = {
      mkdirSync: () => {},
      reserveTempSync: () => {},
      writeFileSync: () => {
        throw new Error('primary write failure');
      },
      renameSync: () => {},
      rmSync: () => {
        throw new Error('secondary cleanup failure');
      },
    };

    await expect(generateHaooReport(generateOptions(fetchSpy, fs))).resolves.toEqual({
      ok: false,
      reason: 'generation-failed',
    });
  });
});

/**
 * WR-01: the documented owner command builds its destination with Node's platform-native
 * `resolve`, so on a non-POSIX host the path arrives separated by backslashes. A parser
 * that looks for a forward slash only extracts no directory at all, skips creation, and a
 * first run fails before it can write. The table below pins the extraction contract for
 * every destination shape the CLI can hand over, and pins that whenever a directory is
 * created it is created strictly before the temporary sibling is exclusively reserved —
 * creating it afterwards would reserve into a directory that does not exist yet.
 */
const DIRECTORY_EXTRACTION_TABLE = [
  {
    label: 'POSIX nested destination',
    outputPath: '/virtual/.reports/haoo-funnel-report.html',
    expectedDirectory: '/virtual/.reports',
  },
  {
    label: 'Windows-style destination',
    outputPath: 'C:\\project\\.reports\\haoo-funnel-report.html',
    expectedDirectory: 'C:\\project\\.reports',
  },
  {
    label: 'bare filename destination',
    outputPath: 'haoo-funnel-report.html',
    expectedDirectory: null,
  },
  {
    label: 'POSIX root-level destination',
    outputPath: '/haoo-funnel-report.html',
    expectedDirectory: null,
  },
  {
    label: 'drive-root destination',
    outputPath: 'C:\\haoo-funnel-report.html',
    expectedDirectory: null,
  },
  {
    label: 'POSIX destination whose filename contains a backslash',
    outputPath: '/home/u/.reports/re\\port.html',
    expectedDirectory: '/home/u/.reports',
  },
  {
    label: 'relative POSIX destination whose filename contains a backslash',
    outputPath: 'out\\report.html',
    expectedDirectory: null,
  },
  {
    label: 'mixed-separator destination under a drive designator',
    outputPath: 'c:/project/.reports/haoo.html',
    expectedDirectory: 'c:/project/.reports',
  },
  {
    label: 'bare UNC server root destination',
    outputPath: '\\\\server\\haoo.html',
    expectedDirectory: null,
  },
  {
    label: 'UNC share root destination',
    outputPath: '\\\\server\\share\\haoo.html',
    expectedDirectory: null,
  },
  {
    label: 'destination nested below a UNC share',
    outputPath: '\\\\server\\share\\.reports\\haoo.html',
    expectedDirectory: '\\\\server\\share\\.reports',
  },
  {
    label: 'drive-relative destination',
    outputPath: 'C:haoo.html',
    expectedDirectory: null,
  },
] as const;

interface RecordedCall {
  readonly op: string;
  readonly args: readonly unknown[];
}

/**
 * An in-memory capability that also records the ordered call log, so a contract can assert
 * both the exact directory argument and its position relative to the reservation.
 */
function recordingFs() {
  const calls: RecordedCall[] = [];
  const files = new Map<string, string>();
  const fs: ReportFs = {
    mkdirSync: (path, options) => {
      calls.push({ op: 'mkdirSync', args: [path, options] });
    },
    reserveTempSync: (path) => {
      calls.push({ op: 'reserveTempSync', args: [path] });
      if (files.has(path)) throw new Error(`already exists ${path}`);
      files.set(path, '');
    },
    writeFileSync: (path, data) => {
      calls.push({ op: 'writeFileSync', args: [path] });
      files.set(path, data);
    },
    renameSync: (from, to) => {
      calls.push({ op: 'renameSync', args: [from, to] });
      const data = files.get(from);
      if (data === undefined) throw new Error(`missing ${from}`);
      files.delete(from);
      files.set(to, data);
    },
    rmSync: (path) => {
      calls.push({ op: 'rmSync', args: [path] });
      files.delete(path);
    },
  };

  return { fs, calls, files };
}

describe('report output directory extraction', () => {
  it.each(DIRECTORY_EXTRACTION_TABLE)(
    'creates the expected directory for the $label',
    async ({ outputPath, expectedDirectory }) => {
      const { fetchSpy } = stubFetch([FIXTURE_CURRENT, FIXTURE_PREVIOUS]);
      const { fs, calls, files } = recordingFs();

      const result = await generateHaooReport(generateOptions(fetchSpy, fs, outputPath));

      expect(result).toEqual({ ok: true, outputPath });
      expect((files.get(outputPath) ?? '').length).toBeGreaterThan(0);

      const directoryCalls = calls.filter((call) => call.op === 'mkdirSync');

      if (expectedDirectory === null) {
        expect(directoryCalls).toEqual([]);
        return;
      }

      expect(directoryCalls).toEqual([
        { op: 'mkdirSync', args: [expectedDirectory, { recursive: true }] },
      ]);

      const directoryIndex = calls.findIndex((call) => call.op === 'mkdirSync');
      const reservationIndex = calls.findIndex((call) => call.op === 'reserveTempSync');

      expect(reservationIndex).toBeGreaterThan(-1);
      expect(directoryIndex).toBeLessThan(reservationIndex);
    },
  );
});

describe('credential and provider-origin boundary', () => {
  /**
   * Each pattern is derived from the source that already owns it, so this assertion
   * cannot drift from the 04-05 source scan it protects (threat T-04-02).
   */
  it('keeps the analytics origin, the query path, and the credential name out of src/', () => {
    const boundarySuite = readFileSync(
      resolve(ROOT, 'src/test/build-output.test.ts'),
      'utf8',
    );
    const originSource = boundarySuite.match(
      /PROVIDER_INGESTION_HOST_SOURCE_FORBIDDEN\s*=\s*\[\/([^/\n]+)\/i\]/,
    )?.[1];
    expect(originSource, 'provider ingestion-host pattern in build-output.test.ts')
      .toBeTruthy();

    // The endpoint is assembled from a named origin and a named path around the project
    // id, so both halves are read from the constants that own them rather than from a
    // single literal the CLI no longer has.
    const cli = readFileSync(resolve(ROOT, 'scripts/generate-haoo-report.mjs'), 'utf8');
    const origin = cli.match(/QUERY_API_ORIGIN = '(https:\/\/[^']+)'/)?.[1];
    expect(origin, 'origin literal in the credentialed CLI').toBeTruthy();
    const queryPath = cli.match(/QUERY_API_PATH_PREFIX = '([^']+)'/)?.[1];
    expect(queryPath, 'query path literal in the credentialed CLI').toBeTruthy();
    const credentialName = cli.match(/process\.env\.([A-Z0-9_]*API_KEY)/)?.[1];
    expect(credentialName, 'credential variable name in the credentialed CLI').toBeTruthy();

    const generate = readFileSync(resolve(ROOT, 'src/reporting/generate.ts'), 'utf8');

    expect(generate).not.toMatch(new RegExp(originSource ?? 'never-matched-origin', 'i'));
    expect(generate).not.toContain(new URL(origin ?? 'https://example.invalid').hostname);
    expect(generate).not.toContain(queryPath ?? '/api/projects/');
    expect(generate).not.toContain(credentialName ?? 'NEVER_MATCHED_API_KEY');
  });

  it('rule-checks the credentialed script and every other non-browser module', async () => {
    // Asserted through ESLint's own config resolution rather than by pinning a glob
    // literal: what matters is that these files actually receive rules, not how the
    // block that supplies them happens to be spelled. Before this was enforced, the
    // root build-config modules and the .mjs test preload were parsed by `eslint .`
    // and checked against nothing at all.
    const { ESLint } = await import('eslint');
    const eslint = new ESLint({ cwd: ROOT });

    for (const file of [
      'scripts/generate-haoo-report.mjs',
      'scripts/verify-phase4-coverage.mjs',
      'src/test/fixtures/haoo-report-cli-fetch-preload.mjs',
      'eslint.config.js',
      'postcss.config.js',
      'tailwind.config.js',
    ]) {
      const resolved = await eslint.calculateConfigForFile(resolve(ROOT, file));

      expect(Object.keys(resolved.rules ?? {}).length, `${file} receives no rules`)
        .toBeGreaterThan(0);
      // `no-undef` is the rule that catches a typo'd global, and it only helps if the
      // Node globals are declared — the browser set above would flag `process` itself.
      expect(resolved.rules?.['no-undef'], `${file} does not enable no-undef`).toBeTruthy();
      expect(resolved.languageOptions?.globals, `${file} lacks Node globals`)
        .toHaveProperty('process');
    }
  });

  it('lets terminal diagnostics flush before exiting with a failure status', () => {
    const cli = readFileSync(resolve(ROOT, 'scripts/generate-haoo-report.mjs'), 'utf8');

    expect(cli).toContain('writeSync(process.stderr.fd');
    expect(cli).toContain('process.exitCode = 1');
    expect(cli).not.toContain('process.exit(');
  });
});

describe('credentialed CLI', () => {
  const secret = 'secret-header-sentinel-never-render';

  /**
   * Numeric like a real project id and unlike anything else the document can produce, so
   * the single-occurrence assertion below means what it says.
   */
  const project = '70707';

  /** The CLI source, read once — it is the only module that names the removed variables. */
  const cliSource = readFileSync(resolve(ROOT, 'scripts/generate-haoo-report.mjs'), 'utf8');

  /**
   * The removed-name table read out of the module that owns it.
   *
   * The pairs are deliberately NOT restated here: this suite asserts the CLI's behaviour
   * on a stale environment, and every other file in the repository is being cleared of
   * the previous provider's names. Naming them a second time here would put the literal
   * back into a tree the migration is emptying, for no assertion this reading does not
   * already make.
   */
  const removedVariablePairs = [
    ...(cliSource.match(/REMOVED_VARIABLES = \[[\s\S]*?\n\];/)?.[0] ?? '')
      .matchAll(/\['([A-Z0-9_]+)', '([A-Z0-9_]+)'\]/g),
  ].map(([, removed, replacement]) => ({ removed, replacement }));

  function runCli(environment: Readonly<Record<string, string | undefined>>) {
    const directory = mkdtempSync(join(tmpdir(), 'haoo-report-cli-'));
    const scriptsDirectory = join(directory, 'scripts');
    mkdirSync(scriptsDirectory);
    copyFileSync(
      resolve(ROOT, 'scripts/generate-haoo-report.mjs'),
      join(scriptsDirectory, 'generate-haoo-report.mjs'),
    );
    symlinkSync(resolve(ROOT, 'src'), join(directory, 'src'), 'dir');
    const auditPath = join(directory, 'audit.json');
    const preloadPath = resolve(ROOT, 'src/test/fixtures/haoo-report-cli-fetch-preload.mjs');
    const result = spawnSync(
      process.execPath,
      ['--import', preloadPath, join(scriptsDirectory, 'generate-haoo-report.mjs')],
      {
        cwd: directory,
        encoding: 'utf8',
        env: { HAOO_REPORT_CLI_AUDIT_PATH: auditPath, ...environment },
      },
    );
    const audit = JSON.parse(readFileSync(auditPath, 'utf8')) as {
      readonly count: number;
      readonly urls: readonly string[];
    };

    return {
      directory,
      outputPath: join(directory, '.reports/haoo-funnel-report.html'),
      result,
      audit,
    };
  }

  it.each([
    {
      label: 'both variables',
      environment: {},
      missing: ['POSTHOG_QUERY_API_KEY', 'POSTHOG_PROJECT_ID'],
      supplied: '',
    },
    {
      label: 'only the API key',
      environment: { POSTHOG_QUERY_API_KEY: secret },
      missing: ['POSTHOG_PROJECT_ID'],
      supplied: secret,
    },
    {
      label: 'only the project id',
      environment: { POSTHOG_PROJECT_ID: project },
      missing: ['POSTHOG_QUERY_API_KEY'],
      supplied: project,
    },
  ])('names exactly the missing variable names with $label absent', ({ environment, missing, supplied }) => {
    const execution = runCli(environment);

    try {
      expect(execution.result.status).toBe(1);
      expect(execution.result.stderr).toContain(
        `Missing required environment variables: ${missing.join(', ')}`,
      );
      expect(execution.result.stderr).toContain(ERROR_STATE_SENTENCE);
      if (supplied !== '') {
        expect(execution.result.stdout).not.toContain(supplied);
        expect(execution.result.stderr).not.toContain(supplied);
      }
      expect(execution.audit).toEqual({ count: 0, urls: [] });
      expect(existsSync(execution.outputPath)).toBe(false);
    } finally {
      rmSync(execution.directory, { recursive: true, force: true });
    }
  });

  /**
   * The project id is the only environment value that shapes the URL the API key travels
   * to, so a shape check is a credential boundary rather than a tidiness rule.
   *
   * Each row is a real way the interpolation could be reshaped: a traversal that reaches a
   * different API on the same host, an absolute URL, a query and a fragment that truncate
   * the intended path, and a bare non-numeric label. The assertion that matters is the
   * audit — `count: 0` means the credential was never put on the wire at all, not merely
   * that the run failed afterwards.
   */
  it.each([
    ['a path traversal to another API', '1/../../users/@me'],
    ['an embedded path segment', '70707/query'],
    ['an absolute URL', 'https://us.posthog.com/api/projects/70707'],
    ['a query string', '70707?refresh=true'],
    ['a fragment', '70707#anchor'],
    ['a non-numeric label', 'haoo-production'],
  ])('refuses a project id carrying %s before any credentialed request', (_label, malformed) => {
    const execution = runCli({
      POSTHOG_QUERY_API_KEY: secret,
      POSTHOG_PROJECT_ID: malformed,
    });

    try {
      expect(execution.result.status).toBe(1);
      expect(execution.result.stderr).toContain('POSTHOG_PROJECT_ID must be the numeric project id');
      expect(execution.result.stderr).toContain(ERROR_STATE_SENTENCE);
      // Neither the credential nor the rejected value is echoed: the rejected value came
      // out of the same shell as the key, and this command echoes nothing it read there.
      expect(execution.result.stdout).not.toContain(secret);
      expect(execution.result.stderr).not.toContain(secret);
      expect(execution.result.stderr).not.toContain(malformed);
      expect(execution.audit).toEqual({ count: 0, urls: [] });
      expect(existsSync(execution.outputPath)).toBe(false);
    } finally {
      rmSync(execution.directory, { recursive: true, force: true });
    }
  });

  it('accepts a numeric project id carrying shell whitespace', () => {
    const execution = runCli({
      POSTHOG_QUERY_API_KEY: secret,
      POSTHOG_PROJECT_ID: `  ${project}\n`,
    });

    try {
      // Trimmed before it reaches the URL, so a heredoc newline is a working id rather
      // than a request to a path with an encoded newline in it.
      expect(execution.result.stderr).not.toContain('POSTHOG_PROJECT_ID must be');
      expect(execution.audit.count).toBeGreaterThan(0);
      for (const url of execution.audit.urls) {
        expect(url).toContain(`/api/projects/${project}/query/`);
        expect(url).not.toMatch(/\s|%0A|%20/u);
      }
    } finally {
      rmSync(execution.directory, { recursive: true, force: true });
    }
  });

  /**
   * A stale environment is the one realistic failure this migration creates: the owner
   * already holds a credential under a name that no longer exists. Reporting the new name
   * as merely missing would point them at creating a credential they may already have,
   * so the message names the rename instead.
   */
  it('finds a removed-variable table naming every renamed input', () => {
    expect(removedVariablePairs.length).toBe(4);
    for (const pair of removedVariablePairs) {
      expect(pair.removed).not.toBe(pair.replacement);
      expect(pair.replacement).toMatch(/POSTHOG/);
    }
  });

  it.each(
    [...Array(4).keys()].map((position) => ({ position })),
  )('names the rename rather than a missing variable for removed variable $position', ({ position }) => {
    const pair = removedVariablePairs[position];
    expect(pair, `removed variable ${position}`).toBeTruthy();

    const execution = runCli({ [pair.removed]: 'stale-value-from-a-previous-provider' });

    try {
      expect(execution.result.status).toBe(1);
      expect(execution.result.stderr).toContain(pair.removed);
      expect(execution.result.stderr).toContain(pair.replacement);
      expect(execution.audit).toEqual({ count: 0, urls: [] });
      expect(existsSync(execution.outputPath)).toBe(false);
      expect(execution.result.stdout).toBe('');
    } finally {
      rmSync(execution.directory, { recursive: true, force: true });
    }
  });

  it('preloads a fixture-only fetch and completes exactly eight requests without leaking secrets', () => {
    const execution = runCli({
      POSTHOG_QUERY_API_KEY: secret,
      POSTHOG_PROJECT_ID: project,
    });

    try {
      const terminal = `${execution.result.stdout}${execution.result.stderr}`;
      const report = readFileSync(execution.outputPath, 'utf8');

      expect(execution.result.status).toBe(0);
      expect(execution.audit.count).toBe(8);
      expect(new Set(execution.audit.urls)).toEqual(
        new Set([`https://us.posthog.com/api/projects/${project}/query/`]),
      );
      expect(terminal).not.toContain(secret);
      expect(report).not.toContain(secret);
      expect(report.match(new RegExp(project, 'g'))).toHaveLength(1);
      expect(terminal).not.toContain('Authorization');
      expect(report).not.toContain('Authorization');
      // The endpoint and the project id are the CLI's alone: neither may reach the
      // document, and the project id reaches it only as the metadata line's named scope.
      expect(report).not.toContain('us.posthog.com');
      expect(terminal).not.toContain('us.posthog.com');
    } finally {
      rmSync(execution.directory, { recursive: true, force: true });
    }
  });

  /**
   * The owner-facing separation: the two report inputs are local process secrets for a
   * manual command, and the browser inputs are deployment variables whose production
   * collection is still deferred. Conflating them is how a query credential ends up in a
   * public bundle.
   *
   * The two owner documents are asserted for the separation itself rather than for the
   * variable names, because the names are migrated by the plan that owns those documents
   * (`04.1-08`) and its own gates pin them there. What this suite owns is the phase's
   * coverage record, which names both report inputs and states the boundary they may
   * never cross.
   */
  it('documents both local report inputs separately from deferred public build inputs', () => {
    const readme = readFileSync(resolve(ROOT, 'README.md'), 'utf8');
    const setup = readFileSync(
      resolve(
        ROOT,
        '.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md',
      ),
      'utf8',
    );
    // Resolved by prefix rather than spelled out: the phase directory name carries the
    // previous provider's name, and this tree is being cleared of that literal.
    const phaseDirectory = readdirSync(resolve(ROOT, '.planning/phases'))
      .find((entry) => entry.startsWith('04.1-')) ?? '';
    expect(phaseDirectory, 'this phase directory').toBeTruthy();
    const coverage = readFileSync(
      resolve(ROOT, '.planning/phases', phaseDirectory, 'COVERAGE.md'),
      'utf8',
    );

    for (const document of [readme, setup]) {
      expect(document).toContain('npm run report:haoo');
      expect(document).toContain('VITE_HAOO_MEASUREMENT_PROVIDER');
      expect(document.toLowerCase()).toContain('production collection');
      expect(document.toLowerCase()).toContain('deferred');
    }

    expect(coverage).toContain('POSTHOG_QUERY_API_KEY');
    expect(coverage).toContain('POSTHOG_PROJECT_ID');
    expect(coverage).toMatch(/local report-process inputs/i);
    expect(coverage).toMatch(/may enter a `VITE_\*` variable or the published bundle/i);
  });
});

/**
 * D-03 locks four views: 7-day, 30-day, 90-day and all time. The three bounded views
 * carry the immediately preceding equal-length period; all time carries no fabricated
 * comparison. Explicit inclusive calendar ranges are sent for the bounded views because
 * the provider's nearest relative preset is 91 days, not 90 (RESEARCH Pitfall 4).
 */
describe('all four reporting periods', () => {
  it.each([
    {
      label: 'month boundary',
      days: 7,
      today: '2026-03-02',
      current: { start: '2026-02-24', end: '2026-03-02' },
      previous: { start: '2026-02-17', end: '2026-02-23' },
    },
    {
      label: 'year boundary',
      days: 7,
      today: '2026-01-03',
      current: { start: '2025-12-28', end: '2026-01-03' },
      previous: { start: '2025-12-21', end: '2025-12-27' },
    },
    {
      label: 'leap day',
      days: 7,
      today: '2028-02-29',
      current: { start: '2028-02-23', end: '2028-02-29' },
      previous: { start: '2028-02-16', end: '2028-02-22' },
    },
    {
      label: 'thirty days across a leap February',
      days: 30,
      today: '2028-03-01',
      current: { start: '2028-02-01', end: '2028-03-01' },
      previous: { start: '2028-01-02', end: '2028-01-31' },
    },
    {
      label: 'ninety days',
      days: 90,
      today: '2026-03-01',
      current: { start: '2025-12-02', end: '2026-03-01' },
      previous: { start: '2025-09-03', end: '2025-12-01' },
    },
  ])('windows $days days ending $today across a $label', ({ days, today, current, previous }) => {
    expect(periodWindows(days, today)).toEqual({ current, previous });
  });

  const SEVEN_CURRENT = goalRows({
    haoo_page_view: 10,
    haoo_assisted_whatsapp: 3,
    haoo_assisted_phone: 2,
  });
  const SEVEN_PREVIOUS = goalRows({ haoo_page_view: 4 });
  const NINETY_CURRENT = goalRows({ haoo_page_view: 500 });
  const NINETY_PREVIOUS = goalRows({ haoo_page_view: 400 });
  // The all-time first recorded day no longer arrives on an echoed range: the provider
  // echoes the query but not the project or the window it resolved, so the day is asked
  // for in its own single-value query (see FIXTURE_FIRST_DAY).
  const ALL_TIME = goalRows({ haoo_page_view: 900, haoo_self_onboarding: 12 });

  const EVERY_PERIOD = [
    SEVEN_CURRENT,
    SEVEN_PREVIOUS,
    FIXTURE_CURRENT,
    FIXTURE_PREVIOUS,
    NINETY_CURRENT,
    NINETY_PREVIOUS,
    ALL_TIME,
  ];

  /** The markup of one period section, resolved by id rather than by string position. */
  function periodSection(html: string, id: string): string {
    const section = new DOMParser().parseFromString(html, 'text/html').getElementById(id);
    expect(section, id).not.toBeNull();
    return section?.outerHTML ?? '';
  }

  async function generateEveryPeriod() {
    const { fetchSpy, calls } = stubFetch(EVERY_PERIOD);
    const { fs, files } = memoryFs();
    const result = await generateHaooReport(generateOptions(fetchSpy, fs));

    return { calls, fetchSpy, html: files.get(OUTPUT_PATH) ?? '', result };
  }

  it('issues exactly eight queries and never uses a relative preset', async () => {
    const { calls, fetchSpy } = await generateEveryPeriod();

    // Six bounded aggregates, the unbounded all-time aggregate, and the first-day query.
    expect(fetchSpy).toHaveBeenCalledTimes(8);
    expect(calls).toHaveLength(8);
    for (const call of calls) {
      expect(call.body).not.toContain('91d');
      expect(call.body).not.toContain('7d');
      expect(call.body).not.toContain('30d');
    }
  });

  it('bounds the six calendar aggregates in SQL, leaves all time unbounded, and asks the first day once', async () => {
    const { calls } = await generateEveryPeriod();
    const submitted = calls.map((call) => submittedSqlOf(call));

    expect(submitted).toEqual([
      independentSql({ start: '2026-02-23', end: '2026-03-01' }),
      independentSql({ start: '2026-02-16', end: '2026-02-22' }),
      independentSql({ start: '2026-01-31', end: '2026-03-01' }),
      independentSql({ start: '2026-01-01', end: '2026-01-30' }),
      independentSql({ start: '2025-12-02', end: '2026-03-01' }),
      independentSql({ start: '2025-09-03', end: '2025-12-01' }),
      independentSql('all'),
      independentSql('first-day'),
    ]);
    // All time carries no bound at all rather than a very old one it cannot justify.
    expect(submitted[6]).not.toContain('toDate(');
    expect(submitted[7]).toContain('min(timestamp)');
  });

  it('renders all four period sections with their exact inclusive boundaries', async () => {
    const { html } = await generateEveryPeriod();

    expect(html).toContain('Last 7 days · 2026-02-23 to 2026-03-01');
    expect(html).toContain('Last 30 days · 2026-01-31 to 2026-03-01');
    expect(html).toContain('Last 90 days · 2025-12-02 to 2026-03-01');
    expect(html).toContain('All time · since 2025-11-04');
  });

  it('gives every bounded period its own comparison against the preceding equal-length period', async () => {
    const { html } = await generateEveryPeriod();

    expect(periodSection(html, 'last-7-days')).toContain(
      'Compared with the previous 7 days, 2026-02-16 to 2026-02-22.',
    );
    expect(periodSection(html, 'last-30-days')).toContain(
      'Compared with the previous 30 days, 2026-01-01 to 2026-01-30.',
    );
    expect(periodSection(html, 'last-90-days')).toContain(
      'Compared with the previous 90 days, 2025-09-03 to 2025-12-01.',
    );
  });

  it('gives the all-time period no previous window, no comparison line, and no change value', async () => {
    const { html } = await generateEveryPeriod();
    const allTime = periodSection(html, 'all-time');

    expect(allTime).not.toContain('vs previous');
    expect(allTime).not.toContain('stage-change');
    expect(allTime).not.toContain('Previous period');
    expect(allTime).not.toContain('Compared with the previous');
    expect(allTime).toContain('<th scope="col">All time</th>');
  });

  it('zero-fills a goal missing from one period without touching another period', async () => {
    const { html } = await generateEveryPeriod();

    expect(periodSection(html, 'last-7-days')).toMatch(
      /Outbound self-onboarding clicks<\/th><td>0<\/td>/,
    );
    expect(periodSection(html, 'all-time')).toMatch(
      /Outbound self-onboarding clicks<\/th><td>12<\/td>/,
    );
  });

  it('computes each stage total independently per period', async () => {
    const { html } = await generateEveryPeriod();

    // 7 days: WhatsApp 3 + phone 2 + email 0 + self-onboarding 0.
    expect(periodSection(html, 'last-7-days')).toContain('5 recorded actions');
    // 30 days: 7 + 3 + 2 + 6 from the shared fixture.
    expect(periodSection(html, 'last-30-days')).toContain('18 recorded actions');
    // 90 days: discovery is 500 and every other stage is empty.
    expect(periodSection(html, 'last-90-days')).toContain('500 recorded actions');
    expect(periodSection(html, 'last-90-days')).toContain('0 recorded actions');
  });

  it('names no recorded day rather than inventing one when the provider reports nothing', async () => {
    const { fetchSpy } = stubFetch(
      [...EVERY_PERIOD.slice(0, 6), goalRows({})],
      DEFAULT_SUBMITTED_QUERIES,
      firstDayRows(null),
    );
    const { fs, files } = memoryFs();

    await generateHaooReport(generateOptions(fetchSpy, fs));
    const html = files.get(OUTPUT_PATH) ?? '';

    expect(html).toContain('All time · No recorded actions in this period');
    expect(html).not.toContain('All time · since');
  });

  it('aborts the whole report when any one of the eight queries fails validation', async () => {
    const { fetchSpy } = stubFetch([
      ...EVERY_PERIOD.slice(0, 4),
      { columns: [...INDEPENDENT_HOGQL_COLUMNS], results: [['haoo_not_a_goal', 1]] },
    ]);
    const { fs, files } = memoryFs();

    const result = await generateHaooReport(generateOptions(fetchSpy, fs));

    expect(result.ok).toBe(false);
    expect(files.size).toBe(0);
  });

  it.each([
    { label: 'a row carrying more than the single day value', body: { columns: ['first_day'], results: [['2025-11-04', 'extra']] } },
    { label: 'more than one row', body: { columns: ['first_day'], results: [['2025-11-04'], ['2025-11-05']] } },
    { label: 'a day that is not an ISO calendar day', body: { columns: ['first_day'], results: [['4 November 2025']] } },
    { label: 'a results value that is not an array', body: { columns: ['first_day'], results: 'none' } },
  ])('aborts before writing when the first-recorded-day query answers with $label', async ({ body }) => {
    const { fetchSpy } = stubFetch(EVERY_PERIOD, DEFAULT_SUBMITTED_QUERIES, body);
    const { fs, files } = memoryFs();

    const result = await generateHaooReport(generateOptions(fetchSpy, fs));

    expect(result.ok).toBe(false);
    expect(files.size).toBe(0);
  });
});

describe('owner command registration', () => {
  it('maps report:haoo to the credentialed CLI and declares a type-stripping Node floor', () => {
    const pkg: {
      scripts: Record<string, string>;
      engines?: { node?: string };
    } = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));

    expect(pkg.scripts['report:haoo']).toBe('node scripts/generate-haoo-report.mjs');

    const floor = pkg.engines?.node ?? '';
    expect(floor).toBeTruthy();
    const [major, minor] = floor.replace(/[^0-9.]/g, '').split('.').map(Number);
    expect(major > 22 || (major === 22 && minor >= 18)).toBe(true);
  });

  it('keeps generated owner reports out of the repository', () => {
    const ignore = readFileSync(resolve(ROOT, '.gitignore'), 'utf8');

    expect(ignore.split(/\r?\n/).filter((line) => line === '.reports/')).toHaveLength(1);
    expect(
      spawnSync('git', ['check-ignore', '-q', '.reports/haoo-funnel-report.html'], {
        cwd: ROOT,
      }).status,
    ).toBe(0);
  });
});

/**
 * UI-SPEC Surface A — the complete owner document.
 *
 * Every string below is copied from `04-UI-SPEC.md` by hand rather than imported from
 * `src/reporting/haoo-report.ts`, so the suite is an independent second copy of the
 * locked contract. A rename in the dictionary that silently changes owner-facing copy
 * fails here instead of passing by construction.
 */

/** UI-SPEC "Period section headings" — the four locked views in document order. */
const SURFACE_A_PERIODS = [
  { id: 'last-7-days', label: 'Last 7 days' },
  { id: 'last-30-days', label: 'Last 30 days' },
  { id: 'last-90-days', label: 'Last 90 days' },
  { id: 'all-time', label: 'All time' },
] as const;

/** UI-SPEC "Caveat block copy", one sentence per authored line. */
const CAVEAT_BLOCK = [
  'These counts are occurrences of browser actions, not people, sessions, or enquiries.',
  'One browser can appear in several stages, and a repeated action counts again.',
  'A stage total is the sum of the actions listed inside it, not evidence that the same '
  + 'person moved from one stage to the next.',
  'A validated form send attempt is a request the browser made; it is not proof that the '
  + 'message reached the inbox.',
  'An outbound click records that a link was opened; it is not a conversation, a '
  + 'registration, a customer, or completed onboarding.',
  'Browser privacy settings and content blockers can prevent an action from being '
  + 'recorded, so real activity can be higher than the counts shown.',
  'All-time counts begin at the first action recorded for this project; there is no '
  + 'earlier provider history to include.',
  'The provider echoes the query this report submitted but not the project that answered '
  + 'it, so the report proves which query produced its numbers and not which project '
  + 'produced them; the project named above is the one the command was configured with.',
] as const;

/** UI-SPEC "Empty state heading" and "Empty state body". */
const EMPTY_STATE_HEADING = 'No recorded actions in this period';

function emptyStateBody(start: string, end: string): string {
  return `Nothing was recorded for any HAOO signal between ${start} and ${end}. Counts `
    + 'include only actions taken while measurement was configured, and browser privacy '
    + 'settings can prevent an action from being recorded.';
}

/** UI-SPEC "Table column headers". */
const BOUNDED_COLUMNS = ['Recorded action', 'This period', 'Previous period', 'Change'];
const ALL_TIME_COLUMNS = ['Recorded action', 'All time'];

/**
 * A fixture covering every rendering branch the document has: a singular stage total, a
 * whole zero period, a no-change delta, an increase, a decrease, and an all-time period
 * whose first recorded day the provider resolved.
 */
const SURFACE_A_BODIES = [
  goalRows({ haoo_page_view: 1, haoo_assisted_whatsapp: 3, haoo_assisted_phone: 2 }),
  goalRows({ haoo_page_view: 4 }),
  FIXTURE_CURRENT,
  FIXTURE_PREVIOUS,
  goalRows({}),
  goalRows({}),
  goalRows({ haoo_page_view: 900, haoo_self_onboarding: 12 }),
];

async function generateSurfaceA(bodies: readonly unknown[] = SURFACE_A_BODIES) {
  const { fetchSpy } = stubFetch(bodies);
  const { fs, files } = memoryFs();
  const result = await generateHaooReport(generateOptions(fetchSpy, fs));

  return { html: files.get(OUTPUT_PATH) ?? '', result };
}

function parseReport(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

function normalise(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function sectionOf(doc: Document, id: string): HTMLElement {
  const section = doc.getElementById(id);
  expect(section, id).not.toBeNull();
  return section as HTMLElement;
}

function styleTextOf(doc: Document): string {
  const style = doc.querySelector('style');
  expect(style).not.toBeNull();
  return style?.textContent ?? '';
}

/** The name an assistive technology would announce for an `aria-labelledby` region. */
function accessibleNameOf(doc: Document, element: Element): string {
  const ids = (element.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
  return normalise(ids.map((id) => doc.getElementById(id)?.textContent ?? '').join(' '));
}

describe('Surface A document structure', () => {
  it('emits one h1, four h2 and sixteen h3 with no skipped heading level', async () => {
    const { html } = await generateSurfaceA();
    const doc = parseReport(html);

    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelectorAll('h2')).toHaveLength(4);
    expect(doc.querySelectorAll('h3')).toHaveLength(16);

    const levels = [...doc.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((heading) =>
      Number(heading.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index] - levels[index - 1], `${levels[index - 1]} -> ${levels[index]}`)
        .toBeLessThanOrEqual(1);
    }
  });

  it('renders one reporting-period fieldset of four radios with the 30-day view checked', async () => {
    const { html } = await generateSurfaceA();
    const doc = parseReport(html);

    const fieldsets = doc.querySelectorAll('fieldset');
    expect(fieldsets).toHaveLength(1);
    expect(normalise(fieldsets[0]?.querySelector('legend')?.textContent ?? ''))
      .toBe('Reporting period');

    const radios = [...doc.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
    expect(radios).toHaveLength(4);
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
    expect(radios.map((radio) => radio.value)).toEqual(
      SURFACE_A_PERIODS.map((period) => period.id),
    );

    for (const radio of radios) {
      expect(radio.checked, radio.value).toBe(radio.value === 'last-30-days');
      const label = doc.querySelector(`label[for="${radio.id}"]`);
      expect(label, radio.id).not.toBeNull();
      const period = SURFACE_A_PERIODS.find((entry) => entry.id === radio.value);
      expect(normalise(label?.textContent ?? '')).toBe(period?.label);
    }
  });

  it('pre-renders all four period sections with nothing hidden by markup', async () => {
    const { html } = await generateSurfaceA();
    const doc = parseReport(html);

    for (const period of SURFACE_A_PERIODS) {
      const section = sectionOf(doc, period.id);
      expect(section.tagName).toBe('SECTION');
      expect(section.hasAttribute('hidden'), period.id).toBe(false);
      expect(section.getAttribute('style') ?? '', period.id).not.toContain('display');
      expect(section.querySelectorAll('details.stage'), period.id).toHaveLength(4);
    }
  });

  it('hides a non-selected section only through a :has() rule, so no support means all visible', async () => {
    const { html } = await generateSurfaceA();
    const style = styleTextOf(parseReport(html));

    const hidingRules = style
      .split('}')
      .map((block) => block.trim())
      .filter((block) => block.includes('.period-section') && block.includes('display: none'));

    expect(hidingRules.length).toBeGreaterThan(0);
    for (const rule of hidingRules) {
      expect(rule, rule).toContain(':has(');
    }
  });

  it('wraps every event table in a keyboard-reachable labelled scroll region', async () => {
    const { html } = await generateSurfaceA();
    const doc = parseReport(html);

    const regions = [...doc.querySelectorAll('.table-scroll')];
    expect(regions).toHaveLength(16);
    for (const region of regions) {
      expect(region.getAttribute('role')).toBe('region');
      expect(region.getAttribute('tabindex')).toBe('0');
      expect(accessibleNameOf(doc, region).length).toBeGreaterThan(0);
      expect(region.querySelectorAll('table')).toHaveLength(1);
    }
  });

  it('renders the bounded column headers and the two all-time column headers', async () => {
    const { html } = await generateSurfaceA();
    const doc = parseReport(html);

    for (const table of sectionOf(doc, 'last-30-days').querySelectorAll('table')) {
      expect([...table.querySelectorAll('thead th')].map((th) => th.textContent))
        .toEqual(BOUNDED_COLUMNS);
      for (const th of table.querySelectorAll('thead th')) {
        expect(th.getAttribute('scope')).toBe('col');
      }
      for (const th of table.querySelectorAll('tbody th')) {
        expect(th.getAttribute('scope')).toBe('row');
      }
    }

    const allTime = sectionOf(doc, 'all-time');
    for (const table of allTime.querySelectorAll('table')) {
      expect([...table.querySelectorAll('thead th')].map((th) => th.textContent))
        .toEqual(ALL_TIME_COLUMNS);
    }
    expect(allTime.querySelectorAll('.stage-change')).toHaveLength(0);
    expect(normalise(allTime.textContent ?? ''))
      .toContain('All time has no preceding period to compare with.');
  });

  it('renders the singular unit noun for a total of one and the plural for zero', async () => {
    const { html } = await generateSurfaceA();
    const doc = parseReport(html);

    const totalsIn = (id: string) =>
      [...sectionOf(doc, id).querySelectorAll('.stage-total')]
        .map((node) => normalise(node.textContent ?? ''));

    expect(totalsIn('last-7-days')).toEqual([
      '1 recorded action',
      '0 recorded actions',
      '0 recorded actions',
      '5 recorded actions',
    ]);
    expect(totalsIn('last-90-days')).toEqual([
      '0 recorded actions',
      '0 recorded actions',
      '0 recorded actions',
      '0 recorded actions',
    ]);
  });

  it('renders the authored empty state with its own dates and still renders four cards', async () => {
    const { html } = await generateSurfaceA();
    const section = sectionOf(parseReport(html), 'last-90-days');
    const text = normalise(section.textContent ?? '');

    expect(text).toContain(EMPTY_STATE_HEADING);
    expect(text).toContain(normalise(emptyStateBody('2025-12-02', '2026-03-01')));
    expect(section.querySelectorAll('details.stage')).toHaveLength(4);

    const populated = normalise(sectionOf(parseReport(html), 'last-30-days').textContent ?? '');
    expect(populated).not.toContain(EMPTY_STATE_HEADING);
  });

  it('keeps the caveat block last, always visible, and outside every collapsed element', async () => {
    const { html } = await generateSurfaceA();
    const doc = parseReport(html);

    const caveats = doc.getElementById('report-caveats');
    expect(caveats).not.toBeNull();
    expect(caveats?.closest('details')).toBeNull();
    expect(caveats?.hasAttribute('hidden')).toBe(false);
    expect(normalise(caveats?.textContent ?? '')).toBe(normalise(CAVEAT_BLOCK.join(' ')));

    const wrap = caveats?.parentElement;
    expect(wrap?.lastElementChild).toBe(caveats);
  });

  it('carries a print block and a reduced-motion block in the inline style element', async () => {
    const { html } = await generateSurfaceA();
    const style = styleTextOf(parseReport(html));

    expect(style).toContain('@media print');
    expect(style).toContain('prefers-reduced-motion');
    expect(style).toContain('font-variant-numeric: tabular-nums');
    expect(style).toContain('880px');
    expect(style).toContain('44px');
  });

  it('states the generation timestamp, timezone and project scope', async () => {
    const { html } = await generateSurfaceA();
    const doc = parseReport(html);
    const meta = normalise(doc.querySelector('.report-meta')?.textContent ?? '');

    expect(meta).toContain('Generated 2026-03-01T09:30:00.000Z');
    expect(meta).toContain('Reporting timezone Africa/Nairobi');
    // Named, not proven: the provider echoes the query but not the project that answered
    // it, which is exactly what the last caveat sentence tells the owner.
    expect(meta).toContain(`Project ${FIXTURE_PROJECT_ID}`);
  });

  it('never claims a provider configuration state it cannot observe', async () => {
    // The report printed "configured"/"not configured" from an inference over the counts,
    // but the breakdown returns a row only for a goal with events in the period, so a
    // registered-but-unfired goal is indistinguishable from an unregistered one. A live
    // site with no traffic yet read as "not configured". The line now carries only
    // witnessed facts, in both the populated and the entirely-empty case.
    for (const bodies of [undefined, SURFACE_A_BODIES.map(() => goalRows({}))]) {
      const { html } = await generateSurfaceA(bodies);
      const meta = normalise(parseReport(html).querySelector('.report-meta')?.textContent ?? '');

      expect(meta).not.toContain('Analytics provider');
      expect(meta).not.toContain('not configured');
    }
  });
});

/**
 * MEAS-08 semantic integrity (threats T-04-02, T-04-03, T-04-05, T-04-13).
 *
 * This is the contract MEAS-08 rests on, so it is written to be hard to satisfy by
 * accident: every vocabulary assertion runs over the document's rendered *text*, with the
 * style element removed so CSS units cannot false-positive and with markup removed so a
 * sentence split across elements cannot false-negative. The authored caveat block is
 * excluded from the scan and pinned by exact text instead, and a contract below asserts
 * that exclusion is the only place a banned term is allowed to exist.
 */

/** A credential that must never reach the document, distinct from the shared fixture. */
const SENTINEL_CREDENTIAL = 'sentinel-credential-must-never-render-0f3a';

/**
 * UI-SPEC "Change value" — the only three authored forms, with the minus form using
 * U+2212 rather than a hyphen. A percentage, a ratio, or a plus-zero is not among them.
 */
const AUTHORED_CHANGE_FORM = /^(\+[1-9]\d*|−[1-9]\d*|No change) vs previous (7|30|90) days$/;

function caveatTextOf(doc: Document): string {
  return normalise(doc.getElementById(CAVEAT_BLOCK_ID)?.textContent ?? '');
}

function changeValuesOf(doc: Document): string[] {
  return [...doc.querySelectorAll('.stage-change, td.change')]
    .map((node) => normalise(node.textContent ?? ''));
}

describe('Surface A semantic integrity', () => {
  it('reproduces the locked banned list in full and scans rendered text, not markup', async () => {
    const { html } = await generateSurfaceA();
    const text = documentText(html);

    expect([...BANNED_REPORT_VOCABULARY, BANNED_REPORT_PERCENT_SIGN]).toHaveLength(22);
    expect(text).not.toContain('<');
    expect(text).toContain('HAOO funnel report');

    for (const term of BANNED_REPORT_VOCABULARY) {
      expect(text.toLowerCase(), `banned term: ${term}`).not.toMatch(
        new RegExp(`\\b${term.replace(/-/g, '\\-')}\\b`),
      );
    }
  });

  /**
   * The UI-SPEC bans a percentage "anywhere" in this document, so the assertion is made
   * twice: over the rendered text, which is what the owner reads, and over the whole
   * file including the style element. The second is only possible because the stylesheet
   * uses no percentage unit either, and it is worth keeping — it means the owner can grep
   * their own generated report for a percent sign and expect zero hits.
   */
  it('renders no percent sign in the document text or anywhere in the file', async () => {
    const { html } = await generateSurfaceA();

    expect(documentText(html)).not.toContain(BANNED_REPORT_PERCENT_SIGN);
    expect(html).not.toContain(BANNED_REPORT_PERCENT_SIGN);
  });

  /**
   * The scan excludes the authored caveat block because that block exists to deny the
   * claims the banned list forbids. This contract keeps the exclusion honest: a banned
   * term may appear in the document only inside the caveat block, and the caveat block
   * may only be the authored copy.
   */
  it('allows a banned term only inside the exact authored caveat block', async () => {
    const { html } = await generateSurfaceA();
    const doc = parseReport(html);
    const caveat = caveatTextOf(doc);

    expect(caveat).toBe(normalise(CAVEAT_BLOCK.join(' ')));

    const scanned = documentText(html).toLowerCase();
    const whole = (doc.documentElement.textContent ?? '').toLowerCase();

    for (const term of BANNED_REPORT_VOCABULARY) {
      const pattern = new RegExp(`\\b${term.replace(/-/g, '\\-')}\\b`, 'g');
      const inScanned = (scanned.match(pattern) ?? []).length;
      const inCaveat = (caveat.toLowerCase().match(pattern) ?? []).length;
      const inWhole = (whole.match(pattern) ?? []).length;

      expect(inScanned, `banned term outside the caveat block: ${term}`).toBe(0);
      expect(inWhole - inCaveat, `unaccounted occurrence of: ${term}`).toBe(0);
    }
  });

  it('carries the whole authored caveat text, whitespace-normalised', async () => {
    const { html } = await generateSurfaceA();
    const caveat = caveatTextOf(parseReport(html));

    for (const sentence of CAVEAT_BLOCK) {
      expect(caveat, sentence).toContain(normalise(sentence));
    }
    expect(caveat).toBe(normalise(CAVEAT_BLOCK.join(' ')));
  });

  it('loads nothing from anywhere: no script, stylesheet, image, frame or absolute URL', async () => {
    const { html } = await generateSurfaceA();
    const doc = parseReport(html);

    expect(doc.querySelectorAll('script')).toHaveLength(0);
    expect(doc.querySelectorAll('link')).toHaveLength(0);
    expect(doc.querySelectorAll('link[rel~="stylesheet"], link[rel~="preload"]'))
      .toHaveLength(0);
    expect(doc.querySelectorAll('img')).toHaveLength(0);
    expect(doc.querySelectorAll('iframe, object, embed, source, video, audio'))
      .toHaveLength(0);
    expect(doc.querySelectorAll('form')).toHaveLength(0);

    const absolute: string[] = [];
    for (const element of doc.querySelectorAll('*')) {
      for (const attribute of element.attributes) {
        if (/^https?:/i.test(attribute.value.trim())) {
          absolute.push(`${element.tagName}[${attribute.name}]`);
        }
      }
    }
    expect(absolute).toEqual([]);
    expect(styleTextOf(doc)).not.toContain('@import');
    expect(styleTextOf(doc)).not.toContain('url(');
  });

  it('renders neither a sentinel credential nor an authorization header name', async () => {
    const { fetchSpy } = stubFetch(SURFACE_A_BODIES);
    const { fs, files } = memoryFs();

    await generateHaooReport({
      ...generateOptions(fetchSpy, fs),
      query: {
        endpoint: FIXTURE_ENDPOINT,
        apiKey: SENTINEL_CREDENTIAL,
        projectId: FIXTURE_PROJECT_ID,
      },
    });
    const html = files.get(OUTPUT_PATH) ?? '';

    expect(html.length).toBeGreaterThan(0);
    expect(fetchSpy.mock.calls[0]?.[1].headers.Authorization)
      .toBe(`Bearer ${SENTINEL_CREDENTIAL}`);
    expect(html).not.toContain(SENTINEL_CREDENTIAL);
    expect(html).not.toContain('Authorization');
    expect(html).not.toContain('Bearer');
  });

  it('renders every change value in one of exactly three authored forms', async () => {
    const { html } = await generateSurfaceA();
    const values = changeValuesOf(parseReport(html));

    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value, `change value: ${value}`).toMatch(AUTHORED_CHANGE_FORM);
      expect(value, `change value: ${value}`).not.toContain('+0');
      expect(value, `change value: ${value}`).not.toContain('%');
      expect(value, `change value: ${value}`).not.toMatch(/-\d/);
    }

    expect(values).toContain('−3 vs previous 7 days');
    expect(values).toContain('No change vs previous 7 days');
    expect(values.some((value) => value.startsWith('+'))).toBe(true);
  });

  it('encodes no count as a shape and colours no change value', async () => {
    const { html } = await generateSurfaceA();
    const doc = parseReport(html);
    const style = styleTextOf(doc);

    expect(doc.querySelectorAll('progress, meter, svg, canvas')).toHaveLength(0);
    expect(style).not.toMatch(/#(B00020|[0-9A-F]{0,2}(FF)?00[0-9A-F]{2})\b/i);
    expect(documentText(html)).not.toMatch(/[↑↓→▲▼⬆⬇]/);
    for (const node of doc.querySelectorAll('.stage-change, td.change')) {
      expect(node.getAttribute('style')).toBeNull();
    }
  });

  it('serves the exported REPORT_STYLES as the only style element', async () => {
    const { html } = await generateSurfaceA();
    const doc = parseReport(html);

    expect(doc.querySelectorAll('style')).toHaveLength(1);
    expect(styleTextOf(doc).trim()).toBe(REPORT_STYLES.trim());
  });
});
