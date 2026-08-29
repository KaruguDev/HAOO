# Roadmap: Zero-Paper Hub Product Launch Platform

## Overview

This milestone turns the existing company landing page into a product-led site by shipping the smallest complete HAOO journey first, then adding qualified enquiry capture, privacy-bounded engagement context, truthful funnel reporting, and a deployed release gate. Each phase leaves visitors with a usable path; analytics, browser storage, PDF embedding, and FormSubmit remain enhancements rather than prerequisites for contacting HAOO or self-onboarding.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Discover HAOO and Choose an Onboarding Path** - Ship a responsive, stable HAOO product journey from portfolio discovery to direct assisted or self-service action.
- [ ] **Phase 2: Submit a Qualified HAOO Enquiry** - Let an interested prospect provide structured qualification details through an accessible HAOO-specific form.
- [ ] **Phase 3: Build Privacy-Bounded Engagement Context** - Measure and retain only the disclosed, coarse engagement signals needed for privacy-first product learning.
- [ ] **Phase 4: Report and Enrich the HAOO Funnel Truthfully** - Make aggregate funnel activity visible and attach a readable engagement summary to voluntary enquiries without opaque scoring.
- [ ] **Phase 5: Prove the Deployed Journey** - Verify the complete live funnel across devices, accessibility modes, static routes, providers, assets, and HAOO source facts.

## Phase Details

### Phase 1: Discover HAOO and Choose an Onboarding Path

**Goal**: Visitors can move from the Zero-Paper Hub home page to a stable, brochure-faithful HAOO page and immediately choose assisted or self-service onboarding.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06, ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05, QUAL-04, QUAL-06
**Success Criteria** (what must be TRUE):

  1. Visitor can discover HAOO in a Products section, open `/products/haoo/` directly or by link, refresh it successfully, and see HAOO-specific search and sharing metadata.
  2. Visitor can understand HAOO's intended audiences, benefits, capabilities, and rental journey through responsive semantic HTML whose claims and contact details match the supplied brochure.
  3. Visitor can preview the original HAOO brochure when embedding works and can always open or download the published PDF through explicit controls.
  4. Prospect can call, WhatsApp, or email HAOO, or open `manage.haoo.online` for self-onboarding, and every path remains usable without analytics, storage, PDF embedding, or form delivery.
  5. HAOO renders from centralized product content and contacts within a reusable product-page shell that can present a future product without copying the page structure.

**Plans**: TBD

- [x] 01-01-PLAN.md
- [ ] 01-02-PLAN.md
- [ ] 01-03-PLAN.md
- [ ] 01-04-PLAN.md
- [ ] 01-05-PLAN.md

**UI hint**: yes

### Phase 2: Submit a Qualified HAOO Enquiry

**Goal**: Interested prospects can voluntarily send HAOO the minimum structured details needed for useful human follow-up and recover clearly from validation or provider trouble.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05, LEAD-06
**Success Criteria** (what must be TRUE):

  1. Interested visitor can submit a name, at least one usable contact method, role, organization, portfolio-size band, location, and intended onboarding timeframe through clearly labelled controlled fields.
  2. Visitor can tell which fields are required, why the details are collected, and that a relevant HAOO engagement summary will accompany the voluntary submission.
  3. A valid submission is addressed to `info@haoo.online` with a recognizable HAOO subject and human-readable field labels.
  4. Visitor receives accessible validation, submitting, return, failure, and retry guidance and retains entered values after a recoverable client-side error.
  5. Legitimate keyboard and assistive-technology users can complete the form while a honeypot and provider-supported spam controls discourage automated submissions.

**Plans**: TBD
**UI hint**: yes

### Phase 3: Build Privacy-Bounded Engagement Context

**Goal**: Visitors receive a fully functional HAOO journey whose disclosed measurement and browser context stay aggregate, coarse, bounded, and free of personal or stable identity data.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: MEAS-02, MEAS-03, MEAS-04, MEAS-06, MEAS-07
**Success Criteria** (what must be TRUE):

  1. Visitor can read a clear disclosure of aggregate analytics, bounded browser context, normalized campaign data, and the engagement summary attached only after voluntary form submission.
  2. Inspection of analytics events and browser storage shows only closed-allowlist signals, bounded visit/date bands, and interaction flags—never contact data, free text, exact portfolio/location values, UUIDs, raw clickstreams, or cross-site identity.
  3. Allowlisted campaign parameters are normalized before use and cannot introduce personal information into analytics or lead context.
  4. Visitor can still read the HAOO page, use brochure controls, submit the form, and follow every onboarding route when analytics scripts or browser storage are blocked or unavailable.

**Plans**: TBD
**UI hint**: yes

### Phase 4: Report and Enrich the HAOO Funnel Truthfully

**Goal**: The product owner can understand aggregate HAOO interest while voluntarily submitted enquiries carry a transparent, human-readable context summary rather than identity tracking or a hidden score.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: MEAS-01, MEAS-05, MEAS-08
**Success Criteria** (what must be TRUE):

  1. Product owner can view aggregate counts for HAOO page views, brochure preview/open/download actions, qualification starts/submits, assisted-contact clicks, and self-onboarding clicks.
  2. A submitted qualification email includes the disclosed coarse HAOO engagement summary in human-readable form and contains no opaque lead score or stable visitor identifier.
  3. Product reporting labels browser evidence precisely as views, attempts, redirect returns, and outbound clicks rather than claiming confirmed delivery, customers, or completed onboarding.

**Plans**: TBD
**UI hint**: yes

### Phase 5: Prove the Deployed Journey

**Goal**: Visitors can rely on the production HAOO funnel across supported devices and accessibility modes, and the team has direct evidence that its static routes, assets, checks, and email delivery work live.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: LEAD-07, QUAL-01, QUAL-02, QUAL-03, QUAL-05
**Success Criteria** (what must be TRUE):

  1. Visitor can use the Products and HAOO journeys at supported mobile and desktop widths without horizontal overflow or hidden primary actions.
  2. Visitor can navigate product content, brochure controls, qualification fields and feedback, and onboarding links by keyboard with visible focus, semantic headings, descriptive names, zoom support, reduced motion, and an HTML equivalent to the brochure.
  3. Direct production navigation and refresh work for the HAOO page and brochure, while build, typecheck, lint, automated contract/component tests, and required deployed checks pass.
  4. A uniquely tagged production qualification submission demonstrates that the activated HAOO endpoint reaches the `info@haoo.online` inbox or spam folder, with direct onboarding recovery paths still available.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Discover HAOO and Choose an Onboarding Path | 1/5 | In Progress|  |
| 2. Submit a Qualified HAOO Enquiry | 0/TBD | Not started | - |
| 3. Build Privacy-Bounded Engagement Context | 0/TBD | Not started | - |
| 4. Report and Enrich the HAOO Funnel Truthfully | 0/TBD | Not started | - |
| 5. Prove the Deployed Journey | 0/TBD | Not started | - |
