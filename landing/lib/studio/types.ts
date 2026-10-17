export const tokenKeys = [
  "bg",
  "bgAlt",
  "surface",
  "ink",
  "inkSoft",
  "line",
  "accent",
  "accentInk",
  "pop1",
  "pop2",
  "pop3",
] as const;

export type TokenKey = (typeof tokenKeys)[number];

export type PaletteFamily = "pastel" | "strong" | "neutral";

export type Palette = {
  id: string;
  name: string;
  mood: string;
  family: PaletteFamily;
  tokens: Record<TokenKey, string>;
};

export type FontPairing = {
  id: string;
  name: string;
  /** CSS variables declared by next/font for each role, e.g. "--font-fraunces". */
  display: string;
  body: string;
  mono: string;
  /** Human labels shown in the Studio and the colophon. */
  displayLabel: string;
  bodyLabel: string;
  /** Whether the display face ships a real italic; "display italic" emphasis falls back to highlighter without one. */
  displayItalic: boolean;
  /** Letter-spacing for display headings. */
  displayTracking: string;
  /** Weight for display headings (single-weight faces need 400). */
  displayWeight: number;
  /** Only the Archivo pairing has a width axis for kinetic type. */
  kinetic: boolean;
  note: string;
};

/**
 * Every enumerated Studio option; the first value is not necessarily the default
 * (see defaultLook). Key order is the position order in share links, so append
 * new keys at the end to keep old links valid.
 */
export const lookOptions = {
  emphasis: ["route", "serif", "display", "highlight", "plain"],
  radius: ["sharp", "soft", "round"],
  card: ["hairline", "paper", "sticker"],
  motion: ["still", "calm", "lively", "bold"],
  grain: ["off", "paper", "riso"],
  grid: ["off", "hero", "everywhere", "baseline"],
  icons: ["activity", "brand", "mono"],
  lineColor: ["ink", "brand", "tints"],
  lines: ["octilinear", "orthogonal", "cord"],
  rhythm: ["hairlines", "bands"],
  headline: ["a", "b", "c", "d"],
  script: ["rotate", "drop", "hours", "restock", "tour"],
  hero: ["branch", "interchange"],
} as const;

export type LookOptionKey = keyof typeof lookOptions;
export type LookOptionValue<K extends LookOptionKey> = (typeof lookOptions)[K][number];

export type Look = {
  palette: string;
  font: string;
  /** Optional hex that overrides the palette accent. */
  accent: string | null;
} & { [K in LookOptionKey]: LookOptionValue<K> };

export type MotionLevel = LookOptionValue<"motion">;
