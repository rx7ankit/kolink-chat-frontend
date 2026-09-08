export type ChannelId =
  | "instagram"
  | "messenger"
  | "whatsapp"
  | "facebook"
  | "threads"
  | "tiktok"
  | "x"
  | "telegram"
  | "line"
  | "linkedin"
  | "email";

export type Channel = {
  id: ChannelId;
  name: string;
  handle: string;
  connected: boolean;
  status: "healthy" | "needs_attention" | "disconnected";
  messages7d: number;
  contacts: number;
  accent: string;
  description: string;
};

export const channels: Channel[] = [
  {
    id: "instagram",
    name: "Instagram",
    handle: "@bloomandco",
    connected: true,
    status: "healthy",
    messages7d: 1842,
    contacts: 6120,
    accent: "bg-[#fbe0ea] text-[#8a4660]",
    description: "Comments, DMs, story mentions, and reels.",
  },
  {
    id: "messenger",
    name: "Messenger",
    handle: "Bloom & Co.",
    connected: true,
    status: "healthy",
    messages7d: 964,
    contacts: 2480,
    accent: "bg-[#dce8fb] text-[#35507a]",
    description: "Facebook Page conversations and ads.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    handle: "+1 415 555 0198",
    connected: true,
    status: "healthy",
    messages7d: 2210,
    contacts: 3890,
    accent: "bg-[#d8f4ee] text-[#2d6f64]",
    description: "Business API chats, catalogs, and broadcasts.",
  },
  {
    id: "facebook",
    name: "Facebook",
    handle: "Bloom & Co.",
    connected: false,
    status: "disconnected",
    messages7d: 0,
    contacts: 0,
    accent: "bg-[#dce8fb] text-[#35507a]",
    description: "Page feed comments and visitor posts.",
  },
  {
    id: "threads",
    name: "Threads",
    handle: "@bloomandco",
    connected: false,
    status: "disconnected",
    messages7d: 0,
    contacts: 0,
    accent: "bg-[#ececf1] text-[#3a3a44]",
    description: "Post replies, @mentions, and publishing.",
  },
  {
    id: "tiktok",
    name: "TikTok",
    handle: "@bloom.studio",
    connected: true,
    status: "needs_attention",
    messages7d: 611,
    contacts: 1540,
    accent: "bg-[#f3e4ea] text-[#5a3044]",
    description: "DMs, video comments, and profile from your TikTok account.",
  },
  {
    id: "x",
    name: "X",
    handle: "@bloomandco",
    connected: true,
    status: "healthy",
    messages7d: 328,
    contacts: 870,
    accent: "bg-[#ececf1] text-[#3a3a44]",
    description: "DMs, mention replies, and posting from Broadcasts.",
  },
  {
    id: "telegram",
    name: "Telegram",
    handle: "@BloomSupport",
    connected: false,
    status: "disconnected",
    messages7d: 0,
    contacts: 0,
    accent: "bg-[#dceef8] text-[#2f5f78]",
    description: "Your personal Telegram DMs in Inbox. Connect with phone + login code in Channels.",
  },
  {
    id: "line",
    name: "LINE",
    handle: "@kolink",
    connected: false,
    status: "disconnected",
    messages7d: 0,
    contacts: 0,
    accent: "bg-[#d8f4e8] text-[#1a6b42]",
    description: "Official Account DMs via Messaging API. Connect with channel credentials from LINE Developers.",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "KoLink",
    connected: false,
    status: "disconnected",
    messages7d: 0,
    contacts: 0,
    accent: "bg-[#dce8f5] text-[#0a66c2]",
    description: "Company Page comments in Inbox. Personal profile comments are limited by LinkedIn. Personal DMs are not available.",
  },
  {
    id: "email",
    name: "Email",
    handle: "hello@bloomand.co",
    connected: false,
    status: "disconnected",
    messages7d: 0,
    contacts: 0,
    accent: "bg-[#dce8f5] text-[#35507a]",
    description: "Gmail inbox in KoLink. Connect with Google, then read and reply from Inbox.",
  },
];

export function getChannel(id: ChannelId) {
  return channels.find((channel) => channel.id === id)!;
}
