"use client";

import { useSyncExternalStore } from "react";

/**
 * The caption currently in the composer (typewriter or the visitor's own draft), shared with
 * the focus pane's draft preview. A tiny external store, so per-character updates re-render
 * only the preview caption, never the board, rows or routes.
 */
let text = "";
const subs = new Set<() => void>();

export const draftStore = {
  get: () => text,
  set(next: string) {
    if (next === text) return;
    text = next;
    subs.forEach((cb) => cb());
  },
  subscribe(cb: () => void) {
    subs.add(cb);
    return () => {
      subs.delete(cb);
    };
  },
};

const serverSnapshot = () => "";

export function useDraftText() {
  return useSyncExternalStore(draftStore.subscribe, draftStore.get, serverSnapshot);
}
