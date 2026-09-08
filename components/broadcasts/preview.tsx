"use client";

import { ChannelIcon, channelMeta } from "@/components/channel-badge";
import { asChannelId, detectMediaKind, type PostMode, type PostType, type PublishPlatformId } from "@/lib/publish";
import { cn } from "@/lib/utils";

function MediaBlock({ urls, tall }: { urls: string[]; tall?: boolean }) {
  if (!urls.length) {
    return (
      <div className={cn("flex items-center justify-center bg-neutral-100 text-xs text-muted-foreground", tall ? "h-72" : "h-44")}>
        No media
      </div>
    );
  }
  const first = urls[0];
  const kind = detectMediaKind(first);
  if (kind === "video") {
    return <video src={first} className={cn("w-full object-cover", tall ? "h-72" : "h-44")} controls muted />;
  }
  if (urls.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={first} alt="" className={cn("w-full object-cover", tall ? "h-72" : "h-44")} />
    );
  }
  return (
    <div className={cn("grid grid-cols-2 gap-0.5", tall ? "h-72" : "h-44")}>
      {urls.slice(0, 4).map((url) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={url} src={url} alt="" className="h-full w-full object-cover" />
      ))}
    </div>
  );
}

export function PlatformPreview({
  platform,
  body,
  mediaUrls,
  postType,
  postMode,
  accountHandle,
}: {
  platform: PublishPlatformId;
  body: string;
  mediaUrls: string[];
  postType: PostType;
  postMode: PostMode;
  accountHandle?: string;
}) {
  const meta = channelMeta[asChannelId(platform)];
  const handle = (accountHandle || meta?.label || "your_account").replace(/^@/, "");
  const caption = body || "Your caption will appear here.";

  if (postMode === "audience_dm") {
    return (
      <div className="mx-auto w-full max-w-[280px]">
        <div className="overflow-hidden rounded-[1.6rem] border border-white/60 bg-[#efeae2] p-3">
          <div className="mb-3 flex items-center gap-2">
            <ChannelIcon channel={asChannelId(platform)} size={14} />
            <p className="text-xs font-medium">{meta?.label} message</p>
          </div>
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#d9fdd3] px-3 py-2 text-[13px] leading-snug text-neutral-800">
            {caption}
          </div>
        </div>
      </div>
    );
  }

  if (platform === "facebook") {
    return (
      <div className="overflow-hidden rounded-xl border border-white/60 bg-white">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7f0fd]">
            <ChannelIcon channel="facebook" size={16} />
          </span>
          <div>
            <p className="text-xs font-semibold">{handle}</p>
            <p className="text-[10px] text-muted-foreground">Just now · Public</p>
          </div>
        </div>
        <p className="px-3 pb-2 text-[13px] leading-snug">{caption}</p>
        <MediaBlock urls={mediaUrls} />
        <div className="flex justify-around border-t border-black/5 py-2 text-[11px] text-muted-foreground">
          <span>Like</span>
          <span>Comment</span>
          <span>Share</span>
        </div>
      </div>
    );
  }

  if (platform === "threads") {
    return (
      <div className="overflow-hidden rounded-xl border border-white/60 bg-white">
        <div className="flex items-center gap-2 px-3 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
            <ChannelIcon channel="threads" size={16} />
          </span>
          <div>
            <p className="text-xs font-semibold">{handle}</p>
            <p className="text-[10px] text-muted-foreground">threads.net</p>
          </div>
        </div>
        <p className="px-3 pb-2 text-[13px] leading-snug">{caption}</p>
        {mediaUrls.length ? (
          <div className="px-3 pb-3">
            <div className="overflow-hidden rounded-xl border border-black/5">
              <MediaBlock urls={mediaUrls.slice(0, 1)} />
            </div>
          </div>
        ) : null}
        <div className="flex gap-4 border-t border-black/5 px-3 py-2 text-[11px] text-muted-foreground">
          <span>Like</span>
          <span>Reply</span>
          <span>Repost</span>
          <span>Share</span>
        </div>
      </div>
    );
  }

  if (platform === "x") {
    return (
      <div className="overflow-hidden rounded-xl border border-white/60 bg-white p-3">
        <div className="flex gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
            <ChannelIcon channel="x" size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold">
              {handle} <span className="font-normal text-muted-foreground">@{handle.toLowerCase().replace(/\s+/g, "")}</span>
            </p>
            <p className="mt-1 text-[13px] leading-snug">{caption}</p>
            {mediaUrls[0] ? (
              <div className="mt-2 overflow-hidden rounded-xl">
                <MediaBlock urls={mediaUrls.slice(0, 1)} tall={false} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (platform === "linkedin") {
    return (
      <div className="overflow-hidden rounded-xl border border-white/60 bg-white p-3">
        <div className="flex gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A66C2]/10">
            <ChannelIcon channel="linkedin" size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold">{handle}</p>
            <p className="text-[11px] text-muted-foreground">Personal or Company Page</p>
            <p className="mt-2 text-[13px] leading-snug whitespace-pre-wrap">{caption}</p>
          </div>
        </div>
      </div>
    );
  }

  if (platform === "tiktok") {
    return (
      <div className="mx-auto w-[220px] overflow-hidden rounded-[1.4rem] bg-black text-white">
        <MediaBlock urls={mediaUrls} tall />
        <div className="p-3">
          <p className="text-xs font-semibold">@bloom.studio</p>
          <p className="mt-1 line-clamp-3 text-[11px] text-white/80">{caption}</p>
        </div>
      </div>
    );
  }

  const story = postType === "story";
  return (
    <div className="mx-auto w-[240px] overflow-hidden rounded-[1.6rem] border border-white/70 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: platform === "instagram" ? "linear-gradient(#f9ce34,#ee2a7b,#6228d7)" : "#111" }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
            <ChannelIcon channel={asChannelId(platform)} size={12} />
          </span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold">{handle}</p>
          <p className="text-[10px] capitalize text-muted-foreground">{postType}</p>
        </div>
      </div>
      <MediaBlock urls={mediaUrls} tall={story || postType === "reel"} />
      <p className="line-clamp-4 px-3 py-2 text-[12px] leading-snug">
        <span className="font-semibold">{handle} </span>
        {caption}
      </p>
    </div>
  );
}
