"use client";

import { ChevronRight, UserRound } from "lucide-react";

import { ChannelBadge, ChannelIcon } from "@/components/channel-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ChannelProfileSummary } from "@/lib/api/channels";
import type { Channel, ChannelId } from "@/lib/mock";
import { cn } from "@/lib/utils";

const PROFILE_CHANNELS = new Set<ChannelId>(["instagram", "facebook", "messenger", "threads", "x", "telegram", "email", "linkedin"]);
const SYNC_CHANNELS = new Set<ChannelId>(["instagram", "messenger", "facebook", "threads", "x", "telegram", "email", "linkedin"]);

export type ChannelCardItem = Channel & {
  profile: ChannelProfileSummary | null;
  externalId?: string | null;
};

function displayName(item: ChannelCardItem) {
  if (item.profile?.name && item.profile.name !== "LinkedIn member") return item.profile.name;
  if (item.profile?.username) return `@${item.profile.username.replace(/^@/, "")}`;
  if (item.id === "linkedin" && item.handle && item.handle !== "LinkedIn" && item.handle !== "LinkedIn member") {
    return item.handle;
  }
  return item.handle;
}

function displaySubtitle(item: ChannelCardItem) {
  if (item.connected && item.id === "linkedin") {
    if (item.profile?.username) return `@${item.profile.username.replace(/^@/, "")}`;
    if (item.handle?.startsWith("@")) return item.handle;
    if (item.profile?.category === "Personal account") {
      return item.profile.username ? `@${item.profile.username.replace(/^@/, "")}` : "Personal profile · Page comments sync";
    }
    if (item.profile?.name && item.profile.name !== "LinkedIn member") {
      return item.profile.category || "Connected member";
    }
    if (item.handle && item.handle !== "LinkedIn" && item.handle !== "LinkedIn member") {
      return "Connected member";
    }
    return "Sign in with a Company Page admin account";
  }
  if (item.connected && (item.id === "messenger" || item.id === "facebook") && item.externalId) {
    return `Page ID ${item.externalId}`;
  }
  if (item.profile?.username && item.profile?.name) {
    return `@${item.profile.username.replace(/^@/, "")}`;
  }
  if (item.connected && item.profile?.followers_count != null) {
    const count = item.profile.followers_count;
    const label = count >= 1000 ? `${Math.round(count / 100) / 10}K` : String(count);
    return `${label} followers`;
  }
  return item.description;
}

export function ChannelCard({
  channel,
  live,
  loading,
  busy,
  syncing,
  index,
  onConnect,
  onProfile,
  onSync,
}: {
  channel: ChannelCardItem;
  live: boolean;
  loading: boolean;
  busy: boolean;
  syncing: boolean;
  index: number;
  onConnect: () => void;
  onProfile: () => void;
  onSync: () => void;
}) {
  const canProfile = live && channel.connected && PROFILE_CHANNELS.has(channel.id);
  const name = displayName(channel);
  const subtitle = displaySubtitle(channel);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/60 bg-white/55 p-5 shadow-sm backdrop-blur-xl transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-white/80 hover:bg-white/75 hover:shadow-md",
        "animate-in fade-in slide-in-from-bottom-3 fill-mode-both",
      )}
      style={{ animationDelay: `${Math.min(index * 45, 360)}ms`, animationDuration: "420ms" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/70 to-transparent" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {channel.connected && channel.profile?.picture_url ? (
            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
              <AvatarImage src={channel.profile.picture_url} alt={name} referrerPolicy="no-referrer" />
              <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
          ) : (
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm",
                channel.accent || "bg-white/80",
              )}
            >
              <ChannelIcon channel={channel.id} size={22} />
            </span>
          )}
          <div className="min-w-0">
            <ChannelBadge channel={channel.id} />
            <h2 className="mt-2 truncate font-semibold">{channel.name}</h2>
          </div>
        </div>

        {live ? (
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
              channel.connected ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200/80 text-neutral-600",
            )}
          >
            {channel.connected ? "Live" : "Off"}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-neutral-200/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
            Soon
          </span>
        )}
      </div>

      {channel.connected ? (
        <button
          type="button"
          onClick={canProfile ? onProfile : undefined}
          disabled={!canProfile}
          className={cn(
            "relative mt-4 flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-white/70 px-3 py-3 text-left transition",
            canProfile && "hover:bg-white hover:shadow-sm",
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600">
            <UserRound className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{loading ? "Loading…" : name}</p>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </span>
          {canProfile ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
        </button>
      ) : (
        <p className="relative mt-4 text-sm text-muted-foreground">{channel.description}</p>
      )}

      <div className="relative mt-4 space-y-2">
        <Button
          className="w-full rounded-xl"
          variant={channel.connected ? "outline" : "default"}
          disabled={!live || loading || busy}
          onClick={onConnect}
        >
          {!live ? "Coming soon" : channel.connected ? "Disconnect" : "Connect"}
        </Button>
        {SYNC_CHANNELS.has(channel.id) && channel.connected ? (
          <Button
            className="w-full rounded-xl"
            variant="secondary"
            size="sm"
            disabled={loading || busy || syncing}
            onClick={onSync}
          >
            {syncing ? "Syncing inbox…" : "Sync inbox"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ChannelCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="animate-pulse rounded-3xl border border-white/50 bg-white/40 p-5"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex gap-3">
        <div className="h-12 w-12 rounded-2xl bg-white/80" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-20 rounded bg-white/80" />
          <div className="h-5 w-28 rounded bg-white/80" />
        </div>
      </div>
      <div className="mt-4 h-16 rounded-2xl bg-white/70" />
      <div className="mt-4 h-10 rounded-xl bg-white/80" />
    </div>
  );
}
