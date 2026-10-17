"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Play } from "lucide-react";
import { useInView } from "motion/react";

import { PlatformIcon } from "@/components/brand/platform-icon";
import { Glyph } from "@/components/transit/glyph";
import { cn } from "@/lib/cn";
import type { PlatformId } from "@/lib/platforms";

import { MediaThumb, scrim } from "../automations/brand";
import { formatInt as fmt, popTint, useSectionMotion } from "../automations/hooks";
import { caption, captionLimit, networkLabel, overflow, targets } from "./data";
import { NetworkPreview } from "./previews";

/**
 * One caption, five listings. Counters are live per network; the composer warns
 * when a caption runs past a network's limit. The demo types past X's 280 once,
 * then trims back. Typing or focusing the field hands it to the visitor.
 */
/** Shared box model for the caption field and its sizing copy. */
const fieldBox =
  "w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-[16px] leading-snug break-words text-ink md:text-[14.5px]";

export function Composer({ onPublish }: { onPublish: () => void }) {
  const ids = { caption: useId(), warn: useId(), tabs: useId() };
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const { still, pace } = useSectionMotion();
  const [text, setText] = useState(caption);
  const [touched, setTouched] = useState(false);
  const [tab, setTab] = useState<PlatformId>("instagram");

  // The scripted demo: type 100 characters past the caption, hold on the warning, trim back.
  useEffect(() => {
    if (!inView || still || touched) return;
    const k = pace;
    const extra = Array.from(overflow);
    const timers: number[] = [];
    let t = 800;
    for (let n = 3; n < extra.length + 3; n += 3) {
      const upto = Math.min(n, extra.length);
      timers.push(window.setTimeout(() => setText(caption + extra.slice(0, upto).join("")), t * k));
      t += 38;
    }
    t += 2200;
    for (let n = extra.length - 10; n > -10; n -= 10) {
      const upto = Math.max(n, 0);
      timers.push(window.setTimeout(() => setText(caption + extra.slice(0, upto).join("")), t * k));
      t += 26;
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [inView, still, touched, pace]);

  // Reduced motion shows the informative end of the demo: the over-limit warning.
  const value = touched ? text : still ? caption + overflow : text;
  const used = Array.from(value).length;
  const over = targets.filter((p) => used > (captionLimit[p] ?? Infinity));

  // Hand the field to the visitor without changing what they're looking at (the reduced-motion
  // view shows the over-limit caption, which isn't in `text` yet).
  const take = () => {
    if (touched) return;
    setText(value);
    setTouched(true);
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = targets.indexOf(tab);
    const n = targets.length;
    const moves: Record<string, PlatformId> = {
      ArrowRight: targets[(i + 1) % n],
      ArrowLeft: targets[(i - 1 + n) % n],
      Home: targets[0],
      End: targets[n - 1],
    };
    const next = moves[e.key] ?? null;
    if (!next) return;
    e.preventDefault();
    setTab(next);
    document.getElementById(`${ids.tabs}-${next}`)?.focus();
  };

  return (
    <div ref={ref} className="k-card p-5 md:p-6" style={{ "--k-tilt": "-0.8deg" } as CSSProperties}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-[22px] leading-none">Compose once</h3>
        <span className="mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">Demo</span>
      </div>

      {/* Targets with live counters */}
      <p className="eyebrow mt-6">Publish to</p>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {targets.map((p) => {
          const limit = captionLimit[p] ?? 0;
          const isOver = used > limit;
          return (
            <li key={p} className="flex h-11 items-center gap-2.5" data-active="true">
              <span
                aria-hidden
                className="grid size-[18px] shrink-0 place-items-center rounded-[4px] border-[1.5px] border-ink bg-ink text-bg"
              >
                <svg viewBox="0 0 12 12" className="size-2.5">
                  <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <PlatformIcon id={p} size={15} />
              <span className="min-w-0 flex-1 truncate text-[14px]">{networkLabel[p]}</span>
              <span
                className={cn(
                  "mono inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11.5px] leading-none text-ink tabular-nums",
                  isOver ? "border border-pop-1-deep" : "text-ink-soft",
                )}
                style={isOver ? { background: popTint(1, 42) } : undefined}
              >
                {isOver && <Glyph handler="attention" size={9} />}
                {fmt(used)}/{fmt(limit)}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Media + caption */}
      <div className="mt-5 flex items-center gap-3">
        <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-line bg-bg-alt" aria-hidden>
          <MediaThumb src="reel" sizes="44px" />
          <span
            className="absolute inset-0 grid place-items-center text-white"
            style={{ background: scrim(0.2) }}
          >
            <Play className="size-3.5 fill-current" strokeWidth={0} />
          </span>
        </span>
        <p className="min-w-0 text-[13px] leading-snug">
          <span className="font-medium">drop-04.mp4</span>
          <span className="mono block text-[11px] text-ink-soft">Video · 0:08</span>
        </p>
      </div>

      <label htmlFor={ids.caption} className="eyebrow mt-5 block">
        Caption
      </label>
      {/* Grows with the caption: invisible copies of the text size the grid cell and the field fills it.
          One copy always holds the longest demo caption, so the card never jumps while the demo types. */}
      <div className="mt-2 grid">
        {[caption + overflow, value].map((t, i) => (
          <div
            key={i}
            aria-hidden
            className={cn(fieldBox, "invisible max-h-[360px] overflow-hidden whitespace-pre-wrap [grid-area:1/1]")}
          >
            {t + "\u200b"}
          </div>
        ))}
        <textarea
          id={ids.caption}
          value={value}
          onFocus={take}
          onChange={(e) => {
            setTouched(true);
            setText(e.target.value);
          }}
          rows={4}
          maxLength={3200}
          aria-describedby={ids.warn}
          className={cn(fieldBox, "block h-full resize-none overflow-y-auto [grid-area:1/1]")}
        />
      </div>
      <div id={ids.warn} className="mt-2 min-h-[22px] space-y-1">
        {over.length === 0 && (
          <p className="mono text-[11px] leading-[20px] text-ink-soft tabular-nums">
            {fmt(used)} characters · fits all {targets.length} networks
          </p>
        )}
        {over.map((p) => (
          <p key={p} className="flex items-start gap-2 text-[13px] leading-snug text-ink">
            <Glyph handler="attention" size={10} className="mt-[3px]" />
            {networkLabel[p]} supports {fmt(captionLimit[p] ?? 0)} characters ({fmt(used)} used)
          </p>
        ))}
      </div>
      {/* Announce when a network goes over or back under its limit, not every character typed. */}
      <p className="sr-only" aria-live="polite">
        {over.length
          ? over.map((p) => `${networkLabel[p]} is over its ${fmt(captionLimit[p] ?? 0)}-character limit.`).join(" ")
          : ""}
      </p>

      {/* Preview tabs */}
      <div className="mt-5">
        <div role="tablist" aria-label="Preview per network" className="flex gap-1 border-b border-line">
          {targets.map((p) => (
            <button
              key={p}
              id={`${ids.tabs}-${p}`}
              type="button"
              role="tab"
              aria-selected={tab === p}
              aria-controls={`${ids.tabs}-panel`}
              tabIndex={tab === p ? 0 : -1}
              onClick={() => setTab(p)}
              onKeyDown={onTabKey}
              data-active={tab === p ? "true" : "false"}
              className={cn(
                "-mb-px grid h-11 min-w-11 flex-1 place-items-center border-b-2",
                tab === p ? "border-ink" : "border-transparent hover:border-line-strong",
              )}
            >
              <PlatformIcon id={p} size={16} />
              <span className="sr-only">{networkLabel[p]} preview</span>
            </button>
          ))}
        </div>
        <div id={`${ids.tabs}-panel`} role="tabpanel" aria-labelledby={`${ids.tabs}-${tab}`} className="pt-4">
          <NetworkPreview network={tab} text={value} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line pt-5">
        <button
          type="button"
          onClick={onPublish}
          className="k-btn k-btn-accent h-11 px-5 text-[15px]"
          aria-label="Publish now (demo: replays the departures board; nothing is posted)"
        >
          Publish now
        </button>
        <p className="mono text-[11.5px] text-ink-soft">or Schedule · Save draft</p>
      </div>
    </div>
  );
}
