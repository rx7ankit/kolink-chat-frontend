"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bot, Keyboard, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { BotSetupHeader } from "@/components/inbox/bot-setup-forms";
import { ApiError } from "@/lib/api/client";
import {
  botChannelLabel,
  getInboxBot,
  parseBotChannel,
  saveInboxBot,
  type InboxBotConfig,
  type InboxBotMode,
} from "@/lib/api/inbox-bot";
import { cn } from "@/lib/utils";

const OPTIONS: {
  id: InboxBotMode;
  title: string;
  body: string;
  icon: typeof Bot;
}[] = [
  {
    id: "off",
    title: "No bot",
    body: "Human inbox only. Teammates answer every DM on this channel.",
    icon: Bot,
  },
  {
    id: "menu",
    title: "Menu bot & keyword reply",
    body: "Telegram-style buttons, catalogs, lists, and keywords. No AI.",
    icon: Keyboard,
  },
  {
    id: "agentic",
    title: "Full agentic",
    body: "AI replies from your knowledge. No menu tree on this channel.",
    icon: Sparkles,
  },
];

export default function BotPickerPage() {
  const params = useParams<{ channel: string }>();
  const router = useRouter();
  const channel = parseBotChannel(params.channel);
  const [config, setConfig] = useState<InboxBotConfig | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!channel) {
      router.replace("/inbox");
      return;
    }
    void getInboxBot(channel)
      .then(setConfig)
      .catch((error) => {
        toast.error(error instanceof ApiError ? error.detail : "Could not load bot setup");
      });
  }, [channel, router]);

  if (!channel) return null;

  async function applyMode(next: InboxBotMode) {
    if (!channel || !config) return;
    setBusy(true);
    try {
      const saved = await saveInboxBot(channel, { mode: next });
      setConfig(saved);
      if (next === "menu") router.push(`/inbox/bot/${channel}/menu`);
      else if (next === "agentic") router.push(`/inbox/bot/${channel}/agentic`);
      else toast.success(`${botChannelLabel(channel)} bot is off`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not update bot");
    } finally {
      setBusy(false);
    }
  }

  function requestMode(next: InboxBotMode) {
    if (!config || busy) return;
    if (next === config.mode) {
      if (next === "menu") router.push(`/inbox/bot/${channel}/menu`);
      if (next === "agentic") router.push(`/inbox/bot/${channel}/agentic`);
      return;
    }
    const switchingLive = (config.mode === "menu" && next === "agentic") || (config.mode === "agentic" && next === "menu");
    if (switchingLive) {
      const message =
        next === "agentic"
          ? "Stop the menu bot and open the agentic bot?"
          : "Stop the agentic bot and open the menu bot?";
      toast(message, {
        duration: 15000,
        action: { label: "Confirm", onClick: () => void applyMode(next) },
        cancel: { label: "Cancel", onClick: () => undefined },
      });
      return;
    }
    if (config.mode !== "off" && next === "off") {
      toast("Turn off the bot for this channel?", {
        duration: 15000,
        action: { label: "Confirm", onClick: () => void applyMode("off") },
        cancel: { label: "Cancel", onClick: () => undefined },
      });
      return;
    }
    if (next === "menu") router.push(`/inbox/bot/${channel}/menu`);
    if (next === "agentic") router.push(`/inbox/bot/${channel}/agentic`);
  }

  return (
    <>
      <BotSetupHeader
        channel={channel}
        backHref="/inbox"
        title="Setup bot"
        description="Pick one mode for this channel. Menu and agentic cannot run at the same time."
      />
      {!config ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-3">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = config.mode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={busy}
                onClick={() => requestMode(option.id)}
                className={cn(
                  "flex items-start gap-4 rounded-2xl border bg-white/70 p-4 text-left transition hover:bg-white",
                  selected ? "border-primary ring-2 ring-primary/30" : "border-white/60",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    selected ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{option.title}</span>
                    {selected ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Selected
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{option.body}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
