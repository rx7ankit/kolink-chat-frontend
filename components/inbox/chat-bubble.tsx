"use client";

import { useState } from "react";
import { Copy, Download, EyeOff, MoreHorizontal, Pencil, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { MessageContent, inferMediaKind } from "@/components/inbox/message-content";
import { ContactAvatar } from "@/components/inbox/contact-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatMessage } from "@/lib/mock";
import { cn } from "@/lib/utils";

function isEmojiOnly(text: string) {
  const value = text.trim();
  if (!value || value.length > 8) return false;
  return /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\ufe0f]+$/u.test(value);
}

function canEditMessage(message: ChatMessage) {
  if (message.from !== "agent") return false;
  if (message.id.startsWith("local-")) return false;
  const status = (message.deliveryStatus || message.status || "").toLowerCase();
  return status === "local" || status === "failed";
}

export function ChatBubble({
  message,
  contact,
  isComment,
  isEmail,
  showAvatar,
  allowReply,
  onReply,
  onDelete,
  onHide,
  onEdit,
}: {
  message: ChatMessage;
  contact: { name: string; avatarUrl?: string; fields: Record<string, string> };
  isComment: boolean;
  isEmail?: boolean;
  showAvatar: boolean;
  allowReply?: boolean;
  onReply: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onHide?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage, body: string) => Promise<void> | void;
}) {
  const mine = message.from !== "contact";
  const kind = inferMediaKind(message.contentType, message.mediaUrl);
  const emoji = !message.mediaUrl && isEmojiOnly(message.text);
  const failed = message.status === "failed";
  const editable = Boolean(onEdit) && canEditMessage(message);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [saving, setSaving] = useState(false);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(message.text || message.mediaUrl || "");
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  async function saveEdit() {
    if (!onEdit) return;
    const next = editText.trim();
    if (!next) {
      toast.error("Message text is required");
      return;
    }
    setSaving(true);
    try {
      await onEdit(message, next);
      setEditing(false);
    } catch {
      /* parent toasts */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("group flex items-end gap-2", mine ? "flex-row-reverse" : "flex-row")}>
      <div className="h-7 w-7 shrink-0">
        {showAvatar && !mine ? (
          <ContactAvatar contact={contact} className="h-7 w-7" fallbackClassName="text-[10px]" />
        ) : null}
      </div>
      <div className={cn("flex items-end gap-1", isEmail && !mine ? "max-w-[min(40rem,92%)]" : "max-w-[78%]", mine && "flex-row-reverse")}>
        <div
          className={cn(
            emoji
              ? "bg-transparent px-0 py-0 text-5xl leading-none shadow-none"
              : kind !== "text" && message.mediaUrl
                ? "overflow-hidden rounded-[1.35rem] bg-transparent p-0"
                : "rounded-[1.35rem] px-3.5 py-2.5 text-[15px] leading-snug shadow-[0_1px_2px_rgba(15,23,42,0.06)]",
            !emoji && message.from === "contact" && "bg-white text-foreground",
            !emoji && message.from === "agent" && "bg-[#007AFF] text-white",
            !emoji && message.from === "bot" && "bg-slate-100 text-slate-700",
            isEmail && !mine && !emoji && "min-w-[16rem]",
            failed && "ring-1 ring-red-400",
          )}
        >
          {editing ? (
            <div className="min-w-[16rem] space-y-2">
              <textarea
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                className="h-24 w-full rounded-xl border border-white/50 bg-white/90 p-2 text-sm text-slate-900"
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
            <MessageContent message={message} isEmail={isEmail && message.from === "contact"} />
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="mb-1 rounded-full p-1 text-muted-foreground opacity-0 transition hover:bg-white/70 group-hover:opacity-100"
              aria-label="Message actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={mine ? "end" : "start"}>
            {allowReply ? (
              <DropdownMenuItem onClick={() => onReply(message)}>
                <Reply className="mr-2 h-4 w-4" /> Reply
              </DropdownMenuItem>
            ) : null}
            {editable ? (
              <DropdownMenuItem
                onClick={() => {
                  setEditText(message.text);
                  setEditing(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => void copyText()}>
              <Copy className="mr-2 h-4 w-4" /> Copy
            </DropdownMenuItem>
            {message.mediaUrl ? (
              <DropdownMenuItem asChild>
                <a href={message.mediaUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" /> Download
                </a>
              </DropdownMenuItem>
            ) : null}
            {isComment && onHide ? (
              <DropdownMenuItem onClick={() => onHide(message)}>
                <EyeOff className="mr-2 h-4 w-4" /> Hide comment
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(message)}>
              <Trash2 className="mr-2 h-4 w-4" />
              {isEmail ? "Delete" : mine ? "Unsend" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
