import {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { brochureFallbackBody } from '../products/copy';
import type { ProductBrochure } from '../products/types';

interface BrochurePanelProps {
  readonly brochure: ProductBrochure;
  readonly productName: string;
  readonly track: (event: string) => boolean;
  readonly events: {
    readonly preview: string;
    readonly open: string;
    readonly download: string;
  };
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
/** How far ahead of the viewport the desktop PDF embed starts loading. */
const EMBED_LOAD_MARGIN = '600px 0px';
const NEW_TAB_DISCLOSURE = 'Opening the brochure leaves this page in a new browser tab.';

const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2';
const surfaceClasses = 'rounded-2xl border border-[#DFE4F0] bg-[#E9EDFF] p-6 text-[#18275F]';
/**
 * The object child fallback fills the embed frame as one centred card, so a browser without a
 * PDF viewer shows no empty strip below it. The object already draws the 1px border (260913-x19).
 */
const objectFallbackClasses =
  'flex h-full flex-col justify-center rounded-2xl bg-[#E9EDFF] p-6 text-[#18275F] md:p-8';

export default function BrochurePanel({
  brochure,
  events,
  productName,
  track,
}: BrochurePanelProps) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const [embedRequested, setEmbedRequested] = useState(false);
  const previewRecorded = useRef(false);
  const mobilePreviewRef = useRef<HTMLImageElement | null>(null);
  const desktopPreviewRef = useRef<HTMLObjectElement | null>(null);
  const loadedPreviews = useRef(new WeakSet<Element>());
  const visiblePreviews = useRef(new WeakSet<Element>());
  const showPreview = brochure.previewImageHref !== '' && !previewFailed;

  const recordVisiblePreview = useCallback((element: Element) => {
    if (previewRecorded.current) return;
    if (!loadedPreviews.current.has(element) || !visiblePreviews.current.has(element)) {
      return;
    }

    previewRecorded.current = true;
    track(events.preview);
  }, [events.preview, track]);

  function handleImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    loadedPreviews.current.add(event.currentTarget);
    recordVisiblePreview(event.currentTarget);
  }

  function handleObjectLoad(event: SyntheticEvent<HTMLObjectElement>) {
    try {
      if (event.currentTarget.contentDocument?.contentType !== 'application/pdf') {
        return;
      }
    } catch {
      return;
    }

    loadedPreviews.current.add(event.currentTarget);
    recordVisiblePreview(event.currentTarget);
  }

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio <= 0) {
          continue;
        }

        visiblePreviews.current.add(entry.target);
        recordVisiblePreview(entry.target);
      }
    });
    const previews = [mobilePreviewRef.current, desktopPreviewRef.current]
      .filter((preview): preview is HTMLImageElement | HTMLObjectElement => (
        preview !== null
      ));

    previews.forEach((preview) => observer.observe(preview));

    return () => observer.disconnect();
  }, [showPreview, embedRequested, recordVisiblePreview]);

  /**
   * The desktop embed pulls in the whole 2.1 MB PDF and the browser's PDF viewer, and a page
   * holding that viewer — even an empty `<object type="application/pdf">` — is excluded from
   * the back/forward cache. So the `<object>` is rendered from the start (labelled, observed,
   * showing its branded fallback) and is replaced by one carrying the PDF `type` and `data`
   * once it comes within reach of the viewport. Without a usable observer it loads straight away.
   */
  useEffect(() => {
    const embed = desktopPreviewRef.current;
    if (embedRequested || embed === null) return;

    let observer: IntersectionObserver;
    try {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setEmbedRequested(true);
      }, { rootMargin: EMBED_LOAD_MARGIN });
    } catch {
      setEmbedRequested(true);
      return;
    }

    observer.observe(embed);
    return () => observer.disconnect();
  }, [embedRequested]);

  function handleBrochureOpen() {
    track(events.open);
  }

  function handleBrochureDownload() {
    track(events.download);
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
      <div>
        {/* Compact preview below lg — never a tall inline document viewer (D-06). */}
        <div className="lg:hidden">
          {showPreview ? (
            <picture className="block">
              {brochure.previewImageWebpSrcSet ? (
                <source
                  type="image/webp"
                  srcSet={brochure.previewImageWebpSrcSet}
                  sizes="calc(100vw - 32px)"
                />
              ) : null}
              <img
                ref={mobilePreviewRef}
                src={brochure.previewImageHref}
                alt={brochure.previewImageAlt}
                width={brochure.previewImageWidth}
                height={brochure.previewImageHeight}
                loading="lazy"
                decoding="async"
                onLoad={handleImageLoad}
                onError={() => setPreviewFailed(true)}
                className="h-auto w-full rounded-2xl border border-[#DFE4F0] bg-white object-cover"
              />
            </picture>
          ) : (
            <p className={`${surfaceClasses} text-base font-normal leading-6`}>{PREVIEW_ERROR}</p>
          )}
        </div>

        {/* Desktop embed attempt with a branded child fallback (D-08). */}
        <div className="hidden lg:block">
          <object
            // A fresh element once requested: Chrome does not re-evaluate an <object> whose
            // type/data are set after it has already fallen back to its children.
            key={embedRequested ? 'pdf-embed' : 'pdf-placeholder'}
            ref={desktopPreviewRef}
            data={embedRequested ? brochure.pdfHref : undefined}
            type={embedRequested ? 'application/pdf' : undefined}
            aria-label={`${productName} brochure preview`}
            onLoad={handleObjectLoad}
            className="aspect-[1287/909] w-full rounded-2xl border border-[#DFE4F0] bg-white"
          >
            <div className={objectFallbackClasses}>
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
          onClick={handleBrochureOpen}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#4054C6] px-4 py-3 text-sm font-semibold leading-[1.4] text-[#4054C6] hover:bg-[#E9EDFF] active:bg-[#DBE2FF] ${focusClasses}`}
        >
          <ExternalLink aria-hidden="true" size={18} />
          Open brochure
          <span className="sr-only"> (opens in a new tab)</span>
        </a>

        <a
          href={brochure.pdfHref}
          download={brochure.downloadName}
          onClick={handleBrochureDownload}
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
