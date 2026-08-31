import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMeasurement } from '../measurement';
import {
  HAOO_MEASUREMENT,
  HAOO_MEASUREMENT_EVENTS,
  type HaooMeasurementEvent,
} from '../products/haoo';

const CONTEXT_KEY = 'zph.haoo.ctx.v1';
const TODAY = new Date('2026-08-31T12:00:00.000Z');
const STORED_KEYS = [
  'version',
  'visitBand',
  'lastSeenBand',
  'flags',
  'visitOrdinal',
  'lastSeenDay',
] as const;
const FLAG_KEYS = [
  'brochureViewed',
  'brochureDownloaded',
  'qualifyStarted',
  'assistedContact',
  'selfOnboarding',
] as const;

class MemoryStorage implements Storage {
  readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

function storedContext(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    visitBand: 'first',
    lastSeenBand: 'today',
    flags: Object.fromEntries(FLAG_KEYS.map((key) => [key, false])),
    visitOrdinal: 1,
    lastSeenDay: '2026-08-30',
    ...overrides,
  };
}

function measurementWithStorage(storage: Storage, href = 'https://www.zero-paperhub.com/products/haoo/') {
  return createMeasurement(HAOO_MEASUREMENT, {
    storage,
    now: () => TODAY,
    location: { href },
    history: { state: null, replaceState: vi.fn() },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('closed event-name contract', () => {
  it('accepts exactly the ten configured ASCII literals as bare sink calls', () => {
    expect(HAOO_MEASUREMENT_EVENTS).toEqual([
      'haoo_page_view',
      'haoo_brochure_preview',
      'haoo_brochure_open',
      'haoo_brochure_download',
      'haoo_qualify_start',
      'haoo_qualify_submit',
      'haoo_assisted_whatsapp',
      'haoo_assisted_phone',
      'haoo_assisted_email',
      'haoo_self_onboarding',
    ]);

    const eventSink = vi.fn();
    const measurement = createMeasurement(HAOO_MEASUREMENT, {
      eventSink,
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: 'https://www.zero-paperhub.com/products/haoo/' },
    });

    for (const event of HAOO_MEASUREMENT_EVENTS) {
      expect(measurement.track(event), event).toBe(true);
    }

    expect(eventSink.mock.calls).toEqual(HAOO_MEASUREMENT_EVENTS.map((event) => [event]));
    expect(eventSink.mock.calls.every((call) => call.length === 1)).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['null', null],
    ['undefined', undefined],
    ['unknown', 'haoo_unknown'],
    ['wrong case', 'HAOO_PAGE_VIEW'],
    ['leading space', ' haoo_page_view'],
    ['near Unicode Kelvin sign', 'haoo_page_vie\u212A'],
    ['near Unicode full-width underscore', 'haoo\uff3fpage_view'],
    ['object property carrier', { name: 'haoo_page_view' }],
  ])('rejects %s without sink or context side effects', (_label, candidate) => {
    const storage = new MemoryStorage();
    const eventSink = vi.fn();
    const measurement = createMeasurement(HAOO_MEASUREMENT, {
      storage,
      eventSink,
      now: () => TODAY,
      location: { href: 'https://www.zero-paperhub.com/products/haoo/' },
    });
    const dynamicTrack = measurement.track as (event: unknown) => boolean;

    expect(dynamicTrack(candidate)).toBe(false);
    expect(eventSink).not.toHaveBeenCalled();
    expect(storage.values.size).toBe(0);
  });

  it('does not queue, retry, log, or retain emitted names when the sink throws', () => {
    vi.useFakeTimers();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const eventSink = vi.fn(() => { throw new Error('provider unavailable'); });
    const measurement = createMeasurement(HAOO_MEASUREMENT, {
      eventSink,
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: 'https://www.zero-paperhub.com/products/haoo/' },
    });

    expect(measurement.track('haoo_page_view')).toBe(true);
    expect(measurement.track('haoo_page_view')).toBe(true);
    expect(eventSink).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(Object.keys(measurement)).toEqual([
      'initialize',
      'track',
      'readContext',
      'readCampaign',
      'clearContext',
    ]);
    vi.useRealTimers();
  });
});

describe('exact stored schema', () => {
  const invalidRecords: readonly [string, string | null][] = [
    ['malformed JSON', '{'],
    ['array', '[]'],
    ['unknown version', JSON.stringify(storedContext({ version: 2 }))],
    ['missing key', JSON.stringify(Object.fromEntries(
      Object.entries(storedContext()).filter(([key]) => key !== 'lastSeenDay'),
    ))],
    ['extra key', JSON.stringify(storedContext({ visitorId: 'person-1' }))],
    ['invalid visit band', JSON.stringify(storedContext({ visitBand: 'repeat' }))],
    ['invalid last-seen band', JSON.stringify(storedContext({ lastSeenBand: 'yesterday' }))],
    ['ordinal zero', JSON.stringify(storedContext({ visitOrdinal: 0 }))],
    ['ordinal five', JSON.stringify(storedContext({ visitOrdinal: 5, visitBand: 'frequent' }))],
    ['fractional ordinal', JSON.stringify(storedContext({ visitOrdinal: 2.5, visitBand: 'returning' }))],
    ['string ordinal', JSON.stringify(storedContext({ visitOrdinal: '1' }))],
    ['boolean ordinal', JSON.stringify(storedContext({ visitOrdinal: true }))],
    ['invalid day syntax', JSON.stringify(storedContext({ lastSeenDay: '2026/08/30' }))],
    ['impossible day', JSON.stringify(storedContext({ lastSeenDay: '2026-02-30' }))],
    ['future day', JSON.stringify(storedContext({ lastSeenDay: '2026-09-01' }))],
    ['missing flag', JSON.stringify(storedContext({ flags: Object.fromEntries(FLAG_KEYS.slice(1).map((key) => [key, false])) }))],
    ['extra flag', JSON.stringify(storedContext({ flags: { ...storedContext().flags as object, message: false } }))],
    ['non-boolean flag', JSON.stringify(storedContext({ flags: { ...storedContext().flags as object, qualifyStarted: 1 } }))],
    ['identifier', JSON.stringify(storedContext({ userId: 'abc' }))],
    ['ordered events', JSON.stringify(storedContext({ events: ['haoo_page_view'] }))],
  ];

  it.each(invalidRecords)('rejects the whole %s record and rebuilds fresh', (_label, raw) => {
    const storage = new MemoryStorage();
    if (raw !== null) storage.setItem(CONTEXT_KEY, raw);

    const measurement = measurementWithStorage(storage);
    measurement.initialize();

    const context = measurement.readContext();
    expect(context.visitOrdinal).toBe(1);
    expect(context.visitBand).toBe('first');
    expect(context.lastSeenDay).toBe('2026-08-31');
    expect(Object.keys(context)).toEqual(STORED_KEYS);
    expect(Object.keys(context.flags)).toEqual(FLAG_KEYS);
    expect(JSON.parse(storage.getItem(CONTEXT_KEY) ?? 'null')).toEqual(context);
  });

  it('kills a partial-defaulting schema mutant with the invalid-record table', () => {
    const permissivePartialParser = (raw: string | null) => {
      try {
        const parsed = JSON.parse(raw ?? '{}') as Record<string, unknown>;
        return storedContext(parsed);
      } catch {
        return null;
      }
    };
    const wronglyAccepted = invalidRecords.filter(([, raw]) => permissivePartialParser(raw) !== null);

    expect(wronglyAccepted.length).toBeGreaterThan(10);
    expect(wronglyAccepted.map(([label]) => label)).toContain('missing key');
    expect(wronglyAccepted.map(([label]) => label)).toContain('extra key');
  });
});

describe('bounded visit and time transitions', () => {
  it.each([
    [null, 1, 'first'],
    [1, 2, 'returning'],
    [2, 3, 'returning'],
    [3, 4, 'frequent'],
    [4, 4, 'frequent'],
  ] as const)('moves stored ordinal %s to %s/%s', (previousOrdinal, expectedOrdinal, expectedBand) => {
    const storage = new MemoryStorage();
    if (previousOrdinal !== null) {
      storage.setItem(CONTEXT_KEY, JSON.stringify(storedContext({
        visitOrdinal: previousOrdinal,
        visitBand: previousOrdinal >= 4 ? 'frequent' : previousOrdinal >= 2 ? 'returning' : 'first',
      })));
    }

    const measurement = measurementWithStorage(storage);
    measurement.initialize();

    expect(measurement.readContext()).toMatchObject({
      visitOrdinal: expectedOrdinal,
      visitBand: expectedBand,
    });
  });

  it.each([
    ['2026-08-31', 'today'],
    ['2026-08-30', 'this-week'],
    ['2026-08-24', 'this-week'],
    ['2026-08-23', 'this-month'],
    ['2026-08-01', 'this-month'],
    ['2026-07-31', 'earlier'],
    ['2026-03-04', 'earlier'],
  ] as const)('derives %s as %s using UTC days', (lastSeenDay, expectedBand) => {
    const storage = new MemoryStorage();
    storage.setItem(CONTEXT_KEY, JSON.stringify(storedContext({ lastSeenDay })));

    const measurement = measurementWithStorage(storage);
    measurement.initialize();

    expect(measurement.readContext().lastSeenBand).toBe(expectedBand);
    expect(measurement.readContext().lastSeenDay).toBe('2026-08-31');
  });

  it.each([
    ['2026-03-04', 2, 'returning'],
    ['2026-03-03', 1, 'first'],
  ] as const)('applies the 180-day boundary to %s', (lastSeenDay, ordinal, band) => {
    const storage = new MemoryStorage();
    storage.setItem(CONTEXT_KEY, JSON.stringify(storedContext({ lastSeenDay })));

    const measurement = measurementWithStorage(storage);
    measurement.initialize();

    expect(measurement.readContext()).toMatchObject({ visitOrdinal: ordinal, visitBand: band });
  });
});

describe('disclosed idempotent interaction reducer', () => {
  const eventFlags: readonly [HaooMeasurementEvent, keyof ReturnType<typeof storedContext>['flags'] | null][] = [
    ['haoo_page_view', null],
    ['haoo_brochure_preview', 'brochureViewed'],
    ['haoo_brochure_open', 'brochureViewed'],
    ['haoo_brochure_download', 'brochureDownloaded'],
    ['haoo_qualify_start', 'qualifyStarted'],
    ['haoo_qualify_submit', null],
    ['haoo_assisted_whatsapp', 'assistedContact'],
    ['haoo_assisted_phone', 'assistedContact'],
    ['haoo_assisted_email', 'assistedContact'],
    ['haoo_self_onboarding', 'selfOnboarding'],
  ];

  it.each(eventFlags)('maps %s only to %s', (event, expectedFlag) => {
    const storage = new MemoryStorage();
    const measurement = measurementWithStorage(storage);

    expect(measurement.track(event)).toBe(true);
    expect(measurement.track(event)).toBe(true);

    const expected = Object.fromEntries(FLAG_KEYS.map((flag) => [flag, flag === expectedFlag]));
    expect(measurement.readContext().flags).toEqual(expected);
    expect(Object.keys(JSON.parse(storage.getItem(CONTEXT_KEY) ?? '{}'))).toEqual(STORED_KEYS);
  });

  it('reconciles interleaved tabs and never resurrects context removed elsewhere', () => {
    const storage = new MemoryStorage();
    const firstTab = measurementWithStorage(storage);
    const secondTab = measurementWithStorage(storage);

    firstTab.initialize();
    secondTab.initialize();
    expect(secondTab.readContext().visitOrdinal).toBe(2);

    firstTab.track('haoo_brochure_download');
    secondTab.track('haoo_qualify_start');

    expect(firstTab.readContext()).toMatchObject({
      visitOrdinal: 2,
      visitBand: 'returning',
      flags: {
        brochureDownloaded: true,
        qualifyStarted: true,
      },
    });

    storage.removeItem(CONTEXT_KEY);
    firstTab.track('haoo_assisted_email');
    secondTab.track('haoo_self_onboarding');

    expect(secondTab.readContext()).toMatchObject({
      visitOrdinal: 1,
      visitBand: 'first',
      flags: {
        brochureDownloaded: false,
        qualifyStarted: false,
        assistedContact: true,
        selfOnboarding: true,
      },
    });
  });
});

describe('campaign whole-value allowlist', () => {
  it.each([
    ['all allowed keys', '?utm_source=partner&utm_medium=email&utm_campaign=launch-2026', {
      utm_source: 'partner', utm_medium: 'email', utm_campaign: 'launch-2026',
    }],
    ['trim and case', '?utm_source=%20Partner-Network%20', { utm_source: 'partner-network' }],
    ['valid value capped after validation', `?utm_campaign=${'a'.repeat(40)}`, { utm_campaign: 'a'.repeat(32) }],
    ['duplicate allowed key', '?utm_source=one&utm_source=two', {}],
    ['excluded keys', '?utm_term=private&utm_content=creative', {}],
    ['space inside', '?utm_source=partner%20network', {}],
    ['email-like value', '?utm_source=person%40example.com', {}],
    ['underscore', '?utm_source=partner_network', {}],
    ['slash', '?utm_source=partner%2Fnetwork', {}],
    ['Unicode', '?utm_source=partn%C3%A9r', {}],
    ['invalid character after cap', `?utm_campaign=${'a'.repeat(32)}%40private`, {}],
    ['empty', '?utm_source=', {}],
  ] as const)('%s', (_label, query, expected) => {
    const history = { state: { retained: true }, replaceState: vi.fn() };
    const measurement = createMeasurement(HAOO_MEASUREMENT, {
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: `https://www.zero-paperhub.com/products/haoo/${query}#details` },
      history,
    });

    measurement.initialize();

    expect(measurement.readCampaign()).toEqual(expected);
    expect(history.replaceState).toHaveBeenCalledWith(
      history.state,
      '',
      '/products/haoo/#details',
    );
  });

  it('removes case variants and unknown campaign keys without trusting them', () => {
    const history = { state: null, replaceState: vi.fn() };
    const measurement = createMeasurement(HAOO_MEASUREMENT, {
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: 'https://www.zero-paperhub.com/products/haoo/?UTM_SOURCE=private&utm_person=email&keep=yes' },
      history,
    });

    measurement.initialize();

    expect(measurement.readCampaign()).toEqual({});
    expect(history.replaceState).toHaveBeenCalledWith(null, '', '/products/haoo/?keep=yes');
  });

  it('kills a forbidden-character stripping mutant', () => {
    const polluted = ['partner network', 'person@example.com', 'partner_network', 'partner/network'];
    const strippingMutant = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    expect(polluted.map(strippingMutant)).toEqual([
      'partnernetwork',
      'personexamplecom',
      'partnernetwork',
      'partnernetwork',
    ]);
  });
});

describe('browser failure containment and clear result', () => {
  it.each(['getItem', 'setItem', 'removeItem'] as const)('contains a storage %s exception', (method) => {
    const storage = new MemoryStorage();
    vi.spyOn(storage, method).mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
    const measurement = measurementWithStorage(storage);

    expect(() => measurement.initialize()).not.toThrow();
    expect(() => measurement.track('haoo_brochure_open')).not.toThrow();
    expect(measurement.readContext().flags.brochureViewed).toBe(true);
    expect(() => measurement.clearContext()).not.toThrow();
  });

  it('contains storage property access and history replacement exceptions', () => {
    const adapters = {
      now: () => TODAY,
      location: { href: 'https://www.zero-paperhub.com/products/haoo/?utm_source=partner' },
      history: {
        state: null,
        replaceState: vi.fn(() => { throw new DOMException('blocked', 'SecurityError'); }),
      },
      get storage(): Storage { throw new DOMException('blocked', 'SecurityError'); },
    };

    const measurement = createMeasurement(HAOO_MEASUREMENT, adapters);
    expect(() => measurement.initialize()).not.toThrow();
    expect(measurement.readCampaign()).toEqual({ utm_source: 'partner' });
    expect(measurement.readContext().visitBand).toBe('first');
  });

  it('clears persistent and page-memory context with a truthful result', () => {
    const storage = new MemoryStorage();
    const measurement = measurementWithStorage(storage);
    measurement.track('haoo_brochure_download');

    expect(measurement.clearContext()).toBe(true);
    expect(storage.getItem(CONTEXT_KEY)).toBeNull();
    expect(measurement.readContext().flags.brochureDownloaded).toBe(false);
  });

  it('clears page memory and reports blocked when persistent removal throws', () => {
    const storage = new MemoryStorage();
    const measurement = measurementWithStorage(storage);
    measurement.track('haoo_brochure_download');
    vi.spyOn(storage, 'removeItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });

    expect(measurement.clearContext()).toBe(false);
    expect(measurement.readContext().flags.brochureDownloaded).toBe(false);
  });
});
