# Phase 4: User Setup Required

**Generated:** 2026-09-01
**Phase:** 04-report-and-enrich-the-haoo-funnel-truthfully
**Status:** Incomplete — production enablement deliberately deferred

The provider integration is implemented and fixture-verified, but production collection must remain disabled until the privacy owner separately approves the analytics processor and collection. The deploy workflow has not been changed and the variables below must remain unset until that approval.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `VITE_HAOO_MEASUREMENT_PROVIDER` | Literal public value `plausible` after approval | GitHub Actions `Build` step environment |
| [ ] | `VITE_HAOO_PLAUSIBLE_SRC` | Plausible Dashboard → Site Settings → Site Installation → site-specific script URL. Copy it **only if** it is on the approved origin `https://plausible.io` and the approved path `/js/script.js`; any other origin or path is rejected and disables analytics entirely. The approved set is repository configuration (`config/approved-analytics-script-sources.ts`) and cannot be widened from here. | GitHub Actions `Build` step environment |
| [ ] | `VITE_HAOO_PLAUSIBLE_DOMAIN` | Plausible Dashboard → Site Settings → General → Domain | GitHub Actions `Build` step environment |

All three are public build-time configuration. Never put a secret in a `VITE_*` variable.

## Account and Approval

- [ ] **Approve the Plausible processor and production collection**
  - Owner: privacy/product owner
  - Do not enable collection before this approval.
- [ ] **Create or select the Plausible site for the HAOO journey**
  - Skip if an approved site already exists.

## Dashboard Configuration

- [ ] **Create all ten custom-event goals before enabling collection**
  - Location: Plausible Dashboard → Site Settings → Goals → Add goal → Custom event
  - Names: `haoo_page_view`, `haoo_brochure_preview`, `haoo_brochure_open`, `haoo_brochure_download`, `haoo_qualify_start`, `haoo_qualify_submit`, `haoo_assisted_whatsapp`, `haoo_assisted_phone`, `haoo_assisted_email`, `haoo_self_onboarding`
  - Notes: Plausible does not backfill events into goals created later.
- [ ] **Confirm the Site Installation snippet offers the base script, not an extension variant**
  - Location: Plausible Dashboard → Site Settings → Site Installation
  - Notes: Only `https://plausible.io/js/script.js` is approved. A variant URL such as `script.outbound-links.js`, `script.file-downloads.js`, `script.form-submissions.js`, `script.hash.js`, or `script.revenue.js` fails closed to no analytics at all — it does not partially enable capture. Widening the approved set is a reviewed change to `config/approved-analytics-script-sources.ts` plus a redeploy, never a variable edit.
- [ ] **Confirm the integration does not rely on automatic capture**
  - Location: Plausible Dashboard → Site Settings → Site Installation
  - Notes: Application code disables automatic pageviews and emits only the ten explicit name-only events.
- [ ] **After approval, expose the three public values to the build**
  - Location: `.github/workflows/deploy.yml`, `Build` step `env` block
  - Notes: Add them beside `VITE_HAOO_FORM_ENDPOINT`; do not add `PLAUSIBLE_STATS_API_KEY`.

## Report Credential

- [ ] **Provide `PLAUSIBLE_STATS_API_KEY` only to the local report process**
  - Source: Plausible account API-key settings
  - Add to: the local shell environment used to run `npm run report:haoo`
  - Never add it to GitHub Pages build variables, source files, or generated reports.
- [ ] **Provide `PLAUSIBLE_SITE_ID` as the exact Plausible-configured domain or hostname**
  - Source: Plausible Dashboard → Site Settings → General → Domain
  - Add to: the same local shell environment used to run `npm run report:haoo`
  - Match the configured spelling exactly; use neither a report label nor a URL with a scheme or path.

These two local report inputs are separate from the three public browser build variables
`VITE_HAOO_MEASUREMENT_PROVIDER`, `VITE_HAOO_PLAUSIBLE_SRC`, and
`VITE_HAOO_PLAUSIBLE_DOMAIN`. Production collection remains deferred until privacy-owner
approval, creation of all ten dashboard goals, and explicit deployment setup.

## Verification

After approval, dashboard setup, and deployment configuration:

```bash
npm run build
npm test
PLAUSIBLE_STATS_API_KEY="$PLAUSIBLE_STATS_API_KEY" PLAUSIBLE_SITE_ID="$PLAUSIBLE_SITE_ID" npm run report:haoo
```

Expected results:

- The HAOO journey continues to work if the analytics script is blocked or fails.
- Each accepted action creates one name-only custom event and no automatic duplicate.
- The owner report contains aggregate counts for the configured site without exposing the API key.

---

**Once all items complete:** Mark status as `Complete` at the top of this file.
