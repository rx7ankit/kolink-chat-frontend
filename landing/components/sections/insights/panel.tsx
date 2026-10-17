import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * One cell of the data sheet: a lettered figure ("A  Messages") with a mono
 * meta line on the right. Cells sit on a 1px line-colored grid gap, so the
 * hairlines between them come from the grid, never from borders.
 */
export function Panel({
  id,
  letter,
  title,
  meta,
  children,
  className,
}: {
  id: string;
  letter?: string;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="group" aria-labelledby={id} className={cn("relative flex min-w-0 flex-col bg-surface p-4 sm:p-6", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id={id} className="flex items-baseline gap-2.5 text-[15px] leading-tight font-semibold text-ink">
          {letter && <Letter>{letter}</Letter>}
          {title}
        </h3>
        {meta && <p className="mono text-[11px] leading-tight tracking-[0.06em] text-ink-soft uppercase">{meta}</p>}
      </div>
      {children}
    </div>
  );
}

/** The figure letter in a panel title ("A", "B" …), like a plate number in a printed report. Decorative. */
export function Letter({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="mono inline-grid size-[19px] shrink-0 translate-y-[-1px] place-items-center rounded-xs border border-line-strong text-[11px] leading-none font-medium text-ink-soft"
    >
      {children}
    </span>
  );
}

/** Visually hidden data table that mirrors a chart for screen readers. */
export function DataTable({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: [string, string];
  rows: [string, string][];
}) {
  // The wrapper is what's visually hidden: a table ignores width:1px and would keep its full width.
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{head[0]}</th>
            <th scope="col">{head[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a}>
              <th scope="row">{a}</th>
              <td>{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
