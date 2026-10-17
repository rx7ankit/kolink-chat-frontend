"use client";

import { useId, useRef, useState } from "react";
import { motion } from "motion/react";

import { languages } from "./data";
import { usePlay } from "./hooks";
import { DataTable, Panel } from "./panel";

// Geometry in viewBox units (264 × 184). The SVG scales uniformly (×0.92 at its narrowest, 768px),
// so text is never set below 12 units ≈ 11px on screen.
const W = 264;
const H = 184;
const CX = 84;
const CY = 92;
const R = 70;
const r = 46;
const RM = (R + r) / 2;
const LABEL_X = 176;
const VALUE_X = 262;

const rad = (deg: number) => (deg * Math.PI) / 180;
/** Rounded to 0.01 so server and browser trig (which can differ in the last bit) render identical attributes. */
const p = (n: number) => Math.round(n * 100) / 100;
/** Point at `deg` (clockwise from 12 o'clock) on radius `rr`. */
const at = (deg: number, rr: number) => ({ x: p(CX + Math.sin(rad(deg)) * rr), y: p(CY - Math.cos(rad(deg)) * rr) });

/** Annular sector with parallel gaps: each edge is pulled in by 1.5px, which leaves 2px of surface between 1px ink edges. */
function sector(a0: number, a1: number) {
  const dO = (Math.asin(1.5 / R) * 180) / Math.PI;
  const dI = (Math.asin(1.5 / r) * 180) / Math.PI;
  const large = a1 - a0 > 180 ? 1 : 0;
  const o0 = at(a0 + dO, R);
  const o1 = at(a1 - dO, R);
  const i1 = at(a1 - dI, r);
  const i0 = at(a0 + dI, r);
  return `M${p(o0.x)} ${p(o0.y)}A${R} ${R} 0 ${large} 1 ${p(o1.x)} ${p(o1.y)}L${p(i1.x)} ${p(i1.y)}A${r} ${r} 0 ${large} 0 ${p(i0.x)} ${p(i0.y)}Z`;
}

/** Centre-line arc used as the draw-in mask for a sector. */
function arc(a0: number, a1: number) {
  const s = at(a0, RM);
  const e = at(a1, RM);
  return `M${p(s.x)} ${p(s.y)}A${RM} ${RM} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p(e.x)} ${p(e.y)}`;
}

const fills = [
  "var(--k-ink)",
  "color-mix(in oklab, var(--k-ink) 58%, var(--k-surface))",
  "color-mix(in oklab, var(--k-ink) 32%, var(--k-surface))",
  "color-mix(in oklab, var(--k-ink) 14%, var(--k-surface))",
];

/**
 * Layout, computed once: the minor languages are centred on the right (3 o'clock),
 * so every label can sit in one right-hand column with a short horizontal leader.
 * English wraps the left side and is labelled from the top of its arc.
 */
const total = languages.reduce((s, l) => s + l.value, 0);
const minorSpan = ((total - languages[0].value) / total) * 360;
const start = 90 - minorSpan / 2 - (languages[0].value / total) * 360;
const segments = languages.reduce<{ label: string; value: number; a0: number; a1: number }[]>((acc, l) => {
  const a0 = acc.length ? acc[acc.length - 1].a1 : start;
  acc.push({ label: l.label, value: l.value, a0, a1: a0 + (l.value / total) * 360 });
  return acc;
}, []);
const labelled = segments.map((s, i) => {
  const anchorDeg = i === 0 ? s.a1 - 10 : (s.a0 + s.a1) / 2;
  const anchor = at(anchorDeg, R + 4);
  return { ...s, anchor, d: sector(s.a0, s.a1), mask: arc(s.a0, s.a1) };
});
// Keep label rows at least 18 units apart (top to bottom).
const rows = labelled.map((s) => s.anchor.y);
for (let i = 1; i < rows.length; i++) rows[i] = Math.max(rows[i], rows[i - 1] + 18);

/** (D) Languages: donut with 2px gaps and direct labels; arcs draw in sequence. */
export function Languages({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const { shown, animated, pace } = usePlay(ref);
  const [focus, setFocus] = useState<number | null>(null);
  const motionOn = shown && animated;
  const hatchId = `ins-lang-hatch-${uid}`;
  const centre = labelled[focus ?? 0];

  return (
    <Panel id={`${uid}-title`} letter="D" title="Languages" className={className}>
      <p className="mt-1.5 mb-4 text-[13px] leading-snug text-ink-soft">Share of contacts by language field.</p>
      {/* Centred in whatever height the row gives the panel, so no void opens above the donut. */}
      <div className="my-auto flex justify-center">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} aria-hidden className="block h-auto w-full max-w-[360px] overflow-visible">
          <defs>
            <pattern id={hatchId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="5" height="5" fill="var(--k-surface)" />
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--k-ink)" strokeOpacity="0.4" strokeWidth="1" />
            </pattern>
            {labelled.map((s, i) => (
              <mask key={s.label} id={`${uid}-m${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
                <motion.path
                  d={s.mask}
                  fill="none"
                  stroke="white"
                  strokeWidth={R - r + 8}
                  initial={false}
                  animate={{ pathLength: shown ? 1 : 0 }}
                  transition={motionOn ? { duration: 0.55 * pace, delay: (0.1 + 0.12 * i) * pace, ease: [0.65, 0, 0.35, 1] } : { duration: 0 }}
                />
              </mask>
            ))}
          </defs>

          {labelled.map((s, i) => {
            const dim = focus !== null && focus !== i;
            const y = rows[i];
            return (
              <g
                key={s.label}
                onPointerEnter={() => setFocus(i)}
                onPointerLeave={() => setFocus(null)}
                style={{ opacity: dim ? 0.35 : 1, transition: "opacity 160ms" }}
              >
                <path
                  d={s.d}
                  mask={`url(#${uid}-m${i})`}
                  style={{ fill: i < fills.length ? fills[i] : `url(#${hatchId})` }}
                  stroke="var(--k-ink)"
                  strokeWidth={1}
                  strokeLinejoin="round"
                />
                {/* Leader + label */}
                <motion.g
                  initial={false}
                  animate={{ opacity: shown ? 1 : 0 }}
                  transition={motionOn ? { duration: 0.24 * pace, delay: (0.4 + 0.12 * i) * pace } : { duration: 0 }}
                >
                  <path
                    d={`M${p(s.anchor.x)} ${p(s.anchor.y)}L${p(Math.max(s.anchor.x + 4, LABEL_X - 14))} ${p(y)}L${LABEL_X - 7} ${p(y)}`}
                    fill="none"
                    stroke="var(--k-ink-soft)"
                    strokeWidth={1}
                  />
                  <circle cx={LABEL_X - 7} cy={y} r={2.2} fill="var(--k-surface)" stroke="var(--k-ink)" strokeWidth={1} />
                  <text x={LABEL_X} y={p(y + 4.2)} fontSize={12} style={{ fill: "var(--k-ink)" }}>
                    {s.label}
                  </text>
                  <text x={VALUE_X} y={p(y + 4.2)} fontSize={12} textAnchor="end" className="mono" fontWeight={600} style={{ fill: "var(--k-ink)" }}>
                    {s.value}%
                  </text>
                  {/* Generous hit area for the label row */}
                  <rect x={LABEL_X - 12} y={p(y - 10)} width={VALUE_X - LABEL_X + 14} height={20} fill="transparent" />
                </motion.g>
              </g>
            );
          })}

          {/* Centre readout: English by default, the hovered language otherwise */}
          <text x={CX} y={CY + 5} textAnchor="middle" className="font-display" fontSize={28} style={{ fill: "var(--k-ink)" }}>
            {centre.value}%
          </text>
          <text
            x={CX}
            y={CY + 22}
            textAnchor="middle"
            className="mono"
            fontSize={12}
            style={{ fill: "var(--k-ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em" }}
          >
            {centre.label}
          </text>
        </svg>
      </div>
      <DataTable
        caption="Share of contacts by language (demo workspace, illustrative numbers)"
        head={["Language", "Share of contacts"]}
        rows={languages.map((l) => [l.label, `${l.value}%`])}
      />
    </Panel>
  );
}
