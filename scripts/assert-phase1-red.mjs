import { spawnSync } from 'node:child_process';

const suites = [
  'src/test/products-section.test.tsx',
  'src/test/haoo-page.test.tsx',
  'src/test/haoo-content.test.ts',
  'src/test/build-output.test.ts',
];

const expectedMarkers = [
  '[phase1-red:products]',
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

if (result.error) {
  console.error(`Expected-red gate could not start Vitest: ${result.error.message}`);
  process.exit(1);
}

if (result.status === 0) {
  console.error('Expected-red gate failed: the Phase 1 contract suites unexpectedly passed.');
  process.exit(1);
}

const infrastructureFailure = forbiddenInfrastructureFailures.find((signature) =>
  output.includes(signature),
);

if (infrastructureFailure) {
  console.error(
    `Expected-red gate rejected an infrastructure failure: ${infrastructureFailure}`,
  );
  process.exit(1);
}

const missingMarker = expectedMarkers.find((marker) => !output.includes(marker));

if (missingMarker) {
  console.error(`Expected-red gate did not observe the named behavior failure ${missingMarker}.`);
  process.exit(1);
}

console.log('Phase 1 RED confirmed: all four suites fail on named behavior contracts.');
