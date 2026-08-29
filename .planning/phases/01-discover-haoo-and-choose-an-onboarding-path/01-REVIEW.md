---
phase: 01-discover-haoo-and-choose-an-onboarding-path
reviewed: 2026-08-29T19:41:41Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - AGENTS.md
  - index.html
  - package.json
  - products/haoo/index.html
  - scripts/assert-phase1-red.mjs
  - src/App.tsx
  - src/components/BrochurePanel.tsx
  - src/components/OnboardingChoices.tsx
  - src/components/ProductHeader.tsx
  - src/components/ProductsSection.tsx
  - src/pages/ProductPage.tsx
  - src/products/copy.ts
  - src/products/haoo.ts
  - src/products/registry.ts
  - src/products/types.ts
  - src/test/build-output.test.ts
  - src/test/focus-contrast.test.ts
  - src/test/haoo-content.test.ts
  - src/test/haoo-page.test.tsx
  - src/test/product-shell-reuse.test.tsx
  - src/test/products-section.test.tsx
  - src/test/setup.ts
  - vite.config.ts
  - vitest.config.ts
findings:
  critical: 1
  warning: 3
  info: 0
  total: 4
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-29T19:41:41Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

The implementation builds cleanly and all 63 tests, lint, and type checking pass. The shipped page nevertheless drops half of the brochure's audience ledger from rendered content, while the claimed reusable shell still embeds HAOO-specific story semantics. The home document also publishes unrelated third-party social artwork, and the production dependency set retains an unused Supabase client.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Informational tenant and agent audiences are never rendered

**Classification:** BLOCKER

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/pages/ProductPage.tsx:68-72`

**Issue:** `HAOO_PRODUCT.audiences` contains all four brochure audiences (`Landlords`, `Property managers`, `Tenants`, and `Agents`) at `src/products/haoo.ts:15`, but `ProductPage` never reads the field. The only rendered audience statement names landlords and property managers. Agents are absent from the page entirely, and tenants appear only incidentally in feature copy, so a visitor cannot discover the complete informational audience set required by PROD-03. `haoo-content.test.ts` verifies only that the data exists; it does not verify that visitors can see it.

**Fix:** Render the centralized audience collection in the guided overview and add a DOM-level assertion for every item:

```tsx
<section aria-labelledby="audiences-heading">
  <h2 id="audiences-heading" className={headingClasses}>Who HAOO supports</h2>
  <ul>
    {product.audiences.map((audience) => (
      <li key={audience}>{audience}</li>
    ))}
  </ul>
</section>
```

Update `haoo-page.test.tsx` to render `ProductPage` and assert that each `HAOO_PRODUCT.audiences` entry is visible in that named region. Keep landlords and property managers primary in the hero while presenting tenants and agents as informational audiences.

## Warnings

### WR-01: The reusable product shell silently imposes HAOO-specific story semantics

**Classification:** WARNING

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/pages/ProductPage.tsx:28-35`

**Issue:** The generic `ProductPage` hardcodes HAOO-specific capability-title-to-icon mappings and falls back to `Building2` for every unknown capability. It also hardcodes `The paperwork problem`, `Less chasing. More control.`, and `Rental journey` at lines 98, 104, and 142. The synthetic ZENITH test describes a general service operation but still renders a rental journey and property icon; it passes only because the test rejects the literal name `HAOO`, not HAOO-specific domain content. A future registered product can therefore render semantically wrong copy and icons while every reuse contract remains green.

**Fix:** Move story labels and an explicit icon key into `ProductDefinition`, define HAOO's values in `haoo.ts`, and render only data supplied by the product:

```ts
export type ProductCapabilityIcon =
  | 'payments'
  | 'properties'
  | 'leases'
  | 'maintenance'
  | 'marketplace'
  | 'reports';

export interface ProductStoryItem {
  readonly title: string;
  readonly description: string;
  readonly icon: ProductCapabilityIcon;
}

export interface ProductDefinition {
  // existing fields...
  readonly painHeading: string;
  readonly benefitHeading: string;
  readonly journeyHeading: string;
}
```

Map icons by `icon`, not display title, and strengthen `product-shell-reuse.test.tsx` to give ZENITH distinct headings/icon keys and assert that no HAOO-specific story labels are rendered.

### WR-02: Home-page social previews advertise Bolt instead of ZERO-PAPER HUB

**Classification:** WARNING

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/index.html:8-10`

**Issue:** The root document's Open Graph and Twitter image both point to `https://bolt.new/static/og_default.png`. Sharing the company home page therefore presents unrelated third-party branding, and availability/privacy of the preview depends on a domain the project does not control. The product document correctly uses a first-party absolute image, but no test covers the root document.

**Fix:** Replace both values with a stable first-party absolute image URL and add root Open Graph title, description, and URL metadata. Extend `build-output.test.ts` to inspect both source and built root HTML and reject `bolt.new`:

```html
<meta property="og:image" content="https://www.zero-paperhub.com/zero-paper_hub_hi-def.png" />
<meta name="twitter:image" content="https://www.zero-paperhub.com/zero-paper_hub_hi-def.png" />
```

### WR-03: Unused Supabase client remains in production dependencies

**Classification:** WARNING

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/package.json:17`

**Issue:** `@supabase/supabase-js` is declared as a runtime dependency but has no import or integration anywhere in the reviewed source. This contradicts the repository's own dependency guidance, expands install/audit and supply-chain surface, and suggests a backend seam in a phase explicitly constrained to static hosting with no product data capture.

**Fix:** Remove the unused dependency and update the lockfile with the package manager:

```sh
npm uninstall @supabase/supabase-js
```

If a later phase genuinely introduces Supabase, add it together with the concrete integration, privacy review, and boundary tests rather than carrying it speculatively.

---

_Reviewed: 2026-08-29T19:41:41Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
