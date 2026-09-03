/**
 * Approved analytics ingestion hosts — the repository-owned trust anchor (T-04.1-09).
 *
 * This module deliberately lives OUTSIDE `src/` for two reasons:
 *
 * 1. Every file under `src/` is a production build input, and the boundary suite forbids
 *    the provider's ingestion host literal in any of them
 *    (`PROVIDER_INGESTION_HOST_SOURCE_FORBIDDEN`). Writing the origin here keeps every
 *    production module free of it, so no module can hardcode a route to the ingestion
 *    endpoint and a provider-unset build cannot address it at all.
 * 2. The approved set must be *independently trusted*. It is version-controlled and
 *    code-reviewed, so it can only be widened by a reviewed repository change and a
 *    redeploy — never by editing a public deployment variable. `VITE_HAOO_POSTHOG_API_HOST`
 *    can only ever *select from* this list; it can never add to it.
 *
 * The literal reaches a browser bundle through exactly one route: the build-time constant
 * `__HAOO_APPROVED_ANALYTICS_HOSTS__` that `vite.config.ts` injects, and only when the
 * resolved provider is exactly `posthog`. This module must not import anything from
 * `src/`, and no production module under `src/` may import it.
 *
 * This is the ingestion-host analogue of `config/approved-analytics-script-sources.ts`,
 * and it is a different kind of anchor: that module approves where a *script* may be
 * fetched from, this one approves where *events* may be sent to. The SDK is bundled
 * rather than fetched (D-02), so the script-source question does not arise for PostHog —
 * the destination question is what remains, and it is the one that matters for MEAS-02.
 */

export interface ApprovedAnalyticsHost {
  readonly origin: string;
}

/**
 * Exactly one approved ingestion origin.
 *
 * PostHog Cloud US (D-08) — analytics data is processed in the United States, which is a
 * decided, one-way choice: PostHog does not migrate a project between Cloud regions. The
 * EU ingestion origin is deliberately absent rather than listed-and-unused, so a build
 * cannot be pointed at a region the project's visitor-facing disclosure does not name.
 */
export const APPROVED_ANALYTICS_HOSTS: readonly ApprovedAnalyticsHost[] = Object.freeze([
  Object.freeze({ origin: 'https://us.i.posthog.com' }),
]);

/** The single provider value that is entitled to carry the approved contract. */
const APPROVED_CONTRACT_PROVIDER = 'posthog';

/**
 * Provider-gated selector consumed by `vite.config.ts`.
 *
 * Applies exactly the same trim-and-lowercase normalization as `resolveMeasurementProvider`
 * in `src/products/haoo.ts` so the build cannot disagree with the runtime about which
 * provider is configured. The comparison is exact equality against the normalized
 * candidate — never a prefix, suffix or substring test — so a near miss (`posthog-eu`,
 * `notposthog`, an absolute URL that merely contains the word) selects nothing.
 *
 * A build that has not deliberately selected the provider inlines an empty list, which is
 * what keeps the approved ingestion origin out of the provider-unset bundle entirely
 * rather than merely unused.
 */
export function approvedAnalyticsHostsForProvider(
  configuredProvider?: string,
): readonly ApprovedAnalyticsHost[] {
  const candidate = (configuredProvider ?? '').trim().toLowerCase();

  return candidate === APPROVED_CONTRACT_PROVIDER ? APPROVED_ANALYTICS_HOSTS : [];
}
