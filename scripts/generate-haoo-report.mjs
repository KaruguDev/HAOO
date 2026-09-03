import {
  closeSync,
  mkdirSync,
  openSync,
  renameSync,
  rmSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { resolve } from 'node:path';
import {
  generateHaooReport,
  TEMP_PATH_IN_USE_REASON_PREFIX,
} from '../src/reporting/generate.ts';

/**
 * The only credentialed module in the HAOO reporting path.
 *
 * It is the single place that reads `process.env`, the single place that names the
 * provider origin and its query path, and it never writes either into the generated
 * document or into stdout. Failure text goes to the terminal only.
 *
 * It is also the only module in the repository that still spells the removed environment
 * variable names, and deliberately so: a stale environment is the one realistic failure
 * this migration creates, and naming the rename requires naming what was renamed. See
 * `REMOVED_VARIABLES` below.
 *
 * The report modules are TypeScript and are loaded here through Node's native type
 * stripping, which is on by default from Node 22.18.0 and 23.6.0 — hence the
 * `engines.node` floor in `package.json`.
 */

/** UI-SPEC error state. Terminal output; never written into the HTML. */
const ERROR_STATE_SENTENCE =
  'Report not updated. A query or validation check failed, so the previous report file '
  + 'was left unchanged. Check the API key and network connection, then run the command '
  + 'again.';

/**
 * A previous run was killed between reserving its temporary sibling and renaming it onto
 * the destination. Nothing is wrong with the credentials or the network, and no later run
 * can succeed until that one file is removed -- so it is named verbatim.
 */
function temporaryPathSentence(temporaryPath) {
  return 'Report not updated. A leftover temporary file from an interrupted run is '
    + `holding the write path, so the previous report file was left unchanged. Delete `
    + `${temporaryPath}, then run the command again.`;
}

const ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_PATH = resolve(ROOT, '.reports/haoo-funnel-report.html');

/**
 * The provider origin and the query path, held in named halves because the endpoint is
 * per-project and cannot be one literal. The boundary suite reads both names to prove
 * neither reaches `src/reporting/`.
 */
const QUERY_API_ORIGIN = 'https://us.posthog.com';
const QUERY_API_PATH_PREFIX = '/api/projects/';
const QUERY_API_PATH_SUFFIX = '/query/';

/** The one terminal sentence a failure reason earns. */
function reasonSentence(reason) {
  if (reason.startsWith(TEMP_PATH_IN_USE_REASON_PREFIX)) {
    return temporaryPathSentence(reason.slice(TEMP_PATH_IN_USE_REASON_PREFIX.length));
  }

  // The timezone-mismatch sentence was removed rather than reworded: the reporting
  // timezone is now pinned inside the submitted query text, so there is no remote setting
  // left for the provider to disagree with and the failure it named cannot occur.
  return ERROR_STATE_SENTENCE;
}

function writeTerminalError(...lines) {
  writeSync(process.stderr.fd, `${lines.join('\n')}\n`);
}

const apiKey = process.env.POSTHOG_QUERY_API_KEY ?? '';
const projectId = process.env.POSTHOG_PROJECT_ID ?? '';

/**
 * Every environment variable this migration removed, paired with the variable that
 * replaces it. Checked for PRESENCE rather than absence.
 *
 * Without this branch a stale environment — one that still carries a working credential
 * under its previous name — reports the new names as merely missing, which points the
 * owner at creating a credential they may already hold. The message names which removed
 * variable was found and which new variable replaces it, so the fix is a rename rather
 * than a fresh credential.
 *
 * The two browser variables are listed alongside the two report variables even though
 * this command never reads them: an environment carrying either is a shell or CI
 * configuration that was not migrated, and saying so once here is cheaper for the owner
 * than discovering it at deploy time.
 */
const REMOVED_VARIABLES = [
  ['PLAUSIBLE_STATS_API_KEY', 'POSTHOG_QUERY_API_KEY'],
  ['PLAUSIBLE_SITE_ID', 'POSTHOG_PROJECT_ID'],
  ['VITE_HAOO_PLAUSIBLE_SRC', 'VITE_HAOO_POSTHOG_TOKEN'],
  ['VITE_HAOO_PLAUSIBLE_DOMAIN', 'VITE_HAOO_POSTHOG_API_HOST'],
];

const staleVariables = REMOVED_VARIABLES
  .filter(([removed]) => (process.env[removed] ?? '').trim() !== '')
  .map(([removed, replacement]) => `${removed} is now ${replacement}`);

const missingVariables = [
  ['POSTHOG_QUERY_API_KEY', apiKey],
  ['POSTHOG_PROJECT_ID', projectId],
]
  .filter(([, value]) => value.trim() === '')
  .map(([name]) => name);

if (staleVariables.length > 0) {
  // Reported before the missing-variable message and instead of it: naming the rename is
  // the actionable answer, and "this variable is missing" would send the owner to create
  // a credential the stale name may already hold.
  writeTerminalError(
    `Removed environment variables found: ${staleVariables.join(', ')}`,
    'Report not updated. Rename the variables above in the environment you run this '
      + 'command from, then run the command again.',
  );
  process.exitCode = 1;
} else if (missingVariables.length > 0) {
  writeTerminalError(
    `Missing required environment variables: ${missingVariables.join(', ')}`,
    ERROR_STATE_SENTENCE,
  );
  process.exitCode = 1;
} else {
  const result = await generateHaooReport({
    query: {
      endpoint: `${QUERY_API_ORIGIN}${QUERY_API_PATH_PREFIX}${projectId}${QUERY_API_PATH_SUFFIX}`,
      apiKey,
      projectId,
    },
    fetch: globalThis.fetch,
    now: () => new Date(),
    fs: {
      mkdirSync,
      reserveTempSync: (path) => closeSync(openSync(path, 'wx')),
      renameSync,
      rmSync,
      writeFileSync,
    },
    outputPath: OUTPUT_PATH,
  });

  if (!result.ok) {
    writeTerminalError(reasonSentence(result.reason));
    process.exitCode = 1;
  } else {
    process.stdout.write(`HAOO funnel report written to ${result.outputPath}\n`);
  }
}
