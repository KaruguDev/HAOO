# Phase 05 — Deferred Items

Items found or handed on during Phase 05 that no plan in this phase fixes. Each entry names where it
came from and why it is recorded here rather than fixed.

## G-1: the disjointness auditor accepts a stale allowlist entry

- **Recorded by:** 05-15 (`05-15-SUMMARY.md`, "G-1, handed to 05-14").
- **Routed here by:** 05-14, Task 1 (`05-EVIDENCE-AXE.md` §8.3).
- **What it is:** `scripts/verify-tree-disjointness.mjs` exits 0 when `allowlist subtracted` is less
  than `allowlist entries`, which means an allowlist entry is no longer shared by both trees. The
  CI `cmp` step in `.github/workflows/verify-split.yml` catches the two allowlists disagreeing. It
  does not catch a stale entry that both lists still carry.
- **Why it is not fixed in 05-14:** it is not an accessibility finding. The auditor is byte-identical
  in HAOO and ZERO-PAPER HUB (`cmp` exit 0 on 2026-09-12), so the fix is a paired commit in both
  repositories, outside 05-14's file list. No evidence in 05-14 forces a ZERO-PAPER HUB commit
  (05-CONTEXT D-03).
- **What a fix involves:** make the auditor exit non-zero when `allowlist subtracted` is not equal
  to `allowlist entries`, and apply the same change to both copies so `cmp` stays 0.
- **Current measured state:** 26 shared, 26 allowlist entries, 26 subtracted, 0 violations. No
  stale entry exists today.

## CSS-O1: Phase 1 test-name markers ship as rules in the production stylesheet

- **Recorded by:** the orchestrator, during the post-05-14 deploy check on 2026-09-12 at 20:40:39Z.
- **What it is:** the live stylesheet `/assets/haoo-BYmxvBcM.css` contains three Tailwind
  arbitrary-property rules generated from test names, not from product markup:
  `.\[phase1-red\:page\]{phase1-red:page}`, `.\[phase1-red\:content\]{phase1-red:content}`
  and `.\[phase1-red\:build\]{phase1-red:build}`. A local `dist/` build of the same tree carries the
  same three rules.
- **Where it comes from:** `tailwind.config.js` scans `./src/**/*.{js,ts,jsx,tsx}`, which includes
  `src/test/`. The markers live in test names at `src/test/haoo-page.test.tsx:31`,
  `src/test/haoo-content.test.ts:37` and `src/test/build-output.test.ts:576`, and
  `scripts/assert-phase1-contracts.mjs` greps the test output for them, so the test names themselves
  must keep that spelling.
- **Effect today:** each rule's declaration is not a valid CSS property, so browsers discard it and
  nothing renders differently. The cost is test-only text in the shipped artefact.
- **Why it is not fixed in this phase:** it predates Phase 5. `tailwind.config.js` is not in the file
  list of any remaining Phase 5 plan, and a fix changes the production CSS, so it needs its own
  deploy before 05-17's final live run.
- **What a fix involves:** exclude the test tree from Tailwind's content scan (for example, add
  `'!./src/test/**'` to `content`), confirm the three rules are absent from a fresh `dist/` build and
  that no product class disappears, then deploy.
- **ZERO-PAPER HUB:** not checked by build: ZERO-PAPER HUB's Tailwind content glob reads `['./index.html', './src/**/*.{js,ts,jsx,tsx}']`, and its `src/` markers are: src/test/build-output.test.ts:43: * | `[phase1-red:build] emits a physical nested HAOO document` | `[phase1-red:build] emits a physical HAOO document at its published path` |
src/test/products-section.test.tsx:35:  it('[phase1-red:products] omits the Products landmark when the collection is empty', () => {. Whether its production CSS carries the same rules was not measured.
