"use client";

import { useCallback, type MouseEvent } from "react";
import { useLenis } from "lenis/react";

import { useMotionPrefs } from "@/lib/studio/store";

/** Where a section's top should land: just under the 64px nav, with a little air. */
const LANDING = 80;

/**
 * In-page jumps that go through Lenis (or native scrolling before it mounts).
 * Lenis already subtracts the target's scroll-margin-top, so the offset only tops
 * that up to LANDING. Focus moves to the section so keyboard users continue there.
 * Returns false when the target does not exist, so the caller can let the browser handle it.
 */
export function useJump() {
  const lenis = useLenis();
  const { still } = useMotionPrefs();

  return useCallback(
    (id: string | null) => {
      const el = id ? document.getElementById(id) : null;
      if (id && !el) return false;
      if (el) {
        const margin = Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        const offset = -Math.max(0, LANDING - margin);
        if (lenis) lenis.scrollTo(el, { offset, immediate: still, force: true });
        else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - margin + offset, behavior: still ? "auto" : "smooth" });
        if (!el.hasAttribute("tabindex")) {
          // A programmatic focus target, not a control: no 2px ring around a whole section.
          el.setAttribute("tabindex", "-1");
          el.style.outline = "none";
        }
        el.focus({ preventScroll: true });
      } else if (lenis) {
        lenis.scrollTo(0, { immediate: still, force: true });
      } else {
        window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
      }
      return true;
    },
    [lenis, still],
  );
}

/** True for an unmodified primary click (modified clicks keep their native behaviour). */
export function isPlainClick(e: MouseEvent) {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/**
 * Click handler for an in-page anchor. Stops the event before Lenis' own window-level
 * anchor listener so the jump runs exactly once with the right landing offset.
 */
export function useAnchorClick() {
  const jump = useJump();
  return useCallback(
    (e: MouseEvent<HTMLAnchorElement>, id: string | null, before?: () => void) => {
      if (!isPlainClick(e)) return;
      if (id && !document.getElementById(id)) return;
      e.preventDefault();
      e.stopPropagation();
      if (before) {
        before();
        // Let the caller's state (e.g. a closing menu that restarts Lenis) commit first.
        requestAnimationFrame(() => requestAnimationFrame(() => jump(id)));
      } else {
        jump(id);
      }
    },
    [jump],
  );
}
