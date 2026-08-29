---
phase: 01
slug: discover-haoo-and-choose-an-onboarding-path
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-29
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4, jsdom 26.1.0, React Testing Library 16.3.2 |
| **Config file** | `vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `npm test -- --run src/test/haoo-page.test.tsx` |
| **Full suite command** | `npm run typecheck && npm run lint && npm run build && npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run the directly affected test file plus `npm run typecheck`
- **After every plan wave:** Run `npm run lint && npm run build && npm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds for the affected-test loop

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD-W0-01 | TBD | 0 | Test foundation | T-01-01 | Exact-pinned dependencies and no unsafe postinstall | tooling | `npm test -- --run` | ❌ W0 | ⬜ pending |
| TBD-01 | TBD | TBD | PROD-01 | — | Native product link requires no script/provider | component | `npm test -- --run src/test/products-section.test.tsx` | ❌ W0 | ⬜ pending |
| TBD-02 | TBD | TBD | PROD-02 | — | Physical nested HTML exists independently of SPA fallback | build contract | `npm run build && npm test -- --run src/test/build-output.test.ts` | ❌ W0 | ⬜ pending |
| TBD-03 | TBD | TBD | PROD-03 | T-01-02 | Brochure facts render as React text nodes, never injected source HTML | component/contract | `npm test -- --run src/test/haoo-page.test.tsx src/test/haoo-content.test.ts` | ❌ W0 | ⬜ pending |
| TBD-04 | TBD | TBD | PROD-04 | T-01-03 | PDF fallback and independent Open/Download anchors remain available | component/build | `npm run build && npm test -- --run src/test/haoo-page.test.tsx src/test/build-output.test.ts` | ❌ W0 | ⬜ pending |
| TBD-05 | TBD | TBD | PROD-05 | T-01-04 | Metadata uses fixed HTTPS canonical/social values | build contract | `npm run build && npm test -- --run src/test/build-output.test.ts` | ❌ W0 | ⬜ pending |
| TBD-06 | TBD | TBD | PROD-06 | — | Contacts and destinations have one typed source of truth | unit/contract | `npm test -- --run src/test/haoo-content.test.ts src/test/products-section.test.tsx` | ❌ W0 | ⬜ pending |
| TBD-07 | TBD | TBD | ONBD-01 | T-01-04 | Fixed `tel:+254702188044` destination | component | `npm test -- --run src/test/haoo-page.test.tsx` | ❌ W0 | ⬜ pending |
| TBD-08 | TBD | TBD | ONBD-02 | T-01-04 | Fixed digits-only WhatsApp destination and generic encoded starter text | unit/component | `npm test -- --run src/test/haoo-content.test.ts src/test/haoo-page.test.tsx` | ❌ W0 | ⬜ pending |
| TBD-09 | TBD | TBD | ONBD-03 | T-01-04 | Fixed `mailto:info@haoo.online` destination | component | `npm test -- --run src/test/haoo-page.test.tsx` | ❌ W0 | ⬜ pending |
| TBD-10 | TBD | TBD | ONBD-04 | T-01-04 | Fixed HTTPS self-onboarding destination | component | `npm test -- --run src/test/haoo-page.test.tsx` | ❌ W0 | ⬜ pending |
| TBD-11 | TBD | TBD | ONBD-05 | T-01-05 | Native links have no analytics, storage, form, or PDF precondition | component | `npm test -- --run src/test/haoo-page.test.tsx` | ❌ W0 | ⬜ pending |
| TBD-12 | TBD | TBD | QUAL-04 | — | Built product route and PDF asset are directly servable | build contract/smoke | `npm run build && npm test -- --run src/test/build-output.test.ts` | ❌ W0 | ⬜ pending |
| TBD-13 | TBD | TBD | QUAL-06 | — | Exact brochure claims, contacts, brand casing, and PDF checksum are preserved | unit/build contract | `npm test -- --run src/test/haoo-content.test.ts src/test/build-output.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install exact test packages: `vitest@3.2.4`, `jsdom@26.1.0`, `@testing-library/react@16.3.2`, and their required peer packages after package-legitimacy review.
- [ ] Add `vitest.config.ts` with `environment: 'jsdom'` and `setupFiles: ['./src/test/setup.ts']`.
- [ ] Add `src/test/setup.ts` with explicit Testing Library cleanup from Vitest `afterEach`.
- [ ] Add package script `test: vitest run`.
- [ ] Add `src/test/products-section.test.tsx` for PROD-01 and PROD-06.
- [ ] Add `src/test/haoo-page.test.tsx` for PROD-03, PROD-04, and ONBD-01 through ONBD-05.
- [ ] Add `src/test/haoo-content.test.ts` for centralized facts, link grammar, uppercase `ZERO-PAPER HUB`, and QUAL-06.
- [ ] Add `src/test/build-output.test.ts` for the physical route, metadata, published assets, and PDF checksum.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Browser renders the embedded PDF on a capable desktop browser and shows the branded fallback when embedding is unavailable | PROD-04 | Browser PDF support cannot be represented reliably by jsdom | Open the built HAOO page in a desktop browser; verify the object preview and both controls, then disable PDF handling or inspect fallback content and verify both controls remain usable. |
| Local preview serves direct product and PDF URLs successfully | QUAL-04 | Requires an HTTP server process and browser/server boundary | Run `npm run build && npm run preview`, then request `/products/haoo/` and the published brochure path and verify HTTP success plus correct content types. |
| Product and social-image crop remain usable at supported viewport widths | PROD-03, PROD-05 | Visual composition requires rendered-browser inspection | Inspect the HAOO page and metadata preview asset at representative mobile and desktop widths; confirm no essential text/action is clipped. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30 seconds
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
