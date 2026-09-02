/**
 * Shared primitives for reading an untrusted provider response (threat T-04-04).
 *
 * `stats-response.ts` and `query-provenance.ts` both parse the same response body from
 * the same request, in the same process, under the same fail-closed rule. They each
 * carried a byte-identical copy of this guard; one module is the single place the rule
 * is written, so the two validators cannot drift apart on what "an object" means.
 */

/**
 * A value that may be indexed as a record: an object, not null, not an array.
 *
 * Arrays are excluded deliberately — `typeof [] === 'object'`, so a provider could
 * otherwise smuggle an array past a shape check and have its numeric keys read as
 * fields.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
