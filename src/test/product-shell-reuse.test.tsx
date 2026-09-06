import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import ProductPage from '../pages/ProductPage';
import { HAOO_PRODUCT } from '../products/haoo';
import {
  brochureFallbackBody,
  brochureLead,
  contentAnchorId,
  mobileNavigationId,
  mobileSectionsNavLabel,
  navigationToggleLabel,
  parentRelationshipLine,
  qualifyEntryPointLabel,
  sectionsNavLabel,
  selfOnboardingActionLabel,
  selfOnboardingLead,
  skipToContentLabel,
  whatsappActionLabel,
} from '../products/copy';
import type { ProductDefinition } from '../products/types';

const ROOT = resolve(import.meta.dirname, '../..');
const GENERIC_PRODUCT_SOURCES = [
  'src/pages/ProductPage.tsx',
  'src/components/ProductHeader.tsx',
  'src/components/OnboardingChoices.tsx',
  'src/components/BrochurePanel.tsx',
  // NARROWED from eleven entries to ten by plan `04.2-02`: `ProductsSection.tsx` rendered
  // the parent site's product grid and is not in this repository. Plan `04.2-06` registers
  // it in ZERO-PAPER HUB's copy of this list.
  'src/components/QualifyForm.tsx',
  'src/components/qualify-form.logic.ts',
  'src/components/QualifyFallback.tsx',
  'src/products/copy.ts',
  'src/products/engagement-summary.ts',
  'src/products/types.ts',
] as const;

function withoutComments(source: string) {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    true,
    ts.LanguageVariant.JSX,
    source,
  );
  const tokens: string[] = [];

  for (
    let token = scanner.scan();
    token !== ts.SyntaxKind.EndOfFileToken;
    token = scanner.scan()
  ) {
    tokens.push(scanner.getTokenText());
  }

  return tokens.join(' ');
}

function syntheticProduct(
  overrides: Partial<ProductDefinition> = {},
): ProductDefinition {
  return {
    slug: 'zenith',
    name: 'ZENITH',
    relationship: 'A ZERO-PAPER HUB product',
    outcome: 'Keep every operation in view.',
    audienceLead: 'For teams coordinating a growing service operation.',
    audiences: ['Operators'],
    painHeading: 'Where coordination breaks down',
    benefitHeading: 'A calmer operating rhythm',
    journeyHeading: 'Service workflow',
    pains: ['Disconnected records hide the next action.'],
    benefits: ['Bring work and reporting into one clear view.'],
    capabilities: [{
      title: 'Operations',
      description: 'Coordinate everyday work.',
      icon: 'reports',
    }],
    journey: [{ title: 'Start clearly', description: 'Set up the operation in one place.' }],
    featureCaveat: 'Feature availability may vary by subscription plan.',
    marketClaim: 'Designed for practical service operations.',
    assistedInvitation: 'Tell us about your operation and we will help you begin.',
    media: {},
    contacts: {
      phoneDisplay: '+254 700 000 000',
      phoneNumber: '254700000000',
      phoneHref: 'tel:+254700000000',
      email: 'hello@zenith.example',
      emailHref: 'mailto:hello@zenith.example',
      whatsappStarterText: 'Hello ZENITH, I would like help getting started.',
      whatsappHref: 'https://wa.me/254700000000',
      selfOnboardingDisplay: 'manage.zenith.example',
      selfOnboardingHref: 'https://manage.zenith.example/',
    },
    brochure: {
      pdfHref: '/products/zenith/brochure.pdf',
      previewImageHref: '',
      previewImageAlt: 'ZENITH brochure preview',
      previewImageWidth: 1200,
      previewImageHeight: 800,
      downloadName: 'ZENITH-brochure.pdf',
      expectationLabel: 'PDF · 1 MB',
    },
    qualify: {
      endpoint: 'https://formsubmit.co/ajax/hello@zenith.example',
      subject: 'New ZENITH qualification enquiry — ZERO-PAPER HUB',
      sourceNote:
        'Sent from the ZENITH product page on ZERO-PAPER HUB (www.zenith.example)',
      // Field, group and engagement-summary configuration are reused verbatim from the
      // shipped product so the "no HAOO literal" assertion below proves the form itself
      // is product-generic. The summary is never rendered — it exists only on the
      // submitted body — so reusing its copy cannot satisfy that assertion by accident.
      engagementSummary: HAOO_PRODUCT.qualify.engagementSummary,
      fields: HAOO_PRODUCT.qualify.fields,
      groups: HAOO_PRODUCT.qualify.groups,
    },
    measurement: {
      productKey: 'zenith',
      storageKey: 'zph.zenith.ctx.v1',
      schemaVersion: 1,
      events: ['zenith_page_view'],
      pageViewEvent: 'zenith_page_view',
      interactionEvents: {
        brochurePreview: 'zenith_page_view',
        brochureOpen: 'zenith_page_view',
        brochureDownload: 'zenith_page_view',
        qualifyStart: 'zenith_page_view',
        qualifySubmit: 'zenith_page_view',
        assistedWhatsapp: 'zenith_page_view',
        assistedPhone: 'zenith_page_view',
        assistedEmail: 'zenith_page_view',
        selfOnboarding: 'zenith_page_view',
      },
      interactionFlags: [
        'brochureViewed',
        'brochureDownloaded',
        'qualifyStarted',
        'assistedContact',
        'selfOnboarding',
      ],
      interactionEventFlags: {},
      provider: 'none',
      providerConfig: { token: '', apiHost: '' },
      disclosure: {
        summary: 'How we measure this page',
        intro: 'This synthetic page uses one aggregate signal and one local browser record.',
        signalsHeading: 'Signals this page can count',
        signalLines: {
          zenith_page_view: 'That you viewed this ZENITH page.',
        },
        signalBoundary: 'The signal is a bare name with no form answers attached.',
        browserHeading: 'What this browser remembers',
        browserFacts: [
          'Whether this visit is first, returning, or frequent.',
          'A coarse last-seen band.',
          'A bounded set of interaction flags.',
          'A capped visit step.',
          'A day-only last-seen value.',
        ],
        browserBoundary: 'Derivation values never enter submissions.',
        campaignHeading: 'Campaign information',
        campaignDescription: 'Allowlisted campaign values last for one page lifetime.',
        // The synthetic product supplies its OWN controller statement, naming the
        // synthetic operator and never ZERO-PAPER HUB or HAOO — the case asserting the
        // rendered synthetic product carries no HAOO name depends on that.
        controllerHeading: 'Who operates ZENITH and receives this information',
        controllerNote:
          'ZENITH is a product of a synthetic operator, which decides how the information on this page is collected and used.',
        processorHeading: 'Where this measurement is processed',
        processorNote: 'This synthetic page sends no signals to an external processor.',
        neverCollectedHeading: 'What we never collect for measurement',
        neverCollected: ['Form answers or cross-site identifiers.'],
        summaryHeading: 'What we attach to your form submission',
        summaryIntro: 'We attach one short readable paragraph of the coarse signals above.',
        summaryContents: ['Whether this visit is first, returning, or frequent.'],
        summaryBoundary: 'It contains no score, no identifier, and none of your form answers.',
        clearLabel: 'Clear what this page remembers',
        clearSuccess: 'What this page remembered has been cleared.',
        clearBlocked: 'This page stopped using remembered context for this visit.',
      },
    },
    ...overrides,
  };
}

/**
 * Product names are data, never patterns. `HAOO` is inert today, but a future `Q.ai`,
 * `Zero+` or `Flow (Beta)` would either throw at compile time or — worse — silently
 * change this guard's meaning: `Q.ai` matches `Qxai`, and a name containing `.*` would
 * match every file and pass vacuously. This test is the only enforcement of the reuse
 * contract, so product data must not be able to weaken it.
 */
function escapeRegExp(literal: string) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('Phase 1 product shell reuse contracts', () => {
  it('renders a synthetic product through every product-named shell surface', () => {
    const product = syntheticProduct();
    const { container } = render(<ProductPage product={product} />);

    expect(screen.getByRole('link', { name: 'Skip to ZENITH content' }).getAttribute('href'))
      .toBe('#zenith-content');
    expect(screen.getByRole('navigation', { name: 'ZENITH sections' })).toBeTruthy();
    const toggle = screen.getByRole('button', { name: 'Open ZENITH navigation' });
    fireEvent.click(toggle);
    expect(screen.getByRole('navigation', { name: 'ZENITH mobile sections' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Chat with ZENITH on WhatsApp' }))
      .toHaveLength(3);
    expect(screen.getAllByText("Continue to ZENITH's platform for self-onboarding."))
      .toHaveLength(3);
    expect(screen.getAllByRole('link', { name: 'Start with ZENITH' })).toHaveLength(3);
    const entryLinks = screen.getAllByRole('link', { name: 'Send your details instead' });
    expect(entryLinks).toHaveLength(3);
    expect(entryLinks.every((link) => link.getAttribute('href') === '#qualify')).toBe(true);
    expect(screen.getByRole('heading', { name: product.painHeading })).toBeTruthy();
    expect(screen.getByRole('heading', { name: product.benefitHeading })).toBeTruthy();
    expect(screen.getByRole('region', { name: product.journeyHeading })).toBeTruthy();
    expect(screen.getByText(/complete ZENITH explanation/)).toBeTruthy();
    expect(screen.getByText('ZENITH is a ZERO-PAPER HUB product')).toBeTruthy();
    expect(container.textContent).not.toContain('HAOO');
    expect(container.textContent).not.toContain('The paperwork problem');
    expect(container.textContent).not.toContain('Less chasing. More control.');
    expect(container.textContent).not.toContain('Rental journey');
  });

  it('reproduces every shipped product-name string byte for byte', () => {
    expect(skipToContentLabel('HAOO')).toBe('Skip to HAOO content');
    expect(sectionsNavLabel('HAOO')).toBe('HAOO sections');
    expect(mobileSectionsNavLabel('HAOO')).toBe('HAOO mobile sections');
    expect(navigationToggleLabel('HAOO', false)).toBe('Open HAOO navigation');
    expect(navigationToggleLabel('HAOO', true)).toBe('Close HAOO navigation');
    expect(whatsappActionLabel('HAOO')).toBe('Chat with HAOO on WhatsApp');
    expect(selfOnboardingLead('HAOO'))
      .toBe("Continue to HAOO's platform for self-onboarding.");
    expect(selfOnboardingActionLabel('HAOO')).toBe('Start with HAOO');
    expect(brochureLead('HAOO')).toBe(
      'The overview above is the complete HAOO explanation. Open or download the original brochure PDF if you prefer the printed document.',
    );
    expect(brochureFallbackBody('HAOO')).toBe(
      'You can still open the HAOO brochure in a new tab or download the PDF.',
    );
    expect(parentRelationshipLine('HAOO')).toBe('HAOO is a ZERO-PAPER HUB product');
    expect(qualifyEntryPointLabel('HAOO')).toBe('Send your details instead');
    expect(contentAnchorId('haoo')).toBe('haoo-content');
    expect(mobileNavigationId('haoo')).toBe('haoo-mobile-navigation');
  });

  it('fails closed when a product identity is empty', () => {
    const nameBuilders = [
      skipToContentLabel,
      sectionsNavLabel,
      mobileSectionsNavLabel,
      whatsappActionLabel,
      selfOnboardingLead,
      selfOnboardingActionLabel,
      brochureLead,
      brochureFallbackBody,
      parentRelationshipLine,
      qualifyEntryPointLabel,
    ];

    for (const builder of nameBuilders) {
      expect(() => builder('  ')).toThrow('Product name must not be empty');
    }
    expect(() => navigationToggleLabel('', false)).toThrow('Product name must not be empty');
    expect(() => contentAnchorId('')).toThrow('Product slug must not be empty');
    expect(() => mobileNavigationId(' ')).toThrow('Product slug must not be empty');
  });

  /*
   * WITHDRAWN by plan `04.2-02`. Successors, all three in this file and all three green:
   *   1. `renders a synthetic product through every product-named shell surface`
   *   2. `reproduces every shipped product-name string byte for byte`
   *   3. `rejects product-name literals in product-generic executable source`
   *
   * What this case claimed: that the shared product shell derives every product-named
   * surface — skip link, sections navigation, mobile navigation toggle and panel,
   * self-onboarding action and parent-relationship line — correctly for EVERY product in
   * the registered collection, by rendering each one in turn. Its force came from
   * iterating a collection with more than one member: a shell that had quietly hardcoded
   * one product's name would render the second product wrongly and go red here.
   *
   * What stopped being true, and why: `04.2-02` split ZERO-PAPER HUB and HAOO into
   * separate repositories. `src/products/registry.ts` was the parent site's product
   * collection and is not in this repository; this repository has exactly one product.
   * The claim did not become FALSE — it became VACUOUS. Iterating a one-element collection
   * cannot distinguish a generic shell from one hardcoded to that single element, so the
   * case would have gone on passing while proving nothing. A test that passes for a reason
   * unrelated to what it names is worse than an absent one, which is why this is retired
   * rather than kept in a shrunken form. (D-05.)
   *
   * What the successors prove instead, together and without a registry:
   *   (1) renders a SYNTHETIC second product — `ZENITH`, defined in this file, deliberately
   *       not the shipped one — through every one of those same shell surfaces, and
   *       asserts `container.textContent` carries no `HAOO` anywhere. That is the real
   *       content of the original claim: the shell works for a product it has never seen.
   *   (2) pins every product-name string builder byte for byte, so the surfaces the
   *       synthetic render exercises cannot drift in wording.
   *   (3) scans every product-generic source for the shipped product's name and rejects it,
   *       so genericity is enforced in the source as well as in one render.
   *
   * Retained rather than deleted so a reader comparing this suite against Phase 1's
   * inventory sees a recorded withdrawal with named successors, not a case that vanished
   * when the repository split (SC6, PROD-06).
   */

  it('rejects product-name literals in product-generic executable source', () => {
    let scanned = 0;
    // Re-sourced from the product definition directly by plan `04.2-02`. This used to read
    // `PRODUCTS[0].name` through the registry, which the split removed; the name is the
    // same string, and taking it from the product module keeps this successor green
    // without weakening what it asserts.
    const productName = HAOO_PRODUCT.name;
    const productNamePattern = new RegExp(escapeRegExp(productName), 'i');

    for (const relativePath of GENERIC_PRODUCT_SOURCES) {
      const source = withoutComments(readFileSync(resolve(ROOT, relativePath), 'utf8'));
      scanned += 1;

      // No carve-out. The engagement-summary email label is the product's own wording
      // and lives in the product module; the generic form logic reserves it structurally
      // (MEAS-05), so no generic source may carry a product name for any reason.
      expect(source, relativePath).not.toMatch(productNamePattern);
    }

    expect(scanned).toBeGreaterThan(0);
    expect(withoutComments(`// ${productName}\nconst safe = true;`))
      .not.toMatch(productNamePattern);
    expect(withoutComments(`const product = '${productName}';`))
      .toMatch(productNamePattern);

    // The escape is load-bearing, not decorative: an unescaped metacharacter-carrying
    // name would silently widen this guard rather than fail loudly.
    const riskyName = 'Q.ai (Beta)+';
    const riskyPattern = new RegExp(escapeRegExp(riskyName), 'i');

    expect(riskyPattern.test(riskyName)).toBe(true);
    expect(riskyPattern.test('Qxai (Beta)')).toBe(false);
    expect(new RegExp(escapeRegExp('.*'), 'i').test('anything at all')).toBe(false);
  });
});
