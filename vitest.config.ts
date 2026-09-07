import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    /**
     * Vitest's default `exclude` does not list dot-directories, so agent-tool worktrees
     * under `.claude/` were discovered and run: a full run executed ten frozen duplicate
     * suites from an older revision alongside the current ones, inflating every quoted
     * test count and making an unrelated frozen copy able to fail `npm test`.
     *
     * `e2e/**` and `.playwright-report/**` close a SECOND collision, also measured rather
     * than reasoned about. Vitest's default `include` is `**\/*.{test,spec}.?(c|m)[jt]s?(x)`,
     * which claims the same `*.spec.ts` suffix the Playwright community conventionally uses:
     * a single `e2e/probe.spec.ts` took this suite from 683 collected tests to 684, where it
     * would import a browser runner inside the hermetic unit run. The primary defence is
     * naming — every Playwright file is `*.e2e.ts`, which the glob above does not match — so
     * excluding the whole directory is belt-and-braces. It is kept anyway because the naming
     * rule lives in a human's memory and this line does not: D-07 requires that a network
     * outage cannot redden `src/test/build-output.test.ts`, and one carelessly named file
     * would otherwise make a hermetic bundle assertion depend on a deploy.
     */
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '.claude/**',
      '.gsd/**',
      'e2e/**',
      '.playwright-report/**',
    ],
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
  },
});
