import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { approvedAnalyticsHostsForProvider } from './config/approved-analytics-hosts';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Public `VITE_`-prefixed build configuration only — never the report credentials.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    base: '/',
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    /**
     * The single route by which the approved analytics *ingestion host* may reach a
     * bundle — the destination events are sent to, not a source a script is fetched
     * from. The SDK is a pinned dependency rather than a script loaded from an approved
     * origin (D-02), so this is the origin that matters for what leaves the browser.
     *
     * Gated on the configured provider by the same normalization the runtime resolver
     * uses, so a build that has not deliberately selected `posthog` inlines an empty
     * array and carries no ingestion origin at all — which is what keeps the
     * provider-unset bundle scan green without weakening it. No deployment variable can
     * widen the contract: the list comes from version-controlled repository
     * configuration, not from `env`. `VITE_HAOO_POSTHOG_API_HOST` may only ever select
     * from it.
     */
    define: {
      __HAOO_APPROVED_ANALYTICS_HOSTS__: JSON.stringify(
        approvedAnalyticsHostsForProvider(env.VITE_HAOO_MEASUREMENT_PROVIDER),
      ),
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          haoo: resolve(__dirname, 'products/haoo/index.html'),
        },
        /**
         * Isolate the vendor SDK under a name the build-output suite can partition on.
         *
         * Since `04.1-09` bound `posthog-js` in a value position, the vendor chunk ships
         * in every build. A minified third-party bundle legitimately carries
         * browser-storage tokens, identifier tokens and the vendor's own default host
         * string, so a whole-bundle prohibition asserted after that point would be a
         * claim about the VENDOR's published artifact rather than about this repository.
         * Naming the chunk is what lets those prohibitions stay claims about this
         * project: `src/test/build-output.test.ts` partitions `dist/assets` on this name
         * and scans the project side.
         *
         * The seed list is MEASURED, not guessed. `posthog-js` alone pulled its whole
         * transitive runtime into this chunk, but each package is named explicitly so a
         * dependency that later resolves differently lands here by declaration rather
         * than by luck — a vendor module leaking into a project chunk must be fixed by
         * extending this list, never by relaxing a prohibition in the suite. The
         * partition is asserted in BOTH directions there (the vendor side must be
         * non-empty and carry a marker unique to the pinned SDK, the project side must be
         * non-empty and carry this project's own context keys), so a seed change that
         * swallowed project code fails loudly instead of passing on nothing.
         */
        output: {
          manualChunks: {
            'posthog-sdk': [
              'posthog-js',
              'preact',
              'dompurify',
              'fflate',
              'core-js',
              'web-vitals',
            ],
          },
        },
      },
    },
  };
});
