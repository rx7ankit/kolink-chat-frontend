import { api, workspacePath } from "./client";

export type AnalyticsSummary = {
  active_contacts: number;
  net_7d: number;
  messages_7d: number;
  revenue_7d: number;
  open_chats: number;
  live_automations: number;
};

export type DayPoint = { day: string; messages?: number; contacts?: number; net?: number };
export type NamedCount = { name: string; value: number };
export type Conversion = { name: string; count: number; revenue: number };

export type AnalyticsBundle = {
  summary: AnalyticsSummary;
  activity: DayPoint[];
  net_contacts: DayPoint[];
  channel_mix: NamedCount[];
  conversions: Conversion[];
  languages: NamedCount[];
};

export async function getAnalytics() {
  return api<AnalyticsBundle>(workspacePath("/analytics"));
}
