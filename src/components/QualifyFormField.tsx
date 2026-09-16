import type { QualifyField } from '../products/types';

/**
 * One labelled control in the qualification form: its label, optional help text, the
 * control itself, and its error message.
 *
 * Extracted from `QualifyForm`, which rendered this through two nested functions. Nothing
 * about the markup or the ids changes — every id is COMPUTED BY THE PARENT and passed in,
 * because the parent owns the slug namespacing that keeps two product forms on one page
 * from cross-wiring their labels and error links. This component decides nothing about
 * identity; it decides only how a field looks and which of its parts are present.
 *
 * Presentational on purpose: it holds no state and reads no context, so the form's single
 * source of truth for values, errors and requiredness stays in `QualifyForm`.
 */
interface QualifyFormFieldProps {
  readonly field: QualifyField;
  readonly value: string;
  /** The field's current message, or undefined when it has none. */
  readonly error: string | undefined;
  readonly required: boolean;
  /** True while a submission is open; see the locking note below. */
  readonly disabled: boolean;
  readonly spansBothColumns: boolean;
  readonly fieldId: string;
  readonly helpId: string;
  readonly errorId: string;
  readonly controlClassName: string;
  readonly onValueChange: (name: string, value: string) => void;
}

export default function QualifyFormField({
  field,
  value,
  error,
  required,
  disabled,
  spansBothColumns,
  fieldId,
  helpId,
  errorId,
  controlClassName,
  onValueChange,
}: QualifyFormFieldProps) {
  const describedBy = [field.help ? helpId : '', error ? errorId : '']
    .filter((token) => token !== '')
    .join(' ');

  const shared = {
    id: fieldId,
    name: field.name,
    value,
    required,
    'aria-required': required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy === '' ? undefined : describedBy,
    autoComplete: field.autoComplete,
    // The request body was serialised from the values captured when the submission
    // started, so an edit accepted during the request window would be absent from the
    // request already in flight and then destroyed with the form subtree on success.
    // Locking the controls makes that window visibly read-only rather than silently
    // discarding a correction the visitor believes was sent.
    disabled,
    className: controlClassName,
  } as const;

  function control() {
    if (field.control === 'select') {
      return (
        <select
          {...shared}
          onChange={(event) => onValueChange(field.name, event.target.value)}
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
          onChange={(event) => onValueChange(field.name, event.target.value)}
        />
      );
    }

    return (
      <input
        {...shared}
        type={field.control}
        maxLength={field.maxLength}
        onChange={(event) => onValueChange(field.name, event.target.value)}
      />
    );
  }

  return (
    <div className={spansBothColumns ? 'md:col-span-2' : undefined}>
      <label
        htmlFor={fieldId}
        className="mb-1 block text-sm font-semibold leading-[1.4] text-[#18275F]"
      >
        {field.label}
        {required ? null : (
          <span className="font-normal text-[#5F6B84]"> (optional)</span>
        )}
      </label>
      {field.help ? (
        <p id={helpId} className="mb-1 text-sm font-normal leading-[1.4] text-[#5F6B84]">
          {field.help}
        </p>
      ) : null}
      {control()}
      {error ? (
        <p
          id={errorId}
          className="mt-1 text-sm font-semibold leading-[1.4] text-[#B00020]"
        >
          <span className="sr-only">Error: </span>
          {error}
        </p>
      ) : null}
    </div>
  );
}
