/**
 * The closed list of surfaces this phase measures.
 *
 * The house pattern is `src/test/focus-contrast.test.ts` `FOCUS_SOURCES`: a doc-comment
 * stating how an entry is admitted, `as const`, a reason per entry, and a vacuity guard so
 * that a listed entry which yields nothing fails loudly rather than passing silently.
 *
 * A surface is admitted by being REGISTERED HERE, never by a spec reaching for a URL. The
 * reasons below are transcribed from `05-UI-SPEC.md` § Surfaces Under Test rather than
 * re-argued, because the admission decision belongs to that contract and restating it in new
 * words is how two documents start disagreeing.
 *
 * NOT in this list, and deliberately: the ZERO-PAPER HUB home page outside the Products
 * section. Three real accessibility defects were measured there on 2026-09-07 (F4, F5, F6)
 * and owner decision D-OQ-3 records and defers them rather than fixing them in this phase.
 * They are absent because someone decided, not because nobody looked.
 *
 * Widening this list to make a failing run pass is forbidden. An entry is admitted for a
 * stated reason; a removal is recorded per entry with its successor named, the way
 * `FOCUS_SOURCES` records its own narrowing.
 */

/** The five admitted surfaces. Exhaustive by construction — `SURFACES` is keyed by this union. */
export type SurfaceId = 'S1' | 'S2' | 'S3' | 'S4' | 'S5';

export interface Surface {
  readonly id: SurfaceId;
  /** Human label, as `05-UI-SPEC.md` names it. */
  readonly label: string;
  /** The live target (D-06). For S5 this is the local preview origin. */
  readonly url: string;
  /** The repository that owns the markup. D-08: nothing is installed in ZERO-PAPER HUB. */
  readonly owningRepo: string;
  /**
   * The path to use against the `playwrightProject`'s configured `baseURL`, or `null` when the
   * surface has no baseURL-relative form and must be reached by absolute URL.
   *
   * `path` is meaningless without knowing which project's `baseURL` it is relative to — S1 and
   * S5 are both `'/'` and resolve to different origins — so `playwrightProject` travels with it.
   */
  readonly path: string | null;
  /** Which `playwright.config.ts` project reaches this surface. */
  readonly playwrightProject: 'live' | 'preview';
  /** Whether the browser context runs with JavaScript enabled. */
  readonly javaScriptEnabled: boolean;
  /** Why this surface is in the list. */
  readonly reason: string;
}

export const SURFACES = {
  S1: {
    id: 'S1',
    label: 'HAOO product page',
    url: 'https://www.haoo.online/',
    owningRepo: 'KaruguDev/HAOO',
    path: '/',
    playwrightProject: 'live',
    javaScriptEnabled: true,
    reason:
      'The whole journey QUAL-01/02/03 name; every brochure, qualification and onboarding control lives here.',
  },
  S2: {
    id: 'S2',
    label: 'HAOO noscript recovery',
    url: 'https://www.haoo.online/',
    owningRepo: 'KaruguDev/HAOO',
    path: '/',
    playwrightProject: 'live',
    javaScriptEnabled: false,
    reason:
      'D-14 names the JS-disabled path explicitly. It is a DIFFERENT DOM, not a state of S1: the ' +
      '<noscript> subtree in index.html is what the parser exposes when scripting is off, and the ' +
      'React tree that S1 measures never renders at all. A spec must open it in its own context ' +
      'with javaScriptEnabled false, not toggle something on an S1 page.',
  },
  S3: {
    id: 'S3',
    label: 'ZERO-PAPER HUB Products section',
    url: 'https://www.zero-paperhub.com/#products',
    owningRepo: 'KaruguDev/ZERO-PAPERHUB',
    path: null,
    playwrightProject: 'live',
    javaScriptEnabled: true,
    reason:
      'QUAL-01 names "the Products and HAOO journeys". Reached by live URL only (D-08), so it has ' +
      'no baseURL-relative path in this repository.',
  },
  S4: {
    id: 'S4',
    label: 'Retired-path recovery document',
    url: 'https://www.zero-paperhub.com/products/haoo/',
    owningRepo: 'KaruguDev/ZERO-PAPERHUB',
    path: null,
    playwrightProject: 'live',
    javaScriptEnabled: true,
    reason:
      'The one artifact whose criterion spans both repositories (04.2 D-12); SC3 navigation claim ' +
      'rests on it. Reached by live URL only (D-08).',
  },
  S5: {
    id: 'S5',
    label: 'Local preview mirror of S1',
    url: 'http://localhost:4173/',
    owningRepo: 'KaruguDev/HAOO',
    path: '/',
    playwrightProject: 'preview',
    javaScriptEnabled: true,
    reason:
      "D-06's CI gate, served by `vite preview` from the already-built dist/. It is the ONLY " +
      'surface permitted to exercise destructive or failure form states (see UI-SPEC § Form State ' +
      'Coverage FS-0) — a failure state driven against live production would deliver a real lead.',
  },
} as const satisfies Record<SurfaceId, Surface>;

/** Every admitted surface, in id order. */
export const SURFACE_LIST: readonly Surface[] = Object.values(SURFACES);

/**
 * The vacuity guard, in the shape of `focus-contrast.test.ts`'s `pairs.length > 0` assertion.
 *
 * A spec calls this after selecting the subjects it is about to measure. A selector that
 * matched nothing, a filter that excluded everything, or a surface whose DOM changed shape
 * would otherwise produce a green run over an empty subject set — the exact failure mode the
 * closed-list discipline exists to prevent. It throws rather than returning a boolean so that
 * ignoring it takes a deliberate act.
 */
export function assertNonEmptySubjects<T>(
  subjects: readonly T[],
  description: string,
): readonly T[] {
  if (subjects.length === 0) {
    throw new Error(
      `vacuity guard: ${description} produced no subjects. A run over an empty subject set is ` +
        'not a passing run; it is an unasked question. Either the closed list is wrong or the ' +
        'surface changed shape.',
    );
  }
  return subjects;
}

/**
 * The surfaces reachable from a given Playwright project, guarded against emptiness.
 *
 * `--project=live` and `--project=preview` see different subsets; a spec that iterated the
 * wrong one would silently measure nothing.
 */
export function surfacesForProject(project: Surface['playwrightProject']): readonly Surface[] {
  return assertNonEmptySubjects(
    SURFACE_LIST.filter((surface) => surface.playwrightProject === project),
    `SURFACES filtered to the '${project}' project`,
  );
}
