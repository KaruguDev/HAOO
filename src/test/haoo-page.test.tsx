import { render, screen, within } from '@testing-library/react';
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
    const sections = screen.getAllByRole('region').map((section) => section.getAttribute('aria-label'));
    expect(sections).toEqual(expectedSections);
    expect(screen.getByRole('link', { name: 'Back to ZERO-PAPER HUB' }).getAttribute('href'))
      .toBe('/');
    for (const sectionName of ['Benefits', 'Capabilities', 'Brochure', 'Onboarding']) {
      expect(screen.getByRole('link', { name: sectionName })).toBeTruthy();
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
});
