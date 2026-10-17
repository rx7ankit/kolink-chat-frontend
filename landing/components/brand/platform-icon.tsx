import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";
import { platformById, type PlatformId } from "@/lib/platforms";

type Props = {
  id: PlatformId;
  /** "glyph" is the bare mark; "tile" sits the mark on a filled rounded square. */
  variant?: "glyph" | "tile";
  size?: number;
  className?: string;
  title?: string;
};

/**
 * Brand mark that follows the Studio "platform icons" option: brand colors by
 * default, palette ink when html[data-icons="mono"] (see globals.css).
 */
export function PlatformIcon({ id, variant = "glyph", size = 20, className, title }: Props) {
  const p = platformById[id];
  const style = {
    "--pi-color": p.color,
    "--pi-tile": p.tile ?? p.color,
    width: size,
    height: size,
  } as CSSProperties;

  const svg = (
    <svg
      viewBox="0 0 24 24"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("pi-glyph block shrink-0", variant === "tile" && "pi-on-tile")}
      style={variant === "tile" ? { width: "58%", height: "58%" } : undefined}
    >
      <path d={p.path} fill="currentColor" />
    </svg>
  );

  if (variant === "glyph") {
    return (
      <span className={cn("pi inline-flex items-center justify-center", className)} style={style}>
        {svg}
      </span>
    );
  }

  return (
    <span
      className={cn("pi pi-tile inline-flex items-center justify-center rounded-[28%]", className)}
      style={style}
    >
      {svg}
    </span>
  );
}
