"use client";

import { useEffect, useState } from "react";

import { useMotionPrefs } from "@/lib/studio/store";

/**
 * A play-once timeline: returns how many of `times` (ms, before the Studio pace
 * multiplier) have elapsed since `play` became true. `times` must be a stable
 * (module-level) array. Under reduced motion / Studio "Still" it returns the
 * end state immediately and schedules nothing.
 */
export function useSteps(play: boolean, times: readonly number[]): number {
  const { still, pace } = useMotionPrefs();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!play || still) return;
    const ids = times.map((t, i) => window.setTimeout(() => setStep((s) => Math.max(s, i + 1)), t * pace));
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [play, still, pace, times]);

  return still ? times.length : step;
}
