"use client";

import { useSyncExternalStore } from "react";

import {
  accentOverride,
  decodeLook,
  defaultLook,
  encodeLook,
  lookAttributes,
  sanitizeLook,
  STORAGE_KEY,
  URL_PARAM,
} from "./look";
import type { Look, MotionLevel } from "./types";

type Listener = () => void;

let current: Look | null = null;
const listeners = new Set<Listener>();

function readInitial(): Look {
  try {
    const shared = decodeLook(new URLSearchParams(window.location.search).get(URL_PARAM));
    if (shared) return shared;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return sanitizeLook(JSON.parse(saved));
  } catch {
    // Private mode or malformed JSON: fall through to defaults.
  }
  return defaultLook;
}

function apply(look: Look) {
  const html = document.documentElement;
  for (const [name, value] of Object.entries(lookAttributes(look))) html.setAttribute(name, value);
  const override = accentOverride(look);
  if (override) {
    html.style.setProperty("--k-accent", override.accent);
    html.style.setProperty("--k-accent-ink", override.accentInk);
    html.style.setProperty("--k-accent-text", override.accentText);
    html.style.setProperty("--k-accent-edge", override.accentEdge);
  } else {
    html.style.removeProperty("--k-accent");
    html.style.removeProperty("--k-accent-ink");
    html.style.removeProperty("--k-accent-text");
    html.style.removeProperty("--k-accent-edge");
  }
}

function getLook(): Look {
  if (current === null) current = readInitial();
  return current;
}

export function setLook(patch: Partial<Look>) {
  current = sanitizeLook({ ...getLook(), ...patch });
  apply(current);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Storage can be blocked; the look still applies for this visit.
  }
  listeners.forEach((l) => l());
}

export function resetLook() {
  setLook(defaultLook);
}

export function shareUrl(look: Look) {
  const url = new URL(window.location.href);
  url.searchParams.set(URL_PARAM, encodeLook(look));
  url.hash = "";
  return url.toString();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Server and first client render share defaults; the boot script already painted the real look. */
export function useLook(): Look {
  return useSyncExternalStore(subscribe, getLook, () => defaultLook);
}

/** Parallax / flourish amplitude per Studio motion level. */
const amplitude: Record<MotionLevel, number> = { still: 0, calm: 0.5, lively: 1, bold: 1.4 };
/** Duration multiplier per Studio motion level (calm is slower, bold is snappier). */
const pace: Record<MotionLevel, number> = { still: 0, calm: 1.3, lively: 1, bold: 0.85 };

export type MotionPrefs = {
  /** Multiply parallax distances and flourish sizes by this. 0 = do not move. */
  amp: number;
  /** Multiply durations by this. 0 = jump to end states (150ms crossfades at most). */
  pace: number;
  /** True for OS reduced motion or Studio "Still". */
  still: boolean;
};

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(listener: Listener) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
}

/**
 * OS reduced-motion preference, hydration-safe: the server and the hydration render
 * both see `false`, then React re-renders with the real value. (motion's
 * useReducedMotion reads matchMedia during the first client render, which mismatches.)
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

export function useMotionPrefs(): MotionPrefs {
  const look = useLook();
  const reduced = usePrefersReducedMotion();
  if (reduced || look.motion === "still") return { amp: 0, pace: 0, still: true };
  return { amp: amplitude[look.motion], pace: pace[look.motion], still: false };
}

/**
 * Multiplier for parallax distances and flourish amplitudes.
 * 0 when motion is reduced (OS setting or Studio "Still"), so callers can skip work entirely.
 */
export function useMotionScale(): number {
  return useMotionPrefs().amp;
}
