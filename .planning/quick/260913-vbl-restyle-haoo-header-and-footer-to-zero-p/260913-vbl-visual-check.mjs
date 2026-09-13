/**
 * Quick task 260913-vbl — visual check (OD-6).
 *
 * Run against a local preview of the current build:
 *   npm run build && npm run preview -- --port 4173 --strictPort &
 *   node .planning/quick/260913-vbl-restyle-haoo-header-and-footer-to-zero-p/260913-vbl-visual-check.mjs
 *
 * Writes measured readings only (no pass marks) to 260913-vbl-visual-check.json beside this file,
 * saves screenshots under ./screenshots/, and exits 1 when any check records a failure.
 * Requests to hosts other than the local preview and Google Fonts are aborted so no analytics
 * event leaves the machine.
 */
/* global document, window, getComputedStyle -- page.evaluate callbacks run in the browser */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, 'screenshots');
const OUT = join(HERE, '260913-vbl-visual-check.json');
const BASE = process.env.VISUAL_CHECK_BASE_URL ?? 'http://localhost:4173';
const ALLOWED_HOSTS = new Set(['localhost:4173', 'fonts.googleapis.com', 'fonts.gstatic.com']);

/** Mirrors PRODUCT_SECTION_LINKS in src/products/copy.ts. */
const SECTION_HREFS = ['#benefits', '#capabilities', '#brochure', '#qualify', '#onboarding'];
const MOBILE_NAV = '#haoo-mobile-navigation';
const DESKTOP_NAV = 'header nav:not([id])';
const TOGGLE = `button[aria-controls="haoo-mobile-navigation"]`;

const failures = [];
const observations = [];
const readings = {};
const fontResponses = [];

mkdirSync(SHOTS, { recursive: true });

/* ------------------------------------------------------------------ colour maths */

function parseColor(value) {
  const match = /rgba?\(([^)]+)\)/.exec(value);
  if (!match) throw new Error(`unparseable colour "${value}"`);
  const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
}

function composite(fg, bg) {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

function luminance({ r, g, b }) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const round = (n) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ browser plumbing */

async function openPage(browser, viewport, { reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion });
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return ALLOWED_HOSTS.has(url.host) ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  page.on('response', (response) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(response.url())) {
      fontResponses.push({ url: response.url().slice(0, 120), status: response.status() });
    }
  });
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.evaluate(() => Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, 8000)),
  ]));
  return { context, page };
}

async function scrollTo(page, top) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);
  await page.waitForTimeout(600);
}

/* ------------------------------------------------------------------ 1. screenshots */

async function screenshots(browser) {
  const shots = [];
  const save = async (target, name) => {
    await target.screenshot({ path: join(SHOTS, name) });
    shots.push(`screenshots/${name}`);
  };

  {
    const { context, page } = await openPage(browser, { width: 1440, height: 900 });
    await save(page, '1440-top.png');
    await scrollTo(page, 800);
    await save(page, '1440-scrolled.png');
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await save(page.locator('footer'), '1440-footer.png');
    await context.close();
  }
  {
    const { context, page } = await openPage(browser, { width: 768, height: 1024 });
    await save(page, '768-top.png');
    await context.close();
  }
  {
    const { context, page } = await openPage(browser, { width: 1024, height: 768 });
    await save(page, '1024-top.png');
    await context.close();
  }
  {
    const { context, page } = await openPage(browser, { width: 390, height: 844 });
    await save(page, '390-top.png');
    await scrollTo(page, 800);
    await save(page, '390-scrolled.png');
    await scrollTo(page, 0);
    await page.click(TOGGLE);
    await page.waitForTimeout(600);
    await save(page, '390-menu-open.png');
    await page.click(TOGGLE);
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await save(page.locator('footer'), '390-footer.png');
    await context.close();
  }
  {
    const { context, page } = await openPage(browser, { width: 320, height: 256 });
    await page.click(TOGGLE);
    await page.waitForTimeout(600);
    await save(page, '320x256-menu-open.png');
    await context.close();
  }

  readings.screenshots = shots;
}

/* ------------------------------------------------------------------ 2. anchored headings */

async function anchoredHeadings(browser) {
  const runs = [
    { label: '1440-reduce', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', wait: 300, mobile: false },
    { label: '390-reduce', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', wait: 300, mobile: true },
    { label: '1440-smooth', viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', wait: 1200, mobile: false },
  ];
  const results = [];

  for (const run of runs) {
    const { context, page } = await openPage(browser, run.viewport, { reducedMotion: run.reducedMotion });
    for (const href of SECTION_HREFS) {
      await page.goto(`${BASE}/`, { waitUntil: 'load' });
      if (run.mobile) {
        await page.click(TOGGLE);
        await page.click(`${MOBILE_NAV} a[href="${href}"]`);
      } else {
        await page.click(`${DESKTOP_NAV} a[href="${href}"]`);
      }
      await page.waitForTimeout(run.wait);
      const reading = await page.evaluate((target) => {
        const heading = document.querySelector(`${target} h2`);
        return {
          headerBottom: document.querySelector('header').getBoundingClientRect().bottom,
          headingTop: heading ? heading.getBoundingClientRect().top : null,
          headingText: heading ? heading.textContent : null,
          scrollY: window.scrollY,
        };
      }, href);
      results.push({ run: run.label, href, ...reading });
      if (reading.headingTop === null) {
        failures.push(`anchored heading: ${run.label} ${href} has no h2`);
      } else if (reading.headingTop < reading.headerBottom) {
        failures.push(`anchored heading: ${run.label} ${href} h2 top ${round(reading.headingTop)} is under header bottom ${round(reading.headerBottom)}`);
      }
    }
    await context.close();
  }

  readings.anchoredHeadings = results;
}

/* ------------------------------------------------------------------ 3. contrast */

async function readHeaderColours(page) {
  return page.evaluate(() => {
    const header = document.querySelector('header');
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[hidden]');
    };
    const controls = Array.from(header.querySelectorAll('a, button')).filter(visible).map((el) => ({
      name: el.getAttribute('aria-label') ?? el.textContent.trim(),
      kind: el.tagName === 'BUTTON' ? 'icon' : 'text',
      color: getComputedStyle(el).color,
      ownBackground: getComputedStyle(el).backgroundColor,
      hasImage: Boolean(el.querySelector('img')),
    }));
    return {
      headerBackground: getComputedStyle(header).backgroundColor,
      heroBackground: getComputedStyle(document.querySelector('main section:first-of-type')).backgroundColor,
      controls,
    };
  });
}

function measureControls(label, data, fallbackBackdrop) {
  const headerBg = parseColor(data.headerBackground);
  const hero = parseColor(fallbackBackdrop ?? data.heroBackground);
  const context = headerBg.a > 0 ? composite(headerBg, hero) : hero;
  const rows = [];

  for (const control of data.controls) {
    if (control.hasImage) continue; // the logo link paints no text
    const own = parseColor(control.ownBackground);
    const backdrop = own.a > 0 ? composite(own, context) : context;
    const fg = composite(parseColor(control.color), backdrop);
    const ratio = contrast(fg, backdrop);
    const threshold = control.kind === 'icon' ? 3 : 4.5;
    rows.push({ state: label, name: control.name, foreground: hex(fg), backdrop: hex(backdrop), ratio: round(ratio), threshold });
    if (ratio < threshold) {
      failures.push(`contrast: ${label} "${control.name}" ${round(ratio)}:1 below ${threshold}:1`);
    }
  }
  return rows;
}

async function contrastChecks(browser) {
  const rows = [];

  for (const width of [1440, 390]) {
    const viewport = width === 1440 ? { width, height: 900 } : { width, height: 844 };
    const { context, page } = await openPage(browser, viewport);
    rows.push(...measureControls(`${width}-top`, await readHeaderColours(page)));
    await scrollTo(page, 800);
    rows.push(...measureControls(`${width}-scrolled`, await readHeaderColours(page)));

    if (width === 390) {
      await scrollTo(page, 0);
      await page.click(TOGGLE);
      await page.waitForTimeout(600);
      const panel = await page.evaluate((selector) => Array.from(document.querySelectorAll(`${selector} a`)).map((el) => ({
        name: el.textContent.trim(),
        kind: 'text',
        color: getComputedStyle(el).color,
        ownBackground: getComputedStyle(el).backgroundColor,
        hasImage: false,
      })), MOBILE_NAV);
      rows.push(...measureControls('390-menu-panel', {
        headerBackground: 'rgb(255, 255, 255)',
        heroBackground: 'rgb(255, 255, 255)',
        controls: panel,
      }));
    }

    if (width === 1440) {
      const footer = await page.evaluate(() => Array.from(document.querySelectorAll('footer a, footer p')).map((el) => ({
        name: `${el.tagName.toLowerCase()}: ${(el.getAttribute('aria-label') ?? el.textContent).trim().slice(0, 60)}`,
        kind: 'text',
        color: getComputedStyle(el).color,
        ownBackground: getComputedStyle(el).backgroundColor,
        hasImage: Boolean(el.querySelector('img')),
      })));
      rows.push(...measureControls('footer', {
        headerBackground: 'rgba(0, 0, 0, 0)',
        heroBackground: 'rgb(15, 26, 69)',
        controls: footer,
      }));
    }
    await context.close();
  }

  readings.contrast = rows;
}

/* ------------------------------------------------------------------ 4. axe */

async function axeChecks(browser) {
  const scans = [];
  const record = async (label, builder) => {
    const result = await builder.analyze();
    scans.push({
      label,
      violations: result.violations.length,
      violationIds: result.violations.map((v) => v.id),
      incomplete: result.incomplete.length,
      incompleteIds: result.incomplete.map((v) => v.id),
    });
    if (result.violations.length > 0) {
      failures.push(`axe: ${label} reported ${result.violations.length} violation(s): ${result.violations.map((v) => v.id).join(', ')}`);
    }
  };

  {
    const { context, page } = await openPage(browser, { width: 1440, height: 900 });
    await record('header color-contrast 1440 top', new AxeBuilder({ page }).withRules(['color-contrast']).include('header'));
    await scrollTo(page, 800);
    await record('header color-contrast 1440 scrolled', new AxeBuilder({ page }).withRules(['color-contrast']).include('header'));
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(600);
    await record('footer all rules 1440 bottom', new AxeBuilder({ page }).include('footer'));
    await context.close();
  }
  {
    const { context, page } = await openPage(browser, { width: 390, height: 844 });
    await scrollTo(page, 800);
    await page.click(TOGGLE);
    await page.waitForTimeout(600);
    await record('header color-contrast 390 scrolled menu open', new AxeBuilder({ page }).withRules(['color-contrast']).include('header'));
    await context.close();
  }

  readings.axe = scans;
}

/* ------------------------------------------------------------------ 5. overflow */

async function overflowChecks(browser) {
  const sizes = [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 740 },
    { width: 320, height: 256 },
  ];
  const rows = [];

  for (const viewport of sizes) {
    const { context, page } = await openPage(browser, viewport);
    const reading = await page.evaluate(() => {
      const root = document.documentElement;
      const offenders = Array.from(document.querySelectorAll('header *'))
        .map((el) => ({ el, right: el.getBoundingClientRect().right }))
        .filter(({ right }) => right > window.innerWidth + 1)
        .map(({ el, right }) => `${el.tagName.toLowerCase()}${el.textContent.trim() ? ` "${el.textContent.trim().slice(0, 30)}"` : ''} right=${Math.round(right)}`);
      // Line boxes, not element height: min-h-11 hides a two-line wrap inside a 44px link.
      const lineCount = (el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return new Set(Array.from(range.getClientRects())
          .filter((rect) => rect.width > 0)
          .map((rect) => Math.round(rect.top))).size;
      };
      const desktopLinks = Array.from(document.querySelectorAll('header nav:not([id]) a'))
        .map((el) => ({
          name: el.textContent.trim(),
          height: Math.round(el.getBoundingClientRect().height),
          lines: lineCount(el),
        }))
        .filter(({ height }) => height > 0);
      return {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        innerWidth: window.innerWidth,
        headerOffenders: offenders,
        desktopLinkHeights: desktopLinks,
      };
    });
    rows.push({ viewport: `${viewport.width}x${viewport.height}`, ...reading });
    if (reading.scrollWidth > reading.clientWidth) {
      failures.push(`overflow: ${viewport.width}x${viewport.height} scrollWidth ${reading.scrollWidth} > clientWidth ${reading.clientWidth}`);
    }
    if (reading.headerOffenders.length > 0) {
      failures.push(`overflow: ${viewport.width}x${viewport.height} header descendants past the viewport: ${reading.headerOffenders.join('; ')}`);
    }
    const wrapped = reading.desktopLinkHeights.filter(({ lines }) => lines > 1);
    if (wrapped.length > 0) {
      failures.push(`header wrap: desktop nav at ${viewport.width}px wraps ${wrapped.map((w) => `"${w.name}" onto ${w.lines} lines`).join(', ')}`);
    }
    await context.close();
  }

  readings.overflow = rows;
}

/* ------------------------------------------------------------------ 6. menu reachability */

async function menuReachability(browser) {
  const { context, page } = await openPage(browser, { width: 320, height: 256 });
  await page.click(TOGGLE);
  const last = page.locator(`${MOBILE_NAV} a`).last();
  await last.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const reading = await last.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      name: el.textContent.trim(),
      centre: { x: Math.round(x), y: Math.round(y) },
      height: Math.round(rect.height),
      hitIsLink: hit === el || el.contains(hit),
      hit: hit ? `${hit.tagName.toLowerCase()} ${hit.textContent.trim().slice(0, 30)}` : null,
    };
  });
  readings.menuReachability = reading;
  if (reading.name !== 'Get started') failures.push(`menu reachability: last panel link is "${reading.name}", expected "Get started"`);
  if (!reading.hitIsLink) failures.push(`menu reachability: elementFromPoint at the Get started centre is ${reading.hit}`);
  await context.close();
}

/* ------------------------------------------------------------------ 7. skip link */

async function skipLink(browser) {
  const { context, page } = await openPage(browser, { width: 1440, height: 900 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  const reading = await page.evaluate(() => {
    const active = document.activeElement;
    const rect = active.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return {
      focused: active.textContent.trim(),
      rect: { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) },
      hitIsSkipLink: hit === active || active.contains(hit),
      hit: hit ? `${hit.tagName.toLowerCase()} ${hit.textContent.trim().slice(0, 30)}` : null,
      zIndex: getComputedStyle(active).zIndex,
    };
  });
  readings.skipLink = reading;
  if (reading.focused !== 'Skip to HAOO content') failures.push(`skip link: first Tab focused "${reading.focused}"`);
  if (!reading.hitIsSkipLink) failures.push(`skip link: elementFromPoint at its centre is ${reading.hit}`);
  await context.close();
}

/* ------------------------------------------------------------------ 8. reduced motion */

async function reducedMotion(browser) {
  const { context, page } = await openPage(browser, { width: 1440, height: 900 }, { reducedMotion: 'reduce' });
  const reading = await page.evaluate(() => {
    const style = getComputedStyle(document.querySelector('header'));
    return { transitionProperty: style.transitionProperty, transitionDuration: style.transitionDuration };
  });
  readings.reducedMotion = reading;
  const durationsZero = reading.transitionDuration.split(',').every((d) => Number.parseFloat(d) === 0);
  if (!durationsZero && reading.transitionProperty !== 'none') {
    failures.push(`reduced motion: header transition ${reading.transitionProperty} ${reading.transitionDuration}`);
  }
  await context.close();
}

/* ------------------------------------------------------------------ 9. font */

async function font(browser) {
  const { context, page } = await openPage(browser, { width: 1440, height: 900 });
  const reading = await page.evaluate(async () => {
    await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 8000))]);
    const h1 = getComputedStyle(document.querySelector('h1'));
    const link = document.querySelector('header nav:not([id]) a');
    const cta = Array.from(document.querySelectorAll('header nav:not([id]) a')).find((a) => a.textContent.trim() === 'Get started');
    return {
      notoSans900Loaded: document.fonts.check('900 40px "Noto Sans"'),
      h1FontFamily: h1.fontFamily,
      h1FontWeight: h1.fontWeight,
      headerLinkFontWeight: getComputedStyle(link).fontWeight,
      ctaFontWeight: cta ? getComputedStyle(cta).fontWeight : null,
      sectionH2FontWeight: getComputedStyle(document.querySelector('h2')).fontWeight,
    };
  });
  readings.font = { ...reading, fontResponses: fontResponses.slice(0, 10) };
  if (reading.h1FontWeight !== '900') failures.push(`font: h1 weight ${reading.h1FontWeight}`);
  if (!reading.h1FontFamily.replace(/["']/g, '').startsWith('Noto Sans')) failures.push(`font: h1 family ${reading.h1FontFamily}`);
  if (!reading.notoSans900Loaded) {
    observations.push('font: document.fonts.check reported Noto Sans 900 not loaded (Google Fonts may be unreachable); recorded as an observation, not a failure');
  }
  await context.close();
}

/* ------------------------------------------------------------------ 10. footer counts */

async function footerCounts(browser) {
  const { context, page } = await openPage(browser, { width: 1440, height: 900 });
  const reading = await page.evaluate(() => ({
    telLinks: document.querySelectorAll('footer a[href^="tel:"]').length,
    mailtoLinks: document.querySelectorAll('footer a[href^="mailto:"]').length,
    parentSiteAnchors: document.querySelectorAll('a[href*="zero-paperhub"]').length,
  }));
  readings.footerCounts = reading;
  if (reading.telLinks !== 1) failures.push(`footer counts: ${reading.telLinks} tel: links`);
  if (reading.mailtoLinks !== 1) failures.push(`footer counts: ${reading.mailtoLinks} mailto: links`);
  if (reading.parentSiteAnchors !== 0) failures.push(`footer counts: ${reading.parentSiteAnchors} zero-paperhub anchors`);
  await context.close();
}

/* ------------------------------------------------------------------ main */

const browser = await chromium.launch();
try {
  await screenshots(browser);
  await anchoredHeadings(browser);
  await contrastChecks(browser);
  await axeChecks(browser);
  await overflowChecks(browser);
  await menuReachability(browser);
  await skipLink(browser);
  await reducedMotion(browser);
  await font(browser);
  await footerCounts(browser);
} catch (error) {
  failures.push(`script error: ${error instanceof Error ? error.stack : String(error)}`);
} finally {
  await browser.close();
}

writeFileSync(OUT, `${JSON.stringify({
  task: 'quick-260913-vbl',
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  failures,
  observations,
  readings,
}, null, 2)}\n`);

console.log(`visual check: ${failures.length} failure(s), ${observations.length} observation(s) -> ${OUT}`);
for (const failure of failures) console.log(`  FAIL ${failure}`);
for (const observation of observations) console.log(`  NOTE ${observation}`);
process.exit(failures.length > 0 ? 1 : 0);
