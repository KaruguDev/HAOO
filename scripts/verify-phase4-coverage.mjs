import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const REQUIRED_TABLES = {
  'Plausible — browser event-collection API (site-specific script)': new Map([
    ["custom event by name (`plausible('<name>')`)", 'INTEGRATE'],
    ['pre-load event queue (`window.plausible.q` stub)', 'INTEGRATE'],
    ['pre-load options slot (`window.plausible.o`)', 'INTEGRATE'],
    ['pre-load initializer (`plausible.init(options)`)', 'INTEGRATE'],
    ['ten exact custom-event goals configured on the site', 'INTEGRATE'],
    ['automatic pageview capture', 'OPT-OUT'],
    ['custom event properties / property bag', 'OPT-OUT'],
    ['outbound-link automatic capture', 'OPT-OUT'],
    ['file-download automatic capture', 'OPT-OUT'],
    ['form-submission automatic capture', 'OPT-OUT'],
  ]),
  'Plausible — Stats API v2': new Map([
    ['`POST /api/v2/query`', 'INTEGRATE'],
    ['metric `events`', 'INTEGRATE'],
    ['dimension `event:goal`', 'INTEGRATE'],
    ['filter `["is","event:goal",[…ten goals]]`', 'INTEGRATE'],
    ['`date_range` explicit inclusive ISO pair', 'INTEGRATE'],
    ['`date_range: "all"`', 'INTEGRATE'],
    ['bearer authentication from the local process environment', 'INTEGRATE'],
    ['echoed `query.site_id` provenance', 'INTEGRATE'],
    ['echoed `query.metrics`, `query.dimensions`, and goal-filter provenance', 'INTEGRATE'],
    ['echoed bounded-range provenance', 'INTEGRATE'],
    ['echoed all-time range provenance', 'INTEGRATE'],
    ['response `results` rows', 'INTEGRATE'],
    ['person/session/engagement metrics', 'OPT-OUT'],
    ['metrics `conversion_rate`, `group_conversion_rate`, `percentage`', 'OPT-OUT'],
    ['`include.comparisons`', 'OPT-OUT'],
    ['Shared links', 'OPT-OUT'],
    ['Embed dashboard (iframe)', 'OPT-OUT'],
    ['Funnels / user journeys', 'OPT-OUT'],
  ]),
  'FormSubmit — AJAX email delivery (re-decided from a full baseline)': new Map([
    ['cross-origin AJAX JSON POST', 'INTEGRATE'],
    ['named human-readable data fields', 'INTEGRATE'],
    ['`_subject`', 'INTEGRATE'],
    ['`_template` (table)', 'INTEGRATE'],
    ['`_captcha`', 'INTEGRATE'],
    ['`_honey` honeypot field', 'INTEGRATE'],
    ['`HAOO engagement context` field (new in this phase)', 'INTEGRATE'],
    ['`_cc`', 'OPT-OUT'],
    ['`_next`', 'OPT-OUT'],
    ['`_autoresponse`', 'OPT-OUT'],
    ['`_replyto`', 'OPT-OUT'],
    ['file uploads', 'OPT-OUT'],
    ['webhook forwarding', 'OPT-OUT'],
  ]),
};

function parseTables(markdown) {
  const tables = new Map();
  let heading = null;

  for (const line of markdown.split(/\r?\n/u)) {
    const headingMatch = line.match(/^## (.+)$/u);
    if (headingMatch) {
      heading = headingMatch[1].trim();
      continue;
    }

    if (!heading || !line.startsWith('|') || /^\|\s*-+/u.test(line)) {
      continue;
    }

    const cells = line
      .slice(1, -1)
      .split('|')
      .map((cell) => cell.trim());
    if (cells.length !== 3 || cells[0].toLowerCase() === 'capability') {
      continue;
    }

    const rows = tables.get(heading) ?? new Map();
    if (rows.has(cells[0])) {
      throw new Error(`${heading}: duplicate capability row "${cells[0]}"`);
    }
    rows.set(cells[0], { decision: cells[1], reason: cells[2] });
    tables.set(heading, rows);
  }

  return tables;
}

export function auditPhase4Coverage(markdown) {
  const errors = [];
  const tables = parseTables(markdown);

  for (const [heading, requiredRows] of Object.entries(REQUIRED_TABLES)) {
    const rows = tables.get(heading);
    if (!rows) {
      errors.push(`${heading}: required table is missing`);
      continue;
    }

    for (const [capability, expectedDecision] of requiredRows) {
      const row = rows.get(capability);
      if (!row) {
        errors.push(`${heading}: missing capability row "${capability}"`);
      } else if (row.decision !== expectedDecision) {
        errors.push(
          `${heading} / ${capability}: expected ${expectedDecision}, found ${row.decision || '(blank)'}`,
        );
      }
    }

    for (const [capability, row] of rows) {
      if (row.decision === 'OPT-OUT' && row.reason.trim() === '') {
        errors.push(`${heading} / ${capability}: OPT-OUT reason is blank`);
      }
    }
  }

  const operationalBoundary = markdown.match(
    /## Operational boundary\s+([\s\S]*?)(?=\n## |$)/u,
  )?.[1] ?? '';
  const boundaryChecks = [
    ['production analytics remains OPT-OUT', /Production analytics enablement remains OPT-OUT/iu],
    ['production enablement remains deferred', /deferred/iu],
    ['provider selector remains unset', /provider selector\s+remains unset/iu],
    ['PLAUSIBLE_STATS_API_KEY stays local', /`PLAUSIBLE_STATS_API_KEY`/u],
    ['PLAUSIBLE_SITE_ID stays local', /`PLAUSIBLE_SITE_ID`/u],
    ['local report variables stay outside Vite/browser configuration', /neither may enter a `VITE_\*` variable or the published bundle/iu],
  ];
  for (const [description, pattern] of boundaryChecks) {
    if (!pattern.test(operationalBoundary)) {
      errors.push(`Operational boundary: must state that ${description}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Phase 4 coverage audit failed:\n- ${errors.join('\n- ')}`);
  }

  return {
    tables: Object.keys(REQUIRED_TABLES).length,
    requiredRows: Object.values(REQUIRED_TABLES).reduce((total, rows) => total + rows.size, 0),
  };
}

async function main() {
  const coveragePath = process.argv[2];
  if (!coveragePath) {
    throw new Error('Usage: node scripts/verify-phase4-coverage.mjs <COVERAGE.md>');
  }

  const result = auditPhase4Coverage(await readFile(coveragePath, 'utf8'));
  console.log(
    `Phase 4 coverage audit passed: ${result.requiredRows} required capabilities across ${result.tables} tables.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
