---
phase: 01-discover-haoo-and-choose-an-onboarding-path
plan: 03
subsystem: ui
tags: [react, tailwind, lucide-react, semantic-html, accessibility, tdd, static-assets]

requires:
  - phase: 01-02
    provides: Physical `/products/haoo/` Vite entry, centralized HAOO contact data, and the outcome-led opening tracer
provides:
  - Product-first HAOO navigation with a persistent `Back to ZERO-PAPER HUB` route and first-focusable skip link
  - Reusable `OnboardingChoices` rendered at opening, mid-page, and closing positions from one product definition
  - Complete pain-to-benefit HAOO story with six exact capability cards and four exact ordered rental-journey steps
  - Centralized `ProductMedia` contract plus the unmodified HAOO logo and hero photograph under `public/products/haoo/`
affects: [01-04, 01-05, phase-1-verification]

actuals:
  tokens: 8716
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - Product-agnostic page shell driven entirely by a `ProductDefinition` prop
    - Optional media declared in centralized product data so absent imagery degrades without removing facts or actions
    - Nested named region for the rental-journey list so the section `h2` stays outside the step-heading contract

key-files:
  created:
    - src/components/ProductHeader.tsx
    - src/components/OnboardingChoices.tsx
    - public/products/haoo/haoo-logo.png
    - public/products/haoo/haoo-hero.png
  modified:
    - src/pages/ProductPage.tsx
    - src/products/haoo.ts
    - src/products/types.ts
    - src/test/haoo-page.test.tsx
    - src/test/haoo-content.test.ts

key-decisions:
  - "Every visible HAOO claim is copied verbatim from the canonical brochure; only the pain framing and the two benefit summaries are condensed, and both are assembled from brochure sentences rather than authored anew."
  - "Media paths live in `HAOO_PRODUCT.media` rather than in `ProductPage.tsx` so the shell stays product-agnostic and the partial-media contract is testable by omitting data."
  - "The rental-journey `h2` sits outside a nested `aria-label=\"Rental journey\"` region so the region exposes exactly the four step headings required by the Wave 0 contract."
  - "The HAOO logo is indigo-on-transparent, so it renders on a white card inside the navy hero and carries empty `alt` because the adjacent `HAOO` text already names the product."
  - "The hero photograph uses `object-bottom` so the 4:3 mobile crop keeps the foreground property professional visible; the 4:5 desktop ratio is the untouched source ratio (1122x1402)."

patterns-established:
  - "Source fidelity: brochure-derived strings are asserted by exact equality in `haoo-content.test.ts` before they are rendered."
  - "Prohibition testing: rendered page text is scanned for business-outcome guarantee language so PROHIB-CONTENT-01 is enforced automatically."
  - "Optional media: imagery is rendered conditionally from product data, never gated by JavaScript feature detection."

requirements-completed: [PROD-03]

coverage:
  - id: D1
    description: "Product-first navigation exposes Benefits, Capabilities, Brochure, and Onboarding anchors, keeps `Back to ZERO-PAPER HUB` visible, and offers `Skip to HAOO content` as the first focusable control."
    requirement: PROD-03
    verification:
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#renders fixed sequential semantic sections and product navigation"
        status: pass
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#keeps navigation accessibility and all onboarding placements tied to one product"
        status: pass
    human_judgment: false
  - id: D2
    description: "Opening, mid-page, and closing onboarding placements render identical native WhatsApp, phone, email, and self-onboarding destinations from one product definition."
    requirement: PROD-03
    verification:
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#renders three independent onboarding placements with exact native hrefs"
        status: pass
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#exposes accessible mobile navigation and unclipped native actions"
        status: pass
    human_judgment: false
  - id: D3
    description: "The guided story reads pain before benefit and renders six exact capability groups and four exact ordered rental-journey steps with the feature-availability caveat and the qualified Kenya market claim."
    requirement: PROD-03
    verification:
      - kind: unit
        ref: "src/test/haoo-content.test.ts#keeps the pain-to-benefit story, capabilities, and rental journey source faithful"
        status: pass
      - kind: unit
        ref: "src/test/haoo-content.test.ts#[phase1-red:content] preserves the exact brochure ledger in centralized data"
        status: pass
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#renders the pain-before-benefit story with the exact caveat and market source fidelity"
        status: pass
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#renders all six brochure capability groups as textual cards"
        status: pass
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#renders the four rental journey steps as an ordered list"
        status: pass
    human_judgment: false
  - id: D4
    description: "The product story makes no rental-income, tenant-payment, or vacancy-filling guarantee (PROHIB-CONTENT-01)."
    requirement: PROD-03
    verification:
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#renders exact capability and rental journey descriptions without outcome guarantees (source fidelity)"
        status: pass
    human_judgment: true
    rationale: "The automated scan only rejects a known guarantee vocabulary. A human must still read the assembled page and confirm no combination of sentences implies a business-outcome promise."
  - id: D5
    description: "The supplied HAOO logo and hero photograph are published byte-for-byte under `public/products/haoo/` and copied unchanged into the build output."
    requirement: PROD-03
    verification:
      - kind: integration
        ref: "npm run build && sha256sum dist/products/haoo/haoo-logo.png dist/products/haoo/haoo-hero.png (ef318da3…, c08abdab… match source)"
        status: pass
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#publishes the exact supplied logo and hero media with reserved space"
        status: pass
    human_judgment: false
  - id: D6
    description: "Product facts, contacts, and all onboarding actions survive absent or failed optional imagery."
    requirement: PROD-03
    verification:
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#keeps every fact and action available when partial media is omitted"
        status: pass
    human_judgment: false
  - id: D7
    description: "Keyboard flow, visible focus on light and navy surfaces, mobile menu state, and 44px targets behave correctly at mobile and desktop widths."
    requirement: PROD-03
    verification: []
    human_judgment: true
    rationale: "jsdom cannot evaluate rendered focus rings, contrast, or hit-area geometry; the plan's named keyboard human-check is required."
  - id: D8
    description: "Every visible claim, capability title, journey title, caveat, and contact matches the canonical brochure, and the hero crop keeps the property professional visible with no text overlaid on the photograph."
    requirement: QUAL-06
    verification:
      - kind: unit
        ref: "src/test/haoo-content.test.ts#keeps every brochure-sourced native destination exact"
        status: pass
    human_judgment: true
    rationale: "QUAL-06 spans plans 01-03 and 01-05 (brochure PDF facts). The exact-equality tests cover the page ledger, but the plan requires a human side-by-side comparison against the brochure and a 320px/768px/1024px/200%-zoom crop inspection before QUAL-06 can be marked complete."
  - id: D9
    description: "Responsive layout holds at 320px and 200% zoom with no horizontal page overflow, capability cards at two columns from md and three from lg, and hero actions above the image on mobile."
    requirement: PROD-03
    verification:
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#publishes the exact supplied logo and hero media with reserved space (DOM order: actions precede hero image)"
        status: pass
    human_judgment: true
    rationale: "DOM order is asserted automatically, but real breakpoint rendering, zoom reflow, and horizontal-overflow absence require a browser; jsdom reports zero-width layout."

duration: 13 min
completed: 2026-08-29
status: complete
---

# Phase 1 Plan 03: Complete Brochure-Faithful HAOO Product Experience Summary

**Product-first HAOO navigation, three reusable onboarding placements, and the full pain-to-benefit story — six exact capability cards and four ordered journey steps rendered from a centralized ledger — with the supplied logo and hero photograph published byte-identically.**

## Performance

- **Duration:** 13 min (resumed session; Task 1 was executed in an earlier interrupted session)
- **Started:** 2026-08-29T12:55:00Z (resume point)
- **Completed:** 2026-08-29T13:08:00Z
- **Tasks:** 3
- **Files modified:** 9 (7 source/test, 2 binary assets)

## Accomplishments

- Product-first `ProductHeader` with Benefits/Capabilities/Brochure/Onboarding anchors, an accessible mobile menu that closes on selection, a persistent `Back to ZERO-PAPER HUB` route, and `Skip to HAOO content` as the first focusable control (Task 1, prior session).
- One `OnboardingChoices` component rendered at opening, mid-page, and closing positions, all reading the same product definition; WhatsApp is the sole filled accent action while phone, email, and self-onboarding stay visible.
- Expanded `HAOO_PRODUCT` into the full fact ledger — pains, benefits, all six brochure capability groups with their exact descriptions, all four rental-journey steps with their exact descriptions, the feature-availability caveat, and the qualified Kenya market claim.
- Rendered the fixed section order: hero → pain-to-benefit overview → capability cards → numbered ordered journey → mid-page onboarding → brochure anchor → closing onboarding and relationship footer.
- Published the supplied HAOO logo (362x176) and hero photograph (1122x1402) unchanged; both reach `dist/products/haoo/` with SHA-256 identical to source.

## Task Commits

Each task was committed atomically:

1. **Task 1: Product-first navigation and reusable onboarding placements** — `5c527d3` (test, RED) → `678458b` (feat, GREEN) _(prior session)_
2. **Task 2: Complete pain-to-benefit HAOO story from exact product data** — `3838f80` (test, RED) → `3f19b92` (feat, GREEN)
3. **Task 3: Publish and wire the exact HAOO identity and hero media** — `ae821ef` (feat)

_Task 3 is `type="auto"` without `tdd="true"`, so its tests and implementation ship in one commit._

## Files Created/Modified

- `src/components/ProductHeader.tsx` — Product-first navigation, mobile disclosure menu, parent-site return.
- `src/components/OnboardingChoices.tsx` — Assisted (WhatsApp/phone/email) and self-service variants for three placements.
- `src/pages/ProductPage.tsx` — Fixed semantic section composition, capability grid, ordered journey, hero media wiring.
- `src/products/haoo.ts` — Exact brochure pains, benefits, capabilities, journey, and the new `media` block.
- `src/products/types.ts` — Added `ProductImage` and `ProductMedia`; `media` is now part of `ProductDefinition`.
- `src/test/haoo-content.test.ts` — Exact-equality contract for pain, benefit, capability, and journey copy.
- `src/test/haoo-page.test.tsx` — Story ordering, caveat, market claim, guarantee prohibition, hero media, partial media.
- `public/products/haoo/haoo-logo.png` — Unmodified supplied identity asset (`ef318da3…`).
- `public/products/haoo/haoo-hero.png` — Unmodified supplied property hero asset (`c08abdab…`).

## Decisions Made

- **Verbatim brochure copy wherever the brochure has a sentence.** All six capability descriptions and all four journey descriptions are exact copies of the canonical brochure, verified against `brochure.html` before implementation. Only the single pain sentence and the two benefit sentences are condensed, and each is assembled from brochure phrases ("scattered spreadsheets, paper trails and message threads", "Keep the people, money and work around every property connected", "a shared source of truth", "Less chasing. More control.") rather than authored fresh.
- **Media paths belong in centralized product data, not the page shell.** `ProductPage.tsx` is the reusable product-agnostic shell, so hard-coding `/products/haoo/haoo-hero.png` there would have reintroduced the exact fact-duplication anti-pattern the research warns against. See Deviations.
- **Nested region for the rental journey.** The Wave 0 contract requires the `Rental journey` region to expose exactly the four step headings, so the section `h2` lives in the outer unnamed `<section>` and only the `<ol>` sits inside the nested `aria-label="Rental journey"` region.
- **Empty `alt` for the logo, subject `alt` for the photograph.** The logo renders indigo-on-transparent, so it sits on a white card for contrast, and the adjacent visible `HAOO` text already names the product. The photograph carries the brochure's own subject description.
- **Hero motion is a 200ms transform-only card hover** with `motion-reduce:transform-none motion-reduce:transition-none`; no reveal transition gates content or actions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Repaired the regressed plan counter in STATE.md**

- **Found during:** Close-out (state update)
- **Issue:** The interrupted prior session left `.planning/STATE.md` uncommitted with `Plan: 1 of 5` and `Status: Executing Phase 01`, regressed from the correct `Plan: 3 of 5`. Running `state.advance-plan` on the corrupted value produced `Plan: 2 of 5` instead of `Plan: 4 of 5`.
- **Fix:** Set the counter to `Plan: 4 of 5` and restored `Status: Ready to execute` after the tool ran.
- **Files modified:** `.planning/STATE.md`
- **Verification:** `01-01`, `01-02`, and `01-03` summaries exist on disk; the next plan without a summary is `01-04`.
- **Committed in:** plan metadata commit

**2. [Rule 1 - Bug] Hardened a vacuously-passing RED test**

- **Found during:** Task 2 (RED)
- **Issue:** The new capability/journey description test iterated `HAOO_PRODUCT.capabilities` and `HAOO_PRODUCT.journey`, which were still empty arrays, so its loops executed zero assertions and the test passed before any implementation existed — a false RED that would never have failed.
- **Fix:** Added explicit `toHaveLength(6)` and `toHaveLength(4)` guards before the loops, then re-confirmed a genuine failure.
- **Files modified:** `src/test/haoo-page.test.tsx`
- **Verification:** Test failed on the length guard pre-implementation and passes post-implementation.
- **Committed in:** `3838f80`

### Design Deviations

**3. [Rule 4-adjacent - documented, not blocking] Hero media path centralized in `haoo.ts` rather than literal in `ProductPage.tsx`**

- **Found during:** Task 3
- **Plan expectation:** the plan's `key_links` records `src/pages/ProductPage.tsx` → `public/products/haoo/haoo-hero.png` with the literal pattern `/products/haoo/haoo-hero.png`, and Task 3's `<files>` list omits `src/products/haoo.ts`.
- **What shipped:** the path lives in `HAOO_PRODUCT.media.hero.href`, and `ProductPage.tsx` references `product.media.hero.href`. The link is satisfied transitively (`ProductPage.tsx` → `haoo.ts` → the asset).
- **Why:** `ProductPage` is the reusable shell that must present a future product without copying page structure (ROADMAP success criterion 5, and the research anti-pattern "duplicating HAOO facts"). Hard-coding a HAOO asset path into the shell would break that. Centralizing also made the required partial-media contract testable by omitting data instead of mocking a network failure.
- **Impact:** No requirement is weakened. A graph check that greps `ProductPage.tsx` for the literal asset path will not match and should follow the data reference instead.

---

**Total deviations:** 2 auto-fixed (2 bugs) + 1 documented design deviation
**Impact on plan:** Both auto-fixes were necessary for correctness — one repaired corrupted project state, the other repaired a test that could not fail. The design deviation preserves the reusable-shell requirement. No scope creep.

## Issues Encountered

- **Interrupted prior session left uncommitted work.** `src/test/haoo-content.test.ts` carried an uncommitted, never-verified RED test. Resolved by validating its capability and journey description strings character-for-character against `brochure.html` (all matched), extending it with the uncovered parts of Task 2's contract, confirming a genuine failure, and committing it as the RED gate.
- **Out-of-scope test failures remain RED by design.** 6 tests still fail: 4 in `products-section.test.tsx` (plan 01-04) and 2 brochure-PDF tests in `haoo-page.test.tsx` / `build-output.test.ts` (plan 01-05). These were deliberately not touched. Suite moved from 12 passed / 10 failed to 20 passed / 6 failed with no regression to any previously-passing test.

## Verification Results

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run build` | pass — `dist/products/haoo/index.html` + both assets emitted |
| `sha256sum` source vs `public/` vs `dist/` assets | identical (`ef318da3…`, `c08abdab…`) |
| `npx vitest run` | 20 passed / 6 failed — all 6 belong to plans 01-04 and 01-05 |

## Known Stubs

- `HAOO_PRODUCT.brochure` still holds placeholder values (`#brochure-pending`, `brochure-pending.pdf`, `PDF details pending`) and the `Brochure` section renders only its heading. This is intentional and scoped to plan **01-05**, which publishes the PDF and builds the preview/open/download panel. Plan 01-03 delivers only the brochure anchor location required by the fixed section order.

## Requirements Status

- **PROD-03** — Complete. The audiences, benefits, capabilities, and rental journey render as responsive semantic HTML derived from the brochure.
- **QUAL-06** — Not yet marked complete. It is a shared requirement: this plan proves page claims and contact fidelity, but plan 01-05 must still publish the brochure PDF and its onboarding URL facts. It will flip complete when 01-05 finishes.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Ready for **01-04** (home-page Products section): `ProductsSection.tsx` exists as a stub and its four contract tests are RED as designed.
- Ready for **01-05** (brochure panel): the `#brochure` section, its region label, and the `Brochure` navigation anchor are already in place and awaiting the PDF publication and panel implementation.
- Outstanding human checks carried into phase verification: keyboard/focus behavior at mobile and desktop widths, side-by-side brochure claim comparison, and the 320px/768px/1024px/200%-zoom crop and overflow inspection.

---
*Phase: 01-discover-haoo-and-choose-an-onboarding-path*
*Completed: 2026-08-29*

## Self-Check: PASSED

- All 9 key files verified present on disk.
- All 6 commits (`5c527d3`, `678458b`, `3838f80`, `3f19b92`, `ae821ef`, `8fb8f65`) verified in git history.
- Both binary assets verified tracked by git with source-identical SHA-256.
- Working tree clean except pre-existing untracked `.gsd/` and `.planning/milestone.lock`, which are outside this plan's scope.
