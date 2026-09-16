/**
 * verify-tree-disjointness.mjs — turns SPLT-01 from a sentence into a command with
 * numbers in its output.
 *
 * SPLT-01: "HAOO builds, tests, and deploys from a repository containing no ZERO-PAPER
 * HUB source, and ZERO-PAPER HUB builds and deploys containing no HAOO source, with
 * neither suite reading a file the other owns."
 *
 * Usage:
 *   node scripts/verify-tree-disjointness.mjs <checkout-a> <checkout-b> [allowlist]
 *
 * Both checkout arguments are REQUIRED and positional, which is what makes this auditor
 * relocatable: it is byte-identical in `KaruguDev/ZERO-PAPERHUB` and `KaruguDev/HAOO`,
 * and either copy audits the same pair. The third argument is optional and names the
 * shared-scaffold allowlist; it defaults to `shared-scaffold.txt` beside THIS script's
 * own repository root.
 *
 * CLI shape copied wholesale from `scripts/verify-phase4-coverage.mjs`: a positional
 * path, a usage error, an import guard so the module stays importable by a test without
 * running its main routine, an EXIT-CODE ASSIGNMENT rather than a process-exit call, and
 * a success line that prints COUNTS rather than the word "passed".
 *
 * WHY THE PLANNING DIRECTORY IS EXCLUDED FROM EVERY COMPARISON BELOW
 * SPLT-01 is a claim about what each repository BUILDS AND SHIPS. The planning record is
 * neither built nor shipped, and it is deliberately duplicated across both checkouts —
 * `.planning/phases/04.1-.../COVERAGE.md` is byte-identical on both sides by design
 * (measured by plan 04.2-05). Including it would drown the real signal in hundreds of
 * documentation paths. The planning record's single-home rule is a DIFFERENT decision and
 * is verified separately, by plan 04.2-09.
 */

import { spawnSync } from 'node:child_process';
import { accessSync, constants, readFileSync } from 'node:fs';
import { delimiter, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

/** This script lives at `<repo>/scripts/`, so its repository root is one level up. */
export const SCRIPT_REPO_ROOT = resolve(SCRIPT_DIR, '..');

/** The allowlist beside this script's own repository root. See the file's own header. */
export const DEFAULT_ALLOWLIST_PATH = resolve(SCRIPT_REPO_ROOT, 'shared-scaffold.txt');

/**
 * Excluded from the intersection AND from both positive halves. See the header comment
 * for why: a claim about what is built and shipped, and the planning record is neither.
 */
export const EXCLUDED_PREFIXES = ['.planning/'];

/**
 * The explicit form of the order `Array.prototype.sort()` already applies to strings: a
 * comparison by UTF-16 code unit. Every list sorted in this file holds repository-relative
 * paths, and that order is the intended one — it is what makes a run's output stable, so a
 * run diffs against the previous run rather than reshuffling. Naming the comparator instead
 * of omitting it leaves no reader, and no static analyser, to guess whether the default
 * order was chosen or forgotten.
 */
function byCodeUnit(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * GROUND A'S IDENTITY SUB-LIST — the entries that must be BYTE-IDENTICAL on both sides.
 *
 * Ground A is "owned by the repository rather than either half", which is NOT the same as
 * "the same bytes". Most of it differs per side on purpose: `package.json` carries each
 * repository's own scripts, `CNAME` names each host, and `scripts/assert-phase1-contracts.mjs`
 * is narrowed per side to its own suites and markers. Exactly two entries carry a stronger
 * ratification, quoted from `shared-scaffold.txt`:
 *
 *   shared-scaffold.txt              "this list itself, which MUST be byte-identical on
 *                                     both sides"
 *   scripts/verify-tree-disjointness.mjs
 *                                    "the disjointness auditor, which MUST be byte-identical
 *                                     on both sides so neither repository can drift into a
 *                                     private definition of separation"
 *
 * WHY THE SET IS HERE AND NOT A THIRD `# @ground:`. `shared-scaffold.txt` is a ratified
 * document — twenty-eight entries on two grounds, with its source of truth in the split
 * contract in the HAOO planning record — and its own header says the two-ground distinction
 * is load-bearing and must not be collapsed. Adding a ground would be an amendment to that
 * document and its source, which is a decision for the owner, not a repair to a check. So
 * the set lives with the ASSERTION instead. The cost of that split is that this list and
 * the allowlist could drift apart; `auditByteIdentity` closes it by refusing any entry here
 * that is not also an allowlist entry.
 *
 * WHY THIS EXISTS AT ALL. The auditor asserted, per Ground B entry, that two copies had NOT
 * converged — and asserted nothing about Ground A at all. A change applied to the auditor in
 * ONE repository therefore passed every check while the two definitions of separation drifted
 * apart, which is the precise failure the second entry above was ratified to prevent.
 */
export const BYTE_IDENTICAL_PATHS = [
  'scripts/verify-tree-disjointness.mjs',
  'shared-scaffold.txt',
];

/**
 * The product name, as a case-insensitive content probe. Applied to COMMENT-STRIPPED
 * content — see `stripComments`.
 */
export const PRODUCT_NAME_PATTERN = /haoo/iu;

/**
 * The home-page symbols no HAOO source may name. The ZERO-PAPER HUB home page owns all
 * three; a HAOO source naming one would mean the home page followed the product across.
 */
export const HOME_PAGE_SYMBOLS = ['HomePage', 'downloadCompanyProfile', 'NAV_LINKS'];

/**
 * The mirror of `HOME_PAGE_SYMBOLS`, on the ZERO-PAPER HUB side. Symbols that identify a
 * file as HAOO PRODUCT SOURCE regardless of whether it happens to spell the product's
 * name — the HAOO product definition, its page, its five product components and their
 * types, its qualification helpers, and its measurement SDK.
 *
 * WHY THE NAME PROBE ALONE IS NOT ENOUGH. `src/components/BrochurePanel.tsx` in the HAOO
 * repository contains ZERO occurrences of "haoo": it is parameterised by `productName`,
 * which was the point of the Phase 1 shell-reuse pattern. Copied into this tree it would
 * pass a name-only probe while plainly being HAOO product source. Measured, not assumed.
 *
 * CLOSED LIST, SAME DISCIPLINE AS `HOME_PAGE_SYMBOLS` AND THE FOCUS-SOURCE LIST. An entry
 * is added by registering a new HAOO product symbol, never by removing one to make a run
 * pass. Every entry below is measured ABSENT from ZERO-PAPER HUB product source and
 * PRESENT across HAOO's `src/` (2026-09-06), so each one discriminates rather than
 * decorates.
 *
 * RESIDUAL LIMIT, STATED RATHER THAN HIDDEN: a HAOO source file that neither names the
 * product nor uses any registered symbol would not be caught here. Such a file is
 * product-AGNOSTIC by construction — it is the reusable shell, not the product — and it
 * is caught by the other gate anyway, since its imports do not resolve in this tree and
 * `npm run typecheck` fails.
 */
export const HAOO_PRODUCT_SYMBOLS = [
  'HAOO_PRODUCT',
  'ProductPage',
  'ProductHeader',
  'QualifyForm',
  'QualifyFallback',
  'BrochurePanel',
  'OnboardingChoices',
  'MeasurementDisclosure',
  'ProductDefinition',
  'ProductBrochure',
  'qualifyCollectionNotePageContext',
  'buildSubmissionBody',
  'posthog',
];

/**
 * The two named legitimate carriers: the card registry (the home page's link out to the
 * HAOO site) and the recovery document served at the retired `/products/haoo/` path.
 * These two are EXPECTED to name the product; the auditor asserts they still do, so a
 * card or a recovery document that quietly went missing is a finding.
 */
export const NAMED_PRODUCT_CARRIERS = [
  'public/products/haoo/index.html',
  'src/products/registry.ts',
];

/** Reads the closed scaffold allowlist. Blank lines and `#` comments are not entries. */
export function parseAllowlist(text) {
  return parseAllowlistGrounds(text).entries;
}

/**
 * The allowlist carries entries on TWO grounds, marked by `# @ground:` directives, and
 * the difference is load-bearing.
 *
 *   `scaffold`  — shared toolchain the REPOSITORY owns. Safe indefinitely; several of
 *                 these are deliberately byte-identical across the two repositories.
 *   `collision` — the same PATH holding entirely different content, because both
 *                 repositories descend from the same Vite React scaffold. Safe ONLY
 *                 while the two copies stay divergent.
 *
 * A plain path allowlist is blind to a `collision` entry whose copies later CONVERGE —
 * the path is forgiven either way — and a converged copy IS a genuine SPLT-01 violation.
 * `auditCollisionDivergence` closes that hole, which is why the grounds are parsed rather
 * than flattened. See the allowlist file's own Ground B header.
 */
export function parseAllowlistGrounds(text) {
  const entries = [];
  const byGround = { scaffold: [], collision: [] };
  let ground = 'scaffold';

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const directive = /^#\s*@ground:\s*(\S+)\s*$/u.exec(line);
    if (directive) {
      ground = directive[1];
      continue;
    }
    if (line.length === 0 || line.startsWith('#')) continue;
    entries.push(line);
    byGround[ground] ??= [];
    byGround[ground].push(line);
  }

  return { entries, byGround };
}

/** True for a path this auditor does not compare at all. */
export function isExcluded(path) {
  return EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Removes comments before the product-name probe runs.
 *
 * A historical comment recording that the HAOO product LEFT this repository is not HAOO
 * product source, and the ZERO-PAPER HUB tree is full of them by design — `.gitignore`,
 * `src/App.tsx`, `src/vite-env.d.ts` and the deploy workflow each carry one, deliberately,
 * so a later reader finds a recorded reduction rather than an unexplained absence. A probe
 * that counted them would forbid the repository from EXPLAINING the split.
 *
 * The `[^:]` guard on the line-comment rule keeps `https://www.haoo.online/` intact — the
 * `//` in a URL is not a comment, and that URL is exactly the kind of hit that must count.
 *
 * Known imprecision, stated rather than hidden: a `/*` inside a string literal or a regex
 * would over-strip. That direction is the permissive one, so it is covered by the
 * structural class below rather than by this function — a file that ships product source
 * fails on its identifiers, not only on a URL.
 */
export function stripComments(text) {
  return text
    .replace(/<!--[\s\S]*?-->/gu, ' ')
    .replace(/\/\*[\s\S]*?\*\//gu, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/gu, '$1');
}

/**
 * THE NARROWED SUBJECT OF THE ZERO-PAPER HUB POSITIVE HALF (owner decision, 2026-09-06).
 *
 * The assertion is that the ZERO-PAPER HUB tree ships no HAOO PRODUCT SOURCE — not that
 * no file may NAME the product. The predecessor made the second claim and was
 * self-defeating: it flagged this auditor and its own allowlist for naming what they
 * exist to guard against, and it flagged the two suites whose entire purpose is proving
 * HAOO is gone. Eleven files, of which nine were the guards.
 *
 * The exempt class is DERIVED FROM WHAT A FILE IS, never enumerated. There is no skip
 * list of today's offenders — an exemption naming today's failures goes stale silently,
 * which is the vacuous pass this check exists to refuse.
 *
 * Product source is: a file under `src/` or `public/`, or a root-level `*.html`, that is
 * not one of the two named carriers, not a test, not an ambient declaration, and not
 * documentation. Everything else is exempt BY CONSTRUCTION rather than by name —
 * tooling (`scripts/`), CI (`.github/`), the root manifests and tool configs and the
 * lockfile all fall outside `src/`, `public/` and root `*.html` without being listed.
 *
 * So a NEW file shipping HAOO product source into this tree — `src/products/haoo.ts`,
 * `src/components/HaooPanel.tsx`, `public/haoo-brochure.html` — still fails, which is the
 * property `build-output.test.ts` pins and the plan summary demonstrates by injection.
 */
export function isProductSource(path) {
  if (isExcluded(path)) return false;
  if (NAMED_PRODUCT_CARRIERS.includes(path)) return false;
  if (path.endsWith('.md')) return false;
  if (path.endsWith('.d.ts')) return false;
  if (path.startsWith('src/test/')) return false;
  if (/\.(test|spec)\.[cm]?[jt]sx?$/u.test(path)) return false;

  const underSource = path.startsWith('src/');
  const underPublic = path.startsWith('public/');
  const rootDocument = !path.includes('/') && path.endsWith('.html');
  return underSource || underPublic || rootDocument;
}

/**
 * THE NON-EMPTY GUARD, AND THE SINGLE MOST IMPORTANT FUNCTION IN THIS FILE.
 *
 * The intersection of two EMPTY file lists is empty, so a naive implementation reports
 * success on a subject it never read. A check that compared nothing cannot pass by
 * comparing nothing. Same property as the `scans a non-empty set of production build
 * inputs` case in `build-output.test.ts`, and the provider-unset probe's
 * `expect(probeBundle.length).toBeGreaterThan(0)` — assert the subject exists before
 * asserting anything about it.
 *
 * This runs FIRST and throws IMMEDIATELY rather than accumulating: with an empty side,
 * every later finding is a statement about nothing.
 */
export function assertTreesNonEmpty({ leftLabel, leftFiles, rightLabel, rightFiles }) {
  const empty = [];
  if (leftFiles.length === 0) empty.push(leftLabel);
  if (rightFiles.length === 0) empty.push(rightLabel);

  if (empty.length > 0) {
    throw new Error(
      `Tree disjointness audit refused to run: empty comparable file list for ${empty.join(' and ')}. ` +
        'A check that compared nothing cannot pass by comparing nothing — an intersection of ' +
        'empty lists is empty, which would read as success. Point the auditor at a checkout ' +
        `whose \`git ls-files\` is non-empty outside ${EXCLUDED_PREFIXES.join(', ')}.`,
    );
  }
}

/**
 * The intersection, minus the allowlist.
 *
 * Paths are compared by EXACT WHOLE-STRING equality — never by glob, prefix or substring.
 * Plan 04.2-07 named the trap: `public/products/haoo/index.html` is a ZERO-PAPER HUB-only
 * path with no counterpart in the HAOO repository (whose document is its root
 * `index.html`), so it needs no allowlist entry — but a check that pattern-matched on the
 * fragment `products/haoo` would wrongly flag it.
 *
 * Accumulates. Never short-circuits on the first offending path: one run tells the whole
 * story rather than revealing violations one commit at a time.
 */
export function auditSharedPaths({ leftLabel, leftFiles, rightLabel, rightFiles, allowlist }) {
  const left = [...new Set(leftFiles.filter((path) => !isExcluded(path)))].sort(byCodeUnit);
  const right = [...new Set(rightFiles.filter((path) => !isExcluded(path)))].sort(byCodeUnit);

  // The guard runs on the POST-EXCLUSION lists, not the raw ones. A checkout holding
  // nothing but `.planning/` files is non-empty by `length` and empty by SUBJECT: every
  // path is dropped before the comparison, so the run would compare nothing and report
  // success. Guarding the raw list alone leaves exactly that hole open, which is why the
  // pinning case in `build-output.test.ts` asserts BOTH forms.
  assertTreesNonEmpty({ leftLabel, leftFiles: left, rightLabel, rightFiles: right });

  const allowed = new Set(allowlist);
  const rightSet = new Set(right);

  const shared = left.filter((path) => rightSet.has(path));
  const subtracted = shared.filter((path) => allowed.has(path));
  const violations = shared.filter((path) => !allowed.has(path));

  return {
    counts: {
      leftTracked: leftFiles.length,
      rightTracked: rightFiles.length,
      leftCompared: left.length,
      rightCompared: right.length,
      compared: left.length + right.length,
      shared: shared.length,
      allowlistEntries: allowed.size,
      allowlistSubtracted: subtracted.length,
      violations: violations.length,
    },
    shared,
    subtracted,
    violations,
    errors: violations.map(
      (path) =>
        `Shared path outside the scaffold allowlist: ${path} — tracked in BOTH ${leftLabel} and ${rightLabel}`,
    ),
  };
}

/**
 * The two positive halves, which are what SPLT-01 actually asserts. The intersection
 * above is the negative half: it proves the trees do not overlap. These prove each tree
 * holds only its own half.
 */
export function auditPositiveHalves({ productSourceLeaks, carriersNamingProduct, homePageSymbolFiles }) {
  const errors = [];

  // (a) No ZERO-PAPER HUB PRODUCT SOURCE file carries HAOO product source.
  for (const path of [...productSourceLeaks].sort(byCodeUnit)) {
    errors.push(
      `ZERO-PAPER HUB half: ${path} is product source and ships HAOO product source — the product left this repository`,
    );
  }

  // (b) The two named carriers must STILL name the product. Narrowing the subject in (a)
  //     must not quietly retire the assertion that the card and the recovery document are
  //     still there; a missing carrier is a regression, not a clean tree.
  for (const path of NAMED_PRODUCT_CARRIERS) {
    if (!carriersNamingProduct.includes(path)) {
      errors.push(
        `ZERO-PAPER HUB half: ${path} is expected to name the product and does not — the card or the recovery document has gone missing`,
      );
    }
  }

  // (c) No HAOO source names a home-page symbol.
  for (const path of [...homePageSymbolFiles].sort(byCodeUnit)) {
    errors.push(
      `HAOO half: ${path} names a home-page symbol (${HOME_PAGE_SYMBOLS.join(', ')}) — the home page does not belong in this repository`,
    );
  }

  return {
    counts: {
      productSourceLeaks: productSourceLeaks.length,
      carriersPresent: carriersNamingProduct.length,
      carriersExpected: NAMED_PRODUCT_CARRIERS.length,
      homePageSymbolHits: homePageSymbolFiles.length,
    },
    errors,
  };
}

/**
 * Ground B entries are forgiven only while their two copies stay DIVERGENT. A converged
 * copy is a genuine SPLT-01 violation that a plain path allowlist cannot see, because the
 * path is on the list either way. Asserting divergence per entry turns the allowlist's one
 * blind spot into a reported finding.
 *
 * `collisionEntries` that are absent from one tree are skipped: a path that is not shared
 * cannot have converged, and the intersection half already owns the shared-path question.
 */
export function auditCollisionDivergence({ collisionEntries, identicalPaths }) {
  return {
    counts: { collisionEntries: collisionEntries.length, converged: identicalPaths.length },
    errors: [...identicalPaths].sort(byCodeUnit).map(
      (path) =>
        `Ratified collision CONVERGED: ${path} is now byte-identical in both repositories — ` +
        'it was allowlisted on the ground that its two copies hold different content, and that ground no longer holds. ' +
        'Do not move it to the scaffold ground; that would declare a genuine violation to be scaffolding.',
    ),
  };
}

/**
 * Runs both halves and reports EVERY finding in ONE throw. The non-empty guard inside
 * `auditSharedPaths` is the only early exit in this file.
 */
export function auditTreeDisjointness(input) {
  const paths = auditSharedPaths(input);
  const positive = auditPositiveHalves(input);
  const divergence = auditCollisionDivergence(input);
  const identity = auditByteIdentity(input);
  const errors = [...paths.errors, ...divergence.errors, ...identity.errors, ...positive.errors];

  if (errors.length > 0) {
    throw new Error(
      `Tree disjointness audit failed (${errors.length} finding${errors.length === 1 ? '' : 's'}):\n- ${errors.join('\n- ')}`,
    );
  }

  return { counts: { ...paths.counts, ...divergence.counts, ...identity.counts, ...positive.counts } };
}

/**
 * The absolute path of an executable, found by walking PATH once, here, rather than at
 * each spawn.
 *
 * Spawning a bare name leaves the choice of binary to whatever PATH holds at the moment of
 * the call. Resolving it up front makes that choice once, at a point where a missing binary
 * can be reported as a missing binary rather than surfacing later as a failed audit, and
 * leaves the spawn itself naming an absolute path. Returns null when the name is not on
 * PATH; the caller turns that into an error sentence.
 */
export function resolveExecutable(name, pathValue = process.env.PATH ?? '') {
  for (const directory of pathValue.split(delimiter)) {
    if (directory.length === 0) continue;
    const candidate = resolve(directory, name);
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Absent from this directory, or not executable by this user. Keep looking.
    }
  }
  return null;
}

/** Resolved once: the audit spawns `git` per checkout, and PATH does not change mid-run. */
const GIT_EXECUTABLE = resolveExecutable('git');

/** `git ls-files` for a checkout. A non-repository or a bare tree yields an empty list, */
/** which the non-empty guard then refuses — it never silently passes as "nothing shared". */
export function trackedFiles(checkout) {
  if (!GIT_EXECUTABLE) {
    return { files: [], error: 'git was not found on PATH' };
  }
  const result = spawnSync(GIT_EXECUTABLE, ['-C', checkout, 'ls-files'], { encoding: 'utf8' });
  if (result.status !== 0) {
    return { files: [], error: (result.stderr ?? '').trim() || `git ls-files failed in ${checkout}` };
  }
  return {
    files: result.stdout.split('\n').map((line) => line.trim()).filter((line) => line.length > 0),
    error: null,
  };
}

/** Reads a tracked file, returning null for anything that is not decodable text. */
export function readTextFile(checkout, path) {
  try {
    const buffer = readFileSync(resolve(checkout, path));
    if (buffer.includes(0)) return null;
    return buffer.toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Identifies which checkout is which by reading `CNAME`, rather than trusting argument
 * order. `CNAME` is on the allowlist as a PATH, and the two copies hold different
 * hostnames — which makes it the one file that can tell the two trees apart. This also
 * catches the same checkout being passed twice, which `cd ""` makes easy to do by
 * accident (see `04.2-split-env.sh`).
 */
export function identifyCheckout(checkout) {
  const cname = (readTextFile(checkout, 'CNAME') ?? '').trim();
  if (cname.includes('haoo.online')) return { side: 'haoo', host: cname };
  if (cname.includes('zero-paperhub.com')) return { side: 'zph', host: cname };
  return { side: null, host: cname };
}

/** The ZERO-PAPER HUB positive half's subject: PRODUCT SOURCE that ships HAOO source. */
export function productSourceLeaksIn(checkout, files) {
  const symbols = new RegExp(String.raw`\b(${HAOO_PRODUCT_SYMBOLS.join('|')})\b`, 'u');
  return files.filter((path) => {
    if (!isProductSource(path)) return false;
    const body = stripComments(readTextFile(checkout, path) ?? '');
    return PRODUCT_NAME_PATTERN.test(body) || symbols.test(body);
  });
}

/** The named carriers that still name the product, for the presence assertion. */
export function carriersNamingProductIn(checkout, files) {
  return NAMED_PRODUCT_CARRIERS.filter(
    (path) =>
      files.includes(path) &&
      PRODUCT_NAME_PATTERN.test(stripComments(readTextFile(checkout, path) ?? '')),
  );
}

/** Ground B entries whose two copies have converged to byte-identical content. */
export function convergedCollisionsIn(leftCheckout, leftFiles, rightCheckout, rightFiles, collisionEntries) {
  return collisionEntries.filter((path) => {
    if (!leftFiles.includes(path) || !rightFiles.includes(path)) return false;
    const left = readFileSync(resolve(leftCheckout, path));
    const right = readFileSync(resolve(rightCheckout, path));
    return left.equals(right);
  });
}

/**
 * The mirror of `convergedCollisionsIn`, for the opposite requirement: Ground A identity
 * entries whose two copies have DRIFTED APART.
 *
 * A path missing from one side is reported separately rather than as divergence. The two
 * are different failures and read differently in the output: one repository has deleted or
 * renamed a ratified file, versus both still carry it and their contents no longer agree.
 */
export function divergedIdenticalsIn(leftCheckout, leftFiles, rightCheckout, rightFiles, paths) {
  const diverged = [];
  const missing = [];

  for (const path of paths) {
    if (!leftFiles.includes(path) || !rightFiles.includes(path)) {
      missing.push(path);
      continue;
    }
    const left = readFileSync(resolve(leftCheckout, path));
    const right = readFileSync(resolve(rightCheckout, path));
    if (!left.equals(right)) diverged.push(path);
  }

  return { diverged, missing };
}

/**
 * Ground A's identity half. Three findings, each naming what it actually is.
 *
 * The allowlist cross-check runs FIRST and unconditionally: an entry named here but absent
 * from `shared-scaffold.txt` means the two sources have drifted, and every identity finding
 * below it would then be reported against a set nobody ratified.
 */
export function auditByteIdentity({ byteIdenticalPaths, allowlist, divergedIdenticals, missingIdenticals }) {
  const errors = [];

  for (const path of [...byteIdenticalPaths].sort(byCodeUnit)) {
    if (!allowlist.includes(path)) {
      errors.push(
        `Ground A identity list names ${path}, which is NOT an entry in the shared-scaffold allowlist — ` +
          'the auditor is asserting byte-identity for a path the ratified list does not carry. ' +
          'Reconcile the two rather than deleting the assertion.',
      );
    }
  }

  for (const path of [...missingIdenticals].sort(byCodeUnit)) {
    errors.push(
      `Ratified identical file MISSING: ${path} is ratified as byte-identical on both sides but is ` +
        'absent from one of the two trees — it has been deleted or renamed in one repository only.',
    );
  }

  for (const path of [...divergedIdenticals].sort(byCodeUnit)) {
    errors.push(
      `Ratified identical file DIVERGED: ${path} is ratified as byte-identical on both sides and its ` +
        'two copies no longer agree. A change was applied to one repository and not the other; mirror ' +
        'it rather than relaxing the requirement.',
    );
  }

  return {
    counts: {
      byteIdenticalEntries: byteIdenticalPaths.length,
      diverged: divergedIdenticals.length + missingIdenticals.length,
    },
    errors,
  };
}

/** The HAOO positive half's subject: sources naming a home-page symbol. */
export function homePageSymbolFilesIn(checkout, files) {
  const pattern = new RegExp(String.raw`\b(${HOME_PAGE_SYMBOLS.join('|')})\b`, 'u');
  return files
    .filter((path) => !isExcluded(path) && path.startsWith('src/'))
    .filter((path) => pattern.test(readTextFile(checkout, path) ?? ''));
}

function main() {
  const [firstArg, secondArg, allowlistArg] = process.argv.slice(2);
  if (!firstArg || !secondArg) {
    throw new Error(
      'Usage: node scripts/verify-tree-disjointness.mjs <checkout-a> <checkout-b> [allowlist]\n' +
        '  <checkout-a>  REQUIRED — path to the first repository checkout\n' +
        '  <checkout-b>  REQUIRED — path to the second repository checkout\n' +
        `  [allowlist]   optional — defaults to ${DEFAULT_ALLOWLIST_PATH}`,
    );
  }

  // Relative checkout arguments resolve against THIS script's repository root, not the
  // current working directory, so `npm run verify:disjoint` behaves the same from any
  // subdirectory of the repository.
  const first = resolve(SCRIPT_REPO_ROOT, firstArg);
  const second = resolve(SCRIPT_REPO_ROOT, secondArg);
  const allowlistPath = allowlistArg ? resolve(SCRIPT_REPO_ROOT, allowlistArg) : DEFAULT_ALLOWLIST_PATH;
  const { entries: allowlist, byGround } = parseAllowlistGrounds(readFileSync(allowlistPath, 'utf8'));
  const collisionEntries = byGround.collision ?? [];

  const firstTracked = trackedFiles(first);
  const secondTracked = trackedFiles(second);
  const firstId = identifyCheckout(first);
  const secondId = identifyCheckout(second);

  if (!firstId.side || !secondId.side) {
    throw new Error(
      `Could not identify a checkout from its CNAME: ${!firstId.side ? first : second}. ` +
        'Each checkout must carry a CNAME naming either www.haoo.online or www.zero-paperhub.com.',
    );
  }
  if (firstId.side === secondId.side) {
    throw new Error(
      `Both arguments resolve to the ${firstId.side} checkout (${firstId.host}). ` +
        'A tree is trivially disjoint from itself; pass the two different checkouts.',
    );
  }

  const zph = firstId.side === 'zph' ? { path: first, ...firstTracked } : { path: second, ...secondTracked };
  const haoo = firstId.side === 'haoo' ? { path: first, ...firstTracked } : { path: second, ...secondTracked };

  const identity = divergedIdenticalsIn(zph.path, zph.files, haoo.path, haoo.files, BYTE_IDENTICAL_PATHS);

  const result = auditTreeDisjointness({
    leftLabel: `ZERO-PAPER HUB (${zph.path})`,
    leftFiles: zph.files,
    rightLabel: `HAOO (${haoo.path})`,
    rightFiles: haoo.files,
    allowlist,
    collisionEntries,
    byteIdenticalPaths: BYTE_IDENTICAL_PATHS,
    divergedIdenticals: identity.diverged,
    missingIdenticals: identity.missing,
    identicalPaths: convergedCollisionsIn(zph.path, zph.files, haoo.path, haoo.files, collisionEntries),
    productSourceLeaks: productSourceLeaksIn(zph.path, zph.files),
    carriersNamingProduct: carriersNamingProductIn(zph.path, zph.files),
    homePageSymbolFiles: homePageSymbolFilesIn(haoo.path, haoo.files),
  });

  const c = result.counts;
  console.log(
    'Tree disjointness audit passed.\n' +
      `  ZERO-PAPER HUB tracked: ${c.leftTracked} (${c.leftCompared} after excluding ${EXCLUDED_PREFIXES.join(', ')})\n` +
      `  HAOO tracked:           ${c.rightTracked} (${c.rightCompared} after excluding ${EXCLUDED_PREFIXES.join(', ')})\n` +
      `  paths compared:         ${c.compared}\n` +
      `  shared paths:           ${c.shared}\n` +
      `  allowlist entries:      ${c.allowlistEntries}\n` +
      `  allowlist subtracted:   ${c.allowlistSubtracted}\n` +
      `  violations:             ${c.violations}\n` +
      `  ratified collisions:    ${c.collisionEntries} (converged: ${c.converged})\n` +
      `  ratified identicals:    ${c.byteIdenticalEntries} (diverged: ${c.diverged})\n` +
      `  ZPH product source shipping HAOO source: ${c.productSourceLeaks}\n` +
      `  ZPH named carriers present: ${c.carriersPresent} of ${c.carriersExpected}\n` +
      `  HAOO files naming a home-page symbol: ${c.homePageSymbolHits}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
