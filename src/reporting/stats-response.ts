/**
 * Fail-closed validation of an untrusted provider response (threat T-04-04).
 *
 * The provider controls the event names, the row count, and the count values, so the
 * response crosses a trust boundary before anything is rendered. This follows the
 * `parseContext` template in `src/measurement/index.ts`: validate inside a `try`, reject
 * anything that is not a plain object, check every field explicitly, and rebuild a fresh
 * literal rather than spreading the untrusted record. Every rejection path returns
 * `null` and never throws; the caller aborts without writing.
 */

import { isPlainObject } from './untrusted.ts';

/**
 * The exact projection the HogQL aggregate selects, in the exact order it selects it.
 *
 * A HogQL response returns `results` as positional arrays, so nothing in a row states
 * which member is the name and which is the count. A reordered projection would swap
 * them and parse cleanly into wrong numbers -- ten believable integers attached to the
 * wrong actions, with no refusal anywhere. Asserting the pair for exact equality is what
 * makes the positional read safe.
 */
export const HOGQL_EXPECTED_COLUMNS = ['event', 'occurrences'] as const;

/**
 * Reads a HogQL aggregate response into one integer per allowlisted event name.
 *
 * An event absent from the response is a real zero for the period and is filled with `0`.
 * An unknown event row, a duplicate event row, a non-integer count, a negative count, or
 * a count that is not finite is a refusal, because a partially trusted response would
 * silently change a stage total.
 */
export function parseGoalCounts(
  body: unknown,
  allowedGoals: readonly string[],
): Readonly<Record<string, number>> | null {
  try {
    if (!isPlainObject(body)) return null;

    // Asserted before the row loop: a reordered or renamed projection invalidates every
    // row that follows it, so there is no point reading one.
    const columns = body.columns;
    if (!Array.isArray(columns)) return null;
    if (columns.length !== HOGQL_EXPECTED_COLUMNS.length) return null;
    if (!HOGQL_EXPECTED_COLUMNS.every((name, index) => columns[index] === name)) return null;

    if (!Array.isArray(body.results)) return null;

    const allowed = new Set(allowedGoals);
    const seen = new Map<string, number>();

    for (const row of body.results) {
      if (!Array.isArray(row) || row.length !== 2) return null;

      const goal = row[0];
      if (typeof goal !== 'string' || !allowed.has(goal)) return null;
      if (seen.has(goal)) return null;

      const count = row[1];
      if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) return null;

      seen.set(goal, count);
    }

    const counts: Record<string, number> = {};
    for (const goal of allowedGoals) {
      counts[goal] = seen.get(goal) ?? 0;
    }

    return counts;
  } catch {
    return null;
  }
}
