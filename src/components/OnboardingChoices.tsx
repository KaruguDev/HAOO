import { ArrowUpRight, Mail, MessageCircle, Phone } from 'lucide-react';
import {
  selfOnboardingActionLabel,
  selfOnboardingLead,
  whatsappActionLabel,
} from '../products/copy';
import type { ProductDefinition } from '../products/types';

export type OnboardingPosition = 'opening' | 'mid-page' | 'closing';

interface OnboardingChoicesProps {
  readonly product: ProductDefinition;
  readonly position: OnboardingPosition;
}

const focusLight = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2';
const focusDark = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#18275F]';

const POSITION_LABELS: Record<OnboardingPosition, string> = {
  opening: 'Opening onboarding choices',
  'mid-page': 'Mid-page onboarding choices',
  closing: 'Closing onboarding choices',
};

export default function OnboardingChoices({ product, position }: OnboardingChoicesProps) {
  const onDark = position === 'opening' || position === 'closing';

  return (
    <section aria-label={POSITION_LABELS[position]} className="grid gap-4 md:gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="rounded-2xl bg-white p-6 text-[#18275F] shadow-sm md:p-8">
        <h2 className="mb-4 text-[28px] font-semibold leading-[1.2]">Get help choosing</h2>
        <p className="mb-6 text-base font-normal leading-6 text-[#5F6B84]">{product.assistedInvitation}</p>
        <a href={product.contacts.whatsappHref} className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#4054C6] px-4 py-3 text-center text-sm font-semibold leading-[1.4] text-white hover:bg-[#3345A7] active:bg-[#29388A] ${focusLight}`}>
          <MessageCircle aria-hidden="true" size={18} />
          {whatsappActionLabel(product.name)}
        </a>
        <div className="mt-4 grid gap-1">
          <a href={product.contacts.phoneHref} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold leading-[1.4] text-[#4054C6] hover:underline ${focusLight}`}>
            <Phone aria-hidden="true" size={18} />
            Call {product.contacts.phoneDisplay}
          </a>
          <a href={product.contacts.emailHref} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold leading-[1.4] text-[#4054C6] hover:underline ${focusLight}`}>
            <Mail aria-hidden="true" size={18} />
            Email {product.contacts.email}
          </a>
        </div>
        <p className="mt-4 text-sm font-normal leading-[1.4] text-[#5F6B84]">These contact links leave the ZERO-PAPER HUB product page.</p>
      </div>

      <div className={`rounded-2xl border p-6 md:p-8 ${onDark ? 'border-[#DBE2FF] bg-[#18275F] text-white' : 'border-[#DFE4F0] bg-[#E9EDFF] text-[#18275F]'}`}>
        <h2 className="mb-4 text-[28px] font-semibold leading-[1.2]">Ready to begin?</h2>
        <p className={`mb-6 text-base font-normal leading-6 ${onDark ? 'text-[#DBE2FF]' : 'text-[#5F6B84]'}`}>{selfOnboardingLead(product.name)}</p>
        <a href={product.contacts.selfOnboardingHref} className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-center text-sm font-semibold leading-[1.4] ${onDark ? `border-white text-white hover:bg-white/10 ${focusDark}` : `border-[#4054C6] text-[#4054C6] hover:bg-white ${focusLight}`}`}>
          {selfOnboardingActionLabel(product.name)}
          <ArrowUpRight aria-hidden="true" size={18} />
        </a>
        <p className={`mt-4 text-sm font-normal leading-[1.4] ${onDark ? 'text-[#DBE2FF]' : 'text-[#5F6B84]'}`}>Opens {product.contacts.selfOnboardingDisplay} outside ZERO-PAPER HUB.</p>
      </div>
    </section>
  );
}
