import { publishTargets } from "@/lib/capabilities";
import { demoBrand, type PhotoId } from "@/lib/media";
import type { PlatformId } from "@/lib/platforms";

import { captionWarning, MAX_POST } from "./counters";
import { answerDm } from "./demo-knowledge";
import { cleanKeywords, matchKeyword, normalizeKeyword } from "./keywords";
import type { Media, Script, ScriptItem, ThreadLine } from "./types";

/**
 * The in-browser router for a visitor's own post. Pure and deterministic:
 * the same text always routes the same way. Nothing is posted or sent.
 */

export function sanitizePost(raw: string) {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_POST);
}

/** The 2–20 letter/digit word after "comment", optional quotes allowed. */
const KEYWORD_RE = /\bcomment\s+["“'‘]?([\p{L}\p{N}]{2,20})["”'’]?/iu;

export function findKeyword(post: string): string | null {
  const m = post.match(KEYWORD_RE);
  return m ? m[1] : null;
}

type Intent = "launch" | "hours" | "restock" | "welcome";

const AT = `@${demoBrand.handle}`;

/** The sample photo attached to a visitor's post, picked by what the post is about. */
const samplePhoto: Record<Intent, PhotoId> = {
  launch: "linenHangers",
  hours: "shopWindow",
  restock: "planters",
  welcome: "greenLinen",
};

/**
 * The attachment of a visitor's post, by intent: one stable object per intent, so the composer
 * and the draft preview can follow the draft as it is typed without re-rendering per keystroke.
 */
export const visitorMedia = Object.fromEntries(
  (Object.keys(samplePhoto) as Intent[]).map((k) => [k, { chip: "sample-photo.jpg", kind: "image", igFormat: "feed", photo: samplePhoto[k] }]),
) as Record<Intent, Media>;

export function intentOf(post: string): Intent {
  const t = post.toLowerCase();
  if (/\b(drop|launch|new|live)\b/.test(t)) return "launch";
  if (/\b(open|hours|weekend)\b/.test(t)) return "hours";
  if (/\b(back|restock)\b/.test(t)) return "restock";
  return "welcome";
}

type InboundSet = {
  comments: { instagram: string; facebook: string; threads: string };
  x: string;
  linkedin: string;
  messenger: string;
  whatsapp: string;
  gmail: string;
  reply: { platform: "gmail" | "whatsapp" | "x"; text: string };
};

const sets: Record<Intent, InboundSet> = {
  launch: {
    comments: { instagram: "when does it ship? 😍", facebook: "Is there a size guide?", threads: "obsessed with this" },
    x: `${AT} is this restocking soon?`,
    linkedin: "Congrats on the launch!",
    messenger: "how much is it?",
    whatsapp: "Can I pre-order?",
    gmail: "Press enquiry about your launch",
    reply: { platform: "gmail", text: "Thanks! Replying with details in this thread today." },
  },
  hours: {
    comments: { instagram: "see you saturday!", facebook: "open sunday too?", threads: "is there parking nearby?" },
    x: `${AT} saturday pickup possible?`,
    linkedin: "Congrats on the new studio!",
    messenger: "what are your timimgs?",
    whatsapp: "Can I change my delivery address?",
    gmail: "Invoice for order #2041",
    reply: { platform: "whatsapp", text: "Yes! Send the new address here and we'll update it." },
  },
  restock: {
    comments: { instagram: "finally!! 🙌", facebook: "Do you have the large size?", threads: "back in green too?" },
    x: `${AT} do the large ones have drainage holes?`,
    linkedin: "Do you do bulk orders for offices?",
    messenger: "do you take returns?",
    whatsapp: "Any update on the restock?",
    gmail: "Wholesale order for 40 units",
    reply: { platform: "whatsapp", text: "It's live today! Want the link?" },
  },
  welcome: {
    comments: { instagram: "love this 😍", facebook: "love the new look!", threads: "hi from Pune 👋" },
    x: `${AT} do you ship outside India?`,
    linkedin: "Great storefront.",
    messenger: "hi!",
    whatsapp: "thank you so much, you guys are the best!",
    gmail: "Wholesale catalogue?",
    reply: { platform: "x", text: "Not yet, India only for now." },
  },
};

const replyMeta: Record<InboundSet["reply"]["platform"], { mode: string; outcome: string }> = {
  gmail: { mode: "REPLY → GMAIL THREAD", outcome: "Team · sent in the Gmail thread" },
  whatsapp: { mode: "REPLY → WHATSAPP CHAT", outcome: "Team · sent as WhatsApp session text" },
  x: { mode: "REPLY → X MENTION", outcome: "Team · sent as a mention reply" },
};

function teamItem(platform: PlatformId, kind: ScriptItem["kind"], who: string, text: string, where: string): ScriptItem {
  return {
    platform,
    kind,
    handler: "team",
    arrives: `${who} · “${text}”`,
    status: "INBOX",
    outcome: `${where.replace(/^Inbox › /, "")} · waiting for a teammate`,
    thread: [
      { k: "them", who, text, onPost: kind === "comment" ? "post" : undefined },
      { k: "note", text: `↳ ${where} · waiting for a teammate` },
    ],
  };
}

export function routePost(raw: string): Script {
  const post = sanitizePost(raw);
  const intent = intentOf(post);
  const set = sets[intent];
  const keyword = findKeyword(post);
  const kw = keyword ? keyword.toLowerCase() : null;

  const warnings: Partial<Record<PlatformId, string>> = {};
  for (const p of publishTargets) {
    const w = captionWarning(p, post);
    if (w) warnings[p] = w;
  }

  const items = {} as Record<PlatformId, ScriptItem>;
  const automations: Script["automations"] = [];

  if (kw) {
    const short = [...normalizeKeyword(kw)].length < 3;
    const dmWords = cleanKeywords([kw, `${kw}s`, `${kw} pls`, `send ${kw}`, `${kw} please`]);
    const replyWords = cleanKeywords([kw, `${kw}s`, `${kw} pls`]);
    automations.push({ platform: "instagram", type: "dm", keyword: kw.toUpperCase(), variations: dmWords });
    automations.push({ platform: "facebook", type: "reply", keyword: kw.toUpperCase(), variations: replyWords });
    automations.push({ platform: "threads", type: "reply", keyword: kw.toUpperCase(), variations: replyWords });

    const igComment = short ? kw : `${kw} pls`;
    const fbComment = short ? kw.toUpperCase() : `${kw.toUpperCase()}!!`;
    const thComment = `${kw}${kw.slice(-1)}`;
    const note = `↳ keyword “${kw}”`;

    const igHit = matchKeyword(igComment, dmWords);
    items.instagram = igHit
      ? {
          platform: "instagram",
          kind: "comment",
          handler: "automation",
          arrives: `Comment on your post · “${igComment}”`,
          status: "AUTOMATION",
          outcome: "Public reply + DM · Delivered",
          thread: [
            { k: "them", who: "@new.friend · comment on your post", onPost: "post", text: igComment, highlight: kw, note },
            { k: "us", by: "automation", via: "Public reply", text: "Thanks for commenting! Just sent you a DM 📩" },
            {
              k: "us",
              by: "automation",
              via: "DM",
              text: "Thanks for commenting! Tap below and I'll send it over 👇",
              buttons: ["Send me the link"],
              status: "DM SENT · TAP",
            },
            { k: "tap", text: "Send me the link", status: "CHECKING FOLLOW" },
            { k: "us", by: "automation", via: "DM", text: "Here you go! 👇", buttons: ["Open link"], status: "DELIVERED" },
          ],
        }
      : teamItem("instagram", "comment", "Comment on your post", igComment, "Inbox › Comments");

    const fbHit = matchKeyword(fbComment, replyWords);
    items.facebook = fbHit
      ? {
          platform: "facebook",
          kind: "comment",
          handler: "automation",
          arrives: `Comment on your Page post · “${fbComment}”`,
          status: "AUTOMATION",
          outcome: "Replied: “Thanks! The details are pinned at the top…”",
          thread: [
            { k: "them", who: "Comment on your Page post", onPost: "post", text: fbComment, highlight: kw.toUpperCase(), note },
            // Facebook automations are keyword reply/delete only (no DM), so the reply stays public and self-contained.
            { k: "us", by: "automation", via: "Public reply", text: "Thanks! The details are pinned at the top of this post 👆" },
          ],
        }
      : teamItem("facebook", "comment", "Comment on your Page post", fbComment, "Inbox › Comments");

    const thHit = matchKeyword(thComment, replyWords);
    items.threads = thHit
      ? {
          platform: "threads",
          kind: "comment",
          handler: "automation",
          viaSync: true,
          arrives: `Thread reply · “${thComment}” · via sync`,
          status: "AUTOMATION",
          outcome: "Replied: “It's in the first reply of this thread 🧵”",
          thread: [
            {
              k: "them",
              who: "Reply to your thread · picked up on sync",
              onPost: "post",
              text: thComment,
              highlight: thComment,
              note: `↳ repeated letters still match “${kw}”`,
            },
            { k: "us", by: "automation", via: "Public reply", text: "It's in the first reply of this thread 🧵" },
          ],
        }
      : { ...teamItem("threads", "comment", "Reply to your thread", thComment, "Inbox › Comments"), viaSync: true };
  } else {
    items.instagram = teamItem("instagram", "comment", "Comment on your post", set.comments.instagram, "Inbox › Comments");
    items.facebook = teamItem("facebook", "comment", "Comment on your Page post", set.comments.facebook, "Inbox › Comments");
    items.threads = {
      ...teamItem("threads", "comment", "Reply to your thread", set.comments.threads, "Inbox › Comments"),
      viaSync: true,
    };
  }

  items.x = teamItem("x", "mention", "Mention", set.x, "Inbox › Unassigned");
  items.linkedin = teamItem("linkedin", "comment", "Company Page comment", set.linkedin, "Inbox › Comments");
  items.whatsapp = teamItem("whatsapp", "chat", "WhatsApp chat", set.whatsapp, "Inbox › Unassigned");
  items.gmail = teamItem("gmail", "email", "Email · Primary", set.gmail, "Inbox › Email");

  const answer = answerDm(set.messenger);
  const escalates = answer.kind === "handoff" || answer.kind === "escalate";
  const agentLine: ThreadLine = {
    k: "us",
    by: "agent",
    via: answer.kind === "catalog" ? "Catalog · no model call" : escalates ? "Hand-off" : "Agentic",
    text: answer.reply,
    cards: answer.cards,
    buttons: answer.cards ? ["Next"] : undefined,
    reveal: answer.cards ? undefined : "words",
    note: answer.note,
  };
  items.messenger = {
    platform: "messenger",
    kind: "dm",
    handler: escalates ? "attention" : "agent",
    arrives: `DM · “${set.messenger}”`,
    status: "AGENT",
    outcome: escalates ? "Handed off to your team" : `Agent: “${answer.reply.length > 48 ? `${answer.reply.slice(0, 46)}…` : answer.reply}”`,
    thread: [
      { k: "them", who: "Messenger DM", text: set.messenger },
      ...(answer.cards ? [] : [{ k: "typing" } as ThreadLine]),
      agentLine,
      ...(escalates
        ? [{ k: "handoff", handoff: { asked: set.messenger, tried: "—", why: answer.why ?? "knowledge missing" } } as ThreadLine]
        : []),
    ],
  };

  // Ledger: one sentence, zero parts left out.
  const list = Object.values(items);
  const count = (h: ScriptItem["handler"]) => list.filter((i) => i.handler === h).length;
  const parts = ["8 in"];
  const auto = count("automation");
  if (auto) parts.push(`${auto} by ${auto === 1 ? "an automation" : "automations"}`);
  if (count("agent")) parts.push(`${count("agent")} by the agent`);
  if (count("attention")) parts.push(`${count("attention")} needs attention`);
  if (count("team")) parts.push(`${count("team")} to your team`);
  parts.push("1 replied from the composer");

  const replyTo = set.reply.platform;
  const replyItem = items[replyTo];
  // The reply thread shows only the customer's message; the teammate's answer is added when it is sent.
  replyItem.thread = replyItem.thread.filter((l) => l.k === "them");

  return {
    id: "visitor",
    label: "Your post",
    post,
    media: visitorMedia[intent],
    automations,
    items,
    inboundOrder: ["instagram", "messenger", "facebook", "gmail", "threads", "x", "whatsapp", "linkedin"],
    scenes: {
      first: kw && items.instagram.handler === "automation" ? "instagram" : "messenger",
      agent: "messenger",
      handoff: escalates ? "messenger" : undefined,
    },
    reply: { platform: replyTo, text: set.reply.text, ...replyMeta[replyTo] },
    ledger: parts.join(" · "),
    visitor: {
      warnings,
      keywordNote: kw ? `Demo: as if you'd added a Keyword → DM automation for “${kw.toUpperCase()}” after publishing` : undefined,
      hint: kw ? undefined : "Add “Comment LINK” to see comment-to-DM",
    },
  };
}
