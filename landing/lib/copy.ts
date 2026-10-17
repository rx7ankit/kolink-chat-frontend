import type { LookOptionValue } from "./studio/types";

/**
 * Headline options the Studio can switch between. Each entry is the hero's visual
 * lines; wrap words in *asterisks* to mark emphasis (rendered with the Studio
 * "Emphasis words" style).
 */
export const headlines: Record<LookOptionValue<"headline">, { label: string; lines: string[] }> = {
  a: { label: "Post once. Catch every reply.", lines: ["Post once.", "Catch *every*", "*reply.*"] },
  b: { label: "Every conversation. One interchange.", lines: ["Every conversation.", "*One interchange.*"] },
  c: { label: "All your conversations. One calm inbox.", lines: ["All your conversations.", "*One calm inbox.*"] },
  d: { label: "Chat marketing, without the tab chaos.", lines: ["Chat marketing,", "*without the tab chaos.*"] },
};

export const scriptLabels: Record<LookOptionValue<"script">, string> = {
  rotate: "Rotate all",
  drop: "Drop day",
  hours: "Weekend hours",
  restock: "Restock",
  tour: "Shop tour",
};

/** Splits "Catch *every* reply" into text and emphasis segments. */
export function parseEmphasis(text: string): { text: string; em: boolean }[] {
  return text
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part) => (part.startsWith("*") ? { text: part.slice(1, -1), em: true } : { text: part, em: false }));
}

export function plainText(text: string) {
  return text.replace(/\*/g, "");
}
