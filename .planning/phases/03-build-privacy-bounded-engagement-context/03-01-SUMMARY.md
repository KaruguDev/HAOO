---
phase: 03-build-privacy-bounded-engagement-context
plan: 01
subsystem: measurement
tags: [react, typescript, vitest, privacy, local-storage, vite]

requires:
  - phase: 01-discover-haoo-and-choose-an-onboarding-path
    provides: Product-generic HAOO page composition and native journey destinations
  - phase: 02-submit-a-qualified-haoo-enquiry
    provides: Per-file source capability boundary and qualification form
provides:
  - Product-generic, name-only measurement facade with an inert provider sink
  - Bounded versioned HAOO engagement context and page-memory campaign capture
  - StrictMode-safe one-shot HAOO page-view tracer
  - Static source and production-bundle privacy capability enforcement
affects: [03-02, 03-03, 03-04, phase-04-reporting]

actuals:
  tokens: 6350
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - Product data supplies a closed event vocabulary to a product-generic facade
    - Browser measurement failures degrade to bounded memory or no-op behavior
    - Static per-file grants keep browser capabilities confined to one audited module

key-files:
  created:
    - src/measurement/index.ts
    - src/test/measurement-page.test.tsx
  modified:
    - src/products/types.ts
    - src/products/haoo.ts
    - src/pages/ProductPage.tsx
    - src/test/product-shell-reuse.test.tsx
    - src/test/build-output.test.ts
    - README.md

key-decisions:
  - "Keep the public tracking API event-name-only and derive its accepted literals from each product's readonly configuration."
  - "Grant storage and ambient URL access only to src/measurement/index.ts while retaining injection, network, provider, router, backend, identity, payload, queue, and clickstream prohibitions."
  - "Treat VITE_HAOO_MEASUREMENT_PROVIDER as public finite build data whose only current outcome is the inert none sink."

patterns-established:
  - "Fail closed for measurement data, fail open for the journey: reject malformed context/campaign/event input without changing native destinations."
  - "One-shot page observations use a page-instance guard so React StrictMode cannot double-count them."
  - "Capability grants are expressed per source file and tested both in source and in a fresh production bundle."

requirements-completed: [MEAS-02, MEAS-03, MEAS-06, MEAS-07]

coverage:
  - id: D1
    description: A HAOO page load emits exactly one bare allowlisted page-view observation through the product-generic seam under StrictMode.
    requirement: MEAS-02
    verification:
      - kind: integration
        ref: src/test/measurement-page.test.tsx#traces one privacy-bounded HAOO page view
        status: pass
    human_judgment: false
  - id: D2
    description: Browser context contains only a versioned bounded record, while accepted campaign values remain in page memory and are removed from the URL.
    requirement: MEAS-03
    verification:
      - kind: integration
        ref: src/test/measurement-page.test.tsx#traces one privacy-bounded HAOO page view
        status: pass
    human_judgment: false
  - id: D3
    description: The unset provider build contains no analytics SDK, identity, event-property, queue, or clickstream delivery seam.
    requirement: MEAS-06
    verification:
      - kind: unit
        ref: src/test/build-output.test.ts#ships the unset provider bundle without identity property queue or SDK seams
        status: pass
    human_judgment: false
  - id: D4
    description: Storage and History API failures leave the brochure, form, assisted-contact, and self-onboarding journeys usable.
    requirement: MEAS-07
    verification:
      - kind: integration
        ref: src/test/measurement-page.test.tsx#keeps the journey usable when browser measurement APIs throw
        status: pass
    human_judgment: false

duration: 8h 4m
completed: 2026-08-31
status: complete
---

# Phase 3 Plan 1: Privacy-Bounded Page Measurement Summary

**A StrictMode-safe HAOO page-view tracer now records only bounded disclosed browser context through a name-only, no-provider measurement seam that cannot block the visitor journey.**

## Performance

- **Duration:** 8h 4m, including the human tracer checkpoint
- **Started:** 2026-08-30T22:22:02Z
- **Completed:** 2026-08-31T06:25:53Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Wired one production HAOO page view from product configuration through `ProductPage` and runtime event validation to an inert provider sink.
- Added bounded, versioned browser context plus strict campaign allowlisting and fail-open storage/history behavior without identifiers or an ordered event history.
- Enforced the browser-capability seam statically and documented the public no-op provider selector without implying that reporting already exists.

## Task Commits

Each task was committed atomically with its TDD evidence:

1. **Task 1 RED: Prove one HAOO page view through every measurement layer** — `3d89a15` (`test`)
2. **Task 1 GREEN: Wire privacy-bounded page measurement** — `53c3a5d` (`feat`)
3. **Task 2 RED: Add failing measurement capability boundary** — `a7680e9` (`test`)
4. **Task 2 GREEN: Enforce and document the measurement capability boundary** — `dd64573` (`test`)

## Files Created/Modified

- `src/measurement/index.ts` — Generic event validation, bounded context lifecycle, campaign parsing, wrapped browser adapters, and inert event sink.
- `src/products/types.ts` — Readonly product measurement configuration contract.
- `src/products/haoo.ts` — HAOO event tuple, derived event type, storage schema configuration, and finite provider resolver.
- `src/pages/ProductPage.tsx` — One-shot measurement initialization and page-view observation.
- `src/test/measurement-page.test.tsx` — StrictMode tracer, invalid-event, campaign, and blocked-browser integration evidence.
- `src/test/product-shell-reuse.test.tsx` — Generic product fixture updated for the required measurement contract.
- `src/test/build-output.test.ts` — Per-file facade grant and built-bundle privacy assertions.
- `README.md` — Public selector and current no-provider behavior documentation.

## Decisions Made

- Kept event delivery name-only. The typed API has no property argument, and runtime validation uses exact membership in the configured ASCII literal tuple.
- Confined storage and URL capabilities to the generic facade. Product data, page components, and qualification components retain their inherited static prohibitions.
- Documented live aggregate reporting and qualification-email enrichment as Phase 4 work; Phase 3 does not imply provider delivery.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated the reusable product fixture for the required measurement contract**
- **Found during:** Task 1 (Prove one HAOO page view through every measurement layer)
- **Issue:** Making `ProductDefinition.measurement` required caused the generic product-shell fixture to no longer satisfy the product contract.
- **Fix:** Added a minimal generic measurement configuration to the fixture without introducing HAOO literals into the reusable shell.
- **Files modified:** `src/test/product-shell-reuse.test.tsx`
- **Verification:** Typecheck and the focused measurement tracer passed.
- **Committed in:** `53c3a5d`

**2. [Rule 1 - Bug] Narrowed the property-channel static regex to one function signature line**
- **Found during:** Task 2 GREEN verification
- **Issue:** The first multiline regex crossed unrelated declarations and falsely matched the two-argument `createMeasurement` factory rather than only multi-argument tracking calls.
- **Fix:** Excluded newlines from the argument scan and updated the inherited-boundary assertion to recognize the single audited facade exception.
- **Files modified:** `src/test/build-output.test.ts`
- **Verification:** Fresh build and all 20 build-output tests passed.
- **Committed in:** `dd64573`

---

**Total deviations:** 2 auto-fixed (1 blocking compatibility issue, 1 test bug)
**Impact on plan:** Both changes were required to keep the new contract compilable and the static privacy guard precise; neither expanded production scope.

## Issues Encountered

- `npm run lint` passes with five pre-existing `react-refresh/only-export-components` warnings in `src/components/QualifyForm.tsx`. The same out-of-scope Fast Refresh issue is already recorded in Phase 2's deferred-items ledger; this plan did not modify that file.

## User Setup Required

None - the only current provider outcome is the inert `none` sink, with no external account or SDK.

## Verification

- `npm run build` — passed against a fresh production bundle.
- `npm run test:unit -- src/test/measurement-page.test.tsx src/test/build-output.test.ts` — 24/24 tests passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed with five pre-existing warnings and no errors.
- Human tracer checkpoint — approved before Task 2 continued.

## Next Phase Readiness

- Plan 03-02 can extend the tested bounded context reducer without changing the public name-only measurement seam.
- Plans 03-03 and 03-04 can instrument additional bare events and expose the approved disclosure/clear controls through the same facade.
- The existing privacy/legal production-collection approval blocker remains unchanged.

## Known Stubs

None. The inert provider is the deliberate Phase 3 production behavior, not an unfinished implementation path; Phase 4 owns any audited aggregate reporting provider.

## Threat Surface Review

- No network endpoint, authentication path, backend, new dependency, or schema outside the plan's threat model was introduced.
- URL query and mutable storage inputs are validated and browser/provider exceptions remain contained at the measurement seam.

## Self-Check: PASSED

- All eight key files exist.
- Commits `3d89a15`, `53c3a5d`, `a7680e9`, and `dd64573` exist.
- Fresh-build integration, bundle-boundary, typecheck, and lint verification completed successfully.

---
*Phase: 03-build-privacy-bounded-engagement-context*
*Completed: 2026-08-31*
