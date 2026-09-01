---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
reviewed: 2026-09-01T19:43:43Z
depth: standard
files_reviewed: 29
files_reviewed_list:
  - .gitignore
  - README.md
  - eslint.config.js
  - package.json
  - scripts/generate-haoo-report.mjs
  - scripts/verify-phase4-coverage.mjs
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
  - src/reporting/query-provenance.ts
  - src/reporting/render.ts
  - src/reporting/stats-response.ts
  - src/test/build-output.test.ts
  - src/test/fixtures/haoo-report-cli-fetch-preload.mjs
  - src/test/fixtures/plausible-preload-contract.ts
  - src/test/haoo-report.test.ts
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

# Phase 04: Code Review Report

**Reviewed:** 2026-09-01T19:43:43Z
**Depth:** standard
**Files Reviewed:** 29
**Status:** issues_found

## Summary

The completed gap work fixes the previously reported preload contract, response-provenance, temporary-file cleanup, and setup-documentation defects. The current implementation still permits a public build variable to select any HTTPS JavaScript origin despite treating origin spoofing as mitigated, and it can return a live analytics sink even when the required opt-out initialization never ran. The report writer also contains a POSIX-only path parser that breaks the documented local command on Windows.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 (BLOCKER): Analytics configuration accepts executable JavaScript from any HTTPS origin

**Classification:** BLOCKER

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/products/haoo.ts:63-85`

**Issue:** `resolvePlausibleScriptSrc` checks only URL syntax, HTTPS, credentials, query/fragment absence, and a `.js` suffix. It never verifies the origin. Consequently, `https://attacker.example/payload.js` is accepted and later appended to the product page. That script executes with the first-party page's privileges and can read form values, DOM content, storage, and any other browser-visible data. This directly contradicts threat T-04-19's claim that a tampered build variable cannot load an arbitrary origin; the tests at `src/test/measurement.test.ts:536-556` cover malformed URLs but never an unapproved HTTPS host.

**Fix:** Fail closed to an explicitly approved origin (and, ideally, an approved path family) before returning the value. Keep the allowlist in deployment-controlled non-secret configuration if the literal cannot live under `src/`, but validate the candidate against that independently trusted value rather than trusting the same script URL wholesale. For example:

```ts
function resolvePlausibleScriptSrc(
  configuredValue: string | undefined,
  approvedOrigin: string | undefined,
): string {
  const url = new URL((configuredValue ?? '').trim());
  const origin = new URL((approvedOrigin ?? '').trim()).origin;

  if (url.protocol !== 'https:' || url.origin !== origin) return '';
  if (url.username || url.password || url.search || url.hash) return '';
  if (!url.pathname.endsWith('.js')) return '';
  return url.href;
}
```

Add a regression test proving a structurally valid `.js` URL on another origin is rejected, and update the threat-register assertion so its claimed mitigation is executable.

### CR-02 (BLOCKER): A missing or throwing initializer still yields a live event sink

**Classification:** BLOCKER

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/measurement/plausible.ts:90-92,134-150`

**Issue:** `ensureProvider` returns any pre-existing function unchanged. The caller then invokes `init` with optional chaining, swallows any initialization exception, and unconditionally returns a sink. If another snippet has already defined `window.plausible` without `init`, or its initializer throws, the adapter still appends the managed script and forwards events even though `autoCapturePageviews: false` was never established. That can enable the automatic capture the privacy contract explicitly opts out of and can duplicate the explicit `haoo_page_view`. The initialization-order test supplies a cooperative mock that always has a successful `init`; it does not exercise either fail-open branch.

**Fix:** Establish the preload global and its options before appending the script, and return `undefined` unless initialization is known to have succeeded. Do not treat optional or failed initialization as usable configuration:

```ts
const provider = ensureProvider(scope);
if (typeof provider.init !== 'function') return undefined;

try {
  provider.init({ domain: providerScript.domain, autoCapturePageviews: false });
} catch {
  return undefined;
}

appendProviderScript(documentRef, providerScript.src);
return (event) => {
  try { scope.plausible?.(event); } catch { /* isolated */ }
};
```

Add tests for a pre-existing callable without `init` and for a throwing `init`; both must append no script and return no sink while leaving the local journey operational.

## Warnings

### WR-01 (WARNING): Report output directory extraction is POSIX-only

**Classification:** WARNING

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/reporting/generate.ts:97-100,243-248`

**Issue:** `directoryOf` searches only for `/`. The CLI constructs `OUTPUT_PATH` with Node's platform-native `resolve`, so on Windows it produces backslashes. `directoryOf` then returns an empty string, skips `mkdirSync`, and a first report run fails when `.reports` does not already exist. The owner-facing `npm run report:haoo` command is documented as a local process and is not documented as Linux-only.

**Fix:** Use Node's platform-aware `dirname` at the CLI boundary, or inject a directory operation/path adapter rather than hand-parsing separators. For example, pass `dirname(OUTPUT_PATH)` into the generator and call `mkdirSync` on it. Add a unit test with a Windows-style destination such as `C:\\project\\.reports\\haoo-funnel-report.html` and assert the `.reports` directory is created before temporary-file reservation.

---

_Reviewed: 2026-09-01T19:43:43Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
