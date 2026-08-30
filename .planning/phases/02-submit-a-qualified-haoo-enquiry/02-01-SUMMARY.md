---
phase: 02-submit-a-qualified-haoo-enquiry
plan: 01
subsystem: ui
tags: [react, typescript, forms, formsubmit, accessibility, vitest, testing-library]

# Dependency graph
requires:
  - phase: 01-discover-and-choose-a-haoo-onboarding-path
    provides: ProductDefinition data contract, product-generic ProductPage shell, OnboardingChoices focus tokens, Phase 1 static-boundary and shell-reuse guards
provides:
  - "`#qualify` section on `/products/haoo/` between `#brochure` and `#onboarding`"
  - "Product-generic `QualifyForm` component driven entirely by `product.qualify` data"
  - "`ProductQualifyForm` / `QualifyField` / `QualifyOption` / `QualifyFieldGroup` / `QualifyControl` data contract on `ProductDefinition`"
  - "Pure `buildSubmissionBody`, `validateQualifyValues`, `isFieldRequired` seams"
  - "Blank-safe `resolveQualifyEndpoint` plus `QUALIFY_ENDPOINT` / `QUALIFY_ENDPOINT_FALLBACK`"
  - "Per-file `PRODUCT_SOURCE_BOUNDARY` map replacing the flat Phase 1 regex list"
  - "`src/test/qualify-form.test.tsx` end-to-end submission contract (17 tests)"
affects: [02-02 field data, 02-03 nav and entry points, 02-04 conditional requiredness, 02-05 confirmation and failure panels, 02-06 disclosure copy, 02-07 endpoint edge cases and guard registration]

actuals:
  tokens: 19654
  tasks: 1
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Provider request as a pure testable descriptor (`buildSubmissionBody`) separate from the component"
    - "Field definitions as product data; the component knows no product's field names, legends or endpoint"
    - "Explicit four-state submission machine (`idle`/`submitting`/`succeeded`/`failed`) with value retention on failure"
    - "Synchronous `useRef` concurrency authority; React state and native `disabled` are feedback only"
    - "Persistently mounted `role=\"status\"` region outside the replaceable form card"
    - "GOV.UK-style error summary: `tabIndex={-1}` container wrapping an inner `role=\"alert\"`, focused after an invalid submit"
    - "Static boundary narrowed per file via a `Record<string, readonly RegExp[]>` map rather than deleted regexes"

key-files:
  created:
    - src/components/QualifyForm.tsx
    - src/test/qualify-form.test.tsx
  modified:
    - src/products/types.ts
    - src/products/haoo.ts
    - src/pages/ProductPage.tsx
    - src/test/build-output.test.ts
    - src/test/product-shell-reuse.test.tsx

key-decisions:
  - "The tracer confirmation panel uses the locked UI-SPEC heading `Your details are on their way` plus the browser-observable body `Your details were sent.`, so Plan 05 enriches an existing panel instead of replacing a differently-named one"
  - "The Phase 1 static boundary is narrowed per file via `PRODUCT_SOURCE_BOUNDARY`, and the test additionally asserts every listed file still carries the whole `ALWAYS_FORBIDDEN` group so a future narrowing cannot silently drop storage, analytics, injection, router or backend prohibitions"
  - "The locked sub-lead string lives in a `QUALIFY_SUB_LEAD` module constant in `ProductPage.tsx` rather than inline JSX entities, so the em dash and apostrophe are byte-checkable"
  - "The synthetic ZENITH product reuses `HAOO_PRODUCT.qualify.fields` and `.groups` verbatim, which turns the pre-existing `not.toContain('HAOO')` assertion into direct proof that the form component is product-generic"
  - "`resolveQualifyEndpoint` returns the outer-trimmed original candidate rather than the parsed `URL.href`, so a valid readable-address target such as `/ajax/info@haoo.online` is preserved byte-for-byte instead of being percent-encoded by the URL parser"

patterns-established:
  - "Pattern 1: product data -> generic component -> page composition -> provider request, proven end to end on one commit before any expansion plan widens it"
  - "Pattern 2: `noValidate` plus a single custom validation path, so every submit activation reaches the accessible error summary and native constraint validation can never bypass it"
  - "Pattern 3: terminal submission state derived from `response.ok` alone; the provider response body is never read"

requirements-completed: [LEAD-01, LEAD-04, LEAD-05, LEAD-06]

coverage:
  - id: D1
    description: "A visitor reaches a `#qualify` section on `/products/haoo/` between the brochure and closing onboarding blocks, fills name / email / role, and submits without leaving the page"
    requirement: LEAD-01
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#collects a name and a usable contact method"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#renders configured groups and legends in configured DOM order"
        status: pass
    human_judgment: false
  - id: D2
    description: "The form carries `noValidate`, so an invalid submit always reaches the custom validation path: inline messages plus an accessible error summary render, focus moves to the summary container (not the inner alert, not the first invalid control), and zero requests are issued"
    requirement: LEAD-01
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#collects a name and a usable contact method"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#rejects a manipulated select value before any request is issued"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#rejects a programmatically over-length value before any request is issued"
        status: pass
    human_judgment: false
  - id: D3
    description: "A valid submission issues exactly one JSON POST to `HAOO_PRODUCT.qualify.endpoint` carrying `_subject`, `_template`, `_captcha`, `_honey`, `Source` and one readable key per supplied field, and carrying no `_cc`, `_next`, `_autoresponse` or `_replyto`"
    requirement: LEAD-04
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#posts a readable, correctly-addressed payload"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#omits empty optional values while always carrying the provider options"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#keys the payload byte-for-byte on the configured email labels"
        status: pass
    human_judgment: false
  - id: D4
    description: "Submitting, sent and failed are announced through one persistently mounted `role=\"status\"` region; success replaces the form with a focused confirmation panel and failure retains every entered value"
    requirement: LEAD-05
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#announces every submission state"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#retains entered values and reports the problem when the provider rejects the request"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#lands a rejected provider promise in the failed state and never in succeeded"
        status: pass
    human_judgment: false
  - id: D5
    description: "The honeypot is an off-screen labelled `_honey` control posted unchanged with `_captcha=false`; no captcha or third-party challenge widget exists, and exactly one request is admitted while a submission is in flight"
    requirement: LEAD-06
    verification:
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#traps bots without blocking assistive technology"
        status: pass
      - kind: unit
        ref: "src/test/qualify-form.test.tsx#admits exactly one request while a submission is still in flight"
        status: pass
    human_judgment: false
  - id: D6
    description: "The Phase 1 static boundary is narrowed per file rather than deleted: storage, analytics, injection, router and backend prohibitions still apply to every product source, including the two files that gained a capability"
    requirement: LEAD-06
    verification:
      - kind: unit
        ref: "src/test/build-output.test.ts#keeps the product surface inside its narrowed static boundary"
        status: pass
      - kind: unit
        ref: "src/test/product-shell-reuse.test.tsx#renders a synthetic product through every product-named shell surface"
        status: pass
    human_judgment: false
  - id: D7
    description: "A live submission actually arrives at info@haoo.online with the HAOO subject and human-readable labels"
    requirement: LEAD-04
    verification: []
    human_judgment: true
    rationale: "The browser can only observe that a request was issued and that the provider returned a 2xx. Real mailbox delivery requires FormSubmit activation against a mailbox this repo does not own; the plan defers it to Phase 5 / LEAD-07, and STATE.md already tracks HAOO mailbox ownership as a blocker."
  - id: D8
    description: "FormSubmit's evaluation of `_honey` plus `_captcha=false` is a sufficient spam control for the HAOO inbox at launch volume"
    requirement: LEAD-06
    verification: []
    human_judgment: true
    rationale: "Flagged assumption carried forward from the plan (LEAD-06 probe classified `unclassified`). Sufficiency is a product decision about real inbox volume, not a property any test can assert; 02-RESEARCH.md records it as accepted residual risk."

duration: 12 min
completed: 2026-08-30
status: complete
---

# Phase 02 Plan 01: End-to-end qualified enquiry tracer Summary

**A working `#qualify` section on `/products/haoo/` that validates three fields against a custom accessible error path and posts exactly one correctly-addressed JSON enquiry to the FormSubmit AJAX endpoint, through a product-generic component driven entirely by product data.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-30T07:38:00Z
- **Completed:** 2026-08-30T07:50:00Z
- **Tasks:** 1 (tracer)
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments

- Proved the whole Phase 2 architecture on one commit: product data → generic component → page composition → provider request → in-page state machine. Every later plan in this phase now widens a path that already runs rather than discovering it.
- Landed `QualifyForm.tsx` as a genuinely product-generic component — it imports no product module, contains zero `HAOO` literals, and reads its endpoint, subject, source note, fields and fieldset legends entirely from `product.qualify`. The synthetic ZENITH product renders the same form.
- Made the provider contract testable in isolation: `buildSubmissionBody` is a pure function whose output keys are exactly `_subject`, `_template`, `_captcha`, `_honey`, one readable label per supplied field, and `Source` — with `_cc`, `_next`, `_autoresponse` and `_replyto` unreachable by construction (threat T-02-04).
- Made double submission impossible along two independent axes: a synchronous `inFlightRef` admits at most one request before React can commit anything, and success replaces the form card entirely so no submit control remains reachable.
- Narrowed rather than deleted the Phase 1 static boundary (RESEARCH Pitfall 1, threat T-02-07). `PRODUCT_SOURCE_BOUNDARY` grants `src/products/haoo.ts` the provider token and `src/components/QualifyForm.tsx` the network and form-markup tokens, and nothing else; the test asserts every listed file still carries the whole `ALWAYS_FORBIDDEN` group.
- Suite grew from 65 to 82 passing tests with `npm test`, `npm run typecheck` and `npm run lint` all exiting 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end "send my details" — one path, page to provider** — `ae61aed` (feat)

**Plan metadata:** see the `docs(02-01)` commit that carries this summary.

## Files Created/Modified

- `src/components/QualifyForm.tsx` — **created.** Product-generic enquiry form. Exports `QualifyForm` (default), the pure `buildSubmissionBody` / `validateQualifyValues` / `isFieldRequired` seams, and the locked `QUALIFY_SUBMIT_LABEL`, `QUALIFY_SUBMITTING_LABEL`, `QUALIFY_SUMMARY_HEADING`, `QUALIFY_STATUS_MESSAGES` constants.
- `src/test/qualify-form.test.tsx` — **created.** 17 tests covering the end-to-end submission contract, the payload shape, the state machine, the honeypot, concurrency, manipulated-value rejection, group rendering, and the pure validators.
- `src/products/types.ts` — added `QualifyControl`, `QualifyOption`, `QualifyRequiredWhen`, `QualifyField`, `QualifyFieldGroup`, `ProductQualifyForm` and the required `ProductDefinition.qualify` field. The full shape is landed now so plans 02 and 04 add data, not type churn.
- `src/products/haoo.ts` — added `QUALIFY_ENDPOINT_FALLBACK`, `resolveQualifyEndpoint`, `QUALIFY_ENDPOINT` and the `qualify` data block (three tracer fields, two groups).
- `src/pages/ProductPage.tsx` — inserted `<section id="qualify" aria-label="Send your details">` between `#brochure` and `#onboarding`, plus the locked `QUALIFY_SUB_LEAD` constant. The file still contains no `<form`, no `fetch(` and no provider token.
- `src/test/build-output.test.ts` — replaced the flat `PRODUCT_SOURCES` array and inline regex list with the `ALWAYS_FORBIDDEN` / `NETWORK_FORBIDDEN` / `PROVIDER_FORBIDDEN` / `FORM_MARKUP_FORBIDDEN` groups and the `PRODUCT_SOURCE_BOUNDARY` per-file map.
- `src/test/product-shell-reuse.test.tsx` — gave the synthetic ZENITH literal a `qualify` block reusing the shipped field and group definitions with a ZENITH endpoint, subject and source note.

## Decisions Made

1. **Confirmation-panel naming.** The plan describes a "minimal" tracer panel; the UI-SPEC locks the heading `Your details are on their way`. The tracer uses that locked heading with `Your details were sent.` as its body, so Plan 05 enriches an existing panel rather than renaming one — and the truthful-status prohibition (describe the browser event, never delivery) holds in both.
2. **Boundary-narrowing invariant made explicit.** Beyond scanning each file against its own group, the boundary test asserts that every entry in `PRODUCT_SOURCE_BOUNDARY` contains all of `ALWAYS_FORBIDDEN`. A future plan can therefore grant a file a new capability, but cannot quietly drop a storage, analytics, injection, router or backend prohibition while doing so.
3. **Resolver returns the trimmed candidate, not `URL.href`.** Parsing `https://formsubmit.co/ajax/info@haoo.online` and re-serialising it would percent-encode the readable address. The resolver validates through `new URL(...)` but returns the original outer-trimmed string, so a readable-address destination survives byte-for-byte.
4. **Sub-lead as a module constant.** The locked sub-lead lives in `QUALIFY_SUB_LEAD` with an explicit `—` escape rather than inline JSX entities, so the em dash and straight apostrophe are unambiguous in source and greppable by a later contract.
5. **ZENITH reuses the shipped field definitions.** This makes the pre-existing `expect(container.textContent).not.toContain('HAOO')` assertion do double duty as proof that the form component is product-generic, exactly as the plan intended.

## Deviations from Plan

None — plan executed exactly as written. The `<action>` was implemented layer by layer; no bug, missing-critical or blocking deviation rule was triggered, and no architectural decision required escalation.

Two clarifications resolved within the plan's own latitude (recorded above as Decisions 1 and 3) concerned wording the plan left to the UI-SPEC and a resolver return value the plan specified behaviourally rather than literally. Neither changed scope, files, or the contract surface.

**Total deviations:** 0
**Impact on plan:** None.

## Issues Encountered

- **Four first-run test failures, all in my own assertions, none in the implementation.** Three used `getByText` on validation messages that the UI-SPEC deliberately renders twice (inline beside the control *and* as the error-summary link text), and one asserted the honeypot wrapper class did not contain `hidden` — which the required `overflow-hidden` token trivially violates. Tightened to id-scoped inline-error lookups, an explicit summary-link-order assertion, and a `classList.contains('hidden')` check. The component was never at fault.
- **`npm test` build-freshness guard.** The Phase 1 staleness contract fails on `npm run test:unit` alone after a source edit, by design. The full `npm test` (build then suite) is green: 82/82.

## Tracer Feedback Gate

The tracer `<verify>` was re-run end to end after the task commit:
`npm run test:unit -- --run src/test/qualify-form.test.tsx src/test/build-output.test.ts src/test/product-shell-reuse.test.tsx && npm run typecheck` — **PASS**.

This plan contains no expansion task, so no expansion work was poured onto an unverified foundation. Human verification of the tracer is deferred per `workflow.human_verify_mode: end-of-phase` in `.planning/config.json`; the live-delivery check remains a Phase 5 / LEAD-07 item (coverage entry D7).

## Verification Results

| Check | Result |
|---|---|
| `npm test` (build then full suite) | PASS — 82 passed (7 files), up from 65 |
| `npm run typecheck` | PASS — exit 0 |
| `npm run lint` | PASS — exit 0 (4 `react-refresh/only-export-components` warnings on the plan-mandated non-component exports from `QualifyForm.tsx`) |
| `npm run test:unit -- --run src/test/build-output.test.ts -t "boundary"` | PASS |
| `npm run test:unit -- --run src/test/product-shell-reuse.test.tsx` | PASS |
| `npm run test:unit -- --run src/test/qualify-form.test.tsx` | PASS — 17 tests |
| `grep -v '^\s*[/*]' src/components/QualifyForm.tsx \| grep -c 'role="status"'` | `1` |
| `#qualify` byte offset between `#brochure` and `#onboarding` | PASS (8603 < 9025 < 9619) |
| `ProductPage.tsx` free of `<form`, `fetch(`, `formsubmit` | PASS |
| `QualifyForm.tsx` free of any `HAOO` literal or product-module import | PASS |
| `resolveQualifyEndpoint` rejects 16 invalid inputs, preserves 2 valid ones | PASS (throwaway probe; Plan 07 owns the permanent table) |

All 18 task `<acceptance_criteria>` were executed and passed. Manual live-delivery verification is explicitly out of scope for this plan.

## Known Stubs

None. `isFieldRequired` returns `field.required` today, which is the complete and correct answer for the current data — no field declares `requiredWhen` yet. It is a real implementation of a narrower contract, not a placeholder returning fake data, and Plan 04 widens it when conditional fields arrive.

## Threat Flags

None. No security-relevant surface was introduced outside the plan's `<threat_model>`. The single network destination, the honeypot, the build-time env inlining and the narrowed static boundary are all already registered as T-02-03 through T-02-07.

## User Setup Required

None for this plan. `VITE_HAOO_FORM_ENDPOINT` is optional by construction — an unset or blank value resolves to `QUALIFY_ENDPOINT_FALLBACK`, so builds and tests work with no configuration. Plan 03 owns injecting the variable into deployed builds and documenting it; Plan 07 owns typing it in `src/vite-env.d.ts`.

## Next Phase Readiness

Ready for the rest of Phase 2. The seams every following plan needs are landed and green:

- **02-02** adds the remaining seven fields and the 47-county list as pure `qualify.fields` / `qualify.groups` data — no component change required.
- **02-03** adds the `Send details` nav entry, the three `OnboardingChoices` entry points, workflow env injection and maintainer docs.
- **02-04** widens `isFieldRequired` to interpret the generic `requiredWhen` descriptor; the summary focus target and the four requiredness call sites are already unified through that one function.
- **02-05** enriches the existing confirmation panel and adds the failure/`noscript` fallback panels; the terminal-state, focus and single-panel invariants are already contract-bound.
- **02-06** adds the required-fields instruction and the D-25 collection disclosure.
- **02-07** adds `qualify-data.test.ts` with the full endpoint edge-case table, `ImportMetaEnv` typing, and registers `QualifyForm.tsx` in `FOCUS_SOURCES` and `GENERIC_PRODUCT_SOURCES`.

**Carried concerns (unchanged, none introduced by this plan):** HAOO mailbox ownership and FormSubmit activation are still required for the Phase 5 live-delivery check; privacy/legal approval of the collection notice is still outstanding; and the LEAD-06 spam-sufficiency assumption remains a flagged product decision.

## Self-Check: PASSED

- `src/components/QualifyForm.tsx` — FOUND
- `src/test/qualify-form.test.tsx` — FOUND
- Commit `ae61aed` — FOUND in `git log --oneline --all`
- No files deleted by the task commit (`git diff --diff-filter=D HEAD~1 HEAD` empty)
- No untracked source files left behind

---
*Phase: 02-submit-a-qualified-haoo-enquiry*
*Completed: 2026-08-30*
