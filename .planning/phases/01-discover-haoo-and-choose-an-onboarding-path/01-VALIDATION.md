---
phase: 01
slug: discover-haoo-and-choose-an-onboarding-path
status: validated
nyquist_compliant: false
wave_0_complete: true
created: 2026-08-29
audited: 2026-08-29
---

# Phase 01 — Validation Strategy

> Retrospective Nyquist audit of the completed HAOO discovery and onboarding phase.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4, jsdom 26.1.0, React Testing Library 16.3.2 |
| **Config file** | `vitest.config.ts` |
| **Setup file** | `src/test/setup.ts` |
| **Quick run command** | `npm run test:unit -- --run <test-file>` |
| **Full suite command** | `npm test` (production build followed by Vitest) |
| **Static checks** | `npm run typecheck && npm run lint` |
| **Baseline before audit** | 63 tests passing across 6 files |
| **Post-audit state** | 63 passing, 1 newly generated PROD-03 contract failing |

`npm test` builds before running the suite, so build-output checks evaluate current `dist/` artifacts. `test:unit` remains the guarded inner-loop command.

---

## Sampling Rate

- **After every task commit:** Run the directly affected test file with `npm run test:unit` plus `npm run typecheck`.
- **After every plan wave:** Run `npm run lint && npm test`.
- **Before verification/deployment:** Run `npm test && npm run typecheck && npm run lint`.
- **Max feedback latency:** Under 30 seconds for the affected-test loop.

---

## Requirement Verification Map

| Requirement | Owning Plans | Automated Evidence | Status |
|-------------|--------------|--------------------|--------|
| PROD-01 | 01-04 | `src/test/products-section.test.tsx` — collection states, Products navigation, landmark order, native route | ✅ covered |
| PROD-02 | 01-02, 01-08 | `src/test/build-output.test.ts` — physical nested document, emitted references, fresh build output | ✅ covered |
| PROD-03 | 01-03 | Story, benefits, capabilities, journey, semantics, media failure, and source fidelity are covered; `src/test/haoo-page.test.tsx#renders every centralized audience as visible semantic content` exposes the missing rendered audience collection | ⚠ partial — implementation gap |
| PROD-04 | 01-05, 01-08 | `src/test/haoo-page.test.tsx` and `src/test/build-output.test.ts` — preview/fallback, independent Open/Download, exact PDF bytes | ✅ covered |
| PROD-05 | 01-02, 01-08 | `src/test/build-output.test.ts` — source/built title, canonical, description, and social metadata | ✅ covered |
| PROD-06 | 01-02, 01-04, 01-07 | `src/test/product-shell-reuse.test.tsx`, content contracts, and collection tests — typed central data and synthetic product shell reuse | ✅ covered |
| ONBD-01 | 01-02, 01-09 | Page and no-script contracts assert visible `tel:+254702188044` navigation | ✅ covered |
| ONBD-02 | 01-02, 01-09 | Content and no-script contracts assert digits-only WhatsApp destination, exact decoded starter text, and one query parameter | ✅ covered |
| ONBD-03 | 01-02, 01-09 | Page and no-script contracts assert visible `mailto:info@haoo.online` navigation | ✅ covered |
| ONBD-04 | 01-02, 01-09 | Page and no-script contracts assert visible `https://manage.haoo.online/` navigation and departure disclosure | ✅ covered |
| ONBD-05 | 01-02, 01-05, 01-09 | Native-link, static-boundary, PDF-fallback, and no-script contracts reject optional-system gating | ✅ covered |
| QUAL-04 | 01-02, 01-05, 01-08 | Fresh physical build/asset contracts plus production `curl` checks for the HAOO page and PDF | ✅ covered |
| QUAL-06 | 01-01, 01-03, 01-05 | Exact content ledger, native destinations, uppercase brand, supplied-media hashes, and PDF SHA-256 | ✅ covered |

**Coverage summary:** 12 requirements covered; 1 requirement partial; 0 requirements missing.

---

## Escalated Validation Gap

| Gap ID | Requirement | Generated Test | Result | Root Cause | Required Resolution |
|--------|-------------|----------------|--------|------------|---------------------|
| NYQ-PROD-03 | PROD-03 | `src/test/haoo-page.test.tsx#renders every centralized audience as visible semantic content` | Fails: 1 failed, 19 passed in focused file | `ProductPage` renders `product.audienceLead` but never reads `product.audiences`; no labeled audience region/list exists and `Agents` has zero rendered matches | Render the centralized four-item audience collection as semantic visible content, then rerun the focused test and this audit |

The Nyquist auditor exhausted 3/3 permitted iterations and escalated this as an implementation defect. The validation workflow did not modify implementation files.

---

## Manual-Only Complements

These browser judgments complement automated contracts; they are not substitutes for the unresolved PROD-03 DOM contract.

| Behavior | Requirement | Evidence |
|----------|-------------|----------|
| Responsive layout, zoom, and fixed-header anchor landing | PROD-01, PROD-03 | Phase 01 UAT tests 2 and 4 passed |
| Real PDF embedding/fallback behavior | PROD-04 | Phase 01 UAT test 3 passed |
| No-JavaScript fallback activation and native destinations | ONBD-05 | Phase 01 UAT test 7 passed |
| Deployed HAOO and brochure routes | QUAL-04 | Production smoke checks returned HTTP 200 after deployment |

---

## Validation Audit 2026-08-29

| Metric | Count |
|--------|-------|
| Requirements audited | 13 |
| Gaps found | 1 |
| Resolved | 0 |
| Escalated | 1 |

---

## Validation Sign-Off

- [ ] All Phase 01 requirements have passing automated behavior verification
- [x] Sampling continuity: no three consecutive implementation tasks lack automated verification
- [x] Wave 0 test infrastructure and planned contract files exist
- [x] No watch-mode flags are used in verification commands
- [x] Affected-test feedback latency remains under 30 seconds
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** validated partial — implementation gap NYQ-PROD-03 remains open
