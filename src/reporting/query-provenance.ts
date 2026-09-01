import type { PeriodWindow } from './haoo-report.ts';

export interface EchoedQueryProvenance {
  readonly start: string;
  readonly end: string;
}

export interface ExpectedEchoedQuery {
  readonly siteId: string;
  readonly events: readonly string[];
  readonly range: PeriodWindow | 'all';
  readonly today: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sameStrings(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value)
    && value.length === expected.length
    && value.every((entry, index) => entry === expected[index]);
}

function calendarDay(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) {
    return null;
  }

  const day = value.slice(0, 10);
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

  return day;
}

export function validateEchoedQuery(
  body: unknown,
  expected: ExpectedEchoedQuery,
): EchoedQueryProvenance | null {
  try {
    if (!isPlainObject(body) || !isPlainObject(body.query)) return null;
    const query = body.query;
    if (query.site_id !== expected.siteId) return null;
    if (!sameStrings(query.metrics, ['events'])) return null;
    if (!sameStrings(query.dimensions, ['event:goal'])) return null;

    if (!Array.isArray(query.filters) || query.filters.length !== 1) return null;
    const filter = query.filters[0];
    if (!Array.isArray(filter) || filter.length !== 3) return null;
    if (filter[0] !== 'is' || filter[1] !== 'event:goal') return null;
    if (!sameStrings(filter[2], expected.events)) return null;

    if (!Array.isArray(query.date_range) || query.date_range.length !== 2) return null;
    const start = calendarDay(query.date_range[0]);
    const end = calendarDay(query.date_range[1]);
    if (start === null || end === null || start > end) return null;

    if (expected.range === 'all') {
      if (end !== expected.today || start > expected.today) return null;
    } else if (start !== expected.range.start || end !== expected.range.end) {
      return null;
    }

    return { start, end };
  } catch {
    return null;
  }
}
