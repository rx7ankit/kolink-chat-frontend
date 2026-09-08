"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import {
  createCannedResponse,
  getInboxSettings,
  listCannedResponses,
  patchInboxSettings,
  type CannedResponse,
} from "@/lib/api/inbox";
import { useAuth } from "@/lib/auth/provider";

export default function InboxSettingsPage() {
  const { workspace } = useAuth();
  const [autoAssign, setAutoAssign] = useState(true);
  const [pauseSeconds, setPauseSeconds] = useState("1800");
  const [canned, setCanned] = useState<CannedResponse[]>([]);
  const [shortcut, setShortcut] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    void Promise.all([getInboxSettings(), listCannedResponses()])
      .then(([settings, responses]) => {
        setAutoAssign(settings.auto_assign);
        setPauseSeconds(String(settings.pause_after_reply_seconds));
        setCanned(responses);
      })
      .catch((error) => {
        toast.error(error instanceof ApiError ? error.detail : "Could not load inbox settings");
      });
  }, [workspace]);

  return (
    <div>
      <h1 className="text-xl font-semibold">Inbox</h1>
      <p className="mt-1 text-sm text-muted-foreground">Handoff behavior and canned replies.</p>
      <div className="mt-6 max-w-lg space-y-5">
        <div className="flex items-center justify-between glass rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium">Auto-assign new chats</p>
            <p className="text-xs text-muted-foreground">Round-robin across inbox seats.</p>
          </div>
          <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
        </div>
        <div className="space-y-2">
          <Label>Pause automations after a human reply</Label>
          <Select value={pauseSeconds} onValueChange={setPauseSeconds}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="900">15 minutes</SelectItem>
              <SelectItem value="1800">30 minutes</SelectItem>
              <SelectItem value="3600">1 hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Canned responses</p>
          <div className="space-y-2">
            {canned.map((item) => (
              <div key={item.id} className="glass rounded-xl px-4 py-3">
                <p className="text-sm font-medium">{item.shortcut}</p>
                <p className="text-xs text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            <Input
              placeholder="/shortcut"
              value={shortcut}
              onChange={(event) => setShortcut(event.target.value)}
            />
            <Input
              placeholder="Reply text"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (!shortcut.trim() || !text.trim()) {
                  toast.error("Enter a shortcut and reply text");
                  return;
                }
                try {
                  const created = await createCannedResponse(shortcut.trim(), text.trim());
                  setCanned((current) => [...current, created]);
                  setShortcut("");
                  setText("");
                  toast.success("Canned reply added");
                } catch (error) {
                  toast.error(error instanceof ApiError ? error.detail : "Could not add reply");
                }
              }}
            >
              Add canned reply
            </Button>
          </div>
        </div>
        <Button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await patchInboxSettings({
                auto_assign: autoAssign,
                pause_after_reply_seconds: Number(pauseSeconds),
              });
              toast.success("Inbox settings saved");
            } catch (error) {
              toast.error(error instanceof ApiError ? error.detail : "Could not save");
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
