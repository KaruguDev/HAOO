# 261102-psi — Defer the PostHog SDK (supersedes D4, option A)

**Date:** 2026-11-02 · **Approved by:** product owner (PageSpeed review session)

## Context

PageSpeed (mobile and desktop) flagged *Reduce unused JavaScript* and *Avoid legacy
JavaScript* in red. About 80% of the unused bytes and all of the legacy bytes were the
`posthog-sdk` chunk (~90 KB gzip), which plan `04.1-09` bound in a value position
(deferred item D4, option A) so the SDK sat on every visitor's critical path.

D4 chose the eager import because a provider-gated dynamic import would drop events
fired in the same tick as the mount effect unless the project kept its own ordered
emission buffer.

## Decision

- `src/measurement/posthog.ts` keeps D4's value import of `posthog-js`. The adapter
  module itself, with its lockdown and the SDK it binds, is now fetched on demand by
  `src/measurement/posthog-deferred.ts` (`import('./posthog')`). The vendor chunk keeps
  its `posthog-sdk` name and ships in every build.
- Fetch timing (`scheduleWhenEngagedOrSettled`): first `pointerdown`, `keydown`,
  `touchstart`, `scroll`, `wheel` or `mousemove`, or 3 s after `window.load`,
  whichever comes first.
- `createDeferredPostHogEventSink` holds tracked events until the adapter is through
  every gate in `createPostHogEventSink`, then replays them in order. It holds only
  closed-allowlist event **names** (no properties, identifiers or form values, so MEAS-02
  and MEAS-03 are unaffected), at most 50, in memory only.
- Gates that need no SDK (provider selection, blank token/host) still decide
  synchronously. Refusal names moved to `posthog-refusal.ts` so the loader can signal
  one without fetching the adapter. Once `./posthog` has been evaluated (it registers
  itself), every call takes its original synchronous path, which is why the existing
  adapter suites run unchanged.
- A refused gate or a failed fetch discards the held names and never throws (MEAS-07).
- Alongside this change, the built stylesheet is inlined into `index.html`
  (`vite.config.ts`), removing the remaining render-blocking request.

## Consequences

- The SDK leaves the critical path. The automatic `$pageview` is sent when the SDK
  initializes, so it is delayed rather than dropped.
- **Known undercount:** a visitor who leaves within ~3 s of load without any
  interaction sends no `$pageview`. Expect a small drop in page-view counts relative to
  the eager build. Read week-over-week comparisons across 2026-11-02 with that in mind.
- `README.md` describes the on-demand load.
