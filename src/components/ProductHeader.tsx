import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import {
  PRODUCT_SECTION_LINKS,
  mobileNavigationId,
  mobileSectionsNavLabel,
  navigationToggleLabel,
  productHomeLinkLabel,
  sectionsNavLabel,
} from '../products/copy';
import type { ProductDefinition } from '../products/types';

interface ProductHeaderProps {
  readonly product: ProductDefinition;
}

/** The header turns solid once the page has scrolled past this many pixels. */
const SCROLL_THRESHOLD_PX = 40;

/** The primary call to action. Product-generic: it names no product. */
const GET_STARTED_LABEL = 'Get started';
const GET_STARTED_HREF = '#onboarding';

/*
 * Focus indicators, one plain literal per surface. Each ring colour lives with its own
 * offset colour so the focus-contrast gate (`src/test/focus-contrast.test.ts`) measures the
 * pairing actually painted. The state picks a constant by identifier; never interpolate both
 * into one template literal, which the gate would read as blue ring on navy offset (2.21:1).
 */
const focusOnLight = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2';
const focusOnNavy = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#18275F]';

export default function ProductHeader({ product }: ProductHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = mobileNavigationId(product.slug);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    }

    // Computed on mount too, so a page opened at a fragment starts in the right state.
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // The open mobile panel always sits under a white bar.
  const solid = scrolled || menuOpen;
  const focusClasses = solid ? focusOnLight : focusOnNavy;
  const headerStateClasses = solid ? 'bg-white py-2 shadow-md md:py-3' : 'bg-transparent py-3 md:py-5';
  const sectionLinkStateClasses = solid ? 'text-[#18275F] hover:text-[#4054C6]' : 'text-white/90 hover:text-white';
  const toggleStateClasses = solid ? 'text-[#18275F] hover:bg-[#E9EDFF]' : 'text-white hover:bg-white/10';
  const homeTextStateClasses = solid ? 'text-[#18275F]' : 'text-white';
  const logo = product.media.logo;

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,padding] duration-300 motion-reduce:transition-none ${headerStateClasses}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <a
          href="#top"
          aria-label={productHomeLinkLabel(product.name)}
          className={`inline-flex min-h-11 min-w-0 shrink-0 items-center rounded-lg ${focusClasses}`}
        >
          {logo ? (
            <img
              src={logo.href}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              loading="eager"
              decoding="async"
              className="h-12 w-auto rounded-lg bg-white/95 object-contain p-1 shadow-sm sm:h-14 sm:p-1.5 lg:h-16"
            />
          ) : (
            <span className={`text-lg font-extrabold ${homeTextStateClasses}`}>{product.name}</span>
          )}
        </a>

        <nav aria-label={sectionsNavLabel(product.name)} className="hidden items-center gap-4 md:flex lg:gap-6 xl:gap-8">
          {PRODUCT_SECTION_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-medium tracking-wide transition-colors duration-200 motion-reduce:transition-none ${sectionLinkStateClasses} ${focusClasses}`}
            >
              {link.label}
            </a>
          ))}
          {/*
            Shown from lg. Between md and lg the bar cannot fit the logo, five links and the pill on
            one line (the 260913-vbl visual check measured "Send details" and the pill wrapping at
            768px), so the CTA stays in the mobile panel below md and returns at 1024px.
          */}
          <a
            href={GET_STARTED_HREF}
            className={`ml-2 hidden min-h-11 items-center rounded-full bg-[#4054C6] px-5 text-sm font-semibold text-white shadow transition-colors duration-200 hover:bg-[#34459F] motion-reduce:transition-none lg:inline-flex ${focusClasses}`}
          >
            {GET_STARTED_LABEL}
          </a>
        </nav>

        <button
          type="button"
          aria-label={navigationToggleLabel(product.name, menuOpen)}
          aria-controls={menuId}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-lg md:hidden ${toggleStateClasses} ${focusClasses}`}
        >
          {menuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
        </button>
      </div>

      {/* Display utilities live on the inner div only: one on the nav would defeat `hidden`. */}
      <nav id={menuId} aria-label={mobileSectionsNavLabel(product.name)} hidden={!menuOpen} className="md:hidden">
        <div className="flex max-h-[calc(100dvh-5rem)] flex-col gap-1 overflow-y-auto border-t border-[#DFE4F0] bg-white px-4 pb-4 pt-2 shadow-md sm:px-6">
          {PRODUCT_SECTION_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium leading-[1.4] text-[#18275F] hover:bg-[#E9EDFF] hover:text-[#4054C6] ${focusOnLight}`}
            >
              {link.label}
            </a>
          ))}
          <a
            href={GET_STARTED_HREF}
            onClick={() => setMenuOpen(false)}
            className={`mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#4054C6] px-5 text-sm font-semibold text-white hover:bg-[#34459F] ${focusOnLight}`}
          >
            {GET_STARTED_LABEL}
          </a>
        </div>
      </nav>
    </header>
  );
}
