import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { APPROVED_ANALYTICS_HOSTS } from '../config/approved-analytics-hosts';

/**
 * The TRACER: one live HAOO surface measured end to end.
 *
 * This spec exists to prove the whole evidence path before nine more specs are written on
 * top of it — a real Chromium reaches live production, an axe run executes against it, a
 * per-element overflow sweep measures one viewport, and every measured value lands in a
 * committed artefact. It deliberately measures rather than gates: the axe violation list is
 * recorded, not asserted against the D-OQ-1 `critical`/`serious` threshold, because no axe
 * run had ever been performed against this site and a baseline that fails on discovery
 * teaches nothing. Plan 05-05 owns the gating run.
 *
 * Three of the assertions below are load-bearing structural checks rather than product
 * assertions, and each closes a trap that is only observable once a real run exists:
 * the `navigator.webdriver` mechanism behind the test-traffic decision, the axe
 * rule-composition question (research open question A2), and the per-element overflow sweep
 * that a document-width comparison cannot substitute for.
 */

/** The one published HAOO document, at the site root. Matches `PRODUCT_URL` in `src/test/build-output.test.ts`. */
const PRODUCT_URL = 'https://www.haoo.online/';

/**
 * The conformance target from UI-SPEC § axe Configuration. `best-practice` is excluded: it is
 * advisory, and including it would fail surfaces for recorded decisions rather than defects.
 */
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const;

/**
 * The single approved ingestion origin, read from the repository-owned trust anchor rather
 * than retyped. `config/approved-analytics-hosts.ts` is the module every production path is
 * forbidden from hardcoding, so the spec asserting nothing reaches it uses the same source.
 */
const INGESTION_ORIGINS = APPROVED_ANALYTICS_HOSTS.map((h) => h.origin);

/** Tolerance is exactly 1 CSS px for subpixel rounding. No larger tolerance, no epsilon elsewhere. */
const OVERFLOW_TOLERANCE_PX = 1;

const EVIDENCE_PATH = resolve(import.meta.dirname, '../evidence/tracer.json');

interface AxeRunSummary {
  readonly ruleIds: readonly string[];
  readonly ruleCount: number;
  readonly tags: readonly string[];
  readonly tagCount: number;
  readonly headingOrderRan: boolean;
}

/**
 * Reduce an axe result to the shape the A2 question is decided on.
 *
 * `passes`, `violations` and `incomplete` together are the set of rules that actually
 * EXECUTED — a rule that ran and found nothing appears only in `passes`, so reading
 * `violations` alone would report an empty run and a fully narrowed run identically.
 */
function summarise(results: {
  passes: { id: string; tags: string[] }[];
  violations: { id: string; tags: string[] }[];
  incomplete: { id: string; tags: string[] }[];
}): AxeRunSummary {
  const executed = [...results.passes, ...results.violations, ...results.incomplete];
  const ruleIds = [...new Set(executed.map((r) => r.id))].sort();
  const tags = [...new Set(executed.flatMap((r) => r.tags))].sort();
  return {
    ruleIds,
    ruleCount: ruleIds.length,
    tags,
    tagCount: tags.length,
    headingOrderRan: ruleIds.includes('heading-order'),
  };
}

interface OverflowEscapee {
  readonly tag: string;
  readonly id: string;
  readonly className: string;
  readonly left: number;
  readonly right: number;
  readonly innerWidth: number;
}

test.describe('TRACER — the live HAOO surface, measured end to end', () => {
  // A 360 px viewport is the narrowest entry in the D-09 closed list.
  test.use({ viewport: { width: 360, height: 800 } });

  test('measures live production: no ingestion traffic, a composed axe run, and no element overflow', async ({
    page,
  }, testInfo) => {
    // Guarded by project name rather than by a hard failure: the preview build has no
    // deployed production to measure, so this spec is not applicable there — it is not
    // failing there. The `preview` project runs the surface specs that ARE hermetic.
    test.skip(
      testInfo.project.name !== 'live',
      'the tracer measures live production and has no referent against the preview build',
    );

    // A live network round trip plus a full axe analysis does not fit the 30s default.
    test.setTimeout(90_000);

    // 1. Record ingestion traffic BEFORE navigating — a listener registered after `goto`
    //    would miss exactly the requests it exists to catch.
    const ingestionRequests: string[] = [];
    page.on('request', (request) => {
      if (INGESTION_ORIGINS.some((origin) => request.url().startsWith(origin))) {
        ingestionRequests.push(request.url());
      }
    });

    // 2. Navigate to the live document.
    const response = await page.goto('/');
    expect(response?.status(), `unexpected status for ${PRODUCT_URL}`).toBe(200);

    // 3. Assert the MECHANISM behind the test-traffic decision rather than trusting it.
    //    Research records `navigator.webdriver === true` under Playwright as an assumption
    //    (A1); the shipped `posthog-js` bot filter drops events on exactly this flag, so the
    //    whole suppression argument rests on it. Measured here, not assumed.
    const webdriver = await page.evaluate(() => navigator.webdriver);
    expect(webdriver, 'posthog-js drops bot events on this flag — the suppression rests on it').toBe(
      true,
    );

    // 4. Let the page settle, then assert nothing reached the analytics sink.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    expect(
      ingestionRequests,
      `automated traffic leaked to the analytics sink: ${ingestionRequests.join(', ')}`,
    ).toEqual([]);

    // 5. The page really loaded — a 404 shell has no populated <h1>.
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    const headingText = ((await heading.textContent()) ?? '').trim();
    expect(headingText.length, 'S1 rendered an empty <h1> — this is not the real document').toBeGreaterThan(0);

    // 6a. RESEARCH OPEN QUESTION A2, answered by measurement in BOTH orderings.
    //
    //     The vendor README's sentence naming `withRules` twice is ambiguous about whether
    //     `withTags` and `withRules` accumulate into one `runOnly` or the later call wins.
    //     The difference is not academic: if they replace, a builder written the obvious way
    //     runs ONE advisory rule while reporting itself as a full-conformance pass — the most
    //     dangerous shape a conformance check can take. Both orderings are run so the answer
    //     distinguishes "last call wins" from "withRules always wins", and both are recorded.
    const probeTagsThenRules = summarise(
      await new AxeBuilder({ page }).withTags([...AXE_TAGS]).withRules(['heading-order']).analyze(),
    );
    const probeRulesThenTags = summarise(
      await new AxeBuilder({ page }).withRules(['heading-order']).withTags([...AXE_TAGS]).analyze(),
    );
    const composesByUnion = probeTagsThenRules.tagCount >= 3 && probeTagsThenRules.headingOrderRan;

    // 6b. The conformance run.
    //
    //     Expressed as a SINGLE `options({ runOnly })` call, which is the fallback RESEARCH
    //     Pattern 4 pre-specified for the replacement outcome that 6a measured. `.options()`
    //     is never combined with `.withTags()` on the same builder — the README states it
    //     overrides, and 6a is the measured proof that such an override is silent.
    //
    //     Consequence this run inherits and hands on: `heading-order` is a `best-practice`
    //     rule, so the tag list alone does NOT run it. It cannot be re-added via `withRules`
    //     without reintroducing the replacement. Plan 05-05's axe factory must therefore
    //     carry a spec-authored heading-order assertion instead.
    const axeResults = await new AxeBuilder({ page })
      .options({ runOnly: { type: 'tag', values: [...AXE_TAGS] } })
      .analyze();

    const { ruleIds, tags: tagsReturned, tagCount: tagFamilies, headingOrderRan } = summarise(axeResults);

    expect(
      tagFamilies,
      `axe run narrowed: only ${ruleIds.length} rule(s) executed (${ruleIds.join(', ')}) ` +
        `spanning ${tagFamilies} tag(s) (${tagsReturned.join(', ')}). ` +
        'The conformance run is not covering the configured tag list.',
    ).toBeGreaterThanOrEqual(3);

    // 7. The per-element horizontal overflow sweep (VC-1b).
    //
    //    A bare `document.documentElement.scrollWidth > clientWidth` comparison is NOT
    //    written here as the whole check: both top-level wrappers ship `overflow-x-hidden`,
    //    so the mask absorbs real overflow and that comparison passes vacuously. It is a
    //    non-assertion wearing the costume of one. Only a per-element sweep measures it.
    const overflowEscapees = await page.evaluate<OverflowEscapee[], number>((tolerance) => {
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

    expect(
      overflowEscapees,
      `elements overflow the 360px viewport: ${JSON.stringify(overflowEscapees, null, 2)}`,
    ).toEqual([]);

    // 8. Record every MEASURED VALUE — not pass marks. A count with no provenance is not
    //    evidence, so the resolved engine version and the exact tag list travel with it.
    const viewport = page.viewportSize();
    const evidence = {
      generatedAt: new Date().toISOString(),
      plan: '05-03',
      project: testInfo.project.name,
      url: page.url(),
      viewport,
      webdriver,
      ingestionOrigins: INGESTION_ORIGINS,
      ingestionRequests,
      headingText,
      axeCoreVersion: axeResults.testEngine.version,
      axeEngineName: axeResults.testEngine.name,
      tagsSent: [...AXE_TAGS],
      axeScope: 'options({ runOnly: { type: "tag" } }) — single call, no withTags/withRules',
      ruleIds,
      ruleCount: ruleIds.length,
      tagsReturned,
      tagFamilies,
      headingOrderRan,

      /**
       * The answer to research open question A2, as measured in both orderings.
       *
       * `composition: 'replacement'` means the tag list and the explicit rule list do NOT
       * union — the whole rule set must be expressed through one `runOnly` options call, and
       * `heading-order` (a `best-practice` rule the tag list excludes) needs a spec-authored
       * assertion instead. Plan 05-05's axe factory inherits that requirement.
       */
      openQuestionA2: {
        question: 'Does withTags + withRules union, or does the later call replace the earlier?',
        composition: composesByUnion ? 'union' : 'replacement',
        mechanism:
          probeTagsThenRules.ruleCount === 1 && probeRulesThenTags.ruleCount > 1
            ? 'last-call-wins: each of withTags/withRules overwrites runOnly, so the call written second is the only one in effect'
            : 'see the two probes',
        probeTagsThenRules,
        probeRulesThenTags,
      },

      passCount: axeResults.passes.length,
      incompleteCount: axeResults.incomplete.length,
      violationCount: axeResults.violations.length,
      violations: axeResults.violations.map((v) => ({
        id: v.id,
        impact: v.impact ?? null,
        tags: v.tags,
        help: v.help,
        nodeCount: v.nodes.length,
        targets: v.nodes.map((n) => n.target.join(' ')),
      })),
      violationImpactCounts: axeResults.violations.reduce<Record<string, number>>((acc, v) => {
        const impact = v.impact ?? 'unknown';
        acc[impact] = (acc[impact] ?? 0) + 1;
        return acc;
      }, {}),
      overflowToleranceCssPx: OVERFLOW_TOLERANCE_PX,
      overflowEscapees,
    };

    mkdirSync(dirname(EVIDENCE_PATH), { recursive: true });
    writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  });
});
