import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

import { PRODUCTS_REGION_SELECTOR } from './fixtures/axe';
import {
  BROCHURE_EQUIVALENT_ITEMS,
  EXPECTED_CAPABILITIES,
  EXPECTED_JOURNEY,
  capabilityItems,
  journeyItems,
} from './fixtures/brochure-equivalence';
import { recordEvidence } from './fixtures/evidence';
import {
  OVERFLOW_TOLERANCE_PX,
  collectViewportEscapees,
  measureDocumentWidths,
  type DocumentWidths,
} from './fixtures/overflow';
import { MIN_PRIMARY_HIT_TARGET_PX, primaryActionsFor } from './fixtures/primary-actions';
import { SURFACES, assertNonEmptySubjects } from './fixtures/surfaces';
import { locateAction, measureAction, type ActionReading } from './fixtures/targets';
import { VIEWPORTS, ZOOM_VIEWPORTS, assertNonEmptyViewports } from './fixtures/viewports';

/**
 * QUAL-03's zoom and motion half on the live HAOO page (`05-UI-SPEC.md` § ZM-1 and § ZM-2).
 *
 * **Each zoom measurement carries the success criterion it actually measures.** The halved
 * desktop entries (each D-09 desktop width halved) model 200% zoom, which is WCAG 2.2 SC 1.4.4 Resize
 * Text. SC 1.4.10 Reflow is defined at 320 CSS px wide, which is why the 320 x 256 entry is
 * measured here as well. The entries and their labels come from `e2e/fixtures/viewports.ts`
 * (`ZOOM_VIEWPORTS`, and the one `VIEWPORTS` entry that carries a criterion); none is typed here.
 *
 * **Zoom is modelled by the viewport option, never by changing the device scale factor.** A
 * higher device scale factor scales rendering rather than layout: the page lays out exactly as it
 * did at 1280, just with more device pixels, so it exercises no reflow at all and would produce a
 * clean measurement of nothing. Halving the CSS viewport is what makes the layout reflow.
 *
 * Everything this spec asserts is a RE-RUN of an assertion another spec owns, taken through the
 * same shared code so the two cannot drift into different definitions:
 *   - overflow through `e2e/fixtures/overflow.ts` (the viewport spec's three VC-1 readings);
 *   - the brochure equivalent through `e2e/fixtures/brochure-equivalence.ts` (semantics SS-4);
 *   - the primary actions through `e2e/fixtures/targets.ts` (the viewport spec's VC-2).
 *
 * Every measurement is recorded before it is asserted, so a failing run still leaves the reading
 * that failed. D-OQ-3: this spec measures the HAOO page only; nothing on the ZERO-PAPER HUB home
 * page outside the Products region fails it.
 */

const HAOO = SURFACES.S1;

/** A live page load, a full primary-action sweep with trial clicks, and a heading walk. */
const LIVE_TIMEOUT_MS = 180_000;

const EVIDENCE = {
  overflow: 'zoom-overflow',
  content: 'zoom-content',
  actions: 'zoom-primary-actions',
  clipping: 'zoom-clipping',
} as const;

interface ZoomEntry {
  readonly width: number;
  readonly height: number;
  /** The success criterion this entry is evidence for, carried into every record. */
  readonly criterion: string;
  readonly reason: string;
  /** Which of the two claims the entry supports, so a row can never be read as the other. */
  readonly claim: 'resize-text-200-percent' | 'reflow-320';
}

/** The two halved desktop entries: 200%, SC 1.4.4-class. */
const HALVED_ENTRIES: readonly ZoomEntry[] = assertNonEmptyViewports(
  ZOOM_VIEWPORTS.map((entry) => ({
    width: entry.width,
    height: entry.height,
    criterion: entry.criterion,
    reason: entry.reason,
    claim: 'resize-text-200-percent' as const,
  })),
  'ZOOM_VIEWPORTS (the halved desktop entries)',
);

/** The entry at which SC 1.4.10 Reflow is defined — the only one a reflow claim may rest on. */
const REFLOW_ENTRIES: readonly ZoomEntry[] = assertNonEmptyViewports(
  VIEWPORTS.flatMap((entry) =>
    entry.criterion === null
      ? []
      : [
          {
            width: entry.width,
            height: entry.height,
            criterion: entry.criterion,
            reason: entry.reason,
            claim: 'reflow-320' as const,
          },
        ],
  ),
  'VIEWPORTS filtered to the criterion-bearing reflow entry',
);

const ZOOM_ENTRIES: readonly ZoomEntry[] = [...HALVED_ENTRIES, ...REFLOW_ENTRIES];

/* ------------------------------------------------------------------------------------ *
 * Shared plumbing.
 * ------------------------------------------------------------------------------------ */

function requireLive(testInfo: TestInfo): void {
  test.skip(
    testInfo.project.name !== 'live',
    'the zoom and motion contract measures the deployed HAOO page and has no referent in the preview build',
  );
  test.setTimeout(LIVE_TIMEOUT_MS);
}

async function openHaoo(page: Page): Promise<void> {
  const response = await page.goto(HAOO.path);
  expect(response?.status(), `unexpected status for ${HAOO.url}`).toBe(200);
  await page.waitForLoadState('networkidle');
  // A 404 shell has no populated <h1>; measuring one would record a clean layout for the wrong page.
  await expect(page.locator('h1').first()).toBeVisible();
}

function viewportOf(entry: { width: number; height: number }): { width: number; height: number } {
  return { width: entry.width, height: entry.height };
}

/** The provenance every zoom record carries, the criterion label first. */
function zoomDetail(entry: ZoomEntry, page: Page, testInfo: TestInfo): Record<string, unknown> {
  return {
    plan: '05-13',
    criterion: entry.criterion,
    claim: entry.claim,
    entryReason: entry.reason,
    method: 'CSS viewport set through the runner viewport option at describe scope; device scale factor left at the project default',
    project: testInfo.project.name,
    url: page.url(),
  };
}

/* ------------------------------------------------------------------------------------ *
 * The brochure equivalent (SS-4 re-run) — used by ZM-1b and ZM-2c.
 * ------------------------------------------------------------------------------------ */

interface EquivalentReading {
  readonly capabilitiesFound: number;
  readonly capabilitiesExpected: number;
  readonly journeyStepsFound: number;
  readonly journeyStepsExpected: number;
  readonly equivalentItemsFound: number;
  readonly equivalentItemsExpected: number;
  /** Expected titles exposed in the accessibility tree as a visible level-3 heading. */
  readonly titlesExposed: number;
  /** Expected descriptions rendered visibly, exactly once, inside their own region. */
  readonly descriptionsVisible: number;
  readonly missing: readonly string[];
}

/**
 * Read the equivalent off the page with the SS-4 readers, then confirm every expected item is
 * still exposed and visible — `textContent` alone would still read text that a layout change had
 * hidden, which is the loss this re-run exists to catch.
 */
async function measureEquivalent(page: Page): Promise<{
  reading: EquivalentReading;
  capabilities: readonly (readonly string[])[];
  journey: readonly (readonly string[])[];
}> {
  const capabilities = await capabilityItems(page);
  const journey = await journeyItems(page);

  const capabilityRegion = page.locator('#capabilities');
  const journeyRegion = page.getByRole('region', { name: 'Rental journey', exact: true });
  const missing: string[] = [];
  let titlesExposed = 0;
  let descriptionsVisible = 0;

  const expectedItems: readonly { region: Locator; title: string; body: string }[] = [
    ...EXPECTED_CAPABILITIES.map(([title, body]) => ({ region: capabilityRegion, title, body })),
    ...EXPECTED_JOURNEY.map(([title, body]) => ({ region: journeyRegion, title, body })),
  ];
  for (const { region, title, body } of expectedItems) {
    const heading = region.getByRole('heading', { level: 3, name: title, exact: true });
    if ((await heading.count()) === 1 && (await heading.isVisible())) {
      titlesExposed += 1;
    } else {
      missing.push(`title '${title}'`);
    }
    const description = region.getByText(body, { exact: true });
    if ((await description.count()) === 1 && (await description.isVisible())) {
      descriptionsVisible += 1;
    } else {
      missing.push(`description of '${title}'`);
    }
  }

  return {
    reading: {
      capabilitiesFound: capabilities.length,
      capabilitiesExpected: EXPECTED_CAPABILITIES.length,
      journeyStepsFound: journey.length,
      journeyStepsExpected: EXPECTED_JOURNEY.length,
      equivalentItemsFound: capabilities.length + journey.length,
      equivalentItemsExpected: BROCHURE_EQUIVALENT_ITEMS,
      titlesExposed,
      descriptionsVisible,
      missing,
    },
    capabilities,
    journey,
  };
}

/** The SS-4 assertions, unchanged in substance, plus the exposure counts. */
function assertEquivalent(result: Awaited<ReturnType<typeof measureEquivalent>>, context: string): void {
  const { reading, capabilities, journey } = result;
  assertNonEmptySubjects(capabilities, `the capability cards ${context}`);
  assertNonEmptySubjects(journey, `the journey steps ${context}`);

  expect(capabilities, `capability count ${context}`).toHaveLength(EXPECTED_CAPABILITIES.length);
  expect(journey, `journey step count ${context}`).toHaveLength(EXPECTED_JOURNEY.length);
  expect(capabilities.length + journey.length, `equivalent item count ${context}`).toBe(
    BROCHURE_EQUIVALENT_ITEMS,
  );
  expect(capabilities, `capability titles and descriptions ${context}`).toEqual(
    EXPECTED_CAPABILITIES.map(([title, body]) => [title, body]),
  );
  expect(journey, `journey steps in order ${context}`).toEqual(
    EXPECTED_JOURNEY.map(([title, body]) => [title, body]),
  );
  expect(reading.missing, `items no longer exposed or visible ${context}`).toEqual([]);
  expect(reading.titlesExposed).toBe(BROCHURE_EQUIVALENT_ITEMS);
  expect(reading.descriptionsVisible).toBe(BROCHURE_EQUIVALENT_ITEMS);
}

/* ------------------------------------------------------------------------------------ *
 * The primary actions (VC-2 re-run) — used by ZM-1c and ZM-2c.
 * ------------------------------------------------------------------------------------ */

interface ActionsResult {
  readonly readings: readonly ActionReading[];
  readonly expected: number;
  /** Actions whose every instance and every condition held at this width. */
  readonly satisfying: number;
  readonly defects: readonly string[];
  /** P5/P6 declare four instances and three carry the name (recorded by 05-08, not edited). */
  readonly instanceCountGaps: readonly { id: string; declared: number; found: number }[];
}

async function measurePrimaryActions(page: Page): Promise<ActionsResult> {
  // The closed list's vacuity guard, before anything is measured.
  const actions = primaryActionsFor(HAOO.id);
  const readings: ActionReading[] = [];
  for (const action of actions) {
    readings.push(await measureAction(page, action));
  }
  return {
    readings,
    expected: actions.length,
    satisfying: readings.filter((reading) => reading.defects.length === 0).length,
    defects: readings.flatMap((reading) => reading.defects.map((defect) => `${reading.id} ${defect}`)),
    instanceCountGaps: readings
      .filter((reading) => reading.instancesFound !== reading.declaredInstances)
      .map((reading) => ({ id: reading.id, declared: reading.declaredInstances, found: reading.instancesFound })),
  };
}

/* ------------------------------------------------------------------------------------ *
 * Per-box truncation (ZM-1d).
 * ------------------------------------------------------------------------------------ */

interface BoxReading {
  readonly subject: string;
  readonly tag: string;
  readonly display: string;
  readonly rendered: boolean;
  readonly scrollWidth: number;
  readonly clientWidth: number;
  readonly scrollHeight: number;
  readonly clientHeight: number;
}

async function readBoxes(locator: Locator, subject: string): Promise<BoxReading[]> {
  return locator.evaluateAll(
    (elements, label) =>
      elements.map((element, index) => {
        const style = window.getComputedStyle(element);
        const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
        return {
          subject: `${label} #${index} '${text}'`,
          tag: element.tagName.toLowerCase(),
          display: style.display,
          rendered: element.getClientRects().length > 0 && style.display !== 'none',
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
        };
      }),
    subject,
  );
}

/**
 * A box's own truncation defect, or `null`. A rendered box with a zero client width is reported
 * rather than passed: `scrollWidth <= clientWidth + 1` holds trivially on an inline box whose
 * client width is 0, so such a box would be a measurement of nothing.
 */
function truncationDefect(box: BoxReading): string | null {
  if (!box.rendered) return null;
  if (box.clientWidth === 0) return `${box.subject} (${box.display}) has a zero client width and cannot be measured`;
  if (box.scrollWidth > box.clientWidth + OVERFLOW_TOLERANCE_PX) {
    return `${box.subject} scrollWidth ${box.scrollWidth} exceeds clientWidth ${box.clientWidth} + ${OVERFLOW_TOLERANCE_PX}`;
  }
  return null;
}

/* ------------------------------------------------------------------------------------ *
 * ZM-1 — the zoom entries.
 * ------------------------------------------------------------------------------------ */

for (const entry of ZOOM_ENTRIES) {
  test.describe(`ZM-1 at ${entry.width}x${entry.height} — ${entry.criterion}`, () => {
    // The viewport option, at describe scope. There is deliberately no device scale factor here.
    test.use({ viewport: viewportOf(entry) });

    test('ZM-1a reflows rather than scrolling horizontally, measured three ways', async ({ page }, testInfo) => {
      requireLive(testInfo);
      await openHaoo(page);

      // VC-1a, unmodified; VC-1b, per-element on the unmodified page; VC-1c, mask neutralised, LAST.
      const unmodified: DocumentWidths = await measureDocumentWidths(page);
      const escapees = await collectViewportEscapees(page);
      const neutralised: DocumentWidths = await measureDocumentWidths(page, { neutraliseMask: true });

      recordEvidence(EVIDENCE.overflow, {
        surface: HAOO.id,
        viewport: viewportOf(entry),
        measured: {
          unmodified,
          maskNeutralised: neutralised,
          escapees,
          escapeeCount: escapees.length,
        },
        detail: {
          ...zoomDetail(entry, page, testInfo),
          overflowToleranceCssPx: OVERFLOW_TOLERANCE_PX,
          readingOrder: 'VC-1a unmodified, VC-1b unmodified, then VC-1c on a modified page, last',
        },
      });

      // Necessary and not sufficient: the root wrapper's overflow-x-hidden absorbs escapees.
      expect(unmodified.scrollWidth, 'VC-1a unmodified document width').toBeLessThanOrEqual(
        unmodified.clientWidth + OVERFLOW_TOLERANCE_PX,
      );
      // The load-bearing reading.
      expect(escapees, `VC-1b: ${escapees.length} element(s) escape at ${entry.width}px`).toEqual([]);
      expect(neutralised.scrollWidth, 'VC-1c (modified page) document width').toBeLessThanOrEqual(
        neutralised.clientWidth + OVERFLOW_TOLERANCE_PX,
      );
    });

    test('ZM-1b loses no content: the brochure equivalent is complete and exposed', async ({ page }, testInfo) => {
      requireLive(testInfo);
      await openHaoo(page);

      const result = await measureEquivalent(page);
      recordEvidence(EVIDENCE.content, {
        surface: HAOO.id,
        viewport: viewportOf(entry),
        measured: {
          ...result.reading,
          capabilityTitles: result.capabilities.map(([title]) => title),
          journeyTitles: result.journey.map(([title]) => title),
        },
        detail: {
          ...zoomDetail(entry, page, testInfo),
          reRuns: 'SS-4 assertions 1 and 2 through e2e/fixtures/brochure-equivalence.ts',
        },
      });

      assertEquivalent(result, `at ${entry.width}px`);
    });

    test('ZM-1c loses no functionality: every primary action holds its conditions', async ({ page }, testInfo) => {
      requireLive(testInfo);
      await openHaoo(page);

      const result = await measurePrimaryActions(page);
      recordEvidence(EVIDENCE.actions, {
        surface: HAOO.id,
        viewport: viewportOf(entry),
        measured: {
          primaryFloorPx: MIN_PRIMARY_HIT_TARGET_PX,
          actionsExpected: result.expected,
          actionsSatisfyingAllConditions: result.satisfying,
          defectCount: result.defects.length,
          defects: result.defects,
          instanceCountGaps: result.instanceCountGaps,
          actions: result.readings,
        },
        detail: {
          ...zoomDetail(entry, page, testInfo),
          reRuns: 'VC-2 through e2e/fixtures/targets.ts measureAction',
          conditions:
            'present by its non-empty accessible name, visible, inside the horizontal extent, at least the primary floor, enabled, and receiving the pointer',
        },
      });

      expect(result.defects, `ZM-1c at ${entry.width}px:\n${result.defects.join('\n')}`).toEqual([]);
      expect(result.satisfying).toBe(result.expected);
    });

    test('ZM-1d truncates no primary action and no section heading on its own box', async ({ page }, testInfo) => {
      requireLive(testInfo);
      await openHaoo(page);

      const actionBoxes: BoxReading[] = [];
      for (const action of primaryActionsFor(HAOO.id)) {
        const located = locateAction(page, action);
        assertNonEmptySubjects(
          Array.from({ length: await located.count() }),
          `${action.id} located by its accessible name for the truncation check`,
        );
        actionBoxes.push(...(await readBoxes(located, action.id)));
      }
      const headingBoxes = await readBoxes(page.locator('h1, h2, h3'), 'heading');
      assertNonEmptySubjects(headingBoxes.filter((box) => box.rendered), 'rendered headings');

      const boxes = [...actionBoxes, ...headingBoxes];
      const defects = boxes.map(truncationDefect).filter((defect): defect is string => defect !== null);

      recordEvidence(EVIDENCE.clipping, {
        surface: HAOO.id,
        viewport: viewportOf(entry),
        measured: {
          actionBoxesMeasured: actionBoxes.filter((box) => box.rendered).length,
          headingBoxesMeasured: headingBoxes.filter((box) => box.rendered).length,
          boxesNotRendered: boxes.filter((box) => !box.rendered).length,
          truncationDefectCount: defects.length,
          defects,
          boxes,
        },
        detail: {
          ...zoomDetail(entry, page, testInfo),
          rule: `scrollWidth <= clientWidth + ${OVERFLOW_TOLERANCE_PX} on the element's own box`,
          subjects: 'every instance of every S1 primary action, and every h1, h2 and h3',
        },
      });

      expect(defects, `ZM-1d at ${entry.width}px:\n${defects.join('\n')}`).toEqual([]);
    });
  });
}

/* ------------------------------------------------------------------------------------ *
 * ZM-2 — reduced motion.
 *
 * Requested through the runner's own `reducedMotion` emulation, which sets the media feature at
 * the browser level. No stylesheet is injected to fake the query: emulation is what makes the
 * Tailwind `motion-safe:`/`motion-reduce:` variants AND a plain media query in `src/index.css`
 * respond exactly as they would for a real visitor who has asked for less motion.
 * ------------------------------------------------------------------------------------ */

const MOTION_EVIDENCE = {
  suppression: 'motion-suppression',
  negative: 'motion-closed-negative',
  preserved: 'motion-content-preserved',
  observations: 'motion-observations',
} as const;

/** Longer than the shipped 200 ms card transition, so a transition that still ran has finished. */
const HOVER_SETTLE_MS = 500;

/** Both projects measure ZM-2a/2b: live for the deployed page, preview for the fix in the build. */
function requireMotionProject(testInfo: TestInfo): void {
  test.skip(
    testInfo.project.name !== 'live' && testInfo.project.name !== 'preview',
    'ZM-2 measures the HAOO page through the live or preview project only',
  );
  test.setTimeout(LIVE_TIMEOUT_MS);
}

function motionSurface(testInfo: TestInfo) {
  return testInfo.project.name === 'preview' ? SURFACES.S5 : HAOO;
}

interface CardMotionReading {
  readonly transitionProperty: string;
  readonly transitionDuration: string;
  readonly transformBefore: string;
  readonly transformAfter: string;
  readonly translateBefore: string;
  readonly translateAfter: string;
  readonly hoveredBefore: boolean;
  readonly hoveredAfter: boolean;
  readonly capabilityItems: number;
}

/**
 * The computed transition and transform on a capability card, before and after a real hover.
 * Computed values rather than class presence: a guard class that does not take effect is exactly
 * the failure this measures, and a class-presence check would have passed ZM-LIVE-1 (the closed
 * finding recorded in `05-EVIDENCE-ZOOM-MOTION.md` § 2).
 */
async function readCardMotion(page: Page): Promise<CardMotionReading> {
  const items = page.locator('#capabilities li');
  const capabilityItems = await items.count();
  assertNonEmptySubjects(Array.from({ length: capabilityItems }), 'capability list items');
  const card = items.first();
  await card.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);

  const read = () =>
    card.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        transitionProperty: style.transitionProperty,
        transitionDuration: style.transitionDuration,
        transform: style.transform,
        translate: style.translate,
        hovered: element.matches(':hover'),
      };
    });

  const before = await read();
  await card.hover();
  await page.waitForTimeout(HOVER_SETTLE_MS);
  const after = await read();

  return {
    transitionProperty: after.transitionProperty,
    transitionDuration: after.transitionDuration,
    transformBefore: before.transform,
    transformAfter: after.transform,
    translateBefore: before.translate,
    translateAfter: after.translate,
    hoveredBefore: before.hovered,
    hoveredAfter: after.hovered,
    capabilityItems,
  };
}

function everyDurationIsZero(durations: string): boolean {
  return durations.split(',').every((duration) => Number.parseFloat(duration) === 0);
}

test.describe('ZM-2 with reduced motion requested', () => {
  test.use({ reducedMotion: 'reduce' });

  test('ZM-2a the one shipped transition is suppressed and hovering moves nothing', async ({ page }, testInfo) => {
    requireMotionProject(testInfo);
    await openHaoo(page);
    const surface = motionSurface(testInfo);

    const reading = await readCardMotion(page);
    const matchesReduce = await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    recordEvidence(MOTION_EVIDENCE.suppression, {
      surface: surface.id,
      viewport: page.viewportSize(),
      measured: { ...reading, mediaQueryReduceMatches: matchesReduce },
      detail: {
        plan: '05-13',
        rule: 'ZM-2a',
        criterion: 'WCAG 2.2 SC 2.3.3 Animation from Interactions',
        emulation: "reducedMotion: 'reduce' through the runner option",
        project: testInfo.project.name,
        url: page.url(),
        hoverSettleMs: HOVER_SETTLE_MS,
      },
    });

    // Plumbing that keeps the comparison honest: the emulation reached the page, and the hover landed.
    expect(matchesReduce, 'the reduced-motion emulation did not reach the page').toBe(true);
    expect(reading.hoveredBefore, 'the card was already hovered before the first reading').toBe(false);
    expect(reading.hoveredAfter, 'the hover never landed, so the transform comparison would be vacuous').toBe(true);

    expect(
      everyDurationIsZero(reading.transitionDuration) || reading.transitionProperty === 'none',
      `ZM-2a: transition-duration '${reading.transitionDuration}' with transition-property '${reading.transitionProperty}'`,
    ).toBe(true);

    expect(reading.transformAfter, 'ZM-2a: hovering changed the computed transform').toBe(reading.transformBefore);
    expect(reading.translateAfter, 'ZM-2a: hovering changed the computed translate').toBe(reading.translateBefore);
  });

  test('ZM-2b the closed negative: no animation utility and no smooth scrolling', async ({ page }, testInfo) => {
    requireMotionProject(testInfo);
    await openHaoo(page);
    const surface = motionSurface(testInfo);

    /*
     * A CLOSED NEGATIVE. The HAOO page is asserted to carry no motion beyond the one card
     * transition ZM-2a measures: zero animation utilities and no smooth scrolling. A future
     * addition of either surfaces here, as an exact count or an exact computed value, rather than
     * shipping unguarded.
     */
    const negative = await page.evaluate(() => {
      const transitioned = Array.from(document.querySelectorAll('*')).filter((element) => {
        const style = window.getComputedStyle(element);
        return (
          style.transitionProperty !== 'none' &&
          style.transitionDuration.split(',').some((duration) => Number.parseFloat(duration) > 0)
        );
      });
      return {
        animationUtilityElements: document.querySelectorAll('[class*="animate-"]').length,
        htmlScrollBehavior: window.getComputedStyle(document.documentElement).scrollBehavior,
        bodyScrollBehavior: window.getComputedStyle(document.body).scrollBehavior,
        runningAnimations: document.getAnimations().length,
        elementsWithRunnableTransition: transitioned.length,
      };
    });

    recordEvidence(MOTION_EVIDENCE.negative, {
      surface: surface.id,
      viewport: page.viewportSize(),
      measured: negative,
      detail: {
        plan: '05-13',
        rule: 'ZM-2b',
        closedNegative: 'zero [class*="animate-"] elements; neither html nor body computes scroll-behavior smooth',
        recordedNotAsserted: 'runningAnimations and elementsWithRunnableTransition',
        project: testInfo.project.name,
        url: page.url(),
      },
    });

    expect(negative.animationUtilityElements, 'ZM-2b: animation utility elements on the HAOO page').toBe(0);
    expect(negative.bodyScrollBehavior, 'ZM-2b: body scroll-behavior').not.toBe('smooth');
    expect(negative.htmlScrollBehavior, 'ZM-2b: html scroll-behavior').not.toBe('smooth');
  });

  test('ZM-2c suppression removes no content and no control', async ({ page }, testInfo) => {
    // Live only: the preview build's form configuration is not the deployed one, and ZM-2c is a
    // claim about the deployed journey.
    requireLive(testInfo);
    await openHaoo(page);

    const equivalent = await measureEquivalent(page);
    const actions = await measurePrimaryActions(page);

    recordEvidence(MOTION_EVIDENCE.preserved, {
      surface: HAOO.id,
      viewport: page.viewportSize(),
      measured: {
        ...equivalent.reading,
        primaryFloorPx: MIN_PRIMARY_HIT_TARGET_PX,
        actionsExpected: actions.expected,
        actionsSatisfyingAllConditions: actions.satisfying,
        actionDefectCount: actions.defects.length,
        actionDefects: actions.defects,
        instanceCountGaps: actions.instanceCountGaps,
      },
      detail: {
        plan: '05-13',
        rule: 'ZM-2c',
        emulation: "reducedMotion: 'reduce' through the runner option",
        reRuns: 'SS-4 through e2e/fixtures/brochure-equivalence.ts and VC-2 through e2e/fixtures/targets.ts',
        project: testInfo.project.name,
        url: page.url(),
      },
    });

    assertEquivalent(equivalent, 'with reduced motion requested');
    expect(actions.defects, `ZM-2c:\n${actions.defects.join('\n')}`).toEqual([]);
    expect(actions.satisfying).toBe(actions.expected);
  });

  test('ZM-2 observations: the Products colour transition and the deferred F6 inventory, recorded not asserted', async ({ page }, testInfo) => {
    requireLive(testInfo);

    const response = await page.goto(SURFACES.S3.url);
    expect(response?.status(), `unexpected status for ${SURFACES.S3.url}`).toBe(200);
    await page.waitForLoadState('networkidle');
    const region = page.locator(PRODUCTS_REGION_SELECTOR);
    await expect(region, 'the Products region is not on the page').toHaveCount(1);
    await region.scrollIntoViewIfNeeded();

    const inventory = await page.evaluate((selector) => {
      const productsRegion = document.querySelector(selector);
      const describe = (element: Element) => {
        const style = window.getComputedStyle(element);
        const label = (element.getAttribute('aria-label') ?? element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
        return {
          tag: element.tagName.toLowerCase(),
          label,
          transitionProperty: style.transitionProperty,
          transitionDuration: style.transitionDuration,
          transitionsMovementProperty: /\b(all|transform|translate|scale|rotate)\b/.test(style.transitionProperty),
        };
      };
      const runnable = (element: Element) => {
        const style = window.getComputedStyle(element);
        return (
          style.transitionProperty !== 'none' &&
          style.transitionDuration.split(',').some((duration) => Number.parseFloat(duration) > 0)
        );
      };
      const all = Array.from(document.querySelectorAll('*'));
      const inRegion = productsRegion === null ? [] : all.filter((element) => productsRegion.contains(element));
      const outside = all.filter((element) => productsRegion === null || !productsRegion.contains(element));
      return {
        productsRegionTransitions: inRegion.filter(runnable).map(describe),
        outsideRegionAnimationUtilityElements: outside.filter((element) =>
          (element.getAttribute('class') ?? '').includes('animate-'),
        ).length,
        outsideRegionElementsWithRunnableTransition: outside.filter(runnable).length,
        outsideRegionHoverScaleUtilityElements: outside.filter((element) =>
          (element.getAttribute('class') ?? '').includes('hover:scale-'),
        ).length,
        htmlScrollBehavior: window.getComputedStyle(document.documentElement).scrollBehavior,
      };
    }, PRODUCTS_REGION_SELECTOR);

    recordEvidence(MOTION_EVIDENCE.observations, {
      surface: 'S3',
      viewport: page.viewportSize(),
      measured: {
        ...inventory,
        productsRegionTransitionCount: inventory.productsRegionTransitions.length,
      },
      detail: {
        plan: '05-13',
        emulation: "reducedMotion: 'reduce' through the runner option",
        url: page.url(),
        colourTransitionExclusion:
          'The Products region colour transition is deliberately NOT required to be suppressed under reduced motion: ' +
          'a colour transition neither moves nor scales anything, and the criterion concerns motion animation. ' +
          'Requiring it would push a correct component into a variant it does not need.',
        deferredFinding:
          'F6 (05-UI-SPEC.md § Pre-Flight Findings): the ZERO-PAPER HUB home page outside the Products region has ' +
          'animation utilities, hover scaling and observer-driven reveals with no reduced-motion handling anywhere in ' +
          'that repository. Already recorded and DEFERRED by D-OQ-3; cross-referenced here, not re-raised.',
      },
    });
    // Deliberately no assertion on the inventory: D-OQ-3 scopes it out, and the exclusion is a recorded decision.
  });
});

test.describe('ZM-2 control: with no motion preference the same hover does move the card', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the transform reading is sensitive: hovering changes it when motion is allowed', async ({ page }, testInfo) => {
    requireMotionProject(testInfo);
    await openHaoo(page);

    const reading = await readCardMotion(page);
    recordEvidence(MOTION_EVIDENCE.suppression, {
      surface: motionSurface(testInfo).id,
      viewport: page.viewportSize(),
      measured: reading,
      detail: {
        plan: '05-13',
        rule: 'ZM-2a control',
        emulation: "reducedMotion: 'no-preference' through the runner option",
        purpose:
          'Proves the before/after transform comparison can see a hover translate at all, so an equal pair under reduce is a measurement rather than an instrument that never reads a change.',
        project: testInfo.project.name,
        url: page.url(),
      },
    });

    expect(reading.hoveredAfter, 'the hover never landed in the control').toBe(true);
    expect(
      reading.transformAfter,
      'the control lost its subject: hovering no longer translates the card even with motion allowed. ' +
        'ZM-2a then measures nothing; revisit it rather than deleting this control.',
    ).not.toBe(reading.transformBefore);
  });
});

/* ------------------------------------------------------------------------------------ *
 * Held-out readability inputs — E1 and E3 in 05-UI-SPEC.md § UI Considerations.
 *
 * MEASURED, NEVER ASSERTED. Whether paragraph copy inside the max-width columns reads well at a
 * halved viewport (E1), and whether the brochure equivalent stays readable and complete once the
 * capability grid collapses to one column (E3), are line-length and reflow judgements. Any
 * assertion here would pass on unreadable output, so there is none: these are backstop items and
 * route to human judgement at verification time. This test exists to hand that reviewer numbers
 * instead of an impression. The only `expect`-shaped calls are plumbing (the page loaded, and the
 * subjects exist), never a threshold on a readability number.
 * ------------------------------------------------------------------------------------ */

const READABILITY_EVIDENCE = 'zoom-readability-inputs';

interface ReadabilityEntry {
  readonly width: number;
  readonly height: number;
  readonly label: string;
}

/** The narrowest D-09 product-support width, taken from the closed list rather than typed. */
const NARROWEST_SUPPORTED: ReadabilityEntry = (() => {
  const supported = assertNonEmptyViewports(
    VIEWPORTS.filter((entry) => entry.criterion === null),
    'VIEWPORTS filtered to the D-09 product-support widths',
  );
  const narrowest = supported.reduce((least, entry) => (entry.width < least.width ? entry : least));
  return {
    width: narrowest.width,
    height: narrowest.height,
    label: 'narrowest supported product width (D-09); no criterion',
  };
})();

const READABILITY_ENTRIES: readonly ReadabilityEntry[] = [
  NARROWEST_SUPPORTED,
  ...ZOOM_ENTRIES.map((entry) => ({ width: entry.width, height: entry.height, label: entry.criterion })),
];

for (const entry of READABILITY_ENTRIES) {
  test.describe(`held-out readability inputs at ${entry.width}x${entry.height}`, () => {
    test.use({ viewport: viewportOf(entry) });

    test('E1 and E3 inputs: column widths, longest paragraphs, characters per line, cards per row', async ({ page }, testInfo) => {
      requireLive(testInfo);
      await openHaoo(page);

      const inputs = await page.evaluate(() => {
        const rendered = (element: Element) =>
          element.getClientRects().length > 0 && window.getComputedStyle(element).display !== 'none';

        /** Characters, rendered lines and the resulting characters per line for one paragraph. */
        const paragraphReading = (paragraph: Element) => {
          const style = window.getComputedStyle(paragraph);
          const lineHeight = Number.parseFloat(style.lineHeight);
          const rect = paragraph.getBoundingClientRect();
          const characters = (paragraph.textContent ?? '').replace(/\s+/g, ' ').trim().length;
          const lines = Number.isFinite(lineHeight) && lineHeight > 0 ? Math.max(1, Math.round(rect.height / lineHeight)) : 1;
          return {
            characters,
            renderedLines: lines,
            approxCharactersPerLine: Math.round(characters / lines),
            paragraphWidthPx: Math.round(rect.width),
            fontSizePx: Math.round(Number.parseFloat(style.fontSize)),
          };
        };

        const columns = Array.from(document.querySelectorAll('[class*="max-w-["]'))
          .filter(rendered)
          .map((column) => {
            const token = (column.getAttribute('class') ?? '').match(/max-w-\[[^\]]+\]/)?.[0] ?? '';
            const section = column.closest('section');
            const where =
              section?.getAttribute('aria-label') ??
              (section?.querySelector('h2')?.textContent ?? '').trim() ??
              '';
            const paragraphs = column.matches('p') ? [column] : Array.from(column.querySelectorAll('p')).filter(rendered);
            const longest = paragraphs.reduce<Element | null>(
              (best, paragraph) =>
                best === null || (paragraph.textContent ?? '').length > (best.textContent ?? '').length ? paragraph : best,
              null,
            );
            return {
              maxWidthToken: token,
              tag: column.tagName.toLowerCase(),
              section: where === '' ? '(hero)' : where,
              renderedWidthPx: Math.round(column.getBoundingClientRect().width),
              paragraphCount: paragraphs.length,
              longestParagraph: longest === null ? null : paragraphReading(longest),
            };
          });

        const cards = Array.from(document.querySelectorAll('#capabilities li')).filter(rendered);
        const rows = new Map<number, number>();
        for (const card of cards) {
          const top = Math.round(card.getBoundingClientRect().top + window.scrollY);
          rows.set(top, (rows.get(top) ?? 0) + 1);
        }
        const descriptions = cards
          .map((card) => card.querySelector('p'))
          .filter((paragraph): paragraph is HTMLParagraphElement => paragraph !== null);
        const longestDescription = descriptions.reduce<HTMLParagraphElement | null>(
          (best, paragraph) =>
            best === null || (paragraph.textContent ?? '').length > (best.textContent ?? '').length ? paragraph : best,
          null,
        );
        const journeySteps = Array.from(
          document.querySelectorAll('section[aria-label="Rental journey"] ol li p'),
        ).filter(rendered);
        const longestJourney = journeySteps.reduce<Element | null>(
          (best, paragraph) =>
            best === null || (paragraph.textContent ?? '').length > (best.textContent ?? '').length ? paragraph : best,
          null,
        );

        return {
          innerWidth: window.innerWidth,
          columns,
          capabilityGrid: {
            cards: cards.length,
            rows: rows.size,
            cardsPerRow: [...rows.entries()].sort(([a], [b]) => a - b).map(([, count]) => count),
            cardWidthPx: cards.length === 0 ? 0 : Math.round(cards[0].getBoundingClientRect().width),
            longestDescription: longestDescription === null ? null : paragraphReading(longestDescription),
          },
          journey: {
            steps: journeySteps.length,
            longestDescription: longestJourney === null ? null : paragraphReading(longestJourney),
          },
        };
      });

      // Vacuity guards only: the subjects exist. Nothing below is a readability threshold.
      assertNonEmptySubjects(inputs.columns, `rendered max-width content columns at ${entry.width}px`);
      assertNonEmptySubjects(
        Array.from({ length: inputs.capabilityGrid.cards }),
        `rendered capability cards at ${entry.width}px`,
      );

      recordEvidence(READABILITY_EVIDENCE, {
        surface: HAOO.id,
        viewport: viewportOf(entry),
        measured: { ...inputs, columnCount: inputs.columns.length },
        detail: {
          plan: '05-13',
          criterion: entry.label,
          heldOut:
            'E1 (paragraph copy in the max-width columns at a halved viewport) and E3 (the brochure equivalent once the ' +
            'capability grid collapses) are backstop items routed to human judgement; these are their inputs, and ' +
            'nothing about readability is asserted',
          method:
            'renderedLines = round(paragraph height / computed line-height); approxCharactersPerLine = round(characters / renderedLines)',
          project: testInfo.project.name,
          url: page.url(),
        },
      });
    });
  });
}
