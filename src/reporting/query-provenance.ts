import { isPlainObject } from './untrusted.ts';

/**
 * Proof that the response answered the query this report submitted.
 *
 * RESTATED 2026-09-06 in the same commit that changed what this module does, because the
 * sentence here was measured false. It read: "the Query API echoes the query and the
 * compiled HogQL but **not** the project". Measured against the live API, it echoes the
 * compiled HogQL ONLY -- `query` comes back `null` -- so the weakening is one step worse
 * than recorded: a response can be bound neither to the project it came from NOR to the
 * query it answered. Research assumption A4 was flagged medium-confidence precisely so
 * the first live run would settle this, and it did.
 *
 * Both limits are stated in the report's own caveat block (`REPORT_CAVEATS` in
 * `haoo-report.ts`) rather than dropped silently.
 */
export interface EchoedQueryProvenance {
  /**
   * The query text this report stands behind.
   *
   * When the provider echoes a query, this is that echo, proven byte-equal to the
   * submitted SQL. When the provider omits the echo, this is the submitted SQL itself.
   * Either way it is the exact text that produced the numbers; `confirmed` says which of
   * the two routes established it, so a reader is never told the provider agreed when it
   * said nothing.
   */
  readonly query: string;

  /**
   * Whether the PROVIDER confirmed this query, rather than the report merely asserting it.
   *
   * MEASURED 2026-09-06, and the reason this member exists: PostHog's Query API returns
   * `query: null`. Its published schema declares `query?: string` -- "The input query" --
   * optional, so the field is documented but not populated on this path. The report
   * therefore cannot obtain confirmation, and the honest move is to record that it did
   * not rather than to redefine confirmation down to something it can always get.
   */
  readonly confirmed: boolean;
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
 * Resolves the query provenance a response supports, and says how strong it is.
 *
 * WITHDRAWN 2026-09-06: `validateEchoedQuery`. Successor: this function.
 *
 * The old name described a check that could only ever pass or refuse, and the refusal
 * branch is the one the live provider takes on every call. Keeping the name while adding
 * an accepting third outcome would have left a reader expecting a validator and finding
 * something that resolves. The name is deliberately NOT reused, so anyone who meets
 * `validateEchoedQuery` in an old diff, summary or review sees a check that stopped
 * existing rather than assuming this function is it under new management.
 *
 * WHAT CHANGED, and what did not. The byte-exact equality is UNCHANGED and still the
 * strongest thing here: whenever the provider supplies an echo, that echo must equal the
 * submitted SQL exactly, and a mismatch is still refused. One equality still subsumes
 * every per-member check the previous provider needed -- the SQL text contains the event
 * allowlist, both range bounds, the grouping and the row limit -- so nothing that worked
 * has been relaxed to make the live call succeed.
 *
 * What changed is the treatment of a response that carries NO echo. That was a refusal
 * and is now an accepted outcome with `confirmed: false`. The evidence forcing the change
 * is a measurement, not a preference: PostHog returns `query: null` for every request,
 * with and without the documented `name` parameter, so the previous behaviour made the
 * owner report unable to run at all -- it failed closed on every range, on every run.
 *
 * `hogql` STILL cannot stand in for the echo, and the same measurement is why. A probe
 * submitting `SELECT 1` came back with `hogql` of `SELECT\n    1\nLIMIT 101\nOFFSET 0`:
 * the provider injects a LIMIT and an OFFSET the caller never wrote. `hogql` is the
 * provider's compiled rewriting of the submitted text, demonstrably not the submitted
 * text, and accepting it would print a query the report did not send.
 *
 * The comparison remains byte-exact and does not normalize whitespace: the submitted text
 * is built in this repository from repository-owned constants and is byte-stable across
 * runs, so a difference is evidence about the response rather than formatting noise.
 */
export function resolveQueryProvenance(
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

      return { ok: true, provenance: { query: echoed.query, confirmed: true } };
    }

    // Shape two: the query text alone.
    if (typeof echoed === 'string') {
      if (echoed !== expected.sql) return refuse('invalid');

      return { ok: true, provenance: { query: echoed, confirmed: true } };
    }

    /*
     * Shape three: no echo at all -- the live PostHog behaviour.
     *
     * `null` and `undefined` ONLY. This is not a catch-all: a response putting a number,
     * an array or a boolean in `query` is a shape this report does not understand, and
     * understanding it as "absent" would be inventing a reading. Those still refuse
     * below, so the widening is exactly as wide as the measurement that forced it.
     *
     * The provenance is the submitted SQL, which this repository owns and can state
     * exactly; `confirmed: false` records that the provider vouched for none of it.
     */
    if (echoed === null || echoed === undefined) {
      return { ok: true, provenance: { query: expected.sql, confirmed: false } };
    }

    return refuse('invalid');
  } catch {
    return refuse('invalid');
  }
}
