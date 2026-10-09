export type AutomationPlatform = "instagram" | "facebook" | "threads";
export type AutomationKind = "keyword_dm" | "keyword_reply" | "keyword_delete";

export const AUTOMATION_PLATFORMS: { value: AutomationPlatform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "threads", label: "Threads" },
];

export const KIND_LABELS: Record<AutomationKind, string> = {
  keyword_dm: "Keyword to DM + reply",
  keyword_reply: "Keyword to reply",
  keyword_delete: "Keyword to delete",
};

export const KIND_DESCRIPTIONS: Record<AutomationKind, string> = {
  keyword_dm:
    "When someone comments a trigger word, reply on the post and DM them what you promised. Followers-only optional.",
  keyword_reply: "When someone comments a trigger word, post a public reply under that comment.",
  keyword_delete: "When someone comments a trigger word, automatically delete that comment. Needs at least 3 words.",
};

const SUPPORTED: Record<AutomationPlatform, AutomationKind[]> = {
  instagram: ["keyword_dm", "keyword_reply", "keyword_delete"],
  facebook: ["keyword_reply", "keyword_delete"],
  threads: ["keyword_reply", "keyword_delete"],
};

export const KIND_BADGE: Record<AutomationKind, "sky" | "mint" | "rose"> = {
  keyword_dm: "sky",
  keyword_reply: "mint",
  keyword_delete: "rose",
};

export function isAutomationPlatform(value: string | null | undefined): value is AutomationPlatform {
  return value === "instagram" || value === "facebook" || value === "threads";
}

export function isAutomationKind(value: string | null | undefined): value is AutomationKind {
  return value === "keyword_dm" || value === "keyword_reply" || value === "keyword_delete";
}

export function kindsFor(platform: AutomationPlatform): AutomationKind[] {
  return SUPPORTED[platform];
}

export function minKeywordsFor(kind: AutomationKind): number {
  return kind === "keyword_dm" ? 5 : 3;
}

export function platformLabel(platform: string): string {
  return AUTOMATION_PLATFORMS.find((item) => item.value === platform)?.label || platform;
}

export type CommentAutomationRef = {
  id: string;
  kind: AutomationKind | string;
  platform: AutomationPlatform | string;
};

export function newAutomationHref(opts: {
  platform: AutomationPlatform;
  kind?: AutomationKind;
  media?: string | null;
  fromBroadcast?: boolean;
}) {
  const params = new URLSearchParams({ platform: opts.platform });
  if (opts.kind) params.set("kind", opts.kind);
  if (opts.media) params.set("media", opts.media);
  if (opts.fromBroadcast) params.set("from", "broadcast");
  return `/automations/new?${params.toString()}`;
}

export function existingAutomationHref(id: string) {
  return `/automations/ig/${id}`;
}
