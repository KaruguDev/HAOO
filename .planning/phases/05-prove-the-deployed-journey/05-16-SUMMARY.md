---
phase: 05-prove-the-deployed-journey
plan: 16
subsystem: testing
tags: [playwright, formsubmit, lead-07, live-submission, evidence, delivery, mail-chain]

requires:
  - phase: 05-02
    provides: "Link 1 (MX) CONFIRMED, so mail for haoo.online has a published exchanger"
  - phase: 05-06
    provides: "Link 2 (activation) CONFIRMED on the owner's report, and the guarded e2e/live-submission.e2e.ts with HAOO_LIVE_SUBMISSION_MARKER"
  - phase: 05-12
    provides: "The pinned FS-1 success contract and the FS-O1 submission-region reading"
provides:
  - "Link 3 (delivery) of LEAD-07 CONFIRMED on the owner's mailbox report: the marker committed before the send arrived in the inbox"
  - "A three-line chain summary at the top of 05-EVIDENCE-MAIL.md, with all three links CONFIRMED and the phase's 2 live submissions listed by marker"
  - "The mail-routing row in REQUIREMENTS.md moved from DECIDED, NOT EXECUTED to its measured outcome"
  - "evidence/live-submission.json records 3 and 4: the marker fixed before the send, and the full browser observation of the one send"
affects: [05-17, "phase verification", "LEAD-07"]

actuals:
  tokens: 5211
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "Commit the marker first. Then gate the armed send on a fresh MX measurement and on the marker commit being an ancestor of HEAD, in the same command"
    - "Delivery status is authorised only by the owner's mailbox report. The browser state and the provider's success field are recorded as acceptance, not delivery"

key-files:
  created:
    - .planning/phases/05-prove-the-deployed-journey/05-16-SUMMARY.md
  modified:
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-MAIL.md
    - evidence/live-submission.json
    - .planning/REQUIREMENTS.md

key-decisions:
  - "Link 3 of LEAD-07 set to CONFIRMED on the owner's report. The owner captioned a screenshot \"the last form sumission you made\" and answered \"Inbox\" to the folder question. The orchestrator read the committed marker ...b770730d character for character in the delivered message, received \"Today 04:11\" local (01:11 UTC)."
  - "The full sender address and the full subject line are recorded as not stated, cut off in the owner's screenshot, and are not completed from memory or from Link 2. They do not hold Link 3 open, because D-13's record is the marker, the timestamp and the folder."
  - "The tagged send was not counted by analytics. Driven through Playwright, navigator.webdriver read true and 0 requests reached PostHog, so qualify_submit was not captured. This contradicts 05-EVIDENCE-HARNESS.md section 4's premise that the D-12 submission is the one known inclusion in the owner's counts."
  - "LEAD-07 is marked complete only because requirements.ready-ids reported 1/1 ready, re-run at 2026-09-13T08:13Z after the orchestrator said 05-17 still declares it. 05-17's frontmatter reads requirements: [QUAL-05]. It names LEAD-07 only in a key_links pattern and in its verify grep over 05-EVIDENCE.md, which the tool does not count as a declaration."

requirements-completed: [LEAD-07]

coverage:
  - id: D1
    description: "The release-verification marker was fixed and committed before the send"
    requirement: LEAD-07
    verification:
      - kind: command
        ref: "git show 49c976a:.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-MAIL.md | grep -c HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d -> 2; git merge-base --is-ancestor 49c976a HEAD checked in the send command"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exactly one tagged production submission sent from the live page, not retried, with the browser observation recorded"
    requirement: LEAD-07
    verification:
      - kind: e2e
        ref: "HAOO_SEND_LIVE_SUBMISSION=1 HAOO_LIVE_SUBMISSION_PURPOSE=RELEASE-VERIFICATION HAOO_LIVE_SUBMISSION_MARKER=... npx playwright test --project=live e2e/live-submission.e2e.ts --retries=0 --workers=1 (01:11:43.756Z-01:11:51.679Z, exit 0, 1 passed); evidence/live-submission.json providerPostCount 1, HTTP 200, success \"true\""
        status: pass
    human_judgment: false
  - id: D3
    description: "The tagged submission reached the info@haoo.online inbox (Link 3)"
    requirement: LEAD-07
    verification:
      - kind: manual_procedural
        ref: "Owner's report 2026-09-13, transcribed in 05-EVIDENCE-MAIL.md Link 3 'Owner's mailbox report'"
        status: pass
    human_judgment: true
    rationale: "Delivery happens in a mailbox only the owner can read. The status rests on the owner's screenshot and their direct folder answer."

duration: "about 7h elapsed, most of it waiting for the owner's mailbox report; about 5 min of execution before the checkpoint and about 5 min after"
completed: 2026-09-13
status: complete
---

# Phase 5 Plan 16: Tagged Release Delivery (LEAD-07 Link 3) Summary

**One tagged production submission was sent from www.haoo.online after its marker was committed. The owner found that exact marker in the `info@haoo.online` inbox at "Today 04:11" (01:11 UTC), which closes all three links of the LEAD-07 mail chain.**

## Performance

- **Duration:** about 7h elapsed, most of it at the owner checkpoint
- **Started:** 2026-09-13T01:10:38Z (the Task 1 MX precondition measurement)
- **Checkpoint returned:** after `754ed31` (2026-09-13T01:13:16Z)
- **Completed:** 2026-09-13T08:11Z (the Task 3 commit), followed by this SUMMARY
- **Tasks:** 3 of 3
- **Files modified:** 3 (`05-EVIDENCE-MAIL.md`, `evidence/live-submission.json`, `REQUIREMENTS.md`), plus this SUMMARY

## Accomplishments

- **The marker was committed before the send.**
  - Marker: `HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d`, generated `2026-09-13T01:10:59.543Z`.
  - Committed in `49c976a` at `01:11:29Z`, with 0 submissions carrying it at that point.
- **Exactly one tagged submission was sent, and never retried.**
  - MX was re-measured at `01:11:43.608Z` on the local resolver and 8.8.8.8, and the send ran only because both answers named both PrivateEmail hosts.
  - The same command checked that `49c976a` is an ancestor of HEAD.
  - Sent `01:11:46.454Z` as 1 POST to `https://formsubmit.co/ajax/info@haoo.online`, with the marker in the posted body.
  - Response: HTTP 200, body `{"success":"true","message":"The form was submitted successfully."}`.
  - Page: heading `Your details are on their way` with focus, status `Your details were sent.`, 0 forms, bundle `/assets/haoo-CHYRGEim.js`.
  - `navigator.webdriver` read `true`, 0 PostHog requests, 3 Cloudflare challenge-platform requests (CF-JSD-1, not sends).
  - Only one tracked file changed: `evidence/live-submission.json` gained 2 records. The full live suite was not run.
- **Link 3 is CONFIRMED on the owner's report.**
  - The owner's words: the caption *"the last form sumission you made"* and the folder answer **"Inbox"**.
  - Orchestrator's reading of the screenshot: the delivered message carries the committed marker character for character, and was received "Today 04:11" local, which is 01:11 UTC.
  - Full sender and full subject: not stated, cut off in the screenshot.
- **The chain is closed.** `05-EVIDENCE-MAIL.md` opens with a summary listing each link as CONFIRMED with its timestamp. The phase sent 2 live submissions, one per marker. The mail-routing row in REQUIREMENTS.md now records its measured outcome.

## Task Commits

1. **Task 1a: Record the marker before sending:** `49c976a` (docs)
2. **Task 1b: Send exactly one tagged submission and record the observation:** `754ed31` (docs)
3. **Task 2: The owner reads the mailbox (blocking-human):** no commit; answered by the owner
4. **Task 3: Transcribe the delivery report and close the chain:** `944c92f` (docs)
5. **Task 3 follow-up, at the orchestrator's request:** `9c843d7` (docs). The stale pre-send "Was blocked on link 2" placeholder, left under the closed chain section, is now labelled as a history note and kept as written. Nothing else in the file changed.

**Plan metadata:** this SUMMARY's commit, then the state and roadmap commit.

## Files Created/Modified

- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-MAIL.md`, which now carries:
  - the chain summary at the top
  - the Link 3 row of the table
  - Link 3: the pre-send marker, the send observation, the comparison with the success contract, the analytics consequence, the owner's report and the chain close
  - the standing count, updated to 2 sent
- `evidence/live-submission.json`: records 3 and 4, the 05-16 pre-send marker record and the post-send observation
- `.planning/REQUIREMENTS.md`: the mail-routing row's status moved to its measured outcome. LEAD-07 is marked complete in the metadata step.

## Decisions Made

- **The marker reached the spec through `HAOO_LIVE_SUBMISSION_MARKER`.** The spec re-validated it with `markerHasPurpose` before navigating.
- **Link 3's status rests on the owner's report.** The browser success state and FormSubmit's `"success":"true"` are recorded as provider acceptance only.
- **Unstated fields stay unstated.** The full sender and full subject were cut off in the screenshot. They are recorded as not stated rather than filled in from the Link 2 screenshot.
- **No sender-authentication follow-up is raised.** The message landed in the inbox, so the spam branch of D-13 does not apply. The record claims nothing about the domain's sender authentication.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The marker was generated outside `buildMarker`**
- **Found during:** Task 1
- **Issue:** The plan says to generate the marker through the builder 05-06 exported. Importing `e2e/live-submission.e2e.ts` outside the Playwright runner throws `Playwright Test did not expect test.describe() to be called here`.
- **Fix:** I ran the same expression in Node: `randomBytes(4)` hex and the UTC instant to the second. The result matched `MARKER_PATTERN` and the `RELEASE-VERIFICATION` purpose tail at generation, and the armed spec checked it again with `markerHasPurpose` before sending. The method is recorded in the evidence file.
- **Files modified:** `05-EVIDENCE-MAIL.md`
- **Commit:** `49c976a`

**2. [Rule 1 - Premise contradicted in the written record] The tagged send is not counted by analytics**
- **Found during:** Task 1
- **Issue:** The plan asks to name the analytics event as the one known inclusion in the owner's counts, and `05-EVIDENCE-HARNESS.md` §4 expects a human-driven send with `navigator.webdriver` `false`. The send ran through Playwright instead. `navigator.webdriver` read `true` and 0 requests reached `https://us.i.posthog.com`.
- **Fix:** The record names `qualify_submit` and states the measurement: the event was not captured, and the owner's report does not carry it. HARNESS §4 itself was not edited, because that file belongs to another plan. 05-17 or the verifier may want to reconcile it.
- **Files modified:** `05-EVIDENCE-MAIL.md`
- **Commit:** `754ed31`

**3. [Rule 2 - Evidence gap stated rather than filled] Part of the success contract was not measured on live**
- **Found during:** Task 1
- **Issue:** The plan asks to assert the same success state the form-state evidence pins, including the body copy and the follow-up prompt with its two links. `e2e/live-submission.e2e.ts` reads the form count, heading, focus and status text, but not the body copy, the prompt or the links.
- **Fix:** The four parts that were read match the pinned values. The other three are recorded as **not measured**, not as matching. They were not measured afterwards, because that would have needed a second live submission. No windows-ledger entry was opened, because the plan's `<verify>` itself ran in full. This is left for the verifier to classify.
- **Files modified:** `05-EVIDENCE-MAIL.md`
- **Commit:** `754ed31`

---

**Total deviations:** 3 (1 Rule 1, 1 Rule 2, 1 Rule 3)
**Impact on plan:** none changed the one-send limit or the delivery claim. No file under `src/` or `e2e/` was modified.

## Issues Encountered

- **The owner didn't supply the full sender address or the full subject line.** Both were asked for and both were cut off in the screenshot. They are recorded as not stated.
- **The mail client showed no `Date:` header with seconds for this message.** The received time is recorded as "Today 04:11", with its UTC conversion and no seconds.
- **`main` was already 1 commit ahead of `origin/main` at the start** (`7a1a04a`, not this plan's). Nothing was pushed.

## User Setup Required

None.

## Next Phase Readiness

- **05-17 (phase close):** LEAD-07's two claims, activation and delivery, are both recorded as CONFIRMED on the owner's reports. The live-submission count stands at 2 with each marker listed. One item may be worth reconciling at close: the HARNESS §4 inclusion premise, contradicted by deviation 2.
- **Checks on the committed state.** All were run at `2026-09-13T08:13:17Z` on HEAD `9c843d7`, with the working tree matching HEAD for both evidence files:

  | Check | Exit | Reading |
  |---|---|---|
  | Task 3 `<verify><automated>`, run exactly as the plan writes it | 0 | all four clauses held as written, so none needed a separate record |
  | `npm run typecheck` | 0 | |
  | `npm run lint` | 0 | |
  | `npm test` | 0 | `Test Files 10 passed (10)`, `Tests 688 passed (688)` |
  | `npm run verify:disjoint` | 0 | shared paths 26, allowlist subtracted 26, violations 0 |
  | `npm run test:phase1:contracts` | 0 | `3 suites, 3 of 3 markers on green cases, 0 of 8 infrastructure-failure signatures present` |

  The same gates were also measured after `754ed31`, with identical results. Task 1's verify exited 0 after `754ed31`.
- **Live submissions:** this plan sent exactly 1. Nothing further was sent after the owner's report.

## Self-Check: PASSED

- FOUND: `05-EVIDENCE-MAIL.md` (marker, AWAITING OWNER CONFIRMATION history, CONFIRMED, the inbox record), `evidence/live-submission.json` (4 records), `REQUIREMENTS.md` (EXECUTED AND MEASURED)
- FOUND commits: `49c976a`, `754ed31`, `944c92f`, `9c843d7`
- Task 1's verify exited 0 after `754ed31`. Task 3's verify, run as written, exited 0 on `9c843d7`, and every gate exited 0 there (see *Next Phase Readiness*).
