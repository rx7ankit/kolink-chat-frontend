import { Geist_Mono, Instrument_Serif, Inter, Roboto, Roboto_Mono } from "next/font/google";

// Default pairing (Inter) and the emphasis serif are preloaded; Roboto only downloads
// when picked in the Design Studio. Delete it here and in font-pairings.ts once the
// final look is locked.

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument-serif", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto", display: "swap", preload: false });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono", display: "swap", preload: false });

export const fontVariables = [inter, geistMono, instrumentSerif, roboto, robotoMono].map((f) => f.variable).join(" ");
