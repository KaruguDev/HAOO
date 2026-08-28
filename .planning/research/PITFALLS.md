# Domain Pitfalls

**Domain:** Privacy-first product marketing, lead qualification, email delivery, and assisted/self-onboarding funnel on a static React/Vite/GitHub Pages site
**Project:** Zero-Paper Hub — HAOO launch journey
**Researched:** 2026-08-29
**Overall confidence:** MEDIUM (current primary documentation cross-checked with the existing codebase; legal conclusions require Kenyan counsel or a qualified data-protection review)

## Critical Pitfalls

These mistakes can invalidate the success metric, expose prospect data, silently lose leads, or force a later architecture rewrite.

### 1. Calling clicks, redirects, or email attempts “qualified leads”

**What goes wrong:** The reporting layer conflates very different events: viewing HAOO, clicking a brochure, starting a form, passing client-side validation, reaching a success URL, an email arriving, a salesperson accepting the lead, and a prospect creating an account. A click on WhatsApp or `manage.haoo.online` is reported as onboarding; a FormSubmit redirect is reported as delivery; repeat page views are reported as repeat people.

**Why it happens:** A static site can directly observe browser events but not the downstream outcome. Privacy-first tools deliberately avoid persistent identity, and outbound app/site boundaries do not send completion status back. FormSubmit controls delivery after the browser leaves the site.

**Consequences:** The primary success metric becomes misleading, funnel optimization targets the wrong step, spam inflates “demand,” and business decisions are made from numbers that cannot support the claimed conclusion.

**Prevention:**

- Define an event dictionary before implementation. Use literal names such as `haoo_product_view`, `haoo_brochure_open`, `haoo_brochure_download_click`, `haoo_qualification_submit_attempt`, `haoo_qualification_success_redirect`, `haoo_whatsapp_click`, `haoo_email_click`, `haoo_phone_click`, and `haoo_self_onboarding_click`.
- Reserve “delivered lead” for a testable mailbox/provider outcome and “onboarded” for destination-owned registration data. The website should claim only “clicks to self-onboarding” unless `manage.haoo.online` later confirms account creation.
- Treat analytics totals as directional. Document that blockers, bots, duplicate tabs, network failures, private browsing, app handoffs, and cookie-free unique-visitor models create under- and over-counting.
- Report form qualifications separately from aggregate engagement. Portfolio size, role, location, and timing belong in the voluntarily submitted lead payload, not the analytics dashboard.
- If campaign parameters are added to the onboarding URL, first confirm HAOO owns, preserves, protects, and can report them. Never put name, phone, email, organization, or a stable browser identifier in query parameters.

**Detection / warning signs:** Dashboard labels use “lead,” “conversion,” or “onboarding” for a click; click counts equal purported signups; the success query parameter is the only evidence of email delivery; “repeat visitor” has no documented time window or identity method; numbers cannot be reconciled with mailbox tests or HAOO application registrations.

**Roadmap implication:** Establish measurement semantics and acceptance criteria before instrumenting UI. Destination-confirmed onboarding attribution is a separate future integration, not a v1 static-site feature.

### 2. Turning privacy-first analytics into covert individual journey tracking

**What goes wrong:** A localStorage UUID, fingerprint, full URL, form field, free-text value, or analytics custom property makes an identifiable or linkable history. On form submission, the implementation silently attaches the visitor's full browsing history to their name and contact details even though the page presents analytics as anonymous or aggregate.

**Why it happens:** The requirement to include “engagement context” with a submitted lead is interpreted as a request for person-level surveillance. Developers also assume “pseudonymous” means anonymous; it does not when Zero-Paper Hub can map the identifier back to a lead.

**Consequences:** Privacy notices become inaccurate; a privacy-first vendor configuration may be violated; data subject access/deletion and retention obligations expand; third-party and cross-border processing risks increase; URL or custom-property reports can expose PII to more staff than the mailbox alone.

**Prevention:**

- Keep aggregate analytics and lead qualification as two distinct data flows. Do not export analytics user/session IDs into the form and do not send submitted contact fields into analytics.
- Limit lead-side engagement context to a small, disclosed, session-scoped summary the visitor can reasonably expect, for example: HAOO page seen in this visit, brochure opened/download clicked in this visit, selected onboarding preference, landing campaign label from an allowlist, and form submission timestamp. Prefer booleans or controlled enums over raw event logs.
- Do not persist this summary across days merely to manufacture a “repeat visit” signal. If repeat-visit measurement is essential, select and document a lawful, proportionate mechanism and consent experience before implementation; otherwise report the analytics provider's aggregate/unique metric with its limits.
- Strip or reject PII and secrets from event names, properties, URLs, referrers, error logs, and campaign parameters. Avoid recording free-text form values in telemetry.
- Publish a concise just-in-time notice at the qualification form covering purpose, fields, engagement context, recipient/processors, retention, and how to exercise rights. Keep marketing opt-in separate and unticked; an enquiry is not consent to future promotional email.
- Decide retention and deletion handling before launch, including FormSubmit/email copies and analytics retention. Assess ODPC controller/processor registration obligations and any cross-border transfer safeguards with qualified advice.

**Detection / warning signs:** localStorage contains a long-lived visitor ID or event history; analytics custom properties contain emails, phone numbers, organization names, free text, exact WhatsApp messages, or unique lead tokens; the privacy notice says “anonymous” while a form hidden field sends a session/visitor key; the same identifier appears in analytics and inbox; there is no deletion or retention procedure.

**Roadmap implication:** Create the privacy and measurement contract before analytics or form implementation. A person-level analytics-to-lead join should be explicitly out of scope for v1.

### 3. Depending on FormSubmit as if it were an application-owned lead pipeline

**What goes wrong:** The browser navigates to FormSubmit, shows a redirect, or disables the button, but the HAOO team receives nothing. The recipient was not activated, mail landed in spam, fields lacked `name` attributes, reserved field names collided, the provider filtered the submission, the network failed, or the provider was unavailable. The site has no authoritative delivery state, retry queue, audit log, or support visibility.

**Why it happens:** FormSubmit makes a static HTML form convenient, but the convenience hides a hard external boundary. Existing code already treats submitting state and the success query parameter more confidently than the integration warrants.

**Consequences:** High-intent leads disappear silently, qualification data reaches the wrong mailbox, visitors retry and create duplicates, and launch checks pass locally while production delivery remains inactive.

**Prevention:**

- Treat FormSubmit as a provisional external processor and document its owner, privacy terms, data location/transfer implications, activation dependency, reserved fields, spam controls, retention behavior, and recovery owner.
- Use the HAOO recipient identity, not the general Zero-Paper Hub inbox. Activate the exact production recipient and production-domain form before launch.
- Keep every submitted control's stable `name`; keep the honeypot; add a server-independent submission identifier only if it is random, non-identifying, and useful for duplicate/support reconciliation.
- Design the UI so “sending” means only a browser attempt. Show a truthful recovery path if navigation/submission fails and keep direct HAOO phone/WhatsApp/email alternatives visible.
- Do not rely on `_autoresponse` as consent for marketing or proof the enquiry was reviewed. Avoid putting sensitive context in `_subject`, `_next`, source URLs, or other values likely to propagate into headers/logs.
- Establish a mailbox runbook: named owner, spam-folder checks, allowlisting, activation records, test cadence, response SLA, duplicate handling, and provider-outage fallback.
- Set an architecture exit criterion: if delivery evidence, guaranteed retry, attachment handling, abuse controls, data residency, or structured integrations become required, replace browser-to-FormSubmit delivery with a minimal controlled endpoint/service rather than layering hacks into the SPA.

**Detection / warning signs:** no activation email has been confirmed for `info@haoo.online`; local or preview-domain tests are the only tests; a URL query parameter is considered proof; test submissions reach the success screen but not inbox/spam; the button remains disabled after a blocked navigation; the team cannot identify who monitors the mailbox; delivery cannot be reconciled after an incident.

**Roadmap implication:** Form delivery needs its own integration and operational-verification work, not just a form component task.

### 4. Allowing spam and abusive payloads to poison the mailbox and metrics

**What goes wrong:** Bots discover the public FormSubmit endpoint and submit directly, bypassing the React UI and client validation. Honeypot-only protection misses targeted automation. Large or malicious free text, header-like values, repeated submissions, and disposable contacts overwhelm the HAOO mailbox; automatic form events count spam as conversions.

**Why it happens:** All static-site form configuration is public. Browser validation, disabled buttons, and client-side rate limiting are usability measures, not trust boundaries.

**Consequences:** Sales time is wasted, the qualified-lead metric is inflated, legitimate email is filtered alongside spam, autoresponses can be abused, and malicious content reaches email clients or later manual systems.

**Prevention:**

- Retain the honeypot and strict length/type constraints, but assume both can be bypassed. Use controlled option sets for role, portfolio band, location granularity, and timing instead of unnecessary free text.
- Do not automatically classify every submission as qualified. Define a transparent scoring/triage rule using declared business facts; flag but do not silently discard ambiguous prospects.
- Keep analytics form-submit events separate from mailbox-qualified counts. Monitor the ratio of attempts, success redirects, received mail, spam, and accepted prospects.
- Evaluate FormSubmit's built-in spam controls and CAPTCHA only if abuse appears; weigh accessibility/privacy costs before adding reCAPTCHA. Always preserve a non-form contact route.
- Avoid autoresponse content that can be weaponized and never reflect submitted HTML into the page. Treat emailed values as untrusted when staff copy them into other systems.
- Escalate to a controlled endpoint with server-side validation, rate limiting, provider API status, and observability if spam volume or delivery importance exceeds FormSubmit's operational fit.

**Detection / warning signs:** sudden conversion spikes without corresponding conversations; identical payloads; impossible portfolio/timing combinations; mailbox throttling; CAPTCHA becomes the first reflex without an accessibility review; analytics counts rise while accepted leads do not.

**Roadmap implication:** Include abuse scenarios in form acceptance tests and a measured escalation trigger in launch operations.

### 5. Shipping a PDF preview as the product experience

**What goes wrong:** The print brochure is embedded in an `iframe`, `object`, or browser PDF viewer and treated as the HAOO page. On mobile it is cramped, may download instead of preview, may expose browser-specific controls, and may be difficult or impossible to navigate with keyboard or screen reader. The PDF can also be missing, served with the wrong path/type, stale relative to the page, or indexed as the primary experience.

**Why it happens:** An embed appears faster than adapting source material to semantic responsive HTML. Desktop testing gives false confidence because PDF viewers differ substantially by browser, OS, and assistive technology.

**Consequences:** Mobile decision-makers cannot evaluate HAOO, accessibility suffers, conversion CTAs disappear inside the document, and two unsynchronized versions of product claims emerge.

**Prevention:**

- Make responsive semantic HTML the canonical product story. The PDF is a preserved artifact and optional preview/download, not the only way to learn the product.
- Provide three explicit affordances: preview where supported, open PDF in a new tab, and download the original file. Include a visible fallback inside the embed container.
- Give the embed a descriptive title, ensure focus does not become a keyboard trap, preserve zoom, and do not intercept standard viewer controls. Test the PDF's tags, reading order, link text, contrast, and document language; if the original is not accessible, the equivalent HTML becomes essential.
- Size the preview responsively and test iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari or the supported set, narrow landscape, slow connections, keyboard-only navigation, screen reader, zoom, and reduced motion.
- Use a stable public asset path that works under the actual custom domain/base configuration. Verify content type, file size, cache behavior, filename, and direct URL after deployment.
- Establish one content owner and a claim/contact checklist so the HTML adaptation and original PDF do not silently diverge.

**Detection / warning signs:** requirements are considered done once an `iframe` renders on desktop; the product's main CTA exists only inside the PDF; mobile opens a blank/grey box or immediate download; keyboard focus vanishes in the viewer; PDF and HTML show different contacts or claims; direct PDF URL 404s after deployment.

**Roadmap implication:** Build the responsive story first, then add the PDF enhancement and cross-device/accessibility verification.

### 6. Assuming outbound handoffs preserve attribution or prove completion

**What goes wrong:** WhatsApp, `tel:`, `mailto:`, and cross-domain onboarding handoffs are treated uniformly. A browser click may switch apps, open a chooser, be cancelled, or be blocked; no callback confirms a message, call, email, or account. Default cross-origin referrer policy generally sends only the origin, fragments are not sent, and mobile/privacy tooling can remove even that. UTM parameters may be discarded or stored insecurely by the destination.

**Why it happens:** Link clicks are easy to instrument and are mistaken for downstream events. Campaign parameters are added without coordination with the destination owner.

**Consequences:** Channel conversion rates are overstated, sensitive information leaks through URLs or prefilled messages, and teams cannot distinguish broken deep links from visitor abandonment.

**Prevention:**

- Track a click as a click, using destination class and CTA placement rather than contact data. Do not delay navigation waiting for analytics; a missed event is preferable to breaking the user's next step.
- Use canonical HTTPS URLs and a documented WhatsApp link format; URL-encode only a generic, user-editable opening message. Never prefill portfolio/contact details from the form into a WhatsApp URL.
- Provide visible channel labels and fallbacks: display the phone number and email address near their links so app-handoff failure is recoverable.
- For self-onboarding, agree on a small allowlist of campaign parameters with the HAOO application team and test end-to-end persistence. A future destination callback or aggregated registration report is needed to measure completed onboarding.
- Select a privacy-conscious referrer policy intentionally. Do not weaken it to `unsafe-url` for attribution; sensitive path/query leakage is a worse trade than losing path-level referrer data.
- Avoid attaching analytics callbacks that can noticeably delay or cancel `mailto:`, `tel:`, WhatsApp, or onboarding navigation. Event delivery during page/app handoff is inherently lossy, especially on mobile.

**Detection / warning signs:** “WhatsApp leads” equals WhatsApp link clicks; UTM values contain lead IDs; conversion requires the click event callback to finish; links work only when WhatsApp is installed; the destination team cannot show where campaign parameters are stored; referrer policy is weakened solely for analytics.

**Roadmap implication:** Treat outbound tracking and destination attribution as separate deliverables with separate owners and truth claims.

### 7. Crossing the static-hosting boundary accidentally

**What goes wrong:** Secrets, API keys, scoring logic, anti-spam rules, or provider credentials are put into Vite environment variables and therefore shipped to every browser. Client routing creates production 404s on direct/deep navigation. Security headers, redirects, dynamic acknowledgements, or runtime configuration are assumed to exist even though GitHub Pages serves static files. The growing commercial funnel may also move closer to uses GitHub says Pages is not intended to host.

**Why it happens:** Local Vite development feels like an application server, and unused Supabase dependencies can create the illusion that backend capabilities already exist.

**Consequences:** Credentials leak, high-value logic is bypassed, shared product URLs fail, provider changes require rebuild/deploy, and delivery/security requirements eventually force an unplanned hosting migration.

**Prevention:**

- Treat every value in the bundle, HTML, network request, and public repository as public. Only publishable site IDs and endpoints belong client-side.
- Prefer a real emitted HAOO HTML entry/path or a deliberately tested static routing strategy. Verify direct navigation, refresh, query strings, fragments, custom domain, CNAME, trailing slash, and 404 behavior in production.
- Do not introduce Supabase merely because its package is present; there is no configured backend. Select an external service only for a proven requirement and document the browser/server boundary.
- Implement page-level security/privacy metadata that static HTML supports, while recognizing that repository-specific response headers and server redirects are constrained on Pages. If strict response headers, secure server actions, webhook verification, or runtime secrets become mandatory, use an appropriate edge/function/backend or migrate hosting deliberately.
- Review current GitHub Pages terms/limits and hosting suitability before the journey becomes transactional or core SaaS infrastructure. Keep HAOO account creation and sensitive transactions on the application domain.

**Detection / warning signs:** `VITE_*` is called secret; frontend code holds an email/API token; `/products/haoo` works by client navigation but 404s on refresh; a local proxy is required for production behavior; requirements mention webhooks, durable retries, or secret scoring without a backend phase; Pages is being asked to host checkout or account data.

**Roadmap implication:** Decide URL/deployment shape early and add an explicit architecture gate for any server-requiring capability.

## Moderate Pitfalls

### 8. Collecting more qualification data than the sales decision needs

**What goes wrong:** The short qualification form grows into a mini CRM, requesting exact addresses, property lists, tenant details, financial information, or lengthy narratives. Required fields exclude prospects who do not fit the assumed labels.

**Prevention:** Use role, organization (optional where appropriate), broad portfolio-size band, county/town-level location only if operationally necessary, onboarding timeframe, preferred contact route, and essential contact details. Explain why each field is needed, avoid tenant/property-level data, keep free text optional and bounded, and test wording with Kenyan landlords/managers. Decide whether email or phone is required based on the chosen follow-up path rather than requiring every channel.

**Warning signs:** staff cannot state how a field changes routing; the form asks for sensitive operational/financial details; users must invent an organization; exact location is collected but never used; completion drops sharply on mobile.

### 9. Encoding opaque or discriminatory lead qualification

**What goes wrong:** Portfolio size is treated as the sole definition of “qualified,” small landlords are rejected without explanation, organizations are favored by hidden logic, or inferred behavior outweighs explicit intent.

**Prevention:** Keep v1 qualification as sales triage, not automated eligibility. Use disclosed business categories, preserve a path for “not sure/other,” never infer protected or sensitive traits, and route low-score enquiries to helpful self-onboarding/product information instead of a dead end. Periodically compare accepted/rejected distributions and real sales outcomes.

**Warning signs:** hidden score controls whether a form is delivered; nobody can explain rejection; high brochure activity overrides unsuitable declared needs; broad location categories become exclusion proxies.

### 10. Creating two indistinguishable contact funnels

**What goes wrong:** General company enquiries and HAOO qualification submissions share subjects, recipients, success state, analytics names, or contact copy. HAOO prospects reach `info@zero-paperhub.com`, and general visitors enter a product-specific sales queue.

**Prevention:** Give HAOO its own form component/configuration, recipient, subject prefix, success state, privacy copy, analytics namespace, and direct contacts. Centralize contact constants and add tests that assert the two payloads cannot drift or swap recipients.

**Warning signs:** a single hardcoded FormSubmit action is reused; success always scrolls to `#contact`; mailbox rules cannot distinguish journeys; HAOO phone/email differs between brochure, page, and footer.

### 11. Letting success URLs create duplicate or fake success states

**What goes wrong:** Anyone can visit `?haoo=success`; reload/back navigation repeats analytics events; both general and HAOO forms consume the same query; a malformed URL loses the intended section.

**Prevention:** Treat the query only as user-facing acknowledgement, never delivery proof. Use a distinct parameter/path, display neutral copy (“Your form was submitted to the delivery service”), remove it with `replaceState`, fire at most one acknowledgement event per navigation, and test back/forward/reload/direct-link behavior.

**Warning signs:** success page is counted as a verified lead; query parameters remain in shared URLs; refresh adds conversions; general submissions show HAOO messaging.

### 12. Degrading performance and privacy with third-party runtime dependencies

**What goes wrong:** Analytics, Google Fonts, embedded PDF loading, and third-party form resources add latency and disclose visitor metadata. A script failure hides content or blocks CTAs.

**Prevention:** Keep core HTML and CTAs functional without analytics, lazy-load the PDF preview behind user intent or viewport proximity, self-host fonts where practical, use system fallbacks, set explicit dimensions to prevent layout shift, and test with scripts blocked and slow/offline networks.

**Warning signs:** blank HAOO content until a tracker loads; large PDF downloads automatically on mobile; consent/privacy claims omit Google Fonts/FormSubmit/analytics; tracker errors stop form initialization.

### 13. Overfitting the product page to the print brochure

**What goes wrong:** Dense print sections, tiny typography, unsupported marketing claims, or audience sprawl are copied directly. Primary buyers cannot find outcomes and next steps, and tenant/agent features distract from decision-maker messaging.

**Prevention:** Treat brochure text as factual source material, not layout or instruction. Build a web information hierarchy for landlords, property managers, and portfolio organizations; retain factual claims, avoid inventing guarantees or pricing, and route secondary roles informationally. Require content-owner approval for altered claims and exact contact details.

**Warning signs:** print page breaks/styles appear in React; unsupported “best,” “guaranteed,” compliance, financial, or M-Pesa claims appear; the first CTA arrives below several feature grids; page and PDF contradict one another.

## Minor Pitfalls

### 14. Brittle analytics event naming

**What goes wrong:** Labels depend on visible button copy or CSS selectors, so design edits silently split metrics.

**Prevention:** Centralize typed event names and allowlisted properties, version the measurement plan, and test emitted payloads rather than Tailwind classes or text.

### 15. Download telemetry that measures only one implementation path

**What goes wrong:** A programmatic `Blob` download is counted while ordinary PDF links, context-menu saves, browser viewer downloads, or failed requests are not.

**Prevention:** Define the metric as “download-link click,” use a real anchor with `download` where appropriate, preserve open/download alternatives, and do not label it a completed download.

### 16. Animation hiding product content

**What goes wrong:** The existing unconditional `IntersectionObserver` path leaves new product sections invisible in unsupported/test environments, and excessive reveal motion harms usability.

**Prevention:** Render content visible by default, progressively enhance observation, respect `prefers-reduced-motion`, and include the HAOO page in browser/accessibility checks.

### 17. Contact and brochure drift

**What goes wrong:** Phone, email, WhatsApp link, platform URL, claims, and copyright dates are duplicated across React, PDF, analytics labels, hidden form fields, and metadata.

**Prevention:** Centralize web constants, validate them in tests, and maintain a release checklist for facts that necessarily remain inside the original PDF.

## Phase-Specific Warnings

| Recommended phase topic | Likely pitfall | Required mitigation / exit criterion |
|---|---|---|
| 1. Privacy, measurement, and content contract | Building analytics before defining what metrics mean; person-level history join; unsupported brochure claims | Approved event dictionary and metric caveats; analytics/lead data-flow diagram; field-by-field purpose and retention; processor/transfer/ODPC assessment owner; explicit no-PII telemetry rules; approved web content inventory |
| 2. Product information architecture and deployment shape | Monolithic `App.tsx` edits regress the existing site; direct HAOO URLs 404; general and HAOO identities mix | Reusable product boundary and centralized HAOO constants; chosen static URL strategy tested for direct navigation/refresh/custom domain; responsive semantic story usable without PDF or scripts |
| 3. HAOO responsive page and brochure access | PDF becomes the page; mobile viewer failure; inaccessible embed; asset path or content drift | HTML carries equivalent core information; labelled preview/open/download fallbacks; deployed direct PDF URL; keyboard, screen-reader, zoom, iOS/Android, slow-network checks; content/contact consistency review |
| 4. Privacy-first aggregate analytics | PII/custom URLs leak; repeat visitors overstated; blockers/bots ignored; events drift | Typed allowlisted events/properties; no stable cross-day identifier unless separately approved; dashboard labels say views/clicks, not leads/signups; blocked-script behavior works; production event inspection shows no PII |
| 5. HAOO qualification and FormSubmit delivery | Excessive data; hidden scoring; wrong recipient; activation/spam/delivery failure; success redirect treated as proof | Minimal accessible form; transparent triage; HAOO-specific action/subject/success; honeypot and constraints; production recipient activated; uniquely tagged inbox + spam tests; recovery contacts and runbook; data-retention owner |
| 6. Assisted and self-onboarding handoffs | Clicks called conversions; app handoffs fail; UTM/referrer assumptions; PII in URLs | Canonical links with visible fallbacks; generic encoded WhatsApp message; click-only metric names; no PII/lead IDs; destination team verifies any allowlisted campaign parameters; explicit note that signup confirmation is deferred |
| 7. Automated coverage and launch verification | Lint/build used as integration proof; tests depend on live FormSubmit; production-only failures missed | Component tests for payloads, privacy allowlists, success normalization, mobile nav and fallbacks; browser tests mock external boundaries; deployed manual matrix verifies mail, analytics, links, PDF, 404/deep links, accessibility, mobile and rollback |
| Post-launch operations | Silent provider outage, spam spike, stale contacts/content, misleading reports | Named mailbox owner and response SLA; periodic synthetic test submission; spam and funnel reconciliation; analytics privacy audit; broken-link/PDF checks; threshold to adopt controlled delivery service or new hosting |

## Launch Verification Matrix

The current repository has no automated test framework, so this milestone should not ship on `lint`, `typecheck`, and `build` alone.

| Boundary | Pre-launch proof | Failure interpretation |
|---|---|---|
| Static build/deploy | `npm run lint`, `npm run typecheck`, `npm run build`; inspect `dist`; production custom-domain smoke test; direct HAOO and PDF URLs | A successful Vite build proves neither routes nor third-party delivery in production |
| General vs HAOO forms | Automated assertion of action, recipient identity, hidden fields, honeypot, names, constraints, distinct success state | A rendered form can still send to the wrong recipient |
| FormSubmit | Production activation; uniquely tagged valid submission; inbox and spam receipt; reply/autoresponse check if used; blocked-network recovery test | Success redirect proves provider navigation only; inbox receipt is the operational delivery check |
| Spam/abuse | Honeypot payload test, repeated submissions, boundary lengths, HTML-like free text, duplicate triage exercise | Client validation is not an abuse boundary; test without sending harmful payloads to real recipients |
| Analytics privacy | Inspect actual outbound requests and dashboard dimensions for every event; verify no form values, full sensitive URLs, visitor IDs, or free text; test tracker blocked | Absence from UI is not enough—inspect network payload and stored dashboard properties |
| Metric accuracy | Reconcile known test views/clicks/submit attempts/received messages; verify reload and bot-like repetition do not get labelled as people or leads | Differences are expected; document them instead of tuning labels to imply certainty |
| PDF | Preview, open, download, filename, MIME/path, mobile viewers, keyboard, screen reader, zoom, offline/slow behavior | Preview failure must leave open/download and HTML story available |
| WhatsApp/tel/mailto | Installed-app and no-app/chooser behavior where testable; generic message encoding; visible contact fallback; analytics does not delay handoff | Click is intent only, not a sent message/call/email |
| Self-onboarding | Production link, HTTPS, campaign allowlist if agreed, destination landing, mobile/desktop, no sensitive query values | Landing success is not account creation; registration needs destination-owned verification |
| Accessibility | Keyboard order, labels/errors/status, focus after navigation, contrast, 200–400% zoom, reduced motion, narrow viewport, screen reader smoke test | An accessible React shell does not make the embedded PDF viewer/document accessible |
| Operations | Named inbox owner, privacy/contact owner, incident fallback, rollback commit/deploy, periodic synthetic-test schedule | A funnel without monitoring can fail silently after launch |

## Research Flags for Roadmap

- **Legal/privacy review required:** Confirm lawful bases, notices, processor contracts/terms, retention, cross-border transfers, data-subject request handling, and ODPC registration applicability. This research identifies engineering risks; it is not a legal determination.
- **FormSubmit production validation required:** Official help documentation confirms activation, 30-day retention of unactivated submissions (excluding uploads), required `name` attributes, spam protections, and possible spam-folder delivery. It does not provide application-owned guarantees, so delivery importance may justify a controlled endpoint later.
- **Analytics vendor/configuration decision required:** “Privacy-first” is a configuration and governance outcome, not merely a vendor label. Select the exact service and verify its current data processing, visitor-counting, event-property, retention, and cross-border terms before coding.
- **Destination coordination required:** Completed HAOO registration attribution cannot be solved solely on `zero-paperhub.com`. The HAOO application owner must accept and report campaign context or later provide an aggregated/callback integration.
- **PDF accessibility audit required:** The supplied original PDF must be inspected rather than assumed accessible. Regardless of result, keep semantic HTML as the primary experience.
- **Hosting suitability review required:** GitHub Pages supports the current static marketing surface but no server-side actions or secrets. Review its current terms and operational limits as the site becomes more directly commercial; never move sensitive transactions onto Pages.

## Sources

Primary sources were preferred. Confidence is **MEDIUM** because web search was the retrieval provider, while critical claims were cross-checked across official documentation and current project evidence.

- [FormSubmit Help](https://formsubmit.co/help) — activation, 30-day retention for pending submissions, required `name` attributes, spam protection, and spam-folder troubleshooting.
- [FormSubmit Privacy Policy / Terms](https://formsubmit.co/privacy.pdf) — external processor privacy/terms context; must be reviewed by the project owner before production use.
- [Kenya ODPC: Data Protection Laws](https://www.odpc.go.ke/data-protection-laws-kenya/) — official Act and Regulations index.
- [Kenya ODPC: Rights of a Data Subject](https://www.odpc.go.ke/rights-of-a-data-subject/) — transparency, objection, retention, and cross-border safeguard principles.
- [Kenya Data Protection (General) Regulations, 2021](https://www.odpc.go.ke/wp-content/uploads/2024/03/THE-DATA-PROTECTION-GENERAL-REGULATIONS-2021-1.pdf) — direct-marketing notification, consent, opt-out, identity, and commercial-use rules.
- [Kenya ODPC Guidance Note on Consent](https://www.odpc.go.ke/wp-content/uploads/2025/09/Guidance-note-on-Consent.pdf) — transparency, purpose limitation, minimisation, storage limitation, security, and accountability guidance.
- [Kenya ODPC FAQs](https://www.odpc.go.ke/faqs/) — registration guidance and relevant processing categories, including property management and direct marketing.
- [GitHub Docs: Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) — static publishing and lack of server-side language support.
- [GitHub Docs: GitHub Pages limits](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/github-pages-limits) — usage limits and hosting-purpose restrictions.
- [MDN: Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy) — default cross-origin referrer behavior and privacy tradeoffs.
- [MDN: `Navigator.sendBeacon()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) — navigation-time analytics and mobile lifecycle limitations.
- [W3C WAI: Mobile Accessibility](https://www.w3.org/WAI/standards-guidelines/mobile/) — WCAG applicability to mobile contexts.
- [W3C WAI: Accessibility Principles](https://www.w3.org/WAI/fundamentals/accessibility-principles/) — semantic structure, labels, alternatives, and adaptable content.
- [Plausible Documentation](https://plausible.io/docs) — privacy-first aggregate goals, outbound links, downloads, form events, and funnel capabilities used here as an example of the measurement category, not a final vendor decision.
- [Plausible: Outbound link tracking](https://plausible.io/docs/outbound-link-click-tracking) — precisely measures link clicks, not destination completion.
- [Plausible: Custom event tracking](https://plausible.io/docs/custom-event-goals) — event properties and risk of storing full link destinations.
- [Plausible: Events API](https://plausible.io/docs/events-api) — unique-visitor modelling inputs and UTM extraction, demonstrating why “anonymous aggregate” does not mean exact person-level truth.
- Project evidence: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md`, and `.planning/codebase/INTEGRATIONS.md` (2026-08-29).

---
*Roadmap rule: measure only what the current boundary can prove, disclose every personal-data flow, and preserve a direct recovery path when a third-party or app handoff fails.*
