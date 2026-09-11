import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { recordEvidence } from './fixtures/evidence';
import { PRIMARY_ACTIONS } from './fixtures/primary-actions';
import { SURFACES, assertNonEmptySubjects, type Surface } from './fixtures/surfaces';
import { VIEWPORTS, assertNonEmptyViewports, type ViewportEntry } from './fixtures/viewports';

/**
 * QUAL-02's keyboard half on the live HAOO page (`05-UI-SPEC.md` § Keyboard and Focus Contract).
 *
 * **Division of labour with the static focus-contrast suite (KF-0). Read this before editing.**
 *
 * | Owner                                        | Question it answers                                                        |
 * |----------------------------------------------|----------------------------------------------------------------------------|
 * | `src/test/focus-contrast.test.ts` (vitest)   | Is the DECLARED ring at least 3:1 against its DECLARED offset?             |
 * | this spec (Playwright, live)                 | Does focusing this element by keyboard change its COMPUTED painted indicator at all? |
 *
 * The static suite exists in both repositories. It reads Tailwind literals out of source and
 * gates the ratio, and it owns the ratio. This spec adds the one thing a source read cannot see:
 * that a browser actually paints an indicator, at runtime, under real keyboard modality. It does
 * NOT restate, re-derive or override that gate. `MIN_FOCUS_CONTRAST`, `RING_COLOR_TOKENS`,
 * `DEFAULT_RING_OFFSET`, the ring extractor and the `pairs.length > 0` vacuity guard are out of
 * scope for modification here, and no contrast ratio is computed anywhere in this file. If the
 * two ever seem to disagree, they are answering different questions. Check which question failed
 * before touching either one.
 *
 * Focus is moved ONLY by real key presses (`page.keyboard.press`). `:focus-visible` depends on
 * input modality, so a scripted `element.focus()` would measure a state the keyboard visitor never
 * sees. The script-focus destinations are the one deliberate exception. Their painted state after a
 * scripted focus is the preview-target form-state spec's job (UI-SPEC KF-5), not this file's.
 *
 * Every stop is identified by its DOM position and recorded with the name the page exposes. Stops
 * are never matched against the primary-action list by name, so the known P5/P6 fixture gap (the
 * footer phone and email links are named by the bare value, not "Call …" / "Email …") cannot
 * distort a count here. The footer names are recorded exactly as the page ships them.
 *
 * Every measurement is written through `recordEvidence` BEFORE it is asserted, so a failing run
 * still leaves the reading that failed.
 */

/** The live HAOO page. */
const HAOO = SURFACES.S1;

/** The six-entry closed width list: the five D-09 product widths plus the 320 px reflow width. */
const WIDTHS = assertNonEmptyViewports(VIEWPORTS, 'VIEWPORTS for the keyboard contract');

/** Tailwind's `md` breakpoint: below it the section links are replaced by the navigation toggle. */
const MD_BREAKPOINT_PX = 768;

/** A live network round trip plus a full keyboard traversal does not fit the 30 s default. */
const LIVE_TIMEOUT_MS = 180_000;

/**
 * The bound on Tab presses in one traversal. The live page has about forty stops. A traversal
 * that has not left the document after this many presses has found a cycle or a trap, and the
 * bound turns that into a recorded failure instead of a hung run.
 */
const MAX_TAB_PRESSES = 200;

/** A reverse-tab probe is taken at every Nth stop, spreading the sample across the document. */
const REVERSE_SAMPLE_STRIDE = 5;

/** Evidence file names, one per measurement family. */
const EVIDENCE = {
  traversal: 'keyboard-traversal',
  scriptFocus: 'keyboard-script-focus',
} as const;

/*
 * The expected opening stops (UI-SPEC KF-1), quoted from the shipped markup:
 *   - the skip link label is `skipToContentLabel('HAOO')` (`src/products/copy.ts`), rendered by
 *     `src/pages/ProductPage.tsx:92-94`;
 *   - the parent-site link is `src/components/ProductHeader.tsx:32-37`;
 *   - the five section links are `PRODUCT_LINKS` in `ProductHeader.tsx:11-17`;
 *   - the toggle's closed-state name is `navigationToggleLabel('HAOO', false)`;
 *   - the hero messaging and call actions are P4 and P5, read from the closed list.
 */
const SKIP_LINK_NAME = 'Skip to HAOO content';
const PARENT_LINK_NAME = 'Back to ZERO-PAPER HUB';
const SECTION_LINK_NAMES = ['Benefits', 'Capabilities', 'Brochure', 'Send details', 'Onboarding'] as const;
const NAV_TOGGLE_CLOSED_NAME = 'Open HAOO navigation';

function primaryName(id: string): string {
  const action = PRIMARY_ACTIONS.find((entry) => entry.id === id);
  if (action === undefined) throw new Error(`PRIMARY_ACTIONS no longer carries ${id}`);
  return action.accessibleName;
}
const HERO_MESSAGE_NAME = primaryName('P4');
const HERO_CALL_NAME = primaryName('P5');

/** The honeypot's visible label, quoted from `src/components/QualifyForm.tsx:526`. */
const HONEYPOT_LABEL = 'Leave this field blank';

/** The qualification submit control, P3, from the closed list. */
const SUBMIT_NAME = primaryName('P3');

/** The configured qualification provider's host. Routed to abort so no lead can ever leave. */
const QUALIFY_PROVIDER_PATTERN = /formsubmit\.co/;

interface ExpectedStop {
  readonly tag: string;
  readonly name: string;
}

/** UI-SPEC KF-1's opening sequence for the layout branch this width selects. */
function expectedOpeningStops(width: number): readonly ExpectedStop[] {
  const navigation: readonly ExpectedStop[] =
    width >= MD_BREAKPOINT_PX
      ? SECTION_LINK_NAMES.map((name) => ({ tag: 'a', name }))
      : [{ tag: 'button', name: NAV_TOGGLE_CLOSED_NAME }];
  return [
    { tag: 'a', name: SKIP_LINK_NAME },
    { tag: 'a', name: PARENT_LINK_NAME },
    ...navigation,
    { tag: 'a', name: HERO_MESSAGE_NAME },
    { tag: 'a', name: HERO_CALL_NAME },
  ];
}

/* ------------------------------------------------------------------------------------ *
 * Shared plumbing.
 * ------------------------------------------------------------------------------------ */

/**
 * Confine a test to the live project and give it a live-network budget. A skip rather than a
 * failure: the preview build has no deployed production to traverse.
 */
function requireLive(testInfo: TestInfo): void {
  test.skip(
    testInfo.project.name !== 'live',
    'the keyboard contract traverses the deployed journey and has no referent in the preview build',
  );
  test.setTimeout(LIVE_TIMEOUT_MS);
}

/** Open a surface by the address the closed list declares, and prove it is the real document. */
async function openSurface(page: Page, surface: Surface): Promise<void> {
  const response = await page.goto(surface.path ?? surface.url);
  expect(response?.status(), `unexpected status for ${surface.url}`).toBe(200);
  await page.waitForLoadState('networkidle');
  // A 404 shell has no populated <h1>. Traversing one would record a clean order for a page that
  // is not the page under test.
  await expect(page.locator('h1').first()).toBeVisible();
}

function viewportOf(viewport: ViewportEntry): { width: number; height: number } {
  return { width: viewport.width, height: viewport.height };
}

/* ------------------------------------------------------------------------------------ *
 * Reading the active element.
 * ------------------------------------------------------------------------------------ */

/** What one Tab press landed on. */
interface ActiveReading {
  /** True when focus is on no element of the document (`<body>` or nothing): it has left. */
  readonly left: boolean;
  readonly tag: string;
  /**
   * The name the element exposes, approximated in-page for the record: `aria-labelledby`, then
   * `aria-label`, then the associated `<label>`s, then rendered text. Where an accessible name is
   * load-bearing for an assertion, Playwright's own `toHaveAccessibleName` is used instead.
   */
  readonly name: string;
  /** The element's position in document order: its index in `getElementsByTagName('*')`. */
  readonly domIndex: number;
  readonly tabIndex: number;
  readonly href: string;
  readonly insideMain: boolean;
  readonly insideHeader: boolean;
  readonly insideFooter: boolean;
}

async function readActive(page: Page): Promise<ActiveReading> {
  return page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    const left = active === null || active === document.body || active === document.documentElement;

    const nameOf = (element: HTMLElement): string => {
      const collapse = (text: string | null | undefined): string => (text ?? '').replace(/\s+/g, ' ').trim();
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        return collapse(
          labelledBy
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.innerText ?? '')
            .join(' '),
        );
      }
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel) return collapse(ariaLabel);
      const labels = (element as HTMLInputElement).labels;
      if (labels && labels.length > 0) {
        return collapse(Array.from(labels).map((label) => label.innerText).join(' '));
      }
      return collapse(element.innerText || element.getAttribute('title'));
    };

    const all = document.getElementsByTagName('*');
    return {
      left,
      tag: active === null ? 'null' : active.tagName.toLowerCase(),
      name: active !== null && !left ? nameOf(active) : '',
      domIndex: active === null ? -1 : Array.prototype.indexOf.call(all, active),
      tabIndex: active === null ? 0 : active.tabIndex,
      href: active?.getAttribute('href') ?? '',
      insideMain: active?.closest('main') != null,
      insideHeader: active?.closest('header') != null,
      insideFooter: active?.closest('footer') != null,
    };
  });
}

/* ------------------------------------------------------------------------------------ *
 * The traversal.
 * ------------------------------------------------------------------------------------ */

interface Stop extends ActiveReading {
  /** 1-based position in the traversal. */
  readonly order: number;
}

/** One reverse-tab probe: from a stop, Shift+Tab, then Tab again. */
interface ReverseProbe {
  readonly fromOrder: number;
  readonly fromName: string;
  readonly fromDomIndex: number;
  /** Where Shift+Tab should land: the preceding captured stop, or `-1` meaning "left the document". */
  readonly expectedDomIndex: number;
  readonly landedDomIndex: number;
  readonly landedLeft: boolean;
  readonly landedName: string;
  /** Where the following Tab came back to. */
  readonly returnedDomIndex: number;
  readonly returnedLeft: boolean;
}

interface Traversal {
  readonly stops: readonly Stop[];
  /** Whether a Tab press took focus out of the document before the press bound was reached. */
  readonly exited: boolean;
  /** The number of Tab presses made, including the one that left. */
  readonly tabPresses: number;
  /** A DOM position that was reached twice before leaving (a cycle), or `-1` for none. */
  readonly repeatedDomIndex: number;
  readonly reverseProbes: readonly ReverseProbe[];
}

interface TraversalOptions {
  /** Whether to take a reverse-tab probe at this stop, given the stops captured so far. */
  readonly reverseWhen: (stops: readonly Stop[]) => boolean;
}

/**
 * Shift+Tab from the current stop, then Tab back. `expectedDomIndex` is the stop that should be
 * reached going backwards: the preceding captured stop, or `-1` for the first stop, where going
 * backwards should leave the document.
 */
async function probeReverse(page: Page, from: Stop, expectedDomIndex: number): Promise<ReverseProbe> {
  await page.keyboard.press('Shift+Tab');
  const landed = await readActive(page);
  await page.keyboard.press('Tab');
  const returned = await readActive(page);
  return {
    fromOrder: from.order,
    fromName: from.name,
    fromDomIndex: from.domIndex,
    expectedDomIndex,
    landedDomIndex: landed.left ? -1 : landed.domIndex,
    landedLeft: landed.left,
    landedName: landed.name,
    returnedDomIndex: returned.left ? -1 : returned.domIndex,
    returnedLeft: returned.left,
  };
}

/**
 * Tab forward from wherever focus is now until focus leaves the document, capturing every stop.
 *
 * It stops early on a repeated DOM position (a cycle) or at the press bound (a trap), and records
 * which one happened. It never asserts: the caller records the result first and asserts after.
 */
async function traverse(page: Page, options: TraversalOptions): Promise<Traversal> {
  const stops: Stop[] = [];
  const reverseProbes: ReverseProbe[] = [];
  const seen = new Set<number>();
  let exited = false;
  let repeatedDomIndex = -1;
  let tabPresses = 0;

  while (tabPresses < MAX_TAB_PRESSES) {
    await page.keyboard.press('Tab');
    tabPresses += 1;
    const reading = await readActive(page);
    if (reading.left) {
      exited = true;
      break;
    }
    if (seen.has(reading.domIndex)) {
      repeatedDomIndex = reading.domIndex;
      break;
    }
    seen.add(reading.domIndex);
    const stop: Stop = { ...reading, order: stops.length + 1 };
    stops.push(stop);

    if (options.reverseWhen(stops)) {
      const previous = stops.length >= 2 ? stops[stops.length - 2].domIndex : -1;
      reverseProbes.push(await probeReverse(page, stop, previous));
    }
  }

  return { stops, exited, tabPresses, repeatedDomIndex, reverseProbes };
}

/** Every adjacent pair whose DOM positions do not increase. Tab order equal to DOM order is `[]`. */
function orderViolations(stops: readonly Stop[]): string[] {
  const violations: string[] = [];
  for (let index = 1; index < stops.length; index += 1) {
    const previous = stops[index - 1];
    const current = stops[index];
    if (current.domIndex <= previous.domIndex) {
      violations.push(
        `stop ${current.order} <${current.tag}> '${current.name}' (DOM ${current.domIndex}) follows stop ${previous.order} <${previous.tag}> '${previous.name}' (DOM ${previous.domIndex})`,
      );
    }
  }
  return violations;
}

/** Every reverse probe that did not land on its expected stop, or did not come back. */
function reverseDefects(probes: readonly ReverseProbe[]): string[] {
  return probes.flatMap((probe) => {
    const defects: string[] = [];
    if (probe.landedDomIndex !== probe.expectedDomIndex) {
      defects.push(
        `Shift+Tab from stop ${probe.fromOrder} '${probe.fromName}' landed on DOM ${probe.landedDomIndex} '${probe.landedName}', expected DOM ${probe.expectedDomIndex}`,
      );
    }
    if (probe.returnedDomIndex !== probe.fromDomIndex) {
      defects.push(
        `Tab after that probe returned to DOM ${probe.returnedDomIndex}, not to stop ${probe.fromOrder} (DOM ${probe.fromDomIndex})`,
      );
    }
    return defects;
  });
}

/* ------------------------------------------------------------------------------------ *
 * Page-level readings.
 * ------------------------------------------------------------------------------------ */

interface PositiveTabIndexOffender {
  readonly tag: string;
  readonly name: string;
  readonly tabIndex: number;
}

/**
 * Every element in the document with a tab index greater than zero. This is a page-level property,
 * not a per-element one: a single positive value re-orders the whole document, so the query is
 * document-wide rather than limited to the stops a traversal happened to reach.
 */
async function positiveTabIndexOffenders(page: Page): Promise<PositiveTabIndexOffender[]> {
  return page.evaluate(() =>
    Array.from(document.getElementsByTagName('*'))
      .filter((element) => (element as HTMLElement).tabIndex > 0)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        name: (element.getAttribute('aria-label') ?? (element as HTMLElement).innerText ?? '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 80),
        tabIndex: (element as HTMLElement).tabIndex,
      })),
  );
}

interface ScriptFocusReading {
  /** Whether the destination is in the DOM in the current state. */
  readonly present: boolean;
  /** The raw `tabindex` attribute, or `''` when absent. */
  readonly tabIndexAttribute: string;
  readonly domIndex: number;
}

/** The honeypot control, found through its label's `for` rather than through a guessed selector. */
async function readHoneypot(page: Page): Promise<ScriptFocusReading> {
  return page.evaluate((labelText) => {
    const label = Array.from(document.querySelectorAll('label')).find(
      (candidate) => candidate.textContent?.trim() === labelText,
    );
    const control = label?.htmlFor ? document.getElementById(label.htmlFor) : null;
    return {
      present: control !== null,
      tabIndexAttribute: control?.getAttribute('tabindex') ?? '',
      domIndex: control === null ? -1 : Array.prototype.indexOf.call(document.getElementsByTagName('*'), control),
    };
  }, HONEYPOT_LABEL);
}

/**
 * The error-summary container: the `tabindex` wrapper around the form's `role="alert"`
 * (`src/components/QualifyForm.tsx:538-561`). Absent in the default state by construction.
 */
async function readErrorSummary(page: Page): Promise<ScriptFocusReading> {
  return page.evaluate(() => {
    const alert = document.querySelector('form [role="alert"]');
    const container = alert?.parentElement ?? null;
    return {
      present: container !== null,
      tabIndexAttribute: container?.getAttribute('tabindex') ?? '',
      domIndex: container === null ? -1 : Array.prototype.indexOf.call(document.getElementsByTagName('*'), container),
    };
  });
}

/** The DOM position of the last link in the footer: where forward traversal must end. */
async function lastFooterLinkDomIndex(page: Page): Promise<number> {
  return page.evaluate(() => {
    const links = document.querySelectorAll('footer a[href]');
    const last = links.item(links.length - 1);
    return last === null ? -1 : Array.prototype.indexOf.call(document.getElementsByTagName('*'), last);
  });
}

/** Tab forward from the current focus until the active element has this name, within the bound. */
async function tabUntilName(page: Page, name: string): Promise<ActiveReading> {
  for (let press = 0; press < MAX_TAB_PRESSES; press += 1) {
    await page.keyboard.press('Tab');
    const reading = await readActive(page);
    if (!reading.left && reading.name === name) return reading;
  }
  throw new Error(`no Tab stop named '${name}' was reached within ${MAX_TAB_PRESSES} presses`);
}

/* ------------------------------------------------------------------------------------ *
 * KF-1 on the HAOO page, at every width in the closed list.
 * ------------------------------------------------------------------------------------ */

for (const viewport of WIDTHS) {
  test.describe(`keyboard contract at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport: viewportOf(viewport) });

    test('S1 — KF-1 tab order equals DOM order, script-focus destinations excluded, traversal terminates and reverses', async ({ page }, testInfo) => {
      requireLive(testInfo);
      await openSurface(page, HAOO);

      // Page-level readings first, on the untouched default state.
      const offenders = await positiveTabIndexOffenders(page);
      const honeypot = await readHoneypot(page);
      const errorSummary = await readErrorSummary(page);
      const lastFooterLink = await lastFooterLinkDomIndex(page);

      // The traversal: real Tab presses from document start until focus leaves the document.
      const traversal = await traverse(page, {
        reverseWhen: (stops) => stops.length === 1 || (stops.length - 1) % REVERSE_SAMPLE_STRIDE === 0,
      });

      // Having left the document: Shift+Tab must come back to the last stop, and Tab must leave
      // again. That is the exit being reversible, not only reachable.
      const lastStop = traversal.stops.at(-1);
      let exitProbe: ReverseProbe | null = null;
      if (traversal.exited && lastStop !== undefined) {
        await page.keyboard.press('Shift+Tab');
        const landed = await readActive(page);
        await page.keyboard.press('Tab');
        const returned = await readActive(page);
        exitProbe = {
          fromOrder: traversal.stops.length + 1,
          fromName: '(outside the document)',
          fromDomIndex: -1,
          expectedDomIndex: lastStop.domIndex,
          landedDomIndex: landed.left ? -1 : landed.domIndex,
          landedLeft: landed.left,
          landedName: landed.name,
          returnedDomIndex: returned.left ? -1 : returned.domIndex,
          returnedLeft: returned.left,
        };
      }

      const expectedOpening = expectedOpeningStops(viewport.width);
      const capturedOpening = traversal.stops
        .slice(0, expectedOpening.length)
        .map((stop) => ({ tag: stop.tag, name: stop.name }));
      const violations = orderViolations(traversal.stops);
      const reverse = reverseDefects([...traversal.reverseProbes, ...(exitProbe === null ? [] : [exitProbe])]);
      const stopDomIndexes = new Set(traversal.stops.map((stop) => stop.domIndex));

      recordEvidence(EVIDENCE.traversal, {
        surface: HAOO.id,
        viewport: viewportOf(viewport),
        measured: {
          stopCount: traversal.stops.length,
          tabPresses: traversal.tabPresses,
          exitedDocument: traversal.exited,
          repeatedDomIndex: traversal.repeatedDomIndex,
          positiveTabIndexCount: offenders.length,
          positiveTabIndexOffenders: offenders,
          orderViolations: violations,
          orderViolationCount: violations.length,
          expectedOpening,
          capturedOpening,
          lastFooterLinkDomIndex: lastFooterLink,
          lastStopDomIndex: lastStop?.domIndex ?? -1,
          reverseProbes: traversal.reverseProbes,
          exitProbe: exitProbe ?? 'no exit reached',
          reverseDefectCount: reverse.length,
          stops: traversal.stops,
        },
        detail: {
          plan: '05-09',
          project: testInfo.project.name,
          url: page.url(),
          viewportReason: viewport.reason,
          layoutBranch: viewport.width >= MD_BREAKPOINT_PX ? 'desktop section links (md and up)' : 'navigation toggle (below md)',
          method: 'page.keyboard.press("Tab") from document start until document.activeElement is <body>',
          domIndexMeaning: 'index of the element in document.getElementsByTagName("*"), i.e. document order',
          reverseSampling: `Shift+Tab then Tab at the first stop, at every ${REVERSE_SAMPLE_STRIDE}th stop after it, and from outside the document after the exit`,
          pressBound: MAX_TAB_PRESSES,
        },
      });

      recordEvidence(EVIDENCE.scriptFocus, {
        surface: HAOO.id,
        viewport: viewportOf(viewport),
        measured: {
          state: 'default',
          honeypot,
          honeypotIsStop: stopDomIndexes.has(honeypot.domIndex),
          errorSummary,
          confirmationHeading: 'not rendered in the default state; covered by the preview-target form-state spec (UI-SPEC KF-5, success row)',
          failureHeading: 'not rendered in the default state; covered by the preview-target form-state spec (UI-SPEC KF-5, transport failure / blocked rows)',
        },
        detail: {
          plan: '05-09',
          url: page.url(),
          honeypotLocatedBy: `the <label> whose text is '${HONEYPOT_LABEL}' and its for attribute`,
          errorSummaryState: 'the error summary exists only in the invalid state, measured in its own test below',
        },
      });

      // Ordering: no positive tab index anywhere in the document, offenders reported by name.
      expect(
        offenders,
        `elements with a positive tab index re-order the whole document: ${JSON.stringify(offenders)}`,
      ).toEqual([]);

      // The traversal reached something, and it ended by leaving the document: no cycle, no trap.
      assertNonEmptySubjects(traversal.stops, `keyboard stops on ${HAOO.id} at ${viewport.width}px`);
      expect(traversal.repeatedDomIndex, 'a stop repeated before focus left the document: a cycle').toBe(-1);
      expect(
        traversal.exited,
        `focus did not leave the document within ${MAX_TAB_PRESSES} Tab presses: a trap`,
      ).toBe(true);

      // Tab order equals DOM order, measured.
      expect(violations, `tab order departs from DOM order:\n${violations.join('\n')}`).toEqual([]);
      expect(
        traversal.stops.filter((stop) => stop.tabIndex < 0).map((stop) => stop.name),
        'a stop with a negative tab index was reached sequentially',
      ).toEqual([]);

      // The opening sequence for this layout branch.
      expect(capturedOpening, `the opening stops at ${viewport.width}px`).toEqual(expectedOpening);

      // Termination: the last stop is the last footer link, and the next Tab left the document.
      expect(lastFooterLink, 'the footer has no link to end on').toBeGreaterThan(-1);
      expect(lastStop?.domIndex, 'the traversal did not end on the last footer link').toBe(lastFooterLink);

      // Reversibility: every sampled stop can be left backwards to the stop before it, and the
      // exit can be re-entered backwards.
      expect(traversal.reverseProbes.length, 'no reverse probe was taken').toBeGreaterThan(1);
      expect(exitProbe, 'no probe from outside the document').not.toBeNull();
      expect(reverse, `reverse traversal defects:\n${reverse.join('\n')}`).toEqual([]);

      // The script-focus destination present in this state: tabindex -1, and never a stop.
      expect(honeypot.present, 'the honeypot control is not on the page').toBe(true);
      expect(honeypot.tabIndexAttribute, 'the honeypot control').toBe('-1');
      expect(stopDomIndexes.has(honeypot.domIndex), 'the honeypot control is a sequential tab stop').toBe(false);
      expect(errorSummary.present, 'the error summary rendered in the default state').toBe(false);
    });
  });
}

/* ------------------------------------------------------------------------------------ *
 * The error-summary container, in the only state that renders it.
 * ------------------------------------------------------------------------------------ */

/** The invalid state is a DOM property, not a layout one, so one desktop width is enough. */
const INVALID_STATE_VIEWPORT = assertNonEmptyViewports(
  VIEWPORTS.filter((entry) => entry.width === 1280),
  'the 1280 px entry for the invalid-state traversal',
)[0];

test.describe(`invalid state at ${INVALID_STATE_VIEWPORT.width}x${INVALID_STATE_VIEWPORT.height}`, () => {
  test.use({ viewport: viewportOf(INVALID_STATE_VIEWPORT) });

  test('S1 — KF-1 the error-summary container is a script-focus destination, not a tab stop', async ({ page }, testInfo) => {
    requireLive(testInfo);

    /*
     * FS-0 permits the invalid state on live because validation is client-side and no request is
     * issued. The provider is still routed to abort and every attempt counted, so that even a
     * validation regression could never deliver a real lead from this spec.
     */
    const providerAttempts: string[] = [];
    await page.route(QUALIFY_PROVIDER_PATTERN, (route) => {
      providerAttempts.push(route.request().url());
      return route.abort('blockedbyclient');
    });

    await openSurface(page, HAOO);

    // Reach the submit control by keyboard and operate it by keyboard, with every field empty.
    const submit = await tabUntilName(page, SUBMIT_NAME);
    await page.keyboard.press('Enter');
    await expect(page.locator('form [role="alert"]'), 'the invalid submit rendered no error summary').toHaveCount(1);

    const errorSummary = await readErrorSummary(page);
    const honeypot = await readHoneypot(page);
    const focusAfterSubmit = await readActive(page);

    // Finish the pass the submit started, then take a complete pass from document start.
    const tail = await traverse(page, { reverseWhen: () => false });
    const fullPass = await traverse(page, { reverseWhen: () => false });
    const stopDomIndexes = new Set(fullPass.stops.map((stop) => stop.domIndex));

    recordEvidence(EVIDENCE.scriptFocus, {
      surface: HAOO.id,
      viewport: viewportOf(INVALID_STATE_VIEWPORT),
      measured: {
        state: 'invalid (empty submit)',
        submitReachedAt: submit.domIndex,
        providerAttemptCount: providerAttempts.length,
        errorSummary,
        errorSummaryIsStop: stopDomIndexes.has(errorSummary.domIndex),
        honeypot,
        honeypotIsStop: stopDomIndexes.has(honeypot.domIndex),
        focusAfterSubmit,
        tailExited: tail.exited,
        fullPassExited: fullPass.exited,
        fullPassStopCount: fullPass.stops.length,
        fullPassStops: fullPass.stops,
      },
      detail: {
        plan: '05-09',
        url: page.url(),
        method: 'Tab to the submit control, Enter, then Tab to the document exit and one complete pass from document start',
        providerGuard: `${QUALIFY_PROVIDER_PATTERN.source} routed to abort; FS-0 permits this state on live because no request is issued`,
        focusAfterSubmitNote: 'recorded only; where focus lands after the invalid submit is KF-5, asserted by the preview-target form-state spec',
      },
    });

    expect(providerAttempts, 'the invalid submit attempted to reach the qualification provider').toEqual([]);
    expect(errorSummary.present, 'the error-summary container is not on the page').toBe(true);
    expect(errorSummary.tabIndexAttribute, 'the error-summary container').toBe('-1');
    expect(fullPass.exited, 'the invalid-state traversal did not leave the document').toBe(true);
    assertNonEmptySubjects(fullPass.stops, 'keyboard stops in the invalid state');
    expect(stopDomIndexes.has(errorSummary.domIndex), 'the error-summary container is a sequential tab stop').toBe(false);
    expect(stopDomIndexes.has(honeypot.domIndex), 'the honeypot control is a sequential tab stop').toBe(false);
    expect(orderViolations(fullPass.stops), 'tab order departs from DOM order in the invalid state').toEqual([]);
  });
});
