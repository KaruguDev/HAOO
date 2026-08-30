import type { ProductMeasurement } from '../products/types';

export type VisitBand = 'first' | 'returning' | 'frequent';
export type LastSeenBand = 'today' | 'this-week' | 'this-month' | 'earlier';

export interface EngagementContext {
  readonly version: number;
  readonly visitBand: VisitBand;
  readonly lastSeenBand: LastSeenBand;
  readonly flags: Readonly<Record<string, boolean>>;
  readonly visitOrdinal: 1 | 2 | 3 | 4;
  readonly lastSeenDay: string;
}

export interface MeasurementAdapters<EventName extends string> {
  readonly eventSink?: (event: EventName) => void;
  readonly now?: () => Date;
  readonly storage?: Storage;
  readonly location?: Pick<Location, 'href'>;
  readonly history?: Pick<History, 'replaceState' | 'state'>;
}

export interface Measurement<EventName extends string> {
  initialize(): void;
  track(event: EventName): boolean;
  readContext(): EngagementContext;
  readCampaign(): Readonly<Record<string, string>>;
  clearContext(): boolean;
}

const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;
const CAMPAIGN_VALUE = /^[a-z0-9-]+$/;
const MAX_CAMPAIGN_LENGTH = 32;
const EXPIRY_DAYS = 180;
const DAY_MILLISECONDS = 86_400_000;

function dayValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayEpoch(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const epoch = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(epoch) && dayValue(new Date(epoch)) === value ? epoch : null;
}

function daysSince(value: string, nowDay: string): number | null {
  const previous = dayEpoch(value);
  const current = dayEpoch(nowDay);

  if (previous === null || current === null || previous > current) {
    return null;
  }

  return Math.floor((current - previous) / DAY_MILLISECONDS);
}

function lastSeenBand(days: number): LastSeenBand {
  if (days === 0) return 'today';
  if (days <= 7) return 'this-week';
  if (days <= 30) return 'this-month';
  return 'earlier';
}

function visitBand(ordinal: number): VisitBand {
  if (ordinal >= 4) return 'frequent';
  if (ordinal >= 2) return 'returning';
  return 'first';
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length
    && actual.every((key, index) => key === [...expected].sort()[index]);
}

function parseContext(
  raw: string | null,
  config: ProductMeasurement<string>,
  today: string,
): EngagementContext | null {
  if (raw === null) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;

    const record = value as Record<string, unknown>;
    if (!exactKeys(record, [
      'version',
      'visitBand',
      'lastSeenBand',
      'flags',
      'visitOrdinal',
      'lastSeenDay',
    ])) return null;
    if (record.version !== config.schemaVersion) return null;
    if (!['first', 'returning', 'frequent'].includes(String(record.visitBand))) return null;
    if (!['today', 'this-week', 'this-month', 'earlier']
      .includes(String(record.lastSeenBand))) return null;
    if (![1, 2, 3, 4].includes(Number(record.visitOrdinal))) return null;
    if (typeof record.lastSeenDay !== 'string') return null;

    const age = daysSince(record.lastSeenDay, today);
    if (age === null || age > EXPIRY_DAYS) return null;

    if (typeof record.flags !== 'object' || record.flags === null
      || Array.isArray(record.flags)) return null;
    const flags = record.flags as Record<string, unknown>;
    if (!exactKeys(flags, config.interactionFlags)
      || Object.values(flags).some((flag) => typeof flag !== 'boolean')) return null;

    const ordinal = record.visitOrdinal as EngagementContext['visitOrdinal'];
    if (record.visitBand !== visitBand(ordinal)) return null;

    return {
      version: config.schemaVersion,
      visitBand: record.visitBand as VisitBand,
      lastSeenBand: record.lastSeenBand as LastSeenBand,
      flags: flags as Record<string, boolean>,
      visitOrdinal: ordinal,
      lastSeenDay: record.lastSeenDay,
    };
  } catch {
    return null;
  }
}

function freshContext(
  config: ProductMeasurement<string>,
  today: string,
): EngagementContext {
  return {
    version: config.schemaVersion,
    visitBand: 'first',
    lastSeenBand: 'today',
    flags: Object.fromEntries(config.interactionFlags.map((flag) => [flag, false])),
    visitOrdinal: 1,
    lastSeenDay: today,
  };
}

function nextContext(previous: EngagementContext, today: string): EngagementContext {
  const ordinal = Math.min(4, previous.visitOrdinal + 1) as EngagementContext['visitOrdinal'];
  const elapsed = daysSince(previous.lastSeenDay, today) ?? 0;

  return {
    ...previous,
    visitBand: visitBand(ordinal),
    lastSeenBand: lastSeenBand(elapsed),
    visitOrdinal: ordinal,
    lastSeenDay: today,
  };
}

function browserStorage<EventName extends string>(
  adapters: MeasurementAdapters<EventName>,
): Storage | null {
  try {
    return adapters.storage ?? window.localStorage;
  } catch {
    return null;
  }
}

function readCampaign<EventName extends string>(
  adapters: MeasurementAdapters<EventName>,
): Readonly<Record<string, string>> {
  try {
    const location = adapters.location ?? window.location;
    const url = new URL(location.href);
    const campaign: Record<string, string> = {};

    for (const key of CAMPAIGN_KEYS) {
      const values = url.searchParams.getAll(key);
      if (values.length !== 1) continue;

      const candidate = values[0].trim().toLowerCase();
      if (candidate !== '' && CAMPAIGN_VALUE.test(candidate)) {
        campaign[key] = candidate.slice(0, MAX_CAMPAIGN_LENGTH);
      }
    }

    let changed = false;
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_')) {
        url.searchParams.delete(key);
        changed = true;
      }
    }

    if (changed) {
      try {
        const history = adapters.history ?? window.history;
        history.replaceState(
          history.state,
          '',
          `${url.pathname}${url.search}${url.hash}`,
        );
      } catch {
        // Address-bar cleanup is best effort and never changes journey behavior.
      }
    }

    return campaign;
  } catch {
    return {};
  }
}

export function createMeasurement<const EventName extends string>(
  config: ProductMeasurement<EventName>,
  adapters: MeasurementAdapters<EventName> = {},
): Measurement<EventName> {
  const allowedEvents = new Set<string>(config.events);
  let context: EngagementContext | null = null;
  let campaign: Readonly<Record<string, string>> = {};
  let initialized = false;
  let storage = browserStorage(adapters);

  function writeContext(next: EngagementContext) {
    context = next;
    if (storage === null) return;

    try {
      storage.setItem(config.storageKey, JSON.stringify(next));
    } catch {
      storage = null;
    }
  }

  function initialize() {
    if (initialized) return;
    initialized = true;

    const today = dayValue((adapters.now ?? (() => new Date()))());
    let previous: EngagementContext | null = null;

    if (storage !== null) {
      try {
        previous = parseContext(storage.getItem(config.storageKey), config, today);
        if (previous === null) storage.removeItem(config.storageKey);
      } catch {
        storage = null;
      }
    }

    writeContext(previous === null ? freshContext(config, today) : nextContext(previous, today));
    campaign = readCampaign(adapters);
  }

  function track(event: EventName): boolean {
    if (typeof event !== 'string' || !allowedEvents.has(event)) return false;

    try {
      adapters.eventSink?.(event);
    } catch {
      // Provider delivery is deliberately isolated from every visitor action.
    }
    return true;
  }

  function currentContext(): EngagementContext {
    if (!initialized) initialize();
    return context ?? freshContext(config, dayValue((adapters.now ?? (() => new Date()))()));
  }

  function clearContext(): boolean {
    const next = freshContext(config, dayValue((adapters.now ?? (() => new Date()))()));
    context = next;
    if (storage === null) return false;

    try {
      storage.removeItem(config.storageKey);
      return true;
    } catch {
      storage = null;
      return false;
    }
  }

  return {
    initialize,
    track,
    readContext: currentContext,
    readCampaign: () => campaign,
    clearContext,
  };
}
