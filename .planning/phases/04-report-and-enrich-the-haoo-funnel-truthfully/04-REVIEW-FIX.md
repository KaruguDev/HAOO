---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
fixed_at: 2026-09-02T18:52:00Z
review_path: .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-REVIEW.md
iteration: 1
findings_in_scope: 12
fixed: 12
skipped: 0
status: all_fixed
---

# Phase 4: Code Review Fix Report

**Fixed at:** 2026-09-02T18:52:00Z
**Source review:** `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 12 (2 critical, 10 warning; `fix_scope: critical_warning`, so the 7 Info findings were not attempted)
- Fixed: 12
- Skipped: 0

**Isolation:** `workflow.use_worktrees` is `false` in `.planning/config.json`, so every edit,
gate run, and commit happened in the **main checkout** on `main`. No worktree was created and
no recovery sentinel was written.

**Verification environment:** all gates below ran in the main checkout, so they are
reproducible from the tree as it stands.

**Gates after the final fix:**
- `npm run lint` — clean
- `npm run typecheck` — clean (now both `tsconfig.app.json` and `tsconfig.node.json`)
- `npm test` — 513 passed across 11 files (was 761 across 21; the 248-test delta is the stale
  `.claude/worktrees/` duplicate suites that WR-06 removed from discovery, not lost coverage)

## Fixed Issues

### CR-01: "Clear what this page remembers" claims a browser refusal it never attempted

**Files modified:** `src/measurement/index.ts`
**Commit:** `f2fa64e`
**Applied fix:** `clearContext` now re-resolves the storage handle via `browserStorage(adapters)`
instead of trusting a `storage` field latched to `null` by an unrelated read or write failure. It
returns `false` only when the handle is genuinely absent or when `removeItem` itself threw, and
re-latches `storage` on success. The record the page promised to delete is now actually removed
after a transient `setItem` failure, and `clearBlocked` is only rendered when the browser really
refused.

### CR-02: The report's reporting timezone is an unvalidated constant

**Files modified:** `src/reporting/query-provenance.ts`, `src/reporting/generate.ts`,
`scripts/generate-haoo-report.mjs`, `src/test/haoo-report.test.ts`
**Commit:** `7e1cc0f`
**Applied fix:** implemented the review's suggestion plus the offset capture it depended on
(which also resolves IN-02):

- `calendarDay` now captures the echoed UTC offset instead of slicing it away;
  `EchoedQueryProvenance` carries `offset: string | null`.
- `validateEchoedQuery` returns a discriminated `EchoedQueryResult` with reason
  `'invalid' | 'timezone-mismatch'` instead of a bare `null`, so a site-timezone disagreement is
  no longer indistinguishable from a bad response.
- Two independent detectors: a **definite** one (the echoed offset disagrees with
  `REPORT_TIMEZONE`'s offset at `generatedAt`, via a new `zoneOffsetMinutes` helper) that fires on
  the *first* request at *any* hour, and a **fallback** one (an all-time end day exactly one day
  off the locally derived `today`, for providers echoing bare dates).
- `generateHaooReport` maps that reason to `timezone-mismatch:Africa/Nairobi`, and the CLI prints
  a distinct sentence naming the timezone and pointing at the site setting / `REPORT_TIMEZONE`,
  never at the API key.

The intermittent 00:00–03:00 failure window is gone: a mismatched site now fails deterministically
with a truthful, actionable diagnosis.

**Test changes:** the `validateEchoedQuery` suite was updated to the new result shape, and three
cases were added (offset disagreement in both directions; bare-day adjacency; a new
`distant stale end` row that still classifies as `invalid`).

### WR-01: Product-generic form logic hardcoded one product's email label

**Files modified:** `src/components/qualify-form.logic.ts`, `src/products/haoo.ts`,
`src/test/qualify-form.test.tsx`, `src/test/product-shell-reuse.test.tsx`
**Commit:** `3defeb5`
**Applied fix:** reserved the **shape**, not the words.

- `ENGAGEMENT_SUMMARY_LABEL` moved out of the generic module into `src/products/haoo.ts`, and out
  of `RESERVED_EMAIL_LABELS` (which is now purely provider option keys + `Source`).
- New `assertEngagementSummaryLabel(qualify)` refuses an empty label, a provider-reserved label,
  or one already claimed by a product field. `src/products/haoo.ts` calls it at module load, so a
  misconfiguration fails at import, never in front of a visitor.
- `buildSubmissionBody` re-checks the same rule instead of requiring membership in a hardcoded
  set, so a second product's own label now ships correctly rather than throwing on every submit.

**Test changes:** both product-name source scans lost their carve-outs entirely — the generic
modules now carry no product literal at all, so the reuse guard is strictly stronger than before.
Added coverage for a colliding field label, a provider-option label, and a second product's label
round-tripping into the body.

### WR-02: A configuration error was reported as an email-provider transport failure

**Files modified:** `src/components/QualifyForm.tsx`, `src/components/QualifyFallback.tsx`,
`src/components/qualify-form.logic.ts`, `src/products/copy.ts`, `src/test/qualify-form.test.tsx`
**Commit:** `12a3fc5`
**Applied fix:** the request body is assembled in its own `try` *before* any transport state is
entered. A build failure sets a new `'blocked'` `SubmissionState` and returns without touching
`inFlightRef`, so no request is claimed. Added `qualifyBlockedBody` — it names no provider and
states "nothing was sent" — and `QualifyFallback` gained an optional `body` override. The blocked
panel deliberately renders **no retry button**, because the failure is deterministic. `attempts` is
left alone (it is the invalid-submit counter that drives error-summary focus); the blocked panel
announces through the existing failure-heading focus effect.

**Test added:** renders a misconfigured product, asserts `fetch` was never called, the panel says
"nothing was sent", never says "email provider", and offers no retry control.

### WR-03: The report always asserted "Analytics provider: configured"

**Files modified:** `src/reporting/generate.ts`, `src/test/haoo-report.test.ts`
**Commit:** `a30a651`
**Applied fix:** `providerState` is now derived — `periods.every((period) => period.empty)`
selects `not-configured`, anything else selects `configured`. Because `periods` includes the
all-time window, "all empty" means the provider has never recorded a single allowlisted goal for
this site, which is the observable signal the review named. Both members of `ReportProviderState`
are now reachable.

**Test added:** an all-empty response set renders `Analytics provider: not configured` and never
`configured`.

### WR-04: The Stats API queries had no timeout

**Files modified:** `src/reporting/generate.ts`, `src/test/haoo-report.test.ts`
**Commit:** `37d7f81`
**Applied fix:** `ReportRequestInit` gained an optional `signal`, and `queryRange` wraps each
request in a 30s `AbortController` budget cleared in a `finally` (so an abort or a thrown
transport error never leaves a pending timer holding the process open). The CLI passes its `init`
straight through to `globalThis.fetch`, so no CLI change was needed. This matches the existing
`QUALIFY_REQUEST_TIMEOUT_MS` precedent in the browser path.

**Test added:** all seven requests receive an `AbortSignal`, and each is unaborted once the run
completes.

### WR-05: A leftover `.tmp` sibling bricked report generation with a misleading error

**Files modified:** `src/reporting/generate.ts`, `scripts/generate-haoo-report.mjs`,
`src/test/haoo-report.test.ts`
**Commit:** `e833d6e`
**Applied fix:** took the review's second option (distinguishable reason) rather than a per-PID
sibling, because the fixed name is a *deliberate* cross-invocation mutex documented in the source
and a unique name would silently remove it. `reserveTempSync` failures now return
`temp-path-in-use:<path>`, and the CLI prints a sentence naming the exact file to delete. The
invocation still never removes a sibling it does not own.

**Test changed:** the concurrent-loser case now pins the specific reason instead of
`generation-failed`.

### WR-06: `npm test` executed ten stale duplicate suites from `.claude/worktrees/`

**Files modified:** `.gitignore`, `vitest.config.ts`
**Commit:** `415c334`
**Applied fix:** added `.claude/` to `.gitignore` (so `git add -A` cannot commit a duplicated
source tree plus a worktree `.git` pointer) and an explicit `exclude` to the Vitest config
covering `.claude/**` and `.gsd/**` alongside the defaults it was overriding. `npx vitest list
--filesOnly` now reports 11 files, all under `src/test/`, and `git status` no longer shows
`?? .claude/`.

### WR-07: The build-time trust anchor was outside every typechecked project

**Files modified:** `tsconfig.node.json`, `package.json`
**Commit:** `fb2e94b`
**Applied fix:** `tsconfig.node.json` now includes `config`, and `npm run typecheck` runs both
projects. Verified by temporarily changing `approvedScriptSourcesForProvider`'s parameter type —
the typecheck failed inside `config/approved-analytics-script-sources.ts`, then passed again on
restore.

### WR-08: Three of four public build variables were undeclared

**Files modified:** `src/vite-env.d.ts`, `src/test/build-output.test.ts`
**Commit:** `9224f2f`
**Applied fix:** declared all four keys as the review specified — **and then found the fix alone
does not close the stated gap.** `src/vite-env.d.ts` *merges* with Vite's
`interface ImportMetaEnv { [key: string]: any }` rather than replacing it, so an undeclared key
still types as `any`: I introduced a deliberate typo (`VITE_HAOO_PLAUSIBL_DOMAIN`) and `tsc`
stayed silent. The type system cannot close this hole, so I added the build-time signal the
finding actually asks for: two source-scan tests that (a) fail when any `import.meta.env.VITE_*`
read in a production source is missing from `src/vite-env.d.ts`, with a message naming the key,
and (b) fail on a declared-but-unread key. Re-running the same typo now fails the suite loudly.

### WR-09: The measurement-disclosure DOM id was derived in three places

**Files modified:** `src/products/copy.ts`, `src/components/MeasurementDisclosure.tsx`,
`src/pages/ProductPage.tsx`, `src/test/build-output.test.ts`
**Commit:** `b1aafe1`
**Applied fix:** added `measurementDisclosureId(slug)` next to its `contentAnchorId` /
`mobileNavigationId` siblings and routed all three call sites (the `getElementById` lookup, the
footer `href`, and the `<details id>`) through it. The pinned source-literal assertion in
`build-output.test.ts` was updated to the new expression.

### WR-10: `resolvePlausibleScriptSrc` returned the raw candidate

**Files modified:** `src/products/haoo.ts`, `src/test/measurement.test.ts`
**Commit:** `dcbccaa`
**Applied fix:** returns `url.href` — the exact string every approval check ran against — so the
validated value and the value handed to `setAttribute('src', ...)` are byte-identical, and
`alreadyAppended`'s exact-string comparison sees one spelling per approved URL.

**Test changed:** the uppercase-host row now expects the normalized `SCRIPT_SRC` instead of the
raw `https://PLAUSIBLE.IO/...` input. This is the fix's intent, not a weakened assertion: the row
still proves the comparison is parsed-origin equality rather than a raw-string compare.

## Skipped Issues

None.

## Notes for the phase owner

Two things worth a human decision, neither of which was in scope:

1. **Requires human judgment — WR-03's inference.** `providerState: not-configured` is now
   inferred from "every period is empty". A correctly configured site that has genuinely had zero
   traffic will read as "not configured". The review sanctioned this inference explicitly and
   offered removing the metadata field as the alternative; I kept the field because the labels are
   locked UI-SPEC copy and deleting them is a spec change, not a code fix. Confirm the inference is
   acceptable, or raise a spec change to reword/remove the field.

2. **Orphan worktree from phase 03.** `.claude/worktrees/rf-03-retry-1788205465` and its branch
   `gsd-reviewfix/03-retry-1788205465` are still present, with a stale recovery sentinel at
   `.planning/phases/03-build-privacy-bounded-engagement-context/.review-fix-recovery-pending.json`.
   WR-06's fix neutralises its effect on `npm test` and `git add -A`, but the worktree and branch
   themselves are untouched — they belong to phase 03's run, not this one. Clean up with
   `git worktree remove <path> --force && git branch -D gsd-reviewfix/03-retry-1788205465` and
   delete the sentinel, after confirming the branch holds nothing you still want.

The 7 Info findings (IN-01 … IN-07) were out of scope for `fix_scope: critical_warning` and remain
open, **except IN-02** ("the echoed timezone offset is parsed and discarded"), which CR-02's fix
necessarily resolved — the offset is now captured, threaded through `EchoedQueryProvenance`, and
actively used to validate `REPORT_TIMEZONE`.

---

_Fixed: 2026-09-02T18:52:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
