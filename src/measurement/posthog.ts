import type { MeasurementProviderConfig, ProductMeasurement } from '../products/types';
import { POSTHOG_LOCKDOWN, lockdownHolds } from './posthog-lockdown';

/**
 * The global object carrying the provider, injected so tests never touch a real one.
 *
 * The slot is declared `unknown` on purpose. An ambient global is untrusted input of
 * arbitrary type — a tag manager, a browser extension, or another snippet on the page can
 * leave any value at all there — and a declared client type here would hand this adapter
 * the very assumption it has to refuse.
 */
export interface PostHogScope {
  posthog?: unknown;
}

/**
 * The vendor entry point as this project uses it: one call taking a project key and a
 * configuration object, returning the initialized instance.
 *
 * There is no `identify`, `alias`, `group`, or `setPersonProperties` in this type, and
 * none anywhere in this module. Calling any one of them forces person processing on for
 * the remainder of the session regardless of the person-profiles setting, so the seam this
 * project uses does not carry them at all (MEAS-03).
 */
export interface PostHogClient {
  init(token: string, config?: Record<string, unknown>): unknown;
}

/**
 * Every browser capability this adapter needs arrives through an optional adapter with a
 * `?? window.x` default wrapped in try, the same injected-capability pattern the
 * measurement facade already follows. Tests therefore never load, initialize, or reach a
 * real SDK, and never reach the network.
 *
 * `signalRefusal` makes a refusal owner-visible rather than silent: a provider that
 * refused to initialize and a genuinely dead funnel look identical in a report otherwise.
 */
export interface PostHogAdapters {
  readonly scope?: PostHogScope;
  readonly client?: PostHogClient;
  readonly signalRefusal?: (reason: string) => void;
}

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
  /** The provider slot is empty, and this module installs no stub of its own. */
  absentClient: 'posthog:absent-provider-client',
  /** The adopted-versus-installed gate: the slot holds something this module will not use. */
  foreignClient: 'posthog:foreign-provider-global',
  /** The initializer threw, leaving the lockdown unproven. */
  initialization: 'posthog:initialization-refused',
  /** The merged configuration did not agree with the lockdown that was sent. */
  lockdown: 'posthog:unconfirmed-lockdown-readback',
  /** The initialized instance exposes no callable capture entry point. */
  absentCapture: 'posthog:absent-capture-entry-point',
} as const);

/**
 * The default refusal channel: write the reason where the owner can see it.
 *
 * Everything else in this module deliberately swallows every failure, because provider
 * delivery must never cost a visitor an action. A refusal is the one exception, and the
 * reason is that a silently refusing bundled SDK produces a report that reads as zero
 * traffic and is INDISTINGUISHABLE from a genuinely dead funnel — the owner would read a
 * broken measurement build as a broken business (MEAS-07, D-05).
 *
 * The write is itself wrapped, because the console is an ambient browser capability like
 * any other: a page that has replaced or removed it must not turn a refusal into an
 * exception escaping into a visitor action.
 */
function writeRefusalToConsole(reason: string): void {
  try {
    console.warn(reason);
  } catch {
    // A hostile or absent console cannot itself become a failure.
  }
}

/**
 * The initialized instance as this module reads it back.
 *
 * `config` is typed `unknown` deliberately: it is the merged configuration the vendor
 * resolved, which is exactly the untrusted value `lockdownHolds` exists to inspect.
 */
interface PostHogInstance {
  readonly config: unknown;
  capture(event: string): void;
}

function resolveScope(adapters: PostHogAdapters): PostHogScope | null {
  try {
    return adapters.scope ?? (window as unknown as PostHogScope);
  } catch {
    return null;
  }
}

/**
 * Structural read of one property of an untrusted value.
 *
 * Wrapped in try because a foreign object may expose a throwing getter, and a throw while
 * classifying somebody else's global must be a refusal rather than an exception escaping
 * into a visitor action.
 */
function readProperty(candidate: unknown, key: string): unknown {
  if (typeof candidate !== 'object' && typeof candidate !== 'function') return undefined;
  if (candidate === null) return undefined;

  try {
    return (candidate as Record<string, unknown>)[key];
  } catch {
    return undefined;
  }
}

function hasCallableInit(candidate: unknown): candidate is PostHogClient {
  return typeof readProperty(candidate, 'init') === 'function';
}

function isReadableInstance(candidate: unknown): candidate is PostHogInstance {
  return typeof readProperty(candidate, 'capture') === 'function';
}

/**
 * Decide before assigning.
 *
 * A pre-existing value in the provider slot is classified before anything is written
 * anywhere. A value exposing a callable initializer is ADOPTED — never replaced, never
 * wrapped. Any other defined value is refused outright and left byte-identical:
 * overwriting somebody else's global is not this adapter's to do, and refusing here,
 * before anything could have replaced it, is why no refusal path ever has anything to
 * restore (the 04-12 rule). An empty slot is refused too, because this slice installs no
 * stub of its own — an absent client is an unconfigured page, not a page to instrument.
 */
function resolveClient(
  scope: PostHogScope,
  adapters: PostHogAdapters,
): { readonly client: PostHogClient } | { readonly reason: string } {
  if (adapters.client !== undefined) return { client: adapters.client };

  let ambient: unknown;
  try {
    ambient = scope.posthog;
  } catch {
    // A slot whose read throws is an existing global this module cannot classify, and an
    // unclassifiable global is foreign by definition: it is refused at the same gate as a
    // value with no callable initializer, and left exactly where it is.
    return { reason: POSTHOG_REFUSAL.foreignClient };
  }

  if (ambient === undefined || ambient === null) {
    return { reason: POSTHOG_REFUSAL.absentClient };
  }
  if (!hasCallableInit(ambient)) return { reason: POSTHOG_REFUSAL.foreignClient };

  return { client: ambient };
}

/**
 * Resolve the configured provider sink, or `undefined` when this build has none.
 *
 * The order of operations IS the privacy contract, and it is the order the adapter this
 * one replaced established: provider check, then configuration emptiness, then capability
 * resolution, then the adopted-versus-installed decision on any pre-existing global, then
 * initialization, then the confirmed lockdown readback — and only then a sink. Every
 * unconfirmed outcome returns `undefined`, so no capture is reachable until the merged
 * configuration has been re-read and agreed with what was sent.
 *
 * Returns `undefined` — meaning the existing inert no-op path stays exactly as it is —
 * whenever the resolved provider is not exactly `'posthog'`, or either half of the
 * provider configuration is empty. That is the fail-closed default for an unset or
 * unrecognised build configuration, and it is the one path that stays SILENT: an
 * unconfigured build is not a refusal, and signalling it would make the refusal channel
 * meaningless on the builds that matter.
 *
 * When it does return a sink, that sink takes exactly one argument: the bare event name.
 * It attaches no property bag, no form value, and no visitor property, because there is no
 * parameter through which one could travel — the single-parameter signature is what makes
 * a property bag structurally impossible rather than merely absent. Nothing in this module
 * throws: every failure is a returned sentinel or a swallowed catch, because provider
 * delivery is deliberately isolated from every visitor action.
 */
export function createPostHogEventSink<EventName extends string>(
  config: Pick<ProductMeasurement<EventName>, 'provider' | 'providerConfig' | 'events'>,
  adapters: PostHogAdapters = {},
): ((event: EventName) => void) | undefined {
  if (config.provider !== 'posthog') return undefined;

  const signalRefusal = (reason: string) => {
    try {
      (adapters.signalRefusal ?? writeRefusalToConsole)(reason);
    } catch {
      // A refusal channel that throws must not turn a refusal into an exception.
    }
  };

  const providerConfig: MeasurementProviderConfig = config.providerConfig;
  // Trimmed emptiness, not literal emptiness: a deployment variable set to a space is a
  // build that never configured the provider, and initializing against it would send the
  // vendor a blank project key — which it reports through a log line rather than a throw.
  if (providerConfig.token.trim() === '' || providerConfig.apiHost.trim() === '') {
    signalRefusal(POSTHOG_REFUSAL.unconfigured);
    return undefined;
  }

  const scope = resolveScope(adapters);
  if (scope === null) {
    signalRefusal(POSTHOG_REFUSAL.unreachableScope);
    return undefined;
  }

  const resolvedClient = resolveClient(scope, adapters);
  if ('reason' in resolvedClient) {
    signalRefusal(resolvedClient.reason);
    return undefined;
  }

  let instance: unknown;
  try {
    instance = resolvedClient.client.init(
      providerConfig.token,
      POSTHOG_LOCKDOWN(providerConfig.apiHost, providerConfig.token, config.events),
    );
  } catch {
    // A throwing initializer leaves the lockdown unproven, which is indistinguishable
    // from automatic capture being enabled. Refuse rather than guess.
    signalRefusal(POSTHOG_REFUSAL.initialization);
    return undefined;
  }

  let confirmed = false;
  try {
    confirmed = lockdownHolds(readProperty(instance, 'config'), {
      apiHost: providerConfig.apiHost,
      token: providerConfig.token,
    });
  } catch {
    // The merged configuration is the LAST untrusted value on this path, and the readback
    // is the only thing that reads it key by key. A throwing getter anywhere in it must be
    // a refusal, not an exception: this call is reached from the facade's `initialize`,
    // which runs inside the product page's mount effect, so a throw here would unmount the
    // page over a third party's failure (the Phase 4 gap-1 shape, on the enablement path
    // this phase turns on for the first time).
    confirmed = false;
  }

  if (!confirmed) {
    signalRefusal(POSTHOG_REFUSAL.lockdown);
    return undefined;
  }

  if (!isReadableInstance(instance)) {
    signalRefusal(POSTHOG_REFUSAL.absentCapture);
    return undefined;
  }

  const initialized = instance;

  return (event: EventName) => {
    try {
      initialized.capture(event);
    } catch {
      // Provider delivery is deliberately isolated from every visitor action.
    }
  };
}
