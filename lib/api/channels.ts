import { api, workspacePath } from "./client";

export type ChannelProfileSummary = {
  name: string | null;
  username: string | null;
  picture_url: string | null;
  followers_count: number | null;
  verified: boolean;
  category: string | null;
  page_name: string | null;
};

export type ChannelProfile = {
  channel: string;
  name: string | null;
  username: string | null;
  picture_url: string | null;
  biography: string | null;
  followers_count: number | null;
  follows_count: number | null;
  media_count: number | null;
  website: string | null;
  category: string | null;
  page_name: string | null;
  profile_url: string | null;
  verified: boolean;
};

export type ApiChannel = {
  id: string;
  workspace_id: string;
  channel: string;
  external_id: string | null;
  handle: string | null;
  status: string;
  capabilities: string[];
  connected: boolean;
  profile: ChannelProfileSummary | null;
  last_webhook_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listChannels() {
  return api<ApiChannel[]>(workspacePath("/channels"));
}

export async function getChannelProfile(channel: string, refresh = false) {
  const query = refresh ? "?refresh=true" : "";
  return api<ChannelProfile>(workspacePath(`/channels/${channel}/profile${query}`));
}

export async function connectChannelDev(channel: string) {
  return api<ApiChannel>(workspacePath(`/channels/${channel}/connect/dev`), {
    method: "POST",
  });
}

export async function connectWhatsApp() {
  return api<ApiChannel>(workspacePath("/channels/whatsapp/connect"), {
    method: "POST",
    body: {},
  });
}

export type TelegramLoginStartOut = {
  phone: string;
  detail: string;
};

export type TelegramLoginVerifyOut = {
  connected: boolean;
  needs_password: boolean;
  channel: ApiChannel | null;
};

export async function startTelegramLogin(phone: string) {
  return api<TelegramLoginStartOut>(workspacePath("/channels/telegram/login/start"), {
    method: "POST",
    body: { phone },
  });
}

export async function verifyTelegramLogin(code: string) {
  return api<TelegramLoginVerifyOut>(workspacePath("/channels/telegram/login/verify"), {
    method: "POST",
    body: { code },
  });
}

export async function confirmTelegramPassword(password: string) {
  return api<TelegramLoginVerifyOut>(workspacePath("/channels/telegram/login/password"), {
    method: "POST",
    body: { password },
  });
}

export async function disconnectChannel(channel: string) {
  return api<ApiChannel>(workspacePath(`/channels/${channel}`), {
    method: "PATCH",
    body: { connected: false },
  });
}

export async function disconnectAllChannels() {
  return api<ApiChannel[]>(workspacePath("/channels/disconnect-all"), {
    method: "POST",
  });
}

export async function startChannelOAuth(
  channel: string,
  opts?: { login?: "instagram" | "facebook"; pageId?: string },
) {
  const params = new URLSearchParams();
  if (opts?.login) params.set("login", opts.login);
  if (opts?.pageId) params.set("page_id", opts.pageId);
  const query = params.toString() ? `?${params.toString()}` : "";
  return api<{ url: string; provider: string; channel: string; redirect_uri: string }>(
    workspacePath(`/channels/${channel}/connect/start${query}`),
    { method: "POST" },
  );
}

export type MetaProbe = {
  configured: boolean;
  ok: boolean;
  missing: string[];
  next_step: string;
  details: Record<string, unknown>;
};

export type MetaStatus = {
  graph_version: string;
  webhook_path: string;
  webhook_callback_url?: string;
  verify_token_set: boolean;
  oauth_redirects: Record<string, string>;
  app: MetaProbe;
  whatsapp: MetaProbe;
  page: MetaProbe;
  instagram: MetaProbe;
};

export async function getMetaStatus() {
  return api<MetaStatus>(workspacePath("/channels/meta/status"));
}

export async function sendWhatsAppTest(to: string, body: string) {
  return api<{ message_id: string; to: string }>(workspacePath("/channels/whatsapp/test-send"), {
    method: "POST",
    body: { to, body },
  });
}

export async function syncChannel(channel: string) {
  return api<{ detail: string }>(workspacePath(`/channels/${channel}/sync`), {
    method: "POST",
  });
}

export type ChannelInsightsMetric = {
  name: string;
  period: string;
  values?: Array<{ value: number | Record<string, number>; end_time?: string }>;
  total_value?: { value?: number };
  title?: string;
  description?: string;
};

export type ChannelInsights = {
  data: ChannelInsightsMetric[];
  warnings?: string[];
};

/** @deprecated Use ChannelInsightsMetric */
export type InstagramInsightsMetric = ChannelInsightsMetric;
/** @deprecated Use ChannelInsights */
export type InstagramInsights = ChannelInsights;

export async function getInstagramInsights() {
  return api<ChannelInsights>(workspacePath("/channels/instagram/insights"));
}

export async function getFacebookInsights() {
  return api<ChannelInsights>(workspacePath("/channels/facebook/insights"));
}
