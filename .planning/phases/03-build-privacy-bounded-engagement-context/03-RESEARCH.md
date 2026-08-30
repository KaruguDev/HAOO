# Phase 3: Build Privacy-Bounded Engagement Context - Research

**Researched:** 2026-08-30
**Domain:** Privacy-bounded client-side measurement, Web Storage, URL normalization, and accessible disclosure
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Analytics Destination
- **D-01:** Ship a measurement adapter now and wire a provider later. Phase 3 delivers a typed event API with a no-op sink; the provider is supplied by a build-time environment variable, following the Phase 2 D-04 precedent for the FormSubmit endpoint. This resolves the STATE blocker that no analytics account may exist, keeps third-party script out of the bundle until someone deliberately activates it, and makes MEAS-07 the default behavior rather than a fallback path. Phase 4's aggregate counts stay theoretical until an account exists — that is an accepted, named consequence. — **Reversibility:** reversible — attaching a provider is a single configuration value and one sink implementation behind the existing API.
- **D-02:** With no provider configured, an emitted event is validated against the allowlist and then discarded. No queue, no in-memory buffer, no retry. A buffer of engagement events is the raw clickstream MEAS-03 rules out, even transiently. The browser-context flags still update, so the Phase 4 summary works with zero analytics configured.
- **D-03:** All storage and analytics access lives in one new `src/measurement/` module, and that module is the only path granted the storage/analytics tokens in `PRODUCT_SOURCE_BOUNDARY` (`src/test/build-output.test.ts:54-89`). `ProductPage.tsx`, `BrochurePanel.tsx`, `OnboardingChoices.tsx`, `ProductsSection.tsx`, `ProductHeader.tsx`, `QualifyForm.tsx` and `QualifyFallback.tsx` keep their current boundary rows and call only a typed `track(event)` / `readContext()` API. This extends the Phase 2 precedent of narrowing the boundary per file rather than deleting regexes, keeps the privacy rules auditable in one place, and leaves component tests free of browser-API stubs. — **Reversibility:** costly — the boundary map, the call sites, and the component tests are all built around the module seam; dissolving it later means re-auditing every product source file.
- **D-04:** The measurement module is product-generic; the product definition in `src/products/haoo.ts` supplies the product key and any product-specific signal configuration. Matches Phase 1 D-17 and Phase 2 D-11 — a second product reuses the shell without copying structure — and keeps HAOO literals confined to `haoo.ts`.

### Signal Allowlist and Campaign Parameters
- **D-05:** An analytics event is a name and nothing else — a closed TypeScript union of literal event names covering: HAOO page view, brochure preview, brochure open, brochure download, qualification start, qualification submit, assisted contact via WhatsApp, via phone, via email, and self-onboarding click. There is no property bag, so there is no channel through which a name, county, or free-text value can leak. The compiler enforces MEAS-02 statically and a runtime guard rejects anything dynamic. — **Reversibility:** costly — adding properties later means re-opening the MEAS-02 argument and re-testing every emission site; the no-props rule is what makes the allowlist self-enforcing.
- **D-06:** No qualification form value reaches analytics. Role, portfolio band, county and timeframe were made coarse in Phase 2 (D-16 through D-19) so Phase 3 *could* reuse them, and this phase declines to: `qualify_submit` fires as a bare count. Those values already reach the HAOO inbox by email; a second copy in an analytics provider creates a re-identification surface on a low-volume funnel (a 200+ landlord in a small county is close to unique) for reporting Phase 4 never promised. Upholds the standing "no analytics-to-lead identity join" decision.
- **D-07:** Campaign allowlist is exactly `utm_source`, `utm_medium`, `utm_campaign`. Each value is lowercased, trimmed, stripped to `[a-z0-9-]`, and truncated to roughly 32 characters; a value that does not survive normalization intact is dropped rather than partially kept. `utm_term` and `utm_content` are excluded outright — term carries visitor search text and content carries ad-creative identifiers, both classic routes for personal data to arrive in a URL (MEAS-06).
- **D-08:** Campaign parameters are read once on load, normalized, then removed from the address bar with `history.replaceState` back to the clean `/products/haoo/` URL — the same technique `src/App.tsx` already uses to clear `?contact=success`. A shared or bookmarked link then carries no campaign tail and a rogue parameter cannot survive a refresh. This needs `window.location`, currently in `ALWAYS_FORBIDDEN`, so it belongs inside the measurement module per D-03.

### Browser Engagement Context
- **D-09:** The browser remembers exactly three things: a visit band (`first` / `returning` / `frequent`, crossing at 2 and 4 visits, with the counter saturating at the top band so it never becomes a fingerprint), a last-seen date band (`today` / `this-week` / `this-month` / `earlier`), and a fixed set of interaction flags mirroring the event names — viewed brochure, downloaded brochure, started the form, clicked an assisted-contact channel, clicked self-onboarding. No first-seen date, no session count, no raw counts, no identifier. This is precisely what Phase 4 needs to write a sentence like "returning visitor, downloaded the brochure" and nothing more (MEAS-03).
- **D-10:** Persist as a single JSON record in `localStorage` under one namespaced, schema-versioned key (shape: `zph.haoo.ctx.v1`). Every read is validated against the schema; a record that is unparseable, of an unknown version, or older than roughly 180 days is discarded and rebuilt from scratch. Retiring a schema is a version bump. `localStorage` rather than `sessionStorage` because the repeat-visit signal PROJECT.md explicitly wants is meaningless without cross-session persistence; the expiry answers the pending Kenya Data Protection Act review noted in STATE. — **Reversibility:** costly — the key name and schema version are a published client-side contract; changing the shape later strands existing visitors' records (they age out rather than migrate, which is acceptable but is a real data loss).
- **D-11:** Every storage read and write is wrapped. On failure or unavailability the module swaps to an in-memory record for the page life, so flags set earlier in the same visit still work and the visitor is simply treated as a `first` visit with no history — a legitimate coarse answer, not an error state. No caller anywhere in the page branches on whether storage worked (MEAS-07).
- **D-12:** The visitor can clear the stored context themselves. A plain "Clear what this page remembers" control in the disclosure block wipes the key and confirms through the existing `role="status"` pattern. It turns the disclosure from a statement into something actionable and gives the pending privacy review something concrete.

### Disclosure
- **D-13:** The disclosure lives as an expandable block inside the existing `#qualify` section. The one-line notice near the submit control stays visible; an expander beneath it holds the full detail and the D-12 clear control. This is the "expandable what-we-collect list" that Phase 2 explicitly deferred to Phase 3, it sits where consent is given, and it needs no new static route.
- **D-14:** A "How we measure this page" link in the product footer anchors to the disclosure block and opens it expanded when reached that way. A visitor who reads the brochure and clicks WhatsApp without ever scrolling to the form is measured from their first page view and must still be able to find the notice (MEAS-04).
- **D-15:** The expanded disclosure names every signal explicitly in plain language ("that you opened the brochure", "that you started this form") plus the three stored items, paired with a matching "never collected" list — message text, exact portfolio numbers, exact location, name or contact details, and any identifier that follows you across sites. Because the allowlist is a closed union (D-05), a test can fail the build when an event exists with no corresponding disclosure line, keeping the copy honest by construction.
- **D-16:** The Phase 2 notice in `src/products/copy.ts:109` ("In future, a short summary of how you used this page will be included…") is rewritten to present tense naming the real signals, and the new wording goes through a blocking human checkpoint before it ships. Phase 2's exact wording was approved by the product owner at a blocking checkpoint, so superseding it gets the same gate — the protocol already used for the Kenyan county codepoints and the response-time sentence. **Constraint for the drafter:** the summary itself does not ship until Phase 4, so the rewritten sentence must describe what is true after Phase 3, not after Phase 4. Do not let the tense change create the very promise-versus-payload gap the v1 milestone audit already flags.

### the agent's Discretion
No decisions were explicitly delegated. Downstream agents retain discretion over module file layout inside `src/measurement/`, exact function and type names, the precise band threshold constants and expiry window, how the event-to-disclosure-line test is structured, expander markup and styling, footer link placement, and copy wording — subject to the D-16 checkpoint for the collection notice — provided the decisions above and the existing accessibility conventions are preserved.

### Deferred Ideas (OUT OF SCOPE)
- **Site-wide `/privacy/` route** — the conventional home for a full privacy notice and the strongest answer for the pending legal review, but it is a new static route and a site-wide scope expansion beyond the HAOO funnel. Revisit when privacy/legal ownership completes the Kenya Data Protection Act review named in STATE.
- **Dedicated `#privacy` section with its own product-nav entry** — considered and rejected in D-13; it separates the disclosure from the moment of consent and adds a nav item competing with the conversion path.
- **Segment analytics on role and portfolio band** — rejected in D-06 for v1. Revisit only if funnel volume grows enough that coarse segments stop being re-identifying, and only with an explicit privacy decision.
- **Dev-mode console logging of emitted events** — considered under D-02 and left out to keep the no-op sink genuinely inert. Revisit if funnel debugging proves painful.
- **Attaching the engagement summary to the qualification email** — Phase 4 (MEAS-05). Phase 3 produces the signals; it must not write a summary into the payload.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MEAS-02 | Analytics events use a closed allowlist and contain no personal, exact, free-text, or stable identity data. | Use a literal tuple-derived union, a runtime membership guard, and a sink signature that accepts only the event name. Keep form values outside the measurement module. |
| MEAS-03 | Browser stores only bounded visit/date bands and interaction flags, with no UUID, clickstream, or cross-site identity. | Use one schema-versioned record, total runtime validation, idempotent flag updates, no event queue, and a storage adapter that falls back to page-memory. The count/date implementability conflict below must be resolved before the schema is frozen. |
| MEAS-04 | Visitor can read the measurement and engagement-summary disclosure. | Use native `details`/`summary`, a persistent one-line collection notice, explicit collected/never-collected lists, footer discoverability, and a clear control with status feedback. |
| MEAS-06 | Campaign parameters are allowlisted and normalized before use and never contain personal information. | Parse only the three locked names; trim/lowercase, validate the entire canonical candidate against the character allowlist, truncate, reject duplicates and invalid values, then strip the URL. Never “clean” an invalid value into an accepted one. |
| MEAS-07 | The journey remains functional when analytics or storage is unavailable. | The default sink discards immediately; every storage/history boundary catches failures; controls retain native destinations and form submission never depends on measurement success. |
</phase_requirements>

## Summary

Phase 3 should be planned as a narrow client-side seam, not as an analytics integration. The existing stack already provides every implementation and test primitive needed: TypeScript for the closed event vocabulary, browser APIs for same-origin bounded persistence and URL cleanup, React for emission sites and disclosure state, and Vitest/jsdom for pure and component contracts. No package and no third-party script should be added. [VERIFIED: package.json:6-40] The Vite build variable is public build data, not a secret, because `VITE_` values are exposed to client code and statically replaced at build time. [CITED: https://vite.dev/guide/env-and-mode.html]

The implementation should lead with one production-quality tracer: initialize a product-generic measurement instance for HAOO, validate and discard a page-view event through the no-op sink, update/read the bounded context through the wrapped storage seam, parse and remove campaign parameters, and prove the page still renders with storage throwing. Only after that tracer passes should the remaining brochure, form, and onboarding emission sites and the full disclosure be expanded. This preserves the existing per-file capability boundary: the current product sources are explicitly forbidden from touching storage, analytics, or ambient browser context. The exact prohibited patterns are quoted as `/localStorage|sessionStorage|document\.cookie|indexedDB/`, `/gtag\(|dataLayer|analytics\./`, and `/document\.referrer|navigator\.userAgent|window\.location/`. [VERIFIED: src/test/build-output.test.ts:54-61]

There is one hard planning blocker in D-09/D-10. A persisted record containing only `visitBand`, a relative `lastSeenBand`, and flags cannot distinguish visit 2 from visit 3 to cross at visit 4; cannot recompute a relative date band as time passes; and cannot determine whether roughly 180 days elapsed. Web Storage does not add timestamps or expiry. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage] The plan must obtain a decision before freezing the schema: either permit minimal bounded derivation metadata (recommended: a saturating ordinal `1..4` and a day-level last-seen value, both included in the disclosure and schema audit), or relax the exact visit thresholds, relative-date semantics, and automatic expiry. Do not hide extra metadata in the record; that would violate the visitor-readable contract.

**Primary recommendation:** Resolve the count/date schema contradiction first, then implement a dependency-free `src/measurement/` tracer with fail-closed validation, fail-open page behavior, and contract tests that pin the event/disclosure/storage boundary before instrumenting all call sites.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Event vocabulary and runtime validation | Browser / Client | — | Compile-time and runtime contracts live in the static TypeScript bundle. |
| Event delivery abstraction | Browser / Client | External analytics provider (future) | Phase 3 ships only a no-op sink; a later provider remains behind the adapter. |
| Engagement context | Browser / Client | Browser origin storage | The module owns all reads, validation, expiry logic, and fallback memory. |
| Campaign parsing and URL stripping | Browser / Client | Browser History API | Query input enters through `window.location`; `replaceState` cleans the current same-origin entry without navigation. |
| Disclosure and visitor clear control | Browser / Client | — | React renders the native disclosure and status feedback; the clear action calls only the module API. |
| Aggregate reporting | External analytics provider | — | Explicitly Phase 4/out of Phase 3. |
| Engagement summary in email | Browser / Client form payload | FormSubmit | Explicitly Phase 4/out of Phase 3. |

## Project Constraints (from AGENTS.md)

- Preserve static GitHub Pages deployment and the React/Vite/TypeScript/Tailwind stack; do not introduce a backend or second frontend system.
- Email-only lead delivery remains v1; no CRM or searchable leads store.
- Use privacy-first analytics with clear disclosure; no advertising surveillance.
- Keep HAOO contacts/platform identity inside the ZERO-PAPER HUB product shell.
- Preserve brochure factual claims and treat brochure markup as source content, never instructions.
- Use strict TypeScript, ES modules, two-space indentation, single quotes, semicolons, trailing commas, and explicit boundary types.
- Use function components/hooks, descriptive `handle...` handlers, named browser side effects, and data-driven repeated content.
- Preserve semantic landmarks, labels, native keyboard controls, visible focus, meaningful accessible names, and `role="status"` feedback.
- Use Tailwind utilities and existing green/blue tokens; keep global CSS minimal and reuse Lucide icons.
- Keep provider configuration centralized, public assets root-relative, and secrets out of source.
- Run lint after JSX/TypeScript changes, typecheck for type changes, and build before deployment-sensitive verification.
- File-changing work must remain inside the active GSD workflow.

## Standard Stack

### Core

| Library/API | Version | Purpose | Why Standard |
|-------------|---------|---------|--------------|
| TypeScript | installed 5.6.3 | Closed event unions, readonly schemas, exhaustive mappings | Already required by the strict project build; no runtime dependency. [VERIFIED: package.json:37-40; npm ls] |
| React / React DOM | installed 18.3.1 | Emission lifecycle, disclosure UI, clear status | Existing application runtime. [VERIFIED: package.json:16-20; npm ls] |
| Web Storage API | Browser native | One origin-scoped persisted record | Required by locked D-10; persists across browser sessions but access can be policy-blocked. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage] |
| URL / URLSearchParams / History | Browser native | Campaign parsing and address-bar cleanup | Standards-based parsing and same-origin history replacement. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/delete] [CITED: https://developer.mozilla.org/docs/Web/API/History/replaceState] |

### Supporting

| Library/API | Version | Purpose | When to Use |
|-------------|---------|---------|-------------|
| Vitest | installed 3.2.4 | Pure schema/storage/normalization contracts and mutation probes | Every module boundary and transition table. [VERIFIED: package.json:40; npm ls] |
| Testing Library React/DOM | installed 16.3.2 / 10.4.1 | User-observable event emission, disclosure, and degradation tests | React call-site and accessibility integration. [VERIFIED: package.json:23-24; npm ls] |
| jsdom | installed 26.1.0 | Storage/history simulation in unit tests | Browser-bound module and page tests. [VERIFIED: package.json:34; npm ls] |
| Native `details`/`summary` | Browser native | Expandable disclosure | Correct semantic disclosure widget; `summary` must be the first child. [CITED: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native APIs + small local module | Analytics SDK | Rejected by locked D-01: adds provider code before activation and expands the data surface. |
| Hand runtime type guards | Schema-validation package | Unnecessary for one tiny closed record; a package increases bundle and supply-chain surface without simplifying the finite checks. |
| Native disclosure | Custom accordion | Adds keyboard/ARIA state machinery that the platform already supplies. |

**Installation:** None. Do not add packages in Phase 3.

## Package Legitimacy Audit

Not applicable. The recommended implementation installs no external packages and uses only dependencies already locked in the repository.

## Architecture Patterns

### System Architecture Diagram

```text
/products/haoo/ load
        |
        v
measurement.initialize(product measurement config)
        |-----------------------> read URL query once
        |                              |
        |                              v
        |                    allowlist + whole-value validation
        |                              |
        |                    valid -> page-memory campaign context
        |                    invalid -> discard
        |                              |
        |                              v
        |                    history.replaceState(clean route)
        |
        v
wrapped context read -> parse JSON -> validate version/shape/age
        | valid                         | invalid/expired/throws
        v                               v
bounded persisted record          fresh page-memory record
        |
        v
typed track(eventName) <----- ProductPage / Brochure / Form / Onboarding
        |
        +--> runtime allowlist guard -> no-op sink (discard; no queue)
        |
        +--> idempotent interaction-flag reducer -> wrapped write

footer link -> #measurement-disclosure -> native disclosure opens
clear control -> measurement.clearContext() -> remove key + fresh memory -> role=status
```

### Recommended Project Structure

```text
src/
├── measurement/
│   ├── events.ts          # closed event tuple/union, runtime guard, flag mapping
│   ├── campaign.ts        # pure allowlist/normalization functions
│   ├── context.ts         # schema guard, transitions, expiry, storage adapter
│   └── index.ts           # configured facade: initialize/track/read/clear
├── products/
│   ├── types.ts           # product-generic measurement configuration shape
│   └── haoo.ts            # HAOO product key, event names/config, disclosure lines
├── components/
│   └── MeasurementDisclosure.tsx
└── test/
    ├── measurement.test.ts
    └── measurement-page.test.tsx
```

The exact split is discretionary; keeping pure reducers and validators separate from browser I/O materially improves testability while maintaining one public `src/measurement/` boundary.

### Pattern 1: Tuple-Derived Event Union and Total Disclosure Map

**What:** Define the ten names once as a readonly tuple, derive the TypeScript union, validate dynamic inputs with membership, and require a `Record<EventName, string>` disclosure map. A missing or extra disclosure line then fails typecheck.

**When to use:** Every event emission and every visitor-facing signal list.

```typescript
// Source values: D-06 explicitly fixes `qualify_submit` as a bare event.
// [VERIFIED: .planning/phases/03-build-privacy-bounded-engagement-context/03-CONTEXT.md:28-31]
const EVENT_NAMES = ['qualify_submit'] as const;
type EventName = (typeof EVENT_NAMES)[number];

const disclosureByEvent: Record<EventName, string> = {
  qualify_submit: 'that you tried to send the qualification form',
};
```

The production tuple must contain all ten locked meanings. Avoid accepting `string` at ordinary component call sites; reserve the runtime guard for configuration or other dynamic boundaries.

### Pattern 2: Parse → Validate → Reduce → Persist

**What:** Treat localStorage JSON as attacker-controlled input. Parse in a try/catch, validate every key/value and reject unknown versions or extra fields, reduce via pure transition functions, then serialize the known record only.

**When to use:** Initialization, every tracked interaction, reads for Phase 4, and clear/reset.

**Why:** Any same-origin script or a visitor can mutate localStorage. OWASP recommends validating client-side stored data before consuming it. [CITED: https://owasp.org/www-project-developer-guide/assets/exports/OWASP_Developer_Guide.pdf]

### Pattern 3: Fail-Open Journey, Fail-Closed Data

**What:** Invalid campaign/storage/event input is discarded; measurement exceptions never escape into product components. The page, form, brochure links, and onboarding destinations remain native and independent.

**When to use:** Every browser/provider boundary.

**Implementation rule:** Catch `localStorage` property access itself, not only `getItem`/`setItem`; policy can throw a `SecurityError` when the property is accessed. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage] Catch `replaceState` too because invalid/same-origin/frequency conditions can throw. [CITED: https://developer.mozilla.org/docs/Web/API/History/replaceState]

### Pattern 4: Whole-Value Campaign Acceptance

**What:** Canonicalize only by trimming and lowercasing; require the entire result to match the allowed character class; then truncate to the chosen bound. Reject duplicates and any candidate containing a forbidden character.

**When to use:** `utm_source`, `utm_medium`, and `utm_campaign` only. The exact names are quoted verbatim from D-07. [VERIFIED: .planning/phases/03-build-privacy-bounded-engagement-context/03-CONTEXT.md:28-32]

**Why:** Replacing invalid characters launders a value such as an email address into an accepted token. Whole-value validation honors “dropped rather than partially kept.” Multiple values for one key should be rejected rather than silently selecting a first/last value; this closes HTTP/query parameter pollution ambiguity. [CITED: https://wiki.owasp.org/images/d/d4/OWASP_Application_Security_Verification_Standard_4.0-en.pdf]

### Pattern 5: One-Shot, Observable UI Semantics

**What:** Guard page-view, brochure-preview, and qualification-start emissions so lifecycle quirks or multiple responsive preview elements cannot double-count one observation. Outbound clicks remain per activation. `qualify_submit` fires only after client validation admits the network attempt, never for a validation-blocked click.

**When to use:** React effects and controls rendered in multiple positions.

**Important seam:** `BrochurePanel` currently renders both a mobile image and desktop object and hides them with CSS breakpoints. [VERIFIED: src/components/BrochurePanel.tsx:30-64] Both can load in the DOM, so a shared component ref must deduplicate the preview signal. `OnboardingChoices` renders at the exact positions `'opening'`, `'mid-page'`, and `'closing'`. [VERIFIED: src/components/OnboardingChoices.tsx:10-24] All three instances emit the same channel event names.

### Anti-Patterns to Avoid

- **Event property bag:** It reopens a path for form values and identity; keep `track(name)` only.
- **Queue/retry/debug buffer:** Even transient storage of ordered events is the prohibited clickstream.
- **Catch only writes:** Storage may throw on access, read, write, or removal.
- **Permissive JSON coercion/defaulting:** Reject unknown/malformed records wholesale; do not salvage attacker-controlled fields.
- **Regex replacement of forbidden campaign characters:** Reject the complete canonical value instead of laundering it.
- **Provider URL from an env var:** A public arbitrary script URL is an injection boundary, not a provider selector. A future provider must be a closed build-time selector mapped to audited code.
- **Measure rendered link availability as a click:** Emit only on the actual outbound activation; wording must remain browser-observable.
- **Put storage access in components:** This breaks the static capability boundary and makes graceful degradation branch through the UI.
- **Rewrite all query/hash state accidentally:** D-08 explicitly wants the canonical clean HAOO route; encode that exact outcome in a test rather than relying on incidental string concatenation.
- **Claim the Phase 4 summary is already attached:** Phase 3 discloses future voluntary association but does not add the email field.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL parsing | String splitting/regex parser | `URL` and `URLSearchParams` | Handles decoding, duplicate keys, and structured query access. |
| History cleanup | Navigation or `location` assignment | `history.replaceState` with the same-origin clean path | Updates the current address without loading another document. |
| Disclosure interaction | Div/button accordion state machine | Native `details`/`summary` | Platform keyboard and disclosure semantics. |
| Unique visitor identity | UUID/cookie/fingerprint | No identifier at all | Explicitly prohibited and unnecessary for aggregate counts/context. |
| Runtime schema library | New package for a tiny record | Exhaustive local type guards | Finite schema is simple; no new dependency is justified. |
| Storage expiry service | Timer/background scheduler | Validate age on every read | Static pages have no reliable background process; stale records are discarded when encountered. |

**Key insight:** The difficult part is not sending events; it is proving there is no accidental channel for anything else. Make the event API, schema, URL parser, and disclosure map finite and total, then make tests enumerate every accepted and rejected value.

## Common Pitfalls

### Pitfall 1: Impossible Band Derivation
**What goes wrong:** The implementation invents hidden counters/timestamps, promotes too early, or never ages/expires records.
**Why it happens:** Relative bands lose the source information required for exact threshold and elapsed-time calculations.
**How to avoid:** Resolve D-09/D-10 before schema implementation. Prefer explicitly disclosed, bounded derivation metadata over hidden fields.
**Warning signs:** A transition function accepts only the old band yet claims exact visit 4; expiry code has no absolute/day reference.

### Pitfall 2: StrictMode or Responsive Double Emission
**What goes wrong:** Page view or preview counts twice in development/tests or when both hidden responsive preview nodes load.
**Why it happens:** React StrictMode is active at the root, and CSS-hidden nodes still exist. [VERIFIED: src/main.tsx:1-10; src/components/BrochurePanel.tsx:30-64]
**How to avoid:** Use one-shot guards around observation events and test inside `StrictMode`; keep flag reducers idempotent.
**Warning signs:** Two sink calls from a single render/load.

### Pitfall 3: Storage Availability Detection Lies
**What goes wrong:** Checking `'localStorage' in window` passes, then access or set throws under privacy policy/quota.
**Why it happens:** API presence does not imply permission or writable capacity.
**How to avoid:** Wrap property access and every operation; use page-memory after the first failure without exposing a storage-health branch to callers.
**Warning signs:** Product components contain try/catch or test storage availability.

### Pitfall 4: Invalid Campaign Values Become Valid-Looking
**What goes wrong:** `john@example.com` becomes `johnexamplecom` and is retained.
**Why it happens:** Character stripping is implemented with replacement before acceptance.
**How to avoid:** Trim/lowercase, validate the whole candidate, reject invalid candidates, then truncate valid ones.
**Warning signs:** A test expects punctuation to disappear rather than the value to be absent.

### Pitfall 5: Form Data Leaks by Convenience
**What goes wrong:** Role/county/message is threaded into `track` or a generic event payload.
**Why it happens:** Analytics APIs commonly encourage property bags.
**How to avoid:** Make the sink and public API accept exactly one union value; static-scan the measurement sources and bundle for forbidden field names and identifiers.
**Warning signs:** `Record<string, unknown>`, spread syntax, `FormData`, or `QualifyValues` imported into measurement.

### Pitfall 6: Clearing Storage Does Not Clear Memory
**What goes wrong:** The localStorage key is removed but `readContext()` still returns the pre-clear module-memory snapshot.
**Why it happens:** Persistent and in-memory paths diverge.
**How to avoid:** Clear both layers atomically, replace with a fresh bounded record, and test immediate read-after-clear plus subsequent flag updates.
**Warning signs:** Refresh is required before the UI reports a reset.

### Pitfall 7: Disclosure/Event Drift
**What goes wrong:** A new event ships without visitor-visible notice.
**Why it happens:** Code and copy are separate arrays.
**How to avoid:** Use an exhaustive `Record<EventName, DisclosureLine>` and assert the rendered lines equal the event allowlist one-for-one.
**Warning signs:** Tests only use `toContain` for a few copy fragments.

### Pitfall 8: Legal Approval Mistaken for Technical Verification
**What goes wrong:** A green suite is treated as Kenya Data Protection Act approval.
**Why it happens:** Data minimization and transparency controls are testable, but lawful basis, processor, retention rationale, and notice approval require accountable ownership.
**How to avoid:** Preserve the blocking human checkpoint for D-16 and the STATE privacy/legal blocker. Kenya's Act requires transparency, purpose limitation, minimization, retention limitation, and privacy by design; its regulations require a justifiable, disclosed retention rationale. [CITED: https://new.kenyalaw.org/akn/ke/act/2019/24/eng%402019-11-15] [CITED: https://new.kenyalaw.org/akn/ke/act/ln/2021/263/eng%402022-12-31]
**Warning signs:** Plan language says “legally compliant” based only on unit tests.

## Code Examples

### Wrapped Storage Boundary

```typescript
// Source: MDN localStorage documents policy-based SecurityError and session persistence.
// https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
function readStoredValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
```

In production, the adapter must retain a page-memory record after failure; returning `null` alone is not enough for D-11.

### Campaign Removal Without Navigation

```typescript
// Source values quoted verbatim from D-07/D-08.
// [VERIFIED: .planning/phases/03-build-privacy-bounded-engagement-context/03-CONTEXT.md:28-32]
const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;

function removeCampaignTail() {
  try {
    window.history.replaceState(null, '', '/products/haoo/');
  } catch {
    // URL cleanup is enhancement-only; the journey remains usable.
  }
}
```

`replaceState` requires a same-origin valid URL and can throw `SecurityError`; `null` state avoids serialization concerns. [CITED: https://developer.mozilla.org/docs/Web/API/History/replaceState]

### Native Disclosure That Can Be Opened From the Footer

```tsx
// Source: WHATWG/MDN native disclosure semantics.
// https://html.spec.whatwg.org/dev/interactive-elements.html
<details ref={disclosureRef} id="haoo-measurement-disclosure">
  <summary>How we measure this page</summary>
  <p>Plain-language collected and never-collected details.</p>
</details>
```

The footer handler should set `disclosureRef.current.open = true` before/while navigating the fragment, without replacing native anchor behavior.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Provider SDK first | Provider-neutral event contract first | Locked for Phase 3 | Privacy and no-provider behavior are testable before account selection. |
| Arbitrary event properties | Literal event names only | Locked for Phase 3 | Compiler and runtime guard close the form-data leakage channel. |
| Raw sessions/timestamps/clickstreams | Bounded bands and flags | Locked for Phase 3 | Minimizes identifiability, but requires the derivation-metadata decision documented above. |
| Custom accordion | Native `details`/`summary` | Baseline browser support since 2020 | Less custom accessibility state; still test across supported platforms. [CITED: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details] |

**Deprecated/outdated:**
- Treating client-side environment variables as secrets: Vite explicitly exposes `VITE_` values in the client bundle. [CITED: https://vite.dev/guide/env-and-mode.html]
- Testing only storage API presence: browsers can expose the API while policy or quota makes operations fail. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Rejecting duplicate campaign keys is the safest interpretation of “allowlisted and normalized before use.” | Architecture Pattern 4 | If product ownership expects first-value semantics, attribution behavior differs; privacy remains fail-closed. |
| A2 | `qualify_submit` should fire only when validation passes and a network attempt begins. | Architecture Pattern 5 | Counts differ if ownership defines a submit as any click, including validation failures. |
| A3 | Brochure preview means the first successful preview load/availability observation, deduplicated across responsive nodes. | Architecture Pattern 5 | Counts differ if ownership defines preview as section visibility or explicit user action. |
| A4 | A native `details`/`summary` implementation is acceptable for the locked expandable disclosure. | Standard Stack | Platform-specific accessibility behavior may require a custom tested disclosure control. |

## Open Questions

1. **What derivation metadata may the browser persist? — RESOLVED 2026-08-30**
   - What we know: Exact thresholds at visits 2 and 4, relative age bands, and ~180-day expiry are locked, as is “exactly three things” with no raw count/date.
   - What's unclear: Those outcomes are mathematically impossible from only the three stated fields.
   - Resolution: The product owner approved a capped visit ordinal (`1..4`) and day-level last-seen value as disclosed bounded local derivation metadata. They must remain excluded from analytics events, lead context, and form payloads.

2. **What is the precise brochure-preview observation?**
   - What we know: It originates in `BrochurePanel`, which renders responsive image/object nodes.
   - What's unclear: Successful media load, first viewport visibility, and explicit interaction produce different counts.
   - Recommendation: Count first successful preview availability per page instance; guard both responsive nodes with one ref. Confirm during planning if “viewed” requires viewport observation.

3. **What exactly does the future provider environment variable select?**
   - What we know: Phase 3 has no provider implementation or account, and all unknown/unset states must be no-op.
   - What's unclear: The variable name and future closed provider identifiers are not locked.
   - Recommendation: Define a closed resolver whose only current result is no-op and document it as public build data. Do not accept a script URL or arbitrary provider code.

4. **Where does normalized campaign context go in Phase 3?**
   - What we know: Event payloads have no properties; the persistent record contains only visit/date/flags; Phase 4 owns the email summary.
   - What's unclear: The locked context requires read/normalize/remove but names no Phase 3 consumer.
   - Recommendation: Retain only the accepted values in page-lifetime module memory for the future adapter seam, never in the event or localStorage record; discard them with the page. If there is no approved consumer, URL cleanup plus a pure parser contract is sufficient and safer.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | build/tests | ✓ | 24.12.0 locally; CI pins 22 | CI Node 22 is authoritative. [VERIFIED: .github/workflows/deploy.yml:31-35] |
| npm | build/tests | ✓ | 11.6.2 | — |
| Vite | static build/env replacement | ✓ | installed 5.4.8 | — |
| Vitest | automated contracts | ✓ | installed 3.2.4 | — |
| jsdom | browser API tests | ✓ | installed 26.1.0 | Minimal explicit fakes for exceptional storage/history paths. |
| Analytics account/provider | live aggregate delivery | ✗ / not configured | — | Locked no-op sink; Phase 3 still completes. |

**Missing dependencies with no fallback:** None for Phase 3 implementation.

**Missing dependencies with fallback:** Analytics provider/account — use the required no-op sink; live aggregate counts remain Phase 4/activation work.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + Testing Library React 16.3.2 + jsdom 26.1.0 |
| Config file | `vite.config.ts` plus shared `src/test/setup.ts` |
| Quick run command | `npm run test:unit -- src/test/measurement.test.ts src/test/measurement-page.test.tsx` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MEAS-02 | Ten-name closed union/runtime guard; no property bag/form values/stable identifiers; disclosure is exhaustive | unit + static contract | `npm run test:unit -- src/test/measurement.test.ts src/test/build-output.test.ts` | ❌ Wave 0 / ✅ extend existing |
| MEAS-03 | Valid schema, exhaustive malformed/unknown/expired rejection, bounded transitions, idempotent flags, no clickstream/UUID | unit transition table | `npm run test:unit -- src/test/measurement.test.ts` | ❌ Wave 0 |
| MEAS-04 | One-line notice, native expandable disclosure, exact collected/never list, footer discovery/open, clear status | component/accessibility | `npm run test:unit -- src/test/measurement-page.test.tsx` | ❌ Wave 0 |
| MEAS-06 | Exact three-key allowlist, duplicates, casing/trim, character rejection, length bound, excluded keys, URL stripping | unit table + integration | `npm run test:unit -- src/test/measurement.test.ts` | ❌ Wave 0 |
| MEAS-07 | Throwing access/get/set/remove/replaceState/no provider never breaks page/form/brochure/onboarding | unit + component integration | `npm run test:unit -- src/test/measurement.test.ts src/test/measurement-page.test.tsx` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:unit -- src/test/measurement.test.ts src/test/measurement-page.test.tsx`
- **Per wave merge:** `npm run typecheck && npm run lint && npm run test:unit`
- **Phase gate:** `npm test` green, plus blocking human approval of D-16 copy and the schema-resolution decision before `$gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/test/measurement.test.ts` — pure event, campaign, schema, storage-failure, transition, and clear contracts for MEAS-02/03/06/07.
- [ ] `src/test/measurement-page.test.tsx` — emission-site, StrictMode deduplication, disclosure, footer expansion, and degradation contracts for MEAS-02/04/07.
- [ ] Extend `src/test/build-output.test.ts` — add `src/measurement/` capability grant, prove every component retains the full storage/ambient-browser prohibition, and scan built output for forbidden identity/form keys and absent provider script when unconfigured.
- [ ] Add deterministic clock injection or fake timers for date/expiry transition tests; do not call wall-clock time directly inside reducers.
- [ ] Mutation-probe the campaign table against a “strip invalid characters” implementation and the schema table against a permissive “accept partial/default missing fields” implementation.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No authentication exists in the static product journey. |
| V3 Session Management | no | No session identifier or session store is permitted. |
| V4 Access Control | no | No privileged operations or protected resources in Phase 3. |
| V5 Input Validation | yes | Whole-value allowlist validation for query input; exhaustive guard for parsed storage; reject unknown event names. |
| V6 Cryptography | no | No secrets or sensitive payload should enter measurement; do not add encryption as a substitute for minimization. |
| V8 Data Protection | yes | No personal values/identifiers, one bounded record, disclosed clear/expiry, no event buffer. |
| V14 Configuration | yes | Closed public build-time provider selector; unset/unknown is no-op; no dynamic script URL. |

### Known Threat Patterns for React/Vite Static Measurement

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Personal data smuggled through UTM values | Information Disclosure | Exact key allowlist, whole-value character validation, duplicate rejection, strict length bound, no persistence/event properties, immediate URL cleanup. |
| Same-origin/local user tampers with context JSON | Tampering | Parse as untrusted; exhaustive schema/version validation; reject record wholesale. |
| Analytics configuration injects an arbitrary remote script | Elevation of Privilege / Tampering | Closed provider selector mapped to audited code; never accept a URL; default no-op. |
| Stable ID or high-cardinality context becomes fingerprint | Linkability / Information Disclosure | No UUID/cookie/fingerprint, saturating bounded state, fixed flags, no raw clickstream, no cross-site join. |
| Storage/history exception denies the page | Denial of Service | Exception containment and page-memory/no-op fallback; no caller branches on capability. |
| Disclosure understates actual collection | Repudiation / Information Disclosure | Exhaustive event-to-copy mapping and human approval checkpoint; build fails on drift. |
| XSS reads same-origin localStorage | Information Disclosure | Store no contact data/secrets; preserve React escaping and the existing `dangerouslySetInnerHTML` prohibition. localStorage is accessible to same-origin scripts. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage] |

## Sources

### Primary (HIGH confidence)

- In-repository source files opened this session: `03-CONTEXT.md`, `REQUIREMENTS.md`, `STATE.md`, `AGENTS.md`, `src/test/build-output.test.ts`, `src/products/types.ts`, `src/products/haoo.ts`, `src/products/copy.ts`, `src/pages/ProductPage.tsx`, `src/components/BrochurePanel.tsx`, `src/components/OnboardingChoices.tsx`, `src/components/QualifyForm.tsx`, `src/App.tsx`, `src/main.tsx`, `package.json`, `vite.config.ts`, `.github/workflows/deploy.yml`, and current tests.

### Secondary (MEDIUM confidence)

- https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage — persistence, origin behavior, and policy exceptions.
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API — Web Storage behavior.
- https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/delete — query-key deletion semantics.
- https://developer.mozilla.org/docs/Web/API/History/replaceState — same-origin replacement and exceptions.
- https://vite.dev/guide/env-and-mode.html — public `VITE_` values and static build replacement.
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details — native disclosure semantics.
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/summary — summary placement and toggle behavior.
- https://html.spec.whatwg.org/dev/interactive-elements.html — HTML disclosure model.
- https://owasp.org/www-project-application-security-verification-standard/ — ASVS control framework.
- https://owasp.org/www-project-developer-guide/assets/exports/OWASP_Developer_Guide.pdf — validation of client-side stored data.
- https://new.kenyalaw.org/akn/ke/act/2019/24/eng%402019-11-15 — Kenya Data Protection Act principles, notice, retention, privacy by design.
- https://new.kenyalaw.org/akn/ke/act/ln/2021/263/eng%402022-12-31 — retention schedule, transparency, purpose/storage limitation rules.

### Tertiary (LOW confidence)

- None used as authority. The four interpretations in the Assumptions Log require confirmation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing packages and versions were read from the repository and probed locally; no new dependency is recommended.
- Architecture: HIGH — driven primarily by locked D-01 through D-16 and opened source seams.
- Browser API behavior: MEDIUM — verified against current MDN/WHATWG/Vite documentation through web search rather than Context7, which was unavailable in this agent environment.
- Privacy/legal applicability: MEDIUM — primary Kenya Law text supports minimization/transparency/retention controls, but accountable legal approval remains explicitly blocked in STATE.
- Exact event semantics: MEDIUM — submit/preview/duplicate-UTM interpretations are documented assumptions.
- Stored band schema: HIGH confidence that the present constraints conflict; LOW confidence in any resolution until product/privacy ownership chooses one.

**Research date:** 2026-08-30
**Valid until:** 2026-09-29 for browser/stack guidance; re-check legal/provider decisions immediately before production collection.
