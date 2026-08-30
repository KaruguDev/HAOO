---
phase: 02-submit-a-qualified-haoo-enquiry
plan: 02
subsystem: ui
tags: [react, typescript, forms, product-data, accessibility, wcag, vitest, kenya-counties]

# Dependency graph
requires:
  - phase: 02-submit-a-qualified-haoo-enquiry
    provides: "02-01 — product-generic QualifyForm, ProductQualifyForm/QualifyField/QualifyOption/QualifyFieldGroup data contract, buildSubmissionBody and validateQualifyValues seams"
  - phase: 02-submit-a-qualified-haoo-enquiry
    provides: "02-07 — qualify-data.test.ts endpoint contract file and the QualifyForm guard registration this plan's field growth had to stay inside"
provides:
  - "Ten-field HAOO qualification set in the locked DOM order, shipped entirely as product data"
  - "Five closed option lists as module constants: `KENYAN_COUNTY_OPTIONS` (48), `ROLE_OPTIONS`, `PORTFOLIO_BAND_OPTIONS`, `TIMEFRAME_OPTIONS`, `CONTACT_CHANNEL_OPTIONS`"
  - "`toOptions` derivation making `value` identical to `label` by construction on every shipped option"
  - "Three product-configured fieldset groups: `About you`, `About your portfolio`, `Getting started`"
  - "`qualify-data.test.ts` literal-expectation contracts `county`, `option lists`, `fields`, `groups` with codepoint assertions on five punctuated county names"
  - "`qualify-form.test.tsx` render contract `renders every qualification option` covering all 65 shipped options and all five select prompts"
  - "Full ten-label LEAD-04 payload contract plus an untouched-optional-omission contract"
affects: [02-03 nav and entry points, 02-04 conditional requiredness and phone format, 02-05 confirmation and failure panels, 02-06 disclosure copy, 03 engagement measurement]

actuals:
  tokens: 16685
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Closed option lists as module constants derived through a single `toOptions` helper, so `value === label` cannot drift and no lookup table exists to fall out of step"
    - "Literal-expectation data contracts: the expectation array is written in the test, never re-read from the source constant, so a silent source edit fails the build"
    - "Codepoint assertions with `\\u` escapes for characters an autoformatter would normalise (U+2013 en dash, U+2019 apostrophe, U+002D hyphen)"
    - "Accessible names derived from `field.label` plus the component-appended `(optional)` suffix, while the labels themselves stay pinned literally in the data contract"
    - "Contract strength proven by deliberate mutation rather than asserted"

key-files:
  created: []
  modified:
    - src/products/haoo.ts
    - src/test/qualify-data.test.ts
    - src/test/qualify-form.test.tsx

key-decisions:
  - "County, band and timeframe punctuation shipped exactly as planned after human confirmation: en dash U+2013 in `Taita–Taveta` and the four banded ranges, plain hyphen U+002D in `Tharaka-Nithi` / `Trans-Nzoia` / `Elgeyo-Marakwet`, typographic apostrophe U+2019 in `Murang’a`"
  - "Option `value` is derived from `label` by a shared `toOptions` helper rather than written twice, removing the drift the data contract would otherwise have to police"
  - "The four contested county names are pinned with `\\u` escape sequences in the test, not visible characters, so an editor that normalises both source and test cannot hide the change"
  - "`phone` ships `formatPattern` and `formatMessage` now but no `requiredWhen`; plan 04 owns both the descriptor and the validator that reads the pattern"
  - "`organization` and `message` carry an unreachable `requiredMessage` because the shared `QualifyField` shape requires one and neither field can ever be required; their reachable message is `lengthMessage`"

patterns-established:
  - "Mutation-verified contracts: every drift claim in the acceptance criteria was proven by temporarily breaking the source and observing the named test fail"
  - "Optional-field payload omission: an unanswered optional question is absent from the delivered email entirely, never a blank row"

requirements-completed: [LEAD-02]

coverage:
  - id: D1
    description: "A visitor can state role, organization, portfolio-size band, location and onboarding timeframe through clearly labelled controlled fields, and choose a preferred contact channel"
    requirement: "LEAD-02"
    verification:
      - kind: unit
        ref: "src/test/qualify-data.test.ts#fields"
        status: pass
      - kind: integration
        ref: "src/test/qualify-form.test.tsx#renders every qualification option"
        status: pass
    human_judgment: false
  - id: D2
    description: "Five closed option lists ship in product data and are pinned by literal-expectation contracts, including the 47 First Schedule counties in code order 1-47 plus `Outside Kenya`"
    requirement: "LEAD-02"
    verification:
      - kind: unit
        ref: "src/test/qualify-data.test.ts#county"
        status: pass
      - kind: unit
        ref: "src/test/qualify-data.test.ts#option lists"
        status: pass
    human_judgment: false
  - id: D3
    description: "The form renders exactly three native fieldset groups — About you, About your portfolio, Getting started — in configured DOM order with every control inside its configured group"
    verification:
      - kind: unit
        ref: "src/test/qualify-data.test.ts#groups"
        status: pass
      - kind: integration
        ref: "src/test/qualify-form.test.tsx#renders configured groups and legends in configured DOM order"
        status: pass
    human_judgment: false
  - id: D4
    description: "A complete submission carries all ten readable email labels, and an untouched optional field is absent from the payload rather than present as an empty string"
    requirement: "LEAD-02"
    verification:
      - kind: integration
        ref: "src/test/qualify-form.test.tsx#posts a readable, correctly-addressed payload"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#keys the payload byte-for-byte on the configured email labels"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every select carries a leading non-selectable prompt with an empty value, optional fields carry an `(optional)` label suffix, no field carries an asterisk, and WCAG 1.3.5 autocomplete tokens are set per field"
    verification:
      - kind: integration
        ref: "src/test/qualify-form.test.tsx#renders every qualification option"
        status: pass
      - kind: integration
        ref: "src/test/qualify-form.test.tsx#derives the optional label suffix from computed requiredness"
        status: pass
    human_judgment: false
  - id: D6
    description: "The five closed option lists are complete enough for real HAOO follow-up routing — no prospect segment falls outside the five roles, `200+ units` is an adequate top band, and `Outside Kenya` is a sufficient single non-Kenyan bucket"
    requirement: "LEAD-02"
    verification: []
    human_judgment: true
    rationale: "The plan's flagged assumption, unresolved by the edge probe. The task-1 checkpoint confirmed the character forms and the two list shapes, but 'adequate for routing' can only be judged against real HAOO enquiry traffic. The failure mode is silent — a prospect picks `Other` and the routing information is lost — so it cannot be caught by a test."
  - id: D7
    description: "The optional free-text `message` value is email-only and reaches no measurement or engagement-summary payload, in this phase or any later one"
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#omits empty optional values while always carrying the provider options"
        status: pass
    human_judgment: true
    rationale: "The plan records this as a `prohibitions` entry with `status: unverified, verification: judgment`. `buildSubmissionBody` is the single consumer of field values today and writes only into the provider payload, but the prohibition binds Phase 3, which does not exist yet — no test in this repository can assert a constraint on unwritten code."

# Metrics
duration: ~15 min
completed: 2026-08-30
status: complete
---

# Phase 02 Plan 02: Full Qualification Field Set Summary

**Widened the proven three-field tracer to the full ten-field HAOO enquiry — five closed option lists including the 48-entry Kenyan county select — entirely through product data, with zero changes to the QualifyForm component and codepoint-level contracts on the punctuation that reaches a real inbox.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-30T08:02Z (approximate — the plan-start timestamp was not captured before the first tool call in this continuation)
- **Completed:** 2026-08-30T08:17Z
- **Tasks:** 3 (1 blocking-human checkpoint resolved by the user, 2 executed)
- **Files modified:** 3

## Accomplishments

- **The component needed no code change.** `HAOO_PRODUCT.qualify.fields` grew from three entries to ten and `QualifyForm.tsx` was not touched — the plan-01 claim that the form is product-generic was tested by the only thing that can test it, adding seven fields and five option lists as pure data. The `product-shell-reuse` guard still passes, so no HAOO literal leaked into a generic source while the field set grew.
- **Five closed option lists ship as module constants**, each built by one `toOptions` helper so `value` equals `label` by construction. `KENYAN_COUNTY_OPTIONS` carries the 47 First Schedule counties in official code order 1-47 followed by a single `Outside Kenya` bucket.
- **The punctuation that reaches a real inbox is pinned by codepoint.** The five punctuated county names, the four banded portfolio ranges and `In 1–3 months` are asserted against `\u` escape sequences, not visible characters, so an editor or copy-paste round-trip that normalises source *and* test together still fails the build. The transcriptions seen in the wild — `Taita-Taveta`, `Tharaka Nithi`, `Elgeyo/Marakwet`, straight-apostrophe `Murang'a` — are asserted absent.
- **The delivered email carries all ten readable labels (LEAD-04)** in the locked order, and an unanswered optional question is absent from the payload entirely rather than arriving as a blank row.
- **Every contract was proven by mutation, not asserted.** Six deliberate breakages were introduced and reverted; each failed the named test it was supposed to fail (see Verification Evidence).

## Task Commits

1. **Task 1: Confirm the exact spelling of the closed option lists** — no commit (`checkpoint:human-verify`, `gate="blocking-human"`). Resolved by the user with **approved as planned**, confirming: `Taita–Taveta` U+2013; `Tharaka-Nithi` U+002D; `Elgeyo-Marakwet` U+002D (not the solidus form); `Murang’a` U+2019 (not U+0027); en dash in `1–5 units`, `6–20 units`, `21–50 units`, `51–200 units` and `In 1–3 months`, with no dash in `200+ units`, `Ready now`, `In 3+ months`, `Just exploring`; the five role options exactly as planned; and location as the closed 47-county select plus one `Outside Kenya` bucket.
2. **Task 2: Ship the ten-field qualification set and five closed option lists as product data** — `51d5ef8` (feat)
3. **Task 3: Pin the shipped option lists and the ten readable email labels with data and render contracts** — `d783546` (test)

**Plan metadata:** see the `docs(02-02)` commit that carries this file.

## Files Created/Modified

- `src/products/haoo.ts` — added `toOptions` plus the five exported option constants; widened `qualify.fields` from three to ten entries in the locked DOM order (`preferredChannel` deliberately ahead of `phone`); replaced the two-group tracer arrangement with the three locked legends.
- `src/test/qualify-data.test.ts` — added `county`, `option lists`, `fields` and `groups`, each asserting against a literal expectation written inside the test rather than re-read from the source constant.
- `src/test/qualify-form.test.tsx` — added `renders every qualification option`; extended the payload, group, optional-suffix, error-summary, value-retention and pure-validator contracts from three fields to ten.

## Decisions Made

- **`value` is derived from `label`, not written twice.** A shared `toOptions` helper removes the entire class of drift where an option's submitted value silently diverges from the label the visitor read. The data contract still asserts `value === label` on every entry, so the helper cannot be quietly replaced by hand-written pairs that reintroduce the gap.
- **The contested names are pinned with `\u` escapes rather than visible characters.** A literal expectation array written with visible en dashes defends against a source-only edit, but not against a tool that normalises the whole repository — both files would drift together and the test would still pass. Escape sequences cannot be normalised.
- **`phone` ships `formatPattern` and `formatMessage` but no `requiredWhen`.** The plan reserves the conditional-requiredness descriptor and the validator that reads the pattern for plan 04. The pattern is asserted directly in `qualify-data.test.ts#fields` (it accepts `+254 702 188 044`, `0702188044`, `(020) 123-4567` and rejects letters) so the configuration is proven correct before the code that consumes it exists.
- **`organization` and `message` carry an unreachable `requiredMessage`.** The shared `QualifyField` shape makes the property mandatory and neither field can ever be required, so the string is dead data by construction. Making the property optional would have meant editing `types.ts`, which task 2's file list excludes and which the plan explicitly forbids ("this task adds no type"). Both entries are commented in place.

## Deviations from Plan

**1. [Rule 3 - Blocking] TypeScript inference failure on a spread object literal in the extended payload test**

- **Found during:** Task 3 (extending `keys the payload byte-for-byte on the configured email labels`)
- **Issue:** `const values = { ...emptyValues(), ...COMPLETE_ENQUIRY, role: 'Agency' }` narrowed to `{ role: string }` under `noImplicitAny`, so `values[field.name]` failed with TS7053 and `npm run typecheck` exited non-zero.
- **Fix:** Annotated the binding as `Record<string, string>`.
- **Files modified:** `src/test/qualify-form.test.tsx`
- **Verification:** `npm run typecheck` exits 0.
- **Committed in:** `d783546` (Task 3 commit)

**2. [Rule 3 - Blocking] Straight-apostrophe literal terminated its own string**

- **Found during:** Task 3 (writing the rejected-transcription assertions in `county`)
- **Issue:** The assertion rejecting the U+0027 form of `Murang'a` was written inside single quotes, so esbuild failed to parse `qualify-data.test.ts` and the file collected zero tests.
- **Fix:** Rewrote the literal as the escape `'Murang'a'`, which is also the more legible form for an assertion whose entire subject is a codepoint.
- **Files modified:** `src/test/qualify-data.test.ts`
- **Verification:** `npm run test:unit -- --run src/test/qualify-data.test.ts` exits 0 with 41 tests.
- **Committed in:** `d783546` (Task 3 commit)

**3. [Documented intermediate state, not a defect] `qualify-form.test.tsx` was red between the two task commits**

- **Found during:** Task 2
- **Issue:** The plan scopes task 2's `<verify>` to `qualify-data.test.ts`, `typecheck` and `lint` precisely because the plan-01 tracer render and pure contracts assume three fields. Committing task 2 atomically therefore left 12 tests in `qualify-form.test.tsx` failing at `51d5ef8`; task 3 is the task that rewrites them.
- **Fix:** None required — this is the plan's own task decomposition. The condition is called out in the body of `51d5ef8` so a future `git bisect` landing on that commit reads why the suite is red there.
- **Verification:** `d783546` restores a green suite at 125 passing tests.

---

**Total deviations:** 2 auto-fixed (2 blocking), 1 documented intermediate state.
**Impact on plan:** Both auto-fixes were mechanical unblocks in test code introduced by this plan's own edits. No scope creep; no source behavior changed; the shipped field data is exactly what the plan specified and the user approved.

## Verification Evidence

Plan-level `<verification>` block, all re-run at close-out:

| Check | Result |
|---|---|
| `npm test` | exit 0 — **125 passed**, strictly greater than the plan-01 baseline of 120 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 (4 pre-existing `react-refresh/only-export-components` warnings from plan 01, out of scope) |
| `npm run test:unit -- --run src/test/qualify-data.test.ts -t "county"` | exit 0, 1 passed |
| `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "renders every qualification option"` | exit 0, 1 passed |
| `npm run test:unit -- --run src/test/product-shell-reuse.test.tsx` | exit 0 — no HAOO literal leaked into a product-generic source |

**Mutation verification.** Each acceptance criterion that claims a contract "fails on drift" was proven by temporarily breaking the source and observing the named test fail. All six mutations were reverted and the working tree confirmed clean against `HEAD` afterwards.

| Mutation | Named contract that failed |
|---|---|
| `Taita–Taveta` en dash → plain hyphen | `qualify-data.test.ts#county` |
| `Murang’a` → straight-apostrophe `Murang'a` | `qualify-data.test.ts#county` |
| Removed `Nyamira` from the county constant | `qualify-form.test.tsx#renders every qualification option` |
| Component truncates rendered options to 10 | `renders every qualification option` — "county: expected 49 options, got 11" |
| Prompt option given `value="none"` | `renders every qualification option` — "preferredChannel: expected 'none' to be ''" |
| `buildSubmissionBody` emits untouched optionals as `''` | `posts a readable, correctly-addressed payload` — "expected not to have property 'Phone number'" |

## Known Stubs

Two pieces of shipped data are inert at this commit. Neither prevents this plan's goal (LEAD-02 information capture) from being achieved, and both are explicitly reserved by the plan text.

| Item | File | Why intentional | Resolved by |
|---|---|---|---|
| `phone.formatPattern` / `phone.formatMessage` are configured but not read — `validateQualifyValues` applies `formatPattern` only when `control === 'email'` | `src/products/haoo.ts` (phone entry) | Task 2's file list is `src/products/haoo.ts` alone; the plan says "Do not add `requiredWhen` here — that is plan 04", and plan 04 task 2 says "Apply the configured permissive phone format". The pattern is nonetheless asserted correct today in `qualify-data.test.ts#fields`. | **02-04** |
| `organization.requiredMessage` and `message.requiredMessage` are unreachable — both fields are permanently optional, so their reachable message is `lengthMessage` | `src/products/haoo.ts` | `QualifyField.requiredMessage` is non-optional on the shared type, and task 2 is forbidden from editing `src/products/types.ts`. | Permanent by design — or removed if a later plan makes `requiredMessage` optional on the type |

## Threat Flags

None. This plan adds no network endpoint, no auth path, no file access and no schema at a trust boundary. The two free-text fields it introduces (`organization`, `message`) were already registered as T-02-08 and T-02-09 in the plan's threat model and ship with the planned mitigation: native `maxLength` bounds of 120 and 1000 declared in product data and re-checked in `validateQualifyValues` (proven by `counts length in the same UTF-16 code units the native maxLength attribute uses`). T-02-10's design-level reduction is realised — five of the ten fields are closed lists, so exact portfolio counts and precise addresses cannot be entered at all. T-02-11's mitigation is realised by the literal-array contracts plus the codepoint assertions. T-02-SC is unchanged: this plan installed no package and added no import.

## Issues Encountered

None beyond the two blocking type/parse errors documented as deviations, both in test code written during this plan and both fixed within the same task.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Ready for 02-03** (nav and entry points), **02-04** (conditional requiredness — inherits `phone.formatPattern` and adds `requiredWhen`), **02-05** (confirmation and failure panels) and **02-06** (disclosure copy). All four consume the ten-field set landed here.
- **Carried forward for human judgment, not resolved:** the plan's flagged assumption that the five closed lists are complete enough for real HAOO follow-up routing (coverage D6). The character forms and the two list shapes were confirmed at task 1; "adequate for routing" cannot be. If a prospect segment is missing, the failure is silent — the visitor picks `Other` and the routing signal is lost.
- **Binding on Phase 3:** the `message` value is email-only by construction (D-20, D-26, threat T-02-09). The Phase 3 measurement planner must not read it. No test in this repository can enforce that on code that does not yet exist (coverage D7).

---
*Phase: 02-submit-a-qualified-haoo-enquiry*
*Completed: 2026-08-30*

## Self-Check: PASSED

- All three modified source files exist on disk.
- All three commits exist in `git log`: `51d5ef8`, `d783546`, `5f42de7`.
- All five option constants are exported from `src/products/haoo.ts`.
- Test names `county`, `fields` and `renders every qualification option` are present in their declared files.
