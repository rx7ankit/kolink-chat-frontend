"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import { cn } from "@/lib/cn";
import { useLook } from "@/lib/studio/store";

const COLUMNS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

/** 8px baseline rhythm, with every fourth line (32px) a touch stronger. */
const baselineStyle: CSSProperties = {
  backgroundImage: [
    "repeating-linear-gradient(to bottom, color-mix(in oklab, var(--k-line) 70%, transparent) 0 1px, transparent 1px 32px)",
    "repeating-linear-gradient(to bottom, color-mix(in oklab, var(--k-line) 38%, transparent) 0 1px, transparent 1px 8px)",
  ].join(","),
};

const column =
  "relative h-full min-w-0 border-x border-[color-mix(in_oklab,var(--k-line)_75%,transparent)] bg-[color-mix(in_oklab,var(--k-ink)_2.5%,transparent)] transition-colors duration-150 data-hot:border-line-strong data-hot:bg-[color-mix(in_oklab,var(--k-ink)_6%,transparent)]";

/**
 * Brightens the column under a fine pointer by toggling `data-hot` on it directly:
 * column edges are cached on resize, pointer moves are coalesced to one rAF, and
 * React never re-renders while the cursor moves.
 */
function useHotColumn(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!enabled || !host || !window.matchMedia("(pointer: fine)").matches) return;
    const cols = Array.from(host.children) as HTMLElement[];
    let edges: { l: number; r: number }[] = [];
    let x = -1;
    let hot = -1;
    let raf = 0;
    const measure = () => {
      edges = cols.map((c) => {
        const b = c.getBoundingClientRect();
        return { l: b.left, r: b.right };
      });
    };
    const apply = () => {
      raf = 0;
      const i = edges.findIndex((e) => x >= e.l && x < e.r);
      if (i === hot) return;
      if (hot >= 0) cols[hot]?.removeAttribute("data-hot");
      if (i >= 0) cols[i]?.setAttribute("data-hot", "");
      hot = i;
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      x = -1;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (hot >= 0) cols[hot]?.removeAttribute("data-hot");
    };
  }, [enabled]);
  return ref;
}

/**
 * The Studio's layout grid: 12 hairline columns inside the k-container with tiny
 * mono column numbers. None on phones (the spec turns the overlay off under 768px).
 * - scope "page" (default): a fixed, click-through overlay shown when the Studio grid is
 *   "everywhere" or "baseline" (the latter adds an 8px baseline rhythm); the column
 *   under the cursor brightens.
 * - scope "stage": fills its nearest positioned ancestor and shows only for "hero",
 *   for a stage that wants the overlay instead of drawing its own.
 * Renders nothing otherwise.
 */
export function GridOverlay({ scope = "page", className }: { scope?: "page" | "stage"; className?: string }) {
  const { grid } = useLook();
  const show = scope === "page" ? grid === "everywhere" || grid === "baseline" : grid === "hero";
  const colsRef = useHotColumn(show && scope === "page");
  if (!show) return null;
  const baseline = scope === "page" && grid === "baseline";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none inset-0 hidden select-none md:block",
        scope === "page" ? "fixed z-[65]" : "absolute z-0",
        className,
      )}
    >
      {baseline && <div className="absolute inset-0" style={baselineStyle} />}
      <div className="k-container h-full">
        <div ref={colsRef} className="grid h-full grid-cols-12 gap-x-4 lg:gap-x-6">
          {COLUMNS.map((n) => (
            <div key={n} className={column}>
              <span className="mono absolute top-1 left-1 text-[10px] leading-none text-ink-soft opacity-80">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
