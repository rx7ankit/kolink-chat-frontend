"use client";

import { useCallback, useSyncExternalStore } from "react";

/** matchMedia as an external store: no setState in effects, SSR returns `server`. */
export function useMedia(query: string, server = false) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => server,
  );
}

function subscribeVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}

/** False while the tab is hidden. */
export function useTabVisible() {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== "hidden",
    () => true,
  );
}

const STUDIO_TOGGLE = '[aria-controls="design-studio"]';

function subscribeStudio(cb: () => void) {
  const btn = document.querySelector(STUDIO_TOGGLE);
  if (!btn) return () => {};
  const mo = new MutationObserver(cb);
  mo.observe(btn, { attributes: true, attributeFilter: ["aria-expanded"] });
  return () => mo.disconnect();
}

/** True while the Design Studio drawer is open (read from its toggle's aria-expanded). */
export function useStudioOpen() {
  return useSyncExternalStore(
    subscribeStudio,
    () => document.querySelector(STUDIO_TOGGLE)?.getAttribute("aria-expanded") === "true",
    () => false,
  );
}
