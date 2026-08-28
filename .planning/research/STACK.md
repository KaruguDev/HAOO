# Stack Research

**Domain:** Privacy-first static product-marketing, lead-qualification, email-delivery, and onboarding funnel
**Researched:** 2026-08-29
**Confidence:** MEDIUM — existing-stack facts are verified directly from the repository; new-service recommendations are verified against current official documentation through web lookup because Context7 was unavailable

## Recommendation at a Glance

Keep the current React/Vite/TypeScript/Tailwind/GitHub Pages system and add the HAOO journey as a native Vite multi-page application. Use Plausible Cloud's current account-generated tracker for aggregate analytics, a small first-party browser module for a bounded non-identifying engagement summary, and a separate FormSubmit form posting to HAOO's recipient identity. This meets the milestone without introducing a server, database, router, PDF rendering library, tag manager, or second UI stack. **[HIGH — repository constraints; MEDIUM — provider capabilities]**

The privacy boundary must be explicit: Plausible receives only aggregate events and coarse non-identifying properties; it must never receive names, email addresses, phone numbers, precise locations, free text, or a persistent/pseudonymous visitor ID. The browser-held engagement summary is associated with contact details only when the visitor submits the HAOO form, at which point it is serialized into named hidden form fields and delivered in the qualification email. **[MEDIUM — verified against Plausible and FormSubmit official docs]**

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React / React DOM | Existing `18.3.1` line | Product index, HAOO marketing page, qualification form, and onboarding actions | Preserve the established rendering model and component conventions. React 18 already supports all needed form, state, and lifecycle behavior; upgrading is unrelated to this milestone. **[HIGH]** |
| TypeScript | Existing `5.5.x` line | Typed product content, analytics events, engagement summary, and qualification payload | Discriminated event names and bounded payload types prevent accidental PII from entering analytics and keep hidden-field serialization reviewable. **[HIGH]** |
| Vite | Existing `5.4.x` line with native multi-page input | Build `/` and a clean `/products/haoo/` HTML entry into static output | Vite officially supports multiple HTML entry points and nested directory pages. A real generated `products/haoo/index.html` works with GitHub Pages direct navigation without SPA rewrite hacks or a router. **[MEDIUM]** |
| Tailwind CSS | Existing `3.4.x` line | Responsive product and form presentation | Reuse the current green/blue visual language, breakpoints, utilities, and build pipeline. No second styling system is needed. **[HIGH]** |
| GitHub Pages + existing Actions workflow | Existing static deployment; Node 22 build | Host both page entries and brochure assets | The project already deploys `dist`; Vite documents `base: '/'` for a Pages custom domain, matching the repository. Pages remains appropriate because all new server-side responsibilities stay with external services. **[HIGH/MEDIUM]** |
| Plausible Analytics Cloud tracker | Current account-generated site-specific snippet (October 2025+ generation; provider-managed) | Aggregate pageviews, HAOO product views, brochure preview/downloads, qualification starts/submits, assisted-contact clicks, and self-onboarding clicks | Official docs describe a cookie-free tracker with custom events plus optional outbound-link, file-download, and form measurement. Install the exact snippet issued in Plausible Site Installation rather than copying a legacy generic URL. **[MEDIUM]** |
| FormSubmit | Hosted service, current API/HTML contract | Email-only delivery of HAOO qualification leads | It is already the site's form boundary and supports native static POSTs, `_next`, `_subject`, `_template`, `_honey`, reCAPTCHA, autoresponse, and opaque recipient tokens. A dedicated HAOO endpoint keeps product leads separate without a new backend. **[MEDIUM]** |
| Browser Web Storage API (`localStorage`) | Web platform API | First-party repeat-visit flag and bounded engagement summary before voluntary form submission | It persists across browser sessions and is origin-scoped. Store counts/booleans and first/last visit dates only—never contact data or a generated visitor identifier—and wrap access because browsers can block persistence. **[MEDIUM]** |
| Native HTML PDF and link capabilities | Web platform (`object`/`iframe`, `a[href]`, `download`) | Preview/download the canonical HAOO brochure and route to phone, WhatsApp, email, and `manage.haoo.online` | The source PDF can live under `public/` and Vite copies it unchanged. Native fallbacks avoid shipping PDF.js for a brochure that does not require annotation, search, or custom rendering. **[MEDIUM]** |

### Supporting Libraries and Modules

| Library / Module | Version | Purpose | When to Use |
|------------------|---------|---------|-------------|
| `lucide-react` | Existing `0.344.x` line | Icons for products, brochure, qualification, and onboarding actions | Reuse the installed icon set so new product UI remains visually consistent. **[HIGH]** |
| `src/lib/analytics.ts` (first-party adapter) | Project module | Typed event allowlist and one call site for Plausible | Use for every funnel event. The adapter should no-op if the tracker is unavailable, accept only coarse allowlisted properties, and never expose arbitrary payload forwarding. **[HIGH — design inference]** |
| `src/lib/engagement.ts` (first-party module) | Project module | Guarded storage, schema/version handling, visit counts, and form-summary serialization | Use only for local HAOO context. Cap counters, discard stale data, handle `SecurityError`, and expose no stable visitor token. **[HIGH — design inference]** |
| Native HTML form validation | Browser platform | Required fields and constrained select/radio choices | Use controlled vocabularies for role, portfolio-size band, county/region, and timing. Avoid a form framework while validation is short and mostly declarative. **[HIGH]** |
| Optional `@plausible-analytics/tracker` | Pin the then-current supported release only if chosen | ESM alternative to the hosted snippet | Use only if the implementation strongly benefits from imported TypeScript APIs. Plausible documents it as equivalent to the current script; the account-generated snippet is simpler and adds no dependency. **[MEDIUM]** |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Existing `npm run typecheck` | Validate event and lead payload boundaries | Make analytics event/property types closed unions, not `Record<string, unknown>`. **[HIGH]** |
| Existing `npm run lint` | Catch hook and rendering mistakes | Keep provider loading and storage side effects in small modules/hooks with cleanup. **[HIGH]** |
| Existing `npm run build` and `npm run preview` | Verify multi-page output and static assets | Check that `dist/index.html`, `dist/products/haoo/index.html`, and the brochure PDF exist; open both direct URLs under preview. **[HIGH]** |
| Browser DevTools Network panel | Verify event and form boundaries | Confirm analytics calls contain no PII and expected events reach `/api/event`; test FormSubmit in a non-production activation flow before launch. Plausible documents network verification. **[MEDIUM]** |
| Accessibility/browser manual pass | Validate mobile funnel, keyboard flow, PDF fallback, and storage-disabled behavior | Include Safari/private mode and blocked-storage conditions; analytics and repeat-visit enrichment must degrade without blocking content or submission. **[MEDIUM]** |

## Installation

No new runtime package is required for the recommended variant.

```bash
# Preserve the locked application stack.
npm ci

# Verify the existing quality gates and the static multi-page build.
npm run typecheck
npm run lint
npm run build
npm run preview

# Only if the team deliberately chooses the ESM tracker instead of the
# recommended account-generated Plausible snippet:
# npm install @plausible-analytics/tracker
```

Provider setup is operational rather than an npm install:

1. Add `zero-paperhub.com` in Plausible and paste its current site-specific snippet into every HTML entry.
2. Enable only the required measurements and define an allowlisted event taxonomy such as `HAOO Product Viewed`, `HAOO Brochure Previewed`, `HAOO Brochure Downloaded`, `HAOO Qualification Started`, `HAOO Qualification Submitted`, `HAOO Assisted Contact Clicked`, and `HAOO Self Onboarding Clicked`.
3. Activate a dedicated FormSubmit endpoint for `info@haoo.online`; prefer the opaque recipient token after activation, keep reCAPTCHA enabled, add `_honey`, and set a HAOO-specific subject and success URL.
4. Publish a concise privacy notice naming analytics, first-party browser storage, the purpose of engagement enrichment, and form processing/retention.

## Data Boundary and Event Shape

The analytics payload and the submitted lead payload are intentionally different:

| Destination | Allowed | Forbidden |
|-------------|---------|-----------|
| Plausible | Event name; page/product key; CTA channel (`phone`, `whatsapp`, `email`, `self_service`); brochure action; coarse `new`/`returning` classification | Name, email, phone, organization, free text, exact location, portfolio details, stable browser/visitor ID, raw localStorage contents |
| First-party `localStorage` | Schema version; first/last visit date; bounded visit count; booleans/counters for product, brochure, qualification, and onboarding interactions | Contact fields, form drafts, generated UUIDs, IP-derived data, unbounded clickstream, third-party identifiers |
| FormSubmit qualification POST | Visitor-entered contact/qualification fields; explicit privacy acknowledgement; human-readable bounded engagement summary | Analytics identifiers, opaque fingerprints, secrets, full raw event history |

Plausible's official custom-properties rules explicitly prohibit PII and pseudonymous end-user identifiers. A generated ID must therefore not be used to “join” Plausible analytics to a lead. Attribution is achieved by independently including the browser's coarse summary in the voluntarily submitted email. **[MEDIUM]**

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vite native multi-page entries | `react-router-dom` with `BrowserRouter` | Use after moving to hosting with reliable SPA fallback/rewrites or when product pages become a sufficiently dynamic routed application. On GitHub Pages today it adds direct-navigation handling without solving a current need. **[MEDIUM]** |
| Clean nested static path `/products/haoo/` | `HashRouter` | Use only if rapid client-side routing matters more than canonical-looking product URLs and search/share semantics. Plausible can track hash routes, but that is unnecessary complexity here. **[MEDIUM]** |
| Plausible Cloud site-specific snippet | `@plausible-analytics/tracker` ESM package | Use if imported APIs and bundler-managed typing materially simplify a larger analytics layer. Both are official; the snippet keeps this milestone dependency-free. **[MEDIUM]** |
| Plausible Cloud | Self-hosted Plausible Community Edition | Use only when the organization has an explicit data-residency/control requirement and can operate its database, upgrades, backups, monitoring, and security patches. That operational burden is disproportionate to this static funnel. **[MEDIUM]** |
| Plausible aggregate events + first-party bounded summary | Google Analytics 4 / advertising pixels | Use advertising platforms only after an explicit strategy and consent/legal design authorizes cross-site profiling. They conflict with the stated privacy-first scope. **[HIGH — project constraint]** |
| Native FormSubmit POST | Serverless function + transactional email provider | Use when delivery guarantees, custom validation, retention control, abuse controls, or auditable processing exceed FormSubmit's contract. This requires a server boundary and secret management and should be a separate decision. **[MEDIUM]** |
| Native browser PDF preview | PDF.js / React PDF viewer | Use when in-page search, page thumbnails, annotations, analytics by page, or consistent rendering is a real requirement. The v1 brochure only needs preview plus download. **[HIGH — scope]** |
| Native validation and small React state | Formik / React Hook Form + schema library | Use if the qualification form grows into conditional multi-step workflows or shared server validation. The current short static form does not justify the dependency surface. **[HIGH — scope]** |
| Small first-party modules | Reintroducing Supabase | Use Supabase only after a searchable lead store, authentication, CRM workflow, or server-side persistence is intentionally scoped. Its currently unused package is not evidence of an existing backend. **[HIGH]** |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `plausible-tracker` (unscoped legacy npm package) or copied legacy Plausible snippets | The old tracker repository is archived, and Plausible introduced a new site-specific script generation in October 2025. | The account-generated current snippet, or `@plausible-analytics/tracker` if an ESM import is deliberate. **[MEDIUM]** |
| A persistent analytics/visitor UUID | Plausible forbids pseudonymous end-user IDs in custom properties, and a join key undermines the aggregate privacy model. | Coarse anonymous events plus a bounded local summary attached only to voluntary form submission. **[MEDIUM]** |
| PII in analytics event names, URLs, query strings, or properties | Full link targets and custom properties can be stored; accidental email/phone/form data would violate the provider boundary. | Fixed event names, fixed clean URLs, allowlisted categorical properties, and a typed adapter. **[MEDIUM]** |
| Hidden client-side API keys or direct transactional-email API calls | Anything bundled by Vite is public; email provider secrets cannot be protected in GitHub Pages JavaScript. | Native FormSubmit POST, or a separately deployed serverless function if stronger delivery control becomes required. **[HIGH]** |
| GitHub Pages SPA `404.html` redirect hacks | They create brittle direct-load/history behavior when Vite already supports true nested HTML entries. | Vite multi-page input producing `products/haoo/index.html`. **[MEDIUM]** |
| A CRM, database, Supabase tables, or lead dashboard | Explicitly outside v1 and creates retention, access-control, and operational requirements. | Email delivery with a documented provider retention boundary. **[HIGH]** |
| Disabling reCAPTCHA by default | FormSubmit warns that disabling it can invoke technical limits; autoresponse also stops working when reCAPTCHA is disabled. | Keep reCAPTCHA plus `_honey`; assess friction with real submissions. **[MEDIUM]** |
| Treating FormSubmit as zero-retention | Its official docs state submissions are retained for 30 days in an archive. | Disclose/process accordingly; move to an owned serverless mail relay only if that retention is unacceptable. **[MEDIUM]** |
| Storing raw clickstreams or contact drafts in `localStorage` | Storage persists across sessions, may outlive user expectations, and is unavailable in some privacy modes. | Bounded counters/flags with an expiry and guarded no-storage fallback. **[MEDIUM]** |

## Stack Patterns by Variant

**Recommended v1: static assisted/self-onboarding funnel**

- Use `/` and `/products/haoo/` as Vite HTML entries sharing the same React, Tailwind, and service modules.
- Use Plausible for aggregate funnel events and localStorage only for a coarse lead-context summary.
- Submit qualification via native POST to HAOO's FormSubmit endpoint, then redirect to a stable HAOO success anchor/page.
- Because this preserves direct URLs, static deployment, native form resilience, and the minimum privacy surface. **[HIGH/MEDIUM]**

**If the team rejects all persistent browser storage:**

- Use `sessionStorage` or in-memory state for same-session context and let Plausible report aggregate return metrics at its own supported granularity.
- Do not claim cross-session repeat-visit enrichment on submitted leads.
- Because localStorage is the only proposed first-party persistence; removing it is a valid stricter-privacy variant with an explicit measurement tradeoff. **[MEDIUM]**

**If FormSubmit retention or delivery control is unacceptable:**

- Add a separately scoped serverless mail relay with server-held credentials, input validation, rate limiting, explicit logs/retention, and a transactional email provider.
- Keep GitHub Pages for the frontend; only the form boundary changes.
- Because client JavaScript cannot safely hold email API credentials. Provider selection and Kenyan data-protection processing terms need phase-specific research. **[MEDIUM]**

**If product pages expand beyond a small catalog:**

- Reassess a router or static-site framework only when shared layouts, content generation, many product paths, metadata generation, and preview workflows create measurable maintenance pain.
- Do not migrate for HAOO alone.
- Because the current Vite MPA feature provides the required clean path with far less change. **[HIGH/MEDIUM]**

## Version Compatibility

| Package / Service | Compatible With | Notes |
|-------------------|-----------------|-------|
| React `18.3.x` + React DOM `18.3.x` | Existing TypeScript `5.5.x`, `@vitejs/plugin-react 4.3.x`, Vite `5.4.x` | Preserve the lockfile and current major lines; no feature here requires a framework upgrade. **[HIGH]** |
| Vite `5.4.x` multi-page input | GitHub Pages custom domain with `base: '/'` | Add nested HTML input(s) and verify generated directory indexes. Existing workflow already uploads `dist`. **[HIGH/MEDIUM]** |
| Tailwind `3.4.x` | Existing PostCSS `8.4.x` and Autoprefixer `10.4.x` | Ensure any new product-page source path is covered by Tailwind's content scan. **[HIGH]** |
| Plausible current site-specific script | Plain HTML entries and browser globals | Copy the exact snippet supplied for the configured domain into each entry. Do not mix legacy script-extension URLs with new `plausible.init` configuration. **[MEDIUM]** |
| `@plausible-analytics/tracker` (optional) | ESM/Vite | Officially documented as the npm alternative; pin the version resolved at implementation time and use it instead of, not alongside, the hosted snippet to prevent duplicate events. **[MEDIUM]** |
| FormSubmit native endpoint | Static HTML form POST | Autoresponse requires an email field and does not work with AJAX or disabled reCAPTCHA. Recipient activation must be completed before production verification. **[MEDIUM]** |
| `localStorage` | Modern browsers; origin-specific HTTPS storage | Access can throw or be blocked. All tracking/enrichment calls must fail open so content and form delivery still work. **[MEDIUM]** |

## Operational Decisions Required Before Implementation

1. Approve a Plausible Cloud account/plan and obtain the site-specific snippet. Custom properties are documented as a Business-plan feature; the recommended baseline events do not require sending lead metadata, and plan-dependent properties should not be assumed. **[MEDIUM]**
2. Activate the HAOO FormSubmit recipient and obtain the opaque endpoint token. Confirm the team's acceptance of FormSubmit's documented 30-day submissions archive. **[MEDIUM]**
3. Approve the exact local engagement fields and expiry (recommended: schema version, day-granularity first/last seen, capped visits, and interaction flags/counters; no UUID). **[HIGH — design decision]**
4. Approve the public privacy wording before analytics/storage is enabled. A provider's “no consent banner” marketing claim is not a substitute for project-specific legal review. **[MEDIUM]**

## Sources

- [Vite: Building for Production — Multi-Page App](https://vite.dev/guide/build.html#multi-page-app) — multiple HTML entry points and nested static paths. **[MEDIUM; official documentation via web lookup]**
- [Vite: Static Asset Handling — public directory](https://vite.dev/guide/assets.html#the-public-directory) — unchanged brochure asset copying and root-path references. **[MEDIUM; official documentation via web lookup]**
- [Vite: Deploying a Static Site — GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages) — custom-domain `base: '/'` and Actions deployment. **[MEDIUM; official documentation via web lookup]**
- [GitHub Docs: What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) — static HTML/CSS/JS hosting boundary and custom-domain support. **[MEDIUM; official documentation via web lookup]**
- [Plausible Analytics documentation](https://plausible.io/docs) — cookie-free positioning, goals, file downloads, forms, outbound links, and custom events. **[MEDIUM; official documentation via web lookup]**
- [Plausible: Add the tracking script](https://plausible.io/docs/plausible-script) — account-generated site-specific snippet and official ESM alternative. **[MEDIUM; official documentation via web lookup]**
- [Plausible: Update your script](https://plausible.io/docs/script-update-guide) — October 2025+ snippet generation and `plausible.init` options. **[MEDIUM; official documentation via web lookup]**
- [Plausible: Custom event tracking](https://plausible.io/docs/custom-event-goals) — custom events and request verification. **[MEDIUM; official documentation via web lookup]**
- [Plausible: Custom properties](https://plausible.io/docs/custom-props/introduction) — explicit prohibition on PII and pseudonymous end-user identifiers; plan dependency and property limits. **[MEDIUM; official documentation via web lookup]**
- [FormSubmit documentation](https://formsubmit.co/documentation) — native form contract, hidden configuration fields, honeypot/reCAPTCHA, autoresponse limitations, opaque recipient tokens, and 30-day archive. **[MEDIUM; official documentation via web lookup]**
- [MDN: `Window.localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — persistence, origin scope, private-mode behavior, and blocked-storage exceptions. **[MEDIUM; official documentation via web lookup]**
- Repository evidence: `.planning/PROJECT.md`, `.planning/codebase/STACK.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/INTEGRATIONS.md`, and `package.json`. **[HIGH; direct local inspection]**

---
*Stack research for: ZERO-PAPER HUB HAOO product funnel milestone*
*Researched: 2026-08-29*
