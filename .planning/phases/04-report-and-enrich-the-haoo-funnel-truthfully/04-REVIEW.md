---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
reviewed: 2026-09-02T18:25:35Z
depth: standard
files_reviewed: 32
files_reviewed_list:
  - config/approved-analytics-script-sources.ts
  - eslint.config.js
  - .gitignore
  - package.json
  - README.md
  - scripts/generate-haoo-report.mjs
  - scripts/verify-phase4-coverage.mjs
  - src/components/MeasurementDisclosure.tsx
  - src/components/qualify-form.logic.ts
  - src/components/QualifyForm.tsx
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
  - src/vite-env.d.ts
  - vite.config.ts
findings:
  critical: 2
  warning: 10
  info: 7
  total: 19
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-09-02T18:25:35Z
**Depth:** standard
**Files Reviewed:** 32
**Status:** issues_found

## Summary

The phase adds a credentialed owner-report pipeline (`scripts/generate-haoo-report.mjs` +
`src/reporting/*`), a Plausible provider adapter behind a repository-owned approved-source
contract, and a disclosed engagement summary attached to the qualification submission.

The security-critical surfaces hold up under attack: the report renderer escapes every
interpolated value and interpolates nothing into `<style>`; provider responses are validated
structurally before a byte is written; the API key exists only in an `Authorization` header
and never reaches the document, stdout, or the browser bundle; `resolvePlausibleScriptSrc`
and `resolveQualifyEndpoint` both fail closed on origin, credential, query, fragment, and
path checks. `npm run lint` and `npx tsc -p tsconfig.app.json` are clean and all 761
discovered tests pass locally.

The defects are concentrated in three places the suites do not reach: (1) the report's
timezone and provider-state metadata are hardcoded constants presented as observed facts,
one of which can abort the whole run intermittently; (2) the privacy "clear" control can
report a browser refusal it never actually attempted, leaving the record it promised to
delete in `localStorage`; and (3) the verification substrate itself is leaky — `npm test`
executes ten duplicate suites out of an untracked `.claude/worktrees/` checkout, and the new
build-time trust anchor (`config/approved-analytics-script-sources.ts`) is outside every
project that `npm run typecheck` compiles.

## Narrative Findings (AI reviewer)

No `<structural_findings>` pre-pass was supplied with this review; all findings below are
from direct source reading, cross-file tracing, and local execution of the toolchain.

## Critical Issues

### CR-01: "Clear what this page remembers" claims a browser refusal it never attempted, leaving the record in storage

**File:** `src/measurement/index.ts:352-364` (with `src/measurement/index.ts:274`, `:295`, `:312`)
**Issue:** `writeContext`, `reconcileContext`, and `initialize` all latch `storage = null`
on any thrown storage operation. `clearContext` then short-circuits:

```ts
function clearContext(): boolean {
  const next = freshContext(config, currentDay(adapters));
  context = next;
  if (storage === null) return false;   // never calls removeItem
  ...
}
```

A single transient `setItem` failure (Safari private mode, quota pressure, an extension
throwing on write) permanently nulls the handle for the page lifetime. A record written
successfully *before* that failure stays in `localStorage` under `zph.haoo.ctx.v1`, and the
disclosure then renders `clearBlocked` (`src/products/haoo.ts:246`): *"Your browser did not
allow us to clear its saved copy."* The browser was never asked — `removeItem` is a
different operation from `setItem` and routinely succeeds when a quota write fails. This is
a privacy control failing silently plus a false statement to the visitor, in a phase whose
whole contract is that the page only claims browser-observable facts.

**Fix:** Always attempt the removal against a live handle before reporting refusal, and only
report `false` when the removal itself threw:

```ts
function clearContext(): boolean {
  context = freshContext(config, currentDay(adapters));

  // Re-resolve rather than trusting a handle nulled by an unrelated write failure.
  const handle = storage ?? browserStorage(adapters);
  if (handle === null) return false;

  try {
    handle.removeItem(config.storageKey);
    storage = handle;
    return true;
  } catch {
    storage = null;
    return false;
  }
}
```

### CR-02: The report's reporting timezone is an unvalidated constant — a mismatched Plausible site timezone aborts every all-time query and misdirects the owner to the API key

**File:** `src/reporting/generate.ts:35`, `:219`, `:271`; `src/reporting/query-provenance.ts:68-69`
**Issue:** `REPORT_TIMEZONE = 'Africa/Nairobi'` is hardcoded, used to derive `today`
(`reportDay(generatedAt, REPORT_TIMEZONE)`), printed in the document as an observed fact
(`timezone: REPORT_TIMEZONE` → *"Reporting timezone Africa/Nairobi"*), and never checked
against the provider. Nothing in the code, the CLI, or the README verifies the actual site
timezone configured in Plausible.

The consequence is not cosmetic. `validateEchoedQuery` requires, for the all-time range:

```ts
if (expected.range === 'all') {
  if (end !== expected.today || start > expected.today) return null;
}
```

Plausible echoes `date_range` in **site-local** time. If the site is configured in, say,
`Etc/UTC`, then between 00:00 and 03:00 Nairobi the locally derived `today` is one day ahead
of the echoed `end`, `queryRange` returns `null`, `generateHaooReport` returns
`invalid-all-time` (`:250`), and the CLI prints *"Check the API key and network connection"*
— a diagnosis that is wrong and unactionable. Outside that window the identical command
succeeds, so the failure looks random. The offset that would reveal the real site timezone
(`+03:00` in the echoed value) is parsed and then thrown away by `calendarDay`.

**Fix:** Derive the timezone from the response instead of asserting it, or at minimum fail
with a distinguishable reason. Minimal version — capture the echoed offset and refuse
explicitly when it disagrees with the configured constant:

```ts
// query-provenance.ts — keep the offset alongside the day
export interface EchoedQueryProvenance {
  readonly start: string;
  readonly end: string;
  readonly offset: string | null; // e.g. '+03:00' | 'Z'
}

// generate.ts — a one-day disagreement on 'all' is a timezone mismatch, not a bad key
if (allTime === null) {
  return { ok: false, reason: 'invalid-all-time-or-timezone-mismatch' };
}
```

and surface that reason in `scripts/generate-haoo-report.mjs` as a distinct terminal
sentence naming `REPORT_TIMEZONE`, so the owner is pointed at the site's timezone setting
rather than at the credential.

## Warnings

### WR-01: The product-generic form logic hardcodes one product's email label; a second product throws on every submit

**File:** `src/components/qualify-form.logic.ts:54`, `:67`, `:105-115`; `src/products/haoo.ts:548`; `src/test/product-shell-reuse.test.tsx:305`
**Issue:** `ENGAGEMENT_SUMMARY_LABEL = 'HAOO engagement context'` lives in the
product-generic module, is the only member of `RESERVED_EMAIL_LABELS` that can legally carry
a summary, and `buildSubmissionBody` throws for anything else:

```ts
if (!RESERVED_EMAIL_LABELS.has(label)) {
  throw new Error(`Engagement summary uses unreserved email label "${label}"`);
}
```

A second product that supplies its own `engagementSummary.emailLabel` therefore fails on
*every* submission — at visitor-submit time, not at load or build time, so the enquiry is
lost — and a product that reuses HAOO's label ships an email row named after another
product. The reuse suite cannot catch either case: `product-shell-reuse.test.tsx:305`
explicitly strips this literal before scanning for product-name leakage, and the synthetic
`zenith` product reuses `HAOO_PRODUCT.qualify.engagementSummary` verbatim.

**Fix:** Reserve the label structurally instead of by literal — e.g. require a
`_summary`-style provider-namespaced key, or validate `qualify.engagementSummary.emailLabel`
against the product's own field labels at module load:

```ts
// Reserve the *shape*, not one product's words.
const RESERVED_PREFIX = '_';
export function assertSummaryLabel(qualify: ProductQualifyForm): void {
  const label = qualify.engagementSummary.emailLabel;
  const claimed = qualify.fields.some((field) => field.emailLabel === label);
  if (claimed || RESERVED_EMAIL_LABELS.has(label)) {
    throw new Error(`Engagement summary label "${label}" collides with a field label`);
  }
}
```

and call it once from the product module so misconfiguration fails at import, never at
submit.

### WR-02: A configuration error is reported to the visitor as an email-provider transport failure

**File:** `src/components/QualifyForm.tsx:324-346`; `src/products/copy.ts:66`
**Issue:** `buildSubmissionBody(...)` (which throws on reserved/unreserved label violations,
see WR-01) is inside the same `try` as the network call, and the single `catch` sets
`state: 'failed'`. The failure panel then renders *"Something went wrong between this page
and our email provider"* — a claim the page cannot support, because no request was ever
made. Every other message in this codebase is scrupulously limited to browser-observable
facts; this one is not. It also hides a deterministic bug behind a retry affordance that can
never succeed.

**Fix:** Build the body before entering the transport `try`, and treat a build failure as its
own state:

```ts
let body: string;
try {
  body = JSON.stringify(buildSubmissionBody(submittedValues, qualify, engagementSummary()));
} catch {
  setState('failed');           // or a dedicated 'blocked' state with truthful copy
  inFlightRef.current = false;
  return;                        // never claims a provider round-trip happened
}
```

### WR-03: The report always asserts "Analytics provider: configured"; the second state is unreachable

**File:** `src/reporting/generate.ts:272`; `src/reporting/haoo-report.ts:242-248`; `src/reporting/render.ts:492`
**Issue:** `providerState: REPORT_PROVIDER_STATE_LABELS.configured` is a constant. No code
path — production or test — ever selects `'not-configured'` (`grep` confirms the only
non-definition hits are `generate.ts:272` and the fixture at `haoo-report.test.ts:543`), so
the `ReportProviderState` union's second member and its label are dead. The document prints
a two-valued "state" that is really a hardcoded string. Per `README.md:59-61` browser-side
collection is currently *deferred*, so a report generated today asserts a configuration that
does not exist. Either the word means "Stats credentials worked" — in which case it is
tautological, since generation aborts without them — or it means site collection is on, in
which case it is false.

**Fix:** Derive it, or delete the state. Deriving is cheap: a period whose counts are all
zero across every range is the observable signal for "nothing has been collected":

```ts
providerState: periods.every((period) => period.empty)
  ? REPORT_PROVIDER_STATE_LABELS['not-configured']
  : REPORT_PROVIDER_STATE_LABELS.configured,
```

If that inference is judged unsound, remove `ReportProviderState`/the metadata field
entirely rather than shipping an unfalsifiable claim.

### WR-04: The Stats API queries have no timeout — the report command can hang forever

**File:** `src/reporting/generate.ts:161`; `scripts/generate-haoo-report.mjs:57`
**Issue:** `await options.fetch(options.query.endpoint, { method, headers, body })` carries
no `signal`, and the CLI passes bare `globalThis.fetch`. Node's `fetch` has no default
timeout, so a stalled provider connection hangs `npm run report:haoo` indefinitely with no
output at all — seven sequential requests, any one of which can wedge. The same codebase
already recognises this exact hazard for the browser (`QUALIFY_REQUEST_TIMEOUT_MS = 15_000`,
`src/components/qualify-form.logic.ts:28`, with the comment *"fetch has no default timeout
in any browser"*), so the omission here is an inconsistency, not a considered exception.

**Fix:** Add a per-request budget through the injected capability so tests keep control:

```ts
const REPORT_REQUEST_TIMEOUT_MS = 30_000;

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), REPORT_REQUEST_TIMEOUT_MS);
try {
  const response = await options.fetch(options.query.endpoint, { /* ... */ signal: controller.signal });
  /* ... */
} finally {
  clearTimeout(timeout);
}
```

(`ReportRequestInit` needs the optional `signal` member added.)

### WR-05: A leftover `.tmp` sibling bricks report generation permanently, with a misleading error

**File:** `src/reporting/generate.ts:214`, `:287`; `scripts/generate-haoo-report.mjs:61`
**Issue:** The temporary path is a fixed name (`${outputPath}.tmp`) reserved with
`openSync(path, 'wx')`. If the process is killed between reservation and rename (Ctrl-C,
OOM, laptop sleep), the sibling survives. Every subsequent run then throws at
`reserveTempSync`, lands in the generic `catch`, and prints *"Check the API key and network
connection, then run the command again"* — advice that can never fix it. The owner has no
way to learn that the remedy is deleting `.reports/haoo-funnel-report.html.tmp`; the file is
inside a gitignored directory they are told never to inspect.

**Fix:** Either use a unique sibling per invocation (`${outputPath}.${process.pid}.tmp`, still
exclusive, no cross-run collision), or distinguish the reservation failure so the terminal
message can name the file:

```ts
try {
  options.fs.reserveTempSync(temporaryPath);
} catch {
  return { ok: false, reason: `temp-path-in-use:${temporaryPath}` };
}
```

and have the CLI print that path verbatim when the reason carries the prefix.

### WR-06: `npm test` executes ten stale duplicate suites from an untracked `.claude/worktrees/` checkout

**File:** `.gitignore:1-40`; `vitest.config.ts`; `package.json:11`
**Issue:** Verified locally with `npx vitest list --filesOnly`: the runner discovers 21 test
files, 10 of which are `.claude/worktrees/rf-03-retry-1788205465/src/test/*`. A full
`npx vitest run` executes them (761 tests total; 289 of those come from the stale copy —
e.g. `measurement.test.ts` contributes 77 obsolete tests there against 137 current ones
here). ESLint does not have this problem because flat config ignores dot-directories by
default; Vitest's default `exclude` does not list `.claude`. Consequences:

- Phase evidence quoting a passing test count is measuring an old revision as well as this one.
- A future regression in the frozen copy fails `npm test` for reasons unrelated to the source.
- `.claude/` is untracked **and** absent from `.gitignore` (`git status` shows `?? .claude/`),
  so a routine `git add -A` commits an entire duplicated source tree plus a worktree `.git`
  pointer file into the repository.

**Fix:** Ignore it in both tools:

```gitignore
# Tool-generated worktrees and local agent state — never repository content.
.claude/
```

```ts
// vitest.config.ts
test: {
  exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  /* ... */
}
```

### WR-07: The new build-time trust anchor is outside every typechecked project

**File:** `package.json:15`; `config/approved-analytics-script-sources.ts`; `tsconfig.app.json`; `tsconfig.node.json`
**Issue:** `npm run typecheck` is `tsc --noEmit -p tsconfig.app.json`, whose `include` is
`["src"]`. `config/approved-analytics-script-sources.ts` is in no project's `include` at all,
and `vite.config.ts` is only reachable through `tsconfig.node.json`, which **no npm script
invokes** (I ran `npx tsc -p tsconfig.node.json` manually; it passes, but nothing in CI does
this). The approved-source contract is described in its own header as *"the repository-owned
trust anchor"* and is the single gate deciding which analytics origin may reach a bundle —
yet a signature drift between `approvedScriptSourcesForProvider` and the
`__HAOO_APPROVED_ANALYTICS_SCRIPT_SOURCES__` declaration in `src/vite-env.d.ts:41` would not
be caught by the project's typecheck command.

**Fix:** Include the config directory in the node project and run both projects:

```jsonc
// tsconfig.node.json
"include": ["vite.config.ts", "config"]
```

```jsonc
// package.json
"typecheck": "tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json"
```

### WR-08: Three of the four public build variables are undeclared, so a typo silently disables analytics

**File:** `src/vite-env.d.ts:18-19`; `src/products/haoo.ts` (`provider`/`providerScript` initialisers)
**Issue:** `ImportMetaEnv` declares only `VITE_HAOO_FORM_ENDPOINT`, while the product module
reads `VITE_HAOO_MEASUREMENT_PROVIDER`, `VITE_HAOO_PLAUSIBLE_SRC`, and
`VITE_HAOO_PLAUSIBLE_DOMAIN`. Those three resolve through Vite's own
`interface ImportMetaEnv { [key: string]: any }` (`node_modules/vite/types/importMeta.d.ts:6`),
so they are typed `any` and a renamed or misspelled key compiles clean, yields `undefined`,
and fails closed to `'none'` — analytics silently off with no build-time signal. The file's
own header presents itself as the declaration of *"Public build-time configuration (D-04)"*,
which is now only a quarter true.

**Fix:**

```ts
interface ImportMetaEnv {
  readonly VITE_HAOO_FORM_ENDPOINT?: string;
  readonly VITE_HAOO_MEASUREMENT_PROVIDER?: string;
  readonly VITE_HAOO_PLAUSIBLE_SRC?: string;
  readonly VITE_HAOO_PLAUSIBLE_DOMAIN?: string;
}
```

### WR-09: The measurement-disclosure DOM id is derived in two places with no shared helper

**File:** `src/pages/ProductPage.tsx:83`, `:304`; `src/components/MeasurementDisclosure.tsx:29`
**Issue:** `ProductPage` builds `` `${product.slug}-measurement-disclosure` `` twice (the
`getElementById` lookup and the footer `href`), while `MeasurementDisclosure` independently
builds `` `${requireIdentity(slug, 'slug')}-measurement-disclosure` ``. Three literals, one
contract. `src/products/copy.ts` already centralises exactly this pattern for
`contentAnchorId` and `mobileNavigationId`; the new surface skipped it. A rename in one place
silently breaks the footer link (`getElementById` returns `null`, the guard swallows it, the
anchor jumps nowhere) with no test failure, since the tests query by the rendered text.

**Fix:** Add the missing builder next to its siblings and use it in all three call sites:

```ts
// src/products/copy.ts
export function measurementDisclosureId(slug: string) {
  return `${requireIdentity(slug, 'slug')}-measurement-disclosure`;
}
```

### WR-10: `resolvePlausibleScriptSrc` returns the raw candidate rather than the URL it validated

**File:** `src/products/haoo.ts:102-138` (return at `:138`); `src/measurement/plausible.ts:63-76`
**Issue:** Every check runs against the parsed `new URL(candidate)`, but the function returns
the untouched `candidate` string, which is later handed to
`element.setAttribute('src', src)`. The two parsers agree today (both are WHATWG URL
parsers, and both strip tab/newline), so this is not currently exploitable — but it makes the
approval decision and the emitted attribute two different strings, which is exactly the
parser-differential shape this module's own comments say it exists to prevent. The same
mismatch weakens `alreadyAppended`, which compares `getAttribute('src')` by exact string, so
two spellings of one approved URL both get appended.

**Fix:** Return the normalized form so the validated value and the emitted value are
byte-identical:

```ts
    if (!approved) {
      return '';
    }

    return url.href;   // the exact string that was validated
```

## Info

### IN-01: `exactKeys` re-sorts the expected list on every key comparison

**File:** `src/measurement/index.ts:100-104`
**Issue:** `actual.every((key, index) => key === [...expected].sort()[index])` allocates and
sorts a fresh copy inside the callback, once per key.
**Fix:** Hoist `const wanted = [...expected].sort();` above the `every` call.

### IN-02: The echoed timezone offset is parsed and discarded

**File:** `src/reporting/query-provenance.ts:25-45`
**Issue:** `calendarDay` validates a full ISO offset (`(?:Z|[+-]\d{2}:\d{2})`) and then slices
to ten characters, throwing away the one piece of evidence that would let the report state
the site's real reporting timezone instead of asserting a constant (see CR-02).
**Fix:** Return `{ day, offset }` and thread the offset into `ReportModel.timezone`.

### IN-03: The CLI fetch fixture recomputes "today" twice, leaving a midnight race

**File:** `src/test/fixtures/haoo-report-cli-fetch-preload.mjs:20-27`, `:53`, `:60`
**Issue:** `nairobiDay()` is evaluated once when the expected ranges are built and again per
response. A run that straddles 00:00 Africa/Nairobi echoes a range the CLI no longer expects
and the fixture throws.
**Fix:** Compute the day once at install time and reuse the captured value for the echo.

### IN-04: `isPlainObject` is duplicated verbatim across the two response validators

**File:** `src/reporting/stats-response.ts:12-14`; `src/reporting/query-provenance.ts:15-17`
**Issue:** Identical helper, identical body, two modules. Both are loaded by the same CLI, so
there is no bundling reason for the copy.
**Fix:** Extract to a small `src/reporting/untrusted.ts` and import it from both.

### IN-05: `formatEngagementSummary`'s doc comment contradicts its own control flow

**File:** `src/products/engagement-summary.ts:144`, `:152`
**Issue:** The comment states *"Any failure yields the authored fallback rather than throwing,
because a summary must never block, delay, or fail a submission"*, but `requireSummaryCopy(config)`
is deliberately outside the `try` and does throw. The behaviour is intentional (the caller
catches), but the comment as written will mislead the next reader into assuming the function
is total.
**Fix:** Amend the sentence to exclude configuration guards: *"Any failure after the
configuration guard yields the authored fallback."*

### IN-06: Root `.js` config files are parsed by ESLint but matched by no rule block

**File:** `eslint.config.js:9-41`
**Issue:** The new `scripts/**/*.mjs` block closes exactly this gap for the report CLI, but
`eslint.config.js`, `tailwind.config.js`, and `postcss.config.js` still match no block that
supplies rules, so `eslint .` walks them without checking anything.
**Fix:** Add `files: ['*.js']` with `js.configs.recommended` and `globals.node`, mirroring the
`.mjs` block.

### IN-07: Two weak checks in the coverage auditor

**File:** `scripts/verify-phase4-coverage.mjs:70`, `:122`
**Issue:** (a) `line.slice(1, -1)` assumes the row ends exactly at the final `|`; one trailing
space makes the row parse to four cells, get skipped, and be reported as a *missing*
capability rather than a malformed one. (b) `['production enablement remains deferred', /deferred/iu]`
passes on any occurrence of the word "deferred" anywhere in the boundary section, including
one that says the opposite.
**Fix:** Trim the line before slicing (`line.trim().replace(/^\|/, '').replace(/\|$/, '')`) and
tighten the second pattern to the sentence it means to pin, as the neighbouring checks do.

---

_Reviewed: 2026-09-02T18:25:35Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
