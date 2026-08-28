# Integrations

**Analysis Date:** 2026-08-29

## External Services

### FormSubmit Contact Delivery

- `src/App.tsx` posts the contact form directly to `https://formsubmit.co/info@zero-paperhub.com` using a native HTML `POST` form.
- Hidden fields configure the subject, table template, success redirect (`https://www.zero-paperhub.com/?contact=success#contact`), source URL, and autoresponse.
- The form includes browser validation (`required`, `minLength`, `maxLength`, email type) and a visually hidden `_honey` field as a spam honeypot.
- Submission UX is client-side only: `handleContactSubmit` sets a disabled/sending state after native validity checks; FormSubmit performs delivery and redirect handling.
- Success state is read from the `contact=success` query parameter in `src/App.tsx`, then the URL is normalized to `#contact` with `history.replaceState`.
- Activation and delivery verification instructions are documented in `README.md`; activation is required by FormSubmit for the recipient/domain.

### Google Fonts

- `src/index.css` imports Inter weights 400, 500, 600, 700, 800, and 900 from `https://fonts.googleapis.com`.
- The UI falls back to `system-ui, sans-serif` if the remote font cannot load. Keep the fallback readable when changing typography.

## Hosting and Deployment

- `.github/workflows/deploy.yml` deploys on pushes to `main` or manual dispatch using GitHub Pages.
- The workflow runs on Ubuntu with Node.js 22, installs from `package-lock.json` via `npm ci`, builds with Vite, uploads `dist/`, and invokes the Pages deployment action.
- `CNAME` declares the custom domain; `public/CNAME.txt` is also shipped as a public asset. `vite.config.ts` uses `base: '/'`, matching root-domain hosting.
- There is no application server, API route, runtime secret, database connection, analytics SDK, or authentication flow detected in the source tree.

## Browser and Platform APIs

- `IntersectionObserver` in `useInView` (`src/App.tsx`) drives one-time reveal animations for content sections.
- `window.scrollY` and the `scroll` event control the responsive header's scrolled styling.
- `URLSearchParams` and `window.history.replaceState` manage the FormSubmit success redirect.
- `Blob`, `URL.createObjectURL`, and a temporary anchor implement client-side company-profile `.txt` download in `downloadCompanyProfile`.

## Declared but Unused

- `@supabase/supabase-js` is declared in `package.json` and `package-lock.json`, but no source import, client initialization, environment variable, or Supabase endpoint is present. Do not assume a Supabase backend exists when planning changes.

## Integration Guidance

- Preserve the FormSubmit field names and redirect contract when modifying the contact form; update `README.md` if the recipient or activation flow changes.
- Treat external form submission as a browser navigation, not an AJAX API: `contactSubmitting` should not be used as evidence that delivery succeeded.
- Keep external URLs centralized near the constants in `src/App.tsx` and use HTTPS.
- Any new service integration should document its browser/server boundary and configuration, and should not expose credentials in client-side source. No `.env*` files are present in the repository scan.

---
*Integration analysis: 2026-08-29*
