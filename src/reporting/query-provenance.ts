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

export function validateEchoedQuery(
  _body: unknown,
  _expected: ExpectedEchoedQuery,
): EchoedQueryProvenance | null {
  return null;
}
