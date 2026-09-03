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
 */
const VENDOR_DOCUMENTED_DEFAULTS: VendorPostHogConfig = {
  autocapture: true,
  rageclick: true,
  capture_pageview: true,
  capture_pageleave: 'if_capture_pageview',
  capture_heatmaps: undefined,
  capture_exceptions: undefined,
  capture_performance: undefined,
  capture_dead_clicks: undefined,
  disable_session_recording: false,
  disable_surveys: false,
  disable_surveys_automatic_display: false,
  disable_product_tours: false,
  disable_conversations: false,
  disable_web_experiments: true,
  person_profiles: 'identified_only',
  persistence: 'localStorage+cookie',
  disable_persistence: false,
  save_referrer: true,
  save_campaign_params: true,
  advanced_disable_flags: false,
  disable_external_dependency_loading: false,
};

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
