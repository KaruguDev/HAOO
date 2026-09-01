---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
reviewed: 2026-09-01T09:11:51Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - .gitignore
  - README.md
  - eslint.config.js
  - package.json
  - scripts/generate-haoo-report.mjs
  - src/components/MeasurementDisclosure.tsx
  - src/components/QualifyForm.tsx
  - src/components/qualify-form.logic.ts
  - src/measurement/index.ts
  - src/measurement/plausible.ts
  - src/pages/ProductPage.tsx
  - src/products/copy.ts
  - src/products/engagement-summary.ts
  - src/products/haoo.ts
  - src/products/types.ts
  - src/reporting/generate.ts
  - src/reporting/haoo-report.ts
  - src/reporting/render.ts
  - src/reporting/stats-response.ts
  - src/test/build-output.test.ts
  - src/test/haoo-report.test.ts
  - src/test/measurement-page.test.tsx
  - src/test/measurement.test.ts
  - src/test/product-shell-reuse.test.tsx
  - src/test/qualify-form.test.tsx
findings:
  critical: 2
  warning: 2
  info: 0
  total: 4
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-09-01T09:11:51Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

The provider adapter does not implement Plausible's current preload initialization contract, so the configuration intended to disable automatic pageviews is not available to the loaded script. The report generator also labels returned counts with requested periods without validating the response's echoed query. Two operational gaps remain around failed report writes and the undocumented required site identifier.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 (BLOCKER): Plausible initialization is queued as an event instead of stored as script options

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/measurement/plausible.ts:93-99`

**Issue:** The preload stub implements `init` by calling `stub('init', options)`, which appends `['init', options]` to `plausible.q`. Plausible's current site-specific snippet uses a separate options slot (`plausible.o`) for initialization; the queue is for tracking calls. When the configured script loads after this stub, it therefore cannot read `autoCapturePageviews: false` from the documented location. The likely outcomes are an unintended automatic pageview plus the explicit `haoo_page_view`, and an `init` custom-event-shaped queue entry. This breaks both the truthful counts and the privacy promise that automatic capture is disabled. The test at `src/test/measurement.test.ts:628-639` enshrines the same invented queue shape instead of exercising the vendor contract. See Plausible's official current snippet in its [proxy setup guide](https://plausible.io/docs/proxy/guides/apache) and the documented [`plausible.init()` options](https://plausible.io/docs/script-extensions).

**Fix:** Add the vendor options slot to the global shape and make the stub mirror the official bootstrap contract:

```ts
export interface PlausibleGlobal {
  (...args: unknown[]): void;
  q?: unknown[];
  o?: PlausibleInitOptions;
  init?: (options?: PlausibleInitOptions) => void;
}

stub.init = (options) => {
  stub.o = options;
};
```

Update the preload test to expect `scope.plausible?.o` to contain the options and `q` to contain only actual event calls. Also add a contract fixture copied from the official snippet so future tests cannot drift back to an invented provider API.

### CR-02 (BLOCKER): Report counts are not checked against the period/site echoed by the provider

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/reporting/generate.ts:136-161`

**Issue:** `queryRange` validates only `results`; it never confirms that `body.query` describes the requested site, metrics, dimensions, filters, or date range. The caller then labels those counts with its locally requested dates at lines 210-219. A stale proxy response, provider regression, or wrong injected response can therefore produce a fully “validated” report whose numbers belong to a different range or site. For the all-time response, `resolvedStartDay` also accepts impossible or future dates because it checks only the first ten characters against a digit pattern. This contradicts the module's fail-closed trust-boundary contract and can generate factually false owner reports.

**Fix:** Validate the echoed query before accepting counts. For bounded ranges, normalize the two returned ISO timestamps to calendar days and require exact equality with `range.start` and `range.end`; for all-time, validate both dates by ISO round-trip and require the end day to equal the report day. Also require the echoed `site_id`, metric, dimension, and goal filter to match the request. Return `null` on any mismatch and add tests for a wrong range, wrong site, impossible date, and future start.

## Warnings

### WR-01 (WARNING): A failed final rename leaves a newly written temporary report behind

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/reporting/generate.ts:251-266`

**Issue:** The code writes `${outputPath}.tmp` and catches a failing `renameSync`, but the catch does not remove the temporary file. The comment that “Nothing was written” is false for rename failures and partial write failures. A permissions or filesystem error can leave a fresh business-data report beside the previous report indefinitely. The existing rejection test fails before any filesystem write and uses an in-memory filesystem while checking the real path, so it does not cover this branch.

**Fix:** Add a cleanup capability (`rmSync`/`unlinkSync`) to `ReportFs`, track the temporary path, and remove it with `force: true` when generation fails after the write begins. Add a filesystem test whose `renameSync` throws and assert that the previous destination remains byte-identical and the sibling `.tmp` is absent.

### WR-02 (WARNING): The owner-facing setup guide omits a required report variable

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/README.md:95-103`

**Issue:** The CLI refuses to run unless both `PLAUSIBLE_STATS_API_KEY` and `PLAUSIBLE_SITE_ID` are set (`scripts/generate-haoo-report.mjs:27-34`), but the README documents only the API key. Following the documented setup therefore always exits with the generic failure sentence, and the owner has no documented way to distinguish the missing site ID from a bad key or network failure.

**Fix:** Document `PLAUSIBLE_SITE_ID`, state that it must exactly match the Plausible site's configured domain, and include a non-secret invocation example that supplies both variable names without example credentials. Update the missing-configuration error to identify which variable names are absent without printing their values.

---

_Reviewed: 2026-09-01T09:11:51Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
