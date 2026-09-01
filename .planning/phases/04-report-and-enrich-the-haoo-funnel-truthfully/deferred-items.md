# Phase 04 — Deferred Items

Out-of-scope discoveries logged during execution. Not fixed; recorded so they are not
rediscovered.

| Found during | Item | Why deferred |
|--------------|------|--------------|
| 04-01 Task 1 | An untracked leftover worktree at `.claude/worktrees/rf-03-retry-1788205465/` contains a full copy of `src/`, so Vitest collects and runs every suite twice (21 test files instead of 11, 591 tests instead of ~300). All duplicated suites pass. | Pre-existing, unrelated to this plan's changes, and inside the untracked `.claude/` tree. Removing a worktree is explicitly outside an executor's remit. It doubles suite runtime and would mask a future single-copy regression, so it should be cleaned up deliberately. |
