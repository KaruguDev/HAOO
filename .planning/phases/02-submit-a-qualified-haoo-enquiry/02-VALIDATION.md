---
phase: 2
slug: submit-a-qualified-haoo-enquiry
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-30
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `02-RESEARCH.md` § Validation Architecture. Task IDs are filled in
> once `*-PLAN.md` files exist; requirement rows below are the binding contract.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + jsdom 26.1.0 + React Testing Library 16.3.2 |
| **Config file** | `vitest.config.ts` (`environment: 'jsdom'`, `globals: false`, `setupFiles: ['./src/test/setup.ts']`) |
| **Quick run command** | `npm run test:unit -- --run <affected file>` |
| **Full suite command** | `npm test` (runs `vite build`, then `vitest run`) |
| **Static checks** | `npm run typecheck && npm run lint` |
| **Estimated runtime** | ~3 seconds full suite (65 tests / 6 files at research baseline) |

`globals: false` — every test file must import `describe`/`it`/`expect`/`vi` from `vitest` explicitly.
`@testing-library/user-event` is **not** installed; new contracts use `fireEvent`, matching existing files.

---

## Sampling Rate

- **After every task commit:** `npm run test:unit -- --run <affected file> && npm run typecheck`
- **After every plan wave:** `npm run lint && npm test`
- **Before `/gsd-verify-work`:** `npm test && npm run typecheck && npm run lint` all green
- **Max feedback latency:** 30 seconds

Identical to the Phase 01 sampling contract in `01-VALIDATION.md`, so the two phases' evidence is comparable.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | 0 | LEAD-06 | boundary | Amended static-boundary guard still forbids storage, analytics, injection, router, supabase in every product source | source scan | `npm run test:unit -- --run src/test/build-output.test.ts -t "boundary"` | ✅ amend | ⬜ pending |
| TBD | TBD | 1 | LEAD-01 | — | Name + at least one usable contact method are labelled required controls; a complete valid submit reaches `fetch` | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "collects a name and a usable contact method"` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | LEAD-02 | — | Role, organization, portfolio band, county, timeframe render as controlled fields with every option from product data | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "renders every qualification option"` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | LEAD-02 | — | The 47-county list plus `Outside Kenya` is exactly the shipped data | data | `npm run test:unit -- --run src/test/qualify-data.test.ts -t "county"` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | LEAD-03 | — | Optional fields carry "(optional)"; required-fields instruction present; D-25 disclosure rendered and referenced by the submit control | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "discloses what is collected and what is required"` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | LEAD-04 | endpoint integrity | Request URL, method, headers, `_subject`, and readable payload keys are exact; no `_cc`, no `_autoresponse` | component (stubbed fetch) | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "posts a readable, correctly-addressed payload"` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | LEAD-04 | endpoint integrity | Resolved endpoint is a non-empty absolute `https://formsubmit.co/ajax/…` URL with the env var both set and unset | data | `npm run test:unit -- --run src/test/qualify-data.test.ts -t "endpoint"` | ❌ W0 | ⬜ pending |
| TBD | TBD | 2 | LEAD-05 | — | Failed submit shows inline errors + `role="alert"` summary, moves focus to the summary, and retains every entered value | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "retains entered values"` | ❌ W0 | ⬜ pending |
| TBD | TBD | 2 | LEAD-05 | — | `role="status"` node present at first render with empty text; carries submitting → succeeded / failed text | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "announces every submission state"` | ❌ W0 | ⬜ pending |
| TBD | TBD | 2 | LEAD-05 | provider failure | A rejected/failed `fetch` renders the retry control and the direct-contact fallback | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "recovers from provider failure"` | ❌ W0 | ⬜ pending |
| TBD | TBD | 2 | LEAD-06 | spam | Honeypot present, named `_honey`, `tabIndex={-1}`, `autoComplete="off"`, off-screen, never required; no captcha widget or third-party script rendered | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx -t "traps bots without blocking assistive technology"` | ❌ W0 | ⬜ pending |
| TBD | TBD | 2 | LEAD-06 | — | Every control is reachable with an accessible name and a focus indicator token the contrast contract recognises | source contract | `npm run test:unit -- --run src/test/focus-contrast.test.ts` | ✅ extend | ⬜ pending |
| TBD | TBD | 2 | LEAD-01/02 (D-06→D-09) | — | `#qualify` sits between `#brochure` and `#onboarding`; a nav entry and three "send details" links point at it | component | `npm run test:unit -- --run src/test/haoo-page.test.tsx -t "qualify"` | ✅ extend | ⬜ pending |
| TBD | TBD | 2 | LEAD-01 (D-11) | — | The form renders for a synthetic non-HAOO product; no `HAOO` literal in product-generic sources | component + source scan | `npm run test:unit -- --run src/test/product-shell-reuse.test.tsx` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/test/qualify-form.test.tsx` — stubs for LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05, LEAD-06
- [ ] `src/test/qualify-data.test.ts` — stubs for LEAD-02 option lists and LEAD-04 endpoint resolution
- [ ] **Amend** `src/test/build-output.test.ts:292-306` — restate the static boundary for Phase 2; the guard must fail loudly for the right reason before implementation starts
- [ ] **Amend** `src/test/focus-contrast.test.ts:28-34` — add the new component file(s) to `FOCUS_SOURCES`
- [ ] **Amend** `src/test/product-shell-reuse.test.tsx:25-33` — add new product-generic sources to `GENERIC_PRODUCT_SOURCES`
- [ ] **Amend** `src/test/haoo-page.test.tsx:6-11, 155-165, 366-386` — only if the fallback/confirmation panel accessible names are not made distinct; preferred resolution is distinct names, leaving these contracts untouched
- [ ] No framework install needed — Vitest, jsdom, and RTL are present and green (65/65 at research baseline)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A live submission arrives at `info@haoo.online` with readable field labels and the HAOO subject | LEAD-04 | FormSubmit's handling of underscore options and spaced JSON keys on the AJAX route is unverified and only observable against a real activated mailbox | Activate the FormSubmit endpoint for `info@haoo.online`, submit the deployed form once, confirm subject and label readability in the received mail |
| Exact spelling of `Taita–Taveta`, `Tharaka-Nithi`, `Elgeyo-Marakwet`, `Murang'a` | LEAD-02 | The authoritative KLRC source redirected to an unrelated host during research; character-level accuracy is unverified | Human verifies the four names against an authoritative Kenyan government county list before merge (`checkpoint:human-verify`) |
| Privacy/legal sign-off on the D-25 collection disclosure and Kenya DPA 2019 posture | LEAD-03 | Ownership decision recorded as a blocker in STATE.md; research asserts no compliance position | Privacy/legal owner approves notice, storage, retention, and processor decisions before production collection |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
