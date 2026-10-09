import { api, getToken, getWorkspaceId, workspacePath } from "./client";
import { API_URL } from "./url";
import type { ApiConversation, Page } from "./inbox";

export type InboxBotMode = "off" | "menu" | "agentic";

export type InboxBotButton = {
  id: string;
  label: string;
  action: "text" | "media" | "card" | "escalate" | "submenu";
  text: string;
  media_url?: string | null;
  children: InboxBotButton[];
};

export type InboxBotConfig = {
  workspace_id: string;
  channel: string;
  mode: InboxBotMode;
  menu: {
    welcome_text: string;
    buttons: InboxBotButton[];
    keywords: { phrase: string; button_id: string }[];
    fallback_text: string;
    fallback_escalate_after: number;
    quiet_hours: {
      enabled: boolean;
      start: string;
      end: string;
      message: string;
      tz: string;
    };
  };
  agentic: {
    brand_voice: string;
    never_promise: string;
    escalate_after_misses: number;
    language: string;
  };
  entitlements: { inbox_menu: boolean; inbox_agentic: boolean; inbox_campaigns: boolean };
  updated_at: string;
};

export type InboxKnowledgeDoc = {
  id: string;
  kind: string;
  title: string;
  content: string;
  rows: Record<string, unknown>[];
  source_filename: string | null;
  created_at: string;
};

export type InboxAttentionSummary = {
  instagram: number;
  messenger: number;
  total: number;
};

export type CampaignPreview = {
  contact_id: string;
  name: string;
  conversation_id: string | null;
  window: "in_24h" | "outside" | "none";
  can_send: boolean;
  reason: string;
};

export type InboxCampaign = {
  id: string;
  channel: string;
  body: string;
  media_url: string | null;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  sent: number;
  skipped: number;
  failed: number;
};

export function getInboxBot(channel: "instagram" | "messenger") {
  return api<InboxBotConfig>(workspacePath(`/inbox/bot/${channel}`));
}

export function saveInboxBot(
  channel: "instagram" | "messenger",
  data: { mode: InboxBotMode; menu?: InboxBotConfig["menu"]; agentic?: InboxBotConfig["agentic"] },
) {
  return api<InboxBotConfig>(workspacePath(`/inbox/bot/${channel}`), { method: "PUT", body: data });
}

export function listInboxKnowledge(channel: "instagram" | "messenger") {
  return api<InboxKnowledgeDoc[]>(workspacePath(`/inbox/bot/${channel}/knowledge`));
}

export function addInboxKnowledge(
  channel: "instagram" | "messenger",
  data: { kind: string; title: string; content: string; rows?: Record<string, unknown>[] },
) {
  return api<InboxKnowledgeDoc>(workspacePath(`/inbox/bot/${channel}/knowledge`), {
    method: "POST",
    body: data,
  });
}

export async function uploadInboxKnowledge(
  channel: "instagram" | "messenger",
  file: File,
  kind: string,
  title: string,
) {
  const workspaceId = getWorkspaceId();
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const query = new URLSearchParams({ kind, title });
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/inbox/bot/${channel}/knowledge/upload?${query}`,
    { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "Upload failed");
  }
  return (await response.json()) as InboxKnowledgeDoc;
}

export function deleteInboxKnowledge(channel: "instagram" | "messenger", id: string) {
  return api<{ detail: string }>(workspacePath(`/inbox/bot/${channel}/knowledge/${id}`), { method: "DELETE" });
}

export function playgroundInboxBot(
  channel: "instagram" | "messenger",
  data: { message: string; history?: { role: string; text: string }[] },
) {
  return api<{ reply: string; escalated: boolean; reason: string; quick_replies: { title: string; payload: string }[] }>(
    workspacePath(`/inbox/bot/${channel}/playground`),
    { method: "POST", body: data },
  );
}

export function getAttentionSummary() {
  return api<InboxAttentionSummary>(workspacePath("/inbox/attention/summary"));
}

export function listAttentionThreads() {
  return api<Page<ApiConversation>>(workspacePath("/inbox/attention"));
}

export function stopBot(conversationId: string) {
  return api<ApiConversation>(workspacePath(`/conversations/${conversationId}/stop-bot`), { method: "POST" });
}

export function resumeBot(conversationId: string) {
  return api<ApiConversation>(workspacePath(`/conversations/${conversationId}/resume-bot`), { method: "POST" });
}

export function markThreadDone(conversationId: string) {
  return api<ApiConversation>(workspacePath(`/conversations/${conversationId}/mark-done`), { method: "POST" });
}

export function previewCampaign(channel: "instagram" | "messenger", contactIds: string[]) {
  return api<CampaignPreview[]>(workspacePath("/inbox/campaigns/preview"), {
    method: "POST",
    body: { channel, contact_ids: contactIds },
  });
}

export function createCampaign(data: {
  channel: "instagram" | "messenger";
  contact_ids: string[];
  body: string;
  media_url?: string;
  send_now: boolean;
  scheduled_at?: string;
}) {
  return api<InboxCampaign>(workspacePath("/inbox/campaigns"), { method: "POST", body: data });
}
