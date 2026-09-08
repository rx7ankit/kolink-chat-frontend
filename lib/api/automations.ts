import type { ChannelId } from "@/lib/mock";
import type { Automation } from "@/lib/mock";

import { api, workspacePath } from "./client";

export type ApiAutomation = {
  id: string;
  workspace_id: string;
  name: string;
  trigger: string;
  channels: string[];
  status: "live" | "paused" | "draft";
  sent: number;
  clicked: number;
  updated_at: string;
  flow?: { nodes?: unknown[]; edges?: unknown[] };
};

export type ApiKeyword = {
  id: string;
  phrase: string;
  flow_name: string;
  channel: string;
  hits: number;
};

export type ApiSequence = {
  id: string;
  name: string;
  step_count: number;
  subscribers: number;
  status: string;
};

export type ApiRule = {
  id: string;
  name: string;
  condition: string;
  action: string;
};

export type ApiBasic = {
  id: string;
  name: string;
  channel: string;
  detail: string;
};

export type ApiTemplate = {
  id: string;
  slug: string;
  name: string;
  description: string;
  channel: string;
  category: string;
  trigger: string;
};

export function toUiAutomation(row: ApiAutomation): Automation {
  return {
    id: row.id,
    name: row.name,
    trigger: row.trigger,
    channels: row.channels as ChannelId[],
    status: row.status,
    sent: row.sent,
    clicked: row.clicked,
    updatedAt: row.updated_at.slice(0, 10),
  };
}

export async function listAutomations() {
  const rows = await api<ApiAutomation[]>(workspacePath("/automations"));
  return rows.map(toUiAutomation);
}

export async function createAutomation(data: {
  name: string;
  trigger?: string;
  channels?: string[];
}) {
  return api<ApiAutomation>(workspacePath("/automations"), {
    method: "POST",
    body: data,
  });
}

export async function getAutomation(id: string) {
  return api<ApiAutomation>(workspacePath(`/automations/${id}`));
}

export async function toggleAutomation(id: string) {
  return api<ApiAutomation>(workspacePath(`/automations/${id}/toggle`), { method: "POST" });
}

export async function publishAutomation(id: string) {
  return api<ApiAutomation>(workspacePath(`/automations/${id}/publish`), { method: "POST" });
}

export async function saveAutomationFlow(id: string, flow: { nodes: unknown[]; edges: unknown[] }) {
  return api<ApiAutomation>(workspacePath(`/automations/${id}/flow`), {
    method: "PUT",
    body: flow,
  });
}

export async function listKeywords() {
  return api<ApiKeyword[]>(workspacePath("/keywords"));
}

export async function createKeyword(data: { phrase: string; flow_name: string; channel: string }) {
  return api<ApiKeyword>(workspacePath("/keywords"), { method: "POST", body: data });
}

export async function listSequences() {
  return api<ApiSequence[]>(workspacePath("/sequences"));
}

export async function createSequence(data: { name: string; step_count?: number; status?: string }) {
  return api<ApiSequence>(workspacePath("/sequences"), { method: "POST", body: data });
}

export async function listRules() {
  return api<ApiRule[]>(workspacePath("/rules"));
}

export async function createRule(data: { name: string; condition: string; action: string }) {
  return api<ApiRule>(workspacePath("/rules"), { method: "POST", body: data });
}

export async function listBasicAutomations() {
  return api<ApiBasic[]>(workspacePath("/automations/basic"));
}

export async function listTemplates() {
  return api<ApiTemplate[]>(workspacePath("/templates"));
}

export async function useTemplate(templateId: string) {
  return api<ApiAutomation>(workspacePath(`/templates/${templateId}/use`), { method: "POST" });
}
