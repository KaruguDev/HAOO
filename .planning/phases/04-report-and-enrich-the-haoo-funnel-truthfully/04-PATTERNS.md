# Phase 4: Report and Enrich the HAOO Funnel Truthfully - Pattern Map

**Mapped:** 2026-09-01
**Files analyzed:** 11 (5 new, 6 modified)
**Analogs found:** 10 / 11

## File Classification

| New/Modified File | New/Mod | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|---------|------|-----------|----------------|---------------|
| `src/reporting/haoo-report.ts` (event→stage/label dictionary, date windows, stage sums, deltas) | new | utility (pure domain) | transform | `src/components/qualify-form.logic.ts` | role-match (pure logic module beside its consumer) |
| `src/reporting/stats-response.ts` (untrusted provider JSON validation) | new | utility (validator) | transform | `src/measurement/index.ts:99-146` (`parseContext`) | exact (fail-closed exact-keys parser) |
| `src/measurement/plausible.ts` or extension of `src/measurement/index.ts` (configured sink) | new/mod | service (adapter) | event-driven | `src/measurement/index.ts:314-329` (`track` + `eventSink`) | exact |
| `src/products/haoo-summary.ts` (pure engagement-summary formatter) | new | utility (formatter) | transform | `src/products/copy.ts:16-60` (pure product copy builders) | exact |
| `scripts/generate-haoo-report.mjs` (credentialed query + HTML writer) | new | script (Node tooling) | file-I/O + request-response | `scripts/assert-phase1-red.mjs` | role-match (only existing Node ESM script; no fetch/HTML analog) |
| `src/products/haoo.ts` (provider resolution, report labels, summary wording, `engagementSummary` config) | mod | config/data | n/a | itself: `resolveMeasurementProvider:29-31`, `resolveQualifyEndpoint:138-177` | exact |
| `src/products/types.ts` (`MeasurementProvider` widening, report/summary config types) | mod | model (types) | n/a | itself: `ProductMeasurement`, `ProductQualifyForm` | exact |
| `src/components/qualify-form.logic.ts` (`buildSubmissionBody` summary field) | mod | utility | transform | itself: `buildSubmissionBody:57-88` | exact |
| `src/components/QualifyForm.tsx` (pass context/campaign into body build) | mod | component | request-response | itself: `submitValues` 290-325 | exact |
| `src/components/MeasurementDisclosure.tsx` + `haoo.ts` disclosure copy (`summaryBoundary`) | mod | component/copy | n/a | itself: `MeasurementDisclosure.tsx:27-100` | exact |
| `src/test/haoo-report.test.ts` (new) + extend `measurement.test.ts`, `qualify-form.test.tsx`, `qualify-data.test.ts`, `build-output.test.ts` | new/mod | test | n/a | `src/test/qualify-data.test.ts`, `src/test/build-output.test.ts` | exact |

## Pattern Assignments

### `src/reporting/stats-response.ts` (validator, transform)

**Analog:** `src/measurement/index.ts` — `exactKeys` + `parseContext`.

**Exact-keys guard** (`src/measurement/index.ts:93-97`):
```typescript
function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length
    && actual.every((key, index) => key === [...expected].sort()[index]);
}
```

**Fail-closed parse shape** (`src/measurement/index.ts:99-146`) — copy this structure for the Plausible v2 response: `JSON.parse` inside `try`, reject non-object/array, `exactKeys` on the record, per-field `typeof`/enum checks each returning `null`, then rebuild a *new* literal object (never spread the untrusted record). The returned object is constructed field-by-field at lines 133-140, which is exactly the "explicit pick list" the research demands for unknown/duplicate goal rows.

**Return-null-not-throw convention:** every rejection path returns `null`; the caller decides. For the report script, the caller exits nonzero (Pattern 5, write-on-success).

---

### `src/reporting/haoo-report.ts` (pure domain, transform)

**Analog:** `src/components/qualify-form.logic.ts` — a pure `.logic.ts` sibling module holding all locked copy constants and pure functions, imported by both the component and the tests.

**Locked-copy constant pattern** (`qualify-form.logic.ts:8-21`):
```typescript
/** Locked UI-SPEC control copy. Every string below is rendered byte-identically. */
export const QUALIFY_SUBMIT_LABEL = 'Send my details';
...
export const QUALIFY_STATUS_MESSAGES: Readonly<Record<SubmissionState, string>> = {
  idle: '',
  submitting: 'Sending your details…',
  succeeded: 'Your details were sent.',
  failed: "We couldn't send your details.",
};
```
Use the same `Readonly<Record<EventName, string>>` shape for the exhaustive event→literal-label map, keyed off `HaooMeasurementEvent` so a new event fails typecheck (mirrors `signalLines` in `src/products/haoo.ts:73-85`, which is already `Readonly<Record<EventName, string>>` via `ProductMeasurementDisclosure` in `src/products/types.ts:100`).

**Closed-tuple source of truth** (`src/products/haoo.ts:14-27`):
```typescript
export const HAOO_MEASUREMENT_EVENTS = [
  'haoo_page_view',
  ...
  'haoo_self_onboarding',
] as const;
export type HaooMeasurementEvent = (typeof HAOO_MEASUREMENT_EVENTS)[number];
```
Derive stage membership from this tuple; never re-list the literals.

**Date helper style** (`src/measurement/index.ts:47-80`) — day-only ISO strings via `toISOString().slice(0, 10)`, epoch parsing with a round-trip identity check, and integer day arithmetic on `DAY_MILLISECONDS = 86_400_000`. Reuse this style for the inclusive 7/30/90-day windows rather than adding a date library.

---

### `src/measurement/*` configured sink (service, event-driven)

**Analog:** `src/measurement/index.ts` — `track` isolation, lines 291-307:
```typescript
function track(event: EventName): boolean {
  if (!isMeasurementEventName(config.events, event)) return false;

  try {
    adapters.eventSink?.(event);
  } catch {
    // Provider delivery is deliberately isolated from every visitor action.
  }
  ...
}
```

**Injected-capability pattern** (`src/measurement/index.ts:15-21`): every browser global arrives through `MeasurementAdapters` (`storage`, `location`, `history`, `now`, `eventSink`) with a `?? window.x` default wrapped in `try`. See `browserStorage` (lines 186-192). The Plausible loader must follow this: an injectable seam so tests never touch a real script tag.

**Finite resolver pattern** (`src/products/haoo.ts:29-31`, widened form of `resolveQualifyEndpoint` at 138-177):
```typescript
export function resolveMeasurementProvider(configuredValue?: string): MeasurementProvider {
  return configuredValue?.trim().toLowerCase() === 'none' ? 'none' : 'none';
}
```
Widen to `'none' | 'plausible'` with the **same fail-closed default**: trim, lowercase, match an allowlist, otherwise return `'none'`. `resolveQualifyEndpoint` (138-177) is the richer template for validating a configured URL (protocol/host/username/password/search/hash/segment-count checks, each returning the fallback).

**Facade key order is contract-tested** (`src/test/measurement.test.ts:135-142` asserts `Object.keys(measurement)` equals the five names) — adding a method to the returned object breaks a test; extend deliberately.

---

### `src/products/haoo-summary.ts` (formatter, transform)

**Analog:** `src/products/copy.ts` — pure exported string builders with a fail-closed guard:
```typescript
export function requireIdentity(value: string, field: 'name' | 'slug') {
  if (value.trim() === '') {
    throw new Error(`Product ${field} must not be empty`);
  }
  return value;
}
```

**Explicit pick-list rule:** the formatter must read only `context.visitBand`, `context.lastSeenBand`, `context.flags`, plus the three normalized campaign keys. `EngagementContext` (`src/measurement/index.ts:6-13`) also carries `visitOrdinal` and `lastSeenDay`; the disclosure at `src/products/haoo.ts:97-98` already promises those "never enter analytics events or form submissions". Never spread the context object.

**Campaign source of truth** (`src/measurement/index.ts:41-43`): `CAMPAIGN_KEYS = ['utm_source','utm_medium','utm_campaign']`, values already lowercased, `/^[a-z0-9-]+$/`, capped at 32 chars by `readCampaign` (lines 194-232). Read `measurement.readCampaign()`; do not re-parse the URL.

---

### `src/components/qualify-form.logic.ts` (utility, transform)

**Analog:** itself — `buildSubmissionBody` (lines 57-88) and `RESERVED_EMAIL_LABELS` (lines 46-57).

**Reserved-label guard to extend:**
```typescript
export const RESERVED_EMAIL_LABELS: ReadonlySet<string> = new Set([
  '_subject', '_template', '_captcha', '_honey', '_cc', '_next',
  '_autoresponse', '_replyto', 'Source',
]);
```
The new engagement-summary email label MUST be added to this set, because `buildSubmissionBody` throws when a product field claims a reserved label (lines 66-70) and `src/test/qualify-form.test.tsx:487-500` iterates the whole set to prove it.

**Insertion point** (lines 84-87):
```typescript
  body.Source = qualify.sourceNote;

  return body;
```
Append the summary field after `Source`, before `return`. Prefer an optional third parameter (`summary?: string`) so the existing two-argument callers in `src/test/build-output.test.ts` keep compiling.

---

### `src/components/QualifyForm.tsx` (component, request-response)

**Analog:** itself — `submitValues`, lines 299-316. The locked order is serialize → track → fetch:
```typescript
      const body = JSON.stringify(buildSubmissionBody(submittedValues, qualify));

      track(measurementEvents.submit);
      const response = await fetch(qualify.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body,
        signal: controller.signal,
      });

      setState(response.ok ? 'succeeded' : 'failed');
```
Build the summary before `JSON.stringify` so a formatter throw is caught by the existing `catch` and lands in `failed` (which mounts the recovery panel) rather than producing a half-sent request. Do not read `response` body; the `response.ok` comment at 313-315 is the truthfulness boundary MEAS-08 depends on.

---

### `src/components/MeasurementDisclosure.tsx` + disclosure copy (component)

**Analog:** itself. All copy is data-driven from `ProductMeasurementDisclosure`; the component renders `disclosure.summaryBoundary` at lines 88-90 with no literal strings of its own. Phase 4 changes only the value in `src/products/haoo.ts:113`:
```typescript
    summaryBoundary: 'No engagement summary is attached to this form submission yet.',
```
Note this exact sentence is also asserted verbatim inside `APPROVED_COLLECTION_NOTICE` in `src/test/build-output.test.ts:41-42` and in `src/products/haoo.ts` collection-note copy (line 397+); changing it requires updating those in the same task.

**Native disclosure widget pattern** (`MeasurementDisclosure.tsx:27-36`) — `<details>` + `<summary>` with `min-h-11` and the shared `focusClasses` ring constant. Reuse this exact shape for the report's expandable stages (RESEARCH "Accessible Compact Stage").

---

### `scripts/generate-haoo-report.mjs` (script, file-I/O)

**Analog (partial):** `scripts/assert-phase1-red.mjs` — the only existing Node script. Copy its conventions: `.mjs`, `node:`-prefixed built-in imports (`import { spawnSync } from 'node:child_process';`), `process.stdout.write` for output, `console.error` + `process.exit(1)` on every failure branch, registered in `package.json` scripts alongside `"test:phase1:red": "node scripts/assert-phase1-red.mjs"`.

**No analog for:** authenticated `fetch`, HTML generation, atomic temp-then-rename write. Use RESEARCH Pattern 5 plus `node:fs`/`node:path` usage as seen in `src/test/build-output.test.ts:1-3`:
```typescript
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
```
Secret handling has no analog: `resolveQualifyEndpoint` reads `import.meta.env.VITE_*` (public build config). The Stats API key must come from `process.env` in the script only and must never appear in `src/`.

---

### Tests

**Pure-data contract test analog:** `src/test/qualify-data.test.ts:1-45` — table-driven rows with explicit `expectedResolution` per row (never a shared "rejected" boolean), a doc comment naming the requirement/threat ID, and `describe`/`it.each`. Use this for the event→stage/label map, date windows, and provider-response validation.

**Sink/behavior test analog:** `src/test/measurement.test.ts:26-58` — `MemoryStorage implements Storage`, fixed `TODAY` date, `measurementWithStorage()` helper injecting `{ storage, now, location, history }`, `vi.fn()` sinks, `expect(eventSink).not.toHaveBeenCalled()` for negative cases (lines 105-117). Fixture-drive the Plausible adapter the same way; never network.

**Request-payload test analog:** `src/test/qualify-form.test.tsx:409-450` — `stubFetch`, `parseRequest(fetchSpy)`, `expect(Object.keys(body).sort()).toEqual(EXPECTED_BODY_KEYS)`, and a forbidden-shape regex:
```typescript
const forbiddenPayloadShape =
  /engagement|context|analytics?|identifier|visitor|score|signal|summary/i;
expect(Object.keys(body).filter((key) => forbiddenPayloadShape.test(key))).toEqual([]);
```
This regex currently forbids the very field Phase 4 adds. It must be narrowed to an exact-allowlist assertion (the new label added to `EXPECTED_BODY_KEYS`) plus negative tests for `visitOrdinal`, `lastSeenDay`, the storage key, and form answers — not deleted.

**Static-boundary test analog:** `src/test/build-output.test.ts:44-70` (`PRODUCT_SOURCE_BOUNDARY` per-file forbidden-group map) and lines 415-437. Any new `src/reporting/` or `src/measurement/plausible.ts` file must be added to `PRODUCT_SOURCE_BOUNDARY`, because `src/test/build-output.test.ts:441-456` asserts every local import of a covered file is itself present in the map. The bundle scan at lines 501-514 currently forbids `plausible\.io` in `dist`:
```typescript
/googletagmanager|google-analytics|plausible\.io|umami|posthog|segment\.com/i
```
This must be re-scoped (unset-provider bundle only) rather than removed, and a new prohibition added for any Stats API token pattern.

## Shared Patterns

### Fail-closed resolution of untrusted configuration
**Source:** `src/products/haoo.ts:138-177` (`resolveQualifyEndpoint`), `:29-31` (`resolveMeasurementProvider`)
**Apply to:** provider resolution, site ID, script URL, API-key presence.
Trim → validate against an explicit allowlist/URL rules → return the safe default on every rejection path. Never throw, never partially accept.

### Untrusted-object parsing
**Source:** `src/measurement/index.ts:93-146`
**Apply to:** Plausible Stats API responses, stored context.
`exactKeys` + per-field type/enum checks + rebuild a fresh literal. Return `null` on rejection.

### Provider-failure isolation
**Source:** `src/measurement/index.ts:291-307`
**Apply to:** the Plausible sink and the summary formatter call inside `QualifyForm`.
Wrap the provider call in `try {} catch {}` with a comment stating why the failure is swallowed; visitor journey never degrades.

### Data-driven copy, zero literals in components
**Source:** `src/products/types.ts:96-114` + `src/components/MeasurementDisclosure.tsx:38-100`
**Apply to:** report labels, stage names, summary sentences.
Every visitor- or owner-facing string lives in `src/products/*` typed as `Readonly<Record<...>>` keyed by a closed union, so an omission is a typecheck error; components only render `config.x`.

### Accessible disclosure + focus ring
**Source:** `src/components/MeasurementDisclosure.tsx:12-13, 27-36`
```typescript
const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2 focus-visible:ring-offset-white';
```
**Apply to:** report stage expanders and any new control. Native `<details>`/`<summary>`, `min-h-11` targets, `role="status"` for async feedback (lines 92-97).

### Truthful-copy discipline
**Source:** `src/components/qualify-form.logic.ts:12-21` comment, `src/components/QualifyForm.tsx:313-315` comment
**Apply to:** every report label, summary sentence, and disclosure line.
Each string describes a browser-observable event; comments record *why* the weaker claim is the correct one.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/generate-haoo-report.mjs` (fetch + HTML generation + atomic write halves) | script | request-response, file-I/O | No existing script performs authenticated network calls, HTML generation, or secret reads from `process.env`. `scripts/assert-phase1-red.mjs` supplies only CLI/exit-code conventions; use RESEARCH Pattern 5 and V5/V9 controls for the rest. |

## Metadata

**Analog search scope:** `src/measurement/`, `src/products/`, `src/components/`, `src/pages/`, `src/test/`, `scripts/`, root config
**Files scanned:** 14 read, 25 listed
**Pattern extraction date:** 2026-09-01
