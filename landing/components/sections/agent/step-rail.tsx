"use client";

import { motion, type MotionValue } from "motion/react";

import { cn } from "@/lib/cn";

import type { AgentStep } from "./data";

/**
 * A six-stop mini line that narrates the pinned scene. The rule fills with
 * scroll; each stop is a real button that scrolls to its step.
 */
export function StepRail({
  steps,
  current,
  progress,
  onJump,
  className,
}: {
  steps: AgentStep[];
  current: number;
  progress: MotionValue<number>;
  onJump: (n: number) => void;
  className?: string;
}) {
  const last = steps.length - 1;
  return (
    <nav aria-label="Agent demo steps" className={cn("relative", className)}>
      <div aria-hidden className="absolute top-[21px] right-[calc(100%/12)] left-[calc(100%/12)] h-[2px] bg-line">
        <motion.div className="h-full origin-left bg-ink" style={{ scaleX: progress }} />
      </div>
      <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s) => {
          const active = s.n === current;
          const passed = s.n < current;
          return (
            <li key={s.n} className="min-w-0">
              <button
                type="button"
                onClick={() => onJump(s.n)}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${s.n} of ${last + 1}: ${s.label}`}
                className="group flex h-14 w-full flex-col items-center justify-start gap-1.5 rounded-md pt-[15px]"
              >
                <span
                  aria-hidden
                  className={cn(
                    "block size-3.5 rounded-full border-2 transition-[background-color,border-color,transform] duration-300",
                    active
                      ? "scale-125 border-ink bg-ink"
                      : passed
                        ? "border-ink bg-surface"
                        : "border-line-strong bg-surface group-hover:border-ink",
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    "mono max-w-full truncate text-[11px] tracking-[0.02em] uppercase transition-colors",
                    active ? "text-ink" : "text-ink-soft",
                  )}
                >
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
