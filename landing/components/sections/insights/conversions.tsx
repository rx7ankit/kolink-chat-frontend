"use client";

import { useId, useRef } from "react";
import { motion } from "motion/react";

import { conversions, fmt, hatch } from "./data";
import { usePlay } from "./hooks";
import { DataTable, Panel } from "./panel";

const MAX = Math.max(...conversions.map((c) => c.value));
const SPRING = { type: "spring", stiffness: 260, damping: 24 } as const;

/**
 * (E) Conversion events: three independent counts, ranked. Deliberately not a
 * funnel (no connecting shapes, no step-to-step rates) and no revenue.
 */
export function Conversions({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = useRef<HTMLOListElement>(null);
  const { shown, animated, pace } = usePlay(ref);
  const motionOn = shown && animated;

  return (
    <Panel id={`${uid}-title`} letter="E" title="Conversion events" className={className}>
      <p className="mt-1.5 mb-4 text-[13px] leading-snug text-ink-soft">Separate counts, not a funnel.</p>
      <ol ref={ref} aria-hidden className="mt-auto space-y-5 xl:mb-auto md:grid md:grid-cols-3 md:gap-x-8 md:space-y-0 xl:block xl:space-y-5">
        {conversions.map((c, i) => (
          <li key={c.label} className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="mono text-[11px] text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                <span className="truncate text-[13px] font-medium text-ink">{c.label}</span>
              </span>
              <span className="mono text-[13px] font-semibold text-ink tabular-nums">{fmt(c.value)}</span>
            </div>
            <div className="relative mt-2 h-3 border-l border-ink">
              <motion.div
                className="absolute inset-y-0 left-0 origin-left rounded-r-sm border border-l-0 border-ink"
                style={{ width: `${(c.value / MAX) * 100}%`, ...(i === 0 ? { background: "var(--k-ink)" } : hatch) }}
                initial={false}
                animate={{ scaleX: shown ? 1 : 0 }}
                transition={motionOn ? { ...SPRING, delay: 0.06 * i * pace } : { duration: 0 }}
              />
            </div>
          </li>
        ))}
      </ol>
      <DataTable
        caption="Conversion events, independent counts (demo workspace, illustrative numbers)"
        head={["Event", "Contacts"]}
        rows={conversions.map((c) => [c.label, fmt(c.value)])}
      />
    </Panel>
  );
}
