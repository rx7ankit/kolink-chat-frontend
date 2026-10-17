/**
 * 35.41 – 41.5 s · END CARD on the crash: "Post once." slams, "*Catch every reply.*" rises with a
 * route line ending in a station roundel; the koLink mark draws itself; on the track's final bar
 * the Get started pill springs in; the legend; hold while the music resolves.
 */
import { BEAT, T } from "../timing.js";
import { ease, kline, lerp, lettersIn, p, set, spring } from "../../v2/kit.js";
import { boxIn, clamp, focus, makeSweep, weightPulse } from "../kit3.js";
import { LOGO_PATHS, glyph, legendLabel } from "../../lib/brand.js";
import { el, words } from "../../lib/ui.js";

export function buildEnd({ W, H, V }) {
  const root = el(`<section class="scene"></section>`);
  const inner = el(`<div class="abs" style="left:0;top:0;width:${W}px;height:${H}px;transform-origin:50% 50%"></div>`);
  root.append(inner);

  const s1 = V ? 176 : 196;
  const s2 = V ? 176 : 206;
  const l1 = kline("Post once.", s1, { cls: "free" });
  const l2lines = V ? ["*Catch every*", "*reply.*"] : ["*Catch every reply.*"];
  const l2 = el(`<div class="abs" style="left:0;width:${W}px;text-align:center"></div>`);
  l2lines.forEach((s) => l2.append(kline(s, s2)));
  l1.classList.add("abs");
  Object.assign(l1.style, { left: "0", width: `${W}px` });
  inner.append(l1, l2);
  const lastLine = l2.lastElementChild;
  lastLine.style.display = "inline-block";
  lastLine.style.position = "relative";
  const route = el(`<span class="abs" style="left:0.04em;right:0;bottom:-0.16em;height:7px;border-radius:4px;background:var(--accent)"></span>`);
  const stop = el(`<span class="abs" style="right:-26px;bottom:calc(-0.16em - 15px);width:38px;height:38px;border-radius:50%;background:var(--surface);box-shadow:inset 0 0 0 7px var(--accent)"></span>`);
  lastLine.append(route, stop);

  const brand = el(`<div class="abs row" style="left:0;width:${W}px;justify-content:center;gap:18px"></div>`);
  const mark = el(`<svg viewBox="0 0 681 550" style="height:${V ? 76 : 64}px;width:auto;overflow:visible">${LOGO_PATHS.map((d) => `<path d="${d}" fill="var(--ink)" class="mf"/>`).join("")}${LOGO_PATHS.map((d) => `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="16" stroke-linejoin="round" pathLength="1" class="ms"/>`).join("")}</svg>`);
  const word = el(`<span style="font-size:${V ? 60 : 52}px;font-weight:600;letter-spacing:-0.035em;line-height:1">${words("koLink")} <span style="color:var(--accent)">${words("Chat")}</span></span>`);
  brand.append(mark, word);
  inner.append(brand);
  const fills = [...mark.querySelectorAll(".mf")];
  const strokes = [...mark.querySelectorAll(".ms")];

  const cta = el(`<div class="abs row" style="left:0;width:${W}px;justify-content:center"><span class="btn" style="height:${V ? 100 : 88}px;padding:0 ${V ? 46 : 42}px;font-size:${V ? 34 : 30}px;gap:16px">Get started <span style="opacity:.6">—</span> chat.getkolink.com <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></span></div>`);
  inner.append(cta);
  const ctaBtn = cta.firstElementChild;
  ctaBtn.style.position = "relative";
  ctaBtn.style.overflow = "hidden";
  const sweepCta = makeSweep(ctaBtn, { color: "243,249,233", alpha: 0.55, width: 0.28 });
  const kinds = ["post", "incoming", "automation", "agent", "team", "attention"];
  const legend = el(`<div class="abs row mono" style="left:0;width:${W}px;justify-content:center;gap:${V ? "18px 30px" : "34px"};flex-wrap:wrap;font-size:${V ? 17 : 15}px;${V ? "padding:0 90px" : ""}">${kinds.map((k) => `<span class="row lg" style="gap:10px">${glyph(k, 15)}${legendLabel[k]}</span>`).join("")}</div>`);
  inner.append(legend);
  const lgs = [...legend.querySelectorAll(".lg")];

  if (V) {
    brand.style.top = "470px";
    l1.style.top = "640px";
    l2.style.top = "830px";
    cta.style.top = "1330px";
    legend.style.top = "1600px";
  } else {
    brand.style.top = "150px";
    l1.style.top = "300px";
    l2.style.top = "510px";
    cta.style.top = "800px";
    legend.style.top = "990px";
  }

  const t0 = T.end;
  const b = (k) => t0 + k * BEAT;
  // a single legend shape morphs from glyph to glyph (capsule → ring → diamond → dot → square), leaving each behind
  const runner = el(`<div class="abs" style="left:0;top:0;z-index:3;box-sizing:border-box;border:1.5px solid var(--ink)"></div>`);
  inner.append(runner);
  const SH = [
    { w: 27, h: 15, r: 7.5, rot: 0, bg: "var(--accent)" },
    { w: 13, h: 13, r: 6.5, rot: 0, bg: "var(--surface)" },
    { w: 11, h: 11, r: 0, rot: 45, bg: "var(--pop3)" },
    { w: 13, h: 13, r: 6.5, rot: 0, bg: "var(--pop2)" },
    { w: 12, h: 12, r: 4, rot: 0, bg: "var(--ink)" },
    { w: 13, h: 13, r: 2, rot: 0, bg: "var(--pop1)" },
  ];
  let gpos = null;
  function render(t) {
    if (!gpos) {
      // SVG has no offsetParent, so measure the HTML legend item and its glyph's rendered width
      gpos = lgs.map((g) => {
        const bx = boxIn(g, inner);
        const gw = Number(g.querySelector("svg").getAttribute("width"));
        return { x: bx.x + gw / 2, y: bx.y + bx.h / 2 };
      });
    }
    set(inner, { s: lerp(1, 1.04, p(t, t0, 6, ease.cam)) });
    lettersIn(l1, t, t0, { stagger: 0.04, d: 0.5, mode: "pop" });
    weightPulse(l1, t, t0, { peak: 760, rest: 300, stagger: 0.04, d: 0.7 });
    focus(l1, t, [[t0, 16], [t0 + 0.45, 0]]);
    focus(l2, t, [[b(1), 14], [b(1) + 0.5, 0]]);
    set(l1, { s: 1 + 0.3 * (1 - spring(t, t0, { k: 300, c: 22 })) });
    l2.querySelectorAll(".ci").forEach((c, i) => {
      const s = spring(t, b(1) + i * 0.028, { k: 300, c: 22 });
      c.style.transform = `translate(0, ${((1 - s) * 105).toFixed(2)}%)`;
      c.style.opacity = t >= b(1) + i * 0.028 ? "1" : "0";
    });
    route.style.clipPath = `inset(0 ${((1 - p(t, b(2), 0.8, ease.travel)) * 100).toFixed(2)}% 0 0)`;
    set(stop, { s: spring(t, b(2) + 0.7, { k: 420, c: 22 }), o: t >= b(2) + 0.7 ? 1 : 0 });
    strokes.forEach((s, i) => {
      const q = p(t, b(2) + i * 0.12, 0.7, ease.travel);
      s.style.strokeDasharray = "1 1";
      s.style.strokeDashoffset = (1 - q).toFixed(4);
      s.style.opacity = (1 - p(t, b(2) + 0.75 + i * 0.12, 0.35)).toFixed(3);
    });
    fills.forEach((f, i) => (f.style.opacity = p(t, b(2) + 0.45 + i * 0.12, 0.4).toFixed(3)));
    word.querySelectorAll(".wi").forEach((w, i) => {
      const q = p(t, b(2.5) + i * 0.08, 0.6, ease.out);
      w.style.transform = `translate(0, ${((1 - q) * 105).toFixed(2)}%)`;
    });
    const cs = spring(t, T.final, { k: 300, c: 19 });
    set(ctaBtn, { s: lerp(0.7, 1, cs), y: (1 - cs) * 24, o: t >= T.final ? Math.min(1, (t - T.final) / 0.06) : 0 });
    sweepCta(t, T.final + 0.45, 1.1);
    const tl0 = T.final + BEAT;
    const step = BEAT / 2;
    lgs.forEach((g, i) => {
      const arrive = tl0 + i * step;
      const svg = g.querySelector("svg");
      svg.style.opacity = t >= arrive + step * 0.5 || i === 5 && t >= arrive ? "1" : "0";
      set(g, { o: p(t, tl0 - 0.1 + i * step, 0.3) * 0.95 });
    });
    const k = clamp((t - tl0) / step);
    const seg = Math.min(4, Math.floor((t - tl0) / step));
    if (t >= tl0 - 0.15 && t < tl0 + 5 * step + 0.05) {
      const i0 = Math.max(0, seg);
      const i1 = Math.min(5, i0 + 1);
      const q = ease.travel(clamp((t - (tl0 + i0 * step)) / step));
      const a = SH[i0];
      const c = SH[i1];
      const x = lerp(gpos[i0].x, gpos[i1].x, q);
      const y = lerp(gpos[i0].y, gpos[i1].y, q);
      const w = lerp(a.w, c.w, q);
      const h = lerp(a.h, c.h, q);
      runner.style.width = `${w}px`;
      runner.style.height = `${h}px`;
      runner.style.borderRadius = `${lerp(a.r, c.r, q)}px`;
      runner.style.background = q < 0.5 ? a.bg : c.bg;
      set(runner, { x: x - w / 2, y: y - h / 2, r: lerp(a.rot, c.rot, q), s: 1 + 0.35 * Math.sin(q * Math.PI), o: t >= tl0 - 0.15 ? 1 : 0 });
    } else set(runner, { o: 0 });
    void k;
  }

  return { root, render, t0: T.end, t1: 999 };
}
