# Phase 5: Prove the Deployed Journey - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Prove that the **live** funnel works for real visitors: the HAOO journey published at
`www.haoo.online` and the ZERO-PAPER HUB Products entry point at `www.zero-paperhub.com`, across a
named set of viewports and accessibility modes, with production routes and assets resolving on
direct navigation and refresh, every required check green in both repositories, and one uniquely
tagged production qualification submission demonstrably reaching a real mailbox.

This phase produces **evidence and the instruments that produce it**. It does not add product
capability, change copy, change what HAOO does, or re-open a settled Phase 1–04.2 decision. Where
the evidence reveals a defect, fixing that defect is in scope; inventing new surface is not.

**Explicitly out of scope:** new product features, redesigns, a second product, CRM/lead tooling,
and any change to the measurement contract beyond keeping test traffic out of the owner report.

</domain>

<decisions>
## Implementation Decisions

### Phase Home and Repository Arrangement

- **D-01:** **`KaruguDev/HAOO` is the single home for the Phase 5 planning record.** Every plan,
  summary, verification and evidence artifact for this phase is authored into HAOO's `.planning/`.
  This executes the second half of 04.2 D-03, whose trigger — `/gsd-verify-work` sign-off for phase
  04.2 — has already fired.
  — **Reversibility:** costly — once ZPH's `.planning/` is removed, restoring a second tree means
  re-establishing the divergence problem D-03 closed.

- **D-02:** **This CONTEXT.md is written to BOTH trees, then ZPH's `.planning/` is removed as Phase
  5's own first plan.** Nothing is authored into a tree that is about to vanish, and the removal is
  a deliberate, planned act rather than a side effect. **The removal's precondition is the D37
  superset walk RE-RUN at execution time — never a recorded number** (04.2 W-1 amendment, ZPH
  `5dfe9b4`). It must report 0 ZPH-only paths and 0 differing files before the directory is deleted.
  — **Reversibility:** one-way — a deleted planning tree is recoverable only from git history, and
  the point of the removal is that HAOO becomes authoritative.

- **D-03:** **ZERO-PAPER HUB-side evidence is proven in place and recorded in HAOO.** The Products
  journey and the retired-path recovery document are checked against the live `www.zero-paperhub.com`,
  but every plan and evidence file lands in HAOO's `.planning/`. ZPH receives code commits only when
  the evidence surfaces something that actually needs fixing. Consequence named rather than
  mitigated: a ZPH-side regression is caught by HAOO's suite, not by ZPH's own CI.

- **D-04:** **Exactly ONE checkout per repository for the whole phase. No git worktrees.** Carried
  forward from 04.2 (`04.2-split-env.sh`). Two independent reasons: `scripts/verify-tree-disjointness.mjs`
  resolves its sibling as the relative path `../ZERO-PAPERHUB`, and the Phase 4 blocker recorded in
  `STATE.md` — a leftover `.claude/worktrees/rf-03-retry-1788205465/` made Vitest collect every suite
  twice (591 tests instead of ~300) — is precisely the contamination this rule prevents. Phase 5's
  central product is test evidence, so a doubled suite is not a nuisance here; it invalidates the
  output.

### Evidence Instrument

- **D-05:** **Playwright with `@axe-core/playwright` is the instrument for SC1 and SC2.** jsdom
  computes no layout, so horizontal overflow, hidden primary actions, real focus order, computed
  contrast, zoom and reduced-motion behaviour are currently unprovable by either repo's suite. A
  repeatable harness is chosen over a one-time human pass specifically so a later regression is
  caught rather than only today's state being proven.
  — **Reversibility:** costly — adding a browser toolchain to a repo that has none brings CI browser
  binaries and a second test config; removing it later would leave SC1/SC2 unprovable again.

- **D-06:** **Specs run against LIVE production, with the same specs also runnable against a local
  `vite preview` as a CI gate.** The phase is named *Prove the Deployed Journey* and SC3 names direct
  production navigation and refresh — so the evidence run must hit `www.haoo.online`. The local
  target exists so CI can run the specs on every PR without depending on a deploy, which is what
  keeps the guarantee from rotting between releases.

- **D-07:** **The Playwright suite lives in the HAOO repository under its own config and its own npm
  script (e.g. `test:e2e`), NOT folded into `npm test`.** The existing vitest gate stays fast and
  hermetic. This is load-bearing, not stylistic: `npm test` runs `vite build && vitest run`, and
  `src/test/build-output.test.ts` scans the built `dist/` tree — a network-dependent live-site spec
  inside that command would make a hermetic bundle assertion depend on a deploy.

- **D-08:** **HAOO's suite reaches the ZPH Products journey by targeting the live
  `https://www.zero-paperhub.com/` URL. Nothing is installed in the ZERO-PAPER HUB repository.** This
  keeps SPLT-01 clean and adds no entry to the ratified 26-path `shared-scaffold.txt` allowlist —
  04.2 was explicit that an entry is never added because "both halves need it", and a mirrored
  Playwright config would be exactly that.

- **D-09:** **The supported matrix is a closed, named list**, pinned in the phase record and treated
  the way `src/test/focus-contrast.test.ts:27-33` treats its own closed list:
  - Viewports: ~360px, ~390px (mobile), ~768px (tablet), ~1280px, ~1440px (desktop)
  - Engine: Chromium
  - Accessibility modes: 200% zoom, `prefers-reduced-motion`, keyboard-only traversal
  Cross-browser (Firefox/WebKit) was considered and declined for now on run-time cost; see Deferred.

### Mail Delivery and LEAD-07

- **D-10:** **The MX change is a BLOCKING human checkpoint in the phase's first wave.** `dig +short
  MX haoo.online` currently returns nothing; the owner's recorded decision is `mx1.privateemail.com`
  / `mx2.privateemail.com`, DECIDED but NOT EXECUTED. A plan re-runs the `dig` and requires non-empty
  output before any delivery work proceeds. Placed early deliberately: DNS propagation takes real
  time, and surfacing it in wave 1 lets that wait overlap the Playwright work rather than stalling
  the phase at its finish line. An executor may not clear this gate on its own judgment.
  — **Reversibility:** reversible — DNS records can be changed back; nothing downstream is pinned to
  them.

- **D-11:** **Activation and delivery are TWO pieces of evidence, recorded separately, in order.**
  The chain is: MX added → `dig` confirms → FormSubmit activation mail received at
  `info@haoo.online` and confirmed → endpoint state recorded → tagged submission sent. FormSubmit's
  activation confirmation is itself emailed to the very mailbox under test, so collapsing these into
  one pass/fail would report "mail did not arrive" without naming which link broke. LEAD-07 asks for
  activation *and* delivery; this keeps them two claims.

- **D-12:** **The submission carries a timestamped release-verification marker, recorded before
  sending.** It must be unique, findable in the mailbox, and impossible to confuse with a genuine
  enquiry. Exact field and format are the planner's.

- **D-13:** **Proof of arrival is owner-recorded verbatim evidence: the tag, the received timestamp,
  and the destination folder.** Same discipline as 04.2's human verification of the PostHog counts,
  which recorded actual numbers rather than a pass mark. **Spam-folder arrival counts as a pass** —
  the criterion says "inbox or spam folder" — **but is recorded AS spam, never silently normalised
  to "received".**

- **D-14:** **The onboarding recovery paths are proven to RESOLVE, not to DELIVER.** Assert that the
  call, WhatsApp, `mailto:` and `manage.haoo.online` links are present, correctly formed and
  reachable on the live page, including the `noscript` recovery links and the JS-disabled path.
  Placing live calls or WhatsApp messages reaches third-party systems this project does not control
  and cannot cheaply re-run. Note the standing distinction from 04.2: `info@haoo.online` is a
  mailbox and `manage.haoo.online` is a separate host — neither takes the `www.` prefix.

### What Counts As Passing

- **D-15:** **Both repositories must be fully green.** `build`, `typecheck`, `lint`, `vitest`,
  `verify:coverage` and `verify:disjoint` in BOTH `KaruguDev/HAOO` and `KaruguDev/ZERO-PAPERHUB`,
  plus both GitHub Pages deployments concluding success. SC3 does not scope its check list to one
  repository, and the Products journey is genuinely part of the funnel. The gate is enumerated
  explicitly rather than expressed as "CI is green".

- **D-16:** **`npm run test:phase1:red` is resolved inside this phase.** It exits 1 in BOTH
  repositories — a RED gate asserting the Phase 1 suites fail, except they now pass (owner decision
  owed since 04.2, `04.2-DEFERRED-ITEMS.md` D6). Phase 5 cannot honestly claim "all checks pass"
  while a script in both trees exits 1. Retire or invert it **with a recorded rationale, using the
  withdraw-with-a-named-successor discipline** established by 04.1 and D-05 — never by deleting it
  silently.

- **D-17:** **`verify:disjoint` is made runnable in CI**, with the workflow checking out the sibling
  repository so SPLT-01 is enforced on every push rather than only when someone remembers to run it
  locally. SPLT-01 is the 04.2 guarantee most likely to erode silently, and a check that only runs by
  hand is close to no check at all. If the cross-repo checkout proves infeasible (token scope, rate
  limits), the phase records explicitly that SPLT-01 is spot-checked rather than continuously
  enforced — it does not leave the question ambiguous.

- **D-18:** **Four standing blockers must be closed for Phase 5 to pass. Two are closed by work; two
  are BLOCKING HUMAN CHECKPOINTS an executor may not clear on its own judgment.**

  *Closed by work in this phase:*
  1. **The leftover worktree** at `.claude/worktrees/rf-03-retry-1788205465/` — it doubles the Vitest
     collection and directly contaminates the evidence QUAL-05 rests on. Cheap to clear.
  2. **The `04-UI-SPEC.md` contradictions** — the superseded proposed C-1 clause, and the locked
     banned-vocabulary list contradicting its own caveat copy. Already resolved in code by plan
     04-03; the document still needs reconciling to the shipped bytes.

  *Blocking human checkpoints — resolution OR an explicit, recorded acceptance of the risk:*
  3. **The Kenya Data Protection Act 2019 sign-off** (`02-VALIDATION.md:91`) — open, and explicitly
     NOT closed by the owner's approval of the visitor-facing copy. Needs someone with legal
     standing.
  4. **The attacker Let's Encrypt certificate** (D34) — issued 2026-09-03 covering both
     `haoo.online` legs while a third party held the Pages claim, valid to 2026-12-02. Releasing the
     Pages claim does not revoke it, and 04.2 RESEARCH assumption A1 records that GitHub's revocation
     behaviour on a released domain was never confirmed by an authoritative source.

  **Rationale for the checkpoint mechanism** (same as 04.2 D-09): neither of these two can be
  resolved by this phase's own work. Phase 5 closes on a decision having been *made and recorded*,
  not on the risk having vanished. An executor writing "accepted" without the owner's words is the
  failure this gate exists to prevent.

### Claude's Discretion

Downstream agents retain discretion over: Playwright config shape, spec file organisation and
naming; the exact axe rule set and which violations are treated as failures versus recorded;
how live-vs-local targets are parameterised; the tag field and format under D-12; the shape of the
`test:phase1:red` successor under D-16; the CI mechanism for the sibling checkout under D-17; and
the wave ordering — provided D-01 through D-18 hold and the four ROADMAP success criteria are met.

**One open question deliberately left to planning:** automated Playwright traffic against live
production will generate PostHog events, and 04.2 D41 already records the owner report's counts as
*a floor, not a census*. Test traffic must not silently inflate that report. Whether that is handled
by running the live evidence pass with measurement suppressed, by a HogQL exclusion, by a documented
run window, or by an explicit note in the report is the planner's to decide — but it must be decided,
not discovered. Note the existing precedent: every owner-report query is already bounded at
`HAOO_DOMAIN_CUTOVER_DAY` for exactly this class of reason.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase contract
- `.planning/ROADMAP.md` §"Phase 5: Prove the Deployed Journey" — the four success criteria this
  phase is measured against, and its `**UI hint**: yes`
- `.planning/ROADMAP.md` §"Phase 04.2" → **Post-verification follow-up** — the ZPH planning-directory
  removal item D-02 executes, including the W-1 amendment that makes the walk (not a number) the
  precondition
- `.planning/REQUIREMENTS.md` — LEAD-07, QUAL-01, QUAL-02, QUAL-03, QUAL-05 (all currently `[ ]`,
  all mapped to Phase 5)
- `.planning/REQUIREMENTS.md:250` — the mail-routing row: DECIDED, NOT EXECUTED, owner-owned,
  Phase 5 / LEAD-07

### The arrangement being proven
- `.planning/phases/04.2-.../04.2-SPLIT-CONTRACT.md` §Domain → **Decision (a) reversal** —
  `www.haoo.online` is canonical, the apex 301-redirects, and the three things the reversal does NOT
  change (`info@haoo.online` is a mailbox; `manage.haoo.online` is a separate host; no DNS record
  changed)
- `.planning/phases/04.2-.../04.2-SPLIT-CONTRACT.md` §Retired path — the meta-refresh recovery
  document at `/products/haoo/`; GitHub Pages emits no path-level 301
- `.planning/phases/04.2-.../04.2-SPLIT-CONTRACT.md` §"The rule, unchanged" — the closed 26-entry
  `shared-scaffold.txt` allowlist and its two admission grounds. **D-08 depends on not adding to it.**
- `.planning/phases/04.2-.../04.2-CONTEXT.md` — D-01..D-12, the decisions the deployed arrangement
  rests on

### Open items this phase inherits
- `.planning/phases/04.2-.../04.2-VERIFICATION.md` §"Human Verification Outcome" — items 1–3
  RESOLVED, **item 4 (MX records) STILL OPEN and deliberately so**; and §"Standing limits" for the
  D41 undercount that D-18's open question must not worsen
- `.planning/phases/02-.../02-VALIDATION.md:91` — the open Kenya DPA 2019 sign-off (D-18 item 3)
- `.planning/phases/04.2-.../04.2-DEFERRED-ITEMS.md` §D6 — the `test:phase1:red` owner decision
  D-16 closes; §D37 — the superset walk D-02's removal depends on
- `.planning/STATE.md` §Blockers/Concerns — the leftover-worktree entry, the D34 certificate entry,
  and the `04-UI-SPEC.md` contradiction entries named in D-18

### Code and tooling
- `../HAOO/package.json` — the six scripts D-15 enumerates; note `verify:disjoint` hardcodes the
  sibling path `../ZERO-PAPERHUB` (D-04, D-17)
- `../HAOO/scripts/verify-tree-disjointness.mjs` — its header states why `.planning/` is excluded
  from the intersection, which is why D-01/D-02 are not a separation violation
- `../HAOO/src/test/build-output.test.ts` — scans built `dist/`; the reason D-07 keeps the e2e suite
  out of `npm test`
- `../HAOO/src/test/focus-contrast.test.ts:27-33` — the closed-list discipline D-09 follows
- `../HAOO/src/components/` — `BrochurePanel`, `QualifyForm`, `QualifyFallback`,
  `OnboardingChoices`, `ProductHeader`, `MeasurementDisclosure`: the surfaces SC2 traverses
- `src/test/products-section.test.tsx` (ZPH) — the Products-card assertions D-03/D-08 exercise live

**Caveat, unchanged from 04.2:** `.planning/codebase/STRUCTURE.md` and `INTEGRATIONS.md` are stale —
pinned at commit `7a99cab`, still describing Plausible as the measurement provider, and written
before the repository split. Read the live trees, or refresh with `/gsd-map-codebase`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Nothing in either repo can prove SC1 or SC2 today.** Both suites are jsdom + vitest only —
  no Playwright, no axe, no real-viewport tooling in either `package.json`. This is the single
  largest build item in the phase, and D-05 accepts it deliberately.
- **Accessibility affordances already exist in source** and need proving, not writing: `aria-*`,
  `tabIndex`, focus-visible and reduced-motion handling appear across `ProductPage.tsx`,
  `BrochurePanel`, `QualifyForm`, `QualifyFallback`, `OnboardingChoices`, `ProductHeader` and
  `MeasurementDisclosure`.
- **`src/test/focus-contrast.test.ts` exists in BOTH repos** — a ratified divergent-content
  collision on the shared-scaffold list. It already encodes contrast expectations the axe pass
  should agree with rather than contradict.
- **The measurement path is live and confirmed capturing** (04.2 human verification, 2026-09-07:
  five `POST /e/` at 200, six non-zero report counts). Test traffic will land in it — see the open
  question in Claude's Discretion.

### Established Patterns
- **Withdraw with a named successor, never delete.** 04.1 → 04.2 D-05. Governs D-16's disposal of
  `test:phase1:red`.
- **Closed lists, with the reason for each entry.** `focus-contrast.test.ts:27-33` and the 26-entry
  scaffold allowlist. Governs D-09's matrix.
- **Record measured values, not pass marks.** 04.2's human verification recorded the four zeros
  alongside the six ones precisely because that distinguishes what happened from what did not.
  Governs D-13.
- **Blocking human checkpoints for anything an executor cannot honestly judge.** 04.2 D-09.
  Governs D-10 and D-18.
- **Stale-by-construction preconditions are re-measured, never cited.** The 04.2 W-1 amendment.
  Governs D-02.

### Integration Points
- `verify:disjoint` couples the two working trees by relative path — D-04 and D-17 both turn on it.
- The GitHub Pages deploy workflow in each repo is the "required deployed check" of D-15.
- The retired `/products/haoo/` recovery document is a ZPH artifact asserting a HAOO URL — the one
  place SC3's navigation criterion spans both repositories.

</code_context>

<specifics>
## Specific Ideas

- **"Prove the deployed journey" is meant literally.** The evidence run hits the real hosts. The
  local `vite preview` target exists so the specs keep running afterwards, not as a substitute for
  the live pass.
- **The mail chain is three links, not one**, and the phase is expected to say which link broke:
  MX → activation → delivery.
- **Spam is a pass, recorded as spam.** The roadmap criterion says "inbox or spam folder"; the record
  says which.
- **Phase 5 is 04.2's acceptance test**, as 04.2's own CONTEXT.md anticipated: the split was
  sequenced first so Phase 5's evidence would be spent on the arrangement that ships permanently.
- **Four blockers close here, and two of them close by owner decision rather than by code.** The
  phase is allowed to record an accepted risk; it is not allowed to record one the owner did not
  state.

</specifics>

<deferred>
## Deferred Ideas

- **Cross-browser evidence (Firefox, WebKit).** Considered in D-09 and declined on run-time cost.
  Real value for a public marketing site — revisit once the Chromium matrix is stable and green.
- **Deliverability hardening (SPF/DKIM/DMARC) for the HAOO sending path.** Out of scope: LEAD-07
  asks only that the message arrives in inbox *or* spam. If D-13 records a spam landing, this
  becomes the obvious next item.
- **Certificate-transparency monitoring for the `haoo.online` zone.** D34 surfaced the attacker
  certificate once; nothing currently watches for a second one.
- **Visual regression / screenshot baselines.** A natural extension of the Playwright harness D-05
  introduces, but not needed to satisfy any Phase 5 criterion.
- **A drift check between the ZPH Products card copy and HAOO's own copy.** Named as an accepted
  cost in 04.2 D-06 and still unsolved; D-08's live-URL specs make the cheap half (link resolution)
  nearly free, but the copy-agreement half stays deferred.
- **Refreshing `.planning/codebase/` maps.** Stale at `7a99cab` and now also pre-split. Carried
  forward from 04.2, still owed.

</deferred>

---

*Phase: 05-prove-the-deployed-journey*
*Context gathered: 2026-09-07*
