import type { ChannelId, ChatMessage, Contact, Conversation, InboxLabel } from "@/lib/mock";

import { api, ApiError, getToken, getWorkspaceId, workspacePath } from "./client";
import type { TeamMember } from "./team";
import { API_URL } from "./url";

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  page_count: number;
};

export type ApiLabel = InboxLabel & { workspace_id: string };

export type ApiContact = {
  id: string;
  name: string;
  handle: string | null;
  email: string | null;
  phone: string | null;
  channel: string;
  city: string | null;
  language: string | null;
  status: string;
  tags: string[];
  custom_fields: Record<string, unknown>;
  notes: string | null;
  updated_at: string;
};

export type ApiMessage = {
  id: string;
  conversation_id: string;
  sender: ChatMessage["from"];
  body: string;
  author_user_id: string | null;
  delivery_status?: string;
  content_type?: string;
  media_url?: string | null;
  created_at: string;
  subject?: string | null;
  html_body?: string | null;
  gmail_category?: string | null;
};

export type ApiConversation = {
  id: string;
  workspace_id: string;
  contact_id: string;
  channel: string;
  thread_kind?: "dm" | "comment" | "post";
  state: "open" | "closed";
  assigned_to_user_id: string | null;
  preview: string;
  unread_count: number;
  automations_paused: boolean;
  labels: ApiLabel[];
  contact: ApiContact;
  messages: ApiMessage[];
  created_at: string;
  updated_at: string;
  subject?: string | null;
  gmail_category?: string | null;
};

export type CannedResponse = {
  id: string;
  shortcut: string;
  text: string;
};

export type InboxSettings = {
  workspace_id: string;
  auto_assign: boolean;
  pause_after_reply_seconds: number;
};

export type InboxThread = Conversation & {
  assignedToUserId: string | null;
  contact: Contact;
};

const INTERNAL_CONTACT_FIELDS = new Set([
  "deleted_message_ids",
  "_deleted_message_ids",
  "_profile_fetched_at",
  "in_directory",
]);

export function toUiContact(row: ApiContact): Contact {
  const custom = row.custom_fields ?? {};
  const pic = typeof custom.profile_picture_url === "string" ? custom.profile_picture_url : undefined;
  const fields = Object.fromEntries(
    Object.entries(custom)
      .filter(([key, value]) => {
        if (key.startsWith("_") || INTERNAL_CONTACT_FIELDS.has(key)) return false;
        if (value == null) return false;
        if (typeof value === "object") return false;
        return true;
      })
      .map(([key, value]) => [key, String(value)]),
  );
  const channel = row.channel as ChannelId;
  const rawHandle = row.handle ?? "";
  const hideNumericHandle =
    (channel === "messenger" || channel === "facebook") && /^\d{8,}$/.test(rawHandle.trim());
  const vanity = typeof custom.linkedin_vanity === "string" ? custom.linkedin_vanity.replace(/^@/, "") : "";
  const hideLinkedInId =
    channel === "linkedin" && /^[A-Z0-9_-]{8,16}$/.test(rawHandle.trim()) && /\d/.test(rawHandle);
  return {
    id: row.id,
    name: row.name,
    handle: hideNumericHandle ? "" : hideLinkedInId ? (vanity ? `@${vanity}` : "") : rawHandle,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    channel: row.channel as ChannelId,
    tags: row.tags,
    status: row.status === "unsubscribed" ? "unsubscribed" : "subscribed",
    lastSeen: row.updated_at,
    city: row.city ?? "",
    language: row.language ?? "",
    fields,
    notes: row.notes ?? "",
    avatarUrl: pic,
  };
}

export function assigneeName(
  userId: string | null,
  currentUserId: string | undefined,
  members: TeamMember[],
) {
  if (!userId) return null;
  if (currentUserId && userId === currentUserId) return "You";
  return members.find((member) => member.user_id === userId)?.full_name ?? "Agent";
}

export function isPromoEmail(thread: {
  gmailCategory?: string | null;
  channel?: string;
  preview?: string;
  subject?: string;
  contact?: { email?: string; handle?: string; name?: string } | null;
}) {
  if (thread.channel && thread.channel !== "email") return false;
  const category = (thread.gmailCategory || "").toLowerCase();
  if (category === "promotions" || category === "social") return true;
  const email = (thread.contact?.email || thread.contact?.handle || "").toLowerCase();
  const name = (thread.contact?.name || "").toLowerCase();
  const subject = (thread.subject || "").toLowerCase();
  const preview = (thread.preview || "").toLowerCase();
  const blob = `${email} ${name} ${subject} ${preview}`;
  const domain = email.includes("@") ? email.split("@").pop() || "" : "";
  const local = email.includes("@") ? email.split("@")[0] || "" : "";
  if (email.includes("accounts.google.com") || email.endsWith("@google.com") || domain.endsWith(".google.com")) {
    return false;
  }
  const personal = new Set([
    "gmail.com",
    "googlemail.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "yahoo.com",
    "icloud.com",
    "me.com",
    "proton.me",
    "protonmail.com",
  ]);
  if (["pinterest", "sketchfab", "kitbash", "mailchimp", "substack"].some((item) => blob.includes(item))) {
    return true;
  }
  const promoDomains = [
    "pinterest.com",
    "sketchfab.com",
    "kitbash3d.com",
    "artstation.com",
    "behance.net",
    "dribbble.com",
    "linkedin.com",
    "spotify.com",
    "mailchimp.com",
    "substack.com",
  ];
  if (promoDomains.some((item) => domain === item || domain.endsWith(`.${item}`))) return true;
  const promoLocal = new Set([
    "recommendations",
    "newsletter",
    "news",
    "digest",
    "deals",
    "offers",
    "promo",
    "promotions",
    "marketing",
    "discover",
    "explore",
    "inspire",
    "hello",
    "hi",
    "team",
    "info",
    "mailer",
    "updates",
    "community",
    "studio",
    "noreply",
    "no-reply",
    "no_reply",
    "donotreply",
    "notifications",
  ]);
  if (!personal.has(domain) && (promoLocal.has(local) || /^(no[\._-]?reply|do[\._-]?not[\._-]?reply)/.test(local))) {
    return true;
  }
  return false;
}

export function isDirectoryContact(contact: {
  channel?: string;
  email?: string;
  handle?: string;
  name?: string;
  fields?: Record<string, string>;
}) {
  if (contact.channel && contact.channel !== "email") return true;
  if (contact.fields?.in_directory === "false") return false;
  const email = (contact.email || contact.handle || "").toLowerCase();
  const domain = email.includes("@") ? email.split("@").pop() || "" : "";
  const local = email.includes("@") ? email.split("@")[0] || "" : "";
  if (domain === "accounts.google.com" || domain === "google.com" || domain.endsWith(".google.com")) {
    return false;
  }
  if (/^(no[\._-]?reply|do[\._-]?not[\._-]?reply|donotreply|mailer-daemon)$/.test(local)) {
    return false;
  }
  return !isPromoEmail({ channel: "email", contact, subject: "", preview: "" });
}

export function toInboxThread(
  row: ApiConversation,
  currentUserId: string | undefined,
  members: TeamMember[],
): InboxThread {
  return {
    id: row.id,
    contactId: row.contact_id,
    channel: row.channel as ChannelId,
    threadKind: row.thread_kind ?? "dm",
    preview: row.preview,
    unread: row.unread_count,
    state: row.state,
    assignedTo: assigneeName(row.assigned_to_user_id, currentUserId, members),
    assignedToUserId: row.assigned_to_user_id,
    labels: row.labels.map((label) => label.name),
    paused: row.automations_paused,
    updatedAt: row.updated_at,
    messages: row.messages.map((message) => ({
      id: message.id,
      from: message.sender,
      text: message.body,
      at: message.created_at,
      contentType: message.content_type,
      mediaUrl: message.media_url ?? undefined,
      deliveryStatus: message.delivery_status,
      status:
        message.delivery_status === "queued"
          ? "sending"
          : message.delivery_status === "failed"
            ? "failed"
            : "sent",
      subject: message.subject ?? undefined,
      htmlBody: message.html_body ?? undefined,
      gmailCategory: message.gmail_category ?? undefined,
    })),
    contact: toUiContact(row.contact),
    subject: row.subject ?? undefined,
    gmailCategory: row.gmail_category ?? undefined,
  };
}

export async function listConversations(params: {
  folder?: string;
  labelId?: string | null;
  channel?: string;
  contactId?: string;
  q?: string;
  emailTab?: string;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  if (params.folder) query.set("folder", params.folder);
  if (params.labelId) query.set("label_id", params.labelId);
  if (params.channel && params.channel !== "all") query.set("channel", params.channel);
  if (params.contactId) query.set("contact_id", params.contactId);
  if (params.q?.trim()) query.set("q", params.q.trim());
  if (params.channel === "email") query.set("email_tab", params.emailTab || "all");
  query.set("page_size", String(params.pageSize ?? 50));
  try {
    return await api<Page<ApiConversation>>(workspacePath(`/conversations?${query.toString()}`));
  } catch (error) {
    if (error instanceof ApiError && error.status === 422 && query.has("email_tab")) {
      query.delete("email_tab");
      return api<Page<ApiConversation>>(workspacePath(`/conversations?${query.toString()}`));
    }
    throw error;
  }
}

export async function getConversation(id: string, opts?: { refreshProfile?: boolean }) {
  const query = opts?.refreshProfile ? "?refresh_profile=true" : "";
  return api<ApiConversation>(workspacePath(`/conversations/${id}${query}`));
}

export async function patchConversation(
  id: string,
  data: {
    state?: "open" | "closed";
    assigned_to_user_id?: string | null;
    automations_paused?: boolean;
    gmail_category?: "primary" | "promotions";
  },
) {
  return api<ApiConversation>(workspacePath(`/conversations/${id}`), {
    method: "PATCH",
    body: data,
  });
}

export async function deleteConversation(id: string) {
  return api<{ detail: string }>(workspacePath(`/conversations/${id}`), {
    method: "DELETE",
  });
}

export async function getInboxRevision() {
  return api<{ revision: string }>(workspacePath("/inbox/revision"));
}

export async function uploadInboxFile(file: File) {
  const workspaceId = getWorkspaceId();
  const token = getToken();
  if (!workspaceId) throw new Error("No workspace selected");

  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/workspaces/${workspaceId}/uploads`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = (await res.json()) as { detail?: string };
      if (data.detail) detail = data.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail || "Upload failed");
  }
  return (await res.json()) as { url: string; content_type: string };
}

export async function sendMessage(
  id: string,
  body: string,
  opts?: { mediaUrl?: string; contentType?: string; replyToMessageId?: string },
) {
  return api<ApiMessage>(workspacePath(`/conversations/${id}/messages`), {
    method: "POST",
    body: {
      body,
      sender: "agent",
      content_type: opts?.contentType ?? "text",
      media_url: opts?.mediaUrl ?? null,
      reply_to_message_id: opts?.replyToMessageId ?? null,
    },
  });
}

export async function deleteMessage(conversationId: string, messageId: string) {
  return api<{ detail: string }>(workspacePath(`/conversations/${conversationId}/messages/${messageId}`), {
    method: "DELETE",
  });
}

export async function patchMessage(conversationId: string, messageId: string, body: string) {
  return api<ApiMessage>(workspacePath(`/conversations/${conversationId}/messages/${messageId}`), {
    method: "PATCH",
    body: { body },
  });
}

export async function hideMessage(conversationId: string, messageId: string) {
  return api<ApiMessage>(workspacePath(`/conversations/${conversationId}/messages/${messageId}/hide`), {
    method: "POST",
  });
}

export async function listLabels() {
  return api<ApiLabel[]>(workspacePath("/labels"));
}

export async function createLabel(name: string, color: string) {
  return api<ApiLabel>(workspacePath("/labels"), {
    method: "POST",
    body: { name, color },
  });
}

export async function listCannedResponses() {
  return api<CannedResponse[]>(workspacePath("/canned-responses"));
}

export async function createCannedResponse(shortcut: string, text: string) {
  return api<CannedResponse>(workspacePath("/canned-responses"), {
    method: "POST",
    body: { shortcut, text },
  });
}

export async function getInboxSettings() {
  return api<InboxSettings>(workspacePath("/inbox-settings"));
}

export async function patchInboxSettings(data: Partial<Pick<InboxSettings, "auto_assign" | "pause_after_reply_seconds">>) {
  return api<InboxSettings>(workspacePath("/inbox-settings"), {
    method: "PATCH",
    body: data,
  });
}
