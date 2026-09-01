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
 * moments of a visit is not silently lost.
 */
function ensureProvider(scope: PlausibleScope): PlausibleGlobal {
  const existing = scope.plausible;
  if (typeof existing === 'function') return existing;

  const stub = function queuedProvider(...args: unknown[]) {
    (stub.q = stub.q ?? []).push(args);
  } as PlausibleGlobal;
  stub.init = (options: PlausibleInitOptions) => {
    stub('init', options);
  };
  scope.plausible = stub;

  return stub;
}

/**
 * Resolve the configured provider sink, or `undefined` when this build has none.
 *
 * Returns `undefined` — meaning the existing inert no-op path stays exactly as it is —
 * whenever the resolved provider is `'none'`, the validated script source is empty, or
 * the site domain is empty. That is the fail-closed default for an unset or
 * unrecognised build configuration.
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

  appendProviderScript(documentRef, providerScript.src);

  try {
    ensureProvider(scope).init?.({
      domain: providerScript.domain,
      autoCapturePageviews: false,
    });
  } catch {
    // Initialization is isolated from every visitor action.
  }

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
