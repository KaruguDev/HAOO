import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
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
 * - `src/measurement/plausible.ts` keeps the full static boundary plus the explicit
 *   measurement privacy group. It may create an injected script element, but it needs
 *   no storage, network-call API, form markup, provider endpoint, or second event arg.
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
  'src/measurement/plausible.ts': [
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
 * The repository-owned approved analytics script sources and the build wiring that
 * carries them. The contract lives outside `src/` on purpose, so it is not a production
 * source input — but it *is* a build input: editing the trusted list changes what a
 * configured build publishes, so a stale `dist` must fail the freshness case.
 */
const APPROVED_SOURCE_CONFIG_INPUT = {
  contract: resolve(ROOT, 'config/approved-analytics-script-sources.ts'),
  viteConfig: resolve(ROOT, 'vite.config.ts'),
} as const;
/** No production module may reach the approved-source contract by any specifier. */
const APPROVED_SOURCE_MODULE_FORBIDDEN = /approved-analytics-script-sources/;
const BUILD_INPUTS = [
  ...PRODUCTION_SOURCE_INPUTS,
  ...listFiles(resolve(ROOT, 'public')),
  resolve(ROOT, 'index.html'),
  SOURCE_HTML,
  APPROVED_SOURCE_CONFIG_INPUT.contract,
  resolve(ROOT, 'vite.config.ts'),
  resolve(ROOT, 'package.json'),
];

/** Origins no supported build configuration may ever publish. */
const UNCONDITIONAL_ANALYTICS_ORIGINS_FORBIDDEN = [
  /googletagmanager|google-analytics|umami|posthog|segment\.com/i,
] as const;

/**
 * The supported provider origin is forbidden in the provider-unset bundle built by CI
 * and this suite. A deliberately configured production build will legitimately contain
 * this origin through `VITE_HAOO_PLAUSIBLE_SRC`; the source invariant below proves it
 * cannot enter through a hardcoded production module.
 */
export const UNCONFIGURED_PROVIDER_ORIGIN_FORBIDDEN = [/plausible\.io/i] as const;

/** Credential-only report shapes must never enter any browser bundle. */
const REPORT_CREDENTIAL_BUNDLE_FORBIDDEN = [
  /PLAUSIBLE_STATS_API_KEY/,
  /Authorization/,
  /Bearer\s/,
  /\/api\/v2\/query/,
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

function builtBundleText() {
  return listFiles(resolve(DIST, 'assets'))
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
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
    const forbiddenOrigins = [
      ...UNCONDITIONAL_ANALYTICS_ORIGINS_FORBIDDEN,
      ...UNCONFIGURED_PROVIDER_ORIGIN_FORBIDDEN,
    ];

    for (const path of PRODUCTION_SOURCE_INPUTS) {
      const source = readText(path);
      const relativePath = relative(ROOT, path).replace(/\\/g, '/');
      for (const forbidden of forbiddenOrigins) {
        expect(source, `${relativePath} :: ${forbidden}`).not.toMatch(forbidden);
      }
    }
  });

  it('keeps the approved-source contract out of every production module import graph', () => {
    // The approved origin has exactly one route into a bundle: the deliberate build-time
    // constant. An ordinary import from a production module would be a second route, and
    // that route would publish the origin in the provider-unset bundle. Match the module
    // by bare name so a relative specifier, a repository-relative path, and an aliased
    // path are all caught.
    for (const path of PRODUCTION_SOURCE_INPUTS) {
      const source = readText(path);
      const relativePath = relative(ROOT, path).replace(/\\/g, '/');
      expect(source, `${relativePath} imports the approved-source contract`)
        .not.toMatch(APPROVED_SOURCE_MODULE_FORBIDDEN);
    }
  });

  it('injects the approved-source constant only through the provider-gated selector', () => {
    // Derived, not restated: a future edit that hardcodes an unconditional approved list
    // — or drops the constant altogether — fails here rather than silently publishing the
    // analytics origin in a provider-unset bundle.
    const viteConfig = readText(APPROVED_SOURCE_CONFIG_INPUT.viteConfig);

    expect(viteConfig).toMatch(/__HAOO_APPROVED_ANALYTICS_SCRIPT_SOURCES__/);
    expect(viteConfig).toMatch(
      /approvedScriptSourcesForProvider\(\s*env\.VITE_HAOO_MEASUREMENT_PROVIDER,?\s*\)/,
    );
    expect(existsSync(APPROVED_SOURCE_CONFIG_INPUT.contract)).toBe(true);
    expect(BUILD_INPUTS).toContain(APPROVED_SOURCE_CONFIG_INPUT.contract);
  });

  it('ships the unset provider bundle without identity, property, queue, SDK, or credential seams', () => {
    const bundle = builtBundleText();
    const forbiddenBundlePatterns = [
      ...UNCONDITIONAL_ANALYTICS_ORIGINS_FORBIDDEN,
      ...UNCONFIGURED_PROVIDER_ORIGIN_FORBIDDEN,
      ...REPORT_CREDENTIAL_BUNDLE_FORBIDDEN,
      /\b(?:visitor|user|device|session)(?:Id|ID)\b/,
      /\b(?:uuid|fingerprint|clickstream|eventQueue)\b/i,
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
    expect(pageSource).toContain('href={`#${product.slug}-measurement-disclosure`}');
    expect(pageSource).toContain('handleMeasurementDisclosureLink');
    expect(pageSource).not.toMatch(/handleMeasurementDisclosureLink[\s\S]{0,300}preventDefault/);
    expect(disclosureSource).toContain('<details');
    expect(disclosureSource).toContain('<summary');
    expect(disclosureSource.indexOf('<summary'))
      .toBeLessThan(disclosureSource.indexOf('<div className="mt-6 space-y-6">'));
    expect(disclosureSource).not.toMatch(/skeleton|spinner|loading|line-clamp|truncate|text-ellipsis|overflow-x/i);
    expect(bundle).toContain('How we measure this page');
    expect(APPROVED_NOTICE_BUNDLE_SEGMENTS.length).toBeGreaterThan(1);
    for (const segment of APPROVED_NOTICE_BUNDLE_SEGMENTS) {
      expect(bundle, segment).toContain(segment);
    }
  });
});
