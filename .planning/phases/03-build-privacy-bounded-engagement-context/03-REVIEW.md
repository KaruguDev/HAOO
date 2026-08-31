---
phase: 03-build-privacy-bounded-engagement-context
reviewed: 2026-08-31T13:05:30Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - README.md
  - src/components/BrochurePanel.tsx
  - src/components/MeasurementDisclosure.tsx
  - src/components/OnboardingChoices.tsx
  - src/components/QualifyForm.tsx
  - src/components/qualify-form.logic.ts
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
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-08-31T13:05:30Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

The five findings recorded in `03-REVIEW-FIX.md` are implemented: qualification-start tracking now filters configured controls, the measurement facade is recreated for a new product, brochure preview tracking requires both load and visibility, outbound-link tests suppress navigation, and form logic was extracted from the component module. ESLint, TypeScript checking, the production build, and the 161 scoped tests all pass.

The re-review nevertheless found two correctness defects outside those regression cases. Changing the product does not reset state held by the stateful product children, which can carry private answers and interaction guards into the next product. Separately, each measurement facade writes its cached context without reconciling browser-storage changes made by another tab, so valid visit and interaction state can be lost or resurrected. The extracted logic module is also absent from the source-boundary and genericity test inventories.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Product switching preserves the previous product's private form and preview state

**Classification:** BLOCKER
**File:** `src/pages/ProductPage.tsx:231-262`
**Related:** `src/components/BrochurePanel.tsx:44-49`, `src/components/QualifyForm.tsx:141-171`
**Issue:** The measurement facade now rebinds when `product.measurement` changes, but `BrochurePanel` and `QualifyForm` remain the same React component instances because neither is keyed by product identity. Their `useState` and `useRef` values therefore survive a product rerender. Answers entered for product A remain in the controls for product B and can be submitted to product B's endpoint; an in-flight A request can also resolve into B-branded success or failure UI. `startRecordedRef`, `previewRecorded`, `previewFailed`, and the disclosure clear status similarly suppress or misattribute B interactions. The new rebind test switches products before touching the form, so it does not expose this leak.
**Fix:** Remount every product-scoped state boundary when the slug changes, preferably by extracting a keyed page body or, at minimum, keying both stateful children:

```tsx
<BrochurePanel
  key={product.slug}
  brochure={product.brochure}
  // ...
/>

<QualifyForm
  key={product.slug}
  qualify={product.qualify}
  // ...
/>
```

Add a rerender regression that enters a distinctive answer, records qualification start and preview state for the first product, switches products, and proves the second form is blank, emits its own start/preview events, and cannot display the first request's terminal state.

### CR-02: Cached measurement instances overwrite newer context from other tabs

**Classification:** BLOCKER
**File:** `src/measurement/index.ts:256-266`
**Related:** `src/measurement/index.ts:301-304`
**Issue:** Each facade reads storage once during initialization and thereafter reduces interactions against its private `context` cache. With two tabs, tab B can initialize a newer visit context, then tab A writes its older ordinal and flags; a later B interaction writes B's stale flags and erases A's interaction. The same path can reintroduce pre-clear flags after another tab removes the record. This makes the disclosed browser context incorrect and makes the clear action unreliable across an ordinary multi-tab visit.
**Fix:** Reconcile the latest valid stored record before every persistent reduction, and synchronize or invalidate the cache on `storage` events. If the key was removed, reduce from a fresh context rather than the stale cached record. Keep this reconciliation identifier-free and add a two-facade `MemoryStorage` regression that proves interleaved flags are retained, ordinals never move backwards, and a removal cannot restore old flags.

## Warnings

### WR-01: The extracted logic module is outside the static source-boundary inventories

**Classification:** WARNING
**File:** `src/test/build-output.test.ts:101-119`
**Related:** `src/test/product-shell-reuse.test.tsx:27-37`, `src/test/qualify-form.test.tsx:919-923`
**Issue:** `qualify-form.logic.ts` now owns payload construction, validation, provider-label policy, and form constants, but it is not listed in `PRODUCT_SOURCE_BOUNDARY`, `GENERIC_PRODUCT_SOURCES`, or the form's local generic-source check. The extraction therefore creates an unscanned production module where storage, analytics, network/provider coupling, or a hard-coded product name could be introduced while all three architectural tests remain green.
**Fix:** Add `src/components/qualify-form.logic.ts` to `PRODUCT_SOURCE_BOUNDARY` with `FULL_BOUNDARY`, and add it to both generic-source inventories. Add an assertion that the inventories cover every production `QualifyForm` dependency intended to remain product-generic so a future extraction cannot silently escape the guard again.

---

_Reviewed: 2026-08-31T13:05:30Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
