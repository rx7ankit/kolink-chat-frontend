"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from "motion/react";

import { Photo } from "@/components/media/photo";
import { FlapText } from "@/components/ui/flap-text";
import { GlyphShape, type Handler } from "@/components/transit/glyph";
import { TransitLine } from "@/components/transit/line";
import { cn } from "@/lib/cn";
import { demoBrand } from "@/lib/media";
import type { LookOptionValue } from "@/lib/studio/types";
import { buildLut, link, pointAt, polyline, travelMs, type Lut, type Pt, type Route as GeoRoute } from "@/lib/transit/geometry";

import { MediaThumb } from "./brand";
import { beats, finalPhase, messages, reached, triggerWords, type Phase, type Route } from "./data";
import { popTint } from "./hooks";

/* Geometry of the gutter that carries the line (px). Rows are HTML; stations sit DY below each row's top. */
const GUTTER = 96;
const TX = 22; // trunk
const BX = 62; // branch track
const RX = 80; // return loop
const DY = 16;

const ROWS = ["post", "comment", "nomatch", "reply", "opener", "gate", "ask", "deliver"] as const;
type RowId = (typeof ROWS)[number];

type Tops = { y: Record<RowId, number>; h: number };

export type Run = { step: number; phase: Phase | null };

/** The phase to render: the live run's phase, or the beat's start / end state when the run hasn't caught up. */
export function derivePhase(step: number, run: Run, still: boolean): Phase | null {
  const beat = beats[step - 1];
  if (!beat) return null;
  if (still || run.step > step) return finalPhase(beat.route);
  if (run.step < step) return null;
  return run.phase;
}

const ROUTE_ROWS: Record<Route, RowId[]> = {
  deliver: ["post", "comment", "reply", "opener", "gate", "deliver"],
  notyet: ["post", "comment", "reply", "opener", "gate", "ask"],
  followed: ["post", "comment", "gate", "ask", "deliver"],
  inbox: ["post", "comment", "nomatch"],
  skip: ["post", "comment"],
};

function useGeometry(tops: Tops | null, style: LookOptionValue<"lines">) {
  return useMemo(() => {
    if (!tops) return null;
    const { y } = tops;
    const p = (x: number, yy: number): Pt => ({ x, y: yy });
    const opts = style === "orthogonal" ? { bend: 1, r: 10 } : style === "octilinear" ? { bend: 0, r: 10 } : { sag: 0.12 };
    const trunk = polyline([p(TX, y.post), p(TX, y.deliver)]);
    const spur = link(p(TX, y.comment), p(BX, y.nomatch), style, opts);
    const notyet = link(p(TX, y.gate), p(BX, y.ask), style, opts);
    const back = polyline([p(BX, y.ask), p(RX, y.ask), p(RX, y.gate - 20), p(TX, y.gate - 20), p(TX, y.gate)], style === "cord" ? 16 : 9);
    const seg = (a: number, b: number): GeoRoute => polyline([p(TX, a), p(TX, b)]);
    const luts = {
      toReply: buildLut(seg(y.comment, y.reply), 24),
      toOpener: buildLut(seg(y.reply, y.opener), 24),
      toGate: buildLut(seg(y.opener, y.gate), 24),
      toDeliver: buildLut(seg(y.gate, y.deliver), 24),
      notyet: buildLut(notyet),
      back: buildLut(back),
      spur: buildLut(spur),
    };
    return { y, h: tops.h, trunk, spur, notyet, back, luts };
  }, [tops, style]);
}

export function SignalDiagram({
  step,
  phase,
  still,
  pace,
  lineStyle,
  onRun,
}: {
  step: number;
  phase: Phase | null;
  still: boolean;
  pace: number;
  lineStyle: LookOptionValue<"lines">;
  onRun: (run: Run) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [tops, setTops] = useState<Tops | null>(null);
  const geo = useGeometry(tops, lineStyle);
  const patternId = useId().replace(/:/g, "");

  // Measure row positions once per resize (never inside the animation loop).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const y = {} as Record<RowId, number>;
      el.querySelectorAll<HTMLElement>("[data-row]").forEach((row) => {
        y[row.dataset.row as RowId] = row.offsetTop + DY;
      });
      const next = { y, h: el.offsetHeight };
      setTops((prev) =>
        prev && prev.h === next.h && ROWS.every((r) => Math.abs(prev.y[r] - next.y[r]) < 0.5) ? prev : next,
      );
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const x = useMotionValue(TX);
  const y = useMotionValue(0);
  const opacity = useMotionValue(0);
  const gate = useMotionValue(0);
  const lastStep = useRef(0);

  useEffect(() => {
    if (!geo) return;
    const g = geo;
    const beat = beats[step - 1];
    const timers: number[] = [];
    const anims: AnimationPlaybackControls[] = [];
    let alive = true;
    const cleanup = () => {
      alive = false;
      timers.forEach((t) => window.clearTimeout(t));
      anims.forEach((a) => a.stop());
    };
    const place = (pt: Pt) => {
      x.set(pt.x);
      y.set(pt.y);
    };
    const gateTo = (deg: number, instant = false) => {
      if (instant) gate.set(deg);
      else anims.push(animate(gate, deg, { type: "spring", stiffness: 420, damping: 26 }));
    };

    const prev = lastStep.current;
    if (!beat || still || step <= prev) {
      // Jump straight to the beat's resting state: no travel when reversing or when motion is reduced.
      lastStep.current = step;
      const route = beat?.route;
      const parked: Record<Route, Pt | null> = {
        deliver: { x: TX, y: geo.y.deliver },
        followed: { x: TX, y: geo.y.deliver },
        notyet: { x: BX, y: geo.y.ask },
        inbox: { x: BX, y: geo.y.nomatch },
        skip: null,
      };
      const at = route ? parked[route] : null;
      if (at) place(at);
      opacity.set(at ? 1 : 0);
      gate.set(route === "deliver" || route === "followed" ? -80 : 0);
      const id = requestAnimationFrame(() => onRun({ step, phase: beat ? finalPhase(beat.route) : null }));
      return () => {
        cancelAnimationFrame(id);
        cleanup();
      };
    }

    const k = pace || 1;
    const wait = (ms: number) => new Promise<void>((res) => timers.push(window.setTimeout(res, ms * k)));
    const travel = (lut: Lut) =>
      new Promise<void>((res) => {
        anims.push(
          animate(0, 1, {
            duration: (travelMs(lut.length, 0.7) * k) / 1000,
            ease: [0.65, 0, 0.35, 1],
            onUpdate: (t) => {
              const pt = pointAt(lut, t);
              x.set(pt.x);
              y.set(pt.y);
            },
            onComplete: () => res(),
          }),
        );
      });
    const set = (ph: Phase) => {
      if (alive) onRun({ step, phase: ph });
    };
    const show = () => anims.push(animate(opacity, 1, { duration: 0.14 }));
    const L = geo.luts;

    async function play(route: Route) {
      await wait(16);
      if (!alive) return;
      lastStep.current = step;
      opacity.set(0);
      gateTo(0);
      if (route === "followed") {
        place({ x: BX, y: g.y.ask });
        set("waiting");
        show();
        await wait(420);
        if (!alive) return;
        set("tapped");
        await wait(320);
        if (!alive) return;
        await travel(L.back);
        if (!alive) return;
        set("checking");
        await wait(380);
        if (!alive) return;
        set("gateUp");
        gateTo(-80);
        await wait(260);
        if (!alive) return;
        await travel(L.toDeliver);
        set("delivered");
        return;
      }
      place({ x: TX, y: g.y.comment });
      if (route === "inbox") {
        set("incoming");
        show();
        await wait(420);
        if (!alive) return;
        set("sorted");
        await wait(140);
        if (!alive) return;
        await travel(L.spur);
        set("routed");
        return;
      }
      set("matched");
      show();
      if (route === "skip") {
        await wait(640);
        if (!alive) return;
        set("skipped");
        anims.push(animate(opacity, 0, { duration: 0.24 }));
        return;
      }
      await wait(220);
      if (!alive) return;
      await travel(L.toReply);
      if (!alive) return;
      set("replied");
      await wait(160);
      if (!alive) return;
      await travel(L.toOpener);
      if (!alive) return;
      set("opener");
      await wait(340);
      if (!alive) return;
      set("tapped");
      await wait(200);
      if (!alive) return;
      await travel(L.toGate);
      if (!alive) return;
      set("checking");
      await wait(340);
      if (!alive) return;
      if (route === "notyet") {
        await travel(L.notyet);
        set("asked");
        return;
      }
      set("gateUp");
      gateTo(-80);
      await wait(200);
      if (!alive) return;
      await travel(L.toDeliver);
      set("delivered");
    }

    void play(beat.route);
    return cleanup;
  }, [step, still, geo, pace, onRun, x, y, opacity, gate]);

  const beat = beats[step - 1] ?? null;
  const route = beat?.route ?? null;
  const at = (target: Phase) => (route && phase ? reached(route, phase, target) : false);
  const matched = route !== null && route !== "inbox";

  const lit = {
    comment: matched && phase !== null,
    reply: route === "followed" || at("replied"),
    opener: route === "followed" || at("opener"),
    gate: at("checking"),
    ask: route === "followed" || at("asked"),
    deliver: at("delivered"),
    nomatch: at("routed"),
  };
  const openerTapped = route === "followed" || at("tapped");
  const followTapped = route === "followed" && at("tapped");
  const gateLabel =
    route === "notyet" && at("asked")
      ? "NOT YET"
      : at("gateUp")
        ? "YES"
        : at("checking")
          ? "CHECKING"
          : route === "followed"
            ? "WAITING"
            : "—";
  const involved = (row: RowId) => !route || ROUTE_ROWS[route].includes(row);
  const packet: Handler = route === "inbox" ? (phase === "incoming" || phase === null ? "incoming" : "team") : "automation";

  return (
    <div ref={rootRef} className="relative">
      {geo && (
        <svg
          aria-hidden
          width={GUTTER}
          height={geo.h}
          viewBox={`0 0 ${GUTTER} ${geo.h}`}
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
        >
          <defs>
            <pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="8" fill="var(--k-surface)" />
              <rect width="4" height="8" fill="var(--k-ink)" />
            </pattern>
          </defs>

          <TransitLine d={geo.spur.d} width={3} color="var(--k-ink-soft)" />
          <TransitLine d={geo.back.d} width={3} platform="instagram" dashed />
          <TransitLine d={geo.notyet.d} width={3} platform="instagram" />
          <TransitLine d={geo.trunk.d} width={4} platform="instagram" />

          {/* Signal head at the keyword check: pop3 = matched, ink = no match. */}
          <g transform={`translate(${TX + 21} ${geo.y.comment - 21})`}>
            <rect x={-7} y={-13} width={14} height={27} rx={7} fill="var(--k-ink)" />
            <circle cy={-6} r={4} fill="var(--k-surface)" opacity={0.22} />
            <circle cy={7} r={4} fill="var(--k-surface)" opacity={0.22} />
            <circle cy={-6} r={4} fill="var(--k-pop3)" style={{ opacity: matched && phase ? 1 : 0, transition: "opacity .2s" }} />
            <circle cy={7} r={4} fill="var(--k-surface)" style={{ opacity: route === "inbox" && phase ? 1 : 0, transition: "opacity .2s" }} />
          </g>

          {/* Termini and stations */}
          <g transform={`translate(${TX} ${geo.y.post}) rotate(90)`}>
            <GlyphShape handler="post" size={13} />
          </g>
          <Stop x={TX} y={geo.y.comment} lit={lit.comment} />
          <Stop x={TX} y={geo.y.reply} lit={lit.reply} />
          <Stop x={TX} y={geo.y.opener} lit={lit.opener} />
          <Stop x={TX} y={geo.y.gate} lit={lit.gate} />
          <Stop x={BX} y={geo.y.ask} lit={lit.ask} />
          <g transform={`translate(${BX} ${geo.y.nomatch})`}>
            <rect x={-7} y={-7} width={14} height={14} rx={3.5} fill="var(--k-surface)" stroke="var(--k-ink)" strokeWidth={2.5} />
            <rect x={-3.5} y={-3.5} width={7} height={7} rx={1.5} fill="var(--k-ink)" style={{ opacity: lit.nomatch ? 1 : 0, transition: "opacity .24s" }} />
          </g>
          <g transform={`translate(${TX} ${geo.y.deliver})`}>
            <circle r={10} fill="var(--k-surface)" stroke="var(--k-ink)" strokeWidth={2.5} />
            <circle r={5} fill="var(--k-pop3)" stroke="var(--k-ink)" strokeWidth={1.5} style={{ opacity: lit.deliver ? 1 : 0, transition: "opacity .24s" }} />
          </g>

          {/* Barrier gate below the follow check. An invisible counterweight centres the box on the pivot. */}
          <g transform={`translate(${TX - 14} ${geo.y.gate + 19})`}>
            <motion.g style={{ rotate: gate }}>
              <rect x={-26} y={-3} width={52} height={6} fill="none" />
              <rect x={0} y={-3} width={26} height={6} rx={1.5} fill={`url(#${patternId})`} stroke="var(--k-ink)" strokeWidth={1.25} />
            </motion.g>
            <rect x={-4} y={-5} width={8} height={14} rx={2} fill="var(--k-ink)" />
          </g>

          <motion.g style={{ x, y, opacity }}>
            <GlyphShape handler={packet} size={14} />
          </motion.g>
        </svg>
      )}

      <Row id="post" dim={!involved("post")} label="Post">
        <p className="flex items-center gap-2 text-[13px] leading-snug text-ink-soft">
          <span className="relative block h-[26px] w-[21px] shrink-0 overflow-hidden rounded-[5px] bg-bg-alt" aria-hidden>
            <MediaThumb src="reel" sizes="24px" />
          </span>
          <span className="min-w-0">
            <span className="text-ink">@{demoBrand.handle}</span> · Reel · added after posting
          </span>
        </p>
      </Row>

      <Row id="comment" dim={!involved("comment")} label="Comment contains">
        <ul className="flex flex-wrap gap-1.5" aria-label="Trigger words">
          {triggerWords.map((w) => {
            const hit = matched && phase !== null && w === "link";
            return (
              <li
                key={w}
                className="mono rounded-full border border-line-strong px-2 py-[3px] text-[11.5px] leading-none text-ink"
                style={{ background: hit ? popTint(3, 40) : "var(--k-surface)", transition: "background-color .2s" }}
              >
                {w}
              </li>
            );
          })}
        </ul>
      </Row>

      <Row id="nomatch" dim={!involved("nomatch")} label="No match → Inbox" branch>
        <p className="text-[13px] leading-snug text-ink-soft">Left for your team.</p>
      </Row>

      <Row id="reply" dim={!involved("reply")} label="Reply in public">
        <Bubble>
          <span className="font-semibold">{demoBrand.handle}</span> {messages.publicReply}
        </Bubble>
      </Row>

      <Row id="opener" dim={!involved("opener")} label="DM opener">
        <Bubble dm>
          {messages.opener}
          <DmButton tapped={openerTapped} still={still}>
            {messages.openerButton}
          </DmButton>
        </Bubble>
      </Row>

      <Row id="gate" dim={!involved("gate")} label="Follows you?">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-snug text-ink-soft">
          {/* Idle reads as an empty outlined tile; it fills in once the check runs. */}
          <span
            className={cn(
              "mono inline-flex min-w-[72px] justify-center rounded-[3px] border px-1.5 py-[3px] text-[11px] leading-none transition-colors duration-200",
              gateLabel === "—" ? "border-line-strong bg-surface text-ink-soft" : "border-ink bg-ink text-bg",
            )}
          >
            <span aria-hidden>
              <FlapText text={gateLabel} />
            </span>
            <span className="sr-only">Gate: {gateLabel === "—" ? "idle" : gateLabel}</span>
          </span>
          Optional · after the tap
        </p>
      </Row>

      <Row id="ask" dim={!involved("ask")} label="Not yet → Ask to follow" branch>
        <Bubble dm>
          {messages.followPrompt}
          <DmButton tapped={followTapped} still={still}>
            {messages.followButton}
          </DmButton>
        </Bubble>
      </Row>

      <Row id="deliver" dim={!involved("deliver")} label="Yes → Deliver" last>
        {/* The media goes out first, then the text with its link button (one reward per person per post). */}
        <div className="ka-reward flex max-w-[430px] flex-col items-start gap-1.5">
          <style>{rewardCss}</style>
          <div className="ka-reward-media relative aspect-[4/5] w-[132px] shrink-0 overflow-hidden rounded-xl rounded-tl-[4px] border border-line bg-bg-alt" aria-hidden>
            <Photo id="linenDrop" alt="" sizes="(min-width: 1024px) 88px, 132px" className="object-[50%_38%]" />
          </div>
          <Bubble dm className="ka-reward-text w-full min-w-0">
            {messages.reward}
            <span className="mt-2 block rounded-md border border-line-strong px-3 py-1.5 text-center text-[12.5px] font-semibold">
              {messages.rewardButton}
            </span>
          </Bubble>
        </div>
      </Row>
    </div>
  );
}

/*
 * The reward is two DMs: the image goes out first, then the text with its link button,
 * so they stack like a chat. A pinned desktop stage on a short viewport has no room
 * for the stack, so there the image sits beside the bubble instead.
 */
const rewardCss = `@media (min-width: 1024px) { .ka-reward-media { width: 88px; } }
@media (min-width: 1024px) and (max-height: 879.98px) {
  .ka-reward { flex-direction: row; align-items: flex-end; }
  .ka-reward-media { width: 68px; }
  .ka-reward-text { flex: 1 1 0%; }
}`;

function Row({
  id,
  label,
  children,
  dim,
  branch = false,
  last = false,
}: {
  id: RowId;
  label: string;
  children: ReactNode;
  dim: boolean;
  branch?: boolean;
  last?: boolean;
}) {
  return (
    <div
      data-row={id}
      className={cn("grid gap-x-4 gap-y-1.5 pt-2 lg:grid-cols-[140px_minmax(0,1fr)]", last ? "pb-1" : "pb-2.5")}
      style={{ paddingLeft: GUTTER + 6, opacity: dim ? 0.45 : 1, transition: "opacity .3s cubic-bezier(.22,1,.36,1)" }}
    >
      <div className="min-w-0">
        <p className={cn("mono text-[11px] leading-4 tracking-[0.07em] uppercase", branch ? "text-ink-soft" : "text-ink")}>{label}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Bubble({ children, dm = false, className }: { children: ReactNode; dm?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-[430px] rounded-xl border border-line bg-surface px-3 py-2 text-[13px] leading-snug text-ink",
        dm && "rounded-tl-[4px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function DmButton({ children, tapped, still }: { children: ReactNode; tapped: boolean; still: boolean }) {
  return (
    <span className="relative mt-2 block">
      <motion.span
        key={tapped ? "tapped" : "idle"}
        className="block rounded-md border border-line-strong bg-surface px-3 py-1.5 text-center text-[12.5px] font-semibold"
        initial={tapped && !still ? { scale: 0.94 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 28 }}
        style={tapped ? { boxShadow: "inset 0 0 0 2px var(--k-pop3-deep)" } : undefined}
      >
        {children}
      </motion.span>
      <span
        className="mono absolute top-1/2 right-3 -translate-y-1/2 text-[11px] tracking-[0.04em] text-ink-soft uppercase"
        style={{ opacity: tapped ? 1 : 0, transition: "opacity .2s" }}
        aria-hidden
      >
        tapped
      </span>
    </span>
  );
}

function Stop({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={7.5} fill="var(--k-surface)" stroke="var(--k-ink)" strokeWidth={2.5} />
      <circle r={3.75} fill="var(--k-pop3)" stroke="var(--k-ink)" strokeWidth={1.25} style={{ opacity: lit ? 1 : 0, transition: "opacity .24s" }} />
    </g>
  );
}
