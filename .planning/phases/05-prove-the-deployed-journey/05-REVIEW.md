---
phase: 05-prove-the-deployed-journey
reviewed: 2026-09-13T08:59:34Z
depth: standard
files_reviewed: 36
files_reviewed_list:
  - e2e/axe-baseline.e2e.ts
  - e2e/axe-gate.e2e.ts
  - e2e/fixtures/axe.ts
  - e2e/fixtures/brochure-equivalence.ts
  - e2e/fixtures/evidence.ts
  - e2e/fixtures/overflow.ts
  - e2e/fixtures/primary-actions.ts
  - e2e/fixtures/surfaces.ts
  - e2e/fixtures/targets.ts
  - e2e/fixtures/viewports.ts
  - e2e/form-states.e2e.ts
  - e2e/keyboard.e2e.ts
  - e2e/live-submission.e2e.ts
  - e2e/recovery.e2e.ts
  - e2e/semantics.e2e.ts
  - e2e/tracer.e2e.ts
  - e2e/viewport.e2e.ts
  - e2e/zoom-motion.e2e.ts
  - .github/workflows/verify-split.yml
  - .gitignore
  - package.json
  - playwright.config.ts
  - scripts/assert-phase1-contracts.mjs
  - shared-scaffold.txt
  - src/components/ProductHeader.tsx
  - src/components/qualify-form.logic.ts
  - src/components/QualifyForm.tsx
  - src/index.css
  - src/pages/ProductPage.tsx
  - src/test/focus-contrast.test.ts
  - src/test/haoo-page.test.tsx
  - src/test/measurement-page.test.tsx
  - src/test/qualify-form.test.tsx
  - tsconfig.e2e.json
  - tsconfig.json
  - vitest.config.ts
findings:
  critical: 2
  warning: 6
  info: 7
  total: 15
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-09-13T08:59:34Z
**Depth:** standard
**Files Reviewed:** 36
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

The product-code changes hold up. The L2-O1 reversal in `QualifyForm.tsx` / `qualify-form.logic.ts` does what its comments claim: the body is read inside the timeout budget, a non-OK status short-circuits, and an unreadable or unexpected body ends in `failed`. `isProviderAcceptance` is strict and well tested. The `ProductHeader`/`ProductPage` link fixes, the reduced-motion changes and the `index.css` media-query guard are correct. The axe factory's single `options()` composition, the R-1 exception and the `live-submission` retry and repeat guards also match their comments.

The defects are in the evidence harness, which this phase treats as its product:

1. **`e2e/semantics.e2e.ts` has no project guard.** The hermetic `preview` gate therefore drives live production, including the live lead form without the provider-abort guard. It also writes S1-labelled evidence that did not come from the live project. This has already happened: `evidence/semantics-headings.json` holds S1 records stamped 08:25 and 08:26 on 2026-09-13, the same minutes as the preview-project `axe-gate` run.
2. **The evidence writers can lose committed data.** They read, modify and rewrite the whole file with no lock and no atomic write. A failed read is silently treated as an empty file, which the next write then overwrites.

Smaller problems:
- Live retries mix records from failed attempts in with passing ones.
- The live run hard-fails when `dist` has not been built.
- The live-submission arming flag treats `"false"` as armed.
- The pass-mark refusal is shallow.
- The analytics block misses PostHog's sibling hosts.
- One reachability record hardcodes its verdict.

## Critical Issues

### CR-01: `semantics.e2e.ts` runs against live production from the hermetic `preview` project, and writes S1 evidence from it

**File:** `e2e/semantics.e2e.ts:326-329` (and every test at 358, 433, 462, 506, 565, 613, 933, 1034, 1072, 1149, 1191, 1244)

**Issue:** Every other spec confines itself with `requireLive`, `requireProject` or `requirePreview`. No test in this file takes `testInfo` or skips by project. `openHaoo` calls `page.goto(HAOO.url)`, the absolute URL `https://www.haoo.online/`, and the Products test goes to `https://www.zero-paperhub.com/#products`. The effects:

- **The CI gate needs the network.** `npm run test:e2e` (`--project=preview`, `retries: 0`) is described in `surfaces.ts` S5 and `playwright.config.ts` as the hermetic gate, yet it runs 12 tests against two production sites. A production outage or a Cloudflare challenge turns the preview gate red. It is the hermetic flake the config comment says must never be retried away.
- **The live form is driven with no provider guard.** `submitEmptyRequired` (342-349) clicks "Send my details" on production from both projects without routing `formsubmit.co` to abort. Every other spec that touches the live form (`axe-gate`, `axe-baseline`, `form-states`, `keyboard`) adds that route as "belt-and-braces against that reasoning being wrong". Here, a validation regression would send a real lead from the preview gate.
- **Evidence provenance is falsified.** Every record is written with `surface: HAOO.id` (S1, which `surfaces.ts` defines as the live project) and carries no `project` field. Preview-project runs therefore produce records indistinguishable from live ones. This is already in the committed evidence: `evidence/semantics-headings.json` and `evidence/semantics-landmarks.json` hold S1 records at 08:25–08:26, beside the preview-project `axe-gate` records from the same minutes.

**Fix:**
```ts
function requireLive(testInfo: TestInfo): void {
  test.skip(testInfo.project.name !== 'live',
    'the semantics contract measures the deployed journeys and has no referent in the preview build');
  test.setTimeout(LIVE_TIMEOUT_MS);
}

test('the error-summary state holds its level', async ({ page }, testInfo) => {
  requireLive(testInfo);
  await page.route(/formsubmit\.co/, (route) => route.abort('blockedbyclient'));
  // ...
});
```
Apply `requireLive(testInfo)` to all 12 tests. Add `project: testInfo.project.name` to every `detail`. Then remove, or annotate, the preview-origin records already committed under `evidence/semantics-*.json`.

### CR-02: Evidence writers use an unlocked read-modify-write, and a failed read silently clobbers the committed record file

**File:** `e2e/fixtures/evidence.ts:115-121, 150-152`; `e2e/axe-baseline.e2e.ts:333-340, 366-377`

**Issue:** `recordEvidence` reads the whole JSON array, appends to it and rewrites the file with `writeFileSync`. Nothing guards concurrency, and the write is not atomic: `writeFileSync` truncates the file before writing. `upsertEntry` in `axe-baseline` does the same, and its own comment says "the live and preview projects are two separate processes writing one file". Three failure modes follow:

1. **Two projects writing at once.** `playwright.config.ts` names no default project. A plain `npx playwright test` runs `live` and `preview` in parallel workers, and they write the same files: `axe-gate.json`, `axe-baseline.json`, `form-states*.json`, `motion-suppression.json` and `motion-closed-negative.json`. The outcome is either a lost update (both read N records and both write N+1) or a reader that catches the file mid-truncation. `JSON.parse('')` then throws outside the `try`, and the test fails for a harness reason.
2. **A failed read overwrites everything.** `readEvidence` wraps only `readFileSync`, but its `catch {}` swallows every error (`EACCES`, `EISDIR`, `EMFILE`), not just `ENOENT`. It returns `[]`, and `recordEvidence` then writes a one-record file over every earlier measurement. That is exactly the "silently rewriting a measurement somebody else made" the function's own error message claims to refuse.
3. **A crash mid-write leaves a truncated file.** A worker killed during `writeFileSync` (timeout, Ctrl-C) leaves a truncated committed file. The next run then throws on `JSON.parse`, or, through case 2, overwrites it.

Because `evidence/` is committed and described as "this phase's product", this is a data-loss risk.

**Fix:**
```ts
import { renameSync, writeFileSync, readFileSync, openSync, closeSync } from 'node:fs';

export function readEvidence(name: string): readonly EvidenceRecord[] {
  let raw: string;
  try {
    raw = readFileSync(evidencePath(name), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error; // never treat an unreadable file as an empty one
  }
  // ...
}

function writeAtomically(path: string, body: string): void {
  const temp = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temp, body, 'utf8');
  renameSync(temp, path); // atomic on POSIX
}
```
Also serialise writers. Either take a lock file around read-modify-write (`openSync(lock, 'wx')` with retry), or write one file per record (`evidence/<name>/<recordedAt>-<pid>.json`) and aggregate on read. Apply the same change to `upsertEntry`.

## Warnings

### WR-01: Live `retries: 2` combined with record-before-assert mixes failed attempts into evidence with no attempt marker, and lets a flaky blocking axe finding pass the gate

**File:** `playwright.config.ts:46`; `e2e/fixtures/evidence.ts:139-148`; `e2e/axe-gate.e2e.ts:216-269`

**Issue:** Most specs deliberately record before asserting, so a red run keeps its reading. The live project retries twice, though, and `EvidenceRecord` carries neither `testInfo.retry` nor a run id. A failed attempt and its passing retry are therefore written as two equally valid records, and nothing in the committed file says which attempt failed. The retry also weakens the gate itself. `axe-gate` S3 scans after a fixed `waitForTimeout(1500)` on an opacity reveal. A serious `color-contrast` finding caught mid-transition on attempt 1 and missing on attempt 2 makes Playwright report the test as "flaky" and exit 0. The accessibility gate passes on a blocking finding it actually observed.

**Fix:** Add `attempt: testInfo.retry` and `project: testInfo.project.name` to `EvidenceInput` as required fields, populated by every caller. Pin `test.describe.configure({ retries: 0 })` in `axe-gate.e2e.ts`, or run the live gate with `--fail-on-flaky-tests`, so a blocking finding seen once cannot be retried away.

### WR-02: `webServer` hard-fails every live run when `dist/` is absent, and the preview gate silently measures a stale build

**File:** `playwright.config.ts:65-70`; `package.json:13-14`

**Issue:** The comment says a `--project=live` run "pays [the preview server's] startup cost". In fact Vite 5's `preview` throws `The directory "dist" does not exist. Did you build your project?` (confirmed in `node_modules/vite/dist/node/chunks/dep-CDnG8rE7.js:65910`). On a fresh clone (`dist` is gitignored), `npm run test:e2e:live` therefore fails before any live test runs, even though no live test uses the server. `test:e2e` has the opposite problem. Unlike `npm test`, it does not build first, so it serves whatever `dist/` was left from an earlier build. The "hermetic CI gate" can pass against code that no longer matches `src/`.

**Fix:** Make the server conditional on the invocation, or build it in:
```ts
webServer: {
  command: 'npm run build && npm run preview -- --port 4173 --strictPort',
  url: 'http://localhost:4173',
  reuseExistingServer: !process.env.CI,
  timeout: 180_000,
},
```
Or set `"test:e2e": "npm run build && playwright test --project=preview"`, and omit `webServer` when `process.argv` contains `--project=live`.

### WR-03: The live-submission arming flag treats `"0"` or `"false"` as armed, and nothing stops a second send with an already-used marker

**File:** `e2e/live-submission.e2e.ts:129, 143-154, 255`

**Issue:** This file is the safety mechanism around the only spec that sends real mail, so three gaps matter:
1. **Truthiness.** `ARMED` is `trim() !== ''`, so `HAOO_SEND_LIVE_SUBMISSION=0` or `=false`, the usual way to disarm a flag, arms the spec. Guard 1 (the purpose variable) narrows the risk, but a shell that still exports a purpose from an earlier send would go ahead and send.
2. **No idempotence for a supplied marker.** Guard 4 stops runner-level retries and repeats, but not a manual re-run. 05-16 commits its marker before sending, so re-running the command after a post-send assertion failure (focus, status text or ingestion) sends a second real message carrying the same "unique" marker. `evidence/live-submission.json` already holds an `after the single activation` record for that marker, and the spec never checks for it.
3. **A mislabelled field.** `markerGeneratedAt` is stamped at run time even when the marker was supplied and generated earlier, so the mail-evidence record misstates when the marker was made.

**Fix:**
```ts
const ARMED = (process.env[ARM_FLAG] ?? '').trim() === 'SEND-REAL-MAIL';

// before the send, in the test body:
const alreadySent = readEvidence(EVIDENCE_NAME).some((record) => {
  const m = record.measured as { phase?: string; marker?: string };
  return m.marker === marker && m.phase === 'after the single activation of the submit control';
});
if (alreadySent) throw new Error(`refusing to send: marker ${marker} already has a recorded send`);

const markerGeneratedAt = supplied ? '<supplied; generated before the run>' : new Date().toISOString();
```

### WR-04: `assertMeasured` checks only top-level values, though its contract says every value is checked

**File:** `e2e/fixtures/evidence.ts:74-112` (loop at 97)

**Issue:** The `EvidenceInput.measured` doc says "Every value in it is checked", and the orchestrator describes the recorder as one that "deliberately rejects verdict words". The implementation checks a scalar and the direct values of a top-level object, nothing more. It accepts:
- `measured: ['pass']`, because arrays are skipped entirely
- `measured: { verdict: { result: 'passed' } }`, because nested objects are not walked
- `measured: { rows: [{ outcome: 'ok' }] }`

Several callers already record nested structures (`focus.rows`, `readings`, `disclosure`), so a verdict string can reach committed evidence without the refusal firing.

**Fix:** Walk the value recursively.
```ts
function findPassMark(value: unknown, path: string): string | null {
  if (isPassMark(value)) return path;
  if (Array.isArray(value)) {
    for (const [i, v] of value.entries()) { const hit = findPassMark(v, `${path}[${i}]`); if (hit) return hit; }
  } else if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) { const hit = findPassMark(v, `${path}.${k}`); if (hit) return hit; }
  }
  return null;
}
```

### WR-05: The "analytics blocked" test does not block PostHog's sibling hosts, though its comment says it does

**File:** `e2e/recovery.e2e.ts:1151, 1176-1182`

**Issue:** The comment says the block is "by HOSTNAME SUFFIX … the provider serves ingestion, assets and remote configuration from sibling subdomains, and an exact-URL route would let the ones it did not name through". But `ANALYTICS_ORIGINS` is `['us.i.posthog.com']` (from `config/approved-analytics-hosts.ts`), and `url.hostname.endsWith('us.i.posthog.com')` does not match a sibling host such as `us-assets.i.posthog.com`, which is where PostHog serves `array/*/config.js` and its assets. Those requests are not blocked, so "the journey with the analytics origin blocked" measures a partially blocked provider. It can report `analyticsRequestsBlocked: 0` while remote configuration loads normally.

**Fix:** Match the provider's registrable domain and record what was matched:
```ts
const ANALYTICS_BLOCK_SUFFIXES = APPROVED_ANALYTICS_HOSTS.map((host) =>
  new URL(host.origin).hostname.split('.').slice(-2).join('.'), // 'posthog.com'
);
await page.route((url) => ANALYTICS_BLOCK_SUFFIXES.some((s) => url.hostname === s || url.hostname.endsWith(`.${s}`)), ...);
```
Alternatively, log every request whose host contains `posthog` and assert that each one was aborted.

### WR-06: The brochure reachability record hardcodes `disposition: 'reachable'` before the status is known

**File:** `e2e/recovery.e2e.ts:1074-1098` (line 1079)

**Issue:** The self-onboarding probe computes its disposition from the reading. The brochure probe writes the literal `'reachable'` and asserts `status === 200` only afterwards. When the brochure returns 404, or the transport fails (`status: -1`), the committed evidence still says `disposition: 'reachable'`. That is a verdict recorded in advance of, and contrary to, the measurement. The discipline the recorder exists for is defeated here by a string it cannot detect.

**Fix:**
```ts
disposition: reading.status === 200 ? 'reachable' : `unavailable (status ${reading.status})`,
```

## Info

### IN-01: A `QualifyForm` comment contradicts the code

**File:** `src/components/QualifyForm.tsx:488-490`
**Issue:** The comment says "`state` never returns to `idle` once a submission has been attempted", but `submitValues` sets `setState('idle')` on every invalid submit (line 311). The precedence logic is still correct. The stated invariant is not.
**Fix:** Reword it to say that a terminal `failed`/`blocked` state persists while the form stays editable, and that an invalid submit resets to `idle`.

### IN-02: A tautological assertion in `axe-baseline`

**File:** `e2e/axe-baseline.e2e.ts:594`
**Issue:** `expect(entry.violations.length).toBeGreaterThanOrEqual(0)` can never fail. It looks like a findings assertion but checks nothing.
**Fix:** Delete it. The baseline by design asserts nothing about findings.

### IN-03: The tracer and form-states specs record evidence after asserting

**File:** `e2e/tracer.e2e.ts:171-194`; `e2e/form-states.e2e.ts:702-704` (and the other state tests)
**Issue:** `keyboard`, `semantics`, `viewport`, `zoom-motion`, `axe-*` and `live-submission` all record before asserting so a red run keeps its reading. `tracer` and `form-states` assert first, so exactly the failing readings are lost.
**Fix:** Move each `recordEvidence` call ahead of its assertions.

### IN-04: Duplicated harness helpers between `axe-gate` and `axe-baseline`

**File:** `e2e/axe-gate.e2e.ts:124-130, 284-290, 463-506, 565-576`; `e2e/axe-baseline.e2e.ts` (the equivalent helpers)
**Issue:** `targetToString`, `requireProject`, `fillQualifyForm`, `submitQualifyForm`, the `JSON.stringify` patch and the S4 refresh-strip route are copied verbatim, and `form-states` has a third variant of the patch. The gate's promise that it "cannot be configured greener than the run that found the problems" applies to the axe options but not to how states are reached. The copies can drift, and in `form-states` they already differ (`hasOwnProperty` against `in`).
**Fix:** Move them into `e2e/fixtures/form-driving.ts` and `e2e/fixtures/retired-path.ts`.

### IN-05: The workflow pins actions by major tag, not by commit SHA

**File:** `.github/workflows/verify-split.yml:30, 33`
**Issue:** `actions/checkout@v6` and `actions/setup-node@v6` are mutable tags. The permissions are read-only, but a compromised tag would still run inside the job.
**Fix:** Pin each action to a full commit SHA, with the version in a comment.

### IN-06: The Phase 1 contract gate misreports a buffer overflow as "could not start Vitest"

**File:** `scripts/assert-phase1-contracts.mjs:114-124, 83-85`
**Issue:** `spawnSync` defaults to `maxBuffer` 1 MiB. `npm test` runs a full `vite build` and verbose Vitest output across `build-output.test.ts` (which runs its own build probes). If the output ever passes 1 MiB, the child is killed and `result.error` is `ENOBUFS`. The gate would then print "could not start Vitest", which is a false diagnosis, though it fails closed.
**Fix:** Pass `maxBuffer: 64 * 1024 * 1024` and name `ENOBUFS` explicitly in `phase1ContractFailure`.

### IN-07: `measureAction` applies the last opener's reading to every disclosure-reached instance

**File:** `e2e/fixtures/targets.ts:304, 312-317`
**Issue:** `opener` is reassigned for each pending instance, and `reachable` checks `opener.defects` for every `disclosure` instance. With two different togglable navs, a defect on the first opener would be hidden by a clean second one. No shipped surface has two openers today.
**Fix:** Store the opener reading on each `InstanceReading`, and evaluate reachability per instance.

---

_Reviewed: 2026-09-13T08:59:34Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
