"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  LayoutGroup,
  motion,
  MotionConfig,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useLenis } from "lenis/react";
import { X as Close } from "lucide-react";

import { Legend } from "@/components/transit/glyph";
import { TransitLine } from "@/components/transit/line";
import { cn } from "@/lib/cn";
import { useLook } from "@/lib/studio/store";
import { buildLut, pointAt, polyline, toPath, travelMs, type LineStyle, type Pt, type Route } from "@/lib/transit/geometry";

import { Avatar } from "./badge";
import { SCRIPT_REPLY, type TeamId, type Thread } from "./data";
import { buildDocks, DockLines } from "./dock-lines";
import { Aborted, useMediaQuery, useSafeMotionPrefs, wait } from "./hooks";
import { AttentionBell, ChannelChips, EmptyRow, Row } from "./list";
import { Rail } from "./rail";
import { counts as countsOf, initialState, reducer, viewTitle, visibleThreads, type Action, type View } from "./state";
import { ContactSheet, ThreadView, type ThreadActions } from "./thread-view";

const travel = [0.65, 0, 0.35, 1] as const;

type Packet = { kind: "avatar" | "promo"; d: string; w: number; h: number; label?: string };

function centerOf(el: Element, frame: DOMRect, dx = 0): Pt {
  const r = el.getBoundingClientRect();
  return { x: r.left - frame.left + (dx ? dx : r.width / 2), y: r.top - frame.top + r.height / 2 };
}

/**
 * The assignee's track: from the rail avatar out to the rail's right margin (x = xr), up to the
 * seam above the target row, along that seam and down into the row's handler badge.
 */
function assignRoute(a: Pt, b: Pt, xr: number, seam: number, style: LineStyle): Route {
  if (style === "octilinear") {
    const c = 7;
    return polyline(
      [
        a,
        { x: xr - c, y: a.y },
        { x: xr, y: a.y - c },
        { x: xr, y: seam + c },
        { x: xr + c, y: seam },
        { x: b.x - c, y: seam },
        { x: b.x, y: seam + c },
        b,
      ],
      3,
    );
  }
  return polyline([a, { x: xr, y: a.y }, { x: xr, y: seam }, { x: b.x, y: seam }, b], style === "cord" ? 16 : 9);
}

function abortable(signal: AbortSignal) {
  return new Promise<never>((_, reject) => {
    if (signal.aborted) reject(new Aborted());
    signal.addEventListener("abort", () => reject(new Aborted()), { once: true });
  });
}

/**
 * §06 inbox: a three-pane inbox in the landing palette. Lines dock into the thread rows by
 * scroll, then a one-shot script assigns the Needs-attention thread to Asha, marks it done and
 * sorts a promo email into Gmail Promotions. Any visitor action stops the script where it is.
 */
export function InboxDemo() {
  const look = useLook();
  const { still, pace } = useSafeMotionPrefs();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isMd = useMediaQuery("(min-width: 768px)");
  const [state, dispatch] = useReducer(reducer, initialState);

  const frameRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const scriptRef = useRef<AbortController | null>(null);
  const ranRef = useRef(false);
  /** The script reached its last beat (or its end state was applied directly). */
  const finishedRef = useRef(false);
  const interactedRef = useRef(false);
  const timers = useRef(new Set<number>());
  const seq = useRef(0);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const gutterRef = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(-320);
  const [docked, setDocked] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [packet, setPacket] = useState<Packet | null>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const trackDraw = useMotionValue(0);

  // Where the section's left edge sits relative to the gutter: the docking lines enter there.
  useEffect(() => {
    const gutter = gutterRef.current;
    const section = gutter?.closest("section");
    if (!gutter || !section) return;
    const measure = () => setLeft(Math.round(section.getBoundingClientRect().left - gutter.getBoundingClientRect().left));
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    ro.observe(gutter);
    return () => ro.disconnect();
  }, []);

  const visible = useMemo(
    () => visibleThreads(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only these slices change the list
    [state.threads, state.view, state.channel],
  );
  const counts = useMemo(() => countsOf(state), [state]);
  const selected = state.threads.find((t) => t.id === state.selected) ?? state.threads[0];

  const docks = useMemo(() => buildDocks(visible, left, look.lines), [visible, left, look.lines]);
  const lmax = docks.reduce((m, d) => Math.max(m, d.len), 1);
  const lenById = useMemo(() => new Map(docks.map((d) => [d.id, d.len])), [docks]);

  // Desktop: lines draw with scroll. Mobile: stubs fill once in view, 40ms apart. Still: assembled.
  const { scrollYProgress } = useScroll({ target: frameRef, offset: ["start end", "start 0.4"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const scrollTip = useTransform(smooth, (v) => v * (lmax + 40));
  const mobileTip = useMotionValue(0);
  const fullTip = useMotionValue(100000);
  const tip: MotionValue<number> = still ? fullTip : isDesktop ? scrollTip : mobileTip;

  useMotionValueEvent(smooth, "change", (v) => {
    if (v > 0.96 && !docked) setDocked(true);
  });

  const listInView = useInView(listRef, { once: true, amount: 0.15 });
  useEffect(() => {
    if (!listInView || isDesktop || still) return;
    const target = visible.length * 24 + 40;
    const controls = animate(mobileTip, target, { duration: (target / 0.6 / 1000) * pace, ease: "linear" });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- play once per breakpoint switch
  }, [listInView, isDesktop, still]);

  // ---------- Visitor actions (each one stops the script where it is) ----------
  const later = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);

  useEffect(() => {
    const set = timers.current;
    return () => {
      scriptRef.current?.abort();
      set.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const interact = useCallback(() => {
    interactedRef.current = true;
    scriptRef.current?.abort();
  }, []);

  const user = useCallback(
    (a: Action) => {
      interact();
      dispatch(a);
    },
    [interact],
  );

  const actions: ThreadActions = useMemo(
    () => ({
      assign: (id: string, to: TeamId | null) => user({ type: "assign", id, to }),
      stopBot: (id: string) => {
        user({ type: "stopBot", id });
        later(1100 * (pace || 1), () => dispatch({ type: "nudge", id }));
      },
      resumeBot: (id: string) => user({ type: "resumeBot", id }),
      done: (id: string) => user({ type: "done", id, by: "A" }),
      reply: (id: string, text: string) => {
        seq.current += 1;
        const msgId = `${id}-u${seq.current}`;
        user({ type: "reply", id, msgId, by: "A", text, status: "Sending…" });
        later(750 * (pace || 1), () => dispatch({ type: "status", id, msgId, status: "Sent" }));
      },
    }),
    [user, later, pace],
  );

  const onView = useCallback((v: View) => user({ type: "view", view: v }), [user]);

  const openRow = (id: string, el: HTMLElement | null) => {
    user({ type: "select", id });
    if (!isDesktop) {
      lastTrigger.current = el;
      setSheetOpen(true);
    }
  };

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    lastTrigger.current?.focus();
  }, []);

  // ---------- The one-shot script ----------
  const ride = useCallback(
    async (kind: Packet["kind"], signal: AbortSignal) => {
      const frame = frameRef.current;
      if (!frame) return;
      const fr = frame.getBoundingClientRect();
      const fromEl = frame.querySelector(kind === "avatar" ? '[data-avatar="A"]' : '[data-row="promo"]');
      const toEl = frame.querySelector(kind === "avatar" ? '[data-badge="ms"]' : '[data-tab="promotions"]');
      if (!fromEl || !toEl) return;
      const a = centerOf(fromEl, fr, kind === "promo" ? 72 : 0);
      const b = centerOf(toEl, fr);
      let route: Route;
      /** The drawn track; for the avatar it stops just above the badge so it never strikes through its text. */
      let track: Route | null = null;
      if (kind === "avatar") {
        const rail = frame.querySelector("[data-rail]");
        const row = toEl.closest("[data-row]");
        if (!rail || !row) return;
        // Up the rail's right margin, across the seam above the row, down into the badge:
        // the track never crosses a name, a label or the open assignee menu.
        const xr = rail.getBoundingClientRect().right - fr.left - 7;
        const seam = row.getBoundingClientRect().top - fr.top;
        route = assignRoute(a, b, xr, seam, look.lines);
        track = assignRoute(a, { x: b.x, y: toEl.getBoundingClientRect().top - fr.top - 4 }, xr, seam, look.lines);
      } else {
        const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 90 };
        const segs: Route["segs"] = [{ k: "Q", a, c, b }];
        route = { segs, d: toPath(segs) };
      }
      const lut = buildLut(route);
      px.set(a.x);
      py.set(a.y);
      trackDraw.set(0);
      setPacket({ kind, d: (track ?? route).d, w: fr.width, h: fr.height, label: kind === "promo" ? "GM · Spring edit: 30% off" : undefined });
      const stop = abortable(signal);
      stop.catch(() => {});
      if (kind === "avatar") {
        const draw = animate(trackDraw, 1, { duration: 0.28 * pace, ease: travel });
        try {
          await Promise.race([draw.finished, stop]);
        } finally {
          draw.stop();
        }
      }
      const ms = kind === "promo" ? 480 : travelMs(lut.length);
      const ridePlay = animate(0, 1, {
        duration: (ms * pace) / 1000,
        ease: travel,
        onUpdate: (t) => {
          const p = pointAt(lut, t);
          px.set(p.x);
          py.set(p.y);
        },
      });
      try {
        await Promise.race([ridePlay.finished, stop]);
      } finally {
        ridePlay.stop();
      }
    },
    [look.lines, pace, px, py, trackDraw],
  );

  const play = useCallback(
    async (signal: AbortSignal) => {
      const beat = (ms: number) => wait(ms * pace, signal);
      try {
        await beat(250);
        dispatch({ type: "highlight", id: "ms" });
        await beat(450);
        dispatch({ type: "menu", id: "ms" });
        await beat(500);
        if (isDesktop) await ride("avatar", signal);
        setPacket(null);
        dispatch({ type: "assign", id: "ms", to: "A" });
        dispatch({ type: "menu", id: null });
        await beat(750);
        dispatch({ type: "reply", id: "ms", msgId: "ms-script", by: "A", text: SCRIPT_REPLY, status: "Sending…" });
        await beat(800);
        dispatch({ type: "status", id: "ms", msgId: "ms-script", status: "Sent" });
        await beat(700);
        dispatch({ type: "done", id: "ms", by: "A" });
        dispatch({ type: "highlight", id: null });
        await beat(900);
        dispatch({ type: "lift", id: "promo" });
        if (isDesktop) await ride("promo", signal);
        else await beat(350);
        setPacket(null);
        dispatch({ type: "tab", id: "promo", tab: "promotions" });
        dispatch({ type: "lift", id: null });
        finishedRef.current = true;
      } catch {
        // A visitor took over: keep the state they see, tidy the transient bits.
        dispatch({ type: "menu", id: null });
        dispatch({ type: "highlight", id: null });
        dispatch({ type: "lift", id: null });
        setPacket(null);
      }
    },
    [isDesktop, pace, ride],
  );

  const frameInView = useInView(frameRef, { amount: 0.35 });
  const ready = frameInView && !still && (isDesktop ? docked : true);

  useEffect(() => {
    if (!ready || ranRef.current || interactedRef.current) return;
    ranRef.current = true;
    const ctrl = new AbortController();
    scriptRef.current = ctrl;
    void play(ctrl.signal);
  }, [ready, play]);

  // Reduced motion / Studio "Still" (also when switched on mid-script): show the finished
  // board with no travel. A visitor who already took over keeps the state they made.
  useEffect(() => {
    if (!still) return;
    const id = window.setTimeout(() => {
      if (finishedRef.current || interactedRef.current) return;
      ranRef.current = true;
      finishedRef.current = true;
      scriptRef.current?.abort();
      dispatch({ type: "scriptEnd" });
    }, 0);
    return () => window.clearTimeout(id);
  }, [still]);

  const filtered = state.channel !== "all" || state.view !== "all";

  return (
    // OS reduced motion: transforms jump instead of travelling, even on the hydration pass.
    <MotionConfig reducedMotion="user">
      <div
        ref={frameRef}
        role="group"
        aria-label="Demo inbox"
        className="relative mt-12 md:mt-16 lg:mt-32 lg:grid lg:h-[578px] lg:grid-cols-[196px_72px_minmax(0,1fr)] xl:grid-cols-[220px_72px_minmax(0,1fr)]"
      >
        <Rail className="hidden lg:flex" view={state.view} counts={counts} onView={onView} />

        <div ref={gutterRef} className="relative hidden lg:block" aria-hidden>
          {isDesktop && <DockLines docks={docks} left={left} tip={tip} activeIds={[state.selected, state.highlight]} />}
        </div>

        <div className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex h-14 items-center gap-3 border-b border-line px-3">
            <ChannelChips
              value={state.channel}
              attention={{ instagram: counts.bellIg, messenger: counts.bellMs }}
              onChange={(c) => user({ type: "channel", channel: c })}
            />
          </div>

          <div className="flex min-h-0 flex-1">
            <div className="flex w-full min-w-0 flex-col lg:w-[320px] lg:shrink-0 lg:border-r lg:border-line xl:w-[360px]">
              <div className="flex h-10 items-center gap-3 border-b border-line px-4">
                <p className="mono min-w-0 truncate text-[11px] tracking-[0.06em] text-ink-soft uppercase">
                  {viewTitle(state.view)} · {visible.length}
                </p>
                {filtered && (
                  <button
                    type="button"
                    onClick={() => {
                      user({ type: "channel", channel: "all" });
                      dispatch({ type: "view", view: "all" });
                    }}
                    className="mono -my-2 min-h-11 shrink-0 px-1 text-[11px] tracking-[0.06em] text-ink uppercase underline underline-offset-2 lg:pointer-fine:min-h-0"
                  >
                    Clear
                  </button>
                )}
                <AttentionBell className="ml-auto lg:hidden" ig={counts.bellIg} ms={counts.bellMs} />
              </div>
              <LayoutGroup>
                <ul ref={listRef} aria-label="Threads" className="relative lg:h-[480px] lg:overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {visible.map((t, i) => (
                      <Row
                        key={t.id}
                        thread={t}
                        selected={isDesktop && t.id === state.selected}
                        highlighted={t.id === state.highlight}
                        menuOpen={t.id === state.menuFor}
                        lifting={t.id === state.lifting}
                        tip={tip}
                        len={isDesktop ? (lenById.get(t.id) ?? 0) : i * 24 + 1}
                        onSelect={(el) => openRow(t.id, el)}
                      />
                    ))}
                  </AnimatePresence>
                  {visible.length === 0 && <EmptyRow />}
                </ul>
              </LayoutGroup>
            </div>

            <div className="hidden min-w-0 flex-1 lg:flex">
              {/* Keyed so a half-typed draft or an open popover never carries over to another thread. */}
              <ThreadView key={selected.id} thread={selected} actions={actions} variant="pane" className="flex-1" />
              <div data-lenis-prevent className="hidden w-[212px] shrink-0 overflow-y-auto border-l border-line p-4 xl:block">
                <ContactSheet thread={selected} />
              </div>
            </div>
          </div>
        </div>

        {packet && (
          <div className="pointer-events-none absolute inset-0 z-30" aria-hidden>
            {packet.kind === "avatar" && (
              <svg className="absolute inset-0 overflow-visible" width={packet.w} height={packet.h}>
                <TransitLine d={packet.d} color="var(--k-ink)" width={2} casing={false} opacity={0.6} progress={trackDraw} />
              </svg>
            )}
            <motion.div className="absolute top-0 left-0" style={{ x: px, y: py }}>
              <div className="-translate-x-1/2 -translate-y-1/2">
                {packet.kind === "avatar" ? (
                  <Avatar id="A" size={22} className="shadow-[0_0_0_2px_var(--k-surface)]" />
                ) : (
                  <span className="mono block rounded-md border border-line-strong bg-surface px-2 py-1 text-[11px] whitespace-nowrap text-ink shadow-[0_2px_0_0_var(--k-line)]">
                    {packet.label}
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <Legend handlers={["incoming", "agent", "attention", "team"]} />
        <p className="mono text-[11px] tracking-[0.06em] text-ink-soft uppercase">Interactive demo · nothing is sent</p>
      </div>

      {!isDesktop && (
        <ThreadSheet open={sheetOpen} side={isMd} thread={selected} actions={actions} onClose={closeSheet} />
      )}
    </MotionConfig>
  );
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea, summary, [tabindex]:not([tabindex="-1"])';

/** Mobile / tablet: the open thread slides over the list (bottom sheet on phones, side panel on tablets). */
function ThreadSheet({
  open,
  side,
  thread,
  actions,
  onClose,
}: {
  open: boolean;
  side: boolean;
  thread: Thread;
  actions: ThreadActions;
  onClose: () => void;
}) {
  const { still, pace } = useSafeMotionPrefs();
  const lenis = useLenis();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"chat" | "contact">("chat");
  // Every opening (and every other thread) starts on the conversation; a closing sheet keeps
  // its view while it slides away.
  const [shownFor, setShownFor] = useState<string | null>(null);
  const openKey = open ? thread.id : null;
  if (openKey !== shownFor) {
    setShownFor(openKey);
    if (openKey) setView("chat");
  }

  // Modal behaviour: page scroll stops, Escape closes, and Tab cycles inside the sheet.
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      const panel = panelRef.current;
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, lenis, onClose]);

  const off = still ? { opacity: 0 } : side ? { x: "100%" } : { y: "100%" };
  const on = still ? { opacity: 1 } : side ? { x: 0 } : { y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="sheet" className="fixed inset-0 z-[80]" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.div
            className="absolute inset-0 bg-ink/30"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: still ? 0.15 : 0.2 * pace }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Thread with ${thread.name}`}
            data-lenis-prevent
            className={
              side
                ? "absolute inset-y-0 right-0 flex w-[min(520px,92vw)] flex-col border-l border-line bg-surface"
                : "absolute inset-x-0 bottom-0 flex h-[88svh] flex-col rounded-t-2xl border-t border-line bg-surface"
            }
            initial={off}
            animate={on}
            exit={off}
            transition={{ duration: still ? 0.15 : 0.42 * pace, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Conversation or contact, one at a time: the contact card takes the log's place
                instead of squeezing the conversation to a sliver. */}
            <div className="flex items-center gap-2 border-b border-line py-2 pr-2 pl-4">
              <div role="group" aria-label="Show" className="flex rounded-full bg-bg p-1 shadow-[inset_0_0_0_1px_var(--k-line)]">
                {(
                  [
                    ["chat", "Conversation"],
                    ["contact", "Contact"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={view === id}
                    onClick={() => setView(id)}
                    className={cn(
                      "h-9 rounded-full px-3.5 text-[13px] transition-colors",
                      view === id ? "bg-surface font-semibold text-ink shadow-[0_0_0_1px_var(--k-line-strong)]" : "text-ink-soft",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close thread"
                className="ml-auto grid size-11 place-items-center rounded-full hover:bg-bg"
              >
                <Close size={18} aria-hidden />
              </button>
            </div>
            <ThreadView
              thread={thread}
              actions={actions}
              variant="sheet"
              className="min-h-0 flex-1"
              replaceLog={view === "contact" ? <ContactSheet thread={thread} /> : undefined}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
