---
phase: 05-prove-the-deployed-journey
verified: 2026-09-13T09:05:00Z
status: passed
score: 4/4 roadmap success criteria verified; 108/111 plan must-have truths verified (3 backstop truths insufficient_spec, routed to human)
behavior_unverified: 0
overrides_applied: 0
insufficient_spec_items:

  - truth: "At the narrowest supported width, the long option labels in the qualification selects remain readable without clipping the visitor cannot scroll past (05-12, verification: backstop)"
    evidence_available: "evidence/form-states-option-labels.json: closed control 278 x 44 CSS px, longest label 16 characters ('Property manager'); the open native popup is not measurable by the harness"

  - truth: "At a halved desktop viewport, paragraph copy inside the shipped maximum-width content columns remains readable rather than merely un-clipped (05-13 E1, verification: backstop)"
    evidence_available: "evidence/zoom-readability-inputs.json: 59 to 84 characters per line at the 640 and 720 entries"

  - truth: "At the narrowest supported width and at a halved desktop viewport, the brochure HTML equivalent remains readable and complete once its capability grid collapses to a single column (05-13 E3, verification: backstop)"
    evidence_available: "evidence/zoom-readability-inputs.json and zoom-content.json: 1 card per row, 6 capability cards, 4 journey steps at every entry"
human_verification:

  - test: "Option labels at 360 px. On a real phone or at a 360 x 740 viewport on https://www.haoo.online/, open each qualification select (role, portfolio size, location, timeframe, preferred channel) and read every option."
    expected: "Every option label is fully readable in the closed control and in the open native picker, with no truncation the visitor cannot scroll past."
    why_human: "A backstop truth. The native <select> popup is drawn outside the DOM, and readability is a judgement."

  - test: "E1, line length. At a 640 x 512 and a 720 x 450 viewport (the equivalent of 200% zoom on a desktop), read the paragraph copy in the HAOO page's max-width columns."
    expected: "The paragraphs read comfortably (measured at 59 to 84 characters per line), not just unclipped."
    why_human: "A backstop truth. Readability is a judgement, and the harness measured only its inputs."

  - test: "E3, brochure equivalent. At 320 x 256, 360 x 740 and the 200%-equivalent entries, read the capabilities grid (6 cards) and the rental journey (4 steps)."
    expected: "The HTML equivalent of the brochure is complete and readable in one column."
    why_human: "A backstop truth. Completeness was measured (10 of 10 items), but readability was not."

  - test: "KB-O2, keyboard in the embedded PDF viewer. In a desktop Chrome or Firefox with a PDF viewer, Tab into the brochure preview on https://www.haoo.online/ and then Tab or Shift+Tab out again."
    expected: "Focus can enter and leave the embedded viewer by keyboard, and the Open and Download brochure controls stay reachable before and after it."
    why_human: "Headless Chromium has no PDF plugin, so the embedded viewer's keyboard behaviour is not evidenced either way. This is a recorded browser limit."

  - test: "FS-O1, the status-region wording. Decide whether 05-12's truth 'Exactly one live status region exists' means the form's submission region (1 at every measured transition) or every role=\"status\" element in the document (2 while the form card renders)."
    expected: "The owner accepts the scoping to the submission region, since the second region is MeasurementDisclosure's own clear-context status, or asks for a change."
    why_human: "The code is correct under the reading the spec was written for. Which reading is the contract is a wording decision, not a measurement."

  - test: "Prohibition wording (05-14, 05-17). R-1, the Kenya DPA 2019 acceptance and the origin-certificate acceptance were recorded as 'owner-accepted, orchestrator-drafted at the owner's request, approved as written'. The plans' judgment-tier prohibitions require 'the owner's own statement'. Confirm that approving the drafted wording satisfies that requirement."
    expected: "The owner confirms that the approved drafts stand as their statements. If not, the owner supplies their own sentences."
    why_human: "An unverified prohibition. The verdict here is a non-authoritative LLM judgement: the intent (no executor-invented acceptance) is met, but the literal wording differs."
---

# Phase 5: Prove the Deployed Journey — Verification Report

**Phase goal:** Visitors can rely on the production HAOO funnel across supported devices and accessibility modes, and the team has direct evidence that its static routes, assets, checks, and email delivery work live.
**Verified:** 2026-09-13T09:05:00Z
**Status:** human_needed
**Re-verification:** No. This is the initial verification; no earlier VERIFICATION.md exists.

**Tooling note:** ROADMAP.md shows "17/18" and an unchecked `- [ ] 05-EVIDENCE-PLANNING-HOME.md`. That file is an evidence record written by 05-01. Its name contains "PLANNING", so the plan glob picks it up. The phase has 17 plans, `05-01` to `05-17`, and each has a SUMMARY. This is a false entry and not an unexecuted plan.

## Independent checks run by this verifier

The verifier re-derived these facts itself rather than taking them from SUMMARY files:

- **Deploy contents.** `origin/main` is `2d45e5f`. All seven fix commits are ancestors of it: `d8f4bea`, `78bf191`, `2d9c33b`, `65a612a`, `c9303e8`, `a7675f4` and `e6cf694`. `git diff origin/main..HEAD` has no changes under `src/`, `e2e/`, `scripts/`, `public/`, `.github/`, `package.json` or `playwright.config.ts`. The local commits are documentation only. There is 1 worktree, and the working tree is clean.
- **Live GETs** (read-only, 2026-09-13):
  - `https://www.haoo.online/`: 200, 5085 B, serves `/assets/haoo-CHYRGEim.js`.
  - `https://haoo.online/`: 301 to `https://www.haoo.online/`.
  - Brochure PDF: 200, 2160873 B, `application/pdf`.
  - `https://www.zero-paperhub.com/products/haoo/`: 200, with `refresh 0; url=https://www.haoo.online/`, canonical set to the same URL, and `noindex, follow`. It carries 1 script, the edge-injected CF-JSD-1 bootstrap, which matches the evidence.
  - `https://manage.haoo.online/`: 200.
  - `https://www.zero-paperhub.com/`: 200.
- **MX.** `dig MX haoo.online @8.8.8.8` returns `10 mx1.privateemail.com.` and `10 mx2.privateemail.com.`
- **The live bundle carries the fixes:**
  - L2-O1: it contains `const n=e.success;return n==="true"||n===!0`.
  - F1: it contains `https://www.zero-paperhub.com/` twice.
  - Reduced motion: the live CSS `haoo-BYmxvBcM.css` puts smooth scrolling and the hover translate inside `prefers-reduced-motion: no-preference`, and sets `motion-reduce:transition-none` to `transition-property:none`.
- **Gates re-run here.** `npm run typecheck` exited 0 across the app, node and e2e projects. `npm run lint` exited 0. `npm run verify:disjoint` exited 0. `cmp shared-scaffold.txt ../ZERO-PAPERHUB/shared-scaffold.txt` reported the files identical. The orchestrator's regression gate had `npm test` exit 0 with 688 tests in 10 files.
- **Named behavioural test.** `vitest run src/test/qualify-form.test.tsx -t "L2-O1"` ran 2 tests and both passed.
- **Playwright enumeration.** `playwright test --list` found 284 tests in 10 files. That is 141 per project plus the guarded `live-submission` spec in each project.
- **Evidence records.** 40 JSON files are committed under `evidence/`. The final-pass records, timestamped from 2026-09-13T08:00Z, show:
  - viewport-overflow: 12 records, all with `escapeeCount` 0.
  - axe-gate: 11 records with `unexceptedBlockingNodeCount` 0 on every surface. The only excepted node is S4 (R-1), one per reading.
  - keyboard-traversal: 36 of 36 stops indicated, 0 order violations, 0 positive tab indices.
  - brochure equivalence: 10 of 10, including with the PDF route aborted.
  - status region: 1 submission region at all 6 transitions.
- **ZERO-PAPER HUB.** `../ZERO-PAPERHUB/.planning` does not exist. Both repositories ship `scripts/assert-phase1-contracts.mjs`, the successor to the expected-red gate.

## Goal Achievement

### Observable truths: roadmap success criteria (the contract)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor can use the Products and HAOO journeys at supported mobile and desktop widths without horizontal overflow or hidden primary actions | ✓ VERIFIED | `e2e/viewport.e2e.ts` (838 lines) uses the shared `collectViewportEscapees` sweep and `PRIMARY_ACTIONS`. The final-pass `viewport-overflow.json` has escapeeCount 0 in 12 of 12 records, and `viewport-primary-actions.json` has 12 records. The live run covered 40 of 40 tests at 2026-09-13T08:2xZ. The option-label readability backstop is split out below. |
| 2 | Visitor can navigate product content, brochure controls, qualification fields and feedback, and onboarding links by keyboard with visible focus, semantic headings, descriptive names, zoom support, reduced motion, and an HTML equivalent to the brochure | ✓ VERIFIED | Keyboard: 36 and 40 stops, all indicated. Form: 0 of 23 focus transitions landed on the body. Semantics: heading walk, landmarks and names checked; brochure equivalent 10 of 10. Zoom: reflow at 640, 720 and 320 widths. Reduced motion: fixed in source (`src/index.css:11`, `ProductPage.tsx:192`) and confirmed in the live CSS. Axe gate: 0 unexcepted nodes. The embedded PDF viewer's keyboard behaviour (KB-O2) is not evidenced and is routed to a human. The brochure *controls* are verified. |
| 3 | Direct production navigation and refresh work for the HAOO page and brochure, while build, typecheck, lint, automated contract/component tests, and required deployed checks pass | ✓ VERIFIED | The verifier's own live GETs match `05-EVIDENCE.md` §3.1. Typecheck, lint, `verify:disjoint` and `npm test` (688) exited 0 on re-run. 05-17 recorded 13 of 13 gates exiting 0 across both repositories. Deploy runs `34729513221`, `34729513230` and `34714952939` concluded success, and the deployed commit contains every fix. Live pass: 141 collected, 128 passed, 13 skipped, 0 unexpected. The "required deployed manual checks" include the 3 held-out judgements, routed below. |
| 4 | A uniquely tagged production qualification submission demonstrates that the activated HAOO endpoint reaches the `info@haoo.online` inbox or spam folder, with direct onboarding recovery paths still available | ✓ VERIFIED | Link 1 (MX) re-measured here. Link 2 (activation) rests on the owner's report, corroborated by delivery of the activation marker. Link 3: marker `HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d` was committed in `49c976a` before the send, sent once (HTTP 200, `success:"true"`), and reported by the owner in the **inbox**. The sender and subject are not stated. The live page carries the tel, mailto, wa.me and manage.haoo.online links in 8 matches, and `manage.haoo.online` returns 200. |

### Observable truths: plan must-haves (aggregated by plan)

| Plan | Truths | Status | Notes |
|------|--------|--------|-------|
| 05-01 planning home | 3 | ✓ 3/3 | ZERO-PAPER HUB has no `.planning`; `verify:disjoint` exits 0 |
| 05-02 MX | 3 | ✓ 3/3 | MX re-measured here; three links recorded separately |
| 05-03 harness | 6 | ✓ 6/6 | `testMatch: '**/*.e2e.ts'`; `tsconfig.e2e.json` referenced from `tsconfig.json` and the typecheck script; e2e files are outside `npm test` |
| 05-04 pre-flight fixes | 5 | ✓ 5/5 | Both hrefs point at `https://www.zero-paperhub.com/`; the `haoo-page.test.tsx:53` assertion is corrected; `MeasurementDisclosure.tsx` is listed at `focus-contrast.test.ts:59` |
| 05-05 fixtures | 6 | ✓ 6/6 | `e2e/fixtures/{surfaces,viewports,primary-actions,axe,evidence,overflow}.ts` all present and used |
| 05-06 activation | 5 | ✓ 5/5 | `live-submission.e2e.ts` is skipped unless `ARMED` (lines 129 and 228); exactly 1 activation send is recorded |
| 05-07 axe baseline | 5 | ✓ 5/5 | `axe-baseline.json` has 11 records |
| 05-08 viewport | 7 | ✓ 7/7 | See SC1 |
| 05-09 keyboard | 7 | ✓ 7/7 | See SC2 (KB-O2 is a recorded limit, not a claim) |
| 05-10 semantics | 8 | ✓ 8/8 | See SC2 |
| 05-11 recovery | 10 | ✓ 10/10 | Retired-path document checked live by the verifier |
| 05-12 form states | 8 + 1 backstop | ✓ 8/8; 1 insufficient_spec | "Exactly one live status region": 1 submission region at every transition (`form-states-status-region.json`). FS-O1 is routed as a wording decision. |
| 05-13 zoom/motion | 8 + 2 backstop | ✓ 8/8; 2 insufficient_spec | Reduced-motion fix confirmed in the live CSS |
| 05-14 axe gate | 5 | ✓ 5/5 | `axe-gate.e2e.ts` uses `BLOCKING_IMPACTS`; 0 unexcepted nodes; R-1 accepted and not fixed |
| 05-15 gates/CI | 6 | ✓ 6/6 | `verify-split.yml` clones the sibling, then runs `verify:disjoint` and `cmp` on push, PR and dispatch; the successor gate is in both repositories |
| 05-16 tagged send | 8 | ✓ 8/8 | Marker committed before the send; inbox recorded; the "analytics inclusion" premise was measured and did not materialise (recorded honestly) |
| 05-17 phase close | 8 | ✓ 8/8 | Statuses set from the evidence and marked "qualified" with a named successor |

**Score:** 4/4 roadmap success criteria verified. Of 111 plan truths, 108 are verified and 3 are backstop truths marked `insufficient_spec`, routed to a human. No truth is ⚠️ PRESENT_BEHAVIOR_UNVERIFIED.

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `playwright.config.ts`, `tsconfig.e2e.json` | ✓ VERIFIED | Two projects (live and preview); compiled by `npm run typecheck` (exit 0) |
| `e2e/*.e2e.ts` (10 specs, 9,777 lines) and `e2e/fixtures/*.ts` (8 files) | ✓ VERIFIED | 284 tests enumerate; evidence records written by the final pass |
| `src/components/ProductHeader.tsx`, `src/pages/ProductPage.tsx` | ✓ VERIFIED | F1 fix present and deployed |
| `src/components/QualifyForm.tsx`, `src/components/qualify-form.logic.ts` | ✓ VERIFIED | L2-O1 fix; named tests pass; present in the live bundle |
| `src/index.css`, `ProductPage.tsx:192` | ✓ VERIFIED | ZM-LIVE-1/2 fix; present in the live CSS |
| `src/test/focus-contrast.test.ts` | ✓ VERIFIED | Seventh focus source registered |
| `.github/workflows/verify-split.yml` | ✓ VERIFIED | Substantive; run `34729513230` succeeded |
| `05-EVIDENCE*.md` (13 files), `deferred-items.md`, `evidence/*.json` (40) | ✓ VERIFIED | Consistent with the verifier's spot readings |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| `playwright.config.ts` | `e2e/*.e2e.ts` | WIRED | `testMatch: '**/*.e2e.ts'` |
| `tsconfig.json` and `package.json` typecheck | `tsconfig.e2e.json` | WIRED | Project reference and a third `tsc -p` invocation |
| `viewport`/`zoom-motion` specs | `fixtures/overflow.ts`, `primary-actions.ts`, `viewports.ts` | WIRED | Shared helpers used |
| `axe-baseline`/`axe-gate` specs | `fixtures/axe.ts` | WIRED | `axeFor(` and `BLOCKING_IMPACTS` |
| `haoo-page.test.tsx` | `ProductHeader.tsx` | WIRED | The href assertion at line 53 |
| `verify-split.yml` | `scripts/verify-tree-disjointness.mjs` | WIRED | Sibling cloned at `../ZERO-PAPERHUB`; the repository's own npm command |
| Deployed bundle | FormSubmit acceptance logic | WIRED | Static read of the live `haoo-CHYRGEim.js`; the mocked-provider live probe is recorded in `deferred-items.md` |
| `05-EVIDENCE.md` | `REQUIREMENTS.md` statuses | WIRED | The status table matches at REQUIREMENTS.md lines 257–269 |

### Data-Flow Trace (Level 4)

Not applicable in the usual sense. This is a proving phase. The data flow that matters is live page, then the Playwright measurement, then `evidence/*.json`, then the evidence markdown. The verifier traced the key numbers (escapees, unexcepted axe nodes, keyboard stops, brochure equivalence, status regions) from the committed JSON to `05-EVIDENCE.md` and found them consistent: ✓ FLOWING.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| L2-O1: a provider refusal ends in failure | `npx vitest run src/test/qualify-form.test.tsx -t "L2-O1"` | 2 passed | ✓ PASS |
| Typecheck, including the e2e project | `npm run typecheck` | exit 0 | ✓ PASS |
| Lint | `npm run lint` | exit 0 | ✓ PASS |
| Tree disjointness | `npm run verify:disjoint` | exit 0 | ✓ PASS |
| Direct navigation and refresh of the page and brochure | `curl` GET ×5 | 200/301/200/200/200 as recorded | ✓ PASS |
| Live bundle is the deployed fix build | `curl` index and bundle, then grep | `haoo-CHYRGEim.js` with the L2-O1 logic present | ✓ PASS |
| MX published | `dig MX haoo.online @8.8.8.8` | mx1 and mx2 privateemail | ✓ PASS |
| Playwright live and preview pass | not re-run; it would start `vite preview` and drive live production | recorded in 05-EVIDENCE-GATES §6 and `6be6575` | ? SKIP (constraint) |

### Probe Execution

Step 7c: no `scripts/*/tests/probe-*.sh` exists, and no PLAN declares a probe. Nothing to run.

### Requirements Coverage

| Requirement | Source plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| LEAD-07 | 05-02, 05-06, 05-11, 05-16 | Endpoint activated; a tagged production submission reaches the inbox or spam folder | ✓ SATISFIED | All three links CONFIRMED; Links 2 and 3 rest on the owner's mailbox report, one sample |
| QUAL-01 | 05-03, 05-05, 05-07, 05-08, 05-14 | Widths without overflow or hidden primary actions | ✓ SATISFIED (qualified) | SC1. Option-label readability is held out for a human; widths are sampled at 6 |
| QUAL-02 | 05-03, 05-04, 05-05, 05-07, 05-09, 05-12, 05-14 | Keyboard navigation with visible focus | ✓ SATISFIED (qualified) | SC2. KB-O2 (embedded PDF viewer) routed to a human |
| QUAL-03 | 05-03, 05-04, 05-05, 05-07, 05-10, 05-11, 05-13, 05-14 | Headings, names, zoom, reduced motion, brochure HTML equivalent | ? NEEDS HUMAN for E1/E3; otherwise SATISFIED | SC2. R-1 is accepted, not fixed |
| QUAL-05 | 05-01, 05-03, 05-15, 05-17 | Build, typecheck, lint, tests and deployed manual checks pass | ? NEEDS HUMAN for the manual-check half | Automated half verified. The 3 held-out judgements are the outstanding manual checks |

Orphaned requirements: none. REQUIREMENTS.md maps exactly LEAD-07, QUAL-01, QUAL-02, QUAL-03 and QUAL-05 to Phase 5, and every one appears in at least one plan's `requirements`.

REQUIREMENTS.md already ticks QUAL-01/02/03/05 as `[x]`, and 05-17 set them to "Complete (qualified)". That is a defensible reading, because each row names what is held out and the successor, `/gsd-verify-work 05`. A strict reading of QUAL-05 would treat it as incomplete until the held-out manual judgements are made, and those judgements are exactly the human-verification items below.

### Accepted risks: wording audit

The orchestrator asked for this check. The verifier grepped REQUIREMENTS.md, STATE.md, ROADMAP.md, `05-EVIDENCE.md` and `05-17-SUMMARY.md`:

- **Kenya DPA 2019 sign-off.** Described everywhere as "ACCEPTED RISK, NOT RESOLVED". "Complies" appears only inside the negation "before anyone ... has determined whether that collection complies", and in the "Not established" list. No text claims the collection is compliant.
- **Origin certificate (D34).** Recorded as "accepted risk", and "Not established: that the GitHub Pages origin certificate has been replaced. It has not."
- **R-1.** Recorded as "Accepted ... not a fix".
- **CF-JSD-1.** Recorded as "Accepted ... A decision, not a defect".
- STATE.md:305 ("The unresolved Kenya ... sign-off") is an older 04.2 entry that still correctly says unresolved.

None of the four risks is described as resolved or compliant. ✓

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| 31 source, test, e2e, script and workflow files touched since 2026-09-07 | — | `TBD`, `FIXME`, `XXX`, `TODO`, `HACK` | none found | — |
| `src/components/MeasurementDisclosure.tsx` | 115 | Second `role="status"` in the document (FS-O1) | ℹ️ Info | A separate, legitimately scoped region for the clear-context control. It does not duplicate the submission region. Wording decision routed to a human. |
| `.planning/ROADMAP.md` | 346–348, 409 | "17/18" and a false plan entry `05-EVIDENCE-PLANNING-HOME.md` | ℹ️ Info | A tooling filename collision. Correct it at phase close. |

### Judgment-tier prohibitions

There are 48 judgment-tier prohibitions across the 17 plans and no test-tier ones. The verifier's verdicts below are **non-authoritative LLM judgements**:

- **Spot-checked as consistent with the code and evidence:**
  - No live submission in a default run: the `ARMED` guard.
  - No failure states induced on live: form states on preview only, and 0 live POSTs in the final pass.
  - Exactly 2 live sends.
  - The expected-red gate withdrawn with a named successor.
  - The allowlist not widened: 26 entries, byte-identical copies.
  - Delivery not inferred from a browser confirmation: Link 3 rests on the owner's report.
  - The final live pass ran after the fixes deployed: `2d45e5f` contains every fix commit.
- **Flagged, human review recommended.** 05-14 and 05-17 prohibit recording an accepted risk "in the executor's words", requiring "the owner's own statement". The R-1, DPA and certificate sentences were drafted by the orchestrator and approved by the owner as written, and the provenance is disclosed. The intent is met, but the literal wording is not. See human item 6.
- **Not individually re-examined:** the remaining judgment prohibitions, which cover how evidence is written up. They are carried as `unverified-prohibition — human review recommended` in aggregate, and do not block.

### Human Verification Required

#### 1. Option labels at 360 px (backstop, QUAL-01)

**Test:** At 360 × 740, or on a real phone, open each qualification select on https://www.haoo.online/ and read every option.
**Expected:** Every label is readable in the closed control and in the native picker.
**Why human:** The native popup is not in the DOM, and readability is a judgement.

#### 2. E1, line length at halved desktop (backstop, QUAL-03)

**Test:** Read the paragraph copy at 640 × 512 and 720 × 450.
**Expected:** Comfortable reading at the measured 59 to 84 characters per line.
**Why human:** Readability is a judgement.

#### 3. E3, brochure HTML equivalent readability (backstop, QUAL-03)

**Test:** At 320 × 256, 360 × 740 and the 200%-equivalent entries, read the 6 capability cards and the 4 journey steps.
**Expected:** Complete and readable in a single column.
**Why human:** Completeness was measured (10 of 10), but readability was not.

#### 4. KB-O2, keyboard in the embedded PDF viewer (QUAL-02)

**Test:** In desktop Chrome or Firefox, Tab into the brochure preview and Tab or Shift+Tab out again.
**Expected:** No keyboard trap, and the Open and Download controls stay reachable.
**Why human:** Headless Chromium has no PDF plugin.

#### 5. FS-O1, status-region contract wording (QUAL-02)

**Test:** Decide whether "exactly one live status region" refers to the form's submission region or to the whole document.
**Expected:** Scoping accepted (the code is correct: 1 submission region at 6 of 6 transitions), or a change requested.
**Why human:** This is a wording decision, not a measurement.

#### 6. Owner confirmation of drafted acceptance wording (05-14, 05-17 prohibitions)

**Test:** Confirm that the orchestrator-drafted and owner-approved sentences for R-1, the Kenya DPA 2019 and the origin certificate stand as the owner's statements.
**Expected:** The owner confirms, or supplies their own wording.
**Why human:** The prohibition's literal requirement is "the owner's own statement".

### Items outside the requirements (informational, not gaps)

- **Owner PostHog check.** The owner's own check that PostHog shows web and product analytics is **pending**. It is outside LEAD-07 and QUAL-01 to QUAL-05.
- **Deferred by D-OQ-3 and `deferred-items.md`:**
  - CSS-O1 and G-1.
  - ZERO-PAPER HUB home-page findings F4, F4b, F5 and F6, plus observations VP-O1, VP-O2, VP-O3, KB-O1 and KB-O3.
  - These are scope decisions recorded with measured values. Phase 5 is the last phase in the roadmap, so no later phase absorbs them (Step 9b). They sit outside this phase's success criteria, which cover only the ZERO-PAPER HUB Products region.
- **Unpushed commits.** HAOO local `main` is ahead of `origin/main` by documentation and evidence commits only. The verifier confirmed there are no source changes.

### Gaps Summary

No success criterion failed and no must-have artifact is missing, a stub or unwired.

The fixes the phase found on production are all verified by the verifier's own reading of the deployed bytes, not by trusting the summaries: F1-LIVE, ZM-LIVE-1/2 and L2-O1.

The status is `human_needed`, not `passed`, for these reasons:

- Three truths are backstop readability judgements that no instrument can make: option labels, E1 and E3. Those same judgements are the outstanding "deployed manual checks" in QUAL-05.
- Keyboard behaviour inside a real PDF viewer is unevidenced.
- FS-O1 and the drafted-acceptance wording need an owner decision.

None of these shows the goal missed. Each is a claim the automation cannot settle.

---

_Verified: 2026-09-13T09:05:00Z_
_Verifier: Claude (gsd-verifier)_
