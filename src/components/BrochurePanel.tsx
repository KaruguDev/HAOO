import { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { brochureFallbackBody } from '../products/copy';
import type { ProductBrochure } from '../products/types';

interface BrochurePanelProps {
  readonly brochure: ProductBrochure;
  readonly productName: string;
}

/**
 * Locked UI-SPEC recovery copy. The `<object>` child fallback renders whenever the
 * browser cannot embed the PDF; the compact panel copy renders when the supplied
 * preview image is absent or fails to load. Neither state may remove the sibling
 * Open and Download controls.
 */
const FALLBACK_HEADING = 'Brochure preview unavailable';
const PREVIEW_ERROR =
  "We couldn't show the brochure preview here. Open the brochure or download the PDF instead.";
const NEW_TAB_DISCLOSURE = 'Opening the brochure leaves this page in a new browser tab.';

const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2';
const surfaceClasses = 'rounded-2xl border border-[#DFE4F0] bg-[#E9EDFF] p-6 text-[#18275F]';

export default function BrochurePanel({ brochure, productName }: BrochurePanelProps) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const showPreview = brochure.previewImageHref !== '' && !previewFailed;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
      <div>
        {/* Compact preview below lg — never a tall inline document viewer (D-06). */}
        <div className="lg:hidden">
          {showPreview ? (
            <img
              src={brochure.previewImageHref}
              alt={brochure.previewImageAlt}
              width={brochure.previewImageWidth}
              height={brochure.previewImageHeight}
              loading="lazy"
              decoding="async"
              onError={() => setPreviewFailed(true)}
              className="h-auto w-full rounded-2xl border border-[#DFE4F0] bg-white object-cover"
            />
          ) : (
            <p className={`${surfaceClasses} text-base font-normal leading-6`}>{PREVIEW_ERROR}</p>
          )}
        </div>

        {/* Desktop embed attempt with a branded child fallback (D-08). */}
        <div className="hidden lg:block">
          <object
            data={brochure.pdfHref}
            type="application/pdf"
            aria-label={`${productName} brochure preview`}
            className="aspect-[1287/909] w-full rounded-2xl border border-[#DFE4F0] bg-white"
          >
            <div className={surfaceClasses}>
              <h3 className="mb-2 text-[28px] font-semibold leading-[1.2]">{FALLBACK_HEADING}</h3>
              <p className="text-base font-normal leading-6 text-[#5F6B84]">{brochureFallbackBody(productName)}</p>
            </div>
          </object>
        </div>
      </div>

      {/*
        Independent native controls. They are siblings of the embed in every state and
        share no mutable state, so repeated, interrupted, or concurrent activation of
        one can never disable, serialize, or alter the other (PROD-04, D-07).
      */}
      <div className="grid content-start gap-4">
        <a
          href={brochure.pdfHref}
          target="_blank"
          rel="noopener"
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#4054C6] px-4 py-3 text-sm font-semibold leading-[1.4] text-[#4054C6] hover:bg-[#E9EDFF] active:bg-[#DBE2FF] ${focusClasses}`}
        >
          <ExternalLink aria-hidden="true" size={18} />
          Open brochure
          <span className="sr-only"> (opens in a new tab)</span>
        </a>

        <a
          href={brochure.pdfHref}
          download={brochure.downloadName}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#4054C6] px-4 py-3 text-sm font-semibold leading-[1.4] text-[#4054C6] hover:bg-[#E9EDFF] active:bg-[#DBE2FF] ${focusClasses}`}
        >
          <Download aria-hidden="true" size={18} />
          Download brochure
        </a>

        <p className="text-sm font-semibold leading-[1.4] text-[#5F6B84]">
          {brochure.expectationLabel}
        </p>
        <p className="text-sm font-normal leading-[1.4] text-[#5F6B84]">{NEW_TAB_DISCLOSURE}</p>
      </div>
    </div>
  );
}
