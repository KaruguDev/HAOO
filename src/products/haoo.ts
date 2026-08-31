import type {
  MeasurementProvider,
  ProductDefinition,
  ProductMeasurement,
  QualifyOption,
} from './types';
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

export function resolveMeasurementProvider(configuredValue?: string): MeasurementProvider {
  return configuredValue?.trim().toLowerCase() === 'none' ? 'none' : 'none';
}

export const HAOO_MEASUREMENT: ProductMeasurement<HaooMeasurementEvent> = {
  productKey: 'haoo',
  storageKey: 'zph.haoo.ctx.v1',
  schemaVersion: 1,
  events: HAOO_MEASUREMENT_EVENTS,
  pageViewEvent: 'haoo_page_view',
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
