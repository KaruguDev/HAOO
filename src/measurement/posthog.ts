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

/**
 * A structural guard on the value THIS REPOSITORY imported — not a trust decision about
 * somebody else's.
 *
 * NARROWED by plan `04.1-10`. Until then this same predicate was also the whole of the
 * trust decision for an ambient `window.posthog`: a value exposing a callable `init` was
 * adopted. It is not a trust decision and never was, because exposing a callable property
 * is precisely what a hostile global is free to do. Its remaining caller is the bound
 * module, where the question is not "do I trust this" but "did the import resolve to
 * something usable" — a wrong version, a mangled bundle or a transform that dropped the
 * default export are all reachable, and each of them must be `unusableBoundClient` rather
 * than a call into a value with no initializer.
 */
function hasCallableInit(candidate: unknown): candidate is PostHogClient {
  return typeof readProperty(candidate, 'init') === 'function';
}

function isReadableInstance(candidate: unknown): candidate is PostHogInstance {
  return typeof readProperty(candidate, 'capture') === 'function';
}

/**
 * Decide before assigning: classify the slot, refuse every occupied one, and initialize
 * only the module this repository imported.
 *
 * **The withdrawn rule.** Until plan `04.1-10` this function ADOPTED any ambient value
 * exposing a callable initializer — never replaced, never wrapped — and refused only the
 * values that had none. That rule is withdrawn. It is named here rather than deleted,
 * because a reader who finds the old shape in a prior summary, a review, or the phase's
 * own security register must be able to see a narrowing rather than mistake it for a
 * behaviour that was silently dropped (D-05, T-04.1-08).
 *
 * **Why it was withdrawn** (`04.1-VERIFICATION.md`, gap `G-04.1-2`, code-review blocker
 * CR-02). The presence of a callable initializer is not evidence of anything: it is
 * exactly the property a hostile global is free to expose. An adopted client received the
 * public project key and all ten first-party event names, and — because it CHOOSES what
 * to expose as `instance.config` — could echo the configuration object it was handed so
 * the readback agreed with itself. The 33rd key closes half of that (`lockdownHolds`
 * compares `before_send` by identity against the function this project passed to `init`),
 * but the adoption itself remained. And `MeasurementDisclosure.tsx` renders a sentence
 * naming PostHog in the United States as the SOLE processor of that data (D-10, MEAS-04's
 * factual basis) — a statement that was not true of an adopted global. The narrowing is
 * what makes the rendered sentence a fact about this code rather than an assumption about
 * the page.
 *
 * **The successor rule.** After the injected-client seam and the unclassifiable-read
 * guard, ANY defined, non-null ambient value is refused with
 * `POSTHOG_REFUSAL.foreignClient` and left byte-identical. The set of clients this
 * adapter can initialize is therefore exactly {the module this repository imported, a
 * client a test injected explicitly} and nothing else.
 *
 * **What did NOT change.** Refusing still means leaving somebody else's value exactly
 * where it is: nothing is overwritten, wrapped, deleted or initialized. The
 * classification still happens before anything is written anywhere, which is why no
 * refusal path has anything to restore (the 04-12 rule) — and it is why removing the
 * adoption branch removed a branch, not a restore obligation.
 *
 * An EMPTY slot is still not a refusal (plan `04.1-09`, deferred item D4): this module
 * binds the pinned SDK itself, so an empty slot means nothing else on the page claimed
 * the name, and the bound module is used. Nothing is ever written INTO the slot, so an
 * empty slot stays empty and a later reader of `scope.posthog` still sees `undefined`.
 * The bound module is not trusted for being bound — it goes through `hasCallableInit`,
 * and a module with no callable initializer is refused as `unusableBoundClient`, the
 * successor to the retired `absentClient`.
 *
 * This narrowing depended on `04.1-09` landing first. Before the SDK was bound in a value
 * position there was no client of this project's own to refuse an occupied slot in favour
 * of, so refusing here would have made the sink permanently undefined — a fail-closed
 * regression dressed as a hardening.
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

  // An OCCUPIED slot is foreign, whatever shape it takes. No structural check runs here
  // any more, because there is no structural check a hostile value could not satisfy.
  if (ambient !== undefined && ambient !== null) {
    return { reason: POSTHOG_REFUSAL.foreignClient };
  }

  const bound = boundPostHogClient();
  if (!hasCallableInit(bound)) return { reason: POSTHOG_REFUSAL.unusableBoundClient };

  return { client: bound };
}

/**
 * What this module has already initialized, per client: the configuration it was
 * initialized under, and the sink that initialization produced.
 *
 * **The defect this closes** (code-review WR-01). `boundPostHogClient()` returns the
 * `posthog-js` module SINGLETON, and at the pinned 1.425.1 its initializer short-circuits
 * on re-entry — `if (this.__loaded) return …, this` — returning the instance with the
 * FIRST call's configuration still attached. `POSTHOG_LOCKDOWN` is a factory that mints a
 * fresh `before_send` closure per call. So a second `createPostHogEventSink` against the
 * bound module read back the first closure, compared it by identity against the second
 * one, found them different, and refused with `POSTHOG_REFUSAL.lockdown` — the phase's
 * loudest privacy alarm — for the rest of the page's life. The alarm would have been
 * FALSE and the cause would have been this project's own re-entry: the lockdown that is
 * installed is this project's, already confirmed, still filtering every capture.
 *
 * That was reachable only because nothing yet builds a second facade (`./index.ts` guards
 * with an `initialized` flag, `ProductPage` with a ref, and `App.tsx` passes no adapters)
 * — none of which this module declares, enforces, or can see. An alarm whose truthfulness
 * depends on an undeclared precondition held by three other files is not an alarm, so the
 * precondition is removed rather than documented.
 *
 * **What it does NOT do.** It is not a trust decision and it does not stand in for one.
 * An entry is only ever written after a full pass through the gates below — the client
 * gate, a real `init`, and a CONFIRMED lockdown readback — so nothing can be returned from
 * here that was not first proven the long way. It is consulted AFTER `resolveClient`, so
 * an occupied ambient slot is still `foreignClient` on the second call as on the first,
 * and after the configuration gate, so a build that lost half its configuration still
 * refuses as `unconfigured`. It is keyed by client IDENTITY, so it can never hand one
 * client's sink to another.
 *
 * A `WeakMap` rather than a single slot: more than one client legitimately exists in one
 * process (every test injects its own), and a single slot would silently drop the first
 * client's establishment the moment a second appeared — reopening exactly this defect for
 * the first client. It also holds no client alive on its own account.
 */
const established = new WeakMap<PostHogClient, {
  readonly token: string;
  readonly apiHost: string;
  readonly events: readonly string[];
  readonly sink: (event: string) => void;
}>();

/**
 * Element-wise equality of two event allowlists.
 *
 * Compared rather than ignored because the allowlist is half of what `before_send` was
 * built from: two pages sharing a client but not an allowlist are a reconfiguration, not
 * a repeat. Plain `===` per element, in order — the same string comparison the chokepoint
 * itself uses, with no case folding, trimming or normalization, so two allowlists that
 * differ only in a way the chokepoint would notice are not treated as the same.
 */
function sameEvents(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((event, index) => event === right[index]);
}

/**
 * Resolve the configured provider sink, or `undefined` when this build has none.
 *
 * The order of operations IS the privacy contract, and it is the order the adapter this
 * one replaced established: provider check, then configuration emptiness, then capability
 * resolution, then the client gate on any pre-existing global, then the re-entry gate on
 * a client this module has already established, then initialization, then the confirmed
 * lockdown readback — and only then a sink. Every unconfirmed outcome returns `undefined`,
 * so no capture is reachable until the merged configuration has been re-read and agreed
 * with what was sent.
 *
 * The re-entry gate was INSERTED by code-review WR-01, and its position is the whole of
 * its safety: it sits after every gate that classifies a client and before anything is
 * sent to one, so a repeat call can neither skip a refusal it would have earned nor
 * manufacture one it would not have. It returns only a sink a previous call already
 * proved the long way, for the same client and the same configuration; a repeat call
 * carrying a DIFFERENT configuration is refused as `reconfiguration`, because the pinned
 * SDK keeps its first configuration and this module will not deliver events under a
 * project key and an allowlist the caller did not ask for. See `established` above.
 *
 * The ORDER is unchanged by plan `04.1-10`; what changed is which client reaches the
 * later gates. The fourth gate used to decide adopted-versus-installed and is now a flat
 * refusal of every occupied slot (see `resolveClient`), so D-03's posture and D-04's two
 * independent layers below it are untouched.
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

  // The re-entry gate, decided BEFORE anything is sent to the client and AFTER every gate
  // that classifies one, so re-entry can neither skip a refusal nor cause one. A client
  // this module already initialized under this exact configuration is not initialized
  // again: the vendor would keep its first configuration and hand back a merged object
  // whose `before_send` is the first call's closure, which the readback below would
  // correctly report as not-the-function-just-sent and wrongly report as an unconfirmed
  // lockdown. The established sink is the one that configuration actually produced.
  const priorEstablishment = established.get(resolvedClient.client);
  if (priorEstablishment !== undefined) {
    if (
      priorEstablishment.token === providerConfig.token
      && priorEstablishment.apiHost === providerConfig.apiHost
      && sameEvents(priorEstablishment.events, config.events)
    ) {
      return priorEstablishment.sink;
    }

    // A DIFFERENT configuration for a client that is already initialized. Re-initializing
    // would be a no-op the vendor reports through a log line, leaving this call's events
    // to travel under the previous call's project key and allowlist. Refuse instead, and
    // say which gate refused in its own words.
    signalRefusal(POSTHOG_REFUSAL.reconfiguration);
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

  const sink = (event: string) => {
    try {
      initialized.capture(event);
    } catch {
      // Provider delivery is deliberately isolated from every visitor action.
    }
  };

  // Recorded only here, on the far side of every gate: an entry exists if and only if this
  // client was initialized with this configuration AND its lockdown was confirmed. The
  // allowlist is copied rather than referenced so a caller mutating its own array after
  // the fact cannot turn a later reconfiguration into a memo hit.
  established.set(resolvedClient.client, {
    token: providerConfig.token,
    apiHost: providerConfig.apiHost,
    events: [...config.events],
    sink,
  });

  return sink;
}
