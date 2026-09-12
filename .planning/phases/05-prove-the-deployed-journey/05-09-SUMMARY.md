---
phase: 05-prove-the-deployed-journey
plan: 09
subsystem: testing
tags: [playwright, e2e, keyboard, focus, wcag22, accessibility, evidence]

requires:
  - phase: 05-05
    provides: "The fixture layer: SURFACES, VIEWPORTS, PRIMARY_ACTIONS, PRODUCTS_REGION_SELECTOR, recordEvidence and the vacuity guard"
  - phase: 05-04
    provides: "FOCUS_SOURCES widened to seven under D-OQ-4, so the static contrast gate this spec defers to measures every focus-bearing component"
  - phase: 05-03
    provides: "The live Playwright project against www.haoo.online and live URLs for the ZERO-PAPER HUB surfaces"
provides:
  - "e2e/keyboard.e2e.ts: 25 live tests covering KF-1 (order, script-focus exclusions, termination, reversibility), KF-2 (a painted indicator at every stop), KF-3 (the skip link) and KF-4 (the non-modal brochure panel), at the six closed widths on S1, plus the Products region on S3 and the invalid form state"
  - "Five evidence records: keyboard-traversal (6), keyboard-script-focus (7), keyboard-skip-link (6), keyboard-products-region (6), keyboard-brochure (6)"
  - "05-EVIDENCE-KEYBOARD.md: the two-owner boundary, the ordered stop list with per-stop indicator outcome, integer counts per width, and three recorded observations (KB-O1 to KB-O3)"
  - "A runtime indicator test stricter than the UI-SPEC's literal rule: a non-empty indicator needs a non-transparent colour, and the visible part must be added by focus"
affects: [05-12, 05-14, 05-17, "future ZERO-PAPER HUB accessibility phase"]

actuals:
  # chars/4 over the realized diff (base 4cc6ded). Authored: spec 63875 + evidence file 20580 = 84455 (21114).
  # Generated evidence JSON: 413659 + 29632 + 16647 + 13909 + 8343 = 482190 (120548).
  # Reported at its true value rather than trimmed toward the 27000 estimate: the traversal record
  # carries 40 stops x 6 widths with a before-and-after style pair each, and that is most of the total.
  tokens: 141662
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Drive focus only with real key presses, and snapshot every focus candidate's computed style immediately BEFORE each Tab press, so the element that receives focus has an unfocused before-reading without any scripted focus"
    - "Identify stops by DOM position rather than by matching a name list, so a known naming gap in the fixtures cannot distort a traversal count"
    - "Bound every traversal by a press limit and treat a repeated DOM position as a cycle, so a focus trap becomes a recorded failure instead of a hung run"
    - "Probe reversibility inline: Shift+Tab then Tab at sampled stops, and once from outside the document, so the exit is proven to be re-enterable"
    - "Record an un-actionable third-party limit with its key sequence and resting place, and let the run continue"

key-files:
  created:
    - e2e/keyboard.e2e.ts
    - evidence/keyboard-traversal.json
    - evidence/keyboard-script-focus.json
    - evidence/keyboard-skip-link.json
    - evidence/keyboard-products-region.json
    - evidence/keyboard-brochure.json
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-KEYBOARD.md
  modified: []

key-decisions:
  - "A non-empty focus indicator requires a non-transparent colour, not merely outline-width > 0. Tailwind's outline-none compiles to `2px solid transparent`, which satisfies the UI-SPEC's literal rule while painting nothing — measured live on five ZERO-PAPER HUB controls."
  - "The visible indicator must be ADDED by focus: a box-shadow layer present after focus and not before, or an outline that became visible or changed. A drop shadow that was already painted cannot stand in for a focus ring."
  - "Reverse traversal on S1 is sampled (first stop, every fifth stop, and from outside the document — 8 probes per width), not taken from every stop. The narrowing is named in the evidence file rather than left implicit in the planner assumption."
  - "The invalid form state is driven on the live page, which FS-0 permits because validation is client-side, with formsubmit.co routed to abort and attempts counted (0) so no lead could be delivered even if validation regressed."
  - "The embedded viewer's outcome is recorded, not asserted. In headless Chromium it renders its child fallback and never takes focus, so this run evidences the built-in PDF viewer's keyboard behaviour in NEITHER direction."

patterns-established:
  - "A focus indicator is proven by a computed-style change under real keyboard modality, never by a declared class; the declared ratio stays owned by the static suite and the boundary is written into the spec header"

requirements-completed: [QUAL-02]

coverage:
  - id: D1
    description: "Tab order equals DOM order on the live HAOO page: 0 elements with tabindex > 0, 0 order violations, and strictly increasing DOM positions across 40 stops (768/1280/1440) and 36 stops (320/360/390)."
    requirement: QUAL-02
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/keyboard.e2e.ts (6 KF-1/KF-2 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every sequential stop paints a visible focus indicator under keyboard modality: 40 of 40 and 36 of 36 indicated at all six widths, measured as a computed-style change with a non-transparent colour that focus added."
    requirement: QUAL-02
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/keyboard.e2e.ts (6 KF-1/KF-2 tests)"
        status: pass
      - kind: other
        ref: "05-09-PLAN.md Task 2 <verify> static check: all four computed properties captured, opener protection asserted"
        status: pass
    human_judgment: false
  - id: D3
    description: "Traversal terminates and reverses: the last stop is the last footer link (DOM 461) at every width, the next Tab leaves the document, 0 cycles, and 8 reverse probes per width plus one from outside the document all return to their origin (0 defects)."
    requirement: QUAL-02
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/keyboard.e2e.ts (6 KF-1/KF-2 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The four script-focus destinations are not sequential tab stops. The honeypot (tabindex -1, DOM 254) is absent from the default traversal at all six widths; the error-summary container (tabindex -1, DOM 255) is absent from a 47-stop pass in the invalid state, reached by keyboard with 0 provider attempts."
    requirement: QUAL-02
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/keyboard.e2e.ts (6 KF-1 tests + the invalid-state test)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The skip link is the first tab stop at every width, becomes a 150 x 19.59 box at (16, 16) fully inside the viewport on focus, and on activation moves the document to #haoo-content with the next Tab landing inside main and not back in the header."
    requirement: QUAL-02
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/keyboard.e2e.ts (6 KF-3 tests)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The brochure panel is asserted as the non-modal component it is: both actions are adjacent sequential stops in both layout branches, the open action carries target=_blank, rel=noopener and the (opens in a new tab) disclosure inside its accessible name, activating either leaves the other present and enabled, and 0 dialog roles and 0 overlays exist before or after activation."
    requirement: QUAL-02
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/keyboard.e2e.ts (6 KF-4 tests)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Inside the Products region: 1 stop (Explore HAOO -> https://www.haoo.online/), indicated, in DOM order, reversible, with 0 positive tab indexes. 05-EVIDENCE-KEYBOARD.md records the two owners, the ordered stop list and the integer counts."
    requirement: QUAL-02
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/keyboard.e2e.ts (6 S3 tests)"
        status: pass
      - kind: other
        ref: "05-09-PLAN.md Task 3 <verify> grep: observation, D-OQ-3 and focus-contrast present"
        status: pass
    human_judgment: false
  - id: D8
    description: "Three recorded observations handed forward: KB-O1 five live ZERO-PAPER HUB contact controls paint no focus indicator at all, KB-O2 the embedded PDF viewer never received focus in headless Chromium, KB-O3 the Products page has no main landmark and no bypass mechanism."
    verification: []
    human_judgment: true
    rationale: "D-OQ-3 makes KB-O1 and KB-O3 observations rather than failures, so no test gates them; KB-O1 is a live WCAG 2.4.7 concern stronger than the F4 it extends, and the owner should acknowledge it joining the deferred list rather than learn of it later. KB-O2 cannot be settled by any automated run in this stack: headless Chromium has no PDF viewer, so the built-in viewer's keyboard behaviour is unproven in either direction and only a human on a PDF-capable browser can observe it."

duration: 23min
completed: 2026-09-12
status: complete
---

# Phase 5 Plan 09: Keyboard and Focus Contract Summary

**QUAL-02's keyboard half was measured on the live HAOO page: tab order equals DOM order, every one of the 40 stops paints a real focus ring, the header is bypassable, and no stop is a trap.**

- **Order.** 0 elements carry a positive tab index; DOM positions increase strictly across every traversal at all six widths.
- **Indicators.** 40 of 40 stops (desktop) and 36 of 36 (mobile) change their computed style on keyboard focus and paint a visible ring.
- **Termination.** Every traversal ends on the last footer link and leaves the document; the exit is reversible.
- **Bypass.** The skip link is the first stop, becomes visible in-viewport at every width, and lands focus inside `main`.
- **Brochure.** Asserted as non-modal, with opener protection and the new-tab disclosure inside the accessible name.
- **Recorded, not failed.** Five ZERO-PAPER HUB controls that paint no indicator at all, and an embedded viewer this stack cannot exercise.

## Performance

- **Duration:** 23 min
- **Started:** 2026-09-11T22:03:12Z
- **Completed:** 2026-09-11T22:26:52Z
- **Tasks:** 3 of 3
- **Files:** 7 created, 0 modified

## Accomplishments

- **KF-1, order and termination.**
  - 0 elements with `tabindex > 0` anywhere in the document, at every width.
  - 0 order violations: tab order equals DOM order, measured rather than assumed.
  - The opening sequence matches the UI-SPEC for each layout branch: nine stops at `md` and up (skip link, parent link, five section links, hero message, hero call), five below it (the toggle replaces the five section links).
  - Every traversal ends on DOM 461, the last footer link, and the next press leaves the document. 0 cycles.
  - 8 reverse probes per width plus one from outside the document, 0 defects. Shift+Tab from outside the document returns to the last stop and Tab leaves again.
- **KF-2, painted indicators.** Every stop changes all four captured properties and gains a visible ring. The ring arrives in `box-shadow`; every stop computes `outline-color: rgba(0, 0, 0, 0)`, which is why the transparent-colour correction below mattered.
- **KF-1 script-focus destinations.** The honeypot (DOM 254) and, in the invalid state, the error-summary container (DOM 255) both carry `tabindex="-1"` and appear in no traversal. The invalid state was reached by keyboard with 0 requests to the provider.
- **KF-3, the skip link.** First stop at all six widths; `32 × 24` and `sr-only` before focus, `150 × 19.59` at `(16, 16)` on focus, fully inside the viewport even at 320 × 256; activation sets `#haoo-content` and the next Tab lands inside `main`.
- **KF-4, the brochure panel.** Both actions are adjacent stops (18 and 19 on desktop) in both layout branches. `target="_blank"` and `rel="noopener"` hold at every width, the accessible name ends with `(opens in a new tab)`, and each action leaves the other present, enabled and unchanged. 0 dialog roles, 0 overlays.
- **Handed forward.** KB-O1 (five unindicated ZERO-PAPER HUB controls), KB-O2 (the embedded viewer), KB-O3 (no `main`, no bypass on the Products page).

## Task Commits

1. **Task 1: Assert traversal order, the script-focus exceptions, and termination** — `d01d531` (feat)
2. **Task 2: Prove a focus indicator is painted at every stop, the skip link works, and the brochure panel is not modal** — `5d7e65d` (feat)
3. **Task 3: Record the traversal evidence and the division of labour with the static gate** — `253a72a` (docs)

**Plan metadata:** recorded in the close-out commit (docs: complete plan)

## Files Created/Modified

- `e2e/keyboard.e2e.ts` — the keyboard contract. 25 live tests; skips on the preview project, which has no deployed referent.
- `evidence/keyboard-traversal.json` — 6 records, one per width: every stop with its before-and-after style pair.
- `evidence/keyboard-script-focus.json` — 7 records: the default state at six widths plus the invalid state.
- `evidence/keyboard-skip-link.json`, `evidence/keyboard-products-region.json`, `evidence/keyboard-brochure.json` — 6 records each.
- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-KEYBOARD.md` — the evidence, in integers, with observations kept apart from assertions.

## Decisions Made

See `key-decisions` above. The two with the most consequence:

- **A transparent outline is not an indicator.** The UI-SPEC's literal test is `outline-width > 0`. Tailwind's `outline-none` compiles to `2px solid transparent`, so that test passes on an element painting nothing — which is precisely what five live ZERO-PAPER HUB controls do. Requiring a non-transparent colour is what let the spec see them.
- **Recorded is not passed, and is not failed either.** The embedded viewer never took focus in headless Chromium because there is no PDF plugin, so the branch that would record a trap never ran. The evidence file says so in its own words rather than implying the viewer was cleared.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The UI-SPEC's non-empty indicator rule admits an invisible indicator**
- **Found during:** Task 2
- **Issue:** KF-2 defines a non-empty indicator as `box-shadow !== 'none'` **or** `outline-width > 0`. Measured on the live ZERO-PAPER HUB contact form: `outline: 2px solid rgba(0, 0, 0, 0)` with every box-shadow layer transparent. That satisfies the rule while painting nothing, so the check would have reported an indicator on a control that has none.
- **Fix:** A visible `box-shadow` layer now requires a non-transparent colour and a non-zero length, and a visible outline requires style, width **and** a non-transparent colour. Additionally the visible part must be *added* by focus, so an already-painted drop shadow cannot stand in for a focus ring.
- **Files modified:** `e2e/keyboard.e2e.ts`
- **Verification:** With the correction, 40 of 40 HAOO stops still pass and the five ZERO-PAPER HUB controls are correctly identified as unindicated (KB-O1). Without it, those five would have been reported as indicated.
- **Committed in:** `5d7e65d`

**2. [Rule 1 - Bug] A type error in the harness that the live run could not catch**
- **Found during:** Task 2
- **Issue:** `popup.waitForLoadState('commit')` is not in the type's accepted union. The live run passed anyway, because Playwright transpiles without type-checking — exactly the gap `tsconfig.e2e.json` was created to close. `npm run typecheck` exited 2.
- **Fix:** Replaced with a bounded wait that reads the popup URL directly and waits at most 5 s on an uncommitted `about:blank`, which also cannot hang when a PDF popup becomes a download.
- **Verification:** `npx tsc --noEmit -p tsconfig.e2e.json` exits 0; the full spec re-run passes 25 of 25.
- **Committed in:** `5d7e65d`

**3. [Rule 1 - Bug] The brochure record contradicted itself about the new tab**
- **Found during:** Task 2, reading the first full run's records before committing
- **Issue:** The record held `openActivated: true` beside `popupUrl: "no new browsing context observed"`. The popup's `url()` returned an empty string because headless Chromium turns the PDF into a download, and the empty string was being rendered as the "nothing happened" fallback. A reader would have had to choose which half to believe.
- **Fix:** The empty case now records what was actually observed: a new browsing context opened, and the harness could not observe its URL because the PDF became a download.
- **Verification:** The committed record reads that sentence at all six widths, with `openActivated: true`.
- **Committed in:** `5d7e65d`

### Documented divergences from plan text (no weakening)

- **Reverse traversal is sampled on S1.** The planner assumption says "a reverse traversal from each stop". What runs is the first stop, every fifth stop, and the exit — 8 probes per width. On the Products region it is every in-region stop. The narrowing is stated in 05-EVIDENCE-KEYBOARD.md §2.6 rather than left implicit.
- **The invalid state is measured at one width.** Which elements are tab stops is a DOM property, not a layout one, so the error-summary test runs at 1280 only. It takes a complete 47-stop pass from document start rather than sampling.
- **Commit shape.** Tasks 1 and 2 edit one file. Task 1 was committed as the order-and-termination version; Task 2 added indicator capture, the skip link, the brochure panel and the Products region. All five evidence files come from one run of the final spec, so no committed record was produced by intermediate code.
- **Two script-focus destinations are covered elsewhere, by name.** The confirmation and failure headings render only in states FS-0 forbids on the live page. They are named in the evidence file as the preview-target form-state spec's responsibility (UI-SPEC KF-5).

---

**Total deviations:** 3 auto-fixed (1 missing critical, 2 bugs), plus 4 documented divergences.
**Impact on plan:** Deviation 1 is the difference between this spec seeing a real defect and reporting a false clean. Deviations 2 and 3 were caught before the committed run, so no evidence record carries them. No assertion was weakened and no finding was dropped.

## Issues Encountered

- **The first full run passed 25 of 25, which is the moment to distrust a suite.** The records were digested before committing: stop counts (40/36), probe counts, exit-probe landings and the invalid-state pass were checked to be non-vacuous, and two record-level defects (deviations 2 and 3) were found that way rather than by the run failing.
- **One figure in the evidence file was wrong on first writing.** "9 stops before the Products region" was carried over from an exploratory probe; the committed records say 4 below `md` and 10 at `md` and up. Corrected before the Task 3 commit.
- **Markdown checker warnings.** The IDE raised MD060 table-alignment warnings on the evidence file. Markdown lint is not a project gate, and 05-08 left the same class of warning alone.

## Known Stubs

None. The only `test.skip` in the spec is the guard that makes it not applicable on the preview project, which has no deployed page to traverse.

## Threat Flags

None. No file in this plan adds network surface, auth path or schema. T-05-38 (reverse tabnabbing) and T-05-41 (traversal denial of service) are both asserted at every width; T-05-39 (repudiation of the painted result) is strengthened beyond the plan by the transparent-colour correction; T-05-40 (the embedded viewer) is recorded with its key sequence and resting place.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- **Requirements.** `requirements-completed` copies QUAL-02 verbatim from the plan. Eight plans in this phase declare QUAL-02 and four still lack summaries (05-09 excepted: 05-12, 05-14, 05-17), so `requirements.ready-ids` reports 0 of 1 ready. The shared-ID gate leaves QUAL-02 open and this plan does not mark it complete.
- **05-12 / 05-17.** The form-state spec owns KF-5: where focus lands after each transition, and the painted state of the four script-focus destinations after a *scripted* focus. This plan deliberately measures neither, and names them as that spec's work.
- **05-14.** Inherits KB-O2 beside R-1 from 05-07 if it reviews un-actionable limits.
- **Future ZERO-PAPER HUB phase.** Inherits KB-O1 and KB-O3 beside F4, F4b, F5, F6 and VP-O1 to VP-O3. KB-O1 is the one with a visitor-facing consequence today: a keyboard visitor filling in that contact form cannot see which field they are in.

## Gate Baseline

| Gate | Result |
|------|--------|
| `npm run typecheck` | 0 |
| `npm run lint` | 0 |
| `npm test` | 0, with 684 tests across 10 files |
| `npm run verify:disjoint` | 0, with 26 shared / 26 allowlist / 0 violations |
| `npx playwright test --project=live e2e/keyboard.e2e.ts` | 0, 25 passed, 0 retried |

## Self-Check: PASSED

- All seven created files exist on disk.
- Commits `d01d531`, `5d7e65d` and `253a72a` are in `git log`, and none of them deleted a tracked file.
- Both Task `<verify>` commands and the Task 3 greps exit 0 against the committed files.
- Every integer in 05-EVIDENCE-KEYBOARD.md was read from the committed records, and the one figure that was not is corrected.

---
*Phase: 05-prove-the-deployed-journey*
*Completed: 2026-09-12*
