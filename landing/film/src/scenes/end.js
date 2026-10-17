/**
 * 32 – 38 s · END CARD. "Post once." (Inter Light) / "Catch every reply." (Instrument Serif
 * italic) on the hats lift; a route line runs under the serif to a station roundel; the koLink
 * mark draws itself; wordmark; the Get started pill; the legend. Hold while the music fades.
 */
import { ease, lerp, p, set, spring } from "../lib/anim.js";
import { LOGO_PATHS, glyph, legendLabel } from "../lib/brand.js";
import { el, revealWords, words } from "../lib/ui.js";

export function buildEnd({ V, W }) {
  const root = el(`<section class="scene"></section>`);
  const size = V ? 150 : 168;
  const hl = el(`<div class="abs display" style="left:0;width:${W}px;text-align:center;font-size:${size}px;line-height:1.02"><div>${words("Post once.")}</div><div style="position:relative;display:inline-block">${words("*Catch every reply.*")}</div></div>`);
  if (V) {
    hl.innerHTML = `<div>${words("Post once.")}</div><div>${words("*Catch every*")}</div><div><span style="position:relative;display:inline-block">${words("*reply.*")}</span></div>`;
  }
  const emLine = V ? hl.lastElementChild.firstElementChild : hl.lastElementChild;
  // Route line under the serif, ending in a station roundel.
  const route = el(`<span class="abs" style="left:0.06em;right:0;bottom:-0.14em;height:6px;border-radius:3px;background:var(--accent)"></span>`);
  const stop = el(`<span class="abs" style="right:-24px;bottom:calc(-0.14em - 15px);width:36px;height:36px;border-radius:50%;background:var(--surface);box-shadow:inset 0 0 0 6px var(--accent)"></span>`);
  emLine.append(route, stop);

  const brand = el(`<div class="abs row" style="left:0;width:${W}px;justify-content:center;gap:${V ? 20 : 18}px"></div>`);
  const mark = el(`<svg viewBox="0 0 681 550" style="height:${V ? 70 : 60}px;width:auto;overflow:visible">${LOGO_PATHS.map((d) => `<path d="${d}" fill="var(--ink)" class="mf"/>`).join("")}${LOGO_PATHS.map((d) => `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="16" stroke-linejoin="round" pathLength="1" class="ms"/>`).join("")}</svg>`);
  const word = el(`<span style="font-size:${V ? 56 : 50}px;font-weight:600;letter-spacing:-0.035em;line-height:1">${words("koLink")} <span style="color:var(--accent)">${words("Chat")}</span></span>`);
  brand.append(mark, word);
  const fills = [...mark.querySelectorAll(".mf")];
  const strokes = [...mark.querySelectorAll(".ms")];

  const cta = el(`<div class="abs row" style="left:0;width:${W}px;justify-content:center"><span class="btn" style="height:${V ? 92 : 84}px;padding:0 ${V ? 44 : 40}px;font-size:${V ? 32 : 29}px;gap:16px">Get started <span style="opacity:.6">—</span> chat.getkolink.com <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></span></div>`);
  const ctaBtn = cta.firstElementChild;

  const kinds = ["post", "incoming", "automation", "agent", "team", "attention"];
  const legend = el(`<div class="abs row mono" style="left:0;width:${W}px;justify-content:center;gap:${V ? "18px 30px" : "34px"};flex-wrap:wrap;font-size:${V ? 17 : 14}px;${V ? "padding:0 80px" : ""}">${kinds.map((k) => `<span class="row lg" style="gap:10px">${glyph(k, 14)}${legendLabel[k]}</span>`).join("")}</div>`);
  const lgs = [...legend.querySelectorAll(".lg")];

  root.append(brand, hl, cta, legend);
  if (V) {
    brand.style.top = "520px";
    hl.style.top = "690px";
    cta.style.top = "1260px";
    legend.style.top = "1560px";
  } else {
    brand.style.top = "214px";
    hl.style.top = "330px";
    cta.style.top = "760px";
    legend.style.top = "980px";
  }

  const T = { in: 32.0, l2: 32.5, route: 33.0, mark: 33.5, cta: 34.5, legend: 35.0 };

  function render(t) {
    const ws = hl.querySelectorAll(".wi");
    // Line one on the downbeat, the serif line half a bar later.
    ws.forEach((w, i) => {
      const isEm = w.classList.contains("em");
      const t0 = isEm ? T.l2 + (i - 2) * 0.09 : T.in + i * 0.1;
      const q = p(t, t0, 0.85, ease.out);
      w.style.transform = `translate(0, ${((1 - q) * 105).toFixed(2)}%)`;
    });
    const rq = p(t, T.route, 0.9, ease.travel);
    route.style.clipPath = `inset(0 ${((1 - rq) * 100).toFixed(2)}% 0 0)`;
    const ss = spring(t, T.route + 0.75, { k: 420, c: 22 });
    set(stop, { s: ss, o: t >= T.route + 0.75 ? 1 : 0 });
    // Mark traces itself in accent, then fills in ink.
    strokes.forEach((s, i) => {
      const q = p(t, T.mark + i * 0.12, 0.7, ease.travel);
      s.style.strokeDasharray = "1 1";
      s.style.strokeDashoffset = (1 - q).toFixed(4);
      s.style.opacity = (1 - p(t, T.mark + 0.75 + i * 0.12, 0.35)).toFixed(3);
    });
    fills.forEach((f, i) => (f.style.opacity = p(t, T.mark + 0.45 + i * 0.12, 0.4).toFixed(3)));
    revealWords(word, t, T.mark + 0.2, { stagger: 0.08 });
    const cs = spring(t, T.cta, { k: 300, c: 20 });
    set(ctaBtn, { s: lerp(0.8, 1, cs), o: p(t, T.cta, 0.15, ease.linear), y: (1 - cs) * 16 });
    lgs.forEach((g, i) => set(g, { o: p(t, T.legend + i * 0.08, 0.4) * 0.95, y: (1 - p(t, T.legend + i * 0.08, 0.5)) * 10 }));
  }

  return { root, render, t0: 31.9, t1: 38.01 };
}
