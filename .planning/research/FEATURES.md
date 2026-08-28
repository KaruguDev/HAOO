# Feature Landscape

**Domain:** Privacy-first B2B product-marketing, lead-qualification, email-delivery, and onboarding funnel for a static company website
**Project:** ZERO-PAPER HUB — HAOO product launch
**Researched:** 2026-08-29
**Overall confidence:** MEDIUM-HIGH — product facts are grounded in the supplied brochure and project brief; accessibility, privacy, attribution, and delivery findings are grounded in current primary sources. Funnel prioritization is an evidence-informed product recommendation rather than a measured HAOO baseline.

## Product Story to Preserve

The web journey should preserve the brochure's factual story while changing its presentation model:

- HAOO is a Kenya-focused, connected property-management platform for landlords, property managers, agents, and tenants.
- The purchasing journey should prioritize landlords, property managers, and organizations with property portfolios; tenants and agents remain important informational audiences, not separate v1 conversion funnels.
- The core promise is one shared view replacing spreadsheets, paper trails, and scattered message threads.
- Supported brochure capability groups are rent and payments (including M-Pesa workflows), properties and units, leases and screening, maintenance, vacancy listings and applications, reporting, and communication.
- The onboarding story is: add properties and units, bring in relevant people, then manage day-to-day work in one place.
- Product contact identity is HAOO: `+254 702 188 044`, `info@haoo.online`, WhatsApp, and `manage.haoo.online`.
- Do not invent pricing, quantified outcomes, customer logos, testimonials, plan entitlements, or guarantees. Retain the brochure caveat that feature availability can vary by subscription plan.

## Table Stakes

Features users expect. Missing means the journey feels incomplete, untrustworthy, inaccessible, or impossible to measure.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Reusable Products discovery section | Visitors need a clear route from the company site to HAOO, and the portfolio must accommodate future products without another landing-page rewrite. | Medium | Use a data-driven product card/list model with name, concise promise, audience, image/logo, status, and destination. Launch with HAOO; do not fabricate empty product slots. |
| Stable HAOO destination and navigation | Campaign links, repeat visits, sharing, browser history, and future products require a durable product URL rather than only a transient modal or scroll position. | Medium | Provide direct-entry behavior and a clear path back to ZERO-PAPER HUB. Preserve company nav context while making HAOO visibly distinct. |
| Responsive web adaptation of the brochure | A print tri-fold is not usable as the primary mobile product experience. Visitors must be able to scan the value proposition and capabilities without zooming a PDF. | Medium | Recompose into semantic sections: hero, audience/problem, outcomes, capabilities, workflow, brochure, qualification, and onboarding. Do not reproduce the three fixed paper columns. |
| Clear audience and value proposition | Prospects must know immediately whether HAOO is relevant to their portfolio and what operational problem it solves. | Low | Lead with Kenya property decision-makers; retain tenant/agent benefits lower in the story. Keep copy factual and plain-language. |
| Scannable capability and workflow explanation | B2B visitors need enough product substance to decide whether to engage. | Medium | Present the six brochure capability groups plus the three-step onboarding story. Use responsive cards, meaningful headings, real text, and restrained imagery. |
| Honest product/portfolio relationship | Visitors need to understand that HAOO is a ZERO-PAPER HUB product while using HAOO's own contacts and platform. | Low | Use a consistent “HAOO by/in the ZERO-PAPER HUB portfolio” relationship without merging the two contact identities. |
| Clear CTA hierarchy | Prospects vary in readiness and should not have to hunt for a next step. | Low | Primary contextual CTA: “Discuss HAOO” or “Find your onboarding path.” Keep “Start with HAOO” and assisted contacts visible as alternatives; repeat CTAs after meaningful content sections. |
| Original brochure preview and download | The milestone explicitly preserves the supplied artifact, and some prospects will want a shareable/printable overview. | Medium | Offer an inline preview where supported, a visible “Open brochure” fallback, and a direct PDF download with file type/size. Preview failure must not block reading the web content. |
| Short qualification form | The team needs structured business context, not a generic message, to distinguish a prospect from general site traffic. | Medium | Collect name, email and/or phone, role, organization (allow “individual/none”), portfolio-size band, location, onboarding timing, preferred contact channel, and optional note. Use ranges/options instead of demanding exact unit counts. |
| Transparent required/optional fields | People should know why information is requested and be able to complete the form without unnecessary disclosure. | Low | Require only what HAOO needs to respond and route. Make organization conditional/optional for individual landlords. Do not require both phone and email unless operationally necessary. |
| Accessible validation and submission feedback | A form that silently fails or communicates errors only by color loses leads and fails basic accessibility expectations. | Medium | Use native input semantics, persistent labels, field-level text errors, an error summary, focus management, pending state, retryable failure state, and a clear success confirmation. Preserve user-entered values after recoverable failure. |
| HAOO-specific email delivery | Product enquiries must reach the correct team and be distinguishable in the inbox. | Medium | Deliver to the activated HAOO FormSubmit endpoint, set a descriptive subject, reply-to the prospect where available, use a readable field order, include source/context, and test first-use email activation before release. |
| Spam and abuse resistance | Public static forms attract automated submissions. | Medium | Keep FormSubmit's anti-bot protection unless accessibility testing shows a blocker; add a honeypot and conservative client-side rate/duplicate-submit protection. Treat client validation as UX, not security. |
| Assisted onboarding choices | High-consideration B2B prospects expect a human route, especially when migrating an existing portfolio. | Low | Provide semantic `tel:`, `mailto:`, and WhatsApp links using HAOO contacts. Explain what each channel does and likely next step; never hide them behind qualification. |
| Direct self-onboarding route | Ready prospects must be able to proceed immediately to the existing HAOO application. | Low | Link clearly to `https://manage.haoo.online`; label it as leaving the ZERO-PAPER HUB site. Record the outbound click before navigation without delaying or blocking navigation. |
| Mobile-first responsive behavior | Kenyan prospects commonly arrive from messaging/social links and may act by phone or WhatsApp. | Medium | Use readable content widths, responsive grids, non-overlapping sticky/floating elements, large tap targets, and test common narrow widths plus landscape and zoom. Phone/WhatsApp actions should be especially easy on mobile. |
| WCAG 2.2 AA baseline | Product discovery, documents, forms, and contact choices must work with keyboard, screen reader, magnification, reduced motion, and touch. | High | Semantic landmarks/headings, skip navigation, keyboard access, visible unobscured focus, sufficient contrast, useful alt text, 24px-minimum target sizing/spacing (prefer ~44px for key CTAs), reduced-motion support, no focus traps, and logical DOM order. |
| Privacy notice at collection points | The qualification form and persistent engagement measurement process personal or potentially identifiable context and use a third-party form processor. | Medium | Before collection, explain purposes, fields, recipients/processors, contact, voluntariness, retention approach, rights, and any cross-border safeguards. Link the full notice beside the form and tracking choice. |
| Privacy-first analytics choice | Measuring repeat visits requires persistence; setting it silently would conflict with the stated privacy-first promise. | High | Default to non-identifying/no-persistent measurement. Ask before creating a durable pseudonymous visitor identifier or storing campaign history. Provide an equally easy reject/withdraw control and keep the product usable either way. |
| Aggregate engagement event taxonomy | The success metric requires consistent measurement across the product journey. | Medium | At minimum record `product_view`, meaningful section/view-depth milestones, `brochure_preview`, `brochure_download`, `qualification_start`, `qualification_submit_success`, assisted-channel clicks by channel, and `self_onboarding_click`. Define each once and deduplicate noisy events. |
| Campaign attribution capture | Marketing links need source-level performance without ad surveillance. | Medium | Parse and normalize `utm_source`, `utm_medium`, `utm_campaign`, and optionally `utm_content`; preserve first-touch and latest-touch only with permitted storage. Also capture landing path/referrer at a coarse level. Never place contact data in URLs or analytics properties. |
| Attribution on conversion outputs | Aggregate dashboards alone do not tell the HAOO team which campaign produced an emailed prospect or self-onboarding click. | Medium | Include sanitized campaign fields and a concise engagement summary in the voluntary lead email. Record the self-onboarding outbound event with the same campaign dimensions. Treat client-provided context as directional, not verified evidence. |
| Repeat-visit signal with bounded retention | Return behavior can indicate product interest, but only if measured proportionately. | Medium | With permission, retain only a random pseudonymous ID, first/last visit dates, visit count, and coarse HAOO events for a documented short period. Do not create a cross-site profile or attempt identity resolution. |
| Resilient analytics behavior | Analytics must never block core content, form use, brochure access, or onboarding. | Medium | Queue briefly, fail silently for the visitor, honor browser/privacy choices where applicable, and ensure outbound links work if scripts, storage, or the analytics endpoint fail. |
| Product SEO and share metadata | Direct discovery and link sharing need an accurate page title, description, canonical URL, and preview. | Low | Use factual HAOO copy and appropriate social metadata. Do not index form success states or expose submitted fields in URLs. |

## Differentiators

Features that are not strictly required for a product page but materially improve HAOO's conversion quality and ZERO-PAPER HUB's future product platform.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Intent-enriched voluntary enquiry | The team receives both explicit qualification answers and a compact summary of the HAOO content the visitor chose to engage with. | Medium | On submit, disclose and attach permitted context such as visit count band, brochure interaction, CTA history, and campaign—not a raw clickstream. Snapshot the context at submission; do not retroactively identify prior behavior without the promised permission. |
| Readiness-sensitive next-step recommendation | Form answers can make the success state useful immediately instead of merely saying “thanks.” | Medium | Recommend assisted onboarding for complex/larger/urgent portfolios and show self-onboarding for ready prospects, but keep both choices available. This is routing, not opaque lead rejection or automated eligibility. |
| Equal assisted and self-service paths | HAOO can convert visitors who want reassurance and those ready to act now, without forcing either group through the other's funnel. | Low | Present side by side in the final decision area and after successful qualification. Preserve direct channels elsewhere on the page. |
| Kenya-native story | Familiar M-Pesa workflows and Kenyan property-management context make the product feel locally relevant without unsupported performance claims. | Low | Preserve brochure wording; avoid implying endorsements, universal integrations, or feature availability beyond what the source states. |
| Web-first brochure with source-artifact fidelity | Visitors get an accessible, responsive product narrative while sales teams retain the canonical downloadable PDF. | Medium | Establish a small content map so each claim on the web can be traced to the brochure; update both intentionally when product facts change. |
| Privacy-visible measurement | A concise explanation of what is measured—and what is deliberately not measured—can turn privacy from a compliance footer into trust evidence. | Medium | State that measurement is aggregate/pseudonymous, no advertising pixels or cross-site profiling are used, and identity is associated only after voluntary submission under the disclosed rules. |
| Consented return-visitor continuity | Returning prospects can resume the HAOO story and see a relevant CTA without being covertly profiled. | Medium | A subtle “Welcome back”/resume affordance may use local permitted state. Do not expose sensitive inferences on shared devices. Keep personalization coarse. |
| Channel-aware assisted contact | A WhatsApp/call/email handoff can carry a concise, user-visible starter message so the HAOO team understands the request immediately. | Medium | Prefill only non-sensitive context the visitor can review. Never silently embed hidden identifiers or form answers in a WhatsApp URL. |
| Reusable conversion contract for future products | A common product schema, event vocabulary, brochure treatment, contact routing, and CTA slots reduce the cost of launching the next product. | High | Generalize stable concepts, not HAOO-specific form questions. Product-specific capabilities, qualification fields, and contacts remain configurable. |
| Conversion confidence without lead scoring theatre | A small, interpretable intent summary is more actionable for email-only v1 than a fake numerical “lead score.” | Low | Use human-readable signals such as “returning visitor; downloaded brochure; timing: this month.” Avoid claiming predictive accuracy without outcome data. |

## Anti-Features

Features to explicitly not build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| PDF-only HAOO experience | Fixed print panels are difficult on mobile, weak for search/discovery, and less accessible. | Build semantic responsive content and retain PDF preview/download as a secondary artifact. |
| Literal tri-fold HTML reuse | The source has fixed A4 dimensions, overflow clipping, print typography, and panel order designed for folding. | Adapt its facts and visual motifs into the existing responsive design system. |
| Advertising pixels, remarketing tags, browser fingerprinting, or cross-site IDs | Conflicts with the explicit privacy-first decision and creates disproportionate trust/compliance risk. | Use first-party/coarsened aggregate events and permissioned pseudonymous continuity only. |
| Consent wall or pre-ticked analytics choice | Consent is not meaningfully voluntary if rejection blocks the product or requires more effort. | Make “accept” and “decline” clear, persist the choice, allow withdrawal, and keep the full funnel functional without persistent analytics. |
| Personal data in analytics events, URLs, or referrers | Names, email, phone, organization, notes, and exact locations can leak into logs and downstream systems. | Keep identity in the disclosed form submission; use coarse event fields and sanitized campaign values. |
| Raw behavioral dossier attached to email | A detailed clickstream is hard to interpret and violates data-minimization intent. | Attach a compact disclosed summary of a few high-value signals. |
| Opaque automated lead scoring or auto-rejection | There is no historical outcome data to validate a model, and smaller landlords could be wrongly excluded. | Use explicit qualification answers and interpretable context for human follow-up; show both onboarding paths. |
| Qualification gate before brochure, contacts, or self-onboarding | Forced lead capture adds friction and contradicts product-led discovery. | Keep learning assets and onboarding routes open; qualification is a valuable optional assisted path. |
| CRM, searchable lead database, or sales dashboard | Explicitly out of scope; would add authentication, retention, security, and operational ownership beyond email-only v1. | Deliver structured emails and revisit storage only after ownership and provider decisions. |
| FormSubmit archive as a lead database | Its documentation says submissions are retained for 30 days, but that is not a deliberate internal system of record. | Treat email as v1 delivery, disclose the processor, and establish an operational mailbox workflow. |
| Unverified “instant delivery” or guaranteed email success | Third-party form submission and mail delivery can fail or be filtered. | Show accurate submission success/failure, provide retry and direct contact alternatives, and test production delivery. |
| Large file uploads or document collection | Not required for qualification and increases personal-data/security exposure. | Ask a short optional note; collect documents later through an approved assisted process if needed. |
| Pricing, checkout, discount campaigns, or plan comparison | Commercial packaging is undefined and brochure claims vary by plan. | Use “contact HAOO” and self-onboard links; retain the plan-availability caveat. |
| Testimonials, adoption counts, ROI numbers, or customer logos without evidence | Unsupported trust signals damage credibility and source fidelity. | Use concrete brochure-backed capabilities and workflow explanations. |
| Separate tenant/agent conversion funnels | They dilute the milestone's decision-maker focus and expand content/measurement scope. | Keep role benefits informational and prioritize portfolio decision-makers in CTAs and qualification. |
| Building HAOO account creation inside this site | Duplicates the application and creates authentication/security complexity on a static marketing site. | Deep-link to `manage.haoo.online` and measure the outbound handoff. |
| Aggressive modal, countdown, chat takeover, or repeated sticky prompts | Interrupts reading, harms mobile/accessibility, and feels inconsistent with privacy-first trust. | Use inline CTAs at natural decision points and one unobtrusive mobile contact treatment. |
| Long all-fields-required qualification questionnaire | High effort and unnecessary collection increase abandonment. | Use progressive disclosure, bands/selects, conditional fields, and optional detail. |
| Email drip automation or marketing opt-in bundled with the enquiry | A request for HAOO contact is not automatically consent to unrelated campaigns. | Send a transactional acknowledgement if desired; ask separately and explicitly for future marketing only when that program exists. |

## Feature Dependencies

```text
Canonical brochure facts + HAOO brand/contact inventory
  -> responsive HAOO information architecture
  -> accessible product page
  -> contextual CTAs and brochure interactions

Reusable Products model
  -> Products discovery section
  -> stable HAOO destination
  -> future product launches

Privacy/data-flow inventory
  -> concise notice and tracking choice
  -> permitted pseudonymous visitor state
  -> repeat-visit and first/latest campaign context

Event taxonomy + campaign normalization
  -> aggregate engagement collection
  -> assisted-channel and self-onboarding attribution
  -> permitted engagement summary on voluntary qualification submission

Accessible qualification schema
  -> client validation and pending/error/success UX
  -> FormSubmit HAOO endpoint mapping and spam controls
  -> structured HAOO lead email
  -> readiness-sensitive success guidance

Production endpoint activation + delivery tests
  -> reliable launch of HAOO enquiry path

Responsive page + original PDF asset
  -> preview component
  -> open/download fallbacks
  -> brochure interaction measurement
```

## MVP Recommendation

Prioritize the milestone as four dependency-aware slices:

1. **Discover and understand HAOO**
   - Reusable Products section and durable HAOO destination.
   - Responsive, semantic brochure adaptation using only verified product claims.
   - Clear audience, capability, workflow, product ownership, and CTA hierarchy.
   - Mobile behavior, WCAG 2.2 AA foundations, SEO/share metadata.

2. **Inspect collateral and choose an onboarding path**
   - Original PDF preview, open, and download with robust fallbacks.
   - Always-visible phone, WhatsApp, email, and direct self-onboarding routes.
   - Honest explanation of assisted versus self-service next steps.

3. **Qualify and deliver an enquiry**
   - Short, accessible qualification form with portfolio bands and timing.
   - Privacy notice at collection; HAOO-specific FormSubmit delivery, spam controls, activation, and production tests.
   - Clear pending, success, failure, retry, and alternative-contact experiences.
   - Readiness-sensitive success state that still exposes both onboarding paths.

4. **Measure without surveillance**
   - Defined aggregate event taxonomy and normalized campaign parameters.
   - Privacy choice before durable pseudonymous/repeat-visit state.
   - Coarse permitted engagement summary added to voluntary lead emails.
   - Attributable assisted-contact and self-onboarding clicks with non-blocking failure behavior.

Although measurement is listed fourth for rollout, its event names, consent rules, and data contract must be designed before instrumenting slices 1–3. Instrument only stable interactions after the product and form flows work without analytics.

### Defer

- **CRM/searchable lead store:** no provider or retention/ownership model exists.
- **Predictive scoring and automation:** no conversion outcomes exist to validate it.
- **Pricing/checkout:** packaging remains undefined.
- **Tenant and agent funnels:** not the v1 acquisition audience.
- **Rich personalization:** coarse return continuity is enough until consent rates and usage justify more.
- **A/B testing platform:** first establish baseline traffic and conversion definitions; avoid multiplying data collection before volume warrants it.
- **Application changes or embedded signup:** the existing HAOO platform owns account onboarding.

## Acceptance Signals for Roadmap Planning

| Area | Minimum observable outcome |
|------|----------------------------|
| Product discovery | A visitor can reach the HAOO destination from Products and by a direct URL, then return to company context. |
| Responsive adaptation | At narrow mobile, desktop, 200% zoom, keyboard-only, and reduced-motion settings, the product story remains readable and operable. |
| Brochure | Preview failure still leaves working open/download actions; the downloaded asset is the supplied canonical PDF. |
| Qualification | Valid submissions arrive at the activated HAOO mailbox with readable answers and disclosed, sanitized attribution/context; errors retain input and offer retry/direct contact. |
| Privacy | Declining persistent analytics does not reduce core functionality; changing the choice is possible; no contact data is sent as analytics. |
| Engagement | Defined events fire once per intended interaction, use bounded/coarse properties, and analytics failure does not block navigation. |
| Assisted onboarding | Call, WhatsApp, and email links use canonical HAOO contacts and are reachable without submitting the form. |
| Self-onboarding | `manage.haoo.online` opens successfully and the click can be counted/attributed without adding personal data or delaying the handoff. |

## Sources

### Project and product sources (HIGH confidence)

- ZERO-PAPER HUB project brief: `.planning/PROJECT.md` (read 2026-08-29).
- Canonical HAOO brochure source: `/home/paul/Documents/Vibe Coding Projects/lipa_nyumba/marketing/haoo-brochure/brochure.html` (read 2026-08-29).
- Canonical HAOO brochure PDF: `/home/paul/Documents/Vibe Coding Projects/lipa_nyumba/marketing/haoo-brochure/HAOO-Marketing-Brochure.pdf` (content checked against the HTML on 2026-08-29).
- Brochure production notes: `/home/paul/Documents/Vibe Coding Projects/lipa_nyumba/marketing/haoo-brochure/README.md` (read 2026-08-29).

### External primary sources (MEDIUM confidence via verified web search)

- [Kenya Data Protection Act, 2019 — Kenya Law](https://new.kenyalaw.org/akn/ke/act/2019/24/eng@2022-12-31) — sections 25 and 29 ground lawfulness, fairness, transparency, purpose limitation, minimization, retention, transfer safeguards, and notice before collection.
- [Data Protection (General) Regulations, 2021 — Kenya Law](https://new.kenyalaw.org/akn/ke/act/ln/2021/263/eng@2022-12-31) — grounds privacy by design/default, legal basis, autonomy, understandable consent, and withdrawal.
- [WCAG 2.2 Quick Reference — W3C WAI](https://www.w3.org/WAI/WCAG22/quickref/) — current conformance criteria used for keyboard, focus, target sizing, consistent help, labels, and error handling.
- [WAI Forms Tutorial — W3C](https://www.w3.org/WAI/tutorials/forms/) and [User Notifications](https://www.w3.org/WAI/tutorials/forms/notifications/) — grounds short forms, semantic labels/grouping, validation, error summaries, focus, and success notification recommendations.
- [Collect campaign data with custom URLs — Google Analytics Help](https://support.google.com/analytics/answer/10917952?hl=en) — primary documentation for standard `utm_source`, `utm_medium`, `utm_campaign`, optional creative parameters, and consistent naming. The parameter convention is recommended; Google Analytics itself is not.
- [FormSubmit documentation](https://formsubmit.co/documentation) — confirms static email delivery, reply-to, custom success URL/subject, reCAPTCHA, honeypot, blacklist, autoresponse/AJAX trade-offs, and 30-day submission archive retention.

## Research Gaps and Validation Flags

- Confirm the chosen analytics provider, hosting location, retention controls, consent mode, and data-processing terms before implementation. The feature contract is provider-neutral.
- Confirm whether FormSubmit's current processing locations and terms meet ZERO-PAPER HUB's transfer/safeguard requirements; its public feature documentation alone is not a legal/vendor assessment.
- Confirm the precise operational definition of “qualified” with the HAOO team (for example, role, portfolio band, and timing). Do not encode thresholds until the team agrees how emails will be handled.
- Confirm whether `manage.haoo.online` accepts approved campaign parameters and whether they are needed; otherwise attribute the outbound click on ZERO-PAPER HUB only.
- Confirm brochure PDF accessibility expectations. The responsive HTML must carry the accessible product story even if the preserved print PDF is not fully tagged.
- Establish baseline event volume and inbox follow-up practice after launch before adding scoring, experiments, or automation.
