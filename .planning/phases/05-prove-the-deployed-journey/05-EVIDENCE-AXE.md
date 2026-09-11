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
