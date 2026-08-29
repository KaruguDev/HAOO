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
