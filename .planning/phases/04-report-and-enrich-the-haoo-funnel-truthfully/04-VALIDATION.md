---
phase: 4
slug: report-and-enrich-the-haoo-funnel-truthfully
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: false  # absorbed into 04-01 T1 (tdd); no separate wave
created: 2026-09-01
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + Testing Library 16.3.2 + jsdom 26.1.0 |
| **Config file** | `vite.config.ts` (Vitest uses Vite defaults; no dedicated test block) |
| **Quick run command** | `npm run test:unit -- --run src/test/measurement.test.ts src/test/qualify-form.test.tsx src/test/haoo-report.test.ts` |
| **Full suite command** | `npm test` (`npm run build && vitest run`) |
| **Estimated runtime** | ~60 seconds (full suite includes a production build) |

---

## Sampling Rate

- **After every task commit:** Run the focused Vitest files for the touched capability plus `npm run typecheck`
- **After every plan wave:** Run `npm run lint && npm run typecheck && npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

*Populated by the planner as tasks are created. Requirement coverage derived from RESEARCH.md § Validation Architecture:*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01 T1 (tracer) | 04-01 | 1 | MEAS-01, MEAS-08 | T-04-02, T-04-03, T-04-04, T-04-05 | Event→stage/label map exhaustive both ways; untrusted response rejected fail-closed; write-on-success-only so an interrupted run leaves the previous report byte-identical | unit + contract | `npm run test:unit -- --run src/test/haoo-report.test.ts` | ❌ W0 — created by this task | ⬜ pending |
| 04-01 T2 | 04-01 | 1 | MEAS-01 | T-04-04 | Exact inclusive 7/30/90/all windows incl. month, year and leap-day boundaries; per-period zero-fill; integer deltas only | unit + contract | `npm run test:unit -- --run src/test/haoo-report.test.ts` | ✅ after T1 | ⬜ pending |
| 04-02 T2 (tracer) | 04-02 | 1 | MEAS-05, MEAS-08 | T-04-01, T-04-10, T-04-11 | Summary carries only coarse disclosed fields; exact-allowlist payload keys; reserved label unclaimable; serialize→track→fetch order preserved | unit + component | `npm run test:unit -- --run src/test/qualify-form.test.tsx src/test/build-output.test.ts` | ✅ extend | ⬜ pending |
| 04-02 T3 | 04-02 | 1 | MEAS-05 | T-04-01, T-04-07 | Band thresholds and one step either side; numeric silence; locked fallback on unreadable context without failing submission | unit | `npm run test:unit -- --run src/test/qualify-form.test.tsx` | ✅ extend | ⬜ pending |
| 04-03 T1 | 04-03 | 2 | MEAS-01 | T-04-03 | Four pre-rendered periods; native period control degrading to all-sections-visible; labelled scroll regions; authored empty state | contract | `npm run test:unit -- --run src/test/haoo-report.test.ts` | ✅ after 04-01 | ⬜ pending |
| 04-03 T2 | 04-03 | 2 | MEAS-08 | T-04-05, T-04-02, T-04-13 | Banned vocabulary absent from document text; no percent sign; zero external resources; no credential; mutation-probed | contract | `npm run test:unit -- --run src/test/haoo-report.test.ts` | ✅ after 04-01 | ⬜ pending |
| 04-04 T2 | 04-04 | 2 | MEAS-05, MEAS-08 | T-04-15 | Superseded notice clause replaced in all five asserted locations in one commit, including the built-bundle assertion | component + build | `npm test` | ✅ extend | ⬜ pending |
| 04-04 T3 | 04-04 | 2 | MEAS-05 | T-04-16, T-04-17 | Disclosure summary group renders fixed copy in locked position and reflects no runtime measurement value | component | `npm run test:unit -- --run src/test/measurement-page.test.tsx src/test/product-shell-reuse.test.tsx` | ✅ extend | ⬜ pending |
| 04-05 T2 | 04-05 | 3 | MEAS-01, MEAS-07, MEAS-08 | T-04-06, T-04-07, T-04-19 | Fail-closed provider and script-source resolution; exactly one name-only call per event; automatic capture disabled; total failure isolation | unit + component | `npm run test:unit -- --run src/test/measurement.test.ts src/test/measurement-page.test.tsx` | ✅ extend | ⬜ pending |
| 04-05 T3 | 04-05 | 3 | MEAS-01 | T-04-02, T-04-18 | No analytics origin literal under `src/`; unset-provider bundle scope stated explicitly; credential shapes forbidden in the bundle | contract + build | `npm test` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Checkpoint tasks (04-02 T1 = C-2, 04-04 T1 = C-1, 04-05 T1 = C-3) carry no automated verification by
design — each is a `gate="blocking-human"` decision. Sampling continuity is preserved because no
checkpoint is followed by more than one task without an automated verify.*

---

## Wave 0 Requirements

Wave 0 is absorbed into plan 04-01 Task 1 rather than run as a separate wave: that task is
`tdd="true"` and creates `src/test/haoo-report.test.ts` with its contracts before the implementation
exists, so the only MISSING test file in the phase is created by the first task that needs it.

- [ ] `src/test/haoo-report.test.ts` — report-domain contracts: exact event→stage/label map, period ranges, integer deltas, provider response validation, generated accessible HTML — **created by 04-01 T1**
- [ ] Fixture-driven Stats API adapter test — must never require a live key or network access — **created by 04-01 T1 via the injected `fetch` capability**
- [ ] Extend `src/test/qualify-form.test.tsx` — exact summary label/value plus negative sensitive-field table — **04-02 T2 and T3**
- [ ] Extend `src/test/build-output.test.ts` — Stats API tokens, provider URLs, analytics globals, and report code must not enter unapproved product files or `dist` — **04-02 T2 (boundary registration) and 04-05 T3 (bundle prohibitions and origin-literal scan)**

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Compact report readability | MEAS-01 | Visual/responsive judgement not capturable in jsdom | Open the report at narrow width and 200% zoom; confirm no truncation or horizontal scroll |
| Screen-reader announcement and order | MEAS-08 | Assistive-tech output not asserted by jsdom | Navigate the report with a screen reader; confirm labels announce as views/attempts/returns/outbound clicks in source order |
| Live qualification submission | MEAS-05 | Requires an activated endpoint (Phase 5 authorization) | Submit a uniquely tagged qualification after endpoint activation; inspect the received email for the coarse summary and absence of score/identifier |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies — every non-checkpoint task carries an `<automated>` command; the three `gate="blocking-human"` checkpoint tasks carry none by design
- [x] Sampling continuity: no 3 consecutive tasks without automated verify — the longest gap is a single checkpoint task
- [x] Wave 0 covers all MISSING references — the only MISSING file, `src/test/haoo-report.test.ts`, is created by 04-01 T1 before its implementation
- [x] No watch-mode flags — every command uses `--run` or `npm test`
- [x] Feedback latency < 60s — focused `test:unit` runs are seconds; only `npm test` includes a build
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner-seeded 2026-09-01; `status` stays `draft` until `/gsd-validate-phase` signs off
