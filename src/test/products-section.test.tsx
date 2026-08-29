import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProductsSection from '../components/ProductsSection';
import { HAOO_PRODUCT } from '../products/haoo';
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
