---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
plan: 04
subsystem: ui
tags: [disclosure, privacy, approved-copy, react, vitest, product-generic-copy]

# Dependency graph
requires:
  - phase: 04-report-and-enrich-the-haoo-funnel-truthfully
    provides: "Plan 04-02's attached engagement summary and its resolved C-2 `include` outcome, which together made the Phase 3 collection notice false and fixed what the disclosure must list"
  - phase: 03-build-privacy-bounded-engagement-context
    provides: "The measurement disclosure component, the ProductMeasurementDisclosure config type, the always-visible collection notice and its submit-control accessible-description wiring"
provides:
  - "The owner-approved C-1 replacement clause in every place the collection notice is rendered, built or asserted"
  - "`qualifyCollectionNotePageContext` as the single source of that sentence, with product data and two test constants derived from it rather than restating it"
  - "`summaryHeading`, `summaryIntro` and `summaryContents` as required members of `ProductMeasurementDisclosure`"
  - "The labelled `What we attach to your form submission` disclosure group, rendered between the never-collected group and the clear control"
  - "Contracts pinning the group's byte-exact copy, its document position, its independence from stored context and storage availability, and the component's freedom from visitor-facing literals"
affects: [04-05 provider enablement and source scans, phase verification, gsd-secure-phase, UI-SPEC reconciliation]

# Actuals (#2632) — same estimateTokens scale (chars/4 over the realized diff).
actuals:
  tokens: 6300
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "One hand-typed approved literal, everything else derived: owner-approved copy is typed once in the test that asserts rendered `textContent` equality, and product data plus the remaining assertions derive the same sentence from a single copy builder"
    - "Bundle assertions over template segments: when approved copy is assembled at runtime from a product-generic template, the built-bundle guard asserts the template's static segments (split on the product name) instead of one contiguous sentence"
    - "Configured-string source scan: the component-holds-no-literal contract is derived from the shipped product data rather than a hand-written blocklist, so a string that migrates into the component fails without anyone remembering to list it"

key-files:
  created: []
  modified:
    - src/products/copy.ts
    - src/products/haoo.ts
    - src/products/types.ts
    - src/components/MeasurementDisclosure.tsx
    - src/test/measurement-page.test.tsx
    - src/test/build-output.test.ts
    - src/test/qualify-form.test.tsx
    - src/test/product-shell-reuse.test.tsx

key-decisions:
  - "Blocking checkpoint C-1 was resolved by the human product owner as the `A-plus-campaign` variant, NOT the UI-SPEC proposal verbatim: the UI-SPEC clause's `a short readable summary of them` binds to an enumeration that excludes campaign values, which under-discloses once C-2 resolved `include`."
  - "`qualifyCollectionNotePageContext` is the single source of the notice sentence; HAOO product data calls it rather than restating it, and only one test keeps a hand-typed copy of the approved bytes."
  - "The built-bundle notice assertion now checks the approved template's static segments, because deriving the sentence in product data means it is assembled at runtime and no longer appears in the bundle as one contiguous literal."
  - "All four disclosure contents items ship, including the campaign item, per the C-2 `include` outcome recorded in 04-02-SUMMARY.md."
  - "`summaryHeading`, `summaryIntro` and `summaryContents` are required (not optional) members, so a product configuration that forgets one fails typecheck rather than rendering a blank where a promise about the visitor's data belongs."

patterns-established:
  - "Approved visitor-facing copy has exactly one hand-typed home and one derivation path; every other surface derives, and a contract asserts the derivation against the hand-typed bytes."
  - "A disclosure group that describes data is proven inert by seeding a context that could not occur by accident (a distinctive campaign trio, every flag true) and asserting none of it reaches the markup."

requirements-completed: [MEAS-05, MEAS-08]

coverage:
  - id: D1
    description: "The always-visible collection notice states that a readable summary of the engagement signals, and of any campaign values seen on arrival, is attached when the form is sent — in the owner-approved byte-exact C-1 wording — and no surface in the repository still claims otherwise."
    requirement: MEAS-05
    verification:
      - kind: unit
        ref: "src/test/measurement-page.test.tsx#Phase 3 HAOO measurement disclosure > renders the approved complete measurement disclosure (exact textContent equality against the hand-typed approved literal)"
        status: pass
      - kind: unit
        ref: "src/test/measurement-page.test.tsx#Phase 3 HAOO measurement disclosure > derives the shipped collection notice from the one approved copy builder"
        status: pass
      - kind: integration
        ref: "src/test/build-output.test.ts#renders the approved complete measurement disclosure surface (built-bundle segment assertion)"
        status: pass
      - kind: other
        ref: "grep -rn 'no engagement summary is attached' src/ => 0 lines (case-insensitive variant also 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The visitor can read, before submitting, a fixed labelled list of exactly what the attached engagement summary contains — heading, intro, four contents items including campaign values, and the closing boundary line — in byte-exact UI-SPEC Surface B copy."
    requirement: MEAS-05
    verification:
      - kind: unit
        ref: "src/test/measurement-page.test.tsx#Phase 4 disclosure of the attached engagement summary > carries the approved Surface B copy as product data"
        status: pass
      - kind: unit
        ref: "src/test/measurement-page.test.tsx#Phase 4 disclosure of the attached engagement summary > renders a labelled group listing what the attached summary contains"
        status: pass
    human_judgment: false
  - id: D3
    description: "The group sits after the never-collected group and before the clear-context control, in the disclosure's true top-to-bottom reading order."
    requirement: MEAS-05
    verification:
      - kind: unit
        ref: "src/test/measurement-page.test.tsx#Phase 4 disclosure of the attached engagement summary > positions the group after the never-collected group and before the clear control"
        status: pass
      - kind: unit
        ref: "src/test/measurement-page.test.tsx#Phase 3 HAOO measurement disclosure > renders the approved complete measurement disclosure (orderedCopy document-order array)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The group reads nothing at runtime: it renders identically with a stored context present and with storage blocked, and reflects none of the visitor's own campaign values, flag keys, capped visit step or day-only date back into the markup."
    requirement: MEAS-08
    verification:
      - kind: unit
        ref: "src/test/measurement-page.test.tsx#Phase 4 disclosure of the attached engagement summary > reflects none of the visitor own campaign values or flags back into the markup"
        status: pass
      - kind: unit
        ref: "src/test/measurement-page.test.tsx#Phase 4 disclosure of the attached engagement summary > renders identical group markup whether or not browser storage is available"
        status: pass
    human_judgment: false
  - id: D5
    description: "The disclosure component stays a product-generic shell: every visitor-facing string comes from product configuration, an omitted member is a typecheck error, and the synthetic non-HAOO product still renders the whole group."
    requirement: MEAS-08
    verification:
      - kind: unit
        ref: "src/test/measurement-page.test.tsx#Phase 4 disclosure of the attached engagement summary > keeps every visitor-facing disclosure string out of the component source"
        status: pass
      - kind: unit
        ref: "src/test/product-shell-reuse.test.tsx#Phase 1 product shell reuse contracts (ZENITH fixture carrying the three new members)"
        status: pass
      - kind: other
        ref: "npm run typecheck => exit 0 with summaryHeading/summaryIntro/summaryContents required on every disclosure config"
        status: pass
    human_judgment: false
  - id: D6
    description: "At a 320px viewport and at 200% zoom the new group and the replaced notice clause wrap inside the existing form measure with no clamp, truncation or horizontal scroll, the group reads as part of the same inset, and the replacement clause reads naturally in place."
    verification:
      - kind: other
        ref: "src/test/build-output.test.ts — the disclosure source is asserted to contain no skeleton/spinner/loading/line-clamp/truncate/text-ellipsis/overflow-x class; the group introduces no new Tailwind token and reuses the never-collected group's list and spacing classes"
        status: pass
    human_judgment: true
    rationale: "The plan's own <human-check> for Task 3. Whether the longer clause reads naturally in place, and whether the taller inset still reads as one group at 320px and 200% zoom, is a judgment about rendered visual result that the class-level assertion cannot make. workflow.human_verify_mode is end-of-phase, so this is carried to phase-end UAT following the 04-01/04-02 precedent."
  - id: D7
    description: "Checkpoint C-1 was resolved as a deliberate divergence from the UI-SPEC's byte-exact C-1 row, so the UI-SPEC still records superseded proposed copy."
    verification: []
    human_judgment: true
    rationale: "A human product-owner copy decision that intentionally departs from an already-signed-off UI contract. The shipped bytes are pinned by tests, but reconciling 04-UI-SPEC.md's C-1 row and Surface B narrative to match what shipped is a documentation decision that needs the owner, not a test."

# Metrics
duration: 13 min
completed: 2026-09-01
status: complete
---

# Phase 4 Plan 4: Truthful Disclosure of the Attached Engagement Summary Summary

**The always-visible collection notice now names what actually travels with the enquiry — the owner-approved C-1 clause covering both the engagement summary and any campaign values — derived from one copy builder instead of five literals, alongside a new labelled `What we attach to your form submission` disclosure group that lists the attachment's contents in fixed copy and reads nothing at runtime**

## Performance

- **Duration:** 13 min
- **Started:** 2026-09-01T06:29:00Z
- **Completed:** 2026-09-01T06:42:00Z
- **Tasks:** 2 executed (Task 1 was the resolved C-1 checkpoint)
- **Files modified:** 8

## Checkpoint C-1 outcome — the approved clause, verbatim

**Blocking checkpoint C-1 was resolved by the human product owner as the `A-plus-campaign`
variant, NOT the UI-SPEC proposal verbatim.**

The approved byte-exact final clause of the collection notice is:

```
These signals stay separate from your form answers, and when you send this form we attach a short readable summary of them and of any campaign values seen on arrival — never a score, an identifier, or your form answers.
```

The character before `never` is an em dash (U+2014), matching the UI-SPEC construction.

**Why the divergence.** The UI-SPEC proposed:

```
These signals stay separate from your form answers, and when you send this form we attach a short readable summary of them — never a score, an identifier, or your form answers.
```

In that sentence `a short readable summary of them` binds `them` to `These signals`, which the
notice's first paragraph enumerates as prior-visit, last-visit and brochure/form/contact/
self-onboarding actions. Campaign values are not in that enumeration — they are disclosed
separately, in the disclosure's own campaign section. When checkpoint C-2 resolved `include`
(recorded in `04-02-SUMMARY.md`), a normalized campaign label began travelling to FormSubmit
alongside a named enquiry. The UI-SPEC clause would therefore have **under-disclosed**: truthful
about the engagement summary, silent about the campaign label attached beside it. The owner's
variant names both, so the notice covers everything that actually leaves the browser.

**This is a deliberate, human-approved divergence from the UI-SPEC's byte-exact C-1 row, and it
is flagged here for reconciliation.** `04-UI-SPEC.md` still carries the superseded proposed
clause in its "Blocking human checkpoints" table (C-1 row); that row should be updated to the
shipped text so a future reader does not treat the UI-SPEC as the authority on copy that was
subsequently changed by the person who owns it. Carried as coverage item D7.

**Checkpoint C-2 remains `include`,** so all four disclosure contents items ship, including
item 4: `Any campaign values described above, if they were present when you arrived.`

## Accomplishments

- **The notice is true again.** Plan 04-02 shipped an attached engagement summary while the
  visitor-facing notice still promised that nothing was attached. That sentence is gone from
  the repository — `grep -rn 'no engagement summary is attached' src/` returns zero lines, in
  both the lowercase collection-note form and the capitalised boundary-line form — and its
  replacement is the owner-approved clause above.
- **Five hand-typed copies became one builder plus one anchor.** `qualifyCollectionNotePageContext`
  is now the single source of the sentence. `HAOO_PRODUCT.qualify.collectionNote.pageContext`
  calls it; the `build-output` and `qualify-form` constants derive from it; only
  `measurement-page.test.tsx` keeps a hand-typed copy of the approved bytes, and a new contract
  asserts the builder output against those bytes and against the shipped product data. There is
  no longer any pair of literals that can drift apart silently.
- **The disclosure now describes the attachment.** A labelled `What we attach to your form
  submission` section renders the heading, the intro, a four-item semantic list and the new
  boundary line, positioned between the never-collected group and the clear control. It is fixed
  copy: it reads no stored context, has no loading state and no error state, and cannot render a
  subset conditioned on what the visitor actually did.
- **The locked prohibition is executable.** A contract seeds a campaign trio
  (`zebrasource`/`zebramedium`/`zebracampaign`) and every interaction flag set to true, then
  asserts that none of those values, none of the raw flag keys, and neither `visitOrdinal` nor
  `lastSeenDay` nor the seeded day value appears anywhere in the disclosure markup. A second
  contract asserts the group's markup is byte-identical with storage readable and with storage
  throwing.
- **The component still holds no copy.** The source scan that proves it is derived from the
  shipped `HAOO_MEASUREMENT.disclosure` values rather than a hand-written blocklist, so a string
  that migrates into the component fails the contract whether or not anyone thought to list it.
- **Full suite green:** 641 passed (was 634 before this plan; +7 new contracts), `npm run lint`,
  `npm run typecheck` and `npm test` all exit 0.

## Task Commits

1. **Task 2: Replace the collection-notice clause everywhere it is asserted, in one commit**
   - `370628b` (fix) — `copy.ts`, `haoo.ts` and all three test constants in a single commit, so
     no test ever asserted a sentence the page no longer rendered.
2. **Task 3: Add the labelled disclosure group describing what is attached** (tdd)
   - `591f6e1` (test) — RED: 7 failing contracts, including the deliberate `orderedCopy` edit
     the copy change invalidates.
   - `8a175f0` (feat) — GREEN: the type members, the byte-exact HAOO copy, the rendered section,
     and the synthetic-product fixture.

No REFACTOR commit: the group reuses the never-collected section's markup shape, list classes
and spacing verbatim, so there was nothing to clean up.

## Files Created/Modified

- `src/products/copy.ts` — `qualifyCollectionNotePageContext` carries the approved C-1 clause and
  a doc comment recording the approval, the C-2 dependency, and the rule that no surface may
  restate the sentence.
- `src/products/haoo.ts` — `collectionNote.pageContext` now calls the builder; the disclosure
  block gains `summaryHeading`, `summaryIntro` and the four `summaryContents` items, and its
  `summaryBoundary` is replaced with the new closing line.
- `src/products/types.ts` — `ProductMeasurementDisclosure` gains the three required members
  beside `summaryBoundary`, with a comment stating why they are required rather than optional.
- `src/components/MeasurementDisclosure.tsx` — the bare boundary paragraph is replaced by a
  `section` with `aria-label={disclosure.summaryHeading}` containing heading, intro, list and
  boundary. No new Tailwind token, no new spacing value, no literal string.
- `src/test/measurement-page.test.tsx` — the one hand-typed approved notice literal, the
  builder-derivation contract, the byte-exact Surface B constants, the updated `orderedCopy`
  array, and the six new Phase 4 group contracts.
- `src/test/build-output.test.ts` — the notice constant is derived; the built-bundle assertion
  checks the approved template's static segments.
- `src/test/qualify-form.test.tsx` — `COLLECTION_CONTEXT` is derived from the builder.
- `src/test/product-shell-reuse.test.tsx` — the synthetic ZENITH disclosure fixture gains the
  three new members, keeping the component's product-genericity proof intact.

## Decisions Made

- **C-1 shipped as the `A-plus-campaign` variant** — see the dedicated section above.
- **One hand-typed literal, four derivations.** The plan's Phase 2 precedent is that a
  hand-written duplicate of approved copy drifts silently while a derivation cannot. But a
  repository in which *every* copy derives from the builder can no longer detect a change to the
  builder itself, which is exactly what an owner-approved sentence needs pinned. The resolution:
  the approved bytes are typed once, in the test that asserts rendered `textContent` equality,
  and a contract asserts the builder and the shipped product data against those bytes.
- **All four contents items ship.** C-2 resolved `include`, so omitting the campaign item would
  under-disclose in the same way the UI-SPEC's C-1 clause would have.
- **The three new members are required, not optional.** An optional member would let a future
  product ship a disclosure with a silently missing promise about the visitor's data. Required
  members turn that into a `tsc` failure — verified: the ZENITH fixture failed typecheck until
  it was updated.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The built-bundle notice assertion could not survive the derivation the plan requires**

- **Found during:** Task 2 (`npm test`, after the targeted suites were green)
- **Issue:** The plan instructs `haoo.ts` to call `qualifyCollectionNotePageContext('HAOO')`
  rather than restate the sentence. That call is evaluated at runtime, not at build time, so
  after the change the assembled sentence no longer exists in the built bundle as one contiguous
  literal — the bundle carries the template's static segments around each interpolated product
  name. `expect(bundle).toContain(APPROVED_COLLECTION_NOTICE)` in
  `src/test/build-output.test.ts` therefore failed, while every rendered-page assertion passed.
  The two plan instructions — derive in product data, and keep the built-bundle assertion green —
  are not simultaneously satisfiable in their literal form.
- **Fix:** The assertion now splits the approved notice on the product name and requires the
  bundle to contain every resulting segment. That reconstructs exactly the template's static
  text, and the final segment carries the entire owner-approved C-1 clause, so any drift in the
  approved wording still fails the built-bundle guard. Assembly itself — the product name landing
  in both interpolation slots to produce the approved sentence — is covered by the exact
  `textContent` equality in `measurement-page.test.tsx`, which runs against the rendered page.
  Deleting or weakening the bundle guard was rejected; narrowing what it can observe while
  keeping the drift detection was the smaller loss.
- **Files modified:** `src/test/build-output.test.ts`
- **Verification:** `npm test` (which builds first) exits 0 with the segment assertion in place;
  mutation-probed by hand — changing one word of the builder's final clause fails the bundle
  assertion.
- **Committed in:** `370628b` (Task 2 commit)

**2. [Rule 3 - Blocking] A doc comment quoting the superseded sentence violated the plan's own zero-grep criterion**

- **Found during:** Task 2 (acceptance-criteria verification)
- **Issue:** The doc comment added above `qualifyCollectionNotePageContext` explained the change
  by quoting the Phase 3 clause it replaces. That reintroduced the exact literal the plan's
  acceptance criterion requires to return zero lines from `grep -rn 'no engagement summary is
  attached' src/`. A comment is not a rendered surface, but a criterion that a comment can
  satisfy is a criterion that stops meaning what it says.
- **Fix:** The comment now describes the superseded clause rather than quoting it ("Phase 3's
  clause closed by denying that anything was attached to the submission"). The grep returns zero
  lines.
- **Files modified:** `src/products/copy.ts`
- **Verification:** `grep -rn 'no engagement summary is attached' src/` and its case-insensitive
  variant both return zero lines.
- **Committed in:** `370628b` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** No scope creep and no weakened protection. One adapts a build-time assertion
to a runtime-assembled string while preserving its drift detection; the other removes a literal
that would have made a verification criterion vacuous. Every planned type member, rendered
element, contract and acceptance criterion is unchanged.

## Issues Encountered

- **A file was truncated mid-plan and recovered before any commit.** An edit helper opened a
  file for writing before computing its replacement, so when the transform raised on a
  mismatched pattern, `src/test/measurement-page.test.tsx` was left at zero bytes. It was
  restored immediately with a single-file `git checkout -- src/test/measurement-page.test.tsx`
  against the clean HEAD, confirmed at its original 28,541 bytes, and re-edited with a helper
  that computes the transform before opening the file. Nothing was committed in the truncated
  state and no other file was affected.
- **Pre-existing, not caused here.** The leftover untracked worktree at
  `.claude/worktrees/rf-03-retry-1788205465/` still makes Vitest collect every suite twice
  (641 tests instead of roughly half that). All copies pass. Left untouched per instruction;
  already recorded as a STATE.md blocker.

## Known Stubs

None. No hardcoded empty value, placeholder string, TODO, FIXME or skipped test was introduced.
The `placeholderOption` members in `src/products/haoo.ts` are pre-existing select-control copy,
not stubs.

## Verification Results

Plan-level `<verification>`, all re-run at close-out:

- `npm run lint` — exit 0. `npm run typecheck` — exit 0. `npm test` (builds first) — 641 passed,
  21 files, 0 failed, exit 0.
- `npm run test:unit -- --run src/test/measurement-page.test.tsx src/test/qualify-form.test.tsx`
  — exit 0. `npm run test:unit -- --run src/test/measurement-page.test.tsx src/test/product-shell-reuse.test.tsx`
  — exit 0.
- `grep -rn 'no engagement summary is attached' src/` — zero lines. Case-insensitive variant,
  which also catches the capitalised boundary-line form — zero lines. All eight occurrences in
  the plan's correction table are gone.
- The disclosure summary group renders identically regardless of stored context, storage
  availability or campaign presence — asserted by two contracts.
- The approved C-1 clause is recorded verbatim above.

Success criteria: **MEAS-05** — the summary attached in plan 04-02 is disclosed before submission
in fixed approved copy naming what it contains and what it does not, both in the always-visible
notice and in the labelled disclosure group. **MEAS-08** — the disclosure describes
browser-observable facts only and makes no claim about delivery, people or completed onboarding;
the Phase 3 rule against reflecting runtime measurement values into the page is asserted with a
seeded distinctive context.

## User Setup Required

None — no external service configuration is required by this plan.

## Next Phase Readiness

- **The phase's truthfulness gap is closed.** The 04-02 blocker — the notice claiming nothing was
  attached while something was — no longer exists in the codebase. 04-02's "Truthfulness note
  carried to plan 04-04" is fully discharged: both the collection-notice clause and
  `disclosure.summaryBoundary` are replaced.
- **UI-SPEC reconciliation is outstanding.** `04-UI-SPEC.md`'s C-1 row and the Surface B boundary
  description still carry the superseded proposed clause. The shipped bytes are authoritative and
  test-pinned; the document should be updated to match. Carried as coverage item D7.
- **Carried blocker (unchanged, still widened by C-2).** Privacy/legal ownership must approve the
  processor, data location, retention and Kenya Data Protection Act treatment before production
  collection is enabled (UI-SPEC checkpoint C-3) — now covering a campaign label travelling to
  FormSubmit alongside a named enquiry, which this plan's copy now discloses to the visitor.
- **Carried to UAT.** Coverage item D6 (320px and 200%-zoom reading of the new group and the
  replaced clause) and D7 (the UI-SPEC divergence).

---
*Phase: 04-report-and-enrich-the-haoo-funnel-truthfully*
*Completed: 2026-09-01*
