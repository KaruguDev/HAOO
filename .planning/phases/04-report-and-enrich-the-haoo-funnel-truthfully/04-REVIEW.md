---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
reviewed: 2026-09-02T21:20:00Z
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
  critical: 1
  warning: 15
  info: 6
  total: 22
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-09-02T21:20:00Z
**Depth:** standard
**Files Reviewed:** 32
**Status:** issues_found

## Summary

The phase adds three things: a Plausible browser sink behind a repository-owned script-source
allowlist, a disclosed engagement paragraph attached to the qualification email, and a
credentialed CLI that renders an owner-facing HTML funnel report from the Stats API.

What holds up under attack: the HTML renderer escapes every interpolated value and carries no
script, stylesheet, font, or image, so a hostile Stats response cannot execute in the report;
`parseGoalCounts` and `validateEchoedQuery` reject untrusted provider data structurally rather
than trusting it; `resolvePlausibleScriptSrc` compares parsed `url.origin` exactly, so the
lookalike-host and extension-variant-path attacks it names really are refused; the write path
is genuinely write-on-success; `buildSubmissionBody` cannot be made to emit visitor-controlled
provider options. `npm run typecheck` and `npm run lint` are clean and the reporting and
measurement suites pass.

What does not hold up: the module that documents `window.plausible` as "untrusted input of
arbitrary type" then reads and writes that global with no guard, on a path that runs inside a
React effect (CR-01). The report asserts four "facts" in its metadata line of which two are
unverified constants (WR-02, WR-03), and every bounded period silently mixes a partial current
day against complete comparison windows (WR-01) — three truthfulness defects in the artifact
whose stated purpose is not overstating. The credentialed CLI omits the request timeout the
codebase documents as mandatory two files away (WR-05). The coverage audit that is supposed to
make the capability matrix executable is wired to nothing (WR-08). And `.gitignore` — edited in
this phase specifically for artifact hygiene — misses `.claude/`, so `vitest` currently collects
ten stale duplicate suites from a worktree copy (WR-11).

## Critical Issues

### CR-01: Unguarded reads and writes to a foreign `window.plausible` can throw out of `initialize()` and blank the product page

**File:** `src/measurement/plausible.ts:154`, `src/measurement/plausible.ts:161`, `src/measurement/plausible.ts:168`, `src/measurement/plausible.ts:173`, `src/measurement/plausible.ts:99`, `src/measurement/index.ts:322-324`, `src/measurement/index.ts:330`, `src/pages/ProductPage.tsx:73-79`

**Issue:** `resolveInitializedProvider` is the one function in `plausible.ts` with no `try`.
Every other browser touch in the module is wrapped (`resolveScope`, `resolveDocument`,
`appendProviderScript`, `provider.init(options)`, the returned sink), and the docblock at
lines 141-148 states the design premise: *"An ambient `window.plausible` defined by another
snippet is untrusted input of arbitrary type."* Three interactions with that untrusted value
are unprotected:

- line 154 `const existing = scope.plausible;` — a throwing accessor on the global throws here.
- line 168 → line 99 `scope.plausible = stub;` — ES modules are strict mode, so assigning to a
  non-writable data property or an accessor-only property (installed by a browser extension,
  a tag manager, or a defensive snippet via `Object.defineProperty`) throws `TypeError`.
- line 173 `typeof provider.init !== 'function'` — reads a property off the adopted foreign
  object; a throwing getter throws here too.

The throw is not contained anywhere upstream. `createPlausibleEventSink` has no try; its call
site in `initialize()` has none either:

```ts
// src/measurement/index.ts:322-324
if (eventSink === undefined) {
  eventSink = createPlausibleEventSink(config, adapters.providerAdapters);
}
```

`initialize()` is called from two unguarded places: `track()` at line 330 (`if (!initialized)
initialize();` — outside both of that function's try blocks) and `ProductPage`'s effect at
`ProductPage.tsx:77`. An error thrown from a passive effect with no error boundary above it
makes React 18 unmount the entire root — a blank page instead of the product page. Thrown from
`track()`, it aborts whatever visitor action called it, which directly contradicts the
comments at `index.ts:335` and `plausible.ts:237` ("Provider delivery is deliberately isolated
from every visitor action").

Reachability: the path is currently dormant because `config.provider !== 'plausible'` returns
early at `plausible.ts:209` in a provider-unset build. It becomes live the moment the deferred
enablement described in README happens — i.e. this must be fixed before the code it belongs to
is switched on, not after.

**Fix:**

```ts
// src/measurement/plausible.ts
function resolveInitializedProvider(
  scope: PlausibleScope,
  options: PlausibleInitOptions,
): PlausibleGlobal | null {
  try {
    const existing = scope.plausible;
    if (existing !== undefined && typeof existing !== 'function') return null;

    const provider = existing ?? installProviderStub(scope);
    if (typeof provider.init !== 'function') return null;

    provider.init(options);
    if (!recordsOptOut(provider.o, options.domain)) return null;

    return provider;
  } catch {
    // A global that refuses inspection, refuses assignment, or throws on init leaves the
    // opt-out unproven. Refuse rather than guess, and never propagate into the journey.
    return null;
  }
}
```

```ts
// src/measurement/index.ts:322-324 — belt and braces at the seam the facade owns
if (eventSink === undefined) {
  try {
    eventSink = createPlausibleEventSink(config, adapters.providerAdapters);
  } catch {
    // Sink construction is isolated from initialization exactly as delivery is from track.
  }
}
```

Note the existing comment at `plausible.ts:163-167` ("A refusal after this installation is
therefore unreachable and there is nothing to withdraw") stays true under this fix and should
be kept; it is a statement about refusal, not about throwing.

## Warnings

### WR-01: Every bounded period compares a partial current day against complete previous days, and no caveat says so

**File:** `src/reporting/haoo-report.ts:149-157`, `src/reporting/generate.ts:224-247`, `src/reporting/haoo-report.ts:286-297`

**Issue:** `periodWindows(days, todayIso)` returns `current = [today-(days-1), today]` — the
last day of every current window is *today*, still in progress — while
`previous = [currentStart-days, currentStart-1]` is entirely complete days. `deltaLabel` then
prints `"−N vs previous 7 days"` from those two unequal quantities. A report generated at 09:00
compares roughly 6.4 days of activity against 7, so every Change value carries a systematic
negative bias, and a report generated just after midnight compares ~6.0 against 7. The six
sentences in `REPORT_CAVEATS` name what the counts are not (people, sessions, enquiries,
customers) but none mentions that the newest day is incomplete — which is the one distortion
the owner will actually act on, because it is the direction the arrow points.

**Fix:** Either end the current window on the last complete day
(`shiftDay(todayIso, -1)`) so both sides are complete, or add a caveat to `REPORT_CAVEATS`,
e.g. `'The most recent day of each period is still in progress, so a change value can look '
+ 'lower than it will be once the day completes.'` The first is the truthful default; the
second is the minimum. Whichever is chosen, `comparisonLine` and the period heading must keep
naming the exact boundaries used.

### WR-02: The reporting timezone is a hardcoded constant printed as a verified fact

**File:** `src/reporting/generate.ts:35`, `src/reporting/generate.ts:85-95`, `src/reporting/generate.ts:219`, `src/reporting/haoo-report.ts:233-238`, `README.md`

**Issue:** `const REPORT_TIMEZONE = 'Africa/Nairobi'` is used for two different things: to
derive `today`, and to print `Reporting timezone Africa/Nairobi` in the header as a stated
fact. Nothing anywhere verifies the timezone actually configured on the Plausible site.
Plausible interprets an explicit `date_range` ISO pair in the *site's* timezone, so if the site
is configured as (say) UTC, the day boundaries the provider aggregates are not the day
boundaries the report names — a run between 00:00 and 03:00 Nairobi asks for a window whose
last day has not started at the provider yet. `validateEchoedQuery` cannot catch this: it
compares the echoed date strings against the ones just sent, which match by construction. The
failure is therefore silent and produces plausible-looking but mis-attributed numbers. The
README section added in this phase never mentions the timezone requirement at all.

**Fix:** Make the assumption checkable rather than assumed. Minimum: document in the README's
"Report credential boundary" section that the Plausible site timezone must be `Africa/Nairobi`
and that the report is wrong if it is not. Better: read the site timezone from the provider and
refuse to render on mismatch, or move `REPORT_TIMEZONE` into the injected `ReportQuery`
capability so the owner command states it explicitly next to the site id it belongs to.

### WR-03: The report always claims `Analytics provider: configured`; the `not-configured` state is unreachable

**File:** `src/reporting/generate.ts:272`, `src/reporting/haoo-report.ts:242-248`

**Issue:** `ReportProviderState` models two states and `REPORT_PROVIDER_STATE_LABELS` authors
both, but `generate.ts` hardcodes `REPORT_PROVIDER_STATE_LABELS.configured`. `'not-configured'`
/ `'not configured'` is dead code that no input can select. The rendered claim is therefore not
derived from anything — the CLI knows only that it holds Stats credentials, which
`generateHaooReport` has already guaranteed at line 210. Meanwhile the phase's own operational
boundary states production analytics enablement remains OPT-OUT and the provider selector
remains unset, so a report run today prints "Analytics provider: configured" about a site whose
browser build has no provider configured at all. `haoo-report.test.ts:1666` pins the false
claim rather than catching it.

**Fix:** Either derive the state from something real and let both branches occur — e.g. treat
"no goal produced a non-zero count in any period" or an explicit `providerConfigured` flag
supplied by the owner command as `not-configured` — or delete the union, the label map, and the
metadata row, and stop asserting a fact the report cannot establish.

### WR-04: A stale `.tmp` sibling disables the report permanently, and the error text sends the owner to the wrong cause

**File:** `src/reporting/generate.ts:214`, `src/reporting/generate.ts:287`, `src/reporting/generate.ts:294-307`, `scripts/generate-haoo-report.mjs:26-29`, `scripts/generate-haoo-report.mjs:61`

**Issue:** The temporary path is fixed (`${outputPath}.tmp`) and reserved with
`openSync(path, 'wx')`, which throws `EEXIST` if the file already exists. When a run is killed
between reservation and rename, `ownsTemporaryPath` is still `false` on the *next* run (the
throw happens inside `reserveTempSync`, before line 288), so the cleanup branch does not fire
and the stale sibling is never removed. Every subsequent `npm run report:haoo` then fails
forever. The only message the owner sees is `ERROR_STATE_SENTENCE`: *"Check the API key and
network connection, then run the command again."* — which names two causes, neither of them the
real one, and prescribes an action that cannot work. The code comment at lines 303-306
acknowledges the lockout; the operator-facing surface does not, and README documents no
recovery.

**Fix:** Distinguish the reservation failure from a generation failure and say what to do:

```js
// generate.ts — return a specific reason
try {
  options.fs.reserveTempSync(temporaryPath);
} catch {
  return { ok: false, reason: 'temporary-path-reserved' };
}
ownsTemporaryPath = true;
```

```js
// scripts/generate-haoo-report.mjs — name the file and the fix
if (result.reason === 'temporary-path-reserved') {
  writeTerminalError(
    `A previous run left ${OUTPUT_PATH}.tmp behind. Delete that file and run the command again.`,
  );
} else {
  writeTerminalError(ERROR_STATE_SENTENCE);
}
```

### WR-05: The credentialed CLI issues seven `fetch` calls with no timeout, in a codebase that documents the timeout as mandatory

**File:** `src/reporting/generate.ts:161-168`, `scripts/generate-haoo-report.mjs:55-67`

**Issue:** `src/components/qualify-form.logic.ts:24-28` states the project's own rule — *"`fetch`
has no default timeout in any browser, so a request that never settles is treated as a
failure"* — and `QualifyForm.tsx:321-338` implements it with an `AbortController` and
`QUALIFY_REQUEST_TIMEOUT_MS`. The new report path does neither: `queryRange` awaits
`options.fetch(...)` with no `signal`, and the CLI passes bare `globalThis.fetch`. Node's
`fetch` has no default request timeout either, so a provider that accepts the connection and
never responds hangs `npm run report:haoo` indefinitely — no output, no exit, no error state,
seven sequential opportunities per run.

**Fix:** Add the same budget at the seam that already owns the transport:

```js
// scripts/generate-haoo-report.mjs
const QUERY_TIMEOUT_MS = 30_000;

fetch: (url, init) => globalThis.fetch(url, {
  ...init,
  signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
}),
```

An abort rejects the promise, which the outer `try` in `generateHaooReport` already converts to
`generation-failed` and leaves the previous report untouched.

### WR-06: `VITE_HAOO_PLAUSIBLE_DOMAIN` reaches the provider with no validation, while the script URL is guarded by a repository trust anchor

**File:** `src/products/haoo.ts:181`, `src/measurement/plausible.ts:212`, `src/measurement/plausible.ts:223-226`

**Issue:** The phase builds an elaborate approval mechanism for `VITE_HAOO_PLAUSIBLE_SRC`
(origin allowlist outside `src/`, provider-gated `define`, exact origin+path equality) because a
tampered build variable must not be able to change what code loads. The variable that decides
*which Plausible site receives this site's visitor events* gets one line:

```ts
domain: (import.meta.env.VITE_HAOO_PLAUSIBLE_DOMAIN ?? '').trim(),
```

Any non-empty string passes. `createPlausibleEventSink` checks only `!== ''` and hands it
straight to `plausible.init({ domain })`. A typo silently sends every event nowhere with no
signal; a substituted value sends this site's funnel events to a third party's Plausible site.
The threat model that justified the script allowlist ("a changed or tampered build variable")
applies identically here, and the mitigation is absent.

**Fix:** Validate the shape at minimum, and prefer the same repository-owned approval as the
script source:

```ts
const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export function resolvePlausibleDomain(configuredValue?: string): string {
  const candidate = (configuredValue ?? '').trim().toLowerCase();
  return DOMAIN_PATTERN.test(candidate) ? candidate : '';
}
```

An empty result already fails closed at `plausible.ts:212`.

### WR-07: `All time · since {date}` names the site's first recorded activity, not the first day these goals existed

**File:** `src/reporting/generate.ts:199-205`, `src/reporting/generate.ts:249-266`

**Issue:** `resolvedStart` is the start of the range the provider echoed for
`date_range: "all"`, which is a property of the *site*, not of the ten goal filters applied to
it. The README added in this phase states the relevant fact directly: *"Plausible does not
backfill events into a goal created later."* So a site that existed before the ten custom-event
goals were created yields a heading reading `All time · since 2024-06-01` above counts that
could only start accruing months afterwards, and the all-time `window` handed to the renderer
carries the same date. The report implies measurement coverage it does not have.

**Fix:** Either drop the `since` clause and render `All time` alone (the code already does
exactly this when `resolvedStart` is `null`, so the branch exists), or qualify it in the
authored copy — e.g. `All time · site data since {date}` plus a caveat that goals created later
have no earlier data. Do not derive a measurement start date from a site start date.

### WR-08: `scripts/verify-phase4-coverage.mjs` is never executed by any command

**File:** `scripts/verify-phase4-coverage.mjs:88`, `scripts/verify-phase4-coverage.mjs:144-161`, `package.json:6-16`, `.github/workflows/deploy.yml`

**Issue:** 161 lines that encode the phase's capability decisions as an executable audit, with
`auditPhase4Coverage` exported for reuse — and nothing calls it. There is no npm script, the
deploy workflow runs only `typecheck`, `lint`, `build`, `test:unit`, and no test file imports
it (the only non-planning reference in the repository is the file itself). The claim that the
coverage matrix is executable rather than documentary is therefore not true of any automated
run; it holds only if a human remembers the exact `node scripts/... <path>` invocation.

**Fix:** Wire it. Add `"verify:coverage": "node scripts/verify-phase4-coverage.mjs .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-COVERAGE.md"`
to `package.json` scripts and a step to the workflow, or import `auditPhase4Coverage` from a
test so `npm run test:unit` enforces it. An audit nobody runs is documentation with extra steps.

### WR-09: The coverage markdown parser mis-reads ordinary table syntax

**File:** `scripts/verify-phase4-coverage.mjs:65-82`

**Issue:** Two concrete defects in the row parser:

- `line.slice(1, -1)` assumes the line's last character is the closing `|`. A single trailing
  space after it (invisible, produced by most editors and by many formatters) shifts the cut, so
  `split('|')` yields four cells, `cells.length !== 3` skips the row, and a capability row that
  is present and correct is reported as `missing capability row`.
- The separator guard `/^\|\s*-+/u` does not match alignment separators such as `|:---|:---:|`.
  Those rows fall through, produce `cells.length === 3`, and are recorded as a capability named
  `:---` with decision `:---:`. It happens to cause no error today only because that decision is
  not `OPT-OUT`, so the blank-reason check at line 111 skips it — and it would also make a
  second aligned table under the same heading throw a spurious `duplicate capability row`.

**Fix:**

```js
const cells = line
  .replace(/^\s*\|/u, '')
  .replace(/\|\s*$/u, '')
  .split('|')
  .map((cell) => cell.trim());

if (cells.every((cell) => /^:?-{3,}:?$/u.test(cell))) continue; // separator row
if (cells.length !== 3 || cells[0].toLowerCase() === 'capability') continue;
```

### WR-10: The eslint `.mjs` block documents a false premise and leaves the test fixture unlinted

**File:** `eslint.config.js:28-40`

**Issue:** The comment states *"The credentialed report CLI is the only `.mjs` module in the
project."* The repository contains four: `scripts/generate-haoo-report.mjs`,
`scripts/assert-phase1-red.mjs`, `scripts/verify-phase4-coverage.mjs` (two of them added in
this phase), and `src/test/fixtures/haoo-report-cli-fetch-preload.mjs`. The glob
`scripts/**/*.mjs` covers the first three; the fixture is matched by no block in the config, so
no rules apply to it at all. That fixture reassigns `globalThis.fetch`, reads `process.env`,
registers a `process.once('exit')` handler and executes a side effect at import — exactly the
kind of module the block was added to stop shipping unchecked. `haoo-report.test.ts:1030` pins
the literal string `files: ['scripts/**/*.mjs']`, so the gap is locked in by a test.

**Fix:** Broaden the glob to `['scripts/**/*.mjs', 'src/test/fixtures/**/*.mjs']`, correct the
comment to say which modules it covers, and update the assertion at `haoo-report.test.ts:1030`
to match the corrected pattern.

### WR-11: `.gitignore` misses `.claude/`, and `vitest` is currently collecting ten stale duplicate suites from a worktree copy

**File:** `.gitignore:32-39`, `package.json:12`

**Issue:** This phase edited `.gitignore` specifically for artifact hygiene, adding `.env*`,
`.gsd/`, `.planning/research/.cache/` and `.reports/` — and did not add `.claude/`, which is
untracked and not ignored (`git check-ignore .claude/` exits 1). It currently holds two complete
worktree copies of the repository. `vitest` has no `exclude` for it, so `npx vitest list
--filesOnly` returns 21 test files: the 11 real ones plus 10 stale duplicates under
`.claude/worktrees/rf-03-retry-1788205465/src/test/`. `npm run test:unit` therefore runs a
snapshot of an older revision alongside the real suite, and its result is reported as this
project's. Separately, a `git add -A` would commit the entire duplicated tree.

**Fix:** Add to `.gitignore`:

```gitignore
# Agent worktrees hold complete copies of the repository. Unignored they are one
# `git add -A` away from being committed, and the test runner collects their stale suites.
.claude/
```

and constrain the runner in `vitest.config.ts`:

```ts
test: {
  include: ['src/**/*.{test,spec}.{ts,tsx}'],
  // ...
}
```

### WR-12: `vite.config.ts` is outside `npm run typecheck`, so the build wiring that gates the approved analytics origin has no type gate

**File:** `package.json:15`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts:27-31`

**Issue:** `npm run typecheck` is `tsc --noEmit -p tsconfig.app.json`, whose `include` is
`["src"]`. `vite.config.ts` is covered only by `tsconfig.node.json`, which no script and no CI
step ever runs, and Vite's own build transpiles without typechecking. The single route by which
the approved analytics origin may reach a bundle — the `define` block and its
`approvedScriptSourcesForProvider(env.VITE_HAOO_MEASUREMENT_PROVIDER)` call — is therefore
never type-verified in CI. (`config/approved-analytics-script-sources.ts` is checked only
incidentally, because `src/test/measurement.test.ts:20` imports it.)

**Fix:** Change the script to build both projects: `"typecheck": "tsc --noEmit -b"` (the root
`tsconfig.json` already references both), or add a second invocation
`&& tsc --noEmit -p tsconfig.node.json`.

### WR-13: The three new public build variables are not declared in `ImportMetaEnv`, so they are typed `any`

**File:** `src/vite-env.d.ts:18-20`, `src/products/haoo.ts:178-182`

**Issue:** `ImportMetaEnv` declares only `VITE_HAOO_FORM_ENDPOINT`, but this phase reads three
more: `VITE_HAOO_MEASUREMENT_PROVIDER`, `VITE_HAOO_PLAUSIBLE_SRC` and
`VITE_HAOO_PLAUSIBLE_DOMAIN`. Vite's ambient index signature makes those reads `any`, so a
typo in a variable name typechecks cleanly and fails closed at runtime — an unset provider,
which is indistinguishable from a deliberate opt-out and produces no diagnostic anywhere. The
docblock above the interface calls itself "Public build-time configuration (D-04)", which is now
incomplete rather than authoritative.

**Fix:** Declare all four:

```ts
interface ImportMetaEnv {
  readonly VITE_HAOO_FORM_ENDPOINT?: string;
  readonly VITE_HAOO_MEASUREMENT_PROVIDER?: string;
  readonly VITE_HAOO_PLAUSIBLE_SRC?: string;
  readonly VITE_HAOO_PLAUSIBLE_DOMAIN?: string;
}
```

The file's "no import or export may be added" constraint is unaffected.

### WR-14: The appended third-party script has no integrity constraint, only a URL constraint

**File:** `src/measurement/plausible.ts:70-83`

**Issue:** The approved-source allowlist proves *where* the script comes from and nothing about
*what it is*. `appendProviderScript` sets only `defer` and `src`, with no `integrity`, no
`crossorigin`, and no Content-Security-Policy backing it (the deployed pages carry no CSP
meta or header). Once appended, the script runs with full page privileges on a page that also
renders the qualification form — it can read form fields, which is precisely the boundary every
disclosure sentence in this phase promises. The URL allowlist does not mitigate a compromised
or changed vendor asset.

**Fix:** SRI is impractical against a mutable vendor script, so the honest options are: (a) add
a CSP that constrains `script-src` to `'self' https://plausible.io` and `connect-src`
accordingly, so a swapped script cannot exfiltrate to an arbitrary origin; and (b) record the
residual risk in the README section that currently claims the mechanism "stops a changed or
tampered build variable from loading arbitrary first-party JavaScript" — true of the variable,
not of the vendor.

### WR-15: Clearing remembered context is silently undone by the next tracked interaction, while the copy implies it is not

**File:** `src/measurement/index.ts:352-364`, `src/measurement/index.ts:327-345`, `src/products/haoo.ts:244-247`

**Issue:** `clearContext()` removes the storage record and resets the in-memory context to
`freshContext`, but sets no "cleared" flag. The next `track()` call reads through
`currentContext()`/`reconcileContext()` (storage empty → fresh) and then calls `writeContext`,
which does `storage.setItem(config.storageKey, ...)` — re-creating in localStorage the record
the visitor just asked to delete, on their very next click. The success copy says *"What this
page remembered has been cleared."* with no hint of that, while the blocked copy explicitly
promises the stronger behaviour: *"This page stopped using remembered context for this visit."*
The mismatch matters more after this phase than before it, because the record now travels
outside the browser in the qualification email (`buildSubmissionBody` +
`formatEngagementSummary`) — and after a clear, that email will assert "first visit" about a
browser that is not on its first visit.

**Fix:** Honour the clear for the remainder of the page lifetime:

```ts
let suppressed = false;

function writeContext(next: EngagementContext) {
  context = next;
  if (storage === null || suppressed) return;
  // ...
}

function clearContext(): boolean {
  suppressed = true;
  // ...
}
```

Then either keep the current success sentence (now true) or amend it to state that a new record
starts on the next visit.

## Info

### IN-01: Unreachable defensive fallbacks in `stageCard`

**File:** `src/reporting/render.ts:390-394`

**Issue:** `bounded` already narrows `period.previousCounts !== null && period.days !== null`,
so `period.previousCounts ?? {}` and `period.days ?? 0` inside the `bounded` branch can never
take their fallback. The `?? 0` is the more misleading of the two: it implies a zero-day
comparison is a representable state.

**Fix:** Destructure once above the branch and let the narrowing carry, or cast through a small
local `const previousCounts = period.previousCounts; const days = period.days;` guarded by an
`if (previousCounts !== null && days !== null)`.

### IN-02: `exactKeys` re-sorts the expected key list on every element comparison

**File:** `src/measurement/index.ts:100-104`

**Issue:** `[...expected].sort()[index]` is evaluated inside the `every` callback, so the copy
and sort happen once per key rather than once per call. Behaviour is correct; the shape reads
as an oversight and invites a reader to assume `expected` is mutated. Pre-dates this phase but
sits in a file it changed.

**Fix:** Hoist: `const wanted = [...expected].sort();` before the `every`.

### IN-03: One metadata label carries a colon and three do not

**File:** `src/reporting/haoo-report.ts:233-238`

**Issue:** `provider: 'Analytics provider:'` versus `generated: 'Generated'`,
`timezone: 'Reporting timezone'`, `site: 'Site'`. The rendered line reads
`Generated 2026-… · Reporting timezone Africa/Nairobi · Analytics provider: configured · Site …`
— inconsistent punctuation in a header the UI-SPEC locks byte-for-byte.

**Fix:** Pick one convention for all four labels and update the pinned expectations in
`haoo-report.test.ts:1665-1666`.

### IN-04: The collection-notice docblock forbids a restatement that the phase's own test makes

**File:** `src/products/copy.ts:111-112`, `src/test/measurement-page.test.tsx:25`

**Issue:** The docblock says *"Do not restate this string anywhere. Product data and tests
derive it from this builder so an approved wording change cannot land on some surfaces and not
others."* `measurement-page.test.tsx:25` restates the full sentence as a literal
(`APPROVED_COLLECTION_NOTICE`) — deliberately, with its own docblock explaining that pinning the
approved bytes is the point. Both rationales are defensible; only one can be the stated rule,
and a future maintainer following the comment will delete a deliberate golden assertion.

**Fix:** Amend the `copy.ts` docblock to say that exactly one test pins the approved bytes and
every other surface derives from the builder.

### IN-05: `.gitignore` negates a file that does not exist

**File:** `.gitignore:30`

**Issue:** `!.env.example` re-includes a checked-in example that the repository does not
contain, and the comment above it says "keep the checked-in example". Harmless, but the comment
describes a file a reader will go looking for.

**Fix:** Add the `.env.example` the comment promises (documenting the four public `VITE_HAOO_*`
names with empty values), or drop the negation and the clause.

### IN-06: The new disclosure group is not in the document heading outline

**File:** `src/components/MeasurementDisclosure.tsx:79-90`

**Issue:** The added "What we attach to your form submission" group uses
`<section aria-label>` plus a styled `<p className="text-base font-semibold">` where a heading
element belongs, so the group that describes what leaves the browser is unreachable by heading
navigation. Consistent with the four sibling sections, which have the same shape — this
extends the pattern rather than introducing it, and the `aria-label` keeps the region
discoverable, but the outline stays empty inside a `<details>` the footer link opens on purpose.

**Fix:** Promote the five section titles to `<h3>` and drop the now-redundant `aria-label`s, so
the region names come from the headings themselves.

---

_Reviewed: 2026-09-02T21:20:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
