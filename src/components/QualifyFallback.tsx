import { Mail, MessageCircle, Phone } from 'lucide-react';
import type { Ref } from 'react';
import {
  emailFallbackActionLabel,
  phoneFallbackActionLabel,
  qualifyFallbackBody,
  whatsappFallbackActionLabel,
} from '../products/copy';
import type { ProductContacts } from '../products/types';

interface QualifyFallbackProps {
  readonly contacts: ProductContacts;
  readonly headingRef?: Ref<HTMLHeadingElement>;
  readonly onRetry?: () => void;
  readonly productName: string;
}

const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2';

export default function QualifyFallback({
  contacts,
  headingRef,
  onRetry,
  productName,
}: QualifyFallbackProps) {
  return (
    <div className="mt-6 max-w-[560px] rounded-2xl border-2 border-[#B00020] bg-[#FFF5F5] p-6 text-[#18275F] md:p-8">
      <h3
        ref={headingRef}
        tabIndex={-1}
        className={`text-[28px] font-semibold leading-[1.2] ${focusClasses}`}
      >
        We couldn't send your details
      </h3>
      <p className="mt-2 text-base font-normal leading-6">
        {qualifyFallbackBody(productName)}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={`mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#4054C6] px-5 py-3 text-sm font-semibold leading-[1.4] text-white hover:bg-[#3345A7] active:bg-[#29388A] md:w-auto ${focusClasses}`}
        >
          Try sending again
        </button>
      ) : null}
      <div className="mt-4 grid gap-1">
        <a
          href={contacts.whatsappHref}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold leading-[1.4] text-[#4054C6] hover:underline ${focusClasses}`}
        >
          <MessageCircle aria-hidden="true" size={18} />
          {whatsappFallbackActionLabel(productName)}
        </a>
        <a
          href={contacts.phoneHref}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold leading-[1.4] text-[#4054C6] hover:underline ${focusClasses}`}
        >
          <Phone aria-hidden="true" size={18} />
          {phoneFallbackActionLabel(productName, contacts.phoneDisplay)}
        </a>
        <a
          href={contacts.emailHref}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold leading-[1.4] text-[#4054C6] hover:underline ${focusClasses}`}
        >
          <Mail aria-hidden="true" size={18} />
          {emailFallbackActionLabel(productName, contacts.email)}
        </a>
      </div>
    </div>
  );
}
