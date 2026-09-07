# Phase 05 — Pre-Flight Findings: Closed and Deferred

**Recorded by plan `05-04`, 2026-09-07. Working directory: the HAOO checkout (05-01, D-01/D-04).**

Six findings were measured on 2026-09-07 while `05-UI-SPEC.md` was being written, by reading both
live trees. Three were in this phase's scope and are closed here. Three sit on the ZERO-PAPER HUB
home page outside the Products section, and the owner **deferred** them by decision **D-OQ-3**.

This file exists so the deferred three are **inherited rather than rediscovered**. Values below are
transcribed as measured, not summarised. Where a figure was computed rather than run, it says so.

---

## Closed in this plan

### F1 — Both `Back to ZERO-PAPER HUB` links pointed at the HAOO page itself

**Status: FIXED** (commit `d8f4bea`, this plan's Task 1).

| | |
|---|---|
| Source locations | `src/components/ProductHeader.tsx:33` (header anchor), `src/pages/ProductPage.tsx:308` (footer anchor) |
| Destination before | `href="/"` — on `www.haoo.online` that IS the HAOO page, so both links looped the visitor back to where they already were |
| Destination after | `href="https://www.zero-paperhub.com/"` — the parent site's canonical `www` leg (04.2-SPLIT-CONTRACT § Domain → *Decision (a) reversal*) |
| Why it was ever correct | Correct while HAOO was served from `zero-paperhub.com/products/haoo/`, where `/` was the parent site. The 04.2 split moved HAOO to its own origin and left the two hrefs behind |

**The assertion that moved.** `src/test/haoo-page.test.tsx:53` required every link named
`Back to ZERO-PAPER HUB` to have `href === '/'`. It was green **because** the link was wrong — the
test was guarding the defect. It now expects `https://www.zero-paperhub.com/`, and it moved in the
**same commit** as the components. Changing it observed the required red first:
`npx vitest run src/test/haoo-page.test.tsx` failed on exactly that assertion and nothing else
(1 failed | 26 passed) before either component changed.

**The assertion that did not move.** `src/test/haoo-page.test.tsx:403` asserts there are exactly
**two** such links. That number is correct and is untouched — asserting it is what stops a future
edit from quietly dropping one of the links.

**Why nothing that checks status codes could have caught it.** A same-origin root destination on the
HAOO host returns **200** and renders a valid page. No link-checker, no crawler and no HTTP probe
sees a defect. Only an assertion comparing a link's *promise* (its accessible name) against its
*destination* surfaces it. This is D-05's rationale made concrete: jsdom has no origin.

**Not changed on either anchor:** class composition, accessible text, the `min-h-11` hit-target
floor, and the focus-ring utilities. No `target` or `rel` attribute was added — this is a
same-site-family navigation to the parent, not a new-tab link, and adding one would change a shipped
interaction that this phase's boundary does not permit changing.

### F2 — `overflow-x-hidden` on both root wrappers absorbs real overflow

**Status: CLOSED BY MEASUREMENT METHOD — no source change was made.**

| | |
|---|---|
| Source locations | `src/pages/ProductPage.tsx:91` (`<div className="min-h-screen overflow-x-hidden …">`), `ZERO-PAPERHUB/src/App.tsx:207` (`<div className="font-sans text-gray-800 bg-white overflow-x-hidden">`) |
| Change made | **None.** The horizontal-clipping utility on both root wrappers stays exactly as shipped |
| How it is closed | By *method*, not by edit — the three-part overflow measurement |

A single `document.documentElement.scrollWidth > clientWidth` check would pass **vacuously** on both
surfaces at every width, because the wrapper eats the overflow before the document ever reports it.
That check is not a weak assertion; it is a *non*-assertion wearing the costume of one, and it would
have let this phase publish a green result that proves nothing.

The finding is closed by VC-1's three-assertion treatment instead:

| ID | Assertion | Standing |
|----|-----------|----------|
| VC-1a | Unmodified page: `scrollWidth <= clientWidth + 1` | Necessary, **explicitly not sufficient** — marked as such in the spec's own comment |
| VC-1b | Every element: `rect.right <= innerWidth + 1` and `rect.left >= -1`, excluding `visibility:hidden`, `display:none` and intentionally off-canvas elements (the `-left-[10000px]` honeypot, `sr-only`) | **The load-bearing one.** Runs on the unmodified page |
| VC-1c | Re-measure VC-1a after `page.addStyleTag({ content: 'html,body,body *{overflow-x:visible !important}' })` | Proves the mask is not concealing an overflow. Recorded as a *modified-page* measurement, never conflated with VC-1a |

Plan `05-03` already implements the per-element sweep (VC-1b) at one width and recorded
**0 overflow escapees at 360 px** on `https://www.haoo.online/` in `evidence/tracer.json`. Plan
`05-08` expands it to all three assertions across the closed viewport matrix on both surfaces.

**Collapsing these three back into one check reopens F2.**

### F3 — `MeasurementDisclosure.tsx` declared focus rings but was outside the closed list

**Status: FIXED** (commit `2d9c33b`, this plan's Task 2).

| | |
|---|---|
| List size before → after | `FOCUS_SOURCES` in `src/test/focus-contrast.test.ts`: **6 → 7** entries |
| Component registered | `src/components/MeasurementDisclosure.tsx` |
| What it declares | `focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2 focus-visible:ring-offset-white` on **both** a `<summary>` and a `<button>` (line 13) |
| Authorised by | Owner decision **D-OQ-4**, 2026-09-07 — *"register it. One line in the test's source list; the component is not touched"* |
| Recorded reason | The closed-list discipline: a focus-bearing component outside the guard list is precisely the silent gap the list exists to prevent. An unmeasured focus style is not a passing focus style; it is an unasked question |

**Byte-unchanged machinery** — this is a registration, not a relaxation: `MIN_FOCUS_CONTRAST` (3),
`RING_COLOR_TOKENS` (`{ white, blue-700 }`), `DEFAULT_RING_OFFSET` (`#ffffff`), the extractor, and
the `pairs.length > 0` vacuity guard. The seven entries are measured exactly as strictly as the six
were. No token was added to the ring-colour map — the component's ring colour is an arbitrary hex
the extractor already handles.

**`MeasurementDisclosure.tsx` itself was not touched.** Its copy is governed by locked owner
approval from 04.2 (D-08/D-09); this registration changes the test's source list only.

**Measured by running, not by citing.** `npx vitest run src/test/focus-contrast.test.ts` → **11
passed** (one case per registered source, so 7 of them, plus 4 machinery cases); it was 10 before.
`npm run verify:disjoint` → **0 violations, 3 ratified collisions, converged: 0** — this file is a
ratified GROUND B path collision whose two copies must stay divergent, and a widening on the HAOO
side keeps them so.

---

## Deferred to a future ZERO-PAPER HUB phase

> **If you are writing a ZERO-PAPER HUB accessibility or quality phase, this section is your
> inheritance. These defects were measured on 2026-09-07 on the live public site and deliberately
> left unfixed. You do not need to rediscover them.**

**Disposition, in the owner's terms: deferred by decision D-OQ-3 (owner, 2026-09-07) —
a scope decision and not a severity judgement.** Recorded reason: asserting them would expand a proving
phase into a remediation phase in a repository that D-03 says receives code commits only when the
evidence forces them. All of them sit on the ZERO-PAPER HUB home page *outside* the Products
section (S3), which is where this phase's ZERO-PAPER HUB scope stops.

**Nobody has decided these are acceptable to leave indefinitely.** Phase 5 records them; it does not
accept them.

| ID | Defect | Where | Severity | Status |
|----|--------|-------|----------|--------|
| **F4** | Focus ring `green-400` (`#4ade80`) on white input surfaces computes **≈1.74:1**, below the **3:1** floor, with `focus:outline-none` removing the native indicator | `ZERO-PAPERHUB/src/App.tsx` contact-form inputs, lines **590, 595, 601, 606, 611** | **WCAG 2.2 SC 1.4.11 (Non-text Contrast) FAILURE — live, public** | **Measured, unfixed, deferred** |
| **F4b** | `App.tsx` declares focus rings but is absent from that repository's closed `FOCUS_SOURCES`, so none of them is measured | `ZERO-PAPERHUB/src/test/focus-contrast.test.ts:55-57` | Guard gap — it is why F4 was never caught | **Measured, unfixed, deferred** |
| **F5** | No `<main>` landmark and no skip link on the home page | `ZERO-PAPERHUB/src/App.tsx` | WCAG 2.4.1 (Bypass Blocks) concern | **Measured, unfixed, deferred** |
| **F6** | Animation utilities and observer-driven reveals with **no** `prefers-reduced-motion` handling anywhere in the repository | `ZERO-PAPERHUB/src/App.tsx` (~lines 288–501) | WCAG 2.3.3 concern, plus a content-loss risk | **Measured, unfixed, deferred** |

### F4 — a live WCAG 1.4.11 contrast failure on the ZERO-PAPER HUB contact form

- **Ring colour:** `green-400`, hex **`#4ade80`**.
- **Surface it is painted on:** the **white** surface of a text input (`bg-white` form fields).
- **Measured contrast ratio:** **≈1.74:1** against the default `#ffffff` ring offset.
- **Floor it falls below:** **3:1**, the WCAG 2.2 SC 1.4.11 non-text contrast minimum.
- **File and line range:** `ZERO-PAPERHUB/src/App.tsx`, the five contact-form controls at lines
  **590, 595, 601, 606, 611** — each carrying
  `focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent`.
- **The native indicator is removed.** `focus:outline-none` is present on all five, so the
  low-contrast ring is not a supplement to the browser's own focus ring — it is the **replacement**.

**This is a live, public WCAG 2.2 SC 1.4.11 failure, and it is unfixed.** The ≈1.74:1 figure is not
an artefact of the extractor or a theoretical pairing: a keyboard visitor filling in the
ZERO-PAPER HUB contact form has a focus indicator they may not be able to see. A second declaration,
`focus-visible:ring-green-600` at `App.tsx:119`, computes ≈3.30:1 on white and would pass.

**F4b — the guard gap that let it go uncaught.** That repository's closed `FOCUS_SOURCES` holds
**one** entry, `src/components/ProductsSection.tsx` — it does **not** include `src/App.tsx`, the file
carrying the failing ring. The list is closed and strict; the file with the defect was simply never
registered in it.

**Two traps for the inheriting phase:**

1. **Registering `App.tsx` in `FOCUS_SOURCES` will THROW, not fail.** `resolveRingColor` raises on
   any unrecognised token by design, so it never skips silently. `App.tsx` uses `green-600` and
   `green-400`; that repository's `RING_COLOR_TOKENS` holds only `{ white, blue-700 }`. Both tokens
   must be added in the same change. Then expect the registration to go **red** on `green-400` —
   that is the guard working, and it is the point.
2. **F4 cannot be fixed by adding a token.** Adding `green-400` to `RING_COLOR_TOKENS` makes the
   test *able to measure* the ring; it does not make the ring visible. The fix is a different ring
   colour (or restoring an outline) on those inputs. Adding the token and then loosening
   `MIN_FOCUS_CONTRAST` to accommodate it would convert a caught defect into a permanent one.

### F5 — no `<main>` landmark and no skip link on the ZERO-PAPER HUB home page

- **Measured:** `grep -c "<main" src/App.tsx` → **`0`**. Re-measured 2026-09-07 in this plan: still
  `0`. A grep for a skip link in the same file also returns **`0`**.
- **Consequence:** a keyboard visitor heading for the Products section traverses the entire header
  and hero with no bypass — WCAG 2.4.1 (Bypass Blocks).
- **How this phase treats it:** recorded as a measured observation, **asserted as nothing**.
  QUAL-02/QUAL-03 name the HAOO page, and S3 is a *section* of a page that has neither landmark nor
  skip link.
- **Why the axe run is scoped rather than rule-disabled:** the ZERO-PAPER HUB axe pass runs against
  `#products` **precisely so this finding is not suppressed**. Disabling the `bypass`/`region` rules
  globally would silence exactly this defect on the whole page, and would keep silencing it after a
  future phase fixes F5 — leaving a stale disable row that nobody revisits. Scoping the *surface*
  keeps the *rule* live.

### F6 — no reduced-motion handling anywhere in the ZERO-PAPER HUB repository

Measured in `ZERO-PAPERHUB/src/App.tsx` on 2026-09-07:

- `animate-bounce` — **1** occurrence, line **299** (the hero scroll cue).
- `hover:scale-105` — **4** occurrences, lines **288, 433, 486, 490** (three CTA buttons and one card
  icon tile). `05-UI-SPEC.md` names "two CTAs"; the measured line count is 4, recorded here as
  measured rather than as summarised.
- `duration-700` — **5** occurrences, the IntersectionObserver-driven
  `opacity-0 translate-y-10` → `opacity-100 translate-y-0` reveals across five sections.
- `opacity-0` — **6** occurrences.
- **`motion-reduce:` variants and `prefers-reduced-motion` media queries across `src/`, `index.html`
  and `tailwind.config.js`: `0`.** Not "few" — none, anywhere in the repository.

**Secondary risk, named because it is not a motion-preference issue at all:** content that starts at
`opacity-0` and depends on an `IntersectionObserver` firing is content a visitor **loses entirely**
if the observer never fires. That is a content-availability failure hiding inside an animation
concern.

---

## Provenance

Live status probes taken 2026-09-07 while these findings were measured: `www.haoo.online/` **200**,
`www.zero-paperhub.com/` **200**, `www.zero-paperhub.com/products/haoo/` **200**, the brochure PDF
**200**, `dig +short MX haoo.online` **empty**.

Source of record for the findings themselves: `05-UI-SPEC.md` § Pre-Flight Findings (F1–F6),
§ Resolved Decisions (D-OQ-3, D-OQ-4) and § Deferred to a Future ZERO-PAPER HUB Phase. The
ZERO-PAPER HUB figures in this file were re-measured read-only against `../ZERO-PAPERHUB` by plan
`05-04` on 2026-09-07 and matched, with the one recorded discrepancy noted under F6.
