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
- [ ] **Confirm the integration records the automatic-pageview opt-out**
  - Location: Plausible Dashboard → Site Settings → Site Installation
  - Notes: Application code records the automatic-pageview opt-out in the provider options and re-reads it for the configured domain before any script is appended, and it emits only the ten explicit name-only events. That is a fail-closed gate on the application's own behaviour: no script and no event sink exist until the re-read succeeds. Whether the loaded vendor script honours the recorded value is not something this repository can prove — it is confirmed live, by the event-uniqueness item in the Verification section below.
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

These three human gates cannot be cleared by any command above. Perform each one and record
the result; none of them is closed by a passing test or a green build. Until every item in
this file has been performed and recorded, this file's header stays `Status: Incomplete`.

- [ ] **Confirm live event uniqueness after production enablement**
  - Owner: privacy/product owner
  - Location: Plausible Dashboard → live view, with the HAOO page loaded once using the approved script and site values
  - Expected: exactly one page-view occurrence for the visit, no additional automatic pageview, and no pageview carrying campaign parameter values.
  - Notes: This is the gate the `D1` coverage row in `04-09-SUMMARY.md` now points at, recorded as `behavior_unverified_items` in `04-VERIFICATION.md`.
- [ ] **Confirm no foreign provider global exists on the deployed page**
  - Owner: privacy/product owner
  - Location: the deployed HAOO page, browser console before the bundle runs
  - Expected: no other snippet, tag manager, or extension defines the provider global before the bundle runs — it is undefined until the bundle installs its own stub, so the adoption path is never taken in production.
  - Notes: Why this matters — a foreign callable global that merely assigns the options it receives passes the application's recorded-opt-out check, so only inspection of the deployed page can establish that no such global exists.
- [ ] **Judge MVP outcome and privacy readability**
  - Owner: privacy/product owner
  - Location: one maximum-context enquiry summary read together with the generated report and the page disclosure, at a 320px viewport and 200% zoom, with keyboard and screen-reader navigation
  - Expected: readable non-scoring prose, no identity or stage-progression claim, four period labels and every stage clarifier wrapping without clipping or overlap, 44px targets intact, and no body-level horizontal scroll.
  - Notes: This gate also covers the five held-out visual considerations carried in 04-10's must_haves, so they are not orphaned.

---

**Once all items complete:** Mark status as `Complete` at the top of this file.
