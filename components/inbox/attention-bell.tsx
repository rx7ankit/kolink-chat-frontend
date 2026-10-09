"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAttentionSummary, listAttentionThreads, type InboxAttentionSummary } from "@/lib/api/inbox-bot";
import { toInboxThread, type ApiConversation } from "@/lib/api/inbox";
import type { TeamMember } from "@/lib/api/team";
import { cn, formatRelativeTime } from "@/lib/utils";

export function AttentionBell({
  currentUserId,
  members,
  onOpenThread,
}: {
  currentUserId?: string;
  members: TeamMember[];
  onOpenThread: (id: string, channel?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<InboxAttentionSummary>({ instagram: 0, messenger: 0, total: 0 });
  const [items, setItems] = useState<ApiConversation[]>([]);

  async function reload() {
    try {
      const [nextSummary, page] = await Promise.all([getAttentionSummary(), listAttentionThreads()]);
      setSummary(nextSummary);
      setItems(page.items);
    } catch {
      /* keep last */
    }
  }

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), 20_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative h-9 w-9 shrink-0"
        aria-label="Needs attention"
        onClick={() => {
          setOpen((value) => !value);
          void reload();
        }}
      >
        <Bell className="h-4 w-4" />
        {summary.total > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {summary.total > 9 ? "9+" : summary.total}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-white/50 bg-white/95 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="text-sm font-medium">Needs attention</p>
            <p className="text-[11px] text-muted-foreground">
              IG {summary.instagram} · Messenger {summary.messenger}
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground">No threads waiting on a human.</p>
            ) : (
              items.map((row) => {
                const thread = toInboxThread(row, currentUserId, members);
                return (
                  <button
                    key={row.id}
                    type="button"
                    className="flex w-full flex-col gap-0.5 border-b px-3 py-2.5 text-left hover:bg-slate-50"
                    onClick={() => {
                      setOpen(false);
                      onOpenThread(row.id, row.channel);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{thread.contact.name}</span>
                      <span className="text-[11px] text-muted-foreground">{formatRelativeTime(thread.updatedAt)}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{row.attention_note || thread.preview}</p>
                    <span className={cn("text-[10px] font-medium uppercase tracking-wide text-red-600")}>
                      {row.channel} · {row.bot_owner === "human" ? "Human" : "Needs attention"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
