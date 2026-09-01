# Testing Patterns

**Analysis Date:** 2026-09-01

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
- Environment is `jsdom` 26.1.0 for all suites (including the Node-filesystem suites, which just use `node:fs` directly)
- `@vitejs/plugin-react` is loaded so `.tsx` suites compile with the automatic JSX runtime

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
```

**Important:** `npm test` rebuilds first because `src/test/build-output.test.ts` asserts against the real `dist/` tree and fails outputs older than their newest input. In CI (`.github/workflows/`) the order is Typecheck → Lint → Build (with `VITE_HAOO_FORM_ENDPOINT`) → `npm run test:unit`, deliberately using `test:unit` so the tested `dist/` is the artifact that ships.

## Test File Organization

**Location:** Centralized, not co-located. All tests live in `src/test/`.

**Naming:** `<subject>.test.ts` for logic/data/filesystem suites, `<subject>.test.tsx` for React DOM suites.

**Structure:**
```
src/test/
├── setup.ts                      # global setup (loaded by vitest.config.ts)
├── build-output.test.ts          # dist/ artifact + static HTML contracts
├── focus-contrast.test.ts        # parses source class strings, computes WCAG ratios
├── haoo-content.test.ts          # product data fidelity vs. brochure source
├── haoo-page.test.tsx            # rendered page semantics/accessibility
├── measurement.test.ts           # measurement facade unit tests
├── measurement-page.test.tsx     # measurement wired into ProductPage
├── product-shell-reuse.test.tsx  # product-agnostic shell contracts
├── products-section.test.tsx     # home products section
├── qualify-data.test.ts          # endpoint + field/group data contracts
└── qualify-form.test.tsx         # form behaviour, validation, submission
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
- `describe` blocks are phase- or contract-scoped: `'Phase 1 static build contracts'`, `'bounded visit and time transitions'`, `'campaign whole-value allowlist'`
- Red-phase tracer tests carry an inline marker in the title: `it('[phase1-red:build] emits a physical nested HAOO document', ...)`. `scripts/assert-phase1-red.mjs` runs four named suites and asserts those markers fail (and that no *infrastructure* error such as `Failed to resolve import` or `No test files found` masqueraded as a red test).
- No `beforeEach`. Setup goes into module-level constants plus small local factory helpers.
- Teardown is only `afterEach(() => { vi.restoreAllMocks(); })` where mocks are used, on top of the global `cleanup`.

**Fixture constants at the top of each file** — expected values are frozen as module constants before any test runs, so a test reads as a diff against a fixed ledger:

```ts
// src/test/haoo-page.test.tsx
const ONBOARDING_LINKS = [
  ['Chat with HAOO on WhatsApp', HAOO_PRODUCT.contacts.whatsappHref],
  ['Call +254 702 188 044', 'tel:+254702188044'],
] as const;
const NAV_ORDER = ['Benefits', 'Capabilities', 'Brochure', 'Send details', 'Onboarding'];
```

**Local render helpers** rather than repeated `render(...)` calls:

```ts
function renderPage() {
  return render(<ProductPage product={HAOO_PRODUCT} />);
}

function brochureRegion() {
  return screen.getByRole('region', { name: 'Brochure' });
}
```

**Table-driven tests** via `it.each` are the dominant pattern for closed sets, with a `%s` label in the title:

```ts
it.each(invalidRecords)('rejects the whole %s record and rebuilds fresh', (_label, raw) => { ... });
it.each(['getItem', 'setItem', 'removeItem'] as const)('contains a storage %s exception', (method) => { ... });
```

## Querying the DOM

- Prefer role and accessible-name queries: `screen.getByRole('region', { name: 'Brochure' })`, `getByRole('button', { name: QUALIFY_SUBMIT_LABEL })`
- Scope with `within(...)` when asserting inside a landmark
- `fireEvent` (not `user-event`, which is not installed) for interaction
- `waitFor` for async settlement; wrap imperative state pushes in `act`
- Assert exact copy against the constants exported from source (`QUALIFY_STATUS_MESSAGES`, `QUALIFY_SUBMIT_LABEL`) so copy and test can never drift

## Mocking

**Framework:** Vitest `vi`.

**Patterns:**

Dependency injection first — `createMeasurement` takes an adapters bag, so most tests need no global mocking at all:

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
- External event sinks (`eventSink: vi.fn()`)

**What NOT to mock:**
- Product data — always import the real `HAOO_PRODUCT` from `src/products/haoo.ts`
- Pure logic under test (`validateQualifyValues`, `buildSubmissionBody`)
- Child components — pages are rendered whole through `ProductPage`
- The filesystem — build-output tests read the real `dist/`

**Always** `afterEach(() => vi.restoreAllMocks())` in any suite that spies or stubs.

## Fixtures and Factories

No `fixtures/` directory. Test data is produced by:

1. **Real production data** imported directly — `HAOO_PRODUCT`, `HAOO_MEASUREMENT`, `HAOO_MEASUREMENT_EVENTS`, `KENYAN_COUNTY_OPTIONS`
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

Time is pinned with a constant: `const TODAY = new Date('2026-08-31T12:00:00.000Z')`.

## Coverage

**Requirements:** No coverage provider is installed and no threshold is enforced. Coverage is enforced structurally instead — suites assert *closed sets* (e.g. "exactly the ten configured event names", "every field name is placed in exactly one group", "every focus indicator in every registered source file") so an unregistered addition fails a test rather than silently going unmeasured.

**Mutation-style assertions:** Several tests are explicitly written to kill a named mutant, e.g. `it('kills a partial-defaulting schema mutant with the invalid-record table', ...)` and `it('kills a forbidden-character stripping mutant', ...)` in `src/test/measurement.test.ts`. Keep this style when hardening logic.

## Test Types

**Unit / logic tests** (`src/test/measurement.test.ts`, `src/test/qualify-data.test.ts`, `src/test/haoo-content.test.ts`)
- Import pure modules and product data directly; no rendering
- Cover parsing, validation, band transitions, endpoint resolution, and data-shape invariants

**Component / integration tests** (`src/test/qualify-form.test.tsx`, `src/test/haoo-page.test.tsx`, `src/test/measurement-page.test.tsx`, `src/test/product-shell-reuse.test.tsx`, `src/test/products-section.test.tsx`)
- Render real components through `ProductPage` with the real product definition
- Assert semantics, accessible names, focus movement, error summaries, and submission flow
- `src/test/measurement-page.test.tsx` renders under `StrictMode` to catch double-invocation bugs in effects

**Source-static tests** (`src/test/focus-contrast.test.ts`)
- Read component source files with `readFileSync`, extract Tailwind focus class strings, resolve the colour tokens, and compute the WCAG 2.2 SC 1.4.11 contrast ratio, gating on the unrounded double at exactly `>= 3`
- Every component that declares a focus indicator must be registered in that file's source list

**Artifact tests** (`src/test/build-output.test.ts`, 595 lines)
- Assert the shipped `dist/` tree: file existence, freshness against newest input mtime, canonical/OG metadata byte-equality, asset references resolving, the brochure PDF matching a pinned SHA-256, no-JS fallback markup, and that no tracking/identity/SDK seams leaked into the bundle
- Requires a fresh `npm run build` first

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
4. Prefer a `describe` per contract and `it.each` for closed sets
5. If the component declares a new focus indicator, register its source file in `src/test/focus-contrast.test.ts`
6. If the change affects shipped output, extend `src/test/build-output.test.ts` and run `npm test` (which rebuilds)

---

*Testing analysis: 2026-09-01*
