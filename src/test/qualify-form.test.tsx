import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import QualifyForm, {
  buildSubmissionBody,
  isFieldRequired,
  QUALIFY_STATUS_MESSAGES,
  QUALIFY_SUBMIT_LABEL,
  QUALIFY_SUBMITTING_LABEL,
  QUALIFY_SUMMARY_HEADING,
  validateQualifyValues,
} from '../components/QualifyForm';
import ProductPage from '../pages/ProductPage';
import {
  CONTACT_CHANNEL_OPTIONS,
  HAOO_PRODUCT,
  KENYAN_COUNTY_OPTIONS,
  PORTFOLIO_BAND_OPTIONS,
  ROLE_OPTIONS,
  TIMEFRAME_OPTIONS,
} from '../products/haoo';
import type { ProductQualifyForm, QualifyField } from '../products/types';

const QUALIFY = HAOO_PRODUCT.qualify;
const SECTION_NAME = 'Send your details';
/** The ten readable email labels (LEAD-04) plus the provider options, sorted. */
const EXPECTED_BODY_KEYS = [
  'Email address',
  'Full name',
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
const FORBIDDEN_PROVIDER_OPTIONS = ['_cc', '_next', '_autoresponse', '_replyto'];
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
  const node = qualifySection().querySelector(`#qualify-${fieldName}`);

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
  const node = qualifySection().querySelector(`#qualify-${fieldName}-error`);

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
  return within(qualifySection()).getByRole('status');
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
        .toBe(`qualify-${field.name}-error`);
    }

    // An untouched optional field is not an error and is never described by one.
    for (const field of OPTIONAL_FIELDS) {
      const control = section.getByLabelText(FIELD_LABELS[field.name]);

      expect(control.getAttribute('aria-invalid'), field.name).toBeNull();
      expect(qualifySection().querySelector(`#qualify-${field.name}-error`), field.name)
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
    expect(section.getByText(
      "We've sent your name, contact details, and the answers you gave to the HAOO team. Someone will reply within one business day.",
    )).toBeTruthy();
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

    expect(parseRequest(fetchSpy).body).toEqual(JSON.parse(
      String((fetchSpy.mock.calls[1][1] as RequestInit).body),
    ));
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
      <QualifyForm qualify={QUALIFY} contacts={zenithContacts} productName="ZENITH" />,
    );

    for (const [name, value] of Object.entries(requiredValues())) {
      fireEvent.change(first.container.querySelector(`#qualify-${name}`) as HTMLElement, {
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
      <QualifyForm qualify={QUALIFY} contacts={zenithContacts} productName="ZENITH" />,
    );

    for (const [name, value] of Object.entries(requiredValues())) {
      fireEvent.change(second.container.querySelector(`#qualify-${name}`) as HTMLElement, {
        target: { value },
      });
    }
    fireEvent.click(within(second.container).getByRole('button', {
      name: QUALIFY_SUBMIT_LABEL,
    }));
    expect(await within(second.container).findByText(
      /answers you gave to the ZENITH team.*one business day/,
    )).toBeTruthy();
    expect(within(second.container).getByRole('link', {
      name: 'Message ZENITH on WhatsApp instead',
    }).getAttribute('href')).toBe(zenithContacts.whatsappHref);

    const genericSources = [
      '../components/QualifyForm.tsx',
      '../components/QualifyFallback.tsx',
      '../products/copy.ts',
    ];

    for (const sourcePath of genericSources) {
      expect(readFileSync(resolve(import.meta.dirname, sourcePath), 'utf8'), sourcePath)
        .not.toMatch(/HAOO/);
    }
  });

  it('traps bots without blocking assistive technology', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();

    const honeypot = qualifySection().querySelector('#qualify-website') as HTMLInputElement;
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
    const groups = section.getAllByRole('group');

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

        expect(groups[index].querySelector(`#qualify-${name}`), name).not.toBeNull();
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
      const label = qualifySection().querySelector(`label[for="qualify-${field.name}"]`);

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
          qualify={optionalQualify}
          contacts={HAOO_PRODUCT.contacts}
          productName="ZENITH"
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
    expect(Object.keys(body).sort()).toEqual(EXPECTED_BODY_KEYS);
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
    expect(qualifySection().querySelector('#qualify-role-error')).toBeNull();
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

    expect(qualifySection().querySelector('#qualify-email-error')).toBeNull();
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
      .toEqual(invalidNames.map((fieldName) => `#qualify-${fieldName}`));
    for (const [index, fieldName] of invalidNames.entries()) {
      const control = controlByName(fieldName);

      expect(control.id, fieldName).toBe(`qualify-${fieldName}`);
      expect(control.getAttribute('aria-invalid'), fieldName).toBe('true');
      expect(control.getAttribute('aria-describedby'), fieldName)
        .toContain(`qualify-${fieldName}-error`);
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
    return qualifySection().querySelector(`label[for="qualify-${fieldName}"]`) as HTMLElement;
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
      // One region, still the same node - never a second live region and never a role
      // swapped onto an already-mounted element.
      expect(within(qualifySection()).getAllByRole('status'), channel).toHaveLength(1);
    }
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

  it('reverses requiredness and clears the phone error when the channel changes back', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    fillControls({ ...requiredValues(), preferredChannel: 'WhatsApp' });
    fireEvent.click(submitControl());

    expect(inlineError(PHONE).textContent).toBe(`Error: ${PHONE_REQUIRED_MESSAGE}`);

    fireEvent.change(controlByName(CHANNEL), { target: { value: 'Email' } });

    // All four surfaces reverse together, and the error goes with them.
    expect(qualifySection().querySelector(`#qualify-${PHONE}-error`)).toBeNull();
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
    for (const rejected of ['call me maybe', '0702-188-044 ext. 4', 'zero seven']) {
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
        qualify={syntheticQualify}
        contacts={HAOO_PRODUCT.contacts}
        productName="ZENITH"
      />,
    );
    const scoped = within(container);
    const mode = container.querySelector('#qualify-contactMode') as HTMLSelectElement;
    const address = () => container.querySelector('#qualify-siteAddress') as HTMLInputElement;
    const addressLabel = () =>
      container.querySelector('label[for="qualify-siteAddress"]') as HTMLElement;

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
    expect(container.querySelector('#qualify-siteAddress-error')?.textContent)
      .toBe('Error: Enter the site address');

    fireEvent.change(mode, { target: { value: 'Video call' } });

    expect(container.querySelector('#qualify-siteAddress-error')).toBeNull();
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
    expect(phoneField?.formatPattern).toBe('^\\+?[0-9 ()-]+$');
  });
});
