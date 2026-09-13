# Phase 5 Evidence: The Expected-Red Gate and Continuous Separation

**Plan:** 05-15
**Requirement:** QUAL-05
**Decisions executed:** phase 5 D-16 (the expected-red gate) and D-17 (separation in CI)
**Measured:** 2026-09-12, in the HAOO checkout and in `../ZERO-PAPERHUB`
**Code commits:** HAOO `a54d54b`, ZERO-PAPER HUB `3525f6d` (Task 2). The HAOO workflow and this record are in the Task 3 commit.
**Pushed:** neither repository. The orchestrator pushes both together after this plan lands.

---

## 1. The owner's decision (Task 1, blocking human, D-16)

The orchestrator put the plan's three options to the owner verbatim, with the plan's pros and cons:

| Option id | Name | The plan's pros | The plan's cons |
|---|---|---|---|
| `invert-rename` | Invert it and rename it: assert the suites pass | Keeps every piece of machinery: the rejection list still separates a real failure from a broken harness, and the marker check still proves the right suites ran. It becomes a real gate again. Recommended. | The path is on the shared allowlist, so the rename means editing that allowlist byte-identically in both repositories in the same change. |
| `invert-keep-name` | Invert it but keep the file path and script name | Fewest moving parts. No allowlist edit. | The name says "red" while the script asserts green. A name that lies is what the project's naming discipline exists to prevent. |
| `retire` | Retire it, with the successor named in the record | Removes a check whose original purpose has expired. | Loses the infrastructure-failure rejection list and the marker check. The ordinary unit command does not tell a broken contract from a broken harness. |

**Chosen:** `invert-rename`.

**Successor name:** `scripts/assert-phase1-contracts.mjs`, npm script `test:phase1:contracts`. The owner
selected it and the orchestrator proposed it, inside the option the owner chose. It is not the owner's
own wording, and the executor did not choose it. (05-RESEARCH.md had suggested `test:phase1:green`,
and that name was not adopted.)

Task 1 made no code change of its own.

---

## 2. The disposal: withdrawn with a named successor, not deleted

**Withdrawn:** `scripts/assert-phase1-red.mjs`, run as `npm run test:phase1:red`, in both repositories.
**By:** plan `05-15`.
**Successor:** `scripts/assert-phase1-contracts.mjs`, run as `npm run test:phase1:contracts`, in both repositories.

The same four facts are written into the header of each successor file, in the idiom the old header
already used for the pair it dropped during the split.

### Exit codes, measured as integers

| Repository | Command | Before | After |
|---|---|---|---|
| HAOO | `npm run test:phase1:red` → `npm run test:phase1:contracts` | exit 1 | exit 0 |
| ZERO-PAPER HUB | `npm run test:phase1:red` → `npm run test:phase1:contracts` | exit 1 | exit 0 |

The before runs failed on the line the old gate was built to print when its subject passed, verbatim
and identical on both sides:

```
Expected-red gate failed: the Phase 1 contract suites unexpectedly passed.
```

The after runs printed these success lines, verbatim:

```
HAOO:            Phase 1 contracts confirmed green: 3 suites, 3 of 3 markers on green cases, 0 of 8 infrastructure-failure signatures present.
ZERO-PAPER HUB:  Phase 1 contracts confirmed green: 1 suite, 1 of 1 markers on green cases, 0 of 8 infrastructure-failure signatures present.
```

`test:phase1:red` is gone from both manifests. The plan's parity check found the same `phase1` key
on both sides: `test:phase1:contracts | test:phase1:contracts`.

### What was inverted, and only this

The exit status the Vitest run must have. It had to be non-zero, and now it must be zero.

### Byte-unchanged, measured by `diff` against each repository's pre-change file (both exit 0)

**Marker sets, each repository keeping its own:**

- HAOO (3): `['[phase1-red:page]', '[phase1-red:content]', '[phase1-red:build]']`
- ZERO-PAPER HUB (1): `['[phase1-red:products]']`

**Suites:**

- HAOO (3): `['src/test/haoo-page.test.tsx', 'src/test/haoo-content.test.ts', 'src/test/build-output.test.ts']`
- ZERO-PAPER HUB (1): `['src/test/products-section.test.tsx']`

**The infrastructure-failure rejection list,** 8 signatures, byte-unchanged in both copies:

`['Failed to resolve import', 'Cannot find module', 'React is not defined', 'SyntaxError', 'Unhandled Error', 'No test files found', 'failed to load config', 'Transform failed']`

The markers keep their `phase1-red:` spelling. That spelling lives in the test names, and renaming a
test would change the suites this gate polices, not the gate.

### Changed so the guarantees keep their strength

- **The marker must appear on a green line.** A marker now counts only on a line the verbose
  reporter starts with `✓`. Under RED, a marker anywhere in the output meant its case had run and
  failed. Under GREEN, presence alone also accepts a skipped case. A HAOO run filtered with
  `-t "zz-no-such-case-zz"` skipped every case, printed each marker on a `↓` line (`Tests  6 skipped (6)`),
  and exited 0.
- **The rejection list is checked before the exit status**, so a broken harness is reported as a
  broken harness and not as a failed contract.
- **The script uses the current idiom.** `process.exit(` appears 0 times and `process.exitCode = 1`
  once in each copy. The file has an import guard, and its success line prints counts, not the word
  "passed".

### Mutation probes of the decision function (`phase1ContractFailure`), fed recorded runs

| Probe | Expected | Result |
|---|---|---|
| HAOO real green run, status 0 | accept | null |
| ZERO-PAPER HUB real green run, status 0 | accept | null |
| HAOO real all-skipped run, status 0 | reject | `did not observe the named behavior contract [phase1-red:page] run green` |
| Green output, status 1 | reject | `the contract suites exited 1` |
| Killed by signal | reject | `exited on signal SIGTERM` |
| Green output plus `No test files found` | reject as infrastructure | `rejected an infrastructure failure: No test files found` |
| Status 1 with `Failed to resolve import` | reject as infrastructure | `rejected an infrastructure failure: Failed to resolve import` |
| Spawn error | reject | `could not start Vitest: spawn npm ENOENT` |
| The build marker only on a failing `×` line | reject | `[phase1-red:build] run green` |
| The HAOO run fed to the ZERO-PAPER HUB copy | reject | `[phase1-red:products] run green` |

10 probes, 0 unexpected.

### Gate baseline, before and after

| Gate | HAOO before | HAOO after | ZERO-PAPER HUB before | ZERO-PAPER HUB after |
|---|---|---|---|---|
| `npm run typecheck` | exit 0 | exit 0 | exit 0 | exit 0 |
| `npm run lint` | exit 0 | exit 0 | exit 0 | exit 0 |
| `npm test` | exit 0, 684 tests / 10 files | exit 0, 684 tests / 10 files | exit 0, 32 tests / 3 files | exit 0, 32 tests / 3 files |
| `npm run verify:disjoint` | exit 0 | exit 0 | exit 0 | exit 0 |
| Phase 1 gate | exit 1 | exit 0 | exit 1 | exit 0 |

HAOO's before values are the baseline the orchestrator recorded for this plan. `verify:disjoint` was
also measured in HAOO before any change.

---

## 3. The shared allowlist

`cmp shared-scaffold.txt ../ZERO-PAPERHUB/shared-scaffold.txt`: **exit 0, byte-identical**, measured
after both Task 2 commits and again after the workflow was staged.

The entry `scripts/assert-phase1-red.mjs` was renamed to `scripts/assert-phase1-contracts.mjs` in
both copies by one identical replacement, with a comment recording the rename. The allowlist still
holds 26 entries, both before and after. This was an edit to an existing ratified entry, not an
admission. `.github/workflows/verify-split.yml` exists in HAOO only and is not on the list. It is not
a shared path, and nothing was added.

The 04.2 split contract names itself as the allowlist's source of truth, so its two references to the
path were updated in the same HAOO commit.

---

## 4. The continuous separation check (D-17)

**Workflow:** `.github/workflows/verify-split.yml` (HAOO repository). This is its own workflow, not a
job in `deploy.yml`.
**Triggers:** `push` to `main`, `pull_request` against `main`, `workflow_dispatch`.
**Permissions:** `contents: read`.
**House values, matched to `deploy.yml`:** `actions/checkout@v6`, `actions/setup-node@v6`,
`node-version: 22`, `cache: npm`.
**Steps:** Checkout → Set up Node → clone the sibling repository beside the workspace → `npm ci` →
`npm run verify:disjoint` (byte-unchanged) → `cmp` the two allowlists.
**The file contains no continue-on-error directive.** The plan's assertion against the file passes.

### How the job gets the sibling repository

- **Mechanism:** `git clone --depth 1 --branch main https://github.com/KaruguDev/ZERO-PAPERHUB.git "$GITHUB_WORKSPACE/../ZERO-PAPERHUB"`.
  `actions/checkout` is not used. The auditor resolves `../ZERO-PAPERHUB` against its own repository
  root, which puts the sibling beside the workspace, and `actions/checkout` will not write outside it.
- **Ref:** the tip of the sibling's `main` when the clone step runs, not a pinned SHA. The step prints
  `Auditing HAOO <sha> against ZERO-PAPER HUB <sha>`, so every run names the pair of commits it compared.
- **Token:** none. Both repositories are public. Measured locally with the credential helper disabled
  and terminal prompts off (`GIT_TERMINAL_PROMPT=0 git -c credential.helper= ...`):
  `ls-remote --symref` returned `ref: refs/heads/main HEAD` at `c5b76cd`, and the shallow clone exited 0.
- **If the clone fails, the job fails.** No step is allowed to carry on past an error.

### What the job does when the two origins disagree (measured)

This was measured, not assumed. HAOO's auditor, run against that anonymous clone of the ZERO-PAPER HUB
origin (which still carries `scripts/assert-phase1-red.mjs` and the old allowlist entry), gave:

```
Tree disjointness audit passed.
  ZERO-PAPER HUB tracked: 287 (38 after excluding .planning/)
  HAOO tracked:           378 (108 after excluding .planning/)
  paths compared:         146
  shared paths:           25
  allowlist entries:      26
  allowlist subtracted:   25
  violations:             0
  ratified collisions:    3 (converged: 0)
  ZPH product source shipping HAOO source: 0
  ZPH named carriers present: 2 of 2
  HAOO files naming a home-page symbol: 0
```

**The auditor exited 0 while `cmp` on the two allowlists exited 1** (`differ: byte 5353, line 100`).
The auditor does not compare the two copies of the list, and it does not fail on an entry that is no
longer shared. Pushing HAOO without ZERO-PAPER HUB would have passed the enumerated command silently.
The workflow therefore runs `cmp` on the two allowlists after that command, and the job fails when the
origins disagree.

**Push order this implies:** ZERO-PAPER HUB **first**, then HAOO. The workflow runs on HAOO events and
clones the sibling as it stands at the clone step. The reverse order races that clone and would go red
for a real but transient reason. (ZERO-PAPER HUB `main` is currently 3 commits ahead of its origin:
`83cb386`, `dfdb2e9`, `3525f6d`.)

**Coverage gap, recorded:** a change pushed to ZERO-PAPER HUB alone does not trigger this workflow. It
is audited at the next HAOO push or on a manual dispatch.

### Local run of the enumerated command, after the workflow was staged

The auditor printed identical output in both checkouts, verbatim:

```
Tree disjointness audit passed.
  ZERO-PAPER HUB tracked: 38 (38 after excluding .planning/)
  HAOO tracked:           379 (109 after excluding .planning/)
  paths compared:         147
  shared paths:           26
  allowlist entries:      26
  allowlist subtracted:   26
  violations:             0
  ratified collisions:    3 (converged: 0)
  ZPH product source shipping HAOO source: 0
  ZPH named carriers present: 2 of 2
  HAOO files naming a home-page symbol: 0
```

HAOO `npm run verify:disjoint`: exit 0. ZERO-PAPER HUB `npm run verify:disjoint`: exit 0.

### The observed CI run: OBSERVED 2026-09-12

This plan could not push. On the owner's decision the orchestrator pushed both repositories together
after the plan landed, in the order measured above: ZERO-PAPER HUB `c5b76cd..3525f6d` first (its
`Deploy ZERO-PAPERHUB` run `34714952939` concluded `success` in 44s), then HAOO `c39cc5a..ea538c0`.
The push to HAOO triggered the first run of this workflow. Read from the run with `gh run view`:

| Field | Value |
|---|---|
| Run identifier | `34715004118` (workflow `Verify tree disjointness`) |
| Head SHA (HAOO) | `ea538c0a171898c662deed0827478934f11c450c` |
| Sibling SHA printed by the clone step | `3525f6d4d7bb3349015e3e238e07b6e07c6b88c5`, the post-push tip of ZERO-PAPER HUB `main`, so the clone picked up the new allowlist |
| Conclusion | `success`; job `disjoint` `success`, all 7 run steps `success` |
| Verbatim `verify:disjoint` success line from the CI log | `Tree disjointness audit passed.`, then `shared paths: 26`, `allowlist entries: 26`, `allowlist subtracted: 26`, `violations: 0` (2026-09-12T19:43:52Z) |
| `cmp` step result | step 7 `Compare the two copies of the shared allowlist` concluded `success`. `cmp` prints nothing when the files match, so the result comes from the step conclusion, not from log output |

**The spot-checked fallback was not needed.** The first run concluded `success`, so SPLT-01 is continuously enforced on every HAOO push, within the coverage gap recorded above. Locally, the anonymous clone is feasible, as measured
above. If the first run concludes failure for an environmental reason the workflow cannot fix, record
here that **SPLT-01 is spot-checked rather than continuously enforced**, together with the measured
reason. Do not add a way for the job to pass on error.

---

## 5. Handed forward

- **G-1, for 05-14's judgement.** `scripts/verify-tree-disjointness.mjs` exits 0 when
  `allowlist subtracted` is less than `allowlist entries`, meaning an allowlist entry is no longer
  shared (measured above: 25 of 26). In CI, the new `cmp` step catches the case where the two lists
  disagree. It does not catch a stale entry that both lists still carry, for example a scaffold file
  deleted from one tree without editing the list. Closing that means changing the auditor, a
  byte-identical file in both repositories, so it is recorded here and not changed in this plan.

---

## 6. The phase-close sweep (plan 05-17, Task 1)

**Measured:** 2026-09-13, 08:19Z to 08:29Z, in the HAOO checkout (`main` at `565890b` when the sweep
ran) and in `../ZERO-PAPERHUB` (`main` at `3525f6d`). Every exit code below was produced by a run
inside this plan. None is carried forward from an earlier section of this file.
**Pushed:** neither repository. **Sent:** nothing. `e2e/live-submission.e2e.ts` was not collected,
and `HAOO_SEND_LIVE_SUBMISSION`, `HAOO_LIVE_SUBMISSION_PURPOSE` and `HAOO_LIVE_SUBMISSION_MARKER`
were unset for every command.

### 6.1 The deployments the live pass measured

| Repository | Workflow | Run identifier | Conclusion | Head commit | Started / finished (UTC) |
|---|---|---|---|---|---|
| HAOO | `Deploy HAOO` | `34729513221` | `success` | `2d45e5fef5624a378842d742a0d3c919ea580cee` | 2026-09-13T01:02:22Z / 01:03:28Z |
| HAOO | `Verify tree disjointness` | `34729513230` | `success` | `2d45e5fef5624a378842d742a0d3c919ea580cee` | 2026-09-13T01:02:22Z / 01:02:43Z |
| ZERO-PAPER HUB | `Deploy ZERO-PAPERHUB` | `34714952939` | `success` | `3525f6d4d7bb3349015e3e238e07b6e07c6b88c5` | 2026-09-12T19:42:30Z / 19:43:14Z |

Read with `gh run list` and `gh run view`. Each was the most recent run of its workflow at 08:19Z.

**The deployed commit contains this phase's source fixes.** `git merge-base --is-ancestor <fix> 2d45e5f`
exited 0 for each of the following:

| Commit | What it is |
|---|---|
| `d8f4bea` | 05-04 F1, parent-site links |
| `2d9c33b` | 05-04 F3, focus-source registration test |
| `78bf191` | F1-LIVE closure |
| `65a612a` | 05-13 reduced motion |
| `c9303e8` | ZM-LIVE-1 and ZM-LIVE-2 closure |
| `a54d54b` | 05-15 successor gate |
| `a7675f4` | L2-O1 test |
| `e6cf694` | L2-O1 fix |

`git log 2d45e5f..main` on `src/`, `public/`, `index.html`, `tailwind.config.js`, `vite.config.ts`,
`e2e/`, `scripts/` and `package.json` returned no commits. HAOO local `main` is ahead of origin by
documentation and evidence commits only. ZERO-PAPER HUB `main` equals `origin/main` at `3525f6d`.

**What production served at 08:19Z:**
- `https://www.haoo.online/` referenced `/assets/haoo-CHYRGEim.js`, `/assets/posthog-sdk-DE6Cs-ON.js`
  and `/assets/haoo-BYmxvBcM.css`.
- `https://haoo.online/` answered `301` to `https://www.haoo.online/`.

### 6.2 The gate table

The enumeration was read from each manifest's `scripts` block, not from a fixed list. It covers the
D-15 set plus `test:phase1:contracts`, the 05-15 successor to the expected-red gate. HAOO has
`verify:coverage`; ZERO-PAPER HUB has no such script. The remaining scripts (`dev`, `preview`,
`test:unit`, `report:haoo`, `test:e2e`, `test:e2e:live`) are not gates. `test:unit` is contained in
`test`, and the two e2e scripts are the Playwright passes in §6.3.

| Repository | Command | Exit code | Started / finished (UTC) | Reading |
|---|---|---|---|---|
| HAOO | `npm run build` | 0 | 08:20:10Z / 08:20:15Z | `dist/assets/haoo-DccNMFAD.js` 207.64 kB |
| HAOO | `npm run typecheck` | 0 | 08:20:15Z / 08:20:23Z | app, node and e2e projects |
| HAOO | `npm run lint` | 0 | 08:20:23Z / 08:20:27Z | |
| HAOO | `npm test` | 0 | 08:20:27Z / 08:20:52Z | `Test Files 10 passed (10)`, `Tests 688 passed (688)` |
| HAOO | `npm run verify:coverage` | 0 | 08:20:52Z / 08:20:52Z | `Phase 4 coverage audit passed: 70 required capabilities across 3 tables.` |
| HAOO | `npm run verify:disjoint` | 0 | 08:20:52Z / 08:20:52Z | 163 compared, 26 shared, 26 entries, 26 subtracted, 0 violations, 3 ratified collisions (converged 0) |
| HAOO | `npm run test:phase1:contracts` | 0 | 08:20:52Z / 08:21:13Z | `3 suites, 3 of 3 markers on green cases, 0 of 8 infrastructure-failure signatures present` |
| ZERO-PAPER HUB | `npm run build` | 0 | 08:21:13Z / 08:21:17Z | `dist/assets/main-ClJKpN3o.js` 179.59 kB |
| ZERO-PAPER HUB | `npm run typecheck` | 0 | 08:21:17Z / 08:21:21Z | app and node projects |
| ZERO-PAPER HUB | `npm run lint` | 0 | 08:21:21Z / 08:21:24Z | |
| ZERO-PAPER HUB | `npm test` | 0 | 08:21:24Z / 08:21:31Z | `Test Files 3 passed (3)`, `Tests 32 passed (32)` |
| ZERO-PAPER HUB | `npm run verify:disjoint` | 0 | 08:21:31Z / 08:21:31Z | the same 11 lines as HAOO's run, verbatim: 26 / 26 / 26, 0 violations |
| ZERO-PAPER HUB | `npm run test:phase1:contracts` | 0 | 08:21:31Z / 08:21:37Z | `1 suite, 1 of 1 markers on green cases, 0 of 8 infrastructure-failure signatures present` |

13 commands, 13 exit codes of 0. `cmp shared-scaffold.txt ../ZERO-PAPERHUB/shared-scaffold.txt`
also exited 0.

**The harmless build warning.** Both builds print
`Browserslist: caniuse-lite is outdated. Please run: npx update-browserslist-db@latest`. It concerns the
age of the browser-target database. It does not affect the exit code or the emitted bundle, and it has
appeared on every build this phase (05-RESEARCH §"Existing gate status").

**The local bundle name differs from production's by design.** The local build emits
`haoo-DccNMFAD.js` and production serves `haoo-CHYRGEim.js` from the same source. The deploy workflow
injects build-time variables, as `05-EVIDENCE-MAIL.md` Link 2 already records for this pair.

### 6.3 The live and preview passes

Both commands named the nine spec files explicitly. `e2e/live-submission.e2e.ts` was omitted, so it was
not collected at all:
`npx playwright test --project=<p> e2e/axe-baseline.e2e.ts e2e/axe-gate.e2e.ts e2e/form-states.e2e.ts e2e/keyboard.e2e.ts e2e/recovery.e2e.ts e2e/semantics.e2e.ts e2e/tracer.e2e.ts e2e/viewport.e2e.ts e2e/zoom-motion.e2e.ts`

Playwright `1.63.0`, 3 workers. The counts come from the JSON reporter's `stats` and per-test results.

| Project | Exit code | Collected | Expected (passed) | Skipped by project | Unexpected | Flaky | Retries consumed | Window (UTC) |
|---|---|---|---|---|---|---|---|---|
| `live` (`https://www.haoo.online`) | 0 | 141 | 128 | 13 | 0 | 0 | 0 | 08:21:38Z to 08:25:28Z |
| `preview` (`http://localhost:4173`, the `dist/` above) | 0 | 141 | 33 | 108 | 0 | 0 | 0 | 08:25:29Z to 08:26:27Z |

Per spec, passed / skipped:

| Spec | live | preview |
|---|---|---|
| `tracer.e2e.ts` | 1 / 0 | 0 / 1 |
| `viewport.e2e.ts` | 40 / 0 | 0 / 40 |
| `keyboard.e2e.ts` | 25 / 0 | 0 / 25 |
| `semantics.e2e.ts` | 12 / 0 | 12 / 0 |
| `recovery.e2e.ts` | 9 / 0 | 0 / 9 |
| `zoom-motion.e2e.ts` | 21 / 0 | 3 / 18 |
| `axe-gate.e2e.ts` | 8 / 4 | 5 / 7 |
| `form-states.e2e.ts` (live half: status and option-label inputs) | 5 / 5 | 9 / 1 |
| `axe-baseline.e2e.ts` | 7 / 4 | 4 / 7 |

Each skip is a `test.skip` on the project name, and the two projects' skips are complementary. The
live `retries: 2` allowance was not used.

### 6.4 Collected unit-test counts, against the counts before the harness

| Repository | Before the Playwright harness (05-RESEARCH, 2026-09-07) | Now | Change, and its cause |
|---|---|---|---|
| HAOO | 683 tests, 10 files | **688 tests, 10 files** | +1 in 05-04 (`2d9c33b`): `focus-contrast.test.ts` generates one case per focus source, and the seventh source was registered. +4 in L2-O1 (`a7675f4`): the four provider-refusal tests. No other change. |
| ZERO-PAPER HUB | 32 tests, 3 files | **32 tests, 3 files** | none |

05-03 recorded 683 = 683 = 683 across the harness installation. No change to these counts is
unexplained. The 141 Playwright tests are absent from both Vitest counts. They are `*.e2e.ts` files
under `e2e/`, which `vitest.config.ts` excludes.

### 6.5 The leftover-worktree blocker, re-measured (D-18 item 1)

| Reading | HAOO | ZERO-PAPER HUB |
|---|---|---|
| `git worktree list` | 1 line: the checkout itself, `565890b [main]` | 1 line: the checkout itself, `3525f6d [main]` |
| `.claude/` directory | absent | present, 0 entries |
| `find -maxdepth 3 -type d -name worktrees` (excluding `node_modules`) | 0 | 0 |
| `.claude/worktrees/rf-03-retry-1788205465/` | absent | absent |
| `vitest.config.ts` `exclude` carries `.claude/**` and `.gsd/**` | yes, plus `e2e/**` and `.playwright-report/**` | yes |
| Collected Vitest files / tests | 10 / 688 | 3 / 32 |

The Phase 4 entry recorded 591 collected tests where about 300 were expected, which is a doubling. The
counts above are single-copy counts. Each has a named cause for every change since 05-RESEARCH (§6.4).
This blocker is closed by re-measurement. Nothing was deleted by this plan.

### 6.6 The evidence records this pass wrote: committed, not restored

**Decision and reason.** The recorder (`e2e/fixtures/evidence.ts`) appends and never rewrites an
earlier record. This plan's purpose is that no live claim measures a superseded page, and the latest
committed keyboard and viewport records still carried the pre-F1-LIVE `href="/"`. The 37 files that
gained records are therefore committed as the phase-close reading, in their own commit, **`6be6575`**.
Every earlier record in them is unchanged.

`evidence/axe-baseline.json` is the exception. Its writer upserts by surface and state, so the run
replaced all 11 of 05-07's entries. A field-by-field comparison with the timestamp removed found 0
differences in 11 of 11 entries. The file was restored to HEAD by explicit path (`git checkout --
evidence/axe-baseline.json`, SHA-256 prefix `77a1d738a36f` before and after), which keeps the first-run
provenance. This plan's accessibility reading is the 11 records appended to `evidence/axe-gate.json`.

Nothing in `src/`, `scripts/` or `e2e/` reads a committed record back, so the appended records change
no test outcome.

**Method for "changed value".** Each new record was paired with the latest HEAD record for the same
question: the same surface, viewport, project, state, target and measured-key set. Both records were
compared leaf by leaf over `measured` and `detail`, with only timestamps and elapsed-time fields removed.

| File | Records before → after | Leaf values that differ from the latest HEAD record |
|---|---|---|
| `axe-baseline.json` | 11 → 11 (restored) | 0 of 11 entries (timestamps only) |
| `axe-gate.json` | 22 → 33 | `detail.scriptSources`: 4 live S1 records `/assets/haoo-D1dl6F2P.js` → `/assets/haoo-CHYRGEim.js`; 4 preview S5 records `/assets/haoo-CNGGkFFJ.js` → `/assets/haoo-DccNMFAD.js`. All counts identical. |
| `form-states-focus.json` | 14 → 18 | none |
| `form-states-option-labels.json` | 3 → 4 | none |
| `form-states-requests.json` | 6 → 8 | none |
| `form-states-status-region.json` | 3 → 4 | none |
| `form-states.json` | 33 → 43 | none |
| `keyboard-brochure.json` | 6 → 12 | none |
| `keyboard-products-region.json` | 6 → 12 | none |
| `keyboard-script-focus.json` | 7 → 14 | none |
| `keyboard-skip-link.json` | 6 → 12 | none |
| `keyboard-traversal.json` | 6 → 12 | `stops[].href` of both parent-site links, `/` → `https://www.zero-paperhub.com/`, in 6 of 6 viewports (12 values) |
| `live-submission.json` | 4 → 4 | not written (spec not collected) |
| `motion-closed-negative.json` | 7 → 9 | none |
| `motion-content-preserved.json` | 3 → 4 | none |
| `motion-observations.json` | 3 → 4 | none |
| `motion-suppression.json` | 12 → 16 | none |
| `recovery-analytics-blocked.json` | 3 → 4 | `measured.deployedBundle` `https://www.haoo.online/assets/haoo-D1dl6F2P.js` → `https://www.haoo.online/assets/haoo-CHYRGEim.js` |
| `recovery-destinations.json` | 19 → 21 | none |
| `recovery-reachability.json` | 9 → 12 | none |
| `recovery-retired-path.json` | 22 → 26 | S4 as-served: `scriptElementCount` 2 → 1, `edgeInjectedScriptElementCount` 2 → 1, the `static.cloudflareinsights.com/beacon.min.js` entry gone; the remaining entry is the 921-character inline bootstrap |
| `recovery-scriptless.json` | 9 → 10 | none |
| `semantics-accessible-names.json` | 14 → 18 | none |
| `semantics-brochure-equivalence.json` | 15 → 21 | none |
| `semantics-destinations.json` | 8 → 10 | none (HEAD's latest records were already post-F1-LIVE) |
| `semantics-headings.json` | 18 → 24 | none |
| `semantics-landmarks.json` | 12 → 16 | none |
| `semantics-products-region.json` | 12 → 16 | none |
| `semantics-regions.json` | 6 → 8 | none |
| `tracer-fixture-layer.json` | 1 → 2 | none |
| `tracer.json` | object, 26 keys → unchanged | not written (05-03's direct-write baseline) |
| `viewport-media-absent.json` | 10 → 20 | none |
| `viewport-mobile-nav.json` | 6 → 12 | none |
| `viewport-overflow.json` | 12 → 24 | none |
| `viewport-primary-actions.json` | 12 → 24 | `interactive.nonPrimaryTargets[].href` of both parent-site links, `/` → `https://www.zero-paperhub.com/`, in 6 of 6 live viewports (12 values) |
| `zoom-clipping.json` | 9 → 12 | none |
| `zoom-content.json` | 9 → 12 | none |
| `zoom-overflow.json` | 9 → 12 | none |
| `zoom-primary-actions.json` | 9 → 12 | none |
| `zoom-readability-inputs.json` | 12 → 16 | none |

### 6.7 Every value that differs, by identifier

- **F1-LIVE** (`78bf191`, deploy run `34687312104`). The HEAD `keyboard-traversal` records
  (2026-09-11T22:19Z–22:21Z) and `viewport-primary-actions` records (2026-09-11T21:51Z–21:52Z) were
  measured before the fix was deployed. Both "Back to ZERO-PAPER HUB" links now read
  `https://www.zero-paperhub.com/` at every viewport. `semantics-destinations` already carried the
  post-deploy reading from 2026-09-12T10:13Z, and it is unchanged.
- **Deployed bundle name** (deploy runs `34717723054` and `34729513221`). Live S1 moved from
  `haoo-D1dl6F2P.js` to `haoo-CHYRGEim.js`, and the local preview build from `haoo-CNGGkFFJ.js` to
  `haoo-DccNMFAD.js`. The source commits in between are `65a612a`, `a7675f4` and `e6cf694`.
- **O-1** (owner action, 2026-09-12). The S4 edge-injected script count was 2 in the latest HEAD
  record (2026-09-12T10:40:21Z) and is 1 at 2026-09-13T08:22:26Z. The Web Analytics beacon is absent.
  The one remaining script is the Cloudflare JavaScript Detections bootstrap, **CF-JSD-1**, which is an
  owner-accepted Free-plan limit. Across all 37 files, the new records carry 0 occurrences of
  `cloudflareinsights`.
- **AG-O1.** All 4 live S1 `axe-gate` records (08:21:47Z to 08:22:15Z) carry `scriptSources` =
  `["/assets/haoo-CHYRGEim.js"]` only. There is no beacon, and 0 `cloudflareinsights` occurrences on S1.
  HEAD's latest S1 records (20:33Z) already read absent, so this is the formal re-reading, not a new
  change.
- **ZM-LIVE-1 / ZM-LIVE-2.** No value differs from HEAD's latest records, which were taken after the
  `651eebe` deploy. Live S1 with reduce emulated read `transformBefore` `none`, `transformAfter`
  `none` and `transitionProperty` `none`. The no-preference control read
  `transformAfter` `matrix(1, 0, 0, 1, 0, -4)`.
- **L2-O1.** No e2e value differs, which is expected: every preview success route already fulfils
  `{"success":"true"}`. The refusal decision (`"success":"false"` counted as failed) is measured by the
  four unit tests inside HAOO's 688 (§6.4), and by the orchestrator's live mocked probe at
  2026-09-13T01:07:41Z (`05-EVIDENCE-MAIL.md` Link 2). This pass sent nothing to FormSubmit.
- **R-1.** The two S4 `axe-gate` records read `blockingNodeCount` 1, `exceptedBlockingNodeCount` 1 and
  `unexceptedBlockingNodeCount` 0 in both the as-served and refresh-stripped readings, identical to
  05-14. The vacuity guard did not trip, so the exception still matches a real result.

### 6.8 Measured for the Task 2 checkpoint: the certificate at both layers

Each reading is `echo | openssl s_client -connect <addr>:443 -servername <sni> | openssl x509 -noout
-issuer -subject -serial -startdate -enddate -ext subjectAltName -fingerprint -sha256`, taken
2026-09-13T08:19:04Z–08:19:08Z. DNS at the same moment:
- `haoo.online` and `www.haoo.online` resolved A `104.21.65.146` and `172.67.164.26`.
- NS: `bella.ns.cloudflare.com` and `oswald.ns.cloudflare.com`.

| Layer | Connected to / SNI | Issuer | Subject | SANs | Serial | notBefore | notAfter | SHA-256 prefix |
|---|---|---|---|---|---|---|---|---|
| Cloudflare edge (what visitors receive) | `www.haoo.online` / `www.haoo.online`; `haoo.online` / `haoo.online` | `C=US, O=Let's Encrypt, CN=YE2` | `CN=haoo.online` | `*.haoo.online`, `haoo.online` | `06D56404362229A110326272D5DCCF6249D0` | 2026-09-09 19:35:32Z | 2026-12-08 19:35:31Z | `B9:E9:CC:FE` |
| GitHub Pages origin | `185.199.108.153`, `.109.153`, `.110.153`, `.111.153`, each with SNI `www.haoo.online` and `haoo.online` (8 connections) | `C=US, O=Let's Encrypt, CN=YR2` | `CN=www.haoo.online` | `haoo.online`, `www.haoo.online` | `0609A5171B8224FD0D181CCBEC9CC50E7CC1` | 2026-09-03 07:14:32Z | 2026-12-02 07:14:31Z | `B2:C7:36:AB` |

All 8 origin connections returned the same serial. The origin serial equals the one D34 recorded on
2026-09-06 and 05-RESEARCH recorded on 2026-09-07.
