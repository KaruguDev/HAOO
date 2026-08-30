import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HAOO_PRODUCT } from '../products/haoo';

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

const FULL_BOUNDARY = [
  ...ALWAYS_FORBIDDEN,
  ...NETWORK_FORBIDDEN,
  ...PROVIDER_FORBIDDEN,
  ...FORM_MARKUP_FORBIDDEN,
] as const;

const PRODUCT_SOURCE_BOUNDARY: Readonly<Record<string, readonly RegExp[]>> = {
  'src/pages/ProductPage.tsx': FULL_BOUNDARY,
  'src/components/BrochurePanel.tsx': FULL_BOUNDARY,
  'src/components/OnboardingChoices.tsx': FULL_BOUNDARY,
  'src/components/ProductHeader.tsx': FULL_BOUNDARY,
  'src/components/ProductsSection.tsx': FULL_BOUNDARY,
  'src/products/copy.ts': FULL_BOUNDARY,
  'src/products/registry.ts': FULL_BOUNDARY,
  'src/products/types.ts': FULL_BOUNDARY,
  'src/products/haoo.ts': [
    ...ALWAYS_FORBIDDEN,
    ...NETWORK_FORBIDDEN,
    ...FORM_MARKUP_FORBIDDEN,
  ],
  'src/components/QualifyForm.tsx': [...ALWAYS_FORBIDDEN, ...PROVIDER_FORBIDDEN],
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

const BUILD_INPUTS = [
  ...listFiles(resolve(ROOT, 'src')).filter(
    (path) => !path.startsWith(`${resolve(ROOT, 'src/test')}/`),
  ),
  ...listFiles(resolve(ROOT, 'public')),
  resolve(ROOT, 'index.html'),
  SOURCE_HTML,
  resolve(ROOT, 'vite.config.ts'),
  resolve(ROOT, 'package.json'),
];
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

    // Every product source — including the two that gained a capability — still
    // carries the whole always-forbidden group.
    for (const forbiddenGroup of Object.values(PRODUCT_SOURCE_BOUNDARY)) {
      for (const forbidden of ALWAYS_FORBIDDEN) {
        expect(forbiddenGroup).toContain(forbidden);
      }
    }

    expect(existsSync(resolve(ROOT, 'components.json'))).toBe(false);
    expect(existsSync(resolve(ROOT, 'src/components/ui'))).toBe(false);
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
});
