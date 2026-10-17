import type { Palette } from "./types";

// One palette, chosen by the founder: pistachio pastels on near-white paper,
// soft black headings and grey secondary text. Checked: ink/bg 14.1, inkSoft/bg 4.9,
// inkSoft/bgAlt 4.6, accentInk/accent 9.9.
export const palettes: Palette[] = [
  {
    id: "pistachio",
    name: "Pistachio",
    mood: "Pistachio and apricot pastels on near-white paper, soft black headings, grey body and a deep bottle-green pill CTA.",
    family: "pastel",
    tokens: {
      bg: "#FCFDF9",
      bgAlt: "#F1F6EA",
      surface: "#FFFFFF",
      ink: "#262B26",
      inkSoft: "#6B7168",
      line: "#E3E9DA",
      accent: "#24452F",
      accentInk: "#F3F9E9",
      pop1: "#F1A27E",
      pop2: "#9CCB7A",
      pop3: "#AEBCE8",
    },
  },
];

export const defaultPaletteId = "pistachio";
