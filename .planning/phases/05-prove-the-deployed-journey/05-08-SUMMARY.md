---
phase: 05-prove-the-deployed-journey
plan: 08
subsystem: testing
tags: [playwright, e2e, viewport, overflow, hit-target, wcag22, reflow, evidence]

requires:
  - phase: 05-05
    provides: "The fixture layer: SURFACES, VIEWPORTS, PRIMARY_ACTIONS with the two hit-target floors and the vacuity guard, collectViewportEscapees and measureDocumentWidths, recordEvidence, and PRODUCTS_REGION_SELECTOR"
  - phase: 05-03
    provides: "The live Playwright project against www.haoo.online and live URLs for the ZERO-PAPER HUB surfaces"
provides:
  - "e2e/viewport.e2e.ts: 40 live tests covering VC-1 (three overflow readings), VC-2 (P1-P10 reachable and at least 44 x 44, every other control at least 24 x 24), VC-3 (mobile nav state tracking) and both media-absent partial states, at the six closed widths on S1 and S3"
  - "Four evidence records: viewport-overflow (12), viewport-primary-actions (12), viewport-mobile-nav (6), viewport-media-absent (10)"
  - "05-EVIDENCE-VIEWPORT.md: integer per-width and per-action tables, both floors, both settled decisions, the three planner assumptions, and three new out-of-scope ZERO-PAPER HUB observations (VP-O1 to VP-O3)"
  - "collectViewportEscapees({ regionSelector }): optional region attribution for scoped surfaces. It throws when the region is absent, and unscoped records are unchanged"
affects: ["the zoom spec (same shared overflow helpers)", 05-14, "future ZERO-PAPER HUB accessibility phase"]

actuals:
  # chars/4 over every added line in the realized diff (base 6743eef).
  # Authored: spec 13826 + helper 852 + evidence file 5271 = 19949.
  # Generated evidence JSON: 4972 + 47234 + 10376 + 5816 = 68398.
  tokens: 88347
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Record every measurement before asserting it, then assert over the recorded data, so a failing run still leaves the reading that failed"
    - "Locate primary actions by accessible name with includeHidden, then classify each instance as rendered, reached through a disclosure, or not rendered, so an instance hidden at a width is enumerated rather than skipped"
    - "Collapsed-disclosure rule in code: measure the opener against the primary floor, operate it by keyboard, measure the revealed target, then close it again"
    - "Playwright trial click as the hit-targetability probe: every actionability check, including not being obscured, without following a link or submitting"
    - "Scoped surfaces attribute page-level findings by region, and the document-width bound extends only as far as out-of-scope content reaches"

key-files:
  created:
    - e2e/viewport.e2e.ts
    - evidence/viewport-overflow.json
    - evidence/viewport-primary-actions.json
    - evidence/viewport-mobile-nav.json
    - evidence/viewport-media-absent.json
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-VIEWPORT.md
  modified:
    - e2e/fixtures/overflow.ts

key-decisions:
  - "VC-1a and VC-1c are asserted on every surface at every width. On S3 the bound is max(clientWidth, reach of out-of-scope escapees) + 1, so excess that cannot be attributed to content outside #products fails. On S1 it reduces to clientWidth + 1."
  - "Region attribution lives in the shared helper (collectViewportEscapees regionSelector), not in the spec, so the viewport and zoom specs keep one overflow measurement and the spec has no element walk of its own."
  - "On S3, VC-3 fails only on P10 and its opener. The other ZERO-PAPER HUB header entries are outside the Products region and are recorded as D-OQ-3 observations."
  - "VC-3 is measured at every width below md (320, 360, 390), not only the two the UI-SPEC names, because the breakpoint rather than the label decides where the toggle is the only path."
  - "The primary-actions fixture declares four instances for P5 and P6, but only three carry the declared name: the footer link is named by the bare value. This is recorded as a precision gap, not widened. The footer instances measure at least 44 x 44 under the non-primary sweep."

patterns-established:
  - "A document-width reading is never the overflow result. The per-element sweep on the unmodified page is. Every modified-page reading carries its mode marker into the evidence file."

requirements-completed: [QUAL-01]

coverage:
  - id: D1
    description: "Horizontal overflow measured three ways (VC-1a unmodified, VC-1b per-element on the unmodified page, VC-1c mask-neutralised) at six widths on S1 and S3. There were 0 in-scope escapees in all 12 pairs, and both document readings equalled clientWidth throughout."
    requirement: QUAL-01
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/viewport.e2e.ts (12 VC-1 tests)"
        status: pass
      - kind: other
        ref: "05-08-PLAN.md Task 1 <verify> static check: helpers consumed, no inline element walk"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every primary action on S1 (P1-P8) and S3 (P9, P10) is present by its accessible name, visible, unclipped, inside the viewport, at least 44 x 44, enabled, and receives the pointer at six widths. Each shared name maps to one href. Every other interactive element measures at least 24 x 24 (0 below)."
    requirement: QUAL-01
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/viewport.e2e.ts (12 VC-2 tests)"
        status: pass
      - kind: other
        ref: "05-08-PLAN.md Task 2 <verify> static check: both floors and PRIMARY_ACTIONS consumed, no uniqueness assertion"
        status: pass
    human_judgment: false
  - id: D3
    description: "The mobile navigation toggle's aria-expanded, name, controlled element's hidden attribute and layout box flip together and back on keyboard activation at 320, 360 and 390 on both sites. Every in-scope revealed link is at least 44 x 44."
    requirement: QUAL-01
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/viewport.e2e.ts (6 VC-3 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Media-absent states. With the HAOO page's media aborted below lg, the recovery copy renders, P1 and P2 survive, and there are 0 escapees. With the Products card's cross-origin image aborted at all six widths, naturalWidth reads 0, the four text fields render, Explore HAOO still leads to https://www.haoo.online/, and there are 0 in-region escapees."
    requirement: QUAL-01
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/viewport.e2e.ts (10 media-absent tests)"
        status: pass
    human_judgment: false
  - id: D5
    description: "05-EVIDENCE-VIEWPORT.md records the integer tables, the modified-page labels, both floors, D-OQ-2 and D-OQ-3 as settled, and the three assumptions verbatim"
    requirement: QUAL-01
    verification:
      - kind: other
        ref: "05-08-PLAN.md Task 3 <verify> grep, plus an acceptance check that the 12 overflow rows are all-integer"
        status: pass
    human_judgment: false
  - id: D6
    description: "Three new defects on the live ZERO-PAPER HUB home page, outside the Products region, are recorded and handed forward: VP-O1 hero decoration clipped, VP-O2 hero column 14 px wide at 320, VP-O3 three mobile-menu entries unreachable at 320 x 256"
    verification: []
    human_judgment: true
    rationale: "D-OQ-3 makes these observations rather than failures, so no test gates them. VP-O2 and VP-O3 are WCAG 1.4.10 reflow concerns on a live public page. The owner should acknowledge that they join F4, F4b, F5 and F6 on the deferred list, rather than learn of them later."

duration: 28min
completed: 2026-09-12
status: complete
---

# Phase 5 Plan 08: Viewport Contract Summary

**QUAL-01 was measured on the live HAOO page and the live Products region at six widths.**

- **Overflow.** 0 elements escape the viewport on either journey, by a per-element sweep of the unmodified page. The masked and unmasked document readings are recorded separately.
- **Primary actions.** All ten primary actions (P1–P10) are reachable, named, enabled and at least 44 × 44 at every width.
- **Mobile navigation.** Both mobile toggles track their own state.
- **Missing media.** Both journeys keep their text, actions and layout when their media is unavailable.
- **Out of scope.** Three new ZERO-PAPER HUB defects outside the Products region are recorded and handed forward, not failed.

## Performance

- **Duration:** 28 min
- **Started:** 2026-09-11T21:29:55Z
- **Completed:** 2026-09-11T21:58:13Z
- **Tasks:** 3 of 3
- **Files:** 6 created, 1 modified

## Accomplishments

- **VC-1, three readings, never collapsed.**
  - Of the 12 width-and-surface pairs, 0 had an in-scope escapee.
  - Forcing `overflow-x: visible` changed no document reading on either site, so the HAOO root wrapper's mask conceals nothing.
  - On S3 the sweep found the hero's decorative circles escaping at every width, yet VC-1c still read equal to `clientWidth`. The hero section clips on both axes (`App.tsx:265`), and `overflow-x: visible` computes to `auto` there. This is recorded in the evidence file as the reason VC-1b, not VC-1c, carries the result.
- **VC-2, the closed list.**
  - P1–P8 are all rendered at every width. The smallest box across every instance and width is 150 × 44 (P3).
  - P9 is 171 × 44.
  - P10 is reached through the desktop nav at 768 and up, and through the keyboard-operated toggle below that. Its toggle is a named tab stop of 44 × 44.
  - The S1 measurement disclosure's summary is 188 × 48 to 428 × 44, depending on width.
  - Every other interactive element on S1 measures at least 44 × 44, so none is below the 24 floor.
- **VC-3.** Six state-flip tables are recorded: `false`/`true`/`false`, `hidden` present/absent/present, and the toggle names flipping `Open …` to `Close …` and back.
- **Media-absent states.** Aborting the HAOO logo, hero and preview images leaves the recovery copy and both brochure actions intact. Aborting the card's cross-origin image leaves the name, relationship, outcome, audience lead and `https://www.haoo.online/` hand-off intact, and the featured grid holds.
- **Handed forward.**
  - VP-O1: hero decoration clipped by its section.
  - VP-O2: the hero column escapes by 14 px at 320.
  - VP-O3: at 320 × 256, `Values`, `Contact` and `Get Started` in the ZERO-PAPER HUB mobile menu sit at 291–439 px in a 256 px viewport inside a `fixed` header, and cannot be reached.

## Task Commits

1. **Task 1: Measure horizontal overflow three ways at every width, on both live surfaces**: `61270e6` (feat)
2. **Task 2: Assert every primary action is reachable and hit-targetable, and that mobile navigation tracks its own state**: `aa87f3c` (feat)
3. **Task 3: Record the viewport evidence with its measured values**: `26f1a8e` (docs)

**Plan metadata:** recorded in the close-out commit (docs: complete plan)

## Files Created/Modified

- `e2e/viewport.e2e.ts`: the viewport contract. It runs 40 live tests and skips on the preview project, which has no deployed referent.
- `e2e/fixtures/overflow.ts`: `collectViewportEscapees` accepts an optional `regionSelector` and annotates escapees with `insideRegion`. It throws if the region is missing. Unscoped output is unchanged.
- `evidence/viewport-overflow.json`, `evidence/viewport-primary-actions.json`, `evidence/viewport-mobile-nav.json`, `evidence/viewport-media-absent.json`: the 40 machine records from one full run.
- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-VIEWPORT.md`: the evidence, summarised in integers.

## Decisions Made

See `key-decisions` above. The two with the most consequence:

- **Region attribution is a shared-helper option.** The acceptance criteria forbid an inline element walk in the spec. D-OQ-3 requires telling in-region escapees from out-of-scope ones. The helper was the only place both could hold, and the zoom spec inherits the same attribution.
- **The document-width bound is extended only by out-of-scope reach.** The document readings are asserted everywhere, and any excess must be explained by content the sweep attributed to outside the Products region.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The shared sweep could not attribute an escapee to the Products region**
- **Found during:** Task 1
- **Issue:** `collectViewportEscapees` returned tag, id and class only. Task 1 requires escapees outside the Products container to be out-of-scope observations, but the spec may not walk elements itself.
- **Fix:** Added an optional `{ regionSelector }` to the shared helper. Each escapee gets `insideRegion` only when attribution is requested, and a missing region throws rather than reporting every finding as out of scope.
- **Files modified:** `e2e/fixtures/overflow.ts`, which is outside this plan's `files_modified`
- **Verification:** Typecheck 0. The 12 VC-1 tests pass. S1 records carry no `insideRegion` key.
- **Committed in:** `61270e6`

**2. [Rule 1 - Bug] The first draft skipped VC-1a and VC-1c on S3 at every width**
- **Found during:** Task 1, reading the first run's records before committing
- **Issue:** The draft asserted the document readings on S3 only when nothing out of scope escaped. The hero decoration escapes at every width, so no document-width assertion ever ran on S3, which breaks "three assertions per width per surface".
- **Fix:** Both readings are now asserted unconditionally against `max(clientWidth, outOfScopeReachPx) + 1`, and the bound is recorded in each record's detail.
- **Verification:** Re-ran Task 1. 12 of 12 pass, and every S3 reading equals `clientWidth`, inside the strict bound.
- **Committed in:** `61270e6` (fixed before the first commit)

**3. [Rule 1 - Bug] VC-3 failed the run on ZERO-PAPER HUB header entries outside the Products region**
- **Found during:** Task 2, first full run: 39 of 40 passed. S3 VC-3 at 320 × 256 failed.
- **Issue:** The spec held every revealed menu link to the 44 px and pointer checks on both sites. On S3 only P10 and its opener are in scope. The ZERO-PAPER HUB header is outside the Products region, so D-OQ-3 makes the other entries observations.
- **Fix:** On S3 the revealed links are split into in-scope (P10, vacuity-guarded) and out-of-scope observations, which are recorded with their defects. Readings now also carry `top`, `bottom` and `innerHeight`, so the observation is measurable. They are not asserted, because D-OQ-2 forbids an above-the-fold check.
- **Verification:** The full run passes 40 of 40 with no retries, and the three unreachable entries are recorded as VP-O3.
- **Committed in:** `aa87f3c`

### Documented divergences from plan text (no weakening)

- **VC-3 widths.** The plan says "the two mobile widths". VC-3 also runs at 320, which sits below the same `md` breakpoint. It also runs on S3's toggle, because that toggle is P10's opener. Both are additional measurement.
- **Commit shape.** Tasks 1 and 2 edit one file. Task 1 was committed as the VC-1-only version of the spec, and Task 2 added the rest. `evidence/viewport-overflow.json` was regenerated by Task 2's full run, so every committed evidence file holds exactly one run of the final spec. Task 1's own run stays in `61270e6`.

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs), plus 2 documented divergences.
**Impact on plan:** Deviation 2 restores an assertion the draft had silently dropped. Deviation 3 applies D-OQ-3 exactly as the plan states it, while P10 and its opener stay fully asserted. There was no scope creep, and no finding was removed.

## Issues Encountered

- **The first full run failed one test, and the failure was a real finding.** At 320 × 256, three ZERO-PAPER HUB menu entries cannot be scrolled into view, because the menu lives in a `fixed` header. It is recorded as VP-O3, not suppressed.
- **Warnings from the IDE's markdown checker.** It raised MD060 table-spacing warnings on the evidence file. Markdown lint is not a project gate, so they were left alone.

## Known Stubs

None. The only `test.skip` in the spec is the conditional guard that makes the spec not applicable on the preview project.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- **Zoom spec.** It can call `collectViewportEscapees(page, { regionSelector: PRODUCTS_REGION_SELECTOR })` for S3 and inherit the same attribution. VC-1c's two-axis-clip limit (05-EVIDENCE-VIEWPORT.md §1) applies to it too.
- **Future ZERO-PAPER HUB phase.** It inherits VP-O1, VP-O2 and VP-O3 beside F4, F4b, F5 and F6. VP-O3 is the one with a visitor-facing consequence today.
- **Plan 05-14 or a later fixture pass.** It may want to correct the P5 and P6 `accessibleName` and `instances` pairing in `primary-actions.ts`.
- **Requirements.** `requirements-completed` copies QUAL-01 verbatim. `requirements.ready-ids` reports 0/1 ready, because sibling plans that also declare QUAL-01 are unfinished. The shared-ID gate therefore leaves it open, and this plan does not mark it complete.

## Gate Baseline

| Gate | Result |
|------|--------|
| `npm run typecheck` | 0 |
| `npm run lint` | 0 |
| `npm test` | 0, with 684 tests across 10 files |
| `npm run verify:disjoint` | 0, with 26 shared / 26 allowlist / 0 violations |
| `npx playwright test --project=live e2e/viewport.e2e.ts` | 0, 40 passed, 0 retried |

## Self-Check: PASSED

- All six created files exist on disk, and the modified helper is committed.
- Commits `61270e6`, `aa87f3c` and `26f1a8e` are in `git log`.
- The Task 1, Task 2 and Task 3 `<verify>` commands each exited 0 on the committed files.
- Every integer in 05-EVIDENCE-VIEWPORT.md was read from the committed records.

---
*Phase: 05-prove-the-deployed-journey*
*Completed: 2026-09-12*
