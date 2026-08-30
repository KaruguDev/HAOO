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

/**
 * Confirmation body. Every claim here is browser-observable: the page saw the provider
 * accept the request, which is not proof that a mailbox received it. The response-time
 * sentence is therefore phrased as the visitor's fallback trigger, never as a delivery
 * receipt or an unconditional promise the page cannot observe.
 */
export function qualifyConfirmationBody(productName: string) {
  requireIdentity(productName, 'name');

  return "Your details were submitted. If you don't hear back within one business day, use one of the contacts below.";
}

export function qualifyCollectionNotePurpose(productName: string) {
  return `We use these details only to reply to you about ${requireIdentity(productName, 'name')} onboarding. We never sell them or add you to a mailing list.`;
}

/**
 * Forward-looking disclosure. The page-use summary it describes is not built yet, so the
 * sentence is written in the future tense: a privacy notice must never describe
 * collection that does not occur. The tense flips to present in the same change that
 * adds the summary to the request body, so the notice and the payload land together.
 */
export function qualifyCollectionNotePageContext(productName: string) {
  const name = requireIdentity(productName, 'name');

  return `In future, a short summary of how you used this ${name} page will be included with your details. It will be coarse and anonymous — it will never include your message text, exact portfolio numbers, or any identifier that follows you across sites.`;
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
