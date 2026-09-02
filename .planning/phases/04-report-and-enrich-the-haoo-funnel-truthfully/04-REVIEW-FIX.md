---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
fixed_at: 2026-09-02T19:05:55Z
review_path: .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-REVIEW.md
iteration: 2
findings_in_scope: 19
fixed: 18
already_resolved: 1
skipped: 0
status: all_fixed
---

# Phase 4: Code Review Fix Report

**Fixed at:** 2026-09-02T19:05:55Z
**Source review:** `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-REVIEW.md`
**Iterations:** 2 (iteration 1 — 2 critical + 10 warning; iteration 2 — 7 info)

**Summary (all 19 review findings, both iterations):**
- Findings in scope: 19 (2 critical, 10 warning, 7 info)
- Fixed: 18
- Already resolved by an earlier fix: 1 (IN-02, resolved by CR-02)
- Skipped: 0

| Iteration | Scope | In scope | Fixed | Already resolved | Skipped |
| --- | --- | --- | --- | --- | --- |
| 1 | `critical_warning` | 12 | 12 | 0 | 0 |
| 2 | `all` (info only; 1–12 already done) | 7 | 6 | 1 | 0 |

**Isolation:** `workflow.use_worktrees` is `false` in `.planning/config.json`, so in **both**
iterations every edit, gate run, and commit happened in the **main checkout** on `main`. No
worktree was created and no recovery sentinel was written.

**Verification environment:** all gates below ran in the main checkout, so every number here is
reproducible from the tree as it stands.

**Gates after the final fix of iteration 2 (`9095b7b`):**
- `npm run lint` — clean, exit 0
- `npm run typecheck` — clean, exit 0 (both `tsconfig.app.json` and `tsconfig.node.json`)
- `npm test` — 513 passed across 11 files, exit 0

A pre-fix baseline of the same three gates was captured before touching anything this pass
(lint 0, typecheck 0, 513/513) so that any new failure could be attributed rather than assumed
pre-existing. The counts are identical before and after: no test was added, removed, or
weakened in iteration 2 — one was **replaced** with a stronger form (see IN-06).

> Note on running the suite: `npm test` is `npm run build && vitest run`, and
> `build-output.test.ts` enforces that `dist/` is newer than every production source input.
> Running `npx vitest run` directly after an edit fails that freshness guard spuriously. Use
> `npm test`.

---

# Iteration 2 — Info findings (IN-01 … IN-07)

## Fixed Issues

### IN-01: `exactKeys` re-sorted the expected list on every key comparison

**Files modified:** `src/measurement/index.ts`
**Commit:** `ad5f331`
**Applied fix:** hoisted `const wanted = [...expected].sort();` above the `every` call, as the
review specified. The allocation-and-sort ran once per key on every stored-context read; it now
runs once per call. Behaviour is unchanged — the comparison list is fixed for the duration of the
loop, so hoisting cannot alter the result. `measurement.test.ts` (137 tests) passes unchanged.

### IN-03: The CLI fetch fixture recomputed "today" twice, leaving a midnight race

**Files modified:** `src/test/fixtures/haoo-report-cli-fetch-preload.mjs`
**Commit:** `3c1689f`
**Applied fix:** `nairobiDay()` is now called once at install time and the captured value is used
both to build the expected ranges and to construct every echoed `date_range`. A run straddling
00:00 Africa/Nairobi previously echoed a day the CLI no longer expected, which surfaced as an
intermittent fixture throw rather than as a real defect.

**Residual, deliberately not fixed:** a *narrower* window still exists between the fixture's
install-time day and the CLI's own `reportDay(generatedAt, REPORT_TIMEZONE)`, because the two are
resolved in separate processes at separate instants. Closing that would mean injecting the day
into the fixture through the environment, which changes the CLI contract the test exists to
exercise. The residual now fails with the fixture's explicit *"rejected an unexpected Stats
query"* message rather than as a confusing validation refusal, so it is diagnosable if it ever
fires.

### IN-04: `isPlainObject` was duplicated verbatim across the two response validators

**Files modified:** `src/reporting/untrusted.ts` (new), `src/reporting/stats-response.ts`,
`src/reporting/query-provenance.ts`
**Commit:** `33a79bc`
**Applied fix:** extracted the guard to a new `src/reporting/untrusted.ts` and imported it from
both validators, exactly as the review suggested. The new module's doc comment records *why* the
two copies were a hazard rather than merely redundant: both modules validate the **same** response
body from the **same** request in the **same** process under the same fail-closed rule, so a drift
between them would mean two different answers to "is this an object" for one payload. The
array-exclusion rationale (`typeof [] === 'object'`, so an array could otherwise have its numeric
keys read as fields) is documented on the function rather than being folklore in two places.

No new file was created beyond the one the review asked for. `tsconfig.node.json` and
`tsconfig.app.json` both still typecheck clean, and the CLI's runtime import graph resolves
(`./untrusted.ts` carries the explicit extension the sibling imports use).

### IN-05: `formatEngagementSummary`'s doc comment contradicted its own control flow

**Files modified:** `src/products/engagement-summary.ts`
**Commit:** `121f11a`
**Applied fix:** amended the comment, but **not** to the review's exact wording. The review
proposed *"Any failure after the configuration guard yields the authored fallback."* That is
accurate but still leaves the reader to infer that the function can throw. Since the whole point
of the finding is that the next reader will assume the function is total, the comment now says so
outright — it states that the function is deliberately not total, names `requireSummaryCopy` as
the one exit that escapes, and names the caller (`QualifyForm`'s `engagementSummary()`) that must
therefore keep wrapping the call.

Verified against the actual call graph before writing it: `ProductPage` passes
`formatEngagementSummary` to `QualifyForm` as `buildEngagementSummary`, and
`QualifyForm.engagementSummary()` wraps the invocation in a `try` that falls back to
`qualify.engagementSummary.fallback`. Comment-only change; no behaviour touched.

### IN-06: Root `.js` config files were parsed by ESLint but matched by no rule block

**Files modified:** `eslint.config.js`, `src/test/haoo-report.test.ts`
**Commits:** `6afc630` (the config), `9095b7b` (the test that guards it)
**Applied fix:** the review asked for `files: ['*.js']` with `js.configs.recommended` and
`globals.node`. Rather than add a third near-identical block, the existing Node block was widened
to `files: ['**/*.mjs', '*.js']`, which supplies the same rules and globals to the root config
modules **and** closes a gap the finding did not name: `src/test/fixtures/haoo-report-cli-fetch-preload.mjs`
is a `.mjs` module outside `scripts/**`, so it too was being parsed and checked against nothing.

Confirmed rather than assumed, at three levels:
- `eslint --print-config` now returns 61 rules for `eslint.config.js`, `tailwind.config.js`,
  `postcss.config.js`, and the `.mjs` fixture (previously 0).
- A temporary probe appended to `postcss.config.js` (`const unusedProbe = notDefinedAnywhere;`)
  now raises `no-undef` and `no-unused-vars`; the probe was reverted and `git diff` confirms the
  file is byte-identical to its committed state.
- `npm run lint` is still clean across the newly-checked files — the widened block found no
  pre-existing violations to fix.

**Test change — a pinned literal replaced, not deleted.** `haoo-report.test.ts` asserted
`expect(config).toContain("files: ['scripts/**/*.mjs']")`, so widening the glob broke it. That
assertion was only ever a *proxy* for its stated intent ("lints the credentialed script through a
dedicated ESLint block") and it would pass on a block that supplied no rules at all. It is now
replaced by an assertion of the real property, resolved through ESLint's own
`ESLint#calculateConfigForFile`: for each of the six non-browser modules, the resolved config must
supply at least one rule, must enable `no-undef`, and must declare the Node globals. This is
strictly stronger than the literal it replaced — verified by narrowing the block back to
`['scripts/**/*.mjs']`, which makes the new test fail with
*"src/test/fixtures/haoo-report-cli-fetch-preload.mjs receives no rules"*; the config was then
restored and `git diff` confirmed clean.

### IN-07: Two weak checks in the coverage auditor

**Files modified:** `scripts/verify-phase4-coverage.mjs`
**Commit:** `f56f2ae`
**Applied fix (a) — the row parse:** each line is trimmed before its delimiters are stripped, and
the strip is now `.replace(/^\|/u, '').replace(/\|$/u, '')` instead of `.slice(1, -1)`. Beyond the
review's suggestion, a wrong cell count *inside one of the three required tables* is now reported
as a malformed row instead of being skipped, which is what the finding actually asks for ("be
reported as a malformed one" rather than as missing). The malformed check is scoped to the
required headings only, so an unrelated section of `COVERAGE.md` may still shape its tables however
it likes.

**Applied fix (b) — the deferral check:** `/deferred/iu` is replaced with
`/deferred\s+processor\s+approval,\s+dashboard\s+setup,\s+and\s+deployment\s+variables/iu`, pinned
to the sentence the check means to assert and wrap-tolerant in the same style as the neighbouring
`provider selector\s+remains unset` check. The human-readable description in the error message was
updated to match.

Both halves were proven against purpose-built fixtures, run through *both* the pre-fix and post-fix
script:

| Fixture | Pre-fix script | Post-fix script |
| --- | --- | --- |
| `COVERAGE.md` with a trailing space on every table row | FAILS — *"required table is missing"* ×3 (the false negative the finding describes) | passes |
| `COVERAGE.md` whose boundary says *"completed … nothing is deferred"* | **passes** (the false positive the finding describes) | FAILS — names the missing assertion |
| `COVERAGE.md` with a 5-cell row in a required table | silently skipped | FAILS — *"malformed row with 5 cells"* |
| `COVERAGE.md` unmodified | passes, 41 capabilities / 3 tables | passes, 41 capabilities / 3 tables |

The real `COVERAGE.md` is untouched and still audits clean at 41 required capabilities across 3
tables.

## Already Resolved (no change needed)

### IN-02: The echoed timezone offset is parsed and discarded

**File:** `src/reporting/query-provenance.ts`
**Status:** resolved by iteration 1's CR-02 fix (`7e1cc0f`) — **verified against the code on disk
this pass, not taken on the previous report's word.**

Confirmed by reading the current source:
- `calendarDay` returns `{ day, offset }` (`query-provenance.ts:58-77`); the offset is captured
  from the regex group instead of being sliced away.
- `EchoedQueryProvenance.offset` carries it out (`:12`).
- It is **used**, not merely stored: `validateEchoedQuery` compares it against
  `expected.offsetMinutes` and refuses with `'timezone-mismatch'` on disagreement (`:136-144`),
  and `generate.ts:302` supplies that expectation from
  `zoneOffsetMinutes(generatedAt, REPORT_TIMEZONE)`. The one piece of evidence the finding said
  was being thrown away is now the primary detector for the CR-02 defect.

**The second half of the review's suggested fix was deliberately not applied, because it is
wrong.** The review proposed to *"thread the offset into `ReportModel.timezone`"*. A UTC offset
does not identify a timezone: `+03:00` is Africa/Nairobi, Asia/Riyadh, Europe/Moscow and others,
and it does not survive a DST boundary. `ReportModel.timezone` is rendered to the owner as
*"Reporting timezone Africa/Nairobi"* — substituting `+03:00` would replace a named zone with a
strictly weaker statement while still being an assertion the provider never made. The sound
reading of the evidence is the one iteration 1 took: keep the named constant, and use the echoed
offset to **falsify** it, so the report can no longer state a timezone the provider contradicts.
`REPORT_TIMEZONE` remains at `generate.ts:366` as the printed value, now guarded.

## Skipped Issues

None. Every one of the 7 Info findings was either fixed or verified already-resolved.

---

# Iteration 1 — Critical and Warning findings (CR-01 … WR-10)

_Recorded 2026-09-02T18:52:00Z. Reproduced here so this file is the single record for the phase;
none of this work was redone or re-verified in iteration 2 beyond the IN-02 check above and the
full gate run, which covers it._

**Gates after iteration 1:** `npm run lint` clean; `npm run typecheck` clean (both projects);
`npm test` 513 passed across 11 files — down from 761 across 21 purely because WR-06 removed the
stale `.claude/worktrees/` duplicate suites from discovery, not because coverage was lost.

### CR-01: "Clear what this page remembers" claimed a browser refusal it never attempted

**Files modified:** `src/measurement/index.ts`
**Commit:** `f2fa64e`
**Applied fix:** `clearContext` now re-resolves the storage handle via `browserStorage(adapters)`
instead of trusting a `storage` field latched to `null` by an unrelated read or write failure. It
returns `false` only when the handle is genuinely absent or when `removeItem` itself threw, and
re-latches `storage` on success. The record the page promised to delete is now actually removed
after a transient `setItem` failure, and `clearBlocked` is only rendered when the browser really
refused.

### CR-02: The report's reporting timezone was an unvalidated constant

**Files modified:** `src/reporting/query-provenance.ts`, `src/reporting/generate.ts`,
`scripts/generate-haoo-report.mjs`, `src/test/haoo-report.test.ts`
**Commit:** `7e1cc0f`
**Applied fix:** implemented the review's suggestion plus the offset capture it depended on (which
also resolves IN-02):

- `calendarDay` captures the echoed UTC offset instead of slicing it away;
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
still types as `any`: a deliberate typo (`VITE_HAOO_PLAUSIBL_DOMAIN`) left `tsc` silent. The type
system cannot close this hole, so the build-time signal the finding actually asks for was added
instead: two source-scan tests that (a) fail when any `import.meta.env.VITE_*` read in a
production source is missing from `src/vite-env.d.ts`, with a message naming the key, and (b) fail
on a declared-but-unread key. Re-running the same typo now fails the suite loudly.

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

---

## Notes for the phase owner

Three items want a human decision. None of them blocks the phase; all three are judgment calls a
fixer should not make alone.

1. **Requires human verification — WR-03's inference (carried over from iteration 1, still open).**
   `providerState: not-configured` is inferred from "every period is empty". A correctly
   configured site that has genuinely had zero traffic will read as *"not configured"*. The review
   sanctioned this inference explicitly and offered removing the metadata field as the alternative;
   the field was kept because the labels are locked UI-SPEC copy and deleting them is a spec
   change, not a code fix. Confirm the inference is acceptable, or raise a spec change to reword or
   remove the field.

2. **New in iteration 2 — the coverage auditor is now stricter than it was.**
   `verify-phase4-coverage.mjs` throws on any row inside one of the three *required* tables that
   does not have exactly three cells. This is what makes a malformed row diagnosable instead of
   silently re-reported as missing, but it means that if a required table ever legitimately gains
   or loses a column, the auditor must be updated in the same commit. Tables outside the three
   required headings are unaffected.

3. **Orphan worktree from phase 03 (carried over, still present).**
   `.claude/worktrees/rf-03-retry-1788205465` and its branch `gsd-reviewfix/03-retry-1788205465`
   are still on disk, with a stale recovery sentinel at
   `.planning/phases/03-build-privacy-bounded-engagement-context/.review-fix-recovery-pending.json`.
   WR-06's fix neutralises their effect on `npm test` and `git add -A`, but the worktree and branch
   themselves are untouched — they belong to phase 03's run, not this one. Clean up with
   `git worktree remove <path> --force && git branch -D gsd-reviewfix/03-retry-1788205465` and
   delete the sentinel, after confirming the branch holds nothing still wanted.

---

_Fixed: 2026-09-02T19:05:55Z_
_Fixer: Claude (gsd-code-fixer)_
_Iterations: 1 (2026-09-02T18:52:00Z) and 2 (2026-09-02T19:05:55Z)_
