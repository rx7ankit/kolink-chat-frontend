"use client";

import { useId, useRef, useState } from "react";
import { motion } from "motion/react";

import { lineColor } from "@/components/transit/line";
import { Roundel } from "@/components/transit/roundel";

import { byChannel, fmt, type ChannelRow } from "./data";
import { usePlay } from "./hooks";
import { DataTable, Panel } from "./panel";

const MAX = Math.max(...byChannel.map((r) => r.value));
const TOTAL = byChannel.reduce((sum, r) => sum + r.value, 0);
const SPRING = { type: "spring", stiffness: 260, damping: 24 } as const;
const CAP = 24; // roundel diameter

/**
 * One row is one line on the map: the bar is the route (Studio line color,
 * ink by default) and it terminates at the platform's station roundel, which
 * blooms to brand color while the bar is "carrying" (growing) or hovered.
 */
function ChannelBar({ row, index, shown, animated, pace }: { row: ChannelRow; index: number; shown: boolean; animated: boolean; pace: number }) {
  const [hover, setHover] = useState(false);
  const [carrying, setCarrying] = useState(false);
  const pct = row.value / MAX;
  const motionOn = shown && animated;
  const transition = motionOn ? { ...SPRING, delay: 0.06 * index * pace } : { duration: 0 };

  return (
    <li
      className="grid h-10 grid-cols-[5rem_minmax(0,1fr)_3.25rem] items-center gap-x-2 sm:grid-cols-[1.5rem_5.5rem_minmax(0,1fr)_3.5rem]"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <span aria-hidden className="mono hidden text-[11px] text-ink-soft sm:block">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="truncate text-[13px] text-ink">{row.label}</span>
      <span aria-hidden className="relative h-full border-l border-ink">
        <span className="absolute inset-x-0 top-1/2 border-t border-dotted border-line-strong opacity-60" />
        <span className="absolute top-1/2 left-0 h-[6px] -translate-y-1/2" style={{ width: `calc((100% - ${CAP}px) * ${pct.toFixed(4)})` }}>
          <motion.span
            className="absolute inset-0 origin-left rounded-r-full"
            style={{ background: lineColor(row.id) }}
            initial={false}
            animate={{ scaleX: shown ? 1 : 0 }}
            transition={transition}
          />
          {/* Full-length layer whose right edge is the bar tip: x −100% → 0% keeps the cap on the tip without squashing it. */}
          <motion.span
            className="absolute inset-0"
            initial={false}
            animate={{ x: shown ? "0%" : "-100%", opacity: shown ? 1 : 0 }}
            transition={motionOn ? { ...transition, opacity: { duration: 0.15, delay: 0.06 * index * pace } } : transition}
            onAnimationStart={() => motionOn && setCarrying(true)}
            onAnimationComplete={() => setCarrying(false)}
          >
            <Roundel
              platform={row.id}
              size={CAP}
              active={hover || carrying}
              className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2"
            />
          </motion.span>
        </span>
      </span>
      <span className="mono text-right text-[12px] text-ink tabular-nums">{fmt(row.value)}</span>
    </li>
  );
}

/** (C) Messages by channel, ranked. */
export function ByChannel({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = useRef<HTMLOListElement>(null);
  const { shown, animated, pace } = usePlay(ref);

  return (
    <Panel id={`${uid}-title`} letter="C" title="By channel" className={className}>
      <p className="mt-1.5 mb-4 text-[13px] leading-snug text-ink-soft">Messages per channel.</p>
      <ol ref={ref} aria-hidden className="mt-auto">
        {byChannel.map((row, i) => (
          <ChannelBar key={row.id} row={row} index={i} shown={shown} animated={animated} pace={pace} />
        ))}
      </ol>
      <DataTable
        caption="Messages by channel, ranked (demo workspace, illustrative numbers)"
        head={["Channel", "Messages"]}
        rows={byChannel.map((r) => [r.label, `${fmt(r.value)} (${Math.round((r.value / TOTAL) * 100)}%)`])}
      />
    </Panel>
  );
}
