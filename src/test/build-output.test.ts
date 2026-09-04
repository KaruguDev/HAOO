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
const SOURCE_ROOT_HTML = resolve(ROOT, 'index.html');
const BUILT_ROOT_HTML = resolve(ROOT, 'dist/index.html');
const SOURCE_HTML = resolve(ROOT, 'products/haoo/index.html');
const BUILT_HTML = resolve(ROOT, 'dist/products/haoo/index.html');
const PUBLIC_PDF = resolve(ROOT, 'public/products/haoo/HAOO-Marketing-Brochure.pdf');
const BUILT_PDF = resolve(ROOT, 'dist/products/haoo/HAOO-Marketing-Brochure.pdf');
const PDF_SHA256 = '38d5ad8e7497c65c4fa2d374e7ed5e8d81ab79f3b25d1e0daa73321d45b9e7a6';
const PRODUCT_TITLE = 'HAOO Property Management | ZERO-PAPER HUB';
const PRODUCT_DESCRIPTION = 'Run the business—not the paperwork with HAOO, a property-management platform for landlords and property managers in Kenya. Choose assisted or self-onboarding.';
const PRODUCT_URL = 'https://www.zero-paperhub.com/products/haoo/';
const PRODUCT_IMAGE = `${PRODUCT_URL}brochure-preview.png`;
const ROOT_TITLE = 'ZERO-PAPER HUB | Strategic Digital Workflows';
const ROOT_DESCRIPTION = 'ZERO-PAPER HUB builds strategic digital products and workflows that help organizations work clearly and grow.';
const ROOT_URL = 'https://www.zero-paperhub.com/';
const ROOT_IMAGE = `${ROOT_URL}zero-paper_hub_hi-def.png`;
const PUBLIC_PREVIEW = resolve(ROOT, 'public/products/haoo/brochure-preview.png');
const PREVIEW_SHA256 = '7e62c3b75a0bc7ba70c400b4ec63e93cbe51701da051127ba212be7c578c8087';
const PDF_ALTERNATE_LINK =
  '<link rel="alternate" type="application/pdf" href="/products/haoo/HAOO-Marketing-Brochure.pdf" title="HAOO Marketing Brochure (PDF)" />';
const PRODUCT_ASSETS = [
  '/products/haoo/HAOO-Marketing-Brochure.pdf',
  '/products/haoo/brochure-preview.png',
  '/products/haoo/haoo-hero.png',
  '/products/haoo/haoo-logo.png',
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
  'src/components/ProductsSection.tsx': FULL_BOUNDARY,
  'src/products/copy.ts': FULL_BOUNDARY,
  'src/products/engagement-summary.ts': FULL_BOUNDARY,
  'src/products/registry.ts': FULL_BOUNDARY,
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
  resolve(ROOT, 'index.html'),
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
 * `Authorization` and `Bearer ` stay on the bundle scan unchanged: both were verified
 * absent from the published SDK artifact, so they remain claims about this project.
 */
const REPORT_CREDENTIAL_BUNDLE_FORBIDDEN = [
  /POSTHOG_QUERY_API_KEY/,
  /Authorization/,
  /Bearer\s/,
  /\/api\/projects\/[^/]*\/query/,
] as const;
const BUILD_OUTPUTS = [
  BUILT_HTML,
  resolve(DIST, 'index.html'),
  ...listFiles(resolve(DIST, 'assets')),
];

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
      `Missing build output ${missingOutputs[0] ?? BUILT_HTML}. Run npm run build before asserting against dist/products/haoo/index.html.`,
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
  it('[phase1-red:build] emits a physical nested HAOO document', () => {
    expect(existsSync(SOURCE_HTML)).toBe(true);
    expect(existsSync(BUILT_HTML)).toBe(true);
  });

  it('contains exact source and built canonical/social metadata', () => {
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
      expect(html).not.toContain('bolt.new/static/og_default.png');
    }
  });

  it('publishes first-party root canonical and social metadata', () => {
    for (const html of [readText(SOURCE_ROOT_HTML), readText(BUILT_ROOT_HTML)]) {
      expect(html).toContain(ROOT_TITLE);
      expect(html).toContain(`name="description" content="${ROOT_DESCRIPTION}"`);
      expect(html).toContain(`rel="canonical" href="${ROOT_URL}"`);
      expect(html).toContain('property="og:type" content="website"');
      expect(html).toContain(`property="og:title" content="${ROOT_TITLE}"`);
      expect(html).toContain(`property="og:description" content="${ROOT_DESCRIPTION}"`);
      expect(html).toContain(`property="og:url" content="${ROOT_URL}"`);
      expect(html).toContain(`property="og:image" content="${ROOT_IMAGE}"`);
      expect(html).toContain('property="og:site_name" content="ZERO-PAPER HUB"');
      expect(html).toContain('name="twitter:card" content="summary_large_image"');
      expect(html).toContain(`name="twitter:title" content="${ROOT_TITLE}"`);
      expect(html).toContain(`name="twitter:description" content="${ROOT_DESCRIPTION}"`);
      expect(html).toContain(`name="twitter:image" content="${ROOT_IMAGE}"`);
      expect(html).not.toContain('bolt.new');
    }

    expect(existsSync(resolve(ROOT, 'public/zero-paper_hub_hi-def.png'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'dist/zero-paper_hub_hi-def.png'))).toBe(true);
  });

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
    expect(readText(BUILT_HTML)).toContain('/products/haoo/HAOO-Marketing-Brochure.pdf');
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
        .matchAll(/\/products\/haoo\/[A-Za-z0-9._-]+/g)]
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
    expect(readText(resolve(ROOT, 'CNAME')).trim()).toBe('www.zero-paperhub.com');
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

  it('ships the unset provider bundle without competitor analytics, property, or credential seams', () => {
    // The identity and queue patterns this case used to carry moved to the production
    // source scan (`MEASUREMENT_IDENTITY_SOURCE_FORBIDDEN`), and the provider-origin
    // prohibition was withdrawn with its successor named
    // (`PROVIDER_INGESTION_HOST_SOURCE_FORBIDDEN`). What remains here is what a bundle
    // scan can still assert truthfully about this project rather than about a vendor:
    // no competitor analytics origin, no report credential shape, and no HAOO event
    // name carried alongside a property bag.
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

  it('pins the local record and bare tracking call to finite structural shapes', () => {
    const source = readText(resolve(ROOT, 'src/measurement/index.ts'));
    const measurement = createMeasurement(HAOO_PRODUCT.measurement, {
      storage: window.localStorage,
      location: { href: 'https://www.zero-paperhub.com/products/haoo/' },
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

  it('keeps the production bundle free of identity and ordered-emission channels', () => {
    const bundle = builtBundleText();
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

      const probeBundle = listFiles(resolve(probeDir, 'assets'))
        .filter((file) => file.endsWith('.js'))
        .map((file) => readFileSync(file, 'utf8'))
        .join('\n');

      expect(probeBundle.length).toBeGreaterThan(0);
      for (const host of APPROVED_ANALYTICS_HOSTS) {
        // Exactly once: present because the build deliberately selected the provider,
        // and once because the constant has exactly one route into the bundle.
        expect(probeBundle.split(host.origin).length - 1, host.origin).toBe(1);
      }
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
    }
  });

  it('ships the provider-unset bundle with no approved ingestion origin at all', () => {
    // Derived from the contract rather than restated, so widening the approved list
    // without widening the gate fails here. Absent entirely, not merely unused: a build
    // that has not deliberately selected the provider cannot address the endpoint.
    const bundle = builtBundleText();

    for (const host of APPROVED_ANALYTICS_HOSTS) {
      expect(bundle, host.origin).not.toContain(host.origin);
      expect(bundle, host.origin).not.toContain(new URL(host.origin).hostname);
    }
  });
});
