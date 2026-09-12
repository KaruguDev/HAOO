import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { recordEvidence } from './fixtures/evidence';
import { PRIMARY_ACTIONS } from './fixtures/primary-actions';
import { SURFACES, assertNonEmptySubjects } from './fixtures/surfaces';

/**
 * The recovery surfaces (`05-UI-SPEC.md` § Onboarding Recovery Resolution Contract and
 * § Retired-Path Recovery Document Contract): the HAOO page with scripting unavailable (S2), the
 * retired-path document an old bookmark lands on (S4), and the onboarding destinations a prospect
 * falls back to when the form does not carry them.
 *
 * **Two disciplines govern this file, and both of them are about what a measurement may claim.**
 *
 * *Resolve, never deliver.* A `tel:`, `mailto:` or `wa.me` destination is validated by SCHEME AND
 * FORM ONLY and is recorded as `validated, not fetched` — never as `reachable`. Placing a call or
 * sending a message reaches third-party systems this project neither controls nor can cheaply
 * re-run, and a suite that did it once would do it on every re-run for ever.
 *
 * *Recorded is not passed, and not failed either.* A third-party host being down is not a defect
 * in this project's markup, so an unreachable `https://manage.haoo.online/` is RECORDED as an
 * observation carrying its status, any redirect target and the wall-clock time of the attempt.
 * A missing, malformed or wrong-target link is a CONTRACT FAILURE and fails the run. The two are
 * separate verdicts and this file never collapses them into one — the same discipline KF-4 uses
 * for the brochure panel's embedded-viewer limit.
 *
 * S2 is a DIFFERENT DOM, not a state of S1: with scripting disabled the parser exposes the
 * `<noscript>` subtree of `index.html` and the React tree S1 measures never renders at all. It
 * therefore gets its own describe block with its own `javaScriptEnabled: false` context option,
 * as `e2e/fixtures/surfaces.ts` S2 requires, and never a toggle on an S1 page.
 */

const HAOO = SURFACES.S1;
const NOSCRIPT = SURFACES.S2;

/** A live network round trip plus several navigations does not fit the 30 s default. */
const LIVE_TIMEOUT_MS = 180_000;

/** The desktop width every reading in this file is taken at (D-09's 1280 entry). */
const DESKTOP = { width: 1280, height: 1024 } as const;

/** Evidence file names, one per measurement family. */
const EVIDENCE = {
  scriptless: 'recovery-scriptless',
  destinations: 'recovery-destinations',
} as const;

/* ------------------------------------------------------------------------------------------- */
/* The exact shipped forms                                                                       */
/* ------------------------------------------------------------------------------------------- */

/**
 * The destination forms, transcribed verbatim from `05-UI-SPEC.md` § Onboarding Recovery
 * Resolution Contract's *Well-formed* rows.
 *
 * They are written here as LITERALS and compared with `toBe`, not with a pattern. A pattern like
 * `/^tel:\+\d+$/` passes for `tel:+254702188045` — a wrong number is exactly the defect the row
 * exists to catch, and a shape check cannot see it.
 *
 * Two of the four rows are standing corrections a reader keeps wanting to "fix" (D-14):
 * `info@haoo.online` is a MAILBOX and takes no `www.` prefix, and `manage.haoo.online` is a
 * SEPARATE HOST and takes no `www.` prefix either. Both are asserted negatively below as well as
 * by equality, so the intent survives an edit that changes the literal.
 */
const SHIPPED_FORM = {
  tel: 'tel:+254702188044',
  mailto: 'mailto:info@haoo.online',
  whatsappBase: 'https://wa.me/254702188044',
  manage: 'https://manage.haoo.online/',
  brochure: '/brochure/HAOO-Marketing-Brochure.pdf',
} as const;

/**
 * `WHATSAPP_STARTER_TEXT` (`src/products/haoo.ts:358`), the compile-time constant the `?text=`
 * parameter is built from with `encodeURIComponent`.
 *
 * Transcribed rather than imported: `src/products/haoo.ts` reads `import.meta.env` at module
 * scope, which is undefined outside Vite, so a Playwright spec importing it throws at import
 * time. `src/test/haoo-content.test.ts:34` pins the same string in the hermetic suite, so a
 * divergence between the two is a defect in THIS file rather than in the page.
 */
const WHATSAPP_STARTER_TEXT =
  'Hello HAOO, I would like help choosing the best way to get started.';

/** The five distinct recovery destinations, in the order the shipped markup lists them. */
const RECOVERY_DESTINATIONS = [
  SHIPPED_FORM.whatsappBase +
    `?text=${encodeURIComponent(WHATSAPP_STARTER_TEXT)}`,
  SHIPPED_FORM.tel,
  SHIPPED_FORM.mailto,
  SHIPPED_FORM.manage,
  SHIPPED_FORM.brochure,
] as const;

/** The two `<section aria-label>` values the `<noscript>` block ships. */
const SECTION_NAMES = {
  onboarding: 'HAOO onboarding without JavaScript',
  formRecovery: 'HAOO qualification form recovery',
} as const;

/**
 * The three destinations the second labelled section repeats under DIFFERENT accessible names.
 *
 * This is the inverse of the P4–P8 duplicate-name rule and it is correct here: *different names,
 * same destinations*. `Chat with HAOO on WhatsApp` and `Message HAOO on WhatsApp instead` are two
 * names for one destination, because the second section is the form-recovery phrasing of the
 * first. Divergence between the pairs is the defect; the repetition is not.
 */
const REPEATED_IN_FORM_RECOVERY = [
  RECOVERY_DESTINATIONS[0],
  RECOVERY_DESTINATIONS[1],
  RECOVERY_DESTINATIONS[2],
] as const;

/**
 * The S1 actions that carry a recovery destination, and therefore the ones whose destination set
 * must equal the scriptless one.
 *
 * P3 and P8 are deliberately absent and their absence is the point: P3 is the form submit control
 * whose "destination" is a submission endpoint rather than a link target, and P8 is the in-page
 * `#qualify` anchor, which goes nowhere a visitor without scripting could follow. Including either
 * would make the two sets unequal by construction and the comparison meaningless.
 */
const SCRIPTED_RECOVERY_ACTION_IDS = ['P1', 'P2', 'P4', 'P5', 'P6', 'P7'] as const;

/* ------------------------------------------------------------------------------------------- */
/* Fixture agreement — the closed list and this file's literals must not drift apart             */
/* ------------------------------------------------------------------------------------------- */

function actionById(id: string) {
  const action = PRIMARY_ACTIONS.find((candidate) => candidate.id === id);
  if (action === undefined) {
    throw new Error(`PRIMARY_ACTIONS has no entry ${id}; the closed list changed shape`);
  }
  return action;
}

/**
 * Assert the closed action list and this file's transcribed literals agree, BEFORE either is used
 * to judge a page.
 *
 * Without this, an edit to `primary-actions.ts` and an edit to `SHIPPED_FORM` could disagree and
 * the run would still be green against whichever one the assertions happened to read.
 */
function assertFixtureAgreement(): void {
  expect(actionById('P4').destinations, 'P4 WhatsApp destination').toEqual([
    RECOVERY_DESTINATIONS[0],
  ]);
  expect(actionById('P5').destinations, 'P5 telephone destination').toEqual([SHIPPED_FORM.tel]);
  expect(actionById('P6').destinations, 'P6 mailbox destination').toEqual([SHIPPED_FORM.mailto]);
  expect(actionById('P7').destinations, 'P7 self-onboarding destination').toEqual([
    SHIPPED_FORM.manage,
  ]);
  expect(actionById('P1').destinations, 'P1 brochure destination').toEqual([
    SHIPPED_FORM.brochure,
  ]);

  // P13 declares the scriptless contract as a set of five. Order is not part of that contract.
  expect(
    [...actionById('P13').destinations].sort(),
    'P13 declares the five distinct scriptless destinations',
  ).toEqual([...RECOVERY_DESTINATIONS].sort());
}

/* ------------------------------------------------------------------------------------------- */
/* Helpers                                                                                       */
/* ------------------------------------------------------------------------------------------- */

function requireProject(testInfo: TestInfo, project: 'live' | 'preview'): void {
  test.skip(
    testInfo.project.name !== project,
    `this measurement is only meaningful against the '${project}' project`,
  );
  test.setTimeout(LIVE_TIMEOUT_MS);
}

interface HeadingReading {
  readonly level: number;
  readonly text: string;
}

/**
 * The `h1`..`h6` walk in document order, read from the DOM.
 *
 * Same instrument SS-1 uses in `e2e/semantics.e2e.ts`: the rule is stated over DOCUMENT ORDER, and
 * the DOM is where document order lives.
 */
async function headingWalk(page: Page): Promise<readonly HeadingReading[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((element) => ({
      level: Number(element.tagName.slice(1)),
      text: (element.textContent ?? '').replace(/\s+/gu, ' ').trim(),
    })),
  );
}

interface AnchorReading {
  readonly name: string;
  readonly href: string;
}

/** Every anchor inside one labelled section, as `{ visible text, raw href }` pairs. */
async function anchorsIn(page: Page, sectionLabel: string): Promise<readonly AnchorReading[]> {
  return page.evaluate((label) => {
    const section = document.querySelector(`section[aria-label="${label}"]`);
    if (section === null) return [];
    return Array.from(section.querySelectorAll('a')).map((anchor) => ({
      name: (anchor.textContent ?? '').replace(/\s+/gu, ' ').trim(),
      // `getAttribute`, not `.href`: the RAW attribute is the shipped form. `.href` resolves
      // `/brochure/...` against the origin and would silently convert a relative destination
      // into an absolute one, hiding the very thing the brochure row asserts.
      href: anchor.getAttribute('href') ?? '',
    }));
  }, sectionLabel);
}

/**
 * The well-formedness rows, asserted against destinations found on a real surface.
 *
 * Every row is literal equality. The negative assertions beside the `mailto:` and self-onboarding
 * rows are additions, never substitutes: they keep the *reason* for the literal legible if someone
 * later edits the literal itself.
 */
function assertWellFormed(found: readonly string[], where: string): void {
  const tel = found.filter((href) => href.startsWith('tel:'));
  const mailto = found.filter((href) => href.startsWith('mailto:'));
  const whatsapp = found.filter((href) => href.startsWith('https://wa.me/'));
  const manage = found.filter((href) => href.startsWith('https://manage.'));
  const brochure = found.filter((href) => href.endsWith('.pdf'));

  expect(assertNonEmptySubjects(tel, `${where}: telephone destinations`)).toEqual([
    SHIPPED_FORM.tel,
  ]);
  // E.164, no spaces and no separators — the reason the literal above is what it is.
  expect(tel[0], `${where}: the telephone form carries a separator`).not.toMatch(
    /[\s()./-]/u,
  );

  expect(assertNonEmptySubjects(mailto, `${where}: mailbox destinations`)).toEqual([
    SHIPPED_FORM.mailto,
  ]);
  // A mailbox, not a host: `mailto:info@www.haoo.online` would be a different address.
  expect(mailto[0], `${where}: the mailbox took a host prefix`).not.toContain('www.');

  expect(assertNonEmptySubjects(manage, `${where}: self-onboarding destinations`)).toEqual([
    SHIPPED_FORM.manage,
  ]);
  // A separate host, not a path under the product host.
  expect(manage[0], `${where}: the self-onboarding host took a www. prefix`).not.toContain(
    'www.',
  );

  expect(assertNonEmptySubjects(brochure, `${where}: brochure destinations`)).toEqual([
    SHIPPED_FORM.brochure,
  ]);

  const messaging = assertNonEmptySubjects(whatsapp, `${where}: messaging destinations`);
  expect(messaging).toEqual([RECOVERY_DESTINATIONS[0]]);

  // The starter text DECODED, byte for byte against the compile-time constant. Comparing the
  // encoded form would pass for a differently-encoded spelling of a different sentence.
  const parsed = new URL(messaging[0] ?? '');
  expect(`${parsed.origin}${parsed.pathname}`, `${where}: messaging host and number`).toBe(
    SHIPPED_FORM.whatsappBase,
  );
  const encodedText = parsed.searchParams.get('text') ?? '';
  expect(decodeURIComponent(encodedText), `${where}: decoded messaging starter text`).toBe(
    WHATSAPP_STARTER_TEXT,
  );
}

/* ------------------------------------------------------------------------------------------- */
/* S2 — the scriptless recovery DOM                                                              */
/* ------------------------------------------------------------------------------------------- */

test.describe('S2 — the HAOO page with scripting unavailable', () => {
  test.describe.configure({ timeout: LIVE_TIMEOUT_MS });
  test.use({ javaScriptEnabled: false });

  test('carries five distinct destinations across two labelled sections', async ({
    page,
  }, testInfo) => {
    requireProject(testInfo, 'live');
    assertFixtureAgreement();

    await page.setViewportSize(DESKTOP);
    await page.goto(NOSCRIPT.url, { waitUntil: 'domcontentloaded' });

    const onboarding = await anchorsIn(page, SECTION_NAMES.onboarding);
    const formRecovery = await anchorsIn(page, SECTION_NAMES.formRecovery);
    const allAnchors = [...onboarding, ...formRecovery];
    const distinct = [...new Set(allAnchors.map((anchor) => anchor.href))];
    const headings = await headingWalk(page);

    recordEvidence(EVIDENCE.scriptless, {
      surface: NOSCRIPT.id,
      viewport: DESKTOP,
      measured: {
        anchorsTotal: allAnchors.length,
        anchorsInOnboardingSection: onboarding.length,
        anchorsInFormRecoverySection: formRecovery.length,
        distinctDestinationCount: distinct.length,
        distinctDestinations: distinct,
        onboardingSectionAnchors: onboarding.map((anchor) => `${anchor.name} -> ${anchor.href}`),
        formRecoverySectionAnchors: formRecovery.map(
          (anchor) => `${anchor.name} -> ${anchor.href}`,
        ),
        headingSequence: headings.map((heading) => `h${heading.level} ${heading.text}`),
        headingLevels: headings.map((heading) => heading.level),
      },
      detail: {
        url: NOSCRIPT.url,
        javaScriptEnabled: false,
        rule: 'UI-SPEC § Onboarding Recovery Resolution Contract, JS-disabled row; P13',
        note:
          'The shipped markup renders EIGHT anchors across two labelled sections. The contract is ' +
          'FIVE DISTINCT DESTINATIONS; the anchor count is recorded and never asserted.',
      },
    });

    /*
     * FIVE DISTINCT DESTINATIONS, never a count of anchors.
     *
     * A length assertion on the anchors fails a CORRECT page at five, and at eight it would pin an
     * accident of phrasing. RESEARCH Pitfall 7 measured the shipped shape: five destinations in
     * `HAOO onboarding without JavaScript` and three repeats in `HAOO qualification form
     * recovery` carrying different names. The set is the contract; the count is a consequence.
     */
    expect(assertNonEmptySubjects(distinct, 'distinct scriptless destinations')).toHaveLength(5);
    expect([...distinct].sort(), 'the five distinct scriptless destinations').toEqual(
      [...RECOVERY_DESTINATIONS].sort(),
    );

    // The second section's three anchors resolve to the same three destinations as their
    // counterparts in the first — different accessible names, same destinations.
    const repeated = formRecovery.map((anchor) => anchor.href);
    expect(assertNonEmptySubjects(repeated, "the form-recovery section's anchors")).toEqual([
      ...REPEATED_IN_FORM_RECOVERY,
    ]);
    for (const href of repeated) {
      expect(
        onboarding.map((anchor) => anchor.href),
        `the form-recovery destination ${href} has no counterpart in the onboarding section`,
      ).toContain(href);
    }

    // Different names carrying the same destination is the inverse of the P4-P8 rule, and it is
    // correct here. Assert the names actually DO differ, so the repetition stays deliberate.
    for (const anchor of formRecovery) {
      const counterpart = onboarding.find((candidate) => candidate.href === anchor.href);
      expect(anchor.name, `${anchor.href} name in the form-recovery section`).not.toBe(
        counterpart?.name,
      );
    }

    // Both labelled section names are present.
    for (const label of Object.values(SECTION_NAMES)) {
      await expect(
        page.locator(`section[aria-label="${label}"]`),
        `the labelled section "${label}"`,
      ).toHaveCount(1);
    }

    // The heading order holds in this DOM: one h1, then the form-recovery h2, nothing deeper.
    const levels = headings.map((heading) => heading.level);
    expect(levels, 'the scriptless heading level sequence').toEqual([1, 2]);
    expect(headings[0]?.text).toBe('Choose how to start with HAOO');
    expect(headings[1]?.text).toBe('This form needs JavaScript');

    assertWellFormed(distinct, 'S2');
  });
});

/* ------------------------------------------------------------------------------------------- */
/* S1 — the same destinations on the scripted page                                               */
/* ------------------------------------------------------------------------------------------- */

test.describe('S1 — the scripted HAOO page carries the same recovery destinations', () => {
  test.describe.configure({ timeout: LIVE_TIMEOUT_MS });

  test('the scripted destination set equals the scriptless one and is well-formed', async ({
    page,
  }, testInfo) => {
    requireProject(testInfo, 'live');
    assertFixtureAgreement();

    await page.setViewportSize(DESKTOP);
    await page.goto(HAOO.url, { waitUntil: 'networkidle' });

    const readings: { id: string; name: string; instances: number; hrefs: string[] }[] = [];

    for (const id of SCRIPTED_RECOVERY_ACTION_IDS) {
      const action = actionById(id);
      const located = page.getByRole('link', {
        name: action.accessibleName,
        exact: true,
        includeHidden: true,
      });
      const count = await located.count();
      const hrefs: string[] = [];
      for (let index = 0; index < count; index += 1) {
        hrefs.push((await located.nth(index).getAttribute('href')) ?? '');
      }
      readings.push({ id, name: action.accessibleName, instances: count, hrefs });
    }

    const scriptedDistinct = [...new Set(readings.flatMap((reading) => reading.hrefs))];

    recordEvidence(EVIDENCE.destinations, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        distinctDestinationCount: scriptedDistinct.length,
        distinctDestinations: scriptedDistinct,
        perAction: readings.map(
          (reading) =>
            `${reading.id} "${reading.name}" x${reading.instances} -> ${[
              ...new Set(reading.hrefs),
            ].join(', ')}`,
        ),
      },
      detail: {
        url: HAOO.url,
        javaScriptEnabled: true,
        rule: 'UI-SPEC § Onboarding Recovery Resolution Contract, Present and Well-formed rows',
        actionsRead: [...SCRIPTED_RECOVERY_ACTION_IDS],
        excluded:
          'P3 submits to an endpoint rather than linking, and P8 is the in-page #qualify anchor; ' +
          'neither is a recovery destination.',
      },
    });

    /*
     * Every instance of one accessible name resolves to one destination — the P4-P8 rule.
     *
     * The number of instances is RECORDED and not asserted against the closed list, and that is a
     * measured decision rather than a softened assertion. `primary-actions.ts` declares
     * `instances: 4` for P5 and P6 on the strength of "three onboarding blocks plus one footer
     * instance". The footer anchors exist and carry the right destinations, but their visible text
     * is `product.contacts.phoneDisplay` / `.email` (`src/pages/ProductPage.tsx:299-300`) — so
     * their accessible names are `+254 702 188 044` and `info@haoo.online`, not P5's and P6's
     * `Call …` / `Email …`. They are a fourth element with a DIFFERENT name and the SAME
     * destination: the same inverse rule the scriptless form-recovery section follows, not a
     * missing instance. `evidence/viewport-primary-actions.json` records the same 3-found /
     * 4-declared census at all six widths (05-08), so this file agrees with what is already on
     * record rather than asserting a count the page has never had.
     *
     * The destination question those two footer anchors raise is NOT dropped: the page-wide sweep
     * below reads every anchor carrying a recovery scheme, footer instances included, and holds
     * each to its exact shipped form.
     */
    for (const reading of readings) {
      expect(
        assertNonEmptySubjects(reading.hrefs, `${reading.id} "${reading.name}" instances`),
      ).not.toHaveLength(0);
      expect(
        [...new Set(reading.hrefs)],
        `${reading.id} "${reading.name}" resolves to more than one destination`,
      ).toHaveLength(1);
      expect([...new Set(reading.hrefs)], `${reading.id} destination`).toEqual([
        ...actionById(reading.id).destinations,
      ]);
    }

    /*
     * The page-wide sweep: EVERY anchor carrying a recovery scheme, whatever its accessible name.
     *
     * Reading only the six named actions would leave the two footer anchors unchecked, and a
     * footer link to a wrong number is exactly the "wrong-target link" this plan calls a contract
     * failure. Reading them by scheme rather than by name is what makes the check independent of
     * whether a name is in the closed list.
     */
    const schemeSweep = assertNonEmptySubjects(
      await page.evaluate(() =>
        Array.from(document.querySelectorAll('a'))
          .map((anchor) => anchor.getAttribute('href') ?? '')
          .filter(
            (href) =>
              href.startsWith('tel:') ||
              href.startsWith('mailto:') ||
              href.startsWith('https://wa.me/') ||
              href.startsWith('https://manage.') ||
              href.endsWith('.pdf'),
          ),
      ),
      'anchors on S1 carrying a recovery scheme',
    );

    recordEvidence(EVIDENCE.destinations, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        recoverySchemeAnchorCount: schemeSweep.length,
        recoverySchemeDestinations: [...new Set(schemeSweep)],
      },
      detail: {
        url: HAOO.url,
        rule: 'every anchor carrying a recovery scheme, by scheme rather than by accessible name',
        note:
          'Includes the two footer anchors whose accessible names are the phone display and the ' +
          'mailbox address rather than P5/P6 names.',
      },
    });

    for (const href of schemeSweep) {
      expect(
        [...RECOVERY_DESTINATIONS] as readonly string[],
        `a recovery-scheme anchor on S1 points at ${href}, which is not a shipped destination`,
      ).toContain(href);
    }

    // The divergence assertion this whole block exists for: if the scripted page and the
    // scriptless fallback ever point somewhere different, the run fails.
    expect(
      [...scriptedDistinct].sort(),
      'the scripted destination set diverged from the scriptless one',
    ).toEqual([...RECOVERY_DESTINATIONS].sort());

    assertWellFormed(scriptedDistinct, 'S1');
  });
});
