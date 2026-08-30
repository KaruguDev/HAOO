---
phase: 02-submit-a-qualified-haoo-enquiry
plan: 07
subsystem: testing
tags: [vitest, typescript, vite-env, formsubmit, accessibility, contracts, wcag]

# Dependency graph
requires:
  - phase: 02-submit-a-qualified-haoo-enquiry
    provides: "Plan 01's resolveQualifyEndpoint, QUALIFY_ENDPOINT_FALLBACK, HAOO_PRODUCT.qualify data block and the QualifyForm.tsx component"
  - phase: 01-discover-and-choose-a-haoo-onboarding-path
    provides: "FOCUS_SOURCES focus-contrast scan and GENERIC_PRODUCT_SOURCES product-generic literal ban"
provides:
  - "`src/test/qualify-data.test.ts` — 37 permanent endpoint and product-data contracts"
  - "A 30-row `resolveQualifyEndpoint` table with an explicit `expectedResolution` per row"
  - "Exact `/ajax/{target}` endpoint-shape contract on `HAOO_PRODUCT.qualify.endpoint`"
  - "`ImportMetaEnv.VITE_HAOO_FORM_ENDPOINT?: string` public build-time typing"
  - "`QualifyForm.tsx` registered in `FOCUS_SOURCES` and `GENERIC_PRODUCT_SOURCES`"
affects: [02-02 field data, 02-03 nav and workflow env injection, 02-04 conditional requiredness, 02-05 confirmation and failure panels, 02-06 disclosure copy]

actuals:
  tokens: 3620
  tasks: 1
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Untrusted build configuration pinned by a table where every row carries an explicit expected resolution, not a shared rejected flag"
    - "New interactive components registered into the inherited focus and product-generic scans in the same plan that pins their data boundary, without widening either allowlist"

key-files:
  created:
    - src/test/qualify-data.test.ts
  modified:
    - src/vite-env.d.ts
    - src/test/focus-contrast.test.ts
    - src/test/product-shell-reuse.test.tsx

key-decisions:
  - "Every table row carries an explicit `expectedResolution` string rather than an `isValid` boolean, so an implementation that returns some other non-fallback destination cannot pass by satisfying a weaker predicate"
  - "The endpoint table was validated against two deliberately weakened resolvers before being committed, so it is provably non-vacuous rather than merely green"
  - "No RED commit was staged for this plan: the resolver under contract was delivered by 02-01, and the plan's own `<action>` states these assertions verify that existing implementation"

patterns-established:
  - "Pattern 1: build-time configuration is treated as untrusted input with a single permanent decision table, and the table is mutation-probed before it is trusted"
  - "Pattern 2: a guard registration and the data contract for the same component land in one plan, ahead of the plans that will edit those same test files"

requirements-completed: [LEAD-04, LEAD-06]

coverage:
  - id: D1
    description: "`HAOO_PRODUCT.qualify.endpoint` is a non-empty absolute `https://formsubmit.co/ajax/{target}` URL with no credentials, query or fragment and exactly one decoded, nonblank, slash-free target segment"
    requirement: LEAD-04
    verification:
      - kind: unit
        ref: "src/test/qualify-data.test.ts#HAOO qualification endpoint > endpoint is an absolute https FormSubmit AJAX address with one usable target"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every unsafe or blank configured value — undefined, empty, whitespace-only, malformed URL, protocol-relative, relative, http, wrong host, lookalike host, wrong path, site root, bare `/ajax`, `/ajax/`, `/ajax//`, `%20`, `%09`, `%2F`, encoded slash inside a target, malformed and truncated percent encoding, extra segment, credentials, query, fragment — resolves to the readable-address fallback"
    requirement: LEAD-04
    verification:
      - kind: unit
        ref: "src/test/qualify-data.test.ts#HAOO qualification endpoint > endpoint resolution: {26 invalid rows}"
        status: pass
      - kind: unit
        ref: "src/test/qualify-data.test.ts#HAOO qualification endpoint > endpoint table distinguishes the route prefix from a usable recipient"
        status: pass
      - kind: unit
        ref: "src/test/qualify-data.test.ts#HAOO qualification endpoint > resolves every configured value to a non-empty https FormSubmit address"
        status: pass
    human_judgment: false
  - id: D3
    description: "Valid readable-address and single-segment random-token endpoints are outer-trimmed and preserved byte-for-byte, so a legitimately configured destination is never rewritten or percent-encoded"
    requirement: LEAD-04
    verification:
      - kind: unit
        ref: "src/test/qualify-data.test.ts#HAOO qualification endpoint > endpoint resolution: {4 valid rows}"
        status: pass
      - kind: unit
        ref: "src/test/qualify-data.test.ts#HAOO qualification endpoint > endpoint fallback is itself a usable readable-address destination"
        status: pass
    human_judgment: false
  - id: D4
    description: "`VITE_HAOO_FORM_ENDPOINT` has an explicit optional public `ImportMetaEnv` type, the `vite/client` reference survives, and the value is documented as obfuscation rather than secrecy"
    requirement: LEAD-04
    verification:
      - kind: other
        ref: "grep -c 'VITE_HAOO_FORM_ENDPOINT?: string' src/vite-env.d.ts && grep -c 'reference types=\"vite/client\"' src/vite-env.d.ts"
        status: pass
      - kind: other
        ref: "npm run typecheck (tsc --noEmit -p tsconfig.app.json)"
        status: pass
    human_judgment: false
  - id: D5
    description: "`QualifyForm.tsx` is scanned by the Phase 1 focus-contrast gate and its `ring-[#4054C6]` / default-white-offset pairing clears the WCAG 2.2 SC 1.4.11 3:1 threshold without a new named ring token"
    requirement: LEAD-06
    verification:
      - kind: unit
        ref: "src/test/focus-contrast.test.ts#Phase 1 focus indicator contrast contracts > keeps every focus indicator in src/components/QualifyForm.tsx visible against the surface it renders on"
        status: pass
    human_judgment: false
  - id: D6
    description: "`QualifyForm.tsx` is scanned by the case-insensitive product-generic literal ban, so the tracer component cannot acquire a HAOO literal without failing the suite"
    requirement: LEAD-06
    verification:
      - kind: unit
        ref: "src/test/product-shell-reuse.test.tsx#Phase 1 product shell reuse contracts > rejects product-name literals in product-generic executable source"
        status: pass
    human_judgment: false
  - id: D7
    description: "The tracer's subject and source identities are pinned, and its field names, labels and email labels are non-empty and unique with every field placed in exactly one group"
    requirement: LEAD-04
    verification:
      - kind: unit
        ref: "src/test/qualify-data.test.ts#HAOO qualification product data > retains the approved subject and source identities"
        status: pass
      - kind: unit
        ref: "src/test/qualify-data.test.ts#HAOO qualification product data > declares non-empty unique field names and email labels"
        status: pass
      - kind: unit
        ref: "src/test/qualify-data.test.ts#HAOO qualification product data > groups only field names that exist, with no field left unplaced or duplicated"
        status: pass
    human_judgment: false

# Metrics
duration: 6 min
completed: 2026-08-30
status: complete
---

# Phase 02 Plan 07: Endpoint boundary and inherited guard registration Summary

**A 30-row decision table that pins every unsafe build-time endpoint value to the readable FormSubmit fallback, an exact `/ajax/{target}` shape contract on the shipped endpoint, optional public `ImportMetaEnv` typing for `VITE_HAOO_FORM_ENDPOINT`, and `QualifyForm.tsx` registered in both inherited Phase 1 source scans.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-08-30T07:52:00Z
- **Completed:** 2026-08-30T07:58:00Z
- **Tasks:** 1
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- **Made the request destination a decided question rather than an assumed one.** `src/test/qualify-data.test.ts` carries one table of 30 rows, each with an explicit `expectedResolution`, covering undefined, empty, whitespace-only, malformed URL, protocol-relative, relative, `http:`, wrong host, lookalike subdomain, wrong path, site root, bare `/ajax`, `/ajax/`, `/ajax//`, `%20`, `%09`, `%2F`, an encoded slash inside a target, malformed and truncated percent encoding, an extra path segment, full and username-only credentials, a query string and a fragment — all resolving to `https://formsubmit.co/ajax/info@haoo.online` — plus four accepted rows proving trimming and byte-for-byte preservation of both a readable address and a random token.
- **Proved the table is non-vacuous before trusting it.** Two deliberately weakened resolvers were probed against the invalid rows: a nullish-only fallback is killed by 12/12 of the representative rows, and a `startsWith('/ajax/')` + any-https-host resolver is killed by 10/12. A green table that no weaker implementation could fail would have been decoration; this one has teeth.
- **Pinned the shipped endpoint's shape, not just the resolver's behaviour.** The `endpoint` test parses `HAOO_PRODUCT.qualify.endpoint` and asserts `https:` (security domain V9, threat T-02-01), host `formsubmit.co`, empty username/password/search/hash, a pathname that splits to exactly `['', 'ajax', target]`, and a target that decodes without throwing, is nonblank after `trim()`, and contains no slash.
- **Closed both inherited Phase 1 guards on the new component without widening either.** `QualifyForm.tsx` joins `FOCUS_SOURCES` (its `focus-visible:ring-[#4054C6] focus-visible:ring-offset-2` pairing computes 6.36:1 against the default white offset, over the 3:1 WCAG 2.2 SC 1.4.11 gate) and `GENERIC_PRODUCT_SOURCES` (no case-insensitive HAOO literal). `RING_COLOR_TOKENS` still holds only `white` and `blue-700`; no exception was added to the literal ban; the synthetic ZENITH render is untouched.
- **Typed the endpoint variable honestly.** `src/vite-env.d.ts` now declares `ImportMetaEnv.VITE_HAOO_FORM_ENDPOINT?: string` alongside the retained `vite/client` reference, with a comment that states plainly it is obfuscation of the mailbox address and never a secret (RESEARCH Pitfall 6).
- Suite grew from 82 to 120 passing tests. `npm test`, `npm run typecheck` and `npm run lint` all exit 0.

## Task Commits

1. **Task 1 (tests + registrations): pin endpoint resolution and register QualifyForm in inherited guards** — `315510e` (test)
2. **Task 1 (typing): type VITE_HAOO_FORM_ENDPOINT as optional public build config** — `4f8dcc3` (chore)

_Note: this plan's single task carries two commits — the contract file and guard registrations, then the build-time typing._

## Files Created/Modified

- `src/test/qualify-data.test.ts` — **created.** 37 tests in two suites. `HAOO qualification endpoint` holds the shape contract, the 30-row `it.each` resolution table, the fallback self-consistency check, an explicit route-prefix-is-not-a-recipient assertion, and a sweep proving every row of the table — valid or not — resolves to a non-empty `https://formsubmit.co` address. `HAOO qualification product data` pins the subject and source-note identities and asserts non-empty unique field names, labels and email labels with every field placed in exactly one group.
- `src/vite-env.d.ts` — added `ImportMetaEnv` with `readonly VITE_HAOO_FORM_ENDPOINT?: string` and `ImportMeta` with `readonly env: ImportMetaEnv`, using Vite's own documented declaration-merging pattern. The triple-slash `vite/client` reference is retained.
- `src/test/focus-contrast.test.ts` — added `src/components/QualifyForm.tsx` to `FOCUS_SOURCES` and restated the list's doc comment so it describes the closed-registration rule rather than a Phase 1 snapshot. `RING_COLOR_TOKENS` untouched.
- `src/test/product-shell-reuse.test.tsx` — added `src/components/QualifyForm.tsx` to `GENERIC_PRODUCT_SOURCES`, beside the other component entries. The synthetic ZENITH product and every existing assertion are unchanged.

## Decisions Made

1. **Explicit `expectedResolution` per row, not an `isValid` flag.** A boolean table would let a future resolver return some third string for a rejected input and still pass the "was rejected" half of the assertion. Naming the exact expected output for all 30 rows means the table is a total function specification, and the whitespace-padded rows double as the trimming contract.
2. **The table was mutation-probed before it was trusted.** Because the resolver already existed, a green first run proves nothing on its own. Two weakened implementations were run against the invalid rows in a throwaway probe (not committed) and both were killed. This is the evidence that the plan's explicit prohibitions — no nullish-only fallback, no arbitrary https host, no `startsWith('/ajax/')` — are actually enforced by the table rather than merely stated in prose.
3. **Two extra invalid rows beyond the plan's enumeration.** A lookalike subdomain (`formsubmit.co.evil.example`) and a username-only credential (`https://user@formsubmit.co/...`) were added. Both are natural members of the wrong-host and credentials classes the plan named, both are realistic misconfigurations, and neither widens the contract's surface — they narrow it.
4. **The query-string row uses `?_cc=attacker@evil.example`.** The row would pass with any query value, but making it the exact parameter that threat T-02-04 exists to keep unreachable states in the test file itself why queries are rejected.
5. **The `FOCUS_SOURCES` doc comment was restated.** Leaving "Every Phase 1 product source that declares a focus indicator" above a list containing a Phase 2 component would have made the comment false. The replacement states the rule the list actually encodes — register the component, do not widen `RING_COLOR_TOKENS` — which is the instruction the next plan touching this file needs.

## TDD Gate Compliance

This task is marked `tdd="true"`, and the RED gate could not be honoured literally. The behaviour under contract — `resolveQualifyEndpoint`, `QUALIFY_ENDPOINT_FALLBACK` and the `HAOO_PRODUCT.qualify` data block — was delivered by plan 02-01 (commit `ae61aed`). The plan's own `<action>` states this directly: *"These assertions verify the resolver delivered in 02-01."* Writing a failing test first would have required deleting shipped, verified production code.

Per the fail-fast rule ("if a test passes unexpectedly during RED, investigate before proceeding"), the investigation was performed and is recorded above as Decision 2: rather than accept a green run at face value, the table was executed against two weakened resolvers to confirm it discriminates. The commit sequence is therefore `test` → `chore` with no `feat`, which is correct for a plan whose deliverable is contracts over existing behaviour plus a type declaration. The plan frontmatter is `type: execute`, not `type: tdd`, so the plan-level RED/GREEN commit-sequence gate does not apply.

## Deviations from Plan

None — plan executed exactly as written. No deviation rule was triggered: no bug was found in 02-01's resolver, no missing critical functionality was discovered, nothing blocked the task, and no architectural change was required.

Two clarifications resolved inside the plan's own latitude are recorded above as Decisions 3 and 5. Decision 3 adds two rows within classes the plan already enumerated; Decision 5 corrects a comment that the plan's own edit would otherwise have falsified. Neither changed scope, files, or the contract surface.

**Total deviations:** 0
**Impact on plan:** None.

## Issues Encountered

None. All three verification suites, `typecheck` and `lint` passed on the first run after each edit. The `ImportMetaEnv` declaration merged cleanly with `vite/client` (whose own interface carries a `[key: string]: any` index signature), and a throwaway narrowing probe confirmed `import.meta.env.VITE_HAOO_FORM_ENDPOINT` types as `string | undefined` rather than `any` — so the optional public typing is load-bearing, not decorative. The probe file was removed before committing.

## Known Stubs

None. Every assertion in `qualify-data.test.ts` executes against shipped code, and no test is skipped, todo'd or conditionally bypassed.

## Threat Flags

None. This plan introduces no runtime code and therefore no new security-relevant surface. It converts three registered threats into executable contracts: T-02-01 (cleartext PII) via the `https:` assertion, T-02-02 (endpoint denial of service) via the 26 invalid rows, and T-02-27 (guard tampering) via the two source-scan registrations. T-02-SC holds — no dependency was added.

## Verification Results

| Check | Result |
|---|---|
| `npm run test:unit -- --run qualify-data + focus-contrast + product-shell-reuse` | PASS — 51 tests across 3 files |
| `npm test` (build then full suite) | PASS — 120 passed (8 files), up from 82 |
| `npm run typecheck` | PASS — exit 0 |
| `npm run lint` | PASS — exit 0 (4 pre-existing `react-refresh` warnings from 02-01, unchanged) |
| `grep -c 'reference types="vite/client"' src/vite-env.d.ts` | `1` |
| `grep -c 'VITE_HAOO_FORM_ENDPOINT?: string' src/vite-env.d.ts` | `1` |
| Narrowing probe: `const bad: number = import.meta.env.VITE_HAOO_FORM_ENDPOINT` | Correctly errors `TS2322: Type 'string \| undefined' is not assignable to type 'number'` |
| `grep -c 'src/components/QualifyForm.tsx' src/test/focus-contrast.test.ts` | `1` |
| `grep -c 'src/components/QualifyForm.tsx' src/test/product-shell-reuse.test.tsx` | `1` |
| `RING_COLOR_TOKENS` contents | Unchanged — `white`, `blue-700` only |
| Mutation probe: nullish-only resolver vs invalid rows | Killed on 12/12 representative rows |
| Mutation probe: `startsWith('/ajax/')` + any-https-host resolver | Killed on 10/12 representative rows |
| Files touched vs the four declared in frontmatter | Exactly 4 — no production tracer file modified |

All six task `<acceptance_criteria>` were executed and passed.

## User Setup Required

None for this plan. `VITE_HAOO_FORM_ENDPOINT` remains optional by construction — the typing declares it optional and the table proves an absent, blank or unsafe value degrades to a working readable-address destination. Plan 02-03 still owns injecting the variable into deployed builds and documenting it in the maintainer docs as a repository *variable*, not a secret.

## Next Phase Readiness

Ready. This plan deliberately ran ahead of the plans that will edit the same two guard files, so:

- **02-02** adds the remaining fields and the 47-county list as `qualify.fields` / `qualify.groups` data. The uniqueness and group-completeness assertions in `qualify-data.test.ts` will hold that data to the same standard automatically — a duplicated field name or email label, or a field left out of every group, now fails the suite.
- **02-03** injects `VITE_HAOO_FORM_ENDPOINT` into the deploy workflow. The type exists, the fallback is proven, and the table documents exactly which values a misconfigured variable may take without changing the destination.
- **02-04**, **02-05** and **02-06** can extend `focus-contrast.test.ts` and `product-shell-reuse.test.tsx` knowing `QualifyForm.tsx` is already registered in both, so any new panel file is the only addition required.

**Carried concerns (unchanged, none introduced by this plan):** HAOO mailbox ownership and FormSubmit activation are still required for the Phase 5 live-delivery check (02-01 coverage D7); privacy/legal approval of the collection notice is still outstanding; and the LEAD-06 spam-sufficiency assumption remains a flagged product decision (02-01 coverage D8).

## Self-Check: PASSED

- `src/test/qualify-data.test.ts` — FOUND
- `src/vite-env.d.ts` — FOUND
- `src/test/focus-contrast.test.ts` — FOUND
- `src/test/product-shell-reuse.test.tsx` — FOUND
- Commit `315510e` — FOUND in `git log --oneline --all`
- Commit `4f8dcc3` — FOUND in `git log --oneline --all`
- No files deleted by either commit (`git diff --diff-filter=D HEAD~2 HEAD` empty)
- No untracked source files left behind (throwaway `src/__probe.ts` removed before commit)

---
*Phase: 02-submit-a-qualified-haoo-enquiry*
*Completed: 2026-08-30*
