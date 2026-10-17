"use client";

import { memo } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";

import { Glyph } from "@/components/transit/glyph";
import { Roundel } from "@/components/transit/roundel";
import { FlapText } from "@/components/ui/flap-text";
import { cn } from "@/lib/cn";
import type { RowState } from "@/lib/hero/board";
import type { Media } from "@/lib/hero/types";
import { platformById, type PlatformId } from "@/lib/platforms";

import { PencilRing } from "./pencil-ring";
import { MediaThumb } from "./post-media";

const EASE = [0.22, 1, 0.36, 1] as const;

const fade: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

function RowGlyph({ glyph }: { glyph: RowState["glyph"] }) {
  if (!glyph) return <span className="size-3.5" aria-hidden />;
  if (glyph === "sorted") {
    return (
      <svg aria-hidden width="14" height="14" viewBox="-7 -7 14 14" className="shrink-0">
        <path d="M-5 -2 L0 3 L5 -2" fill="none" stroke="var(--k-ink)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M-5 5 H5" stroke="var(--k-ink)" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    );
  }
  return <Glyph handler={glyph} size={glyph === "post" ? 8 : 11} />;
}

/**
 * One station on the board: a fixed-height button (rows never change height, so routes are
 * never re-measured mid-loop). Hover or focus previews its latest exchange; click pins it.
 */
export const StationRow = memo(function StationRow({
  id,
  index,
  row,
  media,
  pinned,
  still,
  onPin,
  onPeek,
}: {
  id: PlatformId;
  index: number;
  row: RowState;
  media: Media | null;
  pinned: boolean;
  still: boolean;
  onPin: (id: PlatformId) => void;
  onPeek: (id: PlatformId | null) => void;
}) {
  const p = platformById[id];
  const num = String(index + 1).padStart(2, "0");
  const wipe = !row.snippet;
  const idle = index < 5 ? "Ready to publish" : "Waiting for messages";
  const delay = (w: boolean) => (w ? (7 - index) * 0.03 : 0);
  // Old and new travel in step (same duration, delay and ease), so they never overlap; the old
  // one also fades as it leaves, so even an interrupted roll never shows two lines at once.
  const roll: Variants = {
    enter: { y: "100%", opacity: 0 },
    center: (w: boolean) => ({ y: "0%", opacity: 1, transition: { duration: 0.26, delay: delay(w), ease: EASE } }),
    exit: (w: boolean) => ({
      y: "-100%",
      opacity: 0,
      transition: { y: { duration: 0.26, delay: delay(w), ease: EASE }, opacity: { duration: 0.16, delay: delay(w) } },
    }),
  };
  return (
    <button
      type="button"
      data-line={id}
      aria-pressed={pinned}
      aria-label={`${num} ${p.name} line, ${row.status ? row.status.toLowerCase() : idle.toLowerCase()}${row.snippet ? `: ${row.snippet}` : ""}. ${pinned ? "Unpin" : "Pin"} this exchange`}
      onClick={() => onPin(id)}
      onMouseEnter={() => onPeek(id)}
      onMouseLeave={() => onPeek(null)}
      onFocus={() => onPeek(id)}
      onBlur={() => onPeek(null)}
      className={cn(
        "kh-row group relative flex h-10 w-full min-w-0 shrink-0 items-center gap-2 rounded-md pr-2.5 pl-[65px] text-left transition-colors",
        "min-[75rem]:h-12 min-[75rem]:gap-3 min-[75rem]:rounded-none min-[75rem]:pr-3 min-[75rem]:pl-0",
        "hover:bg-bg-alt/60 focus-visible:bg-bg-alt/60",
        pinned && "bg-bg-alt",
      )}
    >
      {/* Mobile / tablet roundel on the spine leader. */}
      <span className="absolute top-1/2 left-[35px] -translate-y-1/2 min-[75rem]:hidden">
        <Roundel platform={id} size={22} active={row.active} />
      </span>
      {/* Desktop roundel straddles the board edge where its branch ends. */}
      <span data-hx={`roundel-${id}`} className="kh-roundel relative z-[1] -ml-[15px] hidden size-7 shrink-0 min-[75rem]:block">
        <Roundel platform={id} size={28} active={row.active} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="flex min-w-0 items-baseline gap-1.5 leading-none">
          <span className="mono shrink-0 text-[11px] text-ink-soft">{num}</span>
          {/* The line's own name never truncates; its automation tag gives way first. */}
          <span className="truncate text-[13px] font-medium text-ink md:shrink-0 md:font-mono md:text-[11px] md:font-normal md:tracking-[0.06em] md:uppercase">
            {p.name}
          </span>
          {row.tag && (
            <span className="kh-tag mono hidden min-w-0 truncate text-[11px] tracking-[0.02em] text-accent-text uppercase md:inline">
              · {row.tag}
            </span>
          )}
          {row.mode && (
            <span className="kh-mode mono hidden shrink-0 rounded-sm border border-line-strong px-1 py-px text-[11px] uppercase md:inline-flex">
              <FlapText text={row.mode} />
            </span>
          )}
        </span>
        <span className="relative mt-1 hidden h-[17px] overflow-hidden text-[13px] leading-[17px] text-ink md:block">
          {/* One roll: the old line leaves as the new one arrives, in step, so the two never overlap.
              Only the end-of-run wipe (snippet cleared) staggers bottom-up, and both halves wait for it. */}
          <AnimatePresence initial={false} custom={wipe}>
            <motion.span
              key={row.rev}
              custom={wipe}
              className={cn("absolute inset-0 truncate", !row.snippet && "text-ink-soft")}
              variants={still ? fade : roll}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {row.snippet || idle}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>

      {/* Native preview once the post lands here: its media, or a text tile on LinkedIn (text-only publishing). */}
      <AnimatePresence initial={false}>
        {row.thumb && (
          <motion.span
            key="thumb"
            aria-hidden
            className="kh-thumb relative size-7 shrink-0 overflow-hidden rounded-[8px] shadow-[0_0_0_1px_var(--k-line)] min-[75rem]:size-9 min-[75rem]:rounded-[10px]"
            initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18, delay: (7 - index) * 0.03 } }}
            transition={{ duration: still ? 0.15 : 0.32, ease: EASE }}
          >
            <MediaThumb media={row.thumb === "text" ? null : media} platform={id} sizes="36px" />
          </motion.span>
        )}
      </AnimatePresence>

      <span className="flex w-[124px] shrink-0 items-center justify-end gap-1.5 min-[75rem]:w-[136px]">
        <RowGlyph glyph={row.glyph} />
        <FlapText text={row.status} className="text-[11px] tracking-[0.02em] text-ink" />
      </span>

      <AnimatePresence>{row.ring && <PencilRing key="ring" seed={index + 1} still={still} />}</AnimatePresence>
    </button>
  );
});
