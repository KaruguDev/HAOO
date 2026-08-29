import type { ProductDefinition } from '../products/types';

interface ProductPageProps {
  readonly product: ProductDefinition;
}

export default function ProductPage({ product }: ProductPageProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBFCFF] text-[#18275F]">
      <a
        href="#haoo-content"
        className="sr-only z-50 rounded bg-white px-4 py-3 font-semibold text-[#18275F] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-[#4054C6]"
      >
        Skip to HAOO content
      </a>

      <header className="border-b border-[#DFE4F0] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a
            href="/"
            className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-green-800 focus:outline-none focus:ring-2 focus:ring-[#4054C6] focus:ring-offset-2"
          >
            Back to ZERO-PAPER HUB
          </a>
          <span className="text-sm font-semibold">{product.name}</span>
        </div>
      </header>

      <main id="haoo-content">
        <section className="bg-[#18275F] py-12 text-white md:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="max-w-[620px]">
              <p className="mb-4 text-sm font-semibold text-[#DBE2FF]">{product.relationship}</p>
              <p className="mb-2 text-sm font-semibold tracking-wide">{product.name}</p>
              <h1 className="mb-6 text-[40px] font-semibold leading-[1.1]">{product.outcome}</h1>
              <p className="mb-8 text-base leading-6 text-[#DBE2FF]">{product.audienceLead}</p>

              <section aria-label="Opening onboarding choices" className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 text-[#18275F]">
                  <h2 className="mb-3 text-[28px] font-semibold leading-[1.2]">Get help choosing</h2>
                  <p className="mb-5 text-base leading-6 text-[#5F6B84]">{product.assistedInvitation}</p>
                  <a
                    href={product.contacts.whatsappHref}
                    className="mb-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#4054C6] px-4 py-3 text-center text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#4054C6] focus:ring-offset-2"
                  >
                    Chat with HAOO on WhatsApp
                  </a>
                  <a
                    href={product.contacts.phoneHref}
                    className="flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-[#4054C6] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#4054C6]"
                  >
                    Call {product.contacts.phoneDisplay}
                  </a>
                  <a
                    href={product.contacts.emailHref}
                    className="flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-[#4054C6] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#4054C6]"
                  >
                    Email {product.contacts.email}
                  </a>
                  <p className="mt-3 text-sm text-[#5F6B84]">These contact links leave the ZERO-PAPER HUB product page.</p>
                </div>

                <div className="rounded-2xl border border-[#DBE2FF] bg-[#18275F] p-6">
                  <h2 className="mb-3 text-[28px] font-semibold leading-[1.2]">Ready to begin?</h2>
                  <p className="mb-5 text-base leading-6 text-[#DBE2FF]">Continue to HAOO's platform for self-onboarding.</p>
                  <a
                    href={product.contacts.selfOnboardingHref}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white px-4 py-3 text-center text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#18275F]"
                  >
                    Start with HAOO
                  </a>
                  <p className="mt-3 text-sm text-[#DBE2FF]">Opens {product.contacts.selfOnboardingDisplay} outside ZERO-PAPER HUB.</p>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
