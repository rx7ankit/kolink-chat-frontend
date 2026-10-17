"use client";

import type { ReactNode } from "react";

import { openStudio } from "@/components/studio/design-studio";
import { cn } from "@/lib/cn";
import { fontPairings } from "@/lib/studio/font-pairings";
import { palettes } from "@/lib/studio/palettes";
import { useLook } from "@/lib/studio/store";
import type { LineStyle } from "@/lib/transit/geometry";

import { useAnchorClick } from "./use-jump";

const drawn: Record<LineStyle, string> = {
  octilinear: "octilinear",
  orthogonal: "orthogonal",
  cord: "as cords",
};

/** "Set in {pairing}[ with Instrument Serif italics]. Printed in {palette}. Lines drawn {style}." — live from the Studio. */
export function Colophon({ className }: { className?: string }) {
  const look = useLook();
  const pairing = fontPairings.find((f) => f.id === look.font) ?? fontPairings[0];
  const palette = palettes.find((p) => p.id === look.palette) ?? palettes[0];
  return (
    <p className={cn("mono text-[11px] leading-[1.7] text-balance text-ink-soft", className)}>
      Set in {pairing.displayLabel === pairing.bodyLabel ? pairing.name : `${pairing.displayLabel} & ${pairing.bodyLabel}`}
      {look.emphasis === "serif" ? " with Instrument Serif italics" : ""}. Printed in {palette.name}
      {look.accent ? " with a custom accent" : ""}. Lines drawn {drawn[look.lines]}.
    </p>
  );
}

/** Opens the Design Studio drawer. */
export function StudioLauncher({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openStudio}
      className={cn(
        "mono inline-flex min-h-11 items-center gap-2 text-[11px] tracking-[0.08em] text-ink uppercase underline-offset-4 hover:underline",
        className,
      )}
    >
      Design Studio <span aria-hidden>◐</span>
    </button>
  );
}

/** In-page link that scrolls through Lenis and lands the section under the nav. */
export function AnchorLink({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const onAnchor = useAnchorClick();
  return (
    <a href={`#${id}`} onClick={(e) => onAnchor(e, id)} className={className}>
      {children}
    </a>
  );
}
