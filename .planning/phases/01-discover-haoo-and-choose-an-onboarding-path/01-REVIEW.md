---
phase: 01-discover-haoo-and-choose-an-onboarding-path
reviewed: 2026-08-29T14:05:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - src/App.tsx
  - src/components/BrochurePanel.tsx
  - src/components/OnboardingChoices.tsx
  - src/components/ProductHeader.tsx
  - src/components/ProductsSection.tsx
  - src/pages/ProductPage.tsx
  - src/products/haoo.ts
  - src/products/registry.ts
  - src/products/types.ts
  - src/test/build-output.test.ts
  - src/test/haoo-content.test.ts
  - src/test/haoo-page.test.tsx
  - src/test/products-section.test.tsx
  - src/test/setup.ts
  - scripts/assert-phase1-red.mjs
  - products/haoo/index.html
  - index.html
  - vite.config.ts
  - vitest.config.ts
  - package.json
  - AGENTS.md
findings:
  critical: 4
  warning: 17
  info: 8
  total: 29
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-29T14:05:00Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

Phase 01 delivers a genuinely well-structured static product surface: no backend, no forms, no storage, no tracking in the product components, native-only onboarding actions, and a data module (`src/products/haoo.ts`) that carries most brochure facts. `npm run lint`, `npm run typecheck`, and `npm run build` all pass cleanly, and the 44 contract tests pass **in this working tree**.

They do not pass anywhere else. Four defects were reproduced, not inferred:

1. `npm test` fails **7 of 44** on a fresh clone (verified in a clean `git worktree`) because `build-output.test.ts` reads `dist/`, which is `.gitignore`d and never built by the `test` script.
2. `npm run test:phase1:red` — a script shipped in `package.json` — is now **guaranteed to exit 1 forever** (verified by running it).
3. The phase's headline discovery path is broken: clicking the new **Products** nav link scrolls the `#products` heading **entirely behind the fixed home header** at `md` and above (64px section padding vs. a 104px header, with no `scroll-mt` / `scroll-padding-top` anywhere).
4. The focus ring used on the dark onboarding panels measures **2.21:1** against its own background — a failure of WCAG 2.2 SC 1.4.11 (3:1), on a phase that names "visible focus rings" as an explicit contract.

Beyond those, the strongest systemic concern is that the "single source of truth" claim is only partly true. `src/products/haoo.ts` owns the long-form copy, but **14 hardcoded `HAOO` string literals live in four product-generic components**, three representations of the phone number are hand-maintained side by side, and `ProductDefinition.audiences` is a required, populated, test-asserted field that **nothing renders**. The test suite is also weaker than its volume suggests: it asserts Tailwind class-name substrings as behavioural contracts, the entire `App` routing branch (the mechanism that makes `/products/haoo/` work at all) has zero coverage, and **no CI job runs the tests, the linter, or the type checker** — `deploy.yml` only builds.

No security vulnerabilities were found. No injection sinks, no `dangerouslySetInnerHTML`, no `eval`, no secrets, correct `rel="noopener"` on the only new-tab link, and `encodeURIComponent` on the WhatsApp payload. The no-backend / no-storage / no-tracking boundary holds inside `PRODUCT_SOURCES`, with one leak noted in WR-10.

## Structural Findings (fallow)

No `<structural_findings>` block was supplied with this review. The structural observations below were derived directly during this pass and are reported inline in the Narrative section:

- `ProductDefinition.audiences` — declared, populated, tested, never consumed by any renderer (WR-04).
- `ProductContacts.phoneNumber` / `whatsappStarterText` — declared and tested, never read by any consumer outside `haoo.ts` itself (WR-05).
- `PRODUCT_LINKS` (ProductHeader) vs. section `id`s (ProductPage) — duplicated anchor list across two modules with no linking assertion (WR-07).
- `'haoo-product'` — magic string duplicated across `src/App.tsx` and `products/haoo/index.html`, uncovered by tests (WR-02).
- `focusClasses` / `focusRingClasses` — four near-identical definitions across four files (IN-04).
- No circular dependencies detected. `src/products/haoo.ts` re-exports `ProductDefinition` (line 3) but every consumer imports it from `./types` directly — the re-export is unused.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: `npm test` fails 7/44 on a clean checkout — tests depend on an ungenerated, gitignored `dist/`

**File:** `src/test/build-output.test.ts:7-11`, `package.json:11`
**Issue:** `build-output.test.ts` resolves `DIST = resolve(ROOT, 'dist')` and asserts on `dist/products/haoo/index.html`, `dist/assets/*.js`, and `dist/products/haoo/*.png|pdf`. `dist` is gitignored (`.gitignore:10`) and `"test": "vitest run"` never invokes a build. The suite only passes here because a build artifact happens to be sitting in the working tree.

Reproduced in a clean `git worktree` of `HEAD` with `node_modules` symlinked:

```
 Test Files  1 failed | 3 passed (4)
      Tests  7 failed | 37 passed (44)
```

Failures include `emits a physical nested HAOO document`, `contains exact source and built canonical/social metadata`, `copies every referenced product asset into the uploaded artifact`, and `resolves every root-relative product reference inside the artifact`.

Corollary: the same tests will *pass against a stale `dist/`*. Editing `src/products/haoo.ts` and re-running `npm test` without rebuilding validates yesterday's bundle. The suite reports green while asserting nothing about the current source.

**Fix:** Make the build an explicit precondition, and fail loudly rather than silently, when it is missing.

```json
  "scripts": {
    "test": "npm run build && vitest run",
    "test:unit": "vitest run --exclude src/test/build-output.test.ts"
  }
```

Additionally, guard staleness at the top of the suite so a stale artifact cannot masquerade as a fresh one:

```ts
it('requires a build artifact newer than the product sources', () => {
  expect(existsSync(BUILT_HTML)).toBe(true);
  const builtAt = statSync(BUILT_HTML).mtimeMs;
  for (const relativePath of PRODUCT_SOURCES) {
    expect(statSync(resolve(ROOT, relativePath)).mtimeMs).toBeLessThanOrEqual(builtAt);
  }
});
```

---

### CR-02: `npm run test:phase1:red` is a shipped script that can never succeed again

**File:** `scripts/assert-phase1-red.mjs:48-51`, `package.json:12`
**Issue:** The script inverts the exit code — `if (result.status === 0) { ...; process.exit(1); }` — because it was the RED gate for TDD. The phase is now GREEN, so the script is permanently broken. Verified:

```
 Test Files  4 passed (4)
      Tests  44 passed (44)

Expected-red gate failed: the Phase 1 contract suites unexpectedly passed.
SCRIPT_EXIT=1
```

This is committed, discoverable scaffolding wired into `package.json`. Anyone (or any pipeline) invoking `npm run test:phase1:red` gets a hard failure with a message that reads like a real regression. `expectedMarkers` also pins the four `[phase1-red:*]` test-name markers, which now exist only to satisfy a script that cannot pass — so those markers are dead weight inside the test names too.

**Fix:** Delete `scripts/assert-phase1-red.mjs` and the `test:phase1:red` script entry now that RED has been demonstrated and recorded in the phase artifacts. If the RED evidence must be retained, move it to the phase directory as a recorded transcript, not as an executable script. Then strip the `[phase1-red:*]` prefixes from the four test names, which otherwise imply the tests are expected to fail.

---

### CR-03: The new Products anchor scrolls its heading behind the fixed header

**File:** `src/components/ProductsSection.tsx:84-95`, `src/App.tsx:212`, `src/index.css:7-9`
**Issue:** Phase 01 added `#products` as a nav target (`registry.ts:32`, `App.tsx:127-140`) but gave the section `py-12 md:py-16` and no scroll offset. The home header is `fixed` (`App.tsx:212`) and there is **no `scroll-mt` on `#products` and no `scroll-padding-top` on `html`** anywhere in the codebase (grep confirms `scroll-mt` appears only in `ProductPage.tsx`).

Measured with Tailwind's `box-sizing: border-box` preflight:

| viewport | header height (scrolled) | `#products` top padding | `<h2>Products</h2>` position |
|---|---|---|---|
| `md`+ | `py-3` (24) + logo `h-20` (80) = **104px** | `md:py-16` = **64px** | y 64→98 — **fully covered** |
| mobile | `py-2.5` (20) + logo `h-14` (56) = **76px** | `py-12` = **48px** | y 48→82 — **~60% covered** |

Every other home section uses `py-28` (112px), which clears the 104px header — which is exactly why this defect is specific to the section this phase introduced. The Products nav link is the phase's primary discovery path per the stated Core Value, and activating it lands the visitor on a section whose heading they cannot see.

(`#values` at `py-20` = 80px has the same pre-existing flaw, which is why the global fix below is preferable to a local one.)

**Fix:** Add a global scroll offset so every current and future anchor clears the fixed header:

```css
/* src/index.css */
html {
  scroll-behavior: smooth;
  scroll-padding-top: 7rem; /* clears the 104px fixed header at md+ */
}
```

Or, if the fix must stay local to Phase 01 code:

```tsx
    <section
      id={PRODUCTS_SECTION_ID}
      aria-labelledby={headingId}
      className="scroll-mt-24 bg-white py-12 md:scroll-mt-28 md:py-16"
    >
```

Then add a regression test that asserts every in-page nav `href` resolves to an element carrying a scroll offset.

---

### CR-04: Focus ring on the dark onboarding panels fails WCAG non-text contrast (2.21:1)

**File:** `src/components/OnboardingChoices.tsx:12,48`
**Issue:** `focusDark` sets `focus-visible:ring-[#4054C6]` **and** `focus-visible:ring-offset-[#18275F]`. Tailwind's ring utility draws the offset shadow first and the ring outside it, so setting the offset colour to the panel's own background removes the white gap that normally supplies the contrast. The ring is then `#4054C6` directly on `#18275F`.

Relative luminance: `#4054C6` = 0.11505, `#18275F` = 0.02471.
Contrast = `(0.11505 + 0.05) / (0.02471 + 0.05)` = **2.21:1**. WCAG 2.2 SC 1.4.11 requires **3:1** for focus indicators.

This affects the "Start with HAOO" self-onboarding link in the **opening** and **closing** placements — two of the three onboarding surfaces, including the closing CTA. `onDark` is true for both (`OnboardingChoices.tsx:21`). Note that `focusDark` is *actively worse* than doing nothing: Tailwind's default `--tw-ring-offset-color` is `#fff`, which would have produced a visible white halo. The phase names "visible focus rings" as an explicit accessibility contract, and `haoo-page.test.tsx` never checks focus-indicator contrast.

**Fix:** On dark surfaces, use a light ring (the offset can stay dark to preserve the visual gap):

```tsx
const focusDark =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#18275F]';
```

`#FFFFFF` on `#18275F` gives **14.1:1**. Add a unit test asserting that no `focus-visible:ring-*` colour is paired with a `ring-offset-*` of the same family.

---

## Warnings

### WR-01: Home footer navigation silently omits Products, contradicting the stated invariant

**File:** `src/App.tsx:637`
**Issue:** `homeNavLinks()` carries a comment promising the nav entry and the Products landmark "can never disagree about whether products exist" (`App.tsx:123-126`). The footer bypasses it entirely and maps the raw module constant:

```tsx
{NAV_LINKS.map(l => (          // ← should be navLinks
  <a key={l.label} href={l.href} ...>{l.label}</a>
))}
```

The header shows Products; the footer does not. The derivation the comment advertises is applied in exactly one of the two places that render the link list, and no test covers the footer.

**Fix:** Use the derived list: `{navLinks.map(l => (...))}`. Add an assertion to `products-section.test.tsx` that the footer link set equals the header link set for both a populated and an empty collection.

---

### WR-02: The routing key is an untested magic string spanning a TSX file and an HTML file

**File:** `src/App.tsx:656`, `products/haoo/index.html:22`
**Issue:** The entire product route depends on `document.body.dataset.page === 'haoo-product'` matching `<body data-page="haoo-product">`. Grep confirms these are the only two occurrences and there is no shared constant. **No test renders the default `App` export** — `products-section.test.tsx:3` imports the named `HomePage`, and `haoo-page.test.tsx:3` imports `ProductPage` directly. So the single mechanism that makes `/products/haoo/` render anything other than the marketing home page has zero automated coverage.

Renaming the key in either file produces a silent regression: `/products/haoo/` serves the correct HTML shell (canonical, OG tags, PDF alternate all intact) but React renders the home page into it. `build-output.test.ts` would not notice — its `/products/haoo/[A-Za-z0-9._-]+` regex requires a path segment after the slash, so `productRoute()`'s trailing-slash output is never matched or validated either.

There is also no fallback branch: any unrecognised `data-page` value silently renders `HomePage`.

**Fix:** Export the key from the product module and assert the wiring:

```ts
// src/products/registry.ts
export const PRODUCT_PAGE_KEYS: Record<string, ProductDefinition> = {
  'haoo-product': HAOO_PRODUCT,
};
```

```tsx
// src/App.tsx
export default function App() {
  const key = document.body.dataset.page;
  const product = key ? PRODUCT_PAGE_KEYS[key] : undefined;
  return product ? <ProductPage product={product} /> : <HomePage />;
}
```

Then add a test that sets `document.body.dataset.page`, renders `App`, and asserts the h1 — plus a `build-output.test.ts` assertion that `products/haoo/index.html` contains `data-page="${key}"` for every registered key, and that `productRoute(product)` resolves to a real `dist/**/index.html`.

---

### WR-03: 14 hardcoded `HAOO` literals live inside product-generic components

**File:** `src/components/OnboardingChoices.tsx:30,47,49`; `src/components/ProductHeader.tsx:19,33,43,53`; `src/components/BrochurePanel.tsx:17`; `src/pages/ProductPage.tsx:30,36,37,42,179`
**Issue:** All four components accept a `product` or `productName` prop, yet hardcode the brand:

| Location | Literal | Available from data |
|---|---|---|
| `OnboardingChoices:30` | `Chat with HAOO on WhatsApp` | `product.name` |
| `OnboardingChoices:47` | `Continue to HAOO's platform…` | `product.name` |
| `OnboardingChoices:49` | `Start with HAOO` | `product.name` |
| `BrochurePanel:17` | `…the HAOO brochure…` | `productName` (already a prop, used only on line 56) |
| `ProductPage:30` | `…the complete HAOO explanation.` | `product.name` |
| `ProductPage:179` | `HAOO is a ZERO-PAPER HUB product` | restates `product.relationship` |
| `ProductHeader:33,43,53` | `HAOO sections`, `Open HAOO navigation`, … | `productName` (a prop, used only on line 31) |
| `ProductHeader:19` | `id = 'haoo-mobile-navigation'` | — |

Two concrete consequences, not just style:

1. `products-section.test.tsx:36-49` already exercises a second product (`Future product`). Route to it and the page reads "Chat with **HAOO** on WhatsApp" while dialling that product's number — factually wrong contact copy.
2. `ProductHeader`'s `menuId` is a module-level literal. Two product pages in one document, or a future products index that mounts two headers, produce a **duplicate DOM `id`**, breaking `aria-controls` resolution for at least one of them.

This is the direct violation of the phase contract that `src/products/haoo.ts` is the single source of truth for HAOO facts.

**Fix:** Thread the existing props through, and derive the id:

```tsx
// ProductHeader
export default function ProductHeader({ productName, slug }: ProductHeaderProps) {
  const menuId = `${slug}-mobile-navigation`;
  // aria-label={`${productName} sections`}, `Open ${productName} navigation`, …
```

```tsx
// OnboardingChoices
Chat with {product.name} on WhatsApp
Start with {product.name}
```

```tsx
// BrochurePanel — accept the copy or interpolate the prop
const fallbackBody = `You can still open the ${productName} brochure in a new tab or download the PDF.`;
```

Then add a test that renders `ProductPage` with a non-HAOO product and asserts the string `HAOO` appears **zero** times in `container.textContent`.

---

### WR-04: `ProductDefinition.audiences` is required, populated, asserted — and never rendered

**File:** `src/products/types.ts:46`, `src/products/haoo.ts:15`, `src/test/haoo-content.test.ts:39`
**Issue:** `audiences: ['Landlords', 'Property managers', 'Tenants', 'Agents']` is a required interface field, is populated from the brochure, and is asserted by `haoo-content.test.ts:39` — but grep across `src/components`, `src/pages`, and `src/App.tsx` finds **zero** reads of `.audiences`. Tenants and Agents, two of the four brochure audiences, never reach a visitor.

This directly contradicts `ProductPage.tsx:30`: *"The overview above is the complete HAOO explanation."* It is not complete; the product's own data model says so. Worse, the passing content test creates the impression that the audience list ships.

**Fix:** Either render it (an audience chip row under `audienceLead` in the hero, or a line in the Benefits section), or delete the field from `ProductDefinition`, `haoo.ts`, and the test. Do not leave a required field that only a test observes. If retained, add a rendering assertion to `haoo-page.test.tsx` so the data/UI link is enforced.

---

### WR-05: The phone number is denormalised into three hand-maintained literals

**File:** `src/products/haoo.ts:7,90-96`
**Issue:** `PHONE_NUMBER = '254702188044'` exists to centralise the number, but only `whatsappHref` derives from it. `phoneDisplay` (`'+254 702 188 044'`) and `phoneHref` (`'tel:+254702188044'`) restate it as independent literals:

```ts
phoneDisplay: '+254 702 188 044',
phoneNumber: PHONE_NUMBER,
phoneHref: 'tel:+254702188044',   // ← not derived
```

Change `PHONE_NUMBER` and `whatsappHref` follows while `phoneHref` and `phoneDisplay` silently keep dialling the old number. `haoo-content.test.ts:73-74` pins all three to literals, so the test would fail — but it would fail on the *derived* value, pointing the fixer at the wrong line.

Separately, `contacts.phoneNumber` and `contacts.whatsappStarterText` are required interface fields that **no consumer reads** (grep: zero hits in `src/components`, `src/pages`, `src/App.tsx`). They exist only as inputs to `whatsappHref`, which is built in the same module — so they are exported denormalised copies with no reader.

**Fix:** Derive everything from one literal and drop the unread fields, or keep them but derive:

```ts
const PHONE_NUMBER = '254702188044';
const PHONE_E164 = `+${PHONE_NUMBER}`;
// …
phoneDisplay: '+254 702 188 044',   // formatting is genuinely presentational
phoneHref: `tel:${PHONE_E164}`,
```

Add a test asserting `phoneHref.replace(/\D/g, '') === phoneNumber` and `phoneDisplay.replace(/\D/g, '') === phoneNumber` so the three representations cannot drift.

---

### WR-06: Product cards show a brochure preview labelled as a brochure, while the real product image is ignored

**File:** `src/components/ProductsSection.tsx:14-19,54-66`
**Issue:** `ProductCard` destructures its illustration from `product.brochure` and renders it with `alt={previewImageAlt}` = `"HAOO property-management brochure preview"`. But the card contains exactly one link — `Explore HAOO` → `/products/haoo/`. There is no brochure anywhere on it. A screen-reader user is told they are looking at a brochure preview on a card that offers no brochure.

Meanwhile `product.media.hero` (`'Property manager outside a modern apartment building'`, 1122×1402, already published and integrity-checked) is populated and unused by this component.

This also couples the Products collection to `ProductBrochure`, making `brochure` structurally mandatory for any future product — a product without a PDF cannot appear on the home page at all.

**Fix:** Use the product's own media with a fallback, and let the card degrade when neither exists:

```tsx
const image = product.media.hero ?? product.media.logo;
// …
{image ? (
  <img src={image.href} alt={image.alt} width={image.width} height={image.height} … />
) : null}
```

Update `products-section.test.tsx:87-93` to assert the hero image rather than the brochure preview.

---

### WR-07: Product nav anchors are duplicated from the page's section ids with no assertion that any resolve

**File:** `src/components/ProductHeader.tsx:4-9`, `src/pages/ProductPage.tsx:86,106,162,170`
**Issue:** `PRODUCT_LINKS` hardcodes `#benefits`, `#capabilities`, `#brochure`, `#onboarding`. Those ids live in a different module. `haoo-page.test.tsx:52-54` only checks that a *link named* `Benefits` exists — it never resolves the `href` against the DOM. Rename a section id in `ProductPage.tsx` and every test still passes while the header produces four dead anchors.

The list is also incomplete: `Rental journey` is one of the five contracted page sections (and is asserted as such at `haoo-page.test.tsx:45`) but has no `id` and no nav entry.

**Fix:** Derive the section list from one source consumed by both the header and the page:

```ts
export const PRODUCT_SECTIONS = [
  { id: 'benefits', label: 'Benefits' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'journey', label: 'Rental journey' },
  { id: 'brochure', label: 'Brochure' },
  { id: 'onboarding', label: 'Onboarding' },
] as const;
```

And assert resolution:

```ts
for (const link of within(nav).getAllByRole('link')) {
  const href = link.getAttribute('href')!;
  expect(container.querySelector(href)).not.toBeNull();
}
```

---

### WR-08: The "Rental journey" landmark excludes its own heading, and section labels duplicate headings instead of referencing them

**File:** `src/pages/ProductPage.tsx:133-156`
**Issue:** The journey block nests a labelled `<section>` inside an unlabelled one, with the `<h2>` stranded outside the region it names:

```tsx
<section className="py-12 md:py-16">          {/* unnamed */}
  <h2 className={headingClasses}>Rental journey</h2>
  <section aria-label="Rental journey" className="mt-6">   {/* named, no heading */}
```

A screen-reader user who jumps to the "Rental journey" region lands in a bare `<ol>` with no heading context, and the outer `<section>` is dead markup contributing nothing.

More broadly, `Benefits`, `Capabilities`, `Brochure`, and `Rental journey` all use `aria-label` that *restates* a visible `<h2>` verbatim. `ProductsSection.tsx:81-95` gets this right with `aria-labelledby={headingId}`. With `aria-label`, the accessible name and the visible heading can drift independently — and `#onboarding` already has drifted: it is labelled `Onboarding` but contains no `<h2>Onboarding</h2>` at all, only OnboardingChoices' own headings.

Counting nested `OnboardingChoices` regions, the page exposes **eight** `region` landmarks, which is landmark noise for a document with five real sections.

**Fix:** Collapse the journey to one section and switch every section to `aria-labelledby`, matching the pattern already used in `ProductsSection`:

```tsx
<section id="journey" aria-labelledby="journey-heading" className="scroll-mt-4 py-12 md:py-16">
  <div className={containerClasses}>
    <h2 id="journey-heading" className={headingClasses}>Rental journey</h2>
    <ol …>
```

Change the `OnboardingChoices` wrappers from `<section aria-label>` to `<div role="group" aria-label>` (or drop the label and rely on the parent section) to stop multiplying landmarks.

---

### WR-09: `/products/haoo/` renders nothing without JavaScript, and there is no `<noscript>` fallback

**File:** `products/haoo/index.html:22-25`
**Issue:** The product page body is `<div id="root"></div>` plus a module script. Every brochure fact, every contact link, and the brochure PDF link exist only after React hydrates. If the bundle fails to load — flaky mobile connection, an aggressive corporate proxy, JS disabled — the visitor gets a blank white page on a document whose entire purpose is static marketing content.

This is unnecessary: `index.html` already carries a `<link rel="alternate" type="application/pdf">` to the brochure, and the phase explicitly forbids interactivity beyond native links. A minimal `<noscript>` block would preserve the phase's core value (understand the product, reach an onboarding path) at zero architectural cost.

**Fix:**

```html
<noscript>
  <p>HAOO — a ZERO-PAPER HUB product. Run the business, not the paperwork.</p>
  <p>
    <a href="https://wa.me/254702188044">WhatsApp +254 702 188 044</a> ·
    <a href="tel:+254702188044">+254 702 188 044</a> ·
    <a href="mailto:info@haoo.online">info@haoo.online</a> ·
    <a href="https://manage.haoo.online/">manage.haoo.online</a> ·
    <a href="/products/haoo/HAOO-Marketing-Brochure.pdf">Download the brochure (PDF)</a>
  </p>
</noscript>
```

Assert its presence in `build-output.test.ts` for both the source and built HTML.

---

### WR-10: The "no third-party / no tracking" guard cannot see the third-party font request the product page makes

**File:** `src/test/build-output.test.ts:29-38,154-175`, `src/index.css:1`
**Issue:** The boundary test scans a **hand-maintained list** of eight `PRODUCT_SOURCES` for `fetch(`, `localStorage`, `gtag(`, `analytics.`, etc. Two gaps:

1. `src/index.css:1` is `@import url('https://fonts.googleapis.com/css2?family=Inter…')`. Every visitor to `/products/haoo/` makes an uncredentialed request to Google, disclosing their IP and `Referer`. That is a third-party request on a page contracted to have none, and the guard cannot see it because CSS is not in `PRODUCT_SOURCES`.
2. The list is a literal array. Add `src/components/ProductGallery.tsx` tomorrow and it is scanned by nothing — the guard silently shrinks in coverage as the surface grows, while continuing to report green.

**Fix:** Glob the surface instead of enumerating it, and include stylesheets and entry HTML:

```ts
const PRODUCT_SOURCES = [
  ...listFiles(resolve(ROOT, 'src/components')),
  ...listFiles(resolve(ROOT, 'src/pages')),
  ...listFiles(resolve(ROOT, 'src/products')),
  resolve(ROOT, 'src/index.css'),
  resolve(ROOT, 'products/haoo/index.html'),
].filter((f) => /\.(tsx?|css|html)$/.test(f) && !f.includes('/test/'));
```

Add `/https?:\/\/(?!wa\.me|manage\.haoo\.online)/` to the forbidden patterns for CSS/HTML, then self-host Inter under `public/fonts/` to close the leak.

---

### WR-11: No CI job runs the tests, the linter, or the type checker

**File:** `.github/workflows/deploy.yml`
**Issue:** `deploy.yml` is the only workflow. Its steps are Checkout → Setup Node → `npm ci` → `npm run build` → Configure Pages → Upload → Deploy. There is no `npm test`, no `npm run lint`, no `npm run typecheck`.

All 44 Phase 01 contract tests — the brochure sha256 integrity checks, the accessibility contracts, the no-tracking boundary guard, the source-fidelity assertions — are enforced by nothing. A push that breaks every one of them deploys to production. Combined with CR-01 (the tests do not even pass on a clean checkout), the phase's verification story currently depends entirely on someone remembering to build and run tests locally.

**Fix:** Add a `verify` job that gates the deploy:

```yaml
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
      - run: npx vitest run

  deploy:
    needs: verify
    # …
```

Also trigger it on `pull_request`, not only `push: [main]`.

---

### WR-12: A 2.16 MB PDF is embedded on every viewport with no user gesture

**File:** `src/components/BrochurePanel.tsx:51-64`
**Issue:** The `<object data={brochure.pdfHref} type="application/pdf">` is rendered unconditionally; only CSS (`hidden lg:block`) hides it below `lg`. Two problems:

1. On desktop, the full 2.16 MB brochure loads on page render before the visitor has expressed any interest — while the panel's own comment (line 33) states the design intent is "never a tall inline document viewer (D-06)".
2. Below `lg` the element is `display:none`, and whether a browser fetches `<object data>` in that state is engine-dependent and **not verified anywhere in the test suite**. If it does fetch, every mobile visitor on metered Kenyan mobile data silently pays 2.16 MB for content the design explicitly replaced with a lightweight preview image.

`haoo-page.test.tsx:204-208` asserts the `lg:block` class name, which proves nothing about network behaviour (jsdom applies no CSS and loads no subresources).

**Fix:** Gate the embed on an actual viewport check rather than a CSS class, so the element is not in the DOM at all on small screens:

```tsx
const isDesktop = typeof window !== 'undefined'
  && window.matchMedia('(min-width: 1024px)').matches;
// …
{isDesktop ? <object data={brochure.pdfHref} … /> : null}
```

Or make the embed opt-in behind the existing "Open brochure" affordance, which already covers the use case.

---

### WR-13: The home page still advertises a `bolt.new` scaffolding image as its social preview

**File:** `index.html:8,10`
**Issue:**

```html
<meta property="og:image" content="https://bolt.new/static/og_default.png" />
<meta name="twitter:image" content="https://bolt.new/static/og_default.png" />
```

Phase 01 built correct, tested social metadata for `/products/haoo/` and even added an explicit assertion that the product page does **not** contain this URL (`build-output.test.ts:89`) — so the team identified the problem and fixed exactly one of the two pages. Any share of `https://www.zero-paperhub.com/` (the destination of the new "Back to ZERO-PAPER HUB" links added by this phase) renders a third-party scaffolding graphic, and hands the fetch to `bolt.new`.

The product page also lacks the `og:image:width` / `og:image:height` hints that some crawlers use.

**Fix:** Point both tags at a first-party asset (`brochure-preview.png` and `zero-paper_hub_hi-def.png` are both already published and integrity-checked), add `og:url` / `og:title` / `og:description` / `og:site_name` to match the product page's completeness, and extend the `not.toContain('bolt.new')` assertion to cover `index.html` and `dist/index.html` too.

---

### WR-14: `@types/node` is required for typecheck but undeclared

**File:** `package.json:21-40`, `src/test/build-output.test.ts:1-6`
**Issue:** `build-output.test.ts` imports `node:crypto`, `node:fs`, `node:path` and uses `import.meta.dirname` (line 6). `tsconfig.app.json` includes `"src"` and sets no `"types"` restriction, so TypeScript auto-loads every `@types/*` package it finds. `npm run typecheck` passes **only** because `@types/node` is present in `node_modules` as a hoisted transitive dependency of `vite`/`jsdom` — it is not in `devDependencies`.

A dependency bump that changes hoisting or drops the transitive edge breaks `npm run typecheck` with errors that will look unrelated to the change that caused them. `import.meta.dirname` also requires Node ≥ 20.11; nothing in `package.json` declares an `engines` floor.

**Fix:**

```json
  "devDependencies": {
    "@types/node": "^22.0.0",
```

and

```json
  "engines": { "node": ">=20.11" }
```

---

### WR-15: `BrochurePanel.previewFailed` never resets when the brochure changes

**File:** `src/components/BrochurePanel.tsx:27-28,43`
**Issue:** `previewFailed` latches `true` on the first `onError` and is never cleared. It is not keyed to `brochure.previewImageHref`. If `BrochurePanel` is ever re-rendered with a different product's brochure without remounting — which the multi-product registry (`registry.ts:14`) and the `products-section.test.tsx` second-product case both anticipate — the new product's perfectly valid preview is suppressed and the error copy shown instead.

**Fix:** Key the state to the source, so a new href starts clean:

```tsx
<BrochurePanel key={product.brochure.previewImageHref} … />
```

or reset inside the component:

```tsx
const [failedHref, setFailedHref] = useState<string | null>(null);
const showPreview = brochure.previewImageHref !== ''
  && failedHref !== brochure.previewImageHref;
// onError={() => setFailedHref(brochure.previewImageHref)}
```

---

### WR-16: `scroll-behavior: smooth` is global and ignores `prefers-reduced-motion`

**File:** `src/index.css:7-9`, `src/pages/ProductPage.tsx:116`
**Issue:** Phase 01 added nine new in-page anchor links (five in `ProductHeader`, one in the home nav, plus the skip link), all of which trigger the global smooth scroll. `ProductPage.tsx:116` demonstrates that motion sensitivity is an active concern for this phase — the capability cards carry `motion-reduce:transform-none motion-reduce:transition-none` — yet the long-distance animated scroll those new links produce is unguarded. Smooth scrolling is a documented vestibular trigger.

**Fix:**

```css
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}
```

---

### WR-17: Tests assert Tailwind class-name substrings as behavioural contracts

**File:** `src/test/haoo-page.test.tsx:202,207-208,319-321`; `src/test/products-section.test.tsx:123-124`
**Issue:** Several "contract" assertions check for CSS class strings that jsdom never evaluates:

```ts
expect(preview.parentElement?.className).toContain('lg:hidden');
expect(pdfObject!.parentElement?.className).toContain('lg:block');
expect(hero.className).toContain('aspect-[4/3]');
expect(link.className).toContain('min-h-11');
expect(link.className).not.toMatch(/truncate|line-clamp|whitespace-nowrap/);
```

These verify that a string appears in an attribute, not that the responsive behaviour, the 44px target, or the aspect ratio actually holds. Reorder the class list, migrate to a `clsx` helper, or move a rule into a component class and the assertions break while the UI is unchanged — and conversely, the UI can break (as CR-03 and CR-04 demonstrate for uncovered properties) while they all pass.

`haoo-page.test.tsx:369-371` and `products-section.test.tsx:161-163` are stronger examples of the same problem: `document.documentElement.scrollWidth <= clientWidth` is trivially true in jsdom, where every layout dimension is 0. That overflow assertion can never fail.

**Fix:** Keep the class assertions as cheap smoke checks if desired, but stop presenting them as the contract. Move genuine responsive, target-size, and overflow verification into a real-browser layer (Playwright with `toHaveCSS` / `boundingBox()`), or record them as manual UAT items rather than automated guarantees. At minimum, delete the two `scrollWidth` assertions, which are pure noise.

---

## Info

### IN-01: Unused `@supabase/supabase-js` runtime dependency

**File:** `package.json:16`
**Issue:** Declared as a production dependency with no import anywhere in `src/`. `AGENTS.md:58` already flagged this ("declared and locked, but no import or active use is detected"), and `build-output.test.ts:167` now actively forbids the string in product sources — yet the package remains installed, adding supply-chain surface and `npm ci` time for nothing.
**Fix:** `npm uninstall @supabase/supabase-js`.

---

### IN-02: Package still named `vite-react-typescript-starter`

**File:** `package.json:2`
**Issue:** Scaffolding name on a project now deploying a branded product site. Surfaces in `npm` output, error traces, and the build log (`> vite-react-typescript-starter@0.0.0 build`).
**Fix:** Rename to `zero-paper-hub`.

---

### IN-03: Unused `data-default` attribute

**File:** `index.html:7`
**Issue:** `<title data-default>` — grep across the whole repo finds exactly one occurrence. Nothing reads it. Leftover from an abandoned per-page title mechanism, now superseded by the separate `products/haoo/index.html` entry.
**Fix:** Remove the attribute.

---

### IN-04: Four near-duplicate focus-ring constants

**File:** `src/App.tsx:120`, `src/components/ProductsSection.tsx:5`, `src/components/ProductHeader.tsx:15`, `src/components/OnboardingChoices.tsx:11-12`, `src/pages/ProductPage.tsx:31`
**Issue:** Five definitions of the same utility string across five files, under three different names (`focusRingClasses`, `focusClasses`, `focusLight`) and three ring colours (`green-600`, `blue-700`, `#4054C6`). CR-04 is a direct consequence — a per-file constant made it easy for one variant to regress unnoticed.
**Fix:** Extract to `src/styles/focus.ts` with named exports (`focusOnLight`, `focusOnDark`, `focusBrand`) and import everywhere.

---

### IN-05: `object-cover` is inert alongside `h-auto`

**File:** `src/components/ProductsSection.tsx:63`, `src/components/BrochurePanel.tsx:44`
**Issue:** `className="h-auto w-full … object-cover"` — `object-fit` has no effect when the element's height is content-derived, since there is no box to fit into. Misleading intent.
**Fix:** Drop `object-cover`, or set an explicit `aspect-[…]` as `ProductPage.tsx:79` correctly does for the hero.

---

### IN-06: React keys derived from content strings

**File:** `src/pages/ProductPage.tsx:93,99,114,139`
**Issue:** `key={pain}`, `key={benefit}`, `key={title}`. Safe for today's data, but two identical capability titles or repeated benefit sentences would produce duplicate keys and a React warning. Content is not a stable identity.
**Fix:** Add an `id` to `ProductStoryItem`, or key on `index` for these static, never-reordered lists.

---

### IN-07: Capability icon map is HAOO content living outside `haoo.ts`

**File:** `src/pages/ProductPage.tsx:22-29,111`
**Issue:** `CAPABILITY_ICONS` is keyed by HAOO's exact capability titles inside a product-generic page — another instance of the WR-03 pattern. The `?? Building2` fallback also reuses the icon already assigned to `Properties & units`, so an unrecognised capability silently renders a misleading (though `aria-hidden`) glyph.
**Fix:** Move an `icon` key onto `ProductStoryItem` in the product definition, keeping the icon choice with the fact it illustrates.

---

### IN-08: `homeNavLinks` anchors on the wrong neighbour and returns a shared mutable array

**File:** `src/App.tsx:127-140`
**Issue:** Two small smells. The function positions Products by searching for `#values` and falling back to `NAV_LINKS.length` — so removing the Values entry would push Products to the very end (after Contact), not after Services, contradicting the contract that `products-section.test.tsx:127-128` asserts. And the early return on line 130 hands callers the module-level `NAV_LINKS` array itself, which is typed mutable (no `as const`, no `readonly`), so a caller could mutate shared module state.
**Fix:** Insert after `#services` (`servicesIndex + 1`) since that is the stated invariant, and declare `const NAV_LINKS = [...] as const;`, returning a copy in both branches.

---

_Reviewed: 2026-08-29T14:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
