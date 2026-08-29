import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');

/**
 * WCAG 2.2 SC 1.4.11 (Non-text Contrast) requires a focus indicator to reach 3:1
 * against the surface it sits on. The comparison below is `ratio >= 3` on the raw
 * IEEE-754 double: no epsilon, no rounding before the comparison. Rounding happens
 * only when a ratio is printed into a failure message.
 */
export const MIN_FOCUS_CONTRAST = 3;

/**
 * Tailwind's `--tw-ring-offset-color` default. It applies whenever a focus utility
 * string declares an offset width (`ring-offset-2`) without an offset colour.
 */
export const DEFAULT_RING_OFFSET = '#ffffff';

/** Named Tailwind colours actually used by a Phase 1 focus utility string. */
export const RING_COLOR_TOKENS: Readonly<Record<string, string>> = {
  white: '#ffffff',
  'blue-700': '#1d4ed8',
};

/** Every Phase 1 product source that declares a focus indicator. */
export const FOCUS_SOURCES = [
  'src/pages/ProductPage.tsx',
  'src/components/ProductHeader.tsx',
  'src/components/OnboardingChoices.tsx',
  'src/components/BrochurePanel.tsx',
  'src/components/ProductsSection.tsx',
] as const;

/** Tailwind ring *width* keywords — these are not colours and carry no contrast. */
const RING_WIDTH_TOKENS = /^(?:0|1|2|4|8|inset)$/;

const RING_COLOR_UTILITY = /(?:focus|focus-visible):ring-(?!offset-)([^\s'"`]+)/g;
const RING_OFFSET_UTILITY = /(?:focus|focus-visible):ring-offset-([^\s'"`]+)/g;

const ARBITRARY_HEX_6 = /^\[#([0-9a-fA-F]{6})\]$/;
const ARBITRARY_HEX_3 = /^\[#([0-9a-fA-F]{3})\]$/;

export interface FocusPair {
  readonly file: string;
  readonly ringColor: string;
  readonly offsetColor: string;
  readonly raw: string;
}

/**
 * WCAG 2.x relative luminance, computed in doubles straight from the sRGB formula
 * with no intermediate rounding.
 */
export function srgbLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/.exec(hex.toLowerCase());
  if (!match) {
    throw new Error(`srgbLuminance: expected a six-digit hex colour, received "${hex}"`);
  }

  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(match[1].slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** WCAG contrast ratio `(lighter + 0.05) / (darker + 0.05)`, unrounded. */
export function contrastRatio(foreground: string, background: string): number {
  const a = srgbLuminance(foreground);
  const b = srgbLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The gate itself. Kept as a pure predicate so its boundary is directly assertable:
 * `ratio >= MIN_FOCUS_CONTRAST`, no epsilon, no pre-comparison rounding.
 */
export function meetsFocusContrast(ratio: number): boolean {
  return ratio >= MIN_FOCUS_CONTRAST;
}

/**
 * Resolve a Tailwind ring/offset colour token to a lowercase six-digit hex.
 * Throws — never returns a sentinel and never skips — on an unrecognized token, so a
 * colour the contract cannot measure fails loudly instead of passing silently.
 */
export function resolveRingColor(token: string): string {
  const hex6 = ARBITRARY_HEX_6.exec(token);
  if (hex6) {
    return `#${hex6[1].toLowerCase()}`;
  }

  const hex3 = ARBITRARY_HEX_3.exec(token);
  if (hex3) {
    const [r, g, b] = hex3[1].toLowerCase();
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  const named = RING_COLOR_TOKENS[token];
  if (named) {
    return named.toLowerCase();
  }

  throw new Error(
    `resolveRingColor: unrecognized ring colour token "${token}". Add it to RING_COLOR_TOKENS or use an arbitrary hex value — it must never be skipped.`,
  );
}

/**
 * Collect every string and template literal in a TypeScript/TSX source, handling
 * escapes and skipping comments. Focus utility strings are plain literals, so this
 * is sufficient to pair a ring colour with the offset declared beside it.
 */
function literals(source: string): string[] {
  const found: string[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (char === '/' && source[index + 1] === '/') {
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    if (char === '/' && source[index + 1] === '*') {
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index += 2;
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      const quote = char;
      let value = '';
      index += 1;

      while (index < source.length && source[index] !== quote) {
        if (source[index] === '\\') {
          value += source[index + 1] ?? '';
          index += 2;
          continue;
        }
        value += source[index];
        index += 1;
      }

      index += 1;
      found.push(value);
      continue;
    }

    index += 1;
  }

  return found;
}

/**
 * Extract every `(ring colour, offset colour)` pairing declared by a focus utility
 * string. An offset width with no colour falls back to Tailwind's default offset.
 */
export function extractFocusPairs(source: string, file: string): FocusPair[] {
  const pairs: FocusPair[] = [];

  for (const literal of literals(source)) {
    const ringTokens = Array.from(literal.matchAll(RING_COLOR_UTILITY))
      .map((match) => match[1])
      .filter((token) => !RING_WIDTH_TOKENS.test(token));

    if (ringTokens.length === 0) {
      continue;
    }

    const offsetToken = Array.from(literal.matchAll(RING_OFFSET_UTILITY))
      .map((match) => match[1])
      .find((token) => !/^\d+$/.test(token));

    const offsetColor = offsetToken ? resolveRingColor(offsetToken) : DEFAULT_RING_OFFSET;

    for (const ringToken of ringTokens) {
      pairs.push({
        file,
        ringColor: resolveRingColor(ringToken),
        offsetColor,
        raw: literal.trim(),
      });
    }
  }

  return pairs;
}

describe('Phase 1 focus indicator contrast contracts', () => {
  for (const file of FOCUS_SOURCES) {
    it(`keeps every focus indicator in ${file} visible against the surface it renders on`, () => {
      const source = readFileSync(resolve(ROOT, file), 'utf8');
      const pairs = extractFocusPairs(source, file);

      // A broken extractor must not pass a file vacuously.
      expect(pairs.length).toBeGreaterThan(0);

      for (const pair of pairs) {
        expect(
          pair.ringColor,
          `${file}: ring colour ${pair.ringColor} equals its offset colour, so no indicator is drawn — ${pair.raw}`,
        ).not.toBe(pair.offsetColor);

        const ratio = contrastRatio(pair.ringColor, pair.offsetColor);

        expect(
          meetsFocusContrast(ratio),
          `${file}: ring ${pair.ringColor} on offset ${pair.offsetColor} computes ${ratio.toFixed(2)}:1, below the required ${MIN_FOCUS_CONTRAST}:1 — ${pair.raw}`,
        ).toBe(true);
      }
    });
  }

  it('rejects the sub-3:1 accent-on-navy pairing and accepts the white-on-navy replacement', () => {
    expect(contrastRatio('#4054c6', '#18275f')).toBeCloseTo(2.21, 2);
    expect(meetsFocusContrast(contrastRatio('#4054c6', '#18275f'))).toBe(false);

    expect(contrastRatio('#ffffff', '#18275f')).toBeCloseTo(14.05, 2);
    expect(meetsFocusContrast(contrastRatio('#ffffff', '#18275f'))).toBe(true);
  });

  it('gates on the unrounded double at exactly 3:1, with no epsilon', () => {
    expect(meetsFocusContrast(2.99)).toBe(false);
    expect(meetsFocusContrast(2.999)).toBe(false);
    expect(meetsFocusContrast(3)).toBe(true);
    expect(meetsFocusContrast(3.01)).toBe(true);
  });

  it('fails on an unrecognized ring colour token instead of skipping it', () => {
    expect(() => resolveRingColor('emerald-500')).toThrow(/emerald-500/);
    expect(() => extractFocusPairs("const a = 'focus-visible:ring-2 focus-visible:ring-emerald-500';", 'synthetic.tsx'))
      .toThrow(/emerald-500/);
  });
});
