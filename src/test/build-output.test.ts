import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const DIST = resolve(ROOT, 'dist');
const SOURCE_HTML = resolve(ROOT, 'products/haoo/index.html');
const BUILT_HTML = resolve(ROOT, 'dist/products/haoo/index.html');
const PUBLIC_PDF = resolve(ROOT, 'public/products/haoo/HAOO-Marketing-Brochure.pdf');
const BUILT_PDF = resolve(ROOT, 'dist/products/haoo/HAOO-Marketing-Brochure.pdf');
const PDF_SHA256 = '38d5ad8e7497c65c4fa2d374e7ed5e8d81ab79f3b25d1e0daa73321d45b9e7a6';
const PRODUCT_TITLE = 'HAOO Property Management | ZERO-PAPER HUB';
const PRODUCT_DESCRIPTION = 'Run the business—not the paperwork with HAOO, a property-management platform for landlords and property managers in Kenya. Choose assisted or self-onboarding.';
const PRODUCT_URL = 'https://www.zero-paperhub.com/products/haoo/';
const PRODUCT_IMAGE = `${PRODUCT_URL}brochure-preview.png`;
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

/** Phase 1 product source files — the static boundary later phases may observe but not breach. */
const PRODUCT_SOURCES = [
  'src/pages/ProductPage.tsx',
  'src/components/BrochurePanel.tsx',
  'src/components/OnboardingChoices.tsx',
  'src/components/ProductHeader.tsx',
  'src/components/ProductsSection.tsx',
  'src/products/haoo.ts',
  'src/products/copy.ts',
  'src/products/registry.ts',
  'src/products/types.ts',
];

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

  it('keeps the Phase 1 product surface free of tracking, storage, injection, and backend seams', () => {
    for (const relativePath of PRODUCT_SOURCES) {
      const source = readText(resolve(ROOT, relativePath));

      expect(source).not.toBe('');
      for (const forbidden of [
        /dangerouslySetInnerHTML/,
        /localStorage|sessionStorage|document\.cookie|indexedDB/,
        /gtag\(|dataLayer|analytics\./,
        /\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/,
        /formsubmit|FormData|<form\b/,
        /react-router|createBrowserRouter/,
        /document\.referrer|navigator\.userAgent|window\.location/,
        /supabase/i,
      ]) {
        expect(source).not.toMatch(forbidden);
      }
    }

    expect(existsSync(resolve(ROOT, 'components.json'))).toBe(false);
    expect(existsSync(resolve(ROOT, 'src/components/ui'))).toBe(false);
  });
});
