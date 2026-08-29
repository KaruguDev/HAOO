---
phase: 01-discover-haoo-and-choose-an-onboarding-path
plan: 09
subsystem: ui
tags: [progressive-enhancement, noscript, onboarding, security-contracts]
requires:
  - phase: 01-08
    provides: trustworthy build-output and full-suite contract
provides:
  - No-JavaScript access to assisted, self-service, and brochure destinations
  - Centralized-data equality checks for source and built fallback links
  - Region-scoped unsafe-markup enforcement
affects: [accessibility, onboarding, product-document, phase-5]
actuals:
  tokens: 1112
  tasks: 2
  commits: 1
tech-stack:
  added: []
  patterns: [noscript progressive enhancement, source-and-build destination binding]
key-files:
  created: []
  modified: [products/haoo/index.html, src/test/build-output.test.ts]
key-decisions:
  - "Developer selected noscript-fallback at the blocking-human checkpoint."
  - "The fallback duplicates only reviewed destinations and is contract-bound to HAOO_PRODUCT in source and build output."
patterns-established:
  - "Static fallback regions are extracted non-vacuously and scanned independently from the scripted document."
requirements-completed: [ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05]
coverage:
  - id: D1
    description: All assisted, self-onboarding, and brochure destinations are available in source and built no-script markup
    requirement: ONBD-05
    verification:
      - kind: integration
        ref: src/test/build-output.test.ts#publishes centralized onboarding destinations without requiring JavaScript
        status: pass
    human_judgment: false
  - id: D2
    description: The no-script region contains no script, event handler, form, inline style, or campaign tracking markup
    requirement: ONBD-05
    verification:
      - kind: unit
        ref: src/test/build-output.test.ts#keeps the no-script fallback free of active or tracked markup
        status: pass
    human_judgment: false
  - id: D3
    description: A real browser with JavaScript disabled presents working fallback links and enabled JavaScript presents one onboarding set
    requirement: ONBD-05
    verification: []
    human_judgment: true
    rationale: JavaScript-disabled rendering and native link activation require real-browser UAT.
duration: 2 min
completed: 2026-08-29
status: complete
---

# Phase 01 Plan 09: No-Script Onboarding Summary

**The physical HAOO document now preserves every reviewed onboarding route when JavaScript is unavailable**

## Performance

- **Duration:** 2 min
- **Started:** 2026-08-29T19:34:00Z
- **Completed:** 2026-08-29T19:35:52Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added a minimal `<noscript>` onboarding block before the React root with WhatsApp, phone, email, self-onboarding, and brochure links.
- Bound all fallback destinations to `HAOO_PRODUCT` across both source and built HTML, including exact WhatsApp decode and one-parameter enforcement.
- Proved the fallback rejects active or tracked markup by introducing an inline handler, observing the expected failure, removing it, and restoring all 63 tests to green.

## Task Commits

1. **Task 1: Decide JavaScript-readiness scope** - checkpoint decision, no code commit
2. **Task 2: Implement selected no-script fallback** - `7362188` (feat)

## Checkpoint Decision

- **Selected option id (verbatim):** `noscript-fallback`
- **Developer response (verbatim):** `noscript-fallback`
- **Developer-stated reason:** No additional reason was supplied with the selection.
- **Implementation rationale from the selected option:** Honor PROHIB-ONBD-02 exactly and extend the document's existing progressive-enhancement approach to the reviewed onboarding destinations.

## Files Created/Modified

- `products/haoo/index.html` - Minimal no-script identity, consultation, native actions, and outbound disclosures.
- `src/test/build-output.test.ts` - Source/build equality, WhatsApp privacy, extraction, and unsafe-markup contracts.

## Decisions Made

- Kept the fallback intentionally narrow: destinations and disclosures only, with no duplicated product story.
- Enforced exact destination equality in tests rather than introducing a build plugin to generate static HTML from TypeScript.

## Deviations from Plan

None - plan executed exactly as written for the selected branch.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

PROHIB-ONBD-02's JavaScript-readiness contradiction is closed in code. Real-browser JavaScript-disabled activation remains an end-of-phase UAT item.

## Self-Check: PASSED

- `npm test` builds and passes all 63 tests.
- Typecheck and lint pass.
- Source and built documents each contain exactly one no-script block.
- The inline-event-handler mutation failed the scoped guard before the safe version was restored.

---
*Phase: 01-discover-haoo-and-choose-an-onboarding-path*
*Completed: 2026-08-29*
