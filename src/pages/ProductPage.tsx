import {
  BarChart3,
  Building2,
  ClipboardCheck,
  type LucideIcon,
  Store,
  Wallet,
  Wrench,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import BrochurePanel from '../components/BrochurePanel';
import OnboardingChoices from '../components/OnboardingChoices';
import ProductHeader from '../components/ProductHeader';
import QualifyForm from '../components/QualifyForm';
import {
  PRODUCT_SECTION_LINKS,
  brochureLead,
  contentAnchorId,
  copyrightLine,
  measurementDisclosureId,
  parentRelationshipLine,
  productHomeLinkLabel,
  skipToContentLabel,
} from '../products/copy';
import { formatEngagementSummary } from '../products/engagement-summary';
import type { ProductCapabilityIcon, ProductDefinition } from '../products/types';
import {
  createMeasurement,
  type MeasurementAdapters,
} from '../measurement';

interface ProductPageProps {
  readonly product: ProductDefinition;
  readonly measurementAdapters?: MeasurementAdapters<string>;
}

const containerClasses = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';
const sectionHeadingClasses = 'text-[28px] font-extrabold leading-[1.2]';
const headingClasses = 'text-[28px] font-bold leading-[1.2]';
const bodyClasses = 'text-base font-normal leading-6 text-[#5F6B84]';
/** Capability card and journey step titles: one size below the 28px headings (260913-x19). */
const stepTitleClasses = 'text-lg font-bold leading-[1.3] md:text-xl';
const CAPABILITY_ICONS: Record<ProductCapabilityIcon, LucideIcon> = {
  payments: Wallet,
  properties: Building2,
  leases: ClipboardCheck,
  maintenance: Wrench,
  marketplace: Store,
  reports: BarChart3,
};

/** Locked UI-SPEC sub-lead framing the form as an alternative to chatting, never a gate. */
const QUALIFY_SUB_LEAD =
  "Prefer writing to chatting? Share a few details and we'll reply with the onboarding path that fits your portfolio. This is not a sign-up \u2014 you can still start on your own at any time.";
/*
 * Footer surface is navy #0F1A45. Each ring colour sits with its own offset colour in ONE plain
 * literal, so the focus-contrast gate measures white on #0F1A45 (about 16:1).
 */
const footerLinkClasses = 'inline-flex min-h-11 items-center rounded-lg px-2 text-[#DBE2FF] hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1A45]';
const footerLogoLinkClasses = 'inline-flex min-h-11 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1A45]';

export default function ProductPage({ product, measurementAdapters }: ProductPageProps) {
  const mainContentId = contentAnchorId(product.slug);
  const measurement = useMemo(
    () => createMeasurement(product.measurement, measurementAdapters),
    [product.measurement, measurementAdapters],
  );
  const pageViewMeasurement = useRef<ReturnType<typeof createMeasurement>>();

  /**
   * The disclosed engagement summary, assembled from this page's own bounded record and
   * the page-lifetime campaign snapshot. No analytics provider is queried here, so no
   * provider record can ever be joined to a named enquiry. The copy is read from
   * product data, so this shell stays product-agnostic.
   */
  const buildEngagementSummary = useCallback(
    () => formatEngagementSummary(
      measurement.readContext(),
      measurement.readCampaign(),
      product.qualify.engagementSummary,
    ),
    [measurement, product.qualify.engagementSummary],
  );

  useEffect(() => {
    if (pageViewMeasurement.current === measurement) return;

    pageViewMeasurement.current = measurement;
    measurement.initialize();
    measurement.track(product.measurement.pageViewEvent);
  }, [measurement, product.measurement.pageViewEvent]);

  function handleMeasurementDisclosureLink() {
    const disclosure = document.getElementById(measurementDisclosureId(product.slug));

    if (disclosure instanceof HTMLDetailsElement) {
      disclosure.open = true;
    }
  }

  // overflow-x-clip, not hidden: hidden makes this wrapper a scroll container and disables the
  // sticky #qualify lead column (260913-x19).
  return (
    <div className="min-h-screen overflow-x-clip bg-[#FBFCFF] text-[#18275F]">
      <a href={`#${mainContentId}`} className="sr-only z-[60] rounded-lg bg-white px-4 py-3 text-sm font-semibold leading-[1.4] text-[#18275F] focus:fixed focus:left-4 focus:top-4 focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-[#4054C6] focus:ring-offset-2">
        {skipToContentLabel(product.name)}
      </a>

      <ProductHeader product={product} />

      <main id={mainContentId}>
        {/* Top padding clears the fixed transparent header (72/80/96/104 px at base/sm/md/lg). */}
        <section className="bg-[#18275F] pb-12 pt-28 text-white sm:pt-32 md:pb-16 md:pt-36 lg:pt-40">
          <div className={`${containerClasses} grid gap-8 lg:grid-cols-3 lg:items-start`}>
            <div className="lg:col-span-2">
              <div className="max-w-[620px]">
                <p className="mb-4 text-sm font-semibold leading-[1.4] text-[#DBE2FF]">{product.relationship}</p>
                <h1 className="mb-6 text-[40px] font-black leading-[1.1] tracking-tight">{product.outcome}</h1>
                <p className="mb-8 text-base font-normal leading-6 text-[#DBE2FF]">{product.audienceLead}</p>
              </div>
              <OnboardingChoices
                product={product}
                position="opening"
                track={measurement.track}
              />
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

        <section aria-labelledby="audiences-heading" className="border-b border-[#DFE4F0] bg-white py-10">
          <div className={containerClasses}>
            <h2 id="audiences-heading" className={sectionHeadingClasses}>Who {product.name} supports</h2>
            <ul className="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {product.audiences.map((audience) => (
                <li
                  key={audience}
                  className="rounded-xl border border-[#DFE4F0] bg-[#FBFCFF] px-5 py-4 text-base font-semibold leading-6 text-[#18275F]"
                >
                  {audience}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="benefits" aria-label="Benefits" className="scroll-mt-4 py-12 md:py-16">
          <div className={containerClasses}>
            <h2 className={sectionHeadingClasses}>Benefits</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
              <div className="max-w-[680px]">
                <h3 className={`mb-4 ${headingClasses}`}>{product.painHeading}</h3>
                {product.pains.map((pain) => (
                  <p key={pain} className={`mb-4 last:mb-0 ${bodyClasses}`}>{pain}</p>
                ))}
              </div>
              <div className="max-w-[680px]">
                <h3 className={`mb-4 ${headingClasses}`}>{product.benefitHeading}</h3>
                {product.benefits.map((benefit) => (
                  <p key={benefit} className={`mb-4 last:mb-0 ${bodyClasses}`}>{benefit}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" aria-label="Capabilities" className="scroll-mt-4 bg-white py-12 md:py-16">
          <div className={containerClasses}>
            <h2 className={sectionHeadingClasses}>Capabilities</h2>
            <ul className="mt-6 grid list-none gap-4 p-0 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
              {product.capabilities.map(({ title, description, icon }) => {
                const Icon = CAPABILITY_ICONS[icon];

                return (
                  <li
                    key={title}
                    className="rounded-2xl border border-[#DFE4F0] bg-[#FBFCFF] p-6 transition-transform duration-200 motion-safe:hover:-translate-y-1 motion-reduce:transition-none md:p-8"
                  >
                    <span className="mb-4 inline-flex size-11 items-center justify-center rounded-lg bg-[#4054C6] text-white">
                      <Icon aria-hidden="true" size={20} />
                    </span>
                    <h3 className={`mb-2 ${stepTitleClasses}`}>{title}</h3>
                    <p className={bodyClasses}>{description}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className={containerClasses}>
            <h2 className={sectionHeadingClasses}>{product.journeyHeading}</h2>
            <section aria-label={product.journeyHeading} className="mt-6">
              {/* A vertical list below md, 2x2 at md and a four-column stepper at lg (260913-x19). */}
              <ol className="grid list-none gap-6 p-0 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                {product.journey.map(({ title, description }, index) => (
                  <li key={title} className="relative grid grid-cols-[44px_1fr] content-start gap-4 md:grid-cols-1 md:gap-3">
                    {index < product.journey.length - 1 ? (
                      // Decorative connector: 12px past this circle to 12px before the next one.
                      <span
                        aria-hidden="true"
                        className="absolute -right-5 left-14 top-[21px] hidden h-0.5 bg-[#DFE4F0] lg:block"
                      />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className="flex size-11 items-center justify-center rounded-full bg-[#4054C6] text-sm font-semibold leading-[1.4] text-white"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 className={`mb-2 ${stepTitleClasses}`}>{title}</h3>
                      <p className={bodyClasses}>{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <p className={`mt-8 ${bodyClasses}`}>{product.marketClaim}</p>
          </div>
        </section>

        <div className={`${containerClasses} pb-12 md:pb-16`}>
          <OnboardingChoices
            product={product}
            position="mid-page"
            track={measurement.track}
          />
        </div>

        <section id="brochure" aria-label="Brochure" className="scroll-mt-4 bg-white py-12 md:py-16">
          <div className={containerClasses}>
            <h2 className={sectionHeadingClasses}>Brochure</h2>
            <p className={`mt-4 max-w-[680px] ${bodyClasses}`}>{brochureLead(product.name)}</p>
            <BrochurePanel
              key={product.slug}
              brochure={product.brochure}
              productName={product.name}
              track={measurement.track}
              events={{
                preview: product.measurement.interactionEvents.brochurePreview,
                open: product.measurement.interactionEvents.brochureOpen,
                download: product.measurement.interactionEvents.brochureDownload,
              }}
            />
          </div>
        </section>

        <section id="qualify" aria-label="Send your details" className="scroll-mt-4 py-12 md:py-16">
          {/* Two columns from xl (PD-3: at lg a paired label wrapped and split its row): the lead column stays in view beside the form (260913-x19). */}
          <div className={`${containerClasses} xl:grid xl:grid-cols-12 xl:gap-x-12`}>
            {/* top-32 (128px) clears the 88-104px fixed header. */}
            <div className="xl:sticky xl:top-32 xl:col-span-5 xl:self-start">
              <h2 className={sectionHeadingClasses}>Send your details</h2>
              <p className={`mt-4 max-w-[680px] ${bodyClasses}`}>{product.assistedInvitation}</p>
              <p className={`mt-4 max-w-[680px] ${bodyClasses}`}>{QUALIFY_SUB_LEAD}</p>
            </div>
            <div className="xl:col-span-7">
              <QualifyForm
                key={product.slug}
                qualify={product.qualify}
                contacts={product.contacts}
                productName={product.name}
                slug={product.slug}
                track={measurement.track}
                measurementEvents={{
                  start: product.measurement.interactionEvents.qualifyStart,
                  submit: product.measurement.interactionEvents.qualifySubmit,
                }}
                measurementEventNames={product.measurement.events}
                measurementDisclosure={product.measurement.disclosure}
                clearMeasurementContext={measurement.clearContext}
                buildEngagementSummary={buildEngagementSummary}
              />
            </div>
          </div>
        </section>

        <section id="onboarding" aria-label="Onboarding" className="scroll-mt-4 bg-[#18275F] py-12 text-white md:py-16">
          <div className={containerClasses}>
            <OnboardingChoices
              product={product}
              position="closing"
              track={measurement.track}
            />
          </div>
        </section>
      </main>

      <footer className="bg-[#0F1A45] py-10 text-sm font-normal leading-[1.4] text-[#DBE2FF]">
        <div className={containerClasses}>
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            {product.media.logo ? (
              <a
                href="#top"
                aria-label={productHomeLinkLabel(product.name)}
                className={footerLogoLinkClasses}
              >
                <img
                  src={product.media.logo.href}
                  alt={product.media.logo.alt}
                  width={product.media.logo.width}
                  height={product.media.logo.height}
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-auto rounded-lg bg-white/95 object-contain p-1.5"
                />
              </a>
            ) : null}
            {/* A div, not a nav: semantics e2e allows one navigation landmark per state. */}
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
              {PRODUCT_SECTION_LINKS.map((link) => (
                <a key={link.href} href={link.href} className={footerLinkClasses}>
                  {link.label}
                </a>
              ))}
              <a
                className={footerLinkClasses}
                href={`#${measurementDisclosureId(product.slug)}`}
                onClick={handleMeasurementDisclosureLink}
              >
                How we measure this page
              </a>
            </div>
            <p className="text-center md:text-right">{copyrightLine(product.name, new Date().getFullYear())}</p>
          </div>
          <div className="mt-8 border-t border-white/15 pt-6">
            <p className="flex flex-wrap items-center justify-center gap-x-1 text-center">
              <a className={footerLinkClasses} href={product.contacts.phoneHref}>{product.contacts.phoneDisplay}</a>
              <span aria-hidden="true">{'\u00B7'}</span>
              <a className={footerLinkClasses} href={product.contacts.emailHref}>{product.contacts.email}</a>
              {/* Below sm the relationship sentence takes its own row, so no separator dangles at a wrap. */}
              <span aria-hidden="true" className="hidden sm:inline">{'\u00B7'}</span>
              <span className="basis-full px-2 sm:basis-auto">{parentRelationshipLine(product.name)}</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
