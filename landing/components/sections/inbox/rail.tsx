"use client";

import type { ReactNode } from "react";
import { Inbox as InboxIcon, Mail, MessagesSquare } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { Glyph } from "@/components/transit/glyph";
import { Odometer } from "@/components/ui/odometer";
import { cn } from "@/lib/cn";

import { Avatar } from "./badge";
import { team } from "./data";
import type { View } from "./state";

type Counts = { attention: number; unassigned: number; mine: number; primary: number; promotions: number };

function Group({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="eyebrow px-2 text-[11px]">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function RailButton({
  active,
  onClick,
  children,
  count,
  tab,
}: {
  /** Marks a Gmail tab the §06 script measures as the promo email's destination. */
  tab?: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      data-tab={tab}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-[30px] w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--k-accent-text)]",
        active ? "bg-bg font-semibold text-ink" : "text-ink hover:bg-bg/70",
      )}
    >
      {children}
      {count !== undefined && <Odometer value={count} className="ml-auto text-[11px] text-ink-soft" />}
    </button>
  );
}

const hollow = (
  <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden className="shrink-0">
    <rect x="1" y="1" width="9" height="9" rx="2.5" fill="none" stroke="var(--k-line-strong)" strokeWidth="1.5" strokeDasharray="2.5 2" />
  </svg>
);

/** Left rail: folders with live counts, Gmail tabs and the team (labels live on the rows). */
export function Rail({
  view,
  counts,
  onView,
  className,
}: {
  view: View;
  counts: Counts;
  onView: (v: View) => void;
  className?: string;
}) {
  return (
    // A group, not <nav>: the demo's folders are not site navigation and stay out of the landmark list.
    <div data-rail role="group" aria-label="Inbox folders" className={cn("min-w-0 flex-col gap-4 overflow-hidden rounded-xl border border-line bg-surface p-3", className)}>
      <div className="flex items-center gap-2 px-2 pt-1">
        <LogoMark className="h-3.5" />
        <span className="text-[14px] font-semibold">Inbox</span>
        <span className="mono ml-auto text-[11px] tracking-[0.06em] text-ink-soft uppercase">Demo</span>
      </div>

      <Group title="Folders">
        <RailButton active={view === "all"} onClick={() => onView("all")}>
          <InboxIcon size={13} strokeWidth={1.75} aria-hidden className="shrink-0" />
          All chats
        </RailButton>
        <RailButton active={view === "comments"} onClick={() => onView("comments")}>
          <MessagesSquare size={13} strokeWidth={1.75} aria-hidden className="shrink-0" />
          Comments
        </RailButton>
        <RailButton active={view === "attention"} onClick={() => onView("attention")} count={counts.attention}>
          <Glyph handler="attention" size={10} />
          Needs attention
        </RailButton>
        <RailButton active={view === "unassigned"} onClick={() => onView("unassigned")} count={counts.unassigned}>
          {hollow}
          Unassigned
        </RailButton>
        <RailButton active={view === "mine"} onClick={() => onView("mine")} count={counts.mine}>
          <Glyph handler="team" size={10} />
          Assigned to me
        </RailButton>
      </Group>

      <Group title="Gmail tabs">
        {(
          [
            ["primary", "Primary", counts.primary],
            ["promotions", "Promotions", counts.promotions],
          ] as const
        ).map(([id, label, n]) => (
          <RailButton key={id} tab={id} active={view === id} onClick={() => onView(id)} count={n}>
            <Mail size={13} strokeWidth={1.75} aria-hidden className="shrink-0" />
            {label}
          </RailButton>
        ))}
      </Group>

      {/* Follows the tabs directly: the rail's spare height falls below the team, not above it. */}
      <Group title="Team">
        {/* Avatars sit on the right, past a dotted leader: the §06 script's assignee track leaves
            from the avatar straight into the rail's margin without running through a name. */}
        <ul className="space-y-1.5 px-2">
          {team.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-[12.5px]">
              <span className="shrink-0">
                {m.name}
                {m.you && <span className="text-ink-soft"> (you)</span>}
              </span>
              <span aria-hidden className="h-0 min-w-3 flex-1 translate-y-[3px] border-b border-dotted border-line-strong" />
              <Avatar id={m.id} size={22} measure={m.id === "A"} />
            </li>
          ))}
        </ul>
      </Group>
    </div>
  );
}
