---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
plan: 03
subsystem: reporting
tags: [html-report, ui-spec-surface-a, css-has, progressive-enhancement, vocabulary-contract, accessibility, jsdom]

# Dependency graph
requires:
  - phase: 04-report-and-enrich-the-haoo-funnel-truthfully
    plan: "01"
    provides: "The proven report path: closed event-to-stage dictionary, fail-closed response validation, capability-injected generateHaooReport, and a minimal self-contained document with escaping"
  - phase: 03-build-privacy-bounded-engagement-context
    provides: "HAOO_MEASUREMENT_EVENTS closed ten-name tuple the report dictionary is typed against"
provides:
  - "The complete UI-SPEC Surface A document: header band, native period control, four pre-rendered period sections, collapsed stage cards, labelled scrollable event tables, authored empty state, always-visible caveat block"
  - "Script-free period switching through a CSS :has() rule written so an unsupporting browser shows all four periods in sequence"
  - "REPORT_STYLES: the inherited spacing, type, colour and focus-ring system reproduced as literal CSS with print and prefers-reduced-motion blocks"
  - "The authored copy dictionary for every owner-facing word in the report, typed against closed unions"
  - "A mutation-probed semantic-integrity suite: banned vocabulary over rendered text, zero percent signs, zero external resources, zero credential, three authored change forms"
affects: [04-05 provider enablement and source scans, phase verification, gsd-secure-phase, UAT visual and screen-reader checks]

# Actuals (#2632) — same estimateTokens scale (chars/4 over the realized diff).
actuals:
  tokens: 13985
  tasks: 2
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fail-open CSS disclosure: the :has() rule hides non-selected sections rather than showing the selected one, so a browser that cannot evaluate :has() drops the selector and renders everything"
    - "display: list-item on a details summary instead of flex, keeping the native disclosure marker while letting the summary parts stack below the medium breakpoint"
    - "Scoped vocabulary scanning: the authored denial block is excluded from the banned-term scan and pinned by exact text, with a separate contract proving the exclusion is the only place a banned term exists"

key-files:
  created: []
  modified:
    - src/reporting/haoo-report.ts
    - src/reporting/render.ts
    - src/reporting/generate.ts
    - src/test/haoo-report.test.ts

key-decisions:
  - "The banned-vocabulary scan excludes the authored caveat block, which is pinned by exact text instead, because the caveat's job is to deny the very claims the banned list forbids and it cannot do that without naming them."
  - "The period-exposure rule is written as hide-the-unselected, never show-the-selected, so losing :has() support degrades to all four periods visible rather than to an empty document."
  - "The stage summary uses display: list-item rather than flex, because a flex summary drops the native disclosure marker in Chromium and the marker is how open/closed state is exposed without colour."
  - "The generated report carries no percent sign at all, including in its CSS, so the owner can grep their own report for one and expect zero hits."
  - "The empty-state block renders only when the period has an inclusive window, so an all-time period whose range the provider did not resolve names no dates rather than inventing them."

patterns-established:
  - "Copy lives in the domain dictionary and the test holds a hand-typed second copy: the suite is an independent transcription of the locked contract rather than an import that would pass by construction."
  - "A suite that gates a truthfulness requirement is mutation-probed before it is trusted, and the probe results are recorded with the count of contracts each mutation kills."

requirements-completed: [MEAS-01, MEAS-08]

coverage:
  - id: D1
    description: "The report is one self-contained document — one h1, four h2, sixteen h3, one inline style element, and no script, external stylesheet, web font, image, frame, form, or absolute URL."
    requirement: MEAS-08
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A document structure > emits one h1, four h2 and sixteen h3 with no skipped heading level"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A semantic integrity > loads nothing from anywhere: no script, stylesheet, image, frame or absolute URL"
        status: pass
      - kind: other
        ref: "grep over a real generated file: 0 hits for <script, <link, <img, <iframe, http, @import, url("
        status: pass
    human_judgment: false
  - id: D2
    description: "All four period sections are pre-rendered; a native fieldset of four radios with the 30-day view checked selects one through a CSS :has() rule, and losing :has() leaves all four visible in sequence."
    requirement: MEAS-01
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A document structure > renders one reporting-period fieldset of four radios with the 30-day view checked"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A document structure > pre-renders all four period sections with nothing hidden by markup"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A document structure > hides a non-selected section only through a :has() rule, so no support means all visible"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each stage is a collapsed details/summary holding an h3 label, the stage total with its unit noun and the change value, expanding to the clarifier and a labelled keyboard-reachable event table; the all-time section omits the change and renders two columns."
    requirement: MEAS-01
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A document structure > wraps every event table in a keyboard-reachable labelled scroll region"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A document structure > renders the bounded column headers and the two all-time column headers"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A document structure > renders the singular unit noun for a total of one and the plural for zero"
        status: pass
    human_judgment: false
  - id: D4
    description: "A period whose counts are all zero renders the authored empty-state heading and body with its own inclusive dates and still renders four stage cards showing 0 recorded actions."
    requirement: MEAS-01
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A document structure > renders the authored empty state with its own dates and still renders four cards"
        status: pass
    human_judgment: false
  - id: D5
    description: "The caveat block is last, always visible, outside every collapsed element, and carries the full authored text."
    requirement: MEAS-08
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A document structure > keeps the caveat block last, always visible, and outside every collapsed element"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A semantic integrity > carries the whole authored caveat text, whitespace-normalised"
        status: pass
    human_judgment: false
  - id: D6
    description: "No word in the document outside the authored caveat block comes from the locked banned list, and no percent sign appears anywhere in the file."
    requirement: MEAS-08
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A semantic integrity > reproduces the locked banned list in full and scans rendered text, not markup"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A semantic integrity > allows a banned term only inside the exact authored caveat block"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A semantic integrity > renders no percent sign in the document text or anywhere in the file"
        status: pass
      - kind: other
        ref: "mutation probe: a banned term injected into a stage clarifier kills 3 contracts; a banned term smuggled into the caveat block kills 3"
        status: pass
    human_judgment: false
  - id: D7
    description: "Change values render only in the three authored forms, never as a percentage, never as plus-zero, never coloured, and no count is encoded as a shape or a directional glyph."
    requirement: MEAS-08
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A semantic integrity > renders every change value in one of exactly three authored forms"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A semantic integrity > encodes no count as a shape and colours no change value"
        status: pass
      - kind: other
        ref: "mutation probe: a percentage change value kills 4 contracts"
        status: pass
    human_judgment: false
  - id: D8
    description: "No credential and no authorization header name reaches the document, proven with a sentinel key distinct from the shared fixture."
    requirement: MEAS-08
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#Surface A semantic integrity > renders neither a sentinel credential nor an authorization header name"
        status: pass
    human_judgment: false
  - id: D9
    description: "At a 320px viewport and 200% browser zoom the four period labels, every stage clarifier, the longest event label, the metadata line and the full caveat paragraph wrap without clipping, ellipsis or overlap; the 44px targets are intact; the body never scrolls horizontally though a table may scroll inside its own region."
    requirement: MEAS-01
    verification: []
    human_judgment: true
    rationale: "The four backstop rows in the UI-SPEC UI Considerations tables (E1, E2, E3, E4 long-text). jsdom computes no layout, so wrapping, clipping, target size and overflow cannot be asserted by any contract in this suite. Requires a real browser at a real viewport."
  - id: D10
    description: "A screen reader announces the event labels in source order as views, attempts and outbound clicks, and expanding a stage announces its table caption; a stranger reading the document concludes nothing about the same person moving between stages."
    requirement: MEAS-08
    verification: []
    human_judgment: true
    rationale: "The plan's own <human-check> for Task 2. Announcement order and the impression a document leaves on a reader are judgments no automated contract can make; the structural preconditions (source order, scope attributes, aria-labelledby, caption presence) are asserted, but the announcement itself and the reader's conclusion are not."

# Metrics
duration: 16 min
completed: 2026-09-01
status: complete
---

# Phase 4 Plan 3: Surface A Report Document Summary

**The complete UI-SPEC Surface A owner report — a native radio period control switching four pre-rendered sections through a fail-open CSS `:has()` rule with no script, collapsed stage cards over labelled scrollable event tables, an always-visible caveat block, and a mutation-probed vocabulary contract that runs over the document's rendered text**

## Performance

- **Duration:** 16 min
- **Started:** 2026-09-01T06:45:00Z
- **Completed:** 2026-09-01T07:01:00Z
- **Tasks:** 2
- **Files modified:** 4 (0 created, 4 modified)

## Accomplishments

- **The document is now the whole Surface A contract.** A real fixture run produces one
  `h1`, four `h2`, sixteen `h3`, one `fieldset`, four radios, sixteen `details` cards and
  sixteen labelled scroll regions — and zero of `<script`, `<link`, `<img`, `<iframe`,
  `http`, `@import`, `url(`, `Authorization` and `%`.
- **Period switching degrades the right way.** The exposure rule is written as *hide the
  sections that are not selected once the body has a checked input*, never as *show the
  selected one*. A browser that cannot evaluate `:has()` drops the whole selector as
  invalid and applies no hiding at all, so the degraded document is all four periods
  visible in sequence under their own headings. Nothing is hidden by a `hidden`
  attribute, an inline display rule, or markup omission, and a contract enumerates every
  rule in the stylesheet that hides a `.period-section` and asserts each one is inside a
  `:has()`.
- **The vocabulary contract is mutation-probed, not merely observed green.** A banned term
  injected into a stage clarifier kills 3 contracts; a percentage change value kills 4; a
  banned term smuggled into the caveat block — the one place the scan does not look —
  kills 3. All three mutations were reverted.
- **The caveat exclusion is closed, not open.** Excluding the authored denial block from
  the banned-term scan would be a loophole if it stopped there, so a separate contract
  counts every banned term in the *whole* document text and in the caveat block, and
  requires the difference to be zero. A banned word can therefore exist in exactly one
  place, and that place must be byte-equal to the authored copy.
- **The report has no percentage anywhere, including in its stylesheet.** The last
  percent sign was the CSS `width: 100%` on the table, which the text-content scan
  correctly strips along with the style element. It was removed anyway and the contract
  now asserts over the whole file, so the owner can grep their own generated report for a
  percent sign and expect zero hits.
- 95 contracts in `src/test/haoo-report.test.ts` (75 before this plan). Full suite 661
  passed, 0 failed; `npm run lint`, `npm run typecheck` and `npm test` all exit 0.

## Task Commits

Each task was committed atomically, RED before GREEN:

1. **Task 1: Complete the Surface A document**
   - `47087c0` (test) — 11 document contracts, 7 failing against the 04-01 renderer
   - `e1d6f80` (feat) — the copy dictionary, the full renderer, the extended model
2. **Task 2: Vocabulary, encoding and self-containment contracts**
   - `4ec7252` (test) — 9 semantic-integrity contracts, mutation-probed three ways

**Supporting commit:** `d2ace41` (fix — the artifact-wide percent-sign prohibition)

## Files Created/Modified

- `src/reporting/haoo-report.ts` — gained the owner-facing copy dictionary: the closed
  `ReportPeriodId` union with its labels and checked default, the period legend, the five
  column headers keyed by `ReportColumnId`, the metadata labels and separator, the two
  provider states, the all-time comparison sentence, the bounded `comparisonLine`
  builder, the empty-state heading and body, the six authored caveat sentences, and
  `recordedActionsLabel` for the three plural forms. Every map is a
  `Readonly<Record<ClosedUnion, string>>`, so an omission is a typecheck error.
- `src/reporting/render.ts` — rewritten as the complete Surface A renderer plus the new
  `REPORT_STYLES` export. Holds markup and CSS only; every word comes from the
  dictionary. The stylesheet reproduces the inherited eight spacing values, four type
  sizes with their weights and line heights, the colour roles, the `focusLight` ring
  pairing, the 880px measure, the 44px targets, tabular figures, the derived period
  exposure rules, a `@media print` block and a `prefers-reduced-motion` block.
- `src/reporting/generate.ts` — the model gained `label`, `window`, `empty` and
  `siteScope`; `comparisonLine` is now always a sentence rather than sometimes `null`.
  The duplicated empty-state literal was replaced by the dictionary import.
- `src/test/haoo-report.test.ts` — 20 new contracts across two describe blocks, a
  hand-typed second copy of the locked caveat, empty-state, column-header and period
  copy, a jsdom parsing helper set, and a hardened `documentText`.

## Decisions Made

- **The banned-vocabulary scan excludes the authored caveat block; the block is pinned by
  exact text instead.** See deviation 1 below — this is the only way both halves of the
  UI-SPEC can be satisfied at once.
- **The exposure rule hides rather than shows.** Both formulations look identical in a
  supporting browser and opposite in a non-supporting one: *show the selected* degrades
  to a document with nothing in it, *hide the unselected* degrades to a document with
  everything in it. The UI-SPEC fallback contract requires the second, and the contract
  that enforces it inspects the stylesheet rather than the rendered output, because the
  failure it guards against only appears in a browser the test environment is not.
- **`display: list-item` on the stage summary, not `display: flex`.** The obvious way to
  lay out an `h3`, a total and a change on one row is a flex summary, but Chromium drops
  the native disclosure marker when a summary is a flex container, and that marker is how
  open/closed state is exposed without relying on colour. The three parts are blocks
  below the medium breakpoint — which is also what the UI-SPEC overflow rule asks for,
  heading then total then change on separate lines — and inline-blocks from `md` upward.
- **The empty-state block renders only when the period carries an inclusive window.** The
  all-time view has no window when the provider resolved no range, and the empty-state
  body interpolates a start and an end. Rendering it anyway would have required inventing
  two dates on the one document whose purpose is literal accuracy, so the all-time
  heading carries the empty-state wording alone in that case, exactly as 04-01 left it.
- **The document names its site scope.** The UI-SPEC information architecture requires the
  metadata line to state four facts and the copy row names three; the site scope is the
  fourth. It is the owner's own site identifier, not a credential, and it is what makes
  the document self-describing when more than one site is ever reported on.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The locked caveat copy contains three locked banned terms**

- **Found during:** Task 1 (rendering the caveat block)
- **Issue:** The plan requires both that the banned-vocabulary contract passes over the
  document's text content and that the full authored caveat block is present in the
  document. Those two requirements contradict each other as written. The locked caveat
  copy contains `people` and `sessions` in its first sentence ("not people, sessions, or
  enquiries") and `customer` in its fifth ("not ... a customer"), and all three are on the
  locked banned list. Adding the caveat block therefore turned the existing 04-01 contract
  `renders no banned vocabulary and no percentage figure` red. Rewording the caveat was
  not an option: those three words are the denial itself, and removing them would leave
  the report less truthful, which is the opposite of what MEAS-08 asks for.
- **Fix:** `documentText` now parses the document and removes two nodes before returning
  text: the style element (as planned) and the authored caveat block. The exclusion is
  closed rather than open — `carries the whole authored caveat text` asserts the block
  equals the authored copy exactly, and `allows a banned term only inside the exact
  authored caveat block` counts every banned term in the whole document text and in the
  caveat block and requires the difference to be zero. A banned word can exist in exactly
  one place and only as the authored denial. The reading this encodes is the UI-SPEC's own:
  its Visual Direction prohibition is scoped to "in any label", and the plan's truth states
  that every rendered evidence word comes from "the authored label map **or the authored
  caveat copy**".
- **Files modified:** `src/test/haoo-report.test.ts`, `src/reporting/haoo-report.ts` (the
  rationale is recorded on `REPORT_CAVEATS`)
- **Verification:** mutation probe 3 — a banned term smuggled into the caveat block fails 3
  contracts, so the exclusion cannot be used as a hiding place.
- **Committed in:** `e1d6f80` (Task 1), hardened in `4ec7252` (Task 2)

**2. [Rule 2 - Missing Critical] The report carried a percent sign in its stylesheet**

- **Found during:** Task 2 close-out (scanning a real generated file)
- **Issue:** A `grep -c '%'` over a real generated report returned 1: the CSS
  `table { width: 100% }`. The text-content scan strips the style element, so the contract
  was green and correct at the level the plan specified — but the UI-SPEC prohibition is
  "No percentage anywhere", 04-01's summary claimed a real generated file greps clean, and
  the owner's most natural way to check this document themselves is exactly that grep.
  Leaving one hit would have made a true document look false to its own reader.
- **Fix:** the declaration was dropped; the table sizes from its own content inside the
  scroll region, which is what a horizontally scrollable table wants at 320px anyway. The
  percent contract now asserts over the whole file as well as the rendered text.
- **Files modified:** `src/reporting/render.ts`, `src/test/haoo-report.test.ts`
- **Verification:** `renders no percent sign in the document text or anywhere in the file`;
  a real generated file greps to 0.
- **Committed in:** `d2ace41`

**3. [Rule 3 - Blocking] The 04-01 `periodSection` test helper matched markup by position**

- **Found during:** Task 1 (GREEN)
- **Issue:** The helper found a period section with
  `html.indexOf('<section id="${id}">')`. Adding the `class="period-section"` and
  `aria-labelledby` attributes the plan requires moved the `id` inside the tag, so the
  helper returned `-1` and four 04-01 contracts failed for a reason unrelated to what they
  assert.
- **Fix:** the helper parses the document and resolves the section by id, returning its
  `outerHTML`. The four contracts are otherwise untouched and still assert exactly what
  they did before.
- **Files modified:** `src/test/haoo-report.test.ts`
- **Verification:** the four `all four reporting periods` contracts pass unchanged.
- **Committed in:** `e1d6f80`

---

**Total deviations:** 3 auto-fixed (1 bug, 1 missing critical, 1 blocker)
**Impact on plan:** Deviation 1 resolves a genuine contradiction between two locked
requirements and does so by narrowing rather than weakening the contract — the scan now
covers everything the report *claims* while the block that *denies* is held byte-exact.
Deviation 2 strengthens the MEAS-08 percentage prohibition to the literal reading the
UI-SPEC states. Deviation 3 repairs a brittle helper without changing any assertion. No
scope creep, no architectural change; every planned export, acceptance criterion and
module boundary is unchanged.

## Mutation Probe Results

The plan requires the semantic-integrity suite to be probed before it is trusted. Three
mutations were applied one at a time, each run against the full file suite, each reverted:

| Probe | Mutation | Contracts killed |
|-------|----------|------------------|
| 1 | `visitors` injected into the Discovery stage clarifier | 3 — `renders no banned vocabulary and no percentage figure`, `reproduces the locked banned list in full and scans rendered text, not markup`, `allows a banned term only inside the exact authored caveat block` |
| 2 | `deltaLabel` emits a percentage increase instead of a signed integer | 4 — `renders '+6 vs previous 30 days'`, `renders no banned vocabulary and no percentage figure`, `renders every change value in one of exactly three authored forms`, `renders no percent sign in the document text or anywhere in the file` |
| 3 | A seventh caveat sentence carrying `unique visitors`, inside the block the scan excludes | 3 — `keeps the caveat block last, always visible, and outside every collapsed element`, `allows a banned term only inside the exact authored caveat block`, `carries the whole authored caveat text, whitespace-normalised` |

Probe 3 is the one that matters most: it is the loophole deviation 1 opens, and it is
closed. `git status` confirms no mutation remains in the committed source.

## Issues Encountered

- **Vitest still collects every suite twice.** The leftover untracked worktree at
  `.claude/worktrees/rf-03-retry-1788205465/` holds a full copy of `src/`, so the full run
  reports 21 files and 661 tests rather than roughly half that. Pre-existing, out of scope
  for this plan, already carried in STATE.md as a blocker from 04-01. Judged by pass/fail
  rather than by count: 641 passing before this plan, 661 after, 0 failing throughout.

## Verification Results

Plan-level `<verification>`, all re-run at close-out:

- `npm run test:unit -- --run src/test/haoo-report.test.ts` — 95 passed, exit 0.
- `npm run lint` — exit 0. `npm run typecheck` — exit 0. `npm test` — 661 passed, exit 0.
- **A fixture-generated document opens with no network access** — a real generation run
  through `generateHaooReport` with real `node:fs` produced a 26KB file whose scan returns
  0 hits for `<script`, `<link`, `<img`, `<iframe`, `http`, `@import`, `url(`, the sentinel
  key, `Authorization`, `%` and `#B00020`. There is nothing in the file for a browser to
  request, so opening it offline is structurally identical to opening it online.
- **The four backstop visual checks and the screen-reader check are carried to UAT** as
  coverage items D9 and D10. They are not confirmable here: jsdom computes no layout, so
  wrapping, clipping, 44px target size and horizontal overflow have no assertable value,
  and announcement order is a judgment about a real assistive technology.

Success criteria: **MEAS-01** — the owner switches between all four locked views through
native radios with no script and expands any stage to the separate observable actions
inside it, each period naming its exact inclusive boundaries and each bounded stage
carrying an integer period-over-period change. **MEAS-08** — no word outside the authored
caveat block comes from the locked banned list, no percent sign exists anywhere in the
file, no count is encoded as a shape, no change value is coloured or directional, and the
full authored caveat text is present, last, and outside every collapsed element — all
proven by a suite that three separate mutations turn red.

## Next Phase Readiness

- **Ready for phase verification.** Every Surface A deliverable in the plan is implemented
  and contract-bound. The two human-judgment items (D9 visual, D10 screen reader and
  reader impression) are the only outstanding work on this surface and both need a real
  browser.
- **Ready for 04-05.** This plan added no provider origin, no query path and no credential
  name to `src/`; the 04-01 derived-pattern boundary test still passes, and
  `src/reporting/*` remains unimported by the application entry points, so nothing here
  enters the bundle.
- **Carried blocker (unchanged):** privacy/legal ownership must approve the processor, data
  location, retention and Kenya Data Protection Act treatment before production collection
  is enabled (UI-SPEC checkpoint C-3). The report path is complete and inert until then.
- **Note for the UI-SPEC reconciliation already tracked in STATE.md:** the Locked banned
  vocabulary list and the Caveat block copy contradict each other as written — the caveat
  contains `people`, `sessions` and `customer`. The implementation resolves this by scoping
  the ban to everything except the authored denial block, but the UI-SPEC itself should be
  amended to say so, alongside the C-1 clause reconciliation 04-04 already flagged.

## Self-Check: PASSED

- All four modified files exist on disk (`[ -f ]` confirmed for each); this plan created
  no new file, as the plan states.
- All four commit hashes resolve in `git log --oneline --all`: `47087c0`, `e1d6f80`,
  `4ec7252`, `d2ace41`.
- No commit in this plan deleted a tracked file (`git diff --diff-filter=D` empty for
  every commit).
- No stub, TODO, FIXME, placeholder or skipped test exists in any file this plan touched.
- No mutation probe remains in the committed source (`git status --short src/` clean).

---
*Phase: 04-report-and-enrich-the-haoo-funnel-truthfully*
*Completed: 2026-09-01*
