---
phase: 01-discover-haoo-and-choose-an-onboarding-path
plan: 02
subsystem: ui
tags: [react, vite-mpa, static-metadata, native-links, tdd]

requires:
  - phase: 01-01
    provides: Wave 0 HAOO product types and expected-red page/content/build contracts
provides:
  - Physical `/products/haoo/` Vite entry with direct-build output
  - Central exact HAOO contact and onboarding destinations
  - Outcome-led opening tracer with assisted and self-service native actions
  - Source-static canonical, Open Graph, and Twitter metadata
affects: [01-03, 01-04, 01-05, phase-1-verification]

actuals:
  tokens: 3805
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns: [physical Vite MPA entry, body-marker composition boundary, unconditional native onboarding anchors, source-static product metadata]

key-files:
  created:
    - products/haoo/index.html
  modified:
    - src/products/haoo.ts
    - src/pages/ProductPage.tsx
    - src/App.tsx
    - vite.config.ts
    - src/test/build-output.test.ts

key-decisions:
  - "Select the HAOO composition from the physical document's body marker while retaining the shared React bootstrap and avoiding a runtime router."
  - "Derive the WhatsApp URL only from fixed compile-time product data so decoded text remains byte-for-code-point equal to the approved sentence."

patterns-established:
  - "Physical product entry: nested HTML is an explicit Vite build input and owns crawler-visible metadata."
  - "Native onboarding: visible anchors render without state, handlers, storage, analytics, forms, or PDF dependencies."

requirements-completed: [PROD-02, PROD-05, PROD-06, ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05, QUAL-04]

coverage:
  - id: D1
    description: "The home-page HAOO link targets a physical nested product document emitted at dist/products/haoo/index.html."
    requirement: PROD-02
    verification:
      - kind: integration
        ref: "npm run build && test -f dist/products/haoo/index.html"
        status: pass
    human_judgment: false
  - id: D2
    description: "The source and built product documents carry exact HAOO canonical and social metadata before React executes."
    requirement: PROD-05
    verification:
      - kind: integration
        ref: "src/test/build-output.test.ts#contains exact source and built canonical/social metadata"
        status: pass
    human_judgment: false
  - id: D3
    description: "The opening product journey presents exact unconditional WhatsApp, phone, email, and self-onboarding destinations from centralized data."
    requirement: ONBD-05
    verification:
      - kind: unit
        ref: "src/test/haoo-content.test.ts#builds deterministic WhatsApp encoding that decodes with punctuation intact"
        status: pass
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#[phase1-red:page] renders the outcome-led accessible tracer"
        status: pass
    human_judgment: false

duration: 5 min
completed: 2026-08-29
status: complete
---

# Phase 1 Plan 02: Static HAOO Onboarding Tracer Summary

**Physical HAOO product routing with exact static metadata and four source-faithful native onboarding destinations driven by one typed product definition.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-08-29T09:37:45Z
- **Completed:** 2026-08-29T09:42:36Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added a physical `/products/haoo/` Vite MPA entry and a native `Explore HAOO` path from the company home page.
- Replaced Wave 0 contact placeholders with exact phone, email, WhatsApp, and self-onboarding destinations, including deterministic punctuation-preserving WhatsApp encoding.
- Rendered the outcome-led opening shell with accessible assisted-first choices and explicit external-destination language.
- Published complete static title, description, canonical, Open Graph, and Twitter metadata in both source and built HTML.

## Task Commits

Each task was committed atomically, with Task 2 using an explicit TDD RED/GREEN pair:

1. **Task 1: Prove home-to-HAOO-to-onboarding through the static stack** - `1bf4669` (feat)
2. **Task 2 RED: Strengthen the static metadata contract** - `0093aeb` (test)
3. **Task 2 GREEN: Seal direct-route and metadata contracts** - `2400ec6` (feat)
4. **Source-fidelity correction** - `1db923b` (fix)

**Plan metadata:** committed with this summary.

## Files Created/Modified

- `products/haoo/index.html` - physical product entry and complete source-static metadata.
- `vite.config.ts` - root and nested HAOO MPA inputs.
- `src/products/haoo.ts` - exact typed identity, contact facts, starter text, and derived native hrefs.
- `src/pages/ProductPage.tsx` - reusable product shell tracer with assisted and self-service choices.
- `src/App.tsx` - physical-entry composition selection plus native home-page HAOO discovery link.
- `src/test/build-output.test.ts` - exact canonical/Open Graph/Twitter source and build contract.

## Decisions Made

- Used a body data marker owned by the physical HTML entry to select the product composition through the shared bootstrap; no client router or history fallback was introduced.
- Kept every onboarding destination in `HAOO_PRODUCT`, with WhatsApp derived solely from fixed digits and the approved compile-time generic sentence.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed an unsupported security characterization**
- **Found during:** Overall source-fidelity scan after Task 2
- **Issue:** The self-onboarding helper called the external HAOO platform “secure,” a characterization not supported by the supplied brochure facts.
- **Fix:** Changed the helper to the neutral, factual “HAOO's platform” while preserving self-onboarding and external-destination clarity.
- **Files modified:** `src/pages/ProductPage.tsx`
- **Verification:** `npm run typecheck` and the focused tracer component test pass.
- **Committed in:** `1db923b`

---

**Total deviations:** 1 auto-fixed bug.
**Impact on plan:** The correction tightened source fidelity without changing architecture or scope.

## Issues Encountered

- Git index writes required the managed repository permission path; task commits then ran normally with hooks enabled.
- Vite reports the pre-existing Browserslist data-age advisory during successful builds; no dependency update was in scope.

## Known Stubs

| File | Line | Intentional stub | Resolution |
|------|------|------------------|------------|
| `src/products/haoo.ts` | 16 | Pain, benefit, capability, and journey collections remain empty after the narrow tracer. | Plan 01-03 populates and renders the brochure-faithful guided story. |
| `src/products/haoo.ts` | 35 | Brochure paths and expectation label remain explicit pending values. | Plan 01-05 publishes the original brochure assets and progressive preview. |
| `src/pages/ProductPage.tsx` | 29 | The page currently contains only the opening walking skeleton, not the later full section sequence. | Plans 01-03 and 01-05 expand the same reusable shell. |

These stubs are assigned to later Phase 1 plans and do not block this plan's physical-route, metadata, or onboarding-tracer goal.

## Authentication Gates

None.

## User Setup Required

None - no external service configuration required.

## TDD Gate Compliance

- Task 1 consumed the named Wave 0 RED contracts from commit `9ce023b` before GREEN commit `1bf4669`.
- Task 2 added RED commit `0093aeb` before GREEN commit `2400ec6`.

## Next Phase Readiness

- Plan 01-03 can populate the empty story collections and expand the established reusable product shell.
- Plan 01-04 can replace the home tracer card with the reusable zero/one/many Products collection.
- Plan 01-05 can replace pending brochure fields with the verified source assets and progressive preview.

## Self-Check: PASSED

- All six created/modified implementation and test files exist.
- Task commits `1bf4669`, `0093aeb`, `2400ec6`, and `1db923b` exist in git history.
- Focused tracer/content/build contracts, `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- `dist/products/haoo/index.html` exists and contains the exact approved canonical and metadata values.

---
*Phase: 01-discover-haoo-and-choose-an-onboarding-path*
*Completed: 2026-08-29*
