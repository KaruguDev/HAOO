---
last_mapped_commit: 7a99cab52f8907ebb43e9618c909ed785d088dbe
---
<!-- refreshed: 2026-09-02 -->
# Codebase Concerns

**Analysis Date:** 2026-09-02

`npm run typecheck` and `npm run lint` both exit clean. `npx vitest run` reports 723 passing tests across 21 files — but only 11 of those files are real; the rest are collected from abandoned worktrees (see Known Bugs).

Since the previous audit, Phase 3 and Phase 4 landed `src/measurement/plausible.ts`, `src/products/engagement-summary.ts`, and the whole `src/reporting/` + `scripts/generate-haoo-report.mjs` owner-report path. The dead-analytics-stub debt from the last audit is **closed** — `resolveMeasurementProvider()` now resolves against a real provider tuple and a validated script source. Two new blocking security concerns replaced it, both formally recorded as failed truths in `04-VERIFICATION.md`. The legacy home page (`src/App.tsx`) is unchanged and remains the largest concentration of debt.

## Tech Debt

**`src/App.tsx` is a 661-line mixed-concern module:**
- Issue: Routing, the `useInView` hook, the profile-download side effect, nav-link composition, all page copy, and the whole home page JSX live in one file. Compare with `src/pages/ProductPage.tsx` (315 lines), which delegates to `src/components/*`.
- Files: `src/App.tsx`
- Impact: Every home page change touches the same file; conflicts and accidental copy regressions are likely.
- Fix approach: Split along the boundaries `ProductPage` already demonstrates — a `pages/HomePage.tsx`, a `home/copy.ts`, and section components.

**Two form implementations with divergent quality:**
- Issue: The HAOO qualification form (`src/components/QualifyForm.tsx`, `src/components/qualify-form.logic.ts`) is an AJAX form with validation, an abort-based 15s timeout, an allowlist-checked payload builder, a reserved-label guard, an engagement-context field, and a recovery panel. The home contact form (`src/App.tsx:547`) is a raw native `<form action method="POST">` with only browser-native constraint validation and no recovery path.
- Files: `src/App.tsx:142-200`, `src/App.tsx:547-628`
- Impact: The primary company-wide lead capture path has strictly weaker guarantees than the product-specific one, and shares no code with it.
- Fix approach: Migrate the home contact form onto the `QualifyForm` + `ProductQualifyForm` config seam already proven for HAOO. `src/products/types.ts` already models an endpoint-per-form.

**Home page copy is duplicated between the rendered page and the download blob:**
- Issue: Company history, mission, vision, and all three service descriptions are written twice — once inside the `downloadCompanyProfile()` template literal (`src/App.tsx:26-88`) and once in the JSX/`SERVICES` constant (`src/App.tsx:153-168`, `src/App.tsx:327`).
- Files: `src/App.tsx`
- Impact: The downloaded company profile can silently drift from the published page. No test asserts they agree.
- Fix approach: Extract a single copy module (mirroring `src/products/copy.ts`) and generate the download from it.

**The Stats API request has no timeout or abort:**
- Issue: `queryRange()` in `src/reporting/generate.ts:127` awaits `options.fetch(...)` with no `AbortSignal` and no deadline, unlike `QualifyForm`, which uses an explicit 15s abort for the same class of call.
- Files: `src/reporting/generate.ts:115-150`, `scripts/generate-haoo-report.mjs`
- Impact: A hung provider connection hangs `npm run report:haoo` indefinitely with no output and no error state — a CLI, so the blast radius is small.
- Fix approach: Thread an `AbortSignal` with a documented deadline through the injected `ReportFetch` capability; the seam already exists.

**Seven sequential network round-trips per report:**
- Issue: `generateHaooReport()` awaits three bounded periods (current + previous each) and then all-time strictly serially (`src/reporting/generate.ts:190-215`).
- Files: `src/reporting/generate.ts`
- Impact: Report latency is 7 × RTT. Acceptable for a manual owner command; it becomes a problem only if the report is ever put on a schedule.
- Fix approach: `Promise.all` over the range list. Fail-closed semantics are unaffected because every result is validated before any write.

**Scaffold metadata never updated:**
- Issue: `package.json` still declares `"name": "vite-react-typescript-starter"` and `"version": "0.0.0"`.
- Files: `package.json`
- Impact: Cosmetic, but the project has no version identity for release notes or bug reports.
- Fix approach: Set a real name and adopt versioning at milestone boundaries.

**`QualifyForm.tsx` exports non-component values, disabling Fast Refresh:**
- Issue: `react-refresh/only-export-components` warnings, documented in `.planning/phases/02-submit-a-qualified-haoo-enquiry/deferred-items.md`. Lint exits 0 because these are warnings.
- Files: `src/components/QualifyForm.tsx`
- Impact: Developer experience only — the file does not hot-reload.
- Fix approach: The pure helpers already have a home in `src/components/qualify-form.logic.ts`; move the remaining exports.

## Known Bugs

**Vitest collects and runs tests out of two leftover git worktrees:**
- Symptoms: 21 test files collected where `src/test/` contains 11; suites such as `.claude/worktrees/rf-03-retry-1788205465/src/test/measurement.test.ts` run alongside the real ones. The worktree copies have **diverged** — the worktree's `build-output.test.ts` reports 25 tests versus 26 in `src/`, and its `measurement.test.ts` 77 versus 113.
- Files: `vitest.config.ts` (no `test.include` / `test.exclude`), `.claude/worktrees/rf-03-2-1788205432/`, `.claude/worktrees/rf-03-retry-1788205465/`
- Trigger: Any abandoned GSD review-fix worktree under `.claude/worktrees/`. A stale recovery marker at `.planning/phases/03-build-privacy-bounded-engagement-context/.review-fix-recovery-pending.json` still points at one of them.
- Workaround: `git worktree remove` both, or pin `test.include: ['src/**/*.test.{ts,tsx}']` in `vitest.config.ts`. The latter is the durable fix — divergent copies can turn a passing branch red, mask a deleted test, or inflate the pass count. Recorded as deferred in `.planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/deferred-items.md`.

**`npm run test:unit` fails on a stale `dist/` in a clean checkout:**
- Symptoms: `src/test/build-output.test.ts:256` fails with `Stale build output ... is older than build input ... Run npm run build.` Not reproducing at this analysis (dist is current), but the assertion is unchanged and fires on any source edit without a rebuild.
- Files: `src/test/build-output.test.ts`, `package.json` (`test` vs `test:unit`)
- Trigger: Editing any source file without re-running `npm run build`. CI is safe because `.github/workflows/deploy.yml` runs Build immediately before `test:unit`.
- Workaround: Run `npm run test` (which builds first) or `npm run build` before `test:unit`.

**Contact success banner is triggered by a URL query parameter alone:**
- Symptoms: `src/App.tsx:181` derives `contactSubmitted` from `?contact=success` and renders "Message sent successfully / Our team will get back to you shortly." Anyone visiting or bookmarking that URL sees the confirmation without having sent anything.
- Files: `src/App.tsx:180-195`, `src/App.tsx:143` (`CONTACT_SUCCESS_URL`)
- Trigger: Navigating to `https://www.zero-paperhub.com/?contact=success`.
- Workaround: None in code. This directly contradicts the truthfulness discipline enforced on the HAOO path, where `QualifyForm` derives its terminal state from `response.ok` only.

**An abandoned reservation sibling permanently blocks report regeneration:**
- Symptoms: `generateHaooReport()` reserves a fixed temporary sibling with `openSync(path, 'wx')` (`scripts/generate-haoo-report.mjs`, `src/reporting/generate.ts:250`). Cleanup runs on caught failures, but an uncatchable termination (SIGKILL, power loss) leaves the sibling; every subsequent run then fails closed at reservation with the generic error sentence.
- Files: `src/reporting/generate.ts:248-275`, `scripts/generate-haoo-report.mjs`
- Trigger: Killing `npm run report:haoo` mid-write.
- Workaround: Delete the sibling under `.reports/` manually. The behavior is deliberate (documented in-code), but the terminal error does not name the file to delete.

## Security Considerations

**The analytics script origin is unconstrained (open failed truth, T-04 family):**
- Risk: `resolvePlausibleScriptSrc()` (`src/products/haoo.ts:63-85`) validates URL shape only — absolute `https:`, no credentials, no query, no fragment, path ending in `.js` — and deliberately does **not** compare the host against an approved origin. A tampered build variable (`VITE_HAOO_PLAUSIBLE_SRC`) therefore loads attacker-controlled JavaScript with full page, form, and `localStorage` access.
- Files: `src/products/haoo.ts:63-85`, `src/measurement/plausible.ts:68-80` (`appendProviderScript`)
- Current mitigation: The build variable is a GitHub Actions repository variable, so the attack requires repo/CI write. The comment explains the origin was left out of `src/` to keep it out of unconfigured bundles.
- Recommendations: Validate against an independently trusted approved origin/path contract (an allowlist injected at build time, or a Subresource Integrity hash), and add a regression case in `src/test/measurement.test.ts` that rejects a structurally valid HTTPS `.js` URL on a foreign origin. Recorded verbatim as a failed truth in `04-VERIFICATION.md`.

**Provider initialization is not fail-closed (open failed truth):**
- Risk: `createPlausibleEventSink()` appends the provider script *before* initializing, treats any pre-existing `window.plausible` function as trusted (`src/measurement/plausible.ts:88-90`), calls `init?.()` optionally, swallows an initialization throw, and returns a live sink regardless (`src/measurement/plausible.ts:130-155`). The `autoCapturePageviews: false` opt-out is therefore not guaranteed to be established before collection begins, so automatic pageview capture — which could carry `utm_*` values into provider dimensions — can occur.
- Files: `src/measurement/plausible.ts:88-155`
- Current mitigation: Every provider call is name-only; `PlausibleGlobal` has no property-bag parameter, so no form value or visitor identifier can travel even if the sink is live.
- Recommendations: Require successful `init` before script insertion and before returning a sink; add absent-initializer and throwing-initializer tests asserting no script tag and no sink while the local journey stays functional.

**All lead data transits a third-party form relay:**
- Risk: Both forms POST visitor-entered names, emails, organizations, portfolio details, free-text messages, and now a human-readable `HAOO engagement context` paragraph (`src/components/qualify-form.logic.ts:54`) to `formsubmit.co`, which sees the entire payload before forwarding to a mailbox.
- Files: `src/App.tsx:142`, `src/products/haoo.ts` (`QUALIFY_ENDPOINT_FALLBACK`), `src/products/copy.ts`, `src/products/engagement-summary.ts`
- Current mitigation: Strong. The endpoint is validated to an absolute `https://formsubmit.co/ajax/{target}` URL. `buildSubmissionBody()` throws if a product field claims a reserved provider label. `formatEngagementSummary()` reads a hardcoded three-member pick list (`READABLE_MEMBERS` in `src/products/engagement-summary.ts:17`) rather than spreading the stored record, so adding a member to the browser context cannot silently add it to an outbound email.
- Recommendations: Document the relay in a privacy notice as prominently as the measurement disclosure. Longer term, a first-party endpoint removes the class entirely.

**Endpoint and provider configuration are build-time only and silently fall back:**
- Risk: `VITE_HAOO_FORM_ENDPOINT`, `VITE_HAOO_MEASUREMENT_PROVIDER`, `VITE_HAOO_PLAUSIBLE_SRC`, and `VITE_HAOO_PLAUSIBLE_DOMAIN` are inlined at build time. Unset, misspelled, or invalid values all resolve to a silent inert default — `'none'`, `''`, or `QUALIFY_ENDPOINT_FALLBACK` — with a clean build and no signal.
- Files: `src/products/haoo.ts:43-130`, `src/vite-env.d.ts`, `.github/workflows/deploy.yml`
- Current mitigation: The fail-closed default is correct behavior; the defect is only the absence of a signal.
- Recommendations: Fail the build (or emit a loud CI warning step) when the production build resolves any of the four to its inert default.

**The home contact form and the HAOO form make inconsistent anti-abuse claims:**
- Risk: `src/App.tsx:617` states "Protected by reCAPTCHA and an automated spam trap." The HAOO payload sets `_captcha: 'false'`, so that path has the honeypot only. Copy drift between the two makes the claim false.
- Files: `src/App.tsx:617`, `src/components/qualify-form.logic.ts`
- Current mitigation: Honeypot `_honey` on both forms; length caps on every input.
- Recommendations: Add a test asserting the trust line matches the actual `_captcha` value, the way `src/test/haoo-content.test.ts` pins other copy.

**Not found (good):** `scripts/generate-haoo-report.mjs` is the only module reading `process.env` and the only one naming the provider origin, and it never writes either into the generated HTML or stdout — asserted by a source test in `src/test/haoo-report.test.ts`. Generated reports land in `.reports/`, which `.gitignore` excludes with an explanatory comment, alongside the whole `.env.*` family. `src/reporting/render.ts:74` escapes every interpolated value with `escapeHtml`. Untrusted provider responses are validated fail-closed by `src/reporting/stats-response.ts` and `src/reporting/query-provenance.ts` (rebuilt literals, never spread). No secrets committed. No `dangerouslySetInnerHTML`, `eval`, `innerHTML`, `@ts-ignore`, `eslint-disable`, or `any` in `src/`. No TODO/FIXME/HACK markers anywhere.

## Performance Bottlenecks

None material — a static two-page Vite site with three runtime dependencies, plus an offline report CLI.

**Per-section `IntersectionObserver` instances:**
- Problem: `useInView()` (`src/App.tsx:94`) creates one observer per animated section; five are live on the home page (`src/App.tsx:202-206`).
- Improvement path: Not worth changing. Each observer self-disconnects on first intersection.

**Unthrottled scroll listener:**
- Problem: `src/App.tsx:185` attaches a `scroll` handler calling `setScrolled` on every event.
- Cause: No `requestAnimationFrame` guard; React bails out on the identical boolean, so the cost is the handler call itself.
- Improvement path: Guard with a ref comparison if the home page ever gets heavier.

**Report is rendered as one in-memory string:**
- Problem: `renderReport()` (`src/reporting/render.ts`, 527 lines) concatenates the whole self-contained HTML document before writing.
- Cause: Deliberate — write-on-success requires the full document in memory before the temp sibling is reserved.
- Improvement path: None needed. Output is bounded by ten events × four periods.

## Fragile Areas

**Routing is a single `data-page` attribute read:**
- Files: `src/App.tsx:655` (`document.body.dataset.page === 'haoo-product'`), `products/haoo/index.html`, `vite.config.ts`
- Why fragile: There is no router. Page identity lives in a hand-written HTML attribute in a second entry-point file that must stay in sync with `vite.config.ts` inputs and the deploy directory layout. A typo silently renders the home page at the product URL. `document` is read at module scope, so any SSR or non-DOM import breaks.
- Safe modification: When adding a product, change all three in one commit — the `products/<slug>/index.html` entry, the `rollupOptions.input` key, and `PRODUCTS` in `src/products/registry.ts:14`.
- Test coverage: Good — `src/test/product-shell-reuse.test.tsx` and `src/test/build-output.test.ts`.

**The closed event tuple is a cross-module contract with four owners:**
- Files: `src/products/haoo.ts` (`HAOO_MEASUREMENT_EVENTS`, `disclosure.signalLines`), `src/reporting/haoo-report.ts:22` (`REPORT_EVENT_LABELS`, `REPORT_EVENT_STAGES`), `scripts/verify-phase4-coverage.mjs`, and the ten goals configured manually in the provider dashboard.
- Why fragile: Adding an eleventh event requires an in-repo label, a stage, a disclosure line, and a **dashboard change made outside the repo**. Only the first three are compiler-enforced (via `Readonly<Record<HaooMeasurementEvent, …>>`); a missing dashboard goal silently reports zero forever.
- Safe modification: Change the tuple and the dashboard in the same session; re-run `npm run report:haoo` and confirm the new row is non-zero after exercising the action.
- Test coverage: Strong in-repo (`src/test/haoo-report.test.ts`, 1,707 lines). Zero coverage of the dashboard side — this is a human gate listed in `04-VERIFICATION.md`.

**`QualifyForm` state composition depends on a ref, not the render closure:**
- Files: `src/components/QualifyForm.tsx` (`valuesRef`), `src/components/QualifyForm.tsx:281-326`
- Why fragile: The WR-08 fix routes field writes through `valuesRef.current` because the render closure is stale under batched writes. The fix has **no direct regression test** — it was proven untestable through DOM events under React 18 + jsdom. A future refactor can silently reintroduce the stale-closure bug. The same function now also composes the engagement summary before submission (`engagementSummary()` at line 281), widening what a stale read would corrupt.
- Safe modification: Extract field-write composition into a standalone reducer that can be unit-tested directly.
- Test coverage: Indirect only — payload contracts in `src/test/qualify-form.test.tsx` assert against `valuesRef.current`, so a broken ref read is caught but a broken closure write is not.

**`localStorage` context parsing is strict by design and fails closed:**
- Files: `src/measurement/index.ts:97-145` (`parseContext`)
- Why fragile: `exactKeys()` rejects any record whose key set is not byte-exact, and any record whose `version` differs from `config.schemaVersion`. Any change to `interactionFlags` in `src/products/haoo.ts` invalidates every stored record in the field.
- Safe modification: Correct and intentional — invalid records are removed and a fresh context written, so the failure mode is losing engagement history, never a crash. Bump `schemaVersion` deliberately when changing the flag list.
- Test coverage: Strong — `src/test/measurement.test.ts` (809 lines) and `src/test/measurement-page.test.tsx` (1,047 lines).

**Report modules are loaded through Node's native TypeScript type stripping:**
- Files: `scripts/generate-haoo-report.mjs`, `src/reporting/*.ts` (all import each other by explicit `.ts` extension)
- Why fragile: The whole `src/reporting/` tree must use erasable syntax only and must import with `.ts` extensions — constraints no linter rule enforces here. Introducing an enum, a parameter property, or an extensionless import breaks `npm run report:haoo` at runtime while `npm run typecheck` and the Vitest suite (which go through Vite) stay green. It also pins `engines.node >= 22.18.0`.
- Safe modification: Run `npm run report:haoo` after any edit under `src/reporting/`, even a typing-only one.
- Test coverage: Partial — `src/test/fixtures/haoo-report-cli-fetch-preload.mjs` exercises the CLI path; ordinary suites do not.

**`document.getElementById('root')!` non-null assertion:**
- Files: `src/main.tsx:6`
- Why fragile: Both entry HTML files must contain `<div id="root">`. A missing root throws an unhandled TypeError with no fallback UI. Both files include a `<noscript>` block, so the no-JS path degrades well; the failed-JS path does not.
- Test coverage: Indirect via build-output assertions.

## Scaling Limits

**Product registry is a hand-maintained array:**
- Current capacity: One product (`HAOO_PRODUCT` in `src/products/registry.ts:14`).
- Limit: Each additional product needs a Vite rollup input, an HTML entry file, a definition module, and a registry entry — four coordinated edits with no generator.
- Scaling path: Derive `rollupOptions.input` from `PRODUCTS` in `vite.config.ts`, and template the entry HTML. `productRoute()` already derives the URL from the slug.

**Reporting is HAOO-specific, not product-generic:**
- Current capacity: One product's funnel. `src/reporting/haoo-report.ts` hardcodes the HAOO event tuple, its labels, and its four stages; `scripts/generate-haoo-report.mjs` hardcodes one output path and one site.
- Limit: A second product needs a parallel report module and script, or a generic refactor.
- Scaling path: The rest of the pipeline is already product-agnostic — `stats-response.ts`, `query-provenance.ts`, `render.ts`, and `generate.ts` all take their dictionary as data. Only `haoo-report.ts` and the CLI need parameterizing.

**Static hosting has no server-side capability:**
- Current capacity: GitHub Pages, custom domain via `CNAME`.
- Limit: No server means no rate limiting, no server-side validation, no submission log, and no way to prove delivery. All three are outsourced to `formsubmit.co`.
- Scaling path: A serverless function endpoint when lead volume or compliance requires an audit trail.

## Dependencies at Risk

**`formsubmit.co`:**
- Risk: A free third-party relay is the single point of failure for every lead the business receives, with no SLA and no delivery receipt. `.planning/v1-MILESTONE-AUDIT.md` records endpoint activation and mailbox delivery as **unproved**.
- Impact: Total, silent lead loss. `QualifyForm` correctly reports only "Your details were sent" (never "received"), so a provider that 200s and drops the mail is invisible from the page.
- Migration plan: Serverless relay behind a first-party domain. The `ProductQualifyForm.endpoint` seam in `src/products/types.ts` and the validation in `src/products/haoo.ts` make swapping providers a contained change.

**`plausible.io` Stats API v2:**
- Risk: The owner report depends on a hosted third party for both collection and query, authenticated by a personal API key held in the operator's local environment (`PLAUSIBLE_STATS_API_KEY`). The coverage matrix in `scripts/verify-phase4-coverage.mjs` opts out of Shared links, embeds, and funnels, so there is no fallback view.
- Impact: A provider outage, key revocation, or API v2 schema change makes the report unavailable — but never wrong: every failure path aborts before writing and leaves the previous report byte-identical.
- Migration plan: The `ReportQuery` / `ReportFetch` capabilities in `src/reporting/generate.ts` are injected, so a different provider is a new adapter plus a new response parser, not a rewrite.

**`lucide-react` is excluded from dependency pre-bundling:**
- Risk: `vite.config.ts` sets `optimizeDeps.exclude: ['lucide-react']`, a workaround dating to the Bolt scaffold (`.bolt/`).
- Impact: Slower cold dev-server starts. No production impact.
- Migration plan: Remove the exclusion and confirm dev startup; likely obsolete on Vite 5.

## Missing Critical Features

**Phase 4 is not sealed — two blocking truths remain failed:**
- Problem: `04-VERIFICATION.md` reports `status: gaps_found` with two failed truths: unconstrained analytics script origin, and non-fail-closed provider initialization (both detailed under Security Considerations). Plans `04-08`, `04-09`, and `04-10` are written but have no `-SUMMARY.md`, so the gap closure is planned and unexecuted.
- Files: `src/products/haoo.ts`, `src/measurement/plausible.ts`, `src/test/measurement.test.ts`
- Blocks: `MEAS-01`, `MEAS-05`, `MEAS-08`. `04-VERIFICATION.md` explicitly states Phase 5 does not own either blocker, so neither is deferred.

**No deployed proof of the HAOO qualification journey (Phase 5, unimplemented):**
- Problem: `.planning/v1-MILESTONE-AUDIT.md` records that the production site contains Phase 1 but not the Phase 2 qualification journey, and that device, accessibility, deployment, and provider checks have never run against production.
- Blocks: Launch. Requirements `LEAD-07`, `QUAL-01..QUAL-03`, `QUAL-05` are unowned by any phase directory.

**Live provider and report reconciliation never performed:**
- Problem: `04-VERIFICATION.md` lists three human gates: approving the processor and creating the exact ten dashboard goals, reconciling report counts against the raw dashboard, and reviewing a maximum-context enquiry at 320px / 200% zoom with keyboard and screen-reader use. All report evidence to date is fixture-based.
- Blocks: Any claim that the owner report reflects reality.

**No end-to-end or real-browser testing:**
- Problem: All suites run in jsdom. Items automated checks cannot reach: 320px/200%-zoom layout, native PDF handling, real `localStorage` policy, actual provider UX, and real network behavior of the report CLI.
- Blocks: Confidence in the deployed journey.

## Test Coverage Gaps

**Repository hygiene affecting the suite:**
- What's not tested: Nothing guards against Vitest collecting from `.claude/worktrees/`. Two divergent worktree copies currently run on every invocation, inflating the reported total from ~11 files to 21.
- Files: `vitest.config.ts`
- Risk: False greens and false reds; a deleted test can appear to still pass from a stale worktree copy.
- Priority: High — one-line fix.

**Adversarial provider-configuration paths:**
- What's not tested: A structurally valid HTTPS `.js` URL on a foreign origin (accepted today), a pre-existing non-Plausible `window.plausible` function, an absent `init`, and a throwing `init`.
- Files: `src/test/measurement.test.ts`, `src/measurement/plausible.ts`, `src/products/haoo.ts`
- Risk: The two open Phase 4 security blockers have no failing test pinning them, so a fix cannot be proven and a regression cannot be caught.
- Priority: High.

**`src/App.tsx` home page — largely untested:**
- What's not tested: The contact form (submit handler, `checkValidity` gate, disabled-button state), the `?contact=success` banner, `downloadCompanyProfile()`, `useInView`, the mobile menu, and the scroll header. Only `homeNavLinks` composition is exercised, via `src/test/products-section.test.tsx`.
- Files: `src/App.tsx`
- Risk: The company's primary lead form and its spoofable success banner can regress unnoticed. Contrast with `src/components/QualifyForm.tsx`, covered by a 2,402-line suite.
- Priority: High.

**Report CLI runtime constraints:**
- What's not tested: That `src/reporting/*.ts` stays loadable under Node type stripping (erasable syntax, `.ts`-extension imports). Vite-based suites resolve these modules differently from the CLI, so a breaking edit passes CI.
- Files: `src/reporting/*`, `scripts/generate-haoo-report.mjs`
- Risk: `npm run report:haoo` breaks while every gate stays green.
- Priority: Medium — a smoke test that spawns the script with a stubbed fetch would close it; `src/test/fixtures/haoo-report-cli-fetch-preload.mjs` is most of the machinery already.

**WR-08 stale-closure regression:**
- What's not tested: Field-write composition from `valuesRef.current` under batched writes.
- Files: `src/components/QualifyForm.tsx`
- Risk: Silent payload corruption on fast/batched input, now including the engagement-context field.
- Priority: Medium — needs the reducer extraction first.

**Copy synchronization between page and downloadable profile:**
- What's not tested: That `downloadCompanyProfile()` output agrees with the rendered `SERVICES` / about copy.
- Files: `src/App.tsx`
- Risk: A published page and a downloaded profile stating different things about the company.
- Priority: Medium.

---

*Concerns audit: 2026-09-02*
