"use client";

import type { CSSProperties, ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Roundel } from "@/components/transit/roundel";
import { Glyph } from "@/components/transit/glyph";
import { cn } from "@/lib/cn";
import type { PlatformId } from "@/lib/platforms";
import { useMotionPrefs } from "@/lib/studio/store";

import { modeLabel, modeStatus, type Mode } from "./data";

const modes: Mode[] = ["off", "menu", "agentic"];

const modeGlyph: Record<Mode, ReactNode> = {
  off: null,
  menu: <Glyph handler="automation" size={8} />,
  agentic: <Glyph handler="agent" size={8} />,
};

/**
 * The honest segmented switch: exactly one of Off / Menu / Agentic per channel.
 * Display-only (the page drives it); the thumb slides on a physical spring.
 */
export function ModeSwitch({ mode, label, className }: { mode: Mode; label: string; className?: string }) {
  const { still } = useMotionPrefs();
  const index = modes.indexOf(mode);
  return (
    <div
      role="img"
      aria-label={`${label}: ${modeLabel[mode]}`}
      className={cn("relative grid grid-cols-3 rounded-lg p-[3px] shadow-[inset_0_0_0_1px_var(--k-line-strong)]", className)}
    >
      <motion.span
        aria-hidden
        className="absolute top-[3px] bottom-[3px] left-[3px] w-[calc((100%-6px)/3)] rounded-md bg-ink"
        initial={false}
        animate={{ x: `${index * 100}%` }}
        transition={still ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 36 }}
      />
      {modes.map((m) => (
        <span
          key={m}
          aria-hidden
          className={cn(
            "relative z-10 flex h-8 min-w-0 items-center justify-center gap-1.5 px-1 text-[12px] leading-none font-medium transition-colors duration-200",
            m === mode ? "text-bg" : "text-ink-soft",
          )}
        >
          {modeGlyph[m]}
          <span className="truncate">{modeLabel[m]}</span>
        </span>
      ))}
    </div>
  );
}

/** One channel's mode card: roundel, name, honest status line and the switch. */
export function ModeCard({
  platform,
  name,
  mode,
  active = false,
  tilt = "0deg",
  className,
  children,
}: {
  platform: PlatformId;
  name: string;
  mode: Mode;
  active?: boolean;
  tilt?: string;
  className?: string;
  children?: ReactNode;
}) {
  const { still } = useMotionPrefs();
  return (
    <div
      className={cn("k-card grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 p-3 xl:grid-cols-[auto_minmax(0,1fr)_auto]", className)}
      style={{ "--k-tilt": tilt } as CSSProperties}
    >
      <Roundel platform={platform} size={34} active={active} />
      <div className="min-w-0">
        <p className="truncate text-[15px] leading-tight font-semibold">{name}</p>
        <p className="mono relative mt-1 h-[14px] overflow-hidden text-[11px] leading-[14px] text-ink-soft">
          <AnimatePresence initial={false} mode="popLayout">
            {/* Same keyframes either way (the server can't know reduced motion); still just jumps. */}
            <motion.span
              key={mode}
              className="block truncate"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "-100%" }}
              transition={{ duration: still ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {modeStatus[mode]}
            </motion.span>
          </AnimatePresence>
        </p>
      </div>
      <ModeSwitch mode={mode} label={name} className="col-span-2 xl:col-span-1 xl:w-[228px]" />
      {children}
    </div>
  );
}
