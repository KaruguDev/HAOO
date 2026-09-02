---
last_mapped_commit: 7a99cab52f8907ebb43e9618c909ed785d088dbe
---
<!-- refreshed: 2026-09-02 -->
# Testing Patterns

**Analysis Date:** 2026-09-02

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: `vitest.config.ts`

```ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

**Key facts:**
- `globals: false` — `describe`, `it`, `expect`, `vi` MUST be imported explicitly from `vitest` in every test file
- Environment is `jsdom` 26.1.0 for all suites (including the Node-filesystem and subprocess suites, which use `node:fs` / `node:child_process` directly)
- `@vitejs/plugin-react` is loaded so `.tsx` suites compile with the automatic JSX runtime
- Node `>=22.18.0` is required (`engines` in `package.json`) because the report CLI loads `src/reporting/*.ts` through native type stripping, and one suite spawns that CLI

**Assertion / DOM libraries:**
- Vitest built-in `expect`
- `@testing-library/react` 16.3.2 and `@testing-library/dom` 10.4.1
- `@testing-library/jest-dom` is NOT installed — use plain DOM assertions (`expect(el.getAttribute('href')).toBe(...)`, `expect(el).not.toBeNull()`), not `toBeInTheDocument()`

**Run Commands:**
```bash
npm test              # npm run build && vitest run  (required: build-output tests read dist/)
npm run test:unit     # vitest run only (no rebuild)
npm run typecheck     # tsc --noEmit -p tsconfig.app.json
npm run lint          # eslint .
npm run test:phase1:red   # node scripts/assert-phase1-red.mjs — red-phase marker guard
npm run report:haoo   # node scripts/generate-haoo-report.mjs — owner report CLI
```

**Important:** `npm test` rebuilds first because `src/test/build-output.test.ts` asserts against the real `dist/` tree and fails outputs older than their newest input. In CI (`.github/workflows/deploy.yml`) the order is Typecheck → Lint → Build (with `VITE_HAOO_FORM_ENDPOINT`) → `npm run test:unit`, deliberately using `test:unit` so the tested `dist/` is the artifact that ships.

## Test File Organization

**Location:** Centralized, not co-located. All tests live in `src/test/`; shared oracles live in `src/test/fixtures/`.

**Naming:** `<subject>.test.ts` for logic/data/filesystem/subprocess suites, `<subject>.test.tsx` for React DOM suites.

**Structure:**
```
src/test/
├── setup.ts                      # global setup (loaded by vitest.config.ts)
├── fixtures/
│   ├── haoo-report-cli-fetch-preload.mjs  # Node --import preload: fake fetch + call audit
│   └── plausible-preload-contract.ts      # independent vendor-contract oracle
├── build-output.test.ts          # dist/ artifact + static HTML contracts (664 lines)
├── focus-contrast.test.ts        # parses source class strings, computes WCAG ratios
├── haoo-content.test.ts          # product data fidelity vs. brochure source
├── haoo-page.test.tsx            # rendered page semantics/accessibility
├── haoo-report.test.ts           # reporting pipeline + credentialed CLI (1707 lines)
├── measurement.test.ts           # measurement facade unit tests
├── measurement-page.test.tsx     # measurement wired into ProductPage
├── product-shell-reuse.test.tsx  # product-agnostic shell contracts
├── products-section.test.tsx     # home products section
├── qualify-data.test.ts          # endpoint + field/group data contracts
└── qualify-form.test.tsx         # form behaviour, validation, submission (2402 lines)
```

## Global Setup

`src/test/setup.ts` does two things:

1. Polyfills `IntersectionObserver` with a no-op class when absent, because jsdom does not implement it and the home page reveal hook subscribes to it. The no-op keeps every section in the DOM for contract queries.
2. Registers `afterEach(cleanup)` from `@testing-library/react`.

Suites that need to observe reveal behaviour override this with their own `vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)` (`src/test/measurement-page.test.tsx:82`).

## Test Structure

**Suite organization** — `describe` names state the contract, `it` names state the guarantee in full prose:

```ts
// src/test/measurement.test.ts
describe('closed event-name contract', () => {
  it('accepts exactly the ten configured ASCII literals as bare sink calls', () => { ... });
  it('does not queue, retry, log, or retain emitted names when the sink throws', () => { ... });
});
```

**Conventions:**
- `describe` blocks are named after the unit or contract, not the file: `'validateEchoedQuery'`, `'parseGoalCounts'`, `'credentialed CLI'`, `'credential and provider-origin boundary'`, `'Surface A document structure'`, `'bounded visit and time transitions'`
- Red-phase tracer tests carry an inline marker in the title: `it('[phase1-red:build] emits a physical nested HAOO document', ...)`. `scripts/assert-phase1-red.mjs` runs four named suites and asserts those markers fail (and that no *infrastructure* error such as `Failed to resolve import` or `No test files found` masqueraded as a red test).
- No `beforeEach`. Setup goes into module-level constants plus small local factory helpers.
- Teardown is only `afterEach(() => { vi.restoreAllMocks(); })` where mocks are used, on top of the global `cleanup`. Suites that create temp directories `rmSync(dir, { recursive: true, force: true })` in a `finally`.

**Fixture constants at the top of each file** — expected values are frozen as module constants before any test runs, so a test reads as a diff against a fixed ledger:

```ts
// src/test/haoo-page.test.tsx
const ONBOARDING_LINKS = [
  ['Chat with HAOO on WhatsApp', HAOO_PRODUCT.contacts.whatsappHref],
  ['Call +254 702 188 044', 'tel:+254702188044'],
] as const;
const NAV_ORDER = ['Benefits', 'Capabilities', 'Brochure', 'Send details', 'Onboarding'];
```

**Sentinel constants for leak assertions** — secrets used in tests are named so their presence anywhere in an artifact is unambiguous:

```ts
// src/test/haoo-report.test.ts
const FIXTURE_API_KEY = 'fixture-stats-api-key-do-not-render';
const secret = 'secret-header-sentinel-never-render';
```

**Local render/run helpers** rather than repeated `render(...)` calls:

```ts
function renderPage() {
  return render(<ProductPage product={HAOO_PRODUCT} />);
}

function brochureRegion() {
  return screen.getByRole('region', { name: 'Brochure' });
}
```

**Table-driven tests** via `it.each` are the dominant pattern for closed sets, with `%s` or `$field` labels in the title:

```ts
it.each(invalidRecords)('rejects the whole %s record and rebuilds fresh', (_label, raw) => { ... });
it.each(['getItem', 'setItem', 'removeItem'] as const)('contains a storage %s exception', (method) => { ... });
it.each([...])('names exactly the missing variable names with $label absent', ({ environment, missing }) => { ... });
```

## Querying the DOM

- Prefer role and accessible-name queries: `screen.getByRole('region', { name: 'Brochure' })`, `getByRole('button', { name: QUALIFY_SUBMIT_LABEL })`
- Scope with `within(...)` when asserting inside a landmark
- `fireEvent` (not `user-event`, which is not installed) for interaction
- `waitFor` for async settlement; wrap imperative state pushes in `act`
- Assert exact copy against the constants exported from source (`QUALIFY_STATUS_MESSAGES`, `QUALIFY_SUBMIT_LABEL`, `REPORT_STAGES`) so copy and test can never drift
- Generated (non-React) HTML from `renderReport` is asserted by parsing the string, not by rendering it into jsdom queries where the assertion would be about markup bytes

## Mocking

**Framework:** Vitest `vi`.

**Patterns:**

Dependency injection first — `createMeasurement` takes an adapters bag and `generateHaooReport` takes `ReportFetch` / `ReportFs` capabilities, so most tests need no global mocking at all:

```ts
// src/test/measurement.test.ts
function measurementWithStorage(storage: Storage, href = 'https://www.zero-paperhub.com/products/haoo/') {
  return createMeasurement(HAOO_MEASUREMENT, {
    storage,
    now: () => TODAY,
    location: { href },
    history: { state: null, replaceState: vi.fn() },
  });
}
```

Typed capability stubs that also record their calls — the report suite's `stubFetch(bodies, echoedRanges)` returns `{ fetchSpy, calls }` where each `StubCall` captures url, body and headers, so credential-leak and request-shape assertions read from the same fake:

```ts
const fetchSpy = vi.fn<ReportFetch>(async (url, init) => {
  calls.push({ url, body: init.body, headers: init.headers });
  ...
});
```

Independent oracles rather than reuse of production helpers — `independentlyEchoedQuery(range)` rebuilds the expected provider echo, and `src/test/fixtures/plausible-preload-contract.ts` transcribes Plausible's documented preload contract while importing *no* production measurement types. Do not import the module under test to build the expectation it is checked against.

Hand-written fakes over auto-mocks — a full `MemoryStorage implements Storage` class backed by a `Map` is defined in `src/test/measurement.test.ts` rather than mocking `localStorage`.

Global stubs only for true browser globals:
```ts
vi.stubGlobal('fetch', vi.fn(() => firstRequest));
vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
```

Spies for failure injection:
```ts
vi.spyOn(storage, method).mockImplementation(() => {
  throw new DOMException('blocked', 'SecurityError');
});
vi.spyOn(console, 'log').mockImplementation(() => undefined);
```

Fake timers where timeout/retry behaviour is asserted: `vi.useFakeTimers()` … `expect(vi.getTimerCount()).toBe(0)` … `vi.useRealTimers()`.

**What to mock:**
- Browser globals with no jsdom implementation (`fetch`, `IntersectionObserver`)
- Clock (`now: () => TODAY` adapter, or `vi.useFakeTimers`)
- Storage/history via the adapters bag
- External event sinks (`eventSink: vi.fn()`), the provider `fetch`, and the report filesystem (`ReportFs`)

**What NOT to mock:**
- Product data — always import the real `HAOO_PRODUCT` / `HAOO_MEASUREMENT_EVENTS` from `src/products/haoo.ts`
- Pure logic under test (`validateQualifyValues`, `buildSubmissionBody`, `parseGoalCounts`, `validateEchoedQuery`)
- Child components — pages are rendered whole through `ProductPage`
- The filesystem in build-output and CLI suites — those read the real `dist/` and write to a real temp directory
- The CLI entry point — it is executed as a real subprocess (below)

**Always** `afterEach(() => vi.restoreAllMocks())` in any suite that spies or stubs.

## Subprocess (CLI) Testing

`src/test/haoo-report.test.ts` exercises `scripts/generate-haoo-report.mjs` as a real Node process rather than importing it, because the contracts under test are environment reading, exit status, stream routing, and credential containment:

```ts
const directory = mkdtempSync(join(tmpdir(), 'haoo-report-cli-'));
copyFileSync(resolve(ROOT, 'scripts/generate-haoo-report.mjs'), join(scriptsDirectory, '...'));
symlinkSync(resolve(ROOT, 'src'), join(directory, 'src'), 'dir');   // real modules, sandboxed cwd
const result = spawnSync(
  process.execPath,
  ['--import', preloadPath, join(scriptsDirectory, 'generate-haoo-report.mjs')],
  { cwd: directory, encoding: 'utf8', env: { HAOO_REPORT_CLI_AUDIT_PATH: auditPath, ...environment } },
);
```

**Rules for this pattern:**
- Build a fresh `mkdtempSync` sandbox per run; symlink `src/` so the real TypeScript modules load through Node type stripping
- Pass an **explicit, closed `env`** — never spread `process.env`, or a developer's real credentials would enter the run
- Network is neutralized by a `--import` preload (`src/test/fixtures/haoo-report-cli-fetch-preload.mjs`) that replaces `globalThis.fetch` and writes an audit file of every URL called; the test then asserts both the output and the call count/origins
- Assert `result.status`, `result.stderr` (failure text) and `result.stdout` (success line) separately — the CLI's stream routing is part of the contract
- `spawnSync('git', ['check-ignore', '-q', '.reports/...'])` is used to assert generated owner artifacts stay untracked

## Fixtures and Factories

`src/test/fixtures/` holds only **contract oracles and process preloads**, not test data. Test data is produced by:

1. **Real production data** imported directly — `HAOO_PRODUCT`, `HAOO_MEASUREMENT`, `HAOO_MEASUREMENT_EVENTS`, `KENYAN_COUNTY_OPTIONS`, `REPORT_STAGES`
2. **Local factory functions with an overrides spread**, defined at the top of the suite:

```ts
function storedContext(overrides = {}) {
  return {
    version: 1,
    visitBand: 'first',
    lastSeenBand: 'today',
    flags: Object.fromEntries(FLAG_KEYS.map((key) => [key, false])),
    visitOrdinal: 1,
    lastSeenDay: '2026-08-30',
    ...overrides,
  };
}
```
3. **Frozen `as const` tables** of expected strings/paths at module scope

Time is pinned with a constant: `const TODAY = new Date('2026-08-31T12:00:00.000Z')`, or injected via `now: () => new Date(...)`. Day arithmetic in fixtures is computed in the report timezone (`Africa/Nairobi`) with `Intl.DateTimeFormat`, mirroring production rather than hard-coding offsets.

## Coverage

**Requirements:** No coverage provider is installed and no threshold is enforced. Coverage is enforced structurally instead:

- **Closed-set assertions** — suites assert exhaustiveness in *both* directions (e.g. "the report dictionary and the Phase 3 event tuple are exhaustive against each other", "every field name is placed in exactly one group", "every focus indicator in every registered source file"), so an unregistered addition fails a test rather than silently going unmeasured.
- **Capability coverage matrix** — `scripts/verify-phase4-coverage.mjs` checks that every documented third-party capability (Plausible browser API, Plausible Stats API v2, FormSubmit) is explicitly marked `INTEGRATE` or `OPT-OUT` in the phase docs. A new provider capability must be decided there, not silently ignored.
- **Mutation-style assertions** — several tests are written to kill a named mutant, e.g. `it('kills a partial-defaulting schema mutant with the invalid-record table', ...)` and `it('kills a forbidden-character stripping mutant', ...)` in `src/test/measurement.test.ts`. Keep this style when hardening logic.

## Test Types

**Unit / logic tests** (`src/test/measurement.test.ts`, `src/test/qualify-data.test.ts`, `src/test/haoo-content.test.ts`, parts of `src/test/haoo-report.test.ts`)
- Import pure modules and product data directly; no rendering
- Cover parsing, validation, band transitions, endpoint resolution, period windows, delta labels, and data-shape invariants

**Untrusted-input / fail-closed tests** (`parseGoalCounts`, `validateEchoedQuery` blocks in `src/test/haoo-report.test.ts`)
- Table-drive every rejection reason: unknown goal, duplicate goal row, non-integer count, negative count, wrong site id, mismatched metrics/dimensions/filter, mismatched echoed range
- Assert the result is `null` and that no write or render happened — not merely that an error was thrown

**Boundary / leak tests** (`'credential and provider-origin boundary'` in `src/test/haoo-report.test.ts`)
- Scan generated output and module source for the sentinel API key, the provider origin, the query path, and the credential env var names
- Assert the generated document contains no `<script>` element and no external resource reference

**Component / integration tests** (`src/test/qualify-form.test.tsx`, `src/test/haoo-page.test.tsx`, `src/test/measurement-page.test.tsx`, `src/test/product-shell-reuse.test.tsx`, `src/test/products-section.test.tsx`)
- Render real components through `ProductPage` with the real product definition
- Assert semantics, accessible names, focus movement, error summaries, and submission flow
- `src/test/measurement-page.test.tsx` renders under `StrictMode` to catch double-invocation bugs in effects

**Source-static tests** (`src/test/focus-contrast.test.ts`)
- Read component source files with `readFileSync`, extract Tailwind focus class strings, resolve the colour tokens, and compute the WCAG 2.2 SC 1.4.11 contrast ratio, gating on the unrounded double at exactly `>= 3`
- Every component that declares a focus indicator must be registered in that file's source list

**Artifact tests** (`src/test/build-output.test.ts`)
- Assert the shipped `dist/` tree: file existence, freshness against newest input mtime, canonical/OG metadata byte-equality, asset references resolving, the brochure PDF matching a pinned SHA-256, no-JS fallback markup, and that no tracking/identity/SDK seams leaked into the bundle
- Requires a fresh `npm run build` first

**Process tests** (`'credentialed CLI'`, `'owner command registration'` in `src/test/haoo-report.test.ts`) — see Subprocess section

**E2E:** Not used. No Playwright/Cypress.

## Common Patterns

**Async testing:**
```ts
const fetchSpy = vi.fn(() => firstRequest);
vi.stubGlobal('fetch', fetchSpy);
fireEvent.click(screen.getByRole('button', { name: QUALIFY_SUBMIT_LABEL }));
await waitFor(() => {
  expect(screen.getByRole('status').textContent).toBe(QUALIFY_STATUS_MESSAGES.succeeded);
});
```

**Error / failure-containment testing:**
```ts
it('does not queue, retry, log, or retain emitted names when the sink throws', () => {
  vi.useFakeTimers();
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const eventSink = vi.fn(() => { throw new Error('provider unavailable'); });
  // ... act ...
  expect(vi.getTimerCount()).toBe(0);
  expect(consoleSpy).not.toHaveBeenCalled();
  vi.useRealTimers();
});
```

**Write-on-success testing:** write a known previous document, run the generator against a rejecting `fetch` or a refused response body, then assert the destination file is byte-identical and no temporary sibling remains.

**Hashing an artifact:**
```ts
const PDF_SHA256 = '38d5ad8e...';
expect(createHash('sha256').update(readFileSync(BUILT_PDF)).digest('hex')).toBe(PDF_SHA256);
```

**Resolving repo paths in tests:**
```ts
const ROOT = resolve(import.meta.dirname, '../..');
```

## Adding New Tests

1. Create `src/test/<subject>.test.ts` (or `.tsx`)
2. Import `describe`, `it`, `expect`, `vi` explicitly from `vitest` — globals are off
3. Freeze expected values as module-scope `as const` constants and import real product data rather than inventing fixtures
4. Prefer a `describe` per contract and `it.each` for closed sets; state the guarantee in full prose in the `it` title
5. If the unit reads untrusted input, table-drive every rejection reason and assert `null` plus "no side effect happened"
6. If the component declares a new focus indicator, register its source file in `src/test/focus-contrast.test.ts`
7. If the change touches a third-party capability, record the INTEGRATE/OPT-OUT decision so `scripts/verify-phase4-coverage.mjs` still passes
8. If a CLI is involved, spawn it with `process.execPath`, a temp cwd, a closed `env`, and a `--import` preload that neutralizes the network
9. If the change affects shipped output, extend `src/test/build-output.test.ts` and run `npm test` (which rebuilds)

---

*Testing analysis: 2026-09-02*
