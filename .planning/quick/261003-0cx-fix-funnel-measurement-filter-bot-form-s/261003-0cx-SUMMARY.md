---
phase: quick-261003-0cx
plan: 01
status: complete
subsystem: measurement
tags: [posthog, funnel, intersection-observer, bot-filter, qualify-form]
requires:
  - closed HAOO event tuple and reduceCapture allowlist (src/measurement/, unchanged)
provides:
  - four once-per-page-load section reach events (haoo_reach_benefits/capabilities/brochure/qualify)
  - gated haoo_qualify_submit (empty honeypot, >= 3000 ms since start, latched per form instance)
affects:
  - PostHog dashboard 2092596 (reach insights and submit insight still to be updated by the orchestrator)
  - owner report Discovery stage
tech-stack:
  added: []
  patterns:
    - product-generic hook owning one IntersectionObserver with a named root-margin constant
    - analytics-only decision latched in a ref at the first validated send
key-files:
  created:
    - src/components/useSectionReach.ts
  modified:
    - src/products/types.ts
    - src/products/haoo.ts
    - src/pages/ProductPage.tsx
    - src/reporting/haoo-report.ts
    - src/reporting/generate.ts
    - src/reporting/stats-response.ts
    - src/components/qualify-form.logic.ts
    - src/components/QualifyForm.tsx
    - src/test/measurement.test.ts
    - src/test/measurement-page.test.tsx
    - src/test/product-shell-reuse.test.tsx
    - src/test/haoo-report.test.ts
    - src/test/fixtures/haoo-report-cli-fetch-preload.mjs
    - src/test/qualify-form.test.tsx
decisions:
  - Four separate reach event names rather than one event with a section property, because track takes one argument and reduceCapture builds payloads from a fixed allowlist
  - Section reach uses rootMargin '0px 0px -25% 0px' with threshold 0, so tall sections still count and bottom-fold peeks do not
  - Reach events map to the existing Discovery stage, so the four stage labels stay unchanged
  - The submit decision is made once, at the first validated send, and held for the form instance
metrics:
  duration: 8m
  completed: 2026-10-03
actuals:
  tokens: 13800
  tasks: 2
  commits: 3
plan_head_before: 6d9b5d9ad78dd944e058154cff515c0d232f56ea
plan_head_after: c7630817a5857c866d2925e172c223c072a2b72a
---

# Phase quick-261003-0cx Plan 01: Fix funnel measurement Summary

This plan adds four bare reach events that fire once per page load when IntersectionObserver reports a section in view. They cover Benefits, Capabilities, Brochure and Send your details, and they reach PostHog through the unchanged `before_send` allowlist. The plan also gates `haoo_qualify_submit`: it records only when the honeypot is empty and at least 3000 ms have passed since the recorded form start. That decision is made once per form instance. The FormSubmit request is unchanged.

## Tasks

| Task | Name | Commit | Key files |
|------|------|--------|-----------|
| 1 (tracer) | Section reach end to end | 98f4f46 | useSectionReach.ts, ProductPage.tsx, haoo.ts, types.ts, haoo-report.ts, tests |
| 2 (TDD RED) | Failing table for the submit gate | b704d9b | src/test/qualify-form.test.tsx |
| 2 (TDD GREEN) | Gate haoo_qualify_submit | c763081 | qualify-form.logic.ts, QualifyForm.tsx, measurement-page.test.tsx |

Tracer gate: config is interactive (`auto_advance: false`) with `human_verify_mode: end-of-phase`, and the tracer `<verify>` is automated-only. I re-ran it and it passed: typecheck, 584 targeted tests, and `git diff --quiet -- src/measurement/`. Expansion continued with no checkpoint.

## Copy for owner review (executor-drafted 2026-10-03, owed an owner read before the next deploy)

**New disclosure lines** ("How we measure this page", in tuple order directly after the page-view sentence, in `src/products/haoo.ts`):

- `haoo_reach_benefits`: That the Benefits section came into view.
- `haoo_reach_capabilities`: That the Capabilities section came into view.
- `haoo_reach_brochure`: That the Brochure section came into view.
- `haoo_reach_qualify`: That the Send your details section came into view.

**New report labels** (all under the Discovery stage, in `src/reporting/haoo-report.ts`):

- `haoo_reach_benefits`: Benefits section views
- `haoo_reach_capabilities`: Capabilities section views
- `haoo_reach_brochure`: Brochure section views
- `haoo_reach_qualify`: Send your details section views

**New Discovery clarifier:**

> Total of the page views and section views listed below. A section counts at most once per page load, and repeat views by the same browser count again.

The new label and clarifier text avoids the report's banned vocabulary (visitor, user, people, unique, session, journey, delivered, received), and the full report suite enforces this.

**Unchanged on purpose:** the `haoo_qualify_submit` disclosure sentence ("That you tried to send the qualification form after it passed the page's checks."), the report label "Validated form send attempts", the qualification clarifier and `signalBoundary` were all left as they were. All of them stay true: a recorded submit is still a validated send attempt. The gate only removes occurrences, so it errs toward under-claiming, which is the safe direction for MEAS-04 and MEAS-08.

## Implementation notes

- `useSectionReach(events, track)` returns stable refs, created once through a lazy `useState`. It keeps a `{ track, reached }` record that resets only when the `track` identity changes, which happens when a product change mints a new measurement. A StrictMode effect re-run therefore does not record a section twice. The hook constructs one observer with `{ rootMargin: SECTION_REACH_ROOT_MARGIN, threshold: 0 }`. It skips non-intersecting entries and entries with a zero ratio, unobserves each section once it is reached, and disconnects when all four are reached. Construction and observation are each wrapped in try/catch so a failure records nothing (Phase 4 gap 1 lesson).
- `ProductMeasurement.sectionReachEvents` is a required member, so a product that omits it fails typecheck. The reach names are deliberately left out of `interactionEventFlags`, so browser storage, `schemaVersion` and the emailed engagement summary are unchanged.
- `shouldRecordQualifySubmit` is pure. `QualifyForm` records `startedAtRef` with `Date.now()` on the same path that records the start event. At the first validated send, just before `fetch`, it computes the decision, sets `submitDecidedRef`, and tracks only if the decision is true. Validation-blocked and body-build-blocked attempts return before this point and never latch the decision.
- `src/measurement/`, `package.json` and `package-lock.json` are byte-identical (`git diff --quiet` exit 0). No dependency, property, scroll super-property or session recording was added.

## Follow-up owned by the orchestrator

PostHog dashboard 2092596 still needs four reach insights, plus an update to the submit insight to note that submits are now gated.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Stale comment] Updated the count word in `src/reporting/stats-response.ts`**
- **Found during:** Task 1 (grep for remaining "ten"/"eleventh" count words after the tuple change)
- **Issue:** A comment said "ten believable integers" about the report's HogQL rows. That became stale once the tuple grew to fourteen.
- **Fix:** Changed it to "fourteen". This is a comment-only change.
- **Commit:** 98f4f46

**2. [Rule 1 - Stale comment] `measurement.test.ts` CR-02 comment ("all ten first-party event names") changed to fourteen.** This is a comment-only change. Commit 98f4f46.

No other deviations. The plan's test-design choices were all carried out as written: the routing IntersectionObserver stub, cases (a), (a2), (b), (c) and (d), the `advanceClock` helper and the two new page cases.

## Verification

- `npm run lint`: exit 0.
- `npm run typecheck` (app, node and e2e projects): exit 0.
- `npm test` (`vite build`, then the full vitest suite): exit 0 on the last two consecutive runs, with 10 files and 792 tests passing.
  - Transient failure, recorded faithfully: the first `npm test` run after Task 2 failed 2 tests with "Test timed out in 5000ms". They were `product-shell-reuse.test.tsx > renders a synthetic product through every product-named shell surface` and one `measurement-page.test.tsx > provider failure isolation > renders, stays mounted…` case. That run's suite took 92 s of test time, against about 49 s on other runs, which points to transient machine load. In isolation those tests take 394 ms and about 270 ms, and both later full runs passed cleanly.
  - Before the first build, a `test:unit` run also failed `build-output.test.ts` freshness ("Run npm run build"). This is expected, because `npm test` rebuilds first.
- Done-criteria greps: `haoo_reach_` appears 12 times in haoo.ts. `shouldRecordQualifySubmit(` appears 1 time in QualifyForm.tsx. `QUALIFY_SUBMIT_MIN_ELAPSED_MS = 3_000` appears 1 time in qualify-form.logic.ts.

## TDD Gate Compliance

- RED: b704d9b `test(...)`. The 9 table cases failed because `shouldRecordQualifySubmit` and `QUALIFY_SUBMIT_MIN_ELAPSED_MS` were not yet exported.
- GREEN: c763081 `feat(...)`. All 9 pass, along with the page-level cases.
- REFACTOR: none needed.

## Known Stubs

None.

## Threat Flags

None. All new surface (the reach events crossing to PostHog, and the submit gate) is covered by T-0cx-01 to T-0cx-06 in the plan's threat model.

## Self-Check: PASSED

- FOUND: src/components/useSectionReach.ts
- FOUND: commits 98f4f46, b704d9b, c763081
