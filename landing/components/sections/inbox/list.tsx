"use client";

import type { Ref } from "react";
import { AnimatePresence, motion, useTransform, type MotionValue } from "motion/react";
import { Bell, Check } from "lucide-react";

import { Photo } from "@/components/media/photo";
import { Glyph } from "@/components/transit/glyph";
import { Odometer } from "@/components/ui/odometer";
import { cn } from "@/lib/cn";

import { Avatar, HandlerBadge } from "./badge";
import { ago, channelFilters, codes, labelById, team, tint, type ChannelFilter, type Thread } from "./data";
import { clamp01, useSafeMotionPrefs } from "./hooks";

const travel = [0.65, 0, 0.35, 1] as const;

/**
 * Channel chips: All · Instagram · Messenger · WhatsApp · LinkedIn · Email · Threads · X.
 * Instagram and Messenger carry attention badges, as in the app (the only bot channels).
 */
export function ChannelChips({
  value,
  attention,
  onChange,
}: {
  value: ChannelFilter;
  attention: Partial<Record<ChannelFilter, number>>;
  onChange: (c: ChannelFilter) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filter by channel"
      // The row scrolls sideways on phones and at 1024–1279px; the faded right edge says so.
      className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pr-6 [mask-image:linear-gradient(to_right,black_calc(100%_-_28px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {channelFilters.map((c) => {
        const on = c.id === value;
        const flagged = attention[c.id] ?? 0;
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(c.id)}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md px-3 text-[13px] transition-colors lg:px-2.5 lg:text-[12.5px] lg:pointer-fine:h-8 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--k-accent-text)]",
              on ? "bg-ink font-semibold text-bg" : "text-ink shadow-[inset_0_0_0_1px_var(--k-line-strong)] hover:bg-bg",
            )}
          >
            {c.label}
            {flagged > 0 && (
              <span className="mono inline-flex items-center gap-0.5 text-[11px] font-semibold">
                <Glyph handler="attention" size={8} />
                {flagged}
                <span className="sr-only"> need attention</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** The attention bell: how many Instagram and Messenger threads need a person (the app polls it every 20s). */
export function AttentionBell({ ig, ms, className }: { ig: number; ms: number; className?: string }) {
  return (
    <p className={cn("mono flex shrink-0 items-center gap-1.5 text-[11.5px] text-ink", className)}>
      <span className="sr-only">
        Needs a person: Instagram {ig}, Messenger {ms}
      </span>
      <span className="relative inline-grid" aria-hidden>
        <Bell size={15} strokeWidth={1.75} />
        {ig + ms > 0 && (
          <span
            className="absolute -top-1 -right-1 size-2 rounded-full bg-attention"
            style={{ boxShadow: "0 0 0 1.5px var(--k-surface), inset 0 0 0 1px var(--k-ink)" }}
          />
        )}
      </span>
      <span aria-hidden className="inline-flex items-center">
        <Odometer value={ig + ms} />
      </span>
    </p>
  );
}

function AssigneeMenu({ thread }: { thread: Thread }) {
  const { still, pace } = useSafeMotionPrefs();
  return (
    <motion.div
      aria-hidden
      className="absolute top-[50px] right-2 z-20 w-44 rounded-lg border border-line-strong bg-surface p-1 text-[12.5px]"
      style={{ boxShadow: "0 2px 0 0 var(--k-line)", transformOrigin: "90% 0%" }}
      initial={still ? { opacity: 0 } : { opacity: 0, scaleY: 0.6, y: -4 }}
      animate={{ opacity: 1, scaleY: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: still ? 0.15 : 0.22 * pace, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="mono px-2 pt-1 pb-1.5 text-[11px] tracking-[0.06em] text-ink-soft uppercase">Assign to</p>
      <div className="flex h-7 items-center gap-2 rounded-sm px-2 text-ink-soft">
        Unassigned
        {!thread.assignee && <Check size={13} className="ml-auto" />}
      </div>
      {team.map((m) => (
        <div
          key={m.id}
          className={cn("flex h-7 items-center gap-2 rounded-sm px-2", m.id === "A" && "bg-bg")}
        >
          <Avatar id={m.id} size={16} />
          {m.name}
          {m.you && <span className="text-ink-soft">(you)</span>}
          {thread.assignee === m.id && <Check size={13} className="ml-auto" />}
        </div>
      ))}
    </motion.div>
  );
}

export function Row({
  thread,
  selected,
  highlighted,
  menuOpen,
  lifting,
  tip,
  len,
  onSelect,
  ref,
}: {
  thread: Thread;
  selected: boolean;
  highlighted: boolean;
  menuOpen: boolean;
  lifting: boolean;
  /** Distance the docking lines have travelled; the row's stub fills when its line arrives. */
  tip: MotionValue<number>;
  len: number;
  onSelect: (trigger: HTMLElement) => void;
  ref?: Ref<HTMLLIElement>;
}) {
  const { still, pace } = useSafeMotionPrefs();
  const fill = useTransform(tip, (v) => clamp01((v - len) / 28));
  const ink = useTransform(fill, (f) => (lifting ? 0.35 : 0.35 + 0.65 * f));
  const label = thread.label ? labelById[thread.label] : null;

  return (
    <motion.li
      ref={ref}
      data-row={thread.id}
      layout={still ? false : "position"}
      // A row that re-sorts (the one being worked on) travels above its neighbours, not under them.
      className={cn("relative", menuOpen ? "z-10" : (highlighted || selected) && "z-[2]")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: still ? 0 : 18, transition: { duration: still ? 0.15 : 0.2 * pace } }}
      transition={{ duration: still ? 0.15 : 0.45 * pace, ease: travel }}
    >
      <button
        type="button"
        onClick={(e) => onSelect(e.currentTarget)}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "relative grid h-[60px] w-full grid-cols-[26px_minmax(0,1fr)_auto] items-center gap-x-2 border-b border-line pr-3 pl-4 text-left transition-colors duration-300 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--k-accent-text)]",
          // Opaque fills only: a row passing over another mid-sort must hide it, not show through.
          selected ? "bg-bg" : "bg-surface hover:bg-[color-mix(in_oklab,var(--k-bg)_60%,var(--k-surface))]",
        )}
        style={highlighted ? { background: tint("var(--k-pop1)", 16) } : undefined}
      >
        {/* The 4px stub is the end of this thread's line. */}
        <motion.span
          aria-hidden
          className="absolute top-[6px] bottom-[6px] left-0 w-1"
          style={{ background: `var(--line-${thread.platform})`, scaleY: fill, transformOrigin: "50% 50%" }}
        />
        <motion.span aria-hidden className="mono text-[11px] font-semibold tracking-[0.02em]" style={{ opacity: ink }}>
          {codes[thread.platform]}
        </motion.span>
        <motion.span className="min-w-0" style={{ opacity: ink }}>
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={cn("truncate text-[13.5px]", selected || thread.attention ? "font-semibold" : "font-medium")}>{thread.name}</span>
            {label && (
              <span
                className="mono shrink-0 rounded-sm px-1.5 py-px text-[11px] leading-[1.35] tracking-[0.02em] text-ink uppercase"
                style={{ background: tint(label.tone, 26) }}
              >
                {label.name}
              </span>
            )}
          </span>
          <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-ink-soft">
            {thread.previewPhoto && (
              <span className="relative size-4 shrink-0 overflow-hidden rounded-[4px] bg-bg-alt">
                <Photo id={thread.previewPhoto} sizes="16px" alt="" />
                <span aria-hidden className="absolute inset-0 rounded-[4px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--k-ink)_12%,transparent)]" />
                <span className="sr-only">Photo attached. </span>
              </span>
            )}
            <span className="truncate">{thread.preview}</span>
          </span>
        </motion.span>
        <motion.span className="flex flex-col items-end gap-1" style={{ opacity: ink }}>
          <span className="mono text-[11px] text-ink-soft">{ago(thread.ts)}</span>
          <HandlerBadge thread={thread} />
        </motion.span>
      </button>
      <AnimatePresence>{menuOpen && <AssigneeMenu thread={thread} />}</AnimatePresence>
    </motion.li>
  );
}

export function EmptyRow() {
  return (
    <li className="mono px-4 py-10 text-center text-[11.5px] tracking-[0.04em] text-ink-soft uppercase">Nothing on this line right now</li>
  );
}
