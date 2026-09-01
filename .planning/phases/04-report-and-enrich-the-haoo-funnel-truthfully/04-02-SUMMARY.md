---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
plan: 02
subsystem: lead-capture
tags: [formsubmit, engagement-summary, privacy, product-generic-copy, vitest, mutation-probe]

# Dependency graph
requires:
  - phase: 03-build-privacy-bounded-engagement-context
    provides: "createMeasurement facade with readContext()/readCampaign(), the bounded EngagementContext, the CONTEXT_RECORD_KEYS tuple, and the visitBand/lastSeenBand threshold arithmetic"
  - phase: 02-qualify-serious-haoo-prospects
    provides: "buildSubmissionBody, RESERVED_EMAIL_LABELS, the exact-allowlist payload contract, and the serialize-track-fetch submission order"
provides:
  - "src/products/engagement-summary.ts: a pure, product-generic formatter driven entirely by owner-approved product copy"
  - "ProductEngagementSummary config type keyed by the closed VisitBand/LastSeenBand unions, so an unauthored band is a typecheck failure"
  - "HAOO byte-exact Surface C sentences under HAOO_PRODUCT.qualify.engagementSummary, including the campaign clause"
  - "ENGAGEMENT_SUMMARY_LABEL reserved in RESERVED_EMAIL_LABELS, and buildSubmissionBody's optional third summary parameter"
  - "The ProductPage closure and QualifyForm prop that put the summary on the existing FormSubmit request"
  - "A resolved checkpoint C-2 outcome that plan 04-04 reads to decide disclosure contents item 4"
affects: [04-04 disclosure and collection-notice copy, 04-05 provider enablement and source scans, phase verification, gsd-secure-phase]

# Actuals (#2632) — same estimateTokens scale (chars/4 over the realized diff).
actuals:
  tokens: 12800
  tasks: 2
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Explicit pick list over object spread: the formatter names the three record members it may read, and a source scan derived from CONTEXT_RECORD_KEYS asserts every other member is absent from the module"
    - "Copy as product data, assembly as generic code: the formatter holds no sentence of its own, so owner-approved wording changes without touching executable source"
    - "Threshold contracts driven through the real facade: visit-band and last-seen rows are produced by createMeasurement rather than by hand-written band names, so they pin Phase 3's arithmetic instead of restating the formatter's lookup table"

key-files:
  created:
    - src/products/engagement-summary.ts
  modified:
    - src/products/types.ts
    - src/products/haoo.ts
    - src/components/qualify-form.logic.ts
    - src/components/QualifyForm.tsx
    - src/pages/ProductPage.tsx
    - src/test/qualify-form.test.tsx
    - src/test/build-output.test.ts
    - src/test/product-shell-reuse.test.tsx

key-decisions:
  - "Blocking checkpoint C-2 was resolved `include` by the human product owner: normalized campaign values DO appear in the emailed engagement summary as UI-SPEC Surface C part 5."
  - "The formatter is named src/products/engagement-summary.ts and is product-generic rather than the RESEARCH-proposed haoo-summary.ts, keeping reusable copy modules product-name-free and byte-exact owner copy in product configuration."
  - "buildSubmissionBody writes the summary under qualify.engagementSummary.emailLabel and throws when that label is not in RESERVED_EMAIL_LABELS, so the key actually written is always the key that is reserved."
  - "A half-readable context record is treated as unreadable and yields the locked fallback: emitting the prefix and boundary sentence around no facts at all would be a silently degraded email that still reads as a successful summary."
  - "The two existing product-genericity source scans were narrowed to permit exactly one string in exactly one file — the reserved engagement-summary label in qualify-form.logic.ts — rather than dropping either prohibition."

patterns-established:
  - "Narrow, never delete, a source or payload prohibition: the broad forbidden-keyword payload filter and both /HAOO/ genericity scans were each replaced by a strictly-scoped version plus named negative assertions, never removed."
  - "Mutation-probe a contract table that goes green on its first run: four deliberately weakened formatters were run against this suite, and the one that survived exposed a real missing failure row rather than being explained away."
  - "Numeric-silence contract: iterating every band and flag permutation and asserting the output matches no digit turns 'no lead score' from prose into an executable property."

requirements-completed: [MEAS-05, MEAS-08]

coverage:
  - id: D1
    description: "A submitted qualification enquiry reaches FormSubmit carrying one readable engagement-summary field under the reserved label `HAOO engagement context`, with the serialize-track-fetch order and every existing payload protection intact."
    requirement: MEAS-05
    verification:
      - kind: integration
        ref: "src/test/qualify-form.test.tsx#sends one readable summary with a submitted enquiry"
        status: pass
      - kind: integration
        ref: "src/test/qualify-form.test.tsx#posts a readable, correctly-addressed payload"
        status: pass
    human_judgment: false
  - id: D2
    description: "The submitted payload key set is an exact allowlist that includes the engagement-summary label and excludes both internal derivation members, the browser storage key and any UUID shape."
    requirement: MEAS-08
    verification:
      - kind: integration
        ref: "src/test/qualify-form.test.tsx#posts a readable, correctly-addressed payload"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#keeps the formatter product-generic and inside its pick list"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every UI-SPEC Surface C sentence is produced for its exact input: visit bands 1-4 plus the capped step, last-seen boundaries at 0, 1, 7, 8, 30 and 31 elapsed days, each of the five flags alone, all five in the authored order, and none at all."
    requirement: MEAS-05
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#Phase 4 engagement summary sentence matrix"
        status: pass
    human_judgment: false
  - id: D4
    description: "The summary carries no numeric quantity of any kind derived from context, across every visit band, last-seen band and flag subset."
    requirement: MEAS-05
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#emits no numeric quantity of any kind for any band and flag permutation"
        status: pass
    human_judgment: false
  - id: D5
    description: "An unreadable context yields the locked fallback sentence without throwing, so summary construction can never block, delay, disable or fail a submission."
    requirement: MEAS-08
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#falls back rather than failing a submission for a record whose accessor throws"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#refuses a configuration that would ship an unlabelled or empty summary"
        status: pass
    human_judgment: false
  - id: D6
    description: "The maximum-length summary — frequent visit band, all five flags true, all three normalized campaign values at their 32-character cap — reads as one coherent paragraph in a real email body, with nothing that reads as a score, a grade, or a claim about a person rather than a browser."
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#keeps the longest possible summary one readable, untruncated paragraph"
        status: pass
    human_judgment: true
    rationale: "The plan's <human-check> asks a person to read the produced paragraph as it would appear in the email body and judge that it reads coherently and carries no score-like or person-like claim. The automated row proves no truncation, no field-splitting, one line and every sentence intact, but readability and tone are not assertable. Carried to phase-end UAT per workflow.human_verify_mode: end-of-phase."
  - id: D7
    description: "Checkpoint C-2 resolved `include`, so normalized campaign values travel to FormSubmit alongside a named enquiry — a wider disclosure than campaign-in-memory-only, and a scope widening of the standing privacy-ownership blocker."
    verification: []
    human_judgment: true
    rationale: "A product-owner decision about what personal-adjacent data leaves the browser to a third-party processor. Its downstream consequences — the 04-04 disclosure wording and Kenya Data Protection Act treatment — require privacy/legal ownership sign-off, which no test can supply."

# Metrics
duration: 20 min
completed: 2026-09-01
status: complete
---

# Phase 4 Plan 2: Emailed HAOO Engagement Summary Summary

**A disclosed, human-readable engagement paragraph now rides the existing FormSubmit enquiry, assembled by a pure product-generic formatter from Phase 3's bounded browser record and normalized campaign snapshot — no score, no identifier, no derivation field, and no analytics provider touched during submission.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-01T03:50:00Z
- **Completed:** 2026-09-01T04:09:43Z
- **Tasks:** 2 executed (Task 1 was the resolved C-2 checkpoint)
- **Files modified:** 9 (1 created, 8 modified)

## Checkpoint C-2 outcome — read by plan 04-04

**Checkpoint C-2 was resolved `include` by the human product owner.**

The question was whether normalized campaign values appear in the emailed HAOO engagement
summary as UI-SPEC Surface C part 5:
`Campaign values seen on arrival: source {v}; medium {v}; campaign {v}.`

The decision is `include`. Accordingly, this plan shipped:

- the formatter emits part 5 when campaign values are present;
- `ProductEngagementSummary.campaignSentence` exists in `src/products/types.ts`;
- HAOO supplies the campaign sentence copy in `src/products/haoo.ts`.

**Plan 04-04 must therefore KEEP disclosure contents item 4:**
`Any campaign values described above, if they were present when you arrived.`

**Blocker scope widened.** `include` widens the standing STATE.md blocker — "Privacy/legal
ownership must approve notice, storage, retention, processor, and Kenya Data Protection Act
decisions before production collection" — because a campaign label now travels to FormSubmit
alongside a named enquiry, not only to page memory. The values are still lowercased,
character-restricted and capped at 32 characters by Phase 3 before the formatter sees them,
and the formatter adds no truncation of its own.

## Accomplishments

- **A pure, product-generic formatter.** `formatEngagementSummary(record, campaign, config)`
  assembles the locked Surface C order — prefix, visit band, last seen (omitted entirely on a
  first visit), the recorded actions in authored order, the campaign clause, then the boundary
  sentence — and holds no sentence of its own. All copy arrives as product configuration.
- **An explicit pick list instead of a spread.** The formatter names the three record members
  it may read. A source scan derived from the exported `CONTEXT_RECORD_KEYS` tuple asserts that
  every other member of the stored record — including both internal derivation fields — is
  absent from the module entirely.
- **The email label is reserved.** `HAOO engagement context` joined `RESERVED_EMAIL_LABELS`, so
  the existing reserved-label suite, which iterates the whole set, now proves no product field
  can claim it. `buildSubmissionBody` additionally throws if the configured summary label is not
  reserved, so the key written is always the key protected.
- **The payload allowlist got stricter, not looser.** `EXPECTED_BODY_KEYS` is still asserted as
  an exact set and now includes the summary label; the broad
  `engagement|context|summary` keyword filter it would have contradicted was replaced by named
  negative assertions for both derivation members, the browser storage key and a UUID shape.
- **The whole sentence matrix is pinned by named rows.** Visit bands and last-seen boundaries
  are produced through the real `createMeasurement` facade, so the rows pin Phase 3's threshold
  arithmetic rather than restating the formatter's own lookup table.
- **`no lead score` became an executable property.** All 384 band-and-flag permutations are
  asserted to contain no digit.

## Task Commits

1. **Task 2 (tracer, tdd): end-to-end readable engagement summary** — RED `4ef40e9` (test),
   GREEN `d6c9df3` (feat)
2. **Task 3 (tdd): sentence matrix, thresholds, and failure fallback** — `1a710e6` (test)

_Task 3's hardening requirements — exhaustive union-keyed band lookups, `config.flagSentences`-driven
flag iteration, a single outer try/catch, and the `requireIdentity`-style config guard — were
already satisfied by the Task 2 implementation, so Task 3 landed as one contract commit plus the
missing failure rows its mutation probe exposed. No behaviour change was needed beyond that._

**Plan metadata:** see the `docs(04-02)` commit.

## Files Created/Modified

- `src/products/engagement-summary.ts` — **created.** Pure product-generic formatter,
  `formatEngagementSummary`, the explicit pick list, the campaign clause assembler, and the
  fail-closed `requireSummaryCopy` config guard.
- `src/products/types.ts` — `ProductEngagementSummary`, `EngagementFlagSentence`,
  `EngagementCampaignClause`, `EngagementCampaignSentence`, and the required
  `engagementSummary` member on `ProductQualifyForm`.
- `src/products/haoo.ts` — byte-exact Surface C copy under `qualify.engagementSummary`.
- `src/components/qualify-form.logic.ts` — `ENGAGEMENT_SUMMARY_LABEL`, its reservation, and
  `buildSubmissionBody`'s optional third `summary` parameter.
- `src/components/QualifyForm.tsx` — the optional `buildEngagementSummary` prop and its
  isolated call, placed before `JSON.stringify` with the serialize-track-fetch order unchanged.
- `src/pages/ProductPage.tsx` — the `useCallback` closure over `measurement.readContext()`,
  `measurement.readCampaign()` and `product.qualify.engagementSummary`.
- `src/test/qualify-form.test.tsx` — the exact-allowlist update, named negative assertions, and
  the whole Surface C matrix.
- `src/test/build-output.test.ts` — `PRODUCT_SOURCE_BOUNDARY` entry for the new formatter.
- `src/test/product-shell-reuse.test.tsx` — the synthetic product's `engagementSummary`, the new
  formatter added to `GENERIC_PRODUCT_SOURCES`, and the narrowed product-name scan.

## Decisions Made

- **C-2 resolved `include`** (see the dedicated section above; 04-04 keeps disclosure item 4).
- **Module naming.** `src/products/engagement-summary.ts` with a product-generic formatter,
  not the RESEARCH-proposed `haoo-summary.ts`, per the Phase 3 locked decision that reusable
  copy modules stay product-name-free. RESEARCH assumption A7 grants this latitude.
- **The written key is always the reserved key.** `buildSubmissionBody` writes under
  `qualify.engagementSummary.emailLabel` and throws when that label is not in
  `RESERVED_EMAIL_LABELS`, so a future product cannot ship a summary under an unprotected name.
- **A half-readable record is unreadable.** An unauthored visit band, a missing band, or an
  unauthored last-seen band all yield the locked fallback. Emitting the prefix and boundary
  sentence around no facts at all would be a silently degraded email that still reads as a
  successful summary. This decision came directly out of a surviving mutant.
- **QualifyForm falls back rather than omitting.** A formatter throw inside the component is
  caught and replaced with `qualify.engagementSummary.fallback`, so the field is never empty and
  never missing, and a failure can never produce a half-sent request.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two existing product-genericity source scans rejected the reserved label**

- **Found during:** Task 2 (GREEN phase)
- **Issue:** The plan requires the literal `'HAOO engagement context'` in
  `RESERVED_EMAIL_LABELS` in `src/components/qualify-form.logic.ts`. Two shipped contracts
  forbid product-name literals in that file: the `genericSources` scan in
  `qualify-form.test.tsx` and the stronger comment-stripped, data-derived scan in
  `product-shell-reuse.test.tsx` — described in its own comment as "the only enforcement of the
  reuse contract". Both failed.
- **Fix:** Narrowed both rather than deleting either, mirroring the plan's own "narrow the
  `forbiddenPayloadShape` regex rather than delete it" instruction. Each scan now removes
  exactly the `ENGAGEMENT_SUMMARY_LABEL` string, and only from `qualify-form.logic.ts`, before
  asserting. Every other product-name mention in that file, and every mention in all the other
  generic sources, remains as loud a failure as before. The genuine reuse risk is separately
  closed: `buildSubmissionBody` keys off `qualify.engagementSummary.emailLabel`, so a second
  product gets its own label and gets a fail-closed throw if it forgets to reserve it.
- **Files modified:** `src/test/qualify-form.test.tsx`, `src/test/product-shell-reuse.test.tsx`
- **Verification:** Both scans still fail on any other HAOO literal; full suite 634 passed.
- **Committed in:** `d6c9df3`

**2. [Rule 3 - Blocking] The synthetic product fixture lacked the newly required config member**

- **Found during:** Task 2 (GREEN phase)
- **Issue:** `engagementSummary` is a required member of `ProductQualifyForm`, and
  `product-shell-reuse.test.tsx` builds its ZENITH fixture as an explicit literal rather than by
  spreading the shipped product. Typecheck failed.
- **Fix:** Reused `HAOO_PRODUCT.qualify.engagementSummary` in the fixture, matching the file's
  existing precedent for `fields` and `groups`, with a comment noting the summary is never
  rendered so reusing its copy cannot satisfy the "no HAOO literal in the DOM" assertion by
  accident. Also added the new formatter to `GENERIC_PRODUCT_SOURCES`, which increases that
  scan's coverage.
- **Files modified:** `src/test/product-shell-reuse.test.tsx`
- **Verification:** `npm run typecheck` exits 0; the ZENITH DOM assertions still pass.
- **Committed in:** `d6c9df3`

**3. [Rule 2 - Missing Critical] A silently factless summary was not covered by any failure row**

- **Found during:** Task 3 (mutation probe)
- **Issue:** The plan's three failure rows are a `null` context, a context missing `flags`, and
  an accessor that throws. A deliberately weakened formatter that returned an empty sentence
  list — rather than the fallback — for an unreadable visit band survived all three. That mutant
  ships `Browser context only; not a lead score. These are coarse signals…` with no facts
  between them: an email that reads like a successful summary and asserts nothing.
- **Fix:** Added three failure rows — a record with no visit band, a record with an unauthored
  visit band, and a record with an unauthored last-seen band. The mutant now dies on two rows,
  and a second probe that silently skipped an unauthored last-seen band dies on one.
- **Files modified:** `src/test/qualify-form.test.tsx`
- **Verification:** Probe re-run confirms the previously-surviving mutant now fails.
- **Committed in:** `1a710e6`

**4. [Rule 3 - Blocking] Campaign row table inferred a union type that rejected `Record<string, string>`**

- **Found during:** Task 3
- **Issue:** TypeScript inferred each campaign row's literal object shape with `undefined`
  members, which is not assignable to the formatter's `Record<string, string>` parameter.
- **Fix:** Annotated `campaignRows` with an explicit readonly row type.
- **Files modified:** `src/test/qualify-form.test.tsx`
- **Verification:** `npm run typecheck` exits 0.
- **Committed in:** `1a710e6`

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 missing critical)
**Impact on plan:** No scope creep. Two deviations preserve shipped contracts the plan's own
instruction would otherwise have broken, one closes a real coverage gap the plan's failure table
did not name, and one is a type annotation. Net effect on protection is positive: the payload
filter and both genericity scans are strictly narrower rather than weaker, and the new formatter
was added to the strongest of them.

## Issues Encountered

- **The Task 3 suite went green on its first run.** The implementation had been delivered in
  Task 2, so a green run proved nothing about whether the table could catch a wrong
  implementation. Following the 04-01 mutation-probe precedent, four deliberately weakened
  formatters were run against it: a first-visit last-seen leak (Pitfall 7) kills 15 rows,
  stored-key flag ordering kills 1, an unauthored-last-seen skip kills 1, and a factless-summary
  return survived until the missing failure rows above were added.
- **Tracer feedback gate.** `workflow.auto_advance` is false but `mode` is `yolo` and
  `human_verify_mode` is `end-of-phase`. Following the precedent 04-01 set in this same phase,
  the gate was cleared by re-running the tracer's `<verify>` end to end
  (`npm run build && npm run test:unit -- --run src/test/qualify-form.test.tsx src/test/build-output.test.ts && npm run typecheck && npm run lint`,
  all exit 0) rather than by stopping for a human. The human eyeball is carried to phase-end UAT
  as coverage item D6.
- **Pre-existing, not caused here.** The leftover untracked worktree at
  `.claude/worktrees/rf-03-retry-1788205465/` makes Vitest collect every suite twice (634 tests
  instead of ~317). All copies pass. Left untouched per instruction; already recorded as a
  STATE.md blocker.

## Known Stubs

None. No hardcoded empty value, placeholder string, TODO or unwired data source was introduced.

## Truthfulness note carried to plan 04-04

The always-visible collection notice still ends `…and no engagement summary is attached to this
submission yet.` That sentence became false the moment this plan shipped. Replacing it is
checkpoint C-1 and belongs to plan 04-04, which owns the disclosure and collection-notice copy;
this plan deliberately did not touch it. **04-04 must land before the phase can be called
truthful**, and it must both replace the C-1 clause and keep disclosure contents item 4 per the
C-2 `include` outcome recorded above. The same applies to
`HAOO_MEASUREMENT.disclosure.summaryBoundary`, which still reads `No engagement summary is
attached to this form submission yet.`

## Verification

- `npm run build && npm run test:unit -- --run src/test/qualify-form.test.tsx src/test/build-output.test.ts` — exit 0
- `npm run typecheck` — exit 0
- `npm run lint` — exit 0
- `npx vitest run` (full suite) — 634 passed, 21 files, 0 failed
- The submitted payload key set is asserted as an exact allowlist including the summary label
  and excluding every internal derivation field.
- The serialize → track → fetch order in `submitValues` is unchanged; the `response.ok`
  truthfulness comment is untouched.

## Next Phase Readiness

- **Ready for 04-03 and 04-04.** 04-04 has everything it needs: the C-2 outcome is `include`,
  so it keeps disclosure contents item 4, and it owns the C-1 replacement clause noted above.
- **Blocker, widened.** Privacy/legal ownership must approve the notice, processor and Kenya
  Data Protection Act treatment before production collection — now covering a campaign label
  travelling to FormSubmit alongside a named enquiry.
- **Carried to UAT.** Coverage item D6 (the maximum-length paragraph read as it would appear in
  a real email body) and D7 (the C-2 disclosure-scope consequence).

---
*Phase: 04-report-and-enrich-the-haoo-funnel-truthfully*
*Completed: 2026-09-01*

## Self-Check: PASSED

- `src/products/engagement-summary.ts` exists on disk.
- `04-02-SUMMARY.md` exists on disk.
- All four commits present in `git log`: `4ef40e9`, `d6c9df3`, `1a710e6`, `7dae5c8`.
- No tracked file was deleted across the plan's commit range.
