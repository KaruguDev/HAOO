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
measurement sink. Its finite accepted set is `none` and `posthog`. An unset,
blank, `none`, or unrecognised value selects the inert no-op sink. Production
collection was approved by the privacy owner on 2026-09-05, and the deploy workflow
now supplies the three public `VITE_HAOO_*` values below. Whether the repository
variables behind them carry values is configured outside this repository and cannot
be observed from it.

Three public build-time variables configure collection:

- `VITE_HAOO_MEASUREMENT_PROVIDER` — set to the literal `posthog` to select the
  provider; every other value fails closed to `none`.
- `VITE_HAOO_POSTHOG_TOKEN` — the public project API key, from the project's
  settings in the provider dashboard. It is accepted only when the trimmed value
  matches the exact `phc_` prefix shape and stays inside the length ceiling;
  every other value resolves to the empty string and no sink is created.
- `VITE_HAOO_POSTHOG_API_HOST` — the ingestion destination. It must be an
  absolute `https:` URL with no credentials, query, or fragment, whose path is
  exactly the root, and whose origin equals an approved ingestion origin exactly.
  Any other value — a foreign origin, a lookalike host that merely contains the
  approved host, the approved host on another port, or the approved host carrying
  a path — resolves to no sink at all.

### The approved ingestion host is repository configuration, not a deployment value

The approved origin set lives in `config/approved-analytics-hosts.ts`, which is
version-controlled and outside `src/`. `VITE_HAOO_POSTHOG_API_HOST` can only ever
*select from* that set — it can never widen it. Exactly one origin is approved,
and the EU ingestion origin is deliberately absent rather than listed-and-unused,
so a build cannot be pointed at a region the visitor-facing disclosure does not
name. Approving another origin is a reviewed repository change plus a redeploy;
it is never a deployment-variable edit. This is what stops a changed or tampered
build variable from redirecting the product page's analytics traffic.

A rejected value fails closed, not open: no provider is initialized, no event
sink is created, and the product journey and the bounded local engagement context
keep working exactly as they do with no analytics configured at all.

Vite inlines every `VITE_*` value into the world-readable JavaScript bundle.
These values are public configuration, not secrets. All three are passed through the
deploy workflow's `Build` step `env` block alongside `VITE_HAOO_FORM_ENDPOINT`,
sourced from GitHub Actions repository **variables** rather than secrets: the `phc_`
project key is public write-only by design and is inlined into a world-readable
bundle, so storing it as a secret would imply a confidentiality property the artifact
cannot have. With any missing or rejected value, the product journey
continues normally and the bounded local engagement context still works.

When the sink exists it sends exactly one bare allowlisted event name per explicit
action. Every automatic capture surface — DOM autocapture, automatic page views
and page leaves, session replay, surveys, heatmaps, exception capture, and web
vitals — is set to an explicit off and then re-read off the merged configuration
the vendor produced before any sink exists; if a single one of them reads back
wrong, no sink is returned. It sends no event properties, form values, stable
identifiers, retry buffer, or ordered clickstream, and it creates no person
profile.

### The SDK is loaded — delivery depends on the provider selector

**Read this before drawing any conclusion from a report that shows zeros.**
`src/measurement/posthog.ts` imports `posthog-js` in a value position, so the SDK
is bound by a production module and the vendor chunk (`posthog-sdk`) ships in
every build. The adapter no longer refuses at an empty global slot: it falls back
to the bound module, sends the lockdown, and re-reads the merged configuration
before any sink exists.

**Events are delivered only when `VITE_HAOO_MEASUREMENT_PROVIDER` is set to `posthog`.**
Plan `04.1-11` resolved the hold this paragraph used to describe: the processor
approval is recorded, and the deploy workflow now sets that selector — with the
project key and the ingestion host — from GitHub Actions repository variables. The
condition itself is unchanged and still operative. A build that has not selected the
provider carries no approved ingestion origin in any of this project's own chunks and
cannot address the endpoint at all, so `npm run report:haoo` reports zeros for every
window before the first configured deploy, and reports zeros indefinitely if those
three repository variables were never created — an owner step this repository can
neither perform nor observe.

Loading the SDK was not a free change, and the record of what it cost is kept
rather than tidied away. Putting a third party's minified artifact into every
build made several bundle-level invariants claims about the vendor rather than
about this project. Each was resolved in the same commit as the import: the
identity and ordered-emission scan was narrowed to this project's own chunks with
its predecessor named, the approved-origin absence case now builds its own
provider-unset probe instead of assuming the repository's `dist` is one, the
exactly-once origin count moved to the probe's project chunks, and the
competitor-origin and report-credential scan kept its whole-bundle scope only
because every one of its patterns was measured against the emitted vendor chunk
and found absent. The partition that makes those scans possible is itself
asserted, so the exclusion cannot hide this project's own code.

### What the delivery change already cost — and what replaced it

The analytics code used to be a script fetched at runtime from a
repository-approved origin, and the build could prove that the only script URL it
would ever accept came from that approved set. Pinning the SDK as a dependency
**withdrew** that bundle-level origin guarantee. It is withdrawn rather than
quietly dropped, and its named successor is narrower and asserted in its place:
**the provider's ingestion host literal may not appear in any application source
module under `src/`.** The origin reaches a bundle by exactly one route — the
provider-gated build-time constant sourced from
`config/approved-analytics-hosts.ts` — so a build that has not deliberately
selected the provider inlines an empty approved list and cannot address the
ingestion endpoint at all. That inertness is proven by building a provider-unset
bundle and scanning it, rather than by a source string scan.

### No dashboard goals are required

The owner report queries raw event names through a single aggregate, so no
dashboard goal has to exist for any of the ten names and none has to be created
before enabling collection. Nothing can be permanently omitted by a goal created
late.

What the owner must do instead is set two things in the provider's project UI
that no code here can assert — enable "Discard client IP data", and leave the
automatic-capture toggles alone. Both, together with the full activation
checklist and the five open human gates, are in `04.1-USER-SETUP.md`, under this
migration's phase directory `.planning/phases/04.1-*/`. The directory is named by
prefix here deliberately: its full name carries the removed provider's name, and
this tree is being cleared of that literal.

### Report credential boundary

The local report process requires two inputs that are separate from the three public
browser build variables above:

- `POSTHOG_QUERY_API_KEY` is a local-process secret — a personal API key scoped to
  this project, carrying the single permission the provider's UI labels *Query
  Read*. Never prefix it with `VITE_`, add it to the browser build, commit it, or
  write it into a generated report. The report command sends it only in an
  `Authorization` header.
- `POSTHOG_PROJECT_ID` is the numeric project id the report queries, from the
  project's settings in the provider dashboard. It is not a report label and must
  not be entered as a URL with a scheme or path.

After both values are already set in the local shell, run the report without placing
an example credential or project id in documentation:

```bash
POSTHOG_QUERY_API_KEY="$POSTHOG_QUERY_API_KEY" POSTHOG_PROJECT_ID="$POSTHOG_PROJECT_ID" npm run report:haoo
```

An environment still carrying one of the removed variable names fails loudly and
names the rename, rather than reporting the new name as merely missing and sending
you to create a credential you may already hold.

Application code receives query results through an injected capability and never sees
the key or provider endpoint. Production collection is approved and the deploy workflow
supplies the three public `VITE_HAOO_*` values; the two report credentials above stay
local process inputs and never enter that build environment, a `VITE_*` name, or the
published bundle.

### Spam handling

FormSubmit's reCAPTCHA is disabled for this form — the page sends `_captcha: 'false'` in the request body — so the reCAPTCHA filtering described for the contact form above does not apply to it.

The form carries an off-screen honeypot field and browser validation. **Neither is inbox protection.** Both live in the page, while the endpoint is inlined into the world-readable bundle: anyone can post to it directly with `_captcha: 'false'` and an empty `_honey`, never load the page, and reach the inbox. The honeypot deters naive page-scraping bots only, and its field name and off-screen offset are a widely fingerprinted pattern.

Closing that gap is a prerequisite of the Phase 5 `LEAD-07` activation above. One of the following must be chosen and recorded before the endpoint carries live mail:

- re-enable FormSubmit's reCAPTCHA for this form, or
- front the submission with a challenge the server verifies (Cloudflare Turnstile or equivalent), or
- move submission to a first-party function that holds the provider address server-side.
