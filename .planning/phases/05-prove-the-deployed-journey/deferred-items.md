# Phase 05 — Deferred Items

Items found or handed on during Phase 05 that no plan in this phase fixes. Each entry names where it
came from and why it is recorded here rather than fixed.

## G-1: the disjointness auditor accepts a stale allowlist entry

- **Recorded by:** 05-15 (`05-15-SUMMARY.md`, "G-1, handed to 05-14").
- **Routed here by:** 05-14, Task 1 (`05-EVIDENCE-AXE.md` §8.3).
- **What it is:** `scripts/verify-tree-disjointness.mjs` exits 0 when `allowlist subtracted` is less
  than `allowlist entries`, which means an allowlist entry is no longer shared by both trees. The
  CI `cmp` step in `.github/workflows/verify-split.yml` catches the two allowlists disagreeing. It
  does not catch a stale entry that both lists still carry.
- **Why it is not fixed in 05-14:** it is not an accessibility finding. The auditor is byte-identical
  in HAOO and ZERO-PAPER HUB (`cmp` exit 0 on 2026-09-12), so the fix is a paired commit in both
  repositories, outside 05-14's file list. No evidence in 05-14 forces a ZERO-PAPER HUB commit
  (05-CONTEXT D-03).
- **What a fix involves:** make the auditor exit non-zero when `allowlist subtracted` is not equal
  to `allowlist entries`, and apply the same change to both copies so `cmp` stays 0.
- **Current measured state:** 26 shared, 26 allowlist entries, 26 subtracted, 0 violations. No
  stale entry exists today.
