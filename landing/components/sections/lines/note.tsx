import { cn } from "@/lib/cn";

/**
 * Footnote marker. Screen readers hear "(note n)" instead of a bare digit.
 * Kept at the 11px floor and lifted with `relative` rather than `vertical-align: super`,
 * so a marker never pushes its line box taller than the label around it (0.3em keeps
 * the digit inside the overflow masks that labels rise through).
 */
export function Note({ n, className }: { n?: number; className?: string }) {
  if (!n) return null;
  return (
    <sup
      className={cn(
        "mono relative -top-[0.3em] ml-[2px] align-baseline text-[11px] leading-none font-normal text-ink-soft",
        className,
      )}
    >
      <span aria-hidden>{n}</span>
      <span className="sr-only"> (note {n})</span>
    </sup>
  );
}
