import {
  BarChart3,
  Building2,
  ClipboardCheck,
  type LucideIcon,
  Store,
  Wallet,
  Wrench,
} from 'lucide-react';
import OnboardingChoices from '../components/OnboardingChoices';
import ProductHeader from '../components/ProductHeader';
import type { ProductDefinition } from '../products/types';

interface ProductPageProps {
  readonly product: ProductDefinition;
}

const containerClasses = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';
const headingClasses = 'text-[28px] font-semibold leading-[1.2]';
const bodyClasses = 'text-base font-normal leading-6 text-[#5F6B84]';
const CAPABILITY_ICONS: Record<string, LucideIcon> = {
  'Rent & payments': Wallet,
  'Properties & units': Building2,
  'Leases & screening': ClipboardCheck,
  Maintenance: Wrench,
  'Vacancy marketplace': Store,
  'Reports & communication': BarChart3,
};
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
          <div className={`${containerClasses} grid gap-8 lg:grid-cols-3 lg:items-start`}>
            <div className="lg:col-span-2">
              <div className="max-w-[620px]">
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  {product.media.logo ? (
                    <span className="inline-flex items-center rounded-lg bg-white px-4 py-2">
                      <img
                        src={product.media.logo.href}
                        alt={product.media.logo.alt}
                        width={product.media.logo.width}
                        height={product.media.logo.height}
                        loading="eager"
                        decoding="async"
                        className="h-8 w-auto"
                      />
                    </span>
                  ) : null}
                  <p className="text-sm font-semibold leading-[1.4] text-[#DBE2FF]">{product.relationship}</p>
                </div>
                <p className="mb-2 text-sm font-semibold leading-[1.4]">{product.name}</p>
                <h1 className="mb-6 text-[40px] font-semibold leading-[1.1]">{product.outcome}</h1>
                <p className="mb-8 text-base font-normal leading-6 text-[#DBE2FF]">{product.audienceLead}</p>
              </div>
              <OnboardingChoices product={product} position="opening" />
            </div>

            {product.media.hero ? (
              <div className="lg:col-span-1">
                <img
                  src={product.media.hero.href}
                  alt={product.media.hero.alt}
                  width={product.media.hero.width}
                  height={product.media.hero.height}
                  loading="eager"
                  decoding="async"
                  className="aspect-[4/3] w-full rounded-2xl object-cover object-bottom lg:aspect-[4/5]"
                />
              </div>
            ) : null}
          </div>
        </section>

        <section id="benefits" aria-label="Benefits" className="scroll-mt-4 py-12 md:py-16">
          <div className={containerClasses}>
            <h2 className={headingClasses}>Benefits</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
              <div className="max-w-[680px]">
                <h3 className={`mb-4 ${headingClasses}`}>The paperwork problem</h3>
                {product.pains.map((pain) => (
                  <p key={pain} className={`mb-4 last:mb-0 ${bodyClasses}`}>{pain}</p>
                ))}
              </div>
              <div className="max-w-[680px]">
                <h3 className={`mb-4 ${headingClasses}`}>Less chasing. More control.</h3>
                {product.benefits.map((benefit) => (
                  <p key={benefit} className={`mb-4 last:mb-0 ${bodyClasses}`}>{benefit}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" aria-label="Capabilities" className="scroll-mt-4 bg-white py-12 md:py-16">
          <div className={containerClasses}>
            <h2 className={headingClasses}>Capabilities</h2>
            <ul className="mt-6 grid list-none gap-4 p-0 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
              {product.capabilities.map(({ title, description }) => {
                const Icon = CAPABILITY_ICONS[title] ?? Building2;

                return (
                  <li
                    key={title}
                    className="rounded-2xl border border-[#DFE4F0] bg-[#FBFCFF] p-6 transition-transform duration-200 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none md:p-8"
                  >
                    <span className="mb-4 inline-flex size-11 items-center justify-center rounded-lg bg-[#4054C6] text-white">
                      <Icon aria-hidden="true" size={20} />
                    </span>
                    <h3 className={`mb-2 ${headingClasses}`}>{title}</h3>
                    <p className={bodyClasses}>{description}</p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-6 max-w-[680px] text-sm font-normal leading-[1.4] text-[#5F6B84]">
              {product.featureCaveat}
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className={containerClasses}>
            <h2 className={headingClasses}>Rental journey</h2>
            <section aria-label="Rental journey" className="mt-6">
              <ol className="grid max-w-[680px] list-none gap-6 p-0">
                {product.journey.map(({ title, description }, index) => (
                  <li key={title} className="grid grid-cols-[44px_1fr] gap-4">
                    <span
                      aria-hidden="true"
                      className="flex size-11 items-center justify-center rounded-full bg-[#4054C6] text-sm font-semibold leading-[1.4] text-white"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 className={`mb-2 ${headingClasses}`}>{title}</h3>
                      <p className={bodyClasses}>{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <p className={`mt-8 max-w-[680px] ${bodyClasses}`}>{product.marketClaim}</p>
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
