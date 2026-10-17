"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";

import { cn } from "@/lib/cn";

import { results } from "./data";
import { formatInt, popTint, useSectionMotion } from "./hooks";

const fills = [popTint(3, 30), popTint(3, 62), "var(--k-pop3)"];
const ease = [0.22, 1, 0.36, 1] as const;

/** One automation's funnel: three bars that grow in step with their counts. Demo numbers, stamped as such. */
export function Results() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const { still, pace } = useSectionMotion();
  const on = still || inView;
  const max = results[0].value;

  return (
    <div ref={ref} className="min-w-0">
      {/* The bar labels already read "comment to delivered", so the block needs no title of its own. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="eyebrow">Results · one automation</p>
        <DemoStamp />
      </div>

      <ol className="mt-5 space-y-3">
        {results.map((b, i) => (
          <li key={b.label} className="grid grid-cols-[96px_minmax(0,1fr)_52px] items-center gap-3 sm:grid-cols-[112px_minmax(0,1fr)_56px]">
            <span className="mono text-[11px] tracking-[0.06em] text-ink-soft uppercase">{b.label}</span>
            <span className="relative block h-9 overflow-hidden rounded-sm bg-bg-alt" aria-hidden>
              <motion.span
                className="absolute inset-y-0 left-0 w-full origin-left rounded-sm border-[1.5px] border-ink"
                style={{ background: fills[i] }}
                initial={false}
                animate={{ scaleX: on ? b.value / max : 0 }}
                transition={still ? { duration: 0 } : { duration: 1.1 * pace, delay: i * 0.14 * pace, ease }}
              />
            </span>
            <span className="text-right text-[18px] text-ink">
              <span className="sr-only">{b.value}</span>
              <CountUp to={on ? b.value : 0} still={still} duration={1.1 * pace} delay={i * 0.14 * pace} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** A number that counts up with its bar (same duration, delay and ease). Text only, so it reads as one figure. */
function CountUp({ to, still, duration, delay }: { to: number; still: boolean; duration: number; delay: number }) {
  const value = useMotionValue(0);
  const text = useTransform(value, (v) => formatInt(v));
  useEffect(() => {
    if (still) {
      value.set(to);
      return;
    }
    const run = animate(value, to, { duration, delay, ease });
    return () => run.stop();
  }, [to, still, duration, delay, value]);
  return (
    <motion.span aria-hidden className="mono tabular-nums">
      {text}
    </motion.span>
  );
}

export function DemoStamp({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "mono inline-block -rotate-2 rounded-[3px] border-[1.5px] border-line-strong px-2 py-1 text-[11px] leading-tight tracking-[0.08em] text-ink-soft uppercase",
        className,
      )}
    >
      Demo workspace · illustrative numbers
    </span>
  );
}
