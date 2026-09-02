---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
plan: 11
subsystem: reporting
tags: [path-parsing, filesystem-capability, unc, windows, posix, vitest, tdd]

# Dependency graph
requires:
  - phase: 04-report-and-enrich-the-haoo-funnel-truthfully (plan 04-10)
    provides: "First-run directory creation before exclusive temp reservation, and the five-row DIRECTORY_EXTRACTION_TABLE this plan extends"
provides:
  - "`directoryOf` selects its separator set from the destination's shape, so a backslash inside a POSIX filename is never treated as a separator"
  - "A bare-root guard covering both root families: drive designator (`C:`) and UNC server/share roots (`\\\\server`, `\\\\server\\share`)"
  - "A twelve-row directory-extraction contract table pinning every destination shape the verifier and reviewer probed"
affects: [report generation CLI, any future change to destination handling in src/reporting/generate.ts]

# Actuals (#2632) — estimateTokens scale (chars/4 over the files actually changed)
actuals:
  tokens: 20254
  tasks: 2
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Destination-shape-selected parsing: the separator set is a property of the input, not of the module"
    - "Root-refusal guard: extraction returns the empty string rather than handing a filesystem root to a recursive creation"

key-files:
  created: []
  modified:
    - src/reporting/generate.ts
    - src/test/haoo-report.test.ts

key-decisions:
  - "Only a destination beginning with an ASCII-letter drive designator or two backslashes is split on a backslash; every other destination is split on a forward slash alone, which is exactly the pre-04-10 POSIX behaviour"
  - "The shape classifier stays module-private — exporting it would create a second seam a caller could pass a hand-built value into"
  - "The UNC guard matches root forms only (`\\\\server`, `\\\\server\\share`); a destination carrying a third segment still yields its real parent"
  - "A trailing-separator destination such as `/virtual/.reports/` is deliberately not added to the table — the reviewer found it acceptable, 04-VERIFICATION.md does not list it as missing, and it is not a destination the owner command or the exported function is documented to accept"
  - "`requirements-completed` is left empty: this plan's prohibitions forbid promoting any requirement status, and MEAS-01/MEAS-08 both retain open human gates in 04-VERIFICATION.md"

patterns-established:
  - "Regression rows are added to the contract table before the production change, so a regression is demonstrated by the suite rather than asserted in prose"
  - "Every new group of table rows carries a recorded revert check, so no group can be vacuous"

requirements-completed: []  # Deliberately empty — see Decisions Made. Plan prohibition: no requirement status may be promoted; MEAS-01 and MEAS-08 both retain open human gates.

coverage:
  - id: D1
    description: "The two POSIX destination shapes 04-10 regressed produce their pre-04-10 results again: `/home/u/.reports/re\\port.html` yields `/home/u/.reports`, and `out\\report.html` yields no directory at all"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#report output directory extraction > creates the expected directory for the 'POSIX destination whose filename contains a backslash'"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#report output directory extraction > creates the expected directory for the 'relative POSIX destination whose filename contains a backslash'"
        status: pass
    human_judgment: false
  - id: D2
    description: "The separator set is chosen from the destination's shape, so only a drive designator or a UNC prefix makes a backslash a separator"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#report output directory extraction (12-row DIRECTORY_EXTRACTION_TABLE)"
        status: pass
      - kind: other
        ref: "revert check: restoring the unconditional two-separator maximum fails exactly the two new POSIX rows"
        status: pass
    human_judgment: false
  - id: D3
    description: "The 04-10 Windows fix still holds: `C:\\project\\.reports\\haoo-funnel-report.html` yields `C:\\project\\.reports` with exactly one creation, and `c:/project/.reports/haoo.html` yields `c:/project/.reports`"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#report output directory extraction > 'Windows-style destination' and 'mixed-separator destination under a drive designator'"
        status: pass
    human_judgment: false
  - id: D4
    description: "No bare filesystem root reaches the injected `mkdirSync`: bare drive designator, drive-relative, bare UNC server root and bare UNC share root each yield no directory, while a destination nested below a share yields its real parent"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#report output directory extraction > 'drive-root destination', 'drive-relative destination', 'bare UNC server root destination', 'UNC share root destination', 'destination nested below a UNC share'"
        status: pass
      - kind: other
        ref: "revert check: removing only the UNC clause of the bare-root guard fails exactly the two UNC root rows"
        status: pass
    human_judgment: false
  - id: D5
    description: "Wherever a directory is created, the creation is recorded strictly before the temporary sibling is exclusively reserved, and the report is written only after all four periods validate"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#report output directory extraction (directoryIndex < reservationIndex assertion on every creating row)"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#all four reporting periods"
        status: pass
    human_judgment: false
  - id: D6
    description: "MEAS-01 concurrency remains proven fail-closed by the shipped exclusive-reservation, real-filesystem rename, partial-write and concurrent-loser cases, carried not duplicated, with expectations byte-identical"
    requirement: "MEAS-01"
    verification:
      - kind: integration
        ref: "src/test/haoo-report.test.ts (real-filesystem rename, partial-write, concurrent-loser cases) — `git diff 479f43b -- src/test/haoo-report.test.ts` shows a single additive hunk, 35 insertions, 0 deletions"
        status: pass
    human_judgment: false
  - id: D7
    description: "MEAS-08 remains truthful: this plan changes no report copy and promotes no requirement status; live report reconciliation against the raw provider dashboard remains the open human gate"
    requirement: "MEAS-08"
    verification: []
    human_judgment: true
    rationale: "MEAS-08 is a vocabulary-and-honesty requirement whose open gate is a live reconciliation against the provider dashboard. No automated check can stand in for the owner reading the live report; the deterministic edge probe row for MEAS-08 is deliberately left unresolved and carried by plan 04-13."

# Metrics
duration: 10 min
completed: 2026-09-02
status: complete
---

# Phase 04 Plan 11: Destination-Shape Separator Selection and UNC Root Guard Summary

**`directoryOf` now picks its separator set from the destination's own shape — restoring the POSIX extraction 04-10 regressed while keeping the Windows fix — and refuses both families of bare filesystem root, pinned by a twelve-row contract table with recorded revert checks.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-09-02T10:30:00Z
- **Completed:** 2026-09-02T10:40:00Z
- **Tasks:** 2 (each a full RED → GREEN cycle)
- **Files modified:** 2

## Accomplishments

- Restored the two POSIX destination shapes the verifier recorded as regressed. `/home/u/.reports/re\port.html` yields `/home/u/.reports` again, and `out\report.html` yields no directory at all again.
- Made the separator set a property of the destination rather than of the module: only a destination beginning with an ASCII-letter drive designator or two backslashes is searched for a backslash. On POSIX, where a backslash is a legal filename character, it can no longer be mistaken for a separator.
- Extended the bare-root guard from drive designators to both UNC root forms, while proving with a positive row that it refuses roots rather than UNC destinations generally.
- Grew `DIRECTORY_EXTRACTION_TABLE` from five rows to twelve, carrying every shape the verifier and reviewer probed — including the two that regressed invisibly.
- Rewrote the `directoryOf` docstring so it states the rule the code implements and the three shapes that deliberately yield no directory.

## Task Commits

Each task ran a full RED → GREEN cycle and was committed atomically:

1. **Task 1 RED: failing rows for the regressed POSIX extraction** - `0d4e624` (test)
2. **Task 1 GREEN: destination-shape separator selection** - `062f1ab` (fix)
3. **Task 2 RED: failing UNC-root rows plus drive-relative row** - `43b6404` (test)
4. **Task 2 GREEN: UNC bare-root guard and rewritten docstring** - `9587fad` (fix)

No REFACTOR commit was needed — the GREEN implementations are the final shape in both cases.

## RED evidence (recorded, not asserted)

**Task 1** — with the three rows added and the production module untouched, the suite reported 2 failed | 126 passed (128):

- `'POSIX destination whose filename contains a backslash'` — expected `/home/u/.reports`, **received `/home/u/.reports/re`**.
- `'relative POSIX destination whose filename contains a backslash'` — expected `[]`, **received one `mkdirSync` for `out`** with `{ recursive: true }`.

These are byte-for-byte the pairs `04-VERIFICATION.md` gap 1 recorded as the regression. The mixed-separator row `c:/project/.reports/haoo.html` passed immediately, as expected — it is a preservation row, not a regression row.

**Task 2** — with the four rows added and the guard not yet extended, the suite reported 2 failed | 130 passed (132):

- `'bare UNC server root destination'` — expected `[]`, **received one `mkdirSync` for `\\server`**.
- `'UNC share root destination'` — expected `[]`, **received one `mkdirSync` for `\\server\share`**.

The nested-UNC row and the drive-relative row passed immediately: the nested case was already correct, and `C:haoo.html` already fell out through the `separator <= 0` early return.

## Revert (non-vacuity) checks

Both were run, and both observed failures are recorded here rather than assumed:

- **Task 1 guard reverted** (restoring the unconditional `Math.max(lastIndexOf('/'), lastIndexOf('\\'))`): 2 failed | 126 passed (128) — exactly the two new POSIX rows, no others.
- **Task 2 guard reverted** (dropping only the UNC clause, leaving `bareRoot` as the drive-designator test alone): 2 failed | 130 passed (132) — exactly the two UNC root rows, no others.

Neither new group of rows is vacuous.

## Verification results (real tree, exclusion-flagged)

Counts below are from the exclusion-flagged command, not from a bare `npm test` that would also collect the stale `.claude/worktrees/` copy:

- `npm run build` — exit 0. The `dist` freshness contract in `src/test/build-output.test.ts` holds after two production source inputs changed mtime.
- `npx vitest run --exclude '**/.claude/worktrees/**' --exclude '**/node_modules/**'` — **11 test files, 501 tests, all passing.** The report suite alone carries 132 tests, of which 12 are the directory-extraction table.
- `npm run typecheck` — exit 0.
- `npm run lint` — exit 0.
- `node scripts/verify-phase4-coverage.mjs .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/COVERAGE.md` — exit 0, "Phase 4 coverage audit passed: 41 required capabilities across 3 tables", with `git diff` showing `COVERAGE.md` unchanged.
- `git diff --stat 479f43b -- src` — exactly two files: `src/reporting/generate.ts` (+25/-6 combined) and `src/test/haoo-report.test.ts` (+35/-0).

## Files Created/Modified

- `src/reporting/generate.ts` — `directoryOf` classifies the destination shape before choosing a separator set, and its bare-root guard now refuses a bare UNC server root and a bare UNC share root alongside a bare drive designator. The docstring states both rules. No Node module import was added; the module still contains zero `node:`/`fs`/`path` imports and every filesystem effect still arrives through the injected `ReportFs` capability.
- `src/test/haoo-report.test.ts` — `DIRECTORY_EXTRACTION_TABLE` grew from five rows to twelve, purely additively. The diff is a single hunk with 35 insertions and 0 deletions, so no existing case had an expectation edited.

## Decisions Made

- **Windows-shape test is `/^([A-Za-z]:|\\\\)/`.** A drive designator or a UNC prefix are the only two shapes where a backslash is unambiguously a separator. Everything else, including every POSIX path, is split on a forward slash alone.
- **The classifier stays inline and module-private.** The plan explicitly forbids exporting it; an exported classifier would become a second seam a caller could pass a hand-built value into, widening the very trust boundary this change narrows.
- **The UNC guard is `/^\\\\[^\\/]+(?:\\[^\\/]+)?$/`.** It matches two backslashes, a server name, and at most one further backslash-plus-share. A third segment fails the anchor, so a nested UNC destination keeps yielding its real parent — proven by the positive `\\server\share\.reports` row rather than left to inspection.
- **Trailing-separator destinations are out of scope, by record.** `04-REVIEW.md` IN-05 probed `/virtual/.reports/` and found it acceptable, and `04-VERIFICATION.md` does not list it among the missing rows. Adding it would require the harness to write to a path ending in a separator, which is not a destination the owner command or the exported function is documented to accept. Recorded here as a decision, not omitted silently.
- **`requirements-completed` is empty on purpose.** The summary template calls the field required and says to copy the plan's `requirements` array verbatim, but this plan's prohibitions forbid promoting any requirement checkbox or status, and both MEAS-01 and MEAS-08 retain open human gates in `04-VERIFICATION.md` (production privacy approval and live event uniqueness for MEAS-01; live report reconciliation for MEAS-08). Where the template and the plan contract conflict, the plan contract wins — claiming completion here would be exactly the kind of untrue status this phase exists to prevent. The `requirements.mark-complete` step was correspondingly skipped.

## Deviations from Plan

### Auto-fixed Issues

None. Both tasks executed exactly as written, in the order written, with no bug, missing-critical, or blocking deviation encountered.

The one documented departure is the `requirements-completed` decision above, which is a resolution of a template-versus-plan-contract conflict in favour of the plan's explicit prohibition — not an unplanned code change. No production behaviour differs from what the plan specified.

---

**Total deviations:** 0 auto-fixed.
**Impact on plan:** None. The realized diff is confined to the two files the plan named, and every acceptance criterion was met without a fix cycle.

## Issues Encountered

None. Both RED phases failed for exactly the predicted reasons and with exactly the predicted recorded arguments, and both GREEN phases passed on the first implementation.

One observation worth carrying forward: `.planning/STATE.md` was already modified in the working tree when this plan started (the orchestrator's execution-start write, flipping status to `executing`). It was left untouched by every task commit and is included only in this plan's metadata commit.

## Known Stubs

None. No hardcoded empty value, placeholder string, `TODO`, `FIXME`, or unwired data source was introduced. No test was skipped and every `<verify>` command in the plan was run.

## Threat Flags

None. The change narrows what can be created on the host filesystem and introduces no new network endpoint, auth path, file-access pattern, or schema change. Threat T-04-47 (information disclosure) remains accepted and unweakened: `src/reporting/generate.ts` still carries no Node import, no analytics origin, no query path and no credential variable name, and the credential-and-provider-origin boundary case passes unmodified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Gap 1 of `04-VERIFICATION.md` is closed: the recorded POSIX regression is restored and pinned, the separator set is selected from the destination shape, and the bare-root guard covers both root families.
- Plans 04-12 and 04-13 remain outstanding in this gap-closure round. This plan touches no file either of them is scoped to.
- Open human gates are untouched and still open: production privacy approval and live event uniqueness (MEAS-01), and live report reconciliation against the raw provider dashboard (MEAS-08). The unresolved MEAS-08 edge-probe row is carried by plan 04-13, as flagged in the plan.

---
*Phase: 04-report-and-enrich-the-haoo-funnel-truthfully*
*Completed: 2026-09-02*

## Self-Check: PASSED

All modified files exist on disk and all five commits (`0d4e624`, `062f1ab`, `43b6404`, `9587fad`, `8ea7afa`) are present in git history.
