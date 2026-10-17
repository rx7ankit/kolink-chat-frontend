import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";

import { PlatformIcon } from "@/components/brand/platform-icon";
import { Photo } from "@/components/media/photo";
import { cn } from "@/lib/cn";
import { demoBrand, photos, type PhotoId } from "@/lib/media";
import type { PlatformId } from "@/lib/platforms";

import type { CatalogItem } from "./data";

/** The demo brand's avatar: a round accent disc with the initial, koLink style. */
export function BrandAvatar({
  size = 32,
  platform,
  className,
}: {
  size?: number;
  /** A small brand-colored platform badge on the avatar's corner. */
  platform?: PlatformId;
  className?: string;
}) {
  const badge = Math.max(14, Math.round(size * 0.42));
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }} aria-hidden>
      <span
        className="grid h-full w-full place-items-center rounded-full bg-accent font-semibold text-accent-ink"
        style={{ fontSize: Math.round(size * 0.42), letterSpacing: "-0.02em" }}
      >
        {demoBrand.name.charAt(0)}
      </span>
      {platform && (
        <span
          className="absolute -right-0.5 -bottom-0.5 grid place-items-center rounded-full bg-surface shadow-[0_0_0_1.5px_var(--k-surface)]"
          style={{ width: badge, height: badge }}
        >
          <PlatformIcon id={platform} size={Math.round(badge * 0.78)} />
        </span>
      )}
    </span>
  );
}

/**
 * The top of a fresh DM thread, the way Instagram and Messenger open one: the
 * account the customer is writing to, its handle and a profile button.
 */
export function ThreadIntro({ platform }: { platform: "instagram" | "messenger" }) {
  return (
    <div className="flex flex-col items-center px-5 pt-2 pb-5 text-center" aria-hidden>
      <BrandAvatar size={60} />
      <p className="mt-3 text-[16px] leading-tight font-semibold text-ink">{demoBrand.name}</p>
      <p className="mono mt-1 text-[11px] text-ink-soft">
        {platform === "instagram" ? `${demoBrand.handle} · Instagram` : "Facebook Page · Messenger"}
      </p>
      <span className="mt-3 inline-flex h-7 items-center rounded-full bg-bg-alt px-3.5 text-[12px] font-medium text-ink">
        View profile
      </span>
    </div>
  );
}

/** An Instagram post the customer shared into the DM: header, 4:5 photo, caption. */
export function SharedPost({
  photo,
  caption,
  className,
}: {
  photo: PhotoId;
  caption: string;
  className?: string;
}) {
  return (
    <figure
      className={cn("w-[200px] overflow-hidden rounded-2xl rounded-br-sm border border-line bg-surface", className)}
      aria-label={`Shared post from @${demoBrand.handle}: ${photos[photo].alt}`}
    >
      <figcaption className="flex items-center gap-2 px-2.5 py-2">
        <BrandAvatar size={20} />
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink">{demoBrand.handle}</span>
        <PlatformIcon id="instagram" size={12} />
      </figcaption>
      <div className="aspect-[4/5] overflow-hidden bg-bg-alt">
        <Photo id={photo} alt="" sizes="200px" />
      </div>
      <div className="flex items-center gap-2.5 px-2.5 pt-2 text-ink" aria-hidden>
        <Heart className="size-3.5" strokeWidth={1.75} />
        <MessageCircle className="size-3.5" strokeWidth={1.75} />
        <Send className="size-3.5" strokeWidth={1.75} />
        <Bookmark className="ml-auto size-3.5" strokeWidth={1.75} />
      </div>
      <p className="truncate px-2.5 pt-1.5 pb-2.5 text-[12px] leading-snug text-ink">
        <span className="font-semibold">{demoBrand.handle}</span> <span className="text-ink-soft">{caption}</span>
      </p>
    </figure>
  );
}

/** One catalog row as an Instagram / Messenger swipe card: photo, name, price and note. */
export function ProductCard({
  item,
  className,
  sizes = "160px",
}: {
  item: CatalogItem;
  className?: string;
  sizes?: string;
}) {
  return (
    <div className={cn("flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface", className)}>
      <div className="aspect-square shrink-0 overflow-hidden bg-bg-alt">
        <Photo id={item.photo} alt="" sizes={sizes} />
      </div>
      <div className="px-2.5 pt-2 pb-2.5">
        <p className="truncate text-[13px] leading-tight font-semibold text-ink">{item.name}</p>
        <p className="mono mt-1 text-[11px] leading-[1.35] text-ink-soft">
          <span className="text-ink">{item.price}</span>
          <span className="block truncate">{item.note}</span>
        </p>
      </div>
    </div>
  );
}
