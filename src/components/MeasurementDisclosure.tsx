import { useState } from 'react';
import type { ProductMeasurementDisclosure } from '../products/types';
import { requireIdentity } from '../products/copy';

interface MeasurementDisclosureProps<EventName extends string> {
  readonly slug: string;
  readonly events: readonly EventName[];
  readonly disclosure: ProductMeasurementDisclosure<EventName>;
  readonly clearContext: () => boolean;
}

const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2 focus-visible:ring-offset-white';

export default function MeasurementDisclosure<EventName extends string>({
  clearContext,
  disclosure,
  events,
  slug,
}: MeasurementDisclosureProps<EventName>) {
  const [clearStatus, setClearStatus] = useState('');

  function handleClearContext() {
    setClearStatus(clearContext() ? disclosure.clearSuccess : disclosure.clearBlocked);
  }

  return (
    <details
      id={`${requireIdentity(slug, 'slug')}-measurement-disclosure`}
      className="mt-4 scroll-mt-4 rounded-lg border border-[#DFE4F0] bg-[#E9EDFF] p-6 text-[#18275F] md:p-8"
    >
      <summary
        className={`flex min-h-11 cursor-pointer items-center text-base font-semibold leading-6 ${focusClasses}`}
      >
        {disclosure.summary}
      </summary>

      <div className="mt-6 space-y-6">
        <p className="text-sm font-normal leading-[1.4]">{disclosure.intro}</p>

        <section aria-label={disclosure.signalsHeading}>
          <p className="text-base font-semibold leading-6">{disclosure.signalsHeading}</p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm font-normal leading-[1.4]">
            {events.map((event) => (
              <li key={event}>{disclosure.signalLines[event]}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-normal leading-[1.4]">
            {disclosure.signalBoundary}
          </p>
        </section>

        <section aria-label={disclosure.browserHeading}>
          <p className="text-base font-semibold leading-6">{disclosure.browserHeading}</p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm font-normal leading-[1.4]">
            {disclosure.browserFacts.map((fact) => <li key={fact}>{fact}</li>)}
          </ul>
          <p className="mt-4 text-sm font-normal leading-[1.4]">
            {disclosure.browserBoundary}
          </p>
        </section>

        <section aria-label={disclosure.campaignHeading}>
          <p className="text-base font-semibold leading-6">{disclosure.campaignHeading}</p>
          <p className="mt-2 text-sm font-normal leading-[1.4]">
            {disclosure.campaignDescription}
          </p>
        </section>

        <section aria-label={disclosure.neverCollectedHeading}>
          <p className="text-base font-semibold leading-6">
            {disclosure.neverCollectedHeading}
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm font-normal leading-[1.4]">
            {disclosure.neverCollected.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <section aria-label={disclosure.summaryHeading}>
          <p className="text-base font-semibold leading-6">{disclosure.summaryHeading}</p>
          <p className="mt-2 text-sm font-normal leading-[1.4]">
            {disclosure.summaryIntro}
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm font-normal leading-[1.4]">
            {disclosure.summaryContents.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="mt-4 text-sm font-normal leading-[1.4]">
            {disclosure.summaryBoundary}
          </p>
        </section>

        <div>
          <button
            type="button"
            onClick={handleClearContext}
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#4054C6] px-4 py-2 text-left text-sm font-semibold leading-[1.4] text-[#4054C6] hover:bg-white active:bg-[#DBE2FF] md:w-auto ${focusClasses}`}
          >
            {disclosure.clearLabel}
          </button>
          <p
            role="status"
            className={`mt-2 min-h-[1.5rem] text-sm font-normal leading-[1.4] ${clearStatus === disclosure.clearBlocked ? 'text-[#B00020]' : 'text-[#18275F]'}`}
          >
            {clearStatus}
          </p>
        </div>
      </div>
    </details>
  );
}
