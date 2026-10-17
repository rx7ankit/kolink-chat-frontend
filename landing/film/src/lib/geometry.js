/**
 * Route geometry, ported from the landing page (lib/transit/geometry.ts): octilinear
 * polylines with rounded corners, plus an arc-length lookup table so packets can ride a
 * line at constant speed.
 */

const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const lerpPt = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const toward = (from, to, len) => lerpPt(from, to, Math.min(1, len / (dist(from, to) || 1)));

/** Polyline through pts with each interior corner rounded by radius r. */
export function polyline(pts, r = 18) {
  const clean = pts.filter((pt, i) => i === 0 || dist(pt, pts[i - 1]) > 0.01);
  const segs = [];
  let cursor = clean[0];
  for (let i = 1; i < clean.length - 1; i++) {
    const prev = clean[i - 1];
    const v = clean[i];
    const next = clean[i + 1];
    const rr = Math.min(r, dist(prev, v) / 2, dist(v, next) / 2);
    const inPt = toward(v, prev, rr);
    const outPt = toward(v, next, rr);
    if (dist(cursor, inPt) > 0.01) segs.push({ k: "L", a: cursor, b: inPt });
    segs.push({ k: "Q", a: inPt, c: v, b: outPt });
    cursor = outPt;
  }
  const end = clean[clean.length - 1];
  if (clean.length > 1 && dist(cursor, end) > 0.01) segs.push({ k: "L", a: cursor, b: end });
  return { segs, d: toPath(segs), lut: buildLut(segs) };
}

export function toPath(segs) {
  if (!segs.length) return "";
  const f = (n) => Math.round(n * 100) / 100;
  let d = `M${f(segs[0].a.x)} ${f(segs[0].a.y)}`;
  for (const s of segs) {
    if (s.k === "L") d += `L${f(s.b.x)} ${f(s.b.y)}`;
    else d += `Q${f(s.c.x)} ${f(s.c.y)} ${f(s.b.x)} ${f(s.b.y)}`;
  }
  return d;
}

function evalSeg(s, t) {
  if (s.k === "L") return lerpPt(s.a, s.b, t);
  const u = 1 - t;
  return {
    x: u * u * s.a.x + 2 * u * t * s.c.x + t * t * s.b.x,
    y: u * u * s.a.y + 2 * u * t * s.c.y + t * t * s.b.y,
  };
}

function buildLut(segs, samples = 240) {
  const dense = [];
  for (const s of segs) {
    const steps = s.k === "L" ? 8 : 24;
    for (let i = dense.length ? 1 : 0; i <= steps; i++) dense.push(evalSeg(s, i / steps));
  }
  if (dense.length < 2) dense.push(dense[0] ?? { x: 0, y: 0 });
  const acc = [0];
  for (let i = 1; i < dense.length; i++) acc.push(acc[i - 1] + dist(dense[i - 1], dense[i]));
  const length = acc[acc.length - 1];
  const pts = [];
  let j = 1;
  for (let i = 0; i <= samples; i++) {
    const target = (i / samples) * length;
    while (j < acc.length - 1 && acc[j] < target) j++;
    const span = acc[j] - acc[j - 1] || 1;
    const q = lerpPt(dense[j - 1], dense[j], (target - acc[j - 1]) / span);
    const ang = (Math.atan2(dense[j].y - dense[j - 1].y, dense[j].x - dense[j - 1].x) * 180) / Math.PI;
    pts.push({ x: q.x, y: q.y, a: ang });
  }
  return { pts, length };
}

/** Position + heading (deg) at progress u in [0,1]. */
export function pointAt(route, u) {
  const { pts } = route.lut;
  const n = pts.length - 1;
  const f = Math.min(Math.max(u, 0), 1) * n;
  const i = Math.min(Math.floor(f), n - 1);
  const k = f - i;
  const a = pts[i];
  const b = pts[i + 1];
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, a: k < 0.5 ? a.a : b.a };
}

/** Octilinear link: horizontal lead, one 45° diagonal, horizontal tail (vertical when steep). */
export function link(a, b, { r = 18, bend = 0.5 } = {}) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const sx = Math.sign(dx) || 1;
  const sy = Math.sign(dy) || 1;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  if (ady <= adx) {
    const lead = (adx - ady) * bend;
    const p1 = { x: a.x + sx * lead, y: a.y };
    const p2 = { x: p1.x + sx * ady, y: b.y };
    return polyline([a, p1, p2, b], r);
  }
  const lead = (ady - adx) * bend;
  const p1 = { x: a.x, y: a.y + sy * lead };
  const p2 = { x: b.x, y: p1.y + sy * adx };
  return polyline([a, p1, p2, b], r);
}

/** The pencil "needs attention" loop from the landing hero (seeded, 1.1 turns, 100×100 box). */
/** `e` < 1 squares the loop off (a pill-ish ring for wide rows); n = number of points. */
export function ringPath(rnd, w = 100, h = 100, e = 1, n = 64) {
  const start = -0.6 + rnd() * 0.4;
  const ph1 = rnd() * 6.28;
  const ph2 = rnd() * 6.28;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const t = start + (i / n) * Math.PI * 2 * 1.1;
    const wob = n > 64 ? 1 + 0.018 * Math.sin(3 * t + ph1) + 0.012 * Math.sin(5 * t + ph2) : 1 + (rnd() - 0.5) * 0.05;
    const drift = 1 + (i / n) * 0.035;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = 50 + Math.sign(c) * Math.abs(c) ** e * 51 * wob * drift;
    const y = 50 + Math.sign(s) * Math.abs(s) ** e * 56 * wob * drift;
    d += `${i ? "L" : "M"}${((x * w) / 100).toFixed(2)} ${((y * h) / 100).toFixed(2)}`;
  }
  return d;
}
