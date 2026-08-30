# Deferred Items — Phase 02

Out-of-scope discoveries logged during execution. Not fixed, by scope-boundary rule.

## From 02-03 (entry points and navigation)

- **`react-refresh/only-export-components` warnings in `src/components/QualifyForm.tsx`** (4 warnings, lines 28, 60, 72, 101). Pre-existing from plan 02-01; `npm run lint` exits 0 (warnings, not errors). The file exports pure helpers alongside the component, which disables Fast Refresh for it in dev. Resolution would be moving those helpers into a non-component module — a refactor owned by whichever later plan next touches `QualifyForm.tsx`, not by an entry-point plan that never opens the file.

## From the Phase 02 code review (`02-REVIEW.md` / `02-REVIEW-FIX.md`)

- **WR-08 ships without a regression test, and the gap is structural rather than an
  oversight.** The fix — composing field writes from `valuesRef.current` instead of the
  render closure — is committed (`f494c59`) and the submit path reads the same ref, so
  the payload is built from the committed snapshot. What could not be built is a test that
  fails against the unfixed code.

  Two independent attempts established why. `fireEvent` was ruled out first: it dispatches
  a discrete event that React flushes synchronously, so the handler closure is refreshed
  before the next write. A second, harder attempt then drove the form with native value
  setters wrapped in `unstable_batchedUpdates` — both a two-field batched write and a
  write-plus-submit in one batch — and reverted **only** the WR-08 change in isolation to
  check the probe was measuring the right thing. Every variant still passed against the
  unfixed code: under React 18's `createRoot`, each `dispatchEvent` of a discrete event is
  processed and re-rendered before the call returns, and `unstable_batchedUpdates` does
  not defer that. The stale closure is therefore unreachable from any DOM-event-driven
  test in React 18 + jsdom.

  Reproducing it needs the same handler reference invoked twice with no render between —
  reachable only by holding a reference to the component's `setValue` directly, which
  means either exporting internals purely for the test or moving field-write composition
  into a standalone reducer that can be unit-tested on its own. The reducer extraction is
  the sound version and is the recommended route for whichever later plan next opens
  `QualifyForm.tsx`. A probe test that cannot fail was deliberately not committed.

  Current coverage is indirect: the payload contracts in `qualify-form.test.tsx` assert the
  submitted body against `valuesRef.current`, so a regression that broke the ref read would
  be caught there — a regression confined to the closure write would not.
