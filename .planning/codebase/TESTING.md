---
last_mapped_commit: e91a3b97ce46cd965624cfda94abc6c34c86d2a4
---
<!-- refreshed: 2026-09-05 -->
# Testing Patterns

**Analysis Date:** 2026-09-05

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: `vitest.config.ts` — `environment: 'jsdom'`, `globals: false`, `setupFiles: ['./src/test/setup.ts']`
- `exclude: ['**/node_modules/**', '**/dist/**', '.claude/**', '.gsd/**']`. The dot-directory entries are load-bearing: Vitest's default exclude does not cover dot-directories, so agent-tool worktrees under `.claude/` were discovered and ran ten frozen duplicate suites from an older revision, inflating every quoted test count. Do not drop them.

**Assertion / DOM libraries:**
- Vitest `expect` (no `jest-dom`; assertions use raw DOM checks such as `.toBeTruthy()`, `getAttribute(...)`)
- `@testing-library/react` 16.3.2 + `@testing-library/dom` 10.4.1, `jsdom` 26.1.0
- `typescript` is imported *as a library* inside `src/test/product-shell-reuse.test.tsx` (`ts.createScanner`) to strip comments before source scanning

**Run Commands:**
```bash
npm test                 # `npm run build && vitest run` — the real gate
npm run test:unit        # `vitest run` only — NO build first
npm run typecheck        # tsc --noEmit on both tsconfigs
npm run lint             # eslint .
npm run verify:coverage  # scripts/verify-phase4-coverage.mjs against a phase COVERAGE.md
npm run test:phase1:red  # scripts/assert-phase1-red.mjs — asserts named cases go RED
npm run report:haoo      # credentialed report CLI (not a test)
```

**`test` vs `test:unit` — this distinction matters.**
`npm test` builds first because `src/test/build-output.test.ts` asserts against `dist/` and enforces **build-artifact freshness**: it compares the newest mtime across `BUILD_INPUTS` (everything under `src/` except `src/test/`, everything under `public/`, both HTML entries, `config/approved-analytics-hosts.ts`, `vite.config.ts`, `package.json`) against the oldest build output, and fails with "Run npm run build" if `dist` is stale. `npm run test:unit` is the fast inner loop and will fail or assert against a stale artifact — it is **not** a substitute for `npm test` in CI or before a claim.

## Test File Organization

**Location:** all tests live in `src/test/`, separate from source. Fixtures in `src/test/fixtures/`.

**Naming:** `<subject>.test.ts` for logic/node subjects, `<subject>.test.tsx` for anything that renders.

**Structure:**
```
src/test/
├── build-output.test.ts            # source-boundary + built-artifact scanner (1653 lines, 44 cases)
├── measurement.test.ts             # measurement facade + PostHog lockdown (2322 lines, 65 cases)
├── qualify-form.test.tsx           # form behaviour (2464 lines, 71 cases)
├── haoo-report.test.ts             # reporting pipeline (2388 lines, 78 cases)
├── measurement-page.test.tsx       # disclosure + page-level measurement (1657 lines, 37 cases)
├── haoo-page.test.tsx              # product page contracts (28 cases)
├── product-shell-reuse.test.tsx    # product-genericity contracts (5 cases)
├── products-section.test.tsx, haoo-content.test.ts, qualify-data.test.ts, focus-contrast.test.ts
├── fixtures/posthog-capture-contract.ts
├── fixtures/haoo-report-cli-fetch-preload.mjs
└── setup.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it, vi } from 'vitest';   // explicit — globals: false

describe('approved analytics ingestion host boundary', () => {
  it('publishes the approved ingestion origin exactly once in a provider-selected build', () => {
    ...
  });
});
```

**Patterns:**
- Every Vitest API is imported explicitly; there are no ambient globals.
- Test names are **claims**, stated as what the system does, in prose: `'keeps every report credential out of the deploy workflow Build environment'`, `"keeps this project's own chunks free of identity and ordered-emission channels"`. A renamed case is a renamed claim and is treated as a contract change.
- Cleanup is global: `src/test/setup.ts` registers `afterEach(cleanup)` and installs a no-op `IntersectionObserver` (jsdom lacks it, and the home-page reveal hook subscribes to it) so every section stays in the DOM for contract queries.
- **Presence before absence.** Any `not.toMatch` / `not.toContain` assertion is preceded by an assertion that its subject is non-empty. Empty-string subjects pass every prohibition vacuously, and this repository treats a vacuous pass as a defect.
- Constants are **derived, not restated**: `PINNED_SDK_VERSION` is read out of `package.json`; credential names are derived from `REPORT_CREDENTIAL_BUNDLE_FORBIDDEN` pattern sources, with a guard asserting the derivation still yields `POSTHOG_QUERY_API_KEY` so the gate cannot silently assert nothing.
- Mutation probes are made executable. `it('catches a report credential smuggled under an unforbidden browser-prefixed name')` mutates the *real* `deploy.yml` in memory and asserts both that the old name-side rules are blind to it and that the new value-side rule catches it — so the widening cannot be quietly narrowed back.

## The narrowing discipline (repository-defining — preserve this)

An invariant in this repository is **never weakened and never deleted**. When a change makes a claim untruthful, the claim is **narrowed to a named successor** in the same commit, with a comment recording what was withdrawn, why, and what now carries the guarantee.

Canonical examples:
- `PROVIDER_INGESTION_HOST_SOURCE_FORBIDDEN` in `src/test/build-output.test.ts` is the explicit successor to the delivery-mechanism half of the guarantee plan `04-08` established. Its doc comment states what it proves (the ingestion host literal never enters any module under `src/`), what it no longer proves (that the built bundle contains no provider origin — untrue once the SDK ships in-bundle), and that the claim is "withdrawn, not weakened by silence".
- `MEASUREMENT_IDENTITY_SOURCE_FORBIDDEN` relocates identity/queue patterns from the bundle scan to the production-source scan, on the principle that *a claim about a minified vendor artifact is a claim about the vendor, not about this project*.
- `.planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/deferred-items.md` records the discipline in prose: D1 (relocate rather than delete the identity patterns), D2 (do **not** write an assertion that would pass for the wrong reason — defer it to the commit that creates the reader), D3 (do **not** widen the bidirectional declared-key/read-key invariant to tolerate declared-but-unread keys, because that invariant is the only build-time signal for a misspelled `VITE_` variable). Executors are instructed to **stop and report** rather than widen a prohibition.
- `scripts/verify-phase4-coverage.mjs` shows the same discipline applied to a deploy gate: a COVERAGE row was *renamed* to `` `defaults` sentinel and the date-gated default set `` rather than dropped, because the capability is still integrated.

Any future work (including a repository split) must carry these successors forward by name, not re-derive weaker equivalents.

## `src/test/build-output.test.ts` — the source-boundary and artifact scanner

This is not a unit test. It is a static scanner over repository source, a scanner over built output, a reader of the CI workflow, and a builder of its own throwaway probe builds. 44 cases across five describes: public build-time configuration declarations, build artifact freshness, static build contracts, bundle/credential contracts, and the approved analytics ingestion host boundary.

**`PRODUCT_SOURCE_BOUNDARY`** — a `Readonly<Record<string, readonly RegExp[]>>` mapping each production source file to the group of patterns forbidden *in that file*. Groups compose: `ALWAYS_FORBIDDEN`, `NETWORK_FORBIDDEN`, `PROVIDER_FORBIDDEN`, `FORM_MARKUP_FORBIDDEN` combine into `FULL_BOUNDARY`; `MEASUREMENT_PRIVACY_FORBIDDEN` adds identity/queue guards. Most product files carry `FULL_BOUNDARY`. `src/measurement/index.ts` carries `MEASUREMENT_FACADE_BOUNDARY` — the *sole* narrowed browser-capability boundary, permitted storage and location access but keeping every unrelated prohibition plus the privacy guards. The map is enforced from several angles:
- every entry's file must be non-empty and match none of its patterns;
- every file except the facade must still carry all of `ALWAYS_FORBIDDEN`;
- every local production import of `QualifyForm.tsx` must have an entry in the map (so a new dependency cannot escape the boundary by being new);
- `QualifyFallback.tsx` re-runs every inherited group and asserts the scanned count equals `FULL_BOUNDARY.length`, so a silently shrunk group is red.

**Vendor/project chunk partition.** `vite.config.ts` names a `manualChunks` entry `posthog-sdk` seeded with `posthog-js`, `preact`, `dompurify`, `fflate`, `core-js`, `web-vitals`. The seed list is **measured, not guessed** — `posthog-js` alone pulls its transitive runtime in, but each package is named so a differently-resolving dependency lands there by declaration. The test restates `VENDOR_CHUNK_NAME = 'posthog-sdk'` rather than importing the Vite config (importing it would evaluate the `define` block as a side effect); the pairing is instead asserted by the vendor-identity case. `vendorChunkFiles()` / `projectChunkFiles()` partition `dist/assets/*.js` on that name and **throw with a remediation message** if either side is empty — an empty side would make every prohibition pass against the empty string. `projectBundleText()` is the subject of every prohibition that stopped being truthful over the whole bundle once the vendor chunk began shipping; `vendorBundleText()` is asserted separately (it must contain `PINNED_SDK_VERSION`, derived from `package.json`) so the two claims stay distinguishable. **A vendor module leaking into a project chunk is fixed by extending the seed list, never by relaxing a prohibition.**

**Reading `.github/workflows/deploy.yml`.** The suite parses the workflow as text: it splits out the `Build` step and its `env:` block, asserts the three public measurement variables are assigned exactly once in the Build step *and* exactly once in the whole file, asserts derived report-credential names never appear under any `VITE_`-prefixed name nor are assigned in any step, then applies value-side rules to every browser-prefixed assignment (no `secrets.*` context; must be exactly one repository-variable expression), and finally pins the exact roster: `VITE_HAOO_FORM_ENDPOINT`, `VITE_HAOO_MEASUREMENT_PROVIDER`, `VITE_HAOO_POSTHOG_TOKEN`, `VITE_HAOO_POSTHOG_API_HOST`. It also checks `path: ./dist` and that `CNAME` is `www.zero-paperhub.com`.

**Throwaway probe builds.** Two cases spawn their own Vite builds rather than trusting the repository's `dist`, because `dist` reflects whatever variables its last build happened to have:
- *provider-selected probe* → `spawnSync` `npx vite build --outDir dist-approved-host-probe --emptyOutDir` (with `shell: true` handling because `npx` is `npx.cmd` on Windows), then asserts the approved origin appears **exactly once** across the probe's *project* chunks, and that the vendor chunk does contain `us.i.posthog.com` as the vendor's own default.
- *provider-unset probe* → same build into `dist-provider-unset-probe` with the selector **blanked, not inherited**; asserts the project chunks carry no approved origin and no approved hostname at all.
Both wrap in `try`/`finally` with `rmSync(probeDir, { recursive: true, force: true })` so the repository's `dist` is never disturbed.

## Product-genericity inventories — `src/test/product-shell-reuse.test.tsx`

`GENERIC_PRODUCT_SOURCES` is an explicit `as const` inventory of the eleven files that must contain no product-name literal: `ProductPage.tsx`, `ProductHeader.tsx`, `OnboardingChoices.tsx`, `BrochurePanel.tsx`, `ProductsSection.tsx`, `QualifyForm.tsx`, `qualify-form.logic.ts`, `QualifyFallback.tsx`, `products/copy.ts`, `products/engagement-summary.ts`, `products/types.ts`.

How genericity is asserted:
- **Comments are stripped first** via the TypeScript scanner (`withoutComments`) so prose mentioning the product does not fail the scan — and the stripper itself is tested in both directions (a comment mention passes, a string literal is caught).
- The pattern is built from `PRODUCTS[0].name` through `escapeRegExp`, because **product names are data, never patterns**: `Q.ai` would match `Qxai`, and a name containing `.*` would match everything and pass vacuously. The escape is asserted load-bearing with a `'Q.ai (Beta)+'` case.
- `scanned` is counted and asserted `> 0` so an emptied inventory is red.
- **No carve-outs.** The engagement-summary email label is the product's own wording and lives in the product module; generic form logic reserves it structurally (MEAS-05).
- Positive side: a fully synthetic `ZENITH` product is rendered through `ProductPage` and every product-named shell surface is asserted, then `container.textContent` is asserted to contain no `HAOO` and none of the shipped product's headings. The synthetic product deliberately reuses HAOO's `fields`/`groups`/`engagementSummary` verbatim (never rendered) so reuse cannot satisfy the assertion by accident.
- `copy.ts` builders are asserted byte-for-byte against the shipped strings, and asserted to **fail closed** (`throw 'Product name must not be empty'` / `'Product slug must not be empty'`) on blank identity.

## Mocking

**Framework:** Vitest `vi` (~86 uses of `vi.fn` / `vi.spyOn` / fake timers across the suite). There are **no `vi.mock` module mocks** anywhere.

**Patterns:**
```typescript
// Seams, not module mocks: capabilities are injected through an adapters object.
class MemoryStorage implements Storage { readonly values = new Map<string, string>(); /* ... */ }

const measurement = createMeasurement(HAOO_MEASUREMENT, {
  storage: new MemoryStorage(),
  now: () => new Date('2026-08-31T12:00:00.000Z'),
  location: { href: 'https://www.zero-paperhub.com/products/haoo/' },
  eventSink: vi.fn(),
});
```

**What to Mock:**
- Only injected adapters: `storage`, `now`, `location`, `history`, `eventSink`, `providerAdapters`.
- The vendor SDK is exercised through a **vendor-contract fixture**, `src/test/fixtures/posthog-capture-contract.ts`, which exports `createPostHogVendorClient`, `createLoadedOncePostHogVendorClient`, `VENDOR_DOCUMENTED_DEFAULTS`, and `VACUOUS_BY_VENDOR_AGREEMENT` — the fixture records which assertions are true only by the vendor's documented agreement, so vacuous coverage is labelled rather than hidden.
- The report CLI's network layer is intercepted by a Node preload fixture, `src/test/fixtures/haoo-report-cli-fetch-preload.mjs`, so the real CLI binary is run end-to-end.

**What NOT to Mock:**
- Never mock this project's own modules. Never mock the filesystem, the build, or the workflow file — `build-output.test.ts` reads the real artifacts and runs real builds.
- Never mock away a boundary in order to make a prohibition pass.

## Fixtures and Factories

- `syntheticProduct(overrides)` in `src/test/product-shell-reuse.test.tsx` builds a complete `ProductDefinition` (`ZENITH`) with `provider: 'none'`, accepting partial overrides.
- Fixed clocks are literal dates (`new Date('2026-08-31T12:00:00.000Z')`); storage keys and flag names are declared as `as const` inventories at the top of the file.
- Shared fixtures live in `src/test/fixtures/`.

## Coverage

**Requirements:** no line/branch coverage threshold is configured and no coverage provider is installed. Coverage in this project means **capability coverage**, not line coverage.

**Capability coverage gate:**
```bash
npm run verify:coverage   # scripts/verify-phase4-coverage.mjs .planning/phases/04.1-.../COVERAGE.md
```
`scripts/verify-phase4-coverage.mjs` holds a `REQUIRED_TABLES` map: every PostHog SDK capability (init lockdown object, merged-config readback, bare-name `capture`, `before_send` reduction, `person_profiles: 'never'`, memory persistence, `advanced_disable_flags`, `disable_external_dependency_loading`, the `defaults` sentinel, the Cloud US ingestion host) paired with its disposition (`INTEGRATE` / `OPT-OUT`), verified against the phase's `COVERAGE.md`. It is a deploy gate, so a row that outlives its claim must be **renamed to its successor**, not deleted.

**Red-test gate:** `npm run test:phase1:red` (`scripts/assert-phase1-red.mjs`) asserts that cases tagged `[phase1-red:...]` in their names actually fail under the pre-implementation condition — falsifiability, enforced.

## Test Types

**Unit tests:** pure logic and adapters — `qualify-data.test.ts`, `haoo-content.test.ts`, `measurement.test.ts`.

**Component/contract tests:** `@testing-library/react` render + role/name queries against accessible names (`getByRole('navigation', { name: sectionsNavLabel(product.name) })`). Assertions target the accessibility tree, not class names. `focus-contrast.test.ts` asserts computed focus-visibility contrast.

**Static/artifact tests:** `build-output.test.ts` and the genericity inventories — source scanning, built-artifact scanning, workflow scanning, probe builds.

**End-to-end CLI tests:** `haoo-report.test.ts` (78 cases) runs the real `scripts/generate-haoo-report.mjs` with a fetch preload fixture.

**E2E browser tests:** none (no Playwright/Cypress).

## Common Patterns

**Async testing:**
```typescript
// Real modules, real awaits — no module mocks. fireEvent from Testing Library,
// with fetch supplied as an injected adapter rather than patched globally.
```

**Error testing:**
```typescript
for (const builder of nameBuilders) {
  expect(() => builder('  ')).toThrow('Product name must not be empty');
}
```

**Non-vacuity testing (use everywhere):**
```typescript
expect(assignments.length, 'browser-prefixed assignments found in deploy.yml').toBeGreaterThan(0);
for (const { name, value } of assignments) {
  expect(value, `${name} carries a secrets-context value`).not.toMatch(SECRETS_CONTEXT);
}
```

**Assertion messages:** the second `expect` argument is used almost everywhere and names the subject and the remediation (`'Run `npm run build`'`, `'Restore the derivation rather than hardcoding names.'`). Preserve this — the messages are how a failure is diagnosable without reading the test.

---

*Testing analysis: 2026-09-05*
