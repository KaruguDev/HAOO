# Phase 02: User Setup Required

**Generated:** 2026-08-30
**Phase:** 02-submit-a-qualified-haoo-enquiry
**Status:** Incomplete

Complete these items for the deployed HAOO qualification form to submit to the obfuscated endpoint. Claude automated everything possible — the deploy workflow already passes the value to the build. These items require human access to the GitHub repository settings and to FormSubmit.

**Nothing here blocks the site.** With none of it done, the build still ships a working form that submits to the readable fallback `https://formsubmit.co/ajax/info@haoo.online`. Completing it only removes the readable address from the public bundle.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `VITE_HAOO_FORM_ENDPOINT` | FormSubmit random-token URL for `info@haoo.online` (see Dashboard Configuration below) | GitHub → Settings → Secrets and variables → Actions → **Variables** tab → New repository variable |

**Create it as a repository VARIABLE, not a secret.** Vite inlines every `VITE_*` value into the public JavaScript bundle, so this value is world-readable by construction. The random token is scraper obfuscation, never inbox protection. Storing it as a secret would misrepresent what it protects. Never commit it in a `.env` file.

## Account Setup

- [ ] **Access to the `info@haoo.online` mailbox**
  - Needed to receive the FormSubmit activation email in Phase 5.
  - Skip if: the mailbox is already reachable by the person doing this setup.

## Dashboard Configuration

- [ ] **Obtain the HAOO random-token endpoint from FormSubmit**
  - Location: <https://formsubmit.co>
  - Enter `info@haoo.online` and copy the returned random-token URL.
  - Set to: the full AJAX form of that URL — `https://formsubmit.co/ajax/{token}` — with exactly one non-blank target segment after `/ajax/`.
  - Notes: a bare `https://formsubmit.co/ajax`, a trailing slash, extra path segments, `http://`, another host, or any credentials/query/fragment are all rejected by the build and silently fall back to the readable address. See `README.md` § HAOO qualification form for the complete accepted shape.

## Verification

After adding the variable, re-run the deploy workflow, then verify locally that a configured value survives the build:

```bash
# The fallback path must stay buildable with no configuration at all
env -u VITE_HAOO_FORM_ENDPOINT npm run build

# A configured token must be inlined verbatim into the bundle
VITE_HAOO_FORM_ENDPOINT="https://formsubmit.co/ajax/<token>" npm run build
grep -o 'formsubmit.co/ajax/[^"]*' dist/assets/*.js | sort -u
```

Expected results:
- The unset build exits 0 and the bundle carries `formsubmit.co/ajax/info@haoo.online`.
- The configured build exits 0 and the bundle carries `formsubmit.co/ajax/<token>` instead, with no readable address.

## Out of scope for Phase 2

Endpoint **activation** and live-mail confirmation — submitting a first enquiry, confirming FormSubmit's activation email, and verifying a second enquiry is delivered — are Phase 5 `LEAD-07`. Until that is done, a submission that reports success in the browser has not been proven to reach the inbox.

---

**Once all items complete:** Mark status as "Complete" at top of file.
