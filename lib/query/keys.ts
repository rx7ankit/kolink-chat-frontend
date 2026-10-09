export function workspaceKey(workspaceId: string) {
  return ["ws", workspaceId] as const;
}

export const queryKeys = {
  broadcasts: (ws: string) => [...workspaceKey(ws), "broadcasts"] as const,
  automations: (ws: string) => [...workspaceKey(ws), "automations"] as const,
  igAutomations: (ws: string, platform: string) =>
    [...workspaceKey(ws), "ig-automations", platform] as const,
  contactsRoot: (ws: string) => [...workspaceKey(ws), "contacts"] as const,
  contacts: (
    ws: string,
    filters: { q: string; segment: string; tag: string; channel: string; page: number },
  ) => [...workspaceKey(ws), "contacts", filters] as const,
  contactTags: (ws: string) => [...workspaceKey(ws), "contact-tags"] as const,
  contactSegments: (ws: string) => [...workspaceKey(ws), "contact-segments"] as const,
  channels: (ws: string) => [...workspaceKey(ws), "channels"] as const,
  templates: (ws: string) => [...workspaceKey(ws), "templates"] as const,
  analytics: (ws: string) => [...workspaceKey(ws), "analytics"] as const,
  insights: (ws: string, platform: "instagram" | "facebook" | "threads") =>
    [...workspaceKey(ws), "insights", platform] as const,
  igMedia: (ws: string, platform: string, kind?: string) =>
    [...workspaceKey(ws), "ig-media", platform, kind || ""] as const,
};
