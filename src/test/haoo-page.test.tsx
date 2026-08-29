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

function renderPage() {
  return render(<ProductPage product={HAOO_PRODUCT} />);
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
    render(<ProductPage product={{ ...HAOO_PRODUCT, media: {} }} />);

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
