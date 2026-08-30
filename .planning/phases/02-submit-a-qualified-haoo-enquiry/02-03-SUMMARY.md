---
phase: 02-submit-a-qualified-haoo-enquiry
plan: 03
subsystem: ui
tags: [react, typescript, navigation, accessibility, vitest, testing-library, github-actions, vite]

# Dependency graph
requires:
  - phase: 02-submit-a-qualified-haoo-enquiry
    provides: "02-01 — the `#qualify` section on `/products/haoo/` between `#brochure` and `#onboarding`, plus `resolveQualifyEndpoint` / `QUALIFY_ENDPOINT` / `QUALIFY_ENDPOINT_FALLBACK`"
  - phase: 02-submit-a-qualified-haoo-enquiry
    provides: "02-07 — the completed endpoint edge-case table and the per-file `PRODUCT_SOURCE_BOUNDARY` guard registration this expansion had to stay inside"
  - phase: 01-discover-and-choose-a-haoo-onboarding-path
    provides: "Product-generic ProductPage shell, three-position OnboardingChoices, shared PRODUCT_LINKS nav array, copy.ts identity guard, focus-contrast and shell-reuse contracts"
provides:
  - "`qualifyEntryPointLabel(productName)` — product-generic entry-point copy builder guarded by `requireIdentity`"
  - "One native `#qualify` anchor in every `OnboardingChoices` position (three per product page)"
  - "`Send details` → `#qualify` as the fourth `PRODUCT_LINKS` entry, rendered by both nav presentations"
  - "Executable navigation contracts: entry-link count/href/placement, nav order, and single-target assertions"
  - "Deploy-time `VITE_HAOO_FORM_ENDPOINT` injection via the Actions `vars` context"
  - "README `## HAOO qualification form` — accepted endpoint shape, every fallback case, public-bundle honesty, Phase 5 activation ownership"
  - "`02-USER-SETUP.md` — the repository-variable and FormSubmit token setup checklist"
affects: [02-04 conditional requiredness, 02-05 confirmation and failure panels, 02-06 disclosure copy, phase-05 LEAD-07 endpoint activation]

actuals:
  tokens: 3367
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Entry-point copy as a guarded builder: a locked label that carries no product name still routes identity through `requireIdentity`, so a nameless product fails closed instead of shipping an orphan link"
    - "One shared nav array mapped by both viewport presentations — a new destination cannot reach one viewport and silently miss the other"
    - "Public build-time configuration documented as obfuscation with an explicit rejected-value table, never as a secret"

key-files:
  created:
    - .planning/phases/02-submit-a-qualified-haoo-enquiry/02-USER-SETUP.md
    - .planning/phases/02-submit-a-qualified-haoo-enquiry/deferred-items.md
  modified:
    - src/products/copy.ts
    - src/components/OnboardingChoices.tsx
    - src/components/ProductHeader.tsx
    - src/test/haoo-page.test.tsx
    - src/test/product-shell-reuse.test.tsx
    - .github/workflows/deploy.yml
    - README.md

key-decisions:
  - "Placed the entry anchor after the 'These contact links leave the ZERO-PAPER HUB product page' note rather than between the contact group and that note, so the note keeps describing only the links that actually leave the site"
  - "`qualifyEntryPointLabel` calls `requireIdentity` for its fail-closed side effect and returns the locked label, keeping the builder consistent with every other copy helper without inventing a product-name-bearing string the UI-SPEC does not authorise"
  - "Reused the existing `focusLight` pairing verbatim instead of introducing an accent-on-light variant, so no new Tailwind ring token reaches `focus-contrast.test.ts`"
  - "Documented rejected endpoint values as an explicit enumerated list mirroring `resolveQualifyEndpoint`'s branches, so a maintainer can predict the fallback without reading the resolver"

patterns-established:
  - "Nav-order contract asserted as a full ordered label array (`toEqual`), not per-link existence — reordering the array is a test failure, not a silent drift"
  - "Every nav destination asserted to resolve to exactly one in-document id, so a fragment can never point at a missing or duplicated target"

requirements-completed: [LEAD-01, LEAD-04, LEAD-06]

coverage:
  - id: D1
    description: "Three product-generic `Send your details instead` entry links, one per onboarding decision point, each targeting the single `#qualify` section"
    requirement: LEAD-01
    verification:
      - kind: unit
        ref: "src/test/haoo-page.test.tsx#exposes one entry link per onboarding placement, all targeting the single qualify section"
        status: pass
      - kind: unit
        ref: "src/test/product-shell-reuse.test.tsx#renders a synthetic product through every product-named shell surface"
        status: pass
    human_judgment: false
  - id: D2
    description: "The entry link sits below the assisted contact group and never displaces WhatsApp as the primary assisted action"
    requirement: LEAD-04
    verification:
      - kind: unit
        ref: "src/test/haoo-page.test.tsx#places the entry link below the assisted contact group without displacing WhatsApp"
        status: pass
      - kind: unit
        ref: "src/test/haoo-page.test.tsx#leaves every Phase 1 onboarding accessible name at exactly three occurrences"
        status: pass
    human_judgment: false
  - id: D3
    description: "`Send details` → `#qualify` in both desktop and mobile product navigation, in page order Benefits · Capabilities · Brochure · Send details · Onboarding"
    requirement: LEAD-01
    verification:
      - kind: unit
        ref: "src/test/haoo-page.test.tsx#exposes the qualification entry in the desktop navigation in page order"
        status: pass
      - kind: unit
        ref: "src/test/haoo-page.test.tsx#exposes the same entry once in the mobile disclosure menu"
        status: pass
      - kind: unit
        ref: "src/test/haoo-page.test.tsx#points both navigation presentations at the single qualify section"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every new control is a native keyboard-focusable anchor with a 44px target and a contrast-verified focus ring, independent of form, network, analytics, and storage state"
    requirement: LEAD-06
    verification:
      - kind: unit
        ref: "src/test/focus-contrast.test.ts#keeps every focus indicator in src/components/OnboardingChoices.tsx visible against the surface it renders on"
        status: pass
      - kind: unit
        ref: "src/test/build-output.test.ts#static product boundary (ALWAYS_FORBIDDEN: storage, analytics, router, injection)"
        status: pass
      - kind: unit
        ref: "src/test/haoo-page.test.tsx#keeps every navigation destination an in-page fragment of an existing section"
        status: pass
    human_judgment: false
  - id: D5
    description: "Entry-point copy is product-name parameterised and no HAOO literal enters a product-generic source"
    requirement: LEAD-06
    verification:
      - kind: unit
        ref: "src/test/product-shell-reuse.test.tsx#rejects product-name literals in product-generic executable source"
        status: pass
      - kind: unit
        ref: "src/test/product-shell-reuse.test.tsx#fails closed when a product identity is empty"
        status: pass
    human_judgment: false
  - id: D6
    description: "The deployed build receives the HAOO endpoint from a public Actions variable and retains its documented https fallback"
    requirement: LEAD-04
    verification:
      - kind: other
        ref: "grep -q 'vars.VITE_HAOO_FORM_ENDPOINT' .github/workflows/deploy.yml && ! grep -q 'secrets.VITE_HAOO_FORM_ENDPOINT' .github/workflows/deploy.yml"
        status: pass
      - kind: other
        ref: "env -u VITE_HAOO_FORM_ENDPOINT npm run build (exit 0 — documented fallback stays buildable)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The repository variable is actually created in GitHub and carries a valid FormSubmit random-token URL for info@haoo.online"
    verification: []
    human_judgment: true
    rationale: "Requires human access to GitHub repository settings and to FormSubmit; no automated check can create or read the Actions variable from this repository. Tracked in 02-USER-SETUP.md. Endpoint activation and live-mail delivery remain Phase 5 LEAD-07."

# Metrics
duration: 8 min
completed: 2026-08-30
status: complete
---

# Phase 02 Plan 03: Entry Points and Product Navigation Summary

**Three product-generic `Send your details instead` anchors and a `Send details` nav entry make `#qualify` reachable from every onboarding decision point and both nav presentations, with the deploy build now injecting the public FormSubmit endpoint through an Actions variable**

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-30T08:20:00Z
- **Completed:** 2026-08-30T08:28:00Z
- **Tasks:** 3
- **Files modified:** 7 (2 created)

## Accomplishments

- Every `OnboardingChoices` position now offers the written alternative — one native `#qualify` anchor rendered below the assisted contact group, so all three decision points reach the form without WhatsApp losing visual primacy or self-onboarding becoming conditional.
- `qualifyEntryPointLabel` joins the `copy.ts` builder family: the label is product-generic, the identity still routes through `requireIdentity`, and no HAOO literal enters a generic source.
- `PRODUCT_LINKS` gained a fifth entry in page order, and both desktop and mobile presentations keep mapping the one shared array — neither viewport can silently lose the entry point.
- Navigation became contract-covered rather than selector-checked: the nav order is asserted as a full ordered label array, and every nav destination is proven to resolve to exactly one in-document id.
- The deploy workflow now passes `vars.VITE_HAOO_FORM_ENDPOINT` to its Build step, and README documents the accepted endpoint shape, every rejected-value fallback, the public-bundle limitation, and Phase 5 ownership of activation.

## Task Commits

Each task was committed atomically:

1. **Task 1: Written-enquiry entry point in all onboarding blocks** — `5ddba6f` (test, RED) → `5b0dd1e` (feat, GREEN)
2. **Task 2: `Send details` in desktop and mobile product navigation** — `bf26054` (test, RED) → `7322c73` (feat, GREEN)
3. **Task 3: Build-time endpoint injection and documentation** — `faec4d5` (docs)

_No REFACTOR commit was needed for either TDD task: both implementations were a guarded copy builder plus one JSX anchor, and a shared-array insertion — neither left duplication to clean up._

## Files Created/Modified

- `src/products/copy.ts` — adds `qualifyEntryPointLabel(productName)`, guarding identity while returning the UI-SPEC-locked label
- `src/components/OnboardingChoices.tsx` — renders one native `#qualify` anchor per position, below the assisted contact group, using the already-registered light focus pairing
- `src/components/ProductHeader.tsx` — `{ label: 'Send details', href: '#qualify' }` inserted into `PRODUCT_LINKS` after Brochure
- `src/test/haoo-page.test.tsx` — seven new contracts covering entry-link count/href/placement, Phase 1 name counts, nav order, mobile disclosure, and single-target resolution
- `src/test/product-shell-reuse.test.tsx` — synthetic-product entry links, byte-for-byte label, and identity-guard coverage for the new builder
- `.github/workflows/deploy.yml` — two-line `env:` block on the Build step reading the Actions `vars` context
- `README.md` — new `## HAOO qualification form` section (accepted shape, fallback table, not-a-secret statement, Phase 5 activation)
- `.planning/phases/02-submit-a-qualified-haoo-enquiry/02-USER-SETUP.md` — created; repository-variable and FormSubmit token checklist
- `.planning/phases/02-submit-a-qualified-haoo-enquiry/deferred-items.md` — created; one out-of-scope lint finding

## Decisions Made

- **Anchor placed after the "these contact links leave the site" note, not before it.** The note describes outward-bound links; the entry anchor is an in-page fragment. Placing it above the note would make the note read as covering a link it does not describe. Both positions satisfy "below the contact group", so accuracy decided it.
- **`qualifyEntryPointLabel` guards identity for the side effect only.** The UI-SPEC locks the visible label to `Send your details instead` with no product name, but a builder that skipped `requireIdentity` would be the one shell surface that renders happily for a nameless product. The guard keeps the family uniform and is asserted by the fails-closed contract.
- **No new Tailwind ring token.** `focus-contrast.test.ts` throws on unrecognised tokens by design; reusing `focusLight` keeps the new control inside the already-measured contrast contract instead of widening `RING_COLOR_TOKENS`.
- **README enumerates rejected values explicitly.** Mirroring each `resolveQualifyEndpoint` branch as a documented case means a maintainer can predict the fallback without reading TypeScript — and makes a future resolver change visibly a documentation change too.

## Deviations from Plan

None — plan executed exactly as written.

**Total deviations:** 0
**Impact on plan:** None. All three tasks landed within their stated file lists; the workflow diff is two added lines and touches no step, action version, or permission.

## Verification Results

| Check | Result |
|---|---|
| `npm run test:unit -- --run src/test/haoo-page.test.tsx src/test/product-shell-reuse.test.tsx` | PASS — 32 tests |
| `npm run test:unit` (full suite) | PASS — 132 tests, 8 files |
| `npm run typecheck` | PASS — 0 errors |
| `npm run lint` | PASS — 0 errors (4 pre-existing warnings in `QualifyForm.tsx`, deferred) |
| `env -u VITE_HAOO_FORM_ENDPOINT npm run build` | PASS — exit 0, fallback path buildable |
| `grep -q 'vars.VITE_HAOO_FORM_ENDPOINT'` and no `secrets.` read | PASS |
| Three onboarding entry links + two nav links, one `#qualify` target | PASS — asserted in `haoo-page.test.tsx` |

## Issues Encountered

- The full suite initially failed one build-freshness assertion (`build-output.test.ts` compares `dist/` mtimes against source mtimes). This is the contract working as designed after a source edit, not a defect — `npm run build` cleared it, and the project's own `npm test` script sequences build before vitest for exactly this reason.

## Known Stubs

None. Every surface this plan added is fully wired: the anchors carry real destinations, the nav entry resolves to a rendered section, and the endpoint variable has a working documented fallback rather than a placeholder.

## Threat Flags

None. The plan's threat register was fully mitigated as written — every new `href` is the literal `#qualify` with no visitor-derived data (T-02-12), both nav presentations map one shared array (T-02-13), and zero packages were installed (T-02-SC).

## User Setup Required

**External configuration is available but not required.** See [02-USER-SETUP.md](./02-USER-SETUP.md) for:

- The `VITE_HAOO_FORM_ENDPOINT` Actions **repository variable** (not a secret)
- Obtaining the FormSubmit random-token URL for `info@haoo.online`
- Build-time verification commands

Without it the site still ships a working form using the readable fallback `https://formsubmit.co/ajax/info@haoo.online`. Completing it only removes the readable address from the public bundle. Endpoint **activation** and live-mail confirmation remain Phase 5 `LEAD-07`.

## Next Phase Readiness

- Wave 3 sibling work is unaffected: this plan never opened `QualifyForm.tsx`, so 02-04 (conditional requiredness), 02-05 (confirmation and failure panels), and 02-06 (disclosure copy) inherit an untouched form component.
- The accessible-name budget is intact — all four Phase 1 onboarding names still occur exactly three times, so the `… instead` copy builders those plans need remain unclaimed.
- One deferred item is logged: four pre-existing `react-refresh/only-export-components` warnings in `QualifyForm.tsx` (lint exits 0). Owned by whichever later plan next edits that file.

## Self-Check: PASSED

- All 7 modified and 2 created files verified present on disk.
- All 5 task commits verified present in `git log`.
- No stubs, no skipped tests, no unrun `<verify>` commands.

---
*Phase: 02-submit-a-qualified-haoo-enquiry*
*Completed: 2026-08-30*
