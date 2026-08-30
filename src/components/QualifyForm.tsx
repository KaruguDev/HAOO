import { type FormEvent, useEffect, useRef, useState } from 'react';
import type {
  ProductContacts,
  ProductQualifyForm,
  QualifyField,
} from '../products/types';
import {
  qualifyContactActionLabels,
  qualifyConfirmationBody,
} from '../products/copy';
import QualifyFallback from './QualifyFallback';

interface QualifyFormProps {
  readonly qualify: ProductQualifyForm;
  readonly contacts: ProductContacts;
  readonly productName: string;
}

type QualifyValues = Record<string, string>;
type QualifyErrors = Record<string, string>;
type SubmissionState = 'idle' | 'submitting' | 'succeeded' | 'failed';

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

const QUALIFY_CONFIRMATION_HEADING = 'Your details are on their way';
/**
 * Request budget. `fetch` has no default timeout in any browser, so a request that never
 * settles — a captive portal, a dropped mobile connection, a hung provider — would
 * otherwise hold the in-flight guard and the `submitting` state forever, and the
 * recovery panel offering the product's direct contact routes renders only in the failed
 * state. A stall is therefore treated as a failure, so recovery stays reachable on
 * exactly the network conditions those routes exist for.
 */
export const QUALIFY_REQUEST_TIMEOUT_MS = 15_000;
const HONEYPOT_NAME = '_honey';
const COLLECTION_NOTE_ID = 'qualify-collection-note';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2';
const controlClasses = `w-full min-h-11 rounded-lg border border-[#6E7A94] bg-white px-3 py-2 text-base font-normal leading-6 text-[#18275F] hover:border-[#5F6B84] disabled:cursor-wait disabled:opacity-70 ${focusClasses}`;

function fieldId(field: QualifyField) {
  return `qualify-${field.name}`;
}

function errorId(field: QualifyField) {
  return `qualify-${field.name}-error`;
}

function helpId(field: QualifyField) {
  return `qualify-${field.name}-help`;
}

/**
 * Computed requiredness, and the single seam every requiredness surface reads: the label
 * suffix, the native attribute, `aria-required`, the validator and the announcement all
 * call this one function, so they cannot drift apart.
 *
 * A base-required field is always required. Otherwise the optional `requiredWhen`
 * descriptor is evaluated generically — read the controlling field named by the
 * descriptor and test the current value for exact membership in the configured trigger
 * list. This component recognises no field name and no option value of any product.
 */
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
 * The announcement for a descriptor that has just started matching, with `{value}`
 * replaced by the controlling value the visitor selected. Returns an empty string when
 * no descriptor controlled by `changed` matches, which is how the reversal clears the
 * region rather than leaving a stale sentence behind.
 */
function requirednessAnnouncement(
  qualify: ProductQualifyForm,
  changed: string,
  values: QualifyValues,
): string {
  for (const field of qualify.fields) {
    const rule = field.requiredWhen;

    if (rule?.field !== changed) {
      continue;
    }

    if (isFieldRequired(field, values)) {
      return rule.message.replace('{value}', values[rule.field] ?? '');
    }
  }

  return '';
}

/**
 * Every key this function owns: the provider options it seeds, the derived `Source` note
 * it appends, and the header-shaped options it must never emit. A product field claiming
 * any of them would either overwrite a spam control, destroy the source note, or — for
 * `_cc`, `_next`, `_autoresponse` and `_replyto` — route a *visitor-supplied* value into
 * a provider option that redirects or replies to mail.
 */
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
 * Pure provider-request descriptor. Emits only the provider options this product needs
 * plus one readable key per supplied field. `_cc`, `_next`, `_autoresponse` and
 * `_replyto` are never emitted under any condition, and that prohibition is enforced
 * here against `RESERVED_EMAIL_LABELS` rather than inferred from the current product's
 * data: a misconfigured field fails the request loudly instead of quietly handing a
 * header-shaped option to a visitor.
 */
export function buildSubmissionBody(
  values: QualifyValues,
  qualify: ProductQualifyForm,
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

  return body;
}

/**
 * Pure validator run against controlled state immediately before the request, so a
 * programmatically over-bound value or a manipulated select value issues zero requests
 * rather than relying on native attributes the page deliberately disables.
 */
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

    // A configured pattern applies to any free-text control, so a product can express a
    // format rule without this component learning what the field means. An email control
    // with no configured pattern falls back to the shared shape check.
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

function seedValues(qualify: ProductQualifyForm): QualifyValues {
  const seeded: QualifyValues = { [HONEYPOT_NAME]: '' };

  for (const field of qualify.fields) {
    seeded[field.name] = '';
  }

  return seeded;
}

export default function QualifyForm({ contacts, productName, qualify }: QualifyFormProps) {
  const [values, setValues] = useState<QualifyValues>(() => seedValues(qualify));
  const [errors, setErrors] = useState<QualifyErrors>({});
  const [submitted, setSubmitted] = useState(false);
  // Counts invalid submit attempts only. The focus move is keyed on this integer and
  // never on `errors`, for two reasons: a second invalid submit with an unchanged error
  // set must still re-announce, and correcting a field while typing must never pull
  // focus out of the control the visitor is working in.
  const [attempts, setAttempts] = useState(0);
  // A requiredness-change sentence awaiting announcement. It shares the one mounted
  // status region with the submission states: a starting submission clears it and owns
  // the region, and a terminal message holds the region only until the next requiredness
  // change. The form stays mounted and editable after a failure, so a stale
  // "we couldn't send" must never suppress a live announcement. The region never holds
  // two messages and is never duplicated.
  const [notice, setNotice] = useState('');
  const [state, setState] = useState<SubmissionState>('idle');
  // Synchronous concurrency authority. React state and the native disabled attribute
  // are visual and assistive feedback, never the guard that admits a request.
  const inFlightRef = useRef(false);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const confirmationRef = useRef<HTMLHeadingElement | null>(null);
  const failureRef = useRef<HTMLHeadingElement | null>(null);

  const invalidFields = qualify.fields.filter((field) => errors[field.name]);
  const contactActions = qualifyContactActionLabels(productName, contacts);

  useEffect(() => {
    if (attempts === 0) {
      return;
    }

    // The summary container is the single invalid-submit focus target. The counter is
    // incremented only by an invalid submit, so the summary is always rendered by the
    // time this runs, and every attempt — including a repeat of the same errors —
    // re-announces it.
    summaryRef.current?.focus();
  }, [attempts]);

  useEffect(() => {
    if (state === 'succeeded') {
      confirmationRef.current?.focus();
    } else if (state === 'failed') {
      failureRef.current?.focus();
    }
  }, [state]);

  function setValue(name: string, value: string) {
    const nextValues = { ...values, [name]: value };

    setValues(nextValues);

    // A requiredness rule that just started matching is announced through the region
    // already mounted below; one that stopped matching clears it. Attribute flips on a
    // control the visitor is not focused on are not announced by assistive technology,
    // so the sentence is the announcement.
    setNotice(requirednessAnnouncement(qualify, name, nextValues));

    // Before the first submit attempt nothing complains, so there is nothing to
    // reconcile. After it, the edited field alone is re-validated against the one pure
    // validator and its message is added, replaced or removed in place — the summary
    // updates with it because both surfaces read the same errors object.
    if (!submitted) {
      return;
    }

    const fresh = validateQualifyValues(nextValues, qualify);

    setErrors((previous) => {
      const next = { ...previous };

      if (fresh[name]) {
        next[name] = fresh[name];
      } else {
        delete next[name];
      }

      // Dependents are reconciled in both directions. A field this edit stopped
      // requiring drops its now-unreachable message; one it just started requiring gains
      // its message here rather than at the next submit, because the summary is
      // presented as the authoritative problem list and must not under-report. Either
      // way the field keeps any message it still earns on its own, and its typed value.
      for (const field of qualify.fields) {
        if (field.requiredWhen?.field !== name) {
          continue;
        }

        if (fresh[field.name]) {
          next[field.name] = fresh[field.name];
        } else {
          delete next[field.name];
        }
      }

      return next;
    });
  }

  async function submitValues() {
    if (inFlightRef.current) {
      return;
    }

    const nextErrors = validateQualifyValues(values, qualify);

    setSubmitted(true);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      // A submission blocked by validation is not a transport event. Returning to the
      // neutral state unmounts a recovery panel left over from an earlier failure and
      // clears its status text, so the summary is the single reported problem rather
      // than one of two contradictory ones.
      setState('idle');
      setAttempts((previous) => previous + 1);

      return;
    }

    inFlightRef.current = true;
    // The region is handed to the submission for the duration; a requiredness sentence
    // left over from the last edit must not survive into the terminal message.
    setNotice('');
    setState('submitting');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), QUALIFY_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(qualify.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(buildSubmissionBody(values, qualify)),
        signal: controller.signal,
      });

      // Terminal state comes from the response status alone. The provider body is
      // never read, so a provider body change cannot make this page claim a send.
      setState(response.ok ? 'succeeded' : 'failed');
    } catch {
      // An abort arrives here like any other transport error, so a stalled request ends
      // in the one state that mounts the recovery panel rather than in a dead spinner.
      setState('failed');
    } finally {
      clearTimeout(timeout);
      inFlightRef.current = false;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitValues();
  }

  function renderControl(field: QualifyField, required: boolean) {
    const describedBy = [
      field.help ? helpId(field) : '',
      errors[field.name] ? errorId(field) : '',
    ]
      .filter((token) => token !== '')
      .join(' ');
    const shared = {
      id: fieldId(field),
      name: field.name,
      value: values[field.name] ?? '',
      required,
      'aria-required': required,
      'aria-invalid': errors[field.name] ? true : undefined,
      'aria-describedby': describedBy === '' ? undefined : describedBy,
      autoComplete: field.autoComplete,
      // The request body was serialised from the values captured when the submission
      // started, so an edit accepted during the request window would be absent from the
      // request already in flight and then destroyed with the form subtree on success.
      // Locking the controls makes that window visibly read-only rather than silently
      // discarding a correction the visitor believes was sent.
      disabled: state === 'submitting',
      className: controlClasses,
    } as const;

    if (field.control === 'select') {
      return (
        <select
          {...shared}
          onChange={(event) => setValue(field.name, event.target.value)}
        >
          <option value="">{field.placeholderOption}</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.control === 'textarea') {
      return (
        <textarea
          {...shared}
          rows={field.rows}
          maxLength={field.maxLength}
          onChange={(event) => setValue(field.name, event.target.value)}
        />
      );
    }

    return (
      <input
        {...shared}
        type={field.control}
        maxLength={field.maxLength}
        onChange={(event) => setValue(field.name, event.target.value)}
      />
    );
  }

  function renderField(field: QualifyField) {
    const required = isFieldRequired(field, values);
    const message = errors[field.name];

    return (
      <div key={field.name} className="mb-6 last:mb-0">
        <label
          htmlFor={fieldId(field)}
          className="mb-1 block text-sm font-semibold leading-[1.4] text-[#18275F]"
        >
          {field.label}
          {required ? null : (
            <span className="font-normal text-[#5F6B84]"> (optional)</span>
          )}
        </label>
        {field.help ? (
          <p
            id={helpId(field)}
            className="mb-1 text-sm font-normal leading-[1.4] text-[#5F6B84]"
          >
            {field.help}
          </p>
        ) : null}
        {renderControl(field, required)}
        {message ? (
          <p
            id={errorId(field)}
            className="mt-1 text-sm font-semibold leading-[1.4] text-[#B00020]"
          >
            <span className="sr-only">Error: </span>
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  // A live requiredness announcement outranks an already-read terminal message, because
  // `state` never returns to `idle` once a submission has been attempted and the form
  // remains editable afterwards. Only `submitting` is absolute: nothing may displace the
  // in-progress message while the request is open.
  const statusMessage =
    notice !== '' && state !== 'submitting' ? notice : QUALIFY_STATUS_MESSAGES[state];

  return (
    <div className="mt-6">
      {state === 'succeeded' ? (
        <div className="max-w-[560px] rounded-2xl border border-[#DFE4F0] bg-[#E9EDFF] p-6 text-[#18275F] md:p-8">
          <h3
            ref={confirmationRef}
            tabIndex={-1}
            className={`text-[28px] font-semibold leading-[1.2] ${focusClasses}`}
          >
            {QUALIFY_CONFIRMATION_HEADING}
          </h3>
          <p className="mt-2 text-base font-normal leading-6">
            {qualifyConfirmationBody(productName)}
          </p>
          <p className="mt-6 text-base font-semibold leading-6">Need an answer sooner?</p>
          <div className="mt-2 grid gap-1">
            <a
              href={contactActions.message.href}
              className={`inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold leading-[1.4] text-[#4054C6] hover:underline ${focusClasses}`}
            >
              {contactActions.message.label}
            </a>
            <a
              href={contactActions.call.href}
              className={`inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold leading-[1.4] text-[#4054C6] hover:underline ${focusClasses}`}
            >
              {contactActions.call.label}
            </a>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 max-w-[560px] text-sm font-normal leading-[1.4] text-[#5F6B84]">
            All fields are required unless marked optional.
          </p>
          <form
            noValidate
            onSubmit={handleSubmit}
            className="relative max-w-[560px] rounded-2xl border border-[#DFE4F0] bg-white p-6 md:p-8"
          >
          <div
            aria-hidden="true"
            className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
          >
            <label htmlFor="qualify-website">Leave this field blank</label>
            <input
              id="qualify-website"
              type="text"
              name={HONEYPOT_NAME}
              tabIndex={-1}
              autoComplete="off"
              value={values[HONEYPOT_NAME] ?? ''}
              onChange={(event) => setValue(HONEYPOT_NAME, event.target.value)}
            />
          </div>

          {submitted && invalidFields.length > 0 ? (
            <div
              ref={summaryRef}
              tabIndex={-1}
              className={`mb-8 rounded-2xl border-2 border-[#B00020] bg-[#FFF5F5] p-4 ${focusClasses}`}
            >
              <div role="alert">
                <h3 className="text-base font-semibold leading-6 text-[#18275F]">
                  {QUALIFY_SUMMARY_HEADING}
                </h3>
                <ul className="mt-2 list-none p-0">
                  {invalidFields.map((field) => (
                    <li key={field.name} className="mt-1 first:mt-0">
                      <a
                        href={`#${fieldId(field)}`}
                        className={`text-sm font-semibold leading-[1.4] text-[#B00020] underline ${focusClasses}`}
                      >
                        {errors[field.name]}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {qualify.groups.map((group) => (
            <fieldset key={group.legend} className="mb-8 border-0 p-0 last:mb-0">
              <legend className="mb-4 text-base font-semibold leading-6 text-[#18275F]">
                {group.legend}
              </legend>
              {group.fieldNames.map((name) => {
                const field = qualify.fields.find((candidate) => candidate.name === name);

                return field ? renderField(field) : null;
              })}
            </fieldset>
          ))}

            {qualify.collectionNote ? (
              <div
                id={COLLECTION_NOTE_ID}
                className="mt-8 rounded-lg border border-[#DFE4F0] bg-[#FBFCFF] p-4 text-sm font-normal leading-[1.4] text-[#5F6B84]"
              >
                <p>{qualify.collectionNote.purpose}</p>
                <p className="mt-3">{qualify.collectionNote.pageContext}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={state === 'submitting'}
              aria-describedby={qualify.collectionNote ? COLLECTION_NOTE_ID : undefined}
              className={`mt-8 inline-flex w-full min-h-11 items-center justify-center rounded-lg bg-[#4054C6] px-5 py-3 text-sm font-semibold leading-[1.4] text-white hover:bg-[#3345A7] active:bg-[#29388A] disabled:cursor-wait disabled:opacity-70 md:w-auto ${focusClasses}`}
            >
              {state === 'submitting' ? QUALIFY_SUBMITTING_LABEL : QUALIFY_SUBMIT_LABEL}
            </button>
          </form>
        </>
      )}

      {state === 'failed' ? (
        <QualifyFallback
          contacts={contacts}
          headingRef={failureRef}
          onRetry={() => void submitValues()}
          productName={productName}
        />
      ) : null}

      {/* Mounted unconditionally from first render and kept outside the form card: the
          card is replaced on success, so a region inside it would unmount at the exact
          moment it needs to announce. Only the text changes — never the role. */}
      <p role="status" className="mt-4 min-h-[1.5rem] text-sm font-normal leading-[1.4] text-[#5F6B84]">
        {statusMessage}
      </p>
    </div>
  );
}
