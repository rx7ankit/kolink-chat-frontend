"use client";

import { useMemo } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";

import { GlyphShape, type Handler } from "@/components/transit/glyph";
import { TransitLine } from "@/components/transit/line";
import { cn } from "@/lib/cn";
import type { PlatformId } from "@/lib/platforms";
import { useLook, useMotionPrefs } from "@/lib/studio/store";
import { buildLut, link, pointAt, polyline, type Lut, type Pt, type Route } from "@/lib/transit/geometry";

import type { Track } from "./data";

/*
 * Railway points: one incoming DM line meets a switch; the blade sends it to the
 * agent track (in scope → reply) or the attention track (→ needs attention → team).
 * Drawn in a 340×192 box; labels are 11.5 units so they render ≥11px at the
 * smallest widths it is shown (a 343px phone column, 340px on short desktops).
 */
const W = 340;
const H = 192;
const E: Pt = { x: 14, y: 96 };
const S: Pt = { x: 80, y: 96 };
const UP_END: Pt = { x: 324, y: 48 };
const DN_END: Pt = { x: 324, y: 144 };
const TRIGGERS = ["Knowledge missing", "Asked for a person", "2 misses"];

const concat = (a: Route, b: Route): Route => ({ segs: [...a.segs, ...b.segs], d: `${a.d}${b.d}` });

/** First LUT sample at or beyond x (the tracks run left to right). */
function atX(lut: Lut, x: number): Pt {
  for (let i = 0; i < lut.xs.length; i++) if (lut.xs[i] >= x) return { x: lut.xs[i], y: lut.ys[i] };
  const n = lut.xs.length - 1;
  return { x: lut.xs[n], y: lut.ys[n] };
}

export function usePointsGeometry() {
  const { lines } = useLook();
  return useMemo(() => {
    const entry = polyline([E, S]);
    const up = link(S, UP_END, lines, { r: 12, bend: 0, sag: 0.06 });
    const dn = link(S, DN_END, lines, { r: 12, bend: 0, sag: 0.06 });
    const upLut = buildLut(up, 120);
    const dnLut = buildLut(dn, 120);
    const fullUp = buildLut(concat(entry, up), 140);
    const fullDn = buildLut(concat(entry, dn), 140);
    // Blade angle: the heading just past the switch on each track.
    const upAngle = pointAt(upLut, 0.04).angle;
    const dnAngle = pointAt(dnLut, 0.04).angle;
    return {
      entry,
      up,
      dn,
      fullUp,
      fullDn,
      upAngle,
      dnAngle,
      inScope: atX(upLut, 192),
      attention: atX(dnLut, 236),
    };
  }, [lines]);
}

export type PointsGeometry = ReturnType<typeof usePointsGeometry>;

function Label({
  x,
  y,
  children,
  anchor = "middle",
  strong = false,
}: {
  x: number;
  y: number;
  children: string;
  anchor?: "start" | "middle" | "end";
  strong?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      className="mono"
      fontSize={11.5}
      fill={strong ? "var(--k-ink)" : "var(--k-ink-soft)"}
      style={{ letterSpacing: "0.06em", transition: "fill 0.3s" }}
    >
      {children.toUpperCase()}
    </text>
  );
}

/**
 * `track` null shows both routes at rest (static layouts). `progress` moves the
 * packet glyph along the active route; omit it to leave the packet parked.
 * When the packet is an automation (Menu mode, no AI) the upper track becomes the
 * automation line, so the legend never shows a diamond arriving at the agent.
 */
export function PointsDiagram({
  track,
  packet = "agent",
  platform,
  trigger,
  progress,
  className,
}: {
  track: Track | null;
  packet?: Handler;
  /** The DM's channel: the incoming line takes its Studio line color. */
  platform?: PlatformId;
  /** Which hand-off trigger to emphasise. */
  trigger?: string;
  progress?: MotionValue<number>;
  className?: string;
}) {
  const g = usePointsGeometry();
  const { still } = useMotionPrefs();
  const lut = track === "attention" ? g.fullDn : g.fullUp;
  const angle = track === "attention" ? g.dnAngle : g.upAngle;
  const upOn = track !== "attention";
  const dnOn = track !== "reply";
  const menu = packet === "automation";
  const upColor = menu ? "var(--k-pop3-deep)" : "var(--k-pop2-deep)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("block h-auto w-full overflow-visible", className)} aria-hidden>
      {/* Incoming line */}
      <TransitLine d={g.entry.d} platform={platform} width={4} />
      {/* Reply track: the agent's (or, in Menu mode, the automation's) */}
      <motion.g initial={false} animate={{ opacity: upOn ? 1 : 0.22 }} transition={{ duration: still ? 0.15 : 0.3 }}>
        <TransitLine d={g.up.d} color={upColor} width={4} />
        <circle cx={g.inScope.x} cy={g.inScope.y} r={4} fill="var(--k-surface)" stroke={upColor} strokeWidth={2} />
        <g transform={`translate(${UP_END.x} ${UP_END.y})`}>
          <GlyphShape handler={menu ? "automation" : "agent"} size={15} />
        </g>
      </motion.g>
      {/* Attention track */}
      <motion.g initial={false} animate={{ opacity: dnOn ? 1 : 0.22 }} transition={{ duration: still ? 0.15 : 0.3 }}>
        <TransitLine d={g.dn.d} color="var(--k-pop1-deep)" width={4} />
        <g transform={`translate(${g.attention.x} ${g.attention.y})`}>
          <GlyphShape handler="attention" size={15} />
        </g>
        <g transform={`translate(${DN_END.x} ${DN_END.y})`}>
          <GlyphShape handler="team" size={14} />
        </g>
        {/* Bracket gathering the three hand-off triggers onto the track */}
        <path
          d={`M128 101 V138`}
          stroke="var(--k-line-strong)"
          strokeWidth={1}
          strokeDasharray="2 3"
          fill="none"
        />
      </motion.g>

      {/* Labels */}
      <Label x={E.x} y={E.y - 16} anchor="start">
        DM in
      </Label>
      <Label x={g.inScope.x} y={g.inScope.y - 14} strong={track === "reply"}>
        {menu ? "Keyword match" : "In scope"}
      </Label>
      <Label x={UP_END.x + 8} y={UP_END.y - 16} anchor="end" strong={track === "reply"}>
        Reply
      </Label>
      {TRIGGERS.map((t, i) => (
        <Label key={t} x={134} y={106 + i * 14} anchor="start" strong={track === "attention" && (!trigger || trigger === t)}>
          {t}
        </Label>
      ))}
      <Label x={g.attention.x} y={DN_END.y + 25} strong={track === "attention"}>
        Needs attention
      </Label>
      {/* Above its stop, mirroring Reply, so "Needs attention" and "Team" never read as one label. */}
      <Label x={DN_END.x + 8} y={DN_END.y - 16} anchor="end" strong={track === "attention"}>
        Team
      </Label>

      {/* Switch blade + pivot */}
      <motion.line
        x1={S.x}
        y1={S.y}
        x2={S.x + 24}
        y2={S.y}
        stroke="var(--k-ink)"
        strokeWidth={5}
        strokeLinecap="round"
        initial={false}
        animate={{ rotate: track === null ? g.upAngle : angle }}
        transition={still ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 28 }}
        style={{ originX: `${S.x}px`, originY: `${S.y}px`, transformBox: "view-box" }}
      />
      <circle cx={S.x} cy={S.y} r={5.5} fill="var(--k-surface)" stroke="var(--k-ink)" strokeWidth={2} />
      <circle cx={E.x} cy={E.y} r={6} fill="var(--k-surface)" stroke="var(--k-ink)" strokeWidth={1.5} />

      {/* Packet */}
      {progress && track && <Packet lut={lut} progress={progress} handler={packet} />}
    </svg>
  );
}

function Packet({ lut, progress, handler }: { lut: Lut; progress: MotionValue<number>; handler: Handler }) {
  const x = useTransform(progress, (v) => pointAt(lut, v).x);
  const y = useTransform(progress, (v) => pointAt(lut, v).y);
  const opacity = useTransform(progress, [0, 0.04, 0.96, 1], [0, 1, 1, 0]);
  return (
    <motion.g style={{ x, y, opacity }}>
      <GlyphShape handler={handler} size={13} />
    </motion.g>
  );
}
