import type { Action } from "@/lib/hero/board";
import { abortError, type Clock } from "@/lib/hero/clock";
import type { Geometry, RouteRec } from "@/lib/hero/layout";
import { scripts } from "@/lib/hero/scripts";
import { buildTimeline, type Launch, type RouteRef, type Step } from "@/lib/hero/timeline";
import type { Media, Script } from "@/lib/hero/types";
import { travelMs } from "@/lib/transit/geometry";

import type { ComposerHandle } from "./composer";
import type { PacketPool } from "./packet-layer";

/**
 * Plays timeline steps against real time: one AbortController per run, every wait on the
 * pausable clock, every packet a single LUT tween. Visitor actions abort and restart cleanly.
 */
export type Env = {
  dispatch: (a: Action) => void;
  clock: Clock;
  signal: AbortSignal;
  /** Reduced motion / Studio "Still": no travel or typing, short crossfaded holds. */
  still: boolean;
  /** Duration multiplier (Calm 1.3, Lively 1, Bold 0.85). */
  pace: number;
  composer: () => ComposerHandle | null;
  pool: () => PacketPool | null;
  geometry: () => Geometry | null;
  setMedia: (m: Media | null) => void;
  /** Comet trails on outbound capsules (desktop only). */
  trail: boolean;
  /** "Cord curves": springy arrival. */
  twang: boolean;
};

function pickRoute(geo: Geometry, r: RouteRef): RouteRec {
  switch (r.k) {
    case "post":
      return geo.routes.post;
    case "team":
      return geo.routes.team;
    case "siding":
      return geo.routes.siding;
    case "branch":
      return geo.routes.branch[r.id];
    case "reply":
      return geo.routes.reply[r.id];
  }
}

const sleep = (env: Env, ms: number) => env.clock.sleep(ms, env.signal);

async function launch(l: Launch, env: Env) {
  if (l.delay && !env.still) await sleep(env, l.delay * env.pace);
  l.onLaunch?.forEach(env.dispatch);
  const geo = env.geometry();
  const pool = env.still ? null : env.pool();
  const rec = geo ? pickRoute(geo, l.route) : null;
  const slot = geo && rec && pool ? pool.acquire() : null;
  if (!geo || !rec || !pool || !slot) {
    if (!env.still) await sleep(env, 200 * env.pace);
    l.onArrive?.forEach(env.dispatch);
    return;
  }
  try {
    await slot.handle.run(
      {
        lut: rec.lut,
        d: rec.d,
        shape: l.shape,
        from: l.reverse ? 1 : 0,
        to: l.reverse ? 0 : 1,
        duration: travelMs(rec.lut.length, geo.speed * l.speed) * env.pace,
        trail: !!l.trail && env.trail,
        twang: env.twang,
        scale: geo.scale,
      },
      env.clock,
      env.signal,
    );
  } finally {
    pool.release(slot);
  }
  l.onArrive?.forEach(env.dispatch);
}

export async function play(steps: Step[], env: Env) {
  for (const step of steps) {
    if (env.signal.aborted) throw abortError();
    switch (step.t) {
      case "wait":
        await sleep(env, env.still ? Math.min(step.ms, 520) : step.ms * env.pace);
        break;
      case "do":
        step.a.forEach(env.dispatch);
        break;
      case "type": {
        const c = env.composer();
        if (!c) break;
        if (env.still) c.show(step.text, step.speed);
        else await c.type(step.text, { clock: env.clock, signal: env.signal, speed: step.speed, pace: env.pace });
        break;
      }
      case "send": {
        const c = env.composer();
        if (c) await c.send({ clock: env.clock, signal: env.signal, still: env.still });
        break;
      }
      case "go": {
        const runs = step.launches.map((l) => launch(l, env));
        if (step.wait) await Promise.all(runs);
        else runs.forEach((p) => p.catch(() => {}));
        break;
      }
    }
  }
}

/** Autoplay: script after script (or the one the Studio pins), hold, wipe, repeat. */
export async function runAuto(env: Env, order: number[]) {
  for (let i = 0; ; i++) {
    const s = scripts[order[i % order.length]];
    env.dispatch({ t: "reset" });
    // Drop the last run's scripted text so the draft preview starts clean with the new media.
    env.composer()?.reset();
    env.setMedia(s.media);
    if (i === 0) await sleep(env, 300);
    await play(buildTimeline(s, { typed: true }), env);
    await sleep(env, 2500 * env.pace);
    // 11 · Clear: rows wipe bottom-up and the next draft, already carrying its own media, slides in
    // over the last conversation (the pane is never empty, and its picture never swaps mid-draft).
    env.composer()?.reset();
    env.setMedia(scripts[order[(i + 1) % order.length]].media);
    env.dispatch({ t: "reset" });
    await sleep(env, 520 * env.pace);
  }
}

/** One run without the hold auto-advance (visitor posts, "Play demo" under reduced motion). */
export async function runOnce(env: Env, s: Script, typed: boolean) {
  env.dispatch({ t: "reset" });
  env.setMedia(s.media);
  await play(buildTimeline(s, { typed }), env);
}
