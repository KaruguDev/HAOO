# Phase 4: Report and Enrich the HAOO Funnel Truthfully - Context

**Gathered:** 2026-08-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Connect the privacy-bounded HAOO measurement layer from Phase 3 to an aggregate reporting experience, and attach a disclosed, human-readable engagement summary to voluntary HAOO qualification submissions. Reporting must describe browser-observable events literally and must not imply person-level progression, confirmed enquiry delivery, customers, or completed onboarding. This phase does not introduce a CRM, searchable leads store, stable visitor identity, raw clickstream, lead score, or reconciliation with HAOO registrations.

</domain>

<decisions>
## Implementation Decisions

### Reporting Experience
- **D-01:** Lead with a staged funnel of literal event counts, organized as discovery, brochure interest, qualification, and assisted/self-onboarding. The funnel is a reporting hierarchy, not evidence that the same person progressed through each stage.
- **D-02:** Keep the opening view compact by showing a total for each stage with an expandable event-level breakdown. The breakdown preserves separate observable actions such as brochure preview/open/download and WhatsApp/phone/email clicks instead of collapsing their meaning.
- **D-03:** Provide 7-day, 30-day, 90-day, and all-time views. For each bounded time range, compare its counts with the immediately preceding equivalent period; the all-time view has no fabricated preceding-period comparison.
- **D-04:** Show event counts and changes between periods only. Do not calculate or display conversion percentages, because the anonymous event stream has no visitor or session identity with which to prove cohort progression.

### the agent's Discretion
The user selected only the reporting-experience area for discussion. Downstream agents retain discretion over exact visual composition, stage names in final copy, expansion behavior, empty/loading/unconfigured states, accessibility treatment, and provider-compatible presentation, provided D-01 through D-04 and the existing UI conventions are preserved.

The exact engagement-summary wording and ordering, treatment of normalized campaign context in the submitted summary, event-label copy, analytics provider/account arrangement, and report-access model were not discussed. Research and planning may choose standard privacy-first approaches within Phase 3's locked boundaries: no stable identifier, no analytics-to-lead identity join, no form values in analytics, no opaque score, and literal descriptions of browser-observable evidence.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope and Requirements
- `.planning/PROJECT.md` — Privacy-first analytics constraint, email-only lead delivery, product-owner success metric, and v1 exclusions.
- `.planning/REQUIREMENTS.md` — Phase 4 requirements `MEAS-01`, `MEAS-05`, and `MEAS-08`; attribution reconciliation remains v2 under `MEAS-09`.
- `.planning/ROADMAP.md` — Phase 4 goal, dependency on Phase 3, and three success criteria.
- `.planning/STATE.md` — Accumulated decisions and current milestone state, including the rule that reports describe observable events literally.

### Prior Phase Decisions
- `.planning/phases/03-build-privacy-bounded-engagement-context/03-CONTEXT.md` — Closed event allowlist, no-op provider seam, bounded browser context, campaign rules, disclosure contract, and the explicit hand-off to Phase 4.
- `.planning/phases/03-build-privacy-bounded-engagement-context/03-VERIFICATION.md` — Verified Phase 3 signal flow and the deferred gap requiring Phase 4 to attach and disclose the engagement summary.
- `.planning/phases/02-submit-a-qualified-haoo-enquiry/02-CONTEXT.md` — AJAX FormSubmit flow, human-readable email fields, disclosure placement, and the decision that Phase 2 ships no placeholder summary payload.
- `.planning/phases/01-discover-haoo-and-choose-an-onboarding-path/01-CONTEXT.md` — Assisted-first onboarding emphasis, repeated choices, HAOO/`ZERO-PAPER HUB` brand relationship, and reusable product-shell decisions.

### Existing Codebase Guidance
- `.planning/codebase/STACK.md` — Static React/Vite runtime, current test stack, and GitHub Pages deployment constraints.
- `.planning/codebase/INTEGRATIONS.md` — External-service boundaries and the absence of an application server or existing analytics SDK in the original architecture.
- `.planning/codebase/ARCHITECTURE.md` — Client-rendered composition and static-hosting boundaries.
- `.planning/codebase/CONVENTIONS.md` — TypeScript, React, Tailwind, accessibility, data-driven content, and verification conventions.
- `.planning/codebase/TESTING.md` — Contract and component testing patterns.
- `README.md` — Current HAOO FormSubmit activation boundary, delivery caveat, and measurement documentation.

No external Phase 4 specification or ADR exists; requirements and prior decisions are captured in the project planning artifacts above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/measurement/index.ts` — Provides the product-generic `track()`, `readContext()`, `readCampaign()`, and provider `eventSink` seam. Phase 4 can attach aggregate delivery behind this boundary without exposing storage or analytics APIs to page components.
- `src/products/haoo.ts` — Centralizes the ten HAOO event names, interaction groupings, human-readable disclosure lines, provider configuration, context flags, and campaign wording.
- `src/components/QualifyForm.tsx` — Owns the validated AJAX submission boundary. It already records `haoo_qualify_submit` immediately before the network attempt and distinguishes browser-visible request success/failure from proven inbox delivery.
- `src/components/MeasurementDisclosure.tsx` — Existing visitor-facing disclosure surface that Phase 4 must update when the email engagement summary becomes real.

### Established Patterns
- Analytics events are bare names from a closed allowlist; no property bag or form answer can accompany them.
- Browser context and analytics delivery are independent. Provider failure is isolated, and visitor actions continue normally.
- Reportable events are action evidence: page view, brochure preview/open/download, qualification start/attempt, assisted-contact outbound clicks, and self-onboarding outbound clicks.
- Static content and closed lists live in product data and are covered by total-table and source-boundary tests.

### Integration Points
- Replace the current `none`-only resolution in `src/products/haoo.ts` with a deliberately configured privacy-first reporting sink while preserving the no-op behavior when unconfigured.
- Feed only the existing event names through the `eventSink` seam in `src/measurement/index.ts`; do not add visitor or form properties to make reporting easier.
- Extend qualification submission-body construction so the disclosed coarse context summary reaches FormSubmit as human-readable fields, without changing analytics event payloads.
- Update `src/products/haoo.ts`, `src/products/copy.ts`, and `src/components/MeasurementDisclosure.tsx` so visitor-facing wording matches the now-attached summary.
- Extend existing measurement, qualification, component, and build-boundary tests instead of creating a parallel reporting contract.

</code_context>

<specifics>
## Specific Ideas

- Opening reporting hierarchy: discovery → brochure interest → qualification → assisted/self-onboarding.
- A stage is a compact grouping of aggregate event occurrences, not a cohort or unique-person count.
- Expand a stage to see the literal underlying events, including separate brochure and assisted-contact actions.
- Prefer straightforward counts and “change from the previous equivalent period” language over conversion terminology.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Report and Enrich the HAOO Funnel Truthfully*
*Context gathered: 2026-08-31*
