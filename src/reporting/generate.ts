import {
  comparisonLine,
  HAOO_REPORT_EVENTS,
  periodWindows,
  REPORT_ALL_TIME_COMPARISON,
  REPORT_EMPTY_STATE_HEADING,
  REPORT_PERIOD_LABELS,
} from './haoo-report.ts';
import { parseGoalCounts } from './stats-response.ts';
import { HOGQL_QUERY_KIND, validateEchoedQuery } from './query-provenance.ts';
import type { EchoedQueryRejection } from './query-provenance.ts';
import { isPlainObject } from './untrusted.ts';
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
 * Write-on-success only: every query is issued and validated, the whole document is
 * rendered in memory, a temporary sibling is written, and only then is it renamed onto
 * the destination. A failed query, an unknown or duplicate goal row, or a non-integer
 * count aborts before any write, leaving the previous report byte-identical.
 *
 * Loaded by a `.mjs` entry through Node's native TypeScript type stripping, so it uses
 * erasable syntax only and imports by explicit `.ts` extension.
 */

/**
 * The reporting timezone; the report states it and derives its days in it.
 *
 * It is still a repository-owned assertion, and it still derives every window the report
 * names -- but it is now pinned INSIDE the submitted query text rather than checked
 * against a remote provider setting. The query converts each event timestamp into this
 * zone before comparing it to a day boundary, so the provider evaluates the report's own
 * definition of a day and cannot disagree with it.
 *
 * That retires a failure mode rather than porting it. The previous provider derived days
 * from a site setting this repository did not own, so a site configured in another zone
 * made the all-time range fail only between midnight and the offset -- the command looked
 * intermittently broken and its terminal advice pointed at the API key. There is no
 * remote setting left to disagree with, so the mismatch abort, its reason prefix, its
 * rejection member, and its terminal sentence are all gone rather than reimplemented.
 */
const REPORT_TIMEZONE = 'Africa/Nairobi';

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
  readonly projectId: string;
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

/**
 * The row limit every aggregate carries, comfortably above the ten allowlisted names.
 *
 * The provider's default page is 100 rows and `OFFSET` paging is not supported for
 * programmatic requests, so a truncated page would not be detectable as truncation -- an
 * eleventh allowlisted name would simply arrive as a silently wrong zero. Stating the
 * limit makes the absence of truncation a property of the query rather than a default.
 */
const REPORT_ROW_LIMIT = 100;

/** The ten allowlisted names as SQL string literals, written once from the allowlist. */
function eventNameLiterals(): string {
  return HAOO_REPORT_EVENTS.map((event) => `'${event}'`).join(', ');
}

/**
 * One aggregate over the allowlisted names, optionally bounded to an inclusive calendar
 * range in the reporting timezone.
 *
 * The count is the provider's own aggregate, never this project's arithmetic over rows it
 * fetched: the endpoint is explicitly not an export API, and counting locally would make
 * the report's numbers this repository's claim rather than the provider's answer.
 *
 * Both bounds are compared as whole days after converting the event timestamp into the
 * reporting timezone, and both comparisons are inclusive -- an action at any moment of the
 * start day and one at any moment of the end day are both inside the window. Bounded
 * periods carry explicit calendar dates rather than a relative preset because the nearest
 * preset is 91 days and D-03 locks 90.
 */
function haooFunnelSql(range: PeriodWindow | 'all'): string {
  const bounds = range === 'all'
    ? ''
    : `\n  AND toDate(toTimeZone(timestamp, '${REPORT_TIMEZONE}')) >= toDate('${range.start}')`
      + `\n  AND toDate(toTimeZone(timestamp, '${REPORT_TIMEZONE}')) <= toDate('${range.end}')`;

  return 'SELECT event, count() AS occurrences\n'
    + 'FROM events\n'
    + `WHERE event IN (${eventNameLiterals()})${bounds}\n`
    + 'GROUP BY event\n'
    + 'ORDER BY event\n'
    + `LIMIT ${REPORT_ROW_LIMIT}`;
}

/**
 * The first day on which any allowlisted action was recorded, in the reporting timezone.
 *
 * The previous provider echoed the range it resolved for an open-ended query, so the
 * all-time heading could name a first recorded day from the echo alone. This provider
 * echoes the query but not the window it resolved, so the day is asked for in its own
 * single-value query rather than inferred.
 */
function firstRecordedDaySql(): string {
  return `SELECT toString(toDate(toTimeZone(min(timestamp), '${REPORT_TIMEZONE}'))) AS first_day\n`
    + 'FROM events\n'
    + `WHERE event IN (${eventNameLiterals()})\n`
    + 'LIMIT 1';
}

/** Descriptive names, so a query in the provider's activity log is identifiable as this report's. */
const FUNNEL_QUERY_NAME = 'HAOO funnel occurrences by recorded action';
const FIRST_DAY_QUERY_NAME = 'HAOO funnel first recorded day';

type SubmissionOutcome =
  | { readonly ok: true; readonly body: unknown }
  | { readonly ok: false; readonly reason: EchoedQueryRejection };

/**
 * Submits one query and proves the response answered that exact query.
 *
 * The key is passed only in the `Authorization` header — never in the request body, never
 * logged, and never returned. The submitted SQL is handed to the echo validator so a
 * response can be bound to the question it answered; the project it ran against cannot be
 * bound, which is stated in the report's own caveat block rather than left implicit.
 */
async function submitQuery(
  options: GenerateHaooReportOptions,
  sql: string,
  name: string,
): Promise<SubmissionOutcome> {
  const requestBody = { query: { kind: HOGQL_QUERY_KIND, query: sql }, name };
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

  const echoed = validateEchoedQuery(body, { sql });
  if (!echoed.ok) return { ok: false, reason: echoed.reason };

  return { ok: true, body };
}

type RangeOutcome =
  | { readonly ok: true; readonly counts: Readonly<Record<string, number>> }
  | { readonly ok: false; readonly reason: EchoedQueryRejection };

/** One aggregate query for one range, echo-validated and then row-validated. */
async function queryRange(
  options: GenerateHaooReportOptions,
  range: PeriodWindow | 'all',
): Promise<RangeOutcome> {
  const submitted = await submitQuery(options, haooFunnelSql(range), FUNNEL_QUERY_NAME);
  if (!submitted.ok) return submitted;

  const counts = parseGoalCounts(submitted.body, HAOO_REPORT_EVENTS);
  if (counts === null) return { ok: false, reason: 'invalid' };

  return { ok: true, counts };
}

type FirstDayOutcome =
  | { readonly ok: true; readonly day: string | null }
  | { readonly ok: false; readonly reason: EchoedQueryRejection };

/** An ISO calendar day and nothing looser, so a provider string can never become a heading. */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reads the single-value first-recorded-day response, refusing every shape that is not
 * exactly no rows or exactly one single-element row.
 *
 * No rows means nothing has been recorded and there is no day to name -- not a refusal,
 * and not a licence to invent one. Anything else is a refusal that aborts before any
 * write, on the same fail-closed footing as `parseGoalCounts`: a heading that names a
 * wrong first day is a claim the report cannot support.
 */
function parseFirstRecordedDay(body: unknown): FirstDayOutcome {
  try {
    if (!isPlainObject(body)) return { ok: false, reason: 'invalid' };
    if (!Array.isArray(body.results)) return { ok: false, reason: 'invalid' };
    if (body.results.length === 0) return { ok: true, day: null };
    if (body.results.length !== 1) return { ok: false, reason: 'invalid' };

    const row: unknown = body.results[0];
    if (!Array.isArray(row) || row.length !== 1) return { ok: false, reason: 'invalid' };

    const day: unknown = row[0];
    if (typeof day !== 'string' || !ISO_DAY.test(day)) return { ok: false, reason: 'invalid' };

    return { ok: true, day };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

/** The first recorded day, asked for in its own query because no echo can supply it. */
async function queryFirstRecordedDay(
  options: GenerateHaooReportOptions,
): Promise<FirstDayOutcome> {
  const submitted = await submitQuery(
    options,
    firstRecordedDaySql(),
    FIRST_DAY_QUERY_NAME,
  );
  if (!submitted.ok) return submitted;

  return parseFirstRecordedDay(submitted.body);
}

/** D-03 locks exactly these three bounded views. */
const BOUNDED_PERIOD_DAYS = [7, 30, 90] as const;

function totalOf(counts: Readonly<Record<string, number>>): number {
  return HAOO_REPORT_EVENTS.reduce((total, event) => total + (counts[event] ?? 0), 0);
}

/**
 * The all-time heading names a first recorded day only when the provider reported one.
 * When nothing was recorded at all it carries the locked empty-state heading, and when
 * the provider resolved no first day it names the period alone. Neither case invents a
 * date.
 */
function allTimeHeading(
  counts: Readonly<Record<string, number>>,
  resolvedStart: string | null,
): string {
  const label = REPORT_PERIOD_LABELS['all-time'];
  if (totalOf(counts) === 0) return `${label} · ${REPORT_EMPTY_STATE_HEADING}`;
  return resolvedStart === null ? label : `${label} · since ${resolvedStart}`;
}

export async function generateHaooReport(
  options: GenerateHaooReportOptions,
): Promise<GenerateHaooReportResult> {
  if (options.query.apiKey.trim() === '' || options.query.projectId.trim() === '') {
    return { ok: false, reason: 'missing-credentials' };
  }

  const temporaryPath = `${options.outputPath}.tmp`;
  let ownsTemporaryPath = false;

  try {
    const generatedAt = options.now();
    const today = reportDay(generatedAt, REPORT_TIMEZONE);
    const periods: ReportPeriodModel[] = [];

    // Query and validate every range before rendering anything: a report that claims
    // four periods must never be written when one of them failed. The rejection union
    // collapsed to a single member with the timezone migration, so a refusal is now
    // always named by which query it was rather than by which kind of disagreement.
    for (const days of BOUNDED_PERIOD_DAYS) {
      const windows = periodWindows(days, today);

      const current = await queryRange(options, windows.current);
      if (!current.ok) return { ok: false, reason: `invalid-current-${days}` };

      const previous = await queryRange(options, windows.previous);
      if (!previous.ok) return { ok: false, reason: `invalid-previous-${days}` };

      const id = `last-${days}-days` as ReportPeriodId;
      const label = REPORT_PERIOD_LABELS[id];

      periods.push({
        id,
        days,
        label,
        heading: `${label} · ${windows.current.start} to ${windows.current.end}`,
        comparisonLine: comparisonLine(days, windows.previous),
        window: windows.current,
        empty: totalOf(current.counts) === 0,
        counts: current.counts,
        previousCounts: previous.counts,
      });
    }

    const allTime = await queryRange(options, 'all');
    if (!allTime.ok) return { ok: false, reason: 'invalid-all-time' };

    // Asked for separately because the echo cannot supply it. A refusal here aborts the
    // whole run rather than degrading to an unnamed heading: a wrong first day would be
    // a claim, and silently dropping it would hide a response this report did not
    // understand.
    const firstDay = await queryFirstRecordedDay(options);
    if (!firstDay.ok) return { ok: false, reason: 'invalid-all-time-start' };

    periods.push({
      id: 'all-time',
      days: null,
      label: REPORT_PERIOD_LABELS['all-time'],
      heading: allTimeHeading(allTime.counts, firstDay.day),
      comparisonLine: REPORT_ALL_TIME_COMPARISON,
      // The all-time window is named only when the provider resolved a first recorded
      // day; otherwise the document carries no dates for it rather than inventing them.
      window: firstDay.day === null ? null : { start: firstDay.day, end: today },
      empty: totalOf(allTime.counts) === 0,
      counts: allTime.counts,
      previousCounts: null,
    });

    const model: ReportModel = {
      title: REPORT_TITLE,
      generatedAt: generatedAt.toISOString(),
      timezone: REPORT_TIMEZONE,
      projectScope: options.query.projectId,
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
