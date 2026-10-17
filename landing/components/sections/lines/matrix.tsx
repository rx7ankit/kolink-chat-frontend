"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { motion, type Transition } from "motion/react";
import { Plus } from "lucide-react";

import { Roundel } from "@/components/transit/roundel";
import { cn } from "@/lib/cn";
import type { PlatformId } from "@/lib/platforms";

import { matrixColumns, matrixRows, signInOf, type MatrixCell } from "./data";
import { Note } from "./note";
import { useLinesMotion } from "./use-motion";

const outEase = [0.22, 1, 0.36, 1] as const;
/** Deterministic sticker tilts (only visible with the Studio "sticker" card style). */
const tilts = [-1.2, 0.9, -0.6, 1.4, -1, 0.7, -1.5, 1.1];

/**
 * "See every capability": a disclosure that opens the per-platform matrix from
 * lib/capabilities.ts. Hovering or focusing a row highlights that line on the map.
 * The content is always in the HTML (hidden until opened), so nothing depends on JS.
 */
export function CapabilityMatrix({
  focus,
  onFocusLine,
}: {
  focus: PlatformId | null;
  onFocusLine: (id: PlatformId | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const { still, pace } = useLinesMotion();
  const panelId = useId();

  const rowReveal = (i: number) =>
    still
      ? { initial: false as const, animate: { y: "0%" }, transition: { duration: 0 } }
      : {
          initial: false as const,
          animate: { y: open ? "0%" : "105%" },
          transition: { duration: 0.5 * pace, delay: open ? (0.08 + i * 0.04) * pace : 0, ease: outEase },
        };

  const rowEvents = (id: PlatformId) => ({
    onPointerEnter: () => onFocusLine(id),
    onPointerLeave: () => onFocusLine(null),
    onFocus: () => onFocusLine(id),
    onBlur: () => onFocusLine(null),
  });

  return (
    <div>
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="group flex min-h-16 w-full items-center gap-4 border-y border-line-strong py-4 text-left"
        >
          <span className="font-display min-w-0 flex-1 text-[24px] leading-tight md:text-[30px]">See every capability</span>
          <span className="mono hidden text-[11px] tracking-[0.08em] text-ink-soft uppercase md:block">
            <span className="sr-only">: </span>
            {matrixRows.length} lines × {matrixColumns.length} features
          </span>
          <span
            className="grid size-11 shrink-0 place-items-center rounded-full text-ink transition-colors group-hover:bg-[color-mix(in_oklab,var(--k-ink)_6%,transparent)]"
            style={{ boxShadow: "inset 0 0 0 1.5px var(--k-line-strong)" }}
          >
            <Plus
              size={18}
              strokeWidth={1.75}
              aria-hidden
              className={cn(!still && "transition-transform duration-300 ease-out-soft", open && "rotate-45")}
            />
          </span>
        </button>
      </h3>

      <div id={panelId} hidden={!open}>
        <motion.div
          initial={false}
          animate={open ? { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 } : { clipPath: "inset(0% 0% 100% 0%)", opacity: 0 }}
          transition={still ? { duration: 0.15 } : { type: "spring", stiffness: 260, damping: 32 }}
          className="pt-6"
        >
          <div className="mono mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] tracking-[0.04em] text-ink-soft">
            <span className="flex items-center gap-2">
              <StopTick />
              On this line
            </span>
            <span className="flex items-center gap-2">
              <StopTick hollow />
              In workspace Insights
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden>—</span>
              Not on this line
            </span>
            <span className="hidden md:inline lg:hidden">· Scroll the table sideways for every column</span>
          </div>

          {/* md+: hairline table (scrolls inside its own container below lg) */}
          <div className="hidden overflow-x-auto overscroll-x-contain md:block">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <caption className="sr-only">
                What koLink Chat supports on each of the eight channels. A dash means the feature is not available on that line.
              </caption>
              <thead>
                <tr className="border-b border-line-strong">
                  <th scope="col" className="mono w-[188px] py-3 pr-4 align-bottom text-[11px] font-normal tracking-[0.08em] text-ink-soft uppercase">
                    Line
                  </th>
                  {matrixColumns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className="mono px-3 py-3 align-bottom text-[11px] font-normal tracking-[0.08em] text-ink-soft uppercase"
                    >
                      {c.label}
                      <Note n={c.note} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row, i) => (
                  <tr
                    key={row.id}
                    {...rowEvents(row.id)}
                    className={cn(
                      "border-b border-line transition-colors duration-300",
                      focus === row.id && "bg-[color-mix(in_oklab,var(--k-ink)_4%,transparent)]",
                    )}
                  >
                    <th scope="row" tabIndex={0} className="rounded-sm py-4 pr-4 align-top font-normal">
                      <Mask motionProps={rowReveal(i)}>
                        <span className="flex items-center gap-3">
                          <Roundel platform={row.id} size={30} active={focus === row.id} />
                          <span className="min-w-0">
                            <span className="mono block text-[11px] text-ink-soft">{row.num}</span>
                            <span className="block text-[14px] leading-tight font-semibold text-ink">{row.label}</span>
                          </span>
                        </span>
                      </Mask>
                    </th>
                    {row.cells.map((cell) => (
                      <td key={cell.column.key} className="px-3 py-4 align-top">
                        <Mask motionProps={rowReveal(i)}>
                          <Cell cell={cell} platform={row.id} />
                        </Mask>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* < md: stacked cards */}
          <ul className="grid gap-5 md:hidden">
            {matrixRows.map((row, i) => {
              const have = row.cells.filter((c) => c.kind !== "no");
              const missing = row.cells.filter((c) => c.kind === "no");
              return (
                <li
                  key={row.id}
                  className="k-card min-w-0 p-4"
                  style={{ "--k-tilt": `${tilts[i % tilts.length]}deg` } as CSSProperties}
                >
                  <div className="flex items-center gap-3">
                    <Roundel platform={row.id} size={32} active={focus === row.id} />
                    <p className="min-w-0">
                      <span className="mono block text-[11px] text-ink-soft">
                        Line {row.num} · {signInOf[row.id].label}
                      </span>
                      <span className="block text-[16px] leading-tight font-semibold text-ink">{row.label}</span>
                    </p>
                  </div>
                  <dl className="mt-4 border-t border-line">
                    {have.map((cell) => (
                      <div key={cell.column.key} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 border-b border-line py-2.5">
                        <dt className="mono pt-0.5 text-[11px] leading-4 tracking-[0.04em] text-ink-soft uppercase">
                          {cell.column.label}
                          <Note n={cell.column.note} />
                        </dt>
                        <dd className="min-w-0">
                          <Cell cell={cell} platform={row.id} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {missing.length > 0 && (
                    <p className="mono mt-3 text-[11px] leading-4 text-ink-soft">
                      <span aria-hidden>— </span>
                      Not on this line: {missing.map((c) => c.column.label).join(" · ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

type MaskMotion = {
  initial: false;
  animate: { y: string };
  transition: Transition;
};

/** Rows rise through a line mask, 40ms apart. */
function Mask({ children, motionProps }: { children: ReactNode; motionProps: MaskMotion }) {
  return (
    <span className="block overflow-hidden pb-px">
      <motion.span className="block" {...motionProps}>
        {children}
      </motion.span>
    </span>
  );
}

/**
 * The map's own stop tick, so the matrix speaks the map's language (and avoids dots: on this
 * page a hollow circle is the legend's "customer writes in" glyph). Filled in the line colour
 * = the line stops here; hollow = only counted in the workspace-wide Insights charts.
 */
function StopTick({ platform, hollow = false, className }: { platform?: PlatformId; hollow?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-[12px] w-[5px] shrink-0 rounded-[1px]", className)}
      style={
        hollow
          ? { boxShadow: "inset 0 0 0 1.5px var(--k-line-strong)" }
          : { background: platform ? `var(--line-${platform})` : "var(--k-ink)" }
      }
    />
  );
}

function Cell({ cell, platform }: { cell: MatrixCell; platform: PlatformId }) {
  if (cell.kind === "no") {
    return (
      // line-strong is the ≥3:1 muted token, so the dash stays legible (ink-soft at 60% was not).
      <span className="text-[14px] text-line-strong">
        <span aria-hidden>—</span>
        <span className="sr-only">Not on this line</span>
      </span>
    );
  }
  const pooled = cell.kind === "pooled";
  return (
    <span className="flex min-w-0 items-start gap-2 text-[13px] leading-[1.45]">
      <StopTick platform={platform} hollow={pooled} className="mt-[4px]" />
      <span className={cn("min-w-0", pooled ? "text-ink-soft" : "text-ink")}>
        {cell.text}
        <Note n={cell.note} />
      </span>
    </span>
  );
}
