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
import { escapeHtml, renderReport } from '../reporting/render';
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
 * UI-SPEC "Locked banned vocabulary". Each term claims more than a browser observed, or
 * expresses a proportion the anonymous event stream cannot prove (D-04).
 */
const BANNED_VOCABULARY = [
  'visitor', 'visitors', 'user', 'users', 'people', 'unique', 'session', 'lead', 'leads',
  'score', 'customer', 'conversion', 'converted', 'conversion rate', 'drop-off',
  'funnel drop', 'journey', 'delivered', 'received', 'onboarded', 'signed up',
] as const;

function documentText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');
}

function goalRows(counts: Partial<Record<HaooMeasurementEvent, number>>) {
  return {
    results: Object.entries(counts).map(([goal, value]) => ({
      metrics: [value],
      dimensions: [goal],
    })),
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

function stubFetch(bodies: readonly unknown[]) {
  const calls: StubCall[] = [];
  let index = 0;
  const fetchSpy = vi.fn<ReportFetch>(async (url, init) => {
    calls.push({ url, body: init.body, headers: init.headers });
    const body = bodies[Math.min(index, bodies.length - 1)];
    index += 1;
    return { ok: true, json: async () => body };
  });

  return { fetchSpy, calls };
}

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
  const model = {
    title: 'HAOO funnel report',
    generatedAt: '2026-03-01T09:30:00.000Z',
    timezone: 'Africa/Nairobi',
    providerState: 'configured',
    periods: [
      {
        id: 'last-30-days',
        days: 30,
        heading: 'Last 30 days · 2026-01-31 to 2026-03-01',
        comparisonLine:
          'Compared with the previous 30 days, 2026-01-01 to 2026-01-30.',
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

    for (const term of BANNED_VOCABULARY) {
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
    const { fetchSpy, calls } = stubFetch([FIXTURE_CURRENT, FIXTURE_PREVIOUS]);
    const { fs } = memoryFs();

    await generateHaooReport({
      ...generateOptions(fetchSpy, fs),
      now: () => new Date('2026-03-01T22:00:00.000Z'),
    });

    expect(calls[0]?.body).toContain('"date_range":["2026-02-01","2026-03-02"]');
    expect(calls[1]?.body).toContain('"date_range":["2026-01-02","2026-01-31"]');
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
      /\/(googletagmanager\|[^/\n]+)\/i,/,
    )?.[1];
    expect(originSource, 'analytics-origin pattern in build-output.test.ts').toBeTruthy();

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
