import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { APPROVED_ANALYTICS_HOSTS } from '../config/approved-analytics-hosts';
import { recordEvidence } from './fixtures/evidence';
import { MIN_PRIMARY_HIT_TARGET_PX, PRIMARY_ACTIONS } from './fixtures/primary-actions';
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
  retiredPath: 'recovery-retired-path',
  reachability: 'recovery-reachability',
  analyticsBlocked: 'recovery-analytics-blocked',
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

/* ------------------------------------------------------------------------------------------- */
/* S4 — the retired-path recovery document                                                       */
/* ------------------------------------------------------------------------------------------- */

const RETIRED = SURFACES.S4;

/**
 * `HAOO_PRODUCT.outcome`, the S1 top-level heading, pinned by `src/test/haoo-content.test.ts:38`.
 *
 * Transcribed for the same reason `WHATSAPP_STARTER_TEXT` is: `src/products/haoo.ts` reads
 * `import.meta.env` at module scope and throws when imported outside Vite.
 */
const HAOO_OUTCOME_HEADING = 'Run the business—not the paperwork.';

/** The `<noscript>` top-level heading, which is the h1 a JS-disabled visitor lands on. */
const SCRIPTLESS_HEADING = 'Choose how to start with HAOO';

/**
 * R1–R5, transcribed from `05-UI-SPEC.md` § Retired-Path Recovery Document Contract and matched
 * against the document's RENDERED VISIBLE TEXT.
 *
 * `innerText`, never `textContent` and never a markup search: a statement present in the markup
 * but not rendered is not a statement to a visitor, which is the whole distinction the contract's
 * "as rendered, visible text" wording carries. Whitespace is collapsed before matching because the
 * source wraps these sentences across several lines and the renderer joins them with one space.
 */
const REQUIRED_STATEMENTS = {
  R1: 'HAOO has moved to its own domain.',
  R4: 'are not retained here and their old URLs return 404',
  R5: 'The visible links above are the guarantee. The refresh is the enhancement',
} as const;

/** R2 and R3 are anchors, located by the shipped accessible names P11 and P12 carry. */
const RETIRED_LINKS = { forward: 'P11', brochure: 'P12' } as const;

/**
 * The signature of a script this document did not author.
 *
 * **Read this before changing the exact-zero assertion below.** 04.2 D25 gives this document a
 * script budget of EXACTLY ZERO and the suite asserts that as an exact number rather than a
 * maximum, so "just one more line" is a red test. Measured on 2026-09-12, the document as served
 * to a browser carries TWO `<script>` elements that neither repository wrote. `www.zero-paperhub.com`
 * is fronted by Cloudflare (`server: cloudflare`, `cf-ray` on every response) and its edge injects:
 *
 *   1. an inline bot-management bootstrap carrying `window.__CF$cv$params`, which loads
 *      `/cdn-cgi/challenge-platform/scripts/jsd/main.js` into a hidden iframe; and
 *   2. the Cloudflare Web Analytics beacon, `https://static.cloudflareinsights.com/beacon.min.js`.
 *
 * The second is content-negotiated: a plain `curl` of the same URL returns only the first, so it
 * is invisible to a bytes-level check and only a real browser request sees it. The GitHub Pages
 * origin behind the edge serves the authored document; both injections happen after the origin and
 * are in neither tree. The BEACON in particular is an analytics script on a document defined as
 * script-free, in a project whose measurement posture is a locked-down facade — that is a question
 * for the ZERO-PAPER HUB owner, recorded here rather than settled here.
 *
 * So the assertion is: the count of scripts that do NOT carry this signature is exactly zero. That
 * keeps the budget exact — any script without the edge signature is a failing run, which is what
 * D25 asked for — while a third-party edge behaviour is RECORDED as an observation rather than
 * reported as a defect in this project's markup. It is the same verdict split this plan applies to
 * an unreachable third-party host, applied to a third-party addition instead of a subtraction.
 * Observation O-1 in `05-EVIDENCE-RECOVERY.md` carries it forward; widening this signature to
 * absorb a script somebody actually wrote would be the abuse it is guarding against.
 */
const EDGE_INJECTED_SIGNATURE =
  /\/cdn-cgi\/|__CF\$cv\$params|challenge-platform|cloudflareinsights\.com/u;

interface ScriptReading {
  readonly src: string;
  /** The FULL inline body. Matched in full — a truncated body hides the signature it carries. */
  readonly inline: string;
}

function isEdgeInjected(script: ScriptReading): boolean {
  return EDGE_INJECTED_SIGNATURE.test(script.src) || EDGE_INJECTED_SIGNATURE.test(script.inline);
}

/** A script identified for the record, without pasting a kilobyte of minified third-party code. */
function describeScript(script: ScriptReading): string {
  return script.src === ''
    ? `inline(${script.inline.length} chars): ${script.inline.slice(0, 80)}`
    : `src: ${script.src}`;
}

interface RetiredStructure {
  readonly refreshContent: string;
  readonly canonicalHref: string;
  readonly robotsContent: string;
  readonly scripts: readonly ScriptReading[];
}

async function readRetiredStructure(page: Page): Promise<RetiredStructure> {
  return page.evaluate(() => ({
    refreshContent:
      document.querySelector('meta[http-equiv="refresh"]')?.getAttribute('content') ?? '',
    canonicalHref: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
    robotsContent: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
    scripts: Array.from(document.querySelectorAll('script')).map((script) => ({
      src: script.getAttribute('src') ?? '',
      inline: script.textContent ?? '',
    })),
  }));
}

/** The document's rendered visible text, whitespace collapsed. */
async function visibleText(page: Page): Promise<string> {
  return (await page.locator('body').innerText()).replace(/\s+/gu, ' ').trim();
}

test.describe('S4 — the retired-path document a visitor the refresh does not carry', () => {
  test.describe.configure({ timeout: LIVE_TIMEOUT_MS });

  /*
   * Scripting is off for both readings in this block, because the contract's fallback case is
   * "refresh neutralised AND JavaScript disabled". It also means the edge-injected script cannot
   * run and mutate the DOM, so the structural reading below is the document as PARSED FROM THE
   * SERVED BYTES rather than the document after somebody else's code finished with it.
   */
  test.use({ javaScriptEnabled: false });

  test('as served: an instant refresh, a canonical, a no-index directive, no authored script, and one target', async ({
    page,
  }, testInfo) => {
    requireProject(testInfo, 'live');

    /*
     * The document ships `content="0; url=…"`. At zero seconds there is no window in which to
     * read it, and disabling scripting does not help — meta refresh is a parser directive, not
     * script (RESEARCH Pitfall 8). So the DESTINATION is blocked rather than the document
     * rewritten: the refresh fires, its navigation fails, and the browser stays on the document
     * exactly as the server sent it. This is therefore NOT a modified-page measurement, and it is
     * recorded as `as-served` so it can never be read as the neutralised one.
     */
    await page.route(HAOO.url, (route) => route.abort('aborted'));

    try {
      await page.goto(RETIRED.url, { waitUntil: 'domcontentloaded' });
    } catch {
      // The refresh can interrupt the navigation `goto` awaits. The URL check below is the real
      // proof that the document under measurement is the right one.
    }
    await page.waitForTimeout(2000);
    expect(page.url(), 'the refresh carried the browser away from the document under test').toContain(
      '/products/haoo/',
    );

    const structure = await readRetiredStructure(page);
    const refreshMatch = /^\s*(\d+)\s*;\s*url\s*=\s*(.+?)\s*$/iu.exec(structure.refreshContent);
    const refreshDelay = Number(refreshMatch?.[1] ?? Number.NaN);
    const refreshTarget = refreshMatch?.[2] ?? '';
    const forwardHref =
      (await page
        .getByRole('link', { name: actionById(RETIRED_LINKS.forward).accessibleName, exact: true })
        .getAttribute('href')) ?? '';

    const authoredScripts = structure.scripts.filter((script) => !isEdgeInjected(script));
    const edgeScripts = structure.scripts.filter(isEdgeInjected);

    recordEvidence(EVIDENCE.retiredPath, {
      surface: RETIRED.id,
      viewport: DESKTOP,
      measured: {
        mode: 'as-served (refresh destination aborted, byte-unmodified document)',
        refreshContent: structure.refreshContent,
        refreshDelaySeconds: refreshDelay,
        refreshTarget,
        canonicalHref: structure.canonicalHref,
        robotsContent: structure.robotsContent,
        forwardLinkHref: forwardHref,
        scriptElementCount: structure.scripts.length,
        authoredScriptElementCount: authoredScripts.length,
        edgeInjectedScriptElementCount: edgeScripts.length,
        edgeInjectedScripts: edgeScripts.map(describeScript),
      },
      detail: {
        url: RETIRED.url,
        javaScriptEnabled: false,
        modifiedPage: false,
        rule: 'UI-SPEC § Retired-Path Recovery Document Contract, structural assertions',
        observation:
          'O-1: the served document carries edge-injected Cloudflare scripts that are in neither ' +
          'repository tree - a bot-management bootstrap and the Web Analytics beacon. The ' +
          'authored script budget is still exactly zero.',
      },
    });

    /*
     * The delay is exactly the instant value, asserted as that exact number. An INSTANT refresh
     * reads as a permanent move and a DELAYED one reads as temporary, so the number is
     * load-bearing rather than incidental — and axe-core's `meta-refresh` rule (critical,
     * wcag2a) passes only at `redirectDelay <= 0`, so any other number would also have blocked
     * the whole accessibility run.
     */
    expect(refreshDelay, 'the meta refresh delay in seconds').toBe(0);

    expect(structure.canonicalHref, 'the canonical reference').not.toBe('');
    expect(structure.robotsContent, 'the robots directive').toContain('noindex');

    // EXACTLY zero authored scripts, as an exact number and never as a maximum (04.2 D25).
    expect(
      authoredScripts.length,
      `the document carries ${authoredScripts.length} script element(s) this project authored: ` +
        `${authoredScripts.map(describeScript).join(' | ')}`,
    ).toBe(0);

    /*
     * The three destinations asserted EQUAL TO ONE ANOTHER, never each against a literal. A
     * literal comparison would let one edited target sit alongside two stale ones and still pass
     * each row on its own; comparing them to each other is what makes a split impossible. This
     * mirrors `src/test/build-output.test.ts` against the built tree and extends it to the
     * deployed bytes.
     */
    expect(refreshTarget, 'the refresh target and the canonical reference have split').toBe(
      structure.canonicalHref,
    );
    expect(structure.canonicalHref, 'the canonical reference and the visible link have split').toBe(
      forwardHref,
    );
    expect(forwardHref, 'the visible link and the refresh target have split').toBe(refreshTarget);
  });

  test('refresh neutralised: all five required statements are rendered, and the visible link lands on HAOO', async ({
    page,
  }, testInfo) => {
    requireProject(testInfo, 'live');

    /*
     * RESEARCH Pattern 2: intercept the document response and strip the refresh directive from
     * the body before the parser sees it. Disabling scripting is NOT sufficient and is not relied
     * on — it is done as well, because the case the contract names is the visitor the enhancement
     * does not carry at all. This IS a modified-page measurement and is recorded as such.
     */
    await page.route(RETIRED.url, async (route) => {
      const response = await route.fetch();
      const html = await response.text();
      await route.fulfill({
        response,
        body: html.replace(/<meta\s+http-equiv=["']refresh["'][^>]*>/iu, ''),
      });
    });

    await page.goto(RETIRED.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // If the strip failed the browser is on the HAOO page by now. This is what makes the
    // modified-page claim checkable rather than merely asserted.
    expect(page.url(), 'the refresh was not neutralised — the strip did not match').toContain(
      '/products/haoo/',
    );

    const rendered = await visibleText(page);
    const forward = page.getByRole('link', {
      name: actionById(RETIRED_LINKS.forward).accessibleName,
      exact: true,
    });
    const brochure = page.getByRole('link', {
      name: actionById(RETIRED_LINKS.brochure).accessibleName,
      exact: true,
    });
    const forwardHref = (await forward.getAttribute('href')) ?? '';
    const brochureHref = (await brochure.getAttribute('href')) ?? '';

    recordEvidence(EVIDENCE.retiredPath, {
      surface: RETIRED.id,
      viewport: DESKTOP,
      measured: {
        mode: 'refresh-neutralised (response body rewritten) with scripting disabled',
        renderedTextLength: rendered.length,
        renderedText: rendered,
        R1: REQUIRED_STATEMENTS.R1,
        R2: `${actionById(RETIRED_LINKS.forward).accessibleName} -> ${forwardHref}`,
        R3: `${actionById(RETIRED_LINKS.brochure).accessibleName} -> ${brochureHref}`,
        R4: REQUIRED_STATEMENTS.R4,
        R5: REQUIRED_STATEMENTS.R5,
      },
      detail: {
        url: RETIRED.url,
        javaScriptEnabled: false,
        modifiedPage: true,
        interventions: [
          'rewrote the response body to remove the meta refresh directive (RESEARCH Pattern 2)',
          'disabled scripting in the browser context',
        ],
        rule: 'UI-SPEC § Retired-Path Recovery Document Contract R1-R5',
      },
    });

    // R1, R4 and R5 as rendered visible text.
    for (const [id, statement] of Object.entries(REQUIRED_STATEMENTS)) {
      expect(rendered, `${id} is not present as rendered visible text`).toContain(statement);
    }

    // R2: a working absolute anchor whose VISIBLE TEXT names the destination host.
    await expect(forward, 'R2 is not visible').toBeVisible();
    expect(forwardHref, 'R2 is not absolute').toMatch(/^https:\/\//u);
    expect(await forward.innerText(), 'R2 visible text does not name the destination host').toContain(
      'www.haoo.online',
    );

    // R3: a working absolute anchor to the brochure at its new host.
    await expect(brochure, 'R3 is not visible').toBeVisible();
    expect(brochureHref, 'R3 brochure destination').toEqual(
      actionById(RETIRED_LINKS.brochure).destinations[0],
    );

    /*
     * Activate the visible link in exactly this state. The refresh NOT running is the case the
     * document exists for, so it is the case that must be proven — not inferred from the anchor
     * being present in the markup.
     */
    await forward.click();
    await page.waitForURL(/haoo\.online/u, { timeout: 60_000 });
    const headings = await headingWalk(page);

    recordEvidence(EVIDENCE.retiredPath, {
      surface: RETIRED.id,
      viewport: DESKTOP,
      measured: {
        mode: 'refresh-neutralised, visible link activated',
        landedOn: page.url(),
        topLevelHeadings: headings
          .filter((heading) => heading.level === 1)
          .map((heading) => heading.text),
        headingSequence: headings.map((heading) => `h${heading.level} ${heading.text}`),
      },
      detail: {
        javaScriptEnabled: false,
        note:
          'Scripting is off in this context, so the top-level heading present on the landing page ' +
          'is the <noscript> h1 rather than the React h1. That is the heading a visitor in THIS ' +
          'state sees; the React h1 is asserted by the refresh-permitted reading instead.',
      },
    });

    expect(page.url(), 'the visible link did not land on the HAOO page').toContain(
      'www.haoo.online',
    );
    const topLevel = headings.filter((heading) => heading.level === 1);
    expect(topLevel, 'the landing page has no single top-level heading').toHaveLength(1);
    expect(topLevel[0]?.text, 'the scriptless landing heading').toBe(SCRIPTLESS_HEADING);
  });
});

test.describe('S4 — the retired-path document with the refresh permitted to run', () => {
  test.describe.configure({ timeout: LIVE_TIMEOUT_MS });

  test('carries the visitor to the HAOO page, top-level heading present', async ({
    page,
  }, testInfo) => {
    requireProject(testInfo, 'live');

    /*
     * No interception of any kind. This is SC3's cross-repository navigation claim end to end,
     * and it is a SEPARATE assertion from the neutralised one above — the two prove different
     * things about the same document and are recorded under different modes so they can never be
     * read as one reading.
     */
    await page.setViewportSize(DESKTOP);
    await page.goto(RETIRED.url, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/www\.haoo\.online/u, { timeout: 60_000 });
    await page.waitForLoadState('networkidle');

    const headings = await headingWalk(page);
    const topLevel = headings.filter((heading) => heading.level === 1);

    recordEvidence(EVIDENCE.retiredPath, {
      surface: RETIRED.id,
      viewport: DESKTOP,
      measured: {
        mode: 'refresh-permitted (no interception)',
        startedAt: RETIRED.url,
        landedOn: page.url(),
        topLevelHeadings: topLevel.map((heading) => heading.text),
        headingCount: headings.length,
      },
      detail: {
        javaScriptEnabled: true,
        modifiedPage: false,
        rule: 'UI-SPEC § Retired-Path Recovery Document Contract, refresh-permitted row (SC3)',
      },
    });

    expect(page.url(), 'the refresh did not carry the browser to the HAOO page').toContain(
      'www.haoo.online',
    );
    expect(topLevel, 'the HAOO page has no single top-level heading').toHaveLength(1);
    expect(topLevel[0]?.text, "S1's top-level heading").toBe(HAOO_OUTCOME_HEADING);
  });
});

/* ------------------------------------------------------------------------------------------- */
/* Reachability, probed out of band                                                              */
/* ------------------------------------------------------------------------------------------- */

/**
 * The status at or above which a reading is treated as unavailable.
 *
 * Named rather than written as `400` at each site, because the number appears in both the
 * assertion and the recorded-observation branch and the two must not drift apart.
 */
const ERROR_THRESHOLD = 400;

/** A third-party probe that hangs must not hang the run. */
const PROBE_TIMEOUT_MS = 20_000;

/**
 * The three destinations that are NEVER fetched, with the reason attached to each.
 *
 * This is the machine-readable form of "resolve, never deliver". A `GET` of `tel:` places nothing
 * and a `GET` of `mailto:` sends nothing — but `https://wa.me/…?text=…` DOES reach a third-party
 * system, and a suite that probed it would hit WhatsApp's infrastructure on every re-run for the
 * rest of the project's life. All three are validated by scheme and form in the S1 and S2 blocks
 * above and are recorded here as `validated, not fetched`, never as `reachable`.
 */
const VALIDATED_NOT_FETCHED = [
  { destination: SHIPPED_FORM.tel, reason: 'a telephone scheme — dialling it would place a call' },
  { destination: SHIPPED_FORM.mailto, reason: 'a mailbox scheme — resolving it would send mail' },
  {
    destination: RECOVERY_DESTINATIONS[0],
    reason: 'a third-party messaging host — fetching it would open a conversation',
  },
] as const;

interface ProbeReading {
  readonly target: string;
  readonly attemptedAt: string;
  readonly elapsedMs: number;
  readonly status: number;
  readonly redirectTarget: string;
  readonly contentType: string;
  readonly transportFailure: string;
}

test.describe('Reachability — out of band, redirects not followed, status treated as data', () => {
  test.describe.configure({ timeout: LIVE_TIMEOUT_MS });

  /**
   * One probe, through the request context rather than a navigation.
   *
   * `maxRedirects: 0` and `failOnStatusCode: false` together are what make the STATUS a reading
   * rather than a verdict: a 3xx is recorded with its `Location` header instead of being followed
   * into whatever it points at, so an unexpected redirect into a different flow is visible in the
   * evidence rather than absorbed by a "non-error" reading (T-05-50). A transport failure is
   * caught and recorded for the same reason — a thrown exception is a reading too.
   */
  async function probe(
    request: import('@playwright/test').APIRequestContext,
    target: string,
  ): Promise<ProbeReading> {
    const attemptedAt = new Date().toISOString();
    const startedAt = Date.now();

    try {
      const response = await request.get(target, {
        maxRedirects: 0,
        failOnStatusCode: false,
        timeout: PROBE_TIMEOUT_MS,
      });
      const headers = response.headers();
      return {
        target,
        attemptedAt,
        elapsedMs: Date.now() - startedAt,
        status: response.status(),
        redirectTarget: headers['location'] ?? 'no Location header',
        contentType: headers['content-type'] ?? 'no content-type header',
        transportFailure: 'none observed',
      };
    } catch (error) {
      return {
        target,
        attemptedAt,
        elapsedMs: Date.now() - startedAt,
        // -1 is not a status. It is the sentinel for "the transport never produced one", and it
        // is a number so the record stays machine-readable beside the real statuses.
        status: -1,
        redirectTarget: 'no response',
        contentType: 'no response',
        transportFailure: error instanceof Error ? error.message : String(error),
      };
    }
  }

  test('the self-onboarding host resolves, or its unavailability is recorded', async ({
    request,
  }, testInfo) => {
    requireProject(testInfo, 'live');

    const reading = await probe(request, SHIPPED_FORM.manage);
    const unavailable = reading.status === -1 || reading.status >= ERROR_THRESHOLD;

    recordEvidence(EVIDENCE.reachability, {
      surface: HAOO.id,
      viewport: null,
      measured: {
        target: reading.target,
        disposition: unavailable ? 'unavailable, recorded as an observation' : 'reachable',
        status: reading.status,
        redirectTarget: reading.redirectTarget,
        contentType: reading.contentType,
        transportFailure: reading.transportFailure,
        attemptedAt: reading.attemptedAt,
        elapsedMs: reading.elapsedMs,
      },
      detail: {
        method: 'GET through the request context, maxRedirects 0, failOnStatusCode false',
        rule: 'UI-SPEC § Onboarding Recovery Resolution Contract, Reachable row',
        errorThreshold: ERROR_THRESHOLD,
      },
    });

    /*
     * THE BRANCH THIS PLAN EXISTS TO DRAW, and the two sides are different verdicts.
     *
     * A status at or above the error threshold, a connection failure or a timeout against a host
     * this project does not control is RECORDED — status, redirect target, wall-clock time — and
     * does NOT fail the run. A third-party host being down is not a defect in this project's
     * markup, and a gate that went red for it would be un-greenable for reasons nobody here can
     * fix, which is how a suite gets ignored.
     *
     * A MISSING, MALFORMED OR WRONG-TARGET LINK is a CONTRACT FAILURE and does fail the run. That
     * assertion lives in the S1 and S2 blocks above, where the shipped form is compared literally.
     * The two must stay distinguishable in the evidence and must never be collapsed into one
     * verdict: "the link is right and the host is down" and "the link is wrong" are different
     * facts about different owners.
     */
    if (unavailable) {
      testInfo.annotations.push({
        type: 'observation',
        description:
          `${reading.target} was unavailable at ${reading.attemptedAt}: status ${reading.status}, ` +
          `redirect target ${reading.redirectTarget}, transport ${reading.transportFailure}. ` +
          'Recorded, not failed — a third-party host being down is not a defect in this markup.',
      });
      return;
    }

    expect(reading.status, `${reading.target} status`).toBeLessThan(ERROR_THRESHOLD);
  });

  test('the brochure artifact returns success with its document content type', async ({
    request,
  }, testInfo) => {
    requireProject(testInfo, 'live');

    const target = new URL(SHIPPED_FORM.brochure, HAOO.url).toString();
    const reading = await probe(request, target);

    recordEvidence(EVIDENCE.reachability, {
      surface: HAOO.id,
      viewport: null,
      measured: {
        target: reading.target,
        // Derived from the reading, never written ahead of it: a 404 or a transport failure
        // (status -1) must not be committed as reachable (review WR-06).
        disposition:
          reading.status === 200 ? 'reachable' : `unavailable (status ${reading.status})`,
        status: reading.status,
        redirectTarget: reading.redirectTarget,
        contentType: reading.contentType,
        transportFailure: reading.transportFailure,
        attemptedAt: reading.attemptedAt,
        elapsedMs: reading.elapsedMs,
      },
      detail: {
        method: 'GET through the request context, maxRedirects 0, failOnStatusCode false',
        rule: 'UI-SPEC § Onboarding Recovery Resolution Contract, brochure PDF Reachable row',
        note:
          'The brochure is FIRST-PARTY — this project publishes it — so it is asserted rather ' +
          'than recorded-and-excused. The recorded-observation branch is for hosts nobody here owns.',
      },
    });

    expect(reading.status, 'the brochure artifact status').toBe(200);
    expect(reading.contentType, 'the brochure artifact content type').toContain('application/pdf');
  });

  /*
   * This test takes NO fixture, and the empty pattern is the point rather than an oversight: a
   * `request` or `page` fixture in scope is a standing invitation to fetch one of these three
   * destinations, and the entire contract here is that none of them is ever fetched. Playwright
   * requires the destructuring form for its first argument, so the empty pattern is the only way
   * to write "this test has no way to make a request".
   */
  // eslint-disable-next-line no-empty-pattern
  test('the scheme-only destinations are recorded as validated, not fetched', async ({}, testInfo) => {
    requireProject(testInfo, 'live');

    recordEvidence(EVIDENCE.reachability, {
      surface: HAOO.id,
      viewport: null,
      measured: {
        disposition: 'validated, not fetched',
        destinations: VALIDATED_NOT_FETCHED.map((entry) => entry.destination),
        reasons: VALIDATED_NOT_FETCHED.map(
          (entry) => `${entry.destination}: ${entry.reason}`,
        ),
        requestsIssued: 0,
        validationMethod: 'literal equality against the shipped form, on both S1 and S2',
      },
      detail: {
        rule: 'UI-SPEC § Onboarding Recovery Resolution Contract, not-fetched row; D-14',
        note:
          'These three carry a different disposition from a reachable entry and the two must read ' +
          'as different claims. Nothing here was proven to DELIVER; it was proven to RESOLVE.',
      },
    });

    // A guard, not a ceremony: the not-fetched set must stay the three scheme-only forms, so a
    // later edit cannot quietly move a fetched destination into the unfetched column.
    expect(
      VALIDATED_NOT_FETCHED.map((entry) => entry.destination).sort(),
      'the validated-not-fetched set',
    ).toEqual([RECOVERY_DESTINATIONS[0], SHIPPED_FORM.mailto, SHIPPED_FORM.tel].sort());
  });
});

/* ------------------------------------------------------------------------------------------- */
/* The journey with the analytics ingestion origin blocked                                       */
/* ------------------------------------------------------------------------------------------- */

/**
 * The approved ingestion origin, read from the repository configuration rather than transcribed.
 *
 * `config/approved-analytics-hosts.ts` is a plain module with no `import.meta.env` read, so unlike
 * `src/products/haoo.ts` it imports cleanly outside Vite. Reading it here means a change of region
 * or provider cannot leave this test blocking an origin the build stopped using.
 */
const ANALYTICS_ORIGINS = APPROVED_ANALYTICS_HOSTS.map((host) => new URL(host.origin).hostname);

/**
 * The provider's registrable domain for each approved ingestion origin — `posthog.com` for
 * `us.i.posthog.com` — which is what the block below matches, exactly or as a dot-suffix.
 *
 * Matching the ingestion hostname as a suffix did not reach the provider's SIBLING hosts: the
 * assets and remote-configuration host `us-assets.i.posthog.com` does not end with
 * `us.i.posthog.com` (review WR-05). The last two labels are the registrable domain for every
 * origin in the approved list today; a public-suffix domain such as `co.uk` would need more.
 */
const ANALYTICS_BLOCK_DOMAINS = ANALYTICS_ORIGINS.map((hostname) =>
  hostname.split('.').slice(-2).join('.'),
);

/** P1-P8: every primary action the HAOO page carries. */
const S1_ACTION_IDS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'] as const;

test.describe('The HAOO journey with the analytics ingestion origin blocked', () => {
  test.describe.configure({ timeout: LIVE_TIMEOUT_MS });

  test('renders, and every primary action stays present, enabled and hit-targetable', async ({
    page,
    request,
  }, testInfo) => {
    requireProject(testInfo, 'live');

    /*
     * The measurement facade is DESIGNED to fail closed to a no-op (`src/measurement/
     * posthog-lockdown.ts`), so the journey should be unaffected by the ingestion origin being
     * unreachable. "Should be unaffected" is a design claim; this test converts it into a
     * measurement (T-05-52).
     *
     * The block is by REGISTRABLE DOMAIN rather than by an exact URL or the ingestion hostname: the
     * provider serves ingestion, assets and remote configuration from sibling subdomains, and a
     * narrower match would let the ones it did not name through.
     */
    const blockedRequests: string[] = [];
    await page.route(
      (url) =>
        ANALYTICS_BLOCK_DOMAINS.some(
          (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`),
        ),
      (route) => {
        blockedRequests.push(route.request().url());
        return route.abort('blockedbyclient');
      },
    );

    await page.setViewportSize(DESKTOP);
    await page.goto(HAOO.url, { waitUntil: 'networkidle' });

    const headings = await headingWalk(page);
    const topLevel = headings.filter((heading) => heading.level === 1);
    const capabilities = page.getByRole('region', { name: 'Capabilities', exact: true });
    const capabilityHeadings = await capabilities.getByRole('heading', { level: 3 }).count();

    /*
     * A blocked-request count is ambiguous on its own: zero can mean "the facade held" or "there
     * was never anything to block". So the bundle is read as well, and the two readings together
     * say which. Since 2026-09-13 (quick task 260913-p4u) `capture_pageview` is `true`, so a
     * configured build issues a `$pageview` on load in a real browser. Under Playwright, though,
     * posthog-js drops that traffic because `navigator.webdriver` is true, which tracer.e2e.ts
     * asserts. A blocked-request count of 0 is therefore still the expected reading here, and the
     * bundle reference is what distinguishes a configured-but-quiet build from an unconfigured one.
     */
    const bundleHref =
      (await page.locator('script[type="module"][src]').first().getAttribute('src')) ?? '';
    const bundleUrl = bundleHref === '' ? '' : new URL(bundleHref, HAOO.url).toString();
    let bundleMentionsIngestionOrigin = 'bundle not read';
    if (bundleUrl !== '') {
      const bundle = await request.get(bundleUrl, { failOnStatusCode: false });
      const body = await bundle.text();
      bundleMentionsIngestionOrigin = ANALYTICS_ORIGINS.some((hostname) => body.includes(hostname))
        ? 'the ingestion origin appears in the deployed bundle'
        : 'the ingestion origin does not appear in the deployed bundle';
    }

    interface ActionReading {
      readonly id: string;
      readonly name: string;
      readonly instances: number;
      readonly minWidth: number;
      readonly minHeight: number;
      readonly enabled: number;
      readonly visible: number;
    }

    const readings: ActionReading[] = [];

    for (const id of S1_ACTION_IDS) {
      const action = actionById(id);
      const located = page.getByRole(id === 'P3' ? 'button' : 'link', {
        name: action.accessibleName,
        exact: true,
        includeHidden: true,
      });
      const count = await located.count();
      assertNonEmptySubjects(
        Array.from({ length: count }, (_, index) => index),
        `${id} ("${action.accessibleName}") with the analytics origin blocked`,
      );

      let minWidth = Number.POSITIVE_INFINITY;
      let minHeight = Number.POSITIVE_INFINITY;
      let enabled = 0;
      let visible = 0;

      for (let index = 0; index < count; index += 1) {
        const instance = located.nth(index);
        // D-OQ-2: scrolling to an action before measuring it is correct and expected.
        await instance.scrollIntoViewIfNeeded();
        const box = await instance.boundingBox();
        minWidth = Math.min(minWidth, box?.width ?? 0);
        minHeight = Math.min(minHeight, box?.height ?? 0);
        if (await instance.isEnabled()) enabled += 1;
        if (await instance.isVisible()) visible += 1;
      }

      readings.push({
        id,
        name: action.accessibleName,
        instances: count,
        minWidth,
        minHeight,
        enabled,
        visible,
      });
    }

    recordEvidence(EVIDENCE.analyticsBlocked, {
      surface: HAOO.id,
      viewport: DESKTOP,
      measured: {
        analyticsRequestsBlocked: blockedRequests.length,
        blockedRequestUrls: blockedRequests,
        blockedHostnameSuffixes: ANALYTICS_BLOCK_DOMAINS,
        deployedBundle: bundleUrl,
        bundleMentionsIngestionOrigin,
        topLevelHeadings: topLevel.map((heading) => heading.text),
        headingCount: headings.length,
        capabilityHeadingCount: capabilityHeadings,
        actions: readings.map(
          (reading) =>
            `${reading.id} "${reading.name}" x${reading.instances} visible ${reading.visible} ` +
            `enabled ${reading.enabled} min ${reading.minWidth}x${reading.minHeight}`,
        ),
        smallestPrimaryTarget: Math.min(
          ...readings.map((reading) => Math.min(reading.minWidth, reading.minHeight)),
        ),
      },
      detail: {
        url: HAOO.url,
        rule: 'UI-SPEC § UI Considerations, "S1 under a slow or failed PostHog load"; T-05-52',
        floorPx: MIN_PRIMARY_HIT_TARGET_PX,
        note:
          'A blocked-request count of 0 is a reading, not a gap, and the bundle reading beside it ' +
          'is what makes the 0 interpretable. Since 2026-09-13 capture_pageview is true, so a real ' +
          'browser sends a $pageview on load, but posthog-js drops Playwright traffic because ' +
          'navigator.webdriver is true (asserted in tracer.e2e.ts), so 0 is still expected here.',
      },
    });

    // The page rendered.
    expect(topLevel, 'the page did not render its single top-level heading').toHaveLength(1);
    expect(topLevel[0]?.text).toBe(HAOO_OUTCOME_HEADING);
    await expect(capabilities, 'the capabilities region').toBeVisible();
    expect(capabilityHeadings, 'capability entries rendered').toBeGreaterThan(0);

    // Every primary action stayed present, enabled, visible and above the shipped floor.
    for (const reading of readings) {
      expect(reading.visible, `${reading.id} visible instances`).toBe(reading.instances);
      expect(reading.enabled, `${reading.id} enabled instances`).toBe(reading.instances);
      expect(reading.minWidth, `${reading.id} narrowest instance`).toBeGreaterThanOrEqual(
        MIN_PRIMARY_HIT_TARGET_PX,
      );
      expect(reading.minHeight, `${reading.id} shortest instance`).toBeGreaterThanOrEqual(
        MIN_PRIMARY_HIT_TARGET_PX,
      );
    }
  });
});
