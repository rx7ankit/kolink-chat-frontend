"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { contactAvatarUrl } from "@/components/inbox/contact-avatar";
import { messagePreview } from "@/components/inbox/message-content";
import { isPromoEmail, type InboxThread } from "@/lib/api/inbox";
import {
  inboxNotificationsEnabled,
  showInboxBrowserNotification,
  type InboxNotificationPayload,
} from "@/lib/notifications/inbox";

type ThreadSnap = { unread: number; preview: string; updatedAt: string };

function snapshot(threads: InboxThread[]): Map<string, ThreadSnap> {
  return new Map(
    threads.map((thread) => [
      thread.id,
      { unread: thread.unread, preview: thread.preview, updatedAt: thread.updatedAt },
    ]),
  );
}

function isInboundChange(prev: ThreadSnap | undefined, thread: InboxThread) {
  if (!prev) return thread.unread > 0;
  if (thread.unread > prev.unread) return true;
  if (thread.unread > 0 && thread.preview !== prev.preview && thread.updatedAt !== prev.updatedAt) {
    return true;
  }
  return false;
}

function shouldAlert(threadId: string, activeId: string | null) {
  const focused = typeof document !== "undefined" && document.visibilityState === "visible";
  if (focused && activeId === threadId) return false;
  return true;
}

export function useInboxNotifications(
  threads: InboxThread[],
  activeId: string | null,
  onOpenThread?: (threadId: string) => void,
  enabled = true,
) {
  const readyRef = useRef(false);
  const prevRef = useRef<Map<string, ThreadSnap>>(new Map());

  useEffect(() => {
    if (!enabled || threads.length === 0) return;

    if (!readyRef.current) {
      prevRef.current = snapshot(threads);
      readyRef.current = true;
      return;
    }

    for (const thread of threads) {
      const prev = prevRef.current.get(thread.id);
      if (!isInboundChange(prev, thread)) continue;
      if (isPromoEmail(thread)) continue;
      if (!shouldAlert(thread.id, activeId)) continue;

      const preview = messagePreview({ text: thread.preview, contentType: thread.preview });
      const payload: InboxNotificationPayload = {
        threadId: thread.id,
        contactName: thread.contact.name,
        preview,
        channel: thread.channel,
        avatarUrl: contactAvatarUrl(thread.contact),
      };

      const open = () => onOpenThread?.(thread.id);
      const tabVisible = typeof document !== "undefined" && document.visibilityState === "visible";

      if (inboxNotificationsEnabled() && (!tabVisible || activeId !== thread.id)) {
        showInboxBrowserNotification(payload, open);
      }

      if (tabVisible) {
        toast(payload.contactName, {
          description: preview,
          action: onOpenThread
            ? {
                label: "Open",
                onClick: open,
              }
            : undefined,
        });
      }
    }

    prevRef.current = snapshot(threads);
  }, [threads, activeId, onOpenThread, enabled]);
}
