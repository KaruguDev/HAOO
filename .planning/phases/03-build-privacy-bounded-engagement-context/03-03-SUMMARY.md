---
phase: 03-build-privacy-bounded-engagement-context
plan: 03
subsystem: measurement-ui
tags: [react, typescript, vitest, privacy, instrumentation]

requires:
  - phase: 03-build-privacy-bounded-engagement-context
    plan: 02
    provides: Closed ten-event vocabulary and bounded interaction reducer
provides:
  - Deduplicated brochure availability plus per-activation brochure action signals
  - Per-activation assisted-contact and self-onboarding signals at every placement
  - One-shot qualification start and validation-admitted bare submit signals
affects: [03-04, phase-04-reporting]

actuals:
  tokens: 7733
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - Product data names semantic measurement events while reusable components receive typed name-only tracking seams
    - Observation events use per-instance refs while deliberate outbound actions remain per activation

key-files:
  created: []
  modified:
    - src/components/BrochurePanel.tsx
    - src/components/OnboardingChoices.tsx
    - src/components/QualifyForm.tsx
    - src/pages/ProductPage.tsx
    - src/products/types.ts
    - src/products/haoo.ts
    - src/test/measurement-page.test.tsx
    - src/test/qualify-form.test.tsx
    - src/test/product-shell-reuse.test.tsx

key-decisions:
  - "Add a product-owned semantic interactionEvents map so reusable components can request exact signals without containing HAOO literals or inferring meaning from tuple order."
  - "Build the qualification request body before emitting qualify_submit, then emit immediately before fetch so serialization failures cannot be counted as network attempts."

patterns-established:
  - "One-shot observations: set the per-instance ref before calling measurement so even a failing provider cannot cause repeat emission."
  - "Native intent instrumentation: attach named click handlers without preventDefault and preserve every anchor attribute byte-for-byte."

requirements-completed: [MEAS-02, MEAS-03, MEAS-07]

coverage:
  - id: D1
    description: The first successful responsive brochure preview is counted once while every Open and Download activation emits one bare event without changing recovery or destinations.
    requirement: MEAS-02
    verification:
      - kind: integration
        ref: src/test/measurement-page.test.tsx#measures brochure availability once and every deliberate brochure action
        status: pass
    human_judgment: false
  - id: D2
    description: WhatsApp, phone, email, and self-onboarding activations emit exact bare events across all three native onboarding placements.
    requirement: MEAS-03
    verification:
      - kind: integration
        ref: src/test/measurement-page.test.tsx#measures every assisted and self-onboarding activation at all three placements
        status: pass
    human_judgment: false
  - id: D3
    description: Qualification start is one-shot and submit is emitted without form data only after validation and concurrency admission, with failure-independent form behavior.
    requirement: MEAS-07
    verification:
      - kind: integration
        ref: src/test/measurement-page.test.tsx#measures qualification start once and only validation-admitted submit attempts
        status: pass
      - kind: integration
        ref: npm test (250 tests)
        status: pass
    human_judgment: false

duration: 12 min
completed: 2026-08-31
status: complete
---

# Phase 3 Plan 3: Complete Journey Instrumentation Summary

**All ten HAOO engagement meanings now reach the product-generic name-only measurement seam with observation/per-activation cardinality and no coupling to native journey behavior.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-31T06:44:32Z
- **Completed:** 2026-08-31T06:56:01Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Deduplicated mobile-image and desktop-object brochure availability through one component ref while keeping Open and Download independently measurable per activation.
- Instrumented WhatsApp, phone, email, and self-onboarding across opening, mid-page, and closing placements without changing native anchors or product-generic rendering.
- Recorded qualification start once and each validation-admitted network attempt as a bare name while retaining Phase 2 validation, concurrency, recovery, and retry behavior under provider failure.

## Task Commits

Each task was committed through RED and GREEN TDD gates:

1. **Task 1 RED: Specify brochure measurement** — `0a68c88` (`test`)
2. **Task 1 GREEN: Measure brochure engagement** — `9d9c50e` (`feat`)
3. **Task 2 RED: Specify onboarding measurement** — `772250a` (`test`)
4. **Task 2 GREEN: Measure onboarding intent** — `47b8bdf` (`feat`)
5. **Task 3 RED: Specify qualification measurement** — `3a0d939` (`test`)
6. **Task 3 GREEN: Measure qualification intent** — `46553b2` (`feat`)

## Files Created/Modified

- `src/components/BrochurePanel.tsx` — Shared preview guard and named Open/Download tracking handlers.
- `src/components/OnboardingChoices.tsx` — Product-configured per-activation assisted and self-service handlers.
- `src/components/QualifyForm.tsx` — One-shot first-interaction seam and validation-admitted submit seam.
- `src/pages/ProductPage.tsx` — Passes the single measurement instance and product-owned semantic event names to reusable components.
- `src/products/types.ts` — Readonly product-generic semantic interaction-event contract.
- `src/products/haoo.ts` — Exact HAOO event literals mapped to semantic component actions.
- `src/test/measurement-page.test.tsx` — End-to-end cardinality, arity, destination, and failure-isolation contracts.
- `src/test/qualify-form.test.tsx` — Direct reusable-form fixtures updated for the required measurement seam.
- `src/test/product-shell-reuse.test.tsx` — Synthetic product fixture updated for the semantic event contract.

## Decisions Made

- Product configuration owns semantic event names. Components neither contain HAOO literals nor derive meaning from event suffixes or tuple positions.
- `qualify_submit` is placed after request-body construction and immediately before `fetch`; validation, concurrency, and serialization must all admit a real attempt first.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added product-owned semantic event configuration**
- **Found during:** Task 1 GREEN
- **Issue:** The existing product contract supplied a tuple and flag reducer map but no generic way for components to select brochure, onboarding, and qualification event meanings. Hardcoding HAOO literals in components would violate D-04; inferring from suffixes or tuple positions would be fragile.
- **Fix:** Added a readonly `interactionEvents` semantic map to product data and routed it through `ProductPage` to the reusable components.
- **Files modified:** `src/products/types.ts`, `src/products/haoo.ts`, `src/pages/ProductPage.tsx`, `src/test/product-shell-reuse.test.tsx`
- **Verification:** Typecheck, product-shell reuse tests, static privacy boundary, and full 250-test suite pass.
- **Committed in:** `9d9c50e`

---

**Total deviations:** 1 auto-fixed (1 Rule 2).
**Impact on plan:** The added configuration preserves the locked product-generic boundary and introduces no new runtime capability, dependency, event property, or visitor data.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification

- `npm run test:unit -- src/test/measurement-page.test.tsx src/test/qualify-form.test.tsx src/test/haoo-page.test.tsx` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed with the five pre-existing Fast Refresh warnings in `QualifyForm.tsx` and no errors.
- `npm test` — passed: 10 files, 250 tests, fresh production build.

## Known Stubs

None. Empty form defaults and placeholder `<option>` values found by the scan are intentional validation state, not incomplete UI or data wiring.

## Next Phase Readiness

- Plan 03-04 can bind the exhaustive public disclosure and clear control to the same product measurement contract.
- Privacy/legal ownership approval remains a milestone blocker; this plan makes no legal-compliance claim.

## Self-Check: PASSED

- All nine modified source/test files exist.
- All six RED/GREEN task commits exist.
- Plan-level verification and the full production suite pass.

---
*Phase: 03-build-privacy-bounded-engagement-context*
*Completed: 2026-08-31*
