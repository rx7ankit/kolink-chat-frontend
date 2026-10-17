"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Bookmark, Heart, ImageOff, MessageCircle, Play, Repeat2, Send, ThumbsUp } from "lucide-react";
import { memo, useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { PlatformIcon } from "@/components/brand/platform-icon";
import { Photo } from "@/components/media/photo";
import { Reel } from "@/components/media/reel";
import { cn } from "@/lib/cn";
import { publishTargets } from "@/lib/capabilities";
import type { PublishTag } from "@/lib/hero/counters";
import type { Media } from "@/lib/hero/types";
import { demoBrand, videos } from "@/lib/media";
import type { PlatformId } from "@/lib/platforms";

import { useDraftText } from "./draft-store";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ small parts */

/** The demo brand's avatar: a round accent disc with the initial (LinkedIn Company Pages: rounded square). */
export function HeroAvatar({ size, square = false, className }: { size: number; square?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center bg-accent leading-none font-semibold text-accent-ink select-none",
        square ? "rounded-[24%]" : "rounded-full",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(6, Math.round(size * 0.44)), letterSpacing: "-0.02em" }}
    >
      {demoBrand.name.charAt(0)}
    </span>
  );
}

/**
 * The post's still, filling its parent: a video post shows its own cover frame everywhere it
 * appears (the Reel, and the same clip on Facebook, Threads and X), a photo post its photo.
 * Always decorative.
 */
export function Still({ media, sizes, className }: { media: Media; sizes: string; className?: string }) {
  if (media.video) {
    const v = videos[media.video];
    return (
      <Image
        src={v.poster}
        width={v.width}
        height={v.height}
        alt=""
        sizes={sizes}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
  return <Photo id={media.photo} alt="" sizes={sizes} className={className} />;
}

/** A small round play mark for video stills. */
export function PlayBadge({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("absolute grid place-items-center rounded-full bg-[#141814]/55 text-white", className)}
      style={{ width: size, height: size }}
    >
      <Play size={Math.round(size * 0.5)} strokeWidth={0} fill="currentColor" className="translate-x-[6%]" />
    </span>
  );
}

/** LinkedIn publishing is text-only: a paper tile with a few text lines instead of a photo. */
export function TextTile({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex h-full w-full flex-col justify-center gap-[12%] bg-bg-alt px-[20%]", className)}>
      <span className="h-[6%] min-h-px w-full rounded-full bg-ink-soft/45" />
      <span className="h-[6%] min-h-px w-[82%] rounded-full bg-ink-soft/45" />
      <span className="h-[6%] min-h-px w-[60%] rounded-full bg-ink-soft/45" />
    </span>
  );
}

/**
 * A row or bubble thumbnail of the post as that network shows it: the Reel cover on
 * Instagram, the photo (with a play mark for video) elsewhere, a text tile on LinkedIn.
 * The parent sets size, rounding and overflow-hidden.
 */
export function MediaThumb({ media, platform, sizes, play = true }: { media: Media | null; platform?: PlatformId; sizes: string; play?: boolean }) {
  if (!media || platform === "linkedin") return <TextTile />;
  return (
    <>
      <Still media={media} sizes={sizes} />
      {play && media.kind === "video" && <PlayBadge size={12} className="right-[3px] bottom-[3px]" />}
    </>
  );
}

/** Short native-format labels for chips (the rows carry the full ones). */
export function formatShort(p: PlatformId, media: Media | null): string {
  const video = media?.kind === "video";
  switch (p) {
    case "instagram":
      return !media ? "Needs media" : media.igFormat === "reel" ? "Reel" : "Post";
    case "facebook":
      return video ? "Video" : media ? "Photo" : "Text";
    case "threads":
    case "x":
      return video ? "Video" : media ? "Image" : "Text";
    case "linkedin":
      return "Text only";
    default:
      return "";
  }
}

/* ------------------------------------------------------------------ native post mockups */

/**
 * Card header: the page's avatar wearing the network's own mark as a badge (the cards overlap
 * on their left edges, so the mark sits right of the avatar), then the page name.
 */
function Who({ platform, name, sub, square, light }: { platform: PlatformId; name: string; sub: string; square?: boolean; light?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-[5px]">
      <span className="relative shrink-0">
        <HeroAvatar size={16} square={square} />
        <span
          className={cn(
            "absolute -right-[4px] -bottom-[3px] grid size-[11px] place-items-center rounded-full",
            light ? "bg-white" : "bg-surface shadow-[0_0_0_1px_var(--k-line)]",
          )}
        >
          <PlatformIcon id={platform} size={8} />
        </span>
      </span>
      <div className="min-w-0 pl-[2px] leading-[1.1]">
        <p className={cn("truncate text-[8px] font-semibold", light ? "text-white" : "text-ink")}>{name}</p>
        <p className={cn("truncate text-[7px]", light ? "text-white/75" : "text-ink-soft")}>{sub}</p>
      </div>
    </div>
  );
}

/** A clamped caption. Padding goes on the wrapper: on the clamped box it would show a sliver of the next line. */
function Caption({ text, lines, className }: { text: string; lines: number; className?: string }) {
  return (
    <div className={cn("text-[7.5px] leading-[1.3] break-words text-ink", className)}>
      <p style={{ display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{text}</p>
    </div>
  );
}

function Pic({ media, className }: { media: Media; className?: string }) {
  return (
    <div className={cn("relative min-h-0 overflow-hidden", className)}>
      <Still media={media} sizes="120px" />
      {media.kind === "video" && <PlayBadge size={16} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
    </div>
  );
}

const ICON = { size: 8, strokeWidth: 1.8 } as const;

function FacebookBody({ media, text }: { media: Media; text: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-1.5 pt-1.5">
        <Who platform="facebook" name={demoBrand.name} sub="Just now · Public" />
      </div>
      <Caption text={text} lines={2} className="px-1.5 py-1" />
      <Pic media={media} className="flex-1" />
      <div className="flex items-center justify-around border-t border-line px-1 py-1 text-[7px] text-ink-soft">
        <span className="inline-flex items-center gap-0.5">
          <ThumbsUp size={7} strokeWidth={1.8} /> Like
        </span>
        <span className="inline-flex items-center gap-0.5">
          <MessageCircle size={7} strokeWidth={1.8} /> Comment
        </span>
      </div>
    </div>
  );
}

function ThreadsBody({ media, text }: { media: Media; text: string }) {
  return (
    <div className="flex h-full flex-col px-1.5 pt-1.5 pb-1.5">
      <Who platform="threads" name={demoBrand.handle} sub="now" />
      <div className="relative mt-1 flex min-h-0 flex-1 flex-col pl-[19px]">
        <span aria-hidden className="absolute top-0 bottom-1 left-[7px] w-px bg-line-strong" />
        <Caption text={text} lines={3} />
        <Pic media={media} className="mt-1 flex-1 rounded-[6px]" />
        <div className="mt-1 flex items-center gap-1.5 text-ink">
          <Heart {...ICON} />
          <MessageCircle {...ICON} />
          <Repeat2 {...ICON} />
          <Send {...ICON} />
        </div>
      </div>
    </div>
  );
}

function XBody({ media, text }: { media: Media; text: string }) {
  return (
    <div className="flex h-full flex-col px-1.5 pt-1.5 pb-1.5">
      <Who platform="x" name={demoBrand.name} sub={`@${demoBrand.handle} · now`} />
      <Caption text={text} lines={3} className="mt-1" />
      <Pic media={media} className="mt-1 aspect-video shrink-0 rounded-[6px] shadow-[0_0_0_1px_var(--k-line)]" />
      <div className="mt-auto flex items-center justify-between px-0.5 pt-1 text-ink-soft">
        <MessageCircle {...ICON} />
        <Repeat2 {...ICON} />
        <Heart {...ICON} />
        <Bookmark {...ICON} />
      </div>
    </div>
  );
}

function LinkedInBody({ text, withMedia }: { text: string; withMedia: boolean }) {
  return (
    <div className="flex h-full flex-col px-1.5 pt-1.5 pb-1.5">
      <Who platform="linkedin" name={demoBrand.name} sub="Company · now" square />
      <Caption text={text} lines={6} className="mt-1.5" />
      <div className="mt-auto">
        {withMedia && (
          <span className="flex items-center justify-center gap-1 rounded-full border border-dashed border-line-strong px-1 py-[3px] text-[7px] leading-none whitespace-nowrap text-ink-soft">
            <ImageOff size={7} strokeWidth={1.8} aria-hidden /> Media not included
          </span>
        )}
        <div className="mt-1 flex items-center justify-around border-t border-line pt-1 text-[7px] text-ink-soft">
          <span className="inline-flex items-center gap-0.5">
            <ThumbsUp size={7} strokeWidth={1.8} /> Like
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Repeat2 size={7} strokeWidth={1.8} /> Repost
          </span>
        </div>
      </div>
    </div>
  );
}

const ratioOf = (p: PlatformId, media: Media | null): number =>
  p === "instagram" ? (media?.igFormat === "reel" && media.video ? 0.5625 : 0.58) : p === "facebook" || p === "x" ? 0.64 : 0.6;

/** Shown, or faded out and then hidden outright (out of the accessibility tree and of copied text). */
const reveal = (show: boolean) =>
  show ? { opacity: 1, visibility: "visible" as const } : { opacity: 0, transitionEnd: { visibility: "hidden" as const } };

/** Fades a layer in or out with the phase; `delay` only applies on the way in. */
function Phase({ show, still, delay = 0, className, children }: { show: boolean; still: boolean; delay?: number; className?: string; children: ReactNode }) {
  return (
    <motion.div
      aria-hidden={!show || undefined}
      className={cn("absolute", className)}
      initial={false}
      animate={reveal(show)}
      transition={{ duration: still ? 0 : show ? 0.3 : 0.14, delay: still || !show ? 0 : delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * The lead card: the draft's attachment, and the same element as the Instagram post once it
 * publishes. Its media never cuts: the still stays put while the card around it changes, a Reel's
 * clip fades in over its own poster, and a feed photo is clipped into the post's frame.
 */
function LeadBody({ media, text, published, still }: { media: Media | null; text: string; published: boolean; still: boolean }) {
  // Starting a <video> can stall a frame or two, so the Reel's player is set up (unseen) while the
  // draft is still being written, never on the publish beat itself.
  const [warm, setWarm] = useState(published);
  useEffect(() => {
    if (warm) return;
    const t = window.setTimeout(() => setWarm(true), 700);
    return () => window.clearTimeout(t);
  }, [warm]);
  if (!media) return <TextTile />;
  const reel = media.igFormat === "reel" && !!media.video;
  return (
    <>
      {/* A feed photo is clipped into the post's frame (no re-crop, no scaling of the picture). */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={reel ? undefined : { clipPath: published ? "inset(26px 0px 34px 0px)" : "inset(0px 0px 0px 0px)" }}
        transition={{ duration: still ? 0 : 0.42, ease: EASE }}
      >
        {/* The Reel plays under its own poster from early on; publishing lifts the poster off it. */}
        {reel && media.video && warm && (
          <div className="absolute inset-0">
            <Reel id={media.video} className="pointer-events-none" />
          </div>
        )}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: reel && warm && published ? 0 : 1 }}
          transition={{ duration: still ? 0 : 0.4, delay: still ? 0 : 0.45 }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={media.video ?? media.photo}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
              transition={{ duration: still ? 0 : 0.3 }}
            >
              <Still media={media} sizes="140px" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Draft: the attachment as it sits in the composer. */}
      <Phase show={!published} still={still} className="inset-0">
        {media.kind === "video" && (
          <>
            <PlayBadge size={22} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <span className="mono absolute bottom-1.5 left-1.5 rounded-full bg-[#141814]/55 px-1.5 text-[10px] leading-4 text-white">0:08</span>
          </>
        )}
      </Phase>

      {/* Published: the native Instagram chrome settles in around the same picture. */}
      {reel ? (
        <Phase show={published} still={still} delay={0.3} className="inset-0">
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#141814]/70 to-transparent" />
          <span className="absolute top-1.5 left-2 text-[8px] font-semibold text-white">Reels</span>
          <div className="absolute right-1.5 bottom-9 flex flex-col items-center gap-1.5 text-white">
            <Heart {...ICON} />
            <MessageCircle {...ICON} />
            <Send {...ICON} />
          </div>
          <div className="absolute inset-x-1.5 bottom-1.5">
            <Who platform="instagram" name={demoBrand.handle} sub="Original audio" light />
            <Caption text={text} lines={2} className="mt-1 text-white/90" />
          </div>
        </Phase>
      ) : (
        <Phase show={published} still={still} delay={0.24} className="inset-0">
          <div className="absolute inset-x-1.5 top-1.5">
            <Who platform="instagram" name={demoBrand.handle} sub={demoBrand.name} />
          </div>
          <div className="absolute inset-x-1.5 bottom-1.5">
            <div className="flex items-center gap-1 text-ink">
              <Heart {...ICON} />
              <MessageCircle {...ICON} />
              <Send {...ICON} />
              <Bookmark {...ICON} className="ml-auto" />
            </div>
            <Caption text={text} lines={1} className="pt-0.5" />
          </div>
        </Phase>
      )}
    </>
  );
}

const LEAD: PlatformId = "instagram";
const DEAL = { type: "spring", stiffness: 230, damping: 27, mass: 0.9 } as const;

/** The draft's copy beside its attachment; the only part that follows the typewriter. */
function DraftCopy({ media }: { media: Media | null }) {
  const draft = useDraftText();
  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <HeroAvatar size={24} />
        <div className="min-w-0">
          <p className="truncate text-[13px] leading-tight font-medium text-ink">{demoBrand.name}</p>
          <p className="mono truncate text-[11px] leading-tight text-ink-soft">@{demoBrand.handle}</p>
        </div>
      </div>
      <p className={cn("mt-2.5 line-clamp-3 text-[14px] leading-[1.38] break-words min-[75rem]:mt-3 min-[75rem]:text-[15px]", draft ? "text-ink" : "text-ink-soft")}>
        {draft || "Write a caption…"}
      </p>
      {/* Where it will publish: the marks, plus the two formats worth saying out loud. */}
      <ul className="mt-auto flex min-w-0 flex-wrap gap-1" aria-label="Publishes to">
        {publishTargets.map((p) => {
          const label = p === "instagram" || p === "linkedin";
          return (
            <li
              key={p}
              className={cn(
                "mono inline-flex h-[22px] items-center gap-1 rounded-full border border-line bg-surface text-[10px] whitespace-nowrap text-ink",
                label ? "pr-1.5 pl-1" : "px-[4px]",
              )}
            >
              <PlatformIcon id={p} size={12} />
              <span className={label ? undefined : "sr-only"}>{formatShort(p, media)}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/**
 * The post, from draft to "Published to 5", on one surface. While it is written the pane shows
 * the attachment and the caption; at the publish beat the attachment itself becomes the
 * Instagram post (a layout morph, transforms only) and the other four native posts deal out
 * from behind it into a fanned hand. Instagram Reel plays the clip; Facebook, Threads and X
 * carry the same media; LinkedIn stays text. Nothing is unmounted to an empty pane.
 * The parent must be a size container (cqh/cqw units).
 */
export const PostScene = memo(function PostScene({
  phase,
  media,
  caption,
  tags,
  still,
}: {
  phase: "draft" | "published";
  media: Media | null;
  /** The caption as published (the draft copy follows the live draft instead). */
  caption: string;
  tags: PublishTag[];
  still: boolean;
}) {
  const published = phase === "published";
  const fan = published ? publishTargets.filter((p) => tags.some((t) => t.platform === p && !t.warn) && (p !== LEAD || media)) : [];
  const n = fan.length;
  const mid = (n - 1) / 2;
  const total = fan.reduce((acc, p) => acc + ratioOf(p, media), 0);
  const reel = media?.igFormat === "reel";

  return (
    <div
      className="relative h-full min-w-0"
      role={published ? "img" : undefined}
      aria-label={published ? `Published to ${n} ${n === 1 ? "network" : "networks"}: ${fan.map((p) => formatShort(p, media)).join(", ")}` : undefined}
    >
      <motion.div
        aria-hidden={published || undefined}
        className="absolute inset-y-0 right-0 flex min-w-0 flex-col py-0.5"
        style={{ left: `calc(100cqh * ${ratioOf(LEAD, media)} + 14px)` }}
        initial={false}
        animate={{ ...reveal(!published), x: published ? 10 : 0 }}
        transition={{ duration: still ? 0 : published ? 0.18 : 0.3, ease: EASE }}
      >
        <DraftCopy media={media} />
      </motion.div>

      {/* The cards: in the draft only the lead is in flow (the others wait behind it, unseen). */}
      <div
        className={cn("absolute inset-0 flex", published ? "items-center justify-center gap-1.5" : "items-stretch justify-start")}
        // Published: as tall as the pane allows while all five sit side by side (6px gaps, no overlap,
        // so no card ever hides another's text); the draft's lead fills the pane's height.
        style={{ "--fh": published ? "min(calc(100cqh - 30px), calc((100cqw - 24px) / var(--tot)))" : "100cqh", "--tot": total || 1 } as CSSProperties}
      >
        {publishTargets.map((p) => {
          const lead = p === LEAD;
          const at = fan.indexOf(p);
          const shown = lead ? !!media && (!published || at >= 0) : at >= 0;
          const flow = published ? at >= 0 : lead;
          const off = at - mid;
          const dealt = published && at >= 0 && !still;
          const delay = lead || still ? 0 : 0.05 + at * 0.055;
          const t = still ? { duration: 0 } : { ...DEAL, delay };
          return (
            <motion.div
              key={p}
              data-platform={p}
              layout={!still}
              layoutDependency={phase}
              className={cn(
                "shrink-0 overflow-hidden shadow-[0_0_0_1px_var(--k-line),0_1px_2px_rgba(38,43,38,0.05),0_14px_28px_-16px_rgba(38,43,38,0.42)]",
                flow ? "relative" : "absolute top-0 left-0",
                lead && reel ? "bg-[#141814]" : "bg-surface",
              )}
              style={{
                height: "var(--fh)",
                width: `calc(var(--fh) * ${ratioOf(p, media)})`,
                borderRadius: published ? 12 : 14,
                // The lead stays on top: the others leave from behind it and deal out to its right.
                zIndex: lead ? 10 : 9 - Math.max(0, at),
                transformOrigin: "50% 100%",
              }}
              initial={false}
              aria-hidden={!shown || undefined}
              animate={{ ...reveal(shown), rotate: dealt ? off * 1.2 : 0, y: dealt ? off * off * 1.4 : 0 }}
              transition={{ layout: t, rotate: t, y: t, opacity: { duration: still ? 0 : 0.24, delay } }}
            >
              {lead ? (
                <LeadBody media={media} text={caption} published={published} still={still} />
              ) : media ? (
                <>
                  {p === "facebook" && <FacebookBody media={media} text={caption} />}
                  {p === "threads" && <ThreadsBody media={media} text={caption} />}
                  {p === "x" && <XBody media={media} text={caption} />}
                  {p === "linkedin" && <LinkedInBody text={caption} withMedia />}
                </>
              ) : (
                <LinkedInBody text={caption} withMedia={false} />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
