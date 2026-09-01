import type { HaooMeasurementEvent } from '../products/haoo.ts';

/**
 * The closed HAOO reporting dictionary.
 *
 * Every string below is rendered byte-identically into the owner report and is locked by
 * `04-UI-SPEC.md`. Each label describes a browser-observable action and nothing more: a
 * send attempt is a request the browser made, and an outbound click is a link that was
 * opened. MEAS-08 depends on these words, so a change here is a copy change, not a
 * refactor.
 *
 * The maps are typed `Readonly<Record<HaooMeasurementEvent, ...>>` against the Phase 3
 * closed tuple, so adding an eleventh event to `HAOO_MEASUREMENT_EVENTS` or dropping a
 * label fails `npm run typecheck` before it fails a contract test.
 *
 * This module is loaded by `scripts/generate-haoo-report.mjs` through Node's native
 * TypeScript type stripping, so it uses erasable syntax only and imports by explicit
 * `.ts` extension.
 */

/** UI-SPEC "Event labels (exactly one per closed event name)". */
const REPORT_EVENT_LABELS: Readonly<Record<HaooMeasurementEvent, string>> = {
  haoo_page_view: 'HAOO page views',
  haoo_brochure_preview: 'Brochure preview became available',
  haoo_brochure_open: 'Brochure open clicks',
  haoo_brochure_download: 'Brochure download clicks',
  haoo_qualify_start: 'Qualification form starts',
  haoo_qualify_submit: 'Validated form send attempts',
  haoo_assisted_whatsapp: 'Outbound WhatsApp clicks',
  haoo_assisted_phone: 'Outbound phone clicks',
  haoo_assisted_email: 'Outbound email clicks',
  haoo_self_onboarding: 'Outbound self-onboarding clicks',
};

/** The D-01 reporting hierarchy. A stage is a grouping of occurrences, not a cohort. */
export const REPORT_STAGE_ORDER = [
  'discovery',
  'brochure-interest',
  'qualification',
  'assisted-and-self-onboarding',
] as const;

export type ReportStageId = (typeof REPORT_STAGE_ORDER)[number];

/** Exactly one stage per event. Stage membership is derived from this map, never listed twice. */
const REPORT_EVENT_STAGES: Readonly<Record<HaooMeasurementEvent, ReportStageId>> = {
  haoo_page_view: 'discovery',
  haoo_brochure_preview: 'brochure-interest',
  haoo_brochure_open: 'brochure-interest',
  haoo_brochure_download: 'brochure-interest',
  haoo_qualify_start: 'qualification',
  haoo_qualify_submit: 'qualification',
  haoo_assisted_whatsapp: 'assisted-and-self-onboarding',
  haoo_assisted_phone: 'assisted-and-self-onboarding',
  haoo_assisted_email: 'assisted-and-self-onboarding',
  haoo_self_onboarding: 'assisted-and-self-onboarding',
};

/**
 * The ten allowlisted goal names in Phase 3 tuple order, derived from the label map so
 * the literals are written once. Object literal key order is insertion order for
 * non-numeric string keys, and the record type guarantees the set is exhaustive.
 */
export const HAOO_REPORT_EVENTS = Object.keys(
  REPORT_EVENT_LABELS,
) as readonly HaooMeasurementEvent[];

export interface ReportStage {
  readonly label: string;
  readonly clarifier: string;
  readonly events: readonly HaooMeasurementEvent[];
}

/** Derived membership: an event belongs to a stage only through `REPORT_EVENT_STAGES`. */
function eventsInStage(stage: ReportStageId): readonly HaooMeasurementEvent[] {
  return HAOO_REPORT_EVENTS.filter((event) => REPORT_EVENT_STAGES[event] === stage);
}

/** UI-SPEC "Stage labels and clarifiers". Each clarifier states what the total is not. */
export const REPORT_STAGES: Readonly<Record<ReportStageId, ReportStage>> = {
  discovery: {
    label: 'Discovery',
    clarifier:
      'How many times the HAOO page was recorded as viewed. Repeat views by the same '
      + 'browser count more than once.',
    events: eventsInStage('discovery'),
  },
  'brochure-interest': {
    label: 'Brochure interest',
    clarifier:
      'Total of the brochure actions listed below. Previewing, opening, and downloading '
      + 'are separate recorded actions.',
    events: eventsInStage('brochure-interest'),
  },
  qualification: {
    label: 'Qualification',
    clarifier:
      'Total of the form actions listed below. A send attempt means the form passed the '
      + "page's checks and a request was made — not that the email reached the inbox.",
    events: eventsInStage('qualification'),
  },
  'assisted-and-self-onboarding': {
    label: 'Assisted and self-onboarding',
    clarifier:
      'Total of the outbound link clicks listed below. A click records that the link was '
      + 'opened, not that a conversation, registration, or onboarding happened.',
    events: eventsInStage('assisted-and-self-onboarding'),
  },
};

/** The single literal evidence label for an event name. */
export function reportLabel(event: HaooMeasurementEvent): string {
  return REPORT_EVENT_LABELS[event];
}

/** The single stage an event belongs to. */
export function stageOf(event: HaooMeasurementEvent): ReportStageId {
  return REPORT_EVENT_STAGES[event];
}

export interface PeriodWindow {
  readonly start: string;
  readonly end: string;
}

export interface PeriodWindows {
  readonly current: PeriodWindow;
  readonly previous: PeriodWindow;
}

const DAY_MILLISECONDS = 86_400_000;

/**
 * Day-only ISO arithmetic in the style of `src/measurement/index.ts`: parse to a UTC
 * epoch, add whole days, and slice the ISO string back to `YYYY-MM-DD`. No date library
 * is introduced for fixed 7/30/90-day inclusive windows.
 */
function shiftDay(day: string, days: number): string {
  const epoch = Date.parse(`${day}T00:00:00.000Z`);
  return new Date(epoch + days * DAY_MILLISECONDS).toISOString().slice(0, 10);
}

/**
 * The inclusive window of `days` calendar days ending on `todayIso`, plus the
 * immediately preceding non-overlapping window of the same length. Explicit inclusive
 * calendar ranges are required because the provider's nearest relative preset is 91
 * days, not the 90 that D-03 locks (RESEARCH Pitfall 4).
 */
export function periodWindows(days: number, todayIso: string): PeriodWindows {
  const currentStart = shiftDay(todayIso, -(days - 1));
  const previousEnd = shiftDay(currentStart, -1);

  return {
    current: { start: currentStart, end: todayIso },
    previous: { start: shiftDay(previousEnd, -(days - 1)), end: previousEnd },
  };
}

/**
 * A stage total is the sum of the literal occurrence counts inside that stage. It is
 * never derived from another stage total, and it is never a count of people (D-04).
 */
export function stageTotals(
  stage: ReportStageId,
  counts: Readonly<Record<string, number>>,
): number {
  return REPORT_STAGES[stage].events.reduce(
    (total, event) => total + (counts[event] ?? 0),
    0,
  );
}

/**
 * UI-SPEC "Change value". Signed integers only — never `+0`, never a ratio, share, or
 * rate, because the anonymous event stream has no identity with which to prove one.
 */
export function deltaLabel(current: number, previous: number, days: number): string {
  const delta = current - previous;
  const suffix = `vs previous ${days} days`;

  if (delta > 0) return `+${delta} ${suffix}`;
  if (delta < 0) return `−${Math.abs(delta)} ${suffix}`;
  return `No change ${suffix}`;
}

/* ------------------------------------------------------------------------------------
 * Owner-facing copy for the report document.
 *
 * Per the 04-PATTERNS.md "Data-driven copy, zero literals in components" pattern, every
 * word the owner reads lives here, keyed by a closed union wherever one exists, so an
 * omission is a typecheck error rather than a blank in the document. `render.ts` holds
 * markup and CSS only — it contains no evidence vocabulary of its own.
 * --------------------------------------------------------------------------------- */

/** UI-SPEC "Period section headings" — D-03 locks exactly these four views, in order. */
export const REPORT_PERIOD_IDS = [
  'last-7-days',
  'last-30-days',
  'last-90-days',
  'all-time',
] as const;

export type ReportPeriodId = (typeof REPORT_PERIOD_IDS)[number];

/** The visible radio label for each view. Also the first half of each `h2`. */
export const REPORT_PERIOD_LABELS: Readonly<Record<ReportPeriodId, string>> = {
  'last-7-days': 'Last 7 days',
  'last-30-days': 'Last 30 days',
  'last-90-days': 'Last 90 days',
  'all-time': 'All time',
};

/** UI-SPEC "Primary CTA": the 30-day view is the checked default. */
export const REPORT_DEFAULT_PERIOD_ID: ReportPeriodId = 'last-30-days';

/** UI-SPEC "Period legend". */
export const REPORT_PERIOD_LEGEND = 'Reporting period';

export type ReportColumnId = 'action' | 'current' | 'previous' | 'change' | 'allTime';

/** UI-SPEC "Table column headers". */
export const REPORT_COLUMN_HEADERS: Readonly<Record<ReportColumnId, string>> = {
  action: 'Recorded action',
  current: 'This period',
  previous: 'Previous period',
  change: 'Change',
  allTime: 'All time',
};

export type ReportMetadataId = 'generated' | 'timezone' | 'provider' | 'site';

/** UI-SPEC "Metadata" — the header line names all four facts and claims nothing else. */
export const REPORT_METADATA_LABELS: Readonly<Record<ReportMetadataId, string>> = {
  generated: 'Generated',
  timezone: 'Reporting timezone',
  provider: 'Analytics provider:',
  site: 'Site',
};

export const REPORT_METADATA_SEPARATOR = ' · ';

export type ReportProviderState = 'configured' | 'not-configured';

/** UI-SPEC "Metadata" provider states. The report never claims a third state. */
export const REPORT_PROVIDER_STATE_LABELS: Readonly<Record<ReportProviderState, string>> = {
  configured: 'configured',
  'not-configured': 'not configured',
};

/**
 * UI-SPEC "All-time comparison line". All time is rendered with this sentence instead of
 * a comparison, because there is no preceding period and inventing one would be a claim.
 */
export const REPORT_ALL_TIME_COMPARISON =
  'All time has no preceding period to compare with.';

/** UI-SPEC "Comparison line" for the three bounded views. */
export function comparisonLine(days: number, window: PeriodWindow): string {
  return `Compared with the previous ${days} days, ${window.start} to ${window.end}.`;
}

/** UI-SPEC "Empty state heading". */
export const REPORT_EMPTY_STATE_HEADING = 'No recorded actions in this period';

/**
 * UI-SPEC "Empty state body". A zero period says what was and was not measured; it is
 * never a dash, a blank section, or a "no data" placeholder.
 */
export function emptyStateBody(start: string, end: string): string {
  return `Nothing was recorded for any HAOO signal between ${start} and ${end}. Counts `
    + 'include only actions taken while measurement was configured, and browser privacy '
    + 'settings can prevent an action from being recorded.';
}

/**
 * UI-SPEC "Caveat block copy", one authored sentence per entry, rendered in this order
 * and always outside every collapsible element.
 *
 * These sentences are the report's denial of the claims its own shape might suggest, so
 * they deliberately name the things the counts are *not* — occurrences rather than
 * people or sessions, a click rather than a customer. That is why the banned-vocabulary
 * scan excludes this block and pins it by exact text instead: a negated word here is the
 * truthful reading, while the same word in a label would be the overstatement MEAS-08
 * forbids.
 */
export const REPORT_CAVEATS: readonly string[] = [
  'These counts are occurrences of browser actions, not people, sessions, or enquiries.',
  'One browser can appear in several stages, and a repeated action counts again.',
  'A stage total is the sum of the actions listed inside it, not evidence that the same '
  + 'person moved from one stage to the next.',
  'A validated form send attempt is a request the browser made; it is not proof that the '
  + 'message reached the inbox.',
  'An outbound click records that a link was opened; it is not a conversation, a '
  + 'registration, a customer, or completed onboarding.',
  'Browser privacy settings and content blockers can prevent an action from being '
  + 'recorded, so real activity can be higher than the counts shown.',
];

/**
 * UI-SPEC "Stage total". The unit noun is always present so a bare integer can never be
 * read as a count of people, and the singular form is authored rather than derived.
 */
export function recordedActionsLabel(total: number): string {
  return total === 1 ? '1 recorded action' : `${total} recorded actions`;
}
