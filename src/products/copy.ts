import type { ProductContacts } from './types';

function requireIdentity(value: string, field: 'name' | 'slug') {
  if (value.trim() === '') {
    throw new Error(`Product ${field} must not be empty`);
  }

  return value;
}

export function skipToContentLabel(productName: string) {
  return `Skip to ${requireIdentity(productName, 'name')} content`;
}

export function sectionsNavLabel(productName: string) {
  return `${requireIdentity(productName, 'name')} sections`;
}

export function mobileSectionsNavLabel(productName: string) {
  return `${requireIdentity(productName, 'name')} mobile sections`;
}

export function navigationToggleLabel(productName: string, open: boolean) {
  return `${open ? 'Close' : 'Open'} ${requireIdentity(productName, 'name')} navigation`;
}

export function whatsappActionLabel(productName: string) {
  return `Chat with ${requireIdentity(productName, 'name')} on WhatsApp`;
}

export function whatsappFallbackActionLabel(productName: string) {
  return `Message ${requireIdentity(productName, 'name')} on WhatsApp instead`;
}

export function phoneFallbackActionLabel(
  productName: string,
  phoneDisplay: string,
) {
  return `Call ${requireIdentity(productName, 'name')} on ${phoneDisplay} instead`;
}

export function emailFallbackActionLabel(productName: string, email: string) {
  return `Email ${requireIdentity(productName, 'name')} at ${email} instead`;
}

export function qualifyContactActionLabels(
  productName: string,
  contacts: ProductContacts,
) {
  return {
    message: {
      href: contacts.whatsappHref,
      label: whatsappFallbackActionLabel(productName),
    },
    call: {
      href: contacts.phoneHref,
      label: phoneFallbackActionLabel(productName, contacts.phoneDisplay),
    },
  } as const;
}

export function qualifyFallbackBody(productName: string) {
  return `Something went wrong between this page and our email provider. Your answers are still here, so you can try again — or reach ${requireIdentity(productName, 'name')} directly.`;
}

export function qualifyConfirmationBody(productName: string) {
  return `We've sent your name, contact details, and the answers you gave to the ${requireIdentity(productName, 'name')} team. Someone will reply within one business day.`;
}

/**
 * The written-enquiry alternative offered beside the assisted contacts. The visible
 * label is locked by the UI-SPEC and carries no product name, but the identity is
 * still guarded here so a shell rendered for a nameless product fails closed exactly
 * like every other copy builder rather than silently shipping an orphan link.
 */
export function qualifyEntryPointLabel(productName: string) {
  requireIdentity(productName, 'name');

  return 'Send your details instead';
}

export function selfOnboardingLead(productName: string) {
  return `Continue to ${requireIdentity(productName, 'name')}'s platform for self-onboarding.`;
}

export function selfOnboardingActionLabel(productName: string) {
  return `Start with ${requireIdentity(productName, 'name')}`;
}

export function brochureLead(productName: string) {
  return `The overview above is the complete ${requireIdentity(productName, 'name')} explanation. Open or download the original brochure PDF if you prefer the printed document.`;
}

export function brochureFallbackBody(productName: string) {
  return `You can still open the ${requireIdentity(productName, 'name')} brochure in a new tab or download the PDF.`;
}

export function parentRelationshipLine(productName: string) {
  return `${requireIdentity(productName, 'name')} is a ZERO-PAPER HUB product`;
}

export function contentAnchorId(slug: string) {
  return `${requireIdentity(slug, 'slug')}-content`;
}

export function mobileNavigationId(slug: string) {
  return `${requireIdentity(slug, 'slug')}-mobile-navigation`;
}
