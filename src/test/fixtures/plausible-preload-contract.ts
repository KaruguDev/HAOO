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
 * no production measurement types or helpers, which keeps the shape it declares
 * independent of the shape the adapter declares. It pins shape agreement only, not vendor behaviour:
 * this file is a transcription of documentation, so it is not evidence about what the
 * real script does at runtime. The vendor script honouring the recorded slot is
 * confirmed by the live gate recorded in
 * `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md`.
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
