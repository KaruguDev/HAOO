import { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProductPage from '../pages/ProductPage';
import { createMeasurement } from '../measurement';
import {
  HAOO_MEASUREMENT,
  HAOO_MEASUREMENT_EVENTS,
  HAOO_PRODUCT,
} from '../products/haoo';

const CONTEXT_KEY = 'zph.haoo.ctx.v1';
const APPROVED_COLLECTION_NOTICE =
  'This page remembers only coarse HAOO engagement signals — whether you visited before, roughly when you last visited, and whether you viewed or downloaded the brochure, started this form, contacted HAOO, or opened self-onboarding. These signals stay separate from your form answers, and no engagement summary is attached to this submission yet.';

const SIGNAL_DISCLOSURES = [
  'That you viewed this HAOO page.',
  'That the brochure preview became available.',
  'That you opened the brochure.',
  'That you downloaded the brochure.',
  'That you started the qualification form.',
  "That you tried to send the qualification form after it passed the page's checks.",
  'That you chose WhatsApp to contact HAOO.',
  'That you chose phone to contact HAOO.',
  'That you chose email to contact HAOO.',
  'That you opened HAOO self-onboarding.',
] as const;

afterEach(() => {
  window.history.replaceState({}, '', '/products/haoo/');
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function fillValidQualification() {
  const values = [
    ['Full name', 'Jane Wanjiru'],
    ['Email address', 'jane@example.com'],
    ['How should we reach you?', 'Email'],
    ['Your role', 'Landlord'],
    ['How many units do you manage?', '6\u201320 units'],
    ['Where are your properties?', 'Nairobi'],
    ['When would you like to start?', 'Ready now'],
  ] as const;

  for (const [label, value] of values) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
}

describe('Phase 3 HAOO page-view measurement tracer', () => {
  it('rebinds measurement storage, sink, page view, and vocabulary when product changes', () => {
    const firstSink = vi.fn();
    const secondSink = vi.fn();
    const secondEvents = HAOO_MEASUREMENT_EVENTS.map((event) => (
      event.replace(/^haoo_/, 'other_')
    ));
    const secondInteractionEvents = {
      brochurePreview: 'other_brochure_preview',
      brochureOpen: 'other_brochure_open',
      brochureDownload: 'other_brochure_download',
      qualifyStart: 'other_qualify_start',
      qualifySubmit: 'other_qualify_submit',
      assistedWhatsapp: 'other_assisted_whatsapp',
      assistedPhone: 'other_assisted_phone',
      assistedEmail: 'other_assisted_email',
      selfOnboarding: 'other_self_onboarding',
    } as const;
    const secondProduct = {
      ...HAOO_PRODUCT,
      slug: 'other',
      name: 'Other',
      measurement: {
        ...HAOO_PRODUCT.measurement,
        productKey: 'other',
        storageKey: 'zph.other.ctx.v1',
        events: secondEvents,
        pageViewEvent: 'other_page_view',
        interactionEvents: secondInteractionEvents,
        interactionEventFlags: {
          other_brochure_preview: 'brochureViewed',
          other_brochure_open: 'brochureViewed',
          other_brochure_download: 'brochureDownloaded',
          other_qualify_start: 'qualifyStarted',
          other_assisted_whatsapp: 'assistedContact',
          other_assisted_phone: 'assistedContact',
          other_assisted_email: 'assistedContact',
          other_self_onboarding: 'selfOnboarding',
        },
        disclosure: {
          ...HAOO_PRODUCT.measurement.disclosure,
          signalLines: Object.fromEntries(
            secondEvents.map((event) => [event, `That ${event} happened.`]),
          ),
        },
      },
    };

    const page = render(
      <ProductPage
        product={HAOO_PRODUCT}
        measurementAdapters={{ eventSink: firstSink }}
      />,
    );

    expect(firstSink.mock.calls).toEqual([['haoo_page_view']]);
    expect(window.localStorage.getItem(CONTEXT_KEY)).not.toBeNull();

    page.rerender(
      <ProductPage
        product={secondProduct}
        measurementAdapters={{ eventSink: secondSink }}
      />,
    );

    expect(firstSink.mock.calls).toEqual([['haoo_page_view']]);
    expect(secondSink.mock.calls).toEqual([['other_page_view']]);
    expect(window.localStorage.getItem('zph.other.ctx.v1')).not.toBeNull();

    fireEvent.focus(screen.getByLabelText('Full name'));

    expect(secondSink.mock.calls).toEqual([
      ['other_page_view'],
      ['other_qualify_start'],
    ]);
    expect(firstSink.mock.calls).toEqual([['haoo_page_view']]);
  });

  it('traces one privacy-bounded HAOO page view', () => {
    window.history.replaceState(
      {},
      '',
      '/products/haoo/?utm_source=Partner&utm_medium=EMAIL&utm_campaign=Launch-2026&utm_term=private',
    );
    const eventSink = vi.fn();

    render(
      <StrictMode>
        <ProductPage
          product={HAOO_PRODUCT}
          measurementAdapters={{ eventSink }}
        />
      </StrictMode>,
    );

    expect(eventSink).toHaveBeenCalledTimes(1);
    expect(eventSink).toHaveBeenCalledWith('haoo_page_view');
    expect(window.location.pathname).toBe('/products/haoo/');
    expect(window.location.search).toBe('');

    const context = JSON.parse(window.localStorage.getItem(CONTEXT_KEY) ?? 'null');
    expect(context).toEqual({
      version: 1,
      visitBand: 'first',
      lastSeenBand: 'today',
      flags: {
        brochureViewed: false,
        brochureDownloaded: false,
        qualifyStarted: false,
        assistedContact: false,
        selfOnboarding: false,
      },
      visitOrdinal: 1,
      lastSeenDay: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
    expect(Object.keys(context)).toEqual([
      'version',
      'visitBand',
      'lastSeenBand',
      'flags',
      'visitOrdinal',
      'lastSeenDay',
    ]);
  });

  it('keeps the journey usable when browser measurement APIs throw', () => {
    const storageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    const replaceState = window.history.replaceState;

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage is blocked', 'SecurityError');
      },
    });
    window.history.replaceState = vi.fn(() => {
      throw new DOMException('History is blocked', 'SecurityError');
    });

    try {
      render(
        <StrictMode>
          <ProductPage product={HAOO_PRODUCT} />
        </StrictMode>,
      );

      expect(screen.getByRole('heading', {
        level: 1,
        name: 'Run the business—not the paperwork.',
      })).toBeTruthy();
      expect(screen.getAllByRole('link', { name: 'Chat with HAOO on WhatsApp' }))
        .toHaveLength(3);
      expect(screen.getAllByRole('link', { name: 'Start with HAOO' })
        .every((link) => link.getAttribute('href') === 'https://manage.haoo.online/'))
        .toBe(true);
    } finally {
      if (storageDescriptor) {
        Object.defineProperty(window, 'localStorage', storageDescriptor);
      }
      window.history.replaceState = replaceState;
    }
  });

  it('rejects empty, null, normalized, and unknown event names at runtime', () => {
    const eventSink = vi.fn();
    const measurement = createMeasurement(HAOO_MEASUREMENT, { eventSink });
    const dynamicTrack = measurement.track as (event: unknown) => boolean;

    expect(dynamicTrack('')).toBe(false);
    expect(dynamicTrack(null)).toBe(false);
    expect(dynamicTrack('HAOO_PAGE_VIEW')).toBe(false);
    expect(dynamicTrack('haoo_page_vie\u212A')).toBe(false);
    expect(eventSink).not.toHaveBeenCalled();
  });

  it('keeps only a unique, whole-value-valid bounded campaign in page memory', () => {
    const location = {
      href: 'https://www.zero-paperhub.com/products/haoo/?utm_source=%20Partner%20&utm_medium=email&utm_campaign=launch-2026&utm_campaign=duplicate&utm_content=creative&utm_term=private',
    };
    const history = { state: null, replaceState: vi.fn() };
    const measurement = createMeasurement(HAOO_MEASUREMENT, { location, history });

    measurement.initialize();

    expect(measurement.readCampaign()).toEqual({
      utm_source: 'partner',
      utm_medium: 'email',
    });
    expect(history.replaceState).toHaveBeenCalledWith(null, '', '/products/haoo/');
    expect(JSON.stringify(measurement.readContext())).not.toContain('utm_');
  });
});

describe('Phase 3 HAOO journey measurement expansion', () => {
  it('measures brochure availability once and every deliberate brochure action', () => {
    const eventSink = vi.fn();

    render(
      <StrictMode>
        <ProductPage
          product={HAOO_PRODUCT}
          measurementAdapters={{ eventSink }}
        />
      </StrictMode>,
    );
    eventSink.mockClear();

    const brochure = screen.getByRole('region', { name: 'Brochure' });
    const preview = within(brochure).getByRole('img', {
      name: HAOO_PRODUCT.brochure.previewImageAlt,
    });
    const object = brochure.querySelector('object[type="application/pdf"]');
    const open = within(brochure).getByRole('link', {
      name: /Open brochure.*new tab/i,
    });
    const download = within(brochure).getByRole('link', {
      name: 'Download brochure',
    });

    expect(object).not.toBeNull();
    fireEvent.load(preview);
    fireEvent.load(object!);
    fireEvent.click(open);
    fireEvent.click(open);
    fireEvent.click(download);
    fireEvent.click(download);

    expect(eventSink.mock.calls).toEqual([
      ['haoo_brochure_preview'],
      ['haoo_brochure_open'],
      ['haoo_brochure_open'],
      ['haoo_brochure_download'],
      ['haoo_brochure_download'],
    ]);
  });

  it('measures brochure actions without changing recovery or native destinations when the sink throws', () => {
    const eventSink = vi.fn<(event: string) => never>(() => {
      throw new Error('provider unavailable');
    });

    render(
      <ProductPage
        product={HAOO_PRODUCT}
        measurementAdapters={{ eventSink }}
      />,
    );
    eventSink.mockClear();

    const brochure = screen.getByRole('region', { name: 'Brochure' });
    const preview = within(brochure).getByRole('img', {
      name: HAOO_PRODUCT.brochure.previewImageAlt,
    });
    const open = within(brochure).getByRole('link', {
      name: /Open brochure.*new tab/i,
    });
    const download = within(brochure).getByRole('link', {
      name: 'Download brochure',
    });
    const openDestination = open.outerHTML;
    const downloadDestination = download.outerHTML;

    expect(() => fireEvent.load(preview)).not.toThrow();
    expect(() => fireEvent.click(open)).not.toThrow();
    expect(() => fireEvent.click(download)).not.toThrow();
    expect(open.outerHTML).toBe(openDestination);
    expect(download.outerHTML).toBe(downloadDestination);

    fireEvent.error(preview);
    expect(within(brochure).getByText(
      "We couldn't show the brochure preview here. Open the brochure or download the PDF instead.",
    )).toBeTruthy();
    expect(within(brochure).getByRole('link', {
      name: /Open brochure.*new tab/i,
    }).getAttribute('href')).toBe(HAOO_PRODUCT.brochure.pdfHref);
    expect(within(brochure).getByRole('link', {
      name: 'Download brochure',
    }).getAttribute('download')).toBe(HAOO_PRODUCT.brochure.downloadName);
  });

  it('measures every assisted and self-onboarding activation at all three placements', () => {
    const eventSink = vi.fn();

    render(
      <ProductPage
        product={HAOO_PRODUCT}
        measurementAdapters={{ eventSink }}
      />,
    );
    eventSink.mockClear();

    const cases = [
      {
        name: 'Chat with HAOO on WhatsApp',
        href: HAOO_PRODUCT.contacts.whatsappHref,
        event: 'haoo_assisted_whatsapp',
        repetitions: 2,
      },
      {
        name: `Call ${HAOO_PRODUCT.contacts.phoneDisplay}`,
        href: HAOO_PRODUCT.contacts.phoneHref,
        event: 'haoo_assisted_phone',
        repetitions: 1,
      },
      {
        name: `Email ${HAOO_PRODUCT.contacts.email}`,
        href: HAOO_PRODUCT.contacts.emailHref,
        event: 'haoo_assisted_email',
        repetitions: 1,
      },
      {
        name: 'Start with HAOO',
        href: HAOO_PRODUCT.contacts.selfOnboardingHref,
        event: 'haoo_self_onboarding',
        repetitions: 1,
      },
    ] as const;

    for (const activation of cases) {
      const links = screen.getAllByRole('link', { name: activation.name });
      expect(links).toHaveLength(3);

      for (const link of links) {
        const nativeMarkup = link.outerHTML;
        expect(link.getAttribute('href')).toBe(activation.href);

        for (let index = 0; index < activation.repetitions; index += 1) {
          fireEvent.click(link);
        }

        expect(link.outerHTML).toBe(nativeMarkup);
      }
    }

    expect(eventSink.mock.calls).toEqual([
      ...Array.from({ length: 6 }, () => ['haoo_assisted_whatsapp']),
      ...Array.from({ length: 3 }, () => ['haoo_assisted_phone']),
      ...Array.from({ length: 3 }, () => ['haoo_assisted_email']),
      ...Array.from({ length: 3 }, () => ['haoo_self_onboarding']),
    ]);
    expect(eventSink.mock.calls.every((call) => call.length === 1)).toBe(true);
  });

  it('keeps every onboarding destination native when assisted measurement throws', () => {
    const eventSink = vi.fn<(event: string) => never>(() => {
      throw new Error('provider unavailable');
    });

    render(
      <ProductPage
        product={HAOO_PRODUCT}
        measurementAdapters={{ eventSink }}
      />,
    );
    eventSink.mockClear();

    const destinations = [
      ['Chat with HAOO on WhatsApp', HAOO_PRODUCT.contacts.whatsappHref],
      [`Call ${HAOO_PRODUCT.contacts.phoneDisplay}`, HAOO_PRODUCT.contacts.phoneHref],
      [`Email ${HAOO_PRODUCT.contacts.email}`, HAOO_PRODUCT.contacts.emailHref],
      ['Start with HAOO', HAOO_PRODUCT.contacts.selfOnboardingHref],
    ] as const;

    for (const [name, href] of destinations) {
      for (const link of screen.getAllByRole('link', { name })) {
        const nativeMarkup = link.outerHTML;
        expect(() => fireEvent.click(link)).not.toThrow();
        expect(link.getAttribute('href')).toBe(href);
        expect(link.outerHTML).toBe(nativeMarkup);
      }
    }
  });

  it('measures qualification start once and only validation-admitted submit attempts', async () => {
    const eventSink = vi.fn();
    const fetchSpy = vi.fn<(input: string, init?: RequestInit) => Promise<never>>(() => (
      Promise.reject(new Error('network unavailable'))
    ));
    vi.stubGlobal('fetch', fetchSpy);

    render(
      <StrictMode>
        <ProductPage
          product={HAOO_PRODUCT}
          measurementAdapters={{ eventSink }}
        />
      </StrictMode>,
    );
    eventSink.mockClear();

    const name = screen.getByLabelText('Full name');
    fireEvent.focus(name);
    fireEvent.change(name, { target: { value: 'Jane Wanjiru' } });
    fireEvent.focus(screen.getByLabelText('Email address'));
    expect(eventSink.mock.calls).toEqual([['haoo_qualify_start']]);

    fireEvent.click(screen.getByRole('button', { name: 'Send my details' }));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(eventSink.mock.calls).toEqual([['haoo_qualify_start']]);

    fillValidQualification();
    eventSink.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Send my details' }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(eventSink.mock.calls).toEqual([['haoo_qualify_submit']]);
    expect(eventSink.mock.calls[0]).toHaveLength(1);

    const requestBody = JSON.parse(
      String((fetchSpy.mock.calls[0][1] as RequestInit).body),
    ) as Record<string, string>;
    expect(JSON.stringify(eventSink.mock.calls)).not.toContain('Jane Wanjiru');
    expect(JSON.stringify(eventSink.mock.calls)).not.toContain('Nairobi');
    expect(requestBody['Full name']).toBe('Jane Wanjiru');

    await screen.findByRole('button', { name: 'Try sending again' });
    fireEvent.click(screen.getByRole('button', { name: 'Try sending again' }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(eventSink.mock.calls).toEqual([
      ['haoo_qualify_submit'],
      ['haoo_qualify_submit'],
    ]);
  });

  it('keeps qualification validation, retained values, retry, and outcome independent of measurement failure', async () => {
    const eventSink = vi.fn<(event: string) => never>(() => {
      throw new Error('provider unavailable');
    });
    const fetchSpy = vi.fn<(input: string, init?: RequestInit) => Promise<never>>(() => (
      Promise.reject(new Error('network unavailable'))
    ));
    vi.stubGlobal('fetch', fetchSpy);

    render(
      <ProductPage
        product={HAOO_PRODUCT}
        measurementAdapters={{ eventSink }}
      />,
    );
    eventSink.mockClear();

    expect(() => fireEvent.focus(screen.getByLabelText('Full name'))).not.toThrow();
    fireEvent.click(screen.getByRole('button', { name: 'Send my details' }));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeTruthy();

    fillValidQualification();
    fireEvent.click(screen.getByRole('button', { name: 'Send my details' }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("We couldn't send your details.")).toBeTruthy();
    expect((screen.getByLabelText('Full name') as HTMLInputElement).value)
      .toBe('Jane Wanjiru');

    fireEvent.click(screen.getByRole('button', { name: 'Try sending again' }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(eventSink.mock.calls.every((call) => call.length === 1)).toBe(true);
  });
});

describe('Phase 3 HAOO measurement disclosure', () => {
  it('does not treat disclosure and clear-control interaction as qualification start', () => {
    const eventSink = vi.fn();

    render(
      <ProductPage
        product={HAOO_PRODUCT}
        measurementAdapters={{ eventSink }}
      />,
    );
    eventSink.mockClear();

    const summary = screen.getByText('How we measure this page', {
      selector: 'summary',
    });
    const clear = screen.getByRole('button', {
      name: 'Clear what this page remembers',
    });

    fireEvent.focus(summary);
    fireEvent.click(summary);
    fireEvent.focus(clear);
    fireEvent.click(clear);

    expect(eventSink).not.toHaveBeenCalledWith('haoo_qualify_start');
    expect(eventSink).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(CONTEXT_KEY)).toBeNull();
  });

  it('renders the approved complete measurement disclosure', () => {
    render(<ProductPage product={HAOO_PRODUCT} />);

    const notice = screen.getByText(APPROVED_COLLECTION_NOTICE);
    const submit = screen.getByRole('button', { name: 'Send my details' });
    const describedBy = submit.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
    const details = screen
      .getByText('How we measure this page', { selector: 'summary' })
      .closest('details');

    expect(notice.textContent).toBe(APPROVED_COLLECTION_NOTICE);
    expect(describedBy).toContain(notice.closest('[id]')?.id);
    expect(details).not.toBeNull();
    expect(details?.hasAttribute('open')).toBe(false);
    expect(details?.firstElementChild?.tagName).toBe('SUMMARY');
    expect(details?.id).toBe('haoo-measurement-disclosure');

    const disclosure = within(details as HTMLElement);
    const signalList = disclosure
      .getByText('Signals this page can count')
      .nextElementSibling;
    const signalItems = signalList ? within(signalList as HTMLElement).getAllByRole('listitem') : [];

    expect(signalItems.map((item) => item.textContent)).toEqual(SIGNAL_DISCLOSURES);
    expect(signalItems).toHaveLength(HAOO_MEASUREMENT_EVENTS.length);
    expect(HAOO_PRODUCT.measurement.disclosure.signalLines).toEqual(
      Object.fromEntries(
        HAOO_MEASUREMENT_EVENTS.map((event, index) => [event, SIGNAL_DISCLOSURES[index]]),
      ),
    );

    const disclosureText = details?.textContent ?? '';
    const orderedCopy = [
      'We use a closed list of page signals for aggregate product learning and keep a separate, small context record in this browser. The page works if analytics or browser storage is unavailable.',
      'Signals this page can count',
      ...SIGNAL_DISCLOSURES,
      'What this browser remembers',
      'Whether this visit is first, returning, or frequent.',
      'Campaign information',
      'utm_source',
      'What we never collect for measurement',
      'Name, email address, phone number, or organization.',
      'No engagement summary is attached to this form submission yet.',
      'Clear what this page remembers',
    ];
    let previous = -1;
    for (const copy of orderedCopy) {
      const current = disclosureText.indexOf(copy);
      expect(current, copy).toBeGreaterThan(previous);
      previous = current;
    }

    expect(disclosure.getByRole('button', {
      name: 'Clear what this page remembers',
    }).getAttribute('type')).toBe('button');
    expect(disclosure.getByRole('status').textContent).toBe('');
    expect(details?.querySelector('[aria-expanded], [role="button"]')).toBeNull();
  });

  it('clears only bounded page context and keeps truthful status through failure', () => {
    const stored = {
      version: 1,
      visitBand: 'returning',
      lastSeenBand: 'this-week',
      flags: {
        brochureViewed: true,
        brochureDownloaded: false,
        qualifyStarted: false,
        assistedContact: false,
        selfOnboarding: false,
      },
      visitOrdinal: 2,
      lastSeenDay: new Date().toISOString().slice(0, 10),
    };
    const storage = {
      getItem: vi.fn(() => JSON.stringify(stored)),
      setItem: vi.fn(),
      removeItem: vi.fn(() => {
        throw new DOMException('Storage is blocked', 'SecurityError');
      }),
      clear: vi.fn(),
      key: vi.fn(),
      length: 1,
    } satisfies Storage;
    const initialUrl = window.location.href;

    render(
      <ProductPage
        product={HAOO_PRODUCT}
        measurementAdapters={{ storage }}
      />,
    );

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Jane Wanjiru' },
    });
    fireEvent.click(screen.getByRole('button', {
      name: 'Clear what this page remembers',
    }));

    expect(storage.removeItem).toHaveBeenCalledWith(CONTEXT_KEY);
    expect(storage.clear).not.toHaveBeenCalled();
    expect((screen.getByLabelText('Full name') as HTMLInputElement).value)
      .toBe('Jane Wanjiru');
    expect(window.location.href).toBe(initialUrl);
    expect(screen.getAllByRole('status').some((status) => status.textContent ===
      'This page stopped using remembered context for this visit. Your browser did not allow us to clear its saved copy.'))
      .toBe(true);
    expect(screen.getAllByRole('link', { name: 'Start with HAOO' })).toHaveLength(3);
  });

  it('opens the disclosure from the progressive footer fragment link', () => {
    const eventSink = vi.fn();

    render(
      <ProductPage
        product={HAOO_PRODUCT}
        measurementAdapters={{ eventSink }}
      />,
    );
    eventSink.mockClear();

    const disclosure = document.querySelector<HTMLDetailsElement>(
      '#haoo-measurement-disclosure',
    );
    const footer = screen.getByRole('contentinfo');
    const footerLinks = within(footer).getAllByRole('link');
    const measurementLink = within(footer).getByRole('link', {
      name: 'How we measure this page',
    });
    const backLink = within(footer).getByRole('link', {
      name: 'Back to ZERO-PAPER HUB',
    });
    let defaultPrevented = true;

    measurementLink.addEventListener('click', (event) => {
      defaultPrevented = event.defaultPrevented;
    });
    expect(disclosure?.open).toBe(false);
    fireEvent.click(measurementLink);

    expect(measurementLink.getAttribute('href')).toBe('#haoo-measurement-disclosure');
    expect(footerLinks.indexOf(measurementLink)).toBeLessThan(footerLinks.indexOf(backLink));
    expect(disclosure?.open).toBe(true);
    expect(defaultPrevented).toBe(false);
    expect(document.activeElement).not.toBe(disclosure);
    expect(eventSink).not.toHaveBeenCalled();
    expect(footer.querySelector('.flex.flex-wrap')).not.toBeNull();
    expect(measurementLink.className).toContain('min-h-11');
    expect(measurementLink.className).not.toMatch(/truncate|line-clamp|whitespace-nowrap/);
  });
});
