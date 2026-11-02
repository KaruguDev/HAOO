import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PostHogClient, PostHogScope } from '../measurement/posthog';
import {
  DEFERRED_EVENT_LIMIT,
  POSTHOG_SETTLE_DELAY_MS,
  scheduleWhenEngagedOrSettled,
} from '../measurement/posthog-deferred';
import { POSTHOG_REFUSAL } from '../measurement/posthog-refusal';
import { APPROVED_ANALYTICS_HOSTS } from '../../config/approved-analytics-hosts';
import { HAOO_MEASUREMENT, type HaooMeasurementEvent } from '../products/haoo';
import type { ProductMeasurement } from '../products/types';
import { createPostHogVendorClient } from './fixtures/posthog-capture-contract';

/**
 * Quick task 261102-psi: the PostHog adapter and SDK left the critical path. They are
 * fetched on the visitor's first interaction or shortly after load; events tracked before
 * then are held (allowlisted names only, bounded) and replayed in order once every adapter
 * gate has passed. This file never imports `../measurement/posthog` statically, so each
 * case starts with the adapter unloaded.
 */
const CONFIGURED: ProductMeasurement<HaooMeasurementEvent> = {
  ...HAOO_MEASUREMENT,
  provider: 'posthog',
  providerConfig: {
    token: 'phc_deferredFixtureToken0123456789',
    apiHost: APPROVED_ANALYTICS_HOSTS[0].origin,
  },
};

/** Fresh module instances, so adapter registration from an earlier case does not leak. */
async function freshLoader() {
  vi.resetModules();
  return import('../measurement/posthog-deferred');
}

/**
 * Loads the real adapter (which registers itself with the fresh loader and binds the real
 * SDK), with the SDK initializer routed to the documented-defaults fixture so nothing
 * reaches the network (MEAS-07).
 */
function fixtureAdapter(vendor: ReturnType<typeof createPostHogVendorClient>) {
  return vi.fn(async () => {
    const adapter = await import('../measurement/posthog');
    vi.spyOn(adapter.boundPostHogClient() as PostHogClient, 'init')
      .mockImplementation((token, config) => vendor.init(token, config));
    return adapter;
  });
}

function manualSchedule() {
  let start: (() => void) | null = null;
  return {
    scheduleLoad: (begin: () => void) => {
      start = begin;
    },
    fire: () => start?.(),
  };
}

const settle = async () => {
  for (let index = 0; index < 5; index += 1) await new Promise((resolve) => setTimeout(resolve, 0));
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('deferred PostHog loading', () => {
  it('fetches nothing until scheduled, then replays held events in order', async () => {
    const loader = await freshLoader();
    const vendor = createPostHogVendorClient();
    const schedule = manualSchedule();
    const loadAdapter = fixtureAdapter(vendor);
    const scope: PostHogScope = {};

    const sink = loader.createDeferredPostHogEventSink(CONFIGURED, { scope }, {}, {
      scheduleLoad: schedule.scheduleLoad,
      loadAdapter,
    });

    expect(sink).toBeTypeOf('function');
    sink!('haoo_brochure_open');
    sink!('haoo_brochure_download');
    expect(loadAdapter).not.toHaveBeenCalled();
    expect(vendor.capturedEvents()).toEqual([]);

    schedule.fire();
    await settle();

    expect(loadAdapter).toHaveBeenCalledTimes(1);
    expect(vendor.initializedToken()).toBe(CONFIGURED.providerConfig.token);
    expect(vendor.capturedEvents()).toEqual(['haoo_brochure_open', 'haoo_brochure_download']);

    sink!('haoo_brochure_preview');
    expect(vendor.capturedEvents()).toEqual([
      'haoo_brochure_open',
      'haoo_brochure_download',
      'haoo_brochure_preview',
    ]);
    // Resolved, never installed into the classified global.
    expect(scope.posthog).toBeUndefined();
  });

  it('takes the synchronous path once the adapter has been evaluated', async () => {
    const loader = await freshLoader();
    const vendor = createPostHogVendorClient();
    await fixtureAdapter(vendor)();
    const scheduleLoad = vi.fn();

    const sink = loader.createDeferredPostHogEventSink(CONFIGURED, { scope: {} }, {}, { scheduleLoad });
    sink!('haoo_brochure_open');

    expect(scheduleLoad).not.toHaveBeenCalled();
    expect(vendor.capturedEvents()).toEqual(['haoo_brochure_open']);
  });

  it('decides configuration refusals synchronously without fetching anything', async () => {
    const loader = await freshLoader();
    const reasons: string[] = [];
    const loadAdapter = vi.fn();
    const scheduleLoad = vi.fn();

    expect(loader.createDeferredPostHogEventSink(
      { ...CONFIGURED, providerConfig: { token: ' ', apiHost: CONFIGURED.providerConfig.apiHost } },
      { signalRefusal: (reason) => reasons.push(reason) },
      {},
      { loadAdapter, scheduleLoad },
    )).toBeUndefined();
    expect(reasons).toEqual([POSTHOG_REFUSAL.unconfigured]);
    expect(loader.createDeferredPostHogEventSink(
      { ...CONFIGURED, provider: 'none' },
      {},
      {},
      { loadAdapter, scheduleLoad },
    )).toBeUndefined();
    expect(scheduleLoad).not.toHaveBeenCalled();
    expect(loadAdapter).not.toHaveBeenCalled();
  });

  it('discards held events when the adapter cannot be fetched, without throwing', async () => {
    const loader = await freshLoader();
    const schedule = manualSchedule();
    const sink = loader.createDeferredPostHogEventSink(CONFIGURED, {}, {}, {
      scheduleLoad: schedule.scheduleLoad,
      loadAdapter: () => Promise.reject(new Error('blocked by an extension')),
    });

    sink!('haoo_brochure_open');
    schedule.fire();
    await settle();
    expect(() => sink!('haoo_brochure_download')).not.toThrow();
  });

  it('applies every adapter gate after loading: a foreign global is still refused', async () => {
    const loader = await freshLoader();
    const vendor = createPostHogVendorClient();
    const schedule = manualSchedule();
    const reasons: string[] = [];
    const scope: PostHogScope = { posthog: { init: () => undefined } };

    const sink = loader.createDeferredPostHogEventSink(
      CONFIGURED,
      { scope, signalRefusal: (reason) => reasons.push(reason) },
      {},
      { scheduleLoad: schedule.scheduleLoad, loadAdapter: fixtureAdapter(vendor) },
    );

    sink!('haoo_brochure_open');
    schedule.fire();
    await settle();

    expect(reasons).toEqual([POSTHOG_REFUSAL.foreignClient]);
    expect(vendor.initializedToken()).toBeNull();
    sink!('haoo_brochure_download');
    expect(vendor.capturedEvents()).toEqual([]);
  });

  it('holds at most DEFERRED_EVENT_LIMIT events', async () => {
    const loader = await freshLoader();
    const vendor = createPostHogVendorClient();
    const schedule = manualSchedule();
    const sink = loader.createDeferredPostHogEventSink(CONFIGURED, { scope: {} }, {}, {
      scheduleLoad: schedule.scheduleLoad,
      loadAdapter: fixtureAdapter(vendor),
    });

    for (let index = 0; index < DEFERRED_EVENT_LIMIT + 10; index += 1) sink!('haoo_brochure_open');
    schedule.fire();
    await settle();

    expect(vendor.capturedEvents()).toHaveLength(DEFERRED_EVENT_LIMIT);
  });
});

describe('scheduleWhenEngagedOrSettled', () => {
  it('starts on the first interaction, exactly once', () => {
    const start = vi.fn();
    scheduleWhenEngagedOrSettled(start);

    expect(start).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('pointerdown'));
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('starts after the settle delay once the page has loaded, with no interaction', () => {
    vi.useFakeTimers();
    const start = vi.fn();
    // jsdom documents are already `complete`, so the settle timer starts immediately.
    scheduleWhenEngagedOrSettled(start);

    vi.advanceTimersByTime(POSTHOG_SETTLE_DELAY_MS - 1);
    expect(start).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(start).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('keydown'));
    expect(start).toHaveBeenCalledTimes(1);
  });
});
