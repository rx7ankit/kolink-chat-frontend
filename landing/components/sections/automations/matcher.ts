/**
 * Port of the product's comment-keyword matcher (backend app/automation/keywords.py,
 * mirrored in the app's lib/ig-keywords.ts), so the landing toy behaves exactly like
 * the real "Try a comment" tester.
 *
 * Both sides are folded the same way: NFKC, casefold, drop spaces / punctuation /
 * control + format characters and emoji variation selectors, collapse repeated
 * characters. Keywords of 3+ characters match inside a comment; shorter ones only
 * match a comment that is exactly that word.
 */

export const MIN_KEYWORDS = 5;
export const MAX_KEYWORDS = 20;
export const MAX_KEYWORD_LENGTH = 50;
export const SUBSTRING_MIN_LENGTH = 3;

const INVISIBLE = new Set(["​", "‌", "‍", "⁠", "﻿", "︎", "️"]);
// Unicode categories Z* (separators), P* (punctuation), C* (control, format, unassigned).
const DROPPED = new RegExp("[\\p{Z}\\p{P}\\p{C}]", "u");
// Python's casefold() differs from toLowerCase() for a few letters that matter in comments.
const FOLD: Record<string, string> = { "ß": "ss", "ẞ": "ss", "ς": "σ" };

export function normalizeKeyword(value: string): string {
  const folded = (value || "").normalize("NFKC").toLowerCase();
  const kept: string[] = [];
  for (const raw of folded) {
    for (const ch of FOLD[raw] ?? raw) {
      if (INVISIBLE.has(ch) || DROPPED.test(ch)) continue;
      if (kept.length && kept[kept.length - 1] === ch) continue;
      kept.push(ch);
    }
  }
  return kept.join("");
}

export type Match = {
  /** The keyword as the owner typed it. */
  keyword: string;
  /** Normalized comment and the [start, end) of the hit inside it (code-point indexes). */
  haystack: string;
  at: [number, number];
};

export function matchKeyword(comment: string, keywords: string[]): Match | null {
  const haystack = normalizeKeyword(comment);
  if (!haystack) return null;
  const hay = Array.from(haystack);
  for (const keyword of keywords) {
    const needle = normalizeKeyword(keyword);
    if (!needle) continue;
    const len = Array.from(needle).length;
    if (len < SUBSTRING_MIN_LENGTH) {
      if (haystack === needle) return { keyword, haystack, at: [0, hay.length] };
    } else {
      const unit = haystack.indexOf(needle);
      if (unit >= 0) {
        const start = Array.from(haystack.slice(0, unit)).length;
        return { keyword, haystack, at: [start, start + len] };
      }
    }
  }
  return null;
}

/** Keyword list after the product's dedupe: variants that normalize to the same word count once. */
export function cleanKeywords(raw: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const item of raw) {
    const value = (item || "").trim().slice(0, MAX_KEYWORD_LENGTH);
    const key = normalizeKeyword(value);
    if (!value || !key || seen.has(key)) continue;
    seen.add(key);
    cleaned.push(value);
  }
  return cleaned;
}

/** The existing keyword a new one would merge into, if any. */
export function mergeTarget(candidate: string, keywords: string[]): string | null {
  const key = normalizeKeyword(candidate);
  if (!key) return null;
  return keywords.find((k) => normalizeKeyword(k) === key) ?? null;
}

export function isShortKeyword(keyword: string) {
  const len = Array.from(normalizeKeyword(keyword)).length;
  return len > 0 && len < SUBSTRING_MIN_LENGTH;
}
