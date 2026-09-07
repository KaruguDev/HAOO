import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { APPROVED_ANALYTICS_HOSTS } from '../config/approved-analytics-hosts';
import { AXE_TAGS, axeFor } from './fixtures/axe';
import { recordEvidence } from './fixtures/evidence';
import { OVERFLOW_TOLERANCE_PX, collectViewportEscapees } from './fixtures/overflow';
import { SURFACES } from './fixtures/surfaces';
import { VIEWPORTS } from './fixtures/viewports';

/**
 * The TRACER: one live HAOO surface measured end to end, now THROUGH the fixture layer.
 *
 * This spec exists to prove the whole evidence path before nine more specs are written on
 * top of it — a real Chromium reaches live production, an axe run executes against it, a
 * per-element overflow sweep measures one viewport, and every measured value lands in a
 * committed artefact. It deliberately measures rather than gates: the axe violation list is
 * recorded, not asserted against the D-OQ-1 `critical`/`serious` threshold, because no axe
 * run had ever been performed against this site and a baseline that fails on discovery
 * teaches nothing. Plan 05-14 owns the gating run.
 *
 * Plan 05-05 re-expressed it through `e2e/fixtures/`: the surface, the viewport, the axe
 * configuration, the overflow sweep and the evidence write all come from the shared layer now.
 * That is the point of the refactor — the fixture layer is PROVEN to carry the tracer's
 * behaviour rather than merely intended to. Every assertion below is unchanged in strength.
 *
 * Three of the assertions are load-bearing structural checks rather than product assertions,
 * and each closes a trap that is only observable once a real run exists: the
 * `navigator.webdriver` mechanism behind the test-traffic decision, the axe rule-composition
 * question (research open question A2), and the per-element overflow sweep that a
 * document-width comparison cannot substitute for.
 */

/** S1, from the closed list. The live HAOO document, at the site root. */
const SURFACE = SURFACES.S1;

/** The narrowest entry in the D-09 closed list, taken from the list rather than retyped. */
const VIEWPORT = VIEWPORTS[0];

/**
 * The single approved ingestion origin, read from the repository-owned trust anchor rather
 * than retyped. `config/approved-analytics-hosts.ts` is the module every production path is
 * forbidden from hardcoding, so the spec asserting nothing reaches it uses the same source.
 */
const INGESTION_ORIGINS = APPROVED_ANALYTICS_HOSTS.map((h) => h.origin);

/**
 * Where this run's record goes.
 *
 * NOT `evidence/tracer.json`. That file is the pre-refactor baseline written directly by the
 * 05-03 tracer, and it is the referent against which this refactor's "changed no measurement"
 * claim is checked. A refactor that overwrote its own baseline would leave the claim
 * unfalsifiable by construction, so the baseline is left byte-unchanged and this run records
 * beside it.
 */
const EVIDENCE_NAME = 'tracer-fixture-layer';

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

test.describe('TRACER — the live HAOO surface, measured end to end', () => {
  test.use({ viewport: { width: VIEWPORT.width, height: VIEWPORT.height } });

  test('measures live production: no ingestion traffic, a composed axe run, and no element overflow', async ({
    page,
  }, testInfo) => {
    // Guarded by project name rather than by a hard failure: the preview build has no
    // deployed production to measure, so this spec is not applicable there — it is not
    // failing there. The `preview` project runs the surface specs that ARE hermetic.
    test.skip(
      testInfo.project.name !== SURFACE.playwrightProject,
      'the tracer measures live production and has no referent against the preview build',
    );

    // A live network round trip plus three full axe analyses does not fit the 30s default.
    test.setTimeout(120_000);

    // 1. Record ingestion traffic BEFORE navigating — a listener registered after `goto`
    //    would miss exactly the requests it exists to catch.
    const ingestionRequests: string[] = [];
    page.on('request', (request) => {
      if (INGESTION_ORIGINS.some((origin) => request.url().startsWith(origin))) {
        ingestionRequests.push(request.url());
      }
    });

    // 2. Navigate to the live document, by the path the closed list declares.
    const response = await page.goto(SURFACE.path ?? SURFACE.url);
    expect(response?.status(), `unexpected status for ${SURFACE.url}`).toBe(200);

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

    // 6a. RESEARCH OPEN QUESTION A2, answered by measurement in BOTH orderings, and RE-MEASURED
    //     on every run rather than retired once answered.
    //
    //     The answer — replacement, last-call-wins — is the premise `e2e/fixtures/axe.ts` is
    //     built on: it is why that factory expresses its whole rule set through one `options()`
    //     call and why heading order is asserted by the semantics spec instead. A vendor upgrade
    //     that changed this composition behaviour would leave the factory correct but its
    //     recorded reason stale, and nothing else in the suite would notice. These two probes
    //     are the standing measurement of that premise. They use the raw builder deliberately:
    //     probing the composition rule is the one legitimate reason to chain these calls.
    const probeTagsThenRules = summarise(
      await new AxeBuilder({ page }).withTags([...AXE_TAGS]).withRules(['heading-order']).analyze(),
    );
    const probeRulesThenTags = summarise(
      await new AxeBuilder({ page }).withRules(['heading-order']).withTags([...AXE_TAGS]).analyze(),
    );
    const composesByUnion = probeTagsThenRules.tagCount >= 3 && probeTagsThenRules.headingOrderRan;

    // 6b. The conformance run, built by the shared factory.
    //
    //     `axeFor` expresses the whole rule set through a SINGLE `options({ runOnly })` call —
    //     the fallback RESEARCH Pattern 4 pre-specified for the replacement outcome 6a measures.
    //     The composition hazard now lives in one place with its reasoning at the branch, which
    //     is the substrate half of this plan: no call site can quietly differ from this one.
    const axeResults = await axeFor(page, SURFACE.id).analyze();

    const { ruleIds, tags: tagsReturned, tagCount: tagFamilies, headingOrderRan } = summarise(axeResults);

    expect(
      tagFamilies,
      `axe run narrowed: only ${ruleIds.length} rule(s) executed (${ruleIds.join(', ')}) ` +
        `spanning ${tagFamilies} tag(s) (${tagsReturned.join(', ')}). ` +
        'The conformance run is not covering the configured tag list.',
    ).toBeGreaterThanOrEqual(3);

    // 7. The per-element horizontal overflow sweep (VC-1b), through the shared helper.
    //
    //    A bare `document.documentElement.scrollWidth > clientWidth` comparison is NOT the
    //    check: both top-level wrappers ship `overflow-x-hidden`, so the mask absorbs real
    //    overflow and that comparison passes vacuously. It is a non-assertion wearing the
    //    costume of one. Only the per-element sweep measures it.
    const overflowEscapees = await collectViewportEscapees(page);

    expect(
      overflowEscapees,
      `elements overflow the ${VIEWPORT.width}px viewport: ${JSON.stringify(overflowEscapees, null, 2)}`,
    ).toEqual([]);

    // 8. Record every MEASURED VALUE — not pass marks — through the shared recorder, which
    //    refuses a record with no measured value at the writer. A count with no provenance is
    //    not evidence, so the resolved engine version and the exact tag list travel with it.
    recordEvidence(EVIDENCE_NAME, {
      surface: SURFACE.id,
      viewport: { width: VIEWPORT.width, height: VIEWPORT.height },
      measured: {
        webdriver,
        ingestionRequests,
        headingText,
        axeCoreVersion: axeResults.testEngine.version,
        ruleIds,
        ruleCount: ruleIds.length,
        tagsReturned,
        tagFamilies,
        headingOrderRan,
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
        overflowEscapees,
      },
      detail: {
        plan: '05-05',
        refactoredFrom: '05-03, whose direct-write baseline is evidence/tracer.json',
        project: testInfo.project.name,
        url: page.url(),
        surfaceLabel: SURFACE.label,
        viewportReason: VIEWPORT.reason,
        axeEngineName: axeResults.testEngine.name,
        tagsSent: [...AXE_TAGS],
        axeScope:
          'axeFor(page, "S1") — options({ runOnly: { type: "tag" } }), single call, no withTags/withRules, whole document',
        ingestionOrigins: INGESTION_ORIGINS,
        overflowToleranceCssPx: OVERFLOW_TOLERANCE_PX,

        /**
         * The answer to research open question A2, as measured in both orderings on THIS run.
         *
         * `composition: 'replacement'` means the tag list and the explicit rule list do NOT
         * union — the whole rule set must be expressed through one `runOnly` options call, and
         * `heading-order` (a `best-practice` rule the tag list excludes) needs a spec-authored
         * assertion instead. `e2e/fixtures/axe.ts` is built on that answer.
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
      },
    });
  });
});
