---
phase: 03-build-privacy-bounded-engagement-context
plan: 02
subsystem: measurement
tags: [typescript, vitest, privacy, local-storage, state-machine]

requires:
  - phase: 03-build-privacy-bounded-engagement-context
    plan: 01
    provides: Product-generic name-only measurement facade and bounded tracer context
provides:
  - Exhaustive ten-event runtime guard and idempotent five-flag reducer
  - Exact versioned browser-record validation with bounded visits, UTC ageing, and expiry
  - Whole-value campaign allowlisting with duplicate rejection and URL cleanup
  - Source, form-body, and production-bundle privacy boundary evidence
affects: [03-03, 03-04, phase-04-reporting]

actuals:
  tokens: 6573
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - Product definitions own the exhaustive event-to-context-flag map
    - Untrusted stored records are accepted only after exact-key and exact-domain validation
    - Campaign values are validated whole before an already-valid value is capped

key-files:
  created:
    - src/test/measurement.test.ts
  modified:
    - src/measurement/index.ts
    - src/products/types.ts
    - src/products/haoo.ts
    - src/test/product-shell-reuse.test.tsx
    - src/test/build-output.test.ts

key-decisions:
  - "Keep the generic reducer product-agnostic by adding a product-owned interactionEventFlags map instead of decoding HAOO event-name suffixes inside src/measurement/."
  - "Treat exactly 180 elapsed UTC days as retained context and rebuild fresh only when age is greater than 180 days."
  - "Export the exact context-key tuple and single-argument tracking arity as executable structural contracts for static boundary tests."

patterns-established:
  - "Exact schema means no coercion: ordinal strings and booleans are rejected rather than converted with Number()."
  - "Provider delivery and local-context reduction are independently failure-contained, so either channel may fail without blocking the visitor action."

requirements-completed: [MEAS-02, MEAS-03, MEAS-06, MEAS-07]

coverage:
  - id: D1
    description: All ten exact ASCII events are accepted as bare names, all other runtime values are rejected, and accepted interactions update only their disclosed idempotent flag.
    requirement: MEAS-02
    verification:
      - kind: unit
        ref: src/test/measurement.test.ts#closed event-name contract and disclosed idempotent interaction reducer
        status: pass
    human_judgment: false
  - id: D2
    description: The exact local record crosses visit bands at 1/2/4, saturates at four, derives UTC date bands, and expires after 180 days without identifiers or ordered history.
    requirement: MEAS-03
    verification:
      - kind: unit
        ref: src/test/measurement.test.ts#exact stored schema and bounded visit and time transitions
        status: pass
    human_judgment: false
  - id: D3
    description: Only unique source, medium, and campaign values matching the complete canonical character allowlist enter page memory before URL cleanup.
    requirement: MEAS-06
    verification:
      - kind: unit
        ref: src/test/measurement.test.ts#campaign whole-value allowlist
        status: pass
    human_judgment: false
  - id: D4
    description: Storage, history, and provider failures remain contained while local derivation metadata stays absent from analytics and qualification payload shapes.
    requirement: MEAS-07
    verification:
      - kind: integration
        ref: src/test/build-output.test.ts#pins the local record and bare tracking call to finite structural shapes
        status: pass
      - kind: integration
        ref: npm test (244 tests)
        status: pass
    human_judgment: false

duration: 8 min
completed: 2026-08-31
status: complete
---

# Phase 3 Plan 2: Bounded Measurement State Machine Summary

**An exact, mutation-resistant browser state machine now turns ten bare engagement events into five disclosed flags while keeping campaign, identity, click history, and form values out of provider and lead payloads.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-31T06:31:12Z
- **Completed:** 2026-08-31T06:39:34Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added 76 exhaustive unit contracts for event acceptance, exact stored schema, visit/date transitions, expiry, campaign normalization, mutation resistance, browser failures, and truthful clearing.
- Completed the product-generic reducer so accepted interactions set only one of five product-configured, idempotent context flags; page view and qualification submit add no history record.
- Added source, qualification-body, and fresh production-bundle gates proving that local derivation metadata cannot become analytics properties, identity, retries, queues, or lead context.

## Task Commits

Each task was committed through its RED/GREEN TDD gates:

1. **Task 1 RED: Specify bounded measurement state machine** — `c402914` (`test`)
2. **Task 1 GREEN: Complete bounded measurement state machine** — `b7df6a5` (`feat`)
3. **Task 2 RED: Add failing payload boundary contracts** — `41fbf2b` (`test`)
4. **Task 2 GREEN: Enforce name-only payload boundary** — `56fa9ce` (`feat`)

## Files Created/Modified

- `src/test/measurement.test.ts` — Exhaustive finite event, schema, reducer, campaign, expiry, failure, clear, and mutation contracts.
- `src/measurement/index.ts` — Exact schema guard, deterministic bounded transitions, product-configured flag reducer, and exported structural contracts.
- `src/products/types.ts` — Product-generic event-to-interaction-flag configuration type.
- `src/products/haoo.ts` — Exhaustive HAOO interaction-event mapping to the five disclosed flags.
- `src/test/product-shell-reuse.test.tsx` — Synthetic product fixture updated for the generic measurement contract.
- `src/test/build-output.test.ts` — Local-record, tracking-arity, qualification-body, and built-bundle privacy assertions.

## Decisions Made

- Product data owns event-to-flag semantics. The generic facade does not infer meaning from HAOO string suffixes.
- Expiry is inclusive at day 180 and rebuilds on day 181, using injected UTC day values for timezone-independent tests.
- Context keys and tracking arity are exported as readonly structural contracts so static tests verify the same definitions production uses.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added product-owned interaction mapping**
- **Found during:** Task 1 GREEN
- **Issue:** The existing product contract listed interaction flags but did not say which of the ten events sets each flag. Implementing the reducer only in `src/measurement/index.ts` would have required HAOO-specific string knowledge in the product-generic boundary.
- **Fix:** Added `interactionEventFlags` to `ProductMeasurement`, configured the exhaustive HAOO map, and updated the reusable synthetic-product fixture.
- **Files modified:** `src/products/types.ts`, `src/products/haoo.ts`, `src/test/product-shell-reuse.test.tsx`
- **Verification:** Focused reducer tests, product-shell reuse tests, typecheck, and the full 244-test suite pass.
- **Committed in:** `b7df6a5`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** The additional product-contract files preserve D-04 product genericity and introduce no new runtime capability or dependency.

## Issues Encountered

- The first lint pass caught one unused destructuring binding in the new schema table; it was replaced with a key-filter expression and lint then completed with only five pre-existing Fast Refresh warnings in `QualifyForm.tsx`.
- The production-bundle adjacency probe was narrowed before its RED commit because minification legitimately places the closed event tuple near form-copy strings; source call-shape and runtime payload tests provide the non-vacuous property-channel proof without that false positive.

## Verification Evidence

- `npm run test:unit -- src/test/measurement.test.ts && npm run typecheck` — passed (76 tests; zero type errors).
- `npm run build && npm run test:unit -- src/test/measurement.test.ts src/test/build-output.test.ts && npm run lint` — passed (99 tests; zero lint errors, five pre-existing warnings).
- `npm test` — passed against a fresh build (10 files, 244 tests).
- `git diff --check` — passed.

## User Setup Required

None - no package, provider, secret, or external service was added.

## Next Phase Readiness

- Plan 03-03 can instrument brochure, qualification, assisted-contact, and self-onboarding controls through the now-complete name-only reducer.
- Plan 03-04 can consume the truthful boolean clear result and the exact five-flag context for disclosure UI.
- Privacy/legal ownership approval remains a milestone-level production blocker; this plan does not claim legal approval.

## Self-Check: PASSED

- All six created or modified files exist.
- All four task commits exist in git history.
- Fresh production build, focused contracts, full 244-test regression suite, typecheck, lint, and diff checks passed.
- No stubs, skipped tests, unrun verification steps, new network endpoints, auth paths, file-access boundaries, or schema trust surfaces beyond the planned versioned local record were introduced.

---
*Phase: 03-build-privacy-bounded-engagement-context*
*Completed: 2026-08-31*
