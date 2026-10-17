/**
 * v3 clock. Same music as v2 — "Talent in the Air" by Diego Nava (Mixkit #473), 122 BPM — and the
 * same bar-line edit (intro → breath → riser → drop → groove → crash → the track's own ending),
 * so the drop still lands at film 11.803 s. The sound design is new (src/v3 cues below).
 */
import { FILM as FILM2 } from "../v2/timing.js";

export const BPM = 122;
export const BEAT = 60 / BPM; // 0.4918 s
export const BAR = BEAT * 4; // 1.9672 s
export const bar = (n) => n * BAR;
export const beat = (k) => k * BEAT;

export const FILM = {
  duration: 41.5,
  fps: 60,
  poster: bar(8) + beat(1), // 16.2 s: the five posts live, overhead, first replies arriving
  audio: FILM2.audio,
};

export const T = {
  hook: 0,
  turn: bar(4), // 7.869  hard cut to calm: rack-focused question
  riser: bar(5), // 9.836  activation chain → composer → cursor → macro Publish
  drop: bar(6), // 11.803 "Post once." → fly-through → POV ride → crane up → five posts
  hub: bar(6) + beat(3.5), // 13.524 arrive at the hub
  crane: bar(7), // 13.770
  replies: bar(8), // 15.738 first replies pop out of the posts
  reply: bar(9), // 17.705 "Every reply." orbiting interchange
  inbox: bar(10), // 19.672 "One inbox." — the word becomes the inbox
  link: bar(11), // 21.639 exploded post → DM → macro ✓ Delivered
  agent: bar(13), // 25.574 forty questions → one answer → macro ₹
  human: bar(15), // 29.508 cursor-driven hand-off, light sweep
  numbers: bar(17), // 33.443 variable-weight numerals
  end: bar(18), // 35.410 end card on the crash
  final: bar(19), // 37.377 CTA on the track's last bar
};

export const SFX = {
  files: {
    whooshAir: { id: 168, title: "Fast air sweep transition", peak: 0.32 },
    whooshSmall: { id: 166, title: "Fast small sweep transition", peak: 0.33 },
    click: { id: 2577, title: "Interface device click", peak: 0 },
    pop: { id: 3005, title: "Explainer video pops whoosh light pop", peak: 0.02 },
    notify: { id: 2356, title: "Dry pop up notification alert", peak: 0.13 },
    slide: { id: 3120, title: "Technology transition slide", peak: 0.12 },
  },
  cues: [
    // 3am DMs
    [beat(8), "notify", -21],
    [beat(8.5), "notify", -23],
    [beat(9), "notify", -22],
    [beat(9.5), "notify", -24],
    // activation chain collapses into one line
    [bar(5) + beat(1.5), "whooshSmall", -23],
    // Publish (cursor click on the "and" before the drop)
    [bar(6) - beat(0.5), "click", -15],
    // fly through "Post once." into the map, ride the line
    [bar(6) + beat(1), "whooshAir", -20],
    [bar(6) + beat(1.2), "slide", -15],
    // posts land on sixteenths
    ...[0, 1, 2, 3, 4].map((i) => [bar(7) + beat(0.5 + i * 0.25), "pop", -23 - i * 0.5]),
    // scene changes
    [bar(9), "whooshSmall", -22],
    [bar(11), "whooshSmall", -22],
    [bar(13), "whooshAir", -19],
    [bar(15), "whooshSmall", -21],
    [bar(17), "whooshSmall", -22],
    // cursor taps
    [bar(11) + beat(5), "click", -21],
    [bar(15) + beat(3.5), "click", -22],
    [bar(15) + beat(5.5), "click", -20],
  ],
};
