# ZERO-PAPERHUB

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-qh3qzu6i)

## Contact form

The contact form posts to FormSubmit and delivers enquiries to `info@zero-paperhub.com`. FormSubmit provides server-side reCAPTCHA filtering, and the form also includes a honeypot field and browser validation.

After deploying the form for the first time:

1. Submit one test enquiry from `https://www.zero-paperhub.com/#contact`.
2. Open the activation message sent by FormSubmit to `info@zero-paperhub.com` and confirm the form.
3. Submit a second enquiry and verify that it is delivered. Check the spam folder if the activation message does not appear in the inbox.

Activation is required only once for this domain and recipient address.

## HAOO qualification form

The qualification form on `https://www.zero-paperhub.com/products/haoo/` submits by AJAX — a JSON `fetch` sent from the visitor's browser, so the visitor never leaves the page — to FormSubmit, which delivers the enquiry to `info@haoo.online`.

### The `VITE_HAOO_FORM_ENDPOINT` variable

The submission endpoint is read at build time from the GitHub Actions repository variable `VITE_HAOO_FORM_ENDPOINT`, which the deploy workflow passes to its `Build` step.

A configured value is accepted only when it is an absolute `https://formsubmit.co/ajax/{target}` URL carrying exactly one target path segment, and that segment — after URL decoding — is neither blank nor contains a slash. Credentials, a query string, and a fragment are never accepted. Whitespace surrounding the whole configured value is trimmed before the value is checked.

Valid values, for example:

- `https://formsubmit.co/ajax/info@haoo.online` — the readable address
- `https://formsubmit.co/ajax/2f8c1a9e4b7d6035a1c9e8f2b4d70a63` — a FormSubmit random token

Every other value falls back to `https://formsubmit.co/ajax/info@haoo.online`. The fallback is selected when the variable is undefined, empty, or whitespace-only, and for each rejected value, including:

- a bare `https://formsubmit.co/ajax`, a trailing-slash `https://formsubmit.co/ajax/`, or `https://formsubmit.co/ajax//` — a route prefix is not a usable recipient
- an encoded-whitespace target such as `https://formsubmit.co/ajax/%20`
- a malformed percent-encoding such as `https://formsubmit.co/ajax/%E0%A4%A`
- extra target segments such as `https://formsubmit.co/ajax/info@haoo.online/extra`, or an encoded slash inside the target
- a non-AJAX FormSubmit route such as `https://formsubmit.co/info@haoo.online`
- `http://`, or any host other than `formsubmit.co`
- a URL carrying credentials, a `?query`, or a `#fragment`
- any string that is not a parsable absolute URL

Because every rejected value degrades to a working destination, a build with no configuration at all still ships a form that submits.

### This value is not a secret

Vite statically inlines `VITE_*` values into the published JavaScript bundle, so `VITE_HAOO_FORM_ENDPOINT` is world-readable to anyone who opens the deployed site's assets. A random token is **scraper obfuscation** — it keeps the readable `info@haoo.online` string out of the bundle — and it is **not** inbox protection. Do not rely on it as one.

Set it as an Actions repository *variable*: Settings → Secrets and variables → Actions → Variables → New repository variable. Storing it as a *secret* would misrepresent what it protects, and it must never be committed in a `.env` file.

### Activation is Phase 5 work

Activating the endpoint and confirming live mail for `info@haoo.online` — submitting a first enquiry, confirming FormSubmit's activation email, and verifying that a second enquiry is delivered — is tracked as Phase 5 `LEAD-07`. It is not a Phase 2 action. Until it is done, a submission that reports success in the browser has not been proven to reach the inbox.

## HAOO measurement provider

`VITE_HAOO_MEASUREMENT_PROVIDER` is a public build-time selector for the HAOO
measurement sink. Its finite accepted set is `none` and `plausible`. An unset,
blank, `none`, or unrecognised value selects the inert no-op sink. Production
enablement is currently deferred: do not set the provider variables until the
analytics processor and collection have received separate privacy-owner approval.

Three public build-time variables configure collection:

- `VITE_HAOO_MEASUREMENT_PROVIDER` — set to the literal `plausible` to select the
  provider; every other value fails closed to `none`.
- `VITE_HAOO_PLAUSIBLE_SRC` — the site-specific script URL from Plausible's Site
  Installation settings. It must be an absolute `https:` URL with no credentials,
  query, or fragment and a path ending in `.js`; otherwise no sink is created.
- `VITE_HAOO_PLAUSIBLE_DOMAIN` — the site domain configured in Plausible. An empty
  value leaves collection disabled.

Vite inlines every `VITE_*` value into the world-readable JavaScript bundle.
These values are public configuration, not secrets. After enablement is approved,
pass all three through the deploy workflow's `Build` step `env` block alongside
`VITE_HAOO_FORM_ENDPOINT`. With any missing or rejected value, the product journey
continues normally and the bounded local engagement context still works.

The sink sends exactly one bare allowlisted event name per explicit action. It
disables automatic pageview capture and does not enable automatic outbound-link,
download, form, revenue, or hash-routing capture. It sends no event properties,
form values, stable identifiers, retry buffer, or ordered clickstream.

### Plausible dashboard prerequisite

Before enabling collection, create custom-event goals for all ten names in
`HAOO_MEASUREMENT_EVENTS`: `haoo_page_view`, `haoo_brochure_preview`,
`haoo_brochure_open`, `haoo_brochure_download`, `haoo_qualify_start`,
`haoo_qualify_submit`, `haoo_assisted_whatsapp`, `haoo_assisted_phone`,
`haoo_assisted_email`, and `haoo_self_onboarding`. Create them in Plausible under
Site Settings → Goals → Add goal → Custom event. Plausible does not backfill events
into a goal created later, so enabling first would permanently omit earlier activity
from the owner report.

### Report credential boundary

The report generator reads `PLAUSIBLE_STATS_API_KEY` only from the local process
environment when `npm run report:haoo` runs. It is a credential: never prefix it
with `VITE_`, never add it to the browser build, never commit it, and never write it
into a generated report. The report command sends it only in the Stats API
authorization header; application code receives query results through an injected
capability and never sees the key or provider endpoint.

### Spam handling

FormSubmit's reCAPTCHA is disabled for this form — the page sends `_captcha: 'false'` in the request body — so the reCAPTCHA filtering described for the contact form above does not apply to it.

The form carries an off-screen honeypot field and browser validation. **Neither is inbox protection.** Both live in the page, while the endpoint is inlined into the world-readable bundle: anyone can post to it directly with `_captcha: 'false'` and an empty `_honey`, never load the page, and reach the inbox. The honeypot deters naive page-scraping bots only, and its field name and off-screen offset are a widely fingerprinted pattern.

Closing that gap is a prerequisite of the Phase 5 `LEAD-07` activation above. One of the following must be chosen and recorded before the endpoint carries live mail:

- re-enable FormSubmit's reCAPTCHA for this form, or
- front the submission with a challenge the server verifies (Cloudflare Turnstile or equivalent), or
- move submission to a first-party function that holds the provider address server-side.
