"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { AgenticSetupFields, BotPlayground, BotSetupHeader } from "@/components/inbox/bot-setup-forms";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import {
  botChannelLabel,
  getInboxBot,
  listInboxKnowledge,
  parseBotChannel,
  saveInboxBot,
  type InboxBotConfig,
  type InboxKnowledgeDoc,
} from "@/lib/api/inbox-bot";

export default function AgenticBotSetupPage() {
  const params = useParams<{ channel: string }>();
  const router = useRouter();
  const channel = parseBotChannel(params.channel);
  const [config, setConfig] = useState<InboxBotConfig | null>(null);
  const [docs, setDocs] = useState<InboxKnowledgeDoc[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!channel) {
      router.replace("/inbox");
      return;
    }
    void Promise.all([getInboxBot(channel), listInboxKnowledge(channel)])
      .then(([next, knowledge]) => {
        setConfig(next);
        setDocs(knowledge);
      })
      .catch((error) => {
        toast.error(error instanceof ApiError ? error.detail : "Could not load agentic setup");
      });
  }, [channel, router]);

  if (!channel) return null;

  async function save() {
    if (!config || !channel) return;
    setSaving(true);
    try {
      const next = await saveInboxBot(channel, { mode: "agentic", agentic: config.agentic });
      setConfig(next);
      toast.success(`${botChannelLabel(channel)} agentic bot saved`);
      router.push(`/inbox/bot/${channel}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not save agentic bot");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <BotSetupHeader
        channel={channel}
        backHref={`/inbox/bot/${channel}`}
        title="Full agentic"
        description="AI replies from your knowledge. The menu bot is off while this is on."
      />
      {!config ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6">
          <AgenticSetupFields channel={channel} config={config} setConfig={setConfig} docs={docs} setDocs={setDocs} />
          <BotPlayground channel={channel} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push(`/inbox/bot/${channel}`)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save agentic bot"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
