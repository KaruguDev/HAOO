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
}
