/**
 * Quick task 260913-x19 — visual check (space use across the HAOO page).
 *
 * Needs only a prior build:
 *   npm run build
 *   node .planning/quick/260913-x19-optimize-space-use-across-haoo-page-sect/260913-x19-visual-check.mjs
 *
 * When VISUAL_CHECK_BASE_URL (default http://localhost:4173) does not answer, the script starts
 * `vite preview --port 4173 --strictPort` itself as a child process and stops it by PID on exit.
 *
 * Writes measured readings only (no pass marks) to 260913-x19-visual-check.json beside this file,
 * saves element screenshots under ./after/, and exits 1 when any check records a failure.
 * Requests to hosts other than the local preview and Google Fonts are aborted, so no analytics
 * event leaves the machine. The route is a host allowlist on purpose: a `/posthog/` URL pattern
 * would also block the site's own posthog-sdk asset chunk and blank the page.
 */
/* global document, window, getComputedStyle, navigator -- page.evaluate callbacks run in the browser */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const SHOTS = join(HERE, 'after');
const OUT = join(HERE, '260913-x19-visual-check.json');
const BASE = process.env.VISUAL_CHECK_BASE_URL ?? 'http://localhost:4173';
const ALLOWED_HOSTS = new Set([new URL(BASE).host, 'fonts.googleapis.com', 'fonts.gstatic.com']);

/** Mirrors PRODUCT_SECTION_LINKS in src/products/copy.ts. */
const SECTION_HREFS = ['#benefits', '#capabilities', '#brochure', '#qualify', '#onboarding'];
const MOBILE_NAV = '#haoo-mobile-navigation';
const DESKTOP_NAV = 'header nav:not([id])';
const TOGGLE = `button[aria-controls="haoo-mobile-navigation"]`;
const ONBOARDING_REGIONS = 'section[aria-label$="onboarding choices"]';
const JOURNEY_HEADING = 'Rental journey';
/** The #qualify split breakpoint that shipped (PD-3). */
const QUALIFY_SPLIT = 'xl';

/**
 * Live measurements supplied by the orchestrator before this task (desktop 1440 / mobile 390).
 * Section selectors are resolved in the page by `tagSections`.
 */
const SECTIONS = [
  { id: 's00', name: 'hero', before: { 1440: 928, 390: 1505 } },
  { id: 's01', name: 'Who HAOO supports', before: { 1440: 197, 390: 407 } },
  { id: 's02', name: 'Benefits', before: { 1440: 347, 390: 542 } },
  { id: 's03', name: 'Capabilities', before: { 1440: 750, 390: 1532 } },
  { id: 's04', name: 'Rental journey', before: { 1440: 672, 390: 851 } },
  { id: 's05', name: 'onboarding block after journey', before: { 1440: 497, 390: 797 } },
  { id: 's06', name: 'Brochure', before: { 1440: 668, 390: 741 } },
  { id: 's07', name: 'Send your details', before: { 1440: 2082, 390: 2247 } },
  { id: 's08', name: '#onboarding', before: { 1440: 561, 390: 845 } },
  { id: 's09', name: 'footer', before: { 1440: 245, 390: 472 } },
];
const BEFORE_PAGE_TOTAL = { 1440: 6947, 390: 9940 };

const VIEWPORTS = {
  1440: { width: 1440, height: 900 },
  1280: { width: 1280, height: 800 },
  1024: { width: 1024, height: 768 },
  768: { width: 768, height: 1024 },
  390: { width: 390, height: 844 },
  360: { width: 360, height: 740 },
  320: { width: 320, height: 640 },
};
const SHOT_WIDTHS = [1440, 1024, 768, 390, 320];

const failures = [];
const observations = [];
const readings = {};

mkdirSync(SHOTS, { recursive: true });

const round = (n) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ preview server */

async function answers(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensurePreview() {
  if (await answers(BASE)) {
    readings.previewServer = 'reused an already-running server';
    return null;
  }
  const port = new URL(BASE).port || '4173';
  const child = spawn(process.execPath, ['node_modules/.bin/vite', 'preview', '--port', port, '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
  });
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await answers(BASE)) {
      readings.previewServer = `started vite preview as child pid ${child.pid}`;
      return child;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill('SIGTERM');
  throw new Error(`vite preview did not answer at ${BASE} within 30s`);
}

/* ------------------------------------------------------------------ browser plumbing */

async function newRoutedContext(browser, viewport, { reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion });
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return ALLOWED_HOSTS.has(url.host) ? route.continue() : route.abort();
  });
  return context;
}

async function openPage(browser, viewport, options = {}) {
  const context = await newRoutedContext(browser, viewport, options);
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.evaluate(() => Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, 8000)),
  ]));
  await tagSections(page);
  return { context, page };
}

async function scrollTo(page, top) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);
  await page.waitForTimeout(400);
}

/** Marks s00-s09 with data-vc so every check and screenshot uses one resolution. */
async function tagSections(page) {
  const missing = await page.evaluate((journeyHeading) => {
    const main = document.querySelector('main');
    const topSections = Array.from(main.children).filter((el) => el.tagName === 'SECTION');
    const found = {
      s00: topSections[0],
      s01: document.querySelector('section[aria-labelledby="audiences-heading"]'),
      s02: document.getElementById('benefits'),
      s03: document.getElementById('capabilities'),
      s04: topSections.find((section) => Array.from(section.querySelectorAll('h2'))
        .some((h2) => h2.textContent.trim() === journeyHeading)),
      s05: Array.from(main.children).find((el) => el.tagName === 'DIV'
        && el.querySelector(':scope > section[aria-label="Mid-page onboarding choices"]')),
      s06: document.getElementById('brochure'),
      s07: document.getElementById('qualify'),
      s08: document.getElementById('onboarding'),
      s09: document.querySelector('footer'),
    };
    const absent = [];
    for (const [id, el] of Object.entries(found)) {
      if (el) el.setAttribute('data-vc', id);
      else absent.push(id);
    }
    return absent;
  }, JOURNEY_HEADING);
  if (missing.length > 0) failures.push(`sections: could not resolve ${missing.join(', ')}`);
}

/* ------------------------------------------------------------------ 1. heights and screenshots */

async function heightsAndShots(browser, { shotIds = SECTIONS.map((s) => s.id) } = {}) {
  const heights = {};
  const shots = [];

  for (const width of SHOT_WIDTHS) {
    const { context, page } = await openPage(browser, VIEWPORTS[width]);
    // Let lazy images settle so heights are final: walk the page once.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += VIEWPORTS[width].height) await scrollTo(page, y);
    await scrollTo(page, 0);

    const measured = await page.evaluate(() => Object.fromEntries(
      Array.from(document.querySelectorAll('[data-vc]'))
        .map((el) => [el.getAttribute('data-vc'), Math.round(el.getBoundingClientRect().height)]),
    ));
    measured.pageTotal = await page.evaluate(() => document.documentElement.scrollHeight);
    heights[width] = measured;

    // The fixed header would overlay element shots, so it is hidden for screenshots only.
    await page.addStyleTag({ content: 'header { visibility: hidden !important; }' });
    for (const section of SECTIONS.filter((s) => shotIds.includes(s.id))) {
      const locator = page.locator(`[data-vc="${section.id}"]`);
      // Section top at the viewport top, so sticky content is captured at its unscrolled position.
      await page.evaluate((id) => {
        const el = document.querySelector(`[data-vc="${id}"]`);
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
      }, section.id);
      await page.waitForTimeout(300);
      const name = `${width}-${section.id}.png`;
      await locator.screenshot({ path: join(SHOTS, name) });
      shots.push(`after/${name}`);
    }
    await context.close();
  }

  readings.sectionHeights = SECTIONS.map((section) => ({
    id: section.id,
    name: section.name,
    before1440: section.before[1440],
    before390: section.before[390],
    after: Object.fromEntries(SHOT_WIDTHS.map((w) => [w, heights[w][section.id] ?? null])),
  }));
  readings.pageTotal = {
    before1440: BEFORE_PAGE_TOTAL[1440],
    before390: BEFORE_PAGE_TOTAL[390],
    after: Object.fromEntries(SHOT_WIDTHS.map((w) => [w, heights[w].pageTotal])),
  };
  readings.screenshots = shots;
  observations.push('screenshots: the fixed header is hidden with an injected visibility:hidden style during element screenshots so it does not overlay the shot; heights are measured before that style is added');
}

/* ------------------------------------------------------------------ 2. overflow */

async function overflowChecks(browser) {
  const sizes = [1440, 1280, 1024, 768, 390, 360].map((w) => VIEWPORTS[w]).concat([{ width: 320, height: 256 }]);
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

/* ------------------------------------------------------------------ 3. form order and alignment */

/** Visible form controls in DOM order, excluding the honeypot's aria-hidden wrapper. */
function readControls(page) {
  return page.evaluate(() => {
    const form = document.querySelector('#qualify form');
    return Array.from(form.querySelectorAll('input, select, textarea, summary, button'))
      .filter((el) => !el.closest('[aria-hidden="true"]'))
      // Closed <details> content still reports a box in Chromium (content-visibility), so skip it.
      .filter((el) => {
        const closed = el.closest('details:not([open])');
        return !closed || el === closed.querySelector(':scope > summary');
      })
      .map((el, index) => {
        el.setAttribute('data-vc-order', String(index));
        const rect = el.getBoundingClientRect();
        return {
          index,
          name: el.id || el.tagName.toLowerCase(),
          tag: el.tagName.toLowerCase(),
          inFieldset: Boolean(el.closest('fieldset')),
          invalid: el.getAttribute('aria-invalid') === 'true',
          top: rect.top + window.scrollY,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
      })
      .filter((c) => c.width > 0 && c.height > 0);
  });
}

/** Row-wise reading order; returns failure strings. */
function rowWiseProblems(label, controls) {
  const problems = [];
  for (let i = 1; i < controls.length; i += 1) {
    const prev = controls[i - 1];
    const cur = controls[i];
    const delta = cur.top - prev.top;
    const sameRow = Math.abs(delta) <= 2;
    const after = delta > 2 || (sameRow && cur.left > prev.left);
    if (!after) {
      problems.push(`${label}: ${cur.name} (top ${round(cur.top)}, left ${round(cur.left)}) is not after ${prev.name} (top ${round(prev.top)}, left ${round(prev.left)}) in row-wise order`);
    }
    if (sameRow && Math.abs(delta) > 1) {
      problems.push(`${label}: ${prev.name} and ${cur.name} share a row but their tops differ by ${round(Math.abs(delta))}px`);
    }
  }
  return problems;
}

async function formOrder(browser) {
  const rows = [];

  for (const width of [1440, 1280, 1024, 768]) {
    const { context, page } = await openPage(browser, VIEWPORTS[width]);
    const controls = await readControls(page);
    const problems = rowWiseProblems(`form order ${width}`, controls);
    failures.push(...problems);
    const pairs = [];
    for (let i = 1; i < controls.length; i += 1) {
      if (Math.abs(controls[i].top - controls[i - 1].top) <= 2) {
        pairs.push({ left: controls[i - 1].name, right: controls[i].name, topDelta: round(controls[i].top - controls[i - 1].top) });
      }
    }
    rows.push({ width, controls: controls.map(({ name, top, left, width: w }) => ({ name, top: round(top), left: round(left), width: round(w) })), pairs });
    await context.close();
  }

  for (const width of [390, 320]) {
    const { context, page } = await openPage(browser, VIEWPORTS[width]);
    const controls = (await readControls(page)).filter((c) => c.inFieldset);
    const lefts = [...new Set(controls.map((c) => round(c.left)))];
    rows.push({ width, fieldControlLefts: lefts });
    if (lefts.length !== 1) failures.push(`form single column ${width}: field controls have ${lefts.length} left edges (${lefts.join(', ')})`);
    await context.close();
  }

  readings.formOrder = rows;
}

async function tabOrder(browser) {
  const { context, page } = await openPage(browser, VIEWPORTS[1440]);
  const controls = await readControls(page);
  const expected = controls.map((c) => c.index);
  const first = page.locator(`#qualify form [data-vc-order="${controls[0].index}"]`);
  await first.focus();
  const seen = [];
  for (let step = 0; step < 60; step += 1) {
    const current = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        order: active?.getAttribute('data-vc-order'),
        tag: active?.tagName.toLowerCase(),
        type: active?.getAttribute('type'),
      };
    });
    seen.push(current.order === null ? `outside:${current.tag}` : Number(current.order));
    if (current.tag === 'button' && current.type === 'submit') break;
    await page.keyboard.press('Tab');
  }
  readings.tabOrder = { expected, seen };
  if (JSON.stringify(seen) !== JSON.stringify(expected)) {
    failures.push(`tab order 1440: focus sequence ${JSON.stringify(seen)} differs from DOM order ${JSON.stringify(expected)}`);
  }
  await context.close();
}

async function errorSummaryOrder(browser) {
  const { context, page } = await openPage(browser, VIEWPORTS[1440]);
  await page.locator('#qualify form button[type="submit"]').click();
  await page.waitForTimeout(400);
  const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('#qualify [role="alert"] a'))
    .map((a) => a.getAttribute('href')));
  const controls = (await readControls(page)).filter((c) => c.invalid);
  const invalidIds = controls.map((c) => `#${c.name}`);
  readings.errorSummary = { hrefs, invalidControlsInDomOrder: invalidIds };
  if (hrefs.length === 0) failures.push('error summary 1440: no role=alert links after an empty submit');
  if (JSON.stringify(hrefs) !== JSON.stringify(invalidIds)) {
    failures.push(`error summary 1440: link order ${JSON.stringify(hrefs)} differs from invalid control DOM order ${JSON.stringify(invalidIds)}`);
  }
  failures.push(...rowWiseProblems('error summary visual order 1440', controls));
  await context.close();
}

/* ------------------------------------------------------------------ 4. sticky lead column */

async function stickyColumn(browser) {
  const rows = [];
  // Sticky applies from the shipped split (xl = 1280); 1024 is recorded as the stacked layout.
  for (const width of [1440, 1280, 1024]) {
    const { context, page } = await openPage(browser, VIEWPORTS[width]);
    const sectionTop = await page.evaluate(() => document.getElementById('qualify').getBoundingClientRect().top + window.scrollY);
    await scrollTo(page, sectionTop + 700);
    const reading = await page.evaluate(() => {
      const h2 = document.querySelector('#qualify h2');
      const column = h2.parentElement;
      const rect = h2.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + Math.min(rect.width, 120) / 2, rect.top + rect.height / 2);
      return {
        sectionTop: document.getElementById('qualify').getBoundingClientRect().top,
        columnTop: column.getBoundingClientRect().top,
        columnPosition: getComputedStyle(column).position,
        headerBottom: document.querySelector('header').getBoundingClientRect().bottom,
        h2Top: rect.top,
        hitIsHeading: hit === h2 || h2.contains(hit),
        hit: hit ? `${hit.tagName.toLowerCase()} ${hit.textContent.trim().slice(0, 30)}` : null,
      };
    });
    rows.push({ width, ...reading });
    if (width < 1280) {
      if (reading.columnPosition !== 'static') failures.push(`sticky column ${width}: below the xl split the lead column is ${reading.columnPosition}, expected static (stacked)`);
      await context.close();
      continue;
    }
    if (reading.columnTop < reading.headerBottom) {
      failures.push(`sticky column ${width}: left column top ${round(reading.columnTop)} is under header bottom ${round(reading.headerBottom)}`);
    }
    if (!reading.hitIsHeading) failures.push(`sticky column ${width}: elementFromPoint at the h2 centre is ${reading.hit}`);
    await context.close();
  }
  readings.stickyColumn = rows;
}

/* ------------------------------------------------------------------ 5. anchored headings */

async function anchoredHeadings(browser) {
  const runs = [
    { label: '1440-reduce', viewport: VIEWPORTS[1440], mobile: false },
    { label: '390-reduce', viewport: VIEWPORTS[390], mobile: true },
  ];
  const results = [];

  for (const run of runs) {
    const { context, page } = await openPage(browser, run.viewport, { reducedMotion: 'reduce' });
    for (const href of SECTION_HREFS) {
      await page.goto(`${BASE}/`, { waitUntil: 'load' });
      if (run.mobile) {
        await page.click(TOGGLE);
        await page.click(`${MOBILE_NAV} a[href="${href}"]`);
      } else {
        await page.click(`${DESKTOP_NAV} a[href="${href}"]`);
      }
      await page.waitForTimeout(300);
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

/* ------------------------------------------------------------------ 6. journey stepper and titles */

async function journeyAndTitles(browser) {
  const rows = [];
  const expectedRows = { 1440: 1, 1280: 1, 1024: 1, 768: 2, 390: 4, 320: 4 };

  for (const width of [1440, 1280, 1024, 768, 390, 320]) {
    const { context, page } = await openPage(browser, VIEWPORTS[width]);
    const reading = await page.evaluate(() => {
      const journey = document.querySelector('[data-vc="s04"]');
      const items = Array.from(journey.querySelectorAll('ol > li'));
      const tops = [];
      for (const item of items) {
        const top = item.getBoundingClientRect().top;
        if (!tops.some((t) => Math.abs(t - top) <= 2)) tops.push(top);
      }
      const connectors = Array.from(journey.querySelectorAll('li [aria-hidden="true"]'))
        .filter((el) => el.textContent === '');
      const size = (el) => getComputedStyle(el).fontSize;
      return {
        rows: tops.length,
        // Title tops within each visual row: a stretched li must not push shorter steps' titles down.
        titleTopSpreadPerRow: tops.map((rowTop) => {
          const titleTops = items.filter((li) => Math.abs(li.getBoundingClientRect().top - rowTop) <= 2)
            .map((li) => li.querySelector('h3').getBoundingClientRect().top);
          return Math.round((Math.max(...titleTops) - Math.min(...titleTops)) * 100) / 100;
        }),
        connectorsVisible: connectors.filter((el) => el.getBoundingClientRect().width > 0).length,
        connectorWidths: connectors.map((el) => Math.round(el.getBoundingClientRect().width)),
        capabilityTitleSizes: [...new Set(Array.from(document.querySelectorAll('#capabilities li h3')).map(size))],
        journeyTitleSizes: [...new Set(items.map((li) => size(li.querySelector('h3'))))],
        h2Sizes: [...new Set(Array.from(document.querySelectorAll('h2')).map(size))],
        benefitH3Sizes: [...new Set(Array.from(document.querySelectorAll('#benefits h3')).map(size))],
      };
    });
    rows.push({ width, ...reading });
    if (reading.rows !== expectedRows[width]) failures.push(`journey rows ${width}: ${reading.rows}, expected ${expectedRows[width]}`);
    for (const spread of reading.titleTopSpreadPerRow) {
      if (spread > 1) failures.push(`journey title alignment ${width}: step title tops in one row differ by ${spread}px`);
    }
    const expectedConnectors = width >= 1024 ? 3 : 0;
    if (reading.connectorsVisible !== expectedConnectors) failures.push(`journey connectors ${width}: ${reading.connectorsVisible} visible, expected ${expectedConnectors}`);
    const titleSize = width >= 768 ? '20px' : '18px';
    for (const [label, sizes] of [['capability', reading.capabilityTitleSizes], ['journey', reading.journeyTitleSizes]]) {
      if (sizes.length !== 1 || sizes[0] !== titleSize) failures.push(`title size ${width}: ${label} h3 ${sizes.join('/')}, expected ${titleSize}`);
    }
    if (reading.h2Sizes.length !== 1 || reading.h2Sizes[0] !== '28px') failures.push(`title size ${width}: section h2 ${reading.h2Sizes.join('/')}, expected 28px`);
    await context.close();
  }

  readings.journeyAndTitles = rows;
}

/* ------------------------------------------------------------------ 7. onboarding dead space */

async function onboardingDeadSpace(browser) {
  const rows = [];
  for (const width of [1440, 1024]) {
    const { context, page } = await openPage(browser, VIEWPORTS[width]);
    const reading = await page.evaluate((selector) => Array.from(document.querySelectorAll(selector)).map((region) => ({
      region: region.getAttribute('aria-label'),
      cards: Array.from(region.children).map((card) => {
        const last = card.lastElementChild;
        const deadSpace = card.getBoundingClientRect().bottom
          - (last.getBoundingClientRect().bottom + Number.parseFloat(getComputedStyle(card).paddingBottom));
        return {
          heading: card.querySelector('h2')?.textContent,
          height: Math.round(card.getBoundingClientRect().height),
          deadSpace: Math.round(deadSpace * 100) / 100,
        };
      }),
    })), ONBOARDING_REGIONS);
    rows.push({ width, regions: reading });
    if (reading.length !== 3) failures.push(`onboarding ${width}: ${reading.length} regions, expected 3`);
    for (const region of reading) {
      for (const card of region.cards) {
        if (card.deadSpace > 4) failures.push(`onboarding dead space ${width}: "${card.heading}" in ${region.region} has ${card.deadSpace}px`);
      }
    }
    await context.close();
  }
  readings.onboardingDeadSpace = rows;
}

/* ------------------------------------------------------------------ 8. axe color-contrast and targets */

async function contrastAndTargets(browser) {
  const scans = [];
  const targets = [];
  for (const width of [1440, 390]) {
    const { context, page } = await openPage(browser, VIEWPORTS[width]);
    // Walk the page once so lazy media and reveal states are settled before axe reads colours.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += VIEWPORTS[width].height) await scrollTo(page, y);
    const result = await new AxeBuilder({ page })
      .options({ runOnly: { type: 'rule', values: ['color-contrast'] } })
      .include('[data-vc="s04"]')
      .include(ONBOARDING_REGIONS)
      .include('#brochure')
      .include('#qualify')
      .analyze();
    scans.push({
      width,
      violations: result.violations.length,
      violationNodes: result.violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(' ')}: ${n.failureSummary?.split('\n').slice(0, 2).join(' ')}`)),
      incomplete: result.incomplete.flatMap((v) => v.nodes.map((n) => n.target.join(' '))).length,
    });
    if (result.violations.length > 0) {
      failures.push(`axe color-contrast ${width}: ${result.violations.flatMap((v) => v.nodes).length} node(s): ${scans.at(-1).violationNodes.join(' | ')}`);
    }

    const reading = await page.evaluate((selector) => {
      const scopes = [...document.querySelectorAll(selector), document.getElementById('brochure'), document.querySelector('#qualify form')];
      const visible = (el) => {
        const rect = el.getBoundingClientRect();
        const closed = el.closest('details:not([open])');
        const inClosed = closed && el !== closed.querySelector(':scope > summary');
        return rect.width > 0 && rect.height > 0 && !inClosed && !el.closest('[aria-hidden="true"]') && getComputedStyle(el).visibility !== 'hidden';
      };
      const describe = (el) => `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent).trim().slice(0, 40)}"`;
      const actions = scopes.flatMap((scope) => Array.from(scope.querySelectorAll('a, button, summary'))).filter(visible)
        .map((el) => ({ name: describe(el), height: Math.round(el.getBoundingClientRect().height * 100) / 100 }));
      const fields = Array.from(document.querySelectorAll('#qualify form select, #qualify form input, #qualify form textarea')).filter(visible)
        .map((el) => ({ name: el.id || el.name, height: Math.round(el.getBoundingClientRect().height * 100) / 100 }));
      return { actions, fields };
    }, ONBOARDING_REGIONS);
    targets.push({ width, ...reading });
    for (const action of reading.actions) {
      if (action.height < 44) failures.push(`target ${width}: ${action.name} is ${action.height}px tall`);
    }
    await context.close();
  }
  readings.axeColorContrast = scans;
  readings.targets = targets;
}

/* ------------------------------------------------------------------ 9. brochure PDF probe */

async function pdfProbe(browser) {
  const probes = [{ label: 'playwright headless shell', browser, owned: false }];
  if (process.env.DISPLAY) {
    try {
      probes.push({ label: 'playwright chromium headed', browser: await chromium.launch({ headless: false }), owned: true });
    } catch (error) {
      observations.push(`pdfProbe: headed Playwright Chromium failed to launch: ${String(error).split('\n')[0]}`);
    }
  } else {
    observations.push('pdfProbe: DISPLAY unset, headed Playwright Chromium not probed');
  }
  if (existsSync('/snap/bin/chromium')) {
    try {
      probes.push({ label: '/snap/bin/chromium headed', browser: await chromium.launch({ headless: false, executablePath: '/snap/bin/chromium' }), owned: true });
    } catch (error) {
      observations.push(`pdfProbe: /snap/bin/chromium failed to launch: ${String(error).split('\n')[0]}`);
    }
  }

  const rows = [];
  for (const probe of probes) {
    const context = await newRoutedContext(probe.browser, VIEWPORTS[1440]);
    try {
      const page = await context.newPage();
      await page.goto(`${BASE}/#brochure`, { waitUntil: 'load' });
      await page.locator('#brochure object').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);
      const reading = await page.evaluate(() => {
        const object = document.querySelector('#brochure object[type="application/pdf"]');
        const fallback = object.firstElementChild;
        return {
          userAgent: navigator.userAgent.replace(/.*(Headless)?Chrome\/(\S+).*/, (m, h, v) => `${h ? 'HeadlessChrome' : 'Chrome'}/${v}`),
          pdfViewerEnabled: navigator.pdfViewerEnabled,
          objectClientHeight: object.clientHeight,
          fallbackOffsetHeight: fallback.offsetHeight,
        };
      });
      rows.push({ browser: probe.label, ...reading });
      if (reading.fallbackOffsetHeight > 0 && reading.objectClientHeight - reading.fallbackOffsetHeight > 2) {
        failures.push(`brochure fallback (${probe.label}): object ${reading.objectClientHeight}px, fallback ${reading.fallbackOffsetHeight}px leaves a ${reading.objectClientHeight - reading.fallbackOffsetHeight}px strip`);
      }
    } catch (error) {
      observations.push(`pdfProbe: ${probe.label} could not be measured: ${String(error).split('\n')[0]}`);
    } finally {
      await context.close();
      if (probe.owned) await probe.browser.close();
    }
  }
  readings.pdfProbe = rows;
}

/* ------------------------------------------------------------------ main */

let preview = null;
const browser = await chromium.launch();
try {
  preview = await ensurePreview();
  await heightsAndShots(browser);
  await overflowChecks(browser);
  await formOrder(browser);
  await tabOrder(browser);
  await errorSummaryOrder(browser);
  await stickyColumn(browser);
  await anchoredHeadings(browser);
  await journeyAndTitles(browser);
  await onboardingDeadSpace(browser);
  await contrastAndTargets(browser);
  await pdfProbe(browser);
} catch (error) {
  failures.push(`script error: ${error instanceof Error ? error.stack : String(error)}`);
} finally {
  await browser.close();
  if (preview) preview.kill('SIGTERM');
}

writeFileSync(OUT, `${JSON.stringify({
  task: 'quick-260913-x19',
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  qualifySplitBreakpoint: QUALIFY_SPLIT,
  failures,
  observations,
  readings,
}, null, 2)}\n`);

console.log(`visual check: ${failures.length} failure(s), ${observations.length} observation(s) -> ${OUT}`);
for (const failure of failures) console.log(`  FAIL ${failure}`);
for (const observation of observations) console.log(`  NOTE ${observation}`);
process.exit(failures.length > 0 ? 1 : 0);
