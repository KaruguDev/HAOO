import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

import { PRODUCTS_REGION_SELECTOR } from './fixtures/axe';
import { recordEvidence } from './fixtures/evidence';
import {
  OVERFLOW_TOLERANCE_PX,
  collectViewportEscapees,
  measureDocumentWidths,
  type DocumentWidths,
  type OverflowEscapee,
} from './fixtures/overflow';
import {
  MIN_INTERACTIVE_HIT_TARGET_PX,
  MIN_PRIMARY_HIT_TARGET_PX,
  PRIMARY_ACTIONS,
  primaryActionsFor,
  type PrimaryAction,
} from './fixtures/primary-actions';
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
 * Two settled decisions govern what is NOT asserted here, and a later author must not "tighten"
 * either back in:
 *
 *   - **D-OQ-2 — reachable, not above the fold.** Scrolling to an action before measuring it is
 *     correct. There is deliberately no assertion that a primary action sits within the initial
 *     viewport height: requiring that at 360 px would force a redesign of shipped screens, which
 *     the phase boundary forbids.
 *   - **D-OQ-3 — ZERO-PAPER HUB evidence stops at the Products region.** The overflow sweep on
 *     S3 covers the whole document (overflow is a page-level property), but an escapee outside
 *     `#products` is recorded as an out-of-scope observation and does not fail the run.
 */

/** The two live journeys QUAL-01 names, from the closed surface list. */
const JOURNEY_SURFACES: readonly Surface[] = assertNonEmptySubjects(
  [SURFACES.S1, SURFACES.S3],
  'the two live journeys QUAL-01 names',
);

/** The six-entry closed width list: the five D-09 product widths plus the 320 px reflow width. */
const WIDTHS = assertNonEmptyViewports(VIEWPORTS, 'VIEWPORTS for the viewport contract');

/**
 * Tailwind's `md` breakpoint. Below it both sites hide their desktop navigation (`hidden md:flex`)
 * and render a toggle instead, so these are the widths at which VC-3 applies. The UI-SPEC names
 * 360 and 390; 320 is below the same breakpoint and is measured with them rather than skipped.
 */
const MD_BREAKPOINT_PX = 768;

/** Tailwind's `lg` breakpoint. The HAOO compact brochure preview exists only below it. */
const LG_BREAKPOINT_PX = 1024;

/** A live network round trip plus a full sweep does not fit the 30 s default. */
const LIVE_TIMEOUT_MS = 120_000;

/** Evidence file names, one per measurement family. */
const EVIDENCE = {
  overflow: 'viewport-overflow',
  actions: 'viewport-primary-actions',
  mobileNav: 'viewport-mobile-nav',
  mediaAbsent: 'viewport-media-absent',
} as const;

/**
 * The compact-panel recovery copy, quoted from `src/components/BrochurePanel.tsx`
 * (`PREVIEW_ERROR`) and `05-UI-SPEC.md` § Copywriting Contract. Quoted rather than imported
 * because the constant is module-private to the component.
 */
const HAOO_PREVIEW_RECOVERY_COPY =
  "We couldn't show the brochure preview here. Open the brochure or download the PDF instead.";

/** The HAOO page's own three media files: the logo, the hero and the brochure preview. */
const HAOO_MEDIA_PATTERN = /\/brochure\/[^/?#]+\.png(?:[?#].*)?$/;

/**
 * The Products card, as `ZERO-PAPERHUB/src/products/registry.ts` (`HAOO_CARD`) ships it. Read
 * from that source rather than guessed; D-08 forbids installing anything there, not reading it.
 *
 * `previewImageHref` is an ABSOLUTE URL on the HAOO domain, so the card's image is a live
 * cross-domain dependency — which is why the unavailable-image state is asserted, not assumed.
 */
const PRODUCTS_CARD = {
  name: 'HAOO',
  relationship: 'A ZERO-PAPER HUB product',
  outcome: 'Run the business—not the paperwork.',
  audienceLead:
    'For landlords and property managers who want one clear view of their properties, rent, leases, maintenance, and communication.',
  previewImageHref: 'https://www.haoo.online/brochure/brochure-preview.png',
} as const;

/** Where P9 must lead, taken from the closed action list rather than retyped. */
const EXPLORE_ACTION = PRIMARY_ACTIONS.find((action) => action.id === 'P9');
if (EXPLORE_ACTION === undefined) {
  throw new Error('PRIMARY_ACTIONS no longer carries P9; the Products hand-off cannot be asserted');
}
const EXPLORE_DESTINATION = EXPLORE_ACTION.destinations[0];

/** Both brochure actions, for the media-absent state on the HAOO page. */
const BROCHURE_ACTIONS = PRIMARY_ACTIONS.filter((action) => action.id === 'P1' || action.id === 'P2');

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
 * Target geometry — the five VC-2 conditions for one element.
 * ------------------------------------------------------------------------------------ */

interface TargetReading {
  /** Whether the element has any layout box at all at this width. */
  readonly rendered: boolean;
  readonly width: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly innerWidth: number;
  /**
   * The vertical extent, recorded so a target that cannot be brought into view is measurable.
   * It is NOT asserted against `innerHeight`: D-OQ-2 settles that a primary action need only be
   * reachable by scrolling, so an above-the-fold check here would fail correct screens.
   */
  readonly top: number;
  readonly bottom: number;
  readonly innerHeight: number;
  readonly visibility: string;
  /** The product of the element's and every ancestor's computed opacity. */
  readonly effectiveOpacity: number;
  /** True when some clipping ancestor's box does not intersect the element's box at all. */
  readonly clippedOut: boolean;
  readonly disabled: boolean;
  /** Whether the element sits inside a `<nav>` — the only breakpoint-conditional container. */
  readonly insideNav: boolean;
  /** The raw `href` attribute, or `''` for an element without one. */
  readonly href: string;
  readonly tabIndex: number;
}

async function readTarget(locator: Locator): Promise<TargetReading> {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const rendered = element.getClientRects().length > 0 && style.display !== 'none';
    const rect = element.getBoundingClientRect();

    let effectiveOpacity = 1;
    let clippedOut = false;
    for (let node: Element | null = element; node; node = node.parentElement) {
      const nodeStyle = window.getComputedStyle(node);
      effectiveOpacity *= Number.parseFloat(nodeStyle.opacity);
      if (node !== element && (nodeStyle.overflowX !== 'visible' || nodeStyle.overflowY !== 'visible')) {
        const clip = node.getBoundingClientRect();
        const overlapWidth = Math.min(rect.right, clip.right) - Math.max(rect.left, clip.left);
        const overlapHeight = Math.min(rect.bottom, clip.bottom) - Math.max(rect.top, clip.top);
        if (overlapWidth <= 0 || overlapHeight <= 0) clippedOut = true;
      }
    }

    const round = (value: number): number => Math.round(value * 100) / 100;
    return {
      rendered,
      width: round(rect.width),
      height: round(rect.height),
      left: round(rect.left),
      right: round(rect.right),
      innerWidth: window.innerWidth,
      top: round(rect.top),
      bottom: round(rect.bottom),
      innerHeight: window.innerHeight,
      visibility: style.visibility,
      effectiveOpacity: round(effectiveOpacity),
      clippedOut,
      disabled:
        (element as HTMLButtonElement).disabled === true ||
        element.getAttribute('aria-disabled') === 'true',
      insideNav: element.closest('nav') !== null,
      href: element.getAttribute('href') ?? '',
      tabIndex: (element as HTMLElement).tabIndex,
    };
  });
}

/**
 * Every way a rendered target can fail the VC-2 conditions against a given floor, as words.
 * An empty list is the reading that the target is present, visible, unclipped, inside the
 * viewport's horizontal extent, at least `floor` by `floor`, and enabled.
 */
function targetDefects(reading: TargetReading, floor: number): string[] {
  const defects: string[] = [];
  if (!reading.rendered) defects.push('has no layout box');
  if (reading.width === 0 || reading.height === 0) defects.push('has a zero-area box');
  if (reading.visibility === 'hidden') defects.push('computes visibility: hidden');
  if (reading.effectiveOpacity === 0) defects.push('computes an effective opacity of 0');
  if (reading.clippedOut) defects.push('is clipped entirely out of its layout box by an ancestor');
  if (reading.left < -OVERFLOW_TOLERANCE_PX) {
    defects.push(`left edge ${reading.left} is outside the viewport`);
  }
  if (reading.right > reading.innerWidth + OVERFLOW_TOLERANCE_PX) {
    defects.push(`right edge ${reading.right} exceeds the ${reading.innerWidth}px viewport`);
  }
  // Compared raw, no epsilon — the MIN_FOCUS_CONTRAST discipline.
  if (reading.width < floor || reading.height < floor) {
    defects.push(`hit target ${reading.width}x${reading.height} is below ${floor}x${floor}`);
  }
  if (reading.disabled) defects.push('is disabled');
  return defects;
}

/**
 * Whether the element actually receives a pointer event at its action point. Playwright's
 * trial click runs every actionability check — attached, visible, stable, enabled, and NOT
 * obscured by another element such as a fixed header — without performing the click, so a
 * link is not followed and nothing is submitted.
 */
async function receivesPointer(locator: Locator): Promise<string> {
  try {
    await locator.click({ trial: true, timeout: 5_000 });
    return 'receives-pointer';
  } catch (error) {
    return `not-actionable: ${(error as Error).message.split('\n')[0]}`;
  }
}

/* ------------------------------------------------------------------------------------ *
 * Disclosure openers — the collapsed-disclosure rule.
 * ------------------------------------------------------------------------------------ */

interface OpenerReading {
  readonly name: string;
  readonly box: TargetReading;
  readonly pointer: string;
  readonly defects: readonly string[];
}

/**
 * Measure a disclosure's opening control against the PRIMARY floor, before it is used.
 *
 * An action behind a collapsed disclosure counts as reachable only if the control that opens it
 * is itself keyboard-operable, named and at least 44 by 44 (UI-SPEC § VC-2). Keyboard
 * operability is proven by the caller activating it with Enter, never by clicking.
 */
async function measureOpener(opener: Locator): Promise<OpenerReading> {
  await opener.scrollIntoViewIfNeeded();
  const name = await opener.evaluate(
    (element) => (element.getAttribute('aria-label') ?? (element as HTMLElement).innerText).trim(),
  );
  await expect.soft(opener, 'a disclosure opener must carry its accessible name').toHaveAccessibleName(
    name,
  );

  const box = await readTarget(opener);
  const defects = targetDefects(box, MIN_PRIMARY_HIT_TARGET_PX);
  if (name.length === 0) defects.push('has an empty accessible name');
  if (box.tabIndex < 0) defects.push(`is not a sequential tab stop (tabIndex ${box.tabIndex})`);
  const pointer = await receivesPointer(opener);
  if (pointer !== 'receives-pointer') defects.push(pointer);

  return { name, box, pointer, defects };
}

/** Operate a control from the keyboard: focus it, then press Enter. */
async function pressEnterOn(page: Page, control: Locator): Promise<void> {
  await control.focus();
  await page.keyboard.press('Enter');
}

/* ------------------------------------------------------------------------------------ *
 * Primary actions.
 * ------------------------------------------------------------------------------------ */

/**
 * The role an action is located by. P3 is the qualification submit control (`<button>`); every
 * other action in the closed list is an anchor. Stated per id rather than inferred, so a list
 * entry that changes role fails to locate instead of being silently re-read as something else.
 */
function roleOf(action: PrimaryAction): 'button' | 'link' {
  return action.id === 'P3' ? 'button' : 'link';
}

function locateAction(page: Page, action: PrimaryAction): Locator {
  // `includeHidden` so an instance hidden at this width (the desktop nav below `md`, the
  // mobile menu before it is opened) is ENUMERATED and classified, never silently skipped.
  return page.getByRole(roleOf(action), {
    name: action.accessibleName,
    exact: true,
    includeHidden: true,
  });
}

interface InstanceReading {
  readonly index: number;
  /** How the instance was reached: already on screen, or through a disclosure. */
  readonly reachedVia: 'rendered' | 'disclosure' | 'not-rendered';
  readonly box: TargetReading;
  readonly pointer: string;
  readonly defects: readonly string[];
}

interface ActionReading {
  readonly id: string;
  readonly accessibleName: string;
  readonly declaredDestinations: readonly string[];
  readonly declaredInstances: number;
  /** Elements carrying this exact accessible name, hidden or not. */
  readonly instancesFound: number;
  /** Anchors whose raw `href` equals one of the declared destinations — a census, not an assertion. */
  readonly anchorsToDestination: number;
  readonly hrefs: readonly string[];
  readonly reachableInstances: number;
  readonly instances: readonly InstanceReading[];
  readonly opener: OpenerReading | null;
  readonly minWidth: number;
  readonly minHeight: number;
  readonly defects: readonly string[];
}

/** Read one rendered instance against the primary floor. */
async function readInstance(
  locator: Locator,
  index: number,
  action: PrimaryAction,
  reachedVia: 'rendered' | 'disclosure',
): Promise<InstanceReading> {
  // D-OQ-2: scrolling to an action before measuring it is correct and expected.
  await locator.scrollIntoViewIfNeeded();
  await expect
    .soft(locator, `${action.id} instance ${index} is not in the accessibility tree by its name`)
    .toHaveAccessibleName(action.accessibleName);

  const box = await readTarget(locator);
  const defects = targetDefects(box, MIN_PRIMARY_HIT_TARGET_PX);
  const pointer = await receivesPointer(locator);
  if (pointer !== 'receives-pointer') defects.push(pointer);
  return { index, reachedVia, box, pointer, defects };
}

/**
 * Measure one primary action at the current width.
 *
 * Every instance is located by its shipped accessible name. A rendered instance must satisfy all
 * five VC-2 conditions against the 44 px floor. An instance with no layout box at this width is
 * acceptable ONLY inside a `<nav>` (the breakpoint-conditional navigation both sites ship), and
 * only if the action still has a reachable instance — directly, or through a disclosure whose
 * opener passes `measureOpener`. Any other unrendered instance is a hidden primary action.
 *
 * Same accessible name must mean same destination. Names are NOT asserted unique: P4–P8 render
 * three times with byte-identical names by design.
 */
async function measureAction(page: Page, action: PrimaryAction): Promise<ActionReading> {
  const located = locateAction(page, action);
  const count = await located.count();
  const instanceIndexes = assertNonEmptySubjects(
    Array.from({ length: count }, (_, index) => index),
    `${action.id} (${action.accessibleName}) located by its shipped accessible name`,
  );

  const hrefs: string[] = [];
  const instances: InstanceReading[] = [];
  const pending: number[] = [];
  const defects: string[] = [];

  for (const index of instanceIndexes) {
    const instance = located.nth(index);
    hrefs.push((await instance.getAttribute('href')) ?? '');
    const probe = await readTarget(instance);
    if (probe.rendered) {
      instances.push(await readInstance(instance, index, action, 'rendered'));
    } else {
      pending.push(index);
    }
  }

  // Unrendered instances: sanctioned only inside a navigation that has a disclosure path.
  let opener: OpenerReading | null = null;
  for (const index of pending) {
    const instance = located.nth(index);
    const probe = await readTarget(instance);
    if (!probe.insideNav) {
      instances.push({ index, reachedVia: 'not-rendered', box: probe, pointer: 'not-rendered', defects: ['is hidden outside any navigation — a hidden primary action'] });
      continue;
    }

    const controlledId = await instance.evaluate((element) => element.closest('nav')?.id ?? '');
    const toggle = controlledId === '' ? null : page.locator(`button[aria-controls="${controlledId}"]`);
    if (toggle === null || (await toggle.count()) !== 1 || !(await readTarget(toggle)).rendered) {
      // A desktop-only instance below `md`, with no opener of its own. Acceptable only if the
      // action is reachable some other way, which is checked once every instance is classified.
      instances.push({ index, reachedVia: 'not-rendered', box: probe, pointer: 'not-rendered', defects: [] });
      continue;
    }

    // The collapsed-disclosure rule: measure the opener, operate it by keyboard, then measure
    // the revealed instance — and close the disclosure again so it cannot obscure anything else.
    opener = await measureOpener(toggle);
    await pressEnterOn(page, toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    instances.push(await readInstance(instance, index, action, 'disclosure'));
    await pressEnterOn(page, toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  }

  const reachable = instances.filter(
    (instance) =>
      instance.reachedVia !== 'not-rendered' &&
      instance.defects.length === 0 &&
      (instance.reachedVia === 'rendered' || (opener !== null && opener.defects.length === 0)),
  );
  if (reachable.length === 0) defects.push('has no reachable instance at this width');
  for (const instance of instances) {
    for (const defect of instance.defects) defects.push(`instance ${instance.index} ${defect}`);
  }
  if (opener !== null) {
    for (const defect of opener.defects) defects.push(`the opener '${opener.name}' ${defect}`);
  }

  // Identical accessible name implies identical destination. Divergence is the defect.
  const distinctHrefs = [...new Set(hrefs)];
  if (distinctHrefs.length !== 1) {
    defects.push(`one accessible name resolves to ${distinctHrefs.length} destinations: ${distinctHrefs.join(', ')}`);
  }
  if (roleOf(action) === 'link' && !action.destinations.includes(distinctHrefs[0] ?? '')) {
    defects.push(`resolves to '${distinctHrefs[0] ?? ''}', not a declared destination (${action.destinations.join(', ')})`);
  }

  const measured = instances.filter((instance) => instance.reachedVia !== 'not-rendered');
  const anchorsToDestination =
    roleOf(action) === 'link'
      ? await page.locator('a[href]').evaluateAll(
          (anchors, destinations) =>
            anchors.filter((anchor) => destinations.includes(anchor.getAttribute('href') ?? '')).length,
          [...action.destinations],
        )
      : 0;

  return {
    id: action.id,
    accessibleName: action.accessibleName,
    declaredDestinations: action.destinations,
    declaredInstances: action.instances,
    instancesFound: count,
    anchorsToDestination,
    hrefs,
    reachableInstances: reachable.length,
    instances,
    opener,
    minWidth: measured.length === 0 ? 0 : Math.min(...measured.map((instance) => instance.box.width)),
    minHeight: measured.length === 0 ? 0 : Math.min(...measured.map((instance) => instance.box.height)),
    defects,
  };
}

/* ------------------------------------------------------------------------------------ *
 * The 24 px floor for interactive elements NOT in the primary list.
 * ------------------------------------------------------------------------------------ */

interface InteractiveTarget {
  readonly tag: string;
  readonly label: string;
  readonly href: string;
  readonly width: number;
  readonly height: number;
}

interface InteractiveSweep {
  readonly primary: readonly InteractiveTarget[];
  readonly nonPrimary: readonly InteractiveTarget[];
  /** Counted by reason, so an exclusion is a recorded decision and not a silent skip. */
  readonly excluded: Readonly<Record<'notRendered' | 'scriptFocusOnly' | 'offCanvasByDesign', number>>;
}

/**
 * Every interactive element in scope, split into primary instances (held to 44 above) and the
 * rest (held here to WCAG 2.2 SC 2.5.8's 24). The two numbers are recorded apart so the stricter
 * shipped bar is never read as the standard's minimum.
 *
 * The primary instances are identified by element identity, not by re-deriving names: the
 * located primary elements are handed into the page as a set, so a near-identical label cannot
 * be mis-sorted into the wrong floor.
 */
async function sweepInteractiveTargets(
  page: Page,
  surface: Surface,
  actions: readonly PrimaryAction[],
): Promise<InteractiveSweep> {
  const primaryLocator = actions
    .map((action) => locateAction(page, action))
    .reduce((union, next) => union.or(next));
  const primaryHandles = await primaryLocator.elementHandles();

  try {
    return await page.evaluate(
      ({ rootSelector, primaries }) => {
        const root = rootSelector === null ? document.body : document.querySelector(rootSelector);
        if (root === null) throw new Error(`interactive sweep root '${rootSelector}' is not on the page`);
        // Handles arrive typed as Node; every one was located by role, so each is an Element.
        const primarySet = new Set<Element>(primaries as Element[]);

        const isOffCanvasByDesign = (element: Element): boolean => {
          for (let node: Element | null = element; node; node = node.parentElement) {
            if (node.classList.contains('sr-only')) return true;
            if (typeof node.className === 'string' && node.className.includes('-left-[10000px]')) return true;
          }
          return false;
        };

        const selector =
          'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [tabindex]';
        const primary: InteractiveTarget[] = [];
        const nonPrimary: InteractiveTarget[] = [];
        const excluded = { notRendered: 0, scriptFocusOnly: 0, offCanvasByDesign: 0 };

        for (const element of Array.from(root.querySelectorAll(selector))) {
          // Script-focus destinations (the honeypot, the error summary, the confirmation and
          // failure headings) carry tabindex="-1": they are not pointer targets.
          if (element.getAttribute('tabindex') === '-1') {
            excluded.scriptFocusOnly += 1;
            continue;
          }
          // The skip link is `sr-only` until focused; its focused box is plan 05-10's KF-3.
          if (isOffCanvasByDesign(element)) {
            excluded.offCanvasByDesign += 1;
            continue;
          }
          const style = window.getComputedStyle(element);
          if (element.getClientRects().length === 0 || style.display === 'none' || style.visibility === 'hidden') {
            excluded.notRendered += 1;
            continue;
          }

          const rect = element.getBoundingClientRect();
          const target = {
            tag: element.tagName.toLowerCase(),
            label: (
              element.getAttribute('aria-label') ??
              (element as HTMLElement).innerText ??
              element.getAttribute('name') ??
              ''
            )
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 80),
            href: element.getAttribute('href') ?? '',
            width: Math.round(rect.width * 100) / 100,
            height: Math.round(rect.height * 100) / 100,
          };
          (primarySet.has(element) ? primary : nonPrimary).push(target);
        }

        return { primary, nonPrimary, excluded };
      },
      { rootSelector: regionSelectorFor(surface) ?? null, primaries: primaryHandles },
    );
  } finally {
    await Promise.all(primaryHandles.map((handle) => handle.dispose()));
  }
}

/* ------------------------------------------------------------------------------------ *
 * VC-1 and VC-2, at every width in the closed list, on both live journeys.
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

      test(`${surface.id} — VC-2 every primary action reachable and hit-targetable`, async ({ page }, testInfo) => {
        requireLive(testInfo);
        await openSurface(page, surface);

        // The closed list's vacuity guard, BEFORE anything is asserted: an empty action set for
        // this surface throws rather than passing over nothing.
        const actions = primaryActionsFor(surface.id);

        const readings: ActionReading[] = [];
        for (const action of actions) {
          readings.push(await measureAction(page, action));
        }

        // The measurement disclosure on S1: its opener first, then what it reveals.
        let disclosure: Record<string, unknown> | null = null;
        const disclosureDefects: string[] = [];
        if (surface.id === 'S1') {
          const details = page.locator('details:has(> summary)');
          await expect(details, 'S1 ships exactly one <details> disclosure').toHaveCount(1);
          const summary = details.locator(':scope > summary');

          const openerReading = await measureOpener(summary);
          const openBefore = (await details.getAttribute('open')) !== null;
          await pressEnterOn(page, summary);
          const openAfter = (await details.getAttribute('open')) !== null;

          const revealed = details.getByRole('button');
          const revealedCount = await revealed.count();
          assertNonEmptySubjects(
            Array.from({ length: revealedCount }),
            'controls revealed by the measurement disclosure',
          );
          const revealedBox = await readTarget(revealed.first());
          const revealedName = (await revealed.first().innerText()).trim();

          await pressEnterOn(page, summary);
          const openAfterSecondPress = (await details.getAttribute('open')) !== null;

          disclosureDefects.push(...openerReading.defects.map((defect) => `disclosure summary ${defect}`));
          if (openBefore) disclosureDefects.push('the disclosure was already open before activation');
          if (!openAfter) disclosureDefects.push('Enter on the summary did not open the disclosure');
          if (openAfterSecondPress) disclosureDefects.push('Enter on the summary did not close the disclosure');
          // The revealed control is not in the primary list, so it takes the 24 px floor.
          disclosureDefects.push(
            ...targetDefects(revealedBox, MIN_INTERACTIVE_HIT_TARGET_PX).map(
              (defect) => `revealed control '${revealedName}' ${defect}`,
            ),
          );

          disclosure = {
            opener: openerReading,
            openBefore,
            openAfter,
            openAfterSecondPress,
            revealedControl: { name: revealedName, box: revealedBox },
          };
        }

        // Every other interactive element in scope, against the 24 px floor.
        const sweep = await sweepInteractiveTargets(page, surface, actions);
        assertNonEmptySubjects(
          [...sweep.primary, ...sweep.nonPrimary],
          `rendered interactive elements on ${surface.id}`,
        );
        const belowInteractiveFloor = sweep.nonPrimary.filter(
          (target) =>
            target.width < MIN_INTERACTIVE_HIT_TARGET_PX || target.height < MIN_INTERACTIVE_HIT_TARGET_PX,
        );

        recordEvidence(EVIDENCE.actions, {
          surface: surface.id,
          viewport: viewportOf(viewport),
          measured: {
            primaryFloorPx: MIN_PRIMARY_HIT_TARGET_PX,
            interactiveFloorPx: MIN_INTERACTIVE_HIT_TARGET_PX,
            actions: readings,
            disclosure: disclosure ?? 'no disclosure on this surface',
            interactive: {
              primaryInstancesRendered: sweep.primary.length,
              nonPrimaryCount: sweep.nonPrimary.length,
              nonPrimaryTargets: sweep.nonPrimary,
              nonPrimaryBelowFloor: belowInteractiveFloor,
              excluded: sweep.excluded,
            },
          },
          detail: {
            plan: '05-08',
            project: testInfo.project.name,
            url: page.url(),
            viewportReason: viewport.reason,
            closedListSize: PRIMARY_ACTIONS.length,
            actionsOnSurface: actions.map((action) => action.id),
            primaryFloorMeaning:
              'the bar both repositories already ship (min-h-11, size-11) — a record, not a new requirement',
            interactiveFloorMeaning: 'WCAG 2.2 SC 2.5.8 Target Size (Minimum), for everything not in the primary list',
            interactiveScope: regionSelectorFor(surface) ?? 'whole document',
            reachability: 'D-OQ-2 — reachable when scrolled to; no above-the-fold requirement',
          },
        });

        const defects = [
          ...readings.flatMap((reading) => reading.defects.map((defect) => `${reading.id} ${defect}`)),
          ...disclosureDefects,
          ...belowInteractiveFloor.map(
            (target) =>
              `non-primary <${target.tag}> '${target.label}' ${target.width}x${target.height} is below ${MIN_INTERACTIVE_HIT_TARGET_PX}x${MIN_INTERACTIVE_HIT_TARGET_PX}`,
          ),
        ];
        expect(
          defects,
          `VC-2 at ${viewport.width}px on ${surface.id}:\n${defects.join('\n')}`,
        ).toEqual([]);
      });
    }

    /* -------------------------------------------------------------------------------- *
     * VC-3 — mobile navigation, below the `md` breakpoint.
     * -------------------------------------------------------------------------------- */

    if (viewport.width < MD_BREAKPOINT_PX) {
      for (const surface of JOURNEY_SURFACES) {
        test(`${surface.id} — VC-3 mobile navigation tracks its own state`, async ({ page }, testInfo) => {
          requireLive(testInfo);
          await openSurface(page, surface);

          const toggle = page.locator('header button[aria-controls][aria-expanded]');
          await expect(toggle, 'exactly one header toggle carries aria-controls and aria-expanded').toHaveCount(1);
          const controlledId = (await toggle.getAttribute('aria-controls')) ?? '';
          expect(controlledId.length, 'the toggle names no controlled element').toBeGreaterThan(0);
          const controlled = page.locator(`[id="${controlledId}"]`);

          // The desktop navigation: every header <nav> that is not the controlled one.
          const desktopNavs = page.locator(`header nav:not([id="${controlledId}"])`);
          const desktopNavCount = await desktopNavs.count();
          assertNonEmptySubjects(
            Array.from({ length: desktopNavCount }),
            `desktop navigation landmarks on ${surface.id}`,
          );
          const desktopRendered: boolean[] = [];
          for (let index = 0; index < desktopNavCount; index += 1) {
            desktopRendered.push((await readTarget(desktopNavs.nth(index))).rendered);
          }

          const opener = await measureOpener(toggle);

          const readState = async () => ({
            ariaExpanded: (await toggle.getAttribute('aria-expanded')) ?? '',
            toggleName: ((await toggle.getAttribute('aria-label')) ?? '').trim(),
            controlledExists: (await controlled.count()) === 1,
            controlledHiddenAttribute: (await controlled.getAttribute('hidden')) !== null,
            controlledRendered: (await readTarget(controlled)).rendered,
          });

          const before = await readState();
          await pressEnterOn(page, toggle);
          await expect(toggle).toHaveAttribute('aria-expanded', 'true');
          const afterOpen = await readState();

          // Every link the opened navigation reveals, against the primary floor.
          const links = controlled.getByRole('link');
          const linkCount = await links.count();
          assertNonEmptySubjects(
            Array.from({ length: linkCount }),
            `links inside the opened mobile navigation on ${surface.id}`,
          );
          /*
           * Which revealed links this surface's evidence may FAIL on. On S1, every one: the whole
           * HAOO page is in scope. On S3, only the closed list's own entry (P10, the Products nav
           * entry) — the ZERO-PAPER HUB header sits outside the Products region, so under D-OQ-3
           * a defect on any other entry is recorded as an out-of-scope observation. Recorded, not
           * dropped, and not failed. The toggle is held on both surfaces, because on S3 it is
           * P10's opener.
           */
          const scopedNames =
            surface.id === 'S3'
              ? new Set<string>(primaryActionsFor(surface.id).map((action) => action.accessibleName))
              : null;
          const revealedLinks: {
            name: string;
            href: string;
            inScope: boolean;
            box: TargetReading;
            pointer: string;
            defects: string[];
          }[] = [];
          for (let index = 0; index < linkCount; index += 1) {
            const link = links.nth(index);
            await link.scrollIntoViewIfNeeded();
            const box = await readTarget(link);
            const pointer = await receivesPointer(link);
            const defects = targetDefects(box, MIN_PRIMARY_HIT_TARGET_PX);
            if (pointer !== 'receives-pointer') defects.push(pointer);
            const name = (await link.innerText()).replace(/\s+/g, ' ').trim();
            revealedLinks.push({
              name,
              href: box.href,
              inScope: scopedNames === null || scopedNames.has(name),
              box,
              pointer,
              defects,
            });
          }
          const inScopeLinks = assertNonEmptySubjects(
            revealedLinks.filter((link) => link.inScope),
            `in-scope links inside the opened mobile navigation on ${surface.id}`,
          );
          const outOfScopeObservations = revealedLinks
            .filter((link) => !link.inScope && link.defects.length > 0)
            .map((link) => ({ name: link.name, href: link.href, box: link.box, defects: link.defects }));

          await pressEnterOn(page, toggle);
          await expect(toggle).toHaveAttribute('aria-expanded', 'false');
          const afterClose = await readState();

          recordEvidence(EVIDENCE.mobileNav, {
            surface: surface.id,
            viewport: viewportOf(viewport),
            measured: {
              controlledId,
              desktopNavLandmarks: desktopNavCount,
              desktopNavRendered: desktopRendered,
              opener,
              before,
              afterOpen,
              afterClose,
              revealedLinkCount: linkCount,
              inScopeLinkCount: inScopeLinks.length,
              revealedLinks,
              outOfScopeObservations,
              outOfScopeCount: outOfScopeObservations.length,
            },
            detail: {
              plan: '05-08',
              project: testInfo.project.name,
              url: page.url(),
              viewportReason: viewport.reason,
              activation: 'keyboard — focus the toggle, press Enter (twice: open, then close)',
              linkFloorPx: MIN_PRIMARY_HIT_TARGET_PX,
              scope:
                surface.id === 'S3'
                  ? 'P10 and its opener fail; other header entries are D-OQ-3 out-of-scope observations'
                  : 'every revealed link in scope',
            },
          });

          const defects: string[] = [
            ...desktopRendered.flatMap((rendered, index) =>
              rendered ? [`desktop nav ${index} is in the layout below md`] : [],
            ),
            ...opener.defects.map((defect) => `toggle ${defect}`),
            ...inScopeLinks.flatMap((link) => link.defects.map((defect) => `link '${link.name}' ${defect}`)),
          ];
          expect(defects, `VC-3 at ${viewport.width}px on ${surface.id}:\n${defects.join('\n')}`).toEqual([]);

          // The four readings flip together, and flip back together.
          expect(before, 'initial state').toEqual({
            ariaExpanded: 'false',
            toggleName: before.toggleName,
            controlledExists: true,
            controlledHiddenAttribute: true,
            controlledRendered: false,
          });
          expect(before.toggleName.length, 'the toggle has an empty accessible name').toBeGreaterThan(0);
          expect(afterOpen, 'state after the first activation').toEqual({
            ariaExpanded: 'true',
            toggleName: afterOpen.toggleName,
            controlledExists: true,
            controlledHiddenAttribute: false,
            controlledRendered: true,
          });
          expect(afterOpen.toggleName, 'the toggle name does not track its state').not.toBe(before.toggleName);
          expect(afterClose, 'state after the second activation').toEqual(before);
        });
      }
    }
  });
}

/* ------------------------------------------------------------------------------------ *
 * The two media-absent partial states.
 * ------------------------------------------------------------------------------------ */

test.describe('media-absent partial states', () => {
  /*
   * The HAOO page with its own media unavailable. The compact brochure panel — the one that
   * carries recovery copy for a failed preview — renders only below `lg`, so this state exists
   * only at those widths and is measured at every one of them.
   */
  for (const viewport of WIDTHS.filter((entry) => entry.width < LG_BREAKPOINT_PX)) {
    test.describe(`at ${viewport.width}x${viewport.height}`, () => {
      test.use({ viewport: viewportOf(viewport) });

      test('S1 — the HAOO page with its own media aborted keeps its layout and both brochure actions', async ({ page }, testInfo) => {
        requireLive(testInfo);

        const aborted: string[] = [];
        await page.route(HAOO_MEDIA_PATTERN, (route) => {
          aborted.push(route.request().url());
          return route.abort('failed');
        });

        await openSurface(page, SURFACES.S1);

        // The preview is `loading="lazy"`, so its request — and therefore its failure — only
        // happens once the brochure section is near the viewport.
        await page.locator('#brochure').scrollIntoViewIfNeeded();
        const recovery = page.getByText(HAOO_PREVIEW_RECOVERY_COPY, { exact: true });
        await expect(recovery, 'the compact panel did not render its recovery copy').toBeVisible();

        const brochureActions = [];
        for (const action of assertNonEmptySubjects(BROCHURE_ACTIONS, 'the two brochure actions')) {
          const locator = locateAction(page, action);
          await expect(locator, `${action.id} is not present once, by its name`).toHaveCount(1);
          await locator.scrollIntoViewIfNeeded();
          const box = await readTarget(locator);
          brochureActions.push({ id: action.id, name: action.accessibleName, box, defects: targetDefects(box, MIN_PRIMARY_HIT_TARGET_PX) });
        }

        const escapees = await collectViewportEscapees(page);

        recordEvidence(EVIDENCE.mediaAbsent, {
          surface: 'S1',
          viewport: viewportOf(viewport),
          measured: {
            abortedRequests: aborted,
            abortedCount: aborted.length,
            recoveryCopyVisible: await recovery.isVisible(),
            brochureActions,
            escapees,
            escapeeCount: escapees.length,
          },
          detail: {
            plan: '05-08',
            state: 'HAOO page media absent: logo, hero and brochure preview image routes aborted',
            routePattern: HAOO_MEDIA_PATTERN.source,
            url: page.url(),
            viewportReason: viewport.reason,
          },
        });

        expect(
          aborted.some((url) => url.endsWith('/brochure/brochure-preview.png')),
          `the preview image request was never made, so the unavailable state was not reached: ${aborted.join(', ')}`,
        ).toBe(true);
        expect(
          brochureActions.flatMap((action) => action.defects.map((defect) => `${action.id} ${defect}`)),
          'a brochure action did not survive the media-absent state',
        ).toEqual([]);
        for (const action of BROCHURE_ACTIONS) {
          await expect(locateAction(page, action)).toBeEnabled();
          await expect(locateAction(page, action)).toHaveAttribute('href', action.destinations[0]);
        }
        expect(escapees, `the layout collapsed with media absent: ${describeEscapees(escapees)}`).toEqual([]);
      });
    });
  }

  /*
   * The Products card with its cross-origin preview image unavailable (UI-SPEC § UI
   * Considerations, E5). Inside S3, so D-OQ-3 does not defer it. Measured at every width, because
   * the featured `lg:grid-cols-12` layout it must not collapse exists only at `lg` and above while
   * the stacked layout exists below it.
   */
  for (const viewport of WIDTHS) {
    test.describe(`at ${viewport.width}x${viewport.height}`, () => {
      test.use({ viewport: viewportOf(viewport) });

      test('S3 — the Products card with its cross-origin preview image aborted keeps its text and its hand-off', async ({ page }, testInfo) => {
        requireLive(testInfo);

        const aborted: string[] = [];
        await page.route(PRODUCTS_CARD.previewImageHref, (route) => {
          aborted.push(route.request().url());
          return route.abort('failed');
        });

        await openSurface(page, SURFACES.S3);
        const region = page.locator(PRODUCTS_REGION_SELECTOR);

        // Prove the aborted image is the card's image, then bring the lazy image into view so its
        // request is made and fails.
        const image = region.locator('img');
        await expect(image, 'the card no longer renders exactly one image').toHaveCount(1);
        await expect(image).toHaveAttribute('src', PRODUCTS_CARD.previewImageHref);
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() => aborted.length, { message: 'the card preview image request was never made' })
          .toBeGreaterThan(0);
        const naturalWidth = await image.evaluate((element) => (element as HTMLImageElement).naturalWidth);

        const texts: Record<string, boolean> = {};
        for (const key of ['relationship', 'outcome', 'audienceLead'] as const) {
          const text = region.getByText(PRODUCTS_CARD[key], { exact: true });
          texts[key] = (await text.count()) === 1 && (await text.isVisible());
        }
        const nameHeading = region.getByRole('heading', { level: 3, name: PRODUCTS_CARD.name, exact: true });
        texts.name = (await nameHeading.count()) === 1 && (await nameHeading.isVisible());

        const explore = region.getByRole('link', { name: EXPLORE_ACTION.accessibleName, exact: true });
        await expect(explore, 'P9 is not present once in the degraded card').toHaveCount(1);
        await explore.scrollIntoViewIfNeeded();
        const exploreBox = await readTarget(explore);
        const exploreHost = new URL(exploreBox.href).hostname;

        const escapees = await collectViewportEscapees(page, { regionSelector: PRODUCTS_REGION_SELECTOR });
        const inRegion = escapees.filter((escapee) => escapee.insideRegion === true);
        const outOfScope = escapees.filter((escapee) => escapee.insideRegion === false);

        recordEvidence(EVIDENCE.mediaAbsent, {
          surface: 'S3',
          viewport: viewportOf(viewport),
          measured: {
            abortedRequests: aborted,
            abortedCount: aborted.length,
            imageNaturalWidth: naturalWidth,
            textRendered: texts,
            explore: { name: EXPLORE_ACTION.accessibleName, href: exploreBox.href, host: exploreHost, box: exploreBox },
            escapees: inRegion,
            escapeeCount: inRegion.length,
            outOfScopeObservations: outOfScope,
            outOfScopeCount: outOfScope.length,
          },
          detail: {
            plan: '05-08',
            state: 'Products card preview image (cross-origin, on the HAOO domain) aborted',
            url: page.url(),
            viewportReason: viewport.reason,
            attribution: `escapees inside ${PRODUCTS_REGION_SELECTOR} fail; outside it are D-OQ-3 observations`,
          },
        });

        expect(naturalWidth, 'the card image loaded despite the abort — the state was not reached').toBe(0);
        expect(texts, 'the degraded card lost text it must still render').toEqual({
          relationship: true,
          outcome: true,
          audienceLead: true,
          name: true,
        });
        expect(exploreBox.href, 'P9 no longer leads to its declared destination').toBe(EXPLORE_DESTINATION);
        expect(exploreHost, 'P9 does not resolve to the HAOO domain').toBe('www.haoo.online');
        expect(targetDefects(exploreBox, MIN_PRIMARY_HIT_TARGET_PX), 'P9 in the degraded card').toEqual([]);
        await expect(explore).toBeEnabled();
        expect(inRegion, `the card layout collapsed with its image absent: ${describeEscapees(inRegion)}`).toEqual([]);
      });
    });
  }
});
