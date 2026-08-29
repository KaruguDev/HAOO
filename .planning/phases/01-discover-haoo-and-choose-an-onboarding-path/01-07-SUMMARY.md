---
phase: 01-discover-haoo-and-choose-an-onboarding-path
plan: 07
subsystem: ui
tags: [react, accessibility, product-shell, vitest]
requires:
  - phase: 01-06
    provides: keyboard focus contrast and Products anchor fixes
provides:
  - ProductDefinition-driven product identity copy and DOM ids
  - Executable second-product reuse contract for ProductPage
  - Static source boundary preventing product-name literals in the generic shell
affects: [product-pages, onboarding, brochure, accessibility]
actuals:
  tokens: 5500
  tasks: 3
  commits: 3
tech-stack:
  added: []
  patterns: [pure copy builders, fail-closed product identity, TypeScript scanner source gates]
key-files:
  created: [src/products/copy.ts, src/test/product-shell-reuse.test.tsx]
  modified: [src/pages/ProductPage.tsx, src/components/ProductHeader.tsx, src/components/OnboardingChoices.tsx, src/components/BrochurePanel.tsx, src/test/build-output.test.ts]
key-decisions:
  - "ProductDefinition.name and ProductDefinition.slug are the sole product-identity inputs to the generic page shell."
  - "Comment-aware source enforcement uses the TypeScript scanner so comments are ignored without hiding executable string literals."
patterns-established:
  - "Product copy builders preserve fixed parent-brand casing while deriving product identity from data."
  - "Empty product names and slugs fail closed instead of rendering a silent fallback."
requirements-completed: [PROD-06, PROD-03, QUAL-06]
coverage:
  - id: D1
    description: ProductPage renders a synthetic second product with product-derived copy and ids
    requirement: PROD-06
    verification:
      - kind: integration
        ref: src/test/product-shell-reuse.test.tsx#renders a synthetic product through every product-named shell surface
        status: pass
    human_judgment: false
  - id: D2
    description: HAOO copy and behavior remain byte-identical under the generic-shell refactor
    requirement: QUAL-06
    verification:
      - kind: integration
        ref: npx vitest run
        status: pass
    human_judgment: true
    rationale: Real-browser visual and textual indistinguishability remains an end-of-phase UAT backstop.
  - id: D3
    description: Product-generic executable sources reject reintroduced product-name literals and retain the static boundary
    requirement: PROD-06
    verification:
      - kind: unit
        ref: src/test/product-shell-reuse.test.tsx#rejects product-name literals in product-generic executable source
        status: pass
      - kind: unit
        ref: src/test/build-output.test.ts#keeps the Phase 1 product surface free of tracking, storage, injection, and backend seams
        status: pass
    human_judgment: false
duration: 4 min
completed: 2026-08-29
status: complete
---

# Phase 01 Plan 07: Reusable Product Shell Summary

**ProductDefinition-driven copy and identifiers now render a tested second product without changing HAOO's shipped experience**

## Performance

- **Duration:** 4 min
- **Started:** 2026-08-29T19:18:29Z
- **Completed:** 2026-08-29T19:22:24Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Centralized every product-named shell string and shell-owned DOM id behind guarded pure builders.
- Proved ProductPage reuse with a fully synthetic ZENITH definition and a registry-wide invariant.
- Added comment-aware source enforcement and registered the copy module in the static product boundary.

## Task Commits

1. **Task 1: Add product-name copy module and failing reuse contract** - `6bd9746` (test)
2. **Task 2: Rewire product-generic shell to ProductDefinition** - `414a94a` (feat)
3. **Task 3: Gate shell literals and register new source** - `412fc03` (test)

## Files Created/Modified

- `src/products/copy.ts` - Guarded copy and DOM-id builders.
- `src/test/product-shell-reuse.test.tsx` - Synthetic-product, registry, identity, and source-boundary contracts.
- `src/pages/ProductPage.tsx` - Product-derived skip target, brochure lead, and footer relationship.
- `src/components/ProductHeader.tsx` - Product-derived navigation names and menu id.
- `src/components/OnboardingChoices.tsx` - Product-derived onboarding action copy.
- `src/components/BrochurePanel.tsx` - Product-derived brochure fallback copy.
- `src/test/build-output.test.ts` - Copy module registered in PRODUCT_SOURCES.

## Decisions Made

- Kept ZERO-PAPER HUB fixed inside the relationship builder so product data cannot override brand spelling or casing.
- Used TypeScript token scanning for the no-literal test, preserving executable string content while removing comments.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The generic shell is ready for Plan 01-08's build-artifact freshness gate. Real-browser visual parity remains recorded for end-of-phase UAT.

## Self-Check: PASSED

- All 58 tests pass.
- Typecheck, lint, and production build pass.
- All created files exist and all three task commits are present.

---
*Phase: 01-discover-haoo-and-choose-an-onboarding-path*
*Completed: 2026-08-29*
