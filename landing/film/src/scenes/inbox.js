/**
 * 28 – 32 s · UNIFIED INBOX + INSIGHTS. Eight channel rows slide in on eighth notes; a 7-day
 * messages chart draws on the beat; by-channel bars grow; a rubber stamp marks the numbers as
 * illustrative (same demo numbers as the landing page's Insights section).
 */
import { ease, lerp, p, set, spring } from "../lib/anim.js";
import { glyph, icon, tile } from "../lib/brand.js";
import { el, headline, revealWords } from "../lib/ui.js";

const ROWS = [
  ["instagram", "linen.lover", "Here's your early-access link!", "automation", "2m"],
  ["messenger", "Rohan Mehta", "We're open 10am–7pm, Monday to Saturday.", "agent", "3m"],
  ["whatsapp", "+91 98•• ••• 210", "Is cash on delivery available?", "team", "3m"],
  ["x", "@meera_k", "is the queen size back too?", "team", "4m"],
  ["linkedin", "Arjun S.", "Do you supply boutique hotels?", "team", "5m"],
  ["gmail", "Kavya R.", "Bulk order: 300 queen sets", "team", "6m"],
  ["threads", "tara.weaves", "It's in the first reply of this thread 🧵", "automation", "7m"],
  ["facebook", "Nikhil P.", "Early access is open. The link is pinned 👆", "automation", "8m"],
];
const DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];
const BY_DAY = [820, 910, 1040, 1288, 760, 540, 990];
const BY_CHANNEL = [
  ["whatsapp", "WhatsApp", 2494],
  ["instagram", "Instagram", 2079],
  ["messenger", "Messenger", 1088],
  ["x", "X", 370],
  ["threads", "Threads", 169],
  ["gmail", "Email", 102],
  ["linkedin", "LinkedIn", 46],
];
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export function buildInbox({ V }) {
  const root = el(`<section class="scene"></section>`);
  const hl = headline(["Every channel,", "*one calm inbox.*"], { size: V ? 84 : 72 });
  hl.classList.add("abs");
  const tag = el(`<div class="abs row mono" style="gap:12px;font-size:${V ? 19 : 16}px;color:var(--ink)">${glyph("team", 14)}<span>Unified inbox · insights</span></div>`);

  /* inbox */
  const lw = V ? 940 : 760;
  const list = el(`<div class="abs card" style="width:${lw}px;overflow:hidden"></div>`);
  const head = el(`<div class="row" style="padding:16px 22px;border-bottom:1px solid var(--line);gap:10px"><span style="font-weight:600;font-size:22px;letter-spacing:-0.02em;margin-right:10px">Inbox</span>${["instagram", "facebook", "messenger", "whatsapp", "threads", "x", "linkedin", "gmail"].map((id) => `<span class="roundel chf" style="width:34px;height:34px;box-shadow:inset 0 0 0 1.5px var(--line)">${icon(id, 17)}</span>`).join("")}<span class="mono" style="margin-left:auto;font-size:13px">8 channels</span></div>`);
  list.append(head);
  const rows = ROWS.slice(0, V ? 5 : 8).map(([id, name, pv, h, tm]) => {
    const r = el(`<div class="inbox-row" style="height:${V ? 84 : 74}px">${tile(id, 38)}<div class="col" style="min-width:0;flex:1;gap:3px"><span class="nm">${name}</span><span class="pv">${pv}</span></div>${glyph(h, 16)}<span class="tm">${tm}</span></div>`);
    list.append(r);
    return r;
  });
  const chips = [...head.querySelectorAll(".chf")];

  /* insights */
  const iw = V ? 940 : 840;
  const ins = el(`<div class="abs card" style="width:${iw}px;padding:24px 28px 26px"></div>`);
  const top = el(`<div class="row" style="align-items:flex-end;gap:18px"><div class="col" style="gap:8px"><span class="mono" style="font-size:14px;color:var(--ink)">Messages · last 7 days</span><span class="display tot" style="font-size:64px;line-height:1;font-variant-numeric:tabular-nums">0</span></div><span class="mono" style="font-size:13px;margin-bottom:8px">All connected channels</span></div>`);
  const tot = top.querySelector(".tot");
  const cw = iw - 56;
  const ch = V ? 220 : 230;
  const max = 1400;
  const pts = BY_DAY.map((v, i) => ({ x: 14 + (i * (cw - 28)) / 6, y: ch - 26 - (v / max) * (ch - 50) }));
  const linePath = pts.map((pt, i) => `${i ? "L" : "M"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join("");
  const smooth = catmull(pts);
  const area = `${smooth}L${pts[6].x} ${ch - 26}L${pts[0].x} ${ch - 26}Z`;
  const chart = el(`<svg width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}" style="display:block;margin-top:18px;overflow:visible">
    <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9CCB7A" stop-opacity=".55"/><stop offset="1" stop-color="#9CCB7A" stop-opacity=".04"/></linearGradient><clipPath id="acl"><rect class="clr" x="0" y="0" width="0" height="${ch}"/></clipPath></defs>
    ${[0, 1, 2, 3].map((k) => `<line x1="0" x2="${cw}" y1="${(ch - 26 - (k * (ch - 50)) / 3).toFixed(1)}" y2="${(ch - 26 - (k * (ch - 50)) / 3).toFixed(1)}" stroke="var(--line)" stroke-width="1"/>`).join("")}
    <path d="${area}" fill="url(#ag)" clip-path="url(#acl)"/>
    <path class="ln" d="${smooth}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
    ${pts.map((pt, i) => `<g class="pt" transform="translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})"><circle r="6" fill="var(--surface)" stroke="var(--accent)" stroke-width="2.5"/></g><text x="${pt.x.toFixed(1)}" y="${ch - 4}" text-anchor="middle" font-family="Geist Mono" font-size="13" fill="var(--ink-soft)" letter-spacing="0.06em">${DAYS[i].toUpperCase()}</text>`).join("")}
  </svg>`);
  void linePath;
  const ln = chart.querySelector(".ln");
  const clr = chart.querySelector(".clr");
  const dots = [...chart.querySelectorAll(".pt")];

  const bars = el(`<div class="col" style="gap:${V ? 12 : 9}px;margin-top:22px"><span class="mono" style="font-size:14px;color:var(--ink);margin-bottom:4px">By channel</span></div>`);
  const bw = cw - 300;
  const barEls = BY_CHANNEL.map(([id, name, v]) => {
    const r = el(`<div class="row" style="gap:12px;height:${V ? 34 : 26}px">${icon(id, 20)}<span style="width:110px;font-size:17px">${name}</span><span style="flex:none;width:${bw}px;height:12px;border-radius:6px;background:var(--bg-alt);position:relative;overflow:hidden"><span class="bar" style="position:absolute;left:0;top:0;bottom:0;width:${((v / 2494) * bw).toFixed(1)}px;background:var(--ink);border-radius:6px;transform-origin:0 50%"></span></span><span class="mono val" style="font-size:14px;color:var(--ink);width:70px;text-align:right">${fmt(v)}</span></div>`);
    bars.append(r);
    return r;
  });
  ins.append(top, chart, bars);
  const stamp = el(`<div class="abs stamp" style="transform-origin:100% 50%"><div>Demo workspace</div><div>· Illustrative numbers ·</div></div>`);
  ins.append(stamp);
  stamp.style.right = "26px";
  stamp.style.top = "22px";

  root.append(hl, tag, list, ins);
  if (V) {
    place(tag, 72, 230);
    place(hl, 72, 280);
    place(list, 70, 500);
    place(ins, 70, 1020);
  } else {
    place(tag, 120, 130);
    place(hl, 120, 170);
    place(list, 120, 330);
    place(ins, 960, 330);
  }

  const T = { in: 28.0, rows: 28.12, chart: 29.0, bars: 30.0, stamp: 31.0 };
  // Each point pops as the line's head reaches it (the line draws with the travel ease).
  const dotT = pts.map((_, i) => {
    const target = Math.max(0.001, i / 6 - 0.01);
    let x = 0;
    while (x < 1 && ease.travel(x) < target) x += 0.002;
    return T.chart + x * 1.25;
  });

  function render(t) {
    const enter = p(t, T.in, 0.6, ease.out);
    const out = p(t, 31.64, 0.34, ease.in);
    set(root, { x: V ? 0 : 120 * (1 - enter), y: -out * 30, o: Math.min(1, enter * 1.4) * (1 - out) });
    revealWords(hl, t, T.in + 0.1, { stagger: 0.05, tOut: 31.5, dOut: 0.26 });
    set(tag, { o: p(t, T.in, 0.4) });
    set(list, { y: (1 - spring(t, T.in, { k: 240, c: 22 })) * 40 });
    set(ins, { y: (1 - spring(t, T.in + 0.15, { k: 240, c: 22 })) * 40 });
    chips.forEach((c, i) => set(c, { s: lerp(0.5, 1, spring(t, T.in + 0.15 + i * 0.04, { k: 500, c: 24 })), o: p(t, T.in + 0.15 + i * 0.04, 0.1, ease.linear) }));
    rows.forEach((r, i) => {
      const s = spring(t, T.rows + i * 0.125, { k: 320, c: 24 });
      set(r, { x: (1 - s) * -60, o: p(t, T.rows + i * 0.125, 0.12, ease.linear) });
    });
    const cq = p(t, T.chart, 1.25, ease.travel);
    ln.style.strokeDasharray = `${cq.toFixed(4)} 2`;
    clr.setAttribute("width", String((cq * cw).toFixed(1)));
    dots.forEach((d, i) => {
      const td = dotT[i];
      const s = spring(t, td, { k: 520, c: 22 });
      d.setAttribute("transform", `translate(${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}) scale(${s.toFixed(3)})`);
    });
    tot.textContent = fmt(6348 * p(t, T.chart, 1.3, ease.out));
    barEls.forEach((r, i) => {
      const bq = p(t, T.bars + i * 0.125, 0.55, ease.out);
      r.querySelector(".bar").style.transform = `scaleX(${bq.toFixed(4)})`;
      set(r, { o: p(t, T.bars - 0.2 + i * 0.06, 0.3) });
      r.querySelector(".val").style.opacity = p(t, T.bars + i * 0.125 + 0.2, 0.3).toFixed(3);
    });
    const ss = spring(t, T.stamp, { k: 520, c: 28 });
    set(stamp, { s: lerp(1.35, 1, ss), r: lerp(-14, -6, ss), o: p(t, T.stamp, 0.08, ease.linear) });
  }

  return { root, render, t0: 27.95, t1: 32.15 };
}

function catmull(pts) {
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function place(n, x, y) {
  n.style.position = "absolute";
  n.style.left = `${x}px`;
  n.style.top = `${y}px`;
}
