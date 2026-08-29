---
phase: 01-discover-haoo-and-choose-an-onboarding-path
plan: 01
subsystem: testing
tags: [vitest, jsdom, testing-library, react, tdd, contract-tests]

requires: []
provides:
  - Exact-pinned Vite 5-compatible Vitest and Testing Library harness
  - Compile-safe typed HAOO product and page contract surfaces
  - Discriminated expected-red suites for discovery, content, page, and build behavior
affects: [01-02, 01-03, 01-04, 01-05, phase-1-verification]

actuals:
  tokens: 20324
  tasks: 3
  commits: 4

tech-stack:
  added: [vitest@3.2.4, jsdom@26.1.0, '@testing-library/react@16.3.2', '@testing-library/dom@10.4.1']
  patterns: [semantic role-based component contracts, fail-closed expected-red discriminator, centralized readonly product definition]

key-files:
  created:
    - vitest.config.ts
    - scripts/assert-phase1-red.mjs
    - src/test/setup.ts
    - src/test/products-section.test.tsx
    - src/test/haoo-page.test.tsx
    - src/test/haoo-content.test.ts
    - src/test/build-output.test.ts
    - src/products/types.ts
    - src/products/haoo.ts
    - src/components/ProductsSection.tsx
    - src/pages/ProductPage.tsx
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Use only the four human-approved exact development releases and preserve the existing React 18/Vite 5 runtime stack."
  - "Expected RED is successful only when every suite emits its named behavior failure and no known import, transform, configuration, syntax, collection, or module-resolution signature appears."

patterns-established:
  - "ProductDefinition: readonly centralized product facts feed reusable collection and page shells."
  - "Expected-red gate: infrastructure failures are rejected before behavior-level RED can be accepted."

requirements-completed: [QUAL-04, QUAL-06]

coverage:
  - id: D1
    description: "Exact-pinned Vitest, jsdom, and Testing Library harness runs through the project npm command."
    verification:
      - kind: integration
        ref: "npm test -- --run --passWithNoTests && npm run typecheck && npm ls vitest jsdom @testing-library/react @testing-library/dom"
        status: pass
    human_judgment: false
  - id: D2
    description: "Four Phase 1 suites define discovery, semantic page, source-fidelity, native-action, metadata, route, asset, and checksum contracts."
    requirement: QUAL-06
    verification:
      - kind: unit
        ref: "npm run test:phase1:red"
        status: pass
    human_judgment: false
  - id: D3
    description: "The expected-red discriminator proves direct-route and built-artifact contracts are present before implementation."
    requirement: QUAL-04
    verification:
      - kind: integration
        ref: "src/test/build-output.test.ts#[phase1-red:build] emits a physical nested HAOO document"
        status: pass
      - kind: integration
        ref: "scripts/assert-phase1-red.mjs"
        status: pass
    human_judgment: false

duration: 10 min
completed: 2026-08-29
status: complete
---

# Phase 1 Plan 01: Wave 0 Validation Contract Summary

**Exact-pinned Vitest/Testing Library infrastructure with compile-safe HAOO stubs and a fail-closed RED contract gate spanning all Phase 1 behavior.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-08-29T09:23:15Z
- **Completed:** 2026-08-29T09:32:50Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- Installed only the four approved exact development releases and configured explicit jsdom cleanup without Vitest globals.
- Added 20 named semantic/source/build contract tests covering the complete Phase 1 target surface.
- Added a discriminator that accepts the intentional non-zero suite result only when all four named behavior markers appear and infrastructure-failure signatures are absent.

## Task Commits

Each task was committed atomically:

1. **Task 1: Confirm the two package-legitimacy exceptions** - `17b0341` (chore)
2. **Task 2: Install and configure the exact Wave 0 test stack** - `38528df` (chore)
3. **Task 3: Author the Phase 1 contract suites before production implementation** - `9ce023b` (test)

**Plan metadata:** committed with this summary.

## Files Created/Modified

- `package.json` / `package-lock.json` - exact dev pins plus `test` and `test:phase1:red` commands.
- `vitest.config.ts` / `src/test/setup.ts` - React-aware jsdom execution with explicit cleanup and no globals.
- `scripts/assert-phase1-red.mjs` - expected-red status, marker, and infrastructure-signature checks.
- `src/test/products-section.test.tsx` - zero/one/many discovery and resilient media contracts.
- `src/test/haoo-page.test.tsx` - semantic story, navigation, onboarding, brochure, and accessibility contracts.
- `src/test/haoo-content.test.ts` - canonical facts, brand casing, contact destinations, and WhatsApp encoding contracts.
- `src/test/build-output.test.ts` - physical route, metadata, emitted assets, PDF path, and SHA-256 contracts.
- `src/products/types.ts` / `src/products/haoo.ts` - readonly centralized product contract and intentionally incomplete HAOO datum.
- `src/components/ProductsSection.tsx` / `src/pages/ProductPage.tsx` - compile-safe landmarks that allow behavior-level RED collection.

## Decisions Made

- Preserved React 18, Vite 5, Tailwind, Lucide, and all existing runtime dependencies while adding only the four approved test packages.
- Kept Wave 0 production surfaces intentionally incomplete so subsequent plans must turn the named contracts green rather than inheriting accidental implementation.
- Made React transformation part of the test configuration and added `React is not defined` to the rejected signatures after the first real run exposed that false-positive path.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Hardened TSX transformation and RED discrimination**
- **Found during:** Task 3 (Author the Phase 1 contract suites before production implementation)
- **Issue:** The first collected TSX suites failed with `React is not defined`, but the initial discriminator did not classify that as infrastructure failure.
- **Fix:** Applied the existing `@vitejs/plugin-react` transform in `vitest.config.ts` and added the signature to the forbidden infrastructure list.
- **Files modified:** `vitest.config.ts`, `scripts/assert-phase1-red.mjs`
- **Verification:** `npm run typecheck && npm run test:phase1:red` now reports named behavior failures from all four suites with no transform/import/configuration failure.
- **Committed in:** `9ce023b`

---

**Total deviations:** 1 auto-fixed (1 blocking issue)
**Impact on plan:** The fix is required for the gate's core correctness and adds no runtime dependency or Phase 1 behavior.

## Issues Encountered

- The managed filesystem sandbox denied the discriminator's nested local npm process with `EPERM`; rerunning the identical verification with local process permission produced the required assertion-level RED evidence.
- A read-only `npm audit --omit=dev` found pre-existing `ws@8.18.3` advisories in the runtime dependency graph. The version predates this plan and is recorded in `deferred-items.md`; no runtime dependency was changed.

## Known Stubs

| File | Line | Intentional stub | Resolution |
|------|------|------------------|------------|
| `src/products/haoo.ts` | 10 | Typed placeholder facts, links, and empty story collections keep tests collectable without implementing acceptance behavior. | Plans 01-02 and 01-03 populate the canonical datum; Plans 01-04 and 01-05 add collection/media fields. |
| `src/components/ProductsSection.tsx` | 10 | Placeholder Products landmark intentionally fails zero/one/many and featured-card contracts. | Plan 01-04 implements the reusable collection. |
| `src/pages/ProductPage.tsx` | 10 | Placeholder page landmarks intentionally fail semantic story, onboarding, and brochure contracts. | Plans 01-02, 01-03, and 01-05 implement the page shell and progressive brochure. |

These stubs are the planned Wave 0 RED state and do not prevent this validation-foundation plan from achieving its goal.

## Authentication Gates

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 01-02 can implement the home-to-product-to-onboarding tracer against collected semantic contracts.
- Plans 01-03 through 01-05 have named expansion targets for content, discovery, brochure resilience, metadata, and build output.
- No production Phase 1 acceptance behavior is claimed green by this Wave 0 plan.

## Self-Check: PASSED

- All 13 task files exist.
- Task commits `17b0341`, `38528df`, and `9ce023b` exist in git history.
- `npm run lint` and `npm run typecheck` pass.
- `npm run test:phase1:red` confirms named behavior-level RED in all four suites and exits successfully.
- Exact package resolution matches the four approved pins.

---
*Phase: 01-discover-haoo-and-choose-an-onboarding-path*
*Completed: 2026-08-29*
