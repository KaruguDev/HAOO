import posthog from 'posthog-js';
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
 * The pinned SDK, bound in a VALUE position — the single link `04.1-VERIFICATION.md`
 * recorded as NOT WIRED (gap `G-04.1-1`, deferred item D4), closed by plan `04.1-09`.
 *
 * Until this import existed the only reference to the vendor package in the whole tree
 * was an `import type` in `./posthog-lockdown`, which TypeScript erases. Nothing reached
 * a bundle, nothing ever occupied the ambient slot, and every privacy invariant this
 * phase proves was a statement about unreachable code. The static form is a recorded
 * one-way decision (D4, option A): the sink seam in `../measurement` assigns
 * synchronously inside the product page's mount effect and the first event fires on the
 * same tick, so a provider-gated dynamic import would drop it unless this project kept an
 * ordered emission buffer of its own — which MEAS-02 forbids by name. The price paid
 * instead is that the vendor chunk ships in EVERY build, including a provider-unset one,
 * and the build-output invariants that contradicted are renarrowed in the same commit
 * rather than widened or silenced.
 *
 * Returned as `unknown` on purpose. A module resolved from `node_modules` is not more
 * trustworthy than a value found on the page — a wrong version, a mangled bundle, or a
 * transform that dropped the default export are all reachable — so the caller passes it
 * through the same `hasCallableInit` gate the ambient slot goes through, and refuses on
 * the same terms. Declaring it `PostHogClient` here would hand the adapter the assumption
 * that gate exists to refuse.
 *
 * It is an accessor rather than a re-export so the binding can be asserted by identity
 * from a test without that test having any way to initialize it: reading this value is
 * inert, and no code path under the test runner calls the real initializer (MEAS-07).
 */
export function boundPostHogClient(): unknown {
  return posthog;
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
 * restore (the 04-12 rule).
 *
 * An EMPTY slot is no longer a refusal (plan `04.1-09`, deferred item D4). It is the
 * normal path: this module now binds the pinned SDK itself, so an empty slot means
 * nothing else on the page claimed the name, and the bound module is used. Nothing is
 * ever written INTO the slot — the bound value is passed straight to the caller — so an
 * empty slot stays empty and a later reader of `scope.posthog` still sees `undefined`.
 * The bound module is not trusted for being bound: it goes through the same
 * `hasCallableInit` gate an ambient value goes through, and a module with no callable
 * initializer is refused as `unusableBoundClient` — the successor to the retired
 * `absentClient`, which is documented as withdrawn on the member itself.
 *
 * The ambient branch is untouched by that change and stays AHEAD of the bound module on
 * purpose: a page that already carries a usable provider global is still adopted rather
 * than displaced. Removing that adoption is plan `04.1-10`, and it depends on this
 * binding existing first — there is no fallback to refuse an occupied slot in favour of
 * until there is a client of this project's own.
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
    const bound = boundPostHogClient();
    if (!hasCallableInit(bound)) return { reason: POSTHOG_REFUSAL.unusableBoundClient };
    return { client: bound };
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

  // Retained rather than constructed inline at the call: `POSTHOG_LOCKDOWN` is a factory,
  // so each invocation mints a fresh `before_send` closure. Holding on to the object that
  // was actually sent is what lets the readback below prove the resolved chokepoint is
  // THIS project's reducer by identity, rather than merely some function.
  const lockdown = POSTHOG_LOCKDOWN(
    providerConfig.apiHost,
    providerConfig.token,
    config.events,
  );

  let instance: unknown;
  try {
    instance = resolvedClient.client.init(providerConfig.token, lockdown);
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
      beforeSend: lockdown.before_send,
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
