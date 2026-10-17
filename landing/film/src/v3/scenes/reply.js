/**
 * 17.70 – 21.64 s · "Every reply. One inbox."
 *  An ink ring irises in on the eight-line interchange, now lying on a tilted floor with the camera
 *  slowly orbiting it (3D); a hollow ring rides each line home on eighth notes.
 *  "One inbox." — then the word *becomes the UI*: the inbox card grows out of the word "inbox.",
 *  the word dissolves into the card's title and eight channel rows cascade in.
 */
import { BEAT, T } from "../timing.js";
import { kline, lettersIn } from "../../v2/kit.js";
import { boxIn, clamp, ease, lerp, p, set, spring, weightPulse } from "../kit3.js";
import { LOGO_PATHS, glyph, roundel, tile } from "../../lib/brand.js";
import { pointAt, polyline } from "../../lib/geometry.js";
import { el, odometer, setOdometer } from "../../lib/ui.js";
import { INBOX, inboxGeo } from "../../v2/scenes/reply.js";

const DIRS = { instagram: [-1, -1], messenger: [-1, 0], facebook: [0, -1], gmail: [0, 1], threads: [1, -1], x: [1, 0], whatsapp: [-1, 1], linkedin: [1, 1] };

export function buildReply({ W, H, V }) {
  const root = el(`<section class="scene"></section>`);
  const l1 = kline("Every reply.", V ? 150 : 150);
  const l2 = kline("*One inbox.*", V ? 168 : 172);
  for (const l of [l1, l2]) {
    l.classList.add("abs");
    l.style.zIndex = "5";
    root.append(l);
  }
  if (V) {
    Object.assign(l1.style, { left: "0", width: `${W}px`, top: "200px" });
    Object.assign(l2.style, { left: "0", width: `${W}px`, top: "360px" });
  } else {
    Object.assign(l1.style, { left: "100px", top: "350px", textAlign: "left" });
    Object.assign(l2.style, { left: "100px", top: "520px", textAlign: "left" });
  }
  const inboxWord = l2.querySelectorAll(".kw")[1];

  /* interchange on a tilted floor */
  const hub = V ? { x: 540, y: 1220 } : { x: 1400, y: 560 };
  const R = 360;
  const D = 300;
  const inter = el(`<div class="abs" style="left:0;top:0;width:${W}px;height:${H}px;transform-origin:${hub.x}px ${hub.y}px;transform-style:preserve-3d"></div>`);
  root.append(inter);
  const svg = el(`<svg class="abs" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="left:0;top:0;overflow:visible"></svg>`);
  inter.append(svg);
  // concentric guide rings, like a station map's zone circles
  for (const r of [150, 260, 420]) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", hub.x);
    c.setAttribute("cy", hub.y);
    c.setAttribute("r", r);
    c.setAttribute("fill", "none");
    c.setAttribute("stroke", "#E3E9DA");
    c.setAttribute("stroke-width", 2);
    svg.append(c);
  }
  const lines = INBOX.map(([id], i) => {
    const [dx, dy] = DIRS[id];
    const diag = dx && dy;
    const s = { x: hub.x + dx * (diag ? D : R), y: hub.y + dy * (diag ? D : R) };
    const route = polyline([s, hub], 10);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", route.d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "var(--ink)");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("pathLength", "1");
    svg.append(path);
    const st = el(`<div class="abs" style="left:${s.x - 38}px;top:${s.y - 38}px">${roundel(id, 76)}</div>`);
    const pk = el(`<div class="abs" style="left:-18px;top:-18px">${glyph("incoming", 30, 2.5)}</div>`);
    inter.append(st, pk);
    return { path, route, st, pk, s, i };
  });
  const hubEl = el(`<div class="abs" style="left:${hub.x - 80}px;top:${hub.y - 80}px;width:160px;height:160px;border-radius:50%;background:var(--surface);box-shadow:inset 0 0 0 4px var(--ink),0 0 0 10px var(--bg);display:grid;place-items:center"><svg viewBox="0 0 681 550" style="width:62px">${LOGO_PATHS.map((d) => `<path d="${d}" fill="var(--ink)"/>`).join("")}</svg></div>`);
  inter.append(hubEl);
  const inLabel = el(`<div class="abs row mono" style="left:${hub.x + 100}px;top:${hub.y + 70}px;gap:12px;font-size:20px;color:var(--ink)"><span>In</span><span class="display" style="font-size:56px;letter-spacing:0;line-height:1"></span></div>`);
  const odo = odometer(1);
  inLabel.children[1].append(odo);
  inter.append(inLabel);

  /* the inbox that grows out of the word */
  const G = inboxGeo(W, H, V);
  const cardH = G.head + INBOX.length * G.rowH;
  const card = el(`<div class="abs" style="left:0;top:0;overflow:hidden;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow-lg);z-index:4"></div>`);
  const content = el(`<div class="abs" style="left:0;top:0;width:${G.w}px"></div>`);
  const head = el(`<div class="row" style="height:${G.head}px;padding:0 26px;border-bottom:1px solid var(--line);gap:12px"><span class="ttl" style="font-weight:600;font-size:${V ? 30 : 26}px;letter-spacing:-0.02em">Inbox</span><span class="mono" style="font-size:15px">All channels</span><span class="mono" style="margin-left:auto;font-size:15px;color:var(--ink)">8 new</span></div>`);
  content.append(head);
  const rows = INBOX.map(([id, name, pv, h, tm]) => {
    const r = el(`<div class="inbox-row" style="height:${G.rowH}px;gap:18px;padding:0 26px">${tile(id, V ? 52 : 46)}<div class="col" style="min-width:0;flex:1;gap:4px"><span class="nm" style="font-size:${V ? 25 : 21}px">${name}</span><span class="pv" style="font-size:${V ? 22 : 19}px">${pv}</span></div><span class="hg">${glyph(h, V ? 22 : 20)}</span><span class="tm">${tm}</span></div>`);
    content.append(r);
    return r;
  });
  card.append(content);
  root.append(card);

  const t0 = T.reply;
  const tIn = T.inbox;
  const tMorph = tIn + BEAT; // 20.16
  const dep = (i) => t0 + 0.2 + i * BEAT * 0.5;
  const travel = 0.36;
  let wb = null;

  function render(t) {
    if (!wb) wb = boxIn(inboxWord, root);
    lettersIn(l1, t, t0, { stagger: 0.02, d: 0.45, tOut: T.link - 0.3, dOut: 0.2 });
    weightPulse(l1, t, t0, { peak: 640, rest: 300, stagger: 0.02 });
    lettersIn(l2, t, tIn, { stagger: 0.026, d: 0.5 });
    // "One" stays; the letters of "inbox." hand over to the card
    const hand = p(t, tMorph + 0.02, 0.14);
    inboxWord.style.opacity = (1 - hand).toFixed(3);
    l2.querySelectorAll(".kw")[0].style.opacity = (1 - p(t, T.link - 0.3, 0.2)).toFixed(3);

    /* orbiting floor */
    const tiltIn = ease.out(clamp((t - (t0 - 0.3)) / 0.8));
    const fold = p(t, tMorph - 0.1, 0.35, ease.in);
    const rz = lerp(-16, 10, ease.cam(clamp((t - t0) / (tMorph - t0 + 0.4))));
    const rx = lerp(20, 52, tiltIn);
    inter.style.transform = `perspective(1500px) rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${lerp(1, 0.4, fold).toFixed(4)})`;
    inter.style.opacity = (1 - fold).toFixed(3);
    lines.forEach(({ path, route, st, pk, i }) => {
      const dq = p(t, t0 - 0.1 + i * 0.03, 0.35, ease.out);
      path.style.strokeDasharray = `${dq.toFixed(4)} 2`;
      path.style.visibility = dq > 0.002 ? "visible" : "hidden";
      const lit = Math.max(0, t - dep(i) < 0.5 && t > dep(i) ? Math.exp(-(t - dep(i)) * 10) : 0);
      set(st, { s: lerp(0.3, 1, spring(t, t0 + 0.05 + i * 0.03, { k: 420, c: 22 })) * (1 + lit * 0.2), o: t >= t0 - 0.1 ? 1 : 0 });
      const ride = p(t, dep(i), travel, ease.travel);
      const q = pointAt(route, ride);
      const vis = t >= dep(i) && t < dep(i) + travel;
      set(pk, { x: q.x, y: q.y, s: vis ? 1 : 0, o: vis ? 1 : 0 });
    });
    let arrived = 0;
    lines.forEach((_, i) => (arrived += p(t, dep(i) + travel, 0.15, ease.out)));
    setOdometer(odo, arrived);
    let bump = 0;
    lines.forEach((_, i) => {
      const dt = t - dep(i) - travel;
      if (dt > 0 && dt < 0.5) bump += Math.exp(-dt * 10);
    });
    set(hubEl, { s: (1 + bump * 0.06) * spring(t, t0 - 0.12, { k: 300, c: 22 }) });
    set(inLabel, { o: p(t, t0 + 0.2, 0.3) });

    /* the word becomes the inbox */
    const m = spring(t, tMorph, { k: 170, c: 21 });
    const pad = 14;
    const from = { x: wb.x - pad, y: wb.y - pad / 2, w: wb.w + pad * 2, h: wb.h + pad };
    const x = lerp(from.x, G.x, m);
    const y = lerp(from.y, G.y, m);
    const w = lerp(from.w, G.w, m);
    const h = lerp(from.h, cardH, m);
    card.style.width = `${w.toFixed(1)}px`;
    card.style.height = `${h.toFixed(1)}px`;
    card.style.borderRadius = `${lerp(14, 20, m).toFixed(1)}px`;
    set(card, { x, y, o: t >= tMorph ? Math.min(1, (t - tMorph) / 0.06) : 0 });
    set(content, { o: p(t, tMorph + 0.18, 0.2) });
    rows.forEach((r, i) => {
      const tr = tMorph + 0.3 + i * BEAT * 0.25;
      const rs = spring(t, tr, { k: 380, c: 24 });
      set(r, { x: (1 - rs) * (V ? 0 : 70), y: (1 - rs) * (V ? 30 : 0), o: t >= tr ? Math.min(1, (t - tr) / 0.06) : 0 });
    });
  }

  return { root, render, t0: T.reply - 0.3, t1: T.link + 0.3 };
}
