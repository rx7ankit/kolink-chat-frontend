"use client";

import { useSyncExternalStore } from "react";

import { useMotionPrefs, type MotionPrefs } from "@/lib/studio/store";

const subscribeNever = () => () => {};

/** False while React hydrates the static HTML, true from then on (and on client-only mounts). */
export function useHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

const serverPrefs: MotionPrefs = { amp: 1, pace: 1, still: false };

/**
 * useMotionPrefs(), hydration-safe. motion's useReducedMotion reads matchMedia during the
 * first client render, so `still` can be true on the client while the static HTML was
 * rendered with `still: false`. Markup that depends on `still` (counter text, initial
 * clip/translate styles) would then mismatch. Until hydration has finished we report what
 * the server rendered; the very next render switches to the real end states.
 */
export function useLinesMotion(): MotionPrefs {
  const prefs = useMotionPrefs();
  const hydrated = useHydrated();
  return hydrated || !prefs.still ? prefs : serverPrefs;
}
