/**
 * v3 motion kit, on top of v2's kit: keyed tracks, speed ramps, rack focus, variable-weight type,
 * cursor choreography with click ripples, light sweeps and a 3D camera rig helper.
 */
import { bezier, clamp, ease, lerp, p, set, spring } from "../lib/anim.js";
import { el } from "../lib/ui.js";

/**
 * Keyed track: keys = [[t, v], ...] (v number or array). Eased per segment with `e` (or a per-key
 * ease as the 3rd item). Holds before the first and after the last key.
 */
export function keyed(t, keys, e = ease.cam) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1, ek] = keys[i + 1];
    if (t < t1) {
      const q = (ek ?? e)(clamp((t - t0) / (t1 - t0)));
      return Array.isArray(v0) ? v0.map((a, j) => lerp(a, v1[j], q)) : lerp(v0, v1, q);
    }
  }
  return keys[keys.length - 1][1];
}

/** Speed ramps as easing curves. */
export const ramp = {
  /** Punch in fast, glide out slow (time melts as it arrives). */
  fastSlow: bezier(0.05, 0.75, 0.12, 1),
  /** Creep then snap. */
  slowFast: bezier(0.75, 0, 0.9, 0.35),
  /** Fast – slow-motion middle – fast (a ≈ 0..0.95 = how slow the middle gets). */
  mid: (a) => (x) => clamp(x + (a * Math.sin(2 * Math.PI * x)) / (2 * Math.PI)),
};

/** Rack focus: animate CSS blur on a layer from keyed blur radii (px). */
export function focus(node, t, keys) {
  const b = Math.max(0, keyed(t, keys, ease.cam));
  node.style.filter = b < 0.15 ? "none" : `blur(${b.toFixed(2)}px)`;
  return b;
}

/**
 * Variable-weight slam: every letter (.ci) swells to `peak` weight as it lands and relaxes to
 * `rest` (Inter is variable 100–900 in v3). Staggered with the letters.
 */
export function weightPulse(root, t, t0, { peak = 680, rest = 300, stagger = 0.02, d = 0.7 } = {}) {
  root.querySelectorAll(".ci").forEach((c, i) => {
    if (c.closest(".em")) return; // Instrument Serif has no weight axis
    const q = p(t, t0 + i * stagger, d, ease.out);
    c.style.fontWeight = String(Math.round(lerp(peak, rest, q)));
  });
}

/* ---------------- cursor ---------------- */
const ARROW = `<svg width="34" height="40" viewBox="0 0 17 20" style="display:block;overflow:visible"><path d="M1.5 1.2v15.6l4.1-4.1 2.6 6 2.6-1.1-2.6-5.9h5.8Z" fill="#111" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
const HAND = `<svg width="36" height="40" viewBox="0 0 18 20" style="display:block;overflow:visible"><path d="M6.6 1.4c.9 0 1.6.7 1.6 1.6v5.2l.4-.1c.8-.2 1.6.2 1.9.9l.1.2.5-.1c.8-.1 1.5.3 1.8 1l.4-.1c.9-.1 1.7.5 1.8 1.4.3 2 .2 3.6-.3 5-.6 1.8-2.1 3-4 3H8.4c-1.1 0-2.1-.5-2.8-1.4L2.3 13c-.5-.7-.4-1.6.2-2.2.6-.5 1.5-.5 2.1 0l.4.4V3c0-.9.7-1.6 1.6-1.6Z" fill="#fff" stroke="#111" stroke-width="1.1" stroke-linejoin="round"/></svg>`;

/** A macOS-like cursor that can switch to the pointing hand, with click ripples. */
export function makeCursor(root, { scale = 1 } = {}) {
  const c = el(`<div class="abs" style="left:0;top:0;z-index:80;pointer-events:none;transform-origin:0 0"><div class="arrow">${ARROW}</div><div class="hand" style="position:absolute;left:-9px;top:-2px">${HAND}</div></div>`);
  const ripple = el(`<div class="abs" style="left:0;top:0;width:0;height:0;z-index:79;pointer-events:none"><span style="position:absolute;left:-40px;top:-40px;width:80px;height:80px;border-radius:50%;border:3px solid var(--accent)"></span><span style="position:absolute;left:-40px;top:-40px;width:80px;height:80px;border-radius:50%;background:var(--accent);opacity:.18"></span></div>`);
  root.append(ripple, c);
  const arrow = c.querySelector(".arrow");
  const hand = c.querySelector(".hand");
  const [ring, fill] = ripple.children;
  /**
   * keys: [[t, x, y, opts]] — opts.hand (pointing hand from here), opts.click (ripple + press at t),
   * opts.in / opts.out (fade). Moves along a gentle arc with ease.out between keys.
   */
  function render(t, keys) {
    if (t < keys[0][0] - 0.25 || t > keys[keys.length - 1][0] + 0.6) {
      set(c, { o: 0 });
      set(ripple, { o: 0 });
      return;
    }
    let x = keys[0][1];
    let y = keys[0][2];
    let handOn = false;
    let i = 0;
    for (; i < keys.length - 1; i++) if (t < keys[i + 1][0]) break;
    const k0 = keys[Math.min(i, keys.length - 1)];
    const k1 = keys[Math.min(i + 1, keys.length - 1)];
    if (k1 !== k0 && t >= k0[0]) {
      const q = bezier(0.3, 0.05, 0.15, 1)(clamp((t - k0[0]) / (k1[0] - k0[0])));
      const dx = k1[1] - k0[1];
      const dy = k1[2] - k0[2];
      const arc = Math.sin(q * Math.PI) * Math.min(80, Math.hypot(dx, dy) * 0.12);
      const nx = -dy / (Math.hypot(dx, dy) || 1);
      const ny = dx / (Math.hypot(dx, dy) || 1);
      x = k0[1] + dx * q + nx * arc;
      y = k0[2] + dy * q + ny * arc;
    } else if (t >= keys[keys.length - 1][0]) {
      x = keys[keys.length - 1][1];
      y = keys[keys.length - 1][2];
    }
    for (const k of keys) if (t >= k[0] && k[3]?.hand !== undefined) handOn = k[3].hand;
    // press: the cursor dips a touch on each click
    let press = 0;
    let rip = null;
    for (const k of keys) {
      if (!k[3]?.click) continue;
      const dt = t - k[0];
      if (dt > -0.08 && dt < 0.14) press = Math.max(press, 1 - Math.abs(dt + 0.0) / 0.12);
      if (dt >= 0 && dt < 0.6) rip = { dt, x: k[1], y: k[2] };
    }
    const fadeIn = p(t, keys[0][0] - 0.25, 0.2);
    const last = keys[keys.length - 1];
    const fadeOut = last[3]?.out ? 1 - p(t, last[0], 0.25) : 1;
    set(c, { x, y, s: scale * (1 - 0.12 * press), o: fadeIn * fadeOut });
    arrow.style.opacity = handOn ? "0" : "1";
    hand.style.opacity = handOn ? "1" : "0";
    if (rip) {
      const q = ease.out(clamp(rip.dt / 0.55));
      set(ripple, { x: rip.x, y: rip.y, o: 1 });
      ring.style.transform = `scale(${lerp(0.2, 1.5, q).toFixed(3)})`;
      ring.style.opacity = (1 - q).toFixed(3);
      fill.style.transform = `scale(${lerp(0.2, 1.1, q).toFixed(3)})`;
      fill.style.opacity = (0.22 * (1 - q)).toFixed(3);
    } else set(ripple, { o: 0 });
  }
  return { render, node: c };
}

/* ---------------- light sweep ---------------- */
/** A soft diagonal sheen across `host` (needs overflow:hidden + position). Not a glow: low alpha, wide. */
export function makeSweep(host, { color = "255,255,255", alpha = 0.42, width = 0.35 } = {}) {
  const s = el(`<span style="position:absolute;inset:-20% -60%;pointer-events:none;z-index:5;background:linear-gradient(105deg, rgba(${color},0) ${(50 - width * 50).toFixed(0)}%, rgba(${color},${alpha}) 50%, rgba(${color},0) ${(50 + width * 50).toFixed(0)}%);mix-blend-mode:soft-light"></span>`);
  const s2 = el(`<span style="position:absolute;inset:-20% -60%;pointer-events:none;z-index:5;background:linear-gradient(105deg, rgba(${color},0) ${(50 - width * 25).toFixed(0)}%, rgba(${color},${(alpha * 0.55).toFixed(2)}) 50%, rgba(${color},0) ${(50 + width * 25).toFixed(0)}%)"></span>`);
  host.append(s, s2);
  return (t, t0, d = 0.9) => {
    const q = ease.cam(clamp((t - t0) / d));
    const on = t >= t0 && t < t0 + d;
    const x = lerp(-70, 70, q);
    for (const n of [s, s2]) {
      n.style.transform = `translateX(${x.toFixed(2)}%)`;
      n.style.opacity = on ? "1" : "0";
    }
  };
}

/* ---------------- paper grain ---------------- */
export const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .055 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

/** Measure an element's box relative to an ancestor (layout space, ignores transforms). */
export function boxIn(node, ancestor) {
  let x = 0;
  let y = 0;
  for (let e = node; e && e !== ancestor; e = e.offsetParent) {
    x += e.offsetLeft;
    y += e.offsetTop;
  }
  return { x, y, w: node.offsetWidth, h: node.offsetHeight };
}

export { clamp, ease, lerp, p, set, spring };
