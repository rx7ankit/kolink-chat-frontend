"use client";

import { motion } from "motion/react";

import { useSectionMotion } from "./hooks";

/**
 * Text with a pop3 highlighter swept under [start, end) — the mark an automation
 * leaves on the word it matched. The fill sits under the text; the text stays ink.
 */
export function Highlighted({
  text,
  range,
  play = true,
  delay = 0.18,
}: {
  text: string;
  range?: [number, number];
  /** When false the mark is not drawn yet (scaleX 0). It sweeps in on mount, so key it to replay. */
  play?: boolean;
  delay?: number;
}) {
  const { still, pace } = useSectionMotion();
  if (!range) return <>{text}</>;
  const [a, b] = range;
  return (
    <>
      {text.slice(0, a)}
      <span className="relative isolate inline-block">
        <motion.span
          aria-hidden
          className="absolute inset-x-[-0.12em] bottom-[0.06em] -z-10 h-[0.72em] rounded-[2px]"
          style={{ originX: 0, background: "color-mix(in oklab, var(--k-pop3) 45%, transparent)" }}
          initial={still ? false : { scaleX: 0 }}
          animate={{ scaleX: play ? 1 : 0 }}
          transition={still ? { duration: 0 } : { duration: 0.22 * pace, delay: play ? delay * pace : 0, ease: [0.22, 1, 0.36, 1] }}
        />
        {text.slice(a, b)}
      </span>
      {text.slice(b)}
    </>
  );
}
