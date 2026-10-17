/** Small DOM builders shared by the scenes. */
import { clamp, ease, lerp, p, set, spring } from "./anim.js";
import { glyph, tile } from "./brand.js";

export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
export const $ = (root, sel) => root.querySelector(sel);
export const $$ = (root, sel) => [...root.querySelectorAll(sel)];

/** Absolutely positioned element at (x, y) with optional width. */
export function place(node, x, y, w) {
  node.style.position = "absolute";
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  if (w !== undefined) node.style.width = `${w}px`;
  return node;
}

/* ---------- line icons (Lucide-style geometry, drawn as strokes) ---------- */
const IC = {
  heart: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
  comment: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z",
  send: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zM21.854 2.147l-10.94 10.939",
  repost: "m2 9 3-3 3 3M13 18H7a2 2 0 0 1-2-2V6m20 9-3 3-3-3M11 6h6a2 2 0 0 1 2 2v10",
  like: "M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z",
  share: "M15 14 20 9 15 4M4 20v-7a4 4 0 0 1 4-4h12",
  views: "M3 3v16a2 2 0 0 0 2 2h16M18 17V9M13 17V5M8 17v-3",
  bookmark: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z",
  check: "M20 6 9 17l-5-5",
  arrow: "M5 12h14M13 5l7 7-7 7",
  bell: "M10.268 21a2 2 0 0 0 3.464 0M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z",
  music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  book: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20",
  file: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4",
};
export function ic(name, cls = "ic", extra = "") {
  return `<svg class="${cls}" viewBox="0 0 24 24" ${extra} aria-hidden="true"><path d="${IC[name]}"/></svg>`;
}
export function icStroke(name, size, color, width = 2) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[name]}"/></svg>`;
}

/* ---------- masked word reveals ---------- */
/** Wrap every word of `text` for a masked reveal. `*word*` marks serif-italic emphasis. */
export function words(text) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  let out = "";
  for (const part of parts) {
    const em = part.startsWith("*");
    const body = em ? part.slice(1, -1) : part;
    const ws = body.split(/(\s+)/);
    for (const w of ws) {
      if (!w) continue;
      if (/^\s+$/.test(w)) {
        out += " ";
        continue;
      }
      out += `<span class="w"><span class="wi${em ? " em" : ""}">${w}</span></span>`;
    }
  }
  return out;
}

/** Headline block: lines of masked words. Returns the element. */
export function headline(lines, { size = 76, cls = "" } = {}) {
  return el(
    `<div class="display ${cls}" style="font-size:${size}px">${lines.map((l) => `<div class="hl-line">${words(l)}</div>`).join("")}</div>`,
  );
}

/** Animate masked words up from below, staggered. Optional exit at tOut. */
export function revealWords(root, t, t0, { stagger = 0.05, d = 0.75, tOut = Infinity, dOut = 0.35 } = {}) {
  const ws = root.querySelectorAll(".wi");
  ws.forEach((w, i) => {
    const q = p(t, t0 + i * stagger, d, ease.out);
    const out = p(t, tOut + i * stagger * 0.4, dOut, ease.in);
    const y = (1 - q) * 105 - out * 105;
    w.style.transform = `translate(0, ${y.toFixed(2)}%)`;
  });
}

/* ---------- typewriter ---------- */
/**
 * Deterministic typing schedule: per-character delays with a little human rhythm
 * (longer after punctuation and emoji), scaled so the whole string lands in `dur`.
 */
export function typeSchedule(text, dur, seed = 7) {
  const chars = Array.from(text);
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const w = chars.map((c, i) => {
    let d = 0.8 + rnd() * 0.5;
    const prev = chars[i - 1] ?? "";
    if (/[.,!?]/.test(prev)) d += 1.6;
    if (/\p{Extended_Pictographic}/u.test(prev)) d += 1.2;
    if (prev === " ") d += 0.25;
    return d;
  });
  const total = w.reduce((a, b) => a + b, 0);
  const times = [];
  let acc = 0;
  for (const x of w) {
    acc += x;
    times.push((acc / total) * dur);
  }
  return { chars, times };
}
export function typed(schedule, t, t0) {
  const dt = t - t0;
  let n = 0;
  while (n < schedule.times.length && schedule.times[n] <= dt) n++;
  return schedule.chars.slice(0, n).join("");
}

/* ---------- odometer ---------- */
export function odometer(digits = 1, cls = "") {
  const dg = Array.from({ length: digits }, () => `<span class="dg">${Array.from({ length: 11 }, (_, i) => `<span>${i % 10}</span>`).join("")}</span>`).join("");
  return el(`<span class="odo ${cls}">${dg}</span>`);
}
/** Roll the odometer to `value` (can be fractional for in-between rolls). */
export function setOdometer(node, value) {
  const dgs = node.querySelectorAll(".dg");
  const n = dgs.length;
  const frac = value - Math.floor(value);
  dgs.forEach((dg, i) => {
    const P = 10 ** (n - 1 - i);
    // The last digit rolls continuously; higher digits roll only while every lower digit is 9 (a carry).
    const base = Math.floor(value / P) % 10;
    const carrying = P === 1 || value % P >= P - 1;
    const pos = base + (carrying ? frac : 0);
    dg.style.transform = `translate(0, ${(-pos).toFixed(4)}em)`;
  });
}

/* ---------- chat ---------- */
export function msgIn(text, { who = "" } = {}) {
  return el(`<div class="msg in">${who ? `<div class="by">${who}</div>` : ""}<div class="bub">${text}</div></div>`);
}
const byLabel = { automation: "Automation", agent: "AI agent", team: "Your team" };
const bubCls = { automation: "auto", agent: "agent", team: "team" };
export function msgOut(html, kind, { buttons = [], via = "", status = "" } = {}) {
  const by = `<div class="by">${glyph(kind, 13)}${byLabel[kind]}${via ? ` · ${via}` : ""}</div>`;
  const btns = buttons.length ? `<div class="row" style="gap:10px">${buttons.map((b) => `<span class="qbtn">${b}</span>`).join("")}</div>` : "";
  const st = status ? `<div class="note-m st">${status}</div>` : "";
  return el(`<div class="msg out">${by}<div class="bub ${bubCls[kind]}">${html}</div>${btns}${st}</div>`);
}
export function threadCard(platform, name, sub, { w, h } = {}) {
  return el(
    `<div class="card thread" style="width:${w}px;height:${h}px"><div class="th-hd">${tile(platform, 40)}<div class="col" style="gap:4px"><div class="th-name">${name}</div><div class="mono th-sub">${sub}</div></div></div><div class="th-body"></div></div>`,
  );
}

/** Spring-in a chat message (rise + scale from its side). */
export function popMsg(node, t, t0, { side = "in" } = {}) {
  const sp = spring(t, t0, { k: 380, c: 26 });
  const o = p(t, t0, 0.14, ease.linear);
  node.style.transformOrigin = side === "in" ? "0% 100%" : "100% 100%";
  set(node, { y: 18 * (1 - sp), s: lerp(0.9, 1, sp), o });
  return sp;
}
