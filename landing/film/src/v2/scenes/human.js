/**
 * 29.51 – 33.44 s · "A human when it *matters.*" An apricot triangle wipes in. "can I talk to a
 * real person?" → the hand-off line → pencil ring + Needs attention on the inbox row → a teammate
 * replies from the same pill input bar → replied, done.
 */
import { BEAT, T } from "../timing.js";
import { ease, kline, lerp, lettersIn, p, set, slam, spring, tilt } from "../kit.js";
import { mulberry32 } from "../../lib/anim.js";
import { glyph, tile } from "../../lib/brand.js";
import { ringPath } from "../../lib/geometry.js";
import { $, el, msgIn, msgOut, popMsg, threadCard, typeSchedule, typed } from "../../lib/ui.js";

const REPLY = "Hi! I'm here. What can I help with?";

export function buildHuman({ W, H, V }) {
  const root = el(`<section class="scene"></section>`);
  const size = V ? 132 : 126;
  const l1 = kline("A human when", size);
  const l2 = kline("it *matters.*", size * 1.12);
  const lab = el(`<div class="abs mlabel row" style="gap:12px;color:var(--ink)">${glyph("attention", 16)}<span>Hand-off · needs attention</span></div>`);
  const foot = el(`<div class="abs mlabel">Flagged for your team, with what was asked</div>`);
  for (const n of [l1, l2]) n.classList.add("abs");
  root.append(l1, l2, lab, foot);

  const rw = V ? 940 : 800;
  const rowCard = el(`<div class="abs card" style="width:${rw}px;overflow:visible"></div>`);
  const row = el(`<div class="inbox-row" style="height:${V ? 104 : 96}px;border-bottom:none;gap:18px;padding:0 24px">${tile("instagram", V ? 52 : 48)}<div class="col" style="min-width:0;flex:1;gap:4px"><span class="nm" style="font-size:${V ? 25 : 22}px">aanya.makes</span><span class="pv" style="font-size:${V ? 21 : 19}px">can I talk to a real person?</span></div><span class="badge att flag" style="height:40px;font-size:15px">${glyph("attention", 13)}Needs attention</span><span class="badge ok fixed" style="height:40px;font-size:15px;position:absolute;right:24px">${glyph("team", 13)}Replied · done</span></div>`);
  rowCard.append(row);
  const rh = V ? 104 : 96;
  const ringW = rw + 28;
  const ringH = rh + 26;
  const ring = el(`<svg class="abs" width="${ringW}" height="${ringH}" viewBox="0 0 ${ringW} ${ringH}" style="left:-14px;top:-13px;overflow:visible;pointer-events:none"><path d="${ringPath(mulberry32(5 * 7919 + 17), ringW, ringH, 0.42, 200)}" fill="none" stroke="var(--pop1-deep)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg>`);
  rowCard.append(ring);
  root.append(rowCard);
  const flag = $(row, ".flag");
  const fixed = $(row, ".fixed");
  const ringP = ring.firstElementChild;

  const th = threadCard("instagram", "aanya.makes", "Instagram DM", { w: rw, h: V ? 980 : 690 });
  th.style.position = "absolute";
  const body = $(th, ".th-body");
  body.style.paddingBottom = "120px";
  const m1 = msgIn("can I talk to a real person?");
  const m2 = msgOut("We'll connect someone from our team to help you out.", "agent");
  const n2 = el(`<div class="note-m" style="align-self:flex-end">↳ asked for a person · handed off</div>`);
  const div = el(`<div class="row" style="gap:12px;margin:4px 0"><span style="flex:1;height:1.5px;background:var(--pop1)"></span><span class="note-m" style="color:#9a5c40">${glyph("attention", 12)}Needs attention · your team</span><span style="flex:1;height:1.5px;background:var(--pop1)"></span></div>`);
  const m3 = msgOut(REPLY, "team", { via: "Priya" });
  body.append(m1, m2, n2, div, m3);
  const barEl = el(`<div class="composer" style="position:absolute;left:22px;right:22px;bottom:22px;height:${V ? 92 : 80}px;box-shadow:none;border-color:var(--line-strong)"><div class="row" style="flex:1;gap:14px;padding:0 10px 0 24px;font-size:${V ? 28 : 24}px;font-weight:300;letter-spacing:-0.01em"><span class="tx"></span><span class="caret" style="height:32px"></span><span class="ph soft" style="position:absolute;left:24px">Reply as Northwind Studio…</span><span class="btn snd" style="margin-left:auto;height:${V ? 70 : 60}px;padding:0 28px;font-size:22px">Send</span></div></div>`);
  th.append(barEl);
  root.append(th);
  const btx = $(barEl, ".tx");
  const caret = $(barEl, ".caret");
  const ph = $(barEl, ".ph");
  const snd = $(barEl, ".snd");
  const sched = typeSchedule(REPLY, 0.75, 9);

  if (V) {
    Object.assign(l1.style, { left: "0", width: `${W}px`, top: "200px" });
    Object.assign(l2.style, { left: "0", width: `${W}px`, top: "350px" });
    Object.assign(lab.style, { left: "70px", top: "560px" });
    foot.style.display = "none";
    Object.assign(rowCard.style, { left: "70px", top: "620px" });
    Object.assign(th.style, { left: "70px", top: "770px" });
  } else {
    Object.assign(l1.style, { left: "100px", top: "330px", textAlign: "left" });
    Object.assign(l2.style, { left: "100px", top: "482px", textAlign: "left" });
    Object.assign(lab.style, { left: "104px", top: "250px" });
    Object.assign(foot.style, { left: "104px", top: "700px" });
    Object.assign(rowCard.style, { left: "1050px", top: "130px" });
    Object.assign(th.style, { left: "1050px", top: "290px" });
  }

  const t0 = T.human;
  const b = (k) => t0 + k * BEAT;

  function render(t) {
    lettersIn(l1, t, t0 + 0.02, { stagger: 0.02, d: 0.45, tOut: T.numbers - 0.34, dOut: 0.2 });
    lettersIn(l2, t, b(1), { stagger: 0.026, d: 0.5, tOut: T.numbers - 0.3, dOut: 0.2 });
    set(lab, { o: p(t, t0 + 0.1, 0.3) });
    set(foot, { o: p(t, b(3), 0.4) * 0.9 });

    const push = p(t, b(4), 3.2, ease.cam);
    const rs = spring(t, t0 + 0.05, { k: 240, c: 21 });
    rowCard.style.transform = tilt({ y: (1 - rs) * -80, rx: -20 * (1 - rs), s: lerp(1, 1.03, push) });
    const ts = spring(t, t0 + 0.12, { k: 220, c: 21 });
    th.style.transform = tilt({ y: (1 - ts) * 140, rx: 16 * (1 - ts), ry: V ? 0 : -6 * (1 - ts), s: lerp(1, 1.03, push) });

    popMsg(m1, t, b(0.5));
    popMsg(m2, t, b(1.5), { side: "out" });
    set(n2, { o: p(t, b(2), 0.25) });
    const rq = p(t, b(2.5), 0.5, ease.travel);
    ringP.style.strokeDasharray = `${rq.toFixed(4)} 2`;
    ringP.style.visibility = rq > 0.002 ? "visible" : "hidden";
    ringP.style.opacity = (1 - p(t, b(6.5), 0.3)).toFixed(3);
    const fs = slam(flag, t, b(3), { from: 1.6, k: 520, c: 24 });
    set(flag, { s: lerp(1.6, 1, fs) * (1 - p(t, b(6.5), 0.15, ease.in)), o: t >= b(3) && t < b(6.65) ? 1 : 0 });
    const ds = spring(t, b(6.5), { k: 520, c: 24 });
    set(fixed, { s: lerp(0.6, 1, ds), o: t >= b(6.5) ? 1 : 0 });
    set(div, { o: p(t, b(3), 0.3) });

    btx.textContent = typed(sched, t, b(3.6));
    ph.style.opacity = t < b(3.5) || t >= b(5.6) ? "1" : "0";
    if (t >= b(5.6)) btx.textContent = "";
    caret.style.opacity = t >= b(3.4) && t < b(5.5) ? "1" : "0";
    const press = p(t, b(5.5) - 0.06, 0.06) * (1 - p(t, b(5.5) + 0.03, 0.12));
    set(snd, { s: 1 - 0.08 * press });
    popMsg(m3, t, b(5.75), { side: "out" });
  }

  return { root, render, t0: T.human - 0.3, t1: T.numbers + 0.3 };
}
