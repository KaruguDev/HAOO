# Code Conventions

**Analysis Date:** 2026-08-29

## Scope

This is a Vite + React + TypeScript single-page marketing site. Application code is currently concentrated in `src/App.tsx`, with the browser entry point in `src/main.tsx` and global/Tailwind setup in `src/index.css`.

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

*Generated from the current repository state on 2026-08-29.*
