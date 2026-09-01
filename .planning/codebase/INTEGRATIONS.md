# External Integrations

**Analysis Date:** 2026-09-01

## APIs & External Services

**Form delivery (FormSubmit.co) — the only outbound API:**
- `formsubmit.co` — email delivery for both enquiry forms. No SDK; plain `fetch`/HTML form POST.
  - **HAOO qualification form (AJAX/JSON):** `https://formsubmit.co/ajax/info@haoo.online` (fallback constant `QUALIFY_ENDPOINT_FALLBACK` in `src/products/haoo.ts`), overridable at build time by `VITE_HAOO_FORM_ENDPOINT`.
    - Request issued in `src/components/QualifyForm.tsx` (`fetch(qualify.endpoint, { method: 'POST', headers: Content-Type/Accept application/json, signal })`)
    - Body built by `buildSubmissionBody()` in `src/components/qualify-form.logic.ts` — injects provider options `_subject`, `_template: 'table'`, `_captcha: 'false'`, `_honey`, plus `Source`
    - `RESERVED_EMAIL_LABELS` (`src/components/qualify-form.logic.ts`) blocks visitor fields from overriding provider control keys
    - 15s abort budget: `QUALIFY_REQUEST_TIMEOUT_MS` via `AbortController`
    - Success is determined by `response.ok` only; the provider response body is never parsed
  - **Site contact form (classic HTML POST):** `https://formsubmit.co/info@zero-paperhub.com` — `CONTACT_FORM_ENDPOINT` in `src/App.tsx:142`, native `<form action=... method="POST">` with hidden `_subject`, `_template`, `_next`, `_url`, `_autoresponse`, `_honey` fields (`src/App.tsx` ~line 548+)
    - Redirect target `CONTACT_SUCCESS_URL` = `https://www.zero-paperhub.com/?contact=success#contact`
  - Auth: none. The mailbox address in the URL is the only identifier; there is no API key.

**Endpoint hardening:**
- `resolveQualifyEndpoint()` in `src/products/haoo.ts` accepts only `https://formsubmit.co/ajax/{single-segment}` — rejects other hosts, lookalike subdomains, `http:`, credentials, query, fragment, extra/empty/encoded-slash segments. Anything else falls back to the readable default. Exhaustive rejection table in `src/test/qualify-data.test.ts`.

**Outbound contact deep links (no API, user-initiated navigation):**
- WhatsApp: `https://wa.me/254702188044?text=...` — `src/products/haoo.ts` (`whatsappHref`)
- Phone: `tel:+254702188044`
- Email: `mailto:info@haoo.online`
- HAOO self-onboarding app: `https://manage.haoo.online/` — `selfOnboardingHref` in `src/products/haoo.ts`; also duplicated in the `<noscript>` block of `products/haoo/index.html`

## Data Storage

**Databases:**
- None. No database, ORM, or server-side persistence anywhere in the repo.

**Browser storage:**
- `window.localStorage`, key `zph.haoo.ctx.v1` (`HAOO_MEASUREMENT.storageKey` in `src/products/haoo.ts`)
  - Managed exclusively by `createMeasurement()` in `src/measurement/index.ts`
  - Stores a privacy-bounded engagement context: schema `version`, `visitBand`, `lastSeenBand`, boolean `flags`, `visitOrdinal` (capped at 4), `lastSeenDay` (day-only)
  - Strict schema validation on read (exact key set, schema version, enum membership); malformed or >180-day-old records are removed
  - Every storage access is wrapped in try/catch; storage failure disables persistence without breaking the page

**File Storage:**
- Static assets served from the repo: `public/products/haoo/HAOO-Marketing-Brochure.pdf`, `public/products/haoo/brochure-preview.png`, `public/marketing/*`, `public/zero-paper_hub_hi-def.png`

**Caching:**
- None beyond the CDN/browser caching provided by GitHub Pages.

## Authentication & Identity

**Auth Provider:**
- None. The site is fully public and unauthenticated. No login, session, cookie, or user identity of any kind.
- No cookies, UUIDs, fingerprints, or cross-site identifiers are set — stated as a product boundary in the disclosure copy in `src/products/haoo.ts` and surfaced by `src/components/MeasurementDisclosure.tsx`.

## Monitoring & Observability

**Analytics / Measurement:**
- `MeasurementProvider` type is `'none'` only (`src/products/types.ts:104`); `resolveMeasurementProvider()` in `src/products/haoo.ts` returns `'none'` for every input. **No third-party analytics vendor is wired up.**
- The measurement facade (`src/measurement/index.ts`) supports an injectable `eventSink` adapter, which is the seam a future provider would plug into. Sink errors are swallowed so delivery never affects visitor actions.
- Closed event list `HAOO_MEASUREMENT_EVENTS` (page view, brochure preview/open/download, qualify start/submit, assisted whatsapp/phone/email, self-onboarding). Events are sent as bare names — no form answers or visitor properties attached.
- Campaign params `utm_source`, `utm_medium`, `utm_campaign` are read once per page load, lowercased, validated against `/^[a-z0-9-]+$/`, truncated to 32 chars, and stripped from the address bar via `history.replaceState`.

**Error Tracking:**
- None. No Sentry/Rollbar/equivalent.

**Logs:**
- None. No logging framework; failures are silently absorbed into user-visible states.

## CI/CD & Deployment

**Hosting:**
- GitHub Pages, custom domain `www.zero-paperhub.com` (`CNAME`)

**CI Pipeline:**
- `.github/workflows/deploy.yml` — triggers on push to `main` and `workflow_dispatch`
- Steps: checkout → setup-node 22 (npm cache) → `npm ci` → `npm run typecheck` → `npm run lint` → `npm run build` (with `VITE_HAOO_FORM_ENDPOINT` from repo vars) → `npm run test:unit` → configure-pages → upload-pages-artifact (`./dist`) → deploy-pages
- Concurrency group `pages`, `cancel-in-progress: false` (a cancelled publish can leave the site partially updated)
- Permissions: `contents: read`, `pages: write`, `id-token: write`
- `test:unit` is used deliberately instead of `test` so the build artifact about to be uploaded is not overwritten by a build lacking the endpoint variable

## Environment Configuration

**Required env vars:**
- None are strictly required — every value has a safe fallback.

**Optional build-time vars (GitHub Actions repository *variables*, not secrets):**
- `VITE_HAOO_FORM_ENDPOINT` — HAOO form destination; validated, falls back to `https://formsubmit.co/ajax/info@haoo.online`
- `VITE_HAOO_MEASUREMENT_PROVIDER` — read in `src/products/haoo.ts`, currently always resolves to `'none'`

**Secrets location:**
- No secrets exist in this project. Everything reaching the bundle is inlined by Vite and world-readable by construction — documented explicitly in `src/vite-env.d.ts`. `.env` and `.env.*` are git-ignored.

## Webhooks & Callbacks

**Incoming:**
- None. Static hosting with no server endpoints.

**Outgoing:**
- None beyond the two FormSubmit POSTs above.
- The classic contact form relies on FormSubmit's `_next` redirect back to `https://www.zero-paperhub.com/?contact=success#contact`, which `src/App.tsx` detects to show the success state.

---

*Integration audit: 2026-09-01*
