import type { ProductQualifyForm, QualifyField } from '../products/types';

export type QualifyValues = Record<string, string>;
export type QualifyErrors = Record<string, string>;
/**
 * `blocked` is the state for a submission this page refused to start: the request body
 * could not be assembled, so nothing was sent and no provider round-trip happened. It is
 * separate from `failed` because `failed` reports a transport event, and reporting one
 * that never occurred would be a claim this page cannot support.
 */
export type SubmissionState =
  | 'idle'
  | 'submitting'
  | 'succeeded'
  | 'failed'
  | 'blocked';

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
  blocked: "We couldn't send your details.",
};

/**
 * Request budget. `fetch` has no default timeout in any browser, so a request that never
 * settles is treated as a failure so the direct-contact recovery panel remains reachable.
 */
export const QUALIFY_REQUEST_TIMEOUT_MS = 15_000;
export const HONEYPOT_NAME = '_honey';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Whether a parsed provider response body reports that the provider accepted the
 * submission. Together with an OK status, this is the only thing that may put the page
 * in `succeeded`.
 *
 * L2-O1. The page used to take its terminal state from the HTTP status alone and never
 * read the body. The aim was that no provider body could make the page claim a send.
 * Measured live on 2026-09-13T00:30:34.768Z (plan 05-06), FormSubmit answered HTTP 200
 * with `{"success":"false","message":"This form needs Activation. ..."}` and the page
 * announced `Your details were sent.`. Ignoring the body produced exactly the false send
 * that design set out to rule out.
 *
 * The aim is kept and the mechanism reversed. Only an explicit acceptance counts: an
 * object whose `success` is the string `'true'` (FormSubmit's AJAX answer, as observed)
 * or boolean `true`. A missing, unreadable or unexpected body is not acceptance. A later
 * provider body change can therefore cause a false failure, which the recovery panel
 * makes visible and recoverable, but never a false send.
 *
 * Case-sensitive by decision. `'TRUE'` and `' true'` have never been observed, and an
 * unobserved shape is an unexpected body.
 */
export function isProviderAcceptance(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const success = (body as { readonly success?: unknown }).success;

  return success === 'true' || success === true;
}

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
]);

/**
 * The engagement summary is written by this page, not by the visitor, so the label it
 * ships under must be claimable by nothing else: a product field carrying the same label
 * would either be overwritten by the summary or put a visitor-supplied value under a name
 * the recipient reads as page-generated context.
 *
 * The rule is structural, so it holds for every product's own wording. Naming one
 * product's label here instead would make a second product's summary throw on every
 * submission -- at visitor-submit time, with the enquiry already typed and then lost.
 *
 * Call this once from a product module so a misconfigured product fails at import rather
 * than in front of a visitor.
 */
export function assertEngagementSummaryLabel(qualify: ProductQualifyForm): void {
  const label = qualify.engagementSummary.emailLabel;

  if (label.trim() === '') {
    throw new Error('Engagement summary email label is empty');
  }

  if (RESERVED_EMAIL_LABELS.has(label)) {
    throw new Error(`Engagement summary uses reserved email label "${label}"`);
  }

  const claimed = qualify.fields.find((field) => field.emailLabel === label);
  if (claimed !== undefined) {
    throw new Error(
      `Engagement summary label "${label}" collides with field "${claimed.name}"`,
    );
  }
}

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
    // The same structural rule the product module asserts at import, re-checked here so
    // this function is safe standalone. It admits any product's own wording and refuses
    // only a label something else could legitimately own.
    assertEngagementSummaryLabel(qualify);
    body[qualify.engagementSummary.emailLabel] = summary;
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
