import { HAOO_REPORT_EVENTS, periodWindows } from './haoo-report.ts';
import { parseGoalCounts } from './stats-response.ts';
import { renderReport } from './render.ts';
import type { PeriodWindow } from './haoo-report.ts';
import type { ReportModel, ReportPeriodModel } from './render.ts';

/**
 * Capability-injected orchestration for the owner report.
 *
 * This module deliberately carries no provider origin, no query path, and no credential
 * variable name. All three arrive through the injected `query` capability, which is
 * owned by `scripts/generate-haoo-report.mjs` — the only credentialed module. The
 * boundary is asserted by a source test in `src/test/haoo-report.test.ts` and protected
 * by the 04-05 source scan (threat T-04-02).
 *
 * Write-on-success only: every range is queried and validated, the whole document is
 * rendered in memory, a temporary sibling is written, and only then is it renamed onto
 * the destination. A failed query, an unknown or duplicate goal row, or a non-integer
 * count aborts before any write, leaving the previous report byte-identical.
 *
 * Loaded by a `.mjs` entry through Node's native TypeScript type stripping, so it uses
 * erasable syntax only and imports by explicit `.ts` extension.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The Plausible site reporting timezone; the report states it and derives its days in it. */
const REPORT_TIMEZONE = 'Africa/Nairobi';
const REPORT_TITLE = 'HAOO funnel report';

export interface ReportQuery {
  readonly endpoint: string;
  readonly apiKey: string;
  readonly siteId: string;
}

export interface ReportResponse {
  readonly ok: boolean;
  json(): Promise<unknown>;
}

export interface ReportRequestInit {
  readonly method: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

export type ReportFetch = (
  url: string,
  init: ReportRequestInit,
) => Promise<ReportResponse>;

export interface ReportFs {
  mkdirSync(path: string, options: { readonly recursive: true }): void;
  writeFileSync(path: string, data: string): void;
  renameSync(from: string, to: string): void;
}

export interface GenerateHaooReportOptions {
  readonly query: ReportQuery;
  readonly fetch: ReportFetch;
  readonly now: () => Date;
  readonly fs: ReportFs;
  readonly outputPath: string;
}

export type GenerateHaooReportResult =
  | { readonly ok: true; readonly outputPath: string }
  | { readonly ok: false; readonly reason: string };

/**
 * The calendar day in the reporting timezone. Deriving "today" in UTC would place a run
 * made between midnight and 03:00 in Nairobi on the previous day, so the report would
 * name a window the provider did not aggregate.
 */
function reportDay(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

  return `${value('year')}-${value('month')}-${value('day')}`;
}

function directoryOf(path: string): string {
  const separator = path.lastIndexOf('/');
  return separator > 0 ? path.slice(0, separator) : '';
}

/**
 * The resolved first day the provider reports for an all-time query.
 *
 * The provider echoes the range it resolved `"all"` to. That value is untrusted like the
 * rest of the body, so it is validated down to a `YYYY-MM-DD` prefix before it can be
 * rendered; anything else yields `null` and the report claims no first recorded day
 * rather than inventing one.
 */
function resolvedStartDay(body: unknown): string | null {
  if (!isPlainObject(body)) return null;
  if (!isPlainObject(body.query)) return null;

  const range = body.query.date_range;
  if (!Array.isArray(range) || range.length !== 2) return null;
  if (typeof range[0] !== 'string') return null;

  const day = range[0].slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

interface RangeResult {
  readonly counts: Readonly<Record<string, number>>;
  readonly resolvedStart: string | null;
}

/**
 * One aggregate query for one range. The key is passed only in the `Authorization`
 * header — never in the query object, never logged, and never returned.
 *
 * Bounded periods send explicit inclusive ISO calendar ranges rather than a relative
 * preset, because the provider's nearest preset is 91 days and D-03 locks 90 (RESEARCH
 * Pitfall 4).
 */
async function queryRange(
  options: GenerateHaooReportOptions,
  range: PeriodWindow | 'all',
): Promise<RangeResult | null> {
  const response = await options.fetch(options.query.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.query.apiKey}`,
    },
    body: JSON.stringify({
      site_id: options.query.siteId,
      metrics: ['events'],
      date_range: range === 'all' ? 'all' : [range.start, range.end],
      dimensions: ['event:goal'],
      filters: [['is', 'event:goal', [...HAOO_REPORT_EVENTS]]],
    }),
  });

  if (!response.ok) return null;

  const body: unknown = await response.json();
  const counts = parseGoalCounts(body, HAOO_REPORT_EVENTS);
  if (counts === null) return null;

  return { counts, resolvedStart: resolvedStartDay(body) };
}

/** D-03 locks exactly these three bounded views. */
const BOUNDED_PERIOD_DAYS = [7, 30, 90] as const;

/** UI-SPEC empty-state heading, used instead of a date the provider did not report. */
const NO_RECORDED_DAY = 'No recorded actions in this period';

function totalOf(counts: Readonly<Record<string, number>>): number {
  return HAOO_REPORT_EVENTS.reduce((total, event) => total + (counts[event] ?? 0), 0);
}

/**
 * The all-time heading names a first recorded day only when the provider reported one.
 * When nothing was recorded at all it carries the locked empty-state heading, and when
 * the provider resolved no range it names the period alone. Neither case invents a date.
 */
function allTimeHeading(result: RangeResult): string {
  if (totalOf(result.counts) === 0) return `All time · ${NO_RECORDED_DAY}`;
  return result.resolvedStart === null
    ? 'All time'
    : `All time · since ${result.resolvedStart}`;
}

export async function generateHaooReport(
  options: GenerateHaooReportOptions,
): Promise<GenerateHaooReportResult> {
  if (options.query.apiKey.trim() === '' || options.query.siteId.trim() === '') {
    return { ok: false, reason: 'missing-credentials' };
  }

  try {
    const generatedAt = options.now();
    const today = reportDay(generatedAt, REPORT_TIMEZONE);
    const periods: ReportPeriodModel[] = [];

    // Query and validate every range before rendering anything: a report that claims
    // four periods must never be written when one of them failed.
    for (const days of BOUNDED_PERIOD_DAYS) {
      const windows = periodWindows(days, today);

      const current = await queryRange(options, windows.current);
      if (current === null) return { ok: false, reason: `invalid-current-${days}` };

      const previous = await queryRange(options, windows.previous);
      if (previous === null) return { ok: false, reason: `invalid-previous-${days}` };

      periods.push({
        id: `last-${days}-days`,
        days,
        heading: `Last ${days} days · ${windows.current.start} to ${windows.current.end}`,
        comparisonLine:
          `Compared with the previous ${days} days, `
          + `${windows.previous.start} to ${windows.previous.end}.`,
        counts: current.counts,
        previousCounts: previous.counts,
      });
    }

    const allTime = await queryRange(options, 'all');
    if (allTime === null) return { ok: false, reason: 'invalid-all-time' };

    periods.push({
      id: 'all-time',
      days: null,
      heading: allTimeHeading(allTime),
      comparisonLine: null,
      counts: allTime.counts,
      previousCounts: null,
    });

    const model: ReportModel = {
      title: REPORT_TITLE,
      generatedAt: generatedAt.toISOString(),
      timezone: REPORT_TIMEZONE,
      providerState: 'configured',
      periods,
    };

    const document = renderReport(model);
    const temporaryPath = `${options.outputPath}.tmp`;
    const directory = directoryOf(options.outputPath);

    if (directory !== '') {
      options.fs.mkdirSync(directory, { recursive: true });
    }

    options.fs.writeFileSync(temporaryPath, document);
    options.fs.renameSync(temporaryPath, options.outputPath);

    return { ok: true, outputPath: options.outputPath };
  } catch {
    // The failure sentence belongs to the terminal, never to the report file. Nothing
    // was written, so the previous report is still the last fully validated one.
    return { ok: false, reason: 'generation-failed' };
  }
}
