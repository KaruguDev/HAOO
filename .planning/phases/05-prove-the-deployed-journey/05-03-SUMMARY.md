---
phase: 05-prove-the-deployed-journey
plan: 03
subsystem: testing
tags: [playwright, axe-core, accessibility, e2e, typescript, vitest, posthog, evidence]

# Dependency graph
requires:
  - phase: 05-01
    provides: "The working-directory rule (D-01/D-04) — HAOO is the single home for the planning record, and nothing this phase creates enters shared-scaffold.txt"
  - phase: 04.1
    provides: "src/measurement/posthog-lockdown.ts and its 30+ locked keys, which is what makes the test-traffic suppression a decision with evidence rather than a thing to build"
  - phase: 04.2
    provides: "The live www.haoo.online deployment the tracer measures, and config/approved-analytics-hosts.ts as the ingestion-origin trust anchor"
provides:
  - "A runnable browser evidence instrument: npm run test:e2e (preview) and npm run test:e2e:live (live production)"
  - "playwright.config.ts — two projects (live | preview) sharing one spec set, testMatch '**/*.e2e.ts', config-level webServer"
  - "e2e/tracer.e2e.ts — the proven end-to-end slice every later spec expands"
  - "evidence/tracer.json — the first measured values from live production"
  - "tsconfig.e2e.json — the third TypeScript project that puts the harness inside npm run typecheck"
  - "05-EVIDENCE-HARNESS.md — the recorded answer to research open question A2, the PostHog test-traffic decision, and the axe provenance"
  - "The measured fact that AxeBuilder composition is REPLACEMENT, which every later axe factory must design around"
affects: [05-04, 05-05, 05-06, 05-07, 05-08, 05-09, 05-10]

actuals:
  tokens: 14054
  tasks: 3
  commits: 2

tech-stack:
  added:
    - "@playwright/test@1.63.0 (exact pin, devDependency)"
    - "@axe-core/playwright@4.13.0 (exact pin, devDependency)"
    - "axe-core@4.13.0 (transitive only — no direct entry, so no version split is possible)"
    - "Chromium browser binary (one engine, not three; ~/.cache/ms-playwright, outside both repos)"
  patterns:
    - "Playwright specs are named *.e2e.ts, never *.spec.ts — the Vitest default include glob claims the conventional Playwright suffix"
    - "Evidence specs MEASURE and record; gating thresholds live in the plan that owns the gate (05-05), not in the tracer"
    - "The axe conformance scope is one options({ runOnly }) call — withTags/withRules never chained, because they replace rather than union"
    - "Structural assumptions are asserted in the harness (navigator.webdriver, tag-family count) rather than trusted"
    - "Rule coverage is derived from passes ∪ violations ∪ incomplete — violations alone cannot distinguish an empty run from a narrowed one"

key-files:
  created:
    - playwright.config.ts
    - tsconfig.e2e.json
    - e2e/tracer.e2e.ts
    - evidence/tracer.json
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-HARNESS.md
  modified:
    - package.json
    - package-lock.json
    - tsconfig.json
    - vitest.config.ts
    - .gitignore

key-decisions:
  - "AxeBuilder composition is REPLACEMENT (last-call-wins), measured in both orderings on the live page: withTags then withRules ran 1 rule / 2 tags; withRules then withTags ran 29 rules / 69 tags"
  - "The conformance scope is therefore expressed as a single options({ runOnly: { type: 'tag' } }) call, never a withTags/withRules chain"
  - "heading-order cannot be re-added via withRules without narrowing the run to that one rule, so plan 05-05's axe factory must carry a spec-authored heading-order assertion"
  - "The live evidence pass runs with no change to shipped production code and no HogQL exclusion: the shipped posthog-js bot filter already drops navigator.webdriver traffic, proven by 0 ingestion requests during a live run"
  - "The Package Legitimacy Audit's SUS/too-new verdict was a false positive from reading the latest version's publish date as the package's creation date; both packages are 5-6 years old"
  - "tsconfig.e2e.json sets lib ['ES2023','DOM','DOM.Iterable'] rather than the planned ['ES2023'] — page.evaluate callback bodies are browser code type-checked in Node"
  - "tsconfig.e2e.json is NOT added to shared-scaffold.txt: it exists in HAOO only, and a path present in one tree only is what SPLT-01 asks for"

patterns-established:
  - "*.e2e.ts naming + explicit Playwright testMatch + a Vitest exclude entry: three defences, because the naming rule lives in a human's memory and the config lines do not"
  - "Every new TypeScript surface gets its own tsconfig project wired into npm run typecheck — an uncovered directory is an invisible gate"
  - "Overflow is measured per element, never by a document-width comparison, because overflow-x-hidden makes the latter pass vacuously"
  - "evidence/*.json carries measured values with provenance (engine version, exact inputs), never pass marks"

requirements-completed: [QUAL-01, QUAL-02, QUAL-03, QUAL-05]

coverage:
  - id: D1
    description: "One command runs a real Chromium against live https://www.haoo.online/ and returns measured values"
    requirement: "QUAL-01"
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/tracer.e2e.ts"
        status: pass
      - kind: other
        ref: "evidence/tracer.json — url https://www.haoo.online/, status 200, h1 'Run the business—not the paperwork.', generatedAt 2026-09-07T19:10:46.066Z"
        status: pass
    human_judgment: false
  - id: D2
    description: "An axe run executes against live production with recorded provenance: axe-core 4.13.0, the 5-tag WCAG list, 29 rules across 69 tag families, 0 violations"
    requirement: "QUAL-03"
    verification:
      - kind: e2e
        ref: "e2e/tracer.e2e.ts#measures live production — tagFamilies >= 3 assertion"
        status: pass
      - kind: other
        ref: "evidence/tracer.json axeCoreVersion/tagsSent/ruleIds/tagFamilies/violationCount"
        status: pass
    human_judgment: false
  - id: D3
    description: "Research open question A2 answered by measurement: withTags/withRules compose by REPLACEMENT, last-call-wins"
    requirement: "QUAL-03"
    verification:
      - kind: e2e
        ref: "e2e/tracer.e2e.ts — both orderings probed, recorded at evidence/tracer.json openQuestionA2"
        status: pass
    human_judgment: false
  - id: D4
    description: "Automated Playwright traffic against live production produces zero PostHog ingestion requests, asserted rather than assumed"
    requirement: "QUAL-01"
    verification:
      - kind: e2e
        ref: "e2e/tracer.e2e.ts — navigator.webdriver === true and ingestionRequests toEqual([])"
        status: pass
    human_judgment: false
  - id: D5
    description: "Zero per-element horizontal overflow at the 360px viewport, measured element-by-element rather than by a document-width comparison"
    requirement: "QUAL-02"
    verification:
      - kind: e2e
        ref: "e2e/tracer.e2e.ts — per-element sweep, 1 CSS px tolerance, overflowEscapees toEqual([])"
        status: pass
    human_judgment: false
  - id: D6
    description: "The harness compiles under npm run typecheck — inside one of the six gates D-15 enumerates, not outside them"
    requirement: "QUAL-05"
    verification:
      - kind: integration
        ref: "npm run typecheck (three tsc --noEmit -p invocations, third is tsconfig.e2e.json)"
        status: pass
    human_judgment: false
  - id: D7
    description: "npm test collects exactly the same number of Vitest tests after the harness as before it (683 = 683 = 683, 10 files)"
    requirement: "QUAL-05"
    verification:
      - kind: integration
        ref: "npx vitest list | grep -c ' > ' at three points of measurement"
        status: pass
      - kind: integration
        ref: "npm test — 683 passed, 10 files, exit 0"
        status: pass
    human_judgment: false
  - id: D8
    description: "Nothing is installed in ../ZERO-PAPERHUB and no entry is added to shared-scaffold.txt"
    requirement: "QUAL-05"
    verification:
      - kind: integration
        ref: "npm run verify:disjoint — 26 shared paths, 26 allowlist entries, 0 violations, exit 0"
        status: pass
    human_judgment: false
  - id: D9
    description: "The two new devDependencies were confirmed legitimate by a human before any install ran"
    verification:
      - kind: manual_procedural
        ref: "Task 1 blocking-human checkpoint — owner shown live registry evidence, replied 'approved'"
        status: pass
    human_judgment: true
    rationale: "A package-legitimacy gate is never auto-approved by construction. The owner's own reading of the two npm pages is the evidence; no command in this tree can substitute for it."

duration: 49 min
completed: 2026-09-07
status: complete
---

# Phase 05 Plan 03: The Evidence Harness Tracer Summary

**A real Chromium now measures live https://www.haoo.online/ in one command — axe-core 4.13.0 across 29 rules and 69 tag families with 0 violations, 0 overflow escapees at 360px, and 0 PostHog ingestion requests — with the harness inside `npm run typecheck` and outside `npm test`, and the axe rule-composition question answered by measurement rather than assumption.**

## Performance

- **Duration:** 49 min (resumed session; the live tracer run itself was recorded at 2026-09-07T19:10:46Z in the prior session)
- **Started:** 2026-09-07T18:53:00Z (approx., resumed after a session teardown killed the previous executor mid-plan)
- **Completed:** 2026-09-07T19:42:43Z
- **Tasks:** 3 (1 blocking-human checkpoint, 1 tracer, 1 auto)
- **Files modified:** 10

## Accomplishments

- **The whole evidence path is proven end to end on one thin slice.** A real Chromium reaches live production, an axe run executes against it, a per-element overflow sweep measures the 360px viewport, and every measured value lands in `evidence/tracer.json`. Nine more specs can now be written on top of a shape that is known to work rather than one that is hoped to.
- **Research open question A2 is answered by measurement, and the answer is the dangerous one.** `AxeBuilder.withTags()` and `.withRules()` do not union — they **replace**, last-call-wins. Both orderings were probed on the live page: `withTags(...).withRules(['heading-order'])` ran **1 rule across 2 tags**; the reverse ran **29 rules across 69 tags**. The intuitive ordering is the catastrophic one, collapsing a five-tag WCAG conformance sweep to a single `best-practice` rule with no error and no warning. Had this been discovered at the finish line, every axe result in the phase would have been a false green.
- **Two structural escapes closed, both measured rather than reasoned about.** The harness was invisible to `npm run typecheck` (Pitfall 5) and would have been swallowed by Vitest's default glob (Pitfall 6). The typecheck gate proved itself on its very first run — see Deviations.
- **The PostHog test-traffic question is decided with evidence, not discovered.** No production code changed, no HogQL exclusion added: the shipped `posthog-js` bot filter already drops `navigator.webdriver` traffic, and the tracer asserts both halves of that (`webdriver === true`, ingestion list empty) rather than trusting either.
- **The package legitimacy gate was cleared by a human, and the automated seam's false positive is now explained.** The SUS/`too-new` verdict came from reading the *latest version's* publish date as the package's creation date.

## Task Commits

1. **Task 1: BLOCKING HUMAN — package legitimacy gate** — no commit (a gate, not a change). Owner replied "approved" after being shown live registry evidence.
2. **Task 2: One live HAOO surface measured end to end** — `234b818` (feat)
3. **Task 3: Harness inside typecheck, outside npm test, decisions recorded** — `659a60f` (feat)

**Plan metadata:** see the `docs(05-03)` commit that carries this file.

## Files Created/Modified

- `playwright.config.ts` — Two projects (`live` @ https://www.haoo.online retries 2, `preview` @ localhost:4173 retries 0) sharing one spec set; `testMatch: '**/*.e2e.ts'`; config-level `webServer`; JSON reporter to `evidence/playwright-run.json`; scratch to `.playwright-results`
- `e2e/tracer.e2e.ts` — The proven slice: ingestion listener registered before navigation, `navigator.webdriver` asserted, the A2 double probe, the conformance run, a per-element overflow sweep, and the evidence writer
- `evidence/tracer.json` — The first measured values from live production, committed because they are the phase's product
- `tsconfig.e2e.json` — The third TypeScript project; `include: ["e2e", "playwright.config.ts"]`, `types: ["node"]`, strictness byte-identical to `tsconfig.node.json`
- `tsconfig.json` — Third reference appended; `files: []` untouched
- `package.json` / `package-lock.json` — Two exact-pinned devDependencies; `typecheck` extended to three projects; `test:e2e` and `test:e2e:live` added; `scripts.test` byte-unchanged
- `vitest.config.ts` — `exclude` extended with `e2e/**` and `.playwright-report/**`; the four original entries and the `.claude/` incident comment left byte-unchanged
- `.gitignore` — `.playwright-report/`, `.playwright-results/` and `evidence/playwright-run.json`; `evidence/` itself deliberately not ignored
- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-HARNESS.md` — The registry figures, the A2 answer with its consequence for 05-05, the PostHog decision with its fallback, the Vitest counts, and the browser-binary location

## Decisions Made

**1. The axe conformance scope is one `options({ runOnly })` call, never a `withTags`/`withRules` chain.**
Forced by the A2 measurement. `.options()` is never combined with `.withTags()` on the same builder either — the README says it overrides, and A2 is the measured proof that such an override is silent.

**2. Plan 05-05's axe factory inherits a spec-authored heading-order assertion.**
`heading-order` is `best-practice`-tagged, which the UI-SPEC's tag list deliberately excludes, and it cannot be re-added via `withRules` without reintroducing the replacement. QUAL-03 names semantic heading order explicitly, so after A2 there is no axe configuration that delivers both it and the WCAG sweep from one builder. This is written down here and in `05-EVIDENCE-HARNESS.md` so 05-05 does not rediscover it.

**3. No production code changes and no HogQL exclusion for test traffic.**
The shipped lockdown sets neither `opt_out_useragent_filter` nor `__preview_capture_bot_pageviews`, so `posthog-js@1.425.1`'s bot filter stays armed and `capture()` returns early for a webdriver browser. Measured: `webdriver: true`, `ingestionRequests: []`. Named fallback if that ever goes red: a HogQL exclusion in `src/reporting/generate.ts`, bounded like `HAOO_DOMAIN_CUTOVER_DAY`. One known inclusion this does not cover: the D-12 tagged human submission's `qualify_submit` **will** be captured, and the owner report carries it.

**4. The tracer measures; it does not gate.**
The axe violation list is recorded, not asserted against the D-OQ-1 `critical`/`serious` threshold. No axe run had ever been performed against this site, and a baseline that fails on discovery teaches nothing. The one axe assertion is structural (tag families ≥ 3). 05-05 owns the gating run.

**5. `tsconfig.e2e.json` is not added to `shared-scaffold.txt`.**
The closed 26-path list stays at 26. The new file exists in HAOO only, and a path present in one tree only is exactly what SPLT-01 asks for — `verify:disjoint` exits 0 with 0 violations. Adding it would have widened a closed list to permit something that was never a collision.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `tsconfig.e2e.json` needs the DOM lib, not the planned `lib: ["ES2023"]`**
- **Found during:** Task 3
- **Issue:** The plan specified copying `tsconfig.node.json` verbatim and keeping `"lib": ["ES2023"]`. Compiled with exactly that, the harness produced **11 errors**: `Property 'webdriver' does not exist on type 'Navigator'`, `Cannot find name 'window'` (×2), `Cannot find name 'Element'` (×2), `Cannot find name 'document'`, and five `'element' is of type 'unknown'`. The bodies of `page.evaluate()` callbacks are real browser code — type-checked in Node, executed in Chromium — so the DOM lib must resolve for them.
- **Fix:** `"lib": ["ES2023", "DOM", "DOM.Iterable"]`. This **widens what is checked** and weakens no strictness setting, so the AGENTS.md § TypeScript directive (do not weaken `strict`, `noFallthroughCasesInSwitch`, or bundler module resolution) is honoured — all three remain at `tsconfig.node.json`'s values.
- **Files modified:** `tsconfig.e2e.json`
- **Verification:** `npx tsc --noEmit -p tsconfig.e2e.json` exits 0; the 11-error probe run with `["ES2023"]` alone is recorded verbatim in `05-EVIDENCE-HARNESS.md` § 5.
- **Committed in:** `659a60f`
- **Note:** This is the typecheck gate justifying itself on its first run. Without the third project, those 11 errors would have shipped inside a green `npm run typecheck`.

**2. [Rule 1 - Correctness] The A2 probe is separated from the conformance run**
- **Found during:** Task 2 (prior session)
- **Issue:** The plan's step 6 described a single builder — `withTags(...).withRules(['heading-order'])` — that would both answer A2 *and* serve as the conformance run, asserting ≥3 tag families on it. Because the measured answer is **replacement**, that builder runs exactly one rule across two tags. The plan's own assertion would have failed the tracer, and the run it produced would have been the false green the assertion exists to catch.
- **Fix:** The A2 question is answered by **two dedicated probe builders** (both orderings, so the answer distinguishes last-call-wins from "`withRules` always wins"), and the conformance run is a separate builder using the single `options({ runOnly })` form that `05-RESEARCH.md` § Pattern 4 pre-specified as the fallback for exactly this outcome. Both probes' full results are recorded in `evidence/tracer.json` under `openQuestionA2`.
- **Files modified:** `e2e/tracer.e2e.ts`
- **Verification:** `tagFamilies: 69` (≥ 3) on the conformance run; `probeTagsThenRules.ruleCount: 1` and `probeRulesThenTags.ruleCount: 29` recorded as the evidence for the answer.
- **Committed in:** `234b818`

**3. [Rule 2 - Missing Critical] `evidence/playwright-run.json` gitignored despite living under a committed directory**
- **Found during:** Task 2 (prior session)
- **Issue:** The plan committed `evidence/` and pointed the Playwright JSON reporter into it. But T-05-13 **accepts** the residual disclosure risk of a committed `evidence/*.json` on the explicit basis that such a file "carries URLs, status codes, rule ids and measurements only". The reporter's output instead embeds absolute local filesystem paths (the checkout's home directory, the resolved node binary), which is neither — so committing it would have quietly voided the stated basis of an accepted threat.
- **Fix:** A single-file ignore rule for `evidence/playwright-run.json`, with the threat-model reasoning written into the `.gitignore` comment. `evidence/` as a directory is not ignored, and `evidence/tracer.json` (written by the spec itself, measurements only) stays committed.
- **Files modified:** `.gitignore`
- **Verification:** `git check-ignore evidence/tracer.json` reports not-ignored; the acceptance criterion "does not contain an `evidence/` rule" holds — this is a file rule, not a directory rule.
- **Committed in:** `234b818`

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 correctness, 1 missing critical)
**Impact on plan:** All three were necessary for the plan's own success criteria to be satisfiable. Deviation 2 is the most consequential: executing step 6 literally would have produced a red tracer, and "fixing" that redness by relaxing the tag-family assertion would have shipped the exact false green the assertion was designed to prevent. No scope creep — nothing was added beyond what the plan's stated goals require.

## Issues Encountered

- **A session teardown killed the previous executor after Task 2's work was complete but before it was committed.** The work survived in the git index. This continuation verified every Task 2 acceptance criterion against the staged tree before committing it, and did **not** re-run the live tracer to reproduce a result already recorded — `evidence/tracer.json` is the measured artefact, and re-running would have replaced a real measurement with a fresher but not more truthful one.
- **`npm test` runs `vite build` first and takes ~90s.** Not a problem, but worth noting: the e2e scripts are deliberately separate, so `npm run test:e2e` does not pay that cost and `npm test` does not pay a network cost.

## User Setup Required

None — no external service configuration required. The two devDependencies and the Chromium binary install from the public npm registry and the Playwright CDN respectively; the browser lives at `~/.cache/ms-playwright/`, outside both repositories and outside any git tree.

## Next Phase Readiness

**Ready for 05-04 and everything after it.** The instrument is proven, typechecked and isolated from the hermetic run. Concretely, later plans inherit:

- `npm run test:e2e` (preview) and `npm run test:e2e:live` (live) as the two entry points, with `baseURL` parameterised by project so specs never hardcode a host.
- The `*.e2e.ts` naming rule. A new spec named `*.spec.ts` will be collected by `npm test` and will break D-07 — the `vitest.config.ts` exclude is belt-and-braces, not the primary defence.
- **A hard constraint on 05-05:** the axe factory must use a single `options({ runOnly })` call and must carry a **spec-authored heading-order assertion**. Chaining `withTags` and `withRules` will silently narrow the run.
- The evidence-artefact convention: measured values with provenance (engine version, exact inputs), never pass marks.

**One open item this plan does not close:** the tracer's 0 violations is a *baseline*, not a gate. 05-05 must apply the D-OQ-1 `critical`/`serious` threshold and will be the first run that can fail on a real accessibility defect.

**No blockers.** Nothing was installed in `../ZERO-PAPERHUB`; `shared-scaffold.txt` remains at 26 entries and `verify:disjoint` exits 0.

## Self-Check: PASSED

All five created files verified present on disk with `[ -f ]`:
`playwright.config.ts`, `tsconfig.e2e.json`, `e2e/tracer.e2e.ts`, `evidence/tracer.json`, `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-HARNESS.md`.

Both task commits verified present in `git log --oneline --all`: `234b818`, `659a60f`.

Plan-level verification re-run at close-out:

| Check | Result |
|---|---|
| `evidence/tracer.json` assertions (tagFamilies ≥ 3, webdriver true, ingestion empty, overflow empty) | PASS — 69, true, 0, 0 |
| `npm run typecheck` (3 projects) | exit 0 |
| `npm run lint` | exit 0 |
| `npm test` | exit 0 — 683 passed, 10 files |
| Vitest count unchanged | 683 = 683 = 683 |
| `npm run verify:disjoint` | exit 0 — 26 shared, 26 allowlist, 0 violations |
| `05-EVIDENCE-HARNESS.md` contains `navigator.webdriver` | PASS |

No stubs, no skipped tests, no unrun `<verify>` blocks.

---
*Phase: 05-prove-the-deployed-journey*
*Completed: 2026-09-07*
