import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  /**
   * `testMatch` is mandatory here, not stylistic, and both halves of the trap it avoids
   * were measured rather than reasoned about.
   *
   * Vitest's default `include` glob is `**\/*.{test,spec}.?(c|m)[jt]s?(x)`, which claims the
   * same `*.spec.ts` suffix the Playwright community conventionally uses. A conventionally
   * named suite under `e2e/` is therefore collected by `npm test` — measured this session as
   * 683 -> 684 collected tests for a single `e2e/probe.spec.ts` — where it imports a runner
   * that does not belong in the hermetic unit run. And Playwright's own default `testMatch`
   * (`**\/*.@(spec|test).?(c|m)[jt]s?(x)`) would then match nothing under `e2e/` once the
   * files are renamed away from that suffix to escape Vitest. Setting this glob is what makes
   * the two runners stop claiming the same files.
   */
  testMatch: '**/*.e2e.ts',

  forbidOnly: !!process.env.CI,

  reporter: [
    ['list'],
    ['html', { outputFolder: '.playwright-report', open: 'never' }],
    ['json', { outputFile: 'evidence/playwright-run.json' }],
  ],

  /**
   * Scratch output goes to dot-directories; measurements go to `evidence/`.
   *
   * `.playwright-report/` and `.playwright-results/` are gitignored run artefacts. `evidence/`
   * is committed, because the measured values are this phase's product.
   */
  outputDir: '.playwright-results',

  projects: [
    {
      name: 'live',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://www.haoo.online' },
      /**
       * The two projects carry deliberately asymmetric retry counts: a live-network flake is
       * not a defect, but a hermetic flake is. Retrying the preview project would convert a
       * real, reproducible instability into an intermittently green run.
       */
      retries: 2,
    },
    {
      name: 'preview',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4173' },
      retries: 0,
    },
  ],

  /**
   * `webServer` is config-level, not project-level, so a `--project=live` run still starts the
   * preview server and pays its startup cost. That cost is accepted deliberately rather than
   * worked around, because the alternative is inventing a third mechanism to decide when the
   * server runs, and a conditional `command` would make the two projects diverge in a way that
   * is invisible from the spec files.
   *
   * `vite preview` serves the already-built `dist/`, so it requires a prior `npm run build`;
   * it does not build on demand.
   */
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
