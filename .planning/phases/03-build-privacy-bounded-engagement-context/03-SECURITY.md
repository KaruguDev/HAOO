---
phase: 03
slug: build-privacy-bounded-engagement-context
status: verified
threats_open: 0
asvs_level: 1
created: 2026-08-31
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| URL query → campaign memory | Untrusted query values enter bounded page memory only after whole-value validation. | Public campaign values |
| localStorage → typed context | Same-origin mutable JSON is rejected unless it matches the exact bounded schema. | Coarse engagement context |
| DOM/form state → measurement facade | Personal qualification values sit beside a deliberately name-only event seam. | Allowlisted event names only |
| measurement handlers → native actions | Optional measurement cannot replace or gate links, brochure actions, or form submission. | Bare event name / native action |
| event contract → public disclosure | Public copy must remain exhaustive as the closed event vocabulary changes. | Static disclosure copy |
| clear control → browser context | Clearing may affect only the namespaced context and page-memory copy. | `zph.haoo.ctx.v1` record |

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Information Disclosure | `track` API | high | mitigate | One-argument literal union, runtime guard, and source/bundle tests prohibit identity or property payloads. | closed |
| T-03-02 | Tampering | campaign and stored JSON | high | mitigate | Duplicate, unknown, malformed, extra, expired, and version-mismatched input is rejected wholesale. | closed |
| T-03-03 | Denial of Service | Web Storage/History/provider | medium | mitigate | Boundary operations are caught and fall back to bounded page memory or no-op behavior. | closed |
| T-03-04 | Elevation of Privilege | provider selector | high | mitigate | Closed provider selection maps only to audited code and never evaluates an arbitrary URL. | closed |
| T-03-05 | Tampering | context schema | high | mitigate | Exact-key/version/domain validation and mutation tests reject invalid records. | closed |
| T-03-06 | Information Disclosure | campaign parser | high | mitigate | A unique three-key allowlist and whole-value validation reject polluted or personal-looking values. | closed |
| T-03-07 | Information Disclosure | event/context reducer | high | mitigate | Bare-name API, exhaustive flag mapping, and form/bundle guards prevent property and lead joins. | closed |
| T-03-08 | Denial of Service | storage/history exceptions | medium | mitigate | Exception tables cover access/get/set/remove/replace failures and bounded in-memory continuation. | closed |
| T-03-09 | Information Disclosure | form instrumentation | high | mitigate | Integration assertions verify one argument and exclude form-derived values and request bodies. | closed |
| T-03-10 | Repudiation | signal cardinality | medium | mitigate | StrictMode, invalid-submit, retry, placement, and product-switch regressions pin event semantics. | closed |
| T-03-11 | Denial of Service | measurement handlers | high | mitigate | Failure containment tests require unchanged links, form behavior, and recovery. | closed |
| T-03-12 | Repudiation | disclosure/event mapping | high | mitigate | Total typed mapping and exact cardinality/order tests detect event/copy drift. | closed |
| T-03-13 | Information Disclosure | public notice | high | mitigate | Approved static copy distinguishes bounded local context, bare aggregate names, and the Phase 3 no-summary boundary. | closed |
| T-03-14 | Tampering | clear action | high | mitigate | Namespaced clearing, cross-tab reconciliation, and tests preserve form state/history and report blocked removal truthfully. | closed |
| T-03-15 | Denial of Service | disclosure/footer enhancement | medium | mitigate | Static content and native details/anchor behavior remain usable without measurement or browser APIs. | closed |
| T-03-SC | Tampering | package supply chain | high | mitigate | Phase 3 adds no dependency or package-manager action. | closed |

## Accepted Risks Log

No accepted risks.

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-31 | 16 | 16 | 0 | Codex secure-phase (ASVS L1) |

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-31
