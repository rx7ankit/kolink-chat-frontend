const HEX = /^#([0-9a-f]{6})$/i;

export function isHex(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Pick near-black or white text for an arbitrary accent. */
export function inkFor(hex: string, dark = "#111111", light = "#FFFFFF") {
  return contrast(hex, dark) >= contrast(hex, light) ? dark : light;
}

function toRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Linear sRGB mix; t = share of `b`. */
export function mixHex(a: string, b: string, t: number) {
  const [x, y] = [toRgb(a), toRgb(b)];
  return `#${x
    .map((c, i) => Math.round(c + (y[i] - c) * t).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

/** The least-darkened mix of `color` toward `ink` that reaches `min` contrast on `bg`. */
export function ensureContrast(color: string, bg: string, ink: string, min: number) {
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const c = mixHex(color, ink, t);
    if (contrast(c, bg) >= min) return c;
  }
  return ink;
}

/** Accent safe for text on `bg` (4.5:1). */
export function accentTextFor(accent: string, bg: string, ink: string) {
  return ensureContrast(accent, bg, ink, 4.5);
}

/**
 * Tokens derived from a palette so components never have to judge contrast:
 * - lineStrong: borders of inputs and controls (≥3:1, WCAG 1.4.11)
 * - popNDeep: thin marks and rings in the semantic colors (≥3:1); pops themselves are fills only
 * - accentEdge: an ink outline for accent buttons that would vanish into the page (<3:1)
 */
export function derivedTokens(t: { bg: string; bgAlt: string; surface: string; ink: string; accent: string; pop1: string; pop2: string; pop3: string }) {
  let lineStrong = mixHex(t.bg, t.ink, 0.55);
  for (let k = 0.6; k <= 1 && [t.bg, t.bgAlt, t.surface].some((b) => contrast(lineStrong, b) < 3); k += 0.05) {
    lineStrong = mixHex(t.bg, t.ink, k);
  }
  return {
    accentText: accentTextFor(t.accent, t.bg, t.ink),
    accentEdge: contrast(t.accent, t.bg) < 3 ? t.ink : "transparent",
    lineStrong,
    pop1Deep: ensureContrast(t.pop1, t.bg, t.ink, 3),
    pop2Deep: ensureContrast(t.pop2, t.bg, t.ink, 3),
    pop3Deep: ensureContrast(t.pop3, t.bg, t.ink, 3),
  };
}
