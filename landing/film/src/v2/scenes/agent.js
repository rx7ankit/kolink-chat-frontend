/**
 * 25.57 – 29.51 s · "An agent that knows *your shop.*" (Instagram + Messenger DMs only, answers
 * only from the knowledge library.) Whip-pans in. "are you open Sunday?" → answer from Hours;
 * "show me prices" → catalog cards with ₹ prices fly in.
 */
import { BEAT, T } from "../timing.js";
import { ease, kline, lerp, lettersIn, p, set, spring, tilt, whipBlur, whipIn } from "../kit.js";
import { glyph } from "../../lib/brand.js";
import { $, el, msgIn, msgOut, popMsg, threadCard } from "../../lib/ui.js";

const CATALOG = [
  ["Linen bedding set", "₹4,800", "Queen", "/media/item-linen-stack.webp"],
  ["Relaxed linen shirt", "₹2,450", "Pre-washed", "/media/item-linen-shirt.webp"],
  ["Terracotta planter", "₹890", "S · M · L", "/media/item-planter.webp"],
];

export function buildAgent({ W, H, V }) {
  const root = el(`<section class="scene"></section>`);
  const size = V ? 128 : 140;
  const lines = ["An agent", "that knows", "*your shop.*"].map((s, i) => {
    const k = kline(s, i === 2 ? size * 1.08 : size);
    k.classList.add("abs");
    root.append(k);
    return k;
  });
  const lab = el(`<div class="abs mlabel row" style="gap:12px;color:var(--ink)">${glyph("agent", 16)}<span>AI agent · Instagram + Messenger DMs</span></div>`);
  const foot = el(`<div class="abs mlabel">Answers only from your knowledge library</div>`);
  root.append(lab, foot);

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
  const cards = el(`<div class="row" style="gap:14px;align-self:flex-end;margin-top:4px;perspective:1400px"></div>`);
  const cardW = V ? 280 : 228;
  const cardEls = CATALOG.map(([name, price, meta, img]) => {
    const c = el(`<div class="card" style="width:${cardW}px;overflow:hidden;border-radius:18px"><img src="${img}" style="width:100%;height:${V ? 190 : 190}px;object-fit:cover" alt=""><div style="padding:12px 14px 14px"><div style="font-size:${V ? 21 : 18}px;font-weight:500;letter-spacing:-0.01em;white-space:nowrap">${name}</div><div class="row" style="justify-content:space-between;margin-top:6px"><span style="font-size:${V ? 24 : 21}px;font-weight:600">${price}</span><span class="mono" style="font-size:12px;white-space:nowrap">${meta}</span></div></div></div>`);
    cards.append(c);
    return c;
  });
  body.append(m1, typing, m2, note, m3, m4, cards);
  root.append(dm);

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

  function render(t) {
    root.style.transform = `translate(${whipIn(t, t0, W).toFixed(1)}px, 0)`;
    whipBlur(root, t, t0, W);
    lines.forEach((l, i) => lettersIn(l, t, t0 + 0.06 + i * BEAT * 0.5, { stagger: 0.02, d: 0.45, tOut: T.human - 0.34 + i * 0.03, dOut: 0.2 }));
    set(lab, { o: p(t, t0 + 0.1, 0.3) });
    set(foot, { o: p(t, b(2), 0.4) * 0.9 });

    const push = p(t, b(5), 2.6, ease.cam);
    dm.style.transform = tilt({ ry: V ? 0 : lerp(9, 3, p(t, t0, 1.2, ease.out)) - 3 * push, s: lerp(1, V ? 1.03 : 1.07, push), x: V ? 0 : -40 * push, y: V ? -60 * push : 0 });

    popMsg(m1, t, b(0.5));
    const typingOn = t >= b(1) && t < b(1.5);
    typing.style.position = "absolute";
    typing.style.right = "22px";
    typing.style.top = `${m2.offsetTop + m2.offsetHeight - 52}px`;
    set(typing, { o: typingOn ? 1 : 0 });
    typing.querySelectorAll("i").forEach((d, j) => {
      const ph = ((t - b(1)) * 4 - j * 0.25) % 1;
      d.style.transform = `translateY(${(-5 * Math.max(0, Math.sin(ph * Math.PI * 2))).toFixed(2)}px)`;
    });
    popMsg(m2, t, b(1.5), { side: "out" });
    const ns = spring(t, b(2), { k: 420, c: 22 });
    set(note, { x: (1 - ns) * 24, o: t >= b(2) ? 1 : 0 });
    popMsg(m3, t, b(3));
    popMsg(m4, t, b(3.5), { side: "out" });
    cardEls.forEach((c, i) => {
      const tc = b(3.75 + i * 0.25);
      const s = spring(t, tc, { k: 260, c: 19 });
      c.style.transform = tilt({ x: (1 - s) * 220, ry: -45 * (1 - s), s: lerp(0.7, 1, s), persp: 1200 });
      c.style.opacity = t >= tc ? Math.min(1, (t - tc) / 0.05).toFixed(3) : "0";
    });
  }

  return { root, render, t0: T.agent - 0.2, t1: T.human + 0.3 };
}
