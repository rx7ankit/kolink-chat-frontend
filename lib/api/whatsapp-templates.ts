import { api, workspacePath } from "./client";

export type TemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";

export type TemplateButton = {
  type?: string;
  text?: string;
  url?: string;
  phone_number?: string;
};

export type TemplateComponent = {
  type: string;
  format?: string;
  text?: string;
  example?: Record<string, unknown>;
  buttons?: TemplateButton[];
};

export type WhatsAppTemplate = {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  components: TemplateComponent[];
  header: string;
  body: string;
  footer: string;
  buttons: TemplateButton[];
  rejected_reason: string | null;
};

export type WhatsAppTemplateList = {
  waba_id: string;
  templates: WhatsAppTemplate[];
  total: number;
  max_active: number;
};

export type WhatsAppTemplateGroup = {
  id: string;
  name: string;
  description: string;
  template_count: number;
};

export type WhatsAppTemplateGroupList = {
  waba_id: string;
  groups: WhatsAppTemplateGroup[];
  supported: boolean;
};

export type LibraryTemplate = {
  id: string;
  name: string;
  language: string;
  category: string;
  topic: string;
  usecase: string;
  industry: string[];
  header: string;
  body: string;
  footer: string;
  buttons: TemplateButton[];
  body_params: string[];
};

const BASE = "/channels/whatsapp";

export async function listWhatsAppTemplates() {
  return api<WhatsAppTemplateList>(workspacePath(`${BASE}/message-templates`));
}

export async function createWhatsAppTemplate(input: {
  name: string;
  language: string;
  category: TemplateCategory;
  components: TemplateComponent[];
  allow_category_change?: boolean;
}) {
  return api<WhatsAppTemplate>(workspacePath(`${BASE}/message-templates`), {
    method: "POST",
    body: input,
  });
}

export async function deleteWhatsAppTemplate(name: string, templateId?: string) {
  const params = new URLSearchParams({ name });
  if (templateId) params.set("template_id", templateId);
  return api<{ detail: string }>(workspacePath(`${BASE}/message-templates?${params.toString()}`), {
    method: "DELETE",
  });
}

export async function listWhatsAppTemplateGroups() {
  return api<WhatsAppTemplateGroupList>(workspacePath(`${BASE}/template-groups`));
}

export async function createWhatsAppTemplateGroup(input: {
  name: string;
  description?: string;
  template_ids?: string[];
}) {
  return api<WhatsAppTemplateGroup>(workspacePath(`${BASE}/template-groups`), {
    method: "POST",
    body: input,
  });
}

export async function browseTemplateLibrary(filters: {
  search?: string;
  topic?: string;
  usecase?: string;
  industry?: string;
  language?: string;
} = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return api<LibraryTemplate[]>(
    workspacePath(`${BASE}/template-library${query ? `?${query}` : ""}`),
  );
}

export async function importLibraryTemplate(input: {
  library_template_name: string;
  name?: string;
  language?: string;
  category?: TemplateCategory;
}) {
  return api<WhatsAppTemplate>(workspacePath(`${BASE}/template-library/import`), {
    method: "POST",
    body: input,
  });
}
