---
last_mapped_commit: 7a99cab52f8907ebb43e9618c909ed785d088dbe
---
<!-- refreshed: 2026-09-02 -->
# Technology Stack

**Analysis Date:** 2026-09-02

## Languages

**Primary:**
- TypeScript 5.5+ (`^5.5.3`) - All application source under `src/` (`.ts`, `.tsx`). Strict mode on (`tsconfig.app.json`).
- TSX/JSX (`react-jsx` transform) - React components in `src/components/`, `src/pages/`, `src/App.tsx`

**Secondary:**
- JavaScript (ESM `.mjs`/`.js`) - Tooling and CLI only: `eslint.config.js`, `tailwind.config.js`, `postcss.config.js`, `scripts/assert-phase1-red.mjs`, `scripts/generate-haoo-report.mjs`, `scripts/verify-phase4-coverage.mjs`
- HTML - Multi-page Vite entry points: `index.html`, `products/haoo/index.html` (the HAOO page ships a full `<noscript>` recovery block). Also emitted as report output by `src/reporting/render.ts`.
- CSS - `src/index.css` (Tailwind directives); the generated report carries its own inline stylesheet (`src/reporting/render.ts`)

## Runtime

**Two runtimes, strictly separated:**

**1. Browser (the shipped site):**
- No server-side runtime; the build output is static and published to GitHub Pages.
- ES2020 target, `module: ESNext`, `moduleResolution: bundler` (`tsconfig.app.json`)

**2. Node.js (build, CI, and the owner report CLI):**
- Node.js **>= 22.18.0**, enforced by `engines.node` in `package.json`. The floor is not arbitrary: `scripts/generate-haoo-report.mjs` imports `../src/reporting/generate.ts` directly and relies on Node's native TypeScript type stripping, on by default from 22.18.0 / 23.6.0.
- CI pins `node-version: 22` (`.github/workflows/deploy.yml`, `actions/setup-node@v6`). No `.nvmrc` present.

**Package Manager:**
- npm (`npm ci` in CI)
- Lockfile: present — `package-lock.json`

## Frameworks

**Core:**
- React 18 (`^18.3.1`) + React DOM (`^18.3.1`) - SPA rendering, mounted in `src/main.tsx` under `StrictMode`
- Tailwind CSS 3 (`^3.4.1`) - Utility styling; config `tailwind.config.js` scans `./index.html` and `./src/**/*.{js,ts,jsx,tsx}` (note: `products/haoo/index.html` is NOT in the content globs)

**Testing:**
- Vitest 3.2.4 - Test runner, config `vitest.config.ts`, `jsdom` environment, `globals: false` (explicit imports required)
- @testing-library/react 16.3.2 + @testing-library/dom 10.4.1 - Component tests in `src/test/`
- jsdom 26.1.0 - DOM implementation
- Setup file: `src/test/setup.ts`
- Node-level fixtures for the report CLI: `src/test/fixtures/haoo-report-cli-fetch-preload.mjs`, `src/test/fixtures/plausible-preload-contract.ts`

**Build/Dev:**
- Vite 5 (`^5.4.2`) - Dev server and bundler, config `vite.config.ts`
- @vitejs/plugin-react (`^4.3.1`) - React fast refresh / JSX
- PostCSS 8 + Autoprefixer - `postcss.config.js`
- ESLint 9 flat config + typescript-eslint 8 - `eslint.config.js`, with a dedicated Node-globals block covering `scripts/**/*.mjs` so the credentialed report CLI is rule-checked

## Key Dependencies

**Critical:**
- `react` / `react-dom` `^18.3.1` - Entire UI layer
- `lucide-react` `^0.344.0` - Icon set used across `src/App.tsx` and components; explicitly excluded from Vite dep pre-bundling (`optimizeDeps.exclude` in `vite.config.ts`)

**Infrastructure:**
- `typescript-eslint` `^8.3.0` - Type-aware linting gate in CI
- `@types/node` `22.20.1` - Enables `node:path` / `node:fs` usage in `vite.config.ts` and `scripts/generate-haoo-report.mjs`

**Notably absent:** no analytics SDK, no HTTP client, no state library, no router, no database driver. The Plausible integration (`src/measurement/plausible.ts`) is a hand-written script-tag + pre-load-queue adapter with zero dependencies; the Stats API client (`src/reporting/generate.ts`) uses injected `fetch`.

## Configuration

**Environment:**

*Browser build-time (`import.meta.env`, statically inlined by Vite — world-readable, never secrets):*
- `VITE_HAOO_FORM_ENDPOINT` (optional) - HAOO enquiry endpoint override. Declared in `src/vite-env.d.ts`; validated by `resolveQualifyEndpoint()` in `src/products/haoo.ts`. GitHub Actions repository **variable**; address obfuscation only.
- `VITE_HAOO_MEASUREMENT_PROVIDER` (optional) - `resolveMeasurementProvider()` in `src/products/haoo.ts`. Accepted set is `'none' | 'plausible'` (`src/products/types.ts:156`); every other value fails closed to `'none'`.
- `VITE_HAOO_PLAUSIBLE_SRC` (optional) - Site script URL, validated by `resolvePlausibleScriptSrc()` (`src/products/haoo.ts:63`): absolute `https:`, no credentials/query/fragment, path must end `.js`; otherwise `''`.
- `VITE_HAOO_PLAUSIBLE_DOMAIN` (optional) - Trimmed at `src/products/haoo.ts:128`; empty leaves collection disabled.
- Gap: only `VITE_HAOO_FORM_ENDPOINT` is declared in the `ImportMetaEnv` interface in `src/vite-env.d.ts`; the three measurement variables are read without a declaration.
- Gap: `.github/workflows/deploy.yml` passes only `VITE_HAOO_FORM_ENDPOINT`, so deployed builds resolve the provider to `'none'` by design pending privacy-owner approval (README.md).

*Node runtime secrets (report CLI only, never bundled):*
- `PLAUSIBLE_STATS_API_KEY` (**required**) - Read only at `scripts/generate-haoo-report.mjs:39`, sent only as an `Authorization: Bearer` header in `src/reporting/generate.ts:127`.
- `PLAUSIBLE_SITE_ID` (**required**) - `scripts/generate-haoo-report.mjs:40`.
- Both missing/blank → the CLI prints the locked error sentence to stderr and exits 1 without writing.

- `.env`, `.env.*` are git-ignored (`.gitignore`, `!.env.example`); no `.env` file is present. `.reports/` is git-ignored because generated reports carry aggregate business counts.

**Build:**
- `vite.config.ts` - `base: '/'`, multi-page `rollupOptions.input` with `main` (`index.html`) and `haoo` (`products/haoo/index.html`)
- `tsconfig.json` (project references) → `tsconfig.app.json` (`include: ["src"]`) + `tsconfig.node.json` (config files)
- `vitest.config.ts` - separate config from Vite build

**Scripts (`package.json`):**
```bash
npm run dev              # vite dev server
npm run build            # vite build -> dist/
npm run lint             # eslint . (includes scripts/**/*.mjs)
npm run typecheck        # tsc --noEmit -p tsconfig.app.json
npm run test             # build + vitest run (build-output tests need dist/)
npm run test:unit        # vitest run only
npm run test:phase1:red  # node scripts/assert-phase1-red.mjs
npm run report:haoo      # node scripts/generate-haoo-report.mjs -> .reports/haoo-funnel-report.html
```
Unlisted helper: `scripts/verify-phase4-coverage.mjs` (run directly with `node`).

## Platform Requirements

**Development:**
- Node.js >= 22.18.0, npm
- No database, no backend service, no containers

**Production:**
- GitHub Pages static hosting (`.github/workflows/deploy.yml`)
- Custom domain `www.zero-paperhub.com` (`CNAME`, also `public/CNAME.txt`)
- Artifact: `dist/` uploaded via `actions/upload-pages-artifact@v4`
- Owner reporting runs **locally**, not in CI — no workflow invokes `report:haoo`, so the Stats API key never enters GitHub Actions.

---

*Stack analysis: 2026-09-02*
