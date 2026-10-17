/**
 * 21.64 – 25.57 s · "Comment LINK. Get the DM." (Instagram only.)
 *  EXPLODED UI: the Instagram post separates into floating layers — header, Reel, the comment, the
 *  automation's public reply — with callouts, while the keyword is matched; then it snaps back.
 *  CURSOR: the DM arrives; a cursor taps "Send me the link" (ripple); follow check; link delivered.
 *  MACRO: the camera pushes into "Delivered ✓", then whip-pans away.
 */
import { BEAT, T } from "../timing.js";
import { kline, lettersIn, slam, tilt, whipBlur, whipOut } from "../../v2/kit.js";
import { boxIn, clamp, ease, focus, lerp, makeCursor, p, ramp, set, spring, weightPulse } from "../kit3.js";
import { glyph } from "../../lib/brand.js";
import { $, el, msgIn, msgOut, popMsg, threadCard } from "../../lib/ui.js";

export function buildLink({ W, H, V }) {
  const root = el(`<section class="scene"></section>`);
  const inner = el(`<div class="abs" style="left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0"></div>`);
  root.append(inner);

  const l1 = kline(V ? "Comment LINK." : "Comment", V ? 140 : 160);
  const l1b = kline("LINK.", 160);
  const l2 = kline("*Get the DM.*", V ? 160 : 172);
  const lab = el(`<div class="abs mlabel row" style="gap:12px;color:var(--ink)">${glyph("automation", 16)}<span>Instagram · Comment → DM</span></div>`);
  const foot = el(`<div class="abs mlabel">Facebook &amp; Threads get keyword replies</div>`);
  for (const n of [l1, l1b, l2]) n.classList.add("abs");
  inner.append(l1, l1b, l2, lab, foot);
  if (V) l1b.style.display = "none";

  /* ---- the post, built as separable layers ---- */
  const cw = V ? 940 : 420;
  const L = V
    ? { head: [0, 72], media: [72, 230], cmt: [318, 70], rep: [396, 84], total: 500, f1: 25, f2: 22 }
    : { head: [0, 64], media: [64, 236], cmt: [314, 58], rep: [380, 74], total: 470, f1: 20, f2: 18 };
  const stage3 = el(`<div class="abs" style="width:${cw}px;height:${L.total}px;perspective:1700px"></div>`);
  const post = el(`<div class="abs" style="left:0;top:0;width:${cw}px;height:${L.total}px;transform-style:preserve-3d;transform-origin:50% 50%"></div>`);
  stage3.append(post);
  const base = el(`<div class="layer3d card" style="left:0;top:0;width:${cw}px;height:${L.total}px"></div>`);
  const head = el(`<div class="layer3d row" style="left:0;top:${L.head[0]}px;width:${cw}px;height:${L.head[1]}px;padding:0 16px;gap:10px;border-radius:16px"><span class="avatar" style="width:40px;height:40px;font-size:22px">N</span><div class="col"><span style="font-weight:600;font-size:16px">northwind.studio</span><span class="soft" style="font-size:13px">Instagram · Reel</span></div></div>`);
  const media = el(`<div class="layer3d" style="left:0;top:${L.media[0]}px;width:${cw}px;height:${L.media[1]}px;overflow:hidden"><img src="/media/reel-linen-poster.webp" style="width:100%;height:100%;object-fit:cover;object-position:50% 62%" alt=""><span style="position:absolute;left:14px;top:12px;color:#fff;font-weight:600;font-size:18px;text-shadow:0 1px 8px rgba(0,0,0,.3)">Reels</span></div>`);
  const cmt = el(`<div class="layer3d row" style="left:0;top:${L.cmt[0]}px;width:${cw}px;height:${L.cmt[1]}px;padding:0 18px;gap:12px;font-size:${L.f1}px;border-radius:14px"><span class="avatar cust" style="width:36px;height:36px;font-size:15px">L</span><div><b style="font-weight:600">linen.lover</b> <span style="position:relative;padding:0 3px"><span class="hlb" style="position:absolute;left:0;right:0;bottom:2px;height:0.62em;background:var(--pop3);border-radius:3px;transform-origin:0 50%"></span><span style="position:relative">link</span></span> pls 🙏</div></div>`);
  const rep = el(`<div class="layer3d row" style="left:0;top:${L.rep[0]}px;width:${cw}px;height:${L.rep[1]}px;padding:0 18px 0 66px;gap:12px;font-size:${L.f2}px;border-radius:14px"><span class="avatar" style="width:30px;height:30px;font-size:17px">N</span><div>Thanks for commenting! Just sent you a DM 📩</div></div>`);
  const layers = [base, media, head, cmt, rep];
  post.append(...layers);
  const hlb = $(cmt, ".hlb");
  const dia = el(`<div class="layer3d" style="left:${cw - 70}px;top:${L.cmt[0] + L.cmt[1] / 2 - 20}px;width:40px;height:40px;display:grid;place-items:center">${glyph("automation", 32, 2.2)}</div>`);
  post.append(dia);
  // callouts travel with their layers
  const CALL = [
    [media, "Reel"],
    [head, "Your post"],
    [cmt, "Comment · keyword “link”"],
    [rep, "Public reply · automation"],
  ];
  const callouts = CALL.map(([layer, text]) => {
    const c = el(`<div class="layer3d callout" style="left:${V ? cw - 330 : cw + 26}px;top:${parseFloat(layer.style.top) + (V ? -34 : 10)}px"><i></i>${text}</div>`);
    post.append(c);
    return { c, layer };
  });

  /* ---- the DM ---- */
  const dw = V ? 940 : 430;
  const dh = V ? 640 : 880;
  const dm = threadCard("instagram", "linen.lover", "Instagram DM", { w: dw, h: dh });
  dm.style.position = "absolute";
  const body = $(dm, ".th-body");
  body.style.gap = "14px";
  const m1 = msgOut("Thanks for commenting! Tap below and I'll send it over 👇", "automation", { buttons: ["Send me the link"] });
  const m2 = msgIn("Send me the link", { who: "Tapped" });
  const n1 = el(`<div class="note-m" style="align-self:center">↳ follow check · follows ✓</div>`);
  const m3 = msgOut("Here's your early-access link!", "automation", { buttons: [`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Open link`] });
  const done = el(`<div class="badge ok" style="align-self:flex-end;height:46px;font-size:16px;padding:0 18px 0 14px">${glyph("automation", 14)}Delivered ✓</div>`);
  body.append(m1, m2, n1, m3, done);
  inner.append(stage3, dm);
  const btn = $(m1, ".qbtn");
  const cursor = makeCursor(inner);

  if (V) {
    Object.assign(l1.style, { left: "0", width: `${W}px`, top: "190px" });
    Object.assign(l2.style, { left: "0", width: `${W}px`, top: "340px" });
    Object.assign(lab.style, { left: "70px", top: "560px" });
    foot.style.display = "none";
    Object.assign(stage3.style, { left: "70px", top: "620px" });
    Object.assign(dm.style, { left: "70px", top: "1160px" });
  } else {
    Object.assign(l1.style, { left: "100px", top: "230px", textAlign: "left" });
    Object.assign(l1b.style, { left: "100px", top: "392px", textAlign: "left" });
    Object.assign(l2.style, { left: "100px", top: "566px", textAlign: "left" });
    Object.assign(lab.style, { left: "104px", top: "170px" });
    Object.assign(foot.style, { left: "104px", top: "800px" });
    Object.assign(stage3.style, { left: "960px", top: "180px" });
    Object.assign(dm.style, { left: "1430px", top: "100px" });
  }

  const t0 = T.link;
  const b = (k) => t0 + k * BEAT;
  const Z = [0, 70, 130, 210, 290]; // base, media, head, comment, reply
  let geo = null;

  function render(t) {
    if (!geo) geo = { btn: boxIn(btn, inner), done: boxIn(done, inner) };
    lettersIn(l1, t, t0 + 0.02, { stagger: 0.02, d: 0.45 });
    lettersIn(l1b, t, t0 + 0.02 + BEAT * 0.5, { stagger: 0.03, d: 0.45 });
    weightPulse(l1b, t, t0 + BEAT * 0.5, { peak: 700, rest: 300 });
    lettersIn(l2, t, b(2), { stagger: 0.026, d: 0.5 });
    set(lab, { o: p(t, t0 + 0.1, 0.3) });
    set(foot, { o: p(t, b(4), 0.4) * 0.9 });

    /* exploded view: apart on beat 1, snap back on beat 2.75 */
    const enter = spring(t, t0 + 0.05, { k: 220, c: 20 });
    const apart = spring(t, b(1.1), { k: 170, c: 18 }) * (1 - spring(t, b(2.75), { k: 300, c: 22 }));
    const ry = V ? lerp(0, -18, apart) : lerp(0, -34, apart);
    const rx = lerp(18 * (1 - enter), 14, apart);
    post.style.transform = `translate3d(0, ${((1 - enter) * 140).toFixed(1)}px, 0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${lerp(0.9, 1, enter) * lerp(1, V ? 0.86 : 0.9, apart)})`;
    stage3.style.opacity = t >= t0 ? "1" : "0";
    layers.forEach((ly, i) => {
      // a small fixed z step keeps the paint order defined when the layers are flat (no z-fighting)
      // the snap-back spring overshoots; never let a layer sink behind the card
      const z = i === 0 ? -6 : Z[i] * Math.max(0, apart) * (V ? 0.8 : 1) + i * 0.8;
      const lift = i > 0 ? apart : 0;
      ly.style.transform = `translateZ(${z.toFixed(1)}px)`;
      if (i >= 2) {
        ly.style.background = lift > 0.02 ? `rgba(255,255,255,${(0.96 * lift).toFixed(3)})` : "transparent";
        ly.style.boxShadow = lift > 0.02 ? `0 ${(18 * lift).toFixed(1)}px ${(40 * lift).toFixed(1)}px -18px rgba(38,43,38,${(0.35 * lift).toFixed(3)}), 0 0 0 1px rgba(227,233,218,${lift.toFixed(3)})` : "none";
      }
      if (i === 1) ly.style.borderRadius = `${(16 * lift).toFixed(1)}px`;
    });
    callouts.forEach(({ c, layer }, i) => {
      const z = Z[layers.indexOf(layer)] * Math.max(0, apart) * (V ? 0.8 : 1);
      c.style.transform = `translateZ(${z.toFixed(1)}px)`;
      c.style.opacity = (p(t, b(1.4) + i * 0.06, 0.25) * (1 - p(t, b(2.6), 0.15))).toFixed(3);
    });
    popMsg(cmt.lastElementChild, t, b(0.5));
    hlb.style.transform = `scaleX(${p(t, b(1.2), 0.25, ease.out).toFixed(3)})`;
    const dsp = spring(t, b(1.25), { k: 520, c: 22 });
    dia.style.transform = `translateZ(${(Z[3] * Math.max(0, apart) + 30).toFixed(1)}px) scale(${dsp.toFixed(3)})`;
    dia.style.opacity = t >= b(1.25) && t < b(2.8) ? "1" : "0";
    rep.lastElementChild.style.opacity = p(t, b(1.75), 0.2).toFixed(3);
    rep.firstElementChild.style.opacity = p(t, b(1.75), 0.2).toFixed(3);

    /* DM, cursor tap, delivered */
    const ds = spring(t, b(3), { k: 220, c: 20 });
    dm.style.transform = tilt({ x: (1 - ds) * (V ? 0 : 260), y: (1 - ds) * (V ? 200 : 0), ry: V ? 0 : -16 * (1 - ds), s: lerp(0.94, 1, ds) });
    dm.style.opacity = t >= b(3) ? Math.min(1, (t - b(3)) / 0.08).toFixed(3) : "0";
    popMsg(m1, t, b(3.5), { side: "out" });
    const bx = geo.btn.x + geo.btn.w * 0.62;
    const by = geo.btn.y + geo.btn.h * 0.55;
    cursor.render(t, [
      [b(4), bx + (V ? 160 : 240), by + (V ? 260 : 220), {}],
      [b(5) - 0.2, bx, by, { hand: true }],
      [b(5), bx, by, { click: true }],
      [b(5.6), bx + 40, by + 120, { hand: false, out: true }],
    ]);
    const press = p(t, b(5) - 0.05, 0.05) * (1 - p(t, b(5) + 0.03, 0.12));
    set(btn, { s: 1 - 0.08 * press });
    btn.style.background = t >= b(5) ? "var(--bg-alt)" : t >= b(5) - 0.25 ? "#f6f8f2" : "var(--surface)";
    popMsg(m2, t, b(5.3));
    set(n1, { o: p(t, b(5.7), 0.25) });
    popMsg(m3, t, b(6), { side: "out" });
    slam(done, t, b(6.5), { from: 1.6, k: 520, c: 24 });

    /* macro on ✓ Delivered (creep → snap), then the whip pan */
    // macro: punch in fast, settle, hold on the tick, then the whip
    const z = ramp.fastSlow(clamp((t - b(6.62)) / 0.45));
    const S = lerp(1, V ? 2.0 : 2.3, z);
    const fx = lerp(W / 2, geo.done.x + geo.done.w / 2, ease.cam(clamp((t - b(6.4)) / 0.6)));
    const fy = lerp(H / 2, geo.done.y + geo.done.h / 2, ease.cam(clamp((t - b(6.4)) / 0.6)));
    const zoomOn = t > b(6.4);
    inner.style.transform = zoomOn ? `translate(${(W / 2 - fx * S).toFixed(2)}px, ${(H / 2 - fy * S).toFixed(2)}px) scale(${S.toFixed(4)})` : "none";
    focus(l1, t, [[b(6.5), 0], [b(7.1), 6]]);
    root.style.transform = `translate(${whipOut(t, T.agent, W).toFixed(1)}px, 0)`;
    whipBlur(root, t, T.agent, W);
  }

  return { root, render, t0: T.link - 0.3, t1: T.agent + 0.2 };
}
