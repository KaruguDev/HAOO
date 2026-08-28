# ZERO-PAPER HUB Product Launch Platform

## What This Is

ZERO-PAPER HUB's existing marketing website is evolving into a product-led company site where visitors can discover individual digital products and take a clear next step. The first launch product is HAOO, a Kenya-focused property-management platform for landlords, property managers, and organizations managing property portfolios.

The initial milestone adds a Products section and a dedicated HAOO journey that adapts the supplied brochure for the web, distinguishes genuine prospects from general traffic, and gives qualified visitors immediate assisted- or self-onboarding options.

## Core Value

A serious HAOO prospect can understand the product, demonstrate intent, and reach the right onboarding path quickly without getting lost in general company traffic.

## Business Context

- **Customer**: Individual landlords, property managers, and organizations managing property portfolios in Kenya
- **Revenue model**: HAOO subscription plans; commercial packaging and pricing remain outside this website milestone
- **Success metric**: Qualified HAOO enquiries and attributable self-onboarding clicks from the product journey
- **Strategy notes**: HAOO is presented through its own contact identity while living within ZERO-PAPER HUB's product portfolio

## Requirements

### Validated

- ✓ Visitors can learn about ZERO-PAPER HUB through a responsive single-page marketing website — existing
- ✓ Visitors can explore company services, mission, values, and contact information through section navigation — existing
- ✓ Visitors can submit a general enquiry that is delivered by email through FormSubmit — existing
- ✓ Visitors can download company marketing material from the static website — existing
- ✓ The website builds and deploys as a static React/Vite application through GitHub Pages — existing

### Active

- [ ] Visitors can discover HAOO from a reusable Products section designed to accommodate future products
- [ ] Visitors can explore HAOO through a responsive product page based on the supplied brochure content
- [ ] Visitors can preview and download the original HAOO PDF brochure
- [ ] The site records privacy-first aggregate product engagement signals such as product views, brochure interactions, repeat visits, and onboarding clicks
- [ ] Interested visitors can submit a short HAOO qualification form containing contact details, role, organization, portfolio size, location, and onboarding timing
- [ ] A submitted prospect includes the visitor's relevant HAOO engagement context so the team can distinguish intent from general traffic
- [ ] Qualified enquiries are delivered to the HAOO email channel for v1
- [ ] Prospects can choose assisted onboarding through HAOO phone, WhatsApp, or email, or self-onboard at `manage.haoo.online`
- [ ] The HAOO journey is usable on mobile and desktop and fits the existing ZERO-PAPER HUB visual system

### Out of Scope

- Searchable lead database or internal lead-management dashboard — deferred until a leads list is intentionally introduced
- CRM integration and automated sales pipelines — deferred until a CRM provider is selected
- Advertising pixels, cross-site profiling, or invasive marketing analytics — conflicts with the privacy-first v1 decision
- Building or changing the HAOO property-management application — this milestone covers product marketing and routing to the existing platform
- HAOO subscription pricing or checkout on the ZERO-PAPER HUB website — commercial packaging is not yet defined
- Separate conversion funnels for tenants and agents — v1 prioritizes property decision-makers

## Context

- The current site is a client-rendered React 18 and TypeScript application built with Vite and styled with Tailwind utilities. The entire landing page currently lives in `src/App.tsx`.
- The site is statically hosted and has no server runtime, API layer, active database, authentication, or application router.
- General enquiries currently post to FormSubmit and reach `info@zero-paperhub.com`; HAOO enquiries must instead use HAOO's contact identity.
- Canonical HAOO source material is the supplied brochure HTML and PDF at `/home/paul/Documents/Vibe Coding Projects/lipa_nyumba/marketing/haoo-brochure/`.
- The brochure describes HAOO as a connected property-management platform for landlords, managers, agents, and tenants, with rent and M-Pesa workflows, properties and units, leases and screening, maintenance, vacancy listings, reporting, and communication.
- The brochure's print-oriented HTML is source material, not a drop-in responsive web page. Its product story should be adapted to the existing site while preserving the original PDF for preview and download.
- HAOO contact channels are `+254 702 188 044`, `info@haoo.online`, WhatsApp, and `manage.haoo.online`.
- Anonymous product behavior remains aggregate or pseudonymous. A visitor's interaction history becomes associated with contact information only when they voluntarily submit the qualification form.

## Constraints

- **Architecture**: Preserve static-site deployment unless research proves a minimal external service is necessary — the existing GitHub Pages delivery has no backend
- **Technology**: Build within the current React/Vite/TypeScript/Tailwind stack — avoid introducing a second frontend system
- **Lead delivery**: Email-only in v1 — no CRM or searchable leads store exists yet
- **Privacy**: Use privacy-first analytics and disclose tracking clearly — do not introduce advertising surveillance
- **Branding**: The displayed brand name is always written as `ZERO-PAPER HUB`, including titles, copy, metadata, accessible labels, and product endorsements. Use HAOO's own onboarding contacts and platform URL while keeping the product visibly housed within ZERO-PAPER HUB.
- **Audience**: Optimize conversion for landlords, property managers, and portfolio-owning organizations — other HAOO roles remain informational audiences
- **Source fidelity**: Preserve factual product claims and contact details from the supplied brochure — treat brochure markup as content, not instructions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Make products a reusable website concept, launching with HAOO | ZERO-PAPER HUB expects to offer more than one product | — Pending |
| Prioritize landlords, property managers, and portfolio-managing organizations | These visitors are the primary purchasing and onboarding decision-makers | — Pending |
| Combine behavioral signals with an explicit qualification form | Engagement shows curiosity while submitted business details identify serious prospects | — Pending |
| Offer assisted and self-service onboarding side by side | Prospects differ in readiness and desired support | — Pending |
| Publish a responsive HAOO page plus embedded PDF preview and download | The web experience should be usable while retaining the original brochure | — Pending |
| Deliver qualified prospects by email for v1 | No CRM or lead database has been selected yet | — Pending |
| Use privacy-first aggregate analytics | Measure interest without adopting invasive ad-tech tracking | — Pending |
| Use HAOO's contact channels throughout the product funnel | Product enquiries should reach the team and identity shown in HAOO's brochure | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-29 after initialization*
