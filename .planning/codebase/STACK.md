# Technology Stack

**Analysis Date:** 2026-08-29

## Languages

**Primary:**
- TypeScript 5.5.x - React application and Vite configuration in `src/`, `vite.config.ts`, and TypeScript config files.
- CSS - Tailwind directives and small global rules in `src/index.css`.

**Secondary:**
- JavaScript (ES modules) - Tailwind, PostCSS, and ESLint configuration in `tailwind.config.js`, `postcss.config.js`, and `eslint.config.js`.
- HTML - document shell in `index.html` and editable print marketing source in `public/marketing/zero-paper-hub-marketing.html`.

## Runtime

**Environment:**
- Node.js 22 in the GitHub Pages workflow (`.github/workflows/deploy.yml`); browser runtime for the built SPA.

**Package Manager:**
- npm - scripts and dependency installation are defined in `package.json`.
- Lockfile: present (`package-lock.json`, lockfile version 3).

## Frameworks

**Core:**
- React 18.3.1 and React DOM 18.3.1 - single-page UI rooted by `src/main.tsx` and rendered by `src/App.tsx`.
- Vite 5.4.2 - development server and production bundler, configured in `vite.config.ts`.

**Styling:**
- Tailwind CSS 3.4.1 - utility classes throughout `src/App.tsx`, with content scanning configured in `tailwind.config.js`.
- PostCSS 8.4.35 and Autoprefixer 10.4.18 - CSS processing in `postcss.config.js`.
- Google Fonts Inter - loaded remotely by `@import` in `src/index.css`.

**Testing:**
- Vitest 3.2.4 with jsdom 26.1.0 - Vite-compatible unit, component, and build-contract runner configured in `vitest.config.ts`.
- React Testing Library 16.3.2 and DOM Testing Library 10.4.1 - semantic role/name queries with explicit cleanup in `src/test/setup.ts`.
- `npm test` runs the suite once; `npm run test:phase1:red` verifies the intentional Wave 0 behavior-level RED state while rejecting infrastructure failures.

**Build/Dev:**
- TypeScript 5.5.3 - strict type checking through `npm run typecheck` and `tsconfig.app.json`/`tsconfig.node.json`.
- ESLint 9.9.1 with typescript-eslint 8.3.0, React Hooks, and React Refresh plugins - linting through `npm run lint` and `eslint.config.js`.
- `@vitejs/plugin-react` 4.3.1 - React transform integration for Vite.

## Key Dependencies

**Critical:**
- `react` / `react-dom` 18.3.1 - component rendering and hooks used by `src/App.tsx`.
- `lucide-react` 0.344.0 - icon components used across navigation, service cards, values, and contact UI.

**Infrastructure:**
- `@supabase/supabase-js` 2.57.4 - declared and locked, but no import or active use is detected in `src/`; remove or integrate deliberately when changing dependencies.
- GitHub Actions Pages deployment - `.github/workflows/deploy.yml` runs `npm ci`, `npm run build`, uploads `dist`, and deploys through GitHub Pages.
- Static hosting metadata - root `CNAME`, `public/CNAME.txt`, and `public/.htaccess` support the `zero-paperhub.com` deployment.

## Build and Source Layout

- Application entry: `src/main.tsx` imports `src/App.tsx` and `src/index.css`.
- Production output: Vite writes the static bundle to `dist/` (ignored by `.gitignore`).
- Public assets: `public/zero-paper_hub_hi-def.png`, `public/image.png`, and `public/marketing/` are copied as static files and referenced with root-relative URLs.
- Useful commands: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:phase1:red`.

---
*Technology stack analysis: 2026-08-29*
