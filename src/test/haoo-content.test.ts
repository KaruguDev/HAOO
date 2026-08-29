import { describe, expect, it } from 'vitest';
import { HAOO_PRODUCT } from '../products/haoo';

const EXPECTED_AUDIENCES = ['Landlords', 'Property managers', 'Tenants', 'Agents'];
const EXPECTED_CAPABILITIES = [
  'Rent & payments',
  'Properties & units',
  'Leases & screening',
  'Maintenance',
  'Vacancy marketplace',
  'Reports & communication',
];
const EXPECTED_JOURNEY = [
  'Fill vacancies with confidence',
  'Move in with clarity',
  'Make every month easier',
  'Grow with visibility',
];
const EXPECTED_WHATSAPP_TEXT =
  'Hello HAOO, I would like help choosing the best way to get started.';

describe('Phase 1 centralized HAOO content contracts', () => {
  it('[phase1-red:content] preserves the exact brochure ledger in centralized data', () => {
    expect(HAOO_PRODUCT.outcome).toBe('Run the business—not the paperwork.');
    expect(HAOO_PRODUCT.audiences).toEqual(EXPECTED_AUDIENCES);
    expect(HAOO_PRODUCT.capabilities.map(({ title }) => title)).toEqual(EXPECTED_CAPABILITIES);
    expect(HAOO_PRODUCT.journey.map(({ title }) => title)).toEqual(EXPECTED_JOURNEY);
    expect(HAOO_PRODUCT.featureCaveat)
      .toBe('Feature availability may vary by subscription plan.');
    expect(HAOO_PRODUCT.marketClaim).toBe(
      'Built for the realities of property management in Kenya, with familiar digital payment journeys and role-based access.',
    );
  });

  it('uses uppercase ZERO-PAPER HUB in every parent-brand datum', () => {
    expect(HAOO_PRODUCT.relationship).toBe('A ZERO-PAPER HUB product');
    expect(HAOO_PRODUCT.relationship).not.toMatch(/Zero-Paper Hub|Zero-Paper HUB|Zero Paper Hub/);
  });

  it('requires a non-empty generic WhatsApp starter datum and digits-only number', () => {
    expect(HAOO_PRODUCT.contacts.whatsappStarterText.trim().length).toBeGreaterThan(0);
    expect(HAOO_PRODUCT.contacts.whatsappStarterText).toBe(EXPECTED_WHATSAPP_TEXT);
    expect(HAOO_PRODUCT.contacts.phoneNumber).toMatch(/^\d+$/);
    expect(HAOO_PRODUCT.contacts.phoneNumber).toBe('254702188044');
  });

  it('builds deterministic WhatsApp encoding that decodes with punctuation intact', () => {
    const whatsappUrl = new URL(HAOO_PRODUCT.contacts.whatsappHref);

    expect(whatsappUrl.origin).toBe('https://wa.me');
    expect(whatsappUrl.pathname).toBe('/254702188044');
    expect(whatsappUrl.searchParams.get('text')).toBe(EXPECTED_WHATSAPP_TEXT);
    expect(HAOO_PRODUCT.contacts.whatsappHref).toBe(
      `https://wa.me/254702188044?text=${encodeURIComponent(EXPECTED_WHATSAPP_TEXT)}`,
    );
  });

  it('keeps every brochure-sourced native destination exact', () => {
    expect(HAOO_PRODUCT.contacts.phoneDisplay).toBe('+254 702 188 044');
    expect(HAOO_PRODUCT.contacts.phoneHref).toBe('tel:+254702188044');
    expect(HAOO_PRODUCT.contacts.email).toBe('info@haoo.online');
    expect(HAOO_PRODUCT.contacts.emailHref).toBe('mailto:info@haoo.online');
    expect(HAOO_PRODUCT.contacts.selfOnboardingHref).toBe('https://manage.haoo.online/');
  });
});
