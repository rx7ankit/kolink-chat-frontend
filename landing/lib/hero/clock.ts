/**
 * A pausable clock for the hero driver. Every wait and every tracked animation stops
 * exactly where it is on pause() and continues on resume(), so "Pause demo" (WCAG 2.2.2),
 * offscreen, hidden-tab and typing gates freeze the scene instead of restarting it.
 */

type Timer = { remaining: number; started: number; id: number; fire: () => void };

export type Playable = { pause(): void; play(): void };

export function abortError() {
  return new DOMException("Aborted", "AbortError");
}

export function isAbort(e: unknown) {
  return e instanceof DOMException && e.name === "AbortError";
}

export class Clock {
  private paused = false;
  private timers = new Set<Timer>();
  private anims = new Set<Playable>();

  get isPaused() {
    return this.paused;
  }

  sleep(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(abortError());
        return;
      }
      const onAbort = () => {
        window.clearTimeout(t.id);
        this.timers.delete(t);
        reject(abortError());
      };
      const t: Timer = {
        remaining: Math.max(0, ms),
        started: 0,
        id: 0,
        fire: () => {
          this.timers.delete(t);
          signal.removeEventListener("abort", onAbort);
          resolve();
        },
      };
      signal.addEventListener("abort", onAbort, { once: true });
      this.timers.add(t);
      if (!this.paused) this.start(t);
    });
  }

  /** Register a running animation so pause/resume reach it. Returns an untrack function. */
  track(a: Playable) {
    this.anims.add(a);
    if (this.paused) a.pause();
    return () => {
      this.anims.delete(a);
    };
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    const now = performance.now();
    for (const t of this.timers) {
      window.clearTimeout(t.id);
      t.remaining = Math.max(0, t.remaining - (now - t.started));
    }
    this.anims.forEach((a) => a.pause());
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    for (const t of this.timers) this.start(t);
    this.anims.forEach((a) => a.play());
  }

  private start(t: Timer) {
    t.started = performance.now();
    t.id = window.setTimeout(t.fire, t.remaining);
  }
}
