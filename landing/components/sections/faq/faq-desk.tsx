"use client";

import { useId, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";

import { ease } from "@/components/motion/reveal";
import { SectionHeader } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import { useLook, useMotionPrefs } from "@/lib/studio/store";

import { faq, questions } from "./data";

const pad = (n: number) => String(n).padStart(2, "0");

/* ---------------------------------------------------------------- signage */

/** The information roundel: a station disc whose 'i' is a stem plus a station dot. */
function InfoRoundel({ className }: { className?: string }) {
  const { still, pace } = useMotionPrefs();
  return (
    <svg viewBox="0 0 200 200" className={cn("block shrink-0 overflow-visible", className)} aria-hidden>
      <circle cx="100" cy="100" r="94" fill="var(--k-surface)" />
      <g transform="rotate(-90 100 100)">
        <circle cx="100" cy="100" r="88" fill="none" stroke="var(--k-line)" strokeWidth="12" />
        <motion.circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke="var(--k-ink)"
          strokeWidth="12"
          initial={{ pathLength: still ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={still ? { duration: 0 } : { duration: 1.1 * pace, ease: [0.65, 0, 0.35, 1] }}
        />
      </g>
      <rect x="87" y="86" width="26" height="66" rx="5" fill="var(--k-ink)" />
      <motion.circle
        cx="100"
        cy="59"
        r="15"
        fill="var(--k-accent)"
        stroke="var(--k-ink)"
        strokeWidth="4"
        initial={{ scale: still ? 1 : 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={still ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 26, delay: 0.7 * pace }}
        style={{ transformOrigin: "100px 59px", transformBox: "view-box" }}
      />
    </svg>
  );
}

function Signage({ heavy }: { heavy: boolean }) {
  return (
    // A signage plate: the roundel beside the word, as on a platform sign.
    // Kept a step below the headline so the sign reads as wayfinding, not as a second title.
    <div className="flex items-center gap-3.5 lg:gap-4">
      <InfoRoundel className="size-12 sm:size-14 lg:size-16" />
      {/* Sized to its own column so every pairing (condensed or wide) fits on one line. */}
      <div className="min-w-0 flex-1 [container-type:inline-size]">
        <p
          aria-hidden
          className={cn(
            "font-display kinetic leading-[0.86] whitespace-nowrap text-ink uppercase",
            heavy ? "text-[clamp(24px,11cqi,56px)] [font-weight:900]" : "text-[clamp(20px,7.5cqi,40px)] tracking-[0.02em]",
          )}
          style={{ "--k-wdth": 75 } as CSSProperties}
        >
          Information
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- accordion row */

function Row({
  index,
  q,
  a,
  open,
  onToggle,
  baseId,
}: {
  index: number;
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
  baseId: string;
}) {
  const { still, pace } = useMotionPrefs();
  const btnId = `${baseId}-q${index}`;
  const panelId = `${baseId}-a${index}`;
  const spring = still ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 32 };
  const knob = still ? { duration: 0 } : { type: "spring" as const, stiffness: 520, damping: 30 };

  return (
    <li className="relative">
      {/* Hairline draws left → right on view. */}
      <motion.span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px origin-left bg-line"
        initial={{ scaleX: still ? 1 : 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        transition={still ? { duration: 0 } : { duration: 0.6 * pace, delay: index * 0.05 * pace, ease: [0.65, 0, 0.35, 1] }}
      />
      {/* Open row: 4px accent bar grows from the top. */}
      <motion.span
        aria-hidden
        className="absolute top-px bottom-0 left-0 w-1 origin-top bg-accent"
        initial={false}
        animate={{ scaleY: open ? 1 : 0 }}
        transition={knob}
      />

      <h3>
        <button
          type="button"
          id={btnId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="group grid min-h-16 w-full cursor-pointer grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-start gap-x-3 py-5 pr-1 pl-4 text-left sm:grid-cols-[3.5rem_minmax(0,1fr)_2.75rem] sm:pl-6"
        >
          <span
            aria-hidden
            className={cn(
              "mono pt-[0.45em] text-[12px] tracking-[0.06em] transition-colors",
              open ? "text-accent-text" : "text-ink-soft",
            )}
          >
            Q{pad(index + 1)}
          </span>
          <span className="font-display text-[clamp(19px,1.85vw,26px)] leading-[1.18] tracking-[-0.02em] text-ink">{q}</span>
          <span className="grid size-11 place-items-center justify-self-end rounded-full shadow-[inset_0_0_0_1.5px_var(--k-line-strong)] transition-shadow group-hover:shadow-[inset_0_0_0_1.5px_var(--k-ink)]">
            <motion.span initial={false} animate={{ rotate: open ? 45 : 0 }} transition={knob} className="grid place-items-center">
              <Plus size={18} strokeWidth={2} aria-hidden className="text-ink" />
            </motion.span>
          </span>
        </button>
      </h3>

      <motion.div
        id={panelId}
        inert={!open}
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ height: spring, opacity: still ? { duration: 0.15 } : { duration: 0.24 * pace, ease: ease.out } }}
        className="overflow-hidden"
      >
        <motion.p
          initial={false}
          animate={{ y: open || still ? 0 : 6 }}
          transition={still ? { duration: 0 } : { duration: 0.42 * pace, ease: ease.out }}
          className="max-w-[60ch] pr-4 pb-7 pl-4 text-[16px] leading-[1.65] text-ink-soft sm:pr-16 sm:pl-[calc(1.5rem+3.5rem+0.75rem)]"
        >
          {a}
        </motion.p>
      </motion.div>
    </li>
  );
}

/* ---------------------------------------------------------------- desk */

export function FaqDesk() {
  const look = useLook();
  const baseId = useId().replace(/:/g, "");
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const allOpen = open.size === questions.length;

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-5">
        {/* Sticky only where the whole desk fits under the nav. */}
        <div className="[@media(min-width:1024px)_and_(min-height:820px)]:sticky [@media(min-width:1024px)_and_(min-height:820px)]:top-24">
          <Signage heavy={look.font === "interchange"} />
          <SectionHeader eyebrow={faq.eyebrow} lines={faq.lines} body={faq.body} className="mt-10 lg:mt-12" />
          <button
            type="button"
            aria-controls={questions.map((_, i) => `${baseId}-a${i}`).join(" ")}
            onClick={() => setOpen(allOpen ? new Set() : new Set(questions.map((_, i) => i)))}
            className="mono mt-8 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-[11px] tracking-[0.08em] text-ink uppercase shadow-[inset_0_0_0_1.5px_var(--k-line-strong)] transition-shadow hover:shadow-[inset_0_0_0_1.5px_var(--k-ink)]"
          >
            {allOpen ? "Close all answers" : "Open all answers"}
            <span className="text-ink-soft">· {questions.length}</span>
          </button>
        </div>
      </div>

      <div className="min-w-0 lg:col-span-7">
        <ul className="border-b border-line">
          {questions.map((item, i) => (
            <Row key={item.q} index={i} q={item.q} a={item.a} open={open.has(i)} onToggle={() => toggle(i)} baseId={baseId} />
          ))}
        </ul>
      </div>
    </div>
  );
}
