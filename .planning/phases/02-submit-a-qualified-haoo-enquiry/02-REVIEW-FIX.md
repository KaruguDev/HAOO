---
phase: 02-submit-a-qualified-haoo-enquiry
fixed_at: 2026-08-30T16:37:30Z
review_path: .planning/phases/02-submit-a-qualified-haoo-enquiry/02-REVIEW.md
iteration: 1
findings_in_scope: 17
fixed: 17
skipped: 0
status: all_fixed
---

# Phase 2: Code Review Fix Report

**Fixed at:** 2026-08-30T16:37:30Z
**Source review:** `.planning/phases/02-submit-a-qualified-haoo-enquiry/02-REVIEW.md`
**Iteration:** 1

**Summary:**

- Findings in scope: 17 (5 critical, 12 warning; `fix_scope: critical_warning`)
- Fixed: 17
- Skipped: 0

## Verification

**Where the gates ran:** every fix was applied and committed in an isolated git worktree
(`.claude/worktrees/rf-02-…`), which was then fast-forwarded into `main`. The worktree carries no
`node_modules` of its own, so `tsc`, `eslint`, `vite` and `vitest` were invoked from the main
checkout's `node_modules` while the working directory was the worktree — Node resolves upward into
the repository root, so the toolchain and its config are the project's own.

After the fast-forward the full gate was re-run **in the main checkout**, where it is reproducible:

| Gate | Command | Result |
|------|---------|--------|
| Typecheck | `npm run typecheck` | pass |
| Lint | `npm run lint` | pass (5 pre-existing `react-refresh/only-export-components` warnings, 0 errors) |
| Tests | `npm test` (build + `vitest run`) | **159 passed / 159**, 8 files |

Per-fix verification was Tier 2 throughout: re-read the edited region, then `tsc --noEmit -p
tsconfig.app.json` plus the affected `vitest` files before each commit. `deploy.yml` was validated by
parsing it as YAML and asserting the resulting step list; `.gitignore` was validated with
`git check-ignore` against each `.env.<mode>` filename.

Test count moved from 151 to 159: seven new contracts were added by these fixes, and one
(`build-output.test.ts`) that could not run in the worktree without a `dist/` was confirmed green in
the main checkout.

## Fixed Issues

### CR-01: A 2xx provider response is rendered as delivery to the HAOO team

**Files modified:** `src/products/copy.ts`, `src/test/qualify-form.test.tsx`
**Commit:** `3071fc1`
**Applied fix:** `qualifyConfirmationBody` no longer claims the payload reached a mailbox. It now
returns `"Your details were submitted. If you don't hear back within one business day, use one of the
contacts below."` — browser-observable, and the one-business-day sentence the product owner approved
at the `checkpoint:human-verify` (STATE.md, `02-05-SUMMARY.md`) is kept but reframed as the visitor's
fallback trigger rather than an unobservable promise. Added a negative assertion that the old
delivery claim cannot return.

### CR-02: The collection notice describes a page-use summary the request never sends

**Files modified:** `src/products/copy.ts`, `src/test/qualify-form.test.tsx`
**Commit:** `3845990`
**Applied fix:** `qualifyCollectionNotePageContext` moved to the future tense ("In future, a short
summary … will be included"), so the notice is true of what ships today and matches the roadmap's own
future-tense success criterion. The pinned `COLLECTION_CONTEXT` literal was updated with a comment
tying it to `EXPECTED_BODY_KEYS`, which is the proof the summary is not in the payload.

### CR-03: The phone-number format rule accepts values containing zero digits

**Files modified:** `src/products/haoo.ts`, `src/test/qualify-data.test.ts`, `src/test/qualify-form.test.tsx`
**Commit:** `2c4ccbc`
**Applied fix:** `formatPattern` is now `^(?=(?:[^0-9]*[0-9]){7,})\+?[0-9 ()-]+$`. Punctuation stays
permissive and nothing is normalised, but at least seven digits must appear. Rejection cases `-`,
`()`, `( )  -`, `+-` and the too-short `020 123` were added to both suites; all three previously
accepted Kenyan shapes still pass.

### CR-04: A stalled request deadlocks the form and the recovery panel never appears

**Files modified:** `src/components/QualifyForm.tsx`, `src/test/qualify-form.test.tsx`
**Commit:** `b5f006a`
**Applied fix:** Added exported `QUALIFY_REQUEST_TIMEOUT_MS = 15_000`, an `AbortController` passed as
`signal`, and `clearTimeout` in `finally`. An abort lands in the existing `catch`, so a stall now ends
in `failed` — the one state that mounts `QualifyFallback`. New test stubs a promise that only the
abort can settle, advances fake timers past the budget, and asserts the signal aborted, the failure
heading is focused, and the submit button is usable again.

### CR-05: Edits made during an in-flight request are silently discarded, then reported as sent

**Files modified:** `src/components/QualifyForm.tsx`, `src/test/qualify-form.test.tsx`
**Commit:** `7c1790c`
**Applied fix:** `renderControl`'s shared props carry `disabled: state === 'submitting'`, and
`controlClasses` gained `disabled:cursor-wait disabled:opacity-70` so the lock is visible. New test
asserts every control is editable before submit, locked during the request, and released again on a
terminal failure, with the in-flight payload unchanged.

### WR-01: `buildSubmissionBody` did not enforce the provider-option prohibition

**Files modified:** `src/components/QualifyForm.tsx`, `src/test/qualify-data.test.ts`, `src/test/qualify-form.test.tsx`
**Commit:** `f94db96`
**Applied fix:** Added exported `RESERVED_EMAIL_LABELS` (`_subject`, `_template`, `_captcha`,
`_honey`, `_cc`, `_next`, `_autoresponse`, `_replyto`, `Source`) and a throw in the field loop. This
closes all three silent-overwrite paths at once — the header-shaped options, the pre-seeded spam
controls, and the post-loop `Source` assignment. `qualify-data.test.ts` now asserts no configured
label is reserved; `qualify-form.test.tsx` proves a synthetic field claiming *each* reserved label
throws, and that the shipped product still builds.

### WR-02: `_captcha: 'false'` plus a world-readable endpoint leaves no effective spam control

**Files modified:** `README.md`
**Commit:** `65b590a`
**Applied fix:** The "Spam handling" section now states plainly that the honeypot and browser
validation live in the page, that anyone can post directly to the inlined endpoint with
`_captcha: 'false'` and an empty `_honey`, and that the honeypot pattern is widely fingerprinted. The
three acceptable remedies (re-enable reCAPTCHA / server-verified challenge / first-party function)
are recorded as an explicit prerequisite of Phase 5 `LEAD-07` activation rather than left implicit.
Documentation only — no code change was made to the spam posture in this phase.

### WR-03: Conditional-requiredness announcements were suppressed after a failed submit

**Files modified:** `src/components/QualifyForm.tsx`, `src/test/qualify-form.test.tsx`
**Commit:** `cf88f23`
**Applied fix:** `statusMessage` is now
`notice !== '' && state !== 'submitting' ? notice : QUALIFY_STATUS_MESSAGES[state]`, and `setNotice('')`
runs alongside `setState('submitting')` so the region never holds two messages. New test fails a send,
switches the channel to WhatsApp, and asserts the announcement is made with exactly one status
region — then that reversing the rule hands the region back to the terminal message.

### WR-04: A retry that fails validation left two contradictory error surfaces mounted

**Files modified:** `src/components/QualifyForm.tsx`, `src/test/qualify-form.test.tsx`
**Commit:** `976c72f`
**Applied fix:** The validation-blocked branch of `submitValues` now calls `setState('idle')` before
incrementing `attempts`, which unmounts the stale `QualifyFallback` and clears the stale status text.
New test fails a send, blanks a required field, clicks "Try sending again", and asserts the failure
heading is gone, exactly one alert remains, the status region is empty, focus is on the summary, and
no second request was issued.

### WR-05: Changing a controller field could create a required-but-empty error the summary omitted

**Files modified:** `src/components/QualifyForm.tsx`, `src/test/qualify-form.test.tsx`
**Commit:** `c13cee3`
**Applied fix:** The dependent-reconciliation loop now adds as well as deletes. New test makes the
summary authoritative with an invalid submit, switches the channel to WhatsApp with `phone` empty, and
asserts the summary grows the phone entry immediately (plus the inline error and `aria-invalid`), then
loses it again on reversal.

### WR-06: The collection notice never named the third-party processor

**Files modified:** `src/products/copy.ts`, `src/products/types.ts`, `src/products/haoo.ts`, `src/components/QualifyForm.tsx`, `src/test/qualify-form.test.tsx`
**Commit:** `5fcab64`
**Applied fix:** Added `qualifyCollectionNoteProcessor()`, a required `processor` field on
`QualifyCollectionNote`, wiring in `haoo.ts`, and a third paragraph in the rendered disclosure. The
sentence names FormSubmit as a third-party email-forwarding service and limits the retention claim to
this site ("This site does not store them anywhere else"), which is verifiable for a static bundle
with no backend; it deliberately makes **no** claim about FormSubmit's own retention.

### WR-07: Programmatically moved focus used `focus-visible:` rings

**Files modified:** `src/components/QualifyForm.tsx`, `src/components/QualifyFallback.tsx`, `src/test/focus-contrast.test.ts`
**Commit:** `e7596c5`
**Applied fix:** Added `scriptFocusClasses` (`focus:outline-none focus:ring-2 focus:ring-[#4054C6]
focus:ring-offset-2`) and applied it to the three `tabIndex={-1}` script-focus targets — the
confirmation heading, the error-summary container, and the fallback heading. Interactive controls keep
`focus-visible:`. `RING_COLOR_UTILITY` already matched both variants, so contrast is measured without
change; a new contract pins the *variant* as well, asserting the literal is present and used exactly
twice in `QualifyForm.tsx` and once in `QualifyFallback.tsx`.

### WR-08: `setValue` derived next state from a closed-over object

**Files modified:** `src/components/QualifyForm.tsx`
**Commit:** `f494c59`
**Applied fix:** Took the review's second option — a `valuesRef` holding the latest snapshot, written
synchronously before `setValues`. `setValue` composes on the ref, and `submitValues` now validates and
serialises from `valuesRef.current` too, so the request body cannot be built from a stale closure
either. Side effects were deliberately kept **out** of the state updater (the review's first option),
because React StrictMode double-invokes updaters and `setNotice`/`reconcileErrors` inside one would be
an impure updater.

**No regression test was added for this one.** Reproducing the batched multi-write path through
Testing Library is not possible: `fireEvent` dispatches a discrete event that React flushes
synchronously, so a candidate test passed against the unfixed code even when wrapped in `act()` and
`unstable_batchedUpdates`. That candidate was rolled back rather than committed as a vacuous test,
which is consistent with the suite's own stance ("a broken extractor must not pass a file vacuously").
The fix is covered indirectly by the existing payload contracts.

### WR-09: A product-generic component hardcoded global DOM ids

**Files modified:** `src/components/QualifyForm.tsx`, `src/pages/ProductPage.tsx`, `src/products/copy.ts`, `src/test/qualify-form.test.tsx`
**Commit:** `db3a3b8`
**Applied fix:** `QualifyForm` takes a `slug` prop; all ids now flow through
`qualifyId(slug, suffix)` → `${slug}-qualify-${suffix}`, covering field, error, help, honeypot and
collection-note ids. `requireIdentity` was exported from `copy.ts` so the id builder fails closed like
every other identity-bearing builder, matching the existing `contentAnchorId`/`mobileNavigationId`
pattern. `ProductPage` passes `product.slug`. All 25 id selectors in the suite were re-pointed
(`HAOO_PRODUCT.slug` for page-rendered forms, `zenith` for the four directly-rendered synthetic
forms). New test renders two forms with different slugs and asserts no duplicate id exists and that
every `label[for]` resolves inside its own `<form>`.

### WR-10: The deploy workflow shipped to production with no gate

**Files modified:** `.github/workflows/deploy.yml`
**Commit:** `4bcaeed`
**Applied fix:** `concurrency.cancel-in-progress` is now `false` so a live Pages publish is not
interrupted. Added Typecheck and Lint steps before Build, and a Test step after Build running
`npm run test:unit` — `test` would re-run `build` without `VITE_HAOO_FORM_ENDPOINT` and overwrite the
artifact about to be uploaded, and running after Build is what lets `build-output.test.ts` validate
the exact `dist/` that ships. Verified by parsing the YAML and asserting the resulting step order.

### WR-11: `.gitignore` did not cover the `.env` files Vite loads

**Files modified:** `.gitignore`
**Commit:** `ba1722e`
**Applied fix:** `.env` / `.env.*` / `!.env.example`. Verified with `git check-ignore` that `.env`,
`.env.production`, `.env.development`, `.env.staging`, `.env.local` and `.env.production.local` are all
ignored while `.env.example` is not.

### WR-12: The "no product-name literal" guard built a regex from unescaped data

**Files modified:** `src/test/product-shell-reuse.test.tsx`
**Commit:** `8f33708`
**Applied fix:** Added an `escapeRegExp` helper and applied it before compiling `productNamePattern`.
Added assertions proving the escape is load-bearing: `'Q.ai (Beta)+'` matches itself but not
`'Qxai (Beta)'`, and an escaped `'.*'` matches no arbitrary text — so a future product name cannot
silently widen the only enforcement of the reuse contract. `qualify-data.test.ts:558` was left alone;
the `formatPattern` it compiles is intentionally a pattern, not a literal.

## Follow-ups for human verification

These are not defects introduced by the fixes — they are decisions the fixes make that a human should
confirm before the phase advances:

1. **User-facing copy changed in three places** (CR-01 confirmation body, CR-02 collection notice,
   WR-06 processor sentence). `02-UI-SPEC.md:393` and `:402` still pin the *old* byte-for-byte strings,
   and `02-05-SUMMARY.md` records a product-owner checkpoint on the response-time sentence. The
   approved sentence is preserved in substance (conditional rather than promised), but the UI-SPEC and
   the phase summary now disagree with the shipped copy and need reconciling.
2. **WR-06 adds a new legal-adjacent disclosure.** The review asked for it to be reviewed with the
   same `checkpoint:human-verify` rigour the county names received. The wording deliberately avoids any
   claim about FormSubmit's own retention, but naming a processor in a privacy notice is a decision an
   agent should not finalise alone.
3. **WR-02 is documentation only.** The spam gap it describes is still open in code; one of the three
   recorded remedies has to be chosen before Phase 5 `LEAD-07` activation.
4. **WR-08 has no regression test** (see above). If the batched-write path matters enough to pin, it
   needs a seam that can be exercised without a synthetic DOM event.

---

_Fixed: 2026-08-30T16:37:30Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
