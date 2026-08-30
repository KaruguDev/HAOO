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
