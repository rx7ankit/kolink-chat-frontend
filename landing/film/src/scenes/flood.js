/**
 * 12 – 16 s · REPLIES FLOOD BACK. The hub drops to the centre of an eight-line interchange;
 * one reply per eighth note pops at its station and rides home as a hollow circle.
 * Counter IN 0 → 8.
 */
import { ease, lerp, p, set, spring } from "../lib/anim.js";
import { glyph, roundel, tile } from "../lib/brand.js";
import { pointAt, polyline } from "../lib/geometry.js";
import { el, odometer, setOdometer } from "../lib/ui.js";
import { ARRIVALS, hubPath } from "./hub.js";

export const REPLIES = [
  ["instagram", "Instagram · comment", "link pls 🙏"],
  ["messenger", "Messenger · DM", "are you open Sunday?"],
  ["facebook", "Facebook · comment", "LINK"],
  ["gmail", "Gmail · email", "<b style='font-weight:600'>Bulk order: 300 queen sets</b>"],
  ["threads", "Threads · reply", "the sage one 😍"],
  ["x", "X · mention", "@northwind.studio is the queen size back too?"],
  ["whatsapp", "WhatsApp · chat", "Is cash on delivery available?"],
  ["linkedin", "LinkedIn · comment", "Do you supply boutique hotels?"],
];

/** Station, route corner and bubble anchor per channel. Each line enters the hub from its own compass point. */
function layout(V, hx, hy) {
  if (V) {
    // Compass layout around the hub; [x, y, anchor, maxWidth] for each bubble.
    return {
      instagram: { s: [hx - 300, hy - 300], via: [], b: [44, 452, "l", 380] },
      facebook: { s: [hx, hy - 380], via: [], b: [hx, 372, "c", 300] },
      threads: { s: [hx + 300, hy - 300], via: [], b: [1036, 452, "r", 380] },
      x: { s: [hx + 430, hy], via: [], b: [1036, hy + 48, "r", 310] },
      linkedin: { s: [hx + 300, hy + 300], via: [], b: [1036, hy + 352, "r", 400] },
      gmail: { s: [hx, hy + 380], via: [], b: [hx, hy + 490, "c", 440] },
      whatsapp: { s: [hx - 300, hy + 300], via: [], b: [44, hy + 352, "l", 400] },
      messenger: { s: [hx - 430, hy], via: [], b: [44, hy - 150, "l", 360] },
    };
  }
  return {
    instagram: { s: [440, 230], via: [[hx - 310, 230]], b: [440, 92, "c"] },
    facebook: { s: [960, 150], via: [], b: [1006, 116, "l"] },
    threads: { s: [1480, 230], via: [[hx + 310, 230]], b: [1480, 92, "c"] },
    x: { s: [1750, 540], via: [], b: [1880, 398, "r"] },
    linkedin: { s: [1480, 850], via: [[hx + 310, 850]], b: [1880, 892, "r"] },
    gmail: { s: [960, 930], via: [], b: [1006, 902, "l"] },
    whatsapp: { s: [440, 850], via: [[hx - 310, 850]], b: [440, 892, "c"] },
    messenger: { s: [170, 540], via: [], b: [60, 420, "l"] },
  };
}

export function buildFlood({ V, W, H }, hub) {
  const root = el(`<section class="scene"></section>`);
  const HP = hubPath(V)[2];
  const hx = HP[1];
  const hy = HP[2];
  const L = layout(V, hx, hy);
  const svg = el(`<svg class="abs" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="left:0;top:0;overflow:visible"></svg>`);
  root.append(svg);

  const T0 = 12.75;
  const lines = REPLIES.map(([id, who, text], i) => {
    const c = L[id];
    const pts = [{ x: hx, y: hy }, ...c.via.map(([x, y]) => ({ x, y })).reverse(), { x: c.s[0], y: c.s[1] }];
    const route = polyline(pts, 22);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", route.d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "var(--ink)");
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("pathLength", "1");
    svg.append(path);
    const st = el(`<div class="abs" style="left:${c.s[0] - 26}px;top:${c.s[1] - 26}px">${roundel(id, 52)}</div>`);
    const pk = el(`<div class="abs" style="left:-14px;top:-14px">${glyph("incoming", 24, 2)}</div>`);
    const bub = el(`<div class="abs reply" style="${V ? `font-size:24px;max-width:${c.b[3]}px` : ""}">${tile(id, V ? 40 : 36)}<div class="col"><div class="who">${who}</div><div>${text}</div></div></div>`);
    const [bx, by, anchor] = c.b;
    bub.style.top = `${by}px`;
    if (anchor === "c") {
      bub.style.left = `${bx}px`;
      bub.style.translate = "-50% 0";
      bub.style.transformOrigin = "50% 100%";
    } else if (anchor === "r") {
      bub.style.right = `${W - bx}px`;
    } else {
      bub.style.left = `${bx}px`;
    }
    if (anchor === "skip") bub.style.display = "none";
    root.append(st, bub, pk);
    return { path, route, st, pk, bub, i };
  });

  const counter = el(`<div class="abs col" style="${V ? "left:240px;top:190px;width:600px;flex-direction:row;align-items:center;justify-content:center;gap:22px" : "left:540px;top:574px"};gap:6px"><span class="mono" style="font-size:${V ? 20 : 16}px;color:var(--ink)">In</span><span class="display" style="font-size:${V ? 120 : 112}px;line-height:1"></span><span class="mono" style="font-size:${V ? 17 : 14}px">replies</span></div>`);
  const odo = odometer(1);
  counter.children[1].append(odo);
  root.append(counter);

  function render(t) {
    const exitAll = (k) => p(t, 15.72 + k * 0.025, 0.36, ease.in);
    lines.forEach(({ path, route, st, pk, bub, i }) => {
      const dq = p(t, 12.5 + i * 0.03, 0.42, ease.out);
      path.style.strokeDasharray = `${dq.toFixed(4)} 2`;
      path.style.opacity = (1 - exitAll(i)).toFixed(3);
      const ss = spring(t, 12.7 + i * 0.03, { k: 420, c: 24 });
      set(st, { s: lerp(0.3, 1, ss) * (1 - exitAll(i) * 0.4), o: p(t, 12.7 + i * 0.03, 0.1, ease.linear) * (1 - exitAll(i)) });
      // The reply pops at its station on its eighth note, then rides the line home.
      const tb = T0 + i * 0.25;
      const bs = spring(t, tb, { k: 440, c: 25 });
      set(bub, { y: (1 - bs) * 16, s: lerp(0.86, 1, bs), o: p(t, tb, 0.12, ease.linear) * (1 - exitAll(i)) });
      const ride = p(t, tb + 0.1, ARRIVALS[i] - tb - 0.1, ease.travel);
      const q = pointAt(route, 1 - ride);
      const vis = t >= tb + 0.06 && t < ARRIVALS[i] + 0.05;
      set(pk, { x: q.x, y: q.y, s: vis ? 1 : 0, o: vis ? 1 : 0 });
    });
    let n = 0;
    for (const a of ARRIVALS) n += p(t, a, 0.22, ease.out);
    setOdometer(odo, n);
    set(counter, { o: p(t, 12.7, 0.4) * (1 - p(t, 15.75, 0.3, ease.in)), y: (1 - p(t, 12.7, 0.5)) * 14 });
  }

  return { root, render, t0: 12.0, t1: 16.2 };
}
