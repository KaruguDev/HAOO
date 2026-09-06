# Phase 5: Prove the Deployed Journey - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 5-prove-the-deployed-journey
**Areas discussed:** Where Phase 5 runs, Evidence instrument, Mail proof + LEAD-07, What counts as passing

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Where Phase 5 runs | Two repos, two domains; ZPH `.planning/` scheduled for removal under D-03/D37 | ✓ |
| Evidence instrument | SC1/SC2 unprovable by jsdom; no browser automation in either repo | ✓ |
| Mail proof + LEAD-07 | MX DECIDED NOT EXECUTED; mail to `info@haoo.online` does not arrive | ✓ |
| What counts as passing | QUAL-05 across two repos; pre-existing red `test:phase1:red` | ✓ |

**User's choice:** all four areas.

---

## Where Phase 5 runs

| Option | Description | Selected |
|--------|-------------|----------|
| HAOO is home | Execute D-03's second half, run Phase 5 from `KaruguDev/HAOO`, ZPH as satellite | ✓ |
| Stay in ZPH, sync to HAOO | Keep authoring here and one-directionally sync, as 04.2 did for late commits | |
| Split the record by repo | HAOO owns HAOO plans, ZPH revives a local `.planning/` for Products plans | |

**User's choice:** HAOO is home.
**Notes:** The removal trigger — 04.2 verify-work sign-off — has already fired, so the single-home
rule is due rather than early. The split-by-repo option was rejected in framing because Phase 5's
criteria are cross-repo statements with no single place to be asserted.

| Option | Description | Selected |
|--------|-------------|----------|
| Both, then delete ZPH | Write here, sync to HAOO, delete ZPH `.planning/` as Phase 5's first plan | ✓ |
| HAOO only, starting now | Write directly into `../HAOO/.planning/`, stop writing to ZPH entirely | |
| ZPH only for now | Write here, let a later sync carry it | |

**User's choice:** Both, then delete ZPH.
**Notes:** Keeps the record continuous — nothing is authored into a tree about to vanish, and the
removal happens deliberately with the D37 walk re-run rather than as a side effect.

| Option | Description | Selected |
|--------|-------------|----------|
| Proven in place, recorded in HAOO | Check live ZPH, write all evidence into HAOO's `.planning/` | ✓ |
| ZPH gets its own mini-record | Revive a minimal `.planning/` in ZPH for Products-side plans | |
| Defer ZPH-side proof entirely | Scope Phase 5 to the HAOO domain only | |

**User's choice:** Proven in place, recorded in HAOO.
**Notes:** Deferring was flagged as requiring a roadmap amendment, since SC1 names the Products
journey explicitly. Accepted cost of the chosen option: ZPH regressions are caught by HAOO's suite,
not ZPH's own CI.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, carry it forward | One checkout per repo, no worktrees | ✓ |
| Relax it — allow worktrees | Faster wave execution | |
| You decide | Planner's call, provided `verify:disjoint` resolves | |

**User's choice:** Yes, carry it forward.
**Notes:** Two independent reasons given — the relative sibling path in `verify:disjoint`, and the
Phase 4 blocker where a leftover worktree made Vitest collect 591 tests instead of ~300.

---

## Evidence instrument

| Option | Description | Selected |
|--------|-------------|----------|
| Playwright + axe | Real viewports and focus order; repeatable, catches later regressions | ✓ |
| Structured human UAT | Written checklist with verbatim evidence; zero new dependencies, proves once | |
| Hybrid: automate then human-confirm | Tooling for mechanical rows, humans for judgment rows | |

**User's choice:** Playwright + axe.
**Notes:** Cost accepted: a new toolchain in a repo with none, plus browser binaries in CI.

| Option | Description | Selected |
|--------|-------------|----------|
| Live production, with local as a gate | Evidence run hits live hosts; same specs runnable against `vite preview` in CI | ✓ |
| Live production only | Simplest, but cannot run pre-deploy and a network blip reads as failure | |
| Local preview only | Hermetic, but proves the bundle rather than the deployment | |

**User's choice:** Live production, with local as a gate.

| Option | Description | Selected |
|--------|-------------|----------|
| HAOO repo, separate from vitest | Own config and script; keeps the existing gate fast and hermetic | ✓ |
| HAOO repo, wired into npm test | One command runs everything | |
| You decide | | |

**User's choice:** HAOO repo, separate from vitest.

| Option | Description | Selected |
|--------|-------------|----------|
| HAOO's suite hits live ZPH | Target `https://www.zero-paperhub.com/`; install nothing in ZPH | ✓ |
| Mirror a minimal suite into ZPH | ZPH CI guards its own page | |
| You decide | | |

**User's choice:** HAOO's suite hits live ZPH.
**Notes:** Mirroring would add a converging config pair to the shared-scaffold allowlist on exactly
the "both halves need it" grounds 04.2 forbade.

| Option | Description | Selected |
|--------|-------------|----------|
| Narrow, named set | 360/390/768/1280/1440, Chromium, 200% zoom, reduced motion, keyboard-only | ✓ |
| Broad cross-browser matrix | Chromium + Firefox + WebKit | |
| You decide | | |

**User's choice:** Narrow, named set.
**Notes:** Follows the closed-list discipline at `focus-contrast.test.ts:27-33`. Cross-browser
deferred on run-time cost.

---

## Mail proof + LEAD-07

| Option | Description | Selected |
|--------|-------------|----------|
| Blocking gate, early | MX change as a wave-1 blocking checkpoint; `dig` must return non-empty | ✓ |
| Gate only the final plan | Keeps early waves unblocked; risks stalling at the finish line | |
| Proceed and record as unproven | Honest, but leaves LEAD-07 unmet | |

**User's choice:** Blocking gate, early.
**Notes:** Chosen so DNS propagation overlaps the Playwright work.

| Option | Description | Selected |
|--------|-------------|----------|
| Owner-recorded verbatim evidence | Tag, received timestamp, destination folder; spam passes but is recorded as spam | ✓ |
| Spam arrival is a partial pass | Opens a deliverability follow-up | |
| You decide | | |

**User's choice:** Owner-recorded verbatim evidence.
**Notes:** The stricter option was flagged as going beyond what the roadmap criterion asks.

| Option | Description | Selected |
|--------|-------------|----------|
| Timestamped release marker | Unique, findable, unmistakable for a real lead | ✓ |
| Reuse an existing form field naturally | Less intrusive, but pollutes the lead record | |
| You decide | | |

**User's choice:** Timestamped release marker.

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit step in the same gate | MX → dig → activation confirmed → endpoint state → submission | ✓ |
| Treat activation as a precondition | Owner activates before the phase starts | |
| You decide | | |

**User's choice:** Explicit step in the same gate.
**Notes:** Raised during discussion — FormSubmit's activation mail goes to the very mailbox under
test, so the dependency is circular and must be sequenced rather than assumed.

| Option | Description | Selected |
|--------|-------------|----------|
| Prove the paths resolve, not that they deliver | Links present, well-formed, reachable, incl. `noscript` | ✓ |
| Also place a live test contact | Stronger, but reaches uncontrolled third-party systems | |
| You decide | | |

**User's choice:** Prove the paths resolve, not that they deliver.

---

## What counts as passing

| Option | Description | Selected |
|--------|-------------|----------|
| Both repos, full gate | build/typecheck/lint/vitest/verify:coverage/verify:disjoint + both Pages deploys | ✓ |
| HAOO full, ZPH deploy-only | Lighter; a ZPH lint or type regression would not block | |
| You decide | | |

**User's choice:** Both repos, full gate.

| Option | Description | Selected |
|--------|-------------|----------|
| Resolve it inside this phase | Retire or invert `test:phase1:red` with a recorded rationale | ✓ |
| Exclude it from the gate explicitly | Ships a phase claiming checks pass alongside one that does not | |
| Owner decides now, outside the phase | Stalls on a decision outstanding since 04.2 | |

**User's choice:** Resolve it inside this phase.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — make it runnable in CI | Workflow checks out the sibling so SPLT-01 is enforced per push | ✓ |
| No — keep it a local/manual check | Avoids cross-repo checkout complexity | |
| You decide | | |

**User's choice:** Yes — make it runnable in CI.

| Option | Description | Selected |
|--------|-------------|----------|
| Leftover worktree doubling Vitest | Contaminates the evidence QUAL-05 rests on | ✓ |
| Kenya DPA 2019 sign-off | Open since `02-VALIDATION.md:91`; needs legal standing | ✓ |
| 04-UI-SPEC.md contradictions | Documentation-level; already resolved in code by plan 04-03 | ✓ |
| The 2026-09-03 attacker certificate | D34; valid to 2026-12-02, revocation behaviour unconfirmed | ✓ |

**User's choice:** all four must close.
**Notes:** Claude flagged that two of the four cannot be resolved by this phase's own work, which
prompted the follow-up below.

| Option | Description | Selected |
|--------|-------------|----------|
| Blocking human checkpoints | Owner returns a resolution or an explicit recorded risk acceptance | ✓ |
| Must be genuinely resolved | Could stall indefinitely — the certificate runs to 2026-12-02 | |
| Downgrade these two to recorded risks | Keeps Phase 5 closable, but launches with the DPA question open | |

**User's choice:** Blocking human checkpoints.
**Notes:** Mirrors the 04.2 D-09 mechanism. Phase 5 closes on a decision having been made and
recorded, not on the risk having vanished.

---

## Claude's Discretion

- Playwright config shape, spec organisation and naming
- The axe rule set, and which violations fail versus are recorded
- How live-vs-local targets are parameterised
- The tag field and format for the production submission
- The shape of the `test:phase1:red` successor
- The CI mechanism for the sibling checkout
- Wave ordering

**Open question deliberately handed to planning:** how automated Playwright traffic against live
production is kept out of the owner report's counts (measurement suppression, HogQL exclusion,
documented run window, or an explicit report note). It must be decided, not discovered — the
existing `HAOO_DOMAIN_CUTOVER_DAY` query bound is the precedent.

## Deferred Ideas

- Cross-browser evidence (Firefox, WebKit) — declined on run-time cost
- Deliverability hardening (SPF/DKIM/DMARC) — becomes obvious if D-13 records a spam landing
- Certificate-transparency monitoring for the `haoo.online` zone
- Visual regression / screenshot baselines
- A drift check between the ZPH Products card copy and HAOO's own copy (04.2 D-06, still unsolved)
- Refreshing `.planning/codebase/` maps — stale at `7a99cab` and now also pre-split
