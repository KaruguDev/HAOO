import { type FormEvent, useEffect, useRef, useState } from 'react';
import type {
  ProductContacts,
  ProductMeasurementDisclosure,
  ProductQualifyForm,
  QualifyField,
} from '../products/types';
import {
  qualifyContactActionLabels,
  qualifyConfirmationBody,
  requireIdentity,
} from '../products/copy';
import QualifyFallback from './QualifyFallback';
import MeasurementDisclosure from './MeasurementDisclosure';
import {
  buildSubmissionBody,
  HONEYPOT_NAME,
  isFieldRequired,
  QUALIFY_REQUEST_TIMEOUT_MS,
  QUALIFY_STATUS_MESSAGES,
  QUALIFY_SUBMIT_LABEL,
  QUALIFY_SUBMITTING_LABEL,
  QUALIFY_SUMMARY_HEADING,
  validateQualifyValues,
  type QualifyErrors,
  type QualifyValues,
  type SubmissionState,
} from './qualify-form.logic';

interface QualifyFormProps {
  readonly qualify: ProductQualifyForm;
  readonly contacts: ProductContacts;
  readonly productName: string;
  /** Namespaces every DOM id this form owns. See `qualifyId`. */
  readonly slug: string;
  readonly track: (event: string) => boolean;
  readonly measurementEvents: {
    readonly start: string;
    readonly submit: string;
  };
  readonly measurementEventNames?: readonly string[];
  readonly measurementDisclosure?: ProductMeasurementDisclosure<string>;
  readonly clearMeasurementContext?: () => boolean;
}

const QUALIFY_CONFIRMATION_HEADING = 'Your details are on their way';
const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2';
/**
 * Focus this page moves by script. `:focus-visible` is a user-agent heuristic: after a
 * pointer click, a script-focused non-interactive element generally does not qualify, so
 * a `focus-visible:` ring paints nothing and focus lands somewhere the visitor cannot
 * see — a WCAG 2.4.7 failure on the exact moments this design chose to move focus. These
 * targets are never reached by keyboard traversal, so they use the modality-independent
 * `focus:` variants; genuinely interactive controls keep `focus-visible:`.
 */
const scriptFocusClasses =
  'focus:outline-none focus:ring-2 focus:ring-[#4054C6] focus:ring-offset-2';
const controlClasses = `w-full min-h-11 rounded-lg border border-[#6E7A94] bg-white px-3 py-2 text-base font-normal leading-6 text-[#18275F] hover:border-[#5F6B84] disabled:cursor-wait disabled:opacity-70 ${focusClasses}`;

/**
 * Every DOM id this form owns, namespaced by the product slug — the same pattern
 * `contentAnchorId` and `mobileNavigationId` already use. This component is built for
 * reuse, so two product forms can legitimately coexist on one page (a comparison page, a
 * combined landing page). Unnamespaced ids would silently cross-wire them: `label[for]`
 * binds to the first match, `aria-describedby` on the second form's submit button would
 * point at the first form's notice, and an error-summary link would jump the visitor
 * into the wrong form's control.
 */
function qualifyId(slug: string, suffix: string) {
  return `${requireIdentity(slug, 'slug')}-qualify-${suffix}`;
}

function fieldId(slug: string, field: QualifyField) {
  return qualifyId(slug, field.name);
}

function errorId(slug: string, field: QualifyField) {
  return qualifyId(slug, `${field.name}-error`);
}

function helpId(slug: string, field: QualifyField) {
  return qualifyId(slug, `${field.name}-help`);
}

function collectionNoteId(slug: string) {
  return qualifyId(slug, 'collection-note');
}

function honeypotId(slug: string) {
  return qualifyId(slug, 'website');
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

function seedValues(qualify: ProductQualifyForm): QualifyValues {
  const seeded: QualifyValues = { [HONEYPOT_NAME]: '' };

  for (const field of qualify.fields) {
    seeded[field.name] = '';
  }

  return seeded;
}

export default function QualifyForm({
  contacts,
  measurementEvents,
  measurementEventNames,
  measurementDisclosure,
  productName,
  qualify,
  slug,
  track,
  clearMeasurementContext,
}: QualifyFormProps) {
  const [values, setValues] = useState<QualifyValues>(() => seedValues(qualify));
  // The authoritative latest snapshot. `values` from the render closure is stale for any
  // path that writes more than one field before the next render — browser autofill and
  // password-manager fills are exactly that, and the fields carry the `autoComplete`
  // hints that invite them. A lost write to a *required* field would at least surface as
  // a validation error; a lost write to an optional one is simply absent from the
  // payload, with nothing anywhere to reveal it. Every read that must see the newest
  // value — the announcement, the reconciliation, the validator and the request body —
  // reads this ref instead of the closure.
  const valuesRef = useRef(values);
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
  const startRecordedRef = useRef(false);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const confirmationRef = useRef<HTMLHeadingElement | null>(null);
  const failureRef = useRef<HTMLHeadingElement | null>(null);

  const invalidFields = qualify.fields.filter((field) => errors[field.name]);
  const contactActions = qualifyContactActionLabels(productName, contacts);

  function handleQualifyStart() {
    if (startRecordedRef.current) return;

    startRecordedRef.current = true;
    track(measurementEvents.start);
  }

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
    const nextValues = { ...valuesRef.current, [name]: value };

    valuesRef.current = nextValues;
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

    const submittedValues = valuesRef.current;
    const nextErrors = validateQualifyValues(submittedValues, qualify);

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
      const body = JSON.stringify(buildSubmissionBody(submittedValues, qualify));

      track(measurementEvents.submit);
      const response = await fetch(qualify.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body,
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
      field.help ? helpId(slug, field) : '',
      errors[field.name] ? errorId(slug, field) : '',
    ]
      .filter((token) => token !== '')
      .join(' ');
    const shared = {
      id: fieldId(slug, field),
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
          htmlFor={fieldId(slug, field)}
          className="mb-1 block text-sm font-semibold leading-[1.4] text-[#18275F]"
        >
          {field.label}
          {required ? null : (
            <span className="font-normal text-[#5F6B84]"> (optional)</span>
          )}
        </label>
        {field.help ? (
          <p
            id={helpId(slug, field)}
            className="mb-1 text-sm font-normal leading-[1.4] text-[#5F6B84]"
          >
            {field.help}
          </p>
        ) : null}
        {renderControl(field, required)}
        {message ? (
          <p
            id={errorId(slug, field)}
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
            className={`text-[28px] font-semibold leading-[1.2] ${scriptFocusClasses}`}
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
            onFocus={handleQualifyStart}
            onChange={handleQualifyStart}
            className="relative max-w-[560px] rounded-2xl border border-[#DFE4F0] bg-white p-6 md:p-8"
          >
          <div
            aria-hidden="true"
            className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
          >
            <label htmlFor={honeypotId(slug)}>Leave this field blank</label>
            <input
              id={honeypotId(slug)}
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
              className={`mb-8 rounded-2xl border-2 border-[#B00020] bg-[#FFF5F5] p-4 ${scriptFocusClasses}`}
            >
              <div role="alert">
                <h3 className="text-base font-semibold leading-6 text-[#18275F]">
                  {QUALIFY_SUMMARY_HEADING}
                </h3>
                <ul className="mt-2 list-none p-0">
                  {invalidFields.map((field) => (
                    <li key={field.name} className="mt-1 first:mt-0">
                      <a
                        href={`#${fieldId(slug, field)}`}
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
                id={collectionNoteId(slug)}
                className="mt-8 rounded-lg border border-[#DFE4F0] bg-[#FBFCFF] p-4 text-sm font-normal leading-[1.4] text-[#5F6B84]"
              >
                <p>{qualify.collectionNote.purpose}</p>
                <p className="mt-3">{qualify.collectionNote.processor}</p>
                <p className="mt-3">{qualify.collectionNote.pageContext}</p>
              </div>
            ) : null}

            {measurementEventNames && measurementDisclosure && clearMeasurementContext ? (
              <MeasurementDisclosure
                slug={slug}
                events={measurementEventNames}
                disclosure={measurementDisclosure}
                clearContext={clearMeasurementContext}
              />
            ) : null}

            <button
              type="submit"
              disabled={state === 'submitting'}
              aria-describedby={
                qualify.collectionNote ? collectionNoteId(slug) : undefined
              }
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
