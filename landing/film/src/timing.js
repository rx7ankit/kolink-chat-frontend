/**
 * The film's clock, shared by the composition (browser) and the scripts (Node).
 *
 * Music: "House One" by Francisco Alvear (Mixkit), 120 BPM. The source track is
 * silent until 2.0 s; its first downbeat (the opening keys chord) lands at 2.0 s,
 * so the film starts there and every beat falls on t = k × 0.5 s (30 frames at 60 fps).
 * Measured with scripts/analyze-audio.mjs: 119.99 BPM, downbeats at 2.0 + 2k s.
 *
 * Musical map in film time:
 *   0 – 8 s   keys intro (4 bars)        → compose, send, ride to the hub
 *   8 s       drums enter                → the post fans out to 5 networks
 *   16 s      pad + bass phrase          → the switch sorts
 *   32 s      hats lift                  → end card
 *   36 – 38 s fade out                   → hold on the end card
 */
export const BPM = 120;
export const BEAT = 60 / BPM; // 0.5 s
export const BAR = BEAT * 4; // 2 s

export const FILM = {
  duration: 38,
  fps: 60,
  audio: {
    file: "house-one-francisco-alvear-mixkit-662.mp3",
    sourceIn: 2.0,
    fadeOut: 2.0,
  },
};

/** Beat n (0-based) in seconds. b(4.5) is the "and" after beat 4. */
export const b = (n) => n * BEAT;
