/**
 * Fail-closed validation of an untrusted provider response (threat T-04-04).
 *
 * The provider controls the goal names, the row count, and the count values, so the
 * response crosses a trust boundary before anything is rendered. This follows the
 * `parseContext` template in `src/measurement/index.ts`: validate inside a `try`, reject
 * anything that is not a plain object, check every field explicitly, and rebuild a fresh
 * literal rather than spreading the untrusted record. Every rejection path returns
 * `null` and never throws; the caller aborts without writing.
 */

import { isPlainObject } from './untrusted.ts';

/**
 * Reads a Stats API v2 aggregate response into one integer per allowlisted goal.
 *
 * A goal absent from the response is a real zero for the period and is filled with `0`.
 * An unknown goal row, a duplicate goal row, a non-integer count, a negative count, or a
 * count that is not finite is a refusal, because a partially trusted response would
 * silently change a stage total.
 */
export function parseGoalCounts(
  body: unknown,
  allowedGoals: readonly string[],
): Readonly<Record<string, number>> | null {
  try {
    if (!isPlainObject(body)) return null;
    if (!Array.isArray(body.results)) return null;

    const allowed = new Set(allowedGoals);
    const seen = new Map<string, number>();

    for (const row of body.results) {
      if (!isPlainObject(row)) return null;
      if (!Array.isArray(row.dimensions) || row.dimensions.length !== 1) return null;
      if (!Array.isArray(row.metrics) || row.metrics.length !== 1) return null;

      const goal = row.dimensions[0];
      if (typeof goal !== 'string' || !allowed.has(goal)) return null;
      if (seen.has(goal)) return null;

      const count = row.metrics[0];
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
