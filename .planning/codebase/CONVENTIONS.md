---
last_mapped_commit: e91a3b97ce46cd965624cfda94abc6c34c86d2a4
---
<!-- refreshed: 2026-09-05 -->
# Coding Conventions

**Analysis Date:** 2026-09-05

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` — `src/components/QualifyForm.tsx`, `src/pages/ProductPage.tsx`
- Non-component modules (logic, data, adapters): `kebab-case.ts` — `src/components/qualify-form.logic.ts`, `src/products/engagement-summary.ts`, `src/measurement/posthog-lockdown.ts`
- Tests: `kebab-case.test.ts` / `.test.tsx`, all under `src/test/`
- Node scripts: `kebab-case.mjs` under `scripts/`

**Functions:**
- `camelCase`. Pure builders read as noun phrases (`buildSubmissionBody`, `formatEngagementSummary`, `productRoute`); predicates read as assertions (`isFieldRequired`, `lockdownHolds`).
- Copy builders in `src/products/copy.ts` are functions of product identity, never literals: `skipToContentLabel(name)`, `mobileNavigationId(slug)`.

**Variables:**
- `camelCase` locals; module-level constants are `SCREAMING_SNAKE_CASE` — `QUALIFY_SUBMIT_LABEL`, `QUALIFY_REQUEST_TIMEOUT_MS`, `HONEYPOT_NAME` in `src/components/qualify-form.logic.ts`.
- Numeric literals use digit separators: `15_000`, `86_400_000`.

**Types:**
- `PascalCase` interfaces and type aliases — `ProductDefinition`, `EngagementContext`, `MeasurementAdapters`, `SubmissionState` (`src/products/types.ts`, `src/measurement/index.ts`).
- Component props are a local `interface {Component}Props` declared immediately above the component.

## Code Style

**Formatting:**
- No Prettier or Biome config in the repository. Style is enforced by convention and review: 2-space indent, single quotes, semicolons, trailing commas in multi-line literals, ~90-character soft wrap.

**Linting:**
- `eslint.config.js` (flat config), run with `npm run lint`.
- Browser block: `**/*.{ts,tsx}` with `js.configs.recommended` + `tseslint.configs.recommended`, `react-hooks` recommended rules, and `react-refresh/only-export-components` as a warning with `allowConstantExport: true`. Globals: `globals.browser`.
- Node block: `**/*.mjs` and root `*.js` get `globals.node` — added deliberately so `eslint .` actually checks the credentialed report CLI, the test preload fixtures, and the root build config (the only files that touch `process.env`).
- `dist` is ignored.

**Type checking:**
- `npm run typecheck` runs `tsc --noEmit` against both `tsconfig.app.json` (`include: ["src"]`) and `tsconfig.node.json`.
- `strict: true`, `noFallthroughCasesInSwitch: true`, `isolatedModules`, bundler module resolution. `noUnusedLocals` / `noUnusedParameters` are off.

## Import Organization

**Order (observed consistently):**
1. Node builtins with the `node:` protocol — `import { readFileSync } from 'node:fs'`
2. Third-party packages — `react`, `lucide-react`, `posthog-js`, `vitest`, `@testing-library/react`
3. Local modules by relative path, roughly deepest-first: components, then `../products/*`, then `../measurement/*`
4. Type-only imports use `import type` (or inline `type` specifiers inside a value import)

**Path Aliases:**
- None. All local imports are relative. `import.meta.dirname` is used to anchor repo-root paths in tests and scripts.

## Error Handling

- **Fail closed, never widen.** Resolvers return a refusal rather than a permissive default: `src/measurement/posthog.ts` exports `POSTHOG_REFUSAL` and declines to initialize when the provider selector or token is not deliberately set.
- **Distinguish states you can actually observe.** `SubmissionState` in `src/components/qualify-form.logic.ts` separates `blocked` (request never assembled, nothing sent) from `failed` (a transport event occurred) because reporting a round-trip that never happened would be an unsupportable claim.
- **Bounded I/O.** `fetch` has no default timeout, so `QUALIFY_REQUEST_TIMEOUT_MS = 15_000` treats an unsettled request as a failure so the direct-contact recovery panel stays reachable.
- **Guarded environment reads.** Date/storage/location access is wrapped in `try`/`catch` with a defined fallback (see `currentDay` in `src/measurement/index.ts`).
- Adapters are injected (`MeasurementAdapters`: `now`, `storage`, `location`, `history`, `eventSink`) so failure paths are testable without globals.

## Logging

**Framework:** none. The single production log site is `console.warn(reason)` in `src/measurement/posthog.ts:162`, used to surface a refusal.

**Pattern:** do not log user input, form answers, or any measurement context. Silence is preferred to a log line that could carry a payload.

## Comments

**When to Comment:**
- Comments explain *why an invariant is shaped the way it is*, not what the code does. This repository's comments are unusually long and are treated as part of the contract.
- Every narrowing, exclusion, or carve-out carries a block comment naming: what the rule used to prove, what it no longer proves, what replaced it, and why the replacement is truthful. See `PROVIDER_INGESTION_HOST_SOURCE_FORBIDDEN` and `MEASUREMENT_IDENTITY_SOURCE_FORBIDDEN` in `src/test/build-output.test.ts`, and the `manualChunks` comment in `vite.config.ts`.
- Facts stated in comments must be **measured**, not assumed. Comments say "MEASURED in this commit" and record the measurement; a claim inherited from an earlier state is re-established or rewritten.
- `vitest.config.ts` documents *why* its `exclude` list exists (dot-directory worktrees ran frozen duplicate suites and inflated test counts).

**JSDoc/TSDoc:**
- `/** ... */` on exported constants, types, and seams. Not required on trivial internals.

## Function Design

**Size:** small and single-purpose in production source; test helpers may be longer because they encode a contract.

**Parameters:** components take a single destructured props object. Capability-bearing modules take an optional `adapters` object rather than reaching for globals.

**Return Values:** prefer `readonly` data and `as const` tuples. Predicates return `boolean`; capability calls that may refuse return `boolean` (`Measurement.track`, `Measurement.clearContext`).

## Module Design

**Exports:**
- React components use `export default function Name(...)` (one component per file).
- Everything else uses named exports. Constants are exported when a test needs to assert against the exact value rather than a restated copy.

**Barrel Files:**
- `src/measurement/index.ts` is the one barrel — it is also the sole audited browser-capability boundary. No other directory has one.

**Data vs. pattern:**
- Product identity is *data*, never a hardcoded literal in generic code. `src/products/registry.ts` decides which products are live; each product owns its own facts (`src/products/haoo.ts`); generic shells derive every product-named string via `src/products/copy.ts`. This is enforced by `src/test/product-shell-reuse.test.tsx`.

**Configuration boundary:**
- `config/approved-analytics-hosts.ts` lives outside `src/` on purpose: no production module may import it by any specifier. It reaches the bundle only through the provider-gated `define` in `vite.config.ts`.

---

*Convention analysis: 2026-09-05*
