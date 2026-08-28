# Architecture Research: HAOO Product Funnel

**Project:** Zero-Paper Hub Product Launch Platform  
**Research type:** Architecture  
**Researched:** 2026-08-29  
**Overall confidence:** HIGH for repository-specific decisions; MEDIUM for external-service behavior pending production account activation and verification

## Executive Recommendation

Preserve GitHub Pages and evolve the current single-entry Vite site into a small **multi-page static React application**. Keep the company landing page at `/` and publish HAOO as a physical static entry at `/products/haoo/`. Do not add React Router: the current page already uses fragment identifiers for section navigation, and a browser-routed SPA would require a fallback rewrite that GitHub Pages does not provide as an application runtime. Vite supports multiple HTML entry points, and its documented `base: '/'` setting is correct for a custom-domain GitHub Pages deployment.

Introduce feature boundaries before implementing the funnel. Shared layout and primitives belong under `src/components/`; the reusable product catalog belongs under `src/features/products/`; HAOO content, CTAs, qualification rules, and page composition belong under `src/features/haoo/`; provider-facing analytics and lead-delivery code belong under `src/services/`. `App.tsx` should stop being the owner of every concern.

Keep two intentionally separate data paths:

1. **Aggregate analytics** receives only allowlisted, coarse, non-personal event names and properties.
2. **Lead delivery** receives contact and qualification fields plus a coarse engagement summary only after the visitor voluntarily submits the HAOO form.

Use a provider-neutral analytics interface with a no-op default and a Plausible adapter when configured. Continue native HTML POST submission through FormSubmit for v1, targeting `info@haoo.online`. This maintains progressive enhancement and avoids introducing Supabase, an API, secrets, or a lead database.

## Hosting and Page Topology

### Recommended topology

```text
www.zero-paperhub.com/
├── index.html                         company landing page
├── products/haoo/index.html           dedicated HAOO entry
├── assets/*                           Vite-hashed JS, CSS, and web imagery
└── marketing/haoo/
    └── HAOO-Marketing-Brochure.pdf    stable original-download URL
```

At source level, use two Vite HTML inputs:

```text
index.html
products/haoo/index.html
src/entries/home.tsx
src/entries/haoo.tsx
```

Configure `build.rollupOptions.input` explicitly so CI proves both entries are produced. The existing GitHub Actions job continues uploading a single `dist/` artifact. Direct navigation to `/products/haoo/` resolves to a real generated file, so refreshes and shared links do not depend on a client-side route fallback.

### Why not a router

- The site has only two public page types and no authenticated application navigation.
- Existing `#about`, `#services`, and similar fragments should remain section anchors.
- A hash router would collide conceptually with those anchors and create weaker marketing URLs.
- A history router would make a direct deep link dependent on hosting rewrite behavior.
- A physical HTML entry provides page-specific metadata, a canonical URL, and reliable static delivery with less runtime code.

If the catalog later grows beyond a small number of products, reconsider a build-time route generator or static-site framework. That is not justified for the HAOO launch.

## Component and Module Boundaries

```text
src/
├── entries/
│   ├── home.tsx
│   └── haoo.tsx
├── pages/
│   ├── HomePage.tsx
│   └── HaooProductPage.tsx
├── components/
│   ├── layout/SiteHeader.tsx
│   ├── layout/SiteFooter.tsx
│   ├── navigation/MobileNavigation.tsx
│   └── ui/                       buttons, status notice, section heading
├── features/
│   ├── products/
│   │   ├── productCatalog.ts     typed product metadata
│   │   ├── ProductCard.tsx
│   │   └── ProductsSection.tsx
│   └── haoo/
│       ├── haooContent.ts        brochure-derived factual copy
│       ├── HaooHero.tsx
│       ├── HaooAudience.tsx
│       ├── HaooCapabilities.tsx
│       ├── BrochurePreview.tsx
│       ├── OnboardingChoices.tsx
│       ├── QualificationForm.tsx
│       └── qualification.ts      pure, deterministic lead-band rules
├── services/
│   ├── analytics/
│   │   ├── analytics.ts          interface and typed event contract
│   │   ├── plausible.ts          provider adapter only
│   │   └── noop.ts
│   ├── engagement/
│   │   ├── engagementStore.ts    local coarse state, schema/versioning
│   │   └── leadContext.ts        submitted summary projection
│   └── leads/
│       └── formSubmit.ts         HAOO endpoint/redirect field contract
├── config/site.ts
├── hooks/useInView.ts
└── index.css
```

`HomePage` owns company-page composition; `HaooProductPage` owns product-page composition. Section components receive content and callbacks rather than importing providers directly. Only the analytics adapter knows about `window.plausible`; only the lead integration knows FormSubmit field names and URLs.

The `productCatalog` model should include stable identifiers, name, short description, hero/card asset, status, detail URL, and audience. The home-page Products section renders from this model so adding a later product is data-first rather than another one-off block.

## Client-Side Event Flow

```text
Visitor action
    │
    ├──> section/component callback
    │       │
    │       ├──> engagementStore.record(action)
    │       │       └── local coarse state only; no random user ID
    │       │
    │       └──> analytics.track(typedEvent)
    │               ├── NoopAnalytics when unconfigured/blocked
    │               └── PlausibleAnalytics -> aggregate event sink
    │
    └──> normal browser behavior continues
            link navigation, PDF open/download, tel/mailto/WhatsApp
```

### Typed event vocabulary

Use a small stable vocabulary rather than arbitrary string events:

| Event | Allowed coarse properties |
|---|---|
| `Product Viewed` | `product`, `visitor_status` |
| `Brochure Preview Opened` | `product`, `placement` |
| `Brochure Downloaded` | `product`, `placement` |
| `Qualification Started` | `product`, `visitor_status` |
| `Qualification Submit Attempted` | `product`, `qualification_band`, `visit_band` |
| `Qualification Redirect Returned` | `product` |
| `Assisted Onboarding Clicked` | `product`, `channel`, `placement` |
| `Self Onboarding Clicked` | `product`, `placement` |

Allowed values must be TypeScript unions or runtime allowlists. Never send names, email addresses, phone numbers, organization names, free-text location, exact portfolio counts, form text, full referrers, persistent IDs, or exact timestamps to analytics. Plausible's documentation specifically warns that custom properties must not contain PII or pseudonymous end-user identifiers.

Track a product view once per document load. Track explicit user actions at the interaction boundary, before the browser leaves the page. Analytics failure, content blockers, or a disabled configuration must never prevent a CTA, download, or form submission.

### Repeat-visit signal

Use a versioned local-storage record such as `zph:haoo:engagement:v1`, containing only:

- capped visit count;
- first/last visit date bucket, not a unique identifier;
- brochure-previewed/downloaded booleans;
- last assisted channel selected;
- self-onboarding-clicked boolean.

Derive `visitor_status` (`new` or `returning`) and `visit_band` (`1`, `2-3`, `4+`). Do not create a random visitor ID or attempt cross-device recognition. If storage is unavailable, fall back to in-memory state and `unknown` bands. Document this first-party storage and its purpose in the privacy notice.

## Qualification and Form Submission Flow

```text
Visitor completes visible qualification fields
    │
    ├── browser native validity checks
    │       └── invalid: focus/announce error, no submission
    │
    └── valid submit event
            ├── read form with FormData
            ├── calculate non-blocking qualification band
            ├── project local engagement into coarse hidden fields
            ├── emit best-effort aggregate submit-attempt event
            └── allow native POST to FormSubmit HAOO endpoint
                    ├── provider attempts email delivery to info@haoo.online
                    └── redirect to /products/haoo/?lead=success#qualification
                            ├── show role=status confirmation
                            ├── emit redirect-return event
                            └── remove query marker with replaceState
```

Keep the visible fields aligned with the milestone: contact name, email, phone, role, organization, portfolio-size band, location, and onboarding timing. Prefer portfolio bands to an exact unit count unless sales explicitly needs the number. Use a pure `classifyLead(formData)` function to derive `high`, `medium`, or `early` intent from role, portfolio band, and timing. This classification prioritizes the email; it must not reject or hide onboarding paths from a visitor.

Before native submission, write these hidden fields directly into the form so the browser serializes the current snapshot:

- `product=HAOO` and `source_page=/products/haoo/`;
- `qualification_band`;
- `visitor_status` and `visit_band`;
- brochure preview/download booleans;
- assisted channel selected and self-onboarding-clicked boolean;
- FormSubmit control fields (`_subject`, `_template`, `_next`, `_url`, `_autoresponse`, `_honey`).

Do not send the raw local-storage object, exact timestamps, or an analytics identifier. Place a short disclosure beside submit explaining that contact, qualification, and the listed engagement summary will be emailed to HAOO for follow-up. The aggregate analytics event remains separate.

The success query marker proves that the visitor returned from FormSubmit, not that the HAOO team read the message. UI wording should say the request was submitted, not claim guaranteed delivery. Activate and test the new HAOO recipient endpoint before launch; leave the existing general enquiry endpoint untouched.

## Assisted and Self-Onboarding Boundaries

Render phone, WhatsApp, email, and self-service as normal accessible links:

- `tel:+254702188044`
- `https://wa.me/254702188044`
- `mailto:info@haoo.online`
- `https://manage.haoo.online/`

External HTTP links should clearly communicate that they open HAOO/WhatsApp, use `target="_blank"` only where it improves flow, and include `rel="noopener noreferrer"` when opening a new tab. Do not proxy or delay these destinations for analytics. The qualification form is an option alongside the CTAs, not a gate in front of them.

## Static Asset Strategy

Treat the supplied brochure files as source material, not runtime code.

- Copy the original `HAOO-Marketing-Brochure.pdf` unchanged to `public/marketing/haoo/HAOO-Marketing-Brochure.pdf` so it has a stable, shareable URL.
- Keep a checksum or documented source path during import so accidental PDF alteration is detectable.
- Use the small HAOO logo PNG directly or create a verified web variant without changing the mark.
- Generate responsive AVIF/WebP/JPEG variants from the 2 MB hero source and import them from `src/assets/haoo/` so Vite fingerprints them. Render with `<picture>`, explicit dimensions, and meaningful alt text.
- Generate lightweight cover/inside preview images for the brochure shell. Do not load the 2.16 MB PDF on initial page render.
- Mount the PDF `<iframe>` only after “Preview brochure” activation, give it a descriptive `title`, and keep adjacent “Open PDF” and “Download PDF” links available at all times. Show file type and approximate size.
- Do not publish `brochure.html` as a second product page; its fixed A4 print CSS is not the responsive source of truth.

The responsive HTML HAOO page is the primary accessible product story. The PDF is supplementary and must also be checked for tags, title, language, heading structure, link text, and reading order under WCAG's PDF techniques.

## Accessibility Implications

- Give each HTML entry its own title, description, canonical URL, and social metadata.
- Use one `<main>`, logical headings, landmarks, and a skip link on both pages.
- Fix shared navigation semantics while extracting it: mobile toggle needs an accessible name, `aria-expanded`, and `aria-controls`; close it on navigation and Escape.
- Preserve visible focus, 44 px-class touch targets, adequate contrast, and keyboard access for preview controls and CTAs.
- Respect `prefers-reduced-motion`. `useInView` must reveal content immediately when IntersectionObserver is unavailable or motion is reduced; content must never remain opacity-zero because enhancement failed.
- Group qualification choices with `<fieldset>`/`<legend>`, retain explicit labels, use suitable autocomplete tokens, and connect errors/help text with `aria-describedby`.
- The success notice uses `role="status"`; after redirect, the `#qualification` target should bring the confirmation region into context without trapping focus.
- Do not rely on color, icon shape, or animation alone to convey qualification, success, or CTA meaning.

## Testing Architecture

Add tests around the new boundaries instead of snapshotting entire pages.

### Unit tests

- `classifyLead` for every role/portfolio/timing boundary;
- engagement schema migration, capping, storage failure, and date/visit bands;
- `toLeadContext` excludes raw timestamps and identifiers;
- analytics event sanitizer rejects unknown properties and PII-shaped keys.

### Component tests

- Products section renders catalog entries and correct physical URLs;
- product view emits once, while click events emit with only allowlisted properties;
- PDF is not loaded before activation and all preview/download fallbacks remain labeled;
- form action, HAOO recipient, hidden context snapshot, honeypot, validation, and redirect URL are correct;
- analytics/no-op failures never cancel links or native form submission.

Use Vitest, React Testing Library, `user-event`, and axe integration for these focused tests. Mock `window.plausible`, localStorage failures, and IntersectionObserver explicitly.

### Static/deployment checks

- build, typecheck, and lint;
- assert both `dist/index.html` and `dist/products/haoo/index.html` exist;
- inspect built HTML for root-correct assets and page-specific metadata;
- serve `dist/` locally and direct-load both URLs at mobile and desktop widths;
- keyboard-only and automated accessibility checks on both entries;
- verify PDF open/download, all four onboarding destinations, FormSubmit activation, HAOO email receipt, autoresponse, redirect, and subject/context formatting in production-like testing;
- verify analytics requests contain no submitted form values or persistent identifier.

## Build Order

1. **Create the static page foundation.** Configure the second Vite HTML input, entry modules, page metadata, shared config, and build-output assertion. This de-risks GitHub Pages before feature work.
2. **Extract shared shell and primitives.** Move header, footer, navigation, `useInView`, and common UI out of `App.tsx`; preserve the existing landing page visually.
3. **Introduce the product catalog.** Add typed `productCatalog`, the reusable Products section, and the HAOO card/link on the home page.
4. **Import and optimize assets.** Copy the original PDF, create web image variants and brochure thumbnails, verify names/checksum, and establish stable URLs.
5. **Build the accessible HAOO story.** Implement responsive brochure-derived sections, audience/capability content, metadata, brochure shell, and onboarding links without analytics dependencies.
6. **Add engagement and analytics boundaries.** Define the event vocabulary, storage schema, no-op adapter, Plausible adapter, privacy disclosure, and tests. Instrument already-stable interactions.
7. **Add qualification and email delivery.** Implement pure lead classification, native HAOO FormSubmit contract, hidden engagement projection, success handling, and recipient activation testing.
8. **Run funnel verification.** Complete accessibility, production-build, mobile, external-link, privacy-payload, email-delivery, and analytics-dashboard checks before launch.

The ordering keeps routing, content, and accessibility independently testable, then layers measurement and personally submitted data only after their contracts are explicit.

## Architectural Risks and Guardrails

| Risk | Guardrail |
|---|---|
| `App.tsx` becomes a larger monolith | Extract page, feature, service, and shared-layout boundaries first. |
| Product deep links 404 on GitHub Pages | Generate a physical `/products/haoo/index.html`; test direct loads from built output. |
| Analytics receives lead PII | Typed allowlist plus runtime sanitizer; no form data passed to analytics. |
| “Repeat visitor” becomes user profiling | Store no random ID; use only local capped counts and coarse bands. |
| Native navigation drops analytics event | Treat analytics as best-effort and never block navigation; validate using provider callback/beacon behavior. |
| Submission UI overstates success | Distinguish submit attempt, redirect return, provider delivery, and team follow-up. |
| PDF hurts performance/accessibility | Load on demand, provide web content and direct links, audit the PDF independently. |
| Static client exposes a secret | Keep all client configuration public; never add service secrets to Vite variables. |
| Unused Supabase dependency invites accidental backend scope | Do not initialize Supabase for this milestone; remove it separately if confirmed unused. |

## Sources and Confidence

| Source | Use | Confidence |
|---|---|---|
| Existing `.planning/PROJECT.md` and codebase architecture documents; direct inspection of `src/App.tsx`, Vite config, deployment workflow, and brochure files | Current constraints, flows, assets, and component boundaries | HIGH |
| [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | Static hosting boundary | HIGH (primary documentation) |
| [Vite static deployment guide](https://vite.dev/guide/static-deploy.html) and [Vite guide](https://vite.dev/guide/) | Custom-domain base path, static build, multiple HTML entries | HIGH (primary documentation) |
| [Plausible custom events](https://plausible.io/docs/custom-event-goals), [custom properties](https://plausible.io/docs/custom-props/introduction), and [event properties](https://plausible.io/docs/custom-props/for-custom-events) | Adapter/event design and PII exclusion | MEDIUM until an account and selected plan are verified |
| [FormSubmit documentation](https://formsubmit.co/documentation) | Native static POST, HAOO recipient, hidden redirect/subject fields | MEDIUM until endpoint activation and live delivery test |
| [WCAG 2.2 Techniques](https://www.w3.org/WAI/WCAG22/Techniques/) and [MDN text labels and names](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Text_labels_and_names) | PDF and embedded-content accessibility | HIGH (standards/primary technical guidance) |

## Open Decisions for Planning

- Confirm Plausible account/plan availability and whether custom properties needed by the proposed event schema are enabled. The no-op adapter permits implementation before that decision.
- Confirm the exact portfolio-size bands and qualification weights with the HAOO sales owner.
- Confirm whether phone is required or email alone is acceptable for follow-up; collect only what the team will actually use.
- Activate `info@haoo.online` with FormSubmit and document who monitors delivery failures.
- Audit the supplied PDF for tags and reading order; if remediation is not feasible in the milestone, label the responsive HTML page as the accessible equivalent and record the PDF limitation.

---
*Architecture research completed 2026-08-29.*
