# Project Research Summary

**Project:** Zero-Paper Hub Product Launch Platform
**Domain:** Privacy-first static B2B product-marketing, lead-qualification, email-delivery, and onboarding funnel
**Researched:** 2026-08-29
**Confidence:** MEDIUM-HIGH

## Executive Summary

Zero-Paper Hub is evolving from a single-page company website into a reusable product-launch platform, beginning with HAOO. Experts would keep this milestone static and product-led: add a durable HAOO page, adapt the brochure into accessible responsive HTML, retain the original PDF as supplementary collateral, and offer qualification, assisted contact, and direct self-onboarding without gating the product story. The existing React 18, TypeScript 5.5, Vite 5.4, Tailwind 3.4, and GitHub Pages stack is sufficient; the smallest sound architecture is a Vite multi-page application with a physical `/products/haoo/` entry and clear page, feature, and service boundaries.

The recommended funnel separates three concerns. Plausible records only coarse aggregate events through a typed allowlist; a guarded first-party engagement store keeps bounded counts, flags, and date bands without a visitor ID; and FormSubmit receives contact and qualification data plus a disclosed human-readable engagement summary only after voluntary submission. HAOO phone, WhatsApp, email, and `manage.haoo.online` remain normal links that work when analytics or storage is blocked. This produces useful directional attribution without creating a person-level analytics join, database, CRM, server runtime, or client-side secret.

The principal risks are misleading conversion claims, privacy drift, silent FormSubmit failure, static deep-link failures, and treating the PDF as the product experience. Mitigate them by approving the content/privacy/measurement contract first, naming browser-observable events precisely as views, attempts, redirect returns, and clicks, generating and testing a real nested HTML entry, keeping semantic HTML primary, activating and verifying the HAOO mailbox in production, and shipping only after accessibility, payload, route, PDF, handoff, analytics, and inbox checks pass. Completed onboarding and confirmed lead delivery remain destination- or operations-owned outcomes, not facts the static browser can prove.

## Key Findings

### Recommended Stack

Preserve the locked frontend and deployment stack. Add no router, backend, database, form framework, PDF renderer, tag manager, or second UI system for v1. Use small first-party TypeScript modules to enforce provider boundaries, with all analytics and storage failures degrading to a functional unmeasured funnel. Detailed evidence and alternatives are in [STACK.md](./STACK.md).

**Core technologies:**

- React / React DOM `18.3.x`: Render the company catalog, HAOO page, form states, and CTA components without an unrelated framework upgrade.
- TypeScript `5.5.x`: Define closed event/property unions, qualification inputs, product metadata, and bounded lead-context serialization.
- Vite `5.4.x` multi-page input: Produce real `/index.html` and `/products/haoo/index.html` files that survive direct navigation and refresh on GitHub Pages.
- Tailwind CSS `3.4.x` and existing `lucide-react`: Extend the established responsive visual language without a parallel component system.
- GitHub Pages and the existing Node 22 Actions build: Continue static delivery of both HTML entries and brochure assets; keep secrets and server actions outside the bundle.
- Plausible Cloud's current account-generated snippet: Collect aggregate, cookie-free page and funnel events through a provider-neutral adapter; use the exact configured-domain snippet rather than legacy tracker URLs.
- FormSubmit's current native HTML contract: Deliver HAOO-specific qualification emails without a backend, subject to recipient activation, documented retention, spam controls, and production inbox verification.
- Browser `localStorage` plus native HTML/PDF/link capabilities: Store only versioned bounded engagement state, and implement preview/download/contact handoffs without heavy dependencies. Storage access must be guarded and optional.

**Critical compatibility requirements:** Preserve the existing package major lines and lockfile; configure explicit nested Vite HTML inputs; ensure Tailwind scans the new entry/features; use either the current Plausible snippet or its official ESM package, never both; and never put secrets in `VITE_*` values. FormSubmit recipient activation and Plausible account/plan configuration are operational prerequisites, not npm dependencies.

### Expected Features

The launch must first make HAOO understandable and actionable, then enrich voluntary enquiries and aggregate reporting. It should optimize for Kenyan landlords, property managers, and portfolio-owning organizations while keeping tenant and agent benefits informational. Full prioritization is in [FEATURES.md](./FEATURES.md).

**Must have (table stakes):**

- Reusable Products discovery and a stable HAOO destination with a clear path back to the company site.
- Responsive, semantic, brochure-backed product story covering audience, value, capabilities, workflow, product ownership, and factual Kenya/M-Pesa context.
- Original PDF preview, open, and download choices with visible fallbacks; the PDF must not be the primary experience.
- Clear CTA hierarchy with always-available HAOO phone, WhatsApp, email, and direct self-onboarding links.
- A short accessible qualification form using minimal contact data, controlled role/portfolio/location/timing fields, transparent required/optional status, and recoverable validation/submission states.
- HAOO-specific FormSubmit recipient, subject, success handling, honeypot/spam controls, activation, and real inbox/spam-folder verification.
- WCAG 2.2 AA and mobile-first behavior across navigation, product content, brochure controls, form states, focus, zoom, touch, and reduced motion.
- Privacy notice and a defined aggregate event taxonomy whose failure never blocks content, form submission, downloads, or outbound navigation.
- Directional campaign/engagement context and repeat-visit bands without PII, raw clickstreams, cross-site identifiers, or claims of downstream completion.
- Page-specific SEO/share metadata and stable canonical product/brochure URLs.

**Should have (competitive):**

- Intent-enriched voluntary enquiries expressed as a compact, disclosed, human-readable summary rather than a numerical or opaque lead score.
- Readiness-sensitive next-step guidance that recommends but never hides either assisted or self-service onboarding.
- Equal assisted and self-service paths, Kenya-native positioning, and user-visible generic starter text for assisted handoffs.
- Privacy-visible measurement that explicitly says what is and is not collected.
- A reusable product/conversion contract for future catalog entries while keeping HAOO-specific content, contacts, and questions configurable.
- Coarse return-visitor continuity only if the approved privacy design permits it; no stable or random visitor identifier in v1.

**Defer (v2+):**

- CRM, searchable lead storage, internal dashboard, Supabase persistence, and automated sales pipelines.
- Predictive scoring, auto-rejection, A/B testing, rich personalization, advertising pixels, remarketing, fingerprinting, or cross-site profiles.
- Pricing, checkout, plan comparisons, tenant/agent acquisition funnels, embedded HAOO signup, or changes to the HAOO application.
- Serverless mail delivery until FormSubmit's delivery, retention, abuse, or observability limits create a demonstrated need.
- Destination-confirmed registration attribution until `manage.haoo.online` owns an aggregate report, allowlisted campaign contract, or callback integration.

### Architecture Approach

Evolve the single-entry site into a small static multi-page React application. `HomePage` and `HaooProductPage` compose shared layout/UI; `features/products` owns typed catalog discovery; `features/haoo` owns brochure-derived content, onboarding, and qualification; and `services` isolates analytics, engagement storage, and FormSubmit contracts. Components emit typed callbacks and never import providers directly. Aggregate telemetry and personally submitted lead delivery remain deliberately separate, while a pure projection turns bounded local context into disclosed hidden form fields at submit time. See [ARCHITECTURE.md](./ARCHITECTURE.md).

**Major components:**

1. Static entries and pages — Build `/` and `/products/haoo/` as physical HTML outputs with page-specific metadata and reliable direct loads.
2. Shared shell and UI primitives — Extract header, footer, navigation, motion/in-view behavior, buttons, headings, and status notices without regressing the existing site.
3. Reusable product catalog — Store stable product metadata and render the home-page Products section data-first for HAOO and future products.
4. HAOO product feature — Own factual content, responsive sections, optimized imagery, lazy brochure preview, onboarding choices, and accessible qualification UI.
5. Analytics service — Expose a provider-neutral typed interface with no-op and Plausible adapters, runtime property allowlists, and best-effort non-blocking delivery.
6. Engagement service — Guard versioned storage of capped visits, date bands, and interaction flags; expose no random ID, exact timestamp trail, contact draft, or cross-device identity.
7. Lead-delivery service — Own FormSubmit action/control fields, HAOO recipient identity, coarse lead-context projection, truthful redirect-return handling, and production verification contract.

**Key patterns:** Progressive enhancement; closed event/property vocabularies; content/config centralization; pure deterministic qualification/triage functions; native HTML form and link behavior; lazy PDF loading with HTML fallback; and boundary-focused tests rather than whole-page snapshots.

### Critical Pitfalls

The full risk register and verification matrix are in [PITFALLS.md](./PITFALLS.md).

1. **Calling observable browser actions “leads” or “onboarding”** — Define metric semantics before instrumentation. Report views, link clicks, submit attempts, and redirect returns literally; reserve delivery and registration for inbox/provider and HAOO-application evidence.
2. **Turning privacy-first measurement into covert person-level tracking** — Never join analytics to a lead through an ID. Keep PII and exact/free-text values out of events, URLs, referrers, storage, and campaign properties; disclose the bounded summary attached at voluntary submission.
3. **Treating FormSubmit like an owned lead pipeline** — Activate the HAOO endpoint, verify uniquely tagged messages in inbox and spam, retain direct recovery channels, name an operational owner, and establish a threshold for replacing it with a controlled endpoint.
4. **Shipping the PDF as the product page** — Make responsive semantic HTML canonical; lazy-load preview and always provide explicit open/download fallbacks, stable deployed paths, and cross-device/accessibility checks.
5. **Crossing the static-hosting boundary** — Treat every bundled value as public, build real nested HTML output, and do not add secrets, server-only validation, durable retries, or Supabase merely because local development resembles a server.
6. **Allowing spam, overcollection, or opaque scoring to corrupt qualification** — Use minimal controlled fields and transparent human triage; keep client checks as UX rather than security and never reject access or onboarding based on a hidden score.
7. **Assuming outbound links preserve attribution or prove completion** — Track clicks without delaying navigation, use visible fallbacks and generic messages, and require destination coordination before passing allowlisted campaign parameters or claiming signup outcomes.

## Implications for Roadmap

Based on research, use six dependency-aware phases. Phase 1 defines contracts consumed by all later work; Phases 2–3 establish the stable unmeasured experience; Phases 4–5 layer aggregate and personal-data boundaries separately; Phase 6 proves the complete deployed funnel.

### Phase 1: Content, Privacy, and Measurement Contract

**Rationale:** Content fidelity, event semantics, qualification fields, processing purposes, and metric truth claims constrain every UI and integration decision. Resolving them first prevents later privacy and reporting rewrites.
**Delivers:** Approved brochure-to-web content inventory; centralized HAOO facts/contacts; event dictionary and metric caveats; analytics-versus-lead data-flow diagram; local-state schema/expiry decision; field-by-field purpose and retention notes; qualification bands/triage rules; and named legal/privacy, mailbox, and destination owners.
**Addresses:** Factual Kenya-native story, privacy notice, aggregate taxonomy, campaign normalization, minimal qualification schema, and reusable product/conversion vocabulary.
**Avoids:** Unsupported claims, covert analytics-to-lead joins, overcollection, opaque rejection, misleading “lead/onboarding” labels, and contact drift.

### Phase 2: Static Product Platform Foundation

**Rationale:** Deep-link delivery and shared component boundaries are architectural prerequisites; proving them before content work prevents a larger `App.tsx` monolith and GitHub Pages 404 surprises.
**Delivers:** Explicit Vite multi-page inputs; `/products/haoo/index.html`; page-specific metadata; extracted shared shell, accessible mobile navigation, and progressive motion primitives; typed product catalog; home-page Products section; centralized site/HAOO configuration; and build assertions for both entries.
**Addresses:** Reusable Products discovery, stable HAOO destination, portfolio relationship, SEO/share metadata, and future-product extensibility.
**Uses:** Existing React/TypeScript/Vite/Tailwind/GitHub Pages stack with no router.
**Avoids:** Static deep-link failures, general/HAOO identity mixing, monolithic page composition, hidden content when observers fail, and unnecessary framework migration.

### Phase 3: Accessible HAOO Story, Brochure, and Open Handoffs

**Rationale:** Visitors need a complete, mobile, no-analytics product journey before measurement or qualification is layered on. Stable interaction points also make later instrumentation reliable.
**Delivers:** Responsive brochure-derived hero, audience, capabilities, workflow, and CTA sections; optimized web imagery; unchanged canonical PDF asset; lazy preview plus open/download fallbacks; direct HAOO phone/WhatsApp/email links; direct `manage.haoo.online` handoff; and accessibility/performance coverage for these elements.
**Addresses:** Product understanding, scannable capabilities, original collateral, clear CTA hierarchy, equal assisted/self-service routes, mobile-first behavior, and WCAG foundations.
**Avoids:** PDF-only delivery, literal tri-fold reuse, auto-loading large third-party assets, inaccessible embeds, gated contacts, unsupported marketing claims, and attribution-dependent navigation.

### Phase 4: Privacy-First Engagement Measurement

**Rationale:** Instrument only stable UI, but implement measurement before lead enrichment so the engagement projection is derived from an approved and tested schema rather than ad hoc browser history.
**Delivers:** Provider-neutral analytics interface; no-op and configured Plausible adapters; typed/runtime allowlists; guarded bounded engagement storage with no visitor ID; sanitized campaign handling; privacy choice/disclosure; coarse lead-context projection; event-deduplication tests; and blocked-script/storage fallbacks.
**Addresses:** Product, brochure, qualification-start, assisted-click, and self-onboarding-click signals; bounded new/returning or visit-band context; privacy-visible measurement; and directional attribution.
**Avoids:** PII or identifiers in telemetry, raw clickstreams, silent persistent profiling, brittle labels, duplicate events, exaggerated unique-person claims, and analytics that blocks CTAs.

### Phase 5: Qualification and HAOO Email Delivery

**Rationale:** Personal data should enter only after content and aggregate measurement boundaries are stable. Delivery needs its own operational work because a form component or redirect cannot prove mailbox receipt.
**Delivers:** Short accessible HAOO qualification form; transparent deterministic triage; named hidden snapshot fields; HAOO-specific FormSubmit action/subject/success path; honeypot and constraints; pending/error/retry/success UX; readiness-sensitive guidance with both onboarding routes; activated production recipient; inbox/spam/autoresponse tests; and mailbox runbook.
**Addresses:** Structured prospect qualification, intent-enriched voluntary enquiry, HAOO email routing, spam resistance, truthful recovery, and useful post-submit onboarding choices.
**Avoids:** Wrong recipient, excessive data, hidden auto-rejection, client-side secrets, success redirect as delivery proof, inaccessible validation, spam counted as qualified demand, and silent provider outage.

### Phase 6: Deployed Funnel Verification and Operations

**Rationale:** Build/lint/typecheck cannot prove live routes, provider payloads, app handoffs, inbox delivery, accessibility, or privacy. A distinct release gate prevents production-only failures from masquerading as completed implementation.
**Delivers:** Unit/component accessibility tests for contracts and fallbacks; built-output inspection; direct URL/refresh/404 checks; production analytics network and dashboard inspection; production FormSubmit reconciliation; mobile/desktop/zoom/keyboard/screen-reader/reduced-motion checks; PDF and external-link matrix; rollback steps; synthetic-test cadence; and post-launch metric/mailbox reconciliation.
**Addresses:** All launch acceptance signals and operational ownership.
**Avoids:** Treating compilation as integration proof, PII visible only in real network payloads, stale contacts/assets, silent provider failure, app-specific handoff breakage, and misleading reports after launch.

### Phase Ordering Rationale

- The content/privacy/measurement contract is cross-cutting and must precede any implementation that could encode unsupported claims, personal-data flow, or misleading metrics.
- The physical URL and shared shell come before HAOO feature work because every product, metadata, asset, form-success, and campaign path depends on the deployed topology.
- The complete HTML story and open onboarding routes must work without analytics, storage, PDF preview, or form delivery; stable UI is then safe to instrument.
- Aggregate measurement and personally submitted lead delivery are separate phases to preserve the privacy boundary and keep failures independently testable.
- Production verification is explicit because external services and static hosting have failure modes that local component behavior cannot establish.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1:** Requires current Kenyan privacy/legal review for lawful basis, consent/notice wording, retention, processor contracts, cross-border safeguards, data-subject handling, and ODPC registration applicability. Engineering research is not a legal determination.
- **Phase 4:** Re-check the selected Plausible plan, exact current site-specific snippet, custom-property availability, retention/processing terms, and whether any persistent local state is approved before implementation.
- **Phase 5:** Validate current FormSubmit terms, 30-day archive behavior, processing locations, recipient activation, spam controls, and delivery behavior with the real production mailbox.
- **Phase 6:** Audit the supplied PDF's actual tags, reading order, language, and link accessibility; coordinate any allowlisted campaign parameters or completed-registration reporting with the HAOO application owner.

Phases with standard patterns (skip research-phase):

- **Phase 2:** Vite multi-page builds, React feature extraction, static metadata, and typed catalogs are well documented and repository evidence is strong.
- **Phase 3:** Responsive semantic React content, native links, lazy PDF enhancement, and WCAG-oriented controls use established patterns; execution still requires real-device verification.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Existing versions, repository constraints, and static build shape are directly verified. Plausible and FormSubmit recommendations rely on current official docs but still require configured-account and production validation. |
| Features | MEDIUM-HIGH | HAOO facts come from the supplied brochure/project brief; accessibility and privacy expectations use primary sources. Funnel prioritization and qualification thresholds lack product-specific outcome data. |
| Architecture | HIGH for local design; MEDIUM for integrations | Multi-page topology, component boundaries, and static constraints follow direct repository inspection and official platform docs. Provider behavior remains unproven until activation. |
| Pitfalls | MEDIUM-HIGH | Risks are cross-checked against the current codebase and primary documentation. Legal conclusions, provider operational guarantees, and destination attribution require owners outside the static site. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Privacy/legal determination:** Assign a qualified owner to approve lawful basis, notice/choice, retention, processors, transfers, rights handling, and ODPC applicability before persistent storage or production collection.
- **Repeat-visit policy conflict:** Research ranged from consented pseudonymous identity to no stable ID. Adopt the stricter v1 decision: bounded local counts/date bands with no UUID or analytics join; if this is not approved, fall back to same-session or aggregate provider metrics.
- **Analytics account and plan:** Confirm Plausible availability, snippet, enabled properties, data terms, and dashboard semantics. The no-op adapter must remain a valid launch mode if configuration is delayed.
- **Qualification definition:** HAOO sales must approve role, portfolio bands, timing, required contact channel, and interpretable triage. No band may block form delivery or onboarding access.
- **FormSubmit governance:** Confirm processing/retention acceptability, activate the opaque HAOO endpoint, name a mailbox owner and SLA, and define the threshold for a controlled serverless relay.
- **Destination attribution:** Confirm whether `manage.haoo.online` accepts an approved campaign allowlist. Until destination-owned reporting exists, publish only outbound-click counts.
- **PDF accessibility:** Audit the original file. Keep responsive HTML as the accessible equivalent whether or not remediation is feasible.
- **Hosting suitability:** Review current GitHub Pages terms/limits as the surface becomes more commercial; move server actions, secrets, checkout, authentication, and sensitive transactions elsewhere.
- **Baseline and operations:** Establish real event volume, accepted-lead criteria, inbox reconciliation, spam rate, and follow-up practice before experiments, scoring, automation, or CRM work.

## Sources

### Primary (HIGH confidence)

- `.planning/PROJECT.md` and repository/codebase evidence — product scope, constraints, current stack, integrations, deployment, testing gaps, and architecture.
- Supplied HAOO brochure HTML, PDF, and production notes — canonical product facts, contacts, capabilities, workflow, and source-fidelity boundary.
- [Vite build guide](https://vite.dev/guide/build.html#multi-page-app) and [static deployment guide](https://vite.dev/guide/static-deploy.html) — multi-page inputs and GitHub Pages deployment.
- [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) — static-hosting boundary and custom domains.
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/), [WAI Forms Tutorial](https://www.w3.org/WAI/tutorials/forms/), and [WCAG techniques](https://www.w3.org/WAI/WCAG22/Techniques/) — accessibility and form behavior.
- [Kenya Data Protection Act, 2019](https://new.kenyalaw.org/akn/ke/act/2019/24/eng@2022-12-31), [Data Protection (General) Regulations, 2021](https://new.kenyalaw.org/akn/ke/act/ln/2021/263/eng@2022-12-31), and [ODPC data-protection resources](https://www.odpc.go.ke/data-protection-laws-kenya/) — privacy principles and legal-review context.
- [MDN `localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) and [Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy) — browser persistence/failure behavior and cross-origin attribution limits.

### Secondary (MEDIUM confidence pending configured-account verification)

- [Plausible documentation](https://plausible.io/docs), [tracking-script guide](https://plausible.io/docs/plausible-script), [custom events](https://plausible.io/docs/custom-event-goals), and [custom properties](https://plausible.io/docs/custom-props/introduction) — current tracker, aggregate events, property restrictions, and PII/identifier boundary.
- [FormSubmit documentation](https://formsubmit.co/documentation), [help](https://formsubmit.co/help), and [privacy/terms](https://formsubmit.co/privacy.pdf) — static POST contract, activation, spam controls, redirect/autoresponse behavior, archive retention, and external-processor caveats.

### Tertiary (LOW confidence / requires project validation)

- Funnel ordering, readiness guidance, qualification thresholds, and future escalation triggers — evidence-informed synthesis that must be validated against HAOO sales outcomes and operations after launch.

---
*Research completed: 2026-08-29*
*Ready for roadmap: yes*
