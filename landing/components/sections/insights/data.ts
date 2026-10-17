import type { PlatformId } from "@/lib/platforms";

/**
 * Demo workspace numbers for §07. Illustrative only, and shaped like the real
 * Insights page: a 7-day window labelled by weekday (Tue → Mon), counts per day,
 * all-channel message mix, contact languages and independent conversion counts.
 * No revenue, no funnel, no ranges beyond seven days (see facts.json).
 */

export const days = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"] as const;
export type Day = (typeof days)[number];

export const dayName: Record<Day, string> = {
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
  Mon: "Monday",
};

export const messagesByDay: readonly number[] = [820, 910, 1040, 1288, 760, 540, 990];
export const netContactsByDay: readonly number[] = [42, 38, 61, 74, 21, 8, 55];

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

export const totalMessages = sum(messagesByDay); // 6,348
export const totalNet = sum(netContactsByDay); // 299

/** Thousands separators without Intl, so server and browser render identical text (no ICU differences at hydration). */
export const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n))}`;

export type Stat = { label: string; value: string; hint: string; team?: boolean };

/** The four tiles across the top. "Live automations" is a Home metric, not Insights, so Net contacts takes its place. */
export const stats: Stat[] = [
  { label: "Active contacts", value: "12,840", hint: "Across every channel" },
  { label: "Messages", value: fmt(totalMessages), hint: "Busiest on Friday" },
  { label: "Net contacts", value: signed(totalNet), hint: "Last 7 days" },
  { label: "Open chats", value: "14", hint: "Waiting on a human", team: true },
];

export type ChannelRow = { id: PlatformId; label: string; value: number };

/**
 * Message mix by channel. The real chart counts each channel's messages (not a
 * 7-day window), so copy around it never says "this week". Email is Gmail.
 */
export const byChannel: ChannelRow[] = [
  { id: "whatsapp", label: "WhatsApp", value: 2494 },
  { id: "instagram", label: "Instagram", value: 2079 },
  { id: "messenger", label: "Messenger", value: 1088 },
  { id: "x", label: "X", value: 370 },
  { id: "threads", label: "Threads", value: 169 },
  { id: "gmail", label: "Email", value: 102 },
  { id: "linkedin", label: "LinkedIn", value: 46 },
];

/** Share of contacts by each contact's language field (no auto-detection). Ranked; "Other" always last. */
export const languages = [
  { label: "English", value: 58 },
  { label: "Spanish", value: 18 },
  { label: "Japanese", value: 8 },
  { label: "Italian", value: 6 },
  { label: "Other", value: 10 },
] as const;

/**
 * Independent counts read from contact fields (has an email, has a phone number, source is a
 * checkout). Not a funnel, and no revenue.
 */
export const conversions = [
  { label: "Email captured", value: 186 },
  { label: "Phone captured", value: 94 },
  { label: "Checkout started", value: 71 },
] as const;

export type PlatformTile = {
  id: PlatformId;
  name: string;
  metrics: [label: string, value: string][];
};

/** Only metrics the real per-platform tiles show (facts.json · Insights). */
export const platformTiles: PlatformTile[] = [
  {
    id: "instagram",
    name: "Instagram",
    metrics: [
      ["Reach", "48.2K"],
      ["Views", "131K"],
      ["Accounts engaged", "3,904"],
      ["Total interactions", "6,210"],
      ["Followers", "12.8K"],
    ],
  },
  {
    id: "facebook",
    name: "Facebook Page",
    metrics: [
      ["Post engagements", "2,140"],
      ["Page views", "912"],
      ["Page followers", "8,450"],
    ],
  },
  {
    id: "threads",
    name: "Threads",
    metrics: [
      ["Replies", "286"],
      ["Reposts", "64"],
      ["Link clicks", "118"],
      ["Followers", "3,120"],
    ],
  },
];

/** A 45° hairline hatch in ink: the house fill for secondary marks (prints like a Swiss annual report). */
export const hatch = {
  backgroundColor: "var(--k-surface)",
  backgroundImage:
    "repeating-linear-gradient(135deg, color-mix(in oklab, var(--k-ink) 34%, transparent) 0 1px, transparent 1px 5px)",
} as const;
