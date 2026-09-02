---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
plan: 12
subsystem: measurement
tags: [plausible, privacy, analytics, fail-closed, dead-code, tdd, vitest]

# Dependency graph
requires:
  - phase: 04-09
    provides: The fail-closed provider initialization path, the three refusal fixtures, and the confirmed-stub primary-path case this plan extends without editing
  - phase: 04-08
    provides: The approved analytics script-source contract, unchanged and unwidened by this plan
provides:
  - A complete adopted-versus-installed classification that refuses a defined non-callable pre-existing provider global before anything is written to the scope
  - Adversarial coverage for the verifier's exact non-function probe, at the adapter boundary and through the full journey facade
  - Removal of the unreachable refusal-cleanup branch, with both claims it backed withdrawn from the 04-09 record by dated amendment
affects: [measurement, phase-04-verification, gsd-secure-phase, 04-13]

actuals:
  tokens: 18508
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Classify before you assign: an untrusted ambient global is inspected and dispositioned before any write to the shared scope, so a refusal never has state to restore"
    - "Fewer claims over more machinery: an unreachable mitigation is deleted along with the record that asserted it, rather than made reachable by weakening a component the project controls"

key-files:
  created: []
  modified:
    - src/measurement/plausible.ts
    - src/test/measurement.test.ts
    - .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-09-SUMMARY.md

key-decisions:
  - "A defined non-callable `scope.plausible` is refused outright rather than replaced-then-restored — restoring would mean the value had already been destroyed, and the declared truth forbids replacement rather than merely requiring repair"
  - "Refusal covers any defined non-callable value, including `null`, because the fail-closed direction of this phase is to decline collection whenever the opt-out cannot be established through what is already on the scope"
  - "The unreachable cleanup branch was deleted rather than made reachable — making it reachable would require `installProviderStub` to return a stub that can fail its own initialization, deliberately weakening the one component in this module the project fully controls"
  - "The two withdrawn 04-09 claims were rewritten in place and recorded in a dated amendment note rather than silently deleted, so the planning record shows what was claimed, why it had no executable path, and what replaced it"
  - "This plan promotes no requirement status: `requirements-completed` is left empty although the plan declares MEAS-01 and MEAS-08, because the plan prohibitions forbid promoting a checkbox and both requirements retain open human gates in 04-VERIFICATION.md"

patterns-established:
  - "Decide-before-assign classification: the adopted/installed decision is made from a single read of the untrusted scope, before any write, so no code path can overwrite third-party state"
  - "Non-vacuity by isolated assertion probe: each of the three probe assertions was run as its own case against the pre-fix source, so RED evidence covers all three rather than only the first assertion vitest reaches"

requirements-completed: []

coverage:
  - id: D1
    description: "A truthy non-function pre-existing provider global yields no event sink, appends zero script elements, and is left at its identical original reference with its original property set intact — the verifier's gap 2 probe, now refused"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider initialization > returns no sink and appends no script when the pre-existing global is not callable"
        status: pass
      - kind: other
        ref: "Revert check: with only the classification change reverted, the case fails on the sink assertion; run as three isolated cases it fails on all three (no sink, 0 scripts, original identity)"
        status: pass
    human_judgment: false
  - id: D2
    description: "MEAS-07 holds on the new refusal path: with the same non-callable global, three tracked actions each return true, every matching bounded local flag is recorded, zero script elements are appended, and no console method is called"
    requirement: "MEAS-01"
    verification:
      - kind: integration
        ref: "src/test/measurement.test.ts#fail-closed provider initialization in the full journey > keeps the whole journey working when the pre-existing global is not callable"
        status: pass
    human_judgment: false
  - id: D3
    description: "The adapter contains no branch that cannot execute and makes no claim it cannot execute: the stub-removal branch, the `refuse()` closure, and the docstring sentence describing stub withdrawal are all gone from the source"
    requirement: "MEAS-08"
    verification:
      - kind: other
        ref: "grep -v -E '^\\s*(\\*|//|/\\*)' src/measurement/plausible.ts | grep -c 'delete scope.plausible' → 0"
        status: pass
      - kind: other
        ref: "grep -c 'a refusal removes it again' src/measurement/plausible.ts → 0"
        status: pass
      - kind: other
        ref: "grep -c 'refuse()' src/measurement/plausible.ts → 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The three previously proven refusal paths, the original-identity case, and the confirmed-stub primary path are unchanged, with expectations byte-identical to their pre-plan state"
    requirement: "MEAS-08"
    verification:
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider initialization (4 pre-existing cases) and #fail-closed provider initialization in the full journey (refusedRows + original-identity)"
        status: pass
      - kind: other
        ref: "git show --stat 02e698a → 58 insertions(+), 0 deletions in src/test/measurement.test.ts, so no existing expectation was edited"
        status: pass
    human_judgment: false
  - id: D5
    description: "The 04-09 record no longer asserts a mitigation with no executable path: the stub-removal key-decision and the matching tech-stack pattern are rewritten, and a dated amendment records the withdrawal, the gap it answers, the replacement guarantee, and the hand-off of the D1 coverage row to plan 04-13"
    requirement: "MEAS-08"
    verification:
      - kind: other
        ref: "git diff on 04-09-SUMMARY.md — exactly two frontmatter lines rewritten plus the appended amendment; D1/D2/D3 coverage rows, requirements-completed, and actuals byte-identical"
        status: pass
    human_judgment: false
  - id: D6
    description: "The two live human gates restated in Task 2's human-check are carried open, not closed: production privacy approval with live event uniqueness, and confirmation on the deployed page that no other snippet defines the provider global before the bundle runs"
    verification: []
    human_judgment: true
    rationale: "Both require a deployed page, an approved processor, ten configured dashboard goals, and a human performing each explicit action once. 04-VERIFICATION.md classified the adopted-path echo as behaviour external to this repository (T-04-50, disposition transfer); this plan narrows the non-callable case only and must not convert either gate into an automated acceptance criterion."

# Metrics
duration: 5 min
completed: 2026-09-02
status: complete
---

# Phase 04 Plan 12: Refuse a Non-Callable Pre-Existing Provider Global Summary

**The Plausible adapter now decides adopted-versus-installed before it writes anything to the shared scope, so an object-shaped `window.plausible` left by a tag manager is refused and left byte-identical instead of being clobbered by the stub — and the unreachable cleanup branch that was supposed to repair that damage is gone, along with both 04-09 claims that asserted it.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-02T10:43:30Z
- **Completed:** 2026-09-02T10:48:19Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Closed gap 2 of `04-VERIFICATION.md`, the phase's one failed truth. The verifier's probe `{ plausible: { o: 'foreign' } }` previously produced a returned sink, one appended script, and a destroyed third-party value that was never restored. It now produces no sink, zero script elements, and the identical original object with its single original property untouched.
- Moved the classification ahead of every write to the scope. `adopted` is no longer inferred after the stub has already been installed: a defined non-callable value is refused on the line after the single read of `scope.plausible`, and `installProviderStub` is reached only when the scope carried no provider value at all. There is consequently no code path on which a pre-existing value is overwritten and later needs restoring.
- Deleted the unreachable `if (!adopted) delete scope.plausible` branch, collapsed the `refuse()` closure it lived in, and returned `null` directly from both refusal paths with their explanatory comments intact. A short comment at the stub installation now records *why* no cleanup is needed there, as a reachability fact rather than as a mitigation.
- Withdrew the two 04-09 claims that branch backed — the `key-decisions` entry and the matching `tech-stack.patterns` entry — replacing each with the stronger and reachable guarantee, and appended a dated amendment note that states what was withdrawn, why it had no executable path, that `04-VERIFICATION.md` recorded it as gap 2 failed, what replaced it, and that the D1 `coverage` row is deliberately left to plan 04-13.
- Proved the new coverage is non-vacuous in two ways: the committed adapter-boundary case fails when the classification change is reverted, and an isolated three-case probe run against the pre-fix source failed on all three assertions independently (no sink, zero scripts, original identity), which a single test case cannot demonstrate because vitest stops at the first failing assertion.

## Task Commits

Each task was committed atomically:

1. **Task 1: Refuse a non-callable pre-existing provider global before anything is installed** (tracer, TDD)
   - RED: `02e698a` (test) — `nonFunctionGlobalScope` fixture plus the adapter-boundary and full-journey cases. Observed `2 failed | 135 passed`.
   - GREEN: `0985036` (feat) — decide-before-assign classification and the rewritten docstring. Observed `137 passed`.
   - No REFACTOR commit: the GREEN implementation is four lines plus comments and required no cleanup pass.
2. **Task 2: Remove the unreachable refusal-cleanup branch and withdraw the claim it backed** - `9cc7250` (refactor)

## Files Created/Modified

- `src/measurement/plausible.ts` — `resolveInitializedProvider` now reads `scope.plausible` once, refuses any defined non-callable value before any assignment, installs the stub only onto an empty scope, and returns `null` directly from both refusal paths. The `refuse()` closure, the `adopted` flag, and the stub-removal branch are gone. The docstring states the rule the code implements and no longer describes stub withdrawal.
- `src/test/measurement.test.ts` — added the `nonFunctionGlobalScope` fixture beside the three existing refusal fixtures, one adapter-boundary case in `fail-closed provider initialization`, and one full-journey MEAS-07 case in `fail-closed provider initialization in the full journey`. 58 insertions, zero deletions: no existing case, fixture, or expectation was edited.
- `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-09-SUMMARY.md` — third `key-decisions` entry and third `tech-stack.patterns` entry rewritten; `## Amendment 2026-09-02 (plan 04-12)` appended. `coverage` rows D1–D7, `requirements-completed`, and `actuals` are byte-identical.

## Decisions Made

- **Refuse rather than restore.** The declared truth forbids replacement, not merely damage that gets repaired. A restore path would mean the value had already been destroyed for the duration of the call, and would reintroduce exactly the kind of cleanup branch this plan is removing. Deciding before assigning makes the restore question moot.
- **`null` is refused too.** The guard is `existing !== undefined && typeof existing !== 'function'`, so `scope.plausible = null` refuses rather than installing over it. A property present on the scope is a value somebody put there; declining collection is the fail-closed direction this phase has taken everywhere else.
- **Removal over reachability, deliberately.** Making the cleanup branch reachable would require `installProviderStub` to return a stub whose own `init` can legitimately throw or fail the recorded-opt-out check — weakening the one component in this module the project fully controls in order to exercise a cleanup for a state that component cannot reach. The honest outcome is fewer claims, not more machinery, which is the same standard this phase is applying to its prose.
- **The withdrawal is recorded, not performed silently.** A future reader of `04-09-SUMMARY.md` who sees the strong new claim would otherwise have no way to know a weaker unexecutable one stood there, or that the verifier caught it. The dated amendment carries that history.
- **No requirement status promoted.** `requirements-completed` is empty although the plan declares MEAS-01 and MEAS-08, matching the precedent set by 04-11. Both requirements retain open human gates in `04-VERIFICATION.md`, and this plan's prohibitions forbid promoting a checkbox or converting a gate into an automated acceptance criterion.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npm run build` — succeeded, `✓ built in 2.71s`, so the `dist` freshness contract holds after a production source input changed.
- `npx vitest run --exclude '**/.claude/worktrees/**' --exclude '**/node_modules/**'` — **11 files, 503/503 passed** on the real tree. These are the real-tree counts, not the inflated counts a bare `npm test` produces by also collecting the stale `.claude/worktrees/` copy.
- `npx vitest run ... src/test/measurement.test.ts` — 137 passed (135 pre-existing + 2 new).
- `npx vitest run ... src/test/build-output.test.ts` — 28 passed: no analytics origin entered a production module and the 04-08 approved-source boundary is intact.
- `npm run typecheck` — exit 0. `npm run lint` — exit 0.
- Source assertions: `grep -v -E '^\s*(\*|//|/\*)' src/measurement/plausible.ts | grep -c 'delete scope.plausible'` → `0`; `grep -c 'a refusal removes it again' src/measurement/plausible.ts` → `0`; `grep -c 'refuse()' src/measurement/plausible.ts` → `0`.
- `node scripts/verify-phase4-coverage.mjs .planning/phases/.../COVERAGE.md` — "Phase 4 coverage audit passed: 41 required capabilities across 3 tables", exit 0, and `COVERAGE.md` is unchanged (absent from `git status`).
- `.planning/REQUIREMENTS.md` is unchanged: no checkbox and no status row was touched.
- **Non-vacuity, observed.** With only the classification change reverted (`git checkout -- src/measurement/plausible.ts` against the RED commit state), the suite reported `2 failed | 135 passed`: the adapter case failed with `AssertionError: expected [Function] to be undefined` and the journey case with `expected <script defer …(1)></script> to have a length of +0 but got 1`. Because vitest stops a case at its first failing assertion, the three probe assertions were additionally run as three isolated cases against the same pre-fix source; all three failed — `expected [Function] to be undefined`, `expected <script defer …(1)></script> to have a length of +0 but got 1`, and `expected [Function queuedProvider] to be { o: 'foreign' } // Object.is equality`. The throwaway probe file was deleted and is not committed; the implementation was restored byte-identically afterwards and the suite returned to 137 passed.
- `git diff --name-only 02e698a~1` lists exactly three files: `src/measurement/plausible.ts`, `src/test/measurement.test.ts`, and `04-09-SUMMARY.md`.

## Issues Encountered

- The stale untracked worktree at `.claude/worktrees/rf-03-retry-1788205465/` still doubles the default vitest glob, so every run in this plan used `--exclude '**/.claude/worktrees/**' --exclude '**/node_modules/**'` and every count cited above is a real-tree count. This is pre-existing repository pollution outside this plan's scope; it was not edited. It remains recorded as a phase blocker.

## Known Stubs

None — no stubs, TODOs, FIXMEs, skipped tests, or unrun `<verify>` commands were introduced. The one `<human-check>` block in Task 2 is not an unrun verification: it restates two live human gates that `04-VERIFICATION.md` already owns and that this plan is explicitly prohibited from closing.

## Threat Flags

None. This plan removes attack surface rather than adding it: T-04-49 (tampering with a pre-existing non-callable global) and T-04-52 (an unexecutable mitigation claimed in source and in the plan record) are now closed with executable evidence, T-04-53 is covered by the full-journey case, and T-04-51 is re-asserted unchanged by the unedited name-only sink cases. T-04-50 stays `transfer`, open at its live human gate. No network endpoint, auth path, file access pattern, or schema change was introduced, and no package was installed.

## User Setup Required

None - no external service configuration required by this plan. The phase's outstanding owner setup (processor approval, ten dashboard goals, `PLAUSIBLE_SITE_ID`, and the analytics build variables) is unchanged and still deferred.

## Next Phase Readiness

- Gap 2 of `04-VERIFICATION.md` — the phase's one failed truth — is closed with executable evidence at both the adapter boundary and the full journey facade.
- Plan 04-13 is unblocked and owns the two items this plan deliberately did not touch: the D1 `coverage` row in `04-09-SUMMARY.md`, and the source prose that invites a reader to treat the live-uniqueness gate as already satisfied (gap 3 / warning WR-03).
- The adopted-path echo (T-04-50, the echoing foreign global) remains an open human gate, unchanged and unclaimed. No requirement status was promoted, so MEAS-01 and MEAS-08 stay unchecked pending re-verification.

---
*Phase: 04-report-and-enrich-the-haoo-funnel-truthfully*
*Completed: 2026-09-02*
