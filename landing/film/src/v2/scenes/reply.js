/**
 * 17.70 – 21.64 s · "Every reply. *One inbox.*" An ink ring irises in on an eight-line interchange;
 * hollow rings ride every line into the hub on eighth notes. On the next bar the interchange folds
 * into the hub and one inbox unfolds out of it, eight channels, one row each.
 */
import { BEAT, T } from "../timing.js";
import { ease, kline, lerp, lettersIn, p, set, spring, tilt } from "../kit.js";
import { LOGO_PATHS, glyph, roundel, tile } from "../../lib/brand.js";
import { pointAt, polyline } from "../../lib/geometry.js";
import { el, odometer, setOdometer } from "../../lib/ui.js";

export const INBOX = [
  ["instagram", "linen.lover", "link pls 🙏", "automation", "now"],
  ["messenger", "Rohan Mehta", "are you open Sunday?", "agent", "now"],
  ["facebook", "Nikhil P.", "LINK", "automation", "1m"],
  ["gmail", "Kavya R.", "Bulk order: 300 queen sets", "team", "1m"],
  ["threads", "tara.weaves", "the sage one 😍", "team", "2m"],
  ["x", "@meera_k", "is the queen size back too?", "team", "2m"],
  ["whatsapp", "+91 98•• ••• 210", "Is cash on delivery available?", "team", "3m"],
  ["linkedin", "Arjun S.", "Do you supply boutique hotels?", "team", "3m"],
];
const DIRS = { instagram: [-1, -1], messenger: [-1, 0], facebook: [0, -1], gmail: [0, 1], threads: [1, -1], x: [1, 0], whatsapp: [-1, 1], linkedin: [1, 1] };

/** Where the Instagram row's automation diamond sits (the next wipe starts from it). */
export function inboxGeo(W, H, V) {
  return V ? { x: 70, y: 640, w: 940, rowH: 112, head: 84 } : { x: 990, y: 112, w: 860, rowH: 98, head: 80 };
}

export function buildReply({ W, H, V }) {
  const root = el(`<section class="scene"></section>`);
  const l1 = kline("Every reply.", V ? 150 : 150);
  const l2 = kline("*One inbox.*", V ? 168 : 172);
  for (const l of [l1, l2]) {
    l.classList.add("abs");
    root.append(l);
  }
  if (V) {
    Object.assign(l1.style, { left: "0", width: `${W}px`, top: "200px" });
    Object.assign(l2.style, { left: "0", width: `${W}px`, top: "360px" });
  } else {
    Object.assign(l1.style, { left: "100px", top: "350px", textAlign: "left" });
    Object.assign(l2.style, { left: "100px", top: "520px", textAlign: "left" });
  }

  /* interchange */
  const hub = V ? { x: 540, y: 1180 } : { x: 1410, y: 545 };
  const R = V ? 330 : 330;
  const D = V ? 280 : 270;
  const svg = el(`<svg class="abs" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="left:0;top:0;overflow:visible"></svg>`);
  root.append(svg);
  const lines = INBOX.map(([id], i) => {
    const [dx, dy] = DIRS[id];
    const diag = dx && dy;
    const s = { x: hub.x + dx * (diag ? D : R), y: hub.y + dy * (diag ? D : R) };
    const route = polyline([s, hub], 10);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", route.d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "var(--ink)");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("pathLength", "1");
    svg.append(path);
    const st = el(`<div class="abs" style="left:${s.x - 34}px;top:${s.y - 34}px">${roundel(id, 68)}</div>`);
    const pk = el(`<div class="abs" style="left:-17px;top:-17px">${glyph("incoming", 28, 2.5)}</div>`);
    root.append(st, pk);
    return { path, route, st, pk, s, i };
  });
  const hubEl = el(`<div class="abs" style="left:${hub.x - 75}px;top:${hub.y - 75}px;width:150px;height:150px;border-radius:50%;background:var(--surface);box-shadow:inset 0 0 0 3px var(--ink),0 0 0 9px var(--bg),0 24px 50px -20px rgba(38,43,38,.35);display:grid;place-items:center"><svg viewBox="0 0 681 550" style="width:58px">${LOGO_PATHS.map((d) => `<path d="${d}" fill="var(--ink)"/>`).join("")}</svg></div>`);
  root.append(hubEl);
  const inLabel = el(`<div class="abs row mono" style="left:${V ? hub.x - 250 : hub.x - 300}px;top:${hub.y + 24}px;width:200px;justify-content:flex-end;gap:12px;font-size:20px;color:var(--ink)"><span>In</span><span class="display" style="font-size:56px;letter-spacing:0;line-height:1"></span></div>`);
  const odo = odometer(1);
  inLabel.children[1].append(odo);
  root.append(inLabel);

  /* the inbox that unfolds out of the hub */
  const G = inboxGeo(W, H, V);
  const card = el(`<div class="abs card" style="left:${G.x}px;top:${G.y}px;width:${G.w}px;overflow:hidden;transform-origin:${hub.x - G.x}px ${hub.y - G.y}px"></div>`);
  const head = el(`<div class="row" style="height:${G.head}px;padding:0 26px;border-bottom:1px solid var(--line);gap:12px"><span style="font-weight:600;font-size:${V ? 30 : 26}px;letter-spacing:-0.02em">Inbox</span><span class="mono" style="font-size:15px">All channels</span><span class="mono" style="margin-left:auto;font-size:15px;color:var(--ink)">8 new</span></div>`);
  card.append(head);
  const rows = INBOX.map(([id, name, pv, h, tm]) => {
    const r = el(`<div class="inbox-row" style="height:${G.rowH}px;gap:18px;padding:0 26px">${tile(id, V ? 52 : 46)}<div class="col" style="min-width:0;flex:1;gap:4px"><span class="nm" style="font-size:${V ? 25 : 21}px">${name}</span><span class="pv" style="font-size:${V ? 22 : 19}px">${pv}</span></div><span class="hg">${glyph(h, V ? 22 : 20)}</span><span class="tm">${tm}</span></div>`);
    card.append(r);
    return r;
  });
  root.append(card);

  const t0 = T.reply;
  const tFold = T.inbox;
  const dep = (i) => t0 + 0.2 + i * BEAT * 0.5;
  const travel = 0.36;

  function render(t) {
    lettersIn(l1, t, t0, { stagger: 0.02, d: 0.45, tOut: T.link - 0.3, dOut: 0.2 });
    lettersIn(l2, t, tFold, { stagger: 0.026, d: 0.5, tOut: T.link - 0.25, dOut: 0.2 });

    const fold = p(t, tFold - 0.05, 0.3, ease.in);
    lines.forEach(({ path, route, st, pk, s, i }) => {
      const dq = p(t, t0 - 0.1 + i * 0.03, 0.35, ease.out);
      path.style.strokeDasharray = `${dq.toFixed(4)} 2`;
      path.style.strokeDashoffset = `${(-fold).toFixed(4)}`;
      path.style.opacity = fold >= 0.99 || dq < 0.002 ? "0" : "1";
      const ss = spring(t, t0 + 0.05 + i * 0.03, { k: 420, c: 22 });
      const lit = impulseLocal(t, dep(i));
      set(st, { x: (hubDelta(s).x) * fold, y: hubDelta(s).y * fold, s: lerp(0.3, 1, ss) * (1 + lit * 0.18) * (1 - fold * 0.7), o: (t >= t0 - 0.1 ? 1 : 0) * (1 - fold) });
      const ride = p(t, dep(i), travel, ease.travel);
      const q = pointAt(route, ride);
      const vis = t >= dep(i) && t < dep(i) + travel;
      set(pk, { x: q.x, y: q.y, s: vis ? 1 : 0, o: vis ? 1 : 0 });
    });
    let arrived = 0;
    lines.forEach((_, i) => (arrived += p(t, dep(i) + travel, 0.15, ease.out)));
    setOdometer(odo, arrived);
    const bump = lines.reduce((a, _, i) => a + impulseLocal(t, dep(i) + travel), 0);
    set(hubEl, { s: (1 + bump * 0.06) * spring(t, t0 - 0.12, { k: 300, c: 22 }) * (1 - fold), o: 1 - fold });
    set(inLabel, { o: p(t, t0 + 0.2, 0.3) * (1 - fold) });

    /* inbox unfolds from the hub */
    const u = spring(t, tFold + 0.08, { k: 230, c: 21 });
    card.style.transform = tilt({ s: lerp(0.08, 1, u), rx: 50 * (1 - u), persp: 2000 });
    card.style.opacity = t >= tFold + 0.08 ? Math.min(1, (t - tFold - 0.08) / 0.06).toFixed(3) : "0";
    rows.forEach((r, i) => {
      const tr = tFold + 0.2 + i * BEAT * 0.25;
      const rs = spring(t, tr, { k: 380, c: 24 });
      set(r, { x: (1 - rs) * (V ? 0 : 90), y: (1 - rs) * (V ? 40 : 0), o: t >= tr ? Math.min(1, (t - tr) / 0.06) : 0 });
    });
  }

  function hubDelta(s) {
    return { x: hub.x - s.x, y: hub.y - s.y };
  }
  function impulseLocal(t, at) {
    const dt = t - at;
    return dt >= 0 && dt < 0.5 ? Math.exp(-dt * 10) : 0;
  }

  return { root, render, t0: T.reply - 0.3, t1: T.link + 0.3 };
}
