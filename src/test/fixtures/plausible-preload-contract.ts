interface VendorPreloadOptions {
  readonly domain: string;
  readonly autoCapturePageviews: false;
}

interface VendorPlausibleGlobal {
  (...args: unknown[]): void;
  q?: unknown[];
  o?: VendorPreloadOptions;
  init?: (options: VendorPreloadOptions) => void;
}

export interface VendorPlausibleScope {
  plausible?: VendorPlausibleGlobal;
}

/**
 * Independent transcription of Plausible's documented preload contract.
 *
 * Event calls are queued in `q`, while initialization options are assigned to `o`
 * for the managed script to consume when it loads. This fixture intentionally imports
 * no production measurement types or helpers so it remains an external contract oracle.
 */
export function installPlausibleVendorPreload(
  scope: VendorPlausibleScope,
): VendorPlausibleGlobal {
  const plausible = function queuedVendorCall(...args: unknown[]) {
    (plausible.q = plausible.q ?? []).push(args);
  } as VendorPlausibleGlobal;

  plausible.init = (options: VendorPreloadOptions) => {
    plausible.o = options;
  };
  scope.plausible = plausible;

  return plausible;
}
