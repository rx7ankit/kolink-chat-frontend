"use client";

import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Check, Play } from "lucide-react";

import { PlatformIcon } from "@/components/brand/platform-icon";
import { Photo } from "@/components/media/photo";
import { ease } from "@/components/motion/reveal";
import { Glyph } from "@/components/transit/glyph";
import { Roundel } from "@/components/transit/roundel";
import { FlapText } from "@/components/ui/flap-text";
import { Odometer } from "@/components/ui/odometer";
import { cn } from "@/lib/cn";
import { videos } from "@/lib/media";
import { useMotionPrefs } from "@/lib/studio/store";

import {
  boardRows,
  connectGroups,
  type BoardRow,
  keywords,
  libraryCards,
  messagesSeries,
  modes,
  switchRows,
  type StopId,
} from "./data";
import { useSteps } from "./use-steps";

const springy = { type: "spring", stiffness: 520, damping: 30 } as const;

/* ---------------------------------------------------------------- frame */

function Frame({ label, aside, children, className }: { label: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("k-card overflow-hidden", className)}>
      <div className="flex min-h-10 items-center justify-between gap-3 border-b border-line px-4 py-2 sm:px-5">
        <span className="mono truncate text-[11px] tracking-[0.08em] text-ink-soft uppercase">{label}</span>
        {aside && <span className="mono shrink-0 text-[11px] tracking-[0.06em] text-ink-soft uppercase">{aside}</span>}
      </div>
      <div className="p-4 sm:px-5">{children}</div>
    </div>
  );
}

/** Two stacked labels crossfaded by opacity (no color tweening). */
function Swap({ on, off, onNode, className }: { on: boolean; off: ReactNode; onNode: ReactNode; className?: string }) {
  return (
    <span className={cn("grid", className)}>
      <span className={cn("col-start-1 row-start-1 transition-opacity duration-200", on ? "opacity-0" : "opacity-100")}>{off}</span>
      <span className={cn("col-start-1 row-start-1 transition-opacity duration-200", on ? "opacity-100" : "opacity-0")}>{onNode}</span>
    </span>
  );
}

/**
 * A status that changes words (Connect → Connected): the old word rolls up and out while the
 * new one rolls in under a clip, so two different words never overlap mid-change.
 */
function Roll({ on, off, onNode, className }: { on: boolean; off: ReactNode; onNode: ReactNode; className?: string }) {
  const cell = "col-start-1 row-start-1 transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none";
  return (
    <span className={cn("grid overflow-hidden", className)}>
      <span className={cn(cell, on ? "-translate-y-full opacity-0" : "opacity-100")}>{off}</span>
      <span className={cn(cell, on ? "opacity-100" : "translate-y-full opacity-0")}>{onNode}</span>
    </span>
  );
}

/* ---------------------------------------------------------------- 01 · connect */

const CONNECT_TIMES = [350, 800, 1100, 1350, 1600, 1850] as const;
/** Step at which each platform flips: one Facebook Login connects three lines at once. */
const connectStep: Record<string, number> = {
  instagram: 1,
  facebook: 1,
  messenger: 1,
  whatsapp: 2,
  threads: 3,
  x: 4,
  linkedin: 5,
  gmail: 6,
};

function ConnectVignette({ play }: { play: boolean }) {
  const step = useSteps(play, CONNECT_TIMES);
  const count = Object.values(connectStep).filter((s) => step >= s).length;
  const columns = [connectGroups.slice(0, 2), connectGroups.slice(2)];
  return (
    <Frame
      label="Channels"
      aside={
        <span className="inline-flex items-center gap-1 text-ink">
          <Odometer value={count} /> / 8 connected
        </span>
      }
    >
      {/* The Facebook Login column carries the longest name, so it gets a little more room. */}
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)]">
        {columns.map((groups, c) => (
          <div key={c} className="min-w-0 space-y-4">
            {groups.map((g) => (
              <div key={g.label} className="min-w-0">
                <p className="mono flex items-center gap-2 text-[11px] tracking-[0.06em] text-ink-soft uppercase">
                  <span className="shrink-0">{g.label}</span>
                  <span className="h-px flex-1 bg-line" />
                </p>
                <ul className={cn("mt-1.5", g.platforms.length === 3 && "border-l-2 border-ink pl-3")}>
                  {g.platforms.map((p) => {
                    const on = step >= connectStep[p.id];
                    return (
                      <li key={p.id} className="flex h-9 items-center gap-3">
                        <Roundel platform={p.id} size={24} active={on} />
                        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{p.name}</span>
                        <span className="mono relative inline-grid h-6 w-[10.5ch] shrink-0 place-items-center rounded-full text-[11px]">
                          <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_var(--k-line-strong)]" />
                          {/* Connected is a quiet status (a pale accent tint), so the solid accent stays reserved for real CTAs. */}
                          <span
                            className={cn(
                              "absolute inset-0 rounded-full bg-[color-mix(in_oklab,var(--k-accent)_11%,var(--k-surface))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--k-accent)_42%,var(--k-surface))] transition-opacity duration-200",
                              on ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {/* A settings status rolls; the split-flap is kept for the departures board. */}
                          <Roll
                            on={on}
                            className="relative place-items-center text-[11px] uppercase"
                            off={<span className="text-ink">Connect</span>}
                            onNode={<span className="text-accent-text">Connected</span>}
                          />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- 02 · library */

const CARD_TIMES = [250, 510, 770, 1030, 1290, 1550] as const;
const READY_TIMES = [1400] as const;

function LibraryVignette({ play }: { play: boolean }) {
  const { amp, pace, still } = useMotionPrefs();
  const inCount = useSteps(play, CARD_TIMES);
  const ready = useSteps(play, READY_TIMES) > 0;
  const all = inCount >= libraryCards.length;
  return (
    <Frame
      label="Knowledge library"
      aside={
        <span className="inline-flex items-center gap-1 text-ink">
          <Odometer value={inCount} /> sources
        </span>
      }
    >
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {libraryCards.map((card, i) => {
          const on = inCount > i;
          return (
            <li key={card.title} className="relative min-w-0">
              {/* The empty slot the card drops into; the card stays in flow so long titles grow the row. */}
              <span aria-hidden className="absolute inset-0 rounded-md border border-dashed border-line-strong" />
              <motion.div
                initial={false}
                animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 * amp }}
                transition={still ? { duration: 0 } : { duration: 0.42 * pace, ease: ease.out }}
                className="relative flex h-full min-h-[96px] flex-col rounded-md border border-line bg-surface p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="mono min-w-0 truncate rounded-xs px-1.5 py-0.5 text-[11px] tracking-[0.02em] text-ink-soft uppercase shadow-[inset_0_0_0_1px_var(--k-line-strong)]">
                    {card.kind}
                  </span>
                  <motion.span
                    initial={false}
                    animate={on ? { scale: 1 } : { scale: amp ? 0.4 : 1 }}
                    transition={still ? { duration: 0 } : { ...springy, delay: 0.18 * pace }}
                    className="grid size-[18px] place-items-center rounded-full bg-ink text-bg"
                  >
                    <Check size={11} strokeWidth={3} aria-hidden />
                  </motion.span>
                </div>
                <p className="mt-2 line-clamp-3 text-[13px] leading-snug font-medium text-ink sm:line-clamp-2">{card.title}</p>
                {card.meta && (
                  <p className="mono mt-auto pt-1 text-[11px] tracking-[0.02em] text-ink-soft uppercase">
                    {card.pending ? <Roll on={ready} off="Pending" onNode={<span className="text-ink">Ready</span>} /> : card.meta}
                  </p>
                )}
              </motion.div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-3.5">
        <span className="flex -space-x-1.5">
          <Roundel platform="instagram" size={24} active={all} />
          <Roundel platform="messenger" size={24} active={all} />
        </span>
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink-soft">Instagram and Messenger answer from it.</p>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- 03 · switches + trigger words */

type TypeFrame = { t: number; chips: number; partial: string };

const TYPING: TypeFrame[] = (() => {
  const frames: TypeFrame[] = [];
  let t = 1200;
  keywords.forEach((word, i) => {
    const chars = Array.from(word);
    chars.forEach((_, c) => {
      t += 75;
      frames.push({ t, chips: i, partial: chars.slice(0, c + 1).join("") });
    });
    t += 170;
    frames.push({ t, chips: i + 1, partial: "" });
  });
  return frames;
})();
const SWITCH_TIMES = [300, 750, ...TYPING.map((f) => f.t)];

function SwitchesVignette({ play }: { play: boolean }) {
  const { still } = useMotionPrefs();
  const spring = still ? { duration: 0 } : springy;
  const step = useSteps(play, SWITCH_TIMES);
  const frame: TypeFrame = step > 2 ? TYPING[step - 3] : { t: 0, chips: 0, partial: "" };
  const done = frame.chips >= keywords.length;
  const typing = step >= 2 && !done;
  return (
    <Frame label="Autoreply">
      <ul className="space-y-2.5">
        {switchRows.map((row, r) => {
          const mode = step > r ? row.to : "Off";
          const idx = modes.indexOf(mode);
          return (
            // Phones: the switch drops under the channel name so each segment keeps room for "AGENTIC".
            <li
              key={row.id}
              className="grid grid-cols-[26px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 sm:grid-cols-[26px_minmax(0,1fr)_198px]"
            >
              <Roundel platform={row.id} size={26} active={mode !== "Off"} />
              <span className="min-w-0 truncate text-[14px] font-medium text-ink">{row.name}</span>
              <span className="relative col-start-2 grid h-9 grid-cols-3 rounded-full p-[3px] shadow-[inset_0_0_0_1.5px_var(--k-line-strong)] sm:col-start-3">
                <motion.span
                  initial={false}
                  animate={{ x: `${idx * 100}%` }}
                  transition={spring}
                  className="absolute inset-y-[3px] left-[3px] w-[calc((100%-6px)/3)] rounded-full bg-ink"
                />
                {modes.map((m) => (
                  <Swap
                    key={m}
                    on={m === mode}
                    className="mono relative place-items-center text-[11px] tracking-[0.02em] uppercase"
                    off={<span className="text-ink-soft">{m}</span>}
                    onNode={<span className="text-bg">{m}</span>}
                  />
                ))}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 border-t border-line pt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="mono flex items-center gap-2 text-[11px] tracking-[0.04em] text-ink-soft uppercase">
            <Glyph handler="automation" size={10} />
            Comment → DM
          </p>
          <p className="mono text-[11px] tracking-[0.04em] text-ink-soft uppercase">Reel · “Linen drop”</p>
        </div>
        <div className="mt-3 flex min-h-12 flex-wrap items-center gap-1.5 rounded-md bg-bg p-2 shadow-[inset_0_0_0_1.5px_var(--k-line-strong)]">
          {keywords.slice(0, frame.chips).map((k) => (
            <motion.span
              key={k}
              initial={play && !done && !still ? { scale: 0.85, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring}
              className="mono inline-flex h-7 items-center rounded-sm bg-[color-mix(in_oklab,var(--k-pop3)_45%,var(--k-surface))] px-2 text-[12.5px] text-ink shadow-[inset_0_0_0_1px_var(--k-ink)]"
            >
              {k}
            </motion.span>
          ))}
          {frame.partial && <span className="mono pl-1 text-[12.5px] text-ink">{frame.partial}</span>}
          {typing && <span className="h-4 w-[2px] bg-ink" />}
          {frame.chips === 0 && !frame.partial && (
            <span className="mono pl-1 text-[12px] text-ink-soft">Add trigger words…</span>
          )}
        </div>
        <div className="mono mt-2.5 flex items-center justify-between gap-3 text-[11px] tracking-[0.04em] text-ink-soft uppercase">
          <span>
            <Odometer value={frame.chips} /> / 20
          </span>
          <Roll on={done} off="Draft" onNode={<span className="text-ink">Ready</span>} className="justify-items-end" />
        </div>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- 04 · departures + sparkline */

const BOARD_TIMES = [300, 600, 880, 1160, 1440] as const;

const W = 700;
const H = 120;
const PAD_Y = 14;
const vMin = 400;
const vMax = 1340;
const pts = messagesSeries.map((d, i) => ({
  x: ((i + 0.5) / messagesSeries.length) * W,
  y: H - PAD_Y - ((d.value - vMin) / (vMax - vMin)) * (H - PAD_Y * 2),
}));
const lineD = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("");
const areaD = `${lineD}L${pts[pts.length - 1].x.toFixed(1)} ${H}L${pts[0].x.toFixed(1)} ${H}Z`;
const peakIndex = messagesSeries.reduce((best, d, i, arr) => (d.value > arr[best].value ? i : best), 0);
const total = messagesSeries.reduce((sum, d) => sum + d.value, 0);
const fmt = (n: number) => n.toLocaleString("en-US");

/** The post a board row is about, as a small 4:5 thumbnail (the Reel shows its poster frame). */
function Thumb({ media }: { media: NonNullable<BoardRow["media"]> }) {
  const reel = videos.linenReel;
  return (
    <span className="relative block h-11 w-9 shrink-0 overflow-hidden rounded-[7px] bg-bg-alt shadow-[0_0_0_1px_var(--k-line)]">
      {"photo" in media ? (
        <Photo id={media.photo} alt="" sizes="72px" />
      ) : (
        <>
          <Image src={reel.poster} width={reel.width} height={reel.height} alt="" sizes="72px" className="h-full w-full object-cover" />
          <span className="absolute right-[3px] bottom-[3px] grid size-3.5 place-items-center rounded-full bg-ink/70 text-white">
            <Play size={7} strokeWidth={0} fill="currentColor" className="translate-x-[0.5px]" aria-hidden />
          </span>
        </>
      )}
    </span>
  );
}

function RunVignette({ play }: { play: boolean }) {
  const { still, pace } = useMotionPrefs();
  const flipped = useSteps(play, BOARD_TIMES);
  const peak = pts[peakIndex];
  return (
    <Frame label="Now running" aside="Demo · illustrative">
      <ul className="-my-1">
        {boardRows.map((row, i) => {
          const on = flipped > i;
          return (
            <li
              key={row.time}
              className="grid min-h-[60px] grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-line py-2 last:border-b-0 sm:grid-cols-[3rem_24px_minmax(0,1fr)_auto]"
            >
              <span className="mono hidden text-[12px] text-ink-soft sm:block">{row.time}</span>
              <span className="grid place-items-center">
                <Glyph handler={row.handler} size={11} />
              </span>
              <span className="flex min-w-0 items-center gap-3">
                <span className="min-w-0 flex-1">
                  {/* Wraps to two lines on phones instead of cutting the quote mid-word. */}
                  <span className="line-clamp-2 text-[13px] leading-snug font-medium text-ink sm:text-[13.5px]">{row.what}</span>
                  <span className="mt-1 flex min-w-0 items-center gap-1 sm:gap-1.5" data-active={on ? "true" : "false"}>
                    {/* The marks name the networks; no caption needed. */}
                    {row.platforms.map((p) => (
                      <PlatformIcon key={p} id={p} size={12} />
                    ))}
                  </span>
                </span>
                {row.media && <Thumb media={row.media} />}
              </span>
              <FlapText
                text={on ? row.to : row.from}
                className={cn("min-w-[10ch] justify-end justify-self-end text-[11px] tracking-[0.02em]", on ? "text-ink" : "text-ink-soft")}
              />
            </li>
          );
        })}
      </ul>

      <div className="mt-3 border-t border-line pt-3.5">
        <div className="mono flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[11px] tracking-[0.04em] text-ink-soft uppercase">
          <span>Messages · 7 days</span>
          <span className="text-ink">{fmt(total)}</span>
        </div>
        <motion.div
          className="relative mt-3 h-14"
          initial={false}
          animate={{ clipPath: play || still ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
          transition={still ? { duration: 0 } : { duration: 1.1 * pace, delay: 0.25 * pace, ease: [0.65, 0, 0.35, 1] }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
            <line x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} stroke="var(--k-line)" vectorEffect="non-scaling-stroke" />
            <path d={areaD} fill="var(--k-accent)" opacity={0.12} />
            <path d={lineD} fill="none" stroke="var(--k-ink)" strokeWidth={1.75} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
          <span
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_1.5px_var(--k-surface)]"
            style={{ left: `${(peak.x / W) * 100}%`, top: `${(peak.y / H) * 100}%` }}
          />
        </motion.div>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- switch */

export function Vignette({ id, play }: { id: StopId; play: boolean }) {
  return (
    <Fragment>
      {id === "connect" && <ConnectVignette play={play} />}
      {id === "teach" && <LibraryVignette play={play} />}
      {id === "switches" && <SwitchesVignette play={play} />}
      {id === "run" && <RunVignette play={play} />}
    </Fragment>
  );
}
