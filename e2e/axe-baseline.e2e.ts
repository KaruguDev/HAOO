import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { AXE_TAGS, axeDisablesFor, axeFor, type AxeRuleDisable } from './fixtures/axe';
import { SURFACES, type SurfaceId } from './fixtures/surfaces';
import { VIEWPORTS } from './fixtures/viewports';

/**
 * THE ACCESSIBILITY BASELINE — exploratory, non-gating, and deliberately early.
 *
 * **This spec records findings and asserts on none of them, and that is the point rather
 * than a weakness.** No axe run had ever been performed against either live site before
 * this phase. The shipped palette has never been measured for text contrast, and
 * `color-contrast` is `serious` — one of the two impacts owner decision D-OQ-1 makes
 * BLOCK the gate. A run that failed on its own discovery would produce no discovery: the
 * first blocking finding would abort the sweep, and every surface after it would stay
 * unmeasured. So this run measures two live public sites nobody has ever measured, writes
 * everything the engine returned, and leaves the deciding to the classification and the
 * fixing to plan 05-14 — which still has a wave in which to do it.
 *
 * The assertions that ARE here are assertions about the METHOD, never about the findings:
 * that the page under measurement is the page named, that the state named was actually
 * reached, and — on the live project — that no request ever left for the lead endpoint.
 * A scan of the wrong document or of the wrong state is not a lenient measurement; it is
 * a false one, and it would be recorded with the same provenance as a true one.
 *
 * **Every scan is built by `axeFor`. No builder is constructed locally in this file.** The tag
 * list, the per-URL disables and the Products-region inclusion scope live at one branch in
 * `e2e/fixtures/axe.ts`, with the composition hazard 05-03 measured (`withTags` and
 * `withRules` REPLACE rather than union) reasoned out at that branch. Eleven scans built
 * eleven ways would be eleven chances for one of them to silently narrow to a single
 * advisory rule and report itself as a full-conformance pass.
 *
 * **State coverage is the substance of this plan, not a refinement of it.** The UI-SPEC's
 * axe § requires each surface to be scanned in the default state AND in every state the
 * harness reaches, because the conditional error, confirmation and fallback subtrees are
 * exactly the markup a default-state scan never renders. Four live HAOO states, the
 * Products region, both readings of the retired-path document and four preview-only form
 * states are eleven entries; a default-state-only sweep would have been four.
 */

/** The four impacts, in the order the classified record's table columns use. */
const IMPACTS = ['critical', 'serious', 'moderate', 'minor'] as const;

type Impact = (typeof IMPACTS)[number];

/** The narrowest entry in the D-09 closed list, taken from the list rather than retyped. */
const NARROW_VIEWPORT = VIEWPORTS[0];

/**
 * Where this baseline lands. One file, one entry per surface-and-state.
 *
 * **Not written through `recordEvidence`, and the reason is shape rather than
 * disagreement.** That recorder's envelope is `{ surface, viewport, measured, detail }` —
 * one measurement per record, with its provenance in a side channel. This plan's contract
 * (05-07 acceptance criteria and its `<verify>`) is a FLAT entry whose engine version, tag
 * list, URL, state name and timestamp sit at the top level beside the violation set,
 * because a reader of one entry must be able to see the run that produced it without
 * unwrapping anything. The two shapes cannot both be true of one file.
 *
 * The discipline the recorder enforces at the writer is preserved here structurally: an
 * entry carries no verdict field at all. Every value below is a count, an array, or a
 * string read from the engine or from the shared configuration — there is no field a pass
 * mark could be written into.
 */
const EVIDENCE_DIR = resolve(import.meta.dirname, '../evidence');
const BASELINE_PATH = resolve(EVIDENCE_DIR, 'axe-baseline.json');

interface BaselineNode {
  readonly target: string;
  readonly failureSummary: string | null;
  readonly html: string;
}

interface BaselineIssue {
  readonly id: string;
  readonly impact: string | null;
  readonly help: string;
  readonly helpUrl: string;
  readonly tags: readonly string[];
  readonly nodeCount: number;
  readonly nodes: readonly BaselineNode[];
}

interface BaselineEntry {
  readonly surface: SurfaceId;
  readonly surfaceLabel: string;
  /** The state name. With `surface`, the upsert key. */
  readonly state: string;
  /** What was done to reach that state, in words, so the name cannot drift from the method. */
  readonly stateDescription: string;
  readonly url: string;
  /** ISO-8601, UTC. */
  readonly timestamp: string;
  readonly project: string;
  readonly engine: string;
  readonly engineVersion: string;
  readonly tags: readonly string[];
  readonly disabledRules: readonly AxeRuleDisable[];
  readonly analysisScope: string;
  readonly viewport: { readonly width: number; readonly height: number } | null;
  readonly javaScriptEnabled: boolean;
  /**
   * Whether the DOCUMENT ITSELF was rewritten before the browser parsed it. Exactly one
   * entry in this file is `true`: the retired-path reading with its refresh directive
   * stripped. Inducing an application state through a routed response or a runtime hook is
   * NOT a modified page — the markup under measurement is the markup as shipped — and
   * conflating the two would let a rewritten document pass as an as-served reading.
   */
  readonly modifiedPage: boolean;
  /** Everything done to the environment to reach this state. `[]` means nothing was. */
  readonly interventions: readonly string[];
  /**
   * The rule accounting: what the tags SELECTED, what APPLIED, and what found nothing to apply to.
   *
   * axe runs every selected rule, but a rule whose selector matches no element on the page
   * lands in `inapplicable`, not in `passes`. So a count of "rules in passes, violations and
   * incomplete" is a count of APPLICABLE rules, and it varies legitimately with the markup in
   * scope — a three-paragraph document has no form controls for `label` to check. On its own
   * that number cannot tell "this surface has fewer applicable rules" apart from "this run was
   * narrowed to fewer rules", and T-05-29 is exactly the second.
   *
   * The two are told apart here by accounting rather than by judgment. `selectedRuleIds` is
   * what the engine instance that ran would select under this configuration, computed with the
   * engine's own selection semantics (`matchTags` / `ruleShouldRun` in axe-core 4.13.0):
   *
   *   rules carrying any sent tag                      -> `tagMatchedRuleCount`
   *   minus the engine's default tag exclusion          -> `tagExcludedRuleIds`
   *   minus page-level rules, when the context is a
   *     region rather than the page                    -> `pageLevelRuleIdsOutOfScope`
   *   minus any per-URL disable                        -> `disabledRulesWithinTags`
   *
   * and every selected rule must appear in exactly one of `applicableRuleIds` or
   * `inapplicableRuleIds`. A narrowed run cannot satisfy that sum; a surface with little markup
   * satisfies it with a large inapplicable list.
   */
  readonly tagMatchedRuleCount: number;
  /**
   * Rules that carry a sent tag but that axe holds back by default because they are also
   * tagged `experimental` or `deprecated`. Recorded by id so a reader can see which WCAG-tagged
   * checks this baseline did NOT perform, rather than inferring it from a count.
   */
  readonly tagExcludedRuleIds: readonly string[];
  /**
   * Page-level rules (`bypass` among them) that axe does not run when the analysis context is
   * a region rather than the whole page. Non-empty only for S3, where it is D-OQ-3's scope made
   * visible: `bypass` is not suppressed there, it is outside the question asked.
   */
  readonly pageLevelRuleIdsOutOfScope: readonly string[];
  readonly selectedRuleIds: readonly string[];
  readonly selectedRuleCount: number;
  /**
   * Per-URL disables that fall INSIDE the tag selection. `[]` is the measured confirmation that
   * the S4 disables are already excluded by the tag list, as `fixtures/axe.ts` claims.
   */
  readonly disabledRulesWithinTags: readonly string[];
  /** Rules that matched at least one node: the union of passes, violations and incomplete. */
  readonly applicableRuleIds: readonly string[];
  readonly applicableRuleCount: number;
  /** Rules that ran and matched no node in the analysis scope. */
  readonly inapplicableRuleIds: readonly string[];
  readonly inapplicableRuleCount: number;
  /** The tag families the applicable rules spanned. */
  readonly tagsReturned: readonly string[];
  readonly tagFamilyCount: number;
  readonly violationCount: number;
  readonly incompleteCount: number;
  readonly passCount: number;
  /** All four impacts, always, including zeros. A zero is a measurement. */
  readonly impactCounts: Readonly<Record<Impact | 'unknown', number>>;
  readonly violations: readonly BaselineIssue[];
  readonly incomplete: readonly BaselineIssue[];
}

/** axe node targets nest (frame paths are arrays of arrays). Flatten to one readable string. */
function targetToString(target: unknown): string {
  if (Array.isArray(target)) {
    return target.map((part) => targetToString(part)).join(' ');
  }

  return String(target);
}

function toBaselineIssue(issue: {
  id: string;
  impact?: string | null;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: { target: unknown; failureSummary?: string; html: string }[];
}): BaselineIssue {
  return {
    id: issue.id,
    impact: issue.impact ?? null,
    help: issue.help,
    helpUrl: issue.helpUrl,
    tags: issue.tags,
    nodeCount: issue.nodes.length,
    nodes: issue.nodes.map((node) => ({
      target: targetToString(node.target),
      failureSummary: node.failureSummary ?? null,
      html: node.html,
    })),
  };
}

interface RuleAccounting {
  readonly applicableRuleIds: readonly string[];
  readonly inapplicableRuleIds: readonly string[];
  readonly tagsReturned: readonly string[];
}

/**
 * Split the run's rules into the ones that applied and the ones that found nothing to apply to.
 *
 * Applicable is the union of `passes`, `violations` and `incomplete`, because a rule that
 * applied and found nothing wrong appears only in `passes`. Reading `violations` alone would
 * report an empty run and a fully narrowed run identically.
 */
function accountRules(results: {
  passes: { id: string; tags: string[] }[];
  violations: { id: string; tags: string[] }[];
  incomplete: { id: string; tags: string[] }[];
  inapplicable: { id: string }[];
}): RuleAccounting {
  const applicable = [...results.passes, ...results.violations, ...results.incomplete];

  return {
    applicableRuleIds: [...new Set(applicable.map((rule) => rule.id))].sort(),
    inapplicableRuleIds: [...new Set(results.inapplicable.map((rule) => rule.id))].sort(),
    tagsReturned: [...new Set(applicable.flatMap((rule) => rule.tags))].sort(),
  };
}

interface EngineSelection {
  readonly tagMatchedRuleIds: readonly string[];
  readonly tagExcludedRuleIds: readonly string[];
  readonly pageLevelRuleIdsOutOfScope: readonly string[];
  /** What the engine selects from the tags and scope, before any per-URL disable. */
  readonly selectedBeforeDisables: readonly string[];
}

/**
 * The rules this configuration selects, asked of the axe instance that just ran in this page.
 *
 * Mirrors axe-core 4.13.0's own selection (`matchTags` and `ruleShouldRun`), because the first
 * version of this accounting used the public `axe.getRules(tags)` and was wrong in a measurable
 * way: that call lists every rule carrying a tag, including the seven the engine holds back as
 * `experimental` or `deprecated`, so the accounting reported a correct run as narrowed. The
 * engine's selection is: a rule carrying any sent tag, unless it also carries a tag in the
 * engine's default exclusion list that the sent tags do not name; and not a page-level rule
 * when the context is a region rather than the page. `target-size` is `enabled: false` by
 * default yet DOES run, because an explicit tag match overrides that flag — so `enabled` is
 * deliberately not consulted here.
 *
 * `tagExclude` and each rule's `pageLevel` flag exist only on the engine's internal `_audit`
 * object. Reading private state is accepted here because it is the only place the engine keeps
 * them; if a vendor upgrade moves them, this throws rather than accounting against a guess.
 *
 * Read from the page rather than from a Node-side `axe-core` import: `axe-core` is only a
 * transitive dependency here, and the instance `AxeBuilder` injected is the one whose selection
 * is being accounted for. `@axe-core/playwright` leaves `window.axe` in the analysed page on its
 * `runPartial` path.
 */
async function engineSelectionFor(page: Page, scopedToRegion: boolean): Promise<EngineSelection> {
  return page.evaluate(
    ({ tags, scoped }) => {
      interface EngineRule {
        id: string;
        tags: string[];
        pageLevel?: boolean;
      }
      const audit = (
        window as unknown as { axe?: { _audit?: { rules?: EngineRule[]; tagExclude?: string[] } } }
      ).axe?._audit;
      if (audit === undefined || !Array.isArray(audit.rules) || !Array.isArray(audit.tagExclude)) {
        throw new Error(
          'axe._audit.rules / axe._audit.tagExclude are absent after analyze(); the rule ' +
            'selection cannot be accounted for against this engine version',
        );
      }

      const exclude = audit.tagExclude.filter((tag) => !tags.includes(tag));
      const carriesAny = (rule: EngineRule, list: readonly string[]): boolean =>
        list.some((tag) => rule.tags.includes(tag));
      const ids = (rules: readonly EngineRule[]): string[] => rules.map((rule) => rule.id).sort();

      const matched = audit.rules.filter((rule) => carriesAny(rule, tags));
      const tagExcluded = matched.filter((rule) => carriesAny(rule, exclude));
      const afterTags = matched.filter((rule) => !carriesAny(rule, exclude));
      const pageLevelOut = scoped ? afterTags.filter((rule) => rule.pageLevel === true) : [];
      const selected = afterTags.filter((rule) => !(scoped && rule.pageLevel === true));

      return {
        tagMatchedRuleIds: ids(matched),
        tagExcludedRuleIds: ids(tagExcluded),
        pageLevelRuleIdsOutOfScope: ids(pageLevelOut),
        selectedBeforeDisables: ids(selected),
      };
    },
    { tags: [...AXE_TAGS] as string[], scoped: scopedToRegion },
  );
}

function countImpacts(
  issues: readonly BaselineIssue[],
): Readonly<Record<Impact | 'unknown', number>> {
  // Seeded with every impact at zero rather than accumulated from what was found. A key
  // that appears only when it is non-zero turns "measured and found none" into "not
  // measured", which is the distinction the whole evidence discipline rests on.
  const counts: Record<Impact | 'unknown', number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    unknown: 0,
  };

  for (const issue of issues) {
    const impact = issue.impact;
    if (impact !== null && (IMPACTS as readonly string[]).includes(impact)) {
      counts[impact as Impact] += 1;
    } else {
      counts.unknown += 1;
    }
  }

  return counts;
}

function readBaseline(): BaselineEntry[] {
  let raw: string;
  try {
    raw = readFileSync(BASELINE_PATH, 'utf8');
  } catch {
    return [];
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(
      'evidence/axe-baseline.json is not an array of entries. Refusing to append to it ' +
        'rather than silently rewriting a measurement somebody else made.',
    );
  }

  return parsed as BaselineEntry[];
}

/**
 * Append this entry, replacing any earlier entry for the same surface AND state.
 *
 * **Upsert rather than blind append, and the reason is an assertion this plan makes about
 * itself.** The live and preview projects are two separate processes writing one file, so
 * the writer must accumulate across them. But this plan asserts that EXACTLY ONE entry is
 * a modified-page measurement, and that the eleven entries cover eleven distinct
 * surface-and-state questions. A blind append would make a second run of the live project
 * produce two retired-path-stripped entries and break that assertion — turning a re-run,
 * which is a re-measurement of the same question, into apparent duplicate coverage.
 *
 * The superseded reading is not lost: `evidence/` is committed, so the previous run's
 * entry is in git history with the run that produced it.
 */
function upsertEntry(entry: BaselineEntry): void {
  const entries = readBaseline().filter(
    (existing) => !(existing.surface === entry.surface && existing.state === entry.state),
  );

  entries.push(entry);
  entries.sort((a, b) =>
    a.surface === b.surface ? a.state.localeCompare(b.state) : a.surface.localeCompare(b.surface),
  );

  mkdirSync(EVIDENCE_DIR, { recursive: true });
  writeFileSync(BASELINE_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

interface ScanRequest {
  readonly surface: SurfaceId;
  readonly state: string;
  readonly stateDescription: string;
  readonly analysisScope: string;
  readonly modifiedPage?: boolean;
  readonly interventions?: readonly string[];
  readonly javaScriptEnabled?: boolean;
}

/**
 * Run the configured scan and record the complete result. Asserts nothing about findings.
 *
 * Returns the entry so a caller can log its counts; no caller compares them to a threshold.
 */
async function scanAndRecord(
  page: Page,
  testInfo: TestInfo,
  request: ScanRequest,
): Promise<BaselineEntry> {
  const surface = SURFACES[request.surface];
  const results = await axeFor(page, request.surface).analyze();

  const violations = results.violations.map(toBaselineIssue);
  const incomplete = results.incomplete.map(toBaselineIssue);
  const accounting = accountRules(results);
  const viewport = page.viewportSize();

  const disabledRuleIds = new Set(axeDisablesFor(request.surface).map((disable) => disable.rule));
  // S3 is the one surface `axeFor` scopes by `.include()`; every other scan is the whole page.
  const selection = await engineSelectionFor(page, request.surface === 'S3');
  const disabledRulesWithinTags = selection.tagMatchedRuleIds.filter((rule) =>
    disabledRuleIds.has(rule),
  );
  const selectedRuleIds = selection.selectedBeforeDisables.filter(
    (rule) => !disabledRuleIds.has(rule),
  );

  /*
   * A METHOD assertion, not a findings assertion: every rule the configuration selected must
   * be accounted for as applicable or inapplicable, and nothing outside the selection may have
   * run. This is what turns T-05-29 from something a reader must notice in the record into
   * something the run refuses to write. It says nothing about whether any rule found anything.
   */
  const accounted = [...accounting.applicableRuleIds, ...accounting.inapplicableRuleIds].sort();
  expect(
    accounted,
    `${request.surface}/${request.state}: the rules that ran are not the rules the tags select — ` +
      'the scan was narrowed or widened',
  ).toEqual(selectedRuleIds);

  const entry: BaselineEntry = {
    surface: request.surface,
    surfaceLabel: surface.label,
    state: request.state,
    stateDescription: request.stateDescription,
    url: page.url(),
    timestamp: new Date().toISOString(),
    project: testInfo.project.name,
    engine: results.testEngine.name,
    engineVersion: results.testEngine.version,
    tags: [...AXE_TAGS],
    disabledRules: axeDisablesFor(request.surface),
    analysisScope: request.analysisScope,
    viewport: viewport === null ? null : { width: viewport.width, height: viewport.height },
    javaScriptEnabled: request.javaScriptEnabled ?? surface.javaScriptEnabled,
    modifiedPage: request.modifiedPage ?? false,
    interventions: request.interventions ?? [],
    tagMatchedRuleCount: selection.tagMatchedRuleIds.length,
    tagExcludedRuleIds: selection.tagExcludedRuleIds,
    pageLevelRuleIdsOutOfScope: selection.pageLevelRuleIdsOutOfScope,
    selectedRuleIds,
    selectedRuleCount: selectedRuleIds.length,
    disabledRulesWithinTags,
    applicableRuleIds: accounting.applicableRuleIds,
    applicableRuleCount: accounting.applicableRuleIds.length,
    inapplicableRuleIds: accounting.inapplicableRuleIds,
    inapplicableRuleCount: accounting.inapplicableRuleIds.length,
    tagsReturned: accounting.tagsReturned,
    tagFamilyCount: accounting.tagsReturned.length,
    violationCount: violations.length,
    incompleteCount: incomplete.length,
    passCount: results.passes.length,
    impactCounts: countImpacts(violations),
    violations,
    incomplete,
  };

  upsertEntry(entry);

  // The measured counts, on the run's own console. A blocking finding discovered here is
  // the plan's product, so it is visible without opening the artefact.
  console.log(
    `[axe-baseline] ${entry.surface}/${entry.state}: ${entry.violationCount} violation(s) ` +
      `(critical ${entry.impactCounts.critical}, serious ${entry.impactCounts.serious}, ` +
      `moderate ${entry.impactCounts.moderate}, minor ${entry.impactCounts.minor}), ` +
      `${entry.incompleteCount} incomplete, ${entry.applicableRuleCount} applicable + ` +
      `${entry.inapplicableRuleCount} inapplicable of ${entry.selectedRuleCount} selected rules, ` +
      `axe-core ${entry.engineVersion}`,
  );

  return entry;
}

/** Three full axe analyses over a live network are not a 30-second job. */
const SCAN_TIMEOUT_MS = 180_000;

/**
 * Confine a scan to the project that can reach its surface, and give it a live-network
 * budget.
 *
 * A skip rather than a failure: the preview build has no deployed production to measure and
 * production must never be driven into the destructive form states, so a scan run against
 * the wrong project is not applicable there — it is not failing there.
 */
function requireProject(testInfo: TestInfo, project: 'live' | 'preview'): void {
  test.skip(
    testInfo.project.name !== project,
    `this scan is only meaningful against the '${project}' project`,
  );
  test.setTimeout(SCAN_TIMEOUT_MS);
}

/* ------------------------------------------------------------------------------------ *
 * LIVE PROJECT — S1 in four states, S3's Products region, and S4 read twice.
 * ------------------------------------------------------------------------------------ */

test.describe('axe baseline — live surfaces at the default desktop viewport', () => {
  test('S1 — default state', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

    const response = await page.goto(SURFACES.S1.path ?? SURFACES.S1.url);
    expect(response?.status(), `unexpected status for ${SURFACES.S1.url}`).toBe(200);
    await page.waitForLoadState('networkidle');

    // The document really rendered. A 404 shell has no populated <h1>, and scanning one
    // would record a clean baseline for a page that is not the page under test.
    await expect(page.locator('h1').first()).toBeVisible();

    await scanAndRecord(page, testInfo, {
      surface: 'S1',
      state: 'default',
      stateDescription: 'The document as served, with nothing activated.',
      analysisScope: 'whole document',
    });
  });

  test('S1 — measurement disclosure expanded', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

    await page.goto(SURFACES.S1.path ?? SURFACES.S1.url);
    await page.waitForLoadState('networkidle');

    // The <details> subtree is ~40 elements of copy, five labelled sections and a button
    // that the default state never renders into the accessibility tree at all.
    const disclosure = page.locator('details').first();
    await disclosure.locator('summary').click();
    await expect(disclosure).toHaveAttribute('open', '');

    await scanAndRecord(page, testInfo, {
      surface: 'S1',
      state: 'disclosure-expanded',
      stateDescription:
        'The measurement disclosure <details> opened by activating its <summary>, which ' +
        'renders the five labelled sections and the clear-context control.',
      analysisScope: 'whole document',
      interventions: ['activated the measurement disclosure summary control'],
    });
  });

  test('S1 — error summary present', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

    /*
     * The one live state that touches the lead form, and the guard is doubled because the
     * cost of being wrong is a real enquiry in the owner's mailbox.
     *
     * Validation is client-side and `noValidate` is set, so an empty submit issues no
     * request at all — that is why FS-0 permits this state live. The route abort below is
     * belt-and-braces against that reasoning being wrong, and the observed request list is
     * recorded as a measured value rather than asserted away silently.
     */
    const endpointRequests: string[] = [];
    page.on('request', (request) => {
      if (/formsubmit\.co/.test(request.url())) {
        endpointRequests.push(request.url());
      }
    });
    await page.route(/formsubmit\.co/, (route) => route.abort('blockedbyclient'));

    await page.goto(SURFACES.S1.path ?? SURFACES.S1.url);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Send my details' }).click();
    await expect(page.getByText('There is a problem')).toBeVisible();

    const entry = await scanAndRecord(page, testInfo, {
      surface: 'S1',
      state: 'error-summary',
      stateDescription:
        'The qualification form submitted with every required field empty, rendering the ' +
        'error summary inside its role="alert" and the per-field messages.',
      analysisScope: 'whole document',
      interventions: [
        'submitted the qualification form with empty required fields',
        'routed formsubmit.co to abort as a production-safety guard',
      ],
    });

    // Not an accessibility assertion: an assertion that this scan cost the owner nothing.
    expect(
      endpointRequests,
      `a live submission left for the lead endpoint: ${endpointRequests.join(', ')}`,
    ).toEqual([]);
    expect(entry.violations.length).toBeGreaterThanOrEqual(0);
  });

  test('S3 — ZERO-PAPER HUB Products region', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

    const response = await page.goto(SURFACES.S3.url);
    expect(response?.status(), `unexpected status for ${SURFACES.S3.url}`).toBe(200);
    await page.waitForLoadState('networkidle');

    /*
     * Scrolled into view deliberately. That page reveals its sections through an
     * IntersectionObserver, from `opacity-0` to `opacity-100`. Scanning it unscrolled would
     * measure a fully transparent subtree, and axe reports contrast on transparent text as
     * INCOMPLETE rather than as a finding — a scan that quietly measured nothing.
     */
    const products = page.locator('#products');
    await products.scrollIntoViewIfNeeded();
    await expect(products).toBeVisible();
    await page.waitForTimeout(1500);

    await scanAndRecord(page, testInfo, {
      surface: 'S3',
      state: 'products-region',
      stateDescription:
        'The Products section scrolled into view so its reveal transition has completed.',
      analysisScope:
        'include(#products) — the Products region only, never the document (D-OQ-3 expressed mechanically)',
      interventions: ['scrolled the Products region into view to complete its reveal transition'],
    });
  });

  test('S4 — retired-path document as served', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

    /*
     * The document ships `<meta http-equiv="refresh" content="0; url=https://www.haoo.online/">`.
     * At zero seconds there is no window in which to run an analysis, and `javaScriptEnabled:
     * false` does not help — meta refresh is a parser directive, not script (RESEARCH Pitfall 8).
     *
     * So the DESTINATION is blocked rather than the document rewritten. The refresh fires,
     * its navigation fails, and the browser stays on the document exactly as the server sent
     * it — byte-unmodified, which is why this entry is NOT a modified-page measurement. The
     * exact-URL route matches only the refresh target; the favicon this document loads from
     * the same host is untouched.
     */
    await page.route('https://www.haoo.online/', (route) => route.abort('aborted'));

    try {
      await page.goto(SURFACES.S4.url, { waitUntil: 'domcontentloaded' });
    } catch {
      // The refresh can interrupt the navigation `goto` is awaiting. The URL check below
      // is the real proof that the document under measurement is the right one.
    }
    await page.waitForTimeout(2000);

    expect(page.url(), 'the refresh carried the browser away from the document under test').toContain(
      '/products/haoo/',
    );

    await scanAndRecord(page, testInfo, {
      surface: 'S4',
      state: 'as-served',
      stateDescription:
        'The document exactly as the server sent it. The zero-second meta refresh fired ' +
        'and its navigation was aborted, so the parsed document is unmodified.',
      analysisScope: 'whole document',
      modifiedPage: false,
      interventions: [
        'aborted the refresh destination navigation to https://www.haoo.online/ so the served document stayed in the browser',
      ],
    });
  });

  test('S4 — retired-path document with the refresh directive stripped', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

    /*
     * RESEARCH Pattern 2: intercept the document response and remove the tag before the
     * parser sees it. This IS a modified-page measurement — the only one in this file — and
     * it is recorded as such so it can never be read as the as-served reading above.
     */
    await page.route(SURFACES.S4.url, async (route) => {
      const response = await route.fetch();
      const html = await response.text();
      await route.fulfill({
        response,
        body: html.replace(/<meta\s+http-equiv=["']refresh["'][^>]*>/i, ''),
      });
    });

    await page.goto(SURFACES.S4.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // If the strip failed the browser is on haoo.online by now. This assertion is what
    // makes the modified-page claim checkable rather than asserted.
    expect(page.url(), 'the refresh was not neutralised — the strip did not match').toContain(
      '/products/haoo/',
    );

    await scanAndRecord(page, testInfo, {
      surface: 'S4',
      state: 'refresh-stripped',
      stateDescription:
        'The same document with its <meta http-equiv="refresh"> removed from the response ' +
        'body before parsing, so the visible recovery content stays on screen.',
      analysisScope: 'whole document',
      modifiedPage: true,
      interventions: [
        'rewrote the response body to remove the meta refresh directive (RESEARCH Pattern 2)',
      ],
    });
  });
});

test.describe('axe baseline — the live HAOO page with the mobile navigation open', () => {
  test.use({ viewport: { width: NARROW_VIEWPORT.width, height: NARROW_VIEWPORT.height } });

  test('S1 — mobile navigation open at 360px', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

    await page.goto(SURFACES.S1.path ?? SURFACES.S1.url);
    await page.waitForLoadState('networkidle');

    // The toggle is the only header control carrying aria-expanded, and the panel it
    // controls is `hidden` until it is activated — so this subtree is unreachable at any
    // width where the toggle does not render.
    const toggle = page.locator('header button[aria-expanded]');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await scanAndRecord(page, testInfo, {
      surface: 'S1',
      state: 'mobile-nav-open',
      stateDescription:
        `The mobile navigation panel opened at ${NARROW_VIEWPORT.width}px by activating the ` +
        'header toggle, which unhides the second navigation landmark and its five links.',
      analysisScope: 'whole document',
      interventions: [
        `set the viewport to ${NARROW_VIEWPORT.width}x${NARROW_VIEWPORT.height} (${NARROW_VIEWPORT.reason})`,
        'activated the navigation toggle',
      ],
    });
  });
});

/* ------------------------------------------------------------------------------------ *
 * PREVIEW PROJECT — the four form states FS-0 forbids exercising against production.
 * ------------------------------------------------------------------------------------ */

/** The lead endpoint, matched by host so an env-configured path cannot slip past. */
const ENDPOINT_PATTERN = /formsubmit\.co/;

/**
 * Fill every visible control in the qualification form with values that pass validation.
 *
 * Reads the option values out of the DOM rather than importing the product module: the
 * closed option lists are compile-time data, and a spec that retyped them would drift from
 * the shipped page without either copy noticing.
 */
async function fillQualifyForm(page: Page): Promise<void> {
  const form = page.locator('form');
  await expect(form).toBeVisible();

  // The honeypot input is the one `tabindex="-1"` control and must stay empty — filling it
  // is what a bot does, and the provider drops the submission.
  const inputs = form.locator('input:not([tabindex="-1"])');
  const inputCount = await inputs.count();
  for (let index = 0; index < inputCount; index += 1) {
    const input = inputs.nth(index);
    const type = (await input.getAttribute('type')) ?? 'text';
    const value =
      type === 'email'
        ? 'phase05.baseline@example.com'
        : type === 'tel'
          ? '+254 700 000 000'
          : 'Phase 05 baseline';
    await input.fill(value);
  }

  const selects = form.locator('select');
  const selectCount = await selects.count();
  for (let index = 0; index < selectCount; index += 1) {
    const select = selects.nth(index);
    const values: string[] = await select
      .locator('option')
      .evaluateAll((options) =>
        options
          .map((option) => (option as HTMLOptionElement).value)
          .filter((value) => value !== ''),
      );
    expect(values.length, 'a closed option list rendered no selectable option').toBeGreaterThan(0);
    await select.selectOption(values[0]);
  }

  const textareas = form.locator('textarea');
  const textareaCount = await textareas.count();
  for (let index = 0; index < textareaCount; index += 1) {
    await textareas.nth(index).fill('Recorded by the Phase 5 accessibility baseline sweep.');
  }
}

async function submitQualifyForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Send my details' }).click();
}

test.describe('axe baseline — the preview mirror in the four states production forbids', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // UI-SPEC FS-0: these four states are exercised against the local preview build only.
    // A failure state driven against live production would deliver a real lead.
    requireProject(testInfo, 'preview');
    await page.goto(SURFACES.S5.path ?? SURFACES.S5.url);
    await page.waitForLoadState('networkidle');
  });

  test('S5 — in-flight', async ({ page }, testInfo) => {
    // The request is held open for the duration of the scan. Every field control is
    // `disabled` in this state and the submit button is relabelled — an aria surface the
    // default state never presents.
    let release: () => void = () => {};
    const held = new Promise<void>((resolve_) => {
      release = resolve_;
    });

    await page.route(ENDPOINT_PATTERN, async (route) => {
      await held;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"success":"true"}',
      });
    });

    try {
      await fillQualifyForm(page);
      await submitQualifyForm(page);
      await expect(page.getByRole('button', { name: 'Sending…' })).toBeVisible();

      await scanAndRecord(page, testInfo, {
        surface: 'S5',
        state: 'in-flight',
        stateDescription:
          'A valid submission held open: the submit control is disabled and relabelled ' +
          '"Sending…", every field control is disabled, and the status region announces.',
        analysisScope: 'whole document',
        interventions: [
          'routed the lead endpoint to a response held open for the duration of the scan',
          'filled and submitted the qualification form with valid values',
        ],
      });
    } finally {
      release();
    }
  });

  test('S5 — success', async ({ page }, testInfo) => {
    await page.route(ENDPOINT_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":"true"}' }),
    );

    await fillQualifyForm(page);
    await submitQualifyForm(page);
    await expect(page.getByRole('heading', { name: 'Your details are on their way' })).toBeVisible();

    await scanAndRecord(page, testInfo, {
      surface: 'S5',
      state: 'success',
      stateDescription:
        'The form subtree replaced by the confirmation card, whose <h3> is script-focused ' +
        'and whose two contact links exist in no other state.',
      analysisScope: 'whole document',
      interventions: [
        'routed the lead endpoint to a 200 response',
        'filled and submitted the qualification form with valid values',
      ],
    });
  });

  test('S5 — transport failure', async ({ page }, testInfo) => {
    await page.route(ENDPOINT_PATTERN, (route) => route.abort('failed'));

    await fillQualifyForm(page);
    await submitQualifyForm(page);
    await expect(
      page.getByRole('heading', { name: "We couldn't send your details" }),
    ).toBeVisible();

    await scanAndRecord(page, testInfo, {
      surface: 'S5',
      state: 'transport-failure',
      stateDescription:
        'The recovery panel mounted below a form that stays mounted and editable: a ' +
        'script-focused <h3>, a retry control, and three direct-contact links.',
      analysisScope: 'whole document',
      interventions: [
        'routed the lead endpoint to an aborted request',
        'filled and submitted the qualification form with valid values',
      ],
    });
  });

  test('S5 — blocked', async ({ page }, testInfo) => {
    /*
     * A blocked submission is one this page refused to START: the request body could not be
     * assembled, so no request was made and no provider round-trip happened. It renders the
     * same recovery panel as a transport failure with DIFFERENT copy and, deliberately, NO
     * retry control — so its accessibility surface is not the failure state's.
     *
     * The only way in is to make body serialisation throw. The hook below is scoped to the
     * one object shape that reaches it (the submission body always carries `_subject`), so
     * nothing else on the page loses `JSON.stringify`. This modifies the RUNTIME, not the
     * document: the markup under measurement is the markup as built, which is why this is
     * not a modified-page measurement.
     */
    await page.addInitScript(() => {
      const original = JSON.stringify;
      JSON.stringify = function patched(value: unknown, ...rest: unknown[]) {
        if (value !== null && typeof value === 'object' && '_subject' in value) {
          throw new TypeError('forced serialisation failure — Phase 5 axe baseline, blocked state');
        }
        return (original as (...args: unknown[]) => string)(value, ...rest);
      } as typeof JSON.stringify;
    });

    // The hook installs on the next document, so the page loaded by the fixture must be
    // reloaded for it to be in place before the form is submitted.
    await page.reload();
    await page.waitForLoadState('networkidle');

    const endpointRequests: string[] = [];
    page.on('request', (request) => {
      if (ENDPOINT_PATTERN.test(request.url())) {
        endpointRequests.push(request.url());
      }
    });

    await fillQualifyForm(page);
    await submitQualifyForm(page);
    await expect(
      page.getByRole('heading', { name: "We couldn't send your details" }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try sending again' })).toHaveCount(0);

    await scanAndRecord(page, testInfo, {
      surface: 'S5',
      state: 'blocked',
      stateDescription:
        'The recovery panel for a submission that never started: the blocked body copy and ' +
        'no retry control, with the form still mounted and editable.',
      analysisScope: 'whole document',
      interventions: [
        'hooked JSON.stringify to throw on the submission body so serialisation fails',
        'filled and submitted the qualification form with valid values',
      ],
    });

    // The state's own premise, measured: a blocked submission issues no request.
    expect(endpointRequests, 'a blocked submission issued a request').toEqual([]);
  });
});
