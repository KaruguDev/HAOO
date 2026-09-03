import { isPlainObject } from './untrusted.ts';

/**
 * Proof that the response answered the query this report submitted.
 *
 * The previous provider echoed the site the query ran against; the Query API echoes the
 * query and the compiled HogQL but **not** the project. That is a real weakening: a
 * response can no longer be bound to the project it came from. It is stated in the
 * report's own caveat block (`REPORT_CAVEATS` in `haoo-report.ts`) rather than dropped
 * silently, and it is the reason the one remaining check is made as strict as it can be.
 */
export interface EchoedQueryProvenance {
  /** The echoed query text, proven equal to the submitted SQL. */
  readonly query: string;
}

/**
 * Why an echo was refused.
 *
 * The union collapsed to a single member with this migration. The member removed here
 * was reserved for the one refusal that was evidence about the *site's* configuration
 * rather than about the response -- the provider answered coherently, but in a different
 * reporting timezone than the report asserts. The reporting timezone is now pinned inside
 * the submitted SQL, so the provider cannot disagree with the report about day
 * boundaries. The failure mode is retired rather than ported, and there is nothing left
 * for a second member to name.
 */
export type EchoedQueryRejection = 'invalid';

export type EchoedQueryResult =
  | { readonly ok: true; readonly provenance: EchoedQueryProvenance }
  | { readonly ok: false; readonly reason: EchoedQueryRejection };

/** The one query kind this report submits, and therefore the only one it accepts back. */
export const HOGQL_QUERY_KIND = 'HogQLQuery';

export interface ExpectedEchoedQuery {
  /** The exact SQL text this report submitted, byte-for-byte. */
  readonly sql: string;
}

function refuse(reason: EchoedQueryRejection): EchoedQueryResult {
  return { ok: false, reason };
}

/**
 * Accepts a response whose echoed query is exactly the submitted SQL.
 *
 * One equality subsumes every per-member check the previous provider needed. The SQL text
 * contains the event allowlist, both range bounds, the grouping, and the row limit, so
 * echoing it back unchanged proves all of those facts at once -- the metrics, dimensions,
 * filter and date-range echo checks were deleted because this check already covers them,
 * not because the coverage was given up.
 *
 * The comparison is byte-exact and does not normalize whitespace: the submitted text is
 * built in this repository from repository-owned constants and is byte-stable across
 * runs, so a difference is evidence about the response rather than formatting noise.
 *
 * The exact response envelope is a MEDIUM-confidence assumption from research (A4): the
 * `HogQLQuery` echo shape was not read verbatim from the provider's documentation. Both
 * documented shapes are handled explicitly and every other shape is refused, so the first
 * live run settles the question loudly instead of parsing to zeros.
 */
export function validateEchoedQuery(
  body: unknown,
  expected: ExpectedEchoedQuery,
): EchoedQueryResult {
  try {
    if (!isPlainObject(body)) return refuse('invalid');

    const echoed = body.query;

    // Shape one: the submitted query object, echoed with its kind and its text. The kind
    // is compared too -- a response that answered another kind of query answered a
    // different question, whatever text it carries.
    if (isPlainObject(echoed)) {
      if (echoed.kind !== HOGQL_QUERY_KIND) return refuse('invalid');
      if (typeof echoed.query !== 'string') return refuse('invalid');
      if (echoed.query !== expected.sql) return refuse('invalid');

      return { ok: true, provenance: { query: echoed.query } };
    }

    // Shape two: the query text alone.
    if (typeof echoed === 'string') {
      if (echoed !== expected.sql) return refuse('invalid');

      return { ok: true, provenance: { query: echoed } };
    }

    // Neither echo shape is present. `hogql` is the provider's compiled rewriting of the
    // submitted text rather than the submitted text, so it can never stand in for this.
    return refuse('invalid');
  } catch {
    return refuse('invalid');
  }
}
