/**
 * Time → value helpers. Everything in the film is a pure function of t (seconds),
 * so a frame can be rendered in any order, any number of times, with the same pixels.
 */

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const inv = (a, b, x) => clamp((x - a) / (b - a));

/** CSS cubic-bezier as a function of x in [0,1]. */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-6) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

export const ease = {
  /** The page's soft out: [0.22, 1, 0.36, 1]. Arrivals, reveals. */
  out: bezier(0.22, 1, 0.36, 1),
  /** Travel: [0.65, 0, 0.35, 1]. Things moving along a line. */
  travel: bezier(0.65, 0, 0.35, 1),
  /** Gentle in-out for camera drifts. */
  cam: bezier(0.45, 0, 0.25, 1),
  /** Exits accelerate away. */
  in: bezier(0.55, 0, 0.9, 0.4),
  linear: (x) => x,
};

/** Progress 0→1 of a tween that starts at t0 and lasts d seconds. */
export const p = (t, t0, d, e = ease.out) => e(clamp((t - t0) / d));

/**
 * Damped spring from 0 to 1 starting at t0 (analytic, so it is exact at any t).
 * Defaults match the landing page's physical objects (stiffness 300, damping 22).
 */
export function spring(t, t0, { k = 300, c = 22, m = 1, v0 = 0 } = {}) {
  const dt = t - t0;
  if (dt <= 0) return 0;
  const w0 = Math.sqrt(k / m);
  const z = c / (2 * Math.sqrt(k * m));
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    const A = -1;
    const B = (v0 + z * w0 * A) / wd;
    return 1 + Math.exp(-z * w0 * dt) * (A * Math.cos(wd * dt) + B * Math.sin(wd * dt));
  }
  const A = -1;
  const B = v0 + w0 * A;
  return 1 + (A + B * dt) * Math.exp(-w0 * dt);
}

/** Write a transform/opacity state onto an element. Only touches what is given. */
export function set(el, s) {
  if (!el) return;
  const st = el.style;
  if (s.x !== undefined || s.y !== undefined || s.s !== undefined || s.r !== undefined || s.sx !== undefined || s.sy !== undefined) {
    const x = s.x ?? 0;
    const y = s.y ?? 0;
    let tr = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
    if (s.r) tr += ` rotate(${s.r.toFixed(3)}deg)`;
    if (s.s !== undefined && s.s !== 1) tr += ` scale(${s.s.toFixed(4)})`;
    if (s.sx !== undefined || s.sy !== undefined) tr += ` scale(${(s.sx ?? 1).toFixed(4)}, ${(s.sy ?? 1).toFixed(4)})`;
    st.transform = tr;
  }
  if (s.o !== undefined) {
    const o = clamp(s.o);
    st.opacity = o.toFixed(3);
    st.visibility = o <= 0.001 ? "hidden" : "visible";
  }
  if (s.clip !== undefined) st.clipPath = s.clip;
  if (s.w !== undefined) st.width = `${s.w.toFixed(2)}px`;
  if (s.h !== undefined) st.height = `${s.h.toFixed(2)}px`;
  if (s.bg !== undefined) st.background = s.bg;
  if (s.filter !== undefined) st.filter = s.filter;
}

/** Enter with a spring "pop": scale from `from` and quick fade. Returns the spring value. */
export function pop(el, t, t0, { from = 0.86, k = 420, c = 26, dy = 0, fade = 0.12, x = 0 } = {}) {
  const sp = spring(t, t0, { k, c });
  const o = p(t, t0, fade, ease.linear);
  set(el, { x, y: dy * (1 - sp), s: lerp(from, 1, sp), o });
  return sp;
}

/** Fade + rise in. */
export function rise(el, t, t0, { dy = 28, d = 0.6, x = 0, e = ease.out } = {}) {
  const q = p(t, t0, d, e);
  set(el, { x, y: dy * (1 - q), o: q });
  return q;
}

/** Inset clip reveal from one side ("mask wipe"). side: 'up' reveals bottom→top. */
export function wipe(el, t, t0, d = 0.5, side = "up", e = ease.out) {
  const q = p(t, t0, d, e);
  const r = ((1 - q) * 100).toFixed(2);
  const clip = {
    up: `inset(${r}% 0 0 0)`,
    down: `inset(0 0 ${r}% 0)`,
    right: `inset(0 ${r}% 0 0)`,
    left: `inset(0 0 0 ${r}%)`,
  }[side];
  el.style.clipPath = q >= 1 ? "none" : clip;
  return q;
}

/** Deterministic PRNG (mulberry32), same as the landing page's hero. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
