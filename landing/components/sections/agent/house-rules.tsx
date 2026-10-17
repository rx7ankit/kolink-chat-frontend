import { Emphasis } from "@/components/ui/emphasis";
import { cn } from "@/lib/cn";

import { houseRules } from "./data";

/** The three written rules that matter most, set large with quiet numerals. */
export function HouseRules({ className }: { className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="eyebrow">House rules</p>
      <h3 className="font-display mt-4 text-[clamp(28px,2.6vw,38px)] leading-[1.08] text-ink">
        <Emphasis text="What it answers, and *when it stops.*" />
      </h3>
      <ol className="mt-10 border-t border-line">
        {houseRules.map((rule, i) => (
          <li
            key={rule}
            className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-baseline gap-x-2 border-b border-line py-5 md:py-6"
          >
            <span className="mono text-[11px] text-ink-soft tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-[17px] leading-[1.45] text-ink md:text-[19px]">{rule}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
