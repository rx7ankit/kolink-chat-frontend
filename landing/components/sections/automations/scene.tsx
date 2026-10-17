"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";

import { PlatformIcon } from "@/components/brand/platform-icon";
import { Legend } from "@/components/transit/glyph";
import { cn } from "@/lib/cn";
import { useLook } from "@/lib/studio/store";

import { beatHoldMs, beats, LAST_STEP, stepFor, streamComments } from "./data";
import { PIN_QUERY, useMediaQuery, usePageVisible, useSectionMotion } from "./hooks";
import { PostCard } from "./post-card";
import { derivePhase, SignalDiagram, type Run } from "./signal-diagram";

/*
 * The second (and last) pinned scene on the page. CSS decides the pin so the
 * layout is right on first paint; JS mirrors the same query to pick the driver.
 * Reduced motion (OS or Studio "Still") never pins. The pinned-only / autoplay-only
 * bits of the stage bar are toggled by the same CSS, so first paint is already right.
 */
const pinCss = `.ka-pin-only { display: none; }
@media ${PIN_QUERY} and (prefers-reduced-motion: no-preference) {
  html:not([data-motion="still"]) .ka-pin { height: calc(100svh - 64px + 170vh); }
  html:not([data-motion="still"]) .ka-stage { position: sticky; top: 64px; height: calc(100svh - 64px); display: flex; flex-direction: column; justify-content: safe center; }
  html:not([data-motion="still"]) .ka-pin-only { display: inline; }
  html:not([data-motion="still"]) .ka-auto-only { display: none; }
  /* The released stage already leaves its centring margin below it, so what follows starts closer. */
  html:not([data-motion="still"]) .ka-after { margin-top: 4.5rem; }
}`;

export function SignalScene() {
  const { still, pace, amp } = useSectionMotion();
  const look = useLook();
  const pinned = useMediaQuery(PIN_QUERY) && !still;

  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  /* Pinned driver: scroll thresholds (triggers, not tweens). */
  const { scrollYProgress } = useScroll({ target: pinRef, offset: ["start 64px", "end end"] });
  const rail = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [scrollStep, setScrollStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => setScrollStep(stepFor(p)));
  useEffect(() => {
    const id = requestAnimationFrame(() => setScrollStep(stepFor(scrollYProgress.get())));
    return () => cancelAnimationFrame(id);
  }, [scrollYProgress, pinned]);

  /* Unpinned driver: beats play once on inView, pausable, paused offscreen and in hidden tabs. */
  const inView = useInView(stageRef, { amount: 0.3 });
  const visible = usePageVisible();
  const [auto, setAuto] = useState({ step: 0, paused: false });
  const autoOn = !pinned && !still;
  useEffect(() => {
    if (!autoOn || !inView || !visible || auto.paused || auto.step >= LAST_STEP) return;
    const hold = auto.step === 0 ? 450 : beatHoldMs[beats[auto.step - 1].route] * pace;
    const id = window.setTimeout(() => setAuto((a) => ({ ...a, step: a.step + 1 })), hold);
    return () => window.clearTimeout(id);
  }, [autoOn, inView, visible, auto, pace]);

  const step = still ? LAST_STEP : pinned ? scrollStep : auto.step;
  const [run, setRun] = useState<Run>({ step: 0, phase: null });
  const phase = derivePhase(step, run, still);
  const beat = beats[step - 1] ?? null;
  const comment = beat ? (streamComments.find((c) => c.id === beat.comment) ?? null) : null;

  const railScale = useTransform(rail, (p) => Math.min(1, Math.max(0, p / 0.86)));
  const autoDone = auto.step >= LAST_STEP;

  return (
    <div ref={pinRef} className="ka-pin relative mt-14 md:mt-20">
      <style>{pinCss}</style>
      <div ref={stageRef} className="ka-stage">
        {/* Stage bar: what this signal box is, where we are in the run. */}
        <div className="mb-6 border-b border-line pb-2.5 lg:mb-4">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <h3 className="eyebrow flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="text-ink">Signal box</span>
              <span aria-hidden className="hidden sm:inline">
                ·
              </span>
              <span className="inline-flex items-center gap-2">
                <PlatformIcon id="instagram" size={13} />
                Instagram · Keyword → DM + reply
              </span>
            </h3>
            <div className="flex items-center gap-4">
              <ol className="mono flex items-center gap-2.5 text-[11px] text-ink-soft" aria-label="Steps in this run">
                {beats.map((b, i) => (
                  <li
                    key={i}
                    className={cn("tabular-nums transition-colors", i < step && "text-ink", i === step - 1 && "font-semibold")}
                    aria-current={i === step - 1 ? "step" : undefined}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </li>
                ))}
              </ol>
              {autoOn && (
                <button
                  type="button"
                  className="ka-auto-only mono min-h-11 min-w-11 rounded-md px-2 text-[11px] tracking-[0.06em] text-ink uppercase underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                  onClick={() =>
                    setAuto((a) => (a.step >= LAST_STEP ? { step: 0, paused: false } : { ...a, paused: !a.paused }))
                  }
                >
                  {autoDone ? "Replay" : auto.paused ? "Play" : "Pause"}
                </button>
              )}
            </div>
          </div>
          <div className="relative mt-2.5 h-[2px] overflow-hidden bg-line" aria-hidden>
            {pinned ? (
              <motion.span className="absolute inset-0 origin-left bg-ink" style={{ scaleX: railScale }} />
            ) : (
              <motion.span
                className="absolute inset-0 origin-left bg-ink"
                initial={false}
                animate={{ scaleX: step / LAST_STEP }}
                transition={still ? { duration: 0 } : { duration: 0.5 * pace, ease: [0.65, 0, 0.35, 1] }}
              />
            )}
          </div>
          <p className="mt-2.5 min-h-[56px] text-[13px] leading-snug text-ink-soft sm:min-h-9" aria-hidden>
            {comment && beat ? (
              <>
                <span className="mono mr-2 text-[11px] tracking-[0.08em] text-ink uppercase">Now</span>
                <span className="text-ink">
                  @{comment.handle} “{comment.text}”
                </span>{" "}
                — {beat.note}
              </>
            ) : (
              <>
                <span className="mono mr-2 text-[11px] tracking-[0.08em] text-ink uppercase">Ready</span>
                <span className="ka-pin-only">Scroll to play five comments.</span>
                <span className="ka-auto-only">Five comments incoming.</span>
              </>
            )}
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-4 xl:col-span-5">
            <PostCard step={step} phase={phase} still={still} pace={pace} amp={amp} />
          </div>
          <div className="min-w-0 lg:col-span-8 xl:col-span-7">
            <SignalDiagram step={step} phase={phase} still={still} pace={pace} lineStyle={look.lines} onRun={setRun} />
            <Legend handlers={["post", "incoming", "automation", "team"]} className="mt-2 pl-[102px]" />
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {beat ? beat.summary : ""}
        </p>
      </div>
    </div>
  );
}
