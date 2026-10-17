/**
 * 11.80 – 17.70 s · "Post once." On the drop the POST capsule bursts and five native posts fly out
 * of it in 3D, landing on sixteenth notes (Instagram Reel playing, Facebook Page, Threads, X,
 * LinkedIn text-only). Bar 2: the camera dollies across the posts. Bar 3: the first replies pop
 * out of every post — then a ring irises into the inbox.
 */
import { BEAT, T, beat } from "../timing.js";
import { ease, kline, lerp, lettersIn, p, set, spring, tilt } from "../kit.js";
import { glyph, tile } from "../../lib/brand.js";
import { fbPost, igReel, linkedinPost, setCounts, threadsPost, xPost } from "../../lib/mockups.js";
import { el } from "../../lib/ui.js";

export const POST_REPLIES = [
  ["instagram", "link pls 🙏"],
  ["facebook", "LINK"],
  ["threads", "the sage one 😍"],
  ["x", "is the queen size back too?"],
  ["linkedin", "Do you supply boutique hotels?"],
];

export function buildPost({ W, H, V, reel }) {
  const root = el(`<section class="scene"></section>`);
  const cx = W / 2;
  const cy = H / 2;

  const hlWrap = el(`<div class="abs" style="left:0;width:${W}px;text-align:center;top:${V ? 210 : 70}px"></div>`);
  const hl = kline("Post once.", V ? 210 : 230, { cls: "free" });
  hl.style.display = "inline-block";
  hl.style.transformOrigin = "0 0";
  hlWrap.append(hl);
  root.append(hlWrap);

  const caption = el(`<div class="abs mlabel" style="left:${V ? 60 : 90}px;bottom:${V ? 300 : 56}px;font-size:${V ? 20 : 18}px;color:var(--ink)"></div>`);
  root.append(caption);
  const CAP = "One composer → Instagram · Facebook · Threads · X · LinkedIn (text)";

  const row = el(`<div class="abs" style="left:0;top:0;width:${W}px;height:${H}px;transform-origin:50% 55%"></div>`);
  root.append(row);
  const cw = V ? 320 : 316;
  const SLOTS = V
    ? [
        [40, 520],
        [380, 520],
        [720, 520],
        [720, 1040],
        [40, 1112],
      ]
    : Array.from({ length: 5 }, (_, i) => [90 + i * (cw + 40), 370]);
  const makers = [() => igReel(cw), () => fbPost(cw), () => threadsPost(cw), () => xPost(cw), () => linkedinPost(cw)];
  const ids = ["instagram", "facebook", "threads", "x", "linkedin"];
  const cards = makers.map((mk, i) => {
    const wrap = el(`<div class="abs" style="left:${SLOTS[i][0]}px;top:${SLOTS[i][1]}px;width:${cw}px;transform-origin:50% 0%"></div>`);
    const card = mk();
    const badge = el(`<span class="abs" style="left:-14px;top:-14px;z-index:2">${tile(ids[i], 44)}</span>`);
    wrap.append(card, badge);
    row.append(wrap);
    const [rid, txt] = POST_REPLIES[i];
    const chip = el(`<div class="abs reply" style="left:${SLOTS[i][0] + (V ? 10 : 24)}px;top:${SLOTS[i][1] - (V ? 70 : 64)}px;font-size:${V ? 21 : 19}px;padding:10px 16px 10px 10px;max-width:${V ? 300 : 300}px;z-index:3">${glyph("incoming", 16, 1.5)}<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:${V ? 240 : 250}px">${txt}</span></div>`);
    void rid;
    row.append(chip);
    return { wrap, card, badge, chip, canvas: card.querySelector("canvas"), x: SLOTS[i][0] + cw / 2, y: SLOTS[i][1] };
  });

  const capsule = el(`<div class="abs" style="left:${cx - 60}px;top:${cy - 26}px;width:120px;height:52px;border-radius:26px;background:var(--accent)"></div>`);
  root.append(capsule);

  const tD = T.drop;
  const tBar2 = tD + 4 * BEAT; // 13.77
  const tBar3 = tD + 8 * BEAT; // 15.74

  function render(t) {
    /* capsule bursts */
    const burst = p(t, tD, 0.18, ease.out);
    set(capsule, { s: lerp(1, 2.2, burst), o: 1 - burst });

    /* headline pops on the drop, leaves on bar 2 */
    lettersIn(hl, t, tD, { stagger: 0.035, d: 0.5, mode: "pop" });
    // slam, then settle into the top-left corner as the camera starts to move
    const settle = spring(t, tBar2 - 0.15, { k: 170, c: 20 });
    const sc0 = 1 + 0.25 * (1 - spring(t, tD, { k: 300, c: 22 }));
    const tx = ((V ? 60 : 90) - hl.offsetLeft) * settle;
    const ty = (V ? -80 : -24) * settle;
    hl.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${(sc0 * lerp(1, V ? 0.42 : 0.36, settle)).toFixed(4)})`;

    /* camera on the row: settle → dolly across (bar 2) → pull back (bar 3) */
    const dolly = p(t, tBar2 - 0.1, 2.0, ease.cam);
    const back = p(t, tBar3 - 0.05, 0.6, ease.out);
    const Z = V ? 1.22 : 1.34;
    const sc = lerp(1, Z, dolly) * lerp(1, 1 / Z, back);
    const panX = V ? 0 : lerp(440, -440, dolly) * (1 - back);
    const panY = V ? lerp(260, -300, dolly) * (1 - back) : lerp(-60, -150, dolly) * (1 - back) + (1 - back) * -0;
    const ry = V ? 0 : lerp(7, -7, dolly) * (1 - back);
    const rx = 6 * back * p(t, T.reply - 0.6, 0.5);
    row.style.transform = tilt({ x: panX, y: panY, s: sc, ry, rx, persp: 2200 });

    /* five posts fly out of the capsule on sixteenth notes */
    cards.forEach((c, i) => {
      const tl = tD + i * BEAT * 0.25;
      const s = spring(t, tl, { k: 240, c: 19 });
      const fromX = cx - c.x;
      const fromY = cy - c.y - 120;
      const side = (i - 2) / 2;
      c.wrap.style.transform = tilt({ x: fromX * (1 - s), y: fromY * (1 - s), s: lerp(0.18, 1, s), rx: 55 * (1 - s), ry: -35 * side * (1 - s), rz: -8 * side * (1 - s) });
      set(c.badge, { s: spring(t, tl + 0.12, { k: 520, c: 24 }) });
      c.wrap.style.opacity = t >= tl ? Math.min(1, (t - tl) / 0.05).toFixed(3) : "0";
      setCounts(c.card, p(t, tl + 0.4, 4.2, ease.out));
      if (c.canvas) reel.draw(c.canvas, t - tD);
      // first replies pop out of every post on bar 3
      const tc = tBar3 + i * BEAT * 0.5;
      const cs = spring(t, tc, { k: 420, c: 22 });
      set(c.chip, { y: (1 - cs) * 30 - p(t, tc, 2.4, ease.out) * 14, s: lerp(0.6, 1, cs), o: t >= tc ? 1 : 0 });
    });

    /* caption types on bar 2 */
    const n = Math.round(Array.from(CAP).length * p(t, tBar2 + 0.1, 0.8, ease.linear));
    caption.textContent = Array.from(CAP).slice(0, n).join("");
    set(caption, { o: 1 - p(t, T.reply - 0.4, 0.3) });
  }

  return { root, render, t0: T.drop - 0.01, t1: T.reply + 0.3 };
}
