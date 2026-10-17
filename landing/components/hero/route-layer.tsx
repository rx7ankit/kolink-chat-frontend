"use client";

import { memo } from "react";
import { motion } from "motion/react";

import { lineColor } from "@/components/transit/line";
import { lineOrder } from "@/lib/capabilities";
import type { DrawnLine, Geometry } from "@/lib/hero/layout";

const TRAVEL = [0.65, 0, 0.35, 1] as const;

/**
 * The memoized route layer: bg-coloured casings under every line (like a printed metro map),
 * then the lines. Branches sit at .3 and brighten while their line carries traffic; conversation
 * lines stay dashed until someone writes in. Draws itself in once per mount (beat 00).
 */
export const RouteLayer = memo(function RouteLayer({
  geo,
  active,
  carried,
  siding,
  still,
  pace,
  casing,
}: {
  geo: Geometry;
  /** Bitmask over lineOrder: line carries traffic. */
  active: number;
  /** Bitmask over lineOrder: conversation line has carried an inbound message. */
  carried: number;
  siding: boolean;
  still: boolean;
  pace: number;
  /** Casing colour: the surface the lines sit on. */
  casing: string;
}) {
  const sw = geo.stroke;
  const spine = geo.layout === "spine";
  const bit = (l: DrawnLine) => (l.platform ? 1 << lineOrder.indexOf(l.platform) : 0);
  const draw = (l: DrawnLine, dashed: boolean) =>
    still
      ? {}
      : dashed
        ? {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.3, delay: (0.1 + l.order * 0.04) * pace },
          }
        : {
            initial: { pathLength: 0 },
            animate: { pathLength: 1 },
            transition: { duration: 0.6 * pace, delay: l.order * 0.04 * pace, ease: TRAVEL },
          };

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 overflow-visible"
      width={geo.w}
      height={geo.h}
      viewBox={`0 0 ${geo.w} ${geo.h}`}
    >
      <g>
        {/* On the galley the siding runs along the header's bottom rule: no casing there (it would
            erase the rule), and its dashes only show while a hand-off is travelling. */}
        {geo.lines
          .filter((l) => !(spine && l.kind === "siding"))
          .map((l) => (
            <motion.path
              key={`c-${l.id}`}
              d={l.d}
              fill="none"
              stroke={casing}
              strokeWidth={sw + 6}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...draw(l, false)}
            />
          ))}
      </g>
      <g>
        {geo.lines.map((l) => {
          if (l.kind === "siding") {
            return (
              <motion.path
                key={l.id}
                d={l.d}
                fill="none"
                stroke="var(--k-ink)"
                strokeOpacity={siding ? 0.9 : spine ? 0 : 0.45}
                strokeWidth={Math.max(2, sw - 1)}
                strokeLinecap="round"
                strokeDasharray="4 6"
                className={siding ? "kh-march kh-loop" : undefined}
                style={{ transition: "stroke-opacity .3s" }}
                {...draw(l, true)}
              />
            );
          }
          if (l.kind !== "branch") {
            return (
              <motion.path
                key={l.id}
                d={l.d}
                fill="none"
                stroke="var(--k-ink)"
                strokeOpacity={l.kind === "rail" ? 0.4 : 0.6}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
                {...draw(l, false)}
              />
            );
          }
          const on = (active & bit(l)) !== 0;
          const dashed = !!l.conv && (carried & bit(l)) === 0;
          if (l.conv) {
            return (
              <motion.path
                key={l.id}
                d={l.d}
                fill="none"
                stroke={lineColor(l.platform)}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={dashed ? `${sw * 1.5} ${sw * 2.2}` : `${sw * 3.7} 0`}
                strokeOpacity={on ? 1 : dashed ? 0.4 : 0.3}
                style={{ transition: "stroke-opacity .4s, stroke-dasharray .2s" }}
                {...draw(l, true)}
              />
            );
          }
          return (
            <motion.path
              key={l.id}
              d={l.d}
              fill="none"
              stroke={lineColor(l.platform)}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={on ? 1 : 0.3}
              style={{ transition: "stroke-opacity .4s" }}
              {...draw(l, false)}
            />
          );
        })}
      </g>
    </svg>
  );
});
