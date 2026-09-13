---
phase: 05-prove-the-deployed-journey
plan: 06
subsystem: testing
tags: [playwright, formsubmit, lead-07, live-submission, evidence, activation]

requires:
  - phase: 05-02
    provides: "Link 1 (MX) CONFIRMED, so FormSubmit's activation mail to info@haoo.online had a published exchanger"
  - phase: 05-12
    provides: "The form-driving selectors, the submission status-region reading (FS-O1) and the provider-host guard pattern"
provides:
  - "e2e/live-submission.e2e.ts: the one mechanism for live form submissions, inert unless HAOO_SEND_LIVE_SUBMISSION is set, with exported marker purposes, MARKER_PATTERN, buildMarker and markerHasPurpose for 05-16"
  - "Link 2 (activation) of LEAD-07 CONFIRMED on the owner's report, corroborated by delivery of the marked activation-trigger submission at 00:33:02 +0000"
  - "evidence/live-submission.json: the marker written before the send, and the full browser observation of the one send"
  - "The standing count of live submissions in Phase 5 (one sent, one to come in 05-16) and the corrected reason for the FS-3 amendment to two"
affects: [05-16, 05-17, "phase verification", "LEAD-07"]

actuals:
  tokens: 11765
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "A spec that touches a real third party is skipped by default, needs a named purpose, runs on one project, pins retries to 0 and refuses a retry or repeat index"
    - "Write the marker to evidence before the submit, and write the whole observation before any assertion, so a failed run still leaves its record"
    - "A side-effect run of the full live suite is followed by restoring other plans' committed evidence by explicit path, after a field-level diff names any genuine value change"

key-files:
  created:
    - e2e/live-submission.e2e.ts
    - evidence/live-submission.json
    - .planning/phases/05-prove-the-deployed-journey/05-06-SUMMARY.md
  modified:
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-MAIL.md
    - .planning/phases/05-prove-the-deployed-journey/deferred-items.md

key-decisions:
  - "Link 2 of LEAD-07 set to CONFIRMED on the owner's words ('activated form submit and received 3 submissions'), corroborated by FormSubmit delivering the marked activation-trigger submission at Sun, 13 Sep 2026 00:33:02 +0000; folder, full sender address and post-click page text were not stated and are not inferred"
  - "The live-submission spec pins retries to 0 and refuses a retry or repeat index, because the live project's retries: 2 would turn one armed run into up to three real messages"
  - "The form's email control carries info@haoo.online, the owner-confirmed mailbox under test, so no address outside the owner's control entered the submission"
  - "The delivered activation-trigger message is an observation under Link 2 and does not close Link 3; the phase still sends exactly two live submissions, now justified on D-11/D-12/D-13 grounds after the plan's premise (FormSubmit does not deliver the triggering submission) was contradicted"

patterns-established:
  - "Owner reports are transcribed verbatim with any owner correction kept beside the original text; orchestrator readings of screenshots are labelled as readings"

requirements-completed: []

coverage:
  - id: D1
    description: "The live-submission spec sends nothing unless HAOO_SEND_LIVE_SUBMISSION is set"
    requirement: LEAD-07
    verification:
      - kind: e2e
        ref: "npm run test:e2e:live with the flag unset, twice (00:19:27Z-00:23:07Z and 00:24:09Z-00:27:57Z): exit 0, 128 passed, 14 skipped, this spec reported skipped with the guard's annotation; no evidence/live-submission.json written"
        status: pass
      - kind: e2e
        ref: "npx playwright test --project=preview e2e/live-submission.e2e.ts, flag unset: 1 skipped, exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exactly one marked activation-trigger submission sent from the live page, with its marker fixed before sending and the browser observation recorded"
    requirement: LEAD-07
    verification:
      - kind: e2e
        ref: "HAOO_SEND_LIVE_SUBMISSION=1 HAOO_LIVE_SUBMISSION_PURPOSE=ENDPOINT-ACTIVATION npx playwright test --project=live e2e/live-submission.e2e.ts --retries=0 --workers=1 (00:30:30.546Z-00:30:40.659Z, exit 0); evidence/live-submission.json providerPostCount 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "The FormSubmit endpoint for info@haoo.online is activated (link 2)"
    requirement: LEAD-07
    verification:
      - kind: manual_procedural
        ref: "Owner's report 2026-09-13, transcribed in 05-EVIDENCE-MAIL.md Link 2 'Owner's mailbox report'"
        status: pass
    human_judgment: true
    rationale: "Activation happens in a mailbox and a browser session only the owner can reach; the status rests on the owner's statement"

duration: 28min
completed: 2026-09-13
status: complete
---

# Phase 5 Plan 06: Endpoint Activation (LEAD-07 Link 2) Summary

**A guarded Playwright spec sent one marked submission from www.haoo.online, and the owner activated the FormSubmit endpoint. Link 2 is confirmed on the owner's report and corroborated by delivery of that marked message at 00:33:02 UTC.**

## Performance

- **Duration:** about 28 min, from the first measured action to the SUMMARY
- **Started:** 2026-09-13T00:15:07Z (Task 1's MX precondition measurement)
- **Completed:** 2026-09-13T00:42:08Z
- **Tasks:** 3 of 3
- **Files modified:** 5 (2 created in the product repository, 1 evidence file created, 2 planning files modified), plus this SUMMARY

## Accomplishments

- **The live-submission spec is built and inert by default.**
  - `e2e/live-submission.e2e.ts` skips its whole describe block unless `HAOO_SEND_LIVE_SUBMISSION` is set.
  - When armed, it needs `HAOO_LIVE_SUBMISSION_PURPOSE` and runs on `live` only. It pins retries to 0 and refuses a retry or repeat index.
  - It exports `MARKER_PURPOSE_ENDPOINT_ACTIVATION`, `MARKER_PURPOSE_RELEASE_VERIFICATION`, `MARKER_PATTERN`, `buildMarker` and `markerHasPurpose`. 05-16 can also supply a marker it recorded earlier, through `HAOO_LIVE_SUBMISSION_MARKER`.
- **The spec is proven inert by runs, not by a comment.**
  - Two full unarmed `npm run test:e2e:live` runs each exited 0, with 128 passed and 14 skipped.
  - The JSON reporter gives this spec `status: "skipped"`, `expectedStatus: "skipped"`, retry 0, with the guard's own skip annotation.
  - The live form specs recorded `providerAttemptCount: 0` in all 8 live records across the two runs.
- **Exactly one activation-trigger submission was sent, and never retried.**
  - MX was re-measured on both resolvers immediately before (00:30:30Z), and the send was gated on it.
  - Marker: `HAOO-ENDPOINT-ACTIVATION-20260913T003033Z-571c962a`, written to evidence at 00:30:34.765Z.
  - Sent at 00:30:34.768Z as 1 POST to `https://formsubmit.co/ajax/info@haoo.online`.
  - Response: HTTP 200 with body `{"success":"false","message":"This form needs Activation. …"}`.
  - The confirmation card rendered with its heading focused, and the status region read `Your details were sent.`
  - 0 requests reached PostHog ingestion, and 3 Cloudflare challenge-platform requests were observed (O-2).
- **Link 2 is CONFIRMED on the owner's report.**
  - The owner's words: "activated form submit and received 3 submissions".
  - Corroboration: the marked submission was delivered with header `Sun, 13 Sep 2026 00:33:02 +0000`.
  - The two other delivered messages are the owner's own PostHog test submissions, recorded separately as not phase sends.
  - Link 3 stays NOT STARTED.

## Task Commits

1. **Task 1: Build the guarded live-submission spec and prove it sends nothing by default:** `9a2b00d` (feat)
2. **Task 2: Send exactly one activation-trigger submission and record what the browser observed:** `c24e1e6` (docs)
3. **Task 3: Owner confirms the activation link (blocking-human):** `934c672` (docs, the owner's report transcribed and Link 2 set)

**Plan metadata:** this SUMMARY's commit and the state/roadmap commit follow.

## Files Created/Modified

- `e2e/live-submission.e2e.ts`: the guarded live-submission spec and the exported marker convention
- `evidence/live-submission.json`: two records, the marker fixed before sending and the observation after the one send
- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-MAIL.md`, which now carries:
  - the Link 2 section: MX re-measurements, the guard proofs, the send and what it does and does not prove, and the standing count and FS-3 amendment
  - the owner's verbatim report, L2-O2, and the owner's own test submissions
  - the Link 2 row of the summary table
- `.planning/phases/05-prove-the-deployed-journey/deferred-items.md`: L2-O1

## Decisions Made

- **The email control carries `info@haoo.online`.** The plan says the email control gets "the release-verification address the owner confirms at the checkpoint below", but the checkpoint text names no address. The owner-confirmed mailbox under test was used, so no address outside the owner's control was placed in a third-party submission. FormSubmit uses the field as the reply-to and does not mail it.
- **The marker purpose is selected by `HAOO_LIVE_SUBMISSION_PURPOSE`.** Without a named purpose an armed run throws before navigating, so it cannot send a message whose marker says the wrong thing.
- **Link 2's status is attributed explicitly.** The owner's statement authorises CONFIRMED, and the delivered marked message corroborates it. Neither the browser confirmation state nor the delivered message was treated as authorising it on its own.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Retries pinned to 0 on the live-submission spec**
- **Found during:** Task 1
- **Issue:** `playwright.config.ts` gives the `live` project `retries: 2`. An armed run that failed after the POST would have re-sent real mail up to twice more.
- **Fix:** Four changes:
  - `test.describe.configure({ retries: 0 })` on the block.
  - A hard refusal when `testInfo.retry` or `testInfo.repeatEachIndex` is non-zero.
  - A `live`-only project guard, since the preview build posts to the same production endpoint.
  - `--retries=0 --workers=1` on the armed command line.
- **Files modified:** `e2e/live-submission.e2e.ts`
- **Verification:** the armed run reported one result at retry 0, with 1 provider POST.
- **Committed in:** `9a2b00d`

**2. [Rule 3 - Blocking] The plan's Task 1 verify compares against a committed tree**
- **Found during:** Task 1 verification
- **Issue:** `git diff --name-only HEAD | grep -qv '^src/'` prints nothing once the task is committed, so `grep -qv` exits 1 and the chain can never succeed.
- **Fix:** The same check against the committed change, `git diff --name-only HEAD~1 HEAD | grep -qv '^src/'`. The rest of the chain ran as written.
- **Verification:** typecheck 0, lint 0, committed diff outside `src/`, `npm run test:e2e:live` 0, `skipped` reported.

**3. [Rule 2 - Missing critical] Other plans' committed evidence restored after each side-effect run**
- **Found during:** Task 1 verification
- **Issue:** Each full unarmed `npm run test:e2e:live` run re-ran every live spec. Each run modified the same 36 tracked `evidence/*.json` files that belong to 05-03 and 05-07 through 05-14: `axe-baseline.json` rewrites itself, and 35 files had 131 records appended.
- **Fix:** After each run, I saved the diff, checked that every committed record survived as an intact prefix, and diffed the appended records field by field. Then I restored each file to HEAD with `git checkout -- <path>`. Nothing from these runs was committed.
- **Genuine value changes found (the same four in both runs), all explained by already-recorded events:**
  1. `keyboard-traversal.json` and `viewport-primary-actions.json` (S1): two link `href`s changed from `/` (committed 2026-09-11) to `https://www.zero-paperhub.com/`. This is the F1-LIVE deploy of 2026-09-12 (run 34687312104, head `c39cc5a`).
  2. `recovery-analytics-blocked.json`: `deployedBundle` changed from `haoo-D1dl6F2P.js` to `haoo-C1OXjuEM.js`. This is the ZM-LIVE deploy of 2026-09-12 (run 34717723054, `651eebe`).
  3. `recovery-retired-path.json` (S4): edge-injected scripts went from 2 to 1, and `static.cloudflareinsights.com/beacon.min.js` is absent. This is O-1's beacon removal, measured absent by the orchestrator at 2026-09-12T20:31:04Z.
  - Everything else differed only in timestamps, `attemptedAt` or `elapsedMs`.
- **Note:** the saved diffs were in this session's scratchpad and are not durable. The committed evidence files remain the records of record.

**4. [Rule 1 - Bug in the written record] The FS-3 amendment's reason was contradicted and has been corrected**
- **Found during:** Task 3
- **Issue:** Task 2 wrote the plan's premise as the reason for amending FS-3 to two live submissions: FormSubmit does not deliver the triggering submission. The owner's screenshot shows that submission delivered at 00:33:02 +0000.
- **Fix:** Recorded as Observation L2-O2. The amendment paragraph now keeps the original premise visible, says it was contradicted, and grounds the count of two on D-11 ordering and on D-12/D-13, which require Link 3's own pre-fixed release marker and folder record.
- **Committed in:** `934c672`

---

**Total deviations:** 4 (2 Rule 2, 1 Rule 3, 1 Rule 1)
**Impact on plan:** each one reduces the risk of a duplicate real send or keeps the record accurate. No product source changed.

## Issues Encountered

- **L2-O1: the form shows "sent" on `"success":"false"`.**
  - What happened: FormSubmit answered HTTP 200 with a body saying the form was not activated, and the shipped form still rendered the confirmation card and `Your details were sent.`
  - Why: `src/components/QualifyForm.tsx` sets its terminal state from `response.ok` alone, by design.
  - Where it's logged: `deferred-items.md`. Fixing it changes `src/`, which is outside this plan.
  - The windows ledger append for L2-O1 was refused. `gsd-tools windows append` rejects the existing ledger because entry 36 carries `status: "resolved"`, which the tool reports as invalid. That entry was not written by this plan and was left untouched.
- **Three report fields were requested and not stated by the owner:**
  1. the folder, inbox or spam (the screenshot shows "Current Folder" without a name)
  2. the full sender address (truncated to `FormSubmit <submission…`)
  3. the page text after clicking the activation link, and whether it was clicked more than once

  None is inferred. A later owner answer is to be added as a dated amendment.
- **Two owner-generated test submissions were delivered in the same window.** They are the owner's checks of PostHog web and product analytics, recorded separately as not phase sends. The owner's PostHog check is an open owner item, pending in the owner's words ("still pening" [owner's correction: "*pending"]).
- **O-2 was observed:** 3 Cloudflare challenge-platform requests during the send run, recorded and not counted as sends.

## User Setup Required

None.

## Next Phase Readiness

- **05-16:**
  - It can reuse `e2e/live-submission.e2e.ts` with `HAOO_LIVE_SUBMISSION_PURPOSE=RELEASE-VERIFICATION`.
  - It can commit its marker first and pass it through `HAOO_LIVE_SUBMISSION_MARKER`. The spec validates the marker against the purpose and refuses a mismatch.
  - It must re-measure MX before relying on links 1 and 2 (*Restart rule*).
  - Its owner checkpoint must ask for the folder explicitly, because this plan's report left it unstated.
- **LEAD-07 is not complete:** delivery (Link 3) is outstanding, so `requirements-completed` is empty.
- **Gate baseline held:** `npm run typecheck` 0, `npm run lint` 0, `npm test` 684 tests / 10 files, `npm run verify:disjoint` 26 subtracted / 0 violations, `npm run test:phase1:contracts` 0.
- **Live submission count:** exactly 1 sent by this plan. No other live submission was sent by any run in this plan.

## Self-Check: PASSED

- FOUND: `e2e/live-submission.e2e.ts`, `evidence/live-submission.json`, `05-EVIDENCE-MAIL.md`, `deferred-items.md`
- FOUND commits: `9a2b00d`, `c24e1e6`, `934c672`

---
*Phase: 05-prove-the-deployed-journey*
*Completed: 2026-09-13*
