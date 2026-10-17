"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";

import { lineOrder } from "@/lib/capabilities";
import { buildGeometry, type Anchors, type Box, type Geometry, type GeometryInput, type HeroLayout } from "@/lib/hero/layout";
import type { PlatformId } from "@/lib/platforms";
import type { LineStyle } from "@/lib/transit/geometry";

/** Reads the fixed anchors relative to the stage. Called on mount, ResizeObserver and fonts.ready only. */
function measureAnchors(stage: HTMLElement): Anchors | null {
  const base = stage.getBoundingClientRect();
  const pick = (key: string): Box | null => {
    for (const el of stage.querySelectorAll<HTMLElement>(`[data-hx="${key}"]`)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    }
    return null;
  };
  const send = pick("send");
  const pill = pick("pill");
  const badge = pick("badge");
  const hub = pick("hub");
  if (!send || !pill || !badge || !hub) return null;
  const roundels = {} as Record<PlatformId, Box>;
  for (const id of lineOrder) {
    const b = pick(`roundel-${id}`);
    if (!b) return null;
    roundels[id] = b;
  }
  return { w: base.width, h: base.height, send, pill, badge, hub, roundels };
}

/**
 * Geometry for the active layout. Desktop measures anchors (never per frame); the spine galley
 * is analytic and only needs its width. Rows have fixed heights, so nothing re-measures mid-loop.
 * Besides the stage, every zone marked data-hx-watch is observed: a Studio headline or font
 * switch can move the composer (send key, pill) without changing the stage's own size.
 */
export function useGeometry(
  stageRef: RefObject<HTMLElement | null>,
  galleyRef: RefObject<HTMLElement | null>,
  layout: HeroLayout,
  style: LineStyle,
): Geometry | null {
  const [input, setInput] = useState<GeometryInput | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const galley = galleyRef.current;
    if (!stage) return;
    let raf = 0;
    let alive = true;
    // Resize storms often re-measure identical anchors: only rebuild routes when something moved.
    let last = "";
    const commit = (next: GeometryInput) => {
      const key = JSON.stringify(next, (_, v) => (typeof v === "number" ? Math.round(v * 2) / 2 : v));
      if (key === last) return;
      last = key;
      setInput(next);
    };
    const measure = () => {
      if (!alive) return;
      if (layout === "spine") {
        if (galley && galley.clientWidth > 0) commit({ layout: "spine", width: galley.clientWidth });
        return;
      }
      const anchors = measureAnchors(stage);
      if (anchors) commit({ layout, anchors });
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(stage);
    if (galley) ro.observe(galley);
    stage.querySelectorAll("[data-hx-watch]").forEach((el) => ro.observe(el));
    document.fonts?.ready.then(schedule).catch(() => {});
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [stageRef, galleyRef, layout]);

  return useMemo(() => (input && input.layout === layout ? buildGeometry(input, style) : null), [input, layout, style]);
}
