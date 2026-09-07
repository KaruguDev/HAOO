---
phase: 05-prove-the-deployed-journey
plan: 05
subsystem: testing
tags: [playwright, axe-core, accessibility, wcag, closed-list, evidence, fixtures]

# Dependency graph
requires:
  - phase: 05-03
    provides: "The installed evidence harness — @playwright/test 1.63.0, @axe-core/playwright 4.13.0, playwright.config.ts with the live/preview projects, tsconfig.e2e.json, and the measured answer to research open question A2"
  - phase: 05-01
    provides: "The HAOO checkout as the single working directory for every Phase 5 plan (D-01/D-04), and the ruling that nothing this phase creates enters shared-scaffold.txt (D-08)"
provides:
  - "e2e/fixtures/surfaces.ts — the closed S1-S5 surface list with a reason, owning repo, live URL, baseURL-relative path and Playwright project per entry"
  - "e2e/fixtures/viewports.ts — the closed D-09 viewport list plus a 320x256 reflow entry, and ZOOM_VIEWPORTS labelled with the success criterion each actually measures"
  - "e2e/fixtures/primary-actions.ts — the closed P1-P13 list with the two hit-target floors, the duplicate-name rule, and the measured P13 correction"
  - "e2e/fixtures/axe.ts — the single axeFor(page, surface) factory owning the tag list, the D-OQ-1 blocking-impact set, the per-URL disables and the S3 inclusion scope"
  - "e2e/fixtures/evidence.ts — recordEvidence/readEvidence, which refuse a record with no measured value or with a pass-mark string"
  - "e2e/fixtures/overflow.ts — collectViewportEscapees and measureDocumentWidths, the two shared VC-1 measurements"
  - "A tracer proven to carry its behaviour through the fixture layer, with every measured field identical across the extraction"
affects: [05-06, 05-07, 05-08, 05-09, 05-10, 05-11, 05-12, 05-13, 05-14]

actuals:
  tokens: 17580
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Closed list with a per-entry reason and a vacuity guard, extended from src/test/focus-contrast.test.ts to the e2e layer"
    - "Single-factory ownership of a vendor rule set, with the reasoning at the branch rather than in a separate document"
    - "Measured-value enforcement at the writer: the recorder refuses a pass mark rather than relying on reviewer vigilance"

key-files:
  created:
    - e2e/fixtures/surfaces.ts
    - e2e/fixtures/viewports.ts
    - e2e/fixtures/primary-actions.ts
    - e2e/fixtures/axe.ts
    - e2e/fixtures/evidence.ts
    - e2e/fixtures/overflow.ts
    - evidence/tracer-fixture-layer.json
  modified:
    - e2e/tracer.e2e.ts

key-decisions:
  - "The axe factory expresses its whole rule set through ONE options({ runOnly }) call and carries the per-URL disables inside that same object rather than through .disableRules(), because both .options() and .disableRules() assign wholesale and their result would otherwise depend on call order"
  - "S3 is scoped by .include('#products'), and there is no bypass entry in the disable table for any surface — scoping stays correct after a future ZERO-PAPER HUB phase fixes F5; a disable would go stale invisibly"
  - "The 320x256 entry lives in VIEWPORTS carrying the reflow criterion; the halved 640/720 entries live in ZOOM_VIEWPORTS carrying the SC 1.4.4 resize-text criterion — a 640 px measurement is never labelled as reflow conformance"
  - "The recorder refuses pass marks at the writer (pass/passed/ok, and the equally opinion-shaped fail/true/yes) while accepting zero, false and the empty array, which are real readings"
  - "The refactored tracer records to evidence/tracer-fixture-layer.json and leaves the 05-03 baseline at evidence/tracer.json byte-unchanged, so the no-change claim has a referent the refactor could not have edited"
  - "The A2 probes are kept rather than retired: they are the standing measurement of the premise the axe factory is built on"

patterns-established:
  - "Vacuity guard: assertNonEmptySubjects / assertNonEmptyViewports / primaryActionsFor throw when a selection yields nothing, so a spec that silently matched nothing fails loudly instead of reporting a green run over an empty subject set"
  - "Criterion labelling: any viewport entry that stands for a conformance claim carries the success criterion it measures, so the claim cannot drift away from the method"
  - "Surface entries carry playwrightProject alongside path, because a baseURL-relative path is meaningless without naming the baseURL it is relative to"

requirements-completed: [QUAL-01, QUAL-02, QUAL-03]

coverage:
  - id: D1
    description: "Every surface, viewport and primary action this phase measures is declared once, in a closed list carrying the reason each entry was admitted"
    requirement: "QUAL-01"
    verification:
      - kind: other
        ref: "node import check over e2e/fixtures/{surfaces,viewports,primary-actions}.ts — 5 surfaces (ids S1..S5), 6 viewports including 320, 2 zoom entries each with a criterion, 13 actions (ids P1..P13), floors 44/24, every entry carrying a non-empty reason"
        status: pass
      - kind: other
        ref: "npm run typecheck && npm run lint"
        status: pass
    human_judgment: false
  - id: D2
    description: "A listed entry that yields nothing fails the run loudly rather than passing vacuously"
    verification:
      - kind: other
        ref: "primaryActionsFor('S9') proven to throw the vacuity-guard error rather than return an empty list"
        status: pass
    human_judgment: false
  - id: D3
    description: "One axe builder factory owns the tag list, the per-URL disables and the Products-region scoping, so no call site can quietly differ"
    requirement: "QUAL-03"
    verification:
      - kind: other
        ref: "builder-construction check over axeFor — S1 whole document with no rule disables, S3 scoped to #products, S4 carrying exactly the three named disables, runOnly tags identical across all three"
        status: pass
      - kind: e2e
        ref: "npx playwright test --project=live e2e/tracer.e2e.ts — the conformance run built by axeFor executed 29 rules across 69 tag families"
        status: pass
    human_judgment: false
  - id: D4
    description: "The Products-section run is scoped by inclusion rather than by disabling the bypass rule, so it stays correct after a future ZERO-PAPER HUB phase fixes the underlying defect"
    verification:
      - kind: other
        ref: "AXE_PER_URL_DISABLES asserted to hold exactly three rows, all keyed to S4, none of them 'bypass'; axeFor('S3') asserted to carry includes ['#products']"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every evidence record carries the measured value, the surface, the viewport and a timestamp — never a pass mark"
    verification:
      - kind: other
        ref: "recordEvidence proven to throw on null, undefined, 'passed', 'pass', 'OK ', {}, a null value inside measured and a pass mark inside measured; proven to accept and append a zero and an empty-array reading with an ISO-8601 UTC timestamp"
        status: pass
    human_judgment: false
  - id: D6
    description: "The tracer's behaviour survived the extraction into the fixture layer — the refactor changed no measurement"
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/tracer.e2e.ts (passed, 9.8s) followed by a field-by-field comparison of evidence/tracer-fixture-layer.json against evidence/tracer.json — 22 measured fields, all identical"
        status: pass
    human_judgment: false
  - id: D7
    description: "The 200% halved-viewport measurement is labelled as a resize-text-class measurement, and a separate 320-pixel-wide entry carries the reflow-class claim"
    requirement: "QUAL-03"
    verification: []
    human_judgment: true
    rationale: "The labels are present and machine-checked for non-emptiness, but whether each label names the RIGHT criterion for the method it stands over is a reading of WCAG against the code that no test in this repository asserts. The nine specs about to consume ZOOM_VIEWPORTS will inherit whatever these strings say."

# Metrics
duration: 15 min
completed: 2026-09-07
status: complete
---

# Phase 05 Plan 05: The Evidence Fixture Layer Summary

**Four closed lists, one `axeFor` factory that expresses its whole rule set through a single `options({ runOnly })` call, a recorder that throws on a pass mark, and two shared VC-1 overflow measurements — with the tracer re-run through all of them producing 22 byte-identical measured fields.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-09-07T19:56:30Z
- **Completed:** 2026-09-07T20:11:30Z
- **Tasks:** 3
- **Files modified:** 8 (7 created, 1 modified)

## Accomplishments

- **The nine specs about to be written now have declared subjects.** S1-S5, six viewports, two zoom entries and P1-P13 exist once, each with the reason it was admitted, in the house `FOCUS_SOURCES` shape — `as const`, a doc-comment stating how an entry gets in, and a vacuity guard that throws when a selection yields nothing.
- **The axe configuration exists in exactly one place, with its reasoning at the branch.** `axeFor(page, surface)` carries the five conformance tags, the D-OQ-1 blocking-impact set, the three S4 disables and the S3 inclusion scope. No call site can differ from it without editing it.
- **The measured-values discipline moved from review into the code.** `recordEvidence` refuses `null`, `undefined`, an empty measured object, and the strings `pass`/`passed`/`ok` — while accepting `0`, `false` and `[]`, which are real readings.
- **The extraction is proven, not asserted.** The refactored tracer ran against live production and every measured field it produced is identical to the pre-refactor baseline, including the 29 rule ids in byte-identical order and both A2 probe summaries.

## Task Commits

1. **Task 1: The four closed lists** — `d50bb44` (feat)
2. **Task 2: The axe factory and the measured-value recorder** — `0f854a2` (feat)
3. **Task 3: The overflow helpers and the tracer refactor** — `e36908c` (refactor)

## Files Created/Modified

- `e2e/fixtures/surfaces.ts` — `SURFACES` (S1-S5), `SurfaceId`, `assertNonEmptySubjects`, `surfacesForProject`. Each entry carries the live URL, owning repo, the baseURL-relative path, the Playwright project that path resolves against, whether JavaScript is enabled, and its admission reason.
- `e2e/fixtures/viewports.ts` — `VIEWPORTS` (the five D-09 widths plus `320 × 256`), `ZOOM_VIEWPORTS` (`640 × 512`, `720 × 450`), `assertNonEmptyViewports`, `productSupportViewports`. Every conformance-bearing entry names the criterion it measures.
- `e2e/fixtures/primary-actions.ts` — `PRIMARY_ACTIONS` (P1-P13), `MIN_PRIMARY_HIT_TARGET_PX` (44), `MIN_INTERACTIVE_HIT_TARGET_PX` (24), `primaryActionsFor`.
- `e2e/fixtures/axe.ts` — `axeFor`, `AXE_TAGS`, `BLOCKING_IMPACTS`, `isBlockingImpact`, `AXE_PER_URL_DISABLES`, `axeDisablesFor`, `PRODUCTS_REGION_SELECTOR`.
- `e2e/fixtures/evidence.ts` — `recordEvidence`, `readEvidence`, `evidencePath`, `EvidenceRecord`, `EvidenceInput`.
- `e2e/fixtures/overflow.ts` — `collectViewportEscapees`, `measureDocumentWidths`, `OVERFLOW_TOLERANCE_PX` (1).
- `e2e/tracer.e2e.ts` — refactored to consume all five fixture modules; assertions unchanged in strength.
- `evidence/tracer-fixture-layer.json` — the post-refactor measurement, recorded through `recordEvidence`.

## Decisions Made

**1. The whole axe rule set travels in one `options()` object, disables included.** Reading `@axe-core/playwright@4.13.0`'s source settled a question the plan left open: `options()` assigns `this.option` *wholesale*, and `disableRules()` assigns `this.option.rules` wholesale. So `.options({...}).disableRules([...])` and `.disableRules([...]).options({...})` produce different builders, and the difference is invisible at the call site — the same last-call-wins hazard measured for `withTags`/`withRules` in 05-03, one level down. Composing a single options object with `runOnly` and `rules` together removes the ordering question entirely rather than documenting the right order and hoping.

**2. `heading-order` is not in this factory at all.** 05-03 measured that `withTags` and `withRules` replace rather than union, so there is no builder that runs both the WCAG sweep and the advisory heading rule. The factory records that consequence in its own comment and hands the assertion to the semantics spec as a DOM walk. Adding `withRules(['heading-order'])` here would silently collapse a 29-rule conformance run to one rule.

**3. The 320 entry sits in `VIEWPORTS`, not in `ZOOM_VIEWPORTS`.** It is a width the product is measured at, and its criterion field carries the reflow claim. The halved 640/720 entries are a modelling technique for 200% zoom, not product-support widths, so they live in their own list carrying the SC 1.4.4 label. Keeping them in separate lists is what stops a spec iterating "the viewports" and quietly reporting a 640 px reading as reflow conformance.

**4. `Surface` carries `playwrightProject` alongside `path`.** The plan's field list names "the path to use against the project `baseURL`". S1 and S5 are both `'/'` and resolve to different origins, so a path without a named project is ambiguous — the field makes the plan's own wording executable rather than adding capability.

**5. The refactored tracer records beside its baseline, not over it.** `evidence/tracer.json` is the only copy of the pre-refactor measurement and it is the referent for this plan's no-change claim. Overwriting it would have made that claim unfalsifiable by construction, so the new record goes to `evidence/tracer-fixture-layer.json`.

**6. The A2 probes stay in the tracer.** The answer is recorded in `05-EVIDENCE-HARNESS.md`, but the answer is also the *premise* `fixtures/axe.ts` is built on. A vendor upgrade that changed the composition behaviour would leave the factory correct and its recorded reason stale, with nothing in the suite noticing. The probes cost two extra axe runs and keep the premise under measurement.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The per-URL disables were moved inside the single options object rather than applied through `.disableRules()`**

- **Found during:** Task 2 (the axe factory)
- **Issue:** The plan says never to call the options method and the tag method on the same builder, and settles the `withTags`/`withRules` question — but it does not address `disableRules`, which the source shows assigns `this.option.rules` wholesale while `options()` assigns `this.option` wholesale. Chaining them reintroduces exactly the ordering hazard the plan exists to close: `.options({...}).disableRules([...])` keeps `runOnly` and adds the disables, while `.disableRules([...]).options({...})` silently discards every disable. On S4 that second ordering would run three rules the phase decided not to run, and the run would look completely normal.
- **Fix:** `axeFor` builds one `AxeRunOptions` object carrying both `runOnly` and `rules`, and makes exactly one `.options()` call. `.disableRules()` is never called.
- **Files modified:** `e2e/fixtures/axe.ts`
- **Verification:** Builder-construction check — `axeFor(page, 'S4')` carries `runOnly` with all five tags *and* the three disabled rules in one options object; `axeFor(page, 'S1')` carries no `rules` key at all.
- **Committed in:** `0f854a2` (Task 2 commit)

**2. [Rule 2 - Missing Critical] The recorder also refuses `fail`, `failed`, `true` and `yes`**

- **Found during:** Task 2 (the recorder)
- **Issue:** The plan names `pass` / `passed` / `ok` as the refused strings. But the argument for refusing them — that a verdict is not a measurement and cannot be re-examined by someone who doubts it — applies identically to `'fail'` and to a bare `'true'`. A recorder that refused only the flattering verdicts would enforce optimism rather than measurement.
- **Fix:** `PASS_MARKS` holds `pass`, `passed`, `ok`, `fail`, `failed`, `true`, `yes`, compared trimmed and case-insensitively. The boolean `false` and the number `0` are explicitly accepted, and the reason is in the comment: `webdriver: false` says something, and the 04.2 human verification recorded four zeros precisely because a zero distinguishes what happened from what did not.
- **Files modified:** `e2e/fixtures/evidence.ts`
- **Verification:** Proven to throw on `'passed'`, `'pass'`, `'OK '`, `null`, `undefined`, `{}`, a null value nested inside `measured`, and a pass mark nested inside `measured`; proven to accept `0` and `[]`.
- **Committed in:** `0f854a2` (Task 2 commit)

**3. [Rule 3 - Blocking] The plan's Task 1 verification command depends on `tsx`, which this repository does not have**

- **Found during:** Task 1 (verifying the closed-list counts)
- **Issue:** The `<verify>` block runs `npx tsx -e "import {SURFACES} from './e2e/fixtures/surfaces'; …"`. `tsx` is not in `devDependencies`, so `npx` would fetch it from the registry at run time — which the executor's own rules forbid without human verification of the package — and the specified fallback (`npx playwright test --project=live e2e/tracer.e2e.ts`) checks none of the counts the acceptance criteria name.
- **Fix:** Ran the same assertions under the repository's own Node 24 (native TypeScript stripping, no new dependency), with a throwaway resolve hook in the scratchpad that resolves the extensionless imports the way Playwright's bundler-style resolver does. Nothing was installed and nothing was added to the repository.
- **Files modified:** None
- **Verification:** All Task 1 acceptance criteria checked by import — surface count and ids, viewport count and the 320 entry, zoom count and criterion presence, action count and ids, both floors, the P13 shape and its reason wording, and the vacuity guard throwing.
- **Committed in:** N/A (verification method, no code change)

**4. [Rule 1 - Bug] The tracer's viewport height moved 800 → 740**

- **Found during:** Task 3 (the tracer refactor)
- **Issue:** The 05-03 tracer hardcoded `{ width: 360, height: 800 }` while describing 360 as "the narrowest entry in the D-09 closed list". Once the list exists, the height has an owner, and `VIEWPORTS[0]` is `360 × 740`. Keeping 800 would have meant the tracer only *claimed* to consume the list; adding an 800-height entry to the list to preserve the old number would have been widening a closed list for a test's convenience, which is precisely what the list forbids.
- **Fix:** The tracer takes both dimensions from `VIEWPORTS[0]`.
- **Files modified:** `e2e/tracer.e2e.ts`
- **Verification:** The field-by-field comparison below — all 22 measured fields identical, so the delta changed no measurement.
- **Committed in:** `e36908c` (Task 3 commit)

---

**Total deviations:** 4 (2 missing-critical, 1 blocking, 1 bug)
**Impact on plan:** All four tighten the substrate rather than widen it. Deviations 1 and 2 close ordering and asymmetry hazards of exactly the kind this plan exists to close; 3 is a verification-method substitution with no code effect; 4 is the refactor doing what the plan asked for, with the proof attached.

## The refactor comparison, field by field

`evidence/tracer-fixture-layer.json` against `evidence/tracer.json`. The plan names five fields; all 22 measured fields were compared and every one is identical.

| Field | Value, before and after |
|---|---|
| `axeCoreVersion` | `4.13.0` |
| `tagFamilies` | `69` |
| `webdriver` | `true` |
| `ingestionRequests` | `[]` |
| `overflowEscapees` | `[]` |
| `ruleIds` | 29 ids, byte-identical order |
| `ruleCount` | `29` |
| `tagsReturned` | 69 tags, byte-identical order |
| `headingOrderRan` | `false` |
| `passCount` / `incompleteCount` / `violationCount` | `29` / `0` / `0` |
| `violations` / `violationImpactCounts` | `[]` / `{}` |
| `headingText` | `Run the business—not the paperwork.` |
| `tagsSent` / `ingestionOrigins` / `overflowToleranceCssPx` | the five WCAG tags / `["https://us.i.posthog.com"]` / `1` |
| `openQuestionA2` (composition, mechanism, both probe summaries) | `replacement`, last-call-wins, 1-rule/2-tag and 29-rule/69-tag probes |

One deliberate delta: `viewport` moved `360 × 800` → `360 × 740` (deviation 4).

## Issues Encountered

None. The three gates the plan names all passed on the first attempt after each task, and the live tracer run passed on the first attempt after the refactor.

## Known Stubs

None. Every exported symbol has a real implementation and was exercised — the lists by import, the factory by construction, the recorder by its refusal cases, and the overflow sweep and evidence write by the live tracer run.

## Verification Results

- `npm run typecheck` — exit 0 (three projects, including `tsconfig.e2e.json`)
- `npm run lint` — exit 0
- `npm test` — exit 0, **684 tests passing across 10 files** (baseline held)
- `npm run verify:disjoint` — exit 0, **26 shared / 26 allowlist / 0 violations** (baseline held; nothing added to `shared-scaffold.txt`, per D-08)
- `npx playwright test --project=live e2e/tracer.e2e.ts` — 1 passed, 9.8s
- Closed-list counts, ids, reasons, floors and the vacuity guard — checked by import
- Axe factory per-surface composition — checked by builder construction
- Recorder refusals — 8 refusal cases proven to throw, 2 acceptance cases proven to append

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **The substrate is ready for the nine specs.** `05-06` onward can import declared subjects instead of re-deriving selectors, and `axeFor` is the only place an axe run gets configured.
- **Two things a spec author must not rediscover the hard way.** `heading-order` is *not* in the axe run and cannot be added to it — the semantics spec owns that assertion as a DOM walk. And `measureDocumentWidths` with `neutraliseMask: true` leaves the page modified: the style tag is not removed, so any measurement taken after it is a modified-page reading.
- **`05-14` still owns the gating run.** The tracer records the violation list without applying the D-OQ-1 threshold; `BLOCKING_IMPACTS` and `isBlockingImpact` are exported and ready for it, but nothing gates on them yet.
- **Open, and named so it is not mistaken for settled:** whether each `criterion` string names the right success criterion for the method it stands over (coverage entry D7). The labels are present and non-empty; that they are *correct* is a WCAG reading no test in this repository asserts.

---
*Phase: 05-prove-the-deployed-journey*
*Completed: 2026-09-07*

## Self-Check: PASSED

- All seven created files present on disk (`e2e/fixtures/{surfaces,viewports,primary-actions,axe,evidence,overflow}.ts`, `evidence/tracer-fixture-layer.json`).
- All three task commits present in `git log`: `d50bb44`, `0f854a2`, `e36908c`.
- All task-level `<acceptance_criteria>` re-run and passing; plan-level `<verification>` re-run and passing.
