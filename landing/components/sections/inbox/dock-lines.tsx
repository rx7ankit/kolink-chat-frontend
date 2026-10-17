"use client";

import { AnimatePresence, motion, useTransform, type MotionValue } from "motion/react";

import type { PlatformId } from "@/lib/platforms";
import { useLook } from "@/lib/studio/store";
import { buildLut, polyline, toPath, type LineStyle, type Pt, type Route } from "@/lib/transit/geometry";

import { FRAME } from "./data";
import { clamp01, useSafeMotionPrefs } from "./hooks";

const PITCH = 5;
const RIGHT_INSET = 14;
const JOG = 10;
/** The lowest lane of the incoming bundle runs this far above the inbox frame. */
const BAND_GAP = 40;
/** Lane 0 (the top of the bundle) in frame coordinates; the band is clear of the header copy above. */
export const BAND_TOP = -(BAND_GAP + (FRAME.maxRows - 1) * PITCH);
/** Centre of a row's 4px stub: gutter edge + card border + half the stub. */
export const STUB_X = FRAME.gutter + 1 + 2;

type Seg = Route["segs"][number];

/** A polyline whose corners each get their own radius (callers keep each leg long enough for both ends). */
function rounded(pts: Pt[], radii: number[]): Route {
  const toward = (from: Pt, to: Pt, len: number): Pt => {
    const d = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    const t = Math.min(1, len / d);
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  };
  const segs: Seg[] = [];
  let cursor = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const v = pts[i];
    const inPt = toward(v, pts[i - 1], radii[i - 1]);
    const outPt = toward(v, pts[i + 1], radii[i - 1]);
    segs.push({ k: "L", a: cursor, b: inPt });
    segs.push({ k: "Q", a: inPt, c: v, b: outPt });
    cursor = outPt;
  }
  segs.push({ k: "L", a: cursor, b: pts[pts.length - 1] });
  return { segs, d: toPath(segs) };
}

/**
 * Row i's line. The lines enter from the section's left edge as one bundle in the band between
 * the header and the frame (lane 0 on top), turn down into the gutter on concentric corners
 * (lane 0 outermost, nearest the list), and peel off into their rows in order, so no line
 * ever crosses another, the header or the rail.
 */
export function dockRoute(i: number, left: number, style: LineStyle): Route {
  const x = FRAME.gutter - RIGHT_INSET - i * PITCH;
  const by = BAND_TOP + i * PITCH;
  const y = FRAME.rowTop + i * FRAME.rowH + FRAME.rowH / 2;
  const outer = FRAME.maxRows - 1 - i;
  const start = { x: left, y: by };
  if (style === "octilinear") {
    // Parallel 45° chamfers stay one pitch apart when each lane's cut shrinks by (2 - √2)·pitch.
    const c = 12 + outer * PITCH * (2 - Math.SQRT2);
    return polyline(
      [start, { x: x - c, y: by }, { x, y: by + c }, { x, y: y - JOG }, { x: x + JOG, y }, { x: STUB_X, y }],
      4,
    );
  }
  const r1 = (style === "cord" ? 26 : 14) + outer * PITCH;
  const r2 = style === "cord" ? 22 : 8;
  return rounded([start, { x, y: by }, { x, y }, { x: STUB_X, y }], [r1, r2]);
}

export type Dock = { id: string; platform: PlatformId; d: string; len: number };

export function buildDocks(rows: { id: string; platform: PlatformId }[], left: number, style: LineStyle): Dock[] {
  return rows.slice(0, FRAME.maxRows).map((r, i) => {
    const route = dockRoute(i, left, style);
    return { id: r.id, platform: r.platform, d: route.d, len: buildLut(route, 8).length };
  });
}

function DockLine({ dock, tip, active, base }: { dock: Dock; tip: MotionValue<number>; active: boolean; base: number }) {
  const { still, pace } = useSafeMotionPrefs();
  const pathLength = useTransform(tip, (v) => clamp01(v / dock.len));
  return (
    <motion.path
      initial={false}
      animate={{ d: dock.d, opacity: active ? 1 : base }}
      transition={{ duration: still ? 0 : 0.45 * pace, ease: [0.65, 0, 0.35, 1] }}
      fill="none"
      stroke={`var(--line-${dock.platform})`}
      strokeWidth={2.5}
      strokeLinecap="butt"
      strokeLinejoin="round"
      style={{ pathLength }}
    />
  );
}

/**
 * The lines arrive from the section's left edge below the header, sweep into the gutter between
 * the rail and the list, and end in each row's stub. Drawn by scroll (pathLength), re-routed
 * with the list when it filters or re-sorts. Coordinates are the gutter column's.
 */
export function DockLines({
  docks,
  left,
  tip,
  activeIds,
}: {
  docks: Dock[];
  /** The section's left edge, in gutter coordinates (negative). */
  left: number;
  tip: MotionValue<number>;
  activeIds: (string | null)[];
}) {
  const look = useLook();
  const { still } = useSafeMotionPrefs();
  const base = look.lineColor === "ink" ? 0.28 : 0.7;
  const top = BAND_TOP - 4;
  const width = STUB_X + 4 - left;
  const height = FRAME.height - top;
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute z-10 overflow-visible"
      style={{ top, left, width, height }}
      width={width}
      height={height}
      viewBox={`${left} ${top} ${width} ${height}`}
    >
      <AnimatePresence initial={false}>
        {docks.map((dock) => (
          // Keyed by line style too: a style switch changes the path's command list, which can't
          // be morphed, so the old route fades out under the new one instead.
          <motion.g
            key={`${dock.id}-${look.lines}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: still ? 0.15 : 0.25 }}
          >
            <DockLine dock={dock} tip={tip} active={activeIds.includes(dock.id)} base={base} />
          </motion.g>
        ))}
      </AnimatePresence>
    </svg>
  );
}
