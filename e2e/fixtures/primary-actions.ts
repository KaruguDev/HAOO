import { assertNonEmptySubjects, type SurfaceId } from './surfaces';

/**
 * The closed list of primary actions, P1 through P13.
 *
 * "No hidden primary actions" (QUAL-01) is unassertable until *primary action* is a closed
 * list. It is one here, transcribed from `05-UI-SPEC.md` § Primary Actions. An action is
 * admitted by being registered in this file, never by a spec reaching for a selector, and the
 * list is not widened to make a failing run pass: a removal is recorded per entry with its
 * successor named, the way `FOCUS_SOURCES` records its own narrowing.
 *
 * **Duplicate accessible names are correct here, and the contract says so explicitly.** P4-P8
 * each render three times with BYTE-IDENTICAL accessible names — the opening, mid-page and
 * closing onboarding blocks are the same component rendered three times. A naive "accessible
 * names must be unique" assertion would fail a correct page. The rule is: *identical
 * accessible name implies identical destination*. Divergence is the defect; duplication is not.
 */

/**
 * The shipped hit-target floor for a primary action: 44 by 44 CSS px.
 *
 * This RECORDS the bar both repositories already ship (`min-h-11`, `size-11` throughout) rather
 * than imposing a new one — 05-CONTEXT.md's phase boundary forbids redesigning shipped screens,
 * so a floor above what ships would be a redesign smuggled in as a test. Compared raw, with no
 * epsilon, the way `MIN_FOCUS_CONTRAST` is compared.
 */
export const MIN_PRIMARY_HIT_TARGET_PX = 44;

/**
 * The floor for interactive elements that are NOT in the primary list: 24 by 24 CSS px.
 *
 * WCAG 2.2 SC 2.5.8 Target Size (Minimum). It is lower than the primary floor because it is
 * the conformance minimum rather than the shipped bar; holding non-primary controls to 44
 * would fail correct screens for exceeding a requirement nobody made.
 */
export const MIN_INTERACTIVE_HIT_TARGET_PX = 24;

export interface PrimaryAction {
  /** `P1` .. `P13`, as `05-UI-SPEC.md` § Primary Actions enumerates them. */
  readonly id: string;
  readonly surface: SurfaceId;
  /**
   * The accessible name as shipped, or — when the name is generated from product data — the
   * exported `src/products/copy.ts` function that produces it, resolved for the product name
   * `HAOO`. `nameSource` says which of the two this is.
   */
  readonly accessibleName: string;
  readonly nameSource: 'shipped-literal' | 'product-copy-key';
  /** The copy key when `nameSource` is `product-copy-key`, otherwise `null`. */
  readonly copyKey: string | null;
  /**
   * Every destination this action resolves to. One entry for all actions except P13, whose
   * contract is a set of five (see its reason).
   */
  readonly destinations: readonly string[];
  /** How many elements carry this action on the rendered surface. */
  readonly instances: number;
  /** Why it is in the list, and anything about its instance count a spec must know. */
  readonly reason: string;
}

const WHATSAPP_HREF =
  'https://wa.me/254702188044?text=Hello%20HAOO%2C%20I%20would%20like%20help%20choosing%20the%20best%20way%20to%20get%20started.';
const TEL_HREF = 'tel:+254702188044';
const MAILTO_HREF = 'mailto:info@haoo.online';
const MANAGE_HREF = 'https://manage.haoo.online/';
const BROCHURE_PATH = '/brochure/HAOO-Marketing-Brochure.pdf';
/** Matches `PRODUCT_URL` in `src/test/build-output.test.ts` rather than retyping the origin. */
const PRODUCT_URL = 'https://www.haoo.online/';

export const PRIMARY_ACTIONS = [
  {
    id: 'P1',
    surface: 'S1',
    accessibleName: 'Open brochure (opens in a new tab)',
    nameSource: 'shipped-literal',
    copyKey: null,
    destinations: [BROCHURE_PATH],
    instances: 1,
    reason: 'The brochure entry point; SC1 rests on the brochure being reachable.',
  },
  {
    id: 'P2',
    surface: 'S1',
    accessibleName: 'Download brochure',
    nameSource: 'shipped-literal',
    copyKey: null,
    destinations: [BROCHURE_PATH],
    instances: 1,
    reason:
      'Same PDF, carrying the `download` attribute. Same destination as P1 by design — the two ' +
      'differ in disposition, not in target.',
  },
  {
    id: 'P3',
    surface: 'S1',
    accessibleName: 'Send my details',
    nameSource: 'shipped-literal',
    copyKey: null,
    destinations: ['the configured qualification endpoint (form submit)'],
    instances: 1,
    reason:
      'The qualification submit control. It is the one primary action permitted to be `disabled`, ' +
      'and only during the in-flight state (UI-SPEC § Form State Coverage).',
  },
  {
    id: 'P4',
    surface: 'S1',
    accessibleName: 'Chat with HAOO on WhatsApp',
    nameSource: 'product-copy-key',
    copyKey: 'whatsappActionLabel',
    destinations: [WHATSAPP_HREF],
    instances: 3,
    reason:
      'Assisted onboarding. Renders THREE times (opening, mid-page, closing) with byte-identical ' +
      'accessible names — assert identical name implies identical href, never name uniqueness.',
  },
  {
    id: 'P5',
    surface: 'S1',
    accessibleName: 'Call +254 702 188 044',
    nameSource: 'shipped-literal',
    copyKey: null,
    destinations: [TEL_HREF],
    instances: 4,
    reason:
      'Assisted onboarding by phone. Three onboarding blocks plus one footer instance — four ' +
      'elements, one destination. The duplicate-name rule of P4 applies unchanged.',
  },
  {
    id: 'P6',
    surface: 'S1',
    accessibleName: 'Email info@haoo.online',
    nameSource: 'shipped-literal',
    copyKey: null,
    destinations: [MAILTO_HREF],
    instances: 4,
    reason:
      'Assisted onboarding by email. Three onboarding blocks plus one footer instance — four ' +
      'elements, one destination. The duplicate-name rule of P4 applies unchanged.',
  },
  {
    id: 'P7',
    surface: 'S1',
    accessibleName: 'Start with HAOO',
    nameSource: 'product-copy-key',
    copyKey: 'selfOnboardingActionLabel',
    destinations: [MANAGE_HREF],
    instances: 3,
    reason:
      'Self-onboarding, leaving for the manage host. Renders three times with byte-identical ' +
      'names; the duplicate-name rule of P4 applies unchanged.',
  },
  {
    id: 'P8',
    surface: 'S1',
    accessibleName: 'Send your details instead',
    nameSource: 'product-copy-key',
    copyKey: 'qualifyEntryPointLabel',
    destinations: ['#qualify'],
    instances: 3,
    reason:
      'The in-page qualification entry point. Renders three times with byte-identical names; the ' +
      'duplicate-name rule of P4 applies unchanged.',
  },
  {
    id: 'P9',
    surface: 'S3',
    accessibleName: 'Explore HAOO',
    nameSource: 'shipped-literal',
    copyKey: null,
    destinations: [PRODUCT_URL],
    instances: 1,
    reason: 'The single hand-off from the Products section into the HAOO journey.',
  },
  {
    id: 'P10',
    surface: 'S3',
    accessibleName: 'Products',
    nameSource: 'shipped-literal',
    copyKey: null,
    destinations: ['#products'],
    instances: 2,
    reason:
      'The nav entry that reaches the Products section. TWO elements: one in the desktop nav and ' +
      'one inside the mobile menu, which is only reachable once the toggle is opened (VC-3).',
  },
  {
    id: 'P11',
    surface: 'S4',
    accessibleName: 'Open HAOO at www.haoo.online',
    nameSource: 'shipped-literal',
    copyKey: null,
    destinations: [PRODUCT_URL],
    instances: 1,
    reason: "The retired path's forward link; SC3's navigation claim rests on it resolving.",
  },
  {
    id: 'P12',
    surface: 'S4',
    accessibleName: 'www.haoo.online/brochure/HAOO-Marketing-Brochure.pdf',
    nameSource: 'shipped-literal',
    copyKey: null,
    destinations: [`${PRODUCT_URL}brochure/HAOO-Marketing-Brochure.pdf`],
    instances: 1,
    reason:
      'The brochure reference on the retired path. Its accessible name is the URL itself, as ' +
      'shipped — do not "improve" it in an assertion.',
  },
  {
    id: 'P13',
    surface: 'S2',
    accessibleName: 'the noscript recovery links',
    nameSource: 'shipped-literal',
    copyKey: null,
    destinations: [WHATSAPP_HREF, TEL_HREF, MAILTO_HREF, MANAGE_HREF, BROCHURE_PATH],
    instances: 8,
    reason:
      'MEASURED CORRECTION to the UI-SPEC row, which reads "the five noscript recovery links, 1 ' +
      'each". The shipped recovery markup in index.html renders EIGHT anchors across two ' +
      'labelled sections: five distinct destinations in "HAOO onboarding without JavaScript" ' +
      '(WhatsApp, tel, mailto, manage host, brochure) and three repeats in "HAOO qualification ' +
      'form recovery" carrying DIFFERENT names ("... instead") that resolve to the same WhatsApp, ' +
      'tel and mailto destinations as their counterparts. The contract is therefore FIVE DISTINCT ' +
      'DESTINATIONS across eight anchors — a spec asserting eight distinct destinations, or five ' +
      'anchors, would fail correct shipped markup.',
  },
] as const satisfies readonly PrimaryAction[];

/**
 * The primary actions on one surface, guarded against emptiness.
 *
 * Same discipline as the `pairs.length > 0` assertion in `focus-contrast.test.ts`: a spec that
 * iterated an empty action list would report a green VC-2 run having checked no control at all.
 * Throws rather than returning a boolean so ignoring it takes a deliberate act.
 */
export function primaryActionsFor(surface: SurfaceId): readonly PrimaryAction[] {
  return assertNonEmptySubjects(
    PRIMARY_ACTIONS.filter((action) => action.surface === surface),
    `PRIMARY_ACTIONS filtered to surface ${surface}`,
  );
}
