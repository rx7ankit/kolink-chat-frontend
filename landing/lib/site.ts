export const APP_URL = "https://chat.getkolink.com";

export const links = {
  signup: `${APP_URL}/signup`,
  login: `${APP_URL}/login`,
  privacy: `${APP_URL}/privacy`,
  terms: `${APP_URL}/terms`,
};

/** In-page anchors, in page order. Section components must use these ids. */
export const sections = [
  { id: "lines", label: "Lines" },
  { id: "agent", label: "Agent" },
  { id: "knowledge", label: "Knowledge" },
  { id: "automations", label: "Automations" },
  { id: "broadcasts", label: "Broadcasts" },
  { id: "inbox", label: "Inbox" },
  { id: "insights", label: "Insights" },
  { id: "toolbox", label: "Workspace" },
  { id: "how", label: "How it works" },
  { id: "start", label: "Get started" },
  { id: "faq", label: "FAQ" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

/** The Design Studio ships in previews; set NEXT_PUBLIC_STUDIO=0 to hide it for launch. */
export const studioEnabled = process.env.NEXT_PUBLIC_STUDIO !== "0";
