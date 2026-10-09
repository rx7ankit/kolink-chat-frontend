/** Mirrors app/automation/keywords.py so the setup form can preview matches. */

export const MIN_KEYWORDS = 5;
export const MAX_KEYWORDS = 20;
export const MAX_KEYWORD_LENGTH = 50;
export const MAX_VARIATIONS = 5;
export const SUBSTRING_MIN_LENGTH = 3;

const INVISIBLE = new Set(["\u200b", "\u200c", "\u200d", "\u2060", "\ufeff", "\ufe0e", "\ufe0f"]);
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

export function cleanKeywords(raw: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const item of raw || []) {
    const value = (item || "").trim().slice(0, MAX_KEYWORD_LENGTH);
    const key = normalizeKeyword(value);
    if (!value || !key || seen.has(key)) continue;
    seen.add(key);
    cleaned.push(value);
  }
  return cleaned;
}

export function takenKeywordMap(rows: { keywords: string[]; kind: string; kindLabel?: string }[]): Map<string, string> {
  const taken = new Map<string, string>();
  for (const row of rows) {
    const label = row.kindLabel || row.kind;
    for (const keyword of row.keywords || []) {
      const key = normalizeKeyword(keyword);
      if (key && !taken.has(key)) taken.set(key, label);
    }
  }
  return taken;
}

export function keywordProblems(
  keywords: string[],
  minCount = MIN_KEYWORDS,
  taken?: Map<string, string>,
): string[] {
  const problems: string[] = [];
  if (keywords.length < minCount) problems.push(`Add at least ${minCount} keyword variations`);
  if (keywords.length > MAX_KEYWORDS) problems.push(`Use at most ${MAX_KEYWORDS} keyword variations`);
  if (keywords.some((keyword) => !normalizeKeyword(keyword))) {
    problems.push("Keywords need at least one letter, number, or emoji");
  }
  const seen = new Set<string>();
  for (const keyword of keywords) {
    const key = normalizeKeyword(keyword);
    const owner = key ? taken?.get(key) : undefined;
    if (!key || !owner || seen.has(key)) continue;
    seen.add(key);
    problems.push(`“${keyword}” is already used on ${owner}`);
  }
  return problems;
}

export function shortKeywords(keywords: string[]): string[] {
  return keywords.filter((keyword) => {
    const length = [...normalizeKeyword(keyword)].length;
    return length > 0 && length < SUBSTRING_MIN_LENGTH;
  });
}
