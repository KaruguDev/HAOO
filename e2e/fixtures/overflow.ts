import type { Page } from '@playwright/test';

/**
 * The two horizontal-overflow measurements (`05-UI-SPEC.md` § VC-1), shared by the viewport
 * and zoom specs so they cannot drift apart.
 */

/**
 * Tolerance is exactly ONE CSS pixel, and only for subpixel rounding: a box laid out at
 * 359.5 px rounds to a right edge of 360.0001 on some zoom levels and is not an overflow.
 *
 * There is no epsilon anywhere else in this measurement, and none in the specs that consume
 * it. That is the `focus-contrast.test.ts` discipline — `MIN_FOCUS_CONTRAST` is compared on
 * the raw IEEE-754 double with rounding only when a value is printed into a failure message —
 * applied to layout. A tolerance that grows to make a run pass is how a real overflow becomes
 * invisible.
 */
export const OVERFLOW_TOLERANCE_PX = 1;

export interface OverflowEscapee {
  readonly tag: string;
  readonly id: string;
  readonly className: string;
  readonly left: number;
  readonly right: number;
  readonly innerWidth: number;
}

/**
 * VC-1b, the load-bearing overflow assertion: every element measured against the viewport.
 *
 * Runs on the UNMODIFIED page. Walks every element under `<body>`, skipping those computing
 * `visibility: hidden` or `display: none`, those intentionally off-canvas (the `sr-only`
 * utility and the honeypot's `-left-[10000px]` offset), and zero-area boxes. Collects any
 * element whose right edge exceeds `innerWidth + OVERFLOW_TOLERANCE_PX` or whose left edge is
 * below `-OVERFLOW_TOLERANCE_PX`.
 *
 * Returns the escapees rather than asserting: the caller records the measured list — including
 * when it is empty, which is the most useful reading this produces — and then asserts.
 */
export async function collectViewportEscapees(page: Page): Promise<OverflowEscapee[]> {
  return page.evaluate<OverflowEscapee[], number>((tolerance) => {
    const escapees: OverflowEscapee[] = [];
    const innerWidth = window.innerWidth;

    /** Intentionally off-canvas by design: the sr-only utility and the honeypot's far-left offset. */
    const isIntentionallyOffCanvas = (element: Element): boolean => {
      let node: Element | null = element;
      while (node) {
        if (node.classList.contains('sr-only')) return true;
        if (typeof node.className === 'string' && node.className.includes('-left-[10000px]')) {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    };

    for (const element of Array.from(document.body.getElementsByTagName('*'))) {
      const style = window.getComputedStyle(element);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      if (isIntentionallyOffCanvas(element)) continue;

      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      if (rect.right > innerWidth + tolerance || rect.left < -tolerance) {
        escapees.push({
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: typeof element.className === 'string' ? element.className : '',
          left: Math.round(rect.left * 100) / 100,
          right: Math.round(rect.right * 100) / 100,
          innerWidth,
        });
      }
    }
    return escapees;
  }, OVERFLOW_TOLERANCE_PX);
}

export interface DocumentWidths {
  readonly scrollWidth: number;
  readonly clientWidth: number;
  readonly innerWidth: number;
  /**
   * Which page the reading was taken from. `unmodified` is VC-1a; `mask-neutralised` is VC-1c,
   * taken after a stylesheet forced horizontal overflow visible.
   */
  readonly mode: 'unmodified' | 'mask-neutralised';
}

/** The stylesheet that neutralises the shipped horizontal-clipping mask. */
const MASK_NEUTRALISER = 'html,body,body *{overflow-x:visible !important}';

/**
 * The document-width reading — necessary, and EXPLICITLY NOT SUFFICIENT.
 *
 * Both top-level wrappers ship a horizontal-clipping utility (`overflow-x-hidden`:
 * `HAOO/src/pages/ProductPage.tsx:91` and `ZERO-PAPERHUB/src/App.tsx:207`), so
 * `scrollWidth > clientWidth` never fires no matter how far content actually escapes — the
 * mask absorbs it. A run reporting only this reading would be a non-assertion wearing the
 * costume of one, and it would be fast and green while a page overflowed. `collectViewportEscapees`
 * above is the assertion that actually measures overflow; this one is recorded alongside it.
 *
 * With `neutraliseMask: true` the mask is removed first and the reading is marked
 * `mask-neutralised`. **That reading is of a MODIFIED page and must never be conflated with an
 * unmodified one in the evidence** — it answers "is the mask hiding an overflow?", a different
 * question from "does this page overflow?", and the `mode` field exists so the two cannot be
 * read as the same number later. The style tag is not removed afterwards: the caller must treat
 * the page as modified from this point on.
 */
export async function measureDocumentWidths(
  page: Page,
  { neutraliseMask = false }: { neutraliseMask?: boolean } = {},
): Promise<DocumentWidths> {
  if (neutraliseMask) {
    await page.addStyleTag({ content: MASK_NEUTRALISER });
  }

  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    innerWidth: window.innerWidth,
  }));

  return { ...widths, mode: neutraliseMask ? 'mask-neutralised' : 'unmodified' };
}
