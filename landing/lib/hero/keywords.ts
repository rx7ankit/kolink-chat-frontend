/**
 * Port of the product's comment-keyword matcher (frontend/lib/ig-keywords.ts, which mirrors
 * app/automation/keywords.py): NFKC + casefold, drop spaces, punctuation and invisible
 * variation selectors, collapse repeated characters. Keywords of 3+ characters match inside
 * the comment; shorter ones only match a comment that is exactly that word.
 */

export const MIN_DM_KEYWORDS = 5;
export const MIN_REPLY_KEYWORDS = 3;
export const MAX_KEYWORDS = 20;
export const SUBSTRING_MIN_LENGTH = 3;

const INVISIBLE = new Set(["​", "‌", "‍", "⁠", "﻿", "︎", "️"]);
const DROPPED = /[\p{Z}\p{P}\p{C}]/u;

export function normalizeKeyword(value: string): string {
  const folded = (value || "").normalize("NFKC").toLowerCase();
  const kept: string[] = [];
  for (const ch of folded) {
    if (INVISIBLE.has(ch) || DROPPED.test(ch)) continue;
    if (kept.length && kept[kept.length - 1] === ch) continue;
    kept.push(ch);
  }
  return kept.join("");
}

/** The first keyword the comment triggers, or null. */
export function matchKeyword(comment: string, keywords: string[]): string | null {
  const haystack = normalizeKeyword(comment);
  if (!haystack) return null;
  for (const keyword of keywords) {
    const needle = normalizeKeyword(keyword);
    if (!needle) continue;
    if ([...needle].length < SUBSTRING_MIN_LENGTH) {
      if (haystack === needle) return keyword;
    } else if (haystack.includes(needle)) {
      return keyword;
    }
  }
  return null;
}

/** Dedupe after normalization: LINK, link and LiNk count as one trigger word. */
export function cleanKeywords(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const value = item.trim().slice(0, 50);
    const key = normalizeKeyword(value);
    if (!value || !key || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out.slice(0, MAX_KEYWORDS);
}
