---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
verified: 2026-09-01T09:17:22Z
status: gaps_found
score: 69/85 must-haves verified
roadmap_score: 2/3 success criteria verified
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 4
  total: 4
  not_honored: []
gaps:
  - truth: "The product owner can view trustworthy aggregate counts for all ten HAOO events."
    status: failed
    reason: "Production collection is deliberately disabled, and the configured adapter does not place Plausible initialization options in the provider's documented preload slot. Live counts therefore do not exist, and enabling the current adapter risks an automatic pageview in addition to the explicit HAOO page-view event."
    artifacts:
      - path: "src/measurement/plausible.ts"
        issue: "ensureProvider queues ['init', options] in plausible.q instead of assigning the options to plausible.o."
      - path: ".github/workflows/deploy.yml"
        issue: "The three Plausible build variables are intentionally absent, so the deployed sink is inert."
    missing:
      - "Implement the documented Plausible preload initialization contract and add an independent vendor-contract fixture."
      - "After privacy-owner approval, create the ten goals, configure the public build variables, deploy, and verify live name-only events."
  - truth: "The generated owner report labels only validated counts from the requested site and exact reporting periods."
    status: failed
    reason: "generateHaooReport validates result rows but never validates the provider's echoed site, metrics, dimensions, filters, or date range before labeling the counts with locally requested dates."
    artifacts:
      - path: "src/reporting/generate.ts"
        issue: "queryRange passes body.results to parseGoalCounts and accepts the result without checking body.query; resolvedStartDay accepts calendar-looking but impossible/future dates."
      - path: "src/test/haoo-report.test.ts"
        issue: "Bounded-period fixtures contain no echoed query metadata, so passing tests prove the incomplete contract rather than period/site correlation."
    missing:
      - "Fail closed on an echoed-query mismatch for site, metrics, dimensions, filters, and bounded/all-time dates."
      - "Add wrong-site, wrong-range, impossible-date, future-start, and wrong-query-shape tests."
  - truth: "A failed or interrupted report generation never leaves a partial report artifact."
    status: failed
    reason: "After writeFileSync succeeds, a throwing renameSync is caught without removing outputPath.tmp. The prior destination remains intact, but a fresh business-data report can remain beside it."
    artifacts:
      - path: "src/reporting/generate.ts"
        issue: "ReportFs has no cleanup capability and the catch path does not remove the temporary sibling."
      - path: "src/test/haoo-report.test.ts"
        issue: "The no-temp test rejects during query, before any filesystem write; no test makes renameSync throw."
    missing:
      - "Add an injected removal capability and clean the temporary sibling on any failure after writing begins."
      - "Test a throwing final rename against a real temporary directory."
  - truth: "The owner can configure and run the report from the owner-facing documentation."
    status: failed
    reason: "The CLI requires PLAUSIBLE_SITE_ID as well as PLAUSIBLE_STATS_API_KEY, but README.md and 04-USER-SETUP.md omit the site ID from the report setup and example invocation."
    artifacts:
      - path: "README.md"
        issue: "Documents only PLAUSIBLE_STATS_API_KEY for report execution."
      - path: ".planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md"
        issue: "The example sets only the API key, so following it causes the CLI to exit."
      - path: "scripts/generate-haoo-report.mjs"
        issue: "Correctly requires both variables, but its error does not identify which names are missing."
    missing:
      - "Document PLAUSIBLE_SITE_ID, its exact-domain meaning, and a non-secret invocation containing both variable names."
      - "Report missing configuration names without printing values."
  - truth: "Phase 4 has a valid MVP-mode user-story goal that can be verified through User Flow Coverage."
    status: failed
    reason: "ROADMAP.md marks Phase 4 mode: mvp, but user-story.validate rejects the goal because it has no 'As a ..., I want to ..., so that ...' structure. Canonical MVP verification therefore cannot certify an outcome flow."
    artifacts:
      - path: ".planning/ROADMAP.md"
        issue: "Phase 4's goal is an outcome statement rather than a valid MVP user story."
    missing:
      - "Rewrite the Phase 4 goal as a valid user story or remove the mvp mode designation, then re-run verification."
---

# Phase 4: Report and Enrich the HAOO Funnel Truthfully Verification Report

**Phase Goal:** The product owner can understand aggregate HAOO interest while voluntarily submitted enquiries carry a transparent, human-readable context summary rather than identity tracking or a hidden score.
**Verified:** 2026-09-01T09:17:22Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## MVP Format Preflight

`user-story.validate` returned `valid: false`: the roadmap goal does not use the required `As a ..., I want to ..., so that ...` form even though Phase 4 declares `mode: mvp`. This report therefore does not certify MVP User Flow Coverage. The technical goal-backward audit below is still provided because it independently finds observable blockers that must be closed before any re-verification could pass.

## Goal Achievement

### Roadmap Success Criteria

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Product owner can view aggregate counts for all ten HAOO actions | ✗ FAILED | The report/query/renderer exists and fixture tests pass, but production collection is intentionally unset in `.github/workflows/deploy.yml` and the preload initialization contract is wrong in `plausible.ts:93-99`; there are no trustworthy live counts to view. |
| 2 | A submitted qualification email includes a disclosed readable coarse engagement summary with no score or stable identifier | ✓ VERIFIED | `ProductPage.tsx:64-70` reads only bounded context/campaign; `QualifyForm.tsx:281-330` builds the summary before serialization and sends it under the reserved label. The named integration and maximum-summary tests passed independently. |
| 3 | Reporting labels evidence as views, attempts, and outbound clicks—not delivery, customers, or completed onboarding | ✓ VERIFIED | Closed label/caveat dictionaries in `haoo-report.ts`, exact vocabulary tests, zero-percent contracts, and the independently run report test pass. Query-to-period truthfulness is nevertheless blocked separately by CR-02. |

**Roadmap score:** 2/3 success criteria verified.

### PLAN Must-Have Audit

All 85 frontmatter truths across Plans 04-01 through 04-05 were considered. Repeated structural/copy truths are summarized by plan; human-layout rows are not counted as verified.

| Plan | Verified / Total | Failed or human-only evidence |
|---|---:|---|
| 04-01 | 7/9 | Live/documented owner run is not available; rename failure can leave `.tmp`. |
| 04-02 | 15/15 | Summary construction, payload wiring, fallback, sentence matrix, and maximum paragraph have behavioral/value tests. |
| 04-03 | 23/32 | Echoed query is not validated; eight 320px/200%-zoom, wrapping, overflow, and screen-reader truths need a real browser/human. |
| 04-04 | 16/20 | Static disclosure/notice wiring is verified; four layout/readability truths need 320px/200%-zoom inspection. |
| 04-05 | 8/9 | Automatic capture is not reliably disabled because the provider preload options use the wrong slot. |

**Score:** 69/85 plan truths verified. The score does not include unresolved visual/judgment rows and does not soften the failed must-haves.

### Required Artifacts

`verify.artifacts` reports **20/20 declared artifact entries present and structurally substantive**. Existence is not enough: two core artifacts are behaviorally defective and one guide is incomplete.

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/reporting/haoo-report.ts` | Closed stage/label/time dictionary | ✓ VERIFIED | 305 lines; exhaustive against `HaooMeasurementEvent`; count/delta labels are literal and tested. |
| `src/reporting/stats-response.ts` | Fail-closed result-row parser | ✓ VERIFIED | Rejects malformed/unknown/duplicate/non-integer result rows and zero-fills missing goals. It does not own echoed-query validation. |
| `src/reporting/render.ts` | Self-contained truthful HTML report | ✓ VERIFIED | 527 lines; script-free four-period document, semantic stage/event structure, exact caveats, no external resources. |
| `src/reporting/generate.ts` | Query orchestration and atomic report replacement | ✗ FAILED | Substantive and wired, but trusts unvalidated echoed query metadata and leaves `.tmp` after rename failure. |
| `scripts/generate-haoo-report.mjs` | Credentialed local CLI | ⚠️ PARTIAL | Correctly keeps credentials outside `src/`, but depends on two variables the owner guide does not fully document. |
| `src/products/engagement-summary.ts` | Pure readable summary formatter | ✓ VERIFIED | 170 lines; explicit context pick list, authored sentence ordering, fallback isolation. |
| `src/components/qualify-form.logic.ts` | Reserved email label and payload builder | ✓ VERIFIED | Writes the summary only under a reserved label after `Source`. |
| `src/components/MeasurementDisclosure.tsx` | Fixed pre-submit disclosure | ✓ VERIFIED | Renders the configured heading, intro, semantic list, and boundary without reading live context. |
| `src/measurement/plausible.ts` | Provider bootstrap and name-only sink | ✗ FAILED | Name-only forwarding and failure isolation exist, but preload initialization contradicts the documented provider contract. |
| `src/products/haoo.ts` / `src/products/types.ts` | Closed configuration and provider resolvers | ✓ VERIFIED | Fail-closed selector/URL shape and required disclosure/summary configuration are present. |
| `README.md` | Complete owner/provider setup | ⚠️ PARTIAL | Public Vite configuration and ten goals are documented; required `PLAUSIBLE_SITE_ID` setup is absent. |

### Key Link Verification

The helper found 10/12 declared links. Both reported misses are unsupported-regex/indirect-property false negatives and were manually verified; the two critical failures occur after the links connect.

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `ProductPage.tsx` | `engagement-summary.ts` | `formatEngagementSummary(readContext(), readCampaign(), config)` | ✓ WIRED | `ProductPage.tsx:64-70`. |
| `QualifyForm.tsx` | `qualify-form.logic.ts` | build → serialize → track → fetch | ✓ WIRED | `QualifyForm.tsx:325-330`; helper's RE2 miss is not a real wiring gap. |
| `MeasurementDisclosure.tsx` | `products/types.ts` | typed `disclosure` configuration rendered directly | ✓ WIRED | `MeasurementDisclosure.tsx:4-9,79-89`; helper searched for an overly literal property pattern. |
| `measurement/index.ts` | `measurement/plausible.ts` | default sink resolved after campaign cleanup | ⚠️ WIRED-BUT-DEFECTIVE | `index.ts:317-324`; adapter initialization semantics are wrong. |
| `generate.ts` | `stats-response.ts` → `render.ts` | parse counts, build model, render then write | ⚠️ WIRED-BUT-DEFECTIVE | Result rows flow, but response query metadata is never authenticated against the request. |
| CLI | `generate.ts` | injected endpoint/key/site/fetch/fs | ✓ WIRED | `generate-haoo-report.mjs:27-40`. |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source → sink | Produces real/trustworthy data | Status |
|---|---|---|---|---|
| Engagement email | Readable summary | bounded local context + normalized campaign → formatter → FormSubmit JSON | Yes in code/fixture; live inbox remains outside Phase 4 | ✓ FLOWING |
| Visitor disclosure | Fixed description | HAOO product config → `MeasurementDisclosure` and collection notice | Yes; no runtime identity/context reflection | ✓ FLOWING |
| Analytics collection | Ten bare event names | components → measurement facade → Plausible global | Production disabled; configured bootstrap options use wrong provider slot | ✗ FAILED |
| Owner report | Aggregate counts | Stats API response → row parser → report model/HTML | Fixture data flows, but period/site provenance is not validated | ⚠️ HOLLOW TRUST BOUNDARY |

### Behavioral Spot-Checks

| Behavior | Command/evidence | Result | Status |
|---|---|---|---|
| Configured provider initialization test | `vitest ... -t "initializes with automatic pageview capture disabled..."` | Passes, but asserts the same invented initialization model rather than the vendor preload contract | ✗ MISLEADING TEST |
| Seven report queries | named Vitest test | Passed | ✓ PASS for request count; does not prove echoed-query correlation |
| Submitted enquiry carries readable summary | named Vitest test | Passed | ✓ PASS |
| Maximum summary stays one untruncated field | named Vitest test | Passed | ✓ PASS |
| Full regression | Orchestrator evidence: `npm test` | 21 files, 698 tests passed; lint/typecheck and targeted 04-05 tests passed | ✓ PASS, with blockers above not exercised |

### Probe Execution

No conventional `scripts/*/tests/probe-*.sh` or phase-declared shell probe exists. Historical mutation-probe narration in SUMMARY files was not treated as verifier evidence.

### Requirements Coverage

All Phase 4 IDs appear in PLAN frontmatter and in `.planning/REQUIREMENTS.md`; no orphaned Phase 4 requirement exists.

| Requirement | Source Plans | Status | Evidence |
|---|---|---|---|
| MEAS-01: owner can view aggregate HAOO action counts | 04-01, 04-03, 04-05 | ✗ BLOCKED | Fixture report is substantive, but production collection is disabled, adapter bootstrap can duplicate pageviews, and report query provenance is unvalidated. |
| MEAS-05: submitted email includes disclosed readable summary without score | 04-02, 04-04 | ✓ SATISFIED | Formatter → reserved body field → serialized request is wired and behavior-tested; fixed disclosure describes the attachment before submission. |
| MEAS-08: reports use truthful evidence language | 04-01 through 04-05 | ✗ BLOCKED | Literal labels/caveats pass, but counts from a stale/wrong site or date range can be rendered beneath the requested period heading; truthful vocabulary cannot rescue false provenance. |

`REQUIREMENTS.md` currently marks all three Complete. MEAS-01 and MEAS-08 are planning-state drift and must be reopened until the blockers close.

### Prohibition Review

The six PLAN prohibitions have no explicit `verification: test | judgment` metadata. Automated source/value checks support the no-score, no-identifier, no-property-bag, no-percentage, and no-automatic-capture intent, but they cannot silently green judgment-tier privacy/truthfulness claims. In particular, the automatic-capture prohibition is currently violated at the provider bootstrap contract.

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Strongest assertion | Verdict |
|---|---|---:|---:|---:|---|---|
| `src/test/haoo-report.test.ts` | MEAS-01, MEAS-08 | 95 | 0 | 0 | Behavioral/value | FAIL: strong presentation/result-row tests, but no echoed-query correlation or rename-failure cleanup test. |
| `src/test/qualify-form.test.tsx` | MEAS-05, MEAS-08 | 84 | 0 | 0 | Behavioral/value | PASS |
| `src/test/measurement.test.ts` | MEAS-01, MEAS-08 | 113 | 0 | 0 | Behavioral/value | FAIL: preload test encodes the implementation's invented queue shape, not an independent provider oracle. |
| `src/test/measurement-page.test.tsx` | MEAS-05, MEAS-08 | active | 0 | 0 | Behavioral/exact text | PASS; visual layout still needs a browser. |
| `src/test/build-output.test.ts` | MEAS-01, MEAS-08 | active | 0 | 0 | Source/bundle value | PASS for the unset-provider build and credential boundary. |

**Disabled requirement-linked tests:** 0. **Circular fixture generation:** 0. **Insufficient/misleading requirement assertions:** 2 blocker areas.

### Anti-Patterns and Review Findings

| Finding | File | Severity | Verification impact |
|---|---|---|---|
| CR-01: initialization queued as an event, not stored as provider options | `src/measurement/plausible.ts:93-99` | 🛑 BLOCKER | Breaks automatic-pageview prohibition and trustworthy counts. |
| CR-02: echoed site/range/query not validated | `src/reporting/generate.ts:136-161` | 🛑 BLOCKER | Permits factually mislabelled owner reports. |
| WR-01: failed rename leaves fresh `.tmp` report | `src/reporting/generate.ts:251-266` | 🛑 Must-have failure (review rated warning) | Violates the explicit no-partial-artifact PLAN truth and leaves business counts on disk. |
| WR-02: setup omits `PLAUSIBLE_SITE_ID` | `README.md:95-102` | ⚠️ WARNING | Owner cannot successfully follow the documented setup. |
| Debt markers / placeholders / skipped tests | Phase source/test files | — | None found. |

### Decision Coverage

`check.decision-coverage-verify` reports **4/4 trackable CONTEXT.md decisions honored**. This warning-only gate does not change the failed status.

### Human Verification Required After Gap Closure

1. **Privacy-owner approval and production analytics setup**
   - Configure the approved Plausible site, exact ten goals, and three public build variables only after processor/data-location/retention approval.
   - Confirm each explicit HAOO action produces one name-only custom event and no automatic duplicate.

2. **Live owner report reconciliation**
   - Run with both local report variables and compare all four ranges against the approved site's raw goal totals; disconnect and reopen the generated file.
   - Expected: exact dates/site/counts, no external request from the document, and no credential exposure.

3. **Report and disclosure accessibility/layout**
   - Inspect the report and HAOO disclosure at 320px and 200% zoom; use keyboard and a screen reader.
   - Expected: wrapping without body overflow/clipping, intact targets, correct disclosure/table announcements, and no implication of person-level progression.

4. **Summary/privacy judgment**
   - Read the maximum email summary and review all six judgment-tier prohibitions.
   - Expected: coherent browser-context prose, no score/identity claim, no undisclosed runtime value reflection, and approved treatment of campaign values alongside a named enquiry.

## Gaps Summary

Phase 4 is not achieved. The human-readable enquiry summary and its disclosure are real and well covered, but the other half of the goal—trustworthy aggregate owner reporting—is not production-operational and is unsafe to enable as written. The provider bootstrap can permit automatic pageviews, the report trusts counts without verifying their site/period provenance, failed replacement can leave a temporary business-data artifact, and the setup guide cannot produce a successful report invocation. The invalid MVP goal format additionally prevents canonical user-flow certification.

No gap is clearly owned by Phase 5: that phase covers deployed journey/accessibility/form-delivery evidence, not analytics processor enablement or report correctness.

## Recommended Fix Plan

### 04-06: Close provider and reporting trust boundaries

1. Mirror the official Plausible preload contract, replace the circular initialization assertion with an independent contract fixture, and re-run the name-only/failure-isolation suite.
2. Validate echoed query identity and calendar ranges before accepting counts; clean the temp sibling after write/rename failures; add adversarial tests for every branch.
3. Complete README/User Setup with `PLAUSIBLE_SITE_ID`, revise the MVP goal metadata, then re-run lint, typecheck, full tests, code review, and Phase 4 verification. Production enablement remains a separate human gate after code passes.

**Next action:** `$gsd-plan-phase 4 --gaps`

---

_Verified: 2026-09-01T09:17:22Z_
_Verifier: the agent (gsd-verifier)_
