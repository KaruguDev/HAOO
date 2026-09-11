---
phase: 05-prove-the-deployed-journey
plan: 07
subsystem: testing
tags: [axe-core, "@axe-core/playwright", playwright, accessibility, wcag22aa, evidence]

requires:
  - phase: 05-05
    provides: "axeFor factory, AXE_TAGS, BLOCKING_IMPACTS, AXE_PER_URL_DISABLES, S3 include(#products) scoping, SURFACES and VIEWPORTS closed lists"
  - phase: 05-03
    provides: "The live and preview Playwright projects, and the measured REPLACEMENT composition behaviour the factory is built against"
provides:
  - "e2e/axe-baseline.e2e.ts: a non-gating axe sweep of S1 (4 states), the S3 Products region, S4 (as served and with the refresh stripped) and S5 (4 preview-only form states)"
  - "evidence/axe-baseline.json: 11 provenance-carrying entries with full violation and incomplete sets, integer impact counts, and a per-entry rule accounting"
  - "A method assertion: a scan whose executed rules are not the rules the configuration selects fails the run instead of being recorded"
  - "05-EVIDENCE-AXE.md: the classified baseline. Blocking 0, recorded-only 0, total violations 0, plus review item R-1 handed to 05-14"
affects: [05-10, 05-14, "future ZERO-PAPER HUB accessibility phase"]

actuals:
  tokens: 31683
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Rule accounting per axe run: tag-matched, minus the engine's tagExclude, minus page-level rules when scoped to a region, minus per-URL disables, equals selected; selected equals applicable plus inapplicable, asserted before writing"
    - "Read engine selection state (axe._audit.rules, axe._audit.tagExclude) from the instance injected into the page, not from a second Node-side axe-core copy"
    - "Upsert evidence entries keyed by surface and state, so a re-run replaces a measurement and does not duplicate coverage"

key-files:
  created:
    - e2e/axe-baseline.e2e.ts
    - evidence/axe-baseline.json
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-AXE.md
  modified: []

key-decisions:
  - "The baseline's rule accounting mirrors axe-core 4.13.0's own selection (matchTags and ruleShouldRun) and not the public axe.getRules(tags). getRules lists 70 rules, but the engine holds back 7 experimental or deprecated ones and skips page-level rules on a scoped context. Using getRules made a correct run look narrowed."
  - "S4's serious bypass result is INCOMPLETE, not a violation, so it is outside the D-OQ-1 violation count. It is handed to 05-14 as review item R-1 with full detail, and bypass stays undisabled for every surface."
  - "The first live baseline at axe-core 4.13.0 measures 0 violations at every impact across 11 surface-states. Seven WCAG-tagged experimental or deprecated rules are not performed under this configuration, and are recorded by id."

patterns-established:
  - "A count of rules that returned results is a count of APPLICABLE rules. Record the inapplicable bucket and the selection beside it, or the record cannot tell a sparse surface from a narrowed run."

requirements-completed: [QUAL-01, QUAL-02, QUAL-03]

coverage:
  - id: D1
    description: "Every surface is scanned in every reachable state (4 live S1 states, the S3 Products region, S4 twice, 4 preview-only S5 states) through axeFor, and the run records findings without failing on them"
    requirement: QUAL-03
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/axe-baseline.e2e.ts (7 run, 4 skipped as preview-only)"
        status: pass
      - kind: e2e
        ref: "npx playwright test --project=preview e2e/axe-baseline.e2e.ts (4 run, 7 skipped as live-only)"
        status: pass
    human_judgment: false
  - id: D2
    description: "evidence/axe-baseline.json holds 11 entries, each with engine version, 5 tags, URL, state, timestamp, an explicit violations array and a closed rule accounting, with exactly one modified-page entry"
    requirement: QUAL-03
    verification:
      - kind: other
        ref: "05-07-PLAN.md Task 1 <verify><automated> node shape check"
        status: pass
    human_judgment: false
  - id: D3
    description: "05-EVIDENCE-AXE.md classifies the record: provenance, 11-row integer impact table, blocking list (0), recorded-only list (0), D-OQ-3 boundary with F4/F4b/F5/F6 cross-referenced, both hit-target numbers"
    requirement: QUAL-03
    verification:
      - kind: other
        ref: "05-07-PLAN.md Task 2 <verify><automated>"
        status: pass
      - kind: other
        ref: "row-by-row cross-check of all 22 table rows and the totals row against evidence/axe-baseline.json"
        status: pass
    human_judgment: false
  - id: D4
    description: "R-1 (bypass, serious, incomplete on S4) is classified as a review item and not a blocking finding"
    requirement: QUAL-03
    verification: []
    human_judgment: true
    rationale: "axe could not decide R-1. Whether WCAG 2.4.1 applies to a single three-paragraph document with no repeated block is a human judgment that plan 05-14's gate must record. This plan hands it forward and does not settle it."

duration: 25min
completed: 2026-09-12
status: complete
---

# Phase 5 Plan 07: Accessibility Baseline Summary

**The first axe run ever made against either live site, run in 11 surface-states through the shared factory at axe-core 4.13.0. It records 0 violations at every impact. Each entry's rule accounting is asserted to close, so a narrowed run fails and cannot be recorded as clean. The only serious result is an undecided `bypass` on the retired-path document (S4), handed to 05-14 as review item R-1.**

## Performance

- **Duration:** about 25 min for this continuation session. The first executor was killed by a spend limit before committing anything, and its time is not recoverable.
- **Started (continuation):** about 2026-09-11T21:00Z
- **Completed:** 2026-09-11T21:26Z (2026-09-12 00:26 +03:00)
- **Tasks:** 2 of 2
- **Files created:** 3

## Accomplishments

- **Coverage.** Every surface this plan names is scanned in every state it names, and each state is its own entry. On S1 that is the default state, the measurement disclosure expanded, the error summary, and the mobile nav open at 360 px. The S3 Products region is scanned by inclusion, never by disabling a rule. S4 is read twice: as served, with the refresh destination aborted, and with its refresh directive stripped (the one modified-page entry). The preview-only in-flight, success, transport-failure and blocked states are induced by routing and a runtime hook.
- **Rule accounting.** The record now tells a sparse surface apart from a narrowed run. Each entry records:
  - the 70 tag-matched rules;
  - the 7 the engine holds back;
  - the page-level rules the scope left out (`bypass` on S3 only);
  - the selected rules (63, or 62 on S3);
  - the applicable and inapplicable rules.

  The spec asserts applicable plus inapplicable equals selected before writing. This explains the 29/12/10/9/28/23 applicable counts rule by rule, in 05-EVIDENCE-AXE.md §2.
- **Classification.** Blocking: 0. Recorded-only: 0. Total violations: 0. `color-contrast`, the serious rule most expected to fire (RESEARCH Pitfall 11), applied on all 11 entries and returned 0 violations and 0 incomplete.
- **Hand-off to 05-14.** The blocking list is empty (B-0) and there is one review item, R-1: `bypass`, `serious`, incomplete on S4 in both readings, node `html`, with the failure summary recorded.

## Task Commits

1. **Task 1: Sweep every surface in every reachable state and record the complete result**: `4d0fa5f` (feat)
2. **Task 2: Classify the baseline into blocking and recorded-only, and hand a triage list forward**: `87437eb` (docs)

**Plan metadata:** recorded in the close-out commit (docs: complete plan)

## Files Created/Modified

- `e2e/axe-baseline.e2e.ts`: the non-gating sweep, 11 scans, every one built by `axeFor`, with method assertions only. The assertions check that the right document and state were measured, that no live request left for the lead endpoint, and that the rules which ran are the rules the configuration selected.
- `evidence/axe-baseline.json`: the machine record, 11 entries.
- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-AXE.md`: the classified baseline and the triage hand-off.

## Decisions Made

- **Accounting uses the engine's selection semantics, read from the page.** `tagExclude` and each rule's `pageLevel` flag exist only on `axe._audit`. Reading private state was accepted because the engine keeps them nowhere else, and the helper throws if a vendor upgrade moves them, so it never accounts against a guess. `target-size` is `enabled: false` by default but runs on an explicit `wcag22aa` match, so `enabled` is deliberately not consulted.
- **R-1 is a review item, not a blocking finding.** It sits in axe's `incomplete` bucket, not `violations`. What axe failed to find (no skip link, heading or landmark) are the three absences 04.2 D-12 defines as correct for S4. The disable table is not the place to decide it, and no `bypass` disable exists for any surface.
- **The record is not written through `recordEvidence`.** This was the first executor's decision, kept and documented in the spec. That recorder's envelope nests one measurement per record, while this plan's `<verify>` requires flat entries with provenance at the top level. The verdict-word discipline is kept structurally: no entry has a verdict field.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] The record could not tell a narrowed run from a sparse surface**
- **Found during:** Task 1, re-verifying the killed executor's work
- **Issue:** Entries carried `ruleIds` from passes, violations and incomplete only. Inapplicable rules were never recorded, so a surface with little markup (S4: 9 or 10 rules) and a run narrowed by the T-05-29 hazard would look alike. The first executor had noted the gap before it was killed.
- **Fix:**
  - Added the per-entry rule accounting fields.
  - Added `engineSelectionFor`, which mirrors axe-core's `matchTags` and `ruleShouldRun`.
  - Added a method assertion that applicable plus inapplicable equals selected.
  - Renamed `ruleIds`/`ruleCount` to `applicableRuleIds`/`applicableRuleCount` to match what they measure.
- **Caught on the way:** the first attempt used the public `axe.getRules(tags)`. The new assertion failed the live S1 scan, showing 7 rules that getRules lists but the engine never runs (experimental or deprecated). The source also showed that page-level rules are skipped on a scoped context, which would have failed S3. Both are now modelled.
- **Files modified:** `e2e/axe-baseline.e2e.ts`, `evidence/axe-baseline.json` (regenerated from an empty file)
- **Verification:** Task 1 `<verify>` exits 0. Accounting closes on all 11 entries. Typecheck and lint are 0.
- **Committed in:** `4d0fa5f`

**2. [Rule 1 - Bug] A header comment would fail the literal acceptance grep**
- **Found during:** Task 1 acceptance check
- **Issue:** The criterion "no `new AxeBuilder` appears in the spec file" is a literal grep, and it hit the header comment that stated there was none.
- **Fix:** Reworded the comment to "No builder is constructed locally in this file."
- **Verification:** `grep -c 'new AxeBuilder' e2e/axe-baseline.e2e.ts` gives `0`.
- **Committed in:** `4d0fa5f`

### Documented divergence from plan text (no code change)

- **The explicit heading-order rule.** Task 1's action says the factory carries "the explicit heading-order rule". It does not, and cannot: 05-03 measured REPLACEMENT composition, and 05-05 recorded that heading order is a spec-authored DOM walk owned by plan 05-10. Task 2's own wording ("whichever plan 05-05 recorded as the composition outcome") anticipates this, and 05-EVIDENCE-AXE.md §1 states it.

---

**Total deviations:** 2 auto-fixed (1 missing critical functionality, 1 bug), plus 1 documented plan-text divergence.
**Impact on plan:** Deviation 1 strengthens the plan's own T-05-29 mitigation from a count a reader must notice to a sum the run refuses to violate. There was no scope creep, and no finding was changed or removed.

## Issues Encountered

- **Two early verify attempts ended with exit 144.** A `pkill -f` pattern matched the shell running it, which killed that shell. The runs were redone cleanly; nothing was committed from an interrupted run.
- **What this record does not cover,** stated so no one reads it as covered: S2 (the noscript document, outside this plan's sweep), heading order (plan 05-10), the 7 tag-excluded WCAG-tagged rules, and the 44 x 44 primary-action floor (VC-2). axe's `target-size` rule checks only the 24 x 24 minimum.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- **Plan 05-14** inherits an empty blocking list (B-0) and one review item (R-1). It must decide how its gate treats serious incompletes, and record a human judgment on R-1 if the gate looks at them.
- **Plan 05-10** still owns heading order, which this run does not measure.
- **Requirements.** `requirements-completed` copies QUAL-01/02/03 verbatim, as the template requires. The shared-ID gate leaves them open while sibling plans that also declare them are unfinished. This baseline is evidence toward them; it does not complete them.

## Gate Baseline

| Gate | Result |
|------|--------|
| `npm run typecheck` | 0 |
| `npm run lint` | 0 |
| `npm test` | 0, 684 tests across 10 files |
| `npm run verify:disjoint` | 0, with 26 shared / 26 allowlist / 0 violations |

## Self-Check: PASSED

- The three created files exist on disk.
- Commits `4d0fa5f` and `87437eb` are in `git log`.
- Task 1 `<verify>` exits 0 on the committed spec.
- Task 2 `<verify>` exits 0.
- Every table row in 05-EVIDENCE-AXE.md equals the value derived from the record.

---
*Phase: 05-prove-the-deployed-journey*
*Completed: 2026-09-12*
