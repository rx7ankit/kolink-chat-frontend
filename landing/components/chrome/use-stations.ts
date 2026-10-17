"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue, useMotionValueEvent, useScroll, type MotionValue } from "motion/react";

import { stations } from "./stations";

/** A section counts as "here" once its top is within this many px of the viewport top (nav + landing air). */
const THRESHOLD = 104;

/**
 * Scroll position expressed in stations: 0 is the top of the page (the hero),
 * k is the moment station k's top reaches the nav, fractional in between.
 * Section offsets are measured only on resize (ResizeObserver on <body>), never per frame.
 */
export function useStationProgress(): { index: MotionValue<number>; current: number } {
  const { scrollY } = useScroll();
  const index = useMotionValue(0);
  const [current, setCurrent] = useState(0);
  const tops = useRef<number[]>([]);

  const update = useCallback(
    (y: number) => {
      const t = tops.current;
      if (t.length < 2) return;
      const n = t.length - 1;
      const p = y + THRESHOLD;
      let f = 0;
      if (p >= t[n]) f = n;
      else {
        for (let k = n - 1; k >= 0; k--) {
          if (p >= t[k]) {
            const span = t[k + 1] - t[k];
            f = span > 0 ? k + (p - t[k]) / span : k + 1;
            break;
          }
        }
      }
      index.set(f);
      const c = Math.floor(f + 1e-3);
      setCurrent((prev) => (prev === c ? prev : c));
    },
    [index],
  );

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const sy = window.scrollY;
      const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight) + THRESHOLD;
      const t = [0];
      for (const s of stations) {
        const el = document.getElementById(s.id);
        t.push(el ? el.getBoundingClientRect().top + sy : t[t.length - 1]);
      }
      const n = t.length - 1;
      // Stations the page can never scroll to (the footer on a tall screen) are squeezed into reach.
      for (let k = 1; k <= n; k++) t[k] = Math.min(t[k], limit - (n - k) * 24);
      for (let k = 1; k <= n; k++) t[k] = Math.max(t[k], t[k - 1]);
      tops.current = t;
      update(window.scrollY);
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [update]);

  useMotionValueEvent(scrollY, "change", update);

  return { index, current };
}
