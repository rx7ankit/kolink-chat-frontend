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

export function isDeletedBroadcast(row: ApiBroadcast | { detail: string }): row is ApiBroadcast {
  return "status" in row && row.status === "deleted";
}

export async function purgeDemoBroadcasts() {
  return api<{ detail: string }>(workspacePath("/broadcasts/purge-demo"), { method: "POST" });
}

export async function purgeAllBroadcasts() {
  return api<{ detail: string }>(workspacePath("/broadcasts/purge-all"), { method: "POST" });
}
