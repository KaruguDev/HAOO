# Phase 5 — Accessibility Baseline, Classified (plan 05-07)

**What this is.** This is the first axe run ever made against either live site, with every result
classified. It is derived entirely from the machine record `evidence/axe-baseline.json`, whose 11
entries are the source of every count below. Nothing here comes from a separate reading.

**Disposition, stated first so no one reads it as something else.** The baseline is exploratory and
**non-gating**. It records findings and fails on none of them. The gate is plan 05-14's
`e2e/axe-gate.e2e.ts`, under the D-OQ-1 threshold.

---

## 1. Provenance

Read from the record's own fields, not restated from configuration.

| Field | Value | Source |
|-------|-------|--------|
| Engine | `axe-core` **4.13.0** | `engine` / `engineVersion` on every entry, from the result's own `testEngine` field |
| Harness | `@axe-core/playwright` 4.13.0, Chromium (Playwright `Desktop Chrome`) | `package.json`, `playwright.config.ts` |
| Tags sent | `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`: **5** | `tags` on every entry. The length is asserted by the plan's `<verify>` |
| Global disabled rules | **none** | `e2e/fixtures/axe.ts` holds no global disable |
| Builder | `axeFor(page, surface)` for all 11 scans; 0 locally constructed builders in the spec | `grep -c 'new AxeBuilder' e2e/axe-baseline.e2e.ts` → `0` |
| Live entries | S1 and S4 at `https://www.haoo.online/` and `https://www.zero-paperhub.com/products/haoo/`, S3 at `https://www.zero-paperhub.com/#products`, timestamped `2026-09-11T21:22:04Z` to `21:22:28Z` | `url`, `timestamp`, `project: live` |
| Preview entries | S5 at `http://localhost:4173/`, `vite preview` of the built `dist/`, same session | `url`, `project: preview` |

**Per-URL disabled rules.** The list is closed, and every entry has a reason. These are the only
disables anywhere in the run.

| Surface | Rule | Reason (verbatim from `AXE_PER_URL_DISABLES`) | Measured effect |
|---------|------|-----------------------------------------------|-----------------|
| S4 | `page-has-heading-one` | S4 is a three-paragraph recovery document with no content to head. Adding an `<h1>` would give a noindex page a heading it does not need. | none: `disabledRulesWithinTags: []` |
| S4 | `landmark-one-main` | Same: S4 is a static document, not a route. 04.2 D-12 defines it as minimal, and "just one more element" is the drift that definition exists to prevent. | none: `disabledRulesWithinTags: []` |
| S4 | `region` | Follows from the two above: with no landmarks by design, all content is necessarily outside one. | none: `disabledRulesWithinTags: []` |

`disabledRulesWithinTags` is `[]` on both S4 entries. That is the measured confirmation of what
`fixtures/axe.ts` claims: all three disables are `best-practice` rules, the five tags already exclude
them, and so they removed nothing from this run. **No finding was removed by a disable.**

**Analysis scope per surface.**

| Surface | Scope recorded in `analysisScope` |
|---------|-----------------------------------|
| S1 (4 states) | whole document |
| S3 | `include(#products)`: the Products region only, never the document (D-OQ-3 expressed mechanically) |
| S4 (2 readings) | whole document |
| S5 (4 states) | whole document |

**Excluded tag family, and heading order.** The advisory `best-practice` tag family is excluded by
the tag list. `heading-order` is a `best-practice` rule, so **this run does not check heading
order**. Plan 05-05 recorded the composition outcome: `withTags` and `withRules` *replace* rather
than union, no single builder runs both the WCAG sweep and `heading-order`, and the factory
therefore carries no explicit heading-order rule. That leaves the *spec-authored assertion* option,
a DOM walk of `h1`..`h6` owned by the semantics spec (plan 05-10). Nothing in this file is evidence
about heading order.

---

## 2. Rule accounting: why each surface ran the number of rules it did

A raw count of rules that returned results cannot, on its own, tell *"this surface has fewer
applicable rules"* apart from *"this run was narrowed"* (T-05-29). Each entry therefore accounts
for every rule, using the engine's own selection logic (`matchTags` / `ruleShouldRun`, axe-core
4.13.0), read from the engine instance that ran in the page:

- **tag-matched**: rules carrying any sent tag.
- **tag-excluded**: rules the engine holds back by default because they are also tagged
  `experimental` or `deprecated`.
- **page-level out of scope**: page-level rules, which axe does not run when the context is a
  region.
- **selected** = tag-matched − tag-excluded − page-level out of scope − disables. Every selected
  rule must then appear exactly once in **applicable** (it matched at least one node: passes,
  violations and incomplete) or in **inapplicable** (it matched nothing in scope).

The spec **asserts** that sum before writing each entry. A narrowed run would fail the run rather
than be recorded as clean. This is a check on the method, never on findings. The first version of
the accounting used the public `axe.getRules(tags)`. The assertion caught that as wrong: 7 rules
listed that the engine never runs. The accounting was corrected to the engine's semantics, and the
corrected version recorded all 11 entries below.

| Surface / state | Tag-matched | Tag-excluded | Page-level out of scope | Selected | Applicable | Inapplicable |
|-----------------|------------:|-------------:|-------------------------|---------:|-----------:|-------------:|
| S1 / default | 70 | 7 | 0 | 63 | 29 | 34 |
| S1 / disclosure-expanded | 70 | 7 | 0 | 63 | 29 | 34 |
| S1 / error-summary | 70 | 7 | 0 | 63 | 29 | 34 |
| S1 / mobile-nav-open (360 × 740) | 70 | 7 | 0 | 63 | 29 | 34 |
| S3 / products-region | 70 | 7 | 1 (`bypass`) | 62 | 12 | 50 |
| S4 / as-served | 70 | 7 | 0 | 63 | 10 | 53 |
| S4 / refresh-stripped (modified page) | 70 | 7 | 0 | 63 | 9 | 54 |
| S5 / in-flight | 70 | 7 | 0 | 63 | 28 | 35 |
| S5 / success | 70 | 7 | 0 | 63 | 23 | 40 |
| S5 / transport-failure | 70 | 7 | 0 | 63 | 29 | 34 |
| S5 / blocked | 70 | 7 | 0 | 63 | 29 | 34 |

**The 7 tag-excluded rules** are the same on every entry. Each carries a WCAG tag, and **this
baseline did not perform any of them**: `css-orientation-lock`, `label-content-name-mismatch`,
`p-as-heading`, `table-fake-caption`, `td-has-header` (`experimental`), and `aria-roledescription`,
`audio-caption` (`deprecated`). `target-size` is `enabled: false` in the engine's defaults, yet it
*did* run, because an explicit tag match (`wcag22aa`) overrides that flag.

**Why the applicable counts differ.** Each explanation below is read from which rule ids moved
between the applicable and inapplicable lists.

- **S1, all four live states: 29.** The whole HAOO document contains form controls, lists, images,
  a `<details>`/`<summary>`, links and ARIA, so every rule family with markup to check applies. The
  three conditional states render *more nodes* under the same 29 rules and no new rule family. The
  applicable id lists are identical across the four states.
- **S3: 12 of 62.** Two effects of scoping to `#products`:
  - `bypass` is page-level, so it is **outside the question asked**, not suppressed. This is D-OQ-3,
    made visible in `pageLevelRuleIdsOutOfScope`.
  - Rules whose only targets are `<html>`, `<head>` or `<body>` have no node inside the region, so
    they are inapplicable: `document-title`, `html-has-lang`, `html-lang-valid`, `meta-viewport`,
    `aria-hidden-body`. The region also contains no form control, list, `<summary>` or explicit ARIA
    role for the related rules to check.
  - What applied: `aria-allowed-attr`, `aria-conditional-attr`, `aria-hidden-focus`,
    `aria-prohibited-attr`, `aria-valid-attr`, `aria-valid-attr-value`, `color-contrast`,
    `duplicate-id-aria`, `image-alt`, `link-name`, `nested-interactive`, `target-size`.
- **S4 as served: 10. S4 refresh-stripped: 9.** The document is three paragraphs and links, with no
  form, image, ARIA or list, so most families have nothing to match. The single difference is
  `meta-refresh`: it applies only to the as-served reading, because the stripped reading removed the
  very tag it checks. That one-rule difference is the modification, measured.
- **S5 transport-failure and blocked: 29,** the same set as live S1.
- **S5 in-flight: 28.** `autocomplete-valid` is inapplicable, because every field control is
  `disabled` in this state.
- **S5 success: 23.** `autocomplete-valid`, `button-name`, `form-field-multiple-labels`, `label`,
  `select-name` and `summary-name` are inapplicable. The form subtree is replaced by the
  confirmation card, and no element for those six rules remained in scope.

---

## 3. Findings per surface and state

Every cell holds a number. A zero is a measurement: the rule set above ran and the engine returned
no violation at that impact.

| Surface / state | critical | serious | moderate | minor | violations (total) | incomplete |
|-----------------|---------:|--------:|---------:|------:|-------------------:|-----------:|
| S1 / default | 0 | 0 | 0 | 0 | 0 | 0 |
| S1 / disclosure-expanded | 0 | 0 | 0 | 0 | 0 | 0 |
| S1 / error-summary | 0 | 0 | 0 | 0 | 0 | 0 |
| S1 / mobile-nav-open | 0 | 0 | 0 | 0 | 0 | 0 |
| S3 / products-region | 0 | 0 | 0 | 0 | 0 | 0 |
| S4 / as-served | 0 | 0 | 0 | 0 | 0 | 1 |
| S4 / refresh-stripped | 0 | 0 | 0 | 0 | 0 | 1 |
| S5 / in-flight | 0 | 0 | 0 | 0 | 0 | 0 |
| S5 / success | 0 | 0 | 0 | 0 | 0 | 0 |
| S5 / transport-failure | 0 | 0 | 0 | 0 | 0 | 0 |
| S5 / blocked | 0 | 0 | 0 | 0 | 0 | 0 |
| **All 11 entries** | **0** | **0** | **0** | **0** | **0** | **2** |

**Total violation count across the record: 0.** That is the sum of `violations.length` over all 11
entries, and equally the sum of `violationCount`. Every entry's `impactCounts.unknown` is also 0.

**Contrast, specifically (RESEARCH Pitfall 11).** `color-contrast` is `serious`, so it is one of the
two impacts that block under D-OQ-1. It was in the applicable set on **all 11 entries**, and it
returned **0 violations and 0 incomplete** on each. The engine reports a computed ratio against the
required threshold only on a failing or undeterminable node. Neither occurred, so this record holds
**no contrast ratio to report**. The record keeps violation and incomplete detail, not per-node pass
detail, so the ratios of the nodes that met the threshold are not in it.

---

## 4. Blocking findings: the triage list for plan 05-14

Blocking under D-OQ-1 means a **violation** at impact `critical` or `serious`
(`BLOCKING_IMPACTS` in `e2e/fixtures/axe.ts`).

**Count: 0.** No entry returned a violation at either blocking impact, so there is no numbered
blocking item. Plan 05-14 inherits an empty blocking list, **B-0: none**. That is a count, not an
omission.

### Handed forward alongside it: one review item that is not a violation

axe returned one `incomplete` result, meaning it could not decide either way. Incomplete results
are not violations, so they fall outside the D-OQ-1 violation count, and this file does not
classify them as blocking. One of them carries a blocking impact, though, and plan 05-14 must decide
how its gate treats serious incompletes. It is therefore named here with its full detail and not
left for the gate to discover.

**R-1: `bypass`, impact `serious`, on S4 (both readings, the same node).**

| Field | Value |
|-------|-------|
| Rule | `bypass`: "Page must have means to bypass repeated blocks" (`wcag2a`, `wcag241`) |
| Result bucket | `incomplete` (undeterminable), **not** `violations` |
| Surface / state | S4 / as-served **and** S4 / refresh-stripped |
| Node target | `html` (`<html lang="en">`) |
| Failure summary | Fix any of the following: No valid skip link found · Page does not have a heading · Page does not have a landmark region |
| Help | https://dequeuniversity.com/rules/axe/4.13/bypass?application=playwright |

Context for 05-14, as evidence and not a verdict:
- The three things axe looked for and did not find are exactly the three absences 04.2 D-12 defines
  as correct for this document. Those are the ones `AXE_PER_URL_DISABLES` records for S4 (no `<h1>`,
  no `<main>`, no region).
- `bypass` itself is **not** disabled for S4, and must not be. `fixtures/axe.ts` forbids a `bypass`
  entry for any surface. A decision about R-1 belongs in the gate's review record, not in the
  disable table.
- WCAG 2.4.1 concerns blocks *repeated across pages*. S4 is a single three-paragraph document with
  no navigation block. Whether that settles R-1 is a human judgment for 05-14 to record. It is not
  settled here.
- R-1 is **not** F5. F5 is the ZERO-PAPER HUB *home page*. S4 is the separate retired-path document
  at `/products/haoo/`.

---

## 5. Recorded-only findings

These are violations at the impacts D-OQ-1 records without failing: `moderate` and `minor`.

**Count: 0.** Moderate 0, minor 0, across all 11 entries. No finding at either impact exists to
list, and none was discarded to reach that count.

---

## 6. Boundary notes

**ZERO-PAPER HUB scope, decision D-OQ-3.** The ZERO-PAPER HUB side is measured at the Products region
(`#products`) and nowhere else on the home page. A finding outside that region is out of scope by
D-OQ-3 and belongs in the already-recorded deferred set in `05-UI-SPEC.md` § "Deferred to a Future
ZERO-PAPER HUB Phase", not in the triage list above. This baseline raised **no** new finding there.
It does not re-raise the three known deferred findings, which are cross-referenced by identifier:

- **F4**: `green-400` focus ring on the ZPH contact-form inputs, ≈1.74:1 (WCAG 2.2 SC 1.4.11), with
  its guard gap **F4b** (`App.tsx` absent from ZPH's `FOCUS_SOURCES`). The contact form is outside
  `#products`. `color-contrast` also does not measure focus-ring contrast, so this run could not
  have observed F4 even inside scope.
- **F5**: no `<main>` and no skip link on the ZPH home page (WCAG 2.4.1). On S3 the page-level
  `bypass` rule is recorded in `pageLevelRuleIdsOutOfScope`: it was not run against a region, and it
  was not disabled. F5 is therefore neither confirmed nor suppressed by this record. It stays where
  D-OQ-3 put it.
- **F6**: no `prefers-reduced-motion` handling on the ZPH home page (WCAG 2.3.3). No rule in the
  five tags measures motion preference.

**Hit targets: two different numbers, and they measure different things.**

| Number | What it is | What this record says about it |
|--------|-----------|--------------------------------|
| **24 × 24 CSS px** | WCAG 2.2 SC 2.5.8 minimum, checked by the `target-size` rule that the `wcag22aa` tag brings (RESEARCH Pitfall 12: the only rule that tag adds) | `target-size` applied on S1 (all 4 states), S3 and S5 (all 4 states), with **0 violations and 0 incomplete**. On S4 it was inapplicable (the document's links sit inside paragraph text) |
| **44 × 44 CSS px** | This phase's floor for **primary actions** (`05-UI-SPEC.md` § VC-2, matching the shipped `min-h-11` / `size-11`) | **Not measured by this record.** axe has no rule for it. A result of 0 `target-size` violations means every applicable target met the 24 × 24 minimum or its spacing exception. It does **not** mean any primary action is 44 × 44. That assertion belongs to the viewport spec's VC-2 measurement |

**What this baseline did not measure**, named so it is not read as covered:
- S2 (the HAOO `<noscript>` document), which is not in this plan's sweep;
- heading order (§1);
- the 7 tag-excluded WCAG-tagged rules (§2);
- the 44 × 44 primary-action floor (above).

---

## 7. Disposition

This baseline is exploratory and non-gating. Its blocking list (0 entries, plus review item R-1) is
the input to plan 05-14, and no finding was removed from it by a configuration change.

---

## 8. Triage (plan 05-14, Task 1)

**What this section covers.** It disposes of the numbered blocking list in §4 (B-0: none) and of the
four items earlier plans handed to 05-14 by name. §1 to §7 are 05-07's record and were not edited.
The gate run, its integer counts, the unchanged-configuration statement and the deployment note are
added by Task 3, after the owner has answered the Task 2 checkpoint.

### 8.1 A re-read on the builds serving now

§4 was measured at 2026-09-11T21:22Z. Three changes since then affect what the targets serve:

- **HAOO live.** The F1-LIVE deploy (Deploy HAOO run `34687312104`, commit `c39cc5a`) landed at
  about 10:13Z on 2026-09-12, followed by run `34715004127` (commit `ea538c0`). The 05-07 entries do
  not record a bundle name, so the only identification of the S1 baseline build is that it predates
  run `34687312104`.
- **ZERO-PAPER HUB live.** Deploy ZERO-PAPERHUB run `34714952939` (`main` at `3525f6d`) ran after
  the baseline. `git diff` of `public/` and `src/` between the last commit before the baseline and
  `3525f6d` is empty, so the S3 and S4 source is unchanged.
- **HAOO working tree.** 05-13's `65a612a` changed `src/pages/ProductPage.tsx` and `src/index.css`.
  It is committed but not deployed.

So the list was read again with the unchanged spec `e2e/axe-baseline.e2e.ts` and the unchanged
factory, on both projects. The run covered 2026-09-12T20:16:53Z to 20:17:27Z, with 11 run and 11
skipped (each test skips on the other project), exit 0.

| Target | Build measured | Identified by |
|--------|----------------|---------------|
| live S1 | `/assets/haoo-D1dl6F2P.js`, SHA-256 `d607c149ca785c58c5f26183852367aa52badcb02ee8bbad93e0daf136f6b508` | Fetched from `https://www.haoo.online/` at 2026-09-12T20:15:44Z. It does **not** include `65a612a` |
| live S3, S4 | ZERO-PAPER HUB `main` `3525f6d`, deployed by run `34714952939`, served through Cloudflare | The deploy run recorded in `05-15-SUMMARY.md` |
| preview S5 | `dist/assets/haoo-CNGGkFFJ.js`, SHA-256 `544c52d854cfc1d9d37ecb356ef8aab81a67a8362562e658b64e6f4f1f1b8ccc` | Built 2026-09-12T20:16:08Z by `npm test` from the clean HAOO tree at `f1f9637`. It **includes** `65a612a` |

| Surface / state | Selected (baseline → re-read) | Applicable | Violations | Incomplete |
|-----------------|------------------------------:|-----------:|-----------:|-----------:|
| S1 / default | 63 → 63 | 29 → 29 | 0 → 0 | 0 → 0 |
| S1 / disclosure-expanded | 63 → 63 | 29 → 29 | 0 → 0 | 0 → 0 |
| S1 / error-summary | 63 → 63 | 29 → 29 | 0 → 0 | 0 → 0 |
| S1 / mobile-nav-open | 63 → 63 | 29 → 29 | 0 → 0 | 0 → 0 |
| S3 / products-region | 62 → 62 | 12 → 12 | 0 → 0 | 0 → 0 |
| S4 / as-served | 63 → 63 | 10 → 10 | 0 → 0 | 1 → 1 (`bypass`, `serious`, `html`) |
| S4 / refresh-stripped | 63 → 63 | 9 → 9 | 0 → 0 | 1 → 1 (`bypass`, `serious`, `html`) |
| S5 / in-flight | 63 → 63 | 28 → 28 | 0 → 0 | 0 → 0 |
| S5 / success | 63 → 63 | 23 → 23 | 0 → 0 | 0 → 0 |
| S5 / transport-failure | 63 → 63 | 29 → 29 | 0 → 0 | 0 → 0 |
| S5 / blocked | 63 → 63 | 29 → 29 | 0 → 0 | 0 → 0 |

Across the 11 re-read entries, the impact counts are critical 0, serious 0, moderate 0, minor 0 and
unknown 0. `color-contrast` was applicable on 11 of 11 entries, with 0 violations and 0 incomplete.
The engine was `axe-core` 4.13.0 with 5 tags.

**Where the re-read output went.** The spec upserts into `evidence/axe-baseline.json`. After the
run, that file was restored with `git checkout -- evidence/axe-baseline.json`, so §1 to §7 still
derive from the record they cite. The re-read's values are the ones in the tables above.

### 8.2 The numbered blocking list

| # | Rule | Surface / state | Disposition | Detail |
|---|------|-----------------|-------------|--------|
| B-0 | none | none | none | §4 has no numbered entry, and the re-read in §8.1 returned 0 blocking violations |

**Counts from the numbered list:** FIXED 0, DEFERRED 0, ACCEPTED (escalated) 0.

Each zero follows from the empty list, not from work being skipped:

- **No source file changed.** `tailwind.config.js` and the seven components in the plan's file list
  are untouched, so the static focus-contrast gate and the axe gate cannot disagree about a colour.
  `npx vitest run src/test/focus-contrast.test.ts` ran 11 tests and exited 0. `npm test` ran 684
  tests across 10 files and exited 0.
- **The configuration is unchanged.** `git diff --quiet HEAD -- e2e/fixtures/axe.ts` exits 0. The
  file still holds 5 tags, 3 per-URL disables (S4 only), and `BLOCKING_IMPACTS` of `critical` and
  `serious`.

### 8.3 Items handed to 05-14 by name, and where each went

| ID | Handed over by | What it is | Where it went |
|----|----------------|------------|---------------|
| **R-1** | 05-07 (§4) | `bypass`, impact `serious`, in axe's **incomplete** bucket. Node `html`, on S4 as-served and S4 refresh-stripped, in both the baseline and the re-read | **Escalated to the Task 2 checkpoint** |
| **O-1** | 05-11 | Cloudflare injects a bot-management bootstrap and the Web Analytics beacon into the served S4 document | **Not triaged here, not escalated here.** It stays an open owner decision where 05-11 recorded it |
| **FS-O1** | 05-12 | 2 `role="status"` elements in the document whenever the form card renders, against 1 submission region | **Not triaged here, not escalated here.** Handed to phase verification |
| **G-1** | 05-15 | `verify-tree-disjointness.mjs` exits 0 when an allowlist entry is no longer shared by both trees | **Not triaged here, not escalated here.** Logged in `deferred-items.md` |

**R-1: why it is escalated.** 05-07 reserved R-1 for a human judgement, and none of the three
dispositions this plan permits an executor to record fits it:

- It is not on the numbered list. It is an incomplete result, not a violation.
- **FIXED would mean adding a skip link, a heading or a landmark** to a document that 04.2 D-12
  defines as minimal ("a static document, not a route"). That document lives in the ZERO-PAPER HUB
  repository (`public/products/haoo/index.html`, last changed in `11d0df3`). Adding a heading or a
  landmark would also leave the S4 rows of `AXE_PER_URL_DISABLES` giving reasons that no longer
  match the page, in a file this plan must keep byte-unchanged.
- **DEFERRED under D-OQ-3 does not apply.** D-OQ-3 covers the ZERO-PAPER HUB home page outside
  `#products`. S4 is a registered surface in its own right, and it is not F5's document.
- **ACCEPTED can only be recorded in the owner's words.**

The owner's disposition also settles how the Task 3 gate treats a `serious` incomplete result.

**O-1: why it is neither.** No axe rule counts scripts or identifies third-party beacons. The
authored document carries 0 `<script>` elements, re-counted in
`ZERO-PAPERHUB/public/products/haoo/index.html`. The injection comes from the ZERO-PAPER HUB
Cloudflare zone's configuration, which is outside both repository trees and outside this plan's
accessibility dispositions. It remains in `05-11-SUMMARY.md` coverage D8 (`human_judgment: true`)
and in `05-EVIDENCE-RECOVERY.md`, for the owner and the future ZERO-PAPER HUB phase.

- **Its measured effect on this plan:** the S4 scans ran on the document as a browser receives it,
  beacon included, and returned 0 violations and exactly R-1.
- **A citation to correct:** the 04.2 decision the beacon conflicts with is D-12, which says the
  document "carries no measurement". The S4 contract in `05-UI-SPEC.md` attributes its exactly-zero
  script assertion to "04.2 D25". In the 04.2 record, D25 is a different item: the stranded browser
  record at the retired origin.

**FS-O1: why it is neither.** No axe rule counts status regions, and both regions sat inside scans
that returned 0 violations in every S1 and S5 state. The open question is how to read FS-2's wording
("exactly one such region", in a paragraph describing the submission region outside the form card).
It is not a defect with a fix, a deferral or an acceptance. The measured values stay in
`05-EVIDENCE-FORM-STATES.md` §7: the submission region is 1 at every measured moment, and the
document holds 2 whenever the card renders, the second being the measurement disclosure's
clear-context region. 05-12 named verification as the other place the wording can be reconciled,
and it is handed there.

**G-1: why it is neither.** It is not an accessibility finding. Fixing it means changing
`scripts/verify-tree-disjointness.mjs`, which is byte-identical in both repositories (`cmp` exit 0 on
2026-09-12) and outside this plan's file list. That would require a paired ZERO-PAPER HUB commit
that no evidence in this plan forces (05-CONTEXT D-03). 05-17 runs the auditor, but its plan does
not name G-1, so G-1 is logged in `deferred-items.md` rather than assumed to be covered.

**Known fixture gap, recorded and not edited.** `PRIMARY_ACTIONS` declares 4 instances each for P5
and P6, and the page ships 3 under those names (05-11 O-2, and 05-08's census at all six widths).
It is not an axe result. `e2e/fixtures/primary-actions.ts` is not touched.

**Cross-referenced, not raised again.** F4, F4b, F5 and F6 (`05-UI-SPEC.md` § Deferred) and VP-O1,
VP-O2 and VP-O3 (`05-EVIDENCE-VIEWPORT.md`) all sit on the ZERO-PAPER HUB home page outside
`#products`. D-OQ-3 defers them, and that deferral is a **scope decision, not a severity
judgement**. None of them is in the axe list, because S3 is scoped to `#products`, and the re-read
raised no new finding there.

### 8.4 What Task 2 receives

- **From the numbered blocking list:** 0 findings.
- **Escalated review items:** 1, which is R-1.
