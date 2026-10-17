"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";

import { useMotionScale } from "@/lib/studio/store";

/**
 * Counts up to `to` the first time it scrolls into view. With motion on, the number
 * rests at `from` until seen; under reduced motion / Studio "Still" it shows `to`.
 */
export function Counter({
  to,
  from = 0,
  duration = 1.6,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const scale = useMotionScale();
  const [tween, setTween] = useState<number | null>(null);

  useEffect(() => {
    if (!inView || !scale) return;
    const controls = animate(from, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setTween,
    });
    return () => controls.stop();
  }, [inView, scale, from, to, duration]);

  const value = tween ?? (scale && !inView ? from : to);
  const text = value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
