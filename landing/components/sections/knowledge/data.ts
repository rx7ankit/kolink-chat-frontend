/**
 * §03 Knowledge library: the scripted onboarding chat (it calls no model) and
 * the knowledge each answer is filed as. Prompts are shortened from the product's
 * own wording; the seven steps and their order are the real ones.
 */

import { catalog, type PhotoId } from "@/lib/media";

export type KnowledgeCard = {
  title: string;
  /** Source kind as the product stores it. */
  kind: "profile" | "policy" | "url" | "catalog" | "faq";
  /** Link sources are fetched by a worker: they start PENDING and flip to READY. */
  fetched?: boolean;
  /** Product photos from the catalog rows, shown as a contact strip. */
  thumbs?: PhotoId[];
};

/** The first rows of the demo catalog.csv, previewed in the upload bubble. */
export type CatalogRow = (typeof catalog)[number];

export type Answer =
  | { type: "text"; text: string }
  | { type: "link"; text: string }
  | { type: "file"; name: string; meta: string; rows?: CatalogRow[]; more?: string }
  | { type: "platforms" };

export type ChatStep = { prompt: string; answer: Answer; card: KnowledgeCard | null };

const a1 = "Northwind Studio — warm, short, no slang.";
const a2 = "Mon–Sat 10–7 IST. India shipping 3–5 days. Returns within 7 days.";
const a5 = "Do you ship to Pune? Is the linen pre-washed?";
const a6 = "Custom orders, refunds, anything about invoices.";

export const chatSteps: ChatStep[] = [
  {
    prompt: "What’s your brand, and how should it sound?",
    answer: { type: "text", text: a1 },
    card: { title: "Business profile", kind: "profile" },
  },
  {
    prompt: "What must it get right? Hours, shipping, returns…",
    answer: { type: "text", text: a2 },
    card: { title: "Hours & policies", kind: "policy" },
  },
  {
    prompt: "Got a help page? Paste the link.",
    answer: { type: "link", text: "https://northwind.example/help" },
    card: { title: "Help page", kind: "url", fetched: true },
  },
  {
    prompt: "Add your catalog as a CSV.",
    answer: { type: "file", name: "catalog.csv", meta: "24 rows", rows: catalog.slice(0, 2), more: "22 more rows" },
    card: { title: "Catalog · 24 rows", kind: "catalog", thumbs: catalog.slice(0, 4).map((c) => c.photo) },
  },
  {
    prompt: "What do customers usually ask?",
    answer: { type: "text", text: a5 },
    card: { title: "Typical questions", kind: "faq" },
  },
  {
    prompt: "When should a person take over?",
    answer: { type: "text", text: a6 },
    card: { title: "When to hand off", kind: "policy" },
  },
  {
    prompt: "Where should it answer?",
    answer: { type: "platforms" },
    card: null,
  },
];

export const cardCount = chatSteps.filter((s) => s.card).length;

/** The four ways in. No PDF: the upload formats say so without a footnote. */
export const dock = [
  { icon: "paste", main: "Paste text", rest: "" },
  { icon: "csv", main: "CSV catalog", rest: "max 2,000 rows" },
  { icon: "upload", main: "Upload", rest: ".txt .md .csv" },
  { icon: "link", main: "Link", rest: "one page" },
] as const;
