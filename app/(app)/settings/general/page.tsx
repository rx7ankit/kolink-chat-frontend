"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import { patchWorkspace } from "@/lib/api/workspaces";
import { useAuth } from "@/lib/auth/provider";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/dictionary";

export default function GeneralSettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { workspace, refresh } = useAuth();
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    setName(workspace.name);
    setTimezone(workspace.timezone);
  }, [workspace]);

  return (
    <div>
      <h1 className="text-xl font-semibold">{t("settings.general")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("settings.languageHint")}</p>
      <form
        className="glass mt-6 max-w-lg space-y-5 rounded-2xl p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          try {
            await patchWorkspace({ name: name.trim(), timezone });
            await refresh();
            toast.success(t("settings.saved"));
          } catch (error) {
            toast.error(error instanceof ApiError ? error.detail : "Could not save");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">{t("settings.workspace")}</Label>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("settings.timezone")}</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
              <SelectItem value="America/New_York">America/New_York</SelectItem>
              <SelectItem value="Europe/London">Europe/London</SelectItem>
              <SelectItem value="Asia/Taipei">Asia/Taipei</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="glass flex items-center justify-between rounded-2xl px-4 py-3">
          <div>
            <p className="text-sm font-medium">{t("settings.language")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.zhHant")}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{t("settings.english")}</span>
            <Switch
              checked={locale === "zh-Hant"}
              onCheckedChange={(checked) => setLocale((checked ? "zh-Hant" : "en") as Locale)}
            />
            <span className="text-xs font-medium">{t("settings.zhHant")}</span>
          </div>
        </div>
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Saving…" : t("common.save")}
        </Button>
      </form>
    </div>
  );
}
