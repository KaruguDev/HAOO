# Walking Skeleton — ZERO-PAPER HUB Product Launch Platform

**Phase:** 1
**Generated:** 2026-08-29

## Capability Proven End-to-End

A visitor can follow a native link from the home-page Products section to the physical `/products/haoo/` static entry, understand the HAOO offer, and leave through an unconditional assisted or self-onboarding link.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Existing React 18 + Vite 5 + strict TypeScript + Tailwind CSS | The project already builds and deploys this stack; Phase 1 extends it rather than introducing a second frontend system. |
| Routing | Physical Vite multi-page output at `products/haoo/index.html` | GitHub Pages can serve and refresh `/products/haoo/` without a server or SPA fallback. |
| Product model | Central typed `ProductDefinition` data consumed by reusable product surfaces | One fact source keeps the home card, product page, contacts, brochure, and future product shell aligned. |
| Data layer | N/A — immutable compile-time product data and public static assets; no database read or write | Phase 1 has no backend, persistence, mutable records, or schema-bearing files. Introducing a database to satisfy a generic skeleton template would violate the locked static-site boundary. |
| Authentication | N/A | Every Phase 1 page and asset is public; account creation remains on the external HAOO platform. |
| UI interaction | Browser-native anchors for product discovery, brochure access, WhatsApp, phone, email, and self-onboarding | Native navigation remains usable without analytics, storage, forms, PDF embedding, or JavaScript readiness state. |
| Deployment target | Existing GitHub Pages artifact built into `dist/` | The repository workflow already uploads `dist`; the skeleton proves the nested HTML and assets are present and directly servable. |
| Directory layout | Physical product entry under `products/haoo/`; reusable React pages/components and typed product data under `src/`; immutable product assets under `public/products/haoo/` | The layout keeps static-host routing, shared presentation, and source-faithful assets explicit. |

## Stack Touched in Phase 1

- [x] Existing project scaffold retained; build, lint, typecheck, and exact-pinned test runner exercised
- [x] Routing — root home entry plus one real physical `/products/haoo/` entry
- [x] Database — N/A by explicit static-phase adaptation; no read/write or persistence is in scope
- [x] UI — one complete home → HAOO → assisted/self-onboarding browser-native interaction path
- [x] Deployment — `npm run build` plus local preview/direct-path checks exercise the GitHub Pages artifact shape

## Adaptation and Residual Risk

The generic walking-skeleton template assumes an API and database. This project is deliberately a static React/Vite site, so the full stack ends at the generated GitHub Pages artifact and external native links. The residual risk is host behavior: local artifact and preview checks prove the required physical files and direct paths, while Phase 1 closes QUAL-04 through a blocking post-deployment check of the product and brochure URLs. Phase 5 retains the broader cross-device, provider, accessibility, analytics, and delivery-channel release proof.

## Out of Scope (Deferred to Later Slices)

- Phase 2 qualification form and email delivery
- Phase 3 analytics, browser storage, campaign normalization, and privacy disclosure
- Phase 4 aggregate reporting and enquiry-context enrichment
- Phase 5 broader deployed-host cross-device, accessibility, provider, analytics, and mailbox proof beyond Phase 1's two-URL QUAL-04 check
- Searchable lead storage, CRM workflows, pricing/checkout, HAOO application changes, and tenant/agent acquisition funnels

## Subsequent Slice Plan

Each later phase adds one vertical slice without replacing the static MPA, centralized product model, or unconditional native onboarding seam:

- Phase 2: submit a qualified HAOO enquiry through an accessible product-specific form
- Phase 3: add privacy-bounded engagement context without gating the Phase 1 paths
- Phase 4: expose truthful aggregate funnel reporting and readable voluntary-enquiry context
- Phase 5: prove the complete deployed journey, assets, providers, and delivery channels
