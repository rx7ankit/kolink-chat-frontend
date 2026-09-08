import type { ChannelId, Contact } from "@/lib/mock";

import { api, ApiError, workspacePath } from "./client";
import type { Page } from "./inbox";
import { isDirectoryContact, toUiContact, type ApiContact } from "./inbox";

export type { ApiContact };
export { toUiContact };

export type TagRow = { name: string; count: number };
export type SegmentRow = { id: string; name: string; count: number };

export async function listContacts(params: {
  q?: string;
  channel?: string;
  tag?: string;
  segment?: string;
  page?: number;
  pageSize?: number;
}) {
  const pageSize = params.pageSize ?? 8;
  const current = params.page ?? 1;
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set("q", params.q.trim());
  if (params.channel && params.channel !== "all") query.set("channel", params.channel);
  if (params.tag && params.tag !== "all") query.set("tag", params.tag);
  if (params.segment && params.segment !== "all") query.set("segment", params.segment);
  query.set("page", "1");
  query.set("page_size", "100");
  const page = await api<Page<ApiContact>>(workspacePath(`/contacts?${query.toString()}`));
  const items = page.items
    .filter((row) => {
      const flag = row.custom_fields?.in_directory;
      if (flag === false || flag === "false") return false;
      return isDirectoryContact({
        channel: row.channel,
        email: row.email ?? undefined,
        handle: row.handle ?? undefined,
        name: row.name,
      });
    })
    .map(toUiContact);
  const start = (current - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page: current,
    page_size: pageSize,
    page_count: Math.max(1, Math.ceil(items.length / pageSize) || 1),
  };
}

export async function createContact(data: {
  name: string;
  channel: ChannelId;
  handle?: string;
  email?: string;
  phone?: string;
  city?: string;
  language?: string;
  notes?: string;
  tags?: string[];
}) {
  const row = await api<ApiContact>(workspacePath("/contacts"), {
    method: "POST",
    body: data,
  });
  return toUiContact(row);
}

export async function updateContact(
  id: string,
  data: {
    name?: string;
    handle?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    language?: string | null;
    status?: "subscribed" | "unsubscribed";
    tags?: string[];
    notes?: string | null;
  },
) {
  const row = await api<ApiContact>(workspacePath(`/contacts/${id}`), {
    method: "PATCH",
    body: data,
  });
  return toUiContact(row);
}

export async function deleteContact(id: string) {
  return api<{ detail: string }>(workspacePath(`/contacts/${id}`), {
    method: "DELETE",
  });
}

export async function getContact(id: string): Promise<Contact> {
  const row = await api<ApiContact>(workspacePath(`/contacts/${id}`));
  return toUiContact(row);
}

export async function listTags() {
  return api<TagRow[]>(workspacePath("/tags"));
}

export async function listSegments() {
  return api<SegmentRow[]>(workspacePath("/segments"));
}

export async function bulkTagContacts(contactIds: string[], tag: string) {
  return api<{ detail: string }>(workspacePath("/contacts/bulk/tags"), {
    method: "POST",
    body: { contact_ids: contactIds, tag },
  });
}

export async function bulkUnsubscribeContacts(contactIds: string[]) {
  return api<{ detail: string }>(workspacePath("/contacts/bulk/unsubscribe"), {
    method: "POST",
    body: { contact_ids: contactIds },
  });
}

export async function bulkDeleteContacts(contactIds: string[]) {
  try {
    return await api<{ detail: string }>(workspacePath("/contacts/bulk/delete"), {
      method: "POST",
      body: { contact_ids: contactIds },
    });
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 405)) {
      throw error;
    }
    let deleted = 0;
    for (const id of contactIds) {
      await deleteContact(id);
      deleted += 1;
    }
    return { detail: `Deleted ${deleted} contacts` };
  }
}

export type ContactThread = {
  id: string;
  channel: ChannelId;
  preview: string;
  updatedAt: string;
};

export async function listContactConversations(contactId: string): Promise<ContactThread[]> {
  const query = new URLSearchParams({
    contact_id: contactId,
    folder: "all",
    page_size: "50",
  });
  const page = await api<
    Page<{
      id: string;
      channel: string;
      preview: string;
      updated_at: string;
    }>
  >(workspacePath(`/conversations?${query.toString()}`));
  return page.items.map((row) => ({
    id: row.id,
    channel: row.channel as ChannelId,
    preview: row.preview,
    updatedAt: row.updated_at,
  }));
}
