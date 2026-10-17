/** v2 motion kit: kinetic type, slams, punches, shake, whip pans and legend-shape wipes. */
import { clamp, ease, bezier, lerp, mulberry32, p, set, spring } from "../lib/anim.js";
import { el } from "../lib/ui.js";

export const easeWhip = bezier(0.7, 0, 0.2, 1);
export const easeSnap = bezier(0.16, 1, 0.3, 1);

/** Kinetic text: words keep together; every letter is its own span (.ci) inside a mask (.cm). */
export function letters(text) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  let html = "";
  for (const part of parts) {
    const em = part.startsWith("*");
    const body = em ? part.slice(1, -1) : part;
    for (const w of body.split(/(\s+)/)) {
      if (!w) continue;
      if (/^\s+$/.test(w)) {
        html += " ";
        continue;
      }
      html += `<span class="kw${em ? " em" : ""}">${Array.from(w)
        .map((c) => `<span class="cm"><span class="ci">${c}</span></span>`)
        .join("")}</span>`;
    }
  }
  return html;
}

/** Big kinetic line, centered in a box of width w at (x, y) (top-left), font size in px. */
export function kline(text, size, { align = "center", w, cls = "" } = {}) {
  return el(`<div class="kline display ${cls}" style="font-size:${size}px;text-align:${align};${w ? `width:${w}px;` : ""}">${letters(text)}</div>`);
}

/**
 * Letters rise out of their masks with a stagger, overshoot a touch, settle.
 * mode "rise" (default) | "drop" (from above) | "pop" (scale from 0.4)
 */
export function lettersIn(root, t, t0, { stagger = 0.022, d = 0.55, mode = "rise", tOut = Infinity, dOut = 0.22, outStagger = 0.008 } = {}) {
  const cs = root.querySelectorAll(".ci");
  cs.forEach((c, i) => {
    const s = spring(t, t0 + i * stagger, { k: 360, c: 22 });
    const o = p(t, t0 + i * stagger, 0.08, ease.linear);
    const out = p(t, tOut + i * outStagger, dOut, ease.in);
    let tr;
    if (mode === "pop") tr = `translate(0, ${((1 - s) * 30).toFixed(2)}%) scale(${lerp(0.4, 1, s).toFixed(3)})`;
    else if (mode === "drop") tr = `translate(0, ${(-(1 - s) * 105).toFixed(2)}%)`;
    else tr = `translate(0, ${((1 - s) * 105).toFixed(2)}%)`;
    if (out > 0) tr += ` translate(0, ${(-out * 140).toFixed(2)}%)`;
    c.style.transform = tr;
    c.style.opacity = (o * (1 - (out > 0.98 ? 1 : 0))).toFixed(3);
  });
}

/** Slam: arrives big and settles with a spring (scale `from` → 1). Returns the spring value. */
export function slam(node, t, t0, { from = 1.6, k = 420, c = 26, x = 0, y = 0, r = 0, fade = 0.05 } = {}) {
  const s = spring(t, t0, { k, c });
  set(node, { x, y, r: r * (1 - s), s: lerp(from, 1, s), o: p(t, t0, fade, ease.linear) });
  return s;
}

/** Sum of decaying impulses after each time in `times` (for scale punches). */
export function impulse(t, times, { decay = 9, amp = 1 } = {}) {
  let v = 0;
  for (const ti of times) {
    const dt = t - ti;
    if (dt >= 0 && dt < 1.2) v += Math.exp(-dt * decay) * amp;
  }
  return v;
}

/** Deterministic smooth shake (sum of sines), amplitude in px/deg. */
export function shake(t, amp, seed = 1) {
  const r = mulberry32(seed);
  const f = [r() * 6 + 17, r() * 6 + 23, r() * 6 + 29];
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
  return {
    x: amp * (Math.sin(t * f[0] + ph[0]) * 0.6 + Math.sin(t * f[1] * 1.7 + ph[1]) * 0.4),
    y: amp * (Math.sin(t * f[1] + ph[2]) * 0.6 + Math.sin(t * f[2] * 1.3 + ph[0]) * 0.4),
    r: amp * 0.04 * Math.sin(t * f[2] + ph[1]),
  };
}

/** Whip pan: offset (px) of a scene entering at tCut (from +x) or leaving at tCut (to -x). */
export function whipIn(t, tCut, W, d = 0.34) {
  const q = easeWhip(clamp((t - (tCut - d / 2)) / d));
  return W * 1.2 * (1 - q);
}
export function whipOut(t, tCut, W, d = 0.34) {
  const q = easeWhip(clamp((t - (tCut - d / 2)) / d));
  return -W * 1.2 * q;
}

/**
 * Directional (horizontal) blur for whip pans, on top of the renderer's temporal supersampling:
 * at whip speeds the sub-frames are far apart, so a velocity-scaled smear hides the steps.
 * Uses one shared SVG filter (only one whip happens at a time).
 */
let whipFilter = null;
export function whipBlur(node, t, tCut, W, fps = 60) {
  if (!whipFilter) {
    const svg = el(`<svg width="0" height="0" style="position:absolute"><filter id="kwhip" x="-30%" y="-2%" width="160%" height="104%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 0"/></filter></svg>`);
    document.body.append(svg);
    whipFilter = svg.querySelector("feGaussianBlur");
  }
  const h = 1 / 240;
  const v = Math.abs(whipIn(t + h, tCut, W) - whipIn(t - h, tCut, W)) / (2 * h);
  const sd = (v / fps) * 0.22;
  if (sd < 0.6) {
    node.style.filter = "none";
    return;
  }
  whipFilter.setAttribute("stdDeviation", `${sd.toFixed(1)} 0`);
  node.style.filter = "url(#kwhip)";
}

/** Polygon / shape clip paths centred on (x, y) with "radius" r. */
export function shapeClip(kind, x, y, r) {
  const f = (n) => n.toFixed(1);
  switch (kind) {
    case "diamond":
      return `polygon(${f(x)}px ${f(y - r)}px, ${f(x + r)}px ${f(y)}px, ${f(x)}px ${f(y + r)}px, ${f(x - r)}px ${f(y)}px)`;
    case "triangle":
      return `polygon(${f(x)}px ${f(y - r)}px, ${f(x + r * 0.95)}px ${f(y + r * 0.75)}px, ${f(x - r * 0.95)}px ${f(y + r * 0.75)}px)`;
    case "square":
      return `inset(${f(y - r)}px calc(100% - ${f(x + r)}px) calc(100% - ${f(y + r)}px) ${f(x - r)}px round ${f(r * 0.35)}px)`;
    case "capsule":
      return `inset(${f(y - r * 0.5)}px calc(100% - ${f(x + r)}px) calc(100% - ${f(y + r * 0.5)}px) ${f(x - r)}px round ${f(r)}px)`;
    default:
      return `circle(${f(r)}px at ${f(x)}px ${f(y)}px)`;
  }
}
/** SVG path for the same shapes (used for the coloured leading edge of a wipe). */
export function shapePath(kind, x, y, r) {
  const f = (n) => n.toFixed(1);
  switch (kind) {
    case "diamond":
      return `M${f(x)} ${f(y - r)}L${f(x + r)} ${f(y)}L${f(x)} ${f(y + r)}L${f(x - r)} ${f(y)}Z`;
    case "triangle":
      return `M${f(x)} ${f(y - r)}L${f(x + r * 0.95)} ${f(y + r * 0.75)}L${f(x - r * 0.95)} ${f(y + r * 0.75)}Z`;
    case "square": {
      const k = r * 0.35;
      return `M${f(x - r + k)} ${f(y - r)}H${f(x + r - k)}Q${f(x + r)} ${f(y - r)} ${f(x + r)} ${f(y - r + k)}V${f(y + r - k)}Q${f(x + r)} ${f(y + r)} ${f(x + r - k)} ${f(y + r)}H${f(x - r + k)}Q${f(x - r)} ${f(y + r)} ${f(x - r)} ${f(y + r - k)}V${f(y - r + k)}Q${f(x - r)} ${f(y - r)} ${f(x - r + k)} ${f(y - r)}Z`;
    }
    default:
      return `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
  }
}

/** How big a shape must grow (from x,y) to cover a W×H frame. */
export function coverRadius(kind, x, y, W, H) {
  const dx = Math.max(x, W - x);
  const dy = Math.max(y, H - y);
  if (kind === "diamond") return dx + dy + 40;
  if (kind === "triangle") return Math.max(dx, dy) * 2.6 + 80;
  if (kind === "square") return Math.max(dx, dy) * 1.15 + 40;
  return Math.hypot(dx, dy) + 40;
}

/** 3D card transform string (perspective included), for subtle tilts. */
export function tilt({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, persp = 1600 } = {}) {
  return `perspective(${persp}px) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${s.toFixed(4)})`;
}

export { clamp, ease, lerp, p, set, spring };
