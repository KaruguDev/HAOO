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
 * On 2026-09-13 the owner reversed the bare-name half of Phase 04.1 D-03 (quick task
 * `260913-p4u`) so that PostHog Web Analytics and Product Analytics work for the deployed
 * page. The automatic page visit and page exit events are now on, identity moved to
 * cookieless mode, and the property chokepoint became a fixed Web Analytics allowlist.
 * Every other subtraction below stands.
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
 * - `defaults: 'unset'` does NOT pin the date-gated default bundle, and the comment that
 *   said it did was wrong. At this version the vendor's default builder gates each key
 *   with a plain string comparison against the `defaults` value — `t >= "2026-01-30"`,
 *   `"2025-11-30" > t` — and only `session_recording` special-cases the literal
 *   `'unset'`. Lexicographically `'unset'` sorts ABOVE every date literal, so it selects
 *   the NEWEST branch of every other gate rather than "no defaults":
 *   `'unset' >= '2026-01-30'` is `true` and `'2025-11-30' > 'unset'` is `false`.
 *
 *   There is no live impact today. Every date-gated key that carries a privacy decision
 *   — `rageclick`, `capture_pageview`, `internal_or_test_user_hostname` — is explicitly
 *   overridden below and read back by `lockdownHolds`, so the branch the vendor would
 *   have chosen never survives. What the option does not do is protect the keys that are
 *   NOT in this object: a date-gated default the vendor adds in future is opted into at
 *   its newest value rather than pinned, which is the drift this option was chosen to
 *   prevent.
 *
 *   Standing rule, and it is executable rather than advisory: a version bump requires
 *   re-reading the SDK's default builder for newly date-gated keys.
 *   `measurement.test.ts` extracts every date-gated key out of the installed
 *   `posthog-js` bundle and fails on any key this project has not either locked or
 *   explicitly acknowledged, so the bump reports the new key by name.
 *
 *   Pinning for real would mean passing an early date literal instead of `'unset'`, so
 *   every comparison resolves to the oldest branch deterministically. That is a
 *   behavioural decision about which vendor default set this project adopts — not a
 *   comment correction — and it is deliberately not taken here.
 * - `internal_or_test_user_hostname: null` is explicit because a non-null value enables
 *   person processing, which this project never wants under any hostname.
 * - `cookieless_mode: 'always'` is the visitor identity decision (owner decision OD-2,
 *   2026-09-13). At the pinned 1.425.1 the SDK then sends the fixed `$posthog_cookieless`
 *   sentinel instead of a per-browser distinct id, stamps `$cookieless_mode: true` on every
 *   event, forces persistence off and builds no client-side session manager. PostHog
 *   groups visits server-side with a hash that changes every day. Events sent this way are
 *   dropped at ingestion unless the owner-performed "Cookieless server hash mode" project
 *   setting is on, which this tree cannot observe.
 * - `autocapture`, `rageclick`, `capture_dead_clicks`, `capture_heatmaps`,
 *   `capture_exceptions`, `capture_performance` are the automatic channels that stay off.
 *   **Four of them — heatmaps, exceptions, performance and dead clicks — default to
 *   `undefined`, which does not mean "off": it means "fall back to the server-side remote
 *   configuration".** An explicit `false` is therefore necessary but NOT sufficient on its
 *   own.
 * - `advanced_disable_flags: true` is what makes those four unbypassable. The remote
 *   configuration loader returns early when flags are disabled, so without this option a
 *   toggle in the project UI re-enables automatic capture regardless of what is written
 *   here. It is the single most load-bearing line in this object (T-04.1-01).
 * - `capture_pageview: true` turns on the automatic `$pageview` Web Analytics counts. The
 *   date-gated default is the string `'history_change'`, which would also count history
 *   changes; the boolean `true` captures only the initial load, one millisecond after
 *   `init`, and the facade calls `init` only after its own campaign reader has cleaned the
 *   address bar. The page is single-route, so hash links add no page visits.
 * - `capture_pageleave: true` turns on the automatic `$pageleave`, sent on page unload,
 *   which gives Web Analytics its session duration and bounce rate. The default is the
 *   coupled string `'if_capture_pageview'`, not a boolean. It is set to a literal `true`
 *   and asserted as a literal `true` below, never as the coupled string, so the coupling
 *   cannot quietly decide it.
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
 *   load. Cookieless `'always'` already forces persistence off inside the SDK
 *   (`Fl(){if("always"===this.config.cookieless_mode)return!0`); the two persistence keys
 *   stay as defence in depth and are still read back.
 * - `save_referrer: true` is required, because the SDK attaches `$referrer` and
 *   `$referring_domain` to events only through this option. Under disabled persistence the
 *   values are held in memory for the page lifetime. The reducer below cuts `$referrer`
 *   down to its origin, or keeps the literal `$direct`.
 * - `save_campaign_params: false` and `custom_campaign_params: []` keep the vendor out of
 *   the campaign question. The vendor reader would copy raw `utm_*` values and click
 *   identifiers straight from the address bar, bypassing MEAS-06 normalization. Instead the
 *   facade's own normalized campaign record arrives here as a parameter and the reducer
 *   writes it onto each delivered event.
 * - `before_send` is the property chokepoint and the second, independent layer under D-04.
 *   It admits only the product's own event names plus `$pageview` and `$pageleave`,
 *   requires the four cookieless transport keys with their exact values, and copies a fixed
 *   Web Analytics property allowlist into a fresh literal. Anything else is dropped by
 *   construction.
 *
 * Deliberately NOT set: the deprecated `ip` option. It has no effect at this version and
 * relying on it would be a guarantee that silently does nothing. Suppressing server-side
 * geo-IP enrichment is an owner-performed project setting, gated in `04.1-08` (T-04.1-04).
 */
export const POSTHOG_LOCKDOWN = (
  apiHost: string,
  token: string,
  allowedEvents: readonly string[],
  campaign: Readonly<Record<string, string>> = {},
) => {
  // Copied and frozen once, so a caller mutating its own record after `init` cannot change
  // what this instance writes onto events.
  const campaignSnapshot: Readonly<Record<string, string>> = Object.freeze({ ...campaign });

  return {
    token,
    api_host: apiHost,
    ui_host: null,
    defaults: 'unset',
    internal_or_test_user_hostname: null,
    autocapture: false,
    rageclick: false,
    capture_dead_clicks: false,
    capture_pageview: true,
    capture_pageleave: true,
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
    save_referrer: true,
    save_campaign_params: false,
    custom_campaign_params: [],
    cookieless_mode: 'always',
    before_send: (result: CaptureResult | null) =>
      reduceCapture(result, allowedEvents, campaignSnapshot),
  } satisfies Partial<PostHogConfig>;
};

/**
 * The two events the SDK emits on its own that this project admits.
 *
 * Owned here rather than added to the product's event tuple, so the sink type, the owner
 * report's event list and its query stay exactly as they were (owner decision OD-5).
 */
export const SDK_PAGE_EVENTS = ['$pageview', '$pageleave'] as const;

/** The fixed distinct id the SDK sends under `cookieless_mode: 'always'`. */
export const COOKIELESS_DISTINCT_ID = '$posthog_cookieless';

/**
 * The four keys the vendor's cookieless transport requires, in the order they are copied.
 *
 * `token` and `distinct_id` are what makes the request routable and countable at all.
 * `$cookieless_mode` is what tells ingestion to derive the daily server-side hash instead
 * of trusting the distinct id; the vendor's own minimal cookieless set is these two plus
 * it. `$process_person_profile` is the one that looks droppable and is not: the SDK
 * appends it LAST, after its own property denylist has already run, and it is the only
 * channel by which the never-create-a-profile setting actually reaches ingestion. Strip it
 * and the server applies its own default instead — which is why the vendor's property
 * denylist is not the contract this project relies on, and this reducer is.
 */
export const TRANSPORT_REQUIRED_PROPERTIES = [
  'token',
  'distinct_id',
  '$process_person_profile',
  '$cookieless_mode',
] as const;

/**
 * The Web Analytics properties allowed through, in the order they are copied.
 *
 * A key is copied only when it is an own property whose value is a string, a finite
 * number or a boolean. `$raw_user_agent` and `$host` must survive, because the daily
 * server-side hash is derived from the team, a daily salt, the IP, the user agent and the
 * hostname. `$current_url` and `$referrer` are reduced before they are written.
 */
export const WEB_ANALYTICS_PROPERTIES = [
  '$current_url',
  '$host',
  '$pathname',
  '$referrer',
  '$referring_domain',
  '$session_id',
  '$window_id',
  '$pageview_id',
  '$prev_pageview_id',
  '$prev_pageview_pathname',
  '$prev_pageview_duration',
  '$browser',
  '$os',
  '$device_type',
  '$raw_user_agent',
  '$browser_language',
  '$browser_language_prefix',
  '$screen_height',
  '$screen_width',
  '$viewport_height',
  '$viewport_width',
  '$timezone',
  '$timezone_offset',
  '$lib',
  '$lib_version',
  '$insert_id',
  '$time',
] as const;

/** The campaign keys written from the facade's normalized record, never from the SDK. */
export const CAMPAIGN_PROPERTIES = ['utm_source', 'utm_medium', 'utm_campaign'] as const;

/** The facade's own campaign rule, restated so this module re-validates what it writes. */
const CAMPAIGN_VALUE = /^[a-z0-9-]{1,32}$/;

function isCopyableValue(value: unknown): value is string | number | boolean {
  return (
    typeof value === 'string'
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  );
}

/**
 * Parse an address value as an http or https URL, or return `null`.
 *
 * Parses the property value handed in, never an ambient browser global.
 */
function parseWebAddress(value: string): URL | null {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * The property chokepoint: reduce a capture to the cookieless transport keys, allowlisted
 * Web Analytics properties and normalized campaign values, or drop it entirely.
 *
 * Named successor to the withdrawn bare-name reducer `stripToBareName`, which reduced every
 * capture to three transport keys and dropped `$pageview`. That reducer was withdrawn on
 * 2026-09-13 by owner decision (quick task `260913-p4u`), because an event with no page
 * address, referrer or browser properties is invisible to Web Analytics.
 *
 * `allowedEvents` is passed in rather than imported so this module stays generic over the
 * product's event tuple, exactly as the measurement facade is. The name comparison is plain
 * JavaScript string equality against those names and `SDK_PAGE_EVENTS` — no case folding,
 * no trimming, no Unicode normalization — so a visually identical name in a different
 * normal form is NOT allowed through.
 *
 * Fail-closed transport: a payload is dropped unless every transport key is an own property
 * AND `distinct_id` is exactly the cookieless sentinel, `$cookieless_mode` is exactly `true`
 * and `$process_person_profile` is exactly `false`. So no per-browser identifier can leave
 * the page even if cookieless mode silently lapsed.
 *
 * The surviving property set is built as a FRESH literal: transport keys first, then each
 * allowlisted key, then campaign values. It is never a spread of the payload minus a
 * denylist, because a denylist inherits every key a future SDK version or a remote setting
 * adds. `$current_url` keeps only origin and path; `$referrer` keeps only its origin or the
 * literal `$direct`; a value that cannot be reduced is omitted. Campaign values come only
 * from `campaign`, re-validated against lowercase letters, digits and hyphens, 1 to 32
 * characters; a campaign value the SDK supplied in the payload is never copied.
 */
function hasOwnKey(target: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(target, key);
}

/**
 * The transport envelope's fixed obligations: every required property present, and the
 * three cookieless values exactly as this project locked them.
 *
 * Lifted out of `reduceCapture` unchanged. A `false` here means precisely the refusal the
 * inline guards meant — the whole capture is dropped, never partially admitted.
 */
function transportEnvelopeValid(received: Record<string, unknown>): boolean {
  for (const key of TRANSPORT_REQUIRED_PROPERTIES) {
    if (!hasOwnKey(received, key)) return false;
  }

  return (
    received.distinct_id === COOKIELESS_DISTINCT_ID
    && received.$cookieless_mode === true
    && received.$process_person_profile === false
  );
}

/**
 * Whether one web-analytics property is copied, and as what.
 *
 * A discriminated result rather than a bare value: "copy this, and the value happens to be
 * undefined" and "do not copy this at all" are different answers, and a sentinel return
 * would collapse them into one. The reductions themselves are unchanged — `$current_url`
 * keeps origin and path, `$referrer` keeps its origin or the literal `$direct`, and a value
 * that cannot be reduced is dropped rather than passed through.
 */
type WebAnalyticsReduction =
  | { readonly copy: false }
  | { readonly copy: true; readonly value: unknown };

const DROP: WebAnalyticsReduction = { copy: false };

function reduceWebAnalyticsValue(key: string, value: unknown): WebAnalyticsReduction {
  if (key === '$current_url') {
    if (typeof value !== 'string') return DROP;
    const parsed = parseWebAddress(value);
    return parsed === null
      ? DROP
      : { copy: true, value: `${parsed.origin}${parsed.pathname}` };
  }

  if (key === '$referrer') {
    if (value === '$direct') return { copy: true, value };
    if (typeof value !== 'string') return DROP;
    const parsed = parseWebAddress(value);
    return parsed === null ? DROP : { copy: true, value: parsed.origin };
  }

  return { copy: true, value };
}

/**
 * Writes every admitted web-analytics property, reduced, into the outgoing set.
 *
 * A property absent from the payload, or holding a value that cannot be copied or cannot be
 * reduced, is simply not written — the outgoing set is built up from nothing rather than
 * filtered down from what arrived, which is the property this whole module rests on.
 */
function copyWebAnalyticsProperties(
  received: Record<string, unknown>,
  properties: Record<string, unknown>,
): void {
  for (const key of WEB_ANALYTICS_PROPERTIES) {
    if (!hasOwnKey(received, key)) continue;
    const value = received[key];
    if (!isCopyableValue(value)) continue;

    const reduced = reduceWebAnalyticsValue(key, value);
    if (reduced.copy) properties[key] = reduced.value;
  }
}

/**
 * Writes campaign values from the CALLER's record, re-validated on the way in.
 *
 * Never from the payload: a campaign value the SDK supplied in the capture is not copied,
 * which is why this reads `campaign` and never `received`.
 */
function copyCampaignProperties(
  campaign: Readonly<Record<string, string>>,
  properties: Record<string, unknown>,
): void {
  for (const key of CAMPAIGN_PROPERTIES) {
    if (!hasOwnKey(campaign, key)) continue;
    const value: unknown = campaign[key];
    if (typeof value === 'string' && CAMPAIGN_VALUE.test(value)) {
      properties[key] = value;
    }
  }
}

export function reduceCapture(
  result: CaptureResult | null,
  allowedEvents: readonly string[],
  campaign: Readonly<Record<string, string>> = {},
): CaptureResult | null {
  if (result === null || typeof result !== 'object') return null;

  // Narrowed to a string once rather than comparing an `unknown` against each entry in
  // turn: `===` against a list of strings can only ever match when the value IS a string,
  // so the guard admits and rejects exactly what the two scans did, and the lookups become
  // plain membership tests.
  const event: unknown = result.event;
  const admitted =
    typeof event === 'string'
    && (allowedEvents.includes(event)
      // `SDK_PAGE_EVENTS` is a tuple of two literals, so its own `includes` accepts only
      // those two names. Widened to `readonly string[]` for the membership test: whether an
      // arbitrary string is one of them is exactly the question being asked, and a signature
      // that refuses to let it be asked is why this was a `.some` scan to begin with.
      || (SDK_PAGE_EVENTS as readonly string[]).includes(event));
  if (!admitted) return null;

  const source: unknown = result.properties;
  if (typeof source !== 'object' || source === null) return null;
  const received = source as Record<string, unknown>;

  if (!transportEnvelopeValid(received)) return null;

  const properties: Record<string, unknown> = {};
  for (const key of TRANSPORT_REQUIRED_PROPERTIES) {
    properties[key] = received[key];
  }

  copyWebAnalyticsProperties(received, properties);
  copyCampaignProperties(campaign, properties);

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
   * what it exposes as `config` could echo back all 33 locked values verbatim and
   * substitute its own reducer, passing the readback while the property chokepoint that
   * reduces a capture to the allowlisted property set was never installed at all.
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
    // A literal `true`, never the `'history_change'` default, which also counts history
    // changes.
    merged.capture_pageview === true &&
    // Asserted as a literal `true`, never as the coupled `'if_capture_pageview'`.
    merged.capture_pageleave === true &&
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
    merged.save_referrer === true &&
    merged.save_campaign_params === false &&
    Array.isArray(campaignParams) &&
    campaignParams.length === 0 &&
    merged.cookieless_mode === 'always' &&
    // Identity, not `typeof`. The chokepoint is only installed if the function that came
    // back is the very function that went in; any other function — including one the
    // client minted for itself — is an unconfirmed lockdown. The `typeof` guard is kept
    // ahead of it so the assertion still reads as a claim about a callable, and so an
    // expectation carrying a non-function could never accidentally satisfy it.
    typeof merged.before_send === 'function' &&
    merged.before_send === expected.beforeSend
  );
}
