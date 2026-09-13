---
phase: 05
slug: prove-the-deployed-journey
status: draft
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 2
asvs_level: 1
created: 2026-09-13
---

# Phase 05 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Gate state: BLOCKED.** Two OPEN threats at or above `high` (T-05-21, T-05-23). Phase advancement is blocked until `threats_open: 0`. Owner decision 2026-09-13: fix both (via `/gsd-code-review 05 --fix`), then re-run `/gsd-secure-phase 05`.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| working tree → git history | A destructive removal becomes a commit; history is the only recovery | ZPH `.planning/` (249 files), walk integers |
| planning record and evidence → public repository | Everything under `.planning/` and `evidence/` is world-readable | counts, SHAs, tool output, measurements |
| DNS zone → public Internet | An MX change is global and routes all domain mail | `haoo.online` MX records |
| owner's mailbox → public evidence record | Mailbox facts enter a public file | marker, received time, folder, truncated sender and subject |
| npm registry → repository | New devDependencies and a browser binary enter the build environment | `@playwright/test`, `@axe-core/playwright`, Chromium |
| harness → live production | A real browser drives production and can generate analytics traffic | page loads, axe runs, potential events |
| harness → shipped bundle | Build-time harness needs would enter the deployed artifact | `VITE_*` variables |
| HAOO page → parent site | Outbound navigation to another origin with the same owner | `https://www.zero-paperhub.com/` |
| closed focus list → shipped focus styles | The list decides which indicators are measured | focus-source registrations |
| fixture layer → every evidence spec | A wrong or narrowed list propagates into every claim | surfaces, viewports, actions, axe config |
| axe factory → vendor rule engine | The factory decides which rules run and which impacts fail | tags, disables, include scope, threshold |
| harness → third-party form processor → mailbox | A real POST crosses formsubmit.co to a real mailbox | form fields, reply-to `info@haoo.online`, marker |
| visitor-visible field → third party | A project-authored marker is stored by a third party | marker string |
| rule engine → evidence record | Engine output carries three of the four success criteria | violations, incomplete, rule accounting |
| live public sites → harness | Owned production whose availability the project does not control | served markup, layout geometry |
| cross-origin image → Products card | One site's availability affects the other's layout | `brochure-preview.png` |
| keyboard modality → computed style | Visible focus exists only under real keyboard input | `:focus-visible` computed style |
| browser-built-in viewer → page | The embedded PDF viewer is third-party surface | keyboard focus |
| brochure action → new browsing context | A new tab creates an opener relationship | `window.opener` |
| accessible name → destination | A name promises a destination that HTTP never validates | name vs href |
| brochure artifact → page content | The substance exists as HTML and inside a separate PDF | brochure content |
| old bookmark → retired path | A visitor expects HAOO content at a ZPH URL | navigation to `/products/haoo/` |
| retired-path document → HAOO domain | One repository's document asserts destinations on the other's domain | refresh target, canonical, visible link |
| page → third-party hosts | Onboarding, messaging and mailbox hosts are outside project control | `manage.haoo.online`, `wa.me`, `tel:`, `mailto:` |
| page → analytics ingestion origin | Its failure must not degrade the journey | PostHog requests to `us.i.posthog.com` |
| harness → qualification endpoint (preview routing) | Routing keeps failure testing away from the real mailbox | routed or aborted formsubmit.co requests |
| serialised request body → visitor's later edits | Post-serialisation edits are not sent | field values, disabled flags |
| browser confirmation → delivery claim | The page shows acceptance; only the mailbox shows delivery | provider status and body |
| measurement method → conformance claim | A viewport supports one criterion, not another | viewport size, criterion label |
| motion suppression → content availability | A suppression that removes content is a regression | equivalent text, primary actions |
| gate configuration → gate result | Configuration decides what the gate can ever report | axe options, named exceptions |
| owner's decision → permanent public record | An accepted risk moves from conversation into a public record | owner replies, acceptance sentences, provenance |
| committed fix → deployed production | An undeployed fix is not measured | deploy run id, head commit, bundle names |
| CI → foreign repository | The job clones and reads a second repository | ZPH `main` shallow clone |
| shared allowlist → separation guarantee | Each entry subtracted is a path left unguarded | `shared-scaffold.txt` entries |
| failing check → green claim | Fail-by-design checks train readers to ignore failures | gate exit statuses |
| plan completion → requirement status | Statuses set from work done rather than evidence are false greens | status plus cited measurement |

---

## Threat Register

Built from the `<threat_model>` blocks of all 17 plans (register authored at plan time). Verified by `gsd-security-auditor` on 2026-09-13 at ASVS L1; per-threat file:line evidence was returned by the auditor, and the evidence for every OPEN threat and every ruling is reproduced in *Verification Findings* below.

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-05-01 | Denial of service | `../ZERO-PAPERHUB/.planning` removal | high | mitigate | Task 2 halts unless task 1's recorded ZPH-only and differing counts are both `0`; the sync runs before the walk and the walk before the delete, so no unique record can be destroyed | closed |
| T-05-02 | Repudiation | the authorising walk | medium | mitigate | The walk is re-run at execution time and its integers are written into the same commit as the deletion; a recorded figure from an earlier session is never accepted as the precondi… | closed |
| T-05-03 | Tampering | `scripts/verify-tree-disjointness.mjs` semantics | medium | mitigate | Task 3 re-runs `verify:disjoint` in both checkouts and records both success lines, so the removal cannot silently change what SPLT-01 measures | closed |
| T-05-04 | Information disclosure | evidence file in a public repository | low | accept | The evidence file carries file counts, commit SHAs and tool output only — no credentials, no mailbox content, no personal data | closed |
| T-05-05 | Spoofing | `haoo.online` MX record set | high | mitigate | The two hostnames are pinned to the owner's recorded 2026-09-05 decision and asserted by name in task 3; an MX naming any other host fails the gate rather than being accepted as "… | closed |
| T-05-06 | Tampering | the A records serving the website | medium | mitigate | Task 3 re-asserts that the site still serves — apex 301 to www, www 200 with the HAOO bundle — so an MX edit that collaterally damaged web serving is caught in the same run (amend… | closed |
| T-05-07 | Repudiation | the MX gate | high | mitigate | The gate is `gate="blocking-human"` and is cleared only by a live two-resolver measurement recorded verbatim; an executor may not clear it on its own judgment (D-10) | closed |
| T-05-08 | Information disclosure | `05-EVIDENCE-MAIL.md` in a public repository | medium | mitigate | This plan writes DNS answers and timestamps only. No mailbox contents, no credentials. Links 2 and 3 are bounded by D-13 to the tag, the received timestamp and the destination fol… | closed |
| T-05-09 | Information disclosure | shipped bundle configuration | high | mitigate | No `VITE_*` variable is added for the harness; `src/test/build-output.test.ts` already asserts the browser-prefixed variable set and its `${{ vars.* }}`-only assignment shape, and… | closed |
| T-05-10 | Tampering | the owner's funnel report | medium | mitigate | The suppression mechanism is asserted in the tracer (`navigator.webdriver` plus an empty ingestion-request list) rather than assumed, and the decision plus its fallback are record… | closed |
| T-05-11 | Repudiation | the axe run's scope | high | mitigate | The tracer measures the distinct tag-family count and fails the run below three, so a rule set silently narrowed to a single rule cannot be reported as a full-conformance pass | closed |
| T-05-12 | Denial of service | the hermetic unit gate | medium | mitigate | `e2e/**` is excluded from Vitest and the e2e scripts are separate from `test`, so a network outage cannot redden the bundle assertions; the equal before/after collection counts ar… | closed |
| T-05-13 | Information disclosure | run artefacts | low | accept | `.playwright-report/` and `.playwright-results/` are gitignored; `evidence/*.json` carries URLs, status codes, rule ids and measurements only | closed |
| T-05-14 | Spoofing | the parent-site link destination | medium | mitigate | The destination is pinned to the exact absolute URL in both components and in the jsdom assertion, so a future edit to a different host reddens the suite rather than silently redi… | closed |
| T-05-15 | Tampering | reverse tabnabbing | low | accept | No `target="_blank"` is introduced on these links, so no new-tab opener relationship is created; the one new-tab link on the page already carries its opener protection and is asse… | closed |
| T-05-16 | Repudiation | the closed focus list | medium | mitigate | The widening is recorded in the list's own doc-comment with the authorising decision and the untouched machinery named, so a later reader can tell a registration from a relaxation | closed |
| T-05-17 | Information disclosure | `05-EVIDENCE-PREFLIGHT-FIXES.md` in a public repository | low | accept | The file records source locations, contrast ratios and rule references — all of which are already inspectable in the public source and on the public page | closed |
| T-05-18 | Repudiation | the closed lists | high | mitigate | Every list carries a per-entry reason and a vacuity guard, so a list that matched nothing fails loudly rather than reporting a green run over an empty subject set | closed |
| T-05-19 | Tampering | the axe rule set | high | mitigate | The tag list, the explicit rule and the per-URL disables live in one factory with reasons at the branch; no call site can quietly differ, and the composition behaviour was measure… | closed |
| T-05-20 | Repudiation | the Products-surface finding | medium | mitigate | The surface is scoped by inclusion, never by disabling the bypass rule, so the underlying page-level finding stays visible and the scope stays correct after that finding is fixed | closed |
| T-05-21 | Repudiation | the evidence record | high | mitigate | The recorder refuses an entry with no measured value or with a pass-mark string, so the record-measured-values discipline is enforced at the writer rather than by reviewer vigilan… | open |
| T-05-22 | Information disclosure | `evidence/` in a public repository | low | accept | Records carry public URLs, rule ids, impacts, counts and box measurements — all inspectable on the public pages already | closed |
| T-05-23 | Denial of service | the `info@haoo.online` mailbox | high | mitigate | The submitting spec is skipped unless an explicit environment flag is set, and the skipped-by-default behaviour is proven by a run before the spec is ever armed; the phase sends e… | open |
| T-05-24 | Tampering | the marker string crossing to a third party | medium | mitigate | The marker is restricted to uppercase letters, digits and hyphens with no free-form input, built from a UTC instant and a random suffix; ASVS V5 input-validation concern for a val… | closed |
| T-05-25 | Spoofing | the submission endpoint | high | mitigate | The spec asserts the outgoing request URL is the https, host-pinned endpoint `resolveQualifyEndpoint` produces; a redirected or downgraded endpoint fails the run rather than silen… | closed |
| T-05-26 | Repudiation | the activation claim | high | mitigate | Activation is a separate record from delivery, closed only by the owner's verbatim mailbox report at a `gate="blocking-human"` checkpoint; a browser-observable confirmation is exp… | closed |
| T-05-27 | Information disclosure | `05-EVIDENCE-MAIL.md` in a public repository | medium | mitigate | The record is bounded to the marker, the received timestamp, the destination folder, the sender address and the endpoint URL — no message bodies, no other mailbox contents, no cre… | closed |
| T-05-28 | Repudiation | the baseline scan's coverage | high | mitigate | Every surface is scanned in every reachable state, each recorded as its own entry with the state named, and the entry count is asserted; a default-state-only run cannot pass as fu… | closed |
| T-05-29 | Tampering | the rule set applied | high | mitigate | Every scan goes through the single factory and the spec contains no locally-constructed builder; the tag list length is asserted per entry, so a silently narrowed run is caught by… | closed |
| T-05-30 | Repudiation | suppression of an inconvenient finding | high | mitigate | The Products region is scoped rather than rule-disabled, the retired-path disables are a closed three-entry list with reasons, and the baseline records findings without failing on… | closed |
| T-05-31 | Denial of service | live-site availability | low | accept | Retries are configured on the live project; an outage produces a recorded failure to re-run, not a false green, because the classification asserts against the machine record | open — below high threshold (non-blocking); accept rationale contradicted |
| T-05-32 | Information disclosure | `evidence/axe-baseline.json` in a public repository | low | accept | Node targets and help text describe public markup already served to every visitor | closed |
| T-05-33 | Repudiation | the overflow result | high | mitigate | Three separate assertions with the per-element sweep on the unmodified page as the load-bearing one; the two document readings carry distinct mode markers so a masked pass cannot … | closed |
| T-05-34 | Repudiation | the primary-action result | medium | mitigate | The closed action list's vacuity guard runs before every assertion block, so a selector that matched nothing fails loudly rather than passing over an empty set | closed |
| T-05-35 | Denial of service | the Products card's cross-origin preview image | medium | mitigate | The unavailable-image state is asserted explicitly rather than assumed, so a cross-domain outage degrading the parent site's layout is a measured, known behaviour rather than a su… | closed |
| T-05-36 | Tampering | the Explore HAOO destination | medium | mitigate | The card's action destination is asserted to resolve to the HAOO domain in the degraded state as well as the normal one | closed |
| T-05-37 | Information disclosure | `05-EVIDENCE-VIEWPORT.md` in a public repository | low | accept | The file records box geometry and public accessible names, all inspectable on the public pages already | closed |
| T-05-38 | Tampering | reverse tabnabbing on the new-tab brochure action | medium | mitigate | The spec asserts the opener protection attribute together with the new-tab target, so removing one without the other reddens the run | closed |
| T-05-39 | Repudiation | the painted-indicator result | high | mitigate | Focus is driven by real keyboard presses and the indicator is measured as a computed-style change, so a declared class that never paints cannot pass; the evidence lists every unin… | closed |
| T-05-40 | Repudiation | the embedded viewer's focus behaviour | medium | mitigate | The outcome is recorded with its key sequence and resting place and explicitly marked neither pass nor failure, so an un-actionable third-party limit neither blocks the gate nor d… | closed |
| T-05-41 | Denial of service | keyboard traversal | high | mitigate | Termination is asserted from the last stop and reversibility is asserted from sampled stops, so a trap that made the journey unusable for a keyboard visitor fails the run | closed |
| T-05-42 | Information disclosure | `05-EVIDENCE-KEYBOARD.md` in a public repository | low | accept | The file records public accessible names and computed style values already observable on the public page | closed |
| T-05-43 | Spoofing | destination-naming links | high | mitigate | Every link whose name names a destination is asserted to resolve to that destination; a link promising the parent site and resolving elsewhere reddens the run, which is the defect… | closed |
| T-05-44 | Repudiation | heading-order coverage | high | mitigate | The spec owns the assertion rather than delegating it to an advisory-tagged rule, asserts per state rather than once, and the file comments the signal that would mean the engine c… | closed |
| T-05-45 | Denial of service | brochure content availability | medium | mitigate | The HTML equivalent is asserted with the artifact route aborted, so content locked inside an unavailable file is a failing run rather than a silent loss of the brochure's substance | closed |
| T-05-46 | Tampering | the three brochure references drifting apart | medium | mitigate | The three resolved destinations are asserted equal to one another and the path constant is reused from the built-tree suite, so one edited target cannot silently split them | closed |
| T-05-47 | Information disclosure | `05-EVIDENCE-SEMANTICS.md` in a public repository | low | accept | The file records public headings, landmark names and destinations already served to every visitor | closed |
| T-05-48 | Spoofing | the retired-path document's destinations | high | mitigate | The refresh target, the canonical reference and the visible link destination are asserted equal to one another, so one edited target cannot split them and silently send visitors s… | closed |
| T-05-49 | Tampering | the retired-path document gaining script | high | mitigate | The script-element count is asserted as exactly zero rather than as a maximum, so any script added to a document defined as minimal fails the run | closed (mitigation modified; see findings) |
| T-05-50 | Information disclosure | redirect chains on the reachability probe | medium | mitigate | Redirects are not followed and any redirect target is recorded verbatim, so an unexpected redirect into a different flow is visible in the evidence rather than absorbed by a non-e… | closed |
| T-05-51 | Denial of service | third-party host availability | medium | mitigate | An unavailable third-party host is recorded with its status and time and does not fail the run, while a missing or wrong-target link does — the two are distinguishable in the evid… | open — below high threshold (non-blocking) |
| T-05-52 | Denial of service | analytics origin unavailable | high | mitigate | The journey is asserted to render and every primary action to stay operable with the ingestion origin blocked, converting the facade's fail-closed design claim into a measurement | closed |
| T-05-53 | Repudiation | scheme-only destinations | medium | mitigate | Telephone, mailbox and messaging destinations are never fetched and are recorded as validated rather than reachable, so the evidence does not overclaim what was proven | closed |
| T-05-54 | Denial of service | the `info@haoo.online` mailbox | high | mitigate | Every failure and terminal state is induced on the preview target with the endpoint routed; a project-name guard enforces it rather than convention, so no failure test can reach p… | closed |
| T-05-55 | Tampering | a silently discarded correction | medium | mitigate | Every field control is asserted disabled during the in-flight window, and a second submission is asserted to issue no second request, counted rather than inferred from the interfa… | closed |
| T-05-56 | Repudiation | the confirmation state | high | mitigate | The sent announcement is asserted as a browser-observable claim with a comment at the assertion and a closing statement in the evidence pointing at the mail-chain record for deliv… | closed |
| T-05-57 | Repudiation | the blocked state offering a retry | medium | mitigate | The retry control's absence is asserted rather than left unstated, so a future change offering a retry on a deterministic failure reddens the run | closed |
| T-05-58 | Information disclosure | build-time configuration | high | mitigate | The spec introduces no browser-prefixed variable and touches no source file, asserted by a working-tree check, so the built-tree variable-set gate stays intact | closed |
| T-05-59 | Repudiation | the held-out visual item | medium | mitigate | The backstop item is authored as a backstop in `must_haves`, is marked in the evidence as not a pass, and carries its measured inputs so the human judgement is informed rather tha… | closed |
| T-05-60 | Repudiation | the zoom conformance claim | high | mitigate | Every measurement carries the criterion label from the closed list, and the evidence states plainly that no row is a reflow claim unless its label says so; the 320-wide entry exis… | closed |
| T-05-61 | Repudiation | the reduced-motion result | medium | mitigate | Suppression is measured as a computed transform comparison across a hover rather than as the presence of a guard class, so a guard that does not take effect fails | closed |
| T-05-62 | Denial of service | content loss under suppression | high | mitigate | The brochure-equivalence text assertions and every primary-action condition are re-run with reduced motion active, so a suppression that removed content or controls reddens the run | closed |
| T-05-63 | Repudiation | the deliberate colour-transition exclusion | low | mitigate | Recorded with its reason rather than left silent, so a future reader does not push a correct component into a variant it does not need | closed |
| T-05-64 | Repudiation | the two held-out readability items | medium | mitigate | Both are authored as backstop items in `must_haves` and marked in the evidence as not a pass, carrying measured inputs so the human judgement is informed rather than blind | closed |
| T-05-65 | Tampering | the gate's rule configuration | high | mitigate | The gate consumes the baseline's factory unchanged, the fixture file is asserted byte-unchanged, and the spec is asserted to contain no rule disable; a finding cannot be closed by… | closed |
| T-05-66 | Repudiation | an accepted risk | high | mitigate | Acceptance is a `gate="blocking-human"` decision checkpoint, the reason is transcribed verbatim, and the gate expresses it as a named exception keyed on rule and node with a vacui… | closed |
| T-05-67 | Repudiation | the deferred ZERO-PAPER HUB findings | medium | mitigate | Deferrals cross-reference existing identifiers rather than being re-raised as new, and each states that the deferral is a scope decision and not a severity judgement | closed |
| T-05-68 | Tampering | scope creep into shipped screens | medium | mitigate | Fixes are constrained to the smallest change removing the finding, expressed in the existing token vocabulary, with a stop-and-reconsider rule when the diff outgrows the finding | closed |
| T-05-69 | Repudiation | fixes measured against an old deployment | high | mitigate | The triage record carries a deployment note naming the plan that re-runs the live evidence, so a committed-but-undeployed fix cannot be mistaken for a measured one | closed |
| T-05-70 | Tampering | the cloned sibling repository in CI | medium | mitigate | The sibling is cloned shallow and is only read as a file tree — no dependency install and no script execution happens inside it; the disjointness script reads files and reports co… | closed |
| T-05-71 | Elevation of privilege | cross-repository credentials in CI | medium | mitigate | Both repositories are public, so the clone is anonymous and no token with cross-repository scope is introduced into the workflow at all | closed |
| T-05-72 | Tampering | the deploy workflow's published artifact | high | mitigate | The separation check is its own workflow rather than a job in the deploy workflow, and the sibling lands outside the workspace, so no stray checkout can reach the published tree | closed |
| T-05-73 | Repudiation | a silently passing separation check | high | mitigate | No continue-on-error is permitted, asserted against the workflow file; an infeasible checkout is recorded as spot-checked with its measured reason rather than hidden behind a gree… | closed |
| T-05-74 | Repudiation | the withdrawn expected-red gate | high | mitigate | The disposal is written into the script header naming what was withdrawn, the plan, the successor and the byte-unchanged guarantees; the rejection list and marker sets are asserte… | closed |
| T-05-75 | Tampering | the shared allowlist diverging | high | mitigate | Both copies are compared byte-for-byte after the change and the disjointness auditor is re-run in both checkouts, so a unilateral edit fails rather than quietly widening what the … | closed |
| T-05-76 | Repudiation | the delivery claim | high | mitigate | The marker is committed to the record before the send, so the message searched for is provably the message sent; delivery is closed only by the owner's verbatim report at a `gate=… | closed |
| T-05-77 | Repudiation | a spam-folder arrival | high | mitigate | Recorded as spam and never normalised, with the deliverability follow-up named as deferred; the requirement counts it as a pass and the record still says which folder | closed |
| T-05-78 | Information disclosure | mailbox content in a public repository | high | mitigate | The record is bounded to the marker, timestamp, folder, sender and subject; message bodies are excluded by the checkpoint's own instructions and asserted absent | closed |
| T-05-79 | Tampering | the marker crossing to a third party | medium | mitigate | Restricted to uppercase letters, digits and hyphens, generated from a UTC instant and a random suffix, carried in a visitor-visible field with no hidden field invented | closed |
| T-05-80 | Denial of service | duplicate submissions | medium | mitigate | Exactly one send; the message count is recorded as an integer and every marker sent in the phase is listed, so a retry is auditable rather than silently replacing the record | open — below high threshold (non-blocking) |
| T-05-81 | Repudiation | funnel-count contamination | medium | mitigate | The submission's analytics event is named in the record as the one known inclusion automated traffic does not produce, so the owner's counts carry a stated inclusion rather than a… | closed |
| T-05-82 | Repudiation | the final live evidence claim | high | mitigate | The deployment run and its commit are confirmed to contain this phase's fixes before the live pass runs, and the task halts otherwise, so a live claim cannot be reported from a su… | closed |
| T-05-83 | Repudiation | the gate table | high | mitigate | Every command is executed inside this plan and its exit code recorded; no result is carried forward from an earlier wave, and the enumeration is read from each manifest rather tha… | closed |
| T-05-84 | Repudiation | requirement statuses | high | mitigate | Each status cites a specific measurement, and a requirement met at less than its statement names its successor rather than rounding up to complete | closed |
| T-05-85 | Repudiation | the two blockers only the owner can close | high | mitigate | A `gate="blocking-human"` decision checkpoint with three named dispositions; any acceptance is transcribed verbatim, and the phase may close on a decision recorded but never on on… | closed |
| T-05-86 | Information disclosure | the consolidated record in a public repository | medium | mitigate | The record indexes measurements, identifiers and dispositions; it carries no mailbox content, no credentials and no personal data, inheriting the per-file bounds each evidence fil… | closed |
| T-05-87 | Spoofing | the domain's serving certificate | high | transfer | Not resolvable by this project: the platform holds the private key and controls rotation. Measured, restated to the owner at the checkpoint with its issuer, serial and validity da… | closed |
| T-05-88 | Information disclosure | unassessed data-protection compliance on a live collection surface | high | transfer | Not resolvable by this project or by research: it requires a determination from someone with legal standing. Escalated at the checkpoint with its three dispositions and recorded i… | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Verification Findings (2026-09-13)

### OPEN — blocking

**T-05-21 (high) — the evidence recorder's refusal is top-level only, and writes are not crash-safe.**
- WR-04: `e2e/fixtures/evidence.ts:89-111` skips arrays and never checks nested values. Committed evidence already carries 84 nested strings the writer would refuse at the top level (`"true"` under `ariaInvalid`/`ariaRequired` in `form-states.json` and `ariaExpanded` in `viewport-mobile-nav.json`) — attribute readings, not verdicts.
- CR-02: `evidence.ts:119` `catch {}` treats any read error as an empty file; `:150-152` rewrite the whole file with no temp file and no lock; `axe-baseline.e2e.ts:333-377` repeats the pattern.
- Smallest fix: walk `measured` recursively (first record aria attributes as booleans or as `aria-invalid="true"` so legitimate readings are not refused); rethrow read errors other than `ENOENT`; write to a temp file and `renameSync` into place in both writers.

**T-05-23 (high) — the live-submission arming guard has two gaps.**
- `e2e/live-submission.e2e.ts:129` arms on any non-empty value, including `0` and `false`.
- `:143-154` accept a supplied marker without checking the evidence for an earlier send, so re-running 05-16's command sends a second real email.
- Guards that hold: the purpose variable, the live-only guard, retries pinned to 0, the proven unarmed skip (`05-EVIDENCE-MAIL.md:714-724`), and the recorded count of 2.
- Smallest fix: arm only on an explicit value such as `=== '1'`; before clicking, refuse if `readEvidence('live-submission')` already records a send for this marker.

### OPEN — non-blocking (below high)

- **T-05-80 (medium)** — duplicate sends are neither prevented (WR-03) nor safely auditable (CR-02 can wipe the append-only record). Closed by the T-05-23 and T-05-21 fixes.
- **T-05-51 (medium)** — `recovery.e2e.ts:1079` writes `disposition: 'reachable'` before the status assertion at `:1100` (every committed record reads 200 today). Fix: derive the disposition from `reading.status`.
- **T-05-31 (low, accept)** — the rationale is contradicted: live runs retry twice (`playwright.config.ts:46`), no gate spec pins retries to 0, records carry no attempt number, so a serious finding seen once and gone on retry exits 0. The final pass recorded 0 flaky tests and 0 retries (`05-EVIDENCE-GATES.md:349-352`). Fix: `test.describe.configure({ retries: 0 })` in `axe-gate.e2e.ts` and `attempt: testInfo.retry` on records, or re-word and re-accept.

### Rulings on code-review cross-references

- **CR-01 → T-05-54: holds.** FS-0 confines the four induced states to preview; `submitEmptyRequired` (`semantics.e2e.ts:342-349`) produces the invalid state on an untouched form, and the spec never fills a field, so no request is issued. The missing abort route in `semantics.e2e.ts` is carried as a warning.
- **CR-01 → T-05-12: holds.** T-05-12's component is the Vitest unit gate (`vitest.config.ts:29` excludes `e2e/**`), not the Playwright preview gate.
- **CR-02 → T-05-18: no bearing.** The closed lists' reasons and vacuity guards are untouched.
- **T-05-49: closed as modified.** HAOO asserts 0 served scripts lacking the Cloudflare edge signature (`recovery.e2e.ts:681,724-729`); ZERO-PAPER HUB holds the authored document to exactly 0 `<script>` (`ZERO-PAPERHUB/src/test/build-output.test.ts:889-890`); the owner accepted the remaining JavaScript Detections bootstrap as CF-JSD-1 (`05-EVIDENCE-RECOVERY.md` §5). Residual: the edge signature at `recovery.e2e.ts:591` is an unanchored substring match.
- **T-05-52: holds; WR-05 has no bearing.** `src/measurement/posthog-lockdown.ts:116-119` disables flags and external dependency loading, so nothing loads from the unblocked sibling hosts.

### Unregistered flags (warnings, not counted)

- **AG-O1 / CF-JSD-1 on S1:** no threat ID covers edge-injected script on `www.haoo.online` (T-05-49 is S4 only). The Web Analytics beacon reads absent; the JavaScript Detections bootstrap (3 edge requests per load on S1) is owner-accepted as CF-JSD-1 but has no S1 threat mapping.
- **CR-01 surface:** the Playwright `preview` gate is not hermetic — `semantics.e2e.ts` has no project guard, runs against production (`05-EVIDENCE-GATES.md:360`), drives the live form without the provider route, and its preview-run S1 records are indistinguishable from live ones.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-05-01 | T-05-04 | The evidence file holds counts, SHAs and tool output only, with no credentials, mailbox content or personal data | 05-01-PLAN | 2026-09-07 |
| AR-05-02 | T-05-13 | Run scratch is gitignored; `evidence/*.json` holds URLs, statuses, rule ids and measurements; `playwright-run.json` is excluded | 05-03-PLAN | 2026-09-07 |
| AR-05-03 | T-05-15 | No `target="_blank"` was added; the one new-tab link keeps opener protection | 05-04-PLAN | 2026-09-07 |
| AR-05-04 | T-05-17 | The preflight file holds source locations, ratios and rule references, all already public | 05-04-PLAN | 2026-09-07 |
| AR-05-05 | T-05-22 | Records hold public URLs, rule ids, impacts, counts and boxes | 05-05-PLAN | 2026-09-07 |
| AR-05-06 | T-05-31 | Retries run on the live project, and an outage yields a recorded failure, not a false green. **Contradicted by review finding WR-01 (a retry can turn an intermittent serious axe finding green); not a valid closure until fixed or re-worded. Recorded here as OPEN, non-blocking.** | 05-07-PLAN | 2026-09-07 |
| AR-05-07 | T-05-32 | Node targets and help text describe public markup | 05-07-PLAN | 2026-09-07 |
| AR-05-08 | T-05-37 | Box geometry and public names | 05-08-PLAN | 2026-09-07 |
| AR-05-09 | T-05-42 | Public names and computed styles | 05-09-PLAN | 2026-09-07 |
| AR-05-10 | T-05-47 | Public headings, landmarks and destinations | 05-10-PLAN | 2026-09-07 |
| AR-05-11 | T-05-87 (transfer) | "The owner accepts that the GitHub Pages origin for haoo.online still serves the Let's Encrypt certificate issued on 2026-09-03 (serial 0609A5171B8224FD0D181CCBEC9CC50E7CC1, valid until 2026-12-02) while a third party held the Pages claim, given that visitors receive Cloudflare's edge certificate issued on 2026-09-09 after the reclaim, GitHub holds the private key, and the platform has not replaced the origin certificate." Cloudflare SSL mode unknown; platform rotation behaviour unconfirmed. | Owner — orchestrator-drafted at the owner's request, approved by the owner as written (05-17 Task 2) | 2026-09-13 |
| AR-05-12 | T-05-88 (transfer) | "The owner accepts, as a known and unassessed risk, that the HAOO qualification form collects personal data on the live site before anyone with legal standing has determined whether that collection complies with the Kenya Data Protection Act 2019; the sign-off remains outstanding and is carried beyond Phase 5." **Unassessed, not resolved; no legal reviewer engaged, so no party yet holds the transferred risk.** | Owner — orchestrator-drafted at the owner's request, approved by the owner as written (05-17 Task 2) | 2026-09-13 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-13 | 88 | 83 | 5 (2 blocking) | gsd-security-auditor (ASVS L1, block_on high); SECURITY.md written by the orchestrator |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [ ] `threats_open: 0` confirmed
- [ ] `status: verified` set in frontmatter

**Approval:** pending — blocked on T-05-21 and T-05-23
