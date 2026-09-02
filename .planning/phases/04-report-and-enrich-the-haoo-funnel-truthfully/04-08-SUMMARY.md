---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
plan: 08
subsystem: infra
tags: [vite, define, analytics, plausible, supply-chain, url-validation, tdd]

# Dependency graph
requires:
  - phase: 04-report-and-enrich-the-haoo-funnel-truthfully
    provides: "The Plausible provider seam — resolveMeasurementProvider, resolvePlausibleScriptSrc, createPlausibleEventSink, and the provider-unset bundle and src/ origin scans (04-05)"
provides:
  - "config/approved-analytics-script-sources.ts — a version-controlled, non-bundled approved analytics origin/path contract that no deployment variable can widen"
  - "Provider-gated build-time injection of that contract as __HAOO_APPROVED_ANALYTICS_SCRIPT_SOURCES__, empty unless the build deliberately selected plausible"
  - "Origin-and-path-constrained fail-closed resolvePlausibleScriptSrc with an injectable approved-source parameter"
  - "Adversarial resolver rows: foreign origin, suffix-lookalike host, unapproved extension-variant path, non-default port, and the no-contract fail-closed default"
  - "A build-output invariant that no production src/ module can import the approved-source contract, plus a derived assertion on the vite define wiring"
  - "Owner documentation of the approved script URL and its fail-closed consequence"
affects: [phase-05, deployment, analytics-enablement, security-review]

actuals:
  tokens: 28903
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Repository-owned trust anchor outside src/, delivered to the browser only as a provider-gated Vite build-time constant"
    - "Fail-closed default via try/catch around a possibly-absent define constant"
    - "Test tables derived from the canonical contract instead of re-typed literals"

key-files:
  created:
    - config/approved-analytics-script-sources.ts
  modified:
    - vite.config.ts
    - src/vite-env.d.ts
    - src/products/haoo.ts
    - src/test/measurement.test.ts
    - src/test/build-output.test.ts
    - README.md
    - .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md

key-decisions:
  - "The approved-source contract lives in config/ outside src/ so its origin literal is never a production build input and cannot be reached by an ordinary module import"
  - "The contract reaches the browser only through a Vite define gated on the resolved provider, so a provider-unset build inlines an empty array and the existing bundle scan stays green unweakened"
  - "Approval is exact URL.origin equality plus exact pathname membership — never a substring, prefix, or suffix test"
  - "Only the base script path /js/script.js is approved; every Plausible extension variant is an OPT-OUT coverage row, so a variant URL fails closed rather than partially enabling capture"
  - "An uppercase host is accepted because URL.origin lowercases it; a non-default port is rejected because the port is part of the origin"
  - "The resolver still returns the trimmed candidate rather than url.href, preserving the configured destination byte-for-byte as resolveQualifyEndpoint already does"

patterns-established:
  - "Trust anchor pattern: security-relevant allowlists live in reviewed repository configuration, and public build variables may only select from them, never extend them"
  - "Single-route pattern: a sensitive literal reaches the bundle through exactly one deliberate build-time route, and a boundary test proves no second route exists"

requirements-completed: [MEAS-01, MEAS-08]

coverage:
  - id: D1
    description: "A structurally valid HTTPS .js URL on any origin outside the repository-owned approved contract resolves to the empty string, so no provider script is ever appended"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider resolution > resolves a structurally valid foreign origin to the named script source"
        status: pass
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider resolution > resolves a lookalike host carrying the approved host as a suffix-style label to the named script source"
        status: pass
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider resolution > resolves the approved host on a non-default port to the named script source"
        status: pass
    human_judgment: false
  - id: D2
    description: "An approved-origin URL on any pathname outside the approved path list — including every Plausible extension variant — resolves to the empty string"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider resolution > resolves the approved origin on an unapproved extension-variant path to the named script source"
        status: pass
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider resolution > resolves the approved origin on an unapproved nested path to the named script source"
        status: pass
    human_judgment: false
  - id: D3
    description: "The resolver fails closed when no approved-source contract is supplied, so an absent build-time constant approves nothing rather than everything"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider resolution > fails closed when no approved-source contract is supplied"
        status: pass
    human_judgment: false
  - id: D4
    description: "The approved contract is carried into a build only when the resolved provider is exactly plausible, so a provider-unset bundle contains no analytics origin"
    requirement: "MEAS-08"
    verification:
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider resolution > carries the approved contract into the build for %s only when entitled"
        status: pass
      - kind: integration
        ref: "src/test/build-output.test.ts#Phase 1 static build contracts > ships the unset provider bundle without identity, property, queue, SDK, or credential seams"
        status: pass
      - kind: other
        ref: "grep -rc 'plausible.io' dist/assets/*.js (provider-unset build) => 0; VITE_HAOO_MEASUREMENT_PROVIDER=plausible build => origin:\"https://plausible.io\",paths:[\"/js/script.js\"]"
        status: pass
    human_judgment: false
  - id: D5
    description: "The approved origin has exactly one route into a bundle — no production src/ module may import the approved-source contract, and the vite define wiring is pinned to the provider-gated selector"
    requirement: "MEAS-08"
    verification:
      - kind: integration
        ref: "src/test/build-output.test.ts#Phase 1 static build contracts > keeps the approved-source contract out of every production module import graph"
        status: pass
      - kind: integration
        ref: "src/test/build-output.test.ts#Phase 1 static build contracts > injects the approved-source constant only through the provider-gated selector"
        status: pass
      - kind: integration
        ref: "src/test/build-output.test.ts#Phase 1 build artifact freshness > rejects outputs older than the newest production build input"
        status: pass
    human_judgment: false
  - id: D6
    description: "MEAS-07 does not regress on the source-rejection path: a rejected script source appends no script, creates no sink, still returns true from track(), still updates the bounded local context, and writes nothing to the console"
    requirement: "MEAS-01"
    verification:
      - kind: integration
        ref: "src/test/measurement.test.ts#facade contract under the widened provider seam > leaves the whole journey working when the configured script source is rejected"
        status: pass
    human_judgment: false
  - id: D7
    description: "Owner documentation states the approved origin and path, the fail-closed consequence, and that widening the approved set is a reviewed repository change rather than a deployment-variable edit"
    requirement: "MEAS-08"
    verification: []
    human_judgment: true
    rationale: "Documentation adequacy for the owner audience is a judgment call — no automated assertion can confirm the wording actually prevents the owner from pasting an extension-variant URL."

# Metrics
duration: 11 min
completed: 2026-09-02
status: complete
---

# Phase 04 Plan 08: Approved analytics script source contract Summary

**`resolvePlausibleScriptSrc` now requires exact `URL.origin` equality and exact approved-pathname membership against a repository-owned contract delivered as a provider-gated Vite `define`, so a tampered `VITE_HAOO_PLAUSIBLE_SRC` can no longer load attacker-controlled first-party JavaScript.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-09-02T05:12:00Z
- **Completed:** 2026-09-02T05:23:38Z
- **Tasks:** 2
- **Files modified:** 8 (1 created, 7 modified)

## Accomplishments

- Closed verification gap 1 / review finding CR-01: the resolver no longer accepts any structurally valid HTTPS `.js` URL. Approval is exact parsed-origin equality plus exact pathname membership, pinned by a foreign-origin row, a suffix-lookalike host row (`https://plausible.io.attacker.example/...`), a non-default-port row, and two unapproved-path rows.
- Made the approved set **independently trusted**: it lives in `config/approved-analytics-script-sources.ts`, outside `src/`, and reaches the browser only through `__HAOO_APPROVED_ANALYTICS_SCRIPT_SOURCES__`, a Vite `define` gated on the resolved provider. No value of `VITE_HAOO_PLAUSIBLE_SRC`, `VITE_HAOO_MEASUREMENT_PROVIDER`, or `VITE_HAOO_PLAUSIBLE_DOMAIN` can widen it.
- Proved the gating empirically in both directions: the provider-unset build contains zero `plausible.io` occurrences in `dist/assets`, and a `VITE_HAOO_MEASUREMENT_PROVIDER=plausible` build inlines exactly `origin:"https://plausible.io",paths:["/js/script.js"]`.
- Made the fail-closed default real rather than assumed: the constant is read through a `try/catch` that swallows the `ReferenceError` an absent `define` produces, so the test runner (which uses `vitest.config.ts`, with no `define`) rejects even the approved URL on a one-argument call.
- Pinned the single-route property with two new boundary cases — no production `src/` module may reference the approved-source module by any specifier, and `vite.config.ts` must both name the constant key and derive its value from `approvedScriptSourcesForProvider(env.VITE_HAOO_MEASUREMENT_PROVIDER)`.
- Preserved MEAS-07 on the source-rejection path with a full `createMeasurement` round trip whose `providerScript.src` is the resolver's *actual* output for a foreign-origin URL: zero scripts appended, `scope.plausible` undefined, `track()` returns `true`, `brochureDownloaded` flips, console silent.

## Task Commits

Each task was committed atomically:

1. **Task 1 (tracer, TDD RED): failing approved-origin rejection rows + the trusted contract** — `56d6e98` (test)
2. **Task 1 (tracer, TDD GREEN): origin-and-path-constrained resolver + build wiring** — `d7faf8f` (feat)
3. **Task 2: no-bundle-import invariant + owner documentation** — `bd0e215` (test)

_No REFACTOR commit: the GREEN implementation is the final shape — a five-line approval check appended to the existing structural chain, with nothing to clean up._

## Files Created/Modified

- `config/approved-analytics-script-sources.ts` — **created.** The trust anchor: `ApprovedAnalyticsScriptSource`, the frozen single-entry `APPROVED_ANALYTICS_SCRIPT_SOURCES` (`https://plausible.io` + `/js/script.js`), and the provider-gated `approvedScriptSourcesForProvider`. Imports nothing from `src/`.
- `vite.config.ts` — moved to the function form of `defineConfig`, reads `loadEnv(mode, process.cwd(), 'VITE_')`, and injects the approved contract as a `define` gated on the provider. `plugins`, `base`, `optimizeDeps.exclude`, and both `rollupOptions.input` entries are unchanged.
- `src/vite-env.d.ts` — global `declare const __HAOO_APPROVED_ANALYTICS_SCRIPT_SOURCES__` with the shape written inline; still no top-level `import`/`export`, so the `ImportMetaEnv` augmentation survives.
- `src/products/haoo.ts` — exports `ApprovedScriptSource` (declared locally, no import edge into `config/`), adds the fail-closed build-time reader, and gives `resolvePlausibleScriptSrc` a second injectable `approvedSources` parameter plus the exact origin/path approval check. Every pre-existing structural rejection is unchanged.
- `src/test/measurement.test.ts` — derives `SCRIPT_SRC` from the canonical contract, evaluates every `scriptSrcRows` case against it, adds six approval rows, the no-contract fail-closed case, the six-row provider-gating table, and the MEAS-07 source-rejection regression.
- `src/test/build-output.test.ts` — adds the contract to `BUILD_INPUTS` and two new cases (import-graph invariant, derived `define`-wiring assertion). `UNCONDITIONAL_ANALYTICS_ORIGINS_FORBIDDEN`, `UNCONFIGURED_PROVIDER_ORIGIN_FORBIDDEN`, `PRODUCT_SOURCE_BOUNDARY`, and `ALWAYS_FORBIDDEN` are byte-identical.
- `README.md` — the `VITE_HAOO_PLAUSIBLE_SRC` bullet now names the approved origin and path, plus a new subsection stating the repository-change-not-variable-change rule and the fail-closed consequence.
- `04-USER-SETUP.md` — the `VITE_HAOO_PLAUSIBLE_SRC` Source cell carries the approved-URL constraint, and a new Dashboard Configuration item tells the owner to confirm the base script rather than an extension variant. No box checked; enablement stays deferred.

## Decisions Made

- **`config/` rather than `src/`.** Putting the origin literal anywhere under `src/` would inline it into every build and immediately break the provider-unset bundle scan. `config/` keeps it out of `PRODUCTION_SOURCE_INPUTS` while staying version-controlled and reviewable.
- **Exact `URL.origin` equality, never string matching.** `https://plausible.io.attacker.example` is a *prefix* of nothing and a *substring* match of the approved host — a naive `includes`/`endsWith` check would accept it. The lookalike row exists specifically to kill that mutant.
- **Uppercase host accepted, non-default port rejected.** `new URL('https://PLAUSIBLE.IO/...').origin` is `https://plausible.io` (hostnames are case-insensitive by DNS, not by policy), so accepting it is correct and proves the comparison is parsed-origin equality rather than a raw-string compare. A port *is* part of the origin, so `:8443` is a different origin and is rejected. The plan left the uppercase expectation unstated; this is the reading recorded here.
- **Only the base script path is approved.** Every extension variant (outbound links, file downloads, form submissions, hash routing, revenue) is an OPT-OUT row in `COVERAGE.md`. Approving one path makes that coverage decision executable instead of documentary.
- **Return the trimmed candidate, not `url.href`.** Matches `resolveQualifyEndpoint` and preserves the configured destination byte-for-byte.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Analytics origin literal leaked into `src/products/haoo.ts` via a code comment**

- **Found during:** Task 1 (GREEN verification, full `npm test`)
- **Issue:** The explanatory comment above the approval check named the lookalike host `plausible.io.attacker.example` to justify why the comparison is exact equality. That string matched `UNCONFIGURED_PROVIDER_ORIGIN_FORBIDDEN` (`/plausible\.io/i`), failing `keeps analytics origins out of production source modules` — the exact contract this plan is required to preserve at unchanged strength.
- **Fix:** Rewrote the comment to describe the lookalike shape ("a lookalike host carrying the approved host as a leading label of an attacker-controlled domain") without writing the origin. The adversarial literal remains where it belongs, in `src/test/`.
- **Files modified:** `src/products/haoo.ts`
- **Verification:** `npm test` 739/739 pass; `grep -rniE "plausible\.io|googletagmanager|google-analytics|umami|posthog|segment\.com" src` returns nothing outside `src/test/`.
- **Committed in:** `d7faf8f` (Task 1 GREEN commit)

**2. [Rule 1 - Bug] Corrected the uppercase-host row's expected value**

- **Found during:** Task 1 (RED)
- **Issue:** The plan listed "an approved origin with an uppercase host" among the rows to add without stating its expectation. Written as a rejection it would have asserted a false security property — `URL.origin` lowercases the host, so the URL *is* on the approved origin and rejecting it would have been an arbitrary and misleading behavior.
- **Fix:** The row asserts acceptance (input returned unchanged), with a comment explaining that this is what proves the check is a parsed-origin equality rather than a raw-string compare a case flip could defeat. The non-default-port row remains a rejection.
- **Files modified:** `src/test/measurement.test.ts`
- **Verification:** RED run showed 7 correctly-failing adversarial rows; GREEN run 204/204.
- **Committed in:** `56d6e98` (Task 1 RED commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both were necessary for correctness. Deviation 1 was required to avoid weakening a contract the plan explicitly forbids weakening; deviation 2 avoided encoding a false claim as a test. No scope creep.

## Verification Results

| Check | Result |
|---|---|
| `npm run test:unit -- --run src/test/measurement.test.ts` | PASS — 204/204 |
| `npm run typecheck` (`tsconfig.app.json`) | PASS — exit 0 |
| `npx tsc --noEmit -p tsconfig.node.json` | PASS — exit 0 |
| `npm run lint` | PASS — exit 0 |
| `npm test` (build + all suites) | PASS — 21 files, 739/739 |
| `node scripts/verify-phase4-coverage.mjs .../COVERAGE.md` | PASS — 41 required capabilities across 3 tables, exit 0 |
| Provider-unset bundle origin scan | PASS — 0 `plausible.io` occurrences in `dist/assets/*.js` |
| Configured build (`VITE_HAOO_MEASUREMENT_PROVIDER=plausible`) | Inlines `origin:"https://plausible.io",paths:["/js/script.js"]` |
| `.github/workflows/deploy.yml` | Unchanged (`git diff HEAD --stat .github/` empty); no `VITE_HAOO_*` value set anywhere |

### Mutation probes (invariants proven to bite, then reverted)

- Adding `import ... from '../../config/approved-analytics-script-sources'` to `src/products/haoo.ts` → `keeps the approved-source contract out of every production module import graph` FAILS.
- Replacing `approvedScriptSourcesForProvider(env.VITE_HAOO_MEASUREMENT_PROVIDER)` with an unconditional `APPROVED_ANALYTICS_SCRIPT_SOURCES` in `vite.config.ts` → `injects the approved-source constant only through the provider-gated selector` FAILS.
- `touch config/approved-analytics-script-sources.ts` → `rejects outputs older than the newest production build input` FAILS, proving the contract is a tracked build input.

## Known Stubs

None. No placeholder values, TODOs, skipped tests, or unwired data paths were introduced.

## Threat Flags

None. This plan removes attack surface (arbitrary first-party script execution) and introduces no new network endpoint, auth path, file access pattern, or schema change at a trust boundary. `config/approved-analytics-script-sources.ts` is a new file but is not a runtime input — it is build-time-only repository configuration whose reachability is itself pinned by a test.

## Issues Encountered

- A stale Claude Code worktree at `.claude/worktrees/rf-03-retry-1788205465/` is picked up by the vitest glob and contributes a duplicate ~330-test copy of an older tree to every run. It passes and is independent (its `ROOT` resolves to its own directory), and it is untracked so nothing was committed from it. Pre-existing and out of scope for this plan — logged for cleanup rather than fixed here.

## User Setup Required

Unchanged and still deferred. `04-USER-SETUP.md` gains the approved script URL constraint and a base-script-vs-variant dashboard check, but every environment-variable box remains unchecked and production enablement remains blocked on privacy-owner approval.

## Next Phase Readiness

- Verification gap 1 and review finding CR-01 are closed with executable evidence. MEAS-01's safe-enablement blocker and MEAS-08's evidence-integrity blocker no longer include an arbitrary-origin script path.
- Threats T-04-27 through T-04-31 are mitigated; T-04-32 remains accepted by design (a rejected source disables analytics only).
- **Note for future enablement:** a self-hosted or proxied Plausible deployment now requires a reviewed change to `config/approved-analytics-script-sources.ts` plus a redeploy. That is the intended trust property, but it is a costly reversal — flagged in the plan's `<reversibility>` and repeated here so it is not a surprise at enablement time.
- Plan 04-09 (sink-refusal path) is unaffected: this plan covers the source-rejection path only and does not delegate its MEAS-07 evidence.

## Self-Check: PASSED

- `config/approved-analytics-script-sources.ts` — FOUND on disk.
- Commits `56d6e98`, `d7faf8f`, `bd0e215` — all FOUND in `git log`.
- All task `<acceptance_criteria>` re-run and passing; all plan-level `<verification>` commands re-run and passing (table above).

---
*Phase: 04-report-and-enrich-the-haoo-funnel-truthfully*
*Completed: 2026-09-02*
