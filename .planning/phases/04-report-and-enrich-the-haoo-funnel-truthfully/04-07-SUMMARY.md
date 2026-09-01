---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
plan: 07
subsystem: reporting
tags: [plausible, provenance, atomic-write, cli, privacy, regression]

requires:
  - phase: 04-report-and-enrich-the-haoo-funnel-truthfully
    provides: "Plans 04-01 and 04-05's four-period owner report, closed ten-event vocabulary, credential boundary, and literal evidence language"
provides:
  - "Fail-closed validation of echoed Stats query site, metric, dimension, goal order, and calendar range before count parsing"
  - "Exclusive temporary-file ownership with caught-failure cleanup and byte-preserving atomic report replacement"
  - "Fixture-isolated owner CLI verification plus complete name-only diagnostics and local-variable documentation"
  - "Regression proof for MEAS-05 engagement-summary thresholds, campaign cap, and no-score/no-identifier payload"
affects: [phase verification, owner reporting, production analytics enablement, privacy review]

actuals:
  tokens: 9153
  tasks: 3
  commits: 7

tech-stack:
  added: []
  patterns:
    - "Untrusted Stats metadata is rebuilt and compared field-by-field before aggregate rows enter the report model"
    - "A fixed temporary sibling is acquired with exclusive create and removed only by the invocation that acquired it"
    - "Credentialed CLI tests preload a fixture-only fetch before module evaluation and audit every attempted URL"
    - "Terminal failures use synchronous stderr writes and exitCode so captured diagnostics flush before nonzero process shutdown"

key-files:
  created:
    - src/reporting/query-provenance.ts
    - src/test/fixtures/haoo-report-cli-fetch-preload.mjs
  modified:
    - src/reporting/generate.ts
    - scripts/generate-haoo-report.mjs
    - src/test/haoo-report.test.ts
    - README.md
    - .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md

key-decisions:
  - "Provider-owned extra top-level query members are tolerated, but the requested site, single metric, single dimension, exact ordered goal filter, and resolved calendar range must match exactly."
  - "Temporary-file cleanup is ownership-based: caught failures remove only the sibling reserved by that invocation, while an uncatchable termination leaves a fail-closed lockout rather than risking another run's data."
  - "Local report diagnostics name absent variables only; report credentials and site values are never echoed, and production browser collection remains deferred."

patterns-established:
  - "Validate query provenance before parsing result rows or assigning local period labels."
  - "Use test-only Node preloads to replace network access before a credentialed CLI module evaluates."

requirements-completed: [MEAS-01, MEAS-05, MEAS-08]

coverage:
  - id: D1
    description: "Every accepted Stats response is correlated to the exact site, query shape, ordered ten-goal filter, and valid inclusive calendar range before its counts are rendered."
    requirement: MEAS-01
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#validateEchoedQuery and generateHaooReport provenance contracts; 120 tests passed"
        status: pass
      - kind: integration
        ref: "npm test; 723 tests passed across the repository and preserved unrelated worktree"
        status: pass
    human_judgment: false
  - id: D2
    description: "Report replacement reserves its temporary sibling exclusively, preserves the previous report byte-for-byte, and cleans owned partial artifacts after caught write or rename failures."
    requirement: MEAS-08
    verification:
      - kind: integration
        ref: "src/test/haoo-report.test.ts#temporary, rename, concurrent, and previous report real-filesystem contracts"
        status: pass
      - kind: other
        ref: "npm run typecheck && npm run lint && npm run build"
        status: pass
    human_judgment: false
  - id: D3
    description: "The owner CLI diagnoses missing local inputs without exposing values, performs exactly seven fixture-only requests when configured, and documents both local variables separately from deferred public collection settings."
    requirement: MEAS-08
    verification:
      - kind: integration
        ref: "src/test/haoo-report.test.ts#credentialed CLI four-case subprocess matrix"
        status: pass
      - kind: other
        ref: "README.md and 04-USER-SETUP.md documentation contract"
        status: pass
    human_judgment: false
  - id: D4
    description: "The existing enquiry engagement summary retains exact visit and recency boundaries, the 32-character campaign cap, literal count-band wording, and its no-score/no-identifier privacy boundary."
    requirement: MEAS-05
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#engagement summary threshold, cap, and payload prohibition matrix; 84 tests passed"
        status: pass
    human_judgment: false

duration: 10 min
completed: 2026-09-01
status: complete
---

# Phase 4 Plan 7: Trustworthy Report Boundary Summary

**The HAOO owner report now accepts only query-correlated aggregate counts, replaces its local artifact through exclusively owned temporary files, and provides a fixture-verified, non-secret command contract without enabling production analytics.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-09-01T19:01:35Z
- **Completed:** 2026-09-01T19:11:06Z
- **Tasks:** 3
- **Files modified:** 7 implementation, test, fixture, and owner-documentation files

## Accomplishments

- Added a pure fail-closed provenance validator covering exact query identity, ordered goal scope, impossible dates, offset timestamps, and bounded/all-time calendar rules.
- Made report replacement ownership-safe across partial writes, failed renames, cleanup failures, concurrent invocations, and a preserved prior destination.
- Added a Node preload that forbids live network fallback, independently serves seven Stats fixtures, and records a URL/count audit for every CLI subprocess case.
- Completed owner guidance for both local report inputs while retaining all MEAS-05 threshold, cap, and privacy contracts and keeping production collection deferred.

## Task Commits

1. **Task 1 RED: Add failing echoed-query provenance contracts** — `0764031`
2. **Task 1 GREEN: Validate echoed report query provenance** — `405aee1`
3. **Task 2 RED: Add failing temporary-ownership contracts** — `fcf2bc5`
4. **Task 2 GREEN: Preserve reports across filesystem failures** — `38c689a`
5. **Task 3 RED: Add failing owner CLI contracts** — `ed127df`
6. **Task 3 GREEN: Make owner report runs self-diagnosing** — `0718fa9`
7. **Post-merge regression repair: Flush captured CLI diagnostics before failure exit** — `92b42cd`

## Files Created/Modified

- `src/reporting/query-provenance.ts` — Rebuilds and validates trusted site, metric, dimension, filter, and calendar provenance.
- `src/reporting/generate.ts` — Gates count parsing on provenance and owns exclusive reserve/write/rename/cleanup orchestration.
- `scripts/generate-haoo-report.mjs` — Supplies real exclusive filesystem capabilities and name-only missing-variable diagnostics.
- `src/test/fixtures/haoo-report-cli-fetch-preload.mjs` — Replaces fetch before CLI evaluation and records fixture-only request audits.
- `src/test/haoo-report.test.ts` — Covers adversarial provenance, real filesystem failures, concurrency, secret non-rendering, and owner instructions.
- `README.md` — Defines the exact-domain site identifier and non-secret two-variable local command.
- `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md` — Separates local report inputs from deferred public deployment variables.

## Decisions Made

- Extra provider-owned top-level metadata is acceptable, but every locally meaningful query field is a closed, exact contract.
- Cleanup authority follows successful exclusive reservation; a losing process cannot remove a temporary sibling it does not own.
- The owner command exposes missing variable names only and never prints supplied values, authorization material, or report business data.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Made captured CLI failure diagnostics deterministic**
- **Found during:** Post-merge regression gate after Task 3
- **Issue:** Immediate process termination could occur before `console.error` flushed to a parent process's piped stderr, leaving all three missing-variable cases with the correct status but an empty diagnostic.
- **Fix:** Write the name-only terminal message synchronously, set `process.exitCode`, and retain the configuration branch so missing inputs cannot reach report generation or networking. Added a source contract prohibiting forced `process.exit` at this boundary.
- **Files modified:** `scripts/generate-haoo-report.mjs`, `src/test/haoo-report.test.ts`
- **Commit:** `92b42cd`

## Issues Encountered

The sandbox blocks nested Node subprocesses during an ordinary test command, so the CLI verification commands were run with the approved local-process permission. The known unrelated `.claude/worktrees/rf-03-retry-1788205465/` directory also causes Vitest's full run to discover an older duplicate suite; all 723 discovered tests passed, and that unrelated tree was left untouched.

## User Setup Required

Production setup remains deliberately incomplete. Follow [04-USER-SETUP.md](./04-USER-SETUP.md) only after privacy-owner approval, creation of all ten Plausible goals, and explicit deployment configuration. The local report requires both `PLAUSIBLE_STATS_API_KEY` and the exact Plausible-configured `PLAUSIBLE_SITE_ID`.

## Next Phase Readiness

CR-02, WR-01, and WR-02 are closed with automated evidence. Phase 4 is ready for code review and goal verification; production analytics remains intentionally disabled pending the recorded external approvals and setup.

## Self-Check: PASSED

- Both created files and all five modified files exist.
- Task commits `0764031`, `405aee1`, `fcf2bc5`, `38c689a`, `ed127df`, `0718fa9`, and `92b42cd` exist.
- The focused 120-report-test and 84-summary-test suites, full 723-test repository run, typecheck, lint, build, and diff check all pass.

---
*Phase: 04-report-and-enrich-the-haoo-funnel-truthfully*
*Completed: 2026-09-01*
