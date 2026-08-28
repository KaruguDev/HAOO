# Codebase Concerns

**Analysis Date:** 2026-08-29

## High Priority

### Contact form has no application-owned delivery or failure path

- `src/App.tsx` posts contact data directly to the third-party FormSubmit endpoint (`https://formsubmit.co/info@zero-paperhub.com`). The recipient, redirect URL, autoresponse text, and tracking URL are all hardcoded in the client bundle.
- `handleContactSubmit` only sets a loading flag after browser validation; it does not handle a rejected request, timeout, provider outage, duplicate submission, or a non-success response. Because the native form navigates away and the button is disabled immediately, a blocked submission can leave the user without feedback or recovery.
- Treat FormSubmit as an explicit external data processor: document its operational dependency and privacy implications, and add a controlled success/error path (or a small server-side endpoint) before relying on this for production enquiries. Keep the honeypot and native constraints when changing the flow.

### No automated test coverage

- There are no test files or test script in `package.json`; the only available checks are `npm run lint`, `npm run typecheck`, and `npm run build`.
- The contact redirect/query handling, mobile navigation, download behavior, and scroll/IntersectionObserver interactions are therefore unprotected against regressions. Add component/browser tests around the highest-risk flows before extracting or changing them.

## Medium Priority

### `App.tsx` is a monolithic page component

- `src/App.tsx` contains the complete navigation, hero, content sections, form, footer, download utility, visibility hook, and all content data in roughly 600 lines.
- This makes unrelated edits likely to affect the landing page globally and makes focused testing difficult. Extract stable sections (for example `ContactForm`, `Header`, and content data) while preserving the existing Tailwind conventions; put reusable hooks/utilities in dedicated files.

### Browser APIs are assumed without graceful fallback

- `useInView` in `src/App.tsx` constructs `IntersectionObserver` unconditionally when sections mount. Environments without that API will fail during effect execution instead of rendering visible content.
- `downloadCompanyProfile` relies on `Blob`, `URL.createObjectURL`, and programmatic link clicks. Add capability guards or a fallback, and consider `prefers-reduced-motion` for the animation-heavy reveal/bounce classes so content remains usable on constrained clients.

### Static content and metadata can drift from the deployed identity

- `index.html` uses Bolt's generic `https://bolt.new/static/og_default.png` for both Open Graph and Twitter images and has no description meta tag. Social previews and search snippets consequently do not represent the supplied brand assets/content.
- Company dates, vision target, copyright year, contact endpoint, and the generated profile text are duplicated between `src/App.tsx` and the document metadata/content. Centralize or validate these values to avoid inconsistent updates.

### External font is a runtime dependency

- `src/index.css` imports Inter from Google Fonts at runtime. A font-network failure changes typography, and the request exposes visitor access to a third party. Self-host the required font files or explicitly accept/document this dependency; retain the system fallback.

## Low Priority

### Marketing and deploy artifacts have separate sources

- `public/marketing/zero-paper-hub-marketing.html` and its checked-in PDF are maintained separately from the React page. There is no build or consistency check connecting marketing claims/assets to `src/App.tsx`, so messaging and branding can diverge.
- Define an ownership/update step or shared content source when either surface changes.

### Build warning indicates stale browser data

- `npm run build` succeeds but reports an outdated `caniuse-lite` database. Refreshing the lockfile dependency when convenient keeps browser targeting data current and removes noisy CI output.

## Verification Snapshot

- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes, with the `caniuse-lite` freshness warning noted above.

*Generated during concerns analysis: 2026-08-29*
