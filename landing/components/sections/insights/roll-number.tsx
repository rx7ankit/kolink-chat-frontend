"use client";

import { useRef } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/cn";

import styles from "./digits.module.css";
import { usePlay } from "./hooks";

const CELL = 1.1; // em per digit cell
const out = [0.22, 1, 0.36, 1] as const;

/**
 * Odometer for formatted figures ("12,840", "+299", "48.2K"): each digit column
 * spins one full turn and lands on its digit the first time it scrolls into view,
 * and rolls again if the value changes. Separators and suffixes stay put.
 *
 * The figure is always readable: every column holds 0–9 twice, parks on its digit in
 * the first run and spins to the same digit in the second run, so the parked state,
 * the server render, Still and a roll that never starts all show the final value.
 * Glyphs are CSS generated content: the only text node is the sr-only value.
 */
export function RollNumber({
  value,
  className,
  delay = 0,
  duration = 0.9,
}: {
  value: string;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { shown, animated, pace } = usePlay(ref);
  const chars = Array.from(value);
  const isDigit = chars.map((c) => c >= "0" && c <= "9");
  const digitCount = isDigit.filter(Boolean).length;
  // Position of each digit among the digits, counted from the left.
  const order: number[] = [];
  for (let i = 0, n = 0; i < chars.length; i++) order.push(isDigit[i] ? n++ : -1);

  return (
    <span ref={ref} className={cn("relative inline-flex items-start leading-[1.1]", className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="inline-flex items-start" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
        {chars.map((ch, i) => {
          // Key from the right so columns persist when the value grows or shrinks.
          const key = chars.length - i;
          if (!isDigit[i]) {
            return <span key={`s${key}`} data-ch={ch} className={cn(styles.ch, "block h-[1.1em]")} />;
          }
          const digit = Number(ch);
          // Parked: the digit in the first run. Shown: the same digit one full turn later.
          const y = (shown ? digit + 10 : digit) * -CELL;
          return (
            <span key={`d${key}`} className="relative block h-[1.1em] overflow-y-clip">
              <span data-ch={ch} className={cn(styles.ch, "invisible block")} />
              <motion.span
                className={cn(styles.strip, "absolute inset-x-0 top-0 block text-center")}
                initial={false}
                animate={{ y: `${y}em` }}
                transition={
                  shown && animated
                    ? { duration: duration * pace, delay: (delay + (digitCount - order[i]) * 0.045) * pace, ease: out }
                    : { duration: 0 }
                }
              />
            </span>
          );
        })}
      </span>
    </span>
  );
}
