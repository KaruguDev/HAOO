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
 * The key is optional because an undeclared variable is `undefined` and a declared but
 * unset one is `''`. Both — along with every other unsafe value — are rejected by
 * `resolveQualifyEndpoint` in favour of `QUALIFY_ENDPOINT_FALLBACK`, so a build with no
 * configuration at all still ships a working submission destination.
 */
interface ImportMetaEnv {
  readonly VITE_HAOO_FORM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Build-time approved analytics script sources (T-04-27, T-04-30).
 *
 * Statically replaced by Vite from version-controlled repository configuration, gated on
 * the resolved measurement provider. A build that has not deliberately selected the
 * provider inlines an empty array, so no analytics origin enters the bundle at all.
 *
 * Declared optional because it is genuinely absent under the test runner, which uses a
 * separate config with no `define`. The resolver that reads it must therefore fail closed
 * to an empty approved set rather than assume the constant exists.
 *
 * No `import` or `export` may be added to this file: that would turn it into a module and
 * silently drop the global `ImportMetaEnv` augmentation above, so the shape is written
 * inline rather than imported from the configuration module.
 */
declare const __HAOO_APPROVED_ANALYTICS_SCRIPT_SOURCES__:
  | readonly { readonly origin: string; readonly paths: readonly string[] }[]
  | undefined;
