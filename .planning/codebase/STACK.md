---
last_mapped_commit: e91a3b97ce46cd965624cfda94abc6c34c86d2a4
---
<!-- refreshed: 2026-09-05 -->
# Technology Stack

**Analysis Date:** 2026-09-05

## Languages

**Primary:**
- TypeScript ~5.5.3 — all application source under `src/`, plus root build configuration (`vite.config.ts`, `vitest.config.ts`) and the trust-anchor module `config/approved-analytics-hosts.ts`. Target `ES2020`, `strict: true`, `moduleResolution: "bundler"`, `jsx: "react-jsx"` (`tsconfig.app.json`).
- TSX — React components in `src/components/`, `src/pages/`, `src/App.tsx`, `src/main.tsx`.

**Secondary:**
- JavaScript ESM (`.mjs`) — Node-side CLI tooling in `scripts/` (`generate-haoo-report.mjs`, `verify-phase4-coverage.mjs`, `assert-phase1-red.mjs`) and the test preload fixture `src/test/fixtures/haoo-report-cli-fetch-preload.mjs`. Typechecked via `tsconfig.node.json`, linted under a Node-globals ESLint block.
- HTML — two build entry documents: `index.html` (hub) and `products/haoo/index.html` (HAOO product page).
- CSS via Tailwind directives — `src/index.css`.

## Runtime

**Environment:**
- Node.js — `engines.node: ">=22.18.0"` (`package.json`); CI pins `node-version: 22` (`.github/workflows/deploy.yml`). Local machine currently runs v24.12.0.
- Browsers — the shipped artifact is a static ES2020 bundle; no server runtime in production.

**Package Manager:**
- npm 11.x
- Lockfile: `package-lock.json` present and committed; CI installs with `npm ci`.

## Frameworks

**Core:**
- React 18.3.1 + React DOM 18.3.1 — `src/main.tsx`, `src/App.tsx`, `src/pages/ProductPage.tsx`.
- Tailwind CSS 3.4.x — `tailwind.config.js` (content globs `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`), no custom theme extensions, no plugins.

**Testing:**
- Vitest 3.2.4 — `vitest.config.ts`, `environment: 'jsdom'`, `globals: false`, setup file `src/test/setup.ts`. Excludes `.claude/**` and `.gsd/**` so agent worktree duplicates are not discovered.
- `@testing-library/react` 16.3.2 and `@testing-library/dom` 10.4.1.
- jsdom 26.1.0.

**Build/Dev:**
- Vite ^5.4.2 with `@vitejs/plugin-react` ^4.3.1 — `vite.config.ts`.
- PostCSS 8 + Autoprefixer 10 — `postcss.config.js`.
- ESLint 9 flat config with `typescript-eslint` ^8.3.0, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` — `eslint.config.js`.

## Key Dependencies

**Critical:**
- `posthog-js` **pinned at 1.425.1** (exact, no caret) — the only measurement provider. Bundled as a dependency rather than fetched as a remote script; wrapped by `src/measurement/posthog.ts` and constrained by `src/measurement/posthog-lockdown.ts`.
- `lucide-react` ^0.344.0 — icon set; excluded from Vite dep pre-bundling via `optimizeDeps.exclude`.

**Infrastructure:**
- `@types/node` 22.20.1 — types for the Node-side scripts and root config.
- Transitive PostHog runtime (`preact`, `dompurify`, `fflate`, `core-js`, `web-vitals`) — explicitly named in `vite.config.ts` `manualChunks` so the vendor SDK lands in an isolated `posthog-sdk` chunk that `src/test/build-output.test.ts` can partition on.

## Configuration

**Environment:**
- Public, browser-inlined build variables (Vite `VITE_` prefix, declared exhaustively in `src/vite-env.d.ts`):
  - `VITE_HAOO_FORM_ENDPOINT` — enquiry POST destination (obfuscation only, never secrecy).
  - `VITE_HAOO_MEASUREMENT_PROVIDER` — fail-closed selector; only `none` or `posthog` accepted (`src/products/haoo.ts`).
  - `VITE_HAOO_POSTHOG_TOKEN` — public write-only project key.
  - `VITE_HAOO_POSTHOG_API_HOST` — may only *select from* the repository-approved host list, never widen it.
- Server-side report credentials, read only by `scripts/generate-haoo-report.mjs` via `process.env`, and forbidden from any `VITE_*` name: `POSTHOG_QUERY_API_KEY`, `POSTHOG_PROJECT_ID`.
- `.env` and `.env.*` are gitignored (`.env.example` exempted). No `.env` file is present in the tree.
- Build-time injected constant: `__HAOO_APPROVED_ANALYTICS_HOSTS__`, defined in `vite.config.ts` from `config/approved-analytics-hosts.ts`, gated on the resolved provider (empty array unless the provider is exactly `posthog`).

**Build:**
- `vite.config.ts` — multi-entry rollup input (`index.html`, `products/haoo/index.html`), `base: '/'`, `define` block, `manualChunks`.
- `tsconfig.json` (solution) → `tsconfig.app.json` (`src`) + `tsconfig.node.json` (root config and scripts).
- `eslint.config.js`, `postcss.config.js`, `tailwind.config.js`.

## Scripts

```bash
npm run dev              # vite dev server
npm run build            # vite build (multi-entry -> dist/)
npm run typecheck        # tsc --noEmit on both app and node projects
npm run lint             # eslint .
npm test                 # build, then vitest run
npm run test:unit        # vitest run only (used in CI after Build)
npm run verify:coverage  # phase capability-coverage audit
npm run report:haoo      # credentialed PostHog HogQL funnel report -> .reports/
```

## Platform Requirements

**Development:**
- Node >= 22.18.0, npm, POSIX shell. No database, container, or backend service needed to run the site locally.
- `npm run report:haoo` additionally requires `POSTHOG_QUERY_API_KEY` and `POSTHOG_PROJECT_ID` in the local shell.

**Production:**
- GitHub Pages static hosting via `.github/workflows/deploy.yml` (`actions/configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4`), artifact path `./dist`.
- Custom domain `www.zero-paperhub.com` (`CNAME`, `public/CNAME.txt`); `public/.htaccess` also shipped.
- CI gate order: checkout → setup-node 22 (npm cache) → `npm ci` → typecheck → lint → `verify:coverage` → build (with the four `VITE_*` repository *variables*) → `test:unit` → Pages deploy.

---

*Stack analysis: 2026-09-05*
