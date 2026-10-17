import {
  agentChannels,
  campaignChannels,
  commentAutomations,
  lineOrder,
  matrix,
  publishTargets,
  stops,
} from "@/lib/capabilities";
import type { PlatformId } from "@/lib/platforms";

/**
 * Everything §01 draws is derived from lib/capabilities.ts, so the map, the
 * screen-reader summary and the matrix can never disagree with the product.
 */

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** Station pills: a pale pistachio fill with a hairline edge (map, vertical map and key). */
export const pillFill = "color-mix(in oklab, var(--k-bg-alt) 50%, var(--k-line))";
export const pillEdge = "color-mix(in oklab, var(--k-line) 78%, var(--k-ink-soft))";

const labelOf = Object.fromEntries(matrix.map((m) => [m.platform, m.label])) as Record<PlatformId, string>;

export type LineRow = {
  id: PlatformId;
  /** Page-wide line number (same as the hero board): lineOrder position. */
  num: string;
  label: string;
  /** Conversation-only lines never publish, so they are drawn dashed. */
  dashed: boolean;
};

/** Publish lines 01–05 first, then the conversation lines 06–08 (the hero board's order). */
export const lineRows: LineRow[] = lineOrder.map((id, i) => ({
  id,
  num: pad2(i + 1),
  label: labelOf[id],
  dashed: !publishTargets.includes(id),
}));

/** Row index where the conversation-only block starts (a divider sits above it). */
export const conversationStart = lineRows.findIndex((r) => r.dashed);

export const rowIndex = Object.fromEntries(lineRows.map((r, i) => [r.id, i])) as Record<PlatformId, number>;

/* ---------- Footnotes (shared by the map and the matrix) ---------- */

/** Only the two caveats a label can't carry; everything else is said by the stop labels themselves. */
export const footnotes: { n: number; text: string }[] = [
  { n: 1, text: "The AI agent replies only in Instagram and Messenger DMs." },
  { n: 2, text: "Threads replies arrive on sync, not instantly." },
];

/* ---------- Connect terminus ---------- */

export type SignIn = { label: string; lines: PlatformId[]; note?: number };

/** One Facebook Login brings in three lines; every other line has its own sign-in. */
export const signIns: SignIn[] = [
  { label: "One Facebook Login", lines: ["instagram", "facebook", "messenger"] },
  { label: "Threads sign-in", lines: ["threads"] },
  { label: "X sign-in", lines: ["x"] },
  { label: "LinkedIn sign-in", lines: ["linkedin"] },
  { label: "Continue with Meta", lines: ["whatsapp"] },
  { label: "Google sign-in", lines: ["gmail"] },
];

export const signInOf = Object.fromEntries(
  signIns.flatMap((s) => s.lines.map((id) => [id, s])),
) as Record<PlatformId, SignIn>;

/** The shared Facebook Login connector: the lines it joins, top to bottom. */
export const facebookLogin = signIns[0];

/* ---------- Stations ---------- */

export type StationKey = "inbox" | "agent" | "automations" | "broadcasts" | "campaigns" | "templates" | "insights";
export type Stop = { label: string; note?: number };
export type Station = {
  key: StationKey;
  name: string;
  /** What the station is, in a few words (screen-reader summary and mobile bands). */
  gist: string;
  note?: number;
  stops: Partial<Record<PlatformId, Stop>>;
};

/**
 * Short stop labels for the map (four words at most). Which lines stop where still comes
 * from lib/capabilities.ts; the matrix below keeps the full wording.
 */
const short: Record<StationKey, Partial<Record<PlatformId, string>>> = {
  inbox: {
    instagram: "DMs + comments",
    facebook: "Comments + visitor posts",
    threads: "Replies + mentions",
    x: "DMs + mentions",
    linkedin: "Page comments",
    messenger: "DMs",
    whatsapp: "Chats",
    gmail: "Email threads",
  },
  agent: { instagram: "Menu or Agentic", messenger: "Menu or Agentic" },
  // Comment → DM is Instagram-only; Facebook and Threads reply to or delete matching comments
  // (Instagram can too; the map names what sets it apart).
  automations: { instagram: "Comment → DM", facebook: "Reply or delete", threads: "Reply or delete" },
  broadcasts: {
    instagram: "Photo · Reel · Story · Carousel",
    facebook: "Photo · video · text",
    threads: "Text · image · video",
    x: "Posts with media",
    linkedin: "Text posts only",
  },
  campaigns: { instagram: "DMs in 24h window", messenger: "DMs in 24h window" },
  // The template manager drafts, imports and tracks Meta review; it does not send.
  templates: { whatsapp: "Draft + Meta review" },
  insights: {
    instagram: "Reach · views · followers",
    facebook: "Engagements · views · followers",
    threads: "Views · likes · replies",
  },
};

function pick(
  key: StationKey,
  source: Partial<Record<PlatformId, string>>,
  keep: (id: PlatformId) => boolean,
  notes: Partial<Record<PlatformId, number>> = {},
): Partial<Record<PlatformId, Stop>> {
  const out: Partial<Record<PlatformId, Stop>> = {};
  for (const id of lineOrder) {
    if (source[id] && keep(id)) out[id] = { label: short[key][id] ?? source[id], note: notes[id] };
  }
  return out;
}

const automationLines = Object.keys(commentAutomations) as PlatformId[];

export const stations: Station[] = [
  {
    key: "inbox",
    name: "Inbox",
    gist: "Every comment, DM and email",
    stops: pick("inbox", stops.inbox, () => true, { threads: 2 }),
  },
  {
    key: "agent",
    name: "Agent",
    gist: "AI agent on direct messages",
    note: 1,
    stops: pick("agent", stops.agent, (id) => agentChannels.includes(id)),
  },
  {
    key: "automations",
    name: "Automations",
    gist: "Comment keyword automations",
    stops: pick("automations", stops.automations, (id) => automationLines.includes(id)),
  },
  {
    key: "broadcasts",
    name: "Broadcasts",
    gist: "Publish one post to several networks",
    stops: pick("broadcasts", stops.broadcasts, (id) => publishTargets.includes(id)),
  },
  {
    key: "campaigns",
    name: "Campaigns",
    gist: "DM campaigns inside the 24-hour window",
    stops: pick("campaigns", stops.outreach, (id) => campaignChannels.includes(id)),
  },
  {
    key: "templates",
    name: "Templates",
    gist: "WhatsApp message templates, managed not sent",
    stops: pick("templates", stops.outreach, (id) => !campaignChannels.includes(id)),
  },
  {
    key: "insights",
    name: "Insights",
    gist: "Native metric tiles per channel",
    stops: pick("insights", stops.insights, () => true),
  },
];


/* ---------- Capability matrix ---------- */

export type MatrixColumn = { key: string; label: string; note?: number };

export const matrixColumns: MatrixColumn[] = [
  { key: "Connect", label: "Connect" },
  { key: "Inbox", label: "Inbox" },
  { key: "Agent", label: "Agent", note: 1 },
  { key: "Automations", label: "Automations" },
  { key: "Publish", label: "Publish" },
  { key: "Outreach", label: "Campaigns & templates" },
  { key: "Insights", label: "Insights" },
];

const cellNotes: Partial<Record<PlatformId, Record<string, number>>> = {
  threads: { Inbox: 2 },
};

export type CellKind = "yes" | "pooled" | "no";
export type MatrixCell = { column: MatrixColumn; text: string; kind: CellKind; note?: number };
export type MatrixRow = LineRow & { cells: MatrixCell[] };

/** Matrix rows in line order so the numbers read 01–08 down the table. */
export const matrixRows: MatrixRow[] = lineRows.map((row) => {
  const source = matrix.find((m) => m.platform === row.id);
  return {
    ...row,
    cells: matrixColumns.map((column) => {
      const text = source?.rows[column.key] ?? "—";
      const kind: CellKind = text === "—" ? "no" : text.startsWith("In workspace") ? "pooled" : "yes";
      return { column, text, kind, note: cellNotes[row.id]?.[column.key] };
    }),
  };
});
