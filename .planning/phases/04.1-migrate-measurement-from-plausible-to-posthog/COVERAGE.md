# API Coverage — PostHog and FormSubmit

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Detector result at plan time: `{"detected":true,"signals":[{"verb":"(surface)","noun":"api"}]}`.
> Two PostHog surfaces enter this phase's scope — the pinned `posthog-js` browser SDK and the
> Query API (MEAS-01/MEAS-08). FormSubmit is carried forward from the Phase 4 matrix unchanged;
> it is unrelated to this migration and re-deciding it here would be an undeclared scope change.
> Each PostHog surface is enumerated from a full-coverage baseline. Because D-03's
> automatic-capture lockdown *is* a set of subtractions, every one of those subtractions is
> recorded below as a reasoned OPT-OUT, which is what makes the lockdown a decision rather than
> a configuration accident.

## PostHog — browser SDK (posthog-js, pinned and loaded; delivery gated on the selector)

| capability | decision | reason |
|---|---|---|
| `posthog.init(token, config)` with an explicit lockdown object | INTEGRATE | the automatic-capture posture is passed as one literal object (D-03), leaving no surface at a default. Reached at runtime: `src/measurement/posthog.ts` binds the SDK by value (D4 closed by 04.1-09) |
| merged-config readback via `instance.config` | INTEGRATE | `init` assigns the fully merged config before returning, so the readback proves resolved values rather than submitted ones — and `init` does not throw on a blank token, so the readback is the gate |
| `capture(name)` with a bare name and no property argument | INTEGRATE | the ten allowlisted HAOO names are the entire event vocabulary (MEAS-02) |
| `before_send` payload reduction | INTEGRATE | the sole property chokepoint: it runs last, after `property_denylist` and after `$process_person_profile` is appended, and returning `null` drops anything outside the allowlist |
| `person_profiles: 'never'` | INTEGRATE | no PostHog person profile may be created (MEAS-03); the setting reaches ingestion only through the retained `$process_person_profile` property |
| `persistence: 'memory'` with `disable_persistence: true` | INTEGRATE | no stable visitor identifier is written to the browser, and data previously saved to the browser is deleted (MEAS-03) |
| `advanced_disable_flags` to suppress the remote-configuration fetch | INTEGRATE | without it the options documented `@default undefined` fall back to remote configuration, so a server-side project setting could re-enable a locked surface |
| `disable_external_dependency_loading` | INTEGRATE | prevents the SDK requesting any external script for session replay, surveys or site apps, so the bundled version pin is the whole of what executes |
| `defaults: 'unset'` pinning of the date-gated default set | INTEGRATE | a dated default set is a moving target, and `'2026-01-30'` or later enables `internal_or_test_user_hostname`, which turns person processing on for localhost |
| PostHog Cloud US ingestion host | INTEGRATE | D-08 selects the US region; the host is stated explicitly even though it is also the SDK default |
| DOM autocapture (`autocapture`) | OPT-OUT | `@default true`; captures clicks, inputs and form interactions, which would carry the free-text form values MEAS-02 prohibits outright |
| rageclick (`rageclick`) | OPT-OUT | `@default true` and independent of `autocapture`; would emit `$rageclick`, an interaction event outside the closed allowlist |
| dead clicks (`capture_dead_clicks`) | OPT-OUT | `@default undefined`, meaning it falls back to remote configuration; an interaction event outside the closed allowlist |
| automatic `$pageview` (`capture_pageview`) | OPT-OUT | duplicates the explicit `haoo_page_view` event and can fire before campaign parameters are normalized |
| automatic `$pageleave` (`capture_pageleave`) | OPT-OUT | `@default 'if_capture_pageview'` — off only *because* pageview is off, so it is set to literal `false` and asserted as `false` rather than as the coupling string |
| session recording / replay (`disable_session_recording`) | OPT-OUT | `@default false`; replay would record visitor interaction and form content, the one-way disclosure D-03 exists to prevent |
| surveys (`disable_surveys`) | OPT-OUT | `@default false`; a survey is a visitor-facing artifact the product owner has neither authored nor disclosed |
| automatic survey display (`disable_surveys_automatic_display`) | OPT-OUT | `@default false` and a separate switch, so disabling surveys alone would not prove display is off |
| product tours (`disable_product_tours`) | OPT-OUT | `@default false`; injects visitor-facing UI this milestone does not own |
| conversations (`disable_conversations`) | OPT-OUT | `@default false`; a messaging surface that would collect visitor free text |
| web experiments (`disable_web_experiments`) | OPT-OUT | `@default true` already — stated anyway per D-03 so a future default change cannot silently re-enable it |
| heatmaps (`capture_heatmaps`) | OPT-OUT | `@default undefined` → remote-configuration controlled; records pointer and scroll positions outside the allowlist |
| exception autocapture (`capture_exceptions`) | OPT-OUT | `@default undefined` → remote-configuration controlled; exception payloads carry URL and stack content the report never presents |
| performance and web vitals (`capture_performance`) | OPT-OUT | `@default undefined` → remote-configuration controlled; `false` disables both network timing and web vitals, which is why it is the single switch for both |
| scroll properties (`disable_scroll_properties`) | OPT-OUT | scroll depth is visitor-behaviour data the report does not present and MEAS-02 does not allowlist |
| site apps (`opt_in_site_apps`) | OPT-OUT | would execute PostHog-hosted code inside the page, defeating the bundled, version-pinned delivery decision |
| feature flags (`advanced_disable_feature_flags`) | OPT-OUT | this milestone ships no flagged behaviour, and a flag evaluation emits `$feature_flag_called`, an event outside the allowlist |
| toolbar metrics (`advanced_disable_toolbar_metrics`) | OPT-OUT | the toolbar is an authoring surface this project never loads, so its metrics would describe nothing a visitor did |
| `save_referrer` | OPT-OUT | `@default true`; emits `$referrer` and `$referring_domain`, ambient context outside the bare-name contract |
| `save_campaign_params` | OPT-OUT | `@default true`; PostHog would capture `utm_*` itself, bypassing the repo-side `readCampaign` allowlist and normalization MEAS-06 requires |
| `identify()` / `alias()` / `group()` / `setPersonProperties()` | OPT-OUT | each forces person processing on for the rest of the session regardless of `person_profiles: 'never'`; the adapter exposes only `capture` |
| `property_denylist` as a privacy boundary | OPT-OUT | it runs before `$process_person_profile` is appended and therefore cannot be the contract; `before_send` is the chokepoint and the denylist is at most a redundant second layer |
| `sanitize_properties` | OPT-OUT | `@deprecated - use before_send instead`, and setting it logs a runtime error |
| the deprecated `ip` option | OPT-OUT | `@deprecated - THIS OPTION HAS NO EFFECT`; setting it would record a suppression that does not exist |
| `cookieless_mode` | OPT-OUT | derives `hash(team_id, daily_salt, ip_address, user_agent, hostname)` — an identifier from personal data — and silently drops every event when the project setting is off (D-05 dead funnel) |
| `$geoip_disable` as an event property | OPT-OUT | it is the only client-side GeoIP lever, but adding it would contradict the bare-name payload; suppression is the owner-performed "Discard client IP data" project setting instead |

## PostHog — Query API

| capability | decision | reason |
|---|---|---|
| `POST /api/projects/:project_id/query/` | INTEGRATE | the single request the owner report issues per range |
| `HogQLQuery` body kind | INTEGRATE | an aggregate over raw event names is what retires the ten-dashboard-goals human gate (D-06) instead of leaving it permanently open |
| the descriptive `name` parameter | INTEGRATE | labels the request so the owner can recognise the report's own traffic rather than mistaking it for a visitor |
| bearer auth from the local process environment, scope *Query Read* | INTEGRATE | the report reads and never writes; every write-capable surface in this table is an explicit OPT-OUT |
| `count()` aggregate grouped by `event` | INTEGRATE | returns one occurrence count per allowlisted name, the shape `parseGoalCounts` already validates |
| `toTimeZone(timestamp, 'Africa/Nairobi')` pinned inside the SQL | INTEGRATE | pinning the timezone in the query text removes the provider-mismatch failure mode instead of detecting it, and the report still states which timezone its days are in |
| explicit inclusive date bounds | INTEGRATE | every bounded window is an inclusive ISO pair rather than a relative preset, so the locked 90-day window cannot be silently rendered as 91 days |
| an explicit `LIMIT` above the allowlist size | INTEGRATE | the default row limit is 100 and an explicit larger limit means an eleventh event name could never be truncated into a silently-wrong zero |
| echoed `query` / `hogql` provenance | INTEGRATE | the API echoes the submitted `query` and the resolved `hogql` but **not** the project id — a real weakening against Plausible's `query.site_id` echo, stated here rather than dropped silently |
| response `results` rows | INTEGRATE | rows stay fail-closed for unknown and duplicate event names and for non-integer or negative counts |
| response `columns` equality assertion | INTEGRATE | `results` are positional arrays, so the exact column pair must be asserted or a reordered projection would swap the name and the count |
| bulk or recurring event export | OPT-OUT | documented as unsupported on an endpoint intended for ad-hoc and embedded use; the report needs aggregates and never raw events |
| OFFSET pagination | OPT-OUT | documented as unsupported for programmatic requests, and an OFFSET loop would silently return wrong totals; the response is bounded to at most ten rows |
| the Insights API and dashboard actions | OPT-OUT | retired by design per D-06 — querying raw event names is what removes the ten-dashboard-goals human gate, and dashboard actions would add a second stateful thing the owner must configure correctly |
| person, session, and cohort queries | OPT-OUT | contradicts MEAS-03 and D-04: no person profile is created to query, and the report counts occurrences only |
| `query_log` | OPT-OUT | not needed — the report asserts its own provenance from the echoed query rather than from a query history |
| async / polling query execution | OPT-OUT | not needed — a ten-row aggregate returns synchronously, and a polling path would add a failure mode the write-on-success report has no way to state |
| shared links and embedded dashboards | OPT-OUT | explicitly out of scope — the report must not be published; the artifact stays local and gitignored |
| funnels and user journeys | OPT-OUT | explicitly out of scope — asserts cohort progression the anonymous event stream cannot prove (D-04) |
| `refresh` cache controls | OPT-OUT | not needed — each run issues its own bounded query, and a cache-control knob would let two runs of the same range disagree for a reason the report could not state |

## FormSubmit — AJAX email delivery (re-decided from a full baseline)

| capability | decision | reason |
|---|---|---|
| cross-origin AJAX JSON POST | INTEGRATE | |
| named human-readable data fields | INTEGRATE | |
| `_subject` | INTEGRATE | |
| `_template` (table) | INTEGRATE | |
| `_captcha` | INTEGRATE | |
| `_honey` honeypot field | INTEGRATE | |
| `HAOO engagement context` field (new in this phase) | INTEGRATE | |
| `_cc` | OPT-OUT | explicitly out of scope — reserved so visitor input can never carbon-copy an arbitrary mailbox |
| `_next` | OPT-OUT | explicitly out of scope — the page owns its own confirmation state; a redirect target must never come from visitor input |
| `_autoresponse` | OPT-OUT | not needed yet — an automatic reply would claim a response the product owner has not yet made |
| `_replyto` | OPT-OUT | explicitly out of scope — reserved so visitor input cannot rewrite the reply address |
| file uploads | OPT-OUT | not needed — the qualification form has no file field |
| webhook forwarding | OPT-OUT | explicitly out of scope — v1 lead delivery is email-only (AGENTS.md) |

## Operational boundary

Production analytics enablement is OPT-IN AND ENABLED for this phase. PostHog is a different
processor in a different region with a different retention posture, so Plausible's approval was not
inherited (D-06) — it was re-taken, and the owner's own word is the record (04.1-11 Task 1). The
processor approval is recorded, the project exists, and the deployment workflow supplies the three
public build variables `VITE_HAOO_MEASUREMENT_PROVIDER`, `VITE_HAOO_POSTHOG_TOKEN` and
`VITE_HAOO_POSTHOG_API_HOST` to the build. The integration capabilities above are reached at runtime
by the loaded browser SDK rather than only fixture-verified.

Two things this repository does not establish, stated here rather than left to be inferred from a
green build. First, whether those three repository variables carry values: they are GitHub Actions
repository variables, created outside version control, and nothing in this tree can observe them. An
absent variable expands to the empty string, the selector fails closed to `none`, and the deployed
build captures nothing while every gate here still passes — so a green workflow run is not evidence
of a capturing deploy. Second, the live outcomes: ingestion acceptance of the three-property payload
and the absence of a person profile remain owner observations at the seven checkpoints 04.1-11
unblocked, not facts this tree has established (D-05).

The browser SDK is loaded by `src/measurement/posthog.ts`, which imports `posthog-js` in a value
position, so the vendor chunk ships in every build and the adapter resolves a real client instead of
refusing at an empty slot (D4, closed by 04.1-09). Delivery depends on the provider selector: events
reach the endpoint only on a build where `VITE_HAOO_MEASUREMENT_PROVIDER` is set to `posthog`, and
the deployment workflow now sets that selector from a repository variable, so every browser-SDK row
above records a capability that delivers on any deploy whose repository variables carry values,
rather than one held back by configuration. The bundle-level invariants the vendor chunk
contradicted were resolved in the same commit as the import — narrowed with named
successors, or re-justified by measuring each pattern against the emitted vendor chunk.

`POSTHOG_QUERY_API_KEY` and `POSTHOG_PROJECT_ID` are local report-process inputs;
neither is a browser capability, and neither may enter a `VITE_*` variable or the published bundle.

Analytics data is processed in the United States (D-08). The project lives on PostHog Cloud US, and
PostHog does not migrate a project between Cloud regions, so this is a one-way choice rather than a
deployment detail.

The all-time range begins at first PostHog ingestion because no prior provider data exists. No
Plausible history is imported, so an all-time count is a count since this project started receiving
events — not a count since the site launched — and the report says so rather than implying otherwise.

"Discard client IP data" is an owner-performed project setting the code cannot assert. Server-side
GeoIP enrichment has no client-side lever that keeps events bare: the `ip` option is deprecated and
has no effect, and `$geoip_disable` is an event property that would contradict the bare-name
payload. The suppression is therefore verified by the owner in project settings, and this row states
that limit rather than claiming the adapter closes it.
