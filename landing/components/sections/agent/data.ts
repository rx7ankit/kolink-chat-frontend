/**
 * §02 Autoreply agent: every line of demo copy lives here so the pinned stage,
 * the mobile sequence, the screen-reader transcript and the playground can
 * never disagree. Behaviour mirrors lib/capabilities.ts and the verified facts:
 * the agent runs only on Instagram and Messenger DMs, one mode per channel.
 */

import { catalog as storeCatalog, type PhotoId } from "@/lib/media";

export type Mode = "off" | "menu" | "agentic";
export type Speaker = "customer" | "agent" | "menu";
export type Track = "reply" | "attention";

export type Handoff = { asked: string; tried: string; why: string };

/** Rows of the demo catalog.csv (photo, name, ₹ price, note): answered straight from the file, no model in between. */
export const catalog = storeCatalog;
export type CatalogItem = (typeof storeCatalog)[number];

/** An Instagram post the customer shares into the DM before asking. */
export type SharedPostRef = { photo: PhotoId; caption: string };

export type MsgBeat = {
  kind: "msg";
  from: Speaker;
  lines: string[];
  /** Page annotation in the margin (≤ 6 words, only when non-obvious). Customers never see it. */
  note?: string;
  /** Menu-mode buttons under the bubble. */
  buttons?: string[];
  /** Catalog swipe cards under the bubble. */
  carousel?: boolean;
  /** Quick-reply taps (catalog paging only). */
  quick?: string[];
  /** A misspelt word to mark with a spell-check squiggle. */
  typo?: string;
  /** A post the customer shared into the thread, shown above their text. */
  shared?: SharedPostRef;
};

export type Beat =
  | MsgBeat
  | { kind: "typing" }
  | { kind: "toast" }
  | { kind: "confirm" }
  | { kind: "handoff"; handoff: Handoff };

export type AgentStep = {
  n: number;
  label: string;
  channel: "instagram" | "messenger";
  /** Mono caption under the step label. */
  caption: string;
  track: Track;
  /** The legend glyph that rides the points diagram for this step. */
  packet: "automation" | "agent" | "attention";
  /** Editorial headline for the stage narration; *starred* words get the emphasis face. */
  headline: string;
  /** What this step shows: one short line (≤ 12 words with the headline). */
  story: string;
  beats: Beat[];
};

export const handoffReply = "We’ll connect someone from our team to help you out.";
export const courtesyReply = "You’re welcome! If you need anything else, just ask.";
export const greetingLines = [
  "Hi, how can I help you?",
  "I can help with:",
  "• hours",
  "• products and prices",
  "• shipping and returns",
  "Ask about any of these.",
];

export const agentSteps: AgentStep[] = [
  {
    n: 1,
    headline: "Menu mode. *No AI at all.*",
    label: "Menu mode",
    channel: "messenger",
    caption: "Messenger · menu",
    track: "reply",
    packet: "automation",
    story: "Keywords map to buttons. Switching to Agentic asks first.",
    beats: [
      { kind: "msg", from: "menu", lines: ["Hi! How can we help?"], buttons: ["Hours", "Catalog", "Talk to human"] },
      { kind: "msg", from: "customer", lines: ["open today?"] },
      { kind: "msg", from: "menu", lines: ["We’re open 10am–7pm."], note: "keyword “open” → Hours" },
      { kind: "toast" },
      { kind: "confirm" },
    ],
  },
  {
    n: 2,
    headline: "A greeting. *Only real topics.*",
    label: "Greeting",
    channel: "instagram",
    caption: "Instagram · agentic",
    track: "reply",
    packet: "agent",
    story: "It offers just the topics your library covers.",
    beats: [
      { kind: "msg", from: "customer", lines: ["hii"] },
      { kind: "typing" },
      { kind: "msg", from: "agent", lines: greetingLines },
    ],
  },
  {
    n: 3,
    headline: "A typo. *Still the right answer.*",
    label: "Typo",
    channel: "instagram",
    caption: "Instagram · agentic",
    track: "reply",
    packet: "agent",
    story: "“timimgs” still finds your Hours.",
    beats: [
      { kind: "msg", from: "customer", lines: ["what are your timimgs?"], typo: "timimgs" },
      { kind: "typing" },
      {
        kind: "msg",
        from: "agent",
        lines: ["We reply 10am–7pm IST, Monday to Saturday. Our Bandra studio is open Mon–Sat, 10:00–19:00."],
        note: "from Hours + Locations",
      },
    ],
  },
  {
    n: 4,
    headline: "Products. *Straight from your CSV.*",
    label: "Catalog",
    channel: "instagram",
    caption: "Instagram · agentic",
    track: "reply",
    packet: "agent",
    story: "Catalog rows become swipe cards, photo and price included.",
    beats: [
      {
        kind: "msg",
        from: "customer",
        lines: ["show me your products"],
        shared: { photo: "linenDrop", caption: "The linen drop is here." },
      },
      { kind: "typing" },
      {
        kind: "msg",
        from: "agent",
        lines: ["Here is what is available."],
        carousel: true,
        quick: ["Next"],
        note: "catalog.csv · no model",
      },
    ],
  },
  {
    n: 5,
    headline: "Thanks. *One polite line.*",
    label: "Thanks",
    channel: "instagram",
    caption: "Instagram · agentic",
    track: "reply",
    packet: "agent",
    story: "Nothing looked up, nothing promised.",
    beats: [
      { kind: "msg", from: "customer", lines: ["thank you so much, you guys are the best!"] },
      { kind: "typing" },
      { kind: "msg", from: "agent", lines: [courtesyReply] },
    ],
  },
  {
    n: 6,
    headline: "A person, please. *Handed over.*",
    label: "Handoff",
    channel: "instagram",
    caption: "Instagram · handed to your team",
    track: "attention",
    packet: "attention",
    story: "Your team gets the thread with Asked, Tried, Why.",
    beats: [
      { kind: "msg", from: "customer", lines: ["can I talk to a real person?"] },
      { kind: "typing" },
      { kind: "msg", from: "agent", lines: [handoffReply], note: "skips the model" },
      { kind: "handoff", handoff: { asked: "can I talk to a real person?", tried: "—", why: "customer_asked" } },
    ],
  },
];

/** Beat indexes the stage reads to drive the controls outside the DM panel. */
export const MENU_TOAST_BEAT = 3;
export const MENU_CONFIRM_BEAT = 4;
export const HANDOFF_BEAT = 3;

const wordCount = (lines: string[]) => lines.join(" ").split(/\s+/).filter(Boolean).length;

/** How long a beat holds the stage (ms at pace 1) before the next one starts. */
export function holdFor(beat: Beat): number {
  switch (beat.kind) {
    case "typing":
      return 300;
    case "toast":
      return 1100;
    case "confirm":
      return 700;
    case "handoff":
      return 900;
    case "msg":
      return (
        (beat.from === "customer" ? 520 : 640) +
        wordCount(beat.lines) * 24 +
        (beat.carousel ? 720 : 0) +
        (beat.shared ? 420 : 0)
      );
  }
}

export const stepHolds: number[][] = agentSteps.map((s) => s.beats.map(holdFor));

export const houseRules = [
  "Never invents prices, stock or delivery dates.",
  "Hands off when it doesn’t know, or when asked.",
  "Pause or resume the bot on any thread.",
];

export const modeLabel: Record<Mode, string> = { off: "Off", menu: "Menu", agentic: "Agentic" };
export const modeStatus: Record<Mode, string> = {
  off: "Team only",
  menu: "Buttons + keywords · no AI",
  agentic: "Answers from knowledge",
};

/** Four asks, one per path: a typo, a policy, missing knowledge (hands off), a person. */
export const playgroundSuggestions = [
  "what are your timimgs?",
  "do you ship to Pune?",
  "do you do embroidery?",
  "talk to a human",
];

/** What the playground's demo library knows, as one line under its title. */
export const demoKnowledge = ["hours", "shipping", "returns", `${storeCatalog.length} products`];
