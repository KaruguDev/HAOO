import { StrictMode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProductPage from '../pages/ProductPage';
import { createMeasurement } from '../measurement';
import { HAOO_MEASUREMENT, HAOO_PRODUCT } from '../products/haoo';

const CONTEXT_KEY = 'zph.haoo.ctx.v1';

afterEach(() => {
  window.history.replaceState({}, '', '/products/haoo/');
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('Phase 3 HAOO page-view measurement tracer', () => {
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
    const eventSink = vi.fn(() => {
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
});
