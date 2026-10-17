"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useInView, useMotionValue, useMotionValueEvent, useSpring, type Variants } from "motion/react";

import { ease } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";
import { fontPairings } from "@/lib/studio/font-pairings";
import { useLook, useMotionPrefs } from "@/lib/studio/store";

const WORD = "koLink Chat";
const LETTERS = Array.from(WORD);
const CHAT_FROM = WORD.indexOf("Chat");

/** Archivo wdth range the pointer sweeps; the rest state is the widest, which is what the fit is measured at. */
const WDTH_MIN = 75;
const WDTH_MAX = 125;
/** Non-kinetic pairings tighten by up to this much tracking instead. */
const TRACK_SPAN = 0.03;

const letterVariants: Variants = {
  hidden: { y: "108%" },
  shown: ({ i, pace }: { i: number; pace: number }) => ({
    y: "0%",
    transition: { duration: 0.8 * pace, delay: i * 0.03 * pace, ease: ease.out },
  }),
};

function Letters({ className }: { className?: string }) {
  return (
    <>
      {LETTERS.map((ch, i) => (
        <span key={i} className={cn("inline-block", i >= CHAT_FROM && "text-accent-text", className)}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </>
  );
}

/**
 * The giant "koLink Chat" at the end of the line. Its size is fitted so the widest
 * state fills the container exactly (container-query units + a measured em-ratio),
 * so nothing can overflow at 375px. Letters rise through a mask with a 30ms stagger.
 * Desktop + fine pointer only: in the Archivo pairing, wdth follows pointer x
 * (75→125, spring 120/20, whole units); other pairings get a small tracking response.
 */
export function TerminusWordmark({ className }: { className?: string }) {
  const look = useLook();
  const { still, pace } = useMotionPrefs();
  const kinetic = (fontPairings.find((f) => f.id === look.font) ?? fontPairings[0]).kinetic;

  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const lastWdth = useRef(WDTH_MAX);
  const lastTrack = useRef(0);
  const [fit, setFit] = useState(7.6);
  const inView = useInView(wrapRef, { margin: "200px 0px 200px 0px" });

  // Measure the em-width of the word at its widest state whenever the face (or its load state) changes.
  useEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    let live = true;
    // 1.2% headroom: glyph side bearings and sub-pixel rounding must never push the last letter past the edge.
    const measure = () => {
      const width = probe.getBoundingClientRect().width;
      if (live && width > 0) setFit(Math.round((width / 100) * 1.012 * 1000) / 1000);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(probe);
    measure();
    // Web fonts can swap in without changing the probe's box in some engines; measure again once they settle.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      live = false;
      ro.disconnect();
    };
  }, []);

  // Pointer → 0..1 (1 = rest = widest). Only while the footer is near the viewport.
  const target = useMotionValue(1);
  const spring = useSpring(target, { stiffness: 120, damping: 20 });

  useEffect(() => {
    target.set(1);
    spring.jump(1);
    lastWdth.current = WDTH_MAX;
    lastTrack.current = 0;
    const el = textRef.current;
    if (el) {
      el.style.setProperty("--k-wdth", String(WDTH_MAX));
      el.style.setProperty("--k-track-delta", "0em");
    }
  }, [kinetic, still, target, spring]);

  useEffect(() => {
    if (still || !inView) return;
    const mq = window.matchMedia("(pointer: fine) and (min-width: 1024px)");
    const onMove = (e: PointerEvent) => target.set(Math.min(1, Math.max(0, e.clientX / window.innerWidth)));
    const onLeave = () => target.set(1);
    let on = false;
    const sync = () => {
      if (mq.matches && !on) {
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
        on = true;
      } else if (!mq.matches && on) {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        target.set(1);
        on = false;
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      target.set(1);
    };
  }, [still, inView, target]);

  useMotionValueEvent(spring, "change", (v) => {
    const el = textRef.current;
    if (!el) return;
    if (kinetic) {
      const wdth = Math.round(WDTH_MIN + (WDTH_MAX - WDTH_MIN) * Math.min(1, Math.max(0, v)));
      if (wdth !== lastWdth.current) {
        lastWdth.current = wdth;
        el.style.setProperty("--k-wdth", String(wdth));
      }
    } else {
      const delta = Math.round((1 - Math.min(1, Math.max(0, v))) * TRACK_SPAN * 1000) / 1000;
      if (delta !== lastTrack.current) {
        lastTrack.current = delta;
        el.style.setProperty("--k-track-delta", `${delta}em`);
      }
    }
  });

  const face: CSSProperties = {
    fontWeight: kinetic ? 900 : undefined,
    lineHeight: 1,
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)} style={{ containerType: "inline-size" }}>
      <motion.p
        ref={textRef}
        className="font-display kinetic overflow-hidden whitespace-nowrap select-none"
        style={
          {
            ...face,
            fontSize: `calc(100cqw / ${fit})`,
            paddingBlock: "0.05em 0.03em",
            letterSpacing: "calc(var(--k-display-tracking) - var(--k-track-delta, 0em))",
            contain: "layout paint",
            "--k-wdth": WDTH_MAX,
          } as CSSProperties
        }
        // Always starts "hidden" (matches the server HTML); when still, "shown" runs at 0ms on mount.
        initial="hidden"
        animate={still ? "shown" : undefined}
        whileInView="shown"
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      >
        <span className="sr-only">koLink Chat</span>
        {LETTERS.map((ch, i) => (
          <motion.span
            key={i}
            aria-hidden
            custom={{ i, pace: still ? 0 : pace }}
            variants={letterVariants}
            className={cn("inline-block", i >= CHAT_FROM && "text-accent-text")}
          >
            {ch === " " ? " " : ch}
          </motion.span>
        ))}
      </motion.p>

      {/* Fit probe: same face, widest state, 100px. Its ResizeObserver catches font swaps and Studio changes. */}
      <div aria-hidden className="pointer-events-none invisible absolute top-0 left-0 h-0 w-0 overflow-hidden">
        <span
          ref={probeRef}
          className="font-display kinetic absolute top-0 left-0 w-max whitespace-nowrap"
          style={{ ...face, fontSize: 100, letterSpacing: "var(--k-display-tracking)", ["--k-wdth" as string]: WDTH_MAX }}
        >
          <Letters />
        </span>
      </div>
    </div>
  );
}
