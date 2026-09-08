import { api, workspacePath } from "./client";

export type Invoice = {
  id: string;
  number: string;
  amount_cents: number;
  currency: string;
  status: string;
  issued_at: string;
};

export type Billing = {
  plan: string;
  price_monthly: number;
  active_contacts_used: number;
  active_contacts_limit: number;
  invoices: Invoice[];
};

export type NotifPref = {
  key: string;
  label: string;
  hint: string;
  enabled: boolean;
};

export type Integration = {
  id: string;
  slug: string;
  name: string;
  detail: string;
  connected: boolean;
};

export type CustomField = {
  id: string;
  name: string;
  field_type: string;
  scope: string;
  default_value: string | null;
};

export async function getBilling() {
  return api<Billing>(workspacePath("/billing"));
}

export async function listNotificationPrefs() {
  return api<NotifPref[]>(workspacePath("/notification-prefs"));
}

export async function saveNotificationPrefs(prefs: Record<string, boolean>) {
  return api<NotifPref[]>(workspacePath("/notification-prefs"), {
    method: "PATCH",
    body: { prefs },
  });
}

export async function listIntegrations() {
  return api<Integration[]>(workspacePath("/integrations"));
}

export async function patchIntegration(slug: string, connected: boolean) {
  return api<Integration>(workspacePath(`/integrations/${slug}`), {
    method: "PATCH",
    body: { connected },
  });
}

export async function listCustomFields() {
  return api<CustomField[]>(workspacePath("/custom-fields"));
}

export async function createCustomField(data: {
  name: string;
  field_type?: string;
  scope?: string;
  default_value?: string | null;
}) {
  return api<CustomField>(workspacePath("/custom-fields"), { method: "POST", body: data });
}
