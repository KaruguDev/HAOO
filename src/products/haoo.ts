import type {
  MeasurementProvider,
  ProductDefinition,
  ProductMeasurement,
  QualifyOption,
} from './types';
import { ENGAGEMENT_SUMMARY_LABEL } from '../components/qualify-form.logic';
import {
  qualifyCollectionNotePageContext,
  qualifyCollectionNoteProcessor,
  qualifyCollectionNotePurpose,
} from './copy';

export type { ProductDefinition } from './types';

export const HAOO_MEASUREMENT_EVENTS = [
  'haoo_page_view',
  'haoo_brochure_preview',
  'haoo_brochure_open',
  'haoo_brochure_download',
  'haoo_qualify_start',
  'haoo_qualify_submit',
  'haoo_assisted_whatsapp',
  'haoo_assisted_phone',
  'haoo_assisted_email',
  'haoo_self_onboarding',
] as const;

export type HaooMeasurementEvent = (typeof HAOO_MEASUREMENT_EVENTS)[number];

/**
 * Every accepted provider value, written once. A value that is not exactly one of these
 * — after trimming and lowercasing — resolves to the inert no-op sink.
 */
const MEASUREMENT_PROVIDERS: readonly MeasurementProvider[] = ['none', 'plausible'];

/**
 * Fail-closed provider selection. `VITE_HAOO_MEASUREMENT_PROVIDER` is a public
 * build-time selector, not a URL and never a script source: undefined, blank,
 * whitespace, an unknown word and an absolute URL all resolve to `'none'`, so a build
 * with no configuration at all keeps the existing inert sink and an unchanged journey.
 */
export function resolveMeasurementProvider(configuredValue?: string): MeasurementProvider {
  const candidate = (configuredValue ?? '').trim().toLowerCase();

  return MEASUREMENT_PROVIDERS.find((provider) => provider === candidate) ?? 'none';
}

/**
 * One approved analytics script origin and the exact paths approved on it.
 *
 * Declared locally rather than imported so no production module gains an import edge
 * into the repository-owned approval configuration — the approved origin must reach a
 * bundle only through the build-time constant, never through ordinary module bundling.
 */
export interface ApprovedScriptSource {
  readonly origin: string;
  readonly paths: readonly string[];
}

/**
 * The build-time approved set, or an empty set when it is absent.
 *
 * The constant is statically replaced by the production build. Under the test runner —
 * and under any hypothetical build that failed to inject it — the identifier does not
 * exist and evaluating it throws a `ReferenceError`, which is swallowed here into the
 * empty list. Failing closed is the point: an absent contract must approve nothing, not
 * everything.
 */
function buildTimeApprovedScriptSources(): readonly ApprovedScriptSource[] {
  try {
    return Array.isArray(__HAOO_APPROVED_ANALYTICS_SCRIPT_SOURCES__)
      ? __HAOO_APPROVED_ANALYTICS_SCRIPT_SOURCES__
      : [];
  } catch {
    return [];
  }
}

/**
 * Fail-closed provider script source, modelled on `resolveQualifyEndpoint` below.
 *
 * The analytics origin is deliberately NOT written as a literal in `src/`: that would
 * inline it into every build, including builds with no provider configured, which is
 * exactly what the bundle prohibition exists to prevent. It arrives instead as the
 * provider-gated build-time constant read above, sourced from version-controlled
 * repository configuration — so `VITE_HAOO_PLAUSIBLE_SRC` can only ever *select from*
 * the approved set and can never widen it (T-04-27).
 *
 * Accepted only when the value is an absolute `https:` URL carrying no username, no
 * password, no query string and no fragment, whose path ends in `.js`, AND whose parsed
 * origin equals an approved origin exactly while its pathname is one of that entry's
 * approved paths. Every other input — a foreign origin, a lookalike host that merely
 * ends with the approved host, an approved host on another port, an unapproved
 * extension-variant path, a bare origin, an `http:` URL, any unparsable string — returns
 * the empty string, which stops the sink being created at all.
 *
 * `approvedSources` is injectable so tests can assert against the canonical contract;
 * its default is the build-time constant, which is empty unless the build deliberately
 * selected the provider.
 */
export function resolvePlausibleScriptSrc(
  configuredValue?: string,
  approvedSources: readonly ApprovedScriptSource[] = buildTimeApprovedScriptSources(),
): string {
  const candidate = (configuredValue ?? '').trim();

  if (candidate === '') {
    return '';
  }

  try {
    const url = new URL(candidate);

    if (url.protocol !== 'https:') {
      return '';
    }

    if (url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
      return '';
    }

    if (!url.pathname.endsWith('.js')) {
      return '';
    }

    // Exact origin equality against the parsed origin — never a substring, prefix or
    // suffix test, which a lookalike host carrying the approved host as a leading label
    // of an attacker-controlled domain would defeat.
    const approved = approvedSources.some(
      (source) => source.origin === url.origin && source.paths.includes(url.pathname),
    );

    if (!approved) {
      return '';
    }

    return candidate;
  } catch {
    return '';
  }
}

export const HAOO_MEASUREMENT: ProductMeasurement<HaooMeasurementEvent> = {
  productKey: 'haoo',
  storageKey: 'zph.haoo.ctx.v1',
  schemaVersion: 1,
  events: HAOO_MEASUREMENT_EVENTS,
  pageViewEvent: 'haoo_page_view',
  interactionEvents: {
    brochurePreview: 'haoo_brochure_preview',
    brochureOpen: 'haoo_brochure_open',
    brochureDownload: 'haoo_brochure_download',
    qualifyStart: 'haoo_qualify_start',
    qualifySubmit: 'haoo_qualify_submit',
    assistedWhatsapp: 'haoo_assisted_whatsapp',
    assistedPhone: 'haoo_assisted_phone',
    assistedEmail: 'haoo_assisted_email',
    selfOnboarding: 'haoo_self_onboarding',
  },
  interactionFlags: [
    'brochureViewed',
    'brochureDownloaded',
    'qualifyStarted',
    'assistedContact',
    'selfOnboarding',
  ],
  interactionEventFlags: {
    haoo_brochure_preview: 'brochureViewed',
    haoo_brochure_open: 'brochureViewed',
    haoo_brochure_download: 'brochureDownloaded',
    haoo_qualify_start: 'qualifyStarted',
    haoo_assisted_whatsapp: 'assistedContact',
    haoo_assisted_phone: 'assistedContact',
    haoo_assisted_email: 'assistedContact',
    haoo_self_onboarding: 'selfOnboarding',
  },
  provider: resolveMeasurementProvider(import.meta.env.VITE_HAOO_MEASUREMENT_PROVIDER),
  providerScript: {
    src: resolvePlausibleScriptSrc(import.meta.env.VITE_HAOO_PLAUSIBLE_SRC),
    domain: (import.meta.env.VITE_HAOO_PLAUSIBLE_DOMAIN ?? '').trim(),
  },
  disclosure: {
    summary: 'How we measure this page',
    intro:
      'We use a closed list of page signals for aggregate product learning and keep a separate, small context record in this browser. The page works if analytics or browser storage is unavailable.',
    signalsHeading: 'Signals this page can count',
    signalLines: {
      haoo_page_view: 'That you viewed this HAOO page.',
      haoo_brochure_preview: 'That the brochure preview became available.',
      haoo_brochure_open: 'That you opened the brochure.',
      haoo_brochure_download: 'That you downloaded the brochure.',
      haoo_qualify_start: 'That you started the qualification form.',
      haoo_qualify_submit:
        "That you tried to send the qualification form after it passed the page's checks.",
      haoo_assisted_whatsapp: 'That you chose WhatsApp to contact HAOO.',
      haoo_assisted_phone: 'That you chose phone to contact HAOO.',
      haoo_assisted_email: 'That you chose email to contact HAOO.',
      haoo_self_onboarding: 'That you opened HAOO self-onboarding.',
    },
    signalBoundary:
      'These signals are sent as bare names with no form answers or visitor properties attached.',
    browserHeading: 'What this browser remembers',
    browserFacts: [
      'Whether this visit is first, returning, or frequent.',
      'Whether the last visit was today, this week, this month, or earlier.',
      'Whether the brochure was viewed or downloaded, the form was started, an assisted-contact channel was chosen, or self-onboarding was opened.',
      'A visit step capped at four, used only to calculate the coarse visit band.',
      'A day-only last-seen value, used only to calculate the coarse time band and remove context after about 180 days.',
    ],
    browserBoundary:
      'The capped visit step and day-only value never enter analytics events or form submissions.',
    campaignHeading: 'Campaign information',
    campaignDescription:
      'On one page load, we may read utm_source, utm_medium, and utm_campaign. Accepted values are lowercased, limited to short letters, numbers, and hyphens, kept only for this page lifetime, and removed from the address bar after being read.',
    neverCollectedHeading: 'What we never collect for measurement',
    neverCollected: [
      'Name, email address, phone number, or organization.',
      'Message text.',
      'Role, county, timeframe, or exact portfolio values.',
      'UUIDs, cookies, fingerprints, or cross-site identifiers.',
      'Raw click history.',
      'Any form answer attached to an analytics event.',
    ],
    /**
     * Owner-approved copy, byte-exact from `04-UI-SPEC.md` "Surface B — disclosure copy
     * change". The visitor reads this before submitting, so it describes the attached
     * paragraph in fixed words and never reflects their own measured values back. The
     * campaign item is present because blocking checkpoint C-2 resolved `include`: a
     * normalized campaign label really does travel with the enquiry, so a list that
     * omitted it would under-disclose.
     */
    summaryHeading: 'What we attach to your form submission',
    summaryIntro:
      'When you send this form, we attach one short readable paragraph of the coarse signals described above so we can reply usefully.',
    summaryContents: [
      'Whether this browser is on a first, returning, or frequent visit.',
      'Roughly when the last visit was, if this is not the first one.',
      'Which of the listed actions were recorded in this browser.',
      'Any campaign values described above, if they were present when you arrived.',
    ],
    summaryBoundary:
      'It contains no score, no identifier, no capped visit step, no day-only date, and none of your form answers repeated back. It is written in plain words you could read yourself.',
    clearLabel: 'Clear what this page remembers',
    clearSuccess: 'What this page remembered has been cleared.',
    clearBlocked:
      'This page stopped using remembered context for this visit. Your browser did not allow us to clear its saved copy.',
  },
};

const WHATSAPP_STARTER_TEXT =
  'Hello HAOO, I would like help choosing the best way to get started.';
const PHONE_NUMBER = '254702188044';

/**
 * Build-time enquiry destination. `VITE_HAOO_FORM_ENDPOINT` is inlined by Vite and is
 * world-readable in the published bundle by construction; it is obfuscation of the
 * mailbox address, never a secret. An unset or blank Actions variable is an empty
 * string rather than `undefined`, so a nullish-only fallback would ship `''` as the
 * network destination. Every rejected input selects the readable fallback instead.
 */
export const QUALIFY_ENDPOINT_FALLBACK = 'https://formsubmit.co/ajax/info@haoo.online';

/**
 * Accepts only an absolute `https://formsubmit.co/ajax/{target}` URL carrying exactly
 * one decoded, non-blank path segment after `/ajax/`. Bare `/ajax`, `/ajax/`,
 * `/ajax//`, whitespace or percent-encoded-whitespace targets, encoded slashes, extra
 * segments, credentials, queries, fragments, malformed encodings, `http:` and any
 * other host all resolve to the fallback: a route prefix is not a usable recipient.
 */
export function resolveQualifyEndpoint(configuredValue?: string): string {
  const candidate = (configuredValue ?? '').trim();

  if (candidate === '') {
    return QUALIFY_ENDPOINT_FALLBACK;
  }

  try {
    const url = new URL(candidate);

    if (url.protocol !== 'https:' || url.host !== 'formsubmit.co') {
      return QUALIFY_ENDPOINT_FALLBACK;
    }

    if (url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
      return QUALIFY_ENDPOINT_FALLBACK;
    }

    const segments = url.pathname.split('/');

    // A well-formed pathname splits to exactly ['', 'ajax', '{target}'].
    if (segments.length !== 3 || segments[0] !== '' || segments[1] !== 'ajax') {
      return QUALIFY_ENDPOINT_FALLBACK;
    }

    const target = decodeURIComponent(segments[2]);

    if (target.trim() === '' || target.includes('/')) {
      return QUALIFY_ENDPOINT_FALLBACK;
    }

    return candidate;
  } catch {
    return QUALIFY_ENDPOINT_FALLBACK;
  }
}

export const QUALIFY_ENDPOINT = resolveQualifyEndpoint(
  import.meta.env.VITE_HAOO_FORM_ENDPOINT,
);

/**
 * Every closed option list ships here rather than in JSX, so a drifted option is caught
 * by a data contract without rendering anything (D-11). `value` is derived from `label`
 * by construction: the delivered email then carries the exact human string the visitor
 * saw, and there is no lookup table that can fall out of step with the rendered options.
 */
function toOptions(labels: readonly string[]): readonly QualifyOption[] {
  return labels.map((label) => ({ value: label, label }));
}

export const CONTACT_CHANNEL_OPTIONS: readonly QualifyOption[] = toOptions([
  'WhatsApp',
  'Phone call',
  'Email',
]);

export const ROLE_OPTIONS: readonly QualifyOption[] = toOptions([
  'Landlord',
  'Property manager',
  'Agency',
  'Organization',
  'Other',
]);

/** The first four bands carry an en dash (U+2013); `200+ units` carries no dash. */
export const PORTFOLIO_BAND_OPTIONS: readonly QualifyOption[] = toOptions([
  '1–5 units',
  '6–20 units',
  '21–50 units',
  '51–200 units',
  '200+ units',
]);

/** `In 1–3 months` carries an en dash (U+2013); the other three carry no dash. */
export const TIMEFRAME_OPTIONS: readonly QualifyOption[] = toOptions([
  'Ready now',
  'In 1–3 months',
  'In 3+ months',
  'Just exploring',
]);

/**
 * The 47 counties of the First Schedule to the Constitution of Kenya in official code
 * order 1-47, followed by a single `Outside Kenya` bucket for non-Kenyan prospects.
 *
 * Four names carry punctuation that varies between published transcriptions, and these
 * strings are written into email delivered to a real inbox, so the exact characters were
 * confirmed by a human before ship (plan 02-02 task 1, approved as planned):
 * `Taita–Taveta` carries an en dash (U+2013); `Tharaka-Nithi`, `Trans-Nzoia` and
 * `Elgeyo-Marakwet` carry a plain hyphen (U+002D); `Murang’a` carries a typographic
 * apostrophe (U+2019). `qualify-data.test.ts` pins all four by codepoint against a
 * literal expectation, so an editor that silently re-normalises them fails the build.
 */
export const KENYAN_COUNTY_OPTIONS: readonly QualifyOption[] = toOptions([
  'Mombasa',
  'Kwale',
  'Kilifi',
  'Tana River',
  'Lamu',
  'Taita–Taveta',
  'Garissa',
  'Wajir',
  'Mandera',
  'Marsabit',
  'Isiolo',
  'Meru',
  'Tharaka-Nithi',
  'Embu',
  'Kitui',
  'Machakos',
  'Makueni',
  'Nyandarua',
  'Nyeri',
  'Kirinyaga',
  'Murang’a',
  'Kiambu',
  'Turkana',
  'West Pokot',
  'Samburu',
  'Trans-Nzoia',
  'Uasin Gishu',
  'Elgeyo-Marakwet',
  'Nandi',
  'Baringo',
  'Laikipia',
  'Nakuru',
  'Narok',
  'Kajiado',
  'Kericho',
  'Bomet',
  'Kakamega',
  'Vihiga',
  'Bungoma',
  'Busia',
  'Siaya',
  'Kisumu',
  'Homa Bay',
  'Migori',
  'Kisii',
  'Nyamira',
  'Nairobi',
  'Outside Kenya',
]);

export const HAOO_PRODUCT: ProductDefinition = {
  slug: 'haoo',
  name: 'HAOO',
  relationship: 'A ZERO-PAPER HUB product',
  outcome: 'Run the business—not the paperwork.',
  audienceLead: 'For landlords and property managers who want one clear view of their properties, rent, leases, maintenance, and communication.',
  audiences: ['Landlords', 'Property managers', 'Tenants', 'Agents'],
  painHeading: 'The paperwork problem',
  benefitHeading: 'Less chasing. More control.',
  journeyHeading: 'Rental journey',
  pains: [
    'Scattered spreadsheets, paper trails and message threads make it harder to see what needs attention.',
  ],
  benefits: [
    'Keep the people, money and work around every property connected in one shared source of truth.',
    'See occupancy, payments, requests and portfolio reporting with less chasing and more control.',
  ],
  capabilities: [
    {
      title: 'Rent & payments',
      description:
        'Track balances, digital payment workflows and tenant receipts\u2014including M-Pesa.',
      icon: 'payments',
    },
    {
      title: 'Properties & units',
      description: 'Organise portfolios, occupancy, vacancies and property details.',
      icon: 'properties',
    },
    {
      title: 'Leases & screening',
      description: 'Support tenant applications, screening and digital lease workflows.',
      icon: 'leases',
    },
    {
      title: 'Maintenance',
      description: 'Capture issues, assign work and keep progress visible to the right people.',
      icon: 'maintenance',
    },
    {
      title: 'Vacancy marketplace',
      description: 'Publish available homes and receive tenant applications online.',
      icon: 'marketplace',
    },
    {
      title: 'Reports & communication',
      description: 'Turn activity into insight and keep stakeholders informed.',
      icon: 'reports',
    },
  ],
  journey: [
    {
      title: 'Fill vacancies with confidence',
      description:
        'Present available homes clearly and give prospective tenants a simple path to apply.',
    },
    {
      title: 'Move in with clarity',
      description:
        'Keep tenant information, screening and lease workflows organised from the start.',
    },
    {
      title: 'Make every month easier',
      description:
        'Give tenants a convenient place for payments, receipts, utilities and requests.',
    },
    {
      title: 'Grow with visibility',
      description:
        'Use connected records and reports to manage more units without losing the human touch.',
    },
  ],
  featureCaveat: 'Feature availability may vary by subscription plan.',
  marketClaim: 'Built for the realities of property management in Kenya, with familiar digital payment journeys and role-based access.',
  assistedInvitation: 'Tell us about your properties and we\'ll help you choose the best way to get started.',
  media: {
    logo: {
      href: '/products/haoo/haoo-logo.png',
      alt: '',
      width: 362,
      height: 176,
    },
    hero: {
      href: '/products/haoo/haoo-hero.png',
      alt: 'Property manager outside a modern apartment building',
      width: 1122,
      height: 1402,
    },
  },
  contacts: {
    phoneDisplay: '+254 702 188 044',
    phoneNumber: PHONE_NUMBER,
    phoneHref: 'tel:+254702188044',
    email: 'info@haoo.online',
    emailHref: 'mailto:info@haoo.online',
    whatsappStarterText: WHATSAPP_STARTER_TEXT,
    whatsappHref: `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(WHATSAPP_STARTER_TEXT)}`,
    selfOnboardingDisplay: 'manage.haoo.online',
    selfOnboardingHref: 'https://manage.haoo.online/',
  },
  brochure: {
    pdfHref: '/products/haoo/HAOO-Marketing-Brochure.pdf',
    previewImageHref: '/products/haoo/brochure-preview.png',
    previewImageAlt: 'HAOO property-management brochure preview',
    previewImageWidth: 1287,
    previewImageHeight: 909,
    downloadName: 'HAOO-Marketing-Brochure.pdf',
    expectationLabel: 'PDF · 2.1 MB',
  },
  qualify: {
    endpoint: QUALIFY_ENDPOINT,
    subject: 'New HAOO qualification enquiry — ZERO-PAPER HUB',
    sourceNote:
      'Sent from the HAOO product page on ZERO-PAPER HUB (www.zero-paperhub.com/products/haoo/)',
    collectionNote: {
      purpose: qualifyCollectionNotePurpose('HAOO'),
      processor: qualifyCollectionNoteProcessor(),
      pageContext: qualifyCollectionNotePageContext('HAOO'),
    },
    /**
     * Owner-approved engagement-summary copy, byte-exact from `04-UI-SPEC.md`
     * "Surface C — engagement summary sentences". Every sentence describes something a
     * browser did, in words the visitor could read themselves. There is deliberately no
     * count, ordinal, date, rank, grade or weighting anywhere in this block: the summary
     * reports bands and facts, so there is no rounding or tie-breaking rule to get wrong.
     *
     * The campaign clause is included per blocking checkpoint C-2, resolved `include` by
     * the product owner: the owner can tell a campaign arrival from an organic one, and
     * the values are already lowercased, character-restricted and length-capped by the
     * measurement facade before they get here.
     */
    engagementSummary: {
      emailLabel: ENGAGEMENT_SUMMARY_LABEL,
      prefix: 'Browser context only; not a lead score.',
      visitBandSentences: {
        first: 'This browser had no earlier recorded HAOO visit.',
        returning: 'This browser has visited the HAOO page before.',
        frequent: 'This browser has visited the HAOO page several times.',
      },
      lastSeenSentences: {
        today: 'The last recorded visit was today.',
        'this-week': 'The last recorded visit was earlier this week.',
        'this-month': 'The last recorded visit was earlier this month.',
        earlier: 'The last recorded visit was more than a month ago.',
      },
      // The shipped order, matching `HAOO_MEASUREMENT.interactionFlags`.
      flagSentences: [
        { flag: 'brochureViewed', sentence: 'This browser viewed the brochure.' },
        { flag: 'brochureDownloaded', sentence: 'This browser downloaded the brochure.' },
        {
          flag: 'qualifyStarted',
          sentence: 'This browser started the qualification form.',
        },
        {
          flag: 'assistedContact',
          sentence: 'This browser opened an assisted-contact link.',
        },
        {
          flag: 'selfOnboarding',
          sentence: 'This browser opened the HAOO self-onboarding link.',
        },
      ],
      noFlagsSentence:
        'No brochure, contact, or self-onboarding actions were recorded in this browser.',
      campaignSentence: {
        lead: 'Campaign values seen on arrival:',
        clauses: [
          { key: 'utm_source', label: 'source' },
          { key: 'utm_medium', label: 'medium' },
          { key: 'utm_campaign', label: 'campaign' },
        ],
        separator: ';',
        terminator: '.',
      },
      closing:
        'These are coarse signals from this browser, not proof that the same person took each action.',
      fallback:
        'Browser context only; not a lead score. No engagement context was available in this browser.',
    },
    // DOM order is also the order the labels appear in the delivered email. The
    // preferred-channel select deliberately precedes `phone` so its `requiredWhen` rule
    // fires after the visitor chooses, never retroactively on a field they have already
    // left behind.
    fields: [
      {
        name: 'name',
        label: 'Full name',
        emailLabel: 'Full name',
        control: 'text',
        required: true,
        requiredMessage: 'Enter your full name',
        autoComplete: 'name',
        maxLength: 80,
        lengthMessage: 'Shorten your full name to 80 characters or fewer',
      },
      {
        name: 'email',
        label: 'Email address',
        emailLabel: 'Email address',
        control: 'email',
        required: true,
        requiredMessage: 'Enter your email address',
        autoComplete: 'email',
        maxLength: 254,
        formatMessage: 'Enter an email address in the format name@example.com',
        lengthMessage: 'Shorten your email address to 254 characters or fewer',
      },
      {
        name: 'preferredChannel',
        label: 'How should we reach you?',
        emailLabel: 'Preferred contact channel',
        control: 'select',
        required: true,
        requiredMessage: 'Select how we should reach you',
        autoComplete: 'off',
        placeholderOption: 'Select a channel',
        options: CONTACT_CHANNEL_OPTIONS,
      },
      {
        // Optional by default (D-13). `requiredWhen` is the generic descriptor the form
        // component evaluates without knowing this product: when `preferredChannel` holds
        // one of the two channels that need a number to be reachable, this field becomes
        // required in the native attribute, in `aria-required`, in the derived label
        // suffix, in the validator, and in the announcement below — all from this one
        // place (D-15). `{value}` is replaced by the chosen channel at announcement time.
        // `formatPattern` is deliberately permissive about punctuation: it accepts the
        // way people in Kenya actually write their numbers and never rewrites what the
        // visitor typed. The leading lookahead is the one thing it is strict about — at
        // least seven digits must appear somewhere in the value, so a value made only of
        // separators (`-`, `()`, `+-`) cannot satisfy the conditional-required gate and
        // reach the inbox as an uncallable number.
        name: 'phone',
        label: 'Phone number',
        emailLabel: 'Phone number',
        control: 'tel',
        required: false,
        requiredMessage:
          'Enter a phone number so we can reach you on the channel you chose',
        autoComplete: 'tel',
        maxLength: 30,
        formatPattern: '^(?=(?:[^0-9]*[0-9]){7,})\\+?[0-9 ()-]+$',
        formatMessage: 'Enter a phone number using digits, spaces, or +',
        lengthMessage: 'Shorten your phone number to 30 characters or fewer',
        requiredWhen: {
          field: 'preferredChannel',
          values: ['WhatsApp', 'Phone call'],
          message:
            'A phone number is now required because you asked us to reach you by {value}.',
        },
      },
      {
        name: 'role',
        label: 'Your role',
        emailLabel: 'Role',
        control: 'select',
        required: true,
        requiredMessage: 'Select your role',
        autoComplete: 'off',
        placeholderOption: 'Select your role',
        options: ROLE_OPTIONS,
      },
      {
        // Never required, so `requiredMessage` is unreachable copy the shared field shape
        // still demands; the reachable message for this field is `lengthMessage`.
        name: 'organization',
        label: 'Organization',
        emailLabel: 'Organization',
        control: 'text',
        required: false,
        requiredMessage: 'Enter your organization',
        autoComplete: 'organization',
        maxLength: 120,
        lengthMessage: 'Shorten your organization to 120 characters or fewer',
      },
      {
        name: 'portfolioBand',
        label: 'How many units do you manage?',
        emailLabel: 'Portfolio size',
        control: 'select',
        required: true,
        requiredMessage: 'Select how many units you manage',
        autoComplete: 'off',
        placeholderOption: 'Select a range',
        options: PORTFOLIO_BAND_OPTIONS,
      },
      {
        name: 'county',
        label: 'Where are your properties?',
        emailLabel: 'Location',
        control: 'select',
        required: true,
        requiredMessage: 'Select where your properties are',
        autoComplete: 'address-level1',
        placeholderOption: 'Select a county',
        options: KENYAN_COUNTY_OPTIONS,
      },
      {
        name: 'timeframe',
        label: 'When would you like to start?',
        emailLabel: 'Onboarding timeframe',
        control: 'select',
        required: true,
        requiredMessage: 'Select when you would like to start',
        autoComplete: 'off',
        placeholderOption: 'Select a timeframe',
        options: TIMEFRAME_OPTIONS,
      },
      {
        // D-20 / D-26: email-only by construction. This value is never written to any
        // measurement or engagement-summary payload, in this phase or a later one.
        // Never required, so `requiredMessage` is unreachable copy the shared field shape
        // still demands; the reachable message for this field is `lengthMessage`.
        name: 'message',
        label: 'Anything else we should know?',
        emailLabel: 'Message',
        control: 'textarea',
        required: false,
        requiredMessage: 'Enter your message',
        autoComplete: 'off',
        rows: 4,
        maxLength: 1000,
        lengthMessage: 'Shorten your message to 1000 characters or fewer',
      },
    ],
    groups: [
      { legend: 'About you', fieldNames: ['name', 'email', 'preferredChannel', 'phone'] },
      {
        legend: 'About your portfolio',
        fieldNames: ['role', 'organization', 'portfolioBand', 'county'],
      },
      { legend: 'Getting started', fieldNames: ['timeframe', 'message'] },
    ],
  },
  measurement: HAOO_MEASUREMENT,
};
