"use client";

import { useLayoutEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { useInView, type UseInViewOptions } from "motion/react";

import { useMotionPrefs } from "@/lib/studio/store";

const subscribeNever = () => () => {};

/** False on the server and during hydration, true afterwards. Lets SSR paint complete charts. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/**
 * Entrance state for micro-UI that plays once on view (bars, arcs, odometers, the stamp).
 * - Server render, reduced motion and Studio "Still": `shown` is true, so the end state paints.
 * - After hydration with motion on: parks at the start until the element scrolls into view.
 * Use `animated` to pick an instant transition for the park and the still path,
 * and `amp` to size flourishes (0 under Still).
 */
export function usePlay(ref: RefObject<Element | null>, margin: UseInViewOptions["margin"] = "0px 0px -8% 0px") {
  const hydrated = useHydrated();
  const { still, pace, amp } = useMotionPrefs();
  const inView = useInView(ref, { once: true, margin });
  const animated = hydrated && !still;
  return { shown: !animated || inView, animated, pace: pace || 1, amp };
}

/**
 * Content-box size of an element (no layout reads during render). It reads the box once
 * in a layout effect, so the first painted frame after mount already has the real size
 * (and so does a background tab, where ResizeObserver waits for the tab to render),
 * then follows resizes with ResizeObserver.
 */
export function useSize(ref: RefObject<HTMLElement | null>, fallback: { width: number; height: number }) {
  const [size, setSize] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const commit = (w: number, h: number) => {
      if (w <= 0) return;
      const width = Math.round(w);
      const height = Math.round(h);
      setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
    };
    commit(el.clientWidth, el.clientHeight);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) commit(box.width, box.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}
