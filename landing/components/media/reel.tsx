"use client";

import { useEffect, useRef } from "react";
import { useInView } from "motion/react";

import { cn } from "@/lib/cn";
import { videos, type VideoId } from "@/lib/media";
import { useMotionPrefs } from "@/lib/studio/store";

/**
 * A silent looping clip (an Instagram Reel in mockups). Plays only while on screen
 * and the tab is visible; shows the poster frame under reduced motion / Studio "Still".
 */
export function Reel({ id = "linenReel", className }: { id?: VideoId; className?: string }) {
  const v = videos[id];
  const ref = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { margin: "120px 0px 120px 0px" });
  const { still } = useMotionPrefs();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => {
      if (inView && !still && document.visibilityState === "visible") el.play().catch(() => {});
      else el.pause();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [inView, still]);

  return (
    <video
      ref={ref}
      className={cn("h-full w-full object-cover", className)}
      src={v.src}
      poster={v.poster}
      width={v.width}
      height={v.height}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={v.alt}
    />
  );
}
