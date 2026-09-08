import type { ChannelId } from "./channels";

export type ChatMessage = {
  id: string;
  from: "contact" | "agent" | "bot";
  text: string;
  at: string;
  contentType?: string;
  mediaUrl?: string;
  deliveryStatus?: string;
  status?: "uploading" | "sending" | "sent" | "failed";
  subject?: string;
  htmlBody?: string;
  gmailCategory?: string;
  liked?: boolean;
};

export type Conversation = {
  id: string;
  contactId: string;
  channel: ChannelId;
  threadKind?: "dm" | "comment" | "post";
  preview: string;
  unread: number;
  state: "open" | "closed";
  assignedTo: string | null;
  labels: string[];
  paused: boolean;
  updatedAt: string;
  messages: ChatMessage[];
  subject?: string;
  gmailCategory?: string;
};

export const conversations: Conversation[] = [
  {
    id: "t1",
    contactId: "c1",
    channel: "instagram",
    preview: "Do you ship the linen set wholesale?",
    unread: 2,
    state: "open",
    assignedTo: "You",
    labels: ["Sales"],
    paused: true,
    updatedAt: "2026-08-31T12:40:00Z",
    messages: [
      { id: "m1", from: "bot", text: "Hey Maya! Thanks for commenting PRICE on our reel. Want the wholesale guide?", at: "2026-08-31T12:10:00Z" },
      { id: "m2", from: "contact", text: "Yes please — do you ship the linen set wholesale?", at: "2026-08-31T12:18:00Z" },
      { id: "m3", from: "agent", text: "We do. MOQ is 12. I can send the lookbook + pricing sheet.", at: "2026-08-31T12:22:00Z" },
      { id: "m4", from: "contact", text: "Perfect. Also, can we get custom labels?", at: "2026-08-31T12:40:00Z" },
    ],
  },
  {
    id: "t2",
    contactId: "c2",
    channel: "whatsapp",
    preview: "Any update on the terracotta restock?",
    unread: 1,
    state: "open",
    assignedTo: null,
    labels: ["Support"],
    paused: false,
    updatedAt: "2026-08-31T11:12:00Z",
    messages: [
      { id: "m5", from: "contact", text: "Any update on the terracotta restock?", at: "2026-08-31T11:12:00Z" },
      { id: "m6", from: "bot", text: "Luis, the terracotta set is due back on Sep 4. Want a hold?", at: "2026-08-31T11:12:20Z" },
    ],
  },
  {
    id: "t3",
    contactId: "c10",
    channel: "whatsapp",
    preview: "Can we jump on a call Thursday?",
    unread: 0,
    state: "open",
    assignedTo: "Aisha",
    labels: ["Hot"],
    paused: true,
    updatedAt: "2026-08-29T17:30:00Z",
    messages: [
      { id: "m7", from: "bot", text: "You moved from Instagram to WhatsApp — nice. Want a 15-min walkthrough?", at: "2026-08-29T16:40:00Z" },
      { id: "m8", from: "contact", text: "Can we jump on a call Thursday?", at: "2026-08-29T17:30:00Z" },
    ],
  },
  {
    id: "t5",
    contactId: "c5",
    channel: "x",
    preview: "Can I quote you on the creator tools piece?",
    unread: 0,
    state: "open",
    assignedTo: null,
    labels: ["Press"],
    paused: false,
    updatedAt: "2026-08-30T18:40:00Z",
    messages: [
      { id: "m10", from: "contact", text: "Hi — writing a creator-tools roundup. Can I quote you?", at: "2026-08-30T18:40:00Z" },
    ],
  },
  {
    id: "t6",
    contactId: "c9",
    channel: "instagram",
    preview: "What's your return window?",
    unread: 0,
    state: "closed",
    assignedTo: "Bot",
    labels: ["FAQ"],
    paused: false,
    updatedAt: "2026-08-29T19:48:00Z",
    messages: [
      { id: "m11", from: "contact", text: "What's your return window?", at: "2026-08-29T19:47:00Z" },
      { id: "m12", from: "bot", text: "30 days, unused, with tags on. Need a prepaid label?", at: "2026-08-29T19:48:00Z" },
    ],
  },
  {
    id: "t7",
    contactId: "c7",
    channel: "instagram",
    preview: "Do you ship to Italy with duties prepaid?",
    unread: 1,
    state: "open",
    assignedTo: null,
    labels: ["Sales"],
    paused: false,
    updatedAt: "2026-08-30T14:10:00Z",
    messages: [
      { id: "m13", from: "contact", text: "Do you ship to Italy with duties prepaid?", at: "2026-08-30T14:10:00Z" },
    ],
  },
  {
    id: "t8",
    contactId: "c13",
    channel: "x",
    preview: "Thanks — login works now",
    unread: 0,
    state: "closed",
    assignedTo: "Aisha",
    labels: ["Support"],
    paused: false,
    updatedAt: "2026-08-28T15:42:00Z",
    messages: [
      { id: "m14", from: "contact", text: "Can't log into the member shop.", at: "2026-08-28T15:10:00Z" },
      { id: "m15", from: "agent", text: "Reset sent. Try the new link?", at: "2026-08-28T15:22:00Z" },
      { id: "m16", from: "contact", text: "Thanks — login works now.", at: "2026-08-28T15:42:00Z" },
    ],
  },
];

export const inboxFolders = [
  { id: "all", name: "All chats" },
  { id: "comments", name: "Comments" },
  { id: "unassigned", name: "Unassigned" },
  { id: "mine", name: "Assigned to me" },
  { id: "reminders", name: "Reminders" },
];

export type InboxLabel = {
  id: string;
  name: string;
  color: string;
};

/** Preset swatches for creating labels */
export const labelColorPalette = [
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#A855F7",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#0EA5E9",
];

export const inboxLabels: InboxLabel[] = [
  { id: "sales", name: "Sales", color: "#3B82F6" },
  { id: "support", name: "Support", color: "#14B8A6" },
  { id: "creator", name: "Creator", color: "#A855F7" },
  { id: "press", name: "Press", color: "#0EA5E9" },
  { id: "faq", name: "FAQ", color: "#6366F1" },
  { id: "hot", name: "Hot", color: "#EF4444" },
  { id: "appointments", name: "Appointments", color: "#F59E0B" },
];

export const cannedResponses = [
  { id: "cr1", shortcut: "/hours", text: "We're in the studio Tue–Sat, 10–6 PT. Sundays by appointment." },
  { id: "cr2", shortcut: "/returns", text: "30-day returns on unused pieces. I can send a prepaid label if you want." },
  { id: "cr3", shortcut: "/wholesale", text: "Wholesale starts at 12 units. I'll drop the lookbook and net-30 terms here." },
];
