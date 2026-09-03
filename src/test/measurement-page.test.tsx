import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { StrictMode, act } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProductPage from '../pages/ProductPage';
import { createMeasurement } from '../measurement';
import { POSTHOG_REFUSAL, type PostHogScope } from '../measurement/posthog';
import { TRANSPORT_REQUIRED_PROPERTIES } from '../measurement/posthog-lockdown';
import {
  HAOO_MEASUREMENT,
  HAOO_MEASUREMENT_EVENTS,
  HAOO_PRODUCT,
} from '../products/haoo';
import { qualifyCollectionNotePageContext } from '../products/copy';
import { APPROVED_ANALYTICS_HOSTS } from '../../config/approved-analytics-hosts';
import {
  installPostHogVendorClient,
  type InstalledVendorPostHogClient,
  type VendorBeforeSend,
  type VendorCaptureResult,
  type VendorPostHogScope,
} from './fixtures/posthog-capture-contract';

const CONTEXT_KEY = 'zph.haoo.ctx.v1';
/**
 * The owner-approved collection notice, byte-exact, hand-typed exactly once in the
 * repository. Its final clause is the Phase 4 checkpoint C-1 approval. Every other
 * surface — product data, the built-bundle assertion, the qualification-form contract —
 * derives the sentence from `qualifyCollectionNotePageContext`, and a contract below
 * asserts that builder's output against these bytes. Change this literal only with a
 * fresh owner approval.
 */
const APPROVED_COLLECTION_NOTICE =
  'This page remembers only coarse HAOO engagement signals — whether you visited before, roughly when you last visited, and whether you viewed or downloaded the brochure, started this form, contacted HAOO, or opened self-onboarding. These signals stay separate from your form answers, and when you send this form we attach a short readable summary of them and of any campaign values seen on arrival — never a score, an identifier, or your form answers.';

/**
 * UI-SPEC "Surface B — disclosure copy change", byte-exact. Contents item 4 is present
 * because blocking checkpoint C-2 resolved `include` (recorded in `04-02-SUMMARY.md`):
 * normalized campaign values do travel with the enquiry, so the list that describes what
 * is attached has to say so.
 */
const ATTACHED_SUMMARY_HEADING = 'What we attach to your form submission';
const ATTACHED_SUMMARY_INTRO =
  'When you send this form, we attach one short readable paragraph of the coarse signals described above so we can reply usefully.';
const ATTACHED_SUMMARY_CONTENTS = [
  'Whether this browser is on a first, returning, or frequent visit.',
  'Roughly when the last visit was, if this is not the first one.',
  'Which of the listed actions were recorded in this browser.',
  'Any campaign values described above, if they were present when you arrived.',
] as const;
const ATTACHED_SUMMARY_BOUNDARY =
  'It contains no score, no identifier, no capped visit step, no day-only date, and none of your form answers repeated back. It is written in plain words you could read yourself.';

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

function clickWithoutNavigation(link: HTMLElement) {
  link.addEventListener('click', (event) => event.preventDefault(), { once: true });
  fireEvent.click(link);
}

describe('Phase 3 HAOO page-view measurement tracer', () => {
  it('rebinds measurement and resets private product state when product changes', async () => {
    const firstSink = vi.fn();
    const secondSink = vi.fn();
    const intersectionCallbacks: IntersectionObserverCallback[] = [];
    let resolveFirstRequest: ((value: { ok: boolean }) => void) | undefined;
    const firstRequest = new Promise<{ ok: boolean }>((resolve) => {
      resolveFirstRequest = resolve;
    });
    const fetchSpy = vi.fn(() => firstRequest);
    vi.stubGlobal('fetch', fetchSpy);
    class TestIntersectionObserver {
      readonly root = null;
      readonly rootMargin = '0px';
      readonly thresholds = [0];

      constructor(callback: IntersectionObserverCallback) {
        intersectionCallbacks.push(callback);
      }

      disconnect = vi.fn();
      observe = vi.fn();
      takeRecords = () => [];
      unobserve = vi.fn();
    }
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
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

    const firstPreview = within(screen.getByRole('region', { name: 'Brochure' }))
      .getByRole('img', { name: HAOO_PRODUCT.brochure.previewImageAlt });
    fireEvent.load(firstPreview);
    act(() => {
      intersectionCallbacks.at(-1)?.([{
        target: firstPreview,
        isIntersecting: true,
        intersectionRatio: 1,
      } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    });
    fillValidQualification();
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'First Product Private Answer' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send my details' }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(firstSink).toHaveBeenCalledWith('haoo_brochure_preview');
    expect(firstSink).toHaveBeenCalledWith('haoo_qualify_start');
    const firstProductCalls = [...firstSink.mock.calls];

    page.rerender(
      <ProductPage
        product={secondProduct}
        measurementAdapters={{ eventSink: secondSink }}
      />,
    );

    expect(firstSink.mock.calls).toEqual(firstProductCalls);
    expect(secondSink.mock.calls).toEqual([['other_page_view']]);
    expect(window.localStorage.getItem('zph.other.ctx.v1')).not.toBeNull();
    expect((screen.getByLabelText('Full name') as HTMLInputElement).value).toBe('');

    fireEvent.focus(screen.getByLabelText('Full name'));

    const secondPreview = within(screen.getByRole('region', { name: 'Brochure' }))
      .getByRole('img', { name: HAOO_PRODUCT.brochure.previewImageAlt });
    fireEvent.load(secondPreview);
    act(() => {
      intersectionCallbacks.at(-1)?.([{
        target: secondPreview,
        isIntersecting: true,
        intersectionRatio: 1,
      } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(secondSink.mock.calls).toEqual([
      ['other_page_view'],
      ['other_qualify_start'],
      ['other_brochure_preview'],
    ]);
    expect(firstSink.mock.calls).toEqual(firstProductCalls);

    await act(async () => {
      resolveFirstRequest?.({ ok: true });
      await firstRequest;
    });
    expect(screen.queryByRole('heading', { name: 'Your details are on their way' }))
      .toBeNull();
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
  it('measures only a loaded, visible brochure preview and every deliberate action', () => {
    const eventSink = vi.fn();
    let intersectionCallback: IntersectionObserverCallback | undefined;
    const disconnect = vi.fn();
    const observe = vi.fn();

    class TestIntersectionObserver {
      readonly root = null;
      readonly rootMargin = '0px';
      readonly thresholds = [0];

      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback;
      }

      disconnect = disconnect;
      observe = observe;
      takeRecords = () => [];
      unobserve = vi.fn();
    }

    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);

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
    expect(observe).toHaveBeenCalledWith(preview);
    expect(observe).toHaveBeenCalledWith(object);

    // A hidden resource may load, and an HTTP/error object may still dispatch load.
    // Neither is evidence that the visitor saw a usable preview.
    fireEvent.load(object!);
    fireEvent.error(object!);
    fireEvent.load(preview);
    expect(eventSink).not.toHaveBeenCalled();

    act(() => {
      intersectionCallback?.([
        {
          target: preview,
          isIntersecting: true,
          intersectionRatio: 1,
        } as unknown as IntersectionObserverEntry,
      ], {} as IntersectionObserver);
    });

    fireEvent.load(preview);
    clickWithoutNavigation(open);
    clickWithoutNavigation(open);
    clickWithoutNavigation(download);
    clickWithoutNavigation(download);

    expect(eventSink.mock.calls).toEqual([
      ['haoo_brochure_preview'],
      ['haoo_brochure_open'],
      ['haoo_brochure_open'],
      ['haoo_brochure_download'],
      ['haoo_brochure_download'],
    ]);
    expect(disconnect).toHaveBeenCalled();
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
    expect(() => clickWithoutNavigation(open)).not.toThrow();
    expect(() => clickWithoutNavigation(download)).not.toThrow();
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
          clickWithoutNavigation(link);
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
        expect(() => clickWithoutNavigation(link)).not.toThrow();
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

  /**
   * Phase 4 checkpoint C-1. The approved bytes are hand-typed once, at the top of this
   * file; the shipped product data derives the same sentence from the copy builder.
   * This asserts the two are byte-identical directly, rather than comparing two
   * independently typed literals that could both be wrong in the same way.
   */
  it('derives the shipped collection notice from the one approved copy builder', () => {
    expect(qualifyCollectionNotePageContext('HAOO')).toBe(APPROVED_COLLECTION_NOTICE);
    const { collectionNote } = HAOO_PRODUCT.qualify;

    expect(collectionNote).toBeDefined();
    expect(collectionNote?.pageContext).toBe(qualifyCollectionNotePageContext('HAOO'));
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
      ATTACHED_SUMMARY_HEADING,
      ATTACHED_SUMMARY_INTRO,
      ...ATTACHED_SUMMARY_CONTENTS,
      ATTACHED_SUMMARY_BOUNDARY,
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

describe('Phase 4 disclosure of the attached engagement summary', () => {
  /**
   * The group is owner-approved copy carried as product data, so the byte-exact UI-SPEC
   * strings are pinned against the shipped configuration rather than against the DOM
   * alone. A reworded product string fails here first, before any rendering assertion.
   */
  it('carries the approved Surface B copy as product data', () => {
    const { disclosure } = HAOO_MEASUREMENT;

    expect(disclosure.summaryHeading).toBe(ATTACHED_SUMMARY_HEADING);
    expect(disclosure.summaryIntro).toBe(ATTACHED_SUMMARY_INTRO);
    expect(disclosure.summaryContents).toEqual([...ATTACHED_SUMMARY_CONTENTS]);
    expect(disclosure.summaryBoundary).toBe(ATTACHED_SUMMARY_BOUNDARY);
  });

  it('renders a labelled group listing what the attached summary contains', () => {
    render(<ProductPage product={HAOO_PRODUCT} />);

    const details = screen
      .getByText('How we measure this page', { selector: 'summary' })
      .closest('details') as HTMLElement;
    const group = within(details).getByRole('region', {
      name: ATTACHED_SUMMARY_HEADING,
    });
    const items = within(group).getAllByRole('listitem');

    expect(within(group).getByText(ATTACHED_SUMMARY_HEADING)).toBeTruthy();
    expect(within(group).getByText(ATTACHED_SUMMARY_INTRO)).toBeTruthy();
    expect(items.map((item) => item.textContent))
      .toEqual([...HAOO_MEASUREMENT.disclosure.summaryContents]);
    expect(items).toHaveLength(ATTACHED_SUMMARY_CONTENTS.length);
    expect(within(group).getByText(ATTACHED_SUMMARY_BOUNDARY)).toBeTruthy();

    const groupText = group.textContent ?? '';
    const listIndex = groupText.indexOf(ATTACHED_SUMMARY_CONTENTS[0]);

    expect(groupText.indexOf(ATTACHED_SUMMARY_HEADING)).toBeLessThan(
      groupText.indexOf(ATTACHED_SUMMARY_INTRO),
    );
    expect(groupText.indexOf(ATTACHED_SUMMARY_INTRO)).toBeLessThan(listIndex);
    expect(listIndex).toBeLessThan(groupText.indexOf(ATTACHED_SUMMARY_BOUNDARY));
  });

  it('positions the group after the never-collected group and before the clear control', () => {
    render(<ProductPage product={HAOO_PRODUCT} />);

    const details = screen
      .getByText('How we measure this page', { selector: 'summary' })
      .closest('details') as HTMLElement;
    const scope = within(details);
    const neverCollected = scope.getByRole('region', {
      name: HAOO_MEASUREMENT.disclosure.neverCollectedHeading,
    });
    const group = scope.getByRole('region', { name: ATTACHED_SUMMARY_HEADING });
    const clear = scope.getByRole('button', {
      name: HAOO_MEASUREMENT.disclosure.clearLabel,
    });

    expect(neverCollected.compareDocumentPosition(group))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(group.compareDocumentPosition(clear))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(group.contains(clear)).toBe(false);
  });

  /**
   * The locked prohibition: the group describes what is attached, it never reflects the
   * visitor's own measured values back at them. Seeded with a campaign that could not
   * occur by accident and with every interaction flag set, none of it may reach the
   * markup — not the values, not the raw flag keys that carry them.
   */
  it('reflects none of the visitor own campaign values or flags back into the markup', () => {
    window.history.replaceState(
      {},
      '',
      '/products/haoo/?utm_source=zebrasource&utm_medium=zebramedium&utm_campaign=zebracampaign',
    );

    const stored = {
      version: 1,
      visitBand: 'frequent',
      lastSeenBand: 'today',
      flags: {
        brochureViewed: true,
        brochureDownloaded: true,
        qualifyStarted: true,
        assistedContact: true,
        selfOnboarding: true,
      },
      visitOrdinal: 9,
      lastSeenDay: '2026-08-31',
    };
    const storage = {
      getItem: vi.fn(() => JSON.stringify(stored)),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 1,
    } satisfies Storage;

    const { container } = render(
      <ProductPage product={HAOO_PRODUCT} measurementAdapters={{ storage }} />,
    );
    const details = container.querySelector('#haoo-measurement-disclosure') as HTMLElement;
    const markup = details.innerHTML;

    for (const value of ['zebrasource', 'zebramedium', 'zebracampaign', 'utm_source=']) {
      expect(markup, value).not.toContain(value);
    }
    for (const flag of HAOO_MEASUREMENT.interactionFlags) {
      expect(markup, flag).not.toContain(flag);
    }
    expect(markup).not.toContain('visitOrdinal');
    expect(markup).not.toContain('lastSeenDay');
    expect(markup).not.toContain('2026-08-31');
    expect(markup).toContain(ATTACHED_SUMMARY_BOUNDARY);
  });

  it('renders identical group markup whether or not browser storage is available', () => {
    const readable = {
      getItem: vi.fn(() => JSON.stringify({
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
        lastSeenDay: '2026-08-30',
      })),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 1,
    } satisfies Storage;
    const blocked = {
      getItem: vi.fn(() => {
        throw new DOMException('Storage is blocked', 'SecurityError');
      }),
      setItem: vi.fn(() => {
        throw new DOMException('Storage is blocked', 'SecurityError');
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } satisfies Storage;

    function groupMarkup(storage: Storage) {
      const view = render(
        <ProductPage product={HAOO_PRODUCT} measurementAdapters={{ storage }} />,
      );
      const group = view.container
        .querySelector('#haoo-measurement-disclosure')
        ?.querySelector(`[aria-label="${ATTACHED_SUMMARY_HEADING}"]`)?.outerHTML;

      view.unmount();

      return group;
    }

    const withStorage = groupMarkup(readable);

    expect(withStorage).toBeTruthy();
    expect(groupMarkup(blocked)).toBe(withStorage);
  });

  /**
   * The component is the shell; the copy is the data. Asserting against the shipped
   * product strings rather than a hand-written blocklist means a string that moves into
   * the component fails here without anyone remembering to add it.
   */
  it('keeps every visitor-facing disclosure string out of the component source', () => {
    const source = readFileSync(
      resolve(import.meta.dirname, '../components/MeasurementDisclosure.tsx'),
      'utf8',
    );
    const configured = Object.values(HAOO_MEASUREMENT.disclosure).flatMap((value) => {
      if (typeof value === 'string') {
        return [value];
      }

      return Array.isArray(value) ? value : Object.values(value as object);
    }) as string[];

    expect(configured).toContain(ATTACHED_SUMMARY_HEADING);
    expect(configured).toContain(ATTACHED_SUMMARY_BOUNDARY);
    for (const copy of configured) {
      expect(source, copy).not.toContain(copy);
    }
    expect(source).toContain('disclosure.summaryHeading');
    expect(source).toContain('disclosure.summaryIntro');
    expect(source).toContain('disclosure.summaryContents');
    expect(source).toContain('disclosure.summaryBoundary');
  });
});

/**
 * D-04 gate 2 — the network-payload regression.
 *
 * Gate 1 (`fail-closed provider initialization` in `measurement.test.ts`) asserts the
 * merged CONFIGURATION at the initialization boundary. This describe asserts the PAYLOAD
 * that would leave the page — the object `before_send` returns — across every event path
 * of the whole journey.
 *
 * The two gates are deliberately independent rather than the same assertion written
 * twice. A call-argument assertion, or a configuration-only assertion, passes a version
 * bump that adds a property DOWNSTREAM of the call site; Phase 4 needed three
 * gap-closure rounds on exactly that drift class, which is why one gate is demonstrably
 * not enough (T-04.1-02).
 */
const PROJECT_TOKEN = 'phc_regressionFixtureToken0123456789';
const APPROVED_HOST = APPROVED_ANALYTICS_HOSTS[0].origin;

/**
 * The product exactly as shipped, with the provider selected.
 *
 * Only `provider` and `providerConfig` differ from `HAOO_PRODUCT`: every event name,
 * interaction map and disclosure line is the shipped one, so the journeys driven below
 * are the journey a visitor drives.
 */
const CONFIGURED_PRODUCT = {
  ...HAOO_PRODUCT,
  measurement: {
    ...HAOO_PRODUCT.measurement,
    provider: 'posthog' as const,
    providerConfig: { token: PROJECT_TOKEN, apiHost: APPROVED_HOST },
  },
};

describe('network payload regression', () => {
  /**
   * Property names that must never appear on the wire.
   *
   * Redundant with the exact three-key assertion by construction — and deliberately so:
   * if a future reducer ever grew the allowed set, this list names the specific channels
   * (geo-IP, session, device, current URL, referrer, campaign, feature flags) that the
   * privacy requirements forbid by name rather than by count.
   */
  const FORBIDDEN_PROPERTY_PATTERNS = [
    /geoip/i,
    /session/i,
    /device/i,
    /current_url/i,
    /referrer/i,
    /utm_|campaign/i,
    /feature_flag|\$feature\//i,
  ] as const;

  interface JourneyRun {
    readonly client: InstalledVendorPostHogClient;
    readonly searchAtProviderResolution: string | null;
    readonly storageKeysBefore: readonly string[];
  }

  function storageKeys(): readonly string[] {
    return Array.from(
      { length: window.localStorage.length },
      (_unused, index) => window.localStorage.key(index) ?? '',
    ).sort();
  }

  /**
   * Render the product page with the provider configured and drive every one of the ten
   * event paths a visitor can reach.
   *
   * The scope is a getter rather than a plain slot so the address bar can be sampled at
   * the exact moment the provider is resolved. That is what proves campaign cleanup
   * completes BEFORE a sink exists, rather than merely before the assertions run.
   *
   * The ten paths this drives, and the interaction that drives each — written as a map
   * for a reader auditing exhaustiveness, never as the expected set, which is derived
   * from the exported tuple so an eleventh allowlisted name fails rather than passes:
   *
   * - `haoo_page_view` — the render itself
   * - `haoo_brochure_preview` — the preview intersecting and then loading
   * - `haoo_brochure_open` — the open-in-new-tab link
   * - `haoo_brochure_download` — the download link
   * - `haoo_assisted_whatsapp` — the WhatsApp contact link
   * - `haoo_assisted_phone` — the phone contact link
   * - `haoo_assisted_email` — the email contact link
   * - `haoo_self_onboarding` — the self-onboarding link
   * - `haoo_qualify_start` — first focus of the qualification form
   * - `haoo_qualify_submit` — a validation-admitted send
   */
  async function runConfiguredJourney(initialUrl: string): Promise<JourneyRun> {
    window.history.replaceState({}, '', initialUrl);
    const storageKeysBefore = storageKeys();

    const holder: VendorPostHogScope = {};
    const client = installPostHogVendorClient(holder);
    let searchAtProviderResolution: string | null = null;
    const scope: PostHogScope = {
      get posthog() {
        searchAtProviderResolution = window.location.search;
        return holder.posthog;
      },
    };

    let intersectionCallback: IntersectionObserverCallback | undefined;
    class TestIntersectionObserver {
      readonly root = null;
      readonly rootMargin = '0px';
      readonly thresholds = [0];

      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback;
      }

      disconnect = vi.fn();
      observe = vi.fn();
      takeRecords = () => [];
      unobserve = vi.fn();
    }
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
    const fetchSpy = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchSpy);

    render(
      <ProductPage
        product={CONFIGURED_PRODUCT}
        measurementAdapters={{ providerAdapters: { scope } }}
      />,
    );

    const brochure = screen.getByRole('region', { name: 'Brochure' });
    const preview = within(brochure).getByRole('img', {
      name: HAOO_PRODUCT.brochure.previewImageAlt,
    });

    act(() => {
      intersectionCallback?.([
        {
          target: preview,
          isIntersecting: true,
          intersectionRatio: 1,
        } as unknown as IntersectionObserverEntry,
      ], {} as IntersectionObserver);
    });
    fireEvent.load(preview);
    clickWithoutNavigation(within(brochure).getByRole('link', {
      name: /Open brochure.*new tab/i,
    }));
    clickWithoutNavigation(within(brochure).getByRole('link', {
      name: 'Download brochure',
    }));

    for (const name of [
      'Chat with HAOO on WhatsApp',
      `Call ${HAOO_PRODUCT.contacts.phoneDisplay}`,
      `Email ${HAOO_PRODUCT.contacts.email}`,
      'Start with HAOO',
    ]) {
      clickWithoutNavigation(screen.getAllByRole('link', { name })[0]);
    }

    fireEvent.focus(screen.getByLabelText('Full name'));
    fillValidQualification();
    fireEvent.focus(screen.getByLabelText('Email address'));
    fireEvent.click(screen.getByRole('button', { name: 'Send my details' }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    return { client, searchAtProviderResolution, storageKeysBefore };
  }

  /** Order-insensitive shape of what left the page: the name and its property key set. */
  function payloadShape(payloads: readonly VendorCaptureResult[]): readonly string[] {
    return payloads
      .map((payload) => `${payload.event}:${Object.keys(payload.properties).join(',')}`)
      .sort();
  }

  it('puts exactly the ten allowlisted bare names on the wire and nothing else', async () => {
    const { client } = await runConfiguredJourney('/products/haoo/');
    const payloads = client.deliveredPayloads();

    // Derived from the exported tuple, never restated: an eleventh allowlisted name with
    // no journey path is a failure here rather than an untested event.
    expect(new Set(payloads.map((payload) => payload.event)))
      .toEqual(new Set(HAOO_MEASUREMENT_EVENTS));
    for (const payload of payloads) {
      expect(HAOO_MEASUREMENT_EVENTS).toContain(payload.event);
    }
  });

  it('drops any name the SDK itself would emit, at the wire rather than at the call site', async () => {
    const { client } = await runConfiguredJourney('/products/haoo/');
    const beforeSend = client.initializedConfig()?.before_send as VendorBeforeSend;

    for (const emitted of ['$pageview', '$pageleave', '$autocapture', '$rageclick', '$web_vitals']) {
      expect(beforeSend({
        uuid: 'sdk-emitted-1',
        event: emitted,
        properties: { token: PROJECT_TOKEN, distinct_id: 'd', $process_person_profile: false },
      })).toBeNull();
    }
  });

  it('carries exactly the three transport properties on every payload', async () => {
    const { client } = await runConfiguredJourney('/products/haoo/');
    const payloads = client.deliveredPayloads();

    expect(payloads.length).toBeGreaterThanOrEqual(HAOO_MEASUREMENT_EVENTS.length);
    for (const payload of payloads) {
      expect(Object.keys(payload.properties), payload.event)
        .toEqual([...TRANSPORT_REQUIRED_PROPERTIES]);
    }
  });

  it('carries no geo-IP, session, device, URL, referrer, campaign or feature-flag property', async () => {
    const { client } = await runConfiguredJourney('/products/haoo/');
    const keys = client.deliveredPayloads().flatMap((payload) => Object.keys(payload.properties));

    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      for (const forbidden of FORBIDDEN_PROPERTY_PATTERNS) {
        expect(key, `${key} matched ${forbidden}`).not.toMatch(forbidden);
      }
    }
  });

  it('emits an identical payload shape when campaign parameters are on the address bar', async () => {
    const plain = await runConfiguredJourney('/products/haoo/');
    const plainShape = payloadShape(plain.client.deliveredPayloads());

    cleanup();
    window.localStorage.clear();
    vi.unstubAllGlobals();

    const campaign = await runConfiguredJourney(
      '/products/haoo/?utm_source=partner&utm_medium=email&utm_campaign=launch&ref=news',
    );

    // MEAS-06: the provider's own campaign capture is off, so the repository-side
    // normalization in the facade stays the only path by which a campaign value is ever
    // observed — and none of it reaches the wire.
    expect(payloadShape(campaign.client.deliveredPayloads())).toEqual(plainShape);
    expect(window.location.search).toBe('?ref=news');
    // Sampled inside the provider slot getter: the address bar was already clean at the
    // instant the provider was resolved, so no payload can precede the cleanup.
    expect(campaign.searchAtProviderResolution).toBe('?ref=news');
  });

  it('writes no browser storage key beyond the Phase 3 engagement-context record', async () => {
    const { client, storageKeysBefore } = await runConfiguredJourney('/products/haoo/');

    expect(storageKeysBefore).toEqual([]);
    // MEAS-03: `persistence: 'memory'` and `disable_persistence: true` mean the provider
    // writes nothing to the browser at all, so the only new key is this project's own.
    expect(storageKeys()).toEqual([CONTEXT_KEY]);
    expect(window.sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
    expect(client.deliveredPayloads().length).toBeGreaterThan(0);
  });
});

/**
 * The Phase 4 gap-1 regression, re-armed as a component-level guard.
 *
 * `04-VERIFICATION.md` recorded it as a live blocker on outcome 1: *with a provider
 * configured*, a blocked provider slot unmounted the product page. It was found on the
 * enablement path — the path this phase turns on for the first time — so it is a live
 * regression for this phase rather than history, and the assertion is the visitor's, not
 * the adapter's: the page stays mounted and every action stays operable.
 */
describe('provider failure isolation', () => {
  const hostileSlots: readonly [string, () => PostHogScope][] = [
    ['holds a non-callable value', () => ({ posthog: { init: 'blocked' } })],
    ['holds a frozen object', () => ({ posthog: Object.freeze({ marker: 'frozen' }) })],
    [
      'is read-only',
      () => {
        const scope: PostHogScope = {};
        Object.defineProperty(scope, 'posthog', {
          value: { init: 'blocked' },
          writable: false,
          configurable: false,
          enumerable: true,
        });

        return scope;
      },
    ],
    [
      'is backed by a throwing getter',
      () => {
        const scope: PostHogScope = {};
        Object.defineProperty(scope, 'posthog', {
          get() {
            throw new Error('blocked slot');
          },
          configurable: true,
        });

        return scope;
      },
    ],
  ];

  it.each(hostileSlots)(
    'renders, stays mounted, and keeps every visitor action operable when the provider slot %s',
    async (_label, buildScope) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const fetchSpy = vi.fn(() => Promise.resolve({ ok: true }));
      vi.stubGlobal('fetch', fetchSpy);

      expect(() => render(
        <ProductPage
          product={CONFIGURED_PRODUCT}
          measurementAdapters={{ providerAdapters: { scope: buildScope() } }}
        />,
      )).not.toThrow();

      const brochure = screen.getByRole('region', { name: 'Brochure' });
      const open = within(brochure).getByRole('link', { name: /Open brochure.*new tab/i });
      const download = within(brochure).getByRole('link', { name: 'Download brochure' });

      expect(open.getAttribute('href')).toBe(HAOO_PRODUCT.brochure.pdfHref);
      expect(download.getAttribute('download')).toBe(HAOO_PRODUCT.brochure.downloadName);
      expect(() => clickWithoutNavigation(open)).not.toThrow();
      expect(() => clickWithoutNavigation(download)).not.toThrow();

      for (const [name, href] of [
        ['Chat with HAOO on WhatsApp', HAOO_PRODUCT.contacts.whatsappHref],
        [`Call ${HAOO_PRODUCT.contacts.phoneDisplay}`, HAOO_PRODUCT.contacts.phoneHref],
        [`Email ${HAOO_PRODUCT.contacts.email}`, HAOO_PRODUCT.contacts.emailHref],
        ['Start with HAOO', HAOO_PRODUCT.contacts.selfOnboardingHref],
      ] as const) {
        const links = screen.getAllByRole('link', { name });
        expect(links).toHaveLength(3);
        for (const link of links) {
          const nativeMarkup = link.outerHTML;
          expect(link.getAttribute('href')).toBe(href);
          expect(() => clickWithoutNavigation(link)).not.toThrow();
          expect(link.outerHTML).toBe(nativeMarkup);
        }
      }

      expect(() => fireEvent.focus(screen.getByLabelText('Full name'))).not.toThrow();
      fillValidQualification();
      fireEvent.click(screen.getByRole('button', { name: 'Send my details' }));
      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

      // Still mounted after every action, with the whole journey still addressable and
      // the submission reaching its own outcome rather than the provider's.
      expect(await screen.findByText('Your details were sent.')).toBeTruthy();
      expect(screen.getByRole('region', { name: 'Brochure' })).toBeTruthy();
      expect(screen.getAllByRole('link', { name: 'Start with HAOO' })).toHaveLength(3);
      expect(window.localStorage.getItem(CONTEXT_KEY)).not.toBeNull();

      // The refusal is visible exactly once, and it names the gate that refused: a
      // silently refusing provider would be indistinguishable from a dead funnel.
      expect(warn.mock.calls).toEqual([[POSTHOG_REFUSAL.foreignClient]]);
    },
  );
});
