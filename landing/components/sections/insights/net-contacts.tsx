"use client";

import { useId, useRef } from "react";
import { motion } from "motion/react";

import { dayName, days, fmt, hatch, netContactsByDay, signed } from "./data";
import { usePlay } from "./hooks";
import { DataTable, Panel } from "./panel";

const MAX = Math.max(...netContactsByDay);
const PEAK = netContactsByDay.indexOf(MAX);
const SPRING = { type: "spring", stiffness: 260, damping: 24 } as const;

/** (B) Net contacts per day: columns grow from the baseline; every cap carries its value. */
export function NetContacts({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const { shown, animated, pace } = usePlay(ref);
  const motionOn = shown && animated;

  return (
    <Panel id={`${uid}-title`} letter="B" title="Net contacts" className={className}>
      <p className="mt-1.5 mb-4 text-[13px] leading-snug text-ink-soft">New, per day.</p>

      <div ref={ref} aria-hidden className="mt-auto flex h-[228px] flex-col sm:h-[276px]">
        {/* Plot: columns sit on an ink baseline; the lane above holds cap labels. */}
        <div className="flex min-h-0 flex-1 items-end gap-1.5 border-b border-ink pt-8 sm:gap-2">
          {netContactsByDay.map((v, i) => (
            <div key={days[i]} className="flex h-full min-w-0 flex-1 items-end justify-center">
              <div className="relative w-full max-w-[26px]" style={{ height: `${(v / MAX) * 100}%` }}>
                <motion.div
                  className="absolute inset-0 origin-bottom rounded-t-sm border border-b-0 border-ink"
                  style={i === PEAK ? { background: "var(--k-ink)" } : hatch}
                  initial={false}
                  animate={{ scaleY: shown ? 1 : 0 }}
                  transition={motionOn ? { ...SPRING, delay: 0.06 * i * pace } : { duration: 0 }}
                />
                {/* Cap label rides the column top: a full-height layer slides from the baseline. */}
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={{ y: shown ? "0%" : "100%", opacity: shown ? 1 : 0 }}
                  transition={motionOn ? { ...SPRING, delay: 0.06 * i * pace, opacity: { duration: 0.2, delay: 0.06 * i * pace } } : { duration: 0 }}
                >
                  <span
                    className={`mono absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 text-[11px] leading-none whitespace-nowrap ${i === PEAK ? "font-semibold text-ink" : "text-ink-soft"}`}
                  >
                    {signed(v)}
                  </span>
                </motion.div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex h-[30px] gap-1.5 pt-3 sm:gap-2">
          {days.map((d, i) => (
            <span
              key={d}
              className={`mono min-w-0 flex-1 text-center text-[11px] leading-none uppercase ${i === PEAK ? "font-semibold text-ink" : "text-ink-soft"}`}
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      <DataTable
        caption="Net new contacts per day, last 7 days (demo workspace, illustrative numbers)"
        head={["Day", "Net contacts"]}
        rows={days.map((d, i) => [dayName[d], fmt(netContactsByDay[i])])}
      />
    </Panel>
  );
}
