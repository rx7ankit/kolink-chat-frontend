"use client";

import { Fragment, type ElementType, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";

import { cn } from "@/lib/cn";
import { useMotionScale } from "@/lib/studio/store";

export const ease = {
  /** Long, soft landing — the house curve for reveals. */
  out: [0.22, 1, 0.36, 1] as const,
  /** Snappy in/out for UI state changes. */
  inOut: [0.65, 0, 0.35, 1] as const,
};

type RevealProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children: ReactNode;
  delay?: number;
  /** Travel distance in px before the Studio motion multiplier. */
  y?: number;
  once?: boolean;
};

/** Fade + rise on first view. Collapses to a plain fade when motion is reduced. */
export function Reveal({ children, delay = 0, y = 28, once = true, className, ...rest }: RevealProps) {
  const scale = useMotionScale();
  return (
    <motion.div
      initial={{ opacity: 0, y: y * scale }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "0px 0px -12% 0px" }}
      transition={{ duration: scale ? 0.9 : 0.3, delay: scale ? delay : 0, ease: ease.out }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type LinesProps = {
  /** Each entry is one visual line; nodes allow <em> or accent spans inside a line. */
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  /** Animate immediately on mount instead of on scroll into view (hero). */
  immediate?: boolean;
  /** Plain-text label for assistive tech when lines contain markup. */
  label?: string;
};

/** Editorial masked line reveal: each line slides up from behind its own clip. */
export function RevealLines({
  lines,
  as: Tag = "h2",
  className,
  lineClassName,
  delay = 0,
  stagger = 0.08,
  immediate = false,
  label,
}: LinesProps) {
  const scale = useMotionScale();
  const animate = { y: "0%", opacity: 1 };
  return (
    <Tag className={className} aria-label={label}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]" aria-hidden={label ? true : undefined}>
            <motion.span
              className={cn("block will-change-transform", lineClassName)}
              initial={{ y: scale ? "105%" : "0%", opacity: scale ? 1 : 0 }}
              {...(immediate
                ? { animate }
                : { whileInView: animate, viewport: { once: true, margin: "0px 0px -10% 0px" } })}
              transition={{ duration: scale ? 1.05 : 0.3, delay: delay + i * stagger, ease: ease.out }}
            >
              {line}
            </motion.span>
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}
