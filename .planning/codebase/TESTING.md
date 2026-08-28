# Testing Guide

**Analysis Date:** 2026-08-29

## Current Test Infrastructure

No automated test framework, test files, test configuration, or coverage configuration is present. `package.json` defines only `lint`, `typecheck`, `build`, `dev`, and `preview` scripts. No `*.test.*` or `*.spec.*` files are detected under the repository.

The current quality baseline is:

```bash
npm run lint
npm run typecheck
npm run build
```

Run all three for changes affecting `src/App.tsx`, `src/main.tsx`, styles, configuration, or deployment behavior. `npm run lint` uses the flat config in `eslint.config.js`, ignores `dist`, and applies the recommended JavaScript, TypeScript, React Hooks, and React Refresh rules. `npm run typecheck` runs `tsc --noEmit -p tsconfig.app.json`.

## Manual Smoke Tests

Use `npm run dev` and check the page in a desktop and narrow/mobile viewport.

### Navigation and responsive layout

- Confirm the fixed header changes from transparent to white/shadow styling after scrolling past 40px.
- Confirm all desktop links navigate to `#about`, `#mission`, `#services`, `#values`, and `#contact`.
- Below the `md` breakpoint, open/close the menu, activate each link, and verify the menu closes after navigation.
- Check that the hero, cards, CTA, contact form, footer, and logo remain readable without horizontal overflow.

### Scroll reveal behavior

- Reload at the top and scroll through About, Mission, Services, Values, and Contact.
- Verify each section transitions from hidden/translated to visible once and remains visible after leaving the viewport.
- Exercise a browser without `IntersectionObserver` support if compatibility is required; the current hook assumes the API exists and has no fallback.

### Contact form

- Submit with required fields empty and verify native browser validation prevents submission.
- Verify first/last name length, message minimum/maximum length, email validity, and optional organization behavior.
- Submit valid data and confirm the button changes to `Sending…` and becomes disabled while the external FormSubmit request is in progress.
- Verify the hidden `_honey` field remains empty and the success redirect displays the `role="status"` confirmation when the URL contains `contact=success`.
- Follow the activation/delivery procedure documented in `README.md`; this is an external integration and cannot be fully verified by local build checks.

### Profile download

- Activate `Download Profile` and verify a text file named `Zero-Paper-Hub-Company-Profile.txt` downloads.
- Check that the generated text includes the current mission, vision, services, contact details, and copyright year.

## Change-Specific Checks

For content or styling changes, run lint/build and perform the responsive/manual checks above. For hook or state changes in `src/App.tsx`, additionally test reload behavior, scroll listeners, mobile menu state, contact query handling, and cleanup by navigating/reloading repeatedly.

For form changes, inspect the rendered HTML to ensure every input retains a unique `id`, matching label, `name`, and intended native constraint. Do not rely solely on a successful FormSubmit response: test invalid input and the success URL independently.

For asset or deployment changes, run `npm run build`, inspect `dist/index.html` and referenced assets, and test the built app with `npm run preview`. Verify root-relative asset paths and the GitHub Pages/CNAME deployment assumptions in `.github/workflows/deploy.yml` and `CNAME`.

## Recommended Future Coverage

If automated coverage is introduced, prioritize behavior over snapshots:

- Component-level tests for mobile menu toggling, scroll header state, URL-based success messaging, and download invocation.
- Form tests for native constraints, honeypot presence, submitting state, and accessible status messaging.
- A browser-level smoke test for anchor navigation, IntersectionObserver reveals, responsive menu behavior, and the profile download.
- A small build/deployment check that confirms Vite emits the public logo and `CNAME`-related assets.

Keep tests independent of Tailwind class ordering and external FormSubmit availability; mock the network boundary and assert the form payload/configuration instead.

## Known Test Gaps

- No unit, integration, end-to-end, accessibility, or visual regression tests are currently configured.
- FormSubmit delivery, activation, spam filtering, and redirect behavior require a deployed-domain manual test.
- `IntersectionObserver`, `window`, `document`, object URLs, and anchor downloads are browser APIs with no current test harness.
- `dist/` is generated output and is excluded from ESLint; validate it through the build/preview flow rather than editing it directly.

*Generated from the current repository state on 2026-08-29.*
