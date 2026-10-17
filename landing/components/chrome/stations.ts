import { sections } from "@/lib/site";

export type Station = { id: string; label: string; num: string };

const pad = (n: number) => String(n).padStart(2, "0");

/** Every stop on the "you are here" rail: the page sections in order, then the footer terminus. */
export const stations: Station[] = [
  ...sections.map((s, i) => ({ id: s.id as string, label: s.label as string, num: `§${pad(i + 1)}` })),
  { id: "footer", label: "Terminus", num: `§${pad(sections.length + 1)}` },
];

/** Sections that get a link in the desktop nav. */
export const navIds = ["lines", "agent", "automations", "broadcasts", "inbox", "insights", "faq"];

/** The footer's short list: the sections people come back for. */
export const productIds = ["lines", "agent", "automations", "broadcasts", "inbox", "faq"];

export const stationById = Object.fromEntries(stations.map((s) => [s.id, s])) as Record<string, Station>;
