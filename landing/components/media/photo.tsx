import Image from "next/image";

import { cn } from "@/lib/cn";
import { photos, type PhotoId } from "@/lib/media";

/**
 * A stock photo from lib/media.ts, cropped to fill its box. Give the wrapper an
 * aspect ratio (aspect-[4/5], aspect-square …) or explicit size; `sizes` keeps
 * downloads small on phones.
 */
export function Photo({
  id,
  className,
  sizes = "(max-width: 768px) 90vw, 420px",
  eager = false,
  alt,
}: {
  id: PhotoId;
  className?: string;
  sizes?: string;
  /** Above-the-fold images: load eagerly with high fetch priority (Next 16 deprecates `priority`). */
  eager?: boolean;
  /** Override the default alt; pass "" when the photo is purely decorative next to its caption. */
  alt?: string;
}) {
  const p = photos[id];
  return (
    <Image
      src={p.src}
      width={p.width}
      height={p.height}
      alt={alt ?? p.alt}
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
