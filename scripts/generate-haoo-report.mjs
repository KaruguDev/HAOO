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
import { generateHaooReport } from '../src/reporting/generate.ts';

/**
 * The only credentialed module in the HAOO reporting path.
 *
 * It is the single place that reads `process.env`, the single place that names the
 * provider origin and its Stats API query path, and it never writes either into the
 * generated document or into stdout. Failure text goes to the terminal only.
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

const ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_PATH = resolve(ROOT, '.reports/haoo-funnel-report.html');
const STATS_ENDPOINT = 'https://plausible.io/api/v2/query';

function writeTerminalError(...lines) {
  writeSync(process.stderr.fd, `${lines.join('\n')}\n`);
}

const apiKey = process.env.PLAUSIBLE_STATS_API_KEY ?? '';
const siteId = process.env.PLAUSIBLE_SITE_ID ?? '';
const missingVariables = [
  ['PLAUSIBLE_STATS_API_KEY', apiKey],
  ['PLAUSIBLE_SITE_ID', siteId],
]
  .filter(([, value]) => value.trim() === '')
  .map(([name]) => name);

if (missingVariables.length > 0) {
  writeTerminalError(
    `Missing required environment variables: ${missingVariables.join(', ')}`,
    ERROR_STATE_SENTENCE,
  );
  process.exitCode = 1;
} else {
  const result = await generateHaooReport({
    query: { endpoint: STATS_ENDPOINT, apiKey, siteId },
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
    writeTerminalError(ERROR_STATE_SENTENCE);
    process.exitCode = 1;
  } else {
    process.stdout.write(`HAOO funnel report written to ${result.outputPath}\n`);
  }
}
