# Technology Stack

**Analysis Date:** 2026-09-01

## Languages

**Primary:**
- TypeScript 5.5+ (`^5.5.3`) - All application source under `src/` (`.ts`, `.tsx`). Strict mode on (`tsconfig.app.json`).
- TSX/JSX (`react-jsx` transform) - React components in `src/components/`, `src/pages/`, `src/App.tsx`

**Secondary:**
- JavaScript (ESM `.mjs`/`.js`) - Tooling config only: `eslint.config.js`, `tailwind.config.js`, `postcss.config.js`, `scripts/assert-phase1-red.mjs`
- HTML - Multi-page Vite entry points: `index.html`, `products/haoo/index.html` (the HAOO page ships a full `<noscript>` recovery block)
- CSS - `src/index.css` (Tailwind directives)

## Runtime

**Environment:**
- Browser only. No server-side runtime; the build output is static and published to GitHub Pages.
- Node.js 22 for build/CI (pinned in `.github/workflows/deploy.yml`, `actions/setup-node@v6`). No `.nvmrc` present.
- ES2020 target, `module: ESNext`, `moduleResolution: bundler` (`tsconfig.app.json`)

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

**Build/Dev:**
- Vite 5 (`^5.4.2`) - Dev server and bundler, config `vite.config.ts`
- @vitejs/plugin-react (`^4.3.1`) - React fast refresh / JSX
- PostCSS 8 + Autoprefixer - `postcss.config.js`
- ESLint 9 flat config + typescript-eslint 8 - `eslint.config.js`

## Key Dependencies

**Critical:**
- `react` / `react-dom` `^18.3.1` - Entire UI layer
- `lucide-react` `^0.344.0` - Icon set used across `src/App.tsx` and components; explicitly excluded from Vite dep pre-bundling (`optimizeDeps.exclude` in `vite.config.ts`)

**Infrastructure:**
- `typescript-eslint` `^8.3.0` - Type-aware linting gate in CI
- `@types/node` `22.20.1` - Enables `node:path` usage in `vite.config.ts`

## Configuration

**Environment:**
- Build-time only, via Vite `import.meta.env` (statically inlined, world-readable in the bundle).
- `VITE_HAOO_FORM_ENDPOINT` (optional) - HAOO enquiry endpoint override. Declared in `src/vite-env.d.ts`; validated by `resolveQualifyEndpoint()` in `src/products/haoo.ts`. Supplied as a GitHub Actions repository **variable**, not a secret — it is address obfuscation, never a credential.
- `VITE_HAOO_MEASUREMENT_PROVIDER` (optional) - Read in `src/products/haoo.ts`; `resolveMeasurementProvider()` currently collapses every value to `'none'`.
- `.env`, `.env.*` are git-ignored (`.gitignore`); no `.env` file is present in the repo.

**Build:**
- `vite.config.ts` - `base: '/'`, multi-page `rollupOptions.input` with `main` (`index.html`) and `haoo` (`products/haoo/index.html`)
- `tsconfig.json` (project references) → `tsconfig.app.json` (src) + `tsconfig.node.json` (config files)
- `vitest.config.ts` - separate config from Vite build

**Scripts (`package.json`):**
```bash
npm run dev              # vite dev server
npm run build            # vite build -> dist/
npm run lint             # eslint .
npm run typecheck        # tsc --noEmit -p tsconfig.app.json
npm run test             # build + vitest run (build-output tests need dist/)
npm run test:unit        # vitest run only
npm run test:phase1:red  # node scripts/assert-phase1-red.mjs
```

## Platform Requirements

**Development:**
- Node.js 22, npm
- No database, no backend service, no containers

**Production:**
- GitHub Pages static hosting (`.github/workflows/deploy.yml`)
- Custom domain `www.zero-paperhub.com` (`CNAME`, also `public/CNAME.txt`)
- Artifact: `dist/` uploaded via `actions/upload-pages-artifact@v4`

---

*Stack analysis: 2026-09-01*
