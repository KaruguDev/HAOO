import type { ProductQualifyForm, QualifyField } from '../products/types';

export type QualifyValues = Record<string, string>;
export type QualifyErrors = Record<string, string>;
export type SubmissionState = 'idle' | 'submitting' | 'succeeded' | 'failed';

/** Locked UI-SPEC control copy. Every string below is rendered byte-identically. */
export const QUALIFY_SUBMIT_LABEL = 'Send my details';
export const QUALIFY_SUBMITTING_LABEL = 'Sending…';
export const QUALIFY_SUMMARY_HEADING = 'There is a problem';

/**
 * Text routed through the persistently mounted status region. Each string describes a
 * browser-observable event: `Your details were sent.` reports what this page did, never
 * what a mailbox received.
 */
export const QUALIFY_STATUS_MESSAGES: Readonly<Record<SubmissionState, string>> = {
  idle: '',
  submitting: 'Sending your details…',
  succeeded: 'Your details were sent.',
  failed: "We couldn't send your details.",
};

/**
 * Request budget. `fetch` has no default timeout in any browser, so a request that never
 * settles is treated as a failure so the direct-contact recovery panel remains reachable.
 */
export const QUALIFY_REQUEST_TIMEOUT_MS = 15_000;
export const HONEYPOT_NAME = '_honey';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The single requiredness seam used by labels, attributes, validation and announcements. */
export function isFieldRequired(field: QualifyField, values: QualifyValues): boolean {
  if (field.required) {
    return true;
  }

  const rule = field.requiredWhen;

  if (!rule) {
    return false;
  }

  return rule.values.includes(values[rule.field] ?? '');
}

/**
 * The email label the disclosed engagement summary is delivered under. It is reserved
 * below rather than treated as an ordinary field label: the summary is written by this
 * page, not by the visitor, so a product field claiming the same label would either
 * overwrite it or put a visitor-supplied value under a name the recipient reads as
 * page-generated context.
 */
export const ENGAGEMENT_SUMMARY_LABEL = 'HAOO engagement context';

/** Labels that product fields must never be allowed to override. */
export const RESERVED_EMAIL_LABELS: ReadonlySet<string> = new Set([
  '_subject',
  '_template',
  '_captcha',
  '_honey',
  '_cc',
  '_next',
  '_autoresponse',
  '_replyto',
  'Source',
  ENGAGEMENT_SUMMARY_LABEL,
]);

/**
 * Build the provider request without allowing visitor input to become provider options.
 *
 * `summary` is the optional disclosed engagement summary. It is appended last, after
 * `Source`, and only when it carries text: an empty summary is omitted rather than sent
 * as a blank row in the delivered email. Two-argument callers are unaffected.
 */
export function buildSubmissionBody(
  values: QualifyValues,
  qualify: ProductQualifyForm,
  summary?: string,
): Record<string, string> {
  const body: Record<string, string> = {
    _subject: qualify.subject,
    _template: 'table',
    _captcha: 'false',
    _honey: values[HONEYPOT_NAME] ?? '',
  };

  for (const field of qualify.fields) {
    if (RESERVED_EMAIL_LABELS.has(field.emailLabel)) {
      throw new Error(
        `Field "${field.name}" uses reserved email label "${field.emailLabel}"`,
      );
    }

    const value = (values[field.name] ?? '').trim();

    if (value !== '') {
      body[field.emailLabel] = value;
    }
  }

  body.Source = qualify.sourceNote;

  if (typeof summary === 'string' && summary.trim() !== '') {
    const label = qualify.engagementSummary.emailLabel;

    // The label the summary ships under must itself be reserved, or a product field
    // could legitimately claim it and the loop above would not object.
    if (!RESERVED_EMAIL_LABELS.has(label)) {
      throw new Error(`Engagement summary uses unreserved email label "${label}"`);
    }

    body[label] = summary;
  }

  return body;
}

/** Validate controlled form state before admitting a provider request. */
export function validateQualifyValues(
  values: QualifyValues,
  qualify: ProductQualifyForm,
): QualifyErrors {
  const errors: QualifyErrors = {};

  for (const field of qualify.fields) {
    const raw = values[field.name] ?? '';
    const value = raw.trim();

    if (isFieldRequired(field, values) && value === '') {
      errors[field.name] = field.requiredMessage;
      continue;
    }

    if (value === '') {
      continue;
    }

    if (typeof field.maxLength === 'number' && raw.length > field.maxLength) {
      errors[field.name] =
        field.lengthMessage ?? field.formatMessage ?? field.requiredMessage;
      continue;
    }

    if (field.control === 'select') {
      const allowed = (field.options ?? []).map((option) => option.value);

      if (!allowed.includes(raw)) {
        errors[field.name] = field.formatMessage ?? field.requiredMessage;
      }

      continue;
    }

    const pattern = field.formatPattern
      ? new RegExp(field.formatPattern)
      : field.control === 'email'
        ? EMAIL_PATTERN
        : null;

    if (pattern && !pattern.test(value)) {
      errors[field.name] =
        field.formatMessage ?? field.lengthMessage ?? field.requiredMessage;
    }
  }

  return errors;
}
