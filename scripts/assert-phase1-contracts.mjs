import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/**
 * assert-phase1-contracts.mjs — the Phase 1 contract gate. It asserts that the named Phase 1
 * contract suites are GREEN, and that the green is real rather than an empty or broken run.
 *
 * Usage:
 *   node scripts/assert-phase1-contracts.mjs
 *
 * INVERTED AND RENAMED by plan `05-15` (Phase 5 decision D-16).
 *
 * Withdrawn: `scripts/assert-phase1-red.mjs` and its npm script `test:phase1:red`. That gate
 * asserted that the Phase 1 contract suites FAIL. They have passed since Phase 1 turned green, so
 * it exited 1 on every run, in this repository and in ZERO-PAPER HUB alike
 * (`04.2-DEFERRED-ITEMS.md` D6 and D12; re-measured by `05-15` immediately before this change:
 * exit 1 on both sides). A command that fails by design teaches its reader to ignore a failure,
 * which is the opposite of what a gate is for.
 *
 * Successor: this file, run as `npm run test:phase1:contracts`. The owner chose the shape —
 * `invert-rename`, over inverting in place under the old name or retiring the gate — and the
 * orchestrator proposed the name inside that option. The ZERO-PAPER HUB copy changed in the same
 * plan, and this path's entry in `shared-scaffold.txt` was renamed byte-identically in both
 * repositories: the same ratified entry at its new path, not an admission.
 *
 * Inverted, and ONLY this: the exit status the Vitest run must have. It had to be non-zero; it
 * must now be zero.
 *
 * Byte-unchanged: `suites` and `expectedMarkers` below (three each — page, content, build), and
 * `forbiddenInfrastructureFailures` (eight signatures). That list is still what separates "a
 * contract broke" from "the harness broke", a distinction the ordinary unit command does not make,
 * and it is now checked BEFORE the exit status so a broken harness is named as one. The markers
 * keep their `phase1-red:` spelling because the spelling lives in the test names, and renaming a
 * test would be a change to the suites this gate polices rather than to the gate.
 *
 * Tightened, so that the marker check keeps the strength it had: a marker now counts only on a
 * line Vitest's verbose reporter marks green (`✓`). Under RED, a marker anywhere in the output
 * meant its case had run and failed. Under GREEN, presence alone would also accept a SKIPPED case —
 * measured by `05-15`: a run that skips every case prints each marker on a `↓` line and exits 0.
 *
 * History, carried forward: NARROWED from four suites and four markers to three by plan `04.2-02`.
 * `src/test/products-section.test.tsx` and its `[phase1-red:products]` marker asserted the parent
 * site's product grid, which is not in this repository after the split; plan `04.2-06` gave
 * ZERO-PAPER HUB its own single-suite, single-marker version of this gate carrying exactly that
 * pair. The pairs were removed per entry, never loosened, so the three are gated as strictly as the
 * four were.
 *
 * CLI shape copied from `scripts/verify-tree-disjointness.mjs`: an import guard so the module stays
 * importable without running, an EXIT-CODE ASSIGNMENT rather than a process-exit call, and a
 * success line that prints COUNTS rather than the word "passed".
 */
const suites = [
  'src/test/haoo-page.test.tsx',
  'src/test/haoo-content.test.ts',
  'src/test/build-output.test.ts',
];

const expectedMarkers = [
  '[phase1-red:page]',
  '[phase1-red:content]',
  '[phase1-red:build]',
];

const forbiddenInfrastructureFailures = [
  'Failed to resolve import',
  'Cannot find module',
  'React is not defined',
  'SyntaxError',
  'Unhandled Error',
  'No test files found',
  'failed to load config',
  'Transform failed',
];

/** What Vitest's verbose reporter prints, with colour disabled, at the start of a green case. */
const GREEN_CASE_GLYPH = '✓';

/**
 * Decides one finished run. Pure, so the decision can be probed against a recorded run without
 * spawning Vitest. Returns the failure sentence, or null when every guarantee holds.
 */
export function phase1ContractFailure({ status, signal = null, error, output }) {
  if (error) {
    return `Phase 1 contract gate could not start Vitest: ${error.message}`;
  }

  const infrastructureFailure = forbiddenInfrastructureFailures.find((signature) =>
    output.includes(signature),
  );

  if (infrastructureFailure) {
    return `Phase 1 contract gate rejected an infrastructure failure: ${infrastructureFailure}`;
  }

  if (status !== 0) {
    return `Phase 1 contract gate failed: the contract suites exited ${status ?? `on signal ${signal}`}.`;
  }

  const greenCaseLines = output
    .split('\n')
    .filter((line) => line.trimStart().startsWith(GREEN_CASE_GLYPH));
  const missingMarker = expectedMarkers.find(
    (marker) => !greenCaseLines.some((line) => line.includes(marker)),
  );

  if (missingMarker) {
    return `Phase 1 contract gate did not observe the named behavior contract ${missingMarker} run green.`;
  }

  return null;
}

function main() {
  const result = spawnSync(
    'npm',
    ['test', '--', '--run', ...suites, '--reporter=verbose'],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        NO_COLOR: '1',
      },
    },
  );

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  process.stdout.write(output);

  const failure = phase1ContractFailure({
    status: result.status,
    signal: result.signal,
    error: result.error,
    output,
  });

  if (failure) {
    console.error(failure);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Phase 1 contracts confirmed green: ${suites.length} suite${suites.length === 1 ? '' : 's'}, ` +
      `${expectedMarkers.length} of ${expectedMarkers.length} markers on green cases, ` +
      `0 of ${forbiddenInfrastructureFailures.length} infrastructure-failure signatures present.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
