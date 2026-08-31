---
phase: 03
slug: build-privacy-bounded-engagement-context
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-30
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + Testing Library React 16.3.2 + jsdom 26.1.0 |
| **Config file** | `vite.config.ts` and `src/test/setup.ts` |
| **Quick run command** | `npm run test:unit -- src/test/measurement.test.ts src/test/measurement-page.test.tsx` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit -- src/test/measurement.test.ts src/test/measurement-page.test.tsx`
- **After every plan wave:** Run `npm run typecheck && npm run lint && npm run test:unit`
- **Before `$gsd-verify-work`:** `npm test` must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | MEAS-02, MEAS-03, MEAS-06, MEAS-07 | T-03-01 | Closed event/campaign/schema inputs fail closed; storage and history failures degrade to no-op/in-memory behavior | unit + static contract | `npm run test:unit -- src/test/measurement.test.ts src/test/build-output.test.ts` | ❌ W0 / ✅ extend | ⬜ pending |
| 03-02-01 | 02 | 2 | MEAS-02, MEAS-04, MEAS-07 | T-03-02 | Disclosed UI emits only allowlisted names and all user routes work without analytics or storage | component + accessibility | `npm run test:unit -- src/test/measurement-page.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | MEAS-02, MEAS-03 | T-03-03 | Production output contains no identity/form keys, provider script, stable identifier, or clickstream buffer | build contract | `npm run test:unit -- src/test/build-output.test.ts` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/test/measurement.test.ts` — event, campaign, schema, storage-failure, bounded-transition, date/expiry, and clear contracts for MEAS-02/03/06/07.
- [ ] `src/test/measurement-page.test.tsx` — emission-site, StrictMode deduplication, disclosure, footer expansion, and degradation contracts for MEAS-02/04/07.
- [ ] Extend `src/test/build-output.test.ts` — grant browser capabilities only to `src/measurement/`, retain component prohibitions, and scan output for forbidden identity/form fields and provider code.
- [ ] Add deterministic clock injection or fake timers for date-band and expiry transitions.
- [ ] Mutation-probe campaign validation against character stripping and schema validation against permissive partial-record acceptance.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Approve the final present-tense collection notice before shipping | MEAS-04 | D-16 preserves the prior product-owner copy checkpoint | Review the rendered one-line notice and expanded disclosure; approve only if they describe Phase 3 behavior without promising the Phase 4 email summary. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30 seconds
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
