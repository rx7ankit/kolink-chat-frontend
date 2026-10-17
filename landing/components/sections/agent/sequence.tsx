"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useInView } from "motion/react";

import { Glyph, type Handler } from "@/components/transit/glyph";
import { FlapText } from "@/components/ui/flap-text";
import { cn } from "@/lib/cn";
import { demoBrand } from "@/lib/media";
import { useMotionPrefs } from "@/lib/studio/store";

import { HANDOFF_BEAT, MENU_CONFIRM_BEAT, agentSteps, stepHolds, type AgentStep, type Mode } from "./data";
import { Exchange } from "./exchange";
import { BrandAvatar } from "./media-bits";
import { ModeCard } from "./mode-switch";
import { PointsDiagram } from "./points";
import { useBeatTimeline } from "./timeline";
import { Transcript } from "./transcript";

const tilts = ["-0.8deg", "0.7deg", "-0.5deg", "0.9deg", "-0.7deg", "0.5deg"];

/**
 * §02 without the pin: phones always, desktop under reduced motion. The six
 * exchanges stack as small panels that each play once on view (or render their
 * end state when motion is still). Desktop gets a sticky aside.
 */
export function StepSequence({ still }: { still: boolean }) {
  const [confirmed, setConfirmed] = useState(false);
  const onConfirm = useCallback(() => setConfirmed(true), []);
  const messengerMode: Mode = still || confirmed ? "agentic" : "menu";

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-x-6">
      <Transcript className="sr-only" />
      <div className="lg:col-span-5" aria-hidden>
        <div className="flex flex-col gap-3 lg:sticky lg:top-24">
          <p className="eyebrow">Autoreply · per channel</p>
          <ModeCard platform="instagram" name="Instagram DMs" mode="agentic" tilt="-1.2deg" />
          <ModeCard platform="messenger" name="Messenger DMs" mode={messengerMode} tilt="0.9deg" />
          <p className="text-[14px] font-medium text-ink">One mode per channel. Never both.</p>
          <div className="mt-4 border-t border-line pt-5">
            <p className="eyebrow">Who answers</p>
            <PointsDiagram className="mt-3 max-w-[400px]" track={null} />
          </div>
        </div>
      </div>
      <ol className="mt-10 flex flex-col gap-5 lg:col-span-7 lg:mt-0" aria-hidden>
        {agentSteps.map((s, i) => (
          <StepPanel key={s.n} step={s} still={still} tilt={tilts[i]} onConfirm={s.n === 1 ? onConfirm : undefined} />
        ))}
      </ol>
    </div>
  );
}

function StepPanel({
  step,
  still,
  tilt,
  onConfirm,
}: {
  step: AgentStep;
  still: boolean;
  tilt: string;
  onConfirm?: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { amount: 0.45, once: true });
  const { pace } = useMotionPrefs();
  const cursor = useBeatTimeline(stepHolds[step.n - 1], { runKey: step.n, play: inView, instant: still, pace });

  useEffect(() => {
    if (onConfirm && cursor >= MENU_CONFIRM_BEAT) onConfirm();
  }, [cursor, onConfirm]);

  let mode: string = "Agentic";
  let glyph: Handler = "agent";
  if (step.n === 1) {
    const on = cursor >= MENU_CONFIRM_BEAT;
    mode = on ? "Agentic" : "Menu";
    glyph = on ? "agent" : "automation";
  } else if (step.n === agentSteps.length && cursor >= HANDOFF_BEAT) {
    mode = "Human";
    glyph = "team";
  }

  return (
    <li ref={ref} className="k-card min-w-0" style={{ "--k-tilt": tilt } as CSSProperties}>
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <BrandAvatar size={30} platform={step.channel} />
        <div className="min-w-0 flex-1">
          <p className="mono truncate text-[11px] tracking-[0.08em] text-ink uppercase">
            {String(step.n).padStart(2, "0")} · {step.label}
          </p>
          <p className="mono mt-0.5 truncate text-[11px] text-ink-soft">
            {demoBrand.name}
            <span className="max-sm:hidden"> · {step.caption}</span>
          </p>
        </div>
        <span
          className={cn(
            "flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 shadow-[inset_0_0_0_1px_var(--k-line-strong)] transition-colors duration-300",
            mode === "Human" && "bg-pop-1/25",
          )}
        >
          <Glyph handler={glyph} size={9} />
          <FlapText text={mode.toUpperCase()} className="text-[11px] tracking-[0.06em]" />
        </span>
      </header>
      <p className="px-4 pt-3 text-[14px] leading-[1.5] text-ink-soft">{step.story}</p>
      {/* A hidden finished copy reserves the final height, so nothing below jumps while it plays. */}
      <div className="grid px-4 py-3">
        <div className="invisible col-start-1 row-start-1 min-w-0">
          <Exchange step={step} cursor={step.beats.length} play={false} layout="stack" />
        </div>
        <div className="col-start-1 row-start-1 min-w-0">
          <Exchange step={step} cursor={cursor} play={!still} layout="stack" />
        </div>
      </div>
    </li>
  );
}
