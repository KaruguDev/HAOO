# Phase 5 Evidence — The Planning Record's Single Home

**Plan:** 05-01
**Requirement:** QUAL-05
**Decisions executed:** phase 5 D-01, D-02, D-04 — the second half of 04.2 D-03

---

## The walk that authorises the removal, re-run at execution time and not cited from any earlier one

The walk recorded below was executed **at the timestamp it carries, during plan 05-01, and its
integers are committed in the same act as the removal they authorise.** It is not a citation of
the `2026-09-06T14:23:23Z` figure recorded in
`.planning/phases/04.2-split-haoo-into-its-own-repository-and-domain/04.2-DEFERRED-ITEMS.md` §D37,
and it is not a citation of the `243 files / 3 ZPH-only / 0 differing` re-measurement written into
that entry's W-1 amendment either. Both are historical.

This is the whole point of the 04.2 W-1 amendment. D37's own trigger — `/gsd-verify-work 04.2`
sign-off — is the event that writes new ZERO-PAPER HUB-only planning files, so any number recorded
before the trigger is stale by construction. Executed against the 14:23:23Z figure, the removal
would have destroyed `04.2-UAT.md`, `COVERAGE.md` and `04.2-VERIFICATION.md`. A count recorded in a
document cannot be a precondition for a destructive action taken later. The walk is cheap; re-running
it is the only form of this check that is true when it is read.

### Method

Every file under `../ZERO-PAPERHUB/.planning/` and under `.planning/` was enumerated and each
relative path classified into exactly one of three sets: present only in ZERO-PAPER HUB, present
only in HAOO, or shared. Every shared path was then compared byte-for-byte with `cmp`.

`research/.cache/` is excluded from the counts below in both trees: it is gitignored in HAOO and is
generated output, not record. It was nevertheless compared separately, and its result is recorded
under "The excluded cache" below rather than left unstated.

### Measured

**Walk timestamp (ISO-8601 UTC): 2026-09-07T13:07:25Z**

| Quantity | Integer |
|---|---|
| Files in the ZERO-PAPER HUB planning tree | 233 |
| Files in the HAOO planning tree | 234 |
| Total distinct relative paths compared (the union) | 234 |
| Shared paths compared byte-for-byte | 233 |
| Present only in ZERO-PAPER HUB | 0 |
| Present only in HAOO | 1 |
| Shared paths whose content differs | 0 |

The two integers that authorise the deletion, on their own lines, in the machine-readable form
plan 05-01 task 2 greps for:

ZPH-only count: 0
Differing count: 0

233 shared paths were compared, so the walk cannot have reported zero differences by comparing an
empty tree.

**The single HAOO-only path is `milestone.lock`**, which is expected and is named as expected by the
plan. HAOO is the superset; paths it holds alone are correct and nothing was done about it.

### The excluded cache, measured rather than assumed

`research/.cache/` is outside the counts above, but the removal deletes it too, and its 18-file
ancestor is the one part of the tree D37 flagged as unrecoverable from git in either repository —
gitignored on both sides, so recoverable only from HAOO's working tree. It was therefore compared:

| Quantity | Integer |
|---|---|
| Cache files in the ZERO-PAPER HUB tree | 34 |
| Cache files in the HAOO tree | 39 |
| Cache paths present only in ZERO-PAPER HUB | 0 |
| Shared cache paths whose content differs | 0 |

HAOO holds a copy of all 34, byte-for-byte, and 5 more. No cache file is destroyed that exists
nowhere else.

---

## One shared path differed on the first walk, and how that was resolved

**The first walk, at 2026-09-07T13:01Z, reported `ZPH-only: 0`, `HAOO-only: 1`, `Differing: 1`.**
Recorded here rather than overwritten, because the tree was mutated to reach the zero above and a
reader is entitled to know that.

The differing path was `.planning/STATE.md`. Both copies were 276 lines and the difference was five
lines of GSD session position: `last_updated`, `last_activity_desc`, `state_head`, the current-focus
line and the current-position block. No accumulated decision content differed; the other 271 lines
were already byte-identical.

The cause: the Phase 5 planning session ran in the **ZERO-PAPER HUB** checkout and wrote its
`STATE.md` at `2026-09-07T12:56:04Z` (`state_head 3d1e110`, "Phase 05 planning complete"). HAOO's
orchestrator wrote a strict successor at `2026-09-07T12:59:40Z` (`state_head f957fd9`, "Phase 05
execution started"). The mirror commits that brought Phase 5's plans, `05-PATTERNS.md` and
`05-VALIDATION.md` into HAOO did not carry that 12:56 state write across, so HAOO held neither copy
of it — the divergence was real and not merely an uncommitted-working-tree artifact.

Plan 05-01 task 1 forbids an executor resolving such a divergence on its own judgment: picking a
side is exactly the decision D-03's single-home rule exists to close. **The executor halted and
surfaced it. The repository owner resolved it in HAOO's favour**, which is D-01 applied literally,
and the walk was then re-run. The re-run — not the first walk — is what authorises the removal.

| Act | Repository | Commit |
|---|---|---|
| Phase 5 execution start recorded in `STATE.md` and `milestone.lock` | `KaruguDev/HAOO` | `9eec11e` |
| `STATE.md` synced forward from HAOO before the tree is removed | `KaruguDev/ZERO-PAPERHUB` | `83cb386` |

---

## Commit SHAs

The removal and the walk that authorised it, as commits in the two repositories:

| Act | Repository | Short SHA | Full SHA |
|---|---|---|---|
| The authorising walk, its integers recorded | `KaruguDev/HAOO` | `01b5ba5` | `01b5ba5b900e73e873fdbb4720b966bda03c8311` |
| The planning directory removed, 249 tracked files, 68784 deletions | `KaruguDev/ZERO-PAPERHUB` | `dfdb2e9` | `dfdb2e944cc18e38ae33a4a9ec7b66f2ee5bcadf` |
| Phase 5 execution start recorded, ahead of the walk | `KaruguDev/HAOO` | `9eec11e` | `9eec11e13dd22bc7ab9d8ae64468d731df231746` |
| `STATE.md` synced forward, resolving the one differing path | `KaruguDev/ZERO-PAPERHUB` | `83cb386` | `83cb386e74db0663e74f62ef0c705a9a3b5daa56` |

`git rm -r` staged 249 tracked files, which is more than the 233 the walk compared. The difference is
`research/.cache/`, gitignored in HAOO but tracked in ZERO-PAPER HUB, and excluded from the walk's
counts by plan 05-01's own instruction. It was measured separately for exactly that reason — all 34
of its files are byte-for-byte present in HAOO — so the superset property holds across the wider set
the removal actually touched, not only across the set the walk counted. Recorded because a reader
comparing 249 against 233 would otherwise be right to ask.

### Who ran the deletion

The gate, its exit status and the commit body above are the executor's. **The three destructive
commands themselves were run by the orchestrator**, after Claude Code's auto-mode permission
classifier denied `git rm -r` in the executor context, and after the repository owner authorised
them. Recorded literally rather than left to imply the executor performed the removal, in the same
discipline this file applies to its own numbers: the harness permission denial is a fact about how
this evidence was produced, and a later reader auditing a one-way act should know which hands were
on it.

### What remains checkable after the removal, and what does not

Plan 05-01 task 1's automated verification has two halves, and the removal deliberately ends one of
them:

- The two `cmp` comparisons against `../ZERO-PAPERHUB/.planning/...` are **unrunnable from now on**,
  by design — their right-hand operand is what task 2 deleted. They were run before the removal and
  both exited 0. That result is historical from this point forward and is recorded as such.
- The two `grep` assertions on the authorising integers **remain runnable indefinitely**, because
  this file lives in HAOO and is unaffected by removing the other tree. Re-run after the removal:
  both still read `0`. The authorisation for a one-way act stays auditable after the act, which is
  the property that made it worth writing these two lines in a machine-readable form.

---

