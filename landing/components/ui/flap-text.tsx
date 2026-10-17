"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";
import { useMotionPrefs } from "@/lib/studio/store";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·→";

/**
 * Split-flap text for statuses and station labels. When `text` changes, each
 * character flips through one or two glyphs before landing (WAAPI, no React state
 * per frame). The cells are drawn with CSS; screen readers, copy-paste and find-in-page get the plain sr-only copy.
 */
export function FlapText({ text, className, stagger = 15 }: { text: string; className?: string; stagger?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(text);
  const { still } = useMotionPrefs();

  useEffect(() => {
    const el = ref.current;
    if (!el || prev.current === text) return;
    prev.current = text;
    if (still) return;
    const cells = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-cell]"));
    const timers: number[] = [];
    cells.forEach((cell, i) => {
      const final = cell.dataset.cell ?? "";
      if (final === " ") return;
      const flips = 1 + (i % 2);
      for (let f = 0; f < flips; f++) {
        timers.push(
          window.setTimeout(() => {
            cell.dataset.glyph = GLYPHS[(i * 7 + f * 13 + text.length) % GLYPHS.length];
          }, i * stagger + f * 45),
        );
      }
      timers.push(
        window.setTimeout(() => {
          cell.dataset.glyph = final;
        }, i * stagger + flips * 45),
      );
      cell.animate(
        [
          { transform: "perspective(400px) rotateX(-90deg)", opacity: 0.4 },
          { transform: "perspective(400px) rotateX(0deg)", opacity: 1 },
        ],
        { duration: 180, delay: i * stagger, easing: "cubic-bezier(0.22,1,0.36,1)", fill: "backwards" },
      );
    });
    return () => {
      timers.forEach(clearTimeout);
      // Never leave a cell parked on an intermediate glyph if the effect is torn down mid-flip.
      cells.forEach((cell) => (cell.dataset.glyph = cell.dataset.cell ?? ""));
    };
  }, [text, still, stagger]);

  return (
    <span className={cn("mono inline-flex whitespace-pre tabular-nums", className)}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden className="inline-flex">
        {Array.from(text).map((ch, i) => (
          // Glyphs are drawn by CSS (.k-flap-cell::before) so copy-paste reads the sr-only text, not "S T A T U S".
          <span key={`${i}-${ch}`} data-cell={ch} data-glyph={ch} className="k-flap-cell inline-block" />
        ))}
      </span>
    </span>
  );
}
