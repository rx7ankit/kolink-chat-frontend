/**
 * 7.87 – 11.80 s · THE TURN. A breath on calm paper: "What if you posted *once*?"
 * On the riser the koLink mark draws itself, the eight app icons are pulled into it, it becomes
 * the hub, the hub stretches into one pill input bar, Publish is pressed on the "and" before the
 * drop and the bar snaps into the green POST capsule.
 */
import { BAR, BEAT, T, beat } from "../timing.js";
import { clamp, ease, impulse, kline, lerp, lettersIn, p, set, spring } from "../kit.js";
import { LOGO_PATHS, tile } from "../../lib/brand.js";
import { el, typeSchedule, typed } from "../../lib/ui.js";

const IDS = ["instagram", "facebook", "messenger", "whatsapp", "threads", "x", "linkedin", "gmail"];
export const POST_TEXT = "Linen drop is live 🌿 Comment LINK for early access.";

/** Where the capsule sits at the drop (the post scene starts from here). */
export const capsuleAt = (W, H) => ({ x: W / 2, y: H / 2, w: 120, h: 52 });

export function buildTurn({ W, H, V }) {
  const root = el(`<section class="scene"></section>`);
  const cx = W / 2;
  const cy = H / 2;
  const t0 = T.turn;

  /* "What if you posted once?" */
  const q = el(`<div class="abs" style="left:0;width:${W}px;text-align:center"></div>`);
  const qLines = V ? ["What if you", "posted *once*?"] : ["What if you posted *once*?"];
  const qSize = V ? 132 : 150;
  qLines.forEach((s) => q.append(kline(s, qSize)));
  q.style.top = `${cy - (qLines.length * qSize) / 2 - (V ? 40 : 20)}px`;
  root.append(q);
  const qWords = [...q.querySelectorAll(".kw")];
  const onceWord = qWords.find((w) => w.classList.contains("em"));
  const under = el(`<span class="abs" style="left:0.04em;right:0.04em;bottom:-0.06em;height:6px;border-radius:3px;background:var(--accent)"></span>`);
  onceWord.style.position = "relative";
  onceWord.append(under);

  /* the mark */
  const markH = V ? 190 : 200;
  const mark = el(`<svg class="abs" viewBox="0 0 681 550" style="left:${cx - (markH * 681) / 550 / 2}px;top:${cy - markH / 2}px;height:${markH}px;width:${(markH * 681) / 550}px;overflow:visible">${LOGO_PATHS.map((d) => `<path d="${d}" fill="var(--ink)" class="mf"/>`).join("")}${LOGO_PATHS.map((d) => `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="14" stroke-linejoin="round" pathLength="1" class="ms"/>`).join("")}</svg>`);
  root.append(mark);
  const fills = [...mark.querySelectorAll(".mf")];
  const strokes = [...mark.querySelectorAll(".ms")];
  const ring = el(`<div class="abs" style="left:${cx - 60}px;top:${cy - 60}px;width:120px;height:120px;border-radius:50%;background:var(--surface);box-shadow:inset 0 0 0 3px var(--ink),0 0 0 8px var(--bg),0 20px 40px -18px rgba(38,43,38,.3)"></div>`);
  root.insertBefore(ring, mark);

  /* the eight apps get pulled in */
  const tiles = IDS.map((id, i) => {
    const a = (i / 8) * Math.PI * 2 + 0.4;
    const n = el(`<div class="abs" style="left:-60px;top:-60px;width:120px;height:120px">${tile(id, 120, 0.26)}</div>`);
    root.append(n);
    return { n, a, d: Math.hypot(W, H) * 0.62 };
  });

  /* the pill bar */
  const BW = V ? 960 : 1320;
  const BH = V ? 120 : 104;
  const bar = el(`<div class="abs composer" style="left:${cx - BW / 2}px;top:${cy - BH / 2}px;width:${BW}px;height:${BH}px;border-radius:${BH / 2}px;box-shadow:var(--shadow-lg)"></div>`);
  const inner = el(`<div class="row" style="position:absolute;inset:0;padding:0 16px 0 20px;gap:18px"><span class="avatar" style="width:${BH - 36}px;height:${BH - 36}px;font-size:${(BH - 36) * 0.56}px">N</span><div style="flex:1;min-width:0;font-size:${V ? 30 : 33}px;font-weight:300;letter-spacing:-0.02em;white-space:nowrap;overflow:hidden"><span class="tx"></span><span class="caret" style="height:38px"></span></div><span class="btn pub" style="height:${BH - 28}px;padding:0 30px;font-size:24px">Publish</span></div>`);
  bar.append(inner);
  root.append(bar);
  const tx = inner.querySelector(".tx");
  const caret = inner.querySelector(".caret");
  const pub = inner.querySelector(".pub");
  const sched = typeSchedule(POST_TEXT, 0.42, 5);

  const tRiser = T.riser;
  const tPull = tRiser + beat(1); // 10.33
  const tHub = tRiser + beat(2.5); // 11.06
  const tBar = tHub + 0.06;
  const tPress = T.drop - BEAT / 2; // 11.557
  const tSnap = tPress + 0.06;

  function render(t) {
    /* question: one word per beat, calm rise; leaves on the riser */
    qWords.forEach((w, i) => {
      const tw = t0 + [0, 0, 0, 1, 2, 2][Math.min(i, 5)] * BEAT + (i < 3 ? i * 0.07 : 0);
      w.querySelectorAll(".ci").forEach((c, j) => {
        const s = spring(t, tw + j * 0.018, { k: 200, c: 22 });
        const out = p(t, tRiser + j * 0.006 + i * 0.03, 0.3, ease.in);
        c.style.transform = `translate(0, ${((1 - s) * 105 - out * 140).toFixed(2)}%)`;
        c.style.opacity = t >= tw ? "1" : "0";
      });
    });
    under.style.clipPath = `inset(0 ${((1 - p(t, t0 + beat(3), 0.6, ease.travel)) * 100).toFixed(1)}% 0 0)`;
    set(under, { o: 1 - p(t, tRiser, 0.25) });

    /* mark draws on the riser, swallows the apps, shrinks into the hub */
    const md = p(t, tRiser + 0.05, 0.55, ease.travel);
    strokes.forEach((s, i) => {
      const q2 = p(t, tRiser + 0.05 + i * 0.1, 0.55, ease.travel);
      s.style.strokeDasharray = "1 1";
      s.style.strokeDashoffset = (1 - q2).toFixed(4);
      s.style.opacity = (1 - p(t, tRiser + 0.6 + i * 0.1, 0.3)).toFixed(3);
    });
    fills.forEach((f, i) => (f.style.opacity = p(t, tRiser + 0.4 + i * 0.1, 0.35).toFixed(3)));
    const gulp = impulse(t, tiles.map((_, i) => tPull + i * 0.06 + 0.3), { decay: 14, amp: 0.05 });
    const shrink = p(t, tHub - 0.1, 0.3, ease.out);
    const ms = lerp(1, 0.3, shrink) * (1 + gulp);
    set(mark, { s: ms, o: (md > 0 ? 1 : 0) * (1 - p(t, tBar + 0.05, 0.1)) });
    const rs = spring(t, tHub - 0.05, { k: 380, c: 22 });
    set(ring, { s: rs * (1 - p(t, tBar + 0.02, 0.12)), o: t >= tHub - 0.05 && t < tBar + 0.14 ? 1 : 0 });

    tiles.forEach(({ n, a, d }, i) => {
      const ti = tPull + i * 0.06;
      const q2 = p(t, ti, 0.3, ease.in);
      const ang = a + q2 * 1.4;
      const rr = d * (1 - q2);
      const x = cx + Math.cos(ang) * rr;
      const y = cy + Math.sin(ang) * rr * (V ? 1.2 : 0.8);
      set(n, { x, y, s: lerp(1, 0.12, q2), r: q2 * 220, o: t >= ti - 0.25 && q2 < 1 ? 1 : 0 });
      if (t >= ti - 0.25 && t < ti) {
        // approach from outside the frame during the beat before
        const q0 = p(t, ti - 0.25, 0.25, ease.out);
        set(n, { x: cx + Math.cos(a) * d * (1.6 - 0.6 * q0), y: cy + Math.sin(a) * d * (V ? 1.2 : 0.8) * (1.6 - 0.6 * q0), s: 1, r: 0, o: 1 });
      }
    });

    /* hub → pill bar → POST capsule */
    const open = p(t, tBar, 0.3, ease.out);
    const snap = p(t, tSnap, 0.2, ease.travel);
    const w = t < tSnap ? lerp(120, BW, open) : lerp(BW, 120, snap);
    const h = t < tSnap ? lerp(120, BH, open) : lerp(BH, 52, snap);
    bar.style.width = `${w}px`;
    bar.style.height = `${h}px`;
    bar.style.left = `${cx - w / 2}px`;
    bar.style.top = `${cy - h / 2}px`;
    bar.style.borderRadius = `${h / 2}px`;
    const green = p(t, tSnap + 0.05, 0.12);
    bar.style.background = green > 0 ? `color-mix(in oklab, var(--accent) ${(green * 100).toFixed(0)}%, var(--surface))` : "var(--surface)";
    bar.style.borderColor = green > 0.5 ? "var(--accent)" : "var(--line)";
    set(bar, { o: t >= tBar ? 1 : 0 });
    set(inner, { o: p(t, tBar + 0.12, 0.1) * (1 - p(t, tSnap, 0.08)) });
    tx.textContent = typed(sched, t, tBar + 0.1);
    caret.style.opacity = t > tBar + 0.1 && t < tPress ? "1" : "0";
    const press = p(t, tPress - 0.06, 0.06) * (1 - p(t, tPress + 0.02, 0.1));
    set(pub, { s: 1 - 0.1 * press });
  }

  return { root, render, t0: T.turn, t1: T.drop + 0.02 };
}
