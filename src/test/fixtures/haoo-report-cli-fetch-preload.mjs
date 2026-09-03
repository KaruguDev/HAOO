import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * A fixture-only `fetch` for the credentialed CLI, pinned independently of the reporting
 * modules.
 *
 * Everything the CLI submits is re-derived here from first principles — the endpoint, the
 * query kind, the SQL text, and the order of the eight queries — so a change in
 * `src/reporting/generate.ts` fails this fixture instead of being echoed back to itself.
 * The echoed query must equal the submitted text byte-for-byte, which is the whole of the
 * provenance contract under this provider.
 */

const EXPECTED_ORIGIN = 'https://us.posthog.com';
const EXPECTED_QUERY_KIND = 'HogQLQuery';
const EXPECTED_TIMEZONE = 'Africa/Nairobi';
const EXPECTED_ROW_LIMIT = 100;
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
    timeZone: EXPECTED_TIMEZONE,
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

/** The eight queries one run submits, in order. */
function expectedQueries(today) {
  const queries = [];
  for (const days of [7, 30, 90]) {
    const currentStart = shiftDay(today, -(days - 1));
    const previousEnd = shiftDay(currentStart, -1);
    queries.push(
      { start: currentStart, end: today },
      { start: shiftDay(previousEnd, -(days - 1)), end: previousEnd },
    );
  }
  queries.push('all', 'first-day');
  return queries;
}

function eventLiterals() {
  return EXPECTED_EVENTS.map((event) => `'${event}'`).join(', ');
}

function expectedSql(query) {
  if (query === 'first-day') {
    return `SELECT toString(toDate(toTimeZone(min(timestamp), '${EXPECTED_TIMEZONE}'))) AS first_day\n`
      + 'FROM events\n'
      + `WHERE event IN (${eventLiterals()})\n`
      + 'LIMIT 1';
  }

  const bounds = query === 'all'
    ? ''
    : `\n  AND toDate(toTimeZone(timestamp, '${EXPECTED_TIMEZONE}')) >= toDate('${query.start}')`
      + `\n  AND toDate(toTimeZone(timestamp, '${EXPECTED_TIMEZONE}')) <= toDate('${query.end}')`;

  return 'SELECT event, count() AS occurrences\n'
    + 'FROM events\n'
    + `WHERE event IN (${eventLiterals()})${bounds}\n`
    + 'GROUP BY event\n'
    + 'ORDER BY event\n'
    + `LIMIT ${EXPECTED_ROW_LIMIT}`;
}

export function installCliFetchFixture() {
  const auditPath = process.env.HAOO_REPORT_CLI_AUDIT_PATH;
  if (!auditPath) throw new Error('HAOO_REPORT_CLI_AUDIT_PATH is required by the test preload');

  const projectId = process.env.POSTHOG_PROJECT_ID ?? '';
  const expectedEndpoint = `${EXPECTED_ORIGIN}/api/projects/${projectId}/query/`;
  // Resolve the reporting day exactly once. Re-reading the clock per response let a run
  // that straddles 00:00 Africa/Nairobi expect a range the CLI no longer submits, which
  // surfaced as an intermittent midnight failure rather than as a real defect.
  const today = nairobiDay();
  const queries = expectedQueries(today);
  const urls = [];

  globalThis.fetch = async (url, init) => {
    const requestUrl = String(url);
    if (requestUrl !== expectedEndpoint) {
      throw new Error(`fixture rejected unexpected endpoint: ${requestUrl}`);
    }

    const index = urls.length;
    const expectedQuery = queries[index];
    if (expectedQuery === undefined) throw new Error('fixture rejected a ninth request');

    const sql = expectedSql(expectedQuery);
    const body = JSON.parse(String(init?.body ?? ''));
    if (body?.query?.kind !== EXPECTED_QUERY_KIND) {
      throw new Error('fixture rejected a request that was not a HogQL query');
    }
    if (body?.query?.query !== sql) {
      throw new Error('fixture rejected an unexpected HogQL query');
    }
    if (typeof body?.name !== 'string' || body.name.length === 0) {
      throw new Error('fixture rejected an unnamed query');
    }

    urls.push(requestUrl);

    return {
      ok: true,
      async json() {
        return {
          query: { kind: EXPECTED_QUERY_KIND, query: sql },
          columns: expectedQuery === 'first-day' ? ['first_day'] : ['event', 'occurrences'],
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
