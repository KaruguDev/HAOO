/**
 * The payload `before_send` receives and returns.
 *
 * Transcribed from the vendor's published `CaptureResult`. Only the three members the
 * property chokepoint actually reads are declared: a fixture that mirrored every optional
 * member would be restating the vendor's type file rather than pinning the agreement this
 * project depends on.
 */
export interface VendorCaptureResult {
  uuid: string;
  event: string;
  properties: Record<string, unknown>;
}

/**
 * The merged-configuration readback surface.
 *
 * Deliberately typed as an open record rather than as a declared config type: the
 * adapter's lockdown gate must inspect the resolved values structurally, key by key,
 * instead of trusting a type that only describes what was passed in.
 */
export type VendorPostHogConfig = Record<string, unknown>;

/** The property chokepoint. Returning `null` drops the event entirely. */
export type VendorBeforeSend = (
  result: VendorCaptureResult | null,
) => VendorCaptureResult | null;

export interface VendorPostHogInstance {
  config: VendorPostHogConfig;
  capture(event: string): void;
}

export interface VendorPostHogClient {
  init(token: string, config?: Record<string, unknown>): VendorPostHogInstance;
}

/**
 * An ambient global is untrusted input of arbitrary type, so the slot is `unknown`. A
 * declared client type here would hand the adapter the very assumption it has to refuse.
 */
export interface VendorPostHogScope {
  posthog?: unknown;
}

/** Inspection surface the fixture adds on top of the vendor's own client shape. */
export interface InstalledVendorPostHogClient extends VendorPostHogClient {
  /** The token `init` was called with, or `null` before any call. */
  initializedToken(): string | null;
  /** The fully merged configuration `init` assigned to the instance, in call order. */
  initializedConfig(): VendorPostHogConfig | null;
  /** Every event name passed to `capture`, in call order, before any filtering. */
  capturedEvents(): readonly string[];
  /** Every payload the configured `before_send` returned, in call order. */
  deliveredPayloads(): readonly VendorCaptureResult[];
}

/**
 * The vendor's own documented defaults — not this project's desired values.
 *
 * This distinction is the whole point of the fixture. A stub that started from the
 * locked-down values would make a readback assertion vacuous: the assertion would pass
 * whether or not the adapter actually supplied a single option. Starting from the
 * defaults means every locked value has to be overcome by a real `init` argument before
 * the readback can hold.
 *
 * The map used to carry 20 keys while `lockdownHolds` asserted 33, so nine locked keys
 * had no default here at all and `{...defaults, ...config}` handed the readback the
 * adapter's own value — proving the object equalled itself, which is the exact vacuity
 * the paragraph above forbids. Every locked key now has an entry, transcribed from the
 * installed bundle's default builder rather than guessed, and
 * `measurement.test.ts` asserts the two sets agree so a key added to the lockdown
 * without a default fails loudly instead of silently reintroducing the gap.
 *
 * Six keys remain vacuous no matter what this map says, because the vendor's own
 * default already equals what the lockdown sends. They are named in
 * `VACUOUS_BY_VENDOR_AGREEMENT` below rather than papered over.
 */
export const VENDOR_DOCUMENTED_DEFAULTS: VendorPostHogConfig = {
  // Supplied by `init` on every real call, so these two are the least interesting
  // members — but they are the vendor's actual starting values and the map has to be
  // complete for the completeness assertion in `measurement.test.ts` to mean anything.
  token: '',
  api_host: 'https://us.i.posthog.com',
  ui_host: null,
  // The vendor resolves this to the literal `'unset'` when nothing is passed, which is
  // also what the lockdown sends. See VACUOUS_BY_VENDOR_AGREEMENT below.
  defaults: 'unset',
  autocapture: true,
  rageclick: true,
  capture_pageview: true,
  capture_pageleave: 'if_capture_pageview',
  capture_heatmaps: undefined,
  capture_exceptions: undefined,
  capture_performance: undefined,
  capture_dead_clicks: undefined,
  // Date-gated, and `'unset'` sorts above every date literal, so the resolved default at
  // this version is the regex rather than `undefined` (see WR-05). This is the key the
  // fidelity gap mattered most for: the lockdown sets it to `null` precisely because a
  // NON-null value enables person processing, so a fixture that started from `undefined`
  // understated what the adapter has to overcome.
  internal_or_test_user_hostname: /^(localhost|127\.0\.0\.1)$/,
  disable_session_recording: false,
  disable_surveys: false,
  disable_surveys_automatic_display: false,
  disable_product_tours: false,
  disable_conversations: false,
  disable_web_experiments: true,
  // Absent from the vendor's defaults object entirely — it is only ever read at a use
  // site — so the resolved default is `undefined`, not `false`. Recorded as `undefined`
  // rather than guessed at `false`, because the point of this map is fidelity.
  disable_scroll_properties: undefined,
  person_profiles: 'identified_only',
  persistence: 'localStorage+cookie',
  disable_persistence: false,
  disableDeviceModel: false,
  save_referrer: true,
  save_campaign_params: true,
  custom_campaign_params: [],
  advanced_disable_flags: false,
  advanced_disable_feature_flags: false,
  advanced_disable_toolbar_metrics: false,
  disable_external_dependency_loading: false,
  opt_in_site_apps: false,
  before_send: undefined,
};

/**
 * The keys whose vendor default already equals the value this project locks.
 *
 * Naming them is the honest completion of the premise above. For these six the readback
 * cannot prove the adapter supplied anything — the object would equal itself whether or
 * not it did — and no fixture can change that, because the agreement is the vendor's,
 * not the fixture's. What still covers them is the per-key hostile table in
 * `measurement.test.ts`, which forces each one to a WRONG resolved value and requires a
 * refusal.
 *
 * This list is not hand-maintained trivia: `measurement.test.ts` DERIVES the vacuous set
 * by comparing the two maps and requires it to equal this list exactly. Two entries here
 * were found that way rather than by reading — a set-difference assertion is the only
 * thing that can tell you which of your assertions prove nothing.
 */
export const VACUOUS_BY_VENDOR_AGREEMENT = [
  // The approved ingestion origin is also the vendor's own default host, so a build that
  // supplied no api_host at all would read back as compliant. What actually stops that is
  // the adapter's own emptiness gate, which refuses before `init` is ever called.
  'api_host',
  // The vendor resolves an unsupplied `defaults` to the literal `'unset'` — the same
  // value the lockdown sends. See WR-05 for what that value really does.
  'defaults',
  // Vendor-off already. Locked anyway, because a default that is currently favourable is
  // not a guarantee: it can move inside the vendor's own major line.
  'disable_web_experiments',
  'custom_campaign_params',
  'ui_host',
  'opt_in_site_apps',
] as const;

/**
 * The keys the vendor's own transport requires, carried inside `properties`.
 *
 * A stub whose captured payload arrived already reduced to bare-name form would prove
 * nothing about a chokepoint. The payload assembled below therefore carries both the
 * transport keys and the kind of ambient enrichment a real capture appends, so a
 * chokepoint that strips nothing is visible in `deliveredPayloads()`.
 */
function assembleVendorPayload(
  event: string,
  token: string,
  ordinal: number,
): VendorCaptureResult {
  return {
    uuid: `vendor-fixture-${ordinal}`,
    event,
    properties: {
      token,
      distinct_id: `vendor-fixture-distinct-${ordinal}`,
      $process_person_profile: false,
      $current_url: 'https://www.zero-paperhub.com/products/haoo/',
      $referrer: 'https://search.example/',
      $lib: 'web',
    },
  };
}

/**
 * Independent transcription of PostHog's documented capture contract.
 *
 * `init` is synchronous, merges the supplied options over the vendor defaults, assigns
 * the merged result to `instance.config`, and returns the instance — including when the
 * token is blank, which the vendor reports through a log line rather than a throw. That
 * is why a gate written as "call `init` and trust the absence of a throw" would pass on a
 * misconfigured token, and why the readback of `instance.config` is the gate instead.
 *
 * This fixture intentionally imports nothing from `src/measurement/` or `src/products/`,
 * which keeps the shape it declares independent of the shape the adapter declares. It
 * pins shape agreement only, not vendor behaviour: this file is a transcription of
 * documentation, so it is not evidence about what the real SDK does at runtime. The live
 * confirmation that one visitor action produces exactly one name-only event is the human
 * gate recorded in
 * `.planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/04.1-USER-SETUP.md`.
 *
 * `overrides` is applied last, after the caller's options, so a test can force a single
 * resolved key to a wrong value and exercise the adapter's refusal on an unconfirmed
 * readback.
 */
export function installPostHogVendorClient(
  scope: VendorPostHogScope,
  overrides: VendorPostHogConfig = {},
): InstalledVendorPostHogClient {
  let initializedToken: string | null = null;
  let initializedConfig: VendorPostHogConfig | null = null;
  const capturedEvents: string[] = [];
  const deliveredPayloads: VendorCaptureResult[] = [];

  const client: InstalledVendorPostHogClient = {
    init(token: string, config: Record<string, unknown> = {}) {
      const merged: VendorPostHogConfig = {
        ...VENDOR_DOCUMENTED_DEFAULTS,
        ...config,
        ...overrides,
      };

      initializedToken = token;
      initializedConfig = merged;

      const instance: VendorPostHogInstance = {
        config: merged,
        capture(event: string) {
          capturedEvents.push(event);

          const beforeSend = merged.before_send;
          const payload = assembleVendorPayload(event, token, capturedEvents.length);
          const delivered =
            typeof beforeSend === 'function'
              ? (beforeSend as VendorBeforeSend)(payload)
              : payload;

          if (delivered !== null) {
            deliveredPayloads.push(delivered);
          }
        },
      };

      return instance;
    },
    initializedToken: () => initializedToken,
    initializedConfig: () => initializedConfig,
    capturedEvents: () => capturedEvents,
    deliveredPayloads: () => deliveredPayloads,
  };

  scope.posthog = client;

  return client;
}
