---
phase: 05-prove-the-deployed-journey
plan: 01
subsystem: infra
tags: [planning-record, repository-split, git, evidence, splt-01, disjointness]

# Dependency graph
requires:
  - phase: 04.2-split-haoo-into-its-own-repository-and-domain
    provides: "D-03's first half (the HAOO clone plus the 04.2-09 sync), the D37 deferred-item walk and its W-1 amendment, and scripts/verify-tree-disjointness.mjs with EXCLUDED_PREFIXES = ['.planning/']"
provides:
  - "KaruguDev/HAOO as the single home for the planning record, with the ZERO-PAPER HUB .planning/ directory removed"
  - "05-EVIDENCE-PLANNING-HOME.md — the authorising walk's integers, both removal SHAs, both post-removal verify:disjoint runs verbatim, the working-directory rule and the recurrence note"
  - "A stated, unambiguous working directory for every remaining Phase 5 plan"
affects: [all remaining Phase 5 plans, phase verification, future GSD sessions targeting either checkout]

# Actuals (#2632)
actuals:
  tokens: 3400
  tasks: 3
  commits: 6

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A destructive act is gated on a machine-greppable integer written by the measurement that authorises it, in the same commit"
    - "The authorising measurement is re-run at execution time; a figure recorded in a document is never accepted as a precondition"

key-files:
  created:
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-PLANNING-HOME.md
  modified:
    - .planning/STATE.md
    - .planning/milestone.lock
    - "../ZERO-PAPERHUB/.planning (removed entirely — 249 tracked files, 68784 deletions)"

key-decisions:
  - "The 13:01Z walk's one differing shared path, STATE.md, was resolved in HAOO's favour by owner decision (Option A) rather than by executor judgment — the plan reserves that choice, and the executor halted to surface it"
  - "The evidence file records that the tree was mutated to reach a differing count of zero, rather than presenting the zero alone"
  - "The three destructive commands were run by the orchestrator after a harness permission denial in the executor context; the evidence file records which hands were on a one-way act"
  - "research/.cache was measured separately (34/34 byte-identical in HAOO) because git rm staged 249 files against the walk's 233, and the gap needed accounting for rather than assuming"

patterns-established:
  - "Machine-contract evidence lines: an authorising integer is written at line start in a fixed form so a later gate greps it, and cannot be satisfied or defeated by prose elsewhere in the document"
  - "Evidence records the numbers a run printed and its exit code beside its verbatim output, never a pass mark of the author's own"
  - "An unrunnable-from-now-on verification is recorded as historical rather than silently re-asserted"

requirements-completed: [QUAL-05]

coverage:
  - id: D1
    description: "HAOO's planning tree is a proven byte-for-byte superset of ZERO-PAPER HUB's, measured by a walk re-run at execution time"
    requirement: "QUAL-05"
    verification:
      - kind: other
        ref: "cmp over 233 shared paths; 05-01 task 1 <verify><automated> (two cmp checks plus two anchored greps)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The ZERO-PAPER HUB planning directory is removed from disk and from the git index, authorised by a gate whose exit status decided the deletion"
    requirement: "QUAL-05"
    verification:
      - kind: other
        ref: "05-01 task 2 <verify><automated>: anchored greps read 0, test ! -e ../ZERO-PAPERHUB/.planning, empty ls-files, empty status"
        status: pass
    human_judgment: false
  - id: D3
    description: "SPLT-01 still holds in both repositories after the removal, proven by a fresh run in each"
    requirement: "QUAL-05"
    verification:
      - kind: other
        ref: "npm run verify:disjoint in both checkouts, exit 0 each, 2026-09-07T13:24:26Z"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every remaining Phase 5 plan has a stated, unambiguous working directory, and a reader is warned that a future GSD session pointed at ZERO-PAPER HUB would silently recreate .planning/"
    verification: []
    human_judgment: true
    rationale: "A rule addressed to whoever runs the next command. No check in either tree can assert that a future session honours it — the disjointness auditor excludes .planning/ by design, so a recreated tree would sit beside a green run. Its adequacy as a warning is a human judgment."

# Metrics
duration: 26 min
completed: 2026-09-07
status: complete
---

# Phase 5 Plan 1: The Planning Record's Single Home Summary

**The ZERO-PAPER HUB `.planning/` directory removed (249 tracked files, 68784 deletions) after a superset walk re-run at execution time measured 0 ZPH-only and 0 differing paths across 233 byte-for-byte comparisons, with SPLT-01 re-proven at exit 0 in both checkouts afterwards**

## Performance

- **Duration:** 26 min
- **Started:** 2026-09-07T13:01:27Z
- **Completed:** 2026-09-07T13:27:30Z
- **Tasks:** 3
- **Files modified:** 3 authored (1 created, 2 modified) plus 249 removed in the sibling repository

## Accomplishments

- `KaruguDev/HAOO` is now the single home for the planning record, closing the second half of 04.2 D-03 whose trigger fired at `/gsd-verify-work 04.2` sign-off.
- The removal was authorised by a walk **re-run at 2026-09-07T13:07:25Z**, not by any recorded figure — 234 distinct paths, 233 compared byte-for-byte, 0 ZPH-only, 1 HAOO-only (`milestone.lock`, expected), 0 differing.
- The gate was a command whose exit status decided the deletion, chained so `git rm` ran only as its right-hand side. The two authorising integers are written at line start in a fixed form precisely so a grep, not prose, enforces them.
- SPLT-01 re-proven after the removal: `npm run verify:disjoint` exits 0 in both repositories, both success blocks recorded verbatim with invocation and exit code.
- The removal is shown not to have changed what SPLT-01 measures — ZPH's compared figure reads 38 before and after an act deleting 68784 lines, which is what `EXCLUDED_PREFIXES = ['.planning/']` promises (threat T-05-03).

## Task Commits

1. **Precondition clearance: Phase 5 execution start recorded** — `9eec11e` (docs, HAOO)
2. **Divergence resolution: `STATE.md` synced forward** — `83cb386` (docs, ZERO-PAPER HUB)
3. **Task 1: the authorising walk and its integers** — `01b5ba5` (docs, HAOO)
4. **Task 2: the planning directory removed** — `dfdb2e9` (chore, ZERO-PAPER HUB) — 249 files changed, 68784 deletions
5. **Task 2: both removal SHAs and who ran the deletion** — `76c34f6` (docs, HAOO)
6. **Task 3: SPLT-01 re-proven in both checkouts** — `ec14714` (docs, HAOO)

## Files Created/Modified

- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-PLANNING-HOME.md` — created (253 lines). The authorising walk with its measured integers, the excluded-cache measurement, the record of the first walk's divergence and its resolution, both removal SHAs, the 249-vs-233 accounting, both verbatim `verify:disjoint` blocks, the working-directory rule and the recurrence note.
- `.planning/STATE.md` — the orchestrator's execution-start write, committed to clear task 1's precondition, then synced forward into the sibling before its tree was removed.
- `.planning/milestone.lock` — phase 05 claimed by this execution session.
- `../ZERO-PAPERHUB/.planning/` — removed entirely.

## Decisions Made

- **The one differing shared path was escalated, not resolved.** The 13:01Z walk found `.planning/STATE.md` differing. Choosing a winner is the decision D-03's single-home rule exists to close, so the executor halted rather than picking HAOO on its own judgment — even though HAOO's copy was demonstrably the later one. The owner selected Option A (HAOO authoritative, sync forward) and the walk was re-run.
- **The zero was earned, and the file says so.** The evidence file records the first walk's `Differing: 1`, its cause and its resolution, rather than presenting only the re-run's zero. A reader auditing a one-way act is entitled to know the tree was mutated to reach the number that authorised it.
- **The gap between 249 removed files and 233 compared paths is accounted for, not assumed away.** `research/.cache/` is gitignored in HAOO but tracked in ZPH and excluded from the walk by the plan's own instruction. It was measured separately — all 34 files byte-for-byte present in HAOO, which holds 39 — so the superset property is established across the set the removal actually touched.
- **Provenance of the destructive act is recorded literally.** The gate, its exit status and the commit body are the executor's; the three destructive commands were run by the orchestrator after a harness permission denial. The evidence file states this rather than letting the commit imply otherwise.

## Deviations from Plan

### Escalations and auto-fixes

**1. [Rule 4 - Architectural/judgment] The superset walk found one differing shared path and the plan forbids resolving it**

- **Found during:** Task 1 (first walk, 2026-09-07T13:01Z)
- **Issue:** `.planning/STATE.md` differed between the trees. The Phase 5 planning session had run in the ZERO-PAPER HUB checkout and written its state at 12:56:04Z; HAOO's orchestrator wrote a strict successor at 12:59:40Z. The divergence was real, not a working-tree artifact — HAOO's committed copy was the older 07:06 phase-2 snapshot, so ZPH held bytes present nowhere in HAOO. Writing `Differing count: 0` while a shared file differed would have turned task 2's gate into a rubber stamp on a one-way deletion.
- **Fix:** Halted with no commits, per the task's explicit instruction, and surfaced the full diff with the measured facts. Owner selected Option A. The two sync commits were then made and the walk re-run.
- **Files modified:** `.planning/STATE.md` (HAOO `9eec11e`), `../ZERO-PAPERHUB/.planning/STATE.md` (`83cb386`)
- **Verification:** Re-run walk at 13:07:25Z reports 0 ZPH-only, 0 differing across 233 comparisons.
- **Committed in:** `9eec11e`, `83cb386`

**2. [Rule 3 - Blocking] Task 1's precondition ("`git status --short` is clean in both") was unmet**

- **Found during:** Task 1, before the first walk
- **Issue:** HAOO carried uncommitted `.planning/STATE.md` and `.planning/milestone.lock`. These were the orchestrator's own `state.begin-phase` write recording Phase 5 execution start — not pre-existing drift, as the coordinator confirmed.
- **Fix:** Committed them as `9eec11e`, which cleared the precondition and satisfied task 1's own acceptance criterion that the checkout carry no modification after the commit.
- **Verification:** `git status --short` empty before the walk.
- **Committed in:** `9eec11e`

**3. [Environmental — not a code deviation] Harness permission denial on the destructive commands**

- **Found during:** Task 2
- **Issue:** Claude Code's auto-mode permission classifier denied `git rm -r --quiet .planning`, then denied a follow-up read-only `git status` on the sibling, then denied writing a reviewable script containing the commands.
- **Fix:** Stopped rather than routing around the denial, and surfaced the exact commands with the composed commit body. The owner authorised them and the orchestrator executed all three. The gate was run and exited 0 in the executor context before the denial, so the authorising sequence was not weakened.
- **Verification:** Task 2 `<verify><automated>` exits 0 — directory absent from disk and index, sibling carries no modification, authorising integers still read 0.
- **Committed in:** `dfdb2e9` (removal), `76c34f6` (provenance recorded)

---

**Total deviations:** 1 escalated to the owner (Rule 4), 1 auto-fixed (Rule 3), 1 environmental permission gate.
**Impact on plan:** No scope creep. The escalation is the plan's prohibition working as designed — it existed precisely to stop an executor writing a convenient zero, and it did. All three tasks completed as written, gate and all.

## Issues Encountered

- **Task 1's `cmp` verification is unrunnable from now on, by design.** Its right-hand operand is what task 2 deleted. Both `cmp` checks were run before the removal and exited 0; that result is historical from this point. The two anchored `grep` assertions remain runnable indefinitely because the evidence file lives in HAOO — the authorisation for a one-way act stays auditable after the act, which is why the integers were written in machine-readable form. Recorded in the evidence file rather than left for a later reader to discover as a broken check.
- **The duplication can return.** Removing `.planning/` ends today's duplication but nothing structural prevents recurrence: a `/gsd-*` command run with ZERO-PAPER HUB as the working directory would recreate the directory, and would do it silently, since the disjointness auditor excludes `.planning/` from every comparison and would keep exiting 0 beside a recreated tree. This is exactly how the `STATE.md` divergence arose in the first place. Recorded in the evidence file as a named risk with its mechanism.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Ready.** Every remaining Phase 5 plan has a stated working directory: the HAOO checkout, with the sibling reached as `../ZERO-PAPERHUB`, one checkout per repository, no git worktrees (D-04).
- Both repositories satisfy SPLT-01 on a fresh run, and nothing further in this phase will be authored into a tree that is about to vanish.
- **One thing to carry forward:** the phase's remaining plans create `playwright.config.ts`, `e2e/`, `evidence/` and a new CI workflow in HAOO. None of these are in the ratified 26-path `shared-scaffold.txt` allowlist and none should be added to it — D-08 is explicit that nothing is installed in the ZERO-PAPER HUB repository, and 04.2 was explicit that an allowlist entry is never added because "both halves need it".

---
*Phase: 05-prove-the-deployed-journey*
*Completed: 2026-09-07*
