---
phase: 01-discover-haoo-and-choose-an-onboarding-path
plan: 06
subsystem: ui
tags: [accessibility, wcag, tailwind, react, vitest, focus-indicator, scroll-margin]

# Dependency graph
requires:
  - phase: 01-discover-haoo-and-choose-an-onboarding-path
    provides: "01-03 OnboardingChoices assisted-vs-self panels and their focus utility strings"
  - phase: 01-discover-haoo-and-choose-an-onboarding-path
    provides: "01-04 ProductsSection featured HAOO card and the #products landmark"
  - phase: 01-discover-haoo-and-choose-an-onboarding-path
    provides: "01-05 Phase 1 contract suite (44 tests) the gap fix must not disturb"
provides:
  - "Executable WCAG 2.2 SC 1.4.11 focus-contrast contract over all five Phase 1 product sources"
  - "White focus ring on the navy onboarding panels, 14.06:1 against #18275F (was 2.21:1)"
  - "96px/128px scroll margin on the #products anchor target so it clears the fixed home header"
  - "Component assertion pinning the reserved scroll margin"
affects: [phase-02, phase-05, accessibility, focus-management, anchor-navigation]

# Actuals (#2632)
actuals:
  tokens: 5684
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Source-text accessibility contracts: scan component source for utility-class colour pairings and compute the WCAG ratio in the test, rather than trusting review"
    - "Anchor-target scroll margin (scroll-mt-*) on the target element instead of global scroll-padding-top on html"

key-files:
  created:
    - src/test/focus-contrast.test.ts
  modified:
    - src/components/OnboardingChoices.tsx
    - src/components/ProductsSection.tsx
    - src/test/products-section.test.tsx

key-decisions:
  - "On a dark surface the light element of the focus pair is the ring, not the offset — UI-SPEC line 255 (visible on navy) governs over the light-offset default in line 174"
  - "The focus-contrast gate compares the raw IEEE-754 double with ratio >= 3, no epsilon and no pre-comparison rounding; rounding is display-only in failure messages"
  - "An unrecognized ring colour token throws rather than being skipped, so an unmeasurable colour fails loudly instead of passing silently"
  - "Scroll offset is reserved with scroll-mt on the #products target, not scroll-padding-top on html, because html is shared with the product document whose own header is not fixed"

patterns-established:
  - "Focus-indicator contrast is a suite-level contract, not a review item: any future sub-3:1 focus pairing in a Phase 1 product source fails the build"
  - "A source-scanning contract asserts a non-zero extraction count so a broken extractor cannot pass a file vacuously"

requirements-completed: [PROD-01, PROD-03, ONBD-04]

coverage:
  - id: D1
    description: "Every focus indicator declared in a Phase 1 product source contrasts at 3:1 or better against the surface it sits on, enforced as an executable contract over all five sources"
    requirement: "PROD-03"
    verification:
      - kind: unit
        ref: "src/test/focus-contrast.test.ts#keeps every focus indicator in <source> visible against the surface it renders on"
        status: pass
      - kind: unit
        ref: "src/test/focus-contrast.test.ts#gates on the unrounded double at exactly 3:1, with no epsilon"
        status: pass
      - kind: unit
        ref: "src/test/focus-contrast.test.ts#fails on an unrecognized ring colour token instead of skipping it"
        status: pass
    human_judgment: false
  - id: D2
    description: "The dark-panel `Start with HAOO` focus ring is white on #18275F, measuring 14.06:1, replacing the 2.21:1 accent-on-navy pairing recorded as the failed must-have in 01-VERIFICATION.md"
    requirement: "ONBD-04"
    verification:
      - kind: unit
        ref: "src/test/focus-contrast.test.ts#rejects the sub-3:1 accent-on-navy pairing and accepts the white-on-navy replacement"
        status: pass
      - kind: unit
        ref: "src/test/focus-contrast.test.ts#keeps every focus indicator in src/components/OnboardingChoices.tsx visible against the surface it renders on"
        status: pass
    human_judgment: false
  - id: D3
    description: "Tabbing to `Start with HAOO` in the opening (navy hero) and closing (navy) onboarding panels shows a clearly visible focus indicator in a real browser"
    requirement: "ONBD-04"
    verification: []
    human_judgment: true
    rationale: "Backstop truth carried forward from 01-VERIFICATION.md human_verification[1]. The computed 14.06:1 ratio proves the colour pairing; whether the rendered ring reads as clearly visible against the navy and is distinguishable from the unfocused white button border is a browser-rendering judgment jsdom cannot make."
  - id: D4
    description: "The `#products` anchor target reserves 96px of scroll margin below md and 128px at md and above, so activating the home `Products` navigation entry lands the heading below the fixed header"
    requirement: "PROD-01"
    verification:
      - kind: unit
        ref: "src/test/products-section.test.tsx#lands the Products heading below the fixed home header rather than behind it"
        status: pass
      - kind: other
        ref: "grep -n 'scroll-padding' src/index.css (no match — fix stays scoped to the anchor target)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Clicking `Products` in the home primary navigation at >=768px leaves the `Products` heading fully visible below the fixed header in a real browser, in both the scrolled and unscrolled header states"
    requirement: "PROD-01"
    verification: []
    human_judgment: true
    rationale: "Backstop truth carried forward from 01-VERIFICATION.md human_verification[0] (CR-03). jsdom has no layout engine and no scroll behavior, so the class is asserted but the resulting scroll position cannot be observed."
  - id: D6
    description: "Every previously passing Phase 1 assertion still passes untouched — the fix changes only ring and offset colour tokens and one section className"
    verification:
      - kind: unit
        ref: "npx vitest run (53 passed; haoo-page 19, haoo-content 6, build-output 10 unchanged from HEAD; products-section 9 -> 10)"
        status: pass
      - kind: other
        ref: "npm run typecheck && npm run lint && npm run build"
        status: pass
    human_judgment: false

# Metrics
duration: 7 min
completed: 2026-08-29
status: complete
---

# Phase 01 Plan 06: Focus Contrast and Products Anchor Gap Closure Summary

**White focus ring on the navy onboarding panels at 14.06:1 (was 2.21:1), enforced by a new source-scanning WCAG contract over all five Phase 1 product sources, plus a 96px/128px scroll margin on the `#products` anchor target.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-08-29T18:45:50Z
- **Completed:** 2026-08-29T18:52:12Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- Closed the one **failed** must-have in `01-VERIFICATION.md` (`gaps[0]`): `focusDark` in `OnboardingChoices.tsx` paired `focus-visible:ring-[#4054C6]` with `focus-visible:ring-offset-[#18275F]` — the panel's own background — computing 2.21:1 against the 3:1 WCAG 2.2 SC 1.4.11 floor. The ring colour is now `focus-visible:ring-white`, computing 14.06:1.
- Turned that fix into a standing gate: `src/test/focus-contrast.test.ts` parses the string and template literals of all five Phase 1 product sources, pairs every `focus:`/`focus-visible:` ring colour with the offset colour declared beside it (falling back to Tailwind's `#ffffff` default), and fails the suite on any pairing below 3:1 or on a ring colour equal to its offset.
- Closed the statically-reproduced CR-03 anchor overlap (`human_verification[0]`): the home `#products` section now carries `scroll-mt-24 md:scroll-mt-32`, clearing the fixed home header at every measured breakpoint and scroll state.
- Suite grew 44 → 53 with zero edits to any existing assertion; typecheck, lint, and build all exit 0.

## Task Commits

1. **Task 1 (RED): failing WCAG focus-indicator contrast contract** — `dbf0172` (test)
2. **Task 1 (GREEN): navy `Start with HAOO` focus ring made WCAG-visible** — `b09962e` (fix)
3. **Task 2: reserve fixed-header space above the Products anchor target** — `7a03d39` (fix)

_Task 1 is a `type="tracer" tdd="true"` task: the RED commit precedes the implementation commit, and the RED run named `src/components/OnboardingChoices.tsx` with a computed ratio of 2.21:1._

## Files Created/Modified

- `src/test/focus-contrast.test.ts` — **created.** WCAG relative-luminance and contrast-ratio helpers computed in doubles with no intermediate rounding; `resolveRingColor` (throws on an unrecognized token); a comment- and escape-aware literal scanner; `extractFocusPairs`; per-source cases over the five product sources plus three pure-function cases (real-colour pairing, gate boundary, unrecognized token).
- `src/components/OnboardingChoices.tsx` — **1 line.** `focusDark` ring colour `#4054C6` → `white`. `focus-visible:outline-none`, `ring-2`, `ring-offset-2`, and `ring-offset-[#18275F]` all retained verbatim.
- `src/components/ProductsSection.tsx` — **1 line.** `scroll-mt-24 md:scroll-mt-32` appended to the `<section id={PRODUCTS_SECTION_ID}>` className; `bg-white py-12 md:py-16` unchanged.
- `src/test/products-section.test.tsx` — one added test inside the existing `Phase 1 Products discovery navigation contracts` describe block, plus `PRODUCTS_SECTION_ID` added to the existing registry import. No existing assertion edited.

## Decisions Made

- **On navy, the light element of the focus pair is the ring, not the offset.** `01-UI-SPEC.md` line 174 specifies "a 2px accent ring with a 2px light offset"; line 255 requires indicators to remain visible on navy. On a `#18275F` panel the accent ring cannot satisfy line 255, so the pattern inverts to light-ring/panel-offset. This is an adaptation of the spec to the surface it explicitly names, not a deviation from it.
- **The gate is `ratio >= 3` on the raw double** — no epsilon, no rounding before the comparison; `toFixed(2)` is used only inside failure messages. Asserted directly: 2.99 and 2.999 fail, 3 and 3.01 pass.
- **An unrecognized colour token throws.** `resolveRingColor` never returns a sentinel and the scan never skips a pairing it cannot measure, so adding a new named Tailwind ring colour forces an explicit `RING_COLOR_TOKENS` entry rather than silently dropping out of coverage.
- **The extraction count is asserted non-zero per file**, so a future refactor that breaks the literal scanner fails loudly instead of passing every file vacuously.
- **`scroll-mt` on the target, not `scroll-padding-top` on `html`.** `html` is shared with the product document, whose header is not fixed and whose sections already declare `scroll-mt-4`; a global rule would push those anchors by an offset they do not need.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Test count reconciled against the plan's own artifact and behavior specs**

- **Found during:** Task 1 (focus-contrast contract authoring)
- **Issue:** The plan's `<verification>` block predicts "the HEAD count plus the two tests this plan adds" (46). That count is internally inconsistent with the same plan's `<artifacts_this_phase_produces>`, which specifies "per-source cases **and** one pure-function boundary case" (≥6 in this file alone), and with `<behavior>`, which mandates a case proving "a ring or offset colour token the resolver does not recognize fails the test ... it is never skipped."
- **Fix:** Implemented the artifact/behavior spec, which is the more specific and testable of the two. `focus-contrast.test.ts` contributes 8 tests (5 per-source + real-colour pairing + gate boundary + unrecognized token); `products-section.test.tsx` contributes 1. Final suite: 53, not 46.
- **Files modified:** `src/test/focus-contrast.test.ts`
- **Verification:** `npx vitest run` → 53 passed. Per-file counts for `haoo-page` (19), `haoo-content` (6), and `build-output` (10) are byte-identical to HEAD, confirming no existing test was disturbed by the larger count.
- **Committed in:** `dbf0172`

---

**Total deviations:** 1 auto-fixed (1 missing critical).
**Impact on plan:** The suite is larger than the `<verification>` prose predicted and exactly as large as `<artifacts_this_phase_produces>` and `<behavior>` require. No scope creep: every added case is named by the plan.

### Notes on bounded edits

- `src/test/products-section.test.tsx`'s registry import line was extended with `PRODUCTS_SECTION_ID`. The plan forbids editing "any existing assertion in that file"; an import is not an assertion, and all nine pre-existing tests pass unchanged.
- The working tree carried a pre-existing uncommitted `.planning/STATE.md` edit and untracked `.gsd/` and `.planning/milestone.lock` when this executor started. These are orchestrator artifacts, out of this plan's scope, and were not touched by any task commit.

## Prohibition Compliance

- **PROHIB-A11Y-01** (MUST NOT reach green by weakening the contract, narrowing its source list, removing a ring utility, or suppressing a visible focus indicator): honoured. `FOCUS_SOURCES` lists all five product sources named by the plan; `MIN_FOCUS_CONTRAST` is 3; no ring utility was removed — `focus-visible:ring-2` and both offset utilities survive verbatim. The only change is a compliant colour pairing. The prohibition remains **descriptor-less and flagged for human review**, as the plan records.
- **PROHIB-ONBD-01** (MUST NOT obscure that the self-onboarding action leaves ZERO-PAPER HUB): honoured. The task commit touched exactly one line (line 12, a constant), leaving line 52's disclosure — `Opens {selfOnboardingDisplay} outside ZERO-PAPER HUB.` — and the `ArrowUpRight` affordance untouched. Structural parity between the assisted and self actions (D-09/D-10) is unchanged: the self action is still outlined, and the WhatsApp action is still the sole filled accent. Remains **flagged for human review**.

## Issues Encountered

None. RED reproduced the verifier's finding exactly on the first run (2.21:1, naming `src/components/OnboardingChoices.tsx`), and GREEN passed on the first attempt.

A mutation check was run on Task 2 to satisfy its third acceptance criterion: removing `scroll-mt-24` from the section className fails the new test and only that test; the file was restored before commit.

## Known Stubs

None. No stubs, TODOs, FIXMEs, skipped tests, or unrun `<verify>` commands were introduced. Every `<verify><automated>` command in both tasks was executed and exits 0.

## Deferred Human Verification

Two **backstop** truths from this plan (D3, D5 above) require real-browser observation and are carried into end-of-phase UAT, per `workflow.human_verify_mode: end-of-phase`:

1. Tabbing to `Start with HAOO` in the opening and closing navy panels shows a clearly visible focus indicator.
2. Activating `Products` at ≥768px leaves the `Products` heading fully visible below the fixed header, in both scrolled and unscrolled header states.

Separately, this plan's `<deferred_human_verification>` block enumerates three layout-engine items that **Phase 1 does not claim** and this plan does not close. They stay open in `01-VERIFICATION.md` with **Phase 5** (QUAL-01 / QUAL-03) named as owner, and the phase re-verifier must keep reporting them as human-needed:

| ID | Item | Owner |
|---|---|---|
| `DEFER-HV-PDF-EMBED` | `human_verification[2]` — inline PDF embed vs. branded fallback across the `lg` split | Phase 5, SC 2 (QUAL-03) with SC 1 (QUAL-01) |
| `DEFER-HV-REFLOW` | `human_verification[3]` — 320px width and 200% zoom reflow with no horizontal scroll or hidden action | Phase 5, SC 1 (QUAL-01) and SC 2 (QUAL-03) |
| `DEFER-HV-CARD-SPLIT` | `human_verification[4]` — featured card 5/7 split balance at lg+ and mobile stacking order | Phase 5, SC 1 (QUAL-01) |

## User Setup Required

None — no external service configuration required. No dependencies were added, no npm scripts changed, and no public assets were published.

## Next Phase Readiness

- The failed WCAG must-have from `01-VERIFICATION.md` is closed with a measured 14.06:1 indicator and a reusable contract that fails the suite on any future sub-3:1 focus pairing in a Phase 1 product source.
- The CR-03 anchor overlap is closed deterministically on the discovery entry point.
- Full suite green at 53/53; typecheck, lint, and build all exit 0.
- Remaining Phase 1 gap-closure plans `01-07`, `01-08`, and `01-09` are unblocked — this plan touched only two component lines and added one test file, none of which they depend on.
- Future phases adding a focus indicator to a Phase 1 product source must either use an arbitrary hex or register the named colour in `RING_COLOR_TOKENS`; an unregistered token fails the suite by design.

## Self-Check: PASSED

- `src/test/focus-contrast.test.ts` — FOUND
- `src/components/OnboardingChoices.tsx` — FOUND
- `src/components/ProductsSection.tsx` — FOUND
- `src/test/products-section.test.tsx` — FOUND
- Commit `dbf0172` — FOUND
- Commit `b09962e` — FOUND
- Commit `7a03d39` — FOUND
- `npx vitest run` — 53/53 passed
- `npm run typecheck` / `npm run lint` / `npm run build` — exit 0

---
*Phase: 01-discover-haoo-and-choose-an-onboarding-path*
*Completed: 2026-08-29*
