/**
 * 33.44 – 35.41 s · Numbers beat (demo workspace, illustrative). An ink square wipes in; giant
 * numerals roll like a slot machine, the 7-day line draws, the "Demo workspace" stamp lands.
 */
import { BEAT, T } from "../timing.js";
import { ease, kline, lerp, lettersIn, p, set, slam, spring } from "../../v2/kit.js";
import { el } from "../../lib/ui.js";

const BY_DAY = [820, 910, 1040, 1288, 760, 540, 990];
const DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];

export function buildNumbers({ W, H, V }) {
  const root = el(`<section class="scene"></section>`);
  const cx = W / 2;
  const size = V ? 250 : 330;
  const top = el(`<div class="abs mlabel" style="left:0;width:${W}px;text-align:center;font-size:${V ? 22 : 20}px;color:var(--ink)">Messages · last 7 days</div>`);
  const digits = "6,348".split("");
  const num = el(`<div class="abs display" style="left:0;width:${W}px;text-align:center;font-size:${size}px;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-0.04em;white-space:nowrap"></div>`);
  const cols = digits.map((d) => {
    if (d === ",") {
      const c = el(`<span style="display:inline-block">,</span>`);
      num.append(c);
      return null;
    }
    const wrap = el(`<span style="display:inline-block;height:1em;overflow:hidden;vertical-align:top;padding:0.06em 0.01em 0.1em;margin:-0.06em -0.01em -0.1em"><span style="display:inline-flex;flex-direction:column">${Array.from({ length: 11 }, (_, i) => `<span style="height:1em;display:block">${i % 10}</span>`).join("")}</span></span>`);
    num.append(wrap);
    return { inner: wrap.firstElementChild, target: Number(d) };
  });
  const sub = kline("across *8 channels*, in one inbox", V ? 60 : 64);
  sub.classList.add("abs");
  const stamp = el(`<div class="abs stamp" style="font-size:${V ? 16 : 17}px;transform-origin:50% 50%"><div>Demo workspace</div><div>· Illustrative numbers ·</div></div>`);
  root.append(top, num, sub, stamp);

  // 7-day line
  const cw = V ? 900 : 1200;
  const ch = V ? 200 : 170;
  const pts = BY_DAY.map((v, i) => ({ x: (i * cw) / 6, y: ch - 20 - (v / 1400) * (ch - 40) }));
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += `C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x} ${p2.y}`;
  }
  const chart = el(`<svg class="abs" width="${cw}" height="${ch + 30}" viewBox="0 -4 ${cw} ${ch + 30}" style="overflow:visible">
    <defs><linearGradient id="ng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9CCB7A" stop-opacity=".5"/><stop offset="1" stop-color="#9CCB7A" stop-opacity="0"/></linearGradient><clipPath id="ncl"><rect class="clr" x="-10" y="-10" width="0" height="${ch + 40}"/></clipPath></defs>
    <path d="${d}L${cw} ${ch}L0 ${ch}Z" fill="url(#ng)" clip-path="url(#ncl)"/>
    <path class="ln" d="${d}" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" pathLength="1"/>
    ${DAYS.map((dd, i) => `<text x="${pts[i].x}" y="${ch + 24}" text-anchor="middle" font-family="Geist Mono" font-size="15" fill="var(--ink-soft)" letter-spacing="0.08em">${dd.toUpperCase()}</text>`).join("")}
  </svg>`);
  root.append(chart);
  const ln = chart.querySelector(".ln");
  const clr = chart.querySelector(".clr");

  if (V) {
    top.style.top = "430px";
    num.style.top = "500px";
    Object.assign(sub.style, { left: "0", width: `${W}px`, top: "800px" });
    sub.style.whiteSpace = "normal";
    Object.assign(stamp.style, { left: `${cx - 200}px`, top: "1000px" });
    Object.assign(chart.style, { left: `${(W - cw) / 2}px`, top: "1250px" });
  } else {
    top.style.top = "150px";
    num.style.top = "210px";
    Object.assign(sub.style, { left: "0", width: `${W}px`, top: "560px" });
    Object.assign(stamp.style, { right: "150px", top: "190px" });
    Object.assign(chart.style, { left: `${(W - cw) / 2}px`, top: "760px" });
  }

  const t0 = T.numbers;
  function render(t) {
    set(top, { o: p(t, t0, 0.2) });
    cols.forEach((c, i) => {
      if (!c) return;
      const q = p(t, t0 + 0.02 + i * 0.06, 1.1, ease.out);
      const spins = 1 + Math.ceil(i / 2);
      const pos = c.target + 10 * spins * (1 - q);
      c.inner.style.transform = `translate(0, ${(-(pos % 10)).toFixed(4)}em)`;
    });
    set(num, { s: 1 + 0.12 * (1 - spring(t, t0, { k: 300, c: 22 })), o: p(t, t0, 0.05, ease.linear) });
    // variable weight: thin while the reels spin, a heavy hit as they land, then relax to Light 300
    const land = t0 + 1.0;
    const wgt = t < land ? lerp(120, 200, p(t, t0, 1.0)) : lerp(640, 300, p(t, land, 0.7, ease.out));
    num.style.fontWeight = String(Math.round(wgt));
    lettersIn(sub, t, t0 + BEAT, { stagger: 0.015, d: 0.4 });
    const sq = slam(stamp, t, t0 + 2 * BEAT, { from: 1.8, k: 520, c: 26, r: -14 });
    set(stamp, { s: lerp(1.8, 1, sq), r: lerp(-20, -6, sq), o: t >= t0 + 2 * BEAT ? 1 : 0 });
    const cq = p(t, t0 + 0.1, 1.4, ease.travel);
    ln.style.strokeDasharray = `${cq.toFixed(4)} 2`;
    ln.style.visibility = cq > 0.002 ? "visible" : "hidden"; // no round-cap dot at zero length
    clr.setAttribute("width", String((cq * (cw + 20)).toFixed(1)));
  }

  return { root, render, t0: T.numbers - 0.3, t1: T.end };
}
