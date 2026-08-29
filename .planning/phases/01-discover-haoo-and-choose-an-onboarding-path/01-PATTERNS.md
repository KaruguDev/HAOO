# Phase 1: Discover HAOO and Choose an Onboarding Path - Pattern Map

**Mapped:** 2026-08-29
**Files analyzed:** 25 likely new/modified files
**Analogs found:** 19 / 25

This map treats the structure proposed by `01-RESEARCH.md` as the likely implementation surface. Component boundaries remain planner discretion, but the physical `/products/haoo/` HTML entry, centralized product facts, static public assets, manual Tailwind utilities, and Lucide icons are phase contracts. Every displayed parent-brand occurrence must remain exactly `ZERO-PAPER HUB`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `products/haoo/index.html` | route/config | request-response | `index.html` | exact role, new product metadata |
| `vite.config.ts` | config | batch/build | `vite.config.ts` | exact modification |
| `package.json` | config | batch/build | `package.json` | exact modification |
| `package-lock.json` | config | batch/build | `package-lock.json` | generated modification |
| `vitest.config.ts` | config | batch/test | none | no local test config |
| `src/main.tsx` | route/bootstrap | request-response | `src/main.tsx` | exact modification |
| `src/App.tsx` | component/composition | request-response | `src/App.tsx` | exact modification or extraction source |
| `src/pages/HomePage.tsx` | component/page | request-response | `src/App.tsx` | exact role extraction |
| `src/pages/ProductPage.tsx` | component/page | request-response | `src/App.tsx` | role and flow match |
| `src/components/ProductsSection.tsx` | component | transform | `src/App.tsx` services grid | exact collection pattern |
| `src/components/ProductHeader.tsx` | component | event-driven/navigation | `src/App.tsx` header | exact role and flow |
| `src/components/OnboardingChoices.tsx` | component | request-response/navigation | `src/App.tsx` CTA/contact links | role match |
| `src/components/BrochurePanel.tsx` | component | file-I/O/navigation | `src/App.tsx` download CTA | partial; no embed fallback exists |
| `src/products/types.ts` | model | transform | module-level content shapes in `src/App.tsx` | role match, implicit types only |
| `src/products/registry.ts` | model/store | transform | `NAV_LINKS`, `VALUES`, `SERVICES` in `src/App.tsx` | role match |
| `src/products/haoo.ts` | model | transform | `SERVICES` in `src/App.tsx` | role and static-data match |
| `src/test/setup.ts` | test/config | batch | none | no local test framework |
| `src/test/products-section.test.tsx` | test | request-response | none | no local component tests |
| `src/test/haoo-page.test.tsx` | test | request-response | none | no local component tests |
| `src/test/haoo-content.test.ts` | test | transform | none | no local unit tests |
| `src/test/build-output.test.ts` | test | file-I/O/batch | `.github/workflows/deploy.yml` | partial build-artifact analog |
| `public/products/haoo/HAOO-Marketing-Brochure.pdf` | static asset | file-I/O | `public/marketing/zero-paper-hub-marketing.pdf` | exact asset role |
| `public/products/haoo/haoo-logo.png` | static asset | file-I/O | `public/marketing/assets/zero-paper-hub-logo.png` | exact asset role |
| `public/products/haoo/haoo-hero.png` | static asset | file-I/O | `public/image.png` | exact asset role |
| `public/products/haoo/brochure-preview.png` | static asset | file-I/O | `public/marketing/assets/zero-paper-hub-logo.png` | exact asset role |

## Pattern Assignments

### `products/haoo/index.html` (route/config, request-response)

**Analog:** `index.html`

**Document entry pattern** (`index.html:1-16`):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/zero-paper_hub_hi-def.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title data-default>ZERO-PAPER HUB | Strategic Digital Workflows</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Copy the doctype, language, root mount, root-relative favicon, viewport, and shared `/src/main.tsx` entry. Replace the `<head>` with the exact UI contract metadata: `HAOO Property Management | ZERO-PAPER HUB`, description, absolute canonical, Open Graph fields including `og:site_name=ZERO-PAPER HUB`, and Twitter fields. Do not copy the current `bolt.new` image placeholder from `index.html:8-10`; point social media metadata at the published HAOO landscape preview.

### `vite.config.ts` (config, batch/build)

**Analog:** current `vite.config.ts`

**Imports and existing plugin pattern** (`vite.config.ts:1-11`):

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

Preserve the React plugin, root base, and Lucide optimization exclusion. There is no local MPA analog: add `resolve` from `node:path` and `build.rollupOptions.input` for root `index.html` plus `products/haoo/index.html` using the concrete Physical Vite Multi-Page Entry pattern in `01-RESEARCH.md`. This is a build concern; do not introduce a runtime router.

### `package.json`, `package-lock.json`, and `vitest.config.ts` (config, batch/test)

**Analog:** `package.json`; no local Vitest analog.

**Script/dependency layout** (`package.json:6-17`, `package.json:19-34`):

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit -p tsconfig.app.json"
},
"dependencies": {
  "@supabase/supabase-js": "^2.57.4",
  "lucide-react": "^0.344.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1"
}
```

Add the research-approved `test` script and exact-pinned Wave 0 test packages only; do not upgrade Vite or add a component library. Let npm generate `package-lock.json`. `vitest.config.ts` has no repository analog and should follow `01-RESEARCH.md`: jsdom environment plus `./src/test/setup.ts`, compatible with Vite 5. Manual Tailwind and `lucide-react` remain the UI implementation choices; do not add shadcn, `components.json`, a registry, or another icon package.

### `src/main.tsx` (route/bootstrap, request-response)

**Analog:** current `src/main.tsx`

**Bootstrap pattern** (`src/main.tsx:1-10`):

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Keep one CSS import, one `createRoot`, and `StrictMode`. Make this the composition boundary that selects `HomePage` versus the HAOO product composition from the physical HTML pathname or a static `data-page` marker. Selection must not emulate client routing and must not gate any anchor.

### `src/App.tsx` and `src/pages/HomePage.tsx` (composition/page, request-response)

**Analog:** current `src/App.tsx`

If the planner extracts a `HomePage`, move existing home composition without changing its external behavior; keep `App.tsx` as a small composition wrapper or remove it only when all imports are updated. The home Products section is inserted after Services and before Values per the UI contract.

**Static content pattern** (`src/App.tsx:105-140`):

```tsx
const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Mission', href: '#mission' },
  { label: 'Services', href: '#services' },
  { label: 'Values', href: '#values' },
  { label: 'Contact', href: '#contact' },
];

const SERVICES = [
  {
    icon: Building2,
    title: 'Real Estate',
    desc: 'Digitize property listings, contracts, lease agreements, and compliance documents — eliminating paper at every step of the transaction lifecycle.',
  },
];
```

Add Products navigation from the product registry projection rather than duplicating HAOO facts in this file. Preserve exact uppercase `ZERO-PAPER HUB`; examples already occur in the logo accessible name at `src/App.tsx:180-182` and footer at `src/App.tsx:594-598`.

### `src/pages/ProductPage.tsx` (component/page, request-response)

**Analog:** `src/App.tsx` semantic page composition

**Semantic section and responsive layout pattern** (`src/App.tsx:262-296`):

```tsx
<section id="about" className="py-28 bg-white">
  <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
    <div>
      <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-700 mb-3 block">
        Who We Are
      </span>
      <h2 className="text-4xl md:text-5xl font-black text-green-900 leading-tight mb-6">
        Executive Summary
      </h2>
      <p className="text-gray-600 text-lg leading-relaxed mb-6">...</p>
    </div>
  </div>
</section>
```

Reuse semantic landmarks, named section IDs, bounded containers, responsive Tailwind grids, and text-first content. Feed the page a `ProductDefinition`; render the fixed UI-SPEC order and one `h1`. Add `Skip to HAOO content` as the first focusable control. New product UI uses only the UI-SPEC's four typography sizes/two weights and HAOO colors, while the recognizable header/footer retain ZERO-PAPER HUB shell colors.

### `src/components/ProductsSection.tsx` (component, transform)

**Analog:** services collection in `src/App.tsx`

**Mapped collection pattern** (`src/App.tsx:383-399`):

```tsx
<div className="grid md:grid-cols-3 gap-8">
  {SERVICES.map(({ icon: Icon, title, desc }, i) => (
    <div key={title}
      className="group relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 p-8"
      style={{ transitionDelay: `${i * 80}ms` }}>
      <Icon size={24} className="text-white" />
      <h3 className="text-xl font-bold text-green-900 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
    </div>
  ))}
</div>
```

Map registry products with a stable `slug` key. Render zero products by omitting both section and nav entry, one product as a full-width 5/7 featured card, and multiple products as the `lg` two-column collection. The card itself is not clickable; expose one native `Explore HAOO` anchor. Use the supplied brochure preview and centralized outcome/audience facts.

### `src/components/ProductHeader.tsx` (component, event-driven/navigation)

**Analog:** shared responsive header in `src/App.tsx`

**Desktop and mobile navigation pattern** (`src/App.tsx:177-218`):

```tsx
<header className="fixed top-0 left-0 right-0 z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
    <a href="#" className="flex min-w-0 items-center group" aria-label="ZERO-PAPER HUB home">
      <img src="/zero-paper_hub_hi-def.png" alt="ZERO-PAPER HUB" />
    </a>
    <nav className="hidden md:flex items-center gap-8">
      {NAV_LINKS.map(l => <a key={l.label} href={l.href}>{l.label}</a>)}
    </nav>
    <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg">
      {menuOpen ? <X size={22} /> : <Menu size={22} />}
    </button>
  </div>
</header>
```

Keep native anchors, mapped stable labels, and the mobile close-on-selection behavior shown at `src/App.tsx:203-216`. Improve the existing button pattern to meet the UI contract: add an accessible name, expose `aria-expanded`, maintain a 44px target, and make `Back to ZERO-PAPER HUB` always visible. HAOO anchors are Benefits, Capabilities, Brochure, and Onboarding.

### `src/components/OnboardingChoices.tsx` (component, request-response/navigation)

**Analog:** native contact and CTA links in `src/App.tsx`

**Native protocol anchor pattern** (`src/App.tsx:478-485`):

```tsx
<div className="flex items-start gap-4">
  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
    <Mail size={17} className="text-blue-700" />
  </div>
  <div>
    <div className="font-semibold text-gray-800 text-sm mb-0.5">Email</div>
    <a href="mailto:info@zero-paperhub.com" className="text-blue-700 text-sm hover:underline">
      info@zero-paperhub.com
    </a>
  </div>
</div>
```

Use one reusable component with `opening`, `mid-page`, and `closing` presentation variants. Read every href/label from `ProductDefinition`. Render WhatsApp, `tel:`, `mailto:`, and `https://manage.haoo.online/` anchors unconditionally—no state, effect, handler, storage, analytics, form, or PDF readiness check may determine their presence or call `preventDefault`. WhatsApp is the sole filled accent action; phone/email and self-onboarding are outlined/text treatments.

### `src/components/BrochurePanel.tsx` (component, file-I/O/navigation)

**Closest local analog:** download control in `src/App.tsx`; no embed/fallback analog exists.

**Existing download affordance** (`src/App.tsx:438-446`):

```tsx
<button onClick={downloadCompanyProfile}
  className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-white text-green-800 font-bold">
  <Download size={17} /> Download Profile
</button>
```

Copy only the visible icon-plus-label and Tailwind control styling convention, not the scripted Blob download. For the static PDF use a native same-origin `<a download>`. Implement the research-backed pattern because the repository has no equivalent: mobile compact image preview; desktop `<object data={pdfHref} type="application/pdf">` with branded child fallback; explicit `Open brochure` and `Download brochure` sibling anchors outside the object. The open link uses `_blank`, `rel="noopener"`, and an accessible name that announces the new tab. Keep `PDF · 2.1 MB` visible.

### `src/products/types.ts`, `src/products/registry.ts`, and `src/products/haoo.ts` (models/store, transform)

**Analog:** module-level arrays in `src/App.tsx:105-140`.

The existing data convention is uppercase module constants with objects consumed by `.map()`. Upgrade the implicit shapes to an exported strict `ProductDefinition` at this new browser/data boundary. `registry.ts` exports a readonly product collection and lookup/projection only; it does not own copied HAOO literals. `haoo.ts` is the one canonical fact ledger for relationship, outcome, audience, benefits, six capabilities, four journey steps, contacts, brochure, images, caveat, and derived native hrefs.

**Derived constant pattern from research (no local URL-derivation analog):**

```typescript
const whatsappText = encodeURIComponent(
  'Hello HAOO, I would like help choosing the best way to get started.',
);

const contacts = {
  phoneHref: 'tel:+254702188044',
  emailHref: 'mailto:info@haoo.online',
  whatsappHref: `https://wa.me/254702188044?text=${whatsappText}`,
  selfOnboardingHref: 'https://manage.haoo.online/',
};
```

Use ES modules, two-space indentation, single quotes, semicolons, readonly collections, and named fields. Keep `ZERO-PAPER HUB` uppercase in relationship/accessibility/metadata data. Do not import or inject brochure HTML and do not use `dangerouslySetInnerHTML`.

### `src/test/setup.ts` and four Phase 1 test files (test, batch/request-response/file-I/O)

**Local analog:** none. `package.json:6-11` currently has no test script, and the repository contains no test files.

Follow `01-RESEARCH.md` Wave 0 exactly: Vitest 3.2.4, jsdom 26.1.0, React Testing Library 16.3.2, DOM Testing Library 10.4.1, and explicit `afterEach(cleanup)` without globals. Query components by semantic role and accessible name, not visual class selectors.

- `products-section.test.tsx`: zero/one/many registry behavior, `#products` navigation, and exact `/products/haoo/` link.
- `haoo-page.test.tsx`: one `h1`, six capability cards, ordered four-step journey, three onboarding placements, unconditional exact native hrefs, desktop object fallback, and sibling brochure controls.
- `haoo-content.test.ts`: exact claims/contact ledger, `ZERO-PAPER HUB` capitalization, WhatsApp digits/text, and PDF checksum expectation.
- `build-output.test.ts`: run after build; assert `dist/products/haoo/index.html`, exact static metadata, valid built asset references, copied PDF/images, and brochure SHA-256.

**Partial build-artifact analog** (`.github/workflows/deploy.yml:35-47`):

```yaml
- name: Install dependencies
  run: npm ci

- name: Build
  run: npm run build

- name: Upload compiled website
  uses: actions/upload-pages-artifact@v4
  with:
    path: ./dist
```

Tests must inspect the same `dist` artifact that GitHub Pages uploads.

### `public/products/haoo/*` (static assets, file-I/O)

**Analog:** `public/marketing/` asset family.

**Asset-family convention** (`public/marketing/README.md:1-9`):

```markdown
# ZERO-PAPER HUB marketing

This folder contains the editable, print-ready A4 landscape tri-fold marketing document.

- `zero-paper-hub-marketing.html` — editable marketing source
- `zero-paper-hub-marketing.pdf` — print/share version
- `assets/zero-paper-hub-logo.png` — high-resolution ZERO-PAPER HUB logo
```

Place HAOO assets under the product-scoped public path and reference them as `/products/haoo/...`. Copy the supplied PDF bytes unchanged and validate SHA-256 `38d5ad8e7497c65c4fa2d374e7ed5e8d81ab79f3b25d1e0daa73321d45b9e7a6`. Copy the supplied logo, hero, and landscape preview without regenerating or recoloring. Vite public assets need no imports and are copied unchanged.

## Shared Patterns

### Manual Tailwind and Lucide Only

**Source:** `src/App.tsx:1-20`, `src/App.tsx:383-399`, `tailwind.config.js:1-8`

Import named Lucide components and render them as supporting decoration inside semantic controls/cards. Style all Phase 1 product surfaces with inline Tailwind utilities and responsive `md:`/`lg:` variants. Do not initialize shadcn, install a component library, add a registry, create bespoke inline SVGs, or move component styling into global CSS.

### Exact Parent Brand Contract

**Source:** `src/App.tsx:180-182`, `src/App.tsx:584-599`, `index.html:7`

The local analog consistently uses `ZERO-PAPER HUB` in visible copy and image alternative text. Apply exact uppercase spelling to titles, descriptions, canonical relationship copy, accessible labels, footer text, tests, and metadata. Product copy uses `A ZERO-PAPER HUB product` and footer copy uses `HAOO is a ZERO-PAPER HUB product`.

### Native Navigation and Progressive Enhancement

**Source:** `src/App.tsx:185-216`, `src/App.tsx:478-485`

Use `a[href]` for section links, product route, WhatsApp, phone, email, self-onboarding, brochure open, and brochure download. JavaScript may close a mobile menu but must not replace or intercept navigation. The PDF embed is optional enhancement; semantic HTML, fallback, and actions remain independently available.

### Data-Driven Repetition

**Source:** `src/App.tsx:105-140`, `src/App.tsx:383-399`, `src/App.tsx:588-591`

Keep facts in module data, map collections with stable semantic keys, and pass whole product definitions or explicit projections to components. Repeat components, never contact literals. This applies to the home card, capability cards, journey, three onboarding blocks, navigation, and footer.

### Accessibility and Error Recovery

**Source:** `src/App.tsx:180-182`, `src/App.tsx:527-538`; UI-SPEC contract

Use landmarks, sequential headings, labeled controls, native focusable elements, visible focus rings, at least 44px targets, and `role="status"` for dynamic status only. Brochure failure renders the locked recovery heading/body and keeps Open/Download anchors. Optional imagery can disappear without removing facts or actions.

### Build and Verification

**Source:** `.github/workflows/deploy.yml:29-47`, `package.json:6-11`

CI uses Node 22, runs `npm ci`, builds, then uploads `dist`. Phase implementation verification must run `npm run typecheck`, `npm run lint`, `npm run build`, and `npm test`; the build test must check the nested HTML and static files before upload.

## No Analog Found

| File / Concern | Role | Data Flow | Reason / Planner Source |
|---|---|---|---|
| `vitest.config.ts` | config | batch/test | No test framework exists; use `01-RESEARCH.md` Wave 0 exact versions/config. |
| `src/test/setup.ts` | test/config | batch | No local setup analog; use explicit Vitest `afterEach(cleanup)`. |
| `src/test/*.test.{ts,tsx}` | test | mixed | No local tests; use semantic Testing Library queries and research test map. |
| MPA `rollupOptions.input` addition | config | batch/build | Current Vite config has one implicit entry; use research Pattern 1. |
| Desktop PDF `<object>` fallback | component | file-I/O | No embed exists; use research Pattern 3 and locked UI recovery copy. |
| Typed `ProductDefinition` | model | transform | Existing content shapes are implicit; use research Pattern 2 and strict TypeScript. |

## Metadata

**Analog search scope:** `src/`, root HTML/config/package files, `.github/workflows/`, `public/`, and required Phase 1 artifacts
**Files scanned:** 14 implementation/config/asset files plus 4 upstream planning documents
**Strong analogs retained:** `src/App.tsx`, `src/main.tsx`, `index.html`, `vite.config.ts`, `package.json`, `.github/workflows/deploy.yml`, `public/marketing/README.md`
**Pattern extraction date:** 2026-08-29
