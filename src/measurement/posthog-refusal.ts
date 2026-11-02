/**
 * Named reasons, one per gate, so a refusal says which gate refused.
 *
 * Exported because the reason is the observable half of D-05: a report that reads as zero
 * traffic is indistinguishable from a genuinely dead funnel unless the owner can tell a
 * refusing provider apart from a silent one, and a test can only assert that distinction
 * against the names themselves. Each value is a fixed, distinct, non-empty string; none of
 * them carries a visitor value, a form answer, or anything read off the page, because a
 * diagnostic channel that echoed page state would be a collection channel.
 */
export const POSTHOG_REFUSAL = Object.freeze({
  /** The build selected the provider but left half of its configuration empty. */
  unconfigured: 'posthog:unconfigured-provider-configuration',
  /** No global scope could be reached at all. */
  unreachableScope: 'posthog:unreachable-global-scope',
  /**
   * WITHDRAWN by plan `04.1-09`. Successor: `unusableBoundClient`.
   *
   * This named the refusal for an empty provider slot, on the premise that an absent
   * client meant an unconfigured page and that this module installed no stub of its own.
   * Since `04.1-09` bound the pinned SDK in a value position, an EMPTY slot is the normal
   * path rather than a refusal: `resolveClient` falls back to `boundPostHogClient()` and
   * proceeds. The gate it used to guard did not disappear — it moved to the bound value,
   * which is checked for a callable initializer on exactly the terms an ambient value is,
   * and refuses as `unusableBoundClient` when it has none.
   *
   * Retained rather than deleted, and its string value deliberately NOT repurposed. A
   * reader who finds `posthog:absent-provider-client` in an old console record, a report,
   * or a prior summary must be able to see a changed refusal vocabulary rather than
   * mistake it for a refusal path that was silently dropped (D-05, T-04.1-08). Nothing
   * returns it any more; the successor below is what a live build can emit.
   */
  absentClient: 'posthog:absent-provider-client',
  /**
   * Successor to `absentClient`: the bound module resolved, but exposes no callable
   * initializer, so the lockdown could never be sent and no readback could prove it.
   */
  unusableBoundClient: 'posthog:unusable-bound-provider-client',
  /**
   * The client gate: the ambient slot is occupied, so the value in it is not this
   * repository's and will not be initialized. Narrowed by plan `04.1-10` from "the slot
   * holds something this module will not use" to "the slot holds anything at all" —
   * strictly more values reach this reason, and none stopped reaching it.
   */
  foreignClient: 'posthog:foreign-provider-global',
  /** The initializer threw, leaving the lockdown unproven. */
  initialization: 'posthog:initialization-refused',
  /** The merged configuration did not agree with the lockdown that was sent. */
  lockdown: 'posthog:unconfirmed-lockdown-readback',
  /** The initialized instance exposes no callable capture entry point. */
  absentCapture: 'posthog:absent-capture-entry-point',
  /**
   * The client was already established under a DIFFERENT configuration, and cannot be
   * re-initialized into this one.
   *
   * Added with the establishment record below (code-review WR-01). At the pinned SDK
   * version the vendor's initializer short-circuits on re-entry — `if (this.__loaded)
   * return …, this` — and KEEPS the configuration of the first call, so a second
   * configuration sent to the same client is not applied. This module refuses to pretend
   * otherwise: it will not hand back a sink whose events would travel under a project key
   * and an allowlist the caller did not ask for.
   *
   * It exists as its OWN reason rather than reusing `lockdown` because the two say
   * different things. `lockdown` means "the privacy lockdown could not be confirmed" —
   * the loudest alarm this phase raises (D-05) — and firing it here would send an owner
   * hunting a privacy regression that does not exist. This one means "the lockdown that
   * is installed is a different, already-confirmed one".
   */
  reconfiguration: 'posthog:refused-client-reconfiguration',
} as const);
