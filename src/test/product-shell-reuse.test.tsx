import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { ENGAGEMENT_SUMMARY_LABEL } from '../components/qualify-form.logic';
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
import { PRODUCTS } from '../products/registry';
import type { ProductDefinition } from '../products/types';

const ROOT = resolve(import.meta.dirname, '../..');
const GENERIC_PRODUCT_SOURCES = [
  'src/pages/ProductPage.tsx',
  'src/components/ProductHeader.tsx',
  'src/components/OnboardingChoices.tsx',
  'src/components/BrochurePanel.tsx',
  'src/components/ProductsSection.tsx',
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
        'Sent from the ZENITH product page on ZERO-PAPER HUB (www.zero-paperhub.com/products/zenith/)',
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

  it('derives product-named shell surfaces for every registered product', () => {
    expect(PRODUCTS.length).toBeGreaterThan(0);

    for (const product of PRODUCTS) {
      const view = render(<ProductPage product={product} />);

      expect(screen.getByRole('link', { name: skipToContentLabel(product.name) })).toBeTruthy();
      expect(screen.getByRole('navigation', { name: sectionsNavLabel(product.name) }))
        .toBeTruthy();
      const toggle = screen.getByRole('button', {
        name: navigationToggleLabel(product.name, false),
      });
      fireEvent.click(toggle);
      expect(screen.getByRole('navigation', { name: mobileSectionsNavLabel(product.name) }))
        .toBeTruthy();
      expect(screen.getAllByRole('link', { name: selfOnboardingActionLabel(product.name) }))
        .toHaveLength(3);
      expect(screen.getByText(parentRelationshipLine(product.name))).toBeTruthy();

      view.unmount();
    }
  });

  it('rejects product-name literals in product-generic executable source', () => {
    let scanned = 0;
    const productName = PRODUCTS[0].name;
    const productNamePattern = new RegExp(escapeRegExp(productName), 'i');

    for (const relativePath of GENERIC_PRODUCT_SOURCES) {
      const source = withoutComments(readFileSync(resolve(ROOT, relativePath), 'utf8'));
      scanned += 1;

      // Narrowed for exactly one file and exactly one string, never dropped:
      // `qualify-form.logic.ts` reserves the shipped engagement-summary email label by
      // name so that no product field can claim it (MEAS-05). Removing that one literal
      // first leaves every other product-name mention in that file, and every mention in
      // all the others, as loud a failure as before. The label itself stays pinned
      // byte-for-byte by the engagement-summary suite in `qualify-form.test.tsx`.
      const executable = relativePath.endsWith('qualify-form.logic.ts')
        ? source.split(ENGAGEMENT_SUMMARY_LABEL).join('')
        : source;

      expect(executable, relativePath).not.toMatch(productNamePattern);
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
