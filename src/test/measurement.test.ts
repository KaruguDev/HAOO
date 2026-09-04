import { afterEach, describe, expect, it, vi } from 'vitest';
import { MEASUREMENT_TRACK_ARGUMENT_COUNT, createMeasurement } from '../measurement';
import {
  POSTHOG_REFUSAL,
  createPostHogEventSink,
  type PostHogClient,
  type PostHogScope,
} from '../measurement/posthog';
import {
  POSTHOG_LOCKDOWN,
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
  type VendorBeforeSend,
  type VendorCaptureResult,
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

/**
 * A refusal is visible, and it is the ONLY thing that is.
 *
 * D-05 makes a post-provider-check refusal observable to the owner, because a silently
 * refusing bundled SDK and a genuinely dead funnel produce identical reports. The
 * assertion is exact rather than "warned at least once" so the default channel cannot
 * grow into provider chatter, which is what would train the owner to ignore it.
 */
function expectOnlyRefusalWarning(
  spies: ReturnType<typeof silentConsole>,
  reason: string,
) {
  expect(spies.warn.mock.calls).toEqual([[reason]]);
  for (const [name, spy] of Object.entries(spies)) {
    if (name === 'warn') continue;
    expect(spy, `console.${name}`).not.toHaveBeenCalled();
  }
}

/**
 * The locked configuration as this project sends it, read once.
 *
 * The hostile table below is derived from these keys rather than restating them, so a key
 * added to the lockdown without a hostile case is a test failure rather than a silent
 * coverage hole (T-04.1-01).
 */
const LOCKED_CONFIGURATION = POSTHOG_LOCKDOWN(
  APPROVED_HOST,
  PROJECT_TOKEN,
  HAOO_MEASUREMENT_EVENTS,
) as Record<string, unknown>;
const LOCKED_KEYS = Object.keys(LOCKED_CONFIGURATION);

/**
 * One wrong value per locked key, derived from the locked value's own shape.
 *
 * Derived rather than tabulated for the same reason the key list is: a hand-written table
 * of wrong values would have to be extended by hand every time the lockdown grows, and the
 * row that was never added is exactly the key that would drift unnoticed.
 */
function hostileValue(locked: unknown): unknown {
  if (typeof locked === 'boolean') return !locked;
  if (locked === null) return 'a value the lockdown requires to be null';
  if (Array.isArray(locked)) return ['utm_term'];
  // A SUBSTITUTED function, not a non-function. The only locked function is
  // `before_send`, the property chokepoint, and the escape route worth closing is a
  // client that keeps the option callable while swapping in a reducer of its own — which
  // a `'not a function'` row can never reach, because it is refused by the `typeof` guard
  // before identity is ever consulted. The non-function case keeps its own explicit row
  // below, so strengthening this one costs no coverage.
  if (typeof locked === 'function') return SUBSTITUTED_BEFORE_SEND;
  if (typeof locked === 'string') return `${locked}-drifted`;
  return 'drifted';
}

/**
 * A reducer that is a perfectly good function and is not this project's.
 *
 * It even behaves plausibly — it passes the payload straight through — which is the
 * point: nothing about its shape distinguishes it from the real chokepoint, so only an
 * identity comparison can refuse it.
 */
const SUBSTITUTED_BEFORE_SEND = (result: unknown): unknown => result;

/** The transport shape a real capture arrives in, before the chokepoint reduces it. */
function vendorPayload(
  event: string,
  properties: Record<string, unknown> = {
    token: PROJECT_TOKEN,
    distinct_id: 'contract-distinct-1',
    $process_person_profile: false,
    $current_url: PRODUCT_HREF,
    $referrer: 'https://search.example/',
    $lib: 'web',
  },
): VendorCaptureResult {
  return { uuid: 'contract-envelope-1', event, properties };
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
    ['an absolute URL carrying the provider name', 'https://example.invalid/posthog', 'none'],
    ['a near miss with a suffix', 'posthog-eu', 'none'],
    ['a near miss with a prefix', 'notposthog', 'none'],
    ['a near miss with an inner space', 'post hog', 'none'],
  ];

  it.each(providerRows)(
    'resolves %s to the named provider',
    (_label, configured, expected) => {
      expect(resolveMeasurementProvider(configured)).toBe(expected);
    },
  );

  /**
   * Every row names its exact expected output rather than asserting a boolean.
   *
   * A was-rejected assertion passes for any falsy result, so a future resolver that
   * returned some third value — a normalized-but-unapproved origin, say — would satisfy
   * the rejection half of the table while silently changing what the provider is
   * initialized against. Naming the output is what makes that impossible.
   */
  const apiHostRows: readonly [string, string | undefined, string][] = [
    ['the approved origin exactly', APPROVED_HOST, APPROVED_HOST],
    ['the approved origin surrounded by whitespace', `  ${APPROVED_HOST}  `, APPROVED_HOST],
    ['the approved origin in upper case', APPROVED_HOST.toUpperCase(), APPROVED_HOST],
    ['the approved host on a non-default port', `${APPROVED_HOST}:8443`, ''],
    ['the approved host with a non-root path', `${APPROVED_HOST}/capture/`, ''],
    ['the approved host over http', APPROVED_HOST.replace('https:', 'http:'), ''],
    [
      'the approved host carrying credentials',
      APPROVED_HOST.replace('https://', 'https://someone:secret@'),
      '',
    ],
    ['the approved host carrying a query', `${APPROVED_HOST}?probe=1`, ''],
    ['the approved host carrying a fragment', `${APPROVED_HOST}#capture`, ''],
    ['a structurally valid foreign origin', 'https://ingest.attacker.example', ''],
    [
      'a lookalike host carrying the approved host as a leading label',
      `${APPROVED_HOST}.attacker.example`,
      '',
    ],
    [
      'a lookalike host that merely ends with the approved host',
      APPROVED_HOST.replace('https://', 'https://attacker-'),
      '',
    ],
    ['a protocol-relative reference', APPROVED_HOST.replace('https:', ''), ''],
    ['an unparsable string', 'not a url at all', ''],
    ['undefined', undefined, ''],
    ['the empty string', '', ''],
    ['whitespace only', '   \t ', ''],
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
    ['a key with a near-miss prefix', 'phx_tracerFixtureToken', ''],
    ['a key whose prefix differs only by case', 'PHC_tracerFixtureToken', ''],
    ['the bare prefix with nothing after it', 'phc_', ''],
    ['a key carrying a dot', 'phc_tracer.Fixture', ''],
    ['a key carrying a slash', 'phc_tracer/Fixture', ''],
    ['a key carrying an inner space', 'phc_tracer Fixture', ''],
    ['a key longer than the ceiling', `phc_${'a'.repeat(200)}`, ''],
    ['undefined', undefined, ''],
    ['the empty string', '', ''],
    ['whitespace only', '  \t ', ''],
  ];

  it.each(tokenRows)('resolves %s to the named token', (_label, configured, expected) => {
    expect(resolvePostHogToken(configured)).toBe(expected);
  });

  it('creates no sink, and never calls init, when the provider selector is unset', () => {
    // The RUNTIME successor to the bundle-level provider-origin prohibition withdrawn in
    // `04.1-01`, which named `04-08` as the plan whose guarantee it retired. That
    // prohibition scanned built bytes; its source-level successor
    // (`PROVIDER_INGESTION_HOST_SOURCE_FORBIDDEN`) scans every module under `src/`.
    // Neither says anything about what happens when the page actually runs, which is what
    // this asserts: with the selector unset the factory returns undefined and the vendor's
    // `init` is never reached at all. The two records point at each other deliberately.
    const scope: VendorPostHogScope = {};
    const client = installPostHogVendorClient(scope);

    expect(resolveMeasurementProvider(undefined)).toBe('none');
    expect(
      createPostHogEventSink(
        { ...CONFIGURED_MEASUREMENT, provider: resolveMeasurementProvider(undefined) },
        { scope: scope as PostHogScope },
      ),
    ).toBeUndefined();
    expect(client.initializedToken()).toBeNull();
    expect(client.initializedConfig()).toBeNull();
    expect(client.capturedEvents()).toEqual([]);
    expect(client.deliveredPayloads()).toEqual([]);
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
  const unconfiguredRows: readonly [string, string, string][] = [
    ['the resolved token is empty', '', APPROVED_HOST],
    ['the resolved token is whitespace only', '   ', APPROVED_HOST],
    ['the resolved ingestion host is empty', PROJECT_TOKEN, ''],
    ['the resolved ingestion host is whitespace only', PROJECT_TOKEN, '  \t '],
  ];

  it.each(unconfiguredRows)(
    'returns no sink, and attempts no initialization, when %s',
    (_label, token, apiHost) => {
      const scope: VendorPostHogScope = {};
      const client = installPostHogVendorClient(scope);
      const reasons: string[] = [];

      expect(
        createPostHogEventSink(
          { ...CONFIGURED_MEASUREMENT, providerConfig: { token, apiHost } },
          { scope: scope as PostHogScope, signalRefusal: (reason) => reasons.push(reason) },
        ),
      ).toBeUndefined();
      // The configuration gate runs before any capability is resolved, so a build with a
      // half-empty configuration never reaches the vendor at all.
      expect(client.initializedToken()).toBeNull();
      expect(client.capturedEvents()).toEqual([]);
      expect(reasons).toEqual([POSTHOG_REFUSAL.unconfigured]);
    },
  );

  it('returns no sink for the no-op provider without touching the client', () => {
    const scope: VendorPostHogScope = {};
    const client = installPostHogVendorClient(scope);

    expect(
      createPostHogEventSink(
        { ...CONFIGURED_MEASUREMENT, provider: 'none' },
        { scope: scope as PostHogScope },
      ),
    ).toBeUndefined();
    expect(client.initializedToken()).toBeNull();
    expect(client.capturedEvents()).toEqual([]);
  });

  it('takes exactly one argument, so a property bag has no parameter to travel through', () => {
    const scope: VendorPostHogScope = {};
    installPostHogVendorClient(scope);

    const sink = createPostHogEventSink(CONFIGURED_MEASUREMENT, {
      scope: scope as PostHogScope,
    });

    expect(sink).toBeTypeOf('function');
    expect(sink).toHaveLength(1);
  });

  it('delivers exactly one payload for an allowlisted name and none for any other', () => {
    const scope: VendorPostHogScope = {};
    const client = installPostHogVendorClient(scope);
    const sink = createPostHogEventSink(CONFIGURED_MEASUREMENT, {
      scope: scope as PostHogScope,
    });

    sink?.('haoo_page_view');
    expect(client.deliveredPayloads()).toHaveLength(1);

    // The sink forwards whatever it is handed; the allowlist runs on the way OUT, which
    // is what drops a name the SDK itself would emit even when the call site is correct.
    sink?.('haoo_page_view_extra' as HaooMeasurementEvent);
    expect(client.capturedEvents()).toEqual(['haoo_page_view', 'haoo_page_view_extra']);
    expect(client.deliveredPayloads()).toHaveLength(1);
  });

  /**
   * The chokepoint as the vendor resolved it, not as this repository declares it.
   *
   * Reading `before_send` back off the merged configuration is what proves the function
   * the provider will actually call is the one asserted here.
   */
  function resolvedBeforeSend(): VendorBeforeSend {
    const scope: VendorPostHogScope = {};
    const client = installPostHogVendorClient(scope);

    createPostHogEventSink(CONFIGURED_MEASUREMENT, { scope: scope as PostHogScope });

    const beforeSend = client.initializedConfig()?.before_send;
    expect(beforeSend).toBeTypeOf('function');

    return beforeSend as VendorBeforeSend;
  }

  const droppedRows: readonly [string, VendorCaptureResult | null][] = [
    ['a null payload', null],
    ['an event the SDK emits for itself', vendorPayload('$pageview')],
    ['a name that differs only by case', vendorPayload('HAOO_PAGE_VIEW')],
    ['a name padded with whitespace', vendorPayload(' haoo_page_view ')],
    [
      'a name that normalizes to an allowlisted name under NFKC',
      vendorPayload('hａoo_page_view'),
    ],
    ['an allowlisted name with an empty properties object', vendorPayload('haoo_page_view', {})],
    [
      'an allowlisted name missing one transport key',
      vendorPayload('haoo_page_view', {
        token: PROJECT_TOKEN,
        distinct_id: 'contract-distinct-1',
      }),
    ],
  ];

  it.each(droppedRows)('emits nothing for %s', (_label, received) => {
    expect(resolvedBeforeSend()(received)).toBeNull();
  });

  it('drops a payload whose properties object is absent rather than emitting it partially', () => {
    const absent = { uuid: 'contract-envelope-1', event: 'haoo_page_view' };

    expect(resolvedBeforeSend()(absent as unknown as VendorCaptureResult)).toBeNull();
  });

  it('matches event names by exact string equality, with no normalization at all', () => {
    // The denormalized name renders as the allowlisted one and normalizes to it, which is
    // exactly why an allowlist that called `.normalize()` would admit it.
    expect('hａoo_page_view'.normalize('NFKC')).toBe('haoo_page_view');
    expect(' haoo_page_view '.trim()).toBe('haoo_page_view');
    expect('HAOO_PAGE_VIEW'.toLowerCase()).toBe('haoo_page_view');
  });

  it('emits exactly the three transport keys, in order, from a freshly built literal', () => {
    const received = vendorPayload('haoo_qualify_submit');
    const emitted = resolvedBeforeSend()(received);

    expect(emitted).not.toBeNull();
    expect(Object.keys(emitted?.properties ?? {})).toEqual([...TRANSPORT_REQUIRED_PROPERTIES]);
    expect(emitted?.properties).not.toBe(received.properties);
  });

  it('reduces a payload carrying thirty extra provider properties to exactly three', () => {
    const properties: Record<string, unknown> = {
      token: PROJECT_TOKEN,
      distinct_id: 'contract-distinct-1',
      $process_person_profile: false,
    };
    for (let index = 0; index < 30; index += 1) {
      properties[`$provider_added_${index}`] = `value-${index}`;
    }

    const emitted = resolvedBeforeSend()(vendorPayload('haoo_page_view', properties));

    expect(Object.keys(emitted?.properties ?? {})).toEqual([...TRANSPORT_REQUIRED_PROPERTIES]);
  });
});

describe('fail-closed provider initialization', () => {
  it('names a distinct, non-empty gate in every refusal reason', () => {
    const reasons = Object.values(POSTHOG_REFUSAL);

    expect(reasons.length).toBeGreaterThanOrEqual(6);
    expect(new Set(reasons).size).toBe(reasons.length);
    for (const reason of reasons) {
      expect(reason).toMatch(/^posthog:[a-z-]+$/);
    }
  });

  /**
   * One hostile case per locked key, derived from the exported lockdown.
   *
   * This is D-04 gate 1 at full depth: a merged configuration that resolves ONE key wrong
   * — and every other key right — must still yield no sink, attempt no capture, and say
   * which gate refused. A representative sample would leave the untested keys free to
   * drift on a version bump, which is the failure this table exists to make impossible.
   */
  it.each(LOCKED_KEYS.map((key) => [key] as const))(
    'withholds the sink when the merged configuration resolves %s wrong',
    (key) => {
      const scope: VendorPostHogScope = {};
      const client = installPostHogVendorClient(scope, {
        [key]: hostileValue(LOCKED_CONFIGURATION[key]),
      });
      const reasons: string[] = [];

      expect(
        createPostHogEventSink(CONFIGURED_MEASUREMENT, {
          scope: scope as PostHogScope,
          signalRefusal: (reason) => reasons.push(reason),
        }),
      ).toBeUndefined();
      expect(client.capturedEvents()).toEqual([]);
      expect(client.deliveredPayloads()).toEqual([]);
      expect(reasons).toEqual([POSTHOG_REFUSAL.lockdown]);
    },
  );

  it('covers every locked key, so a key added without a hostile case fails here', () => {
    expect(LOCKED_KEYS.length).toBeGreaterThanOrEqual(30);
    expect(LOCKED_KEYS).toContain('before_send');
    expect(LOCKED_KEYS).toContain('advanced_disable_flags');
    expect(LOCKED_KEYS).toContain('token');
  });

  /**
   * The chokepoint is pinned by identity, so the non-callable case needs its own row.
   *
   * The derived table above now substitutes a *callable* reducer for `before_send`,
   * because a client that keeps the option callable while swapping the function is the
   * escape route worth closing. That strengthening would have quietly retired the
   * original assertion — that a non-function is refused — so it is restated here rather
   * than dropped. Both must refuse, and both must refuse at the same gate.
   */
  it.each([
    ['a substituted reducer that is not this project’s', SUBSTITUTED_BEFORE_SEND],
    ['a non-callable value', 'not a function'],
    ['an absent chokepoint', undefined],
  ] as const)(
    'withholds the sink when the merged before_send is %s',
    (_label, value) => {
      const scope: VendorPostHogScope = {};
      const client = installPostHogVendorClient(scope, { before_send: value });
      const reasons: string[] = [];

      expect(
        createPostHogEventSink(CONFIGURED_MEASUREMENT, {
          scope: scope as PostHogScope,
          signalRefusal: (reason) => reasons.push(reason),
        }),
      ).toBeUndefined();
      expect(client.capturedEvents()).toEqual([]);
      expect(client.deliveredPayloads()).toEqual([]);
      expect(reasons).toEqual([POSTHOG_REFUSAL.lockdown]);
    },
  );

  const hostileSlotRows: readonly [string, unknown][] = [
    ['a non-callable value', { init: 'foreign' }],
    ['a frozen object with no initializer', Object.freeze({ marker: 'frozen' })],
    ['a string', 'posthog'],
    ['a number', 7],
  ];

  it.each(hostileSlotRows)(
    'refuses, signals, and leaves the ambient slot untouched when it holds %s',
    (_label, ambient) => {
      const scope: PostHogScope = { posthog: ambient };
      const reasons: string[] = [];

      expect(
        createPostHogEventSink(CONFIGURED_MEASUREMENT, {
          scope,
          signalRefusal: (reason) => reasons.push(reason),
        }),
      ).toBeUndefined();
      // Somebody else's global is left byte-identical: not replaced, not wrapped, and not
      // decorated with anything this adapter would have needed.
      expect(scope.posthog).toBe(ambient);
      expect(reasons).toEqual([POSTHOG_REFUSAL.foreignClient]);
    },
  );

  it('refuses when the ambient value exposes a throwing property getter', () => {
    const ambient = {};
    Object.defineProperty(ambient, 'init', {
      get() {
        throw new Error('hostile getter');
      },
    });
    const scope: PostHogScope = { posthog: ambient };
    const reasons: string[] = [];

    expect(
      createPostHogEventSink(CONFIGURED_MEASUREMENT, {
        scope,
        signalRefusal: (reason) => reasons.push(reason),
      }),
    ).toBeUndefined();
    expect(scope.posthog).toBe(ambient);
    expect(reasons).toEqual([POSTHOG_REFUSAL.foreignClient]);
  });

  it('refuses when reading the ambient slot itself throws', () => {
    const scope: PostHogScope = {};
    Object.defineProperty(scope, 'posthog', {
      get() {
        throw new Error('hostile slot');
      },
      configurable: true,
    });
    const reasons: string[] = [];

    expect(
      createPostHogEventSink(CONFIGURED_MEASUREMENT, {
        scope,
        signalRefusal: (reason) => reasons.push(reason),
      }),
    ).toBeUndefined();
    expect(reasons).toEqual([POSTHOG_REFUSAL.foreignClient]);
  });

  it('refuses an empty ambient slot rather than installing a stub of its own', () => {
    const scope: PostHogScope = {};
    const reasons: string[] = [];

    expect(
      createPostHogEventSink(CONFIGURED_MEASUREMENT, {
        scope,
        signalRefusal: (reason) => reasons.push(reason),
      }),
    ).toBeUndefined();
    expect(scope.posthog).toBeUndefined();
    expect(reasons).toEqual([POSTHOG_REFUSAL.absentClient]);
  });

  it('refuses, without throwing, when the initializer throws', () => {
    const scope: PostHogScope = {
      posthog: {
        init() {
          throw new Error('initializer unavailable');
        },
      },
    };
    const reasons: string[] = [];
    let sink: ((event: HaooMeasurementEvent) => void) | undefined;

    expect(() => {
      sink = createPostHogEventSink(CONFIGURED_MEASUREMENT, {
        scope,
        signalRefusal: (reason) => reasons.push(reason),
      });
    }).not.toThrow();
    expect(sink).toBeUndefined();
    expect(reasons).toEqual([POSTHOG_REFUSAL.initialization]);
  });

  const unreadableInstanceRows: readonly [string, unknown][] = [
    ['a non-object', 'initialized'],
    ['null', null],
    ['undefined', undefined],
    ['an object with no config to read back', { capture: () => undefined }],
    ['an object whose config is not an object', { config: 'merged', capture: () => undefined }],
  ];

  it.each(unreadableInstanceRows)(
    'refuses when the initializer returns %s',
    (_label, instance) => {
      const scope: PostHogScope = { posthog: { init: () => instance } };
      const reasons: string[] = [];

      expect(createPostHogEventSink(CONFIGURED_MEASUREMENT, {
        scope,
        signalRefusal: (reason) => reasons.push(reason),
      })).toBeUndefined();
      expect(reasons).toEqual([POSTHOG_REFUSAL.lockdown]);
    },
  );

  it('refuses an initialized instance whose capture entry point is not callable', () => {
    const scope: PostHogScope = {
      posthog: {
        init: (_token: string, config: Record<string, unknown>) => ({
          config,
          capture: 'not callable',
        }),
      },
    };
    const reasons: string[] = [];

    expect(createPostHogEventSink(CONFIGURED_MEASUREMENT, {
      scope,
      signalRefusal: (reason) => reasons.push(reason),
    })).toBeUndefined();
    expect(reasons).toEqual([POSTHOG_REFUSAL.absentCapture]);
  });

  it('writes the refusal reason to the console when no channel is injected', () => {
    const spies = silentConsole();

    expect(
      createPostHogEventSink(CONFIGURED_MEASUREMENT, { scope: { posthog: { init: 'foreign' } } }),
    ).toBeUndefined();

    // D-05: a silently refusing bundled SDK produces a report that reads as zero traffic
    // and is indistinguishable from a genuinely dead funnel, so the default channel is
    // observable rather than silent.
    expectOnlyRefusalWarning(spies, POSTHOG_REFUSAL.foreignClient);
  });

  it('survives a refusal channel that throws', () => {
    expect(() =>
      createPostHogEventSink(CONFIGURED_MEASUREMENT, {
        scope: { posthog: { init: 'foreign' } },
        signalRefusal: () => {
          throw new Error('hostile channel');
        },
      }),
    ).not.toThrow();
  });

  it('stays silent for the no-op provider, before any gate has an opinion', () => {
    const reasons: string[] = [];
    const spies = silentConsole();

    createPostHogEventSink(
      { ...CONFIGURED_MEASUREMENT, provider: 'none' },
      { scope: {}, signalRefusal: (reason) => reasons.push(reason) },
    );

    // An unconfigured build is not a refusal. Signalling here would make the channel
    // meaningless on the builds that matter.
    expect(reasons).toEqual([]);
    expectSilent(spies);
  });
});

/**
 * MEAS-07 on the refused-initialization path.
 *
 * Refusing to collect is a privacy decision, never a degradation of the journey: with no
 * sink and no provider call, the qualification journey and the bounded local context must
 * be indistinguishable from an unconfigured build — on EVERY refusal cause, not on the
 * one that happened to be written down.
 */
describe('fail-closed provider initialization in the full journey', () => {
  const refusalCauses: readonly [string, () => { scope: PostHogScope; reason: string }][] = [
    [
      'the ambient slot holds a non-callable value',
      () => ({ scope: { posthog: { init: 'foreign' } }, reason: POSTHOG_REFUSAL.foreignClient }),
    ],
    [
      'the ambient slot is empty',
      () => ({ scope: {}, reason: POSTHOG_REFUSAL.absentClient }),
    ],
    [
      'the initializer throws',
      () => ({
        scope: {
          posthog: {
            init() {
              throw new Error('initializer unavailable');
            },
          },
        },
        reason: POSTHOG_REFUSAL.initialization,
      }),
    ],
    [
      'the initializer silently resolves a locked key wrong',
      () => {
        const scope: VendorPostHogScope = {};
        installPostHogVendorClient(scope, { autocapture: true });

        return { scope: scope as PostHogScope, reason: POSTHOG_REFUSAL.lockdown };
      },
    ],
    [
      'the initialized instance exposes no capture entry point',
      () => ({
        scope: {
          posthog: {
            init: (_token: string, config: Record<string, unknown>) => ({
              config,
              capture: 'not callable',
            }),
          },
        },
        reason: POSTHOG_REFUSAL.absentCapture,
      }),
    ],
  ];

  it.each(refusalCauses)(
    'keeps every event path of the whole journey working when %s',
    (_label, build) => {
      const spies = silentConsole();
      const { scope, reason } = build();
      const storage = new MemoryStorage();
      const measurement = createMeasurement(CONFIGURED_MEASUREMENT, {
        storage,
        now: () => TODAY,
        location: { href: PRODUCT_HREF },
        history: { state: null, replaceState: vi.fn() },
        providerAdapters: { scope },
      });

      measurement.initialize();

      // Refusal is not a one-shot degradation: every one of the ten event paths still
      // reports success and still writes its bounded local flag.
      for (const event of HAOO_MEASUREMENT_EVENTS) {
        expect(measurement.track(event), event).toBe(true);
      }

      const flags = measurement.readContext().flags;
      for (const flag of HAOO_MEASUREMENT.interactionFlags) {
        expect(flags[flag], flag).toBe(true);
      }
      expect(storage.getItem(CONTEXT_KEY)).not.toBeNull();
      expect(measurement.clearContext()).toBe(true);
      expectOnlyRefusalWarning(spies, reason);
    },
  );

  it('leaves a refused provider global at its original identity', () => {
    const spies = silentConsole();
    const original = Object.freeze({ marker: 'somebody else' });
    const scope: PostHogScope = { posthog: original };
    const measurement = createMeasurement(CONFIGURED_MEASUREMENT, {
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: PRODUCT_HREF },
      history: { state: null, replaceState: vi.fn() },
      providerAdapters: { scope },
    });

    measurement.initialize();
    for (const event of HAOO_MEASUREMENT_EVENTS) {
      expect(measurement.track(event), event).toBe(true);
    }

    // Not replaced, not wrapped, not decorated: refusing before anything could have been
    // written is why no refusal path ever has anything to restore.
    expect(scope.posthog).toBe(original);
    expect(Object.keys(original)).toEqual(['marker']);
    expectOnlyRefusalWarning(spies, POSTHOG_REFUSAL.foreignClient);
  });
});

describe('provider failure isolation', () => {
  function isolatedMeasurement(
    adapters: Parameters<typeof createMeasurement>[1] = {},
    storage: Storage = new MemoryStorage(),
  ) {
    return {
      storage,
      measurement: createMeasurement(CONFIGURED_MEASUREMENT, {
        storage,
        now: () => TODAY,
        location: { href: PRODUCT_HREF },
        history: { state: null, replaceState: vi.fn() },
        ...adapters,
      }),
    };
  }

  it('leaves the journey unchanged when an injected sink throws on every call', () => {
    const spies = silentConsole();
    const { measurement, storage } = isolatedMeasurement({
      eventSink: () => {
        throw new Error('provider unavailable');
      },
    });

    measurement.initialize();
    for (const event of HAOO_MEASUREMENT_EVENTS) {
      expect(measurement.track(event), event).toBe(true);
    }

    const flags = measurement.readContext().flags;
    for (const flag of HAOO_MEASUREMENT.interactionFlags) {
      expect(flags[flag], flag).toBe(true);
    }
    expect(storage.getItem(CONTEXT_KEY)).not.toBeNull();
    expectSilent(spies);
  });

  it('leaves the journey unchanged when the resolved capture entry point throws', () => {
    const spies = silentConsole();
    const client: PostHogClient = {
      init: (_token: string, config?: Record<string, unknown>) => ({
        config,
        capture() {
          throw new Error('provider unavailable');
        },
      }),
    };
    const { measurement } = isolatedMeasurement({ providerAdapters: { client } });

    measurement.initialize();
    for (const event of HAOO_MEASUREMENT_EVENTS) {
      expect(measurement.track(event), event).toBe(true);
    }
    expect(measurement.readContext().flags.selfOnboarding).toBe(true);
    expectSilent(spies);
  });

  it('leaves the journey unchanged when the provider global is absent', () => {
    const spies = silentConsole();
    const { measurement } = isolatedMeasurement({ providerAdapters: { scope: {} } });

    measurement.initialize();
    for (const event of HAOO_MEASUREMENT_EVENTS) {
      expect(measurement.track(event), event).toBe(true);
    }
    expectOnlyRefusalWarning(spies, POSTHOG_REFUSAL.absentClient);
  });

  it('leaves the journey unchanged when reading the provider global throws', () => {
    const spies = silentConsole();
    const scope: PostHogScope = {};
    Object.defineProperty(scope, 'posthog', {
      get() {
        throw new Error('blocked slot');
      },
      configurable: true,
    });
    const { measurement } = isolatedMeasurement({ providerAdapters: { scope } });

    measurement.initialize();
    for (const event of HAOO_MEASUREMENT_EVENTS) {
      expect(measurement.track(event), event).toBe(true);
    }
    expectOnlyRefusalWarning(spies, POSTHOG_REFUSAL.foreignClient);
  });

  it('leaves the journey unchanged when the merged configuration reads back hostilely', () => {
    const spies = silentConsole();
    const hostileConfig = {};
    for (const key of ['token', 'api_host', 'autocapture', 'before_send']) {
      Object.defineProperty(hostileConfig, key, {
        get() {
          throw new Error('hostile merged configuration');
        },
        enumerable: true,
      });
    }
    const client: PostHogClient = {
      init: () => ({ config: hostileConfig, capture: () => undefined }),
    };
    const { measurement } = isolatedMeasurement({ providerAdapters: { client } });

    // The merged configuration is the LAST untrusted value on the initialization path,
    // and the readback is the only thing that reads it. A throwing getter there escaping
    // into `initialize()` is the Phase 4 gap-1 shape on the enablement path this phase
    // turns on for the first time.
    expect(() => measurement.initialize()).not.toThrow();
    for (const event of HAOO_MEASUREMENT_EVENTS) {
      expect(measurement.track(event), event).toBe(true);
    }
    expectOnlyRefusalWarning(spies, POSTHOG_REFUSAL.lockdown);
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
    for (const member of Object.values(measurement)) {
      expect(member).toBeTypeOf('function');
    }
  });

  it('keeps track to exactly one parameter, so no property bag can travel with a name', () => {
    const measurement = createMeasurement(CONFIGURED_MEASUREMENT, {
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: PRODUCT_HREF },
      providerAdapters: { scope: {} },
    });

    expect(measurement.track).toHaveLength(MEASUREMENT_TRACK_ARGUMENT_COUNT);
    expect(MEASUREMENT_TRACK_ARGUMENT_COUNT).toBe(1);
    expect(measurement.initialize).toHaveLength(0);
    expect(measurement.readContext).toHaveLength(0);
    expect(measurement.readCampaign).toHaveLength(0);
    expect(measurement.clearContext).toHaveLength(0);
  });

  it('wires the configured provider sink when no sink adapter is injected', () => {
    const scope: VendorPostHogScope = {};
    const client = installPostHogVendorClient(scope);
    const measurement = createMeasurement(CONFIGURED_MEASUREMENT, {
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: PRODUCT_HREF },
      history: { state: null, replaceState: vi.fn() },
      providerAdapters: { scope: scope as PostHogScope },
    });

    measurement.initialize();
    for (const event of HAOO_MEASUREMENT_EVENTS) {
      expect(measurement.track(event), event).toBe(true);
    }

    expect(client.initializedToken()).toBe(PROJECT_TOKEN);
    expect(client.capturedEvents()).toEqual([...HAOO_MEASUREMENT_EVENTS]);
    expect(client.deliveredPayloads().map((payload) => payload.event))
      .toEqual([...HAOO_MEASUREMENT_EVENTS]);
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

  it('rejects a name outside the closed list without reaching the provider', () => {
    const scope: VendorPostHogScope = {};
    const client = installPostHogVendorClient(scope);
    const measurement = createMeasurement(CONFIGURED_MEASUREMENT, {
      storage: new MemoryStorage(),
      now: () => TODAY,
      location: { href: PRODUCT_HREF },
      history: { state: null, replaceState: vi.fn() },
      providerAdapters: { scope: scope as PostHogScope },
    });

    measurement.initialize();
    expect(measurement.track('haoo_page_view_extra' as HaooMeasurementEvent)).toBe(false);
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
    // The `beforeSend` member is deliberately taken from the resolved configuration here.
    // The adapter mints its chokepoint inside `createPostHogEventSink` and does not expose
    // it, so this re-assertion cannot obtain the sent function independently — and it does
    // not need to. That the identity held is already proven by `sink` being a function at
    // all: the adapter returns one only after its own `lockdownHolds` agreed. What this
    // call adds is an independent re-read of the other 32 keys, and what proves the
    // identity comparison can FAIL is the substituted-reducer row in the hostile table.
    expect(lockdownHolds(resolved, {
      apiHost: APPROVED_HOST,
      token: PROJECT_TOKEN,
      beforeSend: resolved?.before_send,
    })).toBe(true);

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
    const spies = silentConsole();
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
    // The sink is withheld twice on this path — once directly, once through the facade —
    // and each refusal names the lockdown gate rather than passing unremarked.
    expect(spies.warn.mock.calls).toEqual([
      [POSTHOG_REFUSAL.lockdown],
      [POSTHOG_REFUSAL.lockdown],
    ]);
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
    const spies = silentConsole();
    const foreign = { init: 'not callable' };
    const scope: PostHogScope = { posthog: foreign };

    expect(createPostHogEventSink(CONFIGURED_MEASUREMENT, { scope })).toBeUndefined();
    expect(scope.posthog).toBe(foreign);
    expect(Object.keys(foreign)).toEqual(['init']);
    expectOnlyRefusalWarning(spies, POSTHOG_REFUSAL.foreignClient);
  });
});
