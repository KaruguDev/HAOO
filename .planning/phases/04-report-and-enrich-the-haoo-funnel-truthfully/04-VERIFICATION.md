---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
verified: 2026-09-02T06:07:51Z
status: gaps_found
score: 100/122 must-haves verified
roadmap_score: 2/3 success criteria verified
behavior_unverified: 2
overrides_applied: 0
next_action: "Gaps found. Plan the fixes, then re-run execute-phase before shipping."
next_command: "/gsd-plan-phase 04 --gaps"
decision_coverage:
  honored: 4
  total: 4
  not_honored: []
re_verification:
  previous_status: gaps_found
  previous_score: 80/95
  gaps_closed:
    - "The browser configuration no longer accepts executable JavaScript from an arbitrary HTTPS .js origin: a tampered-variable production build inlines the attacker URL as inert data and the shipped minified resolver returns the empty string for it."
    - "A pre-existing provider without a usable initializer, one whose initializer throws, and one whose initializer silently records nothing all now return no sink and append zero script elements; script insertion moved after the recorded-opt-out check."
  gaps_remaining: []
  new_gaps:
    - "Cross-host directory extraction changed POSIX behaviour for a filename containing a backslash, creating a wrong parent directory."
    - "The adopted/installed provider classification is incomplete: a non-function pre-existing global is replaced and never restored, the refusal-cleanup branch is unreachable, and the recorded-opt-out check is a self-echo on the path it governs."
  regressions:
    - "src/reporting/generate.ts directoryOf: '/home/u/.reports/re\\port.html' previously yielded '/home/u/.reports' and now yields '/home/u/.reports/re'."
gaps:
  - truth: "The documented owner command creates its output directory on a first run regardless of host path separator, and the existing POSIX behaviour is unchanged."
    status: partial
    reason: "The Windows half of the fix is correct and pinned, but the separator set is applied unconditionally, so on POSIX — where a backslash is a legal filename character — a destination whose final segment contains a backslash now yields the wrong parent and mkdirSync creates a directory that is not the destination's parent. That is a behaviour change to the POSIX path the truth says is unchanged."
    artifacts:
      - path: "src/reporting/generate.ts"
        issue: "Lines 111-121: `Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\\\'))` is unconditional. Probed: '/home/u/.reports/re\\port.html' => '/home/u/.reports/re' (was '/home/u/.reports'); 'out\\report.html' => 'out' (was no directory). The drive-root guard has no UNC counterpart: '\\\\server\\haoo.html' => '\\\\server' is handed to mkdirSync recursively, which is the same class of bare-root creation the guard exists to prevent."
      - path: "src/test/haoo-report.test.ts"
        issue: "DIRECTORY_EXTRACTION_TABLE (lines 862-886) has five rows and none of them is a POSIX destination containing a backslash, so the regression is invisible to the suite that was added to pin this contract."
    missing:
      - "Select the separator set from the destination shape (drive designator or UNC prefix) instead of applying both unconditionally."
      - "Extend the bare-root guard to a UNC root."
      - "Add table rows for '/home/u/.reports/re\\port.html' (expect '/home/u/.reports') and 'out\\report.html' (expect null), plus UNC, mixed-separator and drive-relative rows."
  - truth: "No pre-existing provider global may be replaced, wrapped, or mutated by this adapter when its initializer is absent, throwing, or non-recording; and a stub installed by this call is deleted from the scope when initialization is refused."
    status: failed
    reason: "`adopted` is decided by `typeof existing === 'function'` alone, so a truthy non-function `window.plausible` is classified as absent, overwritten by the installed stub, and — because the refusal branch is unreachable — never restored. Probed directly: a pre-existing object global was replaced, a sink was returned, and one script was appended. The companion claim that a refused initialization removes the stub has no executable evidence because `if (!adopted) delete scope.plausible` can never run: on the non-adopted path the stub's own `init` cannot throw and the recorded-opt-out check cannot fail."
    artifacts:
      - path: "src/measurement/plausible.ts"
        issue: "Lines 140-152: `adopted` misses the non-callable case; `refuse()`'s `!adopted` branch is dead code; the docstring at 128-134 states the global 'is adopted, never replaced or wrapped', which holds only for the callable case."
      - path: "src/test/measurement.test.ts"
        issue: "All three refusal fixtures are adopted-path (callable) fixtures asserting the opposite branch, so neither the non-function-global case nor the stub-removal claim is covered."
    missing:
      - "Refuse when `scope.plausible !== undefined && typeof scope.plausible !== 'function'`, or restore the previous value on refusal."
      - "Delete the unreachable stub-removal branch and its key-decision claim, or make it reachable and cover it."
      - "Add a test for a truthy non-function pre-existing global asserting no sink, no script, and the original value intact."
  - truth: "Requiring the recorded value is what makes 'automatic pageview capture is disabled' provable instead of assumed."
    status: partial
    reason: "Documentation-accuracy gap, not a control-flow gap. The source comment (lines 104-118) and the 04-09 summary's D1 coverage row describe the recorded-opt-out check as proof. On the primary path the project's own stub echoes back the very options object the caller built with a `false` literal, so the check cannot fail; on the adopted path a foreign global satisfying it with `init = o => { self.o = o }` is accepted (probed: sink returned, one script appended, spoof still free to auto-capture). The check is a useful fail-closed filter, but it proves nothing about the vendor script's behaviour, and the prose invites a reader to skip the live-uniqueness human gate that actually settles it."
    artifacts:
      - path: "src/measurement/plausible.ts"
        issue: "Lines 109-111 assert provability the check cannot deliver."
      - path: "src/test/fixtures/plausible-preload-contract.ts"
        issue: "37 lines that re-declare the same `o`/`q` shape as the adapter. It is a shape transcription, not an independent oracle of vendor behaviour, so it cannot corroborate the provability claim."
    missing:
      - "Restate the comment as 'the opt-out is recorded and re-read; whether the vendor script honours it is an external contract settled by the live human gate'."
      - "Downgrade the 04-09 D1 coverage row from an executable claim to a human-judgment row."
behavior_unverified_items:
  - truth: "Automatic pageview capture is disabled before the managed script loads (04-06 truth 2 / 04-09 truth 1)."
    test: "After production enablement, load the HAOO page once with the approved script and site values and watch the Plausible dashboard live view."
    expected: "Exactly one `haoo_page_view` occurrence for the visit and no additional automatic pageview, and no pageview carrying `utm_*` values."
    why_human: "The assertion is about the vendor script honouring `plausible.o.autoCapturePageviews === false`. The repository can only prove that it wrote and re-read that value; no test in this tree can observe the real script's behaviour."
  - truth: "A configured provider sink can only exist when automatic capture has genuinely been disabled (04-09 truth 1, adopted path)."
    test: "On the deployed page, confirm no other snippet, tag manager, or extension defines `window.plausible` before the bundle runs."
    expected: "`window.plausible` is undefined until the bundle installs its own stub, so the adoption path is never taken in production."
    why_human: "A foreign callable global that merely echoes the options object passes the recorded-opt-out check; only inspection of the deployed page can establish that no such global exists."
deferred: []
human_verification:
  - test: "Production privacy approval and live event uniqueness — approve the processor, create the exact ten dashboard goals, configure the approved script and site values, deploy, and perform each explicit action once."
    expected: "One name-only event per action, no automatic duplicate, and no form value, browser-context property, or visitor identifier on any event."
    why_human: "Requires a real account, a deployment, and observation of a third-party dashboard."
  - test: "Live report reconciliation — run `npm run report:haoo` with the approved `PLAUSIBLE_SITE_ID` and `PLAUSIBLE_STATS_API_KEY`, then compare the 7/30/90/all-time counts and inclusive dates against the raw provider dashboard and reopen the HTML with networking disabled."
    expected: "Exact site and range counts, literal views/attempts/outbound-click labels, no external request when reopened, and no credential anywhere in the document."
    why_human: "Needs live credentials and a dashboard comparison that no fixture can stand in for."
  - test: "MVP outcome and privacy readability judgment — read one maximum-context enquiry summary and the generated report and page disclosure at a 320px viewport and 200% zoom, with keyboard and screen-reader navigation."
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
**Verified:** 2026-09-02T06:07:51Z
**Status:** gaps_found
**Re-verification:** Yes — after gap-closure plans 04-08, 04-09 and 04-10
**Mode:** MVP (goal is a valid User Story; `user-story.validate` returns `valid: true`)

## User Flow Coverage

| Step | Expected | Evidence in codebase | Status |
|---|---|---|---|
| Configure reporting | Owner can tell the two local report credentials from the three public build variables, and knows which script URL is permitted | `README.md:57-117` (approved origin `https://plausible.io`, approved path `/js/script.js`, "repository configuration, not a deployment value"), `04-USER-SETUP.md:14,25,35` | ✓ VERIFIED |
| Run the local report | One command performs seven site/range-correlated Stats queries, validates echoed provenance, and atomically replaces a self-contained report | `scripts/generate-haoo-report.mjs`, `src/reporting/generate.ts`, `src/reporting/query-provenance.ts`; the CLI is exercised end-to-end by a `spawnSync` case with a network-denying fetch preload (`haoo-report.test.ts:1010-1040`) | ✓ VERIFIED on fixtures; live reconciliation is a human gate |
| Review aggregate evidence | Four periods show literal occurrence counts and integer comparisons, with no percentage and no progression claim | Closed ten-event dictionary and renderer; report suite green inside the 494-test run | ✓ VERIFIED |
| Receive enquiry context | A voluntary submission carries one disclosed readable paragraph with no score and no stable identifier | `ProductPage.tsx:21,65-70` → `QualifyForm.tsx:281-289,326` → single reserved payload field | ✓ VERIFIED |
| Outcome: act without identity tracking | Analytics stays name-only and cannot load unapproved code | Tampered-variable build proves the foreign origin resolves to `""`; three fail-closed initialization paths proved by probe | ⚠️ PRESENT, BEHAVIOR UNVERIFIED — the vendor script honouring the recorded opt-out is a live human gate, and the adoption path accepts an echoing foreign global |

The outcome clause is no longer *failed* — the two code-level blockers that defeated it are genuinely closed. It is not yet *achieved* either: what remains is external (a real deployment plus a live dashboard) rather than missing code.

## Goal Achievement

### Roadmap Success Criteria

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Product owner can view aggregate counts for all ten HAOO actions | ⚠️ BLOCKED — human gates only | The report path is implemented and fixture-proven, and enablement is now safe (approved-origin contract + fail-closed init). Production collection is still deliberately unset, so no counts exist to view until the processor is approved, the ten goals are created, and the site is deployed. |
| 2 | A submitted email includes a disclosed readable coarse summary with no score or stable identifier | ✓ VERIFIED | Explicit pick-list formatter, one reserved payload label, disclosure wiring, threshold/cap coverage; `qualify-form.test.tsx` 84/84. |
| 3 | Reporting labels evidence as views, attempts, and outbound clicks — not delivery, customers, or completed onboarding | ✓ VERIFIED | Closed labels and caveats, no-percentage contracts, exact echoed-query provenance, `haoo-report.test.ts` green. |

**Roadmap score:** 2/3 verified; criterion 1 is blocked on the three recorded human gates, not on missing code.

### Re-verification of the Two Recorded Gaps

**Gap A — arbitrary HTTPS `.js` origin accepted → CLOSED.** Verified against artefacts, not summaries:

- `config/approved-analytics-script-sources.ts` holds one origin and one path, lives outside `src/`, and is provider-gated by `approvedScriptSourcesForProvider`.
- I built the app with `VITE_HAOO_MEASUREMENT_PROVIDER=plausible`, `VITE_HAOO_PLAUSIBLE_SRC=https://cdn.attacker.example/js/script.js`. The bundle inlines the attacker string only as the resolver's *argument*: `providerScript:{src:jh("https://cdn.attacker.example/js/script.js"),…}`, with `jh` ending `…||!t.some(i=>i.origin===r.origin&&i.paths.includes(r.pathname))?"":n`. The foreign origin resolves to `""`, so no script is appended and no sink is created.
- The committed provider-unset `dist/` contains `Ia=[]` and zero occurrences of `plausible.io`, so the origin does not leak into an unconfigured build.
- `measurement.test.ts:608-635` asserts a structurally valid foreign origin, an unapproved extension-variant path, and an unapproved nested path against the imported canonical contract, not a re-typed literal.

**Gap B — failed/absent initialization still yielded a live sink → CLOSED.** I re-ran both of the adversarial probes that failed last time, plus two new ones, against an esbuild-transpiled copy of the shipped module:

| Probe | Sink | Scripts appended | Pre-existing global |
|---|---|---:|---|
| Fresh scope (self-installed stub) | function | 1 | n/a — `o` = `{domain:"www.zero-paperhub.com",autoCapturePageviews:false}` |
| Existing callable, no `init` | `undefined` | 0 | identical, unmutated |
| Existing callable, throwing `init` | `undefined` | 0 | identical, no exception escaped |
| Existing callable, silent no-op `init` | `undefined` | 0 | identical |

Both previously failing probes now fail closed, and the ordering defect is structurally gone: `appendProviderScript` at line 206 is unreachable until `resolveInitializedProvider` returns non-null at line 204.

### New Findings from This Re-verification

Three items surfaced that the prior verification did not record. Two are gaps; one is a documentation-accuracy gap.

**1. POSIX regression in the cross-host directory fix (04-10).** Probed `directoryOf` against eleven destination shapes:

| Destination | Now | Previous POSIX behaviour |
|---|---|---|
| `/home/u/.reports/haoo.html` | `/home/u/.reports` | same |
| `C:\project\.reports\haoo.html` | `C:\project\.reports` | `''` — this is the intended fix |
| `/home/u/.reports/re\port.html` | `/home/u/.reports/re` | `/home/u/.reports` — **changed, wrong parent** |
| `out\report.html` | `out` | `''` — **changed** |
| `\\server\haoo.html` | `\\server` | `''` — bare UNC root handed to `mkdirSync` |

`generateHaooReport` then calls `mkdirSync(<wrong parent>, { recursive: true })` before writing. The shipped CLI is not reachable here (its basename is fixed), but `generateHaooReport` is an exported function with a caller-supplied `outputPath`, and the new five-row contract table added to pin this behaviour does not contain the failing shape. The declared truth's clause "the existing POSIX behaviour is unchanged" is observably false.

**2. Incomplete adopted/installed classification (04-09).** Probed a truthy non-function `window.plausible`: it was replaced by the installed stub, a sink was returned, and one script was appended — a literal breach of 04-09's prohibition "No pre-existing provider global may be replaced… when its initializer is absent". The `if (!adopted) delete scope.plausible` cleanup that 04-09 records as a key decision is unreachable, so the claim has no executable evidence and the replaced value is never restored.

**3. The recorded opt-out proves less than the code says it does.** I confirmed the review's WR-01 directly rather than accepting it:

- Primary path: `installProviderStub`'s `init` assigns `stub.o = options`, and `recordsOptOut(provider.o, options.domain)` then compares that against the same object literal built at lines 200-203 with `autoCapturePageviews: false`. The comparison cannot fail. The probe row above shows `o` echoed back verbatim.
- Adopted path: a foreign global with `init(o){ self.o = o }` and auto-capture left on was **accepted** — sink returned, one script appended.
- `src/test/fixtures/plausible-preload-contract.ts` is 37 lines re-declaring the same `o`/`q` shape; it corroborates shape agreement, not vendor behaviour.

This does **not** falsify 04-09's must-have as literally worded — every probe that produced a sink had in fact recorded `autoCapturePageviews: false` — and the fail-closed half of the control is real and proven. What fails is the *inference* the source comment and the 04-09 D1 coverage row draw from it. The underlying behaviour ("capture is actually disabled") is external to this repository, so it is recorded as PRESENT_BEHAVIOR_UNVERIFIED with a live human gate rather than as a code failure.

### Truth Score by Plan

| Plan | Verified / Total | Notes |
|---|---:|---|
| 04-01 … 04-07 | 80/95 | Unchanged quick regression: artifacts present, links wired, suites green. 14 visual/judgment truths remain human; 04-06 truth 2 moves from FAILED to PRESENT_BEHAVIOR_UNVERIFIED. |
| 04-08 | 7/7 | All seven verified, four of them against built bundles rather than source. |
| 04-09 | 7/8 | Three fail-closed paths, ordering, MEAS-07 regressions, and preload shape verified; truth 1 is PRESENT_BEHAVIOR_UNVERIFIED. |
| 04-10 | 6/12 | Truth 1 FAILED (POSIX regression); truths 2-7 verified; five `verification: backstop` UI items abstained to human judgment. |

**Score:** 100/122 truths verified (2 present-but-behavior-unverified, 1 failed, 19 human/backstop judgment items).

## Required Artifacts

All 43 artifact declarations across the ten plans exist and pass structural checks (`verify.artifacts` returned `all_passed: true` for every plan). Level 2-4 results for the artifacts this re-verification targeted:

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `config/approved-analytics-script-sources.ts` | Repository-owned trust anchor outside `src/` | ✓ VERIFIED | 59 lines; one frozen origin/path; provider-gated selector; consumed only by `vite.config.ts`. |
| `vite.config.ts` | Single build-time route for the approved contract | ✓ VERIFIED | `define.__HAOO_APPROVED_ANALYTICS_SCRIPT_SOURCES__` = `approvedScriptSourcesForProvider(env.VITE_HAOO_MEASUREMENT_PROVIDER)`; no `env` value can widen the list. |
| `src/products/haoo.ts` | Fail-closed origin-and-path-constrained resolver | ✓ VERIFIED | Exact-origin equality plus path membership; verified in the minified bundle, not just in source. `VITE_HAOO_PLAUSIBLE_DOMAIN` remains unvalidated (warning below). |
| `src/measurement/plausible.ts` | Fail-closed initialization before any collection | ⚠️ VERIFIED WITH DEFECTS | Three refusal paths correct and ordering correct; non-function global clobbered, refusal branch dead, confirmation self-echoing. |
| `src/reporting/generate.ts` | Cross-host directory extraction | ⚠️ PARTIAL | Windows half correct; POSIX backslash filename regressed; UNC root unguarded. |
| `src/test/measurement.test.ts` | Adversarial rows for origin and initialization | ✓ VERIFIED | 135 tests; foreign-origin and unapproved-path rows assert against the imported canonical contract; three refusal fixtures with MEAS-07 journey regressions. |
| `src/test/build-output.test.ts` | Boundary invariants | ✓ VERIFIED | 28 tests; scans every production `src/` input for both the analytics origin and any import of the approved-source module; asserts the provider-unset bundle carries no origin. |
| `src/test/haoo-report.test.ts` | Directory-extraction contract table | ⚠️ INSUFFICIENT | Five rows with an ordered `recordingFs` call log — good shape, but it omits the shape that regressed. |
| `.planning/REQUIREMENTS.md` | Truthful Phase 4 status | ✓ VERIFIED | MEAS-05 checked and `Complete`; MEAS-01 and MEAS-08 unchecked and `Gaps Found`, with a dated note naming each open human gate. |
| `README.md` / `04-USER-SETUP.md` | Owner-facing approved-source rule | ✓ VERIFIED | Exact origin and path, the fail-closed consequence, and "widening is a reviewed repository change, never a variable edit". |

## Key Link Verification

`verify.key-links` returned `all_verified: true` for plans 04-08 (3/3), 04-09 (2/2) and 04-10 (2/2). Manually re-traced:

| From | To | Via | Status |
|---|---|---|---|
| `vite.config.ts` | `config/approved-analytics-script-sources.ts` | provider-gated selector feeds the `define` | ✓ WIRED — confirmed in two built bundles (`Ia=[]` unset, one-entry array when configured) |
| `src/products/haoo.ts` | injected build-time constant | resolver default argument, `ReferenceError` swallowed to `[]` | ✓ WIRED — fails closed under the test runner where the constant is absent |
| `src/measurement/index.ts` | `src/measurement/plausible.ts` | facade calls the adapter after campaign cleanup; `eventSink` stays undefined on refusal | ✓ WIRED |
| `scripts/generate-haoo-report.mjs` | `src/reporting/generate.ts` | platform-native resolved `outputPath` | ⚠️ WIRED-BUT-DEFECTIVE for caller-supplied paths (see gap 1) |
| `ProductPage.tsx` | `engagement-summary.ts` → `QualifyForm.tsx` → payload builder | bounded context to one reserved field | ✓ WIRED |

## Data-Flow Trace

| Data | Source → sink | Status |
|---|---|---|
| Report counts | credentialed Stats response → exact echoed-query validator → row parser → closed report model → local HTML | ✓ FLOWING on fixtures; live reconciliation is a human gate |
| Enquiry context | bounded local context + normalized page-lifetime campaign → explicit formatter → one FormSubmit field | ✓ FLOWING |
| Browser events | explicit allowlisted name → facade → provider global, only after an approved script source and a recorded opt-out | ⚠️ GATED AND SAFE, BUT UNPROVEN LIVE — no production collection is enabled, so nothing flows today |
| Provider site attribution | `VITE_HAOO_PLAUSIBLE_DOMAIN` → `provider.init({domain})` | ⚠️ UNVALIDATED — see warning WR-03 |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Real-tree regression suite | `npx vitest run --exclude '**/.claude/worktrees/**' --exclude '**/node_modules/**'` | 11 files, 494/494 passed | ✓ PASS |
| Type safety | `npm run typecheck` | exit 0 | ✓ PASS |
| Static quality | `npm run lint` | exit 0 | ✓ PASS |
| Tampered-source production build | `VITE_HAOO_MEASUREMENT_PROVIDER=plausible VITE_HAOO_PLAUSIBLE_SRC=https://cdn.attacker.example/js/script.js npx vite build` | Foreign origin inlined as data only; shipped resolver returns `""` | ✓ PASS |
| Provider-unset bundle | `grep -c plausible.io dist/assets/*.js` | `0`; approved constant inlines as `Ia=[]` | ✓ PASS |
| Absent-initializer probe (previously FAILED) | esbuild-transpiled `createPlausibleEventSink`, callable global without `init` | `undefined`, 0 scripts, global identical | ✓ PASS |
| Throwing-initializer probe (previously FAILED) | same, `init` throws | `undefined`, 0 scripts, no escape | ✓ PASS |
| Silent-initializer probe | same, `init` records nothing | `undefined`, 0 scripts | ✓ PASS |
| Echoing foreign global probe | adopted global with `init(o){self.o=o}` and capture left on | sink returned, 1 script appended | ✗ FAIL — accepted (see gap 3 / behavior_unverified) |
| Non-function pre-existing global probe | `{ plausible: { o: 'foreign' } }` | replaced by stub, sink returned, 1 script appended, never restored | ✗ FAIL (gap 2) |
| `directoryOf` shape probe | 11 destinations against current and prior implementations | 2 POSIX shapes changed; UNC root unguarded | ✗ FAIL (gap 1) |

## Probe Execution

No phase-declared `probe-*.sh` exists. The project's own executable coverage audit was run:

| Probe | Command | Result | Status |
|---|---|---|---|
| Phase 4 capability audit | `node scripts/verify-phase4-coverage.mjs .../COVERAGE.md` | "passed: 41 required capabilities across 3 tables", exit 0 | ✓ PASS |

## Requirements Coverage

| Requirement | Declared by | Status | Evidence / blocker |
|---|---|---|---|
| MEAS-01 | 04-01, 04-03, 04-05, 04-06, 04-07, 04-08, 04-09, 04-10 | ⚠️ BLOCKED (human gates only) | Report path implemented and fixture-proven; both code-level safety blockers now closed. Still requires processor approval, ten dashboard goals, deployment, and live single-event confirmation. `REQUIREMENTS.md` correctly leaves it unchecked. |
| MEAS-05 | 04-02, 04-04, 04-10 | ✓ SATISFIED | Readable disclosed summary, exact thresholds and 32-character caps, one reserved key, no score and no identifier; 84/84 form tests. |
| MEAS-08 | 04-01, 04-03, 04-07, 04-08, 04-09, 04-10 | ⚠️ BLOCKED (human gates only) | Literal labels, provenance validation, and duplicate-pageview prevention are implemented; live report reconciliation against the raw dashboard remains open. |

All three phase requirement IDs are claimed by plans and mapped to Phase 4 in `REQUIREMENTS.md`. **No orphaned requirements.** The status table (`Gaps Found` / `Complete` / `Gaps Found`) and the dated 2026-09-02 note match what the code actually supports — 04-10's truthfulness requirement is met.

## Prohibition Check

| Prohibition (source) | Status |
|---|---|
| No build variable may make an unapproved origin executable (04-08) | ✓ VERIFIED — bundle-level proof |
| No analytics origin in a provider-unset bundle or in any `src/` production module (04-08) | ✓ VERIFIED — `dist/` grep + boundary scan |
| No stable identifier, fingerprint, or identity join (04-08, 04-09) | ✓ VERIFIED — event sink forwards one bare string; no parameter exists to carry more |
| No eleventh event, no redirect-return event (04-08) | ✓ VERIFIED — allowlist unchanged at ten |
| No sink or script while the opt-out is unconfirmed (04-09) | ⚠️ FLAGGED — holds for absent/throwing/silent initializers; an echoing foreign global passes |
| No pre-existing provider global replaced, wrapped, or mutated when its initializer is absent (04-09) | ✗ VIOLATED — non-function global is replaced and never restored (gap 2) |
| No requirement marked complete on gap-closure work alone (04-10) | ✓ VERIFIED — only MEAS-05 promoted, on the recorded verifier finding |
| No percentage, rate, or person-level progression claim in the report (04-10) | ✓ VERIFIED — no-percent-sign contracts green |
| No credential, analytics origin, or query path in the report or any bundle (04-10) | ✓ VERIFIED — bundle scan green |

## Anti-Patterns and Warnings

No `TBD`, `FIXME`, `XXX`, `TODO`, `HACK`, or `PLACEHOLDER` marker exists in any file this phase modified. No skipped tests. All gap-closure commits (`d7faf8f`, `bd0e215`, `3435fd9`, `05be23b`, `883937e`, `a097269`, `f613c01`, `ea2e1ec`, `15a86ed`, `97cf6c6`, `63fdbe3`, `ed7ed7a`) are present and the source tree is clean.

| Finding | File | Severity | Impact |
|---|---|---|---|
| POSIX backslash filename yields wrong parent directory | `src/reporting/generate.ts:111-121` | ⚠️ WARNING (gap 1) | `mkdirSync` creates an unintended directory nothing removes; unreachable from the shipped CLI. |
| Non-function pre-existing global replaced, refusal branch dead | `src/measurement/plausible.ts:140-152` | ⚠️ WARNING (gap 2) | Destroys third-party state; a documented mitigation has no executable path. |
| Recorded opt-out described as proof | `src/measurement/plausible.ts:104-118` | ⚠️ WARNING (gap 3) | Invites a reader to treat the live-uniqueness human gate as already satisfied. |
| `VITE_HAOO_PLAUSIBLE_DOMAIN` entirely unvalidated | `src/products/haoo.ts:181` | ⚠️ WARNING | Under the same tampered-public-variable threat model 04-08 adopted, an attacker who sets only the domain routes aggregate page telemetry to a Plausible property they own while the script source stays approved. No code execution, no form values, no identifiers — hence a warning, not a blocker — but the tampered-variable class is only half closed. |
| Approval enforced at exactly one call site; `approvedSources` exported as an injectable parameter | `src/products/haoo.ts:102-105`, `src/measurement/plausible.ts:191,206` | ⚠️ WARNING | Any future `src/` caller can pass a hand-built list, or construct `providerScript` without the resolver, and reach script insertion unchecked. Defence in depth at `appendProviderScript` would remove the class. |
| The three analytics env keys are undeclared in `ImportMetaEnv` | `src/vite-env.d.ts:18-20` | ⚠️ WARNING | A typo in the deploy workflow typechecks, lints, and builds green while shipping analytics silently off. |
| A configured-but-rejected script source produces no signal | `vite.config.ts:27-31` | ⚠️ WARNING | A first-run operator who copies an extension-variant URL gets a silently inert build; only the human checklist catches it. |
| `npm test` still collects a stale untracked worktree | `vitest.config.ts` (no `test.exclude`) | ⚠️ WARNING | The project's canonical gate runs 21 files; the real tree has 11. The 04-08 and 04-09 summaries cite 739 and 747 tests across 21 files — roughly half of that file count is stale duplication from `.claude/worktrees/rf-03-retry-1788205465/`. The real tree does pass (494/494), but the cited evidence is inflated. 04-10 used exclusions correctly. |

## Decision Coverage

All 4/4 trackable `04-CONTEXT.md` decisions remain honored by shipped artifacts. Warning-only gate; it does not change the status.

## Deferred Items

Phase 5 covers the deployed journey, accessibility, routes, assets, and email delivery. Its four success criteria mention neither analytics enablement nor live report reconciliation, so none of this phase's open items is deferred to it. Nothing is moved to `deferred`.

## Gaps Summary

The two blockers recorded before gap closure are genuinely closed, and I verified both against artefacts rather than narrative: a tampered production build inlines an attacker URL as inert data and the shipped minified resolver rejects it, and all three unproven-initialization paths now return no sink and append no script with the pre-existing global left untouched. That is real work, correctly done.

Three smaller things stand between here and a clean phase. The cross-host directory fix regressed POSIX behaviour for a filename containing a backslash and its new contract table does not cover the shape that broke. The provider adapter's adopted-versus-installed classification is incomplete — a non-function pre-existing global is clobbered and never restored, and the cleanup branch recorded as a mitigation cannot execute. And the recorded opt-out is described in the source as proof when on the primary path it is the project's own stub echoing back the caller's own object, and on the adoption path a foreign global that echoes the options while auto-capturing is accepted. The control is still a useful fail-closed filter; the prose around it is stronger than the evidence, which matters because it points a reader away from the live human gate that actually settles the question.

Separately and unchanged: criterion 1 and MEAS-08 are blocked only by human gates now, not by code. `REQUIREMENTS.md` says exactly that, which is what 04-10 was asked to make true.

The next canonical action is `/gsd-plan-phase 04 --gaps`.

---

_Verified: 2026-09-02T06:07:51Z_
_Verifier: the agent (gsd-verifier)_
