# 05 Evidence — Recovery Surfaces (LEAD-07, QUAL-03)

**Instrument:** `e2e/recovery.e2e.ts`, `npx playwright test --project=live`, Chromium
(Playwright 1.63.0, `devices['Desktop Chrome']`), viewport 1280 × 1024.
**Subjects:** S1 `https://www.haoo.online/` (scripted), S2 `https://www.haoo.online/` with
`javaScriptEnabled: false`, S4 `https://www.zero-paperhub.com/products/haoo/`, plus two out-of-band
HTTP probes.
**Measured:** 2026-09-12, 10:36–10:37 UTC, against the POST-DEPLOY build. `origin/main` at
`c39cc5a`, served as `/assets/haoo-D1dl6F2P.js`. This is a different build from the one plans
05-07, 05-08 and 05-09 measured (`f957fd9`); no figure below may be compared with a figure from
those plans without naming both builds.
**Raw records:** `evidence/recovery-scriptless.json`, `evidence/recovery-destinations.json`,
`evidence/recovery-retired-path.json`, `evidence/recovery-reachability.json`,
`evidence/recovery-analytics-blocked.json`.

This file records measured values, including the zeros, rather than collapsing them into a pass
mark — the discipline `04.2-VERIFICATION.md` § Human Verification Outcome established and
`e2e/fixtures/evidence.ts` enforces at the writer. Three of the most useful readings here are zeros:
`0` authored scripts on the retired-path document, `0` requests issued to the scheme-only
destinations, and `0` analytics requests attempted during a page load.

---

## 0. The two verdicts this file keeps apart

Every row below carries one of two dispositions, and they are **different claims about different
owners**. They are never merged, and a reader who merges them has lost the only thing this file was
careful about.

| Verdict | What it means | What it does to the run |
|---|---|---|
| **contract failure** | A link is missing, malformed, or points at the wrong target. This project's markup is wrong. | **Fails the run.** |
| **recorded observation** | Something outside this project's markup was measured — a third-party host's status, an edge-injected script. | **Does not fail the run.** It is written down with its measured value and its time. |

`recorded` is neither `passed` nor `failed`. It is the same disposition KF-4 gives the brochure
panel's embedded-viewer limit.

And one further distinction, on the reachability rows:

| Disposition | What was proven |
|---|---|
| `reachable` | An HTTP request was issued and a status came back. The status is recorded verbatim. |
| `validated, not fetched` | The destination's **scheme and form** were compared literally against the shipped form. **No request was issued.** Nothing was proven to deliver. |

---

## 1. Destinations table

One row per destination, with the surfaces it was found on, the exact shipped form measured, and its
disposition.

| # | Destination as found (verbatim) | Found on | Disposition | Status | Redirect target |
|---|---|---|---|---|---|
| 1 | `https://wa.me/254702188044?text=Hello%20HAOO%2C%20I%20would%20like%20help%20choosing%20the%20best%20way%20to%20get%20started.` | S1, S2 (both sections) | **validated, not fetched** | — no request issued — | — |
| 2 | `tel:+254702188044` | S1 (incl. footer), S2 (both sections) | **validated, not fetched** | — no request issued — | — |
| 3 | `mailto:info@haoo.online` | S1 (incl. footer), S2 (both sections) | **validated, not fetched** | — no request issued — | — |
| 4 | `https://manage.haoo.online/` | S1, S2 | **reachable** | `200` | no `Location` header |
| 5 | `/brochure/HAOO-Marketing-Brochure.pdf` | S1 (P1, P2), S2 | **reachable** (probed at `https://www.haoo.online/brochure/HAOO-Marketing-Brochure.pdf`) | `200`, `content-type: application/pdf` | no `Location` header |
| 6 | `https://www.haoo.online/` | S4 (R2, canonical, refresh target) | **reachable** — proven by navigation, § 3 | — see § 3 — | — |
| 7 | `https://www.haoo.online/brochure/HAOO-Marketing-Brochure.pdf` | S4 (R3) | same artifact as row 5 | `200`, `application/pdf` | no `Location` header |

**Probe method for rows 4, 5 and 7.** `GET` through Playwright's `APIRequestContext`, **not** a
navigation, with `maxRedirects: 0` and `failOnStatusCode: false`, timeout 20 s. Redirects are not
followed and the status is data, not a verdict — so a `3xx` into a different flow would appear here
as a recorded `Location` rather than being absorbed by a "non-error" reading (T-05-50). Neither
probe returned a `3xx`; both returned `200` with no `Location` header, and that absence is itself
the measurement.

**Why rows 1–3 are not fetched.** A `tel:` dialled places a call, a `mailto:` resolved sends mail,
and `https://wa.me/…?text=…` reaches a third-party messaging system — on **every re-run, for the
rest of the project's life**. They are validated by literal equality against the shipped form on
both S1 and S2, and the record says `validated, not fetched`, never `reachable`. `requestsIssued: 0`
is recorded in `evidence/recovery-reachability.json` as a number, so the claim is checkable rather
than merely asserted (T-05-53).

**Wall-clock timings of the two probes** (`evidence/recovery-reachability.json`):

| Target | Attempted at (UTC) | Elapsed |
|---|---|---|
| `https://manage.haoo.online/` | `2026-09-12T10:36:54.117Z` | 1350 ms |
| `https://www.haoo.online/brochure/HAOO-Marketing-Brochure.pdf` | `2026-09-12T10:36:55.510Z` | 901 ms |

---

## 2. The scriptless recovery DOM (S2)

Read in its **own browser context** with `javaScriptEnabled: false`. S2 is a different DOM, not a
state of S1: the React tree never renders and the parser exposes the `<noscript>` subtree of
`index.html`.

### 2.1 Counts

| Reading | Value |
|---|---|
| Anchors, both sections | **8** |
| Anchors in `HAOO onboarding without JavaScript` | **5** |
| Anchors in `HAOO qualification form recovery` | **3** |
| **Distinct destinations** | **5** |

**The contract is the set of five, and the count of eight is recorded rather than asserted.**
RESEARCH Pitfall 7 measured this shape; `05-UI-SPEC.md` P13 reads "the five `noscript` recovery
links, 1 each" and a length assertion at five fails a correct page. The spec contains no anchor-count
assertion, and the plan's verification grep enforces that.

### 2.2 The two labelled sections, anchor by anchor

`HAOO onboarding without JavaScript` — five anchors, five destinations:

| Visible text | Destination |
|---|---|
| `Chat with HAOO on WhatsApp` | `https://wa.me/254702188044?text=Hello%20HAOO%2C%20I%20would%20like%20help%20choosing%20the%20best%20way%20to%20get%20started.` |
| `Call +254 702 188 044` | `tel:+254702188044` |
| `Email info@haoo.online` | `mailto:info@haoo.online` |
| `Start with HAOO` | `https://manage.haoo.online/` |
| `Open the HAOO brochure` | `/brochure/HAOO-Marketing-Brochure.pdf` |

`HAOO qualification form recovery` — three anchors, **different names, same destinations**:

| Visible text | Destination | Counterpart above |
|---|---|---|
| `Message HAOO on WhatsApp instead` | `https://wa.me/254702188044?text=…` | `Chat with HAOO on WhatsApp` |
| `Call HAOO on +254 702 188 044 instead` | `tel:+254702188044` | `Call +254 702 188 044` |
| `Email HAOO at info@haoo.online instead` | `mailto:info@haoo.online` | `Email info@haoo.online` |

This is the **inverse** of the P4–P8 duplicate-name rule and it is correct here. The spec asserts
both halves: the three destinations equal their counterparts, **and** the three names differ from
them — so the repetition stays deliberate rather than becoming a place a wrong destination could
hide.

### 2.3 Heading order, captured

```
h1 Choose how to start with HAOO
h2 This form needs JavaScript
```

Levels `[1, 2]`. One top-level heading, no skipped step, nothing deeper.

### 2.4 Well-formedness, asserted as literal equality

| Row | Shipped form asserted | Extra assertion, and why |
|---|---|---|
| telephone | `tel:+254702188044` | no whitespace, parentheses, dots or dashes — E.164 exactly |
| mailbox | `mailto:info@haoo.online` | must not contain `www.` — a **mailbox**, not a host |
| self-onboarding | `https://manage.haoo.online/` | must not contain `www.` — a **separate host** |
| messaging | host + number `https://wa.me/254702188044`, `?text=` **decoded** | decoded text compared byte for byte with the compile-time constant |

Decoded starter text measured on both surfaces:
`Hello HAOO, I would like help choosing the best way to get started.` — byte-identical to
`WHATSAPP_STARTER_TEXT` (`src/products/haoo.ts:358`, pinned at `src/test/haoo-content.test.ts:34`).

A pattern such as `/^tel:\+\d+$/` was deliberately **not** used. It passes for
`tel:+254702188045`, and a wrong number is exactly the defect the row exists to catch.

---

## 3. The retired-path recovery document (S4)

Read three times. **Each reading is recorded under its own mode marker and they are never merged.**

### 3.1 As served — structure

Mode: `as-served (refresh destination aborted, byte-unmodified document)`, scripting disabled.
The refresh destination `https://www.haoo.online/` was aborted at the network layer so the refresh
fired, failed, and left the served document in the browser. **This is not a modified-page
measurement**; the bytes are unaltered.

| Reading | Value |
|---|---|
| `<meta http-equiv="refresh" content>` | `0; url=https://www.haoo.online/` |
| **Refresh delay, as a number** | **`0`** |
| Canonical `href` | `https://www.haoo.online/` |
| Robots directive | `noindex, follow` |
| Visible forward-link `href` | `https://www.haoo.online/` |
| Script elements in the document | **`2`** |
| **Script elements this project authored** | **`0`** |
| Script elements injected at the edge | **`2`** |

The delay is asserted as the exact number `0`, not as "present" and not as a maximum. An instant
refresh reads to a search engine as a permanent move and a delayed one as temporary, so the number
carries the meaning. Independently, axe-core's `meta-refresh` rule is `critical` and `wcag2a` and
passes only at `redirectDelay <= 0`, so any other value would also have blocked the 05-07 run.

### 3.2 The three destinations, asserted equal to one another

Written out in full so a reader can see they match:

```
refresh target   https://www.haoo.online/
canonical href   https://www.haoo.online/
visible link     https://www.haoo.online/
```

Asserted pairwise — refresh↔canonical, canonical↔link, link↔refresh — and **none of the three is
compared against a hard-coded literal**. A literal comparison would let one edited target sit
alongside two stale ones while each row still passed on its own; comparing them to each other is
what makes a silent split impossible (T-05-48). This mirrors what `src/test/build-output.test.ts`
already does against the built tree, extended here to the deployed bytes.

### 3.3 Refresh neutralised — the five required statements as rendered visible text

Mode: `refresh-neutralised (response body rewritten) with scripting disabled`. The document response
was intercepted, the refresh directive stripped from the body, and the rewritten body fulfilled
(RESEARCH Pattern 2). Disabling scripting is **not** sufficient and was not relied on — meta refresh
is a parser directive, not script — but it was done as well, because the case the contract names is
the visitor the enhancement does not carry at all. **This is a modified-page measurement and is
recorded as one.**

Measured rendered text length: **622 characters**. Read with `innerText`, never `textContent` and
never a markup search: a statement present in the markup but not rendered is not a statement to a
visitor.

| # | Required statement | Visible text found |
|---|---|---|
| R1 | HAOO has moved to its own domain | `HAOO has moved to its own domain.` |
| R2 | Absolute anchor to the HAOO page whose visible text names the destination host | `Open HAOO at www.haoo.online` → `https://www.haoo.online/` |
| R3 | Absolute anchor to the brochure at its new host | `www.haoo.online/brochure/HAOO-Marketing-Brochure.pdf` → `https://www.haoo.online/brochure/HAOO-Marketing-Brochure.pdf` |
| R4 | Old sibling asset URLs are not retained and return not-found | `…are not retained here and their old URLs return 404 — a deliberate choice recorded in the phase 04.2 split contract, not an oversight.` |
| R5 | The visible links work whether or not the refresh runs | `The visible links above are the guarantee. The refresh is the enhancement: if it does not run, or if a visitor has JavaScript and meta refresh disabled entirely, the links still work…` |

### 3.4 Both readings' landing results

| Mode | Started at | Landed on | Top-level heading present |
|---|---|---|---|
| `refresh-neutralised, visible link activated` | `https://www.zero-paperhub.com/products/haoo/` | `https://www.haoo.online/` | `Choose how to start with HAOO` (1 h1) |
| `refresh-permitted (no interception)` | `https://www.zero-paperhub.com/products/haoo/` | `https://www.haoo.online/` | `Run the business—not the paperwork.` (1 h1, 26 headings) |

**The two top-level headings differ, and that is the correct reading rather than a discrepancy.**
The neutralised block runs with scripting disabled, so the landing page a visitor in *that* state
sees is the `<noscript>` DOM and its `h1` is the scriptless heading. The refresh-permitted block runs
with scripting on and lands on the React page, whose `h1` is the product outcome. Recording one
heading for both modes would have been a claim neither reading supports.

Both are the cross-repository navigation claim (SC3), proven from the two ends a real visitor can
arrive from.

---

## 4. The journey with the analytics ingestion origin blocked

Every request to a hostname ending in the approved ingestion origin was aborted for the whole page
load. The origin list is read from `config/approved-analytics-hosts.ts` rather than transcribed, so
a change of region or provider cannot leave this test blocking something the build stopped using.

| Reading | Value |
|---|---|
| Blocked hostname suffixes | `us.i.posthog.com` |
| **Analytics requests attempted and blocked** | **`0`** |
| Deployed bundle read | `https://www.haoo.online/assets/haoo-D1dl6F2P.js` |
| Ingestion origin present in that bundle | **yes** |
| Top-level headings rendered | `1` — `Run the business—not the paperwork.` |
| Headings rendered in total | `26` |
| Capability entries rendered in the `Capabilities` region | `6` |
| Smallest primary-action dimension across P1–P8 | **`44` px** (floor: `44`) |

**The zero is interpretable because of the row beneath it.** A blocked-request count of `0` on its
own is ambiguous: it can mean "the facade held" or "there was never anything to block". The
ingestion origin **does** appear in the deployed bundle, so the build is configured; and
`capture_pageview: false` is part of the lockdown (`src/measurement/posthog-lockdown.ts`), so a page
load is expected to issue no ingestion request even on a fully configured build. The two readings
together say the origin was configured, reachable-in-principle, blocked for the duration, and simply
not called during load.

Per-action readings with the origin blocked (instances / visible / enabled / smallest box):

| Action | Instances | Visible | Enabled | Smallest box |
|---|---|---|---|---|
| P1 `Open brochure (opens in a new tab)` | 1 | 1 | 1 | 592 × 45.59 |
| P2 `Download brochure` | 1 | 1 | 1 | 592 × 45.59 |
| P3 `Send my details` | 1 | 1 | 1 | 150 × 44 |
| P4 `Chat with HAOO on WhatsApp` | 3 | 3 | 3 | 320 × 44 |
| P5 `Call +254 702 188 044` | 3 | 3 | 3 | 320 × 44 |
| P6 `Email info@haoo.online` | 3 | 3 | 3 | 320 × 44 |
| P7 `Start with HAOO` | 3 | 3 | 3 | 318 × 45.59 |
| P8 `Send your details instead` | 3 | 3 | 3 | 192 × 44 |

Every primary action stayed present, visible, enabled and at or above the 44 px shipped floor. The
measurement facade's fail-closed design claim (T-05-52) is now a measurement rather than a claim.

---

## 5. Observations — measured, recorded, not asserted

### O-1 — Cloudflare injects two scripts into a document defined as script-free

**Surface:** S4, `https://www.zero-paperhub.com/products/haoo/`. **Owner:** ZERO-PAPER HUB.
**Measured:** 2026-09-12.

04.2 D25 gives the retired-path document a script budget of **exactly zero**, and
`src/test/build-output.test.ts` holds the authored tree to it. The authored document still carries
zero scripts. The **served** document carries two, and neither is in either repository tree:

| # | Script | Where it comes from |
|---|---|---|
| 1 | inline, 921 chars, `window.__CF$cv$params`, loads `/cdn-cgi/challenge-platform/scripts/jsd/main.js` into a hidden iframe | Cloudflare bot management |
| 2 | `https://static.cloudflareinsights.com/beacon.min.js/v31edd6df95cf4e85bb4c19e7a9bdbcba1788362987495` | Cloudflare **Web Analytics** |

`www.zero-paperhub.com` resolves through Cloudflare (`server: cloudflare`, `cf-ray` on every
response) in front of the GitHub Pages origin (`via: 1.1 varnish`, `x-github-request-id`). Both
injections happen after the origin.

**Script 2 is content-negotiated and therefore easy to miss.** A plain `curl` of the same URL
returns only script 1; only a real browser request receives the beacon. A bytes-level check would
have reported one script and been wrong about which ones exist.

**How the contract is asserted in the presence of this.** The spec asserts that the count of scripts
**not** carrying the Cloudflare signature is **exactly `0`** — exact equality, never a maximum. The
budget therefore stays exact and any script somebody actually writes is a red run, while a
third-party edge behaviour is recorded here instead of being reported as a defect in this project's
markup. That is the same verdict split § 0 draws for an unreachable third-party host, applied to a
third-party *addition* rather than a subtraction.

**Why it is worth a decision and not just a note.** Script 2 is an **analytics beacon on a document
this project defines as carrying no script**, in a project whose measurement posture is a
deliberately locked-down facade with person profiles off, persistence off and remote configuration
disabled. Whether ZERO-PAPER HUB's Cloudflare zone should have Web Analytics enabled is an owner
decision about the other repository. **Handed forward to the future ZERO-PAPER HUB phase, and to
plan 05-14 alongside review item R-1**, which also concerns this document.

### O-2 — P5 and P6 ship three elements under their listed names, not the four the closed list declares

**Surface:** S1. **Owner:** this phase's fixture layer. **Measured:** 2026-09-12, and previously by
05-08 at all six widths.

`e2e/fixtures/primary-actions.ts` declares `instances: 4` for P5 and P6, on the reasoning "three
onboarding blocks plus one footer instance". The footer anchors exist and carry the correct
destinations, but their visible text is `product.contacts.phoneDisplay` and `product.contacts.email`
(`src/pages/ProductPage.tsx:299-300`), so their accessible names are `+254 702 188 044` and
`info@haoo.online` — not P5's `Call …` and P6's `Email …`.

They are therefore a **different-name / same-destination** pair: the same inverse rule § 2.2 records
for the scriptless form-recovery section, not a missing instance.
`evidence/viewport-primary-actions.json` already records the same 3-found / 4-declared census at
360, 390, 768, 1280, 1440 and 320 px.

**What this spec does about it.** It records the census and does **not** assert the count — asserting
a count the page has never had would be pinning the list's prose rather than the page. The
destination question those two footer anchors raise is not dropped: a **page-wide sweep** reads every
anchor on S1 carrying a recovery scheme, footer instances included, and holds each to its exact
shipped form. A footer link to a wrong number is a contract failure and fails the run.

### O-3 — S2's own accessibility baseline does not exist yet

05-07 scanned 11 surface-states: S1 × 4, S3, S4 × 2, S5 × 4. **S2 was not among them.** This plan is
the first measurement of the scriptless DOM on either site, and it measures structure and
destinations rather than accessibility conformance. Recorded so a later reader does not mistake
§ 2's coverage for an axe result on S2.

---

## 6. What this plan did **not** prove, stated rather than implied

- **Nothing was proven to deliver.** No call was placed, no message sent, no mail sent. Rows 1–3 of
  § 1 are `validated, not fetched`; § 1's reachable rows prove a host answered, not that a
  conversation would start or a lead would arrive.
- **`info@haoo.online` reachability is not provable from a browser** and is not claimed here. It is
  D-10/D-11's separate three-link mail chain (MX → activation → delivery), owned by plans 05-02 and
  05-06, which remain parked on the owner's DNS change.
- **R-1 is not settled.** 05-07 handed forward `bypass`, rated `serious` and *incomplete*, on this
  same S4 document: axe was looking for a skip link, a heading and a landmark, which 04.2 D-12 leaves
  out of a three-paragraph recovery document on purpose. This plan measured that document three more
  times and settles nothing about it. **05-14 owns the decision.**
- **Zero analytics requests is not zero analytics.** § 4 measures one page load with no interaction.
  It says nothing about what an interaction would send.

---

## 7. Reproduction

```bash
npx playwright test --project=live e2e/recovery.e2e.ts
```

Nine tests. Every measurement above is written through `recordEvidence` **before** it is asserted,
so a failing run still leaves behind the reading that failed.
