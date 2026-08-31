---
phase: 4
slug: report-and-enrich-the-haoo-funnel-truthfully
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| TBD | TBD | 0 | MEAS-01 | — | Event→stage map, zero-fill, invalid provider rows rejected, exact period windows, counts-only totals/deltas | unit + contract | `npm run test:unit -- --run src/test/haoo-report.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | MEAS-01 | — | Sink emits one name-only call; no auto-duplicates/properties; degrades when script/global/network absent | unit + component | `npm run test:unit -- --run src/test/measurement.test.ts src/test/measurement-page.test.tsx` | ✅ | ⬜ pending |
| TBD | TBD | 1 | MEAS-05 | T-04-01 | Summary carries only coarse disclosed fields; no raw/derivation/provider values; one human-readable email field | unit + component | `npm run test:unit -- --run src/test/qualify-form.test.tsx src/test/qualify-data.test.ts` | ✅ | ⬜ pending |
| TBD | TBD | 1 | MEAS-08 | — | Every event carries one literal evidence label; no conversion/customer/delivery/completion claims or percentages | contract | `npm run test:unit -- --run src/test/haoo-report.test.ts src/test/build-output.test.ts` | ❌ W0 / ✅ | ⬜ pending |
| TBD | TBD | 2 | MEAS-08 | — | Browser success/failure copy stays distinct from inbox delivery proof | component | `npm run test:unit -- --run src/test/qualify-form.test.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/test/haoo-report.test.ts` — report-domain contracts: exact event→stage/label map, period ranges, integer deltas, provider response validation, generated accessible HTML
- [ ] Fixture-driven Stats API adapter test — must never require a live key or network access
- [ ] Extend `src/test/qualify-form.test.tsx` / `src/test/qualify-data.test.ts` — exact summary label/value plus negative sensitive-field table
- [ ] Extend `src/test/build-output.test.ts` — Stats API tokens, provider URLs, analytics globals, and report code must not enter unapproved product files or `dist`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Compact report readability | MEAS-01 | Visual/responsive judgement not capturable in jsdom | Open the report at narrow width and 200% zoom; confirm no truncation or horizontal scroll |
| Screen-reader announcement and order | MEAS-08 | Assistive-tech output not asserted by jsdom | Navigate the report with a screen reader; confirm labels announce as views/attempts/returns/outbound clicks in source order |
| Live qualification submission | MEAS-05 | Requires an activated endpoint (Phase 5 authorization) | Submit a uniquely tagged qualification after endpoint activation; inspect the received email for the coarse summary and absence of score/identifier |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
