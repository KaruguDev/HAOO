import type { ProductDefinition } from './types';

export type { ProductDefinition } from './types';

const WHATSAPP_STARTER_TEXT =
  'Hello HAOO, I would like help choosing the best way to get started.';
const PHONE_NUMBER = '254702188044';

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
};
