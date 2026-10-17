"use client";

import { useCallback, useSyncExternalStore } from "react";

import { useMotionPrefs, type MotionPrefs } from "@/lib/studio/store";

const noSubscribe = () => () => {};

/** False on the server and during hydration, true afterwards (and for anything mounted later). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

/** What the server renders with: defaultLook ("lively") and no OS reduced-motion signal. */
const SERVER_PREFS: MotionPrefs = { amp: 1, pace: 1, still: false };

/**
 * useMotionPrefs, made hydration-safe. motion's useReducedMotion reads matchMedia on the
 * client's first render, so markup that depends on `still` (vignette end states, carets,
 * filtered rows) would differ from the server HTML for reduced-motion visitors and force
 * React to throw away the hydrated tree. This returns the server's prefs until hydration
 * has finished, then the live ones; components re-render straight into their end states.
 */
export function useSafeMotionPrefs(): MotionPrefs {
  const prefs = useMotionPrefs();
  return useHydrated() ? prefs : SERVER_PREFS;
}

/** matchMedia as an external store: false on the server and during hydration, live afterwards. */
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

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export class Aborted extends Error {
  constructor() {
    super("aborted");
    this.name = "AbortError";
  }
}

/**
 * setTimeout that respects an AbortSignal and stands still while the tab is hidden,
 * so scripted beats never run (or pile up) behind the visitor's back.
 */
export function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new Aborted());
      return;
    }
    let remaining = Math.max(0, ms);
    let startedAt = 0;
    let timer: number | undefined;

    const cleanup = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      signal.removeEventListener("abort", onAbort);
    };
    const finish = () => {
      cleanup();
      resolve();
    };
    const start = () => {
      startedAt = performance.now();
      timer = window.setTimeout(finish, remaining);
    };
    const onVisibility = () => {
      if (document.hidden) {
        if (timer !== undefined) {
          window.clearTimeout(timer);
          timer = undefined;
          remaining = Math.max(0, remaining - (performance.now() - startedAt));
        }
      } else if (timer === undefined) {
        start();
      }
    };
    const onAbort = () => {
      cleanup();
      reject(new Aborted());
    };

    document.addEventListener("visibilitychange", onVisibility);
    signal.addEventListener("abort", onAbort);
    if (!document.hidden) start();
  });
}
