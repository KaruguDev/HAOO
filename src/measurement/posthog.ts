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

/** Named reasons, one per gate, so a refusal says which gate refused. */
const REFUSED_UNCONFIGURED = 'posthog:unconfigured-provider-configuration';
const REFUSED_NO_SCOPE = 'posthog:unreachable-global-scope';
const REFUSED_ABSENT_CLIENT = 'posthog:absent-provider-client';
const REFUSED_FOREIGN_CLIENT = 'posthog:foreign-provider-global';
const REFUSED_INITIALIZATION = 'posthog:initialization-refused';
const REFUSED_LOCKDOWN = 'posthog:unconfirmed-lockdown-readback';
const REFUSED_NO_CAPTURE = 'posthog:absent-capture-entry-point';

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
    return { reason: REFUSED_NO_SCOPE };
  }

  if (ambient === undefined || ambient === null) return { reason: REFUSED_ABSENT_CLIENT };
  if (!hasCallableInit(ambient)) return { reason: REFUSED_FOREIGN_CLIENT };

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

  const signal = (reason: string) => {
    try {
      adapters.signalRefusal?.(reason);
    } catch {
      // A refusal channel that throws must not turn a refusal into an exception.
    }
  };

  const providerConfig: MeasurementProviderConfig = config.providerConfig;
  if (providerConfig.token === '' || providerConfig.apiHost === '') {
    signal(REFUSED_UNCONFIGURED);
    return undefined;
  }

  const scope = resolveScope(adapters);
  if (scope === null) {
    signal(REFUSED_NO_SCOPE);
    return undefined;
  }

  const resolvedClient = resolveClient(scope, adapters);
  if ('reason' in resolvedClient) {
    signal(resolvedClient.reason);
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
    signal(REFUSED_INITIALIZATION);
    return undefined;
  }

  if (!lockdownHolds(readProperty(instance, 'config'), {
    apiHost: providerConfig.apiHost,
    token: providerConfig.token,
  })) {
    signal(REFUSED_LOCKDOWN);
    return undefined;
  }

  if (!isReadableInstance(instance)) {
    signal(REFUSED_NO_CAPTURE);
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
