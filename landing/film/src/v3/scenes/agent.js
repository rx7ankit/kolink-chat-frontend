/**
 * 25.57 – 29.51 s · "An agent that knows your shop." (AI agent: Instagram + Messenger DMs only,
 * answers only from the knowledge library.)
 *  Whip-pan in. MOSAIC → ONE: the hook's "same question" returns as a wall of hours questions from
 *  Instagram and Messenger DMs; they converge into one conversation (speed ramp), answered once from
 *  the knowledge library ("matched: Hours"). "show me prices" → catalog cards flip in, and a MACRO
 *  on ₹4,800 pulls back to the conversation.
 */
import { BEAT, T } from "../timing.js";
import { kline, lettersIn, tilt, whipBlur, whipIn } from "../../v2/kit.js";
import { boxIn, clamp, ease, focus, lerp, p, ramp, set, spring, weightPulse } from "../kit3.js";
import { mulberry32 } from "../../lib/anim.js";
import { glyph, icon } from "../../lib/brand.js";
import { $, el, msgIn, msgOut, popMsg, threadCard } from "../../lib/ui.js";

const CATALOG = [
  ["Linen bedding set", "₹4,800", "Queen", "/media/item-linen-stack.webp"],
  ["Relaxed linen shirt", "₹2,450", "Pre-washed", "/media/item-linen-shirt.webp"],
  ["Terracotta planter", "₹890", "S · M · L", "/media/item-planter.webp"],
];
const QS = ["are you open Sunday?", "open on sunday?", "sunday timings?", "r u open sun", "what time do you open?", "open tomorrow?", "hours?", "store timings pls", "are you open today?", "till what time open?", "open now?", "weekend hours?"];

export function buildAgent({ W, H, V }) {
  const root = el(`<section class="scene"></section>`);
  const inner = el(`<div class="abs" style="left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0"></div>`);
  root.append(inner);
  const size = V ? 128 : 140;
  const lines = ["An agent", "that knows", "*your shop.*"].map((s, i) => {
    const k = kline(s, i === 2 ? size * 1.08 : size);
    k.classList.add("abs");
    inner.append(k);
    return k;
  });
  const lab = el(`<div class="abs mlabel row" style="gap:12px;color:var(--ink)">${glyph("agent", 16)}<span>AI agent · Instagram + Messenger DMs</span></div>`);
  const foot = el(`<div class="abs mlabel">Answers only from your knowledge library</div>`);
  inner.append(lab, foot);

  const dw = V ? 940 : 780;
  const dh = V ? 1060 : 820;
  const dm = threadCard("instagram", "maya.home", "Instagram DM · agentic", { w: dw, h: dh });
  dm.style.position = "absolute";
  const body = $(dm, ".th-body");
  body.style.gap = "14px";
  const m1 = msgIn("are you open Sunday?");
  const typing = el(`<div class="msg out"><div class="typing"><i></i><i></i><i></i></div></div>`);
  const m2 = msgOut("We're open 10am–7pm, Monday to Saturday.", "agent");
  const note = el(`<div class="note-m" style="align-self:flex-end"><span style="width:12px;height:12px;border-radius:50%;background:var(--pop2);box-shadow:inset 0 0 0 1.5px var(--ink)"></span>matched: Hours · from your knowledge</div>`);
  const m3 = msgIn("show me prices");
  const m4 = msgOut("Here is what is available.", "agent");
  const cards = el(`<div class="row" style="gap:14px;align-self:flex-end;margin-top:4px"></div>`);
  const cardW = V ? 280 : 228;
  const cardEls = CATALOG.map(([name, price, meta, img]) => {
    const c = el(`<div class="card" style="width:${cardW}px;overflow:hidden;border-radius:18px"><img src="${img}" style="width:100%;height:${V ? 190 : 190}px;object-fit:cover" alt=""><div style="padding:12px 14px 14px"><div style="font-size:${V ? 21 : 18}px;font-weight:500;letter-spacing:-0.01em;white-space:nowrap">${name}</div><div class="row" style="justify-content:space-between;margin-top:6px"><span class="price" style="font-size:${V ? 24 : 21}px;font-weight:600">${price}</span><span class="mono" style="font-size:12px;white-space:nowrap">${meta}</span></div></div></div>`);
    cards.append(c);
    return c;
  });
  body.append(m1, typing, m2, note, m3, m4, cards);
  inner.append(dm);
  const price0 = $(cardEls[0], ".price");

  /* the wall of questions (IG + Messenger DMs only) */
  const rnd = mulberry32(11);
  const wallBox = V ? { x: 60, y: 660, w: 960, h: 1100 } : { x: 1000, y: 110, w: 860, h: 860 };
  const NQ = V ? 22 : 24;
  const qs = Array.from({ length: NQ }, (_, i) => {
    const col = V ? 2 : 3;
    const cxq = wallBox.x + ((i % col) + 0.5) * (wallBox.w / col) + (rnd() - 0.5) * 60;
    const cyq = wallBox.y + (Math.floor(i / col) + 0.5) * (wallBox.h / Math.ceil(NQ / col)) + (rnd() - 0.5) * 20;
    const ch = i % 3 === 0 ? "messenger" : "instagram";
    const n = el(`<div class="abs" style="left:${cxq}px;top:${cyq}px;width:0;height:0;z-index:6"><div class="qb" style="transform:translate(-50%,-50%);left:0;top:0;font-size:${V ? 24 : 21}px">${icon(ch, 20)}${QS[i % QS.length]}</div></div>`);
    inner.append(n);
    return { n, x: cxq, y: cyq, d: rnd() * 0.12 };
  });

  if (V) {
    lines.forEach((l, i) => Object.assign(l.style, { left: "0", width: `${W}px`, top: `${190 + i * 140}px` }));
    Object.assign(lab.style, { left: "70px", top: "620px" });
    foot.style.display = "none";
    Object.assign(dm.style, { left: "70px", top: "680px" });
  } else {
    lines.forEach((l, i) => Object.assign(l.style, { left: "100px", top: `${290 + i * 152}px`, textAlign: "left" }));
    Object.assign(lab.style, { left: "104px", top: "220px" });
    Object.assign(foot.style, { left: "104px", top: "780px" });
    Object.assign(dm.style, { left: "1040px", top: "130px" });
  }

  const t0 = T.agent;
  const b = (k) => t0 + k * BEAT;
  let geo = null;

  function render(t) {
    if (!geo) {
      const m = boxIn(m1, inner);
      geo = { m1: { x: m.x + 90, y: m.y + m.h / 2 }, price: boxIn(price0, inner) };
    }
    root.style.transform = `translate(${whipIn(t, t0, W).toFixed(1)}px, 0)`;
    whipBlur(root, t, t0, W);
    lines.forEach((l, i) => {
      lettersIn(l, t, t0 + 0.06 + i * BEAT * 0.5, { stagger: 0.02, d: 0.45, tOut: T.human - 0.34 + i * 0.03, dOut: 0.2 });
      weightPulse(l, t, t0 + 0.06 + i * BEAT * 0.5, { peak: 620, rest: 300 });
    });
    set(lab, { o: p(t, t0 + 0.1, 0.3) });
    set(foot, { o: p(t, b(2), 0.4) * 0.9 });

    /* wall → one: bubbles pop on 16ths, then converge into the conversation (creep, then rush) */
    qs.forEach(({ n, x, y, d }, i) => {
      const tin = t0 + 0.1 + i * 0.022;
      const s = spring(t, tin, { k: 460, c: 24 });
      const conv = ramp.slowFast(clamp((t - (b(1.4) + d)) / 0.5));
      const gx = geo.m1.x;
      const gy = geo.m1.y;
      set(n, { x: lerp(0, gx - x, conv), y: lerp(0, gy - y, conv), s: lerp(0.5, 1, s) * lerp(1, 0.6, conv), o: t >= tin && conv < 0.98 ? 1 - Math.max(0, conv - 0.8) * 5 : 0 });
    });

    const push = p(t, b(5), 2.6, ease.cam);
    const dIn = spring(t, b(1.65), { k: 240, c: 22 });
    dm.style.transform = tilt({ ry: V ? 0 : lerp(9, 3, dIn), s: lerp(0.96, 1, dIn) * lerp(1, 1.02, push), y: (1 - dIn) * 40 });
    dm.style.opacity = t >= b(1.65) ? Math.min(1, (t - b(1.65)) / 0.12).toFixed(3) : "0";
    popMsg(m1, t, b(1.85));
    const typingOn = t >= b(2.1) && t < b(2.5);
    typing.style.position = "absolute";
    typing.style.right = "22px";
    typing.style.top = `${m2.offsetTop + m2.offsetHeight - 52}px`;
    set(typing, { o: typingOn ? 1 : 0 });
    typing.querySelectorAll("i").forEach((dd, j) => {
      const ph = ((t - b(2.1)) * 4 - j * 0.25) % 1;
      dd.style.transform = `translateY(${(-5 * Math.max(0, Math.sin(ph * Math.PI * 2))).toFixed(2)}px)`;
    });
    popMsg(m2, t, b(2.5), { side: "out" });
    const ns = spring(t, b(2.9), { k: 420, c: 22 });
    set(note, { x: (1 - ns) * 24, o: t >= b(2.9) ? 1 : 0 });
    popMsg(m3, t, b(3.5));
    popMsg(m4, t, b(4), { side: "out" });
    cardEls.forEach((c, i) => {
      const tc = b(4.25 + i * 0.25);
      const s = spring(t, tc, { k: 260, c: 19 });
      c.style.transform = tilt({ x: (1 - s) * 220, ry: -50 * (1 - s), s: lerp(0.7, 1, s), persp: 1200 });
      c.style.opacity = t >= tc ? Math.min(1, (t - tc) / 0.05).toFixed(3) : "0";
    });

    /* macro on the ₹ price, then pull back */
    const zin = ramp.fastSlow(clamp((t - b(5.5)) / 0.45));
    const zout = ramp.fastSlow(clamp((t - b(6.6)) / 0.7));
    const S = lerp(1, V ? 2.4 : 2.8, zin * (1 - zout));
    const k = clamp((t - b(5.2)) / 0.6);
    const fx = lerp(W / 2, geo.price.x + geo.price.w / 2, ease.cam(k) * (1 - zout));
    const fy = lerp(H / 2, geo.price.y + geo.price.h / 2, ease.cam(k) * (1 - zout));
    inner.style.transform = S > 1.0005 ? `translate(${(W / 2 - fx * S).toFixed(2)}px, ${(H / 2 - fy * S).toFixed(2)}px) scale(${S.toFixed(4)})` : "none";
    lines.forEach((l) => focus(l, t, [[b(5.3), 0], [b(5.8), 8], [b(6.7), 8], [b(7.3), 0]]));
  }

  return { root, render, t0: T.agent - 0.2, t1: T.human + 0.3 };
}
