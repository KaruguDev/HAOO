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
  pains: [],
  benefits: [],
  capabilities: [],
  journey: [],
  featureCaveat: 'Feature availability may vary by subscription plan.',
  marketClaim: 'Built for the realities of property management in Kenya, with familiar digital payment journeys and role-based access.',
  assistedInvitation: 'Tell us about your properties and we\'ll help you choose the best way to get started.',
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
    pdfHref: '#brochure-pending',
    previewImageHref: '#preview-pending',
    downloadName: 'brochure-pending.pdf',
    expectationLabel: 'PDF details pending',
  },
};
