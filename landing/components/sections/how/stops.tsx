"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from "motion/react";

import { ease } from "@/components/motion/reveal";
import { TransitLine } from "@/components/transit/line";
import { cn } from "@/lib/cn";
import { useLook, useMotionPrefs } from "@/lib/studio/store";
import { polyline } from "@/lib/transit/geometry";

import { stops } from "./data";
import { FINE_DESKTOP, useMediaQuery } from "./use-media-query";
import { Vignette } from "./vignettes";

/** Station roundel diameter, ring width and top inset on the desktop rail (px). */
const R = 40;
const RING = 4;
const TOP = 6;
const X = R / 2;

/** Centre y of station k on a rail of height h. Mirrors the CSS `top` used for the HTML stops. */
const stationY = (k: number, h: number) => TOP + R / 2 + (k * (h - TOP - R)) / (stops.length - 1);

/** Piecewise-linear map through (xs[i], ys[i]); clamped at both ends. */
function piecewise(v: number, xs: number[], ys: number[]) {
  if (v <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (v <= xs[i]) {
      const span = xs[i] - xs[i - 1] || 1;
      return ys[i - 1] + ((v - xs[i - 1]) / span) * (ys[i] - ys[i - 1]);
    }
  }
  return ys[ys.length - 1];
}

type Geo = { h: number; marks: number[] };

export function HowStops({ header }: { header: ReactNode }) {
  const { still, pace } = useMotionPrefs();
  const look = useLook();
  const fineDesktop = useMediaQuery(FINE_DESKTOP);
  const kinetic = look.font === "interchange" && fineDesktop && !still;
  /** Weight 900 only where the face really has it (Archivo); other pairings keep their display weight. */
  const heavy = look.font === "interchange";

  const listRef = useRef<HTMLOListElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo>({ h: 440, marks: [0.12, 0.34, 0.56, 0.78] });

  // Desktop: the rail head reaches stop k when that stop's block crosses 60% of the viewport.
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 0.9", "end 0.6"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  // Mobile: the gutter line's head sits on that same 60% line.
  const { scrollYProgress: gutterRaw } = useScroll({ target: listRef, offset: ["start 0.6", "end 0.6"] });
  const gutter = useSpring(gutterRaw, { stiffness: 120, damping: 30 });

  const ys = stops.map((_, k) => stationY(k, geo.h));
  const end = ys[ys.length - 1];
  const fractions = ys.map((y) => y / end);
  const head = useTransform(smooth, (v) => piecewise(v, [0, ...geo.marks], [0, ...fractions]));
  const full = useMotionValue(1);
  // Hide the round cap's dot until the line actually starts drawing.
  const headOpacity = useTransform(head, (v): number => (v > 0.002 ? 1 : 0));

  const [reached, setReached] = useState(0);
  // The head changes every frame while scrolling; only commit when a station is crossed.
  const reachedRef = useRef(0);
  useMotionValueEvent(head, "change", (v) => {
    let n = 0;
    for (const f of fractions) if (v >= f - 0.003) n++;
    if (n === reachedRef.current) return;
    reachedRef.current = n;
    setReached(n);
  });

  useEffect(() => {
    const list = listRef.current;
    const rail = railRef.current;
    if (!list || !rail) return;
    const measure = () => {
      const vh = window.innerHeight;
      const total = list.offsetHeight + 0.3 * vh;
      const items = Array.from(list.children) as HTMLElement[];
      const marks = items.map((el) => Math.min(0.999, (0.3 * vh + el.offsetTop) / total));
      setGeo((g) => {
        // The rail is display:none below lg (offsetHeight 0): keep the last real height.
        const h = rail.offsetHeight || g.h;
        return g.h === h && g.marks.every((m, i) => Math.abs(m - marks[i]) < 0.001) ? g : { h, marks };
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    ro.observe(rail);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const shown = still ? stops.length : reached;
  const d = polyline([
    { x: X, y: 0 },
    { x: X, y: end },
  ]).d;

  return (
    <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-12">
      {/* LEFT · header, then the sticky rail (desktop) */}
      <div className="min-w-0 lg:col-span-4">
        {header}
        <div
          ref={railRef}
          aria-hidden
          className="sticky top-[calc(var(--k-nav-h)+40px)] mt-14 hidden h-[min(440px,calc(100svh-var(--k-nav-h)-96px))] min-h-[360px] lg:block"
        >
          <svg
            className="absolute top-0 left-0 h-full overflow-visible"
            width={R}
            viewBox={`0 0 ${R} ${geo.h}`}
            preserveAspectRatio="xMidYMin meet"
          >
            <path
              d={d}
              fill="none"
              stroke="var(--k-line-strong)"
              strokeWidth={2}
              strokeDasharray="2 7"
              strokeLinecap="round"
            />
            <TransitLine d={d} width={4} casing={false} progress={still ? full : head} opacity={still ? 1 : headOpacity} />
          </svg>
          {stops.map((stop, k) => (
            <RailStop
              key={stop.id}
              index={k}
              n={stop.n}
              label={stop.label}
              on={shown > k}
              kinetic={kinetic}
              heavy={heavy}
              still={still}
              pace={pace}
            />
          ))}
        </div>
      </div>

      {/* RIGHT · stops with working vignettes */}
      <div className="relative mt-14 min-w-0 pl-12 md:mt-16 lg:col-span-8 lg:mt-0 lg:pl-0">
        <GutterLine progress={gutter} still={still} />
        <ol ref={listRef} className="relative space-y-16 sm:space-y-20 lg:space-y-14">
          {stops.map((stop, k) => (
            <StopBlock key={stop.id} index={k} heavy={heavy} />
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- desktop rail stop */

function RailStop({
  index,
  n,
  label,
  on,
  kinetic,
  heavy,
  still,
  pace,
}: {
  index: number;
  n: string;
  label: string;
  on: boolean;
  kinetic: boolean;
  heavy: boolean;
  still: boolean;
  pace: number;
}) {
  const instant = { duration: 0 };
  return (
    <div
      className="absolute inset-x-0 flex items-center gap-5"
      style={{ top: `calc(${TOP}px + ${index} * (100% - ${TOP + R}px) / ${stops.length - 1})`, height: R }}
    >
      {/* Roundel: white disc, ink ring; fills with accent when the line head arrives. */}
      <motion.span
        initial={false}
        animate={on && !still ? { scale: [0.9, 1.1, 1] } : { scale: 1 }}
        transition={still ? instant : { duration: 0.46 * pace, times: [0, 0.45, 1], ease: ease.out }}
        className="relative grid shrink-0 place-items-center rounded-full bg-surface"
        style={{ width: R, height: R, boxShadow: `inset 0 0 0 ${RING}px var(--k-ink)` }}
      >
        <motion.span
          initial={false}
          animate={{ scale: on ? 1 : 0 }}
          transition={still ? instant : { type: "spring", stiffness: 460, damping: 28 }}
          className="absolute rounded-full bg-accent"
          style={{ inset: RING }}
        />
      </motion.span>

      <div className="flex min-w-0 items-center gap-4">
        <Numeral n={n} on={on} kinetic={kinetic} heavy={heavy} still={still} pace={pace} />
        <span
          className={cn(
            "mono min-w-0 text-[11px] leading-[1.45] tracking-[0.08em] uppercase transition-colors duration-300",
            on ? "text-ink" : "text-ink-soft",
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

/**
 * Huge stop numeral. Archivo on a fine-pointer desktop: the ink layer fades in while
 * the width axis compresses 125 → 75. Everywhere else the ink layer rises through its mask.
 */
function Numeral({
  n,
  on,
  kinetic,
  heavy,
  still,
  pace,
}: {
  n: string;
  on: boolean;
  kinetic: boolean;
  heavy: boolean;
  still: boolean;
  pace: number;
}) {
  const wdth = useMotionValue(75);
  useEffect(() => {
    if (!kinetic) {
      wdth.set(75);
      return;
    }
    const target = on ? 75 : 125;
    const from = wdth.get();
    if (from === target) return;
    const start = performance.now();
    const dur = 420 * pace;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      wdth.set(Math.round(from + (target - from) * e));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, kinetic, pace, wdth]);

  const base = cn(
    "font-display kinetic block leading-[0.8] tracking-[-0.04em] tabular-nums",
    heavy && "[font-weight:900]",
  );
  return (
    <span
      className={cn(
        // A step under the headline (clamp 40–60px) so the title still leads the column.
        "relative block shrink-0 overflow-hidden py-[0.06em] text-[clamp(48px,4.2vw,64px)]",
        // Fixed box while the width axis moves, so the stop label never reflows mid-animation.
        kinetic && "w-[1.58em]",
      )}
      style={{ contain: "layout paint" }}
    >
      <motion.span className={cn(base, "text-line-strong")} style={{ "--k-wdth": wdth } as MotionStyle}>
        {n}
      </motion.span>
      <motion.span
        className={cn(base, "absolute inset-x-0 top-[0.06em] text-ink")}
        style={{ "--k-wdth": wdth } as MotionStyle}
        initial={false}
        animate={
          kinetic
            ? { opacity: on ? 1 : 0, y: "0%" }
            : { opacity: 1, y: on ? "0%" : "110%" }
        }
        transition={still ? { duration: 0 } : { duration: 0.42 * pace, ease: ease.out }}
      >
        {n}
      </motion.span>
    </span>
  );
}

/* ---------------------------------------------------------------- mobile gutter */

function GutterLine({ progress, still }: { progress: MotionValue<number>; still: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute top-2 bottom-0 left-[18.5px] w-[3px] lg:hidden">
      <span className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,var(--k-line-strong)_0_2px,transparent_2px_9px)]" />
      <motion.span className="absolute inset-0 origin-top rounded-full bg-ink" style={{ scaleY: still ? 1 : progress }} />
    </div>
  );
}

/* ---------------------------------------------------------------- stop block */

function StopBlock({ index, heavy }: { index: number; heavy: boolean }) {
  const stop = stops[index];
  const { amp, still, pace } = useMotionPrefs();
  const ref = useRef<HTMLLIElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const reached = useInView(ref, { once: true, margin: "0px 0px -40% 0px" });
  // Plays once a fifth of the card is up: beside its text on desktop, the card must not lag behind as an empty slot.
  const play = useInView(cardRef, { once: true, amount: 0.2 });
  const titleId = `how-stop-${stop.id}`;

  return (
    <li
      ref={ref}
      aria-labelledby={titleId}
      className={cn(
        "relative min-w-0",
        // Desktop: a timetable row. Hairline between stops, text beside the vignette from xl.
        "lg:not-first:border-t lg:not-first:border-line lg:not-first:pt-9",
        "xl:grid xl:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] xl:gap-x-10",
      )}
    >
      {/* Mobile station on the gutter line */}
      <span
        aria-hidden
        className="absolute top-0 -left-12 grid size-10 place-items-center rounded-full bg-surface lg:hidden"
        style={{ boxShadow: "inset 0 0 0 4px var(--k-ink)" }}
      >
        <motion.span
          initial={false}
          animate={{ scale: reached || still ? 1 : 0 }}
          transition={still ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 28 }}
          className="absolute inset-[4px] rounded-full bg-accent"
        />
      </span>

      <div className="min-w-0">
        {/* Phones: the stop numeral sits over the title (from lg the sticky rail carries it). */}
        <span
          aria-hidden
          className={cn(
            "font-display kinetic block text-[56px] leading-[0.8] tracking-[-0.04em] text-ink lg:hidden",
            heavy && "[font-weight:900]",
          )}
          style={{ "--k-wdth": 75 } as CSSProperties}
        >
          {stop.n}
        </span>
        <h3
          id={titleId}
          className="font-display mt-4 text-[clamp(28px,3vw,36px)] leading-[1.04] text-ink lg:mt-0 xl:text-[30px]"
        >
          {stop.title}
        </h3>
        <p className="mt-3 max-w-[52ch] text-[16px] leading-[1.6] text-ink-soft xl:text-[15px]">{stop.body}</p>
      </div>

      <motion.figure
        ref={cardRef}
        className="mt-6 min-w-0 xl:mt-0"
        initial={false}
        animate={play || still ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 * amp }}
        transition={still ? { duration: 0.15 } : { duration: 0.6 * pace, ease: ease.out }}
      >
        <figcaption className="sr-only">{stop.summary}</figcaption>
        <div aria-hidden>
          <Vignette id={stop.id} play={play || still} />
        </div>
      </motion.figure>
    </li>
  );
}
