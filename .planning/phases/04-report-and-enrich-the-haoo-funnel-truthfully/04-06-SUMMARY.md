---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
plan: 06
subsystem: measurement
tags: [plausible, analytics, preload, coverage-audit, privacy, mvp]

requires:
  - phase: 04-report-and-enrich-the-haoo-funnel-truthfully
    provides: "Plan 04-05's fail-closed Plausible adapter, closed ten-event vocabulary, and deferred production boundary"
provides:
  - "Vendor-compatible Plausible preload initialization using the options slot rather than an event-shaped queue entry"
  - "An independent preload oracle proving automatic pageviews remain disabled and each accepted action queues one bare event name"
  - "A deterministic coverage audit for required Plausible browser, Stats API, and FormSubmit decisions"
  - "A canonical MVP-valid Phase 4 user-story goal"
affects: [phase verification, production analytics enablement, owner reporting, API coverage]

actuals:
  tokens: 2927
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Independent provider oracle: the test fixture owns its own preload types and behavior rather than importing production measurement details"
    - "Table-driven coverage enforcement: required external capabilities and decisions are checked from named Markdown tables with row-specific failures"
    - "Operational deferral as an executable boundary: the audit rejects removal of the unset-provider and local-only credential statements"

key-files:
  created:
    - src/test/fixtures/plausible-preload-contract.ts
    - scripts/verify-phase4-coverage.mjs
  modified:
    - src/measurement/plausible.ts
    - src/test/measurement.test.ts
    - .planning/ROADMAP.md
  verified:
    - .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/COVERAGE.md

key-decisions:
  - "Plausible initialization options live in `plausible.o`; `plausible.q` contains only real name-only event calls."
  - "The coverage audit consumes the canonical Markdown tables and roadmap goal rather than duplicating either source of truth."
  - "Production analytics remains disabled: the provider selector is unset, deployment configuration is untouched, and report credentials remain local-only."

patterns-established:
  - "Provider preload contracts are tested against an independent fixture, not a mirror of production implementation types."
  - "External API opt-outs require a non-empty reason and an automated audit of the complete required surface."

requirements-completed: [MEAS-01, MEAS-08]

coverage:
  - id: D1
    description: "Configured Plausible preload state stores initialization options separately and queues exactly one bare event name per accepted HAOO action."
    requirement: MEAS-01
    verification:
      - kind: unit
        ref: "src/test/measurement.test.ts#Plausible provider adapter and independent preload contract; 190 tests passed"
        status: pass
      - kind: other
        ref: "npm run lint && npm run typecheck"
        status: pass
    human_judgment: false
  - id: D2
    description: "The Phase 4 capability matrix explicitly decides the required Plausible browser, Stats API, and FormSubmit surface, with reasoned opt-outs and deferred production enablement."
    requirement: MEAS-08
    verification:
      - kind: other
        ref: "node scripts/verify-phase4-coverage.mjs .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/COVERAGE.md; 41 required capabilities passed"
        status: pass
      - kind: other
        ref: "Mutation probes reject a wrong decision, blank OPT-OUT reason, and weakened provider-unset boundary"
        status: pass
    human_judgment: false
  - id: D3
    description: "Phase 4 retains MVP mode while its stored roadmap goal validates as a canonical product-owner user story."
    requirement: MEAS-08
    verification:
      - kind: other
        ref: "roadmap.get-phase 04 goal -> user-story.validate => valid true"
        status: pass
    human_judgment: false

duration: 5 min
completed: 2026-09-01
status: complete
---

# Phase 4 Plan 6: Plausible Preload and Coverage Contract Summary

**Plausible preload initialization now matches the provider contract, a deterministic audit certifies all 41 required API capability decisions, and Phase 4 again has a verifier-valid MVP user story without enabling production analytics.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-01T18:39:49Z
- **Completed:** 2026-09-01T18:45:12Z
- **Tasks:** 2
- **Files modified:** 6 implementation, test, audit, coverage, and roadmap files

## Accomplishments

- Replaced the initialization-shaped Plausible queue call with the documented `plausible.o` options slot while preserving one-argument event forwarding and failure isolation.
- Added an independent vendor-preload fixture that proves initialization creates no event and one accepted action creates exactly one name-only queue entry.
- Added a project-specific coverage audit for 41 required Plausible browser, Stats API, and FormSubmit rows, including blank-reason and operational-boundary rejection.
- Repaired the stored Phase 4 goal into canonical `As a ..., I want to ..., so that ...` form without changing MVP mode, requirements, or success criteria.

## Task Commits

1. **Task 1 RED: Add an independent Plausible preload contract** — `e2d6b8f`
2. **Task 1 GREEN: Align production preload initialization** — `80e056f`
3. **Task 2: Certify provider coverage and restore the MVP goal** — `4509854`

## Files Created/Modified

- `src/test/fixtures/plausible-preload-contract.ts` — Independent test-only transcription of the provider preload semantics.
- `src/measurement/plausible.ts` — Stores initialization options in `plausible.o` and leaves the queue for real events only.
- `src/test/measurement.test.ts` — Compares production state with the independent preload oracle and retains failure-isolation coverage.
- `scripts/verify-phase4-coverage.mjs` — Parses the three named capability tables and enforces required decisions and operational deferral.
- `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/COVERAGE.md` — Certified capability matrix distinguishing event queueing, preload options, aggregate provenance, and explicit opt-outs.
- `.planning/ROADMAP.md` — Canonical Phase 4 MVP user-story goal.

## Decisions Made

- Initialization is provider configuration, not an event; it must populate `plausible.o` and never enter `plausible.q`.
- Coverage verification reads the real matrix and stored roadmap goal so corrupting either canonical artifact makes verification fail.
- This plan changes code, tests, and local documentation only. The deployment workflow remains unchanged and production analytics remains deferred.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The known unrelated `.claude/worktrees/rf-03-retry-1788205465/` tree causes Vitest to discover an older copy of the measurement suite, so the focused run reports 190 passing tests across two files. Both copies passed, and the unrelated worktree was left untouched.

## User Setup Required

No new setup was performed. Production analytics remains intentionally disabled pending the existing privacy-owner approval and dashboard setup described in [04-USER-SETUP.md](./04-USER-SETUP.md).

## Next Phase Readiness

CR-01 and the MVP-format gap are closed. Plan 04-07 can now close the remaining report provenance, temporary-file cleanup, and owner-instructions gaps before Phase 4 re-verification.

## Self-Check: PASSED

- Both created files exist.
- Task commits `e2d6b8f`, `80e056f`, and `4509854` exist.
- The focused 190-test run, lint, typecheck, canonical user-story validation, 41-row coverage audit, mutation probes, deployment-boundary check, and diff check all pass.

---
*Phase: 04-report-and-enrich-the-haoo-funnel-truthfully*
*Completed: 2026-09-01*
