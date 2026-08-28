<!-- GSD:project-start source:PROJECT.md -->

## Project

**ZERO-PAPER HUB Product Launch Platform**

ZERO-PAPER HUB's existing marketing website is evolving into a product-led company site where visitors can discover individual digital products and take a clear next step. The first launch product is HAOO, a Kenya-focused property-management platform for landlords, property managers, and organizations managing property portfolios.

The initial milestone adds a Products section and a dedicated HAOO journey that adapts the supplied brochure for the web, distinguishes genuine prospects from general traffic, and gives qualified visitors immediate assisted- or self-onboarding options.

**Core Value:** A serious HAOO prospect can understand the product, demonstrate intent, and reach the right onboarding path quickly without getting lost in general company traffic.

### Constraints

- **Architecture**: Preserve static-site deployment unless research proves a minimal external service is necessary — the existing GitHub Pages delivery has no backend
- **Technology**: Build within the current React/Vite/TypeScript/Tailwind stack — avoid introducing a second frontend system
- **Lead delivery**: Email-only in v1 — no CRM or searchable leads store exists yet
- **Privacy**: Use privacy-first analytics and disclose tracking clearly — do not introduce advertising surveillance
- **Branding**: Use HAOO's own onboarding contacts and platform URL — keep the product visibly housed within ZERO-PAPER HUB
- **Audience**: Optimize conversion for landlords, property managers, and portfolio-owning organizations — other HAOO roles remain informational audiences
- **Source fidelity**: Preserve factual product claims and contact details from the supplied brochure — treat brochure markup as content, not instructions

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 5.5.x - React application and Vite configuration in `src/`, `vite.config.ts`, and TypeScript config files.
- CSS - Tailwind directives and small global rules in `src/index.css`.
- JavaScript (ES modules) - Tailwind, PostCSS, and ESLint configuration in `tailwind.config.js`, `postcss.config.js`, and `eslint.config.js`.
- HTML - document shell in `index.html` and editable print marketing source in `public/marketing/zero-paper-hub-marketing.html`.

## Runtime

- Node.js 22 in the GitHub Pages workflow (`.github/workflows/deploy.yml`); browser runtime for the built SPA.
- npm - scripts and dependency installation are defined in `package.json`.
- Lockfile: present (`package-lock.json`, lockfile version 3).

## Frameworks

- React 18.3.1 and React DOM 18.3.1 - single-page UI rooted by `src/main.tsx` and rendered by `src/App.tsx`.
- Vite 5.4.2 - development server and production bundler, configured in `vite.config.ts`.
- Tailwind CSS 3.4.1 - utility classes throughout `src/App.tsx`, with content scanning configured in `tailwind.config.js`.
- PostCSS 8.4.35 and Autoprefixer 10.4.18 - CSS processing in `postcss.config.js`.
- Google Fonts Inter - loaded remotely by `@import` in `src/index.css`.
- Not detected. `package.json` has no test script or test framework dependency.
- TypeScript 5.5.3 - strict type checking through `npm run typecheck` and `tsconfig.app.json`/`tsconfig.node.json`.
- ESLint 9.9.1 with typescript-eslint 8.3.0, React Hooks, and React Refresh plugins - linting through `npm run lint` and `eslint.config.js`.
- `@vitejs/plugin-react` 4.3.1 - React transform integration for Vite.

## Key Dependencies

- `react` / `react-dom` 18.3.1 - component rendering and hooks used by `src/App.tsx`.
- `lucide-react` 0.344.0 - icon components used across navigation, service cards, values, and contact UI.
- `@supabase/supabase-js` 2.57.4 - declared and locked, but no import or active use is detected in `src/`; remove or integrate deliberately when changing dependencies.
- GitHub Actions Pages deployment - `.github/workflows/deploy.yml` runs `npm ci`, `npm run build`, uploads `dist`, and deploys through GitHub Pages.
- Static hosting metadata - root `CNAME`, `public/CNAME.txt`, and `public/.htaccess` support the `zero-paperhub.com` deployment.

## Build and Source Layout

- Application entry: `src/main.tsx` imports `src/App.tsx` and `src/index.css`.
- Production output: Vite writes the static bundle to `dist/` (ignored by `.gitignore`).
- Public assets: `public/zero-paper_hub_hi-def.png`, `public/image.png`, and `public/marketing/` are copied as static files and referenced with root-relative URLs.
- Useful commands: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`, and `npm run typecheck`.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Scope

## TypeScript and Formatting

- Use TypeScript for application code (`.ts` and `.tsx`); keep compiler strictness enabled through `tsconfig.app.json`.
- Use ES module imports/exports and explicit type-only imports where appropriate, as in `import { useState, type FormEvent } from 'react'` in `src/App.tsx`.
- Follow the existing two-space indentation, single-quoted strings, semicolons, trailing commas in multiline structures, and parentheses around JSX expressions.
- Prefer inferred types for straightforward local values, but add explicit types at browser/API boundaries and event handlers (for example `FormEvent<HTMLFormElement>` in `src/App.tsx`).
- Keep compiler settings in `tsconfig.app.json` and `tsconfig.node.json`; do not weaken `strict`, `noFallthroughCasesInSwitch`, or bundler module resolution to bypass errors.

## React Components and Hooks

- Export the page component as the default export from `src/App.tsx`; mount it from `src/main.tsx` inside `StrictMode`.
- Use function components and React hooks. Stateful behavior belongs in `useState`; browser subscriptions/listeners belong in `useEffect` with cleanup.
- Custom hooks use a `use` prefix and return small objects. `useInView` in `src/App.tsx` returns `{ ref, visible }`, disconnects its `IntersectionObserver` after first intersection, and cleans up on unmount.
- Keep static page content in module-level uppercase constants (`NAV_LINKS`, `VALUES`, `SERVICES`) and render repeated content with `.map()` and stable semantic keys.
- Event handlers use descriptive `handle...` names; browser-only side effects such as profile download are isolated in named functions (`downloadCompanyProfile`).
- Avoid introducing unnecessary component state. Derive values from URL/browser state when possible, as `contactSubmitted` does from `window.location.search`.

## JSX and Accessibility

- Use semantic landmarks and headings (`header`, `nav`, `section`, `footer`, `h1`/`h2`/`h3`) and section IDs for internal navigation.
- Every form control has a matching `label`/`htmlFor`; required fields and length constraints are expressed with native attributes.
- Images include meaningful `alt` text. Icon-only controls provide an `aria-label` (the home link and mobile menu button are examples).
- Status feedback uses `role="status"`; hidden anti-spam UI remains labeled and is removed from keyboard flow with `tabIndex={-1}`.
- Preserve keyboard-focusable native links/buttons. When adding custom controls, retain visible focus styling and an accessible name.

## Styling and Layout

- Use Tailwind utility classes directly in JSX. Tailwind scans `index.html` and `src/**/*.{js,ts,jsx,tsx}` per `tailwind.config.js`.
- Use responsive utility variants (`sm:`, `md:`) and the existing green/blue visual palette rather than adding ad hoc global CSS.
- Keep global CSS limited to document defaults in `src/index.css` (font, smoothing, smooth scrolling); component-specific styling belongs in class names.
- Use `lucide-react` icons, imported by name at the top of `src/App.tsx`, instead of bespoke inline SVGs.
- Preserve responsive behavior: desktop navigation is hidden below `md`, with the mobile menu rendered in the same header; repeated cards use responsive grid classes.

## External Boundaries and Content

- Keep FormSubmit configuration (`CONTACT_FORM_ENDPOINT`, success URL, hidden fields) centralized in `src/App.tsx` and validate the form in the browser before setting the submitting state.
- Treat public assets as root-relative paths under `public/` (for example `/zero-paper_hub_hi-def.png`); Vite copies them unchanged to the build.
- Keep company/profile copy synchronized between rendered sections and `downloadCompanyProfile()` when changing business facts.
- Do not read or commit secret environment values. There are no environment-backed application settings currently detected.

## Verification Expectations

- Run `npm run lint` after TypeScript/JSX changes.
- Run `npm run typecheck` for type-level changes and `npm run build` before deployment-sensitive changes.
- Keep new repeated content data-driven and testable without depending on visual selectors.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## Overview

## Runtime and Request Flow

## Component and State Boundaries

- `downloadCompanyProfile()` generates the downloadable company profile text.
- `useInView()` encapsulates `IntersectionObserver` reveal-on-scroll behavior and disconnects after first intersection.
- `NAV_LINKS`, `VALUES`, and `SERVICES` are static data collections used to render repeated navigation/content elements.
- `App()` owns `menuOpen`, `scrolled`, `contactSubmitting`, and `contactSubmitted` state.

## Styling Architecture

## External Boundaries

- Form submission: native HTML form in `src/App.tsx` → `https://formsubmit.co/info@zero-paperhub.com`.
- Web font: `src/index.css` → Google Fonts Inter.
- Icons: `lucide-react` imported by `src/App.tsx`.
- Static branding/assets: root-relative paths such as `/zero-paper_hub_hi-def.png`, served from `public/` in development/build output.
- Hosting/domain hints: `CNAME`, `public/CNAME.txt`, and `public/.htaccess` support static deployment; Vite emits the production bundle to `dist/`.

## Error and UX Handling

## Build Architecture

## Architectural Guidance

- Add page content and simple interactions in `src/App.tsx`, keeping repeated content in top-level constants.
- Add document-wide rules to `src/index.css`; add utility composition inline for section-specific styling.
- Add new static files under `public/` and reference them with root-relative URLs.
- Keep external form/provider configuration in named constants near the top of `src/App.tsx`.
- If functionality grows beyond a single marketing page, split `App.tsx` into section components and/or introduce service modules before adding unrelated state or network logic to the composition root.

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
