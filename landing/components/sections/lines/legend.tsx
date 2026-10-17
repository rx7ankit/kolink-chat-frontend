import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { footnotes, pillEdge, pillFill } from "./data";

const ink = "var(--k-ink)";

/** Tiny specimens of the map's own marks, so the key is literally the map's language. */
function Sample({ children }: { children: ReactNode }) {
  return (
    <svg width={40} height={18} viewBox="0 0 40 18" className="shrink-0 overflow-visible" aria-hidden>
      {children}
    </svg>
  );
}

const pill = <rect x={15} y={1} width={10} height={16} rx={5} fill={pillFill} stroke={pillEdge} strokeWidth={1} />;

const items: { sample: ReactNode; term: string }[] = [
  {
    term: "Stops here",
    // Same layering as the map: line behind the pill, a notch in its outline, then the tick.
    sample: (
      <>
        <line x1={2} x2={38} y1={8} y2={8} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
        {pill}
        <line x1={13.5} x2={26.5} y1={8} y2={8} stroke={pillFill} strokeWidth={5} />
        <line x1={12} x2={28} y1={8} y2={8} stroke={ink} strokeWidth={2.5} />
        <rect x={18.75} y={8} width={2.5} height={8} rx={0.75} fill={ink} />
      </>
    ),
  },
  {
    term: "Passes by",
    sample: (
      <>
        <line x1={2} x2={38} y1={8} y2={8} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
        {pill}
      </>
    ),
  },
  {
    term: "Conversation only",
    sample: <line x1={2} x2={38} y1={9} y2={9} stroke={ink} strokeWidth={2.5} strokeDasharray="6 4" />,
  },
];

/** One-line map key: three marks, three words of explanation. Lives in the map's title bar. */
export function MapKey({ className }: { className?: string }) {
  return (
    <ul aria-hidden className={cn("flex flex-wrap items-center gap-x-6 gap-y-2", className)}>
      {items.map((it) => (
        <li key={it.term} className="flex items-center gap-2.5">
          <Sample>{it.sample}</Sample>
          <span>{it.term}</span>
        </li>
      ))}
    </ul>
  );
}

/** Numbered notes shared by the map and the matrix. */
export function Footnotes({ className }: { className?: string }) {
  return (
    <ol className={cn("flex flex-wrap gap-x-10 gap-y-2 border-b border-line pt-4 pb-5", className)}>
      {footnotes.map((f) => (
        <li key={f.n} id={`lines-note-${f.n}`} className="flex min-w-0 gap-2 text-[13px] leading-snug text-ink-soft">
          <span className="mono w-3 shrink-0 pt-px text-[11px] text-ink">{f.n}</span>
          <span className="min-w-0">{f.text}</span>
        </li>
      ))}
    </ol>
  );
}
