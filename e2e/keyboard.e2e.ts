import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { PRODUCTS_REGION_SELECTOR } from './fixtures/axe';
import { recordEvidence } from './fixtures/evidence';
import { PRIMARY_ACTIONS } from './fixtures/primary-actions';
import { SURFACES, assertNonEmptySubjects, type Surface } from './fixtures/surfaces';
import { VIEWPORTS, assertNonEmptyViewports, type ViewportEntry } from './fixtures/viewports';

/**
 * QUAL-02's keyboard half on the live HAOO page and the live Products region
 * (`05-UI-SPEC.md` § Keyboard and Focus Contract).
 *
 * **Division of labour with the static focus-contrast suite (KF-0). Read this before editing.**
 *
 * | Owner                                        | Question it answers                                                        |
 * |----------------------------------------------|----------------------------------------------------------------------------|
 * | `src/test/focus-contrast.test.ts` (vitest)   | Is the DECLARED ring at least 3:1 against its DECLARED offset?             |
 * | this spec (Playwright, live)                 | Does focusing this element by keyboard change its COMPUTED painted indicator at all? |
 *
 * The static suite exists in both repositories. It reads Tailwind literals out of source and
 * gates the ratio, and it owns the ratio. This spec adds the one thing a source read cannot see:
 * that a browser actually paints an indicator, at runtime, under real keyboard modality. It does
 * NOT restate, re-derive or override that gate. `MIN_FOCUS_CONTRAST`, `RING_COLOR_TOKENS`,
 * `DEFAULT_RING_OFFSET`, the ring extractor and the `pairs.length > 0` vacuity guard are out of
 * scope for modification here, and no contrast ratio is computed anywhere in this file. If the
 * two ever seem to disagree, they are answering different questions. Check which question failed
 * before touching either one.
 *
 * Focus is moved ONLY by real key presses (`page.keyboard.press`). `:focus-visible` depends on
 * input modality, so a scripted `element.focus()` would measure a state the keyboard visitor never
 * sees. There is no call anywhere in this file that scripts focus onto an element. The
 * script-focus destinations are the one deliberate exception to the rule, and their painted state
 * after a scripted focus is the preview-target form-state spec's job (UI-SPEC KF-5), not this
 * file's.
 *
 * Every stop is identified by its DOM position and recorded with the name the page exposes. Stops
 * are never matched against the primary-action list by name, so the known P5/P6 fixture gap (the
 * footer phone and email links are named by the bare value, not "Call …" / "Email …") cannot
 * distort a count here. The footer names are recorded exactly as the page ships them.
 *
 * Decision D-OQ-3 bounds the ZERO-PAPER HUB evidence at the Products region. On that surface the
 * whole document is traversed, because the region can only be reached by passing through the
 * header, but only stops inside the region are asserted. Every other reading there, including the
 * absent `main` landmark and the absent skip link (finding F5), is recorded as an observation and
 * never fails the run.
 *
 * Every measurement is written through `recordEvidence` BEFORE it is asserted, so a failing run
 * still leaves the reading that failed.
 */

/** The live HAOO page, and the live Products region on the ZERO-PAPER HUB home page. */
const HAOO = SURFACES.S1;
const PRODUCTS = SURFACES.S3;

/** The six-entry closed width list: the five D-09 product widths plus the 320 px reflow width. */
const WIDTHS = assertNonEmptyViewports(VIEWPORTS, 'VIEWPORTS for the keyboard contract');

/** Tailwind's `md` breakpoint: below it the section links are replaced by the navigation toggle. */
const MD_BREAKPOINT_PX = 768;

/** Tailwind's `lg` breakpoint: the brochure panel embeds the PDF at and above it, and shows an image below. */
const LG_BREAKPOINT_PX = 1024;

/** A live network round trip plus a full keyboard traversal does not fit the 30 s default. */
const LIVE_TIMEOUT_MS = 180_000;

/**
 * The bound on Tab presses in one traversal. The live page has about forty stops. A traversal
 * that has not left the document after this many presses has found a cycle or a trap, and the
 * bound turns that into a recorded failure instead of a hung run.
 */
const MAX_TAB_PRESSES = 200;

/** A reverse-tab probe is taken at every Nth stop, spreading the sample across the document. */
const REVERSE_SAMPLE_STRIDE = 5;

/** How many Tab presses the embedded viewer is given to release focus before its limit is recorded. */
const EMBED_EXIT_ATTEMPTS = 5;

/** How long to wait for the new tab or the download that a brochure action starts. */
const ACTIVATION_EVENT_TIMEOUT_MS = 15_000;

/** Evidence file names, one per measurement family. */
const EVIDENCE = {
  traversal: 'keyboard-traversal',
  scriptFocus: 'keyboard-script-focus',
  skipLink: 'keyboard-skip-link',
  products: 'keyboard-products-region',
  brochure: 'keyboard-brochure',
} as const;

/*
 * The expected opening stops (UI-SPEC KF-1), quoted from the shipped markup:
 *   - the skip link label is `skipToContentLabel('HAOO')` (`src/products/copy.ts`), rendered by
 *     `src/pages/ProductPage.tsx:92-94`;
 *   - the parent-site link is `src/components/ProductHeader.tsx:32-37`;
 *   - the five section links are `PRODUCT_LINKS` in `ProductHeader.tsx:11-17`;
 *   - the toggle's closed-state name is `navigationToggleLabel('HAOO', false)`;
 *   - the hero messaging and call actions are P4 and P5, read from the closed list.
 */
const SKIP_LINK_NAME = 'Skip to HAOO content';
const PARENT_LINK_NAME = 'Back to ZERO-PAPER HUB';
const SECTION_LINK_NAMES = ['Benefits', 'Capabilities', 'Brochure', 'Send details', 'Onboarding'] as const;
const NAV_TOGGLE_CLOSED_NAME = 'Open HAOO navigation';

function primaryAction(id: string): (typeof PRIMARY_ACTIONS)[number] {
  const action = PRIMARY_ACTIONS.find((entry) => entry.id === id);
  if (action === undefined) throw new Error(`PRIMARY_ACTIONS no longer carries ${id}`);
  return action;
}
const HERO_MESSAGE_NAME = primaryAction('P4').accessibleName;
const HERO_CALL_NAME = primaryAction('P5').accessibleName;
const OPEN_BROCHURE = primaryAction('P1');
const DOWNLOAD_BROCHURE = primaryAction('P2');
const SUBMIT_NAME = primaryAction('P3').accessibleName;
const EXPLORE_NAME = primaryAction('P9').accessibleName;

/** The screen-reader new-tab disclosure that must END P1's accessible name (`BrochurePanel.tsx:169`). */
const NEW_TAB_DISCLOSURE_PATTERN = /\(opens in a new tab\)$/;

/** The honeypot's visible label, quoted from `src/components/QualifyForm.tsx:526`. */
const HONEYPOT_LABEL = 'Leave this field blank';

/** The configured qualification provider's host. Routed to abort so no lead can ever leave. */
const QUALIFY_PROVIDER_PATTERN = /formsubmit\.co/;

interface ExpectedStop {
  readonly tag: string;
  readonly name: string;
}

/** UI-SPEC KF-1's opening sequence for the layout branch this width selects. */
function expectedOpeningStops(width: number): readonly ExpectedStop[] {
  const navigation: readonly ExpectedStop[] =
    width >= MD_BREAKPOINT_PX
      ? SECTION_LINK_NAMES.map((name) => ({ tag: 'a', name }))
      : [{ tag: 'button', name: NAV_TOGGLE_CLOSED_NAME }];
  return [
    { tag: 'a', name: SKIP_LINK_NAME },
    { tag: 'a', name: PARENT_LINK_NAME },
    ...navigation,
    { tag: 'a', name: HERO_MESSAGE_NAME },
    { tag: 'a', name: HERO_CALL_NAME },
  ];
}

/* ------------------------------------------------------------------------------------ *
 * Shared plumbing.
 * ------------------------------------------------------------------------------------ */

/**
 * Confine a test to the live project and give it a live-network budget. A skip rather than a
 * failure: the preview build has no deployed production to traverse.
 */
function requireLive(testInfo: TestInfo): void {
  test.skip(
    testInfo.project.name !== 'live',
    'the keyboard contract traverses the deployed journey and has no referent in the preview build',
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
     * The ZERO-PAPER HUB home reveals its sections through an IntersectionObserver. The Products
     * region is brought into view and given time to settle, so the stops inside it are read as a
     * visitor meets them. Scrolling does not move the sequential-focus starting point: the
     * traversal still begins at document start.
     */
    const region = page.locator(PRODUCTS_REGION_SELECTOR);
    await expect(region, 'the Products region is not on the page').toHaveCount(1);
    await region.scrollIntoViewIfNeeded();
    await expect(region).toBeVisible();
    await page.waitForTimeout(1500);
    return;
  }

  // A 404 shell has no populated <h1>. Traversing one would record a clean order for a page that
  // is not the page under test.
  await expect(page.locator('h1').first()).toBeVisible();
}

function viewportOf(viewport: ViewportEntry): { width: number; height: number } {
  return { width: viewport.width, height: viewport.height };
}

/* ------------------------------------------------------------------------------------ *
 * The painted indicator (KF-2).
 * ------------------------------------------------------------------------------------ */

/**
 * The four computed properties KF-2 captures before and after each keyboard-driven focus.
 *
 * The shipped ring utilities (`focus-visible:ring-2 …`) compile to a `box-shadow`, so that is the
 * property that normally carries the indicator on both sites. An `outline-none` with no ring is a
 * failure, not an indicator.
 */
const INDICATOR_PROPERTIES = ['outline-style', 'outline-width', 'outline-color', 'box-shadow'] as const;
type IndicatorProperty = (typeof INDICATOR_PROPERTIES)[number];
type IndicatorStyle = Readonly<Record<IndicatorProperty, string>>;

/** Every element that could become a sequential stop, snapshotted before each Tab press. */
const FOCUS_CANDIDATES =
  'a[href], area[href], button, input, select, textarea, summary, iframe, object, embed, [tabindex], [contenteditable]';

/** The alpha channel of a computed colour. Chromium serialises computed colours as `rgb()`/`rgba()`. */
function colourAlpha(colour: string): number {
  const value = colour.trim().toLowerCase();
  if (value === '' || value === 'transparent') return 0;
  const functional = /^rgba?\((.*)\)$/.exec(value);
  if (functional === null) return 1;
  const parts = functional[1].split(/[\s,/]+/).filter((part) => part !== '');
  if (parts.length < 4) return 1;
  const alpha = parts[3];
  return alpha.endsWith('%') ? Number.parseFloat(alpha) / 100 : Number.parseFloat(alpha);
}

/**
 * The `box-shadow` layers a visitor can actually see: a non-transparent colour AND at least one
 * non-zero offset, blur or spread. Tailwind's ring variables leave transparent zero-size layers
 * behind on every element, so a layer merely being present means nothing.
 */
function visibleShadowLayers(boxShadow: string): string[] {
  if (boxShadow.trim() === '' || boxShadow.trim() === 'none') return [];
  return boxShadow
    .split(/,(?![^(]*\))/)
    .map((layer) => layer.trim())
    .filter((layer) => {
      const colour = /rgba?\([^)]*\)|transparent/i.exec(layer)?.[0] ?? '';
      const lengths = (layer.replace(colour, '').match(/-?\d*\.?\d+px/g) ?? []).map((length) =>
        Number.parseFloat(length),
      );
      return (colour === '' ? 1 : colourAlpha(colour)) > 0 && lengths.some((length) => length !== 0);
    });
}

/**
 * Whether the outline paints anything. The UI-SPEC's literal test is `outline-width > 0`, but
 * Tailwind's `outline-none` compiles to `outline: 2px solid transparent`, which passes that test
 * while painting nothing. That was measured on the live ZERO-PAPER HUB contact-form inputs during
 * this plan. So the style, the width AND the colour must all be non-empty.
 */
function outlineVisible(style: IndicatorStyle): boolean {
  return (
    style['outline-style'] !== 'none' &&
    Number.parseFloat(style['outline-width']) > 0 &&
    colourAlpha(style['outline-color']) > 0
  );
}

interface IndicatorReading {
  /** The element's four properties before the Tab press that focused it, or `null` if not read. */
  readonly before: IndicatorStyle | null;
  readonly after: IndicatorStyle;
  readonly changedProperties: readonly IndicatorProperty[];
  /** Visible `box-shadow` layers present after focus that were not present before it. */
  readonly addedShadowLayers: readonly string[];
  readonly outlineVisibleBefore: boolean;
  readonly outlineVisibleAfter: boolean;
  /** KF-2's non-empty test, with transparent colours treated as empty. */
  readonly nonEmpty: boolean;
  /** Whether the visible part of the indicator was painted by focus rather than already there. */
  readonly addedByFocus: boolean;
}

function readIndicator(before: IndicatorStyle | null, after: IndicatorStyle): IndicatorReading {
  const changedProperties =
    before === null ? [] : INDICATOR_PROPERTIES.filter((property) => before[property] !== after[property]);
  const beforeLayers = new Set(before === null ? [] : visibleShadowLayers(before['box-shadow']));
  const afterLayers = visibleShadowLayers(after['box-shadow']);
  const addedShadowLayers = afterLayers.filter((layer) => !beforeLayers.has(layer));
  const outlineVisibleBefore = before !== null && outlineVisible(before);
  const outlineVisibleAfter = outlineVisible(after);
  const outlineChanged =
    before !== null &&
    (['outline-style', 'outline-width', 'outline-color'] as const).some((property) => before[property] !== after[property]);

  return {
    before,
    after,
    changedProperties,
    addedShadowLayers,
    outlineVisibleBefore,
    outlineVisibleAfter,
    nonEmpty: afterLayers.length > 0 || outlineVisibleAfter,
    addedByFocus:
      before !== null && (addedShadowLayers.length > 0 || (outlineVisibleAfter && (!outlineVisibleBefore || outlineChanged))),
  };
}

/** Every way a stop's indicator reading falls short, as words. `[]` means an indicator was painted. */
function indicatorDefects(indicator: IndicatorReading): string[] {
  const defects: string[] = [];
  if (indicator.before === null) {
    defects.push('no computed style was read before focus, so no change can be shown');
    return defects;
  }
  if (indicator.changedProperties.length === 0) defects.push('focus changed none of the four properties');
  if (!indicator.nonEmpty) defects.push('the indicator after focus is empty: no visible box-shadow layer and no visible outline');
  if (indicator.nonEmpty && !indicator.addedByFocus) {
    defects.push('what is visible after focus was already painted before it, so focus added nothing');
  }
  return defects;
}

/** Every focus candidate's four properties, keyed by DOM position, read immediately before a Tab press. */
async function snapshotIndicators(page: Page): Promise<Record<number, IndicatorStyle>> {
  return page.evaluate(
    ({ properties, selector }) => {
      const snapshot: Record<number, Record<string, string>> = {};
      const all = document.getElementsByTagName('*');
      for (let index = 0; index < all.length; index += 1) {
        const element = all[index];
        if (!element.matches(selector)) continue;
        const style = window.getComputedStyle(element);
        snapshot[index] = Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]));
      }
      return snapshot as Record<number, IndicatorStyle>;
    },
    { properties: [...INDICATOR_PROPERTIES], selector: FOCUS_CANDIDATES },
  );
}

/* ------------------------------------------------------------------------------------ *
 * Reading the active element.
 * ------------------------------------------------------------------------------------ */

/** What one Tab press landed on. */
interface ActiveReading {
  /** True when focus is on no element of the document (`<body>` or nothing): it has left. */
  readonly left: boolean;
  readonly tag: string;
  /**
   * The name the element exposes, approximated in-page for the record: `aria-labelledby`, then
   * `aria-label`, then the associated `<label>`s, then rendered text. Where an accessible name is
   * load-bearing for an assertion, Playwright's own `toHaveAccessibleName` is used instead.
   */
  readonly name: string;
  /** The element's position in document order: its index in `getElementsByTagName('*')`. */
  readonly domIndex: number;
  readonly tabIndex: number;
  readonly href: string;
  readonly insideMain: boolean;
  readonly insideHeader: boolean;
  readonly insideFooter: boolean;
  /** Whether the element is inside the scoped region, or `null` on a surface measured whole. */
  readonly insideRegion: boolean | null;
  /** The four indicator properties as computed right now. */
  readonly style: IndicatorStyle;
}

async function readActive(page: Page, regionSelector: string | null): Promise<ActiveReading> {
  return page.evaluate(
    ({ properties, region }) => {
      const active = document.activeElement as HTMLElement | null;
      const left = active === null || active === document.body || active === document.documentElement;

      const nameOf = (element: HTMLElement): string => {
        const collapse = (text: string | null | undefined): string => (text ?? '').replace(/\s+/g, ' ').trim();
        const labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
          return collapse(
            labelledBy
              .split(/\s+/)
              .map((id) => document.getElementById(id)?.innerText ?? '')
              .join(' '),
          );
        }
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) return collapse(ariaLabel);
        const labels = (element as HTMLInputElement).labels;
        if (labels && labels.length > 0) {
          return collapse(Array.from(labels).map((label) => label.innerText).join(' '));
        }
        return collapse(element.innerText || element.getAttribute('title'));
      };

      const computed = active === null ? null : window.getComputedStyle(active);
      const all = document.getElementsByTagName('*');
      return {
        left,
        tag: active === null ? 'null' : active.tagName.toLowerCase(),
        name: active !== null && !left ? nameOf(active) : '',
        domIndex: active === null ? -1 : Array.prototype.indexOf.call(all, active),
        tabIndex: active === null ? 0 : active.tabIndex,
        href: active?.getAttribute('href') ?? '',
        insideMain: active?.closest('main') != null,
        insideHeader: active?.closest('header') != null,
        insideFooter: active?.closest('footer') != null,
        insideRegion: region === null ? null : active?.closest(region) != null,
        style: Object.fromEntries(
          properties.map((property) => [property, computed?.getPropertyValue(property) ?? '']),
        ) as Record<string, string>,
      };
    },
    { properties: [...INDICATOR_PROPERTIES], region: regionSelector },
  ) as Promise<ActiveReading>;
}

/* ------------------------------------------------------------------------------------ *
 * The traversal.
 * ------------------------------------------------------------------------------------ */

interface Stop extends ActiveReading {
  /** 1-based position in the traversal. */
  readonly order: number;
  readonly indicator: IndicatorReading;
}

/** One reverse-tab probe: from a stop, Shift+Tab, then Tab again. */
interface ReverseProbe {
  readonly fromOrder: number;
  readonly fromName: string;
  readonly fromDomIndex: number;
  /** Where Shift+Tab should land: the preceding captured stop, or `-1` meaning "left the document". */
  readonly expectedDomIndex: number;
  readonly landedDomIndex: number;
  readonly landedLeft: boolean;
  readonly landedName: string;
  /** Where the following Tab came back to. */
  readonly returnedDomIndex: number;
  readonly returnedLeft: boolean;
}

interface Traversal {
  readonly stops: readonly Stop[];
  /** Whether a Tab press took focus out of the document before the press bound was reached. */
  readonly exited: boolean;
  /** The number of Tab presses made, including the one that left. */
  readonly tabPresses: number;
  /** A DOM position that was reached twice before leaving (a cycle), or `-1` for none. */
  readonly repeatedDomIndex: number;
  readonly reverseProbes: readonly ReverseProbe[];
}

interface TraversalOptions {
  /** The region stops are attributed to, or `null` on a surface measured whole. */
  readonly regionSelector: string | null;
  /** Whether to take a reverse-tab probe at this stop, given the stops captured so far. */
  readonly reverseWhen: (stops: readonly Stop[]) => boolean;
}

/**
 * Shift+Tab from the current stop, then Tab back. `expectedDomIndex` is the stop that should be
 * reached going backwards: the preceding captured stop, or `-1` for the first stop, where going
 * backwards should leave the document.
 */
async function probeReverse(
  page: Page,
  from: Stop,
  expectedDomIndex: number,
  regionSelector: string | null,
): Promise<ReverseProbe> {
  await page.keyboard.press('Shift+Tab');
  const landed = await readActive(page, regionSelector);
  await page.keyboard.press('Tab');
  const returned = await readActive(page, regionSelector);
  return {
    fromOrder: from.order,
    fromName: from.name,
    fromDomIndex: from.domIndex,
    expectedDomIndex,
    landedDomIndex: landed.left ? -1 : landed.domIndex,
    landedLeft: landed.left,
    landedName: landed.name,
    returnedDomIndex: returned.left ? -1 : returned.domIndex,
    returnedLeft: returned.left,
  };
}

/**
 * Tab forward from wherever focus is now until focus leaves the document, capturing every stop
 * together with its painted-indicator reading.
 *
 * Before each press, every focus candidate's four properties are snapshotted, so the element the
 * press lands on has a "before" reading taken while it was not yet focused, and no focus had to be
 * scripted to get it. The traversal stops early on a repeated DOM position (a cycle) or at the
 * press bound (a trap), and records which one happened. It never asserts: the caller records the
 * result first and asserts after.
 */
async function traverse(page: Page, options: TraversalOptions): Promise<Traversal> {
  const stops: Stop[] = [];
  const reverseProbes: ReverseProbe[] = [];
  const seen = new Set<number>();
  let exited = false;
  let repeatedDomIndex = -1;
  let tabPresses = 0;

  while (tabPresses < MAX_TAB_PRESSES) {
    const before = await snapshotIndicators(page);
    await page.keyboard.press('Tab');
    tabPresses += 1;
    const reading = await readActive(page, options.regionSelector);
    if (reading.left) {
      exited = true;
      break;
    }
    if (seen.has(reading.domIndex)) {
      repeatedDomIndex = reading.domIndex;
      break;
    }
    seen.add(reading.domIndex);
    const stop: Stop = {
      ...reading,
      order: stops.length + 1,
      indicator: readIndicator(before[reading.domIndex] ?? null, reading.style),
    };
    stops.push(stop);

    if (options.reverseWhen(stops)) {
      const previous = stops.length >= 2 ? stops[stops.length - 2].domIndex : -1;
      reverseProbes.push(await probeReverse(page, stop, previous, options.regionSelector));
    }
  }

  return { stops, exited, tabPresses, repeatedDomIndex, reverseProbes };
}

/** Every adjacent pair whose DOM positions do not increase. Tab order equal to DOM order is `[]`. */
function orderViolations(stops: readonly Stop[]): string[] {
  const violations: string[] = [];
  for (let index = 1; index < stops.length; index += 1) {
    const previous = stops[index - 1];
    const current = stops[index];
    if (current.domIndex <= previous.domIndex) {
      violations.push(
        `stop ${current.order} <${current.tag}> '${current.name}' (DOM ${current.domIndex}) follows stop ${previous.order} <${previous.tag}> '${previous.name}' (DOM ${previous.domIndex})`,
      );
    }
  }
  return violations;
}

/** Every reverse probe that did not land on its expected stop, or did not come back. */
function reverseDefects(probes: readonly ReverseProbe[]): string[] {
  return probes.flatMap((probe) => {
    const defects: string[] = [];
    if (probe.landedDomIndex !== probe.expectedDomIndex) {
      defects.push(
        `Shift+Tab from stop ${probe.fromOrder} '${probe.fromName}' landed on DOM ${probe.landedDomIndex} '${probe.landedName}', expected DOM ${probe.expectedDomIndex}`,
      );
    }
    if (probe.returnedDomIndex !== probe.fromDomIndex) {
      defects.push(
        `Tab after that probe returned to DOM ${probe.returnedDomIndex}, not to stop ${probe.fromOrder} (DOM ${probe.fromDomIndex})`,
      );
    }
    return defects;
  });
}

interface UnindicatedStop {
  readonly order: number;
  readonly tag: string;
  readonly name: string;
  readonly domIndex: number;
  readonly defects: readonly string[];
}

/** Every stop whose indicator reading falls short, listed individually: never an aggregate. */
function unindicatedStops(stops: readonly Stop[]): UnindicatedStop[] {
  return stops
    .map((stop) => ({
      order: stop.order,
      tag: stop.tag,
      name: stop.name,
      domIndex: stop.domIndex,
      defects: indicatorDefects(stop.indicator),
    }))
    .filter((stop) => stop.defects.length > 0);
}

/* ------------------------------------------------------------------------------------ *
 * Page-level readings.
 * ------------------------------------------------------------------------------------ */

interface PositiveTabIndexOffender {
  readonly tag: string;
  readonly name: string;
  readonly tabIndex: number;
  readonly insideRegion: boolean | null;
}

/**
 * Every element in the document with a tab index greater than zero. This is a page-level property,
 * not a per-element one: a single positive value re-orders the whole document, so the query is
 * document-wide rather than limited to the stops a traversal happened to reach.
 */
async function positiveTabIndexOffenders(page: Page, regionSelector: string | null): Promise<PositiveTabIndexOffender[]> {
  return page.evaluate(
    (region) =>
      Array.from(document.getElementsByTagName('*'))
        .filter((element) => (element as HTMLElement).tabIndex > 0)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          name: (element.getAttribute('aria-label') ?? (element as HTMLElement).innerText ?? '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80),
          tabIndex: (element as HTMLElement).tabIndex,
          insideRegion: region === null ? null : element.closest(region) !== null,
        })),
    regionSelector,
  );
}

interface ScriptFocusReading {
  /** Whether the destination is in the DOM in the current state. */
  readonly present: boolean;
  /** The raw `tabindex` attribute, or `''` when absent. */
  readonly tabIndexAttribute: string;
  readonly domIndex: number;
}

/** The honeypot control, found through its label's `for` rather than through a guessed selector. */
async function readHoneypot(page: Page): Promise<ScriptFocusReading> {
  return page.evaluate((labelText) => {
    const label = Array.from(document.querySelectorAll('label')).find(
      (candidate) => candidate.textContent?.trim() === labelText,
    );
    const control = label?.htmlFor ? document.getElementById(label.htmlFor) : null;
    return {
      present: control !== null,
      tabIndexAttribute: control?.getAttribute('tabindex') ?? '',
      domIndex: control === null ? -1 : Array.prototype.indexOf.call(document.getElementsByTagName('*'), control),
    };
  }, HONEYPOT_LABEL);
}

/**
 * The error-summary container: the `tabindex` wrapper around the form's `role="alert"`
 * (`src/components/QualifyForm.tsx:538-561`). Absent in the default state by construction.
 */
async function readErrorSummary(page: Page): Promise<ScriptFocusReading> {
  return page.evaluate(() => {
    const alert = document.querySelector('form [role="alert"]');
    const container = alert?.parentElement ?? null;
    return {
      present: container !== null,
      tabIndexAttribute: container?.getAttribute('tabindex') ?? '',
      domIndex: container === null ? -1 : Array.prototype.indexOf.call(document.getElementsByTagName('*'), container),
    };
  });
}

/** The DOM position of the last link in the footer: where forward traversal must end. */
async function lastFooterLinkDomIndex(page: Page): Promise<number> {
  return page.evaluate(() => {
    const links = document.querySelectorAll('footer a[href]');
    const last = links.item(links.length - 1);
    return last === null ? -1 : Array.prototype.indexOf.call(document.getElementsByTagName('*'), last);
  });
}

/** Tab forward from the current focus until the active element has this name, within the bound. */
async function tabUntilName(page: Page, name: string): Promise<ActiveReading> {
  for (let press = 0; press < MAX_TAB_PRESSES; press += 1) {
    await page.keyboard.press('Tab');
    const reading = await readActive(page, null);
    if (!reading.left && reading.name === name) return reading;
  }
  throw new Error(`no Tab stop named '${name}' was reached within ${MAX_TAB_PRESSES} presses`);
}

interface BoxReading {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
  readonly innerWidth: number;
  readonly innerHeight: number;
}

/** The bounding box of the active element, or of the element at `selector`, against the viewport. */
async function readBox(page: Page, selector: string | null): Promise<BoxReading> {
  return page.evaluate((target) => {
    const element = target === null ? document.activeElement : document.querySelector(target);
    const rect = element?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0);
    const round = (value: number): number => Math.round(value * 100) / 100;
    return {
      left: round(rect.left),
      top: round(rect.top),
      right: round(rect.right),
      bottom: round(rect.bottom),
      width: round(rect.width),
      height: round(rect.height),
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  }, selector);
}

/** Dialog semantics anywhere on the page. The brochure panel is not modal, so this must read 0. */
async function countModalSemantics(page: Page): Promise<number> {
  return page.locator('dialog, [role="dialog"], [role="alertdialog"], [aria-modal="true"]').count();
}

/**
 * Fixed or sticky elements, rendered and covering at least half the viewport: an overlay by any
 * useful definition. The brochure panel is not modal, so this must read 0.
 */
async function countOverlays(page: Page): Promise<number> {
  return page.evaluate(() => {
    const viewportArea = window.innerWidth * window.innerHeight;
    return Array.from(document.body.getElementsByTagName('*')).filter((element) => {
      const style = window.getComputedStyle(element);
      if (style.position !== 'fixed' && style.position !== 'sticky') return false;
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = element.getBoundingClientRect();
      const width = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
      const height = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      return width * height >= viewportArea / 2;
    }).length;
  });
}

/* ------------------------------------------------------------------------------------ *
 * KF-1 to KF-4, at every width in the closed list.
 * ------------------------------------------------------------------------------------ */

for (const viewport of WIDTHS) {
  test.describe(`keyboard contract at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport: viewportOf(viewport) });

    test('S1 — KF-1 tab order equals DOM order, traversal terminates and reverses; KF-2 every stop paints an indicator', async ({ page }, testInfo) => {
      requireLive(testInfo);
      await openSurface(page, HAOO);

      // Page-level readings first, on the untouched default state.
      const offenders = await positiveTabIndexOffenders(page, null);
      const honeypot = await readHoneypot(page);
      const errorSummary = await readErrorSummary(page);
      const lastFooterLink = await lastFooterLinkDomIndex(page);

      // The traversal: real Tab presses from document start until focus leaves the document.
      const traversal = await traverse(page, {
        regionSelector: null,
        reverseWhen: (stops) => stops.length === 1 || (stops.length - 1) % REVERSE_SAMPLE_STRIDE === 0,
      });

      // Having left the document: Shift+Tab must come back to the last stop, and Tab must leave
      // again. That is the exit being reversible, not only reachable.
      const lastStop = traversal.stops.at(-1);
      let exitProbe: ReverseProbe | null = null;
      if (traversal.exited && lastStop !== undefined) {
        await page.keyboard.press('Shift+Tab');
        const landed = await readActive(page, null);
        await page.keyboard.press('Tab');
        const returned = await readActive(page, null);
        exitProbe = {
          fromOrder: traversal.stops.length + 1,
          fromName: '(outside the document)',
          fromDomIndex: -1,
          expectedDomIndex: lastStop.domIndex,
          landedDomIndex: landed.left ? -1 : landed.domIndex,
          landedLeft: landed.left,
          landedName: landed.name,
          returnedDomIndex: returned.left ? -1 : returned.domIndex,
          returnedLeft: returned.left,
        };
      }

      const expectedOpening = expectedOpeningStops(viewport.width);
      const capturedOpening = traversal.stops
        .slice(0, expectedOpening.length)
        .map((stop) => ({ tag: stop.tag, name: stop.name }));
      const violations = orderViolations(traversal.stops);
      const reverse = reverseDefects([...traversal.reverseProbes, ...(exitProbe === null ? [] : [exitProbe])]);
      const unindicated = unindicatedStops(traversal.stops);
      const stopDomIndexes = new Set(traversal.stops.map((stop) => stop.domIndex));

      recordEvidence(EVIDENCE.traversal, {
        surface: HAOO.id,
        viewport: viewportOf(viewport),
        measured: {
          stopCount: traversal.stops.length,
          indicatedStopCount: traversal.stops.length - unindicated.length,
          unindicatedStops: unindicated,
          tabPresses: traversal.tabPresses,
          exitedDocument: traversal.exited,
          repeatedDomIndex: traversal.repeatedDomIndex,
          positiveTabIndexCount: offenders.length,
          positiveTabIndexOffenders: offenders,
          orderViolations: violations,
          orderViolationCount: violations.length,
          expectedOpening,
          capturedOpening,
          lastFooterLinkDomIndex: lastFooterLink,
          lastStopDomIndex: lastStop?.domIndex ?? -1,
          reverseProbes: traversal.reverseProbes,
          exitProbe: exitProbe ?? 'no exit reached',
          reverseDefectCount: reverse.length,
          stops: traversal.stops,
        },
        detail: {
          plan: '05-09',
          project: testInfo.project.name,
          url: page.url(),
          viewportReason: viewport.reason,
          layoutBranch: viewport.width >= MD_BREAKPOINT_PX ? 'desktop section links (md and up)' : 'navigation toggle (below md)',
          method: 'page.keyboard.press("Tab") from document start until document.activeElement is <body>',
          domIndexMeaning: 'index of the element in document.getElementsByTagName("*"), i.e. document order',
          reverseSampling: `Shift+Tab then Tab at the first stop, at every ${REVERSE_SAMPLE_STRIDE}th stop after it, and from outside the document after the exit`,
          pressBound: MAX_TAB_PRESSES,
          indicatorProperties: [...INDICATOR_PROPERTIES],
          indicatorMethod:
            'every focus candidate snapshotted immediately before each Tab press; the landed element compared before vs after',
          nonEmptyMeaning:
            'a box-shadow layer with a non-transparent colour and a non-zero length, or an outline whose style, width and colour are all non-empty',
          staticSuite: 'the declared ring ratio is owned by src/test/focus-contrast.test.ts and is not measured here',
        },
      });

      recordEvidence(EVIDENCE.scriptFocus, {
        surface: HAOO.id,
        viewport: viewportOf(viewport),
        measured: {
          state: 'default',
          honeypot,
          honeypotIsStop: stopDomIndexes.has(honeypot.domIndex),
          errorSummary,
          confirmationHeading: 'not rendered in the default state; covered by the preview-target form-state spec (UI-SPEC KF-5, success row)',
          failureHeading: 'not rendered in the default state; covered by the preview-target form-state spec (UI-SPEC KF-5, transport failure / blocked rows)',
        },
        detail: {
          plan: '05-09',
          url: page.url(),
          honeypotLocatedBy: `the <label> whose text is '${HONEYPOT_LABEL}' and its for attribute`,
          errorSummaryState: 'the error summary exists only in the invalid state, measured in its own test',
        },
      });

      // Ordering: no positive tab index anywhere in the document, offenders reported by name.
      expect(
        offenders,
        `elements with a positive tab index re-order the whole document: ${JSON.stringify(offenders)}`,
      ).toEqual([]);

      // The traversal reached something, and it ended by leaving the document: no cycle, no trap.
      assertNonEmptySubjects(traversal.stops, `keyboard stops on ${HAOO.id} at ${viewport.width}px`);
      expect(traversal.repeatedDomIndex, 'a stop repeated before focus left the document: a cycle').toBe(-1);
      expect(
        traversal.exited,
        `focus did not leave the document within ${MAX_TAB_PRESSES} Tab presses: a trap`,
      ).toBe(true);

      // Tab order equals DOM order, measured.
      expect(violations, `tab order departs from DOM order:\n${violations.join('\n')}`).toEqual([]);
      expect(
        traversal.stops.filter((stop) => stop.tabIndex < 0).map((stop) => stop.name),
        'a stop with a negative tab index was reached sequentially',
      ).toEqual([]);

      // The opening sequence for this layout branch.
      expect(capturedOpening, `the opening stops at ${viewport.width}px`).toEqual(expectedOpening);

      // Termination: the last stop is the last footer link, and the next Tab left the document.
      expect(lastFooterLink, 'the footer has no link to end on').toBeGreaterThan(-1);
      expect(lastStop?.domIndex, 'the traversal did not end on the last footer link').toBe(lastFooterLink);

      // Reversibility: every sampled stop can be left backwards to the stop before it, and the
      // exit can be re-entered backwards.
      expect(traversal.reverseProbes.length, 'no reverse probe was taken').toBeGreaterThan(1);
      expect(exitProbe, 'no probe from outside the document').not.toBeNull();
      expect(reverse, `reverse traversal defects:\n${reverse.join('\n')}`).toEqual([]);

      // The script-focus destination present in this state: tabindex -1, and never a stop.
      expect(honeypot.present, 'the honeypot control is not on the page').toBe(true);
      expect(honeypot.tabIndexAttribute, 'the honeypot control').toBe('-1');
      expect(stopDomIndexes.has(honeypot.domIndex), 'the honeypot control is a sequential tab stop').toBe(false);
      expect(errorSummary.present, 'the error summary rendered in the default state').toBe(false);

      // KF-2: every stop paints an indicator on keyboard focus, each shortfall listed by stop.
      expect(
        unindicated,
        `${unindicated.length} of ${traversal.stops.length} stops paint no indicator:\n${JSON.stringify(unindicated, null, 2)}`,
      ).toEqual([]);
    });

    test('S1 — KF-3 the skip link is the first stop, visible on focus, and moves focus into the main region', async ({ page }, testInfo) => {
      requireLive(testInfo);
      await openSurface(page, HAOO);

      const main = page.locator('main');
      await expect(main, 'the HAOO page does not have exactly one <main>').toHaveCount(1);
      const mainId = (await main.getAttribute('id')) ?? '';
      expect(mainId.length, 'the <main> region has no id for the skip link to target').toBeGreaterThan(0);

      // Before focus the link is visually hidden (`sr-only`): recorded, to show what focus changed.
      const boxBeforeFocus = await readBox(page, `a[href="#${mainId}"]`);

      await page.keyboard.press('Tab');
      const first = await readActive(page, null);
      const boxOnFocus = await readBox(page, null);

      await page.keyboard.press('Enter');
      const hashAfterActivation = await page.evaluate(() => window.location.hash);
      await page.keyboard.press('Tab');
      const next = await readActive(page, null);
      const nextInsideTargetMain = await page.evaluate(
        (id) => document.activeElement?.closest(`main[id="${id}"]`) != null,
        mainId,
      );

      recordEvidence(EVIDENCE.skipLink, {
        surface: HAOO.id,
        viewport: viewportOf(viewport),
        measured: {
          firstStop: { tag: first.tag, name: first.name, href: first.href, domIndex: first.domIndex },
          boxBeforeFocus,
          boxOnFocus,
          hashAfterActivation,
          nextStop: {
            tag: next.tag,
            name: next.name,
            domIndex: next.domIndex,
            insideHeader: next.insideHeader,
            insideMain: next.insideMain,
          },
          nextInsideTargetMain,
        },
        detail: {
          plan: '05-09',
          url: page.url(),
          viewportReason: viewport.reason,
          mainId,
          method: 'Tab from document start, read the box; Enter; Tab once more and read where focus landed',
        },
      });

      expect(first.tag, 'the first stop is not a link').toBe('a');
      expect(first.name, 'the first stop is not the skip link').toBe(SKIP_LINK_NAME);
      expect(first.href, 'the skip link does not target the main region').toBe(`#${mainId}`);

      expect(boxOnFocus.width, 'the focused skip link has zero width').toBeGreaterThan(0);
      expect(boxOnFocus.height, 'the focused skip link has zero height').toBeGreaterThan(0);
      expect(boxOnFocus.left, 'the focused skip link starts left of the viewport').toBeGreaterThanOrEqual(0);
      expect(boxOnFocus.top, 'the focused skip link starts above the viewport').toBeGreaterThanOrEqual(0);
      expect(boxOnFocus.right, 'the focused skip link overruns the viewport width').toBeLessThanOrEqual(boxOnFocus.innerWidth);
      expect(boxOnFocus.bottom, 'the focused skip link overruns the viewport height').toBeLessThanOrEqual(boxOnFocus.innerHeight);

      expect(hashAfterActivation, 'activating the skip link did not move the document to the main region').toBe(`#${mainId}`);
      expect(next.left, 'the Tab after the skip link left the document').toBe(false);
      expect(nextInsideTargetMain, `the Tab after the skip link landed on '${next.name}', outside the main region`).toBe(true);
      expect(next.insideHeader, 'the Tab after the skip link went back into the header').toBe(false);
    });

    test('S1 — KF-4 the brochure panel is not modal: both actions are ordinary stops, and the embedded viewer is probed', async ({ page }, testInfo) => {
      requireLive(testInfo);
      await openSurface(page, HAOO);

      const layoutBranch =
        viewport.width >= LG_BREAKPOINT_PX ? 'embedded PDF <object> (lg and up)' : 'compact image preview (below lg)';
      const embed = page.locator('#brochure object');
      const embedRendered = (await embed.count()) === 1 && (await embed.isVisible());
      const embedDocumentType = embedRendered
        ? await embed.evaluate((element) => {
            try {
              return (element as HTMLObjectElement).contentDocument?.contentType ?? 'no content document';
            } catch (error) {
              return `unreadable: ${(error as Error).name}`;
            }
          })
        : 'no embed rendered in this layout branch';
      const fallbackHeadingVisible = await page
        .getByRole('heading', { name: 'Brochure preview unavailable', exact: true })
        .isVisible();

      /*
       * Walk from document start to P1 by keyboard. If a Tab lands on the embedded viewer, give it
       * EMBED_EXIT_ATTEMPTS further presses to release focus.
       */
      const keySequence: string[] = [];
      let embedEntered = false;
      let embedLeft = false;
      let embedRestingPlace = '';
      let reachedOpen: ActiveReading | null = null;
      for (let press = 0; press < MAX_TAB_PRESSES && reachedOpen === null; press += 1) {
        await page.keyboard.press('Tab');
        keySequence.push('Tab');
        const reading = await readActive(page, null);
        if (reading.left) break;
        if (['object', 'embed', 'iframe'].includes(reading.tag)) {
          embedEntered = true;
          for (let attempt = 0; attempt < EMBED_EXIT_ATTEMPTS; attempt += 1) {
            await page.keyboard.press('Tab');
            keySequence.push('Tab (inside embed)');
            const after = await readActive(page, null);
            embedRestingPlace = `<${after.tag}> '${after.name}' (DOM ${after.domIndex})`;
            if (!['object', 'embed', 'iframe'].includes(after.tag)) {
              embedLeft = true;
              if (after.name === OPEN_BROCHURE.accessibleName) reachedOpen = after;
              break;
            }
          }
          if (!embedLeft) break;
          continue;
        }
        if (reading.name === OPEN_BROCHURE.accessibleName) reachedOpen = reading;
      }

      const embedOutcome = embedEntered
        ? embedLeft
          ? 'focus entered the embedded viewer and Tab moved it out again'
          : `focus entered the embedded viewer and did not leave within ${EMBED_EXIT_ATTEMPTS} Tab presses`
        : embedRendered
          ? 'focus never entered the embedded viewer: Tab moved from the stop before it directly to the brochure actions'
          : 'no embedded viewer in this layout branch';

      const open = page.getByRole('link', { name: OPEN_BROCHURE.accessibleName, exact: true });
      const download = page.getByRole('link', { name: DOWNLOAD_BROCHURE.accessibleName, exact: true });
      const openAttributes = {
        target: (await open.getAttribute('target')) ?? '',
        rel: (await open.getAttribute('rel')) ?? '',
        href: (await open.getAttribute('href')) ?? '',
      };
      const modalBefore = await countModalSemantics(page);
      const overlaysBefore = await countOverlays(page);

      // Activate P1 by keyboard. It opens a new browsing context; the page itself must not change.
      let popupUrl = '';
      let openActivated = false;
      let focusAfterOpen: ActiveReading | null = null;
      let downloadStarted = false;
      let downloadName = '';
      let reachedDownload: ActiveReading | null = null;
      let downloadStateAfterOpen = { count: 0, enabled: false, href: '' };
      let openStateAfterDownload = { count: 0, enabled: false, href: '' };
      if (reachedOpen !== null) {
        const popupEvent = page.context().waitForEvent('page', { timeout: ACTIVATION_EVENT_TIMEOUT_MS }).catch(() => null);
        await page.keyboard.press('Enter');
        const popup = await popupEvent;
        openActivated = popup !== null;
        if (popup !== null) {
          /*
           * The new tab points at a PDF, which headless Chromium may turn into a download rather
           * than a document. So the URL is read as it is, and only an uncommitted `about:blank` is
           * waited on, briefly: waiting for a load state that a download never reaches would hang
           * this test at every width.
           */
          popupUrl = popup.url();
          if (popupUrl === '' || popupUrl === 'about:blank') {
            await popup
              .waitForURL((url) => url.href !== 'about:blank', { timeout: 5_000 })
              .catch(() => undefined);
            popupUrl = popup.url();
          }
          if (popupUrl === '') {
            // Measured: headless Chromium has no PDF viewer, so the new tab becomes a download and
            // never commits a URL to report. The tab opening is the observation; its address is not
            // observable here, and saying so is better than recording an empty string as a reading.
            popupUrl = 'a new browsing context opened, but headless Chromium reported no URL for it (the PDF became a download)';
          }
          await popup.close();
        }
        focusAfterOpen = await readActive(page, null);
        downloadStateAfterOpen = {
          count: await download.count(),
          enabled: await download.isEnabled(),
          href: (await download.getAttribute('href')) ?? '',
        };

        // P2 must be the very next stop, and operable by keyboard.
        await page.keyboard.press('Tab');
        const afterOpen = await readActive(page, null);
        if (afterOpen.name === DOWNLOAD_BROCHURE.accessibleName) {
          reachedDownload = afterOpen;
          const downloadEvent = page.waitForEvent('download', { timeout: ACTIVATION_EVENT_TIMEOUT_MS }).catch(() => null);
          await page.keyboard.press('Enter');
          const started = await downloadEvent;
          downloadStarted = started !== null;
          if (started !== null) {
            downloadName = started.suggestedFilename();
            await started.cancel();
          }
          openStateAfterDownload = {
            count: await open.count(),
            enabled: await open.isEnabled(),
            href: (await open.getAttribute('href')) ?? '',
          };
        }
      }
      const modalAfter = await countModalSemantics(page);
      const overlaysAfter = await countOverlays(page);

      recordEvidence(EVIDENCE.brochure, {
        surface: HAOO.id,
        viewport: viewportOf(viewport),
        measured: {
          layoutBranch,
          embedRendered,
          embedDocumentType,
          fallbackHeadingVisible,
          embedEntered,
          embedLeft,
          embedOutcome,
          embedRestingPlace: embedRestingPlace === '' ? 'focus never came to rest inside the embed' : embedRestingPlace,
          keySequenceLength: keySequence.length,
          keySequence,
          openReachedByTab: reachedOpen === null ? 'not reached' : { domIndex: reachedOpen.domIndex, name: reachedOpen.name },
          openAttributes,
          openActivated,
          popupUrl: popupUrl === '' ? 'no new browsing context observed' : popupUrl,
          focusAfterOpen: focusAfterOpen === null ? 'not activated' : { tag: focusAfterOpen.tag, name: focusAfterOpen.name },
          downloadStateAfterOpen,
          downloadReachedByTab: reachedDownload === null ? 'not reached' : { domIndex: reachedDownload.domIndex, name: reachedDownload.name },
          downloadStarted,
          downloadName: downloadName === '' ? 'no download observed' : downloadName,
          openStateAfterDownload,
          modalSemanticsBefore: modalBefore,
          modalSemanticsAfter: modalAfter,
          overlaysBefore,
          overlaysAfter,
        },
        detail: {
          plan: '05-09',
          url: page.url(),
          viewportReason: viewport.reason,
          contract:
            'UI-SPEC KF-4: the panel is not modal by design, so no focus trap and no focus return is asserted; a trap assertion would fail a correct component',
          embedDiscipline:
            'if the embedded viewer keeps focus, the limit is RECORDED with the key sequence and resting place and the run does not fail. Recorded is not passed.',
          focusAfterOpenNote: 'recorded only; no focus-return contract applies to a non-modal component',
          downloadHandling: 'the download is cancelled as soon as it starts; nothing is written to disk',
        },
      });

      // Both brochure actions are ordinary sequential stops in this layout branch, adjacent in order.
      expect(reachedOpen, `P1 '${OPEN_BROCHURE.accessibleName}' was not reached by Tab`).not.toBeNull();
      expect(reachedDownload, `P2 '${DOWNLOAD_BROCHURE.accessibleName}' was not the stop after P1`).not.toBeNull();

      // P1: new-tab target, opener protection, and the disclosure INSIDE its accessible name.
      await expect(open).toHaveCount(1);
      await expect(open, 'P1 does not open a new tab').toHaveAttribute('target', '_blank');
      await expect(open, 'P1 has lost its opener protection').toHaveAttribute('rel', /(^|\s)noopener(\s|$)/);
      await expect(open, 'the new-tab disclosure is not the end of P1\'s accessible name').toHaveAccessibleName(
        NEW_TAB_DISCLOSURE_PATTERN,
      );
      expect(openAttributes.href, 'P1 no longer leads to the brochure').toBe(OPEN_BROCHURE.destinations[0]);
      expect(openActivated, 'Enter on P1 opened no new browsing context').toBe(true);

      // Activating either action leaves the other present, enabled and unchanged.
      expect(downloadStateAfterOpen, 'P2 after P1 was activated').toEqual({
        count: 1,
        enabled: true,
        href: DOWNLOAD_BROCHURE.destinations[0],
      });
      expect(openStateAfterDownload, 'P1 after P2 was activated').toEqual({
        count: 1,
        enabled: true,
        href: OPEN_BROCHURE.destinations[0],
      });

      // Not modal: no dialog semantics and no overlay, before or after activation.
      expect({ modalBefore, modalAfter }, 'dialog semantics on the page').toEqual({ modalBefore: 0, modalAfter: 0 });
      expect({ overlaysBefore, overlaysAfter }, 'an overlay covers the viewport').toEqual({
        overlaysBefore: 0,
        overlaysAfter: 0,
      });

      if (embedEntered && embedLeft) {
        expect(embedLeft, 'focus left the embedded viewer').toBe(true);
      }
      /*
       * If focus entered the embedded viewer and did NOT leave, nothing is asserted here, on
       * purpose. The browser's built-in document viewer is not a surface this project ships or can
       * fix, so failing on it would make the gate un-greenable for a cause nobody can act on.
       * Recorded is not the same as passed: the evidence record above states the limit, the key
       * sequence and where focus came to rest, and 05-EVIDENCE-KEYBOARD.md repeats it in words.
       */
    });

    test('S3 — KF-1 and KF-2 inside the Products region; the absent bypass mechanism is recorded, not asserted', async ({ page }, testInfo) => {
      requireLive(testInfo);
      await openSurface(page, PRODUCTS);

      const offenders = await positiveTabIndexOffenders(page, PRODUCTS_REGION_SELECTOR);
      const mainLandmarkCount = await page.locator('main, [role="main"]').count();

      // The whole document is traversed because the region can only be reached through the header.
      const traversal = await traverse(page, {
        regionSelector: PRODUCTS_REGION_SELECTOR,
        reverseWhen: (stops) => stops.at(-1)?.insideRegion === true,
      });

      const inRegion = traversal.stops.filter((stop) => stop.insideRegion === true);
      const outOfRegion = traversal.stops.filter((stop) => stop.insideRegion !== true);
      const inRegionUnindicated = unindicatedStops(inRegion);
      const outOfScopeUnindicated = unindicatedStops(outOfRegion);
      // Order is asserted for every adjacent pair that touches the region, and recorded for the rest.
      const regionOrderViolations = orderViolations(traversal.stops).filter((violation) =>
        inRegion.some((stop) => violation.includes(`(DOM ${stop.domIndex})`)),
      );
      const inRegionReverse = reverseDefects(traversal.reverseProbes);
      const firstStop = traversal.stops[0];
      const bypassLinkCount = await page.evaluate(
        () =>
          Array.from(document.querySelectorAll('a[href^="#"]')).filter((anchor) =>
            /skip/i.test((anchor as HTMLElement).innerText ?? ''),
          ).length,
      );

      recordEvidence(EVIDENCE.products, {
        surface: PRODUCTS.id,
        viewport: viewportOf(viewport),
        measured: {
          regionStopCount: inRegion.length,
          regionIndicatedStopCount: inRegion.length - inRegionUnindicated.length,
          regionUnindicatedStops: inRegionUnindicated,
          regionStops: inRegion,
          regionPositiveTabIndexCount: offenders.filter((offender) => offender.insideRegion === true).length,
          regionOrderViolations,
          regionReverseProbes: traversal.reverseProbes,
          regionReverseDefectCount: inRegionReverse.length,
          observations: {
            decision: 'D-OQ-3: recorded, not asserted; a scope decision, not a severity judgement',
            mainLandmarkCount,
            bypassLinkCount,
            firstStop: firstStop === undefined ? 'none' : { tag: firstStop.tag, name: firstStop.name, href: firstStop.href },
            documentStopCount: traversal.stops.length,
            documentExited: traversal.exited,
            documentPositiveTabIndexCount: offenders.length,
            outOfScopeUnindicatedCount: outOfScopeUnindicated.length,
            outOfScopeUnindicatedStops: outOfScopeUnindicated,
          },
        },
        detail: {
          plan: '05-09',
          project: testInfo.project.name,
          url: page.url(),
          viewportReason: viewport.reason,
          scope: `stops inside ${PRODUCTS_REGION_SELECTOR} are asserted; everything else on the page is a D-OQ-3 observation`,
          findingF5: 'no <main> landmark and no skip link on the ZERO-PAPER HUB home page (05-UI-SPEC.md F5), deferred by D-OQ-3',
          reverseSampling: 'Shift+Tab then Tab at every stop inside the region',
        },
      });

      // In scope: the region holds its hand-off as a stop, in DOM order, painted, and leavable.
      assertNonEmptySubjects(inRegion, `keyboard stops inside ${PRODUCTS_REGION_SELECTOR} at ${viewport.width}px`);
      expect(
        inRegion.map((stop) => stop.name),
        `P9 '${EXPLORE_NAME}' is not a stop inside the Products region`,
      ).toContain(EXPLORE_NAME);
      expect(
        offenders.filter((offender) => offender.insideRegion === true),
        'a positive tab index inside the Products region',
      ).toEqual([]);
      expect(regionOrderViolations, 'tab order departs from DOM order inside the Products region').toEqual([]);
      expect(traversal.reverseProbes.length, 'no reverse probe was taken inside the region').toBe(inRegion.length);
      expect(inRegionReverse, `reverse traversal defects inside the region:\n${inRegionReverse.join('\n')}`).toEqual([]);
      expect(
        inRegionUnindicated,
        `stops inside the Products region paint no indicator:\n${JSON.stringify(inRegionUnindicated, null, 2)}`,
      ).toEqual([]);
      // Deliberately NOT asserted: mainLandmarkCount, bypassLinkCount and every out-of-region stop.
    });
  });
}

/* ------------------------------------------------------------------------------------ *
 * The error-summary container, in the only state that renders it.
 * ------------------------------------------------------------------------------------ */

/** The invalid state is a DOM property, not a layout one, so one desktop width is enough. */
const INVALID_STATE_VIEWPORT = assertNonEmptyViewports(
  VIEWPORTS.filter((entry) => entry.width === 1280),
  'the 1280 px entry for the invalid-state traversal',
)[0];

test.describe(`invalid state at ${INVALID_STATE_VIEWPORT.width}x${INVALID_STATE_VIEWPORT.height}`, () => {
  test.use({ viewport: viewportOf(INVALID_STATE_VIEWPORT) });

  test('S1 — KF-1 the error-summary container is a script-focus destination, not a tab stop', async ({ page }, testInfo) => {
    requireLive(testInfo);

    /*
     * FS-0 permits the invalid state on live because validation is client-side and no request is
     * issued. The provider is still routed to abort and every attempt counted, so that even a
     * validation regression could never deliver a real lead from this spec.
     */
    const providerAttempts: string[] = [];
    await page.route(QUALIFY_PROVIDER_PATTERN, (route) => {
      providerAttempts.push(route.request().url());
      return route.abort('blockedbyclient');
    });

    await openSurface(page, HAOO);

    // Reach the submit control by keyboard and operate it by keyboard, with every field empty.
    const submit = await tabUntilName(page, SUBMIT_NAME);
    await page.keyboard.press('Enter');
    await expect(page.locator('form [role="alert"]'), 'the invalid submit rendered no error summary').toHaveCount(1);

    const errorSummary = await readErrorSummary(page);
    const honeypot = await readHoneypot(page);
    const focusAfterSubmit = await readActive(page, null);

    // Finish the pass the submit started, then take a complete pass from document start.
    const tail = await traverse(page, { regionSelector: null, reverseWhen: () => false });
    const fullPass = await traverse(page, { regionSelector: null, reverseWhen: () => false });
    const stopDomIndexes = new Set(fullPass.stops.map((stop) => stop.domIndex));

    recordEvidence(EVIDENCE.scriptFocus, {
      surface: HAOO.id,
      viewport: viewportOf(INVALID_STATE_VIEWPORT),
      measured: {
        state: 'invalid (empty submit)',
        submitReachedAt: submit.domIndex,
        providerAttemptCount: providerAttempts.length,
        errorSummary,
        errorSummaryIsStop: stopDomIndexes.has(errorSummary.domIndex),
        honeypot,
        honeypotIsStop: stopDomIndexes.has(honeypot.domIndex),
        focusAfterSubmit: { tag: focusAfterSubmit.tag, domIndex: focusAfterSubmit.domIndex },
        tailExited: tail.exited,
        fullPassExited: fullPass.exited,
        fullPassStopCount: fullPass.stops.length,
        fullPassStops: fullPass.stops.map((stop) => ({ order: stop.order, tag: stop.tag, name: stop.name, domIndex: stop.domIndex })),
      },
      detail: {
        plan: '05-09',
        url: page.url(),
        method: 'Tab to the submit control, Enter, then Tab to the document exit and one complete pass from document start',
        providerGuard: `${QUALIFY_PROVIDER_PATTERN.source} routed to abort; FS-0 permits this state on live because no request is issued`,
        focusAfterSubmitNote: 'recorded only; where focus lands after the invalid submit is KF-5, asserted by the preview-target form-state spec',
      },
    });

    expect(providerAttempts, 'the invalid submit attempted to reach the qualification provider').toEqual([]);
    expect(errorSummary.present, 'the error-summary container is not on the page').toBe(true);
    expect(errorSummary.tabIndexAttribute, 'the error-summary container').toBe('-1');
    expect(fullPass.exited, 'the invalid-state traversal did not leave the document').toBe(true);
    assertNonEmptySubjects(fullPass.stops, 'keyboard stops in the invalid state');
    expect(stopDomIndexes.has(errorSummary.domIndex), 'the error-summary container is a sequential tab stop').toBe(false);
    expect(stopDomIndexes.has(honeypot.domIndex), 'the honeypot control is a sequential tab stop').toBe(false);
    expect(orderViolations(fullPass.stops), 'tab order departs from DOM order in the invalid state').toEqual([]);
  });
});
