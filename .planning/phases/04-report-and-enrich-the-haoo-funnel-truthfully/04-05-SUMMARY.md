---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
plan: 05
subsystem: measurement
tags: [plausible, analytics, privacy, fail-closed, vite, vitest]

requires:
  - phase: 03-build-privacy-bounded-engagement-context
    provides: "The closed ten-name measurement seam, bounded local context, and failure-isolated visitor journey"
  - phase: 04-report-and-enrich-the-haoo-funnel-truthfully
    provides: "Plans 04-01 and 04-03's aggregate owner-report query and renderer"
provides:
  - "A fail-closed Plausible adapter that loads only validated public configuration and emits one bare allowlisted name per action"
  - "Provider-unset build and source boundaries excluding analytics origins, credential shapes, identity, payload, and queue seams"
  - "Human setup instructions that keep production collection disabled until separate processor approval and dashboard configuration"
affects: [phase verification, production analytics enablement, owner reporting]

actuals:
  tokens: 9300
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Fail-closed public provider resolution: only the exact `plausible` selector plus a structurally valid HTTPS script URL and non-empty domain can create a sink"
    - "Capability injection: tests inject document/global adapters while production resolves the provider behind the unchanged five-member measurement facade"
    - "Configuration-sensitive bundle boundary: the unset CI build excludes the supported origin, while all production source excludes hardcoded analytics origins unconditionally"

key-files:
  created:
    - src/measurement/plausible.ts
    - .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md
  modified:
    - src/products/types.ts
    - src/products/haoo.ts
    - src/measurement/index.ts
    - src/test/measurement.test.ts
    - src/test/build-output.test.ts
    - src/test/haoo-report.test.ts
    - src/test/product-shell-reuse.test.tsx
    - README.md

key-decisions:
  - "Checkpoint C-3 outcome: approve code, defer production enablement. The Plausible account/processor and live collection still require separate privacy-owner approval; provider variables remain unset and the deploy workflow is unchanged."
  - "A missing, blank, `none`, unknown, or structurally invalid provider configuration resolves to the existing inert sink."
  - "The adapter disables automatic capture and calls the provider with exactly one bare allowlisted event name; failures are swallowed at the provider boundary."
  - "`PLAUSIBLE_STATS_API_KEY` remains a local report-process credential and must never enter a Vite variable or browser bundle."

patterns-established:
  - "External analytics is a replaceable event-sink capability behind the existing measurement facade, never a second tracking API."
  - "Provider enablement requires code readiness, processor approval, all ten dashboard goals, and public build configuration as separate gates."

requirements-completed: [MEAS-01, MEAS-08]

coverage:
  - id: D1
    description: "Configured Plausible collection emits exactly one name-only call for each accepted HAOO event, disables automatic capture, and cannot break the visitor journey when loading or provider calls fail."
    requirement: MEAS-01
    verification:
      - kind: unit
        ref: "src/test/measurement.test.ts#Plausible provider adapter and widened provider seam"
        status: pass
      - kind: integration
        ref: "npm test -- --run src/test/build-output.test.ts src/test/haoo-report.test.ts => 146 passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "The production source and provider-unset bundle contain no hardcoded analytics origin, reporting credential shape, identity, property payload, or delivery queue seam."
    requirement: MEAS-08
    verification:
      - kind: integration
        ref: "src/test/build-output.test.ts#keeps analytics origins out of production source modules"
        status: pass
      - kind: integration
        ref: "src/test/build-output.test.ts#ships the unset provider bundle without identity, property, queue, SDK, or credential seams"
        status: pass
      - kind: other
        ref: "Mutation probe: temporary https://plausible.io in src/reporting/generate.ts caused the source-boundary test to fail; restoration passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "Production collection and live aggregate reporting operate against an approved Plausible site with all ten custom-event goals configured before enablement."
    requirement: MEAS-01
    verification: []
    human_judgment: true
    rationale: "The owner chose approve-code-defer-enablement at C-3. Processor approval, account access, dashboard goals, deployment variables, and observation of live events require human-controlled external configuration."

duration: 1h 30m
completed: 2026-09-01
status: complete
---

# Phase 4 Plan 5: Fail-Closed Plausible Provider Summary

**The closed HAOO measurement seam now has a deliberately configured, failure-isolated Plausible sink and enforceable source/bundle privacy boundaries, while production collection remains explicitly disabled pending approval.**

## Performance

- **Duration:** 1h 30m
- **Started:** 2026-09-01T10:35:39+03:00
- **Completed:** 2026-09-01T12:05:03+03:00
- **Tasks:** 3 (one human checkpoint, two implementation tasks)
- **Files modified:** 9 implementation/test/documentation files, plus this setup record

## Accomplishments

- Added the injectable Plausible script loader and name-only event sink without widening the public measurement facade.
- Preserved the inert path for unset or invalid configuration and isolated script/global/provider failures from the visitor journey.
- Extended source and built-output contracts to reject hardcoded analytics origins and report credentials, with a passing inversion probe.
- Documented every public build value, the ten-goal prerequisite, and the local-only Stats API credential boundary.

## Task Commits

1. **Task 1: Resolve processor checkpoint C-3** — human choice recorded as `approve-code-defer-enablement`
2. **Task 2 RED: Pin the widened provider seam** — `f376c25`
3. **Task 2 GREEN: Add the fail-closed provider adapter** — `8643079`
4. **Task 3: Seal the static boundary and document setup** — `4067968`

## Decisions Made

Production enablement was deliberately deferred. No analytics variables were added to the deployment workflow, and the provider-unset build remains the shipped configuration. Live MEAS-01 collection therefore remains a human setup/UAT item even though the code path is implemented and fixture-verified.

## Deviations from Plan

### Auto-fixed Issues

**1. Compatibility fixture required the widened product shape**
- **Found during:** Task 2 verification
- **Issue:** The synthetic product-shell fixture lacked the new required `providerScript` member.
- **Fix:** Added an empty provider-script configuration that exercises the fail-closed path.
- **Files modified:** `src/test/product-shell-reuse.test.tsx`
- **Verification:** Targeted tests, lint, and typecheck pass.
- **Committed in:** `8643079`

**2. Report boundary test derived the old monolithic origin expression**
- **Found during:** Task 3
- **Issue:** Splitting unconditional origins from the configuration-sensitive Plausible origin left the report boundary test coupled to the former constant shape.
- **Fix:** Repointed the derivation to `UNCONFIGURED_PROVIDER_ORIGIN_FORBIDDEN`.
- **Files modified:** `src/test/haoo-report.test.ts`
- **Verification:** 146 targeted tests pass outside the subprocess-restricting sandbox.
- **Committed in:** `4067968`

**Total deviations:** 2 auto-fixed compatibility issues.
**Impact on plan:** Both preserve existing contracts under the planned provider widening; no production enablement or scope expansion occurred.

## Issues Encountered

The credentialed CLI test cannot spawn the NVM Node binary inside the restricted filesystem sandbox (`EPERM`). Rerunning the exact verification outside that sandbox passed; this is an execution-environment restriction, not an application failure. A stale `.claude/worktrees/...` directory also causes one older build-output suite to be discovered in addition to the canonical suite; it passed and was left untouched as unrelated user state.

## User Setup Required

**External service configuration is intentionally incomplete.** See [04-USER-SETUP.md](./04-USER-SETUP.md) for the approval gate, dashboard goals, public build variables, local credential boundary, and verification commands.

## Next Phase Readiness

The code and privacy boundaries are ready for phase verification. Production counts are intentionally unavailable until the privacy owner completes the setup checklist; verification must preserve that distinction and must not claim live analytics evidence.

---
*Phase: 04-report-and-enrich-the-haoo-funnel-truthfully*
*Completed: 2026-09-01*
