---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
verified: 2026-09-02T11:33:30Z
status: gaps_found
score: 131/151 must-haves verified
roadmap_score: 2/3 success criteria verified
behavior_unverified: 2
overrides_applied: 0
next_action: "Gaps found. Plan the fix, then re-run execute-phase before shipping."
next_command: "/gsd-plan-phase 04 --gaps"
decision_coverage:
  honored: 4
  total: 4
  not_honored: []
re_verification:
  previous_status: gaps_found
  previous_score: 100/122
  gaps_closed:
    - "Directory extraction no longer applies both separator sets unconditionally: the separator set is now selected from the destination's shape, the two regressed POSIX shapes are restored, and the bare-root guard covers UNC server and share roots. Proven by a 12-row contract table, 12/12 passing."
    - "The adopted-versus-installed classification is complete: a truthy non-callable pre-existing `scope.plausible` is refused before anything is written to the scope, the unreachable stub-removal branch and its `refuse()` helper are gone from the source, and the 04-09 key-decision claim they backed is withdrawn in a dated amendment."
    - "The recorded-opt-out prose no longer claims provability the check cannot deliver: the source states what the check establishes and names the live human gate, the preload fixture disclaims being evidence about vendor runtime, and the 04-09 D1 coverage row now carries `human_judgment: true` with a `manual_procedural` reference to the live dashboard gate."
  gaps_remaining: []
  new_gaps:
    - "The provider global's property access — not its value — escapes the adapter's isolation envelope. A blocked, read-only, frozen, or throwing `window.plausible` slot makes `createPlausibleEventSink` throw a TypeError that reaches the ProductPage mount effect and the QualifyForm focus handler with no error boundary anywhere in `src/`."
  regressions:
    - "04-05 must_haves truth 4 ('a blocked script ... leaves the visitor journey, the local bounded context, and the qualification submission unaffected') was recorded verified in the previous two verifications. Independent probing of the shipped module shows it does not hold, which also regresses MEAS-07 (Phase 3, Complete) on the enablement path and falsifies the visitor-facing disclosure sentence 'The page works if analytics or browser storage is unavailable.'"
gaps:
  - truth: "Provider script load failure, a blocked script, a missing provider global, and a throwing provider call each leave the visitor journey, the local bounded context, and the qualification submission unaffected. (04-05 must_haves truth 4; MEAS-07 regression guard, re-asserted by 04-08, 04-09 and 04-12 on every other refusal path)"
    status: failed
    reason: "04-12 hardened the classification of the *value* found at `window.plausible` but left every read of and write to that property outside the module's try/catch envelope. Probed directly against an esbuild copy of the shipped module: of six adversarial scope shapes, four throw a TypeError out of `createPlausibleEventSink` — a read-only `undefined` slot (`Cannot assign to read only property 'plausible'`), a throwing getter, a frozen scope (`object is not extensible`), and a getter/throwing-setter pair. Those are the shapes a content blocker's constant-stub scriptlet, a frozen window, or a tag manager installs — the same 'blocked' case the truth names. The throw is not contained: `initialize()` calls `createPlausibleEventSink` untried (`src/measurement/index.ts:322-324`), `track()` and `currentContext()` call `initialize()` untried, `ProductPage`'s mount effect calls both untried (`ProductPage.tsx:74-79`), `QualifyForm.handleQualifyStart` calls the `track` prop untried inside a focus handler (`QualifyForm.tsx:197-200`), and `grep -rn 'ErrorBoundary|componentDidCatch|getDerivedStateFromError' src/` returns nothing. The React root unmounts: the visitor gets a blank page, the bounded local context write in `track()` never runs, and the qualification path is gone. Reachability is conditional but not theoretical — it requires a provider-configured build, which is precisely the production enablement roadmap criterion 1 depends on; today's provider-unset build returns at `plausible.ts:209` before touching the scope."
    artifacts:
      - path: "src/measurement/plausible.ts"
        issue: "Lines 154, 161, 168 (→ 99), 173: the classification reads `scope.plausible`, assigns the stub to `scope.plausible`, and reads `provider.init` outside any try. `resolveScope`/`resolveDocument` (47-61), `appendProviderScript` (70-83), `provider.init(...)` (175-182) and the returned sink (231-240) are all wrapped; these three operations are not. This contradicts the module's own docstrings at lines 36-41 ('Every browser capability this adapter needs arrives through an optional adapter ... wrapped in try'), 141-148 ('untrusted input of arbitrary type, so the classification is decided before anything is written to the scope' — the read itself can throw first), and 196-203 ('provider delivery is deliberately isolated from every visitor action')."
      - path: "src/measurement/index.ts"
        issue: "Lines 322-324: `eventSink = createPlausibleEventSink(...)` inside `initialize()` has no try/catch, while every other provider interaction in the same file does (`track()` at 329-334, storage at 306-312). Sink construction is the one provider concern that can reach a visitor action."
      - path: "src/test/measurement.test.ts"
        issue: "All five refusal fixtures (`bareCallableScope`, `throwingInitScope`, `silentInitScope`, `nonFunctionGlobalScope`, `recordingScope`) inject ordinary object literals with writable, non-throwing `plausible` slots. No row covers a non-writable slot, a frozen scope, or a throwing accessor, so the `refusedRows` MEAS-07 table proves the contract only on shapes that cannot exhibit the defect."
      - path: "src/products/haoo.ts"
        issue: "Disclosure copy at line 184 promises the visitor 'The page works if analytics or browser storage is unavailable.' — falsified on the blocked-slot shape in a configured build."
      - path: ".planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md"
        issue: "Line 71 records 'The HAOO journey continues to work if the analytics script is blocked or fails' as an owner-facing guarantee of the shipped code, ahead of the live gates."
    missing:
      - "Wrap the classification and the stub installation in the same try/catch envelope as `provider.init(...)`, returning `null` (refuse) on a read-only, sealed, frozen, or throwing provider slot exactly as a throwing initializer already does."
      - "Guard the `createPlausibleEventSink` call inside `initialize()` at the facade so no provider concern can reach a visitor action regardless of adapter internals."
      - "Add adapter-boundary and full-journey `refusedRows` coverage for (a) `Object.defineProperty(scope, 'plausible', { value: undefined, writable: false })`, (b) a throwing `plausible` getter, and (c) `Object.freeze(scope)` — asserting in each case no throw, no sink, zero scripts appended, three tracked actions still returning `true` with their bounded local flags recorded, and a silent console."
deferred: []
behavior_unverified_items:
  - truth: "Automatic pageview capture is disabled before the managed script loads (04-06 truth 2 / 04-09 truth 1 / 04-09 coverage row D1)."
    test: "After production enablement, load the HAOO page once with the approved script and site values and watch the Plausible dashboard live view."
    expected: "Exactly one `haoo_page_view` occurrence for the visit and no additional automatic pageview, and no pageview carrying `utm_*` values."
    why_human: "The assertion is about the vendor script honouring `plausible.o.autoCapturePageviews === false`. The repository can only prove that it wrote and re-read that value; no test in this tree can observe the real script's behaviour. Recorded as an owner gate in `04-USER-SETUP.md` and pointed at by the `human_judgment: true` D1 row in `04-09-SUMMARY.md`."
  - truth: "A configured provider sink can only exist when automatic capture has genuinely been disabled (04-09 truth 1, adopted path)."
    test: "On the deployed page, confirm no other snippet, tag manager, or extension defines `window.plausible` before the bundle runs."
    expected: "`window.plausible` is undefined until the bundle installs its own stub, so the adoption path is never taken in production."
    why_human: "A foreign callable global that merely echoes the options object passes the recorded-opt-out check; only inspection of the deployed page can establish that no such global exists. Recorded as an owner gate in `04-USER-SETUP.md`."
human_verification: # Carried, not cleared. Status is gaps_found; these remain open regardless.
  - test: "Production privacy approval and live event uniqueness — approve the processor, create the exact ten dashboard goals, configure the approved script and site values, deploy, and perform each explicit action once."
    expected: "One name-only event per action, no automatic duplicate, and no form value, browser-context property, or visitor identifier on any event."
    why_human: "Requires a real account, a deployment, and observation of a third-party dashboard."
  - test: "Live report reconciliation — run `npm run report:haoo` with the approved `PLAUSIBLE_SITE_ID` and `PLAUSIBLE_STATS_API_KEY`, then compare the 7/30/90/all-time counts and inclusive dates against the raw provider dashboard and reopen the HTML with networking disabled."
    expected: "Exact site and range counts, literal views/attempts/outbound-click labels, no external request when reopened, and no credential anywhere in the document."
    why_human: "Needs live credentials and a dashboard comparison that no fixture can stand in for."
  - test: "MVP outcome and privacy readability judgment — read one maximum-context enquiry summary together with the generated report and the page disclosure at a 320px viewport and 200% zoom, with keyboard and screen-reader navigation."
    expected: "Readable non-scoring prose, no identity or stage-progression claim, four period labels and every stage clarifier wrapping without clipping or overlap, 44px targets intact, and no body-level horizontal scroll."
    why_human: "Visual wrapping, screen-reader announcement order, and 'does this read as a score?' are judgment calls. Covers the five `verification: backstop` UI considerations carried in 04-10's must_haves."
  - test: "Read the README measurement section as a first-time deployer (04-05 human-check)."
    expected: "It answers without reading code: which variable turns collection on, which three are public, which is a credential and where it lives, what happens when one is unset or wrong, and what must exist in the dashboard first."
    why_human: "Comprehension quality, not presence of text."
  - test: "Open the HAOO page at 320px and 200% zoom and expand the measurement disclosure (04-04 human-check)."
    expected: "The attached-summary group reads as part of the same inset, wraps without clipping or horizontal scroll, sits between the never-collected group and the clear control, and shows none of the reader's own visit band, flags, or campaign values."
    why_human: "Visual integration and overflow judgment."
---

# Phase 4: Report and Enrich the HAOO Funnel Truthfully Verification Report

**Phase Goal:** As a HAOO product owner, I want to understand aggregate HAOO interest and receive transparent, human-readable context with voluntarily submitted enquiries, so that I can act without identity tracking or a hidden score.
**Verified:** 2026-09-02T11:33:30Z
**Status:** gaps_found
**Re-verification:** Yes — after gap-closure round 3 (plans 04-11, 04-12, 04-13)
**Mode:** MVP (goal is a valid User Story: role / capability / outcome all present)

## Headline

All three recorded gaps from `04-VERIFICATION.md` (round 2) are genuinely closed, verified against
artifacts and by direct probe rather than against the summaries. Round 3 added 29 plan truths and every
one of them holds.

The verdict is still `gaps_found`, for a different reason and a newly-observed one. 04-12 hardened the
classification of the *value* at `window.plausible`; nothing in any round hardened *access to the
property*. Against an esbuild copy of the shipped module I probed six scope shapes: four of them throw a
`TypeError` straight out of `createPlausibleEventSink`, through an unguarded `initialize()`, into an
unguarded React mount effect, in a tree with no error boundary. That falsifies a canonical Phase 4
must-have — 04-05 truth 4, the MEAS-07 regression guard whose whole purpose is that "a blocked script"
leaves the journey intact — and it does so on the enablement path roadmap criterion 1 requires.

## User Flow Coverage

| Step | Expected | Evidence in codebase | Status |
|---|---|---|---|
| Configure reporting | Owner can tell the two local report credentials from the three public build variables, and knows which script URL is permitted | `README.md:57-117` (approved origin + approved path, "repository configuration, not a deployment value"), `04-USER-SETUP.md:14,25,35`; `config/approved-analytics-script-sources.ts` is provider-gated and lives outside `src/` | ✓ VERIFIED |
| Run the local report | One command performs seven site/range-correlated Stats queries, validates echoed provenance, and atomically replaces a self-contained report | `scripts/generate-haoo-report.mjs` → `src/reporting/generate.ts` → `src/reporting/query-provenance.ts`; `haoo-report.test.ts` 132/132 including the `spawnSync` CLI case with a network-denying fetch preload | ✓ VERIFIED on fixtures; live reconciliation is a human gate |
| Review aggregate evidence | Four periods show literal occurrence counts and integer comparisons, with no percentage and no progression claim | Closed ten-event dictionary (`src/reporting/haoo-report.ts:22-32`), stage clarifiers that each say what the total is *not*, renderer contracts green | ✓ VERIFIED |
| Receive enquiry context | A voluntary submission carries one disclosed readable paragraph with no score and no stable identifier | `ProductPage.tsx:64-70` → `QualifyForm.tsx` → single reserved payload label (`qualify-form.logic.ts:92,106-111`); `qualify-form.test.tsx` 84/84 | ✓ VERIFIED |
| Outcome: act without identity tracking | Analytics stays name-only, cannot load unapproved code, and cannot cost the visitor the journey | Approved-origin contract and the four fail-closed *value* refusal paths hold. A blocked/read-only/frozen/throwing provider **slot** does not refuse — it throws and unmounts the page | ✗ FAILED |

The outcome clause is not achieved. The failure is no longer about identity tracking or a hidden score —
both of those are genuinely closed — it is about the enablement path being unsafe for the visitor in the
exact environment (a content blocker) the phase's own documents promise it survives.

## Goal Achievement

### Roadmap Success Criteria

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Product owner can view aggregate counts for HAOO page views, brochure preview/open/download, qualification starts/submits, assisted-contact clicks, and self-onboarding clicks | ✗ BLOCKED | The ten-event report path is implemented and fixture-proven (`HAOO_REPORT_EVENTS` derived from a `Readonly<Record<HaooMeasurementEvent, string>>`, 132 report tests green, provenance validated before parsing). Production collection is still deliberately unset — and enablement is now unsafe for a second reason: with a provider configured, a blocked provider slot unmounts the product page (gap 1). |
| 2 | A submitted qualification email includes the disclosed coarse HAOO engagement summary in human-readable form and contains no opaque lead score or stable visitor identifier | ✓ VERIFIED | Explicit pick-list formatter with an authored fallback (`engagement-summary.ts:147-169`), one reserved email label enforced in both directions (`qualify-form.logic.ts:92,106-111`), disclosure wiring, threshold/cap coverage; `qualify-form.test.tsx` 84/84. No score exists anywhere in the summary path; no identifier is available to it. |
| 3 | Product reporting labels browser evidence precisely as views, attempts, and outbound clicks rather than claiming confirmed delivery, customers, or completed onboarding (amended: no `redirect returns`) | ✓ VERIFIED | `REPORT_EVENT_LABELS` reads "HAOO page views", "Validated form send attempts", "Outbound WhatsApp/phone/email clicks", "Outbound self-onboarding clicks"; stage clarifiers state what each total is not; no percentage is computed (D-04); the allowlist in `src/products/haoo.ts:16-27` is still exactly ten names with no redirect-return event. |

**Roadmap score:** 2/3.

### Re-verification of the Three Recorded Gaps

**Gap 1 — POSIX directory-extraction regression and missing UNC root guard → CLOSED.**
`directoryOf` (`src/reporting/generate.ts:118-133`) now gates the separator set on
`/^([A-Za-z]:|\\\\)/.test(path)`, so a backslash is treated as a separator only under a drive designator
or a UNC prefix, and the bare-root guard is
`/^[A-Za-z]:$/ || /^\\\\[^\\/]+(?:\\[^\\/]+)?$/`. The contract table
(`haoo-report.test.ts:861-921`) grew from 5 rows to 12 and now includes both shapes the previous verifier
probed as regressed — `/home/u/.reports/re\port.html` → `/home/u/.reports` and `out\report.html` → no
directory — plus mixed separators under a drive designator, bare UNC server root, UNC share root, a
destination nested below a share, and a drive-relative destination. Run behaviourally:
`npx vitest run … -t "creates the expected directory"` → **12 passed**. Each row also re-asserts that the
`mkdirSync` call precedes `reserveTempSync`.

**Gap 2 — incomplete adopted/installed classification, unreachable cleanup, self-echo → CLOSED.**
`resolveInitializedProvider` (`plausible.ts:150-185`) now refuses at line 161 —
`if (existing !== undefined && typeof existing !== 'function') return null` — *before* any assignment to
the scope. `grep -n "delete |refuse(" src/measurement/plausible.ts` returns nothing: the unreachable
`!adopted` cleanup branch and its `refuse()` helper are gone, and the docstring sentence that recorded
them as a mitigation is gone with them. The claim they backed is withdrawn in a dated amendment
(`04-09-SUMMARY.md:41` + `## Amendment 2026-09-02 (plan 04-12)` at line 228) rather than silently deleted.
Coverage added at both levels: adapter-boundary (`measurement.test.ts:842-856`, asserting identical
reference, `Object.keys(original) === ['o']`, no `q`, no `init`) and full journey
(`measurement.test.ts:928-950`, three tracked actions, three local flags, zero scripts, silent console).
Both run green.

**Gap 3 — provability prose overstated the recorded-opt-out check → CLOSED.**
`recordsOptOut`'s docblock (`plausible.ts:104-123`) now states exactly what the check establishes ("the
opt-out this project sends is recorded and re-read for the configured domain"), names the external
contract and the live human gate, and records both bounding facts — the self-echo on the installed-stub
path and the echoing-foreign-global hole on the adopted path — in the source rather than only in a
planning artifact. The `resolveInitializedProvider` and `createPlausibleEventSink` comments are restated
the same way. The preload fixture now says of itself that it "is a transcription of documentation, so it
is not evidence about what the real script does at runtime"
(`plausible-preload-contract.ts:18,24`). The 04-09 `D1` coverage row carries `human_judgment: true` with a
rationale and a `manual_procedural` verification entry pointing at the live dashboard gate, while keeping
the narrow structural fact its unit and grep evidence do prove. Both gates are discoverable by the owner
in `04-USER-SETUP.md:79-90`. `git diff 4858989..HEAD -- src/measurement/plausible.ts` confirms 04-13 was
comments-only: no control-flow line changed.

### Round-3 Plan Truths

| Plan | Verified / Total | Result |
|---|---:|---|
| 04-11 | 8/8 | Destination-shape separator selection, restored POSIX behaviour, retained Windows fix, four bare-root refusals, 12-row pinned table, preserved call ordering, carried concurrency edge, flagged MEAS-08 assumption present (`04-11-PLAN.md:225`). |
| 04-12 | 8/8 | Non-callable refusal before assignment, classification-before-write, unreachable branch and claims removed, three prior refusal paths unchanged, primary path unchanged, MEAS-07 holds on the new refusal path, both edge rows carried/flagged. |
| 04-13 | 13/13 | All four prose targets restated truthfully, fixture self-describes its evidentiary scope, D1 downgraded with rationale + manual reference while keeping real evidence, both live gates and the readability judgment recorded as owner gates, no control-flow change, four edge rows carried/flagged. |

**Cumulative score:** 100/122 (round 2) + 29 round-3 truths + 3 previously-failed truths now closed − 1
newly-failed truth (04-05 truth 4) = **131/151**.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/reporting/generate.ts` | Destination-shape-selected separator extraction with a bare-root guard | ✓ VERIFIED | 118-133; exports `ReportFs`, `generateHaooReport`; no Node import; wired from the CLI. |
| `src/test/haoo-report.test.ts` | 12-shape directory-extraction contract table with recorded call order | ✓ VERIFIED | 861-921 + 966-994; 12/12 pass; concurrency, rename, partial-write and concurrent-loser cases unedited and green. |
| `src/measurement/plausible.ts` | Complete classification, no unreachable branch, no unexecutable claim, truthful prose | ⚠️ HOLLOW — substantive and wired, but the isolation envelope it documents does not cover the property access it performs | Value classification correct and probed; property access at 99/154/173 unguarded (gap 1). |
| `src/test/measurement.test.ts` | Adversarial coverage for a truthy non-function global, boundary and journey | ⚠️ PARTIAL | Both cases present and green; every fixture uses a writable, non-throwing slot, so the blocked-slot shape is invisible to the suite. |
| `src/test/fixtures/plausible-preload-contract.ts` | Preload shape fixture that describes its own evidentiary scope truthfully | ✓ VERIFIED | 18-24 disclaims runtime evidence and defers to the live gate. |
| `04-09-SUMMARY.md` | Withdrawn stub-removal claim; D1 as a human-judgment row | ✓ VERIFIED | Dated amendments at 228 and 263; `human_judgment: true` at 64 with rationale and `manual_procedural` ref. |
| `04-USER-SETUP.md` | Owner-facing record of the two live confirmations plus the readability judgment | ✓ VERIFIED | 75-93; three unchecked gates, each stating it cannot be cleared by any command. |
| `config/approved-analytics-script-sources.ts` | Provider-gated approved origin/path contract outside `src/` | ✓ VERIFIED | Unchanged by round 3; foreign-origin rejection still asserted against the imported contract. |
| `src/products/engagement-summary.ts` + form wiring | Readable privacy-bounded enquiry context | ✓ VERIFIED | Unchanged by round 3; 84/84 green. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `scripts/generate-haoo-report.mjs` | `src/reporting/generate.ts` | platform-native resolved `outputPath` whose shape decides the separator set | ✓ WIRED | CLI passes `OUTPUT_PATH`; the 12-row table exercises the shapes it can produce. |
| `src/reporting/generate.ts` | injected `ReportFs` | `mkdirSync` recursive, only for a real parent, strictly before `reserveTempSync` | ✓ WIRED | Ordering asserted per row (988-992). |
| `src/measurement/index.ts` | `src/measurement/plausible.ts` | facade calls the adapter after campaign cleanup; `eventSink` stays undefined on every refusal | ⚠️ WIRED-BUT-UNGUARDED | `index.ts:322-324` is the one provider call in the file with no try/catch (gap 1). |
| `src/measurement/plausible.ts` | injected `PlausibleScope` | classification reads the scope once and assigns only when it carried no provider value | ⚠️ PARTIAL | The *logic* is correct; the read and the write are outside the try envelope. |
| `plausible.ts` comment | `04-USER-SETUP.md` | restated comment names a live human gate that exists as an owner checklist item | ✓ WIRED | `plausible.ts:121-123` → `04-USER-SETUP.md:79-90`; reference does not dangle. |
| `04-09-SUMMARY.md` D1 | verify-work coverage classification | `human_judgment: true` routes to a human | ✓ WIRED | Row 51-67. |

## Data-Flow Trace

| Data | Source → sink | Status |
|---|---|---|
| Report counts | credentialed Stats response → exact echoed-query validator → row parser → closed report model → local HTML | ✓ FLOWING on fixtures; live reconciliation deferred to a human gate |
| Enquiry context | bounded local context + page-lifetime campaign → explicit pick-list formatter → single reserved FormSubmit field | ✓ FLOWING |
| Browser events | allowlisted event name → facade → provider global (name-only, one argument) | ⚠️ FLOWING BUT UNSAFE TO ENABLE — the sink itself is correct; constructing it can throw on a blocked provider slot |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Full canonical suite (run once, worktree excluded) | `npx vitest run --exclude '**/.claude/worktrees/**' --exclude '**/node_modules/**'` | 11 files, **503/503 passed** in 8.06s | ✓ PASS |
| Directory-extraction contract (gap 1 closure) | `npx vitest run … src/test/haoo-report.test.ts -t "creates the expected directory"` | 12 passed, 120 skipped | ✓ PASS |
| Non-callable global refusal (gap 2 closure) | `npx vitest run … src/test/measurement.test.ts -t "not callable"` | 2 passed, 135 skipped | ✓ PASS |
| Dead-branch removal (gap 2 closure) | `grep -n "delete \|refuse(" src/measurement/plausible.ts` | no output | ✓ PASS |
| 04-13 comments-only claim | `git diff 4858989..HEAD -- src/measurement/plausible.ts` | docblocks and one inline comment only; no statement changed | ✓ PASS |
| Phase 4 capability audit | `node scripts/verify-phase4-coverage.mjs …/COVERAGE.md` | "passed: 41 required capabilities across 3 tables", exit 0 | ✓ PASS |
| **Adversarial provider-slot probe** | esbuild copy of `src/measurement/plausible.ts`, six scope shapes, stub document | fresh scope → sink + 1 script; non-callable object → no sink, 0 scripts; **read-only `undefined` slot → `TypeError: Cannot assign to read only property 'plausible'`**; **throwing getter → `TypeError: blocked slot`**; **frozen scope → `TypeError: object is not extensible`**; **throwing setter → `TypeError: read only`** | ✗ FAIL |
| Escape-path confirmation | `grep -rn "ErrorBoundary\|componentDidCatch\|getDerivedStateFromError" src/` | no output; `index.ts:322-324`, `ProductPage.tsx:74-79`, `QualifyForm.tsx:197-200` all untried | ✗ FAIL |

## Probe Execution

No `scripts/*/tests/probe-*.sh` exists in this project and no plan declares one; the project's own
executable audit was run instead and is recorded above.

| Probe | Command | Result | Status |
|---|---|---|---|
| Phase 4 capability audit | `node scripts/verify-phase4-coverage.mjs .planning/phases/04-.../COVERAGE.md` | exit 0, 41 capabilities | ✓ PASS |

## Requirements Coverage

| Requirement | Source plans | Status | Evidence / blocker |
|---|---|---|---|
| MEAS-01 — aggregate counts for the ten HAOO actions | 04-01…04-13 | ✗ BLOCKED | Report path implemented and fixture-proven; production collection deliberately unset; three live human gates open; and the enablement path now carries a page-unmounting defect on a blocked provider slot. Correctly left **unchecked** in `REQUIREMENTS.md:37` with `Gaps Found` at line 134. |
| MEAS-05 — disclosed readable summary, no opaque score | 04-03, 04-04, 04-13 | ✓ SATISFIED | Pick-list formatter, reserved label enforced in both directions, disclosure copy, 84/84. Its readability judgment stays a human gate and has not been absorbed into an automated claim. `REQUIREMENTS.md:41` checked, line 138 `Complete` — consistent with roadmap criterion 2. |
| MEAS-08 — truthful views/attempts/outbound-click labels | 04-01…04-13 | ✗ BLOCKED | The labelling and provenance work is complete and verified (roadmap criterion 3 passes). MEAS-08 additionally requires live report reconciliation, which is an open human gate. Correctly left **unchecked** at `REQUIREMENTS.md:44` with `Gaps Found` at line 141. |
| MEAS-07 — journey works when analytics is blocked *(Phase 3, `Complete`; carried as an explicit Phase 4 regression guard by 04-05, 04-08, 04-09, 04-12)* | — | ✗ REGRESSED | Not a Phase 4 delivery, but Phase 4 code falsifies it on a configured build. This is gap 1. |

No orphaned requirement: every ID mapped to Phase 4 in `REQUIREMENTS.md` is claimed by a Phase 4 plan,
and every ID claimed by a Phase 4 plan is mapped to Phase 4.

## Prohibition Checks (must-NOTs)

| Prohibition | Verdict | Evidence |
|---|---|---|
| No requirement checkbox promoted by round 3; MEAS-01/MEAS-08 stay unchecked and `Gaps Found` | ✓ HELD | `REQUIREMENTS.md:37,44,134,141`. |
| No open human gate converted into an automated acceptance criterion | ✓ HELD | All three gates remain unchecked in `04-USER-SETUP.md:79-93`, D1 is `status: unknown` / `human_judgment: true`. |
| No `COVERAGE.md` table regenerated or extended | ✓ HELD | `git diff 479f43b..HEAD` touches no `COVERAGE.md`; audit still passes at 41 capabilities. |
| No eleventh event name and no redirect-return event | ✓ HELD | `src/products/haoo.ts:16-27` is still exactly ten names. |
| No Node module imported into `src/reporting/generate.ts` | ✓ HELD | No import statement added; all fs effects arrive via `ReportFs`. |
| No control-flow change to `plausible.ts` by 04-13 | ✓ HELD | Diff is docblocks and one inline comment. |
| No pre-existing provider value read, replaced, wrapped, or deleted on a refusal path | ⚠️ FLAGGED | Holds for every *value* shape and is proved by test. On a throwing-getter slot the adapter's read of the property is itself the failure — the prohibition's intent (touch nothing that isn't ours) is met, its safety goal is not. |
| No claim in source or summary describing behaviour no executable path can reach | ⚠️ FLAGGED | The unreachable branch is gone (✓), but three surviving docstrings now over-claim in the other direction — see WR-03/IN-06 and gap 1's artifact notes. |
| No claim that the repository can prove something external to it | ⚠️ FLAGGED | 04-13's own edits comply. `plausible.ts:85-91` (pre-dating 04-13, untouched by it) still states the vendor script's queue-draining as fact, in the same file whose sibling docblock and sibling fixture explicitly refuse that standard. |

## Anti-Patterns and Review Findings

| Finding | File | Severity | Impact |
|---|---|---|---|
| CR-01 — untrusted provider-global *access* escapes the isolation envelope; page unmounts | `src/measurement/plausible.ts:99,154,168,173`; `src/measurement/index.ts:322-324` | 🛑 BLOCKER | Independently reproduced by probe. Falsifies 04-05 truth 4 and regresses MEAS-07. This is gap 1. |
| WR-01 — the CLI discards `generateHaooReport`'s structured `reason`; a stale `.tmp` sibling from an interrupted run makes the one printed instruction permanently wrong and names nothing recoverable | `src/reporting/generate.ts:214,287,294-308`; `scripts/generate-haoo-report.mjs:26-29,69-71` | ⚠️ WARNING | Owner-facing diagnosability on the MEAS-01 report path. Not a truth failure — the atomic-replacement contract itself holds. |
| WR-02 — the `.mjs` lint block misses `src/test/fixtures/haoo-report-cli-fetch-preload.mjs`, the module that decides whether the credentialed-CLI test can reach the network | `eslint.config.js:113-125` | ⚠️ WARNING | Verification-infrastructure quality; the fixture's own behaviour is still asserted by the CLI test. |
| WR-03 — the `PlausibleGlobal` docblock credits the name-only guarantee to a type that is `(...args: unknown[]) => void` | `src/measurement/plausible.ts:18-29` | ⚠️ WARNING | The guarantee is real and enforced elsewhere (`eventSink?.(event)`, `MEASUREMENT_TRACK_ARGUMENT_COUNT === 1`, and the second-argument scans at `build-output.test.ts:97,640-641`), so criterion 2 is unaffected — but the prose points a future maintainer at the wrong mechanism on a load-bearing privacy claim. |
| WR-04 — a registered Phase-3 git worktree under un-ignored `.claude/` adds 240+ stale tests to a default `vitest run`, including a `build-output.test.ts` that asserts against its own snapshot tree | `.gitignore`, `vitest.config.ts` | ⚠️ WARNING | Contaminates local evidence. Neutralised for this verification by running with `--exclude '**/.claude/worktrees/**'`: 11 files, 503 tests, all from the reviewed tree. |
| IN-06 — the vendor script's queue-draining stated as fact in the file 04-13 was correcting | `src/measurement/plausible.ts:85-91` | ℹ️ INFO | Pre-dates 04-13 and was not among its declared targets, so no 04-13 truth fails. Still an inconsistency inside a truthfulness phase. |
| IN-01…IN-05 (undeclared `VITE_` keys and unvalidated domain; dead renderer fallbacks; duplicate `emailLabel` overwrite; `formatEngagementSummary` guard outside its `try`; coverage audit wired to nothing) | various | ℹ️ INFO | None defeats a must-have. IN-05 is worth noting: the 41-capability gate that protects the OPT-OUT rows runs only when someone types the command. |
| Debt markers (`TBD`/`FIXME`/`XXX`), placeholders, skipped or `.todo` tests in round-3 files | — | — | None found. |

## Decision Coverage

All 4/4 trackable `04-CONTEXT.md` decisions remain honoured by shipped artifacts. D-04 (no percentage,
no person-level progression) is re-asserted by 04-11's prohibitions and still holds in the renderer.

## Test Quality Audit

| Test file | Linked req | Active | Skipped | Circular | Assertion level | Verdict |
|---|---|---:|---:|---:|---|---|
| `src/test/haoo-report.test.ts` | MEAS-01, MEAS-08 | 132 | 0 | 0 | Behavioral/value | PASS — the 7 new rows pin exactly the shapes that regressed |
| `src/test/measurement.test.ts` | MEAS-01, MEAS-08 | 137 | 0 | 0 | Behavioral/value | PARTIAL — value-shape refusals are excellent; every fixture uses a writable, non-throwing slot, so the blocked-slot class is untested |
| `src/test/qualify-form.test.tsx` | MEAS-05, MEAS-08 | 84 | 0 | 0 | Behavioral/value | PASS |
| `src/test/build-output.test.ts` | MEAS-01, MEAS-08 | 28 | 0 | 0 | Source/bundle value | PASS |

**Disabled requirement-linked tests:** 0. **Circular expected-value generators:** 0.
**Insufficient blocker areas:** 1 (blocked/read-only/frozen/throwing provider slot).

## Human Verification Required

Status is `gaps_found`, so these are carried open rather than being the phase's remaining work. None of
them may be cleared by a command, a passing test, or a green build. Two of them are also recorded as
`behavior_unverified_items` in this file's frontmatter and as owner checklist items in `04-USER-SETUP.md`.

1. **Confirm live event uniqueness after production enablement** — dashboard live view, one page load;
   expect exactly one page-view occurrence, no automatic duplicate, no campaign values on any pageview.
2. **Confirm no foreign provider global exists on the deployed page** — console inspection before the
   bundle runs; expect `window.plausible` undefined so the adoption path is never taken.
3. **Judge MVP outcome and privacy readability** — one maximum-context enquiry summary, the generated
   report, and the page disclosure at 320px / 200% zoom with keyboard and screen reader. Also covers the
   five held-out visual considerations carried in 04-10's must_haves.
4. **Live report reconciliation** — `npm run report:haoo` against the approved site and key, compared to
   the raw dashboard, then reopened offline.
5. **Read the README measurement section as a first-time deployer** (04-05 human-check).
6. **Open the HAOO page at 320px and 200% zoom and expand the measurement disclosure** (04-04 human-check).

## Gaps Summary

One gap, and it is narrow, specific, and fixable in one plan.

Three rounds of gap closure did exactly what they set out to do. Round 3 in particular is high quality:
the directory-extraction fix is shape-driven rather than unconditional and is pinned by twelve rows
including the two that regressed; the provider classification now decides before it assigns, so no refusal
path has anything to restore; and the truthfulness pass genuinely withdrew claims rather than softening
them, including downgrading its own coverage row to a human-judgment row and pointing it at a gate that
actually exists in an owner-facing file.

What no round addressed is a category distinction: every round hardened the *value* found at
`window.plausible`, and none hardened *access to the property*. `resolveScope` wraps the `window` lookup in
`try`; `appendProviderScript`, `provider.init(...)` and the returned sink are all wrapped; the three
operations that actually touch the foreign slot — read it, assign the stub to it, read `init` off the
result — are not. Under a read-only, frozen, or accessor-throwing slot, `createPlausibleEventSink` throws
a `TypeError` rather than refusing. I confirmed all four shapes by probe against an esbuild copy of the
shipped module, and confirmed the escape path by reading it: `initialize()` is the one provider call in
`src/measurement/index.ts` without a try/catch, `ProductPage`'s mount effect and `QualifyForm`'s focus
handler call into it untried, and `src/` contains no error boundary. The result is a blank page for a
visitor whose content blocker installs a constant-stub `window.plausible` — the same visitor the
disclosure copy promises "The page works if analytics or browser storage is unavailable", and the same
case 04-05's canonical truth 4 names as "a blocked script".

This is latent today: the provider is deliberately unset, so `createPlausibleEventSink` returns at line
209 before touching the scope. It becomes live at exactly the moment roadmap criterion 1 requires —
production enablement. That is why it is a blocker rather than a warning: the phase's remaining work is to
enable collection, and enabling it in the current tree ships a page-unmounting defect to the most
privacy-conscious segment of the audience.

The fix is small and the shape is already established in this module: put the classification and the
install inside the same `try` that already guards `provider.init(...)`, returning `null` on any throw
exactly as a throwing initializer does; guard the sink construction at the facade; and add three rows to
the existing `refusedRows` table for a non-writable slot, a throwing getter, and a frozen scope.

---

_Verified: 2026-09-02T11:33:30Z_
_Verifier: Claude (gsd-verifier)_
