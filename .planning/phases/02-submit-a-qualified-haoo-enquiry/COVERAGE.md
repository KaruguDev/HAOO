# Phase 2 — External API Coverage Matrix

**Provider:** FormSubmit (`https://formsubmit.co`)
**Integration surface:** one outbound cross-origin `POST` to the AJAX route from a static GitHub Pages build.
**Default:** `INTEGRATE`. Every `OPT-OUT` below carries a one-line reason — this file is the subtraction record.
**Source of the capability list:** `formsubmit.co/documentation` as summarised in `02-RESEARCH.md` (Standard Stack, Pattern 1, Pitfalls 4–7, Open Question 1).

| # | Capability | Decision | Reason (required on every OPT-OUT) |
|---|------------|----------|------------------------------------|
| 1 | AJAX endpoint `POST https://formsubmit.co/ajax/<target>` | INTEGRATE | D-01: the in-page flow is the only shape that preserves entered values on provider failure (LEAD-05). The accepted D-04/LEAD-04 endpoint shape has exactly one target segment after `/ajax/`; that segment must decode successfully, remain nonblank after trimming, and contain no slash, so bare or encoded-empty-like routes cannot become request destinations. |
| 2 | Random-token endpoint form (`/ajax/<token>`) | INTEGRATE | D-04: keeps the readable `info@haoo.online` string out of the shipped bundle. Supplied by `VITE_HAOO_FORM_ENDPOINT`. |
| 3 | Plain-address endpoint (`/ajax/info@haoo.online`) | INTEGRATE | D-04 documented build-time fallback so a missing repository variable degrades to a working form rather than an empty endpoint. |
| 4 | `_subject` | INTEGRATE | LEAD-04 requires a recognizable HAOO-specific subject; sourced from `HAOO_PRODUCT.qualify.subject`. |
| 5 | `_template` (`table` / `basic` / `box`) | INTEGRATE | `table` renders a ten-field enquiry readably (RESEARCH A8). |
| 6 | `_captcha` | INTEGRATE | Set to `'false'` per D-24 — a challenge widget would burden keyboard and AT users (LEAD-06). |
| 7 | `_honey` honeypot | INTEGRATE | LEAD-06 spam control; the provider evaluates the field, the client only renders it. |
| 8 | Readable JSON body keys as email field labels | INTEGRATE | LEAD-04 "human-readable field labels"; `QualifyField.emailLabel` is the key written into the payload. |
| 9 | Classic `<form action>` POST (non-AJAX) | OPT-OUT | D-01 rejects it: a full-page POST cannot retain entered values after a provider failure, which LEAD-05 requires. |
| 10 | `_next` redirect-to-thank-you-page | OPT-OUT | D-01 keeps the visitor on `/products/haoo/`; the in-page confirmation panel (D-03) replaces the redirect. |
| 11 | `_autoresponse` | OPT-OUT | Documented as non-functional for forms that are both AJAX-submitted and captcha-disabled — this form is both (RESEARCH Pitfall 5). Shipping it would promise the visitor an email that never arrives. |
| 12 | `_cc` | OPT-OUT | D-05 delivers to `info@haoo.online` only; a cc also widens the email-header-injection surface (threat `T-02-04`). |
| 13 | `_replyto` | OPT-OUT | Threat `T-02-04`: no visitor-supplied value may reach a header-shaped provider option. The visitor's address travels as an ordinary readable field (`Email address`) instead. |
| 14 | `_blacklist` (banned-word filter) | OPT-OUT | Silent server-side rejection of a legitimate enquiry is indistinguishable from provider failure to the visitor; the honeypot is the locked spam control (D-24). |
| 15 | reCAPTCHA (provider-hosted challenge) | OPT-OUT | D-24 and LEAD-06 forbid a third-party challenge widget: it burdens AT users and pulls a tracker into a privacy-first funnel. |
| 16 | File attachments / multipart upload | OPT-OUT | No upload capability is in the phase boundary; ASVS V12 is scoped out in `02-RESEARCH.md` § Security Domain. |
| 17 | Webhooks / POST-to-your-endpoint | OPT-OUT | No server runtime exists (GitHub Pages) and v1 lead delivery is email-only per `AGENTS.md` § Project → Constraints. |
| 18 | Provider dashboard, archive, and CSV export of submissions | OPT-OUT | A searchable leads store is v1 Out of Scope (`REQUIREMENTS.md`); a leads list or CRM is v2 (`LEAD-08`/`LEAD-09`). |
| 19 | Custom hosted "thank you" page | OPT-OUT | Superseded by D-03's in-page confirmation panel, which also prevents double submission by replacing the form. |
| 20 | Endpoint activation / confirmation email flow | OPT-OUT (this phase) | Deferred by design to `LEAD-07` / Phase 5; `02-RESEARCH.md` § Environment Availability records that Phase 2 must not attempt a live submission. |
| 21 | Response body parsing (`response.json()`) | OPT-OUT | The AJAX response shape is undocumented (RESEARCH Pitfall 4); success and failure are decided from `response.ok` alone so a body change cannot report a delivered enquiry as failed. |

**Integrated:** 8 · **Opted out:** 13 · **Total capability rows:** 21

**Re-open triggers:** if Phase 5 (`LEAD-07`) discovers that underscore options or spaced JSON keys are not honoured on the AJAX route (RESEARCH Open Question 1, assumptions A1/A2), rows 4–8 are re-decided and `buildSubmissionBody` switches to `snake_case` keys — a one-function change by construction.
