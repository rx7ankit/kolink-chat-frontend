"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/cn";
import { useMotionPrefs } from "@/lib/studio/store";

/**
 * Rolling digits: each digit column slides to its new value. Tabular figures,
 * so the width never jumps. Use for counters that change while visible.
 */
export function Odometer({ value, className, pad = 1 }: { value: number; className?: string; pad?: number }) {
  const { still, pace } = useMotionPrefs();
  const digits = Math.max(0, Math.round(value)).toString().padStart(pad, "0").split("");
  return (
    <span className={cn("mono inline-flex tabular-nums", className)}>
      <span className="sr-only">{Math.max(0, Math.round(value))}</span>
      {digits.map((d, i) => (
        <span key={digits.length - i} aria-hidden className="relative inline-block h-[1em] w-[1ch] overflow-hidden leading-none">
          {/* The 0–9 strip is drawn by CSS (.k-odo-strip::before) so it never leaks into copy-paste or find-in-page. */}
          <motion.span
            className="k-odo-strip absolute inset-x-0 top-0 block leading-none"
            initial={false}
            animate={{ y: `${-Number(d)}em` }}
            transition={still ? { duration: 0 } : { duration: 0.5 * pace, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
      ))}
    </span>
  );
}
