import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';

import type { SurfaceId } from './surfaces';

/**
 * The ONE axe configuration for every surface in this phase.
 *
 * `AxeBuilder` is imported as a NAMED export. The package publishes both a named and a
 * default export, but the default import fails at runtime under this version's ESM
 * interop — the named import is the one that resolves to the class.
 *
 * Following the vendor-boundary idiom of `src/test/fixtures/posthog-capture-contract.ts`:
 * only the vendor surface this factory actually uses is declared locally. `axe-core`'s
 * `RunOptions` is not re-exported wholesale, because re-exporting it would restate the
 * vendor's type file rather than pin the small agreement this project depends on — and it
 * would tie every call site to a transitive dependency's type, which is exactly the coupling
 * a boundary fixture exists to prevent.
 *
 * Everything about which rules run lives here, at one branch, with the reasoning at the point
 * of the decision. No call site may quietly differ.
 */

/**
 * The conformance target (`05-UI-SPEC.md` § axe Configuration).
 *
 * `best-practice` is DELIBERATELY excluded. It is advisory, and including it would fail S4 —
 * the retired-path recovery document — for things that are recorded decisions rather than
 * defects: three paragraphs with no `<h1>`, no `<main>` and therefore no region, all of which
 * 04.2 D-12 defines as correct for that document.
 */
export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const;

/**
 * The impacts that FAIL a run. Everything else is recorded and does not fail.
 *
 * This threshold is owner decision **D-OQ-1** (2026-09-07), not a library default and not a
 * convention borrowed from elsewhere. Recorded reason: it blocks the violations that actually
 * deny access while keeping the gate credible enough that it does not get routinely ignored.
 *
 * `moderate` and `minor` findings are recorded in the run output with rule id, node target and
 * impact. Recording them is not a softer form of failing them — it is the difference between a
 * finding nobody has decided about and a finding somebody accepted.
 */
export const BLOCKING_IMPACTS = ['critical', 'serious'] as const;

export type BlockingImpact = (typeof BLOCKING_IMPACTS)[number];

/** Whether an axe violation's impact blocks the run under D-OQ-1. */
export function isBlockingImpact(impact: string | null | undefined): impact is BlockingImpact {
  return BLOCKING_IMPACTS.includes(impact as BlockingImpact);
}

export interface AxeRuleDisable {
  readonly rule: string;
  readonly reason: string;
}

/**
 * The per-URL rule disables. Closed list, one reason per entry, keyed by surface.
 *
 * There is NO global disable anywhere in this file: a global disable is invisible at the call
 * site, and invisibility is the whole failure mode this table exists to prevent.
 *
 * All three entries below are `best-practice`-tagged and are therefore ALREADY excluded by
 * `AXE_TAGS`. They are named anyway so the exclusion is a recorded decision rather than a side
 * effect of a tag choice — and so that adding `best-practice` to the tag list later is a
 * deliberate act with a visible cost rather than a surprise failure.
 *
 * There is deliberately **no `bypass` entry here, for any surface.** See `axeFor` below.
 */
export const AXE_PER_URL_DISABLES = {
  S4: [
    {
      rule: 'page-has-heading-one',
      reason:
        'S4 is a three-paragraph recovery document with no content to head. Adding an <h1> would ' +
        'give a noindex page a heading it does not need.',
    },
    {
      rule: 'landmark-one-main',
      reason:
        'Same: S4 is a static document, not a route. 04.2 D-12 defines it as minimal, and "just ' +
        'one more element" is the drift that definition exists to prevent.',
    },
    {
      rule: 'region',
      reason:
        'Follows from the two above — with no landmarks by design, all content is necessarily ' +
        'outside one.',
    },
  ],
} as const satisfies Partial<Record<SurfaceId, readonly AxeRuleDisable[]>>;

/**
 * The Products region container on the ZERO-PAPER HUB home page.
 *
 * `PRODUCTS_SECTION_ID` in `ZERO-PAPERHUB/src/products/registry.ts:50` is `'products'`, and
 * `ProductsSection.tsx:85` puts it on the section element. Read from that source rather than
 * guessed; D-08 forbids installing anything in that repository, not reading it.
 */
export const PRODUCTS_REGION_SELECTOR = '#products';

/** The disables that apply to a surface — the empty list for every surface but S4. */
export function axeDisablesFor(surface: SurfaceId): readonly AxeRuleDisable[] {
  // The table is intentionally partial: widening it to a total record would invite an empty
  // entry per surface, and an empty entry reads as "considered and found nothing" when it
  // means "not applicable".
  const table: Partial<Record<SurfaceId, readonly AxeRuleDisable[]>> = AXE_PER_URL_DISABLES;
  return table[surface] ?? [];
}

/**
 * The axe options this factory builds. Declared locally, minimally, deliberately.
 *
 * Mutable rather than `readonly` because the vendor's `RunOptions` is mutable and a readonly
 * array is not assignable to it; the object is constructed fresh per call and never shared.
 */
interface AxeRunOptions {
  runOnly: { type: 'tag'; values: string[] };
  rules?: Record<string, { enabled: boolean }>;
}

/**
 * Build the configured axe run for a surface.
 *
 * **The whole rule set is expressed through a SINGLE `.options()` call, and that is not a
 * style choice — it is the fallback `05-RESEARCH.md` § Pattern 4 pre-specified for the
 * outcome the tracer measured.** Research open question A2 was answered by running both
 * orderings against the live page (recorded in `05-EVIDENCE-HARNESS.md` §3):
 *
 *   `.withTags([...5 WCAG tags]).withRules(['heading-order'])`  ->  1 rule,  2 tags
 *   `.withRules(['heading-order']).withTags([...5 WCAG tags])`  ->  29 rules, 69 tags
 *
 * They REPLACE rather than union; the mechanism is last-call-wins, because each of
 * `withTags`, `withRules` and `options` overwrites `runOnly` wholesale. The intuitive ordering
 * is the catastrophic one: it collapses a five-tag conformance sweep to a single advisory rule
 * while reporting itself as a full-conformance pass — green, fast, and wrong.
 *
 * So: `.options()` is NEVER combined with `.withTags()` or `.withRules()` on the same builder,
 * here or anywhere downstream. The per-URL disables travel INSIDE the same options object
 * rather than through `.disableRules()`, for the same reason: `disableRules` assigns
 * `option.rules` wholesale, so its interaction with a separate `.options()` call depends on
 * which was written second.
 *
 * **Consequence this factory inherits and hands on: `heading-order` is a `best-practice` rule,
 * so `AXE_TAGS` does not run it (measured: `headingOrderRan: false`), and it cannot be re-added
 * with `withRules` without narrowing the whole run to that one rule.** There is no axe
 * configuration that delivers both it and the WCAG sweep from one builder. Semantic heading
 * order is therefore asserted by the semantics spec directly, as a DOM walk of `h1`..`h6` — not
 * by an axe rule, and not by this factory.
 */
export function axeFor(page: Page, surface: SurfaceId): AxeBuilder {
  const options: AxeRunOptions = {
    runOnly: { type: 'tag', values: [...AXE_TAGS] },
  };

  const disables = axeDisablesFor(surface);
  if (disables.length > 0) {
    options.rules = Object.fromEntries(
      disables.map((disable) => [disable.rule, { enabled: false }]),
    );
  }

  const builder = new AxeBuilder({ page }).options(options);

  if (surface === 'S3') {
    /*
     * S3 is scoped by INCLUSION, never by disabling `bypass`. This is decision D-OQ-3
     * expressed mechanically, and the distinction is load-bearing.
     *
     * A document-wide scan of the ZERO-PAPER HUB home page flags `bypass` (no mechanism to
     * skip navigation), which is tagged `wcag2a` with impact `serious` — so under D-OQ-1 it
     * would BLOCK the run on exactly the F5 defect D-OQ-3 decided not to fix in this phase.
     * The two decisions would collide and the ZPH gate would be un-greenable.
     *
     * Disabling `bypass` would "fix" that by suppressing a real, page-level finding on a live
     * public site — and it would keep suppressing it after a future ZERO-PAPER HUB phase fixes
     * F5, leaving a stale disable row nobody would notice. Scoping keeps the finding visible
     * where it lives and stays correct across that change; a disable does neither.
     *
     * D-OQ-3 decided that ZPH scope stops at the Products section. `.include()` on that
     * section IS that decision, in code.
     */
    builder.include(PRODUCTS_REGION_SELECTOR);
  }

  return builder;
}
