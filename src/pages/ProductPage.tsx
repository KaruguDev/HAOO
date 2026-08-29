import OnboardingChoices from '../components/OnboardingChoices';
import ProductHeader from '../components/ProductHeader';
import type { ProductDefinition } from '../products/types';

interface ProductPageProps {
  readonly product: ProductDefinition;
}

const containerClasses = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';
const footerLinkClasses = 'inline-flex min-h-11 items-center rounded-lg px-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2';

export default function ProductPage({ product }: ProductPageProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBFCFF] text-[#18275F]">
      <a href="#haoo-content" className="sr-only z-50 rounded-lg bg-white px-4 py-3 text-sm font-semibold leading-[1.4] text-[#18275F] focus:fixed focus:left-4 focus:top-4 focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-[#4054C6] focus:ring-offset-2">
        Skip to HAOO content
      </a>

      <ProductHeader productName={product.name} />

      <main id="haoo-content">
        <section className="bg-[#18275F] py-12 text-white md:py-16">
          <div className={`${containerClasses} grid gap-8 lg:grid-cols-2`}>
            <div className="max-w-[620px] lg:col-span-2">
              <p className="mb-4 text-sm font-semibold leading-[1.4] text-[#DBE2FF]">{product.relationship}</p>
              <p className="mb-2 text-sm font-semibold leading-[1.4]">{product.name}</p>
              <h1 className="mb-6 text-[40px] font-semibold leading-[1.1]">{product.outcome}</h1>
              <p className="mb-8 text-base font-normal leading-6 text-[#DBE2FF]">{product.audienceLead}</p>
              <OnboardingChoices product={product} position="opening" />
            </div>
          </div>
        </section>

        <section id="benefits" aria-label="Benefits" className="scroll-mt-4 py-12 md:py-16">
          <div className={containerClasses}>
            <h2 className="text-[28px] font-semibold leading-[1.2]">Benefits</h2>
          </div>
        </section>

        <section id="capabilities" aria-label="Capabilities" className="scroll-mt-4 bg-white py-12 md:py-16">
          <div className={containerClasses}>
            <h2 className="text-[28px] font-semibold leading-[1.2]">Capabilities</h2>
          </div>
        </section>

        <section aria-label="Rental journey" className="py-12 md:py-16">
          <div className={containerClasses}>
            <h2 className="text-[28px] font-semibold leading-[1.2]">Rental journey</h2>
          </div>
        </section>

        <div className={`${containerClasses} pb-12 md:pb-16`}>
          <OnboardingChoices product={product} position="mid-page" />
        </div>

        <section id="brochure" aria-label="Brochure" className="scroll-mt-4 bg-white py-12 md:py-16">
          <div className={containerClasses}>
            <h2 className="text-[28px] font-semibold leading-[1.2]">Brochure</h2>
          </div>
        </section>

        <section id="onboarding" aria-label="Onboarding" className="scroll-mt-4 bg-[#18275F] py-12 text-white md:py-16">
          <div className={containerClasses}>
            <OnboardingChoices product={product} position="closing" />
          </div>
        </section>
      </main>

      <footer className="border-t border-[#DFE4F0] bg-white py-6">
        <div className={`${containerClasses} flex flex-col gap-4 text-sm font-semibold leading-[1.4] sm:flex-row sm:items-center sm:justify-between`}>
          <p>HAOO is a ZERO-PAPER HUB product</p>
          <div className="flex flex-wrap gap-2">
            <a className={`${footerLinkClasses} text-[#4054C6]`} href={product.contacts.phoneHref}>{product.contacts.phoneDisplay}</a>
            <a className={`${footerLinkClasses} text-[#4054C6]`} href={product.contacts.emailHref}>{product.contacts.email}</a>
            <a className={`${footerLinkClasses} text-green-800`} href="/">Back to ZERO-PAPER HUB</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
