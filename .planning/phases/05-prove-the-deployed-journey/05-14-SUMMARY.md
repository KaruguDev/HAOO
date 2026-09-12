---
phase: 05-prove-the-deployed-journey
plan: 14
subsystem: testing
tags: [axe-core, playwright, accessibility, gate, wcag]

requires:
  - phase: 05-07
    provides: "The exploratory axe baseline (11 surface-states, 0 blocking violations) and review item R-1"
  - phase: 05-05
    provides: "The fixture layer: axeFor, BLOCKING_IMPACTS, SURFACES, VIEWPORTS, recordEvidence"
provides:
  - "e2e/axe-gate.e2e.ts: the gating counterpart to the baseline, failing on any critical or serious node (violation or incomplete) without a named exception"
  - "GATE_EXCEPTIONS: one named exception, R-1, with its verbatim reason, provenance and a vacuity guard"
  - "evidence/axe-gate.json: per-scan counts with the build each reading came from"
  - "05-EVIDENCE-AXE.md sections 8 and 9: the closed triage record with the deployment note naming 05-17"
affects: [05-17, "phase verification", "future ZERO-PAPER HUB phase"]

actuals:
  tokens: 18861
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A gate that consumes the baseline's factory and impact set unchanged, so it cannot be configured greener than the run that found the problems"
    - "An accepted finding as a named exception keyed on rule, bucket, impact, node target, surface and state, carrying its reason and provenance inline, with a vacuity guard"
    - "Each gate record carries the document's script sources, so every reading names the build it measured"

key-files:
  created:
    - e2e/axe-gate.e2e.ts
    - evidence/axe-gate.json
    - .planning/phases/05-prove-the-deployed-journey/deferred-items.md
  modified:
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-AXE.md
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-RECOVERY.md
    - .planning/phases/05-prove-the-deployed-journey/05-11-SUMMARY.md
    - .planning/STATE.md

key-decisions:
  - "Owner ruling: a serious or critical axe incomplete result fails the gate unless a named exception matches it"
  - "Owner ruling: the gate covers all 11 surface-states including S4, deliberately wider than the plan's 'a HAOO surface or the Products region' wording, so the gate is no looser than the baseline"
  - "R-1 (bypass, serious, incomplete, S4 html) accepted; the reason is owner-accepted and orchestrator-drafted at the owner's request, and is recorded as such, not as the owner's own wording"
  - "O-1: the owner turned off Cloudflare Web Analytics for zero-paperhub.com; the beacon was measured absent at 20:31:04Z; formal closure on 05-17's live run; no spec asserts its absence"
  - "The numbered blocking list stayed empty on a re-read against the builds serving now, so no product source changed"

patterns-established:
  - "Named exception with a vacuity guard: an exception that matches nothing fails the scan, so it cannot outlive the result it excuses"

requirements-completed: [QUAL-01, QUAL-02, QUAL-03]

coverage:
  - id: D1
    description: "The blocking list is triaged against the builds serving now: 11 surface-states re-read with the unchanged baseline spec, 0 violations at any impact, FIXED 0 / DEFERRED 0 / ACCEPTED 0 from the numbered list, and the four handed-forward items (R-1, O-1, FS-O1, G-1) each routed by name"
    requirement: QUAL-03
    verification:
      - kind: other
        ref: "npm test && npx vitest run src/test/focus-contrast.test.ts && git diff --quiet HEAD -- e2e/fixtures/axe.ts && grep -qiE 'FIXED|DEFERRED|ACCEPTED' 05-EVIDENCE-AXE.md (Task 1 verify)"
        status: pass
    human_judgment: false
  - id: D2
    description: "e2e/axe-gate.e2e.ts gates all 11 surface-states through axeFor, failing on unexcepted critical or serious nodes in violations or incomplete, with R-1 as the one named exception and a vacuity guard"
    requirement: QUAL-01
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/axe-gate.e2e.ts (8 passed, 4 skipped)"
        status: pass
      - kind: e2e
        ref: "npx playwright test --project=preview e2e/axe-gate.e2e.ts (5 passed, 7 skipped)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The triage record is closed: one row per finding, integer counts (accepted 1 = gate blocking findings 1), the unchanged-configuration statement on axe-core 4.13.0, and the deployment note naming 05-17"
    requirement: QUAL-02
    verification:
      - kind: other
        ref: "git diff --quiet HEAD~1 -- e2e/fixtures/axe.ts && the no-disableRules check && grep -q '05-17' 05-EVIDENCE-AXE.md (Task 3 verify)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Observation AG-O1: the Cloudflare Web Analytics beacon was present on live www.haoo.online at 20:29Z and absent at 20:33Z"
    verification: []
    human_judgment: true
    rationale: "Whether the haoo.online Cloudflare zone should carry Web Analytics, and what changed between the two readings, is a hosting setting only the owner can see and decide. The gate records it and does not assert on it."

duration: 23min
completed: 2026-09-12
status: complete
---

# Phase 5 Plan 14: Accessibility Gate Summary

**An axe gate over the same 11 surface-states as the baseline. It fails on any critical or serious node, violation or incomplete, that has no named exception. It is green on both projects with 0 unexcepted blocking nodes. The one exception is R-1 (`bypass` on the retired-path page), and it carries an owner-accepted reason that the orchestrator drafted at the owner's request.**

## Performance

- **Duration:** about 23 min of execution (2026-09-12T20:13Z to 20:36Z), with the Task 2 owner checkpoint in between
- **Started:** 2026-09-12T20:13Z
- **Completed:** 2026-09-12T20:36Z
- **Tasks:** 3 of 3 (Task 2 answered by the owner through the orchestrator)
- **Files:** 3 created, 4 modified

## Accomplishments

- **The baseline was checked against the builds serving now, not assumed current.** 05-07 scanned before the F1-LIVE deploy and before `65a612a`, so all 11 surface-states were scanned again with the unchanged spec:
  - live S1 on `/assets/haoo-D1dl6F2P.js`, which does not include `65a612a`
  - S3 and S4 on ZERO-PAPER HUB `3525f6d`
  - preview S5 on `/assets/haoo-CNGGkFFJ.js`, which includes `65a612a`
  - result: 0 violations at any impact, and the only incomplete results are R-1's two. The numbered list stayed empty, so no product source changed.
- **What the gate checks** (`e2e/axe-gate.e2e.ts`):
  - Every scan is built by `axeFor` and gated against `BLOCKING_IMPACTS`, both unchanged.
  - Blocking incomplete results fail as violations do, and S4 is covered. Both are owner rulings.
  - Each scan asserts that the engine ran the factory's 5-tag selection.
  - A node with an impact that can't be classified fails the scan.
  - Moderate and minor nodes are recorded without failing.
  - Readings are written to `evidence/axe-gate.json` before any assertion, with the document's script sources as build identity.
- **R-1 is a named exception, not a disable.**
  - Key: rule `bypass`, bucket `incomplete`, impact `serious`, node `html`, surface S4, both readings.
  - The reason is transcribed verbatim, and the provenance says whose words they are.
  - A vacuity guard fails the scan if the exception matches nothing.
  - A page-less test keeps the list closed.
- **The triage record is closed** (`05-EVIDENCE-AXE.md` sections 8 and 9):
  - counts: fixed 0, deferred 0, accepted 1, gate blocking findings 1 (2 nodes, both excepted), unexcepted 0
  - the configuration is unchanged, on axe-core 4.13.0
  - the deployment note names 05-17 as the live re-measurement

## Task Commits

1. **Task 1: Triage every numbered blocking finding** - `4610af6` (docs)
2. **Task 2: Owner disposition of escalated findings** - no commit (a checkpoint; the owner answered R-1 `accept-recorded`, plus the gate-scope and O-1 rulings)
3. **Task 3: Stand up the gating spec and close the triage record** - `9202d2c` (feat)

**Plan metadata:** this SUMMARY's commit, followed by the STATE/ROADMAP commit.

## Files Created/Modified

- `e2e/axe-gate.e2e.ts` - the gating spec, with `GATED_STATES`, `GATE_EXCEPTIONS` and the vacuity guard
- `evidence/axe-gate.json` - 22 records: the development run (20:29Z) and the plan's verify run (20:33Z), 11 each
- `05-EVIDENCE-AXE.md` - section 8 (triage, re-read, routing of R-1/O-1/FS-O1/G-1) and section 9 (rulings, exception, counts, builds, unchanged configuration, O-1, AG-O1, deployment note)
- `deferred-items.md` - G-1, the disjointness auditor accepting a stale allowlist entry
- `05-EVIDENCE-RECOVERY.md`, `05-11-SUMMARY.md` (coverage D8), `STATE.md` - O-1: decided, owner action done, formal closure on 05-17

## Decisions Made

- **R-1 is ACCEPTED.** The reason is recorded as "owner-accepted, orchestrator-drafted at the owner's request", because the owner chose `accept-recorded` and, asked for their own words, replied "provide a reason".
- **Serious or critical incomplete results fail the gate** unless a named exception matches (owner ruling).
- **The gate covers all 11 surface-states, S4 included.** This is deliberately wider than the plan's wording (owner ruling).
- **O-1 is owner-decided and the action is done.** The orchestrator measured the beacon absent on S4 at 20:31:04Z, and formal closure is on 05-17. One inline Cloudflare bot-management script remains. Whether that sits within D-12's zero-script intent is left to 05-17 and verification.
- **FS-O1 goes to phase verification, and G-1 to `deferred-items.md`.** Neither is an axe finding. G-1's fix would need a matching auditor change in both repositories.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The triage list was re-read against the builds serving now**
- **Found during:** Task 1
- **Issue:** 05-07's list was measured before the F1-LIVE deploy and before `65a612a`, and its entries record no bundle. Triaging from it alone would dispose of findings measured on superseded builds.
- **Fix:** Re-ran the unchanged baseline spec on both projects. The output was kept aside and the committed baseline record restored. The values are recorded in section 8.1 with the build of each target.
- **Files modified:** `05-EVIDENCE-AXE.md`
- **Verification:** 11 run, 11 skipped, exit 0; per-entry counts identical to the baseline
- **Committed in:** `4610af6`

**2. [Rule 2 - Missing critical] The gate writes its readings to `evidence/axe-gate.json`, which is not in the plan's file list**
- **Found during:** Task 3
- **Issue:** The plan requires the gate's blocking count and the build of each reading. Console output alone is not committed evidence.
- **Fix:** Each scan appends one `recordEvidence` record (counts only, no pass marks) with state, URL, project, engine version, tags, disables, applicable exceptions and script sources, written before assertions.
- **Files modified:** `e2e/axe-gate.e2e.ts`, `evidence/axe-gate.json`
- **Verification:** 22 records; the verify run's totals are 2 blocking, 2 excepted, 0 unexcepted
- **Committed in:** `9202d2c`

**3. [Orchestrator instruction] O-1's status was recorded outside the plan's file list**
- **Found during:** Task 3
- **Issue:** The owner's O-1 decision and its later completion had to be written wherever O-1 is tracked.
- **Fix:** Updated `05-EVIDENCE-RECOVERY.md`, `05-11-SUMMARY.md` coverage D8 and the STATE.md O-1 line. `deferred-items.md` was created in Task 1 for G-1.
- **Committed in:** `9202d2c` (STATE.md in the metadata commit)

---

**Total deviations:** 2 auto-fixed (Rule 2), plus 1 set of edits made on orchestrator instruction.
**Impact on plan:** measurement and record-keeping only. No product source, token, tag, disable or threshold changed.

## Issues Encountered

- **The first restore of the baseline record aborted.** A single `git checkout` named both it and the gitignored `evidence/playwright-run.json`, and git refused the whole command. The baseline file was then restored on its own, and the tree was confirmed clean before the Task 1 commit.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: third-party-script-injection | `https://www.haoo.online/` (S1, HAOO) | AG-O1: `www.haoo.online` is fronted by Cloudflare. The Web Analytics beacon `static.cloudflareinsights.com/beacon.min.js` was present on all 4 live S1 states at 20:29:26Z to 20:29:50Z and absent at 20:33:19Z to 20:34:06Z. The built `dist/index.html` carries 0. Whether the owner's zero-paperhub.com change also covered haoo.online is not established. The owner is to confirm; STATE.md has an OPEN line. |

## Known Stubs

None.

## User Setup Required

None. The owner's Cloudflare action for O-1 is already reported done. AG-O1 needs the owner to confirm the haoo.online zone setting (STATE.md).

## Next Phase Readiness

- **Deploy before 05-17.** HAOO `main` is unpushed and carries 05-13's `65a612a` and this plan's commits. The orchestrator owns the single HAOO deploy and clearing 05-13's `DEPLOY_LAG` entries.
- **05-17's live run** must run against that deployment. It re-checks R-1 through the gate's vacuity guard, gives O-1 its formal closure reading, and is the next AG-O1 reading.
- **Still open:** FS-O1 for phase verification; G-1 in `deferred-items.md`.

## Self-Check: PASSED

- FOUND: `e2e/axe-gate.e2e.ts`, `evidence/axe-gate.json`, `.planning/phases/05-prove-the-deployed-journey/deferred-items.md`, `05-EVIDENCE-AXE.md` sections 8 and 9
- FOUND commits: `4610af6`, `9202d2c`
- Gate baseline: typecheck 0, lint 0, `npm test` 684 tests / 10 files exit 0, `verify:disjoint` 26/26/26/0 exit 0, `test:phase1:contracts` exit 0
- `e2e/fixtures/axe.ts` byte-unchanged; the owner-accepted sentence appears exactly once in the spec and once in the record

---
*Phase: 05-prove-the-deployed-journey*
*Completed: 2026-09-12*
