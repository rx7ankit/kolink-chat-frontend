"use client";

import { useEffect, useMemo } from "react";
import { animate, motion, useMotionValue, useScroll, useTransform } from "motion/react";

import { GlyphShape } from "@/components/transit/glyph";
import { useMotionPrefs } from "@/lib/studio/store";
import { buildLut, link, pointAt, travelMs, type LineStyle, type Lut, type Pt, type Route } from "@/lib/transit/geometry";

export type TravelSpec = {
  id: number;
  card: number;
  /** Start (just right of the answer bubble), in the grid's coordinates. */
  from: Pt;
  /** The library slot's centre when the travel was measured, in the grid's coordinates. */
  to: Pt;
  style: LineStyle;
  /**
   * How far the slot has moved down the grid at a given window.scrollY. The library
   * is sticky, so it slides against the chat while the page scrolls; this is pure
   * arithmetic on rects measured once, so the hot path never reads layout.
   */
  slotDy: (scrollY: number) => number;
};

type Leg = { y: number; route: Route; lut: Lut };

/** Route to the slot's live position for a scrollY; rebuilt only when the slot has actually moved. */
function legsFor(spec: TravelSpec): (scrollY: number) => Leg {
  let last: Leg | null = null;
  return (sy) => {
    const y = spec.to.y + spec.slotDy(sy);
    if (!last || Math.abs(last.y - y) > 0.5) {
      const route = link(spec.from, { x: spec.to.x, y }, spec.style, { r: 12, bend: 0.3, sag: 0.12 });
      last = { y, route, lut: buildLut(route) };
    }
    return last;
  };
}

/**
 * An answer's knowledge card leaving the chat: an accent capsule rides a short
 * connector (drawn in the Studio line style) to its library berth, using the
 * shared lookup-table engine. If the page scrolls mid-flight the connector is
 * re-routed to where the sticky slot now is, so the capsule always lands on it.
 */
function Travel({
  spec,
  onArrive,
  onDone,
}: {
  spec: TravelSpec;
  onArrive: (card: number) => void;
  onDone: (id: number) => void;
}) {
  const { pace } = useMotionPrefs();
  const { scrollY } = useScroll();
  const t = useMotionValue(0);
  const fade = useMotionValue(1);

  const legAt = useMemo(() => legsFor(spec), [spec]);

  const d = useTransform(scrollY, (sy) => legAt(sy).route.d);
  const x = useTransform([t, scrollY], ([v, sy]: number[]) => pointAt(legAt(sy).lut, v).x);
  const y = useTransform([t, scrollY], ([v, sy]: number[]) => pointAt(legAt(sy).lut, v).y);

  useEffect(() => {
    let cancelled = false;
    const length = legAt(scrollY.get()).lut.length;
    const run = async () => {
      await animate(t, 1, { duration: (travelMs(length) / 1000) * pace, ease: [0.65, 0, 0.35, 1] });
      if (cancelled) return;
      onArrive(spec.card);
      await animate(fade, 0, { duration: 0.35 * pace, delay: 0.1 * pace });
      if (!cancelled) onDone(spec.id);
    };
    void run();
    return () => {
      cancelled = true;
      t.stop();
      fade.stop();
    };
  }, [spec, pace, t, fade, legAt, scrollY, onArrive, onDone]);

  return (
    <motion.g style={{ opacity: fade }}>
      <motion.path
        d={d}
        fill="none"
        stroke="var(--k-accent-text)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pathLength: t }}
      />
      <motion.g style={{ x, y }}>
        <GlyphShape handler="post" size={11} />
      </motion.g>
    </motion.g>
  );
}

export function TravelLayer({
  travels,
  onArrive,
  onDone,
}: {
  travels: TravelSpec[];
  onArrive: (card: number) => void;
  onDone: (id: number) => void;
}) {
  if (!travels.length) return null;
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible">
      {travels.map((spec) => (
        <Travel key={spec.id} spec={spec} onArrive={onArrive} onDone={onDone} />
      ))}
    </svg>
  );
}
