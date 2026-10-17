"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Glyph } from "@/components/transit/glyph";
import { cn } from "@/lib/cn";
import { useSafeMotionPrefs } from "./hooks";

import { teamName, type TeamId, type Thread } from "./data";

/** A teammate: the legend's rounded square (team = ink), with their initial. */
export function Avatar({
  id,
  size = 22,
  className,
  measure = false,
}: {
  id: TeamId;
  size?: number;
  className?: string;
  /** Marks the rail avatar the §06 script measures as its packet origin. */
  measure?: boolean;
}) {
  return (
    <span
      data-avatar={measure ? id : undefined}
      className={cn("mono inline-grid shrink-0 place-items-center rounded-[30%] bg-ink leading-none font-semibold text-bg", className)}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.5)) }}
      aria-hidden
    >
      {id}
    </span>
  );
}

type BadgeKind = { key: string; node: ReactNode; label: string };

function badgeFor(t: Thread): BadgeKind {
  if (t.assignee) {
    return {
      key: `as-${t.assignee}-${t.attention ? 1 : 0}`,
      label: `Assigned to ${teamName(t.assignee)}${t.attention ? ", needs attention" : ""}`,
      node: (
        <>
          {t.attention && <Glyph handler="attention" size={10} />}
          <Avatar id={t.assignee} size={20} />
        </>
      ),
    };
  }
  if (t.attention) {
    return {
      key: "attention",
      label: "Needs attention",
      node: (
        <>
          <Glyph handler="attention" size={10} />
          <span>Needs attention</span>
        </>
      ),
    };
  }
  if (t.bot === "on") {
    return {
      key: "agent",
      label: "Agent",
      node: (
        <>
          <Glyph handler="agent" size={10} />
          <span>Agent</span>
        </>
      ),
    };
  }
  return {
    key: "unassigned",
    label: "Unassigned",
    node: (
      <>
        <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden className="shrink-0">
          <rect x="1" y="1" width="9" height="9" rx="2.5" fill="none" stroke="var(--k-line-strong)" strokeWidth="1.5" strokeDasharray="2.5 2" />
        </svg>
        <span className="text-ink-soft">Unassigned</span>
      </>
    ),
  };
}

/** Handler badge in the row: Agent / Needs attention / Unassigned / avatar. It flips when the handler changes. */
export function HandlerBadge({ thread, className }: { thread: Thread; className?: string }) {
  const { still, pace } = useSafeMotionPrefs();
  const b = badgeFor(thread);
  return (
    <span
      data-badge={thread.id}
      className={cn("mono relative inline-flex h-5 items-center text-[11px] tracking-[0.02em] uppercase", className)}
      style={{ perspective: 300 }}
    >
      <span className="sr-only">{b.label}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={b.key}
          aria-hidden
          className="inline-flex items-center gap-1.5 whitespace-nowrap"
          initial={still ? { opacity: 0, rotateX: 0 } : { rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={still ? { opacity: 0 } : { rotateX: 90, opacity: 0 }}
          transition={still ? { duration: 0.15, rotateX: { duration: 0 } } : { duration: 0.22 * pace, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "50% 50%" }}
        >
          {b.node}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
