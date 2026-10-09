import { api, workspacePath } from "./client";

export type IgResponse = {
  text: string;
  link_url: string | null;
  link_title: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
};

export type IgAutomationConfig = {
  opener_text: string;
  opener_button: string;
  follow_prompt: string;
  follow_button: string;
  response: IgResponse;
  greetings: string[];
  comment_replies: string[];
};

export type IgAutomationStats = {
  matched: number;
  comment_replies: number;
  dms_sent: number;
  delivered: number;
  waiting_follow: number;
  skipped: number;
  failed: number;
};

export type IgAutomation = {
  id: string;
  name: string;
  media_id: string;
  media_type: string | null;
  media_product_type: string | null;
  permalink: string | null;
  caption: string | null;
  posted_at: string | null;
  thumbnail_url: string | null;
  from_broadcast: boolean;
  broadcast_id: string | null;
  account_handle: string | null;
  enabled: boolean;
  keywords: string[];
  follow_required: boolean;
  comment_reply_enabled: boolean;
  config: IgAutomationConfig;
  stats: IgAutomationStats;
  created_at: string;
  updated_at: string;
};

export type IgMediaItem = {
  id: string;
  caption: string | null;
  media_type: string | null;
  media_product_type: string | null;
  permalink: string | null;
  timestamp: string | null;
  comments_count: number | null;
  preview_url: string | null;
  automation_id: string | null;
  broadcast_id: string | null;
};

export type IgMediaPage = { items: IgMediaItem[]; next: string | null; account_handle: string | null };

export type IgRun = {
  id: string;
  commenter_username: string | null;
  comment_text: string;
  matched_keyword: string | null;
  is_primary: boolean;
  state: string;
  public_reply_status: string;
  follow_checks: number;
  error: string | null;
  created_at: string;
  delivered_at: string | null;
};

export type IgAutomationInput = {
  media_id: string;
  name?: string | null;
  keywords: string[];
  follow_required: boolean;
  comment_reply_enabled: boolean;
  enabled?: boolean;
  config: IgAutomationConfig;
};

export type IgAutomationPatch = Partial<Omit<IgAutomationInput, "media_id">>;

export const DEFAULT_CONFIG: IgAutomationConfig = {
  opener_text: "Thanks for commenting! Tap below and I'll send it over 👇",
  opener_button: "Send me the link",
  follow_prompt: "Looks like you're not following yet 👀 Follow us, wait a second, then tap below and I'll send it.",
  follow_button: "I followed",
  response: { text: "", link_url: null, link_title: "Open link", media_url: null, media_type: null },
  greetings: [],
  comment_replies: ["Thanks for commenting! Just sent you a DM 📩"],
};

const BASE = "/ig-automations";

export function listIgAutomations() {
  return api<IgAutomation[]>(workspacePath(BASE));
}

export function getIgAutomation(id: string) {
  return api<IgAutomation>(workspacePath(`${BASE}/${id}`));
}

export function listIgMedia(after?: string | null) {
  const query = after ? `?after=${encodeURIComponent(after)}` : "";
  return api<IgMediaPage>(workspacePath(`${BASE}/media${query}`));
}

export function createIgAutomation(data: IgAutomationInput) {
  return api<IgAutomation>(workspacePath(BASE), { method: "POST", body: data });
}

export function updateIgAutomation(id: string, data: IgAutomationPatch) {
  return api<IgAutomation>(workspacePath(`${BASE}/${id}`), { method: "PATCH", body: data });
}

export function deleteIgAutomation(id: string) {
  return api<{ detail: string }>(workspacePath(`${BASE}/${id}`), { method: "DELETE" });
}

export function duplicateIgAutomation(id: string, mediaId: string) {
  return api<IgAutomation>(workspacePath(`${BASE}/${id}/duplicate`), {
    method: "POST",
    body: { media_id: mediaId },
  });
}

export function listIgRuns(id: string) {
  return api<IgRun[]>(workspacePath(`${BASE}/${id}/runs`));
}

export function isReel(item: { media_product_type: string | null }) {
  return ["REELS", "CLIPS"].includes((item.media_product_type || "").toUpperCase());
}
