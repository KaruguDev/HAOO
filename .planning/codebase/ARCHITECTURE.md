---
last_mapped_commit: e91a3b97ce46cd965624cfda94abc6c34c86d2a4
---
<!-- refreshed: 2026-09-05 -->
# Architecture

**Analysis Date:** 2026-09-05

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│              Vite multi-page inputs (build)                  │
├──────────────────────────────┬──────────────────────────────┤
│  Company site document       │  HAOO product document        │
│  `index.html`                │  `products/haoo/index.html`   │
│  (no body data-page)         │  `<body data-page=            │
│                              │   "haoo-product">` + noscript │
└──────────────┬───────────────┴──────────────┬───────────────┘
               │  both load /src/main.tsx     │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Single React root — `src/main.tsx` → `src/App.tsx`           │
│  App() branches on `document.body.dataset.page`               │
└──────────┬──────────────────────────────────┬───────────────┘
           │ default                          │ 'haoo-product'
           ▼                                  ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│ HomePage (company site)  │   │ ProductPage (generic shell)   │
│ `src/App.tsx`            │   │ `src/pages/ProductPage.tsx`   │
│ + ProductsSection        │   │ + components/*                │
└──────────┬───────────────┘   └──────────────┬───────────────┘
           │ reads PRODUCTS                   │ reads product prop
           ▼                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Product data layer — `src/products/`                        │
│  registry.ts → haoo.ts (HAOO facts) → types.ts / copy.ts     │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Measurement — `src/measurement/`                            │
│  index.ts (generic engagement + track) → posthog.ts sink     │
│  → posthog-lockdown.ts (config contract)                     │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  PostHog Cloud US ingestion  (browser)                        │
│  Query API (Node, offline) → `src/reporting/` → HAOO report   │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `App` | Page selection from `document.body.dataset.page` | `src/App.tsx` (line 655) |
| `HomePage` | Whole ZERO-PAPER HUB company site (hero, about, mission, services, values, contact) | `src/App.tsx` (line 175) |
| `ProductsSection` | Product teaser cards on the company site, derived from the registry | `src/components/ProductsSection.tsx` |
| `ProductPage` | Product-generic page shell driven entirely by a `ProductDefinition` | `src/pages/ProductPage.tsx` |
| `ProductHeader` / `OnboardingChoices` / `BrochurePanel` / `QualifyForm` / `QualifyFallback` / `MeasurementDisclosure` | Generic product-shell parts, all parameterised by product data | `src/components/` |
| `qualify-form.logic.ts` | Pure validation/derivation for the qualify form (no JSX) | `src/components/qualify-form.logic.ts` |
| `registry.ts` | Which products are live; slug→route derivation | `src/products/registry.ts` |
| `haoo.ts` | Every HAOO-specific fact: copy, events, options, env resolvers | `src/products/haoo.ts` |
| `types.ts` | The `ProductDefinition` contract the shell consumes | `src/products/types.ts` |
| `copy.ts` | Product-generic label/sentence builders (take `productName`) | `src/products/copy.ts` |
| `measurement/index.ts` | Provider-agnostic engagement context + `createMeasurement` | `src/measurement/index.ts` |
| `measurement/posthog.ts` | PostHog event sink and refusal reasons | `src/measurement/posthog.ts` |
| `measurement/posthog-lockdown.ts` | The frozen PostHog init config contract and its verifier | `src/measurement/posthog-lockdown.ts` |
| `reporting/` | Offline HAOO funnel report: fetch → parse → render | `src/reporting/generate.ts`, `render.ts`, `haoo-report.ts` |
| `approved-analytics-hosts.ts` | Repository-owned ingestion-origin trust anchor, injected at build time | `config/approved-analytics-hosts.ts` |

## Pattern Overview

**Overall:** Data-driven multi-page static SPA — a generic product shell rendered from a declarative `ProductDefinition`, with page selection by HTML document attribute rather than a router.

**Key Characteristics:**
- No router library. Routing is physical: two Vite HTML inputs, one shared bundle, one `document.body.dataset.page` branch.
- Product facts are data (`src/products/haoo.ts`), not components. The shell never names HAOO.
- Fail-closed configuration: every env resolver in `src/products/haoo.ts` returns a safe empty/fallback value on any deviation.
- Trust anchors live outside `src/` and reach the bundle only via the Vite `define` constant `__HAOO_APPROVED_ANALYTICS_HOSTS__`.
- No backend. Form posts go to FormSubmit; analytics go straight to PostHog; reporting runs offline in Node.

## Layers

**Document layer:**
- Purpose: choose which page the shared bundle renders; carry SEO/OG metadata and a no-JS fallback
- Location: `index.html`, `products/haoo/index.html`
- Depends on: `src/main.tsx` only

**Page layer:**
- Purpose: full-page composition
- Location: `src/App.tsx` (HomePage), `src/pages/ProductPage.tsx`
- Depends on: components, `src/products/`, `src/measurement/`

**Component layer:**
- Purpose: reusable, product-agnostic UI parts
- Location: `src/components/`
- Depends on: `src/products/types.ts` and `src/products/copy.ts` only (never `haoo.ts`, except `haoo.ts` importing `assertEngagementSummaryLabel` from `qualify-form.logic.ts`)

**Product data layer:**
- Purpose: declarative product definitions and the contract they satisfy
- Location: `src/products/`
- Used by: pages, components, measurement, reporting

**Measurement layer:**
- Purpose: bounded engagement context and provider-gated event capture
- Location: `src/measurement/`
- Depends on: `src/products/types.ts`, `posthog-js`

**Reporting layer (Node only, never bundled):**
- Purpose: turn PostHog HogQL results into a funnel report
- Location: `src/reporting/`, driven by `scripts/generate-haoo-report.mjs`

## Data Flow

### Page render

1. Browser loads `products/haoo/index.html`, which sets `<body data-page="haoo-product">` and loads `/src/main.tsx`.
2. `src/main.tsx:6` mounts `<App />` into `#root`.
3. `src/App.tsx:656` reads `document.body.dataset.page`; on `'haoo-product'` it returns `<ProductPage product={HAOO_PRODUCT} />` (line 657), otherwise `<HomePage />`.
4. `ProductPage` builds a measurement instance via `createMeasurement(product.measurement, measurementAdapters)` (`src/pages/ProductPage.tsx`).

### Measurement capture

1. `createMeasurement` (`src/measurement/index.ts:260`) reads/derives the bounded engagement context from `window.localStorage` (visit band, last-seen band, capped `utm_*` campaign values, 180-day expiry).
2. `createPostHogEventSink` (`src/measurement/posthog.ts:397`) is created only when the provider resolves to `posthog`, the project key matches `^phc_[A-Za-z0-9_-]+$`, and the API host is a member of the build-injected approved list.
3. `lockdownHolds` (`src/measurement/posthog-lockdown.ts:239`) verifies the init config against the frozen `POSTHOG_LOCKDOWN` contract before capture is permitted; failure yields a `POSTHOG_REFUSAL` reason and no analytics.

### Offline reporting

1. `scripts/generate-haoo-report.mjs` reads `POSTHOG_QUERY_API_KEY` / `POSTHOG_PROJECT_ID` from `process.env` (the only place that does) and rejects the removed Plausible variables.
2. `generateHaooReport` (`src/reporting/generate.ts:403`) issues the HogQL query, validates the echoed query via `src/reporting/query-provenance.ts`, parses counts via `src/reporting/stats-response.ts`.
3. `renderReport` (`src/reporting/render.ts`) emits the funnel report using the stage/period vocabulary in `src/reporting/haoo-report.ts`.

**State Management:**
- React local state only (`useState`/`useRef`/`useMemo`). No store library.
- Cross-session state is the single bounded engagement record in `localStorage`, keyed by `CONTEXT_RECORD_KEYS` (`src/measurement/index.ts:36`) and rejected wholesale if the key set does not match exactly.

## Key Abstractions

**`ProductDefinition`:**
- Purpose: everything the generic shell needs to render a product
- Contract: `src/products/types.ts:240`
- Sole instance: `HAOO_PRODUCT` in `src/products/haoo.ts:472`

**`Measurement<EventName>` / `MeasurementAdapters<EventName>`:**
- Purpose: provider-agnostic tracking surface with injectable `storage` and sink for tests
- Location: `src/measurement/index.ts:19`–`:36`

**`POSTHOG_LOCKDOWN`:**
- Purpose: a frozen, asserted PostHog init configuration; the runtime refuses to capture if the effective config deviates
- Location: `src/measurement/posthog-lockdown.ts:91`

## Entry Points

**Company site:**
- Location: `index.html` → `src/main.tsx` → `HomePage` (`src/App.tsx:175`)
- Canonical URL: `https://www.zero-paperhub.com/`

**HAOO product page:**
- Location: `products/haoo/index.html` → `src/main.tsx` → `ProductPage` (`src/pages/ProductPage.tsx`)
- Canonical URL: `https://www.zero-paperhub.com/products/haoo/`

**Report CLI:**
- Location: `scripts/generate-haoo-report.mjs` (`npm run report:haoo`)
- Triggers: manual/operator run; never bundled

## Company-Site / HAOO Seam (repo-split relevant)

**Product-GENERIC (the reusable shell — moves with either half, or is duplicated):**
- `src/main.tsx`, `src/index.css`
- `src/pages/ProductPage.tsx`
- `src/components/ProductHeader.tsx`, `OnboardingChoices.tsx`, `BrochurePanel.tsx`, `QualifyForm.tsx`, `QualifyFallback.tsx`, `MeasurementDisclosure.tsx`, `qualify-form.logic.ts`
- `src/products/types.ts`, `src/products/copy.ts`, `src/products/engagement-summary.ts`
- `src/measurement/index.ts`, `posthog.ts`, `posthog-lockdown.ts` (generic over `EventName`; only the config values are HAOO's)

**HAOO-SPECIFIC:**
- `products/haoo/index.html` (title, canonical, OG, `data-page`, noscript block with HAOO contact links)
- `src/products/haoo.ts` (810 lines — all HAOO copy, events, county/role options, env resolvers)
- `src/reporting/*` — `haoo-report.ts`, `render.ts`, `generate.ts`, `query-provenance.ts`, `stats-response.ts`, `untrusted.ts` (typed against `HaooMeasurementEvent`)
- `scripts/generate-haoo-report.mjs`
- `public/products/haoo/` assets (brochure PDF, hero, logo, preview)
- Tests: `src/test/haoo-*.test.*`, `measurement*.test.*`, `qualify-*.test.*`

**COMPANY-SITE-SPECIFIC:**
- `index.html`, `HomePage` + `downloadCompanyProfile` + `NAV_LINKS` + `VALUES` + `SERVICES` in `src/App.tsx`
- `CONTACT_FORM_ENDPOINT` / `CONTACT_SUCCESS_URL` (`src/App.tsx:142`–`:143`)
- `public/marketing/`, `public/zero-paper_hub_hi-def.png`, `public/image.png`
- `src/components/ProductsSection.tsx` + `src/products/registry.ts` (the cross-link into the product half)

**Build-time couplings that must be cut on a split:**
1. `vite.config.ts` declares both HTML inputs under one `rollupOptions.input` — one build, one `dist/`.
2. Both documents load the same `/src/main.tsx`, so a single JS bundle serves both halves.
3. `src/App.tsx` statically imports `ProductPage`, `HAOO_PRODUCT`, `PRODUCTS` and `productsNavLink` — the company bundle contains the whole HAOO product page and every HAOO string today (no lazy boundary).
4. `src/components/ProductsSection.tsx` + `src/products/registry.ts` bind the company site to `HAOO_PRODUCT` and to the physical path `/products/{slug}/`.
5. `products/haoo/index.html` references company-owned assets — `/zero-paper_hub_hi-def.png` favicon and `og:site_name` "ZERO-PAPER HUB" — and `parentRelationshipLine` (`src/products/copy.ts:157`) renders the parent-brand line into the product page.
6. `config/approved-analytics-hosts.ts` + the Vite `define` of `__HAOO_APPROVED_ANALYTICS_HOSTS__` sit in the shared root config but exist solely for HAOO measurement.
7. `rollupOptions.output.manualChunks['posthog-sdk']` and `src/test/build-output.test.ts` (1653 lines) both partition on the shared `dist/assets` layout produced by the combined build.
8. `public/` is one shared static root serving both halves; `public/.htaccess` rewrites all non-file requests to the company `/index.html`.
9. `npm test` runs `vite build` first, so every test asserting bundle contents depends on the two-input build.

## Architectural Constraints

- **Threading:** browser main thread only; the report CLI is a single-shot Node process.
- **Global state:** `document.body.dataset.page` is read directly at render time in `src/App.tsx:656` — a module-level DOM dependency that makes `App` untestable without a body attribute.
- **Circular imports:** `src/products/haoo.ts` imports `assertEngagementSummaryLabel` from `src/components/qualify-form.logic.ts`, inverting the usual data→UI direction. `src/products/types.ts` imports bands from `src/measurement`, while `src/measurement/index.ts` imports `ProductMeasurement` from `src/products/types` — a type-only cycle.
- **Config constant:** `__HAOO_APPROVED_ANALYTICS_HOSTS__` does not exist under Vitest; `buildTimeApprovedAnalyticsHosts()` swallows the `ReferenceError` and fails closed (`src/products/haoo.ts:79`).
- **No import aliases:** all imports are relative paths.

## Anti-Patterns

### Naming a product inside the shell

**What happens:** putting HAOO copy or the string "HAOO" into `src/pages/ProductPage.tsx` or `src/components/*`.
**Why it's wrong:** the shell is asserted product-generic by `src/test/product-shell-reuse.test.tsx`, and the upcoming repo split depends on that boundary holding.
**Do this instead:** add the fact to `src/products/haoo.ts` and a builder that takes `productName` to `src/products/copy.ts`.

### Hardcoding an analytics origin under `src/`

**What happens:** writing `https://us.i.posthog.com` into a module in `src/`.
**Why it's wrong:** `src/test/build-output.test.ts` forbids the ingestion host literal in every production source file; a provider-unset build must carry no ingestion origin at all.
**Do this instead:** extend `config/approved-analytics-hosts.ts` and let `vite.config.ts` inject it via `__HAOO_APPROVED_ANALYTICS_HOSTS__`.

### Adding a page by branching further on `data-page`

**What happens:** stacking more `document.body.dataset.page` cases in `src/App.tsx`.
**Why it's wrong:** every new case ships in both bundles, growing the company/product coupling the split is meant to remove.
**Do this instead:** add a new HTML input in `vite.config.ts` and keep the branch to a single lookup against the registry.

### Reading report credentials in bundled code

**What happens:** referencing `POSTHOG_QUERY_API_KEY` or `POSTHOG_PROJECT_ID` from anything under `src/` that the browser build reaches.
**Why it's wrong:** those are private credentials; only `VITE_`-prefixed public values may enter the bundle.
**Do this instead:** keep `process.env` reads in `scripts/generate-haoo-report.mjs` and pass values into `generateHaooReport`.

## Error Handling

**Strategy:** fail closed, return a typed refusal rather than throw.

**Patterns:**
- Env resolvers return `''`/`'none'`/fallback on any deviation (`resolveMeasurementProvider`, `resolvePostHogToken`, `resolvePostHogApiHost`, `resolveQualifyEndpoint` in `src/products/haoo.ts`).
- Measurement refusals are frozen named reasons (`POSTHOG_REFUSAL`, `src/measurement/posthog.ts:86`); no analytics is the safe outcome.
- Untrusted API payloads pass through `isPlainObject` (`src/reporting/untrusted.ts:17`) and explicit column/shape validation before use.
- UI degrades to contact fallbacks: `QualifyFallback.tsx`, plus `<noscript>` blocks in `products/haoo/index.html`.

## Cross-Cutting Concerns

**Logging:** none in browser code; the report CLI writes to stdout/stderr.
**Validation:** field-level rules in `src/components/qualify-form.logic.ts`; response validation in `src/reporting/`.
**Authentication:** none in the browser. The report CLI uses a bearer key from `process.env` with PostHog "Query Read" scope.
**Privacy disclosure:** `src/components/MeasurementDisclosure.tsx` renders the bounded record described by `ProductMeasurementDisclosure` (`src/products/types.ts:170`).

---

*Architecture analysis: 2026-09-05*
