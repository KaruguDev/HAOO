import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
import { HAOO_PRODUCT } from '../products/haoo';
import type { ProductQualifyForm } from '../products/types';

const QUALIFY = HAOO_PRODUCT.qualify;
const SECTION_NAME = 'Send your details';
const EXPECTED_BODY_KEYS = [
  'Email address',
  'Full name',
  'Role',
  'Source',
  '_captcha',
  '_honey',
  '_subject',
  '_template',
];
const FIELD_LABELS: Record<string, string> = {
  name: 'Full name',
  email: 'Email address',
  role: 'Your role',
};
const FORBIDDEN_PROVIDER_OPTIONS = ['_cc', '_next', '_autoresponse', '_replyto'];

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

function fillValidEnquiry() {
  const section = within(qualifySection());

  fireEvent.change(section.getByLabelText('Full name'), {
    target: { value: 'Jane Wanjiru' },
  });
  fireEvent.change(section.getByLabelText('Email address'), {
    target: { value: 'jane@example.com' },
  });
  fireEvent.change(section.getByLabelText('Your role'), {
    target: { value: 'Landlord' },
  });
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
    // in for a label, and requiredness is exposed to assistive technology.
    for (const label of ['Full name', 'Email address', 'Your role']) {
      const control = section.getByLabelText(label);

      expect(control.hasAttribute('required')).toBe(true);
      expect(control.getAttribute('aria-required')).toBe('true');
    }

    // The browser's own submission blocking is deliberately disabled so that every
    // activation of the submit control reaches the single custom validation path.
    expect(qualifyForm().noValidate).toBe(true);

    fireEvent.click(submitControl());

    // Each message is rendered byte-identically twice: inline beside its control and
    // as the summary link text, in configured DOM order.
    expect(inlineError('name').textContent).toBe('Error: Enter your full name');
    expect(inlineError('email').textContent).toBe('Error: Enter your email address');
    expect(inlineError('role').textContent).toBe('Error: Select your role');
    expect(summaryLinkTexts()).toEqual([
      'Enter your full name',
      'Enter your email address',
      'Select your role',
    ]);
    for (const name of ['name', 'email', 'role']) {
      expect(section.getByLabelText(FIELD_LABELS[name]).getAttribute('aria-invalid')).toBe('true');
      expect(section.getByLabelText(FIELD_LABELS[name]).getAttribute('aria-describedby'))
        .toBe(`qualify-${name}-error`);
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

    // Nothing was invented on the visitor's behalf.
    for (const label of ['Full name', 'Email address', 'Your role']) {
      expect((section.getByLabelText(label) as HTMLInputElement).value).toBe('');
    }

    fillValidEnquiry();
    fireEvent.click(submitControl());

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
  });

  it('posts a readable, correctly-addressed payload', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: true }));

    renderPage();
    fillValidEnquiry();
    fireEvent.click(submitControl());

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    const { url, init, body } = parseRequest(fetchSpy);

    expect(url).toBe(QUALIFY.endpoint);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');

    expect(Object.keys(body).sort()).toEqual(EXPECTED_BODY_KEYS);
    expect(body._subject).toBe(QUALIFY.subject);
    expect(body._subject).toContain('HAOO');
    expect(body._template).toBe('table');
    expect(body._captcha).toBe('false');
    expect(body.Source).toBe(QUALIFY.sourceNote);
    expect(body['Full name']).toBe('Jane Wanjiru');
    expect(body['Email address']).toBe('jane@example.com');
    expect(body.Role).toBe('Landlord');

    // No visitor-supplied value may reach a header-shaped provider option.
    for (const option of FORBIDDEN_PROVIDER_OPTIONS) {
      expect(body).not.toHaveProperty(option);
    }
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
  });

  it('retains entered values and reports the problem when the provider rejects the request', async () => {
    const fetchSpy = stubFetch(async () => ({ ok: false }));

    renderPage();
    fillValidEnquiry();
    fireEvent.click(submitControl());

    await waitFor(() =>
      expect(statusRegion().textContent).toBe(QUALIFY_STATUS_MESSAGES.failed),
    );

    const section = within(qualifySection());

    expect((section.getByLabelText('Full name') as HTMLInputElement).value)
      .toBe('Jane Wanjiru');
    expect((section.getByLabelText('Email address') as HTMLInputElement).value)
      .toBe('jane@example.com');
    expect((section.getByLabelText('Your role') as HTMLSelectElement).value)
      .toBe('Landlord');

    // The control returns to its idle label so the retained values can be retried.
    expect(submitControl()).toBeTruthy();

    fireEvent.click(submitControl());
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
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

    const groups = within(qualifySection()).getAllByRole('group');

    expect(groups.map((group) => group.querySelector('legend')?.textContent))
      .toEqual(QUALIFY.groups.map((group) => group.legend));

    // Every configured field belongs to exactly one group, by configured name.
    const grouped = QUALIFY.groups.flatMap((group) => group.fieldNames);

    expect([...grouped].sort()).toEqual(QUALIFY.fields.map((field) => field.name).sort());
    expect(new Set(grouped).size).toBe(grouped.length);
    for (const [index, group] of QUALIFY.groups.entries()) {
      for (const name of group.fieldNames) {
        expect(groups[index].querySelector(`#qualify-${name}`)).not.toBeNull();
      }
    }
  });

  it('derives the optional label suffix from computed requiredness', () => {
    stubFetch(async () => ({ ok: true }));

    // Nothing in the shipped data is optional yet, and no source label carries the
    // suffix — it is rendered from `isFieldRequired`, never stored in copy.
    for (const field of QUALIFY.fields) {
      expect(field.label).not.toContain('(optional)');
    }
    expect(within(render(<ProductPage product={HAOO_PRODUCT} />).container).queryByText(/\(optional\)/))
      .toBeNull();

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

    render(
      <QualifyForm
        qualify={optionalQualify}
        contacts={HAOO_PRODUCT.contacts}
        productName="ZENITH"
      />,
    );

    const optionalField = optionalQualify.fields[0];

    expect(isFieldRequired(optionalField, {})).toBe(false);
    expect(screen.getByText('(optional)', { exact: false })).toBeTruthy();
    expect((screen.getByLabelText(/^Organization/) as HTMLInputElement).required).toBe(false);
  });
});

describe('Phase 2 qualified enquiry pure contracts', () => {
  it('builds a deeply equal body for the same values on every call', () => {
    const values = {
      ...emptyValues(),
      name: '  Jane Wanjiru  ',
      email: 'jane@example.com',
      role: 'Landlord',
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
    const values = {
      ...emptyValues(),
      name: 'Jane',
      email: 'jane@example.com',
      role: 'Agency',
    };
    const body = buildSubmissionBody(values, QUALIFY);

    for (const field of QUALIFY.fields) {
      expect(Object.keys(body)).toContain(field.emailLabel);
    }
  });

  it('reports one message per invalid field and none for a valid enquiry', () => {
    expect(validateQualifyValues(emptyValues(), QUALIFY)).toEqual({
      name: 'Enter your full name',
      email: 'Enter your email address',
      role: 'Select your role',
    });

    expect(
      validateQualifyValues(
        { ...emptyValues(), name: 'Jane', email: 'not-an-email', role: 'Landlord' },
        QUALIFY,
      ),
    ).toEqual({ email: 'Enter an email address in the format name@example.com' });

    expect(
      validateQualifyValues(
        { ...emptyValues(), name: 'Jane', email: 'jane@example.com', role: 'Landlord' },
        QUALIFY,
      ),
    ).toEqual({});
  });

  it('counts length in the same UTF-16 code units the native maxLength attribute uses', () => {
    const overBound = 'a'.repeat(81);

    expect(overBound.length).toBe(81);
    expect(
      validateQualifyValues(
        { ...emptyValues(), name: overBound, email: 'jane@example.com', role: 'Landlord' },
        QUALIFY,
      ),
    ).toEqual({ name: 'Shorten your full name to 80 characters or fewer' });
  });

  it('rejects any select value outside its configured option allowlist', () => {
    expect(
      validateQualifyValues(
        { ...emptyValues(), name: 'Jane', email: 'jane@example.com', role: 'Administrator' },
        QUALIFY,
      ),
    ).toEqual({ role: 'Select your role' });
  });
});
