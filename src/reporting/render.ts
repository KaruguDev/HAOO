import {
  deltaLabel,
  emptyStateBody,
  recordedActionsLabel,
  REPORT_CAVEATS,
  REPORT_COLUMN_HEADERS,
  REPORT_DEFAULT_PERIOD_ID,
  REPORT_EMPTY_STATE_HEADING,
  REPORT_METADATA_LABELS,
  REPORT_METADATA_SEPARATOR,
  REPORT_PERIOD_IDS,
  REPORT_PERIOD_LEGEND,
  REPORT_STAGE_ORDER,
  REPORT_STAGES,
  reportLabel,
  stageTotals,
} from './haoo-report.ts';
import type { PeriodWindow, ReportPeriodId, ReportStageId } from './haoo-report.ts';
import type { HaooMeasurementEvent } from '../products/haoo.ts';

/**
 * Renders the owner report as one self-contained document (UI-SPEC Surface A).
 *
 * The document carries no script element, no external stylesheet, no web font, no image,
 * and no request of any kind, so it opens with no network access and can never leak a
 * credential through a request URL (threat T-04-02). Provider-controlled text never
 * reaches the page: only the authored label map and validated integers are rendered, and
 * every interpolated value passes through `escapeHtml` (threat T-04-03).
 *
 * This module holds markup and CSS only. Every owner-facing word comes from
 * `./haoo-report.ts`, and every number is computed before the model reaches it — the
 * renderer's only arithmetic is choosing a plural form and summing a stage from counts
 * that were already validated.
 */

export interface ReportPeriodModel {
  readonly id: ReportPeriodId;
  /** `null` for the all-time period, which has no preceding period to compare with. */
  readonly days: number | null;
  /** The radio label for this view, authored in the report dictionary. */
  readonly label: string;
  readonly heading: string;
  readonly comparisonLine: string;
  /**
   * The inclusive boundaries this period covers, used only by the empty-state copy.
   * `null` when the provider resolved no range for the all-time view, in which case the
   * document names no dates rather than inventing them.
   */
  readonly window: PeriodWindow | null;
  /** Computed in `generate.ts`: every allowlisted count in this period is zero. */
  readonly empty: boolean;
  readonly counts: Readonly<Record<string, number>>;
  readonly previousCounts: Readonly<Record<string, number>> | null;
}

export interface ReportModel {
  readonly title: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly siteScope: string;
  readonly periods: readonly ReportPeriodModel[];
}

const ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Every value that reaches the document goes through this function. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ENTITIES[character] ?? character);
}

/** The DOM id of the radio input that exposes a period section. */
function radioId(period: ReportPeriodId): string {
  return `period-${period}`;
}

/**
 * Period switching with no script.
 *
 * The rule is written as "hide the sections that are **not** selected once the body has
 * a checked input", never as "show the selected one". A browser that cannot evaluate
 * `:has()` drops the whole selector as invalid and therefore applies no hiding at all,
 * so the degraded document is all four sections visible in sequence under their own `h2`
 * headings — readable and complete, never empty or partial. Nothing is hidden by a
 * `hidden` attribute, an inline display rule, or markup omission.
 */
const PERIOD_EXPOSURE_RULES = REPORT_PERIOD_IDS.map(
  (period) =>
    `body:has(#${radioId(period)}:checked) .period-section:not(#${period})`
    + ' { display: none; }',
).join('\n');

/**
 * The inherited design system reproduced as literal CSS.
 *
 * Surface A has no Tailwind, no React and no dependency, so the eight spacing values,
 * the type scale, the colour roles and the `focusLight` ring pairing from
 * `src/components/MeasurementDisclosure.tsx` are declared here by hand. The system font
 * stack is the one deliberate deviation from the inherited Inter contract: a web font
 * would be a third-party request made while the owner reads business figures
 * (threat T-04-13).
 */
export const REPORT_STYLES = [
  ':root {',
  '  color-scheme: light;',
  '  --space-xs: 4px;',
  '  --space-sm: 8px;',
  '  --space-control: 8px;',
  '  --space-md: 16px;',
  '  --space-lg: 24px;',
  '  --space-xl: 32px;',
  '  --space-2xl: 48px;',
  '  --space-3xl: 64px;',
  '  --size-body: 16px;',
  '  --size-label: 14px;',
  '  --size-heading: 28px;',
  '  --weight-regular: 400;',
  '  --weight-semibold: 600;',
  '  --leading-body: 1.5;',
  '  --leading-label: 1.4;',
  '  --leading-heading: 1.2;',
  '  --page: #FBFCFF;',
  '  --surface: #FFFFFF;',
  '  --inset: #E9EDFF;',
  '  --ink: #18275F;',
  '  --ink-supporting: #5F6B84;',
  '  --accent: #4054C6;',
  '  --border: #DFE4F0;',
  '  --measure: 880px;',
  '  --target: 44px;',
  '}',
  '* { box-sizing: border-box; }',
  'body {',
  '  margin: 0;',
  '  padding: var(--space-lg) var(--space-md);',
  '  background: var(--page);',
  '  color: var(--ink);',
  "  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;",
  '  font-size: var(--size-body);',
  '  font-weight: var(--weight-regular);',
  '  line-height: var(--leading-body);',
  '}',
  '@media (min-width: 768px) {',
  '  body { padding: var(--space-2xl) var(--space-md); }',
  '}',
  '.wrap { max-width: var(--measure); margin: 0 auto; }',
  '.report-header {',
  '  background: var(--inset);',
  '  border: 1px solid var(--border);',
  '  border-radius: 8px;',
  '  padding: var(--space-lg);',
  '}',
  'h1 {',
  '  font-size: var(--size-heading);',
  '  font-weight: var(--weight-semibold);',
  '  line-height: var(--leading-heading);',
  '  margin: 0 0 var(--space-sm);',
  '}',
  '.report-meta {',
  '  margin: 0;',
  '  font-size: var(--size-label);',
  '  line-height: var(--leading-label);',
  '  color: var(--ink-supporting);',
  '}',
  '.period-control {',
  '  margin: var(--space-lg) 0 0;',
  '  padding: var(--space-md);',
  '  background: var(--inset);',
  '  border: 1px solid var(--border);',
  '  border-radius: 8px;',
  '}',
  '.period-control legend {',
  '  padding: 0 var(--space-xs);',
  '  font-size: var(--size-label);',
  '  font-weight: var(--weight-semibold);',
  '  line-height: var(--leading-label);',
  '}',
  '.period-options {',
  '  display: flex;',
  '  flex-wrap: wrap;',
  '  gap: var(--space-sm) var(--space-md);',
  '}',
  '.period-option {',
  '  display: flex;',
  '  align-items: center;',
  '  gap: var(--space-sm);',
  '  min-height: var(--target);',
  '  padding: var(--space-control) var(--space-md);',
  '  background: var(--surface);',
  '  border: 1px solid var(--border);',
  '  border-radius: 8px;',
  '  font-size: var(--size-label);',
  '  font-weight: var(--weight-semibold);',
  '  line-height: var(--leading-label);',
  '  cursor: pointer;',
  '  transition: color 150ms ease, border-color 150ms ease;',
  '}',
  // Colour is never the only signal for the selected period: the radio is also the
  // checked native control and its section is the only one exposed.
  '.period-option:has(input:checked) { border-color: var(--accent); color: var(--accent); }',
  '.period-option input { accent-color: var(--accent); }',
  // The inherited focusLight pairing: a 2px white offset then the accent ring.
  ':focus-visible {',
  '  outline: 2px solid var(--accent);',
  '  outline-offset: 2px;',
  '  box-shadow: 0 0 0 2px #FFFFFF;',
  '}',
  '.period-sections { margin-top: var(--space-lg); }',
  '.period-section { margin: 0 0 var(--space-xl); }',
  'h2 {',
  '  font-size: var(--size-body);',
  '  font-weight: var(--weight-semibold);',
  '  line-height: var(--leading-body);',
  '  margin: 0 0 var(--space-sm);',
  '}',
  '.comparison {',
  '  margin: 0 0 var(--space-md);',
  '  font-size: var(--size-label);',
  '  line-height: var(--leading-label);',
  '  color: var(--ink-supporting);',
  '}',
  '.empty-state {',
  '  margin: 0 0 var(--space-md);',
  '  padding: var(--space-md);',
  '  background: var(--inset);',
  '  border: 1px solid var(--border);',
  '  border-radius: 8px;',
  '}',
  '.empty-state-heading {',
  '  margin: 0 0 var(--space-sm);',
  '  font-size: var(--size-label);',
  '  font-weight: var(--weight-semibold);',
  '  line-height: var(--leading-label);',
  '}',
  '.empty-state-body {',
  '  margin: 0;',
  '  font-size: var(--size-label);',
  '  line-height: var(--leading-label);',
  '  color: var(--ink-supporting);',
  '}',
  '.stage {',
  '  margin: 0 0 var(--space-md);',
  '  padding: var(--space-lg);',
  '  background: var(--surface);',
  '  border: 1px solid var(--border);',
  '  border-radius: 8px;',
  '}',
  '@media (min-width: 768px) {',
  '  .stage { padding: var(--space-xl); }',
  '}',
  // `display: list-item` rather than `display: flex`: a flex summary drops the native
  // disclosure marker in Chromium, and the marker is how open/closed state is exposed
  // without relying on colour. Below the medium breakpoint the three summary parts are
  // blocks, so they wrap onto separate lines with no truncation or clamp.
  '.stage summary {',
  '  display: list-item;',
  '  min-height: var(--target);',
  '  padding: var(--space-control) 0;',
  '  cursor: pointer;',
  '  transition: color 150ms ease;',
  '}',
  '.stage summary h3, .stage-total, .stage-change { display: block; }',
  '@media (min-width: 768px) {',
  '  .stage summary h3, .stage-total, .stage-change {',
  '    display: inline-block;',
  '    margin-right: var(--space-md);',
  '  }',
  '}',
  'h3 {',
  '  margin: 0;',
  '  font-size: var(--size-body);',
  '  font-weight: var(--weight-semibold);',
  '  line-height: var(--leading-body);',
  '}',
  '.stage-total {',
  '  font-size: var(--size-body);',
  '  font-weight: var(--weight-semibold);',
  '  line-height: var(--leading-body);',
  '  font-variant-numeric: tabular-nums;',
  '}',
  // An increase and a decrease share one colour: a red/green delta would editorialise a
  // count the data cannot explain. Direction is carried by the sign and the words only.
  '.stage-change {',
  '  font-size: var(--size-label);',
  '  font-weight: var(--weight-regular);',
  '  line-height: var(--leading-label);',
  '  color: var(--ink);',
  '  font-variant-numeric: tabular-nums;',
  '}',
  '.stage-clarifier {',
  '  margin: var(--space-md) 0 0;',
  '  font-size: var(--size-label);',
  '  line-height: var(--leading-label);',
  '  color: var(--ink-supporting);',
  '}',
  // The table scrolls inside its own labelled region so the document body never does.
  '.table-scroll {',
  '  margin-top: var(--space-md);',
  '  overflow-x: auto;',
  '  border-bottom: 1px solid var(--border);',
  '}',
  // No percentage unit anywhere, not even in CSS: the UI-SPEC prohibits a percentage
  // "anywhere" in this document, and keeping the stylesheet free of them too means the
  // owner can grep the whole artifact for a percent sign and expect zero hits. The table
  // sizes from its own content inside the scroll region instead.
  '.table-scroll table { min-width: 320px; border-collapse: collapse; }',
  'caption {',
  '  text-align: left;',
  '  padding-bottom: var(--space-sm);',
  '  font-size: var(--size-label);',
  '  line-height: var(--leading-label);',
  '  color: var(--ink-supporting);',
  '}',
  'th, td {',
  '  text-align: left;',
  '  padding: var(--space-sm) var(--space-md);',
  '  border-bottom: 1px solid var(--border);',
  '}',
  'thead th {',
  '  font-size: var(--size-label);',
  '  font-weight: var(--weight-semibold);',
  '  line-height: var(--leading-label);',
  '  white-space: nowrap;',
  '}',
  'tbody th {',
  '  font-size: var(--size-label);',
  '  font-weight: var(--weight-semibold);',
  '  line-height: var(--leading-label);',
  '}',
  'td {',
  '  font-size: var(--size-label);',
  '  font-weight: var(--weight-regular);',
  '  line-height: var(--leading-label);',
  '  font-variant-numeric: tabular-nums;',
  '}',
  '.caveats {',
  '  margin: var(--space-xl) 0 0;',
  '  padding: var(--space-lg);',
  '  background: var(--inset);',
  '  border: 1px solid var(--border);',
  '  border-radius: 8px;',
  '}',
  '.caveats p {',
  '  margin: 0 0 var(--space-sm);',
  '  font-size: var(--size-label);',
  '  line-height: var(--leading-label);',
  '  color: var(--ink-supporting);',
  '}',
  '.caveats p:last-child { margin-bottom: 0; }',
  PERIOD_EXPOSURE_RULES,
  // Print keeps the header metadata and the caveat block and drops the control chrome,
  // which has no meaning on paper. The selected section is the one that prints, through
  // the same exposure rules above.
  '@media print {',
  '  body { padding: 0; background: var(--surface); }',
  '  .period-control { display: none; }',
  '  .report-header, .report-meta, .caveats { display: block; }',
  '  .table-scroll { overflow-x: visible; border-bottom: 0; }',
  '}',
  '@media (prefers-reduced-motion: reduce) {',
  '  .period-option, .stage summary { transition: none; }',
  '}',
].join('\n');

function eventRow(event: HaooMeasurementEvent, period: ReportPeriodModel): string {
  const current = period.counts[event] ?? 0;
  const label = escapeHtml(reportLabel(event));

  if (period.previousCounts === null || period.days === null) {
    return `<tr><th scope="row">${label}</th><td>${current}</td></tr>`;
  }

  const previous = period.previousCounts[event] ?? 0;

  return `<tr><th scope="row">${label}</th><td>${current}</td><td>${previous}</td>`
    + `<td class="change">${escapeHtml(deltaLabel(current, previous, period.days))}</td>`
    + '</tr>';
}

function stageCard(stage: ReportStageId, period: ReportPeriodModel): string {
  const copy = REPORT_STAGES[stage];
  const headingId = `${period.id}-${stage}`;
  const total = stageTotals(stage, period.counts);
  const bounded = period.previousCounts !== null && period.days !== null;
  const change = bounded
    ? `<span class="stage-change">${escapeHtml(
      deltaLabel(total, stageTotals(stage, period.previousCounts ?? {}), period.days ?? 0),
    )}</span>`
    : '';
  const columns = bounded
    ? [
      REPORT_COLUMN_HEADERS.action,
      REPORT_COLUMN_HEADERS.current,
      REPORT_COLUMN_HEADERS.previous,
      REPORT_COLUMN_HEADERS.change,
    ]
    : [REPORT_COLUMN_HEADERS.action, REPORT_COLUMN_HEADERS.allTime];

  return [
    '<details class="stage">',
    '<summary>',
    `<h3 id="${escapeHtml(headingId)}">${escapeHtml(copy.label)}</h3>`,
    `<span class="stage-total">${escapeHtml(recordedActionsLabel(total))}</span>`,
    change,
    '</summary>',
    `<p class="stage-clarifier">${escapeHtml(copy.clarifier)}</p>`,
    `<div class="table-scroll" role="region" tabindex="0"`
    + ` aria-labelledby="${escapeHtml(headingId)}">`,
    '<table>',
    `<caption>${escapeHtml(copy.label)} · ${escapeHtml(period.heading)}</caption>`,
    `<thead><tr>${columns
      .map((column) => `<th scope="col">${escapeHtml(column)}</th>`)
      .join('')}</tr></thead>`,
    '<tbody>',
    copy.events.map((event) => eventRow(event, period)).join('\n'),
    '</tbody>',
    '</table>',
    '</div>',
    '</details>',
  ].join('\n');
}

/**
 * A zero period is a real answer, not a missing one: the authored empty-state copy names
 * the exact boundaries it covers and says why a count can be lower than reality, and the
 * four stage cards still render beneath it with their zero values.
 */
function emptyState(period: ReportPeriodModel): string {
  if (!period.empty || period.window === null) return '';

  return [
    '<div class="empty-state">',
    `<p class="empty-state-heading">${escapeHtml(REPORT_EMPTY_STATE_HEADING)}</p>`,
    `<p class="empty-state-body">${escapeHtml(
      emptyStateBody(period.window.start, period.window.end),
    )}</p>`,
    '</div>',
  ].join('\n');
}

function periodSection(period: ReportPeriodModel): string {
  const headingId = `${period.id}-heading`;

  return [
    `<section class="period-section" id="${escapeHtml(period.id)}"`
    + ` aria-labelledby="${escapeHtml(headingId)}">`,
    `<h2 id="${escapeHtml(headingId)}">${escapeHtml(period.heading)}</h2>`,
    `<p class="comparison">${escapeHtml(period.comparisonLine)}</p>`,
    emptyState(period),
    REPORT_STAGE_ORDER.map((stage) => stageCard(stage, period)).join('\n'),
    '</section>',
  ].join('\n');
}

/**
 * Native radio inputs, not a tablist. There is no `role="tab"`, no `aria-selected` and
 * no key handler: native radio-group arrow-key behaviour is the interaction, and every
 * period section it points at already exists in the document.
 */
function periodControl(model: ReportModel): string {
  const options = model.periods.map((period) => {
    const id = radioId(period.id);
    const checked = period.id === REPORT_DEFAULT_PERIOD_ID ? ' checked' : '';

    return `<label class="period-option" for="${escapeHtml(id)}">`
      + `<input type="radio" name="report-period" id="${escapeHtml(id)}"`
      + ` value="${escapeHtml(period.id)}"${checked}>`
      + `<span>${escapeHtml(period.label)}</span></label>`;
  });

  return [
    '<fieldset class="period-control">',
    `<legend>${escapeHtml(REPORT_PERIOD_LEGEND)}</legend>`,
    '<div class="period-options">',
    options.join('\n'),
    '</div>',
    '</fieldset>',
  ].join('\n');
}

/** UI-SPEC "Metadata": three witnessed facts and no claim of freshness beyond the timestamp. */
function metadataLine(model: ReportModel): string {
  return [
    `${REPORT_METADATA_LABELS.generated} ${model.generatedAt}`,
    `${REPORT_METADATA_LABELS.timezone} ${model.timezone}`,
    `${REPORT_METADATA_LABELS.site} ${model.siteScope}`,
  ].join(REPORT_METADATA_SEPARATOR);
}

export function renderReport(model: ReportModel): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(model.title)}</title>`,
    `<style>\n${REPORT_STYLES}\n</style>`,
    '</head>',
    '<body>',
    '<div class="wrap">',
    '<header class="report-header">',
    `<h1>${escapeHtml(model.title)}</h1>`,
    `<p class="report-meta">${escapeHtml(metadataLine(model))}</p>`,
    '</header>',
    periodControl(model),
    '<div class="period-sections">',
    model.periods.map(periodSection).join('\n'),
    '</div>',
    // Last in the document and outside every `details`, so the caveats cannot be
    // collapsed away from a number they qualify.
    '<div class="caveats" id="report-caveats">',
    REPORT_CAVEATS.map((caveat) => `<p>${escapeHtml(caveat)}</p>`).join('\n'),
    '</div>',
    '</div>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}
