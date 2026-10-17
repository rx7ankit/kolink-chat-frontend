/**
 * The koLink hub roundel: the real mark in ink, a segmented ring that clicks a turn per
 * departure/arrival, and a points switch that flips per sorting decision (as on the landing hero).
 * It is one persistent object that travels between scenes, so the story stays on one map.
 */
import { clamp, ease, lerp, p, set, spring } from "../lib/anim.js";
import { LOGO_PATHS } from "../lib/brand.js";
import { el } from "../lib/ui.js";

const ARCS = Array.from({ length: 8 }, (_, i) => {
  const r = 35;
  const a0 = ((i * 45 + 5) * Math.PI) / 180;
  const a1 = (((i + 1) * 45 - 5) * Math.PI) / 180;
  const pt = (a) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  return `M${pt(a0)} A${r} ${r} 0 0 1 ${pt(a1)}`;
});

/** Arrival times of the 8 replies in the flood scene (also used there). */
export const ARRIVALS = Array.from({ length: 8 }, (_, i) => 12.75 + i * 0.25 + 0.6);

export function hubPath(V) {
  // [t, x, y, diameter] keys; eased with the travel curve between keys.
  return V
    ? [
        [0, 540, 480, 104],
        [12.0, 540, 480, 104],
        [12.6, 540, 960, 132],
        [15.9, 540, 960, 132],
        [16.4, 190, 720, 120],
      ]
    : [
        [0, 960, 196, 92],
        [12.0, 960, 196, 92],
        [12.6, 960, 540, 120],
        [15.9, 960, 540, 120],
        [16.4, 540, 560, 112],
      ];
}

export function buildHub({ V }) {
  const root = el(`<div class="abs hub" style="left:0;top:0;width:0;height:0"></div>`);
  const label = el(`<div class="abs mono" style="left:0;top:0;width:400px;margin-left:-200px;text-align:center;font-size:${V ? 18 : 15}px;color:var(--ink);height:20px;overflow:hidden"></div>`);
  const disc = el(`<div class="abs" style="left:-50px;top:-50px;width:100px;height:100px;border-radius:50%;background:var(--surface);box-shadow:inset 0 0 0 2.5px var(--ink),0 0 0 7px var(--bg),0 18px 40px -16px rgba(38,43,38,.28)"></div>`);
  const ring = el(`<svg class="abs" viewBox="-40 -40 80 80" style="inset:0;width:100%;height:100%">${ARCS.map((d, i) => `<path d="${d}" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round" opacity="${i % 2 ? 0.35 : 0.8}"/>`).join("")}</svg>`);
  const mark = el(`<svg class="abs" viewBox="0 0 681 550" style="left:50%;top:50%;width:30%;transform:translate(-50%,-50%);overflow:visible">${LOGO_PATHS.map((d) => `<path d="${d}" fill="var(--ink)" class="mf"/>`).join("")}${LOGO_PATHS.map((d) => `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="26" stroke-linejoin="round" pathLength="1" class="ms"/>`).join("")}</svg>`);
  const sw = el(`<svg class="abs" viewBox="-8 -8 16 16" style="right:-9px;top:50%;width:18px;height:18px;margin-top:-9px;overflow:visible"><circle r="6.5" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/><line x1="0" y1="0" x2="5" y2="0" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" class="sw"/></svg>`);
  disc.append(ring, mark, sw);
  root.append(disc, label);
  const fills = [...mark.querySelectorAll(".mf")];
  const strokes = [...mark.querySelectorAll(".ms")];
  const swLine = sw.querySelector(".sw");

  const PATH = hubPath(V);
  const LABELS = [
    [6.15, "Sending"],
    [7.55, "Live · 5 networks"],
    [11.9, ""],
    [16.0, "Sorting"],
    [16.76, ""],
  ];
  const CLICKS = [[7.5, 90], ...ARRIVALS.map((a) => [a, 45]), [16.0, 90]];
  const SWITCH = [
    [16.2, -30],
    [16.35, 0],
    [16.5, 30],
  ];
  const labelSpans = LABELS.map(([, txt]) => {
    const s = el(`<div class="abs" style="left:0;right:0;top:0;text-transform:uppercase">${txt}</div>`);
    label.append(s);
    return s;
  });

  function pos(t) {
    let i = 0;
    while (i < PATH.length - 1 && PATH[i + 1][0] <= t) i++;
    const a = PATH[i];
    const b = PATH[i + 1];
    if (!b) return { x: a[1], y: a[2], d: a[3] };
    const q = ease.travel(clamp((t - a[0]) / (b[0] - a[0])));
    return { x: lerp(a[1], b[1], q), y: lerp(a[2], b[2], q), d: lerp(a[3], b[3], q) };
  }

  function render(t) {
    const appear = spring(t, 6.1, { k: 300, c: 20 });
    const exit = p(t, 16.76, 0.22, ease.in);
    const vis = t >= 6.1 && t < 17.3;
    root.style.display = vis ? "" : "none";
    if (!vis) return;
    const { x, y, d } = pos(t);
    // Small bump on every arrival.
    let bump = 0;
    for (const [tc] of CLICKS) {
      const dt = t - tc;
      if (dt > 0 && dt < 0.6) bump += Math.exp(-dt * 10) * Math.sin(dt * 28) * 0.05;
    }
    const s = (d / 100) * lerp(0.4, 1, appear) * (1 + bump) * (1 - exit * 0.25);
    set(root, { x: x - exit * (V ? 0 : 140), y, o: 1 });
    set(disc, { s, o: p(t, 6.1, 0.12, ease.linear) * (1 - exit) });
    let rot = 0;
    for (const [tc, deg] of CLICKS) rot += deg * spring(t, tc, { k: 300, c: 22 });
    ring.style.transform = `rotate(${rot.toFixed(2)}deg)`;
    let sa = 0;
    let prev = 0;
    for (const [ts, a] of SWITCH) {
      sa += (a - prev) * spring(t, ts, { k: 420, c: 28 });
      prev = a;
    }
    swLine.setAttribute("transform", `rotate(${sa.toFixed(2)})`);
    // Mark traces itself once in accent, then settles in ink.
    strokes.forEach((s2, i) => {
      const q = p(t, 6.2 + i * 0.08, 0.5, ease.travel);
      s2.style.strokeDasharray = "1 1";
      s2.style.strokeDashoffset = (1 - q).toFixed(4);
      s2.style.opacity = (1 - p(t, 6.75 + i * 0.08, 0.3)).toFixed(3);
    });
    fills.forEach((f, i) => (f.style.opacity = p(t, 6.5 + i * 0.08, 0.35).toFixed(3)));
    // Split-flap-ish label above the disc.
    const ly = -(d / 2) * lerp(0.4, 1, appear) - (V ? 44 : 36);
    set(label, { y: ly, o: 1 - exit });
    LABELS.forEach(([t0, txt], i) => {
      const t1 = LABELS[i + 1]?.[0] ?? 99;
      const inQ = p(t, t0 + 0.12, 0.3);
      const outQ = p(t, t1, 0.14, ease.in);
      const on = t >= t0 && t < t1 + 0.25 && txt;
      set(labelSpans[i], { y: (1 - inQ) * 20 - outQ * 20, o: on ? inQ * (1 - outQ) : 0 });
    });
  }

  return { root, render, pos };
}
