import type { ProductDefinition } from './types';

export type { ProductDefinition } from './types';

// Wave 0 intentionally leaves behavior data incomplete. Plans 01-02 through
// 01-05 fill this typed surface while keeping every HAOO fact centralized here.
export const HAOO_PRODUCT: ProductDefinition = {
  slug: 'haoo',
  name: 'HAOO',
  relationship: 'Product relationship pending',
  outcome: 'Product outcome pending',
  audienceLead: 'Product audience pending',
  audiences: [],
  pains: [],
  benefits: [],
  capabilities: [],
  journey: [],
  featureCaveat: 'Feature caveat pending',
  marketClaim: 'Market claim pending',
  assistedInvitation: 'Assisted onboarding copy pending',
  contacts: {
    phoneDisplay: 'Phone pending',
    phoneNumber: 'pending',
    phoneHref: '#phone-pending',
    email: 'Email pending',
    emailHref: '#email-pending',
    whatsappStarterText: '',
    whatsappHref: 'https://example.invalid/whatsapp-pending',
    selfOnboardingDisplay: 'Onboarding destination pending',
    selfOnboardingHref: '#onboarding-pending',
  },
  brochure: {
    pdfHref: '#brochure-pending',
    previewImageHref: '#preview-pending',
    downloadName: 'brochure-pending.pdf',
    expectationLabel: 'PDF details pending',
  },
};
