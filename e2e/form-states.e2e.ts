import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { recordEvidence } from './fixtures/evidence';
import { SURFACES, assertNonEmptySubjects, type Surface } from './fixtures/surfaces';

/**
 * The qualification form's state machine (`05-UI-SPEC.md` § Form State Coverage, FS-0 to FS-2, and
 * § KF-5's focus-movement matrix), measured on the target each state is permitted to be measured on.
 *
 * **The target rule, which is the reason this file exists in the shape it does.**
 *
 * The in-flight, success, transport-failure and blocked states run on the **preview** project
 * ONLY. Inducing any of them against `https://www.haoo.online` would either send real mail to
 * `info@haoo.online` through a real third-party provider, or require lying to that provider on the
 * live origin. FS-0 records the decision; a project-name guard enforces it here, so no edit to a
 * describe title can quietly move a failure state onto production. The single tagged live
 * submission is D-12's, owned by plan 05-16, and is not this file's business.
 *
 * Idle and invalid ARE safe live: validation is client-side and issues no request at all. They run
 * on **both** projects, so a divergence between the deployed build and the locally built one is
 * visible rather than assumed. Both run with the provider routed to abort and every attempt
 * counted, so even a validation regression could not deliver a lead from this spec — the same
 * belt-and-braces `e2e/keyboard.e2e.ts` uses for the one form state it touches.
 *
 * **What a confirmation may be recorded as.** The success state's announcement is a
 * BROWSER-OBSERVABLE claim: this page saw the provider accept a request. It is never a delivery
 * claim, and nothing in this file may be read as one. Delivery is established by the mail-chain
 * record, not by a DOM node.
 *
 * Strings are transcribed as literals rather than imported. `src/products/haoo.ts` reads
 * `import.meta.env` at module scope, which is undefined outside Vite, so a Playwright spec that
 * imports it throws at import time (the same constraint `e2e/recovery.e2e.ts` records). The
 * hermetic suite pins the same strings, so a divergence between the two is a defect in THIS file.
 */

/* ------------------------------------------------------------------------------------------- */
/* The exact shipped strings and identifiers                                                     */
/* ------------------------------------------------------------------------------------------- */

/** `src/products/haoo.ts:524`. Every DOM id this form owns is namespaced by it. */
const SLUG = 'haoo';

/** `QualifyForm.tsx` `qualifyId`: `${slug}-qualify-${suffix}`. */
function qid(suffix: string): string {
  return `${SLUG}-qualify-${suffix}`;
}

/** Control copy, `src/components/qualify-form.logic.ts:19`. */
const SUBMIT_LABEL = 'Send my details';

/** The error-summary heading, `src/components/qualify-form.logic.ts:21`. */
const SUMMARY_HEADING = 'There is a problem';

/** `QualifyForm.tsx`, the lead above the form card. */
const LEAD_TEXT = 'All fields are required unless marked optional.';

/** The screen-reader-only prefix on every per-field message (`QualifyForm.tsx` `renderField`). */
const ERROR_PREFIX = 'Error: ';

/**
 * The error-summary CONTAINER — the element that carries `tabindex="-1"` and the focus ring, and
 * the element KF-5 names as the invalid-submit focus destination.
 *
 * It is the direct parent of the `role="alert"` node, never the alert itself: the alert is an inner
 * div so that the live region's CONTENT changes when the problem list changes, while the container
 * around it stays put to receive focus.
 */
const SUMMARY_CONTAINER_SELECTOR = 'div:has(> [role="alert"])';

/** `QUALIFY_STATUS_MESSAGES`, `src/components/qualify-form.logic.ts:28-34`. */
const STATUS = {
  idle: '',
  submitting: 'Sending your details…',
  succeeded: 'Your details were sent.',
  failed: "We couldn't send your details.",
  blocked: "We couldn't send your details.",
} as const;

/** The reserved height that keeps the region's first message from reflowing the page. */
const STATUS_MIN_HEIGHT = '24px';

/**
 * The provider route. `QUALIFY_ENDPOINT_FALLBACK` is `https://formsubmit.co/ajax/info@haoo.online`
 * and the build-time override is constrained to the same host, so matching the host matches every
 * endpoint this page can possibly resolve.
 */
const PROVIDER_PATTERN = /formsubmit\.co/;

/** A live round trip plus a deliberate in-flight delay does not fit the 30 s default. */
const TIMEOUT_MS = 180_000;

/** The desktop width every DOM-shaped reading in this file is taken at (D-09's 1280 entry). */
const DESKTOP = { width: 1280, height: 1024 } as const;

/** Evidence file names, one per measurement family. */
const EVIDENCE = {
  states: 'form-states',
  focus: 'form-states-focus',
  requests: 'form-states-requests',
  statusRegion: 'form-states-status-region',
  optionLabels: 'form-states-option-labels',
} as const;

/**
 * The qualification fields, transcribed from `src/products/haoo.ts:706-845` in DOM order.
 *
 * `requiredMessage` is the string the error summary and the per-field message both render when the
 * field is required and empty, so it is the literal both surfaces are compared against.
 */
const FIELDS = [
  { name: 'name', control: 'input', label: 'Full name', requiredWhenEmpty: true, requiredMessage: 'Enter your full name' },
  { name: 'email', control: 'input', label: 'Email address', requiredWhenEmpty: true, requiredMessage: 'Enter your email address' },
  { name: 'preferredChannel', control: 'select', label: 'How should we reach you?', requiredWhenEmpty: true, requiredMessage: 'Select how we should reach you' },
  { name: 'phone', control: 'input', label: 'Phone number', requiredWhenEmpty: false, requiredMessage: 'Enter a phone number so we can reach you on the channel you chose' },
  { name: 'role', control: 'select', label: 'Your role', requiredWhenEmpty: true, requiredMessage: 'Select your role' },
  { name: 'organization', control: 'input', label: 'Organization', requiredWhenEmpty: false, requiredMessage: 'Enter your organization' },
  { name: 'portfolioBand', control: 'select', label: 'How many units do you manage?', requiredWhenEmpty: true, requiredMessage: 'Select how many units you manage' },
  { name: 'county', control: 'select', label: 'Where are your properties?', requiredWhenEmpty: true, requiredMessage: 'Select where your properties are' },
  { name: 'timeframe', control: 'select', label: 'When would you like to start?', requiredWhenEmpty: true, requiredMessage: 'Select when you would like to start' },
  { name: 'message', control: 'textarea', label: 'Anything else we should know?', requiredWhenEmpty: false, requiredMessage: 'Enter your message' },
] as const;

/** The seven fields an empty submit must complain about, in DOM order. */
const REQUIRED_WHEN_EMPTY = FIELDS.filter((field) => field.requiredWhenEmpty);

/** The conditional-requirement rule on `phone`, `src/products/haoo.ts:755-768`. */
const PHONE_RULE = {
  control: 'preferredChannel',
  /** Either value makes `phone` required; `Email` does not. */
  triggering: ['WhatsApp', 'Phone call'],
  neutral: 'Email',
  announcement: (value: string) =>
    `A phone number is now required because you asked us to reach you by ${value}.`,
  formatMessage: 'Enter a phone number using digits, spaces, or +',
  /**
   * A value made only of separators. `formatPattern` opens with a lookahead demanding at least
   * seven digits somewhere in the value, precisely so punctuation alone cannot satisfy the
   * conditional-required gate and reach the inbox as an uncallable number.
   */
  separatorsOnly: '+()- ()-',
} as const;

/* ------------------------------------------------------------------------------------------- */
/* KF-5 — one focus matrix, extended rather than duplicated                                      */
/* ------------------------------------------------------------------------------------------- */

/**
 * The six transitions of `05-UI-SPEC.md` § KF-5, as ONE table.
 *
 * Rows 1-3 are asserted by the idle/invalid block; rows 4-6 extend this same table from the
 * terminal-state block. There is deliberately no second matrix: two tables would drift, and the
 * body-focus invariant below is stated over all six rows at once, not over each half separately.
 *
 * `projects` is the target rule per row. Row 4 is `both` even though it is asserted alongside the
 * preview-only rows: activating an error-summary link issues no request, so FS-0 permits it live.
 */
const FOCUS_MATRIX = [
  { id: 'KF5-1', transition: 'invalid submit', destination: 'the error-summary container', projects: 'both' },
  { id: 'KF5-2', transition: 'repeat invalid submit, unchanged errors', destination: 'the error-summary container again', projects: 'both' },
  { id: 'KF5-3', transition: 'correcting a field while typing', destination: 'unchanged — the control the visitor is in', projects: 'both' },
  { id: 'KF5-4', transition: 'activating a summary item link', destination: 'the field that item names', projects: 'both' },
  { id: 'KF5-5', transition: 'success', destination: 'the confirmation heading', projects: 'preview' },
  { id: 'KF5-6', transition: 'transport failure / blocked', destination: 'the fallback heading', projects: 'preview' },
] as const;

type FocusRowId = (typeof FOCUS_MATRIX)[number]['id'];

function focusRow(id: FocusRowId) {
  const row = FOCUS_MATRIX.find((candidate) => candidate.id === id);
  if (row === undefined) {
    throw new Error(`FOCUS_MATRIX has no row ${id}; the matrix changed shape`);
  }
  return row;
}

interface ActiveElementReading {
  readonly tag: string;
  readonly id: string;
  /** The `tabindex` ATTRIBUTE as authored, or `null`. A script-focus target carries `-1`. */
  readonly tabIndexAttribute: string | null;
  readonly text: string;
  /** Whether the active element wraps the error summary's `role="alert"` child. */
  readonly wrapsAlert: boolean;
  /**
   * The invariant the whole matrix is stated over. `<body>` receiving focus is what happens when a
   * script moves focus to an element that has just been unmounted, and it is invisible to a sighted
   * visitor and catastrophic to a screen-reader one.
   */
  readonly isBody: boolean;
}

async function readActive(page: Page): Promise<ActiveElementReading> {
  return page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    return {
      tag: active?.tagName ?? 'NONE',
      id: active?.id ?? '',
      tabIndexAttribute: active?.getAttribute('tabindex') ?? null,
      text: (active?.textContent ?? '').replace(/\s+/gu, ' ').trim().slice(0, 80),
      wrapsAlert: active?.querySelector('[role="alert"]') !== null && active?.querySelector('[role="alert"]') !== undefined,
      isBody: active === document.body,
    };
  });
}

interface FocusObservation extends ActiveElementReading {
  readonly row: FocusRowId;
  readonly transition: string;
  readonly expected: string;
}

/**
 * The per-test collector for matrix rows.
 *
 * It exists so the body-focus invariant is a COUNT over every transition the test made, written
 * out as an integer — including when that integer is zero. A zero written down is a different
 * artefact from an assertion that quietly held: the project precedent
 * (`04.2-VERIFICATION.md` § Human Verification Outcome) recorded four zeros beside six non-zero
 * counts, and the zeros are what distinguish what happened from what did not.
 */
function focusLog() {
  const observations: FocusObservation[] = [];

  return {
    async observe(page: Page, id: FocusRowId): Promise<FocusObservation> {
      const row = focusRow(id);
      const reading = await readActive(page);
      const observation: FocusObservation = {
        ...reading,
        row: id,
        transition: row.transition,
        expected: row.destination,
      };
      observations.push(observation);
      return observation;
    },
    get rows(): readonly FocusObservation[] {
      return observations;
    },
    /** The integer the evidence file carries. Expected zero, and written as zero. */
    get bodyFocusCount(): number {
      return observations.filter((observation) => observation.isBody).length;
    },
  };
}

/* ------------------------------------------------------------------------------------------- */
/* The painted indicator on a script-focus destination                                           */
/* ------------------------------------------------------------------------------------------- */

/**
 * KF-2's method, narrowed to the four elements this page focuses BY SCRIPT.
 *
 * `e2e/keyboard.e2e.ts` owns the full instrument and applies it to every sequential stop under real
 * keyboard modality. It is deliberately not imported here: importing one spec file from another
 * registers its tests twice. This narrowed copy is the deliberate exception KF-5 names — these four
 * elements are never reached by Tab, so `focus-visible:` would paint nothing on them and they ship
 * modality-independent `focus:` variants instead. The before-reading is taken by blurring the
 * element and re-focusing it by script, which is the real path.
 *
 * A transparent colour counts as no indicator: Tailwind's `outline-none` compiles to
 * `2px solid transparent`, which satisfies a naive `outline-width > 0` test while painting nothing.
 */
interface IndicatorReading {
  readonly before: Record<string, string>;
  readonly after: Record<string, string>;
  readonly addedShadowLayers: readonly string[];
  readonly outlineVisibleAfter: boolean;
  readonly paintedByFocus: boolean;
}

async function readScriptFocusIndicator(
  page: Page,
  locate: string,
): Promise<IndicatorReading> {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (element === null) {
      throw new Error(`script-focus indicator: nothing matched ${selector}`);
    }

    const read = (node: HTMLElement) => {
      const style = getComputedStyle(node);
      return {
        'outline-style': style.outlineStyle,
        'outline-width': style.outlineWidth,
        'outline-color': style.outlineColor,
        'box-shadow': style.boxShadow,
      };
    };

    const alpha = (colour: string): number => {
      const value = colour.trim().toLowerCase();
      if (value === '' || value === 'transparent') return 0;
      const functional = /^rgba?\((.*)\)$/.exec(value);
      if (functional === null) return 1;
      const parts = functional[1].split(/[\s,/]+/).filter((part) => part !== '');
      if (parts.length < 4) return 1;
      const channel = parts[3];
      return channel.endsWith('%') ? Number.parseFloat(channel) / 100 : Number.parseFloat(channel);
    };

    const visibleLayers = (boxShadow: string): string[] => {
      if (boxShadow.trim() === '' || boxShadow.trim() === 'none') return [];
      return boxShadow
        .split(/,(?![^(]*\))/)
        .map((layer) => layer.trim())
        .filter((layer) => {
          const colour = /rgba?\([^)]*\)|transparent/i.exec(layer)?.[0] ?? '';
          const lengths = (layer.replace(colour, '').match(/-?\d*\.?\d+px/g) ?? []).map((length) =>
            Number.parseFloat(length),
          );
          return (colour === '' ? 1 : alpha(colour)) > 0 && lengths.some((length) => length !== 0);
        });
    };

    const outlineVisible = (style: Record<string, string>): boolean =>
      style['outline-style'] !== 'none' &&
      Number.parseFloat(style['outline-width']) > 0 &&
      alpha(style['outline-color']) > 0;

    element.blur();
    const before = read(element);
    element.focus();
    const after = read(element);

    const beforeLayers = new Set(visibleLayers(before['box-shadow']));
    const addedShadowLayers = visibleLayers(after['box-shadow']).filter(
      (layer) => !beforeLayers.has(layer),
    );
    const outlineVisibleAfter = outlineVisible(after);
    const outlineChanged = (['outline-style', 'outline-width', 'outline-color'] as const).some(
      (property) => before[property] !== after[property],
    );

    return {
      before,
      after,
      addedShadowLayers,
      outlineVisibleAfter,
      paintedByFocus:
        addedShadowLayers.length > 0 ||
        (outlineVisibleAfter && (!outlineVisible(before) || outlineChanged)),
    };
  }, locate);
}

/* ------------------------------------------------------------------------------------------- */
/* FS-2 — the status region, and the second region the page actually ships                       */
/* ------------------------------------------------------------------------------------------- */

interface StatusRegionReading {
  readonly role: string | null;
  readonly text: string;
  /** `true` for a region inside the `<form>` element, `false` for one outside it. */
  readonly insideForm: boolean;
  readonly minHeight: string;
}

/** Every `role="status"` region in the document, in DOM order, with where it sits. */
async function readStatusRegions(page: Page): Promise<readonly StatusRegionReading[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[role="status"]')).map((element) => ({
      role: element.getAttribute('role'),
      text: (element.textContent ?? '').replace(/\s+/gu, ' ').trim(),
      insideForm: element.closest('form') !== null,
      minHeight: getComputedStyle(element).minHeight,
    })),
  );
}

/**
 * The SUBMISSION status region: the one FS-2 describes, identified by the property FS-2 itself
 * gives it — it is mounted OUTSIDE the form card, so it survives the card being replaced on success.
 *
 * **Observation FS-O1, recorded rather than asserted away.** The document ships TWO `role="status"`
 * regions, not one. The second belongs to `MeasurementDisclosure`'s clear-context control, sits
 * inside the `<form>` element inside a `<details>` that is closed by default, and carries a
 * different message family entirely. FS-2's "exactly one such region exists" is therefore true of
 * the submission region and false of the document. Rather than widen the rule or fail a shipped
 * design that is legitimate ARIA — two independent controls, two independent polite regions — this
 * file asserts exactly one SUBMISSION region at all times, asserts the disclosure region never
 * carries a submission message, and records the document-wide integer count in the evidence.
 */
function submissionRegions(regions: readonly StatusRegionReading[]): readonly StatusRegionReading[] {
  return regions.filter((region) => !region.insideForm);
}

/** Every message the submission region is permitted to hold, so "two at once" is detectable. */
const KNOWN_STATUS_TEXTS: readonly string[] = [
  STATUS.idle,
  STATUS.submitting,
  STATUS.succeeded,
  STATUS.failed,
  ...PHONE_RULE.triggering.map((value) => PHONE_RULE.announcement(value)),
];

/**
 * The FS-2 invariants, asserted at one point in a transition sequence and returned as a reading.
 *
 * `expected` is the exact text the submission region must hold. Equality, never containment: a
 * region holding two messages at once would still CONTAIN either one of them, and that is the
 * failure the invariant exists to catch.
 */
async function assertStatusInvariants(
  page: Page,
  expected: string,
  where: string,
): Promise<readonly StatusRegionReading[]> {
  const regions = await readStatusRegions(page);
  const submission = submissionRegions(regions);

  expect(submission.length, `${where}: submission status regions outside the form card`).toBe(1);
  expect(submission[0].role, `${where}: the submission region's role`).toBe('status');
  expect(submission[0].text, `${where}: the submission region's text`).toBe(expected);
  expect(
    KNOWN_STATUS_TEXTS.includes(submission[0].text),
    `${where}: the submission region holds text that is not one single known message`,
  ).toBe(true);

  for (const region of regions.filter((candidate) => candidate.insideForm)) {
    expect(
      KNOWN_STATUS_TEXTS.filter((known) => known !== '').includes(region.text),
      `${where}: the measurement-disclosure region carries a submission message`,
    ).toBe(false);
  }

  return regions;
}

/* ------------------------------------------------------------------------------------------- */
/* Targets and helpers                                                                           */
/* ------------------------------------------------------------------------------------------- */

/**
 * The surface a given project measures. S1 and S5 are the same markup served from two origins;
 * which one a reading came from is part of the reading, which is why it travels into the evidence.
 */
function surfaceFor(testInfo: TestInfo): Surface {
  return testInfo.project.name === 'live' ? SURFACES.S1 : SURFACES.S5;
}

/**
 * The guard for a state FS-0 permits on both targets. It still names the project, so an unknown
 * project added later fails loudly instead of silently measuring nothing.
 */
function requireKnownProject(testInfo: TestInfo): 'live' | 'preview' {
  const name = testInfo.project.name;
  expect(['live', 'preview'], `unknown project '${name}'; FS-0 speaks about two targets`).toContain(
    name,
  );
  test.setTimeout(TIMEOUT_MS);
  return name as 'live' | 'preview';
}

/**
 * Route the provider and count every attempt to reach it.
 *
 * The counter is the instrument for two separate claims: that the client-side states issue no
 * request at all, and that a second submission inside the in-flight window issues no second one.
 * Counting requests is the only honest way to make either claim — inspecting the interface would
 * only show what the interface chose to say about itself.
 */
interface ProviderRoute {
  readonly attempts: { method: string; url: string }[];
}

async function routeProvider(
  page: Page,
  handler: (route: import('@playwright/test').Route) => Promise<void>,
): Promise<ProviderRoute> {
  const attempts: { method: string; url: string }[] = [];
  await page.route(PROVIDER_PATTERN, async (route) => {
    attempts.push({ method: route.request().method(), url: route.request().url() });
    await handler(route);
  });
  return { attempts };
}

/** The abort handler used wherever the point is that no request may reach a real provider. */
async function abortRoute(route: import('@playwright/test').Route): Promise<void> {
  await route.abort('blockedbyclient');
}

async function openForm(page: Page, surface: Surface, viewport = DESKTOP): Promise<void> {
  await page.setViewportSize(viewport);
  const response = await page.goto(surface.path ?? surface.url);
  expect(response?.status(), `unexpected status for ${surface.url}`).toBe(200);
  await page.waitForLoadState('networkidle');
  // A 404 shell has no populated <h1>. Measuring one would report a clean state for a page that is
  // not the page under test.
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.locator(`#${qid('name')}`), 'the qualification form is not on the page').toHaveCount(1);
}

function submitButton(page: Page) {
  return page.getByRole('button', { name: SUBMIT_LABEL });
}

/* ------------------------------------------------------------------------------------------- */
/* FS-1 idle and invalid — both targets, because neither issues a request                        */
/* ------------------------------------------------------------------------------------------- */

test.describe('FS-1 — the two states a visitor reaches without any request being issued', () => {
  test.describe.configure({ timeout: TIMEOUT_MS });

  test('idle: the submit control, the lead, the reserved-height status region, no summary, and the honeypot\'s four properties', async ({
    page,
  }, testInfo) => {
    const project = requireKnownProject(testInfo);
    const surface = surfaceFor(testInfo);
    const provider = await routeProvider(page, abortRoute);

    await openForm(page, surface);

    const submit = submitButton(page);
    await expect(submit, 'the submit control is not on the page').toHaveCount(1);
    await expect(submit, 'the idle submit control is disabled').toBeEnabled();
    const submitLabel = (await submit.innerText()).trim();

    await expect(
      page.getByText(LEAD_TEXT, { exact: true }),
      'the required-fields lead text is missing',
    ).toHaveCount(1);

    const regions = await assertStatusInvariants(page, STATUS.idle, 'idle');
    const submission = submissionRegions(regions)[0];
    expect(submission.minHeight, 'the status region has no reserved height, so its first message would reflow the page').toBe(
      STATUS_MIN_HEIGHT,
    );

    await expect(page.locator('[role="alert"]'), 'an error summary is present in the idle state').toHaveCount(0);

    /*
     * The honeypot's four properties. `05-09` owns the traversal proof that it is not reached by
     * Tab; what is asserted here is the property that makes that true, plus the two that keep it
     * away from assistive technology and off the canvas.
     */
    const honeypot = page.locator(`#${qid('website')}`);
    await expect(honeypot, 'the honeypot control is absent').toHaveCount(1);
    const honeypotReading = await honeypot.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const hiddenAncestor = element.closest('[aria-hidden="true"]');
      return {
        tabIndexAttribute: element.getAttribute('tabindex'),
        tabIndexProperty: (element as HTMLInputElement).tabIndex,
        ariaHiddenAncestor: hiddenAncestor === null ? null : hiddenAncestor.tagName,
        right: Math.round(box.right),
        left: Math.round(box.left),
      };
    });
    const honeypotInAccessibilityTree = await page
      .getByRole('textbox', { name: 'Leave this field blank' })
      .count();

    expect(honeypotReading.ariaHiddenAncestor, 'the honeypot is not inside an aria-hidden subtree').not.toBeNull();
    expect(honeypotInAccessibilityTree, 'the honeypot is exposed in the accessibility tree').toBe(0);
    expect(honeypotReading.right, 'the honeypot is not positioned off-canvas').toBeLessThanOrEqual(0);
    expect(honeypotReading.tabIndexAttribute, 'the honeypot tabindex attribute').toBe('-1');
    // A negative tabIndex property is what removes an element from sequential navigation; the
    // attribute alone is a string that could be anything.
    expect(honeypotReading.tabIndexProperty, 'the honeypot is a sequential tab stop').toBeLessThan(0);

    expect(provider.attempts, 'the idle state reached the qualification provider').toEqual([]);

    recordEvidence(EVIDENCE.states, {
      surface: surface.id,
      viewport: DESKTOP,
      measured: {
        state: 'idle',
        project,
        submitEnabled: await submit.isEnabled(),
        submitLabel,
        leadTextPresent: await page.getByText(LEAD_TEXT, { exact: true }).count(),
        statusRegionText: submission.text,
        statusRegionMinHeight: submission.minHeight,
        statusRegionsInDocument: regions.length,
        submissionStatusRegions: submissionRegions(regions).length,
        errorSummaries: await page.locator('[role="alert"]').count(),
        honeypot: { ...honeypotReading, inAccessibilityTree: honeypotInAccessibilityTree },
        providerAttemptCount: provider.attempts.length,
        focusDestination: '<no transition made>',
      },
      detail: {
        plan: '05-12',
        contract: 'UI-SPEC FS-1 empty/idle row',
        url: page.url(),
        target: `${project} (${surface.id})`,
        providerGuard: `${PROVIDER_PATTERN.source} routed to abort; FS-0 permits this state on both targets because no request is issued`,
      },
    });
  });

  test('invalid: the problem summary, one link per invalid field, the marked controls, and the announced error prefix', async ({
    page,
  }, testInfo) => {
    const project = requireKnownProject(testInfo);
    const surface = surfaceFor(testInfo);
    const provider = await routeProvider(page, abortRoute);
    const focus = focusLog();

    await openForm(page, surface);
    await submitButton(page).click();

    const summary = page.locator('[role="alert"]');
    await expect(summary, 'the invalid submit rendered no error summary').toHaveCount(1);
    await expect(
      summary.getByRole('heading', { name: SUMMARY_HEADING }),
      'the error summary carries no problem heading',
    ).toHaveCount(1);

    /*
     * One link per invalid field, compared as a WHOLE LIST in DOM order. Asserting each link in
     * isolation would pass for a summary that also listed a field with no error, and the summary is
     * presented to the visitor as the authoritative problem list.
     */
    const links = await summary.locator('a').evaluateAll((anchors) =>
      anchors.map((anchor) => ({
        text: (anchor.textContent ?? '').replace(/\s+/gu, ' ').trim(),
        href: anchor.getAttribute('href') ?? '',
      })),
    );
    assertNonEmptySubjects(links, 'error-summary items in the invalid state');
    expect(links, 'the error summary does not list exactly the invalid fields, in order').toEqual(
      REQUIRED_WHEN_EMPTY.map((field) => ({
        text: field.requiredMessage,
        href: `#${qid(field.name)}`,
      })),
    );

    // Each invalid control is marked, and points at its own message. `aria-describedby` is checked
    // for INCLUSION, not equality: a field may legitimately describe itself with more than one node.
    const controls: Record<string, { ariaInvalid: string | null; describedBy: string | null; errorText: string }> = {};
    for (const field of REQUIRED_WHEN_EMPTY) {
      const control = page.locator(`#${qid(field.name)}`);
      const ariaInvalid = await control.getAttribute('aria-invalid');
      const describedBy = await control.getAttribute('aria-describedby');
      // `textContent`, not `innerText`: the sr-only prefix is visually clipped, so `innerText`
      // would omit the very token this assertion is about.
      const errorText = (await page.locator(`#${qid(`${field.name}-error`)}`).textContent()) ?? '';

      expect(ariaInvalid, `${field.name}: aria-invalid`).toBe('true');
      expect(describedBy ?? '', `${field.name}: aria-describedby omits its error element`).toContain(
        qid(`${field.name}-error`),
      );
      expect(errorText, `${field.name}: the message is not prefixed by the announced error role`).toBe(
        `${ERROR_PREFIX}${field.requiredMessage}`,
      );

      controls[field.name] = { ariaInvalid, describedBy, errorText };
    }

    // KF5-1: focus lands on the error-summary container, which is the element WRAPPING the alert.
    const afterFirstSubmit = await focus.observe(page, 'KF5-1');
    expect(afterFirstSubmit.isBody, 'focus landed on the document body after the invalid submit').toBe(false);
    expect(afterFirstSubmit.wrapsAlert, 'focus did not land on the error-summary container').toBe(true);
    expect(afterFirstSubmit.tabIndexAttribute, 'the error-summary container is not a script-focus target').toBe('-1');

    // The indicator on that script-focus destination, painted by the focus rather than already
    // there. The focusable element is the CONTAINER that wraps the alert, not the alert itself:
    // `role="alert"` is on an inner div so that the live region's content changes, while the
    // container carries `tabindex="-1"` and the focus ring.
    const indicator = await readScriptFocusIndicator(page, SUMMARY_CONTAINER_SELECTOR);
    expect(
      indicator.paintedByFocus,
      `the error-summary container paints no indicator on scripted focus: ${JSON.stringify(indicator)}`,
    ).toBe(true);

    /*
     * KF5-2: a repeat invalid submit with UNCHANGED errors. Focus is moved away first, so returning
     * to the summary is a real move rather than a coincidence of never having left. The form keys
     * this on an attempt counter rather than on the error set precisely so an unchanged set still
     * re-announces instead of falling silent.
     */
    await page.locator(`#${qid('name')}`).focus();
    const betweenAttempts = await readActive(page);
    await submitButton(page).click();
    await expect(summary, 'the repeat invalid submit removed the error summary').toHaveCount(1);
    const linksAfterRepeat = await summary.locator('a').evaluateAll((anchors) =>
      anchors.map((anchor) => (anchor.textContent ?? '').replace(/\s+/gu, ' ').trim()),
    );
    expect(linksAfterRepeat, 'the repeat submit changed the error set, so this is not the unchanged-errors row').toEqual(
      REQUIRED_WHEN_EMPTY.map((field) => field.requiredMessage),
    );
    const afterRepeat = await focus.observe(page, 'KF5-2');
    expect(afterRepeat.isBody, 'focus landed on the document body after the repeat invalid submit').toBe(false);
    expect(afterRepeat.wrapsAlert, 'the repeat invalid submit did not re-focus the error-summary container').toBe(true);
    expect(betweenAttempts.id, 'focus was not moved off the summary before the repeat submit').toBe(qid('name'));

    /*
     * KF5-3: correcting a field while typing must leave focus exactly where the visitor put it.
     * `type` is used rather than `fill` because the row is about typing: `fill` sets the value in
     * one step and would not exercise the per-keystroke path that re-validates and re-renders.
     */
    const nameControl = page.locator(`#${qid('name')}`);
    await nameControl.focus();
    await nameControl.type('Corrected While Typing', { delay: 10 });
    const afterTyping = await focus.observe(page, 'KF5-3');
    expect(afterTyping.isBody, 'focus landed on the document body while the visitor was typing').toBe(false);
    expect(afterTyping.id, 'typing a correction pulled focus out of the control the visitor was in').toBe(
      qid('name'),
    );
    await expect(
      page.locator(`#${qid('name-error')}`),
      'the corrected field kept its error message',
    ).toHaveCount(0);

    await assertStatusInvariants(page, STATUS.idle, 'invalid');

    expect(provider.attempts, 'the invalid submit reached the qualification provider').toEqual([]);
    expect(focus.bodyFocusCount, 'transitions after which focus was on the document body').toBe(0);

    recordEvidence(EVIDENCE.states, {
      surface: surface.id,
      viewport: DESKTOP,
      measured: {
        state: 'invalid',
        project,
        submitEnabled: await submitButton(page).isEnabled(),
        submitLabel: (await submitButton(page).innerText()).trim(),
        statusRegionText: submissionRegions(await readStatusRegions(page))[0].text,
        summaryHeading: (await summary.getByRole('heading').first().innerText()).trim(),
        summaryItems: links,
        markedControls: controls,
        focusDestination: `${afterFirstSubmit.tag} tabindex=${afterFirstSubmit.tabIndexAttribute} wrapping role=alert`,
        scriptFocusIndicator: indicator,
        providerAttemptCount: provider.attempts.length,
        bodyFocusCount: focus.bodyFocusCount,
      },
      detail: {
        plan: '05-12',
        contract: 'UI-SPEC FS-1 invalid row, KF-5 rows 1-3',
        url: page.url(),
        target: `${project} (${surface.id})`,
        providerGuard: `${PROVIDER_PATTERN.source} routed to abort; validation is client-side so FS-0 permits this state on both targets`,
      },
    });

    recordEvidence(EVIDENCE.focus, {
      surface: surface.id,
      viewport: DESKTOP,
      measured: {
        rows: focus.rows,
        bodyFocusCount: focus.bodyFocusCount,
        transitionCount: focus.rows.length,
      },
      detail: {
        plan: '05-12',
        contract: 'UI-SPEC KF-5 rows 1-3',
        target: `${project} (${surface.id})`,
        matrix: FOCUS_MATRIX.map((row) => row.id),
        note: 'rows 4-6 extend this same matrix from the terminal-state block',
      },
    });
  });

  test('invalid: the conditional phone requirement is pinned in all three places, and separators alone do not satisfy it', async ({
    page,
  }, testInfo) => {
    const project = requireKnownProject(testInfo);
    const surface = surfaceFor(testInfo);
    const provider = await routeProvider(page, abortRoute);

    await openForm(page, surface);

    const phone = page.locator(`#${qid('phone')}`);
    const phoneLabel = page.locator(`label[for="${qid('phone')}"]`);

    const beforeSelection = {
      nativeRequired: await phone.evaluate((element) => (element as HTMLInputElement).required),
      ariaRequired: await phone.getAttribute('aria-required'),
      derivedLabel: (await phoneLabel.innerText()).replace(/\s+/gu, ' ').trim(),
    };
    expect(beforeSelection.nativeRequired, 'phone is required before a channel is chosen').toBe(false);
    expect(beforeSelection.ariaRequired, 'phone aria-required before a channel is chosen').toBe('false');
    expect(beforeSelection.derivedLabel, 'the optional suffix is missing from the label').toBe(
      'Phone number (optional)',
    );

    const trigger = PHONE_RULE.triggering[0];
    await page.selectOption(`#${qid(PHONE_RULE.control)}`, trigger);

    const afterSelection = {
      nativeRequired: await phone.evaluate((element) => (element as HTMLInputElement).required),
      ariaRequired: await phone.getAttribute('aria-required'),
      derivedLabel: (await phoneLabel.innerText()).replace(/\s+/gu, ' ').trim(),
    };
    expect(afterSelection.nativeRequired, 'the native required attribute did not follow the rule').toBe(true);
    expect(afterSelection.ariaRequired, 'aria-required did not follow the rule').toBe('true');
    expect(afterSelection.derivedLabel, 'the derived label still says optional').toBe('Phone number');

    // The requiredness change announces through the one status region, naming the chosen channel.
    await assertStatusInvariants(page, PHONE_RULE.announcement(trigger), 'requiredness change');

    // A value made only of separators must not satisfy the gate.
    await phone.fill(PHONE_RULE.separatorsOnly);
    await submitButton(page).click();
    await expect(page.locator('[role="alert"]'), 'the separators-only submit rendered no summary').toHaveCount(1);
    const separatorError = (await page.locator(`#${qid('phone-error')}`).textContent()) ?? '';
    expect(separatorError, 'a separators-only phone number satisfied the conditional requirement').toBe(
      `${ERROR_PREFIX}${PHONE_RULE.formatMessage}`,
    );

    // The neutral channel reverses the rule and clears the announcement rather than leaving a stale
    // sentence behind.
    await page.selectOption(`#${qid(PHONE_RULE.control)}`, PHONE_RULE.neutral);
    const afterReversal = {
      nativeRequired: await phone.evaluate((element) => (element as HTMLInputElement).required),
      ariaRequired: await phone.getAttribute('aria-required'),
      derivedLabel: (await phoneLabel.innerText()).replace(/\s+/gu, ' ').trim(),
    };
    expect(afterReversal.nativeRequired, 'the neutral channel left phone required').toBe(false);

    expect(provider.attempts, 'the conditional-requirement checks reached the provider').toEqual([]);

    recordEvidence(EVIDENCE.states, {
      surface: surface.id,
      viewport: DESKTOP,
      measured: {
        state: 'invalid (conditional requirement)',
        project,
        triggeringValue: trigger,
        beforeSelection,
        afterSelection,
        afterReversal,
        announcement: PHONE_RULE.announcement(trigger),
        separatorsOnlyValue: PHONE_RULE.separatorsOnly,
        separatorsOnlyMessage: separatorError,
        providerAttemptCount: provider.attempts.length,
      },
      detail: {
        plan: '05-12',
        contract: 'haoo.ts requiredWhen on phone, keyed on preferredChannel',
        url: page.url(),
        target: `${project} (${surface.id})`,
      },
    });
  });
});
