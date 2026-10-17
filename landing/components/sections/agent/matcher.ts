/**
 * A tiny in-browser stand-in for the agent pipeline, answering only from the
 * demo knowledge for Northwind Studio (demo). It mirrors the real order of
 * checks: an explicit request for a person skips everything, greetings get the
 * topic overview, thanks get a courtesy line, catalog asks come straight from
 * rows, and everything else is matched lexically (aliases + one-typo fuzziness).
 * No match means knowledge is missing, so it hands off. Nothing leaves the page.
 */

import { catalog, courtesyReply, greetingLines, handoffReply, type CatalogItem, type Handoff } from "./data";

export type Reply = {
  lines: string[];
  note?: string;
  carousel?: boolean;
  item?: CatalogItem;
  handoff?: Handoff;
};

type Intent = "hours" | "location" | "shipping" | "returns";

const ALIASES: Record<Intent, string[]> = {
  hours: ["hours", "hour", "timings", "timing", "time", "times", "open", "opening", "close", "closing", "closed"],
  location: ["where", "address", "location", "located", "studio", "store", "shop", "visit"],
  shipping: ["ship", "shipping", "ships", "deliver", "delivery", "deliveries", "courier", "dispatch"],
  returns: ["return", "returns", "refund", "refunds", "exchange", "exchanges"],
};

const ANSWERS: Record<Intent, { line: string; source: string }> = {
  hours: { line: "We reply 10am–7pm IST, Monday to Saturday.", source: "Hours" },
  location: { line: "Our Bandra studio is open Mon–Sat, 10:00–19:00.", source: "Locations" },
  shipping: { line: "We ship within India, and delivery takes 3–5 days.", source: "Shipping" },
  returns: { line: "Returns are accepted within 7 days.", source: "Returns" },
};

const INDIA = ["india", "pune", "mumbai", "delhi", "bengaluru", "bangalore", "chennai", "kolkata", "hyderabad", "goa", "jaipur", "ahmedabad"];
/** Words that name a catalog row, checked in this order ("linen shirt" is the shirt, plain "linen" the bedding). */
const ITEM_WORDS: [id: string, words: string[]][] = [
  ["linen-shirt", ["shirt", "shirts"]],
  ["linen-set", ["bedding", "linen", "bed", "sheets", "sheet", "duvet"]],
  ["planter", ["planter", "planters", "pot", "pots", "terracotta"]],
  ["mug", ["mug", "mugs", "cup", "cups", "stoneware"]],
  ["tote", ["tote", "totes", "bag", "bags"]],
];
const CATALOG_WORDS = ["show", "list", "products", "product", "catalog", "catalogue", "menu", "prices", "price", "cost", "sell", "items", "collection", "available"];

export function normalize(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance, bailing out early above 1. */
function within1(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      row.push(v);
      best = Math.min(best, v);
    }
    if (best > 1) return false;
    prev = row;
  }
  return prev[b.length] <= 1;
}

/** Exact alias, or one typo away for words of five letters or more. */
const hits = (word: string, aliases: string[]) =>
  aliases.some((a) => a === word || (word.length >= 5 && a.length >= 5 && within1(word, a)));

function handoff(asked: string, tried: string, why: string, note?: string): Reply {
  return { lines: [handoffReply], note, handoff: { asked, tried, why } };
}

export function answer(question: string): Reply | null {
  const n = normalize(question);
  if (!n) return null;
  const words = n.split(" ");
  const has = (w: string) => words.includes(w);

  // 1. Asking for a person skips the model entirely.
  if (/\b(human|real person|a person|someone real|talk to (someone|somebody|an agent|agent|staff)|agent please|representative|customer care)\b/.test(n)) {
    return handoff(question.trim(), "—", "customer_asked", "skips the model");
  }

  // 2. Greetings get the overview of topics that actually exist.
  if (/^(hi+|hey+|hello+|helo|namaste|hola|yo|good (morning|afternoon|evening))( (there|team|guys|again))?( (can|could) you help( me)?)?$/.test(n) || n === "can you help me") {
    return { lines: greetingLines, note: "topics from your library" };
  }

  // 3. Thanks and compliments: one courtesy line, nothing looked up, never a handoff.
  if (/\b(thank|thanks|thankyou|thx|tysm|ty|appreciate|love it|the best|awesome|amazing)\b/.test(n)) {
    return { lines: [courtesyReply], note: "nothing looked up" };
  }

  // 4. Catalog: a named item, or a request to see products or prices, straight from the rows.
  const named = ITEM_WORDS.find(([, list]) => words.some((w) => hits(w, list)));
  const item = named && catalog.find((c) => c.id === named[0]);
  if (item) {
    return {
      lines: [`Here is the ${item.name} (${item.price}).`],
      note: "catalog.csv row · no model",
      item,
    };
  }
  if (words.some((w) => CATALOG_WORDS.includes(w)) || n.includes("how much") || n.includes("what do you have")) {
    return { lines: ["Here is what is available."], carousel: true, note: "catalog.csv · no model" };
  }

  // 5. Knowledge: alias groups with one-typo tolerance.
  const found = (Object.keys(ALIASES) as Intent[]).filter((intent) => words.some((w) => hits(w, ALIASES[intent])));
  if (found.length) {
    const intents = new Set(found);
    // Hours questions also get the studio line, as in the scripted demo.
    if (intents.has("hours")) intents.add("location");
    // Shipping answers mention returns, the policy customers ask about next.
    if (intents.has("shipping")) intents.add("returns");
    const ordered = (["hours", "location", "shipping", "returns"] as Intent[]).filter((i) => intents.has(i));
    const lines = ordered.map((i) => ANSWERS[i].line);
    if (intents.has("shipping") && INDIA.some(has)) {
      lines[ordered.indexOf("shipping")] = "Yes — India shipping takes 3–5 days.";
    }
    return {
      lines: [lines.join(" ")],
      note: `from ${ordered.map((i) => ANSWERS[i].source).join(" + ")}`,
    };
  }

  // 6. Nothing in the library covers it: hand off with a structured note.
  const asked = question.trim().replace(/[?!.\s]+$/, "");
  const tried = /embroider/.test(n) ? "no embroidery info in knowledge" : "no matching knowledge";
  return handoff(asked, tried, "knowledge missing");
}
