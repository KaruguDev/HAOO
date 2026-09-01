---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
plan: 01
subsystem: reporting
tags: [plausible, stats-api, html-report, node-type-stripping, vitest, privacy]

# Dependency graph
requires:
  - phase: 03-build-privacy-bounded-engagement-context
    provides: "HAOO_MEASUREMENT_EVENTS closed ten-name tuple, HaooMeasurementEvent type, and the parseContext fail-closed parsing template reused by parseGoalCounts"
  - phase: 01-discover-haoo-and-choose-an-onboarding-path
    provides: "The ten browser-observable HAOO actions the report counts, and the locked-copy constant pattern from qualify-form.logic.ts"
provides:
  - "src/reporting/ domain modules: closed event-to-stage/label dictionary, inclusive period windows, integer deltas, stage sums"
  - "Fail-closed validation of an untrusted Plausible Stats API v2 response into a zero-filled goal record"
  - "Self-contained HTML rendering with escaping of every interpolated value and no script, stylesheet, font, image or remote URL"
  - "Capability-injected generateHaooReport covering 7-day, 30-day, 90-day and all-time views with write-on-success-only output"
  - "scripts/generate-haoo-report.mjs as the single credentialed module, plus the npm report:haoo command and a .reports/ ignore group"
affects: [04-03 report document dressing, 04-05 provider enablement and source scans, phase verification, gsd-secure-phase]

# Actuals (#2632) — same estimateTokens scale (chars/4 over the realized diff).
actuals:
  tokens: 14400
  tasks: 2
  commits: 5

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Node native TypeScript type stripping: a .mjs entry importing .ts modules by explicit extension, with an engines.node floor and a spawned smoke test proving the load path"
    - "Capability injection for the credential: the orchestrator holds no origin, no query path and no credential variable name; all three arrive through an injected query capability"
    - "Write-on-success-only file output: query and validate everything, render in memory, write a temp sibling, rename"

key-files:
  created:
    - src/reporting/haoo-report.ts
    - src/reporting/stats-response.ts
    - src/reporting/render.ts
    - src/reporting/generate.ts
    - scripts/generate-haoo-report.mjs
    - src/test/haoo-report.test.ts
  modified:
    - eslint.config.js
    - package.json
    - .gitignore

key-decisions:
  - "The report day is derived in the Africa/Nairobi reporting timezone through Intl.formatToParts, not in UTC, so a run made between midnight and 03:00 local does not name a window the provider did not aggregate."
  - "HAOO_REPORT_EVENTS is derived from the label map's key order rather than re-listing the ten literals, so the names are written exactly once and the Readonly<Record<HaooMeasurementEvent, ...>> type makes an omission a typecheck failure."
  - "The all-time heading has three branches and invents no date: the empty-state heading when nothing was recorded, 'All time · since {day}' when the provider resolved a first day, and a bare 'All time' when it resolved none."
  - "The tracer feedback gate was cleared by re-running the tracer's <verify> end-to-end rather than by stopping for a human, because workflow.human_verify_mode is end-of-phase and mode is yolo; the human eyeball is carried to phase-end UAT as coverage item D6."

patterns-established:
  - "Derived-boundary source test: the analytics-origin regex, the Stats API query path and the credential variable name are each extracted from the file that already owns them, so the assertion cannot drift from the 04-05 source scan it protects."
  - "Rejection tables name an explicit expected result per row rather than sharing a rejected boolean, extending the qualify-data.test.ts convention to provider responses."
  - "Every owner-facing string lives in a Readonly<Record<ClosedUnion, string>> in the domain module; the renderer holds no evidence vocabulary of its own."

requirements-completed: [MEAS-01, MEAS-08]

coverage:
  - id: D1
    description: "The report dictionary maps each of the ten Phase 3 events to exactly one stage and exactly one literal evidence label, and the dictionary and the event tuple are exhaustive against each other in both directions."
    requirement: MEAS-08
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#report dictionary > is exhaustive against the Phase 3 closed event tuple in both directions"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#report dictionary > maps $event to stage $stage with the literal label $label"
        status: pass
      - kind: other
        ref: "mutation probe: deleting one label from REPORT_EVENT_LABELS produces 1 typecheck error and 8 failing contracts"
        status: pass
    human_judgment: false
  - id: D2
    description: "An untrusted provider response is validated fail-closed: absent goals become 0, and an unknown goal, a duplicate goal, a non-integer, negative or non-finite count is refused."
    requirement: MEAS-01
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#parseGoalCounts > returns null for a $label (14 rejection rows)"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#parseGoalCounts > zero-fills every allowlisted goal absent from the response"
        status: pass
    human_judgment: false
  - id: D3
    description: "One command produces a self-contained HTML document covering 7-day, 30-day, 90-day and all-time views with exact inclusive boundaries, per-period zero-fill, integer changes, and no comparison on all time."
    requirement: MEAS-01
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#all four reporting periods > sends explicit inclusive calendar ranges for the bounded periods and \"all\" once"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#all four reporting periods > gives the all-time period no previous window, no comparison line, and no change value"
        status: pass
      - kind: integration
        ref: "node ./e2e-report.mjs with a fixture fetch and real node:fs — 7 queries, four period headings, exit 0"
        status: pass
      - kind: other
        ref: "grep -c '<script' .reports/haoo-funnel-report.html => 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "A failed or interrupted generation writes nothing: the previous report is byte-identical and no .tmp file remains."
    requirement: MEAS-01
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#generateHaooReport > leaves a previous report byte-identical and leaves no temp file when a query rejects"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#all four reporting periods > aborts the whole report when any one of the seven periods fails validation"
        status: pass
    human_judgment: false
  - id: D5
    description: "No credential, provider origin, script element, external resource, percentage figure or banned-vocabulary term reaches the generated document or src/reporting/generate.ts."
    requirement: MEAS-08
    verification:
      - kind: unit
        ref: "src/test/haoo-report.test.ts#generateHaooReport > never writes the credential, the Authorization header, or an event identifier"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#generateHaooReport > renders no banned vocabulary and no percentage figure"
        status: pass
      - kind: unit
        ref: "src/test/haoo-report.test.ts#credential and provider-origin boundary > keeps the analytics origin, the query path, and the credential name out of src/"
        status: pass
    human_judgment: false
  - id: D6
    description: "The owner runs npm run report:haoo against a real Plausible site and confirms the four period headings name real inclusive dates, the counts are plausible against the dashboard's raw event totals, and the document opens with no network access."
    requirement: MEAS-01
    verification: []
    human_judgment: true
    rationale: "The plan's own <human-check> for Task 2. It needs a real PLAUSIBLE_STATS_API_KEY and PLAUSIBLE_SITE_ID, which are available only after the 04-05 provider-approval checkpoint, and it requires a human to judge whether the counts are believable against the dashboard and to disconnect the network before opening the file. No fixture can substitute for either judgment."

# Metrics
duration: 14 min
completed: 2026-09-01
status: complete
---

# Phase 4 Plan 1: HAOO Funnel Report Tracer Summary

**A capability-injected Plausible Stats API v2 report path — closed event-to-stage dictionary typed against the Phase 3 tuple, fail-closed response validation, and a script-free self-contained HTML document written atomically to a gitignored `.reports/` path by `npm run report:haoo`**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-01T03:29:00Z
- **Completed:** 2026-09-01T03:43:00Z
- **Tasks:** 2
- **Files modified:** 9 source/config files (6 created, 3 modified)

## Accomplishments

- The whole owner-report path works end to end from a provider response to an openable
  document: `generateHaooReport` issues seven queries (current and previous for 7, 30 and
  90 days, plus one all-time query), validates every response, renders the complete
  document in memory, and only then writes a temporary sibling and renames it into place.
- The report dictionary is exhaustive against `HAOO_MEASUREMENT_EVENTS` at the *type*
  level, not only in tests. Deleting one label produces a `tsc` error before it produces a
  test failure — verified by mutation probe (1 typecheck error, 8 failing contracts).
- The credential boundary is asserted by a test that derives each forbidden pattern from
  the file that already owns it: the analytics-origin regex from `build-output.test.ts`,
  the Stats API query path and the credential variable name from the CLI. The assertion
  therefore cannot drift away from the 04-05 source scan it exists to protect.
- A real-Node smoke test spawns `scripts/generate-haoo-report.mjs` with an empty
  environment and asserts exit 1, the authored error sentence on stderr, and no
  module-resolution or syntax error — proving Node's native type stripping loaded the
  `src/reporting/*.ts` modules from a `.mjs` entry. Mutation-probed: changing the import
  extension to `.js` fails the test.
- 75 contracts in `src/test/haoo-report.test.ts`; full suite 591 passed, `npm run lint`,
  `npm run typecheck` and `npm test` all exit 0.

## Task Commits

Each task was committed atomically, RED before GREEN:

1. **Task 1: End-to-end "owner opens a HAOO funnel report" — one period only**
   - `3414bf3` (test) — failing contracts for the dictionary, validator, renderer, generator and CLI
   - `492fbaa` (feat) — the four `src/reporting/` modules, the credentialed CLI, and the ESLint block
2. **Task 2: All four reporting periods, zero-fill, and the owner command**
   - `de264c5` (test) — failing contracts for the window table, seven queries, all-time absence of comparison, and command registration
   - `75400be` (feat) — the four locked periods, the all-time branch, `report:haoo`, `engines.node`, `.reports/`

**Supporting commit:** `3a241bd` (docs — deferred item)

## Files Created/Modified

- `src/reporting/haoo-report.ts` — the closed dictionary. Event labels and stages typed
  `Readonly<Record<HaooMeasurementEvent, ...>>`; `HAOO_REPORT_EVENTS` derived from the
  label map's key order; inclusive `periodWindows`, `stageTotals`, and `deltaLabel` in the
  three locked signed forms.
- `src/reporting/stats-response.ts` — `parseGoalCounts`, built on the `parseContext`
  fail-closed template: validate inside a `try`, reject anything that is not a plain
  object, check every row explicitly, rebuild a fresh literal, return `null` on every
  rejection path.
- `src/reporting/render.ts` — `escapeHtml` and `renderReport`. Emits one document with
  `lang="en"`, one `<h1>`, one inline `<style>`, native `details`/`summary` stage cards,
  `th scope` tables in labelled scroll regions, and no script, link, image or remote URL.
- `src/reporting/generate.ts` — capability-injected orchestration. Holds no provider
  origin, no query path and no credential variable name; derives the report day in the
  reporting timezone; write-on-success only.
- `scripts/generate-haoo-report.mjs` — the only credentialed module. Reads `process.env`,
  owns the `https://plausible.io/api/v2/query` literal, binds real `fetch`/`node:fs`, maps
  results to exit codes, and prints the failure sentence to the terminal only.
- `src/test/haoo-report.test.ts` — 75 contracts: two-way exhaustiveness, the label table,
  the window table, the 14-row rejection table, fixture generator runs, the derived
  credential-boundary scan, and the spawned CLI smoke test.
- `eslint.config.js` — new `files: ['scripts/**/*.mjs']` block with `globals.node`, so the
  one file that reads `process.env` is rule-checked rather than merely parsed.
- `package.json` — `report:haoo` script and an `engines.node` floor of `>=22.18.0`.
- `.gitignore` — commented `.reports/` group explaining that generated owner reports carry
  business counts and are never repository content.

## Decisions Made

- **The report day is derived in `Africa/Nairobi`, not UTC.** See deviation 1 below.
- **`HAOO_REPORT_EVENTS` is derived from the label map's key order.** The ten literals are
  written exactly once. The `Readonly<Record<HaooMeasurementEvent, ...>>` type guarantees
  the derived tuple is complete, and a contract asserts it preserves the Phase 3 order.
- **`REPORT_STAGES` is a typed object literal, not an `Object.fromEntries` cast.** The
  first attempt used `Object.fromEntries(...) as Record<ReportStageId, ReportStage>`, which
  `tsc` rejected as insufficiently overlapping (TS2352). Casting through `unknown` would
  have silenced the checker and thrown away exactly the exhaustiveness guarantee this plan
  bought, so the literal form was used instead; stage membership is still derived from
  `REPORT_EVENT_STAGES` through `eventsInStage`.
- **The all-time heading has three branches and never invents a date.** Nothing recorded →
  the locked empty-state heading `No recorded actions in this period`; the provider
  resolved a first day → `All time · since {day}`; counts exist but no range was resolved →
  a bare `All time`. The third branch was added because using the empty-state copy there
  would have claimed "no recorded actions" over non-zero counts.
- **The tracer feedback gate was cleared by re-running the tracer `<verify>` end-to-end
  rather than by stopping for a human.** `workflow.human_verify_mode` is `end-of-phase` and
  `mode` is `yolo`, so mid-plan human verification is deferred by configuration; stopping
  would also have left the plan in an illegal partial state (production commits, no
  SUMMARY). All three tracer gates re-ran at exit 0 before any Task 2 work began, and the
  human eyeball is carried forward as coverage item D6.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The report day is derived in the reporting timezone, not UTC**

- **Found during:** Task 1 (generator implementation)
- **Issue:** The plan's day arithmetic reuses the `toISOString().slice(0, 10)` style from
  `src/measurement/index.ts`, which yields a UTC calendar day. The report's metadata line
  states `Reporting timezone Africa/Nairobi` and the provider aggregates in the site's
  timezone. A run made between 00:00 and 03:00 in Nairobi is still the previous day in UTC,
  so the report would have named a window the provider did not aggregate — an inclusive
  boundary claim that is simply false, on a document whose entire purpose is literal
  accuracy.
- **Fix:** `reportDay(date, timeZone)` in `src/reporting/generate.ts` derives the calendar
  day through `Intl.DateTimeFormat(...).formatToParts`, a built-in, so no dependency was
  added. The day-shift arithmetic in `periodWindows` is unchanged and still integer-day
  based.
- **Files modified:** `src/reporting/generate.ts`, `src/test/haoo-report.test.ts`
- **Verification:** `src/test/haoo-report.test.ts#generateHaooReport > derives the
  inclusive window from the reporting timezone, not from UTC` — a generation at
  `2026-03-01T22:00:00Z` (already 2 March in Nairobi) is asserted to query
  `["2026-02-24","2026-03-02"]` and `["2026-02-01","2026-03-02"]`, not the UTC-day windows.
- **Committed in:** `492fbaa` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Stricter row shape in `parseGoalCounts`**

- **Found during:** Task 1 (validator implementation)
- **Issue:** The plan specifies reading "each row's goal dimension and `events` metric". A
  validator that reads `dimensions[0]` and `metrics[0]` without checking array length would
  silently accept a row carrying extra dimensions or extra metrics — a differently shaped
  response than the one queried, whose first element cannot be assumed to be the goal.
- **Fix:** The parser requires `dimensions.length === 1` and `metrics.length === 1`,
  matching the single-metric single-dimension query actually issued. Anything else returns
  `null`.
- **Files modified:** `src/reporting/stats-response.ts`, `src/test/haoo-report.test.ts`
- **Verification:** rejection rows `missing dimension` and `extra dimension` in the
  `parseGoalCounts` table.
- **Committed in:** `492fbaa` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both close correctness gaps in the truthfulness contract this phase
exists to enforce — one prevents a false date claim, the other prevents trusting a
differently shaped provider response. No scope creep; no architectural change; every
planned export, module boundary and acceptance criterion is unchanged.

## Issues Encountered

- **`Object.fromEntries` cast failed `npm run typecheck` (TS2352).** Resolved by declaring
  `REPORT_STAGES` as a typed object literal rather than casting a derived record. Casting
  through `unknown` was rejected as a fix because it would have removed the exhaustiveness
  guarantee the record type exists to provide. See Decisions.
- **Vitest collects every suite twice.** A leftover untracked worktree at
  `.claude/worktrees/rf-03-retry-1788205465/` contains a full copy of `src/`, so the full
  run reports 21 test files and 591 tests instead of roughly half that. Every duplicated
  suite passes. This is pre-existing and unrelated to this plan's changes, so it was logged
  to `deferred-items.md` rather than fixed (scope boundary), but it doubles suite runtime
  and would mask a single-copy regression, so it should be cleaned up deliberately.

## Verification Results

Plan-level `<verification>`, all re-run at close-out:

- `npm run test:unit -- --run src/test/haoo-report.test.ts` — 75 passed, exit 0.
- `npm run lint` — exit 0. `npm run typecheck` — exit 0. `npm test` (builds first) — 591
  passed, exit 0.
- The report dictionary and `HAOO_MEASUREMENT_EVENTS` are exhaustive against each other in
  both directions — asserted, and mutation-probed at both the type and contract level.
- A failed generation leaves the previous report byte-identical and leaves no `.tmp` file —
  asserted against a real temporary directory with a sentinel file.
- `git status --porcelain .reports` reports nothing after a generation run — confirmed
  against a real generated `.reports/haoo-funnel-report.html`.

Success criteria: **MEAS-01** — `npm run report:haoo` produces a document carrying aggregate
counts for all ten HAOO events in the four locked stages across four periods with exact
inclusive boundaries. **MEAS-08** — every count carries its authored literal evidence label
and the banned-vocabulary contract passes over the whole document. No credential, no
percentage, no script element and no external resource reference appears in the generated
document (`grep -c 'http'` and `grep -c '%'` both report 0 on a real generated file).

## User Setup Required

**External services require manual configuration.** See
[04-USER-SETUP.md](./04-USER-SETUP.md) for:

- `PLAUSIBLE_STATS_API_KEY` and `PLAUSIBLE_SITE_ID` in the local process environment
  (never `VITE_`, never committed)
- The ten exact custom-event goals, created *before* production collection begins —
  Plausible does not backfill into a goal created later
- The site reporting timezone set to `Africa/Nairobi`, which the generator now depends on

None of this is required to execute, verify or review this plan; every contract is
fixture-driven and runs with no credential and no network access.

## Next Phase Readiness

- **Ready for 04-03.** `renderReport` deliberately stops at the tracer scope the plan
  defined: header, metadata line, period sections, and collapsed stage cards with event
  tables. The period radio control, the `:has()` selection rule, the always-visible caveat
  block, the empty-period state, the `REPORT_STYLES` export and the print rules are 04-03's
  scope and are not stubbed here — no placeholder markup exists for them. The `ReportModel`
  already carries all four periods, so 04-03 extends rendering without touching the query
  or validation path.
- **Ready for 04-05.** `src/reporting/generate.ts` carries no analytics origin, no Stats API
  query path and no credential variable name, and a derived-pattern test now guards that,
  so the planned 04-05 source scan will pass over the new files. `src/reporting/*` is not
  imported by the application entry points, so it never enters the bundle.
- **Carried blocker (unchanged):** privacy/legal ownership must approve the processor, data
  location, retention and Kenya Data Protection Act treatment before production collection
  is enabled (UI-SPEC checkpoint C-3). The report path is complete and inert until then.
- **Flagged assumption carried forward, not resolved:** the plan flags that MEAS-08's
  residual edge is the vocabulary axis, covered by the banned-vocabulary contract and the
  two prohibitions. That contract now exists and passes over the whole rendered document,
  but the assumption itself still wants a human confirmation during verification.

## Self-Check: PASSED

- All six created files exist on disk (`[ -f ]` confirmed for each).
- All five commit hashes resolve in `git log --oneline --all`.
- No commit in this plan deleted a tracked file (`git diff --diff-filter=D` empty for both
  task commits).
- No stub, TODO, FIXME, placeholder or skipped test exists in any file this plan created.

---
*Phase: 04-report-and-enrich-the-haoo-funnel-truthfully*
*Completed: 2026-09-01*
