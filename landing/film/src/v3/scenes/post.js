/**
 * 11.80 – 17.70 s · "POST ONCE." — the signature move.
 *  11.80  The macro'd Publish button (match cut) springs into the POST capsule; "Post once." slams in
 *         variable weight.
 *  12.29  The camera flies *through* the headline into z-space (Don't Blink: breaking the plane):
 *         the transit map tilts into perspective and we ride the line behind the capsule, sleepers and
 *         grid streaming past — speed-ramped, fast in, slowing as the hub approaches.
 *  13.52  Arrive at the hub (ring clicks). 13.77: the camera cranes up to overhead; five branches draw
 *         and five native posts pop up on sixteenth notes (Reel playing).
 *  14.75  Rack focus: "One post. Five networks." sharp over blurred posts → focus pulls to the posts.
 *  15.74  First replies pop out of every post; then the camera dives back toward the hub.
 */
import { BEAT, T, beat } from "../timing.js";
import { kline, lettersIn } from "../../v2/kit.js";
import { clamp, ease, focus, keyed, lerp, p, ramp, set, spring, weightPulse } from "../kit3.js";
import { LOGO_PATHS, glyph, platforms, roundel, tile } from "../../lib/brand.js";
import { link, pointAt, polyline } from "../../lib/geometry.js";
import { fbPost, igReel, linkedinPost, setCounts, threadsPost, xPost } from "../../lib/mockups.js";
import { el } from "../../lib/ui.js";
import { macroBox } from "./turn.js";

const IDS = ["instagram", "facebook", "threads", "x", "linkedin"];
const REPLIES = ["link pls 🙏", "LINK", "the sage one 😍", "is the queen size back too?", "Do you supply boutique hotels?"];
const SVGNS = "http://www.w3.org/2000/svg";
/** The ride's speed ramp: launches hard, cruises, and melts into slow motion at the hub. */
const rideEase = (x) => 1 - Math.pow(1 - x, 2.4) * (1 - 0.15 * x);

export function buildPost({ W, H, V, reel }) {
  const root = el(`<section class="scene"></section>`);
  const cx = W / 2;
  const cy = H / 2;

  /* ---------- plane geometry (plane coords: hub at 0,0; the ride comes up from +y) ---------- */
  const cw = V ? 300 : 316;
  const slots = V
    ? [
        { x: -340, top: -1720 },
        { x: 0, top: -1720 },
        { x: 340, top: -1720 },
        { x: -170, top: -1110 },
        { x: 170, top: -1110 },
      ]
    : [-712, -356, 0, 356, 712].map((x) => ({ x, top: -1130 }));
  const OX = 2400;
  const OY = 3200;
  const PW = 4800;
  const PH = 6400;
  const START = V ? 3000 : 2900; // where the ride starts (plane y)

  const viewport = el(`<div class="abs" style="left:0;top:0;width:${W}px;height:${H}px;perspective:${V ? 1300 : 1100}px;perspective-origin:50% ${V ? 46 : 42}%;overflow:hidden"></div>`);
  const world = el(`<div class="abs" style="left:50%;top:${V ? 62 : 64}%;width:0;height:0;transform-style:preserve-3d"></div>`);
  const plane = el(`<div class="abs" style="left:${-OX}px;top:${-OY}px;width:${PW}px;height:${PH}px;transform-style:preserve-3d"></div>`);
  viewport.append(world);
  // atmospheric depth: the far floor fades into paper (no hard horizon)
  const fog = el(`<div class="abs" style="left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;background:linear-gradient(var(--bg) 8%, rgba(252,253,249,0.85) 22%, rgba(252,253,249,0) 46%)"></div>`);
  viewport.append(fog);
  world.append(plane);
  root.append(viewport);

  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("width", PW);
  svg.setAttribute("height", PH);
  svg.setAttribute("viewBox", `${-OX} ${-OY} ${PW} ${PH}`);
  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";
  plane.append(svg);
  const mk = (tag, attrs) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    svg.append(n);
    return n;
  };
  // paper grid on the plane (columns + rows) — it is what streams past during the ride
  const gridG = mk("g", { stroke: "#E3E9DA", "stroke-width": 2 });
  const gl = (x1, y1, x2, y2) => {
    const n = document.createElementNS(SVGNS, "line");
    n.setAttribute("x1", x1);
    n.setAttribute("y1", y1);
    n.setAttribute("x2", x2);
    n.setAttribute("y2", y2);
    gridG.append(n);
  };
  for (let x = -2400; x <= 2400; x += 160) gl(x, -3200, x, 3200);
  for (let y = -3200; y <= 3200; y += 160) gl(-2400, y, 2400, y);
  // the line we ride: sleepers every 40px, the rail itself
  for (let y = START; y > 60; y -= 46) mk("line", { x1: -16, x2: 16, y1: y, y2: y, stroke: "#262B26", "stroke-width": 3, "stroke-linecap": "round", opacity: 0.35 });
  mk("path", { d: `M0 ${START + 400}L0 0`, stroke: "#262B26", "stroke-width": 6, "stroke-linecap": "round", fill: "none" });
  // plane labels (mono, like station names painted on the map)
  const lab = (x, y, text, anchor = "start") => {
    const n = mk("text", { x, y, "font-family": "Geist Mono", "font-size": 30, "letter-spacing": 4, fill: "#6B7168", "text-anchor": anchor });
    n.textContent = text;
    return n;
  };
  lab(40, START - 20, "COMPOSER");
  lab(40, 220, "KOLINK HUB");
  // destinations painted on the floor along the rail, alternating sides — they stream past on the ride
  const DEST = [["instagram", "Instagram"], ["facebook", "Facebook Page"], ["threads", "Threads"], ["x", "X"], ["linkedin", "LinkedIn"]];
  DEST.forEach(([id, name], i) => {
    const y = START - 560 - i * 470;
    const left = i % 2 === 0;
    const gx = left ? -120 : 120;
    const g = mk("g", { transform: `translate(${left ? gx - 84 : gx}, ${y - 84}) scale(3.5)` });
    const pth = document.createElementNS(SVGNS, "path");
    pth.setAttribute("d", platforms[id].path);
    pth.setAttribute("fill", platforms[id].color);
    g.append(pth);
    const tx = mk("text", { x: left ? gx - 110 : gx + 110, y: y - 20, "font-family": "Geist Mono", "font-size": 64, "letter-spacing": 6, fill: "#262B26", "text-anchor": left ? "end" : "start" });
    tx.textContent = id === "x" ? "" : name.toUpperCase();
    mk("circle", { cx: 0, cy: y - 42, r: 22, fill: "#FFFFFF", stroke: "#262B26", "stroke-width": 6 });
  });
  // branches + stations
  const branches = slots.map((s, i) => {
    const card = { x: s.x, y: s.top };
    const stop = { x: s.x, y: -460 - (V && i < 3 ? 0 : 0) };
    const route = V ? link({ x: 0, y: 0 }, { x: s.x, y: i < 3 ? -620 : -440 }, { r: 30, bend: 0.5 }) : link({ x: 0, y: 0 }, stop, { r: 30, bend: 0.5 });
    const path = mk("path", { d: route.d, stroke: "#262B26", "stroke-width": 5, "stroke-linecap": "round", fill: "none", pathLength: 1 });
    void card;
    return { path, route };
  });

  // hub on the plane
  const hub = el(`<div class="abs" style="left:${OX - 80}px;top:${OY - 80}px;width:160px;height:160px;border-radius:50%;background:var(--surface);box-shadow:inset 0 0 0 5px var(--ink),0 0 0 14px var(--bg);display:grid;place-items:center"><svg viewBox="0 0 681 550" style="width:64px">${LOGO_PATHS.map((d) => `<path d="${d}" fill="var(--ink)"/>`).join("")}</svg></div>`);
  plane.append(hub);

  // posts on the plane
  const makers = [() => igReel(cw), () => fbPost(cw), () => threadsPost(cw), () => xPost(cw), () => linkedinPost(cw)];
  const cards = makers.map((m, i) => {
    const wrap = el(`<div class="abs" style="left:${OX + slots[i].x - cw / 2}px;top:${OY + slots[i].top}px;width:${cw}px;transform-origin:50% 100%"></div>`);
    const card = m();
    const badge = el(`<span class="abs" style="left:-14px;top:-14px;z-index:2">${tile(IDS[i], 44)}</span>`);
    const chip = el(`<div class="abs reply" style="left:14px;bottom:-26px;font-size:${V ? 18 : 18}px;padding:9px 14px 9px 10px;z-index:3;max-width:${cw + 40}px">${glyph("incoming", 15, 1.5)}<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:${cw - 30}px">${REPLIES[i]}</span></div>`);
    wrap.append(card, badge, chip);
    plane.append(wrap);
    return { wrap, card, badge, chip, canvas: card.querySelector("canvas") };
  });

  // the 3D capsule (a billboard standing on the rail)
  const cap3 = el(`<div class="abs" style="left:${OX - 70}px;top:0;width:140px;height:60px;border-radius:30px;background:var(--accent);box-shadow:0 0 0 3px var(--ink);transform-origin:50% 100%"></div>`);
  plane.append(cap3);

  /* ---------- 2D overlays ---------- */
  const MB = macroBox(V);
  const cap2 = el(`<div class="abs" style="left:0;top:0;border-radius:999px;background:var(--accent);z-index:4"></div>`);
  root.append(cap2);
  const hl = kline("Post once.", V ? 220 : 260, { cls: "free" });
  hl.classList.add("abs");
  Object.assign(hl.style, { left: "0", width: `${W}px`, top: `${cy - (V ? 380 : 330)}px`, transformOrigin: `50% 60%`, zIndex: "6" });
  root.append(hl);
  const rf = el(`<div class="abs" style="left:0;width:${W}px;text-align:center;z-index:6;top:${V ? 700 : 250}px;text-shadow:0 0 40px var(--bg),0 0 18px var(--bg),0 0 6px var(--bg)"></div>`);
  rf.append(kline("One post.", V ? 120 : 130));
  rf.append(kline("*Five networks.*", V ? 130 : 140));
  root.append(rf);
  const label = el(`<div class="abs mlabel" style="${V ? `left:0;width:${W}px;text-align:center;bottom:56px` : "left:78px;bottom:36px;padding:8px 12px;border-radius:10px;background:var(--bg)"};color:var(--ink);font-size:${V ? 19 : 17}px;z-index:6">Instagram · Facebook Page · Threads · X · LinkedIn (text)</div>`);
  root.append(label);

  const tD = T.drop;
  const tFly = tD + BEAT; // 12.29
  const tHub = T.hub; // 13.52
  const tCrane = T.crane; // 13.77
  const tPop = tCrane + beat(0.5); // 14.01
  const tRF = tCrane + beat(2); // 14.75
  const tPull = tCrane + beat(3.2); // 15.34
  const tRep = T.replies; // 15.74
  const tDive = T.reply - 0.55;

  // final overhead framing
  const FIN = V ? { y: -593, s: 0.86 } : { y: -377, s: 0.82 };

  function render(t) {
    /* camera on the plane */
    const ride = rideEase(clamp((t - tFly) / (tHub - tFly)));
    const crane = ease.cam(clamp((t - tHub) / (tCrane + BEAT * 1.6 - tHub)));
    const dive = ease.in(clamp((t - tDive) / 0.55));
    let camY = lerp(START - 120, 120, ride);
    camY = lerp(camY, FIN.y, crane);
    camY = lerp(camY, -200, dive);
    // bar 8: a slow push toward the posts while the first replies arrive
    const push = ease.cam(clamp((t - tRep + 0.1) / (tDive - tRep + 0.1)));
    camY = lerp(camY, V ? -900 : -640, push * (1 - dive));
    const A = lerp(lerp(70, 0, crane), 58, dive);
    const S = lerp(lerp(lerp(V ? 1.5 : 1.6, FIN.s, crane), V ? 0.98 : 0.98, push), 2.2, dive);
    world.style.transform = `rotateX(${A.toFixed(3)}deg) scale(${S.toFixed(4)}) translate(0px, ${(-camY).toFixed(2)}px)`;
    set(viewport, { o: p(t, tFly - 0.08, 0.2) });
    fog.style.opacity = (A / 70).toFixed(3);

    /* capsule riding ahead of the camera, standing up */
    const capY = lerp(START - 250, 85, rideEase(clamp((t - tFly) / (tHub - tFly - 0.04))));
    cap3.style.top = `${OY + capY - 60}px`;
    cap3.style.transform = `rotateX(${(-A).toFixed(3)}deg)`;
    set(cap3, { o: t >= tFly && t < tHub + 0.02 ? 1 : 0 });
    // arrival: hub clicks
    const bump = t > tHub ? Math.exp(-(t - tHub) * 9) * Math.sin((t - tHub) * 30) * 0.08 : 0;
    hub.style.transform = `scale(${(1 + bump).toFixed(4)})`;

    /* branches draw during the crane */
    branches.forEach(({ path }, i) => {
      const q = p(t, tCrane - 0.1 + i * 0.05, 0.5, ease.out);
      path.style.strokeDasharray = `${q.toFixed(4)} 2`;
      path.style.visibility = q > 0.002 ? "visible" : "hidden";
    });

    /* posts pop up on sixteenths, then rack focus: text sharp / posts soft → posts sharp */
    cards.forEach((c, i) => {
      const tl = tPop + i * BEAT * 0.25;
      const s = spring(t, tl, { k: 300, c: 20 });
      c.wrap.style.transform = `translateZ(${((1 - s) * 120).toFixed(1)}px) scale(${lerp(0.55, 1, s).toFixed(4)})`;
      c.wrap.style.opacity = t >= tl ? Math.min(1, (t - tl) / 0.05).toFixed(3) : "0";
      setCounts(c.card, p(t, tl + 0.3, 3.4, ease.out));
      if (c.canvas) reel.draw(c.canvas, t - tPop);
      set(c.badge, { s: spring(t, tl + 0.1, { k: 520, c: 24 }) });
      const tc = tRep + i * BEAT * 0.5;
      const cs = spring(t, tc, { k: 420, c: 22 });
      set(c.chip, { y: (1 - cs) * 24, s: lerp(0.6, 1, cs), o: t >= tc ? 1 : 0 });
    });
    focus(plane, t, [[tRF - 0.05, 0], [tRF + 0.25, 7], [tPull, 7], [tPull + 0.4, 0]]);

    /* macro capsule (match cut) springs to size, then drops onto the rail */
    const cs = spring(t, tD, { k: 260, c: 20 });
    const w = lerp(MB.w, 150, cs);
    const h = lerp(MB.h, 64, cs);
    const drop = ease.in(clamp((t - tFly + 0.06) / 0.14));
    cap2.style.width = `${w}px`;
    cap2.style.height = `${h}px`;
    const capRest = V ? 200 : 170; // the capsule settles under the headline
    set(cap2, { x: cx - w / 2, y: cy - h / 2 + capRest * cs - drop * 90, s: 1 - 0.4 * drop, o: t < tFly + 0.1 ? 1 - drop : 0 });

    /* "Post once." slams, then the camera flies through it */
    lettersIn(hl, t, tD, { stagger: 0.03, d: 0.5, mode: "pop" });
    weightPulse(hl, t, tD, { peak: 760, rest: 300, stagger: 0.03, d: 0.6 });
    const through = ease.in(clamp((t - tFly) / 0.32));
    const sl = 1 + 0.22 * (1 - spring(t, tD, { k: 300, c: 22 }));
    hl.style.transform = `scale(${(sl * lerp(1, 9, through)).toFixed(4)})`;
    hl.style.filter = through > 0.02 ? `blur(${(through * 18).toFixed(2)}px)` : "none";
    hl.style.opacity = (1 - p(t, tFly + 0.12, 0.2)).toFixed(3);
    hl.style.visibility = t < tFly + 0.35 ? "visible" : "hidden";

    /* rack-focus line */
    lettersIn(rf, t, tRF, { stagger: 0.018, d: 0.45 });
    focus(rf, t, [[tRF, 0], [tPull, 0], [tPull + 0.4, 14]]);
    set(rf, { o: t >= tRF - 0.02 ? 1 - p(t, tPull + 0.15, 0.3) : 0 });
    set(label, { o: p(t, tPop + 0.4, 0.4) * (1 - p(t, tDive, 0.3)) });
  }

  return { root, render, t0: T.drop - 0.01, t1: T.reply + 0.3, noGrid: true };
}

void keyed;
void pointAt;
void polyline;
void roundel;
