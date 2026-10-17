"use client";

import { useId, useState, type CSSProperties } from "react";
import { Plus, X } from "lucide-react";

import { Glyph } from "@/components/transit/glyph";
import { cn } from "@/lib/cn";

import { triggerWords } from "./data";
import { popTint } from "./hooks";
import { Highlighted } from "./highlight";
import {
  isShortKeyword,
  matchKeyword,
  MAX_KEYWORD_LENGTH,
  MAX_KEYWORDS,
  mergeTarget,
  MIN_KEYWORDS,
  normalizeKeyword,
} from "./matcher";
import { SubHead } from "./sub-head";

const examples = ["LINK!!", "linkplease", "l i n k", "liiiink"];

type Notice = { tone: "info" | "warn"; text: string } | null;

export function MatcherToy() {
  const ids = { kw: useId(), comment: useId(), hint: useId() };
  const [keywords, setKeywords] = useState<string[]>(triggerWords);
  const [draft, setDraft] = useState("");
  const [comment, setComment] = useState("link pls 🙏");
  const [notice, setNotice] = useState<Notice>(null);

  function add(raw: string) {
    const parts = raw
      .split(",")
      .map((p) => p.trim().slice(0, MAX_KEYWORD_LENGTH))
      .filter(Boolean);
    if (!parts.length) return;
    let next = [...keywords];
    let msg: Notice = null;
    for (const part of parts) {
      if (!normalizeKeyword(part)) {
        msg = { tone: "warn", text: "Keywords need at least one letter, number, or emoji." };
        continue;
      }
      const target = mergeTarget(part, next);
      if (target) {
        msg = { tone: "info", text: `Merged with “${target}” — duplicates are removed after normalizing.` };
        continue;
      }
      if (next.length >= MAX_KEYWORDS) {
        msg = { tone: "warn", text: `Use at most ${MAX_KEYWORDS} keyword variations.` };
        break;
      }
      next = [...next, part];
      if (isShortKeyword(part)) {
        msg = { tone: "info", text: `“${part}” is shorter than 3 letters, so it only fires when the whole comment is “${part}”.` };
      }
    }
    setKeywords(next);
    setNotice(msg);
    setDraft("");
  }

  function remove(word: string) {
    const next = keywords.filter((k) => k !== word);
    setKeywords(next);
    setNotice(
      next.length < MIN_KEYWORDS
        ? { tone: "warn", text: `Keyword → DM needs at least ${MIN_KEYWORDS} keyword variations (you have ${next.length}).` }
        : null,
    );
  }

  const trimmed = comment.trim();
  const match = trimmed ? matchKeyword(comment, keywords) : null;
  const normalized = trimmed ? normalizeKeyword(comment) : "";
  // Matcher ranges are code points; the highlighter slices UTF-16 strings.
  const range: [number, number] | undefined = match
    ? [
        Array.from(match.haystack).slice(0, match.at[0]).join("").length,
        Array.from(match.haystack).slice(0, match.at[1]).join("").length,
      ]
    : undefined;

  return (
    <div className="k-card p-5 md:p-7" style={{ "--k-tilt": "0.8deg" } as CSSProperties}>
      <SubHead kicker="Matcher · same rules as the app" title="Try a comment" />
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">Caps, spaces and stretched letters still match.</p>

      {/* Trigger words */}
      <div className="mt-7">
        <div className="flex items-baseline justify-between gap-3">
          <p id={ids.kw} className="eyebrow">
            Trigger words
          </p>
          <p className={cn("mono text-[11px]", keywords.length < MIN_KEYWORDS ? "text-ink" : "text-ink-soft")}>
            {keywords.length}/{MAX_KEYWORDS} · min {MIN_KEYWORDS}
          </p>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2" aria-labelledby={ids.kw}>
          {keywords.map((k) => {
            const hit = match?.keyword === k;
            return (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => remove(k)}
                  aria-label={`Remove trigger word ${k}`}
                  className={cn(
                    "mono relative inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] text-ink",
                    "after:absolute after:-inset-1 after:content-[''] hover:border-ink",
                    hit ? "border-pop-3-deep" : "border-line-strong",
                  )}
                  style={{ background: hit ? popTint(3, 36) : "var(--k-surface)" }}
                >
                  {k}
                  <X className="size-3.5 text-ink-soft" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add(draft);
          }}
        >
          <label htmlFor={`${ids.kw}-add`} className="sr-only">
            Add a trigger word
          </label>
          <input
            id={`${ids.kw}-add`}
            value={draft}
            maxLength={MAX_KEYWORD_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="New word, e.g. linkk"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-3 text-[16px] text-ink placeholder:text-ink-soft md:text-[15px]"
          />
          <button type="submit" className="k-btn k-btn-ghost h-11 shrink-0 px-4 text-[14px]">
            <Plus className="size-4" aria-hidden />
            Add
          </button>
        </form>
        <p
          id={ids.hint}
          aria-live="polite"
          className={cn("mt-2 min-h-6 text-[13px] leading-snug", notice?.tone === "warn" ? "text-ink" : "text-ink-soft")}
        >
          {notice && (
            <span className="inline-flex items-start gap-2">
              <Glyph handler={notice.tone === "warn" ? "attention" : "automation"} size={10} className="mt-[3px]" />
              {notice.text}
            </span>
          )}
        </p>
      </div>

      {/* Comment tester */}
      <div className="mt-6 border-t border-line pt-6">
        <label htmlFor={ids.comment} className="eyebrow block">
          Comment
        </label>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id={ids.comment}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. linkplease 🙏"
            autoComplete="off"
            className="h-12 w-full min-w-0 rounded-lg border border-line-strong bg-surface px-3 text-[16px] text-ink placeholder:text-ink-soft sm:w-auto sm:flex-1"
          />
          <p aria-live="polite" className="shrink-0">
            {trimmed ? (
              <span
                className={cn(
                  "mono inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[12.5px] text-ink",
                  match ? "border-pop-3-deep" : "border-line-strong bg-bg-alt",
                )}
                style={match ? { background: popTint(3, 36) } : undefined}
              >
                {match ? (
                  <>
                    <Glyph handler="automation" size={9} />
                    Triggers “{match.keyword}”
                  </>
                ) : (
                  "No match"
                )}
              </span>
            ) : (
              <span className="mono text-[12px] text-ink-soft">Type a comment</span>
            )}
          </p>
        </div>

        <p className="mono mt-3 flex min-h-6 flex-wrap items-baseline gap-x-2 text-[12.5px] text-ink-soft">
          <span className="text-[11px] tracking-[0.08em] uppercase">Reads as</span>
          <span className="break-all text-ink">
            {normalized ? (
              <Highlighted key={`${normalized}-${range?.join(",")}`} text={normalized} range={range} delay={0} />
            ) : (
              "—"
            )}
          </span>
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-1 text-[13px] text-ink-soft">
          <span className="mr-1">Try</span>
          {examples.map((e) => (
            <ExampleButton key={e} text={e} onPick={() => setComment(e)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExampleButton({ text, onPick }: { text: string; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="mono inline-flex h-11 items-center rounded-md px-2 text-[13px] text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
    >
      {text}
    </button>
  );
}
