"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";

import { logoPaths } from "@/components/brand/logo";
import { ease } from "@/components/motion/reveal";
import { lineColor, TransitLine } from "@/components/transit/line";
import { lineOrder } from "@/lib/capabilities";
import { platformById, type PlatformId } from "@/lib/platforms";
import { useLook, useMotionPrefs } from "@/lib/studio/store";
import { link, type LineStyle } from "@/lib/transit/geometry";

type Track = {
  id: PlatformId;
  num: string;
  d: string;
  label: { x: number; y: number };
  stop: { x: number; y: number };
};

type Geo = {
  w: number;
  h: number;
  lw: number;
  stopLen: number;
  labels: "names" | "none";
  tracks: Track[];
  roundel: { cx: number; cy: number; r: number };
};

/**
 * Stage geometry in CSS px. Eight tracks enter at the viewport's left edge spread
 * like a stave, converge into a tight bundle and end at buffer stops in front of the
 * koLink roundel, which sits on the container's right edge. Every route goes through
 * the shared `link()` builder, so the footer follows the Studio line style.
 */
function buildTerminus(w: number, style: LineStyle): Geo {
  const small = w < 640;
  const pad = w >= 768 ? 32 : 16;
  const cw = Math.min(w, 1320);
  const left = (w - cw) / 2 + pad;
  const right = (w + cw) / 2 - pad;

  const spread = small ? 14 : 24;
  const bundle = small ? 7 : 11;
  const r = small ? 26 : 44;
  const lw = small ? 2.5 : 4;
  const top = small ? 22 : 40;
  const h = top * 2 + spread * 7;
  const cy = h / 2;
  const cx = right - r;
  const xEnd = cx - r - (small ? 12 : 22);
  const xc = xEnd - (small ? 40 : 128);
  const corner = small ? 8 : 14;
  const step = small ? 6 : 10;

  const tracks = lineOrder.map((id, i): Track => {
    const o = i - 3.5;
    const a = { x: -lw * 3, y: cy + o * spread };
    const end = { x: xEnd, y: cy + o * bundle };
    const adx = end.x - a.x;
    const ady = Math.abs(end.y - a.y);
    let d: string;
    if (style === "octilinear") {
      // Diagonals all finish at xc, so the bundle closes like a funnel with parallel 45° legs.
      d = link(a, end, "octilinear", { bend: Math.max(0, xc - ady - a.x) / Math.max(1, adx - ady), r: corner }).d;
    } else if (style === "orthogonal") {
      // Inner tracks step first so the vertical jogs nest instead of crossing.
      const xs = xc - step * (3.5 - Math.abs(o));
      d = link(a, end, "orthogonal", { bend: (xs - a.x) / adx, r: corner }).d;
    } else {
      const mid = { x: xc, y: end.y };
      d = `${link(a, mid, "cord", { sag: 0.018 + 0.005 * i }).d}L${end.x} ${end.y}`;
    }
    return {
      id,
      num: String(i + 1).padStart(2, "0"),
      d,
      label: { x: left, y: a.y - (small ? 5 : 9) },
      stop: end,
    };
  });

  return {
    w,
    h,
    lw,
    // Butt-capped bars with a visible gap, so each line reads as its own buffer stop.
    stopLen: bundle - (small ? 2 : 3),
    labels: w >= 768 ? "names" : "none",
    tracks,
    roundel: { cx, cy, r },
  };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** One track: scrubbed draw, its label and its buffer stop. */
function TerminusTrack({ track, i, drive, geo }: { track: Track; i: number; drive: MotionValue<number>; geo: Geo }) {
  const progress = useTransform(drive, (p) => clamp01((p - i * 0.055) / 0.5));
  const stopOpacity = useTransform(progress, [0.9, 1], [0, 1]);
  // Hidden until it starts drawing, so a zero-length round-capped dash never leaves a dot.
  const lineOpacity = useTransform(progress, (p): number => (p > 0.002 ? 1 : 0));
  const labelOpacity = useTransform(progress, [0, 0.15], [0, 1]);
  const half = geo.stopLen / 2;
  const name = platformById[track.id].name;

  return (
    <g>
      <TransitLine d={track.d} platform={track.id} width={geo.lw} progress={progress} opacity={lineOpacity} />
      <motion.g style={{ opacity: stopOpacity }}>
        <path
          d={`M${track.stop.x + 1} ${track.stop.y - half}V${track.stop.y + half}`}
          stroke={lineColor(track.id)}
          strokeWidth={geo.lw}
        />
      </motion.g>
      {geo.labels === "names" && (
        <motion.text
          x={track.label.x}
          y={track.label.y}
          className="mono"
          fontSize={11}
          letterSpacing="0.08em"
          fill="var(--k-ink-soft)"
          style={{ opacity: labelOpacity }}
        >
          {track.num} {name.toUpperCase()}
        </motion.text>
      )}
    </g>
  );
}

/** One of the eight ring arcs (one per line, in line order), drawn after the lines arrive. */
function RingArc({ j, cx, cy, r, width, drive, id }: { j: number; cx: number; cy: number; r: number; width: number; drive: MotionValue<number>; id: PlatformId }) {
  const gap = 7;
  const a0 = ((-90 + j * 45 + gap / 2) * Math.PI) / 180;
  const a1 = ((-90 + (j + 1) * 45 - gap / 2) * Math.PI) / 180;
  const p0 = { x: cx + r * Math.cos(a0), y: cy + r * Math.sin(a0) };
  const p1 = { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) };
  const f = (n: number) => Math.round(n * 100) / 100;
  const pathLength = useTransform(drive, (p) => clamp01((p - 0.55 - j * 0.035) / 0.12));
  const opacity = useTransform(pathLength, (v): number => (v > 0.002 ? 1 : 0));
  return (
    <motion.path
      d={`M${f(p0.x)} ${f(p0.y)}A${r} ${r} 0 0 1 ${f(p1.x)} ${f(p1.y)}`}
      fill="none"
      stroke={lineColor(id)}
      strokeWidth={width}
      strokeLinecap="round"
      style={{ pathLength, opacity }}
    />
  );
}

/** The final station: the koLink mark inside a segmented ring, its two strokes redrawing once. */
function TerminusRoundel({ geo, drive }: { geo: Geo; drive: MotionValue<number> }) {
  const { cx, cy, r } = geo.roundel;
  const { still, pace } = useMotionPrefs();
  const ref = useRef<SVGGElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const markW = r * 1.08;
  const k = markW / 681;
  const markH = 550 * k;
  const ringW = geo.lw;
  const play = inView || still;

  return (
    <g ref={ref}>
      <circle cx={cx} cy={cy} r={r - ringW / 2} fill="var(--k-surface)" />
      {lineOrder.map((id, j) => (
        <RingArc key={id} j={j} cx={cx} cy={cy} r={r} width={ringW} drive={drive} id={id} />
      ))}
      <g transform={`translate(${cx - markW / 2} ${cy - markH / 2}) scale(${k})`}>
        {logoPaths.map((d, i) => (
          <motion.path
            key={d.slice(0, 12)}
            d={d}
            stroke="var(--k-ink)"
            strokeWidth={1.5 / k}
            strokeLinejoin="round"
            fill="var(--k-ink)"
            // Same initial as the server HTML; when still the end state lands at 0ms on mount.
            initial={{ pathLength: 0, fillOpacity: 0 }}
            animate={play ? { pathLength: 1, fillOpacity: 1 } : undefined}
            transition={
              still
                ? { duration: 0 }
                : {
                    pathLength: { duration: 0.6 * pace, delay: 0.15 * i * pace, ease: ease.inOut },
                    fillOpacity: { duration: 0.35 * pace, delay: (0.6 + 0.15 * i) * pace, ease: ease.out },
                  }
            }
          />
        ))}
      </g>
      {/* On phones the label is wider than the 52px roundel, so it ends flush with the gutter instead of centring past it. */}
      <text
        x={geo.w < 640 ? cx + r : cx}
        y={cy - r - (geo.w < 640 ? 10 : 16)}
        textAnchor={geo.w < 640 ? "end" : "middle"}
        className="mono"
        fontSize={11}
        letterSpacing="0.12em"
        fill="var(--k-ink-soft)"
      >
        TERMINUS
      </text>
    </g>
  );
}

/** The footer's track stage: full-bleed SVG, measured once per resize, lines scrubbed by scroll. */
export function Terminus({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1440);
  const look = useLook();
  const { still } = useMotionPrefs();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setW(Math.max(320, Math.round(el.getBoundingClientRect().width)));
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => buildTerminus(w, look.lines), [w, look.lines]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.95", "end 0.8"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const drive = useMotionValue(0);
  useMotionValueEvent(smooth, "change", (v) => {
    if (!still) drive.set(v);
  });
  useEffect(() => {
    drive.set(still ? 1 : smooth.get());
  }, [still, drive, smooth]);

  return (
    <div ref={ref} className={className} style={{ height: geo.h }} aria-hidden>
      <svg width="100%" height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} className="block overflow-visible" preserveAspectRatio="xMidYMid meet">
        {geo.tracks.map((t, i) => (
          <TerminusTrack key={t.id} track={t} i={i} drive={drive} geo={geo} />
        ))}
        <TerminusRoundel geo={geo} drive={drive} />
      </svg>
    </div>
  );
}
