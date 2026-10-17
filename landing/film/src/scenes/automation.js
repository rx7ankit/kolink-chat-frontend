/**
 * 17 – 20 s · AUTOMATION (Instagram only). A comment "link pls" on the Reel matches the keyword,
 * a periwinkle diamond rides the automation line stop by stop: public reply → DM with a button →
 * tap → follow check → link delivered.
 */
import { ease, lerp, p, set, spring } from "../lib/anim.js";
import { glyph } from "../lib/brand.js";
import { pointAt, polyline } from "../lib/geometry.js";
import { $, el, headline, msgIn, msgOut, popMsg, revealWords, threadCard } from "../lib/ui.js";

const STOPS = [
  ["Keyword matched", "“link” → LINK"],
  ["Public reply", "under the comment"],
  ["DM + button", "Send me the link"],
  ["Follow check", "follows ✓"],
  ["Link delivered", "early access"],
];

export function buildAutomation({ V, W, H }) {
  const root = el(`<section class="scene"></section>`);
  const hl = headline(["Comment LINK.", "*Get the link in DMs.*"], { size: V ? 84 : 72 });
  hl.classList.add("abs");
  const tag = el(`<div class="abs row mono" style="gap:12px;font-size:${V ? 19 : 16}px;color:var(--ink)">${glyph("automation", 16)}<span>Automation · Instagram</span></div>`);

  /* Instagram post with its comments */
  const pw = V ? 940 : 500;
  const post = el(`<div class="abs card post" style="width:${pw}px">
    <div class="hd"><span class="avatar" style="width:40px;height:40px;font-size:22px">N</span><div class="col"><span class="nm">northwind.studio</span><span class="meta">Instagram · Reel</span></div></div>
    <div style="position:relative"><img src="/media/reel-linen-poster.webp" style="width:${pw}px;height:${V ? 220 : 300}px;object-fit:cover;object-position:50% 62%" alt=""><span style="position:absolute;left:14px;top:12px;color:#fff;font-weight:600;font-size:18px;text-shadow:0 1px 8px rgba(0,0,0,.3)">Reels</span><span style="position:absolute;right:14px;bottom:12px;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.35)"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="#fff"/></svg></span></div>
    <div class="col" style="padding:16px 18px 20px;gap:14px;font-size:${V ? 24 : 19}px">
      <div class="row cmt" style="gap:12px;align-items:flex-start"><span class="avatar cust" style="width:36px;height:36px;font-size:15px">L</span><div><b style="font-weight:600">linen.lover</b> <span class="kw" style="position:relative;padding:0 3px"><span class="hlb" style="position:absolute;left:0;right:0;bottom:2px;height:0.62em;background:var(--pop3);opacity:.75;border-radius:3px;transform-origin:0 50%"></span><span style="position:relative">link</span></span> pls 🙏</div></div>
      <div class="row rep" style="gap:12px;align-items:flex-start;margin-left:48px"><span class="avatar" style="width:32px;height:32px;font-size:18px">N</span><div><b style="font-weight:600">northwind.studio</b> Thanks for commenting! Just sent you a DM 📩<div class="note-m" style="margin-top:6px">${glyph("automation", 12)}Public reply · automation</div></div></div>
    </div>
  </div>`);
  const cmt = $(post, ".cmt");
  const rep = $(post, ".rep");
  const hlb = $(post, ".hlb");

  /* the automation line with five stops */
  const lx = V ? 0 : 720;
  const ly0 = V ? 0 : 360;
  const gap = V ? 0 : 150;
  const svg = el(`<svg class="abs" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="left:0;top:0;overflow:visible"></svg>`);
  const stopPts = STOPS.map((_, i) => (V ? { x: 100 + i * 205, y: 1000 } : { x: lx, y: ly0 + i * gap }));
  const route = polyline(stopPts, 10);
  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", route.d);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "var(--ink)");
  line.setAttribute("stroke-width", "2.5");
  line.setAttribute("pathLength", "1");
  svg.append(line);
  const stops = STOPS.map(([a, b], i) => {
    const n = el(`<div class="abs row" style="left:${stopPts[i].x - 15}px;top:${stopPts[i].y - 15}px;gap:22px;align-items:flex-start;${V ? "flex-direction:column;gap:12px" : ""}"><span class="dot" style="width:30px;height:30px;border-radius:50%;background:var(--surface);box-shadow:inset 0 0 0 2.5px var(--ink);flex:none"></span><div class="col" style="gap:5px;margin-top:-1px"><span class="mono" style="font-size:${V ? 15 : 15}px;color:var(--ink);line-height:1.2">${a}</span><span style="font-size:${V ? 18 : 21}px;font-weight:300;letter-spacing:-0.02em;color:var(--ink-soft);white-space:nowrap">${b}</span></div></div>`);
    return n;
  });
  const diamond = el(`<div class="abs" style="left:-17px;top:-17px">${glyph("automation", 30, 2)}</div>`);

  /* the DM thread */
  const tw = V ? 940 : 620;
  const th = V ? 560 : 560;
  const thread = threadCard("instagram", "linen.lover", "Instagram DM", { w: tw, h: th });
  const body = $(thread, ".th-body");
  const m1 = msgOut("Thanks for commenting! Tap below and I'll send it over 👇", "automation", { buttons: ["Send me the link"] });
  const m2 = msgIn("Send me the link", { who: "Tapped" });
  const n1 = el(`<div class="note-m" style="align-self:center">↳ follow check · follows ✓</div>`);
  const m3 = msgOut("Here's your early-access link!", "automation", { buttons: [`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Open link`], status: `<span style="color:var(--accent)">Delivered ✓</span>` });
  body.append(m1, m2, n1, m3);
  const btn1 = $(m1, ".qbtn");
  const st3 = $(m3, ".st");

  const foot = el(`<div class="abs mono" style="font-size:${V ? 16 : 14}px">Comment → DM runs on Instagram · Facebook &amp; Threads get keyword replies</div>`);

  root.append(hl, tag, post, svg, ...stops, diamond, thread, foot);
  if (V) {
    place(tag, 72, 230);
    place(hl, 72, 280);
    place(post, 70, 500);
    place(thread, 70, 1130);
    foot.style.display = "none";
  } else {
    place(tag, 120, 130);
    place(hl, 120, 170);
    place(post, 120, 340);
    place(thread, 1180, 330);
    place(foot, 120, 1032);
  }

  // Beat plan.
  const T = { in: 17.0, hl: 17.25, s0: 17.5, s1: 17.75, s2: 18.25, tap: 18.62, s3: 18.75, s4: 19.25 };
  const stopT = [T.s0, T.s1, T.s2, T.s3, T.s4];

  function render(t) {
    const enter = p(t, T.in, 0.6, ease.out);
    const out = p(t, 19.76, 0.22, ease.in);
    set(root, { x: V ? 0 : 120 * (1 - enter) - 140 * out, o: Math.min(1, enter * 1.4) * (1 - out) });
    revealWords(hl, t, T.in + 0.1, { stagger: 0.05, tOut: 19.64, dOut: 0.24 });
    set(tag, { o: p(t, T.in, 0.4) });
    set(post, { y: (1 - spring(t, T.in, { k: 240, c: 22 })) * 40 });
    set(thread, { y: (1 - spring(t, T.in + 0.12, { k: 240, c: 22 })) * 40 });
    // Comment arrives, keyword highlights.
    popMsg(cmt, t, T.in + 0.25);
    hlb.style.transform = `scaleX(${p(t, T.s0 - 0.05, 0.3, ease.out).toFixed(3)})`;
    popMsg(rep, t, T.s1);
    // Line draws; diamond hops stop to stop on the beat grid.
    line.style.strokeDasharray = `${p(t, T.in + 0.1, 0.5).toFixed(4)} 2`;
    let u = 0;
    stopT.forEach((ts, i) => {
      if (i === 0) return;
      u += p(t, ts - 0.22, 0.22, ease.travel) / (STOPS.length - 1);
    });
    const q = pointAt(route, u);
    const ds = spring(t, T.s0 - 0.1, { k: 420, c: 24 });
    set(diamond, { x: q.x, y: q.y, s: ds, o: t >= T.s0 - 0.1 ? 1 : 0 });
    stops.forEach((n, i) => {
      set(n, { o: p(t, T.in + 0.15 + i * 0.05, 0.3), x: (1 - p(t, T.in + 0.15 + i * 0.05, 0.4)) * 10 });
      const lit = t >= stopT[i];
      const dot = n.querySelector(".dot");
      dot.style.background = lit ? "var(--pop3)" : "var(--surface)";
      set(dot, { s: lit ? 1 + 0.25 * Math.max(0, 1 - (t - stopT[i]) / 0.25) : 1 });
      n.querySelector(".mono").style.color = lit ? "var(--ink)" : "var(--ink-soft)";
    });
    // DM thread.
    popMsg(m1, t, T.s2, { side: "out" });
    const press = p(t, T.tap - 0.08, 0.08) * (1 - p(t, T.tap + 0.02, 0.12));
    set(btn1, { s: 1 - 0.07 * press });
    btn1.style.background = t >= T.tap ? "var(--bg-alt)" : "var(--surface)";
    popMsg(m2, t, T.s3 - 0.08);
    set(n1, { o: p(t, T.s3 + 0.1, 0.3) });
    popMsg(m3, t, T.s4, { side: "out" });
    set(st3, { o: p(t, T.s4 + 0.3, 0.25), x: (1 - p(t, T.s4 + 0.3, 0.3)) * 8 });
    set(foot, { o: p(t, 18.2, 0.5) * 0.9 });
  }

  return { root, render, t0: 16.95, t1: 20.3 };
}

function place(n, x, y) {
  n.style.position = "absolute";
  n.style.left = `${x}px`;
  n.style.top = `${y}px`;
}
