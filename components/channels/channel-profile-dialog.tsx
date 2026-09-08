"use client";

import { BadgeCheck, ExternalLink, RefreshCw } from "lucide-react";

import { ChannelBadge, ChannelIcon } from "@/components/channel-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChannelProfile } from "@/lib/api/channels";
import type { ChannelId } from "@/lib/mock";
import { cn } from "@/lib/utils";

function formatCount(value: number | null | undefined) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 10_000) return `${Math.round(num / 1_000)}K`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(num);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <p className="text-base font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function channelPlatformLabel(channelId: ChannelId) {
  const labels: Partial<Record<ChannelId, string>> = {
    instagram: "Instagram",
    facebook: "Facebook",
    messenger: "Facebook",
    threads: "Threads",
    x: "X",
    telegram: "Telegram",
    email: "Gmail",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    line: "LINE",
  };
  return labels[channelId] ?? channelId;
}

function CapabilityChip({
  tone,
  label,
}: {
  tone: "ok" | "warn" | "no";
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-2xl border px-3 py-2 text-xs leading-snug backdrop-blur-md",
        tone === "ok" && "border-emerald-200/70 bg-emerald-50/70 text-emerald-950",
        tone === "warn" && "border-amber-200/70 bg-amber-50/70 text-amber-950",
        tone === "no" && "border-rose-200/70 bg-rose-50/70 text-rose-950",
      )}
    >
      <span className="mt-0.5 shrink-0" aria-hidden>
        {tone === "ok" ? "✅" : tone === "warn" ? "⚠️" : "❌"}
      </span>
      <span>{label}</span>
    </div>
  );
}

export function ChannelProfileDialog({
  channelId,
  channelName,
  open,
  loading,
  profile,
  onOpenChange,
  onRefresh,
}: {
  channelId: ChannelId;
  channelName: string;
  open: boolean;
  loading: boolean;
  profile: ChannelProfile | null;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}) {
  const title = profile?.name || channelName;
  const username = profile?.username ? `@${profile.username.replace(/^@/, "")}` : null;
  const hasStats = Boolean(profile?.followers_count || profile?.follows_count || profile?.media_count);
  const isLinkedInPersonal = channelId === "linkedin" && profile?.category === "Personal account";
  const isLinkedInPage = channelId === "linkedin" && profile?.category !== "Personal account";
  const hasProfileLink = Boolean(profile?.profile_url || channelId === "linkedin");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[min(92vw,44rem)] max-w-2xl gap-0 overflow-hidden p-0",
          "rounded-[2rem] border-white/70 bg-white/55 shadow-[0_28px_80px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.85)]",
          "backdrop-blur-2xl",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/80 via-white/25 to-transparent" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-indigo-200/25 blur-3xl" />

        <div className="relative grid sm:grid-cols-[15.5rem_minmax(0,1fr)]">
          <aside className="flex flex-col items-center px-6 pb-5 pt-8 text-center sm:border-r sm:border-white/40 sm:px-7 sm:py-8">
            <DialogHeader className="items-center space-y-3 text-center">
              <div className="relative mx-auto w-fit">
                <span className="absolute -inset-1 rounded-full bg-white/70 blur-sm" />
                <Avatar className="relative h-[5.5rem] w-[5.5rem] border-[3px] border-white/90 shadow-[0_12px_30px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80">
                  {profile?.picture_url ? (
                    <AvatarImage src={profile.picture_url} alt={title} referrerPolicy="no-referrer" />
                  ) : null}
                  <AvatarFallback className="text-2xl">
                    <ChannelIcon channel={channelId} size={28} />
                  </AvatarFallback>
                </Avatar>
                {profile?.verified ? (
                  <span className="absolute bottom-0.5 right-0.5 rounded-full bg-white/90 p-0.5 shadow">
                    <BadgeCheck className="h-5 w-5 text-[#0095F6]" />
                  </span>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <DialogTitle className="text-xl leading-tight">
                  {loading && !profile ? "Loading profile…" : title}
                </DialogTitle>
                <DialogDescription className="line-clamp-2 text-sm leading-snug">
                  {profile?.page_name || username || channelName}
                </DialogDescription>
              </div>
              <ChannelBadge channel={channelId} />
            </DialogHeader>

            {hasStats ? (
              <div className="mt-5 flex w-full rounded-2xl border border-white/70 bg-white/45 px-2 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md">
                {profile?.media_count != null ? (
                  <Stat label="Posts" value={formatCount(profile.media_count)} />
                ) : null}
                {profile?.followers_count != null ? (
                  <Stat label="Followers" value={formatCount(profile.followers_count)} />
                ) : null}
                {profile?.follows_count != null ? (
                  <Stat label="Following" value={formatCount(profile.follows_count)} />
                ) : null}
              </div>
            ) : null}
          </aside>

          <div className="flex min-w-0 flex-col justify-between gap-4 px-6 pb-6 pt-5 sm:px-6 sm:py-8">
            <div className="space-y-4">
              {isLinkedInPersonal ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">
                    What works on personal login
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <CapabilityChip tone="ok" label="Connected as a personal profile" />
                    <CapabilityChip tone="ok" label="Post text from Broadcasts" />
                    <CapabilityChip tone="warn" label="Personal post comments are limited by LinkedIn" />
                    <CapabilityChip tone="ok" label="Page comments sync if you admin a Company Page" />
                    <CapabilityChip tone="no" label="Personal DMs cannot be synced" />
                    <CapabilityChip tone="ok" label="After Sync, use Inbox → LinkedIn → Comments" />
                  </div>
                </div>
              ) : null}

              {isLinkedInPage ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/90">
                    Company Page features
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <CapabilityChip tone="ok" label="Page comments sync to Inbox → Comments" />
                    <CapabilityChip tone="ok" label="Reply to comments from KoLink" />
                    <CapabilityChip tone="warn" label="Page DMs need LinkedIn Messaging partner access" />
                    <CapabilityChip tone="ok" label="Page posting with Community Management scopes" />
                  </div>
                </div>
              ) : null}

              {profile?.biography ? (
                <div className="rounded-2xl border border-white/70 bg-white/40 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-md">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">About</p>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed">{profile.biography}</p>
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                {profile?.category ? (
                  <div className="rounded-2xl border border-white/70 bg-white/40 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-md">
                    <span className="text-[11px] text-muted-foreground">Category</span>
                    <p className="font-medium">{profile.category}</p>
                  </div>
                ) : null}
                {profile?.website && profile.website.includes("@") ? (
                  <div className="rounded-2xl border border-white/70 bg-white/40 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-md">
                    <span className="text-[11px] text-muted-foreground">Email</span>
                    <p className="truncate font-medium">{profile.website}</p>
                  </div>
                ) : null}
                {profile?.website && !profile.website.includes("@") ? (
                  <a
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/40 px-3.5 py-2.5 text-sm text-[#0095F6] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-md"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <span className="truncate">{profile.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                ) : null}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {hasProfileLink ? (
                <Button className="h-10 flex-1 rounded-full" variant="outline" asChild>
                  <a
                    href={profile?.profile_url || "https://www.linkedin.com/"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on {channelPlatformLabel(channelId)}
                  </a>
                </Button>
              ) : null}
              <Button
                variant="secondary"
                className={cn("h-10 rounded-full", !hasProfileLink && "flex-1")}
                disabled={loading}
                onClick={onRefresh}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
