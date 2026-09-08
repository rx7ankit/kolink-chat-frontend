import type { ChannelId } from "./channels";

export type Automation = {
  id: string;
  name: string;
  trigger: string;
  channels: ChannelId[];
  status: "live" | "paused" | "draft";
  sent: number;
  clicked: number;
  updatedAt: string;
};

export const automations: Automation[] = [
  {
    id: "a1",
    name: "Comment keyword → wholesale DM",
    trigger: "Instagram comment contains PRICE",
    channels: ["instagram", "whatsapp"],
    status: "live",
    sent: 1284,
    clicked: 41,
    updatedAt: "2026-08-30",
  },
  {
    id: "a2",
    name: "Welcome new followers",
    trigger: "New Instagram follower",
    channels: ["instagram"],
    status: "live",
    sent: 860,
    clicked: 28,
    updatedAt: "2026-08-28",
  },
  {
    id: "a3",
    name: "Story mention thank-you",
    trigger: "Story mention",
    channels: ["instagram"],
    status: "live",
    sent: 214,
    clicked: 62,
    updatedAt: "2026-08-27",
  },
  {
    id: "a4",
    name: "TikTok comment to DM",
    trigger: "TikTok comment contains LINK",
    channels: ["tiktok"],
    status: "paused",
    sent: 490,
    clicked: 33,
    updatedAt: "2026-08-21",
  },
  {
    id: "a5",
    name: "X mention capture",
    trigger: "X mention contains DROP",
    channels: ["x"],
    status: "live",
    sent: 118,
    clicked: 22,
    updatedAt: "2026-08-25",
  },
  {
    id: "a6",
    name: "Abandoned cart nudge",
    trigger: "Shopify checkout started",
    channels: ["whatsapp", "line"],
    status: "draft",
    sent: 0,
    clicked: 0,
    updatedAt: "2026-08-31",
  },
];

export const keywords = [
  { id: "k1", phrase: "PRICE", flow: "Comment keyword → wholesale DM", channel: "instagram" as ChannelId, hits: 412 },
  { id: "k2", phrase: "HOURS", flow: "FAQ default reply", channel: "instagram" as ChannelId, hits: 96 },
  { id: "k3", phrase: "LINK", flow: "TikTok comment to DM", channel: "tiktok" as ChannelId, hits: 188 },
  { id: "k4", phrase: "DROP", flow: "X mention capture", channel: "x" as ChannelId, hits: 54 },
  { id: "k5", phrase: "HELP", flow: "Human handoff", channel: "whatsapp" as ChannelId, hits: 73 },
];

export const sequences = [
  { id: "s1", name: "7-day welcome", steps: 5, subscribers: 640, status: "live" as const },
  { id: "s2", name: "Wholesale nurture", steps: 4, subscribers: 128, status: "live" as const },
  { id: "s3", name: "Post-purchase care", steps: 3, subscribers: 410, status: "paused" as const },
];

export const rules = [
  { id: "r1", name: "Tag VIP after 3 purchases", condition: "orders ≥ 3", action: "Add tag VIP" },
  { id: "r2", name: "Handoff on HELP", condition: "keyword HELP", action: "Open inbox + assign Aisha" },
  { id: "r3", name: "Pause if human replies", condition: "agent message sent", action: "Pause automations 30m" },
];

export const basicAutomations = [
  { id: "b1", name: "Default reply", channel: "instagram" as ChannelId, detail: "Sorry I missed this — tap a topic below." },
  { id: "b2", name: "Conversation starters", channel: "messenger" as ChannelId, detail: "Shop · Hours · Wholesale · Talk to a human" },
  { id: "b3", name: "Story mention reply", channel: "instagram" as ChannelId, detail: "Saw the story — sending a thank-you note + 10% code." },
  { id: "b4", name: "Ice breakers", channel: "whatsapp" as ChannelId, detail: "Track order · New drop · Book studio" },
];
