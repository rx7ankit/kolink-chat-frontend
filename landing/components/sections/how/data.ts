import type { PhotoId } from "@/lib/media";
import type { PlatformId } from "@/lib/platforms";

export type StopId = "connect" | "teach" | "switches" | "run";

export const how = {
  eyebrow: "§09 · HOW IT WORKS",
  lines: ["Four stops from sign-up", "to *running.*"],
};

export const stops: { id: StopId; n: string; title: string; label: string; body: string; summary: string }[] = [
  {
    id: "connect",
    n: "01",
    title: "Connect your lines",
    label: "Connect",
    body: "One Facebook Login covers your Page, Messenger and Instagram. The other five sign in on their own.",
    summary: "All eight channels connect; one Facebook Login covers three of them.",
  },
  {
    id: "teach",
    n: "02",
    title: "Teach the agent",
    label: "Teach",
    body: "Answer seven questions, paste a help link and drop in a catalog CSV.",
    summary: "Six sources fill the knowledge library, including a help link and a catalog.",
  },
  {
    id: "switches",
    n: "03",
    title: "Set the switches",
    label: "Switches",
    body: "Pick Off, Menu or Agentic for Instagram and Messenger. Add trigger words to your best posts.",
    summary: "Instagram is set to Agentic, Messenger to Menu, and a Reel gets five trigger words.",
  },
  {
    id: "run",
    n: "04",
    title: "Run the interchange",
    label: "Run",
    body: "Publish with Broadcasts, work the inbox with your team and read Insights.",
    summary: "A demo board: a post to five networks, a comment DM, an agent reply, a hand-off and a team chat.",
  },
];

/* ---------- Stop 01 · channels, grouped by how they connect ---------- */

export const connectGroups: { label: string; platforms: { id: PlatformId; name: string }[] }[] = [
  {
    label: "One Facebook Login",
    platforms: [
      { id: "instagram", name: "Instagram" },
      { id: "facebook", name: "Facebook Page" },
      { id: "messenger", name: "Messenger" },
    ],
  },
  { label: "Continue with Meta", platforms: [{ id: "whatsapp", name: "WhatsApp" }] },
  {
    label: "Own sign-in",
    platforms: [
      { id: "threads", name: "Threads" },
      { id: "x", name: "X" },
      { id: "linkedin", name: "LinkedIn" },
      { id: "gmail", name: "Gmail" },
    ],
  },
];

/* ---------- Stop 02 · knowledge library cards ---------- */

export const libraryCards: { kind: string; title: string; meta?: string; pending?: boolean }[] = [
  { kind: "Profile", title: "Business profile" },
  { kind: "Policy", title: "Hours, shipping, and policies" },
  { kind: "URL", title: "Help page", meta: "One page", pending: true },
  { kind: "Catalog", title: "Catalog", meta: "CSV · 24 rows" },
  { kind: "FAQ", title: "Typical questions" },
  { kind: "Article", title: "When to hand off" },
];

/* ---------- Stop 03 · switches + trigger words ---------- */

export const modes = ["Off", "Menu", "Agentic"] as const;
export type Mode = (typeof modes)[number];

export const switchRows: { id: PlatformId; name: string; to: Mode }[] = [
  { id: "instagram", name: "Instagram", to: "Agentic" },
  { id: "messenger", name: "Messenger", to: "Menu" },
];

/** Critique-corrected: five distinct trigger words (Keyword → DM needs at least five). */
export const keywords = ["link", "early", "access", "send", "🔗"];

/* ---------- Stop 04 · departures board + sparkline ---------- */

export type BoardRow = {
  time: string;
  handler: "post" | "automation" | "agent" | "attention" | "team";
  platforms: PlatformId[];
  what: string;
  from: string;
  to: string;
  /** Thumbnail of the post the row is about: a feed photo, or the "Linen drop" Reel. */
  media?: { photo: PhotoId } | { reel: true };
};

export const boardRows: BoardRow[] = [
  {
    time: "09:00",
    handler: "post",
    platforms: ["instagram", "facebook", "threads", "x", "linkedin"],
    what: "Broadcast · “Linen restock”",
    from: "SCHEDULED",
    to: "PUBLISHED",
    media: { photo: "linenDrop" },
  },
  {
    time: "09:04",
    handler: "automation",
    platforms: ["instagram"],
    what: "Comment “link” on the Reel",
    from: "ARRIVING",
    to: "DM SENT",
    media: { reel: true },
  },
  { time: "09:07", handler: "agent", platforms: ["messenger"], what: "“Do you ship to Pune?”", from: "ARRIVING", to: "ANSWERED" },
  { time: "09:12", handler: "attention", platforms: ["instagram"], what: "“Can I get a refund?”", from: "ARRIVING", to: "HANDED OFF" },
  { time: "09:15", handler: "team", platforms: ["whatsapp"], what: "“Is the linen pre-washed?”", from: "ARRIVING", to: "TO TEAM" },
];

/** Demo workspace · illustrative numbers (same series as §07 Insights). */
export const messagesSeries: { day: string; value: number }[] = [
  { day: "Tue", value: 820 },
  { day: "Wed", value: 910 },
  { day: "Thu", value: 1040 },
  { day: "Fri", value: 1288 },
  { day: "Sat", value: 760 },
  { day: "Sun", value: 540 },
  { day: "Mon", value: 990 },
];
