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

export interface ProductQualifyForm {
  readonly endpoint: string;
  readonly subject: string;
  readonly sourceNote: string;
  readonly collectionNote?: QualifyCollectionNote;
  readonly fields: readonly QualifyField[];
  readonly groups: readonly QualifyFieldGroup[];
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
}
