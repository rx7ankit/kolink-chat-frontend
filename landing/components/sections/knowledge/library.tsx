"use client";

import { useEffect, useState, type CSSProperties, type Ref } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";

import { Photo } from "@/components/media/photo";
import { ModeSwitch } from "@/components/sections/agent/mode-switch";
import { Roundel } from "@/components/transit/roundel";
import { FlapText } from "@/components/ui/flap-text";
import { Odometer } from "@/components/ui/odometer";
import { cn } from "@/lib/cn";
import type { PhotoId } from "@/lib/media";
import { useMotionPrefs } from "@/lib/studio/store";

import { cardCount, type KnowledgeCard } from "./data";

/** Link sources are fetched once by a worker: PENDING, then READY ~600ms after landing. */
export function FetchStatus({ active, delay = 600 }: { active: boolean; delay?: number }) {
  const { still, pace } = useMotionPrefs();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!active || still) return;
    const id = window.setTimeout(() => setReady(true), delay * pace);
    return () => window.clearTimeout(id);
  }, [active, still, pace, delay]);
  const isReady = ready || (active && still);
  return (
    <span
      className={cn(
        "flex h-5 shrink-0 items-center gap-1 rounded-sm px-1.5 text-[11px] tracking-[0.04em] shadow-[inset_0_0_0_1px_var(--k-line-strong)] transition-colors duration-300",
        isReady ? "text-ink" : "text-ink-soft",
      )}
    >
      {isReady && <Check className="size-3 text-ink" strokeWidth={2.5} aria-hidden />}
      <FlapText text={isReady ? "READY" : "PENDING"} />
    </span>
  );
}

/** A contact strip of product photos from the catalog rows. */
export function ThumbStrip({
  thumbs,
  size = 34,
  compact = true,
  className,
}: {
  thumbs: PhotoId[];
  size?: number;
  /** Drop the fourth photo below xl, where the library row is narrow. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("flex shrink-0 items-center gap-1", className)} aria-label="Catalog photos">
      {thumbs.map((id, i) => (
        <li
          key={id}
          className={cn("overflow-hidden rounded-[6px] bg-bg-alt ring-1 ring-line", compact && i === 3 && "max-xl:hidden")}
          style={{ width: size, height: size }}
        >
          <Photo id={id} sizes={`${size * 2}px`} />
        </li>
      ))}
    </ul>
  );
}

function KindTag({ kind }: { kind: KnowledgeCard["kind"] }) {
  return (
    <span className="mono flex h-5 shrink-0 items-center rounded-sm px-1.5 text-[11px] tracking-[0.04em] text-ink-soft uppercase shadow-[inset_0_0_0_1px_var(--k-line)]">
      {kind}
    </span>
  );
}

/**
 * One filed source: title and kind tag (plus fetch status for links, photos for the
 * catalog). `stacked` is the narrow phone card: tags wrap under the title if needed
 * and the catalog photos get their own row.
 */
export function CardBody({
  card,
  index,
  active,
  stacked = false,
  statusDelay,
}: {
  card: KnowledgeCard;
  index: number;
  active: boolean;
  stacked?: boolean;
  /** ms from `active` until a link source reads READY. */
  statusDelay?: number;
}) {
  const num = <span className="mono text-[11px] text-ink-soft tabular-nums">{String(index + 1).padStart(2, "0")}</span>;
  const tags = (
    <div className="flex items-center gap-1.5">
      {card.fetched && <FetchStatus active={active} delay={statusDelay} />}
      <KindTag kind={card.kind} />
    </div>
  );
  if (stacked) {
    return (
      <div className="grid min-w-0 flex-1 grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-2.5">
        {num}
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <p className="min-w-0 text-[14px] leading-snug font-semibold">{card.title}</p>
          {tags}
        </div>
        {card.thumbs && <ThumbStrip thumbs={card.thumbs} size={44} compact={false} className="col-start-2 mt-3" />}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "grid min-w-0 flex-1 items-center gap-x-2.5",
        card.thumbs ? "grid-cols-[1.5rem_minmax(0,1fr)_auto_auto]" : "grid-cols-[1.5rem_minmax(0,1fr)_auto]",
      )}
    >
      {num}
      <p className="min-w-0 truncate text-[14px] leading-tight font-semibold">{card.title}</p>
      {card.thumbs && <ThumbStrip thumbs={card.thumbs} />}
      {tags}
    </div>
  );
}

/** Desktop library slot: an empty dashed berth until the card lands with a physical spring. */
export function LibrarySlot({
  card,
  index,
  landed,
  slotRef,
}: {
  card: KnowledgeCard;
  index: number;
  landed: boolean;
  slotRef?: Ref<HTMLLIElement>;
}) {
  const { still } = useMotionPrefs();
  return (
    <li ref={slotRef} className="relative flex h-[56px] items-center border-b border-line px-4 last:border-b-0">
      {landed ? (
        <motion.div
          className="flex min-w-0 flex-1"
          initial={still ? false : { opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 34 }}
        >
          <CardBody card={card} index={index} active={landed} />
        </motion.div>
      ) : (
        <div className="grid flex-1 grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-2.5" aria-hidden>
          <span className="mono text-[11px] text-ink-soft/70 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
          <span className="h-8 rounded-md border border-dashed border-line" />
        </div>
      )}
    </li>
  );
}

/** A compact channel row with its mode switch, used in the library and on phones. */
export function ChannelRow({ platform, name, mode }: { platform: "instagram" | "messenger"; name: string; mode: "off" | "menu" | "agentic" }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Roundel platform={platform} size={28} active={mode !== "off"} />
      <p className="min-w-0 flex-1 truncate text-[14px] font-medium">{name}</p>
      {/* Full width (its own row) until the column is wide enough to keep the name and "Agentic" whole. */}
      <ModeSwitch mode={mode} label={name} className="w-full shrink-0 xl:w-[228px]" />
    </div>
  );
}

/** The sticky library column on desktop. */
export function Library({
  cards,
  landed,
  switched,
  slotRef,
  className,
}: {
  cards: KnowledgeCard[];
  landed: boolean[];
  switched: boolean;
  slotRef: (i: number) => Ref<HTMLLIElement>;
  className?: string;
}) {
  const count = landed.filter(Boolean).length;
  return (
    <div className={cn("k-card", className)} style={{ "--k-tilt": "0deg" } as CSSProperties}>
      <header className="flex items-end justify-between gap-4 border-b border-line px-4 py-4">
        <div className="min-w-0">
          <h3 className="text-[17px] leading-tight font-semibold">Knowledge library</h3>
          <p className="mono mt-1 truncate text-[11px] text-ink-soft">Northwind Studio (demo)</p>
        </div>
        <p className="mono flex shrink-0 items-center text-[11px] text-ink-soft">
          <Odometer value={count} className="text-ink" />
          <span>&nbsp;/ {cardCount} sources</span>
        </p>
      </header>
      <ol aria-label="Filed knowledge">
        {cards.map((card, i) => (
          <LibrarySlot key={card.title} card={card} index={i} landed={landed[i]} slotRef={slotRef(i)} />
        ))}
      </ol>
      <div className="border-t border-line px-4 pt-3.5 pb-4">
        <p className="eyebrow">Where it answers</p>
        <div className="mt-3 flex flex-col gap-2.5">
          <ChannelRow platform="instagram" name="Instagram DMs" mode={switched ? "agentic" : "off"} />
          <ChannelRow platform="messenger" name="Messenger DMs" mode={switched ? "menu" : "off"} />
        </div>
      </div>
    </div>
  );
}
