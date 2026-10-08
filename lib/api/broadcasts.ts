import type { ChannelId } from "@/lib/mock";
import type { Broadcast } from "@/lib/mock";

import { api, workspacePath } from "./client";
import {
  asChannelId,
  type BroadcastStatus,
  type PlatformStatus,
  type PostMode,
  type PostType,
  type PublishPlatformId,
} from "@/lib/publish";

export type ApiBroadcast = {
  id: string;
  workspace_id: string;
  name: string;
  channel: string;
  platforms: string[];
  post_mode: PostMode;
  post_type: PostType;
  audience_key: string;
  audience_label: string;
  body: string;
  media_urls: string[];
  status: BroadcastStatus;
  schedule_at: string | null;
  platform_statuses: Record<string, PlatformStatus>;
  metrics: Record<string, Record<string, number>>;
  sent: number;
  delivered: number;
  clicked: number;
  created_at: string;
  updated_at: string;
};

export type BroadcastPayload = {
  name: string;
  platforms: string[];
  post_mode: PostMode;
  post_type: PostType;
  audience_key: string;
  body: string;
  media_urls: string[];
  schedule_at?: string | null;
  send_now?: boolean;
  save_draft?: boolean;
};

export function toUiBroadcast(row: ApiBroadcast): Broadcast {
  const platforms = (row.platforms?.length ? row.platforms : [row.channel]) as PublishPlatformId[];
  return {
    id: row.id,
    name: row.name,
    channel: asChannelId(row.channel) as ChannelId,
    platforms,
    postMode: row.post_mode || "social_post",
    postType: row.post_type || "feed",
    body: row.body || "",
    mediaUrls: row.media_urls || [],
    audience: row.audience_label,
    audienceKey: row.audience_key,
    status: row.status,
    platformStatuses: row.platform_statuses || {},
    metrics: row.metrics || {},
    sent: row.sent,
    delivered: row.delivered,
    clicked: row.clicked,
    at: row.schedule_at ?? row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBroadcasts() {
  const rows = await api<ApiBroadcast[]>(workspacePath("/broadcasts"));
  return rows.map(toUiBroadcast);
}

export async function getBroadcast(id: string) {
  const row = await api<ApiBroadcast>(workspacePath(`/broadcasts/${id}`));
  return toUiBroadcast(row);
}

export async function createBroadcast(data: BroadcastPayload) {
  return api<ApiBroadcast>(workspacePath("/broadcasts"), {
    method: "POST",
    body: data,
  });
}

export async function updateBroadcast(id: string, data: Partial<BroadcastPayload>) {
  return api<ApiBroadcast>(workspacePath(`/broadcasts/${id}`), {
    method: "PATCH",
    body: data,
  });
}

export async function sendBroadcast(id: string) {
  return api<ApiBroadcast>(workspacePath(`/broadcasts/${id}/publish`), { method: "POST" });
}

export async function scheduleBroadcast(id: string, when: string) {
  return api<ApiBroadcast>(workspacePath(`/broadcasts/${id}/schedule`), {
    method: "POST",
    body: { when },
  });
}

export async function duplicateBroadcast(id: string) {
  return api<ApiBroadcast>(workspacePath(`/broadcasts/${id}/duplicate`), { method: "POST" });
}

export async function deleteBroadcast(id: string) {
  return api<ApiBroadcast | { detail: string }>(workspacePath(`/broadcasts/${id}`), { method: "DELETE" });
}

export type BroadcastEngagementPlatform = "facebook" | "instagram" | "threads";

export type FacebookBroadcastComment = {
  id: string;
  message: string;
  from_id: string | null;
  from_name: string | null;
  created_time: string | null;
  like_count: number;
  liked: boolean;
  mine: boolean;
  hidden?: boolean;
  parent_id: string | null;
};

export type FacebookBroadcastComments = {
  post_id: string;
  permalink: string | null;
  liked: boolean;
  comments: FacebookBroadcastComment[];
};

function commentsPath(id: string, platform: BroadcastEngagementPlatform, suffix = "") {
  return workspacePath(`/broadcasts/${id}/${platform}/comments${suffix}`);
}

export async function setBroadcastPostLike(id: string, platform: "facebook" | "instagram", liked: boolean) {
  const row = await api<ApiBroadcast>(workspacePath(`/broadcasts/${id}/${platform}/like`), {
    method: "POST",
    body: { liked },
  });
  return toUiBroadcast(row);
}

export async function listBroadcastComments(id: string, platform: BroadcastEngagementPlatform) {
  return api<FacebookBroadcastComments>(commentsPath(id, platform));
}

export async function createBroadcastComment(
  id: string,
  platform: BroadcastEngagementPlatform,
  message: string,
  parentCommentId?: string | null,
) {
  return api<FacebookBroadcastComment>(commentsPath(id, platform), {
    method: "POST",
    body: { message, parent_comment_id: parentCommentId || null },
  });
}

export async function setBroadcastCommentLike(
  id: string,
  platform: "facebook" | "instagram",
  commentId: string,
  liked: boolean,
) {
  return api<{ id: string; liked: boolean }>(
    commentsPath(id, platform, `/${encodeURIComponent(commentId)}/like`),
    { method: "POST", body: { liked } },
  );
}

export async function hideBroadcastComment(id: string, commentId: string) {
  return api<FacebookBroadcastComment>(
    commentsPath(id, "instagram", `/${encodeURIComponent(commentId)}/hide`),
    { method: "POST" },
  );
}

export async function editBroadcastComment(id: string, commentId: string, message: string) {
  return api<FacebookBroadcastComment>(
    commentsPath(id, "facebook", `/${encodeURIComponent(commentId)}`),
    { method: "PATCH", body: { message } },
  );
}

export async function deleteBroadcastComment(id: string, platform: BroadcastEngagementPlatform, commentId: string) {
  return api<{ detail: string }>(commentsPath(id, platform, `/${encodeURIComponent(commentId)}`), {
    method: "DELETE",
  });
}

export async function setFacebookBroadcastLike(id: string, liked: boolean) {
  return setBroadcastPostLike(id, "facebook", liked);
}

export async function listFacebookBroadcastComments(id: string) {
  return listBroadcastComments(id, "facebook");
}

export async function createFacebookBroadcastComment(
  id: string,
  message: string,
  parentCommentId?: string | null,
) {
  return createBroadcastComment(id, "facebook", message, parentCommentId);
}

export async function setFacebookBroadcastCommentLike(id: string, commentId: string, liked: boolean) {
  return setBroadcastCommentLike(id, "facebook", commentId, liked);
}

export async function editFacebookBroadcastComment(id: string, commentId: string, message: string) {
  return editBroadcastComment(id, commentId, message);
}

export async function deleteFacebookBroadcastComment(id: string, commentId: string) {
  return deleteBroadcastComment(id, "facebook", commentId);
}

export function isDeletedBroadcast(row: ApiBroadcast | { detail: string }): row is ApiBroadcast {
  return "status" in row && row.status === "deleted";
}

export function isLiveInstagramBroadcast(item: {
  channel?: string;
  platforms?: string[];
  status?: string;
  postMode?: string;
  platformStatuses?: Record<string, PlatformStatus | undefined>;
}) {
  return isLivePlatformBroadcast(item, "instagram");
}

export function isLiveFacebookBroadcast(item: {
  channel?: string;
  platforms?: string[];
  status?: string;
  postMode?: string;
  platformStatuses?: Record<string, PlatformStatus | undefined>;
}) {
  return isLivePlatformBroadcast(item, "facebook");
}

export function isLiveThreadsBroadcast(item: {
  channel?: string;
  platforms?: string[];
  status?: string;
  postMode?: string;
  platformStatuses?: Record<string, PlatformStatus | undefined>;
}) {
  return isLivePlatformBroadcast(item, "threads");
}

export function isLiveSocialBroadcast(item: {
  channel?: string;
  platforms?: string[];
  status?: string;
  postMode?: string;
  platformStatuses?: Record<string, PlatformStatus | undefined>;
}) {
  return isLiveInstagramBroadcast(item) || isLiveFacebookBroadcast(item) || isLiveThreadsBroadcast(item);
}

function isLivePlatformBroadcast(
  item: {
    channel?: string;
    platforms?: string[];
    status?: string;
    postMode?: string;
    platformStatuses?: Record<string, PlatformStatus | undefined>;
  },
  platform: "instagram" | "facebook" | "threads",
) {
  if ((item.postMode || "social_post") === "audience_dm") return false;
  const platforms = item.platforms?.length ? item.platforms : item.channel ? [item.channel] : [];
  if (!platforms.includes(platform)) return false;
  const rowStatus = item.platformStatuses?.[platform]?.status;
  if (rowStatus === "published" || rowStatus === "deleted") return true;
  return item.status === "published" || item.status === "partially_failed" || item.status === "sent";
}

function liveNetworkNames(item: {
  channel?: string;
  platforms?: string[];
  status?: string;
  postMode?: string;
  platformStatuses?: Record<string, PlatformStatus | undefined>;
}) {
  const names: string[] = [];
  if (isLiveInstagramBroadcast(item)) names.push("Instagram");
  if (isLiveFacebookBroadcast(item)) names.push("Facebook");
  if (isLiveThreadsBroadcast(item)) names.push("Threads");
  return names;
}

function joinNetworkNames(names: string[]) {
  if (names.length <= 1) return names[0] || "this network";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function liveDeleteCopy(item: { name?: string; platforms?: string[]; channel?: string; status?: string; postMode?: string; platformStatuses?: Record<string, PlatformStatus | undefined> }) {
  const networks = joinNetworkNames(liveNetworkNames(item));
  const name = item.name || "this post";
  return {
    dialog: `Remove “${name}” from ${networks}? It will stay in koLink marked as Deleted.`,
    confirm: `Remove this post from ${networks}? It will stay in koLink marked as Deleted.`,
    success: `Removed from ${networks}`,
    fail: `Could not remove the post from ${networks}. The listing was left unchanged.`,
  };
}

export async function purgeDemoBroadcasts() {
  return api<{ detail: string }>(workspacePath("/broadcasts/purge-demo"), { method: "POST" });
}

export async function purgeAllBroadcasts() {
  return api<{ detail: string }>(workspacePath("/broadcasts/purge-all"), { method: "POST" });
}
