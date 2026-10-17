"use client";

import { motion, useSpring, useTransform, type MotionValue } from "motion/react";

import { cn } from "@/lib/cn";
import { useMotionPrefs } from "@/lib/studio/store";

import { stations } from "./stations";
import { useAnchorClick } from "./use-jump";

const N = stations.length;

/**
 * The "you are here" rail on the nav's bottom edge: one station tick per section,
 * an ink fill for the distance travelled and the post capsule riding it with scroll.
 * Decorative for assistive tech (the nav links and the index cover navigation);
 * on fine pointers each tick names its section on hover and jumps there on click.
 */
export function NavRail({ index, current }: { index: MotionValue<number>; current: number }) {
  const { still } = useMotionPrefs();
  const onAnchor = useAnchorClick();
  const smooth = useSpring(index, { stiffness: 120, damping: 30 });
  const src = still ? index : smooth;
  const fill = useTransform(src, (v) => Math.min(1, Math.max(0, v / N)));
  const x = useTransform(src, (v) => `${(Math.min(N, Math.max(0, v)) / N) * 100}%`);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-4 -bottom-px h-[2px] md:inset-x-8">
      <div className="absolute inset-0 bg-line" />
      <motion.div className="absolute inset-0 origin-left bg-ink" style={{ scaleX: fill }} />

      {stations.map((s, i) => {
        const k = i + 1;
        const passed = k <= current;
        const edge = k >= N - 1 ? "right" : k === 1 ? "left" : "center";
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            tabIndex={-1}
            onClick={(e) => onAnchor(e, s.id)}
            className="group pointer-events-auto absolute top-1/2 h-6 w-5 -translate-x-1/2 -translate-y-1/2 pointer-coarse:pointer-events-none"
            style={{ left: `${(k / N) * 100}%` }}
          >
            {/* Fixed 10px tick scaled from its foot: hover/passed states never animate layout. */}
            <span
              className={cn(
                "absolute bottom-1/2 left-1/2 h-[10px] w-[2px] -translate-x-1/2 origin-bottom transition-[scale,background-color] duration-200",
                passed ? "scale-y-80 bg-ink" : "scale-y-60 bg-line-strong",
                "group-hover:scale-y-100 group-hover:bg-ink",
              )}
            />
            <span
              className={cn(
                "mono absolute top-[calc(100%+4px)] rounded-sm border border-line bg-surface px-1.5 py-1 text-[11px] leading-none tracking-[0.06em] whitespace-nowrap text-ink uppercase opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                edge === "right" ? "right-0" : edge === "left" ? "left-0" : "left-1/2 -translate-x-1/2",
              )}
            >
              {s.num} · {s.label}
            </span>
          </a>
        );
      })}

      {/* Wider clip box so the capsule is whole at either end; the inner layer is rail-wide. */}
      <div className="absolute -inset-x-3 -inset-y-2 [overflow-x:clip]">
        <div className="absolute inset-x-3 top-1/2">
          <motion.div className="absolute inset-x-0 top-0" style={{ x }}>
            <span className="absolute top-0 left-0 block h-[9px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-ink bg-accent" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
