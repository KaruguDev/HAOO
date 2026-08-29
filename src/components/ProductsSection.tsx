import type { ProductDefinition } from '../products/types';

interface ProductsSectionProps {
  readonly products: readonly ProductDefinition[];
}

export default function ProductsSection({ products }: ProductsSectionProps) {
  return (
    <section aria-label="Products" data-product-count={products.length}>
      <h2>Products contract pending</h2>
    </section>
  );
}
