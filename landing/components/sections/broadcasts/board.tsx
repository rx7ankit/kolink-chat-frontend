"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, useInView, useMotionValueEvent, useScroll } from "motion/react";

import { PlatformIcon } from "@/components/brand/platform-icon";
import { FlapText } from "@/components/ui/flap-text";
import { cn } from "@/lib/cn";

import { MediaThumb, type ThumbSource } from "../automations/brand";
import { useSectionMotion } from "../automations/hooks";
import { boardRows, importAt, networkLabel, type BoardRow, type BoardStatus } from "./data";

/** 0 = starting status, 1 = PROCESSING, 2 = final status. */
type RowPhase = 0 | 1 | 2;

/*
 * Phones: two lines per row (the listing's media, format and caption count under the network).
 * md and up: five columns. The caption is the same on every row, so the board shows only
 * its length against each network's limit; the composer beside it holds the text.
 */
const cols = cn(
  "grid-cols-[4px_44px_minmax(0,1fr)_auto]",
  "md:grid-cols-[4px_48px_minmax(0,1.1fr)_minmax(0,1.25fr)_minmax(0,0.8fr)_118px]",
);

/**
 * A Swiss departures board: one post, one listing per network. Status cells are
 * the only split-flap text; they flip SCHEDULED → PROCESSING → PUBLISHED as the
 * board crosses scroll thresholds (one-way triggers, not tweens).
 */
export function DeparturesBoard({ replay }: { replay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { still, pace } = useSectionMotion();
  const k = pace || 1;
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const [phases, setPhases] = useState<Record<string, RowPhase>>({});
  const [imported, setImported] = useState(false);
  // Imports also arrive the moment their slot is fully on screen, whatever the board's scroll progress.
  const lastRowRef = useRef<HTMLDivElement>(null);
  const slotSeen = useInView(lastRowRef, { once: true, amount: 1 });
  const triggered = useRef(new Set<string>());
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  const flip = (ids: string[], startDelay = 0) => {
    ids.forEach((id, i) => {
      triggered.current.add(id);
      timers.current.push(
        window.setTimeout(() => setPhases((s) => ({ ...s, [id]: 1 })), (startDelay + i * 110) * k),
        window.setTimeout(() => setPhases((s) => ({ ...s, [id]: 2 })), (startDelay + 620 + i * 110) * k),
      );
    });
  };

  const check = (p: number) => {
    const due = boardRows.filter((r) => r.flipAt !== null && p >= r.flipAt && !triggered.current.has(r.id)).map((r) => r.id);
    if (due.length) flip(due);
    if (p >= importAt) setImported(true);
  };
  useMotionValueEvent(scrollYProgress, "change", check);
  useEffect(() => {
    const id = requestAnimationFrame(() => check(scrollYProgress.get()));
    return () => cancelAnimationFrame(id);
    // Run once on mount for visitors who land below the thresholds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Publish now" in the composer replays the departures (simulated, nothing is posted).
  // Pending flips from an earlier run are dropped so two replays never interleave.
  useEffect(() => {
    if (!replay) return;
    const ids = boardRows.filter((r) => r.flipAt !== null).map((r) => r.id);
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current.length = 0;
    const reset = window.setTimeout(() => {
      setPhases((s) => {
        const next = { ...s };
        ids.forEach((id) => (next[id] = 0));
        return next;
      });
      flip(ids, 260);
    }, 0);
    return () => window.clearTimeout(reset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay]);

  const statusOf = (r: BoardRow): BoardStatus => {
    if (still) return r.to;
    const ph = phases[r.id] ?? 0;
    return ph === 2 ? r.to : ph === 1 ? "PROCESSING" : r.from;
  };

  return (
    <div ref={ref} className="k-card min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-4 bg-ink px-4 py-3 text-bg md:px-5">
        <p className="mono text-[12px] tracking-[0.12em] whitespace-nowrap uppercase md:tracking-[0.14em]">
          Departures <span className="hidden opacity-60 sm:inline">· Drop 04</span>
        </p>
        <p className="mono text-[11px] tracking-[0.1em] whitespace-nowrap uppercase opacity-75">Demo workspace</p>
      </div>

      <div role="table" aria-label="Publishing status per network">
        <div role="row" className={cn("hidden border-b border-line py-2.5 md:grid md:gap-x-4 md:pr-5", cols)}>
          <span aria-hidden />
          {["Time", "Network", "Format", "Caption", "Status"].map((h) => (
            <span key={h} role="columnheader" className="eyebrow text-[11px]">
              {h}
            </span>
          ))}
        </div>

        {boardRows.map((r, i) => {
          const status = statusOf(r);
          const published = status === "PUBLISHED";
          const show = r.imported ? still || imported || slotSeen : still || inView;
          return (
            <div
              key={r.id}
              ref={i === boardRows.length - 1 ? lastRowRef : undefined}
              role="row"
              className="overflow-hidden border-b border-line last:border-b-0"
            >
              <motion.div
                className={cn("grid items-center gap-x-3 gap-y-1 py-3 pr-4 md:h-[60px] md:gap-x-4 md:gap-y-0 md:py-0 md:pr-5", cols)}
                initial={false}
                animate={r.imported ? { x: show ? "0%" : "100%" } : { y: show ? "0%" : "100%" }}
                transition={
                  still
                    ? { duration: 0 }
                    : { duration: 0.5 * k, delay: r.imported ? (r.id === "imp-fb" ? 0.24 : 0.15) : i * 0.07, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <span
                  aria-hidden
                  className="col-start-1 row-span-2 row-start-1 self-stretch md:row-span-1"
                  style={
                    r.imported
                      ? { boxShadow: `inset 0 0 0 1.5px var(--line-${r.network})`, background: "var(--k-surface)" }
                      : { background: `var(--line-${r.network})` }
                  }
                />
                <span role="cell" className="mono col-start-2 row-start-1 pl-1 text-[13px] text-ink tabular-nums md:pl-0">
                  {r.time}
                </span>
                <span role="cell" className="col-start-3 row-start-1 flex min-w-0 items-center gap-2" data-active={published ? "true" : "false"}>
                  <PlatformIcon id={r.network} size={15} />
                  <span className="truncate text-[14px] font-medium">{networkLabel[r.network]}</span>
                </span>
                <span
                  role="cell"
                  className="col-span-3 col-start-2 row-start-2 flex min-w-0 items-center gap-2 pl-1 md:col-span-1 md:col-start-4 md:row-start-1 md:gap-2.5 md:pl-0"
                >
                  <Thumb media={r.media} />
                  <span className="truncate text-[13px] text-ink-soft md:text-[14px]">{r.format}</span>
                  {/* Phones fold the caption count into this line. */}
                  {(r.count || r.imported) && (
                    <span className="mono shrink-0 text-[11px] text-ink-soft tabular-nums md:hidden">· {r.count ?? "already live"}</span>
                  )}
                </span>
                <span role="cell" className="mono hidden truncate text-[11.5px] tabular-nums md:col-start-5 md:row-start-1 md:block">
                  {r.count ? <span className="text-ink">{r.count}</span> : <span className="text-ink-soft">{r.imported ? "already live" : "—"}</span>}
                </span>
                <span role="cell" className="col-start-4 row-start-1 flex items-center justify-end gap-1.5 md:col-start-6 md:justify-start">
                  <StatusTile status={status} />
                  {/* The live post's permalink, once it exists. Inline so the tile stays on the row's centre line. */}
                  <span
                    className="hidden size-4 shrink-0 place-items-center text-ink-soft md:grid"
                    style={{ opacity: published ? 1 : 0, transition: "opacity .3s" }}
                    title="Permalink"
                    aria-hidden
                  >
                    <ArrowUpRight className="size-3.5" strokeWidth={1.75} />
                  </span>
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The listing's media as a small rounded still; text-only listings get a type mark in the same slot so captions align. */
function Thumb({ media }: { media?: ThumbSource }) {
  const box = "relative size-6 shrink-0 overflow-hidden rounded-md md:size-7";
  if (!media) {
    return (
      <span aria-hidden className={cn(box, "mono grid place-items-center border border-line bg-bg-alt text-[10px] text-ink-soft")}>
        Aa
      </span>
    );
  }
  return (
    <span aria-hidden className={cn(box, "bg-bg-alt")}>
      <MediaThumb src={media} sizes="28px" />
    </span>
  );
}

/** A split-flap tile. The flap split shows only as two notches at the edges, so it never reads as a strikethrough. */
function StatusTile({ status }: { status: BoardStatus }) {
  return (
    <span
      className={cn(
        "mono relative inline-flex min-w-[96px] justify-center overflow-hidden rounded-[3px] bg-ink px-1.5 py-[5px] text-[11px] leading-none text-bg",
        "before:absolute before:top-1/2 before:left-0 before:h-px before:w-[3px] before:bg-bg/40",
        "after:absolute after:top-1/2 after:right-0 after:h-px after:w-[3px] after:bg-bg/40",
      )}
    >
      <span aria-hidden className="relative">
        <FlapText text={status} stagger={18} />
      </span>
      <span className="sr-only">{status}</span>
    </span>
  );
}
