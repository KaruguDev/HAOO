import { type FormEvent, useEffect, useRef, useState } from 'react';
import type {
  ProductContacts,
  ProductQualifyForm,
  QualifyField,
} from '../products/types';

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
const HONEYPOT_NAME = '_honey';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2';
const controlClasses = `w-full min-h-11 rounded-lg border border-[#6E7A94] bg-white px-3 py-2 text-base font-normal leading-6 text-[#18275F] hover:border-[#5F6B84] ${focusClasses}`;

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
 * Computed requiredness. The tracer answers from the static flag; a later plan teaches
 * this one function to interpret the generic `requiredWhen` descriptor, so every caller
 * — label suffix, native attribute, `aria-required` and validation — flips together.
 */
export function isFieldRequired(field: QualifyField, _values: QualifyValues): boolean {
  void _values;

  return field.required;
}

/**
 * Pure provider-request descriptor. Emits only the provider options this product needs
 * plus one readable key per supplied field. `_cc`, `_next`, `_autoresponse` and
 * `_replyto` are never emitted under any condition: the recipient is fixed in build
 * data and no visitor-supplied value may reach a header-shaped option.
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

    if (field.control === 'email') {
      const pattern = field.formatPattern ? new RegExp(field.formatPattern) : EMAIL_PATTERN;

      if (!pattern.test(value)) {
        errors[field.name] =
          field.formatMessage ?? field.lengthMessage ?? field.requiredMessage;
      }
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

export default function QualifyForm({ qualify }: QualifyFormProps) {
  const [values, setValues] = useState<QualifyValues>(() => seedValues(qualify));
  const [errors, setErrors] = useState<QualifyErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [state, setState] = useState<SubmissionState>('idle');
  // Synchronous concurrency authority. React state and the native disabled attribute
  // are visual and assistive feedback, never the guard that admits a request.
  const inFlightRef = useRef(false);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const confirmationRef = useRef<HTMLHeadingElement | null>(null);

  const invalidFields = qualify.fields.filter((field) => errors[field.name]);

  useEffect(() => {
    if (invalidFields.length > 0) {
      summaryRef.current?.focus();
    }
    // The summary container is the single invalid-submit focus target; a later plan
    // adds an attempt counter here so an unchanged error set still re-announces.
  }, [errors, invalidFields.length]);

  useEffect(() => {
    if (state === 'succeeded') {
      confirmationRef.current?.focus();
    }
  }, [state]);

  function setValue(name: string, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlightRef.current) {
      return;
    }

    const nextErrors = validateQualifyValues(values, qualify);

    setSubmitted(true);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    inFlightRef.current = true;
    setState('submitting');

    try {
      const response = await fetch(qualify.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(buildSubmissionBody(values, qualify)),
      });

      // Terminal state comes from the response status alone. The provider body is
      // never read, so a provider body change cannot make this page claim a send.
      setState(response.ok ? 'succeeded' : 'failed');
    } catch {
      setState('failed');
    } finally {
      inFlightRef.current = false;
    }
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

  const statusMessage = QUALIFY_STATUS_MESSAGES[state];

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
            {QUALIFY_STATUS_MESSAGES.succeeded}
          </p>
        </div>
      ) : (
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

          <button
            type="submit"
            disabled={state === 'submitting'}
            className={`mt-8 inline-flex w-full min-h-11 items-center justify-center rounded-lg bg-[#4054C6] px-5 py-3 text-sm font-semibold leading-[1.4] text-white hover:bg-[#3345A7] active:bg-[#29388A] disabled:cursor-wait disabled:opacity-70 md:w-auto ${focusClasses}`}
          >
            {state === 'submitting' ? QUALIFY_SUBMITTING_LABEL : QUALIFY_SUBMIT_LABEL}
          </button>
        </form>
      )}

      {/* Mounted unconditionally from first render and kept outside the form card: the
          card is replaced on success, so a region inside it would unmount at the exact
          moment it needs to announce. Only the text changes — never the role. */}
      <p role="status" className="mt-4 min-h-[1.5rem] text-sm font-normal leading-[1.4] text-[#5F6B84]">
        {statusMessage}
      </p>
    </div>
  );
}
