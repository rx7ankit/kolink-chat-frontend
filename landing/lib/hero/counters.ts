import { publishTargets } from "@/lib/capabilities";
import type { PlatformId } from "@/lib/platforms";

import type { Media } from "./types";

/**
 * Caption limits and counting, ported from the app's Broadcast composer
 * (frontend/lib/publish.ts: PUBLISH_PLATFORMS + captionWarnings). The app counts
 * `body.length`, so the demo does too.
 */
export const captionLimits: Partial<Record<PlatformId, number>> = {
  instagram: 2200,
  facebook: 63206,
  threads: 500,
  x: 280,
  linkedin: 3000,
};

const limitLabel: Partial<Record<PlatformId, string>> = {
  instagram: "Instagram",
  facebook: "Facebook Page",
  threads: "Threads",
  x: "X",
  linkedin: "LinkedIn",
};

export const MAX_POST = 320;

export function captionLength(body: string) {
  return body.length;
}

const fmt = (n: number) => n.toLocaleString("en-US");

/** The product's own warning text, e.g. "X supports 280 characters (312 used)". */
export function captionWarning(platform: PlatformId, body: string): string | null {
  const limit = captionLimits[platform];
  const length = captionLength(body);
  if (!limit || length <= limit) return null;
  return `${limitLabel[platform]} supports ${fmt(limit)} characters (${fmt(length)} used)`;
}

/** Native format each network publishes, shown on its row after fan-out. */
export function publishFormat(platform: PlatformId, body: string, media: Media | null): string {
  const n = captionLength(body);
  const kind = media?.kind;
  switch (platform) {
    case "instagram":
      if (!media) return "Needs a photo or video";
      return media.igFormat === "reel" ? "Reel" : "Feed photo";
    case "facebook":
      return kind === "video" ? "Video post" : kind === "image" ? "Photo post" : "Text post";
    case "threads":
      return `${kind === "video" ? "Video" : kind === "image" ? "Image" : "Text"} · ${n}/500`;
    case "x":
      return `Post${kind ? ` + 1 ${kind}` : ""} · ${n}/280`;
    case "linkedin":
      return kind ? `Text post · ${kind} not included` : "Text post";
    default:
      return "";
  }
}

export type PublishTag = { platform: PlatformId; label: string; warn?: boolean };

/** One tag per publish line: its native format, or the over-limit warning (that line gets no packet). */
export function publishTags(body: string, media: Media | null): PublishTag[] {
  return publishTargets.map((p) => {
    const warn = captionWarning(p, body);
    return warn ? { platform: p, label: warn, warn: true } : { platform: p, label: publishFormat(p, body, media) };
  });
}

export type CounterCell = { label: string; used?: number; limit?: number; over?: boolean };

/**
 * The live counter row under the composer: the two limits a short post can actually hit,
 * "X 52/280 · Threads 52/500" (LinkedIn's text-only rule is on the draft's own chips).
 */
export function counterRow(body: string): CounterCell[] {
  const n = captionLength(body);
  return [
    { label: "X", used: n, limit: 280, over: n > 280 },
    { label: "Threads", used: n, limit: 500, over: n > 500 },
  ];
}
