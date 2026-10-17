import type { FontPairing } from "./types";

// Light grotesque for headlines and body, Instrument Serif italic for *emphasis* words.
// Variables are declared by next/font in lib/fonts.ts; the first pairing is the default.
export const fontPairings: FontPairing[] = [
  {
    id: "inter",
    name: "Inter Light",
    display: "--font-inter",
    body: "--font-inter",
    mono: "--font-geist-mono",
    displayLabel: "Inter",
    bodyLabel: "Inter",
    displayItalic: false,
    displayTracking: "-0.045em",
    displayWeight: 300,
    kinetic: false,
    note: "Light Inter headlines with Instrument Serif italic emphasis.",
  },
  {
    id: "roboto",
    name: "Roboto Light",
    display: "--font-roboto",
    body: "--font-roboto",
    mono: "--font-roboto-mono",
    displayLabel: "Roboto",
    bodyLabel: "Roboto",
    displayItalic: false,
    displayTracking: "-0.04em",
    displayWeight: 300,
    kinetic: false,
    note: "Light Roboto headlines with Instrument Serif italic emphasis.",
  },
];

export const defaultFontId = fontPairings[0].id;
