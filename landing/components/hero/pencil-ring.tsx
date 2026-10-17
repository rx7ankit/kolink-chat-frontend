"use client";

import { motion } from "motion/react";

import { mulberry32 } from "@/lib/hero/seed";

/** A seeded, jittered 1.1-turn hand-drawn loop (64 points) in a 100×100 box, stretched to its row. */
function ringPath(seed: number) {
  const rnd = mulberry32(seed * 7919 + 17);
  const n = 64;
  const start = -0.6 + rnd() * 0.4;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const t = start + (i / n) * Math.PI * 2 * 1.1;
    const wob = 1 + (rnd() - 0.5) * 0.05;
    const drift = 1 + (i / n) * 0.035;
    const x = 50 + Math.cos(t) * 51 * wob * drift;
    const y = 50 + Math.sin(t) * 56 * wob * drift;
    d += `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

/**
 * "Needs attention": a pencil loop in --pop1-deep (≥3:1 on paper) drawn around the row.
 * Mount it inside <AnimatePresence> so it fades out when the team marks the thread done.
 */
export function PencilRing({ seed, still }: { seed: number; still: boolean }) {
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -top-0.5 -left-1 h-[calc(100%+4px)] w-[calc(100%+8px)] overflow-visible"
      exit={{ opacity: 0, transition: { duration: still ? 0.15 : 0.26 } }}
    >
      <motion.path
        d={ringPath(seed)}
        fill="none"
        stroke="var(--k-pop1-deep)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={still ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
      />
    </motion.svg>
  );
}
