# Requirements: ZERO-PAPER HUB Product Launch Platform

**Defined:** 2026-08-29
**Core Value:** A serious HAOO prospect can understand the product, demonstrate intent, and reach the right onboarding path quickly without getting lost in general company traffic.

## v1 Requirements

### Product Discovery

- [x] **PROD-01**: Visitor can discover HAOO from a Products section on the ZERO-PAPER HUB home page
- [x] **PROD-02**: Visitor can open a stable HAOO product URL at `/products/haoo/` directly or from the Products section
- [x] **PROD-03**: Visitor can understand HAOO's audiences, benefits, capabilities, and rental journey through responsive semantic web content derived from the supplied brochure
- [x] **PROD-04**: Visitor can preview the original HAOO PDF brochure and can always open or download it through explicit controls
- [x] **PROD-05**: Visitor sees HAOO-specific page title, description, canonical URL, and social-sharing metadata on the product page
- [x] **PROD-06**: HAOO content and contact details are sourced from centralized product data that can support future products without duplicating the page shell

### Onboarding Paths

- [x] **ONBD-01**: Prospect can contact HAOO through a visible click-to-call link for `+254 702 188 044`
- [x] **ONBD-02**: Prospect can start a WhatsApp conversation with HAOO through a visible link using non-personal generic starter text
- [x] **ONBD-03**: Prospect can email `info@haoo.online` through a visible mail link
- [x] **ONBD-04**: Prospect can self-onboard through a visible link to `manage.haoo.online`
- [x] **ONBD-05**: Assisted and self-service onboarding paths remain available regardless of analytics, browser storage, PDF embedding, or form-provider availability

### Qualification and Delivery

- [x] **LEAD-01**: Interested visitor can submit their name and at least one usable contact method through a HAOO-specific qualification form
- [x] **LEAD-02**: Interested visitor can identify their role, organization, portfolio-size band, location, and intended onboarding timeframe using clear controlled fields
- [ ] **LEAD-03**: Visitor can see which qualification fields are required, why the information is collected, and that relevant HAOO engagement context accompanies the submission
- [x] **LEAD-04**: A valid HAOO qualification submission is addressed to `info@haoo.online` with a recognizable HAOO-specific subject and human-readable field labels
- [x] **LEAD-05**: Visitor receives accessible validation, submitting, success, failure, and retry guidance without losing entered values after a recoverable error
- [x] **LEAD-06**: Qualification form applies a honeypot and provider-supported spam controls without creating a barrier for legitimate keyboard or assistive-technology users
- [ ] **LEAD-07**: Release verification proves the HAOO form endpoint is activated and a uniquely tagged production submission reaches the HAOO inbox or spam folder

### Privacy-First Measurement

- [ ] **MEAS-01**: Product owner can view aggregate counts for HAOO page views, brochure preview/open/download actions, qualification starts/submits, assisted-contact clicks, and self-onboarding clicks
- [ ] **MEAS-02**: Analytics events use a closed allowlist and contain no names, contact details, free-text form values, exact portfolio/location values, or stable visitor identifiers
- [ ] **MEAS-03**: Browser stores at most bounded visit bands, coarse date bands, and HAOO interaction flags without a UUID, raw clickstream, or cross-site identity
- [ ] **MEAS-04**: Visitor can read a privacy disclosure describing aggregate analytics, bounded browser context, and the engagement summary attached after voluntary form submission
- [ ] **MEAS-05**: Submitted qualification email includes a disclosed human-readable summary of relevant HAOO engagement signals without an opaque lead score
- [ ] **MEAS-06**: Campaign parameters are allowlisted and normalized before use and never include or receive personal information
- [ ] **MEAS-07**: Product journey remains fully functional when analytics scripts or browser storage are blocked or unavailable
- [ ] **MEAS-08**: Reports describe browser-observable events truthfully as views, attempts, redirect returns, and outbound clicks rather than confirmed delivery, customers, or completed onboarding

### Experience and Release Quality

- [ ] **QUAL-01**: Visitor can use the Products and HAOO journeys at supported mobile and desktop widths without horizontal overflow or hidden primary actions
- [ ] **QUAL-02**: Visitor can navigate product content, brochure controls, form fields, validation messages, and onboarding links by keyboard with visible focus
- [ ] **QUAL-03**: HAOO page preserves semantic heading order, descriptive link and control names, zoom support, reduced-motion behavior, and an HTML equivalent for brochure information
- [x] **QUAL-04**: Direct navigation and browser refresh work for `/products/haoo/` and the published brochure asset on the production host
- [ ] **QUAL-05**: Build, typecheck, lint, automated contract/component tests, and required deployed manual checks pass before launch
- [x] **QUAL-06**: Published HAOO claims, phone number, email address, and onboarding URL match the supplied brochure source material

## v2 Requirements

### Lead Operations

- **LEAD-08**: Team can search, filter, assign, and update qualified prospects in a durable leads list or selected CRM
- **LEAD-09**: Qualified prospect submissions can create or update CRM records through an approved server-side integration
- **LEAD-10**: Team can automate follow-up workflows after lead ownership, retention, and service-level rules are defined

### Attribution

- **MEAS-09**: Team can reconcile website self-onboarding clicks with aggregate completed registrations provided by the HAOO application
- **MEAS-10**: Team can run controlled funnel experiments after a trustworthy baseline and minimum sample policy exist

### Commercial Expansion

- **ONBD-06**: Prospect can compare HAOO subscription plans after pricing and packaging are approved
- **PROD-07**: Tenant and agent audiences can enter dedicated acquisition funnels after decision-maker onboarding is validated

## Out of Scope

| Feature | Reason |
|---------|--------|
| Building or changing the HAOO application | This milestone markets HAOO and routes visitors to the existing platform |
| Searchable lead database or dashboard in v1 | User chose email-only delivery until a leads list or CRM is selected |
| Advertising pixels, remarketing, fingerprinting, or cross-site profiling | Conflicts with the approved privacy-first measurement strategy |
| Predictive lead scoring or automatic prospect rejection | No validated sales data or transparent decision policy exists |
| Checkout or subscription purchase on ZERO-PAPER HUB | HAOO pricing and commercial packaging are not yet defined |
| Embedded HAOO account creation | Self-onboarding remains owned by `manage.haoo.online` |
| PDF-only product experience | Responsive semantic HTML is the primary accessible experience |
| Server-side secrets in the static website | GitHub Pages serves all bundled values publicly |

## Traceability

Traceability is populated during roadmap creation. Every v1 requirement must map to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROD-01 | Phase 1 | Complete |
| PROD-02 | Phase 1 | Complete |
| PROD-03 | Phase 1 | Complete |
| PROD-04 | Phase 1 | Complete |
| PROD-05 | Phase 1 | Complete |
| PROD-06 | Phase 1 | Complete |
| ONBD-01 | Phase 1 | Complete |
| ONBD-02 | Phase 1 | Complete |
| ONBD-03 | Phase 1 | Complete |
| ONBD-04 | Phase 1 | Complete |
| ONBD-05 | Phase 1 | Complete |
| LEAD-01 | Phase 2 | Complete |
| LEAD-02 | Phase 2 | Complete |
| LEAD-03 | Phase 2 | Pending |
| LEAD-04 | Phase 2 | Complete |
| LEAD-05 | Phase 2 | Complete |
| LEAD-06 | Phase 2 | Complete |
| LEAD-07 | Phase 5 | Pending |
| MEAS-01 | Phase 4 | Pending |
| MEAS-02 | Phase 3 | Pending |
| MEAS-03 | Phase 3 | Pending |
| MEAS-04 | Phase 3 | Pending |
| MEAS-05 | Phase 4 | Pending |
| MEAS-06 | Phase 3 | Pending |
| MEAS-07 | Phase 3 | Pending |
| MEAS-08 | Phase 4 | Pending |
| QUAL-01 | Phase 5 | Pending |
| QUAL-02 | Phase 5 | Pending |
| QUAL-03 | Phase 5 | Pending |
| QUAL-04 | Phase 1 | Complete |
| QUAL-05 | Phase 5 | Pending |
| QUAL-06 | Phase 1 | Complete |

**Coverage:**

- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-08-29*
*Last updated: 2026-08-29 after roadmap creation*
