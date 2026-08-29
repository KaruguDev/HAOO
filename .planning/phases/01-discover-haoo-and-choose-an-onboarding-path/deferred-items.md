# Deferred Items

## Pre-existing npm audit finding

- `ws@8.18.3` is reported by `npm audit --omit=dev` with one high-severity denial-of-service advisory and one moderate memory-disclosure advisory.
- The same version was already locked before Plan 01-01 and is reached through the existing runtime dependency graph, not the approved Wave 0 development packages.
- It is outside this plan's exact-pin test-harness scope. Review the existing unused `@supabase/supabase-js` dependency and its transitive graph in a dedicated dependency-maintenance task rather than changing runtime dependencies during Wave 0.
