import { api, getToken, getWorkspaceId, workspacePath } from "./client";
import { API_URL } from "./url";

export type AutoreplyMode = "off" | "menu" | "agentic";

export type AutoreplySource = {
  id: string;
  kind: string;
  title: string;
  status: string;
  filename: string | null;
  source_url: string | null;
  error: string | null;
  chunk_ready: boolean;
  created_at: string;
};

export type AutoreplyPlatform = {
  channel: "instagram" | "messenger";
  label: string;
  mode: AutoreplyMode;
  max_chars: number;
};

export type AutoreplyHome = {
  status: string;
  step: string;
  persona: Record<string, string>;
  messages: { role: string; text: string }[];
  sources: AutoreplySource[];
  platforms: AutoreplyPlatform[];
};

export function getAutoreply() {
  return api<AutoreplyHome>(workspacePath("/autoreply"));
}

export function sendAutoreplyTurn(message: string) {
  return api<AutoreplyHome>(workspacePath("/autoreply/onboarding"), {
    method: "POST",
    body: { message },
  });
}

export function addAutoreplySource(data: {
  kind: string;
  title: string;
  content?: string;
  url?: string;
  rows?: Record<string, string>[];
}) {
  return api<AutoreplySource>(workspacePath("/autoreply/knowledge"), { method: "POST", body: data });
}

export async function uploadAutoreplySource(file: File, kind: string, title: string) {
  const workspaceId = getWorkspaceId();
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const query = new URLSearchParams({ kind, title });
  const response = await fetch(`${API_URL}/workspaces/${workspaceId}/autoreply/knowledge/upload?${query}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : "Upload failed");
  }
  return (await response.json()) as AutoreplySource;
}

export function deleteAutoreplySource(id: string) {
  return api<{ detail: string }>(workspacePath(`/autoreply/knowledge/${id}`), { method: "DELETE" });
}

export function setAutoreplyPlatform(channel: string, mode: AutoreplyMode) {
  return api<AutoreplyPlatform>(workspacePath(`/autoreply/platforms/${channel}`), {
    method: "PUT",
    body: { mode },
  });
}
