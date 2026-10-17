/**
 * 7.87 – 11.80 s · THE TURN.
 * Breath bar: "What if you posted once?" pulls into focus word by word (rack focus); then everything
 * but "once" drifts slightly out of focus (selective focus).
 * Riser bar: the eight channel tiles return and set each other off in a chain (Config "activation"),
 * snapping into one line; the line becomes the composer pill (match cut). The post types, a cursor
 * glides in and hovers Publish, the camera creeps then snaps into a macro on the button (speed ramp),
 * click on the "and" before the drop — the green button is the POST capsule (match cut to the drop).
 */
import { BEAT, T, beat } from "../timing.js";
import { kline } from "../../v2/kit.js";
import { boxIn, clamp, ease, focus, keyed, lerp, makeCursor, p, ramp, set, spring } from "../kit3.js";
import { tile } from "../../lib/brand.js";
import { el, typeSchedule, typed } from "../../lib/ui.js";

const IDS = ["instagram", "facebook", "messenger", "whatsapp", "threads", "x", "linkedin", "gmail"];
export const POST_TEXT = "Linen drop is live 🌿 Comment LINK for early access.";

/** The macro ends with the Publish button, ×2.6, centred: the post scene's capsule starts from this box. */
export const MACRO = { s: 2.6 };
export const macroBox = (V) => ({ w: 170 * MACRO.s, h: (V ? 88 : 76) * MACRO.s });

export function buildTurn({ W, H, V }) {
  const root = el(`<section class="scene"></section>`);
  const inner = el(`<div class="abs" style="left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0"></div>`);
  root.append(inner);
  const cx = W / 2;
  const cy = H / 2;
  const t0 = T.turn;
  const tR = T.riser;

  /* the question */
  const q = el(`<div class="abs" style="left:0;width:${W}px;text-align:center"></div>`);
  const qLines = V ? ["What if you", "posted *once*?"] : ["What if you posted *once*?"];
  const qSize = V ? 140 : 156;
  qLines.forEach((s) => q.append(kline(s, qSize, { cls: "free" })));
  q.style.top = `${cy - (qLines.length * qSize) / 2 - (V ? 40 : 20)}px`;
  inner.append(q);
  const qWords = [...q.querySelectorAll(".kw")];
  const onceWord = qWords.find((w) => w.classList.contains("em"));
  const under = el(`<span class="abs" style="left:0.04em;right:0.04em;bottom:-0.06em;height:7px;border-radius:4px;background:var(--accent)"></span>`);
  onceWord.style.position = "relative";
  onceWord.append(under);
  const WORD_BEAT = [0, 0.5, 1, 2, 3, 3];

  /* the eight tiles → one line */
  const TS = V ? 104 : 104;
  const gap = 18;
  const rowW = 8 * TS + 7 * gap;
  const tiles = IDS.map((id, i) => {
    const n = el(`<div class="abs" style="left:${-TS / 2}px;top:${-TS / 2}px;width:${TS}px;height:${TS}px">${tile(id, TS, 0.26)}</div>`);
    n.firstElementChild.style.boxShadow = "0 18px 36px -18px rgba(38,43,38,.35)";
    inner.append(n);
    const gx = V ? cx + ((i % 2) - 0.5) * 260 : cx + ((i % 4) - 1.5) * 230;
    const gy = V ? cy + (Math.floor(i / 2) - 1.5) * 220 : cy + (Math.floor(i / 4) - 0.5) * 230;
    const rx = V ? cx + (i - 3.5) * ((W - 120) / 8) : cx - rowW / 2 + TS / 2 + i * (TS + gap);
    return { n, gx, gy, rx };
  });

  /* the composer pill */
  const BW = V ? 980 : 1320;
  const BH = V ? 116 : 104;
  const bar = el(`<div class="abs composer" style="left:${cx - BW / 2}px;top:${cy - BH / 2}px;width:${BW}px;height:${BH}px;border-radius:${BH / 2}px;box-shadow:var(--shadow-lg)"></div>`);
  const row = el(`<div class="row" style="position:absolute;inset:0;padding:0 14px 0 20px;gap:18px"><span class="avatar" style="width:${BH - 36}px;height:${BH - 36}px;font-size:${(BH - 36) * 0.56}px">N</span><div style="flex:1;min-width:0;font-size:${V ? 27 : 33}px;font-weight:300;letter-spacing:-0.02em;white-space:nowrap;overflow:hidden"><span class="tx"></span><span class="caret" style="height:38px"></span></div></div>`);
  const pub = el(`<span class="btn" style="height:${BH - 28}px;width:170px;padding:0;font-size:24px;flex:none;position:relative;overflow:hidden"><span class="lbl">Publish</span></span>`);
  row.append(pub);
  bar.append(row);
  inner.append(bar);
  const tx = row.querySelector(".tx");
  const caret = row.querySelector(".caret");
  const lbl = pub.querySelector(".lbl");
  const sched = typeSchedule(POST_TEXT, 0.42, 5);
  const cursor = makeCursor(inner, { scale: 1 });

  const tChain = tR + beat(0.5); // 10.08
  const tLine = tR + beat(1.5); // 10.57
  const tBar = tR + beat(2); // 10.82
  const tPress = T.drop - BEAT / 2; // 11.557
  let pb = null;

  function render(t) {
    if (!pb) {
      const b = boxIn(pub, inner);
      pb = { x: b.x + b.w / 2, y: b.y + b.h / 2, w: b.w, h: b.h };
    }
    /* rack focus, word by word */
    qWords.forEach((w, i) => {
      const tw = t0 + WORD_BEAT[Math.min(i, WORD_BEAT.length - 1)] * BEAT;
      const isOnce = w === onceWord;
      const blur = keyed(t, [
        [tw - 0.01, 18],
        [tw + 0.45, 0],
        [t0 + beat(3.2), 0],
        [t0 + beat(3.8), isOnce ? 0 : 2.6],
        [tR - 0.05, isOnce ? 0 : 2.6],
        [tR + 0.3, 14],
      ]);
      w.style.filter = blur < 0.15 ? "none" : `blur(${blur.toFixed(2)}px)`;
      const s = lerp(1.08, 1, p(t, tw, 0.6, ease.out));
      w.style.transform = `scale(${s.toFixed(4)})`;
      w.style.opacity = (t >= tw - 0.01 ? (isOnce ? 1 : lerp(1, 0.5, p(t, t0 + beat(3.2), 0.6))) : 0) * (1 - p(t, tR + 0.05, 0.3));
    });
    under.style.clipPath = `inset(0 ${((1 - p(t, t0 + beat(3), 0.6, ease.travel)) * 100).toFixed(1)}% 0 0)`;

    /* activation chain: tiles appear in a grid on the riser, then knock each other into one line */
    tiles.forEach(({ n, gx, gy, rx }, i) => {
      const tin = tR + i * 0.03;
      const sIn = spring(t, tin, { k: 380, c: 22 });
      const tHit = tChain + i * beat(0.125);
      const go = spring(t, tHit, { k: 420, c: 26 });
      // a neighbour's hit gives a small kick (the chain)
      const kick = i > 0 ? Math.max(0, Math.sin(clamp((t - (tHit - 0.06)) / 0.12) * Math.PI)) * 0.08 : 0;
      const collapse = p(t, tLine + 0.05, 0.22, ease.in);
      const x = lerp(gx, rx, go);
      const y = lerp(gy, cy, go);
      set(n, { x, y, s: lerp(0.4, 1, sIn) * (1 + kick) * (1 - collapse), r: (1 - go) * (i % 2 ? 8 : -8), o: t >= tin && t < tBar + 0.1 ? 1 : 0 });
    });

    /* the line becomes the pill (match cut), then the post types itself */
    const open = p(t, tBar - 0.12, 0.32, ease.out);
    const w = lerp(V ? W - 120 : rowW, BW, open);
    const h = lerp(TS, BH, open);
    bar.style.width = `${w}px`;
    bar.style.height = `${h}px`;
    bar.style.left = `${cx - w / 2}px`;
    bar.style.top = `${cy - h / 2}px`;
    set(bar, { o: t >= tBar - 0.12 ? 1 : 0 });
    set(row, { o: p(t, tBar + 0.05, 0.12) });
    tx.textContent = typed(sched, t, tBar + 0.08);
    caret.style.opacity = t > tBar + 0.05 && t < tPress ? "1" : "0";

    /* cursor: glides in, hovers Publish (hand), clicks on the "and" */
    const enterX = V ? cx + 300 : cx + 560;
    const enterY = V ? cy + 420 : cy + 330;
    cursor.render(t, [
      [tBar + 0.15, enterX, enterY, { hand: false }],
      [tPress - 0.22, pb.x + 18, pb.y + 10, { hand: true }],
      [tPress, pb.x + 18, pb.y + 10, { click: true }],
      [T.drop + 0.05, pb.x + 18, pb.y + 10, { out: true }],
    ]);
    const hover = p(t, tPress - 0.26, 0.12);
    pub.style.background = `color-mix(in oklab, var(--accent) ${(100 - hover * 14).toFixed(0)}%, #000)`;
    const press = p(t, tPress - 0.05, 0.05) * (1 - p(t, tPress + 0.03, 0.12));
    pub.style.transform = `scale(${(1 - 0.06 * press).toFixed(3)})`;
    lbl.style.opacity = (1 - p(t, tPress + 0.06, 0.1)).toFixed(3);
    row.querySelector(".avatar").style.opacity = (1 - p(t, tPress + 0.04, 0.1)).toFixed(3);
    row.firstElementChild.nextElementSibling.style.opacity = (1 - p(t, tPress + 0.04, 0.1)).toFixed(3);
    bar.style.background = t > tPress + 0.06 ? `rgba(255,255,255,${(1 - p(t, tPress + 0.06, 0.1)).toFixed(3)})` : "var(--surface)";
    bar.style.borderColor = t > tPress + 0.06 ? "transparent" : "var(--line)";
    bar.style.boxShadow = t > tPress + 0.06 ? "none" : "var(--shadow-lg)";

    /* macro: creep, then snap into the button (speed ramp) */
    const z = ramp.slowFast(clamp((t - (tPress - 0.55)) / 0.62));
    const s = lerp(1, MACRO.s, z);
    const fx = lerp(cx, pb.x, ease.cam(clamp((t - (tPress - 0.6)) / 0.6)));
    const fy = lerp(cy, pb.y, ease.cam(clamp((t - (tPress - 0.6)) / 0.6)));
    inner.style.transform = `translate(${(cx - fx * s).toFixed(2)}px, ${(cy - fy * s).toFixed(2)}px) scale(${s.toFixed(4)})`;
    focus(bar, t, [[tPress - 0.3, 0], [tPress, 0]]);
  }

  return { root, render, t0: T.turn, t1: T.drop + 0.01 };
}
