import type { ChannelId } from "./channels";

export type Template = {
  id: string;
  name: string;
  description: string;
  channel: ChannelId;
  category: "Growth" | "Sales" | "Support" | "Creator";
};

export const templates: Template[] = [
  {
    id: "tpl1",
    name: "Comment keyword to DM",
    description: "When someone comments a keyword, slide into DMs with a lead magnet.",
    channel: "instagram",
    category: "Growth",
  },
  {
    id: "tpl2",
    name: "Welcome new followers",
    description: "Say hi, share a freebie, and capture an email.",
    channel: "instagram",
    category: "Growth",
  },
  {
    id: "tpl3",
    name: "Story mention thank-you",
    description: "Auto-reply to story mentions with a thank-you and a code.",
    channel: "instagram",
    category: "Creator",
  },
  {
    id: "tpl4",
    name: "FAQ default reply",
    description: "Answer hours, shipping, and returns with tappable topics.",
    channel: "messenger",
    category: "Support",
  },
  {
    id: "tpl5",
    name: "WhatsApp catalog nudge",
    description: "Send a product card after a high-intent comment.",
    channel: "whatsapp",
    category: "Sales",
  },
  {
    id: "tpl6",
    name: "TikTok LINK capture",
    description: "Comment LINK, get the bio link + waitlist in DMs.",
    channel: "tiktok",
    category: "Growth",
  },
  {
    id: "tpl7",
    name: "X mention waitlist",
    description: "Turn DROP mentions into a waitlist DM.",
    channel: "x",
    category: "Growth",
  },
  {
    id: "tpl8",
    name: "LINE appointment reminder",
    description: "Confirm studio visits 24 hours ahead.",
    channel: "line",
    category: "Support",
  },
];
