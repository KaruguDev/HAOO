# 05 Evidence — Qualification Form States (QUAL-02, form half)

**Instrument:** `e2e/form-states.e2e.ts`, `npx playwright test --project=preview` and
`--project=live`, Chromium (Playwright 1.63.0, `devices['Desktop Chrome']`), viewport 1280 × 1024
for every state reading and 360 × 740 for the held-out option-label measurements.

**Subjects and the builds they served:**

| Target | URL | Build served | How the build is identified |
|---|---|---|---|
| **S1 — live** | `https://www.haoo.online/` | `/assets/haoo-D1dl6F2P.js` | Deployed by GitHub Actions run `34687312104` at 2026-09-12 10:01:45Z, after `main` was pushed `f957fd9` → `c39cc5a` on the owner's authorisation. Every live record below is timestamped after that deploy, and the page was re-read at 19:14Z still serving `haoo-D1dl6F2P.js`. |
| **S5 — preview** | `http://localhost:4173/` | `dist/assets/haoo-Ba5CCAcE.js` | A local `vite build` written 2026-09-12 10:47:15Z, served by `npm run preview`. No file under `src/` has changed since `2d9c33b` (2026-09-07), so it is built from the same source tree `c39cc5a` carries. The two bundle hashes differ; this file does not attribute the difference and makes no claim that the two bundles are byte-identical. |

This is the POST-DEPLOY build (`c39cc5a`), not the `f957fd9` build plans 05-07, 05-08 and 05-09
measured. No figure here may be compared with one of theirs without naming both builds.

**Runs recorded:**

| Run | Window (UTC, 2026-09-12) | What it covered |
|---|---|---|
| A | 11:03:29 – 11:06:28 | The Task 1 and Task 2 readings (preview 11:03–11:04, live 11:04), a second live run of the same tests (11:05–11:06), and the first option-label record (11:06:28). |
| B | 19:12:36 – 19:14:32 | The Task 3 run on both projects, after four integer status-region readings were added to the invalid and in-flight records. This is the run the tables below cite. |
| C | 19:17:36 – 19:19:21 | Task 3's `<verify>` chain run as written, after this file existed: both projects, then the two greps. It re-recorded the same 18 records. |

**Run-to-run comparison, measured rather than assumed.** Every run-B record was compared by value
with the latest run-A record for the same surface, contract and target, ignoring `recordedAt`.
Across 18 records in 5 files, **0** readings differ. Run B adds four keys that run A did not take
(`statusRegionsInDocument` and `submissionStatusRegions` on the invalid and in-flight records),
and those are reported in § 5 as readings from runs B and C only. Run C was compared with run B the same
way: **0** of its 18 records differ. The two live run-A executions also match each
other by value. No Task 1 or Task 2 measurement changed between the commits that recorded them
(`5fc0747`, `5b4aa8e`) and this file.

**Raw records:** `evidence/form-states.json` (per state), `evidence/form-states-focus.json` (KF-5
rows 1–4), `evidence/form-states-requests.json` (request counts), `evidence/form-states-status-region.json`
(FS-2 timeline), `evidence/form-states-option-labels.json` (the held-out inputs).

**No submission reached the provider from this plan.** `formsubmit.co` is routed on every target
and every request is fulfilled or aborted inside the browser. On live, the provider attempt count is
`0` in the idle, invalid, conditional-requirement and option-label records. On preview, the four
induced states issued `1` (in-flight), `1` (success), `1` (transport failure) and `0` (blocked)
requests, each answered by the route, none by the network. No failure or terminal state was induced
on live: those tests are skipped on the `live` project by a `testInfo.project.name` guard, and the
live runs above list them as skipped.

---

## 1. Per-state table

One row per state. Every cell is what the run captured.

| State | Exercised on | Submit control: state and label | Status-region text as rendered | Focus destination as captured | Control-disabled observation |
|---|---|---|---|---|---|
| **idle** | preview S5 and live S1 | enabled, `Send my details` | `` (empty); reserved `min-height: 24px` | no transition made | submit enabled; no field-disabled reading is taken in this state |
| **invalid** | preview S5 and live S1 | enabled, `Send my details` | `` (empty) | `DIV tabindex=-1` wrapping `role="alert"` — the error-summary container | submit enabled; 7 of 7 required controls carry `aria-invalid` and an `aria-describedby` naming their own error element |
| **in-flight** | preview S5 only | disabled, `Sending…` | `Sending your details…` | no focus move; the in-flight state moves none | 10 of 10 field controls disabled; the honeypot input not disabled (observation FS-O2, § 7) |
| **success** | preview S5 only | absent — the form subtree was replaced by the confirmation card; `0` form elements remain | `Your details were sent.` | `H3 tabindex=-1` "Your details are on their way" | not applicable; no control remains |
| **transport failure** | preview S5 only | enabled, `Send my details` | `We couldn't send your details.` | `H3 tabindex=-1` "We couldn't send your details" | `1` form element still mounted; values read back in § 4; `1` retry control rendered |
| **blocked** | preview S5 only | enabled, `Send my details` | `We couldn't send your details.` | `H3 tabindex=-1` "We couldn't send your details" | `1` form element still mounted; values read back in § 4; `0` retry controls rendered |

**How each preview state was induced.** In-flight: the endpoint routed to a response delayed
4000 ms. Success: the endpoint routed to a fulfilled response. Transport failure: the endpoint
routed to an aborted response. Blocked: `JSON.stringify` patched in the browser to throw for the
submission body only, so the page cannot assemble a request and issues none.

### 1a. Readings behind the rows

**Idle — the honeypot**, identical on both targets:

| Property | Reading |
|---|---|
| `tabindex` attribute | `-1` |
| `tabIndex` property | `-1` |
| nearest `aria-hidden` ancestor | `DIV` |
| bounding box | `left: -9967`, `right: -9733` (CSS px) |
| nodes found in the accessibility tree | `0` |
| required-fields lead text elements found | `1` |
| error summaries found | `0` |

**Invalid — the error summary**, identical on both targets. Heading: `There is a problem`.

| # | Summary link text | `href` | Control's error text (with its screen-reader prefix) |
|---|---|---|---|
| 1 | Enter your full name | `#haoo-qualify-name` | `Error: Enter your full name` |
| 2 | Enter your email address | `#haoo-qualify-email` | `Error: Enter your email address` |
| 3 | Select how we should reach you | `#haoo-qualify-preferredChannel` | `Error: Select how we should reach you` |
| 4 | Select your role | `#haoo-qualify-role` | `Error: Select your role` |
| 5 | Select how many units you manage | `#haoo-qualify-portfolioBand` | `Error: Select how many units you manage` |
| 6 | Select where your properties are | `#haoo-qualify-county` | `Error: Select where your properties are` |
| 7 | Select when you would like to start | `#haoo-qualify-timeframe` | `Error: Select when you would like to start` |

Each control's `aria-describedby` reads `<control id>-error`, for example `haoo-qualify-name-error`.

**Invalid — the conditional phone requirement**, identical on both targets. The triggering
selection was `WhatsApp` in the preferred-channel select.

| Moment | Native `required` | `aria-required` | Derived label |
|---|---|---|---|
| before selection | absent | reads not-required | `Phone number (optional)` |
| after selecting `WhatsApp` | present | reads required | `Phone number` |
| after reverting the selection | absent | reads not-required | `Phone number (optional)` |

The raw `aria-required` attribute strings are in the record, `evidence/form-states.json`, under
`beforeSelection`, `afterSelection` and `afterReversal`.

The announcement on selection read `A phone number is now required because you asked us to reach
you by WhatsApp.` A separators-only value `+()- ()-` produced the message
`Error: Enter a phone number using digits, spaces, or +`.

**Success — the confirmation card:**

| Element | Reading |
|---|---|
| heading | `Your details are on their way` |
| body | `Your details were submitted. If you don't hear back within one business day, use one of the contacts below.` |
| follow-up prompt | `Need an answer sooner?` |
| links (2) | `https://wa.me/254702188044?text=Hello%20HAOO%2C%20I%20would%20like%20help%20choosing%20the%20best%20way%20to%20get%20started.` · `tel:+254702188044` |

**Transport failure and blocked — the fallback panel:**

| Element | Transport failure | Blocked |
|---|---|---|
| heading | `We couldn't send your details` | `We couldn't send your details` |
| body | `Something went wrong between this page and our email provider. Your answers are still here, so you can try again — or reach HAOO directly.` | `This page couldn't prepare your details for sending, so nothing was sent. Your answers are still here — please reach HAOO directly.` |
| retry controls | `1` | `0` |
| direct-contact links (3) | `https://wa.me/254702188044?text=…` · `tel:+254702188044` · `mailto:info@haoo.online` | same three |
| requests issued | `1` | `0` |

**Scripted-focus indicator.** On the four script-focus destinations measured here (the error-summary
container on both targets, and the confirmation and fallback headings on preview), the computed style
read the same before and after the scripted focus:

| | `outline-style` | `outline-width` | `outline-color` | `box-shadow` |
|---|---|---|---|---|
| before focus | `none` | `3px` | `rgb(24, 39, 95)` | `none` |
| after focus | `solid` | `2px` | `rgba(0, 0, 0, 0)` | `rgb(255, 255, 255) 0 0 0 2px, rgb(64, 84, 198) 0 0 0 4px` |

Two box-shadow layers are added by the focus. The outline after focus is transparent, so the visible
indicator is the shadow ring, not the outline.

---

## 2. Focus matrix (KF-5)

One row per transition, with the active element captured after it.

| Row | Transition | Target(s) | Transitions observed | Active element after the transition |
|---|---|---|---|---|
| KF5-1 | invalid submit | preview, live | 1 per target | `DIV tabindex=-1`, the error-summary container wrapping `role="alert"` |
| KF5-2 | repeat invalid submit, errors unchanged | preview, live | 1 per target | `DIV tabindex=-1`, the same error-summary container |
| KF5-3 | correcting a field while typing | preview, live | 1 per target | `INPUT#haoo-qualify-name`, the control being typed in |
| KF5-4 | activating a summary item link | preview, live | 7 per target | in link order: `INPUT#haoo-qualify-name`, `INPUT#haoo-qualify-email`, `SELECT#haoo-qualify-preferredChannel`, `SELECT#haoo-qualify-role`, `SELECT#haoo-qualify-portfolioBand`, `SELECT#haoo-qualify-county`, `SELECT#haoo-qualify-timeframe` — each the id its link's `href` names |
| KF5-5 | success | preview | 1 | `H3 tabindex=-1` "Your details are on their way" |
| KF5-6 | transport failure | preview | 1 | `H3 tabindex=-1` "We couldn't send your details" |
| KF5-6 | blocked | preview | 1 | `H3 tabindex=-1` "We couldn't send your details" |

**Body-focus invariant — the count of transitions after which the active element was the document
body:**

| Target | Transitions observed | Transitions ending on `document.body` |
|---|---|---|
| preview S5 | 13 | **0** |
| live S1 | 10 | **0** |
| both | 23 | **0** |

Rows 1–4 carry the count in the record itself (`bodyFocusCount: 0` over `transitionCount: 3` and
`transitionCount: 7`, per target, in both runs). Rows 5 and 6 are recorded as the captured
destination element in `evidence/form-states.json` rather than as a separate count field. Each
captured destination there is an `H3`, not `BODY`, which gives 0 for those three transitions. The
spec also checks the same counter as each of those tests ends.

---

## 3. Request count inside the in-flight window

| Reading | Value |
|---|---|
| response delay routed onto the endpoint | 4000 ms |
| submissions attempted | 2 |
| requests issued during the window, after the second attempt | **1** |
| requests issued in total once the response settled | **1** |
| request methods seen | `POST` |

The second attempt was issued through `form.requestSubmit()`, because the submit control was
disabled. It therefore reached the synchronous in-flight guard, not the disabled attribute.
Requests were counted at the route, not inferred from the interface.

For comparison, the blocked record reads **1** submission attempted and **0** requests issued.

---

## 4. Retained values across the induced failure

Distinctive values were entered before submitting, then read back from the still-mounted form after
the fallback panel rendered. The two columns are copied from the record, not paraphrased.

| Field | Entered before the transport failure | Read back after it | Entered before the blocked submission | Read back after it |
|---|---|---|---|---|
| name | `Form State Probe` | `Form State Probe` | `Form State Probe` | `Form State Probe` |
| email | `form-state-probe@example.com` | `form-state-probe@example.com` | `form-state-probe@example.com` | `form-state-probe@example.com` |
| preferredChannel | `Email` | `Email` | `Email` | `Email` |
| phone | `` (empty) | `` (empty) | `` (empty) | `` (empty) |
| role | `Landlord` | `Landlord` | `Landlord` | `Landlord` |
| organization | `Retained Holdings FS-12-ORG` | `Retained Holdings FS-12-ORG` | `Retained Holdings FS-12-ORG` | `Retained Holdings FS-12-ORG` |
| portfolioBand | `1–5 units` | `1–5 units` | `1–5 units` | `1–5 units` |
| county | `Nairobi` | `Nairobi` | `Nairobi` | `Nairobi` |
| timeframe | `Ready now` | `Ready now` | `Ready now` | `Ready now` |
| message | `Distinctive pre-submission answer FS-12-RETAIN-7788` | `Distinctive pre-submission answer FS-12-RETAIN-7788` | `Distinctive pre-submission answer FS-12-RETAIN-7788` | `Distinctive pre-submission answer FS-12-RETAIN-7788` |

---

## 5. Status-region counts per state

Two counts are kept apart because they differ. **Document** counts every `role="status"` element
on the page. **Submission** counts only the form's submission status region, the one FS-2 is about.

| State | Target | `role="status"` in the document | Submission status regions | Source |
|---|---|---|---|---|
| idle | preview, live | 2 | 1 | the idle record (runs A, B and C) |
| invalid | preview, live | 2 | 1 | the invalid record (runs B and C only; the key was added in Task 3) |
| in-flight | preview | 2 | 1 | the in-flight record (runs B and C only; read inside the window) |
| success | preview | 1 | 1 | the success record (document); FS-2 timeline (submission) |
| transport failure | preview | 2 | 1 | the transport-failure record (document); FS-2 timeline (submission) |
| blocked | preview | 2 | not taken as a separate reading | the blocked record (document) |

**FS-2 timeline** (`evidence/form-states-status-region.json`, preview, one test, 2 requests):

| # | Moment | Document | Submission | Submission-region text |
|---|---|---|---|---|
| 1 | first render | 2 | 1 | `` (empty) |
| 2 | filled, before any submission | 2 | 1 | `` (empty) |
| 3 | after a transport failure | 2 | 1 | `We couldn't send your details.` |
| 4 | requiredness change after a terminal message | 2 | 1 | `A phone number is now required because you asked us to reach you by Phone call.` |
| 5 | submitting, with a requiredness sentence outstanding | 2 | 1 | `Sending your details…` |
| 6 | after success, with the form card replaced | 1 | 1 | `Your details were sent.` |

Rows 3 → 4 show the requiredness sentence replacing a terminal message that had already been read.
Rows 4 → 5 show the submitting sentence replacing an outstanding requiredness sentence. At every
moment the submission region holds one text.

---

## 6. Held out for human judgement — long option labels at the narrowest supported width

> **This item is not a pass.** It is a backstop item (`05-UI-SPEC.md` § UI Considerations,
> `05-12-PLAN.md` `must_haves.truths`). A native `<select>` clips rather than reflows, and its open
> popup is drawn outside the document's layout, where neither the per-element viewport sweep
> (VC-1b) nor this spec can see. Whether the long labels stay readable at 360 px is a visual reflow
> judgement that no assertion settles cleanly, so **it is not asserted here.** At verification time
> an item with no explicit evidence routes to human judgement rather than passing silently. The
> readings below are the inputs to that judgement, not a substitute for it.

**Measured on:** live S1 (`haoo-D1dl6F2P.js`), viewport 360 × 740, runs A (11:06:28Z), B
(19:14:32Z) and C (19:19Z). The readings are identical by value across the three runs. What was measured is the
**closed** control. The open popup was not measured, and cannot be.

| Option list | Rendered control width (CSS px) | Control height (CSS px) | Real options | Longest real option label | Its characters | Placeholder label (measured separately) | Placeholder characters |
|---|---|---|---|---|---|---|---|
| preferredChannel | 278 | 44 | 3 | `Phone call` | 10 | `Select a channel` | 16 |
| role | 278 | 44 | 5 | `Property manager` | 16 | `Select your role` | 16 |
| portfolioBand | 278 | 44 | 5 | `51–200 units` | 12 | `Select a range` | 14 |
| county | 278 | 44 | 48 | `Elgeyo-Marakwet` | 15 | `Select a county` | 15 |
| timeframe | 278 | 44 | 4 | `Just exploring` | 14 | `Select a timeframe` | 18 |

The widest real label across all five lists is **16** characters. The placeholder is authored by
the form, not by the option data. It is the string a closed control shows before any choice. It is
longer than every real option on 3 of the 5 lists and the same length on the other 2, which is why
it is reported in its own columns rather than folded into the maximum.

**What the reviewer still has to do:** open each of the five selects on a 360 px-wide device, and
judge whether the displayed value and the open list can be read without clipping that cannot be
scrolled past. Record what was seen.

---

## 7. Observations recorded, not judged

- **FS-O1 — two `role="status"` elements in every state that renders the form.** One is the
  submission region, outside the form card. The other is the measurement disclosure's clear-context
  region, inside it. The success state leaves 1 because the card carrying the second was replaced.
  FS-2's "exactly one" describes the submission region (1 at every moment measured). The document
  count is 2. Recorded for whoever reconciles the spec wording.
- **FS-O2 — the honeypot input is not disabled during the in-flight window.** It is not a product
  field. It is `aria-hidden`, positioned off-canvas and out of the tab order, so no visitor edit can
  be lost in it. 10 of the 10 product field controls read disabled.
- **The transport-failure and blocked states render the same status-region text**
  (`We couldn't send your details.`). What separates them is the panel body and the retry-control
  count, `1` against `0`.

---

The confirmation state's `Your details were sent.` announcement is a browser-observable claim that
the routed endpoint answered the request, never a delivery claim; whether mail is delivered is
established only by the mail-chain record, `05-EVIDENCE-MAIL.md`.
