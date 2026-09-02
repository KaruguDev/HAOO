---
last_mapped_commit: 7a99cab52f8907ebb43e9618c909ed785d088dbe
---
<!-- refreshed: 2026-09-02 -->
# External Integrations

**Analysis Date:** 2026-09-02

## APIs & External Services

**1. Form delivery (FormSubmit.co) — the only outbound API from the browser today:**
- `formsubmit.co` — email delivery for both enquiry forms. No SDK; plain `fetch`/HTML form POST.
  - **HAOO qualification form (AJAX/JSON):** `https://formsubmit.co/ajax/info@haoo.online` (fallback constant `QUALIFY_ENDPOINT_FALLBACK`, `src/products/haoo.ts:209`), overridable at build time by `VITE_HAOO_FORM_ENDPOINT`.
    - Request issued in `src/components/QualifyForm.tsx` (`fetch(qualify.endpoint, { method: 'POST', headers: Content-Type/Accept application/json, signal })`)
    - Body built by `buildSubmissionBody()` in `src/components/qualify-form.logic.ts` — injects provider options `_subject`, `_template: 'table'`, `_captcha: 'false'`, `_honey`, plus `Source`
    - `RESERVED_EMAIL_LABELS` (`src/components/qualify-form.logic.ts`) blocks visitor fields from overriding provider control keys
    - 15s abort budget: `QUALIFY_REQUEST_TIMEOUT_MS` via `AbortController`
    - Success is determined by `response.ok` only; the provider response body is never parsed
  - **Site contact form (classic HTML POST):** `https://formsubmit.co/info@zero-paperhub.com` — `CONTACT_FORM_ENDPOINT` in `src/App.tsx:142`, native `<form action=... method="POST">` with hidden `_subject`, `_template`, `_next`, `_url`, `_autoresponse`, `_honey` fields
    - Redirect target `CONTACT_SUCCESS_URL` = `https://www.zero-paperhub.com/?contact=success#contact`
  - Auth: none. The mailbox address in the URL is the only identifier; there is no API key.

**Endpoint hardening:**
- `resolveQualifyEndpoint()` in `src/products/haoo.ts` accepts only `https://formsubmit.co/ajax/{single-segment}` — rejects other hosts, lookalike subdomains, `http:`, credentials, query, fragment, extra/empty/encoded-slash segments. Anything else falls back to the readable default. Exhaustive rejection table in `src/test/qualify-data.test.ts`.

**2. Plausible Analytics — client script (built, currently fail-closed OFF):**
- Adapter: `src/measurement/plausible.ts` (no npm package; hand-written).
- Selected only when `VITE_HAOO_MEASUREMENT_PROVIDER === 'plausible'` AND a valid `VITE_HAOO_PLAUSIBLE_SRC` AND a non-empty `VITE_HAOO_PLAUSIBLE_DOMAIN` are present. Any missing/rejected value returns `undefined` — the inert no-op sink stays in place.
- `.github/workflows/deploy.yml` does **not** pass the three measurement variables, so deployed builds ship with the provider off pending privacy-owner approval (documented in `README.md`).
- Mechanics: appends a `defer` `<script src=...>` once (deduplicated by `src` attribute), installs the official pre-load stub queue (`plausible.q`), and calls `init({ domain, autoCapturePageviews: false })`. Automatic pageview/outbound/download/form/hash capture is opt-out by contract, encoded in the `PlausibleInitOptions` type.
- The sink forwards **exactly one argument — the bare event name**. No property bag parameter exists in the type, so no form value or visitor identifier can travel. Every call is wrapped in try/catch; provider failure never affects the visitor journey.
- Browser capabilities (`document`, `window`) arrive through injected `PlausibleAdapters`, so tests never touch the live document or the network.
- Auth: none client-side. `src`/`domain` are public site identifiers.

**3. Plausible Stats API v2 — owner report CLI (credentialed, local-only):**
- Endpoint constant `https://plausible.io/api/v2/query` — declared only in `scripts/generate-haoo-report.mjs:33`, never in `src/`.
- Client: `queryRange()` in `src/reporting/generate.ts:127`, `POST` with injected `fetch`. Body: `{ site_id, metrics: ['events'], date_range, dimensions: ['event:goal'], filters: [['is','event:goal',[...HAOO_REPORT_EVENTS]]] }`.
- Auth: `Authorization: Bearer ${PLAUSIBLE_STATS_API_KEY}` header only — the key is never placed in the query object, never logged, never returned, and never written into the generated HTML.
- Four queries per run: `all` plus three bounded inclusive ISO calendar windows of 7 / 30 / 90 days (`BOUNDED_PERIOD_DAYS` in `src/reporting/generate.ts`); explicit ranges are used rather than the provider's 91-day preset.
- **Response is untrusted and fail-closed validated twice:**
  - `validateEchoedQuery()` (`src/reporting/query-provenance.ts`) confirms the provider echoed back the exact `site_id`, metrics, dimensions, filter triple, and a coherent calendar `date_range` — otherwise the run aborts.
  - `parseGoalCounts()` (`src/reporting/stats-response.ts`) rejects unknown goals, duplicate rows, non-integer/negative/non-finite counts; absent goals become real zeros.
- Output: `.reports/haoo-funnel-report.html`, rendered by `renderReport()` (`src/reporting/render.ts:497`) as a standalone HTML document with HTML-escaped values (`escapeHtml`), written via reserve-temp + `renameSync` so a failed run leaves the previous report untouched.
- Run: `npm run report:haoo`. Never invoked by CI.

**Outbound contact deep links (no API, user-initiated navigation):**
- WhatsApp: `https://wa.me/254702188044?text=...` — `src/products/haoo.ts` (`whatsappHref`)
- Phone: `tel:+254702188044`
- Email: `mailto:info@haoo.online`
- HAOO self-onboarding app: `https://manage.haoo.online/` — `selfOnboardingHref` (`src/products/haoo.ts:461`); also duplicated in the `<noscript>` block of `products/haoo/index.html`

## Data Storage

**Databases:**
- None. No database, ORM, or server-side persistence anywhere in the repo.

**Browser storage:**
- `window.localStorage`, key `zph.haoo.ctx.v1` (`HAOO_MEASUREMENT.storageKey`, `src/products/haoo.ts:93`)
  - Managed exclusively by `createMeasurement()` in `src/measurement/index.ts`
  - Stores a privacy-bounded engagement context: schema `version`, `visitBand`, `lastSeenBand`, boolean `flags`, `visitOrdinal` (capped at 4), `lastSeenDay` (day-only)
  - Strict schema validation on read (`parseContext` — exact key set, schema version, enum membership); malformed or >180-day-old records are removed
  - Every storage access is wrapped in try/catch; storage failure disables persistence without breaking the page

**File Storage:**
- Static assets served from the repo: `public/products/haoo/HAOO-Marketing-Brochure.pdf`, `public/products/haoo/brochure-preview.png`, `public/marketing/*`, `public/zero-paper_hub_hi-def.png`
- Local generated artifact: `.reports/haoo-funnel-report.html` (git-ignored — carries aggregate HAOO business counts)

**Caching:**
- None beyond the CDN/browser caching provided by GitHub Pages.

## Authentication & Identity

**Auth Provider:**
- None. The site is fully public and unauthenticated. No login, session, cookie, or user identity of any kind.
- No cookies, UUIDs, fingerprints, or cross-site identifiers are set — stated as a product boundary in the disclosure copy in `src/products/haoo.ts` and surfaced by `src/components/MeasurementDisclosure.tsx`.
- The only credential in the whole project is `PLAUSIBLE_STATS_API_KEY`, used by the local report CLI and never by the site.

## Monitoring & Observability

**Analytics / Measurement:**
- `MeasurementProvider = 'none' | 'plausible'` (`src/products/types.ts:156`); `providerScript: MeasurementProviderScript` is a *required* field so a product selecting a provider without script config fails typecheck (`src/products/types.ts:216-222`).
- The measurement facade (`src/measurement/index.ts`) owns the injectable `eventSink` seam that `src/measurement/plausible.ts` plugs into. Sink errors are swallowed so delivery never affects visitor actions.
- Closed event list `HAOO_MEASUREMENT_EVENTS` (page view, brochure preview/open/download, qualify start/submit, assisted whatsapp/phone/email, self-onboarding). Events are sent as bare names — no form answers or visitor properties attached.
- Reporting side re-derives its allowlist as `HAOO_REPORT_EVENTS` from the stage map in `src/reporting/haoo-report.ts`, grouped into `REPORT_STAGES` with period views `last-7/30/90-days` and `all-time`.
- Campaign params `utm_source`, `utm_medium`, `utm_campaign` are read once per page load, lowercased, validated against `/^[a-z0-9-]+$/`, truncated to 32 chars, and stripped from the address bar via `history.replaceState`.

**Error Tracking:**
- None. No Sentry/Rollbar/equivalent.

**Logs:**
- None in the browser; failures are silently absorbed into user-visible states.
- The report CLI writes failure text to **stderr only** (`writeTerminalError`), with the locked `ERROR_STATE_SENTENCE`, and never into the generated document or stdout.

## CI/CD & Deployment

**Hosting:**
- GitHub Pages, custom domain `www.zero-paperhub.com` (`CNAME`)

**CI Pipeline:**
- `.github/workflows/deploy.yml` — triggers on push to `main` and `workflow_dispatch`
- Steps: checkout → setup-node 22 (npm cache) → `npm ci` → `npm run typecheck` → `npm run lint` → `npm run build` (with `VITE_HAOO_FORM_ENDPOINT` from repo vars) → `npm run test:unit` → configure-pages → upload-pages-artifact (`./dist`) → deploy-pages
- Concurrency group `pages`, `cancel-in-progress: false` (a cancelled publish can leave the site partially updated)
- Permissions: `contents: read`, `pages: write`, `id-token: write`
- `test:unit` is used deliberately instead of `test` so the build artifact about to be uploaded is not overwritten by a build lacking the endpoint variable
- No secrets are consumed by the workflow.

## Environment Configuration

**Required env vars (Node CLI only):**
- `PLAUSIBLE_STATS_API_KEY` — Stats API bearer token, `scripts/generate-haoo-report.mjs`
- `PLAUSIBLE_SITE_ID` — Plausible site identifier
- Missing either → stderr error + exit 1, no file written.

**Optional build-time vars (GitHub Actions repository *variables*, not secrets):**
- `VITE_HAOO_FORM_ENDPOINT` — HAOO form destination; validated, falls back to `https://formsubmit.co/ajax/info@haoo.online`
- `VITE_HAOO_MEASUREMENT_PROVIDER` — `plausible` selects the provider; anything else fails closed to `none`
- `VITE_HAOO_PLAUSIBLE_SRC` — absolute `https:` `.js` URL, no credentials/query/fragment
- `VITE_HAOO_PLAUSIBLE_DOMAIN` — Plausible site domain; empty disables collection

**Secrets location:**
- Only the local shell environment of the report operator. Nothing secret reaches the bundle: Vite inlines every `VITE_*` value into world-readable JavaScript by construction (documented in `src/vite-env.d.ts`). `.env` and `.env.*` are git-ignored (`!.env.example` allowed).

## Webhooks & Callbacks

**Incoming:**
- None. Static hosting with no server endpoints.

**Outgoing:**
- None beyond the two FormSubmit POSTs and the four Stats API POSTs above.
- The classic contact form relies on FormSubmit's `_next` redirect back to `https://www.zero-paperhub.com/?contact=success#contact`, which `src/App.tsx` detects to show the success state.

---

*Integration audit: 2026-09-02*
