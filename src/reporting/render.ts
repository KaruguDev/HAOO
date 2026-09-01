import {
  deltaLabel,
  REPORT_STAGE_ORDER,
  REPORT_STAGES,
  reportLabel,
  stageTotals,
} from './haoo-report.ts';
import type { ReportStageId } from './haoo-report.ts';
import type { HaooMeasurementEvent } from '../products/haoo.ts';

/**
 * Renders the owner report as one self-contained document.
 *
 * The document carries no script element, no external stylesheet, no web font, no image,
 * and no request of any kind, so it opens with no network access and can never leak a
 * credential through a request URL (threat T-04-02). Provider-controlled text never
 * reaches the page: only the authored label map and validated integers are rendered, and
 * every interpolated value passes through `escapeHtml` (threat T-04-03).
 */

export interface ReportPeriodModel {
  readonly id: string;
  /** `null` for the all-time period, which has no preceding period to compare with. */
  readonly days: number | null;
  readonly heading: string;
  readonly comparisonLine: string | null;
  readonly counts: Readonly<Record<string, number>>;
  readonly previousCounts: Readonly<Record<string, number>> | null;
}

export interface ReportModel {
  readonly title: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly providerState: string;
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

/** UI-SPEC stage total copy. The unit noun is always present, and never a proportion. */
function recordedActions(total: number): string {
  return total === 1 ? '1 recorded action' : `${total} recorded actions`;
}

const STYLES = [
  ':root { color-scheme: light; }',
  'body { margin: 0; padding: 24px 16px; background: #F7F8FC; color: #18275F;',
  " font-family: system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;",
  ' line-height: 1.5; }',
  '.wrap { max-width: 880px; margin: 0 auto; }',
  'h1 { font-size: 28px; margin: 0 0 8px; }',
  'h2 { font-size: 20px; margin: 32px 0 8px; }',
  'h3 { font-size: 16px; margin: 0; }',
  '.report-meta, .comparison { margin: 0 0 8px; font-size: 14px; }',
  '.stage { background: #FFFFFF; border: 1px solid #D8DEF2; border-radius: 8px;',
  ' margin: 0 0 12px; padding: 12px 16px; }',
  '.stage summary { display: flex; flex-wrap: wrap; gap: 8px 16px;',
  ' align-items: baseline; min-height: 44px; cursor: pointer; }',
  '.stage-total { font-weight: 600; }',
  '.stage-change, .stage-clarifier { font-size: 14px; }',
  '.table-scroll { overflow-x: auto; }',
  'table { border-collapse: collapse; margin-top: 8px; min-width: 320px; }',
  'caption { text-align: left; font-size: 14px; padding-bottom: 8px; }',
  'th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #E4E8F6; }',
  'td { font-variant-numeric: tabular-nums; }',
].join('\n');

function eventRow(event: HaooMeasurementEvent, period: ReportPeriodModel): string {
  const current = period.counts[event] ?? 0;
  const label = escapeHtml(reportLabel(event));

  if (period.previousCounts === null || period.days === null) {
    return `<tr><th scope="row">${label}</th><td>${current}</td></tr>`;
  }

  const previous = period.previousCounts[event] ?? 0;

  return `<tr><th scope="row">${label}</th><td>${current}</td><td>${previous}</td>`
    + `<td>${escapeHtml(deltaLabel(current, previous, period.days))}</td></tr>`;
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
    ? '<th scope="col">Recorded action</th><th scope="col">This period</th>'
      + '<th scope="col">Previous period</th><th scope="col">Change</th>'
    : '<th scope="col">Recorded action</th><th scope="col">All time</th>';

  return [
    '<details class="stage">',
    '<summary>',
    `<h3 id="${escapeHtml(headingId)}">${escapeHtml(copy.label)}</h3>`,
    `<span class="stage-total">${escapeHtml(recordedActions(total))}</span>`,
    change,
    '</summary>',
    `<p class="stage-clarifier">${escapeHtml(copy.clarifier)}</p>`,
    `<div role="region" aria-labelledby="${escapeHtml(headingId)}" tabindex="0"`,
    ' class="table-scroll">',
    '<table>',
    `<caption>${escapeHtml(copy.label)} · ${escapeHtml(period.heading)}</caption>`,
    `<thead><tr>${columns}</tr></thead>`,
    '<tbody>',
    copy.events.map((event) => eventRow(event, period)).join('\n'),
    '</tbody>',
    '</table>',
    '</div>',
    '</details>',
  ].join('\n');
}

function periodSection(period: ReportPeriodModel): string {
  const comparison = period.comparisonLine === null
    ? ''
    : `<p class="comparison">${escapeHtml(period.comparisonLine)}</p>`;

  return [
    `<section id="${escapeHtml(period.id)}">`,
    `<h2>${escapeHtml(period.heading)}</h2>`,
    comparison,
    REPORT_STAGE_ORDER.map((stage) => stageCard(stage, period)).join('\n'),
    '</section>',
  ].join('\n');
}

export function renderReport(model: ReportModel): string {
  const metadata = `Generated ${model.generatedAt} · Reporting timezone ${model.timezone}`
    + ` · Analytics provider: ${model.providerState}`;

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(model.title)}</title>`,
    `<style>\n${STYLES}\n</style>`,
    '</head>',
    '<body>',
    '<div class="wrap">',
    `<h1>${escapeHtml(model.title)}</h1>`,
    `<p class="report-meta">${escapeHtml(metadata)}</p>`,
    model.periods.map(periodSection).join('\n'),
    '</div>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}
