import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** h3 block used inside §04 and §05: mono kicker + display title. */
export function SubHead({ kicker, title, className }: { kicker: ReactNode; title: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="eyebrow">{kicker}</p>
      <h3 className="font-display mt-3 text-[26px] leading-[1.04] md:text-[30px]">{title}</h3>
    </div>
  );
}
