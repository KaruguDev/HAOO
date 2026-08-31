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
measurement sink. Its finite accepted set currently contains only `none`.
An unset, blank, `none`, or unknown value therefore selects the same inert no-op
sink; the value is never interpreted as a URL or dynamically loaded script.

Phase 3 records bare, allowlisted event names through this sink and stores only
the disclosed bounded browser context. It ships no analytics SDK or account,
sends no event-property or form-field payload, and maintains no delivery queue,
retry buffer, identifier, or ordered clickstream. Live aggregate reporting and
adding a coarse engagement summary to qualification email are Phase 4 work and
are not available in this build.

### Spam handling

FormSubmit's reCAPTCHA is disabled for this form — the page sends `_captcha: 'false'` in the request body — so the reCAPTCHA filtering described for the contact form above does not apply to it.

The form carries an off-screen honeypot field and browser validation. **Neither is inbox protection.** Both live in the page, while the endpoint is inlined into the world-readable bundle: anyone can post to it directly with `_captcha: 'false'` and an empty `_honey`, never load the page, and reach the inbox. The honeypot deters naive page-scraping bots only, and its field name and off-screen offset are a widely fingerprinted pattern.

Closing that gap is a prerequisite of the Phase 5 `LEAD-07` activation above. One of the following must be chosen and recorded before the endpoint carries live mail:

- re-enable FormSubmit's reCAPTCHA for this form, or
- front the submission with a challenge the server verifies (Cloudflare Turnstile or equivalent), or
- move submission to a first-party function that holds the provider address server-side.
