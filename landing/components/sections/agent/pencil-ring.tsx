"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/cn";
import { useMotionPrefs } from "@/lib/studio/store";

/** Small deterministic PRNG so every ring is hand-drawn but identical on server and client. */
export function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A jittered 1.1-turn loop around a 100×40 box, as a smooth cubic path. */
export function pencilPath(seed: number, turns = 1.1, samples = 30) {
  const rnd = mulberry32(seed);
  const start = -Math.PI * (0.58 + rnd() * 0.12);
  const steps = Math.round(samples * turns);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = start + t * turns * Math.PI * 2;
    const j = 1 + (rnd() - 0.5) * 0.07 + t * 0.07;
    pts.push({ x: 50 + Math.cos(a) * 50 * j, y: 20 + Math.sin(a) * 20 * j });
  }
  const f = (n: number) => n.toFixed(2);
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += `C${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

/**
 * The "needs attention" pencil ring: a seeded, hand-drawn loop in --pop1-deep
 * that draws itself around its children when `drawn` turns true.
 */
export function PencilRing({
  children,
  drawn,
  seed = 7,
  drawOnMount = false,
  delay = 0,
  className,
}: {
  children: ReactNode;
  drawn: boolean;
  seed?: number;
  /** Start undrawn and draw in right after mount (when `drawn` is already true). */
  drawOnMount?: boolean;
  /** Seconds before the stroke starts (at pace 1). */
  delay?: number;
  className?: string;
}) {
  const { still, pace } = useMotionPrefs();
  const fromZero = drawOnMount && !still;
  return (
    <span className={cn("relative inline-flex", className)}>
      {children}
      <svg
        aria-hidden
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="pointer-events-none absolute top-[-45%] left-[-14%] h-[190%] w-[128%] overflow-visible"
      >
        <motion.path
          d={pencilPath(seed)}
          fill="none"
          stroke="var(--k-pop1-deep)"
          strokeWidth={1.75}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={fromZero ? { pathLength: 0, opacity: 0 } : false}
          animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
          transition={
            still
              ? { duration: 0 }
              : {
                  pathLength: { duration: 0.6 * pace, delay: delay * pace, ease: [0.65, 0, 0.35, 1] },
                  opacity: { duration: 0.12, delay: delay * pace },
                }
          }
        />
      </svg>
    </span>
  );
}
