---
phase: 05-prove-the-deployed-journey
plan: 10
subsystem: testing
tags: [playwright, e2e, semantics, headings, landmarks, accessible-names, wcag, evidence]
status: complete

requires:
  - phase: 05-05
    provides: "The fixture layer: SURFACES, PRIMARY_ACTIONS, PRODUCTS_REGION_SELECTOR, recordEvidence and the vacuity guard"
  - phase: 05-04
    provides: "The F1 source fix (d8f4bea) this plan's truthful-destination rule was written to guard — measured here as present in source and ABSENT from the deployed bundle"
  - phase: 05-03
    provides: "The live Playwright project against www.haoo.online and live URLs for the ZERO-PAPER HUB surfaces"
provides:
  - "e2e/semantics.e2e.ts: 12 live tests covering SS-1 (heading order in three states), SS-2 (landmark and region inventories on S1 and S3), SS-3 (accessible names, label/description resolution, names-promise-destinations) and SS-4 (the brochure HTML equivalent under artifact failure, and the three-reference equality)"
  - "Seven evidence records: semantics-headings, semantics-landmarks, semantics-regions, semantics-products-region, semantics-accessible-names, semantics-destinations, semantics-brochure-equivalence"
  - "05-EVIDENCE-SEMANTICS.md: literal heading sequences per state, integer landmark and region inventories, the name-to-destination table, the found-against-expected equivalence counts, and the observations section"
  - "FINDING F1-LIVE (CLOSED 2026-09-12 by deployment, see 05-EVIDENCE-SEMANTICS.md § 5.1): at authoring time the deployed page served href=\"/\" for both parent-site links. The owner then authorised a push; origin/main moved f957fd9 -> c39cc5a and Deploy HAOO run 34687312104 concluded success. Re-measured at 10:13 UTC on bundle /assets/haoo-D1dl6F2P.js: both links resolve to https://www.zero-paperhub.com/. The DEPLOY_LAG entry and its machinery are deleted and rule D4 is unconditional"
  - "Three measured corrections to 05-UI-SPEC.md: the region list is ten not nine, the navigation landmarks are never two at once, and SS-4's \"10 capability titles\" is six capabilities plus four journey steps"
affects: [05-12, 05-14, 05-17, "the next HAOO deploy"]

actuals:
  # chars/4 over the realized diff (base 35af146). Authored: spec 61681 + evidence file 22488 = 84169 (21042).
  # Generated evidence JSON: 9938 + 9831 + 17811 + 22273 + 6233 + 4923 + 5718 = 76727 (19182).
  # Reported at its true value rather than trimmed toward the 29000 estimate. The overrun is the
  # spec itself: three UI-SPEC corrections each needed their measurement and their reasoning written
  # at the point of the assertion, which is most of the 61 KB.
  tokens: 40224
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Read role and accessible-name inventories from Playwright's own aria snapshot, so the names in a spec are the ENGINE's computation rather than a re-implementation of the accessible-name algorithm — and guard the parser's one stated limit with an assertion"
    - "Assert heading LEVELS over the DOM and heading EXPOSURE over the accessibility tree, because an <object> child fallback is in the DOM in every state while its exposure depends on whether the embed succeeded"
    - "Close the set of 'names that name a destination' with promise rules, and close the complement too — a name matching no rule must be registered as naming none, so a new destination-naming link cannot appear unnoticed"
    - "Register a source-versus-deployed divergence in a list that asserts the DEPLOYED value, so the entry fails the moment the deploy lands and cannot outlive the defect it accommodates"
    - "Split the DOM control traversal from the accessibility-tree traversal at a single width: name rules apply to every control in the document, the engine cross-check only to the controls the engine can see, and the unexposed remainder is itself a closed asserted list"

key-files:
  created:
    - e2e/semantics.e2e.ts
    - evidence/semantics-headings.json
    - evidence/semantics-landmarks.json
    - evidence/semantics-regions.json
    - evidence/semantics-products-region.json
    - evidence/semantics-accessible-names.json
    - evidence/semantics-destinations.json
    - evidence/semantics-brochure-equivalence.json
    - .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-SEMANTICS.md
  modified: []

key-decisions:
  - "Heading order is owned by this spec as a DOM walk, not by axe. heading-order is best-practice-tagged, AXE_TAGS excludes it (measured headingOrderRan: false), and re-adding it with withRules would overwrite runOnly and narrow the whole sweep to that one rule while still reporting a conformance pass. The signal that the corroboration has silently stopped — an axe result with no heading-order outcome in any of violations, passes or incomplete — is written into the file header."
  - "MEASURED CORRECTION: the labelled-region list is TEN, not the nine 05-UI-SPEC SS-2 lists. The audiences section is labelled by aria-labelledby=\"audiences-heading\" and is a region named \"Who HAOO supports\". A spec asserting nine would fail a correct page."
  - "MEASURED CORRECTION: SS-2's \"two navigation landmarks\" is never true at one moment. Measured 1 at 1280 px, 0 at 390 px closed, 1 at 390 px open. Asserted instead as two distinct names across three states, with no state exposing more than one."
  - "MEASURED CORRECTION: SS-4's \"10 capability titles, 10 of 10\" is six capabilities (already pinned at haoo-page.test.tsx:102) plus four journey steps. Ten is the size of the whole equivalent. Count equality is asserted per list AND against the total, so a dropped item fails either way."
  - "FINDING F1-LIVE: the deployed page diverged from the truthful-destination rule and this spec did NOT weaken the rule to accommodate it. The divergence was registered in a one-entry DEPLOY_LAG list asserting the deployed value, so a landed deploy would break it and the break would instruct its own deletion. That is exactly what happened on 2026-09-12: the owner authorised the push, Deploy HAOO run 34687312104 concluded success, the assertion broke reporting Received https://www.zero-paperhub.com/, and the entry plus every consumer was deleted rather than widened. Rule D4 now covers both links unconditionally and DEPLOY_LAG appears nowhere in the file."
  - "The capability and journey ledger is transcribed from src/test/haoo-content.test.ts rather than imported, because src/products/haoo.ts reads import.meta.env at module scope and throws outside Vite. The limit is stated in both the spec and the evidence file; the vitest suite remains the owner."

patterns-established:
  - "A contract row that disagrees with the shipped artifact is corrected in the spec with its measurement and its reason at the point of the assertion, following the P13 precedent in e2e/fixtures/primary-actions.ts — never silently satisfied and never silently skipped"
  - "An accommodation for a known-open defect must be self-terminating: assert the defective value so the assertion breaks when the defect is fixed"

requirements-completed: [QUAL-03]

coverage:
  - id: SS-1
    description: "The live HAOO page has exactly one top-level heading whose text is the product outcome, and the ordered list of heading levels in document order never steps forward by more than one — asserted in three distinct live states."
    requirement: QUAL-03
    verification:
      - kind: e2e
        ref: "npx playwright test --project=live e2e/semantics.e2e.ts (3 SS-1 tests: default, error-summary, artifact-aborted)"
        status: pass
    human_judgment: false
  - id: SS-1b
    description: "The conditional headings hold their level in the states that render them: the error-summary heading at h3 after an empty required submit, and the brochure fallback heading at h3 with the artifact route aborted. The two completed-submission headings are asserted ABSENT and named as plan 05-12's on the preview target."
    requirement: QUAL-03
    verification:
      - kind: e2e
        ref: "e2e/semantics.e2e.ts#the error-summary state holds its level, #the aborted-artifact state holds its level"
        status: pass
    human_judgment: false
  - id: SS-2
    description: "S1 exposes exactly one banner, one main and one contentinfo; two distinctly-named navigation landmarks across three states with no state exposing more than one; and a labelled-region list equal to a closed ten-entry expected list consistent with the five-name subset the jsdom suite pins."
    requirement: QUAL-03
    verification:
      - kind: e2e
        ref: "e2e/semantics.e2e.ts#one banner, one main, one contentinfo, and the closed region list; #the two navigation landmarks are distinct"
        status: pass
    human_judgment: false
  - id: SS-2b
    description: "On S3 the Products section is a region named Products via aria-labelledby, and both Products navigation entries resolve to that region's own id. The absent main landmark (F5) is recorded with its measured value of 0 and never asserted, per D-OQ-3."
    requirement: QUAL-03
    verification:
      - kind: e2e
        ref: "e2e/semantics.e2e.ts#the Products section is a named region its nav entry resolves to"
        status: pass
    human_judgment: false
  - id: SS-3
    description: "Every link, button and form control in the traversal has a non-empty accessible name (0 of 47 unnamed); the decorative-icon rule holds as a negative (0 of 21 icons exposed, 0 controls named by icon content alone); every form control is named by a resolving label; every description reference resolves (0 unresolved of 8 in the error state); the embed's label is the product name plus the brochure-preview suffix."
    requirement: QUAL-03
    verification:
      - kind: e2e
        ref: "e2e/semantics.e2e.ts#every link, button and control has a non-empty name; #every description reference resolves"
        status: pass
    human_judgment: false
  - id: SS-3b
    description: "Every link whose accessible name names a destination resolves to that destination, and repeated identical names share one destination. All SIX destination-naming names satisfy their rule unconditionally on the deployed page as of 2026-09-12 10:13 UTC; the two parent-site links were the F1-LIVE divergence until the deploy of c39cc5a, and their registered exception has been deleted."
    requirement: QUAL-03
    verification:
      - kind: e2e
        ref: "e2e/semantics.e2e.ts#every name that names a destination resolves to that destination"
        status: pass
    human_judgment: false
  - id: SS-4
    description: "The brochure's substantive content exists as real HTML: 6 of 6 capability titles with descriptions in the same list item, 4 of 4 journey steps in document order, 10 of 10 equivalent items in total — all re-asserted unchanged with the artifact route aborted, alongside the fallback subtree and both controls still present and enabled."
    requirement: QUAL-03
    verification:
      - kind: e2e
        ref: "e2e/semantics.e2e.ts#the capability and journey content is present, in order, at count equality; #the equivalent survives the artifact being unavailable"
        status: pass
    human_judgment: false
  - id: SS-4b
    description: "The head-level machine-discoverable pointer, the open action and the download action resolve to one and the same target — asserted against one another rather than each against a literal, with the expected path read from the closed primary-action list rather than retyped."
    requirement: QUAL-03
    verification:
      - kind: e2e
        ref: "e2e/semantics.e2e.ts#the three brochure references resolve to one and the same target"
        status: pass
    human_judgment: false

duration: 62 min
completed: 2026-09-12
---

# Phase 05 Plan 10: Semantic Structure Contract Summary

**Heading order, landmarks, names and the brochure's HTML equivalent are now asserted against the deployed HAOO page by a spec that owns the checks the conformance engine structurally cannot run — and the first thing it measured was that the deployed page still serves a link that lies about where it goes.**

- **Duration:** 62 min
- **Tasks:** 3 of 3
- **Files created:** 9
- **Tests:** 12 live Playwright tests, all passing

## Accomplishments

**Heading order became a real check rather than an assumed one.** `heading-order` is
`best-practice`-tagged; `AXE_TAGS` excludes `best-practice`; and the two builder orderings measured
in 05-03 prove the rule cannot be added back without collapsing the whole sweep to itself
(`.withTags(...).withRules(['heading-order'])` → 1 rule, 2 tags). So 05-07's baseline never
measured it. `e2e/semantics.e2e.ts` now walks `h1`..`h6` in document order in three live states and
asserts one top-level heading, the explicit shipped level structure, and that no forward step
exceeds +1 — naming the offending pair when one does. The reading that would mean the engine
corroboration has silently stopped is written into the file header, because that reading looks
exactly like "nothing wrong".

**Both landmark inventories are pinned to closed lists**, and pinning them turned up two rows where
the design contract and the shipped page disagree (below). The Products section on the ZERO-PAPER
HUB home page is asserted as a region named `Products` whose nav entries resolve to its own id; its
absent `main` landmark is recorded with its measured `0` and never asserted, per D-OQ-3.

**Names are descriptive, and the ones that promise a destination are checked against it.** Zero of
47 controls are unnamed; zero of 21 icons reach the accessibility tree; zero controls are named by
icon content alone; zero images lack an `alt`; zero of 8 description references fail to resolve.
Four closed promise rules cover phone, email, host and parent site, compared on **resolved**
destinations — and repeated identical names are asserted to share one destination rather than
asserted unique, because P4–P8 correctly render three times each.

**The brochure's substance outlives the brochure file.** Six of six capability cards and four of
four journey steps, compared as ordered `[title, description]` pairs, re-asserted unchanged with
`**/*.pdf` aborted, with the fallback heading and body rendering and both actions still present and
enabled. The three references to the artifact resolve to one target and are asserted against one
another, with the expected path read from the closed primary-action list rather than retyped.

## Escalation — FINDING F1-LIVE was escalated, and is now CLOSED by deployment

**As authored (deployed bundle `f957fd9`), both `Back to ZERO-PAPER HUB` links on
`https://www.haoo.online/` promised the parent site and resolved to the HAOO page the visitor was
already on.**

| Reading | Value |
|---|---|
| raw `href` served live | `/` |
| resolved destination | `https://www.haoo.online/` |
| promised destination | `https://www.zero-paperhub.com/` |
| instances | 2 (header, footer) |
| fix commit | `d8f4bea` — `fix(05-04): point both parent-site links at the parent site` |
| `git merge-base --is-ancestor d8f4bea f957fd9` | not an ancestor |
| local `main` ahead of `origin/main` | 32 commits |
| deployed bundle | `origin/main` at `f957fd9`, which predates the fix |

`05-04-SUMMARY.md` states that "any wave-4 spec asserting SS-3 will now measure the corrected
destination". That was true of the **source** and false of the **deployed page** — and the deployed
page is what this phase exists to prove.

**What was NOT done by this plan's executor, deliberately:** it did not push. Publishing local
commits to `origin/main` triggers a production Pages deploy, and that was the owner's call, not an
auto-fix.

**What was done instead:** the rule was asserted in full, and the divergence was registered in a
one-entry `DEPLOY_LAG` list asserting the **deployed** value — an accommodation that breaks the
moment the defect is fixed and whose break message instructs its own deletion.

### The closure, 2026-09-12

**The owner gave explicit authorisation to publish, and the orchestrator ran `git push origin
main` on that authorisation** — not this plan's executor, and not an automatic step.

| Reading | Value |
|---|---|
| `origin/main` before / after the push | `f957fd9` / `c39cc5a` |
| commits transferred | 37 |
| `git merge-base --is-ancestor d8f4bea origin/main` afterwards | ancestor |
| workflow run | `Deploy HAOO`, run `34687312104`, head SHA `c39cc5a2`, status `completed`, conclusion `success`, `10:00:38Z` → `10:01:45Z` |
| bundle served afterwards | `/assets/haoo-D1dl6F2P.js`, 207 685 bytes, SHA-256 `d607c149ca785c58c5f26183852367aa52badcb02ee8bbad93e0daf136f6b508` |
| `<a>` elements in that bundle whose text is `Back to ZERO-PAPER HUB` | 2, each with `href:"https://www.zero-paperhub.com/"` |
| resolved destination re-measured in the DOM at `10:13` UTC | `https://www.zero-paperhub.com/`, 2 instances, 1 distinct destination, agreeing across 3 of 3 independent measurements |

The self-terminating assertion did terminate itself: run against the post-deploy page **before any
edit was made**, it broke with `Expected: "https://www.haoo.online/"` /
`Received: "https://www.zero-paperhub.com/"` and the message `DELETE the DEPLOY_LAG entry so rule
D4 covers this link unconditionally`. The entry, the `if (lag === undefined)` branch, the
`registeredDeployLag` evidence field and the instance-count loop were all deleted rather than
widened; `DEPLOY_LAG` occurrences in `e2e/semantics.e2e.ts` went 4 → 0, leaving no empty list and
no dead scaffolding. Promise rule D4 now covers both links with no exception anywhere in the file,
and `npx playwright test --project=live e2e/semantics.e2e.ts` executed 12 tests with no assertion
break in 32.6 s, 0 retries consumed.

Closed by commit `fix(05-10): close F1-LIVE by deleting the DEPLOY_LAG entry the deploy terminated` (the follow-up to this plan; `git log --grep="close F1-LIVE"`).
Full readings, both rounds, in `05-EVIDENCE-SEMANTICS.md` § 5.1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] SS-4's "10 capability titles" contradicts the shipped product**

- **Found during:** Task 2
- **Issue:** `05-UI-SPEC.md` §SS-4 and this plan's `must_haves` both call for "all ten capability
  titles" and "count equality: 10 of 10". The shipped HAOO product carries **six** capabilities —
  already pinned at `src/test/haoo-page.test.tsx:102` (`toHaveLength(6)`) and enumerated in
  `src/test/haoo-content.test.ts` — and measured live as six `#capabilities h3`. A spec asserting
  ten capability cards would fail a correct page.
- **Fix:** Asserted count equality against each list individually (6 capabilities, 4 journey steps)
  **and** against the total of 10, which is what the contract's "ten" actually denotes — the size
  of the whole HTML equivalent, covered by SS-4 assertions 1 and 2 together. The correction is
  recorded at the constant, in the commit, and in §6.1 of the evidence file.
- **Files modified:** `e2e/semantics.e2e.ts`
- **Verification:** `capabilitiesFound: 6 / capabilitiesExpected: 6`,
  `journeyStepsFound: 4 / journeyStepsExpected: 4`, `equivalentItemsFound: 10`
- **Commit:** `262da8f`

**2. [Rule 1 — Bug] SS-2's region list is nine; the page exposes ten**

- **Found during:** Task 1
- **Issue:** `05-UI-SPEC.md` §SS-2's closed labelled-region list omits the audiences section, which
  is labelled by `aria-labelledby="audiences-heading"` and is therefore a region named
  `Who HAOO supports` exactly like the other nine. Asserting the contract's nine would fail a
  correct page.
- **Fix:** `EXPECTED_REGION_NAMES` carries ten entries, with the correction and its reason at the
  constant. The five-name subset `src/test/haoo-page.test.tsx:47` pins is asserted to be an ordered
  subsequence of the ten, so the jsdom suite and the live spec cannot drift apart.
- **Files modified:** `e2e/semantics.e2e.ts`
- **Verification:** `capturedRegionCount: 10`, `expectedRegionCount: 10`, lists equal as ordered
  arrays
- **Commit:** `c05e285`

**3. [Rule 1 — Bug] SS-2's "two navigation landmarks" is unsatisfiable at any one moment**

- **Found during:** Task 1
- **Issue:** The contract requires "two `navigation` landmarks, each with a distinct accessible
  name". Measured: **1** at 1280 px (`HAOO sections`), **0** at 390 px with the menu closed, **1**
  at 390 px with the menu open (`HAOO mobile sections`). The desktop nav is `display: none` below
  `md`; the mobile nav carries the `hidden` attribute until the toggle is pressed. The page cannot
  expose both.
- **Fix:** Asserted the honest contract — the union of exposed navigation names across the three
  states is exactly those two, they are distinct, and no single state exposes more than one.
- **Files modified:** `e2e/semantics.e2e.ts`
- **Verification:** `distinctNamesAcrossStates: ["HAOO sections", "HAOO mobile sections"]`,
  `narrowClosedNavigationCount: 0`
- **Commit:** `c05e285`

**4. [Rule 2 — Missing critical] The DOM traversal is a superset of the accessibility-tree traversal**

- **Found during:** Task 2
- **Issue:** The first draft cross-checked every captured name against the engine with
  `toHaveAccessibleName`. That failed on `Open HAOO navigation`: the toggle is `md:hidden`, so at
  1280 px it is in the DOM and not in the accessibility tree. Restricting the cross-check to
  exposed controls alone would have created a place for an unnamed control to hide.
- **Fix:** The name rules apply to every control in the document, exposed or not; the engine
  cross-check applies only to exposed controls; and the unexposed remainder is itself captured and
  asserted against a closed eight-entry list with a reason per entry (the mobile nav's five link
  copies, the toggle, the honeypot, and the collapsed measurement disclosure's clear control).
- **Files modified:** `e2e/semantics.e2e.ts`
- **Verification:** `controlsNotExposedAtThisWidth` equals the closed list; `unnamedControls: []`
  over all 47
- **Commit:** `262da8f`

**5. [Rule 4 — Escalated, NOT auto-fixed] The deployed page fails the truthful-destination rule**

- **Found during:** Task 2
- **Issue:** See **Escalation** above. Closing it requires pushing 32 commits and triggering a
  production deploy.
- **Action taken:** Escalated rather than fixed. The rule is asserted in full; the divergence was
  registered as `F1-LIVE` in a self-terminating `DEPLOY_LAG` entry that breaks on the next deploy.
- **Resolution:** CLOSED 2026-09-12. The owner authorised the push, `Deploy HAOO` run
  `34687312104` concluded `success`, the live page was re-measured at `https://www.zero-paperhub.com/`
  for both links, and the `DEPLOY_LAG` entry with all of its machinery was deleted so rule D4 is
  unconditional. See the **Escalation** section above and `05-EVIDENCE-SEMANTICS.md` § 5.1.
- **Commit:** `262da8f`, `2f31cda`; closed by `fix(05-10): close F1-LIVE by deleting the DEPLOY_LAG entry the deploy terminated`

**Total deviations:** 4 auto-fixed (3 × Rule 1, 1 × Rule 2), 1 escalated (Rule 4).
**Impact:** Three of the four auto-fixes are corrections to the UI design contract rather than to
the page — the page is right and the contract's rows were wrong, in the same way
`e2e/fixtures/primary-actions.ts` P13 already records a measured correction to its own contract
row. Each is recorded at the point of the assertion, in its commit message, and in the evidence
file, so the contract can be reconciled later without re-deriving the measurements. The escalated
item is the most valuable finding of the plan and is unresolved by design.

## Authentication Gates

None.

## Known Stubs

None. Every assertion in `e2e/semantics.e2e.ts` runs against the live page; no test is skipped and
no `<verify>` was left unrun.

## Threat Flags

None. The threat register's four `mitigate` dispositions are all implemented:

| Threat | Mitigation as shipped |
|---|---|
| T-05-43 spoofing, destination-naming links | Four closed promise rules over resolved destinations, plus the closed complement list; caught F1-LIVE on the deployed page and, after the deploy, covers both parent-site links unconditionally |
| T-05-44 repudiation, heading-order coverage | The spec owns the DOM walk, asserts per state, and documents the reading that means the engine corroboration stopped |
| T-05-45 DoS, brochure content availability | The equivalent is re-asserted with `**/*.pdf` aborted, alongside the fallback subtree and both surviving controls |
| T-05-46 tampering, three references drifting | The three resolved destinations are asserted equal to one another and to the closed primary-action list's path |

## Verification

| Gate | Result |
|---|---|
| `npx playwright test --project=live e2e/semantics.e2e.ts` | exit 0 — 12 passed |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test` | exit 0 — 684 tests across 10 files (baseline held) |
| `npm run verify:disjoint` | exit 0 — 26 shared / 26 allowlist / 0 violations (baseline held) |
| Task 1 acceptance grep | OK |
| Task 2 acceptance grep | OK |
| Task 3 acceptance grep | OK |

## Commits

1. **Task 1: heading order per state, and both landmark inventories** — `c05e285` (feat)
2. **Task 2: descriptive names, truthful destinations, the brochure equivalent** — `262da8f` (feat)
3. **Task 3: the semantic evidence with its sequences, inventories and counts** — `2f31cda` (docs)

## Next Phase Readiness

Ready for `05-11`. Handoffs:

- **To the owner — `F1-LIVE` is CLOSED, no action outstanding.** The owner authorised the push on
  2026-09-12; `origin/main` moved `f957fd9` → `c39cc5a`, `Deploy HAOO` run `34687312104` concluded
  `success`, and the live page's two parent-site links were re-measured resolving to
  `https://www.zero-paperhub.com/`. The `DEPLOY_LAG` entry is deleted and rule D4 is unconditional.
- **To 05-12:** the two completed-submission headings (`Your details are on their way`,
  `We couldn't send your details`) are asserted ABSENT from the live default state here and are
  owned there on the preview target, at level `h3`.
- **To 05-14:** unchanged. This spec does not touch S4, so 05-07's `R-1` (`bypass` serious on the
  retired-path page) is neither advanced nor prejudiced here.
- **To 05-17 / whoever reconciles the UI-SPEC:** three rows of `05-UI-SPEC.md` disagree with the
  shipped page and are corrected in the spec with their measurements — the SS-2 region list (nine →
  ten), the SS-2 navigation-landmark requirement (two at once → two across states), and SS-4's
  capability count (ten → six plus four journey steps).

## Self-Check: PASSED

Created files verified on disk:

- `e2e/semantics.e2e.ts` — FOUND
- `evidence/semantics-headings.json` — FOUND
- `evidence/semantics-landmarks.json` — FOUND
- `evidence/semantics-regions.json` — FOUND
- `evidence/semantics-products-region.json` — FOUND
- `evidence/semantics-accessible-names.json` — FOUND
- `evidence/semantics-destinations.json` — FOUND
- `evidence/semantics-brochure-equivalence.json` — FOUND
- `.planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-SEMANTICS.md` — FOUND

Commits verified in `git log`: `c05e285`, `262da8f`, `2f31cda` — all FOUND.

*Phase: 05-prove-the-deployed-journey*
