# Deferred Items — Phase 04.1

Out-of-scope discoveries logged during execution. Not fixed by the plan that found them.

---

## D1 — A second bundle scan still asserts identity and storage tokens against `builtBundleText()`

**Found during:** `04.1-01` Task 1
**File:** `src/test/build-output.test.ts` — `it('keeps the production bundle free of identity and ordered-emission channels')`

`04.1-01` relocated the identity/queue patterns off the *provider-unset bundle* scan (the site
the plan named, formerly line 656) and onto the production-source scan, via
`MEASUREMENT_IDENTITY_SOURCE_FORBIDDEN`. A **second, separately-declared** bundle scan was not in
that plan's scope and still asserts, inline, against every `.js` under `dist/assets`:

```ts
/document\.cookie|sessionStorage|indexedDB/,
/\b(?:visitor|user|device|session)(?:Id|ID)\b/,
/\b(?:uuid|fingerprint|clickstream|eventQueue|emittedEvents)\b/i,
```

**Why it will fire:** `04.1-RESEARCH.md` Pitfall 1 records that `posthog-js@1.425.1/dist/module.js`
*does* contain `localStorage`, `sessionStorage`, and `window.location`, and a minified SDK will
carry identifier tokens of its own. The patterns above are therefore expected to match the moment a
production module imports the SDK and Vite emits the vendor chunk into `dist/assets`.

**When it will fire:** not at `04.1-03` (installing a dependency does not bundle it — nothing imports
it yet), but at **`04.1-04`**, when `src/measurement/posthog.ts` imports `posthog-js`.

**Not fixed here because:** `04.1-01` enumerated exactly two application sites for the constants it
restated, and explicitly instructed that other boundary entries be left for `04.1-04`. Partially
narrowing this second case would not unblock `04.1-04` on its own (the `sessionStorage` prohibition
would still fire), so a partial edit would deviate from scope without buying anything.

**Suggested handling in `04.1-04`:** apply the same reasoning the `MEASUREMENT_IDENTITY_SOURCE_FORBIDDEN`
doc comment already records — a claim about a minified vendor artifact is a claim about the vendor,
not about this project — and either relocate these three patterns to the production-source scan or
scope the bundle scan to the entry chunk (RESEARCH Pitfall 1, option 2). The positive assertions in
that case (`expect(bundle).toContain('visitOrdinal')` / `'lastSeenDay'`) remain true and should stay.
Note that `04.1-03` Task 2 instructs the executor to *stop and report* rather than widen a
prohibition — this entry is the pre-recorded answer for when that report arrives.

## Out-of-scope discovery (04.1-02)

- `gsd-tools query roadmap.update-plan-progress 04.1` wrote `**Plans:** 2/9 plans executed` into
  `.planning/ROADMAP.md:212` while `query find-phase 04.1` reports `plan_count: 8` /
  `plan_count_all: 8` and only eight `04.1-NN-PLAN.md` files exist. The extra unit is almost
  certainly the plan-shaped-but-non-canonical `.planner-contributions.md` that `find-phase` warns
  about and skips but the roadmap counter appears to include. Corrected by hand to `2/8` in the
  04.1-02 close-out commit; the counter itself is a gsd-core issue, not a project one, and every
  later plan in this phase will re-introduce the wrong denominator until it is fixed upstream or
  the contributions file is renamed.
