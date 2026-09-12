import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

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

/** The in-flight submit label, `src/components/qualify-form.logic.ts:20`. */
const SUBMITTING_LABEL = 'Sending…';

/** The confirmation heading, `src/components/QualifyForm.tsx:51`. */
const CONFIRMATION_HEADING = 'Your details are on their way';

/** The recovery-panel heading, shared by the failed and blocked states (`QualifyFallback.tsx`). */
const FALLBACK_HEADING = "We couldn't send your details";

/** The retry control, offered on transport failure and withheld on a blocked submission. */
const RETRY_LABEL = 'Try sending again';

/** The follow-up prompt in the confirmation card (`QualifyForm.tsx`). */
const FOLLOW_UP_PROMPT = 'Need an answer sooner?';

/**
 * Body copy, cited from `src/products/copy.ts` rather than retyped from the design.
 *
 * The confirmation body is the one string in this file that a reader is most likely to
 * over-read. It says the details were SUBMITTED. It does not say they were delivered, because
 * this page cannot observe delivery — only that the provider accepted the request.
 */
const CONFIRMATION_BODY =
  "Your details were submitted. If you don't hear back within one business day, use one of the contacts below.";
const FAILED_BODY =
  'Something went wrong between this page and our email provider. Your answers are still here, so you can try again — or reach HAOO directly.';
const BLOCKED_BODY =
  "This page couldn't prepare your details for sending, so nothing was sent. Your answers are still here — please reach HAOO directly.";

/** The three direct-contact destinations the recovery panel offers, in the order it lists them. */
const FALLBACK_DESTINATIONS = [
  'https://wa.me/254702188044?text=Hello%20HAOO%2C%20I%20would%20like%20help%20choosing%20the%20best%20way%20to%20get%20started.',
  'tel:+254702188044',
  'mailto:info@haoo.online',
] as const;

/** The two contacts the confirmation card offers instead. */
const CONFIRMATION_DESTINATIONS = [FALLBACK_DESTINATIONS[0], FALLBACK_DESTINATIONS[1]] as const;

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

/** A complete, valid answer set. Distinctive enough to be recognised when read back out. */
const VALID_ANSWERS = {
  name: 'Form State Probe',
  email: 'form-state-probe@example.com',
  preferredChannel: 'Email',
  role: 'Landlord',
  portfolioBand: '1–5 units',
  county: 'Nairobi',
  timeframe: 'Ready now',
} as const;

/**
 * The two optional answers the retention check is made of.
 *
 * They are deliberately optional fields: a lost REQUIRED value would at least resurface as a
 * validation error the next time the visitor submits, but a lost optional one is simply absent from
 * the payload with nothing anywhere to reveal it. The distinctive token is what makes a read-back
 * comparison meaningful rather than a check that the field is merely non-empty.
 */
const DISTINCTIVE_ANSWERS = {
  organization: 'Retained Holdings FS-12-ORG',
  message: 'Distinctive pre-submission answer FS-12-RETAIN-7788',
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

async function readScriptFocusIndicator(target: Locator): Promise<IndicatorReading> {
  await expect(target, 'script-focus indicator: the target did not resolve to one element').toHaveCount(1);

  return target.evaluate((node) => {
    const element = node as HTMLElement;

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
  });
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
 * The FS-0 target guard for a state that may only be exercised on the local mirror.
 *
 * This is the mechanism, not a convention: a failure-state test that ran under `--project=live`
 * would either send junk to a real mailbox or require lying to a real provider on the live origin,
 * so the decision is enforced by skipping rather than by a describe-block title a future edit could
 * move.
 */
function requirePreview(testInfo: TestInfo): Surface {
  test.skip(
    testInfo.project.name !== 'preview',
    'FS-0: this state is induced, and an induced failure state must never reach the live provider',
  );
  test.setTimeout(TIMEOUT_MS);
  return SURFACES.S5;
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

/** Fill every required control with a valid answer, plus any override supplied by the caller. */
async function fillValidly(page: Page, overrides: Record<string, string> = {}): Promise<void> {
  const answers: Record<string, string> = { ...VALID_ANSWERS, ...overrides };

  for (const [name, value] of Object.entries(answers)) {
    const field = FIELDS.find((candidate) => candidate.name === name);
    if (field === undefined) {
      throw new Error(`fillValidly: '${name}' is not a field of this form`);
    }
    if (field.control === 'select') {
      await page.selectOption(`#${qid(name)}`, value);
    } else {
      await page.fill(`#${qid(name)}`, value);
    }
  }
}

/** Every field control's value, read back out of the DOM. `<absent>` where the control is gone. */
async function readValues(page: Page): Promise<Record<string, string>> {
  return page.evaluate(
    (entries) => {
      const values: Record<string, string> = {};
      for (const [name, id] of entries) {
        const element = document.getElementById(id) as HTMLInputElement | null;
        values[name] = element === null ? '<absent>' : element.value;
      }
      return values;
    },
    FIELDS.map((field) => [field.name, qid(field.name)] as const),
  );
}

/** Every field control's disabled flag, plus the honeypot's, read out of the DOM. */
async function readDisabledFlags(page: Page): Promise<Record<string, boolean | null>> {
  return page.evaluate(
    (entries) => {
      const flags: Record<string, boolean | null> = {};
      for (const [name, id] of entries) {
        const element = document.getElementById(id) as HTMLInputElement | null;
        flags[name] = element === null ? null : element.disabled;
      }
      return flags;
    },
    [...FIELDS.map((field) => [field.name, qid(field.name)] as const), ['_honey', qid('website')] as const],
  );
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
    const indicator = await readScriptFocusIndicator(page.locator(SUMMARY_CONTAINER_SELECTOR));
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

/* ------------------------------------------------------------------------------------------- */
/* KF-5 row 4 — activating a summary item moves focus to the field it names                      */
/* ------------------------------------------------------------------------------------------- */

/**
 * This row extends the SAME matrix rows 1-3 belong to, and it runs on BOTH targets.
 *
 * It sits beside the induced-state block because it is part of the matrix that block completes,
 * not because it needs the preview mirror: activating an error-summary link issues no request, so
 * FS-0 permits it live exactly as it permits the invalid submit that produced the summary.
 */
test.describe('KF-5 row 4 — the error summary is a working index into the form', () => {
  test.describe.configure({ timeout: TIMEOUT_MS });

  test('activating a summary item moves focus to the field that item names', async ({
    page,
  }, testInfo) => {
    const project = requireKnownProject(testInfo);
    const surface = surfaceFor(testInfo);
    const provider = await routeProvider(page, abortRoute);
    const focus = focusLog();

    await openForm(page, surface);
    await submitButton(page).click();
    await expect(page.locator('[role="alert"]'), 'no error summary to index from').toHaveCount(1);

    /*
     * Every item, not a sample. The row is "the field that item names" — an implementation that
     * always focused the first field would satisfy a single-item check and fail every visitor who
     * clicked any other line.
     */
    const landings: { item: string; href: string; focused: string }[] = [];
    for (const field of REQUIRED_WHEN_EMPTY) {
      const item = page.locator(`[role="alert"] a[href="#${qid(field.name)}"]`);
      await expect(item, `no summary item targets ${field.name}`).toHaveCount(1);
      await item.click();

      const landed = await focus.observe(page, 'KF5-4');
      expect(landed.isBody, `focus landed on the document body after activating the ${field.name} item`).toBe(false);
      expect(landed.id, `activating the ${field.name} item did not focus that field`).toBe(qid(field.name));

      landings.push({
        item: field.requiredMessage,
        href: `#${qid(field.name)}`,
        focused: landed.id,
      });
    }

    await assertStatusInvariants(page, STATUS.idle, 'summary navigation');
    expect(provider.attempts, 'navigating the summary reached the provider').toEqual([]);
    expect(focus.bodyFocusCount, 'transitions after which focus was on the document body').toBe(0);

    recordEvidence(EVIDENCE.focus, {
      surface: surface.id,
      viewport: DESKTOP,
      measured: {
        rows: focus.rows,
        landings,
        bodyFocusCount: focus.bodyFocusCount,
        transitionCount: focus.rows.length,
      },
      detail: {
        plan: '05-12',
        contract: 'UI-SPEC KF-5 row 4',
        target: `${project} (${surface.id})`,
        method: 'activate every summary item in turn and read document.activeElement after each',
      },
    });
  });
});

/* ------------------------------------------------------------------------------------------- */
/* FS-1 — the four states that may only be induced on the local mirror                           */
/* ------------------------------------------------------------------------------------------- */

/**
 * In-flight, success, transport failure and blocked.
 *
 * Each is induced by ROUTING the runner's own request interception — never by a stub server, never
 * by a build-time flag, and never by an environment variable. A browser-prefixed variable added for
 * the harness would be inlined into the published bundle and would correctly trip the built-tree
 * variable-set gate, which is why this file names no such variable anywhere — not even in a
 * comment, since the gate that proves the absence reads this file as text. The point of routing is
 * that the page under test is the shipped page, unmodified.
 *
 * The blocked state is the one exception to "route the endpoint", because it is by construction a
 * state in which NO request is made: the page refuses to start a submission whose body it could not
 * assemble. It is induced by making the serialisation itself fail, in the browser, before any
 * transport state is entered — which is exactly the condition the shipped code distinguishes from a
 * transport failure.
 */
test.describe('FS-1 — the four states FS-0 confines to the local preview mirror', () => {
  test.describe.configure({ timeout: TIMEOUT_MS });

  test('in-flight: the whole form is locked, the region announces, and a second submission issues no second request', async ({
    page,
  }, testInfo) => {
    const surface = requirePreview(testInfo);

    /** Long enough to make every in-window reading, short enough to stay inside the 15 s budget. */
    const DELAY_MS = 4_000;
    const provider = await routeProvider(page, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ success: 'true' }),
      });
    });

    await openForm(page, surface);
    await fillValidly(page, DISTINCTIVE_ANSWERS);
    await submitButton(page).click();

    const sending = page.getByRole('button', { name: SUBMITTING_LABEL });
    await expect(sending, 'the submit control did not take its sending label').toHaveCount(1);
    await expect(sending, 'the submit control stayed operable while a request was open').toBeDisabled();

    /*
     * Every field control disabled, and this is the assertion that matters most in this file.
     * The request body was serialised from the values captured when the submission started. A
     * correction accepted after that moment is absent from the request already in flight and is
     * then destroyed with the form subtree on success — the visitor would believe they had sent a
     * value that nothing ever carried. Locking the controls makes the window visibly read-only
     * instead of silently discarding the edit.
     */
    const disabledFlags = await readDisabledFlags(page);
    for (const field of FIELDS) {
      expect(disabledFlags[field.name], `${field.name} stayed editable during the request window`).toBe(true);
    }
    /*
     * Observation FS-O2, recorded rather than asserted: the honeypot input is NOT disabled during
     * the window. It is not one of the product's fields, it is `aria-hidden`, off-canvas and out of
     * the tab order, so no visitor can edit it and no correction can be lost in it. Recorded so a
     * reader can see the exception was measured rather than overlooked.
     */
    const honeypotDisabled = disabledFlags._honey;

    await assertStatusInvariants(page, STATUS.submitting, 'in-flight');

    /*
     * The second submission, issued the only way a visitor's browser still could: the submit
     * control is disabled, so the form element is asked to submit itself directly. That path tests
     * the synchronous in-flight guard rather than the disabled attribute, which is feedback rather
     * than the authority that admits a request.
     */
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form === null) throw new Error('the form is not mounted');
      (form as HTMLFormElement).requestSubmit();
    });
    await page.waitForTimeout(500);
    const attemptsDuringWindow = provider.attempts.length;

    await expect(
      page.getByRole('heading', { name: CONFIRMATION_HEADING }),
      'the delayed request never reached a terminal state',
    ).toBeVisible({ timeout: 30_000 });
    const attemptsAfterSettling = provider.attempts.length;

    expect(attemptsDuringWindow, 'a second submission inside the in-flight window issued a second request').toBe(1);
    expect(attemptsAfterSettling, 'the settled submission issued more than one request in total').toBe(1);

    recordEvidence(EVIDENCE.requests, {
      surface: surface.id,
      viewport: DESKTOP,
      measured: {
        state: 'in-flight',
        delayMs: DELAY_MS,
        submissionsAttempted: 2,
        requestsDuringWindow: attemptsDuringWindow,
        requestsAfterSettling: attemptsAfterSettling,
        requestMethods: provider.attempts.map((attempt) => attempt.method),
      },
      detail: {
        plan: '05-12',
        contract: 'UI-SPEC FS-1 in-flight row',
        target: `preview (${surface.id})`,
        method:
          'the endpoint routed to a delayed response; the second submission issued through form.requestSubmit() because the submit control is disabled',
      },
    });

    recordEvidence(EVIDENCE.states, {
      surface: surface.id,
      viewport: DESKTOP,
      measured: {
        state: 'in-flight',
        project: 'preview',
        submitEnabled: false,
        submitLabel: SUBMITTING_LABEL,
        statusRegionText: STATUS.submitting,
        disabledFieldControls: FIELDS.filter((field) => disabledFlags[field.name] === true).length,
        fieldControlCount: FIELDS.length,
        honeypotDisabled,
        requestsDuringWindow: attemptsDuringWindow,
        focusDestination: '<no focus move: the in-flight state moves no focus>',
      },
      detail: {
        plan: '05-12',
        contract: 'UI-SPEC FS-1 in-flight row',
        target: `preview (${surface.id})`,
        observationFsO2:
          'the honeypot input is not disabled during the window; it is not a product field, is aria-hidden, off-canvas and out of the tab order, so no visitor edit can be lost in it',
      },
    });
  });

  test('success: the card is replaced, the confirmation heading takes focus, and the region reports what the browser saw', async ({
    page,
  }, testInfo) => {
    const surface = requirePreview(testInfo);
    const focus = focusLog();
    const provider = await routeProvider(page, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ success: 'true' }),
      });
    });

    await openForm(page, surface);
    await fillValidly(page, DISTINCTIVE_ANSWERS);
    await submitButton(page).click();

    const confirmation = page.getByRole('heading', { name: CONFIRMATION_HEADING });
    await expect(confirmation, 'the confirmation card did not render').toBeVisible({ timeout: 30_000 });

    // The form subtree is REPLACED, not hidden: a hidden form would still hold focusable controls.
    await expect(page.locator('form'), 'the form subtree survived the success state').toHaveCount(0);

    const card = page.locator(`div:has(> h3:text-is("${CONFIRMATION_HEADING}"))`).first();
    await expect(
      card.getByText(CONFIRMATION_BODY, { exact: true }),
      'the confirmation body copy is not the shipped sentence',
    ).toHaveCount(1);
    await expect(
      card.getByText(FOLLOW_UP_PROMPT, { exact: true }),
      'the follow-up prompt is missing',
    ).toHaveCount(1);

    const confirmationLinks = await card
      .locator('a')
      .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href') ?? ''));
    expect(
      assertNonEmptySubjects(confirmationLinks, 'contact links in the confirmation card'),
      'the confirmation card does not offer the two shipped contacts',
    ).toEqual([...CONFIRMATION_DESTINATIONS]);

    // KF5-5: focus moves to the confirmation heading, which is a script-focus destination.
    const landed = await focus.observe(page, 'KF5-5');
    expect(landed.isBody, 'focus landed on the document body after the success transition').toBe(false);
    expect(landed.tag, 'the success transition did not focus the confirmation heading').toBe('H3');
    expect(landed.text, 'the focused element is not the confirmation heading').toBe(CONFIRMATION_HEADING);
    expect(landed.tabIndexAttribute, 'the confirmation heading is not a script-focus target').toBe('-1');

    const indicator = await readScriptFocusIndicator(page.getByRole('heading', { name: CONFIRMATION_HEADING }));
    expect(
      indicator.paintedByFocus,
      `the confirmation heading paints no indicator on scripted focus: ${JSON.stringify(indicator)}`,
    ).toBe(true);

    /*
     * The sent announcement. It reports A BROWSER-OBSERVABLE EVENT — this page saw the provider
     * accept the request — and it is NEVER a delivery claim. Nothing here observes a mailbox, and
     * no reading in this file may be cited as evidence that one received anything. Delivery is
     * established by the mail-chain record, not by this assertion.
     */
    const regions = await assertStatusInvariants(page, STATUS.succeeded, 'success');

    expect(focus.bodyFocusCount, 'transitions after which focus was on the document body').toBe(0);

    recordEvidence(EVIDENCE.states, {
      surface: surface.id,
      viewport: DESKTOP,
      measured: {
        state: 'success',
        project: 'preview',
        formElements: await page.locator('form').count(),
        confirmationHeading: CONFIRMATION_HEADING,
        confirmationBody: CONFIRMATION_BODY,
        followUpPrompt: FOLLOW_UP_PROMPT,
        confirmationLinks,
        statusRegionText: submissionRegions(regions)[0].text,
        statusRegionsInDocument: regions.length,
        focusDestination: `${landed.tag} tabindex=${landed.tabIndexAttribute} "${landed.text}"`,
        scriptFocusIndicator: indicator,
        requestCount: provider.attempts.length,
        submitEnabled: '<absent: the submit control was replaced with the confirmation card>',
        submitLabel: '<absent: the submit control was replaced with the confirmation card>',
      },
      detail: {
        plan: '05-12',
        contract: 'UI-SPEC FS-1 success row',
        target: `preview (${surface.id})`,
        claimBoundary:
          'the sent announcement is a browser-observable claim that the provider accepted the request; it is not a delivery claim and must never be recorded as one',
      },
    });
  });

  test('transport failure: the recovery panel takes focus, the retry is offered, and the visitor keeps every answer', async ({
    page,
  }, testInfo) => {
    const surface = requirePreview(testInfo);
    const focus = focusLog();
    const provider = await routeProvider(page, async (route) => {
      await route.abort('failed');
    });

    await openForm(page, surface);
    await fillValidly(page, DISTINCTIVE_ANSWERS);
    const before = await readValues(page);
    await submitButton(page).click();

    const fallback = page.getByRole('heading', { name: FALLBACK_HEADING });
    await expect(fallback, 'the recovery panel did not render').toBeVisible({ timeout: 30_000 });

    const panel = page.locator(`div:has(> h3:text-is("${FALLBACK_HEADING}"))`).first();
    await expect(
      panel.getByText(FAILED_BODY, { exact: true }),
      'the failure body copy is not the shipped sentence',
    ).toHaveCount(1);
    await expect(
      panel.getByRole('button', { name: RETRY_LABEL }),
      'a transport failure offered no retry, though repeating it could succeed',
    ).toHaveCount(1);

    const panelLinks = await panel
      .locator('a')
      .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href') ?? ''));
    expect(
      assertNonEmptySubjects(panelLinks, 'direct-contact links in the recovery panel'),
      'the recovery panel does not offer the three shipped direct contacts',
    ).toEqual([...FALLBACK_DESTINATIONS]);

    // The form remains mounted and editable, and every answer is still there.
    await expect(page.locator('form'), 'the form was unmounted by a transport failure').toHaveCount(1);
    await expect(page.locator(`#${qid('name')}`), 'the form is not editable after a failure').toBeEditable();
    const after = await readValues(page);
    expect(after, 'the visitor lost answers to a transport failure').toEqual(before);
    expect(after.organization, 'the distinctive organization answer was not retained').toBe(
      DISTINCTIVE_ANSWERS.organization,
    );
    expect(after.message, 'the distinctive message answer was not retained').toBe(
      DISTINCTIVE_ANSWERS.message,
    );

    const landed = await focus.observe(page, 'KF5-6');
    expect(landed.isBody, 'focus landed on the document body after the failure transition').toBe(false);
    expect(landed.text, 'the failure transition did not focus the recovery heading').toBe(FALLBACK_HEADING);
    expect(landed.tabIndexAttribute, 'the recovery heading is not a script-focus target').toBe('-1');

    const indicator = await readScriptFocusIndicator(page.getByRole('heading', { name: FALLBACK_HEADING }));
    expect(
      indicator.paintedByFocus,
      `the recovery heading paints no indicator on scripted focus: ${JSON.stringify(indicator)}`,
    ).toBe(true);

    const regions = await assertStatusInvariants(page, STATUS.failed, 'transport failure');
    expect(focus.bodyFocusCount, 'transitions after which focus was on the document body').toBe(0);

    recordEvidence(EVIDENCE.states, {
      surface: surface.id,
      viewport: DESKTOP,
      measured: {
        state: 'transport failure',
        project: 'preview',
        submitEnabled: await submitButton(page).isEnabled(),
        submitLabel: (await submitButton(page).innerText()).trim(),
        statusRegionText: submissionRegions(regions)[0].text,
        statusRegionsInDocument: regions.length,
        fallbackBody: FAILED_BODY,
        retryControls: await panel.getByRole('button', { name: RETRY_LABEL }).count(),
        panelLinks,
        formElements: await page.locator('form').count(),
        valuesBefore: before,
        valuesAfter: after,
        focusDestination: `${landed.tag} tabindex=${landed.tabIndexAttribute} "${landed.text}"`,
        scriptFocusIndicator: indicator,
        requestCount: provider.attempts.length,
      },
      detail: {
        plan: '05-12',
        contract: 'UI-SPEC FS-1 failed row',
        target: `preview (${surface.id})`,
        method: 'the endpoint routed to an aborted response',
      },
    });
  });

  test('blocked: the same panel with no retry, because a blocked submission is deterministic', async ({
    page,
  }, testInfo) => {
    const surface = requirePreview(testInfo);
    const focus = focusLog();
    const provider = await routeProvider(page, abortRoute);

    /*
     * Force the serialisation to fail, in the browser, before any transport state is entered.
     *
     * The shipped code assembles the request body OUTSIDE its transport `try`, precisely so a
     * product misconfiguration is not reported as an email-provider failure behind a retry that
     * could never succeed. The patch below throws only for the submission body — identified by the
     * provider option every such body carries — so nothing else on the page is affected.
     */
    await page.addInitScript(() => {
      const native = JSON.stringify;
      const patched = (value: unknown, ...rest: unknown[]): string => {
        if (
          value !== null &&
          typeof value === 'object' &&
          Object.prototype.hasOwnProperty.call(value, '_subject')
        ) {
          throw new TypeError('05-12: serialisation forced to fail');
        }
        return (native as unknown as (...args: unknown[]) => string)(value, ...rest);
      };
      (JSON as unknown as { stringify: unknown }).stringify = patched;
    });

    await openForm(page, surface);
    await fillValidly(page, DISTINCTIVE_ANSWERS);
    const before = await readValues(page);
    await submitButton(page).click();

    const fallback = page.getByRole('heading', { name: FALLBACK_HEADING });
    await expect(fallback, 'the recovery panel did not render for a blocked submission').toBeVisible({
      timeout: 30_000,
    });

    const panel = page.locator(`div:has(> h3:text-is("${FALLBACK_HEADING}"))`).first();
    await expect(
      panel.getByText(BLOCKED_BODY, { exact: true }),
      'the blocked body copy is not the shipped sentence, or it borrowed the provider-naming one',
    ).toHaveCount(1);

    /*
     * The ABSENCE of the retry control, asserted rather than left unstated. A blocked submission is
     * deterministic: the cause is this page's own inability to assemble the request, so repeating
     * the attempt would fail identically. Offering a retry would be a lie told to a visitor who has
     * already typed their enquiry, and asserting the absence is what makes a future change that
     * offers one redden this run instead of shipping quietly.
     */
    await expect(
      page.getByRole('button', { name: RETRY_LABEL }),
      'the blocked state offered a retry, which could only ever fail again',
    ).toHaveCount(0);

    const panelLinks = await panel
      .locator('a')
      .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href') ?? ''));
    expect(panelLinks, 'the blocked panel does not offer the three shipped direct contacts').toEqual([
      ...FALLBACK_DESTINATIONS,
    ]);

    await expect(page.locator('form'), 'the form was unmounted by a blocked submission').toHaveCount(1);
    const after = await readValues(page);
    expect(after, 'the visitor lost answers to a blocked submission').toEqual(before);

    const landed = await focus.observe(page, 'KF5-6');
    expect(landed.isBody, 'focus landed on the document body after the blocked transition').toBe(false);
    expect(landed.text, 'the blocked transition did not focus the recovery heading').toBe(FALLBACK_HEADING);

    const indicator = await readScriptFocusIndicator(page.getByRole('heading', { name: FALLBACK_HEADING }));
    expect(
      indicator.paintedByFocus,
      `the recovery heading paints no indicator on scripted focus after a blocked submission: ${JSON.stringify(indicator)}`,
    ).toBe(true);

    const regions = await assertStatusInvariants(page, STATUS.blocked, 'blocked');

    // Nothing was sent, and that is the defining fact of this state rather than a side effect.
    expect(provider.attempts, 'a blocked submission reached the provider').toEqual([]);
    expect(focus.bodyFocusCount, 'transitions after which focus was on the document body').toBe(0);

    recordEvidence(EVIDENCE.states, {
      surface: surface.id,
      viewport: DESKTOP,
      measured: {
        state: 'blocked',
        project: 'preview',
        submitEnabled: await submitButton(page).isEnabled(),
        submitLabel: (await submitButton(page).innerText()).trim(),
        statusRegionText: submissionRegions(regions)[0].text,
        statusRegionsInDocument: regions.length,
        blockedBody: BLOCKED_BODY,
        retryControls: await page.getByRole('button', { name: RETRY_LABEL }).count(),
        panelLinks,
        formElements: await page.locator('form').count(),
        valuesBefore: before,
        valuesAfter: after,
        focusDestination: `${landed.tag} tabindex=${landed.tabIndexAttribute} "${landed.text}"`,
        scriptFocusIndicator: indicator,
        requestCount: provider.attempts.length,
      },
      detail: {
        plan: '05-12',
        contract: 'UI-SPEC FS-1 blocked row',
        target: `preview (${surface.id})`,
        method:
          'JSON.stringify patched in the browser to throw for the submission body only, so the page refuses to start a submission it cannot assemble',
      },
    });

    recordEvidence(EVIDENCE.requests, {
      surface: surface.id,
      viewport: DESKTOP,
      measured: {
        state: 'blocked',
        submissionsAttempted: 1,
        requestsIssued: provider.attempts.length,
      },
      detail: {
        plan: '05-12',
        contract: 'UI-SPEC FS-1 blocked row',
        target: `preview (${surface.id})`,
        note: 'a blocked submission is defined by no request being made; the zero is the measurement',
      },
    });
  });

  test('FS-2: the status region survives every transition, holds one message at a time, and announces in the specified order', async ({
    page,
  }, testInfo) => {
    const surface = requirePreview(testInfo);

    /**
     * One handler, three behaviours. Re-routing mid-test would leave two handlers racing for the
     * same pattern; a mode the handler reads keeps the interception single and its order explicit.
     */
    const mode = { current: 'abort' as 'abort' | 'delay' };
    const provider = await routeProvider(page, async (route) => {
      if (mode.current === 'delay') {
        await new Promise((resolve) => setTimeout(resolve, 4_000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' },
          body: JSON.stringify({ success: 'true' }),
        });
        return;
      }
      await route.abort('failed');
    });

    await openForm(page, surface);

    const timeline: { at: string; regionsInDocument: number; submissionRegions: number; text: string }[] = [];
    const capture = async (at: string, expected: string) => {
      const regions = await assertStatusInvariants(page, expected, at);
      timeline.push({
        at,
        regionsInDocument: regions.length,
        submissionRegions: submissionRegions(regions).length,
        text: submissionRegions(regions)[0].text,
      });
    };

    await capture('first render', STATUS.idle);

    await fillValidly(page);
    await capture('filled, before any submission', STATUS.idle);

    await submitButton(page).click();
    await expect(page.getByRole('heading', { name: FALLBACK_HEADING })).toBeVisible({ timeout: 30_000 });
    await capture('after a transport failure', STATUS.failed);

    /*
     * Precedence, part one: a requiredness change outranks an already-read terminal message. The
     * form stays mounted and editable after a failure, so a stale "we couldn't send" must never
     * suppress a live announcement about a control the visitor just changed.
     */
    const trigger = PHONE_RULE.triggering[1];
    await page.selectOption(`#${qid(PHONE_RULE.control)}`, trigger);
    await capture('requiredness change after a terminal message', PHONE_RULE.announcement(trigger));

    /*
     * Precedence, part two: the submitting announcement outranks everything, including the
     * requiredness sentence that is holding the region at this moment.
     */
    mode.current = 'delay';
    await page.fill(`#${qid('phone')}`, '+254 702 188 044');
    await submitButton(page).click();
    await capture('submitting, with a requiredness sentence outstanding', STATUS.submitting);

    await expect(page.getByRole('heading', { name: CONFIRMATION_HEADING })).toBeVisible({ timeout: 30_000 });
    await capture('after success, with the form card replaced', STATUS.succeeded);

    /*
     * The region outlived the card that was replaced. That is the whole reason it is mounted
     * outside the form: a region inside the card would have unmounted at the exact moment it needed
     * to announce.
     */
    const finalRegions = await readStatusRegions(page);
    expect(submissionRegions(finalRegions).length, 'the submission region did not survive the card replacement').toBe(1);
    expect(finalRegions.filter((region) => region.insideForm).length, 'a form-scoped status region survived the form').toBe(0);

    for (const entry of timeline) {
      expect(entry.submissionRegions, `${entry.at}: submission status regions`).toBe(1);
    }

    recordEvidence(EVIDENCE.statusRegion, {
      surface: surface.id,
      viewport: DESKTOP,
      measured: {
        timeline,
        transitionsObserved: timeline.length,
        submissionRegionsPerTransition: timeline.map((entry) => entry.submissionRegions),
        documentRegionsPerTransition: timeline.map((entry) => entry.regionsInDocument),
        requestCount: provider.attempts.length,
      },
      detail: {
        plan: '05-12',
        contract: 'UI-SPEC FS-2',
        target: `preview (${surface.id})`,
        observationFsO1:
          'the document carries two role="status" regions in every state that renders the form: the submission region outside the form card, and the measurement disclosure\'s clear-context region inside it. The success state leaves one, because the form card carrying the second was replaced. FS-2\'s "exactly one" is true of the submission region and false of the document.',
      },
    });
  });
});
