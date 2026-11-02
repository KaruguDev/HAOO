import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { approvedAnalyticsHostsForProvider } from './config/approved-analytics-hosts';

/**
 * Inline the built stylesheet into `index.html`, and modulepreload the entry script
 * (quick task 261102-psi).
 *
 * The single ~5 KB (gzip) stylesheet was the page's only render-blocking request, which
 * PageSpeed reported as "Render blocking requests" and a link in the network dependency
 * chain. Inlining it removes that round trip before first paint.
 *
 * The entry script then remained the one critical request the document starts itself,
 * which PageSpeed's "Network dependency tree" insight reports as a chain. A
 * `modulepreload` for it in `<head>` (as Vite already emits for the React chunk) lets the
 * request start from the preload rather than from the parser reaching the script tag;
 * the browser reuses that response for the script. Build-only: the dev server keeps its
 * normal HMR handling.
 */
function inlineStylesheet(): Plugin {
  return {
    name: 'haoo-inline-stylesheet',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        const bundle = context.bundle;
        if (bundle === undefined) return html;

        let inlined = html;
        for (const [fileName, output] of Object.entries(bundle)) {
          if (output.type !== 'asset' || !fileName.endsWith('.css')) continue;

          const link = new RegExp(
            `<link\\b[^>]*\\bhref="/${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`,
          );
          if (!link.test(inlined)) continue;

          const css = typeof output.source === 'string'
            ? output.source
            : new TextDecoder().decode(output.source);
          inlined = inlined.replace(link, () => `<style>${css}</style>`);
          delete bundle[fileName];
        }

        const entry = /<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/.exec(inlined);
        if (entry !== null && !inlined.includes(`<link rel="modulepreload" crossorigin href="${entry[1]}">`)) {
          inlined = inlined.replace(
            entry[0],
            () => `<link rel="modulepreload" crossorigin href="${entry[1]}">\n    ${entry[0]}`,
          );
        }
        return inlined;
      },
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Public `VITE_`-prefixed build configuration only — never the report credentials.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react(), inlineStylesheet()],
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
        /**
         * One document, one input. Plan `04.2-02` moved the HAOO document to the
         * repository root and pruned the ZERO-PAPER HUB site root, so this repository
         * publishes exactly one page at `/`.
         */
        input: {
          haoo: resolve(__dirname, 'index.html'),
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
            /**
             * React and its scheduler in their own long-cacheable chunk (quick task
             * 261102-psi). They change only on a dependency bump, so returning visitors keep
             * them across content deploys, and each script stays under Lighthouse's
             * per-script unused-JavaScript threshold: most of what that audit counted in the
             * single app chunk was React DOM's own code paths, unused on any single page.
             */
            'react-vendor': ['react', 'react-dom', 'scheduler'],
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
