import { describe, expect, it } from 'vitest';
import {
  HAOO_PRODUCT,
  QUALIFY_ENDPOINT_FALLBACK,
  resolveQualifyEndpoint,
} from '../products/haoo';

/**
 * D-04 / LEAD-04 endpoint contracts.
 *
 * `VITE_HAOO_FORM_ENDPOINT` is inlined by Vite into a world-readable bundle, so it is
 * obfuscation of the mailbox address and never a secret (02-RESEARCH.md Pitfall 6). It
 * is also untrusted build input: an unset GitHub Actions variable arrives as an empty
 * string, a typo arrives as a malformed URL, and either would otherwise become the
 * destination of a request carrying visitor personal data. The table below is the
 * permanent record of which configured values may reach `fetch()` and which may not.
 *
 * Security domain V9 (Communications) requires the resolved scheme to be exactly
 * `https:` so submitted personal data cannot travel in cleartext (threat T-02-01), and
 * threat T-02-02 requires every rejected input to select the non-empty readable
 * fallback rather than an empty or route-prefix destination.
 */

/** The single approved recipient a rejected configured value degrades to. */
const READABLE_FALLBACK = 'https://formsubmit.co/ajax/info@haoo.online';

/** A representative obfuscated FormSubmit target: one opaque segment, no address. */
const RANDOM_TOKEN_ENDPOINT = 'https://formsubmit.co/ajax/a1b2c3d4e5f60718293a4b5c6d7e8f90';

interface EndpointRow {
  readonly label: string;
  readonly configuredValue: string | undefined;
  readonly expectedResolution: string;
}

/**
 * Every row carries an explicit `expectedResolution` rather than a shared "rejected"
 * flag, so a future change that silently returns a *different* non-fallback string
 * cannot pass by satisfying a weaker predicate.
 */
const ENDPOINT_ROWS: readonly EndpointRow[] = [
  // --- Missing or blank build configuration -------------------------------------
  { label: 'undefined (variable never declared)', configuredValue: undefined, expectedResolution: READABLE_FALLBACK },
  { label: 'empty string (variable declared but unset)', configuredValue: '', expectedResolution: READABLE_FALLBACK },
  { label: 'whitespace-only string', configuredValue: '   ', expectedResolution: READABLE_FALLBACK },
  { label: 'tab and newline only', configuredValue: '\t\n ', expectedResolution: READABLE_FALLBACK },

  // --- Not a parseable absolute URL ---------------------------------------------
  { label: 'malformed URL', configuredValue: 'not a url', expectedResolution: READABLE_FALLBACK },
  { label: 'protocol-relative URL', configuredValue: '//formsubmit.co/ajax/info@haoo.online', expectedResolution: READABLE_FALLBACK },
  { label: 'relative path', configuredValue: '/ajax/info@haoo.online', expectedResolution: READABLE_FALLBACK },

  // --- Wrong scheme, host or route ----------------------------------------------
  { label: 'http scheme (cleartext PII — V9)', configuredValue: 'http://formsubmit.co/ajax/info@haoo.online', expectedResolution: READABLE_FALLBACK },
  { label: 'wrong host', configuredValue: 'https://evil.example/ajax/info@haoo.online', expectedResolution: READABLE_FALLBACK },
  { label: 'lookalike subdomain host', configuredValue: 'https://formsubmit.co.evil.example/ajax/info@haoo.online', expectedResolution: READABLE_FALLBACK },
  { label: 'wrong path prefix', configuredValue: 'https://formsubmit.co/api/info@haoo.online', expectedResolution: READABLE_FALLBACK },
  { label: 'site root', configuredValue: 'https://formsubmit.co/', expectedResolution: READABLE_FALLBACK },

  // --- A route prefix is not a recipient ----------------------------------------
  { label: 'bare /ajax route', configuredValue: 'https://formsubmit.co/ajax', expectedResolution: READABLE_FALLBACK },
  { label: 'trailing-slash /ajax/ route', configuredValue: 'https://formsubmit.co/ajax/', expectedResolution: READABLE_FALLBACK },
  { label: 'double-slash /ajax//', configuredValue: 'https://formsubmit.co/ajax//', expectedResolution: READABLE_FALLBACK },

  // --- Decoded-empty-like and encoded-slash targets -----------------------------
  { label: 'encoded space target (%20)', configuredValue: 'https://formsubmit.co/ajax/%20', expectedResolution: READABLE_FALLBACK },
  { label: 'encoded tab target (%09)', configuredValue: 'https://formsubmit.co/ajax/%09', expectedResolution: READABLE_FALLBACK },
  { label: 'encoded slash target (%2F)', configuredValue: 'https://formsubmit.co/ajax/%2F', expectedResolution: READABLE_FALLBACK },
  { label: 'encoded slash inside a target', configuredValue: 'https://formsubmit.co/ajax/info%2Fadmin', expectedResolution: READABLE_FALLBACK },
  { label: 'malformed percent encoding', configuredValue: 'https://formsubmit.co/ajax/%zz', expectedResolution: READABLE_FALLBACK },
  { label: 'truncated percent encoding', configuredValue: 'https://formsubmit.co/ajax/%E0%A4%A', expectedResolution: READABLE_FALLBACK },

  // --- Extra segments, credentials, query, fragment ------------------------------
  { label: 'extra path segment', configuredValue: 'https://formsubmit.co/ajax/info@haoo.online/extra', expectedResolution: READABLE_FALLBACK },
  { label: 'credentials in authority', configuredValue: 'https://user:pass@formsubmit.co/ajax/info@haoo.online', expectedResolution: READABLE_FALLBACK },
  { label: 'username-only credentials', configuredValue: 'https://user@formsubmit.co/ajax/info@haoo.online', expectedResolution: READABLE_FALLBACK },
  { label: 'query string', configuredValue: 'https://formsubmit.co/ajax/info@haoo.online?_cc=attacker@evil.example', expectedResolution: READABLE_FALLBACK },
  { label: 'fragment', configuredValue: 'https://formsubmit.co/ajax/info@haoo.online#frag', expectedResolution: READABLE_FALLBACK },

  // --- Accepted values ------------------------------------------------------------
  { label: 'exact readable address', configuredValue: READABLE_FALLBACK, expectedResolution: READABLE_FALLBACK },
  { label: 'whitespace-padded readable address', configuredValue: `  ${READABLE_FALLBACK}  `, expectedResolution: READABLE_FALLBACK },
  { label: 'whitespace-padded random token', configuredValue: `\n\t${RANDOM_TOKEN_ENDPOINT} `, expectedResolution: RANDOM_TOKEN_ENDPOINT },
  { label: 'random token', configuredValue: RANDOM_TOKEN_ENDPOINT, expectedResolution: RANDOM_TOKEN_ENDPOINT },
];

describe('HAOO qualification endpoint', () => {
  it('endpoint is an absolute https FormSubmit AJAX address with one usable target', () => {
    const endpoint = HAOO_PRODUCT.qualify.endpoint;

    expect(typeof endpoint).toBe('string');
    expect(endpoint.length).toBeGreaterThan(0);
    expect(endpoint.trim()).toBe(endpoint);

    let url: URL;
    expect(
      () => {
        url = new URL(endpoint);
      },
      `qualify.endpoint "${endpoint}" is not an absolute URL`,
    ).not.toThrow();

    url = new URL(endpoint);

    // V9 / T-02-01: personal data must never travel in cleartext.
    expect(url.protocol).toBe('https:');
    expect(url.host).toBe('formsubmit.co');
    expect(url.hostname).toBe('formsubmit.co');

    // No credentials, no query, no fragment may ride along with the submission.
    expect(url.username).toBe('');
    expect(url.password).toBe('');
    expect(url.search).toBe('');
    expect(url.hash).toBe('');

    // Exactly `/ajax/{target}` — not a prefix match, not a deeper route.
    const segments = url.pathname.split('/');
    expect(segments).toHaveLength(3);
    expect(segments[0]).toBe('');
    expect(segments[1]).toBe('ajax');

    let target = '';
    expect(
      () => {
        target = decodeURIComponent(segments[2]);
      },
      `qualify.endpoint target "${segments[2]}" is not decodable`,
    ).not.toThrow();

    target = decodeURIComponent(segments[2]);
    expect(target.trim()).not.toBe('');
    expect(target).not.toContain('/');
  });

  it.each(ENDPOINT_ROWS)(
    'endpoint resolution: $label',
    ({ configuredValue, expectedResolution }) => {
      expect(resolveQualifyEndpoint(configuredValue)).toBe(expectedResolution);
    },
  );

  it('endpoint fallback is itself a usable readable-address destination', () => {
    expect(QUALIFY_ENDPOINT_FALLBACK).toBe(READABLE_FALLBACK);
    expect(resolveQualifyEndpoint(QUALIFY_ENDPOINT_FALLBACK)).toBe(QUALIFY_ENDPOINT_FALLBACK);
  });

  it('endpoint table distinguishes the route prefix from a usable recipient', () => {
    // The guard that matters most: a `startsWith('/ajax/')` implementation would accept
    // every one of these, and each would post visitor data to a non-recipient.
    const routePrefixes = [
      'https://formsubmit.co/ajax',
      'https://formsubmit.co/ajax/',
      'https://formsubmit.co/ajax//',
      'https://formsubmit.co/ajax/%20',
      'https://formsubmit.co/ajax/info@haoo.online/extra',
    ];

    for (const value of routePrefixes) {
      expect(resolveQualifyEndpoint(value), value).toBe(QUALIFY_ENDPOINT_FALLBACK);
    }

    expect(resolveQualifyEndpoint(RANDOM_TOKEN_ENDPOINT)).toBe(RANDOM_TOKEN_ENDPOINT);
  });

  it('resolves every configured value to a non-empty https FormSubmit address', () => {
    for (const row of ENDPOINT_ROWS) {
      const resolved = resolveQualifyEndpoint(row.configuredValue);
      const url = new URL(resolved);

      expect(resolved, row.label).not.toBe('');
      expect(url.protocol, row.label).toBe('https:');
      expect(url.host, row.label).toBe('formsubmit.co');
    }
  });
});

describe('HAOO qualification product data', () => {
  const { qualify } = HAOO_PRODUCT;

  it('retains the approved subject and source identities', () => {
    expect(qualify.subject).toBe('New HAOO qualification enquiry — ZERO-PAPER HUB');
    expect(qualify.sourceNote).toBe(
      'Sent from the HAOO product page on ZERO-PAPER HUB (www.zero-paperhub.com/products/haoo/)',
    );
  });

  it('declares non-empty unique field names and email labels', () => {
    expect(qualify.fields.length).toBeGreaterThan(0);

    for (const field of qualify.fields) {
      expect(field.name.trim(), `field name "${field.name}"`).not.toBe('');
      expect(field.label.trim(), `field label for "${field.name}"`).not.toBe('');
      expect(field.emailLabel.trim(), `email label for "${field.name}"`).not.toBe('');
    }

    const names = qualify.fields.map((field) => field.name);
    expect(new Set(names).size).toBe(names.length);

    // Duplicate email labels would silently collapse two answers into one key in the
    // delivered email, so LEAD-04's "human-readable labels" contract requires
    // uniqueness on the label as well as on the name.
    const emailLabels = qualify.fields.map((field) => field.emailLabel);
    expect(new Set(emailLabels).size).toBe(emailLabels.length);
  });

  it('groups only field names that exist, with no field left unplaced or duplicated', () => {
    const names = new Set(qualify.fields.map((field) => field.name));
    const grouped: string[] = [];

    for (const group of qualify.groups) {
      expect(group.legend.trim()).not.toBe('');
      for (const name of group.fieldNames) {
        expect(names.has(name), `group "${group.legend}" references unknown field "${name}"`)
          .toBe(true);
        grouped.push(name);
      }
    }

    expect(new Set(grouped).size).toBe(grouped.length);
    expect(new Set(grouped)).toEqual(names);
  });
});
