import type { PlatformId } from "./platforms";

/**
 * What koLink Chat really does per platform, verified against the app and API code
 * (October 2026). Every section that shows platform support reads from here so the
 * page cannot drift from the product. Do not add a capability without checking the code.
 */

/** Broadcasts publish live to these five. WhatsApp's publisher is simulated, so it is left out. */
export const publishTargets: PlatformId[] = ["instagram", "facebook", "threads", "x", "linkedin"];

/** The AI agent (Off / Menu / Agentic) runs only on these DMs. */
export const agentChannels: PlatformId[] = ["instagram", "messenger"];

/** Comment keyword automations. Keyword → DM is Instagram-only. */
export const commentAutomations: Partial<Record<PlatformId, ("dm" | "reply" | "delete")[]>> = {
  instagram: ["dm", "reply", "delete"],
  facebook: ["reply", "delete"],
  threads: ["reply", "delete"],
};

/** DM campaigns to contacts inside Meta's 24-hour window. */
export const campaignChannels: PlatformId[] = ["instagram", "messenger"];

/** Platform order on the map and the hero board: publish lines first, then conversation lines. */
export const lineOrder: PlatformId[] = ["instagram", "facebook", "threads", "x", "linkedin", "messenger", "whatsapp", "gmail"];

export type Station = "inbox" | "agent" | "automations" | "broadcasts" | "outreach" | "insights";

/** Transit-map stops: which lines stop at which station, with the honest label for that stop. */
export const stops: Record<Station, Partial<Record<PlatformId, string>>> = {
  inbox: {
    instagram: "DMs + comments",
    facebook: "Page comments + visitor posts",
    messenger: "DMs",
    whatsapp: "Chats",
    threads: "Replies + mentions",
    x: "DMs + mentions",
    linkedin: "Company Page comments",
    gmail: "Email threads",
  },
  agent: {
    instagram: "DMs · Off / Menu / Agentic",
    messenger: "DMs · Off / Menu / Agentic",
  },
  automations: {
    instagram: "Keyword → DM · reply · delete",
    facebook: "Keyword → reply · delete",
    threads: "Keyword → reply · delete",
  },
  broadcasts: {
    instagram: "Photo · Reel · Story · Carousel",
    facebook: "Photo · Video · Text",
    threads: "Text · Image · Video (500)",
    x: "Post (280) · up to 4 media",
    linkedin: "Text post (3,000)",
  },
  outreach: {
    instagram: "DM campaigns (24h window)",
    messenger: "DM campaigns (24h window)",
    whatsapp: "Template manager",
  },
  insights: {
    instagram: "Reach · views · engaged · followers",
    facebook: "Engagements · page views · followers",
    threads: "Views · likes · replies · reposts (7 days)",
  },
};

/** Per-platform capability matrix, one row per platform (— means not supported). */
export const matrix: { platform: PlatformId; label: string; rows: Record<string, string> }[] = [
  {
    platform: "instagram",
    label: "Instagram",
    rows: {
      Connect: "Facebook Login (Professional account linked to a Page)",
      Inbox: "DMs and post/reel comments",
      Agent: "Off / Menu / Agentic on DMs",
      Automations: "Keyword → DM · reply · delete",
      Publish: "Photo · Reel · Story · Image carousel",
      Outreach: "DM campaigns (24h window)",
      Insights: "Reach · views · accounts engaged · interactions · followers",
    },
  },
  {
    platform: "facebook",
    label: "Facebook Page",
    rows: {
      Connect: "Facebook Login (with Messenger)",
      Inbox: "Page comments and visitor posts",
      Agent: "—",
      Automations: "Keyword → reply · delete",
      Publish: "Photo · Video · Text",
      Outreach: "—",
      Insights: "Post engagements · page views · followers",
    },
  },
  {
    platform: "messenger",
    label: "Messenger",
    rows: {
      Connect: "Facebook Login (Page)",
      Inbox: "DMs with attachments, cards, quick replies",
      Agent: "Off / Menu / Agentic on DMs",
      Automations: "—",
      Publish: "—",
      Outreach: "DM campaigns (24h window)",
      Insights: "In workspace Insights",
    },
  },
  {
    platform: "whatsapp",
    label: "WhatsApp",
    rows: {
      Connect: "Continue with Meta, or Cloud API credentials",
      Inbox: "Chats (session text replies)",
      Agent: "—",
      Automations: "—",
      Publish: "—",
      Outreach: "Template manager · submit for review",
      Insights: "In workspace Insights",
    },
  },
  {
    platform: "threads",
    label: "Threads",
    rows: {
      Connect: "Threads sign-in",
      Inbox: "Replies and @mentions",
      Agent: "—",
      Automations: "Keyword → reply · delete",
      Publish: "Text · Image · Video (500 chars)",
      Outreach: "—",
      Insights: "Views · likes · replies · reposts · quotes (7 days)",
    },
  },
  {
    platform: "x",
    label: "X",
    rows: {
      Connect: "X sign-in",
      Inbox: "DMs and mentions",
      Agent: "—",
      Automations: "—",
      Publish: "Posts (280) · up to 4 media",
      Outreach: "—",
      Insights: "In workspace Insights",
    },
  },
  {
    platform: "linkedin",
    label: "LinkedIn",
    rows: {
      Connect: "LinkedIn sign-in (Company Page)",
      Inbox: "Company Page comments",
      Agent: "—",
      Automations: "—",
      Publish: "Text posts (3,000 chars)",
      Outreach: "—",
      Insights: "In workspace Insights",
    },
  },
  {
    platform: "gmail",
    label: "Gmail",
    rows: {
      Connect: "Google sign-in",
      Inbox: "Email threads · Primary / Promotions",
      Agent: "—",
      Automations: "—",
      Publish: "—",
      Outreach: "—",
      Insights: "In workspace Insights",
    },
  },
];
