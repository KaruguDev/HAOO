# Phase 5 — Viewport Evidence (QUAL-01)

**Plan:** 05-08. **Spec:** `e2e/viewport.e2e.ts`. **Machine records:** `evidence/viewport-overflow.json`,
`evidence/viewport-primary-actions.json`, `evidence/viewport-mobile-nav.json`,
`evidence/viewport-media-absent.json`.

This file summarises those four records. It does not re-derive anything: every number below was read
from them, and a reader who doubts a cell can find the same value there under the same surface and
width. It records measured values, not pass marks — the discipline of
`04.2-VERIFICATION.md` § Human Verification Outcome, where four zeros were written beside six non-zero
counts because the zeros are what separate what happened from what did not.

## Provenance

| Item | Value |
|------|-------|
| Run | One full run of the committed spec, `npx playwright test --project=live e2e/viewport.e2e.ts` |
| Result of that run | 40 tests executed, 0 retried |
| Recorded | 2026-09-11T21:51:22Z to 2026-09-11T21:53:54Z (UTC): the first and last of the 40 records' own `recordedAt` stamps |
| Engine | Chromium under `@playwright/test` 1.63.0, `Desktop Chrome` device profile, `live` project |
| Targets | S1 `https://www.haoo.online/`; S3 `https://www.zero-paperhub.com/#products` |
| Widths | The closed `VIEWPORTS` list: 360×740, 390×844, 768×1024, 1280×1024, 1440×900, and 320×256 (the WCAG 2.2 SC 1.4.10 reflow size) |
| Tolerance | `OVERFLOW_TOLERANCE_PX` = 1 CSS px, for subpixel rounding only; no other epsilon |
| Records | 12 overflow, 12 primary-action, 6 mobile-navigation, 10 media-absent |

Box dimensions are Chromium's `getBoundingClientRect()` values, **rounded down** to whole CSS px in
this file so that no cell overstates a measurement. The unrounded values (for example 45.59) are in
the records.

## 1. Horizontal overflow (VC-1)

Three readings per width per surface, never collapsed into one:

- **VC-1a**, the unmodified document's `scrollWidth` against its `clientWidth`. Necessary and
  **explicitly not sufficient**: both root wrappers ship `overflow-x-hidden`
  (`HAOO/src/pages/ProductPage.tsx:91`, `ZERO-PAPERHUB/src/App.tsx:207`), which absorbs escaping
  content before the document reports it (finding F2).
- **VC-1b**, the per-element sweep (`collectViewportEscapees`) on the **unmodified** page. This is
  the load-bearing reading. The "Escapees in scope" column is its count.
- **VC-1c**, the document reading again after a stylesheet forces `overflow-x: visible` everywhere.
  **That is a modified page**, taken last, and recorded under the mode marker `mask-neutralised`
  so it is never read as VC-1a.

| Surface | Viewport | Unmodified `scrollWidth` | Unmodified `clientWidth` | Modified-page (mask-neutralised) `scrollWidth` | Modified-page (mask-neutralised) `clientWidth` | Escapees in scope | Out-of-scope observations |
|---------|----------|------:|------:|------:|------:|------:|------:|
| S1 | 360×740   | 360  | 360  | 360  | 360  | 0 | 0 |
| S3 | 360×740   | 360  | 360  | 360  | 360  | 0 | 2 |
| S1 | 390×844   | 390  | 390  | 390  | 390  | 0 | 0 |
| S3 | 390×844   | 390  | 390  | 390  | 390  | 0 | 2 |
| S1 | 768×1024  | 768  | 768  | 768  | 768  | 0 | 0 |
| S3 | 768×1024  | 768  | 768  | 768  | 768  | 0 | 2 |
| S1 | 1280×1024 | 1280 | 1280 | 1280 | 1280 | 0 | 0 |
| S3 | 1280×1024 | 1280 | 1280 | 1280 | 1280 | 0 | 2 |
| S1 | 1440×900  | 1440 | 1440 | 1440 | 1440 | 0 | 0 |
| S3 | 1440×900  | 1440 | 1440 | 1440 | 1440 | 0 | 2 |
| S1 | 320×256   | 320  | 320  | 320  | 320  | 0 | 0 |
| S3 | 320×256   | 320  | 320  | 320  | 320  | 0 | 3 |

**What the modified-page columns prove, and what they cannot.** On S1, forcing the mask open
changed neither reading at any width, and the unmodified sweep found 0 escapees. So the HAOO root
wrapper's `overflow-x-hidden` is not concealing an overflow anywhere in the matrix.

On S3, VC-1c also reads equal to `clientWidth` at every width, while the sweep records elements
reaching up to 1568 px at the 1440 px width. Both are true at once for a reason read from source:
those elements sit inside the hero `<section>` at `ZERO-PAPERHUB/src/App.tsx:265`, which carries
`overflow-hidden` on **both** axes. Under CSS Overflow, `overflow-x: visible` computes to `auto` on
an element whose `overflow-y` is not `visible`. So the neutraliser opens a root wrapper that clips
only horizontally (F2's subject), but it cannot open a section that clips in both directions. This
is exactly why VC-1b, which reads layout boxes and is indifferent to clipping, is the reading this
contract rests on.

**The S3 bound.** Both document readings are asserted on S3 as on S1. On S3 the bound extends past
`clientWidth` only as far as an out-of-scope escapee reaches (`outOfScopeReachPx` in each record).
The measured readings never needed that extension: every S3 document reading equals `clientWidth`.

## 2. Primary actions (VC-2)

**The two hit-target floors, which must not be read as one number:**

- **44 × 44 CSS px — `MIN_PRIMARY_HIT_TARGET_PX`, for the closed primary-action list.** This is a
  record of the bar both repositories already ship (`min-h-11`, `size-11`). It is not a new
  requirement, and it is measured here by spec code, not by axe.
- **24 × 24 CSS px — `MIN_INTERACTIVE_HIT_TARGET_PX`, for every other interactive element.** This
  is WCAG 2.2 SC 2.5.8 Target Size (Minimum), the standard's floor. axe's `target-size` rule (plan
  05-07) checks this number and only this number.

Each action was located by its shipped accessible name (`getByRole`, exact, hidden instances
included so none is skipped silently). The closed list's vacuity guard (`primaryActionsFor`) ran
before any assertion. Each rendered instance was scrolled to (D-OQ-2) and measured for all five
conditions: in the accessibility tree by its name, visible, not clipped out, inside the viewport's
horizontal extent, at least 44 × 44, and enabled. A Playwright trial click also confirmed it
receives the pointer: attached, stable, and not covered by another element.

| Surface | ID | Accessible name | Destination | Instances declared | Instances found by name | Anchors to destination | Smallest box across six widths (w × h) |
|---------|----|-----------------|-------------|------:|------:|------:|------|
| S1 | P1  | `Open brochure (opens in a new tab)` | `/brochure/HAOO-Marketing-Brochure.pdf` | 1 | 1 | 2 | 288 × 45 |
| S1 | P2  | `Download brochure` | `/brochure/HAOO-Marketing-Brochure.pdf` | 1 | 1 | 2 | 288 × 45 |
| S1 | P3  | `Send my details` | the qualification form submit (a `<button>`, no `href`) | 1 | 1 | 0 | 150 × 44 |
| S1 | P4  | `Chat with HAOO on WhatsApp` | `https://wa.me/254702188044?text=…` | 3 | 3 | 3 | 240 × 44 |
| S1 | P5  | `Call +254 702 188 044` | `tel:+254702188044` | 4 | 3 | 4 | 240 × 44 |
| S1 | P6  | `Email info@haoo.online` | `mailto:info@haoo.online` | 4 | 3 | 4 | 240 × 44 |
| S1 | P7  | `Start with HAOO` | `https://manage.haoo.online/` | 3 | 3 | 3 | 238 × 45 |
| S1 | P8  | `Send your details instead` | `#qualify` | 3 | 3 | 5 | 192 × 44 |
| S3 | P9  | `Explore HAOO` | `https://www.haoo.online/` | 1 | 1 | 1 | 171 × 44 |
| S3 | P10 | `Products` | `#products` | 2 | 2 | 2 | 60 × 44 |

How to read the columns:

- **Smallest box.** The smallest width and the smallest height seen across every measured instance
  at all six widths. They are independent minima, so the two numbers need not come from the same
  instance. No entry is below 44 in either dimension.
- **Same name, same destination.** Every instance sharing an accessible name resolved to exactly
  one `href` at every width. Names were not asserted unique: P4–P8 render three times with
  byte-identical names by design.
- **Instances declared vs found, P5 and P6.** `primary-actions.ts` declares four instances each:
  three onboarding blocks plus one footer link. The footer link's accessible name is the bare value
  (`+254 702 188 044`, `info@haoo.online`), not the `Call …` / `Email …` name, so name-location
  finds three. The census confirms the fourth anchor to the same destination exists. It was
  measured by the non-primary sweep below, where every element measured at least 44 × 44, so the
  footer instances also meet the primary floor. This is a precision gap in the fixture's
  `accessibleName` for those two entries, recorded rather than silently widened.
- **Anchors to destination.** A census, not an assertion. P1 and P2 share one PDF. P8's `#qualify`
  is also the target of the two header `Send details` section links.
- **Reachability of P10.** P10 has one reachable instance at every width. At 768 px and above it is
  the desktop nav entry. Below 768 px the desktop entry has no layout box, and the mobile-menu
  entry was reached through the header toggle.
- **Collapsed-disclosure rule for P10.** Before the revealed P10 counted, the toggle was measured:
  named `Open navigation menu`, a sequential tab stop, 44 × 44 at 320, 360 and 390, and receiving
  the pointer. It was then operated with the keyboard (focus, Enter), and closed again afterwards
  so it could not cover anything else.
- **Surfaces not measured here.** P11 and P12 (S4) and P13 (S2) are not on either journey this
  plan measures.

**The measurement disclosure on S1** (a collapsed `<details>`) obeys the same rule. Its opener was
measured before its contents, and the revealed control is held to the 24 px floor because it is
not a primary action:

| Viewport | Opener `How we measure this page` (w × h) | `open` before | `open` after Enter | `open` after second Enter | Revealed `Clear what this page remembers` (w × h) |
|----------|------|------|------|------|------|
| 320×256   | 188 × 48 | absent | present | absent | 188 × 57 |
| 360×740   | 228 × 44 | absent | present | absent | 228 × 57 |
| 390×844   | 258 × 44 | absent | present | absent | 258 × 57 |
| 768×1024  | 428 × 44 | absent | present | absent | 259 × 44 |
| 1280×1024 | 428 × 44 | absent | present | absent | 259 × 44 |
| 1440×900  | 428 × 44 | absent | present | absent | 259 × 44 |

**Every other interactive element, held to 24 × 24:**

| Surface | Widths | Non-primary elements measured | Below 24 × 24 | Smallest width | Smallest height | Excluded: not rendered at this width | Excluded: `tabindex="-1"` script-focus only | Excluded: off-canvas by design |
|---------|--------|------:|------:|------:|------:|------:|------:|------:|
| S1 | 320, 360, 390 | 18 | 0 | 44 | 44 | 10 | 1 | 1 |
| S1 | 768, 1280, 1440 | 22 | 0 | 72 | 44 | 6 | 1 | 1 |
| S3 (`#products` only) | all six | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

On S3 the sweep is scoped to the Products region (D-OQ-3), where P9 is the only interactive element.
That is why the non-primary count there is 0: a measured absence, not a skipped reading. On S1 the
one off-canvas exclusion is the `sr-only` skip link, whose focused box is plan 05-10's KF-3. The one
script-focus exclusion is the honeypot input.

## 3. Mobile navigation (VC-3)

Measured below Tailwind's `md` breakpoint on both sites. The UI-SPEC names 360 and 390. 320 sits
below the same breakpoint and was measured with them rather than skipped. The toggle was operated
from the keyboard only (focus, Enter), once to open and once to close.

| Surface | Viewport | Controlled id | Desktop nav has a layout box | Toggle box | `aria-expanded` before / open / closed | Toggle name before → open | Controlled `hidden` attribute before / open / closed | Controlled has a layout box before / open / closed | Links revealed | Smallest revealed link |
|---------|----------|---------------|------|------|------|------|------|------|------:|------|
| S1 | 320×256 | `haoo-mobile-navigation` | no | 44 × 44 | `false` / `true` / `false` | `Open HAOO navigation` → `Close HAOO navigation` | present / absent / present | no / yes / no | 5 | 288 × 44 |
| S1 | 360×740 | `haoo-mobile-navigation` | no | 44 × 44 | `false` / `true` / `false` | `Open HAOO navigation` → `Close HAOO navigation` | present / absent / present | no / yes / no | 5 | 328 × 44 |
| S1 | 390×844 | `haoo-mobile-navigation` | no | 44 × 44 | `false` / `true` / `false` | `Open HAOO navigation` → `Close HAOO navigation` | present / absent / present | no / yes / no | 5 | 358 × 44 |
| S3 | 320×256 | `home-mobile-navigation` | no | 44 × 44 | `false` / `true` / `false` | `Open navigation menu` → `Close navigation menu` | present / absent / present | no / yes / no | 7 | 272 × 44 |
| S3 | 360×740 | `home-mobile-navigation` | no | 44 × 44 | `false` / `true` / `false` | `Open navigation menu` → `Close navigation menu` | present / absent / present | no / yes / no | 7 | 312 × 44 |
| S3 | 390×844 | `home-mobile-navigation` | no | 44 × 44 | `false` / `true` / `false` | `Open navigation menu` → `Close navigation menu` | present / absent / present | no / yes / no | 7 | 342 × 44 |

On every row the four readings (expanded state, toggle name, `hidden` attribute and layout box)
flipped together on the first activation and returned together on the second. On S1 all five
revealed section links are in scope. They received the pointer and met 44 × 44 at every width.
On S3 only `Products` (P10) is in scope. The ZERO-PAPER HUB header sits outside the Products
region, so under D-OQ-3 the other six entries are observed, not asserted. At 320×256, three of
them could not be brought into view (observation VP-O3 below).

## 4. Media-absent partial states

**HAOO page with its own media aborted.** The logo, hero and brochure-preview routes were aborted.
This state is measured only below `lg`, because the compact preview panel (the one carrying
recovery copy) renders only there.

| Viewport | Media requests aborted | Recovery copy rendered and visible (`isVisible()`) | P1 box | P2 box | Escapees |
|----------|------:|------|------|------|------:|
| 320×256  | 3 | `true` | 288 × 45 | 288 × 45 | 0 |
| 360×740  | 3 | `true` | 328 × 45 | 328 × 45 | 0 |
| 390×844  | 3 | `true` | 358 × 45 | 358 × 45 | 0 |
| 768×1024 | 3 | `true` | 720 × 45 | 720 × 45 | 0 |

The three aborted requests at every width were `haoo-logo.png`, `haoo-hero.png` and
`brochure-preview.png`. The recovery copy measured is the compact-panel text
"We couldn't show the brochure preview here. Open the brochure or download the PDF instead."
Both brochure actions stayed present once each, enabled, on the `/brochure/HAOO-Marketing-Brochure.pdf`
destination, and at or above the 44 px floor.

**Products card with its cross-origin preview image aborted.** The image is
`https://www.haoo.online/brochure/brochure-preview.png`, an absolute URL on the other domain. That
makes it a live cross-domain dependency, which is why this state is measured rather than assumed
(T-05-35).

| Viewport | Image requests aborted | Image `naturalWidth` | Name / relationship / outcome / audience lead rendered as text | `Explore HAOO` `href` | Host | Box | Escapees in `#products` | Out-of-scope observations |
|----------|------:|------:|------|------|------|------|------:|------:|
| 320×256   | 1 | 0 | 4 of 4 | `https://www.haoo.online/` | `www.haoo.online` | 171 × 44 | 0 | 3 |
| 360×740   | 1 | 0 | 4 of 4 | `https://www.haoo.online/` | `www.haoo.online` | 171 × 44 | 0 | 2 |
| 390×844   | 1 | 0 | 4 of 4 | `https://www.haoo.online/` | `www.haoo.online` | 171 × 44 | 0 | 2 |
| 768×1024  | 1 | 0 | 4 of 4 | `https://www.haoo.online/` | `www.haoo.online` | 171 × 44 | 0 | 2 |
| 1280×1024 | 1 | 0 | 4 of 4 | `https://www.haoo.online/` | `www.haoo.online` | 171 × 44 | 0 | 2 |
| 1440×900  | 1 | 0 | 4 of 4 | `https://www.haoo.online/` | `www.haoo.online` | 171 × 44 | 0 | 2 |

A `naturalWidth` of 0 is the proof the degraded state was actually reached, rather than an image
that loaded despite the route. The four text fields were asserted by their registry strings from
`ZERO-PAPERHUB/src/products/registry.ts`, and the destination by the closed list's P9 entry
(T-05-36). At 1280 and 1440, the featured `lg:grid-cols-12` layout held with the image absent: 0
escapees in the region. The out-of-scope counts are the hero observations VP-O1 and VP-O2 below,
unchanged by the abort.

## 5. Out-of-scope observations (D-OQ-3) — handed forward, not failed

These sit on the ZERO-PAPER HUB home page **outside** the Products region, where D-OQ-3 says this
phase's evidence stops. They are recorded with their measured values so a future ZERO-PAPER HUB
phase inherits them alongside F4, F4b, F5 and F6 (`05-UI-SPEC.md` § Deferred). Recording them is not
accepting them.

| ID | What was measured | Where | Widths | Concern |
|----|-------------------|-------|--------|---------|
| **VP-O1** | Two decorative blur circles escape the viewport: `absolute -top-32 -right-32 w-[600px]` (right edge 448–1568 px) and `absolute -bottom-40 -left-20 w-[500px]` (left edge −80 px). They are clipped by the hero section's `overflow-hidden`, so no visitor sees horizontal scroll. | `ZERO-PAPERHUB/src/App.tsx:271-272`, inside `:265` | all six | None to a visitor today. They escape only because they are clipped, so removing that section's `overflow-hidden` would expose them. |
| **VP-O2** | The hero content column `relative z-10 max-w-4xl mx-auto px-6` has its right edge at 334 px in a 320 px viewport, a 14 px escape. | `ZERO-PAPERHUB/src/App.tsx:274` | 320×256 only | WCAG 2.2 SC 1.4.10 Reflow, at the exact size that criterion is defined at. The hero clips the excess, so content may be cut off rather than scrolled to. |
| **VP-O3** | With the mobile menu open, three entries lie below the 256 px viewport and cannot be brought into view, because the menu is inside a `fixed` header that does not scroll: `Values` top 291 / bottom 335, `Contact` 343 / 387, `Get Started` 395 / 439. A pointer-actionability check timed out on each. | `ZERO-PAPERHUB/src/App.tsx:210` (fixed header), `:243-261` (menu) | 320×256 only | WCAG 2.2 SC 1.4.10 Reflow. At that size, three of seven menu entries are unreachable. `Products` (P10) sits above the fold of the menu and was reachable, so the Products journey is unaffected. |

## 6. Settled decisions

- **D-OQ-2 (owner, 2026-09-07) is settled: "no hidden primary actions" means reachable, not
  above the fold.** Recorded reason: requiring above-the-fold at 360 px would force a redesign of
  shipped screens, which the phase boundary forbids. The spec scrolls to each action and has no
  initial-viewport assertion.
- **D-OQ-3 (owner, 2026-09-07) is settled: ZERO-PAPER HUB evidence stops at the Products region.**
  Recorded reason: asserting the rest of that page would turn a proving phase into a remediation
  phase in a repository that receives code commits only when the evidence forces them. It is a scope
  decision, not a severity judgement. Anything found outside the region is an out-of-scope
  observation (§5), never a failure.

## 7. What this evidence does not say

These are the three planner assumptions carried by 05-08, restated verbatim:

- **QUAL-01 / unclassified probe edge (unresolved).** The edge probe could not classify QUAL-01 and
  flagged it for manual review. Reviewed here: QUAL-01's shape is a *layout* claim over a closed set
  of widths and a closed set of actions, which is why neither a boundary nor an ordering taxonomy fits
  it. The planner's assumption is that the closed D-09 matrix (six widths) and the closed P1-P13
  action list are together a sufficient sample of "supported mobile and desktop widths" — no
  continuous sweep between widths is performed, so a defect that appears only at, say, 412 px is not
  covered by this evidence. That is a deliberate sampling choice inherited from the owner's matrix,
  not an oversight.

- **UI consideration, zero-one-many / Products collection (unresolved).** The Products section renders
  a featured single-card layout at one product, a two-column grid at two or more, and nothing at zero.
  Only the single-card branch is live, so only that branch is provable on the live Products region.
  The other two branches remain covered by jsdom only. Carried as an explicit assumption: this phase's
  live evidence says nothing about the grid or empty branches.

- **UI consideration, ZERO-PAPER HUB home contact form (unresolved).** That form sits outside the
  Products region, has its own submit, status region and honeypot, and carries a focus indicator
  measured at roughly 1.74:1. It is out of scope by decision D-OQ-3 and is deferred unfixed. Carried
  as an explicit assumption: the ZERO-PAPER HUB contact form is unproven by this phase and does not
  affect the Products journey.

Also outside this file:

- 200% zoom, which is the zoom spec's job through the same shared helpers.
- The inside of native `<select>` popups, a UI-SPEC backstop that VC-1b cannot see.
- S2 and S4.
- Every mail-delivery claim.
