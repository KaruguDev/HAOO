import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const EXPECTED_ENDPOINT = 'https://plausible.io/api/v2/query';
const EXPECTED_EVENTS = [
  'haoo_page_view',
  'haoo_brochure_preview',
  'haoo_brochure_open',
  'haoo_brochure_download',
  'haoo_qualify_start',
  'haoo_qualify_submit',
  'haoo_assisted_whatsapp',
  'haoo_assisted_phone',
  'haoo_assisted_email',
  'haoo_self_onboarding',
];

function nairobiDay() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function shiftDay(day, offset) {
  const instant = new Date(`${day}T00:00:00.000Z`);
  instant.setUTCDate(instant.getUTCDate() + offset);
  return instant.toISOString().slice(0, 10);
}

function expectedRanges(today) {
  const ranges = [];
  for (const days of [7, 30, 90]) {
    const currentStart = shiftDay(today, -(days - 1));
    const previousEnd = shiftDay(currentStart, -1);
    ranges.push(
      [currentStart, today],
      [shiftDay(previousEnd, -(days - 1)), previousEnd],
    );
  }
  ranges.push('all');
  return ranges;
}

export function installCliFetchFixture() {
  const auditPath = process.env.HAOO_REPORT_CLI_AUDIT_PATH;
  if (!auditPath) throw new Error('HAOO_REPORT_CLI_AUDIT_PATH is required by the test preload');

  const siteId = process.env.PLAUSIBLE_SITE_ID ?? '';
  // Resolve the reporting day exactly once. Re-reading the clock per response let a run
  // that straddles 00:00 Africa/Nairobi echo a range the CLI no longer expects, which
  // surfaced as an intermittent midnight failure rather than as a real defect.
  const today = nairobiDay();
  const ranges = expectedRanges(today);
  const urls = [];

  globalThis.fetch = async (url, init) => {
    const requestUrl = String(url);
    if (requestUrl !== EXPECTED_ENDPOINT) {
      throw new Error(`fixture rejected unexpected endpoint: ${requestUrl}`);
    }

    const index = urls.length;
    const expectedRange = ranges[index];
    if (expectedRange === undefined) throw new Error('fixture rejected an eighth request');

    const body = JSON.parse(String(init?.body ?? ''));
    const expectedBody = {
      site_id: siteId,
      metrics: ['events'],
      date_range: expectedRange,
      dimensions: ['event:goal'],
      filters: [['is', 'event:goal', EXPECTED_EVENTS]],
    };
    if (JSON.stringify(body) !== JSON.stringify(expectedBody)) {
      throw new Error('fixture rejected an unexpected Stats query');
    }

    urls.push(requestUrl);
    const dateRange = expectedRange === 'all'
      ? [`${today}T00:00:00+03:00`, `${today}T23:59:59+03:00`]
      : [
          `${expectedRange[0]}T00:00:00+03:00`,
          `${expectedRange[1]}T23:59:59+03:00`,
        ];

    return {
      ok: true,
      async json() {
        return {
          query: { ...expectedBody, date_range: dateRange },
          results: [],
        };
      },
    };
  };

  process.once('exit', () => {
    mkdirSync(dirname(auditPath), { recursive: true });
    writeFileSync(auditPath, JSON.stringify({ count: urls.length, urls }), 'utf8');
  });
}

installCliFetchFixture();
