# 05 Evidence — Semantic Structure (QUAL-03)

**Instrument:** `e2e/semantics.e2e.ts`, `npx playwright test --project=live`, Chromium
(Playwright 1.63.0, `devices['Desktop Chrome']`).
**Subjects:** S1 `https://www.haoo.online/`, S3 `https://www.zero-paperhub.com/#products`.
**Measured:** 2026-09-12, in two rounds against two different deployed bundles.
**Round 1 (09:46–09:53 UTC):** `origin/main` at `f957fd9`; every reading below is from this
round unless a row says otherwise.
**Round 2 (10:13 UTC, re-measurement of § 5 only):** `origin/main` at `c39cc5a`, served as
`/assets/haoo-D1dl6F2P.js`. Round 2 exists because the deploy that closes finding F1-LIVE
landed between the rounds; § 5.1 records both readings.
**Raw records:** `evidence/semantics-headings.json`, `evidence/semantics-landmarks.json`,
`evidence/semantics-regions.json`, `evidence/semantics-products-region.json`,
`evidence/semantics-accessible-names.json`, `evidence/semantics-destinations.json`,
`evidence/semantics-brochure-equivalence.json`.

This file records measured values. It follows
`04.2-VERIFICATION.md` § Human Verification Outcome: the readings are written down, including the
zeros, rather than collapsed into a pass mark. A zero here is a measurement — `0` icons exposed to
the accessibility tree and `0` navigation landmarks at 390 px closed are two of the most useful
readings below, and neither survives being summarised as "fine".

---

## 1. Heading order — who owns this check, and why it is not the engine's

`heading-order` is a `best-practice`-tagged axe rule. `AXE_TAGS` (`e2e/fixtures/axe.ts`) is the
five-tag WCAG conformance set and excludes `best-practice`, so the engine never ran the rule —
measured, not assumed: `05-EVIDENCE-HARNESS.md` §3 records `headingOrderRan: false`. It cannot be
re-added, because `withTags`, `withRules` and `options` each overwrite `runOnly` wholesale:

| Builder chain | rules run | tags run |
|---|---|---|
| `.withTags([5 WCAG tags]).withRules(['heading-order'])` | 1 | 2 |
| `.withRules(['heading-order']).withTags([5 WCAG tags])` | 29 | 69 |

**05-07's accessibility baseline therefore did not measure heading order at all.** This file's DOM
walk is the load-bearing check, and the engine result is corroboration at best.

**The signal that the corroboration has silently stopped:** an axe result reporting no
`heading-order` outcome anywhere — not in `violations`, not in `passes`, not in `incomplete` —
across every surface and every state. That reading is what you get when the rule is not running,
and it is indistinguishable from "nothing wrong".

### 1.1 State: default (S1, 1280 × 1024)

Literal ordered sequence as captured, in document order:

```
h1 Run the business—not the paperwork.
h2 Get help choosing
h2 Ready to begin?
h2 Who HAOO supports
h2 Benefits
h3 The paperwork problem
h3 Less chasing. More control.
h2 Capabilities
h3 Rent & payments
h3 Properties & units
h3 Leases & screening
h3 Maintenance
h3 Vacancy marketplace
h3 Reports & communication
h2 Rental journey
h3 Fill vacancies with confidence
h3 Move in with clarity
h3 Make every month easier
h3 Grow with visibility
h2 Get help choosing
h2 Ready to begin?
h2 Brochure
h3 Brochure preview unavailable
h2 Send your details
h2 Get help choosing
h2 Ready to begin?
```

| Reading | Value |
|---|---|
| headings captured | 26 |
| top-level (`h1`) headings | 1 |
| deepest level present | 3 |
| largest forward step between consecutive levels | +1 |
| skipped-level pairs | 0 (`none observed`) |

`Get help choosing` and `Ready to begin?` each occur 3 times — one `OnboardingChoices` placement
each at opening, mid-page and closing. Repetition is correct; it is one component rendered three
times.

### 1.2 State: error summary (S1, 1280 × 1024, empty required submit)

Driven by activating `Send my details` with every required field empty. The form carries
`noValidate` and validates in the browser, so **no request left the page** and no lead was
delivered — this state is reachable live without the FS-0 restriction that confines completed
submissions to the preview target.

Sequence as captured — identical to §1.1 with one insertion, shown in place:

```
…
h2 Send your details
h3 There is a problem          <- inserted by this state
h2 Get help choosing
h2 Ready to begin?
```

| Reading | Value |
|---|---|
| `There is a problem` elements | 1 |
| its heading level | 3 |
| top-level (`h1`) headings | 1 |
| skipped-level pairs | 0 (`none observed`) |

### 1.3 State: artifact route aborted (S1, 1280 × 1024, `**/*.pdf` aborted)

Sequence as captured — identical to §1.1, including `h3 Brochure preview unavailable`.

| Reading | Value |
|---|---|
| `Brochure preview unavailable` elements | 1 |
| its heading level | 3 |
| exposed in the accessibility tree | 1 |
| top-level (`h1`) headings | 1 |
| skipped-level pairs | 0 (`none observed`) |

**Observation carried forward.** The `<object>` child fallback heading is present in the DOM in
*every* state, because fallback content is parsed whether or not the embed succeeds. Its exposure
to the accessibility tree is what varies — and in headless Chromium, which ships no PDF plug-in,
it is exposed in the default state too (measured: `1` in both §1.1's DOM walk and §1.3's
accessibility-tree count). A reader comparing a headless run against a desktop browser with a PDF
viewer should expect that one difference. This is why §1.3's fallback assertion reads the
accessibility tree and §1.1's level walk reads the DOM.

### 1.4 States captured elsewhere

Two conditional headings are **not** measured in this file, and are named here so the coverage is
legible rather than silently partial:

| Heading | Level | Owner | Why not here |
|---|---|---|---|
| `Your details are on their way` | 3 | plan 05-12, on S5 | Reachable only after a COMPLETED submission. UI-SPEC § Form State Coverage FS-0 confines completed-submission states to the preview target — driving one against live production would deliver a real lead |
| `We couldn't send your details` | 3 | plan 05-12, on S5 | Same |

Both are asserted **absent** from the live default state, so a leak of either onto production is a
failing run rather than an unnoticed one. Measured: `0` occurrences of each.

---

## 2. Landmark inventory

### 2.1 S1 — `https://www.haoo.online/`

| Landmark | Count at 1280 px |
|---|---|
| `banner` | 1 |
| `main` | 1 |
| `contentinfo` | 1 |
| `navigation` | 1 |

Navigation names, captured per state:

| State | `navigation` count | names captured |
|---|---|---|
| 1280 × 1024 | 1 | `HAOO sections` |
| 390 × 844, menu closed | 0 | — |
| 390 × 844, menu open | 1 | `HAOO mobile sections` |
| union across the three states | 2 distinct | `HAOO sections`, `HAOO mobile sections` |

**MEASURED CORRECTION to `05-UI-SPEC.md` § SS-2.** The contract requires "two `navigation`
landmarks, each with a distinct accessible name". The page exposes **at most one at a time**, and
structurally cannot expose both: the desktop nav is `hidden … md:flex` (`ProductHeader.tsx:41`) so
it is `display: none` below `md`, and the mobile nav carries the `hidden` **attribute** until the
toggle is pressed and `md:hidden` above it (`ProductHeader.tsx:64`). A spec asserting two
simultaneous navigation landmarks would fail a correct page. What is asserted instead: the union
across the three states is exactly these two names, they are distinct, and no single state exposes
more than one.

### 2.2 S3 — `https://www.zero-paperhub.com/#products`

| Reading | Value |
|---|---|
| Products section `id` | `products` |
| `aria-labelledby` | `products-heading` |
| resolved label text | `Products` |
| `region` named `Products` | 1 |
| `Products` navigation entries | 2, both `href="#products"` |

---

## 3. Region inventory (S1, 1280 × 1024)

Captured list beside the closed expected list, in document order, so the two can be compared
directly:

| # | Captured | Expected |
|---|---|---|
| 1 | `Opening onboarding choices` | `Opening onboarding choices` |
| 2 | `Who HAOO supports` | `Who HAOO supports` |
| 3 | `Benefits` | `Benefits` |
| 4 | `Capabilities` | `Capabilities` |
| 5 | `Rental journey` | `Rental journey` |
| 6 | `Mid-page onboarding choices` | `Mid-page onboarding choices` |
| 7 | `Brochure` | `Brochure` |
| 8 | `Send your details` | `Send your details` |
| 9 | `Onboarding` | `Onboarding` |
| 10 | `Closing onboarding choices` | `Closing onboarding choices` |

| Reading | Value |
|---|---|
| captured region count | 10 |
| expected region count | 10 |
| captured entries absent from the expected list | 0 |
| expected entries absent from the captured list | 0 |

**MEASURED CORRECTION to `05-UI-SPEC.md` § SS-2, which lists nine.** The row the contract omits is
`Who HAOO supports`: the audiences section (`src/pages/ProductPage.tsx:141`) is labelled by
`aria-labelledby="audiences-heading"` rather than `aria-label`, which makes it a labelled region
exactly like the other nine. A spec asserting the contract's nine would fail a correct page.

`src/test/haoo-page.test.tsx:47` pins a **five-name subset** (`Benefits`, `Capabilities`,
`Rental journey`, `Brochure`, `Onboarding`), filtered rather than exhaustive. The spec asserts
that subset is an ordered subsequence of the ten above, so the jsdom suite and the live spec
cannot drift into pinning different sets.

---

## 4. Accessible names (S1, 1280 × 1024)

| Reading | Value |
|---|---|
| links, buttons and form controls traversed | 47 |
| controls with an empty accessible name | 0 |
| icon elements (`<svg>`) on the page | 21 |
| icon elements exposed to the accessibility tree | 0 |
| controls whose only content is an icon | 0 |
| `<img>` elements missing an `alt` attribute | 0 |
| `<img>` elements with a non-empty `alt` | 2 |
| `<img>` elements marked decorative (`alt=""`) | 1 |
| `<object>` embed `aria-label` | `HAOO brochure preview` |

The decorative-icon rule is recorded as a **negative**, and both halves are needed: `0` of `21`
icons reach the accessibility tree, *and* `0` controls are left whose only content is an icon.
Hiding the icons without naming the icon-only control would leave a nameless button; naming it
without hiding them would leave icon content inside the name.

### 4.1 Controls in the DOM but not exposed at 1280 px

`8` of the `47`. The DOM traversal is a strict superset of the accessibility-tree traversal at any
one width, by design rather than by defect:

| Name | Why it is not exposed here |
|---|---|
| `Benefits`, `Capabilities`, `Brochure`, `Send details`, `Onboarding` | the mobile navigation's copies; the `hidden` attribute is set until the toggle is pressed |
| `Open HAOO navigation` | the toggle is `md:hidden` |
| `Leave this field blank` | the anti-spam honeypot, inside an `aria-hidden="true"` wrapper with `tabIndex={-1}` |
| `Clear what this page remembers` | inside the measurement `<details>`, which ships collapsed |

Each still carries a non-empty accessible name — the `0 unnamed controls` reading above covers
every control in the document, exposed or not.

### 4.2 Label and description resolution

| Reading | Value |
|---|---|
| form controls named by a resolving `<label for>` | 11 of 11 |
| controls carrying `aria-describedby` in the default state | 1 |
| controls carrying `aria-describedby` in the error state | 8 |
| description references that do not resolve | 0 |

Description references captured in the error state:
`haoo-qualify-name-error`, `haoo-qualify-email-error`, `haoo-qualify-preferredChannel-error`,
`haoo-qualify-role-error`, `haoo-qualify-portfolioBand-error`, `haoo-qualify-county-error`,
`haoo-qualify-timeframe-error`, `haoo-qualify-collection-note`.

No shipped field carries help text, so `aria-describedby` is nearly absent in the default state.
It is therefore asserted in the error state — the state that renders one.

---

## 5. Name-to-destination table (S1, 1280 × 1024)

One row per link whose accessible name **names** a destination — a phone number, an email address,
a host, or another site. Destinations are compared as **resolved URL strings**, never as raw
attribute values.

| Accessible name | Rule | Promised destination | Resolved destination | Instances |
|---|---|---|---|---|
| `Call +254 702 188 044` | D1 phone number | `tel:+254702188044` | `tel:+254702188044` | 3 |
| `+254 702 188 044` (footer) | D1 phone number | `tel:+254702188044` | `tel:+254702188044` | 1 |
| `Email info@haoo.online` | D2 email address | `mailto:info@haoo.online` | `mailto:info@haoo.online` | 3 |
| `info@haoo.online` (footer) | D2 email address | `mailto:info@haoo.online` | `mailto:info@haoo.online` | 1 |
| `Chat with HAOO on WhatsApp` | D3 host | host `wa.me` | `https://wa.me/254702188044?text=Hello%20HAOO%2C%20I%20would%20like%20help%20choosing%20the%20best%20way%20to%20get%20started.` | 3 |
| `Back to ZERO-PAPER HUB` (header) | D4 another site | `https://www.zero-paperhub.com/` | round 1 `https://www.haoo.online/` → round 2 `https://www.zero-paperhub.com/` | 1 |
| `Back to ZERO-PAPER HUB` (footer) | D4 another site | `https://www.zero-paperhub.com/` | round 1 `https://www.haoo.online/` → round 2 `https://www.zero-paperhub.com/` | 1 |

| Reading | Value |
|---|---|
| links traversed | 33 |
| distinct accessible names among them | 17 |
| names matching a promise rule | 6 |
| names with more than one resolved destination | 0 |
| destination-naming links whose resolved destination ≠ its promise, round 1 | 2 |
| destination-naming links whose resolved destination ≠ its promise, round 2 | 0 |

Repeated identical names are asserted to share **one** destination rather than asserted unique.
Duplication is correct on this page — P4 through P8 render three times each — and a uniqueness
assertion would fail a correct page. Divergence is the defect.

### 5.1 FINDING F1-LIVE — CLOSED by deployment, 2026-09-12. The two parent-site links

**Round 1 reading (deployed bundle `f957fd9`).** Both `Back to ZERO-PAPER HUB` links on the live
page promised the parent site and resolved to the HAOO page the visitor was already on.

| Reading | Value |
|---|---|
| raw `href` served | `/` |
| resolved destination | `https://www.haoo.online/` |
| promised destination | `https://www.zero-paperhub.com/` |
| instances | 2 (header, footer) |
| distinct resolved destinations across the 2 instances | 1 |
| fix commit | `d8f4bea` — `fix(05-04): point both parent-site links at the parent site` |
| `git merge-base --is-ancestor d8f4bea HEAD` | ancestor |
| `git merge-base --is-ancestor d8f4bea f957fd9` | not an ancestor |
| local `main` ahead of `origin/main` by | 32 commits |
| deployed bundle | `origin/main` at `f957fd9`, which predates `d8f4bea` |
| raw record | `evidence/semantics-destinations.json`, entries `2026-09-12T09:46:58.409Z` .. `09:53:55.351Z` |

`05-04-SUMMARY.md` states that "any wave-4 spec asserting SS-3 … will now measure the corrected
destination". That was true of the **source** and false of the **deployed page**, and the deployed
page is this phase's subject. The fix had never been pushed, so GitHub Pages had never built it.

**Nothing cheaper than this rule could have caught it.** `/` on the HAOO host returns `200` and
renders a valid page, so a status-code sweep, a broken-link crawler and the axe conformance run all
saw a healthy link. Only comparing a link's promise against its destination surfaces this class of
defect. That is threat `T-05-43`, rated `high`.

#### The deploy that closed it

The divergence was a deploy lag, not a source defect, so closing it needed a push — an owner
decision this phase's specs deliberately did not take. **The owner gave explicit authorisation, and
the orchestrator (not this spec, and not an automatic step) ran `git push origin main` on that
authorisation.**

| Reading | Value |
|---|---|
| `origin/main` before the push | `f957fd9` |
| `origin/main` after the push | `c39cc5a` |
| commits transferred | 37 |
| `git merge-base --is-ancestor d8f4bea origin/main` afterwards | ancestor |
| workflow | `Deploy HAOO`, run `34687312104` |
| run URL | `https://github.com/KaruguDev/HAOO/actions/runs/34687312104` |
| run head SHA | `c39cc5a26704e8a8b37809a294d5e6d2b118206e` |
| run status / conclusion | `completed` / `success` |
| run created / updated (UTC) | `2026-09-12T10:00:38Z` / `2026-09-12T10:01:45Z`, 1 m 07 s |

#### Round 2 reading (deployed bundle `c39cc5a`), re-measured independently

Re-measured after the deploy rather than inferred from it. Two independent instruments, and the
HTML root is not one of them — the `href` lives in the JavaScript bundle, so a grep of
`https://www.haoo.online/` returns nothing either before or after the fix.

| Reading | Value |
|---|---|
| measurement time (UTC) | `2026-09-12T10:12:26Z` (transport) / `10:13:00`, `10:13:04`, `10:13:08` (DOM) |
| bundle served by `https://www.haoo.online/` | `/assets/haoo-D1dl6F2P.js` |
| bundle transfer size | 207 685 bytes, HTTP `200` |
| bundle SHA-256 | `d607c149ca785c58c5f26183852367aa52badcb02ee8bbad93e0daf136f6b508` |
| occurrences of `https://www.zero-paperhub.com/` in that bundle | 2 |
| `<a>` elements in that bundle whose child text is `Back to ZERO-PAPER HUB` | 2, each carrying `href:"https://www.zero-paperhub.com/"` |
| resolved destination in the rendered DOM (Chromium) | `https://www.zero-paperhub.com/` |
| instances measured in the DOM | 2 (header, footer) |
| distinct resolved destinations across the 2 instances | 1 |
| independent DOM measurements agreeing on that value | 3 of 3 (attempt plus two retries) |
| raw record | `evidence/semantics-destinations.json`, entries `2026-09-12T10:13:00.496Z`, `10:13:04.995Z`, `10:13:08.139Z` |

#### The accommodation did not outlive the defect

The spec had registered the divergence in a one-entry `DEPLOY_LAG` list that asserted the
**deployed** value, so that a landed deploy would break it and the break's message would instruct
its own deletion. That is what happened, measured before any edit was made:

```
Error: F1-LIVE: "Back to ZERO-PAPER HUB" still serves the pre-d8f4bea destination. If this
failed because it now resolves to https://www.zero-paperhub.com/, the deploy has landed —
DELETE the DEPLOY_LAG entry so rule D4 covers this link unconditionally.

  Expected: "https://www.haoo.online/"
  Received: "https://www.zero-paperhub.com/"
```

The entry, the `if (lag === undefined)` branch that consumed it, the `registeredDeployLag` field in
the evidence record, and the instance-count loop that validated the entry's own claim were all
deleted rather than widened — no empty list and no dead scaffolding remain, and `DEPLOY_LAG`
appears nowhere in `e2e/semantics.e2e.ts`. Promise rule D4 now covers both links with no exception
anywhere in the file. The live count of 2 instances stays recorded in the evidence table above, and
the source-level count is pinned independently at `src/test/haoo-page.test.tsx:403`.

| Reading | Value |
|---|---|
| `e2e/semantics.e2e.ts` before / after | 61 581 / 58 138 bytes |
| `DEPLOY_LAG` occurrences in `e2e/semantics.e2e.ts` | 4 before, 0 after |
| destination-naming links covered by D4 unconditionally | 2 of 2 |
| `npx playwright test --project=live e2e/semantics.e2e.ts` | 12 tests executed, 12 completed with no assertion break, 32.6 s, 0 retries consumed |
| raw record of the post-deletion run | `evidence/semantics-destinations.json`, entry `2026-09-12T10:14:44.822Z` — the first with no `registeredDeployLag` field, measuring `https://www.zero-paperhub.com/` |

---

## 6. The brochure HTML equivalent

### 6.1 Content, artifact reachable

| Reading | Found | Expected |
|---|---|---|
| capability cards | 6 | 6 |
| journey steps | 4 | 4 |
| **equivalent content items** | **10** | **10** |

Capability titles captured, in document order: `Rent & payments`, `Properties & units`,
`Leases & screening`, `Maintenance`, `Vacancy marketplace`, `Reports & communication`.
Journey titles captured, in document order: `Fill vacancies with confidence`,
`Move in with clarity`, `Make every month easier`, `Grow with visibility`.

Each title is an `<h3>` and each description is text in the same `<li>`; both lists are compared
as ordered `[title, description]` pairs, so a reordering fails as loudly as a dropped item.

**MEASURED CORRECTION to `05-UI-SPEC.md` § SS-4**, which reads "10 capability titles" and
"Count equality, not just presence: 10 of 10". The shipped product carries **six** capabilities —
already pinned at `src/test/haoo-page.test.tsx:102` (`toHaveLength(6)`) and enumerated in
`src/test/haoo-content.test.ts` — and **four** journey steps. The contract's ten is the size of the
**whole equivalent**, which is what SS-4 assertions 1 and 2 cover together. A spec asserting ten
capability cards would fail a correct page. Count equality is asserted against each list
individually **and** against the total of 10, so a silently dropped item fails either way.

### 6.2 Content, artifact route aborted (`**/*.pdf` aborted)

| Reading | Found | Expected |
|---|---|---|
| capability cards | 6 | 6 |
| journey steps | 4 | 4 |
| equivalent content items | 10 | 10 |
| `Brochure preview unavailable` heading | 1 | 1 |
| fallback body copy | 1 | 1 |
| `Open brochure (opens in a new tab)` | 1, visible, enabled | 1 |
| `Download brochure` | 1, visible, enabled | 1 |

The equivalent does not depend on the artifact it is the equivalent **of**, and the recovery copy
never replaces the controls. This is the mitigation for threat `T-05-45`.

### 6.3 The three references, resolved and compared to one another

| Reference | Raw value served | Resolved destination |
|---|---|---|
| `<link rel="alternate" type="application/pdf">` in `<head>` | `/brochure/HAOO-Marketing-Brochure.pdf` | `https://www.haoo.online/brochure/HAOO-Marketing-Brochure.pdf` |
| `Open brochure` action | `/brochure/HAOO-Marketing-Brochure.pdf` | `https://www.haoo.online/brochure/HAOO-Marketing-Brochure.pdf` |
| `Download brochure` action | `/brochure/HAOO-Marketing-Brochure.pdf` | `https://www.haoo.online/brochure/HAOO-Marketing-Brochure.pdf` |

| Reading | Value |
|---|---|
| references found | 3 of 3 |
| distinct resolved destinations | 1 |
| destination carried by primary actions P1/P2, resolved | `https://www.haoo.online/brochure/HAOO-Marketing-Brochure.pdf` |

The three are asserted equal **to one another**, not each against a literal, and the shared target
is then checked against the path the closed primary-action list carries — the same discipline
`build-output.test.ts` applies to S4, and the mitigation for threat `T-05-46`. Resolved
destinations are used throughout: the head-level pointer ships relative, so a raw string
comparison would be comparing the page's authoring style rather than its target.

---

## 7. Observations — measured, recorded, not asserted

Clearly separated from everything above. Nothing in this section turns a run red.

| ID | Surface | Reading | Measured value | Disposition |
|---|---|---|---|---|
| F5 | S3 `https://www.zero-paperhub.com/#products` | `main` landmark count | **0** | **Deferred by decision D-OQ-3** — ZERO-PAPER HUB evidence stops at the Products section. A **scope** decision, not a severity judgement: asserting it would expand a proving phase into a remediation phase in a repository D-03 says receives code commits only when the evidence forces them |

The measured value is written into `evidence/semantics-products-region.json` alongside the
asserted Products-region readings, so a later reader can see that the question was asked and what
the answer was.

**Related, and not owned here:** 05-07 handed forward **R-1**, `bypass` rated `serious` on the S4
retired-path page. This spec does not touch S4 and records no reading for it; plan **05-14** owns
that decision.

---

## 8. Planner assumptions carried by plan 05-10, restated verbatim

Reproduced from `05-10-PLAN.md` § "Planner assumptions carried forward" so the limits of this
evidence are visible in the evidence rather than only in the plan.

> - **QUAL-03 / empty probe edge — "What is the result for empty, single-element, or null input?"
>   (unresolved).** Reviewed here and partially resolved by assertion: the empty case that matters for
>   QUAL-03 is the brochure artifact being unavailable, and that case *is* asserted (task 2, the aborted
>   artifact route). The cases that remain assumptions: a product whose capability list is empty and a
>   product whose journey list is empty are unreachable at run time because every remaining product
>   member is required and a partially-populated product fails the type gate rather than reaching a
>   runtime state. The planner carries that as an assumption rather than an assertion — no live surface
>   can exhibit it.
>
> - **QUAL-03 / encoding probe edge — "Whose definition of length/equality applies — bytes, code points,
>   grapheme clusters, or normalized form?" (unresolved).** Reviewed here and answered as a stated
>   convention rather than left open: this spec compares **resolved URL strings** for destinations
>   (never raw attribute strings, because one of the three brochure references is relative on the live
>   page), and compares **accessible-name strings as the accessibility tree exposes them**, with no
>   normalisation applied on either side. Counts — the ten capability titles, the journey steps, the
>   region list — are compared as **element counts**, not string lengths. The one place a percent-encoded
>   form is compared is the messaging action's starter text, which plan 05-11 decodes before comparing
>   to the compile-time constant. No grapheme-cluster or Unicode-normalisation equality is performed
>   anywhere, and the planner carries the assumption that the shipped copy contains no character
>   sequence where normalised and unnormalised forms would differ.

**One transcription limit of this spec, stated rather than hidden.** `e2e/semantics.e2e.ts`
transcribes the capability and journey ledger from `src/test/haoo-content.test.ts` instead of
importing it, because `src/products/haoo.ts` reads `import.meta.env` at module scope and is
`undefined` outside Vite — a Playwright spec importing it throws before a single test runs. The
vitest suite owns those lists; a divergence between the two files is a defect in the spec, not in
the page.

**One parser limit, guarded rather than assumed.** Role and accessible-name inventories are read
from Playwright's own aria snapshot, so the names above are the **engine's** computation and not a
re-implementation of the accessible-name algorithm. The snapshot parser would truncate a name
containing a double quote; no name on either surface contains one, and the spec asserts that
directly, so the limit becomes a failing run rather than a silently short name if it ever changes.
