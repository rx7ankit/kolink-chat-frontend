/**
 * 6 – 12 s · SEND + FAN-OUT. The POST capsule rides a line into the koLink hub; the hub
 * clicks, and on the drum entry (8.0 s) the post fans out along five lines into five native
 * posts that land on sixteenth notes. The Reel plays; counts tick up.
 */
import { clamp, ease, lerp, p, set, spring } from "../lib/anim.js";
import { pointAt, polyline } from "../lib/geometry.js";
import { fbPost, igReel, linkedinPost, setCounts, stationLabel, threadsPost, xPost } from "../lib/mockups.js";
import { el } from "../lib/ui.js";
import { roundel, tile } from "../lib/brand.js";
import { composeGeo } from "./compose.js";
import { hubPath } from "./hub.js";

const T_LAND = 8.0;
const STEP = 0.125;

export function buildFanout({ V, W, H, reel }, hub) {
  const root = el(`<section class="scene"></section>`);
  const G = composeGeo(V);
  const H0 = hubPath(V)[0]; // [t, x, y, d]
  const hubPt = { x: H0[1], y: H0[2] };

  const svg = el(`<svg class="abs" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="left:0;top:0;overflow:visible"></svg>`);
  root.append(svg);

  /* ---- spur: composer → hub ---- */
  const spurRoute = polyline([{ x: G.cx, y: G.cy }, { x: hubPt.x, y: hubPt.y }]);
  const spur = mkPath(spurRoute.d, 3);
  svg.append(spur);
  const capsule = el(`<div class="abs" style="left:0;top:0;width:${G.capW}px;height:${G.capH}px;margin-left:${-G.capW / 2}px;margin-top:${-G.capH / 2}px;border-radius:999px;background:var(--accent);display:grid;place-items:center;overflow:hidden"><span class="mono" style="color:var(--accent-ink);font-size:13px;letter-spacing:.12em;opacity:0">Post</span></div>`);
  const capLabel = capsule.firstElementChild;
  root.append(capsule);

  /* ---- five columns ---- */
  const items = [
    ["instagram", "Instagram · Reel", () => igReel(cardW())],
    ["facebook", "Facebook Page", () => fbPost(cardW())],
    ["threads", "Threads", () => threadsPost(cardW())],
    ["x", "X · 52/280", () => xPost(cardW())],
    ["linkedin", "LinkedIn · text only", () => linkedinPost(cardW())],
  ];
  function cardW() {
    return V ? 320 : 316;
  }
  const cw = cardW();
  // 16:9: one row of five, each under its station label. 9:16: a row of five stations under
  // the hub (a departure board), then the posts as a three-column masonry.
  const cols = V
    ? [
        { x: 40, y: 770 },
        { x: 380, y: 770 },
        { x: 720, y: 770 },
        { x: 720, y: 1290 },
        { x: 40, y: 1362 },
      ]
    : Array.from({ length: 5 }, (_, i) => ({ x: 90 + i * (cw + 40), y: 330 }));

  const groups = items.map(([id, label, make], i) => {
    const g = el(`<div class="abs" style="left:${cols[i].x}px;top:${cols[i].y}px;width:${cw}px"></div>`);
    const card = make();
    let lab;
    let rx;
    let ry;
    if (V) {
      rx = 140 + i * 200;
      ry = 640;
      lab = el(`<div class="abs col" style="left:${rx - 100}px;top:${ry - 30}px;width:200px;align-items:center;gap:12px">${roundel(id, 60)}<span class="mono" style="font-size:15px;color:var(--ink);white-space:nowrap">${label.split(" · ")[0]}</span><span class="live" style="font-size:13px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>LIVE</span></div>`);
      root.append(lab);
      const badge = el(`<span class="abs" style="right:-12px;top:-12px;z-index:2;${id === "x" ? "display:none" : ""}">${tile(id, 38)}</span>`);
      const wrap = el(`<div style="position:relative"></div>`);
      wrap.append(card, badge);
      g.append(wrap);
    } else {
      lab = stationLabel(id, label, cw);
      card.style.marginTop = "16px";
      g.append(lab, card);
      rx = cols[i].x + 20;
      ry = cols[i].y + 20;
    }
    root.append(g);
    // Branch route: hub → down → 45° → trunk → 45° → down to the roundel centre.
    const sgn = Math.sign(rx - hubPt.x) || 1;
    const trunkY = V ? hubPt.y + 92 : hubPt.y + 86;
    const pts =
      Math.abs(rx - hubPt.x) < 1
        ? [hubPt, { x: rx, y: ry }]
        : [
            { x: hubPt.x, y: hubPt.y },
            { x: hubPt.x, y: trunkY - 34 },
            { x: hubPt.x + sgn * 34, y: trunkY },
            { x: rx - sgn * 34, y: trunkY },
            { x: rx, y: trunkY + 34 },
            { x: rx, y: ry },
          ];
    const route = polyline(pts, 16);
    const ghost = mkPath(route.d, 2);
    ghost.removeAttribute("pathLength");
    ghost.setAttribute("stroke", "var(--line-strong)");
    ghost.setAttribute("stroke-dasharray", "1 9");
    const path = mkPath(route.d, 2.5);
    svg.append(ghost, path);
    const canvas = card.querySelector("canvas");
    const live = lab.querySelector(".live");
    const mover = V ? card.parentElement : card;
    return { g, lab, card, mover, path, ghost, route, canvas, id, live };
  });

  // 9:16 only: a stat in the masonry gap.
  const stat = V
    ? el(`<div class="abs col" style="left:380px;top:1330px;width:320px;gap:10px"><span class="mono" style="font-size:16px;color:var(--ink)">One post</span><span class="display" style="font-size:72px;line-height:1">Live on<br><span class="em">5 networks.</span></span><span class="mono" style="font-size:14px;line-height:1.5">Instagram · Facebook · Threads · X · LinkedIn (text)</span></div>`)
    : null;
  if (stat) root.append(stat);

  function render(t) {
    /* capsule + spur */
    const tGo = 6.55;
    const tArrive = 7.5;
    const shrink = p(t, 6.05, 0.35, ease.out);
    const capW = lerp(G.capW, 96, shrink);
    const capH = lerp(G.capH, 42, shrink);
    capLabel.style.opacity = (p(t, 6.15, 0.2) * (1 - p(t, 6.3, 0.12))).toFixed(3);
    capsule.style.width = `${capW}px`;
    capsule.style.height = `${capH}px`;
    capsule.style.marginLeft = `${-capW / 2}px`;
    capsule.style.marginTop = `${-capH / 2}px`;
    capsule.style.boxShadow = `0 0 0 ${(1.5 * shrink).toFixed(2)}px var(--ink)`;
    const turn = p(t, 6.3, 0.3, ease.out);
    const dip = Math.sin(clamp((t - 6.35) / 0.22) * Math.PI) * 10; // anticipation before the ride
    const ride = p(t, tGo, tArrive - tGo, ease.travel);
    const pos = pointAt(spurRoute, ride);
    const gone = p(t, tArrive - 0.12, 0.14, ease.in);
    // Stretch along the line with speed (a motion-blur feel without blur).
    const speed = (p(t + 1 / 120, tGo, tArrive - tGo, ease.travel) - p(t - 1 / 120, tGo, tArrive - tGo, ease.travel)) * 60;
    const st = Math.min(0.35, speed * 0.12);
    set(capsule, { x: pos.x, y: pos.y + dip, r: -90 * turn, s: 1 - 0.6 * gone, sx: 1 + st, sy: 1 - st * 0.35, o: t < 6.04 ? 0 : 1 - gone });
    // Spur draws up to the hub, then is consumed behind the capsule.
    const draw = p(t, 6.05, 0.4, ease.out);
    const tail = ride;
    spur.style.strokeDasharray = `${Math.max(0, draw - tail).toFixed(4)} 2`;
    spur.style.strokeDashoffset = `${(-tail).toFixed(4)}`;
    spur.style.visibility = draw - tail > 0.002 ? "visible" : "hidden";
    spur.style.opacity = (1 - p(t, 7.5, 0.3)).toFixed(3);

    /* branches and posts */
    const out = (i) => p(t, 11.72 + i * 0.04, 0.38, ease.in);
    groups.forEach((gr, i) => {
      const tl = T_LAND + i * STEP;
      const dS = 7.55 + i * 0.06;
      // Waiting stations: a dotted route and a faded roundel, before the post arrives.
      const g0 = V ? 7.2 : 6.45; // vertical: wait until the capsule has passed the station row
      const gq = p(t, g0 + i * 0.06, 0.45, ease.out);
      gr.ghost.style.opacity = (gq * 0.9 * (1 - p(t, 11.8, 0.3))).toFixed(3);
      gr.live.style.opacity = p(t, tl + 0.15, 0.2).toFixed(3);
      const dq = p(t, dS, tl - dS + 0.05, ease.out);
      const rq = p(t, 11.8 + i * 0.03, 0.3, ease.in);
      gr.path.style.strokeDasharray = `${dq.toFixed(4)} 2`;
      gr.path.style.strokeDashoffset = `${(-rq).toFixed(4)}`;
      gr.path.style.opacity = t < dS || rq >= 0.995 ? "0" : "1";
      // Station label pops as the line arrives.
      const ls = spring(t, g0 + i * 0.06, { k: 380, c: 24 });
      const lit = p(t, tl - 0.06, 0.15, ease.linear);
      set(gr.lab, { s: 1, o: (0.4 * gq + 0.6 * lit) * (1 - out(i)), y: (1 - ls) * 12 });
      // Card lands with a spring and a masked reveal.
      const cs = spring(t, tl, { k: 260, c: 21 });
      const reveal = p(t, tl, 0.5, ease.out);
      set(gr.mover, { y: (1 - cs) * 90 + out(i) * 70, o: p(t, tl, 0.14, ease.linear) * (1 - out(i)) });
      gr.mover.style.clipPath = reveal >= 1 ? "none" : `inset(0 0 ${((1 - reveal) * 100).toFixed(2)}% 0 round 20px)`;
      setCounts(gr.card, p(t, 9.0 + i * 0.12, 2.6, ease.out));
      if (gr.canvas) reel.draw(gr.canvas, t - T_LAND);
    });
    if (stat) set(stat, { o: p(t, 8.75, 0.5) * (1 - p(t, 11.8, 0.3, ease.in)), y: (1 - p(t, 8.75, 0.6)) * 20 });
  }

  function mkPath(d, w) {
    const n = document.createElementNS("http://www.w3.org/2000/svg", "path");
    n.setAttribute("d", d);
    n.setAttribute("fill", "none");
    n.setAttribute("stroke", "var(--ink)");
    n.setAttribute("stroke-width", String(w));
    n.setAttribute("stroke-linecap", "round");
    n.setAttribute("stroke-linejoin", "round");
    n.setAttribute("pathLength", "1");
    return n;
  }

  return { root, render, t0: 6.0, t1: 12.3 };
}
