import type { Page } from '@playwright/test';

/**
 * The brochure HTML equivalent (SS-4): its expected content and the two readers that take it off
 * the live page. Shared by the semantics and zoom/motion specs.
 *
 * Moved here verbatim from `e2e/semantics.e2e.ts` (05-10) by 05-13. Playwright refuses a spec
 * that imports another spec, and ZM-1b/ZM-2c must re-run the SS-4 expectations rather than retype
 * them, so a change to the equivalence contract now propagates to both specs automatically.
 */

/**
 * The capability and journey content, transcribed from `src/test/haoo-content.test.ts`
 * (`EXPECTED_CAPABILITIES`, `EXPECTED_CAPABILITY_DESCRIPTIONS`, `EXPECTED_JOURNEY`,
 * `EXPECTED_JOURNEY_DESCRIPTIONS`), which is where the brochure ledger is pinned.
 *
 * Transcribed rather than imported because `src/products/haoo.ts` reads `import.meta.env` at
 * module scope, which is `undefined` outside Vite — a Playwright spec importing it throws before
 * a single test runs. The vitest suite owns these lists; a divergence between the two files is a
 * defect in THIS file, not in the page.
 */
export const EXPECTED_CAPABILITIES = [
  ['Rent & payments', 'Track balances, digital payment workflows and tenant receipts—including M-Pesa.'],
  ['Properties & units', 'Organise portfolios, occupancy, vacancies and property details.'],
  ['Leases & screening', 'Support tenant applications, screening and digital lease workflows.'],
  ['Maintenance', 'Capture issues, assign work and keep progress visible to the right people.'],
  ['Vacancy marketplace', 'Publish available homes and receive tenant applications online.'],
  ['Reports & communication', 'Turn activity into insight and keep stakeholders informed.'],
] as const;

export const EXPECTED_JOURNEY = [
  ['Fill vacancies with confidence', 'Present available homes clearly and give prospective tenants a simple path to apply.'],
  ['Move in with clarity', 'Keep tenant information, screening and lease workflows organised from the start.'],
  ['Make every month easier', 'Give tenants a convenient place for payments, receipts, utilities and requests.'],
  ['Grow with visibility', 'Use connected records and reports to manage more units without losing the human touch.'],
] as const;

/**
 * The size of the HTML equivalent: **ten content items**, six capability cards and four journey
 * steps.
 *
 * **MEASURED CORRECTION to `05-UI-SPEC.md` § SS-4, which reads "10 capability titles" and "10 of
 * 10".** The shipped product carries SIX capabilities — already pinned at
 * `src/test/haoo-page.test.tsx:102` (`toHaveLength(6)`) and enumerated in
 * `src/test/haoo-content.test.ts` — and FOUR journey steps, measured live on 2026-09-12 as six
 * `#capabilities h3` and four journey `<li>`. The contract's ten is the size of the whole
 * equivalent, which is what SS-4 assertions 1 and 2 cover together; a spec asserting ten
 * capability cards would fail a correct page. Count equality is asserted against BOTH lists
 * individually and against this total, so a silently dropped item fails either way.
 */
export const BROCHURE_EQUIVALENT_ITEMS = 10;

/** The capability cards as `[title, description]` pairs, in document order. */
export async function capabilityItems(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('#capabilities li')).map((item) => [
      (item.querySelector('h3')?.textContent ?? '').trim(),
      (item.querySelector('p')?.textContent ?? '').trim(),
    ]),
  );
}

/** The journey steps as `[title, description]` pairs, in document order. */
export async function journeyItems(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('section[aria-label="Rental journey"] ol li')).map(
      (item) => [
        (item.querySelector('h3')?.textContent ?? '').trim(),
        (item.querySelector('p')?.textContent ?? '').trim(),
      ],
    ),
  );
}
