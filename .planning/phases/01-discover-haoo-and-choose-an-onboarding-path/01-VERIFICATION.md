---
phase: 01-discover-haoo-and-choose-an-onboarding-path
verified: 2026-08-29T15:11:48Z
status: gaps_found
score: 5/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 0/5
  gaps_closed:
    - "MVP phase goal is a valid user story that identifies a user role, capability, and observable outcome"
  gaps_remaining: []
  regressions: []
  note: "Previous run halted at the MVP user-story format preflight and scored nothing. `user-story.validate` now returns valid: true (role/capability/outcome all extracted). This run performed the full technical verification the previous run deferred; all five ROADMAP success criteria and all thirteen requirement IDs were re-derived from codebase evidence, not inherited from the reverted statuses in REQUIREMENTS.md."
gaps:
  - truth: "Color follows the locked HAOO palette and all combinations meet WCAG AA (01-03-PLAN must_haves.truths)"
    status: failed
    reason: "The dark-surface focus ring pairs ring color #4054C6 with ring-offset color #18275F (the panel's own background), removing the light offset gap the UI-SPEC mandates. Measured contrast is 2.22:1 against the panel, below the 3:1 required by WCAG 2.2 SC 1.4.11 (a AA criterion). This contradicts 01-UI-SPEC.md line 174 ('focus uses a 2px accent ring with a 2px light offset') and line 255 ('Focus indicators remain visible on light, navy, and image-adjacent surfaces'). It affects the 'Start with HAOO' self-onboarding action in the opening and closing placements — two of the three onboarding surfaces, and half of the phase's headline assisted-vs-self choice."
    artifacts:
      - path: "src/components/OnboardingChoices.tsx"
        issue: "Line 13 `focusDark` sets `focus-visible:ring-[#4054C6]` together with `focus-visible:ring-offset-[#18275F]`; applied at line 49 whenever `onDark` is true (opening and closing placements)."
    missing:
      - "Use a light ring on dark surfaces (e.g. `focus-visible:ring-white` with `focus-visible:ring-offset-[#18275F]`, which measures 14.1:1) so the indicator clears 3:1."
      - "Add a contract test asserting no `focus-visible:ring-*` colour is paired with a `ring-offset-*` of the same surface colour."
    note: "Phase 5 Success Criterion 2 (QUAL-02) will audit keyboard focus visibility across the whole funnel, so a human may reasonably choose to defer this. It is reported as a gap rather than deferred because it is a defect in code this phase shipped against an accessibility contract this phase declared, not unbuilt work scheduled later."
deferred:
  - truth: "`npm test` passes on a clean checkout, and shipped npm scripts succeed"
    addressed_in: "Phase 5"
    evidence: "Phase 5 success criterion 3: 'Direct production navigation and refresh work for the HAOO page and brochure, while build, typecheck, lint, automated contract/component tests, and required deployed checks pass.' (QUAL-05 maps to Phase 5 in REQUIREMENTS.md.) Covers CR-01 (`src/test/build-output.test.ts` reads gitignored `dist/`, which `npm test` never builds) and CR-02 (`npm run test:phase1:red` inverts its exit code and can never pass now the phase is GREEN)."
coincidental_reliance_items:
  - truth: "HAOO renders from centralized product content and contacts within a reusable product-page shell that can present a future product without copying the page structure (ROADMAP SC-5)"
    reason: undeclared-precondition
    harden: "The shell renders correctly only because the product IS HAOO. Eleven hardcoded `HAOO` literals live in the product-generic components — `Skip to HAOO content`, `HAOO is a ZERO-PAPER HUB product`, `HAOO sections` / `HAOO mobile sections` / `Open|Close HAOO navigation`, `Chat with HAOO on WhatsApp`, `Continue to HAOO's platform`, `Start with HAOO`, `You can still open the HAOO brochure…`, `The overview above is the complete HAOO explanation…`. `ProductsSection` reuse with a second product IS exercised by a test; `ProductPage` reuse never is. Derive that copy from `ProductDefinition.name` and add a ProductPage test that renders a non-HAOO product."
  - truth: "The built artifact contains the nested HAOO document, the byte-faithful PDF, and every referenced product asset (ROADMAP SC-1/SC-3, QUAL-04)"
    reason: undeclared-precondition
    harden: "`src/test/build-output.test.ts` asserts against `dist/`, which is gitignored and which `\"test\": \"vitest run\"` never produces. Suite green depends on a build having been run at some earlier, unspecified time — and passes against a stale `dist/`. This verifier ran `rm -rf dist && npm run build` immediately before `npm test`, so the evidence recorded here is sound; the suite's own guarantee is not. Make the build an explicit precondition of `npm test` and add a staleness guard."
human_verification:
  - test: "Load the home page at md+ (>=768px), scroll down, then click 'Products' in the primary navigation."
    expected: "The 'Products' <h2> is visible below the fixed header, not covered by it."
    why_human: "CR-03 reproduced statically: the fixed header measures ~104px at md+ (py-3 + h-20) while `#products` has only `md:py-16` (64px) of top padding, and `grep` confirms no `scroll-mt` on the section and no `scroll-padding-top` on `html` (scroll-mt appears only in ProductPage.tsx). Whether the heading is fully or partially covered depends on the runtime scrolled/unscrolled header state, which jsdom cannot render."
  - test: "Tab to 'Start with HAOO' in the opening (navy hero) and closing (navy) onboarding panels."
    expected: "A clearly visible focus indicator against the navy panel."
    why_human: "Confirms the computed 2.22:1 gap findings above as experienced, and confirms the fix once applied. Focus-indicator rendering is not observable in jsdom."
  - test: "Open /products/haoo/ at >=1024px and again below 1024px."
    expected: "At lg the inline <object type='application/pdf'> embeds the brochure (or shows the exact 'Brochure preview unavailable' branded panel); below lg the compact preview image shows with an obvious 'Open brochure' action and no tall inline viewer. Open and Download stay visible in every state."
    why_human: "The `lg:hidden` / `hidden lg:block` split and real PDF embedding are CSS/plugin behaviors; jsdom renders both branches and never embeds a PDF."
  - test: "View the home Products section and the HAOO page at 320px width and at 200% browser zoom."
    expected: "Navigation, the featured card, imagery, copy, footer, and every action wrap and reflow with no horizontal page scrolling and no clipped or hidden action."
    why_human: "Declared in 01-03 and 01-04 must_haves as overflow/long-text contracts; jsdom has no layout engine, so the existing `scrollWidth <= clientWidth` assertion is not real evidence."
  - test: "View the home featured HAOO card at lg+ and on mobile."
    expected: "Desktop shows the 5/7 copy/image split in visual balance; mobile stacks copy before the image."
    why_human: "Grid balance and stacking order are visual/layout properties."
  - test: "PROHIBITION REVIEW (PROHIB-ONBD-02, judgment-tier, status unresolved) — 'MUST NOT make assisted or self-onboarding conditional on tracking, browser storage, form delivery, JavaScript readiness, or PDF support.'"
    expected: "Human decision. Tracking, storage, form delivery, and PDF support are honored and enforced by tests. JavaScript readiness is NOT: `dist/products/haoo/index.html` ships an empty `<div id=\"root\">` with no `<noscript>` fallback, so with JavaScript disabled no onboarding link renders at all. ONBD-05 as written in REQUIREMENTS.md does not enumerate JavaScript, so the requirement is met and only the plan's self-imposed prohibition is breached."
    why_human: "Unverified prohibition with directly observed contrary evidence on one clause; the scope call (tighten the code, or narrow the prohibition to match ONBD-05) belongs to the developer."
  - test: "PROHIBITION REVIEW (judgment-tier, all status: unresolved, verification: null) — PROHIB-ONBD-01 (must not obscure that onboarding destinations leave ZERO-PAPER HUB), PROHIB-ONBD-03 (must not frame a demo as the only next step or imply commitment), PROHIB-ONBD-04 (must not put visitor/page/analytics/campaign data in the WhatsApp starter URL), PROHIB-CONTENT-01 (must not imply guaranteed rental income, tenant payment, or vacancy filling), PROHIB-CONTENT-02 (must not alter, embellish, or contradict brochure facts)."
    expected: "Human sign-off. Supporting evidence found: 'These contact links leave the ZERO-PAPER HUB product page.' and 'Opens manage.haoo.online outside ZERO-PAPER HUB.' render in all three placements; the WhatsApp URL carries exactly one fixed compile-time string with no visitor or page data; no guarantee language appears in any rendered copy; all brochure claims, contacts, capability and journey text were diffed against the source brochure and match exactly."
    why_human: "These are judgment-tier prohibitions carried into verification with no wired enforcement, so they fail closed as unverified and cannot be silently absorbed into a pass. NON-AUTHORITATIVE LLM-judge reading: no violation observed."
---

# Phase 1: Discover HAOO and Choose an Onboarding Path Verification Report

**Phase Goal (MVP user story):** As a landlord or property manager, I want to move from the ZERO-PAPER HUB home page to a stable, brochure-faithful HAOO page and immediately choose assisted or self-service onboarding, so that I can start with HAOO through the path I prefer.
**Verified:** 2026-08-29T15:11:48Z
**Status:** gaps_found — 1 accessibility must-have failed; 7 human-verification items; 6 flagged prohibitions
**Re-verification:** Yes — the prior run (`47eec3c`) halted at the MVP format preflight and scored nothing

## MVP Format Preflight

Independently re-confirmed, not taken on trust:

```
gsd-tools query user-story.validate --story "<Phase 1 goal>"
→ { "valid": true, "errors": [],
    "slots": { "role": "landlord or property manager",
               "capability": "move from the ZERO-PAPER HUB home page to a stable, brochure-faithful HAOO page and immediately choose assisted or self-service onboarding",
               "outcome": "I can start with HAOO through the path I prefer" } }
```

The preflight passes, so this run performed the full technical verification. The thirteen Phase 1 requirement statuses in `.planning/REQUIREMENTS.md` (reverted to "Gaps Found" by the halted run) were re-derived from codebase evidence below and were **not** inherited.

## User Flow Coverage

Outcome clause under verification: **"I can start with HAOO through the path I prefer."**

| # | Step | Expected | Evidence in codebase | Status |
|---|------|----------|----------------------|--------|
| 1 | Land on the ZERO-PAPER HUB home page and notice HAOO | A `Products` landmark and nav entry exist between Services and Values | `src/App.tsx:449` renders `<ProductsSection products={products} />`; `homeNavLinks()` (`App.tsx:126-140`) inserts the entry before `#values` from `productsNavLink(PRODUCTS)`; tests `exposes Products between Services and Values in desktop and mobile navigation` and `places the Products landmark after Services and before Values` pass | ✓ |
| 2 | Follow one clear action to the HAOO page | A single native `Explore HAOO` anchor to `/products/haoo/`; card itself not clickable | `ProductsSection.tsx:46-53` renders one `<a href={productRoute(product)}>`; no `onClick` on the `<article>`; test `renders the locked featured card order, supplied preview, and one native action` passes | ✓ |
| 3 | Arrive at a stable URL that survives direct navigation and refresh | A physical `dist/products/haoo/index.html`, not client-side routing | `vite.config.ts` declares the `haoo` MPA input; a clean `rm -rf dist && npm run build` emitted `dist/products/haoo/index.html` (2,018 bytes); no router import anywhere (`build-output.test.ts` forbids `react-router`); production evidence below | ✓ |
| 4 | Read a brochure-faithful HAOO story | Outcome, audience lead, pain→benefit, 6 capabilities, 4 journey steps, caveat, market claim — all matching the source brochure | Verified by direct diff against `lipa_nyumba/marketing/haoo-brochure/brochure.html` (see QUAL-06 below); rendered by `ProductPage.tsx` from `HAOO_PRODUCT` | ✓ |
| 5 | Preview / open / download the original brochure | Compact preview below lg, `<object>` at lg, sibling Open + Download in every state | `BrochurePanel.tsx`; PDF byte-identical to source (SHA-256 verified in three locations); 6 brochure tests pass | ✓ |
| 6 | Immediately choose assisted or self-service onboarding | 4 native destinations, repeated in 3 placements, WhatsApp primary | `OnboardingChoices.tsx` × opening/mid-page/closing; test `renders three independent onboarding placements with exact native hrefs` asserts 3 links each for all 4 destinations | ✓ |
| 7 | **Outcome:** start with HAOO through the preferred path | Every destination is a native, unconditional, correctly-formed link | `tel:+254702188044`, `mailto:info@haoo.online`, `https://wa.me/254702188044?text=…`, `https://manage.haoo.online/` — all asserted exact; no analytics/storage/fetch/form seam exists in any product source | ✓ |

The user-story outcome is observably achieved in the codebase. The gap recorded below degrades the accessibility of step 6 for keyboard users; it does not remove the path.

## Goal Achievement

### Observable Truths

Truths 1–5 are the ROADMAP Success Criteria (the contract). Truth 6 is a plan-added must-have from `01-03-PLAN.md` (plans may add, never subtract).

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor can discover HAOO in a Products section, open `/products/haoo/` directly or by link, refresh it, and see HAOO-specific search/sharing metadata | ✓ VERIFIED | Nav + landmark ordering tested; MPA build emits the physical document; source and built HTML both carry the exact title, description, canonical `https://www.zero-paperhub.com/products/haoo/`, og:type/title/description/url/image/site_name and twitter:card/title/description/image — asserted string-for-string in `build-output.test.ts` and re-read by hand in `dist/products/haoo/index.html`; production 200 recorded (below) |
| 2 | Visitor can understand audiences, benefits, capabilities, and rental journey through responsive semantic HTML whose claims and contacts match the brochure | ✓ VERIFIED | `ProductPage.tsx` renders `<h1>` + section `<h2>`s, a `<ul>` of 6 capabilities and an `<ol>` of 4 journey steps, all mapped from `HAOO_PRODUCT`; every capability/journey/caveat/market-claim string diffed against `brochure.html` and identical. Responsive *rendering* at 320px/200% zoom is routed to human verification |
| 3 | Visitor can preview the brochure when embedding works and can always open or download the published PDF through explicit controls | ✓ VERIFIED | `BrochurePanel.tsx` keeps Open/Download as siblings **outside** the `<object>` in every branch; `previewFailed` state transition covered by a passing test; `rel="noopener"` + `(opens in a new tab)`; `download` attribute; `PDF · 2.1 MB` adjacent; PDF SHA-256 `38d5ad8e…` identical across source, `public/`, and freshly built `dist/` |
| 4 | Prospect can call, WhatsApp, or email HAOO or open `manage.haoo.online`, and every path stays usable without analytics, storage, PDF embedding, or form delivery | ✓ VERIFIED | 12 anchors (4 destinations × 3 placements) with exact hrefs; `build-output.test.ts` scans all eight product sources and rejects `localStorage/sessionStorage/cookie/indexedDB`, `gtag(/dataLayer/analytics.`, `fetch(/XMLHttpRequest/sendBeacon`, `formsubmit/FormData/<form`, `react-router`, `dangerouslySetInnerHTML`, and `supabase` — passing. Brochure failure states never remove an onboarding link. (JS-readiness caveat flagged for human decision — outside ONBD-05's enumerated conditions) |
| 5 | HAOO renders from centralized product content and contacts within a reusable product-page shell that can present a future product without copying the page structure | ✓ VERIFIED (coincidental-reliance) | Every displayed fact flows from `HAOO_PRODUCT`; `registry.ts` drives zero/one/many; `ProductsSection` is proven with a second synthetic product. Advisory: `ProductPage` reuse is never exercised and 11 hardcoded `HAOO` literals live in the product-generic shell — see `coincidental_reliance_items` |
| 6 | Colour follows the locked palette and **all combinations meet WCAG AA** (01-03-PLAN) | ✗ FAILED | Palette usage is correct throughout, but `OnboardingChoices.tsx:13` pairs `ring-[#4054C6]` with `ring-offset-[#18275F]`, erasing the light offset the UI-SPEC mandates. Relative luminances 0.1169 / 0.0250 → **2.22:1**, below SC 1.4.11's 3:1, on `Start with HAOO` in two of three placements |

**Score:** 5/6 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/products/types.ts` | Typed product contract | ✓ VERIFIED | 57 lines, fully `readonly`; consumed by every product module |
| `src/products/haoo.ts` | Centralized HAOO facts + derived hrefs | ✓ VERIFIED | 109 lines; imported by `App.tsx`, `registry.ts`, and both test suites |
| `src/products/registry.ts` | Readonly registry + projections | ✓ VERIFIED | Exports `PRODUCTS`, `productRoute`, `productsNavLink`; wired into `App.tsx` nav and section |
| `src/pages/ProductPage.tsx` | Semantic product shell | ✓ VERIFIED | 189 lines; selected by `App.tsx:656` on `document.body.dataset.page === 'haoo-product'` |
| `src/components/ProductHeader.tsx` | Product-first nav + parent return | ✓ VERIFIED | Benefits/Capabilities/Brochure/Onboarding + `Back to ZERO-PAPER HUB`; `aria-expanded`/`aria-controls` mobile disclosure |
| `src/components/OnboardingChoices.tsx` | Opening/mid/closing variants | ⚠️ WIRED, CONTRACT DEFECT | Rendered in all three positions; carries the failed WCAG focus-ring truth |
| `src/components/BrochurePanel.tsx` | Preview/object/fallback + controls | ✓ VERIFIED | 100 lines; imported and rendered by `ProductPage.tsx:165` |
| `src/components/ProductsSection.tsx` | Zero/one/many home collection | ✓ VERIFIED | Rendered at `App.tsx:449`; `products.length === 0` returns `null` (intentional zero state, tested) |
| `products/haoo/index.html` | Physical nested entry + metadata | ✓ VERIFIED | Declared as a Vite input; `data-page="haoo-product"` drives composition |
| `public/products/haoo/HAOO-Marketing-Brochure.pdf` | Original brochure bytes | ✓ VERIFIED | 2,160,873 bytes, SHA-256 `38d5ad8e…` — byte-identical to the supplied source |
| `public/products/haoo/haoo-logo.png` | Unmodified supplied identity asset | ✓ VERIFIED | SHA-256 `ef318da3…` identical to `haoo-brochure/assets/haoo-logo.png` |
| `public/products/haoo/haoo-hero.png` | Unmodified supplied hero asset | ✓ VERIFIED | SHA-256 `c08abdab…` identical to source |
| `public/products/haoo/brochure-preview.png` | Unmodified supplied preview | ✓ VERIFIED | SHA-256 `7e62c3b7…` identical to `preview-outside.png` |
| `vitest.config.ts` / `src/test/setup.ts` | jsdom harness + cleanup | ✓ VERIFIED | `environment: 'jsdom'`, explicit `cleanup()`, no-op IntersectionObserver |
| `scripts/assert-phase1-red.mjs` | Expected-red discriminator | ⚠️ ORPHANED BY DESIGN | Exists and correctly rejects import/syntax/collection failures, but inverts its exit code so it can never pass now the phase is GREEN (CR-02, deferred to Phase 5 / QUAL-05) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `package.json` | `vitest.config.ts` | `"test": "vitest run"` | ✓ WIRED | 44 tests collected across 4 files |
| `src/App.tsx` | `src/pages/ProductPage.tsx` | physical-entry composition, not client routing | ✓ WIRED | `App.tsx:656-657` branches on `document.body.dataset.page` |
| `src/pages/ProductPage.tsx` | `src/products/haoo.ts` | `ProductDefinition` prop | ✓ WIRED | `<ProductPage product={HAOO_PRODUCT} />` |
| `vite.config.ts` | `products/haoo/index.html` | `rollupOptions.input.haoo` | ✓ WIRED | Confirmed by the emitted `dist/products/haoo/index.html` |
| `src/products/haoo.ts` | `https://wa.me/254702188044` | digits-only number + `encodeURIComponent` | ✓ WIRED | Round-trips: `new URL(href).searchParams.get('text')` equals the exact starter string |
| `src/pages/ProductPage.tsx` | `src/components/OnboardingChoices.tsx` | opening / mid-page / closing | ✓ WIRED | Lines 74, 159, 172 |
| `src/pages/ProductPage.tsx` | `src/components/BrochurePanel.tsx` | brochure section after the story | ✓ WIRED | Line 165, after Benefits→Capabilities→Rental journey; document-order test passes |
| `src/components/BrochurePanel.tsx` | `HAOO-Marketing-Brochure.pdf` | `brochure.pdfHref` on object/open/download | ✓ WIRED | All three references resolve to the emitted `dist` asset |
| `src/App.tsx` | `src/components/ProductsSection.tsx` | section after Services, before Values | ✓ WIRED | Line 449; ordering asserted on `section[id]` sequence |
| `src/components/ProductsSection.tsx` | `src/products/registry.ts` | readonly collection + `productRoute` | ✓ WIRED | `/products/haoo/` derived, never literal |
| `src/test/build-output.test.ts` | `dist/products/haoo/*` | post-build filesystem + SHA-256 | ⚠️ WIRED, PRECONDITION UNDECLARED | Asserts against a gitignored `dist/` that `npm test` never builds (CR-01) |

### Data-Flow Trace (Level 4)

| Artifact | Data value | Source | Produces real data | Status |
|----------|-----------|--------|--------------------|--------|
| `ProductPage` hero | `outcome`, `audienceLead`, `relationship`, `name` | `HAOO_PRODUCT` | Yes | ✓ FLOWING |
| `ProductPage` capabilities | `capabilities[]` (6) | `HAOO_PRODUCT` | Yes | ✓ FLOWING |
| `ProductPage` journey | `journey[]` (4) | `HAOO_PRODUCT` | Yes | ✓ FLOWING |
| `OnboardingChoices` | `contacts.*` (4 destinations) | `HAOO_PRODUCT.contacts` | Yes | ✓ FLOWING |
| `BrochurePanel` | `brochure.*` | `HAOO_PRODUCT.brochure` → real files in `dist` | Yes | ✓ FLOWING |
| `ProductPage` media | `media.logo/hero` | byte-identical supplied PNGs | Yes | ✓ FLOWING |
| `ProductsSection` card | name/outcome/audienceLead/preview/route | `PRODUCTS` registry | Yes | ✓ FLOWING |
| — | `ProductDefinition.audiences` (`['Landlords','Property managers','Tenants','Agents']`) | `HAOO_PRODUCT` | **No consumer** | ✗ DISCONNECTED |

`audiences` is a required, populated, test-asserted field that no component reads (`grep` finds it only in `haoo.ts`, `types.ts`, and the content test). The rendered page communicates its audience through `audienceLead` instead, which is consistent with the roadmap scoping tenants/agents to v2 (PROD-07). ROADMAP SC-2 is therefore satisfied, but the field is dead weight in the contract — a warning, not a blocker.

### Behavioral Spot-Checks

Run in this verifier's own process at HEAD, on a clean build (`rm -rf dist && npm run build`, then the suite once).

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Types compile | `npm run typecheck` | exit 0, no diagnostics | ✓ PASS |
| Lint clean | `npx eslint .` | exit 0, no output | ✓ PASS |
| Clean production build | `rm -rf dist && npm run build` | ✓ built in 2.16s; emitted `dist/index.html` + `dist/products/haoo/index.html` | ✓ PASS |
| Contract suite | `npm test` (once, post-build) | **44 passed / 0 failed**, 4 files | ✓ PASS |
| Brochure byte fidelity | `sha256sum` source vs `public/` vs `dist/` | all three `38d5ad8e7497c65c4fa2d374e7ed5e8d81ab79f3b25d1e0daa73321d45b9e7a6` | ✓ PASS |
| Media byte fidelity | `sha256sum` vs `haoo-brochure/assets/*` and `preview-outside.png` | logo/hero/preview all IDENTICAL | ✓ PASS |
| Brochure copy fidelity | text-extract `brochure.html`, diff against `haoo.ts` | outcome, 6 capability titles+descriptions, 4 journey titles+descriptions, caveat, market claim, `+254 702 188 044`, `info@haoo.online`, `manage.haoo.online` all exact | ✓ PASS |
| Built HAOO document | read `dist/products/haoo/index.html` | HAOO title/canonical/OG/Twitter present; **no `<noscript>`**, empty `<div id="root">` | ✓ PASS (with JS caveat) |
| Anchor scroll offset | `grep -rn "scroll-mt\|scroll-padding" src/` | present only on `ProductPage` sections; absent on `#products` while the home header is `fixed` | ✗ FAIL (CR-03, warning) |
| Focus-ring contrast | compute WCAG luminance for `#4054C6` on `#18275F` | 2.22:1 vs 3:1 required | ✗ FAIL (gap) |
| No-JS onboarding | inspect built document for `<noscript>` | none | ✗ FAIL (flagged prohibition, outside ONBD-05) |

### Probe Execution

| Probe | Command | Result | Status |
|-------|---------|--------|--------|
| `scripts/assert-phase1-red.mjs` | `npm run test:phase1:red` | Not executed | ⚠️ NON-RUNNABLE BY DESIGN — it is a TDD expected-RED gate that `process.exit(1)`s when the suite passes (lines 48-51, read directly). Running it now would both re-run the whole suite and be guaranteed to fail. Recorded as CR-02 / deferred to Phase 5. |

No `scripts/*/tests/probe-*.sh` exist in this repository; no PLAN declares one.

### Requirements Coverage

All thirteen roadmap IDs are claimed by plan frontmatter and all thirteen received a verdict from codebase evidence. **No orphaned requirements.**

| Requirement | Source Plan(s) | Status | Evidence |
|-------------|----------------|--------|----------|
| PROD-01 discover HAOO from home Products section | 01-04 | ✓ SATISFIED | `ProductsSection` at `App.tsx:449` + derived nav entry; ordering and zero-state tests pass |
| PROD-02 stable `/products/haoo/` URL | 01-02 | ✓ SATISFIED | Vite MPA input → physical `dist/products/haoo/index.html`; no client router; production 200 recorded |
| PROD-03 audiences/benefits/capabilities/journey in semantic HTML | 01-03 | ✓ SATISFIED | Semantic landmarks, `<ul>`/`<ol>`, all copy from centralized data and brochure-exact. Responsive rendering routed to human |
| PROD-04 preview + always open/download | 01-05 | ✓ SATISFIED | `BrochurePanel` object/preview/fallback with sibling controls; independence under repeated/concurrent activation tested |
| PROD-05 HAOO-specific title/description/canonical/social metadata | 01-02 | ✓ SATISFIED | Exact strings verified in both source and built HTML; `bolt.new` default OG image explicitly excluded |
| PROD-06 centralized product data supporting future products | 01-02, 01-04 | ✓ SATISFIED (with advisory) | `types.ts`/`haoo.ts`/`registry.ts`; two-product collection test passes. Advisory: 11 hardcoded `HAOO` literals in the shell; `audiences` unrendered |
| ONBD-01 click-to-call `+254 702 188 044` | 01-02 | ✓ SATISFIED | `tel:+254702188044` in 3 placements + footer; display string exact |
| ONBD-02 WhatsApp with generic non-personal starter text | 01-02 | ✓ SATISFIED | One fixed compile-time string, `encodeURIComponent`-encoded, decodes byte-for-code-point; no visitor/page/campaign data |
| ONBD-03 mail link to `info@haoo.online` | 01-02 | ✓ SATISFIED | `mailto:info@haoo.online` in 3 placements + footer |
| ONBD-04 self-onboard via `manage.haoo.online` | 01-02 | ✓ SATISFIED | `https://manage.haoo.online/` with visible "Opens manage.haoo.online outside ZERO-PAPER HUB" disclosure |
| ONBD-05 paths survive analytics/storage/PDF/form unavailability | 01-02 | ✓ SATISFIED | Static-boundary scan over all eight product sources passes; brochure failure branches never remove a link. (JavaScript readiness — not part of ONBD-05 — flagged for human decision) |
| QUAL-04 direct navigation + refresh on the production host | 01-01, 01-02, 01-05 | ✓ SATISFIED (orchestrator-recorded production evidence) | See below |
| QUAL-06 published claims/phone/email/onboarding URL match the brochure | 01-01, 01-03, 01-05 | ✓ SATISFIED | Independently diffed against `brochure.html` by this verifier; PDF and all three images byte-identical to the supplied source |

**QUAL-04 evidence provenance.** This verifier has no network access and did not issue requests. The following is the orchestrator's recorded evidence from `01-05-SUMMARY.md`, cited as such: phase commits pushed to `origin/main`, Pages deploy run `33248331781` succeeded, then `https://www.zero-paperhub.com/products/haoo/` → 200 `text/html` with `<title>HAOO Property Management | ZERO-PAPER HUB</title>` (the HAOO document, not a home fallback), and `.../HAOO-Marketing-Brochure.pdf` → 200 `application/pdf`, 2,160,873 bytes, SHA-256 `38d5ad8e…`; both re-fetched cache-busted with `Cache-Control: no-cache` and still 200. Both returned 404 before deployment, so the blocking-human gate could not have been auto-passed. What this verifier *did* independently confirm and which completes the chain: `deploy.yml` uploads `./dist`; a clean build emits exactly those two paths into `dist`; the built PDF size and checksum match the reported production values byte-for-byte.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | `TBD` / `FIXME` / `XXX` debt markers in phase-modified files | — | **None found.** Debt-marker gate passes |
| `src/components/OnboardingChoices.tsx` | 13, 49 | Focus ring colour equal-luminance-family with its own ring offset | 🛑 Blocker | 2.22:1 focus indicator on `Start with HAOO`, dark placements — see gap |
| `src/components/ProductsSection.tsx` | 79-84 | Anchor target with no `scroll-mt` under a `fixed` header | ⚠️ Warning | `Products` heading lands behind the home header at md+ (CR-03) |
| `src/test/build-output.test.ts` | 7-11 | Test asserts against gitignored, unbuilt `dist/` | ⚠️ Warning | Suite fails on a clean clone and passes against a stale artifact (CR-01) |
| `scripts/assert-phase1-red.mjs` | 48-51 | Shipped npm script with inverted exit code | ⚠️ Warning | `npm run test:phase1:red` can never succeed post-GREEN (CR-02) |
| `ProductPage.tsx`, `ProductHeader.tsx`, `OnboardingChoices.tsx`, `BrochurePanel.tsx` | 11 sites | Hardcoded `HAOO` literals in product-generic components | ⚠️ Warning | A second product would render "Skip to HAOO content", "Start with HAOO", "HAOO is a ZERO-PAPER HUB product" |
| `src/products/haoo.ts` / `types.ts` | 15 / 46 | Required, populated, test-asserted field with no consumer (`audiences`) | ℹ️ Info | Dead contract surface |
| `dist/products/haoo/index.html` | — | No `<noscript>` fallback for a JS-rendered onboarding page | ℹ️ Info → flagged prohibition | With JS disabled the page body is empty |
| `01-03-SUMMARY.md` | 202, 236 | Claim vs actual | ℹ️ Info | Summary asserts `ProductPage` "is the reusable product-agnostic shell"; media paths were indeed centralized, but 11 product-name literals remain — the claim overstates the result |
| `dist/` | — | `CNAME` (extensionless) not emitted; only `CNAME.txt` | ℹ️ Info | Pre-existing, not introduced by this phase; production serves the custom domain per recorded evidence |

`return null` occurrences in `ProductsSection.tsx:77` and `registry.ts:29` were checked and are **not** stubs — they are the documented, tested zero-product states. `placeholder=` matches in `App.tsx` are pre-existing contact-form input attributes untouched by this phase.

### Commit Sequence Check (Plan 01-03, two-session execution)

Chronological order is a coherent RED→GREEN sequence with no orphaned RED:

```
12:47 5c527d3 test(01-03): add failing navigation and onboarding contract     ← RED (session 1, interrupted after Task 1)
12:50 678458b feat(01-03): add product navigation and onboarding placements   ← GREEN (session 2 resume)
12:58 3838f80 test(01-03): add source-faithful HAOO story contract            ← RED
13:00 3f19b92 feat(01-03): render source-faithful HAOO story                  ← GREEN
13:04 ae821ef feat(01-03): publish and wire exact HAOO identity and hero media
13:07 c56a0dc docs(01-03): complete brochure-faithful HAOO product experience plan
```

All five plans follow the same test-before-feat pattern (01-01 through 01-05 verified in `git log`). The working tree is clean at HEAD apart from untracked `.gsd/` and `.planning/milestone.lock`.

### Locked Decisions (01-CONTEXT.md D-01..D-17)

| Decision | Status | Evidence |
|----------|--------|----------|
| D-01 lead with "Run the business—not the paperwork." | ✓ | Sole `<h1>` on the product page and the outcome line on the home card |
| D-02 landlords + property managers together | ✓ | `audienceLead` names both, neither subordinated |
| D-03 guided overview, not full brochure reproduction | ✓ | Benefits + 6 capability groups + 4 journey steps |
| D-04 pain-to-benefit immediately after the opening | ✓ | Benefits section: "The paperwork problem" then "Less chasing. More control." (document-order tested) |
| D-05 brochure after the guided overview | ✓ | Document-position test asserts journey → brochure → onboarding |
| D-06 compact mobile preview, not a tall viewer | ✓ structurally, human to confirm visually | `lg:hidden` compact image / `hidden lg:block` object |
| D-07 separate visible Open and Download | ✓ | Sibling anchors outside the object in every state |
| D-08 branded fallback panel preserving both actions | ✓ | Exact `Brochure preview unavailable` child fallback |
| D-09 assisted primary, self-service clearly visible | ✓ | WhatsApp is the only filled accent action; self-service keeps equal structure, outlined treatment |
| D-10 WhatsApp first, phone/email visible | ✓ | Order and treatment confirmed |
| D-11 onboarding repeated opening / after story / near end | ✓ | Three regions asserted |
| D-12 friendly consultation framing | ✓ | "Tell us about your properties and we'll help you choose the best way to get started." No demo-only or commitment language |
| D-13 HAOO-led inside the ZERO-PAPER HUB shell | ✓ | Indigo/navy product palette; green reserved for `Back to ZERO-PAPER HUB` and the footer return |
| D-14 brand always uppercase `ZERO-PAPER HUB` | ✓ | Asserted with a negative regex against `Zero-Paper Hub` variants; metadata `og:site_name` uppercase |
| D-15 "A ZERO-PAPER HUB product" near identity + footer echo | ✓ | Hero relationship line + footer "HAOO is a ZERO-PAPER HUB product" |
| D-16 product nav prioritizes Benefits/Capabilities/Brochure/Onboarding with a route back | ✓ | `ProductHeader` order; `Skip to HAOO content` is the first focusable control |
| D-17 HAOO as featured home card with outcome, audience, "Explore HAOO" | ✓ | Featured card order asserted; section and shell still accommodate future products |

### Human Verification Required

Seven items — five visual/layout contracts that jsdom cannot assert, plus two prohibition reviews. Full detail in the `human_verification` frontmatter block above.

1. Products anchor vs. fixed header at md+ (CR-03)
2. Focus visibility on the navy onboarding panels (confirms the gap, and the fix)
3. Real `lg` PDF embed vs. below-`lg` compact preview split
4. 320px and 200%-zoom reflow with no horizontal scrolling
5. Featured home card 5/7 balance and mobile copy-before-image order
6. **PROHIB-ONBD-02** — JavaScript-readiness clause is breached (no `<noscript>`); scope decision required
7. **PROHIB-ONBD-01 / -03 / -04, PROHIB-CONTENT-01 / -02** — judgment-tier, unresolved, no wired enforcement; non-authoritative reading found no violation

**unverified-prohibition — human review recommended.** All six prohibitions declared in `01-02-PLAN.md` and `01-03-PLAN.md` carry `status: unresolved` and `verification: null`, so none can be recorded as green. Five have supporting evidence and no observed violation; one (PROHIB-ONBD-02) has directly observed contrary evidence on its JavaScript clause.

## Gaps Summary

Phase 1 is substantively built, not stubbed. Every rendered value traces to centralized product data; every brochure fact, contact string, PDF byte, and image byte was diffed against the supplied source and matches exactly; the physical `/products/haoo/` route is a real Vite MPA output rather than client-side routing; and the no-backend/no-storage/no-tracking boundary is enforced by a passing static-boundary scan across all eight product sources. Typecheck, lint, a clean build, and 44/44 tests were re-run by this verifier rather than taken from the summaries. The MVP user-story outcome — a landlord or property manager can reach HAOO and immediately choose assisted or self-service onboarding — is observably achieved.

One must-have fails. `01-03-PLAN.md` declared that "all combinations meet WCAG AA", and `01-UI-SPEC.md` specified "a 2px accent ring with a 2px light offset" that stays "visible on light, navy, and image-adjacent surfaces". The dark-panel variant instead sets the ring offset to the panel's own navy, producing a 2.22:1 focus indicator on the `Start with HAOO` self-onboarding action in two of the three onboarding placements — below the 3:1 that WCAG 2.2 SC 1.4.11 requires. It is a one-string fix and it sits on half of the phase's headline choice, so it is reported as a gap rather than deferred to the Phase 5 accessibility audit, even though Phase 5 SC-2 would eventually catch it. A human who considers Phase 5 the right home for it can accept the deviation with an `overrides:` entry.

Three further findings did **not** rise to gaps. CR-01 and CR-02 are test-harness debt whose closure is explicitly named by Phase 5 SC-3 (build/typecheck/lint/tests pass), so they are recorded under `deferred`; note that CR-01 means the suite's own green is conditioned on an undeclared prior build, which is why this verifier rebuilt from scratch before trusting it. CR-03 (Products anchor behind the fixed header) is real and reproduced statically, but the featured card and its `Explore HAOO` action still land in view, so discovery — the truth actually claimed — holds; it is routed to human confirmation as a warning. The reusable-shell criterion passes on its stated bar (a future product needs no copied page structure) but holds partly by accident: eleven hardcoded `HAOO` literals in the product-generic components would render wrong copy for any second product, and `ProductPage` reuse is never exercised by a test.

---

_Verified: 2026-08-29T15:11:48Z_
_Verifier: Claude (gsd-verifier)_
