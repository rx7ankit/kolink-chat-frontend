/**
 * 35.41 – 41.5 s · END CARD on the crash: "Post once." slams, "*Catch every reply.*" rises with a
 * route line ending in a station roundel; the koLink mark draws itself; on the track's final bar
 * the Get started pill springs in; the legend; hold while the music resolves.
 */
import { BEAT, T } from "../timing.js";
import { ease, kline, lerp, lettersIn, p, set, spring } from "../kit.js";
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
  function render(t) {
    set(inner, { s: lerp(1, 1.04, p(t, t0, 6, ease.cam)) });
    lettersIn(l1, t, t0, { stagger: 0.04, d: 0.5, mode: "pop" });
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
    lgs.forEach((g, i) => set(g, { o: p(t, T.final + BEAT + i * 0.08, 0.4) * 0.95, y: (1 - p(t, T.final + BEAT + i * 0.08, 0.5)) * 10 }));
  }

  return { root, render, t0: T.end, t1: 999 };
}
