import { expect, test, type Locator, type Page } from '@playwright/test';

import { PRODUCTS_REGION_SELECTOR } from './fixtures/axe';
import { recordEvidence } from './fixtures/evidence';
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
const OUTCOME = 'Run the business—not the paperwork.';

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
 * The desktop nav is `hidden … md:flex` (`ProductHeader.tsx:41`) so it is `display: none` below
 * `md`; the mobile nav carries the `hidden` ATTRIBUTE until the toggle is pressed and `md:hidden`
 * above it (`ProductHeader.tsx:64`). Each is therefore in the accessibility tree in exactly one
 * state. The honest contract, asserted below, is: across the three states the union of exposed
 * navigation names is exactly these two, they are distinct, and no state exposes more than one.
 * Measured on the live page 2026-09-12.
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

/** Drive the page into the empty-required-submit state. Nothing is sent: the form is `noValidate`. */
async function submitEmptyRequired(page: Page): Promise<void> {
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
  }) => {
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

  test('the error-summary state holds its level', async ({ page }) => {
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

  test('the aborted-artifact state holds its level', async ({ page }) => {
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

  test('one banner, one main, one contentinfo, and the closed region list', async ({ page }) => {
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
  }) => {
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

  test('the Products section is a named region its nav entry resolves to', async ({ page }) => {
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
