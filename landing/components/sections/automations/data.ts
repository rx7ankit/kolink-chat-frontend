/**
 * §04 content. Copy follows the section spec; behaviour follows the product facts
 * (Keyword → DM + reply is Instagram-only, one reward per person per post, follow
 * check runs after the tap, Facebook and Threads get reply/delete only).
 */

import type { PhotoId } from "@/lib/media";

/** The Drop 04 reel's caption (§04 post card). */
export const postCaption = "Drop 04 is live: linen overshirts in five colours 🌿 Comment LINK and we'll DM you the shop link.";

export const triggerWords = ["link", "early", "access", "send", "🔗"];

export const messages = {
  publicReply: "Thanks for commenting! Just sent you a DM 📩",
  opener: "Thanks for commenting! Tap below and I'll send it over 👇",
  openerButton: "Send me the link",
  followPrompt: "Looks like you're not following yet 👀 Follow us, wait a second, then tap below and I'll send it.",
  followButton: "I followed",
  reward: "Here's your link!",
  rewardButton: "Open link",
};

/* ------------------------------------------------------------------ scene */

export type Route = "deliver" | "inbox" | "notyet" | "followed" | "skip";

/** Checkpoints a run passes through, in order. The last one is the beat's resting state. */
export const routePhases = {
  deliver: ["matched", "replied", "opener", "tapped", "checking", "gateUp", "delivered"],
  notyet: ["matched", "replied", "opener", "tapped", "checking", "asked"],
  followed: ["waiting", "tapped", "checking", "gateUp", "delivered"],
  inbox: ["incoming", "sorted", "routed"],
  skip: ["matched", "skipped"],
} as const satisfies Record<Route, readonly string[]>;

export type Phase = (typeof routePhases)[Route][number];

export type StreamComment = {
  id: string;
  handle: string;
  text: string;
  /** [start, end) of the matched keyword inside `text`, for the highlighter. */
  hl?: [number, number];
};

export const streamComments: StreamComment[] = [
  { id: "c1", handle: "linen.lover", text: "link pls 🙏", hl: [0, 4] },
  { id: "c2", handle: "weekend.shopper", text: "love this!" },
  { id: "c3", handle: "oat.and.ash", text: "LINK!!", hl: [0, 4] },
  { id: "c4", handle: "linen.lover", text: "link", hl: [0, 4] },
  { id: "c5", handle: "studio.fan", text: "linkplease", hl: [0, 4] },
];

export type Beat = { comment: string; route: Route; note: string; summary: string };

/** One beat per step (step 1 = beats[0]). */
export const beats: Beat[] = [
  {
    comment: "c1",
    route: "deliver",
    note: "Matched “link” · follows you",
    summary: "@linen.lover commented “link pls”. It matched “link”: public reply, DM opener, tap, follow confirmed, link delivered.",
  },
  {
    comment: "c2",
    route: "inbox",
    note: "No trigger word · to Inbox",
    summary: "@weekend.shopper commented “love this!”. No trigger word, so it went to Inbox › Comments for your team.",
  },
  {
    comment: "c3",
    route: "notyet",
    note: "Matched · not following yet",
    summary: "@oat.and.ash commented “LINK!!”. It matched, but they don't follow you yet, so they were asked to follow.",
  },
  {
    comment: "c3",
    route: "followed",
    note: "Tapped “I followed” · confirmed",
    summary: "@oat.and.ash tapped “I followed”. The follow was confirmed and the link was delivered.",
  },
  {
    comment: "c4",
    route: "skip",
    note: "Repeat · one reward per post",
    summary: "@linen.lover commented “link” again. Skipped: one reward per person per post.",
  },
  {
    comment: "c5",
    route: "deliver",
    note: "“linkplease” contains “link”",
    summary: "@studio.fan commented “linkplease”. It contains “link”, so the link was delivered.",
  },
];

export const LAST_STEP = beats.length;

/** Scroll progress (0–1 through the pin) at which each step starts. */
export const stepThresholds = [0.04, 0.19, 0.35, 0.51, 0.66, 0.8];

/** Autoplay hold per beat (ms, before the Studio pace multiplier) when the scene is not pinned. */
export const beatHoldMs: Record<Route, number> = {
  deliver: 2900,
  inbox: 1900,
  notyet: 2700,
  followed: 2500,
  skip: 1900,
};

export function stepFor(progress: number) {
  let step = 0;
  for (const t of stepThresholds) if (progress >= t) step++;
  return step;
}

export const finalPhase = (route: Route): Phase => {
  const list = routePhases[route];
  return list[list.length - 1];
};

export function reached(route: Route, phase: Phase, target: Phase) {
  const list = routePhases[route] as readonly Phase[];
  const at = list.indexOf(phase);
  const goal = list.indexOf(target);
  return goal >= 0 && at >= goal;
}

const WAITING_TAP = "DM SENT · WAITING FOR TAP";

export function statusFor(route: Route, phase: Phase): string {
  switch (route) {
    case "deliver":
      if (phase === "delivered") return "DELIVERED";
      return reached(route, phase, "opener") ? WAITING_TAP : "MATCHED";
    case "notyet":
      if (phase === "asked") return "WAITING TO FOLLOW";
      return reached(route, phase, "opener") ? WAITING_TAP : "MATCHED";
    case "followed":
      return phase === "delivered" ? "DELIVERED" : "WAITING TO FOLLOW";
    case "inbox":
      return phase === "routed" ? "INBOX › COMMENTS" : "NO MATCH";
    case "skip":
      return phase === "skipped" ? "SKIPPED · REPEAT" : "MATCHED";
  }
}

/* ------------------------------------------------------------- activity */

export type ActivityRow = {
  handle: string;
  comment: string;
  keyword: string;
  status: string;
};

export const activity: ActivityRow[] = [
  { handle: "linen.lover", comment: "link pls 🙏", keyword: "link", status: "DELIVERED" },
  { handle: "oat.and.ash", comment: "LINK!!", keyword: "link", status: "DELIVERED" },
  { handle: "linen.lover", comment: "link", keyword: "link", status: "SKIPPED" },
  { handle: "field.notes", comment: "early access?", keyword: "early", status: "WAITING TO FOLLOW" },
  { handle: "hello.marta", comment: "send it pls", keyword: "send", status: "FAILED" },
];

/* -------------------------------------------------------------- results */

/** One automation's funnel. Demo numbers, stamped as such where they render. */
export const results = [
  { label: "Matched", value: 412 },
  { label: "DMs sent", value: 398 },
  { label: "Delivered", value: 341 },
];

/* ------------------------------------------------- facebook / threads */

/** Keyword → reply, shown on a Threads post (handles, like Threads shows them). */
export const replyDemo = {
  post: { photo: "linenDrop" as PhotoId, kind: "Threads post · Drop 04" },
  keyword: "size",
  comment: { handle: "greenhouse.jo", text: "what SIZE should I get?", hl: [5, 9] as [number, number] },
  reply: "Sizes run true, so order your usual. The size chart is in our bio 🌿",
};

/** Keyword → delete, shown on a Facebook Page post (Facebook shows people's names, not handles). */
export const deleteDemo = {
  post: { photo: "greenLinen" as PhotoId, kind: "Page post · Green linen" },
  words: ["crypto", "dm me", "promo"],
  keep: { name: "Olivia D’Souza", text: "does it come in olive?" },
  spam: { name: "Promo Deals 77", text: "dm me for crypto promo 🚀", hl: [10, 16] as [number, number] },
};
