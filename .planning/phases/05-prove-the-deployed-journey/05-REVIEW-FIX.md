---
phase: 05-prove-the-deployed-journey
fixed_at: 2026-09-13T13:38:38Z
review_path: .planning/phases/05-prove-the-deployed-journey/05-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 5: Code Review Fix Report

**Fixed at:** 2026-09-13T13:38:38Z
**Source review:** .planning/phases/05-prove-the-deployed-journey/05-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (2 critical, 6 warning; the 7 Info findings were out of scope under `critical_warning`)
- Fixed: 8
- Skipped: 0

**Where verification ran:** in the main checkout at `/home/paul/Documents/Vibe Coding Projects/HAOO`. `workflow.use_worktrees` is `false`, so no worktree was created. Every figure below can be reproduced from the tree at `3420278`.

**Safety record:**
- `HAOO_SEND_LIVE_SUBMISSION` was never set. Every Playwright command ran under `env -u HAOO_SEND_LIVE_SUBMISSION -u HAOO_LIVE_SUBMISSION_PURPOSE -u HAOO_LIVE_SUBMISSION_MARKER`, or in a shell that had never exported it.
- No form submission and no request to formsubmit.co were sent. `evidence/live-submission.json` still holds its 4 records (2 sends) and is byte-unchanged.
- The full live suite was never run.
- Every tracked `evidence/*.json` that a targeted run rewrote was restored with `git checkout --` after its new records had been inspected. No evidence rewrite is part of any commit.
- No file under `src/` was changed.

## Gate results after all fixes (main checkout, HEAD `3420278`)

| Command | Exit | Result |
|---|---|---|
| `npm run typecheck` | 0 | clean (app, node, e2e) |
| `npm run lint` | 0 | clean |
| `npm test` | 0 | 10 files passed, **688 tests passed** |
| `npm run verify:disjoint` | 0 | allowlist subtracted 26, violations 0 (the review's "26/26/0") |
| `npm run test:phase1:contracts` | 0 | 3 suites, 3 of 3 markers green, 0 of 8 infrastructure-failure signatures |

## Fixed Issues

### CR-01: `semantics.e2e.ts` runs against live production from the hermetic `preview` project

**Threat:** cross-referenced to T-05-54 and T-05-12, both of which the auditor ruled still hold. This fix also clears the unregistered "CR-01 surface" flag.
**Files modified:** `e2e/semantics.e2e.ts`
**Commit:** 243c5f4
**Applied fix:**
- **Project guard.** Added `requireLive(testInfo)`, the same pattern as `keyboard.e2e.ts`. It skips unless the project is `SURFACES.S1.playwrightProject` (`live`) and sets the 180 s timeout. It is called first in all 12 tests, each of which now takes `testInfo`.
- **Provider route.** `submitEmptyRequired` routes `/formsubmit\.co/` to `abort('blockedbyclient')` before the click. It is the one helper both error-summary tests use, so any future caller gets the route too.

**Verification:**
- `npx tsc --noEmit -p tsconfig.e2e.json` exit 0, and `npx eslint e2e/semantics.e2e.ts` exit 0.
- `npx playwright test --project=preview e2e/semantics.e2e.ts`: exit 0, **12 skipped**, no evidence file written.
- `npx playwright test --project=live e2e/semantics.e2e.ts`: exit 0, **12 passed**. It rewrote 7 `evidence/semantics-*.json` files, which were restored.

**Not done:**
- **The `project` field on each `detail`.** It was not added, because with the guard in place every record comes from `live`.
- **The committed preview-origin S1 records.** The 08:25–08:26 records in `evidence/semantics-headings.json` and `evidence/semantics-landmarks.json` were **not** removed or annotated, because the instruction was not to rewrite committed evidence. They need an owner decision.

### CR-02: Evidence writers use an unlocked read-modify-write, and a failed read silently clobbers the committed record file

**Threat:** T-05-21 (high, blocking), the writer-safety half. It also contributes to T-05-80.
**Files modified:** `e2e/fixtures/evidence.ts`, `e2e/axe-baseline.e2e.ts`, `.gitignore`
**Commit:** 71c46b2
**Applied fix:**
- **Strict reads.** `readEvidence` and `axe-baseline`'s `readBaseline` return `[]` only when `isMissingFileError(error)` (`ENOENT`) holds. Every other read error is re-thrown.
- **Atomic writes.**
  - The new exported `writeFileAtomically(path, body)` writes a uniquely named sibling `<path>.<pid>.<ms>.<hex>.tmp` with flag `wx`, then calls `renameSync` onto the target. If the write fails, it removes its own temp file.
  - Both `recordEvidence` and `upsertEntry` now write through it.
  - `evidence/*.tmp` is gitignored, in case a killed worker leaves one behind.

**Verification:**
- **Static checks.** `npx tsc --noEmit -p tsconfig.e2e.json` exit 0, and `npx eslint e2e/fixtures/evidence.ts e2e/axe-baseline.e2e.ts` exit 0.
- **Scratch probe** (node type-stripping, throwaway evidence names, cleaned up), exit 0:
  - an absent file reads as `0` records
  - a directory in the file's place gives `readEvidence` → **threw EISDIR** (it previously returned `[]`)
  - two appends read back as `[1,2]`
  - `.tmp` files left: `0`
- **Preview run.** `npx playwright test --project=preview e2e/form-states.e2e.ts e2e/axe-baseline.e2e.ts` exit 0 (13 passed, 8 skipped). Both writers ran end to end, no `.tmp` was left, and the rewritten evidence was restored.

**Residual (not fixed):** writers are still **not serialised**. Two processes writing one file at the same moment can still lose one append. Each write is now whole, so a reader never sees a truncated file, and no read error is treated as an empty file. The `writeFileAtomically` doc-comment says to run one project at a time against a shared evidence file. A lock file or a one-file-per-record layout would close this.

### WR-01: Live `retries: 2` combined with record-before-assert lets a flaky blocking axe finding pass the gate

**Threat:** T-05-31 (low, accept; rationale contradicted).
**Files modified:** `e2e/axe-gate.e2e.ts`
**Commit:** 027ac5e
**Applied fix:** added a file-level `test.describe.configure({ retries: 0 })`, which overrides the `live` project's `retries: 2` for every gate test on both projects. `gateScan` now records `attempt: testInfo.retry` in each `axe-gate` record's `detail`.

**Verification:**
- `npm run typecheck` exit 0, and `npx eslint e2e/axe-gate.e2e.ts` exit 0.
- `npx playwright test --project=preview e2e/axe-gate.e2e.ts e2e/live-submission.e2e.ts` exit 0. The 4 new preview `axe-gate` records carry `attempt: 0`, and the evidence was restored.

**Scope note:** `attempt` was added only to `axe-gate` records, as asked. The review's broader suggestion was a required `attempt`/`project` field on every `EvidenceInput`, and that was not applied.

### WR-02: `webServer` hard-fails every live run when `dist/` is absent, and the preview gate silently measures a stale build

**Threat:** none registered.
**Files modified:** `playwright.config.ts`
**Commit:** 0fa1884
**Applied fix:** the `webServer.command` is now `npm run build && npm run preview -- --port 4173 --strictPort`, and its timeout went from 120 s to 180 s. The comment now explains why the build is there, and notes that `reuseExistingServer` still reuses a server already listening outside CI. `package.json` was not changed.

**Verification:**
- `npm run typecheck` exit 0, and `npx eslint playwright.config.ts` exit 0.
- **Fresh-clone check.** Port 4173 was free, and `dist/` was moved aside to the session scratchpad, so it was absent. `npx playwright test --project=preview e2e/axe-gate.e2e.ts e2e/live-submission.e2e.ts` then exited 0, and `dist/index.html` was rebuilt by the webServer.

### WR-03: The live-submission arming flag treats `"0"` or `"false"` as armed, and nothing stops a second send with an already-used marker

**Threat:** T-05-23 (high, blocking). It also contributes to T-05-80.
**Files modified:** `e2e/live-submission.e2e.ts`
**Commit:** 3f29af0
**Status:** fixed: requires human verification. This is a change to guard logic, and by rule the armed path cannot be exercised.
**Applied fix:**
1. **Arming value.** `ARMED` is now `(process.env.HAOO_SEND_LIVE_SUBMISSION ?? '').trim() === '1'`, via `ARM_VALUE = '1'`. That is the value in both recorded send commands (`05-EVIDENCE-MAIL.md:736` and `:948`). The skip reason, the file header and the `ARM_FLAG` comment say so.
2. **Guard 5.**
   - `recordsForMarker(marker)` reads `readEvidence('live-submission')`.
   - The test refuses to send, by throwing **before any navigation** (so before the click), when **any** record already carries the marker. The check is not limited to the after-send record: the marker-fixed record is written about 3 ms before the click, so a run that died after the click leaves only that record.
   - The error message lists each earlier record's time and phase.
3. **`markerGeneratedAt`.** For a supplied marker it now reads `<supplied through HAOO_LIVE_SUBMISSION_MARKER; generated before the run>`, not the run time.
4. **Existing guards.** Guards 1–4 are unchanged: the purpose variable, live-only, `retries: 0`, and refusal on retry or repeat.

**Verification:**
- `npx tsc --noEmit -p tsconfig.e2e.json` exit 0, and `npx eslint e2e/live-submission.e2e.ts` exit 0.
- **Arming probe.** The scratch probe evaluated the same expression in-process without setting the variable. `undefined`, `''`, `'0'`, `'false'`, `'no'`, `'yes'` and `'true'` all give **not armed**. `'1'` and `' 1 '` give armed.
- **Guard-5 probe**, run against the committed `evidence/live-submission.json`:
  - `HAOO-ENDPOINT-ACTIVATION-20260913T003033Z-571c962a` → **REFUSE (2 records)**
  - `HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d` → **REFUSE (2 records)**
  - an unused marker → would proceed
- **Unarmed runs.** `--project=preview` exit 0 with the spec skipped, and `--project=live e2e/live-submission.e2e.ts` exit 0 with **1 skipped**. `evidence/live-submission.json` is unchanged.

**Human check:** read the `ARMED` line and the guard-5 block in `e2e/live-submission.e2e.ts` and confirm the logic. This is the only way to confirm it without sending mail.

### WR-04: `assertMeasured` checks only top-level values, though its contract says every value is checked

**Threat:** T-05-21 (high, blocking), the recursive-refusal half.
**Files modified:** `e2e/fixtures/evidence.ts`, `e2e/form-states.e2e.ts`, `e2e/viewport.e2e.ts`
**Commit:** 51a82c6
**Status:** fixed: requires human verification. This is a change to validation logic.
**Applied fix:**
- **Recursive check.** `findPassMark(value, path)` walks arrays and nested records. `assertMeasured` refuses the first pass mark at any depth and names its path, for example `measured.rows[0].outcome = 'ok'`. The top-level null and empty-record refusals are unchanged.
- **Attribute readings.** The new exported helper `attributeReading(attribute, value)` records `aria-invalid="true"`, or `aria-invalid absent` for a `null` value, so an attribute reading can no longer be mistaken for a verdict. The producers of the 84 nested `"true"` strings the auditor counted now use it:
  - `form-states.e2e.ts`: `markedControls.*.ariaInvalid`, plus `beforeSelection`, `afterSelection` and `afterReversal.ariaRequired`. The two `aria-required` assertions now compare against `'aria-required="false"'` and `'aria-required="true"'`. The `aria-invalid` assertion still checks the raw attribute value.
  - `viewport.e2e.ts`: `readState().ariaExpanded`. The two expected states now use `'aria-expanded="false"'` and `'aria-expanded="true"'`.
- **Committed records.** No committed record was changed. Historical records keep the bare string, and the doc-comment says so.

**Verification:**
- `npx tsc --noEmit -p tsconfig.e2e.json` exit 0, and `npx eslint e2e/fixtures/evidence.ts e2e/form-states.e2e.ts e2e/viewport.e2e.ts` exit 0.
- **Scratch probe**, exit 0:
  - All five cases are refused with their exact paths: `measured[0] = pass`, `measured.verdict.result = passed`, `measured.rows[0].outcome = ok`, `measured.markedControls.name.ariaInvalid = true` and `measured.a = Yes`.
  - A refused record writes no file.
  - The attribute form, including `false`, `0` and `'false'` inside arrays, is accepted.
- **Preview run.** `npx playwright test --project=preview e2e/form-states.e2e.ts e2e/axe-baseline.e2e.ts` exit 0 (13 passed, 8 skipped). The 7 new `form-states.json` records hold 10 attribute-form readings and 0 bare `"true"`/`"false"`.
- **Live run.** `npx playwright test --project=live e2e/viewport.e2e.ts -g "VC-3"` exit 0 (**6 passed**). The 6 new `viewport-mobile-nav.json` records hold 18 attribute-form readings and 0 bare strings.
- **Restores.** All rewritten evidence was restored.
- **Other producers.** `grep` over `e2e/` found no other literal pass-mark string that can reach a nested `measured` value. The only hits are routed response bodies built with `JSON.stringify({ success: 'true' })`, which are whole strings.

### WR-05: The "analytics blocked" test does not block PostHog's sibling hosts

**Threat:** T-05-52 holds, and the auditor ruled this finding has no bearing on it. This is a precision fix.
**Files modified:** `e2e/recovery.e2e.ts`
**Commit:** 3420278
**Status:** fixed: requires human verification. This is a change to a match condition.
**Applied fix:**
- **Blocked domains.** A new constant, `ANALYTICS_BLOCK_DOMAINS`, holds the registrable domain of each approved origin (the last two labels, so `posthog.com`).
- **Route match.** The route now matches `hostname === domain || hostname.endsWith('.' + domain)`, and `measured.blockedHostnameSuffixes` records those domains. `bundleMentionsIngestionOrigin` still uses the exact ingestion hostname.
- **Known limit.** The comment notes that a public-suffix domain such as `co.uk` would need more than the last two labels.

**Verification:**
- `npm run typecheck` exit 0, and `npx eslint e2e/recovery.e2e.ts` exit 0.
- **Match probe.** `us-assets.i.posthog.com`, `posthog.com` and `eu.i.posthog.com` are now matched, and were not before. `us.i.posthog.com` is still matched. `notposthog.com`, `posthog.com.evil.example`, `www.haoo.online` and `formsubmit.co` are not matched.
- **Live run.** `npx playwright test --project=live e2e/recovery.e2e.ts -g "brochure artifact returns success|analytics ingestion origin blocked"` exit 0 (**2 passed**). The new record reads `blockedHostnameSuffixes: ["posthog.com"]` with `analyticsRequestsBlocked: 0`, and the evidence was restored.

### WR-06: The brochure reachability record hardcodes `disposition: 'reachable'` before the status is known

**Threat:** T-05-51 (medium).
**Files modified:** `e2e/recovery.e2e.ts`
**Commit:** 4305af7
**Status:** fixed: requires human verification. This is a change to a condition.
**Applied fix:** `disposition` is now `reading.status === 200 ? 'reachable' : \`unavailable (status ${reading.status})\``, computed from the reading before the status assertion.

**Verification:**
- `npx tsc --noEmit -p tsconfig.e2e.json` exit 0, and `npx eslint e2e/recovery.e2e.ts` exit 0.
- The same live run as WR-05 exited 0. Its new record reads `disposition: "reachable"` with `status: 200`, and the evidence was restored.

## Threat mapping for the re-audit

| Threat | Severity | Closed by | Commits |
|---|---|---|---|
| T-05-21 | high (blocking) | CR-02 (strict reads, atomic writes in both writers) and WR-04 (recursive refusal, aria producers moved to the attribute form) | 71c46b2, 51a82c6 |
| T-05-23 | high (blocking) | WR-03 (arms only on `1`; guard 5 refuses a marker that already has a record, before navigation; guards 1–4 kept) | 3f29af0 |
| T-05-80 | medium | WR-03 and CR-02 together | 3f29af0, 71c46b2 |
| T-05-51 | medium | WR-06 | 4305af7 |
| T-05-31 | low (accept) | WR-01 (`retries: 0` in the gate; `attempt` on its records) | 027ac5e |

## Open items for the owner or orchestrator

1. **CR-01 records.** The preview-origin S1 records already committed in `evidence/semantics-headings.json` and `evidence/semantics-landmarks.json` (08:25–08:26 on 2026-09-13) are unchanged. Whether to annotate or remove them is an owner decision.
2. **CR-02 serialisation.** Evidence writers are atomic but not serialised. Concurrent `live` and `preview` writers to one file can still lose an append.
3. **Human logic checks.** WR-03, WR-04, WR-05 and WR-06 are marked `requires human verification` because they change conditions. WR-03's armed path cannot be exercised under the safety rules.

---

_Fixed: 2026-09-13T13:38:38Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
