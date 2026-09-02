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
     */
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**', '.gsd/**'],
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
  },
});
