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
import { PRIMARY_ACTIONS } from './fixtures/primary-actions';
import { SURFACES, assertNonEmptySubjects } from './fixtures/surfaces';

/**
 * QUAL-03's structural half on the live HAOO page and the live Products region
 * (`05-UI-SPEC.md` § Semantic Structure Contract, SS-1 through SS-4).
 *
 * **Why heading order is asserted HERE and not by the accessibility engine. Read this before
 * deleting anything below as "already covered by axe".**
 *
 * `heading-order` is a `best-practice`-tagged rule. `AXE_TAGS` in `e2e/fixtures/axe.ts` is the
 * five-tag WCAG conformance set and deliberately excludes `best-practice`, so the engine does not
 * run `heading-order` at all — measured, not assumed: `05-EVIDENCE-HARNESS.md` §3 records
 * `headingOrderRan: false`. It cannot simply be added back, because `withTags`, `withRules` and
 * `options` each overwrite `runOnly` wholesale rather than unioning:
 *
 *   `.withTags([...5 WCAG tags]).withRules(['heading-order'])`  ->  1 rule,  2 tags
 *   `.withRules(['heading-order']).withTags([...5 WCAG tags])`  ->  29 rules, 69 tags
 *
 * Re-adding the rule would therefore narrow the whole sweep to that one rule while still
 * reporting itself as a conformance pass — green, fast and wrong. So the engine result is
 * corroboration at best and this file's DOM walk is the load-bearing check. 05-07's baseline
 * explicitly did not measure heading order.
 *
 * **The signal that the corroboration has silently stopped:** an axe result that reports no
 * `heading-order` outcome at all — not in `violations`, not in `passes`, not in `incomplete` —
 * across every surface and every state. That is the reading you get when the rule is not running,
 * and it looks identical to "nothing wrong". If someone later widens `AXE_TAGS` to include
 * `best-practice` expecting corroboration, check that the rule appears in one of those three
 * buckets before believing it.
 *
 * **Where the measurements come from.** Role and accessible-name inventories are read from
 * Playwright's own aria snapshot, so the accessible names in this file are the ENGINE's
 * computation and not a re-implementation of the accessible-name algorithm. Heading LEVELS are
 * read from the DOM (`h1`..`h6` in document order) because SS-1's rule is stated over document
 * order, and because the `<object>` child fallback heading is present in the DOM in every state
 * while its exposure in the accessibility tree depends on whether the embed succeeded.
 *
 * Every measurement is written through `recordEvidence` BEFORE it is asserted, so a failing run
 * still leaves behind the reading that failed.
 *
 * Decision D-OQ-3 bounds the ZERO-PAPER HUB evidence at the Products region. On that surface the
 * absent `main` landmark (finding F5) is recorded as an observation with its measured value and
 * never asserted.
 */

/** The live HAOO page, and the live Products region on the ZERO-PAPER HUB home page. */
const HAOO = SURFACES.S1;
const PRODUCTS = SURFACES.S3;

/** A live network round trip plus several state transitions does not fit the 30 s default. */
const LIVE_TIMEOUT_MS = 180_000;

/**
 * Every test in this file measures the DEPLOYED journeys: `openHaoo` navigates to the absolute live
 * URL and the Products test to the live ZERO-PAPER HUB home page. Run from the hermetic `preview`
 * project they would reach production from the gate that must not need the network, and write S1
 * records indistinguishable from live ones (review CR-01). So they run on the `live` project only.
 */
function requireLive(testInfo: TestInfo): void {
  test.skip(
    testInfo.project.name !== HAOO.playwrightProject,
    'the semantics contract measures the deployed journeys and has no referent in the preview build',
  );
  test.setTimeout(LIVE_TIMEOUT_MS);
}

/** The desktop width every default-state reading is taken at (D-09's 1280 entry). */
const DESKTOP = { width: 1280, height: 1024 } as const;

/** A width below Tailwind's `md` breakpoint, where the section links become the toggle. */
const NARROW = { width: 390, height: 844 } as const;

/** Evidence file names, one per measurement family. */
const EVIDENCE = {
  headings: 'semantics-headings',
  landmarks: 'semantics-landmarks',
  regions: 'semantics-regions',
  products: 'semantics-products-region',
} as const;

/* ------------------------------------------------------------------------------------------- */
/* SS-1 — the expected heading structure, transcribed from the shipped markup                    */
/* ------------------------------------------------------------------------------------------- */

/** `HAOO_PRODUCT.outcome`, pinned by `src/test/haoo-content.test.ts:38`. */
const OUTCOME = 'Run the business, not the paperwork.';

/**
 * The second-level headings SS-1 enumerates, as the page ships them.
 *
 * `Get help choosing` and `Ready to begin?` are the two headings ONE `OnboardingChoices`
 * placement contributes; the component renders three times (opening, mid-page, closing), so each
 * of those two names occurs three times. Repetition is correct here for the same reason it is
 * correct for P4-P8 in `e2e/fixtures/primary-actions.ts`: it is one component rendered three
 * times, and a naive uniqueness assertion would fail a correct page.
 */
const EXPECTED_H2 = [
  'Who HAOO supports',
  'Benefits',
  'Capabilities',
  'Rental journey',
  'Brochure',
  'Send your details',
  'Get help choosing',
  'Ready to begin?',
] as const;

/** How many times each `OnboardingChoices` heading is expected — one per placement. */
const ONBOARDING_PLACEMENTS = 3;

/**
 * The third-level headings present in the default state, in document order.
 *
 * The six capability titles and four journey titles are transcribed from
 * `src/test/haoo-content.test.ts` (`EXPECTED_CAPABILITIES`, `EXPECTED_JOURNEY`) rather than
 * imported: `src/products/haoo.ts` reads `import.meta.env` at module scope, which is undefined
 * outside Vite, so any Playwright spec that imported it would throw at import time. The
 * transcription is guarded — `05-10-SUMMARY.md` records that the vitest suite owns these lists
 * and that a divergence between the two is a defect in this file, not in the page.
 */
const EXPECTED_H3 = [
  'The paperwork problem',
  'Less chasing. More control.',
  'Rent & payments',
  'Properties & units',
  'Leases & screening',
  'Maintenance',
  'Vacancy marketplace',
  'Reports & communication',
  'Fill vacancies with confidence',
  'Move in with clarity',
  'Make every month easier',
  'Grow with visibility',
  'Brochure preview unavailable',
] as const;

/** `QUALIFY_SUMMARY_HEADING` (`src/components/qualify-form.logic.ts:21`). */
const ERROR_SUMMARY_HEADING = 'There is a problem';

/** `FALLBACK_HEADING` (`src/components/BrochurePanel.tsx:29`). */
const BROCHURE_FALLBACK_HEADING = 'Brochure preview unavailable';

/**
 * The two conditional headings this file does NOT cover, named so the coverage is legible
 * rather than silently partial.
 *
 * Both are reached only by a COMPLETED submission, and UI-SPEC § Form State Coverage FS-0
 * confines completed-submission states to the preview target S5 — a failure or confirmation
 * state driven against live production would deliver a real lead. Plan 05-12 owns them there.
 * They are asserted ABSENT here, so a leak of either onto the live page is a failing run rather
 * than an unnoticed one.
 */
const COVERED_BY_05_12 = [
  'Your details are on their way',
  "We couldn't send your details",
] as const;

/* ------------------------------------------------------------------------------------------- */
/* SS-2 — the landmark and region inventories                                                    */
/* ------------------------------------------------------------------------------------------- */

/**
 * The closed labelled-region list, in document order. **Ten entries, and that is a MEASURED
 * CORRECTION to `05-UI-SPEC.md` § SS-2, which lists nine.**
 *
 * The row the contract omits is `Who HAOO supports` — the audiences section
 * (`src/pages/ProductPage.tsx:141`) is labelled by `aria-labelledby="audiences-heading"` rather
 * than by `aria-label`, so it is a labelled region exactly like the other nine and the engine
 * exposes it as `region "Who HAOO supports"`. Measured on the live page 2026-09-12. A spec
 * asserting the contract's nine would fail a correct page.
 *
 * `src/test/haoo-page.test.tsx:47` pins a FIVE-name subset of this list (`expectedSections`),
 * filtered rather than exhaustive. The two are consistent by construction: `JSDOM_PINNED_REGIONS`
 * below is asserted to be an ordered subsequence of this list, so the jsdom suite and this spec
 * cannot drift into pinning different sets.
 */
const EXPECTED_REGION_NAMES = [
  'Opening onboarding choices',
  'Who HAOO supports',
  'Benefits',
  'Capabilities',
  'Rental journey',
  'Mid-page onboarding choices',
  'Brochure',
  'Send your details',
  'Onboarding',
  'Closing onboarding choices',
] as const;

/** The subset `src/test/haoo-page.test.tsx:47` pins, in the order it pins them. */
const JSDOM_PINNED_REGIONS = [
  'Benefits',
  'Capabilities',
  'Rental journey',
  'Brochure',
  'Onboarding',
] as const;

/**
 * The two navigation landmark names, and the states that expose them.
 *
 * **MEASURED CORRECTION to `05-UI-SPEC.md` § SS-2, which requires "two `navigation` landmarks,
 * each with a distinct accessible name".** The page never exposes both at once, and cannot:
 *
 * | State                         | `navigation` count | name                   |
 * |-------------------------------|--------------------|------------------------|
 * | 1280 px                       | 1                  | `HAOO sections`        |
 * | 390 px, menu closed           | 0                  | —                      |
 * | 390 px, menu open             | 1                  | `HAOO mobile sections` |
 *
 * The desktop nav is `hidden … md:flex` (the `sectionsNavLabel` nav in `ProductHeader`) so it is `display: none` below
 * `md`; the mobile nav carries the `hidden` ATTRIBUTE until the toggle is pressed and `md:hidden`
 * above it (the `mobileSectionsNavLabel` nav in `ProductHeader`). Each is therefore in the accessibility tree in exactly one
 * state. The honest contract, asserted below, is: across the three states the union of exposed
 * navigation names is exactly these two, they are distinct, and no state exposes more than one.
 * Measured on the live page 2026-09-12.
 *
 * Since quick task 260913-vbl (OD-3) the footer repeats the section links, but inside a plain
 * `div` link group in `ProductPage`, not a `navigation` landmark, so these counts are unchanged.
 */
const NAVIGATION_NAMES = {
  desktop: 'HAOO sections',
  mobile: 'HAOO mobile sections',
} as const;

/** `navigationToggleLabel('HAOO', false)` (`src/products/copy.ts:31`). */
const NAV_TOGGLE_CLOSED_NAME = 'Open HAOO navigation';

/** `P3`'s accessible name — the control that drives the empty-required submit. */
const SUBMIT_NAME = 'Send my details';

/* ------------------------------------------------------------------------------------------- */
/* Helpers                                                                                       */
/* ------------------------------------------------------------------------------------------- */

interface HeadingReading {
  readonly level: number;
  readonly text: string;
}

interface AriaNode {
  readonly role: string;
  readonly name: string;
  readonly level: number | null;
}

/**
 * Parse Playwright's aria snapshot into role / accessible-name / heading-level triples.
 *
 * The snapshot IS the engine's accessible-name computation, which is the whole reason this file
 * reads it instead of re-implementing accname in `page.evaluate`. Lines that carry no role (the
 * `- /url:` continuation lines, raw text) do not match and are skipped.
 *
 * Known limit, stated rather than hidden: a name containing a double quote would truncate here.
 * No name on either surface contains one — asserted by `assertNoQuotedNames` below, so the limit
 * becomes a failing run rather than a silently short name if that ever changes.
 */
function parseAriaSnapshot(snapshot: string): readonly AriaNode[] {
  const nodes: AriaNode[] = [];

  for (const line of snapshot.split('\n')) {
    const match = /^\s*-\s+([a-z]+)(?:\s+"([^"]*)")?(?:\s+\[level=(\d+)\])?/.exec(line);
    if (match === null) continue;

    nodes.push({
      role: match[1] ?? '',
      name: match[2] ?? '',
      level: match[3] === undefined ? null : Number(match[3]),
    });
  }

  return nodes;
}

/** The guard for `parseAriaSnapshot`'s one stated limit. */
function assertNoQuotedNames(snapshot: string): void {
  for (const line of snapshot.split('\n')) {
    const quotes = (line.match(/"/g) ?? []).length;
    if (quotes > 2) {
      throw new Error(
        `aria snapshot line carries more than one quoted span, so the name parser would ` +
          `truncate it: ${line.trim()}`,
      );
    }
  }
}

/** Every role/name node the engine exposes on the page, for one state. */
async function ariaNodes(page: Page): Promise<readonly AriaNode[]> {
  const snapshot = await page.locator('body').ariaSnapshot();
  assertNoQuotedNames(snapshot);
  return parseAriaSnapshot(snapshot);
}

/** The ordered `h1`..`h6` walk in DOM document order — SS-1's subject. */
async function headingWalk(page: Page): Promise<readonly HeadingReading[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((heading) => ({
      level: Number(heading.tagName.slice(1)),
      text: (heading.textContent ?? '').trim(),
    })),
  );
}

/**
 * SS-1's no-skipped-levels rule: for the ordered level list, every forward step is at most one.
 *
 * Returns the offending pair rather than a boolean, so the failure message names the two
 * headings that skipped rather than only the fact that something did. Nesting is irrelevant — a
 * document-order jump from 2 to 4 is a skipped level however deeply the `h4` is wrapped.
 */
function firstSkippedLevel(
  headings: readonly HeadingReading[],
): { readonly from: HeadingReading; readonly to: HeadingReading } | null {
  for (let index = 1; index < headings.length; index += 1) {
    const from = headings[index - 1];
    const to = headings[index];
    if (from === undefined || to === undefined) continue;
    if (to.level - from.level > 1) return { from, to };
  }

  return null;
}

/** The names the engine exposes for one role, in document order. */
function namesForRole(nodes: readonly AriaNode[], role: string): readonly string[] {
  return nodes.filter((node) => node.role === role).map((node) => node.name);
}

/** Open the live HAOO page at the desktop width every default reading is taken at. */
async function openHaoo(page: Page, viewport: { width: number; height: number } = DESKTOP) {
  await page.setViewportSize(viewport);
  await page.goto(HAOO.url, { waitUntil: 'networkidle' });
}

/** The landmark singletons SS-2 requires, read in whatever state the caller has produced. */
async function landmarkCounts(page: Page) {
  return {
    banner: await page.getByRole('banner').count(),
    main: await page.getByRole('main').count(),
    contentinfo: await page.getByRole('contentinfo').count(),
    navigation: await page.getByRole('navigation').count(),
  };
}

/**
 * Drive the page into the empty-required-submit state. Nothing is sent: the form is `noValidate`
 * and untouched, so validation stops the submit before any request.
 *
 * The provider route is belt-and-braces against that reasoning being wrong, as in every other spec
 * that drives the live form: a validation regression must abort in the browser, not send a lead.
 */
async function submitEmptyRequired(page: Page): Promise<void> {
  await page.route(/formsubmit\.co/, (route) => route.abort('blockedbyclient'));
  const submit: Locator = page.getByRole('button', { name: SUBMIT_NAME, exact: true });
  await submit.scrollIntoViewIfNeeded();
  await submit.click();
  await expect(
    page.getByRole('heading', { name: ERROR_SUMMARY_HEADING, exact: true }),
  ).toBeVisible();
}

/* ------------------------------------------------------------------------------------------- */
/* SS-1 — headings                                                                               */
/* ------------------------------------------------------------------------------------------- */

test.describe('SS-1 — heading order, asserted by this spec rather than by an advisory rule', () => {
  test.describe.configure({ timeout: LIVE_TIMEOUT_MS });

  test('the default state has one top-level heading and the shipped level structure', async ({
    page,
  }, testInfo) => {
    requireLive(testInfo);
    await openHaoo(page);

    const headings = assertNonEmptySubjects(
      await headingWalk(page),
      'the h1..h6 document-order walk on the live HAOO page',
    );
    const levels = headings.map((heading) => heading.level);
    const skipped = firstSkippedLevel(headings);

    recordEvidence(EVIDENCE.headings, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        state: 'default',
        sequence: headings.map((heading) => `h${heading.level} ${heading.text}`),
        levels,
        topLevelCount: levels.filter((level) => level === 1).length,
        skippedStep: skipped === null
          ? 'none observed'
          : `h${skipped.from.level} -> h${skipped.to.level}`,
      },
      detail: {
        url: HAOO.url,
        rule: 'SS-1',
        owner:
          'this spec, not axe: heading-order is best-practice-tagged and AXE_TAGS excludes it',
      },
    });

    // Exactly one top-level heading, and it is the product outcome.
    const topLevel = headings.filter((heading) => heading.level === 1);
    expect(topLevel).toHaveLength(1);
    expect(topLevel[0]?.text).toBe(OUTCOME);

    // No skipped levels, naming the offending pair when there is one.
    expect(
      skipped,
      skipped === null
        ? ''
        : `skipped heading level: "h${skipped.from.level} ${skipped.from.text}" is followed in ` +
          `document order by "h${skipped.to.level} ${skipped.to.text}", a forward step of ` +
          `${skipped.to.level - skipped.from.level}`,
    ).toBeNull();

    // The structure asserted explicitly, not only structurally.
    const h2 = headings.filter((heading) => heading.level === 2).map((heading) => heading.text);
    const h3 = headings.filter((heading) => heading.level === 3).map((heading) => heading.text);

    for (const expected of EXPECTED_H2) {
      const occurrences = h2.filter((text) => text === expected).length;
      const wanted = expected === 'Get help choosing' || expected === 'Ready to begin?'
        ? ONBOARDING_PLACEMENTS
        : 1;
      expect(occurrences, `second-level heading "${expected}"`).toBe(wanted);
    }

    for (const expected of EXPECTED_H3) {
      expect(h3, `third-level heading "${expected}"`).toContain(expected);
    }

    // No heading deeper than h3 ships on this page; a new h4 is a structure change, not a typo.
    expect(Math.max(...levels)).toBe(3);

    // The two states plan 05-12 owns on the preview target must not appear here.
    for (const elsewhere of COVERED_BY_05_12) {
      expect(
        headings.map((heading) => heading.text),
        `"${elsewhere}" is covered by plan 05-12 on S5 and must not reach the live default state`,
      ).not.toContain(elsewhere);
    }
  });

  test('the error-summary state holds its level', async ({ page }, testInfo) => {
    requireLive(testInfo);
    await openHaoo(page);
    await submitEmptyRequired(page);

    const headings = await headingWalk(page);
    const skipped = firstSkippedLevel(headings);
    const summary = headings.filter((heading) => heading.text === ERROR_SUMMARY_HEADING);

    recordEvidence(EVIDENCE.headings, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        state: 'error-summary (empty required submit, nothing sent)',
        sequence: headings.map((heading) => `h${heading.level} ${heading.text}`),
        errorSummaryLevels: summary.map((heading) => heading.level),
        topLevelCount: headings.filter((heading) => heading.level === 1).length,
        skippedStep: skipped === null
          ? 'none observed'
          : `h${skipped.from.level} -> h${skipped.to.level}`,
      },
      detail: { url: HAOO.url, rule: 'SS-1', state: 'error-summary' },
    });

    expect(summary).toHaveLength(1);
    expect(summary[0]?.level).toBe(3);
    expect(headings.filter((heading) => heading.level === 1)).toHaveLength(1);
    expect(skipped).toBeNull();
  });

  test('the aborted-artifact state holds its level', async ({ page }, testInfo) => {
    requireLive(testInfo);
    await page.route('**/*.pdf', (route) => route.abort());
    await openHaoo(page);
    await page.getByRole('region', { name: 'Brochure', exact: true }).scrollIntoViewIfNeeded();

    const fallback = page.getByRole('heading', { name: BROCHURE_FALLBACK_HEADING, exact: true });
    await expect(fallback).toBeVisible();

    const headings = await headingWalk(page);
    const skipped = firstSkippedLevel(headings);
    const fallbackHeadings = headings.filter(
      (heading) => heading.text === BROCHURE_FALLBACK_HEADING,
    );

    recordEvidence(EVIDENCE.headings, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        state: 'artifact route aborted (**/*.pdf)',
        sequence: headings.map((heading) => `h${heading.level} ${heading.text}`),
        fallbackHeadingLevels: fallbackHeadings.map((heading) => heading.level),
        fallbackExposedInAccessibilityTree: await fallback.count(),
        topLevelCount: headings.filter((heading) => heading.level === 1).length,
        skippedStep: skipped === null
          ? 'none observed'
          : `h${skipped.from.level} -> h${skipped.to.level}`,
      },
      detail: { url: HAOO.url, rule: 'SS-1', state: 'artifact-aborted' },
    });

    expect(fallbackHeadings).toHaveLength(1);
    expect(fallbackHeadings[0]?.level).toBe(3);
    expect(headings.filter((heading) => heading.level === 1)).toHaveLength(1);
    expect(skipped).toBeNull();
  });
});

/* ------------------------------------------------------------------------------------------- */
/* SS-2 — landmarks and regions                                                                  */
/* ------------------------------------------------------------------------------------------- */

test.describe('SS-2 — landmark and region inventories', () => {
  test.describe.configure({ timeout: LIVE_TIMEOUT_MS });

  test('one banner, one main, one contentinfo, and the closed region list', async ({ page }, testInfo) => {
    requireLive(testInfo);
    await openHaoo(page);

    const nodes = await ariaNodes(page);
    const counts = await landmarkCounts(page);
    const regions = namesForRole(nodes, 'region');
    const navigationNames = namesForRole(nodes, 'navigation');

    recordEvidence(EVIDENCE.landmarks, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        state: 'default (1280 px)',
        banner: counts.banner,
        main: counts.main,
        contentinfo: counts.contentinfo,
        navigation: counts.navigation,
        navigationNames,
      },
      detail: { url: HAOO.url, rule: 'SS-2' },
    });

    recordEvidence(EVIDENCE.regions, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        capturedRegionNames: regions,
        capturedRegionCount: regions.length,
        expectedRegionNames: [...EXPECTED_REGION_NAMES],
        expectedRegionCount: EXPECTED_REGION_NAMES.length,
      },
      detail: {
        url: HAOO.url,
        rule: 'SS-2',
        note:
          'Ten, not the nine 05-UI-SPEC SS-2 lists: the audiences section is labelled by ' +
          'aria-labelledby="audiences-heading" and is a region named "Who HAOO supports".',
      },
    });

    expect(counts.banner).toBe(1);
    expect(counts.main).toBe(1);
    expect(counts.contentinfo).toBe(1);

    // The closed region list, compared as an ordered list of element names.
    assertNonEmptySubjects(regions, 'the labelled regions on the live HAOO page');
    expect(regions).toEqual([...EXPECTED_REGION_NAMES]);
    expect(regions).toHaveLength(10);

    // The jsdom suite pins a five-name subset; the two must not drift into different sets.
    const pinnedPositions = JSDOM_PINNED_REGIONS.map((name) => regions.indexOf(name));
    expect(pinnedPositions, 'every region src/test/haoo-page.test.tsx:47 pins must exist here')
      .not.toContain(-1);
    expect(
      pinnedPositions,
      'the jsdom-pinned regions must appear in this list in the same order',
    ).toEqual([...pinnedPositions].sort((left, right) => left - right));
  });

  test('the two navigation landmarks are distinct, and each is exposed in its own state', async ({
    page,
  }, testInfo) => {
    requireLive(testInfo);
    await openHaoo(page);
    const desktop = namesForRole(await ariaNodes(page), 'navigation');

    await page.setViewportSize(NARROW);
    const narrowClosed = namesForRole(await ariaNodes(page), 'navigation');

    await page.getByRole('button', { name: NAV_TOGGLE_CLOSED_NAME, exact: true }).click();
    const narrowOpen = namesForRole(await ariaNodes(page), 'navigation');

    const union = [...new Set([...desktop, ...narrowClosed, ...narrowOpen])];

    recordEvidence(EVIDENCE.landmarks, {
      surface: HAOO.id,
      viewport: NARROW,
      measured: {
        desktopNavigationNames: desktop,
        narrowClosedNavigationNames: narrowClosed,
        narrowClosedNavigationCount: narrowClosed.length,
        narrowOpenNavigationNames: narrowOpen,
        distinctNamesAcrossStates: union,
      },
      detail: {
        url: HAOO.url,
        rule: 'SS-2',
        note:
          'MEASURED CORRECTION: SS-2 asks for two navigation landmarks. The page exposes at ' +
          'most one at a time — the desktop nav is display:none below md, and the mobile nav ' +
          'carries the hidden attribute until the toggle is pressed.',
      },
    });

    expect(desktop).toEqual([NAVIGATION_NAMES.desktop]);
    expect(narrowClosed).toEqual([]);
    expect(narrowOpen).toEqual([NAVIGATION_NAMES.mobile]);

    // Two distinct names across the traversal, never two at once.
    expect(union).toHaveLength(2);
    expect(new Set(union).size).toBe(2);
    expect(union).toContain(NAVIGATION_NAMES.desktop);
    expect(union).toContain(NAVIGATION_NAMES.mobile);
    for (const state of [desktop, narrowClosed, narrowOpen]) {
      expect(state.length).toBeLessThanOrEqual(1);
    }
  });

  test('the Products section is a named region its nav entry resolves to', async ({ page }, testInfo) => {
    requireLive(testInfo);
    await page.setViewportSize(DESKTOP);
    await page.goto(PRODUCTS.url, { waitUntil: 'networkidle' });

    const section = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (element === null) return null;

      const labelledBy = element.getAttribute('aria-labelledby');
      return {
        id: element.id,
        labelledBy,
        labelText: labelledBy === null
          ? null
          : (document.getElementById(labelledBy)?.textContent ?? '').trim(),
      };
    }, PRODUCTS_REGION_SELECTOR);

    const navEntries = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map((anchor) => ({
          text: (anchor.textContent ?? '').trim(),
          raw: anchor.getAttribute('href') ?? '',
        }))
        .filter((entry) => entry.text === 'Products'),
    );

    const mainCount = await page.getByRole('main').count();
    const productsRegion = page.getByRole('region', { name: 'Products', exact: true });

    recordEvidence(EVIDENCE.products, {
      surface: PRODUCTS.id,
      viewport: DESKTOP,
      measured: {
        regionId: section?.id ?? '(absent)',
        labelledBy: section?.labelledBy ?? '(absent)',
        labelText: section?.labelText ?? '(absent)',
        productsRegionCount: await productsRegion.count(),
        productsNavEntries: navEntries,
      },
      detail: { url: PRODUCTS.url, rule: 'SS-2' },
    });

    /*
     * OBSERVATION, NOT AN ASSERTION. Finding F5: the ZERO-PAPER HUB home page exposes no `main`
     * landmark. Owner decision D-OQ-3 defers every ZERO-PAPER HUB defect outside the Products
     * region to a future phase in that repository — a SCOPE decision, not a severity judgement.
     * The measured value is written to evidence and the run does not turn on it.
     */
    recordEvidence(EVIDENCE.products, {
      surface: PRODUCTS.id,
      viewport: DESKTOP,
      measured: { mainLandmarkCount: mainCount },
      detail: {
        url: PRODUCTS.url,
        finding: 'F5',
        disposition: 'deferred by D-OQ-3 — recorded as an observation, never asserted',
      },
    });

    expect(section).not.toBeNull();
    expect(section?.labelledBy).toBe('products-heading');
    expect(section?.labelText).toBe('Products');
    await expect(productsRegion).toHaveCount(1);

    // The nav entry's destination resolves to the region's own identifier.
    assertNonEmptySubjects(navEntries, "the 'Products' navigation entries on the ZPH home page");
    for (const entry of navEntries) {
      expect(entry.raw).toBe(`#${section?.id ?? ''}`);
    }
  });
});

/* ------------------------------------------------------------------------------------------- */
/* SS-3 — accessible names, and names that promise destinations                                  */
/* ------------------------------------------------------------------------------------------- */

/** `${productName} brochure preview` (`src/components/BrochurePanel.tsx:139`). */
const EMBED_LABEL = 'HAOO brochure preview';

/**
 * The closed list of promise rules: which accessible names NAME a destination, and what
 * destination each one promises.
 *
 * SS-3's rule is "for every link whose accessible name names a destination — a phone number, an
 * email address, a host, or another site — the resolved destination must be that destination".
 * That is unassertable until "names a destination" is a closed list, so it is one here. A name
 * that matches no rule is not silently exempt: `UNMATCHED_DESTINATION_NAMES` below pins the
 * names that are deliberately outside the rule set, so a new destination-naming link cannot
 * appear without one of the two lists changing.
 *
 * **This is the rule that caught F1, and nothing cheaper could have.** Both
 * `Back to ZERO-PAPER HUB` links shipped `href="/"` — correct while HAOO lived at
 * `zero-paperhub.com/products/haoo/`, a self-loop the moment 04.2 gave HAOO its own origin. A
 * status-code check cannot see it: `/` on the HAOO host returns 200 and renders a valid page. A
 * broken-link crawler cannot see it. Only comparing a link's PROMISE against its DESTINATION
 * surfaces that class of defect, which is why T-05-43 rates it `high` and why this list exists.
 *
 * Resolved destinations are compared, never raw attribute strings — `href="/"` and
 * `href="https://www.haoo.online/"` are the same destination and different strings.
 *
 * 2026-09-13, quick task 260913-vbl (OD-1, OD-3): no link names the parent site any more — both
 * back links were removed, so D4 currently matches no link. It stays as a guard: any future link
 * naming ZERO-PAPER HUB must resolve to it. D-07 visibility is now carried by the hero
 * relationship line and the footer relationship sentence, which are text, not links.
 */
const DESTINATION_PROMISES = [
  {
    id: 'D1',
    kind: 'phone number',
    names: (name: string) => name.includes('+254 702 188 044'),
    promise: 'tel:+254702188044',
    resolves: (href: string) => href === 'tel:+254702188044',
  },
  {
    id: 'D2',
    kind: 'email address',
    names: (name: string) => name.includes('info@haoo.online'),
    promise: 'mailto:info@haoo.online',
    resolves: (href: string) => href === 'mailto:info@haoo.online',
  },
  {
    id: 'D3',
    kind: 'host',
    names: (name: string) => /WhatsApp/i.test(name),
    promise: 'the wa.me host',
    resolves: (href: string) => safeHost(href) === 'wa.me',
  },
  {
    id: 'D4',
    kind: 'another site',
    names: (name: string) => /ZERO-PAPER HUB/.test(name),
    promise: 'https://www.zero-paperhub.com/',
    resolves: (href: string) => safeOrigin(href) === 'https://www.zero-paperhub.com',
  },
] as const;

/**
 * Accessible names that are deliberately NOT destination promises, each with its reason.
 *
 * Kept as a closed list rather than an implicit "anything unmatched is fine", so that a newly
 * shipped link naming a host nobody registered fails this file instead of passing it.
 */
const UNMATCHED_DESTINATION_NAMES = [
  'Skip to HAOO content',
  // Quick task 260913-vbl: the logo home link (#top) and the header CTA (#onboarding).
  'HAOO home',
  'Get started',
  'Benefits',
  'Capabilities',
  'Brochure',
  'Send details',
  'Onboarding',
  'Send your details instead',
  'Start with HAOO',
  'Open brochure (opens in a new tab)',
  'Download brochure',
  'How we measure this page',
  'Send my details',
  'Open HAOO navigation',
] as const;

/**
 * The controls present in the DOM but not exposed by the accessibility tree at 1280 px.
 *
 * Closed list, measured live on 2026-09-12, in the same discipline as every other list in this
 * phase: an entry is admitted for a stated reason, and the list is not widened to make a failing
 * run pass. Entries one through six are the mobile navigation panel's links — its copies of the
 * five section links and, since quick task 260913-vbl, of the Get started CTA — entry seven is
 * the navigation toggle (`md:hidden`), entry eight is the anti-spam honeypot, which
 * sits inside an `aria-hidden="true"` wrapper by design, and entry nine is the measurement
 * disclosure's clear control, which lives inside a `<details>` element that ships collapsed
 * (`src/components/MeasurementDisclosure.tsx:28`; the label is `measurement.disclosure.clearLabel`
 * in `src/products/haoo.ts:351`).
 */
const EXPECTED_UNEXPOSED_AT_DESKTOP = [
  'Benefits',
  'Capabilities',
  'Brochure',
  'Send details',
  'Onboarding',
  'Get started',
  'Open HAOO navigation',
  'Leave this field blank',
  'Clear what this page remembers',
] as const;

/** `new URL(...).host`, or the input itself for a non-URL scheme such as `tel:`. */
function safeHost(href: string): string {
  try {
    return new URL(href).host;
  } catch {
    return href;
  }
}

/** `new URL(...).origin`, or the input itself for a non-URL scheme such as `mailto:`. */
function safeOrigin(href: string): string {
  try {
    return new URL(href).origin;
  } catch {
    return href;
  }
}

/* ------------------------------------------------------------------------------------------- */
/* SS-4 — the brochure HTML equivalent                                                           */
/* ------------------------------------------------------------------------------------------- */

const NAME_EVIDENCE = {
  names: 'semantics-accessible-names',
  destinations: 'semantics-destinations',
  equivalence: 'semantics-brochure-equivalence',
} as const;

interface NamedControl {
  readonly tag: string;
  readonly role: 'link' | 'button' | 'control';
  readonly name: string;
  readonly textContent: string;
  readonly ariaLabel: string | null;
  readonly href: string | null;
  readonly labelText: string | null;
  readonly describedBy: string | null;
  readonly describedByResolves: boolean | null;
  readonly iconDescendants: number;
  readonly exposedIconDescendants: number;
  /**
   * Whether the element is rendered at the CURRENT viewport and outside any `aria-hidden`
   * subtree — i.e. whether the accessibility tree exposes it here.
   *
   * The DOM traversal is a strict SUPERSET of the accessibility-tree traversal at any one
   * width, and that is by design rather than a defect: the responsive header ships both a
   * desktop nav and a mobile nav, and exactly one of them is rendered at a time. Keeping the
   * two apart is what lets the name rules apply to every control in the document while the
   * engine cross-check applies only to the controls the engine can actually see.
   */
  readonly exposed: boolean;
}

/**
 * Every link, button and form control in the traversal, with the material SS-3 needs.
 *
 * `name` is the shipped accessible name for these controls: each is either a text control whose
 * `textContent` is its name, an icon-only control carrying `aria-label`, or a form control
 * labelled by a resolving `<label for>`. That equivalence is not assumed — the caller checks
 * each captured name against the ENGINE's own computation via `toHaveAccessibleName` before the
 * table is trusted.
 */
async function namedControls(page: Page): Promise<readonly NamedControl[]> {
  return page.evaluate(() => {
    const results: unknown[] = [];

    for (const element of Array.from(
      document.querySelectorAll('a[href], button, input, select, textarea'),
    )) {
      const tag = element.tagName;
      const isControl = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
      const ariaLabel = element.getAttribute('aria-label');
      const text = (element.textContent ?? '').trim();
      const label = element.id === ''
        ? null
        : document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      const labelText = label === null ? null : (label.textContent ?? '').trim();
      const describedBy = element.getAttribute('aria-describedby');
      const icons = Array.from(element.querySelectorAll('svg'));

      results.push({
        tag,
        role: isControl ? 'control' : tag === 'BUTTON' ? 'button' : 'link',
        name: isControl ? (labelText ?? ariaLabel ?? '') : (ariaLabel ?? text),
        textContent: text,
        ariaLabel,
        href: element instanceof HTMLAnchorElement ? element.href : null,
        labelText,
        describedBy,
        describedByResolves: describedBy === null
          ? null
          : describedBy
            .split(/\s+/)
            .filter((token) => token !== '')
            .every((token) => document.getElementById(token) !== null),
        iconDescendants: icons.length,
        exposedIconDescendants: icons.filter(
          (icon) => icon.getAttribute('aria-hidden') !== 'true',
        ).length,
        exposed:
          element.checkVisibility() && element.closest('[aria-hidden="true"]') === null,
      });
    }

    return results as never;
  });
}

/** Every `<img>` with the two facts SS-3 distinguishes: alt present, and alt non-empty. */
async function images(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('img')).map((image) => ({
      src: image.getAttribute('src') ?? '(none)',
      hasAltAttribute: image.hasAttribute('alt'),
      alt: image.getAttribute('alt') ?? '(missing)',
      decorative: image.getAttribute('alt') === '',
    })),
  );
}

/** The three references to the brochure artifact, each RESOLVED against the live document. */
async function brochureReferences(page: Page) {
  return page.evaluate(() => {
    const head = document.querySelector<HTMLLinkElement>(
      'link[rel="alternate"][type="application/pdf"]',
    );
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'));
    const open = anchors.find((anchor) => /Open brochure/.test(anchor.textContent ?? ''));
    const download = anchors.find((anchor) => anchor.hasAttribute('download'));

    return {
      head: head === null ? null : { raw: head.getAttribute('href'), resolved: head.href },
      open: open === undefined ? null : { raw: open.getAttribute('href'), resolved: open.href },
      download: download === undefined
        ? null
        : { raw: download.getAttribute('href'), resolved: download.href },
    };
  });
}

test.describe('SS-3 — every name is descriptive, and every name that names a destination is true', () => {
  test.describe.configure({ timeout: LIVE_TIMEOUT_MS });

  test('every link, button and control has a non-empty name, and no name is icon content', async ({
    page,
  }, testInfo) => {
    requireLive(testInfo);
    await openHaoo(page);

    const controls = assertNonEmptySubjects(
      await namedControls(page),
      'the links, buttons and form controls on the live HAOO page',
    );
    const pictures = assertNonEmptySubjects(await images(page), 'the images on the live HAOO page');
    const unnamed = controls.filter((control) => control.name === '');
    const exposedIcons = controls.filter((control) => control.exposedIconDescendants > 0);
    const iconOnlyNames = controls.filter(
      (control) => control.textContent === '' && (control.ariaLabel ?? '') === '' &&
        (control.labelText ?? '') === '',
    );
    const totalIcons = await page.locator('svg').count();
    const unhiddenIcons = await page.locator('svg:not([aria-hidden="true"])').count();

    recordEvidence(NAME_EVIDENCE.names, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        controlsTraversed: controls.length,
        unnamedControls: unnamed.map((control) => `${control.tag} ${control.href ?? ''}`),
        iconElements: totalIcons,
        iconElementsExposedToTheAccessibilityTree: unhiddenIcons,
        controlsWhoseOnlyContentIsAnIcon: iconOnlyNames.length,
        controlsNotExposedAtThisWidth: controls
          .filter((control) => !control.exposed)
          .map((control) => control.name),
        imagesWithNonEmptyAlt: pictures.filter((image) => !image.decorative).length,
        imagesMarkedDecorative: pictures.filter((image) => image.decorative).length,
        imagesMissingAnAltAttribute: pictures.filter((image) => !image.hasAltAttribute).length,
        embedLabel: (await page.locator('object').getAttribute('aria-label')) ?? '(none)',
      },
      detail: { url: HAOO.url, rule: 'SS-3' },
    });

    expect(unnamed, 'every link, button and form control carries a non-empty accessible name')
      .toEqual([]);

    /*
     * The decorative-icon rule, asserted as a NEGATIVE. Every lucide icon carries
     * aria-hidden="true", so no icon contributes a character to any accessible name; and no
     * control is left whose only content is an icon, which is the state in which a name COULD be
     * composed solely of icon content. Both halves are needed: hiding the icons without naming
     * the icon-only control would leave a nameless button, and naming it without hiding them
     * would leave the icon in the name.
     */
    expect(exposedIcons, 'no icon is exposed to the accessibility tree').toEqual([]);
    expect(unhiddenIcons).toBe(0);
    expect(totalIcons).toBeGreaterThan(0);
    expect(iconOnlyNames, 'no control is named by icon content alone').toEqual([]);

    // Images: a non-empty alt, or an explicit empty alt marking it decorative. Never absent.
    for (const image of pictures) {
      expect(image.hasAltAttribute, `img ${image.src} carries an alt attribute`).toBe(true);
    }
    expect(pictures.filter((image) => !image.decorative).length).toBeGreaterThan(0);

    // The embed's label is the product name followed by the brochure-preview suffix.
    await expect(page.locator('object')).toHaveAttribute('aria-label', EMBED_LABEL);

    /*
     * The captured names are the ENGINE's, not this file's: each is checked against
     * `toHaveAccessibleName`. Only controls the engine exposes at this width can be checked
     * that way, so the unexposed remainder is not quietly dropped — it is captured as a closed
     * list below and asserted, which is what stops "the engine could not see it" from becoming
     * a place for an unnamed control to hide.
     */
    for (const control of controls.filter(
      (entry) => entry.role !== 'control' && entry.exposed,
    )) {
      const role = control.role === 'button' ? 'button' : 'link';
      await expect(
        page.getByRole(role, { name: control.name, exact: true }).first(),
      ).toHaveAccessibleName(control.name);
    }

    /*
     * The controls present in the DOM and NOT exposed at 1280 px, asserted as a closed list.
     * All of them are the responsive header's mobile half plus the anti-spam honeypot: the
     * toggle is `md:hidden`, the mobile nav carries the `hidden` attribute until it is opened,
     * and the honeypot sits inside an `aria-hidden="true"` wrapper with `tabIndex={-1}`. Each
     * still carries a non-empty accessible name, which the `unnamed` assertion above covers for
     * every control in the document, exposed or not.
     */
    const unexposedNames = controls.filter((control) => !control.exposed).map((c) => c.name);
    expect(unexposedNames.slice().sort()).toEqual([...EXPECTED_UNEXPOSED_AT_DESKTOP].sort());

    // Every form control's name comes from a <label for> that resolves.
    const formControls = controls.filter((control) => control.role === 'control');
    assertNonEmptySubjects(formControls, 'the form controls on the live HAOO page');
    for (const control of formControls) {
      expect(control.labelText, `${control.tag} is named by a resolving <label for>`)
        .not.toBeNull();
      expect(control.labelText).not.toBe('');
    }
  });

  test('every description reference resolves in the state that renders one', async ({ page }, testInfo) => {
    requireLive(testInfo);
    await openHaoo(page);

    const idle = (await namedControls(page)).filter((control) => control.describedBy !== null);

    await submitEmptyRequired(page);
    const described = (await namedControls(page)).filter((control) => control.describedBy !== null);

    recordEvidence(NAME_EVIDENCE.names, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        state: 'error-summary (empty required submit, nothing sent)',
        describedControlsInDefaultState: idle.length,
        describedControlsInErrorState: described.length,
        describedByTokens: described.map((control) => control.describedBy ?? '(none)'),
        unresolvedDescriptionReferences: described
          .filter((control) => control.describedByResolves !== true)
          .map((control) => control.describedBy ?? '(none)'),
      },
      detail: {
        url: HAOO.url,
        rule: 'SS-3',
        note:
          'No field ships help text, so aria-describedby is absent in the default state and is ' +
          'asserted in the error state, which is the state that renders one.',
      },
    });

    assertNonEmptySubjects(described, 'the controls carrying aria-describedby in the error state');
    for (const control of described) {
      expect(
        control.describedByResolves,
        `aria-describedby="${control.describedBy ?? ''}" resolves to elements that exist`,
      ).toBe(true);
    }
  });

  test('every name that names a destination resolves to that destination', async ({ page }, testInfo) => {
    requireLive(testInfo);
    await openHaoo(page);

    const links = assertNonEmptySubjects(
      (await namedControls(page)).filter((control) => control.role === 'link'),
      'the links on the live HAOO page',
    );

    const table = links.map((link) => {
      const rule = DESTINATION_PROMISES.find((entry) => entry.names(link.name));
      return {
        name: link.name,
        resolved: link.href ?? '(none)',
        rule: rule?.id ?? '(none)',
        promise: rule?.promise ?? '(names no destination)',
      };
    });

    const byName = new Map<string, Set<string>>();
    for (const row of table) {
      const destinations = byName.get(row.name) ?? new Set<string>();
      destinations.add(row.resolved);
      byName.set(row.name, destinations);
    }

    recordEvidence(NAME_EVIDENCE.destinations, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        linksTraversed: links.length,
        table: [...byName.entries()].map(([name, destinations]) => ({
          accessibleName: name,
          resolvedDestinations: [...destinations],
          instances: table.filter((row) => row.name === name).length,
          rule: table.find((row) => row.name === name)?.rule ?? '(none)',
        })),
      },
      detail: { url: HAOO.url, rule: 'SS-3', threat: 'T-05-43' },
    });

    // Identical accessible name implies identical destination. Duplication is correct on this
    // page (P4-P8 render three times); divergence is the defect.
    for (const [name, destinations] of byName) {
      expect([...destinations], `"${name}" resolves to one destination in every instance`)
        .toHaveLength(1);
    }

    // Every name either matches a promise rule or is registered as naming no destination.
    for (const row of table) {
      if (row.rule !== '(none)') continue;
      expect(
        [...UNMATCHED_DESTINATION_NAMES] as string[],
        `"${row.name}" matches no promise rule and is not registered as naming no destination`,
      ).toContain(row.name);
    }

    // The promise rules themselves.
    for (const row of table) {
      const rule = DESTINATION_PROMISES.find((entry) => entry.id === row.rule);
      if (rule === undefined) continue;

      expect(
        rule.resolves(row.resolved),
        `"${row.name}" names ${rule.kind} ${rule.promise} and must resolve to it; ` +
          `it resolves to ${row.resolved}`,
      ).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------------------------------- */
/* SS-4 — the brochure HTML equivalent                                                           */
/* ------------------------------------------------------------------------------------------- */

test.describe('SS-4 — the brochure content exists as HTML, and outlives the brochure file', () => {
  test.describe.configure({ timeout: LIVE_TIMEOUT_MS });

  test('the capability and journey content is present, in order, at count equality', async ({
    page,
  }, testInfo) => {
    requireLive(testInfo);
    await openHaoo(page);

    const capabilities = await capabilityItems(page);
    const journey = await journeyItems(page);

    recordEvidence(NAME_EVIDENCE.equivalence, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        state: 'artifact reachable',
        capabilitiesFound: capabilities.length,
        capabilitiesExpected: EXPECTED_CAPABILITIES.length,
        journeyStepsFound: journey.length,
        journeyStepsExpected: EXPECTED_JOURNEY.length,
        equivalentItemsFound: capabilities.length + journey.length,
        equivalentItemsExpected: BROCHURE_EQUIVALENT_ITEMS,
        capabilityTitles: capabilities.map(([title]) => title),
        journeyTitles: journey.map(([title]) => title),
      },
      detail: { url: HAOO.url, rule: 'SS-4', threat: 'T-05-45' },
    });

    assertNonEmptySubjects(capabilities, 'the capability cards on the live HAOO page');
    assertNonEmptySubjects(journey, 'the journey steps on the live HAOO page');

    // Count equality on each list, not merely presence: a silently dropped item fails here.
    expect(capabilities).toHaveLength(EXPECTED_CAPABILITIES.length);
    expect(journey).toHaveLength(EXPECTED_JOURNEY.length);
    expect(capabilities.length + journey.length).toBe(BROCHURE_EQUIVALENT_ITEMS);

    // Title as an <h3> and description as text, in the same <li>, in document order.
    expect(capabilities).toEqual(EXPECTED_CAPABILITIES.map(([title, body]) => [title, body]));
    expect(journey).toEqual(EXPECTED_JOURNEY.map(([title, body]) => [title, body]));

    const capabilityHeadings = await page.locator('#capabilities li h3').allInnerTexts();
    expect(capabilityHeadings.map((text) => text.trim()))
      .toEqual(EXPECTED_CAPABILITIES.map(([title]) => title));
  });

  test('the equivalent survives the artifact being unavailable, and keeps both controls', async ({
    page,
  }, testInfo) => {
    requireLive(testInfo);
    await page.route('**/*.pdf', (route) => route.abort());
    await openHaoo(page);
    await page.getByRole('region', { name: 'Brochure', exact: true }).scrollIntoViewIfNeeded();

    const fallbackHeading = page.getByRole('heading', {
      name: BROCHURE_FALLBACK_HEADING,
      exact: true,
    });
    const fallbackBody = page.getByText(
      'You can still open the HAOO brochure in a new tab or download the PDF.',
      { exact: true },
    );
    const open = page.getByRole('link', { name: 'Open brochure (opens in a new tab)', exact: true });
    const download = page.getByRole('link', { name: 'Download brochure', exact: true });

    const capabilities = await capabilityItems(page);
    const journey = await journeyItems(page);

    recordEvidence(NAME_EVIDENCE.equivalence, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        state: 'artifact route aborted (**/*.pdf)',
        capabilitiesFound: capabilities.length,
        capabilitiesExpected: EXPECTED_CAPABILITIES.length,
        journeyStepsFound: journey.length,
        journeyStepsExpected: EXPECTED_JOURNEY.length,
        equivalentItemsFound: capabilities.length + journey.length,
        fallbackHeadingCount: await fallbackHeading.count(),
        fallbackBodyCount: await fallbackBody.count(),
        openActionCount: await open.count(),
        downloadActionCount: await download.count(),
      },
      detail: { url: HAOO.url, rule: 'SS-4', threat: 'T-05-45' },
    });

    // (3) The equivalent must not depend on the artifact it is the equivalent OF.
    expect(capabilities).toEqual(EXPECTED_CAPABILITIES.map(([title, body]) => [title, body]));
    expect(journey).toEqual(EXPECTED_JOURNEY.map(([title, body]) => [title, body]));
    expect(capabilities.length + journey.length).toBe(BROCHURE_EQUIVALENT_ITEMS);

    // (4) The recovery copy renders, and never replaces the controls.
    await expect(fallbackHeading).toBeVisible();
    await expect(fallbackBody).toBeVisible();
    await expect(open).toBeVisible();
    await expect(open).toBeEnabled();
    await expect(download).toBeVisible();
    await expect(download).toBeEnabled();
  });

  test('the three brochure references resolve to one and the same target', async ({ page }, testInfo) => {
    requireLive(testInfo);
    await openHaoo(page);

    const references = await brochureReferences(page);
    const resolved = [
      references.head?.resolved,
      references.open?.resolved,
      references.download?.resolved,
    ].filter((value): value is string => typeof value === 'string');

    /*
     * RESOLVED destinations, never raw attribute strings. The head-level pointer ships as the
     * relative `/brochure/HAOO-Marketing-Brochure.pdf` (pinned by `PDF_ALTERNATE_LINK` in
     * `src/test/build-output.test.ts:55`) while the two actions ship the same relative path, so a
     * raw string comparison would be comparing the page's own authoring style rather than its
     * target. The expected path is read from the closed primary-action list — P1 and P2 both
     * carry it — and resolved against the live document, so the built-tree assertion and this
     * live assertion cannot diverge into two different literals.
     */
    const expectedPath = assertNonEmptySubjects(
      [...new Set(
        PRIMARY_ACTIONS.filter((action) => action.id === 'P1' || action.id === 'P2')
          .flatMap((action) => [...action.destinations]),
      )],
      'the brochure destination carried by primary actions P1 and P2',
    );
    const expectedResolved = new URL(expectedPath[0] ?? '', page.url()).href;

    recordEvidence(NAME_EVIDENCE.equivalence, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        headRaw: references.head?.raw ?? '(absent)',
        headResolved: references.head?.resolved ?? '(absent)',
        openRaw: references.open?.raw ?? '(absent)',
        openResolved: references.open?.resolved ?? '(absent)',
        downloadRaw: references.download?.raw ?? '(absent)',
        downloadResolved: references.download?.resolved ?? '(absent)',
        distinctResolvedDestinations: [...new Set(resolved)],
        expectedResolvedFromPrimaryActions: expectedResolved,
      },
      detail: { url: HAOO.url, rule: 'SS-4', threat: 'T-05-46' },
    });

    expect(references.head, 'the head-level machine-discoverable pointer exists').not.toBeNull();
    expect(references.open, 'the open action exists').not.toBeNull();
    expect(references.download, 'the download action exists').not.toBeNull();
    expect(resolved).toHaveLength(3);

    // The three are asserted against ONE ANOTHER, not each against a literal.
    expect(new Set(resolved).size, `three references resolved to ${[...new Set(resolved)].join(', ')}`)
      .toBe(1);

    // And the one target they share is the one the closed primary-action list carries.
    expect(resolved[0]).toBe(expectedResolved);
  });
});
