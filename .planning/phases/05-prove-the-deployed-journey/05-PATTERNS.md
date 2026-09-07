# Phase 5: Prove the Deployed Journey - Pattern Map

**Mapped:** 2026-09-07
**Files analyzed:** 20 (14 new, 6 modified)
**Analogs found:** 14 / 20

> **Repository note (D-01/D-08).** Every code file below lands in `KaruguDev/HAOO`
> (`/home/paul/Documents/Vibe Coding Projects/HAOO`). Nothing is installed in ZERO-PAPER HUB.
> Paths in the tables are relative to the HAOO repository root unless prefixed `ZPH:`.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `playwright.config.ts` (NEW) | config | request-response | `vitest.config.ts` | role-match |
| `tsconfig.e2e.json` (NEW) | config | — | `tsconfig.node.json` | exact |
| `tsconfig.json` (EDIT) | config | — | itself (references array) | exact |
| `package.json` (EDIT) | config | — | itself (`scripts` block) | exact |
| `vitest.config.ts` (EDIT — add `e2e/**` to `exclude`) | config | — | itself (existing `exclude` + reason comment) | exact |
| `e2e/fixtures/surfaces.ts` (NEW) | fixture / closed list | — | `src/test/focus-contrast.test.ts:27-51` (`FOCUS_SOURCES`) | exact |
| `e2e/fixtures/primary-actions.ts` (NEW) | fixture / closed list | — | `src/test/focus-contrast.test.ts:27-51` | exact |
| `e2e/fixtures/axe.ts` (NEW) | fixture / factory | transform | `src/test/fixtures/posthog-capture-contract.ts` | role-match |
| `e2e/viewport.e2e.ts` (NEW) | test | browser measurement | `src/test/focus-contrast.test.ts` (measure-then-assert) | partial (no browser analog exists) |
| `e2e/keyboard.e2e.ts` (NEW) | test | browser measurement | same | partial |
| `e2e/semantics.e2e.ts` (NEW) | test | browser measurement | same | partial |
| `e2e/zoom-motion.e2e.ts` (NEW) | test | browser measurement | same | partial |
| `e2e/recovery.e2e.ts` (NEW) | test | request-response (APIRequestContext) | `src/test/build-output.test.ts` (document contract) | partial |
| `e2e/form-states.e2e.ts` (NEW) | test | request-response | `src/test/qualify-form.test.tsx` | role-match |
| `.github/workflows/verify-split.yml` (NEW) | CI config | batch | `.github/workflows/deploy.yml` | exact |
| `scripts/assert-phase1-red.mjs` (MODIFY/RETIRE — D-16) | script | batch | itself + `scripts/verify-phase4-coverage.mjs:310-327` | exact |
| `src/components/ProductHeader.tsx:33` (EDIT — F1) | component | — | itself / `ProductPage.tsx:308` | exact |
| `src/pages/ProductPage.tsx:308` (EDIT — F1) | component | — | `ProductHeader.tsx:33` | exact |
| `src/test/haoo-page.test.tsx:52` (EDIT — F1 guard) | test | — | itself (`:403` count assertion stays) | exact |
| `src/test/focus-contrast.test.ts` `FOCUS_SOURCES` (EDIT — F3, 6→7) | test / closed list | — | itself | exact |
| `.planning/phases/05-*/05-EVIDENCE*.md` (NEW) | evidence doc | — | `.planning/phases/04.2-*/04.2-VERIFICATION.md` §Human Verification Outcome | exact |
| `ZPH: .planning/` (DELETE — D-02) | planning tree | — | `scripts/verify-tree-disjointness.mjs` (walk-then-act) | role-match |

---

## Pattern Assignments

### `e2e/fixtures/surfaces.ts`, `e2e/fixtures/primary-actions.ts` (fixture, closed list)

**Analog:** `src/test/focus-contrast.test.ts` — this is the house closed-list pattern D-09 names
explicitly.

**Closed-list pattern** (`src/test/focus-contrast.test.ts:30-51`) — note the shape to copy: a
doc-comment stating *why the list is closed and how an entry is admitted*, `as const`, and a
narrowing history recorded in the comment rather than by silent deletion:

```ts
/**
 * Every product source that declares a focus indicator. Phase 1 established the list;
 * Phase 2 keeps it closed by registering each new interactive component here rather
 * than by widening RING_COLOR_TOKENS, so a focus style that is never measured cannot
 * ship. The contract asserts `pairs.length > 0`, so a file listed here with no focus
 * utility fails loudly.
 *
 * NARROWED from seven entries to six by plan `04.2-02`, which split ...
 */
export const FOCUS_SOURCES = [
  'src/pages/ProductPage.tsx',
  ...
] as const;
```

**Vacuity guard to copy:** the `pairs.length > 0` assertion. Every closed list in this phase (S1–S5,
P1–P13, the five viewports) needs the same "a listed entry that yields nothing fails loudly" guard —
that is the discipline that keeps the evidence from passing vacuously (UI-SPEC F2 / RESEARCH Pitfall 3).

**Named-constant pattern** (`focus-contrast.test.ts:6-12`): exported constants carry the standard
they encode in the comment (`MIN_FOCUS_CONTRAST` cites WCAG 2.2 SC 1.4.11 and states "no epsilon, no
rounding before the comparison"). Do the same for the viewport list (cite D-09) and the axe tag list.

---

### `e2e/fixtures/axe.ts` (fixture, factory)

**Analog:** `src/test/fixtures/posthog-capture-contract.ts` — the repo's only "vendor-boundary
fixture" module.

**Imports/typing pattern** (`src/test/fixtures/posthog-capture-contract.ts:1-25`):

```ts
/**
 * The payload `before_send` receives and returns.
 *
 * Transcribed from the vendor's published `CaptureResult`. Only the three members the
 * property chokepoint actually reads are declared: a fixture that mirrored every optional
 * member would be restating the vendor's type file rather than pinning the agreement this
 * project depends on.
 */
export interface VendorCaptureResult { ... }
```

Apply the same rule to `AxeBuilder`: declare only the surface used, and state in the comment why the
vendor type is not re-exported wholesale.

**Factory body:** use RESEARCH § Pattern 4 verbatim (`withTags` + `withRules(['heading-order'])`,
`.include('#products')` for S3, `disableRules` for S4) — and honour the RESEARCH caveat: never call
`.options()` and `.withTags()` on the same builder; smoke-run the combination first.

---

### `playwright.config.ts` (config, request-response)

**Analog:** `vitest.config.ts` (whole file, 18 lines).

**Config pattern to copy — the comment carries the incident that caused the setting:**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /**
     * Vitest's default `exclude` does not list dot-directories, so agent-tool worktrees
     * under `.claude/` were discovered and run: a full run executed ten frozen duplicate
     * suites from an older revision alongside the current ones, inflating every quoted
     * test count and making an unrelated frozen copy able to fail `npm test`.
     */
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**', '.gsd/**'],
    ...
  },
});
```

**Apply directly:** `testMatch: '**/*.e2e.ts'` is mandatory (RESEARCH Pitfall 6) and must carry a
comment of exactly this shape — naming the measured collision (Vitest collects `e2e/**/*.spec.ts`;
Playwright's own default `testMatch` would then match nothing). Config body per RESEARCH § Pattern 1.

**Companion edit (same commit):** add `'e2e/**'` to the `exclude` array above, extending the existing
array rather than replacing it.

---

### `tsconfig.e2e.json` (config) + `tsconfig.json` (edit)

**Analog:** `tsconfig.node.json` — the existing second project, structurally identical to what the
third one must be.

**Copy this whole file and change only `include` / `lib` / `types`:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts", "config"]
}
```

**Reference pattern** (`tsconfig.json`, whole file — append the third entry):

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

**`package.json` script pattern** (`scripts.typecheck`, current value — extend with a third `-p`,
same `&&` chaining):

```
"typecheck": "tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json"
```

New scripts follow the existing naming convention already in `scripts` (`test:unit`,
`verify:coverage`, `verify:disjoint`, `test:phase1:red`): use `test:e2e` / `test:e2e:live`.

---

### `.github/workflows/verify-split.yml` (CI config, batch)

**Analog:** `.github/workflows/deploy.yml` — the repository's only workflow, and a `shared-scaffold`
entry, so the new file must match its idiom rather than a generic template.

**Header + job skeleton** (`.github/workflows/deploy.yml:1-40`):

```yaml
name: Deploy HAOO

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Set up Node
        uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci
```

Pinned action major versions (`checkout@v6`, `setup-node@v6`) and `node-version: 22` (matching
`engines.node: ">=22.18.0"`) are the house values — reuse, do not invent.

**Comment density is a house pattern, not decoration** (`deploy.yml:41-60` and `:63-90`): every
non-obvious step carries a multi-paragraph comment naming the plan that introduced it and what a
reader could otherwise check and find wrong. The sibling-checkout step (D-17) needs exactly this:
why `../ZERO-PAPERHUB` and not a path input, and what happens to SPLT-01 if the checkout fails.

**Fallback discipline:** D-17 requires that an infeasible cross-repo checkout be *recorded* as
"spot-checked, not continuously enforced" — do not let the job silently `continue-on-error`.

---

### `scripts/assert-phase1-red.mjs` (script, batch — D-16)

**Analog:** itself, plus `scripts/verify-phase4-coverage.mjs`.

**The withdraw-with-a-named-successor pattern is already written into this very file's header
(`scripts/assert-phase1-red.mjs:3-13`) — copy its shape for the D-16 disposal:**

```js
/**
 * NARROWED from four suites and four markers to three by plan `04.2-02`.
 *
 * `src/test/products-section.test.tsx` and its `[phase1-red:products]` marker asserted the
 * parent site's product grid, which is not in this repository after the split. The
 * ZERO-PAPER HUB successor is named: plan `04.2-06` gives that repository its own
 * single-suite, single-marker version of this gate carrying exactly the removed pair.
 * Removed per entry — the infrastructure-failure rejection list, the non-zero-exit
 * requirement and the marker check are untouched, so the remaining three are gated as
 * strictly as the four were.
 */
```

Whatever D-16 chooses (retire or invert), the record must name: what was removed, which plan removed
it, what the successor is, and which guarantees are byte-unchanged.

**CLI/exit-code pattern** (`scripts/verify-phase4-coverage.mjs:310-327`) — the shape a *successor*
script must use: positional arg, usage error, import guard so a test can import it, exit-code
**assignment** (never `process.exit`), and a success line printing counts rather than the word
"passed":

```js
async function main() {
  const coveragePath = process.argv[2];
  if (!coveragePath) {
    throw new Error('Usage: node scripts/verify-phase4-coverage.mjs .planning/...');
  }
  const result = auditPhase4Coverage(await readFile(coveragePath, 'utf8'));
  console.log(`Phase 4 coverage audit passed: ${result.requiredRows} required capabilities across ${result.tables} tables.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
```

Note `assert-phase1-red.mjs` itself uses bare `process.exit(1)`; the newer
`verify-phase4-coverage.mjs` / `verify-tree-disjointness.mjs` pattern (exit-code assignment) is the
current one and is what its own header says it copied. **Prefer the newer.**

---

### `e2e/recovery.e2e.ts` and the live-document specs (test, request-response)

**Analog:** `src/test/build-output.test.ts` — the existing document-contract suite. It already owns
the *built-tree* half of the same equality discipline the live specs extend to deployed bytes.

**Constant-block pattern** (`src/test/build-output.test.ts:29-55`): every asserted string is a named
top-level constant with the decision that fixed it in the comment:

```ts
const ROOT = resolve(import.meta.dirname, '../..');
const PRODUCT_TITLE = 'HAOO Property Management | ZERO-PAPER HUB';
const PRODUCT_URL = 'https://www.haoo.online/';
const PDF_SHA256 = '38d5ad8e7497c65c4fa2d374e7ed5e8d81ab79f3b25d1e0daa73321d45b9e7a6';
const PDF_ALTERNATE_LINK =
  '<link rel="alternate" type="application/pdf" href="/brochure/HAOO-Marketing-Brochure.pdf" title="HAOO Marketing Brochure (PDF)" />';
```

Reuse `PRODUCT_URL`, `PDF_ALTERNATE_LINK` and the brochure path values rather than re-typing literals
in the e2e specs — a divergence between the built-tree assertion and the live assertion is exactly the
class of defect this phase exists to catch.

**Reachability probe:** RESEARCH § Pattern 3 (`request.get(url, { maxRedirects: 0, failOnStatusCode:
false })`), recording `status` and `location` as data before asserting.

---

### F1 fix — `src/components/ProductHeader.tsx:33`, `src/pages/ProductPage.tsx:308`, `src/test/haoo-page.test.tsx:52`

**No analog needed — this is a two-file-plus-test edit fully specified by UI-SPEC F1.**

Pattern that matters: **the guarding test changes in the same commit as the source.** `haoo-page.test.tsx:52`
pins `href === '/'` and is green *because* the link is wrong; `:403` asserts the count is 2 and must
not be touched. An executor who edits only the components will see a red suite and revert a correct fix.

---

### F3 fix — `src/test/focus-contrast.test.ts` `FOCUS_SOURCES`

One line added to the array at lines 43-50 (6 → 7 entries), plus a comment entry in the list's
doc-comment in the same NARROWED/WIDENED idiom quoted above. `MIN_FOCUS_CONTRAST`,
`RING_COLOR_TOKENS`, `DEFAULT_RING_OFFSET`, the extractor and the `pairs.length > 0` guard stay
byte-unchanged.

---

### Evidence documents (`.planning/phases/05-*/`)

**Analog:** `.planning/phases/04.2-.../04.2-VERIFICATION.md` §"Human Verification Outcome".

**Pattern:** record *measured values*, not pass marks — 04.2 recorded four zeros alongside six
non-zero counts precisely because that distinguishes what happened from what did not. D-13 inherits
this: the tag string, the received timestamp and the destination folder verbatim, with spam recorded
**as spam**. D-11 requires two separate records (activation, then delivery), in order.

**Corollary from RESEARCH § Runtime State:** re-measure preconditions at execution time, never cite a
recorded number (the D37 superset walk before the ZPH `.planning/` deletion; `dig +short MX
haoo.online` before any mail work).

---

## Shared Patterns

### Closed lists with a per-entry reason
**Source:** `src/test/focus-contrast.test.ts:30-51`; `shared-scaffold.txt` (26 entries)
**Apply to:** `e2e/fixtures/surfaces.ts`, `e2e/fixtures/primary-actions.ts`, the D-09 viewport array,
the axe tag list, the S4 `disableRules` table.
Every list is `as const`, carries a doc-comment stating how an entry is admitted, and is backed by a
vacuity guard that fails when a listed entry yields nothing.

### Withdraw with a named successor, never delete silently
**Source:** `scripts/assert-phase1-red.mjs:3-13`; `src/test/focus-contrast.test.ts:33-42`
**Apply to:** D-16's `test:phase1:red` disposal, the ZPH `.planning/` removal (D-02), any spec or
allowlist entry this phase retires.

### Comment carries the incident, not the intent
**Source:** `vitest.config.ts:7-12`; `.github/workflows/deploy.yml:41-60`;
`scripts/verify-tree-disjointness.mjs:1-30`
**Apply to:** `playwright.config.ts` (`testMatch`), `tsconfig.e2e.json` (Pitfall 5),
`verify-split.yml` (sibling checkout). State what went wrong or what a reader could otherwise get
wrong — not "for clarity".

### Exit-code assignment + counts in the success line
**Source:** `scripts/verify-phase4-coverage.mjs:310-327`; `scripts/verify-tree-disjointness.mjs:18-22`
("an EXIT-CODE ASSIGNMENT rather than a process-exit call, and a success line that prints COUNTS
rather than the word 'passed'")
**Apply to:** any new `scripts/*.mjs` and the D-16 successor.

### Relocatable scripts take positional paths
**Source:** `scripts/verify-tree-disjointness.mjs:10-16` — both checkouts are REQUIRED positional
arguments so the script is byte-identical in both repos.
**Apply to:** the D-17 CI job (pass the sibling path, do not hardcode a CI-only variant) and any
evidence-emitting script.

### Record measured values, not pass marks
**Source:** `.planning/phases/04.2-.../04.2-VERIFICATION.md` §Human Verification Outcome
**Apply to:** every Phase 5 evidence file; D-13 mail record; the axe JSON reporter output.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `e2e/viewport.e2e.ts` | test | browser measurement | No browser-based test exists in either repo. Both suites are jsdom + vitest only (CONTEXT § Reusable Assets). Use RESEARCH § Code Example 2 and UI-SPEC VC-1..VC-3 |
| `e2e/keyboard.e2e.ts` | test | browser measurement | Same. Use RESEARCH § Code Example 3 and UI-SPEC KF-0..KF-5; the *ratio* stays owned by `focus-contrast.test.ts` (KF-0) |
| `e2e/semantics.e2e.ts` | test | browser measurement | Same. Heading order must be spec-asserted (RESEARCH Pitfall 1 — `heading-order` is `best-practice`-tagged) |
| `e2e/zoom-motion.e2e.ts` | test | browser measurement | Same. Label ZM-1 as a 200% / SC 1.4.4 measurement, not SC 1.4.10 (Pitfall 2) |
| `.github/workflows/verify-split.yml` sibling-checkout step | CI config | batch | `deploy.yml` supplies the skeleton but no cross-repo checkout precedent exists. Use RESEARCH § Code Example 6 |
| Mail-chain evidence (LEAD-07) | human procedure | out-of-band | No code analog; observed by DNS, a third party and a human mailbox. D-10/D-11/D-12/D-13 govern |

---

## Metadata

**Analog search scope:** `HAOO/src/test/`, `HAOO/src/test/fixtures/`, `HAOO/scripts/`,
`HAOO/.github/workflows/`, `HAOO/config/`, HAOO root config files;
`ZERO-PAPERHUB/.planning/phases/05-prove-the-deployed-journey/`
**Files scanned:** 21 (10 read in full or in targeted ranges)
**Pattern extraction date:** 2026-09-07
