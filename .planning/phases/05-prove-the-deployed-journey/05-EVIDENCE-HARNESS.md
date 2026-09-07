# 05 — The Evidence Harness: what the first live run measured

**Plan 05-03, the phase tracer.** This file records *measurements*, not pass marks. Every number
below was produced by a command run in the HAOO checkout on 2026-09-07 and is reproducible from the
committed tree. Where a value contradicts what `05-RESEARCH.md` predicted, the measured value stands
and the contradiction is stated rather than smoothed over.

The raw artefact is `evidence/tracer.json`, written by `e2e/tracer.e2e.ts` itself. This document is
the human reading of it plus the three decisions the run settled.

---

## 1. The package legitimacy gate — measured live, and why the automated seam was wrong

Two devDependencies entered the repository, both at exact pins with no caret. The blocking-human
checkpoint that opens this plan was cleared by the owner (verbatim: "approved") **after** these
figures were re-measured live at execution time. These are the execution-time numbers, not the ones
`05-RESEARCH.md` recorded during planning:

| Measurement | `@playwright/test` | `@axe-core/playwright` |
|---|---|---|
| Version installed | `1.63.0` (exact pin) | `4.13.0` (exact pin) |
| `npm view <pkg> time.created` | **2020-09-24T05:44:34.469Z** | **2021-06-02T15:18:16.053Z** |
| Package age at install | ~5 years 11 months | ~5 years 3 months |
| Downloads, week 2026-08-31 → 2026-09-06 | **54,399,047** | **9,082,376** |
| `repository.url` | `github.com/microsoft/playwright` | `github.com/dequelabs/axe-core-npm` |
| `npm view <pkg> deprecated` | empty (not deprecated) | empty (not deprecated) |
| `postinstall` script | **none** (`scripts` is `{}`) | **none** |

### The SUS / `too-new` verdict was a false positive, and the mechanism is now known

The Package Legitimacy Audit in `05-RESEARCH.md` returned **SUS** for both packages with the single
reason `too-new`. The audit's automated seam read the registry's `publishedAt` as the *latest
version's* publish timestamp rather than the *package's first publish*. Those two fields are far
apart here, and the gap is exactly what produced the false alarm:

```
@playwright/test      created = 2020-09-24T05:44:34.469Z   time["1.63.0"] = 2026-09-04T22:44:00.304Z
@axe-core/playwright  created = 2021-06-02T15:18:16.053Z   time["4.13.0"] = 2026-08-11T17:07:40.763Z
```

Read the right-hand column and both packages are 3 and 27 days old. Read `time.created` and they are
nearly six and five years old, from Microsoft and Deque respectively. A `too-new` heuristic pointed
at a *version* timestamp will fire on every actively-maintained package in existence, which is the
opposite of what the heuristic is for. This is recorded here so a future audit does not re-derive the
same false positive and either re-escalate it or, worse, learn to ignore the seam.

**The gate itself was not skipped.** A legitimacy checkpoint is never auto-approved; the owner
confirmed both packages independently before any install ran.

### One live finding the owner accepted explicitly: a dormant `prepare` script

`@axe-core/playwright@4.13.0` carries, verbatim from `npm view @axe-core/playwright@4.13.0 scripts`:

```
prepare: 'npx playwright install && npm run build'
```

A script that downloads browser binaries during install is worth naming rather than waving past. It
is **dormant here, by construction**: npm runs `prepare` only for **git-dependency and
local-directory** installs, never for a published-tarball install resolved from the registry. This
install used the registry with no git URL — which is why `05-03-PLAN.md` states "Do not install from
a git URL" as an instruction rather than a preference, and why threat T-05-SC lists registry-only
installation as part of its mitigation. If a future change ever resolves this package from a git
reference, the script fires and this mitigation is void.

Neither package has a `postinstall`. The one install-time script in the pair is the `prepare` above.

---

## 2. The tracer run — measured values with their provenance

Command: `npx playwright test --project=live e2e/tracer.e2e.ts`
Run at: **2026-09-07T19:10:46.066Z**
Target: **https://www.haoo.online/** (live production, `live` project)
Viewport: **360 × 800** — the narrowest entry in the D-09 closed list

A count with no provenance is not evidence, so the engine version and the exact tag list travel with
every number below.

### axe provenance

| Field | Measured value |
|---|---|
| `results.testEngine.name` | `axe-core` |
| `results.testEngine.version` | **4.13.0** |
| Resolved by | `@axe-core/playwright@4.13.0` → `axe-core: ~4.13.0` (transitive; **no direct `axe-core` entry** in `package.json`, so no version split is possible) |
| Tag list sent | `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` |
| Scope expressed as | a **single** `options({ runOnly: { type: 'tag', values: [...] } })` call — see §3 |
| Rules that executed | **29** |
| Distinct tag families returned | **69** |
| Violations | **0** |
| Incomplete | **0** |
| Passes | **29** |

The 29 rule ids that executed, in full (this is the scope claim; without it "0 violations" says
nothing about what was looked for):

```
aria-allowed-attr, aria-conditional-attr, aria-deprecated-role, aria-hidden-body,
aria-hidden-focus, aria-prohibited-attr, aria-required-attr, aria-roles, aria-valid-attr,
aria-valid-attr-value, autocomplete-valid, button-name, bypass, color-contrast,
document-title, duplicate-id-aria, form-field-multiple-labels, html-has-lang,
html-lang-valid, image-alt, label, link-name, list, listitem, meta-viewport,
nested-interactive, select-name, summary-name, target-size
```

**The tracer measures; it does not gate.** The violation list is recorded, not asserted against the
D-OQ-1 `critical`/`serious` threshold. No axe run had ever been performed against this site, and a
baseline that fails on discovery teaches nothing. Plan 05-05 owns the gating run. The one axe
assertion here is structural — see §3.

### The rest of the live surface

| Measurement | Value |
|---|---|
| HTTP status for `/` | 200 |
| `<h1>` text | `Run the business—not the paperwork.` |
| `navigator.webdriver` | **`true`** |
| Requests to `https://us.i.posthog.com` | **`[]`** (empty) |
| Overflow escapees at 360 px | **`[]`** (empty) |
| Overflow tolerance | exactly **1 CSS px**, for subpixel rounding, with no epsilon anywhere else |

The overflow sweep is a **per-element** walk of `document.body.getElementsByTagName('*')`, skipping
`visibility: hidden` / `display: none`, the `sr-only` utility, the honeypot's `-left-[10000px]`
offset, and zero-area boxes. A bare `document.documentElement.scrollWidth > clientWidth` comparison
is deliberately *not* written as the whole check: both top-level wrappers ship `overflow-x-hidden`,
so the mask absorbs real overflow and that comparison passes vacuously. It is a non-assertion
wearing the costume of one.

---

## 3. Research open question A2 — answered by measurement: **replacement**

> **A2:** Does `AxeBuilder.withTags()` combined with `AxeBuilder.withRules()` produce the **union**
> of the two sets, or does the later call **replace** the earlier?

The vendor README's phrasing is ambiguous, and the difference is not academic. If the calls replace,
a builder written the obvious way — `withTags([...five WCAG tags]).withRules(['heading-order'])` —
runs **one advisory rule** while reporting itself as a full-conformance pass. That is the most
dangerous shape a conformance check can take, and it is invisible from the outside: the run is green,
fast, and wrong.

The tracer therefore ran **both orderings** on the live page, so the answer distinguishes "last call
wins" from "`withRules` always wins":

| Builder, as written | Rules that executed | Distinct tags | `heading-order` ran? |
|---|---|---|---|
| `.withTags([...5 WCAG tags]).withRules(['heading-order'])` | **1** (`heading-order`) | **2** (`best-practice`, `cat.semantics`) | yes |
| `.withRules(['heading-order']).withTags([...5 WCAG tags])` | **29** | **69** | **no** |

### The answer

**`composition: "replacement"`. The mechanism is last-call-wins:** each of `withTags` and
`withRules` overwrites `runOnly` wholesale, so whichever call is written *second* is the only one in
effect. It is not "`withRules` always wins" — reversing the order reverses the outcome. They do not
union.

The intuitive ordering is the catastrophic one: writing `withTags(...)` first and `withRules(...)`
second narrows a five-tag WCAG conformance sweep down to a **single `best-practice` rule**, a 29 → 1
collapse, with no warning and no error.

### What this run does about it

The conformance run in §2 is expressed as **one** `options({ runOnly: { type: 'tag', values } })`
call — the fallback `05-RESEARCH.md` § Pattern 4 pre-specified for exactly this outcome. `.options()`
is never combined with `.withTags()` on the same builder; the README states it overrides, and the
table above is the measured proof that such an override is silent.

The structural guard that keeps this closed: the tracer asserts the distinct tag-family count is
**≥ 3**, and it derives that count from `passes ∪ violations ∪ incomplete` — the set of rules that
actually *executed*. Reading `violations` alone would report an empty run and a fully-narrowed run
identically. Measured: **69 ≥ 3**. Had the run silently narrowed, it would have measured 2 and
failed, naming the surviving rule.

### The consequence plan 05-05 inherits — stated here so it cannot be rediscovered late

`heading-order` is a **`best-practice`-tagged rule**, and the UI-SPEC's tag list deliberately
excludes `best-practice` (advisory findings would fail surfaces for recorded decisions rather than
defects). So:

- The WCAG tag list alone does **not** run `heading-order`. Measured: `headingOrderRan: false` in the
  conformance run.
- It **cannot** be re-added with `withRules(['heading-order'])`, because that call replaces the tag
  list and narrows the run to that one rule.

**Therefore plan 05-05's `AxeBuilder` factory must carry a spec-authored heading-order assertion
instead** — a direct DOM walk of `h1`…`h6` in the spec, not an axe rule. This is not optional
polish: QUAL-03 names semantic heading order explicitly, and after A2 there is no axe configuration
that delivers both it and the WCAG sweep from one builder.

---

## 4. The PostHog test-traffic decision — decided, with evidence, not discovered

`05-CONTEXT.md` left to planning "whether that is handled by running the live evidence pass with
measurement suppressed, by a HogQL exclusion, by a documented run window, or by an explicit note".

### The decision

**The live evidence pass runs with no change to shipped production code and no HogQL exclusion.** The
`posthog-js` bot filter that already ships drops events from any browser reporting
`navigator.webdriver`, so the suppression this phase needs is already deployed. Nothing is built.

That matters beyond convenience: this phase's boundary forbids changing shipped production code, so
a purpose-built kill switch on the live page would have breached the boundary to re-implement a
guarantee the bundle already provides.

### The evidence — asserted in the harness, not trusted

`05-RESEARCH.md` records `navigator.webdriver === true` under Playwright as **assumption A1**, and
the entire suppression argument rests on it. The tracer converts it into a measurement:

- `navigator.webdriver` evaluated in the live page: **`true`**
- Requests to `https://us.i.posthog.com` recorded across the full page lifecycle: **`[]`**

The request listener is registered **before** `page.goto()` — a listener attached afterwards would
miss exactly the requests it exists to catch — and the page is allowed to settle
(`networkidle` + 2 s) before the list is asserted empty. The approved origin is read from
`config/approved-analytics-hosts.ts`, the repository's own trust anchor, rather than retyped, so the
spec asserting nothing reaches the sink uses the same source every production path is required to
use.

### Why the shipped configuration leaves the filter armed

`src/measurement/posthog-lockdown.ts` sets 30+ keys, and the two that would *disarm* the bot filter
are **not among them**:

- `opt_out_useragent_filter` — **not set** (SDK default `false`, so the filter stays on)
- `__preview_capture_bot_pageviews` — **not set** (so bot pageviews are not force-captured)

The locked key set is `token, api_host, ui_host, defaults, internal_or_test_user_hostname,
autocapture, rageclick, capture_dead_clicks, capture_pageview, capture_pageleave,
disable_session_recording, disable_surveys, disable_surveys_automatic_display, disable_product_tours,
disable_conversations, disable_web_experiments, capture_heatmaps, capture_exceptions,
capture_performance, disable_scroll_properties, advanced_disable_flags,
advanced_disable_feature_flags, advanced_disable_toolbar_metrics,
disable_external_dependency_loading, opt_in_site_apps, person_profiles, persistence,
disable_persistence, disableDeviceModel, save_referrer, save_campaign_params,
custom_campaign_params, before_send`. Neither disarming key appears. The deployed SDK is
`posthog-js@1.425.1`, whose `capture()` returns early — before any transport call — when
`isLikelyBot()` returns `!!navigator.webdriver`.

### The named fallback, if that assertion ever goes red

If a future run measures a non-empty ingestion list, the decision falls back to **a HogQL exclusion
in `src/reporting/generate.ts`**, bounded the same way `HAOO_DOMAIN_CUTOVER_DAY = '2026-09-06'`
(`generate.ts`) already bounds every owner-report query. That mechanism is precedented in this
repository rather than invented, which is why it is the named fallback and a kill switch is not.

### The one known inclusion this decision does **not** cover

The single **D-12 tagged live submission** is a real human-driven action in a real browser, not a
Playwright run. `navigator.webdriver` is `false` there, the bot filter does not apply, and its
`qualify_submit` event **will be captured**. That is one event, and the owner report's count carries
it. It is named here so the number has a stated, known inclusion rather than an unexplained
discrepancy.

---

## 5. The two structural escapes, closed and measured

### Escape 1 — the harness was invisible to `npm run typecheck` (Pitfall 5)

`npm run typecheck` is one of the six gates **D-15** enumerates by name. It ran two projects:
`tsconfig.app.json` (`"include": ["src"]`) and `tsconfig.node.json`
(`"include": ["vite.config.ts", "config"]`). Neither covers `e2e/` or `playwright.config.ts`, so
every line of the new harness would have shipped unchecked *inside a green gate*.

Closed by a third project, `tsconfig.e2e.json` (`"include": ["e2e", "playwright.config.ts"]`),
referenced from `tsconfig.json` and wired into the script as a third
`tsc --noEmit -p tsconfig.e2e.json`. `strict`, `noFallthroughCasesInSwitch`,
`moduleResolution: "bundler"`, `isolatedModules`, `moduleDetection` and `noEmit` are byte-identical
to `tsconfig.node.json`: this is a third project, not a relaxation of the other two, as AGENTS.md
§ TypeScript requires.

**The gate proved itself immediately.** `05-03-PLAN.md` specified `"lib": ["ES2023"]` for the new
project, copied from `tsconfig.node.json`. Compiled with exactly that, the harness produced **11
errors** — `Property 'webdriver' does not exist on type 'Navigator'`, `Cannot find name 'window'`,
`Cannot find name 'Element'`, `Cannot find name 'document'`, and five `'element' is of type
'unknown'`. The bodies of `page.evaluate()` callbacks are real browser code that is *type-checked in
Node and executed in Chromium*, so the DOM lib must resolve for them. `lib` was therefore set to
`["ES2023", "DOM", "DOM.Iterable"]`. That widens what is **checked**; it weakens no strictness
setting, so the AGENTS.md directive is honoured. Had the third project not been added, those 11
errors would have shipped silently.

**A third tsconfig does not breach SPLT-01.** All three pre-existing tsconfigs are ground-A
(`@ground: scaffold`) entries on the ratified 26-path `shared-scaffold.txt` — toolchain owned by the
repository rather than by either product half — and ground-A entries already diverge between the two
trees (`package.json` differs today and `verify:disjoint` exits 0). `tsconfig.e2e.json` is **not**
added to that closed list: it exists in HAOO only, which is a path `../ZERO-PAPERHUB` does not have,
and a path present in one tree only is precisely what SPLT-01 asks for. Nothing in this plan was
installed in the ZERO-PAPER HUB checkout.

### Escape 2 — Vitest claims the conventional Playwright suffix (Pitfall 6)

Vitest's default `include` is `**/*.{test,spec}.?(c|m)[jt]s?(x)`, which claims the same `*.spec.ts`
suffix the Playwright community conventionally uses. A conventionally-named suite under `e2e/` is
collected by `npm test`, where it imports a browser runner that does not belong in the hermetic unit
run — and `npm test` is `vite build && vitest run`, with `src/test/build-output.test.ts` scanning the
built `dist/` tree. A network-dependent spec inside that command would make a hermetic bundle
assertion depend on a deploy, breaking **D-07** by construction. The trap has a second half: once the
files are renamed away from `*.spec.ts` to escape Vitest, Playwright's own default `testMatch`
(`**/*.@(spec|test).?(c|m)[jt]s?(x)`) matches nothing under `e2e/`.

Closed on three fronts, all of which are required together:

1. Every Playwright file is named `*.e2e.ts`, which the Vitest include glob does not match.
2. `playwright.config.ts` sets `testMatch: '**/*.e2e.ts'` — **mandatory, not stylistic**, because of
   the second half of the trap.
3. Belt-and-braces: `vitest.config.ts`'s `exclude` array is **extended** (not replaced) with
   `'e2e/**'` and `'.playwright-report/**'`. The four pre-existing entries and their `.claude/`
   incident comment are unchanged. This line is kept even though (1) already suffices, because the
   naming rule lives in a human's memory and this line does not.
4. `test:e2e` and `test:e2e:live` are separate scripts. Neither is folded into `test`.

### Vitest collected-test count, before and after

| Point of measurement | Collected tests | Files |
|---|---|---|
| Before the harness existed (`05-RESEARCH.md`, § Pitfall 6 baseline) | **683** | 10 |
| After the harness, before the `exclude` extension | **683** | 10 |
| After the harness and the `exclude` extension | **683** | 10 |

**Identical: 683 = 683 = 683.** Measured with `npx vitest list | grep -c ' > '`. The middle row is
the interesting one — it shows the `*.e2e.ts` naming alone already keeps the harness out, so the
`exclude` entry is genuinely belt-and-braces rather than the load-bearing mechanism. The
counterfactual is recorded in `05-RESEARCH.md`: a single `e2e/probe.spec.ts` took the same suite from
683 to **684**, while a `probe2.e2e.ts` alongside it was not collected at all.

This is the proof for threat **T-05-12**: a network outage cannot redden the bundle assertions,
because the hermetic run never sees the harness.

### Full gate results with the harness present

| Gate | Result |
|---|---|
| `npm run typecheck` (now three projects) | exit **0** |
| `npm run lint` | exit **0** |
| `npm test` (`vite build && vitest run`) | exit **0** — 683 passed, 10 files |

---

## 6. The browser binary

Chromium is installed by `npx playwright install --with-deps chromium` into the Playwright cache
directory at **`~/.cache/ms-playwright/`** — outside both the HAOO and the ZERO-PAPER HUB checkouts,
and outside any git repository at all (`git rev-parse` from that directory reports
`not a git repository`). It is therefore **gitignored by construction**: no `.gitignore` rule is
needed or added for it, because it was never inside a tree that could track it. One engine was
installed, not three; Firefox and WebKit are Deferred by **D-09** on run-time cost.

`npx playwright --version` reports **`Version 1.63.0`**, matching the pinned package.

---

## 7. What is committed, and what is not

| Path | Committed? | Why |
|---|---|---|
| `evidence/tracer.json` | **yes** | The measured values are this phase's product |
| `evidence/playwright-run.json` | no | The JSON reporter's run record embeds absolute local filesystem paths (home directory, resolved node binary) — neither "URLs, status codes, rule ids and measurements", which is the exact basis on which **T-05-13** accepts the residual risk of a committed `evidence/*.json`. Rewritten by every run |
| `.playwright-report/` | no | Generated HTML report: a bundled viewer plus per-run assets |
| `.playwright-results/` | no | Per-test attachments, traces, failure screenshots |

Both run-artefact directories are dot-directories so the ESLint sweep does not walk them either.
`evidence/` as a directory is **not** ignored.

---

*Plan: 05-03 — Prove the Deployed Journey*
*Recorded: 2026-09-07*
