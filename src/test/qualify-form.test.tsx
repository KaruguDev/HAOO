import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import QualifyForm from '../components/QualifyForm';
import {
  buildSubmissionBody,
  ENGAGEMENT_SUMMARY_LABEL,
  isFieldRequired,
  QUALIFY_REQUEST_TIMEOUT_MS,
  RESERVED_EMAIL_LABELS,
  QUALIFY_STATUS_MESSAGES,
  QUALIFY_SUBMIT_LABEL,
  QUALIFY_SUBMITTING_LABEL,
  QUALIFY_SUMMARY_HEADING,
  validateQualifyValues,
} from '../components/qualify-form.logic';
import { CONTEXT_RECORD_KEYS, createMeasurement } from '../measurement';
import ProductPage from '../pages/ProductPage';
import { formatEngagementSummary } from '../products/engagement-summary';
import {
  CONTACT_CHANNEL_OPTIONS,
  HAOO_MEASUREMENT,
  HAOO_PRODUCT,
  KENYAN_COUNTY_OPTIONS,
  PORTFOLIO_BAND_OPTIONS,
  ROLE_OPTIONS,
  TIMEFRAME_OPTIONS,
} from '../products/haoo';
import type { ProductQualifyForm, QualifyField } from '../products/types';

const QUALIFY = HAOO_PRODUCT.qualify;
const SECTION_NAME = 'Send your details';
const REQUIRED_FIELDS_NOTE = 'All fields are required unless marked optional.';
const COLLECTION_PURPOSE =
  'We use these details only to reply to you about HAOO onboarding. We never sell them or add you to a mailing list.';
const COLLECTION_CONTEXT =
  'This page remembers only coarse HAOO engagement signals — whether you visited before, roughly when you last visited, and whether you viewed or downloaded the brochure, started this form, contacted HAOO, or opened self-onboarding. These signals stay separate from your form answers, and no engagement summary is attached to this submission yet.';
/** Named at the point of collection: the payload reaches the processor before us. */
const COLLECTION_PROCESSOR =
  'Your details are sent through FormSubmit, a third-party email-forwarding service, which passes them to our inbox. This site does not store them anywhere else.';
const DISCLOSURE_ID = `${HAOO_PRODUCT.slug}-qualify-collection-note`;
/**
 * The ten readable email labels (LEAD-04), the provider options, and the reserved
 * engagement-summary label (MEAS-05), sorted. This list is asserted as an exact
 * allowlist, so a field the payload gains or loses fails here first.
 */
const EXPECTED_BODY_KEYS = [
  'Email address',
  'Full name',
  'HAOO engagement context',
  'Location',
  'Message',
  'Onboarding timeframe',
  'Organization',
  'Phone number',
  'Portfolio size',
  'Preferred contact channel',
  'Role',
  'Source',
  '_captcha',
  '_honey',
  '_subject',
  '_template',
];
/** The pre-summary allowlist, kept so the two-argument call site stays pinned. */
const PRE_SUMMARY_BODY_KEYS = EXPECTED_BODY_KEYS.filter(
  (key) => key !== ENGAGEMENT_SUMMARY_LABEL,
);
const FORBIDDEN_PROVIDER_OPTIONS = ['_cc', '_next', '_autoresponse', '_replyto'];
/** The three context members the summary formatter is allowed to read (UI-SPEC Surface C). */
const SUMMARY_CONTEXT_KEYS: readonly string[] = ['visitBand', 'lastSeenBand', 'flags'];
/**
 * The internal derivation members, taken from the exported context tuple rather than
 * retyped here. The tuple's first member is the schema marker and the three above are
 * the summary's pick list, so whatever remains is exactly what the Phase 3 disclosure
 * promised would never enter a form submission. Reading them from the tuple means a
 * Phase 3 rename cannot leave this negative assertion guarding a name nothing uses.
 */
const DERIVATION_FIELDS = CONTEXT_RECORD_KEYS.filter(
  (key) => key !== CONTEXT_RECORD_KEYS[0] && !SUMMARY_CONTEXT_KEYS.includes(key),
);
const UUID_SHAPE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const ENGAGEMENT_SUMMARY = QUALIFY.engagementSummary;
const ENGAGEMENT_SUMMARY_SOURCE = readFileSync(
  resolve(import.meta.dirname, '../products/engagement-summary.ts'),
  'utf8',
);
const CONTROL_TAGS: Record<string, string> = {
  text: 'INPUT',
  email: 'INPUT',
  tel: 'INPUT',
  select: 'SELECT',
  textarea: 'TEXTAREA',
};
const ALL_OPTION_LISTS = [
  CONTACT_CHANNEL_OPTIONS,
  ROLE_OPTIONS,
  PORTFOLIO_BAND_OPTIONS,
  KENYAN_COUNTY_OPTIONS,
  TIMEFRAME_OPTIONS,
];
const MEASUREMENT_PROPS = {
  track: () => true,
  measurementEvents: {
    start: HAOO_PRODUCT.measurement.interactionEvents.qualifyStart,
    submit: HAOO_PRODUCT.measurement.interactionEvents.qualifySubmit,
  },
} as const;

/**
 * The accessible name of a control. The component appends ` (optional)` itself from
 * computed requiredness, so the name is derived here rather than stored — the locked
 * `label` strings themselves are pinned literally in `qualify-data.test.ts`.
 */
function accessibleLabel(field: QualifyField) {
  return field.required ? field.label : `${field.label} (optional)`;
}

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  QUALIFY.fields.map((field) => [field.name, accessibleLabel(field)]),
);

/** One valid answer per field, used to fill the form and the pure validators. */
const COMPLETE_ENQUIRY: Record<string, string> = {
  name: 'Jane Wanjiru',
  email: 'jane@example.com',
  preferredChannel: 'Email',
  phone: '+254 702 188 044',
  role: 'Landlord',
  organization: 'Wanjiru Properties',
  portfolioBand: '6\u201320 units',
  county: 'Nairobi',
  timeframe: 'Ready now',
  message: 'We manage four blocks in Kilimani.',
};

const REQUIRED_FIELDS = QUALIFY.fields.filter((field) => field.required);
const OPTIONAL_FIELDS = QUALIFY.fields.filter((field) => !field.required);

/** Values for the required fields only — every optional field left untouched. */
function requiredValues() {
  return Object.fromEntries(
    REQUIRED_FIELDS.map((field) => [field.name, COMPLETE_ENQUIRY[field.name]]),
  ) as Record<string, string>;
}

function renderPage() {
  return render(<ProductPage product={HAOO_PRODUCT} />);
}

function qualifySection() {
  return screen.getByRole('region', { name: SECTION_NAME });
}

function submitControl() {
  return within(qualifySection()).getByRole('button', { name: QUALIFY_SUBMIT_LABEL });
}

function qualifyForm(): HTMLFormElement {
  const form = qualifySection().querySelector('form');

  if (!form) {
    throw new Error('The qualify section must render exactly one form.');
  }

  return form as HTMLFormElement;
}

function fillEnquiry(values: Record<string, string>) {
  const section = within(qualifySection());

  for (const field of QUALIFY.fields) {
    const value = values[field.name];

    if (value === undefined) {
      continue;
    }

    fireEvent.change(section.getByLabelText(FIELD_LABELS[field.name]), {
      target: { value },
    });
  }
}

/** The minimum submittable enquiry: every required field, no optional field. */
function fillValidEnquiry() {
  fillEnquiry(requiredValues());
}

/** All ten controls, so the delivered email carries all ten readable labels. */
function fillCompleteEnquiry() {
  fillEnquiry(COMPLETE_ENQUIRY);
}

function stubFetch(implementation: () => Promise<unknown>) {
  const spy = vi.fn(implementation);

  vi.stubGlobal('fetch', spy);

  return spy;
}

function parseRequest(spy: ReturnType<typeof vi.fn>) {
  const [url, init] = spy.mock.calls[0] as [string, RequestInit];

  return {
    url,
    init,
    body: JSON.parse(String(init.body)) as Record<string, string>,
  };
}

/**
 * A control addressed by configured field name rather than accessible name. Conditional
 * requiredness rewrites the accessible name — the `(optional)` suffix is derived, not
 * stored — so a label-based lookup would break precisely where the rule is under test.
 */
function controlByName(fieldName: string): HTMLElement {
  const node = qualifySection().querySelector(`#${HAOO_PRODUCT.slug}-qualify-${fieldName}`);

  if (!node) {
    throw new Error(`Expected a control for "${fieldName}".`);
  }

  return node as HTMLElement;
}

/** Fills by configured field name, in configured DOM order. */
function fillControls(values: Record<string, string>) {
  for (const field of QUALIFY.fields) {
    const value = values[field.name];

    if (value === undefined) {
      continue;
    }

    fireEvent.change(controlByName(field.name), { target: { value } });
  }
}

function summaryContainer() {
  return within(qualifySection()).getByRole('alert').parentElement as HTMLElement;
}

function inlineError(fieldName: string) {
  const node = qualifySection().querySelector(`#${HAOO_PRODUCT.slug}-qualify-${fieldName}-error`);

  if (!node) {
    throw new Error(`Expected an inline error message for "${fieldName}".`);
  }

  return node as HTMLElement;
}

function summaryLinkTexts() {
  return Array.from(
    within(qualifySection()).getByRole('alert').querySelectorAll('a'),
  ).map((link) => link.textContent);
}

function statusRegion() {
  const status = within(qualifySection()).getAllByRole('status')
    .find((candidate) => candidate.closest('details') === null);

  if (!status) {
    throw new Error('Expected the qualification submission status region.');
  }

  return status;
}

function emptyValues() {
  const values: Record<string, string> = { _honey: '' };

  for (const field of QUALIFY.fields) {
    values[field.name] = '';
  }

  return values;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Phase 2 qualified enquiry tracer contracts', () => {
  it('discloses what is collected and what is required', async () => {
    let resolveRequest: ((value: { ok: boolean }) => void) | undefined;
    const fetchSpy = stubFetch(
      () => new Promise<{ ok: boolean }>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    renderPage();
    const section = within(qualifySection());
    const disclosure = qualifySection().querySelector(`#${DISCLOSURE_ID}`);
    const button = submitControl();

    expect(section.getByText(REQUIRED_FIELDS_NOTE)).toBeTruthy();
    expect(QUALIFY.collectionNote).toEqual({
      purpose: COLLECTION_PURPOSE,
      processor: COLLECTION_PROCESSOR,
      pageContext: COLLECTION_CONTEXT,
    });
    expect(disclosure?.textContent).toContain(COLLECTION_PURPOSE);
    expect(disclosure?.textContent).toContain(COLLECTION_PROCESSOR);
    expect(disclosure?.textContent).toContain(COLLECTION_CONTEXT);
    const measurementDisclosure = disclosure?.nextElementSibling;
    expect(measurementDisclosure?.tagName).toBe('DETAILS');
    expect(measurementDisclosure?.nextElementSibling).toBe(button);
    expect(button.getAttribute('aria-describedby')?.split(/\s+/)).toContain(DISCLOSURE_ID);

    for (const field of QUALIFY.fields) {
      const label = qualifySection().querySelector(`label[for="${HAOO_PRODUCT.slug}-qualify-${field.name}"]`);

      expect(field.label, field.name).not.toContain('(optional)');
      expect(label?.textContent, field.name).not.toContain('*');
      expect(label?.textContent?.includes('(optional)'), field.name)
        .toBe(!isFieldRequired(field, emptyValues()));
    }

    fireEvent.click(button);
    expect(qualifySection().querySelector(`#${DISCLOSURE_ID}`)).toBeTruthy();

    fillValidEnquiry();
    fireEvent.click(submitControl());
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(qualifySection().querySelector(`#${DISCLOSURE_ID}`)).toBeTruthy();
    expect(
      within(qualifySection())
        .getByRole('button', { name: QUALIFY_SUBMITTING_LABEL })
        .getAttribute('aria-describedby')?.split(/\s+/),
    ).toContain(DISCLOSURE_ID);

    resolveRequest?.({ ok: false });
    await waitFor(() =>
      expect(statusRegion().textContent).toBe(QUALIFY_STATUS_MESSAGES.failed),
    );
    expect(qualifySection().querySelector(`#${DISCLOSURE_ID}`)).toBeTruthy();
    expect(submitControl().getAttribute('aria-describedby')?.split(/\s+/))
      .toContain(DISCLOSURE_ID);
  });

  it('collects a name and a usable contact method', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    const section = within(qualifySection());

    // Every required control is labelled and marked required — no placeholder stands
    // in for a label, and requiredness is exposed to assistive technology. Every
    // optional control is labelled too, and is marked required nowhere.
    for (const field of REQUIRED_FIELDS) {
      const control = section.getByLabelText(FIELD_LABELS[field.name]);

      expect(control.hasAttribute('required'), field.name).toBe(true);
      expect(control.getAttribute('aria-required'), field.name).toBe('true');
    }
    for (const field of OPTIONAL_FIELDS) {
      const control = section.getByLabelText(FIELD_LABELS[field.name]);

      expect(control.hasAttribute('required'), field.name).toBe(false);
      expect(control.getAttribute('aria-required'), field.name).toBe('false');
    }

    // The browser's own submission blocking is deliberately disabled so that every
    // activation of the submit control reaches the single custom validation path.
    expect(qualifyForm().noValidate).toBe(true);

    fireEvent.click(submitControl());

    // Each message is rendered byte-identically twice: inline beside its control and
    // as the summary link text, in configured DOM order.
    expect(inlineError('name').textContent).toBe('Error: Enter your full name');
    expect(inlineError('email').textContent).toBe('Error: Enter your email address');
    expect(inlineError('preferredChannel').textContent)
      .toBe('Error: Select how we should reach you');
    expect(inlineError('role').textContent).toBe('Error: Select your role');
    expect(inlineError('portfolioBand').textContent)
      .toBe('Error: Select how many units you manage');
    expect(inlineError('county').textContent)
      .toBe('Error: Select where your properties are');
    expect(inlineError('timeframe').textContent)
      .toBe('Error: Select when you would like to start');
    expect(summaryLinkTexts()).toEqual([
      'Enter your full name',
      'Enter your email address',
      'Select how we should reach you',
      'Select your role',
      'Select how many units you manage',
      'Select where your properties are',
      'Select when you would like to start',
    ]);
    for (const field of REQUIRED_FIELDS) {
      const control = section.getByLabelText(FIELD_LABELS[field.name]);

      expect(control.getAttribute('aria-invalid'), field.name).toBe('true');
      expect(control.getAttribute('aria-describedby'), field.name)
        .toBe(`${HAOO_PRODUCT.slug}-qualify-${field.name}-error`);
    }

    // An untouched optional field is not an error and is never described by one.
    for (const field of OPTIONAL_FIELDS) {
      const control = section.getByLabelText(FIELD_LABELS[field.name]);

      expect(control.getAttribute('aria-invalid'), field.name).toBeNull();
      expect(qualifySection().querySelector(`#${HAOO_PRODUCT.slug}-qualify-${field.name}-error`), field.name)
        .toBeNull();
    }
    expect(fetchSpy).toHaveBeenCalledTimes(0);

    // Focus lands on the outer summary container, never on the inner alert and never
    // on the first invalid control.
    const alert = section.getByRole('alert');
    const summaryContainer = alert.parentElement as HTMLElement;

    expect(within(alert).getByRole('heading', { name: QUALIFY_SUMMARY_HEADING })).toBeTruthy();
    expect(summaryContainer.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(summaryContainer);
    expect(document.activeElement).not.toBe(alert);
    expect(document.activeElement).not.toBe(section.getByLabelText('Full name'));

    // Nothing was invented on the visitor's behalf: every control — including every
    // select, which opens on its non-selectable empty prompt — is still blank.
    for (const field of QUALIFY.fields) {
      expect(
        (section.getByLabelText(FIELD_LABELS[field.name]) as HTMLInputElement).value,
        field.name,
      ).toBe('');
    }

    fillValidEnquiry();
    fireEvent.click(submitControl());

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
  });

  it('posts a readable, correctly-addressed payload', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    fillCompleteEnquiry();
    fireEvent.click(submitControl());

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    const { url, init, body } = parseRequest(fetchSpy);

    expect(url).toBe(QUALIFY.endpoint);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');

    // LEAD-04: all ten answers arrive under their readable labels, and nothing else.
    expect(Object.keys(body).sort()).toEqual(EXPECTED_BODY_KEYS);
    expect(body._subject).toBe(QUALIFY.subject);
    expect(body._subject).toContain('HAOO');
    expect(body._template).toBe('table');
    expect(body._captcha).toBe('false');
    expect(body.Source).toBe(QUALIFY.sourceNote);
    expect(body['Full name']).toBe('Jane Wanjiru');
    expect(body['Email address']).toBe('jane@example.com');
    expect(body['Preferred contact channel']).toBe('Email');
    expect(body['Phone number']).toBe('+254 702 188 044');
    expect(body.Role).toBe('Landlord');
    expect(body.Organization).toBe('Wanjiru Properties');
    expect(body['Portfolio size']).toBe('6\u201320 units');
    expect(body.Location).toBe('Nairobi');
    expect(body['Onboarding timeframe']).toBe('Ready now');
    expect(body.Message).toBe('We manage four blocks in Kilimani.');

    // MEAS-05: the engagement summary rides as one readable paragraph under the
    // reserved label, and it is the only new field the payload gained.
    expect(body[ENGAGEMENT_SUMMARY_LABEL]).toContain(ENGAGEMENT_SUMMARY.prefix);
    expect(body[ENGAGEMENT_SUMMARY_LABEL]).toContain(ENGAGEMENT_SUMMARY.closing);
    expect(body[ENGAGEMENT_SUMMARY_LABEL].trim()).not.toBe('');

    // The exact allowlist above is the primary protection. These named negatives record
    // which specific leaks it exists to stop, so a later allowlist edit cannot quietly
    // readmit one of them. The broad `engagement|context|summary` keyword filter this
    // replaces cannot survive a field legitimately named `HAOO engagement context`.
    expect(DERIVATION_FIELDS).toHaveLength(2);

    const payloadText = [...Object.keys(body), ...Object.values(body)].join('\n');

    for (const field of DERIVATION_FIELDS) {
      expect(payloadText, field).not.toContain(field);
    }
    expect(payloadText).not.toContain(HAOO_MEASUREMENT.storageKey);
    expect(payloadText).not.toMatch(UUID_SHAPE);
    expect(Object.values(body).filter((value) => value === COMPLETE_ENQUIRY.message))
      .toEqual([COMPLETE_ENQUIRY.message]);

    // No visitor-supplied value may reach a header-shaped provider option.
    for (const option of FORBIDDEN_PROVIDER_OPTIONS) {
      expect(body).not.toHaveProperty(option);
    }

    // An untouched optional field is absent from the payload entirely. Emitting it as
    // an empty string would put a blank row in the delivered email for every question
    // the visitor legitimately chose not to answer.
    cleanup();

    const requiredOnlySpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    fillValidEnquiry();
    fireEvent.click(submitControl());

    await waitFor(() => expect(requiredOnlySpy).toHaveBeenCalledTimes(1));

    const requiredOnlyBody = parseRequest(requiredOnlySpy).body;

    for (const field of OPTIONAL_FIELDS) {
      expect(requiredOnlyBody, field.emailLabel).not.toHaveProperty(field.emailLabel);
    }
    expect(Object.keys(requiredOnlyBody).sort()).toEqual(
      EXPECTED_BODY_KEYS.filter(
        (key) => !OPTIONAL_FIELDS.some((field) => field.emailLabel === key),
      ),
    );
    for (const [key, value] of Object.entries(requiredOnlyBody)) {
      if (key !== '_honey') {
        expect(value, key).not.toBe('');
      }
    }
  });

  it('refuses to build a body for a field claiming a reserved email label', () => {
    const values = { ...emptyValues(), ...requiredValues(), hijack: 'attacker@example.com' };

    // A visitor-supplied value reaching `_cc` would carbon-copy the enquiry to an
    // arbitrary mailbox; reaching `Source` or a spam control would overwrite it. The
    // prohibition is a property of this function, not of the current product's data.
    for (const reservedLabel of RESERVED_EMAIL_LABELS) {
      const hijacked: ProductQualifyForm = {
        ...QUALIFY,
        fields: [
          ...QUALIFY.fields,
          {
            name: 'hijack',
            label: 'Hijack',
            emailLabel: reservedLabel,
            control: 'text',
            required: false,
            requiredMessage: 'Unreachable',
          },
        ],
      };

      expect(() => buildSubmissionBody(values, hijacked), reservedLabel)
        .toThrowError(/reserved email label/);
    }

    expect(RESERVED_EMAIL_LABELS.size).toBeGreaterThanOrEqual(
      FORBIDDEN_PROVIDER_OPTIONS.length,
    );
    for (const option of FORBIDDEN_PROVIDER_OPTIONS) {
      expect(RESERVED_EMAIL_LABELS.has(option), option).toBe(true);
    }

    // The shipped product still builds, so the guard is a contract and not a blocker.
    expect(() => buildSubmissionBody(values, QUALIFY)).not.toThrow();
  });

  it('renders every qualification option', () => {
    stubFetch(async () => ({ ok: true }));
    renderPage();

    const section = within(qualifySection());

    for (const field of QUALIFY.fields) {
      const control = section.getByLabelText(FIELD_LABELS[field.name]);

      expect(control.tagName, field.name).toBe(CONTROL_TAGS[field.control]);
      expect(control.getAttribute('autocomplete'), field.name).toBe(field.autoComplete);
      expect(control.hasAttribute('required'), field.name).toBe(field.required);

      if (typeof field.maxLength === 'number') {
        expect(control.getAttribute('maxlength'), field.name).toBe(String(field.maxLength));
      } else {
        expect(control.hasAttribute('maxlength'), field.name).toBe(false);
      }

      if (control.tagName === 'INPUT') {
        expect(control.getAttribute('type'), field.name).toBe(field.control);
      }

      if (field.control !== 'select') {
        continue;
      }

      const options = Array.from(control.querySelectorAll('option'));

      // The leading non-selectable prompt is what makes required-select validation a
      // `value !== ''` check: an untouched select cannot submit a real value.
      expect(options, field.name).toHaveLength((field.options ?? []).length + 1);
      expect(options[0].getAttribute('value'), field.name).toBe('');
      expect(options[0].textContent, field.name).toBe(field.placeholderOption);
      expect(options.slice(1).map((option) => option.textContent), field.name)
        .toEqual((field.options ?? []).map((option) => option.label));
      expect(options.slice(1).map((option) => option.getAttribute('value')), field.name)
        .toEqual((field.options ?? []).map((option) => option.value));
    }

    // Every option from every shipped list reaches the DOM. A truncated, filtered or
    // virtualised county list fails here rather than in a visitor's browser.
    const rendered = Array.from(qualifySection().querySelectorAll('option'))
      .map((option) => option.textContent);

    for (const list of ALL_OPTION_LISTS) {
      for (const option of list) {
        expect(rendered, option.label).toContain(option.label);
      }
    }

    const optionCount = ALL_OPTION_LISTS.reduce((total, list) => total + list.length, 0);

    expect(optionCount).toBe(65);
    expect(rendered).toHaveLength(optionCount + ALL_OPTION_LISTS.length);
  });

  it('announces every submission state', async () => {
    // A provider body that throws when read proves the terminal state is derived from
    // the response status alone.
    const fetchSpy = stubFetch(async () => ({
      ok: true,
      json: () => {
        throw new Error('the provider response body must never be read');
      },
    }));

    renderPage();

    expect(statusRegion().textContent).toBe('');
    expect(QUALIFY_STATUS_MESSAGES.idle).toBe('');

    fillValidEnquiry();
    fireEvent.click(submitControl());

    // In flight: the relabel plus the status text are the only signals.
    expect(within(qualifySection()).getByRole('button', { name: QUALIFY_SUBMITTING_LABEL }))
      .toBeTruthy();
    expect(
      (within(qualifySection()).getByRole('button', { name: QUALIFY_SUBMITTING_LABEL }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(statusRegion().textContent).toBe(QUALIFY_STATUS_MESSAGES.submitting);

    await waitFor(() =>
      expect(statusRegion().textContent).toBe(QUALIFY_STATUS_MESSAGES.succeeded),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Success replaces the form so a second submission is unreachable, and focus moves
    // to the confirmation heading.
    const section = within(qualifySection());
    const confirmationHeading = section.getByRole('heading', {
      name: 'Your details are on their way',
    });

    expect(confirmationHeading.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(confirmationHeading);
    expect(qualifySection().querySelector('form')).toBeNull();
    expect(section.queryByRole('button', { name: QUALIFY_SUBMIT_LABEL })).toBeNull();
    expect(section.getAllByRole('status')).toHaveLength(1);
    // The confirmation reports only what this page observed — the provider accepted the
    // request — and offers the response-time sentence as a fallback trigger, never as a
    // delivery receipt (LEAD-07 has not proven live delivery).
    expect(section.getByText(
      "Your details were submitted. If you don't hear back within one business day, use one of the contacts below.",
    )).toBeTruthy();
    expect(section.queryByText(/sent your name.*to the HAOO team/)).toBeNull();
    expect(section.getByText('Need an answer sooner?')).toBeTruthy();
    expect(section.getByRole('link', { name: 'Message HAOO on WhatsApp instead' })
      .getAttribute('href')).toBe(HAOO_PRODUCT.contacts.whatsappHref);
    expect(section.getByRole('link', { name: 'Call HAOO on +254 702 188 044 instead' })
      .getAttribute('href')).toBe(HAOO_PRODUCT.contacts.phoneHref);
    expect(section.queryByRole('link', { name: /Email HAOO .* instead/ })).toBeNull();
  });

  it('retains entered values and reports the problem when the provider rejects the request', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: false }));

    renderPage();
    fillCompleteEnquiry();
    fireEvent.click(submitControl());

    await waitFor(() =>
      expect(statusRegion().textContent).toBe(QUALIFY_STATUS_MESSAGES.failed),
    );

    const section = within(qualifySection());

    // Every answer survives the failure, including the chosen select values.
    for (const field of QUALIFY.fields) {
      expect(
        (section.getByLabelText(FIELD_LABELS[field.name]) as HTMLInputElement).value,
        field.name,
      ).toBe(COMPLETE_ENQUIRY[field.name]);
    }

    const failureHeading = section.getByRole('heading', {
      name: "We couldn't send your details",
    });

    expect(failureHeading.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(failureHeading);
    expect(section.getAllByRole('button', { name: 'Try sending again' })).toHaveLength(1);
    expect((submitControl() as HTMLButtonElement).disabled).toBe(false);
    expect(section.getByRole('link', { name: 'Message HAOO on WhatsApp instead' })
      .getAttribute('href')).toBe(HAOO_PRODUCT.contacts.whatsappHref);
    expect(section.getByRole('link', { name: 'Call HAOO on +254 702 188 044 instead' })
      .getAttribute('href')).toBe(HAOO_PRODUCT.contacts.phoneHref);
    expect(section.getByRole('link', { name: 'Email HAOO at info@haoo.online instead' })
      .getAttribute('href')).toBe(HAOO_PRODUCT.contacts.emailHref);

    fireEvent.click(section.getByRole('button', { name: 'Try sending again' }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));

    const firstCall = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    const secondCall = fetchSpy.mock.calls[1] as unknown as [string, RequestInit];

    expect(JSON.parse(String(firstCall[1].body)))
      .toEqual(JSON.parse(String(secondCall[1].body)));
    expect(section.getAllByRole('heading', {
      name: "We couldn't send your details",
    })).toHaveLength(1);
  });

  it('lands a rejected provider promise in the failed state and never in succeeded', async () => {
    stubFetch(async () => {
      throw new Error('network down');
    });

    renderPage();
    fillValidEnquiry();
    fireEvent.click(submitControl());

    await waitFor(() =>
      expect(statusRegion().textContent).toBe(QUALIFY_STATUS_MESSAGES.failed),
    );
    expect(statusRegion().textContent).not.toBe(QUALIFY_STATUS_MESSAGES.succeeded);
    expect(qualifySection().querySelector('form')).not.toBeNull();
    const failureHeading = within(qualifySection()).getByRole('heading', {
      name: "We couldn't send your details",
    });

    expect(document.activeElement).toBe(failureHeading);
    expect(within(qualifySection()).getAllByRole('button', {
      name: 'Try sending again',
    })).toHaveLength(1);
  });

  it('admits exactly one retry while the retained request is in flight', async () => {
    let settleRetry: (value: { ok: boolean }) => void = () => {};
    const retry = new Promise<{ ok: boolean }>((resolve) => {
      settleRetry = resolve;
    });
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({ ok: false })
      .mockImplementationOnce(() => retry);

    vi.stubGlobal('fetch', fetchSpy);
    renderPage();
    fillCompleteEnquiry();
    fireEvent.click(submitControl());

    const retryControl = await screen.findByRole('button', { name: 'Try sending again' });

    fireEvent.click(retryControl);
    fireEvent.click(retryControl);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String((fetchSpy.mock.calls[1][1] as RequestInit).body)))
      .toEqual(JSON.parse(String((fetchSpy.mock.calls[0][1] as RequestInit).body)));

    settleRetry({ ok: false });

    await waitFor(() => expect(statusRegion().textContent)
      .toBe(QUALIFY_STATUS_MESSAGES.failed));
    expect(within(qualifySection()).getAllByRole('button', {
      name: 'Try sending again',
    })).toHaveLength(1);
  });

  it('clears the transport failure when a retry is blocked by validation', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: false }));

    renderPage();
    fillValidEnquiry();
    fireEvent.click(submitControl());

    await within(qualifySection()).findByRole('heading', {
      name: "We couldn't send your details",
    });

    // The form stays editable in the failed state, so a retry can legitimately be
    // blocked by validation. A transport failure and a validation failure must never be
    // reported at the same time — only one of them is real.
    fireEvent.change(controlByName('name'), { target: { value: '' } });
    fireEvent.click(within(qualifySection()).getByRole('button', {
      name: 'Try sending again',
    }));

    expect(within(qualifySection()).queryByRole('heading', {
      name: "We couldn't send your details",
    })).toBeNull();
    expect(within(qualifySection()).getAllByRole('alert')).toHaveLength(1);
    expect(summaryLinkTexts()).toEqual(['Enter your full name']);
    expect(statusRegion().textContent).toBe('');
    expect(document.activeElement).toBe(summaryContainer());
    // No second request was attempted, so the cleared failure is not a lie either.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('locks every control while a request is in flight, then releases them', async () => {
    let settleRequest: ((value: { ok: boolean }) => void) | undefined;
    const fetchSpy = stubFetch(
      () => new Promise<{ ok: boolean }>((resolve) => {
        settleRequest = resolve;
      }),
    );

    renderPage();
    fillCompleteEnquiry();

    for (const field of QUALIFY.fields) {
      expect((controlByName(field.name) as HTMLInputElement).disabled, field.name)
        .toBe(false);
    }

    fireEvent.click(submitControl());

    expect(statusRegion().textContent).toBe(QUALIFY_STATUS_MESSAGES.submitting);

    // The payload is already serialised, so an edit accepted now would be missing from
    // the request in flight and then destroyed with the form subtree on success.
    for (const field of QUALIFY.fields) {
      expect((controlByName(field.name) as HTMLInputElement).disabled, field.name)
        .toBe(true);
    }

    settleRequest?.({ ok: false });

    await waitFor(() => expect(statusRegion().textContent)
      .toBe(QUALIFY_STATUS_MESSAGES.failed));

    // A terminal failure hands the form back: the visitor can correct and retry.
    for (const field of QUALIFY.fields) {
      expect((controlByName(field.name) as HTMLInputElement).disabled, field.name)
        .toBe(false);
    }
    expect(parseRequest(fetchSpy).body['Email address']).toBe(COMPLETE_ENQUIRY.email);
  });

  it('treats a stalled request as a failure so the recovery panel stays reachable', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    try {
      let stalledSignal: AbortSignal | undefined;
      // A request that never settles on its own: only the abort ends it, which is how a
      // captive portal, a dropped mobile connection and a hung provider all behave.
      const fetchSpy = vi.fn((_input: unknown, init?: RequestInit) => {
        stalledSignal = init?.signal ?? undefined;

        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      });

      vi.stubGlobal('fetch', fetchSpy);
      renderPage();
      fillValidEnquiry();
      fireEvent.click(submitControl());

      expect(statusRegion().textContent).toBe(QUALIFY_STATUS_MESSAGES.submitting);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(QUALIFY_REQUEST_TIMEOUT_MS);
      });

      expect(stalledSignal?.aborted).toBe(true);
      expect(statusRegion().textContent).toBe(QUALIFY_STATUS_MESSAGES.failed);

      const failureHeading = within(qualifySection()).getByRole('heading', {
        name: "We couldn't send your details",
      });

      expect(document.activeElement).toBe(failureHeading);
      // The synchronous in-flight guard was released, so the visitor can retry.
      expect((submitControl() as HTMLButtonElement).disabled).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders terminal recovery copy from a synthetic product identity', async () => {
    const zenithContacts = {
      ...HAOO_PRODUCT.contacts,
      phoneDisplay: '+254 711 222 333',
      phoneHref: 'tel:+254711222333',
      email: 'hello@zenith.example',
      emailHref: 'mailto:hello@zenith.example',
      whatsappHref: 'https://wa.me/254711222333?text=Hello%20ZENITH',
    };
    const failedFetch = stubFetch(async () => ({ ok: false }));
    const first = render(
      <QualifyForm
        {...MEASUREMENT_PROPS}
        qualify={QUALIFY}
        contacts={zenithContacts}
        productName="ZENITH"
        slug="zenith"
      />,
    );

    for (const [name, value] of Object.entries(requiredValues())) {
      fireEvent.change(first.container.querySelector(`#zenith-qualify-${name}`) as HTMLElement, {
        target: { value },
      });
    }
    fireEvent.click(within(first.container).getByRole('button', {
      name: QUALIFY_SUBMIT_LABEL,
    }));
    await within(first.container).findByRole('heading', {
      name: "We couldn't send your details",
    });
    expect(within(first.container).getByRole('link', {
      name: 'Email ZENITH at hello@zenith.example instead',
    }).getAttribute('href')).toBe(zenithContacts.emailHref);
    expect(failedFetch).toHaveBeenCalledTimes(1);

    cleanup();
    vi.unstubAllGlobals();
    stubFetch(async () => ({ ok: true }));
    const second = render(
      <QualifyForm
        {...MEASUREMENT_PROPS}
        qualify={QUALIFY}
        contacts={zenithContacts}
        productName="ZENITH"
        slug="zenith"
      />,
    );

    for (const [name, value] of Object.entries(requiredValues())) {
      fireEvent.change(second.container.querySelector(`#zenith-qualify-${name}`) as HTMLElement, {
        target: { value },
      });
    }
    fireEvent.click(within(second.container).getByRole('button', {
      name: QUALIFY_SUBMIT_LABEL,
    }));
    expect(await within(second.container).findByText(
      /Your details were submitted\..*one business day/,
    )).toBeTruthy();
    expect(within(second.container).getByRole('link', {
      name: 'Message ZENITH on WhatsApp instead',
    }).getAttribute('href')).toBe(zenithContacts.whatsappHref);

    const genericSources = [
      '../components/QualifyForm.tsx',
      '../components/qualify-form.logic.ts',
      '../components/QualifyFallback.tsx',
      '../products/copy.ts',
    ];

    for (const sourcePath of genericSources) {
      const source = readFileSync(resolve(import.meta.dirname, sourcePath), 'utf8');
      // Narrowed, not dropped. `qualify-form.logic.ts` reserves the shipped
      // engagement-summary label by name so no product field can claim it (MEAS-05),
      // and that one string is the only product literal any generic module may carry.
      // Removing exactly that string first leaves every other HAOO mention — in every
      // one of these files — as strict a failure as it was before.
      const remaining = sourcePath.endsWith('qualify-form.logic.ts')
        ? source.split(ENGAGEMENT_SUMMARY_LABEL).join('')
        : source;

      expect(remaining, sourcePath).not.toMatch(/HAOO/);
    }
  });

  it('namespaces every id so two product forms can coexist on one page', () => {
    stubFetch(async () => ({ ok: true }));

    const { container } = render(
      <>
        <QualifyForm
          {...MEASUREMENT_PROPS}
          qualify={QUALIFY}
          contacts={HAOO_PRODUCT.contacts}
          productName="HAOO"
          slug="haoo"
        />
        <QualifyForm
          {...MEASUREMENT_PROPS}
          qualify={QUALIFY}
          contacts={HAOO_PRODUCT.contacts}
          productName="ZENITH"
          slug="zenith"
        />
      </>,
    );

    const ids = Array.from(container.querySelectorAll('[id]')).map((node) => node.id);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size, ids.join(', ')).toBe(ids.length);

    // A duplicate id would not merely be invalid markup: `label[for]` binds to the first
    // match, so the second form's controls would be labelled by the first form's labels.
    for (const label of Array.from(container.querySelectorAll('label[for]'))) {
      const forId = label.getAttribute('for') ?? '';
      const target = container.querySelector(`#${forId}`);

      expect(target, forId).not.toBeNull();
      expect(label.closest('form'), forId).toBe(target?.closest('form'));
    }
  });

  it('traps bots without blocking assistive technology', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();

    const honeypot = qualifySection()
      .querySelector(`#${HAOO_PRODUCT.slug}-qualify-website`) as HTMLInputElement;
    const wrapper = honeypot.parentElement as HTMLElement;

    expect(honeypot.getAttribute('name')).toBe('_honey');
    expect(honeypot.getAttribute('tabindex')).toBe('-1');
    expect(honeypot.getAttribute('autocomplete')).toBe('off');
    expect(honeypot.hasAttribute('required')).toBe(false);
    expect(wrapper.getAttribute('aria-hidden')).toBe('true');
    expect(wrapper.className).toContain('-left-[10000px]');
    // Off-screen, never `display:none` — a hidden control is not a honeypot.
    expect(wrapper.classList.contains('hidden')).toBe(false);
    expect(wrapper.className).toContain('overflow-hidden');
    expect(wrapper.style.display).not.toBe('none');
    expect(within(wrapper).getByText('Leave this field blank').tagName).toBe('LABEL');

    // No captcha, no challenge widget, no third-party script enters the surface.
    expect(qualifySection().querySelector('iframe')).toBeNull();
    expect(qualifySection().querySelector('script')).toBeNull();
    expect(qualifySection().textContent).not.toMatch(/captcha/i);

    fireEvent.change(honeypot, { target: { value: 'https://spam.example' } });
    fillValidEnquiry();
    fireEvent.click(submitControl());

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    // The value is posted unchanged so the provider — not this client — owns the spam
    // decision, and the terminal state still follows the response status.
    const { body } = parseRequest(fetchSpy);

    expect(body._honey).toBe('https://spam.example');
    expect(body._captcha).toBe('false');
    await waitFor(() =>
      expect(statusRegion().textContent).toBe(QUALIFY_STATUS_MESSAGES.succeeded),
    );
    expect(qualifySection().textContent).not.toMatch(/honey/i);
  });

  it('admits exactly one request while a submission is still in flight', async () => {
    let settle: (value: { ok: boolean }) => void = () => {};
    const pending = new Promise<{ ok: boolean }>((resolve) => {
      settle = resolve;
    });
    const fetchSpy = stubFetch(() => pending);

    renderPage();
    fillValidEnquiry();

    const form = qualifyForm();

    // Two submit events back to back, before React can commit the disabled attribute.
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    settle({ ok: true });

    await waitFor(() =>
      expect(statusRegion().textContent).toBe(QUALIFY_STATUS_MESSAGES.succeeded),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects a manipulated select value before any request is issued', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    fillValidEnquiry();

    const select = within(qualifySection()).getByLabelText('Your role') as HTMLSelectElement;
    const rogue = document.createElement('option');

    rogue.value = 'Administrator';
    rogue.textContent = 'Administrator';
    select.append(rogue);
    fireEvent.change(select, { target: { value: 'Administrator' } });

    fireEvent.click(submitControl());

    expect(fetchSpy).toHaveBeenCalledTimes(0);
    expect(within(qualifySection()).getByRole('alert')).toBeTruthy();
    expect(inlineError('role').textContent).toBe('Error: Select your role');
  });

  it('rejects a programmatically over-length value before any request is issued', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    fillValidEnquiry();

    const name = within(qualifySection()).getByLabelText('Full name') as HTMLInputElement;

    expect(name.maxLength).toBe(80);
    fireEvent.change(name, { target: { value: 'a'.repeat(81) } });
    fireEvent.click(submitControl());

    expect(fetchSpy).toHaveBeenCalledTimes(0);
    expect(inlineError('name').textContent)
      .toBe('Error: Shorten your full name to 80 characters or fewer');
  });

  it('renders configured groups and legends in configured DOM order', () => {
    stubFetch(async () => ({ ok: true }));
    renderPage();

    const section = within(qualifySection());
    const groups = section.getAllByRole('group')
      .filter((group) => group.tagName === 'FIELDSET');

    // Native `fieldset`/`legend`, not styled prose: each group is reachable by its
    // legend as an accessible name, and the three appear in configured DOM order.
    expect(groups).toHaveLength(3);
    expect(groups.map((group) => group.querySelector('legend')?.textContent))
      .toEqual(['About you', 'About your portfolio', 'Getting started']);
    expect(QUALIFY.groups.map((group) => section.getByRole('group', { name: group.legend })))
      .toEqual(groups);

    // Every configured field belongs to exactly one group, by configured name.
    const grouped = QUALIFY.groups.flatMap((group) => group.fieldNames);

    expect([...grouped].sort()).toEqual(QUALIFY.fields.map((field) => field.name).sort());
    expect(new Set(grouped).size).toBe(grouped.length);
    for (const [index, group] of QUALIFY.groups.entries()) {
      for (const name of group.fieldNames) {
        const control = section.getByLabelText(FIELD_LABELS[name]);

        expect(groups[index].querySelector(`#${HAOO_PRODUCT.slug}-qualify-${name}`), name).not.toBeNull();
        expect(groups[index].contains(control), name).toBe(true);
        for (const [otherIndex, other] of groups.entries()) {
          if (otherIndex !== index) {
            expect(other.contains(control), `${name} in ${QUALIFY.groups[otherIndex].legend}`)
              .toBe(false);
          }
        }
      }
    }
  });

  it('derives the optional label suffix from computed requiredness', () => {
    stubFetch(async () => ({ ok: true }));

    // No source label carries the suffix or an asterisk (D-21) — the marker is
    // rendered from `isFieldRequired`, never stored in copy, so it cannot drift away
    // from the validation rule when plan 04 makes phone conditionally required.
    for (const field of QUALIFY.fields) {
      expect(field.label, field.name).not.toContain('(optional)');
      expect(field.label, field.name).not.toContain('*');
    }

    renderPage();

    const shipped = within(qualifySection());

    for (const field of QUALIFY.fields) {
      const control = shipped.getByLabelText(FIELD_LABELS[field.name]);
      const label = qualifySection().querySelector(`label[for="${HAOO_PRODUCT.slug}-qualify-${field.name}"]`);

      expect(isFieldRequired(field, {}), field.name).toBe(field.required);
      expect((control as HTMLInputElement).required, field.name).toBe(field.required);
      expect(label?.textContent?.includes('(optional)'), field.name).toBe(!field.required);
      expect(label?.textContent, field.name).not.toContain('*');
    }

    expect(shipped.getAllByText('(optional)')).toHaveLength(OPTIONAL_FIELDS.length);
    cleanup();

    const optionalQualify: ProductQualifyForm = {
      ...QUALIFY,
      fields: [
        {
          name: 'organization',
          label: 'Organization',
          emailLabel: 'Organization',
          control: 'text',
          required: false,
          requiredMessage: 'Enter your organization',
          autoComplete: 'organization',
          maxLength: 120,
        },
      ],
      groups: [{ legend: 'About you', fieldNames: ['organization'] }],
    };

    const synthetic = within(
      render(
        <QualifyForm
          {...MEASUREMENT_PROPS}
          qualify={optionalQualify}
          contacts={HAOO_PRODUCT.contacts}
          productName="ZENITH"
          slug="zenith"
        />,
      ).container,
    );

    const optionalField = optionalQualify.fields[0];

    expect(isFieldRequired(optionalField, {})).toBe(false);
    expect(synthetic.getByText('(optional)', { exact: false })).toBeTruthy();
    expect((synthetic.getByLabelText(/^Organization/) as HTMLInputElement).required).toBe(false);
  });
});

describe('Phase 2 qualified enquiry pure contracts', () => {
  it('builds a deeply equal body for the same values on every call', () => {
    const values = {
      ...emptyValues(),
      ...requiredValues(),
      name: '  Jane Wanjiru  ',
    };

    expect(buildSubmissionBody(values, QUALIFY)).toEqual(buildSubmissionBody(values, QUALIFY));
    expect(buildSubmissionBody(values, QUALIFY)['Full name']).toBe('Jane Wanjiru');
  });

  it('omits empty optional values while always carrying the provider options', () => {
    const body = buildSubmissionBody(emptyValues(), QUALIFY);

    expect(Object.keys(body).sort()).toEqual(['Source', '_captcha', '_honey', '_subject', '_template']);
    expect(body._honey).toBe('');
    for (const option of FORBIDDEN_PROVIDER_OPTIONS) {
      expect(body).not.toHaveProperty(option);
    }
  });

  it('keys the payload byte-for-byte on the configured email labels', () => {
    const values: Record<string, string> = {
      ...emptyValues(),
      ...COMPLETE_ENQUIRY,
      role: 'Agency',
    };
    const body = buildSubmissionBody(values, QUALIFY);

    for (const field of QUALIFY.fields) {
      expect(Object.keys(body), field.name).toContain(field.emailLabel);
      expect(body[field.emailLabel], field.name).toBe(values[field.name]);
    }
    // A two-argument call carries no summary, so the pre-summary allowlist is exact.
    expect(Object.keys(body).sort()).toEqual(PRE_SUMMARY_BODY_KEYS);
  });

  it('reports one message per invalid field and none for a valid enquiry', () => {
    // One message per required field, and none for the three optional fields.
    expect(validateQualifyValues(emptyValues(), QUALIFY)).toEqual({
      name: 'Enter your full name',
      email: 'Enter your email address',
      preferredChannel: 'Select how we should reach you',
      role: 'Select your role',
      portfolioBand: 'Select how many units you manage',
      county: 'Select where your properties are',
      timeframe: 'Select when you would like to start',
    });

    expect(
      validateQualifyValues(
        { ...emptyValues(), ...requiredValues(), email: 'not-an-email' },
        QUALIFY,
      ),
    ).toEqual({ email: 'Enter an email address in the format name@example.com' });

    // Name plus email and the closed selects alone submit: phone stays optional at
    // this stage, so LEAD-01's usable contact method is satisfied by email (D-13).
    expect(validateQualifyValues({ ...emptyValues(), ...requiredValues() }, QUALIFY))
      .toEqual({});
    expect(validateQualifyValues({ ...emptyValues(), ...COMPLETE_ENQUIRY }, QUALIFY))
      .toEqual({});
  });

  it('counts length in the same UTF-16 code units the native maxLength attribute uses', () => {
    const overBound = 'a'.repeat(81);

    expect(overBound.length).toBe(81);
    expect(
      validateQualifyValues(
        { ...emptyValues(), ...requiredValues(), name: overBound },
        QUALIFY,
      ),
    ).toEqual({ name: 'Shorten your full name to 80 characters or fewer' });
  });

  it('rejects any select value outside its configured option allowlist', () => {
    expect(
      validateQualifyValues(
        { ...emptyValues(), ...requiredValues(), role: 'Administrator' },
        QUALIFY,
      ),
    ).toEqual({ role: 'Select your role' });

    // Every closed list is an allowlist, not just the tracer's role select.
    expect(
      validateQualifyValues(
        { ...emptyValues(), ...requiredValues(), county: 'Atlantis' },
        QUALIFY,
      ),
    ).toEqual({ county: 'Select where your properties are' });
    expect(
      validateQualifyValues(
        { ...emptyValues(), ...requiredValues(), portfolioBand: '6-20 units' },
        QUALIFY,
      ),
    ).toEqual({ portfolioBand: 'Select how many units you manage' });
  });
});

describe('Phase 2 qualified enquiry correction contracts', () => {
  it('keeps validation quiet until the first submit attempt', () => {
    stubFetch(async () => ({ ok: true }));
    renderPage();

    const name = controlByName('name');

    // Typing, emptying and leaving a required field is not a complaint-worthy event
    // before the visitor has ever asked to submit (D-22).
    fireEvent.change(name, { target: { value: 'J' } });
    fireEvent.blur(name);
    fireEvent.change(name, { target: { value: '' } });
    fireEvent.blur(name);
    fireEvent.change(controlByName('email'), { target: { value: 'not-an-email' } });
    fireEvent.blur(controlByName('email'));
    fireEvent.blur(controlByName('county'));

    expect(within(qualifySection()).queryByRole('alert')).toBeNull();
    expect(qualifySection().querySelectorAll('[id$="-error"]')).toHaveLength(0);
    for (const field of QUALIFY.fields) {
      expect(controlByName(field.name).getAttribute('aria-invalid'), field.name).toBeNull();
      expect(
        controlByName(field.name).getAttribute('aria-describedby') ?? '',
        field.name,
      ).not.toContain('-error');
    }
  });

  it('clears one field validation message as it is corrected and retains entered values', () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    fillControls({ name: 'Jane Wanjiru', county: 'Nairobi' });
    fireEvent.click(submitControl());

    expect(summaryLinkTexts()).toEqual([
      'Enter your email address',
      'Select how we should reach you',
      'Select your role',
      'Select how many units you manage',
      'Select when you would like to start',
    ]);

    // Correcting one field removes only that field's entry — and does not steal focus
    // from the control the visitor is working in.
    const role = controlByName('role');

    role.focus();
    fireEvent.change(role, { target: { value: 'Landlord' } });

    expect(document.activeElement).toBe(role);
    expect(summaryLinkTexts()).toEqual([
      'Enter your email address',
      'Select how we should reach you',
      'Select how many units you manage',
      'Select when you would like to start',
    ]);
    expect(qualifySection().querySelector(`#${HAOO_PRODUCT.slug}-qualify-role-error`))
      .toBeNull();
    expect(role.getAttribute('aria-invalid')).toBeNull();

    // Every other message, and every entered value, is untouched.
    expect(inlineError('email').textContent).toBe('Error: Enter your email address');
    expect((controlByName('name') as HTMLInputElement).value).toBe('Jane Wanjiru');
    expect((controlByName('county') as HTMLSelectElement).value).toBe('Nairobi');

    // A field made invalid after the first attempt updates its message in place, in
    // both surfaces, byte-identically.
    fireEvent.change(controlByName('email'), { target: { value: 'nope' } });

    expect(inlineError('email').textContent)
      .toBe('Error: Enter an email address in the format name@example.com');
    expect(summaryLinkTexts()[0])
      .toBe('Enter an email address in the format name@example.com');

    fireEvent.change(controlByName('email'), { target: { value: 'jane@example.com' } });

    expect(qualifySection().querySelector(`#${HAOO_PRODUCT.slug}-qualify-email-error`))
      .toBeNull();
    expect(summaryLinkTexts()).toEqual([
      'Select how we should reach you',
      'Select how many units you manage',
      'Select when you would like to start',
    ]);
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it('re-announces the problem summary on a repeat invalid submit', () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    fireEvent.click(submitControl());

    const before = summaryLinkTexts();

    expect(document.activeElement).toBe(summaryContainer());

    // The visitor moves away without fixing anything: the error set is unchanged, so a
    // second attempt must still move focus back rather than silently doing nothing.
    controlByName('name').focus();
    expect(document.activeElement).not.toBe(summaryContainer());

    fireEvent.click(submitControl());

    expect(summaryLinkTexts()).toEqual(before);
    expect(document.activeElement).toBe(summaryContainer());
    expect(within(qualifySection()).getAllByRole('alert')).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it('links every summary problem to its control in configured DOM order', () => {
    stubFetch(async () => ({ ok: true }));
    renderPage();
    fireEvent.click(submitControl());

    const links = Array.from(summaryContainer().querySelectorAll('a'));
    const invalidNames = QUALIFY.fields
      .filter((field) => field.required)
      .map((field) => field.name);

    expect(links.map((link) => link.getAttribute('href')))
      .toEqual(invalidNames.map((fieldName) => `#${HAOO_PRODUCT.slug}-qualify-${fieldName}`));
    for (const [index, fieldName] of invalidNames.entries()) {
      const control = controlByName(fieldName);

      expect(control.id, fieldName).toBe(`${HAOO_PRODUCT.slug}-qualify-${fieldName}`);
      expect(control.getAttribute('aria-invalid'), fieldName).toBe('true');
      expect(control.getAttribute('aria-describedby'), fieldName)
        .toContain(`${HAOO_PRODUCT.slug}-qualify-${fieldName}-error`);
      expect(links[index].textContent, fieldName)
        .toBe(inlineError(fieldName).textContent?.replace('Error: ', ''));
    }
  });

  it('rejects manipulated and over-bound values in the same validation pass', () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    fillControls(requiredValues());

    // A rogue option appended to a native select, and a value pushed past the native
    // maxLength: neither reaches the network.
    const role = controlByName('role') as HTMLSelectElement;
    const rogue = document.createElement('option');

    rogue.value = 'Administrator';
    rogue.textContent = 'Administrator';
    role.append(rogue);
    fireEvent.change(role, { target: { value: 'Administrator' } });
    fireEvent.change(controlByName('name'), { target: { value: 'a'.repeat(81) } });
    fireEvent.click(submitControl());

    expect(fetchSpy).toHaveBeenCalledTimes(0);
    expect(summaryLinkTexts()).toEqual([
      'Shorten your full name to 80 characters or fewer',
      'Select your role',
    ]);
    expect(inlineError('name').textContent)
      .toBe('Error: Shorten your full name to 80 characters or fewer');
    expect(inlineError('role').textContent).toBe('Error: Select your role');

    // Correcting them clears both, and only then does a request go out.
    fireEvent.change(controlByName('name'), { target: { value: 'Jane Wanjiru' } });
    fireEvent.change(role, { target: { value: 'Landlord' } });

    expect(within(qualifySection()).queryByRole('alert')).toBeNull();
  });
});

describe('Phase 2 conditional contact-channel contracts', () => {
  const CHANNEL = 'preferredChannel';
  const PHONE = 'phone';
  const PHONE_REQUIRED_MESSAGE =
    'Enter a phone number so we can reach you on the channel you chose';
  const PHONE_FORMAT_MESSAGE = 'Enter a phone number using digits, spaces, or +';
  const REACHABLE_CHANNELS = ['WhatsApp', 'Phone call'];

  function announcement(channel: string) {
    return `A phone number is now required because you asked us to reach you by ${channel}.`;
  }

  function labelFor(fieldName: string) {
    return qualifySection().querySelector(`label[for="${HAOO_PRODUCT.slug}-qualify-${fieldName}"]`) as HTMLElement;
  }

  it('leaves the phone field optional until a channel requires it', () => {
    stubFetch(async () => ({ ok: true }));
    renderPage();

    const phone = controlByName(PHONE) as HTMLInputElement;

    expect(phone.required).toBe(false);
    expect(phone.getAttribute('aria-required')).toBe('false');
    expect(labelFor(PHONE).textContent).toContain('(optional)');
    expect(statusRegion().textContent).toBe('');

    // A channel that does not need a phone number leaves every surface alone.
    fireEvent.change(controlByName(CHANNEL), { target: { value: 'Email' } });

    expect((controlByName(PHONE) as HTMLInputElement).required).toBe(false);
    expect(labelFor(PHONE).textContent).toContain('(optional)');
    expect(statusRegion().textContent).toBe('');
  });

  it('makes phone required in every surface for the channels that need it', () => {
    for (const channel of REACHABLE_CHANNELS) {
      cleanup();
      stubFetch(async () => ({ ok: true }));
      renderPage();

      fireEvent.change(controlByName(CHANNEL), { target: { value: channel } });

      const phone = controlByName(PHONE) as HTMLInputElement;

      expect(phone.required, channel).toBe(true);
      expect(phone.getAttribute('aria-required'), channel).toBe('true');
      expect(labelFor(PHONE).textContent, channel).toBe('Phone number');
      expect(labelFor(PHONE).textContent, channel).not.toContain('(optional)');
      expect(statusRegion().textContent, channel).toBe(announcement(channel));
      // Submission and measurement clearing keep distinct, persistently mounted regions.
      const regions = within(qualifySection()).getAllByRole('status');
      expect(regions, channel).toHaveLength(2);
      expect(regions.filter((region) => region.closest('details') !== null), channel)
        .toHaveLength(1);
    }
  });

  it('still announces a requiredness change after a failed submission', async () => {
    stubFetch(async () => ({ ok: false }));

    renderPage();
    fillControls(requiredValues());
    fireEvent.click(submitControl());

    await waitFor(() => expect(statusRegion().textContent)
      .toBe(QUALIFY_STATUS_MESSAGES.failed));

    // The form stays mounted and editable in the failed state, so an attribute flip made
    // now still needs its sentence: a stale terminal message cannot own the region.
    fireEvent.change(controlByName(CHANNEL), { target: { value: 'WhatsApp' } });

    expect(statusRegion().textContent).toBe(announcement('WhatsApp'));
    expect((controlByName(PHONE) as HTMLInputElement).required).toBe(true);
    expect((controlByName(PHONE) as HTMLInputElement).getAttribute('aria-required'))
      .toBe('true');
    expect(labelFor(PHONE).textContent).not.toContain('(optional)');
    expect(within(qualifySection()).getAllByRole('status')).toHaveLength(2);

    // Reversing the rule clears the sentence and hands the region back.
    fireEvent.change(controlByName(CHANNEL), { target: { value: 'Email' } });

    expect(statusRegion().textContent).toBe(QUALIFY_STATUS_MESSAGES.failed);
  });

  it('reports the locked message when a required phone is empty', () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    fillControls({ ...requiredValues(), preferredChannel: 'Phone call' });
    fireEvent.click(submitControl());

    expect(fetchSpy).toHaveBeenCalledTimes(0);
    expect(inlineError(PHONE).textContent).toBe(`Error: ${PHONE_REQUIRED_MESSAGE}`);
    expect(summaryLinkTexts()).toEqual([PHONE_REQUIRED_MESSAGE]);
    expect(controlByName(PHONE).getAttribute('aria-invalid')).toBe('true');
  });

  it('grows the summary the moment a dependent rule starts matching', () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    // A first invalid submit makes the summary the authoritative problem list, so from
    // here on it has to stay complete without a second submit to reveal what it missed.
    fillControls({ ...requiredValues(), name: '' });
    fireEvent.click(submitControl());

    expect(summaryLinkTexts()).toEqual(['Enter your full name']);

    fireEvent.change(controlByName(CHANNEL), { target: { value: 'WhatsApp' } });

    expect(summaryLinkTexts()).toEqual(['Enter your full name', PHONE_REQUIRED_MESSAGE]);
    expect(inlineError(PHONE).textContent).toBe(`Error: ${PHONE_REQUIRED_MESSAGE}`);
    expect(controlByName(PHONE).getAttribute('aria-invalid')).toBe('true');

    // Reversal is still symmetric: the entry leaves with the rule that created it.
    fireEvent.change(controlByName(CHANNEL), { target: { value: 'Email' } });

    expect(summaryLinkTexts()).toEqual(['Enter your full name']);
    expect(qualifySection().querySelector(`#${HAOO_PRODUCT.slug}-qualify-${PHONE}-error`)).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it('reverses requiredness and clears the phone error when the channel changes back', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    fillControls({ ...requiredValues(), preferredChannel: 'WhatsApp' });
    fireEvent.click(submitControl());

    expect(inlineError(PHONE).textContent).toBe(`Error: ${PHONE_REQUIRED_MESSAGE}`);

    fireEvent.change(controlByName(CHANNEL), { target: { value: 'Email' } });

    // All four surfaces reverse together, and the error goes with them.
    expect(qualifySection().querySelector(`#${HAOO_PRODUCT.slug}-qualify-${PHONE}-error`)).toBeNull();
    expect((controlByName(PHONE) as HTMLInputElement).required).toBe(false);
    expect(controlByName(PHONE).getAttribute('aria-required')).toBe('false');
    expect(labelFor(PHONE).textContent).toContain('(optional)');
    expect(statusRegion().textContent).toBe('');
    expect(within(qualifySection()).queryByRole('alert')).toBeNull();

    fireEvent.click(submitControl());

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(parseRequest(fetchSpy).body).not.toHaveProperty('Phone number');
  });

  it('keeps a typed phone number through every requiredness change', () => {
    stubFetch(async () => ({ ok: true }));
    renderPage();

    fireEvent.change(controlByName(PHONE), { target: { value: '+254 702 188 044' } });
    fireEvent.change(controlByName(CHANNEL), { target: { value: 'WhatsApp' } });
    fireEvent.change(controlByName(CHANNEL), { target: { value: 'Phone call' } });

    expect(statusRegion().textContent).toBe(announcement('Phone call'));

    fireEvent.change(controlByName(CHANNEL), { target: { value: 'Email' } });

    expect((controlByName(PHONE) as HTMLInputElement).value).toBe('+254 702 188 044');
  });

  it('accepts permissive phone formats and rejects disallowed characters', () => {
    const base = { ...emptyValues(), ...requiredValues() };

    for (const accepted of ['+254 702 188 044', '0702188044', '(020) 555-0199']) {
      expect(validateQualifyValues({ ...base, phone: accepted }, QUALIFY), accepted)
        .toEqual({});
    }
    // A value made only of separators has no digits to call, so the format rule rejects
    // it rather than letting it satisfy the conditional-required gate.
    for (const rejected of [
      'call me maybe',
      '0702-188-044 ext. 4',
      'zero seven',
      '-',
      '()',
      '( )  -',
      '+-',
    ]) {
      expect(validateQualifyValues({ ...base, phone: rejected }, QUALIFY), rejected)
        .toEqual({ phone: PHONE_FORMAT_MESSAGE });
    }

    // Conditional requiredness reaches the pure validator, not just the markup.
    expect(validateQualifyValues({ ...base, preferredChannel: 'WhatsApp' }, QUALIFY))
      .toEqual({ phone: PHONE_REQUIRED_MESSAGE });
    expect(
      validateQualifyValues(
        { ...base, preferredChannel: 'Phone call', phone: '0702188044' },
        QUALIFY,
      ),
    ).toEqual({});

    // The visitor's own formatting reaches the inbox unrewritten - no E.164 normalising.
    expect(
      buildSubmissionBody({ ...base, phone: '(020) 555-0199' }, QUALIFY)['Phone number'],
    ).toBe('(020) 555-0199');
  });

  it('drives a synthetic product conditional requiredness from configuration alone', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));
    const dependent: QualifyField = {
      name: 'siteAddress',
      label: 'Site address',
      emailLabel: 'Site address',
      control: 'text',
      required: false,
      requiredMessage: 'Enter the site address',
      autoComplete: 'off',
      maxLength: 120,
      requiredWhen: {
        field: 'contactMode',
        values: ['Site visit'],
        message: 'A site address is now required because you asked for a {value}.',
      },
    };
    const syntheticQualify: ProductQualifyForm = {
      ...QUALIFY,
      fields: [
        {
          name: 'contactMode',
          label: 'How should we meet?',
          emailLabel: 'Meeting mode',
          control: 'select',
          required: true,
          requiredMessage: 'Select how we should meet',
          autoComplete: 'off',
          placeholderOption: 'Select a mode',
          options: [
            { value: 'Site visit', label: 'Site visit' },
            { value: 'Video call', label: 'Video call' },
          ],
        },
        dependent,
      ],
      groups: [{ legend: 'About your visit', fieldNames: ['contactMode', 'siteAddress'] }],
    };

    // The descriptor alone decides requiredness - no product knowledge in the component.
    expect(isFieldRequired(dependent, {})).toBe(false);
    expect(isFieldRequired(dependent, { contactMode: 'Video call' })).toBe(false);
    expect(isFieldRequired(dependent, { contactMode: 'Site visit' })).toBe(true);
    expect(
      validateQualifyValues({ contactMode: 'Site visit', siteAddress: '' }, syntheticQualify),
    ).toEqual({ siteAddress: 'Enter the site address' });

    const { container } = render(
      <QualifyForm
        {...MEASUREMENT_PROPS}
        qualify={syntheticQualify}
        contacts={HAOO_PRODUCT.contacts}
        productName="ZENITH"
        slug="zenith"
      />,
    );
    const scoped = within(container);
    const mode = container.querySelector('#zenith-qualify-contactMode') as HTMLSelectElement;
    const address = () =>
      container.querySelector('#zenith-qualify-siteAddress') as HTMLInputElement;
    const addressLabel = () =>
      container.querySelector('label[for="zenith-qualify-siteAddress"]') as HTMLElement;

    expect(address().required).toBe(false);
    expect(addressLabel().textContent).toContain('(optional)');

    fireEvent.change(mode, { target: { value: 'Video call' } });

    expect(address().required).toBe(false);
    expect(scoped.getByRole('status').textContent).toBe('');

    fireEvent.change(mode, { target: { value: 'Site visit' } });

    expect(address().required).toBe(true);
    expect(address().getAttribute('aria-required')).toBe('true');
    expect(addressLabel().textContent).toBe('Site address');
    expect(scoped.getByRole('status').textContent)
      .toBe('A site address is now required because you asked for a Site visit.');
    expect(scoped.getAllByRole('status')).toHaveLength(1);

    fireEvent.click(scoped.getByRole('button', { name: QUALIFY_SUBMIT_LABEL }));

    expect(fetchSpy).toHaveBeenCalledTimes(0);
    expect(container.querySelector('#zenith-qualify-siteAddress-error')?.textContent)
      .toBe('Error: Enter the site address');

    fireEvent.change(mode, { target: { value: 'Video call' } });

    expect(container.querySelector('#zenith-qualify-siteAddress-error')).toBeNull();
    expect(address().required).toBe(false);
    expect(addressLabel().textContent).toContain('(optional)');
    expect(scoped.getByRole('status').textContent).toBe('');

    fireEvent.click(scoped.getByRole('button', { name: QUALIFY_SUBMIT_LABEL }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
  });

  it('keeps conditional-requiredness literals out of the generic component', () => {
    const source = readFileSync(
      resolve(import.meta.dirname, '../components/QualifyForm.tsx'),
      'utf8',
    );

    // The component reads a descriptor; it never recognises this product's controller
    // field, dependent field, or trigger option values.
    for (const literal of [CHANNEL, ...REACHABLE_CHANNELS]) {
      expect(source, literal).not.toContain(literal);
    }
    expect(source, PHONE).not.toMatch(/phone/i);

    // The descriptor itself is product data.
    const phoneField = QUALIFY.fields.find((field) => field.name === PHONE);

    expect(phoneField?.requiredWhen).toEqual({
      field: CHANNEL,
      values: REACHABLE_CHANNELS,
      message: 'A phone number is now required because you asked us to reach you by {value}.',
    });
    expect(phoneField?.formatPattern)
      .toBe('^(?=(?:[^0-9]*[0-9]){7,})\\+?[0-9 ()-]+$');
  });
});

/**
 * Phase 4 MEAS-05 / MEAS-08. Every expected string below is copied byte-for-byte from
 * `04-UI-SPEC.md` "Surface C — engagement summary sentences". The sentences are the
 * contract: they must read as coarse browser facts a visitor could read themselves,
 * never as a score, a rank, or a claim about a person.
 */
const SUMMARY_PREFIX = 'Browser context only; not a lead score.';
const SUMMARY_CLOSING =
  'These are coarse signals from this browser, not proof that the same person took each action.';
const SUMMARY_FALLBACK =
  'Browser context only; not a lead score. No engagement context was available in this browser.';
const VISIT_SENTENCES = {
  first: 'This browser had no earlier recorded HAOO visit.',
  returning: 'This browser has visited the HAOO page before.',
  frequent: 'This browser has visited the HAOO page several times.',
} as const;
const LAST_SEEN_SENTENCES = {
  today: 'The last recorded visit was today.',
  'this-week': 'The last recorded visit was earlier this week.',
  'this-month': 'The last recorded visit was earlier this month.',
  earlier: 'The last recorded visit was more than a month ago.',
} as const;
const FLAG_SENTENCES = {
  brochureViewed: 'This browser viewed the brochure.',
  brochureDownloaded: 'This browser downloaded the brochure.',
  qualifyStarted: 'This browser started the qualification form.',
  assistedContact: 'This browser opened an assisted-contact link.',
  selfOnboarding: 'This browser opened the HAOO self-onboarding link.',
} as const;
const NO_FLAGS_SENTENCE =
  'No brochure, contact, or self-onboarding actions were recorded in this browser.';

type SummaryContext = Parameters<typeof formatEngagementSummary>[0];

/** Flags in the shipped order, with the named ones true. */
function summaryFlags(...trueFlags: readonly string[]): Record<string, boolean> {
  return Object.fromEntries(
    HAOO_MEASUREMENT.interactionFlags.map((flag) => [flag, trueFlags.includes(flag)]),
  );
}

/**
 * A whole stored record, derivation members included. The formatter is handed the real
 * shape on purpose: the contract is that it picks three members out of it, not that the
 * caller hands it a pre-trimmed object.
 */
function summaryContext(overrides: Record<string, unknown> = {}): SummaryContext {
  return {
    version: HAOO_MEASUREMENT.schemaVersion,
    visitBand: 'first',
    lastSeenBand: 'today',
    flags: summaryFlags(),
    visitOrdinal: 1,
    lastSeenDay: '2026-02-11',
    ...overrides,
  } as SummaryContext;
}

function summaryOf(context: SummaryContext, campaign: Record<string, string> = {}) {
  return formatEngagementSummary(context, campaign, ENGAGEMENT_SUMMARY);
}

describe('Phase 4 emailed engagement summary', () => {
  it('reserves the engagement-summary label so no product field can claim it', () => {
    expect(ENGAGEMENT_SUMMARY_LABEL).toBe('HAOO engagement context');
    expect(RESERVED_EMAIL_LABELS.has(ENGAGEMENT_SUMMARY_LABEL)).toBe(true);
    expect(ENGAGEMENT_SUMMARY.emailLabel).toBe(ENGAGEMENT_SUMMARY_LABEL);

    // No shipped field may already be using it, or the summary would overwrite an answer.
    for (const field of QUALIFY.fields) {
      expect(field.emailLabel, field.name).not.toBe(ENGAGEMENT_SUMMARY_LABEL);
    }
  });

  it('assembles the first-visit summary in the locked order with no last-seen sentence', () => {
    expect(summaryOf(summaryContext())).toBe(
      `${SUMMARY_PREFIX} ${VISIT_SENTENCES.first} ${NO_FLAGS_SENTENCE} ${SUMMARY_CLOSING}`,
    );
  });

  it('assembles a returning summary with the last-seen band and the true flags in order', () => {
    const produced = summaryOf(
      summaryContext({
        visitBand: 'returning',
        lastSeenBand: 'this-week',
        visitOrdinal: 2,
        flags: summaryFlags('brochureViewed', 'qualifyStarted'),
      }),
    );

    expect(produced).toBe(
      [
        SUMMARY_PREFIX,
        VISIT_SENTENCES.returning,
        LAST_SEEN_SENTENCES['this-week'],
        FLAG_SENTENCES.brochureViewed,
        FLAG_SENTENCES.qualifyStarted,
        SUMMARY_CLOSING,
      ].join(' '),
    );
    expect(produced).not.toContain(NO_FLAGS_SENTENCE);
  });

  it('emits neither internal derivation value it was handed', () => {
    const produced = summaryOf(
      summaryContext({
        visitBand: 'frequent',
        lastSeenBand: 'earlier',
        visitOrdinal: 4,
        lastSeenDay: '2026-02-11',
      }),
    );

    expect(produced).not.toContain('2026-02-11');
    expect(produced).not.toMatch(/\d/);
    for (const field of DERIVATION_FIELDS) {
      expect(produced, field).not.toContain(field);
    }
  });

  it('returns the locked fallback for a context it cannot read', () => {
    expect(formatEngagementSummary(null, {}, ENGAGEMENT_SUMMARY)).toBe(SUMMARY_FALLBACK);
    expect(ENGAGEMENT_SUMMARY.fallback).toBe(SUMMARY_FALLBACK);
  });

  it('appends the summary to the submission body after Source', () => {
    const values = { ...emptyValues(), ...requiredValues() };
    const summary = summaryOf(summaryContext());
    const body = buildSubmissionBody(values, QUALIFY, summary);
    const keys = Object.keys(body);

    expect(body[ENGAGEMENT_SUMMARY_LABEL]).toBe(summary);
    expect(keys.indexOf(ENGAGEMENT_SUMMARY_LABEL)).toBe(keys.indexOf('Source') + 1);
    expect(keys.indexOf(ENGAGEMENT_SUMMARY_LABEL)).toBe(keys.length - 1);
  });

  it('leaves the payload unchanged for a two-argument caller', () => {
    const values = { ...emptyValues(), ...COMPLETE_ENQUIRY };

    expect(Object.keys(buildSubmissionBody(values, QUALIFY)).sort())
      .toEqual(PRE_SUMMARY_BODY_KEYS);
    expect(buildSubmissionBody(values, QUALIFY)).not.toHaveProperty(ENGAGEMENT_SUMMARY_LABEL);

    // An empty or blank summary is omitted rather than sent as a blank email row.
    expect(buildSubmissionBody(values, QUALIFY, ''))
      .not.toHaveProperty(ENGAGEMENT_SUMMARY_LABEL);
    expect(buildSubmissionBody(values, QUALIFY, '   '))
      .not.toHaveProperty(ENGAGEMENT_SUMMARY_LABEL);
  });

  it('sends one readable summary with a submitted enquiry', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    fillValidEnquiry();
    fireEvent.click(submitControl());

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    const { body } = parseRequest(fetchSpy);
    const summary = body[ENGAGEMENT_SUMMARY_LABEL];

    expect(typeof summary).toBe('string');
    expect(summary.trim()).not.toBe('');
    expect(summary.startsWith(SUMMARY_PREFIX)).toBe(true);
    expect(summary.endsWith(SUMMARY_CLOSING)).toBe(true);
    expect(summary.split('\n')).toHaveLength(1);
  });

  it('keeps the formatter product-generic and inside its pick list', () => {
    // Product identity is data. A formatter that named this product could not be reused,
    // and the copy it assembles is owner-approved product configuration, not code.
    expect(ENGAGEMENT_SUMMARY_SOURCE).not.toContain(HAOO_PRODUCT.name);
    expect(ENGAGEMENT_SUMMARY_SOURCE).not.toContain(HAOO_PRODUCT.slug);

    // The explicit pick list: three members named, and every other member of the stored
    // record absent from the module entirely.
    for (const key of SUMMARY_CONTEXT_KEYS) {
      expect(ENGAGEMENT_SUMMARY_SOURCE, key).toContain(key);
    }
    for (const key of CONTEXT_RECORD_KEYS) {
      if (SUMMARY_CONTEXT_KEYS.includes(key)) {
        continue;
      }

      expect(ENGAGEMENT_SUMMARY_SOURCE, key).not.toContain(key);
    }

    // Never spread the stored record into the summary or the body.
    expect(ENGAGEMENT_SUMMARY_SOURCE).not.toMatch(/\.\.\.context/);
  });
});

/**
 * Phase 4 MEAS-05 precision contract. The summary reports bands and facts, never a
 * count, an ordinal, a date, a rank or a rounded quantity — so there is no rounding or
 * tie-breaking rule that could be got wrong. What can be got wrong is a threshold, so
 * each band boundary and one step either side gets its own row with its own expected
 * sentence rather than a shared pass/fail flag.
 */
const SUMMARY_TODAY = new Date('2026-08-31T12:00:00.000Z');
const DAY_MS = 86_400_000;
const VISIT_BANDS = ['first', 'returning', 'frequent'] as const;
const LAST_SEEN_BANDS = ['today', 'this-week', 'this-month', 'earlier'] as const;
const CAMPAIGN_SOURCE = 'spring-sale';
const CAMPAIGN_MEDIUM = 'cpc';
const CAMPAIGN_NAME = 'kenya-landlords';

class SummaryMemoryStorage implements Storage {
  readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

/**
 * A context produced by the real measurement facade rather than hand-written. The band
 * thresholds belong to Phase 3's arithmetic, so driving them through `createMeasurement`
 * is what makes these rows a threshold contract instead of a restatement of the
 * formatter's own lookup table. `previousOrdinal` is the stored visit count; the facade
 * increments it on `initialize`, capping at four.
 */
function facadeContext(previousOrdinal: number | null, elapsedDays: number) {
  const storage = new SummaryMemoryStorage();

  if (previousOrdinal !== null) {
    const previousDay = new Date(SUMMARY_TODAY.getTime() - elapsedDays * DAY_MS);

    storage.setItem(
      HAOO_MEASUREMENT.storageKey,
      JSON.stringify({
        version: HAOO_MEASUREMENT.schemaVersion,
        visitBand: previousOrdinal >= 4
          ? 'frequent'
          : previousOrdinal >= 2 ? 'returning' : 'first',
        lastSeenBand: 'today',
        flags: summaryFlags(),
        visitOrdinal: previousOrdinal,
        lastSeenDay: previousDay.toISOString().slice(0, 10),
      }),
    );
  }

  const measurement = createMeasurement(HAOO_MEASUREMENT, {
    storage,
    now: () => SUMMARY_TODAY,
    location: { href: 'https://www.zero-paperhub.com/products/haoo/' },
    history: { state: null, replaceState: () => {} },
  });

  measurement.initialize();

  return measurement.readContext();
}

function campaignSummary(campaign: Record<string, string>) {
  return summaryOf(summaryContext(), campaign);
}

describe('Phase 4 engagement summary sentence matrix', () => {
  /**
   * Visit-band thresholds, one row per resulting visit count. Each row names the whole
   * expected string: a row sharing an expectation with its neighbour would let an
   * off-by-one band boundary satisfy half the table.
   */
  const visitRows = [
    {
      name: 'a first visit',
      previousOrdinal: null,
      expected: `${SUMMARY_PREFIX} ${VISIT_SENTENCES.first} ${NO_FLAGS_SENTENCE} ${SUMMARY_CLOSING}`,
    },
    {
      name: 'a second visit',
      previousOrdinal: 1,
      expected: `${SUMMARY_PREFIX} ${VISIT_SENTENCES.returning} ${LAST_SEEN_SENTENCES['this-week']} ${NO_FLAGS_SENTENCE} ${SUMMARY_CLOSING}`,
    },
    {
      name: 'a third visit',
      previousOrdinal: 2,
      expected: `${SUMMARY_PREFIX} ${VISIT_SENTENCES.returning} ${LAST_SEEN_SENTENCES['this-week']} ${NO_FLAGS_SENTENCE} ${SUMMARY_CLOSING}`,
    },
    {
      name: 'a fourth visit',
      previousOrdinal: 3,
      expected: `${SUMMARY_PREFIX} ${VISIT_SENTENCES.frequent} ${LAST_SEEN_SENTENCES['this-week']} ${NO_FLAGS_SENTENCE} ${SUMMARY_CLOSING}`,
    },
    {
      name: 'a visit past the capped count',
      previousOrdinal: 4,
      expected: `${SUMMARY_PREFIX} ${VISIT_SENTENCES.frequent} ${LAST_SEEN_SENTENCES['this-week']} ${NO_FLAGS_SENTENCE} ${SUMMARY_CLOSING}`,
    },
  ];

  for (const row of visitRows) {
    it(`describes ${row.name} with its own visit sentence`, () => {
      expect(summaryOf(facadeContext(row.previousOrdinal, 3))).toBe(row.expected);
    });
  }

  /**
   * Last-seen boundaries and one step either side: 0 is today, 1 and 7 bracket the week,
   * 8 and 30 bracket the month, 31 falls past it.
   */
  const lastSeenRows = [
    { elapsedDays: 0, expected: LAST_SEEN_SENTENCES.today },
    { elapsedDays: 1, expected: LAST_SEEN_SENTENCES['this-week'] },
    { elapsedDays: 7, expected: LAST_SEEN_SENTENCES['this-week'] },
    { elapsedDays: 8, expected: LAST_SEEN_SENTENCES['this-month'] },
    { elapsedDays: 30, expected: LAST_SEEN_SENTENCES['this-month'] },
    { elapsedDays: 31, expected: LAST_SEEN_SENTENCES.earlier },
  ];

  for (const row of lastSeenRows) {
    it(`describes ${row.elapsedDays} elapsed days with its own last-seen sentence`, () => {
      expect(summaryOf(facadeContext(1, row.elapsedDays))).toBe(
        `${SUMMARY_PREFIX} ${VISIT_SENTENCES.returning} ${row.expected} ${NO_FLAGS_SENTENCE} ${SUMMARY_CLOSING}`,
      );
    });
  }

  it('tells a recipient nothing about a previous visit that never happened', () => {
    const produced = summaryOf(facadeContext(null, 0));

    // A fresh record carries a same-day last-seen band for internal consistency. Saying
    // so would imply prior activity, so no last-seen sentence may appear at all.
    for (const sentence of Object.values(LAST_SEEN_SENTENCES)) {
      expect(produced, sentence).not.toContain(sentence);
    }
  });

  for (const [flag, sentence] of Object.entries(FLAG_SENTENCES)) {
    it(`describes ${flag} on its own`, () => {
      const produced = summaryOf(summaryContext({ flags: summaryFlags(flag) }));

      expect(produced).toBe(
        `${SUMMARY_PREFIX} ${VISIT_SENTENCES.first} ${sentence} ${SUMMARY_CLOSING}`,
      );
      for (const other of Object.values(FLAG_SENTENCES)) {
        if (other !== sentence) {
          expect(produced, other).not.toContain(other);
        }
      }
      expect(produced).not.toContain(NO_FLAGS_SENTENCE);
    });
  }

  it('emits every recorded action in the authored order', () => {
    const allFlags = HAOO_MEASUREMENT.interactionFlags;

    expect(summaryOf(summaryContext({ flags: summaryFlags(...allFlags) }))).toBe(
      [
        SUMMARY_PREFIX,
        VISIT_SENTENCES.first,
        FLAG_SENTENCES.brochureViewed,
        FLAG_SENTENCES.brochureDownloaded,
        FLAG_SENTENCES.qualifyStarted,
        FLAG_SENTENCES.assistedContact,
        FLAG_SENTENCES.selfOnboarding,
        SUMMARY_CLOSING,
      ].join(' '),
    );

    // Authored order, not stored order: a record whose keys arrive reversed must not
    // reorder the sentences a recipient reads.
    const reversed = Object.fromEntries(
      [...allFlags].reverse().map((flag) => [flag, true]),
    );

    expect(summaryOf(summaryContext({ flags: reversed })))
      .toBe(summaryOf(summaryContext({ flags: summaryFlags(...allFlags) })));
  });

  it('says so plainly when nothing was recorded', () => {
    const produced = summaryOf(summaryContext({ flags: summaryFlags() }));

    expect(produced).toContain(NO_FLAGS_SENTENCE);
    expect(produced.trim()).not.toBe('');
    for (const sentence of Object.values(FLAG_SENTENCES)) {
      expect(produced, sentence).not.toContain(sentence);
    }
  });

  const campaignRows: readonly {
    readonly name: string;
    readonly campaign: Record<string, string>;
    readonly expected: string;
  }[] = [
    { name: 'no campaign values', campaign: {}, expected: '' },
    {
      name: 'only a source',
      campaign: { utm_source: CAMPAIGN_SOURCE },
      expected: `Campaign values seen on arrival: source ${CAMPAIGN_SOURCE}.`,
    },
    {
      name: 'only a medium',
      campaign: { utm_medium: CAMPAIGN_MEDIUM },
      expected: `Campaign values seen on arrival: medium ${CAMPAIGN_MEDIUM}.`,
    },
    {
      name: 'only a campaign name',
      campaign: { utm_campaign: CAMPAIGN_NAME },
      expected: `Campaign values seen on arrival: campaign ${CAMPAIGN_NAME}.`,
    },
    {
      name: 'a source and a campaign name but no medium',
      campaign: { utm_campaign: CAMPAIGN_NAME, utm_source: CAMPAIGN_SOURCE },
      expected: `Campaign values seen on arrival: source ${CAMPAIGN_SOURCE}; campaign ${CAMPAIGN_NAME}.`,
    },
    {
      name: 'all three campaign values',
      campaign: {
        utm_campaign: CAMPAIGN_NAME,
        utm_medium: CAMPAIGN_MEDIUM,
        utm_source: CAMPAIGN_SOURCE,
      },
      expected: `Campaign values seen on arrival: source ${CAMPAIGN_SOURCE}; medium ${CAMPAIGN_MEDIUM}; campaign ${CAMPAIGN_NAME}.`,
    },
  ];

  for (const row of campaignRows) {
    it(`renders ${row.name}`, () => {
      const head = `${SUMMARY_PREFIX} ${VISIT_SENTENCES.first} ${NO_FLAGS_SENTENCE}`;

      // Fixed source, medium, campaign order regardless of the record's own key order,
      // and no placeholder for a key that was never in the address bar.
      expect(campaignSummary(row.campaign)).toBe(
        row.expected === ''
          ? `${head} ${SUMMARY_CLOSING}`
          : `${head} ${row.expected} ${SUMMARY_CLOSING}`,
      );
    });
  }

  it('emits no numeric quantity of any kind for any band and flag permutation', () => {
    const flagKeys = HAOO_MEASUREMENT.interactionFlags;
    let permutations = 0;

    for (const visitBand of VISIT_BANDS) {
      for (const lastSeenBand of LAST_SEEN_BANDS) {
        for (let mask = 0; mask < 2 ** flagKeys.length; mask += 1) {
          const flags = Object.fromEntries(
            flagKeys.map((flag, index) => [flag, (mask & (1 << index)) !== 0]),
          );
          const produced = summaryOf(
            summaryContext({ visitBand, lastSeenBand, flags }),
            {},
          );

          permutations += 1;
          expect(produced, `${visitBand}/${lastSeenBand}/${mask}`).not.toMatch(/\d/);
          expect(produced.startsWith(SUMMARY_PREFIX)).toBe(true);
          expect(produced.endsWith(SUMMARY_CLOSING)).toBe(true);
        }
      }
    }

    expect(permutations).toBe(
      VISIT_BANDS.length * LAST_SEEN_BANDS.length * 2 ** flagKeys.length,
    );
  });

  const failureRows = [
    { name: 'a missing record', build: () => null },
    {
      name: 'a record with no recorded actions member',
      build: () => ({ visitBand: 'returning', lastSeenBand: 'today' }),
    },
    {
      // A half-readable record is treated as unreadable. Emitting the prefix and the
      // boundary sentence around no facts at all would be a silently degraded email
      // that still reads as a successful summary.
      name: 'a record with no visit band',
      build: () => ({ lastSeenBand: 'today', flags: summaryFlags() }),
    },
    {
      name: 'a record with an unauthored visit band',
      build: () => ({
        visitBand: 'occasional',
        lastSeenBand: 'today',
        flags: summaryFlags(),
      }),
    },
    {
      name: 'a record with an unauthored last-seen band',
      build: () => ({
        visitBand: 'returning',
        lastSeenBand: 'last-quarter',
        flags: summaryFlags(),
      }),
    },
    {
      name: 'a record whose accessor throws',
      build: () => {
        const hostile = {};

        Object.defineProperty(hostile, 'visitBand', {
          enumerable: true,
          get() {
            throw new Error('context unavailable');
          },
        });

        return hostile;
      },
    },
  ];

  for (const row of failureRows) {
    it(`falls back rather than failing a submission for ${row.name}`, () => {
      const build = () => formatEngagementSummary(
        row.build() as SummaryContext,
        {},
        ENGAGEMENT_SUMMARY,
      );

      expect(build).not.toThrow();
      expect(build()).toBe(SUMMARY_FALLBACK);
    });
  }

  it('refuses a configuration that would ship an unlabelled or empty summary', () => {
    for (const member of ['emailLabel', 'fallback'] as const) {
      expect(
        () => formatEngagementSummary(
          summaryContext(),
          {},
          { ...ENGAGEMENT_SUMMARY, [member]: '  ' },
        ),
        member,
      ).toThrowError(/must declare a/);
    }
  });

  it('keeps the longest possible summary one readable, untruncated paragraph', () => {
    // The held-out maximum: frequent visit band, every flag true, and all three
    // normalized campaign values at their 32-character cap.
    const capped = 'a'.repeat(32);
    const produced = summaryOf(
      summaryContext({
        visitBand: 'frequent',
        lastSeenBand: 'earlier',
        flags: summaryFlags(...HAOO_MEASUREMENT.interactionFlags),
      }),
      { utm_source: capped, utm_medium: capped, utm_campaign: capped },
    );

    expect(produced.split('\n')).toHaveLength(1);
    expect(produced).not.toContain('…');
    expect(produced).not.toContain('...');
    expect(produced.startsWith(SUMMARY_PREFIX)).toBe(true);
    expect(produced.endsWith(SUMMARY_CLOSING)).toBe(true);
    expect(produced).toContain(
      `Campaign values seen on arrival: source ${capped}; medium ${capped}; campaign ${capped}.`,
    );

    // Every authored sentence survives intact; nothing is dropped or shortened to fit.
    for (const sentence of [
      VISIT_SENTENCES.frequent,
      LAST_SEEN_SENTENCES.earlier,
      ...Object.values(FLAG_SENTENCES),
    ]) {
      expect(produced, sentence).toContain(sentence);
    }
  });
});
