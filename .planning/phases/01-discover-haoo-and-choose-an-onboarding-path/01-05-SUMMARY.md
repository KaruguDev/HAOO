---
phase: 01-discover-haoo-and-choose-an-onboarding-path
plan: 05
subsystem: ui
tags: [react, pdf, progressive-enhancement, static-assets, accessibility, tdd, github-pages, vite]

requires:
  - phase: 01-02
    provides: Physical `/products/haoo/` route, static product metadata head, and the `#brochure` section placeholder this plan fills
  - phase: 01-03
    provides: Centralized `ProductDefinition`/`ProductBrochure` contracts and the product-agnostic `ProductPage` shell with the complete guided overview
  - phase: 01-04
    provides: Published `brochure-preview.png` plus the `previewImageAlt`/`previewImageWidth`/`previewImageHeight` brochure fields the compact panel consumes
provides:
  - Original HAOO brochure published byte-faithful at `/products/haoo/HAOO-Marketing-Brochure.pdf` (SHA-256 `38d5ad8e…`)
  - `BrochurePanel` with a compact below-`lg` preview, an `lg`-only `<object type="application/pdf">`, and branded recovery copy for both failure modes
  - Independent sibling `Open brochure` / `Download brochure` native anchors that survive every embed, media, and activation state
  - Static `<link rel="alternate" type="application/pdf">` making the brochure reachable with JavaScript unavailable
  - Artifact-integrity contracts asserting every root-relative product reference resolves inside the exact `dist` tree GitHub Pages uploads
  - Proven QUAL-04 production-host evidence for both canonical URLs
affects: [phase-1-verification, 02-lead-capture, 05-release-verification]

actuals:
  tokens: 5500
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - Progressive PDF enhancement: compact preview at small widths, `<object>` attempt at `lg`, and a branded child fallback — never a spinner or a blocked action
    - Recovery copy is one-to-one with its state; no two fallback strings may coexist in the DOM
    - Independence proven structurally (no shared mutable state) and asserted by `outerHTML` byte-equality, not by clicking through native navigations
    - Artifact integrity asserted by walking the built `dist` tree rather than trusting source references

key-files:
  created:
    - public/products/haoo/HAOO-Marketing-Brochure.pdf
    - src/components/BrochurePanel.tsx
  modified:
    - src/products/haoo.ts
    - src/pages/ProductPage.tsx
    - products/haoo/index.html
    - src/test/haoo-page.test.tsx
    - src/test/build-output.test.ts

key-decisions:
  - "Locked recovery copy maps one-to-one onto states and is never duplicated in the DOM: the `<object>` child fallback owns unsupported embedding, the compact panel owns absent/failed preview media."
  - "One shared control row, not per-layout duplicates — Open and Download render once as siblings outside the embed and stay visible in every layout and failure state."
  - "Control independence is proven structurally rather than by activation: `BrochurePanel` holds only a preview-error flag and the controls read and write nothing."
  - "The brochure is declared as a static `<link rel=\"alternate\" type=\"application/pdf\">` in the product document head so it is reachable with JavaScript unavailable."
  - "The partial-media contract now clears both `media` and `brochure.previewImageHref` and additionally asserts Open and Download survive total media loss."

patterns-established:
  - "State-to-copy uniqueness: each failure state owns exactly one recovery string, keeping every `getByText` unambiguous."
  - "Structural independence: sibling native anchors with no shared state replace any orchestrating handler, so no activation can serialize or disable another."
  - "Artifact walk: build contracts enumerate the real `dist` tree and the emitted bundle, so a reference can never dangle silently."

requirements-completed: [PROD-04, QUAL-04, QUAL-06]

coverage:
  - id: D1
    description: "The original supplied PDF is published byte-for-byte at `/products/haoo/HAOO-Marketing-Brochure.pdf` and survives the build with SHA-256 `38d5ad8e7497c65c4fa2d374e7ed5e8d81ab79f3b25d1e0daa73321d45b9e7a6` identical across the canonical source, `public/`, and `dist/`."
    requirement: PROD-04
    verification:
      - kind: integration
        ref: "src/test/build-output.test.ts#publishes the original brochure bytes at the public and built paths"
        status: pass
      - kind: other
        ref: "sha256sum <canonical source> public/products/haoo/HAOO-Marketing-Brochure.pdf dist/products/haoo/HAOO-Marketing-Brochure.pdf"
        status: pass
    human_judgment: false
  - id: D2
    description: "The brochure section renders after the complete guided overview and before the final onboarding block, keeping the semantic HTML the primary accessible explanation (D-05)."
    requirement: PROD-04
    verification:
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#places the brochure after the complete guided overview and before the final onboarding block"
        status: pass
    human_judgment: false
  - id: D3
    description: "Below `lg` visitors get a compact supplied preview with obvious actions; at `lg` the page attempts an `<object type=\"application/pdf\">`; the controls render outside the object in both layouts (D-06, D-08)."
    requirement: PROD-04
    verification:
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#renders a compact preview below lg, a lg-only PDF object, and controls outside the object"
        status: pass
    human_judgment: false
  - id: D4
    description: "Exact branded recovery copy renders for each failure mode — `Brochure preview unavailable` plus recovery sentence in the object child fallback, and the compact-panel sentence when the preview is absent or fails to load — with both controls preserved in every state."
    requirement: PROD-04
    verification:
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#renders the exact preview error copy and keeps both controls when brochure media is absent"
        status: pass
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#falls back to the exact error copy when the supplied preview image fails to load"
        status: pass
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#keeps every fact and action available when partial media is omitted"
        status: pass
    human_judgment: false
  - id: D5
    description: "Open and Download are independent native navigations — repeated, interrupted, and concurrent activation leaves both controls byte-identical, so neither can disable, serialize, or alter the other (PROD-04 concurrency resolution)."
    requirement: PROD-04
    verification:
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#keeps Open and Download independent under repeated, interrupted, and concurrent activation"
        status: pass
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#keeps mobile and desktop brochure recovery plus Open and Download independent"
        status: pass
    human_judgment: false
  - id: D6
    description: "Open announces the new tab in its accessible name and carries `rel=\"noopener\"`; Download uses the native same-origin `download` attribute; `PDF · 2.1 MB` is adjacent (D-07)."
    requirement: PROD-04
    verification:
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#protects every new-tab navigation from opener control and labels it visibly"
        status: pass
      - kind: integration
        ref: "src/test/haoo-page.test.tsx#publishes the original brochure PDF facts from centralized product data"
        status: pass
    human_judgment: false
  - id: D7
    description: "The built artifact GitHub Pages uploads is self-contained: the brochure is declared as a static PDF alternate, every referenced product asset is copied into `dist`, and every root-relative `/products/haoo/*` reference in the built HTML and bundle resolves inside the artifact."
    requirement: QUAL-04
    verification:
      - kind: integration
        ref: "src/test/build-output.test.ts#declares the original brochure as a static alternate of the product document"
        status: pass
      - kind: integration
        ref: "src/test/build-output.test.ts#copies every referenced product asset into the uploaded artifact"
        status: pass
      - kind: integration
        ref: "src/test/build-output.test.ts#resolves every root-relative product reference inside the artifact"
        status: pass
      - kind: integration
        ref: "src/test/build-output.test.ts#uploads exactly the built dist tree that the Pages workflow deploys"
        status: pass
    human_judgment: false
  - id: D8
    description: "No Phase 1 product source records tracking events, writes browser storage, submits forms, injects HTML, introduces a runtime router or backend, or reads visitor context."
    requirement: QUAL-06
    verification:
      - kind: integration
        ref: "src/test/build-output.test.ts#keeps the Phase 1 product surface free of tracking, storage, injection, and backend seams"
        status: pass
    human_judgment: false
  - id: D9
    description: "Both canonical production URLs survive direct navigation and hard refresh on the deployed host: `/products/haoo/` returns the HAOO document (not a home-page fallback) and the brochure returns the original PDF as `application/pdf` with the canonical checksum."
    requirement: QUAL-04
    verification:
      - kind: manual_procedural
        ref: "curl -fsSI https://www.zero-paperhub.com/products/haoo/ && curl -fsSI https://www.zero-paperhub.com/products/haoo/HAOO-Marketing-Brochure.pdf (Pages deploy run 33248331781)"
        status: pass
      - kind: manual_procedural
        ref: "production sha256sum = 38d5ad8e7497c65c4fa2d374e7ed5e8d81ab79f3b25d1e0daa73321d45b9e7a6"
        status: pass
    human_judgment: true
    rationale: "Production-host behavior cannot be asserted from the repository — it required an authorized GitHub Pages deployment and live requests against www.zero-paperhub.com. Proven at the blocking-human Task 3 checkpoint; recorded here for the audit trail rather than auto-passed."
  - id: D10
    description: "At mobile and desktop widths the section order, compact-versus-object presentation, 44px targets, visible focus, preserved preview aspect ratio, and 320px/200%-zoom reflow read correctly with no horizontal page scrolling."
    requirement: PROD-04
    verification: []
    human_judgment: true
    rationale: "jsdom applies no CSS, so the `lg:hidden`/`hidden lg:block` responsive split, focus visibility, and zoom reflow cannot be proven by the automated suite. Carried into the end-of-phase UAT batch (`human_verify_mode: end-of-phase`)."

duration: 16 min
completed: 2026-08-29
status: complete
---

# Phase 01 Plan 05: Original Brochure and Production Proof Summary

**The byte-faithful HAOO brochure published behind a progressively enhanced panel — compact preview below `lg`, `<object>` attempt at `lg`, branded recovery copy for both failure modes, and independent Open/Download anchors — sealed by artifact-integrity contracts and proven live on `www.zero-paperhub.com`.**

## Performance

- **Duration:** 16 min (including a ~4 min blocking-human checkpoint wait at Task 3)
- **Started:** 2026-08-29T10:29:00Z
- **Halted at checkpoint:** 2026-08-29T10:36:49Z
- **Completed:** 2026-08-29T10:45:00Z
- **Tasks:** 3 (2 TDD, 1 blocking-human checkpoint)
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments

- Published the canonical supplied PDF unchanged at `public/products/haoo/HAOO-Marketing-Brochure.pdf`; SHA-256 `38d5ad8e7497c65c4fa2d374e7ed5e8d81ab79f3b25d1e0daa73321d45b9e7a6` is identical across the canonical source, the `public/` copy, the `dist/` copy, and the deployed production asset.
- Built `BrochurePanel`: a compact landscape preview below `lg` (never a tall inline document viewer), an `lg`-only `<object type="application/pdf">` whose child fallback carries the exact branded recovery copy, and a shared control row of native `Open brochure` / `Download brochure` anchors that lives outside the embed in every layout and every failure state.
- Filled the last 01-04 stubs in `HAOO_PRODUCT.brochure` — `pdfHref`, `downloadName`, and `expectationLabel` moved from `#brochure-pending` placeholders to the published asset facts and the locked `PDF · 2.1 MB` label.
- Expanded the build contract from "the HTML exists" to "the uploaded artifact is self-contained": it now walks the emitted `dist/assets` bundle, asserts every `/products/haoo/*` reference discovered in the built HTML or bundle resolves on disk, confirms the Pages workflow uploads `./dist` against the `www.zero-paperhub.com` CNAME, and scans all eight Phase 1 product sources for tracking, storage, form, injection, router, and backend seams.
- Closed QUAL-04 on the production host: after the authorized Pages deployment both canonical URLs return success with the correct content types, the production PDF checksum matches the canonical source, and neither URL falls back to the home document.

## Task Commits

1. **Task 1 RED: brochure preview, fallback, and control-independence contracts** — `8208c5d` (test)
2. **Task 1 GREEN: original brochure published with responsive access controls** — `f3df1f6` (feat)
3. **Task 2 RED: artifact-integrity and static-boundary contracts** — `21c7242` (test)
4. **Task 2 GREEN: original brochure declared as a static PDF alternate** — `a2a6df7` (feat)
5. **Task 3 halt record: blocking-human QUAL-04 checkpoint** — `381deb6` (docs)

**Plan metadata:** see the `docs(01-05)` commit that carries this summary.

_Task 3 was a `checkpoint:human-verify` with `gate="blocking-human"` — it produced no code commit. The halt was recorded in STATE.md before pausing, and this summary records its resolution._

## Files Created/Modified

- `public/products/haoo/HAOO-Marketing-Brochure.pdf` — The canonical supplied brochure, copied byte-for-byte (2,160,873 bytes).
- `src/components/BrochurePanel.tsx` — Responsive preview/object/fallback with independent native controls. Holds a single `previewFailed` flag; the controls read and write nothing.
- `src/products/haoo.ts` — `brochure.pdfHref`, `downloadName`, and `expectationLabel` filled with the published asset facts.
- `src/pages/ProductPage.tsx` — `#brochure` section now carries the lead sentence positioning the HTML overview as the complete explanation, plus `BrochurePanel`; heading aligned to the shared `headingClasses`.
- `products/haoo/index.html` — Added the `<link rel="alternate" type="application/pdf">` declaration (see Deviation 1).
- `src/test/haoo-page.test.tsx` — Six new brochure contracts covering PDF facts, section placement, responsive split, both recovery states, activation independence, and opener protection.
- `src/test/build-output.test.ts` — Five new artifact contracts: PDF alternate declaration, asset copying, reference resolution, Pages upload boundary, and the static-boundary source scan.

## Decisions Made

- **Locked copy maps one-to-one onto states and is never duplicated in the DOM.** The `<object>` child fallback carries `Brochure preview unavailable` plus `You can still open the HAOO brochure in a new tab or download the PDF.` (unsupported embedding); the compact panel carries `We couldn't show the brochure preview here. Open the brochure or download the PDF instead.` (absent or failed preview image). Both strings coexisting would have made every `getByText` in the contract ambiguous, so each state owns exactly one string.
- **One shared control row, not per-layout duplicates.** Open and Download render once as siblings outside the embed and stay visible in every layout and failure state. This keeps accessible names unique and satisfies D-07 without duplicating anchors across the `lg:hidden` and `hidden lg:block` branches.
- **Independence proven structurally, not by clicking through.** `BrochurePanel` holds only a preview-error flag; the controls read and write nothing. The contract interleaves six Open/Download activations and asserts the controls' `outerHTML` is byte-identical afterward, so nothing can disable, serialize, or alter anything else. Asserting on native navigation side effects would have proven jsdom's behavior, not the component's.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Built HTML did not reference the published brochure**
- **Found during:** Task 2 (artifact-integrity contracts)
- **Issue:** The Wave 0 contract at `src/test/build-output.test.ts:76` requires the built product document to contain `/products/haoo/HAOO-Marketing-Brochure.pdf`, but the href lives in centralized product data consumed by the JS bundle, so it never reached the static head. The assertion could not pass from `BrochurePanel` alone.
- **Fix:** Added one line to `products/haoo/index.html` — a file no task listed — declaring the PDF as an alternate representation of the document: `<link rel="alternate" type="application/pdf" href="/products/haoo/HAOO-Marketing-Brochure.pdf" title="HAOO Marketing Brochure (PDF)" />`. This is the semantically correct fix rather than a test accommodation: it satisfies the contract *and* makes the brochure reachable with JavaScript unavailable, which the phase's progressive-enhancement posture requires.
- **Files modified:** `products/haoo/index.html`, `src/test/build-output.test.ts`
- **Verification:** `declares the original brochure as a static alternate of the product document` asserts the exact link in both the source and built HTML; the original Wave 0 assertion passes.
- **Committed in:** `a2a6df7` (Task 2 commit)

**2. [Rule 3 - Blocking] Partial-media contract collided with the new brochure preview**
- **Found during:** Task 1 (brochure panel implementation)
- **Issue:** The passing test `keeps every fact and action available when partial media is omitted` asserted `queryAllByRole('img')` is empty while clearing only `media`. The brochure preview is optional media sourced from `brochure.previewImageHref`, not `media`, so it survived that clearing and the previously-green contract went red.
- **Fix:** The test now clears both `media` and `brochure.previewImageHref`, and additionally asserts that Open and Download persist through total media loss. Net stronger: the contract went from "no images when `media` is empty" to "no images and both brochure actions still reachable when *all* optional media is gone", which is the ONBD-05 independence guarantee.
- **Files modified:** `src/test/haoo-page.test.tsx`
- **Verification:** The contract passes with both media sources cleared and asserts the Open href and the Download `download` attribute.
- **Committed in:** `8208c5d` (Task 1 RED commit)

---

**Total deviations:** 2 auto-fixed (both blocking)
**Impact on plan:** Both were required to make this plan's own stated contracts satisfiable, and each strengthened rather than relaxed the assertion it touched. One file outside the task `<files>` list was modified (`products/haoo/index.html`, one line). No scope creep.

## Verification Results

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npx eslint .` | pass (exit 0, no warnings) |
| `npm run build` | pass — `dist/products/haoo/index.html` 2.01 kB plus the full product asset set |
| `npm test` | **44 passed / 0 failed** across 4 test files |
| `sha256sum` canonical vs `public/` vs `dist/` | identical — `38d5ad8e7497c65c4fa2d374e7ed5e8d81ab79f3b25d1e0daa73321d45b9e7a6` |
| Published PDF size | 2,160,873 bytes |

The two contracts left failing at the end of 01-04 (`publishes the original brochure bytes at the public and built paths` and `keeps mobile and desktop brochure recovery plus Open and Download independent`) are now green. Phase 1 has no failing tests.

## QUAL-04 Production Evidence (Task 3)

Task 3 was a `checkpoint:human-verify` with `gate="blocking-human"`. It held correctly: **before deployment both URLs returned HTTP 404**, so the checkpoint could not have been auto-approved and QUAL-04 could not have been claimed from local evidence alone. The gate did its job.

The 40 local phase commits were then pushed to `origin/main` (`5996aa4..381deb6`), triggering the GitHub Pages workflow `.github/workflows/deploy.yml`. **Run `33248331781` completed successfully.** The recorded production evidence:

```
https://www.zero-paperhub.com/products/haoo/
  → HTTP/2 200, content-type: text/html; charset=utf-8
  → last-modified: Sat, 29 Aug 2026 10:39:52 GMT, etag "6a92b6f8-7e2"
  → <title>HAOO Property Management | ZERO-PAPER HUB</title>  (the HAOO document, NOT a home-page fallback)
  → contains <link rel="alternate" type="application/pdf" href="/products/haoo/HAOO-Marketing-Brochure.pdf" title="HAOO Marketing Brochure (PDF)" />

https://www.zero-paperhub.com/products/haoo/HAOO-Marketing-Brochure.pdf
  → HTTP/2 200, content-type: application/pdf
  → last-modified: Sat, 29 Aug 2026 10:39:52 GMT, etag "6a92b6f8-20f8e9"
  → size 2160873 bytes
  → SHA-256 38d5ad8e7497c65c4fa2d374e7ed5e8d81ab79f3b25d1e0daa73321d45b9e7a6
     (identical to the canonical source, the public/ copy, and the dist/ copy)

Direct-navigation / hard-refresh equivalent: both URLs re-fetched with a cache-busting query
string and `Cache-Control: no-cache`. Both returned 200 with the same content types and sizes.
Neither fell back to the home document and neither 404'd.
```

Every clause of the QUAL-04 acceptance criterion is met: both canonical URLs survive direct navigation and hard refresh, the product URL returns HAOO HTML rather than a fallback document, the brochure returns the original PDF as `application/pdf`, and the production checksum matches the canonical source byte-for-byte.

Scope was held to the two URLs the checkpoint names. Phase 5 still owns broader cross-device, accessibility, analytics, provider, and delivery-channel release proof.

## Known Stubs

None. This plan resolved the last outstanding Phase 1 stub: `HAOO_PRODUCT.brochure.pdfHref`, `downloadName`, and `expectationLabel` are no longer `#brochure-pending` placeholders. Broken-windows ledger entries **3** (`src/pages/ProductPage.tsx` Wave 0 placeholder landmarks) and **6** (`src/products/haoo.ts` brochure placeholders) are marked `fixed`.

## Threat Flags

None. The plan's registered threats were mitigated as planned:

| Threat | Mitigation evidence |
|---|---|
| T-01-15 Tampering — published brochure | Canonical bytes copied unchanged; SHA-256 asserted on the `public/` and `dist/` copies and confirmed on the production asset. |
| T-01-16 Elevation of privilege — new-tab Open | `rel="noopener"` on every `target="_blank"` anchor, asserted by `protects every new-tab navigation from opener control and labels it visibly`. No opener-dependent script exists. |
| T-01-17 Denial of service — browser PDF embedding | Compact preview below `lg`, `<object>` child fallback at `lg`, and unconditional sibling Open/Download anchors that no failure state removes. |
| T-01-18 Tampering — route/static assets | Post-build existence, reference-resolution, and checksum checks against the exact uploaded `dist` tree, plus the Pages upload-path assertion. |
| T-01-19 Information disclosure — Phase 1 interaction | Static-boundary scan across all eight product sources rejects tracking, storage, cookies, fetch/beacon, forms, routers, `document.referrer`/`navigator.userAgent`/`window.location`, and Supabase. |

No new security-relevant surface was introduced beyond the threat model: the only added network-reachable artifact is a public read-only PDF, already registered as T-01-15.

## Issues Encountered

- **Stale open ledger entries from earlier plans (not fixed — out of scope).** Broken-windows entries **1** (`src/products/haoo.ts` Wave 0 typed placeholders, resolved by 01-02/01-03) and **2** (`src/components/ProductsSection.tsx` Wave 0 placeholder landmark, resolved by 01-04) still read `open` although the code that resolved them has shipped. They belong to other plans, so this plan did not close them. Phase verification should confirm and mark them `fixed`, or `/gsd-ship` will be blocked by two already-resolved defects.

## TDD Gate Compliance

| Task | RED | GREEN | REFACTOR | Status |
|------|-----|-------|----------|--------|
| 1 | `8208c5d` | `f3df1f6` | not needed | Pass |
| 2 | `21c7242` | `a2a6df7` | not needed | Pass |
| 3 | n/a — checkpoint task, no code | n/a | n/a | Pass (gate held, then satisfied) |

Both RED commits were confirmed failing before implementation. Following the repository convention established in `9ce023b`, RED commits name the API surface before it exists, so `npm run typecheck` was transiently red at `8208c5d` (`BrochurePanel` not yet created) and green again at `f3df1f6`.

## User Setup Required

None — no external service configuration required. The GitHub Pages deployment used the project's existing authorized workflow.

## Next Phase Readiness

- **Phase 1 code is complete.** All 5 plans have summaries, all 44 tests pass, and typecheck, lint, and build are green at HEAD.
- **QUAL-04 is proven on the production host**, so Phase 1's only blocking-human gate is cleared. The STATE.md blocker recorded in `381deb6` is removed by this plan.
- **Ready for `/gsd-verify-work 01`.** The outstanding UAT batch is the accumulated visual/responsive human checks that jsdom cannot assert: the desktop 5/7 home-card balance and mobile copy-before-image order (01-04), and this plan's compact-versus-object brochure presentation, 44px targets, visible focus, preserved preview aspect ratio, and 320px/200%-zoom reflow with no horizontal scrolling (D10 above).
- **Ledger cleanup needed before `/gsd-ship`:** two stale `open` entries from earlier plans, detailed under Issues Encountered.

---
*Phase: 01-discover-haoo-and-choose-an-onboarding-path*
*Completed: 2026-08-29*

## Self-Check: PASSED

- Both created files verified present on disk: `public/products/haoo/HAOO-Marketing-Brochure.pdf` (2,160,873 bytes, canonical SHA-256) and `src/components/BrochurePanel.tsx`; all 5 modified files verified present and tracked.
- All 5 plan commits verified in git history: `8208c5d`, `f3df1f6`, `21c7242`, `a2a6df7`, `381deb6`.
- `npm run typecheck`, `npx eslint .`, `npm run build`, and `npm test` all re-run at HEAD after the checkpoint: green, 44 passed / 0 failed.
- Production evidence recorded verbatim from the Task 3 checkpoint resolution; no measurement was re-derived or re-worded, and none was fabricated (this executor has no network access).
- Working tree clean except the pre-existing untracked `.gsd/` and `.planning/milestone.lock`, which are outside this plan's scope and were left untouched.
