import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProductPage from '../pages/ProductPage';
import { HAOO_PRODUCT } from '../products/haoo';

const ONBOARDING_LINKS = [
  ['Chat with HAOO on WhatsApp', HAOO_PRODUCT.contacts.whatsappHref],
  ['Call +254 702 188 044', 'tel:+254702188044'],
  ['Email info@haoo.online', 'mailto:info@haoo.online'],
  ['Start with HAOO', 'https://manage.haoo.online/'],
] as const;

const OPEN_BROCHURE = /Open brochure.*new tab/i;
const DOWNLOAD_BROCHURE = 'Download brochure';
const FALLBACK_HEADING = 'Brochure preview unavailable';
const FALLBACK_BODY = 'You can still open the HAOO brochure in a new tab or download the PDF.';
const PREVIEW_ERROR =
  "We couldn't show the brochure preview here. Open the brochure or download the PDF instead.";

function renderPage() {
  return render(<ProductPage product={HAOO_PRODUCT} />);
}

function brochureRegion() {
  return screen.getByRole('region', { name: 'Brochure' });
}

describe('Phase 1 semantic HAOO page contracts', () => {
  it('[phase1-red:page] renders the outcome-led accessible tracer', () => {
    renderPage();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', {
      level: 1,
      name: 'Run the business—not the paperwork.',
    })).toBeTruthy();
    expect(screen.getByText('A ZERO-PAPER HUB product')).toBeTruthy();
    expect(screen.getByText(/For landlords and property managers/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Skip to HAOO content' })).toBeTruthy();
  });

  it('renders fixed sequential semantic sections and product navigation', () => {
    renderPage();

    const expectedSections = ['Benefits', 'Capabilities', 'Rental journey', 'Brochure', 'Onboarding'];
    const sections = screen.getAllByRole('region')
      .map((section) => section.getAttribute('aria-label'))
      .filter((label) => expectedSections.includes(label ?? ''));
    expect(sections).toEqual(expectedSections);
    expect(screen.getAllByRole('link', { name: 'Back to ZERO-PAPER HUB' })
      .every((link) => link.getAttribute('href') === '/')).toBe(true);
    for (const sectionName of ['Benefits', 'Capabilities', 'Brochure', 'Onboarding']) {
      expect(screen.getByRole('link', { name: sectionName })).toBeTruthy();
    }
  });

  it('renders the pain-before-benefit story with the exact caveat and market source fidelity', () => {
    renderPage();

    const benefits = screen.getByRole('region', { name: 'Benefits' });
    const paragraphs = Array.from(benefits.querySelectorAll('p'))
      .map((node) => node.textContent ?? '');

    expect(HAOO_PRODUCT.pains.length).toBeGreaterThan(0);
    expect(HAOO_PRODUCT.benefits.length).toBeGreaterThan(0);
    for (const claim of [...HAOO_PRODUCT.pains, ...HAOO_PRODUCT.benefits]) {
      expect(paragraphs).toContain(claim);
    }

    const lastPain = Math.max(...HAOO_PRODUCT.pains.map((pain) => paragraphs.indexOf(pain)));
    const firstBenefit = Math.min(
      ...HAOO_PRODUCT.benefits.map((benefit) => paragraphs.indexOf(benefit)),
    );
    expect(lastPain).toBeLessThan(firstBenefit);

    const capabilities = screen.getByRole('region', { name: 'Capabilities' });
    expect(within(capabilities)
      .getByText('Feature availability may vary by subscription plan.')).toBeTruthy();
    expect(screen.getByText(
      'Built for the realities of property management in Kenya, with familiar digital payment journeys and role-based access.',
    )).toBeTruthy();
  });

  it('renders exact capability and rental journey descriptions without outcome guarantees (source fidelity)', () => {
    const { container } = renderPage();

    expect(HAOO_PRODUCT.capabilities).toHaveLength(6);
    expect(HAOO_PRODUCT.journey).toHaveLength(4);

    const capabilities = screen.getByRole('region', { name: 'Capabilities' });
    for (const { description } of HAOO_PRODUCT.capabilities) {
      expect(within(capabilities).getByText(description)).toBeTruthy();
    }

    const journey = screen.getByRole('region', { name: 'Rental journey' });
    for (const { description } of HAOO_PRODUCT.journey) {
      expect(within(journey).getByText(description)).toBeTruthy();
    }

    const pageText = container.textContent ?? '';
    for (const forbidden of [
      /guarantee/i,
      /risk[- ]free/i,
      /never vacant/i,
      /always paid/i,
      /ensures? (?:rent|payment|tenants|occupancy)/i,
    ]) {
      expect(pageText).not.toMatch(forbidden);
    }
  });

  it('renders all six brochure capability groups as textual cards', () => {
    renderPage();

    const capabilities = screen.getByRole('region', { name: 'Capabilities' });
    for (const title of [
      'Rent & payments',
      'Properties & units',
      'Leases & screening',
      'Maintenance',
      'Vacancy marketplace',
      'Reports & communication',
    ]) {
      expect(within(capabilities).getByRole('heading', { name: title })).toBeTruthy();
    }
  });

  it('renders the four rental journey steps as an ordered list', () => {
    renderPage();

    const journey = screen.getByRole('region', { name: 'Rental journey' });
    expect(within(journey).getByRole('list').tagName).toBe('OL');
    expect(within(journey).getAllByRole('listitem')).toHaveLength(4);
    expect(within(journey).getAllByRole('heading').map(({ textContent }) => textContent)).toEqual([
      'Fill vacancies with confidence',
      'Move in with clarity',
      'Make every month easier',
      'Grow with visibility',
    ]);
  });

  it('renders three independent onboarding placements with exact native hrefs', () => {
    renderPage();

    const placements = screen.getAllByRole('region', { name: /onboarding choices/i });
    expect(placements).toHaveLength(3);
    for (const [name, href] of ONBOARDING_LINKS) {
      const links = screen.getAllByRole('link', { name });
      expect(links).toHaveLength(3);
      expect(links.every((link) => link.getAttribute('href') === href)).toBe(true);
    }
  });

  it('keeps mobile and desktop brochure recovery plus Open and Download independent', () => {
    renderPage();

    const brochure = screen.getByRole('region', { name: 'Brochure' });
    expect(within(brochure).getByText('Brochure preview unavailable')).toBeTruthy();
    expect(within(brochure).getByText(
      'You can still open the HAOO brochure in a new tab or download the PDF.',
    )).toBeTruthy();
    expect(brochure.querySelector('object[type="application/pdf"]')).not.toBeNull();

    const openLink = within(brochure).getByRole('link', { name: /Open brochure.*new tab/i });
    expect(openLink.getAttribute('href')).toBe(HAOO_PRODUCT.brochure.pdfHref);
    expect(openLink.getAttribute('rel')).toContain('noopener');
    const downloadLink = within(brochure).getByRole('link', { name: 'Download brochure' });
    expect(downloadLink.hasAttribute('download')).toBe(true);
    expect(within(brochure).getByText('PDF · 2.1 MB')).toBeTruthy();
  });

  it('publishes the original brochure PDF facts from centralized product data', () => {
    expect(HAOO_PRODUCT.brochure.pdfHref).toBe('/products/haoo/HAOO-Marketing-Brochure.pdf');
    expect(HAOO_PRODUCT.brochure.downloadName).toBe('HAOO-Marketing-Brochure.pdf');
    expect(HAOO_PRODUCT.brochure.expectationLabel).toBe('PDF · 2.1 MB');
    expect(HAOO_PRODUCT.brochure.previewImageAlt).toBe('HAOO property-management brochure preview');
  });

  it('places the brochure after the complete guided overview and before the final onboarding block', () => {
    renderPage();

    const journey = screen.getByRole('region', { name: 'Rental journey' });
    const brochure = brochureRegion();
    const onboarding = screen.getByRole('region', { name: 'Onboarding' });

    expect(journey.compareDocumentPosition(brochure) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeGreaterThan(0);
    expect(brochure.compareDocumentPosition(onboarding) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeGreaterThan(0);
  });

  it('renders a compact preview below lg, a lg-only PDF object, and controls outside the object', () => {
    renderPage();

    const brochure = brochureRegion();
    const preview = within(brochure).getByRole('img', {
      name: HAOO_PRODUCT.brochure.previewImageAlt,
    });
    expect(preview.getAttribute('src')).toBe(HAOO_PRODUCT.brochure.previewImageHref);
    expect(preview.getAttribute('width')).toBe('1287');
    expect(preview.getAttribute('height')).toBe('909');
    expect(preview.parentElement?.className).toContain('lg:hidden');

    const pdfObject = brochure.querySelector('object[type="application/pdf"]');
    expect(pdfObject).not.toBeNull();
    expect(pdfObject!.getAttribute('data')).toBe(HAOO_PRODUCT.brochure.pdfHref);
    expect(pdfObject!.parentElement?.className).toContain('hidden');
    expect(pdfObject!.parentElement?.className).toContain('lg:block');
    expect(pdfObject!.textContent).toContain(FALLBACK_HEADING);
    expect(pdfObject!.textContent).toContain(FALLBACK_BODY);

    const openLink = within(brochure).getByRole('link', { name: OPEN_BROCHURE });
    const downloadLink = within(brochure).getByRole('link', { name: DOWNLOAD_BROCHURE });
    expect(pdfObject!.contains(openLink)).toBe(false);
    expect(pdfObject!.contains(downloadLink)).toBe(false);
    expect(pdfObject!.contains(preview)).toBe(false);
    expect(openLink.getAttribute('target')).toBe('_blank');
    expect(downloadLink.getAttribute('download')).toBe(HAOO_PRODUCT.brochure.downloadName);
    expect(downloadLink.getAttribute('target')).toBeNull();
  });

  it('renders the exact preview error copy and keeps both controls when brochure media is absent', () => {
    render(
      <ProductPage
        product={{
          ...HAOO_PRODUCT,
          brochure: { ...HAOO_PRODUCT.brochure, previewImageHref: '' },
        }}
      />,
    );

    const brochure = brochureRegion();
    expect(within(brochure).getByText(PREVIEW_ERROR)).toBeTruthy();
    expect(within(brochure).queryByRole('img')).toBeNull();
    expect(within(brochure).getByRole('link', { name: OPEN_BROCHURE })
      .getAttribute('href')).toBe(HAOO_PRODUCT.brochure.pdfHref);
    expect(within(brochure).getByRole('link', { name: DOWNLOAD_BROCHURE })
      .hasAttribute('download')).toBe(true);
    expect(within(brochure).getByText(HAOO_PRODUCT.brochure.expectationLabel)).toBeTruthy();
  });

  it('falls back to the exact error copy when the supplied preview image fails to load', () => {
    renderPage();

    const brochure = brochureRegion();
    fireEvent.error(within(brochure).getByRole('img', {
      name: HAOO_PRODUCT.brochure.previewImageAlt,
    }));

    expect(within(brochure).getByText(PREVIEW_ERROR)).toBeTruthy();
    expect(within(brochure).queryByRole('img')).toBeNull();
    expect(within(brochure).getByRole('link', { name: OPEN_BROCHURE })).toBeTruthy();
    expect(within(brochure).getByRole('link', { name: DOWNLOAD_BROCHURE })).toBeTruthy();
  });

  it('keeps Open and Download independent under repeated, interrupted, and concurrent activation', () => {
    renderPage();

    const brochure = brochureRegion();
    const controls = within(brochure).getByRole('link', { name: DOWNLOAD_BROCHURE }).parentElement!;
    const before = controls.outerHTML;
    const preventNavigation = (event: Event) => event.preventDefault();

    document.addEventListener('click', preventNavigation);
    try {
      for (let round = 0; round < 3; round += 1) {
        fireEvent.click(within(brochure).getByRole('link', { name: OPEN_BROCHURE }));
        fireEvent.click(within(brochure).getByRole('link', { name: DOWNLOAD_BROCHURE }));
        fireEvent.click(within(brochure).getByRole('link', { name: OPEN_BROCHURE }));
      }
    } finally {
      document.removeEventListener('click', preventNavigation);
    }

    expect(controls.outerHTML).toBe(before);

    const openLink = within(brochure).getByRole('link', { name: OPEN_BROCHURE });
    const downloadLink = within(brochure).getByRole('link', { name: DOWNLOAD_BROCHURE });
    expect(openLink.getAttribute('href')).toBe(HAOO_PRODUCT.brochure.pdfHref);
    expect(downloadLink.getAttribute('href')).toBe(HAOO_PRODUCT.brochure.pdfHref);
    expect(openLink.getAttribute('aria-disabled')).toBeNull();
    expect(downloadLink.getAttribute('aria-disabled')).toBeNull();
    expect(openLink.hasAttribute('disabled')).toBe(false);
    expect(downloadLink.hasAttribute('disabled')).toBe(false);
  });

  it('protects every new-tab navigation from opener control and labels it visibly', () => {
    const { container } = renderPage();

    const newTabLinks = Array.from(container.querySelectorAll('a[target="_blank"]'));
    expect(newTabLinks.length).toBeGreaterThan(0);
    for (const link of newTabLinks) {
      const rel = (link.getAttribute('rel') ?? '').split(/\s+/);
      expect(rel).toContain('noopener');
      expect(rel).not.toContain('opener');
      expect((link.textContent ?? '').trim().length).toBeGreaterThan(0);
    }

    const brochure = brochureRegion();
    expect(within(brochure).getByRole('link', { name: DOWNLOAD_BROCHURE })
      .getAttribute('target')).toBeNull();
  });

  it('publishes the exact supplied logo and hero media with reserved space', () => {
    const { container } = renderPage();

    const logo = container.querySelector('img[src="/products/haoo/haoo-logo.png"]');
    expect(logo).not.toBeNull();
    expect(logo!.getAttribute('alt')).toBe('');
    expect(logo!.getAttribute('width')).toBe('362');
    expect(logo!.getAttribute('height')).toBe('176');

    const hero = screen.getByRole('img', {
      name: 'Property manager outside a modern apartment building',
    });
    expect(hero.getAttribute('src')).toBe('/products/haoo/haoo-hero.png');
    expect(hero.getAttribute('width')).toBe('1122');
    expect(hero.getAttribute('height')).toBe('1402');
    expect(hero.className).toContain('aspect-[4/3]');
    expect(hero.className).toContain('lg:aspect-[4/5]');
    expect(hero.className).toContain('object-cover');
    expect(hero.parentElement?.textContent).toBe('');

    const [whatsapp] = screen.getAllByRole('link', { name: 'Chat with HAOO on WhatsApp' });
    expect(whatsapp.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeGreaterThan(0);
  });

  it('keeps every fact and action available when partial media is omitted', () => {
    render(
      <ProductPage
        product={{
          ...HAOO_PRODUCT,
          media: {},
          brochure: { ...HAOO_PRODUCT.brochure, previewImageHref: '' },
        }}
      />,
    );

    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 1, name: HAOO_PRODUCT.outcome })).toBeTruthy();
    expect(screen.getByText(HAOO_PRODUCT.audienceLead)).toBeTruthy();
    expect(screen.getByText('A ZERO-PAPER HUB product')).toBeTruthy();
    expect(screen.getByText(HAOO_PRODUCT.marketClaim)).toBeTruthy();
    for (const [name, href] of ONBOARDING_LINKS) {
      const links = screen.getAllByRole('link', { name });
      expect(links).toHaveLength(3);
      expect(links.every((link) => link.getAttribute('href') === href)).toBe(true);
    }

    expect(screen.getByRole('link', { name: OPEN_BROCHURE }).getAttribute('href'))
      .toBe(HAOO_PRODUCT.brochure.pdfHref);
    expect(screen.getByRole('link', { name: DOWNLOAD_BROCHURE }).hasAttribute('download'))
      .toBe(true);
  });

  it('exposes accessible mobile navigation and unclipped native actions', () => {
    renderPage();

    const menu = screen.getByRole('button', { name: 'Open HAOO navigation' });
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(menu.getAttribute('aria-controls')).toBeTruthy();
    for (const [name] of ONBOARDING_LINKS) {
      for (const link of screen.getAllByRole('link', { name })) {
        expect(link.getAttribute('aria-disabled')).not.toBe('true');
        expect(link.getAttribute('href')).toBeTruthy();
      }
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  });

  it('keeps navigation accessibility and all onboarding placements tied to one product', () => {
    renderPage();

    const menu = screen.getByRole('button', { name: 'Open HAOO navigation' });
    fireEvent.click(menu);
    expect(menu.getAttribute('aria-expanded')).toBe('true');

    const mobileNavigation = document.getElementById(menu.getAttribute('aria-controls')!);
    expect(mobileNavigation).not.toBeNull();
    fireEvent.click(within(mobileNavigation!).getByRole('link', { name: 'Benefits' }));
    expect(menu.getAttribute('aria-expanded')).toBe('false');

    expect(screen.getAllByRole('region', { name: /onboarding choices/i })).toHaveLength(3);
    expect(screen.getByText('HAOO is a ZERO-PAPER HUB product')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Back to ZERO-PAPER HUB' })).toHaveLength(2);
  });
});
