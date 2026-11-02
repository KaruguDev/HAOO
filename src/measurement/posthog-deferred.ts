import type { MeasurementProviderConfig, ProductMeasurement } from '../products/types';
import type { PostHogAdapters } from './posthog';
import { POSTHOG_REFUSAL } from './posthog-refusal';

/**
 * On-demand PostHog loading (quick task 261102-psi, superseding the eager value import of
 * plan `04.1-09` / deferred item D4; see
 * `.planning/quick/261102-psi-defer-posthog-sdk/DECISION.md`).
 *
 * The provider adapter in `./posthog` binds the pinned SDK in a value position, exactly as
 * D4 recorded, and together they are ~95 KB (gzip) that PageSpeed reported as
 * critical-path, unused and legacy JavaScript. This module is the only part the page loads
 * up front: it decides the gates that need no SDK, holds tracked event names, and fetches
 * the adapter (and with it the SDK) on the visitor's first interaction. Once the adapter
 * has been evaluated, every later call takes its synchronous path unchanged.
 */

type EventSinkFactory = <EventName extends string>(
  config: Pick<ProductMeasurement<EventName>, 'provider' | 'providerConfig' | 'events'>,
  adapters?: PostHogAdapters,
  campaign?: Readonly<Record<string, string>>,
) => ((event: EventName) => void) | undefined;

export interface PostHogAdapterModule {
  readonly createPostHogEventSink: EventSinkFactory;
}

/** Timing and loading seams, injected by tests; production uses the defaults below. */
export interface DeferredLoadAdapters {
  /** Receives `start` and must call it at most once. Defaults to `scheduleOnFirstInteraction`. */
  readonly scheduleLoad?: (start: () => void) => void;
  /** Fetches the adapter module. Defaults to a dynamic import of `./posthog`. */
  readonly loadAdapter?: () => Promise<PostHogAdapterModule>;
}

let registeredAdapter: PostHogAdapterModule | undefined;

/** Called by `./posthog` when it is evaluated. */
export function registerPostHogAdapter(adapter: PostHogAdapterModule): void {
  registeredAdapter = adapter;
}

function importAdapter(): Promise<PostHogAdapterModule> {
  return import('./posthog');
}

/** Events held while the SDK loads. Allowlisted names only, so this bounds memory, not privacy. */
export const DEFERRED_EVENT_LIMIT = 50;
const ENGAGEMENT_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel', 'mousemove'] as const;

/**
 * Starts the fetch on the visitor's first interaction, and only then (owner decision,
 * 261102-psi follow-up). There is deliberately no timer fallback: a timer fired inside
 * PageSpeed's measurement window and put the SDK back into its unused- and legacy-JavaScript
 * findings. The cost, recorded in DECISION.md, is that a visitor who never scrolls, taps,
 * types or moves a pointer is not counted. Starts immediately if the browser surface is
 * unavailable.
 */
export function scheduleOnFirstInteraction(start: () => void): void {
  let started = false;

  const begin = () => {
    if (started) return;
    started = true;
    try {
      for (const name of ENGAGEMENT_EVENTS) window.removeEventListener(name, begin, true);
    } catch {
      // Listener cleanup is best effort.
    }
    start();
  };

  try {
    for (const name of ENGAGEMENT_EVENTS) {
      window.addEventListener(name, begin, { capture: true, passive: true, once: true });
    }
  } catch {
    begin();
  }
}

function signal(adapters: PostHogAdapters, reason: string): void {
  try {
    if (adapters.signalRefusal !== undefined) adapters.signalRefusal(reason);
    else console.warn(reason);
  } catch {
    // A refusal channel that throws must not turn a refusal into an exception.
  }
}

/**
 * The facade's provider entry point.
 *
 * - Provider not selected: no sink, nothing loaded.
 * - Blank project key or host: refused synchronously with `POSTHOG_REFUSAL.unconfigured`,
 *   nothing loaded.
 * - Adapter already evaluated: `createPostHogEventSink` runs synchronously, unchanged.
 * - Otherwise: the returned sink holds tracked event names (at most `DEFERRED_EVENT_LIMIT`,
 *   in memory, in order) until the adapter is scheduled, fetched and through every one of
 *   its gates, then replays them. A refusal or failed fetch discards them, never throwing.
 */
export function createDeferredPostHogEventSink<EventName extends string>(
  config: Pick<ProductMeasurement<EventName>, 'provider' | 'providerConfig' | 'events'>,
  adapters: PostHogAdapters = {},
  campaign: Readonly<Record<string, string>> = {},
  load: DeferredLoadAdapters = {},
): ((event: EventName) => void) | undefined {
  if (config.provider !== 'posthog') return undefined;

  if (registeredAdapter !== undefined) {
    return registeredAdapter.createPostHogEventSink(config, adapters, campaign);
  }

  const providerConfig: MeasurementProviderConfig = config.providerConfig;
  if (providerConfig.token.trim() === '' || providerConfig.apiHost.trim() === '') {
    signal(adapters, POSTHOG_REFUSAL.unconfigured);
    return undefined;
  }

  let held: EventName[] | null = [];
  let ready: ((event: EventName) => void) | undefined;

  const start = () => {
    let loading: Promise<PostHogAdapterModule>;
    try {
      loading = (load.loadAdapter ?? importAdapter)();
    } catch {
      held = null;
      return;
    }

    loading.then((adapter) => {
      try {
        ready = adapter.createPostHogEventSink(config, adapters, campaign);
      } catch {
        ready = undefined;
      }
      const replay = held ?? [];
      held = null;
      for (const event of replay) ready?.(event);
    }, () => {
      // An SDK that cannot be fetched (blocked, offline) leaves the journey untouched.
      held = null;
    });
  };

  try {
    (load.scheduleLoad ?? scheduleOnFirstInteraction)(start);
  } catch {
    start();
  }

  return (event: EventName) => {
    if (ready !== undefined) {
      ready(event);
    } else if (held !== null && held.length < DEFERRED_EVENT_LIMIT) {
      held.push(event);
    }
  };
}
