import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import {
  mobileNavigationId,
  mobileSectionsNavLabel,
  navigationToggleLabel,
  sectionsNavLabel,
} from '../products/copy';
import type { ProductDefinition } from '../products/types';

const PRODUCT_LINKS = [
  { label: 'Benefits', href: '#benefits' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Brochure', href: '#brochure' },
  { label: 'Onboarding', href: '#onboarding' },
] as const;

interface ProductHeaderProps {
  readonly product: ProductDefinition;
}

const focusClasses = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2';

export default function ProductHeader({ product }: ProductHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = mobileNavigationId(product.slug);

  return (
    <header className="border-b border-[#DFE4F0] bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className={`inline-flex min-h-11 min-w-0 items-center rounded-lg px-2 text-sm font-semibold leading-[1.4] text-green-800 hover:text-green-700 ${focusClasses}`}
        >
          Back to ZERO-PAPER HUB
        </a>

        <span className="ml-auto text-sm font-semibold leading-[1.4] text-[#18275F]">{product.name}</span>

        <nav aria-label={sectionsNavLabel(product.name)} className="hidden items-center gap-4 md:flex">
          {PRODUCT_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={`inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold leading-[1.4] text-[#18275F] hover:text-[#4054C6] ${focusClasses}`}>
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          aria-label={navigationToggleLabel(product.name, menuOpen)}
          aria-controls={menuId}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className={`inline-flex size-11 items-center justify-center rounded-lg text-[#18275F] hover:bg-[#E9EDFF] md:hidden ${focusClasses}`}
        >
          {menuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
        </button>
      </div>

      <nav id={menuId} aria-label={mobileSectionsNavLabel(product.name)} hidden={!menuOpen} className="border-t border-[#DFE4F0] bg-white px-4 pb-4 sm:px-6 md:hidden">
        <div className="flex flex-col gap-1 pt-2">
          {PRODUCT_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className={`inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold leading-[1.4] text-[#18275F] hover:bg-[#E9EDFF] hover:text-[#4054C6] ${focusClasses}`}>
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
