"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import { useLenis } from "lenis/react";
import { Bell } from "lucide-react";

import { Glyph, type Handler } from "@/components/transit/glyph";
import { Emphasis } from "@/components/ui/emphasis";
import { FlapText } from "@/components/ui/flap-text";
import { Odometer } from "@/components/ui/odometer";
import { cn } from "@/lib/cn";
import { demoBrand } from "@/lib/media";
import { useMotionPrefs } from "@/lib/studio/store";
import { travelMs } from "@/lib/transit/geometry";

import { MenuToast } from "./bubbles";
import {
  HANDOFF_BEAT,
  MENU_CONFIRM_BEAT,
  MENU_TOAST_BEAT,
  agentSteps,
  modeLabel,
  stepHolds,
  type Mode,
} from "./data";
import { Exchange } from "./exchange";
import { BrandAvatar, ThreadIntro } from "./media-bits";
import { ModeCard } from "./mode-switch";
import { PointsDiagram, usePointsGeometry } from "./points";
import { StepRail } from "./step-rail";
import { useBeatTimeline } from "./timeline";
import { Transcript } from "./transcript";

const STEPS = agentSteps.length;

/**
 * Desktop §02: the page's one long pin (240vh). Scroll progress is quantised into
 * six steps; every visible state derives from (step, beat cursor), so scrolling
 * back simply renders earlier end states.
 */
export function PinnedStage() {
  const { pace } = useMotionPrefs();
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stickyRef, { amount: 0.35 });
  const lenis = useLenis();

  const { scrollYProgress } = useScroll({ target: outerRef, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const railFill = useTransform(smooth, (v) => Math.min(1, Math.max(0, (v * STEPS - 0.5) / (STEPS - 1))));

  const [pos, setPos] = useState<{ step: number; dir: 1 | -1 }>({ step: 1, dir: 1 });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.min(STEPS, Math.max(1, Math.floor(p * STEPS) + 1));
    setPos((prev) => (prev.step === next ? prev : { step: next, dir: next > prev.step ? 1 : -1 }));
  });
  const { step, dir } = pos;
  const current = agentSteps[step - 1];
  const instant = dir < 0;
  const cursor = useBeatTimeline(stepHolds[step - 1], { runKey: step, play: inView, instant, pace });
  const reached = (beat: number) => cursor >= beat;

  const total = current.beats.length;
  const confirmed = step > 1 || reached(MENU_CONFIRM_BEAT);
  const messengerMode: Mode = confirmed ? "agentic" : "menu";
  const toastOpen = step === 1 && reached(MENU_TOAST_BEAT) && cursor < total;
  const handedOff = step === STEPS && reached(HANDOFF_BEAT);
  const thread = current.channel;
  const pill = thread === "messenger" ? modeLabel[messengerMode] : handedOff ? "Human" : "Agentic";
  const pillGlyph: Handler = pill === "Menu" ? "automation" : pill === "Human" ? "team" : "agent";

  // Packet on the points diagram: rides the active route each time a step starts.
  const geo = usePointsGeometry();
  const packetT = useMotionValue(1);
  useEffect(() => {
    if (!inView || instant) {
      packetT.set(1);
      return;
    }
    packetT.set(0);
    const len = (current.track === "attention" ? geo.fullDn : geo.fullUp).length;
    const controls = animate(packetT, 1, {
      // The diagram renders at roughly 1.2× its viewBox, so measure travel in screen px.
      duration: (travelMs(len * 1.2) / 1000) * pace,
      delay: 0.2 * pace,
      ease: [0.65, 0, 0.35, 1],
    });
    return () => controls.stop();
  }, [step, inView, instant, pace, current.track, geo, packetT]);

  const jump = useCallback(
    (n: number) => {
      const el = outerRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const range = el.offsetHeight - window.innerHeight;
      const target = top + ((n - 0.5) / STEPS) * range;
      if (lenis) lenis.scrollTo(target, { duration: 0.9 });
      else window.scrollTo({ top: target, behavior: "smooth" });
    },
    [lenis],
  );

  const shown = thread === "messenger" ? agentSteps.slice(0, 1) : agentSteps.slice(1, step);

  return (
    <div ref={outerRef} data-agent-stage className="relative h-[240vh]">
      <Transcript className="sr-only" />
      <div ref={stickyRef} className="sticky top-0 flex h-[100svh] flex-col justify-center pt-24 pb-8">
        <div className="grid h-full max-h-[860px] min-h-0 grid-cols-12 gap-x-6">
          {/* Left: what this step shows, the per-channel modes, the points, the rail */}
          <div className="col-span-5 flex min-h-0 flex-col">
            <Narration step={step} />

            <div
              aria-hidden
              className="mt-6 flex shrink-0 flex-col gap-2.5 [@media(max-height:759px)]:mt-4 max-xl:[@media(max-height:820px)]:mt-3"
            >
              <p className="eyebrow">Autoreply · per channel</p>
              <ModeCard platform="instagram" name="Instagram DMs" mode="agentic" active={thread === "instagram"} tilt="-1.2deg" />
              <div className="relative">
                <ModeCard platform="messenger" name="Messenger DMs" mode={messengerMode} active={thread === "messenger"} tilt="0.9deg" />
                <AnimatePresence>
                  {toastOpen && (
                    <MenuToast
                      key="toast"
                      confirmed={reached(MENU_CONFIRM_BEAT)}
                      play={!instant}
                      className="absolute top-[calc(100%+10px)] right-0 z-20 w-[min(100%,320px)] shadow-[0_22px_44px_-18px_color-mix(in_oklab,var(--k-ink)_35%,transparent)]"
                    />
                  )}
                </AnimatePresence>
              </div>
              {/* Steps aside while the confirmation is open, so the toast never sits on half a sentence. */}
              <p className={cn("text-[14px] font-medium text-ink transition-opacity duration-200", toastOpen && "opacity-0")}>
                One mode per channel. Never both.
              </p>
            </div>

            {/* The points panel takes whatever height is left, so the column never leaves a hole. */}
            <div
              aria-hidden
              className="mt-6 flex min-h-[150px] flex-1 flex-col rounded-xl bg-bg-alt px-4 pt-3.5 pb-2 [@media(max-height:759px)]:mt-4"
            >
              <p className="eyebrow">Who answers</p>
              <div className="relative min-h-0 flex-1">
                <PointsDiagram
                  className="absolute inset-0 m-auto h-full max-h-[224px] w-full max-w-[396px]"
                  platform={thread}
                  track={current.track}
                  packet={current.packet}
                  trigger={step === STEPS ? "Asked for a person" : undefined}
                  progress={packetT}
                />
              </div>
            </div>

            <StepRail className="shrink-0 pt-3" steps={agentSteps} current={step} progress={railFill} onJump={jump} />
          </div>

          {/* Right: the DM panel with a margin for notes */}
          <div className="col-span-7 min-h-0" aria-hidden>
            <DmPanel thread={thread} pill={pill} pillGlyph={pillGlyph} handedOff={handedOff}>
              <div key={thread} className="pt-8 pb-6">
                <div className="mr-[var(--gutter)]">
                  <ThreadIntro platform={thread} />
                </div>
                {shown.map((s) => (
                  <Exchange
                    key={s.n}
                    step={s}
                    layout="stage"
                    cursor={s.n === step ? cursor : s.beats.length}
                    play={s.n === step && !instant}
                  />
                ))}
              </div>
            </DmPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The step being shown: an editorial headline and one short line. Its box keeps one
 * height for every step so nothing below it moves; the line drops out on very short
 * screens, where the rail and the DM panel carry the step.
 */
function Narration({ step }: { step: number }) {
  const { pace } = useMotionPrefs();
  const s = agentSteps[step - 1];
  return (
    <div
      aria-hidden
      className="relative h-[94px] shrink-0 [@media(max-height:759px)]:h-[60px]"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          className="absolute inset-x-0 top-0"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.14 } }}
          transition={{ duration: 0.36 * pace, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mono truncate text-[11px] tracking-[0.08em] text-ink-soft uppercase">
            {String(step).padStart(2, "0")} / {String(STEPS).padStart(2, "0")} · {s.caption}
          </p>
          <p className="font-display mt-2.5 truncate text-[clamp(25px,2.2vw,32px)] leading-[1.08] text-ink">
            <Emphasis text={s.headline} />
          </p>
          <p className="mt-2 truncate text-[15px] leading-[1.5] text-ink-soft [@media(max-height:759px)]:hidden">
            {s.story}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DmPanel({
  thread,
  pill,
  pillGlyph,
  handedOff,
  children,
}: {
  thread: "instagram" | "messenger";
  pill: string;
  pillGlyph: Handler;
  handedOff: boolean;
  children: ReactNode;
}) {
  const { still, pace } = useMotionPrefs();
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);

  // Keep the newest message in view: translate the column up (transform only).
  useEffect(() => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return;
    let target = 0;
    let controls: AnimationPlaybackControls | undefined;
    const update = () => {
      const next = -Math.max(0, ct.offsetHeight - vp.clientHeight);
      if (next === target) return;
      target = next;
      controls?.stop();
      if (still) y.set(next);
      else controls = animate(y, next, { duration: 0.55 * pace, ease: [0.22, 1, 0.36, 1] });
    };
    const ro = new ResizeObserver(update);
    ro.observe(vp);
    ro.observe(ct);
    update();
    return () => {
      ro.disconnect();
      controls?.stop();
    };
  }, [still, pace, y]);

  const name = thread === "instagram" ? "Instagram" : "Messenger";

  return (
    <div
      className="relative grid h-full min-h-0 grid-cols-[minmax(0,1fr)_var(--gutter)] grid-rows-[auto_minmax(0,1fr)] [--gutter:150px] xl:[--gutter:188px]"
      style={{ "--k-tilt": "0deg" } as CSSProperties}
    >
      <div className="k-card absolute inset-y-0 right-[var(--gutter)] left-0" />

      {/* Header: the account the customer is writing to */}
      <div className="relative col-start-1 flex items-center gap-3 border-b border-line px-5 py-3">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={thread}
            className="flex min-w-0 flex-1 items-center gap-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <BrandAvatar size={36} platform={thread} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] leading-tight font-semibold">{demoBrand.name}</p>
              <p className="mono mt-0.5 truncate text-[11px] text-ink-soft">
                {thread === "instagram" ? `@${demoBrand.handle}` : "Facebook Page"} · {name} DM · demo
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
        <span
          className={cn(
            "flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] uppercase shadow-[inset_0_0_0_1px_var(--k-line-strong)] transition-colors duration-300",
            pill === "Human" && "bg-pop-1/25",
          )}
        >
          <Glyph handler={pillGlyph} size={9} />
          <FlapText text={pill.toUpperCase()} className="text-[11px] tracking-[0.06em]" />
        </span>
      </div>
      {/* The team's inbox bell lives outside the customer's DM, in the margin. */}
      <div className="relative col-start-2 row-start-1 flex flex-col justify-end gap-1 pb-3 pl-4">
        <p className="mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">Team inbox</p>
        <div className="mono flex items-center gap-1.5 text-[11px] leading-[1.4] text-ink-soft">
          <motion.span
            className="grid shrink-0 place-items-center text-ink"
            style={{ originY: 0 }}
            initial={false}
            animate={handedOff && !still ? { rotate: [0, -14, 10, -6, 0] } : { rotate: 0 }}
            transition={{ duration: 0.6 * pace, ease: "easeInOut" }}
          >
            <Bell className="size-3.5" strokeWidth={2} aria-hidden />
          </motion.span>
          <Odometer value={handedOff ? 1 : 0} className="text-ink" />
          {/* The pill says who owns the thread; this says what that means for the bot. */}
          <AnimatePresence initial={false}>
            {handedOff && (
              <motion.span
                key="paused"
                className="truncate"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: still ? 0 : 0.3 * pace, delay: still ? 0 : 0.35 * pace }}
              >
                · bot paused
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Conversation */}
      <div
        ref={viewportRef}
        className="relative col-span-2 row-start-2 min-h-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_44px)]"
      >
        <motion.div ref={contentRef} style={{ y }}>
          {children}
        </motion.div>
      </div>

    </div>
  );
}
