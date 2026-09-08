"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

import { ChannelIcon } from "@/components/channel-badge";
import { SparkArea } from "@/components/charts/spark-area";
import { PageHeader, StatCard } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getAnalytics, type AnalyticsBundle } from "@/lib/api/analytics";
import { listTemplates, type ApiTemplate } from "@/lib/api/automations";
import { listChannels, type ApiChannel } from "@/lib/api/channels";
import { ApiError } from "@/lib/api/client";
import { channels as catalog } from "@/lib/mock";
import type { ChannelId } from "@/lib/mock";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function HomePage() {
  const [data, setData] = useState<AnalyticsBundle | null>(null);
  const [channelRows, setChannelRows] = useState<ApiChannel[]>([]);
  const [templates, setTemplates] = useState<ApiTemplate[]>([]);

  useEffect(() => {
    void Promise.all([getAnalytics(), listChannels(), listTemplates()])
      .then(([analytics, chans, tpls]) => {
        setData(analytics);
        setChannelRows(chans);
        setTemplates(tpls.slice(0, 5));
      })
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Failed to load home"));
  }, []);

  const stats = data?.summary;
  const byChannel = new Map(channelRows.map((row) => [row.channel, row]));
  const channelCards = catalog.filter((item) =>
    ["instagram", "whatsapp", "messenger", "facebook", "x", "telegram", "email"].includes(item.id),
  );

  return (
    <div className="page-shell">
      <PageHeader
        title="Home"
        description="Last 7 days · live workspace"
        actions={
          <Button asChild>
            <Link href="/templates">New automation</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active contacts"
          value={formatNumber(stats?.active_contacts ?? 0)}
          hint={`+${stats?.net_7d ?? 0} net this week`}
        />
        <StatCard
          label="Messages"
          value={formatNumber(stats?.messages_7d ?? 0)}
          hint="Across connected channels"
        />
        <StatCard
          label="Open chats"
          value={String(stats?.open_chats ?? 0)}
          hint="Waiting on a human"
        />
        <StatCard
          label="Attributed revenue"
          value={formatCurrency(stats?.revenue_7d ?? 0)}
          hint={`${stats?.live_automations ?? 0} live flows`}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="glass rounded-xl p-4 sm:p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Account activity</h2>
            <Link href="/insights" className="text-xs font-medium text-primary">
              See insights
            </Link>
          </div>
          <SparkArea data={data?.activity ?? []} dataKey="messages" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold">Net contacts</h2>
          <SparkArea data={data?.net_contacts ?? []} dataKey="net" color="#2563EB" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Channels</h2>
            <Link href="/channels" className="text-xs font-medium text-primary">
              Manage
            </Link>
          </div>
          <div className="space-y-3">
            {channelCards.map((channel) => {
              const row = byChannel.get(channel.id);
              const connected = row?.connected ?? false;
              return (
                <div key={channel.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/70">
                      <ChannelIcon channel={channel.id as ChannelId} size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{row?.handle || channel.handle}</p>
                      <p className="text-xs text-muted-foreground">
                        {connected ? row?.status.replace("_", " ") : "Not connected"}
                      </p>
                    </div>
                  </div>
                  {!connected && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/channels">Connect</Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Start from a template</h2>
            <Link href="/templates" className="text-xs font-medium text-primary">
              All templates
            </Link>
          </div>
          <div className="space-y-2">
            {templates.map((template) => (
              <Link
                key={template.id}
                href="/templates"
                className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-muted"
              >
                <div>
                  <p className="text-sm font-medium">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
