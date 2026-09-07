/**
 * The closed viewport list, and the zoom-equivalence entries kept separate from it.
 *
 * Closed the way `src/test/focus-contrast.test.ts` closes `FOCUS_SOURCES`: `as const`, one
 * reason per entry, and admission by registration here rather than by a spec inventing a
 * width. The five product widths are owner decision D-09 (`05-CONTEXT.md`), pinned in the
 * phase record and not re-opened by a spec author.
 *
 * The heights are not part of D-09 and are chosen to match the device classes the widths
 * stand for; a spec that depends on an exact height rather than on a width is measuring the
 * wrong thing.
 */

export interface ViewportEntry {
  readonly width: number;
  readonly height: number;
  /** Why this width is in the closed list. */
  readonly reason: string;
  /**
   * The WCAG success criterion this width is evidence for, or `null` when the width is a
   * product-support width rather than a conformance measurement.
   */
  readonly criterion: string | null;
}

export const VIEWPORTS = [
  {
    width: 360,
    height: 740,
    reason: 'Small Android class — the narrowest supported product width (D-09).',
    criterion: null,
  },
  {
    width: 390,
    height: 844,
    reason: 'Modern iPhone class (D-09).',
    criterion: null,
  },
  {
    width: 768,
    height: 1024,
    reason: "Tablet, and Tailwind's `md` breakpoint boundary where `hidden md:flex` flips (D-09).",
    criterion: null,
  },
  {
    width: 1280,
    height: 1024,
    reason: 'Desktop, and the base for the first halved zoom-equivalence entry (D-09).',
    criterion: null,
  },
  {
    width: 1440,
    height: 900,
    reason: 'Wide desktop, and the base for the second halved zoom-equivalence entry (D-09).',
    criterion: null,
  },
  {
    width: 320,
    height: 256,
    reason:
      'The width at which the reflow success criterion is DEFINED. WCAG 2.2 SC 1.4.10 is stated ' +
      'at 320 CSS px wide by 256 CSS px tall, described in its Understanding document as ' +
      'equivalent to a 1280 px viewport at 400% zoom. It is added here at near-zero cost so the ' +
      'reflow claim has a measurement that actually supports it, rather than being inferred from ' +
      'a 640 px reading (see ZOOM_VIEWPORTS below).',
    criterion: 'WCAG 2.2 SC 1.4.10 Reflow',
  },
] as const satisfies readonly ViewportEntry[];

export interface ZoomViewportEntry extends ViewportEntry {
  /** The unhalved desktop width this entry models at 200%. */
  readonly base: number;
  /** Never `null` for a zoom entry: the whole point of the entry is the claim it supports. */
  readonly criterion: string;
}

/**
 * The 200% zoom equivalence entries — and the label that keeps them honest.
 *
 * UI-SPEC ZM-1's method is to halve 1280 to 640 and 1440 to 720. That method is correct and
 * it is the owner's D-09 matrix, so it is kept exactly as specified. What is corrected here
 * is only the LABEL: halving a viewport models **200%** zoom, which is WCAG 2.2 SC 1.4.4
 * Resize Text. It is not SC 1.4.10 Reflow, which is defined at 320 CSS px (the entry in
 * `VIEWPORTS` above). An evidence file claiming reflow conformance on the strength of a
 * 640-pixel measurement would be wrong, and it would be wrong in the direction that flatters
 * the site — so each entry carries the criterion it actually measures, in the same style
 * `MIN_FOCUS_CONTRAST` carries SC 1.4.11.
 *
 * A device-scale-factor approach is NOT used anywhere, here or in the specs: it scales
 * rendering rather than layout, so the page reflows exactly as much as it did before, which
 * is to say not at all. It would produce a green measurement of nothing.
 */
export const ZOOM_VIEWPORTS = [
  {
    width: 640,
    height: 512,
    base: 1280,
    reason: '1280 halved — models 200% zoom on the first desktop width.',
    criterion: 'WCAG 2.2 SC 1.4.4 Resize Text (200%)',
  },
  {
    width: 720,
    height: 450,
    base: 1440,
    reason: '1440 halved — models 200% zoom on the wide desktop width.',
    criterion: 'WCAG 2.2 SC 1.4.4 Resize Text (200%)',
  },
] as const satisfies readonly ZoomViewportEntry[];

/**
 * The vacuity guard for a viewport sweep.
 *
 * Same discipline as the `pairs.length > 0` assertion in `focus-contrast.test.ts`: a sweep
 * that iterated an empty width list would report a green run having measured no layout at
 * all. It throws rather than returning a boolean so ignoring it takes a deliberate act.
 */
export function assertNonEmptyViewports<T extends ViewportEntry>(
  viewports: readonly T[],
  description: string,
): readonly T[] {
  if (viewports.length === 0) {
    throw new Error(
      `vacuity guard: ${description} produced no viewports. A layout sweep over zero widths ` +
        'measures nothing and must not report a pass.',
    );
  }
  return viewports;
}

/** The five D-09 product-support widths, without the criterion-bearing 320 entry. */
export function productSupportViewports(): readonly ViewportEntry[] {
  return assertNonEmptyViewports(
    VIEWPORTS.filter((viewport) => viewport.criterion === null),
    'VIEWPORTS filtered to the D-09 product-support widths',
  );
}
