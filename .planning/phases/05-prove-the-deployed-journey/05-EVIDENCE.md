# Phase 5 Evidence: What "Prove the Deployed Journey" Established, and What It Did Not

**Plan:** 05-17, Task 3. **Written:** 2026-09-13.
**Working directories:** the HAOO checkout (`KaruguDev/HAOO`) and `../ZERO-PAPERHUB`.

**The deployment every live claim below measures:**
- **HAOO:** `2d45e5f`, via `Deploy HAOO` run `34729513221`. `www.haoo.online` serves `/assets/haoo-CHYRGEim.js`.
- **ZERO-PAPER HUB:** `3525f6d`, via `Deploy ZERO-PAPERHUB` run `34714952939`.
- **Source fixes:** the HAOO deployment contains every Phase 5 source fix (`05-EVIDENCE-GATES.md` §6.1).

**Final live evidence pass:** 2026-09-13T08:21:38Z to 08:25:28Z. Its records are committed in `6be6575`.

**Discipline:**
- Every number here was measured, and each points to the file that holds the measurement.
- Owner decisions carry their provenance.
- "Held out" means not a pass.
- "Deferred" is a scope decision, not a severity judgement.

This record indexes measurements, identifiers and dispositions. It carries no mailbox content, no
credentials and no personal data (T-05-86).

---

## 1. Success criterion 1: widths without overflow or hidden primary actions

> Visitor can use the Products and HAOO journeys at supported mobile and desktop widths without
> horizontal overflow or hidden primary actions.

**Measured:**
- **Overflow.** Live S1 (`https://www.haoo.online/`) and S3 (`https://www.zero-paperhub.com/#products`)
  were read at the six D-09 widths (320 × 256, 360 × 740, 390 × 844, 768 × 1024, 1280 × 1024, 1440 × 900).
  - The per-element sweep found **0 in-scope escapees** at every width on both surfaces.
  - `scrollWidth` equalled `clientWidth` in the unmodified reading and in the mask-neutralised reading.
- **Primary actions.** All 13 (P1–P13) were found by accessible name, visible, unclipped, inside the
  horizontal extent, at least 44 × 44 and enabled. The smallest box was 150 × 44 (`Send my details`).
- **Mobile navigation and media-absent states** were measured on live.
- **Re-measured in this plan.** `viewport.e2e.ts` live ran **40 of 40**, 0 retries. Its 40 new records
  match the committed ones in every value except the F1-LIVE parent-site `href`, which moved from `/`
  to `https://www.zero-paperhub.com/` (§6).

**Recorded as observations (not asserted):**
- VP-O1, VP-O2 and VP-O3 on the ZERO-PAPER HUB home page, outside `#products`. VP-O3 is the one a
  visitor would hit: 3 of 7 mobile menu entries are unreachable at 320 × 256. `Products` stays reachable.

**Held out for human judgement:** the readability of long option labels at 360 px inside native
`<select>` controls (`05-EVIDENCE-FORM-STATES.md` §6). **Not a pass.**

**Deferred:**
- F2 was closed by method.
- ZERO-PAPER HUB findings outside the Products region are deferred by D-OQ-3 (§8.1).

**Evidence files:** `05-EVIDENCE-VIEWPORT.md`, `05-EVIDENCE-PREFLIGHT-FIXES.md`, `05-EVIDENCE-GATES.md` §6.

---

## 2. Success criterion 2: keyboard, focus, semantics, zoom, reduced motion, brochure equivalent

> Visitor can navigate product content, brochure controls, qualification fields and feedback, and
> onboarding links by keyboard with visible focus, semantic headings, descriptive names, zoom support,
> reduced motion, and an HTML equivalent to the brochure.

**Measured:**

| Area | Result |
|---|---|
| **Keyboard traversal** | 36 stops at 320/360/390 and 40 at 768/1280/1440. The stops whose indicator changed equal the stop count at every width. 0 order violations; 0 elements with `tabindex > 0`. |
| **Skip link** | First stop at every width; lands inside `main#haoo-content`. |
| **Brochure panel** | Its two actions are ordinary adjacent tab stops. 0 dialog semantics, so no trap. |
| **Qualification form** | 0 of 23 focus transitions landed on the document body. Six states were recorded, four induced on preview by routing, so no mail was sent. |
| **Headings, landmarks, names** | Heading order checked by DOM walk (axe's `heading-order` does not run under the WCAG tag set). Landmark inventory and accessible names asserted. |
| **Brochure HTML equivalent** | **10 of 10** items (6 capabilities, 4 journey steps), also with the PDF route aborted. The three brochure references resolve to 1 destination. |
| **Zoom** | Reflow at 640 × 512 and 720 × 450 (200%) and at 320 × 256: 0 escapees, content intact, primary actions above the floor. |
| **Reduced motion** | ZM-LIVE-1 and ZM-LIVE-2 were fixed in `65a612a` and deployed. The live reading at 2026-09-13T08:23:23Z with reduce emulated was `transformAfter` `none` and `transitionProperty` `none`. The no-preference control read `matrix(1, 0, 0, 1, 0, -4)`. |
| **Accessibility gate** (`e2e/axe-gate.e2e.ts`, 11 surface-states) | 0 unexcepted critical or serious nodes on both projects. S4 carries 1 blocking node per reading, and R-1 excepts it. |
| **Re-measured in this plan** | Live: `keyboard` 25, `semantics` 12, `zoom-motion` 21, `axe-gate` 8, `form-states` 5. Preview: `semantics` 12, `zoom-motion` 3, `axe-gate` 5, `form-states` 9. Every one exit 0, 0 retries. |

**Recorded as observations (not asserted):**
- **KB-O1.** Five ZERO-PAPER HUB contact-form controls paint no focus indicator.
- **KB-O2.** A recorded browser-behaviour limit: headless Chromium has no PDF plugin, so the embedded
  viewer's keyboard behaviour is not evidenced in either direction.
- **KB-O3 / F5.** The Products page has no `main` landmark and no bypass.
- **FS-O1.** 2 `role="status"` elements against 1 submission region.
- **FS-O2.** The honeypot is not disabled while in flight.

**Held out for human judgement (not passes):**
- **E1:** line length inside max-width columns at halved desktop.
- **E3:** brochure equivalent readability at 360 and 200%.

Both are in `05-EVIDENCE-ZOOM-MOTION.md` §4, alongside the option-label item in §1 above.

**Accepted:** R-1 (`bypass`, S4). Owner-accepted, orchestrator-drafted at the owner's request.

**Evidence files:** `05-EVIDENCE-KEYBOARD.md`, `05-EVIDENCE-FORM-STATES.md`, `05-EVIDENCE-SEMANTICS.md`,
`05-EVIDENCE-ZOOM-MOTION.md`, `05-EVIDENCE-AXE.md`, `05-EVIDENCE-GATES.md` §6.

---

## 3. Success criterion 3: direct navigation and refresh, and every check

> Direct production navigation and refresh work for the HAOO page and brochure, while build,
> typecheck, lint, automated contract/component tests, and required deployed checks pass.

### 3.1 Direct navigation and refresh, measured in this plan

`curl` GET, two consecutive rounds at 2026-09-13T08:40:01Z and 08:40:04Z. The second round is the
refresh reading. Nothing was submitted.

| URL | Round 1 | Round 2 |
|---|---|---|
| `https://www.haoo.online/` | 200, 5085 B, `text/html` | 200, 5085 B |
| `https://haoo.online/` | 301 → `https://www.haoo.online/` | 301 → same |
| `http://www.haoo.online/` | 301 → `https://www.haoo.online/` | 301 → same |
| `https://www.haoo.online/brochure/HAOO-Marketing-Brochure.pdf` | 200, 2160873 B, `application/pdf` | 200, 2160873 B |
| `https://www.zero-paperhub.com/products/haoo/` (retired path) | 200, 5291 B | 200, 5291 B |

In the Playwright pass:
- `recovery.e2e.ts` reached the brochure PDF out of band (200, `application/pdf`, 08:22:34Z).
- It read the retired-path document landing on `https://www.haoo.online/` in both navigation readings.

### 3.2 The gate table (Task 1, measured 2026-09-13)

| Repository | Command | Exit code | Reading |
|---|---|---|---|
| HAOO | `npm run build` | 0 | `dist/assets/haoo-DccNMFAD.js` 207.64 kB |
| HAOO | `npm run typecheck` | 0 | app, node and e2e projects |
| HAOO | `npm run lint` | 0 | |
| HAOO | `npm test` | 0 | 688 tests / 10 files |
| HAOO | `npm run verify:coverage` | 0 | 70 required capabilities across 3 tables |
| HAOO | `npm run verify:disjoint` | 0 | 163 compared, 26 shared, 26 entries, 26 subtracted, 0 violations |
| HAOO | `npm run test:phase1:contracts` | 0 | 3 suites, 3 of 3 markers on green cases, 0 of 8 infrastructure signatures |
| ZERO-PAPER HUB | `npm run build` | 0 | `dist/assets/main-ClJKpN3o.js` 179.59 kB |
| ZERO-PAPER HUB | `npm run typecheck` | 0 | app and node projects |
| ZERO-PAPER HUB | `npm run lint` | 0 | |
| ZERO-PAPER HUB | `npm test` | 0 | 32 tests / 3 files |
| ZERO-PAPER HUB | `npm run verify:disjoint` | 0 | 26 / 26 / 26, 0 violations |
| ZERO-PAPER HUB | `npm run test:phase1:contracts` | 0 | 1 suite, 1 of 1 markers, 0 of 8 signatures |

`cmp shared-scaffold.txt ../ZERO-PAPERHUB/shared-scaffold.txt`: exit 0. Both builds print the
harmless `Browserslist: caniuse-lite is outdated` warning, which does not affect exit codes or bundles.

**Unit-test counts against the pre-harness baseline:**
- **HAOO: 683 → 688.** +1 from `2d9c33b` (seventh focus source), +4 from `a7675f4` (L2-O1).
- **ZERO-PAPER HUB:** 32 → 32.

### 3.3 The deployment runs

| Repository | Workflow | Run identifier | Conclusion | Commit |
|---|---|---|---|---|
| HAOO | `Deploy HAOO` | `34729513221` | success | `2d45e5fef5624a378842d742a0d3c919ea580cee` |
| HAOO | `Verify tree disjointness` | `34729513230` | success | `2d45e5fef5624a378842d742a0d3c919ea580cee` |
| ZERO-PAPER HUB | `Deploy ZERO-PAPERHUB` | `34714952939` | success | `3525f6d4d7bb3349015e3e238e07b6e07c6b88c5` |

### 3.4 The live and preview evidence passes

| Project | Exit code | Collected | Expected | Skipped by project | Unexpected | Retries consumed |
|---|---|---|---|---|---|---|
| live | 0 | 141 | 128 | 13 | 0 | 0 |
| preview | 0 | 141 | 33 | 108 | 0 | 0 |

`e2e/live-submission.e2e.ts` was not collected. Nothing was sent.

### 3.5 Blockers closed by work (D-18 items 1 and 2)

- **The leftover worktree: closed by re-measurement.**
  - `git worktree list` shows 1 worktree per repository.
  - HAOO has no `.claude/`; ZERO-PAPER HUB has an empty one.
  - 0 `worktrees` directories in either tree.
  - Both Vitest configs exclude `.claude/**`, and the collection counts are single-copy
    (`05-EVIDENCE-GATES.md` §6.5).
- **The `04-UI-SPEC.md` contradictions: reconciled by this plan, with a dated amendment note.**
  - The C-1 row now carries the shipped `A-plus-campaign` clause.
  - The Surface B visible-notice row states its boundary including campaign values.
  - The banned-vocabulary list now states its real scope: the report's rendered text except the
    authored caveat block, which is pinned by exact text. Surface B and C copy uses banned terms only
    inside authored denials, and no automated contract scans those surfaces.

**The continuous separation check** runs on every HAOO push. `verify-split.yml`'s first run was
`34715004118` and its latest is `34729513230`, both success. The coverage gap is recorded: a push to
ZERO-PAPER HUB alone does not trigger it (`05-EVIDENCE-GATES.md` §4).

**Held out:** the requirement's "required deployed manual checks" beyond the enumerated gates, meaning
the three held-out judgements in §1 and §2. They are owed to `/gsd-verify-work 05`.

**Evidence files:** `05-EVIDENCE-GATES.md` (§1–§6), `05-EVIDENCE-PLANNING-HOME.md`, `05-EVIDENCE-RECOVERY.md`.

---

## 4. Success criterion 4: the tagged production submission, and recovery paths

> A uniquely tagged production qualification submission demonstrates that the activated HAOO endpoint
> reaches the `info@haoo.online` inbox or spam folder, with direct onboarding recovery paths still
> available.

### 4.1 The LEAD-07 chain

| Link | Status | What established it | Plan |
|---|---|---|---|
| 1, MX | **CONFIRMED** | `dig` from the local resolver and 8.8.8.8 named `10 mx1.privateemail.com` and `10 mx2.privateemail.com` in ten consecutive rounds, closing run 2026-09-12T21:03:51Z. Re-measured 2026-09-13T01:11:43.608Z, just before the release send. | 05-02 |
| 2, Activation | **CONFIRMED on the owner's report** | The owner's words: "activated form submit and received 3 submissions". Corroborated by delivery of `HAOO-ENDPOINT-ACTIVATION-20260913T003033Z-571c962a` with header `Sun, 13 Sep 2026 00:33:02 +0000`. Folder, full sender and post-click text were not stated. | 05-06 |
| 3, Delivery | **CONFIRMED on the owner's report** | Marker `HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d` was committed before the send (`49c976a`) and sent as 1 message at 2026-09-13T01:11:46.454Z (HTTP 200, `success` `"true"`). Received "Today 04:11" local (01:11 UTC), folder **inbox**. Full sender and subject not stated. | 05-16 |

**Live submissions sent in Phase 5: exactly 2.** This plan sent none.

### 4.2 Recovery paths, this plan's live run (2026-09-13T08:22Z)

- `https://manage.haoo.online/`: **reachable**, 200, `text/html`.
- The brochure PDF: **reachable**, 200, `application/pdf`.
- `tel:+254702188044`, `mailto:info@haoo.online` and the `wa.me` link: **validated, not fetched**.
- The scriptless DOM (S2) and the retired-path document (S4) were re-read. All values identical to
  the committed records, except O-1's script count (§6).

**Recorded as observations:**
- **L2-O2.** The activation-trigger submission was delivered after activation, contrary to the plan's premise.
- **O-2 and O-3** in `05-EVIDENCE-RECOVERY.md` §5.

**Not proven:** delivery rests on the owner's mailbox reading, from one tagged sample. See §8.4.

**Evidence files:** `05-EVIDENCE-MAIL.md`, `05-EVIDENCE-RECOVERY.md`.

---

## 5. Requirement statuses, set from the measurements above

| ID | Status | Cited measurement | Met at less than its full statement? Successor |
|---|---|---|---|
| **LEAD-07** | Complete (re-derived here, not inherited from 05-16) | §4.1 links 1–3; §4.2 recovery reachability | No gap in the statement. Links 2 and 3 rest on the owner's report. |
| **QUAL-01** | Complete (qualified) | §1: 0 escapees at 6 widths × 2 surfaces; P1–P13 reachable; viewport 40 of 40 re-measured | Sampled at the closed D-09 widths only; the option-label readability is held out. **Successor:** `/gsd-verify-work 05` |
| **QUAL-02** | Complete (qualified) | §2: 36/40 stops all indicated, 0 order violations, skip link, 0 of 23 body focus; keyboard 25 of 25 re-measured | KB-O2 (PDF viewer not evidenced); FS-O1 routed. **Successor:** `/gsd-verify-work 05` |
| **QUAL-03** | Complete (qualified) | §2: heading walk, names, 10 of 10 equivalent, reflow at 200% and 320, reduced motion live; semantics 12, zoom-motion 21, axe-gate 8 re-measured | E1 and E3 held out; R-1 accepted rather than fixed. **Successor:** `/gsd-verify-work 05` |
| **QUAL-05** | Complete (qualified) | §3.2–§3.4: 13 commands exit 0, 3 deploy runs success, live and preview passes exit 0 | The manual-check half is the three held-out judgements, not yet made. **Successor:** `/gsd-verify-work 05` |

The same table, with fuller citations, is in `.planning/REQUIREMENTS.md` § Phase 5 status evidence.

---

## 6. Every finding, by identifier and outcome

| ID | What it was | Outcome | Record |
|---|---|---|---|
| **F1** / **F1-LIVE** | Both "Back to ZERO-PAPER HUB" links resolved to the HAOO page | **Fixed and deployed.** `d8f4bea` and `78bf191`, deploy run `34687312104`. Re-measured 2026-09-13: 12 of 12 hrefs read `https://www.zero-paperhub.com/` | `05-EVIDENCE-SEMANTICS.md` §5.1, `05-EVIDENCE-GATES.md` §6.7 |
| **F2** | `overflow-x-hidden` absorbs real overflow | **Closed by method** (the per-element sweep), no source change | `05-EVIDENCE-PREFLIGHT-FIXES.md` |
| **F3** | `MeasurementDisclosure.tsx` outside the closed focus-source list | **Fixed** (`2d9c33b`) | same |
| **ZM-LIVE-1 / ZM-LIVE-2** | Hover translate and smooth scrolling under reduced motion | **Fixed and deployed.** `65a612a` and `c9303e8`, deploy run `34717723054`. Re-measured 2026-09-13T08:23:23Z | `05-EVIDENCE-ZOOM-MOTION.md` §2.1 |
| **L2-O1** | The form showed "sent" on FormSubmit `"success":"false"` | **Fixed and deployed.** `a7675f4` and `e6cf694`, deploy run `34729513221`. Live mocked probe at 2026-09-13T01:07:41Z. WINDOWS #37 `fixed` | `05-EVIDENCE-MAIL.md` Link 2, `deferred-items.md` |
| **R-1** | `bypass` incomplete (serious) on S4 | **Accepted.** The one named gate exception; owner-accepted, orchestrator-drafted at the owner's request. Re-read 2026-09-13: 1 excepted and 0 unexcepted per reading | `05-EVIDENCE-AXE.md` §9 |
| **CF-JSD-1** | Cloudflare JavaScript Detections bootstrap on both zones | **Accepted** by the owner as a Free-plan platform limit (2026-09-13). A decision, not a defect | `05-EVIDENCE-RECOVERY.md` §5 |
| **O-1** | Cloudflare Web Analytics beacon on the script-free S4 document | **Closed by formal re-measurement.** At 2026-09-13T08:22:26Z S4 carries 1 edge script (the CF-JSD-1 bootstrap), down from 2, and 0 beacon | `05-EVIDENCE-GATES.md` §6.7 |
| **AG-O1** | The same beacon seen on `www.haoo.online` at 20:29Z | **Closed by formal reading.** 4 of 4 live S1 states at 08:21:47Z–08:22:15Z load only `/assets/haoo-CHYRGEim.js`, with 0 `cloudflareinsights`. Which setting removed it is not established | same |
| **D-18 item 3, Kenya DPA 2019 sign-off** | Legal sign-off on collection | **Accepted risk, NOT resolved.** Outstanding and carried beyond Phase 5 | §8.2 |
| **D-18 item 4, certificate (D34)** | Origin certificate issued before the reclaim | **Accepted risk**, measured at both layers | §8.2 |
| **CSS-O1** | Phase 1 test-name markers ship as inert rules in production CSS (HAOO 3, ZERO-PAPER HUB 2) | **Deferred** | `deferred-items.md` |
| **G-1** | The disjointness auditor accepts a stale allowlist entry | **Deferred.** Today: 26 of 26 subtracted, so no stale entry exists | `deferred-items.md` |
| **FS-O1** | 2 `role="status"` elements, 1 submission region | **Routed to phase verification** | `05-EVIDENCE-FORM-STATES.md` §7, `05-EVIDENCE-AXE.md` §8.3 |
| **FS-O2** | Honeypot not disabled while in flight | Observation | `05-EVIDENCE-FORM-STATES.md` §7 |
| **L2-O2** | The activation-trigger submission was delivered | Observation | `05-EVIDENCE-MAIL.md` Link 2 |
| **KB-O1, KB-O2, KB-O3** | ZERO-PAPER HUB unindicated focus; PDF viewer limit; Products page without bypass | Observations. KB-O1 and KB-O3 are **deferred** with F4/F5 | `05-EVIDENCE-KEYBOARD.md` §6 |
| **VP-O1, VP-O2, VP-O3** | ZERO-PAPER HUB home-page overflow and menu reachability | Observations, **deferred** by D-OQ-3 | `05-EVIDENCE-VIEWPORT.md` §5 |
| **F4, F4b, F5, F6** | ZERO-PAPER HUB home-page defects | **Deferred** by D-OQ-3 (§8.1) | `05-EVIDENCE-PREFLIGHT-FIXES.md` |
| **WINDOWS #34, #35** | ZM-LIVE-1, ZM-LIVE-2 | `fixed` | `.planning/WINDOWS.md` |
| **WINDOWS #36** | 05-02's four-address A-record clause after the move to Cloudflare | `waived` (owner decision 2026-09-13; clause amended to "site still serves", `18a5223`) | same |
| **WINDOWS #37** | L2-O1 | `fixed` | same |
| **Open owner item** | The owner's own check that PostHog shows web and product analytics | **Pending**, in the owner's words ("that bit is still pening" [owner's correction: "*pending"]) | `05-EVIDENCE-MAIL.md` |

---

## 7. Index of evidence files

| File | Subject | Outcome |
|---|---|---|
| `05-EVIDENCE-PLANNING-HOME.md` | 05-01: the planning record's single home | ZERO-PAPER HUB `.planning/` removed after a superset walk (0 ZERO-PAPER-HUB-only, 0 differing paths across 233 comparisons) |
| `05-EVIDENCE-HARNESS.md` | 05-03: the tracer and the harness | First live run: 29 rules, 0 violations, 0 escapees at 360 px, 0 PostHog ingestion requests (`webdriver` `true`); test-traffic decision recorded |
| `05-EVIDENCE-PREFLIGHT-FIXES.md` | 05-04: pre-flight findings | F1, F2 and F3 closed; F4, F4b, F5 and F6 measured, unfixed, deferred |
| `05-EVIDENCE-AXE.md` | 05-07 baseline, 05-14 triage and gate | 11 surface-states, 0 violations; gate 0 unexcepted; R-1 accepted; O-1 and AG-O1 routed |
| `05-EVIDENCE-VIEWPORT.md` | 05-08: QUAL-01 | 0 escapees at 6 widths × 2 surfaces; P1–P13 reachable |
| `05-EVIDENCE-KEYBOARD.md` | 05-09: QUAL-02 keyboard half | 36/40 stops, every indicator changed, 0 order violations, skip link, KB-O2 limit |
| `05-EVIDENCE-SEMANTICS.md` | 05-10: QUAL-03 structure | Heading order, landmarks, names; brochure equivalent 10 of 10; F1-LIVE closed |
| `05-EVIDENCE-RECOVERY.md` | 05-11: recovery surfaces | Scriptless DOM, retired path landing on HAOO, reachability probes; O-1 and CF-JSD-1 |
| `05-EVIDENCE-FORM-STATES.md` | 05-12: QUAL-02 form half | Six states, 0 of 23 body focus; option labels held out; FS-O1 |
| `05-EVIDENCE-ZOOM-MOTION.md` | 05-13: QUAL-03 zoom and motion | Reflow at 200% and 320; ZM-LIVE-1/2 closed; E1 and E3 held out |
| `05-EVIDENCE-GATES.md` | 05-15 successor gate and CI separation; 05-17 sweep | `test:phase1:contracts` exit 0 both sides; `verify-split.yml` success; 13 gates exit 0; both certificate layers measured |
| `05-EVIDENCE-MAIL.md` | 05-02, 05-06, 05-16: LEAD-07 | All three links CONFIRMED; 2 live submissions; L2-O1 fixed; L2-O2 |
| `deferred-items.md` | Phase deferrals | G-1 and CSS-O1 deferred; L2-O1 fixed and deployed |

Machine records: 40 files under `evidence/`. The final pass is in `6be6575`, with per-file before and
after counts in `05-EVIDENCE-GATES.md` §6.6.

---

## 8. Standing limits

This section is the part a later reader most needs. Nothing in it is a pass.

### 8.1 Deferred ZERO-PAPER HUB findings: a scope decision, not a severity judgement

The owner deferred these by **D-OQ-3** (2026-09-07). ZERO-PAPER HUB evidence stops at the Products
region, so asserting these would have turned a proving phase into a remediation phase. **Nobody has
decided they are acceptable to leave.**

| ID | Measured value |
|---|---|
| **F4** | Focus ring `green-400` (`#4ade80`) on white inputs computes **≈1.74:1**, below 3:1, with `focus:outline-none` removing the native indicator (`App.tsx` lines 590, 595, 601, 606, 611). KB-O1's live reading is stronger: the five controls paint no indicator at all. |
| **F4b** | `App.tsx` is absent from that repository's closed `FOCUS_SOURCES`, which is why F4 was never caught. |
| **F5** | 0 `<main>` landmarks and 0 skip links on the home page. Live: 4 stops before the Products region at 320/360/390, 10 at 768/1280/1440. |
| **F6** | No `prefers-reduced-motion` handling anywhere in the repository. |
| **VP-O1 to VP-O3** | Clipped decorative escapes; a 14 px hero escape at 320 px; 3 of 7 menu entries unreachable at 320 × 256. |

### 8.2 The two owner-dispositioned blockers

Both were dispositioned **`accepted`** on 2026-09-13 at plan 05-17 Task 2.

**How the dispositions were reached:**
1. The owner replied "accepted".
2. Asked whether that covered both items and for a sentence for each, the owner replied "yes".
3. Offered "Draft both for me" or "I'll write them myself", the owner selected "Draft both for me".
4. Shown both drafts before anything was recorded, the owner selected "Approve both as written".

**Provenance of both sentences:** owner-accepted, orchestrator-drafted at the owner's request, and
approved by the owner as written. They are not the owner's own wording. This is the same pattern as R-1.
The phase closes on these decisions being recorded, not on the risks being gone.

**Kenya Data Protection Act 2019 sign-off** (`02-VALIDATION.md:91`): **accepted risk, not resolved.**
- No one with legal standing has assessed the collection.
- No determination of compliance exists.
- No legal review has happened.
- The owner's earlier copy approval did not close it, and nor does this acceptance.
- The sign-off remains **outstanding and is carried beyond Phase 5**.

> The owner accepts, as a known and unassessed risk, that the HAOO qualification form collects personal data on the live site before anyone with legal standing has determined whether that collection complies with the Kenya Data Protection Act 2019; the sign-off remains outstanding and is carried beyond Phase 5.

**The certificates for `haoo.online`** (D34): **accepted risk.**

> The owner accepts that the GitHub Pages origin for haoo.online still serves the Let's Encrypt certificate issued on 2026-09-03 (serial 0609A5171B8224FD0D181CCBEC9CC50E7CC1, valid until 2026-12-02) while a third party held the Pages claim, given that visitors receive Cloudflare's edge certificate issued on 2026-09-09 after the reclaim, GitHub holds the private key, and the platform has not replaced the origin certificate.

Measured beside it, 2026-09-13T08:19:04Z–08:19:08Z, with `openssl s_client`:

| Layer | Issuer | Subject | SANs | Serial | Valid |
|---|---|---|---|---|---|
| Cloudflare edge, what visitors receive (`www.haoo.online`, `haoo.online`) | Let's Encrypt `YE2` | `CN=haoo.online` | `*.haoo.online`, `haoo.online` | `06D56404362229A110326272D5DCCF6249D0` | 2026-09-09 19:35:32Z to 2026-12-08 19:35:31Z |
| GitHub Pages origin (`185.199.108–111.153`, SNI `www` and apex, 8 connections) | Let's Encrypt `YR2` | `CN=www.haoo.online` | `haoo.online`, `www.haoo.online` | `0609A5171B8224FD0D181CCBEC9CC50E7CC1` | 2026-09-03 07:14:32Z to 2026-12-02 07:14:31Z |

**Stated unknowns:**
- **SSL mode unknown.** The Cloudflare SSL mode is not established, so whether Cloudflare validates the
  origin certificate is not known.
- **Platform rotation behaviour unconfirmed.** Whether GitHub Pages ever replaces a certificate after a
  domain claim changes hands is not confirmed by any authoritative source.

Certificate-transparency monitoring stays deferred (T-05-87).

### 8.3 Held-out human judgements: not passes

1. **Option labels at 360 px** (`05-EVIDENCE-FORM-STATES.md` §6). The widest real label is 16 characters
   in a 278 px closed control. The open popup was not measured and cannot be.
2. **E1**, paragraph line length at halved desktop (`05-EVIDENCE-ZOOM-MOTION.md` §4): 59 to 84
   characters per line at the 640 and 720 entries.
3. **E3**, brochure equivalent readability at 360 px and 200% (same file): 1 card per row, 6 cards,
   4 journey steps at every entry.

All three are owed to `/gsd-verify-work 05`.

### 8.4 Recorded limits and unproven branches carried as planner assumptions

- **KB-O2, the browser-behaviour limit.** The keyboard behaviour of a real browser PDF viewer is not
  evidenced in either direction. Headless Chromium has no PDF plugin.
- **QUAL-01 sampling (05-08).** Only the six D-09 widths are measured, with no continuous sweep, so a
  defect appearing only at, say, 412 px is not covered. The Products grid (two or more products) and
  empty branches are covered by jsdom only; live proves the single-card branch.
- **The ZERO-PAPER HUB contact form** is unproven by this phase (05-08).
- **QUAL-02 (05-09).** Forward and reverse traversal is the sample. There is no traversal after
  interleaved mouse input, and assistive-technology virtual-cursor navigation is not observable.
- **QUAL-03 (05-10).** An empty capability or journey list is unreachable at run time (type gate), so it
  is carried as an assumption. The brochure-unavailable case is asserted.
- **LEAD-07 concurrency (05-02, 05-06, 05-16).** Nothing serialises the mail chain mechanically. The
  guarantees are procedural and made visible through per-link timestamps and a committed marker. Links 2
  and 3 rest on the owner's mailbox report, and there was one tagged delivery sample.
- **A6 (05-16).** Activation is assumed permanent and not bound to the submitting origin.
- **QUAL-05 (05-17).** The closed enumeration of commands and deployment workflows is the definition of
  "checks pass". Anything outside it is outside the requirement by construction.
- **Zero analytics requests on one page load** says nothing about what an interaction sends
  (`05-EVIDENCE-RECOVERY.md` §6).

### 8.5 The two live submissions this phase sent

| Marker | Sent (UTC) | Plan | Purpose |
|---|---|---|---|
| `HAOO-ENDPOINT-ACTIVATION-20260913T003033Z-571c962a` | 2026-09-13T00:30:34.768Z | 05-06 | Endpoint activation trigger |
| `HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d` | 2026-09-13T01:11:46.454Z | 05-16 | Tagged release delivery |

The two owner-generated test submissions delivered at 00:33 UTC are not phase sends. This plan sent nothing.

### 8.6 The named analytics inclusion

- **What 05-03 named** (`05-EVIDENCE-HARNESS.md` §4). One known inclusion the webdriver bot filter does
  not cover: the D-12 tagged submission's `qualify_submit` would be captured and carried in the owner
  report.
- **What was measured.** Both phase submissions were Playwright-driven, and both read `navigator.webdriver`
  `true` with 0 requests to `https://us.i.posthog.com`. The named inclusion therefore did not
  materialise for either phase send, contradicting the premise (`05-EVIDENCE-MAIL.md`).
- **Owner test submissions.** Whether the owner's two manual submissions entered PostHog counts is not
  measured.
- **Owner report counts.** Owner-report counts remain a floor, not a census (04.2 D41).
- **The owner's own PostHog check** is **pending**.

### 8.7 The separation check

It is **continuous for HAOO pushes and pull requests**. Its first run was `34715004118` (success). It
is not triggered by a push to ZERO-PAPER HUB alone, which is audited at the next HAOO push or on a
manual dispatch. The spot-checked fallback was not needed.

### 8.8 Other standing items

- **CSS-O1 and G-1** are deferred (`deferred-items.md`).
- **FS-O1** is routed to verification.
- **HAOO local `main`** is ahead of origin by documentation and evidence commits only. Whether to push
  once at phase close is the owner's decision. Nothing was pushed by this plan.

---

## Closing

**Established:**
- The deployed HAOO journey (`2d45e5f`, `haoo-CHYRGEim.js`) and the ZERO-PAPER HUB Products region
  (`3525f6d`) were measured live in one session against a deployment carrying every Phase 5 source fix.
- Overflow, primary-action reachability, keyboard traversal with visible focus, heading and name
  structure, the brochure's HTML equivalent, zoom reflow, reduced motion and the accessibility gate all
  read as recorded above.
- 13 enumerated gate commands exited 0 across the two repositories, and three deployment runs concluded
  success.
- A uniquely tagged production submission reached the `info@haoo.online` inbox, on the owner's report.
- Four live defects (F1-LIVE, ZM-LIVE-1, ZM-LIVE-2, L2-O1) were found, fixed and re-measured on production.

**Not established:**
- That the collection complies with the Kenya Data Protection Act 2019. That sign-off is an accepted,
  unassessed risk and stays outstanding.
- That the GitHub Pages origin certificate has been replaced. It has not; that is an accepted risk.
- Anything a human still has to judge: option labels, E1 and E3.
- Keyboard behaviour inside a real PDF viewer.
- Any width outside the six sampled.
- Anything on the ZERO-PAPER HUB home page outside the Products region, whose measured defects are
  deferred.
- The owner's own PostHog analytics check, which is still pending.
