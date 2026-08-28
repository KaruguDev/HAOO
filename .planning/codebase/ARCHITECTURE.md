# Architecture

**Analysis Date:** 2026-08-29

## Overview

ZERO-PAPERHUB is a single-page, client-rendered React marketing site built with Vite and TypeScript. The application has one composition root (`src/main.tsx`) and one large page component (`src/App.tsx`) containing navigation, hero, company information, mission/vision/values, services, CTA, contact form, and footer. There is no application router, server runtime, API layer, database access, or feature-module boundary in the repository.

## Runtime and Request Flow

1. `index.html` provides the browser document, metadata, favicon, and `#root` mount point.
2. `src/main.tsx` imports global CSS and mounts `<App />` under React `StrictMode` using `createRoot`.
3. `src/App.tsx` renders the complete landing page and owns all interactive state.
4. Browser hash links (`#about`, `#mission`, `#services`, `#values`, `#contact`) provide section navigation without a router.
5. The contact form submits a native POST directly to FormSubmit (`CONTACT_FORM_ENDPOINT`); the external service redirects to `CONTACT_SUCCESS_URL`, and the next page load displays a success status based on the `contact=success` query parameter.
6. The company profile action creates a text `Blob` in the browser and triggers a local download; it does not call a backend.

## Component and State Boundaries

`src/App.tsx` is the sole React component and contains local helper/data definitions:

- `downloadCompanyProfile()` generates the downloadable company profile text.
- `useInView()` encapsulates `IntersectionObserver` reveal-on-scroll behavior and disconnects after first intersection.
- `NAV_LINKS`, `VALUES`, and `SERVICES` are static data collections used to render repeated navigation/content elements.
- `App()` owns `menuOpen`, `scrolled`, `contactSubmitting`, and `contactSubmitted` state.

The page uses five independent `useInView()` instances for About, Mission, Services, Values, and Contact. Keep section-specific behavior local to `App.tsx` unless the page is decomposed into components; if decomposing, preserve the current data-driven rendering and make each component receive explicit props.

## Styling Architecture

`src/index.css` is the global style entry point. It imports the Inter font from Google Fonts, loads Tailwind layers, enables smooth scrolling, and sets the body font and antialiasing. Most visual styling is expressed as Tailwind utility classes inline in `src/App.tsx`. Tailwind scans `index.html` and `src/**/*.{js,ts,jsx,tsx}` through `tailwind.config.js`; PostCSS is configured in `postcss.config.js` with Tailwind and Autoprefixer.

Use Tailwind utilities for new page styling and keep global CSS limited to document-wide behavior. Reuse the existing green/blue palette, rounded cards, responsive `md` breakpoint, and transition/reveal conventions. Avoid adding a second styling system without a clear architectural reason.

## External Boundaries

- Form submission: native HTML form in `src/App.tsx` → `https://formsubmit.co/info@zero-paperhub.com`.
- Web font: `src/index.css` → Google Fonts Inter.
- Icons: `lucide-react` imported by `src/App.tsx`.
- Static branding/assets: root-relative paths such as `/zero-paper_hub_hi-def.png`, served from `public/` in development/build output.
- Hosting/domain hints: `CNAME`, `public/CNAME.txt`, and `public/.htaccess` support static deployment; Vite emits the production bundle to `dist/`.

## Error and UX Handling

The browser performs native form validation (`required`, `minLength`, `maxLength`, and email type). `handleContactSubmit()` sets a waiting state only when the browser considers the form valid, disabling the submit button while the external POST is in progress. There is no client-side fetch error path because submission is a native navigation. The honeypot `_honey` field and FormSubmit server-side filtering provide spam mitigation.

`contactSubmitted` is initialized from the URL and then the query string is removed with `history.replaceState`, leaving the `#contact` anchor. Intersection observer failures are naturally avoided when refs are absent, and observers are cleaned up on unmount.

## Build Architecture

`vite.config.ts` configures the React plugin, `/` base path, and excludes `lucide-react` from dependency optimization. `tsconfig.app.json` uses strict TypeScript, ES2020 browser libraries, bundler module resolution, JSX automatic runtime, and no emit. `package.json` exposes `dev`, `build`, `lint`, `preview`, and `typecheck` scripts. Build output is static and can be served by any compatible host.

## Architectural Guidance

- Add page content and simple interactions in `src/App.tsx`, keeping repeated content in top-level constants.
- Add document-wide rules to `src/index.css`; add utility composition inline for section-specific styling.
- Add new static files under `public/` and reference them with root-relative URLs.
- Keep external form/provider configuration in named constants near the top of `src/App.tsx`.
- If functionality grows beyond a single marketing page, split `App.tsx` into section components and/or introduce service modules before adding unrelated state or network logic to the composition root.

---
*Architecture analysis: 2026-08-29*
