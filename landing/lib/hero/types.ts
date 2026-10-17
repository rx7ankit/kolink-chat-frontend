import type { PhotoId, VideoId } from "@/lib/media";
import type { PlatformId } from "@/lib/platforms";

/** Who ends up answering an incoming item. `sorted` = filed away (Gmail Promotions), no reply needed. */
export type HandlerKind = "automation" | "agent" | "team" | "attention" | "sorted";

export type ItemKind = "comment" | "mention" | "dm" | "email" | "chat";

/** Packet glyphs on the map. Same legend as components/transit/glyph.tsx. */
export type PacketShape = "post" | "incoming" | "automation" | "agent" | "team" | "attention";

/** A catalog row the agent shows as a swipe card (photo from lib/media). */
export type CatalogCard = { title: string; price: string; meta: string; photo: PhotoId };

/**
 * One readable step of a conversation in the focus pane.
 * - them: the customer writes
 * - us: a reply goes out (automation, agent or team)
 * - tap: the customer taps a button
 * - note: a margin annotation for the page reader (customers never see these)
 * - handoff: the Asked / Tried / Why note a hand-off writes
 * - published: the "published to 5" card
 * - typing: the agent's typing dots
 */
export type ThreadLine = {
  k: "them" | "us" | "tap" | "note" | "handoff" | "published" | "typing";
  text?: string;
  /** Small caption above a bubble (handle, surface). */
  who?: string;
  /** A comment on the published post: the bubble carries a post-context thumbnail ("on your Reel"). */
  onPost?: "reel" | "post";
  /** Substring that an automation matched; drawn with a highlighter swipe. */
  highlight?: string;
  /** Margin note shown outside the bubble. */
  note?: string;
  by?: "automation" | "agent" | "team";
  /** Where the reply went: "Public reply", "DM", "Agentic"… */
  via?: string;
  buttons?: string[];
  cards?: CatalogCard[];
  /** Reveal the reply word by word (agent replies). */
  reveal?: "words";
  handoff?: { asked: string; tried: string; why: string };
  tags?: { platform: PlatformId; label: string; warn?: boolean }[];
  /** Focus-pane status flap value once this line shows (e.g. "DM SENT · TAP"). */
  status?: string;
};

export type ScriptItem = {
  platform: PlatformId;
  kind: ItemKind;
  handler: HandlerKind;
  /** The scripted demo strings exactly as written in the spec (source of the fields below). */
  spec?: { incoming: string; reply: string };
  /** Row snippet once the item arrives. */
  arrives: string;
  /** Row status flap once sorted (AUTOMATION / AGENT / INBOX / SORTED). */
  status: string;
  /** Row snippet once the item is answered or routed. */
  outcome: string;
  viaSync?: boolean;
  /** The readable exchange for the focus pane, in order. */
  thread: ThreadLine[];
};

export type Automation = {
  platform: PlatformId;
  type: "dm" | "reply";
  keyword: string;
  /** Trigger words as saved in the automation (Keyword → DM needs at least 5, reply at least 3). */
  variations: string[];
};

/**
 * The post's attachment. A video post is one clip on every network: it plays where the mockup
 * shows video natively (the IG Reel) and its own poster frame is the cover everywhere else
 * (thumbnails, Facebook / Threads / X cards), so no surface implies a different picture.
 * `photo` is the image of a photo post (and the fallback still if a clip has no poster).
 */
export type Media = { chip: string; kind: "video" | "image"; igFormat: "reel" | "feed"; photo: PhotoId; video?: VideoId };

export type Script = {
  id: "drop" | "hours" | "restock" | "tour" | "visitor";
  label: string;
  post: string;
  media: Media | null;
  /** Comment automations attached to the published post (added from its Automations button). */
  automations: Automation[];
  items: Record<PlatformId, ScriptItem>;
  /** Order in which the eight lines write back. */
  inboundOrder: PlatformId[];
  /** Focus-pane scenes: first answer, agent close-up, hand-off. */
  scenes: { first: PlatformId; agent?: PlatformId; handoff?: PlatformId };
  /** One teammate reply typed in the same bar, sent on that thread's own channel only. */
  reply: { platform: PlatformId; text: string; outcome: string; mode: string; markDone?: boolean };
  ledger: string;
  /** Visitor runs only. */
  visitor?: {
    warnings: Partial<Record<PlatformId, string>>;
    keywordNote?: string;
    hint?: string;
  };
};
