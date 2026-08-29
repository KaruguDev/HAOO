---
phase: 01
slug: discover-haoo-and-choose-an-onboarding-path
status: verified
threats_open: 0
asvs_level: 1
created: 2026-08-29
---

# Phase 01 — Security

> Per-phase security contract consolidated from Plans 01-01 through 01-09 and verified against the implemented static-site controls.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Package registry → development toolchain | Test-only dependencies execute during installation and validation. | Public package code and lockfile metadata |
| Brochure and product facts → public React presentation | Approved source facts become public copy, media, accessible names, and routes. | Public marketing content |
| Browser → static product document | Direct requests must resolve to the physical HAOO document and emitted assets. | Public HTML, images, and PDF bytes |
| Product document → external onboarding destinations | Native links leave ZERO-PAPER HUB for WhatsApp, phone, email, and HAOO self-onboarding. | Fixed destination and fixed WhatsApp starter text |
| Source tree → generated `dist/` → GitHub Pages | Test and release decisions depend on the generated artifact matching current source. | Public static artifact tree |
| Browser capabilities → product experience | Scripting, embedded-PDF, image, keyboard, and assistive-technology support may vary. | Public content and native navigation only |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation / evidence | Status |
|-----------|----------|-----------|----------|-------------|-----------------------|--------|
| T-01-SC (01-01) | Tampering | npm development dependencies | high | mitigate | Exact pins and lockfile are recorded in `package.json`/`package-lock.json`; legitimacy checkpoint commit `17b0341` and resolved-package self-check are recorded in `01-01-SUMMARY.md`. | closed |
| T-01-01 | Tampering | contract tests | medium | mitigate | Canonical product facts and named fail-first contracts are centralized under `src/products/` and `src/test/`. | closed |
| T-01-02 | Denial of service | test command | low | accept | Test tooling is development-only; explicit npm commands surface failures without affecting the static runtime. | closed — accepted |
| T-01-03 | Spoofing | assisted/self-onboarding links | high | mitigate | Exact centralized hrefs are asserted in `src/test/haoo-content.test.ts` and rendered as visible native links. | closed |
| T-01-04 | Tampering | WhatsApp URL construction | medium | mitigate | Fixed destination and deterministic starter text are asserted by decoded equality and parameter-count contracts. | closed |
| T-01-05 | Denial of service | optional client systems | high | mitigate | Unconditional native anchors require no form, analytics, storage, or PDF state; browser UAT passed. | closed |
| T-01-06 | Information disclosure | outbound URLs | medium | mitigate | Product-source boundary tests reject tracking and visitor-context seams; WhatsApp permits only fixed `text`. | closed |
| T-01-07 | Tampering | static route/build mapping | high | mitigate | Physical Vite MPA output and emitted-route/asset assertions pass against `dist/products/haoo/`. | closed |
| T-01-08 | Tampering | brochure-derived content | high | mitigate | Exact content ledger tests, React text rendering, and human source-fidelity UAT passed. | closed |
| T-01-09 | Spoofing | parent/product relationship | medium | mitigate | Fixed uppercase parent relationship and return link are covered by page and reuse contracts. | closed |
| T-01-10 | Information disclosure | product page | low | accept | Only approved public brochure facts are presented; Phase 01 adds no collection or storage surface. | closed — accepted |
| T-01-11 | Denial of service | optional images/icons | medium | mitigate | Semantic text and actions remain complete when optional media is absent or fails. | closed |
| T-01-12 (01-04) | Tampering | product registry facts/routes | medium | mitigate | Typed product definitions, slug-derived routes, and required-data contracts fail closed. | closed |
| T-01-13 (01-04) | Spoofing | featured product card | medium | mitigate | Visible HAOO identity, supplied preview, exact parent brand, and descriptive native route are asserted. | closed |
| T-01-14 (01-04) | Denial of service | optional preview media | low | accept | Missing-preview tests prove product text and route remain usable. | closed — accepted |
| T-01-15 (01-05) | Tampering | published brochure | high | mitigate | Source and built PDF SHA-256 values are asserted in `src/test/build-output.test.ts`. | closed |
| T-01-16 (01-05) | Elevation of privilege | new-tab brochure | high | mitigate | Every new-tab brochure link carries `rel="noopener"`, covered by an attribute contract. | closed |
| T-01-17 (01-05) | Denial of service | browser PDF embedding | high | mitigate | Compact preview, object fallback, and unconditional Open/Download links passed automated and browser UAT. | closed |
| T-01-18 (01-05) | Tampering | route/static assets | high | mitigate | Post-build existence, reference, freshness, and checksum checks run against the deployed `dist` tree. | closed |
| T-01-19 (01-05) | Information disclosure | Phase 01 interaction | medium | mitigate | Static-boundary scan rejects tracking, storage, fetch, forms, visitor context, and Supabase use in product sources. | closed |
| T-01-12 (01-06) | Denial of service | dark-surface focus ring | high | mitigate | White focus ring measures 14.05:1 on navy; all product focus pairings are gated at 3:1. | closed |
| T-01-13 (01-06) | Tampering | focus utility strings | medium | mitigate | `src/test/focus-contrast.test.ts` scans known sources and fails on unknown tokens or vacuous extraction. | closed |
| T-01-14 (01-06) | Denial of service | Products anchor under fixed header | medium | mitigate | Responsive scroll margin is asserted and browser UAT passed both header states. | closed |
| T-01-15 (01-06) | Repudiation | focus-contrast gate | medium | mitigate | Descriptor-less prohibition and mutation-resistant assertions prevent silent weakening. | closed |
| T-01-16 (01-07) | Tampering | brochure copy builders | high | mitigate | Builder output is asserted against shipped HAOO strings while prior HAOO acceptance assertions remain unchanged. | closed |
| T-01-17 (01-07) | Spoofing | parent brand rendering | medium | mitigate | `ZERO-PAPER HUB` remains a fixed uppercase literal in the relationship builder. | closed |
| T-01-18 (01-07) | Denial of service | shell DOM ids | medium | mitigate | Main-content and mobile-navigation ids derive from the product slug. | closed |
| T-01-19 (01-07) | Tampering | empty product identity | medium | mitigate | Copy builders throw on empty name or slug and reuse tests cover the guard. | closed |
| T-01-20 | Information disclosure | product copy module | low | mitigate | `src/products/copy.ts` is included in the static-boundary source scan. | closed |
| T-01-21 | Repudiation | build-output green result | high | mitigate | Missing or stale `dist` fails loudly with the offending path and timestamp. | closed |
| T-01-22 | Tampering | build-output assertions | high | mitigate | `npm test` builds first, so metadata, asset, and checksum checks use current output. | closed |
| T-01-23 | Denial of service | developer inner loop | low | accept | The full command builds for trustworthy evidence; `test:unit` remains available for a guarded fast loop. | closed — accepted |
| T-01-24 | Tampering | freshness guard | medium | mitigate | No tolerance, missing-output skip, or environment bypass exists; mutation checks exercised failure behavior. | closed |
| T-01-25 | Denial of service | onboarding without scripting | high | mitigate | Selected fallback branch exposes all reviewed destinations in `<noscript>`; JavaScript-disabled browser UAT passed. | closed |
| T-01-26 | Spoofing | duplicated static destinations | high | mitigate | Source and built fallback hrefs must equal values derived from `HAOO_PRODUCT`. | closed |
| T-01-27 | Information disclosure | fallback WhatsApp URL | medium | mitigate | Exactly one fixed `text` parameter is allowed and its decoded value is asserted exactly. | closed |
| T-01-28 | Spoofing | outbound transparency | medium | mitigate | Fallback copy discloses departure from ZERO-PAPER HUB and names `manage.haoo.online`. | closed |
| T-01-29 | Elevation of privilege | no-script markup | medium | mitigate | Region-scoped tests reject scripts, event handlers, forms, inline styles, and campaign tracking. | closed |

Repeated `T-01-SC` rows in Plans 01-06 through 01-09 are not applicable: those plans installed no packages. Reused identifiers `T-01-12` through `T-01-19` are qualified above by their source plan.

*Status: open · closed · closed — accepted*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01-01 | T-01-02 | Development-only tooling can fail locally without degrading the deployed static artifact. | Phase 01 plan approval | 2026-08-29 |
| AR-01-02 | T-01-10 | The page exposes approved public brochure facts and introduces no data-collection surface. | Phase 01 plan approval | 2026-08-29 |
| AR-01-03 | T-01-14 (01-04) | Optional preview failure leaves identity, content, and the product route usable. | Phase 01 plan approval | 2026-08-29 |
| AR-01-04 | T-01-23 | A roughly two-second full-suite build cost is acceptable; a guarded inner-loop command exists. | Phase 01 plan approval | 2026-08-29 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-29 | 38 | 38 | 0 | Codex / GSD ASVS L1 artifact verification |

The plan-authored register had zero open threats after implementation evidence and accepted-risk documentation were evaluated. Under ASVS Level 1, the GSD short-circuit permits grep-depth verification without a deeper auditor run.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / not applicable)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-29
