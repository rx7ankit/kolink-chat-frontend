"use client";

import { useState } from "react";
import { Clapperboard, ImageIcon } from "lucide-react";

import { publicMediaUrl } from "@/lib/broadcast-media";
import { cn } from "@/lib/utils";

export function PostThumb({
  src,
  reel,
  className,
}: {
  src: string | null | undefined;
  reel?: boolean;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const url = publicMediaUrl(src);
  const Icon = reel ? Clapperboard : ImageIcon;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]",
        className,
      )}
    >
      {url && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <Icon className="h-1/3 w-1/3 text-white/90" />
      )}
      {reel && url && !broken ? (
        <span className="absolute right-1 top-1 rounded-md bg-black/55 p-0.5">
          <Clapperboard className="h-3 w-3 text-white" />
        </span>
      ) : null}
    </span>
  );
}
