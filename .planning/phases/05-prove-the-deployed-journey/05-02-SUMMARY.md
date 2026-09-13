---
phase: 05-prove-the-deployed-journey
plan: 02
subsystem: infra
tags: [dns, mx, privateemail, cloudflare, lead-07, evidence]

requires:
  - phase: 05-01
    provides: "The HAOO checkout as the working directory for Phase 5 evidence"
provides:
  - "05-EVIDENCE-MAIL.md: the three-link LEAD-07 record, with link 1 (MX) CONFIRMED from the local resolver and 8.8.8.8, and links 2 and 3 NOT STARTED"
  - "Pre-change (2026-09-07T18:50:29Z) and post-change (2026-09-12T20:40:04Z to 21:03:51Z) MX answers recorded verbatim, plus a post-interruption re-measurement at 2026-09-13T00:06:36Z"
  - "A recorded zone move: NS now bella/oswald.ns.cloudflare.com, and the apex and www now resolve to two Cloudflare proxy addresses"
affects: [05-06, 05-16, 05-17, "phase verification"]

actuals:
  tokens: 8172
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Close a DNS gate on ten consecutive agreeing rounds from both named resolvers, taken after the latest-expiring negative-cache entry has run out. One agreeing round is not enough"
    - "Keep another process's measurements in their own paragraph, labelled with who took them"

key-files:
  created:
    - .planning/phases/05-prove-the-deployed-journey/05-02-SUMMARY.md
  modified:
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-MAIL.md
    - .planning/WINDOWS.md

key-decisions:
  - "Link 1 was not set to CONFIRMED on the single agreeing round at 20:47:07Z. It waited for the negative caches to expire and then ten consecutive agreeing rounds"
  - "The task 3 automated check was recorded as it ran (exit 1 on the four-address A clause). It was not rewritten. The A set changed because the zone moved to Cloudflare, not because of the MX edit"
  - "The orchestrator's separate ten-round watch (reached ten at 21:06:05Z) is cited as corroboration and kept out of the executor's own series"

patterns-established:
  - "Restart rule in practice: after an interruption, MX is re-measured before the record is committed, and nothing recorded earlier is used as a precondition"

requirements-completed: []

coverage:
  - id: D1
    description: "haoo.online publishes MX 10 mx1.privateemail.com and 10 mx2.privateemail.com, answered by the local resolver and by 8.8.8.8"
    requirement: LEAD-07
    verification:
      - kind: other
        ref: "dig +short MX haoo.online ; dig +short MX haoo.online @8.8.8.8 (task 3 verify clauses 1-3, 2026-09-13T00:06:39Z)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The website is unaffected by the MX edit (T-05-06)"
    requirement: LEAD-07
    verification:
      - kind: other
        ref: "amended task 3 clause 4 (owner decision 2026-09-13): apex 301 to www, www 200 with /assets/haoo- bundle; amended check exit 0 at 2026-09-13T00:15:46Z. Retired clause measured 2 A records at 2026-09-13T00:06:39Z"
        status: pass
      - kind: other
        ref: "curl -sSI https://haoo.online/ (301 to www) and https://www.haoo.online/ (200, HAOO bundle), 2026-09-12T21:03:52Z"
        status: pass
    human_judgment: false
    rationale: "The retired four-address clause needed a person to decide whether the criterion still applied. The owner decided on 2026-09-13 to amend it to site-still-serves, and the amended check exits 0, so no judgement remains open."

duration: "about 10 min of active resumed work; wall time from 2026-09-07 to 2026-09-13, spanning the owner's DNS change and two interruptions"
completed: 2026-09-13
status: complete
---

# Phase 5 Plan 02: MX Gate for haoo.online Summary

**haoo.online now publishes MX `10 mx1.privateemail.com` / `10 mx2.privateemail.com`. The local resolver and 8.8.8.8 both returned both hosts in ten consecutive rounds, in a full closing run and again after the interruption. The plan's four-address A-record check now measures 2 Cloudflare proxy addresses, because the zone moved to Cloudflare.**

## Performance

- **Duration:** about 10 min of active resumed work. Wall time is not meaningful here because it covers the owner's DNS change and two interruptions.
- **Started:** 2026-09-07T18:50:29Z (task 1 pre-change measurement)
- **Completed:** 2026-09-13T00:10:07Z
- **Tasks:** 3 of 3 (task 2 was the owner's blocking-human DNS change)
- **Files modified:** 1 evidence file, plus the windows ledger

## Accomplishments

- Link 1 of the LEAD-07 chain is **CONFIRMED** in `05-EVIDENCE-MAIL.md`. At `2026-09-12T21:03:51Z` the local resolver and `8.8.8.8` both named both PrivateEmail hosts. That followed ten consecutive rounds from `21:02:44Z` to `21:03:30Z`, and it was re-measured at `2026-09-13T00:06:36Z`.
- The record keeps the full history, including the runs that did not close the link. At `20:40:04Z` both named resolvers returned empty (`NOERROR`, `ANSWER: 0`, cached SOA serial `2414638242`), and the interval of alternating cached answers that followed is kept verbatim.
- Two zone changes were recorded as measured, not attributed to the MX edit. NS moved from `dns1/dns2.registrar-servers.com` to `bella/oswald.ns.cloudflare.com`. The apex and `www` resolve to `104.21.65.146` / `172.67.164.26` (Cloudflare proxy). When the delegation moved is not known from inside this plan.
- Link 2 (05-06) now has a published exchanger to receive FormSubmit's activation mail. Links 2 and 3 remain **NOT STARTED**.

## Task Commits

1. **Task 1: Record the pre-change DNS state for haoo.online verbatim** - `1edf3cd` (docs)
2. **Task 2: BLOCKING HUMAN, add the two MX records** - owner action, reported 2026-09-12. No commit.
3. **Task 3: Re-measure MX from two independent resolvers and close link 1** - `efbbd49` (docs)

**Plan metadata:** recorded in the state/roadmap commit that follows this SUMMARY's commit.

## Files Created/Modified

- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-MAIL.md` - The LEAD-07 three-link record. Link 1 carries its pre-change, post-change and post-interruption measurements.
- `.planning/WINDOWS.md` - A deviation entry for the task 3 A-record clause.

## Decisions Made

- Link 1 was not set to CONFIRMED on the `20:47:07Z` row. That round agreed, but it came straight after rounds where each resolver answered empty. The closing series began only after the latest-expiring negative-cache entry seen (`1294` s at `20:40:04Z`, expiring about `21:01:38Z`) had run out.
- The orchestrator's separate watch is cited in its own paragraph as the orchestrator's measurement. It reached ten consecutive rounds at `2026-09-12T21:06:05Z`, and its spot check at `2026-09-13T00:04Z` returned the same.

## Deviations from Plan

### Criterion that no longer describes the zone

**1. Task 3's automated check exits 1 on its A-record clause**
- **Found during:** Task 3 (first at `2026-09-12T21:03:53Z`, and again at `2026-09-13T00:06:39Z`)
- **Issue:** `test "$(dig +short A haoo.online | wc -l)" -eq 4` measures `2`. The zone moved to Cloudflare, and the apex now resolves to two proxy addresses, not the four GitHub Pages addresses. The three MX clauses each exit `0`.
- **Action:** The check was recorded as it ran and was not rewritten. The intent of threat T-05-06, that the website keeps serving, was measured separately with `curl`: the apex returns 301 to `www`, and `www` returns 200 from Cloudflare with `/assets/haoo-C1OXjuEM.js`. Logged to `.planning/WINDOWS.md` as a deviation.
- **Open for a person:** whether to amend the plan's acceptance criterion (for example, "the site still serves" instead of "four A records"). Not decided here.
- **Resolved after the plan landed (owner decision 2026-09-13):** the owner chose to amend clause 4 to "the site still serves" (apex 301 to www, www 200 with the HAOO bundle). The amended check exited `0` at `2026-09-13T00:15:46Z`; WINDOWS.md #36 is resolved. Recorded in `05-EVIDENCE-MAIL.md` § Link 1, "Owner amendment to the task 3 check".

### Record fixes made while checking the uncommitted draft

- The draft cited the `1253` s entry as the longest negative-cache entry seen. The `1294` s entry at `20:40:04Z` expires later (about `21:01:38Z`). Both are recorded now. The closing series at `21:02:44Z` still starts after both.
- "Rounds five seconds apart" became "about five seconds apart (six between rounds 4 and 5)", which matches the table.
- The `20:41:43Z` single-query observation is now marked as having no transcript in the file.
- The closing-run summary table is marked as listing hosts sorted, since the returned order is in the verbatim block.
- The owner-decision table's state now reads "DECIDED, NOT EXECUTED as of 2026-09-07; executed by the owner on 2026-09-12", so it no longer contradicts link 1's status.

No measurement was altered.

**Total deviations:** 1 criterion mismatch (recorded, not resolved), plus 5 consistency fixes to the draft
**Impact on plan:** The MX gate this plan exists for is met from both named resolvers. The A-record criterion needs an owner or planner decision.

## Issues Encountered

- **Interruptions.** The executor was cut off by an API spend limit twice: once during the post-change polling, and again after it had written Task 3's evidence but before committing it. Its poller processes did not survive either stop, so no polling ran between the cutoff and the resume. On resume, per the file's Restart rule and D-10, MX was re-measured at `2026-09-13T00:06:36Z` before the evidence was committed. Both resolvers named both hosts.
- **Owner's instructions changed before the owner acted.** The zone had moved to Cloudflare, so the orchestrator redirected the owner from Namecheap BasicDNS to the Cloudflare dashboard. Records added at Namecheap would not have been served.
- **Not reported by the owner:** the priority values (`10`/`10` are as measured) and the time the change was saved.

## Gate Baseline (run 2026-09-13, unchanged by this plan)

`npm run typecheck` 0 · `npm run lint` 0 · `npm test` 684 tests / 10 files · `npm run verify:disjoint` 26 shared / 26 allowlisted / 0 violations · `npm run test:phase1:contracts` 0.

## User Setup Required

None remaining for link 1. Two owner items are open:
- The plan's four-address A-record criterion, above.
- The zone publishes no SPF record (`dig +short TXT haoo.online @8.8.8.8` empty at `21:03:51Z`). This does not affect link 1. It may affect whether mail sent *from* `haoo.online` is accepted elsewhere.

## Next Phase Readiness

- 05-06 (link 2, activation) can be attempted. It re-measures MX first, under the Restart rule.
- LEAD-07 is not complete. Activation and delivery are outstanding, so `requirements-completed` is empty and LEAD-07 is not marked complete.
- No mail was sent and no form was submitted in this plan.

---
*Phase: 05-prove-the-deployed-journey*
*Completed: 2026-09-13*

## Self-Check: PASSED

- FOUND: `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-MAIL.md` (contains `mx1.privateemail.com`, `mx2.privateemail.com`, `8.8.8.8`, and three `Link [123]` headings)
- FOUND: commit `1edf3cd` (task 1)
- FOUND: commit `efbbd49` (task 3)
