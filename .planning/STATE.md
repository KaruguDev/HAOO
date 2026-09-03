---
gsd_state_version: 1.0
current_phase: 04.1
current_phase_name: Migrate Measurement from Plausible to PostHog (INSERTED)
status: executing
stopped_at: Completed 04.1-04-PLAN.md
last_updated: "2026-09-03T11:13:40.110Z"
last_activity: 2026-09-03
last_activity_desc: Phase 04.1 execution resumed (wave continue)
state_head: 970c73c017807d4690510bd2ec0e1fe2f44813fb
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 43
  completed_plans: 37
  percent: 33
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-29)

**Core value:** A serious HAOO prospect can understand the product, demonstrate intent, and reach the right onboarding path quickly without getting lost in general company traffic.
**Current focus:** Phase 04.1 — Migrate Measurement from Plausible to PostHog (INSERTED)

## Current Position

Phase: 04.1 (Migrate Measurement from Plausible to PostHog (INSERTED)) — EXECUTING
Plan: 4 of 8
Total Plans in Phase: 8
Status: Ready to execute
Last activity: 2026-09-03 — Phase 04.1 execution resumed (wave continue)

Progress: 27/28 milestone plans ([███░░░░░░░] 33%)

## Performance Metrics

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 9 | - | - |

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 10 min | 3 tasks | 13 files |
| Phase 01 P02 | 5 min | 2 tasks | 6 files |
| Phase 01 P03 | 12 min | 3 tasks | 9 files |
| Phase 01 P04 | 18 min | 2 tasks | 9 files |
| Phase 01 P05 | 16 min | 3 tasks | 7 files |
| Phase 01 P06 | 7 min | 2 tasks | 4 files |
| Phase 01 P07 | 4 min | 3 tasks | 7 files |
| Phase 01 P08 | 4 min | 2 tasks | 3 files |
| Phase 01 P09 | 2 min | 2 tasks | 2 files |
| Phase 02 P01 | 12 min | 1 tasks | 7 files |
| Phase 02 P07 | 6 min | 1 tasks | 4 files |
| Phase 02 P02 | 15 min | 3 tasks | 3 files |
| Phase 02 P03 | 8 min | 3 tasks | 9 files |
| Phase 02 P04 | 14 min | 2 tasks | 3 files |
| Phase 02 P05 | 7 min | 3 tasks | 8 files |
| Phase 02 P06 | 6 min | 2 tasks | 5 files |
| Phase 03 P01 | 8h 4m | 2 tasks | 8 files |
| Phase 03 P02 | 8 min | 2 tasks | 6 files |
| Phase 03 P03 | 12 min | 3 tasks | 9 files |
| Phase 03 P04 | 22 min | 2 tasks | 10 files |
| Phase 04 P01 | 14 min | 2 tasks | 9 files |
| Phase 04 P02 | 20 min | 2 tasks | 9 files |
| Phase 04 P04 | 13 min | 2 tasks | 8 files |
| Phase 04 P03 | 16 min | 2 tasks | 4 files |
| Phase 04 P05 | 1h 30m | 3 tasks | 9 files |
| Phase 04 P06 | 5 min | 2 tasks | 6 files |
| Phase 04 P07 | 10 min | 3 tasks | 7 files |
| Phase 04 P08 | 11 min | 2 tasks | 8 files |
| Phase 04 P09 | 6 min | 2 tasks | 2 files |
| Phase 04 P10 | 7 min | 2 tasks | 3 files |
| Phase 04 P11 | 10 min | 2 tasks | 2 files |
| Phase 04 P12 | 5 min | 2 tasks | 3 files |
| Phase 04 P13 | 8 min | 3 tasks | 4 files |
| Phase 04.1 P02 | 4 min | 2 tasks | 2 files |
| Phase 04.1 P03 | 14 min | 3 tasks | 6 files |
| Phase 04.1 P04 | 25 min | 1 tasks | 15 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 1]: The first phase is a real discovery-to-onboarding HAOO journey, not a documentation or horizontal foundation phase.
- [Phase 3]: Privacy-first measurement uses bounded coarse browser context with no stable visitor identifier or analytics-to-lead identity join.
- [Phase 4]: Reports describe observable events literally and do not claim delivery or completed onboarding without external evidence.
- [Phase 4]: Checkpoint C-3 approved the Plausible code path but deferred production enablement; provider variables remain unset and the deploy workflow stays unchanged until separate privacy-owner approval and dashboard setup.
- [Phase 01]: Use only the four human-approved exact development releases and preserve the existing React 18/Vite 5 runtime stack.
- [Phase 01]: Accept expected RED only when all four named behavior markers appear and no known infrastructure-failure signature is present.
- [Phase 01]: Select the HAOO composition from the physical document body marker while retaining the shared React bootstrap and avoiding a runtime router. — A physical Vite MPA entry provides direct static navigation and crawler-visible source metadata.
- [Phase 01]: Derive the WhatsApp URL only from fixed compile-time product data. — This preserves exact decoded starter text and prevents visitor or analytics context from entering the destination.
- [Phase 01]: HAOO page renders all brochure capability and journey copy verbatim; only the pain and benefit summaries are condensed, and each is assembled from brochure phrases.
- [Phase 01]: Product media paths live in centralized product data (HAOO_PRODUCT.media), keeping ProductPage.tsx a product-agnostic shell and making the partial-media contract testable.
- [Phase 01]: Products navigation is derived from registry presence via productsNavLink() rather than a copied HAOO condition — Couples the nav item and the #products landmark to one source of truth so an empty collection can never leave a dangling anchor
- [Phase 01]: Home-card preview media facts (href, alt, intrinsic size) live in HAOO_PRODUCT.brochure — Keeps ProductsSection free of HAOO literals, reserves aspect-ratio space from data, and makes the optional-media contract testable by emptying the href
- [Phase 01]: Product social image metadata now points at the published /products/haoo/brochure-preview.png — The previous og:image and twitter:image referenced preview-outside.png, which no plan publishes; this plan publishes the supplied preview, so the reference was aligned to the real asset
- [Phase 01]: Brochure recovery copy maps one-to-one onto states and is never duplicated in the DOM — The object child fallback owns unsupported embedding and the compact panel owns absent/failed preview media; both strings coexisting would make every getByText in the contract ambiguous
- [Phase 01]: Open and Download render once as siblings outside the brochure embed, not duplicated per layout — Keeps accessible names unique and satisfies D-07 in every layout and failure state without duplicating anchors across the responsive branches
- [Phase 01]: Brochure control independence is proven structurally rather than by activation — BrochurePanel holds only a preview-error flag and the controls read and write nothing; the contract asserts control outerHTML is byte-identical after six interleaved activations, which proves the component rather than jsdom navigation behavior
- [Phase 01]: The original brochure is declared as a static link rel=alternate type=application/pdf in the product document head — Satisfies the Wave 0 built-HTML reference contract and makes the brochure reachable with JavaScript unavailable, matching the phase progressive-enhancement posture
- [Phase 01]: On a dark surface the light element of the focus pair is the ring, not the offset — UI-SPEC line 255 (visible on navy) governs over the light-offset default in line 174 — An accent ring on the #18275F panel computes 2.21:1; a white ring on the same panel computes 14.06:1
- [Phase 01]: The focus-contrast gate compares the raw IEEE-754 double at ratio >= 3 with no epsilon, and throws on an unrecognized ring colour token rather than skipping it — A skipped pairing would pass the suite silently; a token the contract cannot measure must fail loudly
- [Phase 01]: Anchor scroll offset is reserved with scroll-mt on the products target, not scroll-padding-top on html — html is shared with the product document, whose header is not fixed and whose sections already declare scroll-mt-4
- [Phase 01]: Preserve onboarding access without JavaScript through a narrow `<noscript>` fallback whose destinations are contract-bound to centralized product data.
- [Phase 01]: Treat a green full suite as current-build evidence by making `npm test` build first and retaining `test:unit` for the guarded inner loop.
- [Phase 02]: Narrow the Phase 1 static boundary into a per-file PRODUCT_SOURCE_BOUNDARY map instead of deleting regexes — Grants haoo.ts the provider token and QualifyForm.tsx the network/form-markup tokens while asserting every product source still carries the whole ALWAYS_FORBIDDEN group, so a future capability grant cannot silently drop a storage, analytics, injection, router or backend prohibition
- [Phase 02]: resolveQualifyEndpoint validates through new URL() but returns the original outer-trimmed candidate rather than URL.href — Re-serialising would percent-encode a readable-address target such as /ajax/info@haoo.online; returning the candidate preserves the configured destination byte-for-byte while still rejecting bare, empty, encoded-empty, multi-segment, wrong-host and wrong-protocol inputs
- [Phase 02]: The tracer confirmation panel uses the locked UI-SPEC heading 'Your details are on their way' with body 'Your details were sent.' — Plan 05 then enriches an existing panel rather than renaming one, and both strings describe browser-observable events rather than claiming mailbox delivery
- [Phase 02]: Concurrency is owned by a synchronous inFlightRef, not by React state or the button disabled attribute — Two submit events fired back-to-back against a pending promise must issue exactly one request; React cannot commit disabled state before the second event is dispatched
- [Phase 02]: Each endpoint table row carries an explicit expectedResolution string rather than an isValid boolean — A boolean table would let a future resolver return some third string for a rejected input and still pass the was-rejected half of the assertion; naming the exact expected output for all 30 rows makes the table a total function specification, and the whitespace-padded rows double as the trimming contract
- [Phase 02]: The endpoint contract table was mutation-probed against two deliberately weakened resolvers before being trusted — The resolver was delivered by 02-01, so a green first run proves nothing on its own; a nullish-only fallback is killed by 12 of 12 representative invalid rows and a startsWith-prefix any-https-host resolver by 10 of 12, which is the evidence that the plan prohibitions are enforced by the table rather than only stated in prose
- [Phase 02]: Kenyan county, portfolio-band and timeframe punctuation shipped exactly as planned after the task-1 blocking-human checkpoint: en dash U+2013 in Taita-Taveta and the four banded ranges, plain hyphen U+002D in Tharaka-Nithi / Trans-Nzoia / Elgeyo-Marakwet, typographic apostrophe U+2019 in Murang'a. — These values are written into email delivered to a real inbox and, from Phase 3, into the engagement summary. A wrong character in a closed list is a permanent data-quality defect, so a human confirmed the codepoints before ship rather than after.
- [Phase 02]: Shipped option value is derived from label by a single toOptions helper, and the contested county names are pinned in tests with backslash-u escape sequences rather than visible characters. — A hand-written value/label pair can drift silently; a derivation cannot. A literal expectation written with visible en dashes defends against a source-only edit but not against a tool that normalises the whole repository - both files would drift together and the test would still pass. Escape sequences cannot be normalised.
- [Phase 02]: Entry-point anchor placed after the outward-bound contact note so that note keeps describing only links that leave the site
- [Phase 02]: qualifyEntryPointLabel guards product identity for its fail-closed side effect while returning the UI-SPEC-locked generic label
- [Phase 02]: Reused the registered focusLight ring pairing rather than adding a Tailwind token, keeping the new control inside the measured contrast contract
- [Phase 02]: README enumerates every rejected endpoint value, mirroring resolveQualifyEndpoint's branches so the fallback is predictable without reading the resolver
- [Phase 02]: Error-summary focus is keyed on an invalid-attempt counter, not the errors object, so a repeat invalid submit re-announces and correcting a field never steals focus.
- [Phase 02]: Conditional requiredness ships as a generic requiredWhen descriptor in product data; QualifyForm holds no HAOO field names or option values.
- [Phase 02]: Publish the exact HAOO response-time sentence: Someone will reply within one business day. — The product owner selected one-business-day at the blocking-human checkpoint.
- [Phase 02]: Retry uses the same validated and synchronously guarded submission path as the initial request. — This retains visitor values without creating a weaker or concurrent request seam.
- [Phase 02]: The user selected approve-merge for the exact two-part collection disclosure in 02-UI-SPEC.md; this approves implementation and merge of that wording only, without a broader legal-compliance conclusion.
- [Phase 02]: Phase 2 submits only provider options, Source, and supplied field email labels; it emits no engagement-summary value or placeholder.
- [Phase 03]: Keep tracking event-name-only and derive accepted literals from readonly product configuration. — This removes any event-property or form-value delivery channel.
- [Phase 03]: Confine storage and ambient URL access to src/measurement/index.ts. — All product and component sources retain inherited static privacy prohibitions.
- [Phase 03]: Keep the generic reducer product-agnostic by adding a product-owned interactionEventFlags map instead of decoding HAOO event-name suffixes inside src/measurement/.
- [Phase 03]: Treat exactly 180 elapsed UTC days as retained context and rebuild fresh only when age is greater than 180 days.
- [Phase 03]: Export the exact context-key tuple and single-argument tracking arity as executable structural contracts for static boundary tests.
- [Phase 03]: Add a product-owned semantic interactionEvents map so reusable components can request exact signals without containing HAOO literals or inferring meaning from tuple order. — Preserves D-04 product genericity while giving each component a stable event meaning.
- [Phase 03]: Build the qualification request body before emitting qualify_submit, then emit immediately before fetch. — Serialization failures are not network attempts, while validated admitted fetch attempts are counted truthfully.
- [Phase 03]: Keep the owner-approved HAOO notice as a literal in HAOO product configuration so the generic copy module remains product-name-free and the exact sentence survives bundling. — The public notice is owner-approved byte-exact copy, while reusable copy helpers are contractually product-generic.
- [Phase 03]: Enhance the footer fragment by setting the target details open without preventing default or moving focus. — This preserves native fragment navigation and no-JavaScript usefulness while adding a small progressive enhancement.
- [Phase 04]: The HAOO report derives its calendar day in the Africa/Nairobi reporting timezone through Intl.formatToParts, not in UTC. — A UTC day would place a run made between midnight and 03:00 local on the previous day, so the report would name an inclusive window the provider did not aggregate.
- [Phase 04]: The ten HAOO event literals are written exactly once: HAOO_REPORT_EVENTS is derived from the label map key order and typed Readonly<Record<HaooMeasurementEvent, ...>>. — Adding an eleventh event or dropping a label then fails npm run typecheck before it fails a contract test; mutation-probed at 1 typecheck error and 8 failing contracts.
- [Phase 04]: The all-time report heading has three branches and never invents a date: the locked empty-state heading when nothing was recorded, since-{day} when the provider resolved a first day, and a bare All time when it resolved none. — Using the empty-state copy for an unresolved range would have claimed no recorded actions over non-zero counts.
- [Phase 04]: Only scripts/generate-haoo-report.mjs touches the credential and the provider origin; src/reporting/generate.ts receives endpoint, key and site id through an injected query capability. — A test derives the analytics-origin regex, the Stats API query path and the credential variable name from the files that already own them, so the boundary assertion cannot drift from the 04-05 source scan it protects.
- [Phase 04]: Blocking checkpoint C-2 resolved `include` by the human product owner: normalized campaign values appear in the emailed HAOO engagement summary, so plan 04-04 keeps disclosure contents item 4. — The owner gains the milestone's only attribution signal, and Phase 3 already lowercases, character-restricts and caps the values; the cost is that a campaign label now travels to FormSubmit beside a named enquiry, which widens the standing privacy-ownership blocker.
- [Phase 04]: The emailed engagement summary is assembled by a product-generic formatter that reads an explicit three-member pick list and holds no copy of its own; every sentence is owner-approved product data. — Never spreading the stored record means adding a member to that record cannot silently add it to a delivered email, and keeping copy in product data lets owner-approved wording change without touching executable source.
- [Phase 04]: A half-readable context record is treated as unreadable and yields the locked fallback sentence rather than a summary with no facts in it. — A mutation probe showed that returning an empty sentence list for an unauthored visit band survived every failure row the plan named, shipping an email that reads like a successful summary while asserting nothing.
- [Phase 04]: Checkpoint C-1 was resolved by the human product owner as the A-plus-campaign variant rather than the UI-SPEC proposal verbatim; the shipped notice names both the attached engagement summary and any campaign values seen on arrival. — The UI-SPEC clause bound "a summary of them" to an enumeration that excludes campaign values, which under-disclosed once C-2 resolved include. The 04-UI-SPEC.md C-1 row still carries the superseded text and needs reconciling.
- [Phase 04]: Owner-approved visitor-facing copy has exactly one hand-typed home and one derivation path: qualifyCollectionNotePageContext is the single source, and only measurement-page.test.tsx keeps the approved bytes. — Deriving everywhere prevents drift between surfaces but loses the pin on the approved bytes; one anchor plus a derivation contract keeps both.
- [Phase 04]: The built-bundle notice assertion checks the approved template static segments rather than one contiguous sentence. — Deriving the sentence in product data means it is assembled at runtime and no longer appears inlined in the bundle; the segments still carry the whole approved clause, and rendered textContent equality covers assembly.
- [Phase 04]: The banned-vocabulary scan excludes the authored caveat block, which is pinned by exact text instead, because the caveat's job is to deny the very claims the banned list forbids and it cannot do that without naming them.
- [Phase 04]: The report's period-exposure CSS is written as hide-the-unselected, never show-the-selected, so a browser without :has() support degrades to all four periods visible rather than to an empty document.
- [Phase 04]: The report stage summary uses display: list-item rather than flex, because a flex summary drops the native disclosure marker in Chromium and that marker is how open/closed state is exposed without colour.
- [Phase 04]: The generated report carries no percent sign at all, including in its CSS, so the owner can grep their own report for one and expect zero hits.
- [Phase 04]: Plausible preload initialization stores options in plausible.o while plausible.q contains only real name-only events.
- [Phase 04]: The Phase 4 coverage audit reads canonical Markdown tables and enforces reasoned opt-outs plus deferred production enablement.
- [Phase 04]: Stats counts enter the report only after exact echoed-query and calendar provenance validation. — Local labels must never be attached to counts belonging to another site, goal scope, or range.
- [Phase 04]: Report temp cleanup follows exclusive reservation ownership. — Concurrent losers must neither overwrite nor delete another invocation's business-data artifact.
- [Phase 04]: Local report failures name absent variables only while production collection stays deferred. — Owner diagnostics must be actionable without echoing credentials or silently enabling browser analytics.
- [Phase 04]: Approved analytics script sources live in version-controlled config/ outside src/, and reach the browser only as a provider-gated Vite build-time constant — Putting the origin literal under src/ would inline it into every build and break the provider-unset bundle scan; sourcing approval from a public build variable would let a tampered deployment load arbitrary first-party JavaScript
- [Phase 04]: resolvePlausibleScriptSrc approves a script source by exact URL.origin equality plus exact approved-pathname membership — A substring, prefix, or suffix host test would accept a lookalike host; only the base script path is approved because every extension variant is an OPT-OUT coverage row
- [Phase 04]: Confirm the recorded provider options slot, not merely a non-throwing init call, before enabling analytics collection — a cosmetic no-op initializer would otherwise satisfy a throw-only check and leave automatic capture unproven
- [Phase 04]: A pre-existing window.plausible that does not expose the documented options slot is treated as unconfirmable and yields no event sink — analytics availability is traded for a provable privacy posture
- [Phase 04]: A provider stub installed by the adapter is deleted from the scope when initialization is refused, so no partially initialized provider is left on the page
- [Phase 04]: Report output-directory extraction is separator-agnostic with a drive-root guard, fixed inside generate.ts rather than via node:path — Importing a Node module would break the module's capability-injection design and the credential-and-provider-origin boundary case that depends on it
- [Phase 04]: Only MEAS-05 promoted to Complete; MEAS-01 and MEAS-08 remain unchecked at Gaps Found — Re-verification owns those transitions; a gap-closure executor must not pre-empt three open human gates (production privacy approval with live event uniqueness, live report reconciliation, MVP readability judgment)
- [Phase 04]: directoryOf selects its separator set from the destination shape: only a drive designator or a UNC prefix makes a backslash a separator — Restores the pre-04-10 POSIX extraction (a backslash is a legal POSIX filename character) without trading away the 04-10 Windows fix
- [Phase 04]: The bare-root guard refuses both root families (drive designator and UNC server/share root) while a destination nested below a share still yields its real parent — Handing a filesystem root to a recursive creation turns a working run into a caught generation failure; the positive nested-UNC row proves the guard refuses roots, not UNC destinations
- [Phase 04]: Plan 04-11 promotes no requirement status: requirements-completed is left empty despite the template asking for the plan requirement IDs — The plan prohibitions forbid promoting a requirement checkbox, and MEAS-01 and MEAS-08 both retain open human gates in 04-VERIFICATION.md
- [Phase 04]: A defined non-callable pre-existing provider global is refused before anything is written to the scope, rather than replaced and then restored — Restoring would mean the value had already been destroyed; the declared truth forbids replacement rather than merely requiring repair, so the classification decides before it assigns
- [Phase 04]: The unreachable stub-removal branch was deleted along with the two 04-09 claims it backed, rather than made reachable — Making it reachable would require installProviderStub to return a stub that can fail its own initialization, weakening the one component in the module the project fully controls; the honest outcome is fewer claims, not more machinery
- [Phase 04]: Gap 3 closed as a documentation-accuracy gap: the recorded-opt-out control is unchanged and only the claims about it were corrected — 04-VERIFICATION.md classified it that way and routed the adopted-path echo to a live human gate; closing it in code would have silently retired a gate kept open on purpose (T-04-55, transfer)
- [Phase 04]: 04-09's D1 coverage row is now human_judgment: true with a manual_procedural entry at status unknown, keeping its two original passing checks — The assertion depends on the vendor script honouring the recorded value; no test in this tree can observe it, so verify-work must route D1 to a human rather than auto-pass on structural evidence
- [Phase 04.1]: PostHog coverage matrix: every automatic-capture subtraction is a reasoned OPT-OUT row, so the D-03 lockdown is verifier-enforced rather than a configuration detail — A reasonless OPT-OUT is an undecided hole; the coverage verifier fails on one, proven by mutation probe
- [Phase 04.1]: The PostHog Query API echoes query and hogql but not the project id — a weakening against the Plausible site_id provenance, recorded in COVERAGE.md rather than dropped silently — CONTEXT delegates report provenance with the binding constraint that any weakening must be stated explicitly
- [Phase 04.1]: The PostHog lockdown is confirmed by reading back every locked key off the merged configuration, not by a non-throwing init: the SDK reports a blank or duplicate project key through a log line, so the readback (which also re-asserts the resolved key) is the only gate that closes a silent no-op initializer
- [Phase 04.1]: stripToBareName receives the allowed-event tuple as a parameter instead of importing the product module, keeping src/measurement generic over EventName as the Phase 3 contract requires
- [Phase 04.1]: The deferred selector-set ingestion-host bundle case is proved by a real second vite build into a throwaway outDir (approved origin x1 selected, x0 unset), never by reading vite.config.ts - a source read would pass for the wrong reason and keep passing if the define were deleted

### Pending Todos

None yet.

### Blockers/Concerns

- Privacy/legal ownership must approve notice, storage, retention, processor, and Kenya Data Protection Act decisions before production collection.
- HAOO mailbox ownership and FormSubmit activation must be available for the Phase 5 production delivery check.
- Analytics account/configuration may be absent; the product journey must remain launchable with the no-op measurement path.
- [Phase 1 review] Informational tenant and agent audiences are not visibly rendered despite the broader PROD-03 audience wording; revisit before shipping if that interpretation is required.
- [Dependency maintenance] The unused Supabase dependency retains a pre-existing `ws` advisory; review removal or upgrade in a dedicated task before shipping.
- The five closed option lists are assumed complete enough for real HAOO follow-up routing; unresolved, carried to UAT as human-judgment item 02-02-SUMMARY coverage D6.
- [Phase 4] A leftover untracked worktree at .claude/worktrees/rf-03-retry-1788205465/ makes Vitest collect and run every suite twice (591 tests instead of ~300); all copies pass, but it doubles runtime and could mask a single-copy regression.
- [Phase 4] Checkpoint C-2 resolved `include`, so a normalized campaign label now travels to FormSubmit alongside a named enquiry. This widens the standing privacy-ownership approval to cover campaign values leaving the browser, not only page-lifetime memory.
- [Phase 4] RESOLVED by plan 04-04: the always-visible collection notice and HAOO_MEASUREMENT.disclosure.summaryBoundary now state what is actually attached, in the owner-approved C-1 clause. The superseded sentence returns zero grep hits under src/.
- [Phase 4] 04-UI-SPEC.md still carries the superseded proposed C-1 clause; the owner approved the A-plus-campaign variant instead, so the UI-SPEC C-1 row and Surface B boundary description need reconciling to the shipped bytes.
- [Phase 4] 04-UI-SPEC.md's Locked banned vocabulary list and its Caveat block copy contradict each other: the locked caveat contains people, sessions and customer. Plan 04-03 resolved this in code by scoping the ban to everything except the authored denial block; the UI-SPEC itself still needs amending to say so.
- [Phase 4 verification] Plausible preload options use the wrong vendor contract; report responses do not validate echoed query provenance; rename failure can leave a temporary report; owner setup omits `PLAUSIBLE_SITE_ID`. See 04-VERIFICATION.md and plan gap closure before enabling production analytics.
- No production module loads posthog-js as a value, so a deployed provider-selected build finds an empty provider slot and fails closed to no analytics. Importing it breaks two deliberately-established bundle invariants; see phase deferred-items D4 for the measured detail.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260830-16r | Update .gitignore to exclude local GSD runtime state and generated planning research cache files | 2026-08-30 | c5cce39 | [260830-16r-update-gitignore-to-exclude-local-gsd-ru](./quick/260830-16r-update-gitignore-to-exclude-local-gsd-ru/) |

### Roadmap Evolution

- Phase 04.1 inserted after Phase 4: Migrate Measurement from Plausible to PostHog (URGENT)

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| Lead operations | Searchable leads list, CRM integration, and automated follow-up | Deferred to v2 | Initialization | v1 |
| Attribution | Registration reconciliation and controlled experiments | Deferred to v2 | Initialization | v1 |
| Commercial | Pricing and dedicated tenant/agent funnels | Deferred to v2 | Initialization | v1 |

## Session Continuity

Last session: 2026-09-03T11:12:57.657Z
Stopped at: Completed 04.1-04-PLAN.md
Resume file: None
