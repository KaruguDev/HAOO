# Coding Conventions

**Analysis Date:** 2026-09-01

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` — `src/components/QualifyForm.tsx`, `src/components/BrochurePanel.tsx`, `src/pages/ProductPage.tsx`
- Non-component modules (data, logic, helpers): `kebab-case.ts` or lowercase — `src/components/qualify-form.logic.ts`, `src/products/registry.ts`, `src/products/copy.ts`, `src/products/types.ts`
- Pure-logic siblings of a component are named `<component>.logic.ts` and live beside the component so they can be unit tested without rendering: `src/components/qualify-form.logic.ts` next to `src/components/QualifyForm.tsx`
- Tests: `src/test/<subject>.test.ts` (logic/data) and `src/test/<subject>.test.tsx` (DOM)
- Config: lowercase dotted — `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `tailwind.config.js`
- Node-only scripts: `.mjs` under `scripts/` — `scripts/assert-phase1-red.mjs`

**Functions:**
- `camelCase` for all functions and hooks — `productRoute`, `requireIdentity`, `qualifyId`, `buildSubmissionBody`, `validateQualifyValues`
- React components are `PascalCase` function declarations, exported as `export default function Name(...)` — see `src/components/ProductsSection.tsx:75`
- Copy builders take identity args and return strings: `skipToContentLabel(productName)`, `navigationToggleLabel(productName, open)` in `src/products/copy.ts`
- Factory functions use a `create` prefix: `createMeasurement` in `src/measurement/index.ts`
- Type predicates use `is`: `isMeasurementEventName`, `isFieldRequired`
- Event handlers use a `handle` prefix

**Variables:**
- `camelCase` for locals; module-level literal constants are `SCREAMING_SNAKE_CASE` — `QUALIFY_SUBMIT_LABEL`, `HONEYPOT_NAME`, `CONTEXT_RECORD_KEYS`, `PRODUCTS_SECTION_ID`, `EXPIRY_DAYS`
- Exported product data objects are SCREAMING_SNAKE: `HAOO_PRODUCT`, `HAOO_MEASUREMENT`, `KENYAN_COUNTY_OPTIONS` in `src/products/haoo.ts`
- Shared Tailwind class strings are lowerCamel module constants: `focusClasses`, `scriptFocusClasses`, `controlClasses` in `src/components/QualifyForm.tsx`
- Numeric literals use underscore separators: `15_000`, `86_400_000`

**Types:**
- `PascalCase` interfaces and type aliases, no `I` prefix — `ProductDefinition`, `QualifyField`, `EngagementContext`, `MeasurementAdapters`
- Component props interfaces are `<Component>Props` and declared immediately above the component: `interface ProductCardProps` in `src/components/ProductsSection.tsx:7`
- String-union aliases for closed sets: `type QualifyControl = 'text' | 'email' | 'tel' | 'select' | 'textarea'` (`src/products/types.ts`), `type SubmissionState = 'idle' | 'submitting' | 'succeeded' | 'failed'`

## Code Style

**Formatting:**
- No Prettier/Biome config in the repo — formatting is by convention, enforced by review
- Two-space indent, single-quoted strings, semicolons, trailing commas in multiline literals
- Line length kept near 90–100 characters; long conditions and generic signatures wrap one parameter per line
- Backticked template literals for composed Tailwind class strings

**Linting:**
- ESLint 9 flat config in `eslint.config.js` using `tseslint.config(...)`
- Extends `@eslint/js` recommended plus `typescript-eslint` recommended; applies to `**/*.{ts,tsx}`; ignores `dist`
- Plugins: `eslint-plugin-react-hooks` (recommended rules) and `eslint-plugin-react-refresh` with `only-export-components: ['warn', { allowConstantExport: true }]`
- Run: `npm run lint`

**TypeScript:**
- `strict: true`, `noFallthroughCasesInSwitch: true`, `isolatedModules`, `jsx: react-jsx`, bundler module resolution (`tsconfig.app.json`)
- `noUnusedLocals` and `noUnusedParameters` are deliberately `false`
- Never weaken these flags to make an error go away — fix the type instead
- Run: `npm run typecheck` (`tsc --noEmit -p tsconfig.app.json`)

## Immutability

This is a strong, pervasive convention:
- Every interface field in `src/products/types.ts` is declared `readonly`, including array members (`readonly audiences: readonly string[]`)
- Props interfaces also mark every field `readonly` — `src/components/QualifyForm.tsx:30`, `src/components/ProductsSection.tsx:7`
- `as const` on literal tables: `CONTEXT_RECORD_KEYS`, `CAMPAIGN_KEYS` in `src/measurement/index.ts`
- State transitions return new objects via spread rather than mutating: `nextContext`, `contextWithInteraction` in `src/measurement/index.ts`

**When adding new data:** declare fields `readonly`, arrays `readonly T[]`, and lookup tables `as const`.

## Import Organization

**Order** (as seen in `src/components/QualifyForm.tsx` and `src/test/qualify-form.test.tsx`):
1. Node builtins with the `node:` protocol — `import { readFileSync } from 'node:fs'`
2. External packages — `react`, `lucide-react`, `@testing-library/react`, `vitest`
3. Local type-only imports — `import type { ProductDefinition } from '../products/types'`
4. Local value imports — components, logic modules, product data

**Rules:**
- Always use the `node:` prefix for builtins (`node:fs`, `node:path`, `node:crypto`, `node:child_process`)
- Use `import type` / inline `type` specifiers for type-only symbols: `import { type FormEvent, useEffect, useRef, useState } from 'react'`
- Relative paths only — no path aliases are configured
- Multi-symbol import lists are alphabetized

## Error Handling

**Fail-closed on invalid identity or configuration:**
- `requireIdentity(value, field)` in `src/products/copy.ts` throws rather than emitting orphan copy or an unnamespaced DOM id
- `buildSubmissionBody` in `src/components/qualify-form.logic.ts` throws when a product field claims a reserved provider label (`RESERVED_EMAIL_LABELS`), so visitor data can never become provider options

**Contain-and-degrade at browser boundaries:**
- Every `localStorage`, `history`, and `URL` access in `src/measurement/index.ts` is wrapped in `try/catch`; on failure the module sets `storage = null` and continues in a degraded, non-throwing mode
- Third-party sink delivery is isolated: a throwing `eventSink` never breaks a visitor action (`track` in `src/measurement/index.ts`)
- Malformed persisted records return `null` from `parseContext` and the record is removed — never partially defaulted
- `fetch` submissions are given an explicit `QUALIFY_REQUEST_TIMEOUT_MS = 15_000` budget because browsers apply no default timeout; a hung request is treated as failure so the direct-contact recovery panel stays reachable

**Validation returns error maps, not exceptions:**
- `validateQualifyValues(values, qualify)` returns `QualifyErrors` (a `Record<string, string>`) which the component renders into an error summary

**Every catch block carries a comment** explaining why swallowing is correct. Do not add a bare empty catch.

## Logging

**Framework:** None. There are zero `console.*` calls in production source under `src/` (only test spies).

**Pattern:** Failures are contained and surfaced to the visitor through UI status text (`QUALIFY_STATUS_MESSAGES`), never logged. Do not introduce `console` logging into product code.

## Comments

**When to comment:**
- Comment the *why*, especially for non-obvious safety, accessibility, or spec constraints — not the *what*
- Every non-obvious constant carries a JSDoc block explaining its contract, e.g. `RESERVED_EMAIL_LABELS`, `QUALIFY_REQUEST_TIMEOUT_MS` in `src/components/qualify-form.logic.ts`
- Accessibility decisions cite the standard: the `scriptFocusClasses` comment in `src/components/QualifyForm.tsx` explains why `focus:` is used instead of `focus-visible:` and names WCAG 2.4.7
- Test files carry file-level JSDoc explaining the contract under test and referencing threat/decision ids (`src/test/qualify-data.test.ts` cites D-04 / LEAD-04 / T-02-01)
- CI steps are commented where ordering matters (`.github/workflows/`)

**JSDoc/TSDoc:** Used liberally on exported constants and functions in `src/products/copy.ts`, `src/products/registry.ts`, `src/components/qualify-form.logic.ts`. Not required on props interfaces, but individual fields get inline `/** */` when their contract is subtle (`slug` in `QualifyFormProps`).

## Function Design

**Size:** Small and single-purpose. Helpers in `src/measurement/index.ts` (`dayValue`, `dayEpoch`, `daysSince`, `lastSeenBand`, `visitBand`) are 1–8 lines each; the module composes them.

**Parameters:** Positional for one or two arguments; an options/adapters object for injectable dependencies. `createMeasurement(config, adapters = {})` takes a `MeasurementAdapters` bag (`eventSink`, `now`, `storage`, `location`, `history`) with browser globals as defaults — this is the seam that makes the module testable without jsdom globals.

**Return values:** Prefer `null` over throwing for parse/lookup failures (`parseContext`, `productsNavLink`). Return `boolean` for "did the side effect happen" operations (`track`, `clearContext`). Pure functions return new objects, never mutate arguments.

## Module Design

**Exports:**
- Components: one `export default function` per file, plus named exports for co-located constants
- Logic/data modules: named exports only
- No barrel/index re-export files except `src/measurement/index.ts`, which is the module's own public facade

**Data centralization:**
- All product facts live in one definition module (`src/products/haoo.ts`) typed by `src/products/types.ts`
- `src/products/registry.ts` only decides which products are live (`PRODUCTS`) and derives routes/nav from that collection — so nav and content can never disagree
- All user-visible copy is either product data or a `src/products/copy.ts` builder. Do not inline new business copy directly in JSX.

**Component composition:** `src/pages/ProductPage.tsx` composes `ProductHeader`, `BrochurePanel`, `QualifyForm`, `QualifyFallback`, `OnboardingChoices`, and `MeasurementDisclosure`. Components are product-agnostic and driven entirely by the passed `ProductDefinition`.

## Styling

- Tailwind utility classes inline in JSX; no CSS modules or styled-components
- Global CSS limited to document defaults in `src/index.css`
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

## Verification Expectations

Run before committing TypeScript/JSX changes:
```bash
npm run lint
npm run typecheck
npm run test        # build + vitest run
```

---

*Convention analysis: 2026-09-01*
