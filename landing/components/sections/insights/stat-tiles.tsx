import { Glyph } from "@/components/transit/glyph";

import { stats } from "./data";
import { RollNumber } from "./roll-number";

/**
 * The four headline tiles across the top of the sheet. Rendered as grid cells.
 * Each tile is a size container: the figure scales with the tile's own width
 * (23cqi ≈ room for "12,840" even in the widest Studio display face).
 */
export function StatTiles() {
  return (
    <>
      {stats.map((s, i) => (
        <div key={s.label} className="@container min-w-0 bg-surface px-4 py-5 sm:px-6 sm:py-6 md:col-span-3">
          <p className="eyebrow leading-tight">{s.label}</p>
          <p className="font-display mt-4 text-[clamp(24px,23cqi,52px)] text-ink">
            <RollNumber value={s.value} delay={0.08 * i} />
          </p>
          <p className="mt-3 flex items-center gap-2 text-[13px] leading-snug text-ink-soft">
            {s.team && <Glyph handler="team" size={9} />}
            {s.hint}
          </p>
        </div>
      ))}
    </>
  );
}
