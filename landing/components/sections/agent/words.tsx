"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { useMotionPrefs } from "@/lib/studio/store";

/**
 * Reply text that rises word by word through masks (24ms per word). Plays once
 * on mount when `play` is true at mount time; otherwise renders the end state.
 * Runs on WAAPI so it never re-renders React. `typo` gets a spell-check squiggle.
 */
export function Words({
  text,
  play,
  delay = 0,
  typo,
  className,
}: {
  text: string;
  play: boolean;
  /** Extra delay in ms (at pace 1) before the first word. */
  delay?: number;
  typo?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const born = useRef(0);
  const [playOnMount] = useState(play);
  const { pace, still } = useMotionPrefs();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !playOnMount || still) return;
    // Only animate right after mount (StrictMode re-runs included), never on later Studio changes.
    const now = performance.now();
    if (!born.current) born.current = now;
    if (now - born.current > 250) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>("[data-w]"));
    const anims = words.map((w, i) =>
      w.animate([{ transform: "translateY(135%)" }, { transform: "translateY(0%)" }], {
        duration: 420 * pace,
        delay: (delay + i * 24) * pace,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "backwards",
      }),
    );
    return () => anims.forEach((a) => a.cancel());
  }, [playOnMount, still, pace, delay]);

  const words = text.split(" ");
  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => {
        const bare = word.replace(/[^\p{L}\p{N}]/gu, "");
        const isTypo = !!typo && bare === typo;
        return (
          <span key={i}>
            {/* The typo's mask reaches a little lower so the wavy underline is never clipped. */}
            {/* max-w + overflow-wrap: a long unbroken string typed into the playground still wraps. */}
            <span className={cn("inline-block max-w-full overflow-hidden align-top", isTypo && "-mb-[0.3em] pb-[0.3em]")}>
              <span
                data-w
                className={cn(
                  "inline-block max-w-full [overflow-wrap:anywhere]",
                  isTypo && "underline decoration-wavy decoration-[1.5px] underline-offset-[3px]",
                )}
                style={isTypo ? { textDecorationColor: "var(--k-pop1-deep)" } : undefined}
              >
                {word}
              </span>
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        );
      })}
    </span>
  );
}
