"use client";

import type { ReactNode } from "react";
import {
  Bookmark,
  ChartNoAxesColumn,
  Earth,
  Heart,
  ImageOff,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Repeat2,
  Send,
  Share2,
  ThumbsUp,
  VolumeX,
} from "lucide-react";

import { PlatformIcon } from "@/components/brand/platform-icon";
import { Reel } from "@/components/media/reel";
import { cn } from "@/lib/cn";
import { demoBrand } from "@/lib/media";
import type { PlatformId } from "@/lib/platforms";

import { BrandAvatar, scrim } from "../automations/brand";
import { captionLimit } from "./data";

/*
 * Live previews of the one draft as each network would show it. The composer has a
 * single attachment (drop-04.mp4), so every network that takes media shows that video
 * in its own frame; LinkedIn publishing is text only, so its preview says so.
 * Illustrations: the caption is the visitor's live text, nothing else is real.
 */

export function NetworkPreview({ network, text }: { network: PlatformId; text: string }) {
  switch (network) {
    case "instagram":
      return <InstagramReel text={text} />;
    case "facebook":
      return <FacebookPost text={text} />;
    case "threads":
      return <ThreadsPost text={text} />;
    case "x":
      return <XPost text={text} />;
    case "linkedin":
      return <LinkedInPost text={text} />;
    default:
      return null;
  }
}

const icon = "size-[18px] shrink-0";
const stroke = 1.6;

/** Instagram: the video goes out as a Reel. Reels chrome sits on the video over a short ink scrim. */
function InstagramReel({ text }: { text: string }) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink text-white">
      <Reel className="absolute inset-0 object-[50%_46%]" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-20"
        style={{ background: `linear-gradient(to bottom, ${scrim(0.38)}, transparent)` }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[58%]"
        style={{ background: `linear-gradient(to top, ${scrim(0.74)}, transparent)` }}
      />
      <p className="absolute top-3 left-3.5 text-[15px] font-semibold tracking-[-0.01em]">Reels</p>
      <span className="absolute top-3 right-3.5" data-active="true">
        <PlatformIcon id="instagram" variant="tile" size={22} />
      </span>

      <div className="absolute right-14 bottom-3.5 left-3.5 min-w-0">
        <p className="flex items-center gap-2 text-[13px] font-semibold">
          <BrandAvatar size={26} className="ring-[1.5px] ring-white/80" />
          <span className="truncate">{demoBrand.handle}</span>
          <span className="shrink-0 rounded-md border border-white/70 px-2 py-[3px] text-[11.5px] leading-none font-semibold">Follow</span>
        </p>
        <p className="mt-2 line-clamp-2 text-[12.5px] leading-snug break-words text-white/95">{text}</p>
        <p className="mono mt-2 flex min-w-0 items-center gap-1.5 text-[10.5px] text-white/80">
          <Music2 className="size-3 shrink-0" strokeWidth={2} aria-hidden />
          <span className="truncate">{demoBrand.handle} · Original audio</span>
        </p>
      </div>

      <div className="absolute right-3 bottom-4 flex flex-col items-center gap-4" aria-hidden>
        <Heart className="size-[21px]" strokeWidth={1.8} />
        <MessageCircle className="size-[21px]" strokeWidth={1.8} />
        <Send className="size-[21px]" strokeWidth={1.8} />
        <MoreHorizontal className="size-[21px]" strokeWidth={1.8} />
      </div>
    </div>
  );
}

/** Facebook Page: page name, caption, the video (autoplays muted in feed), reactions bar. */
function FacebookPost({ text }: { text: string }) {
  return (
    <Frame>
      <header className="flex items-center gap-2.5 px-3.5 pt-3">
        <BrandAvatar size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] leading-tight font-semibold">{demoBrand.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] leading-tight text-ink-soft">
            Just now · <Earth className="size-3" strokeWidth={1.8} aria-hidden />
          </p>
        </div>
        <MoreHorizontal className={cn(icon, "text-ink-soft")} strokeWidth={stroke} aria-hidden />
      </header>
      <div className="px-3.5 pt-2.5 pb-3">
        <p className="line-clamp-3 text-[13px] leading-snug break-words">{text}</p>
      </div>
      <div className="relative aspect-square overflow-hidden bg-bg-alt">
        <Reel className="absolute inset-0 object-[50%_50%]" />
        <MuteChip />
      </div>
      <div className="grid grid-cols-3 border-t border-line px-1 py-1 text-[12.5px] font-medium text-ink-soft" aria-hidden>
        <ActionCell Icon={ThumbsUp} label="Like" />
        <ActionCell Icon={MessageCircle} label="Comment" />
        <ActionCell Icon={Share2} label="Share" />
      </div>
    </Frame>
  );
}

/** Threads: avatar column, text first, then the media with rounded corners at its own ratio. */
function ThreadsPost({ text }: { text: string }) {
  return (
    <Frame className="grid grid-cols-[34px_minmax(0,1fr)] gap-x-3 px-3.5 py-3.5">
      <BrandAvatar size={34} />
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[13.5px] leading-tight">
          <span className="truncate font-semibold">{demoBrand.handle}</span>
          <span className="shrink-0 text-ink-soft">now</span>
          <MoreHorizontal className={cn(icon, "ml-auto text-ink-soft")} strokeWidth={stroke} aria-hidden />
        </p>
        <p className="mt-1 line-clamp-6 text-[13px] leading-snug break-words">{text}</p>
        <div className="relative mt-3 aspect-[4/5] w-[68%] overflow-hidden rounded-[10px] border border-line bg-bg-alt">
          <Reel className="absolute inset-0 object-[50%_46%]" />
          <MuteChip />
        </div>
        <div className="mt-3 flex items-center gap-5 text-ink" aria-hidden>
          <Heart className={icon} strokeWidth={stroke} />
          <MessageCircle className={icon} strokeWidth={stroke} />
          <Repeat2 className={icon} strokeWidth={stroke} />
          <Send className={icon} strokeWidth={stroke} />
        </div>
      </div>
    </Frame>
  );
}

/** X: 280 characters. Anything past the limit is marked the way X's own composer marks it. */
function XPost({ text }: { text: string }) {
  const chars = Array.from(text);
  const limit = captionLimit.x ?? 280;
  const fits = chars.slice(0, limit).join("");
  const extra = chars.slice(limit).join("");
  return (
    <Frame className="grid grid-cols-[34px_minmax(0,1fr)] gap-x-3 px-3.5 py-3.5">
      <BrandAvatar size={34} />
      <div className="min-w-0">
        <p className="flex min-w-0 items-baseline gap-1.5 text-[13.5px] leading-tight">
          <span className="shrink-0 font-semibold">{demoBrand.name}</span>
          <span className="truncate text-ink-soft">@{demoBrand.handle} · now</span>
        </p>
        <p className="mt-1 text-[13px] leading-snug break-words">
          {fits}
          {extra && (
            <mark className="rounded-[3px] text-ink" style={{ background: "color-mix(in oklab, var(--k-pop1) 55%, var(--k-surface))" }}>
              {extra}
            </mark>
          )}
        </p>
        <div className="relative mt-3 aspect-video overflow-hidden rounded-xl border border-line bg-bg-alt">
          <Reel className="absolute inset-0 object-[50%_56%]" />
          <MuteChip />
        </div>
        <div className="mt-3 flex items-center justify-between pr-1 text-ink-soft" aria-hidden>
          <MessageCircle className="size-4" strokeWidth={stroke} />
          <Repeat2 className="size-4" strokeWidth={stroke} />
          <Heart className="size-4" strokeWidth={stroke} />
          <ChartNoAxesColumn className="size-4" strokeWidth={stroke} />
          <Bookmark className="size-4" strokeWidth={stroke} />
        </div>
      </div>
    </Frame>
  );
}

/** LinkedIn: koLink publishes text only, so the attachment is shown as left out. */
function LinkedInPost({ text }: { text: string }) {
  return (
    <Frame>
      <header className="flex items-center gap-2.5 px-3.5 pt-3">
        <BrandAvatar size={38} square />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] leading-tight font-semibold">{demoBrand.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] leading-tight text-ink-soft">
            Company Page · now · <Earth className="size-3" strokeWidth={1.8} aria-hidden />
          </p>
        </div>
        <MoreHorizontal className={cn(icon, "text-ink-soft")} strokeWidth={stroke} aria-hidden />
      </header>
      <p className="line-clamp-6 px-3.5 pt-2.5 text-[13px] leading-snug break-words">{text}</p>
      <div className="mx-3.5 mt-3 mb-3 flex items-center gap-3 rounded-lg border border-dashed border-line-strong bg-bg-alt px-3 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-surface text-ink-soft" aria-hidden>
          <ImageOff className="size-4" strokeWidth={1.6} />
        </span>
        <p className="min-w-0 text-[12.5px] leading-snug">
          <span className="font-medium">drop-04.mp4 · media not included</span>
          <span className="mono mt-0.5 block text-[11px] text-ink-soft">LinkedIn posts are text only</span>
        </p>
      </div>
      {/* Four actions: icon over label on phones (as LinkedIn's app lays them out), side by side when there's room. */}
      <div className="grid grid-cols-4 border-t border-line px-1 py-1 text-[11px] font-medium text-ink-soft sm:text-[12px]" aria-hidden>
        <ActionCell Icon={ThumbsUp} label="Like" stacked />
        <ActionCell Icon={MessageCircle} label="Comment" stacked />
        <ActionCell Icon={Repeat2} label="Repost" stacked />
        <ActionCell Icon={Send} label="Send" stacked />
      </div>
    </Frame>
  );
}

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("overflow-hidden rounded-xl border border-line bg-surface text-ink", className)}>{children}</div>;
}

function ActionCell({ Icon, label, stacked = false }: { Icon: typeof Heart; label: string; stacked?: boolean }) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center justify-center",
        stacked ? "h-11 flex-col gap-0.5 sm:h-9 sm:flex-row sm:gap-1.5" : "h-9 gap-1.5",
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={stroke} />
      <span className="truncate">{label}</span>
    </span>
  );
}

function MuteChip() {
  return (
    <span
      aria-hidden
      className="absolute right-2.5 bottom-2.5 grid size-6 place-items-center rounded-full text-white"
      style={{ background: scrim(0.62) }}
    >
      <VolumeX className="size-3" strokeWidth={2} />
    </span>
  );
}
