# Phase 4: User Setup Required

**Generated:** 2026-09-01
**Phase:** 04-report-and-enrich-the-haoo-funnel-truthfully
**Status:** Incomplete

Complete these items before `npm run report:haoo` can carry live counts. Claude automated
everything possible: the report path is fully implemented and fixture-verified, and every
contract in `src/test/haoo-report.test.ts` runs with no credential and no network access.
The items below require human access to the Plausible dashboard and to the local shell
environment.

**These credentials are not required to execute, verify, or review this phase.** They are
required only to point the generator at a real site.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `PLAUSIBLE_STATS_API_KEY` | Plausible Dashboard → Settings → API Keys (Business plan feature) | Local process environment ONLY |
| [ ] | `PLAUSIBLE_SITE_ID` | Plausible Dashboard → Site Settings → Domain (the site's domain string) | Local process environment ONLY |

**Never** define either as a `VITE_` variable and never commit either value. Vite inlines
`VITE_*` into a world-readable bundle; the Stats API key is a bearer credential. Only
`scripts/generate-haoo-report.mjs` reads `process.env`, and a contract test asserts that
`src/reporting/generate.ts` carries neither the credential name nor the provider origin.

## Account Setup

- [ ] **Plausible account with Stats API access**
  - URL: https://plausible.io
  - Skip if: the account already exists and is on a plan that exposes API keys
  - Blocked by: privacy/legal approval of the processor, data location, retention, and
    Kenya Data Protection Act treatment (carried blocker in `STATE.md`; UI-SPEC checkpoint
    C-3). Do not enable production collection before that approval.

## Dashboard Configuration

- [ ] **Create the ten exact custom-event goals**
  - Location: Plausible Dashboard → Site Settings → Goals → Add goal → Custom event
  - Set to: the ten names in `HAOO_MEASUREMENT_EVENTS` (`src/products/haoo.ts` lines 14-25),
    byte-identical: `haoo_page_view`, `haoo_brochure_preview`, `haoo_brochure_open`,
    `haoo_brochure_download`, `haoo_qualify_start`, `haoo_qualify_submit`,
    `haoo_assisted_whatsapp`, `haoo_assisted_phone`, `haoo_assisted_email`,
    `haoo_self_onboarding`
  - Notes: create every goal **before** enabling production collection. Plausible does not
    backfill events into a goal created later, so a late goal silently reports 0 for the
    period before it existed.

- [ ] **Set the site reporting timezone to `Africa/Nairobi`**
  - Location: Plausible Dashboard → Site Settings → General
  - Set to: `Africa/Nairobi`
  - Notes: the generator derives "today" in this exact zone and prints it in the report
    metadata line. A different site timezone would make the inclusive period boundaries in
    the headings disagree with the periods the provider aggregated.

## Verification

After completing setup, verify with:

```bash
# Both values present in the local environment (prints nothing but the check result)
node -e "process.exit(process.env.PLAUSIBLE_STATS_API_KEY && process.env.PLAUSIBLE_SITE_ID ? 0 : 1)" \
  && echo "credentials present"

# Generate the report
npm run report:haoo

# The artifact is local-only and stays out of git
git status --porcelain .reports   # expect no output
grep -c '<script' .reports/haoo-funnel-report.html   # expect 0
```

Expected results:
- `npm run report:haoo` prints one line naming the resolved report path and exits 0.
- `.reports/haoo-funnel-report.html` opens with no network access and shows four period
  sections whose headings name real inclusive dates.
- A wrong or revoked key prints the error sentence to the terminal, exits 1, and leaves
  any previous report file byte-identical.

---

**Once all items complete:** Mark status as "Complete" at top of file.
