import type { PhotoId } from "@/lib/media";
import type { PlatformId } from "@/lib/platforms";

/**
 * §06 demo workspace. Everything here is illustrative: names, threads and counts are
 * invented, and nothing is ever sent. The shapes follow the real inbox (folders,
 * labels, assignee, Stop bot / Resume bot, Mark done, Gmail tabs, outbound statuses).
 */

export type TeamId = "A" | "R" | "D";

export const team: { id: TeamId; name: string; you?: boolean }[] = [
  { id: "A", name: "Asha", you: true },
  { id: "R", name: "Rohan" },
  { id: "D", name: "Dev" },
];

export const teamName = (id: TeamId) => team.find((m) => m.id === id)?.name ?? id;

export type LabelId = "sales" | "support" | "press" | "faq" | "hot";

/** Label colors come from the palette (pops, accent, ink-soft), never hard-coded hex. */
export const labels: { id: LabelId; name: string; tone: string }[] = [
  { id: "sales", name: "Sales", tone: "var(--k-pop2)" },
  { id: "support", name: "Support", tone: "var(--k-pop3)" },
  { id: "press", name: "Press", tone: "var(--k-accent)" },
  { id: "faq", name: "FAQ", tone: "var(--k-ink-soft)" },
  { id: "hot", name: "Hot", tone: "var(--k-pop1)" },
];

export const labelById = Object.fromEntries(labels.map((l) => [l.id, l])) as Record<LabelId, (typeof labels)[number]>;

/** A pop tint behind ink text (pops are fills only). */
export const tint = (tone: string, pct = 24) => `color-mix(in oklab, ${tone} ${pct}%, var(--k-surface))`;

export type ChannelFilter = "all" | "instagram" | "messenger" | "whatsapp" | "linkedin" | "email" | "threads" | "x";

/** The inbox's real filter row. Facebook Page comments sit under Messenger, as in the app. */
export const channelFilters: { id: ChannelFilter; label: string; platforms: PlatformId[] }[] = [
  { id: "all", label: "All", platforms: [] },
  { id: "instagram", label: "Instagram", platforms: ["instagram"] },
  { id: "messenger", label: "Messenger", platforms: ["messenger", "facebook"] },
  { id: "whatsapp", label: "WhatsApp", platforms: ["whatsapp"] },
  { id: "linkedin", label: "LinkedIn", platforms: ["linkedin"] },
  { id: "email", label: "Email", platforms: ["gmail"] },
  { id: "threads", label: "Threads", platforms: ["threads"] },
  { id: "x", label: "X", platforms: ["x"] },
];

/** Mono line codes printed on every row. */
export const codes: Record<PlatformId, string> = {
  instagram: "IG",
  facebook: "FB",
  messenger: "MS",
  whatsapp: "WA",
  threads: "TH",
  x: "X",
  linkedin: "IN",
  gmail: "GM",
};

export const channelName: Record<PlatformId, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  messenger: "Messenger",
  whatsapp: "WhatsApp",
  threads: "Threads",
  x: "X",
  linkedin: "LinkedIn",
  gmail: "Gmail",
};

export type Status = "Sent" | "Sending…" | "Not sent";

export type Msg =
  /** A customer message: text, a shared photo, or both (the photo renders as its own bubble first). */
  | { id: string; kind: "in"; text?: string; subject?: string; photo?: PhotoId }
  | { id: string; kind: "agent"; text: string; status: Status; note?: string }
  | { id: string; kind: "team"; by: TeamId; text: string; status: Status }
  | { id: string; kind: "handoff"; asked: string; why: string }
  | { id: string; kind: "event"; text: string; tone: "attention" | "neutral" };

export type Contact = {
  /** Only real people become contacts (Gmail newsletters do not). */
  person: boolean;
  city?: string;
  language?: string;
  tags: string[];
  note?: string;
  /** Instagram contacts: profile counts and their three latest posts (read-only, demo). */
  ig?: { posts: number; followers: number; following: number; followsYou: boolean; grid: [PhotoId, PhotoId, PhotoId] };
};

export type Thread = {
  id: string;
  platform: PlatformId;
  kind: "dm" | "comment" | "email";
  name: string;
  handle?: string;
  /** Where a comment lives, shown in the thread header. */
  context?: string;
  preview: string;
  /** The preview line's message carries this photo: the row shows a tiny thumbnail before it. */
  previewPhoto?: PhotoId;
  label?: LabelId;
  assignee: TeamId | null;
  attention: boolean;
  /** The inbox bot runs on Instagram and Messenger DMs only; null everywhere else. */
  bot: "on" | "human" | null;
  /** Minutes since the last activity; the list sorts on it. */
  ts: number;
  tab?: "primary" | "promotions";
  /** Customer wrote while the thread was human-owned. */
  waiting?: boolean;
  nudged?: boolean;
  messages: Msg[];
  contact: Contact;
};

export const SCRIPT_REPLY = "Hi Sam, Asha here from the team. What can I help with?";

export const initialThreads: Thread[] = [
  {
    id: "mira",
    platform: "instagram",
    kind: "dm",
    name: "Mira Shah",
    handle: "@mira.home",
    preview: "Do you ship this set wholesale?",
    previewPhoto: "linenStack",
    label: "sales",
    assignee: "A",
    attention: true,
    bot: "human",
    ts: 2,
    messages: [
      // Photo and question arrive together, as one message.
      { id: "mira-1", kind: "in", photo: "linenStack", text: "Do you ship this set wholesale?" },
      { id: "mira-2", kind: "agent", text: "Yes, wholesale starts at 12 sets.", status: "Sent", note: "from knowledge: Wholesale" },
      { id: "mira-3", kind: "in", text: "great, can I get a quote for 40?" },
      { id: "mira-5", kind: "handoff", asked: "quote for 40 sets", why: "no wholesale pricing in knowledge" },
      { id: "mira-6", kind: "team", by: "A", text: "Sending your quote now!", status: "Sent" },
    ],
    contact: {
      person: true,
      city: "Pune",
      language: "English",
      tags: ["wholesale", "linen"],
      note: "Wants 40 sets. Quote in progress.",
      ig: { posts: 128, followers: 2340, following: 412, followsYou: true, grid: ["linenDrop", "greenLinen", "planters"] },
    },
  },
  {
    id: "promo",
    platform: "gmail",
    kind: "email",
    name: "Loomcraft Weekly",
    preview: "Spring edit: 30% off linen this week",
    assignee: null,
    attention: false,
    bot: null,
    ts: 5,
    tab: "primary",
    messages: [
      {
        id: "promo-1",
        kind: "in",
        subject: "Spring edit: 30% off linen this week",
        text: "Our spring edit is here. Take 30% off linen until Sunday.",
      },
    ],
    contact: { person: false, tags: [] },
  },
  {
    id: "wa",
    platform: "whatsapp",
    kind: "dm",
    name: "Kabir Rao",
    handle: "+91 ·· ·· 4410",
    preview: "Any update on the terracotta restock?",
    previewPhoto: "planter",
    label: "support",
    assignee: null,
    attention: false,
    bot: null,
    ts: 9,
    messages: [
      { id: "wa-0", kind: "in", photo: "planter" },
      { id: "wa-1", kind: "in", text: "Any update on the terracotta restock?" },
    ],
    contact: { person: true, city: "Mumbai", language: "English", tags: ["restock"] },
  },
  {
    id: "tara",
    platform: "instagram",
    kind: "dm",
    name: "Tara Nair",
    handle: "@tara.makes",
    preview: "What’s your return window?",
    label: "faq",
    assignee: null,
    attention: false,
    bot: "on",
    ts: 21,
    messages: [
      { id: "tara-1", kind: "in", text: "What’s your return window?" },
      {
        id: "tara-2",
        kind: "agent",
        text: "Returns are open for 14 days after delivery, unused and with tags on.",
        status: "Sent",
        note: "from knowledge: Returns",
      },
    ],
    contact: {
      person: true,
      city: "Bengaluru",
      language: "English",
      tags: ["returns"],
      ig: { posts: 64, followers: 890, following: 301, followsYou: false, grid: ["shopWindow", "mug", "boutique"] },
    },
  },
  {
    id: "ms",
    platform: "messenger",
    kind: "dm",
    name: "Sam Okafor",
    preview: "can I talk to a real person?",
    assignee: null,
    attention: true,
    bot: "human",
    ts: 45,
    messages: [
      { id: "ms-1", kind: "in", text: "can I talk to a real person?" },
      // An explicit request for a human skips the model: the bot sends this line and escalates.
      { id: "ms-2", kind: "agent", text: "We’ll connect someone from our team to help you out.", status: "Sent" },
      { id: "ms-3", kind: "event", tone: "attention", text: "Asked for a person. Bot stepped aside, flagged Needs attention." },
    ],
    contact: { person: true, city: "Delhi", language: "English", tags: ["order"] },
  },
  {
    id: "in",
    platform: "linkedin",
    kind: "comment",
    name: "Priya Desai",
    context: "Comment on your Company Page post",
    preview: "Do you supply boutique hotels?",
    assignee: "A",
    attention: false,
    bot: null,
    ts: 60,
    messages: [
      { id: "in-1", kind: "in", text: "Do you supply boutique hotels?" },
      { id: "in-2", kind: "team", by: "A", text: "We do! Sending you a note with our hotel range today.", status: "Sent" },
    ],
    contact: { person: true, city: "Jaipur", language: "English", tags: ["hotel"] },
  },
  {
    id: "th",
    platform: "threads",
    kind: "comment",
    name: "Arjun K.",
    handle: "@arjun.k",
    context: "Reply to your Threads post",
    preview: "do you ship to Pune?",
    assignee: "R",
    attention: false,
    bot: null,
    ts: 120,
    messages: [
      { id: "th-1", kind: "in", text: "do you ship to Pune?" },
      { id: "th-2", kind: "team", by: "R", text: "We do! Pune orders arrive in 3–5 days.", status: "Sent" },
    ],
    contact: { person: true, city: "Pune", language: "English", tags: ["shipping"] },
  },
  // A public mention: every channel chip has at least one thread behind it.
  {
    id: "xm",
    platform: "x",
    kind: "comment",
    name: "Nadia Khan",
    handle: "@nadia.k",
    context: "Mentioned you on X",
    preview: "@northwind is the sand colour back?",
    label: "support",
    assignee: "R",
    attention: false,
    bot: null,
    ts: 180,
    messages: [{ id: "xm-1", kind: "in", text: "@northwind is the sand colour back?" }],
    contact: { person: true, language: "English", tags: ["restock"] },
  },
  // Already sorted into Promotions: hidden from every folder except the Promotions tab.
  {
    id: "p1",
    platform: "gmail",
    kind: "email",
    name: "Studio Supply Co",
    preview: "20% off mailers and tape",
    assignee: null,
    attention: false,
    bot: null,
    ts: 200,
    tab: "promotions",
    messages: [{ id: "p1-1", kind: "in", subject: "20% off mailers and tape", text: "Stock up before the holiday rush." }],
    contact: { person: false, tags: [] },
  },
  {
    id: "p2",
    platform: "gmail",
    kind: "email",
    name: "Pattern Club",
    preview: "New spring prints are in",
    assignee: null,
    attention: false,
    bot: null,
    ts: 400,
    tab: "promotions",
    messages: [{ id: "p2-1", kind: "in", subject: "New spring prints are in", text: "Forty new prints, ready to download." }],
    contact: { person: false, tags: [] },
  },
  {
    id: "p3",
    platform: "gmail",
    kind: "email",
    name: "Fabric Fair",
    preview: "Early-bird passes close Friday",
    assignee: null,
    attention: false,
    bot: null,
    ts: 1500,
    tab: "promotions",
    messages: [{ id: "p3-1", kind: "in", subject: "Early-bird passes close Friday", text: "Two days left for early-bird pricing." }],
    contact: { person: false, tags: [] },
  },
];

export function ago(ts: number) {
  if (ts <= 0) return "now";
  if (ts < 60) return `${ts}m`;
  if (ts < 1440) return `${Math.floor(ts / 60)}h`;
  return `${Math.floor(ts / 1440)}d`;
}

export function kindLabel(t: Thread) {
  if (t.platform === "gmail") return t.tab === "promotions" ? "Gmail · Promotions" : "Gmail · Primary";
  if (t.kind === "comment") return t.context ?? `${channelName[t.platform]} comment`;
  if (t.platform === "whatsapp") return "WhatsApp chat";
  return `${channelName[t.platform]} DM`;
}

/** Geometry shared by the list, the docking lines and the packet layer (fixed-height rows). */
export const FRAME = {
  gutter: 72,
  toolbar: 56,
  subhead: 40,
  rowH: 60,
  /** One row per line: eight channels, eight rows. */
  maxRows: 8,
  /** First row's top edge, from the frame top: card border + toolbar + list subhead. */
  get rowTop() {
    return 1 + this.toolbar + this.subhead;
  },
  get height() {
    return this.rowTop + this.rowH * this.maxRows + 1;
  },
};
