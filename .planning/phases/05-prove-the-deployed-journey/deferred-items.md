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
- **ZERO-PAPER HUB:** the same mechanism applies. Its `tailwind.config.js` scans the same
  `./src/**/*.{js,ts,jsx,tsx}` glob, and its test tree carries `[phase1-red:build]`
  (`src/test/build-output.test.ts`) and `[phase1-red:products]` (`src/test/products-section.test.tsx:35`).
  Measured on 2026-09-12T20:56:44Z: the live stylesheet `/assets/main-CgNg8OQE.css` carries 2 such rule(s): `.[phase1-red:build]`, `.[phase1-red:products]`. A fix there is a
  ZERO-PAPER HUB commit, which 05-CONTEXT D-03 allows only when evidence forces it.

## L2-O1: the qualification form shows its sent state when FormSubmit answers `"success":"false"`

- **Recorded by:** plan 05-06, Task 2, from the single activation-trigger submission sent on
  2026-09-13 at 00:30:34.768Z (`05-EVIDENCE-MAIL.md`, Link 2).
- **What it is:** FormSubmit answered the live POST to `https://formsubmit.co/ajax/info@haoo.online`
  with HTTP 200 and the body
  `{"success":"false","message":"This form needs Activation. We've sent you an email containing an 'Activate Form' link. Just click it and your form will be actived!"}`.
  The shipped form rendered the confirmation card, focused `Your details are on their way`, and set
  the status region to `Your details were sent.`
- **Where it comes from:** `src/components/QualifyForm.tsx` sets the terminal state from
  `response.ok` alone and never reads the provider body, by design, so a provider body change
  cannot make the page claim a send. That design also means an HTTP 200 that FormSubmit uses to
  refuse delivery shows the visitor the sent state.
- **Effect today:** once the endpoint is activated, FormSubmit is expected to answer
  `"success":"true"` and the two agree. Any later deactivation, or a FormSubmit refusal reported
  with an HTTP 200, would show a real prospect the sent state for a lead that was not delivered.
- **Why it is not fixed in this phase:** it is a change to `src/`, which is outside every
  remaining Phase 5 plan boundary. It would also need its own deploy and a hermetic test for the
  refusal body.
- **What a fix involves:** decide whether the page should read FormSubmit's `success` field (a
  provider-coupled contract the current design deliberately avoids) or whether the owner report and
  the mail chain are the accepted detection path. If the page changes, add a preview-project case
  that fulfils `200 {"success":"false"}` and asserts the failure state.
