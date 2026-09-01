# API Coverage — Plausible Analytics and FormSubmit

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Detector result at plan time: `{"detected":true,"signals":[{"verb":"(surface)","noun":"api"}]}`.
> Two external services are in this phase's scope: Plausible (new, MEAS-01/MEAS-08) and
> FormSubmit (existing, extended by MEAS-05). Each is enumerated from a full-coverage
> baseline; FormSubmit is re-decided from scratch rather than inheriting Phase 2 opt-outs.

## Plausible — browser event-collection API (site-specific script)

| capability | decision | reason |
|---|---|---|
| custom event by name (`plausible('<name>')`) | INTEGRATE | |
| pre-load event queue (`window.plausible.q` stub) | INTEGRATE | only real event calls enter this queue |
| pre-load options slot (`window.plausible.o`) | INTEGRATE | mirrors the documented provider bootstrap contract so initialization options are available before the managed script loads |
| pre-load initializer (`plausible.init(options)`) | INTEGRATE | writes options to `plausible.o`; it is not represented as an event-shaped queue entry |
| ten exact custom-event goals configured on the site | INTEGRATE | |
| automatic pageview capture | OPT-OUT | duplicates the explicit `haoo_page_view` event and can send a pageview before campaign parameters are stripped — initialized with `autoCapturePageviews: false` |
| custom event properties / property bag | OPT-OUT | explicitly out of scope — Phase 3 locks the sink to event-name-only (MEAS-02) |
| outbound-link automatic capture | OPT-OUT | duplicates the explicit assisted-contact and self-onboarding events and attaches destination URL data |
| file-download automatic capture | OPT-OUT | duplicates the explicit `haoo_brochure_download` event and attaches file URL data |
| form-submission automatic capture | OPT-OUT | duplicates the explicit `haoo_qualify_submit` event and can observe form field data |
| 404 tracking | OPT-OUT | not needed — this milestone owns no 404 route |
| hash-based routing support | OPT-OUT | not needed — static multi-page build with no runtime router |
| manual pageview / tagged-event extensions | OPT-OUT | not needed — the closed ten-name allowlist is the only event vocabulary |
| revenue / ecommerce tracking | OPT-OUT | not needed — this milestone sells nothing through the site |

## Plausible — Stats API v2

| capability | decision | reason |
|---|---|---|
| `POST /api/v2/query` | INTEGRATE | |
| metric `events` | INTEGRATE | |
| dimension `event:goal` | INTEGRATE | |
| filter `["is","event:goal",[…ten goals]]` | INTEGRATE | |
| `date_range` explicit inclusive ISO pair | INTEGRATE | |
| `date_range: "all"` | INTEGRATE | |
| bearer authentication from the local process environment | INTEGRATE | |
| echoed `query.site_id` provenance | INTEGRATE | counts are accepted only for the exact configured Plausible domain requested by the owner command |
| echoed `query.metrics`, `query.dimensions`, and goal-filter provenance | INTEGRATE | counts are accepted only for the single `events` metric, `event:goal` dimension, and exact ten-name filter |
| echoed bounded-range provenance | INTEGRATE | returned ISO timestamps must resolve to the exact inclusive days requested for each current and comparison period |
| echoed all-time range provenance | INTEGRATE | the resolved end day must equal the report day and the ISO start must be real, ordered, and non-future |
| response `results` rows | INTEGRATE | rows remain fail-closed for unknown/duplicate goals and invalid event counts after query provenance passes |
| person/session/engagement metrics | OPT-OUT | `visitors`, `visits`, `pageviews`, bounce/duration/depth metrics contradict D-04 and MEAS-08; the report counts occurrences only |
| metrics `conversion_rate`, `group_conversion_rate`, `percentage` | OPT-OUT | explicitly out of scope — D-04 forbids percentages and conversion vocabulary |
| dimensions `event:page`, `event:name`, `visit:*`, `time:*` | OPT-OUT | not needed — visit dimensions carry visitor-derived properties the report must not present |
| relative presets `7d` / `30d` / `91d` | OPT-OUT | `91d` cannot express the locked 90-day window (D-03); explicit inclusive ISO ranges are used for all bounded periods |
| `include.comparisons` | OPT-OUT | the provider comparison emits percentage change, which D-04 forbids; two explicit equal-length queries are issued instead |
| `include.imports` | OPT-OUT | not needed — no historical data is imported into the site |
| `include.time_labels` | OPT-OUT | not needed — the report renders no time series |
| `order_by` / pagination | OPT-OUT | not needed — the response is bounded to exactly ten goal rows |
| Sites API (programmatic site provisioning) | OPT-OUT | not needed — the owner creates the site once at the C-3 approval checkpoint |
| Shared links | OPT-OUT | explicitly out of scope — the report must not be published (A2); the artifact stays local and gitignored |
| Embed dashboard (iframe) | OPT-OUT | explicitly out of scope — password-protected dashboards cannot be embedded and the standard layout cannot satisfy D-01 through D-04 |
| Funnels / user journeys | OPT-OUT | explicitly out of scope — asserts cohort progression the anonymous event stream cannot prove (D-04) |

## Operational boundary

Production analytics enablement remains OPT-OUT for this gap-closure run because the privacy owner
approved the code path but deferred processor approval, dashboard setup, and deployment variables.
The integration capabilities above are implemented and fixture-verified while the provider selector
remains unset. `PLAUSIBLE_STATS_API_KEY` and `PLAUSIBLE_SITE_ID` are local report-process inputs;
neither is a browser capability, and neither may enter a `VITE_*` variable or the published bundle.

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
