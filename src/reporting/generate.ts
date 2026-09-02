import {
  comparisonLine,
  HAOO_REPORT_EVENTS,
  periodWindows,
  REPORT_ALL_TIME_COMPARISON,
  REPORT_EMPTY_STATE_HEADING,
  REPORT_PERIOD_LABELS,
} from './haoo-report.ts';
import { parseGoalCounts } from './stats-response.ts';
import { validateEchoedQuery } from './query-provenance.ts';
import type { EchoedQueryRejection } from './query-provenance.ts';
import { renderReport } from './render.ts';
import type { PeriodWindow, ReportPeriodId } from './haoo-report.ts';
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

/**
 * The Plausible site reporting timezone; the report states it and derives its days in it.
 *
 * It is a repository-owned assertion, so it is checked against the provider rather than
 * trusted: every echoed range carries the site's own UTC offset, and a disagreement aborts
 * the run with `TIMEZONE_MISMATCH_REASON` instead of the generic query failure. Without
 * that check a site configured in another timezone made the all-time range fail only
 * between midnight and the offset, so the command looked intermittently broken and its
 * terminal advice pointed at the API key.
 */
const REPORT_TIMEZONE = 'Africa/Nairobi';

/**
 * The failure reason carrying the asserted timezone, so the owner command can name the
 * setting to change. Consumed by `scripts/generate-haoo-report.mjs`.
 */
export const TIMEZONE_MISMATCH_REASON_PREFIX = 'timezone-mismatch:';

/**
 * The failure reason carrying the temporary sibling that could not be reserved.
 *
 * The sibling is a fixed name reserved exclusively, so it is also a cross-invocation
 * mutex -- and an uncatchable termination between reservation and rename leaves it
 * behind. Every later run then fails at reservation forever. Folding that into the
 * generic reason told the owner to check the API key, which can never fix it, about a
 * file inside a directory they are told never to inspect. The path travels with the
 * reason so the terminal can name the one file to delete.
 */
export const TEMP_PATH_IN_USE_REASON_PREFIX = 'temp-path-in-use:';
const REPORT_TITLE = 'HAOO funnel report';

/** Per-request budget; see `ReportRequestInit.signal`. */
const REPORT_REQUEST_TIMEOUT_MS = 30_000;

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
  /**
   * Per-request budget. Node's `fetch` has no default timeout, so a stalled connection
   * would hang the owner command indefinitely with no output at all -- across seven
   * sequential requests, any one of which can wedge. The browser submission path already
   * carries the same budget for the same reason.
   */
  readonly signal?: AbortSignal;
}

export type ReportFetch = (
  url: string,
  init: ReportRequestInit,
) => Promise<ReportResponse>;

export interface ReportFs {
  mkdirSync(path: string, options: { readonly recursive: true }): void;
  reserveTempSync(path: string): void;
  writeFileSync(path: string, data: string): void;
  renameSync(from: string, to: string): void;
  rmSync(path: string, options: { readonly force: true }): void;
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

/**
 * Minutes east of UTC for the reporting timezone at a given instant, or null when the
 * host's Intl data cannot express it. Null disables the offset comparison rather than
 * failing the report: a missing local capability must never be reported as a provider
 * misconfiguration.
 */
function zoneOffsetMinutes(date: Date, timeZone: string): number | null {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value ?? '';

  if (name === 'GMT' || name === 'UTC') return 0;
  const match = /^(?:GMT|UTC)([+-])(\d{2}):(\d{2})$/.exec(name);
  if (match === null) return null;

  const magnitude = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '-' ? -magnitude : magnitude;
}

/**
 * The parent directory of a destination, extracted without importing a Node module so
 * every filesystem effect keeps arriving through the injected `ReportFs` capability and
 * this module keeps no host-specific seam.
 *
 * The owner command builds its destination with Node's platform-native `resolve`, so the
 * separator is a backslash on a non-POSIX host. Looking for a forward slash only would
 * extract nothing there, skip creation, and fail a first run before it could write.
 *
 * The separator set is therefore a property of the destination's shape, not of this
 * module: only a destination carrying a drive designator such as `C:` or a UNC prefix
 * such as `\\server` is split on a backslash. On POSIX a backslash is a legal filename
 * character, so a destination of any other shape is split on a forward slash alone and a
 * backslash inside a filename can never be mistaken for a separator.
 *
 * Three shapes deliberately yield no directory: a separator at index zero, a bare drive
 * designator such as `C:`, and a bare UNC root such as `\\server` or `\\server\share`. In
 * each case the parent is a filesystem root the report does not need to create, and
 * handing one to a recursive creation would turn a working run into a caught generation
 * failure. A destination nested any deeper than a share still yields its real parent, so
 * the guard refuses roots rather than refusing UNC destinations generally.
 */
function directoryOf(path: string): string {
  const windowsShaped = /^([A-Za-z]:|\\\\)/.test(path);
  const separator = windowsShaped
    ? Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
    : path.lastIndexOf('/');

  if (separator <= 0) {
    return '';
  }

  const directory = path.slice(0, separator);
  const bareRoot = /^[A-Za-z]:$/.test(directory)
    || /^\\\\[^\\/]+(?:\\[^\\/]+)?$/.test(directory);

  return bareRoot ? '' : directory;
}

interface RangeResult {
  readonly counts: Readonly<Record<string, number>>;
  readonly resolvedStart: string | null;
}

type RangeOutcome =
  | { readonly ok: true; readonly result: RangeResult }
  | { readonly ok: false; readonly reason: EchoedQueryRejection };

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
  today: string,
  offsetMinutes: number | null,
): Promise<RangeOutcome> {
  const requestBody = {
    site_id: options.query.siteId,
    metrics: ['events'],
    date_range: range === 'all' ? 'all' : [range.start, range.end],
    dimensions: ['event:goal'],
    filters: [['is', 'event:goal', [...HAOO_REPORT_EVENTS]]],
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REPORT_REQUEST_TIMEOUT_MS);
  let response: ReportResponse;
  let body: unknown;

  try {
    response = await options.fetch(options.query.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.query.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) return { ok: false, reason: 'invalid' };

    body = await response.json();
  } finally {
    // Cleared on every exit, including an abort and a thrown transport error, so a
    // completed run never leaves a pending timer holding the process open.
    clearTimeout(timeout);
  }

  const echoed = validateEchoedQuery(body, {
    siteId: options.query.siteId,
    events: HAOO_REPORT_EVENTS,
    range,
    today,
    offsetMinutes,
  });
  if (!echoed.ok) return { ok: false, reason: echoed.reason };

  const counts = parseGoalCounts(body, HAOO_REPORT_EVENTS);
  if (counts === null) return { ok: false, reason: 'invalid' };

  return {
    ok: true,
    result: {
      counts,
      resolvedStart: range === 'all' ? echoed.provenance.start : null,
    },
  };
}

/** D-03 locks exactly these three bounded views. */
const BOUNDED_PERIOD_DAYS = [7, 30, 90] as const;

function totalOf(counts: Readonly<Record<string, number>>): number {
  return HAOO_REPORT_EVENTS.reduce((total, event) => total + (counts[event] ?? 0), 0);
}

/**
 * The all-time heading names a first recorded day only when the provider reported one.
 * When nothing was recorded at all it carries the locked empty-state heading, and when
 * the provider resolved no range it names the period alone. Neither case invents a date.
 */
function allTimeHeading(result: RangeResult): string {
  const label = REPORT_PERIOD_LABELS['all-time'];
  if (totalOf(result.counts) === 0) return `${label} · ${REPORT_EMPTY_STATE_HEADING}`;
  return result.resolvedStart === null
    ? label
    : `${label} · since ${result.resolvedStart}`;
}

export async function generateHaooReport(
  options: GenerateHaooReportOptions,
): Promise<GenerateHaooReportResult> {
  if (options.query.apiKey.trim() === '' || options.query.siteId.trim() === '') {
    return { ok: false, reason: 'missing-credentials' };
  }

  const temporaryPath = `${options.outputPath}.tmp`;
  let ownsTemporaryPath = false;

  try {
    const generatedAt = options.now();
    const today = reportDay(generatedAt, REPORT_TIMEZONE);
    const offsetMinutes = zoneOffsetMinutes(generatedAt, REPORT_TIMEZONE);
    const periods: ReportPeriodModel[] = [];

    // A refused echo that names the site's timezone is a configuration answer, not a
    // query answer: it must reach the owner as itself rather than as "check the API key".
    const failure = (
      outcome: { readonly reason: EchoedQueryRejection },
      fallback: string,
    ): GenerateHaooReportResult => ({
      ok: false,
      reason: outcome.reason === 'timezone-mismatch'
        ? `${TIMEZONE_MISMATCH_REASON_PREFIX}${REPORT_TIMEZONE}`
        : fallback,
    });

    // Query and validate every range before rendering anything: a report that claims
    // four periods must never be written when one of them failed.
    for (const days of BOUNDED_PERIOD_DAYS) {
      const windows = periodWindows(days, today);

      const current = await queryRange(options, windows.current, today, offsetMinutes);
      if (!current.ok) return failure(current, `invalid-current-${days}`);

      const previous = await queryRange(options, windows.previous, today, offsetMinutes);
      if (!previous.ok) return failure(previous, `invalid-previous-${days}`);

      const id = `last-${days}-days` as ReportPeriodId;
      const label = REPORT_PERIOD_LABELS[id];

      periods.push({
        id,
        days,
        label,
        heading: `${label} · ${windows.current.start} to ${windows.current.end}`,
        comparisonLine: comparisonLine(days, windows.previous),
        window: windows.current,
        empty: totalOf(current.result.counts) === 0,
        counts: current.result.counts,
        previousCounts: previous.result.counts,
      });
    }

    const allTime = await queryRange(options, 'all', today, offsetMinutes);
    if (!allTime.ok) return failure(allTime, 'invalid-all-time');

    periods.push({
      id: 'all-time',
      days: null,
      label: REPORT_PERIOD_LABELS['all-time'],
      heading: allTimeHeading(allTime.result),
      comparisonLine: REPORT_ALL_TIME_COMPARISON,
      // The all-time window is named only when the provider resolved a first recorded
      // day; otherwise the document carries no dates for it rather than inventing them.
      window: allTime.result.resolvedStart === null
        ? null
        : { start: allTime.result.resolvedStart, end: today },
      empty: totalOf(allTime.result.counts) === 0,
      counts: allTime.result.counts,
      previousCounts: null,
    });

    const model: ReportModel = {
      title: REPORT_TITLE,
      generatedAt: generatedAt.toISOString(),
      timezone: REPORT_TIMEZONE,
      siteScope: options.query.siteId,
      periods,
    };

    const document = renderReport(model);
    const directory = directoryOf(options.outputPath);

    if (directory !== '') {
      options.fs.mkdirSync(directory, { recursive: true });
    }

    // The fixed sibling is reserved exclusively only after every response validates
    // and the full document exists in memory. A competing invocation therefore fails
    // before writing and, because it never owns the sibling, must not remove it.
    try {
      options.fs.reserveTempSync(temporaryPath);
    } catch {
      // Reported as itself rather than as a query failure: this invocation never owned
      // the sibling, so it must not remove it, and only the owner can decide to.
      return {
        ok: false,
        reason: `${TEMP_PATH_IN_USE_REASON_PREFIX}${temporaryPath}`,
      };
    }
    ownsTemporaryPath = true;
    options.fs.writeFileSync(temporaryPath, document);
    options.fs.renameSync(temporaryPath, options.outputPath);
    ownsTemporaryPath = false;

    return { ok: true, outputPath: options.outputPath };
  } catch {
    if (ownsTemporaryPath) {
      try {
        options.fs.rmSync(temporaryPath, { force: true });
      } catch {
        // Cleanup is best effort and must never replace the primary failure reason.
      }
    }

    // Caught filesystem failures remove the sibling owned by this invocation. An
    // uncatchable termination may leave that reserved sibling behind; the next run then
    // fails closed at exclusive reservation rather than guessing ownership. At no point
    // is the previous complete destination truncated or partially replaced.
    return { ok: false, reason: 'generation-failed' };
  }
}
