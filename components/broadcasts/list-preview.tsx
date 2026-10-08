"use client";

import { useState } from "react";

import { ChannelIcon, channelMeta } from "@/components/channel-badge";
import { publicMediaUrl } from "@/lib/broadcast-media";
import type { Broadcast } from "@/lib/mock";
import { asChannelId, detectMediaKind, type PublishPlatformId } from "@/lib/publish";
import { cn } from "@/lib/utils";

export function listingPlatform(item: Broadcast): PublishPlatformId {
  return (item.platforms[0] || item.channel) as PublishPlatformId;
}

function CaptionCard({ platform, body }: { platform: PublishPlatformId; body: string }) {
  const meta = channelMeta[asChannelId(platform)];
  const text = (body || "").trim() || "Text post";
  return (
    <span
      className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-xl shadow-sm"
      style={{ backgroundColor: meta?.color || "#2563EB" }}
    >
      <span className="absolute inset-0 flex items-center justify-center opacity-25">
        <ChannelIcon channel={asChannelId(platform)} size={22} className="bg-white" />
      </span>
      <span className="relative line-clamp-4 px-1.5 py-1 text-[7px] font-medium leading-tight text-white">
        {text}
      </span>
    </span>
  );
}

export function BroadcastListPreview({ item }: { item: Broadcast }) {
  const platform = listingPlatform(item);
  const src = publicMediaUrl(item.thumbnailUrl || item.mediaUrls[0]);
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return <CaptionCard platform={platform} body={item.body} />;
  }

  if (detectMediaKind(src) === "video" && !item.thumbnailUrl) {
    return (
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-neutral-900">
        <video src={src} className="h-full w-full object-cover" muted playsInline />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="border-y-[5px] border-l-[8px] border-y-transparent border-l-white/90" />
        </span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={cn("h-12 w-12 shrink-0 rounded-xl object-cover")}
      onError={() => setBroken(true)}
    />
  );
}
