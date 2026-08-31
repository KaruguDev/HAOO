import { describe, expect, it } from 'vitest';
import { RESERVED_EMAIL_LABELS } from '../components/qualify-form.logic';
import {
  CONTACT_CHANNEL_OPTIONS,
  HAOO_PRODUCT,
  KENYAN_COUNTY_OPTIONS,
  PORTFOLIO_BAND_OPTIONS,
  QUALIFY_ENDPOINT_FALLBACK,
  resolveQualifyEndpoint,
  ROLE_OPTIONS,
  TIMEFRAME_OPTIONS,
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

    // Uniqueness against each other is not enough: a label colliding with a provider
    // option or with the derived source note would overwrite it, and the header-shaped
    // options would carry a visitor-supplied value.
    for (const field of qualify.fields) {
      expect(RESERVED_EMAIL_LABELS.has(field.emailLabel), field.emailLabel).toBe(false);
    }
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

  /**
   * LEAD-02 closed-list contract.
   *
   * Every expectation below is a literal written in this file. Deriving it from the
   * shipped constant would prove only that an array equals itself; a literal is what
   * makes a silently edited county name fail the build.
   *
   * The four contested names are additionally asserted by codepoint. `Taita-Taveta`,
   * `Murang'a` and the banded ranges carry characters that a well-meaning editor,
   * autoformatter or copy-paste through a plain-text tool will normalise without
   * comment, and the corrupted value would then travel to a real inbox and, from
   * Phase 3, into the engagement summary. The escapes below cannot be normalised.
   */
  it('county', () => {
    const EXPECTED_COUNTY_LABELS = [
      'Mombasa',
      'Kwale',
      'Kilifi',
      'Tana River',
      'Lamu',
      'Taita–Taveta',
      'Garissa',
      'Wajir',
      'Mandera',
      'Marsabit',
      'Isiolo',
      'Meru',
      'Tharaka-Nithi',
      'Embu',
      'Kitui',
      'Machakos',
      'Makueni',
      'Nyandarua',
      'Nyeri',
      'Kirinyaga',
      'Murang’a',
      'Kiambu',
      'Turkana',
      'West Pokot',
      'Samburu',
      'Trans-Nzoia',
      'Uasin Gishu',
      'Elgeyo-Marakwet',
      'Nandi',
      'Baringo',
      'Laikipia',
      'Nakuru',
      'Narok',
      'Kajiado',
      'Kericho',
      'Bomet',
      'Kakamega',
      'Vihiga',
      'Bungoma',
      'Busia',
      'Siaya',
      'Kisumu',
      'Homa Bay',
      'Migori',
      'Kisii',
      'Nyamira',
      'Nairobi',
      'Outside Kenya',
    ];

    const county = qualify.fields.find((field) => field.name === 'county');

    expect(county, 'the county field must ship in qualify.fields').toBeDefined();

    const options = county?.options ?? [];
    const labels = options.map((option) => option.label);

    expect(KENYAN_COUNTY_OPTIONS).toBe(county?.options);
    expect(options).toHaveLength(48);
    expect(labels).toEqual(EXPECTED_COUNTY_LABELS);

    // The 47 First Schedule counties come first, in code order 1-47, and the single
    // non-Kenyan bucket comes last — never sorted alphabetically into the middle.
    expect(labels[0]).toBe('Mombasa');
    expect(labels[46]).toBe('Nairobi');
    expect(labels[47]).toBe('Outside Kenya');

    // `value` carries the human string, so the delivered email needs no lookup table.
    for (const option of options) {
      expect(option.value, option.label).toBe(option.label);
      expect(option.label.trim(), option.label).toBe(option.label);
      expect(option.label, 'no county label may be blank').not.toBe('');
    }

    expect(new Set(labels).size).toBe(labels.length);

    // --- Codepoint assertions on the four contested names (task 1, approved) --------
    expect(labels[5].codePointAt(5), 'Taita-Taveta must carry U+2013').toBe(0x2013);
    expect(labels[12].codePointAt(7), 'Tharaka-Nithi must carry U+002D').toBe(0x002d);
    expect(labels[20].codePointAt(6), "Murang'a must carry U+2019").toBe(0x2019);
    expect(labels[25].codePointAt(5), 'Trans-Nzoia must carry U+002D').toBe(0x002d);
    expect(labels[27].codePointAt(6), 'Elgeyo-Marakwet must carry U+002D').toBe(0x002d);

    // The transcriptions seen in the wild that this list deliberately rejects.
    expect(labels).not.toContain('Taita-Taveta');
    expect(labels).not.toContain('Taita Taveta');
    expect(labels).not.toContain('Tharaka Nithi');
    expect(labels).not.toContain('Elgeyo/Marakwet');
    // The straight apostrophe U+0027 form, explicitly rejected at task 1.
    expect(labels).not.toContain('Murang\u0027a');
  });

  it('option lists', () => {
    expect(CONTACT_CHANNEL_OPTIONS.map((option) => option.label)).toEqual([
      'WhatsApp',
      'Phone call',
      'Email',
    ]);

    expect(ROLE_OPTIONS.map((option) => option.label)).toEqual([
      'Landlord',
      'Property manager',
      'Agency',
      'Organization',
      'Other',
    ]);

    expect(PORTFOLIO_BAND_OPTIONS.map((option) => option.label)).toEqual([
      '1–5 units',
      '6–20 units',
      '21–50 units',
      '51–200 units',
      '200+ units',
    ]);

    expect(TIMEFRAME_OPTIONS.map((option) => option.label)).toEqual([
      'Ready now',
      'In 1–3 months',
      'In 3+ months',
      'Just exploring',
    ]);

    // Banded ranges use an en dash; the open-ended band and the three dashless
    // timeframes must not acquire one by autoformatting.
    expect(PORTFOLIO_BAND_OPTIONS[0].label.codePointAt(1)).toBe(0x2013);
    expect(PORTFOLIO_BAND_OPTIONS[1].label.codePointAt(1)).toBe(0x2013);
    expect(PORTFOLIO_BAND_OPTIONS[2].label.codePointAt(2)).toBe(0x2013);
    expect(PORTFOLIO_BAND_OPTIONS[3].label.codePointAt(2)).toBe(0x2013);
    expect(PORTFOLIO_BAND_OPTIONS[4].label).not.toContain('–');
    expect(TIMEFRAME_OPTIONS[1].label.codePointAt(4)).toBe(0x2013);
    for (const index of [0, 2, 3]) {
      expect(TIMEFRAME_OPTIONS[index].label).not.toContain('–');
    }

    for (const list of [
      CONTACT_CHANNEL_OPTIONS,
      ROLE_OPTIONS,
      PORTFOLIO_BAND_OPTIONS,
      TIMEFRAME_OPTIONS,
      KENYAN_COUNTY_OPTIONS,
    ]) {
      const labels = list.map((option) => option.label);

      expect(new Set(labels).size).toBe(labels.length);
      for (const option of list) {
        expect(option.value, option.label).toBe(option.label);
        expect(option.label.trim(), option.label).toBe(option.label);
      }
    }
  });

  /**
   * The ten-field locked shape. `emailLabel` order is LEAD-04's readable-labels
   * contract: it is the order and the wording the HAOO team reads in the delivered
   * email, so it is pinned literally rather than derived.
   */
  it('fields', () => {
    expect(qualify.fields.map((field) => field.name)).toEqual([
      'name',
      'email',
      'preferredChannel',
      'phone',
      'role',
      'organization',
      'portfolioBand',
      'county',
      'timeframe',
      'message',
    ]);

    expect(qualify.fields.map((field) => field.emailLabel)).toEqual([
      'Full name',
      'Email address',
      'Preferred contact channel',
      'Phone number',
      'Role',
      'Organization',
      'Portfolio size',
      'Location',
      'Onboarding timeframe',
      'Message',
    ]);

    expect(qualify.fields.map((field) => field.label)).toEqual([
      'Full name',
      'Email address',
      'How should we reach you?',
      'Phone number',
      'Your role',
      'Organization',
      'How many units do you manage?',
      'Where are your properties?',
      'When would you like to start?',
      'Anything else we should know?',
    ]);

    expect(qualify.fields.map((field) => field.control)).toEqual([
      'text',
      'email',
      'select',
      'tel',
      'select',
      'text',
      'select',
      'select',
      'select',
      'textarea',
    ]);

    // The preferred-channel select precedes phone so plan 04's conditional-required
    // flip lands on a field the visitor has not yet passed.
    expect(qualify.fields.findIndex((field) => field.name === 'preferredChannel'))
      .toBeLessThan(qualify.fields.findIndex((field) => field.name === 'phone'));

    // Exactly three optional fields, and email is not one of them: name plus email
    // alone must satisfy LEAD-01's usable contact method (D-13).
    expect(qualify.fields.filter((field) => !field.required).map((field) => field.name))
      .toEqual(['phone', 'organization', 'message']);
    expect(qualify.fields.filter((field) => field.required)).toHaveLength(7);

    // WCAG 1.3.5: person-describing fields carry a token, enquiry-describing fields
    // carry `off` — never an invented token and never a missing one.
    expect(qualify.fields.map((field) => field.autoComplete)).toEqual([
      'name',
      'email',
      'off',
      'tel',
      'off',
      'organization',
      'off',
      'address-level1',
      'off',
      'off',
    ]);

    expect(qualify.fields.map((field) => field.maxLength ?? null)).toEqual([
      80,
      254,
      null,
      30,
      null,
      120,
      null,
      null,
      null,
      1000,
    ]);

    const message = qualify.fields.find((field) => field.name === 'message');

    expect(message?.rows).toBe(4);
    expect(message?.maxLength).toBe(1000);

    for (const field of qualify.fields) {
      if (field.control === 'select') {
        expect((field.placeholderOption ?? '').trim(), field.name).not.toBe('');
        expect((field.options ?? []).length, field.name).toBeGreaterThan(0);
      }

      // D-21: the optional marker is derived at render time from computed
      // requiredness, never stored in copy, and no field carries an asterisk.
      expect(field.label, field.name).not.toContain('(optional)');
      expect(field.label, field.name).not.toContain('*');
      expect(field.requiredMessage.trim(), field.name).not.toBe('');
    }

    expect(qualify.fields.map((field) => field.placeholderOption ?? null)).toEqual([
      null,
      null,
      'Select a channel',
      null,
      'Select your role',
      null,
      'Select a range',
      'Select a county',
      'Select a timeframe',
      null,
    ]);

    // Every locked validation message, byte for byte.
    const messages = Object.fromEntries(
      qualify.fields.map((field) => [field.name, field.requiredMessage]),
    );

    expect(messages).toEqual({
      name: 'Enter your full name',
      email: 'Enter your email address',
      preferredChannel: 'Select how we should reach you',
      phone: 'Enter a phone number so we can reach you on the channel you chose',
      role: 'Select your role',
      organization: 'Enter your organization',
      portfolioBand: 'Select how many units you manage',
      county: 'Select where your properties are',
      timeframe: 'Select when you would like to start',
      message: 'Enter your message',
    });

    const email = qualify.fields.find((field) => field.name === 'email');
    const phone = qualify.fields.find((field) => field.name === 'phone');

    expect(email?.formatMessage)
      .toBe('Enter an email address in the format name@example.com');
    expect(phone?.formatMessage).toBe('Enter a phone number using digits, spaces, or +');
    expect(message?.lengthMessage).toBe('Shorten your message to 1000 characters or fewer');

    // The permissive phone format admits real Kenyan shapes and rejects letters. It is
    // configuration only at this stage; plan 04 wires it into the validator.
    const phonePattern = new RegExp(phone?.formatPattern ?? '');

    for (const accepted of ['+254 702 188 044', '0702188044', '(020) 123-4567']) {
      expect(phonePattern.test(accepted), accepted).toBe(true);
    }
    // Separator-only values carry zero digits, so they must not satisfy the format rule:
    // `phone` is escalated to required exactly when the visitor asks to be called back.
    for (const rejected of ['call me', 'ext. 12', '-', '()', '( )  -', '+-', '020 123']) {
      expect(phonePattern.test(rejected), rejected).toBe(false);
    }
  });

  it('groups', () => {
    expect(qualify.groups.map((group) => group.legend)).toEqual([
      'About you',
      'About your portfolio',
      'Getting started',
    ]);

    expect(qualify.groups.map((group) => group.fieldNames)).toEqual([
      ['name', 'email', 'preferredChannel', 'phone'],
      ['role', 'organization', 'portfolioBand', 'county'],
      ['timeframe', 'message'],
    ]);

    // Flattened membership is the DOM order, so the grouping cannot silently reorder
    // the form away from the order the email labels are written in.
    const flattened = qualify.groups.flatMap((group) => group.fieldNames);

    expect(flattened).toEqual(qualify.fields.map((field) => field.name));
    expect(new Set(flattened).size).toBe(flattened.length);
  });
});
