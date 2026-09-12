---
phase: 05-prove-the-deployed-journey
plan: 15
subsystem: testing
tags: [ci, github-actions, vitest, split, gates, qual-05, splt-01]

requires:
  - phase: 05-prove-the-deployed-journey
    provides: "05-05 (the plan this depends on); 05-01's rule that nothing is ever added to the shared allowlist"
  - phase: 04.2-split-haoo-into-its-own-repository-and-domain
    provides: "the expected-red gate in both trees (D6/D12), the 26-entry shared-scaffold allowlist, the byte-identical disjointness auditor"
provides:
  - "scripts/assert-phase1-contracts.mjs + npm run test:phase1:contracts in BOTH repositories, the named successor to the withdrawn expected-red gate: exit 1 -> exit 0 on both sides"
  - ".github/workflows/verify-split.yml: SPLT-01 audited on every HAOO push and pull request, plus a cmp of the two allowlists"
  - "05-EVIDENCE-GATES.md: the owner decision, measured before/after exit codes, retained marker sets, the origin-disagreement measurement and the push order"
affects: [05-14, 05-16, 05-17, phase-5-verification, zero-paper-hub]

actuals:
  tokens: 9265
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "A gate that asserts GREEN counts its marker only on a green reporter line, because a skipped case prints its name and exits 0"
    - "A CI job that reads a sibling repository clones it anonymously beside the workspace, prints the SHA it audited, and has no step that may pass on error"

key-files:
  created:
    - scripts/assert-phase1-contracts.mjs
    - ../ZERO-PAPERHUB/scripts/assert-phase1-contracts.mjs
    - .github/workflows/verify-split.yml
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-GATES.md
  modified:
    - package.json
    - ../ZERO-PAPERHUB/package.json
    - shared-scaffold.txt
    - ../ZERO-PAPERHUB/shared-scaffold.txt
    - .planning/phases/04.2-split-haoo-into-its-own-repository-and-domain/04.2-SPLIT-CONTRACT.md
    - .planning/phases/04.2-split-haoo-into-its-own-repository-and-domain/04.2-DEFERRED-ITEMS.md
  deleted:
    - scripts/assert-phase1-red.mjs
    - ../ZERO-PAPERHUB/scripts/assert-phase1-red.mjs

key-decisions:
  - "D-16 resolved by the owner as invert-rename. Successor scripts/assert-phase1-contracts.mjs / test:phase1:contracts: owner-selected, orchestrator-proposed"
  - "Only the required exit status inverted; suites, markers (HAOO 3, ZPH 1) and the 8-signature rejection list byte-unchanged; the marker check now requires a green line so a skipped case cannot satisfy it"
  - "verify-split.yml adds a cmp of the two allowlists after the unchanged verify:disjoint, because the auditor alone exits 0 when the origins disagree (26 entries, 25 subtracted)"
  - "Allowlist changes are pushed ZERO-PAPER HUB first, then HAOO: the workflow runs on HAOO events and clones the sibling's main tip at run time"

patterns-established:
  - "Withdraw with a named successor: the script header records what was removed, by which plan, the successor, and the byte-unchanged guarantees"
  - "Renaming an allowlisted path is an edit to the ratified entry in both copies in the same change, and the count does not move"

requirements-completed: []

coverage:
  - id: D1
    description: "The expected-red Phase 1 gate is withdrawn in both repositories with a named successor that exits 0, keeping the rejection list and each side's marker set"
    requirement: QUAL-05
    verification:
      - kind: other
        ref: "HAOO: npm run test:phase1:contracts (exit 0; before, test:phase1:red exit 1)"
        status: pass
      - kind: other
        ref: "ZERO-PAPERHUB: npm run test:phase1:contracts (exit 0; before, test:phase1:red exit 1)"
        status: pass
      - kind: other
        ref: "diff of suites/expectedMarkers/forbiddenInfrastructureFailures against each pre-change file (exit 0 both)"
        status: pass
      - kind: unit
        ref: "scratchpad probe of phase1ContractFailure: 10 probes, 0 unexpected"
        status: pass
    human_judgment: false
  - id: D2
    description: "Shared allowlist renamed byte-identically in both repositories, still 26 entries, disjointness exits 0 on both sides"
    requirement: QUAL-05
    verification:
      - kind: other
        ref: "cmp shared-scaffold.txt ../ZERO-PAPERHUB/shared-scaffold.txt (exit 0)"
        status: pass
      - kind: other
        ref: "npm run verify:disjoint in both checkouts (exit 0; 26 shared / 26 subtracted / 0 violations / 0 converged)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Tree disjointness runs in CI on every HAOO push and pull request, failing visibly on a failed clone or a disagreeing allowlist"
    requirement: QUAL-05
    verification:
      - kind: other
        ref: "Task 3 automated verify: no continue-on-error, verify:disjoint and git clone present; house action/Node values match deploy.yml; YAML parses"
        status: pass
      - kind: other
        ref: "first GitHub Actions run of verify-split.yml, which cannot exist before the orchestrator's push"
        status: unknown
    human_judgment: true
    rationale: "No CI run can be observed before the push, and the push belongs to the orchestrator. The run identifier, conclusion and verbatim CI success line are left pending in 05-EVIDENCE-GATES.md section 4. If the run fails for an environmental reason, the spot-checked fallback has to be recorded instead."

duration: 12min
completed: 2026-09-12
status: complete
---

# Phase 5 Plan 15: The Expected-Red Gate and Continuous Separation Summary

**`test:phase1:red` is withdrawn in both repositories. Its named successor, `test:phase1:contracts`, asserts that the Phase 1 contract suites are green (exit 1 before, exit 0 after, on both sides). The new `verify-split.yml` workflow clones ZERO-PAPER HUB anonymously beside the workspace, runs the unchanged `verify:disjoint`, then compares the two allowlists with `cmp`, because the auditor alone was measured passing when the two origins disagree.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-12T19:26:50Z
- **Completed:** 2026-09-12T19:39:05Z
- **Tasks:** 3 (Task 1 was answered by the owner before this run and made no code change)
- **Files modified:** 12 paths (8 HAOO, 4 ZERO-PAPER HUB; the 2 old scripts deleted)

## Accomplishments

- **Neither repository still has a script that fails by design.** `npm run test:phase1:contracts` exits 0 in HAOO (`3 suites, 3 of 3 markers on green cases, 0 of 8 infrastructure-failure signatures present`) and in ZERO-PAPER HUB (`1 suite, 1 of 1 markers …`). `test:phase1:red` is gone from both manifests.
- **The machinery is preserved.** The rejection list, the suites and the markers (HAOO: `[phase1-red:page]`, `[phase1-red:content]`, `[phase1-red:build]`; ZPH: `[phase1-red:products]`) are byte-unchanged against each pre-change file. Only the required exit status inverted.
- **The shared allowlist is still byte-identical** (`cmp` exit 0) with 26 entries. `verify:disjoint` reports 26/26/0 with 0 converged in both checkouts.
- **SPLT-01 now runs in CI.** The workflow triggers on push to `main`, pull requests against `main` and manual dispatch. It uses `contents: read` and no token, and it prints the sibling SHA it audited.
- **Measured how the check behaves when the two origins disagree.** The auditor exits 0 against an origin with the old entry (25 of 26 subtracted), while `cmp` exits 1. The `cmp` step closes that gap, and the push order follows from it: ZERO-PAPER HUB first, then HAOO.

## Task Commits

1. **Task 1: choose the successor shape (D-16), blocking human.** Resolved by the owner (`invert-rename`) before this run; no commit of its own. Recorded in `05-EVIDENCE-GATES.md` §1.
2. **Task 2: implement the successor in both repositories.** HAOO `a54d54b`, ZERO-PAPER HUB `3525f6d` (feat)
3. **Task 3: disjointness in CI, and the gate record.** HAOO `26ff7a6` (feat)

**Plan metadata:** the docs commit that carries this SUMMARY.

## Files Created/Modified

- `scripts/assert-phase1-contracts.mjs` (HAOO and ZPH): the successor. Its header records the withdrawal, the plan, the successor and the byte-unchanged guarantees. It exports `phase1ContractFailure` as a pure decision function, assigns the exit code and has an import guard.
- `scripts/assert-phase1-red.mjs` (HAOO and ZPH): deleted by the rename.
- `package.json` (HAOO and ZPH): `test:phase1:red` became `test:phase1:contracts`.
- `shared-scaffold.txt` (HAOO and ZPH): the entry was renamed in place with a comment recording the rename. The two copies are byte-identical and still hold 26 entries.
- `.github/workflows/verify-split.yml` (HAOO): the continuous separation check.
- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-GATES.md`: the gate record.
- `.planning/phases/04.2-…/04.2-SPLIT-CONTRACT.md`: the allowlist's source of truth now names the new path.
- `.planning/phases/04.2-…/04.2-DEFERRED-ITEMS.md`: D6 and D12 are marked closed by 05-15.

## Decisions Made

- **The owner chose `invert-rename`.** The name `scripts/assert-phase1-contracts.mjs` / `test:phase1:contracts` was owner-selected and orchestrator-proposed.
- **The rejection list is checked before the exit status**, so a broken harness is reported as a broken harness and not as a failed contract.
- **CI clones the tip of the sibling's `main` at run time, not a pinned SHA.** Separation is a claim about the trees as they stand, and the audited SHA is printed so a run can be tied to a commit pair.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The marker check now requires a green line**
- **Found during:** Task 2
- **Issue:** Turned green, a plain "marker appears in output" check accepts a skipped case. Measured: a HAOO run filtered with `-t "zz-no-such-case-zz"` printed every marker on a `↓` line, reported `Tests  6 skipped (6)` and exited 0. The plan requires the marker check to keep its strength.
- **Fix:** A marker counts only on a line that starts with `✓`.
- **Files modified:** `scripts/assert-phase1-contracts.mjs` (both repositories)
- **Verification:** 10 mutation probes against recorded runs, 0 unexpected, including the real all-skipped run and a marker moved to a `×` line.
- **Committed in:** `a54d54b`, `3525f6d`

**2. [Rule 2 - Missing critical] The workflow compares the two allowlists with `cmp`**
- **Found during:** Task 3
- **Issue:** The orchestrator asked what the job does when the two origins disagree. Measured: HAOO's auditor, run against an anonymous clone of the ZERO-PAPER HUB origin (still carrying the old entry), printed `allowlist entries: 26`, `allowlist subtracted: 25`, `violations: 0` and exited 0, while `cmp` exited 1. The plan forbids a check that passes silently.
- **Fix:** A `cmp shared-scaffold.txt "$GITHUB_WORKSPACE/../ZERO-PAPERHUB/shared-scaffold.txt"` step runs after the unchanged `npm run verify:disjoint`. The enumerated command itself is not altered or wrapped.
- **Files modified:** `.github/workflows/verify-split.yml`
- **Verification:** YAML parses into 6 steps. The plan's workflow assertions pass. The disagreement is recorded verbatim in `05-EVIDENCE-GATES.md` §4.
- **Committed in:** `26ff7a6`

**3. [Rule 2 - Missing critical] The 04.2 split contract now names the new path**
- **Found during:** Task 2
- **Issue:** `shared-scaffold.txt` names `04.2-SPLIT-CONTRACT.md` § "Shared scaffold" as its source of truth ("Change them there and here together"). That section still named `scripts/assert-phase1-red.mjs`.
- **Fix:** Both references were updated in the same commit, with a note that the entry was ratified under the old name and renamed by 05-15.
- **Files modified:** `.planning/phases/04.2-split-haoo-into-its-own-repository-and-domain/04.2-SPLIT-CONTRACT.md`
- **Verification:** `grep` finds no remaining `assert-phase1-red` path entry in the list block.
- **Committed in:** `a54d54b`

---

**Total deviations:** 3 auto-fixed (3 missing critical).
**Impact on plan:** Each one keeps a plan guarantee at the strength the plan asked for. The first two close silent-pass paths that the inversion and the two-origin CI setup would otherwise have opened. No allowlist entry was added, and the auditor was not changed.

## Issues Encountered

- **No CI run could be observed.** This plan could not push, so the acceptance criterion "a run of the workflow has been observed" is still open. Its fields are left as _pending_ in `05-EVIDENCE-GATES.md` §4 for the orchestrator. The spot-checked fallback does not apply: the anonymous clone was measured feasible locally (exit 0, `main` at `c5b76cd`, no credential helper).
- **G-1, handed to 05-14.** The auditor exits 0 when `allowlist subtracted` is less than `allowlist entries`, meaning an entry is no longer shared. The new `cmp` step catches the case where the two lists disagree. It does not catch a stale entry that both lists still carry. Closing that means changing the byte-identical auditor in both repositories, so it is recorded here and not changed.

## Gate Baseline

| Gate | HAOO after | ZERO-PAPER HUB before → after |
|---|---|---|
| typecheck | 0 | 0 → 0 |
| lint | 0 | 0 → 0 |
| `npm test` | 0, 684 tests / 10 files | 0, 32 / 3 → 0, 32 / 3 |
| `verify:disjoint` | 0, 26/26/0 (HAOO now 379 tracked, 147 compared) | 0 → 0, 26/26/0 |
| Phase 1 gate | 1 → 0 | 1 → 0 |

## User Setup Required

None.

## Next Phase Readiness

- **For the orchestrator:** push **ZERO-PAPER HUB first** (its `main` is 3 ahead: `83cb386`, `dfdb2e9`, `3525f6d`; the push deploys `zero-paperhub.com`), **then HAOO** (14 ahead of `c39cc5a`). The HAOO push triggers both `Deploy HAOO` and `Verify tree disjointness`. Then fill in the pending run fields in `05-EVIDENCE-GATES.md` §4.
- The STATE.md blocker "npm run test:phase1:red exits 1 in BOTH repositories" is resolved.
- QUAL-05 is not marked complete: `requirements.ready-ids` reports 0 of 1 ready, because sibling plans declaring it are still open.

## Self-Check: PASSED

- FOUND: `scripts/assert-phase1-contracts.mjs`, `../ZERO-PAPERHUB/scripts/assert-phase1-contracts.mjs`, `.github/workflows/verify-split.yml`, `05-EVIDENCE-GATES.md`
- GONE: `scripts/assert-phase1-red.mjs` in both repositories
- FOUND commits: HAOO `a54d54b`, `26ff7a6`; ZERO-PAPER HUB `3525f6d`
- `cmp` of the two allowlists: exit 0
- Neither repository pushed: HAOO `ahead 14`, ZERO-PAPER HUB `ahead 3`

---
*Phase: 05-prove-the-deployed-journey*
*Completed: 2026-09-12*
