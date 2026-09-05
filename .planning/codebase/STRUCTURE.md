---
last_mapped_commit: e91a3b97ce46cd965624cfda94abc6c34c86d2a4
---
<!-- refreshed: 2026-09-05 -->
# Codebase Structure

**Analysis Date:** 2026-09-05

## Directory Layout

```
ZERO-PAPERHUB/
├── index.html                  # Vite input 1 — company site document
├── products/
│   └── haoo/index.html         # Vite input 2 — HAOO product document (data-page="haoo-product")
├── src/
│   ├── main.tsx                # Single React root, shared by both documents
│   ├── App.tsx                 # HomePage (company site) + App() page branch
│   ├── index.css               # Tailwind entry
│   ├── vite-env.d.ts           # ImportMetaEnv + __HAOO_APPROVED_ANALYTICS_HOSTS__ declarations
│   ├── pages/                  # Full-page compositions (product-generic)
│   ├── components/             # Reusable product-shell UI + pure form logic
│   ├── products/               # Product definitions, contract, generic copy builders
│   ├── measurement/            # Engagement context + PostHog sink + lockdown contract
│   ├── reporting/              # Offline HAOO funnel report (Node only)
│   └── test/                   # All tests + fixtures
├── config/
│   └── approved-analytics-hosts.ts   # Trust anchor, deliberately outside src/
├── scripts/                    # Node CLIs (report generation, coverage/red-state gates)
├── public/                     # Static root copied verbatim into dist/
├── dist/                       # Build output (generated)
├── vite.config.ts              # Two HTML inputs, define constant, posthog-sdk manual chunk
├── vitest.config.ts
├── tailwind.config.js / postcss.config.js / eslint.config.js
└── tsconfig.json / tsconfig.app.json (src) / tsconfig.node.json (vite.config.ts + config/)
```

## Directory Purposes

**`src/pages/`:**
- Purpose: full-page composition for a product
- Key files: `src/pages/ProductPage.tsx` (product-generic shell, driven by a `ProductDefinition` prop)

**`src/components/`:**
- Purpose: reusable, product-agnostic UI parts and pure logic
- Key files: `src/components/QualifyForm.tsx` (631 lines), `src/components/qualify-form.logic.ts` (pure, non-JSX), `src/components/BrochurePanel.tsx`, `src/components/ProductHeader.tsx`, `src/components/OnboardingChoices.tsx`, `src/components/QualifyFallback.tsx`, `src/components/MeasurementDisclosure.tsx`, `src/components/ProductsSection.tsx` (company-site only)

**`src/products/`:**
- Purpose: declarative product data and its contract
- Key files: `src/products/types.ts` (the `ProductDefinition` contract), `src/products/haoo.ts` (all HAOO facts, 810 lines), `src/products/registry.ts` (which products are live), `src/products/copy.ts` (generic label builders taking `productName`), `src/products/engagement-summary.ts`

**`src/measurement/`:**
- Purpose: bounded engagement context and provider-gated capture
- Key files: `src/measurement/index.ts` (generic, `createMeasurement`), `src/measurement/posthog.ts` (sink + refusal reasons), `src/measurement/posthog-lockdown.ts` (frozen init contract)

**`src/reporting/`:**
- Purpose: offline funnel report from PostHog HogQL results; never bundled into the browser
- Key files: `src/reporting/generate.ts` (orchestration), `src/reporting/render.ts`, `src/reporting/haoo-report.ts` (stage/period vocabulary), `src/reporting/query-provenance.ts`, `src/reporting/stats-response.ts`, `src/reporting/untrusted.ts`

**`src/test/`:**
- Purpose: every test in the repo, plus fixtures
- Key files: `src/test/build-output.test.ts` (1653 lines — scans `dist/assets`, partitions on the `posthog-sdk` chunk), `src/test/product-shell-reuse.test.tsx` (enforces the generic-shell boundary), `src/test/setup.ts`, `src/test/fixtures/`

**`config/`:**
- Purpose: repository-owned trust anchors that must not be importable from `src/`
- Key files: `config/approved-analytics-hosts.ts`

**`scripts/`:**
- Purpose: Node CLIs
- Key files: `scripts/generate-haoo-report.mjs` (only `process.env` reader), `scripts/verify-phase4-coverage.mjs`, `scripts/assert-phase1-red.mjs`

**`public/`:**
- Purpose: static assets copied verbatim
- Contents: `public/products/haoo/` (HAOO brochure PDF, hero, logo, preview — product half), `public/marketing/` and `public/zero-paper_hub_hi-def.png` (company half), `public/.htaccess` (MIME fixes + rewrite of non-file requests to `/index.html`), `public/CNAME.txt`
- Generated: No — Committed: Yes

## Key File Locations

**Entry Points:**
- `index.html`: company-site document
- `products/haoo/index.html`: HAOO product document, carries `data-page` and the no-JS fallback
- `src/main.tsx`: shared React root
- `src/App.tsx` (line 655): the `data-page` branch
- `scripts/generate-haoo-report.mjs`: report CLI (`npm run report:haoo`)

**Configuration:**
- `vite.config.ts`: two HTML inputs, `__HAOO_APPROVED_ANALYTICS_HOSTS__` define, `posthog-sdk` manual chunk
- `vitest.config.ts`, `eslint.config.js`, `tailwind.config.js`, `postcss.config.js`
- `tsconfig.app.json` covers `src`; `tsconfig.node.json` covers `vite.config.ts` and `config`
- `src/vite-env.d.ts`: declares `VITE_HAOO_FORM_ENDPOINT`, `VITE_HAOO_MEASUREMENT_PROVIDER`, `VITE_HAOO_POSTHOG_TOKEN`, `VITE_HAOO_POSTHOG_API_HOST`

**Core Logic:**
- `src/products/haoo.ts`: all HAOO facts and every env resolver
- `src/pages/ProductPage.tsx`: the product shell
- `src/measurement/index.ts`: engagement-context derivation

**Testing:**
- `src/test/*.test.ts` / `*.test.tsx`

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (`QualifyForm.tsx`, `ProductPage.tsx`)
- Non-JSX modules: `kebab-case.ts` (`engagement-summary.ts`, `posthog-lockdown.ts`, `query-provenance.ts`)
- Pure logic split out of a component: `<component-name>.logic.ts` (`qualify-form.logic.ts`)
- Tests: `kebab-case.test.ts` / `.test.tsx` under `src/test/`
- Node CLIs: `kebab-case.mjs` under `scripts/`

**Directories:**
- lowercase, singular for a layer (`pages`, `products`, `measurement`, `reporting`), plural for collections (`components`, `scripts`)
- Product routes mirror the slug: `products/<slug>/`, `public/products/<slug>/`

**Symbols:**
- Product data constants: `SCREAMING_SNAKE_CASE` (`HAOO_PRODUCT`, `HAOO_MEASUREMENT_EVENTS`, `QUALIFY_ENDPOINT`)
- Env resolvers: `resolveX(configuredValue?: string)`

## Where to Add New Code

**New product (second product alongside HAOO):**
- Document: `products/<slug>/index.html` with `<body data-page="<slug>-product">`
- Data: `src/products/<slug>.ts` exporting a `ProductDefinition`
- Register: add to `PRODUCTS` in `src/products/registry.ts`
- Build: add the input to `rollupOptions.input` in `vite.config.ts`
- Branch: add the case in `App()` (`src/App.tsx:655`)
- Assets: `public/products/<slug>/`

**New product-page UI:**
- Component: `src/components/<Name>.tsx`, parameterised by props from `ProductDefinition` — never naming a product
- Copy builders: `src/products/copy.ts` (take `productName`/`slug`)
- Contract change: `src/products/types.ts`

**New company-site section:**
- `HomePage` in `src/App.tsx`, plus an entry in `NAV_LINKS` (`src/App.tsx:110`)

**New measurement event:**
- Add the name to `HAOO_MEASUREMENT_EVENTS` (`src/products/haoo.ts:24`) and its disclosure entry in `HAOO_MEASUREMENT`
- Add the reporting stage/label in `src/reporting/haoo-report.ts`

**New analytics origin:**
- `config/approved-analytics-hosts.ts` only — never a literal under `src/`

**Tests:**
- `src/test/<subject>.test.ts(x)`; fixtures in `src/test/fixtures/`

## Special Directories

**`dist/`:** build output; generated; not committed as source (`npm test` builds it first, and `src/test/build-output.test.ts` scans `dist/assets`).
**`node_modules/`:** generated, not committed.
**`.planning/`:** GSD planning artifacts, committed.
**`config/`:** must not be imported from `src/`; only `vite.config.ts` reads it.

---

*Structure analysis: 2026-09-05*
