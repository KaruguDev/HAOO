import type { PeriodWindow } from './haoo-report.ts';

export interface EchoedQueryProvenance {
  readonly start: string;
  readonly end: string;
  /**
   * The UTC offset the provider echoed on its range bounds — `'Z'` or `'+03:00'` — or
   * null when the bounds were bare calendar days carrying no offset evidence. This is
   * the only observable statement the provider makes about the timezone it aggregates
   * in, so it is kept rather than discarded.
   */
  readonly offset: string | null;
}

/**
 * Why an echo was refused. `timezone-mismatch` is reserved for the one refusal that is
 * evidence about the *site's* configuration rather than about the response: the provider
 * answered coherently, but in a different reporting timezone than the report asserts.
 * Collapsing it into `invalid` is what made a site-timezone misconfiguration present as
 * an intermittent credential failure.
 */
export type EchoedQueryRejection = 'invalid' | 'timezone-mismatch';

export type EchoedQueryResult =
  | { readonly ok: true; readonly provenance: EchoedQueryProvenance }
  | { readonly ok: false; readonly reason: EchoedQueryRejection };

export interface ExpectedEchoedQuery {
  readonly siteId: string;
  readonly events: readonly string[];
  readonly range: PeriodWindow | 'all';
  readonly today: string;
  /**
   * Minutes east of UTC of the timezone the caller derived `today` in, or null/absent
   * when the caller cannot determine it. An echoed offset that disagrees with this is
   * proof that the provider aggregates in another timezone.
   */
  readonly offsetMinutes?: number | null;
}

const DAY_MILLISECONDS = 86_400_000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sameStrings(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value)
    && value.length === expected.length
    && value.every((entry, index) => entry === expected[index]);
}

interface EchoedDay {
  readonly day: string;
  readonly offset: string | null;
}

function calendarDay(value: unknown): EchoedDay | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|[+-]\d{2}:\d{2}))?$/
    .exec(value);
  if (match === null) return null;

  const day = match[1];
  const [year, month, date] = day.split('-').map(Number);
  const normalized = new Date(Date.UTC(year, month - 1, date));
  if (
    normalized.getUTCFullYear() !== year
    || normalized.getUTCMonth() !== month - 1
    || normalized.getUTCDate() !== date
    || (value.length > 10 && !Number.isFinite(Date.parse(value)))
  ) {
    return null;
  }

  return { day, offset: match[2] ?? null };
}

/** `'Z'` and `'+03:00'` as minutes east of UTC; null for anything unrecognised. */
export function offsetMinutesOf(offset: string): number | null {
  if (offset === 'Z') return 0;
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(offset);
  if (match === null) return null;

  const magnitude = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '-' ? -magnitude : magnitude;
}

/**
 * Whether two calendar days are exactly one apart. A reporting-timezone disagreement can
 * never move a day boundary by more than one, so a wider gap is a bad echo rather than a
 * timezone question.
 */
function adjacentDays(left: string, right: string): boolean {
  const first = Date.parse(`${left}T00:00:00.000Z`);
  const second = Date.parse(`${right}T00:00:00.000Z`);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return false;

  return Math.abs(first - second) === DAY_MILLISECONDS;
}

function refuse(reason: EchoedQueryRejection): EchoedQueryResult {
  return { ok: false, reason };
}

export function validateEchoedQuery(
  body: unknown,
  expected: ExpectedEchoedQuery,
): EchoedQueryResult {
  try {
    if (!isPlainObject(body) || !isPlainObject(body.query)) return refuse('invalid');
    const query = body.query;
    if (query.site_id !== expected.siteId) return refuse('invalid');
    if (!sameStrings(query.metrics, ['events'])) return refuse('invalid');
    if (!sameStrings(query.dimensions, ['event:goal'])) return refuse('invalid');

    if (!Array.isArray(query.filters) || query.filters.length !== 1) return refuse('invalid');
    const filter = query.filters[0];
    if (!Array.isArray(filter) || filter.length !== 3) return refuse('invalid');
    if (filter[0] !== 'is' || filter[1] !== 'event:goal') return refuse('invalid');
    if (!sameStrings(filter[2], expected.events)) return refuse('invalid');

    if (!Array.isArray(query.date_range) || query.date_range.length !== 2) {
      return refuse('invalid');
    }
    const startDay = calendarDay(query.date_range[0]);
    const endDay = calendarDay(query.date_range[1]);
    if (startDay === null || endDay === null || startDay.day > endDay.day) {
      return refuse('invalid');
    }

    const start = startDay.day;
    const end = endDay.day;
    const offset = endDay.offset ?? startDay.offset;

    // Direct evidence beats inference: an echoed offset that disagrees with the caller's
    // own is a definite timezone mismatch on every range, at every hour of the day.
    const expectedOffsetMinutes = expected.offsetMinutes ?? null;
    if (expectedOffsetMinutes !== null && offset !== null) {
      const echoed = offsetMinutesOf(offset);
      if (echoed !== null && echoed !== expectedOffsetMinutes) {
        return refuse('timezone-mismatch');
      }
    }

    if (expected.range === 'all') {
      if (end !== expected.today || start > expected.today) {
        // The provider resolves the all-time end in site-local time. A one-day gap is
        // what a timezone disagreement looks like when no offset was echoed to prove it.
        return refuse(adjacentDays(end, expected.today) ? 'timezone-mismatch' : 'invalid');
      }
    } else if (start !== expected.range.start || end !== expected.range.end) {
      return refuse('invalid');
    }

    return { ok: true, provenance: { start, end, offset } };
  } catch {
    return refuse('invalid');
  }
}
