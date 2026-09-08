"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ChannelBadge } from "@/components/channel-badge";
import { Button } from "@/components/ui/button";
import { listChannels, type ApiChannel } from "@/lib/api/channels";
import { channels as catalog } from "@/lib/mock";
import type { ChannelId } from "@/lib/mock";

export default function ChannelSettingsPage() {
  const [rows, setRows] = useState<ApiChannel[]>([]);

  useEffect(() => {
    void listChannels()
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  const byChannel = new Map(rows.map((row) => [row.channel, row]));

  return (
    <div>
      <h1 className="text-xl font-semibold">Channels</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Live connection status. Manage tokens on the Channels page.
      </p>
      <div className="mt-6 space-y-3">
        {catalog.map((channel) => {
          const row = byChannel.get(channel.id);
          const connected = row?.connected ?? false;
          return (
            <div key={channel.id} className="flex items-center justify-between glass rounded-2xl px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <ChannelBadge channel={channel.id as ChannelId} />
                  <span className="text-sm font-medium">{row?.handle || channel.handle}</span>
                </div>
                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  {connected ? row?.status.replace("_", " ") : "disconnected"}
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/channels">{connected ? "Manage" : "Connect"}</Link>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
