/**
 * 16 – 17 s · THE SWITCH SORTS. The hub's points flip three times; three lines leave it and a
 * legend glyph rides each one: automation (periwinkle diamond), AI agent (pistachio circle),
 * your team (ink rounded square).
 */
import { ease, lerp, p, set, spring } from "../lib/anim.js";
import { glyph } from "../lib/brand.js";
import { pointAt, polyline } from "../lib/geometry.js";
import { el, headline, revealWords } from "../lib/ui.js";
import { hubPath } from "./hub.js";

const DESTS = [
  ["automation", "Automation", "Keyword comment → reply + DM"],
  ["agent", "AI agent", "Answers DMs from your knowledge"],
  ["team", "Your team", "Everything else, in one inbox"],
];

export function buildSort({ V, W, H }) {
  const root = el(`<section class="scene"></section>`);
  const HP = hubPath(V)[4];
  const h = { x: HP[1], y: HP[2] };
  const svg = el(`<svg class="abs" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="left:0;top:0;overflow:visible"></svg>`);
  root.append(svg);

  const hl = headline(["Every reply,", "*sorted.*"], { size: V ? 92 : 76 });
  hl.classList.add("abs");
  Object.assign(hl.style, V ? { left: "72px", top: "250px" } : { left: "120px", top: "150px" });
  root.append(hl);

  const dy = V ? 300 : 230;
  const x1 = V ? h.x : h.x + 160;
  const tx = V ? 0 : 1010;
  const rows = DESTS.map(([kind, title, desc], i) => {
    const off = (i - 1) * dy;
    let pts;
    let end;
    if (V) {
      // Vertical: lines drop down from the hub and fan to three stops on the left margin.
      // Vertical: one line down the left margin with three stops.
      end = { x: h.x, y: 1000 + i * 250 };
      pts = [h, end];
    } else {
      end = { x: tx, y: h.y + off };
      pts = i === 1 ? [h, end] : [h, { x: x1, y: h.y }, { x: x1 + Math.abs(off), y: h.y + off }, end];
    }
    const route = polyline(pts, 22);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", route.d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "var(--ink)");
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("pathLength", "1");
    svg.append(path);
    const term = el(`<div class="abs row" style="left:${end.x - 34}px;top:${end.y - 34}px;gap:26px"><span class="roundel" style="width:68px;height:68px;box-shadow:inset 0 0 0 2.5px var(--ink)">${glyph(kind, 28, 1.5)}</span><div class="col" style="gap:8px"><span class="mono" style="font-size:${V ? 20 : 17}px;color:var(--ink)">${title}</span><span style="font-size:${V ? 34 : 32}px;font-weight:300;letter-spacing:-0.03em">${desc}</span></div></div>`);
    const pk = el(`<div class="abs" style="left:-16px;top:-16px">${glyph(kind, 26, 2)}</div>`);
    root.append(term, pk);
    return { path, route, term, pk };
  });

  function render(t) {
    const out = p(t, 16.76, 0.22, ease.in);
    set(root, { x: V ? 0 : -140 * out, o: 1 - out });
    revealWords(hl, t, 16.05, { stagger: 0.06, tOut: 16.64, dOut: 0.24 });
    rows.forEach(({ path, route, term, pk }, i) => {
      const dq = p(t, 16.05 + i * 0.05, 0.35, ease.out);
      path.style.strokeDasharray = `${dq.toFixed(4)} 2`;
      const ts = spring(t, 16.2 + i * 0.08, { k: 380, c: 24 });
      set(term, { x: (1 - ts) * 24, o: p(t, 16.2 + i * 0.08, 0.16, ease.linear) });
      const dep = 16.2 + i * 0.15;
      const ride = p(t, dep, 0.45, ease.travel);
      const q = pointAt(route, ride);
      const vis = t >= dep && t < dep + 0.44;
      set(pk, { x: q.x, y: q.y, s: vis ? lerp(0.6, 1, p(t, dep, 0.15)) : 0, o: vis ? 1 : 0 });
      // The terminal takes the packet with a small bump.
      const dt = t - (dep + 0.45);
      const bump = dt > 0 && dt < 0.6 ? Math.exp(-dt * 9) * Math.sin(dt * 26) * 0.08 : 0;
      const rd = term.firstElementChild;
      set(rd, { s: 1 + bump });
      rd.style.background = t >= dep + 0.45 ? "var(--bg-alt)" : "var(--surface)";
    });
  }

  return { root, render, t0: 15.95, t1: 17.3 };
}
