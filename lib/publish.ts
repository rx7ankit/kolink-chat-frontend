import type { ChannelId } from "@/lib/mock";

export type PublishPlatformId = "instagram" | "facebook" | "threads" | "whatsapp" | "x" | "linkedin";

export type PostMode = "social_post" | "audience_dm";
export type PostType = "feed" | "reel" | "story" | "carousel";
export type BroadcastStatus =
  | "draft"
  | "scheduled"
  | "processing"
  | "published"
  | "failed"
  | "partially_failed"
  | "deleted";
export type PlatformRunStatus = "pending" | "scheduled" | "processing" | "published" | "failed" | "deleted";

export type PlatformStatus = {
  status: PlatformRunStatus;
  external_id: string | null;
  permalink: string | null;
  error: string | null;
  simulated?: boolean;
  container_id?: string | null;
};

export const PUBLISH_PLATFORMS: {
  id: PublishPlatformId;
  label: string;
  captionLimit: number;
}[] = [
  { id: "instagram", label: "Instagram", captionLimit: 2200 },
  { id: "facebook", label: "Facebook Page", captionLimit: 63206 },
  { id: "threads", label: "Threads", captionLimit: 500 },
  { id: "whatsapp", label: "WhatsApp", captionLimit: 4096 },
  { id: "x", label: "X", captionLimit: 280 },
  { id: "linkedin", label: "LinkedIn", captionLimit: 3000 },
];

export const POST_TYPES: { id: PostType; label: string }[] = [
  { id: "feed", label: "Feed" },
  { id: "reel", label: "Reel" },
  { id: "story", label: "Story" },
  { id: "carousel", label: "Carousel" },
];

export function availablePostTypes(platforms: PublishPlatformId[]) {
  if (platforms.includes("instagram")) return POST_TYPES;
  return POST_TYPES.filter((item) => item.id === "feed");
}

export function audienceDmSupported(platforms: PublishPlatformId[]) {
  return !platforms.includes("threads") && !platforms.includes("x") && !platforms.includes("linkedin");
}

export function threadsTextOnlyOk(platforms: PublishPlatformId[]) {
  return platforms.includes("threads") || platforms.includes("x") || platforms.includes("linkedin");
}

export function isPublishPlatform(value: string): value is PublishPlatformId {
  return PUBLISH_PLATFORMS.some((item) => item.id === value);
}

export function asChannelId(platform: string): ChannelId {
  return platform as ChannelId;
}

export function sortPlatformsForSelector(connected: Set<string>) {
  return [...PUBLISH_PLATFORMS].sort((a, b) => {
    const ac = connected.has(a.id) ? 0 : 1;
    const bc = connected.has(b.id) ? 0 : 1;
    if (ac !== bc) return ac - bc;
    return 0;
  });
}

export function detectMediaKind(url: string): "image" | "video" {
  const path = url.split("?")[0].toLowerCase();
  if (url.startsWith("data:video/") || /\.(mp4|mov|webm|m4v|avi)$/.test(path)) return "video";
  return "image";
}

export function captionWarnings(body: string, platforms: string[]) {
  const length = body.length;
  return PUBLISH_PLATFORMS.filter((item) => platforms.includes(item.id) && length > item.captionLimit).map(
    (item) => `${item.label} supports ${item.captionLimit.toLocaleString()} characters (${length.toLocaleString()} used)`,
  );
}

export function overallBadgeVariant(status: BroadcastStatus | string) {
  if (status === "published" || status === "sent") return "mint" as const;
  if (status === "scheduled" || status === "processing") return "sky" as const;
  if (status === "failed" || status === "partially_failed") return "rose" as const;
  if (status === "deleted") return "muted" as const;
  return "muted" as const;
}

export function statusLabel(status: string) {
  if (status === "partially_failed") return "Partially failed";
  if (status === "social_post") return "Social post";
  if (status === "audience_dm") return "Audience DM";
  if (status === "sent") return "published";
  if (status === "deleted") return "Deleted";
  return status.replaceAll("_", " ");
}
