import type { LastSeenBand, VisitBand } from '../measurement';

export interface ProductStoryItem {
  readonly title: string;
  readonly description: string;
}

export type ProductCapabilityIcon =
  | 'payments'
  | 'properties'
  | 'leases'
  | 'maintenance'
  | 'marketplace'
  | 'reports';

export interface ProductCapability extends ProductStoryItem {
  readonly icon: ProductCapabilityIcon;
}

export interface ProductImage {
  readonly href: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

export interface ProductMedia {
  readonly logo?: ProductImage;
  readonly hero?: ProductImage;
}

export interface ProductContacts {
  readonly phoneDisplay: string;
  readonly phoneNumber: string;
  readonly phoneHref: string;
  readonly email: string;
  readonly emailHref: string;
  readonly whatsappStarterText: string;
  readonly whatsappHref: string;
  readonly selfOnboardingDisplay: string;
  readonly selfOnboardingHref: string;
}

export interface ProductBrochure {
  readonly pdfHref: string;
  readonly previewImageHref: string;
  readonly previewImageAlt: string;
  readonly previewImageWidth: number;
  readonly previewImageHeight: number;
  readonly downloadName: string;
  readonly expectationLabel: string;
}

export type QualifyControl = 'text' | 'email' | 'tel' | 'select' | 'textarea';

export interface QualifyOption {
  readonly value: string;
  readonly label: string;
}

export interface QualifyRequiredWhen {
  readonly field: string;
  readonly values: readonly string[];
  readonly message: string;
}

export interface QualifyField {
  readonly name: string;
  readonly label: string;
  readonly emailLabel: string;
  readonly control: QualifyControl;
  readonly required: boolean;
  readonly requiredMessage: string;
  readonly autoComplete?: string;
  readonly maxLength?: number;
  readonly rows?: number;
  readonly options?: readonly QualifyOption[];
  readonly placeholderOption?: string;
  readonly help?: string;
  readonly formatPattern?: string;
  readonly formatMessage?: string;
  readonly lengthMessage?: string;
  readonly requiredWhen?: QualifyRequiredWhen;
}

export interface QualifyFieldGroup {
  readonly legend: string;
  readonly fieldNames: readonly string[];
}

export interface QualifyCollectionNote {
  readonly purpose: string;
  readonly processor: string;
  readonly pageContext: string;
}

/** One interaction flag paired with the sentence the owner approved for it. */
export interface EngagementFlagSentence {
  readonly flag: string;
  readonly sentence: string;
}

/** One normalized campaign key paired with the word that introduces it. */
export interface EngagementCampaignClause {
  readonly key: string;
  readonly label: string;
}

/**
 * The campaign clause is assembled rather than templated so an absent key omits only
 * its own clause: there is no placeholder for a value that was never in the address bar.
 */
export interface EngagementCampaignSentence {
  readonly lead: string;
  readonly clauses: readonly EngagementCampaignClause[];
  readonly separator: string;
  readonly terminator: string;
}

/**
 * Every sentence the emailed engagement summary can contain, as owner-approved product
 * data. The formatter that assembles them holds no copy of its own, so the summary a
 * recipient reads is exactly what the product owner signed off — never a score, a rank,
 * a weighting, or any value derived from the visitor's own answers.
 *
 * The band maps are keyed by the closed unions, so an unauthored band is a typecheck
 * failure rather than an empty sentence in a delivered email.
 */
export interface ProductEngagementSummary {
  readonly emailLabel: string;
  readonly prefix: string;
  readonly visitBandSentences: Readonly<Record<VisitBand, string>>;
  readonly lastSeenSentences: Readonly<Record<LastSeenBand, string>>;
  readonly flagSentences: readonly EngagementFlagSentence[];
  readonly noFlagsSentence: string;
  readonly campaignSentence: EngagementCampaignSentence;
  readonly closing: string;
  readonly fallback: string;
}

export interface ProductQualifyForm {
  readonly endpoint: string;
  readonly subject: string;
  readonly sourceNote: string;
  readonly collectionNote?: QualifyCollectionNote;
  readonly engagementSummary: ProductEngagementSummary;
  readonly fields: readonly QualifyField[];
  readonly groups: readonly QualifyFieldGroup[];
}

export type MeasurementProvider = 'none';

export interface ProductMeasurementDisclosure<EventName extends string> {
  readonly summary: string;
  readonly intro: string;
  readonly signalsHeading: string;
  readonly signalLines: Readonly<Record<EventName, string>>;
  readonly signalBoundary: string;
  readonly browserHeading: string;
  readonly browserFacts: readonly [string, string, string, string, string];
  readonly browserBoundary: string;
  readonly campaignHeading: string;
  readonly campaignDescription: string;
  readonly neverCollectedHeading: string;
  readonly neverCollected: readonly string[];
  /**
   * The four parts of the group that describes what the emailed engagement summary
   * contains. They are required members, so a product configuration that forgets one is
   * a typecheck failure rather than a disclosure that silently renders a blank where a
   * promise about the visitor's data should be.
   */
  readonly summaryHeading: string;
  readonly summaryIntro: string;
  readonly summaryContents: readonly string[];
  readonly summaryBoundary: string;
  readonly clearLabel: string;
  readonly clearSuccess: string;
  readonly clearBlocked: string;
}

export interface ProductMeasurement<EventName extends string = string> {
  readonly productKey: string;
  readonly storageKey: string;
  readonly schemaVersion: number;
  readonly events: readonly EventName[];
  readonly pageViewEvent: EventName;
  readonly interactionEvents: {
    readonly brochurePreview: EventName;
    readonly brochureOpen: EventName;
    readonly brochureDownload: EventName;
    readonly qualifyStart: EventName;
    readonly qualifySubmit: EventName;
    readonly assistedWhatsapp: EventName;
    readonly assistedPhone: EventName;
    readonly assistedEmail: EventName;
    readonly selfOnboarding: EventName;
  };
  readonly interactionFlags: readonly string[];
  readonly interactionEventFlags: Readonly<Partial<Record<EventName, string>>>;
  readonly provider: MeasurementProvider;
  readonly disclosure: ProductMeasurementDisclosure<EventName>;
}

export interface ProductDefinition {
  readonly slug: string;
  readonly name: string;
  readonly relationship: string;
  readonly outcome: string;
  readonly audienceLead: string;
  readonly audiences: readonly string[];
  readonly painHeading: string;
  readonly benefitHeading: string;
  readonly journeyHeading: string;
  readonly pains: readonly string[];
  readonly benefits: readonly string[];
  readonly capabilities: readonly ProductCapability[];
  readonly journey: readonly ProductStoryItem[];
  readonly featureCaveat: string;
  readonly marketClaim: string;
  readonly assistedInvitation: string;
  readonly media: ProductMedia;
  readonly contacts: ProductContacts;
  readonly brochure: ProductBrochure;
  readonly qualify: ProductQualifyForm;
  readonly measurement: ProductMeasurement;
}
