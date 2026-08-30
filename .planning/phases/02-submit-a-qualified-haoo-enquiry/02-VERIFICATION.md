---
phase: 02-submit-a-qualified-haoo-enquiry
verified: 2026-08-30T12:58:37Z
status: gaps_found
score: 2/5 must-haves verified
behavior_unverified: 1
overrides_applied: 0
gaps:
  - truth: "SC2 — Visitor can tell which fields are required, why the details are collected, and that a relevant HAOO engagement summary will accompany the voluntary submission."
    status: partial
    reason: >-
      The required-fields instruction and the purpose sentence are correct and rendered.
      The third clause is not: the collection notice states in the present tense that a
      page-use summary "is included with your details", and the payload provably contains
      no such value. The visitor is told something false at the exact moment they decide
      whether to submit. The notice also calls that future summary "anonymous" while
      describing it as attached to a payload carrying full name and email address.
    artifacts:
      - path: "src/products/copy.ts"
        issue: >-
          Line 77 qualifyCollectionNotePageContext asserts present-tense inclusion
          ("... is included with your details") of a value buildSubmissionBody never emits.
      - path: "src/components/QualifyForm.tsx"
        issue: >-
          Lines 103-125 buildSubmissionBody emits only provider options, supplied fields
          and Source. Confirmed by the exact-key contract at
          src/test/qualify-form.test.tsx:400 which forbids any summary/context/analytics key.
      - path: "src/test/qualify-form.test.tsx"
        issue: "Line 31 pins the false present-tense sentence, so the passing suite protects the defect."
    missing:
      - "Restate the page-context sentence in the future tense the roadmap SC actually uses (\"will accompany\"), or remove it until Phase 3/4 lands the summary."
      - "Stop describing a summary attached to name+email as 'anonymous'; use coarse / non-identifying-on-its-own."
      - "Resolve the D-25 (present-tense 'is sent along with their details') vs D-26 (Phase 2 sends no summary) contradiction in 02-CONTEXT.md — this is a user-decision conflict, not an executor deviation."
  - truth: "SC4 — Visitor receives accessible validation, submitting, return, failure, and retry guidance and retains entered values after a recoverable client-side error."
    status: partial
    reason: >-
      Validation, submitting, failure and retry guidance are all implemented, wired and
      genuinely tested. The return (success) state is not truthful, and one value-retention
      path loses data silently. The success panel reports mailbox delivery from an HTTP 2xx
      alone, against the phase's own explicit prohibition and against README.md's own
      statement that delivery is unproven until Phase 5.
    artifacts:
      - path: "src/products/copy.ts"
        issue: >-
          Line 67 qualifyConfirmationBody — "We've sent your name, contact details, and the
          answers you gave to the HAOO team. Someone will reply within one business day."
          A 2xx proves only that formsubmit.co accepted the request.
      - path: "src/components/QualifyForm.tsx"
        issue: >-
          Line 39 QUALIFY_CONFIRMATION_HEADING "Your details are on their way" and line 326
          setState(response.ok ? 'succeeded' : 'failed'). By design the provider body is
          never read (COVERAGE row 21), so copy is the only safeguard and it overclaims.
      - path: "src/components/QualifyForm.tsx"
        issue: >-
          CR-04 — only the submit button takes disabled while state==='submitting'; every
          input stays editable and setValue keeps writing state, but the JSON body was
          snapshotted from the closure values when fetch started. A correction typed during
          a slow request is discarded, then confirmed as "the answers you gave".
    missing:
      - "Confine terminal success copy to the browser-observable event until LEAD-07 verifies live delivery."
      - "Add a regression assertion that terminal copy contains no 'sent ... to', 'delivered' or 'received by' before activation is complete."
      - "Freeze edits (or diff the submitted snapshot against current values) for the lifetime of an accepted request, plus a pending-promise test proving a confirmation cannot discard unsent edits."
  - truth: "Prohibition (02-01-PLAN) — Phase 2 must NOT report a browser-observable send as a delivered email. Status and confirmation copy describe what the browser did, never what the mailbox received."
    status: failed
    reason: >-
      Declared status in 02-01-PLAN frontmatter is 'unverified' (judgment-tier). Verified
      independently against the code: VIOLATED. QUALIFY_STATUS_MESSAGES.succeeded
      ("Your details were sent.") honours the prohibition, but the confirmation panel body
      it sits beside asserts the recipient and promises a reply. The endpoint is
      unactivated (02-USER-SETUP.md status Incomplete; activation is Phase 5 LEAD-07), so
      this false confirmation is what a real prospect sees today.
    artifacts:
      - path: "src/products/copy.ts"
        issue: "Line 67 claims delivery to the HAOO team from response.ok alone."
    missing:
      - "Bring qualifyConfirmationBody and QUALIFY_CONFIRMATION_HEADING inside the prohibition, then flip the prohibition status to resolved with its evidence."
deferred:
  - truth: "The engagement summary itself is not attached to the submission."
    addressed_in: "Phase 3 / Phase 4"
    evidence: >-
      Phase 3 SC1 "the engagement summary attached only after voluntary form submission";
      Phase 4 SC2 "A submitted qualification email includes the disclosed coarse HAOO
      engagement summary in human-readable form". D-26 explicitly scopes the summary out of
      Phase 2. Only the false present-tense disclosure is a Phase 2 gap — not the absent summary.
  - truth: "Live mailbox delivery to info@haoo.online is not proven."
    addressed_in: "Phase 5"
    evidence: >-
      LEAD-07 "Release verification proves the HAOO form endpoint is activated and a
      uniquely tagged production submission reaches the HAOO inbox or spam folder."
      COVERAGE row 20 opts activation out of this phase by design.
behavior_unverified_items:
  - truth: "SC5 — Legitimate keyboard and assistive-technology users can complete the form while a honeypot and provider-supported spam controls discourage automated submissions."
    test: >-
      Load /products/haoo/ at a 320px viewport and again at 200% browser zoom. Tab through
      every control from Full name to the submit button. Submit invalid to raise the error
      summary, then change the contact channel to WhatsApp to fire the interpolated live
      announcement.
    expected: >-
      No horizontal page overflow, no truncation or clipping of the collection notice, the
      inline messages, the error summary or the announcement text; every focus ring stays
      fully visible; all targets remain at least 44px; the off-screen honeypot never
      receives focus and never becomes visible.
    why_human: >-
      jsdom has no layout engine, so reflow, overflow, zoom and visible-focus geometry
      cannot be asserted programmatically. Recorded as COVERAGE entry D9 by the executors.
coincidental_reliance_items:
  - truth: "SC3 — A valid submission is addressed to info@haoo.online with a recognizable HAOO subject and human-readable field labels."
    reason: undeclared-precondition
    harden: >-
      The 'addressed to info@haoo.online' half is observable in-repo only because
      VITE_HAOO_FORM_ENDPOINT is unset, so QUALIFY_ENDPOINT resolves to the readable
      fallback. Once the token variable is set as 02-USER-SETUP.md instructs, the destination
      becomes /ajax/{token} and the token-to-mailbox mapping lives in FormSubmit's dashboard,
      outside this repository. Declare that precondition explicitly and let Phase 5 LEAD-07
      own proof of the configured-token path. The subject and label halves are unconditional
      and fully proven.
human_verification:
  - test: >-
      Decide the LEAD-02 routing-completeness question: a prospect whose role is outside the
      five options selects 'Other' and no free-text follow-up captures what they actually are.
    expected: >-
      Either accept the loss for v1 as an informational-audience trade-off, or add a
      conditionally-revealed 'Tell us your role' text field driven by the existing generic
      requiredWhen descriptor.
    why_human: >-
      A product/qualification-value judgment about which prospects deserve routing fidelity.
      Flagged by the 02-02 executor; no automated check can settle it.
  - test: >-
      Privacy/legal owner reviews the collection disclosure for third-party processor
      transparency (WR-02).
    expected: >-
      The pre-submission notice identifies FormSubmit as the delivery processor, links or
      states the applicable retention behavior, and states ZERO-PAPER HUB/HAOO's own
      retention and deletion policy.
    why_human: >-
      02-VALIDATION.md already records "Privacy/legal sign-off on the D-25 collection
      disclosure and Kenya DPA 2019 posture" as an unresolved owned release condition. The
      earlier copy approval did not cover processor identity or retention.
  - test: >-
      Confirm the judgment-tier prohibition verdicts recorded below (02-01 FAILED, 02-02 upheld).
    expected: "Human agrees with the verifier's reading of both prohibition statements."
    why_human: >-
      Both are declared verification:judgment with status:unverified in plan frontmatter.
      This run is autonomous, so the verdicts below are non-authoritative LLM-judge readings
      and are flagged rather than silently passed.
---

# Phase 2: Submit a Qualified HAOO Enquiry — Verification Report

**Phase Goal:** Interested prospects can voluntarily send HAOO the minimum structured details needed for useful human follow-up and recover clearly from validation or provider trouble.
**Verified:** 2026-08-30T12:58:37Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor can submit name, a usable contact method, role, organization, portfolio band, location and timeframe through clearly labelled controlled fields | ✓ VERIFIED | `haoo.ts:296-432` ships exactly ten fields in locked DOM order, grouped into three fieldsets (`haoo.ts:433-440`). `QualifyForm.tsx:renderControl` binds `value`+`onChange` on every control, `renderField` emits a real `<label htmlFor>` for each. Rendered at `ProductPage.tsx:198-207`. `qualify-data.test.ts` (41 tests) pins every option list byte-for-byte incl. all 47 counties + `Outside Kenya`. |
| 2 | Visitor can tell which fields are required, why details are collected, and that an engagement summary will accompany the submission | ✗ FAILED | Required-fields instruction (`QualifyForm.tsx:462`) and `(optional)` suffixes with no asterisks: correct. Purpose sentence: correct. **Third clause false** — `copy.ts:77` says a page-use summary "is included with your details" while `buildSubmissionBody` emits none, proven by the exact-key contract at `qualify-form.test.tsx:400` and the `engagement\|context\|analytics\|summary` key rejection at `:417-419`. |
| 3 | A valid submission is addressed to `info@haoo.online` with a recognizable HAOO subject and human-readable field labels | ✓ VERIFIED (coincidental-reliance) | `QUALIFY_ENDPOINT_FALLBACK = https://formsubmit.co/ajax/info@haoo.online`; `resolveQualifyEndpoint` hardened against ~25 malformed inputs (table at `qualify-data.test.ts:55-90`). Subject `New HAOO qualification enquiry — ZERO-PAPER HUB`. All ten `emailLabel` keys asserted individually at `qualify-form.test.tsx:400-415`. See `coincidental_reliance_items` for the unset-env precondition. |
| 4 | Visitor receives accessible validation, submitting, return, failure and retry guidance, and retains entered values after a recoverable client-side error | ✗ FAILED | Validation/submitting/failure/retry all genuinely present and tested. **Return state untruthful** (`copy.ts:67` claims delivery to the HAOO team from `response.ok` alone) and **one retention path loses data** (CR-04: inputs stay editable in flight while the body was snapshotted at fetch start). |
| 5 | Keyboard and AT users can complete the form while a honeypot and provider-supported spam controls discourage automated submissions | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Honeypot, `_captcha:'false'`, focus management, labels, `role=status`/`role=alert`, 44px targets are all present and wired; `QualifyForm.tsx` and `QualifyFallback.tsx` are registered in `FOCUS_SOURCES` and `GENERIC_PRODUCT_SOURCES`. The 320px / 200%-zoom reflow half has no layout engine under jsdom — routed to human (COVERAGE D9). |

**Score:** 2/5 truths verified (1 present, behavior-unverified; 2 failed)

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Engagement summary not attached to the submission | Phase 3 / Phase 4 | Phase 3 SC1 and Phase 4 SC2 both name the summary; D-26 scopes it out of Phase 2 deliberately |
| 2 | Live mailbox delivery unproven | Phase 5 | LEAD-07; COVERAGE row 20 opts activation out of this phase |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/products/types.ts` | Qualify type surface + disclosure shape | ✓ VERIFIED | 124 lines; consumed by `haoo.ts` and `QualifyForm.tsx` |
| `src/products/haoo.ts` | `qualify` with endpoint, subject, sourceNote, 10 fields, collectionNote | ✓ VERIFIED | 442 lines; option lists exported and data-tested |
| `src/components/QualifyForm.tsx` | Default export + `buildSubmissionBody`, `validateQualifyValues`, `isFieldRequired` | ⚠️ HOLLOW | All exports present and wired, but two rendered strings assert facts the code does not produce (CR-01, CR-02) |
| `src/components/QualifyFallback.tsx` | Product-generic retry/direct-contact panel | ✓ VERIFIED | 73 lines; retry + three exact Phase 1 contacts; in `FULL_BOUNDARY` |
| `src/products/copy.ts` | Distinct fallback / confirmation / disclosure builders | ✗ STUB-EQUIVALENT | Present and wired, but `qualifyConfirmationBody` and `qualifyCollectionNotePageContext` state untrue facts |
| `src/pages/ProductPage.tsx` | `section#qualify` between `#brochure` and `#onboarding` | ✓ VERIFIED | Line 198, `aria-label="Send your details"`, correct ordering |
| `src/vite-env.d.ts` | Optional `VITE_HAOO_FORM_ENDPOINT` | ✓ VERIFIED | Declared optional with obfuscation-not-secrecy doc |
| `.github/workflows/deploy.yml` | Injects the Actions variable at build | ✓ VERIFIED | Line 40 `vars.VITE_HAOO_FORM_ENDPOINT` on the Build step |
| `products/haoo/index.html` | noscript recovery panel | ✓ VERIFIED | Lines 23-47, form-specific heading + three contacts, no React dependency |
| `src/test/qualify-form.test.tsx` | End-to-end submission contract | ⚠️ ORPHANED-INTENT | 1469 lines, 34 tests, all passing — but `:31`, `:553`, `:562`, `:723` pin the defective copy, so the green suite actively protects CR-01/CR-02 |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `ProductPage.tsx` | `QualifyForm.tsx` | passes `product.qualify`/`contacts`/`name`, never the HAOO module | ✓ WIRED |
| `QualifyForm.tsx` | `qualify.endpoint` | single `fetch` POST, JSON, `Content-Type` set | ✓ WIRED |
| `haoo.ts qualify.fields` | field rendering | component iterates `groups`→`fields`, hard-codes no field name | ✓ WIRED |
| `QualifyField.emailLabel` | payload key | `buildSubmissionBody` uses `field.emailLabel` as key | ✓ WIRED |
| `preferredChannel` change | `isFieldRequired(phone)` | one `requiredWhen` seam feeds label/native/aria/validator/announcement | ⚠️ PARTIAL — WR-01: newly-invalid dependents are never *added* to the error map |
| `vars.VITE_HAOO_FORM_ENDPOINT` | `HAOO_PRODUCT.qualify.endpoint` | deploy.yml → Vite → `resolveQualifyEndpoint` | ✓ WIRED |
| `ProductHeader PRODUCT_LINKS` | `#qualify` | "Send details" at position 4 | ✓ WIRED |
| `OnboardingChoices` ×3 | `#qualify` | one anchor per instance | ✓ WIRED |
| `fetch response.ok` | terminal state + focus | `useEffect` on `state` focuses confirmation/failure heading | ✓ WIRED (but copy overclaims) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `QualifyForm` | `values` | `useState(seedValues)` ← controlled inputs | Yes | ✓ FLOWING |
| `QualifyForm` | request body | `buildSubmissionBody(values, qualify)` | Yes | ✓ FLOWING |
| `QualifyForm` | `errors` | `validateQualifyValues(values, qualify)` | Yes | ✓ FLOWING |
| `QualifyForm` | confirmation panel | `qualifyConfirmationBody` — static string asserting a delivery event never observed | No | ⚠️ STATIC (overclaims) |
| `QualifyForm` | collection notice | `qualify.collectionNote.pageContext` — static string describing a payload key that does not exist | No | ✗ DISCONNECTED |
| `QualifyForm` | in-flight edits | `setValue` writes state after the body snapshot | No | ✗ HOLLOW — discarded on success |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full suite | `npm run test:unit -- --run` | 8 files, 151/151 passed, 6.23s | ✓ PASS |
| Production build | `npm run build` | 1481 modules, exit 0, emits `dist/products/haoo/index.html` | ✓ PASS |
| Type safety | `npm run typecheck` | exit 0, no diagnostics | ✓ PASS |
| Lint | `npm run lint` | 0 errors, 4 known `react-refresh` warnings (logged in deferred-items.md) | ✓ PASS |
| CR-03 phone boundary | `node -e` on `^\+?[0-9 ()-]+$` | `()` ACCEPTED, `----` ACCEPTED, `-` ACCEPTED, `(())` ACCEPTED — all zero digits | ✗ FAIL |
| CR-01 delivery claim | `grep "We've sent" src/products/copy.ts` | present-tense delivery claim confirmed at line 67 | ✗ FAIL |
| CR-02 summary key | exact-key contract at `qualify-form.test.tsx:400,417` | payload provably carries no summary key | ✗ FAIL (contradicts the notice) |
| CR-04 in-flight edit test | `grep -n "readOnly\|inFlight" src/test/qualify-form.test.tsx` | no such test; `:786-796` covers repeat submission only | ✗ FAIL (absent coverage) |

### Probe Execution

No `scripts/*/tests/probe-*.sh` exist and no plan declares a probe. Not applicable.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| LEAD-01 | 02-01, 02-03, 02-04 | Name + at least one usable contact method | ✓ SATISFIED | Name required; email unconditionally required and format-validated; `noValidate` + custom accessible error path; empty-submit issues zero fetches |
| LEAD-02 | 02-02 | Role, organization, portfolio band, location, timeframe via controlled fields | ✓ SATISFIED | Five controlled selects/inputs, all option lists in product data and byte-tested. Human item open on `Other` routing completeness |
| LEAD-03 | 02-06 | Required fields, why collected, engagement context accompanies | ✗ BLOCKED | Required-fields + purpose correct; the "context accompanies" disclosure is false at submission time (CR-02) |
| LEAD-04 | 02-01, 02-03, 02-07 | Addressed to `info@haoo.online`, recognizable subject, readable labels | ✓ SATISFIED | Endpoint resolver table-tested; subject and all ten labels asserted; `_cc`/`_next`/`_autoresponse`/`_replyto` proven absent |
| LEAD-05 | 02-04, 02-05 | Validation, submitting, success, failure, retry without losing values | ✗ BLOCKED | Success guidance untruthful (CR-01); in-flight edits silently lost (CR-04) |
| LEAD-06 | 02-01, 02-03, 02-05, 02-07 | Honeypot + provider spam controls without an AT barrier | ? NEEDS HUMAN | Honeypot, `_captcha:false`, focus/label/live-region plumbing all verified; 320px / 200% reflow needs a human (COVERAGE D9) |
| LEAD-07 | — | Live delivery proof | — OUT OF SCOPE | Correctly mapped to Phase 5 in REQUIREMENTS.md:109. Not orphaned |

**Orphaned requirements:** none. Every ID REQUIREMENTS.md maps to Phase 2 (LEAD-01..06) is claimed by at least one plan.

**Traceability defect:** `REQUIREMENTS.md:27-32` already marks LEAD-01 through LEAD-06 `[x]` and the matrix at `:103-108` marks all six **Complete**. LEAD-03 and LEAD-05 are not complete. These checkboxes were flipped ahead of this verification gate and should be reverted to `[ ]` / Pending until the gaps close.

### Prohibition Verdicts

Both judgment-tier items are **non-authoritative LLM-judge verdicts** — flagged, never silently passed.

| Prohibition | Plan | Tier | Declared | Verdict | Basis |
|-------------|------|------|----------|---------|-------|
| Must NOT report a browser-observable send as a delivered email | 02-01 | judgment | unverified | 🛑 **VIOLATED** — flagged, `unverified-prohibition — human review recommended` | `copy.ts:67` asserts the recipient and promises a reply from `response.ok` alone; endpoint unactivated per 02-USER-SETUP.md; README.md:53 states delivery is unproven |
| Free-text message must NOT reach analytics, storage, or any engagement-summary payload | 02-02 | judgment | unverified | ✓ **UPHELD** — flagged, human review recommended | Exact-key contract confirms `Message` reaches only the email payload (`qualify-form.test.tsx:421-423` asserts the message value appears exactly once); no analytics or storage code exists yet; `build-output.test.ts` boundary forbids storage/analytics tokens in these files |
| Phase 2 must not emit an engagement-summary field or signal list | 02-06 | `automated` (treated as test-tier) | verified | ✓ **VERIFIED** — enforcement evidence exists | `qualify-form.test.tsx:400` exact-key equality plus `:417-419` regex rejection of `engagement\|context\|analytics\|identifier\|visitor\|score\|signal\|summary`. Does not fail closed. Schema note: `automated` is outside the documented `test\|judgment` vocabulary |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/products/copy.ts` | 67 | Copy asserts an event the code cannot observe | 🛑 Blocker | False success confirmation shown to real prospects while the endpoint is unactivated |
| `src/products/copy.ts` | 77 | Disclosure describes a payload key that does not exist | 🛑 Blocker | Materially false privacy statement at the point of consent |
| `src/components/QualifyForm.tsx` | 253-256, 295-326 | Mutable state after an immutable snapshot, with no guard | 🛑 Blocker | Silent lead-data loss confirmed as success |
| `src/products/haoo.ts` | 349 | Character-allowlist regex with no digit-count floor | ⚠️ Warning | `()`, `----`, `-` pass as phone numbers on a conditionally-required reachability field |
| `src/components/QualifyForm.tsx` | 283-287 | Asymmetric reconciliation loop (delete-only) | ⚠️ Warning | Error summary goes stale/incomplete when a controller change newly invalidates a dependent |
| `src/products/copy.ts` | 70-77 | Processor and retention undisclosed | ⚠️ Warning | Cross-origin transfer of identifiable prospect data with no processor named |
| — | — | No `TBD`/`FIXME`/`XXX` in any phase-modified file | ℹ️ Info | Debt-marker gate passes cleanly |

### Independent Assessment of 02-REVIEW.md

I re-derived each finding from the code rather than inheriting the reviewer's severity. **I agree with three of four BLOCKERs and downgrade one.**

- **CR-01 — UPHELD as BLOCKER.** Stronger than the review states. `02-USER-SETUP.md` status is *Incomplete* and COVERAGE row 20 opts activation out of this phase, so the endpoint is unactivated *right now*. FormSubmit answers an unactivated AJAX target with a 2xx, and COVERAGE row 21 deliberately forbids reading the body — so nothing in the system can distinguish "queued pending activation" from "delivered". Copy is the sole safeguard and it makes the maximal claim. `README.md:53` and the doc comment above `QUALIFY_STATUS_MESSAGES` both contradict the panel sitting beside them. Blocks SC4 and the 02-01 prohibition.

- **CR-02 — UPHELD as BLOCKER, with a root cause the review did not name.** The falseness is confirmed: the exact-key contract *proves* no summary key is sent. The root is not executor drift — **D-25 commissioned the present-tense wording** ("a coarse summary ... is sent along with their details") while **D-26 forbids sending it**. The executor faithfully implemented a contradictory pair of user decisions. Note the roadmap SC2 itself says "**will** accompany" — future tense — so the roadmap contract is satisfiable by a wording fix alone. This needs a user decision on D-25, not just a code edit.

- **CR-03 — DOWNGRADED to WARNING.** Reproduced independently: `()`, `----`, `-`, `(())` and single-digit `1` all pass. Real defect, genuinely untested (`qualify-form.test.tsx:1327-1334` covers letters only). But **email is unconditionally required and format-validated on every submission**, so SC1's "at least one usable contact method" and the phase goal's "useful human follow-up" survive intact; the hole degrades only the *preferred-channel* reachability guarantee and requires deliberate punctuation-only input. Fix it, but it does not block the phase goal.

- **CR-04 — UPHELD as BLOCKER.** Verified structurally and unambiguously: `disabled={state === 'submitting'}` appears only on the submit button (line 553-ish of the JSX); `renderControl` passes no `disabled`/`readOnly`; `setValue` has no `inFlightRef` guard; and `buildSubmissionBody(values, qualify)` reads the closure `values` captured when `submitValues` ran. A success then replaces the whole form. The compounding factor the review missed: the discarded edit is confirmed by copy that explicitly says "**the answers you gave**". No test exists — `:786-796` covers repeat submission only.

- **WR-01 — UPHELD as WARNING.** Confirmed at `QualifyForm.tsx:283-287`: the dependent loop deletes but never adds. Email→WhatsApp with phone blank, after a failed submit, flips `required`, `aria-required` and the label and fires the announcement, but adds no inline error, no `aria-invalid` and no summary row. Self-heals on the next submit and the field is visibly marked required, so WARNING is right.

- **WR-02 — UPHELD as WARNING, already a tracked release condition.** `02-VALIDATION.md:91` records "Privacy/legal sign-off on the D-25 collection disclosure and Kenya DPA 2019 posture" as an unresolved owned blocker. Routed to human verification rather than counted as a new gap.

**Cross-cutting observation the review did not make:** the 151/151 green suite is *not* evidence for the disputed truths. `qualify-form.test.tsx:31`, `:553`, `:562` and `:723` assert the exact defective strings, so the suite currently locks CR-01 and CR-02 in place. Any fix must change tests and code together.

### Human Verification Required

#### 1. LEAD-02 routing completeness — the `Other` role

**Test:** Decide whether a prospect outside the five role options losing their actual role is acceptable for v1.
**Expected:** Either an accepted trade-off (informational audiences per AGENTS.md § Audience), or a conditionally-revealed free-text role field using the existing generic `requiredWhen` descriptor.
**Why human:** Product-value judgment on qualification fidelity; no automated check can settle it.

#### 2. COVERAGE D9 — 320px / 200% zoom reflow

**Test:** At 320px width and at 200% zoom, tab the whole form, trigger the error summary, and switch channel to WhatsApp to fire the interpolated announcement.
**Expected:** No horizontal overflow, no truncation of the notice/inline errors/summary/announcement, focus rings fully visible, 44px targets held, honeypot never focusable or visible.
**Why human:** jsdom has no layout engine.

#### 3. Privacy/legal sign-off on the processor disclosure (WR-02)

**Test:** Privacy owner reviews the pre-submission notice for processor identity and retention.
**Expected:** FormSubmit named as the delivery processor, retention/privacy terms stated or linked, and HAOO's own retention/deletion policy stated.
**Why human:** Already an unresolved owned release condition at `02-VALIDATION.md:91`; the earlier copy approval did not cover processor or retention.

#### 4. Confirm the judgment-tier prohibition verdicts

**Test:** Review the two judgment-tier verdicts in the Prohibition Verdicts table.
**Expected:** Agreement that 02-01 is VIOLATED and 02-02 is UPHELD.
**Why human:** Both are `verification: judgment`, `status: unverified`. This is an autonomous run, so those verdicts are flagged, not authoritative.

### Gaps Summary

Phase 2 built the machinery well and then told the visitor two things that are not true.

The engineering is genuinely strong: ten controlled fields driven entirely from product data, a hardened endpoint resolver with a ~25-row rejection table, an exact-key payload contract that provably excludes `_cc`/`_next`/`_autoresponse`/`_replyto` and any summary key, a persistent live region deliberately mounted outside the replaceable form card, a synchronous `inFlightRef` concurrency guard, a real noscript path, and reuse/focus/boundary guards extended to both new components. Build, typecheck, lint and 151 tests are all clean. SC1 and SC3 are fully achieved.

Three defects block the goal, and they cluster on one root concern — **the page asserts things the code never observed**:

1. **The success panel claims mailbox delivery** (CR-01) from an HTTP 2xx, against the phase's own written prohibition, against `README.md`, and against the doc comment three lines above it. The endpoint is not yet activated, so this false confirmation is what a prospect would see today. The design's decision never to read the provider body is defensible *only* if the copy stays browser-observable — and it does not.

2. **The collection notice describes a payload that does not exist** (CR-02). This is the one gap whose root is upstream of the executor: D-25 asked for present-tense wording that D-26 forbids implementing. Because roadmap SC2 says "*will* accompany", a wording change satisfies the contract without waiting for Phase 3.

3. **Edits typed during a slow request are discarded and then confirmed as sent** (CR-04) — silent lead-data loss, made worse by copy that names "the answers you gave".

Two warnings should ride along with the fix: the phone validator accepts punctuation-only values (CR-03, downgraded from the review's BLOCKER because email is always required and validated), and the dependent-error reconciliation is delete-only so the error summary can go stale (WR-01).

One truth is present-but-unproven: the honeypot and AT plumbing are all wired, but 320px/200% reflow needs eyes on a browser.

Finally, `REQUIREMENTS.md` already marks LEAD-01..06 complete. Two of those are blocked — the checkboxes ran ahead of this gate and should be reverted until the gaps close.

**Recommended next step:** `/gsd-plan-phase --gaps` — the three gaps share one closure plan (make every terminal and pre-submission string report only what the code can observe, plus freeze in-flight edits), with the D-25 wording decision escalated to the user first.

---

_Verified: 2026-08-30T12:58:37Z_
_Verifier: Claude (gsd-verifier)_
