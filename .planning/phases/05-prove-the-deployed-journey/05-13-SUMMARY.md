---
phase: 05-prove-the-deployed-journey
plan: 13
subsystem: testing
tags: [playwright, e2e, zoom, reflow, resize-text, reduced-motion, wcag22, evidence]

requires:
  - phase: 05-08
    provides: "The viewport spec's three overflow readings, VC-2 primary-action measurement, and collectViewportEscapees"
  - phase: 05-10
    provides: "The SS-4 brochure-equivalence expectations and readers, the six-capability measured correction, and the F1-LIVE self-terminating DEPLOY_LAG pattern"
  - phase: 05-05
    provides: "ZOOM_VIEWPORTS with criterion labels, the 320x256 reflow entry, PRIMARY_ACTIONS, recordEvidence"
provides:
  - "e2e/zoom-motion.e2e.ts: 21 live tests (ZM-1a-d at 640x512, 720x450 and 320x256; ZM-2a/2b/2c; a no-preference control; the Products/F6 observation; E1/E3 readability inputs at four widths) plus ZM-2a/2b and the control on preview"
  - "e2e/fixtures/targets.ts and e2e/fixtures/brochure-equivalence.ts: the VC-2 and SS-4 assertion code, moved verbatim so the viewport, semantics and zoom specs share one definition"
  - "A source fix for two reduced-motion defects on the live HAOO page (ZM-LIVE-1 hover translate, ZM-LIVE-2 smooth scrolling), proven on the preview build and registered on live until deploy"
  - "05-EVIDENCE-ZOOM-MOTION.md: criterion-labelled zoom table, ZM-2 computed literals for live and the fixed build, observations, and E1/E3 held out for human judgement"
affects: [05-14, 05-17, "the next HAOO deploy (deletes ZM-LIVE-1/2)", "future ZERO-PAPER HUB accessibility phase (F6 numbers)"]

actuals:
  # chars/4 over every added line in the realized diff (base 5a2b74c..0d5ac30).
  # Authored: zoom spec 11179 + evidence file 4364 + fixtures 5055 (moved verbatim from the
  # viewport and semantics specs, which lost 411 lines) + spec import edits 112 + source fix 122 = 20835.
  # Generated evidence JSON: 36429.
  tokens: 57264
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "A spec that must re-run another spec's assertions imports them from e2e/fixtures/, never from the other spec: Playwright refuses spec-to-spec imports"
    - "Motion is measured as computed values across a real hover, with a matchMedia check that the emulation reached the page, a :hover check that the hover landed, and a no-preference control that proves the reading can see a change"
    - "A live divergence whose fix is committed but undeployed is held by a DEPLOY_LAG entry that asserts the deployed value and instructs its own deletion; the preview project holds the contract unconditionally"
    - "Backstop items get a measured-inputs test with zero expect calls, so the human judgement is informed and nothing passes silently"

key-files:
  created:
    - e2e/zoom-motion.e2e.ts
    - e2e/fixtures/targets.ts
    - e2e/fixtures/brochure-equivalence.ts
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-ZOOM-MOTION.md
    - evidence/zoom-overflow.json
    - evidence/zoom-content.json
    - evidence/zoom-primary-actions.json
    - evidence/zoom-clipping.json
    - evidence/motion-suppression.json
    - evidence/motion-closed-negative.json
    - evidence/motion-content-preserved.json
    - evidence/motion-observations.json
    - evidence/zoom-readability-inputs.json
  modified:
    - e2e/viewport.e2e.ts
    - e2e/semantics.e2e.ts
    - src/pages/ProductPage.tsx
    - src/index.css

key-decisions:
  - "The zoom entries are ZOOM_VIEWPORTS (640x512, 720x450, labelled SC 1.4.4 Resize Text 200%) plus the one criterion-bearing VIEWPORTS entry (320x256, SC 1.4.10 Reflow). No row is a reflow claim unless its label says so."
  - "Two reduced-motion defects on the live page were fixed in source rather than accommodated: the hover translate is now motion-safe:hover:-translate-y-1 (the old motion-reduce:transform-none lost on specificity), and smooth scrolling sits inside a no-preference media query."
  - "ZM-LIVE-1 and ZM-LIVE-2 are registered in a live-only DEPLOY_LAG that asserts the deployed values, following the F1-LIVE pattern from 05-10. The deploy of 65a612a breaks both assertions, and the entries must then be deleted, never updated."
  - "ZM-2a, ZM-2b and the control also run on the preview project, which serves the fixed build, so the fix is proven before it is deployed. ZM-2c and the Products observation stay live-only."
  - "src/index.css is a ground-A scaffold entry. HAOO's copy now diverges from ZERO-PAPER HUB's, which scaffold entries permit (verify:disjoint 26/26/0). ZERO-PAPER HUB is untouched, and its unguarded rule stays under F6."
  - "The Products region's colour transition (P9, colour properties only, 0.2s) is recorded as deliberately not required to be suppressed, and is not asserted."

patterns-established:
  - "Shared assertion code for live specs lives in e2e/fixtures/, next to the closed lists it measures"

requirements-completed: [QUAL-03]

coverage:
  - id: D1
    description: "ZM-1 at 640x512 and 720x450 (SC 1.4.4 Resize Text, 200%) and 320x256 (SC 1.4.10 Reflow) on the live build haoo-D1dl6F2P.js. At each entry: 0 escapees, with unmodified and mask-neutralised document widths equal to clientWidth; 6/6 capabilities, 4/4 journey steps and 10/10 items exposed and visible; P1-P8 meeting all five conditions (8/8); and 0 per-box truncation defects across 18 action boxes and 25 headings."
    requirement: QUAL-03
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/zoom-motion.e2e.ts (12 ZM-1 tests, --retries=0)"
        status: pass
      - kind: other
        ref: "05-13-PLAN.md Task 1 <verify> static check, plus a no-literal-dimension check"
        status: pass
    human_judgment: false
  - id: D2
    description: "ZM-2a/2b with reduced motion requested. On the fixed preview build, transition-property computes none, transform reads none before and after hover, there are 0 animate- elements, and html and body both compute scroll-behavior auto. On live, the page still reads matrix(1, 0, 0, 1, 0, -4) after hover and html smooth, held as the registered ZM-LIVE-1 and ZM-LIVE-2 values."
    requirement: QUAL-03
    verification:
      - kind: e2e
        ref: "npx playwright test --project=preview e2e/zoom-motion.e2e.ts -g ZM-2 (ZM-2a, ZM-2b, control)"
        status: pass
      - kind: e2e
        ref: "npx playwright test --project=live e2e/zoom-motion.e2e.ts (ZM-2a/2b via DEPLOY_LAG, control)"
        status: pass
    human_judgment: true
    rationale: "The live half of the reduced-motion claim stays open until the owner authorises the push and deploy of 65a612a. When the deploy lands, the two DEPLOY_LAG assertions break by design and must be deleted in a follow-up commit, as F1-LIVE was."
  - id: D3
    description: "ZM-2c: with reduced motion active on live, the brochure equivalent is complete (10/10 exposed and visible, 0 missing) and P1-P8 all hold their conditions (8/8, 0 defects)"
    requirement: QUAL-03
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/zoom-motion.e2e.ts (ZM-2c)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Source fix for ZM-LIVE-1 and ZM-LIVE-2 in src/pages/ProductPage.tsx and src/index.css. The rebuilt CSS has 0 motion-reduce:transform-none rules and the smooth-scroll rule sits inside the no-preference query. The gate baseline holds."
    requirement: QUAL-03
    verification:
      - kind: e2e
        ref: "preview-project ZM-2a/2b against dist/ built from 65a612a"
        status: pass
      - kind: unit
        ref: "npm test (10 files, 684 tests)"
        status: pass
      - kind: other
        ref: "npm run typecheck, npm run lint, npm run verify:disjoint (26/26/0), npm run test:phase1:contracts"
        status: pass
    human_judgment: false
  - id: D5
    description: "05-EVIDENCE-ZOOM-MOTION.md carries the criterion-labelled zoom table, the claim each row supports, the ZM-2 literals, the colour-transition exclusion, F6 cross-referenced with numbers, and E1/E3 marked held out for human judgement and not a pass"
    requirement: QUAL-03
    verification:
      - kind: other
        ref: "05-13-PLAN.md Task 3 <verify> grep (criterion, held out for human judgement, not a pass, F6)"
        status: pass
    human_judgment: false
  - id: D6
    description: "E1 (paragraph copy in the max-width columns at a halved viewport) and E3 (the brochure equivalent once the capability grid collapses), with measured inputs at 360, 640, 720 and 320"
    requirement: QUAL-03
    verification: []
    human_judgment: true
    rationale: "Backstop items by design. No assertion settles line length or readability, so the spec records the inputs with 0 expect calls and a human decides."

duration: 19min
completed: 2026-09-12
status: complete
---

# Phase 5 Plan 13: Zoom and Motion Summary

**The live HAOO page reflows at 200% and at 320 px with every content item and control intact, and each reading carries the WCAG criterion it measures. Reduced motion turned up two live defects: the capability-card hover still moved, and smooth scrolling was unguarded. Both are fixed in source and proven on the build. The live page closes on the next deploy.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-09-12T19:48:47Z
- **Completed:** 2026-09-12T20:08:20Z
- **Tasks:** 3 of 3
- **Files:** 13 created, 4 modified

## Accomplishments

- **ZM-1, three entries, each with its label.** 640×512 and 720×450 carry *SC 1.4.4 Resize Text (200%)*, and 320×256 carries *SC 1.4.10 Reflow*.
  - Every entry recorded 0 escapees.
  - Both document readings equalled `clientWidth`.
  - All 10 brochure-equivalent items were exposed and visible.
  - P1–P8 met all five conditions (8 of 8).
  - There were 0 truncation defects across 43 boxes. The largest `scrollWidth − clientWidth` was 0.
- **ZM-2 found what a class-presence check would have missed.**
  - With `reducedMotion: 'reduce'`, the live card's transition was suppressed (`transition-property: none`), but hovering still computed `matrix(1, 0, 0, 1, 0, -4)`.
  - `hover:-translate-y-1` out-specifies the media-wrapped `motion-reduce:transform-none`, so the guard never applied.
  - `html` also computed `scroll-behavior: smooth`.
  - A no-preference control confirmed the reading can see the change.
- **Fixed and proven.**
  - `motion-safe:hover:-translate-y-1` replaces the ineffective guard, and smooth scrolling now sits inside a `no-preference` query.
  - On the preview build, transform reads `none` before and after hover, and `html` reads `auto`.
  - On live, both old values are held by self-terminating `DEPLOY_LAG` entries, ZM-LIVE-1 and ZM-LIVE-2.
- **Nothing disappears.** With reduce active: 10 of 10 items and 8 of 8 actions.
- **Observations recorded, not asserted.**
  - The Products region has exactly 1 transition, the P9 colour transition. It is deliberately not suppressed.
  - F6 now has numbers outside the region: 1 `animate-` element, 9 `hover:scale-` elements, 56 runnable transitions, and `html` smooth.
- **Held out for human judgement.**
  - E1: column widths and characters per line at 360, 640, 720 and 320. The halved entries read up to 84 characters per line.
  - E3: 6 cards at 1 per row at all four widths.

## Task Commits

1. **Task 1: Measure the zoom entries for reflow, content, function and truncation**: `a67db4d` (feat)
2. **Task 2, fix found during the task: make the capability-card hover and smooth scrolling honour reduced motion**: `65a612a` (fix)
3. **Task 2: Assert reduced-motion suppression, its closed negative, and that nothing disappears**: `a298ae4` (feat)
4. **Task 3: Record the zoom and motion evidence and the held-out readability inputs**: `0d5ac30` (docs)

**Plan metadata:** recorded in the close-out commit (docs: complete plan)

## Files Created/Modified

- `e2e/zoom-motion.e2e.ts`: ZM-1, ZM-2, the control, the observation, and the E1/E3 input tests.
- `e2e/fixtures/targets.ts`: VC-2 `readTarget` … `measureAction`, moved verbatim from the viewport spec.
- `e2e/fixtures/brochure-equivalence.ts`: the SS-4 expectations and readers, moved verbatim from the semantics spec.
- `e2e/viewport.e2e.ts`, `e2e/semantics.e2e.ts`: now import the moved code, with no behaviour change.
- `src/pages/ProductPage.tsx`: the capability-card hover is `motion-safe`.
- `src/index.css`: smooth scrolling is guarded by `prefers-reduced-motion: no-preference`.
- `evidence/*.json` (9 files): one run, 24 records, 0 retries.
- `05-EVIDENCE-ZOOM-MOTION.md`: the evidence, summarised with literals and integers.

## Decisions Made

See `key-decisions` above. The two with the most consequence:

- **Fix, don't accommodate.** The plan assumed the card already carried working reduced-motion guards, and the measurement showed one of them never applied. Accommodating the live values would have registered a defect as the contract. Instead the contract is unchanged, the source is fixed, the fix is proven on the build, and the live divergence is registered so the deploy closes it.
- **One definition of each assertion.** The zoom spec had to re-run VC-2 and SS-4, and Playwright forbids importing a spec. The code moved to `e2e/fixtures/` rather than being copied.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Playwright refuses a spec that imports another spec**
- **Found during:** Task 1
- **Issue:** The plan says to import or re-invoke the semantics spec's equivalence helper and the viewport spec's primary-action conditions. Playwright errors with "test file … should not import test file …", and copying the code would create two definitions free to drift.
- **Fix:** Moved SS-4's constants and readers to `e2e/fixtures/brochure-equivalence.ts`, and VC-2's `readTarget`…`measureAction` to `e2e/fixtures/targets.ts`, verbatim with `export` added. Both specs import them, and one orphaned `Locator` import was removed.
- **Files modified:** `e2e/viewport.e2e.ts`, `e2e/semantics.e2e.ts`, plus the two new fixtures. All four are outside `files_modified`.
- **Verification:** Typecheck 0 and lint 0. The viewport spec at 360×740 ran 6 of 6, and semantics SS-4 ran 3 of 3, both with `--retries=0`. Their tracked evidence files were restored afterwards.
- **Committed in:** `a67db4d`

**2. [Rule 1 - Bug] ZM-LIVE-1: the reduced-motion transform guard never took effect**
- **Found during:** Task 2, a probe before writing the assertions
- **Issue:** With reduced motion requested, hovering a capability card computed `matrix(1, 0, 0, 1, 0, -4)`. `.hover\:-translate-y-1:hover` (0,2,0) beats `.motion-reduce\:transform-none` (0,1,0).
- **Fix:** `motion-safe:hover:-translate-y-1`, with the ineffective guard removed.
- **Files modified:** `src/pages/ProductPage.tsx`
- **Verification:** Preview ZM-2a reads transform `none` → `none`, the control reads `none` → `matrix(…, -4)`, and `npm test` ran 684 tests.
- **Committed in:** `65a612a`

**3. [Rule 2 - Missing critical] ZM-LIVE-2: smooth scrolling had no reduced-motion guard**
- **Found during:** Task 2, the same probe
- **Issue:** `src/index.css` shipped an unguarded `html { scroll-behavior: smooth; }`, so ZM-2b's closed negative read `smooth` on live under reduce.
- **Fix:** Wrapped the rule in `@media (prefers-reduced-motion: no-preference)`.
- **Files modified:** `src/index.css`. It is a ground-A scaffold entry, and HAOO's copy now diverges from ZERO-PAPER HUB's, which scaffold entries permit.
- **Verification:** Preview ZM-2b reads `html` `auto`. `verify:disjoint` reads 26 shared, 26 allowlisted and 0 violations, and `test:phase1:contracts` exited 0.
- **Committed in:** `65a612a`

**4. [Measured correction, carried] "The capability count is re-asserted as exactly 10"**
- **Found during:** Task 1
- **Issue:** The page ships 6 capabilities and 4 journey steps. The 10 is the size of the whole equivalent, a correction 05-10 already recorded against the UI-SPEC.
- **Fix:** The spec asserts 6, 4 and 10 through the shared SS-4 constants.
- **Committed in:** `a67db4d`

### Process issue, corrected before close-out

**5. The Task 3 commit first ran before its acceptance grep held.** A `;` where the chain needed `&&` let `git commit` run after the grep for `not a pass` failed: the file said "Neither item below is a pass". The phrase was corrected, all four patterns were re-verified, and the unpushed commit was amended to `0d5ac30`. The committed evidence file now carries all four patterns.

**Total deviations:** 3 auto-fixed (1 blocking, 1 bug, 1 missing critical), 1 carried measured correction, 1 process issue corrected. **Impact:** Two product files changed outside the plan's `files_modified` to fix real reduced-motion defects. The live half of ZM-2a and ZM-2b stays open until deploy.

## Issues Encountered

None beyond the deviations above. Every recorded run used `--retries=0` and none was retried.

## Escalation: owner action needed to close ZM-LIVE-1 and ZM-LIVE-2 on live

Nothing was pushed. To close the live half of the reduced-motion claim:
1. The owner authorises pushing HAOO `main`, which includes `65a612a`, and the Deploy HAOO workflow runs.
2. After the deploy, `npx playwright test --project=live e2e/zoom-motion.e2e.ts` will fail ZM-2a and ZM-2b, and each failure message names its entry.
3. Delete the ZM-LIVE-1 and ZM-LIVE-2 entries, together with `DEPLOY_LAG`, `lagFor` and `expectContractOrRegisteredLag` once nothing uses them. Then re-run and record the new bundle name, as F1-LIVE was closed.

## Known Stubs

None.

## Threat Flags

None. No network endpoint, auth path, or trust-boundary schema was added. The only product change removes motion under a user preference.

## Findings queued elsewhere

- **F6** (ZERO-PAPER HUB motion, deferred by D-OQ-3) is cross-referenced with numbers and not re-raised.
- **VP-O3** did not recur, because this plan measured only the HAOO page at the zoom entries.
- **R-1, O-1, FS-O1 and G-1** were not met, and they stay with 05-14.
- **P5/P6 fixture gap** (4 declared, 3 found) is recorded at every entry, and the fixture is not edited.

## Next Phase Readiness

- Ready for 05-14, which completes wave 5. 05-02, 05-06 and 05-16 remain parked on the `haoo.online` MX records.
- QUAL-03 is also declared by 05-14 and 05-17, so it is not yet marked complete in REQUIREMENTS.md.

## Self-Check: PASSED

- FOUND: all 13 created files (spec, two fixtures, evidence file, nine evidence records)
- FOUND: commits `a67db4d`, `65a612a`, `a298ae4`, `0d5ac30`
- Plan-level verification: `npx playwright test --project=live e2e/zoom-motion.e2e.ts` exited 0 (21 tests); `npm run typecheck` 0; `npm run lint` 0; every zoom row carries its criterion label; both held-out items are present and marked not a pass
- Gate baseline: `npm test` ran 684 tests in 10 files, exit 0; `verify:disjoint` 26/26/0, exit 0; `test:phase1:contracts` exit 0
