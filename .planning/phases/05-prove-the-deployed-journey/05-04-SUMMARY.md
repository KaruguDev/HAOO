---
phase: 05-prove-the-deployed-journey
plan: 04
subsystem: ui
tags: [accessibility, wcag, focus-contrast, links, vitest, jsdom, evidence]

# Dependency graph
requires:
  - phase: 05-01
    provides: HAOO as the single home for the planning record, and the HAOO checkout as the working directory for every Phase 5 plan
  - phase: 05-03
    provides: the browser evidence harness whose per-element overflow sweep is the method that closes F2
provides:
  - Both `Back to ZERO-PAPER HUB` links resolve to the parent site at https://www.zero-paperhub.com/ instead of looping the visitor back to the HAOO page
  - The jsdom assertion that was green *because* the link was wrong now pins the correct destination, moved in the same commit as the components
  - "`src/components/MeasurementDisclosure.tsx` registered in the closed FOCUS_SOURCES list (6 → 7), so its declared focus rings are measured by the existing contrast gate"
  - "`05-EVIDENCE-PREFLIGHT-FIXES.md` — the inherited record of F1/F2/F3 closed here and F4/F4b/F5/F6 measured, unfixed and deferred to a future ZERO-PAPER HUB phase"
affects: [05-05, 05-06, 05-08, future ZERO-PAPER HUB accessibility phase]

actuals:
  tokens: 4675
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A test assertion that guards a defect moves in the same commit as the fix — it is part of the fix, not collateral damage"
    - "A closed guard list is widened by registering a file, never by widening the token map or relaxing the floor; the widening records its authorising decision and the machinery left byte-unchanged"
    - "A deferred defect is recorded with its measured value and an explicit unfixed status, and its deferral is attributed to a scope decision rather than a severity judgement"

key-files:
  created:
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-PREFLIGHT-FIXES.md
  modified:
    - src/components/ProductHeader.tsx
    - src/pages/ProductPage.tsx
    - src/test/haoo-page.test.tsx
    - src/test/focus-contrast.test.ts

key-decisions:
  - "Both halves of the F1 fix (the two components and the assertion that pinned the wrong destination) landed in one commit, as the plan required — committing only the components would have left a red suite for the next reader to 'fix' by reverting a correct change"
  - "F2 is closed by measurement method with no source change: the `overflow-x-hidden` utility on both root wrappers stays exactly as shipped, and the finding is answered by VC-1's three-assertion treatment"
  - "The F6 line count is recorded as measured (4 occurrences of `hover:scale-105`) rather than as the UI-SPEC's summary (two CTAs); the discrepancy is written into the evidence file rather than smoothed over"

patterns-established:
  - "RED-before-GREEN on a defect-guarding assertion: change the assertion, observe it fail on exactly that line and nothing else, then change the source"
  - "Read-only re-measurement of a sibling repository's deferred findings, with any discrepancy against the source-of-record recorded rather than reconciled silently"

requirements-completed: [QUAL-02, QUAL-03]

coverage:
  - id: D1
    description: "Both `Back to ZERO-PAPER HUB` links resolve to https://www.zero-paperhub.com/ rather than looping back to the HAOO page"
    requirement: QUAL-02
    verification:
      - kind: unit
        ref: "src/test/haoo-page.test.tsx#renders fixed sequential semantic sections and product navigation"
        status: pass
      - kind: other
        ref: "grep -c 'https://www.zero-paperhub.com/' src/components/ProductHeader.tsx src/pages/ProductPage.tsx → 1 each"
        status: pass
    human_judgment: false
  - id: D2
    description: "There are still exactly two such links, and the footer link still renders after the `How we measure this page` link"
    requirement: QUAL-02
    verification:
      - kind: unit
        ref: "src/test/haoo-page.test.tsx#keeps navigation accessibility and all onboarding placements tied to one product"
        status: pass
      - kind: unit
        ref: "src/test/measurement-page.test.tsx#opens the disclosure from the progressive footer fragment link"
        status: pass
    human_judgment: false
  - id: D3
    description: "`src/components/MeasurementDisclosure.tsx` is inside the closed focus-source list, so its declared focus rings are measured against the unchanged 3:1 floor"
    requirement: QUAL-03
    verification:
      - kind: unit
        ref: "src/test/focus-contrast.test.ts#keeps every focus indicator in src/components/MeasurementDisclosure.tsx visible against the surface it renders on"
        status: pass
      - kind: other
        ref: "node -e FOCUS_SOURCES entry count === 7 and includes MeasurementDisclosure"
        status: pass
    human_judgment: false
  - id: D4
    description: "The gate baseline holds and the two repositories' copies of `focus-contrast.test.ts` stay divergent under the GROUND B ratification"
    verification:
      - kind: integration
        ref: "npm test → 10 files, 684 passed"
        status: pass
      - kind: integration
        ref: "npm run verify:disjoint → 26 shared / 26 allowlist / 0 violations / 3 ratified collisions, converged: 0"
        status: pass
      - kind: integration
        ref: "npm run typecheck → 0; npm run lint → 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "`05-EVIDENCE-PREFLIGHT-FIXES.md` records F1/F2/F3 as closed and F4/F4b/F5/F6 as measured, unfixed and deferred by D-OQ-3, with their measured values"
    verification:
      - kind: other
        ref: "grep for F4/F5/F6/D-OQ-3/unfixed in 05-EVIDENCE-PREFLIGHT-FIXES.md → all present"
        status: pass
    human_judgment: true
    rationale: "Greps prove the strings are present; only a human can confirm the deferred defects are framed as the owner framed them — measured and unfixed, deferred by a scope decision and never by a severity judgement — and that the transcribed figures are faithful to what a future ZERO-PAPER HUB phase will need."

# Metrics
duration: 9 min
completed: 2026-09-07
status: complete
---

# Phase 05 Plan 04: Close the In-Scope Pre-Flight Findings Summary

**Both `Back to ZERO-PAPER HUB` links now leave the HAOO origin for `https://www.zero-paperhub.com/`, the jsdom assertion that had been keeping the defect green moved with them, `MeasurementDisclosure.tsx` joined the closed focus-source list as its seventh entry, and the three ZERO-PAPER HUB defects the owner deferred are written down with their measured values.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-09-07T19:45:00Z
- **Completed:** 2026-09-07T19:53:47Z
- **Tasks:** 3
- **Files modified:** 5 (4 modified, 1 created)

## Accomplishments

- **F1 closed.** `ProductHeader.tsx` and `ProductPage.tsx` both pointed their parent-site link at `href="/"`, which was correct while HAOO lived at `zero-paperhub.com/products/haoo/` and became a self-loop the moment 04.2 gave HAOO its own origin. Both now carry the absolute parent-site URL. Nothing that checks HTTP status codes could ever have caught this — `/` on the HAOO host returns 200 and renders a valid page.
- **The guarding assertion moved with the fix, in the same commit.** `src/test/haoo-page.test.tsx:53` required `href === '/'` and was green *because* the link was wrong. It was changed first and observed failing on exactly that line (1 failed | 26 passed) before either component was touched. The count-of-two assertion at line 403 is untouched.
- **F3 closed.** `FOCUS_SOURCES` went from six entries to seven. The component's rings on a `<summary>` and a `<button>` are now measured against the same unchanged 3:1 floor as the other six; the suite went from 10 cases to 11, the extra one being the new source.
- **F2 closed by method, with no source change.** The `overflow-x-hidden` utility on both root wrappers is byte-identical to what ships. The finding is answered by VC-1's three assertions, whose load-bearing per-element sweep 05-03 already ran live (0 escapees at 360 px).
- **F4, F4b, F5 and F6 written down as inheritance.** Re-measured read-only against `../ZERO-PAPERHUB` and recorded with their values — not as a summary a future phase has to re-derive.

## Task Commits

Each task was committed atomically:

1. **Task 1: Point both parent-site links at the parent site, and move the assertion that guarded the defect** — `d8f4bea` (fix)
2. **Task 2: Register MeasurementDisclosure in the closed focus-source list** — `2d9c33b` (test)
3. **Task 3: Record the two findings closed here and the three deferred, with their measured values** — `1e64c51` (docs)

## TDD Gate Compliance

Task 1 was `tdd="true"`, and the RED gate was observed: the assertion at `haoo-page.test.tsx:53` was changed to the correct destination first, and `npx vitest run src/test/haoo-page.test.tsx` failed on exactly that assertion and nothing else before either component changed. That red is the proof the assertion had been guarding the defect.

**The RED and GREEN gates are in ONE commit, not two, and this is the plan's explicit instruction rather than a lapse.** The plan states it twice — *"Both halves land in one commit"* and *"an executor who commits only the components leaves a red suite and the next reader reverts a correct fix."* Splitting them into the conventional `test(...)` → `feat(...)` pair would have published a commit whose only content is a red suite, which is exactly the state 05-UI-SPEC F1 warns gets a correct fix reverted. The gate sequence in `git log` therefore reads `fix(05-04)` alone for Task 1; the RED observation is recorded in that commit's body and here.

## Files Created/Modified

- `src/components/ProductHeader.tsx` — header anchor destination `/` → `https://www.zero-paperhub.com/`. Class composition, accessible text, the `min-h-11` hit-target floor and the focus-ring utilities are unchanged; no `target` or `rel` was added.
- `src/pages/ProductPage.tsx` — footer anchor destination, same one-token change, same untouched surroundings.
- `src/test/haoo-page.test.tsx` — the `href` expectation for links named `Back to ZERO-PAPER HUB`. The count assertion at line 403 is untouched.
- `src/test/focus-contrast.test.ts` — `FOCUS_SOURCES` gains `'src/components/MeasurementDisclosure.tsx'` (6 → 7) plus a WIDENED history entry in the array's doc-comment, in the same idiom as the existing NARROWED one.
- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-PREFLIGHT-FIXES.md` *(created)* — F1/F2/F3 closed, F4/F4b/F5/F6 measured, unfixed and deferred.

## Decisions Made

- **Both halves of F1 in one commit.** Followed the plan's explicit instruction over the generic TDD two-commit convention, for the reason the plan gives: a components-only commit leaves a red suite that invites a revert of the correct fix.
- **F2 closed with zero source edits.** Removing `overflow-x-hidden` was never in scope; the phase boundary forbids changing shipped interactions, and the finding was always about the *measurement* being vacuous, not about the utility being wrong.
- **The F6 discrepancy is recorded, not reconciled.** `05-UI-SPEC.md` names "two CTAs" with `hover:scale-105`; the read-only re-measurement today found the literal on 4 lines (288, 433, 486, 490 — three CTA buttons and one card icon tile). The evidence file records the measured 4 and names the spec's 2, because the record-measured-values discipline means the number that gets written down is the one that was measured.
- **No token was added to `RING_COLOR_TOKENS`.** The plan pre-authorised reporting rather than widening if the run threw on an unrecognised token. It did not throw — `MeasurementDisclosure.tsx`'s ring is an arbitrary hex the extractor already handles — so the map stays byte-unchanged.

## Deviations from Plan

None - plan executed exactly as written.

The `npm test` count moved from **683 to 684**. That is not a regression of the gate baseline and not an unplanned addition: `focus-contrast.test.ts` generates one case per `FOCUS_SOURCES` entry, so registering the seventh source is precisely what the extra passing case is. All 10 test files still pass; `npm run typecheck`, `npm run lint` and `npm run verify:disjoint` all exit 0 with 26 shared / 26 allowlist / 0 violations.

## Issues Encountered

None.

## Known Stubs

None. No placeholder, hardcoded-empty or TODO-marked code was introduced; all four source edits are complete one-line or list changes.

## Threat Flags

None. The plan's register (T-05-14 through T-05-17) is unchanged by what shipped: the destination is pinned to the exact absolute URL in both components *and* in the jsdom assertion (T-05-14 mitigated — a future edit to a different host reddens the suite), no `target="_blank"` was introduced (T-05-15), and the closed-list widening records its authorising decision and the untouched machinery in the list's own doc-comment (T-05-16 mitigated — a later reader can tell a registration from a relaxation).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Both fixes land **before** the semantics and keyboard specs in wave 4 assert against them, so those specs will measure a correct page rather than pinning a defect a second time. Specifically:

- Any wave-4 spec asserting SS-3 ("names promise destinations truthfully") against the two parent-site links will now measure the corrected destination.
- Plan 05-08 inherits F2's three-assertion treatment intact; collapsing VC-1a/b/c back into one document-width check would reopen F2.
- A future ZERO-PAPER HUB accessibility phase inherits F4 (a live, public WCAG 2.2 SC 1.4.11 failure at ≈1.74:1), F4b, F5 and F6 by name, value and file location, along with the two traps: registering `App.tsx` in that repo's `FOCUS_SOURCES` will *throw* on unrecognised tokens, and adding `green-400` to the token map makes the ring measurable without making it visible.

**Not resolved here, and unchanged by this plan:** 05-02 remains parked at 1/3 awaiting the owner's DNS change (no MX records on `haoo.online`). Nothing in this plan depended on it.

## Self-Check: PASSED

- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-PREFLIGHT-FIXES.md` — FOUND on disk (207 lines)
- `src/components/ProductHeader.tsx`, `src/pages/ProductPage.tsx`, `src/test/haoo-page.test.tsx`, `src/test/focus-contrast.test.ts` — all FOUND with the stated content
- Commits `d8f4bea`, `2d9c33b`, `1e64c51` — all FOUND in `git log`
- Plan `<verification>` re-run at close-out: `npm test` exits 0 (10 files, 684 passed), `npx vitest run src/test/focus-contrast.test.ts` exits 0 with 7 registered sources, `npm run verify:disjoint` exits 0 with `converged: 0`, and the three deferred findings are recorded with measured values and an explicit unfixed status.

---
*Phase: 05-prove-the-deployed-journey*
*Completed: 2026-09-07*
