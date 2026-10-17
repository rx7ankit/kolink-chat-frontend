/**
 * 21.64 – 25.57 s · "Comment LINK. *Get the DM.*" (Instagram only.) A periwinkle diamond wipes in
 * from the inbox's automation glyph. A comment matches the keyword, the diamond rides to the DM:
 * public reply → DM with a button → tap → follow check → link delivered.
 */
import { BEAT, T } from "../timing.js";
import { ease, kline, lerp, lettersIn, p, set, slam, spring, tilt, whipBlur, whipOut } from "../kit.js";
import { glyph } from "../../lib/brand.js";
import { pointAt, polyline } from "../../lib/geometry.js";
import { $, el, msgIn, msgOut, popMsg, threadCard } from "../../lib/ui.js";

export function buildLink({ W, H, V }) {
  const root = el(`<section class="scene"></section>`);
  const l1 = kline(V ? "Comment LINK." : "Comment", V ? 140 : 160);
  const l1b = kline("LINK.", 160);
  const l2 = kline("*Get the DM.*", V ? 160 : 172);
  const lab = el(`<div class="abs mlabel row" style="gap:12px;color:var(--ink)">${glyph("automation", 16)}<span>Instagram · Comment → DM</span></div>`);
  const foot = el(`<div class="abs mlabel">Facebook &amp; Threads get keyword replies</div>`);
  for (const n of [l1, l1b, l2]) n.classList.add("abs");
  root.append(l1, l1b, l2, lab, foot);
  if (V) l1b.style.display = "none";

  /* comment card */
  const cw = V ? 940 : 400;
  const post = el(`<div class="abs card post" style="width:${cw}px">
    <div class="hd"><span class="avatar" style="width:40px;height:40px;font-size:22px">N</span><div class="col"><span class="nm">northwind.studio</span><span class="meta">Instagram · Reel</span></div></div>
    <div style="position:relative"><img src="/media/reel-linen-poster.webp" style="width:${cw}px;height:${V ? 210 : 220}px;object-fit:cover;object-position:50% 62%" alt=""></div>
    <div class="col" style="padding:16px 18px 20px;gap:14px;font-size:${V ? 25 : 20}px">
      <div class="row cmt" style="gap:12px;align-items:flex-start"><span class="avatar cust" style="width:36px;height:36px;font-size:15px">L</span><div><b style="font-weight:600">linen.lover</b> <span style="position:relative;padding:0 3px"><span class="hlb" style="position:absolute;left:0;right:0;bottom:2px;height:0.62em;background:var(--pop3);border-radius:3px;transform-origin:0 50%"></span><span style="position:relative">link</span></span> pls 🙏</div></div>
      <div class="row rep" style="gap:12px;align-items:flex-start;margin-left:48px;font-size:${V ? 22 : 18}px"><span class="avatar" style="width:30px;height:30px;font-size:17px">N</span><div>Thanks for commenting! Just sent you a DM 📩</div></div>
    </div>
  </div>`);
  root.append(post);
  const cmt = $(post, ".cmt");
  const rep = $(post, ".rep");
  const hlb = $(post, ".hlb");

  /* DM */
  const dw = V ? 940 : 430;
  const dh = V ? 690 : 880;
  const dm = threadCard("instagram", "linen.lover", "Instagram DM", { w: dw, h: dh });
  dm.style.position = "absolute";
  const body = $(dm, ".th-body");
  body.style.gap = "14px";
  const m1 = msgOut("Thanks for commenting! Tap below and I'll send it over 👇", "automation", { buttons: ["Send me the link"] });
  const m2 = msgIn("Send me the link", { who: "Tapped" });
  const n1 = el(`<div class="note-m" style="align-self:center">↳ follow check · follows ✓</div>`);
  const m3 = msgOut("Here's your early-access link!", "automation", { buttons: [`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Open link`] });
  const done = el(`<div class="badge ok" style="align-self:flex-end;height:44px;font-size:16px;padding:0 18px 0 14px">${glyph("automation", 14)}Delivered ✓</div>`);
  body.append(m1, m2, n1, m3, done);
  root.append(dm);
  const btn = $(m1, ".qbtn");

  /* layout */
  if (V) {
    Object.assign(l1.style, { left: "0", width: `${W}px`, top: "190px" });
    Object.assign(l2.style, { left: "0", width: `${W}px`, top: "340px" });
    Object.assign(lab.style, { left: "70px", top: "555px" });
    foot.style.display = "none";
    Object.assign(post.style, { left: "70px", top: "610px" });
    Object.assign(dm.style, { left: "70px", top: "1150px" });
  } else {
    Object.assign(l1.style, { left: "100px", top: "230px", textAlign: "left" });
    Object.assign(l1b.style, { left: "100px", top: "392px", textAlign: "left" });
    Object.assign(l2.style, { left: "100px", top: "566px", textAlign: "left" });
    Object.assign(lab.style, { left: "104px", top: "170px" });
    Object.assign(foot.style, { left: "104px", top: "800px" });
    Object.assign(post.style, { left: "990px", top: "130px" });
    Object.assign(dm.style, { left: "1430px", top: "100px" });
  }
  for (const n of [post, dm]) n.style.transformOrigin = "50% 50%";

  /* the diamond's line: comment → DM */
  const pts = V
    ? [{ x: 250, y: 1030 }, { x: 250, y: 1100 }, { x: 290, y: 1140 }, { x: 900, y: 1140 }]
    : [{ x: 1190, y: 566 }, { x: 1190, y: 780 }, { x: 1230, y: 820 }, { x: 1430, y: 820 }];
  const route = polyline(pts, 18);
  const svg = el(`<svg class="abs" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="left:0;top:0;overflow:visible;z-index:5"><path d="${route.d}" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" pathLength="1"/></svg>`);
  root.append(svg);
  const line = svg.firstElementChild;
  const dia = el(`<div class="abs" style="left:-19px;top:-19px;z-index:6">${glyph("automation", 34, 2.2)}</div>`);
  root.append(dia);

  const t0 = T.link;
  const b = (k) => t0 + k * BEAT;

  function render(t) {
    lettersIn(l1, t, t0 + 0.02, { stagger: 0.02, d: 0.45 });
    lettersIn(l1b, t, t0 + 0.02 + BEAT * 0.5, { stagger: 0.03, d: 0.45 });
    lettersIn(l2, t, b(2), { stagger: 0.026, d: 0.5 });
    set(lab, { o: p(t, t0 + 0.1, 0.3) });
    set(foot, { o: p(t, b(4), 0.4) * 0.9 });

    const push = p(t, b(5.5), 2.2, ease.cam);
    // cards arrive tilted, settle, then a slow push toward the DM
    const ps = spring(t, t0 + 0.05, { k: 220, c: 20 });
    post.style.transform = tilt({ y: (1 - ps) * 120, rx: 18 * (1 - ps), ry: V ? 0 : -10 + 4 * ps, s: lerp(0.9, 1, ps) * lerp(1, 1.04, push) });
    const ds = spring(t, t0 + 0.14, { k: 220, c: 20 });
    dm.style.transform = tilt({ y: (1 - ds) * 160 - (V ? 30 : 0) * push, rx: 14 * (1 - ds), ry: V ? 0 : -14 + 6 * ds + 4 * push, s: lerp(0.9, 1, ds) * lerp(1, V ? 1.03 : 1.06, push), x: V ? 0 : -30 * push });
    // whip pan out to the agent
    root.style.transform = `translate(${whipOut(t, T.agent, W).toFixed(1)}px, 0)`;
    whipBlur(root, t, T.agent, W);

    popMsg(cmt, t, b(0.5));
    hlb.style.transform = `scaleX(${p(t, b(1), 0.25, ease.out).toFixed(3)})`;
    popMsg(rep, t, b(1.5));
    const lq = p(t, b(1), 0.3, ease.out);
    line.style.strokeDasharray = `${lq.toFixed(4)} 2`;
    line.style.visibility = lq > 0.002 ? "visible" : "hidden";
    const ride = p(t, b(1.2), 0.5, ease.travel);
    const q = pointAt(route, ride);
    const dsp = spring(t, b(1), { k: 520, c: 24 });
    set(dia, { x: q.x, y: q.y, s: dsp * (1 - p(t, b(2.1), 0.12)), o: t >= b(1) && t < b(2.25) ? 1 : 0 });

    popMsg(m1, t, b(2), { side: "out" });
    const press = p(t, b(3) - 0.06, 0.06) * (1 - p(t, b(3) + 0.03, 0.12));
    set(btn, { s: 1 - 0.08 * press });
    btn.style.background = t >= b(3) ? "var(--bg-alt)" : "var(--surface)";
    popMsg(m2, t, b(3.5));
    set(n1, { o: p(t, b(4), 0.25) });
    popMsg(m3, t, b(4.5), { side: "out" });
    slam(done, t, b(5.5), { from: 1.5, k: 520, c: 24 });
  }

  return { root, render, t0: T.link - 0.3, t1: T.agent + 0.2 };
}
