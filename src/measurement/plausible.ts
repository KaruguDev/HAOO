import type { MeasurementProviderScript, ProductMeasurement } from '../products/types';

/**
 * The provider initialization options this project sends, and the only ones it sends.
 *
 * `autoCapturePageviews` is `false` by contract, not by configuration: automatic capture
 * would duplicate the explicit page-view event and could fire before campaign-parameter
 * cleanup completes, putting `utm_*` values into provider page dimensions. Every other
 * automatic-capture capability (outbound links, file downloads, form submissions, hash
 * routing, manual pageviews, revenue) is decided OPT-OUT in the phase coverage matrix
 * and is therefore absent from this type as well as from the code below.
 */
export interface PlausibleInitOptions {
  readonly domain: string;
  readonly autoCapturePageviews: false;
}

/**
 * The provider global as this project uses it: a call taking one bare event name, the
 * official pre-load queue the site script drains on arrival, and the initialization
 * entry point. There is no property-bag parameter here because the seam does not carry
 * one — the shape of this type is part of the name-only contract.
 */
export interface PlausibleGlobal {
  (...args: unknown[]): void;
  q?: unknown[];
  o?: PlausibleInitOptions;
  init?: (options: PlausibleInitOptions) => void;
}

/** The global object carrying the provider, injected so tests never touch a real one. */
export interface PlausibleScope {
  plausible?: PlausibleGlobal;
}

/**
 * Every browser capability this adapter needs arrives through an optional adapter with a
 * `?? window.x` default wrapped in try, the same injected-capability pattern the
 * measurement facade already follows. Tests therefore never append a real script tag to
 * the live document and never reach the network.
 */
export interface PlausibleAdapters {
  readonly documentRef?: Document;
  readonly scope?: PlausibleScope;
}

function resolveScope(adapters: PlausibleAdapters): PlausibleScope | null {
  try {
    return adapters.scope ?? (window as unknown as PlausibleScope);
  } catch {
    return null;
  }
}

function resolveDocument(adapters: PlausibleAdapters): Document | null {
  try {
    return adapters.documentRef ?? window.document;
  } catch {
    return null;
  }
}

function alreadyAppended(documentRef: Document, src: string): boolean {
  for (const element of documentRef.querySelectorAll('script')) {
    if (element.getAttribute('src') === src) return true;
  }
  return false;
}

function appendProviderScript(documentRef: Document, src: string): void {
  try {
    if (alreadyAppended(documentRef, src)) return;

    const element = documentRef.createElement('script');
    element.defer = true;
    element.setAttribute('src', src);
    (documentRef.head ?? documentRef.documentElement).appendChild(element);
  } catch {
    // Script insertion is isolated from every visitor action. A blocked, refused, or
    // absent insertion point leaves the pre-load queue in place and changes nothing a
    // visitor experiences.
  }
}

/**
 * The official pre-load stub: calls made before the site script arrives are pushed onto
 * `q` and drained by the script on load, so an accepted event emitted during the first
 * moments of a visit is not silently lost. `init` assigns the options it receives to
 * `o`, exactly as the documented vendor preload does, which is what makes the recorded
 * opt-out readable and therefore confirmable below.
 */
function installProviderStub(scope: PlausibleScope): PlausibleGlobal {
  const stub = function queuedProvider(...args: unknown[]) {
    (stub.q = stub.q ?? []).push(args);
  } as PlausibleGlobal;
  stub.init = (options: PlausibleInitOptions) => {
    stub.o = options;
  };
  scope.plausible = stub;

  return stub;
}

/**
 * Confirm the provider actually recorded the opt-out this project sent.
 *
 * The recorded slot is untrusted input: it may come from a foreign global, so it is
 * inspected structurally rather than trusted to match its declared type. Requiring the
 * recorded value — rather than merely a non-throwing `init` call — is what makes
 * "automatic pageview capture is disabled" provable instead of assumed, and it is what
 * closes a silent no-op initializer that a throw-only check would accept.
 */
function recordsOptOut(recorded: unknown, domain: string): boolean {
  if (typeof recorded !== 'object' || recorded === null) return false;

  const candidate = recorded as Partial<PlausibleInitOptions>;
  return candidate.autoCapturePageviews === false && candidate.domain === domain;
}

/**
 * Resolve a provider that is *known* to have disabled automatic capture, or `null`.
 *
 * Order of operations is the privacy contract: decide the provider, initialize it,
 * confirm the recorded opt-out, and only then let the caller append the managed script.
 * Every unconfirmed outcome returns `null`, so no script insertion and no event sink can
 * exist while automatic capture is unproven.
 *
 * An ambient `window.plausible` defined by another snippet is untrusted input of arbitrary
 * type, so the classification is decided before anything is written to the scope. A
 * callable value is adopted, never replaced or wrapped, and only when it exposes a usable
 * initializer that records the opt-out; a pre-existing full provider implementation that
 * does not expose the documented options slot is treated as unconfirmable and yields no
 * sink, a deliberate fail-closed outcome for this privacy posture. A defined non-callable
 * value is refused outright and left untouched. The stub is installed only onto a scope
 * that carried no provider value at all.
 */
function resolveInitializedProvider(
  scope: PlausibleScope,
  options: PlausibleInitOptions,
): PlausibleGlobal | null {
  const existing = scope.plausible;

  // Decide before assigning. A defined value that is not callable — an object-shaped
  // provider, or a value left by a tag manager — carries no way to establish the opt-out,
  // and overwriting somebody else's global is not this adapter's to do. Refusing here,
  // before the stub could have replaced it, is why no refusal path ever has anything to
  // restore.
  if (existing !== undefined && typeof existing !== 'function') return null;

  // The stub is installed only onto a scope that carried no provider value, and its own
  // initializer assigns the options it is handed and cannot throw, so it cannot fail the
  // recorded-opt-out check below. A refusal after this installation is therefore
  // unreachable and there is nothing to withdraw. That is a reachability fact about the
  // one component here the project fully controls, not a mitigation.
  const provider = existing ?? installProviderStub(scope);

  // No initializer means no way to establish the opt-out. Leave the foreign global
  // byte-identical — attaching an `init`, an options slot, or a queue to somebody
  // else's global is not this adapter's to do.
  if (typeof provider.init !== 'function') return null;

  try {
    provider.init(options);
    if (!recordsOptOut(provider.o, options.domain)) return null;
  } catch {
    // A throwing initializer leaves the opt-out unproven, which is indistinguishable
    // from automatic capture being enabled. Refuse rather than guess.
    return null;
  }

  return provider;
}

/**
 * Resolve the configured provider sink, or `undefined` when this build has none.
 *
 * Returns `undefined` — meaning the existing inert no-op path stays exactly as it is —
 * whenever the resolved provider is `'none'`, the validated script source is empty, or
 * the site domain is empty. That is the fail-closed default for an unset or
 * unrecognised build configuration. It also returns `undefined`, before any script is
 * appended, whenever the provider has not been confirmed to have recorded
 * `autoCapturePageviews: false` for the configured domain.
 *
 * When it does return a sink, that sink forwards exactly one argument: the bare event
 * name. It attaches no property bag, no form value, and no visitor identifier, because
 * there is no parameter through which one could travel. Every provider interaction is
 * wrapped in try/catch for the same reason `track` swallows sink failures: provider
 * delivery is deliberately isolated from every visitor action, so a blocked script, an
 * absent global, or a throwing provider call cannot affect the journey, the local
 * bounded context, or the qualification submission.
 */
export function createPlausibleEventSink<EventName extends string>(
  config: Pick<ProductMeasurement<EventName>, 'provider' | 'providerScript'>,
  adapters: PlausibleAdapters = {},
): ((event: EventName) => void) | undefined {
  if (config.provider !== 'plausible') return undefined;

  const providerScript: MeasurementProviderScript = config.providerScript;
  if (providerScript.src === '' || providerScript.domain === '') return undefined;

  const scope = resolveScope(adapters);
  const documentRef = resolveDocument(adapters);
  if (scope === null || documentRef === null) return undefined;

  // Collection is refused until the recorded automatic-capture opt-out is confirmed:
  // the script is appended only on a confirmed provider, so a managed script can never
  // load while automatic capture is unproven.
  const provider = resolveInitializedProvider(scope, {
    domain: providerScript.domain,
    autoCapturePageviews: false,
  });
  if (provider === null) return undefined;

  appendProviderScript(documentRef, providerScript.src);

  return (event: EventName) => {
    try {
      const provider = scope.plausible;
      if (typeof provider !== 'function') return;

      provider(event);
    } catch {
      // Provider delivery is deliberately isolated from every visitor action.
    }
  };
}
