"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/cn";

const STOPS = [
  { n: "01", long: "Write once", short: "Write" },
  { n: "02", long: "Publish to 5", short: "Publish" },
  { n: "03", long: "Answer replies", short: "Answer" },
];

/**
 * The three-beat explainer: a three-stop mini line. A 10px accent capsule marks the stop the
 * demo is at; the active stop label is ink, the others ink-soft. The capsule hops from stop to
 * stop (it settles in from the left, toward the direction of travel) rather than sliding across
 * the labels in between, so it never covers a word mid-flight.
 */
export function StepRail({ step, still, className }: { step: 0 | 1 | 2 | 3; still: boolean; className?: string }) {
  const at = Math.max(1, step);
  return (
    <ol
      className={cn(
        "mono flex flex-wrap items-center gap-y-1.5 text-[11px] tracking-[0.06em] uppercase min-[75rem]:flex-nowrap min-[75rem]:tracking-[0.04em]",
        className,
      )}
      aria-label="Demo steps"
    >
      {STOPS.map((s, i) => {
        const active = step === i + 1;
        return (
          <li key={s.n} className="flex items-center" aria-current={active ? "step" : undefined}>
            <span className="relative mr-1.5 grid size-3 shrink-0 place-items-center" aria-hidden>
              <span className="size-2 rounded-full border-[1.5px] border-ink bg-surface" />
              {at === i + 1 && (
                <motion.span
                  key={`cap-${at}`}
                  className="absolute h-2.5 w-[18px] rounded-full border-[1.5px] border-ink bg-accent"
                  initial={still || i === 0 ? false : { opacity: 0, x: -8, scaleX: 0.6 }}
                  animate={{ opacity: 1, x: 0, scaleX: 1 }}
                  transition={{ type: "spring", stiffness: 520, damping: 34 }}
                />
              )}
            </span>
            <span className={cn("whitespace-nowrap transition-colors duration-300", active ? "text-ink" : "text-ink-soft")}>
              <span className="md:hidden">{s.short}</span>
              <span className="hidden md:inline">{s.long}</span>
            </span>
            {i < STOPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mx-2 h-px w-3 transition-colors duration-300 md:w-5 min-[75rem]:mx-1.5 min-[75rem]:w-4",
                  at > i + 1 ? "bg-ink" : "bg-line-strong",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
