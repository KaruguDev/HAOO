# Roadmap: Zero-Paper Hub Product Launch Platform

## Overview

This milestone turns the existing company landing page into a product-led site by shipping the smallest complete HAOO journey first, then adding qualified enquiry capture, privacy-bounded engagement context, truthful funnel reporting, and a deployed release gate. Each phase leaves visitors with a usable path; analytics, browser storage, PDF embedding, and FormSubmit remain enhancements rather than prerequisites for contacting HAOO or self-onboarding.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Discover HAOO and Choose an Onboarding Path** - Ship a responsive, stable HAOO product journey from portfolio discovery to direct assisted or self-service action. (completed 2026-08-29)
- [ ] **Phase 2: Submit a Qualified HAOO Enquiry** - Let an interested prospect provide structured qualification details through an accessible HAOO-specific form.
- [ ] **Phase 3: Build Privacy-Bounded Engagement Context** - Measure and retain only the disclosed, coarse engagement signals needed for privacy-first product learning.
- [ ] **Phase 4: Report and Enrich the HAOO Funnel Truthfully** - Make aggregate funnel activity visible and attach a readable engagement summary to voluntary enquiries without opaque scoring.
- [ ] **Phase 5: Prove the Deployed Journey** - Verify the complete live funnel across devices, accessibility modes, static routes, providers, assets, and HAOO source facts.

## Phase Details

### Phase 1: Discover HAOO and Choose an Onboarding Path

**Goal**: As a landlord or property manager, I want to move from the ZERO-PAPER HUB home page to a stable, brochure-faithful HAOO page and immediately choose assisted or self-service onboarding, so that I can start with HAOO through the path I prefer.
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

- [x] 01-06-PLAN.md
- [x] 01-07-PLAN.md
- [x] 01-08-PLAN.md
- [x] 01-09-PLAN.md

**Wave 1**

- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-03-PLAN.md

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-04-PLAN.md

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-05-PLAN.md

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

**Plans**: 7/7 plans executed

**Wave 1**

- [x] 02-01-PLAN.md — Prove the seven-file product-data-to-FormSubmit enquiry tracer end to end.

**Wave 2**

- [x] 02-07-PLAN.md — Pin endpoint resolution and register the tracer with inherited focus and generic-source guards.

**Wave 3**

- [x] 02-02-PLAN.md — Expand the tracer to the complete controlled qualification field set.
- [x] 02-03-PLAN.md — Add form entry points to onboarding blocks and product navigation.

**Wave 4**

- [x] 02-04-PLAN.md — Implement accessible validation, correction, and conditional phone requiredness.

**Wave 5**

- [x] 02-05-PLAN.md — Add success, provider-failure, retry, and no-JavaScript recovery states.

**Wave 6**

- [x] 02-06-PLAN.md — Add approved collection disclosure and enforce the no-summary boundary.

**UI hint**: yes

### Phase 3: Build Privacy-Bounded Engagement Context

**Goal:** As a HAOO prospect, I want to follow a privacy-bounded journey, so that I can onboard without identity tracking.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: MEAS-02, MEAS-03, MEAS-04, MEAS-06, MEAS-07
**Success Criteria** (what must be TRUE):

  1. Visitor can read a clear disclosure of aggregate analytics, bounded browser context, normalized campaign data, and the engagement summary attached only after voluntary form submission.
  2. Inspection of analytics events and browser storage shows only closed-allowlist signals, bounded visit/date bands, and interaction flags—never contact data, free text, exact portfolio/location values, UUIDs, raw clickstreams, or cross-site identity.
  3. Allowlisted campaign parameters are normalized before use and cannot introduce personal information into analytics or lead context.
  4. Visitor can still read the HAOO page, use brochure controls, submit the form, and follow every onboarding route when analytics scripts or browser storage are blocked or unavailable.

**Plans**: 4/4 plans executed

**Wave 1**

- [x] 03-01-PLAN.md — Prove the product-configured no-op page-view tracer and measurement capability boundary.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Complete exhaustive event, campaign, bounded-context, expiry, and failure contracts.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — Instrument brochure, form, assisted-contact, and self-onboarding actions.

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 03-04-PLAN.md — Ship the approved disclosure, visitor clear control, and footer discovery path.

**UI hint**: yes

### Phase 4: Report and Enrich the HAOO Funnel Truthfully

**Goal**: As a HAOO product owner, I want to understand aggregate HAOO interest and receive transparent, human-readable context with voluntarily submitted enquiries, so that I can act without identity tracking or a hidden score.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: MEAS-01, MEAS-05, MEAS-08
**Success Criteria** (what must be TRUE):

  1. Product owner can view aggregate counts for HAOO page views, brochure preview/open/download actions, qualification starts/submits, assisted-contact clicks, and self-onboarding clicks.
  2. A submitted qualification email includes the disclosed coarse HAOO engagement summary in human-readable form and contains no opaque lead score or stable visitor identifier.
  3. Product reporting labels browser evidence precisely as views, attempts, and outbound clicks rather than claiming confirmed delivery, customers, or completed onboarding.

*Criterion 3 amended 2026-09-01 during Phase 4 planning: `redirect returns` was dropped to match
MEAS-08. The Phase 3 closed event allowlist in `src/products/haoo.ts:14-25` emits no redirect-return
event and Phase 4 may not add one, so the category was unreportable by construction. The precision
intent is unchanged.*

**Plans**: 13/14 plans executed — 10 executed, 3 planned (gap closure round 3)

- [ ] .planner-contributions.md

**Wave 1**

- [x] 04-01-PLAN.md — Tracer: query, validate and render an owner-facing HAOO funnel report end to end, then extend it to all four locked periods.
- [x] 04-02-PLAN.md — Tracer: attach a readable, disclosed engagement summary to the qualification request, then complete its sentence matrix and thresholds.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-03-PLAN.md — Complete the Surface A report document and pin its vocabulary, encoding and self-containment contracts.
- [x] 04-04-PLAN.md — Replace the superseded collection-notice clause everywhere and add the disclosure group describing what is attached.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-05-PLAN.md — Widen the provider seam to a real privacy-first sink, re-scope the static boundary, and document the credential split.

**Wave 4** *(gap closure; both plans can run in parallel after Wave 3)*

- [x] 04-06-PLAN.md — Mirror the documented Plausible preload contract, pin it with an independent fixture, and restore MVP goal verification.
- [x] 04-07-PLAN.md — Validate Stats query provenance, make report replacement fail-closed, and complete the owner run instructions.

**Wave 5** *(gap closure round 2)*

- [x] 04-08-PLAN.md — Constrain the configured analytics script source to a repository-owned approved origin and path, and document the constraint for the owner.

**Wave 6** *(blocked on 04-08; shares `src/test/measurement.test.ts`)*

- [x] 04-09-PLAN.md — Require a confirmed automatic-capture opt-out before any provider script insertion or event-sink return, with journey regressions for every refusal path.

**Wave 7** *(blocked on 04-09; all three plans edit `BUILD_INPUTS`-hashed files and drive the shared `dist/` build, so they run strictly serially)*

- [x] 04-10-PLAN.md — Fix first-run report directory creation on any host and record truthful Phase 4 requirement status with the open human gates.

**Wave 8** *(gap closure round 3; frontmatter waves restart at 1-3 per round. 04-12 and 04-13 both edit `src/measurement/plausible.ts`, so all three run strictly serially)*

- [x] 04-11-PLAN.md — Select the directory separator set from the destination's shape, extend the bare-root guard to a UNC root, and pin every probed destination shape including the two POSIX rows that regressed.
- [x] 04-12-PLAN.md — Decide adopted-versus-installed before any assignment so a non-callable pre-existing provider global is refused intact, and withdraw the unreachable stub-removal claim.
- [x] 04-13-PLAN.md — Restate the recorded-opt-out check as what it proves, and downgrade the 04-09 D1 coverage row to a human-judgment row pointing at the live dashboard gate.

**UI hint**: yes

### Phase 04.1: Migrate Measurement from Plausible to PostHog (INSERTED)

**Goal**: PostHog fully replaces Plausible as the HAOO measurement provider, with every Phase 3 and Phase 4 privacy contract preserved and provably enforced against PostHog's automatic-capture defaults.
**Depends on**: Phase 4
**Requirements**: MEAS-01, MEAS-02, MEAS-03, MEAS-04, MEAS-06, MEAS-07, MEAS-08
**Success Criteria** (what must be TRUE):

1. The site sends HAOO measurement to PostHog Cloud US, and no Plausible adapter, approved-source entry, preload fixture, test, environment variable, or instruction remains anywhere in the repository.
2. Autocapture, automatic `$pageview`/`$pageleave`, session recording, and surveys/heatmaps/exception/web-vitals capture are all off, proven by both a fail-closed configuration assertion at the initialization boundary and a network-payload regression showing only the ten allowlisted bare event names leave the page.
3. No stable visitor identifier is persisted, no PostHog person profile is created, and no analytics event can be joined to a qualification submission.
4. The owner report produces the same 7/30/90/all-time literal counts from PostHog, rejecting an unknown event name, a duplicate row, or a non-integer count before writing anything.
5. A failure to establish the automatic-capture lockdown refuses initialization, leaves every visitor action working, and is visible to the owner rather than silent.
6. The visitor-facing measurement disclosure states that analytics data is processed in the United States.

**Plans:** 6/9 plans executed

Plans:

- [x] 04.1-01-PLAN.md — Restate the withdrawn bundle guarantee with a named successor and pin the PostHog capture contract *(wave 1)*
- [x] 04.1-02-PLAN.md — Decide the PostHog API coverage matrix and re-point the coverage verifier *(wave 2)*
- [x] 04.1-03-PLAN.md — Install the pinned SDK under a legitimacy gate and plant the repository-owned ingestion-host trust anchor *(wave 2)*
- [x] 04.1-04-PLAN.md — Tracer: one HAOO event reaches a locked-down PostHog, and every Plausible artifact is removed *(wave 3)*
- [x] 04.1-05-PLAN.md — Two independent automatic-capture gates, a visible refusal, and the journey-survives-failure guard *(wave 4)*
- [ ] 04.1-06-PLAN.md — Visitor disclosure states that analytics data is processed in the United States *(wave 5)*
- [x] 04.1-07-PLAN.md — Owner report reads PostHog through one HogQL aggregate per range, with the provenance loss stated *(wave 3)*
- [ ] 04.1-08-PLAN.md — Owner activation instructions, the re-scoped human gates, and the restated Phase 4 claims *(wave 6)*

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
| 1. Discover HAOO and Choose an Onboarding Path | 9/9 | Complete    | 2026-08-29 |
| 2. Submit a Qualified HAOO Enquiry | 7/7 | In Progress|  |
| 3. Build Privacy-Bounded Engagement Context | 4/4 | In Progress|  |
| 4. Report and Enrich the HAOO Funnel Truthfully | 13/14 | In Progress|  |
| 5. Prove the Deployed Journey | 0/TBD | Not started | - |
