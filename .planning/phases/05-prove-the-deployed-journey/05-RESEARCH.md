# Phase 5: Prove the Deployed Journey - Research

**Researched:** 2026-09-07
**Domain:** Live-site accessibility/layout evidence (Playwright + axe-core), cross-repository CI gating, DNS/mail-delivery proof
**Confidence:** HIGH for in-repo and live-system measurements; MEDIUM for third-party tooling APIs; see Assumptions Log for the four LOW items.

> **Reading note on provenance.** Every `[VERIFIED: …]` tag below cites a file path with a line
> range that was opened and read **in this session** and whose values are quoted **verbatim**
> beside the claim, or a live network measurement taken in this session with the command shown.
> Files were opened with `cat`/`sed -n 'A,Bp'` under the session's Bash-first directive — a range
> read of the source of truth, never a `grep` hit standing alone. Third-party API facts are
> `[CITED: url]`. Anything from training memory is `[ASSUMED]` and appears in the Assumptions Log.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase Home and Repository Arrangement**

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

**Evidence Instrument**

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

**Mail Delivery and LEAD-07**

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

**What Counts As Passing**

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

### Deferred Ideas (OUT OF SCOPE)

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

Additionally deferred by the UI-SPEC's **D-OQ-3** (owner, 2026-09-07), inherited by a future
ZERO-PAPER HUB phase and **not** to be fixed here: **F4** (contact-form focus ring `green-400`
≈1.74:1, a live WCAG 2.2 SC 1.4.11 failure), **F4b** (`App.tsx` absent from ZPH's `FOCUS_SOURCES`),
**F5** (no `<main>` landmark, no skip link on the ZPH home), **F6** (no reduced-motion handling
anywhere in ZPH).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **LEAD-07** | Release verification proves the HAOO form endpoint is activated and a uniquely tagged production submission reaches the HAOO inbox or spam folder | § Mail Chain — the endpoint is `https://formsubmit.co/ajax/info@haoo.online` confirmed in the **live** bundle; MX is confirmed **still empty today**; FormSubmit's first-submission activation flow is documented; § Pitfall 9 names the ordering trap |
| **QUAL-01** | Visitor can use the Products and HAOO journeys at supported mobile and desktop widths without horizontal overflow or hidden primary actions | § Standard Stack (Playwright 1.63.0 Chromium, five viewports), § Pitfall 3 (`overflow-x-hidden` mask), § Code Example 2 (per-element bounding-box sweep), UI-SPEC VC-1/VC-2 |
| **QUAL-02** | Visitor can navigate product content, brochure controls, form fields, validation messages, and onboarding links by keyboard with visible focus | § Code Example 3 (keyboard-only `:focus-visible` capture), § Don't Hand-Roll (axe owns names/roles, the spec owns paint), UI-SPEC KF-1..KF-5 |
| **QUAL-03** | HAOO page preserves semantic heading order, descriptive link and control names, zoom support, reduced-motion behavior, and an HTML equivalent for brochure information | **§ Pitfall 1 — `heading-order` is a `best-practice` rule in axe-core 4.13 and is therefore NOT run under the UI-SPEC's tag list.** Heading order must be asserted by the spec directly or `heading-order` added via `withRules`. Also § Pitfall 2 (200% ≠ SC 1.4.10), § Code Example 4 (PDF-abort equivalence) |
| **QUAL-05** | Build, typecheck, lint, automated contract/component tests, and required deployed manual checks pass before launch | § Environment Availability — all 11 gates measured this session; **10 green, 1 red** (`test:phase1:red` exits 1 in both repos, which D-16 resolves). § Pitfall 5 (new code escapes typecheck), § Pitfall 6 (new specs get swallowed by Vitest) |
</phase_requirements>

---

## Summary

This phase installs a browser-based evidence instrument into a repository that has never had one, and
uses it to make four claims about two live public websites. Almost all of the *risk* is not in
Playwright — Playwright and `@axe-core/playwright` are enormous, stable, first-party-maintained
packages, and the UI-SPEC has already done the hard design work of specifying assertions that cannot
pass vacuously. The risk is in five places the UI-SPEC could not see: (1) axe-core's tag taxonomy
does not check the one thing QUAL-03 names most explicitly; (2) HAOO's `tsconfig.app.json` includes
only `src`, so every line of new Playwright code would silently escape `npm run typecheck`, which is
itself one of D-15's six enumerated gates; (3) Vitest's default `include` glob *does* collect
`e2e/**/*.spec.ts`, so a conventionally-named Playwright suite lands inside `npm test` and breaks
D-07 by construction — measured empirically this session, not reasoned about; (4) the PostHog
open question left to the planner is very probably already answered by the shipped configuration;
and (5) the mail chain's first link is still broken right now.

Two measurements taken this session change the shape of the plan. First, **`dig +short MX haoo.online`
returns empty from both the local resolver and `8.8.8.8`** — D-10's blocking checkpoint is genuinely
open, and because FormSubmit's activation mail is sent to the very mailbox under test, *nothing* in
the LEAD-07 chain can proceed until DNS is in place and propagated. Second, **the certificate
`www.haoo.online` serves today is still the D34 attacker-era certificate** (serial
`0609A5171B8224FD0D181CCBEC9CC50E7CC1`, `notBefore=Sep 3 07:14:32 2026 GMT`,
`notAfter=Dec 2 07:14:31 2026 GMT`) — four days after the reclaim, GitHub Pages has not rotated it.
That is a hard number for D-18's checkpoint 4, and it means the checkpoint is about a live artefact,
not a historical one.

Two of D-18's four blockers are in better shape than STATE.md suggests. The leftover worktree is
**gone** — `git worktree list` reports one entry per repo, `find` locates no `worktrees` directory
in either tree, and `vitest.config.ts` in *both* repos already excludes `.claude/**` and `.gsd/**`.
HAOO's suite collects 683 tests across 10 files with no doubling. And the D37 superset walk, re-run
this session over 247 files, reports **0 ZPH-only and 0 differing** — D-02's precondition holds as of
this moment, though it must be re-run at execution time, and note that *this very file*, written into
ZPH, becomes a ZPH-only path unless mirrored to HAOO (it has been).

**Primary recommendation:** Install `@playwright/test@1.63.0` + `@axe-core/playwright@4.13.0` in HAOO
only, put the specs in `e2e/` named `*.e2e.ts` (never `*.spec.ts`), add a third TypeScript project
`tsconfig.e2e.json` wired into `npm run typecheck`, parameterise live-vs-preview with two Playwright
`projects` sharing one spec set, add `heading-order` explicitly via `withRules` alongside
`withTags`, and sequence the phase so the MX checkpoint fires in wave 1 while the harness is built
in parallel.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Viewport / overflow / hit-target measurement (SC1) | **Browser (real Chromium)** | — | Requires computed layout; jsdom has none. Cannot be delegated to a static source read |
| Focus order, `:focus-visible` paint, keyboard traversal (SC2) | **Browser (real Chromium)** | Static source test | The *ratio* stays owned by `src/test/focus-contrast.test.ts`; only *is an indicator painted* moves to the browser (UI-SPEC KF-0) |
| Rule-based a11y scanning (names, roles, labels, contrast) | **axe-core in the page** | — | Injected by `@axe-core/playwright`; runs inside the browser context |
| Semantic heading *order* | **Spec-authored assertion** | axe (only if `heading-order` explicitly added) | See Pitfall 1 — the rule is `best-practice`-tagged and excluded by the UI-SPEC's tag list |
| Link/asset reachability (`manage.haoo.online`, brochure PDF) | **Playwright `APIRequestContext`** | — | An out-of-band HTTP request, not a navigation; `maxRedirects: 0` keeps a 3xx visible |
| Static-document contract on S4 (script count, canonical, refresh target) | **Both** — `src/test/build-output.test.ts` (built tree) and a live spec (deployed doc) | — | The built-tree assertion already exists; the live spec extends the same equality discipline to the deployed bytes |
| Repository separation enforcement (SPLT-01) | **CI job in HAOO** | Local `npm run verify:disjoint` | D-17. Needs a second checkout at a path the script can resolve |
| Mail activation + delivery (LEAD-07) | **DNS + third-party (FormSubmit) + human mailbox** | — | No browser or CI can observe this. Three separate evidence records (D-11), the last one owner-recorded verbatim (D-13) |
| Test-traffic suppression in measurement | **Client SDK (already configured)** | Report query (HogQL) as fallback | See Finding M-1 — `posthog-js` drops bot events, and Playwright is a bot by `navigator.webdriver` |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | **1.63.0** | Real-browser test runner: viewports, keyboard, media emulation, network routing, API requests | First-party Microsoft, 54.4M downloads/week, first published 2020-09-24. The only mainstream runner that gives `reducedMotion`, `javaScriptEnabled` and `route.fulfill` as first-class config rather than plugins. `[VERIFIED: npm registry — but see Package Legitimacy Audit; discovered from CONTEXT.md D-05, confirmed at playwright.dev]` |
| `@axe-core/playwright` | **4.13.0** | Injects axe-core into every frame and returns a structured violation set | Deque's own binding, 9.1M downloads/week, first published 2021-06-02. Version tracks axe-core's major.minor (4.13.0 → `axe-core ~4.13.0` as a direct dependency) `[VERIFIED: dequelabs/axe-core-npm packages/playwright/README.md, read via gh API this session]` |
| `axe-core` | **4.13.0** (transitive) | The rule engine itself | Pulled in by `@axe-core/playwright` as `dependencies = { 'axe-core': '~4.13.0' }` — do **not** add a second direct dependency and risk a version split `[VERIFIED: npm view @axe-core/playwright@4.13.0 dependencies]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `playwright-core` | transitive | Peer of `@axe-core/playwright` (`peerDependencies = { 'playwright-core': '>= 1.0.0' }`) | Satisfied automatically by `@playwright/test`; no direct install `[VERIFIED: npm view @axe-core/playwright@4.13.0 peerDependencies]` |
| Chromium browser binary | shipped with 1.63.0 | The engine D-09 pins | `npx playwright install --with-deps chromium` — one engine, not all three. Firefox/WebKit are Deferred |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@playwright/test` | Cypress + `cypress-axe` | Cypress cannot disable JavaScript in the page (needed for S2/S4) and has no `APIRequestContext` equivalent with `maxRedirects: 0`. Rejected |
| `@axe-core/playwright` | Raw `axe-core` + `page.addScriptTag` | You would hand-roll frame injection and result aggregation — exactly the "Don't Hand-Roll" case. Rejected |
| `@playwright/test` | Puppeteer + `@axe-core/puppeteer` | No test runner, no `projects`/`baseURL` parameterisation (D-06 needs both), no built-in HTML report for the evidence artefact. Rejected |
| Chromium `deviceScaleFactor: 2` for zoom | Halved CSS viewport | `deviceScaleFactor` "can be thought of as dpr" — it scales *rendering*, not *layout*, so reflow would not be exercised at all. The UI-SPEC already rejects it; the docs confirm why `[CITED: playwright.dev/docs/api/class-testoptions]` |

**Installation (HAOO repository only — D-08):**

```bash
cd ../HAOO
npm install --save-dev @playwright/test@1.63.0 @axe-core/playwright@4.13.0
npx playwright install --with-deps chromium
```

**Version verification performed this session:**

```
$ npm view @playwright/test version time.created   → 1.63.0   2020-09-24T05:44:34.469Z
$ npm view @axe-core/playwright version time.created → 4.13.0 2021-06-02T15:18:16.053Z
$ npm view axe-core version                        → 4.13.0
```

Pin exact versions rather than carets. `@playwright/test` publishes `1.64.0-alpha-*` builds daily and
`@axe-core/playwright` publishes `4.13.1-<sha>` prereleases; a caret is safe against those (npm does
not resolve prereleases by default) but an exact pin makes the evidence reproducible, which is this
phase's entire product.

---

## Package Legitimacy Audit

| Package | Registry | Age (first publish) | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|---------------------|-----------|-------------|---------|-------------|
| `@playwright/test` | npm | ~6 yrs (2020-09-24) | 54,399,047 / week | `github.com/microsoft/playwright` | **SUS** *(seam)* → **OK** *(adjudicated)* | Approved — see note |
| `@axe-core/playwright` | npm | ~5 yrs (2021-06-02) | 9,082,376 / week | `github.com/dequelabs/axe-core-npm` | **SUS** *(seam)* → **OK** *(adjudicated)* | Approved — see note |
| `axe-core` | npm | transitive | — | `github.com/dequelabs/axe-core` | not separately queried | Transitive only; pinned by `~4.13.0` |

**Why both read SUS, and why the verdict is adjudicated to OK.** `gsd-tools query package-legitimacy
check` returned `"reasons": ["too-new"]` for both. Inspecting the returned `signals` shows the seam
read `publishedAt` as the **latest version's** publish date (`2026-09-04` and `2026-08-11`
respectively), not the package's first publish. `npm view <pkg> time.created` gives 2020-09-24 and
2021-06-02. Both carry weekly download counts in the tens of millions, both resolve to first-party
vendor monorepos (Microsoft; Deque Labs), neither is deprecated, and `npm view <pkg> scripts` shows
**no `postinstall`** on either. The `too-new` signal is a seam artefact on fast-releasing packages,
not a slopsquatting signal.

Both packages were **named by the owner in CONTEXT.md D-05**, not discovered by a search, and both
were confirmed against their vendors' own documentation this session (playwright.dev;
`dequelabs/axe-core-npm` README fetched through the GitHub API). They are therefore
`[VERIFIED: npm registry]` under the package-name provenance rule.

**Note for the planner:** `npm view @axe-core/playwright scripts` shows a `prepare` script
(`npx playwright install && npm run build`). `prepare` runs on git-dependency and local installs, not
on a published-tarball install, so `npm install @axe-core/playwright@4.13.0` will **not** trigger a
browser download from it. Do not install it from a git URL. `[VERIFIED: npm view @axe-core/playwright scripts]`

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `@playwright/test`, `@axe-core/playwright` — flagged by the
seam, adjudicated OK above with evidence. The planner may treat the audit as satisfied without a
`checkpoint:human-verify`; if house policy requires one anyway, one checkpoint covering both installs
is sufficient.

---

## Architecture Patterns

### System Architecture Diagram

```
                         ┌───────────────────────────────────────────┐
                         │  Phase 5 evidence run (HAOO repo only)    │
                         └───────────────────────────────────────────┘
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              │                             │                             │
      PROJECT "live"                PROJECT "preview"            OUT-OF-BAND (no browser)
      baseURL = https://            baseURL = http://              ┌──────────────────┐
      www.haoo.online               localhost:4173                 │ dig +short MX    │──► D-10 gate
              │                     (webServer: vite preview)      │ haoo.online      │
              │                             │                      └──────────────────┘
              ▼                             ▼                                │
   ┌──────────────────────┐     ┌──────────────────────┐                     ▼
   │ SHARED SPEC SET      │     │ SAME SPEC SET        │           ┌──────────────────────┐
   │  e2e/*.e2e.ts        │◄────┤ + destructive form   │           │ FormSubmit           │
   └──────────┬───────────┘     │   states (FS-0)      │           │ activation mail      │──► D-11 #1
              │                 └──────────────────────┘           │ → info@haoo.online   │
              │                                                    └──────────┬───────────┘
   ┌──────────┴────────────────────────────────┐                              │
   │                                           │                              ▼
   ▼                     ▼                     ▼                   ┌──────────────────────┐
┌────────┐         ┌───────────┐        ┌─────────────┐            │ ONE tagged live      │
│ Layout │         │ Keyboard  │        │ axe-core    │            │ submission (D-12)    │──► D-11 #2
│ sweep  │         │ traversal │        │ AxeBuilder  │            │ → owner reads mailbox│
│ VC-1..3│         │ KF-1..5   │        │ per surface │            │   verbatim (D-13)    │
└───┬────┘         └─────┬─────┘        └──────┬──────┘            └──────────────────────┘
    │                    │                     │
    └────────────────────┴─────────────────────┘
                         │
                         ▼
      ┌───────────────────────────────────────────┐
      │ Evidence file in HAOO/.planning/ (D-01)   │
      │  measured values, not pass marks (D-13)   │
      └───────────────────────────────────────────┘

  Surfaces reached by the shared spec set:
    S1 www.haoo.online/                        (JS on)
    S2 www.haoo.online/                        (javaScriptEnabled: false — different DOM)
    S3 www.zero-paperhub.com/#products         (axe scoped via .include('#products'))
    S4 www.zero-paperhub.com/products/haoo/    (meta-refresh neutralised via route.fulfill)
    S5 localhost preview mirror of S1          (only target permitted destructive form states)

  Separate CI job, HAOO repo (D-17):
    git clone --depth 1 <ZPH> ../ZERO-PAPERHUB  →  npm run verify:disjoint
```

### Recommended Project Structure (HAOO repository)

```
HAOO/
├── playwright.config.ts     # NEW — projects: live | preview; testDir './e2e'
├── tsconfig.e2e.json        # NEW — the only thing that puts e2e/ under `npm run typecheck`
├── tsconfig.json            # EDIT — add { "path": "./tsconfig.e2e.json" } to references
├── package.json             # EDIT — devDeps + `test:e2e`, `test:e2e:live` scripts
├── e2e/                     # NEW — *.e2e.ts ONLY. Never *.spec.ts (see Pitfall 6)
│   ├── fixtures/
│   │   ├── surfaces.ts      # closed list S1..S5, one reason per entry (house pattern)
│   │   ├── primary-actions.ts # closed list P1..P13 from UI-SPEC § Primary Actions
│   │   └── axe.ts           # one AxeBuilder factory: tags + heading-order + per-URL disables
│   ├── viewport.e2e.ts      # VC-1, VC-2, VC-3
│   ├── keyboard.e2e.ts      # KF-1..KF-5
│   ├── semantics.e2e.ts     # SS-1..SS-4
│   ├── zoom-motion.e2e.ts   # ZM-1, ZM-2
│   ├── recovery.e2e.ts      # D-14 resolution contract, S2 noscript, S4 document
│   └── form-states.e2e.ts   # FS-0..FS-3 — preview project only
└── .github/workflows/
    ├── deploy.yml           # unchanged shape; it is a shared-scaffold entry
    └── verify-split.yml     # NEW — D-17 sibling checkout + verify:disjoint
```

### Pattern 1: Two projects, one spec set, one `webServer`

**What:** Express D-06's live-vs-preview duality as two Playwright `projects` sharing `testDir`.
**When to use:** Every spec that is not surface-specific. Guard preview-only specs with the project name.

```ts
// Source: https://playwright.dev/docs/test-projects  +  https://playwright.dev/docs/test-webserver
import { defineConfig, devices } from '@playwright/test';

const VIEWPORTS = [360, 390, 768, 1280, 1440] as const;   // D-09, closed list

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',          // MUST be set — the default is **/*.@(spec|test).?(c|m)[jt]s?(x)
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }], ['json', { outputFile: 'evidence/axe-run.json' }]],
  projects: [
    { name: 'live',    use: { ...devices['Desktop Chrome'], baseURL: 'https://www.haoo.online' } },
    { name: 'preview', use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4173' } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

> **`webServer` is config-level, not project-level.** Running `--project=live` still starts the
> preview server. Two ways out, both acceptable: (a) accept the ~2s cost, or (b) make the command
> conditional. Do not invent a third. `[CITED: playwright.dev/docs/test-webserver]`

### Pattern 2: Neutralise the S4 meta refresh by rewriting the document, not by racing it

**What:** `javaScriptEnabled: false` does **not** stop a `<meta http-equiv="refresh">` — meta refresh
is an HTML parser behaviour, not script. At `content="0"` there is no window to assert in. Intercept
the document response and strip the tag.
**When to use:** S4's "refresh neutralised" pass (UI-SPEC § Retired-Path, E6 row).

```ts
// Source: https://playwright.dev/docs/api/class-route (route.fetch + route.fulfill)
await page.route('**/products/haoo/', async (route) => {
  const response = await route.fetch();
  const html = await response.text();
  await route.fulfill({
    response,
    body: html.replace(/<meta\s+http-equiv=["']refresh["'][^>]*>/i, ''),
  });
});
```

Record this as a **modified-page measurement**, exactly as VC-1c is recorded — never conflated with
the unmodified pass. The unmodified pass (refresh permitted) is a *separate* assertion: the browser
must land on `https://www.haoo.online/` with S1's `<h1>` present.

### Pattern 3: Reachability without navigation

```ts
// Source: https://playwright.dev/docs/api/class-apirequestcontext
const res = await request.get('https://manage.haoo.online/', {
  maxRedirects: 0,          // "Pass 0 to not follow redirects."
  failOnStatusCode: false,  // default — the status is DATA, not a failure
  timeout: 20_000,
});
evidence.record('manage.haoo.online', { status: res.status(), location: res.headers()['location'] ?? null });
expect(res.status()).toBeLessThan(400);
```

### Pattern 4: One AxeBuilder factory, tags + rules + per-URL disables

```ts
// Source: dequelabs/axe-core-npm packages/playwright/README.md
import { AxeBuilder } from '@axe-core/playwright';   // NAMED export, not default

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const;

export function axeFor(page: Page, surface: SurfaceId) {
  let b = new AxeBuilder({ page })
    .withTags([...TAGS])
    .withRules(['heading-order']);        // see Pitfall 1 — best-practice, so tags alone miss it
  if (surface === 'S3') b = b.include('#products');           // D-OQ-3 expressed mechanically
  if (surface === 'S4') b = b.disableRules(['page-has-heading-one', 'landmark-one-main', 'region']);
  return b;
}
```

> **`withRules` also replaces the rule set on some code paths.** The README states
> `options()` overrides `withRules`/`withTags`, and that "Subsequent calls to `AxeBuilder#options`,
> `AxeBuilder#withRules` or `AxeBuilder#withRules` will override specified options." Verify the
> combined `withTags(...).withRules(['heading-order'])` behaviour with a one-shot smoke run before
> relying on it; if it narrows the run to only `heading-order`, express the whole set through a
> single `.options({ runOnly: { type: 'tag', values: TAGS } })` plus an explicit second
> heading-order assertion in the spec. **Never call `.options()` and `.withTags()` on the same
> builder.** `[VERIFIED: dequelabs/axe-core-npm packages/playwright/README.md]`

### Anti-Patterns to Avoid

- **Naming specs `*.spec.ts`.** Measured this session: Vitest collects `e2e/probe.spec.ts` (683 → 684
  tests) and does **not** collect `e2e/probe2.e2e.ts`. A `*.spec.ts` file importing `@playwright/test`
  inside `npm test` breaks D-07 and the run.
- **A single `scrollWidth > clientWidth` overflow check.** The UI-SPEC calls this "a *non*-assertion
  wearing the costume of one" and it is right — both roots carry `overflow-x-hidden`.
- **`element.focus()` for `:focus-visible` assertions.** Modality-dependent; measures a state the
  visitor never sees. Use `page.keyboard.press('Tab')`. (KF-5's script-focus targets are the one
  deliberate exception, and they use modality-independent `focus:` variants.)
- **Asserting accessible names are unique.** P4–P8 render three times with byte-identical names. The
  rule is *identical name ⇒ identical `href`*.
- **Asserting "exactly five links" in the `noscript` DOM.** Measured this session: there are **eight
  anchors across two `<section>` elements** — five distinct destinations in the first, three repeats
  with different names in the second. See § Pitfall 7.
- **Comparing raw `getAttribute('href')` strings across S1's three brochure references.** The `<head>`
  `rel="alternate"` href is relative (`/brochure/HAOO-Marketing-Brochure.pdf`). Compare resolved
  `.href` values, or resolve both against the document base.
- **Adding an above-the-fold assertion "to be safe".** D-OQ-2 settled this: reachable, not
  above-the-fold. It would fail correct, owner-accepted screens.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WCAG rule evaluation (names, roles, labels, contrast, ARIA validity) | A custom DOM walker | `@axe-core/playwright` | ~100 rules with ACT-mapped implementations, per-node targets and impact ratings; the contrast check alone handles alpha compositing, gradients and text-shadow |
| Injecting the scanner into every frame and merging results | `page.addScriptTag` + manual aggregation | `AxeBuilder#analyze()` | Cross-frame aggregation is the package's stated purpose ("automatically injects into all frames") |
| Starting/stopping the preview server around the run | A shell wrapper with `sleep` | Playwright `webServer` | Handles readiness polling on `url`, `reuseExistingServer`, graceful shutdown, and pipes stdout |
| Reduced-motion / colour-scheme emulation | Injecting a stylesheet that fakes the media query | `use: { reducedMotion: 'reduce' }` | Emulates the media *feature* at the browser level, so `motion-reduce:` Tailwind variants and CSS `@media` both respond as they would for a real visitor |
| Following/not-following redirects on the reachability probe | `fetch` + manual `Location` chasing | `request.get(url, { maxRedirects: 0 })` | Documented, and it keeps the `Location` header available to record verbatim |
| Retrying flaky live-network specs | A hand-rolled retry loop | `retries` per project | Set `retries: 2` on `live` and `0` on `preview`, mirroring the docs' own staging/production example — a live-network flake is not a defect, a hermetic flake is |
| Detecting and excluding automated traffic in analytics | A custom query-param kill switch on the live page | The shipped `posthog-js` bot filter | See Finding M-1 — it is already active and already drops `navigator.webdriver` traffic. Adding a kill switch would change shipped production code in a phase whose boundary forbids it |

**Key insight:** every hand-rolled substitute here fails in the same direction — it produces a green
result that proves less than it appears to. This phase's deliverable *is* the credibility of its
green marks, so the bar for writing a bespoke check is: could the library have been wrong in a way
that matters? For the seven rows above, no.

---

## Runtime State Inventory

This phase renames nothing, but it *removes* a directory, *changes DNS*, and *activates a
third-party endpoint*. The same discipline applies: what state exists outside the repositories that
the plans must account for?

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | **None in a database.** Neither product has a datastore. The only persisted state is a bounded, self-expiring browser record (`persistence: 'memory'`, `disable_persistence: true` in `POSTHOG_LOCKDOWN`), plus the *stranded* browser record at the retired `zero-paperhub.com` origin — already **ACCEPTED AND RECORDED** by owner decision (D25). **Verified by reading `src/measurement/posthog-lockdown.ts:91-129`.** | None. Do not re-open D25 |
| **Live service config** | (a) **DNS zone for `haoo.online`** — MX records **absent right now**; A records are the four GitHub Pages IPs `185.199.108.153`/`109.153`/`110.153`/`111.153`. (b) **FormSubmit endpoint state** for `info@haoo.online` — activation is server-side at formsubmit.co, invisible to both repositories. (c) **PostHog project config** at `us.i.posthog.com`. (d) **GitHub Pages custom-domain verification** for both domains (TXT challenges, recorded resolved 2026-09-05) | (a) owner adds `mx1.privateemail.com` / `mx2.privateemail.com`; re-`dig` at execution time (D-10). (b) owner clicks the activation link in the mailbox (D-11). (c) no change. (d) no change |
| **OS-registered state** | **None — verified.** `git worktree list` returns exactly one entry per repository. `find . ../HAOO -maxdepth 4 -name worktrees` finds nothing. No scheduler, pm2 or systemd artefact is referenced anywhere in either tree | None. **STATE.md's leftover-worktree blocker is already clear** — D-18 item 1 closes on a re-measurement, not on a deletion |
| **Secrets / env vars** | GitHub Actions **repository variables** on `KaruguDev/HAOO`: `VITE_HAOO_MEASUREMENT_PROVIDER`, `VITE_HAOO_POSTHOG_TOKEN`, `VITE_HAOO_POSTHOG_API_HOST`, `VITE_HAOO_FORM_ENDPOINT`. Measured from the **live bundle**: the PostHog provider IS selected (`https://us.i.posthog.com` appears in `/assets/haoo-DGFKBCjE.js`) and `VITE_HAOO_FORM_ENDPOINT` is **unset**, so the endpoint falls back to `https://formsubmit.co/ajax/info@haoo.online` — the intended production behaviour per `deploy.yml`'s own comment. `POSTHOG_QUERY_API_KEY` / `POSTHOG_PROJECT_ID` are deliberately local-only | None for Phase 5. Do not add a `VITE_*` variable for the e2e harness — `build-output.test.ts` asserts the browser-prefixed variable set |
| **Build artifacts / installed packages** | `HAOO/dist/` and `ZERO-PAPERHUB/dist/` exist locally and are rebuilt by `npm test`. Installing Playwright adds a **Chromium binary under `~/.cache/ms-playwright`** — outside both repos, gitignored by construction, and a fresh CI download on every run unless cached | Add the browser install step to any new workflow (§ Pattern, CI). Consider `actions/cache` on `~/.cache/ms-playwright` keyed on the Playwright version |
| **Planning tree (this phase's own destructive act)** | D37 walk re-run this session: **247 files compared, 0 ZPH-only, 0 differing**; `./milestone.lock` is HAOO-only. The precondition holds *at this instant* | **Re-run the walk at execution time, never cite this number** (04.2 W-1). Note that `05-RESEARCH.md`, every `05-*-PLAN.md` and every summary written into ZPH becomes a new ZPH-only path — the removal plan must sync-then-walk-then-delete, in that order |

**The canonical question, answered:** after every file in both repos is correct, the state that still
carries the old world is (1) an empty MX record set, (2) an unactivated FormSubmit endpoint, and
(3) a TLS certificate issued while a third party held the Pages claim. None of the three is fixed by
a commit.

---

## Common Pitfalls

### Pitfall 1: `heading-order` is a `best-practice` rule — the UI-SPEC's tag list does not run it

**What goes wrong:** QUAL-03 names "semantic heading order" first. The UI-SPEC's axe tag list is
`wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` with `best-practice` deliberately excluded. In
axe-core 4.13, `heading-order` is tagged **`cat.semantics, best-practice`** with impact **Moderate**.
So the axe pass will not check heading order at all, and under D-OQ-1 a Moderate finding would only
be *recorded* even if it did.
**Why it happens:** heading *order* is a WCAG-advisory technique, not a normative success criterion —
`empty-heading` and the landmark rules are best-practice for the same reason.
**How to avoid:** two independent belts, both cheap. (a) Add `heading-order` explicitly via
`withRules(['heading-order'])`. (b) Keep the UI-SPEC's SS-1 explicit level assertions — which already
enumerate S1's `h1 → h2 → h3` structure per state — as the load-bearing check, and treat axe's result
as corroboration. Do not rely on (a) alone.
**Warning signs:** an axe run on S1 that reports zero `heading-order` results in *any* state,
including the deliberately-conditional error/confirmation/fallback headings.
`[VERIFIED: dequelabs/axe-core doc/rule-descriptions.md line 109 — "| [heading-order](…4.13/heading-order…) | Ensure the order of headings is semantically correct | Moderate | cat.semantics, best-practice | failure, needs review |"]`

### Pitfall 2: "200% zoom" is SC 1.4.4, not SC 1.4.10 Reflow

**What goes wrong:** UI-SPEC ZM-1 says halving 1280→640 and 1440→720 "is the WCAG-sanctioned
equivalence used for SC 1.4.10 reflow". SC 1.4.10 is defined at **320 CSS px wide / 256 CSS px tall**,
stated in the Understanding document as "equivalent to a starting viewport width of 1280 CSS pixels
wide at **400%** zoom". A halved 1280 models **200%**, which is SC 1.4.4 Resize Text territory.
**Why it happens:** both are commonly called "zoom support" and the ROADMAP criterion says only
"zoom support".
**How to avoid:** keep ZM-1's method exactly as specified — it is a correct and useful assertion, and
it is what the owner's matrix (D-09) names — but **label it correctly in the evidence file** as a
200% / SC 1.4.4-class measurement. If the planner wants SC 1.4.10 coverage too, the additional
viewport is **320 × 256**, and it is cheap to add to the existing sweep. Do not silently relabel the
UI-SPEC; record the correction the way this project records every other one.
**Warning signs:** an evidence file claiming SC 1.4.10 conformance from a 640 px measurement.
`[CITED: w3.org/WAI/WCAG22/Understanding/reflow.html]`

### Pitfall 3: `overflow-x-hidden` makes the obvious overflow check pass vacuously

**What goes wrong:** `document.documentElement.scrollWidth > clientWidth` never fires, because both
top-level wrappers mask it. Verified verbatim this session:
`ProductPage.tsx:91` — `<div className="min-h-screen overflow-x-hidden bg-[#FBFCFF] text-[#18275F]">`
and `ZERO-PAPERHUB/src/App.tsx:207` — `<div className="font-sans text-gray-800 bg-white overflow-x-hidden">`.
**How to avoid:** VC-1's three assertions, un-collapsed. VC-1b (per-element `rect.right <=
window.innerWidth + 1`, run on the **unmodified** page) is the load-bearing one.
**Warning signs:** a "no overflow" result at 360 px that took under a second per surface — the
per-element sweep is not free.
`[VERIFIED: HAOO/src/pages/ProductPage.tsx:91; ZERO-PAPERHUB/src/App.tsx:207]`

### Pitfall 4: The `bypass` rule would block the S3 run — and the fix is scoping, not disabling

**What goes wrong:** a document-wide axe scan of `www.zero-paperhub.com` flags `bypass`, which is
**Serious** and tagged **`wcag2a`** — so under D-OQ-1 it blocks, on the very F5 defect D-OQ-3 deferred.
**How to avoid:** `.include('#products')` on the S3 builder, and **no** `bypass` entry in the disable
table. The UI-SPEC already reasons this out; this note only confirms the rule's tags and impact are
what it assumed. A disable would go stale after a future ZPH phase fixes F5; a scope will not.
`[VERIFIED: dequelabs/axe-core doc/rule-descriptions.md line 42 — "| [bypass](…) | Ensure each page has at least one mechanism for a user to bypass navigation and jump straight to the content | Serious | cat.keyboard, wcag2a, wcag241, section508, …"]`

### Pitfall 5: New Playwright code escapes `npm run typecheck` entirely

**What goes wrong:** `npm run typecheck` is `tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p
tsconfig.node.json`. `tsconfig.app.json` ends `"include": ["src"]`; `tsconfig.node.json` ends
`"include": ["vite.config.ts", "config"]`. Neither covers `e2e/` or `playwright.config.ts`. So every
line of the new harness is invisible to one of D-15's six enumerated gates, and a type error ships.
**Why it happens:** the two-project split is Vite scaffold default; nothing warns you.
**How to avoid:** add `tsconfig.e2e.json` (`"include": ["e2e", "playwright.config.ts"]`, `"types":
["node"]`), reference it from `tsconfig.json`, and extend the `typecheck` script with a third
`tsc --noEmit -p tsconfig.e2e.json`. All three tsconfigs are **ground-A scaffold entries** on
`shared-scaffold.txt`, and divergence between the two repos on a ground-A entry is already the norm
(`package.json` differs today and `verify:disjoint` exits 0) — so this does **not** breach SPLT-01.
**Warning signs:** `npm run typecheck` completing in the same time it does today after ~600 lines of
new TypeScript were added.
`[VERIFIED: HAOO/tsconfig.app.json ("include": ["src"]); HAOO/tsconfig.node.json ("include": ["vite.config.ts", "config"]); HAOO/package.json scripts.typecheck]`

### Pitfall 6: Vitest collects `e2e/**/*.spec.ts` — measured, not assumed

**What goes wrong:** Vitest's default `include` is `**/*.{test,spec}.?(c|m)[jt]s?(x)`. A Playwright
spec named `checkout.spec.ts` under `e2e/` is therefore collected by `npm test`, imports
`@playwright/test`, and either errors the run or — worse — is silently counted. That breaks D-07 by
construction and contaminates the very test count QUAL-05 rests on.
**Why it happens:** `*.spec.ts` is the Playwright community default *and* the Vitest default. Both
tools claim the same glob.
**How to avoid:** name every Playwright file `*.e2e.ts`, and set Playwright's
`testMatch: '**/*.e2e.ts'` (its own default is `**/*.@(spec|test).?(c|m)[jt]s?(x)`, which would then
match nothing under `e2e/` — so `testMatch` is mandatory, not optional). Belt-and-braces: add
`'e2e/**'` to `vitest.config.ts`'s existing `exclude` array, which already reads
`['**/node_modules/**', '**/dist/**', '.claude/**', '.gsd/**']`.
**Measured this session:**

```
$ cat > e2e/probe.spec.ts   (a vitest describe/it)
$ cat > e2e/probe2.e2e.ts   (a vitest describe/it)
$ npx vitest list | grep -i PROBE
e2e/probe.spec.ts > E2E-COLLECTION-PROBE > probe-marker      ← collected
                                                              (probe2.e2e.ts absent)
$ npx vitest list | grep -c ">"   → 684    (baseline 683)
```

`[VERIFIED: empirical run in HAOO this session; HAOO/vitest.config.ts exclude array; CITED: playwright.dev/docs/api/class-testconfig for the default testMatch glob]`

### Pitfall 7: The `noscript` DOM has eight anchors, not five

**What goes wrong:** UI-SPEC P13 reads "The five `noscript` recovery links". The **live** document
carries two `<section aria-label>` blocks: `"HAOO onboarding without JavaScript"` with five `<li>`
anchors (WhatsApp, `tel:`, `mailto:`, `manage.haoo.online`, `/brochure/HAOO-Marketing-Brochure.pdf`)
and `"HAOO qualification form recovery"` with **three more** (WhatsApp, `tel:`, `mailto:` again, with
different accessible names — `Message HAOO on WhatsApp instead`, etc.). An `expect(links).toHaveLength(5)`
fails a correct page.
**How to avoid:** assert **five distinct destinations**, and assert the second section's three
anchors resolve to the same three `href`s as their counterparts — the same *identical name ⇒
identical href* discipline, inverted (different names, same destinations, which is correct here).
**Warning signs:** a red S2 spec whose failure message is a count.
`[VERIFIED: live GET https://www.haoo.online/ this session, `<noscript>` block extracted verbatim]`

### Pitfall 8: `javaScriptEnabled: false` does not stop a meta refresh

**What goes wrong:** a spec sets `javaScriptEnabled: false` for the S4 "refresh neutralised" case and
still lands on `www.haoo.online`. Meta refresh is a parser directive, not script. At `content="0"`
there is no observable window.
**How to avoid:** Pattern 2 — `route.fetch()` + `route.fulfill({ response, body })` with the tag
stripped. Record it as a modified-page measurement.
**Good news, and it is load-bearing:** axe-core's `meta-refresh` rule **passes** on `content="0"`.
Its check options are `{ "minDelay": 0, "maxDelay": 72000 }` and
`meta-refresh-evaluate.js` returns `true` when `redirectDelay <= options.minDelay`. The rule has
`"impact": "critical"` and tags including `"wcag2a"`, so had the delay been anything between 1 and
72000 it would have **blocked the whole run** under D-OQ-1. This is a second, independent reason the
UI-SPEC's "the delay is exactly `0`, and that number is load-bearing" is correct.
`[VERIFIED: dequelabs/axe-core lib/rules/meta-refresh.json and lib/checks/navigation/meta-refresh.json, fetched via gh API this session]`

### Pitfall 9: The mail chain cannot start — MX is empty right now

**What goes wrong:** an executor sends the D-12 tagged submission before DNS lands, gets no mail, and
cannot tell whether the endpoint is unactivated or the mailbox is unreachable — the exact ambiguity
D-11 exists to prevent. Compounding it: FormSubmit's activation confirmation is emailed **to the
mailbox under test**, so with no MX there is no way to activate either.
**Measured this session:**

```
$ dig +short MX haoo.online          → (empty, rc=0)
$ dig +short MX haoo.online @8.8.8.8 → (empty, rc=0)
$ dig +short A  haoo.online          → 185.199.109.153 185.199.110.153 185.199.108.153 185.199.111.153
```

**How to avoid:** wave 1 = the D-10 `dig` checkpoint, and make every downstream mail task carry it as
a hard precondition. Allow real propagation time; the Playwright work is fully independent and
should run in parallel. `[VERIFIED: dig, this session, 2026-09-07]`

### Pitfall 10: `verify:disjoint` in CI cannot use `actions/checkout` at `../ZERO-PAPERHUB`

**What goes wrong:** `actions/checkout` refuses a `path` outside `$GITHUB_WORKSPACE`, but the script
resolves its arguments against **its own repository root**, not the cwd:
`const first = resolve(SCRIPT_REPO_ROOT, firstArg); const second = resolve(SCRIPT_REPO_ROOT, secondArg);`
(`scripts/verify-tree-disjointness.mjs:472-473`). So `npm run verify:disjoint`'s hardcoded
`../ZERO-PAPERHUB` means `/home/runner/work/HAOO/ZERO-PAPERHUB` — a sibling of the workspace.
**How to avoid:** both repositories are **PUBLIC** (`gh repo view` confirms `"visibility":"PUBLIC"`
for `KaruguDev/HAOO` and `KaruguDev/ZERO-PAPERHUB`), so an anonymous shallow clone needs no token at
all and lands wherever you point it:

```yaml
- name: Fetch sibling checkout
  run: git clone --depth 1 https://github.com/KaruguDev/ZERO-PAPERHUB.git "${{ github.workspace }}/../ZERO-PAPERHUB"
- name: Verify tree disjointness
  run: npm run verify:disjoint     # byte-unchanged; the npm script keeps working
```

This preserves D-15's enumerated `npm run verify:disjoint` verbatim rather than inventing a variant
script, and it sidesteps the cross-repo token question entirely. Put it in its own workflow/job —
**not** in `deploy.yml`, whose artifact upload would otherwise be at risk if a stray checkout landed
inside the workspace. `[VERIFIED: HAOO/scripts/verify-tree-disjointness.mjs:459-474; gh repo view for both repositories]`

### Pitfall 11: `color-contrast` is Serious and will run on shipped, owner-approved screens

**What goes wrong:** `color-contrast` is tagged `cat.color, wcag2aa, wcag143` with impact **Serious**,
so under D-OQ-1 any hit **blocks the run** — on screens the owner already approved and that this
phase's boundary forbids redesigning.
**How to avoid:** do not pre-emptively disable it. The phase boundary explicitly permits fixing a
defect the evidence reveals, and a real AA text-contrast failure on a live marketing page is such a
defect. Plan for the possibility: budget a task for "axe Serious findings on S1 — triage and fix",
and record every finding with its measured ratio, node target and rule id rather than a pass mark.
Note `color-contrast-enhanced` is `wcag2aaa` and is correctly excluded by the tag list.
`[VERIFIED: dequelabs/axe-core doc/rule-descriptions.md lines 43, 135]`

### Pitfall 12: `wcag22aa` adds exactly one rule — and it is the 24×24 one

**What goes wrong:** a planner assumes the `wcag22aa` tag brings broad WCAG 2.2 coverage and
under-specifies the hand-written assertions. Grepping axe-core 4.13's full rule table for `wcag22aa`
returns **one** match: `target-size` ("Ensure touch targets have sufficient size and space",
**Serious**, `cat.sensory-and-visual-cues, wcag22aa, wcag258`).
**How to avoid:** treat `wcag22aa` as "SC 2.5.8 target size, 24×24" and nothing else. The UI-SPEC's
own **44 × 44** floor for primary actions is *stricter* than the rule and must stay a spec assertion;
axe will only catch sub-24 targets. Both numbers belong in the evidence file, labelled.
`[VERIFIED: grep -c "wcag22aa" over dequelabs/axe-core doc/rule-descriptions.md → 1; line 93]`

---

## Code Examples

### Example 1: The five-viewport sweep as a project-level parameterisation

```ts
// e2e/viewport.e2e.ts
import { test, expect } from '@playwright/test';
import { SURFACES } from './fixtures/surfaces';

const VIEWPORTS = [
  { w: 360,  h: 740, why: 'small Android, the narrowest supported width' },
  { w: 390,  h: 844, why: 'modern iPhone class' },
  { w: 768,  h: 1024, why: 'tablet / Tailwind md breakpoint boundary' },
  { w: 1280, h: 1024, why: 'desktop, and the 200% zoom base' },
  { w: 1440, h: 900,  why: 'wide desktop, and the second 200% zoom base' },
] as const;                              // D-09: closed list, one reason per entry

for (const vp of VIEWPORTS) {
  test.describe(`${vp.w}px`, () => {
    test.use({ viewport: { width: vp.w, height: vp.h } });

    test('VC-1b: no element escapes the viewport horizontally', async ({ page }) => {
      await page.goto(SURFACES.S1.path);
      const escapees = await page.evaluate(() => {
        const OFF_CANVAS = ['.sr-only', '[class*="-left-[10000px]"]'];
        return [...document.querySelectorAll('*')]
          .filter((el) => {
            const s = getComputedStyle(el);
            if (s.visibility === 'hidden' || s.display === 'none') return false;
            if (OFF_CANVAS.some((sel) => el.matches(sel))) return false;
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) return false;
            return r.right > window.innerWidth + 1 || r.left < -1;
          })
          .map((el) => ({ tag: el.tagName, cls: el.className, right: el.getBoundingClientRect().right }));
      });
      expect(escapees, JSON.stringify(escapees, null, 2)).toEqual([]);
    });
  });
}
```

### Example 2: Proving the mask is not hiding an overflow (VC-1c)

```ts
// Recorded as a MODIFIED-PAGE measurement — never conflated with VC-1a.
await page.addStyleTag({ content: 'html,body,body *{overflow-x:visible !important}' });
const masked = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));
evidence.record('VC-1c', { viewport: vp.w, ...masked, mode: 'mask-neutralised' });
expect(masked.scrollWidth).toBeLessThanOrEqual(masked.clientWidth + 1);
```

### Example 3: Keyboard-only focus indicator capture (KF-2)

```ts
// Source: playwright.dev — keyboard.press drives real modality, so :focus-visible applies.
const CAPTURE = ['outline-style', 'outline-width', 'outline-color', 'box-shadow'] as const;
const read = () => page.evaluate((props) => {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return null;
  const s = getComputedStyle(el);
  return { tag: el.tagName, name: el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 40),
           style: Object.fromEntries(props.map((p) => [p, s.getPropertyValue(p)])) };
}, CAPTURE);

const before = await read();
await page.keyboard.press('Tab');
const after = await read();

expect(after).not.toBeNull();
expect(after!.style).not.toEqual(before?.style);                       // something changed
expect(after!.style['box-shadow'] !== 'none'
    || parseFloat(after!.style['outline-width']) > 0).toBe(true);      // and it is a real indicator
```

### Example 4: The brochure HTML equivalent survives the PDF being unavailable (SS-4)

```ts
test('SS-4.3: the HTML equivalent does not depend on the artifact it is equivalent to', async ({ page }) => {
  await page.route('**/*.pdf', (route) => route.abort());
  await page.goto('/');

  const titles = await page.locator('#capabilities h3').allInnerTexts();
  expect(titles).toHaveLength(10);                       // count equality, not just presence

  // P1 and P2 survive the failure — the recovery copy never replaces the controls
  await expect(page.getByRole('link', { name: /^Open brochure/ })).toBeEnabled();
  await expect(page.getByRole('link', { name: 'Download brochure' })).toBeEnabled();
  await expect(page.getByText('Brochure preview unavailable')).toBeVisible();
});
```

### Example 5: The three brochure references compared to one another, resolved

```ts
// The <head> rel=alternate href is RELATIVE on the live page:
//   <link rel="alternate" type="application/pdf" href="/brochure/HAOO-Marketing-Brochure.pdf" …>
// Compare resolved URLs, not raw attribute strings.
const [alternate, open, download] = await Promise.all([
  page.locator('link[rel="alternate"][type="application/pdf"]').evaluate((el: HTMLLinkElement) => el.href),
  page.getByRole('link', { name: /^Open brochure/ }).evaluate((el: HTMLAnchorElement) => el.href),
  page.getByRole('link', { name: 'Download brochure' }).evaluate((el: HTMLAnchorElement) => el.href),
]);
expect(new Set([alternate, open, download]).size).toBe(1);   // one target, three references
```

### Example 6: The D-17 CI job

```yaml
# .github/workflows/verify-split.yml  (HAOO repository)
name: Verify tree disjointness
on: { push: { branches: [main] }, pull_request: { branches: [main] }, workflow_dispatch: }
jobs:
  disjoint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with: { node-version: 22, cache: npm }
      # Both repositories are PUBLIC, so an anonymous shallow clone needs no token.
      # The path is a SIBLING of the workspace because verify-tree-disjointness.mjs
      # resolves its arguments against SCRIPT_REPO_ROOT (line 472-473), and the npm
      # script's `../ZERO-PAPERHUB` is what D-15 enumerates by name.
      - run: git clone --depth 1 https://github.com/KaruguDev/ZERO-PAPERHUB.git "$GITHUB_WORKSPACE/../ZERO-PAPERHUB"
      - run: npm ci
      - run: npm run verify:disjoint
```

---

## Finding M-1 — the PostHog open question is very probably already answered by shipped code

CONTEXT.md leaves to the planner "whether that is handled by running the live evidence pass with
measurement suppressed, by a HogQL exclusion, by a documented run window, or by an explicit note".
The shipped configuration appears to have already decided it. The chain, read end to end this session:

1. `node_modules/posthog-js/lib/src/posthog-core.js:1275-1281`, verbatim:
   ```js
   var isBot = !this.config.opt_out_useragent_filter && this._is_bot();
   var shouldDropBotEvent = isBot && !this.config.__preview_capture_bot_pageviews;
   // We drop bot events unless the preview flag to send bot pageviews is enabled
   // or the user has explicitly opted out of useragent filtering
   if (shouldDropBotEvent) {
       return;
   }
   ```
   This sits inside `capture()`, before any transport call.
2. `posthog-core.js:4072-4075`: `PostHog.prototype._is_bot = function () { if (navigator) { return isLikelyBot(navigator, this.config.custom_blocked_useragents); } … }`
3. `node_modules/@posthog/browser-common/dist/utils/blocked-uas.js:32-43` — the last line of
   `isLikelyBot` is verbatim `return !!navigator.webdriver;`
4. `posthog-core.js:194` default config includes verbatim `opt_out_useragent_filter: false`.
5. `HAOO/src/measurement/posthog-lockdown.ts:91-129` — `POSTHOG_LOCKDOWN` sets **neither**
   `opt_out_useragent_filter` **nor** `__preview_capture_bot_pageviews`. Its 30 keys are
   `token, api_host, ui_host, defaults, internal_or_test_user_hostname, autocapture, rageclick,
   capture_dead_clicks, capture_pageview, capture_pageleave, disable_session_recording,
   disable_surveys, disable_surveys_automatic_display, disable_product_tours, disable_conversations,
   disable_web_experiments, capture_heatmaps, capture_exceptions, capture_performance,
   disable_scroll_properties, advanced_disable_flags, advanced_disable_feature_flags,
   advanced_disable_toolbar_metrics, disable_external_dependency_loading, opt_in_site_apps,
   person_profiles, persistence, disable_persistence, disableDeviceModel, save_referrer,
   save_campaign_params, custom_campaign_params, before_send`.
6. The installed and deployed SDK is `posthog-js@1.425.1` (`package.json` pin; `node -p` on the
   installed manifest confirms `1.425.1`).

**Therefore:** a Playwright-driven Chromium, where `navigator.webdriver === true`, hits the early
`return` in `capture()` and sends nothing. No suppression mechanism needs to be built, and no live
production code needs to change — which matters, because changing it would breach this phase's own
boundary.

**What the planner must still do — this is a conclusion, not a licence to skip verification.**
`navigator.webdriver === true` under Playwright is `[ASSUMED]` (training knowledge; Playwright
documents no option to change it, but it is not asserted anywhere in this project). Make it an
**assertion in the harness itself**, not an assumption:

```ts
// e2e/measurement-suppression.e2e.ts — runs FIRST, on the live project.
const posthogRequests: string[] = [];
page.on('request', (r) => { if (r.url().includes('us.i.posthog.com')) posthogRequests.push(r.url()); });
expect(await page.evaluate(() => navigator.webdriver)).toBe(true);   // the mechanism
await page.goto('/');
await page.waitForTimeout(2000);
expect(posthogRequests, `unexpected ingestion traffic: ${posthogRequests.join(', ')}`).toEqual([]);
```

If that assertion ever goes red, fall back to the second option, which is already precedented: a
HogQL exclusion in `src/reporting/generate.ts` bounded like `HAOO_DOMAIN_CUTOVER_DAY = '2026-09-06'`
(`generate.ts:83`) already is. **Record the decision either way** — CONTEXT.md requires it decided,
not discovered, and "the SDK already drops it, asserted here" is a decision with evidence.

One residual: the single D-12 tagged **live submission** is a real human-driven action in a real
browser, not a Playwright run, so its `qualify_submit` event **will** be captured. That is one event.
Name it in the evidence file so the owner report's count has a stated, known inclusion.

`[VERIFIED: node_modules/posthog-js/lib/src/posthog-core.js:194, :1275-1281, :4072-4075; node_modules/@posthog/browser-common/dist/utils/blocked-uas.js:32-43; HAOO/src/measurement/posthog-lockdown.ts:91-129; HAOO/src/reporting/generate.ts:83]`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jsdom + Testing Library as the whole accessibility story | jsdom for structure/logic + a real browser for layout, paint and modality | ongoing industry shift; this project makes it at D-05 | The two are complementary, not competing. UI-SPEC KF-0 already draws the boundary correctly: `focus-contrast.test.ts` owns the *ratio*, the browser owns whether an indicator is *painted* |
| `@axe-core/playwright` default export | **Named** export `AxeBuilder` (`const { AxeBuilder } = require('@axe-core/playwright')`) | axe-core-npm v4.10 era | A `import AxeBuilder from '@axe-core/playwright'` will fail at runtime under 4.13.0 |
| Global `disableRules` for known-acceptable findings | Per-URL disables with a written reason, or better, `.include()` scoping | current best practice, and the UI-SPEC's own position | A scope stays correct after the underlying defect is fixed; a disable goes stale invisibly |
| WCAG 2.1 as the conformance target | WCAG 2.2 AA (`wcag22aa`) | WCAG 2.2 Recommendation, Oct 2023 | In axe-core 4.13 this is worth exactly one rule, `target-size`. Everything else in 2.2 is unautomatable |
| `browser.newContext({ ... })` hand-rolled per test | `test.use({ viewport, reducedMotion, javaScriptEnabled })` at describe scope | Playwright test runner | Lets the five-viewport × three-mode matrix be expressed declaratively rather than in a loop of manual contexts |

**Deprecated / outdated in this repository's own tree:**
- `AGENTS.md` in the **HAOO** repository still describes `src/App.tsx` as the ZERO-PAPER HUB home page
  with `NAV_LINKS`, `VALUES`, `SERVICES`, `useInView` and `downloadCompanyProfile` — pre-split
  scaffold content that does not match HAOO's tree. It is a shared-scaffold entry and was carried
  across unchanged. Not in Phase 5's scope, but do not treat it as a specification.
- `.planning/codebase/STRUCTURE.md` and `INTEGRATIONS.md` remain pinned at `7a99cab` and still name
  Plausible. Carried forward from 04.2, still owed (Deferred).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Playwright's Chromium sets `navigator.webdriver === true` by default, with no supported option to unset it | Finding M-1 | If false, the live evidence pass **does** inflate the PostHog owner report and the planner's decision must fall back to a HogQL exclusion. **Mitigated to near-zero by asserting it in the harness** rather than relying on it — see the code in M-1 |
| A2 | `AxeBuilder#withTags([...]).withRules(['heading-order'])` composes (union) rather than the second call replacing the first | § Pattern 4, Pitfall 1 | If it replaces, the run narrows to `heading-order` only and every other rule is silently skipped — a catastrophic false green. **Must be smoke-tested** in the first e2e task: run against S1, assert the result's `passes`/`violations` contain rule ids from more than one tag family |
| A3 | `actions/checkout` refuses a `path` outside `$GITHUB_WORKSPACE` | Pitfall 10 | If it were permitted, the `git clone` recommendation is merely a simpler alternative rather than a necessity — no downside either way. The recommended `git clone` works regardless |
| A4 | GitHub Pages does not proactively revoke or rotate a Let's Encrypt certificate when a custom domain claim changes hands | D-18 checkpoint 4 | This is 04.2 RESEARCH assumption A1 restated, and it is **now corroborated by direct measurement**: the attacker-era certificate is still being served on 2026-09-07. The assumption is about GitHub's *policy*, which remains unconfirmed by an authoritative source — hence a human checkpoint, not a code task |
| A5 | The `wa.me` starter-text query string on the live page decodes byte-exactly to the compile-time constant | § D-14 well-formedness | Low. The live `noscript` value was read this session and is `?text=Hello%20HAOO%2C%20I%20would%20like%20help%20choosing%20the%20best%20way%20to%20get%20started.`; the React-rendered instances were not separately decoded. The spec asserts it, so a mismatch surfaces as a red test, not a silent gap |
| A6 | FormSubmit's activation link, once clicked, makes the endpoint permanently active with no expiry | § Mail Chain | If activation expires or is per-form-origin, the tagged submission could still fail after a successful activation. D-11's two-record structure already isolates this: the evidence would say "activated, then not delivered", which is the diagnosis, not a mystery |

**Compliance note (do not resolve by research):** the Kenya Data Protection Act 2019 sign-off
(`02-VALIDATION.md:91`) is a legal determination. Nothing in this document assesses, closes or
narrows it, and no downstream agent may. It is D-18 checkpoint 3 and needs someone with legal
standing.

---

## Open Questions

1. **Does `withTags` + `withRules` union or replace? (A2)**
   - What we know: the README says "Subsequent calls to `AxeBuilder#options`, `AxeBuilder#withRules`
     or `AxeBuilder#withRules` will override specified options" — the sentence names `withRules`
     twice and is ambiguous about `withTags` + `withRules` composition.
   - What's unclear: whether the two accumulate into one `runOnly` or the later call wins.
   - Recommendation: make it task 1 of the axe plan. Run both orderings against S1 and assert the
     returned `results.passes` contains rule ids from at least three distinct tag families. Record
     the observed behaviour in the evidence file. If it replaces, drop `withRules` and add an
     explicit spec-authored heading-order assertion (which SS-1 already largely specifies anyway).

2. **Does the 200% ZM-1 method need a 320 px companion? (Pitfall 2)**
   - What we know: ZM-1's halved-viewport method is correct for a 200% / SC 1.4.4-class claim; SC
     1.4.10 Reflow is defined at 320 CSS px.
   - What's unclear: whether "zoom support" in QUAL-03 was meant as 1.4.4, 1.4.10, or informally.
   - Recommendation: keep ZM-1 exactly as the UI-SPEC specifies (it is the owner's D-09 matrix), add
     a **320 × 256** entry to the same sweep at near-zero cost, and label both correctly in the
     evidence. Do not silently relabel ZM-1 as SC 1.4.10.

3. **How much axe surface does the live S1 actually pass today?**
   - What we know: nothing — no axe run has ever been performed against either site.
   - What's unclear: whether S1 produces zero `critical`/`serious` findings. `color-contrast` alone
     is Serious and unmeasured on the live palette (`#5F6B84` body on `#FBFCFF`, `#DBE2FF` on
     `#18275F`).
   - Recommendation: **first task of the axe wave is an exploratory, non-gating baseline run** whose
     output is recorded verbatim. Budget a triage/fix task after it. A phase that discovers a
     blocking Serious finding at its finish line has no room to act on it.

4. **What is the D-16 successor for `test:phase1:red`?**
   - What we know: the script exits 1 in both repositories today (measured this session, both);
     it fails with `Expected-red gate failed: the Phase 1 contract suites unexpectedly passed.`
     Its `forbiddenInfrastructureFailures` guard, the non-zero-exit requirement and the marker check
     are the machinery worth preserving.
   - What's unclear: whether the owner wants it inverted (assert GREEN with the same marker and
     infrastructure-failure guards) or retired.
   - Recommendation: propose **inversion with a rename** — `test:phase1:green`, asserting exit 0 plus
     the same markers present plus the same infrastructure-failure rejection list — as the named
     successor under the withdraw-with-a-named-successor discipline, and put the choice to the owner
     as a `checkpoint:decision`. Both repositories must change together (their marker sets differ:
     HAOO carries `[phase1-red:page]`, `[phase1-red:content]`, `[phase1-red:build]`; ZPH carries
     `[phase1-red:products]`).

---

## Environment Availability

All measured on this machine, 2026-09-07.

| Dependency | Required By | Available | Version / value | Fallback |
|------------|------------|-----------|-----------------|----------|
| Node.js | everything | ✓ | `v24.12.0` (engines require `>=22.18.0`) | — |
| npm | everything | ✓ | `11.6.2` | — |
| `dig` | D-10 MX gate | ✓ | `/usr/bin/dig` | `nslookup`, `host` |
| `curl` + `openssl` | live probes, D-18 cert | ✓ | both present | — |
| `gh` CLI (authenticated) | D-15 deploy-run status, D-17 repo facts | ✓ | `/home/paul/.local/bin/gh`, reads both repos | — |
| Network to `www.haoo.online` | S1/S2 | ✓ | **200** `text/html` | — |
| Network to `www.zero-paperhub.com` | S3 | ✓ | **200** `text/html` | — |
| `www.zero-paperhub.com/products/haoo/` | S4 | ✓ | **200** | — |
| `www.haoo.online/brochure/HAOO-Marketing-Brochure.pdf` | P1/P2/R3 | ✓ | **200** `application/pdf` | — |
| `manage.haoo.online` | D-14 reachability | ✓ | **200**, no `Location` header | — |
| `haoo.online` apex | SC3 | ✓ | **301** → `https://www.haoo.online/` | — |
| `www.haoo.online/<unknown>` | SC3 404 behaviour | ✓ | **404** | — |
| Old sibling asset URL under `/products/haoo/` | R4 | ✓ | **404** as designed | — |
| **MX for `haoo.online`** | **LEAD-07** | **✗** | **empty** from local resolver **and** `8.8.8.8` | **none — D-10 blocking checkpoint** |
| `@playwright/test` | D-05 | ✗ | not installed in either repo | none — must be installed |
| Chromium browser binary | D-05 | ✗ | `~/.cache/ms-playwright` not populated | none — `npx playwright install --with-deps chromium` |
| `git worktree` contamination | D-04, D-18 #1 | **clear** | one worktree per repo; no `worktrees` dir; `vitest.config.ts` excludes `.claude/**` in both | — |

### Existing gate status, measured this session

| Repo | `typecheck` | `lint` | `build`+`vitest` (`npm test`) | `verify:coverage` | `verify:disjoint` | `test:phase1:red` |
|------|-------------|--------|-------------------------------|-------------------|-------------------|-------------------|
| **HAOO** | ✓ 0 | ✓ 0 | ✓ 0 — **683 tests, 10 files, 20.22s** | ✓ 0 | ✓ 0 | **✗ 1** |
| **ZERO-PAPERHUB** | ✓ 0 | ✓ 0 | ✓ 0 — **32 tests, 3 files, 2.48s** | n/a (no such script) | ✓ 0 | **✗ 1** |

`verify:disjoint` output, verbatim: `paths compared: 102 · shared paths: 26 · allowlist entries: 26 ·
allowlist subtracted: 26 · violations: 0 · ratified collisions: 3 (converged: 0) · ZPH product source
shipping HAOO source: 0 · ZPH named carriers present: 2 of 2 · HAOO files naming a home-page symbol: 0`.

**Missing dependencies with no fallback:** MX records for `haoo.online` (owner action, D-10);
Playwright + Chromium (installable).
**Missing dependencies with fallback:** none.

**Latent noise, worth one line in a plan:** both repos emit
`Browserslist: caniuse-lite is outdated. Please run: npx update-browserslist-db@latest` on every
build. Harmless, but it will appear in every piece of evidence this phase produces.

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in **both** `.planning/config.json` files, so this section is
required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework (existing) | Vitest `3.2.4` + jsdom `26.1.0` + Testing Library React `16.3.2` |
| Framework (new, this phase) | `@playwright/test@1.63.0` + `@axe-core/playwright@4.13.0`, **HAOO only** |
| Config file (existing) | `vitest.config.ts` — both repos, `exclude: ['**/node_modules/**','**/dist/**','.claude/**','.gsd/**']` |
| Config file (new) | `playwright.config.ts` — HAOO only, Wave 0 |
| Quick run command | `npm run test:unit` (HAOO ~20s, ZPH ~2.5s) |
| Full suite command | `npm test` (build + vitest) **plus** `npm run test:e2e` (preview project) |
| Live evidence command | `npm run test:e2e:live` — never in CI on every push; a deliberate, recorded run |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUAL-01 | No horizontal overflow at 360/390/768/1280/1440 on S1, S3 | e2e | `npx playwright test e2e/viewport.e2e.ts` | ❌ Wave 0 |
| QUAL-01 | Every primary action P1–P13 present, visible, ≥44×44, unclipped | e2e | `npx playwright test e2e/viewport.e2e.ts -g VC-2` | ❌ Wave 0 |
| QUAL-02 | Tab order = DOM order; no `tabindex > 0`; no trap | e2e | `npx playwright test e2e/keyboard.e2e.ts -g KF-1` | ❌ Wave 0 |
| QUAL-02 | Visible focus indicator on every sequential stop | e2e | `npx playwright test e2e/keyboard.e2e.ts -g KF-2` | ❌ Wave 0 |
| QUAL-02 | Focus never lands on `<body>` across form transitions | e2e | `npx playwright test e2e/form-states.e2e.ts -g KF-5` | ❌ Wave 0 (preview project) |
| QUAL-02 | Focus ring contrast ≥ 3:1 (the **ratio**) | unit (existing) | `npx vitest run src/test/focus-contrast.test.ts` | ✅ exists — **7th entry added per D-OQ-4** |
| QUAL-03 | Heading order, landmarks, accessible names | e2e + axe | `npx playwright test e2e/semantics.e2e.ts` | ❌ Wave 0 — **see Pitfall 1** |
| QUAL-03 | 200% zoom reflow, no content/function loss | e2e | `npx playwright test e2e/zoom-motion.e2e.ts -g ZM-1` | ❌ Wave 0 |
| QUAL-03 | `prefers-reduced-motion` suppression, closed negative | e2e | `npx playwright test e2e/zoom-motion.e2e.ts -g ZM-2` | ❌ Wave 0 |
| QUAL-03 | Brochure HTML equivalent, 10/10 capabilities, survives PDF abort | e2e | `npx playwright test e2e/semantics.e2e.ts -g SS-4` | ❌ Wave 0 |
| QUAL-05 | Six gates green in both repos | script | the eleven commands in § Environment Availability | ✅ all exist — 1 currently red |
| QUAL-05 | Deploy workflows conclude success | manual/`gh` | `gh run list -R KaruguDev/HAOO -L 1` | ✅ exists |
| LEAD-07 | Recovery links well-formed and resolving | e2e | `npx playwright test e2e/recovery.e2e.ts` | ❌ Wave 0 |
| LEAD-07 | MX present | manual gate | `dig +short MX haoo.online` | ✅ command exists, **currently empty** |
| LEAD-07 | FormSubmit activated | manual — owner | mailbox check, recorded verbatim | ❌ human |
| LEAD-07 | Tagged submission arrives | manual — owner | mailbox check, recorded verbatim (D-13) | ❌ human |

### Sampling Rate

- **Per task commit:** `npm run test:unit` in the touched repository (~20s HAOO / ~2.5s ZPH).
- **Per wave merge:** `npm test && npm run test:e2e` (preview project) in HAOO; `npm test` in ZPH.
- **Phase gate:** all eleven gates in both repos green, **plus** one recorded
  `npm run test:e2e:live` run, before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `playwright.config.ts` — projects, `testMatch: '**/*.e2e.ts'`, `webServer`
- [ ] `tsconfig.e2e.json` + `tsconfig.json` reference + `typecheck` script extension — **Pitfall 5**
- [ ] `e2e/fixtures/surfaces.ts` — closed list S1–S5, one reason per entry
- [ ] `e2e/fixtures/primary-actions.ts` — closed list P1–P13
- [ ] `e2e/fixtures/axe.ts` — the single AxeBuilder factory, plus the A2 smoke test
- [ ] `e2e/measurement-suppression.e2e.ts` — asserts `navigator.webdriver` and zero ingestion traffic
- [ ] Framework install: `npm i -D @playwright/test@1.63.0 @axe-core/playwright@4.13.0 && npx playwright install --with-deps chromium`
- [ ] `.github/workflows/verify-split.yml` — D-17
- [ ] Evidence writer: a small helper that records **measured values** into the evidence file (D-13)

---

## Security Domain

`workflow.security_enforcement` is `true`, `security_asvs_level: 1`, `security_block_on: "high"`
in both `.planning/config.json` files.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | **no** | Neither site authenticates anyone. `manage.haoo.online` is a separate host outside this project |
| V3 Session Management | **no** | No sessions. `persistence: 'memory'`, `disable_persistence: true` |
| V4 Access Control | **no** | Static public sites |
| V5 Input Validation | **yes** | Existing: client-side validation in `qualify-form.logic.ts` + `QualifyForm.tsx`; `resolveQualifyEndpoint` rejects any URL whose `protocol !== 'https:'` or `host !== 'formsubmit.co'` (`src/products/haoo.ts:378-388`). **New risk in this phase:** the D-12 tag string travels in a visitor-visible field to a third party — keep it alphanumeric/hyphen, no free text |
| V6 Cryptography | **no (none hand-rolled)** | TLS is terminated by GitHub Pages. **But see the certificate finding below** |
| V7 Error Handling & Logging | **yes** | The evidence file will contain live URLs, status codes and headers. It must not contain the PostHog query credentials or any mailbox contents beyond what D-13 requires |
| V14 Configuration | **yes** | `build-output.test.ts` already asserts the `VITE_*` variable set and its `${{ vars.* }}`-only assignment shape. **Do not add a `VITE_*` variable for the harness** — it would trip that gate, correctly |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation | Status here |
|---------|--------|---------------------|-------------|
| Credential inlined into a public bundle | Information disclosure | `build-output.test.ts` forbids the report credential names **and** asserts every `VITE_*` value is exactly one `${{ vars.* }}` expression | Already enforced. Phase 5 must not weaken it |
| Third-party TLS certificate for a domain you control | Spoofing | Domain verification + CT monitoring | **Live finding — see below.** Verification done (04.2); CT monitoring is Deferred |
| Supply-chain: malicious devDependency | Tampering | Legitimacy audit + exact version pins + no `postinstall` | § Package Legitimacy Audit — both packages clean, neither has a `postinstall` |
| Test tooling reaching production with credentials | Information disclosure | The e2e harness sends no auth and reads no secret; it is `devDependencies` only and never bundled | Enforced by construction; assert it stays out of `dist/` if a bundle-scan extension is cheap |
| PII in an evidence artefact committed to a public repo | Information disclosure | D-13 asks only for the tag, timestamp and folder | Both repositories are **PUBLIC**. The evidence file must not paste mailbox contents |
| `noopener` missing on a new-tab link | Tampering (reverse tabnabbing) | `rel="noopener"` | UI-SPEC KF-4 already asserts `target="_blank"` **and** `rel="noopener"` on P1 |

### Live certificate measurement — D-18 checkpoint 4

Taken this session with `openssl s_client -servername <host> -connect <host>:443 | openssl x509 -noout -issuer -serial -dates`:

| Host | Issuer | Serial | notBefore | notAfter |
|------|--------|--------|-----------|----------|
| `www.haoo.online` | `C=US, O=Let's Encrypt, CN=YR2` | `0609A5171B8224FD0D181CCBEC9CC50E7CC1` | `Sep  3 07:14:32 2026 GMT` | `Dec  2 07:14:31 2026 GMT` |
| `haoo.online` | `C=US, O=Let's Encrypt, CN=YR2` | `0609A5171B8224FD0D181CCBEC9CC50E7CC1` | `Sep  3 07:14:32 2026 GMT` | `Dec  2 07:14:31 2026 GMT` |
| `www.zero-paperhub.com` | `C=US, O=Let's Encrypt, CN=YR2` | `06DF8DC03C29BCD3E6F5C5F1B676273D6F55` | `Aug  3 17:55:20 2026 GMT` | `Nov  1 17:55:19 2026 GMT` |
| `manage.haoo.online` | `C=US, O=Let's Encrypt, CN=YR1` | `05B5ADC85BA3204D89DAEA093E8A58078B69` | `Sep  2 23:51:51 2026 GMT` | `Dec  1 23:51:50 2026 GMT` |

**Both `haoo.online` legs are still served by the certificate D34 describes** — issued 2026-09-03,
two days before the reclaim, valid to 2026-12-02, and identical serial on apex and `www`. Four days
after the domain was recovered, GitHub Pages has **not** rotated it. This is not a key compromise
(Pages holds the private key and never released it), but it is the artefact a CT-log monitor reads
for another 86 days, and the checkpoint is therefore about a **current** condition, not a historical
one. Give the owner this table verbatim. `[VERIFIED: openssl s_client, this session, 2026-09-07]`

---

## Project Constraints (from AGENTS.md)

No `CLAUDE.md` or `.claude/CLAUDE.md` exists in either repository (`.claude/` in ZPH is empty; HAOO
has no `.claude/` at all), and no project skills exist in `.claude/skills/`, `.agents/skills/` or any
of the other searched locations. `AGENTS.md` is the governing project-instruction file in both trees
and is a shared-scaffold entry.

Directives that bear on this phase:

| Directive | Source | Bearing on Phase 5 |
|-----------|--------|--------------------|
| "Preserve static-site deployment unless research proves a minimal external service is necessary — the existing GitHub Pages delivery has no backend" | AGENTS.md § Constraints | Playwright is a **devDependency and CI tool**, not a runtime service. Nothing here adds a backend. Compliant |
| "Build within the current React/Vite/TypeScript/Tailwind stack — avoid introducing a second frontend system" | AGENTS.md § Constraints | The harness adds no frontend code. `shadcn` was executed and declined in the UI-SPEC. Compliant |
| "Use privacy-first analytics and disclose tracking clearly — do not introduce advertising surveillance" | AGENTS.md § Constraints | Finding M-1's recommendation is to **not change** the measurement path. Compliant |
| "Keep compiler settings in `tsconfig.app.json` and `tsconfig.node.json`; do not weaken `strict`, `noFallthroughCasesInSwitch`, or bundler module resolution to bypass errors" | AGENTS.md § TypeScript | The new `tsconfig.e2e.json` must set `"strict": true` and `"noFallthroughCasesInSwitch": true` too. **Adding a third project is not weakening the two named** |
| "Run `npm run lint` after TypeScript/JSX changes. Run `npm run typecheck` for type-level changes and `npm run build` before deployment-sensitive changes" | AGENTS.md § Verification Expectations | Aligns with D-15. Verified this session that `eslint .` **already passes** on an `e2e/*.ts` file and a root `playwright.*.config.ts` using `process.env` — `eslint.config.js` ignores only `dist`, and `typescript-eslint` disables `no-undef`, so no eslint change is required |
| "Do not read or commit secret environment values" | AGENTS.md § External Boundaries | The e2e harness needs no secret. The evidence file must carry no mailbox content beyond D-13's three fields |
| "Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it" | AGENTS.md § GSD Workflow Enforcement | Every change in this phase goes through `/gsd-execute-phase` |

**Stale-content caveat:** HAOO's `AGENTS.md` § Conventions still describes ZERO-PAPER HUB's home-page
source (`NAV_LINKS`, `VALUES`, `SERVICES`, `useInView`, `downloadCompanyProfile`, `CONTACT_FORM_ENDPOINT`
"centralized in `src/App.tsx`"). HAOO's `src/App.tsx` is not that file. Treat the § Constraints,
§ TypeScript and § Verification Expectations blocks as authoritative and the file-specific examples
as pre-split residue.

---

## Sources

### Primary (HIGH confidence) — read in this session

**In-repo, opened and quoted verbatim with line ranges:**
- `HAOO/package.json`, `ZERO-PAPERHUB/package.json` — scripts, deps, engines
- `HAOO/tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.json`, `eslint.config.js`, `vitest.config.ts`, `vite.config.ts`
- `HAOO/src/pages/ProductPage.tsx:88-95, 303-315`; `src/components/ProductHeader.tsx:28-40`
- `HAOO/src/test/focus-contrast.test.ts:1-80` (`MIN_FOCUS_CONTRAST = 3`, `RING_COLOR_TOKENS = { white, blue-700 }`, `FOCUS_SOURCES` — 6 entries)
- `HAOO/src/test/haoo-page.test.tsx:45-60, 396-410` (the `href === '/'` assertion at :52-53; the count-of-2 at :403)
- `HAOO/src/measurement/posthog-lockdown.ts:91-129`; `src/reporting/generate.ts:83`; `src/products/haoo.ts:369-415`
- `HAOO/scripts/verify-tree-disjointness.mjs:1-40, 383-400, 459-474`; `scripts/assert-phase1-red.mjs` (both repos, diffed)
- `HAOO/shared-scaffold.txt` (26 entries); `.github/workflows/deploy.yml` (both repos)
- `ZERO-PAPERHUB/src/App.tsx:203-212`; `src/test/focus-contrast.test.ts:55-57`; `src/products/registry.ts:74-76`
- `HAOO/AGENTS.md:13-21, 73-126, 166-190`
- `.planning/ROADMAP.md` §Phase 5 and §04.2 Post-verification follow-up; `.planning/REQUIREMENTS.md:33,120-129,250`; `.planning/STATE.md:223-252`; `04.2-DEFERRED-ITEMS.md` §D37; `04.2-VERIFICATION.md` §Standing limits; `04-UI-SPEC.md:362-378, 403`

**Vendor source, fetched this session:**
- `dequelabs/axe-core-npm` → `packages/playwright/README.md` (gh API) — the AxeBuilder contract
- `dequelabs/axe-core` → `doc/rule-descriptions.md`, `lib/rules/meta-refresh.json`, `lib/checks/navigation/meta-refresh.json`, `lib/checks/navigation/meta-refresh-evaluate.js` (gh API)
- `node_modules/posthog-js/lib/src/posthog-core.js`; `node_modules/@posthog/browser-common/dist/utils/blocked-uas.js`

**Live systems, measured this session (2026-09-07):**
- `curl` status/content-type on 9 URLs; `dig` MX/A for `haoo.online`; `openssl s_client` on 4 hosts
- `GET https://www.haoo.online/` (full HTML, `<noscript>` extracted); `GET /assets/haoo-DGFKBCjE.js` (endpoint + ingestion origin); `GET https://www.zero-paperhub.com/products/haoo/` (full HTML)
- All 11 npm gates in both repositories; `npx vitest list` collection probe; `npx eslint` probe; the D37 planning-tree walk; `git worktree list`; `gh repo view`; `gh run list`

### Secondary (MEDIUM confidence) — official documentation, `[CITED]`

- `playwright.dev/docs/test-projects` — per-project `use.baseURL`
- `playwright.dev/docs/api/class-testoptions` — `reducedMotion`, `javaScriptEnabled`, `viewport`, `deviceScaleFactor`
- `playwright.dev/docs/api/class-testconfig` — default `testMatch` glob, `testDir`, `outputDir`
- `playwright.dev/docs/test-webserver` — `webServer` keys, array form
- `playwright.dev/docs/api/class-route` — `route.fetch()` + `route.fulfill()`
- `playwright.dev/docs/api/class-apirequestcontext` — `maxRedirects: 0`, `failOnStatusCode`
- `playwright.dev/docs/ci-intro` — the recommended GitHub Actions workflow
- `w3.org/WAI/WCAG22/Understanding/reflow.html` — 320 CSS px / 400% equivalence
- `formsubmit.co` — first-submission activation flow, `/ajax/` endpoint, underscore directives

### Tertiary (LOW confidence)

- The `gsd-tools query classify-confidence --provider webfetch` seam rates WebFetch-sourced claims
  LOW. The claims above are labelled `[CITED]` because they come from the vendors' own primary
  documentation; the seam's provider-level tier is recorded here for honesty rather than overridden
  silently. Nothing in the Standard Stack or Common Pitfalls sections rests on a tertiary source
  alone — every load-bearing claim is either an in-session measurement or a vendor-source read.

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|------|-------|--------|
| Standard stack | **HIGH** | Both packages named by the owner in D-05, versions confirmed against the registry, APIs read from the vendors' own repositories |
| Existing gate status | **HIGH** | All 11 commands executed in this session in both repositories; outputs quoted |
| Live-site facts | **HIGH** | Direct `curl`/`dig`/`openssl` measurements with commands shown; the HTML and bundle were fetched and read |
| Repository structure & config traps | **HIGH** | Pitfalls 5, 6 and 10 were each verified empirically or by reading the exact line that causes them |
| axe rule taxonomy | **HIGH** | Read from `dequelabs/axe-core`'s own `doc/rule-descriptions.md` and rule/check JSON at 4.13 |
| PostHog suppression (Finding M-1) | **HIGH** for the mechanism, **MEDIUM** for the conclusion | The five-step chain was read verbatim; the one remaining link (`navigator.webdriver === true` under Playwright) is A1 and is converted into a harness assertion rather than trusted |
| Playwright API details | **MEDIUM** | Official docs (`[CITED]`), not executed — Playwright is not yet installed. The A2 `withTags`/`withRules` composition question is explicitly open |
| Mail chain / FormSubmit | **MEDIUM** | Endpoint confirmed in the live bundle; activation flow from formsubmit.co's own page; A6 records the residual |
| Legal / compliance (Kenya DPA) | **not assessed** | Out of scope for research by construction — D-18 checkpoint 3 |

**Research date:** 2026-09-07
**Valid until:** 2026-10-07 for the tooling facts (Playwright ships weekly; re-check versions if
planning slips past that). **The live measurements are valid for hours, not days** — the MX result,
the certificate, the gate statuses and the D37 walk must every one of them be **re-measured at
execution time**, never cited from this file. That is the 04.2 W-1 discipline, and this document is
subject to it like any other.

---

*Phase: 05-prove-the-deployed-journey*
*This file is written byte-identically into both `KaruguDev/HAOO` and `KaruguDev/ZERO-PAPERHUB`
planning trees, following the D-02 pattern established for `05-CONTEXT.md` and `05-UI-SPEC.md`, so
that the D37 superset walk continues to report 0 ZPH-only paths until the removal plan runs.*
