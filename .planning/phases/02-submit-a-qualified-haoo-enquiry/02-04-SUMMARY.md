---
phase: 02-submit-a-qualified-haoo-enquiry
plan: 04
subsystem: ui
tags: [react, forms, accessibility, validation, wcag, aria-live, vitest, testing-library]

# Dependency graph
requires:
  - phase: 02-01
    provides: Pure validator, controlled values, error-summary markup and focus target
  - phase: 02-02
    provides: The ten configured fields, locked message strings, and the inert phone formatPattern
provides:
  - Correction loop — after the first failed submit, the edited field alone is re-validated and its inline and summary messages update in place
  - Invalid-attempt counter driving the summary focus move, so a repeat invalid submit re-announces and an in-progress correction never has focus stolen
  - Generic requiredWhen descriptor evaluated by isFieldRequired, flipping native required, aria-required, the label suffix, the validator and the live announcement together
  - Configured format patterns applied to any free-text control, activating the previously inert phone formatPattern without normalising visitor input
affects: [phase-03 engagement summary, any second product reusing QualifyForm]

actuals:
  tokens: 7458
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Conditional requiredness as product data — a requiredWhen descriptor the component evaluates without knowing any field name or option value"
    - "Focus moves keyed on an integer attempt counter rather than on an errors object identity"
    - "Per-field correction reconciliation against the same pure validator used at submit"

key-files:
  created: []
  modified:
    - src/components/QualifyForm.tsx
    - src/products/haoo.ts
    - src/test/qualify-form.test.tsx

key-decisions:
  - "Focus is keyed on an invalid-attempt counter, not on the errors object: an errors-keyed effect would both fail to re-announce a bail-out render and steal focus from the control being corrected."
  - "The counter increments only on invalid submits, so the summary is guaranteed rendered when the effect runs and no ref or extra guard is needed."
  - "Correction re-validates the edited field only; a dependent field is cleared (never newly flagged) when the edit stops its requiredWhen from matching, so no untouched field is accused before an explicit submit."
  - "The requiredness announcement shares the single mounted role=status region, with submission states taking precedence once a submission starts — no second live region exists."
  - "formatPattern now applies to every free-text control rather than to email alone, so a product expresses a format rule in data instead of the component learning what a field means."

patterns-established:
  - "Pattern: descriptor-driven conditional requiredness — QualifyForm.tsx contains no product field name or option-value literal, proven by a source scan test"
  - "Pattern: attempt-counter announcement loop for error summaries"

requirements-completed: [LEAD-01, LEAD-05]

coverage:
  - id: D1
    description: "No validation message appears on first entry or blur before the first submit attempt"
    requirement: LEAD-05
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#keeps validation quiet until the first submit attempt"
        status: pass
    human_judgment: false
  - id: D2
    description: "An invalid submit shows byte-identical inline and summary messages in DOM field order, focuses the summary container, issues no request, and retains all values"
    requirement: LEAD-05
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#links every summary problem to its control in configured DOM order"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#collects a name and a usable contact method"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#rejects manipulated and over-bound values in the same validation pass"
        status: pass
    human_judgment: false
  - id: D3
    description: "After the first failed submit, editing a field re-validates that field and removes its message as soon as it becomes valid, without disturbing other fields or focus"
    requirement: LEAD-05
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#clears one field validation message as it is corrected and retains entered values"
        status: pass
    human_judgment: false
  - id: D4
    description: "A second invalid submit re-focuses and re-announces the summary even when the error set is unchanged"
    requirement: LEAD-05
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#re-announces the problem summary on a repeat invalid submit"
        status: pass
    human_judgment: false
  - id: D5
    description: "Choosing WhatsApp or Phone call makes phone required in native, ARIA, label, validation and live-announcement behaviour"
    requirement: LEAD-01
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#makes phone required in every surface for the channels that need it"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#reports the locked message when a required phone is empty"
        status: pass
    human_judgment: false
  - id: D6
    description: "Choosing Email reverses the rule, clears the phone error, keeps the typed value, and permits a valid submit without phone"
    requirement: LEAD-01
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#reverses requiredness and clears the phone error when the channel changes back"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#keeps a typed phone number through every requiredness change"
        status: pass
    human_judgment: false
  - id: D7
    description: "The conditional rule is product data — a synthetic product with different controller, dependent field, trigger value and message behaves identically, and the component holds no HAOO literals"
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#drives a synthetic product conditional requiredness from configuration alone"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#keeps conditional-requiredness literals out of the generic component"
        status: pass
    human_judgment: false
  - id: D8
    description: "Permissive Kenyan phone formats are accepted without E.164 normalisation; disallowed characters get the locked format message"
    requirement: LEAD-01
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#accepts permissive phone formats and rejects disallowed characters"
        status: pass
    human_judgment: false
  - id: D9
    description: "Every validation and focus state remains keyboard-operable at 320px and 200% zoom with no truncation and no inert-submit pattern"
    requirement: LEAD-05
    verification: []
    human_judgment: true
    rationale: "jsdom has no layout engine, so wrapping, horizontal overflow and zoom reflow cannot be asserted here. The submit control is never disabled for incompleteness and every message is a plain wrapping paragraph, but the visual result needs a human at 320px and 200% zoom."

duration: 14 min
completed: 2026-08-30
status: complete
---

# Phase 02 Plan 04: Accessible Correction Loop and Conditional Reachability Summary

**Attempt-counter-driven error summary with per-field correction re-validation, plus phone requiredness derived from a generic `requiredWhen` descriptor that flips native, ARIA, label, validator and live-region surfaces together**

## Performance

- **Duration:** 14 min
- **Started:** 2026-08-30T08:30:00Z
- **Completed:** 2026-08-30T08:44:00Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 3

## Accomplishments

- The error summary now re-announces on every invalid attempt. Focus is keyed on an incrementing invalid-attempt counter rather than on the `errors` object, which fixes two failures at once: a repeat submit with an identical error set still moves focus, and correcting a field no longer yanks focus out of the control being edited.
- After the first failed submit, editing a field re-validates that field alone against the same pure validator used at submit. Its inline message and its summary entry appear, change or disappear in place, in configured DOM order, while every other message and every entered value stays untouched.
- Phone requiredness is now product data. `HAOO_PRODUCT.qualify` carries a `requiredWhen` descriptor naming its controlling field, its trigger values and its announcement sentence; `isFieldRequired` evaluates it generically so the native attribute, `aria-required`, the derived `(optional)` label suffix, the validator and the announcement cannot drift apart.
- The requiredness change is announced through the one already-mounted `role="status"` region — with `{value}` replaced by the chosen channel — and cleared on reversal. No second live region exists and no role is ever swapped onto a mounted node.
- `formatPattern` is no longer inert. It applies to any free-text control, so the configured permissive Kenyan phone format is enforced without rewriting a single character the visitor typed.

## Task Commits

Each task was committed atomically as a TDD pair:

1. **Task 1: Extend tracer validation with correction re-validation and repeat announcement** — `f646aca` (test, RED) → `81883b3` (feat, GREEN)
2. **Task 2: Make phone conditionally required and announce the rule change** — `65db5c4` (test, RED) → `ec58bf7` (feat, GREEN)

No refactor commit was needed: both implementations landed at their final shape with the suite green.

## Files Created/Modified

- `src/components/QualifyForm.tsx` — added the invalid-attempt counter and its focus effect, per-field correction reconciliation, the generic `requiredWhen` evaluation in `isFieldRequired`, the `requirednessAnnouncement` helper routed through the existing status region, and generalised `formatPattern` to every free-text control.
- `src/products/haoo.ts` — configured the phone field's `requiredWhen` descriptor (controller `preferredChannel`, triggers `WhatsApp` / `Phone call`, `{value}`-interpolated announcement) and refreshed the two comments that pointed forward to this plan.
- `src/test/qualify-form.test.tsx` — added 13 tests across two describe blocks covering validation timing, ordered byte-identical messages, repeat announcement, correction, tamper rejection, conditional requiredness in every surface, reversal, value retention, permissive phone formats, a synthetic product with a different descriptor, and a source scan proving the component holds no HAOO conditional literals.

## Decisions Made

- **Focus keyed on the attempt counter, incremented only by invalid submits.** This guarantees the summary is rendered when the effect fires, so no ref-based guard or `errors`-length dependency is needed, and it keeps `react-hooks/exhaustive-deps` satisfied with an exact dependency list.
- **Correction adds or removes a message for the edited field only.** A field the visitor has not touched is never newly accused between submits; the one exception is subtractive — a dependent field whose `requiredWhen` stopped matching drops its now-unreachable message while keeping any message it still earns on its own.
- **The announcement helper is module-private.** Exporting it would have added a sixth `react-refresh/only-export-components` warning for no test benefit; it is exercised through the rendered status region instead.
- **`formatPattern` generalised rather than special-cased for `tel`.** The component still recognises no field meaning: an email control with no configured pattern keeps the shared fallback shape check, and every other control validates only what its product configured.

## Deviations from Plan

None - plan executed exactly as written.

Both tasks landed their configured behaviour, message strings and file boundaries as specified. The plan's Task 1 behaviour list included the manipulated-select and over-length cases already proven by plan 01's tracer tests; those were preserved unchanged and additionally re-proven inside the new correction loop (a single pass that reports both, then clears both as they are fixed).

## Issues Encountered

- `npm run test:unit` alone leaves `src/test/build-output.test.ts` failing its build-freshness guard, because `dist/` predates the edited sources. This is the designed behaviour of that guard, not a regression: the canonical `npm test` (`npm run build && vitest run`) passes 145/145. Verified at the end of the plan.
- One authored test asserted `.not.toContain('-error')` against a `getAttribute` that legitimately returns `null` when a control has no description. Fixed in the same RED commit by defaulting to an empty string before the assertion.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The full ten-field form is now an accessible correction loop: nothing complains before the first submit, every problem is explained twice byte-identically, focus lands on the summary on every attempt, and no entered value is ever discarded.
- LEAD-01's "usable contact method" is now guaranteed rather than assumed — the chosen channel is always reachable, and the rule is visible to sighted, keyboard and assistive-technology users alike.
- `QualifyForm` remains fully product-generic, so plans 05 and 06 can extend it without unpicking HAOO-specific behaviour.
- Outstanding for human verification: the 320px and 200% zoom reflow of the summary, inline messages and the interpolated announcement sentence (coverage entry D9). jsdom cannot assert layout.

---
*Phase: 02-submit-a-qualified-haoo-enquiry*
*Completed: 2026-08-30*

## Self-Check: PASSED

All modified files exist on disk and all four task commits are present in git history. `npm test` (build + full suite) passes 145/145; `npm run typecheck` is clean; `npm run lint` reports 0 errors and the 4 pre-existing fast-refresh warnings.
