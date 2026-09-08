"use client";

import { ChannelIcon } from "@/components/channel-badge";
import type { ApiChannel } from "@/lib/api/channels";
import { PUBLISH_PLATFORMS, type PublishPlatformId } from "@/lib/publish";
import { cn } from "@/lib/utils";

export function DestinationPanel({
  platforms,
  channels,
}: {
  platforms: PublishPlatformId[];
  channels: ApiChannel[];
}) {
  const byChannel = new Map(channels.map((row) => [row.channel, row]));

  return (
    <section className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-sky-50/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Publishing to</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">Each platform uses the connected account below.</p>
      <ul className="mt-3 space-y-2">
        {platforms.map((platform) => {
          const meta = PUBLISH_PLATFORMS.find((item) => item.id === platform);
          const row = byChannel.get(platform);
          const connected = row?.connected;
          const handle = row?.handle || row?.profile?.username || row?.profile?.name;
          return (
            <li
              key={platform}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                connected ? "border-emerald-200/80 bg-white/70" : "border-rose-200/60 bg-rose-50/30",
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                <ChannelIcon channel={platform} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{meta?.label || platform}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {connected ? handle || "Connected account" : "Not connected — connect in Channels"}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  connected ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800",
                )}
              >
                {connected ? "Ready" : "Missing"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
