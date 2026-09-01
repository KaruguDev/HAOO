# Phase 4: Report and Enrich the HAOO Funnel Truthfully - Research

**Researched:** 2026-09-01
**Domain:** Privacy-bounded aggregate analytics, truthful reporting, and FormSubmit email enrichment
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Reporting Experience
- **D-01:** Lead with a staged funnel of literal event counts, organized as discovery, brochure interest, qualification, and assisted/self-onboarding. The funnel is a reporting hierarchy, not evidence that the same person progressed through each stage.
- **D-02:** Keep the opening view compact by showing a total for each stage with an expandable event-level breakdown. The breakdown preserves separate observable actions such as brochure preview/open/download and WhatsApp/phone/email clicks instead of collapsing their meaning.
- **D-03:** Provide 7-day, 30-day, 90-day, and all-time views. For each bounded time range, compare its counts with the immediately preceding equivalent period; the all-time view has no fabricated preceding-period comparison.
- **D-04:** Show event counts and changes between periods only. Do not calculate or display conversion percentages, because the anonymous event stream has no visitor or session identity with which to prove cohort progression.

### the agent's Discretion
The user selected only the reporting-experience area for discussion. Downstream agents retain discretion over exact visual composition, stage names in final copy, expansion behavior, empty/loading/unconfigured states, accessibility treatment, and provider-compatible presentation, provided D-01 through D-04 and the existing UI conventions are preserved.

The exact engagement-summary wording and ordering, treatment of normalized campaign context in the submitted summary, event-label copy, analytics provider/account arrangement, and report-access model were not discussed. Research and planning may choose standard privacy-first approaches within Phase 3's locked boundaries: no stable identifier, no analytics-to-lead identity join, no form values in analytics, no opaque score, and literal descriptions of browser-observable evidence.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MEAS-01 | Product owner can view aggregate counts for HAOO page views, brochure preview/open/download actions, qualification starts/submits, assisted-contact clicks, and self-onboarding clicks | Use the existing ten-name allowlist as the only reporting dimension; query Plausible's aggregate `events` metric by `event:goal`; render four additive reporting groups in a locally generated owner report. [VERIFIED: src/products/haoo.ts:14-25] [CITED: https://plausible.io/docs/stats-api] |
| MEAS-05 | Submitted qualification email includes a disclosed human-readable summary of relevant HAOO engagement signals without an opaque lead score | Build a product-configured sentence from only `visitBand`, `lastSeenBand`, the five booleans, and optionally normalized in-memory campaign values; append it as a named FormSubmit field before the existing JSON request is serialized. [VERIFIED: src/measurement/index.ts:3-13] [VERIFIED: src/components/qualify-form.logic.ts:60-89] [CITED: https://formsubmit.co/documentation] |
| MEAS-08 | Reports describe browser-observable events truthfully as views, attempts, and outbound clicks rather than confirmed delivery, customers, or completed onboarding (`redirect returns` removed 2026-09-01: absent from the closed allowlist at `src/products/haoo.ts:14-25`) | Bind every internal event to literal evidence copy and prohibit provider-dashboard conversion language in the owner report. The existing submit event occurs immediately before `fetch`, while `response.ok` only controls the browser state, so its defensible report label is a validated send attempt—not an enquiry delivered to an inbox. [VERIFIED: src/components/QualifyForm.tsx:300-316] |
</phase_requirements>

## Summary

Use Plausible Analytics as the deliberately configured provider behind the existing `eventSink`, but do not use Plausible's funnel UI, visitor totals, conversion rates, user journeys, or automatic link/form capture. Send only the existing closed event name from application code and configure the ten exact names as custom-event goals. Plausible's current JavaScript API accepts `plausible(eventName)` with the options object omitted, while its Stats API exposes the aggregate `events` metric grouped by `event:goal`. [CITED: https://plausible.io/docs/custom-event-goals] [CITED: https://plausible.io/docs/stats-api]

Keep GitHub Pages static. The Stats API requires a bearer key and is currently a Business-plan feature, so it must not be queried by the published Vite application. Generate a private, self-contained HTML report on the product owner's machine with a Node script that reads `PLAUSIBLE_STATS_API_KEY` from the process environment, runs aggregate-only queries, validates the response against the closed event tuple, and writes an ignored local artifact. This gives the owner the locked compact/expandable 7/30/90/all-time experience without adding a public backend or putting a read credential in the bundle. [CITED: https://plausible.io/docs/stats-api] [VERIFIED: AGENTS.md:15-18]

Enrich the existing FormSubmit JSON body independently of provider delivery. Snapshot the bounded browser context and normalized page-lifetime campaign immediately before body serialization; turn only coarse public fields into a human-readable sentence; never include `visitOrdinal`, `lastSeenDay`, form answers, a numeric score, or any analytics-derived identity. This continues to work when Plausible is absent because browser context and provider delivery are already independent. [VERIFIED: src/measurement/index.ts:252-357] [VERIFIED: .planning/phases/03-build-privacy-bounded-engagement-context/03-CONTEXT.md:34-38]

**Primary recommendation:** Plan three separable deliverables: (1) a fail-closed Plausible sink behind the existing measurement facade, (2) a local aggregate report generator with truthful fixed labels, and (3) a pure engagement-summary formatter inserted into the existing FormSubmit body—gated by account and privacy-owner checkpoints. [ASSUMED]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Validate and emit a HAOO event | Browser / Client | External analytics service | The existing facade owns the runtime allowlist, failure isolation, and local flags; Plausible only receives an accepted event. [VERIFIED: src/measurement/index.ts:314-329] |
| Aggregate event occurrences | External analytics service | — | Plausible's Stats API calculates aggregate event metrics over date ranges and goal dimensions. [CITED: https://plausible.io/docs/stats-api] |
| Generate the owner report | Local Node tooling | External analytics service | Local Node holds the bearer key at execution time and produces a static HTML view; the published Vite bundle never receives the key. [CITED: https://plausible.io/docs/stats-api] [ASSUMED] |
| Present stage totals and event breakdowns | Local generated HTML | — | Four stage totals are sums of literal occurrence counts; native disclosure widgets reveal the underlying event rows. [ASSUMED] |
| Build the coarse engagement summary | Browser / Client | Product configuration | The formatter consumes the already bounded context and fixed product-owned wording, not provider data or form values. [VERIFIED: src/measurement/index.ts:6-13] [VERIFIED: src/products/haoo.ts:50-66] |
| Deliver the summary with the enquiry | Browser / Client | FormSubmit | The existing browser request serializes a provider body and posts JSON to FormSubmit; the new summary is one additional human-readable field. [VERIFIED: src/components/QualifyForm.tsx:300-312] [CITED: https://formsubmit.co/documentation] |
| Protect provider read credentials | Local process environment | Operating system | The API requires a bearer key; keeping it out of `VITE_*` and generated HTML avoids publishing it. [CITED: https://plausible.io/docs/stats-api] |

## Project Constraints (from AGENTS.md)

- Preserve GitHub Pages/static deployment unless a minimal external service is proved necessary; this recommendation needs no new deployed service. [VERIFIED: AGENTS.md:13-18]
- Stay within React, Vite, TypeScript, and Tailwind; do not introduce a second frontend. [VERIFIED: AGENTS.md:15-16]
- Keep v1 lead delivery email-only; do not add a CRM or searchable lead store. [VERIFIED: AGENTS.md:17-18]
- Use privacy-first analytics, disclose it clearly, and do not add advertising surveillance. [VERIFIED: AGENTS.md:18-18]
- Keep HAOO contacts/platform identity within ZERO-PAPER HUB and preserve brochure facts. [VERIFIED: AGENTS.md:19-21]
- Use strict TypeScript, ES modules, two-space indentation, single quotes, semicolons, and existing React hook/data-driven patterns for application code. [VERIFIED: AGENTS.md:77-92]
- Preserve semantic markup, labelled controls, native keyboard behavior, visible focus, accessible names, and `role="status"` feedback. [VERIFIED: AGENTS.md:94-100]
- Use Tailwind utilities and the existing responsive green/blue system; keep global CSS narrow and use existing Lucide icons rather than bespoke SVG. [VERIFIED: AGENTS.md:102-108]
- Centralize provider configuration, never read or commit secret environment values, and run lint/typecheck/build at the specified boundaries. [VERIFIED: AGENTS.md:110-121]
- Extend the active GSD phase workflow; do not edit production code outside `/gsd-execute-phase`. [VERIFIED: AGENTS.md:171-184]

## Standard Stack

### Core

| Library / Service | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| Existing React/Vite/TypeScript/Tailwind application | React `^18.3.1`; Vite `^5.4.2`; TypeScript `^5.5.3`; Tailwind `^3.4.1` | Existing HAOO page, disclosure, and form integration | Preserve the established frontend. Verbatim source values: `"react": "^18.3.1"`, `"vite": "^5.4.2"`, `"typescript": "^5.5.3"`, `"tailwindcss": "^3.4.1"`. [VERIFIED: package.json:16-40] |
| Plausible hosted analytics | Managed service; docs current through Aug 2026 | Receive custom events and provide aggregate Stats API queries | Official custom events accept a name-only application call; the Stats API exposes event occurrence totals and exact/custom date ranges. [CITED: https://plausible.io/docs/custom-event-goals] [CITED: https://plausible.io/docs/stats-api] |
| Node.js built-ins | CI Node `22`; local probe `v24.12.0` | Run report queries, validation, and HTML generation without new packages | The deployment already standardizes Node 22; local Node is available. Verbatim workflow value: `node-version: 22`. [VERIFIED: .github/workflows/deploy.yml:31-38] [VERIFIED: environment probe 2026-09-01] |
| FormSubmit AJAX endpoint | Managed service | Deliver qualification fields plus the coarse summary by email | Official docs support cross-origin AJAX submissions, named data fields, `_subject`, and `_template`. [CITED: https://formsubmit.co/documentation] |

### Supporting

| Library / Service | Version | Purpose | When to Use |
|-------------------|---------|---------|-------------|
| Vitest | `3.2.4` | Contract, pure transformation, component, and build-boundary tests | Reuse for provider resolution, API response validation, date windows, stage sums, literal labels, and summary formatting. Verbatim source value: `"vitest": "3.2.4"`. [VERIFIED: package.json:21-40] |
| Testing Library / jsdom | `16.3.2` / `26.1.0` | Disclosure and qualification request integration | Verify accessible rendering and exact request-body fields without calling external providers. Verbatim values: `"@testing-library/react": "16.3.2"`, `"jsdom": "26.1.0"`. [VERIFIED: package.json:21-40] |
| Plausible site-specific script | Managed script from site installation settings | Queue and send custom event calls from the browser | Load only when the provider is explicitly configured; initialize with automatic pageviews disabled. [CITED: https://plausible.io/docs/plausible-script] [CITED: https://plausible.io/docs/script-extensions] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local generated owner report | Plausible's standard dashboard/shared link | Faster account setup and password-protected sharing, but the standard dashboard foregrounds visitors/conversions and does not implement the locked four-stage additive hierarchy or prohibit percentages. [CITED: https://plausible.io/docs/shared-links] [CITED: https://plausible.io/docs/compare-stats] |
| Local generated owner report | Embedded Plausible iframe | Official embedding exists, but password-protected shared dashboards cannot be embedded and the layout still does not satisfy D-01 through D-04. [CITED: https://plausible.io/docs/embed-dashboard] |
| Local generated owner report | Public/static Vite report querying Stats API | Rejected: it would expose the bearer key in browser code or require an unauthenticated proxy. [CITED: https://plausible.io/docs/stats-api] |
| Hosted Plausible | Self-hosted analytics | Adds database, upgrades, backups, access control, and operations that this static milestone does not own. [ASSUMED] |
| Explicit existing events | Plausible automatic outbound-link/file/form capture | Automatic capture can attach URL data or change event semantics; it would duplicate the closed application allowlist. [CITED: https://plausible.io/docs/custom-event-goals] |

**Installation:** No npm package is required. Use the provider's site-specific managed script behind the existing facade and Node's built-in `fetch` for the local report. [CITED: https://plausible.io/docs/plausible-script] [ASSUMED]

## Package Legitimacy Audit

No external package installation is recommended, so the package-legitimacy gate is not applicable. The provider is a hosted service loaded from the official site-specific script URL, and the report uses Node built-ins. [CITED: https://plausible.io/docs/plausible-script] [ASSUMED]

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```text
Visitor opens /products/haoo/
        |
        v
measurement.initialize()
  - validate/rebuild bounded local context
  - normalize allowed campaign values
  - strip UTM parameters from address bar
        |
        v
explicit track(allowlistedEventName) ---------- provider unconfigured/blocked ----> discard provider delivery
        |                                                             |            keep journey + local flags
        | provider configured                                          |
        v                                                              |
Plausible site-specific script (automatic pageview OFF) <---------------+
        |
        v
Plausible aggregate event store
        ^
        | bearer-authenticated aggregate-only queries
        |
local Node report generator --> validate exact event rows --> stage sums/deltas --> private local HTML

Voluntary valid qualification submit
        |
        +--> read bounded context + normalized in-memory campaign
        |         |
        |         v
        |    product-owned human sentence (no ordinal/day/score/form values)
        |         |
        +---------+--> existing FormSubmit JSON body --> provider accepted/failed browser state
```

The analytics flow and the enquiry-summary flow meet only in product configuration; they never join analytics records to a submitted person. [VERIFIED: .planning/phases/03-build-privacy-bounded-engagement-context/03-CONTEXT.md:23-32] [ASSUMED]

### Recommended Project Structure

The following is a proposed plan shape, not an existing filesystem claim. [ASSUMED]

```text
src/
├── measurement/                 # existing facade; configured Plausible loader/sink
├── reporting/                   # pure event labels, stage map, date windows, response validation
├── products/                    # HAOO-owned report and summary wording/configuration
├── components/                  # existing form/disclosure integration
└── test/                        # report, provider, summary, request-boundary tests
scripts/
└── generate-haoo-report.mjs     # local credentialed query + self-contained HTML writer
```

### Pattern 1: One-Way Provider Adapter

**What:** Resolve a finite provider value, load only the official script for that value, and expose only `(eventName) => void` to `createMeasurement`. Unknown, absent, blocked, or throwing providers remain no-ops. [VERIFIED: src/measurement/index.ts:15-29] [VERIFIED: src/measurement/index.ts:314-329]

**When to use:** Every browser event emission. Keep provider loading, global queue access, URL validation, and failure handling inside `src/measurement/`, the already audited browser-capability boundary. [VERIFIED: .planning/phases/03-build-privacy-bounded-engagement-context/03-CONTEXT.md:23-26]

**Critical initialization order:** normalize and remove campaign parameters before the provider script can send anything; initialize Plausible with `autoCapturePageviews: false`; then let the existing explicit `haoo_page_view` event traverse the sink once. Plausible documents that automatic pageviews are enabled by default and that every manual call counts separately. [CITED: https://plausible.io/docs/script-extensions]

### Pattern 2: Closed Reporting Dictionary

**What:** Define one exhaustive product-owned record from each event literal to stage and literal evidence label. The currently verified event tuple is quoted verbatim: `"haoo_page_view"`, `"haoo_brochure_preview"`, `"haoo_brochure_open"`, `"haoo_brochure_download"`, `"haoo_qualify_start"`, `"haoo_qualify_submit"`, `"haoo_assisted_whatsapp"`, `"haoo_assisted_phone"`, `"haoo_assisted_email"`, `"haoo_self_onboarding"`. [VERIFIED: src/products/haoo.ts:14-25]

**Recommended literal labels:** [ASSUMED]

| Event | Stage | Report label |
|-------|-------|--------------|
| `haoo_page_view` | Discovery | HAOO page views |
| `haoo_brochure_preview` | Brochure interest | Brochure preview became visible |
| `haoo_brochure_open` | Brochure interest | Brochure open-link clicks |
| `haoo_brochure_download` | Brochure interest | Brochure download-link clicks |
| `haoo_qualify_start` | Qualification | Qualification form starts |
| `haoo_qualify_submit` | Qualification | Validated form send attempts |
| `haoo_assisted_whatsapp` | Assisted/self-onboarding | Outbound WhatsApp clicks |
| `haoo_assisted_phone` | Assisted/self-onboarding | Outbound phone clicks |
| `haoo_assisted_email` | Assisted/self-onboarding | Outbound email clicks |
| `haoo_self_onboarding` | Assisted/self-onboarding | Outbound HAOO self-onboarding clicks |

Stage totals are sums of event occurrences, not distinct people, sessions, enquiries, or ordered progression. Repeated actions can contribute more than once, and one browser can contribute to several stages. [CITED: https://plausible.io/docs/stats-api] [VERIFIED: .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-CONTEXT.md:12-20]

### Pattern 3: Two Explicit Queries per Bounded Period

**What:** For 7, 30, and 90 days, calculate explicit inclusive calendar ranges in the Plausible site's reporting timezone and issue the same aggregate query for the current range and the immediately preceding non-overlapping equal-length range. Query all time once and omit comparison. [CITED: https://plausible.io/docs/stats-api] [ASSUMED]

Use metric `events`, dimension `event:goal`, and an allowlist filter containing only the ten goals. The Stats API defines `events` as event occurrences and supports ISO custom ranges, `7d`, `30d`, `all`, and a `91d` preset—not `90d`; therefore explicit dates are required for the locked 90-day view. [CITED: https://plausible.io/docs/stats-api]

Normalize missing goal rows to zero, reject unknown goal rows, reject duplicate goal rows, and accept only finite non-negative integer counts. Calculate `delta = current - previous`; render `+N`, `−N`, or `No change`, never a percentage. [ASSUMED]

### Pattern 4: Pure Human Summary Before Serialization

**What:** A pure product-configured formatter receives the coarse context and normalized campaign snapshot and returns one readable string. `buildSubmissionBody` appends it under a reserved, fixed email label after visitor fields and `Source`, before `JSON.stringify`. [VERIFIED: src/components/qualify-form.logic.ts:47-89] [ASSUMED]

Recommended content order: visit band; previous-visit band only when not first; recorded interaction flags in a fixed order; optional normalized campaign source/medium/campaign; explicit sentence that it is browser context, not a score or proof of progression. [ASSUMED]

Never include the derivation fields. Their verified source values are quoted verbatim as `"visitOrdinal"` and `"lastSeenDay"`, and Phase 3 explicitly forbids them from lead context/form payloads. [VERIFIED: src/measurement/index.ts:6-13] [VERIFIED: .planning/phases/03-build-privacy-bounded-engagement-context/03-CONTEXT.md:35-36]

### Pattern 5: Write-on-Success Local Report

**What:** Query and validate all required ranges first, render the complete HTML in memory, write a temporary sibling, then rename it to the final ignored local report. If any query/schema check fails, exit nonzero and leave the previous report untouched. [ASSUMED]

**When to use:** Every owner report refresh. The generated file should state generation time, reporting timezone, selected period, exact date boundaries, provider configuration state, and the caveat that blockers may make observed counts lower than actual actions. [ASSUMED]

### Anti-Patterns to Avoid

- **Plausible funnel/user-journey features:** they analyze visitor/session progression and conversion, which D-04 explicitly forbids for this report. [CITED: https://plausible.io/docs/goal-conversions] [VERIFIED: .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-CONTEXT.md:16-20]
- **Automatic pageviews/outbound links/downloads/forms:** they duplicate existing explicit signals and may attach destination URL data. [CITED: https://plausible.io/docs/custom-event-goals] [CITED: https://plausible.io/docs/script-extensions]
- **Stats API token in `VITE_*`:** Vite values are public bundle configuration, while the API requires bearer authentication. [CITED: https://plausible.io/docs/stats-api] [VERIFIED: README.md:45-49]
- **Sending form values or summary text to analytics:** the analytics seam remains event-name-only. [VERIFIED: .planning/phases/03-build-privacy-bounded-engagement-context/03-CONTEXT.md:28-32]
- **Reading provider analytics to enrich an email:** that creates the forbidden analytics-to-lead join; build the summary only from local bounded context. [VERIFIED: .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-CONTEXT.md:22-25]
- **Calling a submit attempt an enquiry:** `haoo_qualify_submit` fires before `fetch`, so it proves only an admitted browser attempt. [VERIFIED: src/components/QualifyForm.tsx:300-316]
- **Calling link activation contact/onboarding completion:** native link clicks prove only outbound selection, not a conversation, registration, customer, or completed onboarding. [VERIFIED: src/components/OnboardingChoices.tsx:34-48]
- **Treating provider success as inbox delivery:** the browser does not read the response body and Phase 5 owns delivery proof. [VERIFIED: src/components/QualifyForm.tsx:314-320] [VERIFIED: README.md:51-53]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Event collection/storage | A clickstream database or analytics backend | Plausible custom events behind the existing sink | The milestone excludes a raw clickstream/backend and Plausible already aggregates custom events. [CITED: https://plausible.io/docs/custom-event-goals] |
| Visitor/session identity | UUIDs, fingerprints, cookies, cross-site IDs | Occurrence counts only | Phase 3 forbids stable identity and the report does not need it. [VERIFIED: .planning/phases/03-build-privacy-bounded-engagement-context/03-CONTEXT.md:28-38] |
| Provider cryptography/auth | Custom token encryption in browser code | Process environment for local Stats API calls | A browser cannot keep a bearer key secret. [CITED: https://plausible.io/docs/stats-api] |
| Lead score | Weighted flags or inferred intent | Ordered human-readable facts | No validated policy exists, and MEAS-05 forbids an opaque score. [VERIFIED: .planning/REQUIREMENTS.md:54-61] |
| Email delivery service | A new API/backend/CRM | Existing FormSubmit AJAX body | v1 is explicitly email-only. [VERIFIED: AGENTS.md:15-18] [CITED: https://formsubmit.co/documentation] |
| Disclosure widgets | A custom accordion implementation | Native `<details>` / `<summary>` | Native disclosure behavior fits the existing accessible disclosure convention. [VERIFIED: src/components/MeasurementDisclosure.tsx:27-36] |
| Date/time framework | A new date library | Plain ISO calendar-date helpers with exhaustive boundary tests | Only fixed 7/30/90-day inclusive windows are required. [ASSUMED] |

**Key insight:** The difficult part is semantic integrity, not charting. Closed mappings and aggregate-only queries make it impossible for provider vocabulary such as “conversion,” “visitor progression,” or “customer” to leak into the owner-facing report. [ASSUMED]

## Common Pitfalls

### Pitfall 1: Provider Auto-Pageview Races Campaign Cleanup

**What goes wrong:** A head-loaded provider script sends an automatic pageview before `measurement.initialize()` strips campaign parameters, and the explicit HAOO page-view event later produces a duplicate. [CITED: https://plausible.io/docs/script-extensions]

**How to avoid:** Initialize the site-specific script with automatic pageviews disabled and load/activate it only through the measurement boundary after campaign cleanup. [CITED: https://plausible.io/docs/script-extensions] [ASSUMED]

**Warning signs:** Two page signals per load, UTM values visible in provider page dimensions, or events arriving before the React page initializes. [ASSUMED]

### Pitfall 2: Goal Counts Are Missing Although Events Were Sent

**What goes wrong:** Plausible receives a custom event, but it does not appear as a goal because no exact matching custom-event goal existed when the event arrived; past events are not backfilled into the goal. [CITED: https://plausible.io/docs/custom-event-goals]

**How to avoid:** Create all ten exact goals before enabling the production provider and run a uniquely dated smoke event for each. [CITED: https://plausible.io/docs/custom-event-goals] [ASSUMED]

### Pitfall 3: Wrong Metric Produces People Instead of Occurrences

**What goes wrong:** `visitors`, “unique conversions,” or conversion rate answers a different question than the required event occurrence count. [CITED: https://plausible.io/docs/stats-api]

**How to avoid:** Query only `events` grouped by `event:goal`; contract-test that the query contains none of `visitors`, `visits`, `conversion_rate`, or `percentage`. [CITED: https://plausible.io/docs/stats-api] [ASSUMED]

### Pitfall 4: “90 Days” Accidentally Means 91 Days

**What goes wrong:** Plausible's relative preset is `91d`, but the locked view is 90 days. [CITED: https://plausible.io/docs/stats-api]

**How to avoid:** Send explicit inclusive ISO calendar ranges for all bounded periods and test month/year/leap-day boundaries. [ASSUMED]

### Pitfall 5: Additive Stage Totals Look Like a Cohort Funnel

**What goes wrong:** Readers assume stage totals represent the same people progressing, even though counts can contain repeats and overlaps. [VERIFIED: .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-CONTEXT.md:16-20]

**How to avoid:** Place a persistent statement above the stages: “These are recorded action counts, not people moving through a funnel.” Label the grouping “activity stages” in explanatory copy even if the internal feature remains the funnel report. [ASSUMED]

### Pitfall 6: Email Summary Leaks Internal Derivation Data

**What goes wrong:** Spreading the `EngagementContext` object into the FormSubmit body includes the capped ordinal and day-only date. [VERIFIED: src/measurement/index.ts:6-13]

**How to avoid:** Construct a new summary from an explicit pick list; add negative tests for `visitOrdinal`, `lastSeenDay`, storage key, UUID patterns, score, raw JSON, and form values. [VERIFIED: .planning/phases/03-build-privacy-bounded-engagement-context/03-CONTEXT.md:35-36] [ASSUMED]

### Pitfall 7: First Visit Produces a Misleading “Last Seen Today” Sentence

**What goes wrong:** A fresh context contains the `today` band for internal consistency, but telling the recipient that a first-time browser was “last seen today” implies prior activity. [VERIFIED: src/measurement/index.ts:147-158]

**How to avoid:** When visit band is `first`, omit previous-visit wording entirely. [ASSUMED]

### Pitfall 8: Provider Privacy Marketing Is Treated as Project Approval

**What goes wrong:** Plausible says it uses no cookies and stores no raw IP/User-Agent, but its server still receives IP and User-Agent and derives a daily identifier. That factual provider behavior does not replace the project's privacy/legal approval. [CITED: https://plausible.io/security]

**How to avoid:** Require privacy/legal owner approval of processor, disclosure, data location, retention, and Kenya-law treatment before enabling production collection. [VERIFIED: .planning/STATE.md:139-145]

### Pitfall 9: Report File or Logs Expose the API Key

**What goes wrong:** Debug output prints headers, request options, or environment values; generated HTML embeds the key. [CITED: https://plausible.io/docs/stats-api]

**How to avoid:** Never log request headers; pass the key directly to `fetch`; scan the generated file and tests for the configured secret; write counts only. [ASSUMED]

### Pitfall 10: “Success” Becomes “Delivered”

**What goes wrong:** A successful browser response is reported as inbox delivery, or an outbound click is reported as a contact/customer/onboarding completion. [VERIFIED: src/components/QualifyForm.tsx:314-320]

**How to avoid:** Maintain a prohibited-copy table and test generated report text, disclosure copy, status copy, and summary text against `delivered`, `lead`, `customer`, `converted`, `registered`, `completed onboarding`, and similar claims unless independently evidenced. [ASSUMED]

## Code Examples

All examples below are proposed implementation patterns. New identifiers and structure are `[ASSUMED]`; existing event literals are verified by the verbatim tuple quoted under Pattern 2.

### Aggregate Event Query

```typescript
// Source shape: https://plausible.io/docs/stats-api
const query = {
  site_id: siteId,
  metrics: ['events'],
  date_range: [startDate, endDate],
  dimensions: ['event:goal'],
  filters: [['is', 'event:goal', HAOO_MEASUREMENT_EVENTS]],
};
```

The API key belongs only in the local process `Authorization: Bearer ...` header and never in this query object or generated output. [CITED: https://plausible.io/docs/stats-api]

### Human-Readable Summary Formatter

```typescript
// Proposed shape. The formatter explicitly ignores visitOrdinal and lastSeenDay.
function formatEngagementSummary(
  context: EngagementContext,
  campaign: Readonly<Record<string, string>>,
): string {
  const facts = [visitBandSentence(context.visitBand)];

  if (context.visitBand !== 'first') {
    facts.push(lastSeenSentence(context.lastSeenBand));
  }

  facts.push(...interactionSentences(context.flags));
  facts.push(...campaignSentences(campaign));

  return `Browser context only; not a lead score. ${facts.join(' ')}`;
}
```

### FormSubmit Body Integration

```typescript
// Source boundary: existing buildSubmissionBody in src/components/qualify-form.logic.ts
const body = buildSubmissionBody(submittedValues, qualify);
body[qualify.engagementSummary.emailLabel] = formatEngagementSummary(
  readContext(),
  readCampaign(),
);

const serialized = JSON.stringify(body);
track(measurementEvents.submit);
await fetch(qualify.endpoint, { method: 'POST', body: serialized });
```

The plan must preserve the existing order: serialize successfully, emit the attempt, then call `fetch`. [VERIFIED: src/components/QualifyForm.tsx:300-312]

### Accessible Compact Stage

```tsx
<details>
  <summary>
    <span>{stage.label}</span>
    <span>{stage.currentCount} recorded actions</span>
    {stage.deltaLabel ? <span>{stage.deltaLabel}</span> : null}
  </summary>
  <ul>
    {stage.events.map((event) => (
      <li key={event.name}>
        <span>{event.label}</span>
        <span>{event.currentCount}</span>
      </li>
    ))}
  </ul>
</details>
```

Do not render a progress bar, connecting arrows, percentages, or “drop-off”; those visual encodings imply a cohort sequence the data cannot prove. [ASSUMED]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Plausible extension-specific/legacy script variants | One site-specific script with `plausible.init()` options | Updated script introduced October 2025 | Use the account-provided script URL and `autoCapturePageviews: false`; custom events are automatically supported. [CITED: https://plausible.io/docs/script-update-guide] |
| Stats API v1 endpoints | Stats API v2 single POST query endpoint | Current docs, Aug 2026 | Build new reporting against `/api/v2/query`, explicit dimensions/metrics/filters, not legacy URL query syntax. [CITED: https://plausible.io/docs/stats-api] |
| Standard dashboard comparison percentages | Two explicit aggregate queries and integer deltas | Required by Phase 4 D-03/D-04 | The custom report can compare equal periods without displaying percentages. [CITED: https://plausible.io/docs/compare-stats] [ASSUMED] |

**Deprecated/outdated:**

- Legacy Plausible script examples using `data-domain` and extension-specific filenames should not be copied for a new account; retrieve the current site-specific snippet from Site Installation. [CITED: https://plausible.io/docs/plausible-script] [CITED: https://plausible.io/docs/script-update-guide]
- Plausible Stats API v1 remains documented as legacy; use v2. [CITED: https://plausible.io/docs/stats-api]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The product owner can run a documented local Node command and open a generated HTML report. | Summary / Architecture | If a browser-hosted report is required, an authenticated server-side read boundary becomes necessary. |
| A2 | Aggregate HAOO counts are business-sensitive enough to keep out of the public GitHub Pages build. | Alternatives | If public reporting is acceptable, a public shared dashboard could reduce implementation, but still would not meet the locked custom hierarchy. |
| A3 | Plausible hosted analytics will be approved and a Business plan/API key will be available. | Standard Stack | Without approval/account/key, MEAS-01 cannot produce live counts; only contracts and the no-op state can ship. |
| A4 | The Plausible site reporting timezone will be configured as Africa/Nairobi. | Date windows | Another timezone changes inclusive date boundaries and previous-period comparisons. |
| A5 | Normalized `utm_source`, `utm_medium`, and `utm_campaign` should appear in the voluntary email summary when present. | Summary Pattern | Product/privacy owners may prefer to omit campaign context; formatter and tests must follow the final checkpoint. |
| A6 | One local HTML artifact refreshed on demand is an acceptable report access model for v1. | Primary recommendation | If multi-user or always-current access is needed, local generation will not satisfy operations. |
| A7 | The suggested file/module boundaries are compatible with the eventual execution plan. | Recommended Structure | Planner may choose different names while preserving capability ownership and tests. |

## Open Questions (RESOLVED)

Every question below carries an inline resolution naming the blocking checkpoint or the
`04-CONTEXT.md` discretion clause that closes it. No question is left open against planning; three
resolve at a `gate="blocking-human"` checkpoint during execution, one resolves under delegated
discretion. Checkpoint map: **C-1** = `04-04-PLAN.md` Task 1 (collection-notice clause approval),
**C-2** = `04-02-PLAN.md` Task 1 (campaign values in the emailed summary), **C-3** =
`04-05-PLAN.md` Task 1 (processor approval and production-collection authorisation).

1. **Will ZERO-PAPER HUB approve and fund hosted Plausible with Stats API access?**
   - What we know: the API is a Business-plan feature and provider activation is currently absent. [CITED: https://plausible.io/docs/stats-api] [VERIFIED: src/products/haoo.ts:29-31]
   - What's unclear: account owner, plan, site ID, site-specific script URL, and API key availability.
   - Recommendation: first plan checkpoint creates/approves the account and ten exact goals; keep implementation/test work runnable with fixtures and the no-op provider while awaiting credentials. [ASSUMED]
   - **RESOLVED by C-3** (`04-05-PLAN.md` Task 1, `gate="blocking-human"`), which authorises the account, plan and the ten exact goals, plus the `user_setup` blocks in `04-01-PLAN.md` and `04-05-PLAN.md` that name every variable and its dashboard source. Planning is unblocked because the resolution is not needed to build: every task in the phase is fixture-driven and ships green with the provider unset, so an unfavourable or delayed answer costs the phase nothing already built.

2. **Does the privacy/legal owner approve Plausible's processor behavior?**
   - What we know: Plausible says it receives IP/User-Agent, derives a daily-changing identifier with rotating salt, stores no raw IP/User-Agent, and keeps visitor data in the EU. [CITED: https://plausible.io/security]
   - What's unclear: Kenya Data Protection Act assessment, disclosure wording, processor/DPA approval, retention, and production enablement authority.
   - Recommendation: blocking human approval before setting the provider variable in production. [VERIFIED: .planning/STATE.md:139-145]
   - **RESOLVED by C-3** (`04-05-PLAN.md` Task 1), which is the blocking human approval this recommendation asks for and is the sole authorisation for the visitor-to-provider crossing. `04-05-PLAN.md` requires the C-3 outcome — authorised or deferred — to be recorded verbatim in `04-05-SUMMARY.md`, so a deferral is a recorded state rather than an open question.

3. **Is a local generated HTML report acceptable to the product owner?**
   - What we know: it satisfies the exact locked presentation without a backend and keeps the Stats API key out of Vite. [CITED: https://plausible.io/docs/stats-api] [ASSUMED]
   - What's unclear: whether the owner needs multi-user, mobile, scheduled, or always-current access.
   - Recommendation: accept local generation for v1; if rejected, explicitly authorize a minimal authenticated server-side proxy instead of leaking a key into GitHub Pages. [ASSUMED]
   - **RESOLVED under delegated discretion** — `04-CONTEXT.md` `## the agent's Discretion` states the report-access model "was not discussed" and delegates it to research and planning within Phase 3's locked boundaries. Planning takes the recommended v1: local generation to a gitignored path. The choice is recorded as an explicit `<reversibility rating="costly">` on `04-01-PLAN.md` Task 1, which names what survives a reversal (the query and rendering modules) and what a reversal would newly require (an authenticated server-side read boundary and a deployment target). No checkpoint is minted because no locked decision is at stake.

4. **Should normalized campaign context accompany the voluntary enquiry?**
   - What we know: Phase 4 delegates this decision; Phase 3 retains only normalized allowlisted page-lifetime values and forbids form values in analytics. [VERIFIED: .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-CONTEXT.md:22-25] [VERIFIED: src/measurement/index.ts:207-249]
   - What's unclear: product/privacy preference.
   - Recommendation: include it as a separate plain-language sentence when present, with exact negative tests proving no unaccepted UTM key/value can enter. [ASSUMED]
   - **RESOLVED by C-2** (`04-02-PLAN.md` Task 1, `gate="blocking-human"`), which puts the include-or-omit choice to the product/privacy owner rather than assuming it. The outcome is load-bearing downstream: `04-02-PLAN.md` gates the campaign sentence on it, and `04-04-PLAN.md` requires the C-1 disclosure clause to stay consistent with the C-2 outcome recorded in `04-02-SUMMARY.md`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Local report generator and existing build | ✓ | local `v24.12.0`; CI configured `22` | Target Node 22-compatible APIs. [VERIFIED: environment probe 2026-09-01] [VERIFIED: .github/workflows/deploy.yml:31-38] |
| npm | Existing verification scripts | ✓ | `11.6.2` local | Existing lockfile/`npm ci`. [VERIFIED: environment probe 2026-09-01] |
| GitHub CLI | Optional owner workflow support | ✓ | `2.93.0` | Browser or local shell; not required by primary path. [VERIFIED: environment probe 2026-09-01] |
| Plausible account + site script | Live MEAS-01 collection | ✗ unverified | — | No-op sink preserves journey and email summary, but live aggregate counts remain unavailable. [VERIFIED: src/products/haoo.ts:29-31] |
| Plausible Business Stats API key | Owner report | ✗ unverified | v2 API | Fixture-backed report tests only; no live MEAS-01 completion. [CITED: https://plausible.io/docs/stats-api] |
| FormSubmit endpoint | MEAS-05 email body | Integration exists; production activation not proved | Managed | Existing direct-contact recovery paths; live inbox proof remains Phase 5. [VERIFIED: README.md:51-53] |

**Missing dependencies with no fallback:** approved Plausible account/site, ten configured goals, and Stats API key are required before MEAS-01 can be verified with live counts. [CITED: https://plausible.io/docs/custom-event-goals] [CITED: https://plausible.io/docs/stats-api]

**Missing dependencies with fallback:** absent/blocked analytics falls back to the existing no-op provider and does not block the product journey or local email summary. [VERIFIED: src/measurement/index.ts:314-329]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `3.2.4`, Testing Library `16.3.2`, jsdom `26.1.0`. Verbatim values quoted in Standard Stack. [VERIFIED: package.json:21-40] |
| Config file | `vitest.config.ts` — a **separate** config from `vite.config.ts`. It declares its own `plugins`, `test.environment: jsdom`, `test.globals: false`, and `test.setupFiles`. Vitest does NOT merge `vite.config.ts`, so anything declared only there (notably a `define` block) is absent under the test runner. [VERIFIED: vitest.config.ts:1-11] [VERIFIED: vite.config.ts:1-21] |
| Quick run command | `npm run test:unit -- --run src/test/measurement.test.ts src/test/qualify-form.test.tsx src/test/haoo-report.test.ts` [ASSUMED] |
| Full suite command | `npm test` (currently `npm run build && vitest run`). Verbatim script: `"test": "npm run build && vitest run"`. [VERIFIED: package.json:6-14] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MEAS-01 | Exact ten events resolve to four stages; missing rows become zero; unknown/duplicate/invalid provider rows fail; 7/30/90/all queries and previous windows are exact; totals/deltas use counts only | unit + contract | `npm run test:unit -- --run src/test/haoo-report.test.ts` | ❌ Wave 0 [ASSUMED] |
| MEAS-01 | Configured sink emits one name-only call, no automatic duplicates/properties, and degrades when script/global/network is absent | unit + component | `npm run test:unit -- --run src/test/measurement.test.ts src/test/measurement-page.test.tsx` | ✅ extend existing event/sink suite [VERIFIED: src/test/measurement.test.ts:62-143] |
| MEAS-05 | Summary selects only coarse fields, omits derivation/raw/form/provider values, handles first visit and empty flags, and inserts one human-readable email field | unit + component | `npm run test:unit -- --run src/test/qualify-form.test.tsx src/test/qualify-data.test.ts` | ✅ extend existing payload suite [VERIFIED: src/test/qualify-form.test.tsx:430-481] |
| MEAS-08 | Every event has one literal evidence label; output contains no conversion/customer/delivery/completion claims or percentages | contract | `npm run test:unit -- --run src/test/haoo-report.test.ts src/test/build-output.test.ts` | ❌ Wave 0 / ✅ extend [ASSUMED] |
| MEAS-08 | Browser success/failure copy and summary remain distinct from inbox proof | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx` | ✅ extend existing request/payload suite [VERIFIED: src/test/qualify-form.test.tsx:430-481] |

### Sampling Rate

- **Per task commit:** focused Vitest files for the touched capability plus `npm run typecheck`. [VERIFIED: AGENTS.md:117-121]
- **Per wave merge:** `npm run lint && npm run typecheck && npm test`. [VERIFIED: AGENTS.md:117-121] [ASSUMED]
- **Phase gate:** full suite green; locally generate a fixture report; inspect the provider network payload; submit a uniquely tagged qualification after endpoint activation only when Phase 5 authorizes the live check. [ASSUMED]

### Wave 0 Gaps

- [ ] Add report-domain contracts for the exact event-to-stage/label map, period ranges, integer deltas, provider response validation, and generated accessible HTML. [ASSUMED]
- [ ] Add a fixture-driven Stats API adapter test; tests must never require a live key or network. [ASSUMED]
- [ ] Extend qualification tests with the exact summary label/value and negative sensitive-field table. [ASSUMED]
- [ ] Extend build/source boundaries so Stats API tokens, provider URLs, analytics globals, and report code cannot enter unapproved product files or `dist`. [VERIFIED: src/test/build-output.test.ts:415-516] [ASSUMED]
- [ ] Add a human check for the compact report at narrow width/200% zoom and for screen-reader announcement/order. [ASSUMED]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes, for provider account/API key | Provider account authentication; local process environment holds the bearer key; no report authentication is needed because the artifact remains local. [CITED: https://plausible.io/docs/stats-api] [ASSUMED] |
| V3 Session Management | no application session | Do not create a site session/visitor identity for reporting. Provider account sessions remain provider-owned. [VERIFIED: .planning/phases/03-build-privacy-bounded-engagement-context/03-CONTEXT.md:28-38] |
| V4 Access Control | yes | Do not publish report output; restrict the API key to the owning Plausible team/site and local authorized operator. Plausible says keys are team-scoped. [CITED: https://plausible.io/docs/stats-api] |
| V5 Input Validation | yes | Treat provider JSON as untrusted: exact keys/goals, finite integer counts, bounded row count, valid ISO ranges; escape all generated HTML text. [ASSUMED] |
| V6 Cryptography | yes, delegated | HTTPS to Plausible/FormSubmit and OS/process secret storage; never invent browser encryption or commit a key. Plausible documents TLS 1.2+ in transit. [CITED: https://plausible.io/security] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stats API key leaks into `dist`, logs, stack traces, or HTML | Information Disclosure | No `VITE_*` key; environment-only read; redact errors; negative bundle/output tests. [CITED: https://plausible.io/docs/stats-api] [ASSUMED] |
| Malicious/unexpected provider response injects report HTML | Tampering / XSS | Validate schema and render fixed labels plus numeric text through escaping/text nodes; never trust provider dimension text. [ASSUMED] |
| Unknown goal inflates or changes a stage | Tampering | Reject unknown/duplicate rows and maintain an exhaustive tuple-derived map. [VERIFIED: src/products/haoo.ts:14-25] [ASSUMED] |
| Automatic or duplicated capture silently changes counts | Tampering / Repudiation | Disable automatic capture; one explicit sink; network smoke check; exact call-count tests. [CITED: https://plausible.io/docs/script-extensions] |
| Summary links a person to analytics records | Information Disclosure | Never query analytics during submission; summary derives only from local bounded context. [VERIFIED: .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-CONTEXT.md:22-25] |
| Campaign/free text enters analytics or summary unvalidated | Information Disclosure | Keep analytics name-only; include only the three already normalized campaign keys; never include message/field answers. [VERIFIED: src/measurement/index.ts:41-45] [VERIFIED: src/measurement/index.ts:207-249] |
| Provider outage blocks onboarding or submission | Denial of Service | Catch provider failures and preserve native actions/local context. [VERIFIED: src/measurement/index.ts:314-329] |
| Report semantics overstate evidence | Repudiation | Fixed literal labels, prohibited-copy tests, visible caveat, and no percentages/progression chart. [VERIFIED: .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-CONTEXT.md:16-20] [ASSUMED] |

## Sources

### Primary (HIGH-confidence source authority; MEDIUM session confidence because Context7 was unavailable)

- [Plausible custom event tracking](https://plausible.io/docs/custom-event-goals) — JavaScript name-only call shape, exact goal configuration, no backfill, automatic URL property warning; updated June 10, 2026.
- [Plausible Stats API v2](https://plausible.io/docs/stats-api) — bearer authentication, Business-plan gate, dates, `events`, `event:goal`, filters, response schema; updated August 26, 2026.
- [Plausible script extensions](https://plausible.io/docs/script-extensions) — automatic pageview default and `autoCapturePageviews: false`; updated August 14, 2026.
- [Plausible script installation](https://plausible.io/docs/plausible-script) — site-specific current script; updated August 14, 2026.
- [Plausible security](https://plausible.io/security) — IP/User-Agent processing, daily identifier, rotating salt, EU storage, TLS; updated August 2026.
- [Plausible shared links](https://plausible.io/docs/shared-links) and [embedding](https://plausible.io/docs/embed-dashboard) — report access alternatives and embedding limitation; updated May 2026.
- [FormSubmit documentation](https://formsubmit.co/documentation) — AJAX and named email fields.
- [GitHub Actions secrets](https://docs.github.com/en/actions/reference/security/secrets) — secret handling reference.
- [GitHub workflow artifacts](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts) — artifact access requires repository read access; supports the decision not to use artifacts as the primary private report channel.

### Repository Sources (HIGH confidence)

- `src/products/haoo.ts` — exact event tuple, flags, current provider resolution, disclosure, qualification configuration.
- `src/measurement/index.ts` — context schema, campaign normalization, facade and failure isolation.
- `src/components/QualifyForm.tsx` and `src/components/qualify-form.logic.ts` — serialization/event/fetch order and email-body boundary.
- `src/products/types.ts` — current provider, measurement, disclosure, and qualification types.
- `src/test/*` and `package.json` — active test architecture and exact versions.
- `.planning/phases/03-*/03-CONTEXT.md`, `03-VERIFICATION.md`, Phase 4 `04-CONTEXT.md`, `REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`, and `AGENTS.md` — locked boundaries and project constraints.

### Tertiary (LOW confidence)

- None used as authority. All `[ASSUMED]` items are implementation recommendations or unresolved operational choices, enumerated in the Assumptions Log.

## Metadata

**Confidence breakdown:**

- Standard stack: MEDIUM — repository versions are verified and provider behavior is cited from current official docs, but no Plausible account/configuration exists to probe.
- Architecture: MEDIUM — the static/local-report split follows verified credential and deployment boundaries; owner acceptance of local report access is unconfirmed.
- Pitfalls: MEDIUM — provider pitfalls come from current official docs and code-order inspection; production network behavior remains untested.
- Email enrichment: HIGH for code seam, MEDIUM for final wording — request construction and bounded context are verified; product/privacy owner must approve the sentence and campaign treatment.

**Research date:** 2026-09-01

**Valid until:** 2026-09-08 for Plausible API/script details; 2026-10-01 for stable repository architecture.
