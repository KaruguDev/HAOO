---
phase: 5
slug: prove-the-deployed-journey
status: draft
shadcn_initialized: false
preset: none
created: 2026-09-07
---

# Phase 5 — UI Design Contract

> **Read the next section before anything else.** This phase builds no UI. This document is not a
> design contract for new screens; it is a **measurable acceptance contract for existing, deployed
> screens** — the thresholds, states and assertions the Playwright + axe harness (D-05) encodes.

---

## What this document is, and is not

Phase 5 proves the live funnel. The product surfaces are finished, shipped and published. The
deliverable is *evidence* plus the instrument that produces it.

| This document DOES | This document does NOT |
|--------------------|------------------------|
| State assertions a Playwright/axe spec can execute | Propose new visual design, palette or typography |
| Record the tokens the shipped pages already use, so the harness can reference them | Introduce new components, blocks or a design system |
| Name the primary actions per surface, as a closed list | Redesign any shipped state |
| Fix the measurement method where a naive assertion would pass vacuously | Author or alter shipped product copy |
| Record the owner's four resolved scope/threshold decisions (§ Resolved Decisions) | Touch privacy, disclosure or data-controller copy (locked — see Copywriting) |
| Hand three measured, unfixed ZPH defects forward so they are inherited, not rediscovered (§ Deferred) | Fix those three — D-OQ-3 puts them outside this phase |

**If a reader finds a colour token proposed for a NEW element in this document, that is a defect in
this document.**

### shadcn gate — executed, declined, with reason

Neither repository has `components.json`; both use stock Tailwind 3.4 with an empty `theme.extend`.
The gate's purpose is design consistency for *new* components. This phase creates none, and the
phase boundary in `05-CONTEXT.md` states it "does not add product capability, change copy, change
what HAOO does". Initialising shadcn here would rewrite the visual foundation of two finished,
owner-approved, live products in a phase whose entire job is to prove they already work.

**Recorded outcome: `Tool: none`. Registry safety gate: not applicable.** This is a decision, not an
omission.

---

## Surfaces Under Test

Closed list, one reason per entry — the house pattern from
`../HAOO/src/test/focus-contrast.test.ts:27-33`. A surface is admitted by being registered here,
never by a spec reaching for it.

| # | Surface | URL (live target, D-06) | Owning repo | Why it is in the list |
|---|---------|--------------------------|-------------|------------------------|
| S1 | HAOO product page | `https://www.haoo.online/` | `KaruguDev/HAOO` | The whole journey QUAL-01/02/03 name; every brochure, qualification and onboarding control lives here |
| S2 | HAOO `noscript` recovery | `https://www.haoo.online/` with JavaScript disabled | `KaruguDev/HAOO` | D-14 names the JS-disabled path explicitly; it is a different DOM, not a state of S1 |
| S3 | ZPH Products section | `https://www.zero-paperhub.com/#products` | `KaruguDev/ZERO-PAPERHUB` | QUAL-01 names "the Products **and** HAOO journeys"; reached by live URL only (D-08) |
| S4 | Retired-path recovery document | `https://www.zero-paperhub.com/products/haoo/` | `KaruguDev/ZERO-PAPERHUB` | The one artifact whose criterion spans both repositories (04.2 D-12); SC3's navigation claim rests on it |
| S5 | Local preview mirror of S1 | `vite preview` in `KaruguDev/HAOO` | `KaruguDev/HAOO` | D-06's CI gate; the only target permitted to exercise destructive/failure form states (see § Form State Coverage) |

**Not in the list, and why:** the ZERO-PAPER HUB home page *outside* the Products section (hero,
about, mission, services, values, contact form). It is not part of the Products or HAOO journeys.
Pre-flight measurement found **three real accessibility defects there, one of them a genuine WCAG
failure on a live public page** — see § Pre-Flight Findings F4/F5/F6. The owner decided on
2026-09-07 (**D-OQ-3**) that this phase records and defers them rather than fixing them. They are
**not** absent from this document because nobody noticed; they are absent from the assert set
because someone decided. See § Deferred to a Future ZERO-PAPER HUB Phase.

**Engine and matrix — locked by D-09, not re-opened here.** Chromium only. Viewports 360, 390, 768,
1280, 1440 CSS px. Accessibility modes: 200% zoom, `prefers-reduced-motion: reduce`, keyboard-only
traversal.

---

## Primary Actions

"Hidden primary actions" (QUAL-01) is unassertable until *primary action* is a closed list. It is
one here. Every row must satisfy the Viewport Contract at all five widths and at 200% zoom.

| ID | Surface | Accessible name (as shipped) | Resolves to | Instances |
|----|---------|------------------------------|-------------|-----------|
| P1 | S1 | `Open brochure (opens in a new tab)` | `/brochure/HAOO-Marketing-Brochure.pdf` | 1 |
| P2 | S1 | `Download brochure` | same PDF, `download` attribute | 1 |
| P3 | S1 | `Send my details` (submit) | the qualification endpoint | 1 |
| P4 | S1 | WhatsApp action label (`whatsappActionLabel`) | `https://wa.me/254702188044?text=…` | 3 (opening, mid-page, closing) |
| P5 | S1 | `Call +254 702 188 044` | `tel:+254702188044` | 3 + 1 footer |
| P6 | S1 | `Email info@haoo.online` | `mailto:info@haoo.online` | 3 + 1 footer |
| P7 | S1 | Self-onboarding action label (`selfOnboardingActionLabel`) | `https://manage.haoo.online/` | 3 |
| P8 | S1 | Qualify entry-point label (`qualifyEntryPointLabel`) | `#qualify` | 3 |
| P9 | S3 | `Explore HAOO` | `https://www.haoo.online/` | 1 |
| P10 | S3 | `Products` (nav entry) | `#products` | 1 desktop + 1 mobile menu |
| P11 | S4 | `Open HAOO at www.haoo.online` | `https://www.haoo.online/` | 1 |
| P12 | S4 | `www.haoo.online/brochure/HAOO-Marketing-Brochure.pdf` | that PDF | 1 |
| P13 | S2 | The five `noscript` recovery links | WhatsApp, tel, mailto, manage host, brochure | 1 each |

**Duplicate names are permitted and must be permitted explicitly.** P4–P8 render three times with
byte-identical accessible names. A naive "accessible names must be unique" assertion would fail a
correct page. The rule is: *identical accessible name ⇒ identical `href`*. Divergence is the defect,
duplication is not.

---

## Viewport Contract (QUAL-01, SC1)

### VC-1 — Horizontal overflow, measured so it cannot pass vacuously

**Both top-level wrappers carry `overflow-x-hidden`:**
`../HAOO/src/pages/ProductPage.tsx:91` and `ZERO-PAPERHUB/src/App.tsx:207`.

A `document.documentElement.scrollWidth > clientWidth` assertion therefore **passes even when
content genuinely overflows** — the mask absorbs it. Writing only that assertion would ship a green
suite that proves nothing. Three assertions, all required:

| Assertion | Method | Must hold |
|-----------|--------|-----------|
| VC-1a | Unmodified page: `document.documentElement.scrollWidth <= clientWidth + 1` | Necessary, **explicitly not sufficient** — recorded as such in the spec's own comment |
| VC-1b | For every element in the rendered tree: `rect.right <= window.innerWidth + 1` and `rect.left >= -1`, excluding elements that are `visibility:hidden`, `display:none`, or intentionally off-canvas (the `-left-[10000px]` honeypot, `sr-only`) | The load-bearing assertion. Must pass on the **unmodified** page |
| VC-1c | Re-measure VC-1a after `page.addStyleTag({ content: 'html,body,body *{overflow-x:visible !important}' })` | Proves the mask is not concealing an overflow. Recorded as a *modified-page* measurement, never conflated with VC-1a |

Tolerance is exactly 1 CSS px, for subpixel rounding. No larger tolerance, no epsilon elsewhere —
the `focus-contrast.test.ts` discipline of comparing the raw value applies.

### VC-2 — Primary actions are present, visible and hit-targetable

At each of the five widths, for every row of § Primary Actions present on that surface:

- The element exists in the accessibility tree with a non-empty accessible name.
- It is visible: non-zero bounding box, `visibility` not `hidden`, `opacity` not `0`, and no
  ancestor clipping it entirely out of the layout box.
- Its bounding box lies fully within the viewport's horizontal extent (VC-1b already covers this;
  restated because a primary action failing it is a QUAL-01 failure, not a layout nit).
- Hit target ≥ **44 × 44 CSS px**. This matches what is already shipped (`min-h-11`, `size-11`
  throughout both repos) — it is a record of the existing bar, not a new one. For interactive
  elements *not* in the primary list, the floor is WCAG 2.2 SC 2.5.8's **24 × 24**.
- `disabled` is false, except P3 during the in-flight state (see § Form State Coverage).

**Scrolling is permitted — settled, not assumed.** QUAL-01's "no hidden primary actions" means
**REACHABLE, not above-the-fold** (owner, 2026-09-07, **D-OQ-2**). A primary action must be present,
visible when scrolled to, hit-targetable, and not clipped or off-canvas — it need **not** appear
without scrolling. Recorded reason: requiring above-the-fold at 360 px would force a redesign of
shipped screens, which 05-CONTEXT.md's phase boundary explicitly forbids. A spec author must
therefore not write an above-the-fold assertion "to be safe" — doing so would fail correct,
owner-accepted screens. Behind a collapsed disclosure that the visitor must open first
(the mobile nav toggle, the `<details>` measurement disclosure) counts as reachable **only** if the
opening control is itself a keyboard-operable, named, ≥44 px target — assert the control, then
assert the revealed action.

### VC-3 — Mobile navigation

At 360 and 390 px the desktop `<nav aria-label="{product} sections">` is `hidden md:flex` and the
toggle button is the reachable path. Assert: toggle present, `aria-expanded` reflects state,
`aria-controls` resolves to the mobile `<nav>`, the mobile nav's `hidden` attribute tracks state,
and every P10-class section link inside it is reachable once opened.

---

## Keyboard and Focus Contract (QUAL-02, SC2)

### KF-0 — Division of labour with the existing static test (reconciliation, not contradiction)

`focus-contrast.test.ts` already exists in **both** repositories and is a *static source-string*
analysis: it extracts `(ring colour, offset colour)` pairs from Tailwind literals and gates them at
an unrounded `ratio >= 3`, throwing on any unrecognised token. It owns the **ratio**.

This contract does **not** restate, re-derive or override that gate. It adds the one thing a source
read cannot see: **that an indicator is actually painted at runtime, on the real surface, in the
real browser**. The two are complementary and must not be allowed to drift:

| Owner | Question answered | Where |
|-------|-------------------|-------|
| `focus-contrast.test.ts` | Is the declared ring ≥ 3:1 against its declared offset? | vitest, both repos, unchanged by this phase |
| Phase 5 Playwright | Does focusing this element change its computed painted indicator at all? | new e2e suite, HAOO repo only (D-07/D-08) |

`MIN_FOCUS_CONTRAST`, `RING_COLOR_TOKENS`, `DEFAULT_RING_OFFSET`, the extractor and the
`pairs.length > 0` vacuity guard are **out of scope for modification**. See F3 for the one change
this phase makes to that file's *closed list* (not its machinery), decided as **D-OQ-4**.

### KF-1 — Traversal order

- Tab order equals DOM order. Assert **no element anywhere in the traversal has `tabindex > 0`**
  (a single positive value re-orders the whole document).
- `tabindex="-1"` is expected and correct on exactly four targets, all script-focus destinations:
  the honeypot input, the error-summary container, the confirmation heading, the failure heading.
  Assert none of them is a sequential tab stop.
- S1 expected first five stops, in order: skip link → `Back to ZERO-PAPER HUB` → (desktop) the five
  section links / (mobile) the nav toggle → hero WhatsApp action → hero call link.
- Traversal terminates: tabbing forward from the last footer link leaves the document; no cycle, no
  trap, no stop that cannot be left with Shift+Tab.

### KF-2 — Visible focus indicator

For every sequentially-focusable element on S1 and S3, at every viewport in the matrix:

- Focus it via keyboard (`page.keyboard.press('Tab')`, never `element.focus()` — `:focus-visible`
  is modality-dependent and a scripted focus would measure a state the visitor never sees).
- Capture `getComputedStyle(el)` for `outline-style`, `outline-width`, `outline-color`,
  `box-shadow` before and after.
- Assert the *after* state differs from the *before* state in at least one of those properties, and
  that the resulting indicator is non-empty (`box-shadow !== 'none'` **or** `outline-width > 0`).
  Tailwind's `ring` compiles to `box-shadow`, so `box-shadow` is the property that will normally
  carry it; `outline-none` alone with no ring is a failure.

### KF-3 — Skip link

S1 ships one (`skipToContentLabel`, `sr-only` → `focus:not-sr-only focus:fixed`):

- It is the first tab stop.
- On focus it becomes visible: bounding box non-zero, fully within the viewport at all five widths.
- Activating it navigates to `#{slug}-content` and the **next** Tab lands on a control inside
  `<main id="{slug}-content">`, not back at the header.

S3 ships **none** — recorded as F5, not invented here. QUAL-02/03 name the HAOO page, and the owner
decided on 2026-09-07 (**D-OQ-3**) that ZPH scope stops at the Products section. A skip link on the
ZPH home is therefore **deferred**, not required by this phase and not silently dropped either — see
§ Deferred to a Future ZERO-PAPER HUB Phase.

### KF-4 — The brochure panel is NOT modal, and the contract says so

`BrochurePanel` renders an `<img>` (below `lg`) or an `<object>` embed (at `lg`) plus two ordinary
sibling anchors. There is **no `role="dialog"`, no overlay, no focus trap and no focus return**, by
design (04.2 / Phase 1 D-07: the controls are siblings of the embed in every state and share no
mutable state).

Therefore **no focus-trap or focus-return contract applies.** Asserting one would fail a correct
component. What is asserted instead:

- P1 and P2 are ordinary sequential tab stops in both layout branches.
- P1 carries `target="_blank"` **and** `rel="noopener"`, and its accessible name ends with the
  sr-only `(opens in a new tab)` suffix — the new-tab disclosure is part of the name, not only
  adjacent prose.
- Activating P1 or P2 does not remove, disable or re-render the other. (Structural equivalence is
  already proven in jsdom; the live assertion is only that both remain present and enabled after
  activation.)
- The `<object>` embed does not become a keyboard trap: with the PDF plugin active, Tab must be able
  to leave it. If Chromium's PDF viewer proves to trap focus, that is recorded as a measured
  browser-behaviour limit with the exact observation — never normalised to a pass.

### KF-5 — Focus movement on qualification-form transitions

`document.activeElement` must never become `<body>` after any of these transitions:

| Transition | Focus lands on |
|------------|----------------|
| Invalid submit | The error-summary container (`tabindex=-1`) |
| Repeat invalid submit, unchanged errors | The summary again (keyed on the attempt counter, so it re-announces) |
| Correcting a field while typing | **Unchanged** — focus must stay in the control the visitor is in |
| Activating a summary item link | The field named by that item |
| Success | The confirmation heading (`tabindex=-1`) |
| Transport failure / blocked | The `QualifyFallback` heading (`tabindex=-1`) |

Script-focus targets use modality-independent `focus:` variants, not `focus-visible:` — already
pinned by `focus-contrast.test.ts`'s "styles script-moved focus" case. The live assertion is that
the indicator is **painted** on those targets after a scripted focus (KF-2's method, but with
`element.focus()` here, deliberately, because that is the real path).

---

## Semantic Structure Contract (QUAL-03)

### SS-1 — Headings

- Exactly one `<h1>` per document on S1 (`product.outcome`) and S3 (the hero heading).
- **S4 has no heading at all, deliberately** — it is a three-paragraph recovery document. See
  § axe Configuration for the per-URL rule disables this requires, recorded with reasons.
- No skipped levels anywhere in the traversal: for the ordered list of heading levels in document
  order, every step forward is ≤ +1.
- Assert the S1 level structure explicitly: `h1` (hero) → `h2` per section
  (`Who {name} supports`, `Benefits`, `Capabilities`, journey heading, `Brochure`,
  `Send your details`, and the two per `OnboardingChoices` placement) → `h3` for pains/benefits,
  capability cards, journey steps, the error-summary heading, the confirmation heading, the failure
  heading, and the `<object>` fallback heading.
- Conditional headings (`Brochure preview unavailable`, `There is a problem`,
  `Your details are on their way`, `We couldn't send your details`) must hold their level **in the
  state that renders them**, not only in the default state. Assert per state, not once.

### SS-2 — Landmarks

| Surface | Required | Assertion |
|---------|----------|-----------|
| S1 | exactly one `banner`, one `main`, one `contentinfo` | plus two `navigation` landmarks, each with a distinct accessible name (`sectionsNavLabel` / `mobileSectionsNavLabel`) |
| S1 | the `region` set | The `aria-label` values of labelled regions must equal the closed expected list — the same list `haoo-page.test.tsx:47` already pins: `Benefits`, `Capabilities`, `Rental journey`, `Brochure`, `Onboarding`, plus the three `… onboarding choices` regions and `Send your details` |
| S3 | the Products section is a `region` named `Products` via `aria-labelledby` | and the `Products` nav entry's `href` resolves to that region's `id` |
| S3 | **no `main` landmark exists** | recorded as F5 and written into the evidence file as an observation with its measured value, **never as a pass/fail** — deferred by D-OQ-3 |
| S4 | no landmark requirements | it is a minimal document; see axe disables |

### SS-3 — Accessible names

- Every `link`, `button` and form control in the traversal has a non-empty accessible name.
- Every `<img>` has a non-empty `alt`, except decorative ones; every lucide icon carries
  `aria-hidden="true"` and contributes nothing to a name. Assert the icon rule as a negative: no
  accessible name in the traversal is composed solely of icon content.
- The `<object>` brochure embed has `aria-label` = `{productName} brochure preview`.
- Every form control's accessible name comes from a `<label for>` that resolves, and its
  `aria-describedby` (help text, error text, collection note) resolves to elements that exist.
- **Names promise destinations truthfully.** For every link whose accessible name names a
  destination — a phone number, an email address, a host, or another site — the `href` must resolve
  to that destination. This is the assertion that catches F1; see § Pre-Flight Findings.

### SS-4 — The HTML equivalent to the brochure (QUAL-03's explicit requirement)

**What the equivalent currently is.** The brochure's substantive content is rendered as real HTML on
S1, not only inside the PDF. Per the Phase 1 decision recorded in `STATE.md` ("HAOO page renders all
brochure capability and journey copy verbatim; only the pain and benefit summaries are condensed,
and each is assembled from brochure phrases"), the equivalent is the union of:

- `#capabilities` — 10 capability titles + descriptions, verbatim brochure copy
- the journey section — the ordered journey steps, titles + descriptions, verbatim brochure copy
- `#benefits` — the pain and benefit paragraphs, condensed from brochure phrases
- the audiences list and `product.marketClaim`
- `<link rel="alternate" type="application/pdf" href="/brochure/…">` in `<head>` — the machine-
  discoverable pointer to the original, reachable with JavaScript unavailable

**What makes it a faithful equivalent — assert all five:**

1. Every capability `title` in product data appears as an `<h3>` text node inside `#capabilities`,
   and its `description` as text in the same `<li>`. Count equality, not just presence: 10 of 10.
2. Every journey step `title`/`description` appears in document order inside the journey section's
   `<ol>`.
3. **The equivalent survives the PDF being unavailable.** Abort the `.pdf` route
   (`page.route('**/*.pdf', r => r.abort())`) and re-assert 1 and 2. The HTML equivalent must not
   depend on the artifact it is the equivalent *of*.
4. In that same aborted state the `<object>` child fallback renders `Brochure preview unavailable`
   plus `brochureFallbackBody`, and **P1 and P2 remain present and enabled** — the recovery copy
   never replaces the controls.
5. The `<head>` `rel="alternate"` link's `href` equals P1's and P2's `href`. One target, three
   references, asserted equal to one another rather than each to a literal (the discipline
   `build-output.test.ts` already applies to S4).

---

## Zoom and Reduced-Motion Contract (QUAL-03)

### ZM-1 — 200% zoom

**Method.** Emulate 200% zoom as a halved CSS viewport at the desktop entries: 1280 × 1024 → 640 ×
512, and 1440 × 900 → 720 × 450. This is the WCAG-sanctioned equivalence used for SC 1.4.10 reflow;
it is recorded here as the method so a later reader does not mistake it for "just another narrow
viewport". Chromium `deviceScaleFactor` is *not* used — it scales rendering, not layout, and would
prove nothing about reflow.

At each zoomed viewport:

| Assertion | Must hold |
|-----------|-----------|
| ZM-1a | Reflow, not horizontal scroll: VC-1a, VC-1b and VC-1c all pass |
| ZM-1b | No loss of content: every text node asserted by SS-4 (1) and (2) is still in the accessibility tree with non-empty text |
| ZM-1c | No loss of functionality: every § Primary Actions row for that surface still satisfies VC-2 |
| ZM-1d | No clipping: for each named primary action and each section heading, `scrollWidth <= clientWidth + 1` on its own box (text is not truncated into a hidden overflow) |

S1's `min-h-screen` root and its `max-w-[620px]` / `max-w-[680px]` / `max-w-[560px]` content columns
are the shipped constraint; nothing about them changes here.

### ZM-2 — `prefers-reduced-motion: reduce`

**What actually exists, measured.** S1 carries exactly **one** animation:
`ProductPage.tsx:192` — capability cards, `transition-transform duration-200 hover:-translate-y-1`,
already guarded by `motion-reduce:transform-none motion-reduce:transition-none`. There is no
`animate-*` utility, no `scroll-behavior: smooth`, and no JS-driven animation anywhere on S1.

| Assertion | Must hold |
|-----------|-----------|
| ZM-2a | With `reducedMotion: 'reduce'`, a capability `<li>` computes `transition-duration: 0s` (or `transition-property: none`) and hovering it produces no change in `transform` |
| ZM-2b | Closed negative on S1: zero elements match `[class*="animate-"]`, and no computed `scroll-behavior` on `html`/`body` is `smooth` |
| ZM-2c | With reduce active, every SS-4 text assertion and every VC-2 primary-action assertion still passes — suppression must not remove content or controls |

**S3's `transition-colors duration-200` on P9 is deliberately NOT required to be suppressed.** A
colour transition is not motion. WCAG 2.3.3 (Animation from Interactions) concerns motion animation;
a 200 ms colour fade neither moves nor scales anything. Recorded so a future reader does not "fix"
it into a `motion-reduce:` variant it does not need.

**The ZPH home page outside S3 is a different story** — `animate-bounce`, `hover:scale-105`, and
IntersectionObserver reveal transitions at `duration-700`, with no `prefers-reduced-motion` handling
anywhere in that repository. That is F6, scoped out and **deferred** by D-OQ-3.

---

## Form State Coverage (existing states — observable contract only)

These are **shipped** states. Nothing below redesigns them; every string cited is quoted from source
with its file, and the contract is what a spec can observe.

### FS-0 — Where each state may be exercised (load-bearing)

| State | Live (S1) | Local preview (S5) |
|-------|-----------|--------------------|
| empty / idle | yes | yes |
| invalid | yes — validation is client-side, no request is issued | yes |
| in-flight | **no** | yes (endpoint routed to a delayed response) |
| success | **exactly once**, the single D-12 tagged submission | yes (endpoint routed to 200) |
| failed | **no** | yes (endpoint routed to abort / 500 / timeout) |
| blocked | **no** | yes (serialisation forced to fail) |

**Rationale, recorded rather than assumed.** Every live submission reaches a real third-party
provider and a real mailbox. Exercising failure states against production would either send junk to
`info@haoo.online` or require faking the provider on the live origin. D-13's evidence is one tagged
submission, not a batch. The local target exists precisely so the other five states stay provable
(D-06).

### FS-1 — Per-state observable contract

| State | Must be observable |
|-------|--------------------|
| **empty / idle** | P3 enabled, labelled `Send my details` (`qualify-form.logic.ts:19`); the lead `All fields are required unless marked optional.` present; `role="status"` region present and empty with reserved height (`min-h-[1.5rem]`) so its appearance causes no reflow; no error summary; honeypot input present, `aria-hidden`, off-canvas, `tabindex=-1`, not a tab stop |
| **invalid** | Error summary appears with heading `There is a problem` (`:21`) inside a `role="alert"`; one link per invalid field whose text is that field's message and whose `href` is `#{fieldId}`; each invalid control has `aria-invalid="true"` and an `aria-describedby` that includes its error id; each per-field message is prefixed by the sr-only `Error: ` so a screen reader announces the role of the text; focus per KF-5 |
| **in-flight** | P3 `disabled`, label `Sending…` (`:20`); every field control `disabled` (the request body was already serialised — a silently discarded correction is the failure being prevented); status region reads `Sending your details…` (`:30`); a second submit within the window issues **no** second request |
| **success** | The form subtree is replaced by the confirmation card; `<h3>Your details are on their way</h3>` focused; body `qualifyConfirmationBody` (`copy.ts:88`); `Need an answer sooner?` with two contact links; status region reads `Your details were sent.` (`:31`) — a browser-observable claim, never a delivery claim |
| **failed** | `QualifyFallback` renders with `<h3>We couldn't send your details</h3>` focused, body `qualifyFallbackBody` (`copy.ts:67`), a `Try sending again` button, and three direct-contact links; the form **remains mounted and editable** with values retained; status region reads `We couldn't send your details.` (`:32`) |
| **blocked** | Same panel, body `qualifyBlockedBody` (`copy.ts:76`), and **no retry button** — a blocked submission is deterministic, so offering a retry would be a lie; assert the button's absence |

### FS-2 — Status region invariants (all states)

One `role="status"` region, mounted from first render, **outside** the form card so it survives the
card being replaced on success. Assert across every transition: exactly one such region exists, its
`role` never changes, it never holds two messages, and it is never duplicated. A requiredness-change
announcement outranks an already-read terminal message; `submitting` outranks everything.

### FS-3 — The D-12 tagged live submission

The single live success run carries the release-verification marker. Its exact field and format are
the planner's (D-12), but the **UI-observable** contract is: the marker travels in a field the
visitor can see and read back before sending, and the confirmation state that follows is
byte-identical to FS-1's `success` row. The harness must not invent a hidden field for it —
introducing new form markup would violate this phase's boundary.

---

## Onboarding Recovery Resolution Contract (D-14, LEAD-07)

**Resolve, never deliver.** No live call is placed, no WhatsApp message is sent, no mail is sent
through these links. Third-party systems this project does not control are not cheaply re-runnable.

| Check | Applies to | Assertion |
|-------|-----------|-----------|
| Present | P4–P7 on S1, all five links on S2 | Element exists with its shipped accessible name |
| Well-formed | `tel:` | Exactly `tel:+254702188044` — E.164, no spaces, no separators |
| Well-formed | `mailto:` | Exactly `mailto:info@haoo.online` — a **mailbox**, and it takes no `www.` prefix |
| Well-formed | WhatsApp | `https://wa.me/254702188044?text=…` with the starter text decoding byte-exactly to the compile-time constant |
| Well-formed | Self-onboarding | Exactly `https://manage.haoo.online/` — a **separate host**, and it takes no `www.` prefix |
| Reachable | `https://manage.haoo.online/` | An HTTP request (HEAD, or GET without following into any flow) returns a non-error status. Record the status verbatim |
| Reachable | brochure PDF | `GET` returns 200 with `content-type: application/pdf`. Record the status |
| Reachable | `tel:` / `mailto:` / `wa.me` | **Not fetched.** Scheme-only validation. Recorded as *validated, not fetched*, never as *reachable* |
| JS-disabled | S2 | With JavaScript disabled the five `noscript` links are the rendered document; all five satisfy the well-formed rows above; the two `<section aria-label>` values are present; the `h1`/`h2` order holds |

`info@haoo.online` reachability is **not** provable from the browser. It is D-10/D-11's separate
three-link mail chain (MX → activation → delivery) with owner-recorded verbatim evidence (D-13). At
the time this document was written, `dig +short MX haoo.online` returned **empty output** — the
D-10 blocking checkpoint is genuinely still open. That value is a measurement made on 2026-09-07 and
must be **re-measured at execution time, never cited from here** (the 04.2 W-1 discipline).

---

## Retired-Path Recovery Document Contract (S4)

The minimum this document must present to a visitor the refresh does **not** carry — i.e. with
meta-refresh neutralised **and** with JavaScript disabled:

| # | Must be present as rendered, visible text | Why it is the minimum |
|---|-------------------------------------------|------------------------|
| R1 | A statement that HAOO has moved to its own domain | Without it the page is a bare link with no explanation of why the visitor is not where they expected |
| R2 | A working absolute anchor to `https://www.haoo.online/` whose **visible text names the destination host** | The visible link is the guarantee; the refresh is the enhancement. A "click here" would strand a visitor who cannot see where they are going |
| R3 | A working absolute anchor to the brochure PDF at its new host | The brochure was one of the four retired assets; a visitor arriving from an old brochure URL needs the new one |
| R4 | A statement that the old sibling asset URLs are not retained and return 404 | 04.2 decision (d) let them go deliberately; silence would read as a broken site rather than a recorded choice |
| R5 | A statement that the visible links work whether or not the refresh runs | Makes the progressive-enhancement posture legible to the visitor, matching every other no-JS fallback in the project |

Structural assertions on the deployed document:

- `<meta http-equiv="refresh" content="0; url=…">` — the delay is **exactly `0`**, and that number is
  load-bearing (an instant refresh reads as a permanent move; a delayed one reads as temporary).
- `<link rel="canonical">`, `<meta name="robots" content="noindex, follow">`.
- **Exactly zero `<script>` elements.** Asserted as an exact number, not a maximum (04.2 D25).
- The refresh target, the canonical `href` and R2's anchor `href` are asserted **equal to one
  another**, not each to a literal — so one edited target cannot silently split them. This mirrors
  what `build-output.test.ts` already does against the built tree; the live assertion extends it to
  the deployed document.
- With the refresh permitted to run, the browser lands on `https://www.haoo.online/` and S1's `<h1>`
  is present. This is SC3's cross-repository navigation claim, end to end.

---

## axe Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| Library | `@axe-core/playwright` (D-05) | Locked |
| Tags | `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` | The conformance target. **`best-practice` is excluded** — it is advisory, and including it would fail S4 for things that are recorded decisions rather than defects |
| Failure threshold | `critical` and `serious` **fail** the run; `moderate` and `minor` are **recorded** in the run output with rule id, node target and impact, and do not fail | **Decided by the owner, 2026-09-07 (D-OQ-1)** — not a default. Recorded reason: it blocks the violations that actually deny access while keeping the gate credible enough that it does not get routinely ignored |
| Global disabled rules | **none** | A global disable is invisible at the call site; every disable below is per-URL with a reason |
| Provenance | Each run records the resolved `axe-core` version, the tag list, the disabled-rule list and the URL into the evidence file | The 04.1/04.2 provenance discipline: a count with no provenance is not evidence |

**Per-URL rule disables — closed list, one reason per entry:**

| URL | Rule | Reason |
|-----|------|--------|
| S4 | `page-has-heading-one` | S4 is a three-paragraph recovery document with no content to head. Adding an `<h1>` would give a `noindex` page a heading it does not need |
| S4 | `landmark-one-main` | Same: S4 is a static document, not a route. 04.2 D-12 defines it as minimal, and "just one more element" is the drift that definition exists to prevent |
| S4 | `region` | Follows from the two above — with no landmarks by design, all content is necessarily outside one |

All three are `best-practice`-tag rules and would already be excluded by the tag list. They are named
here anyway so the exclusion is a recorded decision rather than a side effect of a tag choice, and so
that adding `best-practice` later is a deliberate act with a visible cost.

**Scope of each axe run.** S1 and S3 are scanned in the default state **and** in each state the
harness reaches: mobile nav open, `<details>` disclosure open, error-summary present, in-flight,
success, failure, blocked. A single default-state scan would miss every conditional subtree, which
is where the error, confirmation and fallback headings live.

---

## Pre-Flight Findings

Measured while writing this contract, on 2026-09-07, by reading both live trees. Recorded here so
the planner decides deliberately rather than discovering these mid-execution. Live status probes at
the same time: `www.haoo.online/` **200**, `www.zero-paperhub.com/` **200**,
`www.zero-paperhub.com/products/haoo/` **200**, the brochure PDF **200**, `dig +short MX haoo.online`
**empty**.

### F1 — Both `Back to ZERO-PAPER HUB` links point at HAOO itself, and a green test guards the bug (IN SCOPE — fix here)

`../HAOO/src/components/ProductHeader.tsx:33` and `../HAOO/src/pages/ProductPage.tsx:308` both use
`href="/"`. That was correct when HAOO was served from `zero-paperhub.com/products/haoo/`, where `/`
was the parent site. Since the 04.2 split, `/` on `www.haoo.online` **is the HAOO page** — both links
loop the visitor back to where they already are.

Worse, the existing jsdom suite **pins the wrong value**:
`../HAOO/src/test/haoo-page.test.tsx:52` asserts `href === '/'` for every such link and `:403`
asserts there are two of them. The suite is green and the links are broken. This is precisely D-05's
rationale made concrete — jsdom has no origin, so it cannot see the defect.

Caught by **SS-3's** "names promise destinations truthfully" rule. The phase boundary permits the
fix: "where the evidence reveals a defect, fixing that defect is in scope".

> **The fix is TWO files, and doing only one of them will be reverted by a red suite.**
>
> 1. `ProductHeader.tsx:33` and `ProductPage.tsx:308` — change `href="/"` to the absolute parent-site
>    URL `https://www.zero-paperhub.com/`.
> 2. `../HAOO/src/test/haoo-page.test.tsx:52` — **the assertion that pins `href === '/'` must change
>    in the same commit.** It is currently green *because* the link is wrong. An executor who fixes
>    only the components turns a green suite red, reads that as "my change broke something", and
>    reverts the correct fix. The test is guarding the bug; changing it is part of the fix, not
>    collateral damage.
>
> `haoo-page.test.tsx:403` asserts there are exactly two such links. That count stays 2 — it is
> correct and must not be touched. Only the `href` expectation moves.
>
> A same-origin `href="/"` on the HAOO host is not a broken link in any HTTP sense: it returns 200
> and renders a valid page. Nothing that checks status codes will ever catch this. Only an assertion
> that compares the link's *promise* against its *destination* will.

### F2 — `overflow-x-hidden` on both root wrappers absorbs real overflow (IN SCOPE — method already fixed in VC-1)

`../HAOO/src/pages/ProductPage.tsx:91` and `ZERO-PAPERHUB/src/App.tsx:207`.

> **A single `scrollWidth > clientWidth` check is the obvious thing to write here, and it would pass
> vacuously on both surfaces at every one of the five widths.** The wrapper eats the overflow before
> the document ever reports it. That check is not a weak assertion — it is a *non*-assertion wearing
> the costume of one, and it would let this phase publish a green SC1 result that proves nothing.

Fully addressed by **VC-1's three-assertion treatment**, which must survive review intact:
VC-1a (unmodified document check, explicitly marked necessary-but-not-sufficient in the spec's own
comment), **VC-1b (per-element bounding boxes against the viewport — the load-bearing one, run on the
unmodified page)**, and VC-1c (re-measure with the mask neutralised, recorded as a modified-page
measurement and never conflated with VC-1a). Collapsing these back into one check reopens F2.

### F3 — `MeasurementDisclosure.tsx` declares focus rings but is not in the closed `FOCUS_SOURCES` list (IN SCOPE — register it)

HAOO's `FOCUS_SOURCES` has six entries; `src/components/MeasurementDisclosure.tsx` is not among them,
yet it declares
`focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2 focus-visible:ring-offset-white`
on both a `<summary>` and a `<button>`. The list's own comment says a new interactive component is
admitted "by registering it here"; this one never was.

The pairing measures **≈6.30:1** on white, so registering it should go green on registration — but
that is a calculation made here, not a test run, so the executor confirms it by running the suite
rather than by citing this number.

**Decided by the owner, 2026-09-07 (D-OQ-4): register it.** Recorded reason — the closed-list
discipline: *a focus-bearing component outside the guard list is precisely the silent gap the list
exists to prevent.* An unmeasured focus style is not a passing focus style; it is an unasked
question, and the list's own comment already says a new interactive component is admitted by being
registered.

**Scope of the change: one line in `../HAOO/src/test/focus-contrast.test.ts`'s `FOCUS_SOURCES` array
(6 entries → 7).** The component itself is **not** touched — `MeasurementDisclosure.tsx` renders copy
governed by locked owner approval (04.2 D-08/D-09), and this registration changes the test's source
list only. `MIN_FOCUS_CONTRAST`, `RING_COLOR_TOKENS`, `DEFAULT_RING_OFFSET`, the extractor and the
`pairs.length > 0` vacuity guard all stay byte-unchanged, so the seven entries are measured exactly
as strictly as the six were.

### F4 — A live WCAG 1.4.11 contrast FAILURE on the ZPH contact form, plus an unregistered focus source (DEFERRED by D-OQ-3 — read this before writing the ZPH phase)

ZPH's list has exactly one entry, `src/components/ProductsSection.tsx`. `App.tsx` declares
`focus-visible:ring-green-600` (line 118) and, on the contact-form inputs,
`focus:ring-green-400` with `focus:border-transparent` and no offset.

Two consequences if it were registered as-is:

- `resolveRingColor('green-600')` and `resolveRingColor('green-400')` both **throw** — neither token
  is in `RING_COLOR_TOKENS` (`{ white, blue-700 }`). By design: the list fails loudly rather than
  skipping. Registering `App.tsx` therefore requires adding both tokens.
- `green-400` (`#4ade80`) against the default white offset computes **≈1.74:1** — **below the 3:1
  gate**. On a white input surface that is a genuine WCAG 2.2 SC 1.4.11 concern, not an artefact of
  the extractor.

> **This is a genuine WCAG 2.2 SC 1.4.11 (Non-text Contrast) failure on a live, public page, and
> Phase 5 deliberately does not fix it.** The ≈1.74:1 figure is not an artefact of the extractor or a
> theoretical pairing: `focus:outline-none` removes the native indicator, and the replacement ring is
> `green-400` (`#4ade80`) painted on the white surface of a text input. A keyboard visitor filling in
> the ZERO-PAPER HUB contact form has an indicator they may not be able to see.
>
> It sits outside S3, so D-OQ-3 defers it. **The deferral is a scope decision, not a severity
> judgement** — the owner chose not to expand a proving phase into a remediation phase in a
> repository that D-03 says receives code commits only when the evidence forces them. Nobody has
> decided this is acceptable to leave indefinitely.

**Inherited by:** § Deferred to a Future ZERO-PAPER HUB Phase.

### F5 — The ZPH home page has no `<main>` landmark and no skip link (DEFERRED by D-OQ-3)

`grep -c "<main" src/App.tsx` → `0`. A keyboard visitor heading for the Products section traverses
the entire header and hero with no bypass — WCAG 2.4.1 (Bypass Blocks). QUAL-02/QUAL-03 name the
HAOO page, and S3 is a section of a page that has neither landmark nor skip link. Recorded as a
measured observation in the evidence file per SS-2, asserted as nothing.

**Inherited by:** § Deferred to a Future ZERO-PAPER HUB Phase.

### F6 — The ZPH home page has no reduced-motion handling (DEFERRED by D-OQ-3)

`animate-bounce` (`App.tsx:299`), `hover:scale-105` on two CTAs, and IntersectionObserver-driven
`opacity-0 translate-y-10` → `opacity-100 translate-y-0` reveals at `duration-700` across five
sections. No `motion-reduce:` variant and no `prefers-reduced-motion` media query exists anywhere in
that repository. A secondary risk worth naming: content that starts at `opacity-0` and depends on an
observer firing is content a visitor loses entirely if the observer never fires.

**Inherited by:** § Deferred to a Future ZERO-PAPER HUB Phase.

---

## Resolved Decisions

**No open questions remain in this document.** Four were raised while it was drafted; the owner
answered all four on **2026-09-07**. Each answer confirmed the drafted conservative default, so no
contract section was reversed — but they are now **decided, not defaults**, and a downstream agent
must treat them as settled rather than as a recommendation it may re-litigate.

Each decision is also written into the contract section it governs; this table is the index, not the
only home.

| ID | Question | Decision (owner, 2026-09-07) | Recorded rationale | Governs |
|----|----------|------------------------------|--------------------|---------|
| **D-OQ-1** | Which axe impact severities block the run? | **`critical` + `serious` BLOCK.** `moderate` + `minor` are recorded in the run output and do not fail | Blocks the violations that actually deny access, while keeping the gate credible enough that it does not get routinely ignored | § axe Configuration |
| **D-OQ-2** | Does "no hidden primary actions" (QUAL-01) mean *visible without scrolling*? | **No — it means REACHABLE.** Present, visible when scrolled to, hit-targetable, not clipped or off-canvas; need not appear without scrolling | Requiring above-the-fold at 360 px would force a redesign of shipped screens, which 05-CONTEXT.md's phase boundary explicitly forbids | § VC-2 |
| **D-OQ-3** | Does ZPH-side evidence stop at the Products section (S3)? | **Yes, it stops at S3.** F4, F5 and F6 are recorded as findings and **DEFERRED to a future ZERO-PAPER HUB phase** — not fixed here | Asserting them would expand a proving phase into a remediation phase in a repository D-03 says receives code commits only when the evidence forces them. A scope decision, **not** a severity judgement | § Surfaces Under Test, § KF-3, § SS-2, § ZM-2, § Deferred |
| **D-OQ-4** | Register `MeasurementDisclosure.tsx` in HAOO's `FOCUS_SOURCES`? | **Yes — register it.** One line in the test's source list (6 → 7); the component is not touched | The closed-list discipline: a focus-bearing component outside the guard list is the silent gap the list exists to prevent | § F3 |

**Still genuinely undecided, and named so it is not mistaken for settled:** the measurement/PostHog
suppression call for live test traffic is already delegated to the planner by 05-CONTEXT.md's
Claude's Discretion, with the binding constraint that it be *decided, not discovered*. This document
adds one input to that decision: the live evidence pass fires `haoo_page_view` on **every** S1 load,
across five viewports × the accessibility modes, plus one real `qualify_submit`. That is a
substantial multiple of organic traffic, not a rounding error, and 04.2 D41 already records the owner
report's counts as a floor rather than a census.

---

## Deferred to a Future ZERO-PAPER HUB Phase

> **If you are writing a ZERO-PAPER HUB accessibility or quality phase, this section is your
> inheritance. These three defects were measured on 2026-09-07, on the live public site, and
> deliberately left unfixed. You do not need to rediscover them.**

Deferred by **D-OQ-3** (owner, 2026-09-07). All three sit on the ZERO-PAPER HUB home page *outside*
the Products section, which is where this phase's ZPH scope stops. The deferral is a **scope
decision, not a severity judgement** — nobody assessed these as acceptable to leave indefinitely.
Phase 5 records them; it does not accept them.

| ID | Defect | Where | Severity | Status |
|----|--------|-------|----------|--------|
| **F4** | Focus ring `green-400` (`#4ade80`) on white input surfaces computes **≈1.74:1**, below the 3:1 floor, with `focus:outline-none` removing the native indicator | `ZERO-PAPERHUB/src/App.tsx` contact-form inputs (~lines 590–611) | **WCAG 2.2 SC 1.4.11 FAILURE — live, public** | Deferred, unfixed |
| **F4b** | `App.tsx` declares focus rings but is absent from that repo's closed `FOCUS_SOURCES` (which holds only `ProductsSection.tsx`), so none of them is measured | `ZERO-PAPERHUB/src/test/focus-contrast.test.ts` | Guard gap — it is why F4 was never caught | Deferred, unfixed |
| **F5** | No `<main>` landmark and no skip link on the home page | `ZERO-PAPERHUB/src/App.tsx` | WCAG 2.4.1 (Bypass Blocks) concern | Deferred, unfixed |
| **F6** | `animate-bounce`, `hover:scale-105`, and `duration-700` IntersectionObserver reveals with **no** `prefers-reduced-motion` handling anywhere in the repository | `ZERO-PAPERHUB/src/App.tsx` (~lines 288–501) | WCAG 2.3.3 concern; plus content starting at `opacity-0` is lost entirely if the observer never fires | Deferred, unfixed |

**Two traps the inheriting phase should know about before it starts:**

1. **Registering `App.tsx` in `FOCUS_SOURCES` will THROW, not fail.** `resolveRingColor` raises on
   any unrecognised token, by design, so it never skips silently. `App.tsx` uses `green-600` and
   `green-400`; that repository's `RING_COLOR_TOKENS` holds only `{ white, blue-700 }`. Both tokens
   must be added in the same change. `green-600` (`#16a34a`) computes ≈3.30:1 on white and passes;
   `green-400` is the one that fails. Expect the registration to go red — that is the guard working,
   and it is the point.
2. **F4 cannot be fixed by adding a token.** Adding `green-400` to `RING_COLOR_TOKENS` makes the test
   *able to measure* the ring; it does not make the ring visible. The fix is a different ring colour
   (or restoring an outline) on those inputs. Adding the token and then loosening
   `MIN_FOCUS_CONTRAST` to accommodate it would convert a caught defect into a permanent one.

**Not deferred, for contrast:** F1, F2 and F3 are all in Phase 5's scope and are fixed or handled
here. See § Pre-Flight Findings.

---

## Design System

Recorded, not proposed. Both repositories ship stock Tailwind with an empty `theme.extend`; every
value below is an inline utility or arbitrary value in shipped source.

| Property | Value |
|----------|-------|
| Tool | none — see § shadcn gate |
| Preset | not applicable |
| Component library | none (hand-written React 18 components) |
| Icon library | `lucide-react` ^0.344.0 (both repos), every icon `aria-hidden="true"` |
| Font | Tailwind default `font-sans` stack; no webfont is loaded on either surface |

---

## Spacing Scale

**Inherited and observed, not introduced.** These are the Tailwind steps the shipped surfaces
actually use; the harness references them, no value is added or changed.

| Token | Value | Usage (as shipped) |
|-------|-------|--------------------|
| xs | 4px | `gap-1` — stacked contact-link groups |
| sm | 8px | `px-2`, `mt-2` — inline link padding, tight label/help gaps |
| md | 16px | `px-4`, `gap-4`, `mb-4` — default element spacing, container gutter at ≤640 |
| lg | 24px | `p-6`, `gap-6`, `mt-6` — card padding, section padding at ≤768 |
| xl | 32px | `p-8`, `gap-8`, `mb-8` — card padding at ≥768, layout gaps, fieldset separation |
| 2xl | 48px | `py-12` — section vertical rhythm below `md` |
| 3xl | 64px | `py-16` — section vertical rhythm at `md` and above |

**Exceptions (deliberate, both multiples of 4):** `min-h-11` / `size-11` = **44px**, the touch-target
floor applied to every interactive control in both repositories; and `py-3` = **12px**, the vertical
control padding that composes with `min-h-11` to reach 44.

---

## Typography

Observed on S1. Exactly four sizes and two weights ship, which is the contract the harness asserts —
a fifth size or a third weight appearing on a proven surface is a regression.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px (`text-base`) | 400 (`font-normal`) | 1.5 (`leading-6`) |
| Label / small | 14px (`text-sm`) | 600 (`font-semibold`) | 1.4 (`leading-[1.4]`) |
| Heading (h2 / h3) | 28px (`text-[28px]`) | 600 (`font-semibold`) | 1.2 (`leading-[1.2]`) |
| Display (h1) | 40px (`text-[40px]`) | 600 (`font-semibold`) | 1.1 (`leading-[1.1]`) |

S3 uses the ZERO-PAPER HUB home page's own larger display scale (`text-5xl`/`text-7xl` hero,
`text-4xl`/`text-5xl` section headings) with the same 28px/600/1.2 for the Products card headings.
The two scales are **not** unified by this phase; recorded so the difference reads as two products
rather than as drift.

---

## Color

Observed on S1 (`ProductPage.tsx` and children). No token is introduced.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#FBFCFF` page surface, `#FFFFFF` section surfaces | Page background, alternating section bands, form card, header, footer |
| Secondary (30%) | `#18275F` navy bands, `#E9EDFF` tinted panels, `#DFE4F0` borders | Hero and closing onboarding bands, brochure/disclosure/confirmation panels, all hairlines |
| Accent (10%) | `#4054C6` | See reserved-for list |
| Destructive / error | `#B00020` on `#FFF5F5` | Error summary border and links, per-field error text, the failure panel border, the blocked clear-status text |

**Accent `#4054C6` is reserved for, and only for:** the primary CTA fill (P3, P4, the retry button);
the focus ring on light surfaces; link text on light surfaces (P5, P6, P8, footer links); the
capability icon chip; the journey step numerals; and the self-onboarding button border on light
surfaces. On the `#18275F` navy bands the focus ring is **white**, not accent — accent-on-navy
computes 2.21:1 and is already rejected by name in `focus-contrast.test.ts`.

Body text is `#5F6B84` on light surfaces and `#DBE2FF` on navy. S3 uses the ZERO-PAPER HUB
green/blue palette (`green-900`, `blue-700`, `blue-50`) — a second product's palette, deliberately
not unified.

---

## Copywriting Contract

**Restricted, deliberately, to accessible names, alt text and error clarity.**

Every string below is **already shipped and cited with its source**. Nothing here is authored.
The measurement disclosure copy, the privacy copy and the data-controller copy are **LOCKED by prior
owner approval (04.2 D-08 / D-09)** and are out of scope. The **Kenya Data Protection Act 2019
sign-off remains OPEN** (`02-VALIDATION.md:91`) and is a D-18 blocking human checkpoint — this
document proposes no privacy, disclosure or controller wording, and the owner's approval of the
visitor-facing copy explicitly did not close that sign-off.

| Element | Copy (shipped) | Source |
|---------|----------------|--------|
| Primary CTA | `Send my details` | `qualify-form.logic.ts:19` |
| Primary CTA, in-flight | `Sending…` | `qualify-form.logic.ts:20` |
| Brochure CTAs | `Open brochure` + sr-only ` (opens in a new tab)`; `Download brochure` | `BrochurePanel.tsx` |
| Skip link | `Skip to {productName} content` | `copy.ts:16` |
| Empty state heading | *not applicable* — no list-collection surface on S1 or S3 renders an empty state. S3's registry is non-empty and `ProductsSection` returns `null` for an empty collection by design | `ProductsSection.tsx` |
| Empty state body | *not applicable*, same reason | — |
| Error state — validation | Summary `There is a problem`; per-field messages prefixed by sr-only `Error: ` and linked from the summary to the field | `qualify-form.logic.ts:21`, `QualifyForm.tsx` |
| Error state — transport | `We couldn't send your details` + `Something went wrong between this page and our email provider. Your answers are still here, so you can try again — or reach {name} directly.` + `Try sending again` | `copy.ts:67`, `QualifyFallback.tsx` |
| Error state — blocked | `We couldn't send your details` + `This page couldn't prepare your details for sending, so nothing was sent. Your answers are still here — please reach {name} directly.`, **no retry offered** | `copy.ts:76` |
| Error state — brochure preview | `Brochure preview unavailable` + `You can still open the {name} brochure in a new tab or download the PDF.`; and the compact-panel variant `We couldn't show the brochure preview here. Open the brochure or download the PDF instead.` | `copy.ts:154`, `BrochurePanel.tsx` |
| Success state | `Your details are on their way` + `Your details were submitted. If you don't hear back within one business day, use one of the contacts below.` | `QualifyForm.tsx:381`, `copy.ts:88` |
| Status region | `Sending your details…` / `Your details were sent.` / `We couldn't send your details.` | `qualify-form.logic.ts:28-34` |
| Destructive confirmation | `Clear what this page remembers` — the only destructive action on either surface. It clears a bounded, non-identifying, self-expiring browser record and **ships without a confirmation step, deliberately**: it destroys nothing the visitor supplied and nothing that leaves the browser. Outcome is announced in a `role="status"` region as `What this page remembered has been cleared.` or the blocked variant | `haoo.ts:351-353`, `MeasurementDisclosure.tsx` |

**Alt text under test.** Every `<img>` on S1 and S3 sources its `alt` from product data
(`media.logo.alt`, `media.hero.alt`, `brochure.previewImageAlt`, the ZPH card's
`previewImageAlt`). The assertion is SS-3's: non-empty, and no accessible name in the traversal is
composed solely of icon content. No alt text is rewritten here.

---

## UI Considerations

Shape-rooted UI *state* coverage. Copy for each state lives in § Copywriting Contract above and is
referenced, not restated. Every row is an **existing** state being proven, never a new one.

Applicable state considerations resolved: **7 covered, 2 backstop, 3 unresolved**

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | qualification form (idle) | ✅ covered | Idle renders every control enabled, the `All fields are required unless marked optional.` lead, and an empty `role="status"` region with reserved height so its first message causes no reflow (FS-1 empty row) |
| loading | qualification form (in-flight) | ✅ covered | Submit disabled and relabelled `Sending…`, every field control disabled, status region announces, a second submit issues no second request (FS-1 in-flight row). Exercised on S5 only (FS-0) |
| error | qualification form (invalid) | ✅ covered | Error summary in a `role="alert"`, one link per invalid field targeting that field's id, `aria-invalid` and `aria-describedby` resolve, focus moves to the summary and re-announces on repeat (FS-1 invalid row, KF-5) |
| error | qualification form (transport failure, blocked) | ✅ covered | `QualifyFallback` with focused heading and three direct-contact links; retry present on failure, **absent** on blocked; form stays mounted with values retained (FS-1 failed/blocked rows) |
| error | brochure preview (embed unsupported, image failed) | ✅ covered | Both recovery states render their own copy and **neither removes P1 or P2**; proven with the PDF route aborted (SS-4 assertions 3 and 4) |
| populated | brochure HTML equivalent | ✅ covered | 10 of 10 capability titles and every journey step present as real text, in order, at the right heading level, and still present with the PDF unavailable (SS-4 assertions 1–3) |
| partial | product media absent (logo, hero, preview) | ✅ covered | Each media block is conditionally rendered from product data; with `previewImageHref` empty the compact panel renders the recovery copy and the controls survive. Layout must not collapse — VC-1b holds in the partial state |
| overflow | long option labels in the qualification selects at 360 px | 🧪 backstop | The five closed option lists include long Kenyan county and banded-portfolio labels with en dashes. A native `<select>` clips rather than reflows; VC-1b cannot see inside the popup. Held out as a visual UI-state check at 360 px |
| long-text | product copy blocks at 200% zoom | 🧪 backstop | ZM-1d asserts no per-box truncation for headings and primary actions, but paragraph reflow inside `max-w-[680px]` columns at a 640 px effective viewport is a visual judgement no assertion settles cleanly |
| zero-one-many | ZPH Products collection | ⚠ unresolved | `ProductsSection` renders a featured single-card layout at length 1, a two-column grid at length ≥ 2, and `null` at 0. Only length 1 is live and therefore only length 1 is provable on S3. The other two branches stay jsdom-only; the planner treats live coverage of them as an assumption |
| error | ZPH home contact form (outside S3) | ⚠ unresolved | Has its own submit, status region and honeypot, and a `focus:ring-green-400` indicator computing ≈1.74:1 (F4). **Out of scope by decision (D-OQ-3), deferred, not covered by this phase's evidence** — the planner carries "the ZPH contact form is unproven and does not affect the Products journey" as an explicit assumption. See § Deferred |
| loading | S1 under a slow or failed PostHog load | ⚠ unresolved | The measurement facade fails closed to a no-op, so the journey should be unaffected — but no assertion currently proves the page renders and P1–P8 stay operable with the analytics origin blocked. Cheap to add; the planner decides |

<!-- Status vocabulary (locked by probe-core projectTruths):
     ✅ covered   → a plain truth string lifted into must_haves.truths
     🧪 backstop  → a flat scalar { statement, verification: backstop }; at verify time, no explicit
                    evidence → insufficient_spec → human_needed (never a silent pass, #1154)
     ⚠ unresolved → an explicit planner assumption (surfaced, never silently dropped)
     Rows are REPLACED (not appended) on a probe re-run — idempotent. -->

---

## Registry Safety

**Not applicable.** No shadcn, no component registry, no third-party UI blocks in either repository —
see § shadcn gate. Nothing is installed into `KaruguDev/ZERO-PAPERHUB` at all (D-08).

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — not initialised | not applicable |
| third-party | none declared | not applicable — nothing to vet |

The new dependencies this phase does add (`@playwright/test`, `@axe-core/playwright`, and the
Chromium browser binary) are **test tooling in the HAOO repository only** (D-05, D-07). They are not
UI registry blocks and are out of this gate's scope, but they are named here so a reader does not
mistake "no registry entries" for "no new dependencies".

---

## Sections of the template that do not apply, and why

Stated rather than filled with invention. An honestly empty section is worth more than a fabricated
one.

| Template section | Disposition |
|------------------|-------------|
| New component inventory | **Empty.** This phase creates zero components. The surfaces under test are the six shipped HAOO components plus ZPH's `ProductsSection` and the static recovery document |
| Design tokens to introduce | **Empty.** Every value in § Spacing / § Typography / § Color is a record of what already ships. Introducing one would violate the phase boundary |
| Layout/animation direction | **Empty.** § ZM-2 measures the one animation that exists; it proposes none |
| Copy to write | **Empty.** § Copywriting cites shipped bytes only. Privacy, disclosure and controller copy are locked; the Kenya DPA sign-off is open |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
