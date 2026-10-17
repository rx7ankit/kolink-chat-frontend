import { cn } from "@/lib/cn";

/**
 * The page-wide legend. Shape carries meaning as well as color, so it survives
 * color-blindness and every palette:
 *   post       filled accent capsule   — your outbound post
 *   incoming   hollow circle           — a customer writing in
 *   automation diamond (pop3)          — answered by a keyword automation
 *   agent      circle (pop2)           — answered by the AI agent
 *   team       rounded square (ink)    — your team answers from the inbox
 *   attention  triangle (pop1)         — handed off, needs a person
 */
export type Handler = "post" | "incoming" | "automation" | "agent" | "team" | "attention";

export const handlerLabel: Record<Handler, string> = {
  post: "Your post",
  incoming: "Customer writes in",
  automation: "Automation",
  agent: "AI agent",
  team: "Your team",
  attention: "Needs attention",
};

/** SVG markup for a handler glyph centred on (0,0); use inside an <svg> or <g transform>. */
export function GlyphShape({ handler, size = 12 }: { handler: Handler; size?: number }) {
  const s = size / 2;
  const stroke = { stroke: "var(--k-ink)", strokeWidth: 1.5, vectorEffect: "non-scaling-stroke" as const };
  switch (handler) {
    case "post":
      return <rect x={-s * 1.6} y={-s * 0.8} width={s * 3.2} height={s * 1.6} rx={s * 0.8} fill="var(--k-accent)" {...stroke} />;
    case "incoming":
      return <circle r={s * 0.85} fill="var(--k-surface)" {...stroke} />;
    case "automation":
      return <rect x={-s * 0.72} y={-s * 0.72} width={s * 1.44} height={s * 1.44} transform="rotate(45)" fill="var(--k-pop3)" {...stroke} />;
    case "agent":
      return <circle r={s * 0.85} fill="var(--k-pop2)" {...stroke} />;
    case "team":
      return <rect x={-s * 0.8} y={-s * 0.8} width={s * 1.6} height={s * 1.6} rx={s * 0.35} fill="var(--k-ink)" {...stroke} />;
    case "attention":
      return <path d={`M0 ${-s} L${s * 0.95} ${s * 0.75} L${-s * 0.95} ${s * 0.75}Z`} fill="var(--k-pop1)" strokeLinejoin="round" {...stroke} />;
  }
}

/** Standalone inline glyph for legends, chips and labels. */
export function Glyph({ handler, size = 12, className }: { handler: Handler; size?: number; className?: string }) {
  const w = handler === "post" ? size * 1.8 : size;
  return (
    <svg
      width={w + 3}
      height={size + 3}
      viewBox={`${-(w + 3) / 2} ${-(size + 3) / 2} ${w + 3} ${size + 3}`}
      className={cn("inline-block shrink-0 overflow-visible align-[-0.1em]", className)}
      aria-hidden
    >
      <GlyphShape handler={handler} size={size} />
    </svg>
  );
}

/** The printed key: one row of glyph + label. */
export function Legend({
  handlers = ["post", "incoming", "automation", "agent", "team", "attention"],
  className,
}: {
  handlers?: Handler[];
  className?: string;
}) {
  return (
    <ul className={cn("mono flex flex-wrap gap-x-4 gap-y-2 text-[11px] tracking-[0.04em] text-ink-soft uppercase", className)}>
      {handlers.map((h) => (
        <li key={h} className="flex items-center gap-1.5">
          <Glyph handler={h} size={10} />
          {handlerLabel[h]}
        </li>
      ))}
    </ul>
  );
}
