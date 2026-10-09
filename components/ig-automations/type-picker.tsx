"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquareReply, Send, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getIgMedia } from "@/lib/api/ig-automations";
import {
  KIND_DESCRIPTIONS,
  KIND_LABELS,
  existingAutomationHref,
  kindsFor,
  newAutomationHref,
  platformLabel,
  type AutomationKind,
  type AutomationPlatform,
} from "@/lib/comment-automations";

const ICONS: Record<AutomationKind, typeof Send> = {
  keyword_dm: Send,
  keyword_reply: MessageSquareReply,
  keyword_delete: Trash2,
};

export function AutomationTypePicker({
  platform,
  mediaId,
  fromBroadcast,
}: {
  platform: AutomationPlatform;
  mediaId?: string | null;
  fromBroadcast?: boolean;
}) {
  const kinds = kindsFor(platform);
  const [existing, setExisting] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!mediaId) return;
    void getIgMedia(mediaId, { platform })
      .then((item) => setExisting(item.automation_ids || {}))
      .catch(() => setExisting({}));
  }, [mediaId, platform]);

  return (
    <div className="page-shell max-w-4xl">
      <PageHeader
        title={`${platformLabel(platform)} automations`}
        description="Pick what should happen when a comment matches your trigger words."
        actions={
          <Button variant="outline" asChild>
            <Link href="/automations">Cancel</Link>
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {kinds.map((kind) => {
          const Icon = ICONS[kind];
          const existingId = existing[kind];
          const href = existingId
            ? existingAutomationHref(existingId)
            : newAutomationHref({ platform, kind, media: mediaId, fromBroadcast });
          return (
            <Link
              key={kind}
              href={href}
              className="glass flex flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-semibold">{KIND_LABELS[kind]}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{KIND_DESCRIPTIONS[kind]}</p>
              <span className="mt-4 text-sm font-medium text-primary">{existingId ? "Open" : "Set up"}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
