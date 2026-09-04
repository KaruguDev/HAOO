import type { CaptureResult, PostHogConfig } from 'posthog-js';

/**
 * The provider initialization options this project sends, and the only ones it sends.
 *
 * The vendor's defaults are the opposite of every privacy decision this project has
 * made, so this object is written as a closed lockdown rather than as a short list of
 * overrides. It carries a `satisfies` clause against the SDK's own partial config type,
 * and deliberately NOT `as const`: the SDK's `init` signature is
 * `OnlyValidKeys<Partial<PostHogConfig>, ...>`, so a renamed or removed option becomes a
 * `npm run typecheck` failure — a free build-time partner to the runtime readback below.
 * `as const` would widen that away, and an excess-property check on the literal is what
 * catches a misspelled key.
 *
 * Why each option is here, and why the absent ones are absent:
 *
 * - `token` is passed BOTH as the first `init` argument and inside the configuration.
 *   The SDK does not throw on a blank or duplicate project key — it logs and returns the
 *   instance — so carrying it here is what lets `lockdownHolds` re-read the resolved key
 *   and refuse a build that initialized against something other than what it intended
 *   (T-04.1-15).
 * - `api_host` is the resolved approved ingestion origin. It is never a literal in this
 *   file: the origin is repository-owned data that reaches a bundle through one
 *   provider-gated build-time constant, so the value arrives as a parameter.
 * - `ui_host: null` and `opt_in_site_apps: false` keep the vendor's own hosted surfaces
 *   out of the page entirely.
 * - `defaults: 'unset'` pins behaviour to the values written here rather than to the
 *   vendor's date-gated default bundle, which moves inside its own major line.
 * - `internal_or_test_user_hostname: null` is explicit because a non-null value enables
 *   person processing, which this project never wants under any hostname.
 * - `autocapture`, `rageclick`, `capture_pageview`, `capture_dead_clicks`,
 *   `capture_heatmaps`, `capture_exceptions`, `capture_performance` are the automatic
 *   channels. **Four of them — heatmaps, exceptions, performance and dead clicks —
 *   default to `undefined`, which does not mean "off": it means "fall back to the
 *   server-side remote configuration".** An explicit `false` is therefore necessary but
 *   NOT sufficient on its own.
 * - `advanced_disable_flags: true` is what makes those four unbypassable. The remote
 *   configuration loader returns early when flags are disabled, so without this option a
 *   toggle in the project UI re-enables automatic capture regardless of what is written
 *   here. It is the single most load-bearing line in this object (T-04.1-01).
 * - `capture_pageleave` defaults to the coupled string `'if_capture_pageview'`, not to a
 *   boolean. It is set to a literal `false` and asserted as a literal `false` below,
 *   never as the coupled string, so the coupling cannot quietly re-enable it.
 * - `disable_session_recording`, `disable_surveys`,
 *   `disable_surveys_automatic_display`, `disable_product_tours`,
 *   `disable_conversations`, `disable_web_experiments` and
 *   `disable_external_dependency_loading` switch off every product surface that would
 *   otherwise render vendor UI or fetch further vendor code into the page.
 * - `disable_scroll_properties: true` and `disableDeviceModel: true` remove two ambient
 *   properties the SDK would otherwise register as super-properties.
 * - `person_profiles: 'never'`, `persistence: 'memory'` and `disable_persistence: true`
 *   are the three halves of MEAS-03 (T-04.1-03): no profile is ever created, nothing is
 *   written to browser storage or cookies, and no transport reference survives a page
 *   load.
 * - `save_referrer: false`, `save_campaign_params: false` and
 *   `custom_campaign_params: []` keep the vendor out of the campaign question entirely,
 *   so the facade's own `readCampaign` remains the ONLY path by which a campaign value is
 *   ever observed or normalized.
 * - `before_send` is the property chokepoint. It is the second, independent layer under
 *   D-04: even with every automatic channel above switched off, nothing reaches the wire
 *   except an allowlisted bare name carrying the three transport keys.
 *
 * Deliberately NOT set: the deprecated `ip` option. It has no effect at this version and
 * relying on it would be a guarantee that silently does nothing. Suppressing server-side
 * geo-IP enrichment is an owner-performed project setting, gated in `04.1-08` (T-04.1-04).
 */
export const POSTHOG_LOCKDOWN = (
  apiHost: string,
  token: string,
  allowedEvents: readonly string[],
) => ({
  token,
  api_host: apiHost,
  ui_host: null,
  defaults: 'unset',
  internal_or_test_user_hostname: null,
  autocapture: false,
  rageclick: false,
  capture_dead_clicks: false,
  capture_pageview: false,
  capture_pageleave: false,
  disable_session_recording: true,
  disable_surveys: true,
  disable_surveys_automatic_display: true,
  disable_product_tours: true,
  disable_conversations: true,
  disable_web_experiments: true,
  capture_heatmaps: false,
  capture_exceptions: false,
  capture_performance: false,
  disable_scroll_properties: true,
  advanced_disable_flags: true,
  advanced_disable_feature_flags: true,
  advanced_disable_toolbar_metrics: true,
  disable_external_dependency_loading: true,
  opt_in_site_apps: false,
  person_profiles: 'never',
  persistence: 'memory',
  disable_persistence: true,
  disableDeviceModel: true,
  save_referrer: false,
  save_campaign_params: false,
  custom_campaign_params: [],
  before_send: (result: CaptureResult | null) => stripToBareName(result, allowedEvents),
} satisfies Partial<PostHogConfig>);

/**
 * The three keys the vendor's own transport requires, in the order they are copied.
 *
 * `token` and `distinct_id` are what makes the request routable and countable at all.
 * `$process_person_profile` is the one that looks droppable and is not: the SDK appends
 * it LAST, after its own property denylist has already run, and it is the only channel by
 * which the never-create-a-profile setting actually reaches ingestion. Strip it and the
 * server applies its own default instead — which is why the vendor's property denylist is
 * not the contract this project relies on, and this reducer is.
 */
export const TRANSPORT_REQUIRED_PROPERTIES = [
  'token',
  'distinct_id',
  '$process_person_profile',
] as const;

/**
 * The property chokepoint: reduce a capture to a bare name plus the three transport keys,
 * or drop it entirely.
 *
 * `allowedEvents` is passed in rather than imported so this module stays generic over the
 * product's event tuple, exactly as the measurement facade is. The comparison is plain
 * JavaScript string equality — no case folding, no trimming, no Unicode normalization —
 * so a visually identical name in a different normal form is NOT allowlisted. The
 * allowlist runs on the way OUT as well as on the way in, which is what drops anything
 * the SDK itself emits even if one of its defaults moves.
 *
 * The surviving property set is built as a FRESH literal by copying the three keys in a
 * fixed order. It is never a spread of the payload minus a denylist, because a denylist
 * inherits every key a future SDK version or a remote setting adds. Any payload missing
 * one of the three — including one whose properties object is absent or empty — is
 * dropped rather than emitted partially, and the vendor's own person-property channels
 * are removed from the envelope on the way through.
 */
export function stripToBareName(
  result: CaptureResult | null,
  allowedEvents: readonly string[],
): CaptureResult | null {
  if (result === null || typeof result !== 'object') return null;
  if (!allowedEvents.some((allowed) => allowed === result.event)) return null;

  const source: unknown = result.properties;
  if (typeof source !== 'object' || source === null) return null;

  const properties: Record<string, unknown> = {};
  for (const key of TRANSPORT_REQUIRED_PROPERTIES) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) return null;
    properties[key] = (source as Record<string, unknown>)[key];
  }

  // The surviving envelope is a fresh object carrying the vendor's own transport
  // reference and the event name, with the reduced property set written over the one it
  // arrived with. `$set`, `$set_once` and `$unset` are the vendor's person-property
  // channels: they are removed here as well as switched off in the lockdown above, so a
  // future default that started populating one of them still reaches nothing.
  const envelope: CaptureResult = { ...result, properties };
  delete envelope.$set;
  delete envelope.$set_once;
  delete envelope.$unset;

  return envelope;
}

/** What the merged configuration must agree with, beyond the fixed locked values. */
export interface PostHogLockdownExpectation {
  readonly apiHost: string;
  readonly token: string;
  /**
   * The exact `before_send` this project passed to `init`, compared by identity.
   *
   * Every other locked option is a value with a literal to compare against. A function
   * has none, and `typeof merged.before_send === 'function'` — which is what this
   * predicate used to check — accepts ANY function. That made the single most
   * privacy-load-bearing option the one option nothing proved: a client free to choose
   * what it exposes as `config` could echo back all 32 locked values verbatim and
   * substitute its own reducer, passing the readback while the property chokepoint that
   * reduces a capture to a bare name was never installed at all.
   *
   * It is supplied by the caller rather than read from `POSTHOG_LOCKDOWN` here on
   * purpose: `POSTHOG_LOCKDOWN` is a factory, so calling it again in this module would
   * mint a DIFFERENT closure and compare the resolved value against a function that was
   * never sent. The identity that matters is the one from the call that initialized this
   * instance, so the call site retains the object it sent and passes that function in.
   * This is the one member of the expectation that may not be restated locally, and the
   * reason is the opposite of drift: restating it would make the check unsatisfiable.
   */
  readonly beforeSend: unknown;
}

/**
 * Confirm the provider actually resolved the lockdown this project sent.
 *
 * The merged configuration is untrusted input: it comes back from a large third-party
 * module and it is the ONLY evidence that the options above took effect. It is therefore
 * inspected key by key against explicit literals rather than trusted to match a declared
 * config type — an assertion to `PostHogConfig` would hand this predicate the very
 * assumption it exists to refuse. The single widening to an index signature below reads
 * the object structurally; it asserts nothing about the values, which is what every line
 * after it checks.
 *
 * The restatement of each locked value here is deliberate duplication, not drift. Deriving
 * the expectations from `POSTHOG_LOCKDOWN` would make this predicate vacuous: it would
 * then prove the object equals itself rather than that the SDK resolved to it.
 *
 * Requiring the resolved values — rather than merely the absence of a throw from `init` —
 * is what closes the silent-no-op initializer, which the vendor reports through a log line
 * rather than an exception (T-04.1-15).
 */
export function lockdownHolds(
  resolved: unknown,
  expected: PostHogLockdownExpectation,
): boolean {
  if (typeof resolved !== 'object' || resolved === null) return false;

  const merged = resolved as Record<string, unknown>;
  const campaignParams = merged.custom_campaign_params;

  return (
    merged.token === expected.token &&
    merged.api_host === expected.apiHost &&
    merged.ui_host === null &&
    merged.defaults === 'unset' &&
    merged.internal_or_test_user_hostname === null &&
    merged.autocapture === false &&
    merged.rageclick === false &&
    merged.capture_dead_clicks === false &&
    merged.capture_pageview === false &&
    // Asserted as a literal `false`, never as the coupled `'if_capture_pageview'`.
    merged.capture_pageleave === false &&
    merged.disable_session_recording === true &&
    merged.disable_surveys === true &&
    merged.disable_surveys_automatic_display === true &&
    merged.disable_product_tours === true &&
    merged.disable_conversations === true &&
    merged.disable_web_experiments === true &&
    merged.capture_heatmaps === false &&
    merged.capture_exceptions === false &&
    merged.capture_performance === false &&
    merged.disable_scroll_properties === true &&
    // The switch that makes the four remote-controlled options above unbypassable.
    merged.advanced_disable_flags === true &&
    merged.advanced_disable_feature_flags === true &&
    merged.advanced_disable_toolbar_metrics === true &&
    merged.disable_external_dependency_loading === true &&
    merged.opt_in_site_apps === false &&
    merged.person_profiles === 'never' &&
    merged.persistence === 'memory' &&
    merged.disable_persistence === true &&
    merged.disableDeviceModel === true &&
    merged.save_referrer === false &&
    merged.save_campaign_params === false &&
    Array.isArray(campaignParams) &&
    campaignParams.length === 0 &&
    // Identity, not `typeof`. The chokepoint is only installed if the function that came
    // back is the very function that went in; any other function — including one the
    // client minted for itself — is an unconfirmed lockdown. The `typeof` guard is kept
    // ahead of it so the assertion still reads as a claim about a callable, and so an
    // expectation carrying a non-function could never accidentally satisfy it.
    typeof merged.before_send === 'function' &&
    merged.before_send === expected.beforeSend
  );
}
