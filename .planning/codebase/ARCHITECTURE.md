---
last_mapped_commit: 7a99cab52f8907ebb43e9618c909ed785d088dbe
---
<!-- refreshed: 2026-09-02 -->
# Architecture

**Analysis Date:** 2026-09-02

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│              Static HTML entry documents (Vite MPA)          │
├──────────────────────────────┬──────────────────────────────┤
│   `index.html` (home)        │  `products/haoo/index.html`  │
│   no body data-page          │  `<body data-page=            │
│                              │   "haoo-product">` + noscript │
└──────────────┬───────────────┴──────────────┬───────────────┘
               │  both load `/src/main.tsx`   │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│   Bootstrap + router-by-attribute                            │
│   `src/main.tsx` → `src/App.tsx` (App reads body.dataset)    │
└──────────┬──────────────────────────────┬───────────────────┘
           ▼                              ▼
┌────────────────────────┐   ┌────────────────────────────────┐
│  HomePage (in App.tsx) │   │  ProductPage shell             │
│  + `ProductsSection`   │   │  `src/pages/ProductPage.tsx`   │
└───────────┬────────────┘   └───────────┬────────────────────┘
            │                            │ composes
            │                            ▼
            │        ┌──────────────────────────────────────┐
            │        │ `src/components/` presentational units│
            │        │ ProductHeader · OnboardingChoices ·   │
            │        │ BrochurePanel · QualifyForm ·         │
            │        │ QualifyFallback · MeasurementDisclosure│
            │        └───────┬──────────────────┬────────────┘
            ▼                ▼                  ▼
┌──────────────────────────────────┐  ┌────────────────────────┐
│ Product data layer               │  │ Measurement facade     │
│ `src/products/` (types, haoo,    │  │ `src/measurement/`     │
│  registry, copy)                 │  │ createMeasurement()    │
└──────────────────────────────────┘  └───────────┬────────────┘
            │                                     │
            ▼                                     ▼
┌──────────────────────────────────┐  ┌────────────────────────┐
│ External form provider (POST)    │  │ `window.localStorage`  │
│ formsubmit.co ajax endpoint      │  │ banded engagement ctx  │
└──────────────────────────────────┘  └───────────┬────────────┘
                                                  │ name-only events
                                                  ▼
                                      ┌────────────────────────┐
                                      │ Plausible browser sink │
                                      │ `src/measurement/      │
                                      │  plausible.ts`         │
                                      └───────────┬────────────┘
                                                  │ aggregate goals
                                                  ▼
── Offline owner-report pipeline (Node, never shipped to the browser) ──
┌─────────────────────────────────────────────────────────────┐
│ `scripts/generate-haoo-report.mjs`  (only credentialed unit) │
│ reads process.env · names provider origin + query path       │
└──────────────────────────┬──────────────────────────────────┘
                           ▼  injected {query, fetch, now, fs}
┌─────────────────────────────────────────────────────────────┐
│ `src/reporting/generate.ts` orchestration                    │
│   ├─ `query-provenance.ts`  echoed-query validation          │
│   ├─ `stats-response.ts`    fail-closed goal-count parsing   │
│   ├─ `haoo-report.ts`       closed label/stage dictionary    │
│   └─ `render.ts`            self-contained HTML document     │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
              `.reports/haoo-funnel-report.html` (gitignored)
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Bootstrap | Mounts React root in StrictMode, imports global CSS | `src/main.tsx` |
| App router | Selects HomePage vs ProductPage from `document.body.dataset.page` | `src/App.tsx` (lines 655-661) |
| HomePage | Marketing home: hero, services, values, contact, company-profile download | `src/App.tsx` |
| ProductsSection | Renders published product cards / nav anchor on home | `src/components/ProductsSection.tsx` |
| ProductPage | Product document shell — hero, capabilities, journey, brochure, qualify; owns measurement lifecycle | `src/pages/ProductPage.tsx` |
| ProductHeader | Product-scoped nav with mobile disclosure | `src/components/ProductHeader.tsx` |
| OnboardingChoices | Assisted (WhatsApp/phone/email) and self-onboarding actions | `src/components/OnboardingChoices.tsx` |
| BrochurePanel | Brochure preview/open/download with fallback copy | `src/components/BrochurePanel.tsx` |
| QualifyForm | Data-driven enquiry form: validation, submit, status region | `src/components/QualifyForm.tsx` |
| Qualify logic | Pure validation/body-building/copy constants for the form | `src/components/qualify-form.logic.ts` |
| QualifyFallback | Direct-contact recovery panel shown after a failed send | `src/components/QualifyFallback.tsx` |
| MeasurementDisclosure | Privacy disclosure + clear-context control | `src/components/MeasurementDisclosure.tsx` |
| Product types | Structural contract every product definition must satisfy | `src/products/types.ts` |
| HAOO definition | All HAOO facts, copy, contacts, qualify schema, measurement config | `src/products/haoo.ts` |
| Registry | Which products are live; slug→route and nav derivation | `src/products/registry.ts` |
| Shared copy | Identity-guarded label builders (`requireIdentity`) | `src/products/copy.ts` |
| Measurement | Privacy-bounded engagement context facade; creates the provider sink on initialize | `src/measurement/index.ts` |
| Plausible sink | Name-only provider adapter: preload queue, `init`, script append, event calls | `src/measurement/plausible.ts` |
| Engagement summary | Pure formatter turning bands + campaign into one email sentence block | `src/products/engagement-summary.ts` |
| Report CLI | Only credentialed module: reads `process.env`, names provider origin and query path | `scripts/generate-haoo-report.mjs` |
| Report orchestration | Capability-injected query→validate→render→atomic-write pipeline | `src/reporting/generate.ts` |
| Report dictionary | Closed event labels, stages, period labels, caveats | `src/reporting/haoo-report.ts` |
| Response parsing | Fail-closed goal-count reader for untrusted provider bodies | `src/reporting/stats-response.ts` |
| Query provenance | Validates the provider echoed back the query that was sent | `src/reporting/query-provenance.ts` |
| Report renderer | Script-free, request-free self-contained HTML document | `src/reporting/render.ts` |
| Coverage guard | Parses a phase COVERAGE.md and enforces required capability decisions | `scripts/verify-phase4-coverage.mjs` |

## Pattern Overview

**Overall:** Data-driven static multi-page app (Vite MPA + React islands), with a reusable product shell fed by declarative product definitions.

**Key Characteristics:**
- **No router library and no server.** Physical HTML documents are the routes; `App` dispatches on a `data-page` body attribute.
- **Product-as-data.** A product is a single `ProductDefinition` object; the shell renders any product that satisfies the type. Adding a product means adding a definition + an HTML entry, not new components.
- **Pure logic split from React.** Form rules live in `qualify-form.logic.ts`; measurement lives in `src/measurement/index.ts` — both testable without rendering.
- **Fail-safe by default.** Storage, provider delivery, campaign parsing and URL cleanup are each wrapped so a failure degrades silently rather than blocking a visitor action.
- **Progressive enhancement.** `products/haoo/index.html` ships a `<noscript>` block duplicating every contact path.
- **Capability injection over imports.** Both `createMeasurement` and `generateHaooReport` take their side-effecting capabilities (`storage`, `location`, `history`, `eventSink`, `fetch`, `now`, `fs`) as parameters, so every branch is testable without touching a real browser, network or disk.
- **Credential containment.** The browser bundle never sees a credential, and the report library never names the provider origin, query path or env-var name — those exist only in `scripts/generate-haoo-report.mjs`.

## Layers

**Entry documents:**
- Purpose: Own SEO metadata, canonical URLs, no-JS fallbacks, and page identity
- Location: `index.html`, `products/haoo/index.html`
- Depends on: `/src/main.tsx` only
- Registered as Rollup inputs in `vite.config.ts`

**Application shell:**
- Purpose: Mount and route
- Location: `src/main.tsx`, `src/App.tsx`
- Depends on: pages, components, product registry

**Pages:**
- Purpose: Whole-document composition and side effects (measurement init, page-view)
- Location: `src/pages/ProductPage.tsx` (HomePage is still inline in `src/App.tsx`)

**Components:**
- Purpose: Presentational units, props-driven, no cross-imports of pages
- Location: `src/components/`
- Depends on: `src/products/types.ts`, `src/products/copy.ts`

**Domain data:**
- Purpose: Single source of truth for product facts and contracts
- Location: `src/products/`
- Depends on: nothing outside itself (leaf layer, plus `import.meta.env`)

**Measurement:**
- Purpose: Local, banded engagement context plus name-only provider delivery
- Location: `src/measurement/index.ts` (facade), `src/measurement/plausible.ts` (provider adapter)
- Depends on: `src/products/types.ts` only

**Reporting (Node-only, not bundled):**
- Purpose: Turn provider aggregates into one owner-facing HTML document
- Location: `src/reporting/` (`generate.ts`, `haoo-report.ts`, `stats-response.ts`, `query-provenance.ts`, `render.ts`)
- Depends on: `src/products/haoo.ts` types only; loaded from `.mjs` via Node native type stripping, so it uses erasable syntax and explicit `.ts` import extensions
- Used by: `scripts/generate-haoo-report.mjs` (`npm run report:haoo`)

## Data Flow

### Product page render

1. Browser loads `products/haoo/index.html`, which sets `data-page="haoo-product"` (`products/haoo/index.html:22`)
2. `src/main.tsx` mounts `<App />` into `#root`
3. `App` reads `document.body.dataset.page` and returns `<ProductPage product={HAOO_PRODUCT} />` (`src/App.tsx:656`)
4. `ProductPage` memoizes `createMeasurement(product.measurement, adapters)` and, once per instance, calls `initialize()` then `track(pageViewEvent)` (`src/pages/ProductPage.tsx:49-62`)
5. Sections render entirely from `HAOO_PRODUCT` fields (`src/products/haoo.ts`)

### Qualify enquiry submission

1. Visitor edits fields; requiredness resolved by `isFieldRequired` including `requiredWhen` conditionals (`src/components/qualify-form.logic.ts:32`)
2. On submit, validation errors return the form to `idle` and render the "There is a problem" summary (`src/components/QualifyForm.tsx:280-289`)
3. Valid submissions set `submitting`, start a 15s `AbortController` timeout, `track(submit)`, then `POST` JSON to `qualify.endpoint` (`src/components/QualifyForm.tsx:296-311`)
4. Terminal state derives from `response.ok` alone — the provider body is never read (`src/components/QualifyForm.tsx:314`)
5. Failure or abort mounts `QualifyFallback` with direct WhatsApp/phone/email recovery

### Engagement context lifecycle

1. `initialize()` reads and validates the stored record; invalid/mismatched-schema records are removed (`src/measurement/index.ts:294-310`)
2. Visit ordinal is capped at 4 and mapped to `first | returning | frequent`; recency mapped to `today | this-week | this-month | earlier`
3. `track(event)` validates the event name, calls the optional `eventSink`, and folds an interaction flag into the stored context
4. `readCampaign()` accepts only `utm_source|medium|campaign` matching `/^[a-z0-9-]+$/` (≤32 chars) then strips all `utm_*` params via `history.replaceState`
5. `clearContext()` removes the record and reports whether removal actually happened

### Provider event delivery

1. On first `initialize()`, campaign params are normalized and stripped **before** any provider script is appended, so automatic capture can never race address-bar cleanup (`src/measurement/index.ts:318-325`)
2. If no `eventSink` adapter was injected, `createPlausibleEventSink(config, providerAdapters)` builds one (`src/measurement/plausible.ts`)
3. The sink installs the documented preload contract — queue `window.plausible.q`, options slot `.o`, `init(options)` with `autoCapturePageviews: false` — then appends the site script once
4. `track(event)` calls `plausible('<name>')` with a bare name only; there is no property bag anywhere in the seam
5. Any throw inside the sink is swallowed by `track`'s `try/catch` — provider delivery never touches the visitor's action

### Owner report generation (offline)

1. `npm run report:haoo` runs `scripts/generate-haoo-report.mjs`, which reads `PLAUSIBLE_STATS_API_KEY` / `PLAUSIBLE_SITE_ID` and exits 1 with a terminal-only sentence if either is blank
2. It injects `{query, fetch, now, fs, outputPath}` into `generateHaooReport` (`src/reporting/generate.ts`)
3. For each of 7/30/90 days plus all-time, an explicit inclusive ISO `date_range` aggregate query is POSTed with the key in the `Authorization` header only
4. Each response passes `validateEchoedQuery` (the provider must echo the site id, metrics, dimensions, goal filter and range) then `parseGoalCounts` (integer, non-negative, no unknown or duplicate goal rows); any refusal aborts before a single byte is written
5. `renderReport` builds the whole document in memory; the writer reserves a fixed `<output>.tmp` sibling exclusively (`openSync(path, 'wx')`), writes, then renames onto the destination — a failed run leaves the previous report byte-identical
6. Output lands in `.reports/haoo-funnel-report.html`, which is gitignored because it carries aggregate business counts

**State Management:**
- React local state only (`useState`/`useRef`) — no store library, no context providers.
- Cross-session state is the single `localStorage` record keyed by `product.measurement.storageKey`; `reconcileContext()` re-reads storage on every access so another tab's clear is never resurrected from cache.

## Key Abstractions

**ProductDefinition:**
- Purpose: Complete declarative description of a product page
- File: `src/products/types.ts`; instance in `src/products/haoo.ts`
- Pattern: Deeply `readonly` interfaces; the shell is generic over the definition

**Measurement facade:**
- Purpose: Bounded interface (`initialize`, `track`, `readContext`, `readCampaign`, `clearContext`)
- File: `src/measurement/index.ts`
- Pattern: Closure-based factory with injectable adapters (`now`, `storage`, `location`, `history`, `eventSink`) for deterministic tests

**Identity guard:**
- Purpose: Fail closed on nameless/slugless products rather than shipping orphan copy or unnamespaced DOM ids
- File: `src/products/copy.ts` (`requireIdentity`)

**Report model:**
- Purpose: The fully computed, fully validated shape the renderer is allowed to render
- File: `src/reporting/render.ts` (`ReportModel`, `ReportPeriodModel`)
- Pattern: All arithmetic and date resolution happen in `generate.ts`; the renderer only escapes and lays out

**Closed reporting dictionary:**
- Purpose: Exactly one owner-facing label per closed event name, one stage per event
- File: `src/reporting/haoo-report.ts`
- Pattern: `Readonly<Record<HaooMeasurementEvent, ...>>` maps, so adding an event or dropping a label fails `npm run typecheck` before any test

**Provider seam:**
- Purpose: A name-only interface to Plausible with every browser capability injectable
- File: `src/measurement/plausible.ts` (`PlausibleGlobal`, `PlausibleScope`, `PlausibleAdapters`)
- Pattern: The *type* encodes the contract — no property-bag parameter exists, so a property bag cannot be sent

**Registry:**
- Purpose: Sole decision point for which products are live; nav presence derived from collection length so nav and section can never disagree
- File: `src/products/registry.ts`

## Entry Points

**Home document:**
- Location: `index.html`
- Triggers: `/` on the deployed Pages site
- Responsibilities: Home metadata; mounts App → HomePage

**HAOO product document:**
- Location: `products/haoo/index.html`
- Triggers: `/products/haoo/`
- Responsibilities: Product metadata, PDF `alternate` link, noscript fallback, `data-page` identity

**Build/deploy:**
- Location: `.github/workflows/deploy.yml`
- Pipeline: checkout → Node 22 → `npm ci` → `typecheck` → `lint` → `build` (with `VITE_HAOO_FORM_ENDPOINT`) → `test:unit` → upload `dist/` → GitHub Pages

**Owner report CLI:**
- Location: `scripts/generate-haoo-report.mjs` (`npm run report:haoo`)
- Triggers: Manual, local, credentialed run by the owner
- Responsibilities: Read env credentials, name the provider origin/query path, write `.reports/haoo-funnel-report.html`

**Red-state guard:**
- Location: `scripts/assert-phase1-red.mjs` (`npm run test:phase1:red`)

**Coverage guard:**
- Location: `scripts/verify-phase4-coverage.mjs` — run manually against a phase `COVERAGE.md`; not wired into `package.json` scripts or CI

## Architectural Constraints

- **No server, no backend.** Everything ships as static assets to GitHub Pages (`CNAME`, `public/.htaccess`). Any dynamic behavior must be client-side or delegated to an external provider.
- **No router library.** Routing is physical: a new page requires a new HTML file registered in `vite.config.ts` `build.rollupOptions.input` AND a matching `data-page` branch in `App`.
- **Threading:** single-threaded browser main thread; no workers.
- **Global state:** module-level constants only (`PRODUCTS`, `HAOO_PRODUCT`, `QUALIFY_ENDPOINT`). No mutable module singletons; the measurement closure is per-instance.
- **Circular imports:** none. Dependency direction is strictly components/pages → products/measurement.
- **Build-time configuration:** `import.meta.env.VITE_HAOO_FORM_ENDPOINT` and `VITE_HAOO_MEASUREMENT_PROVIDER` are resolved at build time with validated fallbacks (`src/products/haoo.ts:129-175`); a missing/invalid var silently falls back to `QUALIFY_ENDPOINT_FALLBACK`.
- **Node-only code must be erasable-syntax TypeScript.** Everything under `src/reporting/` is loaded by a `.mjs` entry through Node's native type stripping (Node >= 22.18.0, enforced by `engines.node`). No enums, no parameter properties, no decorators, and imports must carry explicit `.ts` extensions.
- **Credential boundary.** No module under `src/` may read `process.env`, name the provider origin, or name a credential variable; only `scripts/generate-haoo-report.mjs` may. A source test in `src/test/haoo-report.test.ts` asserts this.
- **Env declaration drift.** `src/vite-env.d.ts` declares only `VITE_HAOO_FORM_ENDPOINT`, while `src/products/haoo.ts` also reads `VITE_HAOO_MEASUREMENT_PROVIDER`, `VITE_HAOO_PLAUSIBLE_SRC` and `VITE_HAOO_PLAUSIBLE_DOMAIN`. Add new vars to both places.
- **Tests assert the shipped artifact.** `src/test/build-output.test.ts` reads `dist/`, so `npm test` runs `build` first; in CI `test:unit` must run *after* Build so the endpoint-bearing artifact is not overwritten.

## Anti-Patterns

### Hardcoding product copy inside components

**What happens:** A label, phone number or heading is written inline in a component under `src/components/`.
**Why it's wrong:** The shell is meant to render any `ProductDefinition`; inline facts silently bind the component to HAOO and break `src/test/product-shell-reuse.test.tsx`.
**Do this instead:** Add the field to `src/products/types.ts`, populate it in `src/products/haoo.ts`, and pass it through props — or add a label builder to `src/products/copy.ts`.

### Unnamespaced DOM ids

**What happens:** An `id="qualify-name"` is used without the product slug.
**Why it's wrong:** Two product documents built from the same shell would collide, and `aria-describedby` wiring becomes ambiguous.
**Do this instead:** Derive ids from the slug as in `fieldId(slug, field)` / `contentAnchorId(product.slug)` (`src/components/QualifyForm.tsx`, `src/products/copy.ts`).

### Trusting the provider response body

**What happens:** Parsing the form provider's JSON to decide success.
**Why it's wrong:** A provider body change would make the page claim a send that did not happen.
**Do this instead:** Branch on `response.ok` only (`src/components/QualifyForm.tsx:314`).

### Letting measurement fail a visitor action

**What happens:** A `track()`, storage write, or URL cleanup throws and interrupts navigation or submission.
**Why it's wrong:** Measurement is strictly secondary to the journey.
**Do this instead:** Wrap every side effect in `try/catch` and degrade to no-op, as every function in `src/measurement/index.ts` does.

### Rendering provider-controlled text

**What happens:** A goal name, heading or message from the Stats API response is interpolated into the report.
**Why it's wrong:** The provider is an untrusted source across a trust boundary; its strings could carry markup and its labels could rename a stage (threats T-04-03/T-04-04).
**Do this instead:** Render only authored labels from `src/reporting/haoo-report.ts` and integers that survived `parseGoalCounts`, each passed through `escapeHtml` (`src/reporting/render.ts`).

### Writing a partial report

**What happens:** Rendering or writing periods incrementally as each query returns.
**Why it's wrong:** One failed range would produce a document that claims four periods but reports three.
**Do this instead:** Query and validate every range first, render in memory, reserve the temp sibling exclusively, write, then rename (`src/reporting/generate.ts`).

### Sending event properties to the provider

**What happens:** Passing a props object alongside a `plausible()` call, or enabling an automatic-capture option.
**Why it's wrong:** The measurement contract is name-only; automatic pageview capture would also duplicate the explicit page-view event and can race `utm_*` cleanup.
**Do this instead:** Call with a bare closed event name and keep `autoCapturePageviews: false` (`src/measurement/plausible.ts`).

### Storing identifying or unbounded values

**What happens:** Raw timestamps, visit counts, free-text, or arbitrary query params persisted to `localStorage`.
**Why it's wrong:** The product's privacy contract is bands, not identifiers; `parseContext` rejects any record whose key set is not exactly `CONTEXT_RECORD_KEYS`.
**Do this instead:** Add a band or boolean flag, bump `schemaVersion`, and extend `CONTEXT_RECORD_KEYS` together.

## Error Handling

**Strategy:** Fail-open for measurement, fail-visible for the visitor's transaction, fail-closed for identity invariants.

**Patterns:**
- Measurement: every storage/provider/history call in `try/catch`; on failure `storage` is set to `null` and the facade continues in memory-only mode (`src/measurement/index.ts:259-350`)
- Form transport: `AbortController` with `QUALIFY_REQUEST_TIMEOUT_MS = 15_000`; abort and network error converge on the `failed` state that mounts the recovery panel
- Validation: errors surface in a summary heading plus per-field `aria-describedby` messages, never as thrown exceptions
- Identity: `requireIdentity` throws on empty product name/slug (`src/products/copy.ts:7`)
- Corrupt persisted data: rejected and removed rather than migrated
- Report pipeline: every failure path returns `{ ok: false, reason }` rather than throwing; the CLI prints one fixed terminal sentence and exits 1, never writing failure text into the HTML
- Provider responses: validation helpers return `null` inside `try/catch` and never throw (`src/reporting/stats-response.ts`, `src/reporting/query-provenance.ts`)

## Cross-Cutting Concerns

**Logging:** None in browser code. The report CLI writes to `stderr`/`stdout` only, and never logs the credential, the endpoint or the response body. No console logging in production paths; failures are swallowed by design with explanatory comments.

**Validation:** Two independent layers — visitor input via `src/components/qualify-form.logic.ts` (requiredness, email pattern, length, `RESERVED_EMAIL_LABELS` guard against provider-option injection, `_honey` honeypot), and stored/URL data via `parseContext` / `CAMPAIGN_VALUE` in `src/measurement/index.ts`.

**Authentication:** None — the site is fully public; `manage.haoo.online` handles any self-onboarding identity off-site.

**Accessibility:** Treated as an architectural concern, not a component detail — skip link, namespaced landmarks, persistent `aria-live` status region, focus-visible ring tokens, and a dedicated `src/test/focus-contrast.test.ts`.

---

*Architecture analysis: 2026-09-02*
