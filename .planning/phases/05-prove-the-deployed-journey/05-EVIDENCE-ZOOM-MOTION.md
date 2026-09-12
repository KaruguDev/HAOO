# Phase 5 — Zoom and Motion Evidence (QUAL-03)

**Plan:** 05-13. **Spec:** `e2e/zoom-motion.e2e.ts`. **Machine records:** `evidence/zoom-overflow.json`,
`evidence/zoom-content.json`, `evidence/zoom-primary-actions.json`, `evidence/zoom-clipping.json`,
`evidence/motion-suppression.json`, `evidence/motion-closed-negative.json`,
`evidence/motion-content-preserved.json`, `evidence/motion-observations.json`,
`evidence/zoom-readability-inputs.json`.

This file summarises those nine records and derives nothing new. Every number below was read from
them, under the same surface and viewport. Measured values are recorded, not verdicts. Zeros are
written wherever a count was zero.

## Provenance

| Item | Value |
|------|-------|
| Run | One run of the committed spec on `live` (21 tests), then its ZM-2 tests on `preview` (3 run, 2 skipped by design). Both used `--retries=0` |
| Retries used | 0 |
| Recorded | 2026-09-12T20:04:15Z to 2026-09-12T20:05:26Z (UTC), the first and last `recordedAt` stamps of the 24 records |
| Engine | Chromium under `@playwright/test` 1.63.0, `Desktop Chrome` device profile |
| Live build measured | `https://www.haoo.online/` serving `/assets/haoo-D1dl6F2P.js`, SHA-256 `d607c149ca785c58c5f26183852367aa52badcb02ee8bbad93e0daf136f6b508` (re-hashed 2026-09-12T19:48Z) |
| Preview build measured | `dist/` built from commit `65a612a`, which carries the 05-13 source fix (`/assets/haoo-BYmxvBcM.css`), served by `vite preview` on `http://localhost:4173` (S5) |
| Zoom method | The CSS viewport is set through the runner `viewport` option. The device scale factor stays at the profile default, because raising it scales rendering rather than layout and would exercise no reflow |
| Motion method | The runner's `reducedMotion` emulation at the browser level. No stylesheet is injected |
| Tolerance | `OVERFLOW_TOLERANCE_PX` = 1 CSS px, for subpixel rounding only |
| Records | 3 overflow, 3 content, 3 primary-action, 3 truncation, 4 motion-suppression, 2 closed-negative, 1 content-preserved, 1 observations, 4 readability-input |
| Later records in the same files | The ZM-LIVE closure (§ 2.1) appended two further runs against the deployed bundle `haoo-C1OXjuEM.js`: 25 records from the spec run before any edit (`2026-09-12T20:44Z` to `20:45Z`, which includes the retries of the two tests that broke by design), then 24 from the live and preview runs after the deletion (`20:47:41.256Z` to `20:49:18.928Z`). The tables in § 1, § 3 and § 4 still summarise the 05-13 run above and were not re-derived from those later records |

Box dimensions are rounded **down** to whole CSS px so that no cell overstates a measurement. The
unrounded values, for example 45.59, are in the records.

**Comparison with earlier plans.** 05-07, 05-08 and 05-09 measured the earlier, pre-fix build. Every
figure here comes from `haoo-D1dl6F2P.js` (live) or from the 05-13 preview build, and each table
names which.

## 1. Zoom entries (ZM-1), live build `haoo-D1dl6F2P.js`

| Entry (W×H) | Criterion label | Unmodified `scrollWidth` / `clientWidth` | Modified-page (mask-neutralised) `scrollWidth` / `clientWidth` | Escapees | Capability cards found / expected | Journey steps found / expected | Equivalent items found / expected | Primary actions meeting all five conditions / expected | Per-box truncation defects |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 640×512 | WCAG 2.2 SC 1.4.4 Resize Text (200%) | 640 / 640 | 640 / 640 | 0 | 6 / 6 | 4 / 4 | 10 / 10 | 8 / 8 | 0 |
| 720×450 | WCAG 2.2 SC 1.4.4 Resize Text (200%) | 720 / 720 | 720 / 720 | 0 | 6 / 6 | 4 / 4 | 10 / 10 | 8 / 8 | 0 |
| 320×256 | WCAG 2.2 SC 1.4.10 Reflow | 320 / 320 | 320 / 320 | 0 | 6 / 6 | 4 / 4 | 10 / 10 | 8 / 8 | 0 |

**Which claim each row supports.** The two halved desktop rows (640×512 and 720×450) measure a
**200% zoom claim, which belongs to the SC 1.4.4 Resize Text class**. The 320×256 row measures the
**SC 1.4.10 Reflow** claim, because 320 CSS px is the width at which that criterion is defined. **No
row is a reflow claim unless its criterion label says so.** Halving the viewport is the owner's
recorded D-09 matrix, and it measures 200% correctly. Labelling the rows is a correction of
description, not of method. The labels come from `ZOOM_VIEWPORTS` and the one criterion-bearing
`VIEWPORTS` entry in `e2e/fixtures/viewports.ts`, and every JSON record carries its label in
`detail.criterion`.

Reading the columns:

- **Overflow.** The unmodified reading is necessary but not sufficient: the root wrapper's
  `overflow-x-hidden` absorbs escaping content (F2). The escapee count comes from the per-element
  sweep on the unmodified page, which is the load-bearing reading. The modified-page reading is
  taken last, on a page with `overflow-x: visible` forced, and carries the mode marker
  `mask-neutralised`.
- **Content.** SS-4 counts re-run through `e2e/fixtures/brochure-equivalence.ts`. At each entry,
  10 of 10 expected titles are exposed as visible level-3 headings, and 10 of 10 descriptions are
  visible exactly once. The equivalent has 10 items (6 capabilities and 4 journey steps). See
  deviation note D-1 below on the plan's "10 capabilities".
- **Function.** VC-2 re-runs through `e2e/fixtures/targets.ts` `measureAction`, on P1–P8. Each action
  must have a non-empty accessible name, be visible, lie inside the horizontal extent, measure at
  least 44 × 44, be enabled and receive the pointer.
- **Truncation.** Each box is held to `scrollWidth <= clientWidth + 1` on its own box: 18 primary-action
  boxes and 25 rendered `h1`/`h2`/`h3` boxes at every entry. The largest `scrollWidth − clientWidth`
  read was 0 and the smallest client width was 192. One heading had no layout box at any entry and
  was not measured: `Brochure preview unavailable`, the preview-failure heading, which renders only in
  that state.

### Smallest primary-action box per entry (live)

| Action | 640×512 | 720×450 | 320×256 | Instances found / declared |
|---|---:|---:|---:|---:|
| P1 Open brochure | 592×45 | 672×45 | 288×45 | 1 / 1 |
| P2 Download brochure | 592×45 | 672×45 | 288×45 | 1 / 1 |
| P3 Send my details | 510×44 | 510×44 | 238×44 | 1 / 1 |
| P4 WhatsApp | 544×44 | 624×44 | 240×63 | 3 / 3 |
| P5 Call | 544×44 | 624×44 | 240×44 | 3 / 4 |
| P6 Email | 544×44 | 624×44 | 240×44 | 3 / 4 |
| P7 Start with HAOO | 542×45 | 622×45 | 238×45 | 3 / 3 |
| P8 Send your details instead | 192×44 | 192×44 | 192×44 | 3 / 3 |

**Known fixture gap, recorded and not edited.** P5 and P6 declare 4 instances, but the page ships 3
under those names at every entry. The footer link is named by the bare value, as 05-08 recorded.
Every instance found was reachable.

## 2. Reduced motion (ZM-2)

All ZM-2 readings were taken at the profile viewport, 1280×720.

### 2a. The one shipped transition, on the first capability card

| Reading | Live `haoo-D1dl6F2P.js`, reduce | Preview (05-13 fix), reduce | Live, no-preference (control) | Preview, no-preference (control) |
|---|---|---|---|---|
| `transition-property` | `none` | `none` | `transform` | `transform` |
| `transition-duration` | `0.2s` | `0.2s` | `0.2s` | `0.2s` |
| `transform` before hover | `none` | `none` | `none` | `none` |
| `transform` after hover (500 ms settle) | `matrix(1, 0, 0, 1, 0, -4)` | `none` | `matrix(1, 0, 0, 1, 0, -4)` | `matrix(1, 0, 0, 1, 0, -4)` |
| `translate` before / after | `none` / `none` | `none` / `none` | `none` / `none` | `none` / `none` |
| `:hover` matched before / after | 0 of 1 / 1 of 1 | 0 of 1 / 1 of 1 | 0 of 1 / 1 of 1 | 0 of 1 / 1 of 1 |
| `(prefers-reduced-motion: reduce)` matches | 1 of 1 | 1 of 1 | not read | not read |
| Capability items | 6 | 6 | 6 | 6 |
| Held to | registered deployed value ZM-LIVE-1 in this run; the ZM-2a contract, unconditionally, since the closure (§ 2.1) | the ZM-2a contract, unconditionally | transform must change | transform must change |

### 2b. The closed negative

| Reading | Live `haoo-D1dl6F2P.js`, reduce | Preview (05-13 fix), reduce |
|---|---|---|
| Elements matching `[class*="animate-"]` | 0 | 0 |
| `html` computed `scroll-behavior` | `smooth` | `auto` |
| `body` computed `scroll-behavior` | `auto` | `auto` |
| `document.getAnimations().length` (recorded, not asserted) | 0 | 0 |
| Elements with a runnable transition (recorded, not asserted) | 0 | 0 |
| `html` held to | registered deployed value ZM-LIVE-2 in this run; the ZM-2b contract, unconditionally, since the closure (§ 2.1) | the ZM-2b contract, unconditionally |

### 2c. Nothing disappears with the motion (live, reduce)

| Reading | Value |
|---|---:|
| Capability cards found / expected | 6 / 6 |
| Journey steps found / expected | 4 / 4 |
| Equivalent items found / expected | 10 / 10 |
| Titles exposed as visible level-3 headings | 10 |
| Descriptions visible exactly once | 10 |
| Missing or hidden items | 0 |
| Primary actions meeting all five conditions / expected | 8 / 8 |
| Primary-action defects | 0 |

### Two live divergences found, fixed in source, and closed by the deploy (§ 2.1)

- **ZM-LIVE-1: hovering moves the card with reduced motion requested.** The shipped class list was
  `transition-transform duration-200 hover:-translate-y-1 motion-reduce:transform-none
  motion-reduce:transition-none`. The transition guard takes effect, and `transition-property`
  computes `none`. The transform guard does not. `.hover\:-translate-y-1:hover` (class plus
  pseudo-class) out-specifies the media-wrapped `.motion-reduce\:transform-none` (class only), so
  the card jumps 4 px instead of animating, but it still moves. **Fix:** `src/pages/ProductPage.tsx`
  now uses `motion-safe:hover:-translate-y-1`, and the ineffective guard is removed. The rebuilt
  CSS contains 0 occurrences of `motion-reduce\:transform-none`.
- **ZM-LIVE-2: smooth scrolling with reduced motion requested.** `src/index.css` shipped an
  unguarded `html { scroll-behavior: smooth; }`. **Fix:** the rule now sits inside
  `@media (prefers-reduced-motion: no-preference)`. The rebuilt CSS reads
  `@media (prefers-reduced-motion: no-preference){html{scroll-behavior:smooth}}`.

Both fixes are in commit `65a612a`, and the preview columns above measure them.

### 2.1 FINDINGS ZM-LIVE-1 and ZM-LIVE-2: CLOSED by deployment, 2026-09-12

**Pre-deploy reading (live bundle `haoo-D1dl6F2P.js`, the 05-13 run above).** With reduced motion
requested, the deployed page read the two values below. The spec held them as registered deploy lag
rather than accepting them.

| Finding | Reading | Deployed value | Contract | Fix in `65a612a` |
|---|---|---|---|---|
| ZM-LIVE-1 | first capability card `transform` after hover (500 ms settle) | `matrix(1, 0, 0, 1, 0, -4)` | equal to the reading before hover, `none` | `src/pages/ProductPage.tsx`: `motion-safe:hover:-translate-y-1` |
| ZM-LIVE-2 | `html` computed `scroll-behavior` | `smooth` | not `smooth` | `src/index.css`: the rule sits inside `@media (prefers-reduced-motion: no-preference)` |

| Reading | Value |
|---|---|
| fix commit | `65a612a`: `fix(05-13): make the capability-card hover and smooth scrolling honour reduced motion` |
| live bundle measured | `/assets/haoo-D1dl6F2P.js`, SHA-256 `d607c149ca785c58c5f26183852367aa52badcb02ee8bbad93e0daf136f6b508` |
| raw records | `evidence/motion-suppression.json` and `evidence/motion-closed-negative.json`, the live entries between `2026-09-12T20:04:15Z` and `20:05:26Z` (the ZM-2b entry is `20:04:57.041Z`) |

#### The deploy that closed them

The divergence was a deploy lag, not a source defect, so closing it needed a push. A push is an owner
decision, and this phase's specs deliberately do not make it. **The owner chose one HAOO deploy after
05-14. On that explicit decision, the orchestrator ran `git push origin main`. This spec did not
push, and no automatic step did.**

| Reading | Value |
|---|---|
| `origin/main` before / after the push | `ea538c0` / `651eebe` |
| commits transferred | 11 |
| product-source commits in the range (`src`, `index.html`, `public`, `package.json`, the Vite, Tailwind and PostCSS configs) | 1: `65a612a` |
| `git merge-base --is-ancestor 65a612a ea538c0` | not an ancestor |
| `git merge-base --is-ancestor 65a612a origin/main` afterwards | ancestor |
| workflow `Deploy HAOO` | run `34717723054`, status `completed`, conclusion `success`, head SHA `651eebe5f29d92cf926c53e8066c9ddf6abacb34`, created `2026-09-12T20:39:23Z`, updated `20:40:28Z` (1 m 05 s) |
| workflow `Verify tree disjointness` | run `34717723047`, status `completed`, conclusion `success`, same head SHA, created `20:39:23Z`, updated `20:39:42Z` (19 s) |
| run URLs | `https://github.com/KaruguDev/HAOO/actions/runs/34717723054`, `https://github.com/KaruguDev/HAOO/actions/runs/34717723047` |

#### Post-deploy reading, re-measured independently

The readings were re-measured after the deploy, not inferred from it or taken from the
orchestrator's check. Three instruments were used: the served assets, a standalone Chromium probe
written for this closure, and the committed spec itself.

**Transport, `2026-09-12T20:45:34Z`.**

| Reading | Value |
|---|---|
| `https://www.haoo.online/` `last-modified` | `Sat, 12 Sep 2026 20:40:21 GMT` |
| JS bundle referenced and served | `/assets/haoo-C1OXjuEM.js`, SHA-256 `3a6ee0fd849f1d0f670f2dc530c0b9c1a4e26a8523ea3985eb21c92e39e51281` |
| CSS referenced and served | `/assets/haoo-BYmxvBcM.css`, SHA-256 `29f8b5bdfc9771dc6414fca33d7f47afe8f1043b45a23beaca7a7bdf68c4d13c` |
| `.motion-safe\:hover\:-translate-y-1:hover` rules in that CSS | 1, inside `@media (prefers-reduced-motion: no-preference)` |
| bare `.hover\:-translate-y-1:hover` rules | 0 |
| `motion-reduce\:transform-none` occurrences | 0 |
| `scroll-behavior:smooth` occurrences | 1, as `@media (prefers-reduced-motion: no-preference){html{scroll-behavior:smooth}}` |
| CSS from a local `npm run build` of the `651eebe` tree | `haoo-BYmxvBcM.css`, with the same SHA-256 as the served file. The local JS is `haoo-CNGGkFFJ.js`, a different hash, because the deploy workflow injects build-time variables that the local build does not |

**Standalone probe, `2026-09-12T20:46:25Z` to `20:46:33Z`.** Chromium with the `Desktop Chrome`
profile, the same first capability card and the same 500 ms settle as the spec, with emulation set
through the context's `reducedMotion` option. Every load fetched `haoo-C1OXjuEM.js` and
`haoo-BYmxvBcM.css`, each with HTTP `200`.

| Reading | reduce, load 1 (`20:46:25.030Z`) | reduce, load 2 (`20:46:27.859Z`) | reduce, load 3 (`20:46:30.791Z`) | no-preference control (`20:46:33.606Z`) |
|---|---|---|---|---|
| `(prefers-reduced-motion: reduce)` matches | 1 of 1 | 1 of 1 | 1 of 1 | 0 of 1 |
| `transition-property` | `none` | `none` | `none` | `transform` |
| `transform` before / after hover | `none` / `none` | `none` / `none` | `none` / `none` | `none` / `matrix(1, 0, 0, 1, 0, -4)` |
| `translate` before / after | `none` / `none` | `none` / `none` | `none` / `none` | `none` / `none` |
| `:hover` matched before / after | 0 of 1 / 1 of 1 | 0 of 1 / 1 of 1 | 0 of 1 / 1 of 1 | 0 of 1 / 1 of 1 |
| `html` `scroll-behavior` | `auto` | `auto` | `auto` | `smooth` |
| `body` `scroll-behavior` | `auto` | `auto` | `auto` | `auto` |

In the control column, the same instrument still reads the hover translate and the smooth scrolling
when motion is allowed. That shows the reduce readings reflect the page, not a blind instrument.

**The committed spec, run before any edit, `2026-09-12T20:43:51Z` to `20:45:07Z`.** Of its 21 tests,
19 completed with no assertion break. The other 2 broke in the designed way: each asserted the
deployed value, read the contract value instead, and its message instructed deleting its own entry.
Verbatim:

```
Error: ZM-LIVE-1: the deployed page no longer reads 'matrix(1, 0, 0, 1, 0, -4)' for hoverTransformAfter. If it now satisfies the ZM-2 contract, the fix (src/pages/ProductPage.tsx — the hover translate is now motion-safe:hover:-translate-y-1) has deployed: DELETE the ZM-LIVE-1 entry from DEPLOY_LAG so the contract applies unconditionally. Never update deployedValue.

expect(received).toBe(expected) // Object.is equality

Expected: "matrix(1, 0, 0, 1, 0, -4)"
Received: "none"
```

```
Error: ZM-LIVE-2: the deployed page no longer reads 'smooth' for htmlScrollBehavior. If it now satisfies the ZM-2 contract, the fix (src/index.css — smooth scrolling now sits inside a no-preference media query) has deployed: DELETE the ZM-LIVE-2 entry from DEPLOY_LAG so the contract applies unconditionally. Never update deployedValue.

expect(received).toBe(expected) // Object.is equality

Expected: "smooth"
Received: "auto"
```

| Reading | Value |
|---|---|
| ZM-2a live, `transform` after hover | `none` in 3 of 3 attempts (the attempt plus two retries): `20:44:31.258Z`, `20:44:34.793Z`, `20:44:38.493Z` |
| ZM-2b live, `html` `scroll-behavior` | `auto` in 3 of 3 attempts: `20:44:41.568Z`, `20:44:44.776Z`, `20:44:47.703Z` |
| raw records | `evidence/motion-suppression.json` and `evidence/motion-closed-negative.json`, the entries at those stamps. Each still carries the `deployLag` field that named its entry |

#### The accommodation did not outlive the defect

Both entries were deleted, together with everything that existed only to serve them. Nothing was
widened, and no entry's `deployedValue` was updated:

- the `DeployLagEntry` interface, the `DEPLOY_LAG` const and its doc comment;
- `lagFor`;
- `expectContractOrRegisteredLag`. Its contract callbacks were inlined, so ZM-2a's transform and
  translate comparisons and ZM-2b's `html` comparison now assert unconditionally on both projects;
- the `deployLag` field in the `motion-suppression` and `motion-closed-negative` evidence records.

No empty list and no dead helper remain. The one remaining mention of ZM-LIVE-1 in the spec is the
comment explaining why the card is measured through computed values, and it now points here.

| Reading | Value |
|---|---|
| `e2e/zoom-motion.e2e.ts` before / after | 43 714 / 40 540 bytes |
| `DEPLOY_LAG` occurrences in the spec | 3 before, 0 after |
| `DeployLagEntry`, `lagFor`, `expectContractOrRegisteredLag` and `deployLag` occurrences after | 0 |
| `npx playwright test --project=live e2e/zoom-motion.e2e.ts` | exit code 0; 21 tests executed, 21 completed with no assertion break, 0 retries consumed; `2026-09-12T20:47:31Z` to `20:49:08Z` |
| `npx playwright test --project=preview e2e/zoom-motion.e2e.ts` | exit code 0; 3 tests executed (ZM-2a, ZM-2b and the control), 3 completed with no assertion break, 18 skipped by design; `20:49:08Z` to `20:49:19Z`, against `dist/` built from the `651eebe` tree |
| gate baseline after the edit | `npm run typecheck` exit 0; `npm run lint` exit 0; `npm test` 684 tests in 10 files, exit 0; `npm run verify:disjoint` 26 shared / 26 allowlisted / 0 violations, exit 0; `npm run test:phase1:contracts` exit 0 |

| Post-deletion reading, reduce | Live (`haoo-C1OXjuEM.js`) | Preview (`dist/` from `651eebe`) |
|---|---|---|
| ZM-2a record | `20:48:45.111Z` | `20:49:14.914Z` |
| `transition-property` / `transition-duration` | `none` / `0.2s` | `none` / `0.2s` |
| `transform` before / after hover | `none` / `none` | `none` / `none` |
| `translate` before / after | `none` / `none` | `none` / `none` |
| `:hover` matched before / after | 0 of 1 / 1 of 1 | 0 of 1 / 1 of 1 |
| `(prefers-reduced-motion: reduce)` matches | 1 of 1 | 1 of 1 |
| Capability items | 6 | 6 |
| ZM-2b record | `20:48:47.374Z` | `20:49:16.496Z` |
| Elements matching `[class*="animate-"]` | 0 | 0 |
| `html` / `body` computed `scroll-behavior` | `auto` / `auto` | `auto` / `auto` |
| `document.getAnimations().length` / elements with a runnable transition | 0 / 0 | 0 / 0 |
| No-preference control record: `transform` after hover | `20:48:57.820Z`: `matrix(1, 0, 0, 1, 0, -4)` | `20:49:18.928Z`: `matrix(1, 0, 0, 1, 0, -4)` |
| Records carrying a `deployLag` field | 0 of 3 | 0 of 3 |

The closing commit is `fix(05-13): close ZM-LIVE-1 and ZM-LIVE-2 by deleting the DEPLOY_LAG entries the deploy terminated`.

`src/index.css` is a ground-A `scaffold` entry on `shared-scaffold.txt`. HAOO's copy now differs
from ZERO-PAPER HUB's, which the auditor permits for scaffold entries: `verify:disjoint` reads 26
shared, 26 allowlisted, 0 violations, and 0 converged collisions. ZERO-PAPER HUB's copy still carries
the unguarded rule (see F6 below), and nothing was committed there.

## 3. Observations (recorded, not asserted)

**The Products region colour transition is deliberately not required to be suppressed.** On
`https://www.zero-paperhub.com/#products`, with reduced motion requested, the region contains exactly
1 element with a runnable transition: the `Explore HAOO` link (P9), computing
`transition-property: color, background-color, border-color, text-decoration-color, fill, stroke`
and `transition-duration: 0.2s`. None of those properties is a movement property (`all`,
`transform`, `translate`, `scale` or `rotate`). A colour transition neither moves nor scales
anything, and the criterion concerns motion animation. Requiring it to be suppressed would push a
correct component into a variant it does not need, so a future reader should not "fix" it.

**F6, already recorded and deferred by D-OQ-3, is cross-referenced here, not re-raised.** The
ZERO-PAPER HUB home page outside the Products region has animation utilities, hover scaling and
observer-driven reveals, with no reduced-motion handling anywhere in that repository (05-UI-SPEC.md
§ Pre-Flight Findings F6). The same reduced-motion page load read, outside the Products region:

| Reading | Value |
|---|---:|
| Elements whose class contains `animate-` | 1 |
| Elements whose class contains `hover:scale-` | 9 |
| Elements with a runnable transition | 56 |
| `html` computed `scroll-behavior` | `smooth` |

These readings add numbers to F6 and raise no new finding. VP-O3 (05-08) did not recur: this plan
measured the HAOO page at every zoom entry and did not open the ZERO-PAPER HUB mobile menu. R-1,
O-1, FS-O1 and G-1 were not met by any measurement here and remain with 05-14.

## 4. Held out for human judgement

**Each item below is not a pass.** Both are backstop items (05-UI-SPEC.md § UI Considerations, E1 and
E3). No assertion settles them, because an assertion would hold on unreadable output. An item with no
explicit evidence routes to human judgement at verification time rather than passing silently. The
spec measures their inputs and asserts nothing about readability. The readability block contains 0
`expect` calls.

Method: `rendered lines = round(paragraph height / computed line-height)`, and
`approx. characters per line = round(characters / rendered lines)`. Measured on the live build
`haoo-D1dl6F2P.js`.

### E1: paragraph copy inside the max-width content columns at a halved desktop viewport

The longest paragraph in each rendered max-width column is listed below, as *column width px /
characters / lines / characters per line*. The 360 and 320 columns are included for comparison. The
first column is the hero text column. The recorder labelled it `Get help choosing` because the hero
section has no `aria-label` and that is the first `h2` inside it.

| Column (section) | 360×740 narrowest supported | 640×512 SC 1.4.4 (200%) | 720×450 SC 1.4.4 (200%) | 320×256 SC 1.4.10 |
|---|---|---|---|---|
| `max-w-[620px]` hero text | 328 / 126 / 4 / 32 | 592 / 126 / 2 / 63 | 620 / 126 / 2 / 63 | 288 / 126 / 4 / 32 |
| `max-w-[680px]` Benefits, pain column | 328 / 100 / 3 / 33 | 592 / 100 / 2 / 50 | 672 / 100 / 2 / 50 | 288 / 100 / 3 / 33 |
| `max-w-[680px]` Benefits, benefit column | 328 / 94 / 3 / 31 | 592 / 94 / 2 / 47 | 672 / 94 / 2 / 47 | 288 / 94 / 3 / 31 |
| `max-w-[680px]` Capabilities caveat (14 px) | 328 / 51 / 1 / 51 | 592 / 51 / 1 / 51 | 672 / 51 / 1 / 51 | 288 / 51 / 2 / 26 |
| `max-w-[680px]` Rental journey list (paragraph width) | 268 / 86 / 3 / 29 | 532 / 86 / 2 / 43 | 612 / 86 / 2 / 43 | 228 / 86 / 4 / 22 |
| `max-w-[680px]` Rental journey market claim | 328 / 118 / 3 / 39 | 592 / 118 / 2 / 59 | 672 / 118 / 2 / 59 | 288 / 118 / 4 / 30 |
| `max-w-[680px]` Brochure lead | 328 / 131 / 4 / 33 | 592 / 131 / 2 / 66 | 672 / 131 / 2 / 66 | 288 / 131 / 4 / 33 |
| `max-w-[680px]` Send your details, first lead | 328 / 84 / 2 / 42 | 592 / 84 / 2 / 42 | 672 / 84 / 1 / 84 | 288 / 84 / 3 / 28 |
| `max-w-[680px]` Send your details, second lead | 328 / 183 / 5 / 37 | 592 / 183 / 3 / 61 | 672 / 183 / 3 / 61 | 288 / 183 / 5 / 37 |
| `max-w-[560px]` form note (14 px) | 328 / 47 / 1 / 47 | 560 / 47 / 1 / 47 | 560 / 47 / 1 / 47 | 288 / 47 / 2 / 24 |
| `max-w-[560px]` form, longest paragraph (14 px, paragraph width) | 244 / 449 / 14 / 32 | 476 / 449 / 7 / 64 | 476 / 449 / 7 / 64 | 204 / 449 / 17 / 26 |

Rendered max-width columns found: 11 at every entry. Body paragraphs are 16 px, and the two rows
marked 14 px are 14 px. For the reviewer: at the halved desktop entries, the widest body-copy line
lengths read 59 to 84 characters per line. The single 84 is the first qualification lead at 720,
rendered on 1 line.

### E3: the brochure HTML equivalent at the narrowest width and at 200%

| Reading | 360×740 narrowest supported | 640×512 SC 1.4.4 (200%) | 720×450 SC 1.4.4 (200%) | 320×256 SC 1.4.10 |
|---|---:|---:|---:|---:|
| Capability cards rendered | 6 | 6 | 6 | 6 |
| Grid rows | 6 | 6 | 6 | 6 |
| Cards per row | 1,1,1,1,1,1 | 1,1,1,1,1,1 | 1,1,1,1,1,1 | 1,1,1,1,1,1 |
| Card width px | 328 | 592 | 672 | 288 |
| Longest capability description: characters / lines / per line / paragraph width px | 79 / 3 / 26 / 278 | 79 / 2 / 40 / 542 | 79 / 2 / 40 / 622 | 79 / 3 / 26 / 238 |
| Journey steps rendered | 4 | 4 | 4 | 4 |
| Longest journey description: characters / lines / per line / paragraph width px | 86 / 3 / 29 / 268 | 86 / 2 / 43 / 532 | 86 / 2 / 43 / 612 | 86 / 4 / 22 / 228 |

The grid collapses to one card per row at every entry here, because all four widths are below
Tailwind's `md` breakpoint, where `md:grid-cols-2` would take effect. The mechanical half is covered
above: 0 escapees, 0 truncated `h3` boxes, and 10 of 10 items exposed. Whether the block stays
*readable and complete* is the human's call.

## Deviation notes carried from the plan

- **D-1: "capability count is re-asserted as exactly 10".** The shipped product has **six**
  capabilities and four journey steps, a measured correction 05-10 already recorded against
  05-UI-SPEC.md § SS-4. This spec asserts 6 capabilities, 4 steps and 10 equivalent items, using the
  same constants as the semantics spec, so a spec asserting ten capability cards cannot fail a
  correct page.
- **D-2: the semantics and viewport assertion helpers were moved to `e2e/fixtures/`.** Playwright
  refuses a spec that imports another spec ("test file … should not import test file …"). The SS-4
  equivalence now lives in `e2e/fixtures/brochure-equivalence.ts` and the VC-2 measurement in
  `e2e/fixtures/targets.ts`, both moved verbatim. The original specs import them, and re-running the
  moved code gave the same readings: the viewport spec at 360×740 ran 6 of 6 tests, and semantics
  SS-4 ran 3 of 3, with no retries.
