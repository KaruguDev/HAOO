import type { EngagementContext, VisitBand } from '../measurement';
import type { ProductEngagementSummary } from './types';

/**
 * Pure, product-generic engagement-summary formatter.
 *
 * It receives the already-bounded browser record and the already-normalized campaign
 * snapshot and returns one readable paragraph. It reads no storage, no address bar and
 * no analytics provider, holds no copy of its own, and names no product: every sentence
 * arrives as owner-approved configuration.
 *
 * Explicit pick list. The stored record carries members beyond the three read here, and
 * the public notice promises those never enter a form submission — so the summary is
 * built by naming what it may read rather than by spreading what it was handed. Adding
 * a member to the record cannot silently add it to a delivered email.
 */
const READABLE_MEMBERS = ['visitBand', 'lastSeenBand', 'flags'] as const;

/**
 * The band with no earlier recorded visit. A fresh record carries a same-day last-seen
 * band for internal consistency, but telling a recipient that a first-time browser was
 * "last seen today" would imply prior activity that never happened, so the last-seen
 * sentence is omitted entirely for this band.
 */
const FIRST_VISIT: VisitBand = 'first';

export type EngagementSummaryContext = Partial<EngagementContext> | null | undefined;
export type EngagementSummaryCampaign =
  | Readonly<Record<string, string>>
  | null
  | undefined;

/**
 * Fail-closed configuration guard, mirroring `requireIdentity` in `./copy`. A summary
 * without a label or without a fallback sentence would ship as an unlabelled field or
 * as an empty one, so a missing member throws at use rather than reaching an inbox.
 */
function requireSummaryCopy(config: ProductEngagementSummary) {
  for (const member of ['emailLabel', 'fallback'] as const) {
    if (typeof config?.[member] !== 'string' || config[member].trim() === '') {
      throw new Error(`Product engagement summary must declare a ${member}`);
    }
  }

  return config;
}

/** Sentence lookup that treats an unauthored or unrecognised band as unreadable. */
function sentenceFor(
  sentences: Readonly<Record<string, string>>,
  band: unknown,
): string | undefined {
  if (typeof band !== 'string') {
    return undefined;
  }

  const sentence = (sentences as Record<string, string | undefined>)[band];

  return typeof sentence === 'string' && sentence !== '' ? sentence : undefined;
}

/**
 * The band and interaction sentences, or `null` when the record cannot be read at all.
 * A partially readable record is treated as unreadable: half a summary would be a
 * claim the browser never supported.
 */
function recordSentences(
  record: EngagementSummaryContext,
  config: ProductEngagementSummary,
): string[] | null {
  if (typeof record !== 'object' || record === null) {
    return null;
  }

  const visitBand: unknown = record[READABLE_MEMBERS[0]];
  const visitSentence = sentenceFor(config.visitBandSentences, visitBand);

  if (visitSentence === undefined) {
    return null;
  }

  const sentences = [visitSentence];

  if (visitBand !== FIRST_VISIT) {
    const lastSeen: unknown = record[READABLE_MEMBERS[1]];
    const lastSeenSentence = sentenceFor(config.lastSeenSentences, lastSeen);

    if (lastSeenSentence === undefined) {
      return null;
    }

    sentences.push(lastSeenSentence);
  }

  const flags: unknown = record[READABLE_MEMBERS[2]];

  if (typeof flags !== 'object' || flags === null) {
    return null;
  }

  // Iteration order is the authored order, never the record's own key order: a
  // reordered stored record must not reorder sentences in a delivered email.
  const recorded = config.flagSentences
    .filter(({ flag }) => (flags as Record<string, unknown>)[flag] === true)
    .map(({ sentence }) => sentence);

  sentences.push(...(recorded.length > 0 ? recorded : [config.noFlagsSentence]));

  return sentences;
}

/**
 * The campaign clause, or nothing. Values arrive already lowercased, character-
 * restricted and length-capped, so no truncation and no ellipsis is added here.
 */
function campaignSentences(
  campaign: EngagementSummaryCampaign,
  config: ProductEngagementSummary,
): string[] {
  if (typeof campaign !== 'object' || campaign === null) {
    return [];
  }

  const { lead, clauses, separator, terminator } = config.campaignSentence;
  const present = clauses
    .map(({ key, label }) => {
      const value: unknown = (campaign as Record<string, unknown>)[key];

      return typeof value === 'string' && value.trim() !== ''
        ? ` ${label} ${value.trim()}`
        : '';
    })
    .filter((clause) => clause !== '');

  return present.length === 0
    ? []
    : [`${lead}${present.join(separator)}${terminator}`];
}

/**
 * Assemble the summary in the locked order: prefix, visit band, last seen (omitted on a
 * first visit), the recorded interaction sentences, the campaign clause when values were
 * present on arrival, then the boundary sentence that says what the whole paragraph is
 * and is not. Any failure yields the authored fallback rather than throwing, because a
 * summary must never block, delay, or fail a submission.
 */
export function formatEngagementSummary(
  record: EngagementSummaryContext,
  campaign: EngagementSummaryCampaign,
  config: ProductEngagementSummary,
): string {
  requireSummaryCopy(config);

  try {
    const sentences = recordSentences(record, config);

    if (sentences === null) {
      return config.fallback;
    }

    return [
      config.prefix,
      ...sentences,
      ...campaignSentences(campaign, config),
      config.closing,
    ].join(' ');
  } catch {
    return config.fallback;
  }
}
