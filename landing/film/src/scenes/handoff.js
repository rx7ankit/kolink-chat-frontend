/**
 * 24 – 28 s · HAND-OFF. "can I talk to a real person?" → the agent's hand-off line → an apricot
 * pencil ring and a Needs attention badge on the inbox row → a teammate replies from the same
 * pill input bar, and the thread is marked done.
 */
import { ease, lerp, mulberry32, p, set, spring } from "../lib/anim.js";
import { glyph, tile } from "../lib/brand.js";
import { ringPath } from "../lib/geometry.js";
import { $, el, headline, msgIn, msgOut, popMsg, revealWords, threadCard, typeSchedule, typed } from "../lib/ui.js";

export const ROWS = [
  ["instagram", "aanya.makes", "can I talk to a real person?", "agent", "now"],
  ["messenger", "Rohan Mehta", "We're open 10am–7pm, Monday to Saturday.", "agent", "1m"],
  ["instagram", "linen.lover", "Here's your early-access link!", "automation", "2m"],
  ["whatsapp", "+91 98•• ••• 210", "Is cash on delivery available?", "team", "3m"],
  ["gmail", "Kavya R.", "Bulk order: 300 queen sets", "team", "5m"],
  ["x", "@meera_k", "is the queen size back too?", "team", "6m"],
];
const REPLY = "Hi! I'm here. What can I help with?";

export function buildHandoff({ V }) {
  const root = el(`<section class="scene"></section>`);
  const hl = headline(["When it needs a person,", "*your team takes over.*"], { size: V ? 80 : 72 });
  hl.classList.add("abs");
  const tag = el(`<div class="abs row mono" style="gap:12px;font-size:${V ? 19 : 16}px;color:var(--ink)">${glyph("attention", 16)}<span>Hand-off · needs attention</span></div>`);

  /* inbox list */
  const lw = V ? 940 : 640;
  const list = el(`<div class="abs card" style="width:${lw}px;overflow:visible"><div class="row" style="padding:18px 22px;border-bottom:1px solid var(--line);gap:12px"><span style="font-weight:600;font-size:22px;letter-spacing:-0.02em">Inbox</span><span class="mono" style="font-size:13px">All channels</span><span class="badge att cnt" style="margin-left:auto">${glyph("attention", 12)}Needs attention · <span class="n">0</span></span></div></div>`);
  const rows = ROWS.slice(0, V ? 4 : 6).map(([id, name, pv, h, tm], i) => {
    const r = el(`<div class="inbox-row" style="${i === 0 ? "z-index:2" : ""}">${tile(id, 40)}<div class="col" style="min-width:0;flex:1;gap:3px"><span class="nm">${name}</span><span class="pv">${pv}</span></div><span class="hg">${glyph(h, 16)}</span><span class="tm">${tm}</span></div>`);
    list.append(r);
    return r;
  });
  const row0 = rows[0];
  const rnd = mulberry32(5 * 7919 + 17);
  const rw = lw + 16;
  const rh = 76 + 14;
  const ring = el(`<svg class="abs" width="${rw}" height="${rh}" viewBox="0 0 ${rw} ${rh}" style="left:-8px;top:-7px;overflow:visible;pointer-events:none"><path d="${ringPath(rnd, rw, rh, 0.42, 200)}" fill="none" stroke="var(--pop1-deep)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg>`);
  row0.append(ring);
  const ringPathEl = ring.querySelector("path");
  const rowBadge = el(`<span class="badge att" style="position:absolute;right:86px;top:21px">${glyph("attention", 12)}Needs attention</span>`);
  row0.append(rowBadge);
  const hg0 = $(row0, ".hg");

  /* thread */
  const tw = V ? 940 : 900;
  const th = V ? 720 : 640;
  const thread = threadCard("instagram", "aanya.makes", "Instagram DM", { w: tw, h: th });
  const hd = $(thread, ".th-hd");
  const hdBadge = el(`<span class="badge att" style="margin-left:auto">${glyph("attention", 12)}Needs attention</span>`);
  const hdDone = el(`<span class="badge ok" style="margin-left:auto;position:absolute;right:22px">${glyph("team", 12)}Replied · done</span>`);
  hd.style.position = "relative";
  hd.append(hdBadge, hdDone);
  const body = $(thread, ".th-body");
  const m1 = msgIn("can I talk to a real person?");
  const m2 = msgOut("We'll connect someone from our team to help you out.", "agent");
  const n2 = el(`<div class="note-m" style="align-self:flex-end">↳ asked for a person · handed off, no model call</div>`);
  const div = el(`<div class="row" style="gap:12px;margin:6px 0"><span style="flex:1;height:1px;background:var(--pop1)"></span><span class="note-m" style="color:#9a5c40">${glyph("attention", 12)}Needs attention · assigned to your team</span><span style="flex:1;height:1px;background:var(--pop1)"></span></div>`);
  const m3 = msgOut(REPLY, "team", { via: "Priya" });
  body.append(m1, m2, n2, div, m3);
  // The same pill input bar as the opening shot.
  const bar = el(`<div class="composer" style="position:absolute;left:22px;right:22px;bottom:22px;height:76px;box-shadow:none;border-color:var(--line-strong)"><div class="row" style="flex:1;gap:14px;padding:0 10px 0 22px;font-size:22px;font-weight:300;letter-spacing:-0.01em"><span class="tx"></span><span class="caret" style="height:28px"></span><span class="ph soft" style="position:absolute;left:22px">Reply as Northwind Studio…</span><span class="btn" style="margin-left:auto;height:56px;padding:0 24px;font-size:20px">Send</span></div></div>`);
  thread.querySelector(".th-body").style.paddingBottom = "120px";
  thread.append(bar);
  const btx = $(bar, ".tx");
  const bcaret = $(bar, ".caret");
  const bph = $(bar, ".ph");
  const bsend = $(bar, ".btn");
  const sched = typeSchedule(REPLY, 0.95, 3);

  root.append(hl, tag, list, thread);
  if (V) {
    place(tag, 72, 230);
    place(hl, 72, 280);
    place(list, 70, 500);
    place(thread, 70, 910);
  } else {
    place(tag, 120, 130);
    place(hl, 120, 170);
    place(list, 120, 340);
    place(thread, 900, 330);
  }

  const T = { in: 24.0, m1: 24.25, m2: 24.75, n2: 25.0, ring: 25.25, badge: 25.5, div: 25.5, type: 26.0, send: 27.0, m3: 27.1, done: 27.5 };

  function render(t) {
    const enter = p(t, T.in, 0.6, ease.out);
    const out = p(t, 27.76, 0.22, ease.in);
    set(root, { x: V ? 0 : 120 * (1 - enter) - 140 * out, o: Math.min(1, enter * 1.4) * (1 - out) });
    revealWords(hl, t, T.in + 0.1, { stagger: 0.045, tOut: 27.64, dOut: 0.24 });
    set(tag, { o: p(t, T.in, 0.4) });
    set(list, { y: (1 - spring(t, T.in, { k: 240, c: 22 })) * 40 });
    set(thread, { y: (1 - spring(t, T.in + 0.1, { k: 240, c: 22 })) * 40 });
    rows.forEach((r, i) => set(r, { o: p(t, T.in + 0.1 + i * 0.05, 0.3), x: (1 - p(t, T.in + 0.1 + i * 0.05, 0.4)) * -14 }));
    popMsg(m1, t, T.m1);
    popMsg(m2, t, T.m2, { side: "out" });
    set(n2, { o: p(t, T.n2, 0.3) });
    // Pencil ring draws around the row, then lifts once the team has replied.
    const rq = p(t, T.ring, 0.6, ease.travel);
    ringPathEl.style.strokeDasharray = `${rq.toFixed(4)} 2`;
    ring.style.opacity = (1 - p(t, T.done + 0.1, 0.35)).toFixed(3);
    const bs = spring(t, T.badge, { k: 520, c: 26 });
    const done = t >= T.done;
    set(rowBadge, { s: lerp(0.6, 1, bs) * (1 - p(t, T.done, 0.2, ease.in)), o: p(t, T.badge, 0.1, ease.linear) * (1 - p(t, T.done, 0.2)) });
    set(hdBadge, { s: lerp(0.6, 1, bs), o: p(t, T.badge, 0.1, ease.linear) * (1 - p(t, T.done, 0.2)) });
    set(hdDone, { s: lerp(0.7, 1, spring(t, T.done + 0.05, { k: 520, c: 26 })), o: p(t, T.done + 0.05, 0.12, ease.linear) });
    hg0.innerHTML = glyph(done ? "team" : "agent", 16);
    hg0.style.opacity = t >= T.badge - 0.05 && t < T.done + 0.1 ? "0" : "1";
    $(list, ".cnt .n").textContent = t >= T.badge && !done ? "1" : "0";
    set($(list, ".cnt"), { o: p(t, T.badge, 0.15) * (1 - p(t, T.done, 0.25)) });
    set(div, { o: p(t, T.div, 0.3) });
    // Teammate types in the bar and sends.
    btx.textContent = typed(sched, t, T.type);
    bph.style.opacity = t < T.type - 0.1 ? "1" : "0";
    const blink = (t % 0.5) / 0.5 < 0.55;
    bcaret.style.opacity = t >= T.type - 0.5 && t < T.send && (blink || (t > T.type && t < T.type + 1)) ? "1" : "0";
    if (t >= T.send + 0.05) btx.textContent = "";
    if (t >= T.send + 0.05) bph.style.opacity = "1";
    const press = p(t, T.send - 0.1, 0.08) * (1 - p(t, T.send, 0.1));
    set(bsend, { s: 1 - 0.08 * press });
    set(bar, { y: (1 - p(t, 25.7, 0.5)) * 30, o: p(t, 25.7, 0.3) });
    popMsg(m3, t, T.m3, { side: "out" });
  }

  return { root, render, t0: 23.95, t1: 28.3 };
}

function place(n, x, y) {
  n.style.position = "absolute";
  n.style.left = `${x}px`;
  n.style.top = `${y}px`;
}
