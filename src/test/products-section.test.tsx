import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomePage } from '../App';
import ProductsSection from '../components/ProductsSection';
import { HAOO_PRODUCT } from '../products/haoo';
import { PRODUCTS_NAV_LABEL } from '../products/registry';
import type { ProductDefinition } from '../products/types';

function product(overrides: Partial<ProductDefinition>): ProductDefinition {
  return {
    ...HAOO_PRODUCT,
    ...overrides,
  };
}

describe('Phase 1 Products collection contracts', () => {
  it('[phase1-red:products] omits the Products landmark when the collection is empty', () => {
    render(<ProductsSection products={[]} />);

    expect(screen.queryByRole('region', { name: 'Products' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Products' })).toBeNull();
  });

  it('renders one product as a featured HAOO card with a native route', () => {
    render(<ProductsSection products={[HAOO_PRODUCT]} />);

    const products = screen.getByRole('region', { name: 'Products' });
    expect(within(products).getByRole('heading', { name: 'HAOO' })).toBeTruthy();
    expect(within(products).getByText('Run the business—not the paperwork.')).toBeTruthy();
    expect(within(products).getByText(/landlords and property managers/i)).toBeTruthy();
    expect(within(products).getByRole('link', { name: 'Explore HAOO' }).getAttribute('href'))
      .toBe('/products/haoo/');
  });

  it('renders many products as a semantic collection without changing HAOO', () => {
    const secondProduct = product({
      slug: 'future-product',
      name: 'Future product',
      outcome: 'A future product outcome',
    });

    render(<ProductsSection products={[HAOO_PRODUCT, secondProduct]} />);

    const products = screen.getByRole('region', { name: 'Products' });
    expect(within(products).getAllByRole('article')).toHaveLength(2);
    expect(within(products).getByRole('link', { name: 'Explore HAOO' }).getAttribute('href'))
      .toBe('/products/haoo/');
    expect(within(products).getByRole('heading', { name: 'Future product' })).toBeTruthy();
  });

  it('keeps required featured copy and navigation available without preview media', () => {
    const withoutPreview = product({
      brochure: {
        ...HAOO_PRODUCT.brochure,
        previewImageHref: '',
      },
    });

    render(<ProductsSection products={[withoutPreview]} />);

    expect(screen.getByRole('heading', { name: 'HAOO' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explore HAOO' })).toBeTruthy();
  });
});

describe('Phase 1 featured product card contract', () => {
  it('renders the locked featured card order, supplied preview, and one native action', () => {
    render(<ProductsSection products={[HAOO_PRODUCT]} />);

    const card = screen.getByRole('article');

    const order = Array.from(card.querySelectorAll('h3, p, a'))
      .map((element) => element.textContent?.trim());
    expect(order).toEqual([
      'Featured product',
      HAOO_PRODUCT.name,
      HAOO_PRODUCT.relationship,
      HAOO_PRODUCT.outcome,
      HAOO_PRODUCT.audienceLead,
      `Explore ${HAOO_PRODUCT.name}`,
    ]);

    expect(within(card).getAllByRole('link')).toHaveLength(1);
    expect(card.querySelectorAll('button')).toHaveLength(0);
    expect(card.getAttribute('onclick')).toBeNull();

    expect(HAOO_PRODUCT.brochure.previewImageHref).toBe('/products/haoo/brochure-preview.png');
    const preview = within(card).getByRole('img', {
      name: 'HAOO property-management brochure preview',
    });
    expect(preview.getAttribute('src')).toBe(HAOO_PRODUCT.brochure.previewImageHref);
    expect(preview.getAttribute('width')).toBe('1287');
    expect(preview.getAttribute('height')).toBe('909');
  });
});

describe('Phase 1 Products discovery navigation contracts', () => {
  function openMobileMenu() {
    const toggle = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const mobileNavigation = document.getElementById(toggle.getAttribute('aria-controls')!);
    expect(mobileNavigation).not.toBeNull();
    return { toggle, mobileNavigation: mobileNavigation! };
  }

  function linkLabels(scope: HTMLElement) {
    return within(scope)
      .getAllByRole('link')
      .map((link) => link.textContent?.replace(/\s+/g, ' ').trim() ?? '');
  }

  it('exposes Products between Services and Values in desktop and mobile navigation', () => {
    render(<HomePage products={[HAOO_PRODUCT]} />);

    const desktopNavigation = screen.getByRole('navigation', { name: 'Primary' });
    const { mobileNavigation } = openMobileMenu();

    for (const navigation of [desktopNavigation, mobileNavigation]) {
      const link = within(navigation).getByRole('link', { name: PRODUCTS_NAV_LABEL });
      expect(link.getAttribute('href')).toBe('#products');
      expect(link.className).toContain('min-h-11');
      expect(link.className).not.toMatch(/truncate|line-clamp|whitespace-nowrap/);

      const labels = linkLabels(navigation);
      expect(labels.indexOf(PRODUCTS_NAV_LABEL)).toBe(labels.indexOf('Services') + 1);
      expect(labels.indexOf('Values')).toBe(labels.indexOf(PRODUCTS_NAV_LABEL) + 1);
    }
  });

  it('places the Products landmark after Services and before Values', () => {
    render(<HomePage products={[HAOO_PRODUCT]} />);

    const sectionIds = Array.from(document.querySelectorAll('section[id]'))
      .map((section) => section.id);
    expect(sectionIds.indexOf('products')).toBe(sectionIds.indexOf('services') + 1);
    expect(sectionIds.indexOf('values')).toBe(sectionIds.indexOf('products') + 1);
    expect(screen.getByRole('region', { name: PRODUCTS_NAV_LABEL })).toBeTruthy();
  });

  it('omits the Products navigation item and section together for an empty collection', () => {
    render(<HomePage products={[]} />);

    openMobileMenu();

    expect(screen.queryByRole('link', { name: PRODUCTS_NAV_LABEL })).toBeNull();
    expect(screen.queryByRole('region', { name: PRODUCTS_NAV_LABEL })).toBeNull();
    expect(document.querySelector('#products')).toBeNull();
    expect(screen.getAllByRole('link', { name: 'Services' }).length).toBeGreaterThan(0);
  });

  it('closes the mobile menu after a visitor selects Products', () => {
    render(<HomePage products={[HAOO_PRODUCT]} />);

    const { toggle, mobileNavigation } = openMobileMenu();

    fireEvent.click(within(mobileNavigation).getByRole('link', { name: PRODUCTS_NAV_LABEL }));

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  });
});
