import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMeasurement } from '../measurement';
import { createPostHogEventSink, type PostHogScope } from '../measurement/posthog';
import {
  TRANSPORT_REQUIRED_PROPERTIES,
  lockdownHolds,
  stripToBareName,
} from '../measurement/posthog-lockdown';
import {
  HAOO_MEASUREMENT,
  HAOO_MEASUREMENT_EVENTS,
  buildTimeApprovedAnalyticsHosts,
  resolveMeasurementProvider,
  resolvePostHogApiHost,
  resolvePostHogToken,
  type HaooMeasurementEvent,
} from '../products/haoo';
import type { MeasurementProvider, ProductMeasurement } from '../products/types';
import { APPROVED_ANALYTICS_HOSTS } from '../../config/approved-analytics-hosts';
import {
  installPostHogVendorClient,
  type VendorPostHogScope,
} from './fixtures/posthog-capture-contract';

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

/**
 * Phase 4.1 provider seam — PostHog.
 *
 * The ingestion origin below is deliberate and confined to `src/test/`: the boundary
 * suite's source scan asserts that no file under `src/` outside `src/test/` contains the
 * provider's ingestion host, so the origin can only ever enter a bundle through the
 * provider-gated build-time constant these rows exercise.
 *
 * The *accepted* host is not re-typed here — it is derived from the canonical
 * repository-owned contract, so deleting or changing the approved entry makes the
 * acceptance rows fail instead of letting the table drift away from the trusted list.
 *
 * These six describes run at TRACER DEPTH for exactly one wave. Every case removed with
 * the superseded adapter is enumerated, with its restoring `04.1-05` task, in
 * `.planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/04.1-04-DELETED-PROVIDER-CASES.md`.
 * That file is the authority on the reduction, not this comment.
 */
const APPROVED_HOST = APPROVED_ANALYTICS_HOSTS[0].origin;
const PROJECT_TOKEN = 'phc_tracerFixtureToken0123456789';
const PRODUCT_HREF = 'https://www.zero-paperhub.com/products/haoo/';

const CONFIGURED_MEASUREMENT: ProductMeasurement<HaooMeasurementEvent> = {
  ...HAOO_MEASUREMENT,
  provider: 'posthog',
  providerConfig: { token: PROJECT_TOKEN, apiHost: APPROVED_HOST },
};

function silentConsole() {
  return {
    log: vi.spyOn(console, 'log').mockImplementation(() => undefined),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => undefined),
    error: vi.spyOn(console, 'error').mockImplementation(() => undefined),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => undefined),
  };
}

function expectSilent(spies: ReturnType<typeof silentConsole>) {
  for (const [name, spy] of Object.entries(spies)) {
    expect(spy, `console.${name}`).not.toHaveBeenCalled();
  }
}

describe('fail-closed provider resolution', () => {
  const providerRows: readonly [string, string | undefined, MeasurementProvider][] = [
    ['undefined', undefined, 'none'],
    ['the empty string', '', 'none'],
    ['whitespace only', '   \t ', 'none'],
    ['the no-op literal', 'none', 'none'],
    ['the provider name exactly', 'posthog', 'posthog'],
    ['the provider name padded and mixed case', '  PoStHoG\n', 'posthog'],
    ['an unknown word', 'matomo', 'none'],
    ['the superseded provider name', 'plausible', 'none'],
    ['an absolute URL', APPROVED_HOST, 'none'],
    ['a near miss with a suffix', 'posthog-eu', 'none'],
    ['a near miss with an inner space', 'post hog', 'none'],
  ];

  it.each(providerRows)(
    'resolves %s to the named provider',
    (_label, configured, expected) => {
      expect(resolveMeasurementProvider(configured)).toBe(expected);
    },
  );

  /**
   * Tracer depth: one accepted host and the rejections that prove the comparison is an
   * exact parsed-origin equality rather than a substring test. `04.1-05` Task 1 restores
   * the full hostile table the superseded script-source resolver carried.
   */
  const apiHostRows: readonly [string, string | undefined, string][] = [
    ['the approved origin exactly', APPROVED_HOST, APPROVED_HOST],
    ['the approved origin surrounded by whitespace', `  ${APPROVED_HOST}  `, APPROVED_HOST],
    ['a structurally valid foreign origin', 'https://ingest.attacker.example', ''],
    [
      'a lookalike host carrying the approved host as a leading label',
      `${APPROVED_HOST}.attacker.example`,
      '',
    ],
    ['the approved host on a path', `${APPROVED_HOST}/capture/`, ''],
    ['undefined', undefined, ''],
    ['the empty string', '', ''],
  ];

  it.each(apiHostRows)(
    'resolves %s to the named ingestion host',
    (_label, configured, expected) => {
      expect(resolvePostHogApiHost(configured, APPROVED_ANALYTICS_HOSTS)).toBe(expected);
    },
  );

  const tokenRows: readonly [string, string | undefined, string][] = [
    ['a well-formed project key', PROJECT_TOKEN, PROJECT_TOKEN],
    ['the same key surrounded by whitespace', `  ${PROJECT_TOKEN}  `, PROJECT_TOKEN],
    ['a key with the wrong prefix', 'phx_tracerFixtureToken', ''],
    ['the bare prefix with nothing after it', 'phc_', ''],
    ['a key carrying a forbidden character', 'phc_tracer.Fixture', ''],
    ['undefined', undefined, ''],
    ['the empty string', '', ''],
  ];

  it.each(tokenRows)('resolves %s to the named token', (_label, configured, expected) => {
    expect(resolvePostHogToken(configured)).toBe(expected);
  });

  it('fails closed when no approved-host contract is supplied', () => {
    // The test runner uses `vitest.config.ts`, which has no `define`, so the build-time
    // constant is absent here. The one-argument call is therefore the exact shape a
    // bundle would take if the constant were ever missing — and it must resolve to no
    // sink rather than to the approved origin.
    expect(resolvePostHogApiHost(APPROVED_HOST)).toBe('');
    expect(resolvePostHogApiHost(APPROVED_HOST, [])).toBe('');
    expect(buildTimeApprovedAnalyticsHosts()).toEqual([]);
  });
});

describe('name-only provider sink', () => {
  const unconfigured: readonly [string, ProductMeasurement<HaooMeasurementEvent>][] = [
    ['the resolved provider is the no-op', { ...CONFIGURED_MEASUREMENT, provider: 'none' }],
    ['the resolved token is empty', {
      ...CONFIGURED_MEASUREMENT,
      providerConfig: { token: '', apiHost: APPROVED_HOST },
    }],
    ['the resolved ingestion host is empty', {
      ...CONFIGURED_MEASUREMENT,
      providerConfig: { token: PROJECT_TOKEN, apiHost: '' },
    }],
  ];

  it.each(unconfigured)('returns no sink when %s', (_label, config) => {
    const scope: VendorPostHogScope = {};
    const client = installPostHogVendorClient(scope);

    expect(createPostHogEventSink(config, { scope: scope as PostHogScope }))
      .toBeUndefined();
    expect(client.initializedToken()).toBeNull();
    expect(client.capturedEvents()).toEqual([]);
  });
});

describe('fail-closed provider initialization', () => {
  it('returns no sink when the ambient slot is not callable and leaves it untouched', () => {
    const original = { init: 'foreign' };
    const scope: PostHogScope = { posthog: original };

    expect(createPostHogEventSink(CONFIGURED_MEASUREMENT, { scope })).toBeUndefined();
    // Somebody else's global is left byte-identical: not replaced, not wrapped, and not
    // decorated with anything this adapter would have needed.
    expect(scope.posthog).toBe(original);
    expect(Object.keys(original)).toEqual(['init']);
  });

  it('returns no sink when the ambient initializer throws', () => {
    const scope: PostHogScope = {
      posthog: {
        init() {
          throw new Error('initializer unavailable');
        },
      },
    };
    let sink: ((event: HaooMeasurementEvent) => void) | undefined;

    expect(() => {
      sink = createPostHogEventSink(CONFIGURED_MEASUREMENT, { scope });
    }).not.toThrow();
    expect(sink).toBeUndefined();
  });

  it('names the gate that refused through the injected refusal channel', () => {
    const reasons: string[] = [];
    const original = { init: 'foreign' };

    createPostHogEventSink(CONFIGURED_MEASUREMENT, {
      scope: { posthog: original },
      signalRefusal: (reason) => reasons.push(reason),
    });

    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toMatch(/\S/);
  });

  it('stays silent for the no-op provider, before any gate has an opinion', () => {
    const reasons: string[] = [];

    createPostHogEventSink(
      { ...CONFIGURED_MEASUREMENT, provider: 'none' },
      { scope: {}, signalRefusal: (reason) => reasons.push(reason) },
    );

    // An unconfigured build is not a refusal. Signalling here would make the channel
    // meaningless on the builds that matter.
    expect(reasons).toEqual([]);
  });
});

/**
 * MEAS-07 on the refused-initialization path.
 *
 * Refusing to collect is a privacy decision, never a degradation of the journey: with no
 * sink and no provider call, the qualification journey and the bounded local context must
 * be indistinguishable from an unconfigured build.
 */
describe('fail-closed provider initialization in the full journey', () => {
  it('keeps the whole journey working when the ambient slot is unusable', () => {
    const spies = silentConsole();
    const original = { init: 'foreign' };
    const scope: PostHogScope = { posthog: original };
    const measurement = createMeasurement(CONFIGURED_MEASUREMENT, {
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: PRODUCT_HREF },
      history: { state: null, replaceState: vi.fn() },
      providerAdapters: { scope },
    });

    measurement.initialize();

    expect(measurement.track('haoo_brochure_download')).toBe(true);
    expect(measurement.readContext().flags.brochureDownloaded).toBe(true);
    // Refusal is not a one-shot degradation: the second and third actions of the journey
    // still record their bounded local flags.
    expect(measurement.track('haoo_qualify_start')).toBe(true);
    expect(measurement.readContext().flags.qualifyStarted).toBe(true);
    expect(measurement.track('haoo_self_onboarding')).toBe(true);
    expect(measurement.readContext().flags.selfOnboarding).toBe(true);

    expect(scope.posthog).toBe(original);
    expectSilent(spies);
  });
});

describe('provider failure isolation', () => {
  it('leaves the journey unchanged when the provider call throws', () => {
    const spies = silentConsole();
    const scope: VendorPostHogScope = {};
    installPostHogVendorClient(scope);
    const measurement = createMeasurement(CONFIGURED_MEASUREMENT, {
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: PRODUCT_HREF },
      history: { state: null, replaceState: vi.fn() },
      providerAdapters: { scope: scope as PostHogScope },
    });

    measurement.initialize();
    measurement.track('haoo_page_view');

    // Replacing the resolved instance's capture with a thrower is the runtime analogue of
    // a provider that stops working mid-visit.
    const eventSink = () => {
      throw new Error('provider unavailable');
    };
    const failing = createMeasurement(CONFIGURED_MEASUREMENT, {
      eventSink,
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: PRODUCT_HREF },
      history: { state: null, replaceState: vi.fn() },
      providerAdapters: { scope: scope as PostHogScope },
    });

    failing.initialize();
    expect(failing.track('haoo_brochure_download')).toBe(true);
    expect(failing.readContext().flags.brochureDownloaded).toBe(true);
    expectSilent(spies);
  });
});

describe('facade contract under the widened provider seam', () => {
  it('still exposes exactly the five existing members in the existing order', () => {
    const measurement = createMeasurement(CONFIGURED_MEASUREMENT, {
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: PRODUCT_HREF },
      providerAdapters: { scope: {} },
    });

    expect(Object.keys(measurement)).toEqual([
      'initialize',
      'track',
      'readContext',
      'readCampaign',
      'clearContext',
    ]);
  });

  it('touches no provider global for the no-op provider', () => {
    const scope: VendorPostHogScope = {};
    const client = installPostHogVendorClient(scope);

    expect(HAOO_MEASUREMENT.provider).toBe('none');

    const measurement = createMeasurement(HAOO_MEASUREMENT, {
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: PRODUCT_HREF },
      providerAdapters: { scope: scope as PostHogScope },
    });

    measurement.initialize();
    for (const event of HAOO_MEASUREMENT_EVENTS) {
      expect(measurement.track(event), event).toBe(true);
    }

    expect(client.initializedToken()).toBeNull();
    expect(client.capturedEvents()).toEqual([]);
  });

  it('keeps an injected sink authoritative over the configured provider', () => {
    const scope: VendorPostHogScope = {};
    const client = installPostHogVendorClient(scope);
    const eventSink = vi.fn();
    const measurement = createMeasurement(CONFIGURED_MEASUREMENT, {
      eventSink,
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: PRODUCT_HREF },
      providerAdapters: { scope: scope as PostHogScope },
    });

    measurement.initialize();
    expect(measurement.track('haoo_page_view')).toBe(true);

    expect(eventSink.mock.calls).toEqual([['haoo_page_view']]);
    expect(client.initializedToken()).toBeNull();
    expect(client.capturedEvents()).toEqual([]);
  });

  it('normalizes and clears campaign parameters before the provider is initialized', () => {
    const scope: VendorPostHogScope = {};
    const client = installPostHogVendorClient(scope);
    const measurement = createMeasurement(CONFIGURED_MEASUREMENT, {
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: `${PRODUCT_HREF}?utm_source=partner` },
      history: { state: null, replaceState: vi.fn() },
      providerAdapters: { scope: scope as PostHogScope },
    });

    measurement.initialize();
    expect(measurement.track('haoo_qualify_submit')).toBe(true);

    // Campaign normalization and address-bar cleanup complete before the provider is
    // initialized, so no capture can precede it, and `save_campaign_params: false` keeps
    // `readCampaign` the only path by which a campaign value is ever observed.
    expect(measurement.readCampaign()).toEqual({ utm_source: 'partner' });
    expect(client.capturedEvents()).toEqual(['haoo_qualify_submit']);
  });
});

/**
 * The `04.1-04` tracer: one HAOO event from a visitor action to the wire.
 *
 * Every layer this phase touches is on this path — the product resolvers, the provider
 * union, the facade seam, the adapter's refusal ordering, the lockdown object, and the
 * property chokepoint — so a single green describe here is the phase's architectural
 * risk retired in one place.
 *
 * The vendor client is the independently-transcribed fixture from `04.1-01`, which
 * starts from PostHog's *documented defaults* rather than from this project's desired
 * values. That is what makes the merged-configuration readback a real assertion: every
 * locked value has to be overcome by a genuine `init` argument before `lockdownHolds`
 * can return true.
 */
describe('PostHog tracer: one event end-to-end', () => {
  function tracerScope(overrides: Record<string, unknown> = {}) {
    const scope: VendorPostHogScope = {};
    const client = installPostHogVendorClient(scope, overrides);

    return { scope, client };
  }

  function tracerMeasurement(scope: VendorPostHogScope, storage: Storage) {
    return createMeasurement(CONFIGURED_MEASUREMENT, {
      storage,
      now: () => TODAY,
      location: { href: PRODUCT_HREF },
      history: { state: null, replaceState: vi.fn() },
      providerAdapters: { scope: scope as PostHogScope },
    });
  }

  it('initializes exactly once with the locked configuration and returns a sink', () => {
    const { scope, client } = tracerScope();

    const sink = createPostHogEventSink(CONFIGURED_MEASUREMENT, {
      scope: scope as PostHogScope,
    });

    expect(sink).toBeTypeOf('function');
    expect(sink).toHaveLength(1);
    expect(client.initializedToken()).toBe(PROJECT_TOKEN);

    const resolved = client.initializedConfig();
    expect(resolved).not.toBeNull();
    expect(lockdownHolds(resolved, { apiHost: APPROVED_HOST, token: PROJECT_TOKEN }))
      .toBe(true);

    // Spot-check the four options whose defaults are `undefined` — meaning "ask the
    // remote configuration" — plus the switch that makes them unbypassable.
    expect(resolved?.autocapture).toBe(false);
    expect(resolved?.capture_pageview).toBe(false);
    expect(resolved?.capture_pageleave).toBe(false);
    expect(resolved?.capture_heatmaps).toBe(false);
    expect(resolved?.capture_exceptions).toBe(false);
    expect(resolved?.capture_performance).toBe(false);
    expect(resolved?.capture_dead_clicks).toBe(false);
    expect(resolved?.advanced_disable_flags).toBe(true);
    expect(resolved?.person_profiles).toBe('never');
    expect(resolved?.persistence).toBe('memory');
    expect(resolved?.disable_persistence).toBe(true);
    expect(resolved?.save_campaign_params).toBe(false);
    expect(resolved?.save_referrer).toBe(false);
    expect(typeof resolved?.before_send).toBe('function');
  });

  it('carries one HAOO event through the facade as a bare name with three transport keys', () => {
    const { scope, client } = tracerScope();
    const storage = new MemoryStorage();
    const measurement = tracerMeasurement(scope, storage);

    measurement.initialize();
    expect(measurement.track('haoo_page_view')).toBe(true);

    expect(client.capturedEvents()).toEqual(['haoo_page_view']);

    const delivered = client.deliveredPayloads();
    expect(delivered).toHaveLength(1);
    expect(delivered[0].event).toBe('haoo_page_view');
    expect(Object.keys(delivered[0].properties)).toEqual([
      ...TRANSPORT_REQUIRED_PROPERTIES,
    ]);
    expect(delivered[0].properties.token).toBe(PROJECT_TOKEN);
  });

  it('returns the same transport envelope it received, with a freshly built property set', () => {
    const received = {
      uuid: 'tracer-envelope-1',
      event: 'haoo_qualify_submit',
      properties: {
        token: PROJECT_TOKEN,
        distinct_id: 'tracer-distinct-1',
        $process_person_profile: false,
        $current_url: 'https://www.zero-paperhub.com/products/haoo/',
        $referrer: 'https://search.example/',
        $lib: 'web',
      },
    };

    const emitted = stripToBareName(received, HAOO_MEASUREMENT_EVENTS);

    expect(emitted).not.toBeNull();
    expect(emitted?.uuid).toBe(received.uuid);
    expect(emitted?.event).toBe(received.event);
    expect(Object.keys(emitted?.properties ?? {})).toEqual([
      ...TRANSPORT_REQUIRED_PROPERTIES,
    ]);
    // A fresh literal, not the object it was handed: mutating the emitted set must not
    // reach back into the payload the SDK still holds.
    expect(emitted?.properties).not.toBe(received.properties);
  });

  const droppedRows: readonly [string, unknown][] = [
    ['a null input', null],
    [
      'an event name outside the ten',
      { uuid: 'x', event: '$pageview', properties: { token: PROJECT_TOKEN } },
    ],
    [
      'a name that differs only by case',
      { uuid: 'x', event: 'HAOO_PAGE_VIEW', properties: { token: PROJECT_TOKEN } },
    ],
    [
      'an allowlisted name with no properties at all',
      { uuid: 'x', event: 'haoo_page_view', properties: {} },
    ],
  ];

  it.each(droppedRows)('emits nothing for %s', (_label, received) => {
    expect(
      stripToBareName(
        received as Parameters<typeof stripToBareName>[0],
        HAOO_MEASUREMENT_EVENTS,
      ),
    ).toBeNull();
  });

  it('withholds the sink when any one locked key resolves wrong', () => {
    const { scope, client } = tracerScope({ advanced_disable_flags: false });
    const storage = new MemoryStorage();

    expect(
      createPostHogEventSink(CONFIGURED_MEASUREMENT, { scope: scope as PostHogScope }),
    ).toBeUndefined();

    const measurement = tracerMeasurement(scope, storage);
    measurement.initialize();

    // Refusing to collect is never a degradation of the journey.
    expect(measurement.track('haoo_page_view')).toBe(true);
    expect(client.capturedEvents()).toEqual([]);
    expect(client.deliveredPayloads()).toEqual([]);
  });

  const inertSelectorRows: readonly [string, string | undefined][] = [
    ['unset', undefined],
    ['blank', ''],
    ['whitespace only', '   \t '],
    ['the no-op literal', 'none'],
    ['a near miss', 'posthog-eu'],
    ['an absolute URL', 'https://example.invalid/posthog'],
  ];

  it.each(inertSelectorRows)(
    'creates no sink and never initializes for a selector that is %s',
    (_label, configured) => {
      const { scope, client } = tracerScope();

      expect(
        createPostHogEventSink(
          {
            ...CONFIGURED_MEASUREMENT,
            provider: resolveMeasurementProvider(configured),
          },
          { scope: scope as PostHogScope },
        ),
      ).toBeUndefined();
      expect(client.initializedToken()).toBeNull();
      expect(client.initializedConfig()).toBeNull();
    },
  );

  it('refuses a hostile ambient slot without reading further, overwriting, or initializing', () => {
    const foreign = { init: 'not callable' };
    const scope: PostHogScope = { posthog: foreign };

    expect(createPostHogEventSink(CONFIGURED_MEASUREMENT, { scope })).toBeUndefined();
    expect(scope.posthog).toBe(foreign);
    expect(Object.keys(foreign)).toEqual(['init']);
  });
});
