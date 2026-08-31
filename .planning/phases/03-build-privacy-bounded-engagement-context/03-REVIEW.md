---
phase: 03-build-privacy-bounded-engagement-context
reviewed: 2026-08-31T11:42:41Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - README.md
  - src/components/BrochurePanel.tsx
  - src/components/MeasurementDisclosure.tsx
  - src/components/OnboardingChoices.tsx
  - src/components/QualifyForm.tsx
  - src/measurement/index.ts
  - src/pages/ProductPage.tsx
  - src/products/copy.ts
  - src/products/haoo.ts
  - src/products/types.ts
  - src/test/build-output.test.ts
  - src/test/measurement-page.test.tsx
  - src/test/measurement.test.ts
  - src/test/product-shell-reuse.test.tsx
  - src/test/qualify-form.test.tsx
findings:
  critical: 3
  warning: 2
  info: 0
  total: 5
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-08-31T11:42:41Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

The Phase 3 measurement and disclosure implementation contains three correctness/privacy blockers. The qualification-start listener counts interaction with the measurement disclosure as form engagement; the product-generic page retains a stale measurement facade if its product prop changes; and brochure resource loading can mark a brochure as viewed without establishing that the preview was visible. Two quality defects also remain in the test/development workflow.

Typecheck passed. ESLint completed with five warnings. The focused unit/integration run passed 135 tests, but emitted repeated asynchronous jsdom navigation errors from the outbound-link tests.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: [BLOCKER] Privacy-disclosure interaction is recorded as qualification-form engagement

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/components/QualifyForm.tsx:618-623`

**Issue:** `handleQualifyStart` is attached to the entire form through bubbling `onFocus` and `onChange`, while `MeasurementDisclosure` is rendered inside that form at lines 691-698. Clicking or keyboard-focusing the disclosure summary therefore emits `qualify_start` and sets `qualifyStarted`, even when the visitor has not interacted with any qualification field. Focusing the clear button can also send the false event to a configured provider immediately before the local clear action runs. This contradicts the disclosed signal, “That you started the qualification form,” and makes a privacy control itself produce unrelated engagement telemetry.

**Fix:** Scope start detection to actual qualification controls and exclude the honeypot and disclosure controls. For example, pass the focus/change event to a guard that calls `handleQualifyStart()` only when the target is a configured `input`, `select`, or `textarea` field name. Alternatively, render the disclosure outside the `<form>` while preserving its visual placement and submit-button association. Add a regression test that opens the disclosure and activates clear before touching a field, asserting that `haoo_qualify_start` is not emitted.

### CR-02: [BLOCKER] Product changes keep using the previous product's measurement instance

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/pages/ProductPage.tsx:51-64`

**Issue:** The measurement facade is created only when `measurementRef.current` is empty, and `pageViewRecorded` is never reset. If the reusable `ProductPage` is rerendered with another product or new measurement adapters, the visible page changes but every child retains the first product's storage key, event allowlist, sink, and context. The effect then tries to track the new page-view name through the old allowlist (usually returning `false`), and later interactions are likewise rejected or written to the wrong product context. This violates the component's product-generic contract and can mix measurement state across products.

**Fix:** Bind the facade lifecycle to product measurement identity (for example `storageKey`/`productKey`) and reset the one-shot page-view guard whenever that identity changes, or require the caller to key `ProductPage` by `product.slug`. Add a rerender test that switches from one product definition to another and verifies a new page view, sink, storage key, and interaction vocabulary.

### CR-03: [BLOCKER] Resource load is treated as a brochure view without proving visibility

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/components/BrochurePanel.tsx:60-86`

**Issue:** Both responsive preview resources are mounted simultaneously and call the same tracking handler from `onLoad`; Tailwind only hides one with CSS. A browser may load a CSS-hidden `<img>` or `<object>`, and an `<object>` load event establishes resource loading rather than that the user saw a usable PDF preview. The first such event sets `brochureViewed` through `src/products/haoo.ts:58`, while the disclosure tells visitors the browser remembers whether the brochure was viewed. This can persist a false engagement flag on an ordinary page load.

**Fix:** Emit the preview event only after the loaded preview is actually intersecting/visible, with separate loaded and visibility state for the active responsive representation, or stop mapping passive preview availability to `brochureViewed` and reserve that flag for deliberate Open/Download actions. Cover hidden-resource load and failed/HTTP-error object cases in browser-level tests.

## Warnings

### WR-01: [WARNING] Outbound-link tests leave asynchronous navigation errors running

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/test/measurement-page.test.tsx:293-305`

**Issue:** The tests repeatedly `fireEvent.click` real `tel:`, `mailto:`, WhatsApp, self-onboarding, and brochure anchors without cancelling navigation in the test harness. The focused suite passed but printed repeated `Not implemented: navigation (except hash changes)` errors from jsdom after the clicks. These queued errors add noise, can obscure real diagnostics, and may leak asynchronous work across test boundaries.

**Fix:** In tests that only need to verify the handler and native attributes, attach a test-only `click` listener that calls `preventDefault()` before firing the event, while continuing to assert the unchanged `href`, `target`, `download`, and application handler behavior. Keep the dedicated progressive-fragment test uncancelled where native default behavior is itself under test.

### WR-02: [WARNING] Component module violates the project's Fast Refresh lint rule

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/components/QualifyForm.tsx:46`

**Issue:** `QualifyForm.tsx` exports constants and pure helpers alongside the component at lines 46, 123, 170, 190, and 225. ESLint reports five `react-refresh/only-export-components` warnings, so edits to this large stateful form cannot rely on normal component Fast Refresh behavior during development. The file also combines rendering with validation, request construction, and provider-option policy, increasing the chance that form changes affect unrelated logic.

**Fix:** Move the exported status constants, requiredness logic, reserved-label policy, body builder, and validator into a non-component module (for example `qualify-form.ts` or `qualify-form.logic.ts`), import them into `QualifyForm.tsx`, and update tests to import the pure contracts from that module.

---

_Reviewed: 2026-08-31T11:42:41Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
