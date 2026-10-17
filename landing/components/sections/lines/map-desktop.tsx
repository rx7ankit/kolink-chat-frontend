"use client";

import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import {
  motion,
  motionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

import { lineColor } from "@/components/transit/line";
import { Roundel } from "@/components/transit/roundel";
import { cn } from "@/lib/cn";
import type { PlatformId } from "@/lib/platforms";
import { useLook } from "@/lib/studio/store";
import { buildLut, link, polyline, toPath, type Route } from "@/lib/transit/geometry";

import {
  conversationStart,
  facebookLogin,
  lineRows,
  pad2,
  pillEdge,
  pillFill,
  signInOf,
  stations,
} from "./data";
import { MapKey } from "./legend";
import { Note } from "./note";
import { useLinesMotion } from "./use-motion";

/* Geometry, in CSS px. Rows and columns come from the CSS grid; the SVG reads them back. */
const LINE_Y = 20; // line y from the top of its row
const PILL_W = 12; // station pill width
const STROKE = 3;
const TICK = 10; // stop tick, from the line's centre down
const CONN_X = 7; // Facebook Login connector, from the terminus column's left edge
const CAP_X = 25; // single-line terminus capsules
const RD = 28; // roundel size
const RD_X = 60; // roundel centre
const NAME_X = RD_X - RD / 2;
const LABEL_TOP = LINE_Y + 9;
const LABEL_LEFT = PILL_W + 9;
/** A served stop's casing matches the pill fill, so it only notches the hairline outline. */
const PILL_FILL = pillFill;

/*
 * Scroll choreography. Each line starts drawing once its own row is on screen (ENTER of the
 * viewport above the bottom edge) and runs for up to SPAN of the viewport height, but every
 * line is finished by the time the map's bottom edge is in view, so the complete map can be
 * read at rest. Rows sit a fixed distance apart, so the stagger falls out of the map itself:
 * top lines draw slowly, lower lines faster, and none of them draws off screen.
 */
const ENTER = 0.06;
const SPAN = 0.45;
const MIN_PX = 48;

const pop = { type: "spring", stiffness: 520, damping: 30 } as const;
const outEase = [0.22, 1, 0.36, 1] as const;

type Geo = {
  w: number;
  h: number;
  /** Viewport height, for the per-row scroll windows. */
  vh: number;
  rowY: number[];
  colX: number[];
  connX: number;
  capX: number;
  pillTop: number;
  pillBottom: number;
  endX: number;
};

const gridRowOf = (k: number) => (k < conversationStart ? k + 2 : k + 3);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const sameGeo = (a: Geo | null, b: Geo) => !!a && JSON.stringify(a) === JSON.stringify(b);
const fbLines = new Set<PlatformId>(facebookLogin.lines);

/**
 * §01 desktop map (xl+): eight horizontal lines leave the CONNECT terminus and
 * run through seven station pills. A line that serves a station is drawn over
 * the pill with a cased tick and a label; a line that doesn't passes behind it.
 */
export function MapDesktop({
  focus,
  onFocusLine,
}: {
  focus: PlatformId | null;
  onFocusLine: (id: PlatformId | null) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const { still, pace } = useLinesMotion();
  const { lines: lineStyle } = useLook();

  // Read the grid back into SVG coordinates whenever it resizes (fonts, Studio type, viewport).
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      if (grid.clientWidth === 0) return; // hidden below xl
      const rows = Array.from(grid.querySelectorAll<HTMLElement>("[data-anchor='row']"));
      const cols = Array.from(grid.querySelectorAll<HTMLElement>("[data-anchor='col']"));
      const term = grid.querySelector<HTMLElement>("[data-anchor='term']");
      if (rows.length !== lineRows.length || cols.length !== stations.length || !term) return;
      const rowY = rows.map((el) => el.offsetTop + LINE_Y);
      const next: Geo = {
        w: grid.clientWidth,
        h: grid.clientHeight,
        vh: window.innerHeight,
        rowY,
        colX: cols.map((el) => el.offsetLeft + PILL_W / 2),
        connX: term.offsetLeft + CONN_X,
        capX: term.offsetLeft + CAP_X,
        pillTop: cols[0].offsetTop + cols[0].offsetHeight - 4,
        pillBottom: rowY[rowY.length - 1] + 18,
        endX: grid.clientWidth - 8,
      };
      setGeo((prev) => (sameGeo(prev, next) ? prev : next));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    // Height-only viewport changes don't resize the grid but do move every row's scroll window.
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Routes (Studio line style) and, per line, the progress at which its head reaches each station.
  const model = useMemo(() => {
    if (!geo) return null;
    const routes: Route[] = lineRows.map((row, k) => {
      const y = geo.rowY[k];
      const start = fbLines.has(row.id) ? geo.connX : geo.capX;
      if (lineStyle !== "cord") return polyline([{ x: start, y }, { x: geo.endX, y }]);
      // Cord: the cable sags a little between station posts.
      const xs = [start, ...geo.colX, geo.endX];
      const segs: Route["segs"] = [];
      for (let i = 0; i < xs.length - 1; i++) segs.push(...link({ x: xs[i], y }, { x: xs[i + 1], y }, "cord", { sag: 0.035 }).segs);
      return { segs, d: toPath(segs) };
    });
    const thresholds = routes.map((route) => {
      const lut = buildLut(route, 240);
      const n = lut.xs.length - 1;
      return geo.colX.map((cx) => {
        let j = 0;
        while (j < n && lut.xs[j] < cx - 1) j++;
        return j / n;
      });
    });
    return { routes, thresholds };
  }, [geo, lineStyle]);

  // Scroll → per-line draw progress. One subscription; React only re-renders when a head passes a station.
  // 0 when the grid top meets the viewport bottom, 1 when the grid bottom meets the viewport top.
  const { scrollYProgress } = useScroll({ target: gridRef, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const progress = useMemo(() => lineRows.map(() => motionValue(0)), []);
  const full = useMemo(() => motionValue(1), []);
  const [track, setTrack] = useState<number[]>(() => lineRows.map(() => 0));

  const sync = useCallback(
    (v: number) => {
      if (!model || !geo) return;
      const scrolled = v * (geo.h + geo.vh); // px since the grid top met the viewport bottom
      const next = lineRows.map((_, k) => {
        // Row k's line sits ENTER above the viewport bottom once scrolled = rowY + ENTER·vh.
        // Finishing by the time the map's bottom edge is in view wins; the last rows get a short
        // (≥ MIN_PX) window that may start a touch earlier, while their line is still on screen.
        const to = Math.min(geo.rowY[k] + (ENTER + SPAN) * geo.vh, geo.h);
        const from = Math.min(geo.rowY[k] + ENTER * geo.vh, to - MIN_PX);
        const p = clamp01((scrolled - from) / (to - from));
        progress[k].set(p);
        const reached = model.thresholds[k].filter((t) => p >= t).length;
        return reached * 2 + (p > 0 && p < 1 ? 1 : 0);
      });
      setTrack((prev) => (prev.every((c, i) => c === next[i]) ? prev : next));
    },
    [model, geo, progress],
  );

  useMotionValueEvent(smooth, "change", (v) => {
    if (!still) sync(v);
  });
  useEffect(() => {
    if (still) return;
    const id = requestAnimationFrame(() => sync(smooth.get()));
    return () => cancelAnimationFrame(id);
  }, [still, sync, smooth]);

  const reachedOf = (k: number) => (still ? stations.length : track[k] >> 1);
  const drawingOf = (k: number) => !still && (track[k] & 1) === 1;
  const dim = (id: PlatformId) => focus !== null && focus !== id;
  // Hover highlight: a plain fade, kept to 150ms when motion is still.
  const fade = still ? "transition-opacity duration-150" : "transition-opacity duration-300";

  const onPointerOver = (e: PointerEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-line]");
    onFocusLine(el ? (el.dataset.line as PlatformId) : null);
  };

  const labelMotion = (on: boolean, delay = 0) =>
    still
      ? { initial: false as const, animate: { y: "0%" }, transition: { duration: 0 } }
      : {
          initial: false as const,
          animate: { y: on ? "0%" : "110%" },
          transition: { duration: 0.5 * pace, delay: on ? delay * pace : 0, ease: outEase },
        };

  return (
    <figure className="m-0" aria-hidden>
      {/* Map title bar: the key, in the map's own marks */}
      <div className="mono border-y border-line py-3 text-[11px] tracking-[0.08em] text-ink-soft uppercase">
        <MapKey />
      </div>

      <div
        ref={gridRef}
        onPointerOver={onPointerOver}
        onPointerLeave={() => onFocusLine(null)}
        className="relative grid grid-cols-[112px_176px_repeat(7,minmax(0,1fr))] pt-6 pb-5 2xl:grid-cols-[132px_184px_repeat(7,minmax(0,1fr))]"
      >
        {/* Row hover zones (under the lines) */}
        {lineRows.map((row, k) => (
          <div
            key={`zone-${row.id}`}
            data-line={row.id}
            className={cn(
              "relative",
              focus === row.id && "bg-[color-mix(in_oklab,var(--k-ink)_4%,transparent)]",
            )}
            style={{ gridRow: gridRowOf(k), gridColumn: "1 / -1" }}
          />
        ))}

        {geo && model && (
          <svg
            className="pointer-events-none absolute inset-0 overflow-visible"
            width={geo.w}
            height={geo.h}
            viewBox={`0 0 ${geo.w} ${geo.h}`}
            aria-hidden
          >
            {/* Lines */}
            {lineRows.map((row, k) => (
              <g key={`line-${row.id}`} className={fade} style={{ opacity: dim(row.id) ? 0.16 : 1 }}>
                <MapLine
                  d={model.routes[k].d}
                  platform={row.id}
                  dashed={row.dashed}
                  progress={still ? full : progress[k]}
                  box={geo}
                  end={{ x: geo.endX, y: geo.rowY[k] }}
                />
              </g>
            ))}

            {/* Station pills: lines that don't stop pass behind them */}
            {geo.colX.map((x, i) => (
              <rect
                key={`pill-${stations[i].key}`}
                x={x - PILL_W / 2}
                y={geo.pillTop}
                width={PILL_W}
                height={geo.pillBottom - geo.pillTop}
                rx={PILL_W / 2}
                fill={PILL_FILL}
                stroke={pillEdge}
                strokeWidth={1}
              />
            ))}

            {/* CONNECT terminus: one Facebook Login connector, single capsules for the rest */}
            <Terminus geo={geo} />

            {/* Stops */}
            {stations.map((st, i) =>
              lineRows.map((row, k) => {
                if (!st.stops[row.id]) return null;
                return (
                  <g key={`stop-${st.key}-${row.id}`} className={fade} style={{ opacity: dim(row.id) ? 0.16 : 1 }}>
                    <StopMark
                      x={geo.colX[i]}
                      y={geo.rowY[k]}
                      platform={row.id}
                      dashed={row.dashed}
                      on={reachedOf(k) > i}
                      still={still}
                    />
                  </g>
                );
              }),
            )}
          </svg>
        )}

        {/* Header row: terminus + seven stations */}
        <div data-anchor="term" className="relative pb-4" style={{ gridRow: 1, gridColumn: 2 }}>
          <p className="mono text-[11px] leading-4 text-ink-soft">00</p>
          <p className="mt-0.5 text-[15px] leading-5 font-medium tracking-[-0.01em] text-ink">Connect</p>
        </div>
        {stations.map((st, i) => (
          <div
            key={`head-${st.key}`}
            data-anchor="col"
            className="relative min-w-0 pr-3 pb-4"
            style={{ gridRow: 1, gridColumn: i + 3 }}
          >
            <p className="mono text-[11px] leading-4 text-ink-soft">{pad2(i + 1)}</p>
            <p className="mt-0.5 truncate text-[15px] leading-5 font-medium tracking-[-0.01em] text-ink">
              {st.name}
              <Note n={st.note} />
            </p>
          </div>
        ))}

        {/* Divider between publish lines and conversation-only lines */}
        {/* Same words and type as the key's dashed mark, so it reads as a group label, not LinkedIn's caption. */}
        <div className="relative flex items-center pt-2 pb-2" style={{ gridRow: conversationStart + 2, gridColumn: 2 }}>
          <span
            className="mono text-[11px] tracking-[0.08em] whitespace-nowrap text-ink-soft uppercase"
            style={{ paddingLeft: NAME_X }}
          >
            Conversation only
          </span>
        </div>

        {/* Line rows */}
        {lineRows.map((row, k) => {
          const signIn = signInOf[row.id];
          const firstOfGroup = signIn.lines[0] === row.id;
          const faded = dim(row.id);
          return (
            <Fragment key={`row-${row.id}`}>
              {/* Sign-in label (once per sign-in) */}
              <div
                data-line={row.id}
                className={cn("relative pr-4 text-right", fade, faded && "opacity-30")}
                style={{ gridRow: gridRowOf(k), gridColumn: 1, paddingTop: LINE_Y - 8 }}
              >
                {firstOfGroup && (
                  <p className="text-[12px] leading-4 text-ink">
                    {/* Non-breaking hyphen: "sign-in" never splits across lines. */}
                    {signIn.label.replace(/-/g, "\u2011")}
                    <Note n={signIn.note} />
                  </p>
                )}
              </div>

              {/* Terminus: roundel on the line, number + name under it */}
              <div
                data-anchor="row"
                data-line={row.id}
                className={cn("relative min-h-[62px] pb-2.5", fade, faded && "opacity-30")}
                style={{ gridRow: gridRowOf(k), gridColumn: 2 }}
              >
                <span className="absolute" style={{ left: RD_X - RD / 2, top: LINE_Y - RD / 2 }}>
                  <Roundel platform={row.id} size={RD} active={focus === row.id || drawingOf(k)} />
                </span>
                <p className="flex items-baseline gap-1.5" style={{ paddingTop: LINE_Y + RD / 2 + 4, paddingLeft: NAME_X }}>
                  <span className="mono text-[11px] text-ink-soft">{row.num}</span>
                  <span className="text-[14px] leading-tight font-medium text-ink">{row.label}</span>
                </p>
              </div>

              {/* Stop labels */}
              {stations.map((st, i) => {
                const stop = st.stops[row.id];
                if (!stop) return null;
                const on = reachedOf(k) > i;
                return (
                  <div
                    key={`label-${st.key}-${row.id}`}
                    data-line={row.id}
                    className={cn("relative min-w-0 pr-3 pb-2.5", fade, faded && "opacity-30")}
                    style={{ gridRow: gridRowOf(k), gridColumn: i + 3, paddingTop: LABEL_TOP, paddingLeft: LABEL_LEFT }}
                  >
                    <span className="block overflow-hidden pb-px">
                      <motion.span className="block text-[12.5px] leading-[17px] text-ink-soft" {...labelMotion(on, 0.06)}>
                        {/* Separators stay with the word before them, so a wrapped label never opens on "·" or "/". */}
                        {stop.label.replace(/ ([·/]) /g, "\u00a0$1 ")}
                        <Note n={stop.note} />
                      </motion.span>
                    </span>
                  </div>
                );
              })}
            </Fragment>
          );
        })}
      </div>
    </figure>
  );
}

/** One line: bg casing + stroke, drawn by pathLength. Dashed lines reveal through a drawn mask. */
function MapLine({
  d,
  platform,
  dashed,
  progress,
  box,
  end,
}: {
  d: string;
  platform: PlatformId;
  dashed: boolean;
  progress: MotionValue<number>;
  box: { w: number; h: number };
  end: { x: number; y: number };
}) {
  const maskId = `lines-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const stroke = lineColor(platform);
  const draw = { pathLength: progress };
  const bufferOpacity = useTransform(progress, [0.97, 1], [0, 1]);
  return (
    <>
      {dashed ? (
        <>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={box.w} height={box.h}>
            <motion.path d={d} fill="none" stroke="white" strokeWidth={STROKE + 8} strokeLinecap="round" style={draw} />
          </mask>
          <path d={d} fill="none" stroke={stroke} strokeWidth={STROKE} strokeDasharray="7 5" mask={`url(#${maskId})`} />
        </>
      ) : (
        <motion.path d={d} fill="none" stroke={stroke} strokeWidth={STROKE} strokeLinecap="round" style={draw} />
      )}
      {/* Buffer stop */}
      <motion.rect x={end.x - 1.5} y={end.y - 7} width={3} height={14} rx={1} fill={stroke} style={{ opacity: bufferOpacity }} />
    </>
  );
}

/** The CONNECT terminus: Facebook Login is one connector feeding three lines; the others start at their own capsule. */
function Terminus({ geo }: { geo: Geo }) {
  const fbRows = lineRows.map((r, k) => (fbLines.has(r.id) ? k : -1)).filter((k) => k >= 0);
  const top = geo.rowY[fbRows[0]] - 10;
  const bottom = geo.rowY[fbRows[fbRows.length - 1]] + 10;
  return (
    <g>
      <rect
        x={geo.connX - 4.5}
        y={top}
        width={9}
        height={bottom - top}
        rx={4.5}
        fill="var(--k-surface)"
        stroke="var(--k-ink)"
        strokeWidth={1.5}
      />
      {fbRows.map((k) => (
        <circle key={`fb-${k}`} cx={geo.connX} cy={geo.rowY[k]} r={2} fill="var(--k-ink)" />
      ))}
      {lineRows.map((row, k) =>
        fbLines.has(row.id) ? null : (
          <rect key={`cap-${row.id}`} x={geo.capX - 4} y={geo.rowY[k] - 9} width={8} height={18} rx={4} fill="var(--k-ink)" />
        ),
      )}
    </g>
  );
}

/** A served stop: the line continues across the pill and drops a tick. Pops when the line head arrives. */
function StopMark({
  x,
  y,
  platform,
  dashed,
  on,
  still,
}: {
  x: number;
  y: number;
  platform: PlatformId;
  dashed: boolean;
  on: boolean;
  still: boolean;
}) {
  const stroke = lineColor(platform);
  const style: CSSProperties = { transformBox: "view-box", transformOrigin: `${x}px ${y}px` };
  return (
    <motion.g
      initial={false}
      animate={on ? { scale: 1, opacity: 1 } : { scale: 0.3, opacity: 0 }}
      transition={still ? { duration: 0 } : pop}
      style={style}
    >
      {/* A casing in the pill's own fill notches the hairline outline where the line enters the station. */}
      <line x1={x - PILL_W / 2 - 1.5} x2={x + PILL_W / 2 + 1.5} y1={y} y2={y} stroke={PILL_FILL} strokeWidth={STROKE + 4} />
      <line
        x1={x - PILL_W / 2 - 3}
        x2={x + PILL_W / 2 + 3}
        y1={y}
        y2={y}
        stroke={stroke}
        strokeWidth={STROKE}
        strokeDasharray={dashed ? "5 3" : undefined}
      />
      {/* The tick hangs straight off the line (drawn last, so the casing never detaches it). */}
      <rect x={x - 1.5} y={y} width={3} height={TICK} rx={0.75} fill={stroke} />
    </motion.g>
  );
}
