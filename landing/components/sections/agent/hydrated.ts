"use client";

import { useSyncExternalStore } from "react";

import { useMotionPrefs } from "@/lib/studio/store";

const noop = () => () => {};

/** False on the server and during hydration, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/**
 * Reduced-motion flag that is safe for choosing a different layout: it only turns
 * true after hydration, so server and first client render always agree.
 */
export function useStillLayout() {
  const hydrated = useHydrated();
  const { still } = useMotionPrefs();
  return hydrated && still;
}
