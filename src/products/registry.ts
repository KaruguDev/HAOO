import { HAOO_PRODUCT } from './haoo';
import type { ProductDefinition } from './types';

/** Anchor target shared by the home navigation entry and the Products landmark. */
export const PRODUCTS_SECTION_ID = 'products';

/** Visible and accessible label for the Products navigation entry and landmark. */
export const PRODUCTS_NAV_LABEL = 'Products';

/**
 * The published product collection. Every product fact is owned by its own
 * definition module; this registry only decides which products are live.
 */
export const PRODUCTS: readonly ProductDefinition[] = [HAOO_PRODUCT];

/** Physical route for a product document, derived from its stable slug. */
export function productRoute(product: ProductDefinition): string {
  return `/products/${product.slug}/`;
}

/**
 * Navigation entry derived from collection presence so the Products nav item and
 * the Products section can never disagree about whether products exist.
 */
export function productsNavLink(
  products: readonly ProductDefinition[],
): { readonly label: string; readonly href: string } | null {
  if (products.length === 0) {
    return null;
  }

  return { label: PRODUCTS_NAV_LABEL, href: `#${PRODUCTS_SECTION_ID}` };
}
