"use client";

import { useRef } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/cn";

import { usePlay } from "./hooks";

/**
 * Rubber stamp on the corner of the data sheet. It lands once, like a real stamp
 * (a physical object, so it gets the page's spring), and stays put afterwards.
 * It scales about its right edge, so the oversized parked state grows inward and
 * never pushes past the viewport on a 375px phone.
 */
export function Stamp({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { shown, animated, pace, amp } = usePlay(ref, "0px 0px -18% 0px");
  const lift = 0.3 * amp;

  return (
    <div ref={ref} className={cn("pointer-events-none", className)}>
      <motion.p
        role="note"
        initial={false}
        animate={shown ? { opacity: 1, scale: 1, rotate: -6 } : { opacity: 0, scale: 1 + lift, rotate: -6 - 16 * lift }}
        transition={
          shown && animated
            ? { type: "spring", stiffness: 520, damping: 28, delay: 0.35 * pace, opacity: { duration: 0.12, delay: 0.35 * pace } }
            : { duration: 0 }
        }
        className="mono rounded-md border-2 border-current px-3 py-2 text-center text-[11px] leading-[1.35] font-semibold tracking-[0.14em] text-accent-text uppercase"
        style={{
          originX: 1,
          originY: 0.5,
          background: "color-mix(in oklab, var(--k-surface) 88%, transparent)",
          boxShadow: "inset 0 0 0 2px var(--k-surface), inset 0 0 0 3px currentColor",
        }}
      >
        <span className="block">Demo workspace</span>
        <span className="block">
          <span aria-hidden>· </span>Illustrative numbers<span aria-hidden> ·</span>
        </span>
      </motion.p>
    </div>
  );
}
