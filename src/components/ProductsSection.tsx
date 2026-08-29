import { ArrowRight } from 'lucide-react';
import { PRODUCTS_NAV_LABEL, PRODUCTS_SECTION_ID, productRoute } from '../products/registry';
import type { ProductDefinition } from '../products/types';

const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2';

interface ProductCardProps {
  readonly product: ProductDefinition;
  readonly featured: boolean;
}

function ProductCard({ product, featured }: ProductCardProps) {
  const {
    previewImageHref,
    previewImageAlt,
    previewImageWidth,
    previewImageHeight,
  } = product.brochure;

  return (
    <article
      className={`rounded-2xl border border-blue-100 bg-blue-50 p-6 md:p-8 ${
        featured ? 'lg:grid lg:grid-cols-12 lg:items-center lg:gap-8' : ''
      }`}
    >
      <div className={featured ? 'lg:col-span-5' : ''}>
        {featured ? (
          <p className="text-sm font-semibold uppercase leading-[1.4] tracking-wide text-blue-700">
            Featured product
          </p>
        ) : null}
        <h3 className="mt-2 text-[28px] font-semibold leading-[1.2] text-green-900">
          {product.name}
        </h3>
        <p className="mt-2 text-sm font-semibold leading-[1.4] text-blue-700">
          {product.relationship}
        </p>
        <p className="mt-4 max-w-[680px] text-base font-normal leading-[1.5] text-blue-950">
          {product.outcome}
        </p>
        <p className="mt-2 max-w-[680px] text-base font-normal leading-[1.5] text-gray-600">
          {product.audienceLead}
        </p>
        <a
          href={productRoute(product)}
          className={`mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold leading-[1.4] text-white transition-colors duration-200 hover:bg-blue-600 ${focusClasses}`}
        >
          Explore {product.name}
          <ArrowRight aria-hidden="true" size={17} />
        </a>
      </div>

      {previewImageHref ? (
        <div className={featured ? 'mt-6 lg:col-span-7 lg:mt-0' : 'mt-6'}>
          <img
            src={previewImageHref}
            alt={previewImageAlt}
            width={previewImageWidth}
            height={previewImageHeight}
            loading="lazy"
            decoding="async"
            className="h-auto w-full rounded-xl border border-blue-100 bg-white object-cover"
          />
        </div>
      ) : null}
    </article>
  );
}

interface ProductsSectionProps {
  readonly products: readonly ProductDefinition[];
}

export default function ProductsSection({ products }: ProductsSectionProps) {
  if (products.length === 0) {
    return null;
  }

  const featured = products.length === 1;
  const headingId = `${PRODUCTS_SECTION_ID}-heading`;

  return (
    <section
      id={PRODUCTS_SECTION_ID}
      aria-labelledby={headingId}
      className="bg-white py-12 md:py-16 scroll-mt-24 md:scroll-mt-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id={headingId}
          className="mb-8 text-[28px] font-semibold leading-[1.2] text-green-900"
        >
          {PRODUCTS_NAV_LABEL}
        </h2>

        <div className={`grid gap-4 sm:gap-6 lg:gap-8 ${featured ? '' : 'lg:grid-cols-2'}`}>
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} featured={featured} />
          ))}
        </div>
      </div>
    </section>
  );
}
