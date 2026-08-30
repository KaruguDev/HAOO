---
phase: 02-submit-a-qualified-haoo-enquiry
reviewed: 2026-08-30T15:40:00Z
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
  critical: 5
  warning: 12
  info: 0
  total: 17
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-08-30T15:40:00Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

The Phase 2 qualification flow is unusually disciplined in its data layer — the endpoint resolver, the closed option lists, and the pure validator/body-builder split are all well guarded by an extensive test suite. The defects are concentrated in three places the suite does not reach: **user-facing truth claims** (the page asserts mailbox delivery and describes a payload it does not send), **terminal-state handling** (a stalled request deadlocks the form with the recovery panel unreachable; a validation failure after a network failure leaves two contradictory error surfaces mounted), and **the reuse contract** (a component documented as product-generic hardcodes global DOM ids and enforces its `_cc`/`_replyto` prohibition only through HAOO's current data, not through code).

The dominant failure mode here is that the tests pin the *current* HAOO configuration byte-for-byte and are then read as proof of a *general* invariant. Several docstrings in `QualifyForm.tsx` make absolute claims ("never emitted under any condition", "reports what this page did, never what a mailbox received") that the code does not actually enforce.

Deployment is also entirely ungated: `deploy.yml` is the only workflow, and it runs neither `npm test`, `npm run lint`, nor `npm run typecheck` before publishing to production.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: A 2xx provider response is rendered as delivery to the HAOO team

**File:** `src/products/copy.ts:66-68`, triggered by `src/components/QualifyForm.tsx:314-326`

**Issue:** `submitValues` derives the terminal state from `response.ok` alone, then the success card renders:

> "We've sent your name, contact details, and the answers you gave to the **HAOO team**. Someone will reply **within one business day**."

A 2xx from `https://formsubmit.co/ajax/...` proves only that FormSubmit accepted the HTTP request. It does not prove the mail was delivered, and `README.md:51-53` documents that it currently is **not**: FormSubmit activation for `info@haoo.online` is deferred to Phase 5 / `LEAD-07`, and "until it is done, a submission that reports success in the browser has not been proven to reach the inbox." The same file's own docstring at `QualifyForm.tsx:28-32` states the opposite invariant — status text "reports what this page did, never what a mailbox received" — which `QUALIFY_STATUS_MESSAGES.succeeded` (`'Your details were sent.'`) honours and this confirmation body violates. The one-business-day reply is additionally an unconditional SLA the page cannot observe.

A prospect can therefore be told their enquiry reached HAOO and that a reply is coming, while no HAOO recipient ever received it and the prospect abandons the WhatsApp/phone paths they were offered.

**Fix:** Keep the confirmation strictly browser-observable, and make the reply expectation conditional rather than promised:

```ts
export function qualifyConfirmationBody(productName: string) {
  requireIdentity(productName, 'name');

  return "Your details were submitted. If you don't hear back within one business day, use one of the contacts below.";
}
```

Do not restore any delivery claim until Phase 5 `LEAD-07` has verified live delivery end to end.

---

### CR-02 [BLOCKER]: The collection notice describes a page-use summary that the request provably never sends

**File:** `src/products/copy.ts:74-78`; rendered via `src/products/haoo.ts:288-291` and `src/components/QualifyForm.tsx:529-537`

**Issue:** The privacy disclosure shipped above the submit button states, in the present tense:

> "When you send this form, a short summary of how you used this HAOO page **is included with your details**."

`buildSubmissionBody` (`QualifyForm.tsx:117-139`) emits exactly `_subject`, `_template`, `_captcha`, `_honey`, one key per non-empty supplied field, and `Source`. No page-use summary exists in this phase. The repository's own test asserts the *absence* of exactly that data: `qualify-form.test.tsx:385-421` pins `Object.keys(body).sort()` to a closed list and then rejects any key matching `/engagement|context|analytics?|identifier|visitor|score|signal|summary/i`. The disclosure and the test contradict each other, and the test is right.

A privacy notice that describes collection which does not occur is a factual defect in user-facing legal-adjacent copy, and it trains the visitor to disbelieve the rest of the notice. Note the roadmap success criterion uses the future tense ("**will** accompany the submission"), so no functional work is blocked by fixing the wording.

**Fix:** Move the sentence to future tense so it is true of what ships today, e.g. in `qualifyCollectionNotePageContext`:

```ts
return `In future, a short summary of how you used this ${name} page will be included with your details. It will be coarse and anonymous — it will never include your message text, exact portfolio numbers, or any identifier that follows you across sites.`;
```

Better still: remove the forward-looking clause entirely from Phase 2 and reintroduce it in Phase 3 alongside the payload it describes, so the notice and the payload land in the same commit and can be tested together.

---

### CR-03 [BLOCKER]: The phone-number format rule accepts values containing zero digits

**File:** `src/products/haoo.ts:349` (`formatPattern: '^\\+?[0-9 ()-]+$'`), consumed at `src/components/QualifyForm.tsx:184-193`

**Issue:** The character class `[0-9 ()-]` makes digits optional — one or more of *any* of space, `(`, `)`, `-` satisfies it. Every one of the following passes validation:

- `-`
- `()`
- `( )  -`
- `+-`

Because `requiredWhen` (`haoo.ts:352-357`) escalates `phone` to required precisely when the visitor picks **WhatsApp** or **Phone call**, this defeats the field's only purpose: a visitor who wants a callback can satisfy the "required" gate with `-`, the enquiry is accepted, and `body['Phone number']` reaches the inbox as `-`. The team then has a lead they selected a phone channel for and no number to call. The existing test (`qualify-form.test.tsx:1323-1349`) only checks well-formed acceptances and alphabetic rejections, so the gap is invisible to CI.

**Fix:** Require at least one digit while staying permissive about formatting:

```ts
formatPattern: '^(?=(?:[^0-9]*[0-9]){7,})\\+?[0-9 ()-]+$',
```

The lookahead demands at least seven digits (the shortest realistic Kenyan subscriber number) anywhere in the value, without rewriting or normalising what the visitor typed. Add rejection cases for `'-'`, `'()'` and `'+-'` to the phone-format test.

---

### CR-04 [BLOCKER]: A stalled request deadlocks the form permanently and the recovery panel never appears

**File:** `src/components/QualifyForm.tsx:295-332`, `539-546`, `551-558`

**Issue:** The `fetch` at line 315 has no `AbortSignal` and no timeout. `fetch` has no default timeout in any browser, so a request that never settles (captive portal, dropped mobile connection, provider hang) leaves:

- `inFlightRef.current === true` forever — the synchronous guard at line 296 rejects every subsequent submit
- `state === 'submitting'` forever — the submit button stays `disabled` with `cursor-wait` (line 541)
- `QualifyFallback` never mounted, because it renders only on `state === 'failed'` (line 551)

The failure state is the one path that offers the visitor WhatsApp, phone, and email recovery. On the exact network conditions those contacts exist for, the panel is unreachable and the form is a dead end with a spinner label. `finally` (line 329) cannot help — it does not run until the promise settles, which it never does. No test covers a non-settling promise; every fetch stub in `qualify-form.test.tsx` eventually resolves or rejects.

**Fix:** Bound the request and treat the timeout as a failure:

```ts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 15_000);

try {
  const response = await fetch(qualify.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(buildSubmissionBody(values, qualify)),
    signal: controller.signal,
  });

  setState(response.ok ? 'succeeded' : 'failed');
} catch {
  setState('failed');
} finally {
  clearTimeout(timeout);
  inFlightRef.current = false;
}
```

Add a test that stubs `fetch` with a never-settling promise, advances fake timers past the budget, and asserts the fallback heading is mounted and focused.

---

### CR-05 [BLOCKER]: Edits made during an in-flight request are silently discarded, then reported as sent

**File:** `src/components/QualifyForm.tsx:295-332`, `434-464`, `539-546`

**Issue:** Only the submit button is disabled while `state === 'submitting'` (line 541); every field control remains fully editable. The payload was already serialised from the `values` captured when `submitValues` was invoked (line 321). If the visitor corrects a typo — a misspelled email, a wrong county — during the request window, that edit:

1. is not in the request that is already in flight, and
2. is destroyed on success, because the whole form subtree is replaced by the confirmation card (line 436), and
3. is then covered by copy asserting "the answers you gave" were sent (`copy.ts:66-68`).

There is no second-submission path after success, so the corrected value is unrecoverable through the form. The window is short but this is precisely when a visitor re-reads their own answers.

**Fix:** Make the in-flight state visibly read-only so the discard cannot happen silently. Pass a disabled flag through `renderControl`:

```tsx
const locked = state === 'submitting';
// ...
const shared = {
  // ...
  disabled: locked,
} as const;
```

Wrapping the controls in a `<fieldset disabled={locked}>` achieves the same in one place. Add a test that changes a control between dispatching the submit and settling the stub, and asserts the control did not accept the change.

---

## Warnings

### WR-01 [WARNING]: `buildSubmissionBody` does not enforce the provider-option prohibition its docstring claims

**File:** `src/components/QualifyForm.tsx:111-139`; contract gap at `src/test/qualify-data.test.ts:192-210`

**Issue:** The docstring states that `_cc`, `_next`, `_autoresponse` and `_replyto` "are never emitted **under any condition**". That is false as written — it is true only of HAOO's current field data. The loop at line 128 writes `body[field.emailLabel] = value` with no key filtering, so a product definition declaring `emailLabel: '_cc'` would place a **visitor-supplied** value into FormSubmit's carbon-copy option, letting any visitor redirect a copy of the enquiry to an arbitrary mailbox. `_replyto` would allow the same for the reply header. This is exactly the header-shaped-option risk the docstring says is closed.

There are two related silent-overwrite bugs in the same function:

- `body.Source = qualify.sourceNote` is assigned **after** the field loop (line 136), so a field with `emailLabel: 'Source'` has its visitor answer silently destroyed.
- The provider options are seeded **before** the loop (lines 121-126), so a field with `emailLabel: '_captcha'` or `'_honey'` silently overrides the spam controls.

`qualify-data.test.ts:206-209` only checks that email labels are unique **against each other**; it never checks them against the reserved key set. Since `QualifyForm` is explicitly designed for reuse by future products (`product-shell-reuse.test.tsx`), the guard belongs in code.

**Fix:** Enforce the denylist inside the function and fail loudly:

```ts
const RESERVED_KEYS = new Set([
  '_subject', '_template', '_captcha', '_honey',
  '_cc', '_next', '_autoresponse', '_replyto', 'Source',
]);

for (const field of qualify.fields) {
  if (RESERVED_KEYS.has(field.emailLabel)) {
    throw new Error(`Field "${field.name}" uses reserved email label "${field.emailLabel}"`);
  }
  // ...
}
```

Add a `qualify-data.test.ts` case asserting no configured `emailLabel` is in `RESERVED_KEYS`, and a `buildSubmissionBody` case proving a synthetic `_cc`-labelled field throws rather than emitting.

---

### WR-02 [WARNING]: `_captcha: 'false'` plus a world-readable endpoint leaves no effective spam control

**File:** `src/components/QualifyForm.tsx:124`; documented at `README.md:55-57`

**Issue:** `_captcha: 'false'` is sent in the request body, so FormSubmit's reCAPTCHA is disabled **per request**, by a flag the client controls. The endpoint itself is inlined by Vite into the published bundle (`vite-env.d.ts:3-16` acknowledges this). The combination means anyone can `curl` the endpoint directly with `_captcha: 'false'` and `_honey: ''` and flood `info@haoo.online`.

The honeypot (`QualifyForm.tsx:474-488`) and the browser validation only affect submissions that go *through the page*. `README.md:57` presents them as the compensating control for the disabled reCAPTCHA — "The form carries an off-screen honeypot field and browser validation" — which overstates their reach: neither is present in the threat path that matters. The honeypot's field name (`_honey`) and the fixed `-left-[10000px]` offset are also the most widely fingerprinted honeypot pattern there is.

**Fix:** Two parts. (1) Correct `README.md:55-57` so it states plainly that the honeypot deters naive page-scraping bots only and provides no protection against direct posts to the public endpoint. (2) Before Phase 5 activation, either re-enable `_captcha` for this form, or front the submission with a challenge the server verifies (Cloudflare Turnstile or an equivalent), or move submission to a first-party function that holds the provider address server-side. Track the chosen option as an explicit deferred item rather than leaving the gap implicit.

---

### WR-03 [WARNING]: Conditional-requiredness announcements are permanently suppressed after a failed submit

**File:** `src/components/QualifyForm.tsx:432`, `560-565`

**Issue:**

```ts
const statusMessage = state === 'idle' ? notice : QUALIFY_STATUS_MESSAGES[state];
```

`state` never returns to `'idle'` once a submission has been attempted. After a provider failure the form stays mounted and fully editable, but every `notice` computed by `setValue` (line 262) is discarded by this ternary. A visitor who switches **Preferred contact channel** from Email to WhatsApp after a failed send makes `phone` required in the attribute, in `aria-required`, in the label suffix, and in the validator — and the sentence "A phone number is now required because you asked us to reach you by WhatsApp." is generated and then thrown away. The docstring at lines 258-261 explains that attribute flips on an unfocused control are not announced by assistive technology and that "the sentence is the announcement"; in the failed state there is no announcement at all.

Meanwhile the region keeps repeating "We couldn't send your details." indefinitely, long after the visitor has moved on to editing.

**Fix:** Give the notice precedence over a stale terminal message, or clear the terminal state when editing resumes. The smaller change:

```ts
const statusMessage =
  notice !== '' && state !== 'submitting' ? notice : QUALIFY_STATUS_MESSAGES[state];
```

and clear `notice` when a submission starts (`setNotice('')` alongside `setState('submitting')`), so the region never holds two messages. Extend the "makes phone required in every surface" test to run after a failed submission, not only from idle.

---

### WR-04 [WARNING]: A retry that fails validation leaves two contradictory error surfaces mounted

**File:** `src/components/QualifyForm.tsx:295-309`, `490-514`, `551-558`

**Issue:** `submitValues` returns early on validation errors (line 308) **without resetting `state`**. Reached through the "Try sending again" button (line 555) while `state === 'failed'`, this produces:

- the network-failure panel still mounted, headed "We couldn't send your details"
- the validation summary now also mounted, headed "There is a problem"
- the status region still reading "We couldn't send your details." — describing a send that was never attempted
- focus yanked to the summary by the `attempts` effect (line 242), away from the retry button the visitor just pressed

The visitor is shown a transport failure and a validation failure simultaneously, only one of which is real. This is reachable in normal use because the form remains editable in the failed state.

**Fix:** Return to a neutral state whenever a submission is blocked by validation:

```ts
if (Object.keys(nextErrors).length > 0) {
  setState('idle');
  setAttempts((previous) => previous + 1);

  return;
}
```

This unmounts the stale fallback, clears the stale status text, and leaves the summary as the single reported problem. Add a test: fail a send, blank a required field, click "Try sending again", and assert the fallback heading is gone and the summary is the only alert.

---

### WR-05 [WARNING]: Changing a controller field can create a required-but-empty error that the summary omits

**File:** `src/components/QualifyForm.tsx:274-292`

**Issue:** After the first submit attempt the summary is presented as the authoritative problem list. When the visitor changes **Preferred contact channel** from `Email` to `WhatsApp` while `phone` is empty, `fresh['phone']` correctly holds the required message, but the reconciliation only ever *deletes* dependent errors:

```ts
for (const field of qualify.fields) {
  if (field.requiredWhen?.field === name && !fresh[field.name]) {
    delete next[field.name];
  }
}
```

There is no corresponding add branch, so `errors.phone` is never set and the displayed "There is a problem" list silently under-reports. The visitor fixes everything the summary names, presses submit, and the summary grows a new entry — the classic error-whack-a-mole pattern the summary exists to prevent.

**Fix:** Reconcile dependents in both directions:

```ts
for (const field of qualify.fields) {
  if (field.requiredWhen?.field !== name) {
    continue;
  }

  if (fresh[field.name]) {
    next[field.name] = fresh[field.name];
  } else {
    delete next[field.name];
  }
}
```

If deliberately *not* complaining about an untouched field is the intent, that intent needs to be stated in the docstring and the summary heading needs to stop implying completeness.

---

### WR-06 [WARNING]: The collection notice never names the third-party processor the data is sent to

**File:** `src/products/copy.ts:70-78`

**Issue:** The notice covers purpose ("only to reply to you about HAOO onboarding") and non-sale, but never states that the submission is transmitted directly from the visitor's browser to **FormSubmit**, a third-party service that receives and relays the full payload — name, email, phone, organisation, county, and free-text message. From the visitor's position the data appears to go to HAOO. Kenya's Data Protection Act 2019 transparency obligations, like the GDPR analogue, expect processors and recipients to be identified at the point of collection.

**Fix:** Add one sentence naming the processor and the retention position, and get it reviewed with the same `checkpoint:human-verify` rigour the county names received:

```ts
export function qualifyCollectionNoteProcessor() {
  return 'Your details are sent through FormSubmit, an email-forwarding service, and delivered to our inbox. We do not store them anywhere else on this site.';
}
```

Only ship a retention claim that has been verified against FormSubmit's actual behaviour.

---

### WR-07 [WARNING]: Programmatically moved focus uses `focus-visible:` rings, so pointer users get no visible indicator

**File:** `src/components/QualifyForm.tsx:441`, `494`; `src/components/QualifyFallback.tsx:29-35`; measured by `src/test/focus-contrast.test.ts:212-236`

**Issue:** All three programmatic focus targets — the confirmation heading, the failure heading, and the error-summary container — are `tabIndex={-1}` elements styled exclusively with `focusClasses`, which is entirely `focus-visible:` utilities. `:focus-visible` is a UA heuristic: after a **mouse click** on the submit button, browsers generally do not consider a subsequently script-focused non-input element as needing a visible indicator, so no ring is painted. Focus has moved somewhere the visitor cannot see, which is a WCAG 2.4.7 (Focus Visible) failure on the exact three moments the design chose to move focus.

`focus-contrast.test.ts` reads these `focus-visible:ring-*` class strings and verifies their contrast ratio, so the suite reports these indicators as compliant while measuring styles that will not apply on the pointer path. That is false assurance rather than a gap.

**Fix:** Use plain `focus:` utilities on the script-focused targets, which apply regardless of input modality:

```ts
const scriptFocusClasses =
  'focus:outline-none focus:ring-2 focus:ring-[#4054C6] focus:ring-offset-2';
```

Apply it to `confirmationRef`, `summaryRef` and the `QualifyFallback` heading, keep `focus-visible:` for genuinely interactive controls, and widen the `RING_COLOR_UTILITY` regex in `focus-contrast.test.ts` so the new `focus:` pairs are measured too.

---

### WR-08 [WARNING]: `setValue` derives next state from a closed-over object instead of the functional updater

**File:** `src/components/QualifyForm.tsx:253-256`

**Issue:**

```ts
function setValue(name: string, value: string) {
  const nextValues = { ...values, [name]: value };

  setValues(nextValues);
```

`values` is read from the render closure. Under React 18 automatic batching, any path that fires more than one `setValue` before a re-render — browser autofill populating name/email/phone/organisation from a saved profile, a password-manager fill, a programmatic multi-field fill — has every handler spread the same stale snapshot, and only the last write survives in state. The DOM shows all four values (they are set on the elements directly); `values` holds one. Validation catches the loss for *required* fields, but `organization`, `phone` and `message` are optional: `buildSubmissionBody` skips empty values (line 131), so the answer is dropped from the email with no error anywhere.

The fields carry `autoComplete: 'name' | 'email' | 'tel' | 'organization'` (`haoo.ts:304, 316, 347, 379`), so autofill is an expected path, not a hypothetical one.

**Fix:** Use the functional updater and derive the dependent work from the same committed snapshot:

```ts
function setValue(name: string, value: string) {
  setValues((previous) => {
    const nextValues = { ...previous, [name]: value };

    setNotice(requirednessAnnouncement(qualify, name, nextValues));

    if (submitted) {
      reconcileErrors(name, validateQualifyValues(nextValues, qualify));
    }

    return nextValues;
  });
}
```

If keeping the side effects out of the updater is preferred, hold the latest values in a ref and read the ref rather than the closure.

---

### WR-09 [WARNING]: A product-generic component hardcodes global DOM ids

**File:** `src/components/QualifyForm.tsx:42`, `49-59`, `478-487`

**Issue:** `COLLECTION_NOTE_ID = 'qualify-collection-note'`, `id="qualify-website"` on the honeypot, and `fieldId`/`errorId`/`helpId` all produce ids derived from the field name with no product namespace. `ProductHeader`/`ProductPage` namespace their ids correctly via `mobileNavigationId(slug)` and `contentAnchorId(slug)` (`copy.ts:112-118`), so this component is the odd one out.

The component is explicitly built for reuse — `product-shell-reuse.test.tsx` renders it under a synthetic `ZENITH` product to prove it carries no HAOO knowledge. The moment two product forms coexist on one page (a comparison page, a combined landing page), every `id` collides: `label[for=...]` binds to the first match, `aria-describedby` on the second form's submit button points at the first form's notice, and the error-summary links (`href="#qualify-name"`) jump the visitor to the wrong form's control.

**Fix:** Thread the slug through the id builders, matching the existing pattern in `copy.ts`:

```ts
function fieldId(slug: string, field: QualifyField) {
  return `${requireIdentity(slug, 'slug')}-qualify-${field.name}`;
}
```

Pass `product.slug` into `QualifyForm` from `ProductPage`. Add a test rendering two `QualifyForm`s with different slugs and asserting `document.querySelectorAll('[id]')` contains no duplicate id.

---

### WR-10 [WARNING]: The deploy workflow ships to production with no test, lint, or typecheck gate

**File:** `.github/workflows/deploy.yml:13-15`, `35-41`

**Issue:** `deploy.yml` is the repository's only workflow. It runs `npm ci` then `npm run build` and publishes to GitHub Pages on every push to `main`. `package.json` defines `test`, `lint` and `typecheck` scripts, and the repository contains ~150 tests that encode the invariants this phase depends on — the endpoint allowlist table, the closed county list pinned by codepoint, the exact payload key set, the focus-contrast gate, and `build-output.test.ts`, which validates the artifact that is about to be uploaded. None of them run before deployment. A commit that breaks the endpoint resolver, corrupts a county name, or reintroduces a forbidden payload key deploys to production and is discovered only if a developer happens to run the suite locally.

Separately, `concurrency.cancel-in-progress: true` on the `pages` group will cancel an **in-progress production deployment** when a new push arrives. GitHub's own Pages deployment guidance uses `cancel-in-progress: false` for the deployment group specifically so a live publish is not interrupted mid-flight.

**Fix:**

```yaml
concurrency:
  group: pages
  cancel-in-progress: false

# ...
      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Build
        env:
          VITE_HAOO_FORM_ENDPOINT: ${{ vars.VITE_HAOO_FORM_ENDPOINT }}
        run: npm run build

      - name: Test
        run: npm run test:unit
```

`test:unit` (not `test`) is the right script here because `test` re-runs `build` and would discard the endpoint-configured artifact produced by the Build step.

---

### WR-11 [WARNING]: `.gitignore` does not cover the `.env` files Vite actually loads

**File:** `.gitignore:12`, `:23`

**Issue:** The file ignores `.env` and `*.local` (which covers `.env.local` and `.env.production.local`), but **not** `.env.production`, `.env.development`, or `.env.staging` — all of which Vite loads by mode and all of which are the natural place a developer would put `VITE_HAOO_FORM_ENDPOINT` while testing the deploy configuration locally. `README.md:49` states the value "must never be committed in a `.env` file", but the ignore rules do not enforce the instruction for the filenames most likely to be used. Anything else that ends up alongside it in such a file — a real secret, not just this obfuscation token — is committed silently.

**Fix:**

```gitignore
.env
.env.*
!.env.example
```

---

### WR-12 [WARNING]: The "no product-name literal" guard builds a regex from unescaped data

**File:** `src/test/product-shell-reuse.test.tsx:217-223`

**Issue:**

```ts
const productName = PRODUCTS[0].name;
const productNamePattern = new RegExp(productName, 'i');
```

The product name is interpolated into a regex without escaping. `'HAOO'` is inert today, but the constraint is undocumented and unenforced. A future product named `Zero+`, `Q.ai` or `Flow (Beta)` either throws at test time (`Invalid regular expression`) or, worse, silently changes the guard's meaning — `Q.ai` matches `Qxai`, and a name containing `.*` would match every file and pass vacuously. This is the test that proves the product shell contains no product-specific literals, so a silently weakened version removes the only enforcement of the reuse contract.

**Fix:** Escape the literal before compiling:

```ts
const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const productNamePattern = new RegExp(escaped, 'i');
```

The same treatment applies to any other test that compiles product data into a pattern.

---

_Reviewed: 2026-08-30T15:40:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
