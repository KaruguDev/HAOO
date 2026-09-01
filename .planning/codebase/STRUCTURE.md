# Codebase Structure

**Analysis Date:** 2026-09-01

## Directory Layout

```
ZERO-PAPERHUB/
├── index.html                  # Home entry document (Vite input "main")
├── products/
│   └── haoo/index.html         # HAOO product entry document (Vite input "haoo")
├── src/
│   ├── main.tsx                # React bootstrap
│   ├── App.tsx                 # HomePage + data-page router
│   ├── index.css               # Tailwind directives / global styles
│   ├── vite-env.d.ts           # Typed import.meta.env declarations
│   ├── components/             # Presentational, props-driven units
│   ├── pages/                  # Whole-document compositions
│   ├── products/               # Product data layer (types, definitions, registry, copy)
│   ├── measurement/            # Privacy-bounded engagement context facade
│   └── test/                   # All vitest suites
├── public/                     # Copied verbatim to dist/ (images, PDFs, CNAME, .htaccess)
├── scripts/assert-phase1-red.mjs  # Red-state guard script
├── dist/                       # Build output (generated, gitignored)
├── .github/workflows/deploy.yml   # Typecheck→lint→build→test→Pages deploy
├── .planning/                  # GSD planning artifacts
├── AGENTS.md                   # Agent working agreement for this repo
└── vite.config.ts / vitest.config.ts / tailwind.config.js / eslint.config.js / tsconfig*.json
```

## Directory Purposes

**`src/components/`:**
- Purpose: Reusable presentational units rendered by pages
- Contains: `.tsx` components plus co-located pure logic modules
- Key files: `QualifyForm.tsx`, `qualify-form.logic.ts`, `OnboardingChoices.tsx`, `BrochurePanel.tsx`, `ProductHeader.tsx`, `QualifyFallback.tsx`, `MeasurementDisclosure.tsx`, `ProductsSection.tsx`
- Rule: never import from `src/pages/`; never hardcode product facts

**`src/pages/`:**
- Purpose: Full-document composition and page-level effects
- Key files: `ProductPage.tsx` (the reusable product shell)
- Note: the home page still lives inline as `HomePage` inside `src/App.tsx`

**`src/products/`:**
- Purpose: Single source of truth for product facts and their contract
- Key files: `types.ts` (contract), `haoo.ts` (the one live definition), `registry.ts` (which products ship, route derivation), `copy.ts` (identity-guarded shared labels)

**`src/measurement/`:**
- Purpose: Local engagement-context facade with injectable adapters
- Key files: `index.ts`

**`src/test/`:**
- Purpose: All tests, centralized (not co-located)
- Key files: `setup.ts` (vitest setup), `build-output.test.ts` (asserts the real `dist/`), `qualify-form.test.tsx`, `qualify-data.test.ts`, `measurement.test.ts`, `measurement-page.test.tsx`, `haoo-page.test.tsx`, `haoo-content.test.ts`, `product-shell-reuse.test.tsx`, `products-section.test.tsx`, `focus-contrast.test.ts`

**`public/`:**
- Purpose: Assets served at the URL root, untouched by the bundler
- Contains: `products/haoo/` brochure PDF + preview/hero/logo PNGs, `marketing/` collateral, `zero-paper_hub_hi-def.png`, `CNAME.txt`, `.htaccess`

**`products/`:**
- Purpose: Per-product HTML entry documents only (no TS/JS). Distinct from `src/products/` (data) and `public/products/` (assets).

## Key File Locations

**Entry Points:**
- `index.html`: home document, home SEO metadata
- `products/haoo/index.html`: product document, sets `data-page="haoo-product"`, noscript fallback
- `src/main.tsx`: React root mount
- `src/App.tsx`: page selection + HomePage

**Configuration:**
- `vite.config.ts`: multi-page Rollup inputs, `base: '/'`, `lucide-react` excluded from prebundling
- `vitest.config.ts`: jsdom environment, `src/test/setup.ts`
- `tsconfig.app.json` / `tsconfig.node.json` / `tsconfig.json`: project references
- `eslint.config.js`, `tailwind.config.js`, `postcss.config.js`
- `src/vite-env.d.ts`: declares `VITE_HAOO_FORM_ENDPOINT`, `VITE_HAOO_MEASUREMENT_PROVIDER`
- `.github/workflows/deploy.yml`: CI/CD gate order

**Core Logic:**
- `src/products/types.ts`: the contract new products must satisfy
- `src/products/haoo.ts`: every HAOO fact, including endpoint resolution
- `src/components/qualify-form.logic.ts`: validation, submission body, status copy
- `src/measurement/index.ts`: context banding, campaign parsing, storage lifecycle

**Testing:**
- `src/test/*.test.ts` / `*.test.tsx`
- `scripts/assert-phase1-red.mjs`

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` — `QualifyForm.tsx`, `ProductPage.tsx`
- Pure logic / data modules: `kebab-case.ts` or single-word lowercase — `qualify-form.logic.ts`, `registry.ts`, `copy.ts`, `haoo.ts`
- Co-located logic for a component: `<component-kebab>.logic.ts`
- Tests: `<subject>.test.ts` for logic, `<subject>.test.tsx` for rendering
- Barrel-style module entry: `index.ts` (used only by `src/measurement/`)

**Directories:**
- Lowercase, singular-by-concern: `components`, `pages`, `products`, `measurement`, `test`
- Product asset and document folders are named by slug: `haoo`

**Exports:**
- Components: `export default`
- Data, types, helpers, constants: named exports; constants `SCREAMING_SNAKE_CASE` (`PRODUCTS`, `QUALIFY_ENDPOINT_FALLBACK`, `HONEYPOT_NAME`)

**Routes:** derived from slug as `/products/<slug>/` via `productRoute()` in `src/products/registry.ts`.

## Where to Add New Code

**New product:**
1. Definition: `src/products/<slug>.ts` exporting a `ProductDefinition`
2. Register: add to `PRODUCTS` in `src/products/registry.ts`
3. Entry document: `products/<slug>/index.html` with `<body data-page="<slug>-product">`, canonical URL, metadata, noscript fallback
4. Register the document as a Rollup input in `vite.config.ts`
5. Add the branch in `App` (`src/App.tsx`)
6. Assets: `public/products/<slug>/`
7. Tests: `src/test/<slug>-content.test.ts` and `src/test/<slug>-page.test.tsx`; extend `src/test/build-output.test.ts`

**New product page section:**
- Component: `src/components/<Name>.tsx`, props typed from `src/products/types.ts`
- Compose in `src/pages/ProductPage.tsx`
- Any new copy becomes a definition field, not an inline string

**New product field:**
- Extend `src/products/types.ts` first (readonly), then every definition, then consumers — the compiler drives the change

**New shared label:**
- `src/products/copy.ts`, guarded by `requireIdentity`

**New measurement event or flag:**
- Add the event name and `interactionEventFlags` entry in the product's `measurement` config (`src/products/haoo.ts`); if the stored record shape changes, bump `schemaVersion` and update `CONTEXT_RECORD_KEYS` in `src/measurement/index.ts`
- Add disclosure text under `measurement.disclosure.signalLines` — the disclosure is typed per event name, so an undisclosed event fails typecheck

**New form field:**
- Add a `QualifyField` to the product's `qualify.fields` and place its name in a `groups` entry; validation is derived, not hand-written. Never use a name in `RESERVED_EMAIL_LABELS`.

**Static asset:**
- `public/` (root-served, hashed nothing) — reference by absolute path such as `/products/haoo/haoo-hero.png`

**Tests:**
- Always `src/test/`, never co-located

## Special Directories

**`dist/`:** build output. Generated: yes. Committed: no (gitignored). Asserted by `src/test/build-output.test.ts`, so it must exist before `npm run test:unit`.

**`node_modules/`:** generated, not committed.

**`.planning/`:** GSD phase plans, roadmap, state, and these codebase documents. Committed.

**`.claude/worktrees/`:** transient GSD execution worktrees containing full repo copies. Not source; exclude from searches and analysis.

**`.bolt/`, `.gsd/`:** tooling metadata (`config.json`, `prompt`, `dispatch-isolation-sentinel.json`). Not application code.

**`public/marketing/`:** marketing collateral (HTML/PDF/PNG) shipped as static files, not part of the React app.

---

*Structure analysis: 2026-09-01*
