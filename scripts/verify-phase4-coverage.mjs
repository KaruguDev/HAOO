import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const REQUIRED_TABLES = {
  'PostHog — browser SDK (posthog-js, pinned and loaded; delivery gated on the selector)': new Map([
    ['`posthog.init(token, config)` with an explicit lockdown object', 'INTEGRATE'],
    ['merged-config readback via `instance.config`', 'INTEGRATE'],
    ['`capture(name)` with a bare name and no property argument', 'INTEGRATE'],
    ['`before_send` payload reduction', 'INTEGRATE'],
    ["`person_profiles: 'never'`", 'INTEGRATE'],
    ["`persistence: 'memory'` with `disable_persistence: true`", 'INTEGRATE'],
    ['`advanced_disable_flags` to suppress the remote-configuration fetch', 'INTEGRATE'],
    ['`disable_external_dependency_loading`', 'INTEGRATE'],
    // Successor to `` `defaults: 'unset'` pinning of the date-gated default set ``, renamed
    // by code-review WR-03 in the same commit as the COVERAGE.md row it pins. The
    // predecessor required the continued presence of a capability claim the source code
    // itself calls false: `posthog-lockdown.ts` records that `'unset'` sorts
    // lexicographically ABOVE every date literal and therefore selects the NEWEST branch of
    // every date gate but `session_recording`, and `measurement.test.ts` asserts exactly
    // that. Because `npm run verify:coverage` is a deploy gate, the predecessor enforced
    // that contradiction on every push — a gate that outlived its claim, the inverse of the
    // failure this repository's convention usually names.
    //
    // Renamed rather than dropped. The `defaults` value is still sent, still read back by
    // `lockdownHolds`, and still a decision a reader must be able to find; deleting the row
    // would retire the audit of a capability that is very much still integrated.
    ['`defaults` sentinel and the date-gated default set', 'INTEGRATE'],
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
    ['bearer auth from the local process environment, scope *Query Read*', 'INTEGRATE'],
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
    [
      // Successor to `production analytics remains OPT-OUT`, moved by plan `04.1-11` in the
      // same commit as the prose it pins. The predecessor read
      // /Production analytics enablement remains OPT-OUT/ and became false the moment the
      // deploy workflow started selecting the provider. It is replaced rather than deleted:
      // an enablement state that stopped being asserted at all would let the document fall
      // silent on the single fact a reader most needs from this section.
      'production analytics enablement is opt-in and enabled',
      /Production\s+analytics\s+enablement\s+is\s+OPT-IN\s+AND\s+ENABLED\s+for\s+this\s+phase/u,
    ],
    [
      // Successor to `processor approval, project creation, and deployment variables remain
      // deferred` (04.1-11). The predecessor pinned the deferral across its whole sentence,
      // for the reason recorded here at the time: a bare /deferred/ passed on any occurrence
      // of the word, including one saying the opposite. The successor keeps that shape and
      // asserts the three facts as one claim, so a document that recorded the approval but
      // dropped the project or the build variables goes red rather than passing on a
      // fragment.
      'the processor approval is recorded, the project exists, and the workflow supplies the three public build variables',
      /processor\s+approval\s+is\s+recorded,\s+the\s+project\s+exists,\s+and\s+the\s+deployment\s+workflow\s+supplies\s+the\s+three\s+public\s+build\s+variables/iu,
    ],
    [
      // Successor to `the integration capabilities are verified while the provider selector
      // remains unset` (04.1-11). Tightened past the bare phrase for the same reason as
      // every other entry in this array: a fragment that merely APPEARS in the section
      // passes on a sentence saying the opposite. Pinned to the new claim — that the
      // capabilities are REACHED AT RUNTIME rather than only fixture-verified — so a
      // document that quietly reverted to the fixture-only claim fails here.
      'the integration capabilities are reached at runtime rather than only fixture-verified',
      /capabilities\s+above\s+are\s+reached\s+at\s+runtime\s+by\s+the\s+loaded\s+browser\s+SDK\s+rather\s+than\s+only\s+fixture-verified/iu,
    ],
    [
      // ADDED by 04.1-11, not a replacement. The three entries above now assert an ENABLED
      // state, and an enabled state is exactly where this document could start overclaiming:
      // nothing in this tree can observe whether the GitHub Actions repository variables were
      // ever created, so a green workflow run is not evidence of a capturing deploy. Without
      // a pin, that caveat is a sentence anyone can delete on a tidy-up and no gate notices
      // (T-04.1-13). Pinned across the claim rather than on `not evidence`, which a sentence
      // saying the opposite would also satisfy.
      'a green workflow run is not evidence of a capturing deploy',
      /green\s+workflow\s+run\s+is\s+not\s+evidence\s+of\s+a\s+capturing\s+deploy/iu,
    ],
    [
      // ADDED by 04.1-11 for the same reason as the entry above, guarding the other half of
      // the overclaim. Deployment makes the live checkpoints PERFORMABLE; it does not perform
      // them. Ingestion acceptance of the reduced three-property payload is the one that
      // fails silently — a rejected payload reads as a dead funnel rather than a broken one
      // (D-05) — so the sentence that keeps it an owner observation is pinned rather than
      // trusted (T-04.1-20).
      'ingestion acceptance and the absent person profile remain owner observations',
      /remain\s+owner\s+observations\s+at\s+the\s+seven\s+checkpoints\s+04\.1-11\s+unblocked,\s+not\s+facts\s+this\s+tree\s+has\s+established/iu,
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
      // Successor to the unloaded-SDK assertion, moved by plan 04.1-09 in the same commit
      // as the prose it pins — the predecessor read
      // `/browser SDK is pinned but not loaded[...]no event is delivered/` and became
      // false the moment `src/measurement/posthog.ts` bound the SDK by value.
      //
      // The claim this row exists to keep honest changed with it. It used to be that an
      // INTEGRATE row described an implemented but unreached capability; now it is that
      // the SDK is genuinely loaded AND that delivery still turns on the selector. A
      // reader who took `loaded` as `delivering` would misread a report of zeros as a
      // dead funnel, which is the same misreading the predecessor guarded from the other
      // side. Pinned across the whole claim rather than to a fragment, following the
      // convention of every entry in this array: a bare /loaded/ would pass on a sentence
      // saying the opposite, and so would a bare /selector/.
      'the browser SDK is loaded by src/measurement/posthog.ts and delivery depends on the provider selector',
      /browser\s+SDK\s+is\s+loaded\s+by\s+`src\/measurement\/posthog\.ts`[\s\S]{0,400}?[Dd]elivery\s+depends\s+on\s+the\s+provider\s+selector/u,
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
