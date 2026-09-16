import type { FormEvent, Ref } from 'react';
import type {
  ProductMeasurementDisclosure,
  ProductQualifyForm,
  QualifyField,
} from '../products/types';
import MeasurementDisclosure from './MeasurementDisclosure';
import QualifyFormField from './QualifyFormField';
import {
  collectionNoteId,
  errorId,
  fieldId,
  fullWidthFieldNames,
  helpId,
  honeypotId,
  HONEYPOT_NAME,
  isFieldRequired,
  QUALIFY_SUBMIT_LABEL,
  QUALIFY_SUBMITTING_LABEL,
  QUALIFY_SUMMARY_HEADING,
  type QualifyErrors,
  type QualifyValues,
  type SubmissionState,
} from './qualify-form.logic';

const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2';
/**
 * Focus this page moves by script. `:focus-visible` is a user-agent heuristic: after a
 * pointer click, a script-focused non-interactive element generally does not qualify, so a
 * `focus-visible:` ring paints nothing and focus lands somewhere the visitor cannot see — a
 * WCAG 2.4.7 failure on the exact moment this design chose to move focus. The error summary
 * is never reached by keyboard traversal, so it uses the modality-independent `focus:`
 * variants; genuinely interactive controls keep `focus-visible:`.
 */
const scriptFocusClasses =
  'focus:outline-none focus:ring-2 focus:ring-[#4054C6] focus:ring-offset-2';
const controlClasses = `w-full min-h-11 rounded-lg border border-[#6E7A94] bg-white px-3 py-2 text-base font-normal leading-6 text-[#18275F] hover:border-[#5F6B84] disabled:cursor-wait disabled:opacity-70 ${focusClasses}`;

/**
 * Everything the form shows while it is still collecting answers: the honeypot, the error
 * summary, the grouped fields, the collection note, the measurement disclosure and the
 * submit control.
 *
 * Split out of `QualifyForm`, which rendered this as the else-branch of its success
 * ternary. It owns no state and makes no decisions about submission — every value, every
 * message and every callback arrives as a prop, so `QualifyForm` remains the single source
 * of truth for what the form knows and what it is doing.
 *
 * The success card and the recovery panel deliberately stay with `QualifyForm`: they are
 * what REPLACES this subtree, and the component that decides between them is the one that
 * should hold them.
 */
interface QualifyFormBodyProps {
  readonly qualify: ProductQualifyForm;
  readonly slug: string;
  readonly values: QualifyValues;
  readonly errors: QualifyErrors;
  /** True once a submit has been attempted; gates the error summary. */
  readonly submitted: boolean;
  readonly invalidFields: readonly QualifyField[];
  readonly state: SubmissionState;
  /**
   * The summary container is the single invalid-submit focus target. Typed as `Ref`, which
   * is exactly what the `ref` attribute accepts, rather than restating the `useRef` return
   * shape the parent happens to hold.
   */
  readonly summaryRef: Ref<HTMLDivElement>;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onQualifyStart: (event: FormEvent<HTMLFormElement>) => void;
  readonly onValueChange: (name: string, value: string) => void;
  readonly measurementEventNames?: readonly string[];
  readonly measurementDisclosure?: ProductMeasurementDisclosure<string>;
  readonly clearMeasurementContext?: () => boolean;
}

export default function QualifyFormBody({
  qualify,
  slug,
  values,
  errors,
  submitted,
  invalidFields,
  state,
  summaryRef,
  onSubmit,
  onQualifyStart,
  onValueChange,
  measurementEventNames,
  measurementDisclosure,
  clearMeasurementContext,
}: QualifyFormBodyProps) {
  return (
    <>
      <p className="mb-4 text-sm font-normal leading-[1.4] text-[#5F6B84]">
        All fields are required unless marked optional.
      </p>
      <form
        noValidate
        onSubmit={onSubmit}
        onFocus={onQualifyStart}
        onChange={onQualifyStart}
        className="relative rounded-2xl border border-[#DFE4F0] bg-white p-6 md:p-8"
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
            onChange={(event) => onValueChange(HONEYPOT_NAME, event.target.value)}
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

        {qualify.groups.map((group) => {
          const fields = group.fieldNames
            .map((name) => qualify.fields.find((candidate) => candidate.name === name))
            .filter((field): field is QualifyField => field !== undefined);
          const spanning = fullWidthFieldNames(fields);

          return (
            <fieldset key={group.legend} className="mb-8 border-0 p-0 last:mb-0">
              <legend className="mb-4 text-base font-semibold leading-6 text-[#18275F]">
                {group.legend}
              </legend>
              {/* Paired from md by the product-generic rule; DOM order is visual order (260913-x19). */}
              <div className="grid gap-6 md:grid-cols-2 md:items-start md:gap-x-5">
                {fields.map((field) => (
                  <QualifyFormField
                    key={field.name}
                    field={field}
                    value={values[field.name] ?? ''}
                    error={errors[field.name]}
                    required={isFieldRequired(field, values)}
                    disabled={state === 'submitting'}
                    spansBothColumns={spanning.has(field.name)}
                    fieldId={fieldId(slug, field)}
                    helpId={helpId(slug, field)}
                    errorId={errorId(slug, field)}
                    controlClassName={controlClasses}
                    onValueChange={onValueChange}
                  />
                ))}
              </div>
            </fieldset>
          );
        })}

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
          aria-describedby={qualify.collectionNote ? collectionNoteId(slug) : undefined}
          className={`mt-8 inline-flex w-full min-h-11 items-center justify-center rounded-lg bg-[#4054C6] px-5 py-3 text-sm font-semibold leading-[1.4] text-white hover:bg-[#3345A7] active:bg-[#29388A] disabled:cursor-wait disabled:opacity-70 md:w-auto ${focusClasses}`}
        >
          {state === 'submitting' ? QUALIFY_SUBMITTING_LABEL : QUALIFY_SUBMIT_LABEL}
        </button>
      </form>
    </>
  );
}
