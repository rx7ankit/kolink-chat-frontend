"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { motion, useInView, useMotionValue, useScroll, useSpring, useTransform, type MotionStyle } from "motion/react";
import { ArrowDown } from "lucide-react";

import { lineOrder } from "@/lib/capabilities";
import { cn } from "@/lib/cn";
import { initialBoard, reduceBoard, type Action } from "@/lib/hero/board";
import { Clock, isAbort } from "@/lib/hero/clock";
import { BOARD_ROWS_CENTER, type HeroLayout } from "@/lib/hero/layout";
import { intentOf, routePost, visitorMedia } from "@/lib/hero/router";
import { scriptOrder, scripts } from "@/lib/hero/scripts";
import { finalBoard } from "@/lib/hero/timeline";
import type { Media, Script } from "@/lib/hero/types";
import { platformById, type PlatformId } from "@/lib/platforms";
import { links } from "@/lib/site";
import { fontPairings } from "@/lib/studio/font-pairings";
import { useLook, useMotionPrefs } from "@/lib/studio/store";

import { Board } from "./board";
import { Composer, type ComposerHandle } from "./composer";
import { draftStore } from "./draft-store";
import { runAuto, runOnce, type Env } from "./driver";
import { GridOverlay } from "./grid-overlay";
import { Hub } from "./hub";
import { InboxPill } from "./inbox-pill";
import { PacketLayer, type PacketPool } from "./packet-layer";
import { RouteLayer } from "./route-layer";
import { StepRail } from "./step-rail";
import { useMedia, useStudioOpen, useTabVisible } from "./use-env";
import { useGeometry } from "./use-geometry";

type Job =
  | { kind: "auto"; n: number }
  | { kind: "visitor-idle"; n: number }
  | { kind: "visitor"; n: number; script: Script }
  | { kind: "still-play"; n: number };

const noop = () => () => {};
/** False on the server and during hydration, true afterwards: keeps client-only state out of the SSR markup. */
function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** ≤ 22 words, and honest: the AI agent answers Instagram and Messenger DMs only. */
const SUBHEAD =
  "Publish to five networks. Answer eight channels from one inbox. Automations handle the routine; an AI agent answers Instagram and Messenger DMs.";

/** The client stage: one state machine, one geometry pipeline, three layouts (branch, interchange, spine). */
export function HeroStage({ title }: { title: ReactNode }) {
  const look = useLook();
  const { still: stillPref, pace, amp } = useMotionPrefs();
  const hydrated = useHydrated();
  const still = hydrated && stillPref;
  const xl = useMedia("(min-width: 75rem)");
  const fine = useMedia("(pointer: fine)");
  const layout: HeroLayout = xl ? (look.hero === "interchange" ? "interchange" : "branch") : "spine";

  const [board, dispatchRaw] = useReducer(reduceBoard, undefined, initialBoard);
  const [job, setJob] = useState<Job>({ kind: "auto", n: 0 });
  const [doneRun, setDoneRun] = useState(-1);
  const [userPaused, setUserPaused] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const [draftEmpty, setDraftEmpty] = useState(true);
  const [pinned, setPinned] = useState<PlatformId | null>(null);
  const [peek, setPeek] = useState<PlatformId | null>(null);
  const [media, setMedia] = useState<Media | null>(scripts[0].media);
  const [clock] = useState(() => new Clock());

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const galleyRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<ComposerHandle>(null);
  const stagePool = useRef<PacketPool>(null);
  const galleyPool = useRef<PacketPool>(null);
  const activeRun = useRef<object | null>(null);
  const jobRef = useRef(job);

  const inView = useInView(stageRef, { amount: 0.25 });
  const tabVisible = useTabVisible();
  const studioOpen = useStudioOpen();
  const geometry = useGeometry(stageRef, galleyRef, layout, look.lines);
  const geomRef = useRef(geometry);
  const layoutRef = useRef(layout);

  useEffect(() => {
    geomRef.current = geometry;
    layoutRef.current = layout;
    jobRef.current = job;
  });

  /* ---------------- pause gates (WCAG 2.2.2): offscreen, hidden tab, typing, pinned row, Studio, Pause */
  // "Play demo" (a still-mode run) becomes plain autoplay again once motion is allowed.
  const autoplay = job.kind === "auto" || (job.kind === "still-play" && !still);
  const autoGate = autoplay && (composerFocused || pinned !== null);
  const paused = userPaused || !inView || !tabVisible || studioOpen || autoGate;
  useEffect(() => {
    if (paused) clock.pause();
    else clock.resume();
  }, [paused, clock]);

  /** Drop scripted text and hide packets when a run ends or is aborted. */
  const clearSurfaces = useCallback(() => {
    composerRef.current?.reset();
    stagePool.current?.hideAll();
    galleyPool.current?.hideAll();
  }, []);

  /* ---------------- the driver: one AbortController per run */
  const ready = geometry !== null;
  const order = useMemo(() => scriptOrder(look.script), [look.script]);
  useEffect(() => {
    if (!ready || job.kind === "visitor-idle") return;
    if (still && job.kind === "auto") return;
    const ac = new AbortController();
    const token = {};
    activeRun.current = token;
    const env: Env = {
      dispatch: (a: Action) => {
        if (activeRun.current === token) dispatchRaw(a);
      },
      clock,
      signal: ac.signal,
      still,
      pace: still ? 1 : pace,
      composer: () => (activeRun.current === token ? composerRef.current : null),
      pool: () => (layoutRef.current === "spine" ? galleyPool.current : stagePool.current),
      geometry: () => geomRef.current,
      setMedia: (m) => {
        if (activeRun.current === token) setMedia(m);
      },
      trail: layout !== "spine",
      twang: look.lines === "cord",
    };
    const task =
      job.kind === "auto" || (job.kind === "still-play" && !still)
        ? runAuto(env, order)
        : job.kind === "visitor"
          ? runOnce(env, job.script, false)
          : runOnce(env, scripts[order[0]], true);
    const n = job.n;
    task
      .then(() => {
        if (activeRun.current === token) setDoneRun(n);
      })
      .catch((e) => {
        if (!isAbort(e)) console.error(e);
        // Still the active run, so nothing outside aborted it: the scripted teammate typing
        // yielded the bar to the visitor's own draft. Settle the board and count the run as done,
        // so the composer is back in compose mode and autoplay can resume once the draft is cleared.
        if (activeRun.current !== token) return;
        ac.abort();
        dispatchRaw({ t: "set", patch: { composer: { mode: "compose" }, chips: "idle", hub: "READY", siding: false } });
        dispatchRaw({ t: "rows", patch: { active: false } });
        stagePool.current?.hideAll();
        galleyPool.current?.hideAll();
        setDoneRun(n);
      });
    return () => {
      ac.abort();
      if (activeRun.current === token) activeRun.current = null;
      clearSurfaces();
    };
  }, [ready, job, still, pace, layout, order, look.lines, clock, clearSurfaces]);

  /* ---------------- visitor takeover: focus or "/" stops autoplay and soft-clears the board */
  const onComposerFocus = useCallback((focused: boolean) => {
    setComposerFocused(focused);
    if (!focused) return;
    const j = jobRef.current;
    if (j.kind === "auto" || j.kind === "still-play") {
      activeRun.current = null;
      dispatchRaw({ t: "reset" });
      setPinned(null);
      setJob({ kind: "visitor-idle", n: j.n + 1 });
    }
  }, []);

  const onSubmit = useCallback((text: string) => {
    const script = routePost(text);
    activeRun.current = null;
    setPinned(null);
    setUserPaused(false);
    setJob((j) => ({ kind: "visitor", n: j.n + 1, script }));
  }, []);

  const onDraftChange = useCallback((empty: boolean) => setDraftEmpty(empty), []);

  // Autoplay resumes after 8s idle with an empty composer (never under reduced motion).
  const visitorIdle =
    !still &&
    (job.kind === "visitor-idle" || (job.kind === "visitor" && doneRun === job.n)) &&
    !composerFocused &&
    draftEmpty &&
    pinned === null;
  useEffect(() => {
    if (!visitorIdle) return;
    const t = window.setTimeout(() => setJob((j) => ({ kind: "auto", n: j.n + 1 })), 8000);
    return () => window.clearTimeout(t);
  }, [visitorIdle]);

  // "/" anywhere focuses the composer, unless another field already has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      composerRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPauseToggle = useCallback(() => {
    if (still) {
      // A pause left over from before "Still" was chosen would freeze the stepped replay.
      setUserPaused(false);
      activeRun.current = null;
      setPinned(null);
      setJob((j) => ({ kind: "still-play", n: j.n + 1 }));
      return;
    }
    setUserPaused((p) => !p);
  }, [still]);

  const onPin = useCallback((id: PlatformId) => setPinned((p) => (p === id ? null : id)), []);
  const onPeek = useCallback((id: PlatformId | null) => setPeek(id), []);
  const onResume = useCallback(() => setPinned(null), []);

  /* ---------------- what the board shows */
  const stillFinal = useMemo(() => finalBoard(scripts[order[0]]), [order]);
  const showFinal = still && job.kind === "auto";
  const view = showFinal ? stillFinal : board;
  // A visitor's draft carries the sample photo its words point to while it is being typed, not
  // the last script's clip. Only an intent change re-renders the stage, never a keystroke.
  const draftIntent = useSyncExternalStore(draftStore.subscribe, () => intentOf(draftStore.get()), () => intentOf(""));
  const runMedia = showFinal ? scripts[order[0]].media : media;
  const drafting = job.kind === "visitor-idle" || (job.kind === "visitor" && doneRun === job.n && !draftEmpty);
  const composerMedia = drafting ? visitorMedia[draftIntent] : runMedia;
  // The board keeps the finished run's media on its rows until the next run starts.
  const boardMedia = job.kind === "visitor-idle" ? visitorMedia[draftIntent] : runMedia;

  // A pinned row always owns the pane (with its Resume chip), even before its line has traffic,
  // so pinning never pauses the demo without a visible way back.
  const previewId = peek ?? pinned;
  const preview = previewId
    ? {
        title: `${pinned === previewId ? "PINNED" : "LATEST"} · ${platformById[previewId].name.toUpperCase()}`,
        lines: view.rows[previewId].thread,
        pinned: pinned === previewId,
        platform: previewId,
      }
    : null;

  let active = 0;
  let carried = 0;
  lineOrder.forEach((id, i) => {
    if (view.rows[id].active) active |= 1 << i;
    if (view.rows[id].carried) carried |= 1 << i;
  });

  const visitor = job.kind === "visitor" || job.kind === "visitor-idle";
  const pauseLabel = still ? "Play demo" : userPaused ? "Resume demo" : "Pause demo";
  const demoPaused = paused || (still && job.kind === "auto");

  /* ---------------- exit parallax: H1 y 0→−32px, Archivo wdth 100→88 (desktop pointer:fine only) */
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const kinetic = useMotionValue(0);
  // The wdth squeeze only exists in a pairing with a width axis; otherwise it stays a constant 100
  // so scrolling never rewrites a style on the H1 subtree for nothing.
  const widthAxis = useMotionValue(0);
  const pairingKinetic = fontPairings.find((f) => f.id === look.font)?.kinetic ?? false;
  useEffect(() => {
    const on = xl && fine && !still;
    kinetic.set(on ? amp : 0);
    widthAxis.set(on && pairingKinetic ? 1 : 0);
  }, [xl, fine, still, amp, kinetic, widthAxis, pairingKinetic]);
  const yRaw = useTransform([scrollYProgress, kinetic], ([p, k]: number[]) => -32 * p * k);
  const titleY = useSpring(yRaw, { stiffness: 120, damping: 30 });
  const wdth = useTransform([scrollYProgress, widthAxis], ([p, k]: number[]) =>
    k > 0 ? Math.round(100 - 12 * Math.min(1, p / 0.6)) : 100,
  );

  const routesFor = (where: "stage" | "galley") =>
    geometry && (where === "galley" ? layout === "spine" : layout !== "spine") ? (
      <RouteLayer
        geo={geometry}
        active={active}
        carried={carried}
        siding={view.siding}
        still={still}
        pace={pace || 1}
        casing={where === "galley" ? "var(--k-surface)" : "var(--k-bg)"}
      />
    ) : null;
  const packetsFor = (where: "stage" | "galley") =>
    geometry && (where === "galley" ? layout === "spine" : layout !== "spine") ? (
      <PacketLayer
        ref={where === "galley" ? galleyPool : stagePool}
        size={where === "galley" ? 8 : 12}
        w={geometry.w}
        h={geometry.h}
      />
    ) : null;

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-labelledby="hero-title"
      className="k-section relative pt-8 pb-16 md:pt-12 md:pb-20 min-[75rem]:pt-14 min-[75rem]:pb-24"
      data-paused={demoPaused ? "true" : "false"}
    >
      <div className="k-container">
        <div
          ref={stageRef}
          role="group"
          aria-label="Live demo: one post publishes to five networks; replies from eight channels go to automations, the AI agent or your team. Simulated, nothing is sent."
          className="kh-stage"
        >
          <GridOverlay />
          {routesFor("stage")}

          {/* Kicker + H1 */}
          <div className="kh-a-title relative min-w-0" data-hx-watch>
            <p className="mono flex items-center gap-2 text-[11px] tracking-[0.08em] text-ink uppercase">
              <span aria-hidden className="kh-pulse kh-loop size-2 rounded-full border border-ink bg-pop-2" />
              Live demo · nothing is sent
            </p>
            <motion.div className="kh-titlewrap mt-4 min-[75rem]:mt-5" style={{ y: titleY, "--k-wdth": wdth } as MotionStyle}>
              {title}
            </motion.div>
          </div>

          <div className="kh-a-sub mt-5 min-w-0 min-[75rem]:mt-6" data-hx-watch>
            <p className="max-w-[44ch] text-[16px] leading-6 text-ink-soft md:text-[18px] md:leading-[28px] min-[75rem]:max-w-[min(40ch,calc(100%-48px))]">
              {SUBHEAD}
            </p>
          </div>

          <div className="kh-a-rail mt-7 min-w-0 min-[75rem]:mt-8" data-hx-watch>
            <StepRail step={view.step} still={still} />
          </div>

          <div className="kh-a-drive mt-3 min-w-0" data-hx-watch>
            <Composer
              ref={composerRef}
              mode={view.composer}
              chips={view.chips}
              media={composerMedia}
              visitor={visitor}
              still={still}
              pauseLabel={pauseLabel}
              onPauseToggle={onPauseToggle}
              onFocusChange={onComposerFocus}
              onSubmit={onSubmit}
              onDraftChange={onDraftChange}
            />
          </div>

          {/* Desktop INBOX pill: a station on the trunk, straight under the hub (on phones it sits in the galley header). */}
          <div className="kh-a-pill" data-hx-watch>
            <InboxPill inbox={view.inbox} attention={view.attention} still={still} />
          </div>

          <div className="kh-a-hub" style={{ paddingTop: BOARD_ROWS_CENTER - 40 - 28 }}>
            <Hub
              label={view.hub}
              turn={view.hubTurn}
              switchTurn={view.switchTurn}
              still={still}
              pace={pace || 1}
              drawMark={hydrated && !still}
            />
          </div>

          <Board
            view={view}
            media={boardMedia}
            pinned={pinned}
            preview={preview}
            still={still}
            onPin={onPin}
            onPeek={onPeek}
            onResume={onResume}
            galleyRef={galleyRef}
            routes={routesFor("galley")}
            packets={packetsFor("galley")}
          />

          <div className="kh-a-cta mt-8 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center min-[75rem]:mt-10">
            <a href={links.signup} className="k-btn k-btn-accent h-12 px-6 text-[15px]">
              Get started
            </a>
            <a href={links.login} className="k-btn k-btn-ghost h-12 px-6 text-[15px] min-[75rem]:hidden">
              Log in
            </a>
            <a
              href="#lines"
              className="mono inline-flex min-h-11 items-center justify-center gap-1.5 px-1 text-[12px] tracking-[0.06em] text-ink uppercase underline decoration-accent-text decoration-1 underline-offset-4"
            >
              Watch it route <ArrowDown size={14} aria-hidden />
            </a>
            <button
              type="button"
              onClick={onPauseToggle}
              className={cn("mono min-h-11 text-[12px] tracking-[0.06em] text-ink uppercase underline decoration-line-strong underline-offset-4 md:hidden")}
            >
              {pauseLabel}
            </button>
          </div>

          {packetsFor("stage")}
        </div>
      </div>
    </section>
  );
}
