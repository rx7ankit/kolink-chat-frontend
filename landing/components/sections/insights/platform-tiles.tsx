"use client";

import { useId, useState } from "react";

import { Roundel } from "@/components/transit/roundel";

import { platformTiles, type PlatformTile } from "./data";
import { Letter } from "./panel";
import { RollNumber } from "./roll-number";

function Tile({ tile, index }: { tile: PlatformTile; index: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [hover, setHover] = useState(false);
  return (
    <div
      role="group"
      aria-labelledby={`${uid}-name`}
      className="col-span-2 min-w-0 bg-surface p-4 sm:p-6 md:col-span-4"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <div className="flex items-center gap-3">
        <Roundel platform={tile.id} size={32} active={hover} />
        <h4 id={`${uid}-name`} className="min-w-0 truncate text-[15px] leading-tight font-semibold text-ink">
          {tile.name}
        </h4>
      </div>
      <dl className="mt-5 border-b border-line">
        {tile.metrics.map(([label, value], i) => (
          <div key={label} className="flex items-baseline justify-between gap-4 border-t border-line py-2.5">
            <dt className="min-w-0 text-[13px] leading-snug text-ink-soft">{label}</dt>
            <dd className="font-display shrink-0 text-[20px] leading-none text-ink">
              <RollNumber value={value} delay={0.1 * index + 0.05 * i} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** (F) Per-platform account tiles: only the metrics the real tiles show. Rendered as grid cells. */
export function PlatformTiles() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <>
      <div className="col-span-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-surface px-4 py-3.5 sm:px-6 md:col-span-12">
        <h3 id={`${uid}-f`} className="flex items-baseline gap-2.5 text-[15px] leading-tight font-semibold text-ink">
          <Letter>F</Letter>
          Account insights
        </h3>
        <p className="mono text-[11px] leading-tight tracking-[0.06em] text-ink-soft uppercase">Shown for connected accounts</p>
      </div>
      {platformTiles.map((t, i) => (
        <Tile key={t.id} tile={t} index={i} />
      ))}
    </>
  );
}
