"use client";

import { useRef, type CSSProperties } from "react";
import { motion, useInView } from "motion/react";
import { Check } from "lucide-react";

import { Glyph } from "@/components/transit/glyph";
import { cn } from "@/lib/cn";
import { useMotionPrefs } from "@/lib/studio/store";

import { catalog, type CatalogItem, type Handoff, type MsgBeat, type SharedPostRef } from "./data";
import { ProductCard, SharedPost } from "./media-bits";
import { ModeSwitch } from "./mode-switch";
import { PencilRing } from "./pencil-ring";
import { Words } from "./words";

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Mono tag above bot bubbles: the legend glyph says who answered. */
export function SpeakerTag({ from }: { from: "agent" | "menu" }) {
  return (
    <p className="mono mb-1.5 flex items-center gap-1.5 text-[11px] tracking-[0.08em] text-ink-soft uppercase">
      <Glyph handler={from === "agent" ? "agent" : "automation"} size={9} />
      {from === "agent" ? "Agent" : "Menu bot"}
    </p>
  );
}

/** Margin annotation for the page reader; customers never see it. */
export function MarginNote({ text, className }: { text: string; className?: string }) {
  return (
    <p className={cn("mono text-[11px] leading-[1.45] text-ink-soft", className)}>
      <span aria-hidden className="text-ink">
        ↳{" "}
      </span>
      <span className="sr-only">Note: </span>
      {text}
    </p>
  );
}

/** A chat bubble for one message beat (customer right, bots left). */
export function Bubble({
  beat,
  play,
  activeButton,
}: {
  beat: MsgBeat;
  play: boolean;
  activeButton?: string;
}) {
  const wordsBefore = (i: number) =>
    beat.lines
      .slice(0, i)
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;

  if (beat.from === "customer") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {beat.shared && <SharedAttachment shared={beat.shared} play={play} />}
        <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-bg-alt px-3.5 py-2.5 text-[15px] leading-[1.45] text-ink">
          <span className="sr-only">Customer: </span>
          <Words text={beat.lines.join(" ")} play={play} typo={beat.typo} />
        </p>
      </div>
    );
  }

  const from = beat.from;
  return (
    <div className="min-w-0">
      <SpeakerTag from={from} />
      <div className="w-fit max-w-[88%] rounded-2xl rounded-tl-sm border border-line bg-surface px-3.5 py-2.5 text-[15px] leading-[1.45] text-ink">
        <span className="sr-only">{from === "agent" ? "Agent: " : "Menu bot: "}</span>
        {beat.lines.map((line, i) => (
          <span key={i} className={cn("block", line.startsWith("•") && "pl-1")}>
            <Words text={line} play={play} delay={wordsBefore(i) * 24} />
          </span>
        ))}
      </div>
      {beat.buttons && <MenuButtons labels={beat.buttons} active={activeButton} play={play} />}
      {beat.carousel && <Carousel play={play} />}
      {beat.quick && (
        <div className="mt-2 flex gap-2" role="group" aria-label="Quick replies">
          {beat.quick.map((q) => (
            <span
              key={q}
              className="inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-medium shadow-[inset_0_0_0_1px_var(--k-line-strong)]"
            >
              {q}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MenuButtons({ labels, active, play }: { labels: string[]; active?: string; play: boolean }) {
  const { still, pace } = useMotionPrefs();
  const animate = play && !still;
  return (
    <ul className="mt-2 flex max-w-[min(88%,280px)] flex-col gap-1.5" aria-label="Menu buttons">
      {labels.map((label, i) => (
        <motion.li
          key={label}
          initial={animate ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 * pace, delay: (0.18 + i * 0.06) * pace, ease: easeOut }}
          className={cn(
            "flex h-9 items-center justify-center rounded-lg text-[13px] font-medium transition-colors duration-300",
            label === active ? "bg-ink text-bg" : "text-ink shadow-[inset_0_0_0_1px_var(--k-line-strong)]",
          )}
        >
          {label}
        </motion.li>
      ))}
    </ul>
  );
}

/** A post the customer shared into the DM, rising in before their question. */
function SharedAttachment({ shared, play }: { shared: SharedPostRef; play: boolean }) {
  const { still, pace } = useMotionPrefs();
  const animate = play && !still;
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45 * pace, ease: easeOut }}
      style={{ originX: 1, originY: 1 }}
    >
      <p className="mono mb-1 text-right text-[11px] text-ink-soft">Shared a post</p>
      <SharedPost photo={shared.photo} caption={shared.caption} className="w-[176px] md:w-[188px]" />
    </motion.div>
  );
}

/**
 * Catalog rows as swipe cards, the way Instagram and Messenger show them: photo,
 * name, price and note from each row. The strip runs off the edge to read as a carousel.
 */
export function Carousel({ play, items = catalog }: { play: boolean; items?: CatalogItem[] }) {
  const { still, pace } = useMotionPrefs();
  const animate = play && !still;
  return (
    <div
      className="mt-2 -mr-5 overflow-hidden pr-5 [mask-image:linear-gradient(to_right,black_calc(100%-56px),transparent)]"
      aria-label="Catalog cards"
    >
      <ul className="flex gap-2">
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            initial={animate ? { x: 36, opacity: 0 } : false}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 * pace, delay: (0.3 + i * 0.07) * pace, ease: easeOut }}
            className="w-[140px] shrink-0 md:w-[150px]"
          >
            <ProductCard item={item} sizes="150px" />
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Three dots for the short typing beat before an agent reply. The bounce loops,
 * so it only runs while on screen (a paused stage can leave it mounted).
 */
export function TypingDots({ from = "agent" }: { from?: "agent" | "menu" }) {
  const { still } = useMotionPrefs();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const loop = inView && !still;
  return (
    <div ref={ref} className="min-w-0" aria-hidden>
      <SpeakerTag from={from} />
      <div className="inline-flex h-[42px] items-center gap-1 rounded-2xl rounded-tl-sm border border-line bg-surface px-4">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block size-1.5 rounded-full bg-ink-soft"
            initial={false}
            animate={loop ? { y: [0, -3, 0] } : { y: 0 }}
            transition={
              loop ? { duration: 0.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" } : { duration: 0.15 }
            }
          />
        ))}
      </div>
    </div>
  );
}

/** The structured handoff note, the red-flag banner your team sees in the inbox. */
export function HandoffBanner({ handoff, play, className }: { handoff: Handoff; play: boolean; className?: string }) {
  const { still, pace } = useMotionPrefs();
  const animate = play && !still;
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42 * pace, ease: easeOut }}
      className="rounded-xl border border-line bg-pop-1/15 p-3.5"
      role="note"
    >
      <div className="flex items-center justify-between gap-3">
        <PencilRing drawn seed={11} drawOnMount={animate} delay={0.3}>
          <span className="mono flex items-center gap-1.5 px-1 text-[11px] font-medium tracking-[0.08em] text-ink uppercase">
            <Glyph handler="attention" size={10} />
            Needs attention
          </span>
        </PencilRing>
        <span className="mono flex shrink-0 items-center gap-1.5 text-[11px] tracking-[0.08em] text-ink-soft uppercase">
          <Glyph handler="team" size={9} />
          To your team
        </span>
      </div>
      <dl className={cn("mono mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[12px] leading-[1.45] text-ink", className)}>
        <dt className="text-ink-soft">Asked:</dt>
        <dd className="min-w-0 break-words">{handoff.asked}</dd>
        <dt className="text-ink-soft">Tried:</dt>
        <dd className="min-w-0 break-words">{handoff.tried}</dd>
        <dt className="text-ink-soft">Why:</dt>
        <dd className="min-w-0 break-words">{handoff.why}</dd>
      </dl>
    </motion.div>
  );
}

/** The settings confirmation Autoreply shows when you switch a channel from Menu to Agentic. */
export function MenuToast({
  confirmed,
  play,
  withSwitch = false,
  className,
}: {
  confirmed: boolean;
  play: boolean;
  /** Show the channel switch inside the toast (stacked layout). */
  withSwitch?: boolean;
  className?: string;
}) {
  const { still, pace } = useMotionPrefs();
  const animate = play && !still;
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: -6 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3 * pace, ease: easeOut }}
      className={cn("k-card p-3.5", className)}
      style={{ "--k-tilt": "0deg" } as CSSProperties}
      role="status"
    >
      <p className="mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">Autoreply · Messenger</p>
      <p className="mt-1.5 text-[14px] leading-snug font-medium text-ink">Stop the menu bot and open the agentic bot?</p>
      {withSwitch && (
        <ModeSwitch mode={confirmed ? "agentic" : "menu"} label="Messenger DMs" className="mt-3" />
      )}
      <div className="mt-3 flex justify-end gap-2" aria-hidden>
        <span className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-medium text-ink-soft">Cancel</span>
        <motion.span
          className="k-btn k-btn-accent h-8 px-3 text-[13px]"
          animate={confirmed && !still ? { scale: [1, 0.94, 1] } : { scale: 1 }}
          transition={{ duration: 0.28 * pace, ease: easeOut }}
        >
          {confirmed && <Check className="size-3.5" strokeWidth={2.5} aria-hidden />}
          Confirm
        </motion.span>
      </div>
    </motion.div>
  );
}
