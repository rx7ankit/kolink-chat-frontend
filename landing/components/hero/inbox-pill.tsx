"use client";

import { motion } from "motion/react";

import { Glyph } from "@/components/transit/glyph";
import { Odometer } from "@/components/ui/odometer";
import { cn } from "@/lib/cn";

/**
 * INBOX: the end of the trunk for anything your team should answer. The ▲ badge is where
 * the dashed siding ends (hand-offs that need a person). Both carry measurement anchors.
 * The rolling digits are decorative; assistive tech reads one plain sentence instead.
 */
export function InboxPill({
  inbox,
  attention,
  still,
  className,
}: {
  inbox: number;
  attention: number;
  still: boolean;
  className?: string;
}) {
  return (
    <span
      data-hx="pill"
      className={cn(
        "mono relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-line-strong bg-surface pr-3 pl-2.5 text-[11px] tracking-[0.06em] text-ink uppercase",
        className,
      )}
    >
      <Glyph handler="team" size={9} />
      <span aria-hidden>Inbox</span>
      <span aria-hidden className="inline-flex">
        <Odometer value={inbox} />
      </span>
      <span className="sr-only">
        Inbox {inbox}, {attention} {attention === 1 ? "needs" : "need"} attention
      </span>
      <span
        data-hx="badge"
        aria-hidden
        // The galley pill is 28px tall: its badge rides a little higher and slimmer so it never covers the count.
        className="absolute -top-2.5 right-1 inline-flex h-5 items-center gap-1 rounded-full border border-line-strong bg-surface px-1.5 text-[11px] tracking-normal max-[75rem]:-top-3 max-[75rem]:h-[18px] max-[75rem]:px-1"
      >
        <motion.span
          key={attention}
          className="inline-flex"
          animate={still || attention === 0 ? { rotate: 0 } : { rotate: [0, -14, 10, -6, 0] }}
          transition={{ duration: 0.48 }}
        >
          <Glyph handler="attention" size={9} />
        </motion.span>
        <Odometer value={attention} />
      </span>
    </span>
  );
}
