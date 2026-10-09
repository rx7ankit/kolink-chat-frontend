"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { BotPlayground, BotSetupHeader, MenuSetupFields } from "@/components/inbox/bot-setup-forms";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { botChannelLabel, getInboxBot, parseBotChannel, saveInboxBot, type InboxBotConfig } from "@/lib/api/inbox-bot";

export default function MenuBotSetupPage() {
  const params = useParams<{ channel: string }>();
  const router = useRouter();
  const channel = parseBotChannel(params.channel);
  const [config, setConfig] = useState<InboxBotConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!channel) {
      router.replace("/inbox");
      return;
    }
    void getInboxBot(channel)
      .then(setConfig)
      .catch((error) => {
        toast.error(error instanceof ApiError ? error.detail : "Could not load menu setup");
      });
  }, [channel, router]);

  if (!channel) return null;

  async function save() {
    if (!config || !channel) return;
    setSaving(true);
    try {
      const next = await saveInboxBot(channel, { mode: "menu", menu: config.menu });
      setConfig(next);
      toast.success(`${botChannelLabel(channel)} menu bot saved`);
      router.push(`/inbox/bot/${channel}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not save menu bot");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <BotSetupHeader
        channel={channel}
        backHref={`/inbox/bot/${channel}`}
        title="Menu bot & keyword reply"
        description="Buttons, catalogs, price lists, and keywords. No AI on this channel."
      />
      {!config ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6">
          <MenuSetupFields config={config} setConfig={setConfig} />
          <BotPlayground channel={channel} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push(`/inbox/bot/${channel}`)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save menu bot"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
