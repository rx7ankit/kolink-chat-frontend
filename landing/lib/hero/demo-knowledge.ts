import { demoCatalog } from "./scripts";
import type { CatalogCard } from "./types";

/**
 * A tiny, honest stand-in for the agent's pipeline, used only for visitor runs in the hero.
 * It mirrors the product's documented order: explicit human requests skip the model,
 * greetings get topics from the knowledge that exists, thanks get a courtesy line,
 * catalog requests are answered straight from CSV rows, everything else is a lexical
 * match with alias groups and edit-distance-1 typos, and no match escalates.
 */

export const HANDOFF_REPLY = "We'll connect someone from our team to help you out.";

type Source = { id: string; title: string; aliases: string[]; answer: string };

export const demoKnowledge: Source[] = [
  {
    id: "hours",
    title: "Hours",
    aliases: ["hours", "hour", "timings", "timing", "time", "open", "opening", "close", "closing", "saturday", "sunday", "weekend"],
    answer: "We're open 10am–7pm, Monday to Saturday.",
  },
  {
    id: "shipping",
    title: "Shipping",
    aliases: ["ship", "shipping", "delivery", "deliver", "courier", "dispatch", "outside"],
    answer: "We ship across India in 3–5 working days.",
  },
  {
    id: "returns",
    title: "Returns",
    aliases: ["return", "returns", "refund", "refunds", "exchange"],
    answer: "Returns are free within 14 days of delivery.",
  },
  {
    id: "location",
    title: "Studio locations",
    aliases: ["where", "address", "location", "studio", "store", "visit"],
    answer: "Our Bandra studio is open Mon–Sat, 10:00–19:00.",
  },
];

const GREETINGS = ["hi", "hii", "hiii", "hello", "hey", "namaste", "hola", "yo", "heya"];
const COURTESY = ["thanks", "thank", "thankyou", "tysm", "ty", "love", "best", "awesome", "great"];
const HUMAN = ["human", "person", "agent", "someone", "real", "representative", "staff"];
const CATALOG = ["show", "list", "prices", "price", "menu", "catalog", "catalogue", "products", "much", "cost"];

export type DmAnswer = {
  kind: "handoff" | "greeting" | "courtesy" | "catalog" | "answer" | "escalate";
  reply: string;
  note: string;
  cards?: CatalogCard[];
  why?: string;
};

function words(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Levenshtein distance capped at 2 (enough to tell "≤ 1" apart). */
function within1(a: string, b: string) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

export function answerDm(text: string): DmAnswer {
  const w = words(text);
  const has = (list: string[]) => w.some((x) => list.includes(x));

  if ((w.includes("real") && w.includes("person")) || has(["human", "representative"]) || (w.includes("agent") && w.includes("please"))) {
    return { kind: "handoff", reply: HANDOFF_REPLY, note: "↳ asks for a person: skips the model", why: "customer_asked" };
  }
  if (w.length > 0 && w.length <= 3 && w.every((x) => GREETINGS.includes(x) || x === "there")) {
    return {
      kind: "greeting",
      reply:
        "Hi, how can I help you? I can help with: • hours • products and prices • shipping and returns. Ask about any of these.",
      note: "↳ topics drawn from your knowledge",
    };
  }
  if (has(COURTESY) && !has(["how", "what", "when", "where", "can", "do"])) {
    return { kind: "courtesy", reply: "You're welcome! If you need anything else, just ask.", note: "↳ courtesy reply, nothing looked up" };
  }
  if (has(CATALOG) && !has(HUMAN)) {
    return {
      kind: "catalog",
      reply: "Here is what is available.",
      note: "↳ straight from catalog.csv, no model",
      cards: demoCatalog,
    };
  }
  for (const source of demoKnowledge) {
    const exact = w.find((x) => source.aliases.includes(x));
    const fuzzy = exact ? null : w.find((x) => x.length >= 4 && source.aliases.some((a) => a.length >= 4 && within1(x, a)));
    if (exact || fuzzy) {
      return {
        kind: "answer",
        reply: source.answer,
        note: fuzzy ? `↳ typo still matches “${source.title}”` : `↳ from knowledge: ${source.title}`,
      };
    }
  }
  return { kind: "escalate", reply: HANDOFF_REPLY, note: "↳ nothing in knowledge covers this", why: "knowledge missing" };
}
