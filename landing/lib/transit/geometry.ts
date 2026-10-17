/**
 * Route geometry shared by the hero, the §01 map and every diagram on the page.
 * Routes are built from analytic segments, so packets can be placed along them
 * from a precomputed lookup table without touching the DOM in the animation loop.
 */

import type { LookOptionValue } from "../studio/types";

export type Pt = { x: number; y: number };
export type LineStyle = LookOptionValue<"lines">;

type Seg =
  | { k: "L"; a: Pt; b: Pt }
  | { k: "Q"; a: Pt; c: Pt; b: Pt }
  | { k: "C"; a: Pt; c1: Pt; c2: Pt; b: Pt };

export type Route = { segs: Seg[]; d: string };

const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const toward = (from: Pt, to: Pt, len: number) => lerp(from, to, Math.min(1, len / (dist(from, to) || 1)));

/** Polyline through `pts` with each interior corner rounded by radius `r` (clamped to half of each leg). */
export function polyline(pts: Pt[], r = 14): Route {
  const clean = pts.filter((p, i) => i === 0 || dist(p, pts[i - 1]) > 0.01);
  const segs: Seg[] = [];
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
  return { segs, d: toPath(segs) };
}

/**
 * A single connection from `a` to `b` in the Studio line style.
 * - octilinear: horizontal lead, one 45° diagonal, horizontal tail (vertical lead/tail when steep)
 * - orthogonal: horizontal, vertical at `bend` (0–1 of dx), horizontal
 * - cord: a sagging patch cable
 */
export function link(a: Pt, b: Pt, style: LineStyle, opts: { r?: number; bend?: number; sag?: number } = {}): Route {
  const { r = 14, bend = 0.5, sag = 0.22 } = opts;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (style === "cord") {
    const s = sag * dist(a, b);
    const c1 = { x: a.x + dx * 0.35, y: a.y + s + dy * 0.1 };
    const c2 = { x: b.x - dx * 0.35, y: b.y + s - dy * 0.1 };
    const segs: Seg[] = [{ k: "C", a, c1, c2, b }];
    return { segs, d: toPath(segs) };
  }
  if (style === "orthogonal") {
    const mx = a.x + dx * bend;
    return polyline([a, { x: mx, y: a.y }, { x: mx, y: b.y }, b], r);
  }
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

export function toPath(segs: Seg[]) {
  if (!segs.length) return "";
  const f = (n: number) => Math.round(n * 100) / 100;
  let d = `M${f(segs[0].a.x)} ${f(segs[0].a.y)}`;
  for (const s of segs) {
    if (s.k === "L") d += `L${f(s.b.x)} ${f(s.b.y)}`;
    else if (s.k === "Q") d += `Q${f(s.c.x)} ${f(s.c.y)} ${f(s.b.x)} ${f(s.b.y)}`;
    else d += `C${f(s.c1.x)} ${f(s.c1.y)} ${f(s.c2.x)} ${f(s.c2.y)} ${f(s.b.x)} ${f(s.b.y)}`;
  }
  return d;
}

function evalSeg(s: Seg, t: number): Pt {
  if (s.k === "L") return lerp(s.a, s.b, t);
  const u = 1 - t;
  if (s.k === "Q") {
    return {
      x: u * u * s.a.x + 2 * u * t * s.c.x + t * t * s.b.x,
      y: u * u * s.a.y + 2 * u * t * s.c.y + t * t * s.b.y,
    };
  }
  return {
    x: u * u * u * s.a.x + 3 * u * u * t * s.c1.x + 3 * u * t * t * s.c2.x + t * t * t * s.b.x,
    y: u * u * u * s.a.y + 3 * u * u * t * s.c1.y + 3 * u * t * t * s.c2.y + t * t * t * s.b.y,
  };
}

/** Lookup table: evenly spaced (by arc length) points with heading, built once per route. */
export type Lut = { xs: Float32Array; ys: Float32Array; angles: Float32Array; length: number };

export function buildLut(route: Route, samples = 96): Lut {
  // Dense pass to measure arc length, then resample evenly.
  const dense: Pt[] = [];
  for (const s of route.segs) {
    const steps = s.k === "L" ? 2 : 16;
    for (let i = dense.length ? 1 : 0; i <= steps; i++) dense.push(evalSeg(s, i / steps));
  }
  if (dense.length < 2) dense.push(dense[0] ?? { x: 0, y: 0 });
  const acc = [0];
  for (let i = 1; i < dense.length; i++) acc.push(acc[i - 1] + dist(dense[i - 1], dense[i]));
  const length = acc[acc.length - 1];
  const xs = new Float32Array(samples + 1);
  const ys = new Float32Array(samples + 1);
  const angles = new Float32Array(samples + 1);
  let j = 1;
  for (let i = 0; i <= samples; i++) {
    const target = (i / samples) * length;
    while (j < acc.length - 1 && acc[j] < target) j++;
    const span = acc[j] - acc[j - 1] || 1;
    const p = lerp(dense[j - 1], dense[j], (target - acc[j - 1]) / span);
    xs[i] = p.x;
    ys[i] = p.y;
    angles[i] = (Math.atan2(dense[j].y - dense[j - 1].y, dense[j].x - dense[j - 1].x) * 180) / Math.PI;
  }
  return { xs, ys, angles, length };
}

/** Position and heading at progress t (0–1) along a LUT. Cheap enough for every animation frame. */
export function pointAt(lut: Lut, t: number): { x: number; y: number; angle: number } {
  const n = lut.xs.length - 1;
  const f = Math.min(Math.max(t, 0), 1) * n;
  const i = Math.min(Math.floor(f), n - 1);
  const k = f - i;
  return {
    x: lut.xs[i] + (lut.xs[i + 1] - lut.xs[i]) * k,
    y: lut.ys[i] + (lut.ys[i + 1] - lut.ys[i]) * k,
    angle: lut.angles[k < 0.5 ? i : i + 1],
  };
}

/** Travel time for a route: physical speed (px/ms) clamped to a readable window. */
export function travelMs(length: number, speed = 0.8, min = 260, max = 560) {
  return Math.min(max, Math.max(min, length / speed));
}
