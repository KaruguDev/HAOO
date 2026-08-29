import type { ProductDefinition } from '../products/types';

interface ProductPageProps {
  readonly product: ProductDefinition;
}

export default function ProductPage({ product }: ProductPageProps) {
  return (
    <main>
      <h1>{product.name} contract pending</h1>
      <section aria-label="HAOO contract placeholder">
        <h2>Product journey pending</h2>
      </section>
    </main>
  );
}
