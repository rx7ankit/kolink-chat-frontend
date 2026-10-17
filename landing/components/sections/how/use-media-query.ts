"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a media query without setting state in an effect.
 * The server snapshot (and therefore the first client render) uses `serverValue`.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
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
    () => serverValue,
  );
}

/** Desktop with a precise pointer: the only place kinetic width and hover flourishes run. */
export const FINE_DESKTOP = "(pointer: fine) and (min-width: 1024px)";
export const FINE_POINTER = "(hover: hover) and (pointer: fine)";
