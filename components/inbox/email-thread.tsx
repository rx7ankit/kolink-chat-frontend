"use client";

import { Mail, Megaphone, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { ContactAvatar } from "@/components/inbox/contact-avatar";
import { MessageContent } from "@/components/inbox/message-content";
import { Button } from "@/components/ui/button";
import { isPromoEmail } from "@/lib/api/inbox";
import type { ChatMessage } from "@/lib/mock";
import { cn, formatClock } from "@/lib/utils";

function canEditMessage(message: ChatMessage) {
  if (message.from !== "agent") return false;
  if (message.id.startsWith("local-")) return false;
  const status = (message.deliveryStatus || message.status || "").toLowerCase();
  return status === "local" || status === "failed";
}

export function EmailThread({
  subject,
  contact,
  messages,
  category,
  onDeleteMessage,
  onDeleteThread,
  onMove,
  onEdit,
}: {
  subject?: string;
  contact: { name: string; email?: string; handle?: string; avatarUrl?: string; fields: Record<string, string> };
  messages: ChatMessage[];
  category?: string;
  onDeleteMessage: (message: ChatMessage) => void;
  onDeleteThread: () => void;
  onMove: (category: "primary" | "promotions") => void;
  onEdit: (message: ChatMessage, body: string) => Promise<void> | void;
}) {
  const fromLine = contact.handle || contact.email || "";
  const promo = isPromoEmail({ gmailCategory: category, contact });

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-x-hidden bg-white">
      <div className="shrink-0 border-b border-slate-200 px-3 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 break-words sm:text-xl">
              {subject || "(no subject)"}
            </h1>
            <p className="mt-1 truncate text-sm text-slate-500">{fromLine}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            {promo ? (
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => onMove("primary")}>
                <Mail className="h-3.5 w-3.5" />
                Primary
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => onMove("promotions")}>
                <Megaphone className="h-3.5 w-3.5" />
                Promotions
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onDeleteThread}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        {messages.map((message, index) => (
          <EmailMessageCard
            key={message.id}
            message={message}
            contact={contact}
            showSubject={index === 0 ? undefined : message.subject}
            onDelete={() => onDeleteMessage(message)}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

function EmailMessageCard({
  message,
  contact,
  showSubject,
  onDelete,
  onEdit,
}: {
  message: ChatMessage;
  contact: { name: string; avatarUrl?: string; fields: Record<string, string> };
  showSubject?: string;
  onDelete: () => void;
  onEdit: (message: ChatMessage, body: string) => Promise<void> | void;
}) {
  const mine = message.from !== "contact";
  const editable = canEditMessage(message);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    const next = editText.trim();
    if (!next) return;
    setSaving(true);
    try {
      await onEdit(message, next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={cn("min-w-0 overflow-x-hidden border-b border-slate-100 px-3 py-5 sm:px-6", mine && "bg-slate-50/80")}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ContactAvatar contact={contact} className="h-9 w-9 shrink-0" fallbackClassName="text-xs" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{mine ? "You" : contact.name}</p>
            <p className="text-xs text-slate-500">{formatClock(message.at)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {editable ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500"
              aria-label="Edit"
              onClick={() => {
                setEditText(message.text);
                setEditing(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-red-600"
            aria-label="Delete email"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {showSubject ? <p className="mb-3 text-sm font-medium text-slate-800">{showSubject}</p> : null}
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
            className="h-28 w-full rounded-lg border border-slate-200 p-3 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={saving} onClick={() => void saveEdit()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden">
          <MessageContent message={message} isEmail={!mine} />
        </div>
      )}
      {mine && message.status === "failed" ? <p className="mt-2 text-xs text-red-600">Not sent</p> : null}
    </article>
  );
}
