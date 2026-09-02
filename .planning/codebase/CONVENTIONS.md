---
last_mapped_commit: 7a99cab52f8907ebb43e9618c909ed785d088dbe
---
<!-- refreshed: 2026-09-02 -->
# Coding Conventions

**Analysis Date:** 2026-09-02

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` — `src/components/QualifyForm.tsx`, `src/components/BrochurePanel.tsx`, `src/pages/ProductPage.tsx`
- Non-component modules (data, logic, helpers): `kebab-case.ts` or lowercase — `src/components/qualify-form.logic.ts`, `src/products/registry.ts`, `src/products/copy.ts`, `src/products/types.ts`, `src/products/engagement-summary.ts`, `src/reporting/query-provenance.ts`, `src/reporting/stats-response.ts`, `src/measurement/plausible.ts`
- Pure-logic siblings of a component are named `<component>.logic.ts` and live beside the component so they can be unit tested without rendering: `src/components/qualify-form.logic.ts` next to `src/components/QualifyForm.tsx`
- Tests: `src/test/<subject>.test.ts` (logic/data/filesystem) and `src/test/<subject>.test.tsx` (DOM)
- Test fixtures/oracles: `src/test/fixtures/<subject>-<role>.{ts,mjs}` — `src/test/fixtures/plausible-preload-contract.ts`, `src/test/fixtures/haoo-report-cli-fetch-preload.mjs`
- Config: lowercase dotted — `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `tailwind.config.js`
- Node-only scripts: `.mjs` under `scripts/` — `scripts/generate-haoo-report.mjs`, `scripts/assert-phase1-red.mjs`, `scripts/verify-phase4-coverage.mjs`

**Functions:**
- `camelCase` for all functions and hooks — `productRoute`, `requireIdentity`, `qualifyId`, `buildSubmissionBody`, `validateQualifyValues`, `stageTotals`, `periodWindows`, `deltaLabel`
- React components are `PascalCase` function declarations, exported as `export default function Name(...)` — see `src/components/ProductsSection.tsx:75`
- Copy builders take identity args and return strings: `skipToContentLabel(productName)`, `navigationToggleLabel(productName, open)` in `src/products/copy.ts`
- Factory functions use a `create` prefix: `createMeasurement` in `src/measurement/index.ts`
- Untrusted-input readers use a `parse`/`validate` prefix and return `T | null`: `parseGoalCounts` (`src/reporting/stats-response.ts`), `validateEchoedQuery` (`src/reporting/query-provenance.ts`), `parseContext` (`src/measurement/index.ts`)
- Type predicates use `is`: `isMeasurementEventName`, `isFieldRequired`, `isPlainObject`
- Renderers use `render`/`escape` prefixes: `renderReport`, `escapeHtml` (`src/reporting/render.ts`)
- Event handlers use a `handle` prefix

**Variables:**
- `camelCase` for locals; module-level literal constants are `SCREAMING_SNAKE_CASE` — `QUALIFY_SUBMIT_LABEL`, `HONEYPOT_NAME`, `CONTEXT_RECORD_KEYS`, `PRODUCTS_SECTION_ID`, `EXPIRY_DAYS`, `REPORT_STAGE_ORDER`, `REPORT_TIMEZONE`, `READABLE_MEMBERS`
- Exported product data objects are SCREAMING_SNAKE: `HAOO_PRODUCT`, `HAOO_MEASUREMENT`, `HAOO_MEASUREMENT_EVENTS`, `KENYAN_COUNTY_OPTIONS` in `src/products/haoo.ts`
- Shared Tailwind class strings are lowerCamel module constants: `focusClasses`, `scriptFocusClasses`, `controlClasses` in `src/components/QualifyForm.tsx`
- Numeric literals use underscore separators: `15_000`, `86_400_000`

**Types:**
- `PascalCase` interfaces and type aliases, no `I` prefix — `ProductDefinition`, `QualifyField`, `EngagementContext`, `MeasurementAdapters`, `ReportModel`, `ReportFetch`, `ReportFs`, `PlausibleGlobal`
- Component props interfaces are `<Component>Props` and declared immediately above the component: `interface ProductCardProps` in `src/components/ProductsSection.tsx:7`
- String-union aliases for closed sets: `type QualifyControl = 'text' | 'email' | 'tel' | 'select' | 'textarea'` (`src/products/types.ts`), `type SubmissionState = 'idle' | 'submitting' | 'succeeded' | 'failed'`
- Closed sets are declared once as an `as const` tuple and the union is *derived* from it: `type ReportStageId = (typeof REPORT_STAGE_ORDER)[number]` (`src/reporting/haoo-report.ts`). Lookup tables over such a union are typed `Readonly<Record<Union, T>>` so adding a member fails `npm run typecheck` before it fails a test.

## Code Style

**Formatting:**
- No Prettier/Biome config in the repo — formatting is by convention, enforced by review
- Two-space indent, single-quoted strings, semicolons, trailing commas in multiline literals
- Line length kept near 90–100 characters; long conditions and generic signatures wrap one parameter per line
- Leading-operator style for wrapped boolean/string expressions (`&&`, `||`, `+` at line start) — see `src/reporting/query-provenance.ts`, `scripts/generate-haoo-report.mjs`
- Single-line guard clauses (`if (!isPlainObject(body)) return null;`) are preferred over braced one-liners in validators
- Backticked template literals for composed Tailwind class strings

**Linting:**
- ESLint 9 flat config in `eslint.config.js` using `tseslint.config(...)`
- Block 1: `@eslint/js` recommended plus `typescript-eslint` recommended over `**/*.{ts,tsx}` with browser globals; ignores `dist`
- Block 2: `@eslint/js` recommended over `scripts/**/*.mjs` with **Node** globals (ES2022, module) — added so the credentialed report CLI, the only file reading `process.env`, is actually rule-checked
- Plugins: `eslint-plugin-react-hooks` (recommended rules) and `eslint-plugin-react-refresh` with `only-export-components: ['warn', { allowConstantExport: true }]`
- Run: `npm run lint`

**TypeScript:**
- `strict: true`, `noFallthroughCasesInSwitch: true`, `isolatedModules`, `jsx: react-jsx`, bundler module resolution (`tsconfig.app.json`)
- `noUnusedLocals` and `noUnusedParameters` are deliberately `false`
- Never weaken these flags to make an error go away — fix the type instead
- Run: `npm run typecheck` (`tsc --noEmit -p tsconfig.app.json`)

**Node type-stripping subset (`src/reporting/**`):**
Modules under `src/reporting/` are imported directly by `scripts/generate-haoo-report.mjs` through Node's native TypeScript type stripping (`engines.node: >=22.18.0`). They therefore obey extra rules:
- **Erasable syntax only** — no `enum`, no parameter properties, no namespaces, no non-erasable decorators
- **Explicit `.ts` extensions on relative imports** — `import { parseGoalCounts } from './stats-response.ts'`
- Test files importing the same modules use extensionless specifiers (Vite resolves them); do not "fix" one to match the other

## Immutability

This is a strong, pervasive convention:
- Every interface field in `src/products/types.ts` is declared `readonly`, including array members (`readonly audiences: readonly string[]`)
- Props and capability interfaces also mark every field `readonly` — `src/components/QualifyForm.tsx:30`, `src/components/ProductsSection.tsx:7`, `ReportQuery`/`ReportRequestInit` in `src/reporting/generate.ts`
- `as const` on literal tables: `CONTEXT_RECORD_KEYS`, `CAMPAIGN_KEYS` in `src/measurement/index.ts`; `REPORT_STAGE_ORDER`, `READABLE_MEMBERS`
- State transitions return new objects via spread rather than mutating: `nextContext`, `contextWithInteraction` in `src/measurement/index.ts`

**When adding new data:** declare fields `readonly`, arrays `readonly T[]`, and lookup tables `as const`.

## Trust Boundaries and Untrusted Input

Any value crossing a trust boundary (provider response, persisted record, address bar, visitor input) is rebuilt, never spread:

- **Validate, then rebuild a fresh literal.** `parseGoalCounts` (`src/reporting/stats-response.ts`) checks the row shape, the goal allowlist, duplicates, integrality and sign, then constructs a new `Record<string, number>` — it never spreads the provider body.
- **Explicit pick lists over spreads.** `READABLE_MEMBERS` in `src/products/engagement-summary.ts` names the three record members that may reach an email, so adding a member to the stored record cannot silently add it to a delivered message.
- **Provenance checks on responses.** `validateEchoedQuery` (`src/reporting/query-provenance.ts`) asserts the provider echoed back the exact site id, metrics, dimensions, goal filter, and date range that were requested, before any count is trusted.
- **One credentialed module.** Only `scripts/generate-haoo-report.mjs` reads `process.env`, names the provider origin, and names the Stats API path. `src/reporting/generate.ts` receives all three through an injected `query` capability and carries none of them. Do not introduce a second credential reader.

## Import Organization

**Order** (as seen in `src/components/QualifyForm.tsx`, `src/test/haoo-report.test.ts`):
1. Node builtins with the `node:` protocol — `import { spawnSync } from 'node:child_process'`
2. External packages — `react`, `lucide-react`, `@testing-library/react`, `vitest`
3. Local type-only imports — `import type { ProductDefinition } from '../products/types'`
4. Local value imports — components, logic modules, product data

**Rules:**
- Always use the `node:` prefix for builtins (`node:fs`, `node:path`, `node:crypto`, `node:os`, `node:child_process`)
- Use `import type` / inline `type` specifiers for type-only symbols: `import { type FormEvent, useEffect, useRef, useState } from 'react'`
- Relative paths only — no path aliases are configured
- `src/reporting/**` relative imports carry `.ts` extensions (see TypeScript section)
- Multi-symbol import lists are alphabetized

## Error Handling

**Fail-closed on invalid identity or configuration:**
- `requireIdentity(value, field)` in `src/products/copy.ts` throws rather than emitting orphan copy or an unnamespaced DOM id
- `requireSummaryCopy(config)` in `src/products/engagement-summary.ts` mirrors that guard — a missing label or fallback sentence throws at use rather than shipping an unlabelled field
- `buildSubmissionBody` in `src/components/qualify-form.logic.ts` throws when a product field claims a reserved provider label (`RESERVED_EMAIL_LABELS`), so visitor data can never become provider options

**Contain-and-degrade at browser boundaries:**
- Every `localStorage`, `history`, and `URL` access in `src/measurement/index.ts` is wrapped in `try/catch`; on failure the module sets `storage = null` and continues in a degraded, non-throwing mode
- `src/measurement/plausible.ts` takes every browser capability through an optional adapter with a `?? window.x` default wrapped in `try`, so tests never append a real script tag or reach the network
- Third-party sink delivery is isolated: a throwing `eventSink` never breaks a visitor action (`track` in `src/measurement/index.ts`)
- Malformed persisted records return `null` from `parseContext` and the record is removed — never partially defaulted
- `fetch` submissions are given an explicit `QUALIFY_REQUEST_TIMEOUT_MS = 15_000` budget because browsers apply no default timeout; a hung request is treated as failure so the direct-contact recovery panel stays reachable

**Parsers return `null`, never throw:** `parseGoalCounts`, `validateEchoedQuery`, and `parseContext` all wrap their body in `try` and return `null` on every rejection path. The caller aborts.

**Write-on-success only:** `generateHaooReport` (`src/reporting/generate.ts`) queries and validates every range, renders the whole document in memory, writes a temporary sibling reserved with `openSync(path, 'wx')`, then `renameSync`s it into place. A failed query or a refused response aborts before any write, leaving the previous report byte-identical. Use this sequence for any new file-producing command.

**Validation returns error maps, not exceptions:**
- `validateQualifyValues(values, qualify)` returns `QualifyErrors` (a `Record<string, string>`) which the component renders into an error summary

**Every catch block carries a comment** explaining why swallowing is correct. Do not add a bare empty catch.

## Logging

**Framework:** None. There are zero `console.*` calls in production source under `src/` (only test spies).

**Patterns:**
- Browser failures are contained and surfaced to the visitor through UI status text (`QUALIFY_STATUS_MESSAGES`), never logged. Do not introduce `console` logging into product code.
- Node CLIs write to the file descriptors directly rather than through `console`: `writeSync(process.stderr.fd, ...)` for failures and `process.stdout.write(...)` for success in `scripts/generate-haoo-report.mjs`. Failure text goes to the terminal only — never into the generated document.
- Exit status is set with `process.exitCode = 1`, not `process.exit()`.

## Comments

**When to comment:**
- Comment the *why*, especially for non-obvious safety, accessibility, or spec constraints — not the *what*
- Every exported constant, capability interface, and validator carries a JSDoc block explaining its contract and citing the decision/threat id it satisfies — e.g. `RESERVED_EMAIL_LABELS`, `QUALIFY_REQUEST_TIMEOUT_MS` (`src/components/qualify-form.logic.ts`), `REPORT_EVENT_LABELS` (`src/reporting/haoo-report.ts`, cites MEAS-08 and `04-UI-SPEC.md`), `parseGoalCounts` (`src/reporting/stats-response.ts`, cites T-04-04)
- Module-level JSDoc states the module's boundary role: `src/reporting/generate.ts` documents that it carries no credential; `scripts/generate-haoo-report.mjs` documents that it is the only credentialed module
- Accessibility decisions cite the standard: the `scriptFocusClasses` comment in `src/components/QualifyForm.tsx` explains why `focus:` is used instead of `focus-visible:` and names WCAG 2.4.7
- Non-obvious config blocks are commented: the `scripts/**/*.mjs` block in `eslint.config.js` explains why Node globals are needed there
- Test files carry file-level JSDoc explaining the contract under test and referencing threat/decision ids (`src/test/haoo-report.test.ts` cites MEAS-01 / MEAS-08 / T-04-02..05)
- CI steps are commented where ordering matters (`.github/workflows/deploy.yml`)

**JSDoc/TSDoc:** Used liberally on exported constants and functions in `src/products/copy.ts`, `src/products/registry.ts`, `src/components/qualify-form.logic.ts`, and across `src/reporting/`. Not required on props interfaces, but individual fields get inline `/** */` when their contract is subtle (`slug` in `QualifyFormProps`).

## Function Design

**Size:** Small and single-purpose. Helpers in `src/measurement/index.ts` (`dayValue`, `dayEpoch`, `daysSince`, `lastSeenBand`, `visitBand`) are 1–8 lines each; the module composes them. `src/reporting/` splits the report into one file per responsibility: dictionary (`haoo-report.ts`), response parsing (`stats-response.ts`), provenance (`query-provenance.ts`), HTML (`render.ts`), orchestration (`generate.ts`).

**Parameters:** Positional for one or two arguments; an options/capability object for injectable dependencies. `createMeasurement(config, adapters = {})` takes a `MeasurementAdapters` bag (`eventSink`, `now`, `storage`, `location`, `history`); `generateHaooReport({ query, fetch, now, fs, outputPath })` takes `ReportFetch` and `ReportFs` capabilities. This injection seam is what makes both modules testable without jsdom globals or a network.

**Return values:** Prefer `null` over throwing for parse/lookup failures (`parseContext`, `parseGoalCounts`, `validateEchoedQuery`, `productsNavLink`). Return `boolean` for "did the side effect happen" operations (`track`, `clearContext`), or a discriminated `{ ok, ... }` result for commands (`generateHaooReport`). Pure functions return new objects, never mutate arguments.

## Module Design

**Exports:**
- Components: one `export default function` per file, plus named exports for co-located constants
- Logic/data/reporting modules: named exports only
- No barrel/index re-export files except `src/measurement/index.ts`, which is the module's own public facade

**Data centralization:**
- All product facts live in one definition module (`src/products/haoo.ts`) typed by `src/products/types.ts`
- `src/products/registry.ts` only decides which products are live (`PRODUCTS`) and derives routes/nav from that collection — so nav and content can never disagree
- The report dictionary derives its event list from its label map (`HAOO_REPORT_EVENTS = Object.keys(REPORT_EVENT_LABELS)`) and its stage membership from a single `Readonly<Record<Event, StageId>>` map, so no name is written twice
- All user-visible copy is either product data or a `src/products/copy.ts` builder. Do not inline new business copy directly in JSX or in report HTML.

**Layering:** pure dictionary/parse modules must not import orchestration; orchestration must not import Node builtins (it receives `ReportFs`); only the `.mjs` entry point touches `node:fs` and `process.env`.

**Component composition:** `src/pages/ProductPage.tsx` composes `ProductHeader`, `BrochurePanel`, `QualifyForm`, `QualifyFallback`, `OnboardingChoices`, and `MeasurementDisclosure`. Components are product-agnostic and driven entirely by the passed `ProductDefinition`.

## Styling

- Tailwind utility classes inline in JSX; no CSS modules or styled-components
- Global CSS limited to document defaults in `src/index.css`
- Generated report HTML carries its own inlined `REPORT_STYLES` constant (`src/reporting/render.ts`) — the document must be self-contained with no script element and no external resource
- All interpolated values in generated HTML go through `escapeHtml`
- Shared focus rings extracted into module constants (`focusClasses`) and interpolated into class strings — these strings are parsed and contrast-tested by `src/test/focus-contrast.test.ts`, so any new focus utility must register there
- Interactive controls use `focus-visible:`; script-moved focus targets use `focus:`
- Minimum touch target enforced with `min-h-11`
- Icons come from `lucide-react` with `aria-hidden="true"`

## Accessibility

Treated as a hard contract, asserted by tests:
- Semantic landmarks and heading order; sections carry ids used by in-page nav
- Every control has a `label`/`htmlFor` pair; DOM ids are namespaced by product slug via `qualifyId(slug, suffix)` so two forms can coexist
- Errors wired with `aria-describedby` to per-field error ids and an error summary headed `There is a problem`
- Status changes go through a persistently mounted `role="status"` region
- New-tab links carry `rel` protection against opener control and a visible "new tab" label
- Images have meaningful `alt`, explicit `width`/`height`, `loading="lazy"`, `decoding="async"`

## Truthful Copy

Report and measurement copy must describe only what a browser observed. A count is an *occurrence*, not a person; a stage is a grouping of occurrences, not a cohort. Labels such as "Validated form send attempts" and "Outbound WhatsApp clicks" (`src/reporting/haoo-report.ts`) are locked by `04-UI-SPEC.md` and asserted byte-for-byte by tests — changing one is a copy decision, not a refactor.

## Verification Expectations

Run before committing TypeScript/JSX changes:
```bash
npm run lint
npm run typecheck
npm run test        # build + vitest run
```

---

*Convention analysis: 2026-09-02*
