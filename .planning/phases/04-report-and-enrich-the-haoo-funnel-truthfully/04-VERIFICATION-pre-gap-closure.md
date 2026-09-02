---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
verified: 2026-09-01T19:50:37Z
status: gaps_found
score: 80/95 must-haves verified
roadmap_score: 2/3 success criteria verified
behavior_unverified: 0
overrides_applied: 0
next_action: "Gaps found. Plan the fixes, then re-run execute-phase before shipping."
next_command: "/gsd-plan-phase 04 --gaps"
decision_coverage:
  honored: 4
  total: 4
  not_honored: []
re_verification:
  previous_status: gaps_found
  previous_score: 69/85
  gaps_closed:
    - "Plausible preload options now use plausible.o instead of an event-shaped queue entry for the owned preload stub."
    - "Every accepted Stats response is provenance-checked for site, metric, dimension, ordered goal filter, and calendar range before count parsing."
    - "Caught write and rename failures clean only the invocation-owned temporary sibling while preserving the prior report."
    - "README and owner setup now document both local variables and name-only missing-variable diagnostics."
    - "The stored Phase 4 goal is now a valid MVP user story."
  gaps_remaining:
    - "The browser configuration accepts executable JavaScript from any structurally valid HTTPS .js origin."
    - "A pre-existing provider without a usable initializer, or one whose initializer throws, still yields a live sink and appended script."
  regressions: []
gaps:
  - truth: "Production analytics configuration cannot introduce arbitrary first-party-executing JavaScript or identity tracking."
    status: failed
    reason: "resolvePlausibleScriptSrc accepts any HTTPS URL ending in .js; a tampered public build variable can therefore load attacker-controlled code with page, form, and storage access."
    artifacts:
      - path: "src/products/haoo.ts"
        issue: "Lines 63-85 validate URL shape but never constrain the origin or approved path family."
      - path: "src/test/measurement.test.ts"
        issue: "The resolver table has no structurally valid foreign-origin rejection case."
    missing:
      - "Validate the configured script URL against an independently trusted approved origin/path contract."
      - "Add a regression test that rejects a valid HTTPS .js URL on another origin."
  - truth: "Automatic pageview capture is disabled before any configured provider script or event sink becomes usable."
    status: failed
    reason: "createPlausibleEventSink appends the script before initialization and returns a sink even when an existing provider has no init function or init throws; the required opt-out is therefore not established fail-closed."
    artifacts:
      - path: "src/measurement/plausible.ts"
        issue: "Lines 90-92 retain an arbitrary existing function, lines 134-143 append before optional initialization and swallow failure, and lines 145-154 still return the event sink."
      - path: "src/test/measurement.test.ts"
        issue: "Tests cover only a cooperative initializer and provider-call failure after successful setup, not absent or throwing initialization."
    missing:
      - "Require successful initialization before script insertion and sink return."
      - "Add absent-initializer and throwing-initializer tests asserting no script and no sink while the local journey remains functional."
---

# Phase 4: Report and Enrich the HAOO Funnel Truthfully Verification Report

**Phase Goal:** As a HAOO product owner, I want to understand aggregate HAOO interest and receive transparent, human-readable context with voluntarily submitted enquiries, so that I can act without identity tracking or a hidden score.
**Verified:** 2026-09-01T19:50:37Z
**Status:** gaps_found
**Re-verification:** Yes — after Plans 04-06 and 04-07 gap closure

## User Flow Coverage

User story: “As a HAOO product owner, I want to understand aggregate HAOO interest and receive transparent, human-readable context with voluntarily submitted enquiries, so that I can act without identity tracking or a hidden score.”

| Step | Expected | Evidence | Status |
|---|---|---|---|
| Configure reporting | Owner can distinguish deferred public collection settings from the two local report inputs | `README.md:57-117` and `04-USER-SETUP.md:9-64` name all variables and preserve the approval gate | ✓ VERIFIED |
| Run the local report | One command performs seven site/range-correlated Stats queries and atomically replaces a self-contained report | `scripts/generate-haoo-report.mjs`, `query-provenance.ts`, and 120 independently run report tests | ✓ VERIFIED on fixtures; live production reconciliation remains a human gate |
| Review aggregate evidence | Four periods show literal event occurrence counts and comparisons without percentages or progression claims | Closed ten-event dictionary and renderer; report suite passed | ✓ VERIFIED |
| Receive enquiry context | A voluntary submission carries one disclosed readable browser-context paragraph without score or stable identifier | `ProductPage.tsx:64-70` → `QualifyForm.tsx:324-338` → reserved payload label; focused integration tests passed | ✓ VERIFIED |
| Outcome: act without identity tracking | Analytics must remain name-only and incapable of loading arbitrary tracking code | Foreign HTTPS script origins are accepted, and failed/missing initialization still yields a live sink | ✗ FAILED |

The MVP goal now passes the canonical user-story validator. The technical flow exists, but the outcome clause is not achieved while the configured analytics boundary can execute an arbitrary origin or proceed without proving automatic capture is disabled.

## Goal Achievement

### Roadmap Success Criteria

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Product owner can view aggregate counts for all ten HAOO actions | ✗ BLOCKED | The fixture-backed report and provenance path work, but production collection is intentionally unset and the remaining provider initialization/security defects make enablement unsafe. |
| 2 | A submitted email includes a disclosed readable coarse summary with no score or stable identifier | ✓ VERIFIED | Explicit bounded-context pick list, reserved payload label, disclosure wiring, threshold/cap tests, and integration submission test pass. |
| 3 | Reporting labels evidence as views, attempts, and outbound clicks—not delivery, customers, or completed onboarding | ✓ VERIFIED | Closed labels/caveats, no-percentage contracts, exact provenance validation, and 120 report tests pass. |

**Roadmap score:** 2/3 success criteria verified.

### Re-verification of Previous Gaps

| Previous gap | Status | Actual code evidence |
|---|---|---|
| Plausible preload used an event-shaped initialization entry | ✓ CLOSED for the owned stub | `plausible.ts:94-100,136-140` places options in `plausible.o`; the independent preload fixture and named test agree. The fail-open existing-provider paths remain a separate blocker. |
| Report trusted echoed query metadata | ✓ CLOSED | `generate.ts:138-148` requires `validateEchoedQuery` before `parseGoalCounts`; `query-provenance.ts:46-77` rejects wrong/extra/reordered closed fields and invalid ranges. |
| Failed final write could leave an owned `.tmp` artifact | ✓ CLOSED | `generate.ts:180-181,250-273` tracks exclusive ownership and cleanup; real-filesystem rename, partial-write, and concurrent-loser tests pass. |
| Owner instructions omitted `PLAUSIBLE_SITE_ID` | ✓ CLOSED | Both owner documents define the exact-domain meaning and show a non-secret two-variable command; CLI diagnostics name absent variables only. |
| MVP goal was not a valid user story | ✓ CLOSED | `user-story.validate` returns `valid: true` with role, capability, and outcome slots. |

### Gap-Closure Plan Truths

| Plan | Verified / Total | Result |
|---|---:|---|
| 04-06 | 3/4 | Correct owned-preload queue/options shape, deferred production boundary, and MVP goal pass. The “automatic capture disabled before script loads” truth fails on absent/throwing initializer paths. |
| 04-07 | 6/6 | Provenance, all-time date validation, owned temp cleanup, concurrency, owner documentation, and MEAS-05 regression contracts pass. |

Previously passed Plans 04-01 through 04-05 received quick regression checks. Accounting for the closed provenance and temp-artifact gaps, the unchanged visual/judgment items, and the still-failed provider-init truth yields **80/95 verified PLAN truths** across all seven canonical plans.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/reporting/query-provenance.ts` | Fail-closed Stats metadata validator | ✓ VERIFIED | 78 substantive lines; exact site/metric/dimension/filter/date checks; wired before row parsing. |
| `src/reporting/generate.ts` | Seven-query report orchestration and atomic replacement | ✓ VERIFIED with warning | Provenance and ownership are substantive and tested. `directoryOf()` is POSIX-only, so a first Windows run may skip directory creation. |
| `scripts/generate-haoo-report.mjs` | Credentialed local CLI | ✓ VERIFIED | Requires both local inputs, reserves temp with `openSync(..., 'wx')`, and emits name-only diagnostics. |
| `src/test/fixtures/haoo-report-cli-fetch-preload.mjs` | Network-denying CLI oracle | ✓ VERIFIED | Replaces `fetch`, permits one endpoint, rejects an eighth request, and writes a request audit. |
| `src/measurement/plausible.ts` | Name-only, opt-out-initialized provider sink | ✗ FAILED | Substantive and wired, but initialization failure is fail-open. |
| `src/products/haoo.ts` | Fail-closed provider/source configuration | ✗ FAILED | Provider selector is closed; script-source resolver accepts any HTTPS `.js` origin. |
| `src/products/engagement-summary.ts` and form wiring | Readable privacy-bounded enquiry context | ✓ VERIFIED | Explicit pick list flows through one reserved payload field; no analytics lookup. |
| `README.md` and `04-USER-SETUP.md` | Owner setup and deferred-production boundary | ✓ VERIFIED | Both local variables, three public variables, ten goals, and approval deferral are explicit. |

All 31 artifact declarations across the seven canonical plans pass structural existence checks. The failures above are behavioral/security defects that file-existence tooling cannot detect.

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `generate.ts` | `query-provenance.ts` → `stats-response.ts` | validate metadata, then parse rows | ✓ WIRED | `generate.ts:138-148`. |
| CLI | `generate.ts` | injected fetch, credentials, exclusive fs capabilities | ✓ WIRED | `generate-haoo-report.mjs:55-67`. |
| `measurement/index.ts` | `plausible.ts` | provider resolved after campaign cleanup | ⚠️ WIRED-BUT-DEFECTIVE | `index.ts:317-324`; the adapter may become live without successful opt-out initialization. |
| `ProductPage.tsx` | formatter → `QualifyForm.tsx` → payload builder | bounded context/campaign to reserved field | ✓ WIRED | `ProductPage.tsx:64-70`, `QualifyForm.tsx:324-338`, `qualify-form.logic.ts:103-110`. |

## Data-Flow Trace

| Data | Source → sink | Status |
|---|---|---|
| Report counts | credentialed Stats response → exact echoed-query validator → row parser → closed report model → local HTML | ✓ FLOWING on fixture; live reconciliation deferred |
| Enquiry context | bounded local context + normalized page-lifetime campaign → explicit formatter → FormSubmit JSON | ✓ FLOWING |
| Browser events | explicit allowlisted event → measurement facade → provider global | ✗ UNSAFE ENABLEMENT: name-only call shape exists, but source trust and initialization precondition are not enforced |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Full workspace regression | `npm test` | Build succeeded; 21 files and 723 tests passed | ✓ PASS |
| Report provenance, CLI, and filesystem behavior | `npm run test:unit -- --run src/test/haoo-report.test.ts` | 120/120 passed | ✓ PASS |
| Provider adapter contracts | focused `measurement.test.ts` run | 32 selected tests passed | ⚠️ INSUFFICIENT: no absent/throwing initializer or foreign-origin case |
| Engagement summary/payload regression | focused `qualify-form.test.tsx` run | 47 selected tests passed across canonical and unrelated worktree copies | ✓ PASS |
| Static quality | `npm run lint`; `npm run typecheck` | Both exited 0 | ✓ PASS |
| Missing initializer adversarial probe | imported `createPlausibleEventSink` with an existing callable lacking `init` | Returned a function, appended one script, and forwarded `haoo_page_view` | ✗ FAIL |
| Throwing initializer adversarial probe | existing provider whose `init` throws | Returned a function, appended one script, and forwarded `haoo_page_view` | ✗ FAIL |

## Probe Execution

No phase-declared `probe-*.sh` exists. The project-specific executable coverage audit was run directly:

| Probe | Command | Result | Status |
|---|---|---|---|
| Phase 4 capability audit | `node scripts/verify-phase4-coverage.mjs .../COVERAGE.md` | 41 required capabilities across 3 tables | ✓ PASS |

## Requirements Coverage

| Requirement | Status | Evidence / blocker |
|---|---|---|
| MEAS-01 | ✗ BLOCKED | Aggregate report implementation is verified, but safe production collection is not: arbitrary script origins are accepted and failed initialization still permits a live sink. |
| MEAS-05 | ✓ SATISFIED | Readable summary, disclosure, exact thresholds/caps, reserved key, and no-score/no-identifier assertions all pass. |
| MEAS-08 | ✗ BLOCKED | Report provenance and literal labels are repaired, but a provider path that may duplicate automatic pageviews can corrupt the aggregate evidence it reports. |

All three IDs are claimed by canonical Phase 4 plans and mapped to Phase 4 in `REQUIREMENTS.md`; no orphaned requirement exists. `REQUIREMENTS.md` currently marks MEAS-01 and MEAS-08 complete despite these blockers.

## Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion level | Verdict |
|---|---|---:|---:|---:|---|---|
| `src/test/haoo-report.test.ts` | MEAS-01, MEAS-08 | 120 | 0 | 0 | Behavioral/value | PASS |
| `src/test/qualify-form.test.tsx` | MEAS-05, MEAS-08 | 84 canonical | 0 | 0 | Behavioral/value | PASS |
| `src/test/measurement.test.ts` | MEAS-01, MEAS-08 | 113 canonical | 0 | 0 | Behavioral/value | BLOCKER: omits the two fail-open initialization paths and foreign-origin script case |
| `src/test/build-output.test.ts` | MEAS-01, MEAS-08 | 26 canonical | 0 | 0 | Source/bundle value | PASS for the provider-unset build; it does not constrain a configured origin |

**Disabled requirement-linked tests:** 0. **Circular expected-value generators:** 0. **Insufficient blocker areas:** 2 provider-boundary cases.

## Anti-Patterns and Review Findings

| Finding | File | Severity | Impact |
|---|---|---|---|
| Arbitrary HTTPS `.js` origin accepted | `src/products/haoo.ts:63-85` | 🛑 BLOCKER | A build-variable change can execute unapproved tracking code with first-party privileges. |
| Failed/missing initializer yields a live sink | `src/measurement/plausible.ts:90-150` | 🛑 BLOCKER | Automatic capture is not proven disabled before collection begins. |
| POSIX-only report directory extraction | `src/reporting/generate.ts:97-100,243-248` | ⚠️ WARNING | The documented local command can fail on a first Windows run. |
| Debt markers, placeholders, skipped tests | Phase implementation/tests | — | None found. |

## Decision Coverage

All **4/4** trackable `04-CONTEXT.md` decisions are honored by shipped artifacts. This warning-only gate does not change the failed status.

## Human Verification Required After Automated Gaps Close

1. **Production privacy approval and live event uniqueness**
   - Approve the processor, create the exact ten goals, configure the trusted script/site values, deploy, and perform each explicit action once.
   - Expected: one name-only event per action, no automatic duplicate, and no form/context property.

2. **Live report reconciliation**
   - Run the documented command with the approved site/key and compare 7/30/90/all-time counts and dates with the raw dashboard; reopen the HTML offline.
   - Expected: exact site/range counts, literal evidence labels, no external report request, and no credential exposure.

3. **MVP outcome and privacy judgment**
   - Review one maximum-context enquiry and the report/disclosure at 320px and 200% zoom with keyboard/screen-reader use.
   - Expected: readable non-scoring prose, no identity/progression claim, and usable self-contained presentation.

## Deferred Items

Phase 5 covers deployed journey, accessibility, route, asset, and email-delivery evidence. It does not explicitly own analytics script-origin trust or fail-closed provider initialization, so neither blocker is deferred.

## Gaps Summary

Plans 04-06 and 04-07 successfully close the five previously structured gaps: owned preload placement, query provenance, temporary-file cleanup, owner instructions, and MVP goal form. Phase 4 still does not achieve its outcome because the remaining configured-provider boundary can load arbitrary JavaScript and can collect after initialization fails. Passing fixtures and 723 green tests do not prove those omitted adversarial paths.

The next canonical action is `/gsd-plan-phase 04 --gaps`.

---

_Verified: 2026-09-01T19:50:37Z_
_Verifier: the agent (gsd-verifier)_
