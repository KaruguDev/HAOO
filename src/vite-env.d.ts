/// <reference types="vite/client" />

/**
 * Public build-time configuration (D-04).
 *
 * `VITE_HAOO_FORM_ENDPOINT` is statically replaced by Vite and is therefore a literal
 * in the published bundle, readable by anyone. It exists to keep the readable
 * `info@haoo.online` string out of the built assets so scrapers do not harvest it —
 * obfuscation, never secrecy (02-RESEARCH.md Pitfall 6). It is supplied as a GitHub
 * Actions repository *variable*, not a secret, and deployment documentation must keep
 * describing it that way.
 *
 * Every key is optional because an undeclared variable is `undefined` and a declared but
 * unset one is `''`. Both — along with every other unsafe value — are rejected by
 * `resolveQualifyEndpoint` in favour of `QUALIFY_ENDPOINT_FALLBACK`, and by
 * `resolveMeasurementProvider` / `resolvePostHogToken` / `resolvePostHogApiHost` in
 * favour of the inert no-op sink, so a build with no configuration at all still ships a
 * working submission destination and no analytics.
 *
 * All four are declared here, and the interface is exhaustive on purpose. Vite's own
 * `ImportMetaEnv` carries an `[key: string]: any` index signature, so an undeclared key
 * types as `any`: a renamed or misspelled variable would compile clean, resolve to
 * `undefined`, and fail closed to `'none'` — analytics silently off, with no build-time
 * signal that anything was wrong.
 */
interface ImportMetaEnv {
  readonly VITE_HAOO_FORM_ENDPOINT?: string;
  readonly VITE_HAOO_MEASUREMENT_PROVIDER?: string;
  readonly VITE_HAOO_POSTHOG_TOKEN?: string;
  readonly VITE_HAOO_POSTHOG_API_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Build-time approved analytics ingestion hosts (T-04.1-09).
 *
 * The destination events may be sent to, as distinct from the script source above: the
 * PostHog SDK is bundled rather than fetched from an approved origin (D-02), so the
 * ingestion host is the origin that governs what leaves the browser. Statically replaced
 * by Vite from version-controlled repository configuration, gated on the resolved
 * measurement provider, so a build that has not deliberately selected the provider
 * inlines an empty array and carries no ingestion origin at all.
 *
 * Declared optional because it is genuinely absent under the test runner, which uses a
 * separate config with no `define`. The resolver that reads it must therefore fail closed
 * to an empty approved set rather than to a permissive one — an ingestion host the
 * project never approved is precisely the failure this constant exists to prevent.
 *
 * No `import` or `export` may be added to this file: that would turn it into a module and
 * silently drop the global `ImportMetaEnv` augmentation above, so the shape is written
 * inline rather than imported from the configuration module.
 */
declare const __HAOO_APPROVED_ANALYTICS_HOSTS__:
  | readonly { readonly origin: string }[]
  | undefined;
