---
phase: 05
slug: prove-the-deployed-journey
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-07
updated: 2026-09-07
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> **Working directory: the HAOO checkout** (plan 05-01, D-01/D-04). Every command below is
> HAOO-relative; the ZERO-PAPER HUB checkout is reached as `../ZERO-PAPERHUB`. Exactly one checkout
> exists per repository and no git worktree is created — a leftover worktree previously made the
> runner collect every suite twice, and this phase's central product is test evidence, so a doubled
> suite would not be a nuisance here but would invalidate the output.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (existing, both repos)** | Vitest `3.2.4` + jsdom `26.1.0` + Testing Library React `16.3.2` |
| **Framework (new this phase, HAOO only)** | `@playwright/test@1.63.0` + `@axe-core/playwright@4.13.0`, Chromium engine only |
| **Config file (existing)** | `vitest.config.ts` — both repos; `exclude` extended with `e2e/**` by plan 05-03 |
| **Config file (new)** | `playwright.config.ts` — HAOO only, created by plan 05-03 (Wave 0). `testMatch: '**/*.e2e.ts'` is mandatory, not stylistic |
| **Type-check projects** | `tsconfig.app.json`, `tsconfig.node.json`, and `tsconfig.e2e.json` (new, plan 05-03) — without the third project every line of the harness escapes `npm run typecheck`, which is one of the six gates D-15 enumerates |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm test` (build + Vitest), **plus** `npm run test:e2e` (preview project) |
| **Live evidence command** | `npm run test:e2e:live` — a deliberate, recorded run; never on every push |
| **Estimated runtime** | `npm run test:unit`: ~20 s HAOO / ~2.5 s ZERO-PAPER HUB. `npm test`: ~35 s HAOO. `npm run test:e2e`: ~2-4 min (preview, includes server start). `npm run test:e2e:live`: ~5-8 min (six viewports × two live surfaces, plus axe) |
| **Baseline collection** | HAOO 683 tests / 10 files; ZERO-PAPER HUB 32 tests / 3 files. Plan 05-03 records these before and after the harness is added and asserts they are unchanged |

**The enumerated gate list (D-15)** — stated explicitly rather than as "CI is green", in **both**
repositories: `build`, `typecheck`, `lint`, `npm test`, `verify:coverage` (HAOO only), `verify:disjoint`,
and the successor to `test:phase1:red` that plan 05-15 installs. Plus both GitHub Pages deployment
workflows concluding success. Plan 05-17 runs every one of them in its own session and records each
exit code as an integer — a gate recorded green in an earlier wave is a memory, not evidence.

---

## Sampling Rate

- **After every task commit:** `npm run test:unit` in the touched repository (~20 s / ~2.5 s).
- **After every plan wave:** `npm test && npm run test:e2e` in HAOO; `npm test` in `../ZERO-PAPERHUB`.
- **Before `/gsd-verify-work`:** every command in the enumerated gate list green in both repositories,
  **plus** one recorded `npm run test:e2e:live` run against a deployment containing this phase's fixes.
- **Max feedback latency:** 35 s for the unit gate; 4 min for the hermetic preview e2e gate.

**Live-network flake policy.** The `live` Playwright project sets `retries: 2` and the `preview`
project sets `retries: 0`. A live-network flake is not a defect; a hermetic flake is.

---

## Per-Task Verification Map

All 50 tasks across the 17 plans. Every `auto` and `tracer` task carries a runnable `<automated>`
command; the 7 rows without one are `blocking-human` checkpoints, which are verification *gates* for a
human rather than commands, and each is enumerated in § Manual-Only Verifications below.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Has Automated | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|---------------|--------|
| 01-01 | 01 | 1 | QUAL-05 | T-05-01 | No unique planning record can be destroyed: the sync runs before the walk, and a differing shared path halts the task | contract | `cmp .planning/phases/05-prove-the-deployed-journey/05-PATTERNS.md ../ZERO-PAPERHUB/.planning/phases/05-prove-the-deployed-journey/05-PATTERNS.md &&…` | ✅ | ⬜ pending |
| 01-02 | 01 | 1 | QUAL-05 | T-05-01 / T-05-02 | The irreversible deletion runs only as the right-hand side of a gate asserting both authorising integers read zero | contract | `grep -qE '^ZPH-only count:[[:space:]]*0[[:space:]]*$' .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-PLANNING-HOME.md && grep -qE '^Dif…` | ✅ | ⬜ pending |
| 01-03 | 01 | 1 | QUAL-05 | T-05-03 | Separation is re-proven in both checkouts after the removal, with both success lines recorded | contract | `npm run verify:disjoint && (cd ../ZERO-PAPERHUB && npm run verify:disjoint) && test "$(grep -c 'violations:' .planning/phases/05-prove-the-deployed…` | ✅ | ⬜ pending |
| 02-01 | 02 | 2 | LEAD-07 | T-05-08 | The record carries DNS answers only — no mailbox contents, no credentials | contract | `grep -q 'mx1.privateemail.com' .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-MAIL.md && grep -q '8\.8\.8\.8' .planning/phases/05-prove…` | ✅ | ⬜ pending |
| 02-02 | 02 | 2 | LEAD-07 | T-05-07 | MX gate is blocking-human; an executor may not clear it on its own judgment | manual | — (blocking-human checkpoint; see § Manual-Only Verifications) | n/a | ⬜ pending |
| 02-03 | 02 | 2 | LEAD-07 | T-05-05 / T-05-06 | MX is pinned to the two decided hosts from two independent resolvers, and the A records are re-asserted intact | integration | `test -n "$(dig +short MX haoo.online)" && dig +short MX haoo.online \| grep -q 'mx1.privateemail.com' && dig +short MX haoo.online @8.8.8.8 \| grep…` | ✅ | ⬜ pending |
| 03-01 | 03 | 2 | QUAL-01, QUAL-02, QUAL-03, QUAL-05 | T-05-SC | Package legitimacy verified by a human before any install; registry install only, never a git URL | manual | — (blocking-human checkpoint; see § Manual-Only Verifications) | n/a | ⬜ pending |
| 03-02 | 03 | 2 | QUAL-01, QUAL-02, QUAL-03, QUAL-05 | T-05-10 / T-05-11 | Automated traffic reaches no analytics sink, and a rule set silently narrowed to one rule fails the run | e2e | `npx playwright test --project=live e2e/tracer.e2e.ts && node -e "const r=require('./evidence/tracer.json'); if(!(r.tagFamilies>=3)) throw new Error…` | ✅ | ⬜ pending |
| 03-03 | 03 | 2 | QUAL-01, QUAL-02, QUAL-03, QUAL-05 | T-05-09 / T-05-12 | No browser-prefixed variable is added; the hermetic bundle gate stays independent of the network | contract | `npm run typecheck && npm run lint && npm test && node -e "const p=require('./package.json'); const t=p.scripts.typecheck; if((t.match(/tsc --noEmit…` | ✅ | ⬜ pending |
| 04-01 | 04 | 3 | QUAL-02, QUAL-03 | T-05-14 | A link naming a destination resolves to that destination; the pinning assertion moves in the same commit | unit | `npx vitest run src/test/haoo-page.test.tsx src/test/measurement-page.test.tsx && grep -c 'https://www.zero-paperhub.com/' src/components/ProductHea…` | ✅ | ⬜ pending |
| 04-02 | 04 | 3 | QUAL-02, QUAL-03 | T-05-16 | A focus-bearing component cannot sit outside the closed measurement list | unit | `npx vitest run src/test/focus-contrast.test.ts && npm run verify:disjoint && node -e "const s=require('fs').readFileSync('src/test/focus-contrast.t…` | ✅ | ⬜ pending |
| 04-03 | 04 | 3 | QUAL-02, QUAL-03 | T-05-17 | Deferred live defects are recorded as measured and unfixed, never as absent | contract | `grep -q 'F4' .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-PREFLIGHT-FIXES.md && grep -q 'F5' .planning/phases/05-prove-the-deployed-j…` | ✅ | ⬜ pending |
| 05-01 | 05 | 3 | QUAL-01, QUAL-02, QUAL-03 | T-05-18 | Every closed list carries a per-entry reason and a vacuity guard that fails on an empty subject set | contract | `npm run typecheck && npm run lint && npx tsx -e "import {SURFACES} from './e2e/fixtures/surfaces'; import {VIEWPORTS,ZOOM_VIEWPORTS} from './e2e/fi…` | ✅ | ⬜ pending |
| 05-02 | 05 | 3 | QUAL-01, QUAL-02, QUAL-03 | T-05-19 / T-05-20 / T-05-21 | One factory owns the rule set; the Products surface is scoped rather than rule-disabled; the recorder refuses a pass mark | contract | `npm run typecheck && npm run lint && node -e "const s=require('fs').readFileSync('e2e/fixtures/axe.ts','utf8'); if(!/import\s*\{\s*AxeBuilder/.test…` | ✅ | ⬜ pending |
| 05-03 | 05 | 3 | QUAL-01, QUAL-02, QUAL-03 | T-05-18 | The tracer runs through the fixture layer with every measured value unchanged | e2e | `npm run typecheck && npm run lint && npm test && npx playwright test --project=live e2e/tracer.e2e.ts && node -e "const s=require('fs').readFileSyn…` | ✅ | ⬜ pending |
| 06-01 | 06 | 3 | LEAD-07 | T-05-23 | A routine run cannot send live mail: the submitting spec is skipped unless explicitly armed | e2e | `npm run typecheck && npm run lint && git diff --name-only HEAD \| grep -qv '^src/' && npm run test:e2e:live 2>&1 \| grep -qiE 'skipped'` | ✅ | ⬜ pending |
| 06-02 | 06 | 3 | LEAD-07 | T-05-24 / T-05-25 | The marker is alphanumeric-and-hyphen only and the endpoint is asserted https and host-pinned | e2e | `grep -qE 'HAOO-ENDPOINT-ACTIVATION-[0-9]{8}T[0-9]{6}Z-[0-9a-f]{8}' .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-MAIL.md && grep -q 'A…` | ✅ | ⬜ pending |
| 06-03 | 06 | 3 | LEAD-07 | T-05-26 / T-05-27 | Activation is closed only by the owner verbatim; the record is bounded to five fields | manual | — (blocking-human checkpoint; see § Manual-Only Verifications) | n/a | ⬜ pending |
| 07-01 | 07 | 4 | QUAL-01, QUAL-02, QUAL-03 | T-05-28 / T-05-29 | Every surface is scanned in every reachable state through the single factory, with the tag-list length asserted per entry | e2e | `npx playwright test --project=live e2e/axe-baseline.e2e.ts && npx playwright test --project=preview e2e/axe-baseline.e2e.ts && node -e "const r=req…` | ✅ | ⬜ pending |
| 07-02 | 07 | 4 | QUAL-01, QUAL-02, QUAL-03 | T-05-30 | No finding is removed by configuration; the classification is derived from the machine record | contract | `grep -qi 'provenance' .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-AXE.md && grep -q 'D-OQ-3' .planning/phases/05-prove-the-deployed-…` | ✅ | ⬜ pending |
| 08-01 | 08 | 4 | QUAL-01 | T-05-33 | The load-bearing per-element sweep runs on the unmodified page; the two document readings carry distinct modes | e2e | `npx playwright test --project=live e2e/viewport.e2e.ts && node -e "const s=require('fs').readFileSync('e2e/viewport.e2e.ts','utf8'); if(!s.includes…` | ✅ | ⬜ pending |
| 08-02 | 08 | 4 | QUAL-01 | T-05-34 / T-05-36 | The closed action list vacuity guard runs first; the degraded card still resolves to the HAOO domain | e2e | `npm run typecheck && npm run lint && npx playwright test --project=live e2e/viewport.e2e.ts && node -e "const s=require('fs').readFileSync('e2e/vie…` | ✅ | ⬜ pending |
| 08-03 | 08 | 4 | QUAL-01 | T-05-35 / T-05-37 | Measured integers per width and per action, with the cross-origin degraded state recorded | contract | `grep -q 'modified-page' .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-VIEWPORT.md && grep -q 'D-OQ-2' .planning/phases/05-prove-the-de…` | ✅ | ⬜ pending |
| 09-01 | 09 | 4 | QUAL-02 | T-05-41 | Traversal terminates and every stop is leavable; no positive tab index anywhere | e2e | `npx playwright test --project=live e2e/keyboard.e2e.ts && node -e "const s=require('fs').readFileSync('e2e/keyboard.e2e.ts','utf8'); if(!s.includes…` | ✅ | ⬜ pending |
| 09-02 | 09 | 4 | QUAL-02 | T-05-38 / T-05-39 | Indicators measured as a computed-style change under real keyboard modality; opener protection asserted | e2e | `npx playwright test --project=live e2e/keyboard.e2e.ts && node -e "const s=require('fs').readFileSync('e2e/keyboard.e2e.ts','utf8'); for(const p of…` | ✅ | ⬜ pending |
| 09-03 | 09 | 4 | QUAL-02 | T-05-40 | The un-actionable embedded-viewer limit is recorded as neither pass nor failure | contract | `grep -qi 'observation' .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-KEYBOARD.md && grep -q 'D-OQ-3' .planning/phases/05-prove-the-dep…` | ✅ | ⬜ pending |
| 10-01 | 10 | 4 | QUAL-03 | T-05-44 | Heading order is spec-owned and asserted per state, not delegated to an advisory-tagged rule | e2e | `npx playwright test --project=live e2e/semantics.e2e.ts && node -e "const s=require('fs').readFileSync('e2e/semantics.e2e.ts','utf8'); for(const r …` | ✅ | ⬜ pending |
| 10-02 | 10 | 4 | QUAL-03 | T-05-43 / T-05-45 / T-05-46 | Names promise destinations truthfully; the equivalent survives the artifact being unavailable; three references asserted equal | e2e | `npm run typecheck && npm run lint && npx playwright test --project=live e2e/semantics.e2e.ts && node -e "const s=require('fs').readFileSync('e2e/se…` | ✅ | ⬜ pending |
| 10-03 | 10 | 4 | QUAL-03 | T-05-47 | Literal sequences and integer counts, with the stated equality convention | contract | `grep -qi 'observation' .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-SEMANTICS.md && grep -q 'D-OQ-3' .planning/phases/05-prove-the-de…` | ✅ | ⬜ pending |
| 11-01 | 11 | 4 | LEAD-07, QUAL-03 | T-05-53 | Scheme-only destinations are validated, never fetched | e2e | `npx playwright test --project=live e2e/recovery.e2e.ts && node -e "const s=require('fs').readFileSync('e2e/recovery.e2e.ts','utf8'); if(!/javaScrip…` | ✅ | ⬜ pending |
| 11-02 | 11 | 4 | LEAD-07, QUAL-03 | T-05-48 / T-05-49 | Exactly zero scripts asserted as an exact number; three destinations asserted equal to one another | e2e | `npx playwright test --project=live e2e/recovery.e2e.ts && node -e "const s=require('fs').readFileSync('e2e/recovery.e2e.ts','utf8'); if(!/route\.fu…` | ✅ | ⬜ pending |
| 11-03 | 11 | 4 | LEAD-07, QUAL-03 | T-05-50 / T-05-51 / T-05-52 | Redirects are not followed and recorded verbatim; a third-party outage is recorded, a malformed link fails; the journey survives the analytics origin blocked | e2e | `npx playwright test --project=live e2e/recovery.e2e.ts && grep -q 'validated, not fetched' .planning/phases/05-prove-the-deployed-journey/05-EVIDEN…` | ✅ | ⬜ pending |
| 12-01 | 12 | 4 | QUAL-02 | T-05-54 | Failure states are guarded to the preview project by a project-name check, never induced live | e2e | `npx playwright test --project=preview e2e/form-states.e2e.ts && npx playwright test --project=live e2e/form-states.e2e.ts && node -e "const s=requi…` | ✅ | ⬜ pending |
| 12-02 | 12 | 4 | QUAL-02 | T-05-55 / T-05-56 / T-05-57 / T-05-58 | Controls disabled in flight with a counted single request; no build-time variable introduced; retry absence asserted on the deterministic failure | e2e | `npx playwright test --project=preview e2e/form-states.e2e.ts && git diff --name-only HEAD -- src/ \| wc -l \| grep -qx 0 && node -e "const s=requir…` | ✅ | ⬜ pending |
| 12-03 | 12 | 4 | QUAL-02 | T-05-59 | The held-out visual item is marked not-a-pass and carries measured inputs | contract | `npx playwright test --project=preview e2e/form-states.e2e.ts && npx playwright test --project=live e2e/form-states.e2e.ts && grep -qi 'held out for…` | ✅ | ⬜ pending |
| 13-01 | 13 | 5 | QUAL-03 | T-05-60 | Every zoom measurement carries the success criterion it actually supports | e2e | `npx playwright test --project=live e2e/zoom-motion.e2e.ts && node -e "const s=require('fs').readFileSync('e2e/zoom-motion.e2e.ts','utf8'); if(!s.in…` | ✅ | ⬜ pending |
| 13-02 | 13 | 5 | QUAL-03 | T-05-61 / T-05-62 | Suppression measured as a computed transform comparison; content and controls re-asserted under reduced motion | e2e | `npm run typecheck && npm run lint && npx playwright test --project=live e2e/zoom-motion.e2e.ts && node -e "const s=require('fs').readFileSync('e2e/…` | ✅ | ⬜ pending |
| 13-03 | 13 | 5 | QUAL-03 | T-05-63 / T-05-64 | The deliberate exclusion is recorded with its reason; both held-out items marked not-a-pass | contract | `grep -q 'criterion' .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-ZOOM-MOTION.md && grep -qi 'held out for human judgement\\|held-out …` | ✅ | ⬜ pending |
| 14-01 | 14 | 5 | QUAL-01, QUAL-02, QUAL-03 | T-05-65 / T-05-68 | The axe fixture is asserted byte-unchanged; no finding is closed by configuration | e2e | `npm test && npx vitest run src/test/focus-contrast.test.ts && git diff --quiet HEAD -- e2e/fixtures/axe.ts && grep -qiE 'FIXED\|DEFERRED\|ACCEPTED'…` | ✅ | ⬜ pending |
| 14-02 | 14 | 5 | QUAL-01, QUAL-02, QUAL-03 | T-05-66 | An accepted risk carries the owner verbatim, never the executor | manual | — (blocking-human checkpoint; see § Manual-Only Verifications) | n/a | ⬜ pending |
| 14-03 | 14 | 5 | QUAL-01, QUAL-02, QUAL-03 | T-05-65 / T-05-67 / T-05-69 | The gate consumes the baseline configuration unchanged; acceptances are named exceptions with a vacuity guard | e2e | `npx playwright test --project=live e2e/axe-gate.e2e.ts && npx playwright test --project=preview e2e/axe-gate.e2e.ts && git diff --quiet HEAD~1 -- e…` | ✅ | ⬜ pending |
| 15-01 | 15 | 5 | QUAL-05 | T-05-74 | The retired gate is withdrawn with a named successor, never deleted | manual | — (blocking-human checkpoint; see § Manual-Only Verifications) | n/a | ⬜ pending |
| 15-02 | 15 | 5 | QUAL-05 | T-05-74 / T-05-75 | The rejection list and marker sets are preserved; both allowlist copies compared byte-identical | contract | `cmp shared-scaffold.txt ../ZERO-PAPERHUB/shared-scaffold.txt && npm run verify:disjoint && (cd ../ZERO-PAPERHUB && npm run verify:disjoint) && npm …` | ✅ | ⬜ pending |
| 15-03 | 15 | 5 | QUAL-05 | T-05-70 / T-05-71 / T-05-72 / T-05-73 | Anonymous shallow sibling clone outside the workspace; no continue-on-error permitted | integration | `npm run lint && npm test && test -f .github/workflows/verify-split.yml && node -e "const y=require('fs').readFileSync('.github/workflows/verify-spl…` | ✅ | ⬜ pending |
| 16-01 | 16 | 6 | LEAD-07 | T-05-76 / T-05-79 | The marker is committed before the send; exactly one message, counted | e2e | `grep -qE 'HAOO-RELEASE-VERIFICATION-[0-9]{8}T[0-9]{6}Z-[0-9a-f]{8}' .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-MAIL.md && grep -q '…` | ✅ | ⬜ pending |
| 16-02 | 16 | 6 | LEAD-07 | T-05-77 / T-05-78 | Delivery closed only by the owner verbatim; spam recorded as spam; no message bodies | manual | — (blocking-human checkpoint; see § Manual-Only Verifications) | n/a | ⬜ pending |
| 16-03 | 16 | 6 | LEAD-07 | T-05-80 / T-05-81 | Every marker sent is listed; the analytics inclusion is named | contract | `grep -qE 'Link 1.*(CONFIRMED\|OPEN\|FAILED)' .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE-MAIL.md && grep -qE 'Link 3.*(CONFIRMED\|FA…` | ✅ | ⬜ pending |
| 17-01 | 17 | 7 | QUAL-05 | T-05-82 / T-05-83 | Every exit code measured in this run against a deployment confirmed to contain the fixes | integration | `npm run build && npm run typecheck && npm run lint && npm test && npm run verify:coverage && npm run verify:disjoint && (cd ../ZERO-PAPERHUB && npm…` | ✅ | ⬜ pending |
| 17-02 | 17 | 7 | QUAL-05 | T-05-85 / T-05-87 / T-05-88 | The two unresolvable blockers are dispositioned by the owner, transferred not assumed | manual | — (blocking-human checkpoint; see § Manual-Only Verifications) | n/a | ⬜ pending |
| 17-03 | 17 | 7 | QUAL-05 | T-05-84 / T-05-86 | Every requirement status cites a measurement; a shortfall names its successor | contract | `npm test && (cd ../ZERO-PAPERHUB && npm test) && test -f .planning/phases/05-prove-the-deployed-journey/05-EVIDENCE.md && grep -qi 'standing limits…` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Sampling continuity:** 43 of 50 tasks carry an automated command. The 7 that do not are consecutive
with automated tasks on either side in every case — the longest run without an automated verify is a
single task. No three consecutive tasks lack automated verification.

**No `MISSING` references.** Every `<automated>` command above either runs against infrastructure that
already exists in the repository today, or against infrastructure created earlier in the same wave
chain by plan 05-03 (the harness) and plan 05-05 (the fixture layer). No task points at a test file
that nothing creates.

---

## Wave 0 Requirements

Wave 0 for this phase is **plan 05-03** (the tracer) and **plan 05-05** (the fixture layer). Nothing
in waves 4 onward can run until these exist. `wave_0_complete` flips to `true` when both are executed.

- [ ] `@playwright/test@1.63.0` + `@axe-core/playwright@4.13.0` installed (HAOO only, exact pins) — plan 05-03 task 2, behind the blocking-human legitimacy gate
- [ ] `npx playwright install --with-deps chromium` — one engine; Firefox and WebKit are deferred by D-09 on run-time cost
- [ ] `playwright.config.ts` — two projects (`live` | `preview`), `testMatch: '**/*.e2e.ts'`, `webServer` for the preview target — plan 05-03 task 2
- [ ] `tsconfig.e2e.json` + the third `tsconfig.json` project reference + the third `tsc --noEmit -p` in the `typecheck` script — plan 05-03 task 3
- [ ] `vitest.config.ts` `exclude` extended with `e2e/**` — plan 05-03 task 3
- [ ] `e2e/tracer.e2e.ts` — the end-to-end slice that answers the rule-composition question and asserts ingestion suppression — plan 05-03 task 2
- [ ] `e2e/fixtures/surfaces.ts`, `viewports.ts`, `primary-actions.ts` — the closed lists with per-entry reasons and vacuity guards — plan 05-05 task 1
- [ ] `e2e/fixtures/axe.ts` — the single builder factory — plan 05-05 task 2
- [ ] `e2e/fixtures/evidence.ts` — the measured-value recorder that refuses a pass mark — plan 05-05 task 2
- [ ] `e2e/fixtures/overflow.ts` — the per-element sweep and the two document-width readings — plan 05-05 task 3
- [ ] `.github/workflows/verify-split.yml` — the continuous separation check — plan 05-15 task 3 (not a wave-0 blocker for the specs; listed here because it is new test infrastructure)

---

## Manual-Only Verifications

Seven `gate="blocking-human"` checkpoints and three held-out judgements. None is auto-approvable in
any mode, including auto-advance.

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Package legitimacy for the two new devDependencies | QUAL-05 | The automated seam returned SUS for both (reason: `too-new`, a seam artefact on fast-releasing packages). A legitimacy gate that an agent can clear is not a gate. | Plan 05-03 task 1: confirm publisher, repository link and version on the registry page for each package, then approve or refuse the install. |
| MX records added to the `haoo.online` zone | LEAD-07 | No agent has access to the DNS zone. | Plan 05-02 task 2: add `mx1.privateemail.com` and `mx2.privateemail.com` at the provider; report the priority values used. Verified afterwards by a two-resolver `dig`. |
| FormSubmit activation link confirmed | LEAD-07 | The activation mail is sent to the very mailbox under test; no agent can read it. | Plan 05-06 task 3: find the activation message in inbox **or spam**, click the link, report the received timestamp, the folder, the sender and the post-click page text — verbatim. |
| Tagged production submission delivery | LEAD-07 | Only the mailbox can establish delivery; a browser confirmation establishes acceptance. | Plan 05-16 task 2: search for the `HAOO-RELEASE-VERIFICATION-` marker in inbox **and** spam; report the marker, received timestamp, folder, sender and subject verbatim. **A spam arrival is a pass, recorded as spam, never normalised.** |
| Disposition of escalated accessibility findings | QUAL-01, QUAL-02, QUAL-03 | Each is blocking under the owner's own impact threshold and sits on a screen the phase boundary forbids redesigning. An executor writing "accepted" without the owner's words is the failure the gate exists to prevent. | Plan 05-14 task 2: per numbered finding, choose `fix-now`, `accept-recorded` or `defer-phase`; supply the verbatim sentence for any acceptance. |
| Successor shape for the expected-red Phase 1 gate | QUAL-05 | Owed since Phase 04.2. The direction of the assertion is a product decision, not a mechanical one. | Plan 05-15 task 1: choose `invert-rename`, `invert-keep-name` or `retire`; name the script if renaming. |
| Disposition of the two unresolvable standing blockers | QUAL-05 | The data-protection sign-off needs someone with legal standing; the certificate is held and rotated by the hosting platform. Neither is resolvable by this phase's work. | Plan 05-17 task 2: per blocker, choose `resolved`, `accepted` or `blocks-launch`; supply the verbatim sentence for any acceptance. |
| Long option labels in the qualification selects at 360 px | QUAL-02 | A native select clips rather than reflows and the per-element sweep cannot see inside an open popup. | Plan 05-12 task 3 captures control widths and the longest label per list as measured inputs; a human judges readability. **Backstop — not a pass.** |
| Paragraph copy at a halved desktop viewport | QUAL-03 | Line-length readability is a visual judgement no assertion settles cleanly. | Plan 05-13 task 3 captures column widths and characters-per-line; a human judges. **Backstop — not a pass.** |
| The brochure HTML equivalent at 360 px and at 200% | QUAL-03 | The densest text block on the page; mechanically covered for escape and truncation, not for remaining readable and complete once the grid collapses. | Plan 05-13 task 3 captures cards-per-row and column widths; a human judges. **Backstop — not a pass.** |

**Recorded observations that are neither pass nor failure** (they must appear in the evidence and must
not be collapsed into a verdict): the embedded document viewer's focus behaviour (plan 05-09); the
Products page's absent main landmark and skip link (plans 05-09, 05-10); a third-party host being
unavailable at probe time (plan 05-11); the deliberate colour-transition exclusion (plan 05-13).

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are enumerated blocking-human checkpoints — 43 automated, 7 checkpoints, 0 unaccounted
- [x] Sampling continuity: no 3 consecutive tasks without automated verify — longest gap is 1 task
- [x] Wave 0 covers all MISSING references — no task references infrastructure nothing creates
- [x] No watch-mode flags — every command above is a single-shot run
- [x] Feedback latency < 35 s for the unit gate, < 4 min for the hermetic e2e gate
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-07 (planner), pending owner confirmation at the Phase 5 verification gate.
