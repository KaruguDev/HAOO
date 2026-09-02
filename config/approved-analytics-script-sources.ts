/**
 * Approved analytics script sources — the repository-owned trust anchor (T-04-27).
 *
 * This module deliberately lives OUTSIDE `src/` for two reasons:
 *
 * 1. Every file under `src/` is a production build input, and the boundary suite
 *    forbids an analytics origin literal in any of them. Writing the origin here keeps
 *    the provider-unset bundle free of it.
 * 2. The approved set must be *independently trusted*. It is version-controlled and
 *    code-reviewed, so it can only be widened by a reviewed repository change and a
 *    redeploy — never by editing a public deployment variable. `VITE_HAOO_PLAUSIBLE_SRC`
 *    can only ever *select from* this list; it can never add to it.
 *
 * The literal reaches a browser bundle through exactly one route: the build-time
 * constant `__HAOO_APPROVED_ANALYTICS_SCRIPT_SOURCES__` that `vite.config.ts` injects,
 * and only when the resolved provider is exactly `plausible`. This module must not
 * import anything from `src/`, and no production module under `src/` may import it.
 */

export interface ApprovedAnalyticsScriptSource {
  readonly origin: string;
  readonly paths: readonly string[];
}

/**
 * Exactly one approved origin, and exactly one approved path on it.
 *
 * Only the base script is approved. Every Plausible extension variant — outbound links,
 * file downloads, form capture, hash routing, revenue — is an OPT-OUT row in the phase
 * coverage matrix, so approving the base path alone makes that coverage decision
 * executable rather than documentary: an extension-variant URL fails closed to no
 * analytics instead of quietly enabling capture nobody approved.
 */
export const APPROVED_ANALYTICS_SCRIPT_SOURCES: readonly ApprovedAnalyticsScriptSource[] =
  Object.freeze([
    Object.freeze({
      origin: 'https://plausible.io',
      paths: Object.freeze(['/js/script.js']),
    }),
  ]);

/** The single provider value that is entitled to carry the approved contract. */
const APPROVED_CONTRACT_PROVIDER = 'plausible';

/**
 * Provider-gated selector consumed by `vite.config.ts`.
 *
 * Applies exactly the same trim-and-lowercase normalization as `resolveMeasurementProvider`
 * so the build cannot disagree with the runtime about which provider is configured. A
 * build that has not deliberately selected the provider inlines an empty list, which is
 * what keeps the approved origin out of the provider-unset bundle (T-04-30).
 */
export function approvedScriptSourcesForProvider(
  configuredProvider?: string,
): readonly ApprovedAnalyticsScriptSource[] {
  const candidate = (configuredProvider ?? '').trim().toLowerCase();

  return candidate === APPROVED_CONTRACT_PROVIDER ? APPROVED_ANALYTICS_SCRIPT_SOURCES : [];
}
