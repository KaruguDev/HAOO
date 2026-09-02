---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
plan: 10
subsystem: reporting
tags: [reporting, filesystem, cross-platform, path-parsing, vitest, requirements-governance]

# Dependency graph
requires:
  - phase: 04-07
    provides: The exclusive temporary-file reservation, owned-temp cleanup, and the report write sequence whose ordering this plan pins
  - phase: 04-08
    provides: The approved analytics script origin+path contract named as a closed code-level blocker in the requirement status note
  - phase: 04-09
    provides: The fail-closed provider initialization named as the second closed code-level blocker in the requirement status note
provides:
  - Separator-agnostic report output-directory extraction that works on a first run on any host (closes review warning WR-01)
  - A drive-root guard that refuses to recursively create a bare drive designator rather than turning a working run into a caught generation failure
  - A destination-path contract table pinning both the exact mkdirSync argument and its ordering strictly before reserveTempSync
  - A truthful Phase 4 requirement status record with a dated note naming the three human gates that remain open
affects: [phase-05-release-verification, gsd-verify-work-04, gsd-secure-phase]

actuals:
  tokens: 22448
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Host-path parsing stays inside the capability-injected module: no node:path import, so the credential-and-provider-origin boundary keeps holding"
    - "Ordered filesystem call log as a test capability, so call ORDER is assertable and not just call arguments"

key-files:
  created: []
  modified:
    - src/reporting/generate.ts
    - src/test/haoo-report.test.ts
    - .planning/REQUIREMENTS.md

key-decisions:
  - "Fixed directoryOf in place with Math.max over both separator indices instead of importing node:path or moving dirname to the CLI boundary as the reviewer suggested — importing a Node module into generate.ts would break the module's capability-injection design and the credential-and-provider-origin boundary case that depends on it"
  - "Added a drive-root guard (/^[A-Za-z]:$/) so a C:\\file.html destination records no directory call at all: asking the filesystem to recursively create a bare drive root is not a creation the report needs, and a refusal there would convert a working run into a caught generation-failed result"
  - "Promoted only MEAS-05, on the verifier's recorded SATISFIED finding — MEAS-01 and MEAS-08 stay unchecked and at Gaps Found because re-verification, not a gap-closure executor, owns that transition"
  - "Set requirements-completed to MEAS-05 only rather than copying the plan's full requirements array, because copying MEAS-01 and MEAS-08 would assert exactly the completion the plan's prohibitions forbid; the open IDs are recorded separately below"
  - "Skipped the automated `requirements mark-complete` step entirely: Task 2 governs REQUIREMENTS.md by hand and the automated verb would have promoted MEAS-01 and MEAS-08 against the plan's explicit instruction"

patterns-established:
  - "Destination-path contract table: one row per host path shape (POSIX nested, Windows-style, bare filename, POSIX root, drive root) with an explicit expected-directory outcome including null"
  - "Ordering assertions over a recorded call log: assert findIndex(mkdirSync) < findIndex(reserveTempSync) rather than trusting source reading order"

requirements-completed: [MEAS-05]
requirements-open: [MEAS-01, MEAS-08]

coverage:
  - id: D1
    description: "The documented owner command creates its output directory on a first run regardless of host path separator: a Windows-style destination yields a mkdirSync call for the correct parent directory before the temporary sibling is reserved, and POSIX behaviour is unchanged"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#report output directory extraction > creates the expected directory for the 'Windows-style destination'"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#report output directory extraction > creates the expected directory for the 'POSIX nested destination'"
        status: pass
    human_judgment: false
  - id: D2
    description: "A destination with no parent directory component skips directory creation instead of attempting to create a bare drive root or an empty path"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#report output directory extraction > creates the expected directory for the 'drive-root destination'"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#report output directory extraction > creates the expected directory for the 'bare filename destination'"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#report output directory extraction > creates the expected directory for the 'POSIX root-level destination'"
        status: pass
    human_judgment: false
  - id: D3
    description: "The MEAS-01 concurrency edge and the D-03 four-period write path stay proven: the exclusive-reservation, real-filesystem rename, partial-write, and concurrent-loser cases pass with unedited expectations"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "npm run test:unit -- --run src/test/haoo-report.test.ts (125 passed, 120 pre-existing unedited)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The generator carries no Node module import, no analytics origin, no query path, and no credential value, so the fix introduced no host-specific seam"
    requirement: "MEAS-08"
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#credential and provider-origin boundary"
        status: pass
    human_judgment: false
  - id: D5
    description: "MEAS-05's requirement row and checklist entry reflect the verifier's SATISFIED finding, and MEAS-01 and MEAS-08 remain unchecked with an explicit dated note naming the exact human gates that still block them"
    requirement: "MEAS-05"
    verification:
      - kind: other
        ref: "grep -Fq -e '- [x] **MEAS-05**' && grep -Fq -e '- [ ] **MEAS-01**' && grep -Fq -e '- [ ] **MEAS-08**' && test \"$(grep -c '^| MEAS-05 | Phase 4 | Complete |$' .planning/REQUIREMENTS.md)\" = \"1\""
        status: pass
    human_judgment: false
  - id: D6
    description: "Production privacy approval and live event uniqueness — approve the processor, create the exact ten goals, configure the trusted script and site values, deploy, and perform each explicit action once"
    requirement: "MEAS-01"
    verification: []
    human_judgment: true
    rationale: "Requires a real processor approval, a real dashboard, and a real deployed site. No executor can perform or assert it; recorded as an open human gate in REQUIREMENTS.md rather than converted into an automated criterion."
  - id: D7
    description: "Live report reconciliation — run the documented command with the approved site and key, compare 7/30/90/all-time counts and dates against the raw dashboard, and reopen the HTML offline"
    requirement: "MEAS-08"
    verification: []
    human_judgment: true
    rationale: "Reconciliation against a live provider dashboard requires production credentials and human comparison of counts the fixture suite cannot stand in for."
  - id: D8
    description: "MVP outcome and privacy readability judgment — the report, the disclosure, and the maximum-context engagement summary at 320px and 200% zoom with keyboard and screen-reader use; also covers the five carried backstop UI considerations (E1, E2, E3, E4, E7 long-text)"
    verification: []
    human_judgment: true
    rationale: "Readability, wrapping without clipping or overlap, and the absence of a progression claim in prose are human judgments; the five backstop UI considerations carried in this plan's must_haves attach here rather than being dropped."

duration: 7 min
completed: 2026-09-02
status: complete
---

# Phase 04 Plan 10: Truthful Requirement Status and Cross-Host Report Directory Creation Summary

**Separator-agnostic `directoryOf` with a drive-root guard, pinned by a five-row destination-path contract table that also asserts creation-before-reservation ordering, plus a Phase 4 requirement record that promotes only MEAS-05 and names the three human gates still holding MEAS-01 and MEAS-08 open.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-02T05:36:00Z
- **Completed:** 2026-09-02T05:43:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Closed review warning WR-01: `directoryOf` now takes the last index of either a forward slash or a backslash, so the destination Node's platform-native `resolve` hands over on a non-POSIX host is parsed correctly and a first `npm run report:haoo` run creates `.reports` instead of failing before it can write.
- Added a drive-root guard so `C:\haoo-funnel-report.html` records no directory call at all — recursively creating a bare drive designator is not a creation the report needs, and a refusal there would have turned a working run into a caught `generation-failed`.
- Pinned the behaviour with a five-row destination-path contract table driven through a recording `ReportFs` that logs every call in order, asserting both the exact `mkdirSync` argument pair and that its index strictly precedes `reserveTempSync`.
- Made the Phase 4 requirement record truthful: MEAS-05 checked and `Complete` on the verifier's `MEAS-05 ✓ SATISFIED` finding, MEAS-01 and MEAS-08 left unchecked at `Gaps Found`, and a dated note naming the two code-level blockers closed by 04-08/04-09 and the three human gates that remain.

## Task Commits

Each task was committed atomically:

1. **Task 1: Make report output-directory creation work on a first run on any host** (TDD)
   - RED — `15a86ed` (test): destination-path contract table added; the Windows-style row failed with `expected [] to deeply equal [ { op: 'mkdirSync', args: [ 'C:\project\.reports', { recursive: true } ] } ]` while the other four rows passed.
   - GREEN — `97cf6c6` (fix): separator-agnostic extraction plus the drive-root guard; all 125 cases pass.
   - REFACTOR — none needed; the change is a four-line parser with a documenting comment.
2. **Task 2: Record truthful Phase 4 requirement status and the human gates that remain open** - `63fdbe3` (docs)

**Plan metadata:** committed with this SUMMARY (docs: complete plan)

## Files Created/Modified

- `src/reporting/generate.ts` - `directoryOf` now uses `Math.max(lastIndexOf('/'), lastIndexOf('\\'))`, returns `''` for a separator at index zero, and returns `''` for a bare drive designator matched by `/^[A-Za-z]:$/`. The write sequence, the exclusive reservation, the ownership flag, the rename, and the owned-temp cleanup are untouched. Still no Node module import.
- `src/test/haoo-report.test.ts` - Added a `report output directory extraction` describe block: a `DIRECTORY_EXTRACTION_TABLE` of five destinations with expected directory outcomes, and a `recordingFs()` capability that keeps an ordered call log. The existing real-filesystem rename, partial-write, and concurrent-loser cases were not edited.
- `.planning/REQUIREMENTS.md` - MEAS-05 checklist entry checked and its table row changed to `Complete`; a dated 2026-09-02 status note added immediately after the Privacy-First Measurement checklist. The pre-existing MEAS-08 `redirect returns` amendment note is byte-identical.

## Decisions Made

- **Rejected the reviewer's suggested fix shape.** WR-01 suggested using Node's `dirname` at the CLI boundary or injecting a path adapter. Both were declined: `generate.ts` is designed so every filesystem effect arrives through the injected `ReportFs`, and the credential-and-provider-origin boundary case depends on the file staying free of host-specific seams. A four-line separator-agnostic parser fixes the defect without adding a seam. The plan's `<action>` specified this shape and it was followed exactly.
- **Drive-root guard rather than drive-root creation.** `C:` is not a directory the report needs, and `mkdirSync('C:', { recursive: true })` failing would be caught by the generator and reported as `generation-failed` — a working run degraded by an unnecessary call.
- **`requirements-completed` deliberately lists only MEAS-05.** The SUMMARY template asks for the plan's full `requirements` array verbatim, but this plan's prohibitions forbid marking anything complete these gap-closure plans do not prove. MEAS-01 and MEAS-08 are recorded under `requirements-open` instead so the machine-readable record cannot be misread as closure. This is the plan's directive taking precedence over the template convention, not a lapse.
- **The automated `requirements mark-complete` step was skipped.** With MEAS-01/MEAS-05/MEAS-08 all released by the shared-ID gate on this last declaring plan, running the verb would have flipped MEAS-01 and MEAS-08 to complete against the plan's explicit instruction. Task 2 wrote the requirement record by hand instead, and its automated check passes.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0
**Impact on plan:** No auto-fixes were needed. The one judgment call — skipping the automated requirements-marking step in favour of Task 2's hand-written record — is compliance with the plan's prohibitions, not a departure from them.

## Verification Results

| Check | Result |
|---|---|
| `npm run test:unit -- --run src/test/haoo-report.test.ts` | PASS — 125 passed (120 pre-existing unedited + 5 new contract rows) |
| `npm run typecheck` | PASS — exit 0 |
| `npm run lint` | PASS — exit 0 |
| `npm run build` | PASS |
| Full suite (`npx vitest run --exclude '**/.claude/worktrees/**' --exclude '**/node_modules/**'`) | PASS — 494 passed across 11 files |
| `node scripts/verify-phase4-coverage.mjs .../COVERAGE.md` | PASS — 41 required capabilities across 3 tables, exit 0 |
| Non-vacuousness of the new coverage | PROVEN — commit `15a86ed` ran with the old `directoryOf` and the Windows-style row failed; only the `97cf6c6` parser change turns it green |
| REQUIREMENTS.md automated check (Task 2 `<verify>`) | PASS |
| `git diff .planning/REQUIREMENTS.md` scope | Confined to the MEAS-05 entry, the MEAS-05 table row, and the added note; Coverage totals still read 32 total / 32 mapped / 0 unmapped |

## Known Stubs

None. No placeholder value, empty data source, or unwired component was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern, or trust-boundary schema change was introduced. `T-04-39` (denial of service via non-POSIX host path) and `T-04-43` (elevation of privilege via recursive creation) are mitigated as planned; path traversal generally remains canon and referred to `/gsd-secure-phase`.

## Issues Encountered

- The environment's `grep` is `ugrep`, which parses a leading `- [x] ...` pattern as an option. The plan's Task 2 `<verify>` command needed `grep -Fq -e '<pattern>'` to run here. This is a host tooling quirk, not a change to the check's meaning — the same four assertions were evaluated and all passed.

## Open Human Gates (carried, not closed)

These are recorded in `.planning/REQUIREMENTS.md` and must not be converted into automated criteria:

1. **Production privacy approval and live event uniqueness** (blocks MEAS-01) — approve the processor, create the exact ten goals, configure the trusted script and site values, deploy, and perform each explicit action once. Expect one name-only event per action, no automatic duplicate, and no form or context property.
2. **Live report reconciliation** (blocks MEAS-08) — run the documented command with the approved site and key, compare 7/30/90/all-time counts and dates against the raw dashboard, and reopen the HTML offline. Expect exact site and range counts, literal evidence labels, no external request, and no credential exposure.
3. **MVP outcome and privacy readability judgment** — review one maximum-context enquiry and the report and disclosure at 320px and 200% zoom with keyboard and screen-reader use. This gate also carries the five backstop UI considerations from this plan's `must_haves` (period labels at E1, stage clarifiers at E2, the longest event label at E3, the caveat and metadata line at E4, and the maximum-length summary at E7).

## Flagged Unresolved Assumption (carried from the plan)

The deterministic edge probe left one **unclassified** row for **MEAS-08**. It is a vocabulary-and-honesty requirement rather than a data-shape one, so the shape taxonomy has no category for it; its real edge is linguistic. Plans 04-01 through 04-03 already pin the closed label map, the authored caveat block, the banned-vocabulary scan, and the zero-percent-sign contract, so the edge is represented by existing coverage. No new task was created. If a stronger guarantee is wanted, the natural follow-up is a review-time human read of any new report copy, not another automated scan.

Separately: `04-UI-SPEC.md` `## UI Considerations` states *"4 resolved (backstop)"* but its tables contain **five** backstop rows (E1, E2, E3, E4, and E7 `long-text`). All five are carried above. The header count is off by one and should be corrected the next time that document is edited; no plan here modifies the UI-SPEC.

## User Setup Required

None - no external service configuration is required by this plan. (The production analytics configuration named in the open human gates above is Phase 4's pre-existing deferred setup, not new work introduced here.)

## Next Phase Readiness

- Phase 4's gap-closure run is complete: 04-08 closed the script-origin path, 04-09 made provider initialization fail closed, and 04-10 fixes the last review warning and makes the recorded requirement status truthful.
- **The next canonical action is `/gsd-verify-work 04`.** It owns the MEAS-01 and MEAS-08 transitions; no box may be checked for either until it confirms the code-level closure and the three human gates above are cleared.
- No blocker prevents re-verification from starting. The remaining work is human-gate work that requires a deployed site, an approved processor, and production credentials.

---
*Phase: 04-report-and-enrich-the-haoo-funnel-truthfully*
*Completed: 2026-09-02*

## Self-Check: PASSED

All modified files exist on disk and all four commits (`15a86ed`, `97cf6c6`, `63fdbe3`, `ed7ed7a`) are present in git history.
