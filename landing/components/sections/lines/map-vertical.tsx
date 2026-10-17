"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useInView } from "motion/react";

import { lineColor } from "@/components/transit/line";
import { Roundel } from "@/components/transit/roundel";
import type { PlatformId } from "@/lib/platforms";
import { useLook } from "@/lib/studio/store";
import { polyline } from "@/lib/transit/geometry";

import {
  conversationStart,
  facebookLogin,
  lineRows,
  pad2,
  pillEdge,
  pillFill,
  signInOf,
  stations,
  type Station,
} from "./data";
import { MapKey } from "./legend";
import { Note } from "./note";
import { useLinesMotion } from "./use-motion";

/*
 * Below xl the map is redrawn vertically: the eight lines run down a narrow
 * bundle on the left and each station becomes a horizontal band with its own
 * pill and a readable list of stops. Text never drops below 11px.
 */
const GAP = 12;
const X0 = 12;
const xOf = (k: number) => X0 + GAP * k;
const BUNDLE = X0 * 2 + GAP * (lineRows.length - 1); // 108
const COL_GAP = 12;
const STROKE = 3;
const PILL_H = 20;
const HEAD_H = 44;

/* CONNECT band: fixed rows so the fan-in routes are analytic (no measuring). */
const ROW_H = 48;
const DIV_H = 28;
const RD_C = 28;
const RD_CX = BUNDLE + COL_GAP + RD_C / 2;
const TUBE_X = RD_CX + RD_C / 2 + 9;
const TEXT_X = TUBE_X + 12;
const CONNECT_H = HEAD_H + DIV_H + ROW_H * lineRows.length + 16;
const rowTop = (k: number) => HEAD_H + (k >= conversationStart ? DIV_H : 0) + ROW_H * k;
const rowY = (k: number) => rowTop(k) + ROW_H / 2;

const travel = [0.65, 0, 0.35, 1] as const;
const outEase = [0.22, 1, 0.36, 1] as const;
const pop = { type: "spring", stiffness: 520, damping: 30 } as const;
const dash = "6 5";

function useBand() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const { still, pace } = useLinesMotion();
  const [settled, setSettled] = useState(false);
  // Roundels bloom while their band draws, then settle back to ink.
  useEffect(() => {
    if (!inView || still) return;
    const t = window.setTimeout(() => setSettled(true), 1400 * pace);
    return () => window.clearTimeout(t);
  }, [inView, still, pace]);
  const shown = still || inView;
  const reveal = still
    ? { initial: false as const, animate: { clipPath: "inset(0px 0px 0% 0px)" }, transition: { duration: 0 } }
    : {
        initial: { clipPath: "inset(0px 0px 100% 0px)" },
        animate: { clipPath: inView ? "inset(0px 0px 0% 0px)" : "inset(0px 0px 100% 0px)" },
        transition: { duration: 0.7 * pace, ease: travel },
      };
  return { ref, shown, active: inView && !settled && !still, still, pace, reveal };
}

/** Memoised: it takes no props, so hovering the matrix (which re-renders the body) leaves it alone. */
export const MapVertical = memo(function MapVertical() {
  return (
    <figure className="m-0" aria-hidden>
      <div className="mono border-y border-line py-3 text-[11px] tracking-[0.08em] text-ink-soft uppercase">
        <MapKey className="gap-x-5" />
      </div>
      <div className="pt-6">
        <ConnectBand />
        {stations.map((st, i) => (
          <StationBand key={st.key} station={st} index={i} />
        ))}
        <EndBand />
      </div>
    </figure>
  );
});

function ConnectBand() {
  const { ref, shown, active, still, pace, reveal } = useBand();
  const { lines: style } = useLook();
  const fbRows = lineRows.map((r, k) => (facebookLogin.lines.includes(r.id) ? k : -1)).filter((k) => k >= 0);

  // Each line leaves its roundel, turns down into the bundle and never crosses another.
  const route = (k: number) => {
    const x = xOf(k);
    const y = rowY(k);
    if (style === "octilinear") return polyline([{ x: RD_CX, y }, { x: x + 9, y }, { x, y: y + 9 }, { x, y: CONNECT_H }], 3).d;
    return polyline([{ x: RD_CX, y }, { x, y }, { x, y: CONNECT_H }], style === "cord" ? 22 : 10).d;
  };

  return (
    <div ref={ref} className="relative" style={{ height: CONNECT_H }}>
      <motion.svg className="pointer-events-none absolute top-0 left-0" width={RD_CX} height={CONNECT_H} {...reveal}>
        {lineRows.map((row, k) => (
          <path
            key={row.id}
            d={route(k)}
            fill="none"
            stroke={lineColor(row.id)}
            strokeWidth={STROKE}
            strokeLinecap={row.dashed ? "butt" : "round"}
            strokeLinejoin="round"
            strokeDasharray={row.dashed ? dash : undefined}
          />
        ))}
      </motion.svg>

      {/* Facebook Login: one connector beside lines 01, 02 and 06 */}
      <motion.svg
        className="pointer-events-none absolute top-0 left-0"
        width={TEXT_X}
        height={CONNECT_H}
        initial={false}
        animate={{ opacity: shown ? 1 : 0 }}
        transition={{ duration: still ? 0 : 0.4 * pace, delay: still ? 0 : 0.3 * pace }}
      >
        <rect
          x={TUBE_X - 4}
          y={rowY(fbRows[0]) - 11}
          width={8}
          height={rowY(fbRows[fbRows.length - 1]) - rowY(fbRows[0]) + 22}
          rx={4}
          fill="var(--k-surface)"
          stroke="var(--k-ink)"
          strokeWidth={1.75}
        />
        {fbRows.map((k) => (
          <g key={k}>
            <line x1={RD_CX + RD_C / 2} x2={TUBE_X - 4} y1={rowY(k)} y2={rowY(k)} stroke="var(--k-ink)" strokeWidth={1.75} />
            <circle cx={TUBE_X} cy={rowY(k)} r={2} fill="var(--k-ink)" />
          </g>
        ))}
      </motion.svg>

      {/* Header */}
      <div className="absolute top-0 right-0 flex items-baseline gap-2" style={{ left: BUNDLE + COL_GAP, height: HEAD_H }}>
        <span className="mono pt-1 text-[11px] text-ink-soft">00</span>
        <span className="text-[15px] font-medium tracking-[-0.01em] text-ink">Connect</span>
      </div>

      {/* Divider */}
      <div
        className="mono absolute right-0 flex items-center text-[11px] tracking-[0.08em] text-ink-soft uppercase"
        // Starts with the row text, right of the Facebook Login connector that runs past this gap.
        style={{ left: TEXT_X, top: HEAD_H + ROW_H * conversationStart, height: DIV_H }}
      >
        Conversation only
      </div>

      {/* Rows */}
      {lineRows.map((row, k) => {
        const signIn = signInOf[row.id];
        const first = signIn.lines[0] === row.id;
        return (
          <div key={row.id} className="absolute right-0 left-0" style={{ top: rowTop(k), height: ROW_H }}>
            <span className="absolute" style={{ left: RD_CX - RD_C / 2, top: ROW_H / 2 - RD_C / 2 }}>
              <Roundel platform={row.id} size={RD_C} active={active} />
            </span>
            <div className="absolute inset-y-0 right-0 flex min-w-0 flex-col justify-center" style={{ left: TEXT_X }}>
              <p className="flex min-w-0 items-baseline gap-1.5">
                <span className="mono text-[11px] text-ink-soft">{row.num}</span>
                <span className="truncate text-[14px] leading-tight font-medium text-ink">{row.label}</span>
              </p>
              {/* The sign-in is named once per group; the connector bracket carries it to the other rows. */}
              {first && (
                <p className="mono truncate text-[11px] leading-4 text-ink-soft">
                  {signIn.label}
                  <Note n={signIn.note} />
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StationBand({ station, index }: { station: Station; index: number }) {
  const { ref, active, still, pace, reveal, shown } = useBand();
  const served = lineRows.filter((r) => station.stops[r.id]);
  const pillY = HEAD_H / 2;

  return (
    <div ref={ref} className="relative grid grid-cols-[108px_minmax(0,1fr)] gap-x-3 pb-7">
      {/* Bundle segment for this band */}
      <motion.svg className="pointer-events-none absolute top-0 left-0 h-full" width={BUNDLE} {...reveal}>
        {lineRows.map((row, k) => (
          <line
            key={row.id}
            x1={xOf(k)}
            x2={xOf(k)}
            y1={0}
            y2="100%"
            stroke={lineColor(row.id)}
            strokeWidth={STROKE}
            strokeDasharray={row.dashed ? dash : undefined}
          />
        ))}
      </motion.svg>

      {/* Station pill with the served lines drawn over it */}
      <svg className="pointer-events-none absolute top-0 left-0" width={BUNDLE} height={HEAD_H}>
        <rect
          x={2}
          y={pillY - PILL_H / 2}
          width={BUNDLE - 4}
          height={PILL_H}
          rx={PILL_H / 2}
          fill={pillFill}
          stroke={pillEdge}
          strokeWidth={1}
        />
        {served.map((row) => {
          const k = lineRows.indexOf(row);
          const x = xOf(k);
          const style: CSSProperties = { transformBox: "view-box", transformOrigin: `${x}px ${pillY}px` };
          return (
            <motion.g
              key={row.id}
              initial={false}
              animate={shown ? { scale: 1, opacity: 1 } : { scale: 0.3, opacity: 0 }}
              transition={still ? { duration: 0 } : { ...pop, delay: (0.2 + k * 0.03) * pace }}
              style={style}
            >
              <rect
                x={x}
                y={pillY - 1.75}
                width={8}
                height={3.5}
                rx={0.5}
                fill={lineColor(row.id)}
                stroke={pillFill}
                strokeWidth={2}
                paintOrder="stroke"
              />
              <line
                x1={x}
                x2={x}
                y1={pillY - PILL_H / 2 - 3}
                y2={pillY + PILL_H / 2 + 3}
                stroke={lineColor(row.id)}
                strokeWidth={STROKE}
                strokeDasharray={row.dashed ? "4 3" : undefined}
              />
            </motion.g>
          );
        })}
      </svg>

      {/* Header */}
      <div className="relative col-start-2 flex min-w-0 items-baseline gap-2 pt-[13px]" style={{ height: HEAD_H }}>
        <span className="mono text-[11px] text-ink-soft">{pad2(index + 1)}</span>
        <span className="text-[15px] font-medium tracking-[-0.01em] text-ink">
          {station.name}
          <Note n={station.note} />
        </span>
      </div>

      {/* Stops: the roundel names the line (the Connect band above is its key), so each stop is one line of text. */}
      <ul className="relative col-start-2 grid gap-x-8 gap-y-2.5 pt-0.5 sm:grid-cols-2 lg:grid-cols-3">
        {served.map((row, j) => {
          const stop = station.stops[row.id as PlatformId]!;
          return (
            <li key={row.id} className="flex min-w-0 items-center gap-2.5">
              <Roundel platform={row.id} size={24} active={active} />
              <span className="block min-w-0 overflow-hidden">
                <motion.span
                  className="block text-[13.5px] leading-[18px] text-ink"
                  initial={false}
                  animate={{ y: shown ? "0%" : "110%" }}
                  transition={still ? { duration: 0 } : { duration: 0.5 * pace, delay: (0.3 + j * 0.04) * pace, ease: outEase }}
                >
                  {stop.label}
                  <Note n={stop.note} />
                </motion.span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Buffer stops: every line ends here. */
function EndBand() {
  const { ref, reveal } = useBand();
  return (
    <div ref={ref} className="relative h-6">
      <motion.svg className="pointer-events-none absolute top-0 left-0" width={BUNDLE} height={24} {...reveal}>
        {lineRows.map((row, k) => (
          <g key={row.id}>
            <line
              x1={xOf(k)}
              x2={xOf(k)}
              y1={0}
              y2={14}
              stroke={lineColor(row.id)}
              strokeWidth={STROKE}
              strokeDasharray={row.dashed ? dash : undefined}
            />
            <rect x={xOf(k) - 4.5} y={14} width={9} height={3} rx={1} fill={lineColor(row.id)} />
          </g>
        ))}
      </motion.svg>
    </div>
  );
}
