/**
 * v2 clock, shared by the composition (browser) and the scripts (Node).
 *
 * Music: "Talent in the Air" by Diego Nava (Mixkit #473), house, 122 BPM.
 * Bar lines in the source fall on 1.4754 + n × 1.96721 s (measured: kick onsets every 0.4918 s,
 * bass/crash sections at bars 7, 23, 31, 47). The film is an edit of that track, cut on bar lines:
 *
 *   film  0.000 – 7.869   source bars 0–4    intro: four-on-the-floor kicks + filter sweep → HOOK
 *   film  7.869 – 9.836   source bar 23      first breakdown bar, low-passed: the breath → TURN
 *   film  9.836 – 35.410  source bars 30–43  riser bar → DROP at film 11.803 → main groove
 *   film 35.410 – 37.377  source bar 47      outro bar with a crash → END CARD
 *   film 37.377 – end     source bar 55–end  the track's own last bar and tail → resolve
 */
export const BPM = 122;
export const BEAT = 60 / BPM; // 0.4918 s
export const BAR = BEAT * 4; // 1.9672 s
const SRC_BAR0 = 1.4754;
const src = (n) => SRC_BAR0 + n * BAR;

/** Film time of bar n / beat k. */
export const bar = (n) => n * BAR;
export const beat = (k) => k * BEAT;

export const FILM = {
  duration: 41.5,
  fps: 60,
  audio: {
    file: "talent-in-the-air-diego-nava-mixkit-473.mp3",
    // [film start, source start, source end, optional ffmpeg filter]; each joint gets a 12 ms crossfade.
    segments: [
      [bar(0), src(0), src(4)],
      // the turn: first bar of the breakdown, muffled — a breath
      [bar(4), src(23), src(24), "lowpass=f=900,volume=-2dB"],
      // the riser bar, then the drop at film 11.803
      [bar(5), src(30), src(43)],
      [bar(18), src(47), src(48)],
      [bar(19), src(55), src(55) + 4.6],
    ],
    fadeOut: 0.6,
  },
};

/** Section boundaries (film seconds). */
export const T = {
  hook: 0,
  turn: bar(4), // 7.869  hard cut to calm
  riser: bar(5), // 9.836  mark draws, chaos collapses into the bar
  drop: bar(6), // 11.803 "Post once."
  reply: bar(9), // 17.705 "Every reply."
  inbox: bar(10), // 19.672 "One inbox."
  link: bar(11), // 21.639 "Comment LINK."
  agent: bar(13), // 25.574 "An agent that knows your shop."
  human: bar(15), // 29.508 "A human when it matters."
  numbers: bar(17), // 33.443 demo numbers
  end: bar(18), // 35.410 end card
  final: bar(19), // 37.377 the track's last bar
};

/**
 * Sound-design cues: [film time the sound should hit, sfx id, gain dB, align].
 * align "peak" places the sound so its loudest moment lands on the time (whooshes);
 * "onset" starts it there (clicks, pops).
 */
export const SFX = {
  files: {
    whooshAir: { id: 168, title: "Fast air sweep transition", peak: 0.32 },
    whooshSmall: { id: 166, title: "Fast small sweep transition", peak: 0.33 },
    click: { id: 2577, title: "Interface device click", peak: 0 },
    pop: { id: 3005, title: "Explainer video pops whoosh light pop", peak: 0.02 },
    notify: { id: 2356, title: "Dry pop up notification alert", peak: 0.13 },
  },
  cues: [
    // 3am DMs: notifications stack in on eighth notes
    [beat(8), "notify", -21],
    [beat(8.5), "notify", -23],
    [beat(9), "notify", -22],
    [beat(9.5), "notify", -24],
    // the chaos is sucked into the mark
    [bar(5) + beat(2.5), "whooshSmall", -22],
    // Publish
    [bar(6) - beat(0.5), "click", -16],
    // five posts land on sixteenths
    ...[0, 1, 2, 3, 4].map((i) => [bar(6) + beat(i * 0.25), "pop", -22 - i * 0.5]),
    // transitions
    [bar(9), "whooshSmall", -21],
    [bar(11), "whooshSmall", -22],
    [bar(13), "whooshAir", -19],
    [bar(15), "whooshSmall", -21],
    [bar(17), "whooshSmall", -22],
    // taps / sends
    [bar(11) + beat(3), "click", -22],
    [bar(15) + beat(5.5), "click", -20],
  ],
};
