---
phase: quick-260913-p4u
plan: 01
status: complete
subsystem: measurement
tags: [posthog, web-analytics, cookieless, privacy, disclosure, coverage]
requires: [posthog-js 1.425.1 pinned, Phase 04.1 lockdown and readback]
provides:
  - cookieless PostHog lockdown with automatic $pageview/$pageleave
  - reduceCapture Web Analytics property allowlist (successor to stripToBareName)
  - normalized campaign values on every delivered event
  - truthful cookieless measurement disclosure copy
  - COVERAGE.md re-decisions and a pinned "Cookieless server hash mode" boundary sentence
affects: [src/measurement, src/products/haoo.ts, COVERAGE.md, verify:coverage gate]
tech-stack:
  added: []
  patterns: [fail-closed transport-value check, allowlist copied into a fresh literal, campaign-aware re-entry gate]
key-files:
  created: []
  modified:
    - src/measurement/posthog-lockdown.ts
    - src/measurement/posthog.ts
    - src/measurement/index.ts
    - src/test/fixtures/posthog-capture-contract.ts
    - src/test/measurement.test.ts
    - src/products/haoo.ts
    - src/test/measurement-page.test.tsx
    - e2e/recovery.e2e.ts
    - .planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/COVERAGE.md
    - scripts/verify-phase4-coverage.mjs
    - src/test/haoo-report.test.ts
decisions:
  - "processorNote is pinned claim by claim in measurement-page.test.tsx, not restated whole, so the Phase 04.1 one-source contract for the processor copy stays intact"
  - "COVERAGE.md \"Discard client IP data\" paragraph no longer calls the payload bare-name; $geoip_disable now framed as withholding disclosed approximate location"
metrics:
  duration: "about 15 min in this resumed run (the earlier, interrupted run's time is not recoverable)"
  completed: 2026-09-13
actuals:
  tokens: 14125
  tasks: 3
  commits: 3
---

# Quick Task 260913-p4u Plan 01: Enable PostHog Web Analytics via Cookieless Mode Summary

The PostHog lockdown now uses `cookieless_mode: 'always'` and turns on the automatic `$pageview` (initial page load only) and `$pageleave`. A new `before_send` reducer, `reduceCapture`, only lets an event through if it carries the exact cookieless transport values. It then copies a fixed list of Web Analytics properties, cuts the page address down to origin and path and the referrer down to its origin, and writes the facade's cleaned-up campaign values onto each event. The visitor-facing disclosure, the coverage matrix and the verifier were updated to match. All six project gates pass.

## Resume note

A previous executor stopped partway through Task 1 when it hit an API spend limit. It left uncommitted changes in the five Task 1 files. I checked those changes against the plan and found them correct and essentially complete: 311 unit tests passed, typecheck was clean, the source-boundary scan was clean, and every acceptance grep matched. I kept all of it. My only changes were rewrapping two comments in `src/measurement/posthog.ts`: the doc-comment "Nothing in this module throws" paragraph, and an over-long line in the reconfiguration comment. After that I verified and committed.

## Tasks

| Task | Name | Commit | Key files |
|------|------|--------|-----------|
| 1 | Tracer: one cookieless `$pageview` end-to-end, then expand the unit contract | 3f193fa | posthog-lockdown.ts, posthog.ts, index.ts, posthog-capture-contract.ts, measurement.test.ts |
| 2 | Truthful disclosure copy and page-level journey proofs | 633e77b | haoo.ts, measurement-page.test.tsx, recovery.e2e.ts |
| 3 | Re-decide the coverage matrix, pin the cookieless setting, run every gate | 4c43be8 | COVERAGE.md, verify-phase4-coverage.mjs, haoo-report.test.ts |

## Tracer RED reason (Task 1)

The earlier run left no record that RED had been observed, so I reproduced it. I exported HEAD `f1b511b` into the scratchpad with `git archive`, dropped in the new fixture (the one with `simulateAutomaticCapture`), and ran the tracer case on its own against the unchanged pre-change measurement source. It failed as expected:

```
× cookieless web analytics tracer > delivers one cookieless $pageview with a reduced address and normalized campaign values
  → expected [] to have a length of 1 but got +0
```

The cause: at HEAD the lockdown sent `capture_pageview: false`, so the fixture's automatic-capture channel never ran and nothing was delivered. After the change the same case passes in `src/test/measurement.test.ts`.

## RED reason (Task 2)

I wrote the new copy pins before editing `haoo.ts`. `renders the approved complete measurement disclosure` then failed with `expected 'These signals are sent as bare names …' to be 'Each of these signals, and each page …'`. All the wire-level cases already passed because Task 1 had landed. After the copy change, all 77 tests in the four Task 2 files pass.

## Mutation probe (Task 3)

I copied COVERAGE.md to the scratchpad and deleted "while it is off" from the new Operational boundary sentence. Then I ran `node scripts/verify-phase4-coverage.mjs <copy>`:

```
Phase 4 coverage audit failed:
- Operational boundary: must state that cookieless server hash mode is an owner-performed project setting and events are dropped at ingestion while it is off
probe exit: 1
```

I deleted the copy afterwards.

## Gate outputs

Run in plan order on the final tree:

| Gate | Result |
|------|--------|
| `npm run verify:coverage` | exit 0 — `Phase 4 coverage audit passed: 70 required capabilities across 3 tables.` |
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm test` | exit 0 — build ok; `Test Files 10 passed (10)`, `Tests 748 passed (748)` |
| `npm run verify:disjoint` | exit 0 — `Tree disjointness audit passed.` |
| `npm run test:phase1:contracts` | exit 0 — `Test Files 3 passed (3)`, `Tests 74 passed (74)`; `Phase 1 contracts confirmed green: 3 suites, 3 of 3 markers on green cases, 0 of 8 infrastructure-failure signatures present.` |
| `git diff --stat -- src/reporting config` | empty (OD-3, OD-5, PD-6) |

Acceptance greps:
- `cookieless_mode: 'always'` appears 3 times in the lockdown.
- `merged.save_referrer === true`, `merged.capture_pageleave === true` and `merged.cookieless_mode === 'always'` each appear once.
- `stripToBareName(` has no call sites left; the only mention is the named-successor doc comment.
- In `haoo.ts`, "changes every day" appears once and "current page load" does not appear.
- In `measurement-page.test.tsx`, "changes every day" appears once and `simulateAutomaticCapture` appears 8 times.
- `recovery.e2e.ts` no longer contains "capture_pageview is false".
- In COVERAGE.md, "Cookieless server hash mode" appears twice and the `cookieless_mode` INTEGRATE row matches once.
- The verifier's save_referrer INTEGRATE entry matches once.

## Owner steps

**"Cookieless server hash mode" must be enabled BEFORE the next deploy.** While it is off, PostHog ingestion drops every event sent with `cookieless_mode: 'always'`. The site would then look like a dead funnel: Web Analytics and the haoo_* report counts would both go to zero.

1. **BEFORE the next deploy:** enable "Cookieless server hash mode" (project 589225, US region). Leave "Discard client IP data" as currently configured. Location: PostHog -> Project settings -> Web analytics.
2. **BEFORE the next deploy:** read the rewritten measurement disclosure copy in src/products/haoo.ts (signalBoundary, campaignDescription, processorNote, neverCollected) and approve or amend it. Location: Repository, src/products/haoo.ts, disclosure block.
3. **AFTER deploy:** open https://www.haoo.online/ in a real, non-headless browser with ad/tracker blockers off and wait a few minutes. Confirm that PostHog Web Analytics shows the visit (1 pageview on path /, host www.haoo.online). Also confirm that Activity shows a $pageview whose $current_url has no query string or fragment. A Playwright or headless run reads 0 by design, because posthog-js drops navigator.webdriver traffic; that is not a failure. Location: PostHog -> Web analytics, and PostHog -> Activity -> Events.

## Disclosure provenance

I drafted the new `signalBoundary`, `campaignDescription`, `processorNote` and `neverCollected` strings under owner decisions OD-1 (Web Analytics and Product Analytics must work) and OD-2 (cookieless identity). The owner has not approved them yet and needs to read them before the next deploy. The provenance comments in `src/products/haoo.ts` say this, and none of the new strings is labelled owner-approved.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Conflict with an existing contract] processorNote pinned as claims, not as one byte-exact literal**
- **Found during:** Task 2
- **Issue:** The plan asked for hand-typed byte pins of all four replaced fields in `measurement-page.test.tsx`. An existing Phase 04.1 case, `asserts the approved copy from product data rather than a restated literal`, reads that same test file and requires that it NOT contain `disclosure.processorNote`. The processor copy is meant to have exactly one source, and the copy mutation probe in `build-output.test.ts` depends on that. A full literal pin made that case fail.
- **Fix:** `signalBoundary`, `campaignDescription` and all seven `neverCollected` items keep full byte pins. `processorNote` is pinned by six hand-typed claim fragments, one per truthful statement: United States processing, no cookies or browser storage, a server-side code from IP and browser details, "that code changes every day", approximate location, and never linked to form answers. The ordered-copy check reads the note from product data. The existing contract was not weakened.
- **Files modified:** src/test/measurement-page.test.tsx
- **Commit:** 633e77b

**2. [Rule 1 - Untrue doc statement] COVERAGE.md "Discard client IP data" paragraph**
- **Found during:** Task 3
- **Issue:** The paragraph said `$geoip_disable` "would contradict the bare-name payload" and that there is no lever "that keeps events bare". Both statements are false now. The plan re-decided the matching table row but did not mention this paragraph.
- **Fix:** The paragraph now says `$geoip_disable` would withhold the approximate location that is disclosed to visitors and used by Web Analytics. The pinned sentence `"Discard client IP data" is an owner-performed project setting` is unchanged.
- **Files modified:** COVERAGE.md
- **Commit:** 4c43be8

**3. [Rule 1 - Acceptance count] doc comment wording in haoo.ts**
- **Found during:** Task 2
- **Issue:** My first provenance comment above `processorNote` included the phrase "changes every day", which made the grep count 2 when the acceptance criterion requires exactly 1.
- **Fix:** Reworded the comment to "is renewed daily".
- **Commit:** 633e77b

## Known Stubs

None.

## Threat Flags

None. The new surface (page, referrer, browser properties and campaign values reaching PostHog) is covered by T-p4u-01 through T-p4u-08 in the plan's threat model.

## State updates

This is a quick task, so the orchestrator owns the docs commit and STATE.md. I did not modify STATE.md or ROADMAP.md, and I did not push or deploy anything.

## Self-Check: PASSED

All 11 modified files and the SUMMARY exist; commits 3f193fa, 633e77b and 4c43be8 are present in git history.
