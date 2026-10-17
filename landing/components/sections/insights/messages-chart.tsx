"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";

import { useLook, useMotionPrefs } from "@/lib/studio/store";
import { polyline, type LineStyle, type Pt } from "@/lib/transit/geometry";

import { dayName, days, fmt, messagesByDay, signed } from "./data";
import { useHydrated, useSize } from "./hooks";
import { DataTable, Panel } from "./panel";

const Y_MAX = 1500;
const TICKS = [
  { v: 0, label: "0" },
  { v: 500, label: "500" },
  { v: 1000, label: "1K" },
  { v: 1500, label: "1.5K" },
];
const PEAK = messagesByDay.indexOf(Math.max(...messagesByDay));
const LAST = days.length - 1;

const f = (n: number) => Math.round(n * 100) / 100;

/** Monotone cubic through every point (Fritsch–Carlson): smooth, never overshoots a day's real value. */
function monotone(pts: Pt[]) {
  const n = pts.length;
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) m.push((pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x));
  const t = pts.map((_, i) => (i === 0 ? m[0] : i === n - 1 ? m[n - 2] : m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (pts[i + 1].x - pts[i].x) / 3;
    d += `C${f(pts[i].x + dx)} ${f(pts[i].y + t[i] * dx)} ${f(pts[i + 1].x - dx)} ${f(pts[i + 1].y - t[i + 1] * dx)} ${f(pts[i + 1].x)} ${f(pts[i + 1].y)}`;
  }
  return d;
}

/**
 * The messages line follows the Studio "Line drawing" option, honestly:
 * octilinear = straight segments, orthogonal = daily steps (each day a plateau),
 * cord = a monotone curve through every day's value.
 */
function buildPaths(pts: Pt[], style: LineStyle, left: number, right: number, base: number, band: number) {
  if (style === "orthogonal") {
    const steps: Pt[] = [{ x: left, y: pts[0].y }];
    for (let i = 0; i < pts.length - 1; i++) {
      const mid = pts[i].x + band / 2;
      steps.push({ x: mid, y: pts[i].y }, { x: mid, y: pts[i + 1].y });
    }
    steps.push({ x: right, y: pts[pts.length - 1].y });
    const line = polyline(steps, 5).d;
    return { line, area: `${line}L${f(right)} ${f(base)}L${f(left)} ${f(base)}Z` };
  }
  const line = style === "cord" ? monotone(pts) : pts.map((q, i) => `${i ? "L" : "M"}${f(q.x)} ${f(q.y)}`).join("");
  const first = pts[0];
  const last = pts[pts.length - 1];
  return { line, area: `${line}L${f(last.x)} ${f(base)}L${f(first.x)} ${f(base)}Z` };
}

/** Opacity that follows the scrubbed reveal once the time cursor passes `at`. */
function Scrubbed({
  reveal,
  at,
  scrub,
  children,
  className,
}: {
  reveal: MotionValue<number>;
  at: number;
  scrub: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const opacity = useTransform(reveal, [Math.max(0, at - 0.07), at], [0.2, 1]);
  return (
    <motion.g className={className} style={{ opacity: scrub ? opacity : 1 }}>
      {children}
    </motion.g>
  );
}

function ScrubbedLabel({ reveal, at, scrub, children, style, className }: { reveal: MotionValue<number>; at: number; scrub: boolean; children: React.ReactNode; style: React.CSSProperties; className?: string }) {
  const opacity = useTransform(reveal, [Math.max(0, at - 0.04), at + 0.02], [0, 1]);
  return (
    <motion.div aria-hidden className={className} style={{ ...style, opacity: scrub ? opacity : 1 }}>
      {children}
    </motion.div>
  );
}

export function MessagesChart({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const plotRef = useRef<HTMLDivElement>(null);
  const { width, height: measured } = useSize(plotRef, { width: 640, height: 276 });
  const look = useLook();
  const { still } = useMotionPrefs();
  const hydrated = useHydrated();
  const scrub = hydrated && !still;
  const [active, setActive] = useState<number | null>(null);

  // Geometry in real pixels, so labels stay 11px at every width.
  const compact = width < 480;
  const height = Math.max(180, measured);
  const pad = { l: compact ? 35 : 38, r: compact ? 6 : 10, t: 50, b: 30 };
  const plotW = Math.max(1, width - pad.l - pad.r);
  const plotH = height - pad.t - pad.b;
  const band = plotW / days.length;
  const base = pad.t + plotH;
  const x = (i: number) => pad.l + (i + 0.5) * band;
  const y = (v: number) => pad.t + (1 - v / Y_MAX) * plotH;
  const pts = messagesByDay.map((v, i) => ({ x: x(i), y: y(v) }));
  const { line, area } = buildPaths(pts, look.lines, pad.l, pad.l + plotW, base, band);

  // Scroll scrub: the clip widens with scroll, so time advances Tue → Mon as you read down.
  const { scrollYProgress } = useScroll({ target: plotRef, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.0005 });
  // Completes as the plot reaches mid-viewport, so the whole week is drawn while it is being read.
  const reveal = useTransform(smooth, [0.12, 0.52], [0, 1]);
  // One edge for both the clip and the dashed time cursor, so the cursor sits exactly where data stops.
  // It spans 4px either side of the plot (round caps), which pad.r (≥ 6) always has room for.
  const edge = (v: number) => pad.l - 4 + v * (plotW + 8);
  const clipW = useTransform(reveal, (v) => Math.max(0, edge(v)));
  const edgeX = useTransform(reveal, edge);
  const edgeOpacity = useTransform(reveal, [0, 0.03, 0.95, 1], [0, 1, 1, 0]);
  const at = (i: number) => (i + 0.5) / days.length;

  const hatchId = `ins-hatch-${uid}`;
  const clipId = `ins-clip-${uid}`;
  const liveId = `ins-live-${uid}`;

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const gx = ((e.clientX - rect.left) / (rect.width || 1)) * width; // pointer in chart units
    const i = Math.floor((gx - pad.l) / band);
    setActive(Math.max(0, Math.min(LAST, i)));
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const next: Record<string, (a: number | null) => number | null> = {
      ArrowRight: (a) => (a === null ? 0 : Math.min(LAST, a + 1)),
      ArrowLeft: (a) => (a === null ? LAST : Math.max(0, a - 1)),
      Home: () => 0,
      End: () => LAST,
      Escape: () => null,
    };
    const fn = next[e.key];
    if (!fn) return;
    e.preventDefault();
    setActive(fn);
  };

  // Overlays are placed in % of the plot so they track the SVG even before the first measurement.
  const pct = (px: number) => `${(px / width) * 100}%`;
  const tipLeft = active === null ? "0%" : pct(Math.min(Math.max(x(active), 58), width - 58));
  const prev = active !== null && active > 0 ? messagesByDay[active] - messagesByDay[active - 1] : null;

  return (
    <Panel
      id={`${uid}-title`}
      letter="A"
      title="Messages"
      className={className}
    >
      <p className="mt-1.5 mb-4 text-[13px] leading-snug text-ink-soft">Per day, all channels.</p>

      <div
        ref={plotRef}
        tabIndex={0}
        role="group"
        aria-roledescription="chart"
        aria-label="Messages per day, Tuesday to Monday. Use the left and right arrow keys to read each day."
        aria-describedby={liveId}
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
        onKeyDown={onKey}
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && setActive((a) => a ?? PEAK)}
        onBlur={() => setActive(null)}
        className="relative mt-auto h-[228px] cursor-crosshair touch-pan-y rounded-sm select-none sm:h-[276px]"
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-hidden className="block overflow-visible">
          <defs>
            <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--k-ink)" strokeOpacity="0.26" strokeWidth="1" />
            </pattern>
            <clipPath id={clipId}>
              <motion.rect x={0} y={0} height={height} width={scrub ? clipW : width} />
            </clipPath>
          </defs>

          {/* Active day band */}
          {active !== null && (
            <rect x={x(active) - band / 2} y={pad.t} width={band} height={plotH} style={{ fill: "var(--k-bg-alt)" }} opacity={0.7} />
          )}

          {/* Grid + y ticks */}
          {TICKS.map((t) => (
            <g key={t.v}>
              <line
                x1={pad.l}
                x2={pad.l + plotW}
                y1={y(t.v)}
                y2={y(t.v)}
                stroke={t.v === 0 ? "var(--k-ink)" : "var(--k-line)"}
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text x={pad.l - 7} y={y(t.v) + 3.5} textAnchor="end" className="mono" fontSize={11} style={{ fill: "var(--k-ink-soft)" }}>
                {t.label}
              </text>
            </g>
          ))}

          {/* Data, revealed by the scrubbed clip */}
          <g clipPath={`url(#${clipId})`}>
            <path d={area} style={{ fill: "color-mix(in oklab, var(--k-ink) 5%, transparent)" }} />
            <path d={area} fill={`url(#${hatchId})`} />
            <path d={line} fill="none" stroke="var(--k-ink)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          </g>

          {/* Time cursor riding the reveal edge */}
          {scrub && (
            <motion.line
              x1={0}
              x2={0}
              y1={pad.t - 8}
              y2={base}
              stroke="var(--k-ink)"
              strokeWidth={1}
              strokeDasharray="2 3"
              style={{ x: edgeX, opacity: edgeOpacity }}
            />
          )}

          {/* Peak marker (direct label lives in the lane above) */}
          {active === null && (
            <Scrubbed reveal={reveal} at={at(PEAK)} scrub={scrub}>
              <line x1={x(PEAK)} x2={x(PEAK)} y1={pad.t - 8} y2={pts[PEAK].y - 7} stroke="var(--k-ink-soft)" strokeWidth={1} strokeDasharray="1 2.5" />
              <circle cx={x(PEAK)} cy={pts[PEAK].y} r={4.5} fill="var(--k-ink)" stroke="var(--k-surface)" strokeWidth={2} />
            </Scrubbed>
          )}

          {/* Crosshair */}
          {active !== null && (
            <g>
              <line x1={x(active)} x2={x(active)} y1={pad.t - 8} y2={base} stroke="var(--k-ink)" strokeWidth={1} shapeRendering="crispEdges" />
              <circle cx={x(active)} cy={pts[active].y} r={5} fill="var(--k-ink)" stroke="var(--k-surface)" strokeWidth={2} />
            </g>
          )}

          {/* Day axis: labels fade in as the cursor reaches them */}
          {days.map((d, i) => (
            <Scrubbed key={d} reveal={reveal} at={at(i)} scrub={scrub}>
              <text
                x={x(i)}
                y={height - 9}
                textAnchor="middle"
                className="mono"
                fontSize={11}
                fontWeight={active === i ? 600 : 400}
                style={{ fill: active === i ? "var(--k-ink)" : "var(--k-ink-soft)", textTransform: "uppercase" }}
              >
                {d}
              </text>
            </Scrubbed>
          ))}
        </svg>

        {/* Lane above the plot: the peak's direct label at rest, the readout while hovering */}
        {active === null ? (
          <ScrubbedLabel
            reveal={reveal}
            at={at(PEAK)}
            scrub={scrub}
            className="mono pointer-events-none absolute top-[10px] -translate-x-1/2 text-[11px] leading-none whitespace-nowrap text-ink-soft"
            style={{ left: pct(Math.min(Math.max(x(PEAK), 56), width - 56)) }}
          >
            <span className="font-semibold text-ink">{fmt(messagesByDay[PEAK])}</span> · {days[PEAK].toUpperCase()} PEAK
          </ScrubbedLabel>
        ) : (
          <div
            aria-hidden
            className="mono pointer-events-none absolute top-0 -translate-x-1/2 rounded-sm border border-line-strong bg-surface px-2 py-1 text-[11px] leading-[1.35] whitespace-nowrap"
            style={{ left: tipLeft }}
          >
            <span className="tracking-[0.06em] text-ink-soft">{days[active].toUpperCase()}</span>{" "}
            <span className="font-semibold text-ink">{fmt(messagesByDay[active])}</span>
            <span className="block text-ink-soft">{prev === null ? "first day" : `${signed(prev)} vs ${days[active - 1]}`}</span>
          </div>
        )}

        <p id={liveId} aria-live="polite" className="sr-only">
          {active !== null ? `${dayName[days[active]]}: ${fmt(messagesByDay[active])} messages.` : ""}
        </p>
      </div>

      <DataTable
        caption="Messages per day, last 7 days (demo workspace, illustrative numbers)"
        head={["Day", "Messages"]}
        rows={days.map((d, i) => [dayName[d], fmt(messagesByDay[i])])}
      />
    </Panel>
  );
}
