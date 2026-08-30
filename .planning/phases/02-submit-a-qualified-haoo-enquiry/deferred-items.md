# Deferred Items — Phase 02

Out-of-scope discoveries logged during execution. Not fixed, by scope-boundary rule.

## From 02-03 (entry points and navigation)

- **`react-refresh/only-export-components` warnings in `src/components/QualifyForm.tsx`** (4 warnings, lines 28, 60, 72, 101). Pre-existing from plan 02-01; `npm run lint` exits 0 (warnings, not errors). The file exports pure helpers alongside the component, which disables Fast Refresh for it in dev. Resolution would be moving those helpers into a non-component module — a refactor owned by whichever later plan next touches `QualifyForm.tsx`, not by an entry-point plan that never opens the file.
