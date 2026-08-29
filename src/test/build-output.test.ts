import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
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

function readText(path: string) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function sha256(path: string) {
  return existsSync(path)
    ? createHash('sha256').update(readFileSync(path)).digest('hex')
    : '';
}

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
});
