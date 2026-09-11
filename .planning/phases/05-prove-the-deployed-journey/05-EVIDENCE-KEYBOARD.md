# 05-EVIDENCE-KEYBOARD — the keyboard traversal, as measured

Plan 05-09. QUAL-02's keyboard half, measured on the **live** HAOO page and the **live** Products
region on 2026-09-12 with Playwright 1.63.0 driving headless Chromium against the `live` project.
One run of the committed spec: 25 tests, 25 passed, **0 retried**. Every integer below was read
from the committed records in `evidence/keyboard-*.json`, which that run wrote.

Spec: `e2e/keyboard.e2e.ts` (commits `d01d531`, `5d7e65d`).

---

## 1. Who owns which question

Two suites measure focus in this project. They answer **different questions**, and this file exists
partly so that nobody later reads one as contradicting the other.

| Owner | Question it answers | Where it lives |
|-------|---------------------|----------------|
| `src/test/focus-contrast.test.ts` | Is the **declared** ring at least 3:1 against its **declared** offset? | vitest, in both repositories, unchanged by this phase |
| `e2e/keyboard.e2e.ts` (this plan) | Does focusing this element **by keyboard** change its **computed painted** indicator at all? | Playwright, live, HAOO repository only (D-07/D-08) |

The static suite reads Tailwind literals out of source. It cannot see whether a browser paints
anything. This spec drives real key presses against the deployed page and reads computed style. It
adds runtime evidence; it does not re-open the ratio.

**Cited, not restated.** The static suite gates at a minimum contrast of **3:1** (`MIN_FOCUS_CONTRAST`,
WCAG 2.2 SC 1.4.11) and measures **seven** registered sources:

1. `src/pages/ProductPage.tsx`
2. `src/components/ProductHeader.tsx`
3. `src/components/OnboardingChoices.tsx`
4. `src/components/BrochurePanel.tsx`
5. `src/components/QualifyForm.tsx`
6. `src/components/QualifyFallback.tsx`
7. `src/components/MeasurementDisclosure.tsx` — registered by plan 05-04 under owner decision D-OQ-4, taking the list from six to seven

Those numbers are that suite's claim and are repeated here only so the boundary is legible. This
phase did not compute a contrast ratio, and `MIN_FOCUS_CONTRAST`, `RING_COLOR_TOKENS`,
`DEFAULT_RING_OFFSET`, the extractor and the `pairs.length > 0` guard were not modified.

**What this file therefore does not measure:** the declared ratio (above); the painted state of the
four script-focus destinations after a *scripted* focus (UI-SPEC KF-5, owned by the preview-target
form-state spec); traversal after arbitrary interleaved mouse input; and assistive-technology
virtual-cursor navigation, which no automated harness in this stack can observe.

---

## 2. The ordered traversal

Method: `page.keyboard.press('Tab')` from document start until `document.activeElement` is
`<body>`. No focus was scripted onto any element being measured. "DOM" is the element's position in
document order. "Indicator" reports the four computed properties (`outline-style`, `outline-width`,
`outline-color`, `box-shadow`) compared immediately before and immediately after the press that
focused the element.

### 2.1 Desktop branch — 1280 × 1024, 40 stops

| # | Tag | Accessible name | DOM | Indicator changed on focus |
|---|-----|-----------------|-----|----------------------------|
| 1 | a | Skip to HAOO content | 26 | 4 of 4 properties, ring added |
| 2 | a | Back to ZERO-PAPER HUB | 29 | 4 of 4 properties, ring added |
| 3 | a | Benefits | 32 | 4 of 4 properties, ring added |
| 4 | a | Capabilities | 33 | 4 of 4 properties, ring added |
| 5 | a | Brochure | 34 | 4 of 4 properties, ring added |
| 6 | a | Send details | 35 | 4 of 4 properties, ring added |
| 7 | a | Onboarding | 36 | 4 of 4 properties, ring added |
| 8 | a | Chat with HAOO on WhatsApp | 65 | 4 of 4 properties, ring added |
| 9 | a | Call +254 702 188 044 | 69 | 4 of 4 properties, ring added |
| 10 | a | Email info@haoo.online | 72 | 4 of 4 properties, ring added |
| 11 | a | Send your details instead | 77 | 4 of 4 properties, ring added |
| 12 | a | Start with HAOO | 81 | 4 of 4 properties, ring added |
| 13 | a | Chat with HAOO on WhatsApp | 196 | 4 of 4 properties, ring added |
| 14 | a | Call +254 702 188 044 | 200 | 4 of 4 properties, ring added |
| 15 | a | Email info@haoo.online | 203 | 4 of 4 properties, ring added |
| 16 | a | Send your details instead | 208 | 4 of 4 properties, ring added |
| 17 | a | Start with HAOO | 212 | 4 of 4 properties, ring added |
| 18 | a | Open brochure (opens in a new tab) | 231 | 4 of 4 properties, ring added |
| 19 | a | Download brochure | 237 | 4 of 4 properties, ring added |
| 20 | input | Full name | 259 | 4 of 4 properties, ring added |
| 21 | input | Email address | 262 | 4 of 4 properties, ring added |
| 22 | select | How should we reach you? | 265 | 4 of 4 properties, ring added |
| 23 | input | Phone number (optional) | 273 | 4 of 4 properties, ring added |
| 24 | select | Your role | 278 | 4 of 4 properties, ring added |
| 25 | input | Organization (optional) | 288 | 4 of 4 properties, ring added |
| 26 | select | How many units do you manage? | 291 | 4 of 4 properties, ring added |
| 27 | select | Where are your properties? | 300 | 4 of 4 properties, ring added |
| 28 | select | When would you like to start? | 354 | 4 of 4 properties, ring added |
| 29 | textarea | Anything else we should know? (optional) | 363 | 4 of 4 properties, ring added |
| 30 | summary | How we measure this page | 369 | 4 of 4 properties, ring added |
| 31 | button | Send my details | 425 | 4 of 4 properties, ring added |
| 32 | a | Chat with HAOO on WhatsApp | 433 | 4 of 4 properties, ring added |
| 33 | a | Call +254 702 188 044 | 437 | 4 of 4 properties, ring added |
| 34 | a | Email info@haoo.online | 440 | 4 of 4 properties, ring added |
| 35 | a | Send your details instead | 445 | 4 of 4 properties, ring added |
| 36 | a | Start with HAOO | 449 | 4 of 4 properties, ring added |
| 37 | a | +254 702 188 044 | 458 | 4 of 4 properties, ring added |
| 38 | a | info@haoo.online | 459 | 4 of 4 properties, ring added |
| 39 | a | How we measure this page | 460 | 4 of 4 properties, ring added |
| 40 | a | Back to ZERO-PAPER HUB | 461 | 4 of 4 properties, ring added |

Stops 37 and 38 are named by the bare phone number and the bare email address. That is how the
footer ships them, and it is the known `primary-actions.ts` P5/P6 naming gap recorded by plan 05-08.
This spec identifies stops by DOM position rather than by matching the primary-action list, so the
gap changes no count here. The names are recorded exactly as the page exposes them.

### 2.2 Mobile branch — 360, 390 and 320, 36 stops

Below the `md` breakpoint the five section links (desktop stops 3–7) are replaced by the single
navigation toggle, so the traversal is four stops shorter. Stop 3 is `button` "Open HAOO navigation"
(DOM 37). Mobile stops 4–36 are the same elements as desktop stops 8–40, at the same DOM positions
and in the same order.

### 2.3 The counts, per width

| Width | Stops | Stops whose indicator changed | Difference | Elements with tabindex > 0 | Order violations |
|-------|-------|-------------------------------|-----------|----------------------------|------------------|
| 320 × 256 | 36 | 36 | 0 | 0 | 0 |
| 360 × 740 | 36 | 36 | 0 | 0 | 0 |
| 390 × 844 | 36 | 36 | 0 | 0 | 0 |
| 768 × 1024 | 40 | 40 | 0 | 0 | 0 |
| 1280 × 1024 | 40 | 40 | 0 | 0 | 0 |
| 1440 × 900 | 40 | 40 | 0 | 0 | 0 |

The stop count and the indicated-stop count are **equal at every width**, so no stop is listed
individually below. Had they differed, every differing stop would be named here rather than reported
as a total; that is what the "unindicatedStops" array in each record exists to carry.

**The indicator is the ring, not the outline.** Every stop computes `outline-color: rgba(0, 0, 0, 0)`
after focus — Tailwind's `outline-none` — and carries its visible indicator in `box-shadow`. Stop 1
at 1280, for example, moves from `box-shadow: none` to
`rgb(255, 255, 255) 0px 0px 0px 2px, rgb(64, 84, 198) 0px 0px 0px 4px`.

This is why a non-empty indicator was required to have a **non-transparent colour** rather than
merely a non-zero width. The UI-SPEC's literal test (`outline-width > 0`) is satisfied by
`outline: 2px solid transparent`, which paints nothing. That is not hypothetical: it is exactly what
the five ZERO-PAPER HUB controls in observation KB-O1 below compute.

### 2.4 Tab order equals DOM order

Across all six widths, every stop's DOM position is strictly greater than the previous stop's:
**0 order violations**. **0** elements anywhere in the document carry a tab index greater than zero.

### 2.5 The opening sequence

| Branch | Captured stops, in order |
|--------|--------------------------|
| 768, 1280, 1440 | Skip to HAOO content → Back to ZERO-PAPER HUB → Benefits → Capabilities → Brochure → Send details → Onboarding → Chat with HAOO on WhatsApp → Call +254 702 188 044 |
| 320, 360, 390 | Skip to HAOO content → Back to ZERO-PAPER HUB → Open HAOO navigation → Chat with HAOO on WhatsApp → Call +254 702 188 044 |

Both match UI-SPEC KF-1 for their layout branch.

### 2.6 Termination and reversibility

| Reading | Value, at every width |
|---------|-----------------------|
| Last stop | DOM 461, `Back to ZERO-PAPER HUB` in the footer |
| Last link in the footer | DOM 461 — the same element |
| Tab presses to leave the document | 41 (desktop), 37 (mobile) |
| Focus left the document | yes, at every width |
| Stops reached twice before leaving (a cycle) | 0 |
| Reverse probes taken | 8 per width, plus 1 from outside the document |
| Reverse probe defects | 0 |

Each reverse probe presses Shift+Tab and then Tab, and checks that the first lands on the preceding
captured stop and the second returns to where it started. The probe from outside the document landed
on DOM 461 (the last stop) and the following Tab left again, so the exit is reversible and not a
one-way door.

**A stated narrowing.** The planner assumption below says "a reverse traversal from each stop". What
was measured on the HAOO page is a **sample**: the first stop, every fifth stop after it, and the
exit — 8 probes per width. On the Products region it is every in-region stop. The sample is spread
across the document rather than clustered, but it is a sample, and reading the assumption as full
per-stop coverage on S1 would overstate this record.

---

## 3. The script-focus destinations

`tabindex="-1"` is correct on four targets, all of them destinations the page moves focus to by
script. Two exist in the default state; two exist only in states this plan does not render.

| Destination | State measured | DOM | tabindex | Appeared in the traversal |
|-------------|----------------|-----|----------|---------------------------|
| Honeypot control | default, all six widths | 254 | -1 | no |
| Error-summary container | invalid (empty submit), 1280 | 255 | -1 | no |
| Confirmation heading | not rendered here | — | — | covered by the preview-target form-state spec (UI-SPEC KF-5, success row) |
| Failure heading | not rendered here | — | — | covered by the preview-target form-state spec (UI-SPEC KF-5, transport-failure and blocked rows) |

The invalid state was reached **by keyboard** — Tab to `Send my details`, then Enter, with every
field empty — and measured with a complete 47-stop pass from document start. Neither the honeypot
(DOM 254) nor the error-summary container (DOM 255) is among those 47 stops.

FS-0 permits this state on the live page because validation is client-side and no request is issued.
The spec additionally routed `formsubmit.co` to abort and counted the attempts: **0 attempts**. No
lead could have been delivered even if validation had regressed.

---

## 4. The skip link (KF-3)

| Width | Box before focus | Box on focus | Position | Within viewport | Hash after Enter | Next Tab landed on |
|-------|------------------|--------------|----------|-----------------|------------------|--------------------|
| 320 × 256 | 32 × 24 (`sr-only`) | 150 × 19.59 | (16, 16) → right 166, bottom 35.59 | yes | `#haoo-content` | Chat with HAOO on WhatsApp, inside `main` |
| 360 × 740 | 32 × 24 | 150 × 19.59 | (16, 16) → right 166, bottom 35.59 | yes | `#haoo-content` | Chat with HAOO on WhatsApp, inside `main` |
| 390 × 844 | 32 × 24 | 150 × 19.59 | (16, 16) → right 166, bottom 35.59 | yes | `#haoo-content` | Chat with HAOO on WhatsApp, inside `main` |
| 768 × 1024 | 32 × 24 | 150 × 19.59 | (16, 16) → right 166, bottom 35.59 | yes | `#haoo-content` | Chat with HAOO on WhatsApp, inside `main` |
| 1280 × 1024 | 32 × 24 | 150 × 19.59 | (16, 16) → right 166, bottom 35.59 | yes | `#haoo-content` | Chat with HAOO on WhatsApp, inside `main` |
| 1440 × 900 | 32 × 24 | 150 × 19.59 | (16, 16) → right 166, bottom 35.59 | yes | `#haoo-content` | Chat with HAOO on WhatsApp, inside `main` |

It is the **first** stop at every width, its `href` is `#haoo-content` (the `id` of the page's single
`main`), and the Tab after activation landed inside `main[id="haoo-content"]` and **not** back in the
header. The header is therefore bypassable from the keyboard at every supported width.

---

## 5. The brochure panel is not modal (KF-4)

| Width | Layout branch | `<object>` rendered | Focus entered the embed | Dialog semantics before / after | Overlays before / after |
|-------|---------------|---------------------|-------------------------|--------------------------------|-------------------------|
| 320 × 256 | compact image preview (below `lg`) | no | no | 0 / 0 | 0 / 0 |
| 360 × 740 | compact image preview | no | no | 0 / 0 | 0 / 0 |
| 390 × 844 | compact image preview | no | no | 0 / 0 | 0 / 0 |
| 768 × 1024 | compact image preview | no | no | 0 / 0 | 0 / 0 |
| 1280 × 1024 | embedded PDF `<object>` (`lg` and up) | yes | no | 0 / 0 | 0 / 0 |
| 1440 × 900 | embedded PDF `<object>` (`lg` and up) | yes | no | 0 / 0 | 0 / 0 |

At every width both brochure actions are ordinary sequential tab stops, reached by Tab and adjacent
in the traversal (desktop stops 18 and 19). Measured on the open action at every width:
`target="_blank"`, `rel="noopener"`, and an accessible name ending in the screen-reader disclosure
`(opens in a new tab)` — the disclosure is inside the name, not merely adjacent prose.

Activating each action by Enter left the other present, enabled and pointing at the same
destination. The open action opened a new browsing context at every width; the download action
started a download named `HAOO-Marketing-Brochure.pdf` at every width, cancelled immediately.

**No focus trap, focus return or dialog role is asserted against this panel**, because it is not
modal by design: the two controls are siblings of the embed and share no mutable state. Asserting a
trap would fail a correct component. Where focus rested after activation is recorded but not
asserted, for the same reason.

---

## 6. Observations — recorded, not asserted

Everything in this section was **measured and recorded**. None of it is asserted, and none of it
fails the run. They are separated from sections 2–5 for exactly that reason.

### KB-O1 — five ZERO-PAPER HUB controls paint no focus indicator at all

Outside the Products region, on the live ZERO-PAPER HUB home page, five controls were focused by
keyboard and computed **no visible indicator**: no `box-shadow` layer with a non-transparent colour,
and an outline of `2px solid rgba(0, 0, 0, 0)` — transparent.

| Stop | Element | Accessible name | DOM |
|------|---------|-----------------|-----|
| 15 | input | FIRST NAME | 337 |
| 16 | input | LAST NAME | 340 |
| 17 | input | EMAIL | 343 |
| 18 | input | ORGANIZATION (optional) | 347 |
| 19 | textarea | MESSAGE | 350 |

Measured at all six widths, identically. These are the same contact-form inputs as finding **F4**,
which recorded a declared ring of `green-400` computing ≈1.74:1 against white. The live runtime
reading is stronger than F4's static one: in the deployed build that ring does not paint at all, so
there is no ratio to be below the floor. A keyboard visitor filling in that form cannot see where
they are.

This sits outside `#products`, so **decision D-OQ-3** records and defers it rather than fixing it
here. **That is a scope decision, not a severity judgement.** It belongs beside F4, F4b, F5, F6 and
VP-O1 to VP-O3 in the inheritance of a future ZERO-PAPER HUB phase.

### KB-O2 — the embedded document viewer never received focus

At 1280 and 1440 the brochure `<object>` renders. Focus **never entered it**: the key sequence was
18 Tab presses from document start, and focus moved from the stop before the embed directly to the
brochure actions. Focus never came to rest inside the embed, so there was nothing to escape from.

The reason is measurable and is recorded rather than glossed: headless Chromium has no PDF plugin,
so the `<object>` has no content document (`contentType` read as "no content document") and its child
fallback — the heading `Brochure preview unavailable` — is what renders instead.

**This is neither a pass nor a failure.** It is a recorded browser-behaviour limit. The keyboard
behaviour of the browser's built-in PDF viewer, on a machine that has one, is *not evidenced by this
run in either direction*. Had focus entered and refused to leave, the spec would have recorded that
outcome with its key sequence and resting place and still not failed: the built-in viewer is not a
surface this project ships or can fix, and failing on it would make the gate un-greenable for a
cause nobody can act on. Recorded is not the same as passed.

### KB-O3 — the Products page has no main landmark and no bypass mechanism

| Reading | Value, at every width |
|---------|-----------------------|
| `main` landmarks (`main`, `[role="main"]`) on the page | 0 |
| Skip / bypass links | 0 |
| First stop in the document | `ZERO-PAPER HUB home` |
| Stops a keyboard visitor passes before reaching the Products region | **4** at 320, 360 and 390 (the region's stop is 5 of 20 in the document); **10** at 768, 1280 and 1440 (stop 11 of 26) |

A keyboard visitor heading for the Products section traverses the whole header and hero with no way
to skip it — WCAG 2.4.1 (Bypass Blocks). This is finding **F5**, confirmed live rather than
rediscovered, and it is **deferred by D-OQ-3**, not asserted here.

### What was asserted inside the Products region

For contrast with the above, the in-scope readings on S3 at every width:

| Reading | Value |
|---------|-------|
| Stops inside `#products` | 1 |
| Of those, painting an indicator | 1 |
| The stop | `a` "Explore HAOO" → `https://www.haoo.online/` (DOM 235) |
| Elements with tabindex > 0 inside the region | 0 |
| Order violations touching the region | 0 |
| Reverse probes inside the region | 1 per width, 0 defects |

One note on the boundary: Shift+Tab from `Explore HAOO` lands on `Learn More` (DOM 68), which is
*outside* the region. Reversibility at the region's edge necessarily crosses into content D-OQ-3 puts
out of scope. The landing was measured and is recorded; no claim about that element's quality is
made here.

---

## 7. Planner assumptions carried by plan 05-09, restated verbatim

> - **QUAL-02 / unclassified probe edge (unresolved).** The edge probe could not classify QUAL-02 and
>   flagged it for manual review. Reviewed here: QUAL-02's shape is an *interaction-sequence* claim over
>   a live DOM, which no data-shape taxonomy covers. The planner's assumption is that a forward
>   traversal from document start to document exit, plus a reverse traversal from each stop, is a
>   sufficient sample of "navigable by keyboard" — no assertion is made about traversal after arbitrary
>   interleaved mouse input, nor about assistive-technology virtual-cursor navigation, which no
>   automated harness in this stack can observe.

> - **Focus-order coverage on the Products region.** The Products region is a section of a page with no
>   main landmark and no skip link. That is a recorded, deferred ZERO-PAPER HUB finding. The traversal
>   assertions here therefore start at the Products region container on that surface rather than at the
>   document start, and the absence of a bypass mechanism on that page is recorded as an observation,
>   not asserted as a failure.

Both held as written, with the one narrowing named in §2.6: reverse traversal on the HAOO page was
sampled at 8 stops per width plus the exit, not taken from every stop.

---

*Plan: 05-09 · Phase: 05-prove-the-deployed-journey · Measured: 2026-09-12*
