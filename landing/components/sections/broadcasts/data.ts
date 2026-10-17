import { publishTargets } from "@/lib/capabilities";
import type { PlatformId } from "@/lib/platforms";

import type { ThumbSource } from "../automations/brand";

/**
 * §05 content. Publishing covers exactly the five live targets in lib/capabilities
 * (no WhatsApp); LinkedIn is text only; per-network caption limits come from the app.
 */

export const targets = publishTargets;

export const networkLabel: Partial<Record<PlatformId, string>> = {
  instagram: "Instagram",
  facebook: "Facebook Page",
  threads: "Threads",
  x: "X",
  linkedin: "LinkedIn",
};

/** Caption limits the composer warns at. */
export const captionLimit: Partial<Record<PlatformId, number>> = {
  instagram: 2200,
  facebook: 63206,
  threads: 500,
  x: 280,
  linkedin: 3000,
};

/** 212 characters. */
export const caption =
  "Drop 04 is live: linen overshirts in five colours, cut a little roomier this season. Free returns for 30 days, sizes XS–XXL, and the size guide is pinned up top. Comment LINK below and we'll DM you the shop link.";

/** 100 more characters, so the demo crosses X's 280 (312 used). */
export const overflow = " P.S. The first 50 orders get a hand-stamped tote and a care card. Restocks go to followers first! 🙌";

export type BoardStatus = "SCHEDULED" | "PROCESSING" | "PUBLISHED" | "FAILED" | "PARTIALLY FAILED" | "IMPORTED";

export type BoardRow = {
  id: string;
  time: string;
  network: PlatformId;
  format: string;
  /** Characters used / limit, or null when the row shows no count. */
  count: string | null;
  /** Status the row starts with and ends with. Published rows start SCHEDULED and flip at a scroll threshold. */
  from: BoardStatus;
  to: BoardStatus;
  /** Scroll threshold (board progress) at which the row flips; null rows never flip. */
  flipAt: number | null;
  imported?: boolean;
  /** The listing's media, shown as a thumbnail. Absent for text-only listings (LinkedIn). */
  media?: ThumbSource;
};

export const boardRows: BoardRow[] = [
  { id: "ig", time: "09:00", network: "instagram", format: "Reel", count: "212/2,200", from: "SCHEDULED", to: "PUBLISHED", flipAt: 0.45, media: "reel" },
  { id: "fb", time: "09:00", network: "facebook", format: "Video", count: "212/63,206", from: "SCHEDULED", to: "PUBLISHED", flipAt: 0.45, media: "reel" },
  { id: "th", time: "09:00", network: "threads", format: "Video", count: "212/500", from: "SCHEDULED", to: "PUBLISHED", flipAt: 0.55, media: "reel" },
  { id: "x", time: "09:00", network: "x", format: "Post + 1 video", count: "212/280", from: "SCHEDULED", to: "PUBLISHED", flipAt: 0.55, media: "reel" },
  { id: "li", time: "09:00", network: "linkedin", format: "Text post", count: "212/3,000", from: "SCHEDULED", to: "PUBLISHED", flipAt: 0.65 },
  { id: "story", time: "18:30", network: "instagram", format: "Story", count: null, from: "SCHEDULED", to: "SCHEDULED", flipAt: null, media: "linenHangers" },
  { id: "imp-ig", time: "—", network: "instagram", format: "Carousel", count: null, from: "IMPORTED", to: "IMPORTED", flipAt: null, imported: true, media: "boutique" },
  { id: "imp-fb", time: "—", network: "facebook", format: "Photo", count: null, from: "IMPORTED", to: "IMPORTED", flipAt: null, imported: true, media: "greenLinen" },
];

/** Board progress at which imported rows slide in. */
export const importAt = 0.55;

export type Engagement = { network: PlatformId; actions: string; automations?: boolean };

/** What you can do on a published post, per network (facts: Broadcast post page). Six words or fewer each. */
export const engagement: Engagement[] = [
  { network: "instagram", actions: "Reply, like, hide or delete comments", automations: true },
  { network: "facebook", actions: "Reply, like, edit or delete comments" },
  { network: "threads", actions: "Reply, or delete your own replies" },
  { network: "x", actions: "Answer mentions and DMs in Inbox" },
  { network: "linkedin", actions: "Answer Page comments in Inbox" },
];
