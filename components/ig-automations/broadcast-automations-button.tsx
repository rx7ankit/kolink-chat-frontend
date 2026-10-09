"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquareReply, Send, Trash2, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  KIND_DESCRIPTIONS,
  KIND_LABELS,
  existingAutomationHref,
  isAutomationPlatform,
  kindsFor,
  newAutomationHref,
  platformLabel,
  type AutomationKind,
} from "@/lib/comment-automations";
import type { Broadcast } from "@/lib/mock";

const ICONS: Record<AutomationKind, typeof Send> = {
  keyword_dm: Send,
  keyword_reply: MessageSquareReply,
  keyword_delete: Trash2,
};

export function BroadcastAutomationsButton({ item }: { item: Broadcast }) {
  const [open, setOpen] = useState(false);
  const platformRaw = (item.platforms[0] || item.channel || "").toLowerCase();
  const platform = isAutomationPlatform(platformRaw) ? platformRaw : null;
  const mediaId = platform ? item.platformStatuses?.[platform]?.external_id || null : null;
  const kinds = platform ? kindsFor(platform) : [];
  const existing = useMemo(() => {
    const map: Record<string, string> = {};
    for (const ref of item.commentAutomations || []) {
      if (platform && ref.platform === platform) map[ref.kind] = ref.id;
    }
    return map;
  }, [item.commentAutomations, platform]);

  if (!platform) {
    return (
      <Button variant="outline" asChild>
        <Link href="/automations?create=1">
          <Workflow className="mr-1 h-4 w-4" />
          Automations
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Workflow className="mr-1 h-4 w-4" />
        Automations
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{platformLabel(platform)} automations</DialogTitle>
            <DialogDescription>
              Choose a type. If this post already has that automation, it opens; otherwise setup starts on keywords.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {kinds.map((kind) => {
              const Icon = ICONS[kind];
              const existingId = existing[kind];
              const href = existingId
                ? existingAutomationHref(existingId)
                : newAutomationHref({
                    platform,
                    kind,
                    media: mediaId,
                    fromBroadcast: Boolean(mediaId),
                  });
              return (
                <Link
                  key={kind}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 rounded-2xl border bg-white/70 p-4 transition hover:bg-white"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{KIND_LABELS[kind]}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{KIND_DESCRIPTIONS[kind]}</span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-primary">{existingId ? "Open" : "Set up"}</span>
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
