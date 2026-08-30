# Phase 2: Submit a Qualified HAOO Enquiry - Research

**Researched:** 2026-08-30
**Domain:** Accessible client-side React form → third-party email provider (FormSubmit AJAX) on a static GitHub Pages build
**Confidence:** HIGH for in-repo constraints and Vite/env behaviour; MEDIUM for FormSubmit AJAX payload semantics; LOW for the exact FormSubmit success-response body

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Submission Mechanism**
- **D-01:** Submit via `fetch()` to FormSubmit's AJAX endpoint and stay on `/products/haoo/`. Submitting, success, and failure all render in place, and entered values survive a failed attempt — this is what satisfies LEAD-05's "retains entered values after a recoverable error". This deliberately departs from the redirect-based `_next` pattern used by the general contact form in `src/App.tsx`, which cannot preserve input on provider failure. — **Reversibility:** costly — the state machine, failure UI, and tests are all built around an in-page flow; moving to a redirect flow would rewrite the component and its tests.
- **D-02:** The form is JS-dependent by design (no progressive-enhancement plain-POST path). When the form cannot submit — JS blocked, network failure, provider error — show a direct-contact fallback panel with WhatsApp, phone, and `info@haoo.online`. This upholds the Phase 1 rule that every onboarding path stays usable without analytics, storage, PDF embedding, or form delivery, and keeps assisted-first framing (D-09/D-10).
- **D-03:** On success, replace the form with a confirmation panel stating what was received, the expected response time, and WhatsApp/phone as an immediate alternative. Replacing the form also prevents accidental double submission.
- **D-04:** Use FormSubmit's random-token endpoint rather than the plain address, sourced from a build-time environment variable, with the readable `info@haoo.online` address as a documented fallback. Keeps the HAOO inbox address out of the shipped bundle. Endpoint activation is a Phase 5 verification item (LEAD-07), not a Phase 2 deliverable. — **Reversibility:** reversible — endpoint value is a single configuration constant.
- **D-05:** Deliver to `info@haoo.online` only. Do not cc `info@zero-paperhub.com`. The email body notes the enquiry originated from the ZERO-PAPER HUB HAOO product page, keeping HAOO's own contact identity as the recipient per the PROJECT.md branding constraint.

**Placement and Entry**
- **D-06:** The form lives in a new `#qualify` section inside the existing `/products/haoo/` page — no new route, no modal. Preserves the single stable product route from Phase 1 and avoids added GitHub Pages routing and dialog-accessibility surface.
- **D-07:** Place the section between the brochure section and the closing onboarding block, so the visitor reads the story and sees the brochure first, and the repeated onboarding choices (D-11) still close the page.
- **D-08:** All three `OnboardingChoices` blocks (opening, mid-page, closing) gain a fourth "send details" link anchored to `#qualify`, framed as the option for prospects who would rather send details than start a chat. WhatsApp remains visually primary per D-10.
- **D-09:** Add a product-nav entry for the form section so returning visitors can jump straight to it, alongside benefits, capabilities, brochure, and onboarding (extends D-16).
- **D-10:** Frame the section as a consultation invitation, extending D-12's language ("Tell us about your properties and we'll help you choose the best way to get started"). It is the written version of assisted onboarding, not a sales gate or a screening test.
- **D-11:** Build the form as a product-generic component configured from the product definition in `src/products/` — field definitions, endpoint, and copy come from data, following the Phase 1 reusable product-shell precedent so a second product can reuse it without copying structure.

**Qualification Fields**
- **D-12:** Field set: name, email, phone, preferred contact channel, role, organization, portfolio-size band, county, onboarding timeframe, and an optional short message.
- **D-13:** Email is required; phone is optional by default. Name and email together satisfy LEAD-01's "at least one usable contact method".
- **D-14:** Capture a preferred contact channel as a controlled choice — WhatsApp / phone call / email — so human follow-up lands on the channel the prospect wants.
- **D-15:** Phone becomes conditionally required when the preferred channel is WhatsApp or phone call, so the chosen channel is always reachable. The change in required state must be announced accessibly, not just shown visually. — **Reversibility:** reversible — a conditional validation rule in one component.
- **D-16:** Role is a required controlled select (landlord / property manager / agency / organization / other) because it drives follow-up routing. Organization is optional free text, since individual landlords have none. LEAD-02 names organization explicitly, so the field must exist even though it is optional.
- **D-17:** Portfolio-size bands: 1–5, 6–20, 21–50, 51–200, 200+. Coarse enough that Phase 3 can reuse the band directly without it becoming an exact value.
- **D-18:** Location is a closed Kenyan county select plus an "Outside Kenya" option — controlled, no free text to sanitize, and coarse enough for Phase 3's privacy rules.
- **D-19:** Onboarding timeframe bands: Ready now / 1–3 months / 3+ months / Just exploring.
- **D-20:** Include an optional short free-text message, supporting the consultation framing. It is email-only: because Phase 3 forbids free text in analytics and in the engagement summary, this value must never reach any measurement or summary payload.
- **D-21:** Mark optional fields as "(optional)" and state that the remaining fields are required, rather than asterisking nearly every label. Matches the existing contact form's treatment of Organization.

**Feedback, Spam, and Disclosure**
- **D-22:** Validate on submit, then re-validate each field as the visitor corrects it. On a failed submit, show inline messages on invalid fields, announce an error summary, and move focus to the first problem. Nothing complains while the visitor is still typing a field for the first time.
- **D-23:** Carry submitting, success, and failure text in a single `role="status"` live region (errors via `role="alert"`), matching the existing site pattern. The submit button disables and relabels while in flight to block double submission.
- **D-24:** Spam control is a hidden honeypot field plus `_captcha=false` — the existing contact form's approach. No captcha or third-party challenge widget: a challenge would burden keyboard and assistive-technology users (contrary to LEAD-06) and pull a third party into a privacy-first funnel.
- **D-25:** Satisfy LEAD-03 with a plain-language note near the submit control stating that a coarse summary of how the visitor used the HAOO page is sent along with their details, and what it does not include. Phase 3 refines the wording once the actual signals exist; do not ship a detailed signal list that cannot yet be accurate.
- **D-26:** Phase 2 sends no engagement-summary payload and no placeholder section in the email — disclosure only. The email carries the form fields plus the source note; Phase 3 adds the summary itself.

### Claude's Discretion

No decisions were explicitly delegated. Downstream agents retain discretion over component boundaries, field order and grouping, character limits and `autoComplete` attributes, exact copy wording, spacing and typography, responsive breakpoints, and the specific structure of the FormSubmit request, provided they preserve the decisions above and the existing accessibility conventions.

### Deferred Ideas (OUT OF SCOPE)

- **ZERO-PAPER HUB cc on HAOO enquiries** — considered and rejected for v1 (D-05); revisit only if the parent company needs visibility into product enquiries.
- **Expandable "what we collect" signal list** — the detailed disclosure cannot be accurate until Phase 3 defines the actual signals; revisit in Phase 3 when refining the disclosure wording.
- **Progressive-enhancement plain-POST fallback path** — rejected in D-02 in favour of a direct-contact fallback; revisit only if analytics later show meaningful no-JS traffic.
- **Timing-based bot check** — considered alongside the honeypot (D-24); revisit only if spam volume proves the honeypot insufficient.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LEAD-01 | Interested visitor can submit their name and at least one usable contact method through a HAOO-specific qualification form | Field-definition-as-data pattern (Pattern 2); `autocomplete` tokens for name/email/tel satisfy WCAG 1.3.5; native `type="email"`/`type="tel"` + controlled React state |
| LEAD-02 | Interested visitor can identify their role, organization, portfolio-size band, location, and intended onboarding timeframe using clear controlled fields | Closed option lists in product data (Pattern 2); verified Kenya 47-county list (Standard Stack → Reference Data); `<select>` with a non-selectable placeholder `<option value="">` |
| LEAD-03 | Visitor can see which qualification fields are required, why the information is collected, and that relevant HAOO engagement context accompanies the submission | WCAG 3.3.2 Labels or Instructions; "(optional)" suffix convention already in `src/App.tsx:587`; disclosure paragraph wired to the submit control via `aria-describedby` |
| LEAD-04 | A valid HAOO qualification submission is addressed to `info@haoo.online` with a recognizable HAOO-specific subject and human-readable field labels | FormSubmit AJAX endpoint contract (Pattern 1 + Code Example 1); readable JSON keys become the email field labels; `_subject` from product data |
| LEAD-05 | Visitor receives accessible validation, submitting, success, failure, and retry guidance without losing entered values after a recoverable error | Explicit five-state submission machine (Pattern 3); persistently-mounted live region (Pitfall 3); GOV.UK error-summary pattern; WCAG 2.2 SC 3.3.7 Redundant Entry makes value retention a conformance item |
| LEAD-06 | Qualification form applies a honeypot and provider-supported spam controls without creating a barrier for legitimate keyboard or assistive-technology users | Existing off-screen labelled honeypot at `src/App.tsx:564-573` (`_honey`, `tabIndex={-1}`, `autoComplete="off"`); `_captcha=false`; no third-party challenge widget |
</phase_requirements>

## Project Constraints (from AGENTS.md and codebase docs)

There is **no `./CLAUDE.md` or `./.claude/CLAUDE.md`** in this repo — `.planning/config.json` points `claude_md_path` at `./.claude/CLAUDE.md`, which does not exist [VERIFIED: `ls .claude` returns only `worktrees`]. The equivalent directive file is `AGENTS.md` at the repo root [VERIFIED: AGENTS.md, GSD-managed sections]. Its actionable directives:

| Directive | Source | Consequence for Phase 2 |
|-----------|--------|-------------------------|
| Preserve static-site deployment; there is no backend | AGENTS.md § Project → Constraints | All validation is client-side; the provider is the only delivery mechanism |
| Build within the current React/Vite/TypeScript/Tailwind stack; avoid a second frontend system | AGENTS.md § Project → Constraints | **No form library, no schema library, no validation library** |
| Lead delivery is email-only in v1 | AGENTS.md § Project → Constraints | No CRM/DB/serverless function may be introduced |
| Displayed brand name is always `ZERO-PAPER HUB` (titles, copy, metadata, accessible labels) | `.planning/PROJECT.md:68` | Any new copy string, `aria-label`, or email body text uses the uppercase form |
| Every form control has a matching `label`/`htmlFor`; required fields and length constraints use native attributes | CONVENTIONS.md § JSX and Accessibility | Do not build custom control widgets |
| Status feedback uses `role="status"`; hidden anti-spam UI remains labelled and removed from keyboard flow with `tabIndex={-1}` | CONVENTIONS.md § JSX and Accessibility | Reuse `src/App.tsx:564-573` honeypot shape verbatim |
| Keep FormSubmit configuration centralized | CONVENTIONS.md § External Boundaries | D-11 relocates this to `src/products/` for the product-generic form |
| Do not read or commit secret environment values | CONVENTIONS.md § External Boundaries | The FormSubmit token is public-by-construction (see Pitfall 6) and must be documented as obfuscation, not a secret |
| Static content lives in module-level uppercase constants or product data; render with stable keys; stay testable without visual selectors | CONVENTIONS.md § React Components | Option lists (roles, bands, counties, timeframes) are exported data, asserted directly in tests |
| Use Tailwind utilities and the existing palette; use `lucide-react` icons | CONVENTIONS.md § Styling | No new CSS files, no bespoke SVG |
| Run `npm run lint`, `npm run typecheck`, `npm run build` | CONVENTIONS.md § Verification | Wave gate commands |
| Start work through a GSD command; no direct edits outside a GSD workflow | AGENTS.md § GSD Workflow Enforcement | Execution proceeds via `/gsd-execute-phase` |

**Project skills:** none. `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, `.codex/skills/` are all absent [VERIFIED: `ls .claude` shows only `worktrees`; AGENTS.md § Project Skills states "No project skills found"].

## Summary

This phase adds one thing — an accessible, in-page qualification form — but it lands inside a codebase that Phase 1 deliberately fenced off with executable contracts. The dominant technical risk is **not** the form; it is that four Phase 1 test files encode invariants that a naive Phase 2 implementation violates on contact. `src/test/build-output.test.ts:292-306` forbids the literal tokens `fetch(`, `FormData`, `formsubmit`, and `<form` in nine named product source files including `src/pages/ProductPage.tsx` and `src/products/haoo.ts`. `src/test/product-shell-reuse.test.tsx:137-153` forbids the case-insensitive literal `HAOO` in seven product-generic sources including `src/products/copy.ts`. `src/test/haoo-page.test.tsx:155-165` asserts each of four onboarding accessible names (`Chat with HAOO on WhatsApp`, `Call +254 702 188 044`, `Email info@haoo.online`, `Start with HAOO`) appears **exactly three times** — so a direct-contact fallback panel that reuses those labels breaks three separate contracts. `src/test/focus-contrast.test.ts:22-34` throws on any Tailwind ring colour token it does not recognise, in five enumerated files. Planning must treat amending these contracts as first-class, named tasks — not as incidental test churn discovered mid-execution.

The provider integration itself is well-understood and low-risk. FormSubmit's AJAX route is `https://formsubmit.co/ajax/<email-or-token>` and a live `OPTIONS` preflight from this session confirms `access-control-allow-origin: *` with `Content-Type` and `Accept` in the allowed request headers, so a cross-origin JSON `fetch` from `www.zero-paperhub.com` is permitted with no proxy. Two provider facts constrain the design: the docs state autoresponse "won't work with forms that are disabled reCAPTCHA and forms that are submitting through AJAX", so D-24's `_captcha=false` plus D-01's AJAX flow means **`_autoresponse` must not be used** — the in-page confirmation panel (D-03) is the only acknowledgement the visitor gets; and the success-response body shape is undocumented, so the implementation must branch on `response.ok`, never on a parsed body field.

The accessibility work is where most of the phase's value and most of its subtlety live. Three patterns carry it: a live region that is **mounted empty at first render and only ever has its text swapped** (conditionally mounting a `role="status"` node — which is what `src/App.tsx:575-586` does today — is the single most common reason announcements are silently dropped); a GOV.UK-style error summary that appears above the form, receives focus, links each message to its field, and whose wording matches the inline message byte-for-byte; and an explicit five-state submission machine (`idle → validating → submitting → succeeded | failed`) where the `failed` state preserves every entered value. That last point is not merely UX: WCAG 2.2 SC 3.3.7 Redundant Entry (Level A) makes retaining previously entered values in the same process a conformance obligation.

**Primary recommendation:** Build `src/components/QualifyForm.tsx` as a product-generic, zero-new-dependency component driven by field definitions and option lists exported from `src/products/` — then, in Wave 0, explicitly amend the four Phase 1 contract files to declare Phase 2's new boundary before writing any implementation, so the guard tests fail loudly for the right reason and pass for a documented one.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Field definitions, option lists, endpoint, subject line | Static build data (`src/products/`) | — | D-11 requires configuration-from-data; Phase 1 precedent centralizes every product fact in `src/products/haoo.ts` [VERIFIED: src/products/haoo.ts:9-118] |
| Form rendering, labels, required-state markup | Browser / Client | — | No SSR exists; `index.html` + `products/haoo/index.html` are static shells mounting React [VERIFIED: products/haoo/index.html:39-40] |
| Input validation (required, format, conditional-required) | Browser / Client | — | GitHub Pages has no server runtime, so provider-side validation is impossible [CITED: .planning/codebase/STACK.md] |
| Spam filtering | API / Backend (FormSubmit) | Browser / Client (honeypot) | `_honey` is evaluated by the provider; the hidden input is only the client half of the control |
| Email composition, delivery, recipient routing | API / Backend (FormSubmit) | — | `_subject`, `_template`, and the JSON keys are provider-interpreted; the browser never sends mail |
| Endpoint token injection | Build (Vite + GitHub Actions) | — | `import.meta.env.VITE_*` is statically replaced at build time [VERIFIED: vite.dev/guide/env-and-mode] |
| Submission state, retry, value retention | Browser / Client | — | In-page state machine per D-01/D-03; no storage (Phase 1 forbids `localStorage`/`sessionStorage` in product sources) [VERIFIED: src/test/build-output.test.ts:293] |
| Direct-contact fallback (WhatsApp / phone / email) | Browser / Client (native links) | — | Native `href` destinations from product data; must remain functional with JS or the provider unavailable (ONBD-05) |

**Tier misassignment to watch for:** the temptation to "validate the email address properly" by calling a verification API, or to add a serverless function to hide the endpoint. Both cross the static-site boundary that AGENTS.md fixes as a project constraint and both are out of scope.

## Standard Stack

### Core

Phase 2 introduces **zero new runtime or dev dependencies**. Every capability is served by what is already installed and locked.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react` / `react-dom` | 18.3.1 | Controlled form state, five-state submission machine, focus management via `useRef` | Already the only UI runtime; Phase 01 decision locked React 18/Vite 5 [VERIFIED: package.json dependencies] |
| `lucide-react` | ^0.344.0 | Status, error, and channel icons | CONVENTIONS.md mandates lucide over inline SVG [VERIFIED: package.json:12] |
| Platform `fetch` | Node 22 / all target browsers | AJAX submission to FormSubmit | Native; no client added. GitHub Actions runner is Node 22 [VERIFIED: .github/workflows/deploy.yml] |
| Native HTML constraint validation | — | `required`, `type="email"`, `minLength`, `maxLength`, `pattern` | CONVENTIONS.md: "required fields and length constraints are expressed with native attributes" |
| `tailwindcss` | ^3.4.1 | All styling | Existing palette and focus utilities |

### Supporting (test-time, already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | 3.2.4 | Runner for all new contracts | Every new test file |
| `@testing-library/react` | 16.3.2 | `render`, `screen`, `within`, `fireEvent`, `waitFor` | Component contracts |
| `@testing-library/dom` | 10.4.1 | Role/name queries | Accessible-name assertions |
| `jsdom` | 26.1.0 | DOM environment | `vitest.config.ts` already sets `environment: 'jsdom'` |
| `typescript` (as a test import) | ^5.5.3 | Source scanning in `product-shell-reuse.test.tsx` | Only if extending the literal-ban scanner |

> `@testing-library/user-event` is **not installed** [VERIFIED: `ls node_modules/@testing-library/` returns only `dom` and `react`]. Every existing contract uses `fireEvent` [VERIFIED: src/test/product-shell-reuse.test.tsx:3, src/test/haoo-page.test.tsx:1]. New form contracts must use `fireEvent.change` / `fireEvent.submit` / `fireEvent.blur`, **not** `userEvent`. Adding `user-event` would be a new dependency and contradicts the "zero new dependencies" posture.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written `useState` field map | `react-hook-form` | Adds a runtime dependency to a marketing site with one form; AGENTS.md constrains the stack; the accessibility work (error summary, focus move, live region) is not solved by the library anyway |
| Hand-written per-field validators | `zod` / `yup` | Same dependency objection; ten fields with one conditional rule does not amortize a schema library, and bundle size matters on a static marketing page |
| `fetch` + JSON | `<form action>` native POST | Rejected by D-01 — cannot preserve entered values on provider failure |
| FormSubmit | Formspark, Web3Forms, Netlify Forms | Rejected implicitly: the site already runs FormSubmit for the general contact form; a second provider doubles the activation, deliverability, and privacy surface |
| Third-party captcha | reCAPTCHA / hCaptcha / Turnstile | Rejected by D-24 — burdens AT users (LEAD-06) and pulls a tracker into a privacy-first funnel |

**Installation:**

```bash
# None. Phase 2 adds no packages.
npm ci   # existing lockfile is sufficient
```

**Version verification performed this session:**

```
package.json dependencies:  react ^18.3.1, react-dom ^18.3.1, lucide-react ^0.344.0
package.json devDependencies: vitest 3.2.4, jsdom 26.1.0,
                              @testing-library/react 16.3.2, @testing-library/dom 10.4.1,
                              vite ^5.4.2, typescript ^5.5.3, tailwindcss ^3.4.1
```
[VERIFIED: package.json:20-45, read this session]

### Reference Data: Kenyan Counties (D-18)

The 47 counties of the First Schedule to the Constitution of Kenya, 2010, in official code order 1–47:

```
Mombasa, Kwale, Kilifi, Tana River, Lamu, Taita–Taveta, Garissa, Wajir, Mandera,
Marsabit, Isiolo, Meru, Tharaka-Nithi, Embu, Kitui, Machakos, Makueni, Nyandarua,
Nyeri, Kirinyaga, Murang'a, Kiambu, Turkana, West Pokot, Samburu, Trans-Nzoia,
Uasin Gishu, Elgeyo-Marakwet, Nandi, Baringo, Laikipia, Nakuru, Narok, Kajiado,
Kericho, Bomet, Kakamega, Vihiga, Bungoma, Busia, Siaya, Kisumu, Homa Bay,
Migori, Kisii, Nyamira, Nairobi
```

[CITED: en.wikipedia.org/wiki/Counties_of_Kenya — the authoritative KLRC First Schedule page `klrc.go.ke/.../first-schedule-counties` issued a 307 redirect to an unrelated third-party host (`recaptcha.cloud`) and was **not** followed]

**Provenance caveat — this is `[ASSUMED]` at the character level.** Four names carry punctuation that varies between published transcriptions: `Taita–Taveta` (en dash vs hyphen vs space), `Tharaka-Nithi` (vs `Tharaka Nithi`), `Elgeyo-Marakwet` (vs `Elgeyo/Marakwet` — the form used on some IEBC and Gazette documents), and `Murang'a` (typographic vs straight apostrophe). Because D-18 makes this a *closed* select whose values reach the HAOO inbox and, in Phase 3, the engagement summary, the planner should treat exact spelling as a `checkpoint:human-verify` item rather than shipping a transcription unreviewed. Add `Outside Kenya` as the 48th option per D-18.

## Package Legitimacy Audit

Phase 2 installs **no external packages**. The Package Legitimacy Gate is therefore not applicable and no registry lookups were required.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| *(none proposed)* | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

If a plan later proposes any dependency (for example `@testing-library/user-event`), that plan must run the gate and re-open this section. The zero-dependency posture is itself a constraint from AGENTS.md § Project → Constraints ("avoid introducing a second frontend system") and should be defended.

## Architecture Patterns

### System Architecture Diagram

```
  ┌──────────────────────────────────────────── build time ────────────────────────────────────────────┐
  │  GitHub Actions (deploy.yml)                                                                        │
  │    npm ci ──► npm run build ──► Vite statically replaces import.meta.env.VITE_HAOO_FORM_ENDPOINT    │
  │                                       │                                                             │
  │                                       └──► dist/ ──► upload-pages-artifact ──► GitHub Pages          │
  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘

  ─────────────────────────────────────────── runtime (browser) ───────────────────────────────────────

  visitor lands on /products/haoo/
        │
        ├─ JS blocked ────────────────► <noscript> block (products/haoo/index.html:23-38)
        │                                 WhatsApp · phone · email · manage.haoo.online · brochure PDF
        │
        └─ JS available
              │
              ├─ nav "Send details" ─┐
              ├─ OnboardingChoices ──┼──► anchor #qualify
              │   ×3 (4th link)      │
              │                      ▼
              │            ┌──────────────────────────────────────────┐
              │            │  #qualify section (ProductPage.tsx)      │
              │            │  ┌────────────────────────────────────┐  │
              │            │  │ QualifyForm  (product-generic)     │  │
              │            │  │  fields  ◄── product.qualify data  │  │
              │            │  └────────────────────────────────────┘  │
              │            └──────────────────────────────────────────┘
              │                      │
              │                      ▼  submit
              │            ┌───────────────────────┐
              │            │ validate(values)      │   pure function, no DOM
              │            └───────────────────────┘
              │                 │             │
              │        errors ◄─┘             └─► valid
              │           │                          │
              │           ▼                          ▼
              │  ┌──────────────────┐      state: submitting
              │  │ error summary    │      button disabled + relabelled
              │  │ role=alert       │              │
              │  │ focus moves here │              ▼
              │  │ links → fields   │      fetch(POST JSON)
              │  │ aria-invalid on  │      https://formsubmit.co/ajax/<token>
              │  │ each bad field   │      { _subject, _template, _captcha:false,
              │  └──────────────────┘        _honey, "Full name": …, … }
              │           │                         │
              │           │              ┌──────────┴──────────┐
              │           │        response.ok            !ok / throw
              │           │              │                     │
              │           │              ▼                     ▼
              │           │      state: succeeded        state: failed
              │           │      form REPLACED by        form KEPT, all values intact
              │           │      confirmation panel      + retry button
              │           │      (blocks double submit)  + direct-contact fallback panel
              │           │              │                     │
              │           └──────────────┴──────────┬──────────┘
              │                                     ▼
              │                    persistent live region (mounted empty at first render)
              │                    role=status  ← submitting / success / failure text
              │                    role=alert   ← validation error summary
              │
              └─ any state ──────► direct HAOO contacts always reachable
                                   (footer + 3 OnboardingChoices blocks)
```

### Component Responsibilities

| File | Status | Responsibility |
|------|--------|----------------|
| `src/products/types.ts` | extend | `ProductQualifyForm`, `QualifyField`, `QualifyOption` types; add `qualify` to `ProductDefinition` |
| `src/products/haoo.ts` | extend | HAOO field set, option lists (roles, bands, counties, timeframes, channels), endpoint, `_subject` value |
| `src/products/copy.ts` | extend | Product-name-parameterised strings for the qualify section, fallback panel, and confirmation panel — **must contain no `HAOO` literal** |
| `src/components/QualifyForm.tsx` | new | Field rendering, validation, submission state machine, live region, error summary, honeypot |
| `src/components/QualifyFallback.tsx` | new (optional split) | Direct-contact panel used by the `failed` state — **distinct accessible names** from OnboardingChoices |
| `src/components/OnboardingChoices.tsx` | extend | Fourth "send details" link to `#qualify`, all three positions |
| `src/components/ProductHeader.tsx` | extend | New entry in `PRODUCT_LINKS` (currently 4 entries, `src/components/ProductHeader.tsx:11-16`) |
| `src/pages/ProductPage.tsx` | extend | `#qualify` `<section>` between `#brochure` (line 185) and `#onboarding` (line 193) |
| `.github/workflows/deploy.yml` | extend | `env:` block on the Build step supplying `VITE_HAOO_FORM_ENDPOINT` |
| `src/test/build-output.test.ts` | **amend** | Narrow the Phase 1 forbidden-token guard (lines 292-306) |
| `src/test/product-shell-reuse.test.tsx` | **amend** | Add new generic sources to `GENERIC_PRODUCT_SOURCES` (lines 25-33) |
| `src/test/focus-contrast.test.ts` | **amend** | Add `QualifyForm.tsx` to `FOCUS_SOURCES` (lines 28-34) |
| `src/test/haoo-page.test.tsx` | **amend/extend** | Onboarding-link counts and section ordering if new labels collide |
| `src/test/qualify-form.test.tsx` | new | The Phase 2 behavioural contract |

### Recommended Project Structure

```
src/
├── components/
│   ├── QualifyForm.tsx        # form, validation, state machine, live region
│   └── QualifyFallback.tsx    # direct-contact panel (failure + no-provider)
├── products/
│   ├── types.ts               # + ProductQualifyForm, QualifyField, QualifyOption
│   ├── haoo.ts                # + qualify: { endpoint, subject, fields, options }
│   └── copy.ts                # + qualifyLead(name), qualifyFallbackBody(name), …
├── pages/
│   └── ProductPage.tsx        # + <section id="qualify">
└── test/
    └── qualify-form.test.tsx  # Phase 2 contract
```

### Pattern 1: Provider request as a pure, testable descriptor

Do not let `fetch` details leak into JSX. Build the request body with a pure function so the contract can assert the exact payload without a network stub, then hand it to a thin submit function.

```typescript
// src/components/QualifyForm.tsx (excerpt)
// Source: https://formsubmit.co/documentation (AJAX section)

export function buildSubmissionBody(
  values: Readonly<Record<string, string>>,
  config: ProductQualifyForm,
): Record<string, string> {
  return {
    _subject: config.subject,
    _template: 'table',
    _captcha: 'false',
    _honey: values._honey ?? '',
    ...config.fields.reduce<Record<string, string>>((body, field) => {
      const value = values[field.name]?.trim() ?? '';
      if (value !== '') {
        body[field.emailLabel] = value;   // readable key ⇒ readable email label (LEAD-04)
      }
      return body;
    }, {}),
    Source: config.sourceNote,             // D-05: origin note, no cc
  };
}
```

**Why this shape:** `emailLabel` is the human-readable string that becomes the field label in the delivered email, satisfying LEAD-04 directly rather than depending on FormSubmit's name-prettifier. Omitting empty optional values keeps the email clean. `_autoresponse` is deliberately absent (see Pitfall 5). No `_cc` (D-05). No `_next` (D-01 replaces the redirect flow).

### Pattern 2: Field definitions as product data

```typescript
// src/products/types.ts (excerpt)
export type QualifyControl = 'text' | 'email' | 'tel' | 'select' | 'textarea';

export interface QualifyOption {
  readonly value: string;
  readonly label: string;
}

export interface QualifyField {
  readonly name: string;          // stable id/name attribute
  readonly label: string;         // visible <label> text
  readonly emailLabel: string;    // key in the delivered email (LEAD-04)
  readonly control: QualifyControl;
  readonly required: boolean;     // base requiredness (D-13, D-16)
  readonly autoComplete?: string; // WCAG 1.3.5 token
  readonly maxLength?: number;
  readonly options?: readonly QualifyOption[];
  readonly placeholderOption?: string; // non-selectable prompt for selects
  readonly help?: string;
}

export interface ProductQualifyForm {
  readonly endpoint: string;
  readonly subject: string;
  readonly sourceNote: string;
  readonly fields: readonly QualifyField[];
}
```

**Why:** D-11 requires the form to be product-generic. This also makes every LEAD-02 option list assertable in a data test with no rendering, matching the CONVENTIONS.md rule that repeated content stays "testable without depending on visual selectors."

### Pattern 3: Explicit submission state machine with value retention

```typescript
type SubmitState = 'idle' | 'submitting' | 'succeeded' | 'failed';

const [values, setValues] = useState<Record<string, string>>(initialValues);
const [errors, setErrors] = useState<Record<string, string>>({});
const [submitted, setSubmitted] = useState(false);   // has a submit been attempted? (D-22)
const [state, setState] = useState<SubmitState>('idle');

const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();                    // required — D-01 keeps the visitor in place
  const found = validate(values, config);
  setErrors(found);
  setSubmitted(true);
  if (Object.keys(found).length > 0) {
    return;                                  // values untouched
  }

  setState('submitting');
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(buildSubmissionBody(values, config)),
    });
    setState(response.ok ? 'succeeded' : 'failed');   // never parse the body — see Pitfall 4
  } catch {
    setState('failed');
  }
};
```

**Critical:** `setValues` is never called in the `failed` branch. Entered values survive by construction, which is what LEAD-05 and WCAG 2.2 SC 3.3.7 require. Re-validation-on-correction (D-22) is `submitted && revalidate(field)` inside the change handler — gated on `submitted` so nothing complains during first entry.

### Pattern 4: Error summary + focus move (GOV.UK pattern, adapted)

```tsx
// Rendered above the fieldsets, inside the form, only when errors exist.
// Source: https://design-system.service.gov.uk/components/error-summary/
{summaryVisible && (
  <div ref={summaryRef} tabIndex={-1} className="…">
    <div role="alert">
      <h3>There is a problem</h3>
      <ul>
        {orderedErrors.map(({ name, message }) => (
          <li key={name}><a href={`#${fieldId(name)}`}>{message}</a></li>
        ))}
      </ul>
    </div>
  </div>
)}
```

Move focus to `summaryRef.current` after a failed submit (`useEffect` keyed on an incrementing attempt counter, not on `errors`, so a second failed submit re-announces). Each `<li>` message string must be **byte-identical** to the inline message rendered beside the field, and the inline message is wired with `aria-describedby={errorId}` plus `aria-invalid="true"` on the control. Order `orderedErrors` by DOM field order, not by object key order.

### Pattern 5: Conditionally-required field announced accessibly (D-15)

When `preferredChannel` becomes `whatsapp` or `phone`, phone becomes required. Reflect it in **three** places simultaneously:

1. `required` (native attribute) — drives browser semantics
2. `aria-required="true"` — belt and braces for AT that reads the ARIA property
3. The visible label text — drop the "(optional)" suffix (D-21)

The change itself must be announced. The reliable technique is to route a short sentence through the already-mounted `role="status"` region — e.g. `A phone number is now required because you chose WhatsApp.` Do **not** rely on AT noticing an attribute flip; attribute changes on a non-focused control are not announced by most screen readers.

### Anti-Patterns to Avoid

- **Conditionally mounting the live region.** `{state !== 'idle' && <div role="status">…</div>}` is the shape used at `src/App.tsx:575-586` and it is unreliable — see Pitfall 3.
- **Reusing Phase 1 onboarding accessible names in the fallback/confirmation panels.** Breaks three assertions — see Pitfall 2.
- **Putting the `HAOO` literal in `copy.ts` or any product-generic source.** Breaks `product-shell-reuse.test.tsx:137-153`.
- **`_autoresponse` on an AJAX + `_captcha=false` form.** Documented as non-functional — see Pitfall 5.
- **Treating `VITE_HAOO_FORM_ENDPOINT` as a secret.** It is inlined into the public bundle — see Pitfall 6.
- **Custom `<div role="combobox">` for the county picker.** 48 options is exactly what a native `<select>` is for; a custom listbox adds keyboard, typeahead, and mobile-scroll behaviour you would then have to test.
- **Client-side "sanitizing" of the free-text message.** There is no server and no `dangerouslySetInnerHTML` (forbidden by `build-output.test.ts:293`); React escapes on render and FormSubmit escapes on email composition. Length-limit it and move on.
- **`event.currentTarget.checkValidity()` as the whole validation story.** It is what `src/App.tsx:196-201` does today, but native bubbles cannot express D-15's conditional rule and cannot produce the error summary D-22 requires.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email format checking | A regex email validator | `type="email"` + a presence check | Full RFC 5322 is not regex-expressible; the browser already implements the WHATWG email production; deliverability is decided by the mail server regardless |
| Email delivery, SPF/DKIM, spam scoring | An SMTP client or mail relay | FormSubmit | No server exists; deliverability is an operational discipline, not a code artifact |
| Bot detection | A timing heuristic, a canvas/behaviour fingerprint, or a custom challenge | `_honey` honeypot + `_captcha=false` | D-24 locks this; fingerprinting is explicitly out of scope in REQUIREMENTS.md § Out of Scope; timing checks are a Deferred Idea |
| Focus outline styling | Bespoke `outline` CSS | Existing `focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2` | Already contract-verified at ≥3:1; a new token throws in `focus-contrast.test.ts:110-112` |
| County/administrative data | A hand-typed list from memory | The First Schedule list above, human-verified | Kenyan county spelling varies across sources; a wrong value reaches a real inbox and, in Phase 3, the engagement summary |
| Phone number normalisation | An E.164 parser | `type="tel"` + `autoComplete="tel"` + a permissive length limit | A human reads this email; strict parsing rejects valid Kenyan formats (`0702 188 044`, `+254 702 188 044`, `254702188044`) and creates a false barrier |
| Form state / validation orchestration | — | Plain `useState` + a pure `validate()` | Ten fields, one conditional rule. A library would not solve the error summary, focus move, or live region — which is where the real work is |

**Key insight:** in this domain almost every "custom solution" impulse is really a request for a *server*, and there is no server. Every capability that genuinely needs one has been consciously delegated to FormSubmit (delivery, spam) or deferred to a later phase (measurement, CRM). The correct discipline for Phase 2 is to keep the browser doing only what a browser can honestly do: label, validate, announce, retain, and hand off.

## Common Pitfalls

### Pitfall 1: The Phase 1 static-boundary guard test fails the moment Phase 2 touches a product source

**What goes wrong:** `npm test` fails with a bare `expected … not to match /formsubmit/` (or `/\bfetch\s*\(|.../`, or `/<form\b/`) and the failure looks like an unrelated regression.

**Why it happens:** `src/test/build-output.test.ts` defines a nine-file allowlist and asserts none of them contain form/network/provider tokens:

```typescript
/** Phase 1 product source files — the static boundary later phases may observe but not breach. */
const PRODUCT_SOURCES = [
  'src/pages/ProductPage.tsx',
  'src/components/BrochurePanel.tsx',
  'src/components/OnboardingChoices.tsx',
  'src/components/ProductHeader.tsx',
  'src/components/ProductsSection.tsx',
  'src/products/haoo.ts',
  'src/products/copy.ts',
  'src/products/registry.ts',
  'src/products/types.ts',
];
```
[VERIFIED: src/test/build-output.test.ts:35-46]

and the forbidden patterns:

```typescript
      for (const forbidden of [
        /dangerouslySetInnerHTML/,
        /localStorage|sessionStorage|document\.cookie|indexedDB/,
        /gtag\(|dataLayer|analytics\./,
        /\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/,
        /formsubmit|FormData|<form\b/,
        /react-router|createBrowserRouter/,
        /document\.referrer|navigator\.userAgent|window\.location/,
        /supabase/i,
      ]) {
```
[VERIFIED: src/test/build-output.test.ts:292-306]

D-06 puts a `#qualify` section in `ProductPage.tsx`; D-11 puts the endpoint (containing `formsubmit`) in `haoo.ts`. Both are in the list.

**How to avoid:** Make amending this guard an explicit Wave 0 task with a stated new boundary, for example: keep all eight prohibitions on `BrochurePanel`, `ProductHeader`, `ProductsSection`, `copy.ts`, `registry.ts`, and `types.ts`; keep the storage / analytics / injection / router / supabase prohibitions on *all* sources including `ProductPage.tsx`, `haoo.ts`, and the new `QualifyForm.tsx`; and permit `formsubmit` only in `haoo.ts` and `fetch(`/`<form` only in `QualifyForm.tsx`. Encode that as data (a per-file prohibition map) so the boundary stays legible rather than deleted.

**Warning signs:** a plan that says "update tests as needed", or an executor commit that removes a regex from the array without replacing the guarantee.

### Pitfall 2: The direct-contact fallback panel silently breaks three Phase 1 count assertions

**What goes wrong:** Adding WhatsApp/phone/email links to the failure panel (D-02) or the confirmation panel (D-03) makes `expect(links).toHaveLength(3)` fail with `4` or `5`.

**Why it happens:** `haoo-page.test.tsx` pins four accessible names to exactly three occurrences each, in three separate tests:

```typescript
const ONBOARDING_LINKS = [
  ['Chat with HAOO on WhatsApp', HAOO_PRODUCT.contacts.whatsappHref],
  ['Call +254 702 188 044', 'tel:+254702188044'],
  ['Email info@haoo.online', 'mailto:info@haoo.online'],
  ['Start with HAOO', 'https://manage.haoo.online/'],
] as const;
```
[VERIFIED: src/test/haoo-page.test.tsx:6-11]

asserted at lines 155-165, 366-386 (the partial-media test), and 376-380 (the unclipped-actions test). `product-shell-reuse.test.tsx:115-120` additionally pins `Chat with ZENITH on WhatsApp` and `Start with ZENITH` to `toHaveLength(3)` for a synthetic product.

**How to avoid:** Give the fallback and confirmation panels **distinct accessible names**, built from new `copy.ts` helpers — e.g. `Message ${name} on WhatsApp instead`, `Call ${name} on ${phoneDisplay} instead`, `Email ${name} at ${email} instead`. RTL's string `name` option matches the full normalised accessible name, so a suffix is sufficient to avoid collision. Note that D-08's fourth "send details" link is safe as-is: it is a new, distinct name, so the existing `toHaveLength(3)` assertions are unaffected — do not confuse the two cases.

**Warning signs:** any new link whose visible text starts with `Chat with`, `Call `, `Email `, or `Start with` followed by the product name.

### Pitfall 3: The `role="status"` region never announces because React mounts it with its content

**What goes wrong:** Sighted testing passes; a screen-reader pass in Phase 5 finds that "Sending…", "Message sent", and "Something went wrong" are never spoken. LEAD-05 fails at UAT, after the code is written.

**Why it happens:** Assistive technology must observe the live region *before* its content changes in order to register it with the accessibility API. If the container and its text enter the DOM in the same commit, the mutation is frequently missed. Best practice is a single live region present at page load whose text content is swapped. [CITED: developer.mozilla.org ARIA status role; a11y-collective.com/blog/aria-live/; nvaccess/nvda issue 14591]

The existing site does exactly the unreliable thing:

```tsx
              {contactSubmitted && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                >
```
[VERIFIED: src/App.tsx:575-579]

It happens to work there only because the page reloads via the `_next` redirect, so the region is present from first paint. D-01 removes the reload, so copying the shape copies a bug.

**How to avoid:** Render the region unconditionally from the component's first render and put only text inside it:

```tsx
<p role="status" className="…">{statusMessage}</p>   {/* '' when idle */}
```

Keep exactly one `role="status"` (D-23) and use a separate `role="alert"` for the validation summary. Do not toggle `aria-live` on and off, and do not swap `role` values on the same node.

**Warning signs:** `{state === 'submitting' && <div role="status">`; two live regions competing; `aria-live` set on a node that is also conditionally rendered.

### Pitfall 4: Depending on the FormSubmit success-response body

**What goes wrong:** `data.success === true` is falsy because the provider returns the string `"true"`, or the field is named something else, or the response is not JSON at all — and every successful submission is reported to the visitor as a failure.

**Why it happens:** The FormSubmit documentation shows `.then(response => response.json())` but **does not document the response body shape** [VERIFIED: formsubmit.co/documentation fetched this session — the only response example given is for webhooks, not for the AJAX route]. Community snippets circulate a `{ success: "true", message: … }` shape, but no authoritative source confirms it and no source confirms it is stable.

**How to avoid:** Branch on `response.ok` only. Do not call `response.json()` at all; do not assert on the body in tests. If the provider is later found to return `200` with a failure body, that is a Phase 5 (LEAD-07) discovery with a live inbox to check against — which is precisely why LEAD-07 exists as a separate requirement.

**Warning signs:** `await response.json()` anywhere in the submit path; a test that stubs a response body shape.

### Pitfall 5: `_autoresponse` is configured and silently does nothing

**What goes wrong:** The confirmation copy promises the visitor "we've emailed you a copy", and no email arrives.

**Why it happens:** FormSubmit's documentation states that "autoresponse won't work with forms that are disabled reCAPTCHA and forms that are submitting through AJAX" [CITED: formsubmit.co/documentation]. Phase 2 is **both**: D-24 sets `_captcha=false` and D-01 submits via AJAX. The existing contact form uses `_autoresponse` (`src/App.tsx:558-561`) but it is a redirect-based, captcha-enabled form — the precedent does not transfer.

**How to avoid:** Omit `_autoresponse` entirely. The in-page confirmation panel (D-03) is the acknowledgement. Write its copy so it never promises an automatic email — state the expected human response time and offer WhatsApp/phone as the immediate alternative, exactly as D-03 specifies.

**Warning signs:** confirmation copy containing "check your inbox", "a copy has been sent to you", or "confirmation email".

### Pitfall 6: Treating the FormSubmit token as a secret

**What goes wrong:** The token is stored as a GitHub Actions *secret*, the team believes the HAOO inbox is protected, and someone later relies on that belief.

**Why it happens:** Vite states verbatim: "`VITE_*` variables should *not* contain sensitive information such as API keys. The values of these variables are bundled into your source code at build time." [VERIFIED: vite.dev/guide/env-and-mode]. The value is a literal in `dist/assets/*.js`, readable by anyone. REQUIREMENTS.md § Out of Scope already names this: "Server-side secrets in the static website — GitHub Pages serves all bundled values publicly."

**How to avoid:** Document the token honestly as **obfuscation, not secrecy** — its purpose per D-04 is keeping the readable `info@haoo.online` string out of the bundle so scrapers do not harvest it, not preventing a determined party from finding the endpoint. A GitHub Actions *variable* (`vars`) is the appropriate mechanism; a *secret* is misleading. Provide a documented build-time fallback to `https://formsubmit.co/ajax/info@haoo.online` so a missing variable degrades to a working (if less obfuscated) form rather than an empty endpoint string.

**Warning signs:** a plan that says "store the endpoint securely"; a `.env` file committed; an empty-string endpoint reaching `fetch()`.

### Pitfall 7: The deploy workflow does not pass any env to the build

**What goes wrong:** Local `npm run dev` works with a `.env.local`; the deployed page posts to `undefined` or an empty endpoint.

**Why it happens:** `.github/workflows/deploy.yml` runs `- name: Build` / `run: npm run build` with **no `env:` block anywhere in the file** [VERIFIED: .github/workflows/deploy.yml, read in full this session]. There is currently no environment-backed application setting in the project at all [CITED: .planning/codebase/CONVENTIONS.md § External Boundaries — "There are no environment-backed application settings currently detected"].

**How to avoid:** Plan an explicit task that (a) adds the `env:` block to the Build step, (b) creates the repository variable, and (c) adds a build-time assertion or a documented fallback so a missing value cannot ship silently. Consider a `qualify-form.test.tsx` contract that the resolved endpoint is a non-empty absolute `https://formsubmit.co/ajax/…` URL.

**Warning signs:** `import.meta.env.VITE_…` used with no `??` fallback; no workflow diff in the plan's file list.

### Pitfall 8: A new Tailwind ring colour throws inside the focus-contrast contract

**What goes wrong:** `focus-contrast.test.ts` fails with `resolveRingColor: unrecognized ring colour token "green-500"` — a thrown error, not a soft assertion.

**Why it happens:** The contract deliberately fails loudly on unknown tokens:

```typescript
export const RING_COLOR_TOKENS: Readonly<Record<string, string>> = {
  white: '#ffffff',
  'blue-700': '#1d4ed8',
};
```
[VERIFIED: src/test/focus-contrast.test.ts:22-25]

and it only scans five enumerated files:

```typescript
export const FOCUS_SOURCES = [
  'src/pages/ProductPage.tsx',
  'src/components/ProductHeader.tsx',
  'src/components/OnboardingChoices.tsx',
  'src/components/BrochurePanel.tsx',
  'src/components/ProductsSection.tsx',
] as const;
```
[VERIFIED: src/test/focus-contrast.test.ts:28-34]

**How to avoid:** Use the arbitrary-hex form already used across the product surface — `focus-visible:ring-[#4054C6] focus-visible:ring-offset-2` on light surfaces (computes ≈6.36:1 against the `#ffffff` default offset, comfortably over the 3:1 gate) and `focus-visible:ring-white focus-visible:ring-offset-[#18275F]` on the navy surface (≈14.05:1, and the contract pins this exact pairing at line 233). Add `src/components/QualifyForm.tsx` (and any sibling panel file) to `FOCUS_SOURCES` in the same task, or the new focus styles go unverified — note the contract also asserts `expect(pairs.length).toBeGreaterThan(0)`, so a file added to the list with no focus utility fails.

**Warning signs:** a named Tailwind colour (`green-600`, `emerald-500`) in a `focus-visible:ring-*` utility; a new component file not present in `FOCUS_SOURCES`.

### Pitfall 9: Placeholder text used instead of a label, or a select with no empty prompt

**What goes wrong:** WCAG 3.3.2 and 1.3.1 failures found in Phase 5; and a `<select>` whose first option is a real value silently submits `Landlord` for a visitor who never touched the control.

**How to avoid:** Every control gets a `<label htmlFor>` — CONVENTIONS.md already mandates this and every existing input honours it (`src/App.tsx:586-618`). Every `<select>` gets a leading `<option value="">Select…</option>`; validate `value !== ''` for required selects. Placeholders, where used, supplement the label and never replace it.

### Pitfall 10: `autocomplete` tokens omitted, failing WCAG 1.3.5

**How to avoid:** Set tokens on every field that collects information *about the user*: `name` (or `given-name`/`family-name`), `email`, `tel`, `organization`, `address-level1` for the county select. Role, portfolio band, timeframe, preferred channel, and the free-text message describe the enquiry rather than the person and have no WCAG-defined token — use `autoComplete="off"` or omit. The honeypot keeps `autoComplete="off"` (already the case at `src/App.tsx:572`) so a browser autofill cannot mark a real visitor as spam.

## Code Examples

### Honeypot — reuse the shipped shape verbatim (LEAD-06, D-24)

```tsx
// Source: src/App.tsx:564-573 (verified in repo this session)
<div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
  <label htmlFor="contact-website">Leave this field blank</label>
  <input
    id="contact-website"
    type="text"
    name="_honey"
    tabIndex={-1}
    autoComplete="off"
  />
</div>
```

Off-screen (not `display:none`, which many bots detect), labelled, out of the tab order, and autofill-proof. For the qualify form, change only the `id`/`htmlFor` pair to a `qualify-`-prefixed value so it cannot collide with the contact form when both are rendered — they are on different documents today, but ids should still be unique per component.

### Accessible field with inline error (WCAG 3.3.1 via ARIA21 + SCR32)

```tsx
// Source pattern: https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
//                 https://design-system.service.gov.uk/components/error-message/
const errorId = `${fieldId}-error`;
const helpId = `${fieldId}-help`;
const invalid = Boolean(errors[field.name]);

<div>
  <label htmlFor={fieldId}>
    {field.label}
    {!field.required && <span> (optional)</span>}
  </label>
  {field.help && <p id={helpId}>{field.help}</p>}
  {invalid && (
    <p id={errorId}>
      <span className="sr-only">Error: </span>
      {errors[field.name]}
    </p>
  )}
  <input
    id={fieldId}
    name={field.name}
    type={field.control}
    value={values[field.name]}
    onChange={handleChange(field.name)}
    required={isRequired(field, values)}
    aria-required={isRequired(field, values)}
    aria-invalid={invalid || undefined}
    aria-describedby={[field.help && helpId, invalid && errorId].filter(Boolean).join(' ') || undefined}
    autoComplete={field.autoComplete}
    maxLength={field.maxLength}
    className={`… focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2`}
  />
</div>
```

Note the visually-hidden `Error: ` prefix — a GOV.UK convention that gives screen-reader users the same signal the red styling gives sighted users. `aria-describedby` is built by filtering so an empty string is never emitted.

### Persistent live region (D-23, Pitfall 3)

```tsx
// Mounted on first render, always. Only the text changes.
<p role="status" className="min-h-[1.5rem] text-sm">{statusMessage}</p>
```

with

```typescript
const statusMessage =
  state === 'submitting' ? config.copy.submitting
  : state === 'succeeded' ? config.copy.succeeded
  : state === 'failed'    ? config.copy.failed
  : '';
```

### Test: assert the exact provider payload without a live network

```typescript
// src/test/qualify-form.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); });

it('posts a readable, correctly-addressed payload once the form is valid', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
  vi.stubGlobal('fetch', fetchMock);

  render(<QualifyForm product={HAOO_PRODUCT} />);
  // …fireEvent.change over each required control…
  fireEvent.submit(screen.getByRole('button', { name: /send/i }).closest('form')!);

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe(HAOO_PRODUCT.qualify.endpoint);
  expect(init.method).toBe('POST');
  expect(init.headers['Content-Type']).toBe('application/json');
  const body = JSON.parse(init.body as string);
  expect(body._captcha).toBe('false');
  expect(body._subject).toContain('HAOO');
  expect(body).not.toHaveProperty('_autoresponse');   // Pitfall 5
  expect(body).not.toHaveProperty('_cc');             // D-05
  expect(Object.keys(body)).toContain('Preferred contact channel');  // LEAD-04 readable labels
});
```

`vi.stubGlobal` + `vi.unstubAllGlobals` keeps the network boundary mocked and restored; asserting on the *request* rather than the response is what TESTING.md already prescribes ("mock the network boundary and assert the form payload/configuration instead").

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `alert()` on validation failure (WCAG technique SCR18) | Inline messages + `aria-invalid` + `role="alert"` summary (ARIA21 / SCR32 / ARIA19) | WCAG 2.0 → 2.1 era | SCR18 remains technically sufficient but is a poor experience; the error-summary pattern is the modern default |
| Native browser validation bubbles as the whole story | Native attributes for semantics + JS-authored messages for content and announcement | Ongoing | Bubbles are unstyleable, disappear on blur, and cannot express conditional rules like D-15 |
| Asterisk on every required field | "(optional)" on the few optional ones + a single "all other fields are required" instruction | GOV.UK / NHS / ONS design-system consensus | D-21 already reflects this; it also matches `src/App.tsx:587` |
| Redirect-and-flag submission (`_next` + `?contact=success`) | In-page `fetch` with an explicit state machine | Locked by D-01 for this form | Enables value retention (LEAD-05, WCAG 2.2 SC 3.3.7); the contact form in `src/App.tsx` keeps the old pattern and is out of scope |
| CAPTCHA as the default anti-spam control | Honeypot first; challenge only if spam volume proves it necessary | Ongoing accessibility consensus | D-24 locks honeypot-only; a timing check is a documented Deferred Idea |
| `aria-live` regions created on demand | A single region mounted at page load, text swapped | Long-standing but persistently mis-implemented in SPA frameworks | Directly changes how D-23 must be built (Pitfall 3) |

**Deprecated / outdated for this phase:**
- **`_autoresponse`** — not deprecated generally, but non-functional in this configuration (AJAX + `_captcha=false`).
- **`_next`** — superseded by D-01 for the qualify form.
- **`.planning/codebase/TESTING.md`** — states "No automated test framework … is present" and "`package.json` has no test script". This is **stale**: Vitest 3.2.4 is installed and 65 tests pass across 6 files [VERIFIED: `npm run test:unit` run this session — `Test Files 6 passed (6) / Tests 65 passed (65)`]. The same staleness is mirrored into `AGENTS.md` § Technology Stack ("Not detected. `package.json` has no test script or test framework dependency"). Do not plan from those two statements.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Underscore options (`_subject`, `_template`, `_captcha`, `_honey`) are honoured when sent as keys of a JSON body to the AJAX route, not only as form fields | Pattern 1, Code Examples | Email arrives with a generic subject and no table formatting, or the honeypot/captcha settings are ignored. Detectable only against a live inbox → LEAD-07 verification item |
| A2 | JSON keys containing spaces (`"Portfolio size"`) render as field labels in the delivered email | Pattern 1, LEAD-04 | LEAD-04's "human-readable field labels" is not met. Fallback: use `snake_case` keys and rely on FormSubmit's name-prettifier, which is the mechanism the existing contact form depends on |
| A3 | The FormSubmit success response is `2xx` on acceptance and non-`2xx` on rejection | Pattern 3, Pitfall 4 | Success reported as failure or vice versa. Mitigated by branching only on `response.ok` and by the LEAD-07 live check |
| A4 | Exact spelling/punctuation of the 47 county names (`Taita–Taveta`, `Tharaka-Nithi`, `Elgeyo-Marakwet`, `Murang'a`) | Standard Stack → Reference Data | Wrong county labels reach a real inbox and Phase 3's summary. **Recommend `checkpoint:human-verify`** |
| A5 | `aria-hidden="true"` on the honeypot wrapper containing a `tabIndex={-1}` input is acceptable | Code Examples | An axe/lighthouse audit may flag "aria-hidden element contains focusable element". It is the shipped Phase 1 pattern and `tabindex="-1"` removes keyboard reachability, so the practical risk is a false-positive finding in Phase 5, not a real barrier |
| A6 | GitHub Actions repository *variables* (`vars.*`) are available to this repository and appropriate for the endpoint | Pitfall 6, Environment Availability | If org policy forbids variables, fall back to a committed default endpoint constant with the readable address — functionally identical, less obfuscation |
| A7 | The `#qualify` section's `aria-label` will not collide with the `expectedSections` ordering assertion in `haoo-page.test.tsx:45-49` | Pitfalls / Component Responsibilities | That test filters `getAllByRole('region')` to a fixed five-name list, so a new label is ignored — but a label of `Benefits`/`Capabilities`/`Rental journey`/`Brochure`/`Onboarding` would corrupt the order assertion |
| A8 | `_template: 'table'` is the right formatting choice for a ten-field enquiry | Pattern 1 | Cosmetic only; the alternative (`basic`) is a one-character change |

## Open Questions (RESOLVED)

1. **Does FormSubmit honour underscore options and spaced keys in a JSON AJAX body?** (A1, A2)
   - **RESOLVED disposition:** Phase 2 implements the documented JSON request contract and pure payload builder; Phase 5 `LEAD-07` owns live verification of subject, table formatting, readable labels, and actual mailbox delivery.
   - What we know: the AJAX endpoint accepts `Content-Type: application/json` with an arbitrary flat object [VERIFIED: formsubmit.co/documentation]; CORS permits it from this origin [VERIFIED: live `OPTIONS` probe returning `access-control-allow-origin: *`].
   - What's unclear: whether the provider's option parser reads underscore keys from JSON identically to form-encoded fields, and how it renders keys containing spaces.
   - Recommendation: implement per Pattern 1 with readable keys; add "verify subject line, table formatting, and field labels in the received email" to the Phase 5 LEAD-07 checklist; keep `buildSubmissionBody` a pure function so switching to `snake_case` keys is a one-line change with no component edits.

2. **Exact Kenyan county spelling.** (A4)
   - **RESOLVED disposition:** Plan 02-02 retains a blocking human county checkpoint before the option data is implemented and pinned.
   - What we know: the 47-name list and order are stable across sources; the KLRC First Schedule page could not be reached (307 redirect to an unrelated host, not followed).
   - What's unclear: hyphen/en-dash/apostrophe forms for four names.
   - Recommendation: `checkpoint:human-verify` on the option list before the implementing task; the values are exported data so review is a single file read.

3. **Which VITE variable name, and secret vs variable?** (A6)
   - **RESOLVED disposition:** Use `VITE_HAOO_FORM_ENDPOINT` as the selected GitHub Actions repository variable with the documented readable-address fallback; it is public build configuration, not a secret.
   - Recommendation: `VITE_HAOO_FORM_ENDPOINT` as a repository *variable*, with a documented fallback constant. Name it in the plan so the workflow diff and the source read agree.

4. **Does the disclosure sentence (D-25) need privacy/legal review before merge?**
   - **RESOLVED disposition:** Plan 02-06 retains the privacy/legal decision checkpoint, whose owner selects whether approval gates merge or production activation and may supply replacement wording; no compliance conclusion is inferred.
   - What we know: STATE.md § Blockers records "Privacy/legal ownership must approve notice, storage, retention, processor, and Kenya Data Protection Act decisions before production collection" [VERIFIED: .planning/STATE.md:106]. Phase 2 introduces the first collection of personal data on this site.
   - What's unclear: whether that approval gates *merge* or gates *production activation* (which is LEAD-07 / Phase 5).
   - Recommendation: treat the wording as a `checkpoint:human-verify` item in Phase 2 and the activation as the Phase 5 gate. Do **not** let research or planning assert any Kenya DPA 2019 compliance position — no such determination has been made and inventing one would be a false verified claim.

5. **Should the general contact form in `src/App.tsx` be migrated to the AJAX pattern too?**
   - **RESOLVED disposition:** No; general-contact migration is outside Phase 2's boundary and remains unplanned.
   - Recommendation: no. It is outside the phase boundary stated in CONTEXT.md § Phase Boundary, and D-01 explicitly scopes the departure to the HAOO form. Flag as a candidate for the backlog, not this phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, test | ✓ | Actions pins 22 (`.github/workflows/deploy.yml`) | — |
| npm + lockfile | `npm ci` | ✓ | lockfileVersion 3 | — |
| Vitest + jsdom + RTL | all new contracts | ✓ | 3.2.4 / 26.1.0 / 16.3.2 — 65 tests pass in 3.00s | — |
| `@testing-library/user-event` | (not used) | ✗ | — | `fireEvent` from `@testing-library/react` — the pattern every existing contract uses |
| Network access to `formsubmit.co` | runtime submission only | ✓ (verified from this machine) | — | Tests stub `fetch`; no test may reach the network |
| FormSubmit account activation for `info@haoo.online` | live delivery | ✗ / unknown | — | **No fallback.** Deferred by design: LEAD-07 / Phase 5. Phase 2 must not attempt a live submission |
| GitHub Actions repository variable for the endpoint | deployed build | ✗ (not yet created) | — | Documented default constant `https://formsubmit.co/ajax/info@haoo.online` |
| `env:` block on the workflow Build step | endpoint injection | ✗ (absent) | — | **No fallback** — must be added as a task (Pitfall 7) |
| Screen reader (NVDA/VoiceOver) | LEAD-05, LEAD-06 verification | n/a in CI | — | Manual-only; belongs to Phase 5 UAT, complemented by the automated role/name contracts |

**Missing dependencies with no fallback (must be addressed by the plan):**
- The workflow `env:` block and the repository variable — otherwise the deployed form has no endpoint.

**Missing dependencies with fallback:**
- FormSubmit activation — intentionally deferred to LEAD-07; Phase 2 verification stops at the request payload.
- `user-event` — use `fireEvent`.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + jsdom 26.1.0 + React Testing Library 16.3.2 |
| Config file | `vitest.config.ts` (`environment: 'jsdom'`, `globals: false`, `setupFiles: ['./src/test/setup.ts']`) |
| Quick run command | `npm run test:unit -- --run src/test/qualify-form.test.tsx` |
| Full suite command | `npm test` (runs `vite build` then `vitest run`) |
| Static checks | `npm run typecheck && npm run lint` |
| Baseline at research time | 65 tests passing across 6 files in 3.00s |

`globals: false` means every test file must import `describe`/`it`/`expect`/`vi` from `vitest` explicitly — existing files all do.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LEAD-01 | Name + email render as labelled required controls; a submit with both present and everything else valid reaches `fetch` | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "collects a name and a usable contact method"` | ❌ Wave 0 |
| LEAD-02 | Role, organization, portfolio band, county, timeframe render as controlled selects/inputs; every option list in product data is rendered with no omissions | component + data | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "renders every qualification option"` | ❌ Wave 0 |
| LEAD-02 | The 47-county list plus `Outside Kenya` is exactly the shipped data | data | `npm run test:unit -- --run src/test/qualify-data.test.ts -t "county"` | ❌ Wave 0 |
| LEAD-03 | Optional fields carry "(optional)"; a required-fields instruction is present; the D-25 disclosure sentence is rendered and referenced by the submit control | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "discloses what is collected and what is required"` | ❌ Wave 0 |
| LEAD-04 | The `fetch` request URL, method, headers, `_subject`, and readable payload keys are exact; no `_cc`, no `_autoresponse` | component (stubbed fetch) | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "posts a readable, correctly-addressed payload"` | ❌ Wave 0 |
| LEAD-05 | Failed submit shows inline errors + a `role="alert"` summary, moves focus to the summary, and retains every entered value | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "retains entered values"` | ❌ Wave 0 |
| LEAD-05 | `role="status"` node is present at first render with empty text, and carries submitting → succeeded / failed text | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "announces every submission state"` | ❌ Wave 0 |
| LEAD-05 | A rejected/failed `fetch` renders the retry control and the direct-contact fallback | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "recovers from provider failure"` | ❌ Wave 0 |
| LEAD-06 | Honeypot is present, named `_honey`, `tabIndex={-1}`, `autoComplete="off"`, off-screen, and never required; no captcha widget or third-party script is rendered | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "traps bots without blocking assistive technology"` | ❌ Wave 0 |
| LEAD-06 | Every control is reachable with an accessible name and a visible focus indicator token the contrast contract recognises | source contract | `npm run test:unit -- --run src/test/focus-contrast.test.ts` | ✅ (extend `FOCUS_SOURCES`) |
| D-06/D-07/D-08/D-09 | `#qualify` section sits between `#brochure` and `#onboarding`; a nav entry and three "send details" links point at it | component | `npm run test:unit -- --run src/test/haoo-page.test.tsx -t "qualify"` | ✅ (extend) |
| D-11 | The form renders for a synthetic non-HAOO product; no `HAOO` literal in product-generic sources | component + source scan | `npm run test:unit -- --run src/test/product-shell-reuse.test.tsx` | ✅ (extend) |
| Boundary | The amended static-boundary guard still forbids storage, analytics, injection, router, and supabase in every product source | source scan | `npm run test:unit -- --run src/test/build-output.test.ts -t "boundary"` | ✅ (amend) |
| D-04 / Pitfall 7 | The resolved endpoint is a non-empty absolute `https://formsubmit.co/ajax/…` URL under both a set and an unset env var | data | `npm run test:unit -- --run src/test/qualify-data.test.ts -t "endpoint"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:unit -- --run <affected file> && npm run typecheck` — under 30s (full suite is 3.0s, so a single file is well inside budget).
- **Per wave merge:** `npm run lint && npm test`.
- **Phase gate:** `npm test && npm run typecheck && npm run lint` all green before `/gsd-verify-work`.

This matches the Phase 01 sampling contract in `01-VALIDATION.md`, which the phase was signed off against — keep it identical so the two phases' evidence is comparable.

### Wave 0 Gaps

- [ ] `src/test/qualify-form.test.tsx` — covers LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05, LEAD-06
- [ ] `src/test/qualify-data.test.ts` — covers LEAD-02 option lists and the D-04 endpoint resolution
- [ ] **Amend** `src/test/build-output.test.ts:292-306` — restate the static boundary for Phase 2 (Pitfall 1). This is a Wave 0 task, not a cleanup: the guard must fail loudly for the right reason before implementation starts.
- [ ] **Amend** `src/test/focus-contrast.test.ts:28-34` — add the new component file(s) to `FOCUS_SOURCES` (Pitfall 8)
- [ ] **Amend** `src/test/product-shell-reuse.test.tsx:25-33` — add new product-generic sources to `GENERIC_PRODUCT_SOURCES` so the `HAOO`-literal ban covers them
- [ ] **Amend** `src/test/haoo-page.test.tsx:6-11, 155-165, 366-386` — only if the fallback/confirmation panels' accessible names are not made distinct (Pitfall 2). Preferred resolution is distinct names, leaving these contracts untouched.
- [ ] No framework install needed — Vitest, jsdom, and RTL are present and green.

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` [VERIFIED: .planning/config.json].

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts, sessions, or credentials exist on this site |
| V3 Session Management | no | No session is created; Phase 1 forbids `localStorage`/`sessionStorage`/`document.cookie` in product sources [VERIFIED: src/test/build-output.test.ts:293] |
| V4 Access Control | no | All content is public; there is no protected resource and no server to enforce against |
| V5 Input Validation & Output Encoding | **yes** | Native HTML constraints + a pure `validate()` for semantics/UX; **output encoding is React's automatic JSX escaping** — `dangerouslySetInnerHTML` is forbidden by the boundary guard. Closed `<select>` values (D-16, D-17, D-18, D-19) eliminate free text from all but two fields. The client is *not* a trust boundary: the real encoding responsibility sits with FormSubmit's email composition |
| V6 Cryptography | no | No secrets are stored, transmitted, or derived client-side. The endpoint token is public-by-construction (Pitfall 6), not a cryptographic secret |
| V7 Error Handling & Logging | partial | Failure state must not surface provider response internals to the visitor; show the D-02 fallback copy, not a status code or a stack trace. No client-side logging of submitted values |
| V9 Communications | **yes** | The endpoint MUST be `https://` — an `http://` endpoint would leak submitted PII in cleartext. Assert the `https:` scheme in the endpoint data test |
| V12 Files & Resources | no | No upload capability is added |
| V13 API & Web Service | partial | One outbound cross-origin `POST`. No credentials mode, no cookies, no auth header |
| V14 Configuration | **yes** | Endpoint injected at build time; no `.env` file may be committed; the workflow uses a repository *variable*, not a secret, and its public nature is documented |

### Known Threat Patterns for a static React form → third-party email provider

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Automated spam submissions flooding the HAOO inbox | Denial of Service | `_honey` honeypot + provider-side filtering (D-24); accepted residual risk — timing check is a documented Deferred Idea |
| Email header injection via a submitted value (CRLF in a "reply-to"-ish field) | Tampering | Do not pass any visitor-supplied value into `_replyto` or `_cc`; D-05 already forbids `_cc`. Recipient is fixed in build data, never derived from input |
| HTML/script injection into the delivered email | Tampering | React escapes on render; FormSubmit escapes on composition; free text is limited to two fields with `maxLength`; no `dangerouslySetInnerHTML` (guard-enforced) |
| Reflected XSS via the free-text message re-rendered in the confirmation panel | Tampering | Echo **field labels**, not raw values, in the confirmation panel (D-03 says "what was received" — satisfy it with a summary of categories, not a replay of the message body) |
| PII in transit to a third-party processor | Information Disclosure | HTTPS-only endpoint (V9); disclosure to the visitor near the submit control (LEAD-03 / D-25); processor selection is on the STATE.md blockers list awaiting privacy/legal sign-off |
| Inbox address harvested from the public bundle | Information Disclosure | Random-token endpoint (D-04) — obfuscation only, honestly documented |
| Double submission creating duplicate leads | Tampering (integrity) | Submit button disabled + relabelled while `submitting` (D-23); form replaced by the confirmation panel on success (D-03) |
| Endpoint variable missing at build → form posts nowhere, leads lost silently | Denial of Service | Documented fallback endpoint + an endpoint-shape assertion in the data test (Pitfall 7) |
| Third-party provider outage | Denial of Service | Direct-contact fallback panel (D-02) and the three always-present `OnboardingChoices` blocks — ONBD-05 requires onboarding to survive form-provider unavailability |

**Not asserted here:** any position on Kenya Data Protection Act 2019 obligations (lawful basis, notice, retention, processor agreement). STATE.md records this as an open blocker owned by privacy/legal. Research makes no compliance determination — see Open Question 4.

## Sources

### Primary (HIGH confidence)

- `vite.dev/guide/env-and-mode` — `VITE_` prefix, build-time static replacement, verbatim secrets warning, `.env` load order
- In-repo source read this session with line citations: `package.json`, `vite.config.ts`, `vitest.config.ts`, `.github/workflows/deploy.yml`, `src/App.tsx`, `src/products/{types,haoo,copy,registry}.ts`, `src/pages/ProductPage.tsx`, `src/components/{ProductHeader,OnboardingChoices,BrochurePanel}.tsx`, `products/haoo/index.html`, `src/test/{build-output,focus-contrast,haoo-content,haoo-page,product-shell-reuse}.test.*`, `src/test/setup.ts`, `AGENTS.md`, `README.md`, `.planning/{PROJECT,REQUIREMENTS,ROADMAP,STATE}.md`, `.planning/codebase/{STACK,STRUCTURE,CONVENTIONS,TESTING}.md`, `.planning/phases/01-*/01-{VALIDATION,UI-SPEC,SECURITY}.md`
- Live `OPTIONS` preflight to `https://formsubmit.co/ajax/` — `access-control-allow-origin: *`, `access-control-allow-methods: GET, POST, PUT, OPTIONS`, `access-control-allow-headers: Content-Type, Accept, X-Requested-With, Application`, `allow: POST`
- `npm run test:unit` executed this session — 65/65 passing across 6 files in 3.00s

### Secondary (MEDIUM confidence)

- `formsubmit.co/documentation` — AJAX endpoint format, underscore option list, random-token endpoint, autoresponse/AJAX limitation, cross-origin note
- `w3.org/WAI/WCAG22/Understanding/error-identification.html` — SC 3.3.1 and sufficient techniques G83, G84, G85, SCR18, SCR32, ARIA21, ARIA18, ARIA19
- `design-system.service.gov.uk/components/error-summary/` and `/components/error-message/` — summary markup, placement, focus behaviour, visually-hidden `Error:` prefix, wording-parity rule
- `developer.mozilla.org` ARIA `status` role; `a11y-collective.com/blog/aria-live/`; `nvaccess/nvda` issue 14591 — live-region mounting timing
- `en.wikipedia.org/wiki/Counties_of_Kenya` — 47-county list and codes (see A4 caveat)
- WCAG 2.1 SC 1.3.5 and WCAG 2.2 SC 3.3.7 / 3.3.2 explainers (Silktide, DigitalA11Y, Deque University)

### Tertiary (LOW confidence)

- `gist.github.com/kesarawimal/53d4308a8234638b88275225c32a11b6` — FormSubmit AJAX `fetch` example (headers and JSON body shape). Corroborates the official docs on request shape; **not** relied upon for the response shape
- Community write-ups on honeypot field construction (`aria-hidden` + `tabindex="-1"` + `autocomplete="off"`) — used only to corroborate the pattern already shipped in `src/App.tsx`
- The KLRC First Schedule page was **not** consulted: it returned a 307 redirect to `recaptcha.cloud`, an unrelated host, which was not followed

## Metadata

**Confidence breakdown:**

- **Standard stack: HIGH** — zero new packages; every version read directly from `package.json` and confirmed by a passing suite run this session.
- **In-repo constraints (Pitfalls 1, 2, 8; Component Responsibilities): HIGH** — every claim cites a file path and line range read this session, with the governing source quoted verbatim.
- **Architecture patterns: HIGH** — derived from shipped Phase 1 precedent plus locked CONTEXT.md decisions, not from external opinion.
- **Accessibility patterns (Patterns 4, 5; Pitfalls 3, 9, 10): MEDIUM–HIGH** — W3C Understanding documents are authoritative for the criteria; the GOV.UK markup is a widely-adopted convention, not a normative standard.
- **FormSubmit AJAX semantics: MEDIUM** — endpoint format, option list, and the autoresponse limitation come from the official docs; CORS is verified live; payload-key interpretation (A1, A2) and response shape (A3) are unverified and drive Open Question 1.
- **Kenya county data: LOW at character level** — list and order are stable; punctuation of four names is unverified (A4).
- **Compliance posture: intentionally unasserted** — Kenya DPA 2019 questions are an owned blocker, not a research finding.

**Research date:** 2026-08-30
**Valid until:** 2026-09-29 (30 days). In-repo constraints are stable but re-check `src/test/*.test.*` line numbers if any commit lands on `src/test/` before planning; the FormSubmit provider contract is the item most likely to drift and is re-verified at LEAD-07.
