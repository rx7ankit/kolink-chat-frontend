import { catalog, demoBrand } from "@/lib/media";
import type { LookOptionValue } from "@/lib/studio/types";

import type { CatalogCard, Script, ScriptItem } from "./types";

/**
 * The four scripted hero demos. `spec` keeps each scripted string exactly as written;
 * the other fields are the same content split into what the board, rows and focus pane show.
 * Only factual fixes vs the spec: the X counter follows the app's caption count (body.length),
 * so it reads 52/280 for script A, not 53.
 */

const HANDOFF = "We'll connect someone from our team to help you out.";

/** The agent's catalog answer: the first three rows of the demo store's catalog.csv (lib/media). */
export const demoCatalog: CatalogCard[] = ["linen-set", "linen-shirt", "planter"].flatMap((id) => {
  const c = catalog.find((row) => row.id === id);
  return c ? [{ title: c.name, price: c.price, meta: c.note, photo: c.photo }] : [];
});

/** Row snippet for an item left for the team: the status cell already says INBOX, so only the folder. */
const waiting = (where: string) => `${where.replace(/^Inbox › /, "")} · waiting for a teammate`;
const at = `@${demoBrand.handle}`;

/* ------------------------------------------------------------------ A · Drop day */

const drop: Script = {
  id: "drop",
  label: "Drop day",
  post: "Linen drop is live 🌿 Comment LINK for early access.",
  media: { chip: "linen-drop.mp4", kind: "video", igFormat: "reel", photo: "linenDrop", video: "linenReel" },
  automations: [
    { platform: "instagram", type: "dm", keyword: "LINK", variations: ["link", "links", "link pls", "early access", "send link"] },
    { platform: "facebook", type: "reply", keyword: "LINK", variations: ["link", "links", "early access"] },
    { platform: "threads", type: "reply", keyword: "LINK", variations: ["link", "links", "early access"] },
  ],
  inboundOrder: ["instagram", "messenger", "facebook", "gmail", "threads", "x", "whatsapp", "linkedin"],
  scenes: { first: "instagram", agent: "messenger" },
  reply: {
    platform: "gmail",
    text: "Thanks! Sending a quote in this thread today.",
    outcome: "Team · sent in the Gmail thread",
    mode: "REPLY → GMAIL THREAD",
  },
  ledger: "8 in · 3 answered by automations · 1 by the agent · 4 to your team · 1 replied from the composer",
  items: {
    instagram: {
      platform: "instagram",
      kind: "comment",
      handler: "automation",
      spec: {
        incoming: "Comment on your Reel · @linen.lover: “link pls 🙏”",
        reply:
          "AUTOMATION · Keyword → DM + reply (matched “link”, added after publishing) — Public reply: “Thanks for commenting! Just sent you a DM 📩” · DM: “Thanks for commenting! Tap below and I'll send it over 👇” [Send me the link] → tap → follows ✓ → “Here's your early-access link!” [Open link] · Delivered",
      },
      arrives: "Comment on your Reel · “link pls 🙏”",
      status: "AUTOMATION",
      outcome: "Public reply + DM · Delivered",
      thread: [
        { k: "them", who: "@linen.lover · comment on your Reel", onPost: "reel", text: "link pls 🙏", highlight: "link", note: "↳ keyword “link”" },
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
        { k: "us", by: "automation", via: "DM", text: "Here's your early-access link!", buttons: ["Open link"], status: "DELIVERED" },
      ],
    },
    facebook: {
      platform: "facebook",
      kind: "comment",
      handler: "automation",
      spec: {
        incoming: "Comment on your Page post: “LINK”",
        reply: "AUTOMATION · Keyword → reply — “Early access is open. The link is pinned at the top of this post 👆”",
      },
      arrives: "Comment on your Page post · “LINK”",
      status: "AUTOMATION",
      outcome: "Replied: “Early access is open. The link is pinned…”",
      thread: [
        { k: "them", who: "Comment on your Page post", onPost: "post", text: "LINK", highlight: "LINK", note: "↳ keyword “link”" },
        { k: "us", by: "automation", via: "Public reply", text: "Early access is open. The link is pinned at the top of this post 👆" },
      ],
    },
    threads: {
      platform: "threads",
      kind: "comment",
      handler: "automation",
      viaSync: true,
      spec: {
        incoming: "Reply to your thread (picked up on sync): “linkk!!”",
        reply: "AUTOMATION · Keyword → reply (repeated letters still match “link”) — “It's in the first reply of this thread 🧵”",
      },
      arrives: "Thread reply · “linkk!!” · via sync",
      status: "AUTOMATION",
      outcome: "Replied: “It's in the first reply of this thread 🧵”",
      thread: [
        {
          k: "them",
          who: "Reply to your thread · picked up on sync",
          onPost: "post",
          text: "linkk!!",
          highlight: "linkk",
          note: "↳ repeated letters still match “link”",
        },
        { k: "us", by: "automation", via: "Public reply", text: "It's in the first reply of this thread 🧵" },
      ],
    },
    x: {
      platform: "x",
      kind: "mention",
      handler: "team",
      spec: {
        incoming: `Mention: “${at} is the queen size back too?”`,
        reply: "TEAM · Inbox › Unassigned — waiting for a teammate",
      },
      arrives: `Mention · “${at} is the queen size back too?”`,
      status: "INBOX",
      outcome: waiting("Inbox › Unassigned"),
      thread: [
        { k: "them", who: "Mention", text: `${at} is the queen size back too?` },
        { k: "note", text: "↳ Inbox › Unassigned · waiting for a teammate" },
      ],
    },
    linkedin: {
      platform: "linkedin",
      kind: "comment",
      handler: "team",
      spec: {
        incoming: "Comment on your Company Page post: “Do you supply boutique hotels?”",
        reply: "TEAM · Inbox › Comments — waiting for a teammate (replies go out as the organization)",
      },
      arrives: "Company Page comment · “Do you supply boutique hotels?”",
      status: "INBOX",
      outcome: "Comments · you reply as the Page",
      thread: [
        { k: "them", who: "Comment on your Company Page post", text: "Do you supply boutique hotels?" },
        { k: "note", text: "↳ Inbox › Comments · replies go out as the organization" },
      ],
    },
    messenger: {
      platform: "messenger",
      kind: "dm",
      handler: "agent",
      spec: {
        incoming: "DM: “what time are you open on saturday?”",
        reply: "AGENT · Agentic, from knowledge “Hours” — “We're open 10am–7pm, Monday to Saturday.”",
      },
      arrives: "DM · “what time are you open on saturday?”",
      status: "AGENT",
      outcome: "Agent: “We're open 10am–7pm, Monday to Saturday.”",
      thread: [
        { k: "them", who: "Messenger DM", text: "what time are you open on saturday?" },
        { k: "typing" },
        {
          k: "us",
          by: "agent",
          via: "Agentic",
          text: "We're open 10am–7pm, Monday to Saturday.",
          reveal: "words",
          note: "↳ from knowledge: Hours",
        },
      ],
    },
    whatsapp: {
      platform: "whatsapp",
      kind: "chat",
      handler: "team",
      spec: {
        incoming: "Chat: “Is cash on delivery available?”",
        reply: "TEAM · Inbox › Unassigned — waiting for a teammate",
      },
      arrives: "Chat · “Is cash on delivery available?”",
      status: "INBOX",
      outcome: waiting("Inbox › Unassigned"),
      thread: [
        { k: "them", who: "WhatsApp chat", text: "Is cash on delivery available?" },
        { k: "note", text: "↳ Inbox › Unassigned · waiting for a teammate" },
      ],
    },
    gmail: {
      platform: "gmail",
      kind: "email",
      handler: "team",
      spec: {
        incoming: "Email · Primary · “Bulk order: 300 queen sets” — “Could you quote 300 sets for our hotel?”",
        reply:
          "TEAM · Replied from the koLink composer, sent in the same Gmail thread — “Thanks! Sending a quote in this thread today.”",
      },
      arrives: "Email · Primary · “Bulk order: 300 queen sets”",
      status: "INBOX",
      outcome: waiting("Inbox › Email"),
      thread: [{ k: "them", who: "Email · Primary · Bulk order: 300 queen sets", text: "Could you quote 300 sets for our hotel?" }],
    },
  },
};

/* ------------------------------------------------------------------ B · Weekend hours */

const hours: Script = {
  id: "hours",
  label: "Weekend hours",
  post: "Open Saturday, 10 to 7. Questions? DM us 💬",
  media: { chip: "saturday-hours.jpg", kind: "image", igFormat: "feed", photo: "shopWindow" },
  automations: [{ platform: "facebook", type: "reply", keyword: "OPEN", variations: ["open", "opening", "open today"] }],
  inboundOrder: ["facebook", "instagram", "messenger", "x", "threads", "gmail", "linkedin", "whatsapp"],
  scenes: { first: "facebook", agent: "messenger", handoff: "instagram" },
  reply: {
    platform: "instagram",
    text: "Hi! I'm here. What can I help with?",
    outcome: "Team · sent in the Instagram DM · marked done",
    mode: "REPLY → INSTAGRAM DM",
    markDone: true,
  },
  ledger: "8 in · 1 by an automation · 1 by the agent · 1 needs attention · 5 to your team · 1 replied from the composer",
  items: {
    instagram: {
      platform: "instagram",
      kind: "dm",
      handler: "attention",
      spec: {
        incoming: "DM: “can I talk to a real person?”",
        reply:
          "NEEDS ATTENTION · Handoff, no model call — “We'll connect someone from our team to help you out.” · Note: Asked: can I talk to a real person? / Tried: — / Why: customer_asked · Bell: IG 1 · Messenger 0 → a teammate replies from the composer: “Hi! I'm here. What can I help with?” and clicks Mark done",
      },
      arrives: "DM · “can I talk to a real person?”",
      status: "AGENT",
      outcome: "Handed off · no model call",
      thread: [
        { k: "them", who: "Instagram DM", text: "can I talk to a real person?", note: "↳ asks for a person: skips the model" },
        { k: "us", by: "agent", via: "Hand-off", text: HANDOFF },
        { k: "handoff", handoff: { asked: "can I talk to a real person?", tried: "—", why: "customer_asked" } },
      ],
    },
    facebook: {
      platform: "facebook",
      kind: "comment",
      handler: "automation",
      spec: {
        incoming: "Comment on your Page post: “open sunday too?”",
        reply: "AUTOMATION · Keyword → reply (matched “open”) — “We're open Monday to Saturday, 10am–7pm.”",
      },
      arrives: "Comment on your Page post · “open sunday too?”",
      status: "AUTOMATION",
      outcome: "Replied: “We're open Monday to Saturday, 10am–7pm.”",
      thread: [
        { k: "them", who: "Comment on your Page post", onPost: "post", text: "open sunday too?", highlight: "open", note: "↳ keyword “open”" },
        { k: "us", by: "automation", via: "Public reply", text: "We're open Monday to Saturday, 10am–7pm." },
      ],
    },
    threads: {
      platform: "threads",
      kind: "comment",
      handler: "team",
      viaSync: true,
      spec: {
        incoming: "Reply (picked up on sync): “do you ship to Pune?”",
        reply: "TEAM · Inbox › Comments — waiting for a teammate",
      },
      arrives: "Reply · “do you ship to Pune?” · via sync",
      status: "INBOX",
      outcome: waiting("Inbox › Comments"),
      thread: [
        { k: "them", who: "Reply to your thread · picked up on sync", onPost: "post", text: "do you ship to Pune?" },
        { k: "note", text: "↳ Inbox › Comments · waiting for a teammate" },
      ],
    },
    x: {
      platform: "x",
      kind: "mention",
      handler: "team",
      spec: { incoming: `Mention: “${at} saturday pickup possible?”`, reply: "TEAM · Inbox › Unassigned — waiting for a teammate" },
      arrives: `Mention · “${at} saturday pickup possible?”`,
      status: "INBOX",
      outcome: waiting("Inbox › Unassigned"),
      thread: [
        { k: "them", who: "Mention", text: `${at} saturday pickup possible?` },
        { k: "note", text: "↳ Inbox › Unassigned · waiting for a teammate" },
      ],
    },
    linkedin: {
      platform: "linkedin",
      kind: "comment",
      handler: "team",
      spec: {
        incoming: "Comment on your Company Page post: “Congrats on the new studio!”",
        reply: "TEAM · Inbox › Comments — waiting for a teammate (replies go out as the organization)",
      },
      arrives: "Company Page comment · “Congrats on the new studio!”",
      status: "INBOX",
      outcome: "Comments · you reply as the Page",
      thread: [
        { k: "them", who: "Comment on your Company Page post", text: "Congrats on the new studio!" },
        { k: "note", text: "↳ Inbox › Comments · replies go out as the organization" },
      ],
    },
    messenger: {
      platform: "messenger",
      kind: "dm",
      handler: "agent",
      spec: {
        incoming: "DM: “what are your timimgs?”",
        reply:
          "AGENT · Agentic, typo still matches “Hours” — “We reply 10am–7pm IST, Monday to Saturday. Our Bandra studio is open Mon–Sat, 10:00–19:00.” · margin note: from knowledge: Hours · Studio locations",
      },
      arrives: "DM · “what are your timimgs?”",
      status: "AGENT",
      outcome: "Agent: “We reply 10am–7pm IST, Monday to Saturday…”",
      thread: [
        { k: "them", who: "Messenger DM", text: "what are your timimgs?", note: "↳ typo still matches “Hours”" },
        { k: "typing" },
        {
          k: "us",
          by: "agent",
          via: "Agentic",
          text: "We reply 10am–7pm IST, Monday to Saturday. Our Bandra studio is open Mon–Sat, 10:00–19:00.",
          reveal: "words",
          note: "↳ from knowledge: Hours · Studio locations",
        },
      ],
    },
    whatsapp: {
      platform: "whatsapp",
      kind: "chat",
      handler: "team",
      spec: { incoming: "Chat: “Can I change my delivery address?”", reply: "TEAM · Inbox › Unassigned — waiting for a teammate" },
      arrives: "Chat · “Can I change my delivery address?”",
      status: "INBOX",
      outcome: waiting("Inbox › Unassigned"),
      thread: [
        { k: "them", who: "WhatsApp chat", text: "Can I change my delivery address?" },
        { k: "note", text: "↳ Inbox › Unassigned · waiting for a teammate" },
      ],
    },
    gmail: {
      platform: "gmail",
      kind: "email",
      handler: "team",
      spec: {
        incoming: "Email · Primary · “Invoice for order #2041”",
        reply: "TEAM · Inbox › Email — waiting for a teammate (replies stay in the same thread, one attachment)",
      },
      arrives: "Email · Primary · “Invoice for order #2041”",
      status: "INBOX",
      outcome: "Email · replies stay in the thread",
      thread: [
        { k: "them", who: "Email · Primary", text: "Invoice for order #2041" },
        { k: "note", text: "↳ Inbox › Email · replies stay in the same thread, one attachment" },
      ],
    },
  },
};

/* ------------------------------------------------------------------ C · Restock */

const restock: Script = {
  id: "restock",
  label: "Restock",
  post: "Terracotta planters are back 🪴 Comment PLANT for the size guide.",
  media: { chip: "planters-back.jpg", kind: "image", igFormat: "feed", photo: "planters" },
  automations: [
    { platform: "instagram", type: "dm", keyword: "PLANT", variations: ["plant", "plants", "planter", "size guide", "plant pls"] },
    { platform: "facebook", type: "reply", keyword: "PLANT", variations: ["plant", "plants", "size guide"] },
    { platform: "threads", type: "reply", keyword: "PLANT", variations: ["plant", "plants", "size guide"] },
  ],
  inboundOrder: ["instagram", "facebook", "messenger", "threads", "whatsapp", "gmail", "x", "linkedin"],
  scenes: { first: "instagram", agent: "messenger", handoff: "messenger" },
  reply: {
    platform: "whatsapp",
    text: "It's live today! Want the link?",
    outcome: "Team · sent as WhatsApp session text",
    mode: "REPLY → WHATSAPP CHAT",
  },
  ledger: "8 in · 3 by automations · 1 needs attention · 3 to your team · 1 sorted to Promotions · 1 replied from the composer",
  items: {
    instagram: {
      platform: "instagram",
      kind: "comment",
      handler: "automation",
      spec: {
        incoming: "Comment on your post · @green.corner: “plant 🌱”",
        reply:
          "AUTOMATION · Keyword → DM + reply, follow check on — Public reply: “Thanks for commenting! Just sent you a DM 📩” · DM opener [Send me the link] → tap → “Looks like you're not following yet 👀 Follow us, wait a second, then tap below and I'll send it.” [I followed] → follow confirmed → size guide delivered · Waiting to follow → Delivered",
      },
      arrives: "Comment on your post · “plant 🌱”",
      status: "AUTOMATION",
      outcome: "Waiting to follow → size guide delivered",
      thread: [
        { k: "them", who: "@green.corner · comment on your post", onPost: "post", text: "plant 🌱", highlight: "plant", note: "↳ keyword “plant”" },
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
        {
          k: "us",
          by: "automation",
          via: "DM",
          text: "Looks like you're not following yet 👀 Follow us, wait a second, then tap below and I'll send it.",
          buttons: ["I followed"],
          status: "WAITING TO FOLLOW",
        },
        { k: "tap", text: "I followed" },
        { k: "note", text: "↳ follow confirmed" },
        { k: "us", by: "automation", via: "DM", text: "Here's the size guide 🪴", buttons: ["Open link"], status: "DELIVERED" },
      ],
    },
    facebook: {
      platform: "facebook",
      kind: "comment",
      handler: "automation",
      spec: {
        incoming: "Comment on your Page post: “PLANT”",
        reply: "AUTOMATION · Keyword → reply — “The size guide is pinned at the top of this post 👆”",
      },
      arrives: "Comment on your Page post · “PLANT”",
      status: "AUTOMATION",
      outcome: "Replied: “The size guide is pinned at the top…”",
      thread: [
        { k: "them", who: "Comment on your Page post", onPost: "post", text: "PLANT", highlight: "PLANT", note: "↳ keyword “plant”" },
        { k: "us", by: "automation", via: "Public reply", text: "The size guide is pinned at the top of this post 👆" },
      ],
    },
    threads: {
      platform: "threads",
      kind: "comment",
      handler: "automation",
      viaSync: true,
      spec: {
        incoming: "Reply to your thread (picked up on sync): “PLANT pls”",
        reply: "AUTOMATION · Keyword → reply — “Pinned it in the first reply 🪴”",
      },
      arrives: "Thread reply · “PLANT pls” · via sync",
      status: "AUTOMATION",
      outcome: "Replied: “Pinned it in the first reply 🪴”",
      thread: [
        { k: "them", who: "Reply to your thread · picked up on sync", onPost: "post", text: "PLANT pls", highlight: "PLANT", note: "↳ keyword “plant”" },
        { k: "us", by: "automation", via: "Public reply", text: "Pinned it in the first reply 🪴" },
      ],
    },
    x: {
      platform: "x",
      kind: "mention",
      handler: "team",
      spec: {
        incoming: `Mention: “${at} do the large ones have drainage holes?”`,
        reply: "TEAM · Inbox › Unassigned — waiting for a teammate",
      },
      arrives: `Mention · “${at} do the large ones have drainage holes?”`,
      status: "INBOX",
      outcome: waiting("Inbox › Unassigned"),
      thread: [
        { k: "them", who: "Mention", text: `${at} do the large ones have drainage holes?` },
        { k: "note", text: "↳ Inbox › Unassigned · waiting for a teammate" },
      ],
    },
    linkedin: {
      platform: "linkedin",
      kind: "comment",
      handler: "team",
      spec: {
        incoming: "Comment on your Company Page post: “Do you do bulk orders for offices?”",
        reply: "TEAM · Inbox › Comments — waiting for a teammate (replies go out as the organization)",
      },
      arrives: "Company Page comment · “Do you do bulk orders for offices?”",
      status: "INBOX",
      outcome: "Comments · you reply as the Page",
      thread: [
        { k: "them", who: "Comment on your Company Page post", text: "Do you do bulk orders for offices?" },
        { k: "note", text: "↳ Inbox › Comments · replies go out as the organization" },
      ],
    },
    messenger: {
      platform: "messenger",
      kind: "dm",
      handler: "attention",
      spec: {
        incoming: "DM: “can you do custom embroidery for a wedding of 200 guests?”",
        reply:
          "NEEDS ATTENTION · Agent escalated, knowledge missing — “We'll connect someone from our team to help you out.” · Note: Asked: custom embroidery for 200 guests / Tried: no embroidery info in knowledge / Why: knowledge missing",
      },
      arrives: "DM · “can you do custom embroidery for a wedding of 200 guests?”",
      status: "AGENT",
      outcome: "Escalated · knowledge missing",
      thread: [
        { k: "them", who: "Messenger DM", text: "can you do custom embroidery for a wedding of 200 guests?" },
        { k: "typing" },
        { k: "us", by: "agent", via: "Escalated", text: HANDOFF, note: "↳ nothing on embroidery in knowledge" },
        {
          k: "handoff",
          handoff: { asked: "custom embroidery for 200 guests", tried: "no embroidery info in knowledge", why: "knowledge missing" },
        },
      ],
    },
    whatsapp: {
      platform: "whatsapp",
      kind: "chat",
      handler: "team",
      spec: {
        incoming: "Chat: “Any update on the terracotta restock?”",
        reply: "TEAM · Replied from the koLink composer as WhatsApp session text — “It's live today! Want the link?”",
      },
      arrives: "Chat · “Any update on the terracotta restock?”",
      status: "INBOX",
      outcome: waiting("Inbox › Unassigned"),
      thread: [{ k: "them", who: "WhatsApp chat", text: "Any update on the terracotta restock?" }],
    },
    gmail: {
      platform: "gmail",
      kind: "email",
      handler: "sorted",
      spec: {
        incoming: "Email from a mailing list · “Our spring newsletter”",
        reply: "SORTED · Filed to Promotions, kept out of Primary — no reply needed",
      },
      arrives: "Email from a mailing list · “Our spring newsletter”",
      status: "SORTED",
      outcome: "Filed to Promotions · no reply needed",
      thread: [
        { k: "them", who: "Email from a mailing list", text: "Our spring newsletter" },
        { k: "note", text: "↳ filed to Promotions, kept out of Primary" },
      ],
    },
  },
};

/* ------------------------------------------------------------------ D · Shop tour */

const tour: Script = {
  id: "tour",
  label: "Shop tour",
  post: "New here? DM us “hi” and we'll show you around ✨",
  media: { chip: "shop-tour.jpg", kind: "image", igFormat: "feed", photo: "boutique" },
  automations: [],
  inboundOrder: ["instagram", "messenger", "x", "facebook", "threads", "whatsapp", "linkedin", "gmail"],
  scenes: { first: "instagram", agent: "messenger" },
  reply: {
    platform: "x",
    text: "Not yet, India only for now.",
    outcome: "Team · sent as an X DM",
    mode: "REPLY → X DM",
  },
  ledger: "8 in · 2 by the agent · 6 to your team · 1 replied from the composer",
  items: {
    instagram: {
      platform: "instagram",
      kind: "dm",
      handler: "agent",
      spec: {
        incoming: "DM: “hii”",
        reply:
          "AGENT · Greeting with topics drawn from your knowledge — “Hi, how can I help you? I can help with: • hours • products and prices • shipping and returns. Ask about any of these.”",
      },
      arrives: "DM · “hii”",
      status: "AGENT",
      outcome: "Agent: greeting with topics from your knowledge",
      thread: [
        { k: "them", who: "Instagram DM", text: "hii", note: "↳ greeting" },
        { k: "typing" },
        {
          k: "us",
          by: "agent",
          via: "Agentic · greeting",
          text: "Hi, how can I help you? I can help with: • hours • products and prices • shipping and returns. Ask about any of these.",
          reveal: "words",
          note: "↳ topics drawn from your knowledge",
        },
      ],
    },
    facebook: {
      platform: "facebook",
      kind: "comment",
      handler: "team",
      spec: {
        incoming: "Comment on your Page post: “love the new look!”",
        reply: "TEAM · Inbox › Comments — waiting for a teammate (like or reply from the post page)",
      },
      arrives: "Comment on your Page post · “love the new look!”",
      status: "INBOX",
      outcome: "Comments · like or reply from the post",
      thread: [
        { k: "them", who: "Comment on your Page post", onPost: "post", text: "love the new look!" },
        { k: "note", text: "↳ Inbox › Comments · like or reply from the post page" },
      ],
    },
    threads: {
      platform: "threads",
      kind: "comment",
      handler: "team",
      viaSync: true,
      spec: { incoming: "Reply (picked up on sync): “hi from Pune 👋”", reply: "TEAM · Inbox › Comments — waiting for a teammate" },
      arrives: "Reply · “hi from Pune 👋” · via sync",
      status: "INBOX",
      outcome: waiting("Inbox › Comments"),
      thread: [
        { k: "them", who: "Reply to your thread · picked up on sync", onPost: "post", text: "hi from Pune 👋" },
        { k: "note", text: "↳ Inbox › Comments · waiting for a teammate" },
      ],
    },
    x: {
      platform: "x",
      kind: "dm",
      handler: "team",
      spec: {
        incoming: "DM: “do you ship outside India?”",
        reply: "TEAM · Replied from the koLink composer as an X DM — “Not yet, India only for now.”",
      },
      arrives: "DM · “do you ship outside India?”",
      status: "INBOX",
      outcome: waiting("Inbox › Unassigned"),
      thread: [{ k: "them", who: "X DM", text: "do you ship outside India?" }],
    },
    linkedin: {
      platform: "linkedin",
      kind: "comment",
      handler: "team",
      spec: {
        incoming: "Comment on your Company Page post: “Great storefront.”",
        reply: "TEAM · Inbox › Comments — waiting for a teammate",
      },
      arrives: "Company Page comment · “Great storefront.”",
      status: "INBOX",
      outcome: waiting("Inbox › Comments"),
      thread: [
        { k: "them", who: "Comment on your Company Page post", text: "Great storefront." },
        { k: "note", text: "↳ Inbox › Comments · waiting for a teammate" },
      ],
    },
    messenger: {
      platform: "messenger",
      kind: "dm",
      handler: "agent",
      spec: {
        incoming: "DM: “show me your products”",
        reply:
          "AGENT · Catalog straight from your CSV rows, no model call — “Here is what is available.” + swipe cards: Linen bedding set · ₹4,800 · Queen · 6 colours / Relaxed linen shirt · ₹2,450 · Pre-washed / Terracotta planter · ₹890 · S · M · L · [Next]",
      },
      arrives: "DM · “show me your products”",
      status: "AGENT",
      outcome: "Agent: 3 catalog cards from catalog.csv",
      thread: [
        { k: "them", who: "Messenger DM", text: "show me your products" },
        {
          k: "us",
          by: "agent",
          via: "Catalog · no model call",
          text: "Here is what is available.",
          cards: demoCatalog,
          buttons: ["Next"],
          note: "↳ straight from catalog.csv, no model",
        },
      ],
    },
    whatsapp: {
      platform: "whatsapp",
      kind: "chat",
      handler: "team",
      spec: {
        incoming: "Chat: “thank you so much, you guys are the best!”",
        reply: "TEAM · Inbox › Unassigned — waiting for a teammate (the agent isn't on WhatsApp)",
      },
      arrives: "Chat · “thank you so much, you guys are the best!”",
      status: "INBOX",
      outcome: "Unassigned · the agent isn't on WhatsApp",
      thread: [
        { k: "them", who: "WhatsApp chat", text: "thank you so much, you guys are the best!" },
        { k: "note", text: "↳ Inbox › Unassigned · the agent isn't on WhatsApp" },
      ],
    },
    gmail: {
      platform: "gmail",
      kind: "email",
      handler: "team",
      spec: { incoming: "Email · Primary · “Wholesale catalogue?”", reply: "TEAM · Inbox › Email — waiting for a teammate" },
      arrives: "Email · Primary · “Wholesale catalogue?”",
      status: "INBOX",
      outcome: waiting("Inbox › Email"),
      thread: [
        { k: "them", who: "Email · Primary", text: "Wholesale catalogue?" },
        { k: "note", text: "↳ Inbox › Email · waiting for a teammate" },
      ],
    },
  },
};

export const scripts: Script[] = [drop, hours, restock, tour];

const byLook: Record<Exclude<LookOptionValue<"script">, "rotate">, number> = { drop: 0, hours: 1, restock: 2, tour: 3 };

/** Script indices to loop through for the Studio "Hero demo" setting. */
export function scriptOrder(pin: LookOptionValue<"script">): number[] {
  return pin === "rotate" ? [0, 1, 2, 3] : [byLook[pin]];
}

export type { ScriptItem };
