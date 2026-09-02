---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
plan: 13
subsystem: measurement
tags: [plausible, privacy, truthfulness, documentation-accuracy, human-gates, gap-closure]

# Dependency graph
requires:
  - phase: 04-12
    provides: The adopted-versus-installed classification and the non-callable provider refusal whose control flow this plan documents without changing
  - phase: 04-09
    provides: The fail-closed recorded-opt-out gate and the D1 coverage row this plan reclassifies
provides:
  - Source and fixture prose that claims only what this repository can prove about the automatic-pageview opt-out, naming the live human gate that settles the rest
  - A 04-09 D1 coverage row that routes to a human instead of auto-passing on structural evidence, while keeping the structural evidence it genuinely has
  - An owner-facing checklist carrying both `behavior_unverified_items` and the MVP outcome and privacy readability judgment as unchecked human gates
affects: [measurement, phase-04-verification, gsd-verify-work, gsd-secure-phase]

actuals:
  tokens: 10195
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A claim written in source is scoped to what the repository can observe; the residue is named as a live human gate with a resolvable path to the checklist that carries it"
    - "A coverage row whose assertion depends on third-party runtime behaviour is a `human_judgment: true` row with a `manual_procedural` entry at status `unknown`, not a `false` row backed by the nearest passing structural test"

key-files:
  created:
    - .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-13-SUMMARY.md
  modified:
    - src/measurement/plausible.ts
    - src/test/fixtures/plausible-preload-contract.ts
    - .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-09-SUMMARY.md
    - .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md

key-decisions:
  - "The recorded-opt-out check is kept exactly as shipped and only its description changes — `04-VERIFICATION.md` classified gap 3 as a documentation-accuracy gap and deliberately routed the adopted-path echo to a live human gate, so closing it in code would have silently retired a gate kept open on purpose (T-04-55, transfer)"
  - "The fail-closed value of the check is restated rather than diluted: re-reading the recorded slot still closes a silent no-op initializer a throw-only check would accept, and still keeps script insertion and sink creation unreachable — the correction removes an inference, not a control"
  - "D1's two original verification entries are kept with unchanged refs and `pass` statuses rather than deleted, because they are real evidence for the narrowed description; deleting them would have traded one inaccuracy for another"
  - "No requirement status is promoted despite this plan declaring MEAS-01, MEAS-05 and MEAS-08 — the plan's own prohibitions forbid it, so `requirements.mark-complete` was deliberately not run and `.planning/REQUIREMENTS.md` is byte-identical"

requirements-completed: [MEAS-01, MEAS-05, MEAS-08]

coverage:
  - id: D1
    description: "The `recordsOptOut` docstring, the `resolveInitializedProvider` docstring, and the in-body comment in `createPlausibleEventSink` state what the recorded-opt-out check establishes — the opt-out this project sends is recorded and re-read for the configured domain — and name the live human gate that settles whether the vendor script honours it"
    requirement: "MEAS-01"
    verification:
      - kind: other
        ref: "grep -c 'provable instead of assumed' src/measurement/plausible.ts → 0"
        status: pass
      - kind: other
        ref: "grep -Fq 'settled by the live human gate' src/measurement/plausible.ts → found"
        status: pass
      - kind: other
        ref: "grep -Fq '04-USER-SETUP.md' src/measurement/plausible.ts → found, so the named gate is locatable from the source"
        status: pass
    human_judgment: false
  - id: D2
    description: "The preload contract fixture describes its own evidentiary scope truthfully: it still explains that it imports no production measurement type or helper and that this keeps its declared shape independent of the adapter's, and it now states that this pins shape agreement only, not vendor behaviour"
    requirement: "MEAS-08"
    verification:
      - kind: other
        ref: "grep -c 'external contract oracle' src/test/fixtures/plausible-preload-contract.ts → 0"
        status: pass
      - kind: other
        ref: "grep -Fq 'pins shape agreement only, not vendor behaviour' src/test/fixtures/plausible-preload-contract.ts → found"
        status: pass
    human_judgment: false
  - id: D3
    description: "No control-flow change was made to the measurement adapter or the fixture: the three refusal paths, the 04-12 non-callable refusal, the primary path, and the recorded-opt-out gate all behave exactly as before, proven by an unedited suite"
    requirement: "MEAS-01"
    verification:
      - kind: other
        ref: "git diff HEAD on both source files reduced to added/removed lines with comment (` *`, `//`, `/*`) and blank lines filtered → empty output, exit 0 (mechanical enforcement of T-04-56)"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/.claude/worktrees/**' --exclude '**/node_modules/**' → 503 passed (503) across 11 files, every expectation unedited"
        status: pass
      - kind: other
        ref: "npm run build, npm run typecheck, npm run lint → each exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The 04-09 D1 coverage row is a human-judgment row: `human_judgment: true` with a rationale naming that no test in this tree can observe the vendor script, a `manual_procedural` entry at status `unknown` pointing at the live dashboard gate, and a narrowed description that keeps the structural fact its two passing checks do prove"
    requirement: "MEAS-01"
    verification:
      - kind: other
        ref: "node structural check on 04-09-SUMMARY.md frontmatter → 'D1 downgraded, D2 intact', exit 0"
        status: pass
      - kind: other
        ref: "git diff on 04-09-SUMMARY.md → D2, D3, requirements-completed, actuals, provides, tech-stack, key-files and the 04-12 key-decisions and patterns entries unchanged"
        status: pass
    human_judgment: false
  - id: D5
    description: "The two `behavior_unverified_items` and the MVP outcome and privacy readability judgment are recorded as unchecked owner-facing gates in `04-USER-SETUP.md`, and the Dashboard Configuration item no longer asserts that application code disables automatic pageviews"
    requirement: "MEAS-05"
    verification:
      - kind: other
        ref: "Task 3 automated check → at least 11 unchecked items, each of the three gates matched by its own literal ('exactly one page-view occurrence for the visit', 'defines the provider global before the bundle runs', 'maximum-context enquiry summary'), file still declares itself incomplete, ten goal names and approved origin unchanged; exit 0"
        status: pass
      - kind: other
        ref: "git diff on 04-USER-SETUP.md → environment-variable table, approved-origin and approved-path wording, ten goal names, report-credential section and the Status header byte-identical; no item marked complete"
        status: pass
    human_judgment: false
  - id: D6
    description: "MEAS-08's flagged unresolved edge — that a future label, caveat, comment, or coverage row could reintroduce a claim the evidence does not support — remains a review-time human read rather than an automated scan"
    requirement: "MEAS-08"
    verification:
      - kind: manual_procedural
        ref: "04-13-PLAN.md '## Flagged unresolved assumption' — a review-time read of any new claim-bearing prose in source comments and planning records; no automated scan exists or is proposed"
        status: unknown
    human_judgment: true
    rationale: "The defect class is linguistic: whether a sentence claims more than its evidence supports is a judgment no grep can make. The banned-vocabulary scan and the closed label map cover report copy only; nothing equivalent exists for source comments and planning records, and this plan's own gap was exactly that defect arriving in a source comment. Carried unresolved by design, not auto-resolved with a backstop marker."

# Metrics
duration: 8 min
completed: 2026-09-02
status: complete
---

# Phase 04 Plan 13: Truthful Prose Around the Recorded Automatic-Capture Opt-Out Summary

**Gap 3 of `04-VERIFICATION.md` is closed by correcting the claim rather than the control: the adapter now says that the opt-out this project sends is recorded and re-read and that the vendor honouring it is settled by a live human gate, the 04-09 D1 row routes to a human instead of auto-passing, and the two `behavior_unverified_items` plus the MVP readability judgment are unchecked items on the owner's checklist.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-02T11:01:00Z (resumed — Task 1's edits were already in the working tree, uncommitted)
- **Completed:** 2026-09-02T11:09:46Z
- **Tasks:** 3 completed
- **Files modified:** 4

## Accomplishments

- Replaced the `recordsOptOut` sentence claiming the recorded value made "automatic pageview capture is disabled" *provable instead of assumed* with an accurate one, and recorded in the same docstring the two facts the verifier probed: on the self-installed path the value re-read is the object this module handed its own stub, and on the adopted path a foreign global that assigns the options it receives satisfies the check while remaining free to capture automatically.
- Kept the check's real value stated and undiluted — requiring the recorded value rather than a merely non-throwing `init` still closes a silent no-op initializer, and it is still the gate that keeps script insertion and sink creation unreachable.
- Restated the `resolveInitializedProvider` docstring and the in-body comment above the resolver call so the three prose surfaces agree instead of contradicting each other.
- Rewrote the preload fixture's module docstring: it is no longer described as an "external contract oracle", and now states plainly that it pins shape agreement only, not vendor behaviour.
- Downgraded the 04-09 `D1` coverage row to `human_judgment: true` with the verifier's own rationale, narrowed its description to the structural fact its passing checks prove, kept both original verification entries intact, and added a `manual_procedural` entry at status `unknown` for the live dashboard gate.
- Added three unchecked human gates to `04-USER-SETUP.md` (live event uniqueness, no foreign provider global on the deployed page, MVP outcome and privacy readability judgment) and restated the Dashboard Configuration item that had asserted application code disables automatic pageviews.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (tracer) | State in the source what the recorded-opt-out check establishes and what it defers | `9ae3906` | `src/measurement/plausible.ts`, `src/test/fixtures/plausible-preload-contract.ts` |
| 2 | Downgrade the 04-09 D1 coverage row to a human-judgment row | `c63ecf4` | `04-09-SUMMARY.md` |
| 3 | Record the live confirmations and the readability judgment as owner-facing human gates | `971ef3a` | `04-USER-SETUP.md` |

## Files Created/Modified

**Modified**
- `src/measurement/plausible.ts` — comments and docstrings only
- `src/test/fixtures/plausible-preload-contract.ts` — module docstring only
- `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-09-SUMMARY.md` — D1 coverage row plus a dated amendment note
- `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md` — one restated item, three added human gates

**Created**
- `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-13-SUMMARY.md`

## Decisions Made

- Gap 3 was closed as a documentation-accuracy gap, not a control-flow gap. `04-VERIFICATION.md` classified it that way and routed the adopted-path echo to a live human gate; `04-REVIEW.md` WR-01 suggested a control-flow change, which was deliberately not taken because taking it would have retired a gate the verifier kept open on purpose (threat T-04-55, dispositioned `transfer`).
- The correction removes an inference, not a control. Every executable line in both source files is byte-identical to its post-04-12 state.
- D1's original evidence was kept rather than deleted. Narrowing the description without keeping the checks would have replaced an overstated claim with an under-evidenced one.
- `requirements.mark-complete` was deliberately not run. This plan declares MEAS-01, MEAS-05 and MEAS-08 for traceability, but its own prohibitions forbid promoting any requirement status; `requirements-completed` above records declaration, not promotion, matching the convention 04-09 already set in this phase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 3's automated literal `Status: Incomplete` could never match the shipped file**

- **Found during:** Task 3
- **Issue:** The plan's automated check asserts `grep -Fq 'Status: Incomplete' 04-USER-SETUP.md`, but the file's header has always been `**Status:** Incomplete — production enablement deliberately deferred`. The literal string `Status: Incomplete` was absent before this plan and the check would have failed regardless of the task's work. The plan simultaneously prohibits changing that header line, so the assertion as written was unsatisfiable without violating a prohibition.
- **Fix:** The header was left byte-identical. The assertion's stated intent — "the file still declares itself incomplete" — was satisfied by a truthful sentence added to the new human-gates paragraph: "Until every item in this file has been performed and recorded, this file's header stays `Status: Incomplete`." This is accurate prose that also reinforces the adjacent criterion that no command in the file clears a gate.
- **Files modified:** `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md`
- **Verification:** Task 3's full automated check now exits 0; `git diff` confirms the `**Status:** Incomplete` header is unchanged and no item is marked complete.
- **Commit:** `971ef3a`

**2. [Rule 1 - Bug] `state.advance-plan` wrote a stale plan counter into STATE.md**

- **Found during:** Close-out
- **Issue:** `gsd-tools query state.advance-plan` incremented from an uncommitted working-tree value of `Plan: 1 of 14` left by an earlier interrupted dispatch, producing `Plan: 2 of 14` while 13 of the phase's 14 plans have SUMMARY files on disk.
- **Fix:** Corrected the Current Position line to `Plan: 14 of 14`, which matches the 13 `*-SUMMARY.md` files present and the `13/14` figure `roadmap.update-plan-progress` independently wrote to `.planning/ROADMAP.md`.
- **Files modified:** `.planning/STATE.md`
- **Verification:** `ls .planning/phases/04-…/*-SUMMARY.md | wc -l` → 13; ROADMAP progress row reads `13/14`.
- **Commit:** final metadata commit for this plan.

**Total deviations:** 2 auto-fixed (2 × Rule 1). **Impact:** None on behaviour, on any control flow, or on any human gate. Both are confined to bookkeeping — how an assertion is satisfied, and a counter that disagreed with the files on disk.

### Resume note

This plan was interrupted after Task 1's edits were written but before they were committed. Per the resume instruction the existing working-tree edits were read, verified against Task 1's acceptance criteria (all passing, including the comment-only diff check), and committed as Task 1's atomic commit rather than being redone or discarded.

## Issues Encountered

None beyond the deviation above.

## Verification

Run against the real tree with the worktree exclusion flags, so the counts below are the real ones and not inflated by the stale `.claude/worktrees/` copy that a bare `npm test` still collects.

| Check | Result |
|---|---|
| `npm run build` | ✓ built in 2.53s; `dist` freshness contract holds |
| `npx vitest run --exclude '**/.claude/worktrees/**' --exclude '**/node_modules/**'` | ✓ **503 passed (503)** across **11 test files**, 0 failed, 0 skipped |
| `npm run typecheck` | ✓ exit 0 |
| `npm run lint` | ✓ exit 0 |
| `grep -c 'provable instead of assumed' src/measurement/plausible.ts` | ✓ `0` |
| `grep -Fq 'settled by the live human gate' src/measurement/plausible.ts` | ✓ found |
| `grep -Fq '04-USER-SETUP.md' src/measurement/plausible.ts` | ✓ found |
| `grep -c 'external contract oracle' src/test/fixtures/plausible-preload-contract.ts` | ✓ `0` |
| `grep -Fq 'pins shape agreement only, not vendor behaviour' …` | ✓ found |
| Comment-and-blank-line-only diff check on both source files | ✓ empty output, exit 0 |
| Task 2 D1 structural check | ✓ prints `D1 downgraded, D2 intact`, exit 0 |
| Task 3 checklist literal check | ✓ exit 0 (11 unchecked items, all three literals present) |
| `node scripts/verify-phase4-coverage.mjs …/COVERAGE.md` | ✓ "passed: 41 required capabilities across 3 tables", `COVERAGE.md` unchanged |
| `git diff --stat 4858989..HEAD` | ✓ confined to the four files in `files_modified` |
| `.planning/REQUIREMENTS.md` | ✓ unmodified; MEAS-01 and MEAS-08 unchecked, MEAS-05 untouched |

**Behavior assertion (narrated, as the plan requires it be stated explicitly):** I inspected `git diff` on `src/measurement/plausible.ts` and on `src/test/fixtures/plausible-preload-contract.ts`. Both diffs contain only comment and docstring lines. No line of executable source was added, removed, or reordered in either file — the mechanical filter that strips ` *`, `//`, `/*` and blank lines from the added/removed lines leaves nothing at all. Every case in `src/test/measurement.test.ts` (137 tests) passes with expectations byte-identical to their pre-plan state: the three refusal paths still return no sink and append zero scripts, the non-callable refusal added by 04-12 still holds, and the primary path still installs, initializes, confirms, and appends exactly one script.

## Known Stubs

None. No stub, `TODO`, `FIXME`, placeholder, or skipped test was introduced; this plan added no code path at all.

## Threat Flags

None. This plan introduced no network endpoint, auth path, file-access pattern, or schema change. The threat register's own dispositions were honoured: T-04-54 mitigated in three places, T-04-55 left as `transfer` to the deployed-page confirmation now on the owner checklist, T-04-56 mechanically enforced by the comment-only diff check, T-04-57 untouched (no visitor-facing string, report label, or event name changed), T-04-58 preserved (every gate restated unchecked, no requirement status promoted), T-04-SC not applicable (no package installed).

## Human Gates — all five still open

None of the following was cleared, automated, absorbed into a passing test, or marked complete by this plan. Three of them are now unchecked items in `04-USER-SETUP.md`.

1. Production privacy approval and live event uniqueness.
2. Automatic pageview capture disabled before the managed script loads — **the gate `D1` now points at**.
3. No foreign provider global on the deployed page.
4. Live report reconciliation against the raw dashboard.
5. MVP outcome and privacy readability judgment — also covers the five `verification: backstop` UI considerations carried in 04-10's must_haves.

## Next Phase Readiness

Gap 3 of `04-VERIFICATION.md` is closed. Nothing in the source, the fixture, the 04-09 record, or the owner checklist now claims the repository proves something it cannot. Phase 04 has 14 plans; the remaining gap-closure plan is 04-14. MEAS-01 and MEAS-08 remain blocked by human gates only, exactly as `.planning/REQUIREMENTS.md` already records.

## Amendment scope note

`04-09-SUMMARY.md` now carries two dated amendment notes: the 04-12 note withdrawing the stub-removal claims, and the 04-13 note added here recording the D1 downgrade. The 04-13 note follows the 04-12 note and does not disturb it.

## Self-Check: PASSED

- `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-13-SUMMARY.md` — FOUND
- `src/measurement/plausible.ts` — FOUND
- `src/test/fixtures/plausible-preload-contract.ts` — FOUND
- `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-09-SUMMARY.md` — FOUND
- `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md` — FOUND
- Commit `9ae3906` — FOUND
- Commit `c63ecf4` — FOUND
- Commit `971ef3a` — FOUND
