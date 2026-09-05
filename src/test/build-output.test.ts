import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CONTEXT_RECORD_KEYS,
  MEASUREMENT_TRACK_ARGUMENT_COUNT,
  createMeasurement,
} from '../measurement';
import { HAOO_PRODUCT } from '../products/haoo';
import { qualifyCollectionNotePageContext } from '../products/copy';
import { buildSubmissionBody } from '../components/qualify-form.logic';
import {
  APPROVED_ANALYTICS_HOSTS,
  approvedAnalyticsHostsForProvider,
} from '../../config/approved-analytics-hosts';

const ROOT = resolve(import.meta.dirname, '../..');
const DIST = resolve(ROOT, 'dist');
/**
 * The HAOO document is this repository's ONE published page, at the site root.
 *
 * Plan `04.2-02` moved it there from `products/haoo/index.html` and pruned the
 * ZERO-PAPER HUB site root, so the former `SOURCE_ROOT_HTML` / `BUILT_ROOT_HTML` pair
 * (the parent site's own document) has no referent here and was removed with its four
 * `ROOT_*` metadata constants. Collapsing the two pairs into one is required, not
 * cosmetic: leaving both would have named the same file twice in `BUILD_OUTPUTS`, which
 * the freshness case reads.
 */
const SOURCE_HTML = resolve(ROOT, 'index.html');
const BUILT_HTML = resolve(ROOT, 'dist/index.html');
const PUBLIC_PDF = resolve(ROOT, 'public/brochure/HAOO-Marketing-Brochure.pdf');
const BUILT_PDF = resolve(ROOT, 'dist/brochure/HAOO-Marketing-Brochure.pdf');
const PDF_SHA256 = '38d5ad8e7497c65c4fa2d374e7ed5e8d81ab79f3b25d1e0daa73321d45b9e7a6';
const PRODUCT_TITLE = 'HAOO Property Management | ZERO-PAPER HUB';
const PRODUCT_DESCRIPTION = 'Run the business—not the paperwork with HAOO, a property-management platform for landlords and property managers in Kenya. Choose assisted or self-onboarding.';
const PRODUCT_URL = 'https://www.haoo.online/';
const PRODUCT_IMAGE = `${PRODUCT_URL}brochure/brochure-preview.png`;
const PUBLIC_PREVIEW = resolve(ROOT, 'public/brochure/brochure-preview.png');
const PREVIEW_SHA256 = '7e62c3b75a0bc7ba70c400b4ec63e93cbe51701da051127ba212be7c578c8087';
const PDF_ALTERNATE_LINK =
  '<link rel="alternate" type="application/pdf" href="/brochure/HAOO-Marketing-Brochure.pdf" title="HAOO Marketing Brochure (PDF)" />';
/**
 * The published asset directory, settled as `brochure/` in `04.2-SPLIT-CONTRACT.md`.
 *
 * NOT `assets/`, and that exclusion is load-bearing rather than stylistic: `assets/` is
 * Vite's default `build.assetsDir`, `BUILD_OUTPUTS` below reads EVERY file under
 * `dist/assets` unfiltered, and the credential scan then reads each one as text. Putting
 * a 2.3 MB PDF and three PNGs there would feed binaries into that scan while the build
 * still succeeded. `brochure/` is a directory Vite does not own, so the partition this
 * file depends on stays a partition over project code.
 */
const ASSET_DIR = '/brochure/';
const PRODUCT_ASSETS = [
  `${ASSET_DIR}HAOO-Marketing-Brochure.pdf`,
  `${ASSET_DIR}brochure-preview.png`,
  `${ASSET_DIR}haoo-hero.png`,
  `${ASSET_DIR}haoo-logo.png`,
];
/**
 * Derived, never restated. The notice is owner-approved byte-exact copy whose only
 * hand-typed copy lives in `measurement-page.test.tsx`; here the point of the assertion
 * is that whatever the approved builder produces actually survives into the shipped
 * bundle, so deriving it is stricter than a sixth literal that could drift silently.
 */
const APPROVED_COLLECTION_NOTICE = qualifyCollectionNotePageContext('HAOO');
/**
 * The notice is now assembled at runtime from one product-generic template, so the
 * bundle carries the template's static segments around each interpolated product name
 * rather than one contiguous sentence. Splitting the approved notice on the product
 * name reconstructs exactly those segments, and the last one carries the whole
 * owner-approved final clause — so a drifted word still fails here. Assembly itself is
 * covered by the rendered-page `textContent` equality in `measurement-page.test.tsx`.
 */
const APPROVED_NOTICE_BUNDLE_SEGMENTS = APPROVED_COLLECTION_NOTICE.split(
  HAOO_PRODUCT.name,
);

/**
 * Static boundary for the product surface, narrowed per file rather than deleted.
 *
 * Phase 1 forbade the same flat regex list in every product source. Phase 2 needs a
 * real provider request, so the boundary is now a per-file map: a file keeps every
 * group that still applies to it, and the two files that gained a capability lose
 * exactly one group each and keep the rest.
 *
 * - `src/products/haoo.ts` drops `PROVIDER_FORBIDDEN` only. It names the FormSubmit
 *   endpoint as build data; it still may not open a network call or render form markup.
 * - `src/components/QualifyForm.tsx` drops `NETWORK_FORBIDDEN` and
 *   `FORM_MARKUP_FORBIDDEN` only. It is the single module allowed to `fetch` and to
 *   render a `<form>`; it still may not hardcode the provider, because the endpoint
 *   must arrive through product data.
 * - `src/measurement/posthog.ts` and `src/measurement/posthog-lockdown.ts` keep the
 *   full static boundary plus the explicit measurement privacy group. The SDK is a
 *   pinned dependency rather than a script this project injects, so the adapter that
 *   replaced the previous one needs no script-element capability and is granted nothing
 *   extra: no storage, no network-call API, no form markup, no provider endpoint, and no
 *   second event argument.
 *
 * Every other product source keeps all four groups, and `ALWAYS_FORBIDDEN` — storage,
 * analytics, injection, router, ambient browser context and backend seams — applies to
 * every file without exception, including the two above.
 */
const ALWAYS_FORBIDDEN = [
  /dangerouslySetInnerHTML/,
  /localStorage|sessionStorage|document\.cookie|indexedDB/,
  /gtag\(|dataLayer|analytics\./,
  /react-router|createBrowserRouter/,
  /document\.referrer|navigator\.userAgent|window\.location/,
  /supabase/i,
] as const;
const NETWORK_FORBIDDEN = [/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/] as const;
const PROVIDER_FORBIDDEN = [/formsubmit/] as const;
const FORM_MARKUP_FORBIDDEN = [/FormData|<form\b/] as const;
const MEASUREMENT_PRIVACY_FORBIDDEN = [
  /\b(?:visitor|user|device|session)(?:Id|ID)\b/,
  /\b(?:uuid|fingerprint)\b/i,
  /\b(?:eventQueue|clickstream)\b/i,
  /(?:track|eventSink)\s*\([^,\n]+,/,
] as const;

const FULL_BOUNDARY = [
  ...ALWAYS_FORBIDDEN,
  ...NETWORK_FORBIDDEN,
  ...PROVIDER_FORBIDDEN,
  ...FORM_MARKUP_FORBIDDEN,
] as const;

// The measurement facade is the sole browser-capability boundary. It needs
// storage and the current URL for bounded context/campaign handling, but it
// keeps every unrelated prohibition plus explicit privacy-channel guards.
const MEASUREMENT_FACADE_BOUNDARY = [
  /dangerouslySetInnerHTML/,
  /gtag\(|dataLayer|analytics\./,
  /react-router|createBrowserRouter/,
  /supabase/i,
  ...NETWORK_FORBIDDEN,
  ...PROVIDER_FORBIDDEN,
  ...FORM_MARKUP_FORBIDDEN,
  ...MEASUREMENT_PRIVACY_FORBIDDEN,
] as const;

const PRODUCT_SOURCE_BOUNDARY: Readonly<Record<string, readonly RegExp[]>> = {
  'src/pages/ProductPage.tsx': FULL_BOUNDARY,
  'src/components/BrochurePanel.tsx': FULL_BOUNDARY,
  'src/components/OnboardingChoices.tsx': FULL_BOUNDARY,
  'src/components/MeasurementDisclosure.tsx': FULL_BOUNDARY,
  'src/components/ProductHeader.tsx': FULL_BOUNDARY,
  'src/products/copy.ts': FULL_BOUNDARY,
  'src/products/engagement-summary.ts': FULL_BOUNDARY,
  'src/products/types.ts': FULL_BOUNDARY,
  'src/products/haoo.ts': [
    ...ALWAYS_FORBIDDEN,
    ...NETWORK_FORBIDDEN,
    ...FORM_MARKUP_FORBIDDEN,
  ],
  'src/measurement/index.ts': MEASUREMENT_FACADE_BOUNDARY,
  'src/measurement/posthog.ts': [
    ...FULL_BOUNDARY,
    ...MEASUREMENT_PRIVACY_FORBIDDEN,
  ],
  'src/measurement/posthog-lockdown.ts': [
    ...FULL_BOUNDARY,
    ...MEASUREMENT_PRIVACY_FORBIDDEN,
  ],
  'src/components/QualifyForm.tsx': [...ALWAYS_FORBIDDEN, ...PROVIDER_FORBIDDEN],
  'src/components/qualify-form.logic.ts': FULL_BOUNDARY,
  'src/components/QualifyFallback.tsx': FULL_BOUNDARY,
};

function readText(path: string) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function sha256(path: string) {
  return existsSync(path)
    ? createHash('sha256').update(readFileSync(path)).digest('hex')
    : '';
}

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

const PRODUCTION_SOURCE_INPUTS = listFiles(resolve(ROOT, 'src')).filter(
  (path) => !path.startsWith(`${resolve(ROOT, 'src/test')}/`),
);
/**
 * The repository-owned approved analytics *ingestion hosts* and the build wiring that
 * carries them. The contract lives outside `src/` on purpose, so it is not a production
 * source input — but it *is* a build input all the same: editing the trusted host list
 * changes what a configured build publishes, so a stale `dist` must fail freshness.
 */
const APPROVED_HOST_CONFIG_INPUT = {
  contract: resolve(ROOT, 'config/approved-analytics-hosts.ts'),
  viteConfig: resolve(ROOT, 'vite.config.ts'),
} as const;
/** No production module may reach the approved-host contract by any specifier. */
const APPROVED_HOST_MODULE_FORBIDDEN = /approved-analytics-hosts/;
const BUILD_INPUTS = [
  ...PRODUCTION_SOURCE_INPUTS,
  ...listFiles(resolve(ROOT, 'public')),
  // One document, named once. `SOURCE_HTML` IS the root `index.html` since `04.2-02`
  // moved it there, so the former separate `resolve(ROOT, 'index.html')` entry would now
  // be the same path twice.
  SOURCE_HTML,
  APPROVED_HOST_CONFIG_INPUT.contract,
  resolve(ROOT, 'vite.config.ts'),
  resolve(ROOT, 'package.json'),
];

/**
 * Competitor analytics origins no supported build configuration may ever publish.
 *
 * Narrowed to the origins this project will never bundle. The vendor token this project
 * now ships as a dependency was removed from this list deliberately — see
 * `PROVIDER_INGESTION_HOST_SOURCE_FORBIDDEN` below for the successor invariant and the
 * record of what was withdrawn. Applied at BOTH sites — production source and built
 * bundle — because it remains true and falsifiable at both.
 */
const UNCONDITIONAL_ANALYTICS_ORIGINS_FORBIDDEN = [
  /googletagmanager|google-analytics|umami|segment\.com/i,
] as const;

/**
 * Successor to the delivery-mechanism half of the guarantee plan `04-08` established,
 * withdrawn here deliberately and replaced rather than deleted.
 *
 * What this proves: the provider's ingestion host literal never enters a module under
 * `src/`. The host is repository-owned data — it lives in the configuration module
 * outside `src/` and reaches a bundle only through the provider-gated build-time
 * constant — so no production module can hardcode a route to the ingestion endpoint,
 * and a provider-unset build cannot address it at all.
 *
 * What this no longer proves: that the built bundle contains no provider origin. `04-08`
 * asserted exactly that over `builtBundleText()`, on the premise that the analytics
 * script arrived at runtime from an approved script origin. This project now imports the
 * SDK instead, so the vendor's own default host string necessarily ships inside the
 * vendor chunk and that bundle-level prohibition can no longer be stated truthfully. It
 * is withdrawn, not weakened by silence: the claim it made is replaced by this
 * source-level invariant plus the runtime proof that an unset provider selector never
 * initializes the SDK. A later reader must be able to see the narrowing as a recorded
 * decision rather than mistake it for an unnoticed regression.
 *
 * Applied ONLY at the production-source site. Asserting it over the bundle would be a
 * claim about the vendor's published artifact, not about this repository.
 */
export const PROVIDER_INGESTION_HOST_SOURCE_FORBIDDEN = [/us\.i\.posthog\.com/i] as const;

/**
 * Identity, fingerprint and ordered-queue seams — asserted against production source,
 * relocated here from the built-bundle scan.
 *
 * These two patterns previously ran over `builtBundleText()`. A minified vendor SDK
 * legitimately contains identifier and queue tokens of its own, so asserting them
 * against the bundle would be a claim about the vendor's implementation rather than
 * about this project. Asserting them against every module under `src/` is exactly the
 * claim MEAS-02 and MEAS-03 depend on: this project derives no stable per-visitor
 * identifier and keeps no ordered emission queue of its own.
 */
const MEASUREMENT_IDENTITY_SOURCE_FORBIDDEN = [
  /\b(?:visitor|user|device|session)(?:Id|ID)\b/,
  /\b(?:uuid|fingerprint|clickstream|eventQueue)\b/i,
] as const;

/**
 * Credential-only report shapes must never enter any browser bundle.
 *
 * `Authorization` and `Bearer ` stay on the WHOLE-bundle scan, and since plan `04.1-09`
 * that scope rests on a measurement rather than on the claim it replaces.
 *
 * What this comment used to say: that both shapes "were verified absent from the
 * published SDK artifact". That verification was taken before any build emitted the
 * vendor chunk — `posthog-js` was a pinned dependency nothing imported as a value — so
 * nothing had re-run it against a shipping artifact, and it was inherited rather than
 * re-established. `04.1-09` bound the SDK in a value position, which put a third party's
 * minified artifact into every build and made the inherited claim load-bearing for the
 * first time.
 *
 * What was measured instead, in the commit that bound it: every pattern in this group,
 * plus every pattern in `UNCONDITIONAL_ANALYTICS_ORIGINS_FORBIDDEN`, applied to the
 * emitted `posthog-sdk` chunk ALONE at pinned version 1.425.1. All four shapes here were
 * no-hit; the competitor-origin group was no-hit; the event-with-property-bag pattern was
 * no-hit. The SDK carries a Segment integration and issues authorized requests against
 * `/api/…` paths at runtime, but it composes those header and path strings rather than
 * shipping these literals, so the scope of the case that applies this group is
 * RE-JUSTIFIED by that measurement rather than assumed — and it stays a claim this
 * repository can make about its whole bundle.
 *
 * This must be re-measured at any version bump. It is not left as prose: the case
 * `keeps the vendor chunk itself free of every report credential shape` pins it, so a
 * future SDK version that introduced one of these literals goes red there rather than
 * quietly invalidating this paragraph.
 */
const REPORT_CREDENTIAL_BUNDLE_FORBIDDEN = [
  /POSTHOG_QUERY_API_KEY/,
  /Authorization/,
  /Bearer\s/,
  /\/api\/projects\/[^/]*\/query/,
] as const;
const BUILD_OUTPUTS = [
  // Likewise one built document: `BUILT_HTML` IS `dist/index.html`.
  BUILT_HTML,
  ...listFiles(resolve(DIST, 'assets')),
];

/**
 * Every browser-prefixed workflow assignment, read as a NAME and a VALUE.
 *
 * Added by code-review WR-02. The credential gate below used to read workflow text only
 * for names it already knew to forbid, which is a prohibition an unbounded set of names
 * can walk around: a credential assigned to `VITE_ANYTHING_AT_ALL` carries the forbidden
 * name on the value side, where nothing was looking.
 *
 * Parsed with a line-anchored regex over the file's own text rather than by shelling out
 * to a YAML tool. That is deliberate on two counts: the workflow's text is what a reader
 * and a reviewer see, and — since this file's inputs include repository content — building
 * a command line out of them would put an injection surface inside the very gate that
 * exists to keep credentials out of a build. Nothing here is executed, interpolated into a
 * shell, or passed to a process.
 *
 * `VITE_` is the prefix, because it is Vite's own inlining trigger: a variable carrying it
 * is inlined into world-readable JavaScript, and one that does not is not. The value is
 * captured verbatim to end of line, trailing comment and all, so a rule written against it
 * cannot be dodged by what follows on the same line.
 */
function browserPrefixedAssignments(workflowText: string) {
  return [...workflowText.matchAll(/^ +(VITE_[A-Z0-9_]*): *(.*)$/gmu)]
    .map(([, name, value]) => ({ name, value: value.trim() }));
}

/**
 * The one form a browser-prefixed value may take: a repository VARIABLE expression.
 *
 * An allowlist, not a denylist on `secrets.`. A denylist would pass a literal
 * `VITE_HAOO_ANALYTICS_KEY: phx_liveKey`, which is the same leak with the expression
 * removed, and it would pass `${{ github.event.* }}` — attacker-controlled text inlined
 * into the shipped bundle. `vars.*` is the only source whose contents are world-readable
 * by construction, which is exactly the property `dist` gives everything it carries.
 */
const REPOSITORY_VARIABLE_EXPRESSION = /^\$\{\{ *vars\.[A-Z0-9_]+ *\}\}$/u;

/** A value drawn from the secrets context, in either interpolation spelling. */
const SECRETS_CONTEXT = /\bsecrets\s*[.[]/u;

function newestInput() {
  return BUILD_INPUTS
    .map((path) => ({ path, mtimeMs: statSync(path).mtimeMs }))
    .reduce((newest, input) => (input.mtimeMs > newest.mtimeMs ? input : newest));
}

function oldestOutput() {
  return BUILD_OUTPUTS
    .map((path) => ({ path, mtimeMs: statSync(path).mtimeMs }))
    .reduce((oldest, output) => (output.mtimeMs < oldest.mtimeMs ? output : oldest));
}

/**
 * The built bundle, or a loud failure — never the empty string.
 *
 * `listFiles` returns `[]` for a missing directory, so this helper used to return `''`
 * when `dist/` had not been built. Every prohibition expressed as
 * `expect(bundle).not.toMatch(...)` then PASSED against nothing: the credential-boundary
 * scan, the identity-channel scan, and the approved-ingestion-origin absence case all
 * reported green on a build that was never produced. The staleness case fails separately,
 * but it is a different test — a reader scanning results saw the security assertions pass.
 *
 * `npm test` chains `npm run build` first, but `npm run test:unit` (documented and used)
 * does not, so the vacuity was reachable in normal use. Throwing here converts a silent
 * false green into an actionable message naming the command that fixes it.
 */
function builtBundleText() {
  const files = listFiles(resolve(DIST, 'assets')).filter((file) => file.endsWith('.js'));
  if (files.length === 0) {
    throw new Error(
      'No built bundle to scan under dist/assets. Run `npm run build` before asserting against the bundle.',
    );
  }

  return files.map((file) => readFileSync(file, 'utf8')).join('\n');
}

/**
 * The name `vite.config.ts` gives the isolated vendor chunk, and the partition key every
 * helper below reads. Restated here rather than imported because importing the Vite
 * config into the test would evaluate the `define` block and the approved-host contract
 * as a side effect; the pairing is asserted instead by the vendor-identity case, which
 * fails if this name stops matching what the build actually emits.
 */
const VENDOR_CHUNK_NAME = 'posthog-sdk';
/**
 * The exact pinned SDK version, derived from `package.json` rather than restated.
 *
 * The pin is exact (no range), so this string must appear in the emitted vendor chunk. It
 * is the marker the vendor-identity case uses to prove the exclusion really does contain
 * the SDK, and deriving it means a pin that changed without the chunk changing — or a
 * chunk that stopped being the SDK — goes red rather than passing on a stale literal.
 */
const PINNED_SDK_VERSION = (
  JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as {
    dependencies: Record<string, string>;
  }
).dependencies['posthog-js'];

function chunkFilesIn(dir: string) {
  return listFiles(resolve(dir, 'assets')).filter((file) => file.endsWith('.js'));
}

/**
 * The vendor side of the `dist/assets` partition, or a loud failure — never `[]`.
 *
 * Same discipline as `builtBundleText` above, and for the same reason: a partition that
 * silently returned nothing would let every `expect(...).not.toMatch(...)` in this file
 * pass against the empty string. An empty partition is a broken build or a renamed chunk,
 * not a clean one, so it throws and names the command that fixes it.
 */
function vendorChunkFiles(dir: string = DIST) {
  const files = chunkFilesIn(dir).filter((file) =>
    file.includes(VENDOR_CHUNK_NAME),
  );
  if (files.length === 0) {
    throw new Error(
      `No ${VENDOR_CHUNK_NAME} chunk under ${dir}/assets. Since plan 04.1-09 a value import of `
      + 'posthog-js means every build emits one. Run `npm run build`, and if it is still absent '
      + `check that build.rollupOptions.output.manualChunks in vite.config.ts still names '${VENDOR_CHUNK_NAME}'.`,
    );
  }

  return files;
}

/**
 * This project's own chunks — everything the vendor partition does not claim.
 *
 * Guarded in the same direction: an empty project side would mean the seed list in
 * `vite.config.ts` had swallowed the whole bundle, and every project-scoped prohibition
 * below would then be a claim about nothing at all. That is the exact failure the
 * companion vendor-identity case exists to catch, and this guard is its first line.
 */
function projectChunkFiles(dir: string = DIST) {
  const files = chunkFilesIn(dir).filter(
    (file) => !file.includes(VENDOR_CHUNK_NAME),
  );
  if (files.length === 0) {
    throw new Error(
      `No project chunks under ${dir}/assets — every emitted chunk matched the ${VENDOR_CHUNK_NAME} `
      + 'partition. Run `npm run build`, and if the partition is still total, the manualChunks seed '
      + 'list in vite.config.ts is capturing this project\'s own modules.',
    );
  }

  return files;
}

function readChunks(files: readonly string[]) {
  return files.map((file) => readFileSync(file, 'utf8')).join('\n');
}

/**
 * The joined text of this project's own chunks — the subject of every prohibition that
 * stopped being truthful over the whole bundle once the vendor chunk started shipping.
 */
function projectBundleText(dir: string = DIST) {
  return readChunks(projectChunkFiles(dir));
}

function vendorBundleText(dir: string = DIST) {
  return readChunks(vendorChunkFiles(dir));
}

function noScriptMarkup(html: string) {
  return html.match(/<noscript>([\s\S]*?)<\/noscript>/i)?.[1] ?? '';
}

function noScriptFormRecoveryMarkup(html: string) {
  return noScriptMarkup(html).match(
    /<section aria-label="HAOO qualification form recovery">([\s\S]*?)<\/section>/i,
  )?.[1] ?? '';
}

describe('public build-time configuration declarations', () => {
  const DECLARATIONS = resolve(ROOT, 'src/vite-env.d.ts');
  const ENV_KEY = /import\.meta\.env\.(VITE_[A-Z0-9_]+)/gu;

  /**
   * Vite ships `interface ImportMetaEnv { [key: string]: any }`, and the project's own
   * declaration merges with it rather than replacing it. So a renamed or misspelled
   * variable still types as `any`, compiles clean, resolves to `undefined`, and fails
   * closed — analytics silently off with no build-time signal at all. The type system
   * cannot close that hole; this scan is the build-time signal instead.
   */
  it('declares every public build variable the production sources read', () => {
    const declarations = readFileSync(DECLARATIONS, 'utf8');
    const referenced = new Set<string>();

    for (const path of PRODUCTION_SOURCE_INPUTS) {
      if (path === DECLARATIONS) continue;
      for (const match of readFileSync(path, 'utf8').matchAll(ENV_KEY)) {
        referenced.add(match[1]);
      }
    }

    expect(referenced.size).toBeGreaterThan(0);
    const undeclared = [...referenced].filter(
      (key) => !new RegExp(`readonly ${key}\\?*:`, 'u').test(declarations),
    );

    expect(
      undeclared,
      `Undeclared public build variable(s) ${undeclared.join(', ')}. Add them to src/vite-env.d.ts or fix the spelling; an undeclared key types as \`any\` and silently resolves to undefined.`,
    ).toEqual([]);
  });

  it('declares no public build variable no production source reads', () => {
    const declared = [
      ...readFileSync(DECLARATIONS, 'utf8').matchAll(/readonly (VITE_[A-Z0-9_]+)\??:/gu),
    ].map((match) => match[1]);
    const referenced = new Set(
      PRODUCTION_SOURCE_INPUTS
        .filter((path) => path !== DECLARATIONS)
        .flatMap((path) => [...readFileSync(path, 'utf8').matchAll(ENV_KEY)]
          .map((match) => match[1])),
    );

    expect(declared.length).toBeGreaterThan(0);
    expect(declared.filter((key) => !referenced.has(key))).toEqual([]);
  });
});

describe('Phase 1 build artifact freshness', () => {
  it('requires every production build output to exist', () => {
    const missingOutputs = BUILD_OUTPUTS.filter((path) => !existsSync(path));

    expect(
      missingOutputs,
      `Missing build output ${missingOutputs[0] ?? BUILT_HTML}. Run npm run build before asserting against dist/index.html.`,
    ).toEqual([]);
  });

  it('scans a non-empty set of production build inputs', () => {
    expect(BUILD_INPUTS.length).toBeGreaterThan(0);
    expect(BUILD_INPUTS.every((path) => existsSync(path))).toBe(true);
  });

  it('rejects outputs older than the newest production build input', () => {
    const input = newestInput();
    const output = oldestOutput();

    expect(
      output.mtimeMs,
      `Stale build output ${output.path} (${new Date(output.mtimeMs).toISOString()}) is older than build input ${input.path} (${new Date(input.mtimeMs).toISOString()}). Run npm run build.`,
    ).toBeGreaterThanOrEqual(input.mtimeMs);
  });
});

describe('Phase 1 static build contracts', () => {
  it('[phase1-red:build] emits a physical HAOO document at its published path', () => {
    expect(existsSync(SOURCE_HTML)).toBe(true);
    expect(existsSync(BUILT_HTML)).toBe(true);
  });

  /**
   * Renamed from `contains exact source and built canonical/social metadata` by plan
   * `04.2-02`, and the NAMED SUCCESSOR to the retired case below. The HAOO document is
   * this site's root document now, so the two former metadata cases describe one file;
   * this one absorbed the two assertions the retired case carried that it did not
   * already have — the icon asset existing in both the public tree and the built output,
   * and the wider scaffolding-vendor negative check.
   */
  it('publishes first-party HAOO root canonical and social metadata', () => {
    for (const html of [readText(SOURCE_HTML), readText(BUILT_HTML)]) {
      expect(html).toContain(`<title>${PRODUCT_TITLE}</title>`);
      expect(html).toContain(`name="description" content="${PRODUCT_DESCRIPTION}"`);
      expect(html).toContain(`rel="canonical" href="${PRODUCT_URL}"`);
      expect(html).toContain('property="og:type" content="website"');
      expect(html).toContain(`property="og:title" content="${PRODUCT_TITLE}"`);
      expect(html).toContain(`property="og:description" content="${PRODUCT_DESCRIPTION}"`);
      expect(html).toContain('property="og:site_name" content="ZERO-PAPER HUB"');
      expect(html).toContain(`property="og:url" content="${PRODUCT_URL}"`);
      expect(html).toContain(`property="og:image" content="${PRODUCT_IMAGE}"`);
      expect(html).toContain('name="twitter:card" content="summary_large_image"');
      expect(html).toContain(`name="twitter:title" content="${PRODUCT_TITLE}"`);
      expect(html).toContain(`name="twitter:description" content="${PRODUCT_DESCRIPTION}"`);
      expect(html).toContain(`name="twitter:image" content="${PRODUCT_IMAGE}"`);
      // Absorbed from the retired root-metadata case: the WIDER form of the
      // scaffolding-vendor negative check, not just its default social image.
      expect(html).not.toContain('bolt.new');
    }

    // Absorbed from the retired root-metadata case: the document's icon must exist in
    // both the public tree and the built output. Derived from the document's own `href`
    // rather than restated, so re-pointing the icon cannot leave this asserting a path
    // the page no longer references.
    const icon = /<link rel="icon"[^>]*href="([^"]+)"/.exec(readText(SOURCE_HTML))?.[1];
    expect(icon, 'the HAOO document declares an icon').toBeTruthy();
    expect(existsSync(resolve(ROOT, `public${icon}`))).toBe(true);
    expect(existsSync(resolve(DIST, (icon ?? '').slice(1)))).toBe(true);
  });

  /*
   * WITHDRAWN by plan `04.2-02`. Successor:
   * `publishes first-party HAOO root canonical and social metadata` (above).
   *
   * What this case claimed: that the site's ROOT document published ZERO-PAPER HUB's own
   * first-party title, description, canonical, Open Graph and Twitter metadata — and that
   * the company favicon it referenced existed in both `public/` and `dist/` — asserted
   * over `index.html` and `dist/index.html`, which at the time were the PARENT site's
   * document, distinct from the nested HAOO product page.
   *
   * What stopped being true, and why: `04.2-02` split the two products into separate
   * repositories. The parent site's document is not in this repository at all — it travels
   * to ZERO-PAPER HUB in plan `04.2-06` — and the HAOO document moved to the site root.
   * The root document here is now the HAOO document, so every ZPH-shaped literal this case
   * asserted (`ROOT_TITLE`, `ROOT_DESCRIPTION`, `ROOT_URL`, `ROOT_IMAGE`, the company
   * favicon) has no referent. The case could not be narrowed: its subject moved out.
   *
   * What the successor proves instead: exactly the same property — that the document
   * served at this site's root carries complete, first-party, non-scaffolding canonical
   * and social metadata, asserted from BOTH the source and the built HTML in one loop —
   * about the document this repository actually publishes. The two absorbed assertions
   * above are the parts the product-metadata case did not already carry.
   *
   * Retained rather than deleted: a reader comparing this suite against Phase 1's
   * inventory must be able to see a recorded narrowing rather than read a missing
   * root-metadata case as an assertion that was dropped when the repository split
   * (D-05, SC6).
   */

  it('references emitted scripts, styles, and product assets from built HTML', () => {
    const html = readText(BUILT_HTML);
    const assetPaths = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]
      .map(([, path]) => path);

    expect(assetPaths.length).toBeGreaterThan(0);
    for (const assetPath of assetPaths) {
      expect(existsSync(resolve(ROOT, `dist${assetPath}`))).toBe(true);
    }
  });

  it('publishes the supplied social/preview image referenced by the product metadata', () => {
    expect(existsSync(PUBLIC_PREVIEW)).toBe(true);
    expect(sha256(PUBLIC_PREVIEW)).toBe(PREVIEW_SHA256);
    expect(readText(SOURCE_HTML)).toContain(PRODUCT_IMAGE);
  });

  it('publishes the original brochure bytes at the public and built paths', () => {
    expect(existsSync(PUBLIC_PDF)).toBe(true);
    expect(existsSync(BUILT_PDF)).toBe(true);
    expect(sha256(PUBLIC_PDF)).toBe(PDF_SHA256);
    expect(sha256(BUILT_PDF)).toBe(PDF_SHA256);
    expect(readText(BUILT_HTML)).toContain(`${ASSET_DIR}HAOO-Marketing-Brochure.pdf`);
  });

  it('declares the original brochure as a static alternate of the product document', () => {
    for (const html of [readText(SOURCE_HTML), readText(BUILT_HTML)]) {
      expect(html).toContain(PDF_ALTERNATE_LINK);
    }
  });

  it('publishes centralized onboarding destinations without requiring JavaScript', () => {
    const expectedHrefs = [
      HAOO_PRODUCT.contacts.whatsappHref,
      HAOO_PRODUCT.contacts.phoneHref,
      HAOO_PRODUCT.contacts.emailHref,
      HAOO_PRODUCT.contacts.selfOnboardingHref,
      HAOO_PRODUCT.brochure.pdfHref,
    ];

    for (const html of [readText(SOURCE_HTML), readText(BUILT_HTML)]) {
      const markup = noScriptMarkup(html);
      expect(markup).not.toBe('');

      const hrefs = [...markup.matchAll(/href="([^"]+)"/g)].map(([, href]) => href);
      expect(hrefs.slice(0, expectedHrefs.length)).toEqual(expectedHrefs);
      expect(markup).toContain('HAOO is a ZERO-PAPER HUB product.');
      expect(markup).toContain(HAOO_PRODUCT.assistedInvitation);
      expect(markup).toContain('These contact links leave the ZERO-PAPER HUB product page.');
      expect(markup).toContain(
        `The self-onboarding link opens ${HAOO_PRODUCT.contacts.selfOnboardingDisplay} outside ZERO-PAPER HUB.`,
      );

      const whatsappUrl = new URL(hrefs[0]);
      const decodedStarterText = whatsappUrl.searchParams.get('text');
      expect([...decodedStarterText ?? '']).toEqual([
        ...HAOO_PRODUCT.contacts.whatsappStarterText,
      ]);
      expect([...whatsappUrl.searchParams.keys()]).toEqual(['text']);
    }
  });

  it('publishes one truthful no-JavaScript qualification recovery panel', () => {
    const expectedLinks = [
      {
        href: HAOO_PRODUCT.contacts.whatsappHref,
        text: 'Message HAOO on WhatsApp instead',
      },
      {
        href: HAOO_PRODUCT.contacts.phoneHref,
        text: 'Call HAOO on +254 702 188 044 instead',
      },
      {
        href: HAOO_PRODUCT.contacts.emailHref,
        text: 'Email HAOO at info@haoo.online instead',
      },
    ];

    for (const html of [readText(SOURCE_HTML), readText(BUILT_HTML)]) {
      const noScript = noScriptMarkup(html);
      const recovery = noScriptFormRecoveryMarkup(html);

      expect(noScript.match(/This form needs JavaScript/g) ?? []).toHaveLength(1);
      expect(recovery).toContain(
        'Turn on JavaScript to send your details, or reach HAOO directly — the team can take the same details over WhatsApp, by phone, or by email.',
      );

      const links = [...recovery.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)]
        .map(([, href, text]) => ({ href, text }));

      expect(links).toEqual(expectedLinks);
      for (const forbidden of [
        /<form\b/i,
        /formsubmit/i,
        /_next/i,
        /captcha/i,
        /<script\b/i,
        /\bfetch\s*\(/i,
      ]) {
        expect(recovery, String(forbidden)).not.toMatch(forbidden);
      }
    }
  });

  it('keeps the no-script fallback free of active or tracked markup', () => {
    const forbiddenPatterns = [
      /<script\b/i,
      /\son[a-z]+\s*=/i,
      /<form\b/i,
      /\sstyle\s*=/i,
      /utm_/i,
    ];

    for (const html of [readText(SOURCE_HTML), readText(BUILT_HTML)]) {
      const markup = noScriptMarkup(html);
      expect(markup).not.toBe('');

      for (const forbidden of forbiddenPatterns) {
        expect(markup).not.toMatch(forbidden);
      }
    }
  });

  it('copies every referenced product asset into the uploaded artifact', () => {
    const bundle = builtBundleText();

    for (const assetPath of PRODUCT_ASSETS) {
      expect(existsSync(resolve(ROOT, `public${assetPath}`))).toBe(true);
      expect(existsSync(resolve(DIST, assetPath.slice(1)))).toBe(true);
      expect(bundle).toContain(assetPath);
    }
  });

  it('resolves every root-relative product reference inside the artifact', () => {
    const references = new Set(
      [...`${readText(BUILT_HTML)}\n${builtBundleText()}`
        .matchAll(/\/brochure\/[A-Za-z0-9._-]+/g)]
        .map(([reference]) => reference),
    );

    expect(references.size).toBeGreaterThan(0);
    for (const reference of references) {
      expect(existsSync(resolve(DIST, reference.slice(1)))).toBe(true);
    }
  });

  it('uploads exactly the built dist tree that the Pages workflow deploys', () => {
    const workflow = readText(resolve(ROOT, '.github/workflows/deploy.yml'));

    expect(workflow).toContain('path: ./dist');
    // One literal per repository. `CNAME` exists in both halves of the split and the two
    // hold DIFFERENT hostnames, so this pin is the cheapest guard against the canonical,
    // the two Open Graph URLs and the Twitter image drifting apart from the host the site
    // is actually served on.
    //
    // The value is the `www` leg, not the apex: the owner reversed decision (a) on
    // 2026-09-06, after 04.2-02 had shipped `haoo.online`. This one line is what makes
    // `www.haoo.online` canonical and leaves GitHub Pages redirecting the apex to it — the
    // apex already carries the four A and four AAAA Pages records, so that redirect is
    // automatic and needs no second recovery document.
    expect(readText(resolve(ROOT, 'CNAME')).trim()).toBe('www.haoo.online');
  });

  it('keeps the product surface inside its narrowed static boundary', () => {
    for (const [relativePath, forbiddenGroup] of Object.entries(PRODUCT_SOURCE_BOUNDARY)) {
      const source = readText(resolve(ROOT, relativePath));

      expect(source, relativePath).not.toBe('');
      for (const forbidden of forbiddenGroup) {
        expect(source, `${relativePath} :: ${forbidden}`).not.toMatch(forbidden);
      }
    }

    // Every existing product source — including the two Phase 2 files that gained
    // a capability — still carries the whole always-forbidden group. The audited
    // measurement facade is the sole narrowed browser-capability boundary.
    for (const [relativePath, forbiddenGroup] of Object.entries(PRODUCT_SOURCE_BOUNDARY)) {
      if (relativePath === 'src/measurement/index.ts') continue;

      for (const forbidden of ALWAYS_FORBIDDEN) {
        expect(forbiddenGroup).toContain(forbidden);
      }
    }

    expect(existsSync(resolve(ROOT, 'components.json'))).toBe(false);
    expect(existsSync(resolve(ROOT, 'src/components/ui'))).toBe(false);
  });

  it('covers every local production dependency imported by QualifyForm', () => {
    const owner = 'src/components/QualifyForm.tsx';
    const source = readText(resolve(ROOT, owner));
    const localImports = [...source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)]
      .map(([, specifier]) => {
        const base = resolve(ROOT, dirname(owner), specifier);
        const sourcePath = [`${base}.ts`, `${base}.tsx`, base]
          .find((candidate) => existsSync(candidate));

        expect(sourcePath, specifier).toBeTruthy();
        return relative(ROOT, sourcePath ?? base).replace(/\\/g, '/');
      });

    expect(localImports).toContain('src/components/qualify-form.logic.ts');
    for (const dependency of localImports) {
      expect(PRODUCT_SOURCE_BOUNDARY, dependency).toHaveProperty(dependency);
    }
  });

  it('runs every inherited static prohibition against the qualification fallback', () => {
    const relativePath = 'src/components/QualifyFallback.tsx';
    const boundary = PRODUCT_SOURCE_BOUNDARY[relativePath];
    const source = readText(resolve(ROOT, relativePath));
    const inheritedGroups = [
      ALWAYS_FORBIDDEN,
      NETWORK_FORBIDDEN,
      PROVIDER_FORBIDDEN,
      FORM_MARKUP_FORBIDDEN,
    ];
    let scanned = 0;

    expect(boundary).toBeTruthy();
    for (const group of inheritedGroups) {
      for (const forbidden of group) {
        expect(boundary).toContain(forbidden);
        expect(source, `${relativePath} :: ${forbidden}`).not.toMatch(forbidden);
        scanned += 1;
      }
    }
    expect(scanned).toBe(FULL_BOUNDARY.length);
  });

  it('grants browser measurement capabilities only to the audited facade', () => {
    const measurementPath = 'src/measurement/index.ts';
    const measurementBoundary = PRODUCT_SOURCE_BOUNDARY[measurementPath];

    expect(measurementBoundary).toBeTruthy();
    expect(measurementBoundary).toContain(PROVIDER_FORBIDDEN[0]);
    expect(measurementBoundary).toContain(FORM_MARKUP_FORBIDDEN[0]);
    for (const forbidden of MEASUREMENT_PRIVACY_FORBIDDEN) {
      expect(measurementBoundary).toContain(forbidden);
    }

    for (const [relativePath, forbiddenGroup] of Object.entries(PRODUCT_SOURCE_BOUNDARY)) {
      if (relativePath === measurementPath) continue;

      for (const forbidden of ALWAYS_FORBIDDEN) {
        expect(forbiddenGroup, relativePath).toContain(forbidden);
      }
    }
  });

  it('keeps analytics origins out of production source modules', () => {
    // Reuse BUILD_INPUTS' exact `src/` scope while excluding `src/test/`: the test
    // sources necessarily contain the forbidden literals that define this contract.
    // The identity group is scanned here, not over the built bundle, so the assertion
    // stays a claim about this repository once a vendor SDK ships inside the bundle.
    const forbiddenSourcePatterns = [
      ...UNCONDITIONAL_ANALYTICS_ORIGINS_FORBIDDEN,
      ...PROVIDER_INGESTION_HOST_SOURCE_FORBIDDEN,
      ...MEASUREMENT_IDENTITY_SOURCE_FORBIDDEN,
    ];

    for (const path of PRODUCTION_SOURCE_INPUTS) {
      const source = readText(path);
      const relativePath = relative(ROOT, path).replace(/\\/g, '/');
      for (const forbidden of forbiddenSourcePatterns) {
        expect(source, `${relativePath} :: ${forbidden}`).not.toMatch(forbidden);
      }
    }
  });

  it('leaves no superseded approved-script-source module or constant behind', () => {
    // The retirement is asserted, not assumed. `04.1-03` deliberately left the script
    // -source module, its define, and its build-time constant declaration in place so
    // its own commit typechecked; `04.1-04` removed their last reader, so this case is
    // what stops any of them being resurrected or silently surviving as dead wiring.
    expect(existsSync(resolve(ROOT, 'config/approved-analytics-script-sources.ts')))
      .toBe(false);

    const superseded = [
      /__HAOO_APPROVED_ANALYTICS_SCRIPT_SOURCES__/,
      /approvedScriptSourcesForProvider/,
      /approved-analytics-script-sources/,
    ];
    // Carried as (path, text) pairs rather than bare strings: `readText` returns `''` for
    // a missing path, and a `.not.toMatch` over `''` passes for the wrong reason. A rename
    // of either named file would have silently emptied this scan while it reported green,
    // so each subject is asserted non-empty first — the guard the narrowed-boundary case
    // above already applies.
    const retired = [
      resolve(ROOT, 'vite.config.ts'),
      resolve(ROOT, 'src/vite-env.d.ts'),
      ...PRODUCTION_SOURCE_INPUTS,
    ].map((path) => ({ relativePath: relative(ROOT, path).replace(/\\/g, '/'), text: readText(path) }));

    for (const { relativePath, text } of retired) {
      expect(text, relativePath).not.toBe('');
      for (const forbidden of superseded) {
        expect(text, `${relativePath} :: ${forbidden}`).not.toMatch(forbidden);
      }
    }
  });

  /**
   * Whole-bundle scope RETAINED by plan `04.1-09`, on a measurement rather than on
   * inheritance.
   *
   * The identity and queue patterns this case used to carry moved to the production
   * source scan (`MEASUREMENT_IDENTITY_SOURCE_FORBIDDEN`), and the provider-origin
   * prohibition was withdrawn with its successor named
   * (`PROVIDER_INGESTION_HOST_SOURCE_FORBIDDEN`). What remains is what a bundle scan can
   * assert truthfully about this project rather than about a vendor: no competitor
   * origin, no report credential shape, and no HAOO event name carried alongside a
   * property bag.
   *
   * Since `04.1-09` the subject `builtBundleText()` includes a third party's minified
   * artifact, so every one of those patterns became a claim about the vendor too. Under
   * this repository's discipline that is not something to leave standing on the grounds
   * that it is still green: `04.1-01` relocated `MEASUREMENT_IDENTITY_SOURCE_FORBIDDEN`
   * and withdrew the bundle-level origin claim for exactly this reason. The difference
   * here is what the measurement found.
   *
   * MEASURED in this commit, per pattern, against the emitted `posthog-sdk` chunk alone
   * at pinned version 1.425.1 — all six no-hit:
   *
   *   /googletagmanager|google-analytics|umami|segment\.com/i   no-hit
   *   /POSTHOG_QUERY_API_KEY/                                   no-hit
   *   /Authorization/                                           no-hit
   *   /Bearer\s/                                                no-hit
   *   /\/api\/projects\/[^/]*\/query/                           no-hit
   *   /haoo_page_view[^;]{0,240}(?:properties|payload|formData)/i  no-hit
   *
   * So no pattern here is narrowed and none is deleted: the whole-bundle scope is
   * RE-JUSTIFIED by that result rather than assumed, and the case goes on proving the
   * stronger claim it always made — that these shapes are absent from everything this
   * repository publishes, vendor chunk included. The event pattern is the least
   * surprising of the six (a project-only event name cannot appear in a vendor's
   * artifact) and was measured anyway, because a measurement with a hole in it is an
   * assumption wearing a table.
   *
   * Re-measure at any version bump. The companion case below pins that obligation
   * mechanically rather than trusting this comment to be re-read.
   *
   * The patterns are derived from the two exported constants, never restated, so a later
   * widening of either group is measured by this case automatically.
   *
   * RENAMED by code-review WR-05. Predecessor: `ships the unset provider bundle without
   * competitor analytics, property, or credential seams`. The name outlived its subject.
   * `builtBundleText()` is this repository's `dist`, and since `04.1-11` gave the deploy
   * workflow the three `VITE_HAOO_*` variables, the `dist` that CI's Test step scans is a
   * provider-SELECTED build — so in the one environment that gates a deploy, the case had
   * not read an unset bundle for some time. `04.1-11` renamed three sibling cases for
   * exactly this reason and left this one behind; a reader auditing provider-unset
   * coverage would have counted it twice.
   *
   * Nothing about what is asserted changed, and nothing was narrowed: all six patterns
   * were measured absent from BOTH partitions, so the claim was always scope-independent
   * and the successor name says so. This repository's `dist` is provider-unset locally and
   * provider-selected in CI, and this case is deliberately written to hold in both. The
   * provider-unset claim keeps its own hermetic probe — `builds a provider-unset probe
   * whose project chunks carry no approved ingestion origin at all` — which builds its own
   * bundle instead of inferring the environment from this one.
   */
  it('ships every built bundle without competitor analytics, property, or credential seams', () => {
    const bundle = builtBundleText();
    const forbiddenBundlePatterns = [
      ...UNCONDITIONAL_ANALYTICS_ORIGINS_FORBIDDEN,
      ...REPORT_CREDENTIAL_BUNDLE_FORBIDDEN,
      /haoo_page_view[^;]{0,240}(?:properties|payload|formData)/i,
    ];

    for (const forbidden of forbiddenBundlePatterns) {
      expect(bundle, String(forbidden)).not.toMatch(forbidden);
    }
  });

  /**
   * The measurement that re-justified the case above, pinned so it cannot go stale.
   *
   * The whole-bundle scope of `ships every built bundle without competitor analytics,
   * property, or credential seams` rests on a result taken against ONE pinned
   * SDK version. A version bump that introduced any of these literals into the vendor
   * artifact would silently turn that case from a claim about this project into a claim
   * about the vendor that happens to still hold — and the day it stopped holding, the
   * failure would read as this project having leaked a credential shape.
   *
   * Asserting the vendor partition separately keeps the two claims distinguishable: this
   * case is the one that goes red on a vendor regression, naming the vendor chunk, while
   * the case above stays the claim about this repository's own output. Together they are
   * the difference between a measured scope and a remembered one (T-04.1-26).
   */
  it('keeps the vendor chunk itself free of every report credential shape', () => {
    const vendor = vendorBundleText();

    expect(vendor.length).toBeGreaterThan(0);
    for (const forbidden of [
      ...UNCONDITIONAL_ANALYTICS_ORIGINS_FORBIDDEN,
      ...REPORT_CREDENTIAL_BUNDLE_FORBIDDEN,
    ]) {
      expect(
        vendor,
        `${String(forbidden)} appeared in the pinned SDK's own chunk. The whole-bundle scope of `
        + '"ships every built bundle without competitor analytics, property, or credential '
        + 'seams" was re-justified by measuring this exact group against the vendor chunk at the '
        + 'pinned version. Re-measure and either narrow that pattern to projectBundleText() with '
        + 'the evidence recorded, or pin the new version — do not widen either group.',
      ).not.toMatch(forbidden);
    }
  });

  /**
   * The credential boundary one layer earlier than the bundle scan can reach.
   *
   * `ships every built bundle without competitor analytics, property, or credential seams`
   * reads the built artifact, which is the right place to catch a credential that
   * already leaked. It is the wrong place to catch the leak being ARRANGED: the deploy
   * workflow's Build environment is what Vite inlines from, so a `VITE_POSTHOG_QUERY_API_KEY`
   * exported there would be inside `dist` before any scan of `dist` ran, and the scan would
   * be reporting a fact rather than preventing one. Added by `04.1-11`, the commit that first
   * gave that Build step analytics variables at all (T-04.1-25).
   *
   * The forbidden names are DERIVED from `REPORT_CREDENTIAL_BUNDLE_FORBIDDEN` rather than
   * restated, so widening that group without widening this gate is impossible — the two
   * cannot drift. `POSTHOG_PROJECT_ID` is the one name added by hand, with its reason
   * recorded: it is deliberately absent from that group because a numeric project id is not
   * a credential SHAPE and asserting it over a minified bundle would be noise. It is still a
   * local report-process input that may never enter the browser build, so this gate names it
   * and the derivation covers the rest.
   *
   * Presence is asserted before absence. A prohibition over a file that failed to load, or
   * over a Build step whose `env` block moved or was renamed, is vacuously true — which is
   * how a gate keeps passing after it has stopped reading anything.
   *
   * WIDENED by code-review WR-02, which measured what the name-side half alone lets
   * through. Both prohibitions above key on the credential's NAME, and neither looks at
   * what a browser-prefixed variable is ASSIGNED, so
   * `VITE_HAOO_ANALYTICS_KEY: ${{ secrets.POSTHOG_QUERY_API_KEY }}` in the Build `env`
   * block passed them green — the forbidden name appears only on the value side, under a
   * `VITE_` name that is not on any list and cannot be, because the list of names a
   * credential could be smuggled under is unbounded. The bundle scan does not catch it
   * either: Vite inlines the VALUE, so the key reaches `dist` as an opaque `phx_…` string
   * matching no pattern in this file. The name-side assertions are kept exactly as they
   * were — they were never wrong, only partial — and the value-side rule below is added
   * beside them. `catches a report credential smuggled under an unforbidden browser-prefixed
   * name` is the executable form of that measurement, and it fails if either half stops
   * biting.
   */
  it('keeps every report credential out of the deploy workflow Build environment', () => {
    const workflow = readText(resolve(ROOT, '.github/workflows/deploy.yml'));
    expect(workflow, '.github/workflows/deploy.yml').not.toBe('');

    const buildStep = workflow.split(/^ {6}- name: Build$/mu)[1] ?? '';
    expect(buildStep, 'the Build step in .github/workflows/deploy.yml').not.toBe('');
    const buildEnv = buildStep.split(/^ {8}run:/mu)[0] ?? '';
    expect(buildEnv, "the Build step's env block").toContain('env:');

    // The three public values this project's measurement sink is selected and addressed by.
    // Each must be wired exactly once, in the Build step and nowhere else: a second
    // assignment in another step is a second source of truth for what the bundle carries.
    for (const name of [
      'VITE_HAOO_MEASUREMENT_PROVIDER',
      'VITE_HAOO_POSTHOG_TOKEN',
      'VITE_HAOO_POSTHOG_API_HOST',
    ]) {
      const inBuildEnv = buildEnv.match(new RegExp(`^ +${name}: `, 'gmu')) ?? [];
      expect(inBuildEnv.length, `${name} assignments in the Build step env block`).toBe(1);
      const inWholeFile = workflow.match(new RegExp(`^ +${name}: `, 'gmu')) ?? [];
      expect(inWholeFile.length, `${name} assignments anywhere in the workflow`).toBe(1);
    }

    const derivedCredentialNames = REPORT_CREDENTIAL_BUNDLE_FORBIDDEN
      .map((pattern) => pattern.source)
      .filter((source) => /^[A-Z][A-Z0-9_]+$/u.test(source));
    expect(
      derivedCredentialNames,
      'REPORT_CREDENTIAL_BUNDLE_FORBIDDEN no longer yields any environment-variable name, so '
      + 'this gate would assert nothing. Restore the derivation rather than hardcoding names.',
    ).toContain('POSTHOG_QUERY_API_KEY');

    for (const name of [...derivedCredentialNames, 'POSTHOG_PROJECT_ID']) {
      expect(
        workflow,
        `${name} must never appear under a browser prefix in the deploy workflow — Vite would `
        + 'inline it into a world-readable bundle.',
      ).not.toMatch(new RegExp(`VITE[A-Z0-9_]*_${name}|VITE_${name}`, 'u'));
      expect(
        workflow.match(new RegExp(`^ *(?:VITE_[A-Z0-9_]*)?${name}: `, 'gmu')) ?? [],
        `${name} must never be assigned in any step of the deploy workflow — it is a local `
        + 'input to `npm run report:haoo`, not a build input.',
      ).toHaveLength(0);
    }

    // The value side (WR-02). Everything above asks what a variable is CALLED; a
    // credential smuggled under an unforbidden browser-prefixed name is caught only by
    // asking what it is ASSIGNED.
    const assignments = browserPrefixedAssignments(workflow);
    // Presence before absence, again: a value-side rule over an empty list is vacuous, and
    // this is the assertion that fails if the workflow's variables are ever renamed out of
    // the browser prefix or this parser stops matching the file's shape.
    expect(
      assignments.length,
      'browser-prefixed assignments found in .github/workflows/deploy.yml',
    ).toBeGreaterThan(0);

    for (const { name, value } of assignments) {
      expect(
        value,
        `${name} carries a secrets-context value. Vite inlines every VITE_* value into a `
        + 'world-readable bundle, so a secret assigned here is published — whatever the '
        + 'variable is named.',
      ).not.toMatch(SECRETS_CONTEXT);
      expect(
        value,
        `${name} must be assigned exactly one repository variable expression. A literal, a `
        + 'secret, or any other context is either unreadable in review or attacker-'
        + 'influenced, and all three are inlined into a world-readable bundle.',
      ).toMatch(REPOSITORY_VARIABLE_EXPRESSION);
    }

    // Last, because it is the coarsest: the exact roster. It runs AFTER the value-side
    // rules so a smuggled credential is reported as a credential rather than as an
    // unexpected list length, and it stands after them so a browser variable added without
    // a decision is still a red test rather than a silent widening of what ships.
    expect(
      assignments.map(({ name }) => name),
      'the browser-prefixed variables this workflow may set',
    ).toEqual([
      'VITE_HAOO_FORM_ENDPOINT',
      'VITE_HAOO_MEASUREMENT_PROVIDER',
      'VITE_HAOO_POSTHOG_TOKEN',
      'VITE_HAOO_POSTHOG_API_HOST',
    ]);
  });

  /**
   * The measurement that widened the gate above, pinned so it cannot go stale.
   *
   * Code-review WR-02 added the leak line below to a copy of the real workflow and ran the
   * gate's two name-side regexes against it: `browser-prefix match: false | assignment
   * count: 0` — green, with a report credential in the Build environment. This case is that
   * experiment, executable. It asserts BOTH halves of the finding: that the name-side rules
   * are blind to it (so a future reader cannot mistake the value-side rule for a
   * duplicate), and that the value-side rule catches it (so the widening cannot be quietly
   * narrowed back).
   *
   * The mutant is built from the real file rather than from a hand-written fixture. A
   * fixture would keep passing after the workflow's shape moved out from under the parser,
   * which is the failure mode that let the original gap through.
   */
  it('catches a report credential smuggled under an unforbidden browser-prefixed name', () => {
    const workflow = readText(resolve(ROOT, '.github/workflows/deploy.yml'));
    expect(workflow, '.github/workflows/deploy.yml').not.toBe('');

    const smuggled = 'VITE_HAOO_ANALYTICS_KEY: ${{ secrets.POSTHOG_QUERY_API_KEY }}';
    const mutant = workflow.replace(
      /^( +)(VITE_HAOO_POSTHOG_TOKEN: .*)$/mu,
      `$1$2\n$1${smuggled}`,
    );
    expect(mutant, 'the mutated workflow').not.toBe(workflow);

    // What the name-side rules see: nothing. `POSTHOG_QUERY_API_KEY` never appears under a
    // browser prefix, and it is never the name being assigned — it is the value.
    expect(mutant).not.toMatch(/VITE[A-Z0-9_]*_POSTHOG_QUERY_API_KEY|VITE_POSTHOG_QUERY_API_KEY/u);
    expect(mutant.match(/^ *(?:VITE_[A-Z0-9_]*)?POSTHOG_QUERY_API_KEY: /gmu) ?? []).toHaveLength(0);

    // What the value-side rule sees: exactly one offending assignment, by name.
    const offending = browserPrefixedAssignments(mutant)
      .filter(({ value }) => SECRETS_CONTEXT.test(value) || !REPOSITORY_VARIABLE_EXPRESSION.test(value));

    expect(offending.map(({ name }) => name)).toEqual(['VITE_HAOO_ANALYTICS_KEY']);
  });

  it('pins the local record and bare tracking call to finite structural shapes', () => {
    const source = readText(resolve(ROOT, 'src/measurement/index.ts'));
    const measurement = createMeasurement(HAOO_PRODUCT.measurement, {
      storage: window.localStorage,
      location: { href: 'https://www.haoo.online/' },
    });

    expect(CONTEXT_RECORD_KEYS).toEqual([
      'version',
      'visitBand',
      'lastSeenBand',
      'flags',
      'visitOrdinal',
      'lastSeenDay',
    ]);
    expect(MEASUREMENT_TRACK_ARGUMENT_COUNT).toBe(1);
    expect(measurement.track.length).toBe(MEASUREMENT_TRACK_ARGUMENT_COUNT);
    expect(source).toMatch(/function track\(event: EventName\): boolean/);
    expect(source).toMatch(/eventSink\?\.\(event\)/);
    expect(source).not.toMatch(/eventSink\?\.\(event\s*,/);
    expect(source).not.toMatch(/\b(?:eventQueue|eventLog|emittedEvents|retryTimer)\b/);
    expect(source).not.toMatch(/\b(?:setTimeout|setInterval|console\.(?:log|debug))\s*\(/);
  });

  it('keeps derivation metadata and engagement context out of qualification payloads', () => {
    const values = Object.fromEntries(
      HAOO_PRODUCT.qualify.fields.map((field) => [field.name, `private-${field.name}`]),
    );
    const body = buildSubmissionBody(values, HAOO_PRODUCT.qualify);
    const serializedBody = JSON.stringify(body);

    expect(Object.keys(body)).toEqual([
      '_subject',
      '_template',
      '_captcha',
      '_honey',
      ...HAOO_PRODUCT.qualify.fields.map((field) => field.emailLabel),
      'Source',
    ]);
    for (const contextKey of CONTEXT_RECORD_KEYS) {
      expect(serializedBody).not.toContain(contextKey);
    }
    expect(serializedBody).not.toMatch(/engagement|campaign|utm_/i);
  });

  /**
   * Successor to `keeps the production bundle free of identity and ordered-emission
   * channels`, narrowed by plan `04.1-09` and recorded here rather than changed silently.
   *
   * What the predecessor proved: that the WHOLE built bundle carried no browser-storage,
   * identifier or ordered-emission token, and did carry this project's two bounded
   * context keys. It was proved falsifiable by mutation probe and was green for as long
   * as no vendor code shipped.
   *
   * What this successor proves: the same three prohibitions and the same two positive
   * assertions, over THIS PROJECT'S OWN CHUNKS.
   *
   * Why the claim moved: `04.1-09` bound `posthog-js` in a value position (deferred item
   * D4, option A), so the vendor chunk now ships in every build. A minified vendor
   * artifact legitimately carries browser-storage and identifier tokens of its own —
   * measured against the emitted chunk at the pinned version, all three patterns fire on
   * the vendor side (`sessionStorage`, `sessionId`, `UUID`) and none fires on the project
   * side. Continuing to assert them over the whole bundle would therefore be a claim
   * about the VENDOR's implementation, which this repository does not get to make, and
   * widening or deleting the case to accommodate the import is the move `04.1-03` Task 2
   * instructs an executor to refuse. It is narrowed instead, in the shape `04.1-01`
   * established when it withdrew the delivery-mechanism guarantee: predecessor named,
   * successor named, reason recorded, narrowing plan named.
   *
   * The exclusion is not taken on trust. The companion case below asserts the partition
   * in both directions, so a seed list that swallowed this project's code could not make
   * this scan pass on nothing.
   */
  it("keeps this project's own chunks free of identity and ordered-emission channels", () => {
    const bundle = projectBundleText();
    const forbiddenBundlePatterns = [
      /document\.cookie|sessionStorage|indexedDB/,
      /\b(?:visitor|user|device|session)(?:Id|ID)\b/,
      /\b(?:uuid|fingerprint|clickstream|eventQueue|emittedEvents)\b/i,
    ];

    expect(bundle).toContain('visitOrdinal');
    expect(bundle).toContain('lastSeenDay');
    for (const forbidden of forbiddenBundlePatterns) {
      expect(bundle, String(forbidden)).not.toMatch(forbidden);
    }
  });

  /**
   * The exclusion above must have teeth, or it is a hiding place rather than a narrowing.
   *
   * A partition is only an honest subject if it partitions. Two failures would otherwise
   * be silent: a vendor side that captured this project's own modules (the identity scan
   * then passes because the code it should scan was excluded), and a project side that
   * captured the vendor (the scan then fails for the vendor's reasons, or a future
   * loosening hides real code). Both directions are asserted here, and `04.1-09` added
   * this case in the same commit as the narrowing precisely so the narrowing cannot be
   * read as a way to stop looking (T-04.1-24).
   *
   * The vendor marker is the exact pinned version derived from `package.json`, so this
   * also proves the chunk really is the SDK this repository pinned rather than merely a
   * file whose name matches the partition key.
   */
  it('partitions the built bundle into a vendor chunk that is the pinned SDK and project chunks that are not', () => {
    const vendorFiles = vendorChunkFiles();
    const projectFiles = projectChunkFiles();
    const vendor = readChunks(vendorFiles);
    const project = readChunks(projectFiles);

    expect(vendorFiles.length).toBeGreaterThan(0);
    expect(projectFiles.length).toBeGreaterThan(0);
    expect(vendor.length).toBeGreaterThan(0);
    expect(project.length).toBeGreaterThan(0);

    // The vendor side is the SDK: it carries the pinned version and the vendor's own
    // default ingestion host, neither of which this project's modules contain.
    expect(vendor, PINNED_SDK_VERSION).toContain(PINNED_SDK_VERSION);
    expect(vendor).toContain('us.i.posthog.com');

    // The project side is this project: it carries the bounded context keys and the
    // allowlisted event vocabulary, and it is not where the vendor's artifact landed.
    expect(project).toContain('visitOrdinal');
    expect(project).toContain('lastSeenDay');
    expect(project).toContain('haoo_page_view');
    expect(project).not.toContain(PINNED_SDK_VERSION);
  });

  it('keeps measurement disclosure static, bounded, and fragment-discoverable', () => {
    const pageSource = readText(resolve(ROOT, 'src/pages/ProductPage.tsx'));
    const disclosureSource = readText(
      resolve(ROOT, 'src/components/MeasurementDisclosure.tsx'),
    );
    const bundle = builtBundleText();

    expect(PRODUCT_SOURCE_BOUNDARY['src/components/MeasurementDisclosure.tsx'])
      .toEqual(FULL_BOUNDARY);
    expect(pageSource).toContain('href={`#${measurementDisclosureId(product.slug)}`}');
    expect(pageSource).toContain('handleMeasurementDisclosureLink');
    expect(pageSource).not.toMatch(/handleMeasurementDisclosureLink[\s\S]{0,300}preventDefault/);
    expect(disclosureSource).toContain('<details');
    expect(disclosureSource).toContain('<summary');
    expect(disclosureSource.indexOf('<summary'))
      .toBeLessThan(disclosureSource.indexOf('<div className="mt-6 space-y-6">'));
    expect(disclosureSource).not.toMatch(/skeleton|spinner|loading|line-clamp|truncate|text-ellipsis|overflow-x/i);
    expect(bundle).toContain('How we measure this page');
    // Derived, never restated: the approved processor copy has exactly one source, so a
    // wording change that lands in product data but not in the shipped bundle fails here.
    expect(bundle).toContain(HAOO_PRODUCT.measurement.disclosure.processorHeading);
    expect(bundle).toContain(HAOO_PRODUCT.measurement.disclosure.processorNote);
    expect(APPROVED_NOTICE_BUNDLE_SEGMENTS.length).toBeGreaterThan(1);
    for (const segment of APPROVED_NOTICE_BUNDLE_SEGMENTS) {
      expect(bundle, segment).toContain(segment);
    }
  });
});

/**
 * The ingestion-host trust anchor (T-04.1-09), mirroring the approved-source assertions.
 *
 * Note what the mirror does and does not cover. The existing
 * `injects the approved-source constant only through the provider-gated selector` case is
 * a *source-derivation* test — it reads `vite.config.ts` and asserts the wiring — and this
 * describe mirrors that shape faithfully, adding direct assertions on the selector itself
 * because that is where the "provider-gated" claim is falsifiable today.
 *
 * Both bundle halves are now asserted, and the order in which they arrived is the point.
 * Vite substitutes a `define` only where a module *references* it, so an unreferenced
 * constant emits nothing at all: when `04.1-03` planted this constant nothing read it,
 * and a selector-set build published the ingestion origin ZERO times. The presence case
 * was therefore deferred to `04.1-04` (phase `deferred-items.md`, D2) rather than written
 * against a build that could not fail it. `04.1-04` added the reader —
 * `buildTimeApprovedAnalyticsHosts` in `src/products/haoo.ts` — so the presence case
 * below builds into a throwaway directory with the selector set and asserts exactly one
 * occurrence, while the absence case asserts the repository's own provider-unset `dist`.
 */
describe('approved analytics ingestion host boundary', () => {
  it('injects the approved-host constant only through the provider-gated selector', () => {
    // Derived, not restated: a future edit that hardcodes an unconditional host list — or
    // drops the constant altogether — fails here rather than silently publishing the
    // ingestion origin in a provider-unset bundle.
    const viteConfig = readText(APPROVED_HOST_CONFIG_INPUT.viteConfig);

    expect(viteConfig).toMatch(/__HAOO_APPROVED_ANALYTICS_HOSTS__/);
    expect(viteConfig).toMatch(
      /approvedAnalyticsHostsForProvider\(\s*env\.VITE_HAOO_MEASUREMENT_PROVIDER,?\s*\)/,
    );
    expect(existsSync(APPROVED_HOST_CONFIG_INPUT.contract)).toBe(true);
    expect(BUILD_INPUTS).toContain(APPROVED_HOST_CONFIG_INPUT.contract);
  });

  it('carries exactly one frozen approved ingestion origin', () => {
    expect(APPROVED_ANALYTICS_HOSTS).toHaveLength(1);
    expect(Object.isFrozen(APPROVED_ANALYTICS_HOSTS)).toBe(true);
    expect(APPROVED_ANALYTICS_HOSTS.every((host) => Object.isFrozen(host))).toBe(true);

    // A deployment variable may select from this list and can never add to it, so the
    // list must be a fixed set of absolute https origins carrying nothing else — no
    // path, no query, no credentials — that a resolver could later be tricked into
    // treating as a prefix match.
    for (const host of APPROVED_ANALYTICS_HOSTS) {
      const url = new URL(host.origin);
      expect(url.protocol).toBe('https:');
      expect(url.origin).toBe(host.origin);
      expect(url.pathname).toBe('/');
      expect(`${url.username}${url.password}${url.search}${url.hash}`).toBe('');
    }
  });

  it('selects the approved origin for the exact provider value and nothing else', () => {
    // Same trim-and-lowercase normalization as `resolveMeasurementProvider`, so the build
    // and the runtime cannot disagree about which provider is selected.
    for (const accepted of ['posthog', 'PostHog', 'POSTHOG', '  posthog  ', '\tposthog\n']) {
      expect(approvedAnalyticsHostsForProvider(accepted), accepted)
        .toEqual(APPROVED_ANALYTICS_HOSTS);
    }

    // Unset, blank, whitespace, a near miss, and an absolute URL all select nothing. The
    // near misses matter: an implementation using `includes`, `startsWith` or `endsWith`
    // instead of exact equality would pass the accepted cases above and fail here.
    const rejected = [
      undefined,
      '',
      '   ',
      'none',
      'plausible',
      'posthog-eu',
      'posthogg',
      'notposthog',
      'post hog',
      'https://us.i.posthog.com',
    ];

    for (const value of rejected) {
      expect(approvedAnalyticsHostsForProvider(value), String(value)).toEqual([]);
    }
  });

  it('keeps the approved-host contract out of every production module import graph', () => {
    // The ingestion origin has exactly one route into a bundle: the deliberate build-time
    // constant. An ordinary import from a production module would be a second route, and
    // that route would publish the origin in the provider-unset bundle. Match the module
    // by bare name so a relative specifier, a repository-relative path, and an aliased
    // path are all caught.
    for (const path of PRODUCTION_SOURCE_INPUTS) {
      const source = readText(path);
      const relativePath = relative(ROOT, path).replace(/\\/g, '/');
      expect(source, `${relativePath} imports the approved-host contract`)
        .not.toMatch(APPROVED_HOST_MODULE_FORBIDDEN);
    }
  });

  /**
   * The half of the ingestion-host bundle contract `04.1-03` deferred, on a measurement
   * rather than a guess (phase `deferred-items.md`, D2).
   *
   * Vite substitutes a `define` only where a module *references* the constant, so an
   * unreferenced define emits nothing at all. When `04.1-03` planted
   * `__HAOO_APPROVED_ANALYTICS_HOSTS__` nothing read it yet, and a `posthog`-selected
   * build carried the ingestion origin ZERO times — an assertion written there would
   * have passed for the wrong reason and would have gone on passing if the define were
   * deleted outright. `04.1-04` added the reader
   * (`buildTimeApprovedAnalyticsHosts` in `src/products/haoo.ts`), so the presence case
   * is capable of failing here and belongs here.
   *
   * The probe builds into its own throwaway directory so the repository's `dist` — which
   * every other case in this file asserts against, and which must stay a provider-unset
   * build — is never disturbed.
   *
   * AMENDED by plan `04.1-09`, and recorded rather than passed off as a mechanical edit:
   * moving a count's subject is a narrowing under this repository's discipline even when
   * the assertion's text barely changes.
   *
   * What the predecessor counted: occurrences of each approved origin across EVERY chunk
   * the probe emitted.
   *
   * What the successor counts: occurrences across the probe's PROJECT chunks only.
   *
   * Why the subject moved: since `04.1-09` bound the SDK in a value position the probe
   * also emits the vendor chunk, and the vendor's minified artifact carries the vendor's
   * own default host string — which is the same host D-08 selects. A whole-bundle count
   * would therefore be counting the vendor as well as this project, and `exactly once`
   * would fail for a reason that says nothing about whether this project's single route
   * into the bundle is still single. The claim worth making is about this project's own
   * code, so that is what is counted.
   *
   * The vendor's copy is not ignored, which would be indistinguishable from not having
   * looked: it is asserted explicitly below as what it is — a string in a third party's
   * published artifact, stated as a claim about the vendor rather than about this
   * repository.
   */
  it('publishes the approved ingestion origin exactly once in a provider-selected build', () => {
    const probeDir = resolve(ROOT, 'dist-approved-host-probe');

    try {
      const build = spawnSync(
        // `npx` is `npx.cmd` on Windows and `spawnSync` without `shell: true` does not
        // resolve the extension, so the call failed with ENOENT and surfaced only as
        // `build.status === null` — an opaque assertion failure that never named the
        // cause. This repository supports Windows deliberately (`.planning/WINDOWS.md`,
        // and the drive-designator handling in `src/reporting/generate.ts`), so the
        // platform is in scope for a test that shells out.
        process.platform === 'win32' ? 'npx.cmd' : 'npx',
        ['vite', 'build', '--outDir', probeDir, '--emptyOutDir'],
        {
          cwd: ROOT,
          encoding: 'utf8',
          // The provider variables are blanked rather than inherited. A developer shell
          // that exports a real token and api host — exactly the shell an owner
          // performing the 04.1-08 activation has — would otherwise bake live
          // configuration into this throwaway bundle. The `finally` below removes the
          // directory, but an uncatchable termination between the two would leave a
          // credential-carrying build on disk, which is the failure shape the report
          // generator's write-on-success temp file is careful to avoid.
          env: {
            ...process.env,
            VITE_HAOO_MEASUREMENT_PROVIDER: 'posthog',
            VITE_HAOO_POSTHOG_TOKEN: '',
            VITE_HAOO_POSTHOG_API_HOST: '',
          },
        },
      );

      expect(build.status, build.stderr ?? '').toBe(0);

      const probeBundle = projectBundleText(probeDir);

      expect(probeBundle.length).toBeGreaterThan(0);
      for (const host of APPROVED_ANALYTICS_HOSTS) {
        // Exactly once: present because the build deliberately selected the provider,
        // and once because the constant has exactly one route into this project's code.
        expect(probeBundle.split(host.origin).length - 1, host.origin).toBe(1);
      }

      // The vendor's own default host, acknowledged explicitly rather than excluded
      // quietly. This is a claim about `posthog-js`'s published artifact — that it
      // hardcodes the same Cloud US host D-08 selected — and NOT a claim about this
      // repository, which reaches the endpoint only through the provider-gated
      // build-time constant counted above. Stated so a reader of the partition can see
      // what the exclusion contains instead of having to trust that it is harmless.
      expect(vendorBundleText(probeDir)).toContain('us.i.posthog.com');
    } finally {
      rmSync(probeDir, { recursive: true, force: true });
    }
  }, 180_000);

  /**
   * The README's delivery claim and the code must move together, in both directions.
   *
   * The README and `COVERAGE.md` asserted the bundled-SDK behaviour as settled fact while
   * no production module imported `posthog-js` as a value, so a reader of the shipped
   * documents could not discover that zero events are delivered — the gap was recorded
   * only inside `.planning/`. That is the worst class of defect for a project whose
   * stated discipline is that a withdrawn guarantee must be NAMED: here a guarantee was
   * added that does not hold.
   *
   * Prose cannot enforce itself, so this is the gate. The moment a production module
   * loads the SDK for real, the "not loaded" section becomes the false statement and this
   * case fails until it is rewritten — which is the direction that actually matters,
   * because that is the commit where somebody is thinking about the code and not about
   * the README.
   */
  it('keeps the README delivery claim in step with whether a production module loads the SDK', () => {
    const readme = readText(resolve(ROOT, 'README.md'));
    expect(readme, 'README.md').not.toBe('');

    // Type-only imports are erased by TypeScript and never reach a bundle, so they are
    // removed before asking whether the specifier survives in a value position. The
    // convention this relies on is `import type` — the inline `{ type X }` form would
    // read as a value import here and fail, deliberately: this file is the one place
    // that has to be able to tell erased from emitted.
    const typeOnlyImport = /import\s+type\s+[\s\S]*?\s+from\s+['"]posthog-js['"]\s*;?/g;
    const valueSpecifier =
      /(?:from|require\(\s*)\s*['"]posthog-js['"]|import\s+['"]posthog-js['"]/;
    const loaders = PRODUCTION_SOURCE_INPUTS
      .filter((path) => valueSpecifier.test(readText(path).replace(typeOnlyImport, '')))
      .map((path) => relative(ROOT, path).replace(/\\/g, '/'));

    const readmeDisclaimsDelivery =
      readme.includes('### No event is delivered yet — the SDK is pinned, not loaded')
      && readme.includes('**Zero of the ten allowlisted events are currently delivered,**');

    // Strengthened by plan `04.1-09`, which made the loaders-present branch reachable for
    // the first time. Requiring only the ABSENCE of the disclaimer would have let that
    // branch pass on a README that had simply deleted the section — turning a documented
    // withdrawal into a silence, which is the one move this repository does not allow. So
    // the branch now demands the positive successor by name, its delivery-condition
    // sentence verbatim, and the module path that does the loading, so a reader of the
    // shipped documentation can find the loading module without reading `.planning/`.
    const readmeStatesLoaded =
      readme.includes('### The SDK is loaded — delivery depends on the provider selector')
      && readme.includes(
        '**Events are delivered only when `VITE_HAOO_MEASUREMENT_PROVIDER` is set to `posthog`.**',
      );

    if (loaders.length === 0) {
      expect(
        readmeDisclaimsDelivery,
        'No production module imports posthog-js as a value, so README.md must carry the '
        + '"No event is delivered yet" section and its zero-delivery sentence verbatim.',
      ).toBe(true);
    } else {
      expect(
        readmeDisclaimsDelivery,
        `${loaders.join(', ')} now loads the SDK, so README.md must no longer state that `
        + 'no event is delivered. Rewrite that section in this commit.',
      ).toBe(false);
      expect(
        readmeStatesLoaded,
        `${loaders.join(', ')} now loads the SDK, so README.md must carry the `
        + '"### The SDK is loaded — delivery depends on the provider selector" heading and the '
        + 'sentence "**Events are delivered only when `VITE_HAOO_MEASUREMENT_PROVIDER` is set to '
        + '`posthog`.**" verbatim.',
      ).toBe(true);
      for (const loader of loaders) {
        expect(
          readme,
          `README.md must name ${loader} as a module that loads the SDK, so the loading module is `
          + 'discoverable from the shipped documentation.',
        ).toContain(loader);
      }
    }
  });

  /**
   * Successor to `ships the provider-unset bundle with no approved ingestion origin at
   * all`, narrowed by plan `04.1-09` on BOTH of its axes, each for its own reason.
   *
   * What the predecessor proved: that the repository's `dist` — asserted as a whole
   * bundle — contained no approved ingestion origin, so a build that had not deliberately
   * selected the provider could not address the endpoint (D-08).
   *
   * What this successor proves: the same claim, over a provider-unset build's own PROJECT
   * chunks.
   *
   * Why the subject moved, first axis (whole bundle to project chunks): `04.1-09` bound
   * the SDK in a value position, so the vendor chunk ships in every build and carries the
   * vendor's own default host string — measured present in the emitted chunk. A
   * whole-bundle assertion would from that commit onward be a claim about the vendor's
   * published artifact rather than about this repository, which is the same reasoning
   * `04.1-01` used when it withdrew the bundle-level half of the origin guarantee and
   * replaced it with `PROVIDER_INGESTION_HOST_SOURCE_FORBIDDEN`.
   *
   * Why the subject moved, second axis (`dist` to an own probe): `dist` is only a
   * provider-unset artifact for as long as nothing sets the selector at build time, and
   * plan `04.1-11` adds the provider variables to the deployment build. A case that kept
   * assuming `dist` is unset would then start passing or failing for reasons unrelated to
   * what it means. Building its own probe with the selector blanked makes the subject
   * match the claim permanently, and the probe never disturbs the repository's `dist`.
   *
   * Together these keep the D-08 guarantee falsifiable: an unselected build carries no
   * route to the endpoint in any code this project wrote.
   */
  it('builds a provider-unset probe whose project chunks carry no approved ingestion origin at all', () => {
    const probeDir = resolve(ROOT, 'dist-provider-unset-probe');

    try {
      const build = spawnSync(
        // Same platform handling as the provider-selected probe above: `npx` is `npx.cmd`
        // on Windows, and `spawnSync` without `shell: true` does not resolve the
        // extension.
        process.platform === 'win32' ? 'npx.cmd' : 'npx',
        ['vite', 'build', '--outDir', probeDir, '--emptyOutDir'],
        {
          cwd: ROOT,
          encoding: 'utf8',
          // Blanked rather than inherited, exactly as the provider-selected probe blanks
          // the token and host. Here the SELECTOR is the variable that matters: a
          // developer shell that exports `posthog` — the shell an owner performing the
          // 04.1-11 enablement has — would otherwise produce a provider-SELECTED build
          // and this case would assert the opposite of what it claims, silently.
          env: {
            ...process.env,
            VITE_HAOO_MEASUREMENT_PROVIDER: '',
            VITE_HAOO_POSTHOG_TOKEN: '',
            VITE_HAOO_POSTHOG_API_HOST: '',
          },
        },
      );

      expect(build.status, build.stderr ?? '').toBe(0);

      // The partition helpers throw on an empty side, so a probe that emitted nothing
      // cannot pass this case by scanning the empty string.
      const probeProjectBundle = projectBundleText(probeDir);
      expect(probeProjectBundle.length).toBeGreaterThan(0);

      // Derived from the contract rather than restated, so widening the approved list
      // without widening the gate fails here. Absent entirely, not merely unused.
      for (const host of APPROVED_ANALYTICS_HOSTS) {
        expect(probeProjectBundle, host.origin).not.toContain(host.origin);
        expect(probeProjectBundle, host.origin).not.toContain(new URL(host.origin).hostname);
      }
    } finally {
      rmSync(probeDir, { recursive: true, force: true });
    }
  }, 180_000);
});
