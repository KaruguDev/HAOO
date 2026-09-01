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
 * One aggregate query for one inclusive calendar range. The key is passed only in the
 * `Authorization` header — never in the query object, never logged, and never returned.
 */
async function queryRange(
  options: GenerateHaooReportOptions,
  window: PeriodWindow,
): Promise<Readonly<Record<string, number>> | null> {
  const response = await options.fetch(options.query.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.query.apiKey}`,
    },
    body: JSON.stringify({
      site_id: options.query.siteId,
      metrics: ['events'],
      date_range: [window.start, window.end],
      dimensions: ['event:goal'],
      filters: [['is', 'event:goal', [...HAOO_REPORT_EVENTS]]],
    }),
  });

  if (!response.ok) return null;

  return parseGoalCounts(await response.json(), HAOO_REPORT_EVENTS);
}

const BOUNDED_PERIOD_DAYS = 30;

export async function generateHaooReport(
  options: GenerateHaooReportOptions,
): Promise<GenerateHaooReportResult> {
  if (options.query.apiKey.trim() === '' || options.query.siteId.trim() === '') {
    return { ok: false, reason: 'missing-credentials' };
  }

  try {
    const generatedAt = options.now();
    const today = reportDay(generatedAt, REPORT_TIMEZONE);
    const windows = periodWindows(BOUNDED_PERIOD_DAYS, today);

    const counts = await queryRange(options, windows.current);
    if (counts === null) return { ok: false, reason: 'invalid-current-period' };

    const previousCounts = await queryRange(options, windows.previous);
    if (previousCounts === null) return { ok: false, reason: 'invalid-previous-period' };

    const period: ReportPeriodModel = {
      id: `last-${BOUNDED_PERIOD_DAYS}-days`,
      days: BOUNDED_PERIOD_DAYS,
      heading:
        `Last ${BOUNDED_PERIOD_DAYS} days · ${windows.current.start} to ${windows.current.end}`,
      comparisonLine:
        `Compared with the previous ${BOUNDED_PERIOD_DAYS} days, `
        + `${windows.previous.start} to ${windows.previous.end}.`,
      counts,
      previousCounts,
    };

    const model: ReportModel = {
      title: REPORT_TITLE,
      generatedAt: generatedAt.toISOString(),
      timezone: REPORT_TIMEZONE,
      providerState: 'configured',
      periods: [period],
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
