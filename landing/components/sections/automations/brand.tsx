import Image from "next/image";

import { Photo } from "@/components/media/photo";
import { cn } from "@/lib/cn";
import { demoBrand, videos, type PhotoId } from "@/lib/media";

/**
 * The demo brand in post mockups (§04, §05): a round accent disc with the initial,
 * koLink style. LinkedIn Company Pages use a rounded square, so `square` is offered.
 */
export function BrandAvatar({ size = 32, square = false, className }: { size?: number; square?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center bg-accent font-semibold text-accent-ink select-none",
        square ? "rounded-[22%]" : "rounded-full",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42), letterSpacing: "-0.02em" }}
    >
      {demoBrand.name.charAt(0)}
    </span>
  );
}

/** A dark wash for chrome drawn over photos and video (scrims, the mute chip). Fixed, not a palette token: it always sits on media. */
export const scrim = (alpha: number) => `rgb(18 22 18 / ${alpha})`;

/** "reel" is the Drop 04 video's poster frame; anything else is a stock photo. */
export type ThumbSource = "reel" | PhotoId;

/**
 * A small still of a post's media (board rows, the post page, the composer's
 * attachment). Fills its parent like <Photo>: the parent sets size, rounding and
 * overflow-hidden. Always decorative: the row beside it names the post.
 */
export function MediaThumb({ src, sizes, className }: { src: ThumbSource; sizes: string; className?: string }) {
  if (src !== "reel") return <Photo id={src} alt="" sizes={sizes} className={className} />;
  const v = videos.linenReel;
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
