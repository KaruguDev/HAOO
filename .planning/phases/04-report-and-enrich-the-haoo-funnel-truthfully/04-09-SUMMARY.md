---
phase: 04-report-and-enrich-the-haoo-funnel-truthfully
plan: 09
subsystem: measurement
tags: [plausible, privacy, analytics, fail-closed, tdd, vitest]

# Dependency graph
requires:
  - phase: 04-08
    provides: The approved analytics script source contract that constrains `resolvePlausibleScriptSrc` to an exact origin+path allowlist injected via a vite `define`
  - phase: 04-06
    provides: The name-only provider seam, the preload contract fixture, and the original provider-failure isolation cases
provides:
  - Fail-closed provider initialization — no managed script is appended and no event sink is returned until the recorded `autoCapturePageviews: false` opt-out is confirmed for the configured domain
  - Adversarial coverage for absent, throwing, and non-recording initializers on a pre-existing `window.plausible`
  - Full-facade MEAS-07 regressions proving the HAOO journey and the bounded local context keep working in every refused-initialization path
  - Strict provider-identity guarantee: a foreign global is adopted or ignored, never replaced, wrapped, or decorated
affects: [measurement, haoo-report, phase-04-verification, gsd-secure-phase]

actuals:
  tokens: 13060
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Confirm-then-act ordering: a privacy precondition is proven from a recorded observable before the capability it guards is enabled"
    - "Untrusted ambient globals are structurally inspected, never trusted to match their declared TypeScript type"
    - "A pre-existing provider global is never replaced on any refusal path, whatever its type, because the adopted-versus-installed classification is decided before anything is assigned to the scope"

key-files:
  created: []
  modified:
    - src/measurement/plausible.ts
    - src/test/measurement.test.ts

key-decisions:
  - "Confirm the recorded options slot rather than a non-throwing `init` call — a cosmetic no-op initializer would otherwise satisfy a throw-only check and leave automatic capture unproven"
  - "A pre-existing full provider implementation that does not expose the documented `o` options slot is treated as unconfirmable and yields no sink — a deliberate fail-closed outcome, accepting lost analytics over unproven privacy"
  - "No pre-existing provider global is replaced, wrapped, mutated, or deleted on any refusal path, whatever its type — the classification decides before it assigns, so a refusal has nothing left behind to withdraw (amended by plan 04-12; see the dated amendment note at the end of this file)"
  - "The `recordingScope()` test fixture now mirrors the documented vendor preload by assigning received options to `o`, replacing a cooperative-but-unrealistic mock"

patterns-established:
  - "Fail-closed precondition: the guarded side effect (script insertion) is unreachable in the source until the guard has returned a non-null result"
  - "Non-vacuity proof: new coverage is validated by reverting the production change and confirming the new cases fail"

requirements-completed: [MEAS-01, MEAS-08]

coverage:
  - id: D1
    description: "A provider script is appended and an event sink returned only after `resolveInitializedProvider` returns a non-null provider, and the `autoCapturePageviews: false` opt-out this project sends is recorded and re-read for the configured domain before that happens — script insertion is unreachable until then"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider initialization > installs, initializes, and confirms the stub before appending the script"
        status: pass
      - kind: other
        ref: "grep -n 'appendProviderScript|resolveInitializedProvider' src/measurement/plausible.ts — the sole call site (line 206) follows the null guard (line 204)"
        status: pass
      - kind: manual_procedural
        ref: "04-VERIFICATION.md behavior_unverified_items[0], recorded as an owner-facing gate in 04-USER-SETUP.md — after production enablement, load the HAOO page once with the approved script and site values and watch the provider dashboard live view, expecting exactly one page-view occurrence for the visit, no additional automatic pageview, and no pageview carrying campaign parameter values"
        status: unknown
    human_judgment: true
    rationale: "The assertion is about the vendor script honouring the recorded `autoCapturePageviews: false` value. The repository can only prove that it wrote and re-read that value; no test in this tree can observe the real script's behaviour. Only the live dashboard gate settles it, so this row routes to a human rather than auto-passing on the structural evidence above."
  - id: D2
    description: "The verifier's first adversarial probe: an existing callable provider with no `init` returns `undefined`, appends zero scripts, and leaves the pre-existing global at the identical reference with no options slot and no queue"
    requirement: "MEAS-08"
    verification:
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider initialization > returns no sink and appends no script when the existing provider has no initializer"
        status: pass
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider initialization in the full journey > leaves a refused provider global at its original identity"
        status: pass
    human_judgment: false
  - id: D3
    description: "The verifier's second adversarial probe: an existing provider whose `init` throws returns `undefined`, appends zero scripts, and lets no exception escape into the caller"
    requirement: "MEAS-08"
    verification:
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider initialization > returns no sink and appends no script when the existing initializer throws"
        status: pass
    human_judgment: false
  - id: D4
    description: "A silent no-op initializer that records no options also returns `undefined` and appends zero scripts, so a cosmetic initializer cannot satisfy the opt-out"
    requirement: "MEAS-01"
    verification:
      - kind: unit
        ref: "src/test/measurement.test.ts#fail-closed provider initialization > returns no sink when the existing initializer records no options"
        status: pass
    human_judgment: false
  - id: D5
    description: "MEAS-07 does not regress in any of the three refusal cases: a full initialize-and-track round trip returns `true`, updates the bounded local interaction flags across three successive actions, writes nothing to the console, appends no script, and forwards zero provider calls"
    requirement: "MEAS-01"
    verification:
      - kind: integration
        ref: "src/test/measurement.test.ts#fail-closed provider initialization in the full journey > keeps the whole journey working when the existing provider has no initializer"
        status: pass
      - kind: integration
        ref: "src/test/measurement.test.ts#fail-closed provider initialization in the full journey > keeps the whole journey working when the existing initializer throws"
        status: pass
      - kind: integration
        ref: "src/test/measurement.test.ts#fail-closed provider initialization in the full journey > keeps the whole journey working when the existing initializer records no options"
        status: pass
    human_judgment: false
  - id: D6
    description: "The already-shipped preload contract is unchanged on the cooperative path: initialization options land in `plausible.o`, `plausible.q` carries only real one-argument event calls, all ten allowlisted names forward exactly one bare argument, and the script is appended exactly once"
    requirement: "MEAS-08"
    verification:
      - kind: unit
        ref: "src/test/measurement.test.ts#name-only provider sink > matches the documented preload options and event-queue contract"
        status: pass
      - kind: unit
        ref: "src/test/measurement.test.ts#name-only provider sink > forwards exactly one bare argument for every one of the ten event names"
        status: pass
      - kind: unit
        ref: "src/test/measurement.test.ts#name-only provider sink > appends the configured site script exactly once with deferred loading"
        status: pass
    human_judgment: false
  - id: D7
    description: "The three pre-existing provider-failure isolation contracts still pass with their expectations unedited — absent global, throwing provider call, and failed script load"
    requirement: "MEAS-08"
    verification:
      - kind: integration
        ref: "src/test/measurement.test.ts#provider failure isolation (3 cases, expectations unedited — git diff shows no change to lines 826+)"
        status: pass
      - kind: other
        ref: "npm test — 747 tests passed across 21 files including the build step"
        status: pass
    human_judgment: false

# Metrics
duration: 6 min
completed: 2026-09-02
status: complete
---

# Phase 04 Plan 09: Fail-Closed Provider Initialization Summary

**The Plausible adapter now proves `autoCapturePageviews: false` was actually recorded for the configured domain before it will append a script or return an event sink — absent, throwing, and silently no-op initializers all yield no collection at all.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-02T05:28:41Z
- **Completed:** 2026-09-02T05:34:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced `ensureProvider`'s unconditional return with `resolveInitializedProvider`, which decides the provider, initializes it, confirms the recorded opt-out, and returns `null` on every unconfirmed outcome. `appendProviderScript` is now structurally unreachable until that guard passes, so the ordering defect from CR-02 is impossible rather than merely untested.
- Closed a third defect the verifier's two probes would not have caught: an initializer that neither throws nor records anything. Confirming the recorded options slot — not merely a non-throwing call — is what makes the privacy claim provable.
- Added seven new cases covering absent `init`, throwing `init`, non-recording `init`, confirmed-stub ordering, and strict provider identity, plus full-facade MEAS-07 regressions for all three refusal paths.
- Proved the new coverage is non-vacuous: reverting the production change makes all seven fail (`7 failed | 128 passed`), and restores identically afterwards.

## Task Commits

Each task was committed atomically:

1. **Task 1: Require a confirmed automatic-capture opt-out before any script insertion or sink return** (tracer, TDD)
   - RED: `883937e` (test) — two failing adversarial cases, `2 failed | 127 passed`
   - GREEN: `a097269` (feat) — fail-closed resolution + fixture mirroring the vendor preload, `131 passed`
   - No REFACTOR commit needed — the GREEN implementation required no cleanup pass.
2. **Task 2: Prove the local journey stays fully functional in every refused-initialization case** - `f613c01` (test)

**Plan metadata:** see the `docs(04-09)` commit.

## Files Created/Modified

- `src/measurement/plausible.ts` — `installProviderStub` (extracted from `ensureProvider`), `recordsOptOut` (structural confirmation of the untrusted options slot), and `resolveInitializedProvider` (adopt-or-install, initialize, confirm, refuse-and-clean-up). `createPlausibleEventSink` now returns `undefined` on an unconfirmed provider before reaching `appendProviderScript`.
- `src/test/measurement.test.ts` — three minimal provider fixtures (`bareCallableScope`, `throwingInitScope`, `silentInitScope`), the `fail-closed provider initialization` adapter-level describe, the `fail-closed provider initialization in the full journey` facade-level describe, and a `recordingScope()` fixture whose `init` now assigns received options to `o` like the documented vendor stub.

## Decisions Made

- **Confirm the recorded options, not the absence of a throw.** The review's suggested fix (CR-02) only checked that `init` existed and did not throw. That still accepts a cosmetic initializer that records nothing, leaving automatic capture unproven. Reading back `o` and requiring `autoCapturePageviews === false` with a matching `domain` is what turns the truth statement into an executable assertion.
- **Unconfirmable means unusable.** A real third-party Plausible implementation that does not expose the documented `o` slot gets no sink. This trades analytics availability for a provable privacy posture, which is the correct direction for this phase's central claim.
- **Refusal cleans up after itself.** When this call installed the stub, refusal deletes it from the scope, so no half-initialized provider is left where a later script could drain it. An adopted foreign global is never touched at all.
- **The `recordingScope()` fixture was the reason the defect stayed invisible.** Its `init` recorded the call but never assigned `o`, so it modelled a cooperative provider that no real vendor stub matches. Aligning it with `plausible-preload-contract.ts` means the existing ordering, arity, and facade-wiring cases now exercise the same observable the production code confirms.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- A stale untracked worktree at `.claude/worktrees/rf-03-retry-1788205465/` pollutes the default vitest glob, so unit runs during development used `--exclude '**/.claude/worktrees/**'`. This is pre-existing repository pollution outside this plan's scope; it was not edited, and the plan-level `npm test` run (747 tests, 21 files) passes with it included.

## Verification

- `npm run test:unit -- --run src/test/measurement.test.ts` — 135 passed.
- `npm test` — 747 passed across 21 files, including the `vite build` step.
- `npm run lint` — exits 0. `npm run typecheck` — exits 0.
- Non-vacuity: with `src/measurement/plausible.ts` reverted to `883937e`, all 7 new cases fail (`7 failed | 128 passed`), including both required probes. The file was restored byte-identically afterwards.
- Independent manual re-run of the verifier's two probes against the adapter (a throwaway probe file constructing the scopes from scratch, outside the committed suite) — both returned no sink and appended no script; the probe file was deleted.
- `git diff 883937e~1 HEAD --name-only` lists exactly `src/measurement/plausible.ts` and `src/test/measurement.test.ts`. `src/measurement/index.ts`, `.github/workflows/deploy.yml`, and every `VITE_HAOO_*` value are untouched.

## Known Stubs

None — no stubs, TODOs, skipped tests, or unrun `<verify>` commands were introduced.

## Threat Flags

None — this plan removes attack surface (T-04-33 through T-04-36 and T-04-38 are now mitigated by executable evidence) and introduces no new network endpoint, auth path, file access pattern, or schema change.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Verification gap 2 and review finding CR-02 are closed with executable evidence for all three unconfirmed-initialization paths.
- MEAS-01's count-integrity blocker no longer includes a collection path where a duplicate automatic pageview could inflate occurrence counts; MEAS-08's evidence-integrity blocker no longer describes an unproven opt-out.
- No blockers introduced for the remaining Phase 04 plans. The facade, the five-member public surface, the ten-name allowlist, and the approved-source contract from 04-08 are all unchanged.

---
*Phase: 04-report-and-enrich-the-haoo-funnel-truthfully*
*Completed: 2026-09-02*

## Self-Check: PASSED

- All modified files verified present on disk: `src/measurement/plausible.ts`, `src/test/measurement.test.ts`, `04-09-SUMMARY.md`.
- All three task commits verified in git history: `883937e` (RED), `a097269` (GREEN), `f613c01` (Task 2). The metadata commit is this file's own `docs(04-09)` commit, so its hash is intentionally not quoted here.
- No tracked files were deleted by any plan commit; no untracked files left under `src/`.
- `MEAS-01` and `MEAS-08` were NOT marked complete: `requirements.ready-ids` returned `0/2 ready` because sibling plans in phase 04 also declare both IDs and have not produced summaries yet (shared-ID gate, #2388). They will be marked when the last declaring plan finishes.

## Amendment 2026-09-02 (plan 04-12)

*Two claims recorded by this plan are withdrawn. The `key-decisions` entry "A stub
installed by this call is deleted from the scope when initialization is refused, so no
partially initialized provider is left on the page" and the matching `tech-stack.patterns`
entry "Self-installed state is removed on refusal so a rejected initialization leaves
nothing behind on a shared scope" both described the `if (!adopted) delete scope.plausible`
branch inside the `refuse()` closure in `src/measurement/plausible.ts`. That branch had no
executable path: it can only run when the stub was self-installed, and the stub's own
`init` assigns the options it is handed and cannot throw, so the recorded-opt-out check
that guards the branch cannot fail on that path. Both claims asserted a mitigation with no
reachable code behind them.*

*`04-VERIFICATION.md` recorded the defect as **gap 2** with status **failed**: the
non-function pre-existing global probe `{ plausible: { o: 'foreign' } }` was replaced by
the stub, a sink was returned, one script was appended, and nothing was ever restored. The
same file records the prohibition "No pre-existing provider global replaced, wrapped, or
mutated when its initializer is absent (04-09)" as VIOLATED.*

*Plan 04-12 replaced the withdrawn claims with a stronger and reachable guarantee: the
adopted-versus-installed classification is now decided before any assignment to the scope,
so a defined non-callable value is refused outright and left at its identical reference,
and the stub is installed only onto a scope that carried no provider value at all. There is
consequently no refusal path on which anything needs restoring, and the unreachable branch,
its closure, and the docstring sentence that recorded it were removed. The new guarantee is
covered by two cases added in 04-12 — an adapter-boundary case asserting no sink, zero
appended script elements, and an unchanged original property set, and a full-journey MEAS-07
case asserting three successful tracked actions, the matching bounded local flags, zero
script elements, and a silent console.*

*The D1 `coverage` row in this file is a separate correction, owned by plan 04-13, and is
deliberately untouched here. Plan 04-12 edited only the third `key-decisions` entry, the
third `tech-stack.patterns` entry, and this note; the D1, D2 and D3 `coverage` rows, the
`requirements-completed` list, and the `actuals` block are unchanged.*

## Amendment 2026-09-02 (plan 04-13)

*The `D1` `coverage` row in this file is downgraded from an executable claim to a
human-judgment row, on the finding recorded as **gap 3** of `04-VERIFICATION.md`: the
recorded opt-out was described as proof that automatic pageview capture is disabled, when
on the primary path the value re-read is the object this module handed its own stub, and on
the adopted path a foreign global that assigns the options it receives satisfies the check
while remaining free to capture automatically. `D1` now carries `human_judgment: true` with
a rationale, its `description` records only the structural fact its two passing checks do
prove, and both of those checks are kept with their refs and `pass` statuses unchanged.*

*No control flow was changed. The fail-closed gate still holds exactly as shipped: script
insertion and sink creation remain unreachable until `resolveInitializedProvider` returns a
non-null provider, and requiring the recorded value — rather than merely a non-throwing
`init` call — still closes a silent no-op initializer that a throw-only check would accept.
Plan 04-13 edited comments and documentation only, and the full suite passed with every
expectation unedited.*

*The claim `D1` used to make is now carried by a human gate, not by a test: the live
dashboard confirmation recorded as `behavior_unverified_items[0]` in `04-VERIFICATION.md`
and written into `04-USER-SETUP.md` as an unchecked owner-facing item — load the HAOO page
once after production enablement and watch the provider dashboard live view. It is added to
this row as a `manual_procedural` verification entry with status `unknown` because it has
not been performed, and nothing in this repository can perform it.*

*Plan 04-13 also restated the matching prose in `src/measurement/plausible.ts` and in
`src/test/fixtures/plausible-preload-contract.ts`, so the record and the code now say the
same thing. `D2` and `D3`, the remaining `coverage` rows, `requirements-completed`,
`actuals`, `provides`, `tech-stack`, `key-files`, and the `key-decisions` and `patterns`
entries as left by plan 04-12 are unchanged.*
