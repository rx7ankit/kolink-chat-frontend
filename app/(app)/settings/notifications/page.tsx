"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { listNotificationPrefs, saveNotificationPrefs, type NotifPref } from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";
import {
  browserNotificationsSupported,
  getNotificationPermission,
  inboxNotificationsEnabled,
  requestInboxNotificationPermission,
  setInboxNotificationsEnabled,
} from "@/lib/notifications/inbox";

export default function NotificationsSettingsPage() {
  const [rows, setRows] = useState<NotifPref[]>([]);
  const [saving, setSaving] = useState(false);
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );

  useEffect(() => {
    void listNotificationPrefs()
      .then(setRows)
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Failed to load prefs"));
    setBrowserPermission(getNotificationPermission());
    setBrowserEnabled(inboxNotificationsEnabled());
  }, []);

  async function enableBrowserNotifications() {
    const result = await requestInboxNotificationPermission();
    setBrowserPermission(result === "unsupported" ? "unsupported" : result);
    setBrowserEnabled(result === "granted" && inboxNotificationsEnabled());
    if (result === "granted") toast.success("Desktop notifications enabled");
    if (result === "denied") toast.error("Notifications blocked in browser settings");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Notifications</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choose what lands in your inbox.</p>

      {browserNotificationsSupported() ? (
        <div className="mt-6 max-w-lg rounded-2xl border border-white/50 bg-white/50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#007AFF]/10 text-[#007AFF]">
                <BellRing className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium">Desktop notifications</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Instant alerts when customers message you, even when KoLink is in the background.
                </p>
                {browserPermission === "denied" ? (
                  <p className="mt-2 text-xs text-amber-700">
                    Blocked in your browser. Allow notifications for this site in browser settings.
                  </p>
                ) : null}
              </div>
            </div>
            {browserPermission === "granted" ? (
              <Switch
                checked={browserEnabled}
                onCheckedChange={(checked) => {
                  setInboxNotificationsEnabled(checked);
                  setBrowserEnabled(checked);
                }}
              />
            ) : (
              <Button size="sm" variant="outline" onClick={() => void enableBrowserNotifications()}>
                Enable
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-6 max-w-lg space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between glass rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium">{row.label}</p>
              <p className="text-xs text-muted-foreground">{row.hint}</p>
            </div>
            <Switch
              checked={row.enabled}
              onCheckedChange={(checked) =>
                setRows((current) => current.map((item) => (item.key === row.key ? { ...item, enabled: checked } : item)))
              }
            />
          </div>
        ))}
        <Button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              const prefs = Object.fromEntries(rows.map((row) => [row.key, row.enabled]));
              await saveNotificationPrefs(prefs);
              toast.success("Notification prefs saved");
            } catch (error) {
              toast.error(error instanceof ApiError ? error.detail : "Could not save");
            } finally {
              setSaving(false);
            }
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
