---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
reviewed: 2026-09-02T05:56:38Z
depth: standard
scope: gap-closure-only
scope_note: >
  This review covers ONLY the source changes made by gap-closure plans 04-08, 04-09 and
  04-10 (git range 56d6e98~1..HEAD). The full-phase review of 2026-09-01 is preserved at
  04-REVIEW-pre-gap-closure.md and its findings are not restated here except where this
  review verifies their closure.
diff_base: 56d6e98~1
files_reviewed: 10
files_reviewed_list:
  - config/approved-analytics-script-sources.ts
  - src/products/haoo.ts
  - src/measurement/plausible.ts
  - src/reporting/generate.ts
  - vite.config.ts
  - src/vite-env.d.ts
  - src/test/measurement.test.ts
  - src/test/haoo-report.test.ts
  - src/test/build-output.test.ts
  - README.md
prior_findings:
  CR-01: closed
  CR-02: closed-with-residual-risk
  WR-01: closed-with-residual-defect
findings:
  critical: 0
  warning: 6
  info: 7
  total: 13
status: issues_found
---

# Phase 04: Code Review Report (gap-closure re-review)

**Reviewed:** 2026-09-02T05:56:38Z
**Depth:** standard
**Files Reviewed:** 10
**Scope:** gap-closure changes only (`56d6e98~1..HEAD`)
**Status:** issues_found

## Summary

All three prior findings were addressed with real code, not documentation. I verified the
closures empirically rather than reading the summaries:

- **CR-01 — closed.** I built the app twice out-of-tree. A provider-unset build inlines
  `var Ia=[]` and contains no analytics origin at all; a `VITE_HAOO_MEASUREMENT_PROVIDER=plausible`
  build inlines `var Ia=[{origin:"https://plausible.io",paths:["/js/script.js"]}]`. With
  `VITE_HAOO_PLAUSIBLE_SRC="https://cdn.attacker.example/js/script.js"` the tampered string is
  inlined as *data* and the minified resolver in the shipped bundle still ends with
  `!t.some(i=>i.origin===r.origin&&i.paths.includes(r.pathname))?"":n` — the foreign origin
  resolves to `""`. The approved list has exactly one route into the bundle and it is derived
  from a version-controlled literal, never from `env`. I could not find a build-time or
  runtime input that widens it. I also probed the parser for divergence between
  `new URL(candidate)` and the browser's resolution of the same string as a `script[src]`
  (interior tab/LF stripping, `\` authority termination, percent-encoding, `..` normalisation,
  bare `?`/`#`, uppercase host, non-default port) and found no case that is approved by the
  resolver but fetched from a different origin or path.

- **CR-02 — closed, with residual risk.** Script insertion is now genuinely unreachable until
  `resolveInitializedProvider` returns non-null: the absent-`init`, throwing-`init` and
  silent-`init` paths all return `undefined`, append zero scripts, and leave a foreign
  callable global byte-identical. That is a real fix. The residual is that the "confirmation"
  itself proves less than the code comments and the 04-09 coverage rows claim (WR-01 below).

- **WR-01 — closed, with a residual defect.** `directoryOf` now finds both separators and
  guards a bare drive designator. I probed 15 destination shapes; the five in the new contract
  table are correct, but a POSIX destination whose *final* segment contains a backslash yields
  the wrong parent and creates an unintended directory (WR-04 below), and UNC roots are not
  guarded the way `C:` is (IN-05).

`npm run typecheck`, `npx tsc -p tsconfig.node.json`, `npm run lint` and `npx vitest run`
(752 tests) all pass on the reviewed tree. No Critical findings. The six warnings below are
gaps in the *strength* of the new controls and in the accuracy of the claims made about them,
not regressions of the closed blockers.

## Narrative Findings (AI reviewer)

## Critical Issues

None found. See the Summary for the evidence used to reach that conclusion.

## Warnings

### WR-01 (WARNING): The recorded opt-out "confirmation" is a tautology on the primary path and spoofable on the adopted path

**File:** `src/measurement/plausible.ts:113-118,140-164`

**Issue:** `recordsOptOut` is presented as proof — "Requiring the recorded value ... is what
makes 'automatic pageview capture is disabled' *provable* instead of assumed" (line 109-111),
and 04-09 coverage row D1 states "Automatic pageview capture is confirmed disabled before any
provider script is appended". Neither holds:

1. **Primary path (no ambient global).** `installProviderStub` writes `stub.o = options`, and
   `recordsOptOut(stub.o, options.domain)` then compares that object against the very
   `options` object the caller constructed at line 200-203, where `autoCapturePageviews` is a
   `false` literal. The check can never fail. It confirms only that the project's own stub
   stored the object the project handed it. The vendor script that will actually decide
   whether pageviews are auto-captured has not been appended yet (line 206) and is never
   observed. The only evidence that it honours `o` is
   `src/test/fixtures/plausible-preload-contract.ts`, a hand-written transcription that
   asserts the same assumption it is meant to test.
2. **Adopted path (foreign `window.plausible`).** Any script that reached the global first can
   satisfy the check with `init = (o) => { self.o = o }` while enabling whatever capture it
   likes. The code comment acknowledges the input is untrusted but the conclusion drawn from
   it does not survive that acknowledgement.

The net effect is that a control described as fail-closed is, in the case that matters most
(a live deploy with a real vendor script), unverified.

**Fix:** Stop describing the stub echo as confirmation, and move the assertion to where it can
actually fail. Concretely:

```ts
// Distinguish the two cases explicitly rather than running one check over both.
const provider = adopted ? existing : installProviderStub(scope);
if (!adopted) {
  // Self-installed stub: the opt-out is *recorded*, not confirmed. Whether the vendor
  // script honours `o` is an external contract — pin it with a human gate, not a self-test.
  provider.init(options);
  return provider;
}
// Adopted foreign global: an echo proves nothing about an adversary, so refuse outright
// unless the deployment has explicitly opted into adopting a pre-existing provider.
return null;
```

Then add a human-verified gate to `04-USER-SETUP.md` ("after enablement, confirm in the
Plausible dashboard that no unattributed automatic pageviews appear") and downgrade the D1
coverage row from `kind: unit` to a human-judgment row, since no executable test can establish
the vendor's behaviour.

---

### WR-02 (WARNING): The approved-source allowlist is not enforced where the script is actually inserted, and the check is bypassable through an exported parameter

**File:** `src/products/haoo.ts:102-105`, `src/measurement/plausible.ts:191,206`

**Issue:** The entire T-04-27 control depends on exactly one call site —
`resolvePlausibleScriptSrc(import.meta.env.VITE_HAOO_PLAUSIBLE_SRC)` at
`src/products/haoo.ts:180`. `createPlausibleEventSink` re-validates nothing: line 191 checks
only `providerScript.src === ''`, and line 206 hands whatever string it was given straight to
`setAttribute('src', ...)`. Two ways that decays:

- `resolvePlausibleScriptSrc` is exported with an *optional* `approvedSources` parameter
  (line 104). Any future `src/` module can call
  `resolvePlausibleScriptSrc(untrusted, [{ origin: new URL(untrusted).origin, paths: [...] }])`
  and get an arbitrary origin back. The build-output guard at
  `src/test/build-output.test.ts:578` only forbids *importing* `config/approved-analytics-script-sources`;
  it cannot see a hand-built list.
- Any future caller that constructs `ProductMeasurement.providerScript` without going through
  the resolver (a second product, a feature flag, a test helper leaking into `src/`) reaches
  script insertion with no approval check at all.

**Fix:** Keep the injectable seam private and re-assert the invariant at the insertion point:

```ts
// haoo.ts — internal, injectable for tests via a named test-only export
function approveScriptSrc(candidate: string, sources: readonly ApprovedScriptSource[]): string { /* ... */ }
export function resolvePlausibleScriptSrc(configuredValue?: string): string {
  return approveScriptSrc((configuredValue ?? '').trim(), buildTimeApprovedScriptSources());
}

// plausible.ts — defence in depth at the only place a script element is created
function appendProviderScript(documentRef: Document, src: string): void {
  if (resolvePlausibleScriptSrc(src) !== src) return; // never insert an unapproved source
  // ...
}
```

Add a source-scan case to `build-output.test.ts` asserting `resolvePlausibleScriptSrc(` appears
exactly once outside `src/test/`.

---

### WR-03 (WARNING): The tampered-build-variable threat is only half closed — `VITE_HAOO_PLAUSIBLE_DOMAIN` is entirely unvalidated

**File:** `src/products/haoo.ts:181`

**Issue:** 04-08 pinned *where the script comes from* but left *where the data goes*
unconstrained. `domain: (import.meta.env.VITE_HAOO_PLAUSIBLE_DOMAIN ?? '').trim()` accepts any
non-empty string and is forwarded verbatim into `provider.init({ domain, ... })`
(`src/measurement/plausible.ts:200-203`). Under exactly the threat model 04-08 adopted — a
changed or tampered public build variable — an attacker who can set that variable routes every
HAOO visitor's page URL, referrer and event names into a Plausible property they own, without
touching the script source at all. The README's new section (line 83-84) is carefully scoped to
"loading arbitrary first-party JavaScript", but a reader will reasonably take the whole
tampered-variable class as closed. It is not.

This is a Warning rather than a Blocker because it yields no code execution and no access to
form values — only aggregate visit telemetry misrouted to a third party.

**Fix:** Add the site domain to the same repository-owned trust anchor and validate it with the
same exact-match discipline:

```ts
// config/approved-analytics-script-sources.ts
export const APPROVED_ANALYTICS_SITE_DOMAINS: readonly string[] =
  Object.freeze(['www.zero-paperhub.com']);

// haoo.ts
export function resolvePlausibleDomain(
  configuredValue?: string,
  approvedDomains: readonly string[] = buildTimeApprovedSiteDomains(),
): string {
  const candidate = (configuredValue ?? '').trim().toLowerCase();
  return approvedDomains.includes(candidate) ? candidate : '';
}
```

Carry it through the same provider-gated `define`, and add rejection rows to the
`scriptSrcRows` table's sibling for a foreign domain.

---

### WR-04 (WARNING): `directoryOf` treats `\` as a separator on POSIX, where it is a legal filename character

**File:** `src/reporting/generate.ts:111-121`

**Issue:** `Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))` is unconditional, but the
module has no way to know which host it is on — and on POSIX a backslash is an ordinary
character in a filename. Probed behaviour:

```text
"/home/u/.reports/re\\port.html"  => "/home/u/.reports/re"   // wrong parent
"out\\report.html"                => "out"                   // wrong parent
```

`generateHaooReport` then calls `options.fs.mkdirSync('/home/u/.reports/re', { recursive: true })`
(line 268), creating a directory that is not the destination's parent and that nothing ever
removes, before writing the real file. The bundled CLI is not reachable here because
`OUTPUT_PATH` has a fixed basename (`scripts/generate-haoo-report.mjs:32`), but
`generateHaooReport` is an exported function whose `outputPath` is a caller-supplied string, and
the new contract table (`src/test/haoo-report.test.ts:861-889`) does not cover the case.

**Fix:** Make the separator set a property of the destination rather than unconditional — a
Windows path is identifiable by a drive designator or a UNC prefix, and no `node:path` import is
needed:

```ts
function directoryOf(path: string): string {
  const windowsShaped = /^[A-Za-z]:/.test(path) || path.startsWith('\\\\');
  const separator = windowsShaped
    ? Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
    : path.lastIndexOf('/');
  if (separator <= 0) return '';
  const directory = path.slice(0, separator);
  return /^[A-Za-z]:$/.test(directory) ? '' : directory;
}
```

Add table rows for `/home/u/.reports/re\port.html` (expect `/home/u/.reports`) and
`out\report.html` (expect `null`).

---

### WR-05 (WARNING): The three environment keys that gate the whole control are undeclared, so a typo typechecks and silently disables analytics

**File:** `src/vite-env.d.ts:18-20`

**Issue:** `ImportMetaEnv` declares only `VITE_HAOO_FORM_ENDPOINT`, yet
`VITE_HAOO_MEASUREMENT_PROVIDER`, `VITE_HAOO_PLAUSIBLE_SRC` and `VITE_HAOO_PLAUSIBLE_DOMAIN`
are all read at `src/products/haoo.ts:178-181` and are the inputs the entire 04-08/04-09 control
surface is built around. `vite/client`'s index signature makes every unknown key `any`. I
verified this: a file containing
`const a: string | undefined = import.meta.env.VITE_HAOO_PLAUSABLE_SRC_TYPO;` compiles cleanly
under `npm run typecheck`. A misspelling in the deploy workflow's `env` block therefore produces
a green build, a green lint, a green typecheck, and a production site with analytics silently
off. 04-08 edited this exact file to add a doc block about build-time configuration and did not
take the opportunity.

**Fix:**

```ts
interface ImportMetaEnv {
  readonly VITE_HAOO_FORM_ENDPOINT?: string;
  readonly VITE_HAOO_MEASUREMENT_PROVIDER?: string;
  readonly VITE_HAOO_PLAUSIBLE_SRC?: string;
  readonly VITE_HAOO_PLAUSIBLE_DOMAIN?: string;
}
```

---

### WR-06 (WARNING): A configured-but-rejected script source produces no signal anywhere

**File:** `vite.config.ts:27-31`, `src/products/haoo.ts:180`

**Issue:** When `VITE_HAOO_MEASUREMENT_PROVIDER=plausible` but `VITE_HAOO_PLAUSIBLE_SRC` is not
on the approved origin/path, the resolver returns `''` and `createPlausibleEventSink` returns
`undefined` with no console output — `expectSilent` in the new journey tests
(`src/test/measurement.test.ts`) pins that silence as a contract. The build succeeds, the page
works, and nothing anywhere reports that the operator's deliberate enablement did not take
effect. This is a foreseeable first-run outcome: `04-USER-SETUP.md` sends the owner to
Plausible's Site Installation page, which commonly offers extension-variant script URLs, and
04-08 deliberately approves only the base path. The setup checklist mitigates this but is a
human gate that can be skipped.

**Fix:** `vite.config.ts` already holds both values at build time. Fail the build loudly rather
than shipping a silently inert bundle:

```ts
const provider = (env.VITE_HAOO_MEASUREMENT_PROVIDER ?? '').trim().toLowerCase();
const approved = approvedScriptSourcesForProvider(provider);
if (provider === 'plausible' && !isApproved(env.VITE_HAOO_PLAUSIBLE_SRC, approved)) {
  throw new Error(
    'VITE_HAOO_MEASUREMENT_PROVIDER=plausible but VITE_HAOO_PLAUSIBLE_SRC is not on the '
    + 'approved origin/path. Analytics would ship disabled. See config/approved-analytics-script-sources.ts.',
  );
}
```

Extract the approval predicate into `config/` so `vite.config.ts` and `haoo.ts` share one
implementation rather than the current two independent normalisations.

## Info

### IN-01: The stub-removal branch in `refuse()` is unreachable dead code, and 04-09 claims it as a mitigation

**File:** `src/measurement/plausible.ts:149-152`

**Issue:** `if (!adopted) delete scope.plausible;` can never execute. When `!adopted`,
`provider` is the stub from `installProviderStub`, whose `init` assigns `stub.o = options` and
cannot throw, and `recordsOptOut(options, options.domain)` is unconditionally true (see WR-01).
So `refuse()` is only ever reached with `adopted === true`. All three refusal fixtures in
`src/test/measurement.test.ts` are adopted-path fixtures and assert the *opposite* branch
(`scope.plausible` unchanged), so nothing covers this line. 04-09's key decision "A stub
installed by this call is deleted from the scope when initialization is refused" has no
executable evidence behind it.

**Fix:** Either delete the branch and the claim, or make it reachable by having
`installProviderStub` return a stub that can legitimately fail (it cannot today), and add a
covering test.

### IN-02: `installProviderStub` clobbers a pre-existing non-function `plausible`, contradicting the "never replaced" comment

**File:** `src/measurement/plausible.ts:92-102,140-142`

**Issue:** `adopted` is `typeof existing === 'function'`. If `scope.plausible` is a non-function
truthy value (an object-shaped provider, a value set by a tag manager), `adopted` is false and
line 142 overwrites it with the stub; because of IN-01 it is never restored either. The
docstring at lines 128-134 says a foreign global "is adopted, never replaced or wrapped", which
is only true for the callable case.

**Fix:** Refuse when `scope.plausible !== undefined && typeof scope.plausible !== 'function'`,
or narrow the docstring to the callable case.

### IN-03: The approved-source shape is written three times with no compile-time link

**File:** `config/approved-analytics-script-sources.ts:20-23`, `src/vite-env.d.ts:41-43`, `src/products/haoo.ts:56-59`

**Issue:** `ApprovedAnalyticsScriptSource`, the inline shape in the ambient declaration, and
`ApprovedScriptSource` are three independent declarations of the same contract. The separation
is deliberate (no `src/` import edge, no `export` in the ambient file), but nothing detects
drift: adding a field to the config interface leaves the other two silently stale.

**Fix:** Add a compile-time bridge in the test tree, which is already allowed to import the
config module — e.g. in `src/test/measurement.test.ts`:
`const _shape: readonly ApprovedScriptSource[] = APPROVED_ANALYTICS_SCRIPT_SOURCES;` plus the
reverse assignment, so either direction of drift fails `npm run typecheck`.

### IN-04: The resolver returns the raw candidate rather than the parsed URL, and `Object.freeze` gives no runtime protection in the shipped bundle

**File:** `src/products/haoo.ts:138`, `config/approved-analytics-script-sources.ts:34-40`

**Issue:** Two small distance-from-the-claim items. (a) Line 138 returns `candidate`, so the
string set as `script[src]` is the operator's text, not the validated `URL` — approval and
emission are on two different values. I found no exploitable divergence (see Summary), but
returning `url.href` removes the class entirely at zero cost. (b) The `Object.freeze` calls do
not survive to the browser: the build inlines the define as `var Ia=[{...}]`, a plain mutable
array. Immutability at runtime comes from ES-module scoping and the fact that
`resolvePlausibleScriptSrc` is evaluated once at module init, not from freezing.

**Fix:** `return url.href;` and add a comment recording that the freeze is a
repository-configuration guard only.

### IN-05: The drive-root guard has no UNC counterpart, and the contract table omits UNC, mixed and trailing separators

**File:** `src/reporting/generate.ts:111-121`, `src/test/haoo-report.test.ts:861-889`

**Issue:** The docstring justifies the `C:` guard by "a refusal there would turn a working run
into a caught generation failure". The same argument applies to a UNC root, which is not
guarded: `\\server\share\haoo.html` yields `\\server\share` and `\\server\haoo.html` yields
`\\server`, both handed to `mkdirSync(..., { recursive: true })`. Real-world impact is nil for
the CLI (its destination is always nested under `.reports`), but the rule is stated more
generally than it is implemented. The five-row table also does not cover UNC paths, mixed
separators (`c:/project/.reports/x.html`), drive-relative paths (`C:haoo.html`) or trailing
separators, all of which I probed and all of which currently behave acceptably — untested rather
than broken.

**Fix:** Extend the guard to `/^\\\\[^\\]+(\\[^\\]+)?$/` and add the probed rows to
`DIRECTORY_EXTRACTION_TABLE`.

### IN-06: The vite-define assertion is a regex over source text that a widening edit could still satisfy

**File:** `src/test/build-output.test.ts:592-604`

**Issue:** The test asserts `vite.config.ts` *contains* the substring
`approvedScriptSourcesForProvider(env.VITE_HAOO_MEASUREMENT_PROVIDER)`. It does not assert that
this is the value assigned to the define. A future edit such as
`JSON.stringify([...approvedScriptSourcesForProvider(env.VITE_HAOO_MEASUREMENT_PROVIDER), ...extra])`
satisfies the regex while widening the contract — precisely the failure the test exists to catch.

**Fix:** Assert on the artefact instead of the source: build once with the provider unset and
once with `plausible`, and assert the bundle contains no analytics origin in the first case and
exactly the canonical contract in the second. The suite already has the machinery
(`builtBundleText()`), and I confirmed both properties hold today.

### IN-07: Stale worktree copies of the suite are collected by vitest, inflating the test counts cited as gap-closure evidence

**File:** (root cause outside review scope) `vitest.config.ts` — no `test.exclude`; untracked `.claude/worktrees/rf-03-retry-1788205465/`

**Issue:** `npx vitest run` reports "21 passed" test files, but ten of them are duplicates from
an untracked leftover recovery worktree running an *older* version of the code
(`.claude/worktrees/.../src/test/measurement.test.ts` runs 77 tests; the reviewed
`src/test/measurement.test.ts` runs 135). The 04-09 summary cites "npm test — 747 tests passed
across 21 files" as verification evidence; roughly half of that file count is stale duplication,
and a regression introduced in the worktree copy would be reported as a failure of the real
suite. Noted because it weakens the evidentiary value of the gap-closure summaries, not because
the reviewed files are at fault.

**Fix:** Add `exclude: [...configDefaults.exclude, '.claude/**', '**/worktrees/**']` to
`vitest.config.ts` and add `.claude/worktrees/` to `.gitignore`.

---

_Reviewed: 2026-09-02T05:56:38Z_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
_Scope: gap-closure changes only (plans 04-08, 04-09, 04-10; `git diff 56d6e98~1..HEAD`)_
