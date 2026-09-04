import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const REQUIRED_TABLES = {
  'PostHog — browser SDK (posthog-js, pinned; not yet loaded)': new Map([
    ['`posthog.init(token, config)` with an explicit lockdown object', 'INTEGRATE'],
    ['merged-config readback via `instance.config`', 'INTEGRATE'],
    ['`capture(name)` with a bare name and no property argument', 'INTEGRATE'],
    ['`before_send` payload reduction', 'INTEGRATE'],
    ["`person_profiles: 'never'`", 'INTEGRATE'],
    ["`persistence: 'memory'` with `disable_persistence: true`", 'INTEGRATE'],
    ['`advanced_disable_flags` to suppress the remote-configuration fetch', 'INTEGRATE'],
    ['`disable_external_dependency_loading`', 'INTEGRATE'],
    ["`defaults: 'unset'` pinning of the date-gated default set", 'INTEGRATE'],
    ['PostHog Cloud US ingestion host', 'INTEGRATE'],
    ['DOM autocapture (`autocapture`)', 'OPT-OUT'],
    ['rageclick (`rageclick`)', 'OPT-OUT'],
    ['dead clicks (`capture_dead_clicks`)', 'OPT-OUT'],
    ['automatic `$pageview` (`capture_pageview`)', 'OPT-OUT'],
    ['automatic `$pageleave` (`capture_pageleave`)', 'OPT-OUT'],
    ['session recording / replay (`disable_session_recording`)', 'OPT-OUT'],
    ['surveys (`disable_surveys`)', 'OPT-OUT'],
    ['automatic survey display (`disable_surveys_automatic_display`)', 'OPT-OUT'],
    ['product tours (`disable_product_tours`)', 'OPT-OUT'],
    ['conversations (`disable_conversations`)', 'OPT-OUT'],
    ['web experiments (`disable_web_experiments`)', 'OPT-OUT'],
    ['heatmaps (`capture_heatmaps`)', 'OPT-OUT'],
    ['exception autocapture (`capture_exceptions`)', 'OPT-OUT'],
    ['performance and web vitals (`capture_performance`)', 'OPT-OUT'],
    ['scroll properties (`disable_scroll_properties`)', 'OPT-OUT'],
    ['site apps (`opt_in_site_apps`)', 'OPT-OUT'],
    ['feature flags (`advanced_disable_feature_flags`)', 'OPT-OUT'],
    ['toolbar metrics (`advanced_disable_toolbar_metrics`)', 'OPT-OUT'],
    ['`save_referrer`', 'OPT-OUT'],
    ['`save_campaign_params`', 'OPT-OUT'],
    ['`identify()` / `alias()` / `group()` / `setPersonProperties()`', 'OPT-OUT'],
    ['`property_denylist` as a privacy boundary', 'OPT-OUT'],
    ['`sanitize_properties`', 'OPT-OUT'],
    ['the deprecated `ip` option', 'OPT-OUT'],
    ['`cookieless_mode`', 'OPT-OUT'],
    ['`$geoip_disable` as an event property', 'OPT-OUT'],
  ]),
  'PostHog — Query API': new Map([
    ['`POST /api/projects/:project_id/query/`', 'INTEGRATE'],
    ['`HogQLQuery` body kind', 'INTEGRATE'],
    ['the descriptive `name` parameter', 'INTEGRATE'],
    ['bearer authentication from the local process environment with the single scope PostHog labels *Query Read*', 'INTEGRATE'],
    ['`count()` aggregate grouped by `event`', 'INTEGRATE'],
    ["`toTimeZone(timestamp, 'Africa/Nairobi')` pinned inside the SQL", 'INTEGRATE'],
    ['explicit inclusive date bounds', 'INTEGRATE'],
    ['an explicit `LIMIT` above the allowlist size', 'INTEGRATE'],
    ['echoed `query` / `hogql` provenance', 'INTEGRATE'],
    ['response `results` rows', 'INTEGRATE'],
    ['response `columns` equality assertion', 'INTEGRATE'],
    ['bulk or recurring event export', 'OPT-OUT'],
    ['OFFSET pagination', 'OPT-OUT'],
    ['the Insights API and dashboard actions', 'OPT-OUT'],
    ['person, session, and cohort queries', 'OPT-OUT'],
    ['`query_log`', 'OPT-OUT'],
    ['async / polling query execution', 'OPT-OUT'],
    ['shared links and embedded dashboards', 'OPT-OUT'],
    ['funnels and user journeys', 'OPT-OUT'],
    ['`refresh` cache controls', 'OPT-OUT'],
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

  for (const rawLine of markdown.split(/\r?\n/u)) {
    // Trim before anything else. Slicing a raw line to strip its delimiters made a single
    // trailing space split the row into four cells, which was then skipped silently and
    // re-reported downstream as a *missing* capability rather than a malformed one.
    const line = rawLine.trim();
    const headingMatch = line.match(/^## (.+)$/u);
    if (headingMatch) {
      heading = headingMatch[1].trim();
      continue;
    }

    if (!heading || !line.startsWith('|') || /^\|\s*-+/u.test(line)) {
      continue;
    }

    const cells = line
      .replace(/^\|/u, '')
      .replace(/\|$/u, '')
      .split('|')
      .map((cell) => cell.trim());
    if (cells.length !== 3) {
      // Every required table is `capability | decision | reason`. Inside one of them a
      // wrong cell count is a malformed row, and saying so beats skipping it and letting
      // the capability be re-reported as absent. Outside them, other sections may shape
      // their tables however they like, so a mismatch is simply not our row.
      // `Object.hasOwn`, not `in`. `REQUIRED_TABLES` is a plain object literal, so `in`
      // walks its prototype: a section headed `## constructor`, `## toString`,
      // `## valueOf` or `## hasOwnProperty` satisfied it, and a malformed row inside one
      // aborted the whole audit with an error naming a table that does not exist. The
      // reverse held too — `tables.get(heading)` and `Object.entries(REQUIRED_TABLES)`
      // below both use own-key semantics, so the two halves of this audit disagreed about
      // what a required table is. Same class of issue the `isPlainObject` guard in
      // `src/reporting/untrusted.ts` exists to prevent, applied consistently.
      if (Object.hasOwn(REQUIRED_TABLES, heading)) {
        throw new Error(`${heading}: malformed row with ${cells.length} cells: ${line}`);
      }
      continue;
    }
    if (cells[0].toLowerCase() === 'capability') {
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
    [
      // Pinned to the sentence it means to assert. A bare /deferred/ passed on any
      // occurrence of the word anywhere in the section, including one saying the opposite.
      // Migrated with the phase: PostHog needs its project created, not ten dashboard goals.
      'processor approval, project creation, and deployment variables remain deferred',
      /deferred\s+processor\s+approval,\s+project\s+creation,\s+and\s+deployment\s+variables/iu,
    ],
    [
      // Tightened past the bare phrase for the same reason as the two entries above and
      // the two below: a fragment that merely APPEARS in the section passes on a sentence
      // saying the opposite. Pinned to the claim — that the capabilities are implemented
      // and verified WHILE the selector is unset — rather than to the words alone.
      'the integration capabilities are verified while the provider selector remains unset',
      /capabilities\s+above\s+are\s+implemented\s+and\s+fixture-verified\s+while\s+the\s+provider\s+selector\s+remains\s+unset/iu,
    ],
    [
      // Both report variables were name-presence only: a sentence saying
      // `POSTHOG_QUERY_API_KEY` may be published would have passed the check that exists
      // to forbid exactly that. The two names and the claim about them are one sentence
      // in the document, so they are pinned as one assertion rather than three fragments
      // that can each be satisfied by an unrelated mention.
      'POSTHOG_QUERY_API_KEY and POSTHOG_PROJECT_ID are local report-process inputs',
      /`POSTHOG_QUERY_API_KEY`\s+and\s+`POSTHOG_PROJECT_ID`\s+are\s+local\s+report-process\s+inputs/iu,
    ],
    [
      'neither report variable is a browser capability',
      /neither\s+is\s+a\s+browser\s+capability/iu,
    ],
    [
      // The claim this row exists to keep honest is that the browser-SDK rows above
      // describe an implemented capability, NOT a delivered one. A reader who takes an
      // INTEGRATE row as evidence that events are flowing would misread a report of zeros
      // as a dead funnel. Pinned to the sentence, for the same reason as the rows above:
      // a bare /not loaded/ would pass on a sentence claiming the opposite.
      'the browser SDK is pinned but not loaded, so no event is delivered',
      /browser\s+SDK\s+is\s+pinned\s+but\s+not\s+loaded[\s\S]{0,200}?no\s+event\s+is\s+delivered/iu,
    ],
    ['local report variables stay outside Vite/browser configuration', /neither may enter a `VITE_\*` variable or the published bundle/iu],
    [
      // Tightened past a bare /United States/ for the same reason as the deferral entry
      // above: the region is a one-way D-08 decision, and a sentence merely mentioning the
      // country — including one denying that processing happens there — would have passed.
      'analytics data is processed in the United States',
      /Analytics\s+data\s+is\s+processed\s+in\s+the\s+United\s+States/iu,
    ],
    [
      // Tightened past a bare /Discard client IP data/: what this row exists to record is
      // that the setting is the OWNER's to perform and the code cannot assert it. A pattern
      // matching only the setting's name would pass on a sentence claiming the adapter
      // closes the gap, which is the one claim this project may not make (Pitfall 5).
      'client IP discard is an owner-performed project setting',
      /"Discard client IP data"\s+is\s+an\s+owner-performed\s+project\s+setting/iu,
    ],
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
    throw new Error('Usage: node scripts/verify-phase4-coverage.mjs .planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/COVERAGE.md');
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
