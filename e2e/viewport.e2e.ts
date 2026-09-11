import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { PRODUCTS_REGION_SELECTOR } from './fixtures/axe';
import { recordEvidence } from './fixtures/evidence';
import {
  OVERFLOW_TOLERANCE_PX,
  collectViewportEscapees,
  measureDocumentWidths,
  type DocumentWidths,
  type OverflowEscapee,
} from './fixtures/overflow';
import { SURFACES, assertNonEmptySubjects, type Surface } from './fixtures/surfaces';
import { VIEWPORTS, assertNonEmptyViewports, type ViewportEntry } from './fixtures/viewports';

/**
 * QUAL-01 on the live sites: at every supported width, the Products and HAOO journeys have no
 * horizontal overflow and no hidden primary actions (`05-UI-SPEC.md` § Viewport Contract).
 *
 * **The naive form of this check is the single most dangerous assertion in the phase.** Both
 * top-level wrappers ship `overflow-x-hidden` (`HAOO/src/pages/ProductPage.tsx:91`,
 * `ZERO-PAPERHUB/src/App.tsx:207`), so a document-width comparison passes even while content
 * genuinely escapes the viewport — the mask eats the overflow before the document reports it.
 * That is finding F2, and collapsing the three VC-1 readings below back into one reopens it.
 *
 * Every overflow measurement is taken through `e2e/fixtures/overflow.ts`, so this spec and the
 * zoom spec cannot drift apart. There is no element walk of its own in this file.
 *
 * Every measurement is written through `recordEvidence` BEFORE it is asserted, so a failing run
 * still leaves the reading that failed. No record carries a pass mark; the recorder refuses one.
 *
 * **D-OQ-3 — ZERO-PAPER HUB evidence stops at the Products region.** The overflow sweep on S3
 * covers the whole document (overflow is a page-level property), but an escapee outside
 * `#products` is recorded as an out-of-scope observation and does not fail the run.
 */

/** The two live journeys QUAL-01 names, from the closed surface list. */
const JOURNEY_SURFACES: readonly Surface[] = assertNonEmptySubjects(
  [SURFACES.S1, SURFACES.S3],
  'the two live journeys QUAL-01 names',
);

/** The six-entry closed width list: the five D-09 product widths plus the 320 px reflow width. */
const WIDTHS = assertNonEmptyViewports(VIEWPORTS, 'VIEWPORTS for the viewport contract');

/** A live network round trip plus a full sweep does not fit the 30 s default. */
const LIVE_TIMEOUT_MS = 120_000;

/** Evidence file names, one per measurement family. */
const EVIDENCE = {
  overflow: 'viewport-overflow',
} as const;

/* ------------------------------------------------------------------------------------ *
 * Shared plumbing.
 * ------------------------------------------------------------------------------------ */

/**
 * Confine a test to the live project and give it a live-network budget.
 *
 * A skip rather than a failure: the preview build has no deployed production to measure, so this
 * spec is not applicable there — it is not failing there.
 */
function requireLive(testInfo: TestInfo): void {
  test.skip(
    testInfo.project.name !== 'live',
    'the viewport contract measures the deployed journeys and has no referent in the preview build',
  );
  test.setTimeout(LIVE_TIMEOUT_MS);
}

/** Open a surface by the address the closed list declares, and prove it is the real document. */
async function openSurface(page: Page, surface: Surface): Promise<void> {
  const response = await page.goto(surface.path ?? surface.url);
  expect(response?.status(), `unexpected status for ${surface.url}`).toBe(200);
  await page.waitForLoadState('networkidle');

  if (surface.id === 'S3') {
    /*
     * The ZERO-PAPER HUB home reveals its sections through an IntersectionObserver. The
     * Products region is scrolled into view and given time to settle so every reading below is
     * of the region as a visitor sees it, not of a subtree mid-transition.
     */
    const region = page.locator(PRODUCTS_REGION_SELECTOR);
    await expect(region, 'the Products region is not on the page').toHaveCount(1);
    await region.scrollIntoViewIfNeeded();
    await expect(region).toBeVisible();
    await page.waitForTimeout(1500);
    return;
  }

  // A 404 shell has no populated <h1>; measuring one would record a clean layout for a page
  // that is not the page under test.
  await expect(page.locator('h1').first()).toBeVisible();
}

function viewportOf(viewport: ViewportEntry): { width: number; height: number } {
  return { width: viewport.width, height: viewport.height };
}

/** The region an S3 reading is scoped to, or `undefined` for a surface measured whole. */
function regionSelectorFor(surface: Surface): string | undefined {
  return surface.id === 'S3' ? PRODUCTS_REGION_SELECTOR : undefined;
}

function describeEscapees(escapees: readonly OverflowEscapee[]): string {
  return JSON.stringify(escapees, null, 2);
}

/* ------------------------------------------------------------------------------------ *
 * VC-1, at every width in the closed list, on both live journeys.
 * ------------------------------------------------------------------------------------ */

for (const viewport of WIDTHS) {
  test.describe(`viewport contract at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport: viewportOf(viewport) });

    for (const surface of JOURNEY_SURFACES) {
      test(`${surface.id} — VC-1 horizontal overflow, measured three ways`, async ({ page }, testInfo) => {
        requireLive(testInfo);
        await openSurface(page, surface);

        // VC-1a — the unmodified document's own width reading.
        const unmodified: DocumentWidths = await measureDocumentWidths(page);

        // VC-1b — THE LOAD-BEARING READING: every element against the viewport, on the
        // UNMODIFIED page. Taken before VC-1c because VC-1c leaves the page modified.
        const escapees = await collectViewportEscapees(page, {
          regionSelector: regionSelectorFor(surface),
        });
        const scoped = surface.id === 'S3';
        const inScope = scoped ? escapees.filter((escapee) => escapee.insideRegion === true) : escapees;
        const outOfScope = scoped ? escapees.filter((escapee) => escapee.insideRegion === false) : [];

        // VC-1c — the same document reading with the clipping mask neutralised. This is a
        // MODIFIED page from here on, and is recorded under its own mode marker so it can never
        // be read as the unmodified reading above. Nothing is measured after it.
        const neutralised: DocumentWidths = await measureDocumentWidths(page, { neutraliseMask: true });

        /*
         * The bound BOTH document readings are held to, on every surface at every width.
         *
         * The readings are page-level and cannot be scoped to a region. So on S3 a document wider
         * than the viewport is excused only as far as an escapee OUTSIDE the Products region
         * reaches — excess the unmodified-page sweep has already attributed to out-of-scope
         * content, which D-OQ-3 records as an observation. Width beyond that reach is unexplained
         * and fails. With nothing out of scope (always, on S1) the bound is exactly clientWidth
         * plus the one-pixel tolerance. The in-region sweep (VC-1b) stays the load-bearing one.
         */
        const outOfScopeReachPx = outOfScope.reduce(
          (reach, escapee) => Math.max(reach, Math.ceil(escapee.right)),
          0,
        );
        const documentBound = (widths: DocumentWidths): number =>
          Math.max(widths.clientWidth, outOfScopeReachPx) + OVERFLOW_TOLERANCE_PX;

        recordEvidence(EVIDENCE.overflow, {
          surface: surface.id,
          viewport: viewportOf(viewport),
          measured: {
            unmodified,
            maskNeutralised: neutralised,
            escapees: inScope,
            escapeeCount: inScope.length,
            outOfScopeObservations: outOfScope,
            outOfScopeCount: outOfScope.length,
          },
          detail: {
            plan: '05-08',
            project: testInfo.project.name,
            url: page.url(),
            viewportReason: viewport.reason,
            criterion: viewport.criterion ?? 'product-support width (D-09)',
            overflowToleranceCssPx: OVERFLOW_TOLERANCE_PX,
            sweepScope: 'whole document (overflow is a page-level property)',
            attribution: scoped
              ? `escapees inside ${PRODUCTS_REGION_SELECTOR} fail; escapees outside it are out-of-scope observations under D-OQ-3`
              : 'whole document in scope',
            readingOrder: 'VC-1a unmodified, VC-1b unmodified, then VC-1c on a modified page, last',
            outOfScopeReachPx,
            documentBoundUnmodifiedPx: documentBound(unmodified),
            documentBoundMaskNeutralisedPx: documentBound(neutralised),
          },
        });

        /*
         * VC-1a. NECESSARY, AND EXPLICITLY NOT SUFFICIENT. The root wrapper's overflow-x-hidden
         * absorbs escaping content before the document ever reports it, so this inequality holds
         * on a page that genuinely overflows. It is recorded because a failure here would be real;
         * a pass here proves nothing on its own. VC-1b below is the result.
         */
        expect(
          unmodified.scrollWidth,
          `VC-1a: unmodified document scrollWidth ${unmodified.scrollWidth} exceeds its bound ${documentBound(unmodified)} (clientWidth ${unmodified.clientWidth}, out-of-scope reach ${outOfScopeReachPx}, tolerance ${OVERFLOW_TOLERANCE_PX})`,
        ).toBeLessThanOrEqual(documentBound(unmodified));

        // VC-1b. The load-bearing assertion: no element in scope escapes the viewport.
        expect(
          inScope,
          `VC-1b: ${inScope.length} element(s) escape the ${viewport.width}px viewport on the unmodified page: ${describeEscapees(inScope)}`,
        ).toEqual([]);

        // VC-1c. With the mask removed, the document must still not be wider than the viewport:
        // this is what proves the clipping utility is not concealing an overflow.
        expect(
          neutralised.scrollWidth,
          `VC-1c (modified-page): with overflow-x forced visible, scrollWidth ${neutralised.scrollWidth} exceeds its bound ${documentBound(neutralised)} (clientWidth ${neutralised.clientWidth}, out-of-scope reach ${outOfScopeReachPx}) — the mask was hiding an overflow`,
        ).toBeLessThanOrEqual(documentBound(neutralised));
      });
    }
  });
}
