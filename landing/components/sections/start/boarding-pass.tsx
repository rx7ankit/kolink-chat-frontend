"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionStyle,
} from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useLenis } from "lenis/react";

import { Roundel } from "@/components/transit/roundel";
import { FlapText } from "@/components/ui/flap-text";
import { SectionHeader } from "@/components/ui/section";
import { lineOrder } from "@/lib/capabilities";
import { cn } from "@/lib/cn";
import { links } from "@/lib/site";
import { useLook, useMotionPrefs } from "@/lib/studio/store";

import { FINE_POINTER, useMediaQuery } from "../how/use-media-query";
import styles from "./ticket.module.css";

const copy = {
  eyebrow: "§10 · GET STARTED",
  lines: ["Your ticket to", "*every line.*"],
  body: "Create a workspace, connect your first channel and watch the first reply land.",
};

const fields: { label: string; value: string; wide?: boolean; mono?: boolean; flap?: boolean }[] = [
  { label: "From", value: "Every channel" },
  { label: "To", value: "koLink Chat" },
  { label: "Lines", value: "01–08", mono: true },
  { label: "Boarding", value: "Now", mono: true, flap: true },
  { label: "Gate", value: "chat.getkolink.com", wide: true, mono: true },
];

/** Deterministic decorative barcode (no Math.random in render). */
const BARS = Array.from("KOLINKCHAT0108EVERYLINEONEINTERCHANGE").map((ch, i) => 1 + ((ch.charCodeAt(0) * 7 + i * 3) % 4));

const PUNCH_MS = 140;

/** Thin parallel stripes in each line's Studio route color, drawn left → right once in view. */
function Stripes({ draw, className }: { draw: boolean; className?: string }) {
  const { still, pace } = useMotionPrefs();
  // Ink lines rest at reduced strength on the map; keep the livery light in that mode too.
  const inkLines = useLook().lineColor === "ink";
  return (
    <div aria-hidden className={cn("flex flex-col gap-[4px]", className)}>
      {lineOrder.map((id, i) => (
        <motion.span
          key={id}
          className="block h-px origin-left"
          style={{ background: `var(--line-${id})`, opacity: inkLines ? 0.3 : 0.85 }}
          initial={false}
          animate={{ scaleX: draw || still ? 1 : 0 }}
          transition={still ? { duration: 0 } : { duration: 0.7 * pace, delay: i * 0.04 * pace, ease: [0.65, 0, 0.35, 1] }}
        />
      ))}
    </div>
  );
}

export function BoardingPass() {
  const { still, pace, amp } = useMotionPrefs();
  const finePointer = useMediaQuery(FINE_POINTER);
  const lenis = useLenis();

  const passRef = useRef<HTMLDivElement>(null);
  const inView = useInView(passRef, { once: true, margin: "0px 0px -15% 0px" });

  // Slide-in scrubbed across entry: rotate −2° → 0, y 64 → 0; the stub parallaxes at 1.1×. Kept small so it reads as
  // a ticket settling onto the counter, not a tilted card.
  const { scrollYProgress } = useScroll({ target: passRef, offset: ["start end", "start 0.45"] });
  const entry = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const passY = useTransform(entry, [0, 1], [64 * amp, 0]);
  const passRotate = useTransform(entry, [0, 1], [-2 * amp, 0]);
  const stubY = useTransform(entry, [0, 1], [8 * amp, 0]);

  // Hover tear (pointer: fine only).
  const [tear, setTear] = useState(false);
  const canTear = finePointer && !still;

  // Punch hole: mask circle r 0 → 10 before navigating.
  const punch = useMotionValue(0);
  const punchR = useTransform(punch, (v) => `${v}px`);
  const navTimer = useRef<number | null>(null);
  /** Fallback timer for "try the demo again" when Lenis never reports completion. */
  const demoTimer = useRef<number | null>(null);

  useEffect(() => {
    // Coming back through the back/forward cache: un-punch the ticket.
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) punch.set(0);
    };
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("pageshow", onShow);
      if (navTimer.current) window.clearTimeout(navTimer.current);
      if (demoTimer.current) window.clearTimeout(demoTimer.current);
    };
  }, [punch]);

  const onPrimaryClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Modified, non-primary or already-handled clicks, and reduced motion, navigate natively.
    if (still || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = e.currentTarget.href;
    e.preventDefault();
    animate(punch, 10, { duration: (PUNCH_MS / 1000) * pace, ease: [0.22, 1, 0.36, 1] });
    if (navTimer.current) window.clearTimeout(navTimer.current);
    navTimer.current = window.setTimeout(() => window.location.assign(href), PUNCH_MS * pace + 40);
  };

  const onPrimaryEnter = (e: PointerEvent<HTMLAnchorElement>) => {
    if (canTear && e.pointerType === "mouse") setTear(true);
  };

  const onDemoClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    // Keep Lenis' own anchor handler from scrolling a second time.
    e.stopPropagation();
    const hero = document.getElementById("hero");
    let done = false;
    const jump = () => (hero ? hero.scrollIntoView({ block: "start" }) : window.scrollTo({ top: 0 }));
    const finish = () => {
      if (done) return;
      done = true;
      if (demoTimer.current) window.clearTimeout(demoTimer.current);
      // The hero owns the composer and tags it (on the field or its wrapper); fail quietly if it isn't there.
      document
        .querySelector<HTMLElement>(
          ":is(input, textarea)[data-hero-composer], [data-hero-composer] :is(input, textarea, [contenteditable='true'])",
        )
        ?.focus({ preventScroll: true });
    };
    if (!lenis || still) {
      jump();
      finish();
      return;
    }
    lenis.scrollTo(hero ?? 0, { onComplete: finish });
    // Lenis can be stopped (Studio drawer open) or starved of frames; then onComplete never fires.
    const check = (retries: number) => {
      demoTimer.current = window.setTimeout(() => {
        if (done) return;
        if (lenis.isScrolling && retries > 0) return void check(retries - 1);
        jump();
        finish();
      }, 1400 * pace);
    };
    if (demoTimer.current) window.clearTimeout(demoTimer.current);
    check(2);
  };

  return (
    <motion.div
      ref={passRef}
      className={cn(styles.pass, "relative mx-auto grid max-w-[1180px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,34%)]")}
      style={{ y: passY, rotate: passRotate }}
    >
      {/* MAIN PART */}
      <div
        className={cn(
          styles.main,
          "relative min-w-0 overflow-hidden rounded-t-2xl border border-b-0 border-line bg-surface lg:rounded-tr-none lg:rounded-l-2xl lg:border-r-0 lg:border-b",
        )}
      >
        <Stripes draw={inView} className="pt-4" />
        <div className="px-5 pt-8 pb-10 sm:px-10 sm:pt-10 sm:pb-12 lg:px-14 lg:pt-12 lg:pb-14">
          <SectionHeader
            eyebrow={copy.eyebrow}
            lines={copy.lines}
            body={<span className="block text-balance">{copy.body}</span>}
            className="max-w-none [&_h2]:text-[clamp(38px,6vw,92px)] [&_h2]:leading-[0.94]"
          />

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href={links.signup}
              onClick={onPrimaryClick}
              onPointerEnter={onPrimaryEnter}
              onPointerLeave={() => setTear(false)}
              className="k-btn k-btn-accent h-14 px-7 text-[17px]"
            >
              Get started
              <ArrowUpRight size={18} strokeWidth={2.25} aria-hidden />
            </a>
            <a href={links.login} className="k-btn k-btn-ghost h-14 px-6 text-[17px]">
              Log in
            </a>
          </div>
          <p className="mt-6">
            <a
              href="#hero"
              onClick={onDemoClick}
              className="inline-flex min-h-11 items-center text-[15px] text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
            >
              Or try the demo again<span aria-hidden>&nbsp;↑</span>
            </a>
          </p>
        </div>
      </div>

      {/* STUB */}
      <motion.aside
        aria-label="Ticket stub"
        className={cn(
          styles.stub,
          "relative flex min-w-0 flex-col overflow-hidden rounded-b-2xl border border-t-0 border-line bg-surface lg:rounded-bl-none lg:rounded-r-2xl lg:border-t lg:border-l-0",
        )}
        style={{ y: stubY, "--punch-r": punchR } as MotionStyle}
        initial={false}
        animate={tear && canTear ? { x: 6 * amp, rotate: 2 * amp } : { x: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 24 }}
      >
        <Stripes draw={inView} className="hidden pt-4 lg:flex" />
        {/* Punch guide: where the conductor's punch lands. */}
        <span aria-hidden className={cn(styles.punchGuide, "rounded-full border border-dashed border-line-strong")} />
        <div className="flex flex-1 flex-col px-5 pt-8 pb-6 sm:px-8 lg:pt-10">
          <p className="mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">Stub · keep this part</p>

          <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5">
            {fields.map((f) => (
              <div key={f.label} className={cn("min-w-0", f.wide && "col-span-2")}>
                <dt className="mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">{f.label}</dt>
                <dd
                  className={cn(
                    "mt-1.5 leading-tight break-words text-ink",
                    f.mono ? "mono text-[15px]" : "text-[17px] font-semibold",
                  )}
                >
                  {f.flap ? (
                    <>
                      <span className="sr-only">{f.value}</span>
                      <span aria-hidden>
                        <FlapText text={inView || still ? f.value.toUpperCase() : "···"} className="text-[15px]" />
                      </span>
                    </>
                  ) : (
                    f.value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {/* Route: all eight lines on one strip, the way the map draws them. */}
          <div className="mt-8" aria-hidden>
            <p className="mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">Route</p>
            <div className="relative mt-3 flex items-center justify-between">
              <span className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-ink" />
              {lineOrder.map((id) => (
                <Roundel key={id} platform={id} size={26} className="relative" />
              ))}
            </div>
          </div>

          <div aria-hidden className="mt-auto pt-8">
            <div className={cn(styles.barcode, "h-10")}>
              {BARS.map((w, i) => (
                <span key={i} style={{ flexGrow: w }} />
              ))}
            </div>
            <p className="mono mt-2.5 flex justify-between gap-4 text-[11px] tracking-[0.08em] text-ink-soft uppercase">
              <span>KL · 0108</span>
              <span>Admit one team</span>
            </p>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}
