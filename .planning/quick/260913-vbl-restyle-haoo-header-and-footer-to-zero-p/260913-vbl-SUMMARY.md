---
phase: quick-260913-vbl
plan: 01
subsystem: product-page-shell
status: complete
tags: [header, footer, typography, accessibility, visual-check]
requires: [PRODUCT_SECTION_LINKS consumers, focus-contrast gate, Phase 5 e2e contracts]
provides:
  - Fixed transparent-to-white ZPH-style header with logo home link and Get started CTA
  - Navy #0F1A45 ZPH-layout footer with logo, section and measurement links, copyright, contact line
  - Noto Sans site font with h1 900 / h2 800 / h3 700
  - Reproducible visual check (script, readings JSON, 10 screenshots)
affects: [e2e/keyboard.e2e.ts KF-1, e2e/semantics.e2e.ts SS-3, 05-UI-SPEC.md]
tech-stack:
  added: []
  patterns:
    - State-selected focus constants (ring and offset colour kept together in one plain literal)
    - html scroll-padding-top for a fixed header
key-files:
  created:
    - .planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/260913-vbl-visual-check.mjs
    - .planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/260913-vbl-visual-check.json
    - .planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/screenshots/ (10 PNGs)
  modified:
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
decisions:
  - "768px fallback applied: the desktop Get started CTA is hidden lg:inline-flex. The visual check measured Send details and the pill wrapping to two lines at 768px; keyboard KF-1 expects the CTA only at width >= 1024"
  - "Component-internal h3s (BrochurePanel, QualifyForm, QualifyFallback) keep their weight: outside OD-2 headline scope"
  - "Tracer gate run in autonomous style (re-run verify, halt on failure) because the orchestrator required sequential execution of all tasks of an autonomous: true plan"
  - "Header logo-less fallback renders the product name inside the home link; HAOO always supplies a logo, so the removed product-name span never renders for HAOO"
metrics:
  duration: "about 40 min"
  completed: 2026-09-13
estimate:
  tokens: 100000
  tasks: 3
actuals:
  tokens: 23806
  tasks: 3
  commits: 3
---

# Quick Task 260913-vbl Plan 01: Restyle HAOO header and footer to the ZERO-PAPER HUB layout Summary

The HAOO page now has a fixed header that is transparent over the navy hero and turns white with a shadow once scrolled past 40px or while the menu is open. The header carries the HAOO logo as a white-card home link and a #4054C6 "Get started" pill. The footer is navy #0F1A45 in three columns with a centred phone, email and relationship line. The site font is Noto Sans, with h1 at 900, h2 at 800 and h3 at 700. Both parent-site back links are gone. The ZERO-PAPER HUB relationship stays visible in the hero line and the footer sentence.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 (tracer) | d5abef2 | feat(quick-260913-vbl): fixed ZPH-style header with HAOO logo home link, remove parent back links |
| 2 | 70d7ab1 | feat(quick-260913-vbl): navy ZPH-layout footer, Noto Sans and heavier headline weights |
| 3 | 3275988 | test(quick-260913-vbl): re-pin keyboard and semantics e2e to the new header and footer, record visual check |

Nothing was pushed or deployed. The docs artifacts (this SUMMARY, STATE.md, PLAN.md) are left uncommitted for the orchestrator.

## Gate exit codes (OD-5)

All gates ran in order on the final code, after the 768px fallback edits.

| # | Gate | Exit | Result |
|---|------|------|--------|
| 1 | `npm test` | 0 | 10 files, 753 tests passed |
| 2 | `npm run lint` | 0 | clean |
| 3 | `npm run typecheck` | 0 | app, node and e2e tsconfigs |
| 4 | `npm run verify:coverage` | 0 | 70 required capabilities across 3 tables |
| 5 | `npm run verify:disjoint` | 0 | disjoint from ../ZERO-PAPERHUB |
| 6 | `npm run test:phase1:contracts` | 0 | 3 suites, 3 of 3 markers green |
| 7 | `npm run build` | 0 | built |
| 8 | `npm run test:e2e` (preview project) | 0 | 21 passed, 121 skipped (live-only specs skip on preview) |

After the preview run, `git restore evidence/` was applied and `git diff --quiet -- evidence/` reported clean.

**Live project not run:** `npm run test:e2e:live` was deliberately skipped. https://www.haoo.online still serves the undeployed page, so the re-pinned keyboard (KF-1), semantics (SS-3, unexposed list) and viewport assertions would fail there until the owner deploys. Before this change they were checked with `npm run typecheck` (tsconfig.e2e.json) and against the preview DOM through the visual check.

## Visual check (OD-6)

Script: `.planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/260913-vbl-visual-check.mjs`. The script ran against `npm run preview` on port 4173. Requests to hosts other than localhost and Google Fonts were aborted, so no analytics event left the machine. Readings are in `260913-vbl-visual-check.json`: `failures: []`, `observations: []`.

- **Anchored headings:** no heading was covered in any run: 1440 with reduced motion, 390 with reduced motion, and 1440 with smooth scrolling after 1200ms. Header bottom was 88px at 1440 with h2 tops at 176-224px, and 64px at 390 with h2 tops at 144-168px. The smallest gap was 79.8px.
- **Contrast** (WCAG, alpha-composited):
  - Transparent header at the top: links #e8e9ef on #18275f, 11.63:1.
  - Scrolled header: links #18275f on white, 14.05:1.
  - CTA: white on #4054c6, 6.36:1.
  - Toggle icon: 14.05:1 in both states.
  - Footer links and paragraphs: #dbe2ff on #0f1a45, 13.03:1.
  - Mobile panel links: 14.05:1.
- **axe:** 0 violations and 0 incomplete in all four scans: header color-contrast at 1440 top, 1440 scrolled and 390 scrolled with the menu open, and all rules on the footer.
- **Overflow:** scrollWidth equals clientWidth, and no header descendant passes the viewport, at 1440, 1280, 1024, 768, 390, 360 and 320x256. Every desktop link renders on 1 line box at 768-1440.
- **Menu reachability at 320x256:** the last panel link, "Get started", scrolls into view and receives the hit at its centre.
- **Skip link:** the first Tab focuses "Skip to HAOO content", and elementFromPoint at its centre hits the link itself (z-index 60).
- **Reduced motion:** the header's transition-property computes to `none`.
- **Font:** `document.fonts.check('900 40px "Noto Sans"')` returned true, and Google Fonts responses were 200. The h1 computes `"Noto Sans", system-ui, sans-serif` at 900. Header links compute 500, the CTA 600 and the h2 800.
- **Footer counts:** 1 `tel:` link, 1 `mailto:` link, and 0 anchors to zero-paperhub.

### 768px CTA fallback: APPLIED

The first run reported 0 failures. However, `768-top.png` showed "Send details" and the "Get started" pill each wrapping onto two lines. Nothing overflowed; the desktop bar was squeezed at 768px. The script's first wrap heuristic compared element height, and `min-h-11` hid the wrap inside a 44px link. I replaced it with a line-box count (Range client rects) and made any wrap a failure.

A probe confirmed the new detector: with the CTA forced visible at 768, it reports `Send details:2 Get started:2`; with the fallback, every link reports `1`. The fallback from the plan was applied:
- The desktop CTA is `hidden lg:inline-flex`.
- `e2e/keyboard.e2e.ts` `expectedOpeningStops` includes the CTA only at `width >= LG_BREAKPOINT_PX`. That constant already existed at 1024, so no new one was added.

Below md the CTA stays in the mobile panel. At 1024 and above it shows in the bar, and `1024-top.png` shows it on one line.

### Screenshots

All under `.planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/screenshots/`:

- `1440-top.png`: the transparent bar sits over the navy hero.
  - Left: the HAOO logo in a white rounded card.
  - Right: Benefits, Capabilities, Brochure, Send details and Onboarding in near-white medium weight, then the blue rounded-full "Get started" pill.
  - Below it: "A ZERO-PAPER HUB product", the HAOO eyebrow, and the h1 in visibly heavy Noto Sans Black.
- `1440-scrolled.png`: the bar is solid white with a soft shadow, the links are navy, and the logo card sits on white. The bar's bottom edge is clean over the page content, and "Who HAOO supports" and "Benefits" show at extrabold weight.
- `1440-footer.png`: the footer is navy.
  - Top row: logo card on the left, the six links (five sections plus "How we measure this page") centred, and "© 2026 HAOO. All rights reserved." on the right.
  - A thin divider follows.
  - A centred line reads "+254 702 188 044 · info@haoo.online · HAOO is a ZERO-PAPER HUB product". The spacing around the second separator was evened by adding `px-2` to the relationship span after this screenshot was first reviewed.
- `1024-top.png`: the transparent bar shows the logo, five links and the pill, each on one line.
- `768-top.png` (after the fallback): the transparent bar shows the logo and five links on one line, with no pill.
- `390-top.png`: the transparent bar shows the logo card on the left and a white hamburger on the right. The hero clears the bar.
- `390-scrolled.png`: the bar is white with a shadow, holding the logo card and a navy hamburger.
- `390-menu-open.png`: taken at the top of the page. The bar is white and the close (X) button has a light-blue hover tint. The white panel lists the five navy links and a full-width blue "Get started" pill, and the page below is still visible.
- `390-footer.png`: the footer stacks, centred:
  - the logo card
  - links wrapping onto three rows
  - the copyright line
  - a divider
  - the phone · email · relationship line, wrapping onto two rows
- `320x256-menu-open.png`: the white bar and the panel together fit the 256px viewport. The panel scrolls, with Benefits to Send details visible at first; the check scrolled "Get started" into view and hit it.

## 05-UI-SPEC supersession list (Part B)

The section "Superseded by quick task 260913-vbl (2026-09-13)" was appended to `.planning/phases/05-prove-the-deployed-journey/05-UI-SPEC.md`:

- **KF-1 opening stops:** the parent-link stop becomes the `HAOO home` link to `#top`. Desktop adds `Get started` after the sections (from lg, per the fallback).
- **SS-3 D4:** matches no link now; kept as a guard.
- **Design System font row:** Noto Sans, loaded by a first-line `@import`.
- **Typography:** h1 900, h2 800, ProductPage h3 700, header links 500, CTA 600. Sizes are unchanged.
- **Color:**
  - The header is transparent over #18275F with white/90 links, then white with navy links.
  - The footer is #0F1A45 with #DBE2FF text.
  - Every navy surface gets a white focus ring.
- **ZM-2:** the header transition is guarded by `motion-reduce:transition-none`.
- **F1:** closed by removing both parent back links.
- **Phase 01 anchor decision:** "scroll-mt only" is superseded by `html` scroll-padding-top.
- The original rows remain the Phase 5 record.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Phase 2 navigation tests would break once the CTA and footer links were added**
- **Found during:** Tasks 1 and 2
- **Issue:**
  - `haoo-page.test.tsx` "exposes the qualification entry in the desktop navigation" and "exposes the same entry once in the mobile disclosure menu" pinned each nav's links to exactly the five section names.
  - "points both navigation presentations at the single qualify section" counted 5 `a[href="#qualify"]`.
- **Fix:** re-pinned (OD-4) rather than deleted. Both navs now list the five sections plus `Get started`. The `#qualify` count is 6, since the footer link group adds one.
- **Commits:** d5abef2, 70d7ab1

**2. [Rule 1 - Bug] Header wrap at 768px (plan-anticipated fallback)**
- **Found during:** Task 3, visual check
- **Issue:** at 768px the desktop bar wrapped "Send details" and the pill onto two lines.
- **Fix:**
  - The CTA is now `hidden lg:inline-flex`, and keyboard e2e expects it only at width >= 1024.
  - The visual check now counts line boxes and fails on any wrap. I strengthened the check rather than weakening it.
- **Files:** src/components/ProductHeader.tsx, e2e/keyboard.e2e.ts, the visual-check script
- **Commit:** 3275988

**3. [Rule 3 - Blocking] Lint failed on the new visual-check script**
- **Found during:** Task 3 gates
- **Issue:** `eslint .` lints `.planning/**/*.mjs`, and the browser globals inside `page.evaluate` callbacks raised `no-undef`.
- **Fix:** added a `/* global document, window, getComputedStyle */` declaration to the script. No rule is disabled and the ESLint config is unchanged.
- **Commit:** 3275988

**4. [Polish] Footer contact line spacing**
- The relationship `<span>` got `px-2` to match the padded links, so both `·` separators are evenly spaced.
- **Commit:** 3275988

**5. [Process] Tracer gate mode**
- `workflow.auto_advance` is false, which would normally mean an interactive checkpoint after the tracer.
- The orchestrator required every task of this `autonomous: true` plan to run in sequence. So the autonomous tracer gate applied instead: the Task 1 verify was re-run in full and passed before any expansion work.

**6. [Minor] Extra screenshot**
- Added `1024-top.png`, a tenth screenshot, to show the CTA returning at lg. All nine required screenshots are present.

### Discretion choices

- **h3 weights:** BrochurePanel, QualifyForm and QualifyFallback h3s keep `font-semibold`. They are component-internal headings outside OD-2's headline scope. ProductPage's h3s (pain, benefit, capability and journey titles) are 700.
- **Copyright year:** `copyrightLine(product.name, new Date().getFullYear())` renders at runtime, and the tests never hard-code a year.
- **Escapes:** the copyright sign (`©`) and the footer separators (`·`) are stored as escapes.

## TDD Gate Compliance

Tasks 1 and 2 were `tdd="true"` tasks within an `execute` plan, not a `type: tdd` plan. Each followed RED then GREEN, with one commit per task as the plan's action text specified:
- **Task 1 RED:** 9 failing tests across haoo-page, product-shell-reuse and measurement-page.
- **Task 2 RED:** 5 failing tests (logo placements, heading weights, `#qualify` count, footer structure, font import).

Both went green before committing.

## Known Stubs

None.

## Threat Flags

None. The Google Fonts host and request type are unchanged from the Inter import (T-vbl-01). No new endpoints, storage or network calls were added; build-output FULL_BOUNDARY still passes for ProductHeader and ProductPage.

## State updates

STATE.md and ROADMAP.md were not modified by this executor, per the orchestrator constraints. The orchestrator owns the docs commit.

## Self-Check: PASSED

- All 12 modified source, test and spec files, the visual-check script and JSON, and all 10 screenshots: FOUND.
- Commits d5abef2, 70d7ab1 and 3275988: FOUND in git log.
- `evidence/` clean after `git restore evidence/`.
