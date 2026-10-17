import { ClipboardPaste, FileSpreadsheet, Link2, Upload, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

import { dock } from "./data";

const icons: Record<(typeof dock)[number]["icon"], LucideIcon> = {
  paste: ClipboardPaste,
  csv: FileSpreadsheet,
  upload: Upload,
  link: Link2,
};

/** The four ways in, as one quiet row of tiles (two by two on phones). */
export function SourceDock({ className }: { className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="eyebrow">Add knowledge</p>
      <ul className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        {dock.map((d) => {
          const Icon = icons[d.icon];
          return (
            <li key={d.main} className="flex min-w-0 flex-col gap-2.5 bg-surface p-3.5">
              <Icon className="size-4 text-accent-text" strokeWidth={1.75} aria-hidden />
              <p className="min-w-0 text-[13px] leading-snug">
                <span className="block font-semibold text-ink">{d.main}</span>
                {d.rest && <span className="mono mt-0.5 block text-[11px] text-ink-soft">{d.rest}</span>}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
