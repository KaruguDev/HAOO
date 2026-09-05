---
last_mapped_commit: e91a3b97ce46cd965624cfda94abc6c34c86d2a4
---
<!-- refreshed: 2026-09-05 -->
# Codebase Concerns

**Analysis Date:** 2026-09-05

**Verification basis:** every claim below was checked against the working tree at `e91a3b9`, not against the planning record. `npm run typecheck && lint && build && test:unit && verify:coverage` were all run: **685 tests pass in 11 files, coverage audit passes (69 capabilities / 3 tables).** Several items the prompt listed as "known open" are in fact ALREADY CLOSED in code and are recorded here as stale-documentation concerns instead.

---

## Blocking Concern — the deployed site does not do what the repository does

**G-04.1-3 (open, owner action, no code can close it):**
- Issue: HAOO measurement is fully implemented and proven against the real pinned SDK, but the published site captures nothing.
- Files: `.github/workflows/deploy.yml` (Build step reads `${{ vars.VITE_HAOO_MEASUREMENT_PROVIDER }}`, `VITE_HAOO_POSTHOG_TOKEN`, `VITE_HAOO_POSTHOG_API_HOST`), `src/products/haoo.ts:220-224` (`resolveMeasurementProvider` / `providerConfig`), `.planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/04.1-VERIFICATION.md`
- Two independent causes:
  1. **Unpushed work.** `origin/main` is at `7ba2c89`; `HEAD` is **2 commits ahead** (the verification report's "14 commits behind" is stale — most of that round has since been pushed).
  2. **The three GitHub Actions repository VARIABLES are not confirmed created.** An absent variable expands to `""`, `resolveMeasurementProvider` fails closed to `none`, no sink is created, and typecheck, lint, `verify:coverage`, build and all 685 tests stay green while the deploy captures nothing.
- Impact: a green CI run is not evidence of a capturing deploy. Zero events in PostHog will read as a dead funnel rather than a broken configuration. UAT checkpoints 8 and 10 cannot run.
- Fix approach: owner creates `VITE_HAOO_MEASUREMENT_PROVIDER=posthog`, `VITE_HAOO_POSTHOG_TOKEN=phc_...`, `VITE_HAOO_POSTHOG_API_HOST=https://us.i.posthog.com` as repository *variables* (not secrets), pushes `main`, then performs UAT checkpoint 10 before checkpoint 8. **Do not route this to `/gsd-plan-phase --gaps`** — the repository side is already satisfied.

---

## Tech Debt

**Stale verification and audit records (highest-value cleanup):**
- Issue: `.planning/` describes defects that the tree no longer has. Downstream agents planning 04.2 will re-fix already-fixed code or block on phantom gaps.
- Files: `.planning/phases/02-submit-a-qualified-haoo-enquiry/02-VERIFICATION.md` (`status: gaps_found`, `verified: 2026-08-30`), `.planning/v1-MILESTONE-AUDIT.md` (`audited: 2026-08-30`, still says Phases 03/04/05 have "no phase directory")
- Measured against the tree, **three of the four upheld Phase 2 blockers are closed:**
  | Reported blocker | Live state |
  |---|---|
  | CR-02 success copy overclaims email delivery | **CLOSED.** `src/products/copy.ts:88` now reads "Your details were submitted. If you don't hear back within one business day, use one of the contacts below." No delivery claim. |
  | CR-01 disclosure/payload contradiction | **CLOSED.** `qualifyCollectionNotePageContext` (`copy.ts:123-127`) and `buildSubmissionBody` (`qualify-form.logic.ts:112-147`, appends `qualify.engagementSummary.emailLabel`) now agree; the summary is really attached. |
  | Phone validator accepts punctuation-only values | **CLOSED.** `src/products/haoo.ts:712` — `^(?=(?:[^0-9]*[0-9]){7,})\+?[0-9 ()-]+$` requires at least seven digits. |
  | CR-04 edits during submission discarded | **CLOSED.** `src/components/QualifyForm.tsx:395` (`disabled: state === 'submitting'`) plus the snapshot comment at `:389-394`; pinned by the passing test "locks every control while a request is in flight, then releases them". |
- Residual (genuinely still open): `QUALIFY_CONFIRMATION_HEADING = 'Your details are on their way'` (`QualifyForm.tsx:52`) is still a soft transit claim derived from `response.ok` alone (`:358`), and there is no re-verification run recording any of the above.
- Fix approach: re-run `/gsd-verify-work` for Phase 2 and re-run `/gsd-audit-milestone`; do not carry the 2026-08-30 verdicts into 04.2 planning.

**Draft validation contracts:**
- Issue: `status: draft` / `nyquist_compliant: false` — confirmed in the tree.
- Files: `.planning/phases/02-submit-a-qualified-haoo-enquiry/02-VALIDATION.md`, `.planning/phases/03-build-privacy-bounded-engagement-context/03-VALIDATION.md`
- Impact: two of five executed phases have no audited feedback-sampling contract. `/gsd-audit-milestone` §5.5 will classify them NOT-VALIDATED, not PARTIAL.
- Fix approach: `/gsd-validate-phase 02` and `/gsd-validate-phase 03`. Note both files travel to the new HAOO repository under 04.2 D-03 and are still owed there.

**Hardcoded phase path in the CI coverage gate:**
- Issue: `package.json` `verify:coverage` hardcodes `.planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/COVERAGE.md`, and `.github/workflows/deploy.yml` runs it as a deploy-blocking step.
- Files: `package.json:11`, `scripts/verify-phase4-coverage.mjs` (317 lines, named for Phase 4 but auditing 04.1), `.github/workflows/deploy.yml`
- Impact: the next phase's COVERAGE.md is unaudited unless someone remembers to edit the script argument; renaming or archiving the 04.1 phase directory breaks the deploy.
- Fix approach: accept a phase argument or glob the current phase from `.planning/STATE.md`; rename the script off `phase4`.

**Placeholder project identity:**
- Issue: `package.json` still declares `"name": "vite-react-typescript-starter"`, `"version": "0.0.0"`.
- Files: `package.json:2-4`
- Impact: cosmetic today, actively confusing at the 04.2 split when two repositories both claim the starter name.

**Home page monolith with no measurement or test coverage:**
- Issue: `src/App.tsx` is 661 lines carrying the entire ZERO-PAPER HUB marketing page plus its own hand-rolled FormSubmit contact form (`:142-143`, `:557`), none of which uses the product shell, the measurement facade, or the disclosure discipline the HAOO half is held to.
- Files: `src/App.tsx`
- Impact: the company-site half has effectively no automated coverage while the product half has 685 tests. Any regression there ships silently.

**Documentation still naming the retired provider:**
- Issue: deliberate and documented (`.planning/phases/04.1-*/deferred-items.md` D5) — the reporting surface, two negative assertions, and the phase directory name retain "plausible" on purpose. But `README.md` and `04-USER-SETUP.md` still carry the four *removed* report-variable names (deferred-items "From 04.1-07").
- Fix approach: sweep the removed variable names out of `README.md` and `04-USER-SETUP.md`; leave the intentional retentions alone.

## Known Bugs

**Double-initialization raises the loudest privacy alarm falsely:**
- Symptoms: a second `createPostHogEventSink` call in one page load returns `undefined` and signals `posthog:unconfirmed-lockdown-readback`.
- Files: `src/measurement/posthog.ts` (~`:374`), `src/measurement/posthog-lockdown.ts:289-290`
- Trigger: `POSTHOG_LOCKDOWN` mints a fresh `before_send` per call while `boundPostHogClient()` returns the posthog-js module **singleton**, whose `init` short-circuits on re-entry and keeps the first configuration; identity comparison then fails.
- Workaround: the precondition holds today only by accident — MPA routing on `document.body.dataset.page` (`src/App.tsx:657`), one `useMemo` facade per mount, StrictMode double-mount being development-only, and no caller passing `measurementAdapters`. Nothing in `src/measurement` declares or enforces it.
- Fix approach: memoize the established sink per client+token+apiHost (review WR-01), or declare and assert the single-initialization precondition.

**FormSubmit endpoint is unactivated:**
- Symptoms: a real prospect can complete the form, see the confirmation panel, and have the submission go nowhere.
- Files: `src/products/haoo.ts` (`QUALIFY_ENDPOINT_FALLBACK` → `https://formsubmit.co/ajax/info@haoo.online`), `.planning/phases/02-*/02-USER-SETUP.md` (status Incomplete)
- Fix approach: Phase 5 LEAD-07 — activate the endpoint and prove a uniquely tagged production submission reaches the inbox or spam folder.

## Security Considerations

**`VITE_*` is world-readable and only a test enforces it:**
- Risk: Vite inlines every `VITE_*` value into the published bundle. A credential assigned to a `VITE_*` name would ship to every visitor.
- Files: `.github/workflows/deploy.yml` (Build env), `src/test/build-output.test.ts` (reads the workflow at `:743`, asserts every `VITE_*` value is exactly one `${{ vars.* }}` expression and that `POSTHOG_QUERY_API_KEY` / `POSTHOG_PROJECT_ID` are absent)
- Current mitigation: the workflow-shape assertion plus the bundle credential scan — genuinely good, and the reason the three PostHog values are variables rather than secrets.
- Recommendations: keep the workflow-reading assertions load-bearing through the 04.2 split; they are the only thing standing between the report credentials and the public bundle.

**Spam control is a honeypot and nothing else:**
- Risk: `_captcha: 'false'` (`src/components/qualify-form.logic.ts:118`) plus `_honey`. A trivially scriptable endpoint sits behind a public form.
- Files: `src/components/qualify-form.logic.ts:112-125`, `src/components/QualifyForm.tsx`
- Recommendations: accepted for v1; revisit if the HAOO inbox takes volume after LEAD-07 activation.

**Unresolved Kenya DPA 2019 / processor sign-off:**
- Risk: the collection disclosure is published copy about a real data-collection practice with no privacy/legal sign-off recorded.
- Files: `.planning/phases/02-*/02-VALIDATION.md:91`, `src/products/copy.ts:105-127`, `src/components/MeasurementDisclosure.tsx`
- Current mitigation: `qualifyCollectionNoteProcessor` names FormSubmit explicitly; 04.1 added the US-processing statement.
- Recommendations: 04.2 D-09 makes this a BLOCKING human checkpoint — a change of origin for the collecting site falls squarely inside what the sign-off must cover. An executor may not clear it.

## Performance Bottlenecks

**279.67 kB vendor chunk on a marketing product page:**
- Problem: `posthog-js` 1.425.1 ships as the `posthog-sdk` manual chunk in **every** build, including provider-unset builds.
- Files: `vite.config.ts:65-68`, `src/measurement/posthog.ts:1`
- Cause: a value-position import was required to close G-04.1-1; the chunk is emitted regardless of whether the provider resolves to `none`.
- Improvement path: dynamic `import()` behind the provider check, so a `none` build never fetches it. Would need the bundle invariants in `src/test/build-output.test.ts` re-derived against an async chunk.

**Build-output suite dominates test time:**
- Problem: `src/test/build-output.test.ts` takes ~16.8s of an ~18.6s run, with two cases spending 10.3s and 6.3s spawning their own probe builds.
- Files: `src/test/build-output.test.ts:411-460`
- Improvement path: acceptable today; watch it if more probe builds are added at the split.

## Fragile Areas

**`src/test/build-output.test.ts` (1653 lines) — the single most fragile artifact in the repository:**
- Files: `src/test/build-output.test.ts`
- Why fragile: it reads three inputs it does not own — `.github/workflows/deploy.yml`, the repository's own `dist/` (gitignored, so a stale build silently changes what is asserted), and the source tree via a path-keyed `PRODUCT_SOURCE_BOUNDARY` map (`:129-156`). Its own comments record that an earlier version passed vacuously against nothing.
- Safe modification: never delete a boundary regex — narrow it to a named successor and record the withdrawal (the 04.1 precedent in `deferred-items.md` D1–D5). Never remove a `toBeGreaterThan(0)` guard; those are what stop vacuous passes.

**Vendor contract is a transcription, not the vendor:**
- Files: `src/test/fixtures/posthog-capture-contract.ts`, `src/measurement/posthog-lockdown.ts`
- Why fragile: every in-repo test exercises a fixture copy of posthog-js defaults (recorded gap WR-F: 20 documented default keys vs 33 asserted). The 33-key readback was only ever confirmed against the real SDK by an out-of-band verifier probe; **nothing in the suite re-runs that probe**, so a version bump can drift the fixture away from reality while staying green.
- Fix approach: add a test that imports the pinned module, runs `init` with `POSTHOG_LOCKDOWN`, and runs `lockdownHolds` against `instance.config` with network patched out.

**Path-keyed and literal-keyed invariants generally:**
- Files: `src/test/build-output.test.ts:129-156`, `src/test/qualify-data.test.ts:189`, `src/test/measurement.test.ts:40` and its ~20 hardcoded `www.zero-paperhub.com/products/haoo/` hrefs
- Why fragile: a file move or a hostname change breaks assertions in files far from the change.

## Scaling Limits

**CI runs on `push: main` only:**
- Current capacity: one workflow, `.github/workflows/deploy.yml`, triggered by push to `main` or manual dispatch.
- Limit: there is **no pull-request gate**. Typecheck, lint, coverage audit and the 685 tests run only at deploy time, so a bad merge is discovered by a failed deploy rather than by a failed check.
- Scaling path: split a `ci.yml` (typecheck/lint/verify/test on PR) from the deploy job; the split into two repositories in 04.2 forces this workflow to become two anyway.

**`npm test` is not what CI runs:**
- Issue: `"test": "npm run build && vitest run"` rebuilds *without* the deploy env, so running it in the deploy job would overwrite the artifact about to be uploaded — which is why the workflow runs `test:unit` after Build. A contributor running `npm test` locally is therefore validating a differently-configured `dist/` than the one that ships.
- Files: `package.json:8-9`, `.github/workflows/deploy.yml` (Test step comment)

## Dependencies at Risk

**`posthog-js` 1.425.1 (exact pin):**
- Risk: the pin is asserted as a literal inside the emitted vendor chunk; the privacy guarantees depend on a 33-key config readback against a minified third-party artifact.
- Impact: any bump can silently break `lockdownHolds`, or introduce an identity/storage token that the narrowed bundle scans no longer cover.
- Migration plan: bump only alongside a real-SDK probe test (see Fragile Areas) and a re-measurement of the `deferred-items.md` D4 narrowing table.

**FormSubmit (third-party email forwarder):**
- Risk: the entire lead funnel depends on an unactivated free third-party endpoint whose token-to-mailbox mapping lives outside this repository.
- Impact: total lead loss with a 2xx-shaped success.
- Migration plan: LEAD-07 activation proof first; a self-owned endpoint is the long-term answer.

## Missing Critical Features

- **Proof of live delivery** (LEAD-07, Phase 5) — nothing today proves a submission reaches a mailbox.
- **Live measurement acceptance** — whether PostHog Cloud US accepts a payload reduced to three transport properties, and honours `$process_person_profile: false`, is unproven (UAT checkpoint 10).
- **LEAD-02 routing fidelity** — a prospect selecting role "Other" gives no free-text follow-up; flagged for owner judgment, unresolved.

## Test Coverage Gaps

**No layout engine, therefore no responsive/zoom proof:**
- What's not tested: 320px reflow and 200% zoom for the qualification form, the error summary, the collection notice and the measurement disclosure processor group.
- Files: `src/components/QualifyForm.tsx`, `src/components/MeasurementDisclosure.tsx`
- Risk: clipped or overlapping privacy copy on real phones — the copy most needs to be readable.
- Priority: High (Phase 2 COVERAGE D9; 04.1 UAT checkpoint 7).

**No browser/e2e layer at all:**
- What's not tested: the real navigation, real network, real storage path. Everything is jsdom.
- Priority: Medium.

**The ZERO-PAPER HUB home page:**
- What's not tested: `src/App.tsx` and its contact form — no dedicated suite exists.
- Files: `src/App.tsx`
- Risk: the half of the product that survives the 04.2 split is the untested half.
- Priority: High, and rising, because 04.2 leaves this file behind alone.

---

## Split Fragility — what breaks if this becomes two repositories

Assessed against `.planning/phases/04.2-split-haoo-into-its-own-repository-and-domain/04.2-CONTEXT.md` and measured against the tree. Ordered by risk.

**1. `src/test/build-output.test.ts` — highest risk, both of its inputs change.**
- It reads `.github/workflows/deploy.yml` (`:743`) and the repository's own `dist/`. After the split there are two workflows and two `dist/`s, and the reduced ZERO-PAPERHUB build has no PostHog variables, no `posthog-sdk` chunk and no HAOO entry.
- Concretely at risk: `chunkFilesIn`/`vendorChunkText` (`:398-425`) throws "No `posthog-sdk` chunk" in the ZERO-PAPERHUB repo by construction; `projectBundleText()` (`:426-460`) becomes the whole bundle there; every `PRODUCT_TITLE`/`PRODUCT_URL`/`PRODUCT_IMAGE` HTML assertion (`:551-570`) loses its subject in ZERO-PAPERHUB and every `ROOT_*` assertion (`:576-593`) loses its subject in HAOO; the asset SHA pins (`:608-616`) follow `public/products/haoo/` to the new repo.
- `PRODUCT_SOURCE_BOUNDARY` (`:129-156`) is keyed by repo-relative path *and* cross-checked against declared dependencies (`:789`), so half its keys become nonexistent files in each repo — a boundary map with a missing subject can pass vacuously, which is exactly the failure mode this file was written to prevent.

**2. Hostname and identity literals that become false on `haoo.online`.**
- `src/products/haoo.ts:585` — the form's `Source` line names `www.zero-paperhub.com/products/haoo/`, pinned byte-for-byte at `src/test/qualify-data.test.ts:189`.
- `CNAME` (`www.zero-paperhub.com`) and `public/CNAME.txt`.
- `products/haoo/index.html` — `rel="canonical"`, `og:url`, `og:site_name`.
- `src/test/measurement.test.ts` — roughly twenty hardcoded `https://www.zero-paperhub.com/products/haoo/` hrefs (`:80`, `:153`, `:181`, `:198`, `:419`, `:438`, `:476`, `:530`, `:2124`, …). These are the quietest breakage: they will keep passing while asserting a hostname the site no longer has.

**3. The `zph.` storage key.**
- `src/products/haoo.ts:188` `storageKey: 'zph.haoo.ctx.v1'`, pinned at `src/test/measurement.test.ts:40`. `localStorage` is origin-scoped, so every existing record is unreachable at the new origin (accepted as a reset, D-10) and the prefix becomes a misnomer. Renaming it must be handled as a Phase 3 D-10 schema-version event, not an edit.

**4. The reuse guarantee, PROD-06.**
- `src/test/product-shell-reuse.test.tsx` builds a **synthetic** product (`:61`, `:194`) rather than a second real one, so mechanically it survives the split intact — its own comment at `:186` calls it "the only enforcement of the reuse rule". What genuinely dies is the *claim* that the registry demonstrates reuse across more than one product (`src/products/registry.ts` imports `HAOO_PRODUCT`; `src/test/products-section.test.tsx` asserts across both halves). Retire the withdrawn half with a named successor (D-05) rather than deleting the test.

**5. The build-time coupling and the scripts.**
- `src/products/registry.ts` → `HAOO_PRODUCT` is the single build-time edge D-06 severs; the replacement inline card can drift from HAOO's own copy with nothing checking it (named as an accepted cost).
- `package.json` `verify:coverage` and `report:haoo` both point at HAOO phase paths and must move with HAOO — and `verify:coverage` is a deploy-blocking step in a workflow that stays behind.
- `vite.config.ts:38-68` — two entry inputs and the `posthog-sdk` manual chunk; each repo keeps one entry and ZERO-PAPERHUB needs neither the chunk nor the analytics `define`.
- `config/approved-analytics-hosts.ts` — the repository-owned ingestion trust anchor, meaningless in the reduced repo.

**6. Cross-document SHA citations.**
- 04.1 documents cite commit SHAs directly (`caf7957`, `2179e6a`, `b3ffd4c`, `4df69a3`). D-01's clone-and-prune preserves them; any history rewrite would silently invalidate the entire 04.1 evidence trail. Treat `filter-repo` as prohibited, as D-02 already does.

**7. Debt that simply travels.**
- The Phase 2 draft VALIDATION.md, the Phase 3 draft VALIDATION.md, the open Kenya DPA sign-off, and the confirmation-heading residual all move to the HAOO repository unchanged and are still owed there. `.planning/` moving whole (D-03) means the ZERO-PAPERHUB repo loses its own planning history along with it.

---

*Concerns audit: 2026-09-05*
