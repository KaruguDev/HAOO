---
phase: 01-discover-haoo-and-choose-an-onboarding-path
plan: 04
subsystem: ui
tags: [react, tailwind, lucide-react, semantic-html, accessibility, tdd, static-assets, navigation]

requires:
  - phase: 01-02
    provides: Physical `/products/haoo/` route, product social metadata, and the home tracer link this plan replaces
  - phase: 01-03
    provides: Centralized `ProductMedia`/`ProductDefinition` contracts and the product-agnostic page shell pattern
provides:
  - Readonly product registry with slug-derived route and navigation projections
  - Reusable zero/one/many `ProductsSection` with the locked featured HAOO card
  - Supplied landscape brochure preview published at `/products/haoo/brochure-preview.png`
  - Home navigation `Products` entry coupled to collection presence in both desktop and mobile variants
affects: [01-05, phase-1-verification]

actuals:
  tokens: 9400
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - Registry projections (`productRoute`, `productsNavLink`) so navigation and landmark presence cannot disagree
    - Collection size selects presentation (featured full-width at one, responsive `lg` grid at many)
    - Optional media gated on an empty href in centralized data rather than on JavaScript feature detection

key-files:
  created:
    - src/products/registry.ts
    - public/products/haoo/brochure-preview.png
  modified:
    - src/components/ProductsSection.tsx
    - src/App.tsx
    - src/products/types.ts
    - src/products/haoo.ts
    - src/test/products-section.test.tsx
    - src/test/setup.ts
    - src/test/build-output.test.ts
    - products/haoo/index.html

key-decisions:
  - "The Products navigation entry is derived from `productsNavLink(products)` rather than a copied HAOO condition, so the nav item and the `#products` landmark can never disagree about whether products exist."
  - "Home-card preview media facts (href, alt, intrinsic width/height) live in `HAOO_PRODUCT.brochure`, keeping `ProductsSection` free of HAOO literals and making the optional-media contract testable by emptying the href."
  - "Collection size, not a product identity check, selects the presentation: one product renders the locked featured 5/7 split, two or more render the responsive `lg:grid-cols-2` collection."
  - "The product social image metadata was repointed from the never-published `preview-outside.png` to the `brochure-preview.png` this plan actually publishes."
  - "The home mobile menu now uses the `hidden` attribute instead of a `max-h-0` collapse so collapsed navigation leaves the keyboard and assistive-technology order."

patterns-established:
  - "Registry projection: presence-derived UI (navigation entries) is computed from the collection, never re-derived from a product name."
  - "Card structure is shared across collection sizes; only the eyebrow label and the desktop split are featured-only."
  - "Test seam: `HomePage` accepts an optional `products` prop so the empty-collection contract is provable without mocking modules."

requirements-completed: [PROD-01, PROD-06]

coverage:
  - id: D1
    description: "Visitors discover a semantic Products landmark placed after Services and before Values, reachable from both desktop and mobile home navigation."
    requirement: PROD-01
    verification:
      - kind: integration
        ref: "src/test/products-section.test.tsx#exposes Products between Services and Values in desktop and mobile navigation"
        status: pass
      - kind: integration
        ref: "src/test/products-section.test.tsx#places the Products landmark after Services and before Values"
        status: pass
    human_judgment: false
  - id: D2
    description: "One HAOO product renders as a full-width featured card in the locked content order — Featured product label, HAOO identity, exact outcome, equal landlord/property-manager audience, then a single native `Explore HAOO` anchor to /products/haoo/ with no clickable-card wrapper."
    requirement: PROD-01
    verification:
      - kind: integration
        ref: "src/test/products-section.test.tsx#renders the locked featured card order, supplied preview, and one native action"
        status: pass
      - kind: integration
        ref: "src/test/products-section.test.tsx#renders one product as a featured HAOO card with a native route"
        status: pass
    human_judgment: false
  - id: D3
    description: "Zero products omit both the section and the navigation item, one product uses the featured layout, and two or more use the responsive collection — all from readonly registry data with no HAOO literals in the collection or navigation source."
    requirement: PROD-06
    verification:
      - kind: integration
        ref: "src/test/products-section.test.tsx#[phase1-red:products] omits the Products landmark when the collection is empty"
        status: pass
      - kind: integration
        ref: "src/test/products-section.test.tsx#omits the Products navigation item and section together for an empty collection"
        status: pass
      - kind: integration
        ref: "src/test/products-section.test.tsx#renders many products as a semantic collection without changing HAOO"
        status: pass
      - kind: other
        ref: "grep -niE 'haoo|paperwork|landlord|property manager' src/components/ProductsSection.tsx src/products/registry.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "The supplied landscape preview is published byte-identical, keeps its aspect ratio through intrinsic width/height, uses the alt text `HAOO property-management brochure preview`, and its absence cannot remove outcome, audience, identity, or action."
    requirement: PROD-06
    verification:
      - kind: integration
        ref: "src/test/products-section.test.tsx#keeps required featured copy and navigation available without preview media"
        status: pass
      - kind: integration
        ref: "src/test/build-output.test.ts#publishes the supplied social/preview image referenced by the product metadata"
        status: pass
    human_judgment: false
  - id: D5
    description: "Mobile menu selection of Products follows the native `#products` anchor and closes the menu, with accessible menu state and a 44px focusable target."
    requirement: PROD-01
    verification:
      - kind: integration
        ref: "src/test/products-section.test.tsx#closes the mobile menu after a visitor selects Products"
        status: pass
    human_judgment: false
  - id: D6
    description: "At 320px and 200% zoom the nav, card, image, copy, and action wrap and reflow with no horizontal page scrolling, and the desktop 5/7 copy-image balance and mobile copy-before-image order read correctly."
    requirement: PROD-01
    verification: []
    human_judgment: true
    rationale: "Responsive balance, crop framing, and zoom reflow are visual judgments; jsdom applies no CSS, so the layout classes cannot be proven by the automated suite. Carried into the end-of-phase UAT batch."

duration: 18 min
completed: 2026-08-29
status: complete
---

# Phase 01 Plan 04: Home Products Collection Summary

**A readonly product registry driving a reusable zero/one/many Products collection, the locked featured HAOO card with the supplied landscape preview, and presence-derived `Products` navigation in both home navigation variants.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-08-29T10:04:00Z
- **Completed:** 2026-08-29T10:22:19Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 10 (2 created, 8 modified)

## Accomplishments

- Replaced the 01-02 home tracer card with a reusable `ProductsSection` that renders nothing at zero products, the locked full-width featured card at one, and a responsive `lg:grid-cols-2` collection at two or more — all keyed by stable slug from readonly registry data.
- Added `src/products/registry.ts` with the `PRODUCTS` collection plus `productRoute()` and `productsNavLink()` projections, so the HAOO route and the navigation entry are both derived, never duplicated.
- Published the supplied landscape brochure preview byte-identical at `public/products/haoo/brochure-preview.png` (SHA-256 `7e62c3b7…`), with intrinsic `1287x909` dimensions reserving its space and the locked alt text `HAOO property-management brochure preview`.
- Moved the Products landmark to sit after Services and before Values, and inserted a presence-derived `Products` entry at the matching position in both the desktop and mobile home navigation.
- Gave the home header the accessibility it was missing: named `Primary` / `Primary mobile` navigation landmarks, an accessible-named menu toggle with `aria-expanded`/`aria-controls`, 44px focusable targets, visible focus rings, and a mobile menu that leaves the keyboard order when collapsed.

## Task Commits

1. **Task 1 RED: locked featured product card contract** — `7cf29b3` (test)
2. **Task 1 GREEN: reusable featured Products collection** — `6fb7a2a` (feat)
3. **Task 2 RED: home Products discovery navigation contract** — `4c06f46` (test)
4. **Task 2 GREEN: Products discovery through home navigation** — `ea89615` (feat)

**Plan metadata:** see the `docs(01-04)` commit that carries this summary.

## Files Created/Modified

- `src/products/registry.ts` — Readonly `PRODUCTS` collection with `productRoute()` and `productsNavLink()` projections and the shared section id/label constants.
- `src/components/ProductsSection.tsx` — Reusable collection: renders `null` at zero, the featured 5/7 desktop split at one, the responsive `lg` grid at many; single native `Explore {name}` anchor per card; preview image gated on a non-empty href.
- `src/App.tsx` — Products landmark placed between Services and Values; `Products` nav entry derived from registry presence; named navigation landmarks; accessible mobile menu state; `HomePage` exported with an optional `products` test seam.
- `src/products/types.ts` — `ProductBrochure` extended with `previewImageAlt`, `previewImageWidth`, `previewImageHeight`.
- `src/products/haoo.ts` — Preview href/alt/intrinsic size populated with the published asset facts.
- `public/products/haoo/brochure-preview.png` — Supplied landscape preview, copied unchanged.
- `products/haoo/index.html` — `og:image` and `twitter:image` repointed to the published preview.
- `src/test/products-section.test.tsx` — Featured-order contract plus four navigation-discovery contracts.
- `src/test/setup.ts` — No-op `IntersectionObserver` so jsdom can render the home reveal sections.
- `src/test/build-output.test.ts` — Social image constant aligned and a new assertion that the referenced preview is published byte-identical.

## Decisions Made

- **Presence-derived navigation.** `productsNavLink(products)` returns the entry or `null`; `App.tsx` splices it in front of `#values`. A copied "if HAOO exists" condition would have let the nav item and the landmark drift apart, which is exactly the zero-product failure the contract forbids.
- **Preview facts belong to the product.** Href, alt, and intrinsic dimensions live in `HAOO_PRODUCT.brochure`, so `ProductsSection` contains no HAOO string at all and the "optional preview" state is produced by emptying data rather than by a component flag.
- **Size, not identity, selects presentation.** `products.length === 1` drives the featured treatment. The eyebrow `Featured product` label and the desktop 5/7 split are featured-only; card structure is otherwise identical across collection sizes.
- **Mobile menu uses `hidden`.** The previous `max-h-0 opacity-0` collapse left every navigation link tabbable and exposed to assistive technology while invisible. Following the `ProductHeader` pattern from 01-03, the collapsed menu is now `hidden`; the CSS height transition was dropped, which the UI-SPEC permits since motion is optional enhancement only.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Product social image referenced an asset no plan publishes**
- **Found during:** Task 1 (publishing the supplied preview)
- **Issue:** `products/haoo/index.html` set `og:image` and `twitter:image` to `https://www.zero-paperhub.com/products/haoo/preview-outside.png`. No plan in this phase publishes `preview-outside.png` — this plan publishes the same supplied bytes as `brochure-preview.png` — so every social share would have resolved a 404 image. The UI-SPEC requires the supplied landscape preview to serve the home card, the mobile brochure panel, **and** the social image.
- **Fix:** Repointed both meta tags to `/products/haoo/brochure-preview.png` and updated the `PRODUCT_IMAGE` constant in `src/test/build-output.test.ts` to match. The metadata contract was strengthened rather than relaxed: a new test asserts the referenced preview actually exists on disk with the source SHA-256, so the reference can no longer dangle silently.
- **Files modified:** `products/haoo/index.html`, `src/test/build-output.test.ts`
- **Verification:** `Phase 1 static build contracts > contains exact source and built canonical/social metadata` and the new `publishes the supplied social/preview image referenced by the product metadata` both pass against source and built HTML.
- **Committed in:** `6fb7a2a` (Task 1 commit)

**2. [Rule 3 - Blocking] jsdom has no IntersectionObserver**
- **Found during:** Task 2 (navigation contracts)
- **Issue:** The navigation contracts must render `HomePage`, whose `useInView` hook constructs an `IntersectionObserver`. jsdom does not implement it, so every home-page render threw before any assertion could run.
- **Fix:** Added a guarded no-op `IntersectionObserver` to `src/test/setup.ts`. It installs only when the global is absent, so a real implementation is never shadowed.
- **Files modified:** `src/test/setup.ts`
- **Verification:** All four navigation contracts render `HomePage` and pass; the 20 pre-existing tests are unaffected.
- **Committed in:** `4c06f46` (Task 2 RED commit)

**3. [Rule 2 - Missing Critical] Home mobile menu had no accessible state and stayed in the keyboard order**
- **Found during:** Task 2 (navigation contracts)
- **Issue:** The home menu toggle was an icon-only `<button>` with no accessible name, no `aria-expanded`, and no `aria-controls` — a violation of the project's own icon-only-control convention. The collapsed menu used `max-h-0 opacity-0`, so all of its links remained tabbable and exposed to assistive technology while invisible. Task 2 explicitly requires "accessible menu state".
- **Fix:** Added `type="button"`, a toggling `aria-label`, `aria-controls`, and `aria-expanded`; converted the menu wrapper to a named `<nav aria-label="Primary mobile">` with the `hidden` attribute when closed; gave the toggle a 44px square target. The desktop navigation gained `aria-label="Primary"` and both variants gained 44px focusable link targets with visible focus rings.
- **Files modified:** `src/App.tsx`
- **Verification:** `closes the mobile menu after a visitor selects Products` asserts the full open → select → close cycle with `aria-expanded` transitions.
- **Committed in:** `ea89615` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 missing critical, 1 blocking)
**Impact on plan:** All three were required to satisfy the plan's own stated contracts (published preview as social image, testable navigation, accessible menu state). No scope creep — nothing outside the Products discovery path was touched.

## Verification Results

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run build` | pass — nested HAOO document plus preview/logo/hero assets emitted |
| `npx vitest run` | 30 passed / 2 failed — both failures belong to plan 01-05 |
| Baseline regression | all 20 previously-passing tests still pass; 4 previously-RED 01-04 contracts now green |
| `sha256sum` source vs `public/` vs `dist/` preview | identical (`7e62c3b7…`) |
| PROD-06 source scan | `ProductsSection.tsx` and `registry.ts` contain no HAOO content literals; the registry only imports the central definition |

The two remaining failures are `Phase 1 static build contracts > publishes the original brochure bytes at the public and built paths` and `Phase 1 semantic HAOO page contracts > keeps mobile and desktop brochure recovery plus Open and Download independent`. Both require the brochure PDF and the brochure panel, which plan 01-05 owns.

## Known Stubs

- `src/products/haoo.ts` — `HAOO_PRODUCT.brochure.pdfHref`, `downloadName`, and `expectationLabel` remain the `#brochure-pending` placeholders introduced in 01-02. Resolved by plan **01-05**, which publishes the PDF and builds the preview/open/download panel. This plan filled only the preview fields it publishes. Recorded in the cross-phase defect ledger.

No stub was introduced by this plan.

## Threat Flags

None — the plan's registered threats were mitigated as planned: T-01-12 by importing the central typed definition with slug-derived routes and exact route tests, T-01-13 by the visible HAOO identity, exact `A ZERO-PAPER HUB product` relationship line, supplied preview, and one descriptive destination anchor, and T-01-14 accepted and exercised by the missing-preview contract.

## Issues Encountered

- The 01-01 Wave 0 RED contracts (`9ce023b`) already fixed the collection API surface, so Task 1's RED commit extended rather than introduced the contract. Documented under TDD Gate Compliance.

## TDD Gate Compliance

| Task | RED | GREEN | REFACTOR | Status |
|------|-----|-------|----------|--------|
| 1 | `7cf29b3` (plus inherited Wave 0 contracts from `9ce023b`) | `6fb7a2a` | not needed | Pass |
| 2 | `4c06f46` | `ea89615` | not needed | Pass |

Both RED commits were confirmed failing before implementation: Task 1's featured-order contract failed on the stub section (5 failing), and Task 2's four navigation contracts failed because `HomePage` was not yet exported. Following the established repository convention from `9ce023b`, the RED commits name the API surface before it exists, so `npm run typecheck` was transiently red at commit `4c06f46` and green again at `ea89615`.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Ready for **01-05**: `public/products/haoo/brochure-preview.png` is published and tracked, and `ProductBrochure` now carries the preview alt and intrinsic dimensions the brochure panel needs. Only `pdfHref`, `downloadName`, and `expectationLabel` remain to be filled.
- Outstanding human checks carried into end-of-phase UAT: the desktop 5/7 copy-image balance, mobile copy-before-image order, 320px and 200%-zoom reflow with no horizontal scrolling, keyboard traversal to Products and through to `Explore HAOO`, and image-failure resilience of the featured card.

---
*Phase: 01-discover-haoo-and-choose-an-onboarding-path*
*Completed: 2026-08-29*

## Self-Check: PASSED

- All 10 key files verified present on disk; `public/products/haoo/brochure-preview.png` verified tracked by git with the source-identical SHA-256.
- All 4 task commits (`7cf29b3`, `6fb7a2a`, `4c06f46`, `ea89615`) verified in git history.
- `npm run typecheck`, `npm run lint`, and `npm run build` all pass at HEAD; 30 of 32 tests pass with only the two documented 01-05 brochure contracts outstanding.
- Working tree clean except the pre-existing untracked `.gsd/` and `.planning/milestone.lock`, which are outside this plan's scope.
