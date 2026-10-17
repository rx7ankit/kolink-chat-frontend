"use client";

import { useId } from "react";
import { motion, type MotionValue } from "motion/react";

import type { PlatformId } from "@/lib/platforms";
import { useMotionPrefs } from "@/lib/studio/store";

type Props = {
  d: string;
  /** Platform whose Studio line color to use; omit for ink. */
  platform?: PlatformId;
  /** Explicit stroke color (overrides platform). */
  color?: string;
  width?: number;
  /** A casing under the line, like a real metro map, so lines stay crisp where they cross. */
  casing?: boolean;
  /** Casing color; defaults to var(--line-casing) set by the section, else the page background. */
  casingColor?: string;
  dashed?: boolean;
  /** Resting opacity of the line stroke. */
  opacity?: number | MotionValue<number>;
  /** Scrubbed draw progress (0–1). When omitted and `drawOnView` is set, the line draws once in view. */
  progress?: MotionValue<number>;
  drawOnView?: boolean;
  delay?: number;
  className?: string;
};

export function lineColor(platform?: PlatformId) {
  return platform ? `var(--line-${platform})` : "var(--k-ink)";
}

/**
 * A transit line: optional casing + stroke, drawn by pathLength.
 * Dashed lines are revealed through a mask (pathLength would overwrite the dash pattern).
 */
export function TransitLine({
  d,
  platform,
  color,
  width = 4,
  casing = true,
  casingColor = "var(--line-casing, var(--k-bg))",
  dashed = false,
  opacity = 1,
  progress,
  drawOnView = false,
  delay = 0,
  className,
}: Props) {
  const { still, pace } = useMotionPrefs();
  const maskId = useId();
  const stroke = color ?? lineColor(platform);
  const animated = Boolean(progress) || (drawOnView && !still);
  const draw = progress
    ? { style: { pathLength: progress } }
    : drawOnView && !still
      ? {
          initial: { pathLength: 0 },
          whileInView: { pathLength: 1 },
          viewport: { once: true, margin: "0px 0px -15% 0px" },
          transition: { duration: 1.1 * pace, delay: delay * pace, ease: [0.65, 0, 0.35, 1] as const },
        }
      : {};
  const common = { d, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (dashed && animated) {
    return (
      <g className={className}>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-10000" y="-10000" width="20000" height="20000">
          <motion.path {...common} stroke="#fff" strokeWidth={width + 8} {...draw} />
        </mask>
        <g mask={`url(#${maskId})`}>
          {casing && <path {...common} stroke={casingColor} strokeWidth={width + 6} />}
          <motion.path
            {...common}
            stroke={stroke}
            strokeWidth={width}
            strokeDasharray={`${width * 1.5} ${width * 2}`}
            style={{ opacity }}
          />
        </g>
      </g>
    );
  }

  return (
    <g className={className}>
      {casing && <motion.path {...common} stroke={casingColor} strokeWidth={width + 6} {...draw} />}
      <motion.path
        {...common}
        stroke={stroke}
        strokeWidth={width}
        strokeDasharray={dashed ? `${width * 1.5} ${width * 2}` : undefined}
        style={{ opacity, ...(progress ? { pathLength: progress } : {}) }}
        {...(progress ? {} : draw)}
      />
    </g>
  );
}
