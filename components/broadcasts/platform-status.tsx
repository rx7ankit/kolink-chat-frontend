"use client";

import { ChannelIcon } from "@/components/channel-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { asChannelId, statusLabel, type PlatformStatus, type PublishPlatformId } from "@/lib/publish";
import { cn } from "@/lib/utils";

const DOT: Record<string, string> = {
  published: "bg-emerald-500",
  scheduled: "bg-amber-400",
  processing: "bg-sky-500",
  pending: "bg-neutral-300",
  failed: "bg-rose-500",
  deleted: "bg-neutral-400",
};

export function PlatformStatusDot({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", DOT[status] || "bg-neutral-300", className)}
      title={statusLabel(status)}
    />
  );
}

export function PlatformStatusList({
  platforms,
  statuses,
  showLinks = true,
}: {
  platforms: string[];
  statuses: Record<string, PlatformStatus>;
  showLinks?: boolean;
}) {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2">
        {platforms.map((platform) => {
          const row = statuses[platform];
          const status = row?.status || "pending";
          return (
            <div key={platform} className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/50 px-2 py-0.5">
              <ChannelIcon channel={asChannelId(platform)} size={12} />
              <PlatformStatusDot status={status} />
              {showLinks && status !== "deleted" && row?.permalink ? (
                <a
                  href={row.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  View post
                </a>
              ) : status === "deleted" ? (
                <span className="text-[11px] font-medium text-muted-foreground">Deleted</span>
              ) : row?.simulated ? (
                <span className="text-[11px] font-medium text-amber-700">Simulated only</span>
              ) : row?.error ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="max-w-28 truncate text-[11px] text-rose-700">{row.error}</span>
                  </TooltipTrigger>
                  <TooltipContent>{row.error}</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export function PlatformIconRow({ platforms }: { platforms: PublishPlatformId[] | string[] }) {
  return (
    <div className="flex items-center -space-x-1">
      {platforms.map((platform) => (
        <span
          key={platform}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-white/80"
        >
          <ChannelIcon channel={asChannelId(platform)} size={12} />
        </span>
      ))}
    </div>
  );
}
