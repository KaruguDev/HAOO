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

### The observed CI run: NOT YET OBSERVED

This plan could not push, so no run of this workflow exists, and none is implied here. The orchestrator
fills in the following after the push:

| Field | Value |
|---|---|
| Run identifier | _pending: orchestrator, after the push_ |
| Head SHA (HAOO) | _pending_ |
| Sibling SHA printed by the clone step | _pending_ |
| Conclusion | _pending_ |
| Verbatim `verify:disjoint` success line from the CI log | _pending_ |
| `cmp` step result | _pending_ |

**The spot-checked fallback does not apply yet.** Locally, the anonymous clone is feasible, as measured
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
