"use client";

import { motion } from "motion/react";

import { LogoMark, logoPaths } from "@/components/brand/logo";
import { FlapText } from "@/components/ui/flap-text";

/** Eight ring segments, one per line. */
const ARCS = Array.from({ length: 8 }, (_, i) => {
  const r = 35;
  const a0 = ((i * 45 + 5) * Math.PI) / 180;
  const a1 = (((i + 1) * 45 - 5) * Math.PI) / 180;
  const p = (a: number) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  return `M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}`;
});

/**
 * The koLink hub: the real mark in ink, a segmented ring that clicks a quarter-turn per
 * departure, a points switch that flips per sorting decision, and a split-flap state label.
 */
export function Hub({
  label,
  turn,
  switchTurn,
  still,
  pace,
  drawMark,
}: {
  label: string;
  turn: number;
  switchTurn: number;
  still: boolean;
  pace: number;
  /** Client-only, after hydration and when motion is allowed: trace the mark once. */
  drawMark: boolean;
}) {
  const spring = still ? { duration: 0 } : { type: "spring" as const, stiffness: 300, damping: 22 };
  return (
    <div className="flex flex-col items-center">
      <p className="mono flex h-5 items-center text-[11px] tracking-[0.08em] text-ink">
        <span aria-hidden>
          <FlapText text={label} />
        </span>
        <span className="sr-only">Hub: {label}</span>
      </p>
      <div
        data-hx="hub"
        className="relative mt-2 grid size-20 place-items-center rounded-full bg-surface"
        style={{ boxShadow: "inset 0 0 0 2px var(--k-ink), 0 0 0 4px var(--k-bg)" }}
      >
        <motion.svg
          aria-hidden
          viewBox="-40 -40 80 80"
          className="absolute inset-0 size-full"
          initial={false}
          animate={{ rotate: turn * 90 }}
          transition={spring}
        >
          {ARCS.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="var(--k-ink)" strokeWidth={2.5} strokeLinecap="round" opacity={i % 2 ? 0.35 : 0.8} />
          ))}
        </motion.svg>
        <span className="relative">
          <LogoMark className="h-[22px] w-auto text-ink" />
          {drawMark && (
            <svg aria-hidden viewBox="0 0 681 550" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              {logoPaths.map((d, i) => (
                <motion.path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="var(--k-accent)"
                  strokeWidth={22}
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 1 }}
                  animate={{ pathLength: 1, opacity: 0 }}
                  transition={{
                    pathLength: { duration: 0.5 * pace, delay: (0.15 + i * 0.1) * pace, ease: [0.65, 0, 0.35, 1] },
                    opacity: { duration: 0.3, delay: (0.8 + i * 0.1) * pace },
                  }}
                />
              ))}
            </svg>
          )}
        </span>
        {/* Points switch on the departure side. */}
        <svg aria-hidden viewBox="-8 -8 16 16" className="absolute top-1/2 -right-[7px] size-4 -translate-y-1/2 overflow-visible">
          <circle r={6.5} fill="var(--k-surface)" stroke="var(--k-ink)" strokeWidth={1.5} />
          <motion.line
            x1={0}
            y1={0}
            x2={5}
            y2={0}
            stroke="var(--k-ink)"
            strokeWidth={2}
            strokeLinecap="round"
            initial={false}
            animate={{ rotate: switchTurn === 0 ? 0 : switchTurn % 2 ? -30 : 30 }}
            transition={still ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 28 }}
            style={{ originX: "0px", originY: "0px" }}
          />
        </svg>
      </div>
    </div>
  );
}

/** The 28px hub roundel in the mobile galley header. */
export function MiniHub() {
  return (
    <span
      className="grid size-7 place-items-center rounded-full bg-surface"
      style={{ boxShadow: "inset 0 0 0 2px var(--k-ink)" }}
      aria-hidden
    >
      <LogoMark className="h-2.5 w-auto text-ink" />
    </span>
  );
}
