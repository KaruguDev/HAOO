---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
reviewed: 2026-09-02T11:23:08Z
depth: standard
files_reviewed: 32
files_reviewed_list:
  - .gitignore
  - README.md
  - config/approved-analytics-script-sources.ts
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
  - src/vite-env.d.ts
  - vite.config.ts
findings:
  critical: 1
  warning: 4
  info: 6
  total: 11
status: issues_found
---

# Phase 04: Code Review Report (post gap-closure)

**Reviewed:** 2026-09-02T11:23:08Z
**Depth:** standard
**Files Reviewed:** 32
**Status:** issues_found

## Summary

The three findings from `04-REVIEW-pre-gap-closure.md` are genuinely closed. `resolvePlausibleScriptSrc`
now validates the candidate against a repository-owned approved origin/path set that reaches the bundle
only through a provider-gated build constant (CR-01 closed); `resolveInitializedProvider` refuses a
missing, throwing, silent, or non-callable provider global before any script insertion or sink creation
(CR-02 closed); and `directoryOf` now chooses its separator set from the destination's shape and refuses
bare drive and UNC roots (WR-01 closed). `npm run typecheck`, `npx eslint .`, and `npx vitest run` all
pass locally.

What the gap-closure rounds did not close is the *access* path to the untrusted provider global. 04-12
hardened the classification of the *value* found at `window.plausible` but left every read of and write to
that property outside the module's try/catch envelope. A read-only or throwing `plausible` property — the
shape a content blocker or tag manager installs, and the same class of ambient input the module's own
comments claim to handle — makes `createPlausibleEventSink` throw out of `ProductPage`'s effect and out of
`QualifyForm`'s focus handler. There is no error boundary anywhere in `src/`, so the whole product page
unmounts. That is CR-01 below and it directly falsifies the MEAS-07 claim the 04-12 tests assert on every
other refusal path.

04-13 was comments-and-docs-only on `src/measurement/plausible.ts` and
`src/test/fixtures/plausible-preload-contract.ts`. The new prose is mostly precise and well-hedged, but one
privacy-critical sentence now states something the code does not do (WR-03), and one sentence states an
unverified vendor runtime behaviour as fact in the same repository where the sibling fixture explicitly
disclaims exactly that kind of claim (IN-06).

Two process-level defects also surfaced: the lint block that exists specifically to cover `.mjs` modules
misses one of them (WR-02), and the local test runner is executing 240+ stale tests out of a Phase-3 git
worktree parked under an un-ignored `.claude/` directory (WR-04), which contaminates the "all tests pass"
evidence this phase was verified with.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 (BLOCKER): Untrusted provider-global access escapes the isolation envelope and can unmount the product page

**Classification:** BLOCKER

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/measurement/plausible.ts:99,154,161,168,173`
**Also:** `src/measurement/index.ts:322-324,330,348`, `src/pages/ProductPage.tsx:73-79`, `src/components/QualifyForm.tsx:197-200`

**Issue:** `resolveScope` and `resolveDocument` wrap their `?? window.x` defaults in `try`, and
`appendProviderScript`, `provider.init(...)`, and the returned sink are all wrapped too. The three
operations that actually touch the foreign global are not:

```ts
const existing = scope.plausible;                       // line 154 — unguarded read
if (existing !== undefined && typeof existing !== 'function') return null;
const provider = existing ?? installProviderStub(scope); // line 168 → line 99: scope.plausible = stub
if (typeof provider.init !== 'function') return null;    // line 173 — unguarded read
```

ES modules are strict mode, so `scope.plausible = stub` throws `TypeError: Cannot assign to read only
property` whenever the page has `Object.defineProperty(window, 'plausible', { value: undefined, writable:
false })` — the exact shape a content blocker's constant-stub scriptlet, a frozen window, or a tag manager
installs. A getter that throws breaks line 154 or 173 the same way. Verified both behaviours directly under
Node.

The escape path is not contained. `createPlausibleEventSink` is called from `initialize()`
(`src/measurement/index.ts:322-324`), which is called untried from `track()` (line 330), from
`currentContext()` (line 348), from `ProductPage`'s mount effect (`ProductPage.tsx:77`), and from
`QualifyForm.handleQualifyStart` (`QualifyForm.tsx:200`, an `onFocus`/`onChange` handler with no
try/catch). `grep` for `ErrorBoundary|componentDidCatch|getDerivedStateFromError` over `src/` returns
nothing, so an uncaught throw in the mount effect unmounts the React root: the visitor gets a blank page,
and the `<noscript>` recovery panel in `products/haoo/index.html` does not render because JavaScript is
enabled.

This contradicts the module's own contract in three places: "Every browser capability this adapter needs
arrives through an optional adapter ... wrapped in try" (lines 36-41), "provider delivery is deliberately
isolated from every visitor action" (lines 196-203), and "An ambient `window.plausible` defined by another
snippet is untrusted input of arbitrary type" (lines 141-148) — the code treats the *value* as untrusted
but the *property access* as safe. It also falsifies the MEAS-07 guarantee the 04-12 suite asserts on every
other refusal path ("keeps the whole journey working when the pre-existing global is not callable",
`src/test/measurement.test.ts:936`). No test covers a non-writable or throwing property: every fixture
(`bareCallableScope`, `throwingInitScope`, `silentInitScope`, `nonFunctionGlobalScope`, `recordingScope`)
injects an ordinary object literal.

**Fix:** Put the classification and the install inside the same envelope as everything else, and defend
`initialize()` at the facade so no provider concern can ever reach a visitor action.

```ts
// src/measurement/plausible.ts
function resolveInitializedProvider(
  scope: PlausibleScope,
  options: PlausibleInitOptions,
): PlausibleGlobal | null {
  let provider: PlausibleGlobal;

  try {
    const existing = scope.plausible;
    if (existing !== undefined && typeof existing !== 'function') return null;
    provider = existing ?? installProviderStub(scope);
    if (typeof provider.init !== 'function') return null;
  } catch {
    // A read-only, sealed, or throwing provider slot is somebody else's state and
    // leaves the opt-out unprovable. Refuse exactly as a throwing initializer does.
    return null;
  }

  try {
    provider.init(options);
    if (!recordsOptOut(provider.o, options.domain)) return null;
  } catch {
    return null;
  }

  return provider;
}
```

```ts
// src/measurement/index.ts, inside initialize()
if (eventSink === undefined) {
  try {
    eventSink = createPlausibleEventSink(config, adapters.providerAdapters);
  } catch {
    // Sink construction is provider work; the local bounded context is not.
  }
}
```

Add regression rows for (a) a scope whose `plausible` property is defined `writable: false` and (b) a
scope whose `plausible` getter throws, asserting in each case: no throw, no sink, no script appended, and
the full three-action journey (`haoo_brochure_download`, `haoo_qualify_start`, `haoo_self_onboarding`) still
returns `true` with its local flags recorded — the same shape as the existing `refusedRows` table.

## Warnings

### WR-01 (WARNING): The CLI's structured failure reason is discarded, and a stale `.tmp` sibling gives owners advice that cannot work

**Classification:** WARNING

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/reporting/generate.ts:214,287,294-308`
**Also:** `scripts/generate-haoo-report.mjs:26-29,69-71`

**Issue:** `generateHaooReport` computes a precise `reason` for every failure —
`missing-credentials`, `invalid-current-7`, `invalid-previous-30`, `invalid-all-time`,
`generation-failed` — and the only consumer throws it away:

```js
if (!result.ok) {
  writeTerminalError(ERROR_STATE_SENTENCE);   // reason never printed
  process.exitCode = 1;
}
```

The single sentence says "Check the API key and network connection, then run the command again." One
reachable failure makes that instruction permanently wrong. `temporaryPath` is a fixed sibling
(`${outputPath}.tmp`) reserved with `openSync(path, 'wx')`. If a run is killed between reservation and
rename — Ctrl-C, SIGKILL, a laptop lid — the sibling survives, `ownsTemporaryPath` is `false` on the next
run so the cleanup branch deliberately does not remove it, and every subsequent run fails at reservation
with `generation-failed`. The owner is told to check a key and a network that are both fine, and nothing
anywhere names the leftover file. The code comment at lines 303-306 knows this state exists; the
owner-facing output does not.

**Fix:** Surface the reason, and name the recoverable state explicitly.

```js
if (!result.ok) {
  writeTerminalError(`Report not updated (${result.reason}).`, ERROR_STATE_SENTENCE);
  if (result.reason === 'generation-failed') {
    writeTerminalError(
      `If a previous run was interrupted, remove the reserved sibling ${OUTPUT_PATH}.tmp and run again.`,
    );
  }
  process.exitCode = 1;
}
```

Prefer distinguishing the reservation failure from other filesystem failures with its own reason
(`temporary-path-reserved`) so the message is driven by a fact rather than by a guess. Add a test that
pre-creates the `.tmp` sibling and asserts both the non-zero exit and the sibling being named in stderr.

### WR-02 (WARNING): The `.mjs` lint block misses one of the project's `.mjs` modules, and its comment is now false

**Classification:** WARNING

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/eslint.config.js:113-125`

**Issue:** The block is introduced by "The credentialed report CLI is the only `.mjs` module in the
project. Without this block it is parsed but never rule-checked". The project now has three `.mjs`
modules: `scripts/generate-haoo-report.mjs`, `scripts/assert-phase1-red.mjs`, and
`src/test/fixtures/haoo-report-cli-fetch-preload.mjs`. The `files: ['scripts/**/*.mjs']` pattern covers the
first two and misses the third, which lands in exactly the state the comment describes as unacceptable —
confirmed:

```text
$ npx eslint --print-config src/test/fixtures/haoo-report-cli-fetch-preload.mjs   → rules: 0, globals: []
$ npx eslint --print-config scripts/generate-haoo-report.mjs                      → rules: 61
```

That unchecked file replaces `globalThis.fetch`, reads `process.env`, parses request bodies, and registers
a `process.once('exit')` writer; it is the module that decides whether the credentialed-CLI test can see
the network at all. `npm run lint` cannot catch a defect in it.

**Fix:** Widen the pattern and correct the comment.

```js
files: ['scripts/**/*.mjs', 'src/test/fixtures/**/*.mjs'],
```

or simply `files: ['**/*.mjs']`. Then re-run `npx eslint --print-config` on the fixture and assert a
non-zero rule count, mirroring the source-boundary assertions already in `build-output.test.ts`.

### WR-03 (WARNING): 04-13 prose asserts a name-only guarantee the type does not provide

**Classification:** WARNING

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/measurement/plausible.ts:18-29`

**Issue:** The new docblock says: "There is no property-bag parameter here because the seam does not carry
one — the shape of this type is part of the name-only contract." The type immediately below is:

```ts
export interface PlausibleGlobal {
  (...args: unknown[]): void;
  ...
}
```

`(...args: unknown[]): void` accepts any number of arguments of any type, including a property bag. The
type carries no name-only contract at all — and it cannot, because the same signature has to accept the
queue-forwarding stub. The actual enforcement lives in the sink body (`provider(event)`, line 236), in
`MEASUREMENT_TRACK_ARGUMENT_COUNT`, and in the `build-output.test.ts` scans
(`/(?:track|eventSink)\s*\([^,\n]+,/` and `expect(source).not.toMatch(/eventSink\?\.\(event\s*,/)`). Since
"no property bag" is one of this phase's load-bearing privacy claims and 04-13 was a truthfulness pass,
prose that credits the guarantee to the wrong mechanism is a defect in exactly the artifact 04-13 produced:
a future reader may weaken the sink believing the type still holds the line.

**Fix:** Attribute the guarantee to the mechanism that provides it.

```ts
/**
 * ... The call signature is variadic because the pre-load stub must forward whatever it
 * is handed, so the name-only contract is NOT enforced by this type: it is enforced by
 * the sink below, which passes exactly `event`, by MEASUREMENT_TRACK_ARGUMENT_COUNT, and
 * by the second-argument scans in `src/test/build-output.test.ts`.
 */
```

### WR-04 (WARNING): The local test run executes 240+ stale tests from an un-ignored Phase-3 git worktree

**Classification:** WARNING

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/.gitignore:78-85`
**Also:** `vitest.config.ts` (no `test.exclude`), `package.json:11-12`

**Issue:** `npx vitest run` in this repository reports `Test Files 21 passed / Tests 761 passed`, and ten of
those files are not in `src/test/` at all:

```text
✓ .claude/worktrees/rf-03-retry-1788205465/src/test/measurement.test.ts    (77 tests)
✓ .claude/worktrees/rf-03-retry-1788205465/src/test/build-output.test.ts   (25 tests)
✓ .claude/worktrees/rf-03-retry-1788205465/src/test/qualify-data.test.ts   (41 tests)
... 10 files total
```

`git worktree list` shows `.claude/worktrees/rf-03-retry-1788205465` is a registered worktree pinned at
commit `8974958` on `gsd-reviewfix/03-retry-...` — a Phase-3 snapshot with its own `src/`, `dist/`, and
`node_modules/` (21 MB). Vitest's default `exclude` covers `**/node_modules/**` and `**/dist/**` but not
`.claude/**`, so the runner picks the snapshot up. Three consequences:

1. The phase's "all tests pass" evidence mixes 137 current `measurement.test.ts` cases with 77 superseded
   ones. Nothing in the output distinguishes them.
2. The stale `build-output.test.ts` resolves `ROOT` to the worktree, so it asserts freshness and boundary
   compliance against *that* tree's `src/` and `dist/`. It is green regardless of what the reviewed tree
   contains, which is a false signal that reads as coverage.
3. `.gitignore` was edited in this phase (`.reports/`, `.env.*`) but does not list `.claude/`, and
   `git check-ignore -v .claude/worktrees` exits 1 — `git status` reports `?? .claude/`, so a
   `git add -A` invites a duplicate source tree into a commit.

CI is unaffected (the directory is untracked, so `npm run test:unit` on a fresh checkout sees only
`src/test/`), which is precisely why this only degrades the *local* verification evidence the phase was
signed off with.

**Fix:** Ignore the agent runtime directory and pin the runner's scope.

```gitignore
# Local agent runtime, including throwaway git worktrees that carry their own src/ and dist/.
.claude/
```

```ts
// vitest.config.ts
test: {
  include: ['src/test/**/*.test.{ts,tsx}'],
  exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  ...
}
```

Then remove the stale worktrees with `git worktree remove` (or `git worktree prune` after deleting them)
and re-run the suite so the recorded pass count describes the reviewed tree only.

## Info

### IN-01: Three consumed `VITE_` variables are undeclared and untyped, and the provider domain is unvalidated

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/vite-env.d.ts:16-22` and
`src/products/haoo.ts:174-179`

**Issue:** `ImportMetaEnv` declares only `VITE_HAOO_FORM_ENDPOINT?`, but `haoo.ts` also reads
`VITE_HAOO_MEASUREMENT_PROVIDER`, `VITE_HAOO_PLAUSIBLE_SRC`, and `VITE_HAOO_PLAUSIBLE_DOMAIN`. Those
compile only through `vite/client`'s `[key: string]: any` index signature, so all three are `any` at the
build-configuration boundary the file's own docblock exists to document. Separately, `src` is validated
exhaustively (protocol, credentials, query, fragment, extension, exact origin, exact path) while `domain`
is only `.trim()`ed before being handed to a foreign global's `init`.

**Fix:** Declare all four keys as `readonly ... ?: string` in `ImportMetaEnv` so a typo is a typecheck
error, and give the domain a minimal shape guard (a lowercase hostname pattern) that fails closed to `''`
the way `resolvePlausibleScriptSrc` does.

### IN-02: Unreachable defensive fallbacks in the report renderer

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/reporting/render.ts:390-394`

**Issue:** `bounded` is `period.previousCounts !== null && period.days !== null`, so inside the `bounded`
branch `period.previousCounts ?? {}` and `period.days ?? 0` can never take their right-hand side. The dead
`?? 0` in particular would silently render "vs previous 0 days" if the guard were ever loosened.

**Fix:** Narrow once and use the narrowed values:
`if (period.previousCounts !== null && period.days !== null) { const previous = period.previousCounts; const days = period.days; ... }`.

### IN-03: Duplicate `emailLabel` values across product fields silently drop a field from the delivered email

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/components/qualify-form.logic.ts:259-271`

**Issue:** The loop throws for a reserved label but writes `body[field.emailLabel] = value` without
checking whether an earlier field already claimed that key. Two fields sharing an `emailLabel` means the
later one silently overwrites the earlier one and an answer the visitor typed never reaches the inbox —
the same failure mode the reserved-label guard exists to prevent, one step down.

**Fix:** Track seen labels and throw with the same fail-closed shape:

```ts
if (Object.prototype.hasOwnProperty.call(body, field.emailLabel)) {
  throw new Error(`Field "${field.name}" reuses email label "${field.emailLabel}"`);
}
```

### IN-04: `formatEngagementSummary`'s docblock says it never throws, but its guard runs outside the try

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/products/engagement-summary.ts:140-160`

**Issue:** "Any failure yields the authored fallback rather than throwing, because a summary must never
block, delay, or fail a submission." `requireSummaryCopy(config)` is called on line 152, before the `try`,
and throws on a missing `emailLabel` or `fallback`. Behaviour is currently fine because
`QualifyForm.engagementSummary()` catches it (`QualifyForm.tsx:286-290`), but the sentence describes a
property this function does not have.

**Fix:** Either move the guard inside the `try` and return `config?.fallback ?? ''`, or amend the sentence
to say that a *misconfigured product* throws deliberately and only *runtime* failures fall back.

### IN-05: The Phase 4 capability audit is not wired into any script or workflow

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/scripts/verify-phase4-coverage.mjs:144-161`
**Also:** `package.json:6-16`, `.github/workflows/deploy.yml`

**Issue:** `auditPhase4Coverage` enforces 41 required capability decisions and the operational-boundary
sentences, but nothing runs it: there is no `npm run` entry and no CI step, and every reference outside the
file itself is a hand-typed command line in a planning document. A `COVERAGE.md` edit that flips an OPT-OUT
row to INTEGRATE — the row set that gates automatic capture — would not fail any automated gate.

**Fix:** Add `"verify:coverage": "node scripts/verify-phase4-coverage.mjs .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/COVERAGE.md"`
to `package.json` and invoke it from the workflow's verification job (or from a Vitest case that imports
`auditPhase4Coverage` directly, which keeps it inside `npm run test:unit`).

### IN-06: A vendor runtime behaviour is stated as fact where the sibling fixture disclaims exactly that claim

**File:** `/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB/src/measurement/plausible.ts:85-91`

**Issue:** "calls made before the site script arrives are pushed onto `q` and drained by the script on
load, so an accepted event emitted during the first moments of a visit is not silently lost." The draining
is the vendor script's behaviour, not this module's, and `src/test/fixtures/plausible-preload-contract.ts:390-401`
— the other file 04-13 touched — is explicit that a documentation transcription "is not evidence about what
the real script does at runtime" and defers the question to the live gate in `04-USER-SETUP.md`. The
`recordsOptOut` docblock (lines 104-123) hedges correctly for the same class of claim. This one does not,
so within one file the same standard is applied inconsistently.

**Fix:** Hedge it the same way: "...pushed onto `q`, which the documented vendor preload contract says the
site script drains on load. Whether it does so is an external contract settled by the live gate; what this
module guarantees is that an accepted event is enqueued rather than dropped."

---

_Reviewed: 2026-09-02T11:23:08Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
