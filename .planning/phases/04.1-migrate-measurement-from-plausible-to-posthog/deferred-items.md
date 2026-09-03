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

---

## D2 — The selector-SET ingestion-host bundle assertion cannot fail until a reader exists

**Found during:** `04.1-03` Task 3
**File:** `src/test/build-output.test.ts` — `describe('approved analytics ingestion host boundary')`

`04.1-03` Task 3 asked for a describe asserting both directions of the provider gate: *"with the
selector set to the exact provider value the built bundle carries the approved origin exactly once,
and with the selector unset the built bundle carries no ingestion origin at all."* Only the second
half was implemented.

**Why the first half was not implemented:** Vite substitutes a `define` only where a module
*references* the constant; an unreferenced define emits nothing at all. Measured directly during
execution:

| Build | Constant has a reader? | Origin occurrences in `dist/assets/*.js` |
|---|---|---|
| `VITE_HAOO_MEASUREMENT_PROVIDER=plausible` | yes — `buildTimeApprovedScriptSources` in `src/products/haoo.ts` | `plausible.io` × 1 |
| `VITE_HAOO_MEASUREMENT_PROVIDER=posthog` | **no** — nothing reads `__HAOO_APPROVED_ANALYTICS_HOSTS__` yet | `us.i.posthog.com` × 0 |
| unset | n/a | both × 0 |

`04.1-03` explicitly forbids touching `src/measurement/`, `src/products/`, or `src/components/`, so
this plan cannot create the reader. An assertion written here would therefore have had to expect
zero occurrences for a selector-SET build — passing for the wrong reason, and continuing to pass if
the define were deleted outright. That is the precise failure mode `04.1-01` established a pattern
against.

**When it becomes assertable:** `04.1-04`, in the same commit that adds the PostHog resolver reading
`__HAOO_APPROVED_ANALYTICS_HOSTS__`.

**Suggested handling in `04.1-04`:** add the selector-SET case to the existing
`approved analytics ingestion host boundary` describe, mirroring the measured table above — a build
with `VITE_HAOO_MEASUREMENT_PROVIDER=posthog` carries the approved origin exactly once. The
selector-UNSET case, the source-derivation wiring case, the frozen-list case, the exact-equality
normalization case, and the import-graph case are all already in place and green, and the
absence case was proven falsifiable by mutation probe.

## D3 — `VITE_HAOO_POSTHOG_TOKEN` / `VITE_HAOO_POSTHOG_API_HOST` declarations deferred to `04.1-04`

**Found during:** `04.1-03` Task 3
**File:** `src/vite-env.d.ts`

`04.1-03` Task 3 asked for both keys to be added to the exhaustive `ImportMetaEnv` interface. Adding
them turns `it('declares no public build variable no production source reads')` red — measured, not
predicted:

```
- []
+ [ "VITE_HAOO_POSTHOG_TOKEN", "VITE_HAOO_POSTHOG_API_HOST" ]
  src/test/build-output.test.ts:339
```

That invariant is bidirectional by design: every declared key must be read by a production source,
and every key a production source reads must be declared. No production source reads either PostHog
key until `04.1-04` adds the resolvers, so the declarations are dead in this plan.

**Not fixed by widening the invariant**, because the invariant is exactly what catches a renamed or
misspelled variable — which types as `any` under Vite's index signature, compiles clean, resolves to
`undefined`, and fails closed to analytics silently off. Loosening it to tolerate declared-but-unread
keys would remove the only build-time signal that hole has.

**When it becomes assertable:** `04.1-04`, which should add the two declarations in the same commit
as their readers. This is the exact additive mirror of the discipline `04.1-03` already states for
the subtractive side — *"`04.1-04` removes the readers and what they read in one commit."*

**Note:** the build-time constant `__HAOO_APPROVED_ANALYTICS_HOSTS__` was NOT deferred and is
declared in `src/vite-env.d.ts` now. It is a `declare const`, not a `VITE_`-prefixed env key, so
neither direction of the exhaustiveness scan applies to it.
