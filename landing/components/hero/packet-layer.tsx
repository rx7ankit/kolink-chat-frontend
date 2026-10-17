"use client";

import { memo, useImperativeHandle, useRef, useState, type Ref } from "react";
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from "motion/react";

import { GlyphShape } from "@/components/transit/glyph";
import { abortError, type Clock } from "@/lib/hero/clock";
import type { PacketShape } from "@/lib/hero/types";
import { pointAt, type Lut } from "@/lib/transit/geometry";

/**
 * Packets are motion.g groups whose x / y / rotate are set from pointAt(lut, progress):
 * one animated value per packet (the progress tween), no layout reads, no CSS offset-path.
 */

export type PacketRun = {
  lut: Lut;
  d: string;
  shape: PacketShape;
  from: number;
  to: number;
  /** ms, already scaled by pace. */
  duration: number;
  trail: boolean;
  twang: boolean;
  scale: number;
};

export type PacketHandle = {
  run(r: PacketRun, clock: Clock, signal: AbortSignal): Promise<void>;
  hide(): void;
};

/** `gen` ties a slot to the pool generation it was taken from (hideAll starts a new one). */
export type PacketSlot = { idx: number; gen: number; handle: PacketHandle };

export type PacketPool = {
  acquire(): PacketSlot | null;
  release(slot: PacketSlot): void;
  hideAll(): void;
};

const TRAVEL = [0.65, 0, 0.35, 1] as const;

/** Await an animation while honouring the clock (pause/resume) and the run's abort signal. */
function settle(controls: AnimationPlaybackControls, clock: Clock, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const untrack = clock.track(controls);
    const onAbort = () => {
      controls.stop();
      untrack();
      reject(abortError());
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    controls.finished.then(
      () => {
        signal.removeEventListener("abort", onAbort);
        untrack();
        resolve();
      },
      () => {
        signal.removeEventListener("abort", onAbort);
        untrack();
        resolve();
      },
    );
  });
}

function PacketGlyph({ shape, scale }: { shape: PacketShape; scale: number }) {
  if (shape === "post") {
    return (
      <g transform={`scale(${scale})`}>
        <rect x={-30} y={-10} width={60} height={20} rx={10} fill="var(--k-accent)" stroke="var(--k-ink)" strokeWidth={1.5} />
        <text
          x={0}
          y={0.5}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fontWeight={700}
          letterSpacing="0.14em"
          fill="var(--k-accent-ink)"
          style={{ fontFamily: "var(--k-font-mono), ui-monospace, monospace" }}
        >
          POST
        </text>
      </g>
    );
  }
  const size = shape === "attention" ? 17 : shape === "automation" ? 16 : 14;
  return (
    <g transform={`scale(${scale})`}>
      <GlyphShape handler={shape} size={size} />
    </g>
  );
}

function Packet({ ref }: { ref: Ref<PacketHandle> }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const opacity = useMotionValue(0);
  const scale = useMotionValue(1);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const pulseScale = useMotionValue(1);
  const pulseOpacity = useMotionValue(0);
  const trailRef = useRef<SVGPathElement>(null);
  const running = useRef<AnimationPlaybackControls[]>([]);
  const [look, setLook] = useState<{ shape: PacketShape; scale: number; trail: { d: string; len: number } | null }>({
    shape: "incoming",
    scale: 1,
    trail: null,
  });

  useImperativeHandle(
    ref,
    () => {
      const stopAll = () => {
        running.current.forEach((c) => c.stop());
        running.current = [];
      };
      return {
        async run(r, clock, signal) {
          if (signal.aborted) throw abortError();
          const len = r.lut.length;
          setLook({ shape: r.shape, scale: r.scale, trail: r.trail ? { d: r.d, len } : null });
          const forward = r.to >= r.from;
          const place = (p: number) => {
            const pt = pointAt(r.lut, p);
            x.set(pt.x);
            y.set(pt.y);
            if (r.shape === "post") {
              // Follow the tangent, but keep the label upright.
              let a = forward ? pt.angle : pt.angle + 180;
              if (a > 90) a -= 180;
              if (a < -90) a += 180;
              rotate.set(a);
            }
            const tp = trailRef.current;
            if (tp && forward) tp.style.strokeDashoffset = String(0.14 * len - p * len);
          };
          stopAll();
          rotate.set(0);
          place(r.from);
          opacity.set(1);
          // jump(), not set(): set() would hand the spring the velocity of the last arrival
          // (0.35 → 0.6 in one frame) and the capsule would overshoot to many times its size.
          scale.jump(0.6);
          const enter = animate(scale, 1, { type: "spring", stiffness: 520, damping: 30 });
          const travel = animate(r.from, r.to, { duration: r.duration / 1000, ease: TRAVEL, onUpdate: place });
          running.current = [enter, travel];
          try {
            await settle(travel, clock, signal);
            // Arrival: scale into the station, ring pulse r+8.
            const end = pointAt(r.lut, r.to);
            px.set(end.x);
            py.set(end.y);
            pulseScale.jump(1);
            pulseOpacity.set(0.5);
            const out = animate(scale, 0.35, { duration: 0.14, ease: [0.22, 1, 0.36, 1] });
            const fade = animate(opacity, 0, { duration: 0.14 });
            const ring = animate(
              pulseScale,
              1.7,
              r.twang ? { type: "spring", stiffness: 280, damping: 7 } : { duration: 0.36, ease: [0.22, 1, 0.36, 1] },
            );
            const ringFade = animate(pulseOpacity, 0, { duration: 0.36 });
            running.current = [out, fade, ring, ringFade];
            await settle(fade, clock, signal);
          } finally {
            setLook((l) => (l.trail ? { ...l, trail: null } : l));
          }
        },
        hide() {
          stopAll();
          opacity.set(0);
          pulseOpacity.set(0);
          setLook((l) => (l.trail ? { ...l, trail: null } : l));
        },
      };
    },
    [x, y, rotate, opacity, scale, px, py, pulseScale, pulseOpacity],
  );

  const ringR = look.shape === "post" ? 12 : 9;
  return (
    <g>
      {look.trail && (
        <path
          ref={trailRef}
          d={look.trail.d}
          fill="none"
          stroke="var(--k-accent)"
          strokeOpacity={0.55}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${0.14 * look.trail.len} ${look.trail.len * 1.3}`}
          style={{ strokeDashoffset: 0.14 * look.trail.len }}
        />
      )}
      <motion.circle
        r={ringR * look.scale}
        fill="none"
        stroke="var(--k-ink)"
        strokeWidth={1.5}
        style={{ x: px, y: py, scale: pulseScale, opacity: pulseOpacity }}
      />
      <motion.g style={{ x, y, rotate, opacity, scale }}>
        <PacketGlyph shape={look.shape} scale={look.scale} />
      </motion.g>
    </g>
  );
}

/** A fixed pool of packet slots in one SVG (≤12 desktop, ≤8 mobile). */
export const PacketLayer = memo(function PacketLayer({
  ref,
  size,
  w,
  h,
}: {
  ref: Ref<PacketPool>;
  size: number;
  w: number;
  h: number;
}) {
  const handles = useRef<(PacketHandle | null)[]>([]);
  const busy = useRef(new Set<number>());
  const gen = useRef(0);

  useImperativeHandle(
    ref,
    () => ({
      acquire() {
        for (let i = 0; i < size; i++) {
          const h = handles.current[i];
          if (h && !busy.current.has(i)) {
            busy.current.add(i);
            return { idx: i, gen: gen.current, handle: h };
          }
        }
        return null;
      },
      release(slot) {
        // An aborted run releases late (in its finally); by then hideAll() has freed every slot
        // and a new run may own this one again, so stale releases are ignored.
        if (slot.gen === gen.current) busy.current.delete(slot.idx);
      },
      hideAll() {
        handles.current.forEach((h) => h?.hide());
        busy.current.clear();
        gen.current += 1;
      },
    }),
    [size],
  );

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-[3] overflow-visible"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
    >
      {Array.from({ length: size }, (_, i) => (
        <Packet
          key={i}
          ref={(handle) => {
            handles.current[i] = handle;
          }}
        />
      ))}
    </svg>
  );
});
