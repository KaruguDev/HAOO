import { createRef, useEffect, useRef, useState, type RefObject } from 'react';
import type { ProductReachSection } from '../products/types';

/**
 * Shrinks the observed viewport by its bottom quarter. Combined with a threshold of 0, a
 * section counts once any part of it is inside the top three quarters of the viewport.
 *
 * - A heading edge peeking over the bottom fold on load, or during a fast fling, does not
 *   count, because it never enters the top three quarters.
 * - A section taller than the viewport, such as the qualification form on a phone, still
 *   counts. A ratio threshold such as 0.5 could never guarantee that, because a section
 *   taller than twice the viewport can never be half visible.
 */
export const SECTION_REACH_ROOT_MARGIN = '0px 0px -25% 0px';

/** The observer options, written once so the tests can recognise the reach observer. */
const SECTION_REACH_OPTIONS: IntersectionObserverInit = {
  rootMargin: SECTION_REACH_ROOT_MARGIN,
  threshold: 0,
};

/** Every reach section, in page order. */
const REACH_SECTIONS: readonly ProductReachSection[] = [
  'benefits',
  'capabilities',
  'brochure',
  'qualify',
];

export type SectionReachRefs = Readonly<Record<ProductReachSection, RefObject<HTMLElement>>>;

type ReachTrack = (event: string) => boolean;

/**
 * The page-load record of which sections have already been counted. It is tied to the
 * `track` identity it was written for: a product change mints a new measurement, and so
 * a new `track`, and must start a fresh page-load record.
 */
interface ReachRecord {
  readonly track: ReachTrack;
  readonly reached: Set<ProductReachSection>;
}

function createSectionRefs(): SectionReachRefs {
  return {
    benefits: createRef<HTMLElement>(),
    capabilities: createRef<HTMLElement>(),
    brochure: createRef<HTMLElement>(),
    qualify: createRef<HTMLElement>(),
  };
}

/**
 * Constructing the observer is the step most likely to fail in an unusual browser. An
 * exception escaping a mount effect would unmount the whole product page, so a failure
 * here falls back to recording no reach signal at all.
 */
function createReachObserver(callback: IntersectionObserverCallback): IntersectionObserver | null {
  try {
    return new IntersectionObserver(callback, SECTION_REACH_OPTIONS);
  } catch {
    return null;
  }
}

function observeAll(observer: IntersectionObserver, targets: Iterable<Element>): void {
  try {
    for (const target of targets) {
      observer.observe(target);
    }
  } catch {
    // A section that cannot be observed records nothing; the page itself is unaffected.
  }
}

/**
 * Counts each of the four reach sections at most once per page load, at the moment an
 * IntersectionObserver reports it inside the top three quarters of the viewport. The
 * returned refs are stable and belong on the four section elements.
 *
 * Without IntersectionObserver, or when its constructor throws, the page renders and
 * records no reach event.
 */
export function useSectionReach(
  events: Readonly<Record<ProductReachSection, string>>,
  track: ReachTrack,
): SectionReachRefs {
  const [refs] = useState(createSectionRefs);
  const record = useRef<ReachRecord>({ track, reached: new Set() });

  useEffect(() => {
    // A StrictMode re-run keeps the same `track`, so it keeps the same record.
    if (record.current.track !== track) {
      record.current = { track, reached: new Set() };
    }

    if (typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const { reached } = record.current;
    const pending = new Map<Element, ProductReachSection>();

    for (const section of REACH_SECTIONS) {
      const element = refs[section].current;

      if (element !== null && !reached.has(section)) {
        pending.set(element, section);
      }
    }

    if (pending.size === 0) {
      return undefined;
    }

    function recordEntry(entry: IntersectionObserverEntry, observer: IntersectionObserver) {
      if (!entry.isIntersecting || entry.intersectionRatio <= 0) {
        return;
      }

      const section = pending.get(entry.target);

      if (section === undefined) {
        return;
      }

      pending.delete(entry.target);
      observer.unobserve(entry.target);

      if (!reached.has(section)) {
        reached.add(section);
        track(events[section]);
      }
    }

    const observer = createReachObserver((entries, entryObserver) => {
      for (const entry of entries) {
        recordEntry(entry, entryObserver);
      }

      if (pending.size === 0) {
        entryObserver.disconnect();
      }
    });

    if (observer === null) {
      return undefined;
    }

    observeAll(observer, pending.keys());

    return () => observer.disconnect();
  }, [events, track, refs]);

  return refs;
}
