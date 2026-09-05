---
last_mapped_commit: e91a3b97ce46cd965624cfda94abc6c34c86d2a4
---
<!-- refreshed: 2026-09-05 -->
# External Integrations

**Analysis Date:** 2026-09-05

## APIs & External Services

**Product analytics — PostHog (the only measurement provider):**
- PostHog Cloud **US** region (a one-way regional choice; PostHog does not migrate projects between Cloud regions).
- SDK/Client: `posthog-js` pinned at `1.425.1`, **bundled** as a dependency — never fetched from a remote script origin.
  - Adapter: `src/measurement/posthog.ts` (`createPostHogEventSink`, `boundPostHogClient`, `POSTHOG_REFUSAL` sentinels — the adapter returns sentinels instead of throwing).
  - Privacy lockdown: `src/measurement/posthog-lockdown.ts` (`POSTHOG_LOCKDOWN`, `lockdownHolds`) disables `autocapture`, `rageclick`, `capture_pageview`, `capture_dead_clicks`, session recording, surveys, product tours, conversations, web experiments, external dependency loading, scroll properties and device model; sets `person_profiles: 'never'`, `persistence: 'memory'`, `disable_persistence: true`, `advanced_disable_flags: true`.
  - Provider-neutral facade: `src/measurement/index.ts` (`createMeasurement`) — the single place a provider sink is constructed, inside the product page mount effect.
- Ingestion origin (approved set): **`https://us.i.posthog.com`**, declared in `config/approved-analytics-hosts.ts` (`APPROVED_ANALYTICS_HOSTS`, `approvedAnalyticsHostsForProvider`). This module lives outside `src/` on purpose: no production module may contain the ingestion host literal. It reaches the bundle only through the Vite `define` constant `__HAOO_APPROVED_ANALYTICS_HOSTS__`, and only when the provider resolves to exactly `posthog`.
- Query/reporting origin: **`https://us.posthog.com`**, path `/api/projects/{POSTHOG_PROJECT_ID}/query/` — built only in `scripts/generate-haoo-report.mjs`.
- Auth:
  - Browser capture: `VITE_HAOO_POSTHOG_TOKEN` (public, write-only project key, world-readable in the bundle by design).
  - Reporting: `POSTHOG_QUERY_API_KEY` sent **only** as `Authorization: Bearer …` (`src/reporting/generate.ts`), never in the body, never echoed to stdout or into the generated document.

**Enquiry form delivery — FormSubmit:**
- Endpoint contract: absolute `https://formsubmit.co/ajax/{target}` only; host must be exactly `formsubmit.co` and protocol `https:` (`src/products/haoo.ts` `resolveQualifyEndpoint`).
- Fallback when unconfigured: `QUALIFY_ENDPOINT_FALLBACK = 'https://formsubmit.co/ajax/info@haoo.online'`.
- Configured by `VITE_HAOO_FORM_ENDPOINT` (a repository *variable*, not a secret).
- Submission: `fetch(qualify.endpoint, …)` in `src/components/QualifyForm.tsx:346`; pure validation logic in `src/components/qualify-form.logic.ts`.

**Outbound contact / onboarding destinations (`src/products/haoo.ts`):**
- WhatsApp deep link `https://wa.me/{PHONE_NUMBER}?text=…`
- `mailto:info@haoo.online`
- Self-onboarding app `https://manage.haoo.online/`

## Data Storage

**Databases:**
- None. No ORM, no database client, no server-side persistence.

**Browser storage:**
- `window.localStorage`, single key `zph.haoo.ctx.v1` (`src/products/haoo.ts` `storageKey`), holding the privacy-bounded engagement context (visit band, last-seen band) read/written by `src/measurement/index.ts`. Storage failures degrade to `storage = null` rather than throwing.
- PostHog itself writes **nothing** to storage or cookies (`persistence: 'memory'`, `disable_persistence: true`); `src/test/measurement-page.test.tsx` asserts `sessionStorage.length === 0` and `document.cookie === ''`.

**File Storage:**
- Local filesystem only. `npm run report:haoo` writes `.reports/haoo-funnel-report.html` (gitignored) via a reserve-temp-then-rename write in `scripts/generate-haoo-report.mjs`.
- Static marketing assets served from `public/` (`public/products/haoo/*`, `public/marketing/*`).

**Caching:**
- None at application level. CI uses npm's `setup-node` cache.

## Authentication & Identity

**Auth Provider:**
- None. The site is fully public and anonymous; no user accounts, sessions, or login flow. PostHog `person_profiles: 'never'` means no identified persons are created.

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry or equivalent). Failures fail closed: the measurement adapter returns refusal sentinels, the report CLI sets `process.exitCode = 1` and prints a redacted sentence that never echoes the offending environment value.

**Analytics:**
- PostHog custom events only — the ten-name allowlist `HAOO_MEASUREMENT_EVENTS` in `src/products/haoo.ts`: `haoo_page_view`, `haoo_brochure_preview`, `haoo_brochure_open`, `haoo_brochure_download`, `haoo_qualify_start`, `haoo_qualify_submit`, `haoo_assisted_whatsapp`, `haoo_assisted_phone`, `haoo_assisted_email`, `haoo_self_onboarding`. Any name off the list is rejected by `isMeasurementEventName`.
- Visitor-facing disclosure component: `src/components/MeasurementDisclosure.tsx`.

**Logs:**
- No log aggregation. Only CI step output and the report CLI's single stdout success line.

## CI/CD & Deployment

**Hosting:**
- GitHub Pages, custom domain `www.zero-paperhub.com` (`CNAME`).

**CI Pipeline:**
- `.github/workflows/deploy.yml`, triggered on push to `main` and `workflow_dispatch`. Concurrency group `pages` with `cancel-in-progress: false`.
- Permissions: `contents: read`, `pages: write`, `id-token: write`.
- The four `VITE_*` build inputs are supplied **as repository variables** (`${{ vars.* }}`) and never as secrets; `src/test/build-output.test.ts` parses this workflow and asserts both that `POSTHOG_QUERY_API_KEY` / `POSTHOG_PROJECT_ID` are absent and that every `VITE_*` assignment is exactly one `vars.*` expression.

## Environment Configuration

**Browser build variables (public, inlined into the bundle):**
- `VITE_HAOO_FORM_ENDPOINT`
- `VITE_HAOO_MEASUREMENT_PROVIDER` (`none` | `posthog`; anything else fails closed to `none`)
- `VITE_HAOO_POSTHOG_TOKEN`
- `VITE_HAOO_POSTHOG_API_HOST` (must match an entry in the approved host list)

**Local-only report credentials (must never carry a `VITE_` prefix):**
- `POSTHOG_QUERY_API_KEY`
- `POSTHOG_PROJECT_ID` (numeric only — validated against scheme, path, query and fragment injection)

**Secrets location:**
- No secrets are stored in the repository or in CI. The two report credentials exist only in the operator's local shell. `.env` / `.env.*` are gitignored.

**Retired provider names (rename table only):**
- `scripts/generate-haoo-report.mjs` retains `PLAUSIBLE_STATS_API_KEY`, `PLAUSIBLE_SITE_ID`, `VITE_HAOO_PLAUSIBLE_SRC`, `VITE_HAOO_PLAUSIBLE_DOMAIN` **solely** as a migration rename table that warns when a removed variable is still set. Plausible is not an integration of this project; PostHog fully replaced it. Related negative fixtures live in `src/test/fixtures/posthog-capture-contract.ts` (e.g. a rejected `persistence: 'localStorage+cookie'` value).

## Webhooks & Callbacks

**Incoming:**
- None. Static site with no server endpoints.

**Outgoing:**
- PostHog event ingestion POSTs from the browser to `https://us.i.posthog.com`.
- FormSubmit AJAX POST from `src/components/QualifyForm.tsx`.
- PostHog HogQL query POST from the local report CLI to `https://us.posthog.com/api/projects/{id}/query/`; the response is provenance-checked in `src/reporting/query-provenance.ts` (the echoed query kind and text must match what was submitted, else the report refuses and leaves the previous file untouched).

---

*Integration audit: 2026-09-05*
