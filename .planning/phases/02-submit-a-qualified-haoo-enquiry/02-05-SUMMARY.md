---
phase: 02-submit-a-qualified-haoo-enquiry
plan: 05
subsystem: ui
tags: [react, forms, accessibility, retry, noscript, vitest]

requires:
  - phase: 02-01
    provides: Controlled qualification form, synchronous in-flight guard, and form-replacing success tracer
  - phase: 02-04
    provides: Retained-value correction loop and focus-safe validation behavior
provides:
  - Focused provider-failure panel with retained values, guarded retry, and direct contacts
  - Enriched non-resubmittable confirmation with the approved one-business-day response promise
  - Physical no-JavaScript qualification recovery with exact WhatsApp, phone, and email destinations
  - Static-boundary, genericity, focus-contrast, and built-output regression coverage for QualifyFallback
affects: [phase-03 engagement summary, phase-05 live delivery verification, HAOO onboarding UAT]

actuals:
  tokens: 5869
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "One guarded submit function serves initial submission and explicit retained-value retry"
    - "Terminal contact copy is parameterized through centralized product identity and contact data"
    - "No-JavaScript form recovery is physical document markup with no provider submission surface"

key-files:
  created:
    - src/components/QualifyFallback.tsx
  modified:
    - src/components/QualifyForm.tsx
    - src/products/copy.ts
    - products/haoo/index.html
    - src/test/qualify-form.test.tsx
    - src/test/build-output.test.ts
    - src/test/product-shell-reuse.test.tsx
    - src/test/focus-contrast.test.ts

key-decisions:
  - "The HAOO team approved the exact public response-time sentence: Someone will reply within one business day."
  - "Retry invokes the same validator, payload builder, endpoint, and synchronous in-flight guard as initial submission, so retained values cannot enter a weaker request path."
  - "Success exposes WhatsApp and phone only; failure and no-JavaScript recovery expose WhatsApp, phone, and email, all with distinct accessible names ending in instead."

patterns-established:
  - "Pattern: terminal recovery never echoes provider response details or submitted personal data"
  - "Pattern: static recovery links duplicate centralized destinations literally and are contract-checked against product data"

requirements-completed: [LEAD-05, LEAD-06]

coverage:
  - id: D1
    description: "Provider rejection and network failure retain all ten values, restore an enabled submit control, focus one failure heading, and expose one retry control"
    requirement: LEAD-05
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#retains entered values and reports the problem when the provider rejects the request"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#lands a rejected provider promise in the failed state and never in succeeded"
        status: pass
    human_judgment: false
  - id: D2
    description: "Retry sends the retained payload exactly once under rapid repeat activation and reuses one failure panel"
    requirement: LEAD-05
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#admits exactly one retry while the retained request is in flight"
        status: pass
    human_judgment: false
  - id: D3
    description: "Success still replaces the form and focuses one confirmation while adding the approved response-time promise and direct alternatives"
    requirement: LEAD-05
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#announces every submission state"
        status: pass
    human_judgment: false
  - id: D4
    description: "Terminal links keep exact centralized destinations, use distinct accessible names, and remain product-generic for a synthetic identity"
    requirement: LEAD-06
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#renders terminal recovery copy from a synthetic product identity"
        status: pass
      - kind: unit
        ref: "src/test/product-shell-reuse.test.tsx#rejects product-name literals in product-generic executable source"
        status: pass
    human_judgment: false
  - id: D5
    description: "Source and built HAOO documents contain one truthful no-JavaScript form recovery panel with exact contacts and no submission behavior"
    requirement: LEAD-06
    verification:
      - kind: integration
        ref: "src/test/build-output.test.ts#publishes one truthful no-JavaScript qualification recovery panel"
        status: pass
      - kind: integration
        ref: "npm test"
        status: pass
    human_judgment: false
  - id: D6
    description: "QualifyFallback inherits all four static prohibition groups and every focus indicator uses an approved measurable pairing"
    requirement: LEAD-06
    verification:
      - kind: unit
        ref: "src/test/build-output.test.ts#runs every inherited static prohibition against the qualification fallback"
        status: pass
      - kind: unit
        ref: "src/test/focus-contrast.test.ts#keeps every focus indicator in src/components/QualifyFallback.tsx visible against the surface it renders on"
        status: pass
    human_judgment: false

duration: 7 min
completed: 2026-08-30
status: complete
---

# Phase 02 Plan 05: Terminal Recovery and Confirmation Summary

**Focused retained-value retry, approved one-business-day confirmation copy, and a physical no-JavaScript direct-contact path with exact centralized HAOO destinations**

## Performance

- **Duration:** 7 min
- **Started:** 2026-08-30T12:01:59Z
- **Completed:** 2026-08-30T12:08:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Provider rejection and network failure now focus one recovery panel beneath the unchanged form, preserve every entered value, restore the primary submit control, and offer a retry that cannot create concurrent requests.
- Success keeps the tracer's form-replacing, non-resubmittable confirmation and external live region while adding the exact approved response promise and WhatsApp/phone alternatives.
- Visitors without JavaScript receive a truthful physical-document explanation plus WhatsApp, phone, and email; the recovery region contains no form action, provider endpoint, script, captcha, or simulated request path.
- The new static fallback component is covered by product-literal, focus-contrast, and all four inherited source-boundary prohibition groups.

## Task Commits

1. **Task 1: Confirm the HAOO response-time promise** — human-approved decision recorded; no code commit
2. **Task 2 RED: Add terminal recovery contracts** — `81bba62` (test)
3. **Task 2 GREEN: Add focused terminal recovery panels** — `95a3273` (feat)
4. **Task 3 RED: Add no-JavaScript recovery contracts** — `ed1f372` (test)
5. **Task 3 GREEN: Publish no-JavaScript form recovery** — `a53515f` (feat)
6. **Verification fix: Keep the new boundary assertion type-safe** — `a74e81a` (fix)

## Files Created/Modified

- `src/components/QualifyFallback.tsx` — product-generic focused failure panel with optional guarded retry and three direct-contact alternatives.
- `src/components/QualifyForm.tsx` — shared initial/retry submission path, failure focus, enriched terminal confirmation, and direct-contact rendering.
- `src/products/copy.ts` — identity-guarded fallback action labels, failure body, confirmation body, and success contact descriptors.
- `products/haoo/index.html` — physical no-JavaScript qualification recovery section.
- `src/test/qualify-form.test.tsx` — rejected response, thrown request, retained values, retry concurrency, confirmation, exact href, focus, and synthetic-product contracts.
- `src/test/build-output.test.ts` — source/built no-JavaScript recovery and complete static-boundary contracts.
- `src/test/product-shell-reuse.test.tsx` — QualifyFallback product-literal scan registration.
- `src/test/focus-contrast.test.ts` — QualifyFallback focus-pair scan registration.

## Decisions Made

- The user selected `one-business-day`. The exact public sentence is **“Someone will reply within one business day.”**
- Retry uses `submitValues()`—the same validation, pure payload builder, endpoint, and synchronous `inFlightRef` authority used by the form submit event. No parallel retry-only request seam exists.
- The confirmation panel uses the two immediate alternatives specified by the UI contract; failure and no-JavaScript panels add email as the third recovery option.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected the new static-boundary assertion's message type**
- **Found during:** Plan-level `npm run typecheck`
- **Issue:** The new test passed a `RegExp` as Vitest's optional assertion message, while its TypeScript overload requires a string.
- **Fix:** Stringified the regex only for assertion context; the regex used by `not.toMatch` remains unchanged.
- **Files modified:** `src/test/build-output.test.ts`
- **Verification:** `npm run typecheck`, the focused build-output suite, and the full plan verification all pass.
- **Committed in:** `a74e81a`

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug).
**Impact on plan:** Test-only typing correction with no production behavior or scope change.

## Issues Encountered

- `npm run lint` exits successfully with the same four pre-existing `react-refresh/only-export-components` warnings in `QualifyForm.tsx`; no new warning was introduced.
- Vite reports the existing outdated `caniuse-lite` advisory during builds; the build and all tests pass.

## Known Stubs

None. Empty values in `QualifyForm.tsx` are deliberate controlled-form and idle-status initialization, not rendered feature placeholders.

## User Setup Required

None - no external service configuration required.

## Verification

- `npm run test:unit -- --run src/test/qualify-form.test.tsx src/test/product-shell-reuse.test.tsx src/test/focus-contrast.test.ts src/test/build-output.test.ts` — 66/66 passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed with 0 errors and 4 pre-existing warnings.
- `npm test` — production build passed; 150/150 tests passed.

## Next Phase Readiness

- Terminal and JavaScript-unavailable recovery are complete for LEAD-05 and LEAD-06.
- Plan 02-06 can refine disclosure and privacy behavior without changing the failure/retry state machine.
- Phase 5 still owns live FormSubmit activation and mailbox-delivery verification; this plan deliberately proves browser-observable sending only.

---
*Phase: 02-submit-a-qualified-haoo-enquiry*
*Completed: 2026-08-30*

## Self-Check: PASSED

`src/components/QualifyFallback.tsx` and this summary exist. Commits `81bba62`, `95a3273`, `ed1f372`, `a53515f`, and `a74e81a` are present in git history, and the summary records complete status, both requirement IDs, and the approved response-time sentence.
