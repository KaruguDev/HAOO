---
phase: 01-discover-haoo-and-choose-an-onboarding-path
plan: 08
subsystem: testing
tags: [vitest, vite, build-artifacts, npm-scripts]
requires:
  - phase: 01-07
    provides: reusable product shell and expanded product contracts
provides:
  - Missing and stale dist artifact enforcement
  - Build-inclusive npm test contract
  - Fast test:unit inner-loop command
affects: [ci, release-validation, product-route, static-assets]
actuals:
  tokens: 2666
  tasks: 2
  commits: 2
tech-stack:
  added: []
  patterns: [mtime freshness contract, build-inclusive full suite, build-independent inner loop]
key-files:
  created: []
  modified: [src/test/build-output.test.ts, package.json, .planning/phases/01-discover-haoo-and-choose-an-onboarding-path/01-VALIDATION.md]
key-decisions:
  - "npm test owns production build creation; npm run test:unit remains the focused runner-only loop."
  - "Freshness compares exact millisecond mtimes with no tolerance or bypass."
patterns-established:
  - "Dist-dependent tests fail early with the missing or stale path and the remediation command."
requirements-completed: [QUAL-04, PROD-02, PROD-04, PROD-05]
coverage:
  - id: D1
    description: Missing or stale build outputs fail with actionable input and output paths
    requirement: QUAL-04
    verification:
      - kind: integration
        ref: src/test/build-output.test.ts#Phase 1 build artifact freshness
        status: pass
      - kind: other
        ref: rm -rf dist && npm run test:unit
        status: pass
    human_judgment: false
  - id: D2
    description: npm test builds the production artifact before running all contracts
    requirement: QUAL-04
    verification:
      - kind: integration
        ref: rm -rf dist && npm test
        status: pass
    human_judgment: false
  - id: D3
    description: Clean-checkout npm test succeeds after npm ci with no pre-existing dist
    requirement: QUAL-04
    verification: []
    human_judgment: true
    rationale: The clean-clone release gate remains owned by Phase 5 and requires an isolated checkout.
duration: 4 min
completed: 2026-08-29
status: complete
---

# Phase 01 Plan 08: Fresh Build Contract Summary

**The full test command now builds the artifact it asserts against, while a guarded runner-only loop preserves fast feedback**

## Performance

- **Duration:** 4 min
- **Started:** 2026-08-29T19:23:00Z
- **Completed:** 2026-08-29T19:26:48Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added a non-vacuous freshness contract covering Vite inputs and the emitted HTML/assets.
- Changed `npm test` to build before running all 61 tests and added `npm run test:unit` for focused work.
- Reconciled the phase validation record with the stronger command semantics.

## Task Commits

1. **Task 1: Add build-artifact freshness guard** - `3076e12` (test)
2. **Task 2: Make build an executed npm test precondition** - `fb81fab` (test)

## Files Created/Modified

- `src/test/build-output.test.ts` - Missing-output, non-empty-input, and freshness assertions.
- `package.json` - Build-inclusive test command and runner-only test:unit command.
- `.planning/phases/01-discover-haoo-and-choose-an-onboarding-path/01-VALIDATION.md` - Updated sampling and per-task command contract.

## Decisions Made

- Compared raw `mtimeMs` with `>=` and no tolerance so same-millisecond builds pass without admitting stale artifacts.
- Excluded `src/test/` from build inputs because Vite does not consume test sources.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Build evidence is trustworthy for Plan 01-09's progressive-enhancement decision. Phase 5 still owns the isolated clean-checkout release gate and CR-02.

## Self-Check: PASSED

- `npm test` builds and passes all 61 tests on successive runs.
- `npm run test:unit` passes after a build and fails with the expected guard when `dist/` is absent.
- Typecheck and lint pass; no dependencies or deferred RED script changed.

---
*Phase: 01-discover-haoo-and-choose-an-onboarding-path*
*Completed: 2026-08-29*
