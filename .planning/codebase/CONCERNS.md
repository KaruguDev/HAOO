<!-- refreshed: 2026-09-01 -->
# Codebase Concerns

**Analysis Date:** 2026-09-01

The codebase is small (~9,200 lines across `src/`), disciplined, and unusually well-commented. `npm run typecheck` and `npm run lint` both exit clean. The concerns below are real but mostly concentrated in three places: the legacy home page (`src/App.tsx`), the unproved third-party form provider, and repository hygiene left over from GSD tooling.

## Tech Debt

**Analytics provider is a permanently-dead stub:**
- Issue: `resolveMeasurementProvider()` in `src/products/haoo.ts:29` reads `VITE_HAOO_MEASUREMENT_PROVIDER` and then returns `'none'` on *both* branches of its ternary. The environment variable can never change behavior, and no `eventSink` adapter is ever supplied by `src/pages/ProductPage.tsx`, so every `track()` call in `src/measurement/index.ts:317` is a local-only flag write.
- Files: `src/products/haoo.ts`, `src/measurement/index.ts`, `src/pages/ProductPage.tsx`
- Impact: The MEAS requirement family (aggregate product learning) produces no data. The disclosure copy in `src/products/haoo.ts:70+` describes signals that are counted nowhere off-device.
- Fix approach: Phase 4 work. Either wire a real provider behind the existing `eventSink` seam, or collapse `resolveMeasurementProvider` to a literal and make the disclosure copy describe local-only context honestly.

**Two form implementations with divergent quality:**
- Issue: The HAOO qualification form (`src/components/QualifyForm.tsx`, `src/components/qualify-form.logic.ts`) is an AJAX form with validation, an abort-based 15s timeout, an allowlist-checked payload builder, a reserved-label guard, and a recovery panel. The home contact form (`src/App.tsx:547`) is a raw native `<form action method="POST">` with only browser-native constraint validation and no recovery path.
- Files: `src/App.tsx:142-200`, `src/App.tsx:547-628`
- Impact: The primary company-wide lead capture path has strictly weaker guarantees than the product-specific one, and shares no code with it.
- Fix approach: Migrate the home contact form onto the `QualifyForm` + `ProductQualifyForm` config seam already proven for HAOO. `src/products/types.ts:96` already models an endpoint-per-form.

**`QualifyForm.tsx` exports non-component values, disabling Fast Refresh:**
- Issue: Four `react-refresh/only-export-components` warnings (documented in `.planning/phases/02-submit-a-qualified-haoo-enquiry/deferred-items.md`). Lint exits 0 because these are warnings.
- Files: `src/components/QualifyForm.tsx`
- Impact: Developer-experience only — the file does not hot-reload.
- Fix approach: The pure helpers already have a home in `src/components/qualify-form.logic.ts`; move the remaining four.

**Home page copy is duplicated between the rendered page and the download blob:**
- Issue: Company history, mission, vision, and all three service descriptions are written twice — once inside the `downloadCompanyProfile()` template literal (`src/App.tsx:26-88`) and once in the JSX/`SERVICES` constant (`src/App.tsx:153-168`, `src/App.tsx:327`).
- Files: `src/App.tsx`
- Impact: The downloaded company profile can silently drift from the published page. No test asserts they agree.
- Fix approach: Extract a single copy module (mirroring the pattern already used in `src/products/copy.ts`) and generate the download from it.

**`src/App.tsx` is a 661-line mixed-concern module:**
- Issue: Routing, the `useInView` hook, the profile-download side effect, nav-link composition, all page copy, and the whole home page JSX live in one file. Compare with `src/pages/ProductPage.tsx` (298 lines) which delegates to `src/components/*`.
- Files: `src/App.tsx`
- Impact: Every home page change touches the same file; conflicts and accidental copy regressions are likely.
- Fix approach: Split along the boundaries `ProductPage` already demonstrates — a `pages/HomePage.tsx`, a `home/copy.ts`, and section components.

## Known Bugs

**`npm run test:unit` fails on a stale `dist/` in a clean checkout:**
- Symptoms: `src/test/build-output.test.ts:210` fails with `Stale build output dist/assets/main-*.css ... is older than build input src/pages/ProductPage.tsx`. Reproduced at analysis time: 1 failed / 515 passed.
- Files: `src/test/build-output.test.ts`, `package.json` (`test` vs `test:unit`)
- Trigger: Editing any source file without re-running `npm run build`. CI is safe because `.github/workflows/deploy.yml` runs Build immediately before `test:unit`; local developers running `test:unit` directly are not.
- Workaround: Run `npm run test` (which builds first) or `npm run build` before `test:unit`.

**Vitest collects and runs tests out of the leftover git worktree:**
- Symptoms: The test run reports duplicate suites such as `.claude/worktrees/rf-03-retry-1788205465/src/test/products-section.test.tsx`. 20 test files reported where `src/test/` contains 12.
- Files: `vitest.config.ts` (no `test.include` / `test.exclude`), `.claude/worktrees/`
- Trigger: Any abandoned GSD review-fix worktree under `.claude/worktrees/`.
- Workaround: Remove the worktree (`git worktree remove`), or pin `test.include: ['src/**/*.test.{ts,tsx}']` in `vitest.config.ts`. The latter is the durable fix — a stale worktree can currently turn a passing branch red or, worse, mask a deleted test.

**Contact success banner is triggered by a URL query parameter alone:**
- Symptoms: `src/App.tsx:181` derives `contactSubmitted` from `?contact=success` in the address bar and renders "Message sent successfully / Our team will get back to you shortly." Anyone visiting or bookmarking that URL sees the confirmation without having sent anything.
- Files: `src/App.tsx:180-195`, `src/App.tsx:143` (`CONTACT_SUCCESS_URL`)
- Trigger: Navigating to `https://www.zero-paperhub.com/?contact=success`.
- Workaround: None in code. Note this directly contradicts the truthfulness discipline enforced on the HAOO path, where `QualifyForm` derives its terminal state from `response.ok` only and never claims mailbox receipt (`src/components/QualifyForm.tsx:314-320`).

## Security Considerations

**All lead data transits a third-party form relay:**
- Risk: Both forms POST visitor-entered names, emails, organizations, portfolio details, and free-text messages to `formsubmit.co`, which receives the entire payload in cleartext-to-them before forwarding to a mailbox.
- Files: `src/App.tsx:142` (`https://formsubmit.co/info@zero-paperhub.com`), `src/products/haoo.ts:129` (`QUALIFY_ENDPOINT_FALLBACK`), `src/products/copy.ts:88`
- Current mitigation: Well-designed. `src/products/haoo.ts:132-160` validates any configured endpoint to an absolute `https://formsubmit.co/ajax/{target}` URL and rejects other protocols, hosts, credentials, queries, and fragments. `buildSubmissionBody()` in `src/components/qualify-form.logic.ts` throws if a product field tries to claim a reserved provider label (`_next`, `_cc`, `_replyto`, …), which closes the obvious payload-injection route. The risk is acknowledged in-repo.
- Recommendations: Treat the provider as untrusted and document it in a privacy notice; the disclosure copy currently describes measurement carefully but the third-party relay less prominently. Longer term, a first-party endpoint removes the class entirely.

**The home contact form and the HAOO form make inconsistent anti-abuse claims:**
- Risk: The home form's trust line (`src/App.tsx:619`) states "Protected by reCAPTCHA and an automated spam trap." The HAOO payload explicitly sets `_captcha: 'false'` (`src/components/qualify-form.logic.ts`), so the HAOO path has the honeypot only. If the HAOO form ever inherits the home form's copy, the claim becomes false.
- Files: `src/App.tsx:619`, `src/components/qualify-form.logic.ts` (`buildSubmissionBody`), `HONEYPOT_NAME`
- Current mitigation: Honeypot `_honey` field present on both forms; length caps on every input.
- Recommendations: Keep the copy per-form and add a test asserting the trust line matches the actual `_captcha` value, the way `src/test/haoo-content.test.ts` pins other copy.

**Endpoint configuration is build-time only and silently falls back:**
- Risk: `VITE_HAOO_FORM_ENDPOINT` is inlined at build time from a GitHub Actions repository variable (`.github/workflows/deploy.yml`). If the variable is unset, misspelled, or fails validation, the build succeeds and ships `QUALIFY_ENDPOINT_FALLBACK` (`info@haoo.online`) with no signal.
- Files: `src/products/haoo.ts:123-176`, `src/vite-env.d.ts`, `.github/workflows/deploy.yml`
- Current mitigation: The fallback is a real address, and validation prevents a malicious value from being used.
- Recommendations: Fail the build (or emit a loud warning step in CI) when the variable is absent on a production build, so a misconfigured deploy is not indistinguishable from an intentional default.

**Contact address is hardcoded in the bundle:**
- Risk: `info@zero-paperhub.com` appears literally in the shipped JavaScript and the downloadable profile, harvestable by scrapers.
- Files: `src/App.tsx:87`, `src/App.tsx:142`
- Current mitigation: None.
- Recommendations: Accept as a deliberate tradeoff for a public contact address, or route through the relay's opaque target hash.

**Not found (good):** No secrets committed. `.gitignore` explicitly excludes the whole `.env.*` family with a comment explaining why. No `dangerouslySetInnerHTML`, `eval`, `innerHTML`, `@ts-ignore`, or `eslint-disable` anywhere in `src/`. No `any` in application code.

## Performance Bottlenecks

None material at this size — a static two-page Vite site with three runtime dependencies. Two minor notes:

**Per-section `IntersectionObserver` instances:**
- Problem: `useInView()` (`src/App.tsx:91-105`) creates one observer per animated section; five are live on the home page.
- Cause: Hook-per-section design.
- Improvement path: Not worth changing. Each observer self-disconnects on first intersection.

**Unthrottled scroll listener:**
- Problem: `src/App.tsx:186` attaches a `scroll` handler that calls `setScrolled` on every scroll event.
- Cause: No `requestAnimationFrame` guard or threshold-change check; React bails out on the identical boolean, so the cost is the handler call itself.
- Improvement path: Guard with a ref comparison if the home page ever gets heavier.

## Fragile Areas

**Routing is a single `data-page` attribute read:**
- Files: `src/App.tsx:655` (`document.body.dataset.page === 'haoo-product'`), `products/haoo/index.html:22`, `vite.config.ts` (multi-input `rollupOptions`)
- Why fragile: There is no router. Page identity lives in a hand-written HTML attribute in a second entry-point file that must stay in sync with `vite.config.ts` inputs and the deploy directory layout. A typo in `data-page` silently renders the home page at the product URL. `document` is also read at module scope in the `App` component body, so any SSR or non-DOM import breaks.
- Safe modification: When adding a product, add all three in one commit — the `products/<slug>/index.html` entry, the `rollupOptions.input` key, and the `PRODUCTS` array in `src/products/registry.ts`. `src/test/build-output.test.ts` is the guard that catches a partial change.
- Test coverage: Good — `src/test/product-shell-reuse.test.tsx` and `src/test/build-output.test.ts` cover the shell and the built artifact.

**`document.getElementById('root')!` non-null assertion:**
- Files: `src/main.tsx:6`
- Why fragile: Both entry HTML files must contain `<div id="root">`. A missing root throws an unhandled TypeError with no fallback UI.
- Safe modification: Both `index.html` and `products/haoo/index.html` include a `<noscript>` block, so the no-JS path degrades well; the failed-JS path does not.
- Test coverage: Indirect via build-output assertions.

**`QualifyForm` state composition depends on a ref, not the render closure:**
- Files: `src/components/QualifyForm.tsx:142` (`valuesRef`), `src/components/QualifyForm.tsx:280-325`
- Why fragile: The WR-08 fix routes field writes through `valuesRef.current` because the render closure is stale under batched writes. The reasoning is documented at length in `.planning/phases/02-submit-a-qualified-haoo-enquiry/deferred-items.md`, but the fix has **no direct regression test** — it was proven untestable through DOM events under React 18 + jsdom. A future refactor can silently reintroduce the stale-closure bug.
- Safe modification: Extract field-write composition into a standalone reducer that can be unit-tested directly. This is the documented recommendation for whichever plan next opens the file.
- Test coverage: Indirect only — payload contracts in `src/test/qualify-form.test.tsx` assert against `valuesRef.current`, so a broken ref read is caught but a broken closure write is not.

**`localStorage` context parsing is strict by design and fails closed:**
- Files: `src/measurement/index.ts:97-145` (`parseContext`), `src/measurement/index.ts:262-300`
- Why fragile: `exactKeys()` rejects any record whose key set is not byte-exact, and `record.version !== config.schemaVersion` rejects any older record. Any change to `interactionFlags` in `src/products/haoo.ts` invalidates every stored record in the field.
- Safe modification: This is correct and intentional — invalid records are removed and a fresh context is written, so the failure mode is losing engagement history, never a crash. Bump `schemaVersion` deliberately when changing the flag list.
- Test coverage: Strong — `src/test/measurement.test.ts` (438 lines) and `src/test/measurement-page.test.tsx` (798 lines).

## Scaling Limits

**Product registry is a hand-maintained array:**
- Current capacity: One product (`HAOO_PRODUCT` in `src/products/registry.ts:14`).
- Limit: Each additional product needs a Vite rollup input, an HTML entry file, a definition module, and a registry entry — four coordinated edits with no generator.
- Scaling path: Derive `rollupOptions.input` from `PRODUCTS` in `vite.config.ts`, and template the entry HTML. `productRoute()` already derives the URL from the slug, so the naming contract exists.

**Static hosting has no server-side capability:**
- Current capacity: GitHub Pages, custom domain via `CNAME`.
- Limit: No server means no rate limiting, no server-side validation, no submission log, and no way to prove delivery. All three are currently outsourced to `formsubmit.co`.
- Scaling path: A serverless function endpoint when lead volume or compliance requires an audit trail.

## Dependencies at Risk

**`formsubmit.co`:**
- Risk: A free third-party relay is the single point of failure for every lead the business receives, with no SLA and no delivery receipt. The v1 milestone audit records that endpoint activation and mailbox delivery are **unproved**.
- Impact: Total, silent lead loss. `QualifyForm` correctly reports only "Your details were sent" (never "received"), so a provider that 200s and drops the mail is invisible from the page.
- Migration plan: Serverless relay behind a first-party domain. The `ProductQualifyForm.endpoint` seam in `src/products/types.ts:96` and the validation in `src/products/haoo.ts:132` make swapping providers a contained change.

**`lucide-react` is excluded from dependency pre-bundling:**
- Risk: `vite.config.ts` sets `optimizeDeps.exclude: ['lucide-react']`, a workaround dating to the Bolt scaffold (`.bolt/`).
- Impact: Slower cold dev-server starts. No production impact.
- Migration plan: Remove the exclusion and confirm dev startup; it is likely obsolete on Vite 5.

**Scaffold metadata never updated:**
- Risk: `package.json` still declares `"name": "vite-react-typescript-starter"` and `"version": "0.0.0"`.
- Impact: Cosmetic, but it means the project has no version identity for release notes or bug reports.
- Migration plan: Set a real name and adopt versioning at milestone boundaries.

## Missing Critical Features

**No deployed proof of the HAOO qualification journey (Phase 5, unimplemented):**
- Problem: `.planning/v1-MILESTONE-AUDIT.md` records that the production site contains Phase 1 but not the Phase 2 qualification journey, and that device, accessibility, deployment, and provider checks have never run against production.
- Blocks: Launch. Requirements `QUAL-01..QUAL-03` and `QUAL-05` are unowned by any phase directory.

**No truthful engagement reporting (Phase 4, in planning):**
- Problem: The audit flags a live contradiction — the public disclosure implies a page-use summary accompanies submission, while the current payload and its tests explicitly exclude one. Phase 3's `03-VERIFICATION.md` defers this truth to Phase 4.
- Blocks: `LEAD-03`, `MEAS-01`, `MEAS-05`, `MEAS-08`.

**No end-to-end or real-browser testing:**
- Problem: All 516 tests run in jsdom. `03-VERIFICATION.md` lists four human-verification items that automated checks cannot reach: 320px/200%-zoom layout, native PDF handling, real `localStorage` policy, and actual provider UX.
- Blocks: Confidence in the deployed journey; these remain open human tasks.

## Test Coverage Gaps

**`src/App.tsx` home page — largely untested:**
- What's not tested: The contact form (submit handler, `checkValidity` gate, disabled-button state), the `?contact=success` banner, `downloadCompanyProfile()`, `useInView`, the mobile menu, and the scroll header. Only `homeNavLinks` composition is exercised, via `src/test/products-section.test.tsx`.
- Files: `src/App.tsx`
- Risk: The company's primary lead form and its (currently spoofable) success banner can regress unnoticed. Contrast with `src/components/QualifyForm.tsx`, covered by a 1,772-line suite.
- Priority: High.

**WR-08 stale-closure regression:**
- What's not tested: Field-write composition from `valuesRef.current` under batched writes, as documented above.
- Files: `src/components/QualifyForm.tsx:142`
- Risk: Silent payload corruption on fast/batched input.
- Priority: Medium — needs the reducer extraction first.

**Copy synchronization between page and downloadable profile:**
- What's not tested: That `downloadCompanyProfile()` output agrees with the rendered `SERVICES` / about copy.
- Files: `src/App.tsx`
- Risk: A published page and a downloaded profile stating different things about the company.
- Priority: Medium.

**Repository hygiene affecting the suite:**
- What's not tested: Nothing guards against `vitest` collecting from `.claude/worktrees/`. Duplicate suites currently run on every invocation.
- Files: `vitest.config.ts`
- Risk: False greens and false reds; a deleted test can appear to still pass from the stale worktree copy.
- Priority: High — one-line fix.

---

*Concerns audit: 2026-09-01*
