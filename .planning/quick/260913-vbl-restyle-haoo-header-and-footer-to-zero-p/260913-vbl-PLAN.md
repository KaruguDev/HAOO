---
phase: quick-260913-vbl
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/products/copy.ts
  - src/components/ProductHeader.tsx
  - src/pages/ProductPage.tsx
  - src/components/OnboardingChoices.tsx
  - src/index.css
  - src/test/haoo-page.test.tsx
  - src/test/product-shell-reuse.test.tsx
  - src/test/measurement-page.test.tsx
  - src/test/build-output.test.ts
  - e2e/keyboard.e2e.ts
  - e2e/semantics.e2e.ts
  - .planning/phases/05-prove-the-deployed-journey/05-UI-SPEC.md
  - .planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/260913-vbl-visual-check.mjs
  - .planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/260913-vbl-visual-check.json
  - .planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/screenshots/
autonomous: true
requirements: [PROD-03, PROD-06, QUAL-01, QUAL-02, QUAL-03, QUAL-05]

estimate:
  tokens: 100000
  raw_tokens: 200000
  tasks: 3
  confidence: high

must_haves:
  truths:
    - "The rendered page contains no parent-site back link and no anchor to the zero-paperhub.com origin, while the ZERO-PAPER HUB relationship stays visible twice: the hero line 'A ZERO-PAPER HUB product' and the footer sentence 'HAOO is a ZERO-PAPER HUB product' (OD-1, OD-3, D-07)"
    - "The banner holds the HAOO logo in a white rounded card, wrapped in a link named 'HAOO home' that points to #top; the banner carries no standalone product-name text and the hero no longer carries the logo (OD-1)"
    - "The header is fixed to the top; at scrollY <= 40 with the menu closed it is transparent over the navy hero with white/90 links and a white focus ring on a navy offset; once scrolled past 40px, or while the mobile menu is open, it is white with a shadow and navy links; the scroll listener is passive and the state is computed on mount (OD-1)"
    - "The desktop navigation lists Benefits, Capabilities, Brochure, Send details, Onboarding and a rounded-full 'Get started' pill in #4054C6 linking to #onboarding; the mobile toggle keeps aria-controls/aria-expanded and copy.ts labels, and its white panel lists the same six links and scrolls inside the viewport at 320x256 (OD-1)"
    - "Anchor jumps and keyboard focus never land under the fixed header (html scroll-padding-top), the skip link paints above the header, header transitions are suppressed under prefers-reduced-motion, and every header/footer control keeps a 44px target (OD-1)"
    - "The footer is navy #0F1A45: logo link left, the five section links plus 'How we measure this page' (still opening the disclosure) centred in a non-landmark wrapper, '(c) {current year} HAOO. All rights reserved.' right; below a divider one centred line: phone link, email link, 'HAOO is a ZERO-PAPER HUB product' (OD-3)"
    - "The site font is Noto Sans from a first-line Google Fonts @import with display=swap (fallback 'Noto Sans', system-ui, sans-serif); h1 renders weight 900, ProductPage/OnboardingChoices h2 800, ProductPage h3 700, header links 500, the CTA 600 (OD-2)"
    - "npm test, lint, typecheck, verify:coverage, verify:disjoint, test:phase1:contracts, build and the preview Playwright project all pass; the visual check records no covered anchored heading and AA contrast in both header states at 1440 and 390 (OD-5, OD-6)"
  artifacts:
    - path: "src/components/ProductHeader.tsx"
      provides: "Fixed transparent-to-white header with logo home link, section links, Get started CTA, state-aware focus constants, scrollable mobile panel"
      contains: "passive: true"
    - path: "src/products/copy.ts"
      provides: "PRODUCT_SECTION_LINKS shared by header and footer; productHomeLinkLabel and copyrightLine product-generic builders"
      contains: "export function productHomeLinkLabel"
    - path: "src/pages/ProductPage.tsx"
      provides: "Hero without logo and with fixed-header top padding; ZPH-layout navy footer; heavier heading weights"
      contains: "copyrightLine("
    - path: "src/index.css"
      provides: "Noto Sans first-line import, body font stack, html scroll-padding-top for the fixed header"
      contains: "family=Noto+Sans"
    - path: "e2e/keyboard.e2e.ts"
      provides: "KF-1 opening stops re-pinned to the logo home link and Get started CTA"
      contains: "HAOO home"
    - path: ".planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/260913-vbl-visual-check.json"
      provides: "Measured anchor offsets, contrast ratios, overflow and axe color-contrast readings for both header states"
  key_links:
    - from: "src/components/ProductHeader.tsx"
      to: "src/products/copy.ts"
      via: "PRODUCT_SECTION_LINKS, productHomeLinkLabel, sectionsNavLabel, mobileSectionsNavLabel, navigationToggleLabel, mobileNavigationId"
      pattern: "PRODUCT_SECTION_LINKS"
    - from: "src/pages/ProductPage.tsx footer"
      to: "handleMeasurementDisclosureLink"
      via: "onClick on the 'How we measure this page' link with href #haoo-measurement-disclosure"
      pattern: "onClick=\\{handleMeasurementDisclosureLink\\}"
    - from: "src/test/focus-contrast.test.ts extractFocusPairs"
      to: "ProductHeader.tsx / ProductPage.tsx focus class constants"
      via: "each ring colour and its offset colour live in ONE plain literal; state selection is by identifier"
      pattern: "ring-offset-\\[#18275F\\]|ring-offset-\\[#0F1A45\\]"
    - from: "src/index.css scroll-padding-top"
      to: "ProductHeader solid-state height"
      via: "5rem below md, 6rem from md (solid header is 64-88px tall)"
      pattern: "scroll-padding-top"
---

<objective>
Restyle the HAOO page header and footer to match the ZERO-PAPER HUB parent site layout (fixed transparent-to-white top bar with logo card and pill CTA; navy three-column footer with a centred contact/relationship line) while keeping HAOO's own palette (#18275F, #4054C6, #DBE2FF, #DFE4F0, #FBFCFF) and switching the site font to Noto Sans with heavier headline weights.

Owner decisions (2026-09-13, locked), cited below as OD-1..OD-6:
- OD-1 top bar: remove the parent-site back link and the product-name span; move the logo into the header as a white-card home link; fixed, transparent over navy then white with shadow on scroll; "Get started" pill to #onboarding; keep section links and the mobile menu; offset the fixed header for hero, anchors, focus; reduced-motion; visible focus; 44px targets; skip link keeps working.
- OD-2 font: Noto Sans via first-line @import, fallback 'Noto Sans', system-ui, sans-serif; h1 900, nav 500, buttons 600, section headings heavier.
- OD-3 footer: ZPH layout in HAOO navy; logo / section links + measurement link / copyright; divider; phone · email · relationship sentence; no parent back link anywhere.
- OD-4 re-pin every unit and e2e contract to the new markup instead of deleting coverage.
- OD-5 gates: npm test, lint, typecheck, verify:coverage, verify:disjoint, test:phase1:contracts, build, plus the locally runnable Playwright project.
- OD-6 visual check with screenshots at 1440 and 390 (top, scrolled, footer), anchored headings uncovered, AA contrast in both header states.
- D-07 (Phase 1, still binding): the parent relationship stays visible on HAOO's own domain. It survives through the hero relationship line and the footer relationship sentence.

Supersedes (05-UI-SPEC.md, recorded by Task 3): KF-1 opening stops (the parent link stop becomes the logo home link; desktop gains Get started); Design System font row and Typography weights; header/footer rows of the Color table; the Phase 01 decision "scroll-mt on the products target, not scroll-padding-top on html" (its reason, a shared html with a non-fixed header, stopped existing at the 04.2 split and the header is now fixed).

Purpose: the HAOO page reads as part of the ZERO-PAPER HUB family without losing HAOO's identity, and every accessibility contract proven in Phase 5 keeps holding.
Output: restyled header/footer/typography, re-pinned unit and e2e contracts, a supersession note, and a reproducible visual check with screenshots and measurements.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@AGENTS.md
@.planning/phases/05-prove-the-deployed-journey/05-UI-SPEC.md
@src/components/ProductHeader.tsx
@src/pages/ProductPage.tsx
@src/index.css
@src/products/copy.ts
@src/test/focus-contrast.test.ts

Reference only (do not edit): ../ZERO-PAPERHUB/src/App.tsx header (about lines 176-260, scroll threshold `window.scrollY > 40`) and footer (about lines 627-647).

Facts measured while planning (do not re-derive):
- `src/test/focus-contrast.test.ts` `extractFocusPairs` reads every quoted or template literal as ONE string, including any `${...}` expression text inside a template literal, and pairs each ring colour with the first colour offset found in that same literal (default offset #ffffff). A template literal holding both `ring-[#4054C6]` and `ring-offset-[#18275F]` therefore computes 2.21:1 and fails. `RING_COLOR_TOKENS` knows only `white` and `blue-700`; arbitrary `[#rrggbb]` resolves; an opacity token such as `white/90` inside a ring utility throws. `FOCUS_SOURCES` already registers ProductHeader.tsx and ProductPage.tsx and must stay unchanged.
- `src/test/build-output.test.ts` gives ProductHeader.tsx and ProductPage.tsx `FULL_BOUNDARY`; `window.location`, storage, `fetch` and `<form` are forbidden, `window.scrollY` and `window.addEventListener` are not.
- `src/test/product-shell-reuse.test.tsx` rejects the literal product name in ProductHeader.tsx, ProductPage.tsx, OnboardingChoices.tsx and copy.ts (comments ignored), renders a synthetic product `ZENITH`, pins every copy builder byte-for-byte and checks blank names throw `Product name must not be empty`.
- `src/test/haoo-page.test.tsx:52-56` asserts the parent link plus `screen.getByRole('link', { name: sectionName })` (singular: becomes ambiguous once the footer repeats section links); `:319-328` pins the logo img (`/brochure/haoo-logo.png`, alt '', 362x176); `:403` counts two parent links.
- `src/test/measurement-page.test.tsx:899-935` looks the parent link up inside `contentinfo`, compares link order against it, requires `footer.querySelector('.flex.flex-wrap')` and `min-h-11` on the measurement link.
- `e2e/semantics.e2e.ts`: `EXPECTED_UNEXPOSED_AT_DESKTOP` (compared sorted, measured at 1280), `UNMATCHED_DESTINATION_NAMES` (closed list: every link name that matches no D1-D4 rule must be listed), identical name must resolve to identical destination, landmark counts one banner/main/contentinfo, and at most one `navigation` landmark exposed per state. There is no per-rule vacuity guard, so D4 may stay with zero matches.
- `e2e/keyboard.e2e.ts`: `PARENT_LINK_NAME` feeds `expectedOpeningStops(width)`; traversal must end on the last `footer a[href]`.
- `e2e/viewport.e2e.ts` VC-3 (live only) scrolls every link in the opened mobile nav into view at 360, 390 and 320x256 and requires a 44px target that receives the pointer.
- keyboard, viewport, semantics and most zoom-motion specs call `requireLive` and skip on the preview project. axe-gate, form-states, recovery and zoom-motion ZM-2a/2b run on preview. `evidence/*.json` is tracked except `evidence/playwright-run.json`.
- No test pins Inter, fonts.googleapis.com, heading weight classes or `scroll-mt-*`. No CSP exists in index.html.
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: End-to-end fixed ZPH-style header with logo home link, scroll state and CTA; parent back links removed</name>
  <files>src/products/copy.ts, src/components/ProductHeader.tsx, src/pages/ProductPage.tsx, src/index.css, src/test/haoo-page.test.tsx, src/test/product-shell-reuse.test.tsx, src/test/measurement-page.test.tsx</files>
  <behavior>
    - banner contains exactly one link named 'HAOO home' whose href is '#top' and which wraps the logo img (src /brochure/haoo-logo.png, alt '', width 362, height 176); `main` contains no logo img
    - no rendered link carries the parent-site back-link accessible name and `container.querySelectorAll('a[href*="zero-paperhub"]')` is empty (header and footer)
    - banner has no element whose own text is exactly the product name while a logo is supplied
    - header className contains 'fixed' and 'top-0'; at scrollY 0 it contains 'bg-transparent' and each desktop section link contains 'text-white/90'; after setting window.scrollY to 120 and firing a scroll event it contains 'bg-white' and 'shadow-md' and the links contain 'text-[#18275F]'; back at 0 it is transparent again; opening the mobile menu at scrollY 0 makes it 'bg-white'
    - window.addEventListener receives ('scroll', handler, { passive: true }) on mount and window.removeEventListener receives the same handler on unmount
    - within navigation 'HAOO sections': the five section links in order Benefits, Capabilities, Brochure, Send details, Onboarding, then a link 'Get started' with href '#onboarding' whose className contains 'rounded-full' and 'bg-[#4054C6]'
    - after opening the toggle, navigation 'HAOO mobile sections' contains the same five links plus 'Get started' (href '#onboarding'); clicking any of them closes the menu (aria-expanded false)
    - the hero still renders 'A ZERO-PAPER HUB product' and the product-name eyebrow above the h1; the footer still renders 'HAOO is a ZERO-PAPER HUB product' (D-07)
    - the skip link className contains 'z-[60]'
    - productHomeLinkLabel('HAOO') === 'HAOO home'; copyrightLine('HAOO', 2026) === '© 2026 HAOO. All rights reserved.'; both throw 'Product name must not be empty' for a blank name; the synthetic ZENITH render exposes a link 'ZENITH home' with href '#top' and still contains no 'HAOO'
  </behavior>
  <action>
Write the behaviours above as failing tests first (RED), then implement (GREEN), then commit once.

Tests (per OD-4, re-pin rather than delete):
- src/test/haoo-page.test.tsx: in the test at lines 52-56, invert the existing parent-link assertion (keep the literal already on that line) into `queryAllByRole(...)` having length 0, add the `a[href*="zero-paperhub"]` empty check, and scope the section-link loop with `within(screen.getByRole('navigation', { name: 'HAOO sections' }))` so footer copies added in Task 2 cannot make it ambiguous. At line 403 replace the two-link count with the zero-link count plus the banner home-link and Get started assertions. Extend the logo test at 319 to scope the logo img to `screen.getByRole('banner')` and assert none inside `screen.getByRole('main')` (do not assert a page-wide logo count; Task 2 adds a footer logo). Add one new `it` for the scroll state and passive listener: spy on window.addEventListener/removeEventListener with `vi.spyOn`, set scrollY through `Object.defineProperty(window, 'scrollY', { value, configurable: true })` inside `act`, fire `fireEvent.scroll(window)`, and restore scrollY to 0 and the spies in a `finally` or afterEach so later tests are unaffected.
- src/test/product-shell-reuse.test.tsx: import productHomeLinkLabel and copyrightLine; add both byte pins to 'reproduces every shipped product-name string byte for byte' (write the copyright sign as the escape ©, matching the repo's escape-pinning precedent); add productHomeLinkLabel to the nameBuilders list and a separate `expect(() => copyrightLine('  ', 2026)).toThrow('Product name must not be empty')`; in the synthetic render assert `getAllByRole('link', { name: 'ZENITH home' })` is non-empty and every href is '#top'.
- src/test/measurement-page.test.tsx (899-935): drop the `backLink` lookup and the indexOf comparison against it; assert instead that `within(footer).queryByRole` for the old parent link name (the literal already on line 919) returns null. Keep every other assertion (href, open, defaultPrevented false, focus not moved, no event, `.flex.flex-wrap`, `min-h-11`, no truncation classes).

Implementation:
- src/products/copy.ts: move the section link list out of ProductHeader into an exported readonly `PRODUCT_SECTION_LINKS` (same five label/href pairs, same order, `as const`); add `productHomeLinkLabel(productName)` returning `${requireIdentity(productName, 'name')} home`; add `copyrightLine(productName, year: number)` returning the copyright sign (escape ©), a space, the year, a space, the required name, then '. All rights reserved.'. No product-name literal in this file.
- src/components/ProductHeader.tsx (OD-1), following the ZPH header structure with HAOO colours:
  - Delete the parent-site back link anchor and the product-name span entirely.
  - State: keep `menuOpen`; add `scrolled` (useState false) set by a `useEffect` that defines one named handler computing `window.scrollY > 40`, calls it once immediately (initial state on mount, e.g. page loaded at a fragment), registers it with `window.addEventListener('scroll', handler, { passive: true })`, and removes the same handler in cleanup. Derive `solid = scrolled || menuOpen` so the open mobile panel always sits under a white bar.
  - Focus classes: keep the existing blue literal as a module constant for light surfaces (ring [#4054C6], default white offset) and add a SEPARATE module constant for the navy state holding `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#18275F]`. Choose between them by identifier (`solid ? light : navy`). Never write both ring colours, or a ring colour and a foreign offset, inside one template literal: the focus-contrast extractor reads the whole template including `${}` text and would pair the blue ring with the navy offset at 2.21:1. No opacity modifier inside any ring utility.
  - `<header>` classes: `fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,padding] duration-300 motion-reduce:transition-none`, plus `bg-white shadow-md py-2 md:py-3` when solid, `bg-transparent py-3 md:py-5` otherwise. Inner row: `mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8`.
  - Home link (first child): `href="#top"`, `aria-label={productHomeLinkLabel(product.name)}`, `inline-flex min-h-11 min-w-0 shrink-0 items-center rounded-lg` plus the state focus constant. When `product.media.logo` exists render the img with src/alt/width/height from product data, `loading="eager" decoding="async"`, classes `h-12 w-auto rounded-lg bg-white/95 object-contain p-1 shadow-sm sm:h-14 sm:p-1.5 lg:h-16` (constant size across states, so only padding changes). When no logo is supplied, render `{product.name}` as text inside the link (text-lg font-extrabold, white or navy by state) so a logo-less product still has header identity; HAOO always supplies a logo, so the product-name span the owner removed never renders for HAOO.
  - Desktop `<nav aria-label={sectionsNavLabel(product.name)} className="hidden items-center gap-4 md:flex lg:gap-6 xl:gap-8">`: map PRODUCT_SECTION_LINKS to `inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-medium tracking-wide transition-colors duration-200 motion-reduce:transition-none` plus `text-[#18275F] hover:text-[#4054C6]` when solid or `text-white/90 hover:text-white` otherwise, plus the state focus constant. After the links, inside the same nav, the CTA: label 'Get started', href '#onboarding', `ml-2 inline-flex min-h-11 items-center rounded-full bg-[#4054C6] px-5 text-sm font-semibold text-white shadow transition-colors duration-200 hover:bg-[#34459F] motion-reduce:transition-none` plus the state focus constant. Keep 'Get started' as a module constant in this file (no product name in it).
  - Toggle button: unchanged aria-label/aria-controls/aria-expanded wiring and copy.ts labels; `inline-flex size-11 shrink-0 items-center justify-center rounded-lg md:hidden` plus `text-[#18275F] hover:bg-[#E9EDFF]` when solid or `text-white hover:bg-white/10` otherwise, plus the state focus constant.
  - Mobile `<nav id={menuId} aria-label={mobileSectionsNavLabel(product.name)} hidden={!menuOpen} className="md:hidden">`: keep all display utilities on the inner div only (a display class on the nav itself would defeat the hidden attribute). Inner div: `flex max-h-[calc(100dvh-5rem)] flex-col gap-1 overflow-y-auto border-t border-[#DFE4F0] bg-white px-4 pb-4 pt-2 shadow-md sm:px-6`, so every entry can be scrolled into view at 320x256 (VC-3). Links keep the existing navy/`hover:bg-[#E9EDFF]` styling with the light focus constant and close the menu on click; append the Get started pill (full width, `justify-center rounded-full bg-[#4054C6] text-white font-semibold`, light focus constant) which also closes the menu.
- src/pages/ProductPage.tsx:
  - Skip link: change `z-50` to `z-[60]` so it paints above the fixed z-50 header that follows it in DOM order.
  - Hero: remove the logo `<span>`/`<img>` block; keep the `<p>` with `product.relationship` (give it `mb-4` directly and drop the now-empty flex wrapper), keep the `{product.name}` eyebrow and h1. Change the hero section padding from `py-12 ... md:py-16` to `pb-12 pt-28 sm:pt-32 md:pb-16 md:pt-36 lg:pt-40` (transparent header is 72/80/96/104px tall at base/sm/md/lg).
  - Footer: delete only the parent-site back link anchor for now (Task 2 rebuilds the footer). Leave FOCUS_SOURCES untouched.
- src/index.css: after the reduced-motion block add `html { scroll-padding-top: 5rem; }` and `@media (min-width: 768px) { html { scroll-padding-top: 6rem; } }` with a short comment: fixed header, solid height 64-88px, covers both fragment jumps and focus-scrolling (WCAG 2.4.11), supersedes the Phase 01 scroll-mt-only decision whose shared-html reason ended at the 04.2 split. Keep the sections' existing `scroll-mt-4` (adds breathing room). Do not touch the font import in this task.

Commit: `feat(quick-260913-vbl): fixed ZPH-style header with HAOO logo home link, remove parent back links` with the trailer line `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Do not push.
  </action>
  <verify>
    <automated>cd "/home/paul/Documents/Vibe Coding Projects/HAOO" && npm run build && npx vitest run src/test/haoo-page.test.tsx src/test/product-shell-reuse.test.tsx src/test/measurement-page.test.tsx src/test/focus-contrast.test.ts src/test/build-output.test.ts && npm run lint && npm run typecheck && test "$(grep -rh 'Back to ZERO-PAPER HUB' src/components src/pages | grep -vE '^\s*(//|\*|/\*)' | wc -l)" -eq 0 && test "$(grep -rh 'zero-paperhub.com' src/components src/pages | grep -vE '^\s*(//|\*|/\*)' | wc -l)" -eq 0 && grep -q 'passive: true' src/components/ProductHeader.tsx && grep -q 'scroll-padding-top' src/index.css</automated>
  </verify>
  <done>Header is fixed with the logo home link, transparent/white scroll states, desktop and mobile Get started CTA and a scrollable mobile panel; no parent back link renders anywhere; hero keeps the relationship line without the logo; the listed vitest files, lint and typecheck pass; one commit with the trailer exists.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Navy ZPH-layout footer, Noto Sans font and heavier headline weights</name>
  <files>src/pages/ProductPage.tsx, src/components/OnboardingChoices.tsx, src/index.css, src/test/measurement-page.test.tsx, src/test/haoo-page.test.tsx, src/test/build-output.test.ts</files>
  <behavior>
    - contentinfo className contains 'bg-[#0F1A45]' and contentinfo exposes zero navigation roles
    - contentinfo links in DOM order: 'HAOO home' (#top, wraps the logo img), Benefits, Capabilities, Brochure, Send details, Onboarding, 'How we measure this page' (#haoo-measurement-disclosure), '+254 702 188 044' (tel:+254702188044), 'info@haoo.online' (mailto:info@haoo.online); the last `footer a[href]` is the email link
    - the five section links and the measurement link share one `.flex.flex-wrap` element whose tagName is DIV
    - one footer paragraph has text exactly copyrightLine('HAOO', new Date().getFullYear())
    - one footer paragraph contains the phone link, the email link and the text 'HAOO is a ZERO-PAPER HUB product', with aria-hidden separators
    - every footer link className contains 'min-h-11', 'focus-visible:ring-white' and 'focus-visible:ring-offset-[#0F1A45]'
    - clicking 'How we measure this page' still opens the disclosure without preventing default, moving focus or emitting an event (existing assertions)
    - exactly two logo imgs page-wide: one inside banner, one inside contentinfo, none inside main
    - the h1 className contains 'font-black'; every level-2 heading contains 'font-extrabold'; the painHeading, benefitHeading, capability-title and journey-title h3s contain 'font-bold'
    - src/index.css first non-blank line is the Noto Sans Google Fonts @import with weights 400;500;600;700;800;900 and display=swap, the body declares 'Noto Sans', system-ui, sans-serif, and the built stylesheet under dist/assets begins with that @import and names no other font family
  </behavior>
  <action>
Write the behaviours above as failing tests first (RED), then implement (GREEN), then commit once.

Tests (OD-4):
- src/test/measurement-page.test.tsx: in the footer test at 899-935, or a new adjacent `it`, add the footer structure behaviours: link order and hrefs via `within(footer).getAllByRole('link')`, `within(footer).queryAllByRole('navigation')` length 0, the `.flex.flex-wrap` element's tagName, the copyright paragraph (expected value built with copyrightLine and `new Date().getFullYear()`, never a hard-coded year), the relationship paragraph and the ring classes.
- src/test/haoo-page.test.tsx: extend the logo test to the two-placement contract (banner + contentinfo, none in main) and add a heading-weight test for the h1/h2/h3 behaviours.
- src/test/build-output.test.ts: add an `it` beside the existing dist-reading cases that (a) reads src/index.css and asserts its first non-blank line starts with `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800;900&display=swap')` and that the body rule declares `font-family: 'Noto Sans', system-ui, sans-serif`; (b) uses the existing `listFiles` helper to collect dist/assets/*.css, requires at least one, and asserts the trimmed stylesheet starts with `@import`, includes `family=Noto+Sans` and `display=swap`, and contains exactly one `family=` occurrence. Inspect the emitted form once (`head -c 300 dist/assets/*.css`) and pin what Vite actually writes. Browsers silently ignore an @import that follows any other rule, so this is the guard against the misplaced-import failure the parent site has.

Implementation:
- src/index.css (OD-2): replace the current first line (the Inter import) with the Noto Sans import quoted above, as the very first line of the file with nothing before it; change the body font-family to `'Noto Sans', system-ui, sans-serif`. Leave the Tailwind directives, the reduced-motion block and Task 1's scroll-padding rules as they are.
- src/pages/ProductPage.tsx headings (OD-2): h1 classes become `mb-6 text-[40px] font-black leading-[1.1] tracking-tight`. Add `sectionHeadingClasses = 'text-[28px] font-extrabold leading-[1.2]'` and use it on every `<h2>` in this file; change `headingClasses` (now used only by h3s) to `text-[28px] font-bold leading-[1.2]`. Sizes and body copy stay unchanged.
- src/components/OnboardingChoices.tsx: change `font-semibold` to `font-extrabold` in its two h2 class strings only. Component-internal h3s in BrochurePanel, QualifyForm and QualifyFallback keep their weight: they are outside OD-2's headline scope, and the SUMMARY records this as a discretion choice.
- src/pages/ProductPage.tsx footer (OD-3), replacing the whole current footer element:
  - `footerLinkClasses` becomes one plain literal: `inline-flex min-h-11 items-center rounded-lg px-2 text-[#DBE2FF] hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1A45]`. Add `footerLogoLinkClasses` as one plain literal: `inline-flex min-h-11 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1A45]`. Each ring colour sits with its own offset in one literal (white on #0F1A45 is about 16:1; #DBE2FF text on #0F1A45 is about 13:1).
  - Footer element: `<footer className="bg-[#0F1A45] py-10 text-sm font-normal leading-[1.4] text-[#DBE2FF]">`, then a `containerClasses` div.
  - Top row: `flex flex-col items-center gap-6 md:flex-row md:justify-between`. Left, only when `product.media.logo` exists: a link with `href="#top"`, `aria-label={productHomeLinkLabel(product.name)}` and `footerLogoLinkClasses`, wrapping the img (src/alt/width/height from product data, `loading="lazy" decoding="async"`, classes `h-16 w-auto rounded-lg bg-white/95 object-contain p-1.5`). Centre: `<div className="flex flex-wrap justify-center gap-x-2 gap-y-1">` — a div, never a nav, because semantics e2e allows one navigation landmark per state — mapping PRODUCT_SECTION_LINKS with `footerLinkClasses`, followed by the measurement link with unchanged `href={`#${measurementDisclosureId(product.slug)}`}`, `onClick={handleMeasurementDisclosureLink}` and text 'How we measure this page'. Right: `<p className="text-center md:text-right">{copyrightLine(product.name, new Date().getFullYear())}</p>`.
  - Divider and contact line: `<div className="mt-8 border-t border-white/15 pt-6">` containing one `<p className="flex flex-wrap items-center justify-center gap-x-1 text-center">` with, in order: the phone link (product.contacts.phoneHref, text phoneDisplay, footerLinkClasses), a `<span aria-hidden="true">` holding the middle-dot escape ·, the email link (emailHref, text email, footerLinkClasses), another aria-hidden separator, and a `<span>` holding `parentRelationshipLine(product.name)`. All footer text stays #DBE2FF or white at full opacity.
  - Import productHomeLinkLabel, copyrightLine and PRODUCT_SECTION_LINKS from copy.ts. No product-name literal, no parent-site origin, no new landmark.

Commit: `feat(quick-260913-vbl): navy ZPH-layout footer, Noto Sans and heavier headline weights`, ending with the trailer line `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Do not push.
  </action>
  <verify>
    <automated>cd "/home/paul/Documents/Vibe Coding Projects/HAOO" && npm run build && npx vitest run src/test/measurement-page.test.tsx src/test/haoo-page.test.tsx src/test/build-output.test.ts src/test/focus-contrast.test.ts src/test/product-shell-reuse.test.tsx && npm run lint && npm run typecheck && test "$(grep -vE '^\s*(/\*|\*)' src/index.css | grep -c 'family=Inter')" -eq 0 && head -1 src/index.css | grep -q 'family=Noto+Sans' && grep -q 'copyrightLine(' src/pages/ProductPage.tsx</automated>
  </verify>
  <done>Footer matches the OD-3 layout in #0F1A45 with the logo link, section and measurement links, copyright, divider and contact/relationship line; Noto Sans is the first-line import and the body font; heading weights are 900/800/700; the listed tests, lint and typecheck pass; one commit with the trailer exists.</done>
</task>

<task type="auto">
  <name>Task 3: Re-pin live e2e contracts, record the UI-SPEC supersession, run every gate and the visual check</name>
  <files>e2e/keyboard.e2e.ts, e2e/semantics.e2e.ts, .planning/phases/05-prove-the-deployed-journey/05-UI-SPEC.md, .planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/260913-vbl-visual-check.mjs, .planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/260913-vbl-visual-check.json, .planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/screenshots/</files>
  <precondition>Playwright Chromium is installed (`npx playwright test --list --project=preview` exits 0), the sibling checkout ../ZERO-PAPERHUB exists for verify:disjoint, and port 4173 is free.</precondition>
  <action>
Part A — e2e contracts (OD-4). keyboard and semantics call requireLive and skip on the preview project. They can only go green against live after the owner deploys, so validate them now with `npm run typecheck` (tsconfig.e2e.json) and by reading them against the preview DOM.
- e2e/keyboard.e2e.ts: replace the parent-link accessible-name constant declared directly below SKIP_LINK_NAME (delete it and its one use in `expectedOpeningStops`) with `HOME_LINK_NAME = 'HAOO home'` (the productHomeLinkLabel output) and add `CTA_NAME = 'Get started'`. `expectedOpeningStops(width)` becomes, in order: skip link; home link; then at width >= MD_BREAKPOINT_PX the five section links followed by the CTA, or below md the toggle; then the hero message and call actions. Rewrite the source-citation comment block near lines 90-100 to cite identifiers (the ProductHeader home link, PRODUCT_SECTION_LINKS in src/products/copy.ts, the Get started constant), not line numbers. Leave the footer-termination helper as it is: the last footer link is now the email link, which is still a `footer a[href]`.
- e2e/semantics.e2e.ts:
  - Add 'HAOO home' and 'Get started' to UNMATCHED_DESTINATION_NAMES; both are in-page fragments.
  - Add 'Get started' to EXPECTED_UNEXPOSED_AT_DESKTOP (the mobile-panel copy), and update the comment that enumerates the entries: six mobile-panel links, then the toggle, the honeypot and the clear control.
  - Append a dated note to the D4 comment near line 730: since quick task 260913-vbl (OD-1, OD-3) no link names the parent site. D4 stays as a guard, so any future link naming it must resolve to it. D-07 visibility is now carried by the hero relationship line and the footer relationship sentence.
  - In the NAVIGATION_NAMES comment, replace the ProductHeader line citations with identifiers, and note that the footer link group is a div, not a navigation landmark.
- Leave e2e/fixtures/primary-actions.ts and e2e/recovery.e2e.ts unchanged: the footer still renders exactly one tel: link and one mailto: link, each named by its bare value. Part D step 10 confirms those counts.

Part B — supersession note. Append a section titled `## Superseded by quick task 260913-vbl (2026-09-13)` to .planning/phases/05-prove-the-deployed-journey/05-UI-SPEC.md, with a short table:
- KF-1 opening stops: the parent-link stop becomes the 'HAOO home' logo link to #top; desktop adds 'Get started' after the five section links.
- SS-3 D4: currently matches no link; retained as a guard.
- Design System font row: Noto Sans webfont, loaded by a first-line @import.
- Typography: h1 900, h2 800, ProductPage h3 700, header links 500, CTA 600; sizes unchanged.
- Color:
  - header is transparent over #18275F with white/90 links, then #FFFFFF with navy links once scrolled
  - footer is #0F1A45 with #DBE2FF text
  - white focus ring on every navy surface
- ZM-2: the header colour/shadow/padding transition is guarded by motion-reduce:transition-none.
- F1: closed by removing both parent back links.

Add one sentence stating that the original rows above remain the Phase 5 record.

Part C — gates (OD-5). Run these in order and record each exit code for the SUMMARY:
1. `npm test`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run verify:coverage`
5. `npm run verify:disjoint`
6. `npm run test:phase1:contracts`
7. `npm run build`
8. `npm run test:e2e` — the preview project. Its webServer builds and serves on 4173. Allow up to 10 minutes and run it in the background if needed.

Do not run `npm run test:e2e:live`. Live still serves the undeployed page, so the keyboard, semantics and viewport assertions re-pinned here will fail there until the owner deploys; record that skip and its reason in the SUMMARY.

After the preview run, `git restore evidence/`: tracked evidence records must not be overwritten by a local run of undeployed work (precedent 05-17). `evidence/playwright-run.json` is gitignored.

If a gate fails because of this change, fix the cause inside the files this plan owns and re-run. Never weaken a contract: no rule disables, no widened token maps, no FOCUS_SOURCES edits.

Part D — visual check (OD-6).

Setup and run:
- Write `260913-vbl-visual-check.mjs` in this quick directory. Keeping it under the repo lets it resolve `@playwright/test` and `@axe-core/playwright` from node_modules.
- Run `npm run build`, start `npm run preview -- --port 4173 --strictPort` in the background, run the script with node, then stop the server.

Script contract:
- Imports `chromium` from '@playwright/test' and the default AxeBuilder export from '@axe-core/playwright'.
- Collects a `failures` string array and writes every reading to `260913-vbl-visual-check.json` — measured values only, no pass marks.
- Exits 1 when `failures` is non-empty.

The script must perform these checks:
1. Screenshots. Save into `screenshots/`, viewport-only unless noted:
   - `1440-top.png`
   - `1440-scrolled.png` — after scrolling 800px
   - `1440-footer.png` — screenshot of the footer element
   - `768-top.png`
   - `390-top.png`
   - `390-scrolled.png`
   - `390-menu-open.png` — at the top of the page, menu open
   - `390-footer.png`
   - `320x256-menu-open.png`
2. Anchored headings. At 1440 and 390, in a context with reducedMotion 'reduce':
   - For each PRODUCT_SECTION_LINKS href: load `/`, activate the header link (at 390, open the toggle first), and wait 300ms.
   - Read `header.getBoundingClientRect().bottom` and the top of the first h2 inside the target element. A heading top below the header bottom value is a failure.
   - Repeat once at 1440 without reduced motion, waiting 1200ms for smooth scrolling.
3. Contrast. Use the WCAG formula with alpha compositing.
   - Where: 1440 top, 1440 scrolled, 390 top and 390 scrolled.
   - What: every visible header link, the CTA and the toggle.
   - Foreground is the computed colour composited over the backdrop.
   - Backdrop is the header's computed background when its alpha > 0; otherwise the computed background of `main section:first-of-type`. The CTA's backdrop is its own background.
   - Thresholds: text >= 4.5; the toggle icon >= 3.
   - Also measure every footer link and footer paragraph against #0F1A45, and the mobile-panel links against white.
4. axe. Every scan must report 0 violations; record the incomplete counts.
   - `withRules(['color-contrast']).include('header')` at 1440 top, 1440 scrolled, and 390 scrolled with the menu open.
   - `.include('footer')` at 1440 after scrolling to the bottom.
5. Overflow. At 1440, 1280, 1024, 768, 390, 360 and 320x256, require:
   - `document.documentElement.scrollWidth <= clientWidth`
   - every descendant of `header` has `getBoundingClientRect().right <= innerWidth + 1`

   If the only overflow is in the 768-1023 range and it comes from the desktop bar width, apply this fallback and re-run the whole check:
   - the desktop CTA gets `hidden lg:inline-flex`
   - keyboard.e2e.ts `expectedOpeningStops` includes the CTA only at width >= 1024, via a new `LG_BREAKPOINT_PX = 1024`

   Commit the fallback with Part A, and record whether it was applied.
6. Menu reachability. At 320x256 with the menu open, scroll the last mobile-panel link ('Get started') into view. `document.elementFromPoint` at its centre must be that link or one of its descendants.
7. Skip link. At 1440, top of page, press Tab once. The focused element must be the skip link, and `elementFromPoint` at its centre must also be the skip link, not the header.
8. Reduced motion. In the reduce context, the header's computed transitionDuration must parse to 0 for every entry, or transitionProperty must be 'none'.
9. Font.
   - After `document.fonts.ready`, record `document.fonts.check('900 40px "Noto Sans"')`, the h1 computed fontFamily and fontWeight, and one header link's fontWeight.
   - Failure when the h1 weight is not '900' or its fontFamily does not start with Noto Sans.
   - If Google Fonts cannot be reached (offline), record an observation instead of a failure.
10. Footer counts. Exactly 1 `footer a[href^="tel:"]`, exactly 1 `footer a[href^="mailto:"]`, and 0 anchors anywhere on the page whose href contains zero-paperhub.

Before committing, open the saved screenshots and describe each one in the SUMMARY: logo card, transparent versus white bar, CTA pill, footer rows.

Commit Parts A, B and D, plus any fallback edits, as `test(quick-260913-vbl): re-pin keyboard and semantics e2e to the new header and footer, record visual check`, ending with the trailer line `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Do not push or deploy.
  </action>
  <verify>
    <automated>cd "/home/paul/Documents/Vibe Coding Projects/HAOO" && npm test && npm run lint && npm run typecheck && npm run verify:coverage && npm run verify:disjoint && npm run test:phase1:contracts && npm run build && grep -q "HAOO home" e2e/keyboard.e2e.ts && test "$(grep -vE '^\s*(\*|//|/\*)' e2e/keyboard.e2e.ts | grep -c 'PARENT_LINK_NAME')" -eq 0 && grep -q "'Get started'" e2e/semantics.e2e.ts && grep -q "Superseded by quick task 260913-vbl" .planning/phases/05-prove-the-deployed-journey/05-UI-SPEC.md && Q=.planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p && node -e "const r=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); if (!Array.isArray(r.failures) || r.failures.length) { console.error(r.failures); process.exit(1); }" "$Q/260913-vbl-visual-check.json" && test -f "$Q/screenshots/1440-scrolled.png" && test -f "$Q/screenshots/390-menu-open.png" && test -f "$Q/screenshots/1440-footer.png" && git diff --quiet -- evidence/</automated>
  </verify>
  <done>keyboard and semantics e2e carry the new header contract and typecheck; 05-UI-SPEC.md records what this task supersedes; all seven npm gates and the preview Playwright project exit 0, with the live-project skip and its reason recorded; evidence/ is clean; the visual-check JSON has an empty failures array and all nine screenshots exist; one commit with the trailer exists; nothing is pushed or deployed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| visitor browser -> fonts.googleapis.com / fonts.gstatic.com | third-party stylesheet and font request; the host is unchanged (Inter already loaded from it) |
| page links -> destinations | link names promise destinations (tel:, mailto:, in-page fragments); SS-3 checks promise against destination |
| contract tests -> product source | the static focus-contrast, product-literal and build-boundary gates must keep measuring the new markup |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-vbl-01 | Information disclosure | src/index.css Google Fonts import | low | accept | Same host and request type as the Inter import it replaces: no new third party, no cookies from the CSS API, no disclosure copy change needed |
| T-vbl-02 | Spoofing | removal of both parent-site back links (D-07) | medium | mitigate | haoo-page and measurement-page tests assert the hero relationship line and the footer parentRelationshipLine sentence both render; index.html og:site_name and noscript relationship text stay untouched |
| T-vbl-03 | Tampering | focus-contrast gate vs state-dependent header focus classes | medium | mitigate | ring colour and offset colour live together in separate plain literals selected by identifier; FOCUS_SOURCES, RING_COLOR_TOKENS and the extractor are not edited; npm test runs the gate |
| T-vbl-04 | Spoofing | new link names 'HAOO home' and 'Get started' | low | mitigate | both are registered in UNMATCHED_DESTINATION_NAMES as in-page fragments; identical names resolve to identical destinations (#top, #onboarding); D4 stays as a guard |
| T-vbl-05 | Denial of service | fixed header obscuring focus, anchored headings or menu entries (WCAG 2.4.11, 1.4.10) | medium | mitigate | html scroll-padding-top 5rem/6rem, skip link z-[60], mobile panel max-h calc(100dvh-5rem) with overflow-y-auto; visual-check steps 2, 6 and 7 fail the run on any coverage |
| T-vbl-06 | Denial of service | scroll listener cost | low | mitigate | passive listener, boolean state (React skips identical updates), removed on unmount and asserted in the unit test |

No npm, pip or cargo installs occur in this plan, so no supply-chain row applies.
</threat_model>

<verification>
- `npm test` (build + full vitest), `npm run lint`, `npm run typecheck`, `npm run verify:coverage`, `npm run verify:disjoint`, `npm run test:phase1:contracts` and `npm run build` all exit 0.
- `npm run test:e2e` (preview project) exits 0; the live project is not run (undeployed change) and the SUMMARY says so.
- No parent-site back link or zero-paperhub.com anchor in src/components or src/pages (comment-filtered grep = 0).
- `260913-vbl-visual-check.json` has `failures: []`; screenshots exist for 1440/768/390/320x256 as listed.
- `git diff --quiet -- evidence/` after the e2e run.
</verification>

<success_criteria>
- Header: fixed; transparent over navy at the top, white with shadow after 40px or with the menu open; logo card home link; no product-name span; five section links plus the #4054C6 'Get started' pill; mobile menu readable and fully reachable at 320x256.
- Footer: #0F1A45 row with logo, section and measurement links, and copyright; divider; phone · email · 'HAOO is a ZERO-PAPER HUB product'.
- Noto Sans is loaded first-line and applied; h1 900, h2 800, h3 700.
- Anchored headings are never covered, the skip link stays visible, header text contrast is >= 4.5:1 in both states, and reduced motion suppresses header transitions.
- Every contract is re-pinned, not deleted; all gates pass; three commits end with the Co-Authored-By trailer; nothing is pushed or deployed.
</success_criteria>

<output>
Create `.planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/260913-vbl-SUMMARY.md` when done, recording:
- gate exit codes
- the live-project skip and its reason
- whether the 768px CTA fallback was applied
- the h3 weight discretion choice
- the screenshot descriptions
- the 05-UI-SPEC supersession list
</output>