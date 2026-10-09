"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { createCampaign, previewCampaign, type CampaignPreview } from "@/lib/api/inbox-bot";
import type { Contact } from "@/lib/mock";
import { cn } from "@/lib/utils";

export function CampaignDialog({
  open,
  onOpenChange,
  contacts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
}) {
  const defaultChannel = contacts.every((item) => item.channel === "messenger") ? "messenger" : "instagram";
  const [channel, setChannel] = useState<"instagram" | "messenger">(defaultChannel);
  const [body, setBody] = useState("");
  const [sendNow, setSendNow] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [rows, setRows] = useState<CampaignPreview[]>([]);
  const [sending, setSending] = useState(false);

  const ids = useMemo(
    () => contacts.filter((item) => item.channel === channel).map((item) => item.id),
    [contacts, channel],
  );

  useEffect(() => {
    if (!open) return;
    setChannel(defaultChannel);
  }, [open, defaultChannel]);

  useEffect(() => {
    if (!open || ids.length === 0) {
      setRows([]);
      return;
    }
    void previewCampaign(channel, ids)
      .then(setRows)
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Could not check messaging windows"));
  }, [open, channel, ids]);

  const sendable = rows.filter((row) => row.can_send).length;

  async function send() {
    if (!body.trim()) {
      toast.error("Write a message");
      return;
    }
    if (!sendable) {
      toast.error("No contacts are inside the 24-hour window");
      return;
    }
    setSending(true);
    try {
      const result = await createCampaign({
        channel,
        contact_ids: ids,
        body: body.trim(),
        send_now: sendNow,
        scheduled_at: sendNow ? undefined : new Date(scheduledAt).toISOString(),
      });
      toast.success(
        sendNow
          ? `Sent to ${result.sent}. Skipped ${result.skipped}.`
          : `Scheduled. ${result.sent + result.skipped + result.failed} recipients queued.`,
      );
      onOpenChange(false);
      setBody("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not send campaign");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Message from Contacts</DialogTitle>
          <DialogDescription>
            Private DMs only, to people who already messaged this Page. Promotional copy cannot send outside the 24-hour window.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            {(["instagram", "messenger"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setChannel(id)}
                className={cn(
                  "rounded-lg px-2 py-1.5 text-sm font-medium capitalize",
                  channel === id ? "bg-white shadow-sm" : "text-muted-foreground",
                )}
              >
                {id === "messenger" ? "Messenger" : "Instagram"}
              </button>
            ))}
          </div>
          <Textarea rows={4} placeholder="Campaign message" value={body} onChange={(event) => setBody(event.target.value)} />
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={cn("rounded-full px-3 py-1 text-xs font-medium", sendNow ? "bg-primary text-primary-foreground" : "bg-muted")}
              onClick={() => setSendNow(true)}
            >
              Send now
            </button>
            <button
              type="button"
              className={cn("rounded-full px-3 py-1 text-xs font-medium", !sendNow ? "bg-primary text-primary-foreground" : "bg-muted")}
              onClick={() => setSendNow(false)}
            >
              Schedule
            </button>
            {!sendNow ? (
              <Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
            ) : null}
          </div>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border p-2">
            {rows.map((row) => (
              <div key={row.contact_id} className="flex items-start justify-between gap-2 text-sm">
                <span className="truncate">{row.name}</span>
                <span className={cn("shrink-0 text-[11px]", row.can_send ? "text-emerald-700" : "text-red-600")}>
                  {row.window === "in_24h" ? "In 24h" : row.window === "outside" ? "Outside window" : "No DM"}
                </span>
              </div>
            ))}
            {rows.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Select Instagram or Messenger contacts.</p>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{sendable} can receive this send. A campaign does not stop the inbox bot.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => void send()} disabled={sending || !sendable}>
              {sending ? "Sending…" : sendNow ? "Send now" : "Schedule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
