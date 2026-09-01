import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
const FIXTURE_API_KEY = 'fixture-stats-api-key-do-not-render';
const FIXTURE_SITE_ID = 'example.test';
const FIXTURE_ENDPOINT = 'https://provider.invalid/api/v2/query';

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

function goalRows(counts: Partial<Record<HaooMeasurementEvent, number>>) {
  return {
    results: Object.entries(counts).map(([goal, value]) => ({
      metrics: [value],
      dimensions: [goal],
    })),
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

const DEFAULT_ECHOED_RANGES = [
  ['2026-02-23T00:00:00+03:00', '2026-03-01T23:59:59+03:00'],
  ['2026-02-16T00:00:00+03:00', '2026-02-22T23:59:59+03:00'],
  ['2026-01-31T00:00:00+03:00', '2026-03-01T23:59:59+03:00'],
  ['2026-01-01T00:00:00+03:00', '2026-01-30T23:59:59+03:00'],
  ['2025-12-02T00:00:00+03:00', '2026-03-01T23:59:59+03:00'],
  ['2025-09-03T00:00:00+03:00', '2025-12-01T23:59:59+03:00'],
  ['2025-11-04T00:00:00+03:00', '2026-03-01T23:59:59+03:00'],
] as const;

function independentlyEchoedQuery(dateRange: readonly [string, string]) {
  return {
    site_id: 'example.test',
    metrics: ['events'],
    dimensions: ['event:goal'],
    filters: [['is', 'event:goal', [...INDEPENDENT_GOAL_FILTER]]],
    date_range: [...dateRange],
  };
}

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
}

function stubFetch(
  bodies: readonly unknown[],
  echoedRanges: readonly (readonly [string, string])[] = DEFAULT_ECHOED_RANGES,
) {
  const calls: StubCall[] = [];
  let index = 0;
  const fetchSpy = vi.fn<ReportFetch>(async (url, init) => {
    calls.push({ url, body: init.body, headers: init.headers });
    const body = bodies[Math.min(index, bodies.length - 1)];
    const range = echoedRanges[Math.min(index, echoedRanges.length - 1)];
    index += 1;
    const responseBody = typeof body === 'object' && body !== null && !Array.isArray(body)
      ? {
          ...body,
          query: {
            ...independentlyEchoedQuery(range),
            ...('query' in body && typeof body.query === 'object' && body.query !== null
              ? body.query
              : {}),
          },
        }
      : body;
    return { ok: true, json: async () => responseBody };
  });

  return { fetchSpy, calls };
}

describe('validateEchoedQuery', () => {
  const expected = {
    siteId: FIXTURE_SITE_ID,
    events: [...INDEPENDENT_GOAL_FILTER],
    range: { start: '2026-02-23', end: '2026-03-01' },
    today: '2026-03-01',
  } as const;
  const valid = { query: independentlyEchoedQuery(DEFAULT_ECHOED_RANGES[0]) };

  it('accepts exact bounded provenance without shifting offset timestamps through UTC', () => {
    expect(validateEchoedQuery(valid, expected)).toEqual({
      start: '2026-02-23',
      end: '2026-03-01',
    });
  });

  it.each([
    ['malformed query', null],
    ['wrong site', { site_id: 'wrong.example' }],
    ['extra metric', { metrics: ['events', 'visitors'] }],
    ['wrong dimension', { dimensions: ['event:page'] }],
    ['missing filter', { filters: [] }],
    ['extra filter', { filters: [valid.query.filters[0], ['is', 'visit:country', ['KE']]] }],
    ['wrong goal order', { filters: [['is', 'event:goal', [...INDEPENDENT_GOAL_FILTER].reverse()]] }],
    ['wrong range', { date_range: ['2026-02-22', '2026-03-01'] }],
    ['impossible date', { date_range: ['2026-02-30', '2026-03-01'] }],
  ])('rejects %s', (_label, override) => {
    const query = override === null ? 'not-an-object' : { ...valid.query, ...override };
    expect(validateEchoedQuery({ query }, expected)).toBeNull();
  });

  it('tolerates provider-owned extra top-level query members', () => {
    expect(validateEchoedQuery(
      { query: { ...valid.query, order_by: [['events', 'desc']], include: {} } },
      expected,
    )).toEqual({ start: '2026-02-23', end: '2026-03-01' });
  });

  it.each([
    ['future start', ['2026-03-02', '2026-03-01']],
    ['start after end', ['2026-02-02', '2026-02-01']],
    ['stale end', ['2025-01-01', '2026-02-28']],
    ['future end', ['2025-01-01', '2026-03-02']],
  ])('rejects all-time %s', (_label, dateRange) => {
    expect(validateEchoedQuery(
      { query: { ...valid.query, date_range: dateRange } },
      { ...expected, range: 'all' },
    )).toBeNull();
  });
});

/** In-memory capability so a document contract never touches the real filesystem. */
function memoryFs() {
  const files = new Map<string, string>();
  const fs: ReportFs = {
    mkdirSync: () => {},
    writeFileSync: (path, data) => {
      files.set(path, data);
    },
    renameSync: (from, to) => {
      const data = files.get(from);
      if (data === undefined) throw new Error(`missing ${from}`);
      files.delete(from);
      files.set(to, data);
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
    query: { endpoint: FIXTURE_ENDPOINT, apiKey: FIXTURE_API_KEY, siteId: FIXTURE_SITE_ID },
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

  it('zero-fills every allowlisted goal absent from the response', () => {
    const parsed = parseGoalCounts(goalRows({ haoo_page_view: 5 }), allowed);

    expect(parsed).not.toBeNull();
    expect(Object.keys(parsed ?? {}).sort()).toEqual([...allowed].sort());
    expect(parsed?.haoo_page_view).toBe(5);
    expect(parsed?.haoo_self_onboarding).toBe(0);
  });

  it('accepts an empty result set as an all-zero period', () => {
    const parsed = parseGoalCounts({ results: [] }, allowed);

    expect(parsed).not.toBeNull();
    expect(Object.values(parsed ?? {}).every((count) => count === 0)).toBe(true);
  });

  it.each([
    { label: 'non-object body', body: 'not-json' as unknown },
    { label: 'null body', body: null as unknown },
    { label: 'array body', body: [] as unknown },
    { label: 'missing results', body: { meta: {} } as unknown },
    { label: 'non-array results', body: { results: {} } as unknown },
    { label: 'non-object row', body: { results: ['x'] } as unknown },
    {
      label: 'unknown goal',
      body: { results: [{ metrics: [1], dimensions: ['haoo_unknown_event'] }] } as unknown,
    },
    {
      label: 'duplicate goal',
      body: {
        results: [
          { metrics: [1], dimensions: ['haoo_page_view'] },
          { metrics: [2], dimensions: ['haoo_page_view'] },
        ],
      } as unknown,
    },
    {
      label: 'non-integer count',
      body: { results: [{ metrics: [1.5], dimensions: ['haoo_page_view'] }] } as unknown,
    },
    {
      label: 'negative count',
      body: { results: [{ metrics: [-1], dimensions: ['haoo_page_view'] }] } as unknown,
    },
    {
      label: 'non-finite count',
      body: {
        results: [{ metrics: [Number.POSITIVE_INFINITY], dimensions: ['haoo_page_view'] }],
      } as unknown,
    },
    {
      label: 'string count',
      body: { results: [{ metrics: ['4'], dimensions: ['haoo_page_view'] }] } as unknown,
    },
    {
      label: 'missing dimension',
      body: { results: [{ metrics: [1], dimensions: [] }] } as unknown,
    },
    {
      label: 'extra dimension',
      body: {
        results: [{ metrics: [1], dimensions: ['haoo_page_view', 'extra'] }],
      } as unknown,
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
    providerState: 'configured',
    siteScope: FIXTURE_SITE_ID,
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

  it('passes the credential only in the Authorization header and queries by explicit dates', async () => {
    const { fetchSpy, calls } = stubFetch([FIXTURE_CURRENT, FIXTURE_PREVIOUS]);
    const { fs } = memoryFs();

    await generateHaooReport(generateOptions(fetchSpy, fs));

    expect(calls.length).toBeGreaterThanOrEqual(2);
    for (const call of calls) {
      expect(call.url).toBe(FIXTURE_ENDPOINT);
      expect(call.headers.Authorization).toBe(`Bearer ${FIXTURE_API_KEY}`);
      expect(call.body).not.toContain(FIXTURE_API_KEY);
      expect(call.body).not.toContain('91d');
      expect(call.body).toContain('"metrics":["events"]');
      expect(call.body).toContain('"dimensions":["event:goal"]');
    }
  });

  /**
   * Deriving "today" in UTC would place a run made between midnight and 03:00 in
   * Nairobi on the previous calendar day, so the report would name a window the
   * provider did not aggregate. 22:00Z on 1 March is already 2 March in Africa/Nairobi.
   */
  it('derives the inclusive window from the reporting timezone, not from UTC', async () => {
    const marchSecondRanges = [
      ['2026-02-24T00:00:00+03:00', '2026-03-02T23:59:59+03:00'],
      ['2026-02-17T00:00:00+03:00', '2026-02-23T23:59:59+03:00'],
      ['2026-02-01T00:00:00+03:00', '2026-03-02T23:59:59+03:00'],
      ['2026-01-02T00:00:00+03:00', '2026-01-31T23:59:59+03:00'],
      ['2025-12-03T00:00:00+03:00', '2026-03-02T23:59:59+03:00'],
      ['2025-09-04T00:00:00+03:00', '2025-12-02T23:59:59+03:00'],
      ['2025-11-04T00:00:00+03:00', '2026-03-02T23:59:59+03:00'],
    ] as const;
    const { fetchSpy, calls } = stubFetch(
      [FIXTURE_CURRENT, FIXTURE_PREVIOUS],
      marchSecondRanges,
    );
    const { fs } = memoryFs();

    await generateHaooReport({
      ...generateOptions(fetchSpy, fs),
      now: () => new Date('2026-03-01T22:00:00.000Z'),
    });

    expect(calls[0]?.body).toContain('"date_range":["2026-02-24","2026-03-02"]');
    expect(calls[2]?.body).toContain('"date_range":["2026-02-01","2026-03-02"]');
    expect(calls[3]?.body).toContain('"date_range":["2026-01-02","2026-01-31"]');
  });

  it.each([
    { label: 'empty api key', apiKey: '', siteId: FIXTURE_SITE_ID },
    { label: 'blank api key', apiKey: '   ', siteId: FIXTURE_SITE_ID },
    { label: 'empty site id', apiKey: FIXTURE_API_KEY, siteId: '' },
  ])('refuses to run and issues no request for an $label', async ({ apiKey, siteId }) => {
    const { fetchSpy } = stubFetch([FIXTURE_CURRENT]);
    const { fs, files } = memoryFs();

    const result = await generateHaooReport({
      ...generateOptions(fetchSpy, fs),
      query: { endpoint: FIXTURE_ENDPOINT, apiKey, siteId },
    });

    expect(result.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(files.size).toBe(0);
  });

  it('writes nothing when the provider response fails validation', async () => {
    const { fetchSpy } = stubFetch([{ results: [{ metrics: [1], dimensions: ['nope'] }] }]);
    const { fs, files } = memoryFs();

    const result = await generateHaooReport(generateOptions(fetchSpy, fs));

    expect(result.ok).toBe(false);
    expect(files.size).toBe(0);
  });

  it('leaves the filesystem untouched when echoed provenance belongs to another site', async () => {
    const mismatched = {
      ...FIXTURE_CURRENT,
      query: { ...independentlyEchoedQuery(DEFAULT_ECHOED_RANGES[0]), site_id: 'stale.test' },
    };
    const { fetchSpy } = stubFetch([mismatched]);
    const { fs, files } = memoryFs();

    const result = await generateHaooReport(generateOptions(fetchSpy, fs));

    expect(result).toEqual({ ok: false, reason: 'invalid-current-7' });
    expect(files.size).toBe(0);
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
      /UNCONFIGURED_PROVIDER_ORIGIN_FORBIDDEN\s*=\s*\[\/([^/\n]+)\/i\]/,
    )?.[1];
    expect(originSource, 'unconfigured-provider origin pattern in build-output.test.ts')
      .toBeTruthy();

    const cli = readFileSync(resolve(ROOT, 'scripts/generate-haoo-report.mjs'), 'utf8');
    const endpoint = cli.match(/'(https:\/\/[^']+)'/)?.[1];
    expect(endpoint, 'endpoint literal in the credentialed CLI').toBeTruthy();
    const queryPath = new URL(endpoint ?? 'https://example.invalid').pathname;
    const credentialName = cli.match(/process\.env\.([A-Z0-9_]*API_KEY)/)?.[1];
    expect(credentialName, 'credential variable name in the credentialed CLI').toBeTruthy();

    const generate = readFileSync(resolve(ROOT, 'src/reporting/generate.ts'), 'utf8');

    expect(generate).not.toMatch(new RegExp(originSource ?? 'plausible', 'i'));
    expect(generate).not.toContain(queryPath);
    expect(generate).not.toContain(credentialName ?? 'PLAUSIBLE_STATS_API_KEY');
  });

  it('lints the credentialed script through a dedicated ESLint block', () => {
    const config = readFileSync(resolve(ROOT, 'eslint.config.js'), 'utf8');

    expect(config).toContain("files: ['scripts/**/*.mjs']");
  });
});

describe('credentialed CLI', () => {
  it('loads the report modules under real Node and refuses without credentials', () => {
    const outputPath = resolve(ROOT, '.reports/haoo-funnel-report.html');
    const existedBefore = existsSync(outputPath);

    const result = spawnSync(process.execPath, ['scripts/generate-haoo-report.mjs'], {
      cwd: ROOT,
      encoding: 'utf8',
      env: {},
    });

    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;

    for (const signature of [
      'Cannot find module',
      'Failed to resolve',
      'ERR_MODULE_NOT_FOUND',
      'ERR_UNKNOWN_FILE_EXTENSION',
      'SyntaxError',
      'TypeError',
    ]) {
      expect(output, signature).not.toContain(signature);
    }

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(ERROR_STATE_SENTENCE);
    expect(existsSync(outputPath)).toBe(existedBefore);
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
  const ALL_TIME = {
    ...goalRows({ haoo_page_view: 900, haoo_self_onboarding: 12 }),
    query: { date_range: ['2025-11-04T00:00:00+03:00', '2026-03-01T23:59:59+03:00'] },
  };

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

  it('issues exactly seven queries and never uses the 91-day preset', async () => {
    const { calls, fetchSpy } = await generateEveryPeriod();

    expect(fetchSpy).toHaveBeenCalledTimes(7);
    expect(calls).toHaveLength(7);
    for (const call of calls) {
      expect(call.body).not.toContain('91d');
      expect(call.body).not.toContain('7d');
      expect(call.body).not.toContain('30d');
    }
  });

  it('sends explicit inclusive calendar ranges for the bounded periods and "all" once', async () => {
    const { calls } = await generateEveryPeriod();
    const ranges = calls.map((call) => JSON.parse(call.body).date_range);

    expect(ranges).toEqual([
      ['2026-02-23', '2026-03-01'],
      ['2026-02-16', '2026-02-22'],
      ['2026-01-31', '2026-03-01'],
      ['2026-01-01', '2026-01-30'],
      ['2025-12-02', '2026-03-01'],
      ['2025-09-03', '2025-12-01'],
      'all',
    ]);
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
    const { fetchSpy } = stubFetch([
      ...EVERY_PERIOD.slice(0, 6),
      { results: [] },
    ]);
    const { fs, files } = memoryFs();

    await generateHaooReport(generateOptions(fetchSpy, fs));
    const html = files.get(OUTPUT_PATH) ?? '';

    expect(html).toContain('All time · No recorded actions in this period');
    expect(html).not.toContain('All time · since');
  });

  it('aborts the whole report when any one of the seven periods fails validation', async () => {
    const { fetchSpy } = stubFetch([
      ...EVERY_PERIOD.slice(0, 4),
      { results: [{ metrics: [1], dimensions: ['haoo_not_a_goal'] }] },
    ]);
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
  {
    ...goalRows({ haoo_page_view: 900, haoo_self_onboarding: 12 }),
    query: { date_range: ['2025-11-04T00:00:00+03:00', '2026-03-01T23:59:59+03:00'] },
  },
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

  it('states the generation timestamp, timezone, provider state and site scope', async () => {
    const { html } = await generateSurfaceA();
    const doc = parseReport(html);
    const meta = normalise(doc.querySelector('.report-meta')?.textContent ?? '');

    expect(meta).toContain('Generated 2026-03-01T09:30:00.000Z');
    expect(meta).toContain('Reporting timezone Africa/Nairobi');
    expect(meta).toContain('Analytics provider: configured');
    expect(meta).toContain(FIXTURE_SITE_ID);
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
        siteId: FIXTURE_SITE_ID,
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
