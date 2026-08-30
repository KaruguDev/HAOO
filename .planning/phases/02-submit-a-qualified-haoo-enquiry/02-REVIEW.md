---
phase: 02-submit-a-qualified-haoo-enquiry
reviewed: 2026-08-30T12:28:17Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - .github/workflows/deploy.yml
  - .gitignore
  - README.md
  - products/haoo/index.html
  - src/components/OnboardingChoices.tsx
  - src/components/ProductHeader.tsx
  - src/components/QualifyFallback.tsx
  - src/components/QualifyForm.tsx
  - src/pages/ProductPage.tsx
  - src/products/copy.ts
  - src/products/haoo.ts
  - src/products/types.ts
  - src/test/build-output.test.ts
  - src/test/focus-contrast.test.ts
  - src/test/haoo-page.test.tsx
  - src/test/product-shell-reuse.test.tsx
  - src/test/qualify-data.test.ts
  - src/test/qualify-form.test.tsx
  - src/vite-env.d.ts
findings:
  critical: 4
  warning: 2
  info: 0
  total: 6
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-08-30T12:28:17Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

The Phase 2 enquiry flow builds and all 151 tests pass, but the reviewed implementation still contains four shipping blockers: it claims provider acceptance means the HAOO team received the enquiry, publishes a collection statement that is false for the payload actually sent, accepts phone values with no digits, and can silently discard edits made while a slow request is in flight. Two additional defects weaken post-submit validation consistency and the privacy disclosure around the third-party processor.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: A 2xx provider response is presented as delivery to the HAOO team

**File:** `src/products/copy.ts:66-68` (triggered by `src/components/QualifyForm.tsx:314-326`)

**Issue:** The component enters `succeeded` from `response.ok` alone, then renders “We've sent ... to the HAOO team.” A 2xx response proves only that the browser request was accepted by FormSubmit; it does not prove mailbox delivery. The repository documents this exact limitation in `README.md:53`: activation and live delivery have not yet been verified. The Phase 2 plan also explicitly prohibits claiming mailbox delivery. A prospect can therefore see a false success confirmation while no HAOO recipient has received the lead.

**Fix:** Keep the confirmation strictly browser-observable until Phase 5 verifies delivery, for example:

```ts
export function qualifyConfirmationBody(productName: string) {
  requireIdentity(productName, 'name');
  return 'Your details were submitted successfully. Someone will reply within one business day.';
}
```

Also replace the “on their way” heading if it is intended to assert delivery rather than request acceptance. Add a regression assertion that neither terminal copy string contains `sent ... to`, `delivered`, or `received by` before live-delivery activation is complete.

### CR-02 [BLOCKER]: The collection notice promises a page-use summary that the request explicitly omits

**File:** `src/products/copy.ts:70-77` (contradicted by `src/components/QualifyForm.tsx:103-125`)

**Issue:** The notice says a short page-use summary “is included with your details,” but `buildSubmissionBody` sends only provider options, supplied form fields, and the fixed `Source` string. The tests at `src/test/qualify-form.test.tsx:400-423` explicitly reject any context/analytics/summary key, and the 02-06 summary confirms that Phase 2 sends no such value or placeholder. The notice is therefore materially false at the moment the visitor decides whether to submit. It also calls a future summary “anonymous” while saying it will be attached to a payload containing full name, email, and potentially phone; once associated with that payload it is linkable to an identified person and should not be represented as anonymous.

**Fix:** Remove the page-context sentence until the summary is implemented, or land the bounded summary and its disclosure atomically in the phase that owns measurement. When implemented, describe it as coarse/pseudonymous or non-identifying on its own, not anonymous when attached to identified contact details. Add a contract that derives the disclosure from the actual payload capabilities instead of pinning copy that contradicts the exact-key test.

### CR-03 [BLOCKER]: The phone validator accepts values with zero digits

**File:** `src/products/haoo.ts:340-356`

**Issue:** The configured pattern `^\\+?[0-9 ()-]+$` checks only which characters occur. Values such as `()`, `----`, and `( )` pass validation despite containing no telephone number. For visitors choosing WhatsApp or Phone call, this defeats the conditional-requiredness guarantee that the selected contact channel is reachable. Existing tests cover letters and common valid formats but omit the zero-digit boundary.

**Fix:** Require a defensible digit count in addition to the character allowlist. Prefer an explicit validator rule (for example, strip permitted punctuation and require 7–15 digits) over an opaque lookahead-only regex. Add table cases for `()`, `----`, one digit, the minimum accepted digit count, and excessive digits.

### CR-04 [BLOCKER]: Edits made during an in-flight request are silently discarded on success

**File:** `src/components/QualifyForm.tsx:253-256,295-326,339-390`

**Issue:** Only the submit button is disabled while `state === 'submitting'`; every input remains editable and `setValue` continues to update displayed state. The JSON body is snapshotted when `fetch` starts. If a slow request lets the visitor correct an answer afterward, a successful response replaces the whole form and confirms success even though the visible correction was never sent. This is silent lead-data loss, and the current concurrency tests exercise repeat submission only—not edits during the pending promise.

**Fix:** Freeze edits for the lifetime of the accepted request while keeping values readable. For example, block `setValue` when `inFlightRef.current` is true and render text controls read-only plus selects/textarea in a clearly announced non-editable state, or keep a submitted snapshot and do not replace the form when current values diverge from it. Add a pending-promise test that attempts to edit each control and proves the confirmation cannot discard unsent changes.

## Warnings

### WR-01 [WARNING]: Changing a controller can make a dependent field invalid without adding its error

**File:** `src/components/QualifyForm.tsx:272-289`

**Issue:** After the first submit attempt, `setValue` adds/replaces an error only for the field directly edited. For fields whose `requiredWhen.field` matches that field, the loop only deletes an error when the dependency becomes valid; it never adds `fresh[field.name]` when the dependency becomes newly invalid. For example, after an invalid attempt, changing preferred channel from Email to WhatsApp makes an empty phone required in the native attribute, label, and announcement, but leaves the inline error, `aria-invalid`, and error summary absent until the visitor submits again. The advertised “all surfaces change together” invariant is broken.

**Fix:** Synchronize every affected dependent in both directions:

```ts
for (const field of qualify.fields) {
  if (field.requiredWhen?.field !== name) continue;
  if (fresh[field.name]) next[field.name] = fresh[field.name];
  else delete next[field.name];
}
```

Add a test that starts after an invalid submit, changes Email to WhatsApp with phone blank, and checks the inline error, summary entry, `aria-invalid`, and reversal back to Email.

### WR-02 [WARNING]: The public disclosure does not identify the third-party processor or its storage behavior

**File:** `src/products/copy.ts:70-77` (processing boundary at `src/components/QualifyForm.tsx:314-322`)

**Issue:** The page tells visitors only how “we” use their details, then sends full contact and portfolio data cross-origin to FormSubmit. No reviewed public surface identifies FormSubmit as the processor, links to relevant privacy information, or states the applicable retention/storage behavior. FormSubmit's official documentation says submissions are retained for 30 days, while that fact appears nowhere in the visitor-facing disclosure. This is a material privacy-transparency gap for a form collecting identifiable prospect data.

**Fix:** Before submission, identify FormSubmit as the delivery processor, disclose or link to the applicable retention/privacy terms, and state ZERO-PAPER HUB/HAOO's own retention/deletion policy. Keep the notice concise, but provide a privacy link with the full processor, purpose, retention, and contact details. Verify the final wording with the appropriate privacy/legal owner rather than treating the earlier approval as covering retention or processor disclosures.

---

_Reviewed: 2026-08-30T12:28:17Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
