import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom does not implement IntersectionObserver, which the home page reveal hook
// subscribes to. A no-op observer keeps every section in the DOM for contract queries.
if (!('IntersectionObserver' in globalThis)) {
  class NoopIntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: readonly number[] = [];
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  globalThis.IntersectionObserver =
    NoopIntersectionObserver as unknown as typeof IntersectionObserver;
}

afterEach(() => {
  cleanup();
});
