---
phase: 05-prove-the-deployed-journey
plan: 17
subsystem: phase-close evidence, gates, requirement statuses
status: complete
tags: [phase-close, gates, playwright, evidence, certificates, owner-decision, requirements, kenya-dpa]
requires:
  - "05-09, 05-11, 05-13, 05-14, 05-15, 05-16 (every live spec, the axe gate, the successor gate, the LEAD-07 chain)"
  - "HAOO deploy 2d45e5f (runs 34729513221, 34729513230) and ZERO-PAPER HUB deploy 3525f6d (run 34714952939)"
provides:
  - "The phase-close gate table: 13 enumerated commands across both repositories, each exit 0, measured 2026-09-13"
  - "The final live (141/128/13, exit 0) and preview (141/33/108, exit 0) evidence pass against a deployment carrying every Phase 5 source fix, committed as records"
  - "Two-layer certificate measurements (Cloudflare edge and GitHub Pages origin) for the owner's D-18 item 4 decision"
  - "05-EVIDENCE.md, the consolidated phase record with its standing-limits section"
  - "Phase 4 UI-SPEC reconciled to the shipped bytes, with a dated amendment note"
  - "Phase 5 requirement statuses set from cited measurements"
affects: ["/gsd-verify-work 05", "milestone audit", "a future ZERO-PAPER HUB phase", "legal/privacy owner (Kenya DPA 2019)"]
tech-stack:
  added: []
  patterns:
    - "Phase-close evidence pass committed as appended recorder records, with a per-file before/after table and every genuine value change named by ID"
    - "Upsert-style baselines restored to HEAD when every re-measured entry is identical apart from timestamps, preserving first-run provenance"
    - "Owner-accepted, orchestrator-drafted sentences recorded with their full provenance and transcribed byte for byte in every record"
key-files:
  created:
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE.md
    - .planning/phases/05-prove-the-deployed-journey/05-17-SUMMARY.md
  modified:
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-GATES.md
    - .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-UI-SPEC.md
    - .planning/REQUIREMENTS.md
    - .planning/STATE.md
    - "evidence/*.json (37 files, records appended by the final pass)"
key-decisions:
  - "05-17: the final evidence pass's appended records were committed (6be6575), not restored: the latest committed keyboard and viewport records still measured the pre-F1-LIVE page, and the recorder never rewrites an earlier record. evidence/axe-baseline.json was restored to HEAD because its upsert replaced 11 of 11 entries that were identical apart from timestamps"
  - "05-17: D-18 item 3 (Kenya DPA 2019 sign-off) dispositioned accepted by the owner, 2026-09-13; sentence owner-accepted, orchestrator-drafted at the owner's request, approved as written. Accepted risk, NOT resolved: no legal review, no compliance determination; the sign-off stays outstanding and is carried beyond Phase 5"
  - "05-17: D-18 item 4 (haoo.online certificate provenance, D34) dispositioned accepted by the owner, 2026-09-13, same provenance. Visitors receive the Cloudflare edge certificate (YE2, serial 06D56404..., issued 2026-09-09); the GitHub Pages origin still serves the 2026-09-03 certificate (YR2, serial 0609A517..., to 2026-12-02). Cloudflare SSL mode and platform rotation behaviour remain unknown"
  - "05-17: LEAD-07 Complete, re-derived from 05-EVIDENCE-MAIL.md rather than inherited; QUAL-01, QUAL-02, QUAL-03 and QUAL-05 Complete (qualified), each naming what was not proven with successor /gsd-verify-work 05 (option labels, E1, E3 held out; KB-O2 browser limit; FS-O1)"
  - "05-17: O-1 and AG-O1 closed by the formal live readings of 2026-09-13 (S4 1 edge script, the CF-JSD-1 bootstrap, 0 beacon; S1 loads only haoo-CHYRGEim.js)"
  - "05-17: the leftover-worktree blocker closed by re-measurement (1 worktree per repository, single-copy counts 688/10 and 32/3); both 04-UI-SPEC contradictions reconciled with a dated amendment note"
requirements-completed: [QUAL-05]
duration: "about 31 min active (Task 1 08:17Z-08:30Z, Task 3 08:36Z-08:48Z), plus the owner checkpoint between"
completed: 2026-09-13
actuals:
  tokens: 18000
  tokens_including_machine_records: 273500
  tasks: 3
  commits: 4
---

# Phase 5 Plan 17: Phase Close Summary

**13 enumerated gates exited 0 across both repositories. A 141-test live pass and preview pass ran against the deploy carrying every Phase 5 fix, and their records are committed with each value change named by ID. Both certificate layers were re-measured. The owner accepted both remaining blockers, and the Kenya DPA sign-off stays outstanding. The Phase 4 contract is reconciled, the five requirement statuses are set from cited measurements, and `05-EVIDENCE.md` records what the phase did and did not prove.**

## Performance

- **Started:** 2026-09-13T08:17Z
- **Completed:** 2026-09-13T08:48Z, with the Task 2 owner checkpoint in between
- **Tasks:** 3, one of them a blocking-human decision
- **Files modified:** 5 planning records plus 37 evidence records

## Accomplishments

**Deploys and gates.**
- **Deploys confirmed.** The deployed HAOO commit `2d45e5f` contains all 8 Phase 5 fix commits
  (`merge-base --is-ancestor`, exit 0 each). ZERO-PAPER HUB `3525f6d` equals its origin.
- **Gate sweep.** Every command was read from the manifests and run in this plan, and each exited 0.
  - HAOO (7 commands): build, typecheck, lint, `npm test` (688 / 10), `verify:coverage`,
    `verify:disjoint` (26/26/26, 0 violations), `test:phase1:contracts`.
  - ZERO-PAPER HUB (6 commands): the same set without coverage, with `npm test` at 32 / 3.
  - `cmp` on the two allowlists also exited 0.

**The evidence pass.**
- **Live and preview passes.** Live: 141 collected, 128 expected, 13 skipped, 0 retries, exit 0.
  Preview: 141 / 33 / 108, exit 0.
- **Not collected.** `e2e/live-submission.e2e.ts` was left out. Nothing was sent.
- **Values that changed, by ID.**
  - F1-LIVE: parent-site hrefs.
  - Deployed bundle names.
  - O-1: S4 edge scripts went from 2 to 1, and the beacon is absent.
  - AG-O1: formal reading, S1 loads only the app bundle.
  - Unchanged: ZM-LIVE, L2-O1 and R-1.

**Owner decisions.**
- **Certificate layers.** The edge and the GitHub Pages origin were measured separately, and both
  readings were given to the owner.
- **Dispositions.** Both items are `accepted`, recorded byte for byte in STATE.md, REQUIREMENTS.md and
  05-EVIDENCE.md, with provenance: owner-accepted, orchestrator-drafted at the owner's request,
  approved as written.

**Records.**
- **Phase 4 contract reconciled.** The C-1 row, the Surface B notice row and the banned-vocabulary
  scope match what shipped, under a dated amendment note. The superseded clause is gone from the
  contract and kept verbatim in 04-04-SUMMARY.
- **Statuses from evidence.** LEAD-07 was re-derived. The four QUAL requirements are qualified, each
  with a named successor. The tally is 28 Complete (4 qualified), 8 Gaps Found, 0 Pending.
- **Consolidated record.** `05-EVIDENCE.md` is written.

## Task Commits

1. **Task 1: evidence pass and gate sweep.**
   - `6be6575` (docs): the final pass's evidence records.
   - `65b2f26` (docs): `05-EVIDENCE-GATES.md` §6.
2. **Task 2: blocking-human dispositions.** No commit of its own. The checkpoint was answered and
   recorded in Task 3.
3. **Task 3: reconcile, statuses, consolidated record.** `fb1b888` (docs).

**Plan metadata:** see the final `docs(05-17)` commit for SUMMARY, STATE and ROADMAP.

## Files Created/Modified

- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE.md`: the consolidated phase record.
- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-GATES.md`: §6, the phase-close sweep,
  passes, per-file evidence table and certificate readings.
- `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-UI-SPEC.md`: reconciled, with
  an amendment note.
- `.planning/REQUIREMENTS.md`: Phase 5 status evidence, traceability rows, the two carry-forward rows
  and the tally.
- `.planning/STATE.md`: nine blocker lines updated. Worktree, both Phase 4 contract entries, O-1 and
  AG-O1 are closed. The Kenya DPA line is now a standing accepted-risk item. The certificate is
  accepted. The 05-15 CI note is updated.
- `evidence/*.json` (37 files): records appended by the final pass.

## Decisions Made

See `key-decisions` in the frontmatter. The two owner dispositions are the owner's decisions,
recorded with their provenance. The executor made none of them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Committed the evidence records the final pass wrote**
- **Found during:** Task 1
- **Issue:** Task 1's `<files>` lists only `05-EVIDENCE-GATES.md`. The pass appended records to 37
  tracked `evidence/*.json` files. Restoring them would have left the latest committed keyboard and
  viewport readings measuring the page from before F1-LIVE was deployed. That contradicts the plan's
  truth that "no live claim is measuring a superseded page".
- **Fix:**
  - Committed the appended records in their own commit, with no earlier record rewritten.
  - Documented a before/after count and every changed value per file (`05-EVIDENCE-GATES.md` §6.6–§6.7).
  - Restored `evidence/axe-baseline.json` to HEAD by explicit path: its upsert had replaced 05-07's
    entries with values identical apart from timestamps.
- **Files modified:** 37 `evidence/*.json` files.
- **Commit:** `6be6575`.

**2. [Rule 2 - Missing critical] Measured criterion 3's navigation and refresh in this plan**
- **Found during:** Task 3
- **Issue:** No Phase 5 spec reloads the live HAOO page. Criterion 3 names direct navigation and refresh.
- **Fix:** Two consecutive `curl` GET rounds at 08:40Z. HAOO page 200, apex and http 301 to `www`,
  brochure PDF 200 at 2160873 B, retired path 200. Recorded in `05-EVIDENCE.md` §3.1. Nothing was submitted.
- **Commit:** `fb1b888`.

**3. [Rule 1 - Bug] Folded two REQUIREMENTS.md table rows back onto single lines**
- **Found during:** Task 3
- **Issue:** Multi-line cell content broke the carry-forward table (column count 2 instead of 4).
- **Fix:** Joined the cell lines with `<br>`. A re-check found a consistent column count in every table.
- **Commit:** `fb1b888`.

### Status-setting note

QUAL-05 was ticked and all four QUAL rows read "Complete (qualified)", each naming what was not proven
and its successor. This was set by hand from the evidence. `requirements mark-complete` was not run,
because it would overwrite the qualified wording with a bare status, and the plan requires the
qualification to be stated.

**Total deviations:** 3 auto-fixed (2 missing critical, 1 bug).
**Impact on plan:** they keep the live claims current and the records well formed. The scope is unchanged.

## Issues Encountered

None blocking. Every gate, pass and verify command exited 0 on its first run.

## Auth Gates

None.

## Known Stubs

None. This plan changed planning records and evidence only, with no product source.

## Threat Flags

None. No new network endpoint, auth path or schema surface. Every live reading was a GET, and nothing
was submitted or pushed.

## Next Phase Readiness

- **Phase 5 can go to `/gsd-verify-work 05`.** Owed there:
  - the three held-out judgements (option labels at 360 px, E1, E3)
  - FS-O1
  - KB-O2 as a recorded limit
- **Standing beyond Phase 5:**
  - **Kenya DPA 2019 sign-off:** accepted risk, outstanding, carried beyond Phase 5.
  - **Origin certificate:** accepted until 2026-12-02; CT monitoring deferred.
  - **Owner's PostHog web and product analytics check:** pending.
  - **Deferred:** CSS-O1, G-1, and F4/F4b/F5/F6 with KB-O1 and VP-O1 to VP-O3.
- **Not pushed.** HAOO local `main` is ahead of origin by documentation and evidence commits only.
  Whether to push once at phase close is the owner's decision.

## Self-Check: PASSED

- FOUND: `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE.md`
- FOUND: `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-GATES.md` §6
- FOUND commits: `6be6575`, `65b2f26`, `fb1b888`
- The plan's Task 3 `<verify>` exited 0: `npm test` 688/10 (HAOO) and 32/3 (ZERO-PAPER HUB), plus
  `standing limits`, the five requirement IDs and `F4` present in `05-EVIDENCE.md`.
- The superseded C-1 clause occurs 0 times in `04-UI-SPEC.md`; the shipped clause occurs once.
- Both approved sentences appear byte-identical exactly once in each of STATE.md, REQUIREMENTS.md and
  05-EVIDENCE.md.

---
*Phase: 05-prove-the-deployed-journey*
*Completed: 2026-09-13*
