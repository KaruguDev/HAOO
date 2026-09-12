import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

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
