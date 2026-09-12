---
phase: 05-prove-the-deployed-journey
plan: 12
subsystem: testing
tags: [playwright, forms, focus-management, live-regions, route-fulfill, evidence, backstop]

requires:
  - phase: 05-05
    provides: "SURFACES (S1, S5), recordEvidence with its pass-mark refusal, assertNonEmptySubjects"
  - phase: 05-03
    provides: "The live and preview Playwright projects, and the webServer serving dist on localhost:4173"
provides:
  - "e2e/form-states.e2e.ts: idle and invalid on both projects; in-flight, success, transport failure and blocked on preview only, behind a testInfo.project.name guard; the six-row KF-5 matrix with a body-focus counter; FS-2 status-region invariants across every transition; a live-only 360 px option-label backstop recorder"
  - "evidence/form-states.json, form-states-focus.json, form-states-requests.json, form-states-status-region.json, form-states-option-labels.json"
  - "05-EVIDENCE-FORM-STATES.md: six-state table, focus matrix with body-focus count 0 of 23, in-flight request count 1, retained values before and after, status-region counts, and the held-out option-label item marked not a pass"
affects: [05-14, 05-VERIFICATION, "QUAL-02 verification"]

actuals:
  tokens: 58113
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Induce failure and terminal states by routing the provider pattern (route.fulfill / route.abort) on the preview project only, enforced by test.skip on testInfo.project.name rather than by convention"
    - "Force the blocked state by patching JSON.stringify in the browser for the submission body only, so no request can be issued and the zero request count is the measurement"
    - "Count the second in-flight submission at the route, issued through form.requestSubmit() so the synchronous guard is what gets tested, not the disabled attribute"
    - "A backstop recorder asserts only vacuity guards (subjects found, labels non-empty) and records the measured inputs for a human; it never encodes a readability verdict"
    - "Compare re-run evidence records by value against earlier records before committing, so a changed measurement cannot hide inside an appended run"

key-files:
  created:
    - evidence/form-states-option-labels.json
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-FORM-STATES.md
  modified:
    - e2e/form-states.e2e.ts
    - evidence/form-states.json
    - evidence/form-states-focus.json
    - evidence/form-states-requests.json
    - evidence/form-states-status-region.json

key-decisions:
  - "The option-label backstop is measured on live at 360x740, and the form-authored placeholder is measured separately from the product option labels. It is longer than every real option on 3 of 5 lists, so folding it into the maximum would report the form's prompt as product data."
  - "The invalid and in-flight records gained integer status-region counts (document and submission region) so every state in the evidence has an integer, not an inference. The in-flight reading is taken inside the window, before the second submission attempt."
  - "FS-2's 'exactly one status region' is recorded as FS-O1: 1 submission region at every moment, but 2 role=status elements in the document whenever the form renders (the measurement disclosure carries the second). Recorded, not judged; reconciling the spec wording is left to 05-14 or the verifier."
  - "Body-focus for KF-5 rows 5-6 is derived from the captured destination element (H3, not BODY) plus the spec's per-test counter check, because those records carry the destination rather than a separate count field. Stated in the evidence rather than presented as a recorded count."

patterns-established:
  - "Evidence files name the build each target served (live bundle hash plus deploy run, preview bundle hash plus build time) and the run windows, and report run-to-run value comparisons as integers"

requirements-completed: [QUAL-02]

coverage:
  - id: D1
    description: "Idle and invalid form states asserted on both live and preview, including the honeypot's four properties, the error summary links and the conditional phone requirement in all three places"
    requirement: QUAL-02
    verification:
      - kind: e2e
        ref: "e2e/form-states.e2e.ts (FS-1 idle, invalid, conditional requirement) --project=preview and --project=live"
        status: pass
    human_judgment: false
  - id: D2
    description: "In-flight, success, transport failure and blocked induced on preview only by routing the provider; request count 1 after a second in-flight attempt; retry present on failure and absent on blocked; values retained"
    requirement: QUAL-02
    verification:
      - kind: e2e
        ref: "e2e/form-states.e2e.ts (FS-1 — the four states FS-0 confines to the local preview mirror) --project=preview"
        status: pass
    human_judgment: false
  - id: D3
    description: "KF-5 focus matrix, six rows, with 0 of 23 transitions ending on document.body, and FS-2 status-region invariants across every transition"
    requirement: QUAL-02
    verification:
      - kind: e2e
        ref: "e2e/form-states.e2e.ts (KF-5 rows 1-4 on both projects, rows 5-6 and FS-2 on preview)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Long option labels in the five qualification selects remain readable at 360 px without unscrollable clipping (backstop)"
    requirement: QUAL-02
    verification: []
    human_judgment: true
    rationale: "A native select's open popup is drawn outside the document layout, so no assertion can see it. The measured inputs (control width 278 px on all five, longest real label 16 characters, placeholders up to 18) are in 05-EVIDENCE-FORM-STATES.md section 6; a human must open each select on a 360 px device."

duration: ~8h40m wall clock including an interrupted session (active execution not separately measured)
completed: 2026-09-12
status: complete
---

# Phase 05 Plan 12: Qualification Form States Summary

**Six qualification-form states recorded as observations on the deployed `c39cc5a` build and the local mirror. Four of them were induced on preview by routing FormSubmit, so no mail was sent. 0 of 23 focus transitions landed on the document body. The 360 px option-label judgement goes to a human with measured inputs, and is explicitly not a pass.**

## Performance

- **Duration:** about 8h40m wall clock. The first executor session stopped on an API spend limit partway through Task 3, and this continuation finished it. Active execution time was not measured separately.
- **Started:** 2026-09-12T10:43Z (after the 05-11 close-out commit `ac4a456`)
- **Completed:** 2026-09-12T19:21Z
- **Tasks:** 3 of 3
- **Files modified:** 7

## Accomplishments

- **Both targets:** idle and invalid are asserted on live and on preview, and the two agree by value. On both, the submit label is `Send my details`, the status region is empty with `min-height: 24px`, the error summary has 7 links whose `href` equals the field ids, and each error carries the `Error: ` prefix. The honeypot is off-canvas at -9967 px, has tabindex -1, and has 0 nodes in the accessibility tree.
- **Preview only:** in-flight, success, transport failure and blocked were induced by routing. With 2 submissions attempted, **1** request went out. The retry control counted `1` on failure and `0` on blocked. All 10 distinctive values read back the same after both failure modes.
- **Focus:** the KF-5 matrix covers all six rows. Scripted focus paints a two-layer box-shadow ring on the four script-focus destinations. The body-focus count is **0** (13 transitions on preview, 10 on live).
- **Backstop inputs:** recorded on live at 360×740 for all five option lists. The judgement is handed to a human, not faked.
- **Re-runs:** the evidence was checked across three runs by value, and **0** of the readings differ. No Task 1 or Task 2 measurement changed after its commit.

## Task Commits

1. **Task 1: Assert the idle and invalid states and the whole focus-movement matrix** — `5fc0747` (feat)
2. **Task 2: Induce the four failure and terminal states on the preview target** — `5b4aa8e` (feat)
3. **Task 3: Record the per-state evidence and capture the inputs to the held-out visual judgement** — `839937d` (feat)

**Plan metadata:** this SUMMARY's own commit, then the STATE/ROADMAP commit.

## Files Created/Modified

- `e2e/form-states.e2e.ts` — FS-0/FS-1/FS-2 contracts, the KF-5 matrix, and the live-only option-label backstop recorder
- `evidence/form-states.json` — per-state records; the invalid and in-flight records now also carry status-region counts
- `evidence/form-states-focus.json` — KF-5 rows 1–4 with body-focus counts
- `evidence/form-states-requests.json` — in-flight 2 attempts / 1 request; blocked 1 attempt / 0 requests
- `evidence/form-states-status-region.json` — the six-moment FS-2 timeline
- `evidence/form-states-option-labels.json` — the held-out inputs per option list
- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-FORM-STATES.md` — the written record

## Decisions Made

See `key-decisions` in the frontmatter. In brief:
- The placeholder is measured separately from the option labels.
- Integer status-region counts were added for the invalid and in-flight states.
- FS-O1 (2 document-level status elements against 1 submission region) is recorded, not judged.
- The body-focus figure for rows 5–6 is derived from the captured element, and the evidence says so.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Status-region counts were missing from two states**
- **Found during:** Task 3 (writing the status-region section)
- **Issue:** The plan requires the number of status regions in each state as an integer. The invalid and in-flight records carried the region's text but not a count, so the evidence would have had to infer two of six rows.
- **Fix:** Added `statusRegionsInDocument` and `submissionStatusRegions` to both records. The in-flight counts are read inside the request window, right after the existing invariant check. No new assertions were added.
- **Files modified:** `e2e/form-states.e2e.ts`
- **Verification:** Both projects exit 0. Both new readings are 2 (document) and 1 (submission) in runs B and C. Every other reading matches run A by value.
- **Committed in:** `839937d`

**2. [Scope note] Blocked-state submission-region count not taken separately**
- The blocked record carries the document count (2) but no separate submission-region count. The evidence says "not taken as a separate reading" rather than filling one in. Adding it would have meant a fourth run for a count the FS-2 invariant check already constrains.

---

**Total deviations:** 1 auto-fixed (Rule 2), 1 recorded scope note
**Impact on plan:** The fix only adds measurements. No assertion, source file or target rule changed.

## Issues Encountered

- **Session interruption.** The first executor stopped on an API spend limit with Task 3 uncommitted. Before any commit, the evidence it had re-run was checked by value against the Task 1 and Task 2 commits: the committed records were an untouched prefix, and every appended reading matched its counterpart apart from `recordedAt`. The backstop test turned out to be complete, writing its record after its vacuity guards.
- **Bundle hashes differ between targets.** Live serves `haoo-D1dl6F2P.js` and preview serves `haoo-Ba5CCAcE.js`, built from the same `src/` tree. The evidence records both and does not explain the difference.

## Gates

| Gate | Exit | Reading |
|---|---|---|
| `npm run typecheck` | 0 | — |
| `npm run lint` | 0 | — |
| `npm test` | 0 | 684 tests across 10 files |
| `npm run verify:disjoint` | 0 | 26 allowlist subtracted, 0 violations |
| Task 3 `<verify>` chain | 0 | preview 9 ran + 1 skipped; live 5 ran + 5 skipped; both greps matched |
| `git status -- src/` | — | 0 entries (T-05-58) |

## Constraints Held

- **No live submission.** `formsubmit.co` is routed on every target, and on live the provider attempt count is 0 in every record. `haoo.online` has no MX records and the FormSubmit endpoint isn't activated (05-02 and 05-06 are parked), so T-05-54 stays mitigated.
- **No `VITE_` variable.** The spec introduces none, and nothing under `src/` changed.
- **Not touched here:** the P5/P6 fixture gap (4 declared, 3 shipped under those names) isn't exercised by this plan, and `primary-actions.ts` was left alone. The R-1 (`bypass` rated serious) and O-1 (Cloudflare beacon) judgements remain with 05-14.

## User Setup Required

None.

## Next Phase Readiness

- The QUAL-02 form half has recorded evidence for all six states. D4 (option labels at 360 px) needs a human to open each select on a narrow device, using the inputs in `05-EVIDENCE-FORM-STATES.md` § 6.
- FS-O1 (two document-level `role="status"` elements) is waiting for the spec-wording reconciliation in 05-14 or verification.
- Delivery is still unproven by design. The confirmation announcement is a browser claim, and `05-EVIDENCE-MAIL.md` remains the only place delivery can be established.

## Self-Check: PASSED

- FOUND: `e2e/form-states.e2e.ts`, `evidence/form-states-option-labels.json`, `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-FORM-STATES.md`
- FOUND commits: `5fc0747`, `5b4aa8e`, `839937d`

---
*Phase: 05-prove-the-deployed-journey*
*Completed: 2026-09-12*
