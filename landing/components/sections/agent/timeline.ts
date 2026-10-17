"use client";

import { useEffect, useState } from "react";

/**
 * Plays a list of beats one after another and returns the cursor: the index of
 * the beat currently entering (beats below it are complete, -1 = nothing yet,
 * holds.length = finished). `instant` jumps to the finished state, which is what
 * reduced motion and backward scrolling render. A new `runKey` restarts the run.
 */
export function useBeatTimeline(
  holds: number[],
  {
    runKey,
    play,
    instant,
    pace,
    lead = 120,
  }: {
    runKey: string | number;
    play: boolean;
    instant: boolean;
    pace: number;
    /** Delay before the first beat enters (ms at pace 1). */
    lead?: number;
  },
): number {
  const [state, setState] = useState({ key: runKey, cursor: -1 });
  let cursor = state.cursor;
  if (state.key !== runKey) {
    // A new run: reset during render (React's "adjust state when a prop changes" pattern).
    setState({ key: runKey, cursor: -1 });
    cursor = -1;
  }
  const total = holds.length;

  useEffect(() => {
    if (!play || instant || cursor >= total) return;
    const wait = cursor < 0 ? lead : holds[cursor];
    const id = window.setTimeout(
      () => setState((s) => (s.key === runKey ? { key: runKey, cursor: s.cursor + 1 } : s)),
      Math.max(16, wait * pace),
    );
    return () => window.clearTimeout(id);
  }, [play, instant, cursor, total, holds, pace, runKey, lead]);

  return instant ? total : cursor;
}
