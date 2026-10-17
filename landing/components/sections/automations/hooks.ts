"use client";

import { useCallback, useSyncExternalStore } from "react";

import { useMotionPrefs, type MotionPrefs } from "@/lib/studio/store";

/** CSS media query as a hook. Server render and hydration assume `false`. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/** False while the tab is hidden, so autoplaying sequences can pause. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== "hidden",
    () => true,
  );
}

const subscribeNever = () => () => {};

/** False on the server and while React hydrates the static HTML, true afterwards. */
export function useHydrated(): boolean {
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
 * rendered with `still: false`; markup that branches on it (the comment stream, board
 * rows, end-state statuses) would then fail to hydrate. Until hydration has finished
 * this reports what the server rendered; the next render switches to the real end states.
 */
export function useSectionMotion(): MotionPrefs {
  const prefs = useMotionPrefs();
  const hydrated = useHydrated();
  return hydrated || !prefs.still ? prefs : serverPrefs;
}

/** Desktop layout breakpoint (Tailwind lg). */
export const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Wide and tall enough for a pinned scene (the stage holds the post card and all eight
 * diagram rows at lg widths). Mirrors the CSS in the pin <style>.
 */
export const PIN_QUERY = `${DESKTOP_QUERY} and (min-height: 800px)`;

/** A fill in a semantic pop tinted toward the surface, so ink text on top stays readable in every palette. */
export const popTint = (n: 1 | 2 | 3, pct = 32) => `color-mix(in oklab, var(--k-pop${n}) ${pct}%, var(--k-surface))`;

/** Thousands separators without Intl, so server and browser always render identical text. */
export const formatInt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
