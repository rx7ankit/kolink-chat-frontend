"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";

import { useMotionScale } from "@/lib/studio/store";

/**
 * Maps an element's trip through the viewport to a vertical offset.
 * `distance` is the total travel in px at "lively"; positive moves against scroll (slower layer).
 */
export function useParallax(ref: RefObject<HTMLElement | null>, distance = 80): MotionValue<number> {
  const scale = useMotionScale();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const raw = useTransform(scrollYProgress, [0, 1], [distance * scale * 0.5, -distance * scale * 0.5]);
  return useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 });
}

export function Parallax({
  children,
  distance = 80,
  className,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const y = useParallax(ref, distance);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
