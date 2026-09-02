import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { approvedScriptSourcesForProvider } from './config/approved-analytics-script-sources';

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
     * The single route by which the approved analytics origin may reach a bundle.
     *
     * The value is gated on the configured provider, so a build that has not
     * deliberately selected `plausible` inlines an empty array and carries no analytics
     * origin at all — which is what keeps the provider-unset bundle scan green without
     * weakening it. A deliberately configured build carries the approved contract it is
     * entitled to carry, and no deployment variable can widen that contract: the list
     * comes from version-controlled repository configuration, not from `env`.
     */
    define: {
      __HAOO_APPROVED_ANALYTICS_SCRIPT_SOURCES__: JSON.stringify(
        approvedScriptSourcesForProvider(env.VITE_HAOO_MEASUREMENT_PROVIDER),
      ),
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          haoo: resolve(__dirname, 'products/haoo/index.html'),
        },
      },
    },
  };
});
