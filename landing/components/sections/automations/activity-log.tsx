"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

import { FlapText } from "@/components/ui/flap-text";
import { cn } from "@/lib/cn";

import { activity } from "./data";
import { useSectionMotion } from "./hooks";
import { SubHead } from "./sub-head";

const cols = "xl:grid-cols-[148px_minmax(0,1fr)_72px_168px]";

/** The Activity tab: every matched comment with its keyword and status. */
export function ActivityLog() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const { still, pace } = useSectionMotion();
  const [flipped, setFlipped] = useState(0);

  // Rows land as MATCHED, then each status cell flips once (status cell only).
  useEffect(() => {
    if (!inView || still) return;
    const timers = activity.map((_, i) =>
      window.setTimeout(() => setFlipped((n) => Math.max(n, i + 1)), (450 + i * 150) * (pace || 1)),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [inView, still, pace]);

  return (
    <div ref={ref} className="min-w-0">
      <SubHead kicker="Activity · Drop 04 reel" title="Every matched comment, logged" />
      <div role="table" aria-label="Automation activity" className="mt-6 border-t border-ink">
        <div role="row" className={cn("hidden border-b border-line py-2.5 xl:grid xl:gap-x-4", cols)}>
          {["Commenter", "Comment", "Keyword", "Status"].map((h) => (
            <span key={h} role="columnheader" className="eyebrow text-[11px]">
              {h}
            </span>
          ))}
        </div>
        {activity.map((row, i) => {
          const status = still || flipped > i ? row.status : "MATCHED";
          return (
            <div
              key={`${row.handle}-${i}`}
              role="row"
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-b border-line py-3 xl:items-center xl:gap-y-0",
                cols,
              )}
            >
              <span role="cell" className="truncate text-[14px] font-semibold xl:col-start-1 xl:row-start-1">
                @{row.handle}
              </span>
              <span role="cell" className="col-start-1 row-start-2 truncate text-[14px] text-ink-soft xl:col-start-2 xl:row-start-1">
                “{row.comment}”
              </span>
              <span role="cell" className="col-start-2 row-start-2 justify-self-end xl:col-start-3 xl:row-start-1 xl:justify-self-start">
                <span className="mono inline-block rounded-full border border-line-strong px-2 py-[3px] text-[11.5px] leading-none">
                  <span className="sr-only">Keyword </span>
                  {row.keyword}
                </span>
              </span>
              <span role="cell" className="col-start-2 row-start-1 justify-self-end xl:col-start-4 xl:justify-self-start">
                {/* Screen readers get the logged status; the flap is the visual replay of it. */}
                <span className="sr-only">{row.status}</span>
                <span aria-hidden className="mono inline-flex rounded-[3px] bg-ink px-1.5 py-1 text-[11px] leading-none text-bg">
                  <FlapText text={status} />
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
