import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { AXE_TAGS, BLOCKING_IMPACTS, axeDisablesFor, axeFor } from './fixtures/axe';
import { recordEvidence } from './fixtures/evidence';
import { SURFACES, type SurfaceId } from './fixtures/surfaces';
import { VIEWPORTS } from './fixtures/viewports';

/**
 * THE ACCESSIBILITY GATE — the gating counterpart to `e2e/axe-baseline.e2e.ts`.
 *
 * Same surfaces, same states, same factory, same blocking-impact set. It differs from the
 * baseline in exactly one respect: **the baseline records and fails on nothing; this spec
 * FAILS when a node is returned at a blocking impact and RECORDS WITHOUT FAILING at the other
 * two.** Blocking is `BLOCKING_IMPACTS` from `e2e/fixtures/axe.ts` — `critical` and `serious`,
 * owner decision D-OQ-1 — and `moderate` and `minor` are written to `evidence/axe-gate.json`
 * with rule id, impact and node target.
 *
 * **The gate consumes the baseline's own configuration, and that is the point.** Every scan is
 * built by `axeFor`, the one factory the baseline used; the tag list, the per-URL disables and
 * the Products-region inclusion live there and nowhere here. So this gate cannot be configured
 * greener than the run that found the problems: there is no tag list, no rule disable and no
 * threshold in this file to edit. Each scan also asserts that the options the engine reports it
 * ran with are the factory's, so a narrowed run fails rather than passing as clean.
 *
 * **Two scope rulings, both the owner's (05-14 Task 2, 2026-09-12), both wider than the
 * plan's literal wording and therefore not looser than the baseline:**
 *
 *   1. An `incomplete` (undeterminable) result at a blocking impact FAILS the gate exactly as
 *      a violation does, unless a named exception below matches it. axe could not decide is
 *      not the same as axe found nothing.
 *   2. The gate covers all eleven surface-states the baseline measured, S4 included. The plan
 *      wording names "a HAOO surface or the Products region"; S4 is the retired-path document
 *      served by ZERO-PAPER HUB, and leaving it ungated would make this gate narrower than the
 *      baseline it exists to hold.
 *
 * **An accepted finding is a NAMED EXCEPTION, never a disable.** It is keyed on the rule id, the
 * result bucket, the impact, the node target, the surface and the state; it carries its reason
 * and the reason's provenance inline; and it has a vacuity guard — a scan of a state an
 * exception names that returns nothing for the exception to match FAILS, so an exception cannot
 * outlive the thing it excuses. A disable is invisible at the call site and goes stale in
 * silence; this list is visible where it applies and goes red when it stops applying.
 */

/** The four impacts axe assigns. Anything else cannot be classified against D-OQ-1. */
const IMPACTS = ['critical', 'serious', 'moderate', 'minor'] as const;

type Impact = (typeof IMPACTS)[number];

type Bucket = 'violations' | 'incomplete';

/** The narrowest entry in the D-09 closed list, taken from the list rather than retyped. */
const NARROW_VIEWPORT = VIEWPORTS[0];

/**
 * Every surface-state this gate scans. Closed, and identical to the baseline's eleven entries in
 * `evidence/axe-baseline.json`. An exception may only name a state registered here.
 */
const GATED_STATES = [
  { surface: 'S1', state: 'default' },
  { surface: 'S1', state: 'disclosure-expanded' },
  { surface: 'S1', state: 'error-summary' },
  { surface: 'S1', state: 'mobile-nav-open' },
  { surface: 'S3', state: 'products-region' },
  { surface: 'S4', state: 'as-served' },
  { surface: 'S4', state: 'refresh-stripped' },
  { surface: 'S5', state: 'in-flight' },
  { surface: 'S5', state: 'success' },
  { surface: 'S5', state: 'transport-failure' },
  { surface: 'S5', state: 'blocked' },
] as const satisfies readonly { surface: SurfaceId; state: string }[];

type GatedState = (typeof GATED_STATES)[number]['state'];

interface GateException {
  /** The identifier the triage record uses (`05-EVIDENCE-AXE.md` §8 and §9). */
  readonly id: string;
  readonly rule: string;
  readonly bucket: Bucket;
  readonly impact: Impact;
  readonly surface: SurfaceId;
  readonly states: readonly GatedState[];
  /** The node target exactly as axe reports it, flattened to one string. */
  readonly target: string;
  /** The recorded reason, verbatim. */
  readonly reason: string;
  /** Whose words the reason is, and how they were obtained. */
  readonly provenance: string;
}

/**
 * The named exceptions. Closed list, one reason per entry, `as const`.
 *
 * Admission is by an owner disposition of `accept-recorded` at a `gate="blocking-human"`
 * checkpoint, and nothing else. An entry added to turn a red run green without that
 * disposition is exactly the configuration change this gate exists to refuse.
 */
const GATE_EXCEPTIONS = [
  {
    id: 'R-1',
    rule: 'bypass',
    bucket: 'incomplete',
    impact: 'serious',
    surface: 'S4',
    states: ['as-served', 'refresh-stripped'],
    target: 'html',
    reason:
      'The retired-path page is a single short notice with no navigation and no blocks repeated across pages, so there is nothing for a skip link, heading or landmark to let a visitor bypass; 04.2 D-12 keeps it deliberately minimal.',
    provenance:
      'Owner-accepted, orchestrator-drafted at the owner\'s request, 2026-09-12. At the 05-14 Task 2 checkpoint the owner chose accept-recorded; asked for their own words, the owner replied "provide a reason", and the orchestrator drafted the sentence above at that request. It is not the owner\'s own wording.',
  },
] as const satisfies readonly GateException[];

type AxeResults = Awaited<ReturnType<ReturnType<typeof axeFor>['analyze']>>;
type AxeIssue = AxeResults['violations'][number];

interface GateNode {
  readonly bucket: Bucket;
  readonly rule: string;
  readonly impact: string | null;
  readonly target: string;
}

/** axe node targets nest (frame paths are arrays of arrays). Flatten to one readable string. */
function targetToString(target: unknown): string {
  if (Array.isArray(target)) {
    return target.map((part) => targetToString(part)).join(' ');
  }

  return String(target);
}

function flatten(bucket: Bucket, issues: readonly AxeIssue[]): GateNode[] {
  return issues.flatMap((issue) =>
    issue.nodes.map((node) => ({
      bucket,
      rule: issue.id,
      // The node's own impact where axe assigns one, else the rule result's.
      impact: node.impact ?? issue.impact ?? null,
      target: targetToString(node.target),
    })),
  );
}

function isBlocking(impact: string | null): boolean {
  return impact !== null && (BLOCKING_IMPACTS as readonly string[]).includes(impact);
}

function exceptionsFor(surface: SurfaceId, state: GatedState): readonly GateException[] {
  return GATE_EXCEPTIONS.filter(
    (exception) =>
      exception.surface === surface && (exception.states as readonly string[]).includes(state),
  );
}

function matches(exception: GateException, node: GateNode): boolean {
  return (
    exception.rule === node.rule &&
    exception.bucket === node.bucket &&
    exception.impact === node.impact &&
    exception.target === node.target
  );
}

function describeNode(node: GateNode): string {
  return `${node.bucket}/${node.rule} (${node.impact ?? 'no impact'}) at ${node.target}`;
}

/**
 * Scan a reached state, record every node by class, then gate.
 *
 * Recording happens BEFORE any assertion, so a red run still leaves the measurement behind.
 */
async function gateScan(
  page: Page,
  testInfo: TestInfo,
  surface: SurfaceId,
  state: GatedState,
): Promise<void> {
  const registered = GATED_STATES.some((entry) => entry.surface === surface && entry.state === state);
  expect(registered, `${surface}/${state} is not a registered gated state`).toBe(true);

  const results = await axeFor(page, surface).analyze();

  const nodes = [
    ...flatten('violations', results.violations),
    ...flatten('incomplete', results.incomplete),
  ];
  const applicable = exceptionsFor(surface, state);

  const unclassifiable = nodes.filter(
    (node) => node.impact === null || !(IMPACTS as readonly string[]).includes(node.impact),
  );
  const blocking = nodes.filter((node) => isBlocking(node.impact));
  const excepted = blocking.filter((node) => applicable.some((exception) => matches(exception, node)));
  const unexcepted = blocking.filter(
    (node) => !applicable.some((exception) => matches(exception, node)),
  );
  const recordedOnly = nodes.filter(
    (node) => node.impact === 'moderate' || node.impact === 'minor',
  );

  const matchedPerException = applicable.map((exception) => ({
    id: exception.id,
    matchedNodes: nodes.filter((node) => matches(exception, node)).length,
  }));

  // The documents' own script sources: which HAOO bundle (or which ZERO-PAPER HUB document)
  // this reading was taken on.
  const scriptSources = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[src]')).map(
      (script) => script.getAttribute('src') ?? '',
    ),
  );
  const viewport = page.viewportSize();

  recordEvidence('axe-gate', {
    surface,
    viewport,
    measured: {
      violationNodeCount: nodes.filter((node) => node.bucket === 'violations').length,
      incompleteNodeCount: nodes.filter((node) => node.bucket === 'incomplete').length,
      blockingNodeCount: blocking.length,
      exceptedBlockingNodeCount: excepted.length,
      unexceptedBlockingNodeCount: unexcepted.length,
      moderateNodeCount: nodes.filter((node) => node.impact === 'moderate').length,
      minorNodeCount: nodes.filter((node) => node.impact === 'minor').length,
      unclassifiableNodeCount: unclassifiable.length,
    },
    detail: {
      state,
      url: page.url(),
      project: testInfo.project.name,
      // Always 0 while retries are pinned below; recorded so a record can never be mistaken for a
      // retry's reading if that pin is ever lifted.
      attempt: testInfo.retry,
      engine: results.testEngine.name,
      engineVersion: results.testEngine.version,
      tags: [...AXE_TAGS],
      perUrlDisabledRules: axeDisablesFor(surface).map((disable) => disable.rule),
      blockingImpacts: [...BLOCKING_IMPACTS],
      exceptionsApplicable: matchedPerException,
      exceptedNodes: excepted.map(describeNode),
      unexceptedBlockingNodes: unexcepted.map(describeNode),
      recordedOnlyNodes: recordedOnly.map(describeNode),
      scriptSources,
    },
  });

  console.log(
    `[axe-gate] ${surface}/${state} (${testInfo.project.name}): ${blocking.length} blocking node(s), ` +
      `${excepted.length} excepted, ${unexcepted.length} unexcepted, ` +
      `${recordedOnly.length} recorded-only, axe-core ${results.testEngine.version}`,
  );

  // METHOD: the engine ran with the factory's options, not a narrowed or widened set.
  expect(
    results.toolOptions.runOnly,
    `${surface}/${state}: the scan did not run the factory's tag selection`,
  ).toEqual({ type: 'tag', values: [...AXE_TAGS] });

  // METHOD: every node can be classified against D-OQ-1. An impact outside the four is not
  // non-blocking; it is unmeasured, and passing it would be passing an unasked question.
  expect(
    unclassifiable.map(describeNode),
    `${surface}/${state}: axe returned nodes with an impact D-OQ-1 cannot classify`,
  ).toEqual([]);

  // THE GATE.
  expect(
    unexcepted.map(describeNode),
    `${surface}/${state}: blocking-impact nodes (D-OQ-1: ${BLOCKING_IMPACTS.join(', ')}) with no named exception`,
  ).toEqual([]);

  // VACUITY: an exception naming this state must still have something to excuse.
  for (const entry of matchedPerException) {
    expect(
      entry.matchedNodes,
      `${surface}/${state}: named exception ${entry.id} matched no node. The finding it excuses ` +
        'is gone or has changed; delete or re-decide the exception rather than leaving it standing.',
    ).toBeGreaterThan(0);
  }
}

/** Three full axe analyses over a live network are not a 30-second job. */
const SCAN_TIMEOUT_MS = 180_000;

function requireProject(testInfo: TestInfo, project: 'live' | 'preview'): void {
  test.skip(
    testInfo.project.name !== project,
    `this scan is only meaningful against the '${project}' project`,
  );
  test.setTimeout(SCAN_TIMEOUT_MS);
}

/*
 * NO RETRIES FOR THE GATE, on either project, overriding the `live` project's `retries: 2`.
 *
 * A retry would let the gate pass on a blocking finding it actually observed: a serious finding
 * caught on attempt 1 (for example `color-contrast` read mid-way through an opacity reveal) and
 * absent on attempt 2 makes Playwright report the test as flaky and exit 0 (review WR-01). A gate
 * that saw a blocking node once has an answer, and that answer is red. A live-network failure is
 * re-run by a person and the re-run is its own recorded measurement.
 */
test.describe.configure({ retries: 0 });

/* ------------------------------------------------------------------------------------ *
 * THE EXCEPTION LIST ITSELF — closed-list checks that need no page.
 * ------------------------------------------------------------------------------------ */

test.describe('axe gate — the named exception list', () => {
  test('every exception names registered states, a reason and its provenance', () => {
    const ids = GATE_EXCEPTIONS.map((exception) => exception.id);
    expect(new Set(ids).size, 'duplicate exception ids').toBe(ids.length);

    for (const exception of GATE_EXCEPTIONS) {
      expect(exception.states.length, `${exception.id} names no state`).toBeGreaterThan(0);
      for (const state of exception.states) {
        expect(
          GATED_STATES.some(
            (entry) => entry.surface === exception.surface && entry.state === state,
          ),
          `${exception.id} names ${exception.surface}/${state}, which this gate never scans — it could never match`,
        ).toBe(true);
      }
      expect(
        isBlocking(exception.impact),
        `${exception.id} excuses a non-blocking impact, which needs no exception`,
      ).toBe(true);
      expect(exception.reason.trim().length, `${exception.id} has no reason`).toBeGreaterThan(0);
      expect(exception.provenance.trim().length, `${exception.id} has no provenance`).toBeGreaterThan(0);
    }
  });
});

/* ------------------------------------------------------------------------------------ *
 * LIVE PROJECT — S1 in four states, S3's Products region, and S4 read twice.
 * ------------------------------------------------------------------------------------ */

test.describe('axe gate — live surfaces at the default desktop viewport', () => {
  test('S1 — default state', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

    const response = await page.goto(SURFACES.S1.path ?? SURFACES.S1.url);
    expect(response?.status(), `unexpected status for ${SURFACES.S1.url}`).toBe(200);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();

    await gateScan(page, testInfo, 'S1', 'default');
  });

  test('S1 — measurement disclosure expanded', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

    await page.goto(SURFACES.S1.path ?? SURFACES.S1.url);
    await page.waitForLoadState('networkidle');

    const disclosure = page.locator('details').first();
    await disclosure.locator('summary').click();
    await expect(disclosure).toHaveAttribute('open', '');

    await gateScan(page, testInfo, 'S1', 'disclosure-expanded');
  });

  test('S1 — error summary present', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

    // An empty submit issues no request (client-side validation, `noValidate`). The abort is
    // belt-and-braces, and the observed request list is asserted empty below.
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

    await gateScan(page, testInfo, 'S1', 'error-summary');

    expect(
      endpointRequests,
      `a live submission left for the lead endpoint: ${endpointRequests.join(', ')}`,
    ).toEqual([]);
  });

  test('S3 — ZERO-PAPER HUB Products region', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

    const response = await page.goto(SURFACES.S3.url);
    expect(response?.status(), `unexpected status for ${SURFACES.S3.url}`).toBe(200);
    await page.waitForLoadState('networkidle');

    // The region reveals from opacity-0 on intersection; an unscrolled scan measures a
    // transparent subtree.
    const products = page.locator('#products');
    await products.scrollIntoViewIfNeeded();
    await expect(products).toBeVisible();
    await page.waitForTimeout(1500);

    await gateScan(page, testInfo, 'S3', 'products-region');
  });

  test('S4 — retired-path document as served', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

    // The zero-second refresh's destination is blocked, so the document stays in the browser
    // exactly as served.
    await page.route('https://www.haoo.online/', (route) => route.abort('aborted'));

    try {
      await page.goto(SURFACES.S4.url, { waitUntil: 'domcontentloaded' });
    } catch {
      // The refresh can interrupt the navigation `goto` awaits; the URL check is the proof.
    }
    await page.waitForTimeout(2000);

    expect(page.url(), 'the refresh carried the browser away from the document under test').toContain(
      '/products/haoo/',
    );

    await gateScan(page, testInfo, 'S4', 'as-served');
  });

  test('S4 — retired-path document with the refresh directive stripped', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

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

    expect(page.url(), 'the refresh was not neutralised — the strip did not match').toContain(
      '/products/haoo/',
    );

    await gateScan(page, testInfo, 'S4', 'refresh-stripped');
  });
});

test.describe('axe gate — the live HAOO page with the mobile navigation open', () => {
  test.use({ viewport: { width: NARROW_VIEWPORT.width, height: NARROW_VIEWPORT.height } });

  test('S1 — mobile navigation open at 360px', async ({ page }, testInfo) => {
    requireProject(testInfo, 'live');

    await page.goto(SURFACES.S1.path ?? SURFACES.S1.url);
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('header button[aria-expanded]');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await gateScan(page, testInfo, 'S1', 'mobile-nav-open');
  });
});

/* ------------------------------------------------------------------------------------ *
 * PREVIEW PROJECT — the four form states FS-0 forbids exercising against production.
 * ------------------------------------------------------------------------------------ */

const ENDPOINT_PATTERN = /formsubmit\.co/;

/** Fill every visible control with values that pass validation, reading options from the DOM. */
async function fillQualifyForm(page: Page): Promise<void> {
  const form = page.locator('form');
  await expect(form).toBeVisible();

  // The honeypot is the one tabindex="-1" input and must stay empty.
  const inputs = form.locator('input:not([tabindex="-1"])');
  const inputCount = await inputs.count();
  for (let index = 0; index < inputCount; index += 1) {
    const input = inputs.nth(index);
    const type = (await input.getAttribute('type')) ?? 'text';
    const value =
      type === 'email'
        ? 'phase05.gate@example.com'
        : type === 'tel'
          ? '+254 700 000 000'
          : 'Phase 05 gate';
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
    await textareas.nth(index).fill('Recorded by the Phase 5 accessibility gate.');
  }
}

async function submitQualifyForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Send my details' }).click();
}

test.describe('axe gate — the preview mirror in the four states production forbids', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    requireProject(testInfo, 'preview');
    await page.goto(SURFACES.S5.path ?? SURFACES.S5.url);
    await page.waitForLoadState('networkidle');
  });

  test('S5 — in-flight', async ({ page }, testInfo) => {
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

      await gateScan(page, testInfo, 'S5', 'in-flight');
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

    await gateScan(page, testInfo, 'S5', 'success');
  });

  test('S5 — transport failure', async ({ page }, testInfo) => {
    await page.route(ENDPOINT_PATTERN, (route) => route.abort('failed'));

    await fillQualifyForm(page);
    await submitQualifyForm(page);
    await expect(
      page.getByRole('heading', { name: "We couldn't send your details" }),
    ).toBeVisible();

    await gateScan(page, testInfo, 'S5', 'transport-failure');
  });

  test('S5 — blocked', async ({ page }, testInfo) => {
    // Body serialisation is made to throw for the one object shape carrying `_subject`, so the
    // submission never starts. This modifies the runtime, not the document.
    await page.addInitScript(() => {
      const original = JSON.stringify;
      JSON.stringify = function patched(value: unknown, ...rest: unknown[]) {
        if (value !== null && typeof value === 'object' && '_subject' in value) {
          throw new TypeError('forced serialisation failure — Phase 5 axe gate, blocked state');
        }
        return (original as (...args: unknown[]) => string)(value, ...rest);
      } as typeof JSON.stringify;
    });

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

    await gateScan(page, testInfo, 'S5', 'blocked');

    expect(endpointRequests, 'a blocked submission issued a request').toEqual([]);
  });
});
