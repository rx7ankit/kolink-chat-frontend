/**
 * 0 – 7.87 s · HOOK. Words land on every other kick at the speed of perception, and each one is
 * animated as what it means (Apple "Don't Blink"):
 *   "8 apps."              mosaic of eight channel tiles, then a rack focus pulls them back behind the word
 *   "200 comments."        the number counts up while a comment feed races by out of focus
 *   "the same question,"   macro on one "price?" bubble → speed-ramped pull-back to a wall of forty
 *   "forty times a day."   the wall lights up bubble by bubble, ×1 → ×40
 *   "3am DMs."             03:12, notifications stack in sharp over the blurred wall
 *   "Missed replies."      the letters of "replies." fall away; the notifications grey out
 *   "Missed sales."        tabs double every beat, badges hit 99+, the frame shakes — hard cut.
 */
import { beat, T } from "../timing.js";
import { impulse, kline, lettersIn, slam } from "../../v2/kit.js";
import { clamp, ease, focus, keyed, lerp, p, ramp, set, spring, weightPulse } from "../kit3.js";
import { mulberry32 } from "../../lib/anim.js";
import { icon, tile } from "../../lib/brand.js";
import { el } from "../../lib/ui.js";

const IDS = ["instagram", "facebook", "messenger", "whatsapp", "threads", "x", "linkedin", "gmail"];
const NAMES = { instagram: "Instagram", facebook: "Facebook", messenger: "Messenger", whatsapp: "WhatsApp", threads: "Threads", x: "X", linkedin: "LinkedIn", gmail: "Gmail" };

export function buildHook({ W, H, V }) {
  const root = el(`<section class="scene"></section>`);
  const rnd = mulberry32(42);
  const cx = W / 2;
  const cy = H / 2;
  const b = beat;

  /* ---------- 1 · mosaic of eight tiles ---------- */
  const TS = V ? 230 : 210;
  const GAP = V ? 46 : 44;
  const cols = V ? 2 : 4;
  const rows = V ? 4 : 2;
  const gridW = cols * TS + (cols - 1) * GAP;
  const gridH = rows * TS + (rows - 1) * GAP;
  const mosaic = el(`<div class="abs" style="left:${cx - gridW / 2}px;top:${cy - gridH / 2}px;width:${gridW}px;height:${gridH}px;transform-origin:50% 50%"></div>`);
  const mtiles = IDS.map((id, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const n = el(`<div class="abs" style="left:${c * (TS + GAP)}px;top:${r * (TS + GAP)}px;width:${TS}px;height:${TS}px">${tile(id, TS, 0.24)}<span class="badge-red" style="right:-14px;top:-14px;font-size:26px;height:52px;line-height:52px;min-width:52px">${["12", "38", "7", "99+", "21", "4", "63", "15"][i]}</span></div>`);
    n.firstElementChild.style.boxShadow = "0 30px 60px -26px rgba(38,43,38,.4)";
    mosaic.append(n);
    return { n, badge: n.querySelector(".badge-red") };
  });
  root.append(mosaic);

  /* ---------- 2 · comment feed (background, out of focus) ---------- */
  const FEED = [
    ["L", "linen.lover", "link?"],
    ["M", "maya.home", "price??"],
    ["R", "rohan.m", "LINK"],
    ["A", "aanya.makes", "link pls 🙏"],
    ["T", "tara.weaves", "is this available?"],
    ["K", "kavya.r", "size?"],
    ["N", "nikhil.p", "😍😍"],
    ["S", "sana.home", "ship to Pune?"],
    ["D", "dev.k", "link"],
    ["P", "priya.s", "price pls"],
  ];
  const feed = el(`<div class="abs" style="left:0;top:0;width:${W}px;height:${H}px"></div>`);
  const feedCols = (V ? [0.05, 0.36, 0.67] : [0.03, 0.27, 0.51, 0.75]).map((fx, c) => {
    const col = el(`<div class="abs col" style="left:${fx * W}px;top:0;gap:18px"></div>`);
    for (let i = 0; i < 16; i++) {
      const [a, h, txt] = FEED[(i + c * 3) % FEED.length];
      col.append(el(`<div class="fchip"><span class="av">${a}</span><b>${h}</b><span>${txt}</span></div>`));
    }
    feed.append(col);
    return col;
  });
  root.append(feed);

  /* ---------- 3 · wall of forty "price?" ---------- */
  const wallCols = V ? 5 : 8;
  const wallRows = V ? 8 : 5;
  const cellW = V ? 200 : 228;
  const cellH = V ? 210 : 200;
  const wallW = wallCols * cellW;
  const wallH = wallRows * cellH;
  const wall = el(`<div class="abs" style="left:${cx - wallW / 2}px;top:${cy - wallH / 2}px;width:${wallW}px;height:${wallH}px"></div>`);
  const Q = ["price?", "price?", "price??", "price?", "how much?", "price?", "price pls 🙏", "price?"];
  const centerIdx = Math.floor(wallRows / 2) * wallCols + Math.floor(wallCols / 2);
  const bubbles = [];
  for (let i = 0; i < wallCols * wallRows; i++) {
    const c = i % wallCols;
    const r = Math.floor(i / wallCols);
    const text = i === centerIdx ? "price?" : Q[Math.floor(rnd() * Q.length)];
    const bx = c * cellW + cellW / 2 + (rnd() - 0.5) * 30;
    const by = r * cellH + cellH / 2 + (rnd() - 0.5) * 30;
    const n = el(`<div class="abs" style="left:${bx}px;top:${by}px;width:0;height:0"><div class="qb" style="transform:translate(-50%,-50%);left:0;top:0"><span class="dot" style="width:12px;height:12px;border-radius:50%;background:var(--line-strong);flex:none"></span>${text}</div></div>`);
    wall.append(n);
    bubbles.push({ n, dot: n.querySelector(".dot"), x: bx, y: by, order: rnd() });
  }
  // the macro bubble is the centre one; the wall scales about it
  const cB = bubbles[centerIdx];
  wall.style.transformOrigin = `${cB.x}px ${cB.y}px`;
  const order = bubbles.map((bb, i) => ({ i, o: Math.hypot(bb.x - cB.x, bb.y - cB.y) + bb.order * 60 })).sort((a, c) => a.o - c.o);
  order.forEach((o, k) => (bubbles[o.i].rank = k));
  root.append(wall);
  const counter = el(`<div class="abs mono" style="right:${V ? 60 : 90}px;top:${V ? 170 : 80}px;font-size:${V ? 96 : 120}px;color:var(--ink);letter-spacing:0;z-index:11"></div>`);
  root.append(counter);

  /* ---------- 4 · 3am notifications ---------- */
  const NOTIFS = [
    ["instagram", "maya.home", "hii are you open tmrw?"],
    ["whatsapp", "+91 98•• ••• 210", "price?"],
    ["messenger", "Rohan Mehta", "still available??"],
    ["gmail", "Kavya R.", "Re: Bulk order — any update?"],
  ];
  const clock = el(`<div class="abs mono" style="left:0;width:${W}px;text-align:center;top:${V ? 260 : 120}px;font-size:${V ? 150 : 170}px;color:var(--ink);opacity:.12;letter-spacing:0">03:12</div>`);
  root.append(clock);
  const notifs = NOTIFS.map(([id, who, msg], i) => {
    const n = el(`<div class="abs notif" style="left:${cx - 280}px;top:0;z-index:6">${tile(id, 48)}<div class="col" style="gap:3px;min-width:0"><span class="t1">${NAMES[id]} · ${who}</span><span class="t2">${msg}</span></div><span class="tm">now</span></div>`);
    root.append(n);
    return { n, t: [b(8), b(8.5), b(9), b(9.5)][i] };
  });

  /* ---------- 5 · tabs + dots + returning icons ---------- */
  const tabBar = el(`<div class="abs" style="left:0;top:${V ? 120 : 14}px;width:${W}px;height:56px;z-index:8"></div>`);
  const tabs = Array.from({ length: 64 }, (_, i) => {
    const id = IDS[i % 8];
    const tb = el(`<div class="tab">${icon(id, 18)}<span>${NAMES[id]}</span></div>`);
    tabBar.append(tb);
    return tb;
  });
  root.append(tabBar);
  const dots = Array.from({ length: V ? 26 : 34 }, (_, i) => {
    const d = el(`<span class="reddot" style="left:0;top:0;z-index:7"></span>`);
    root.append(d);
    return { d, x: 40 + rnd() * (W - 80), y: 80 + rnd() * (H - 160), t: b(10.5) + i * (b(1.5) / 34) };
  });
  const POS = V
    ? [[0.18, 0.2], [0.82, 0.17], [0.13, 0.8], [0.85, 0.82], [0.5, 0.12], [0.5, 0.88], [0.12, 0.36], [0.88, 0.38]]
    : [[0.13, 0.22], [0.29, 0.8], [0.85, 0.19], [0.72, 0.83], [0.08, 0.6], [0.93, 0.58], [0.43, 0.13], [0.58, 0.9]];
  const tiles = IDS.map((id, i) => {
    const n = el(`<div class="abs" style="left:-62px;top:-62px;width:124px;height:124px;z-index:4">${tile(id, 124, 0.26)}<span class="badge-red" style="right:-16px;top:-16px">99+</span></div>`);
    n.firstElementChild.style.boxShadow = "0 24px 48px -20px rgba(38,43,38,.35)";
    root.append(n);
    return { n, x: POS[i][0] * W, y: POS[i][1] * H, r: (rnd() - 0.5) * 24 };
  });

  /* ---------- words ---------- */
  const WORDS = V
    ? [["8 apps.", 250], ["200|comments.", 196], ["the same|question,", 168], ["*forty times|a day.*", 186], ["3am DMs.", 200], ["Missed|replies.", 200], ["*Missed|sales.*", 250]]
    : [["8 apps.", 320], ["200 comments.", 230], ["the same question,", 172], ["*forty times a day.*", 214], ["3am DMs.", 280], ["Missed replies.", 224], ["*Missed sales.*", 276]];
  const FY = V ? [0.5, 0.5, 0.5, 0.5, 0.62, 0.55, 0.52] : [0.5, 0.5, 0.5, 0.5, 0.66, 0.55, 0.54];
  const words = WORDS.map(([text, size], i) => {
    const lines = text.split("|");
    const box = el(`<div class="abs" style="left:0;width:${W}px;text-align:center;z-index:10"></div>`);
    lines.forEach((ln, j) => {
      let s = ln;
      const open = (lines.slice(0, j).join("|").match(/\*/g) || []).length % 2 === 1;
      if (open && !s.startsWith("*")) s = `*${s}`;
      if ((s.match(/\*/g) || []).length % 2 === 1) s = `${s}*`;
      box.append(kline(s, size, { cls: "free" }));
    });
    box.style.top = `${H * FY[i] - (lines.length * size) / 2}px`;
    box.style.transformOrigin = "50% 50%";
    root.append(box);
    return { box, t0: i === 0 ? b(1) : b(i * 2), t1: i === 6 ? T.turn : b(i * 2 + 2) };
  });
  // "200": the number counts up
  const w200 = words[1].box.querySelector(".kw");
  const digits200 = [...w200.querySelectorAll(".ci")];
  // "replies.": its letters fall away
  const repliesLetters = [...words[5].box.querySelectorAll(".kw")].pop().querySelectorAll(".ci");
  const fallRnd = mulberry32(7);
  const falls = [...repliesLetters].map(() => ({ dx: (fallRnd() - 0.5) * 160, r: (fallRnd() - 0.5) * 120, d: fallRnd() * 0.08 }));

  function render(t) {
    /* words */
    words.forEach(({ box, t0, t1 }, i) => {
      const on = t >= t0 - 0.02 && t < t1;
      if (!on) {
        set(box, { o: 0 });
        return;
      }
      const from = i === 6 ? 1.7 : 1.45;
      const s = slam(box, t, t0, { from, k: 460, c: 27, fade: 0.04 });
      const ex = p(t, t1 - 0.07, 0.07, ease.in);
      set(box, { s: lerp(from, 1, s) * (1 - 0.06 * ex) + impulse(t, [t0 + b(1)], { decay: 12, amp: 0.02 }), o: (1 - ex) * p(t, t0, 0.04, ease.linear) });
      lettersIn(box, t, t0, { stagger: 0.012, d: 0.4 });
      weightPulse(box, t, t0, { peak: 720, rest: 300, stagger: 0.015, d: 0.55 });
    });
    // 200 counts up
    const n200 = Math.round(lerp(0, 200, p(t, b(2), 0.55, ease.out)));
    const str = String(n200).padStart(3, " ");
    digits200.forEach((d, k) => (d.textContent = str[k] === " " ? " " : str[k]));
    // replies. falls apart, letter by letter on 16ths
    if (t >= b(10)) {
      repliesLetters.forEach((c, k) => {
        const tf = b(11) + k * b(0.25) + falls[k].d;
        const q = clamp((t - tf) / 0.55);
        if (q <= 0) return;
        const g = q * q;
        c.style.transform = `translate(${(falls[k].dx * q).toFixed(1)}px, ${(g * 520).toFixed(1)}px) rotate(${(falls[k].r * q).toFixed(1)}deg)`;
        c.style.opacity = (1 - p(t, tf + 0.25, 0.3)).toFixed(3);
        c.style.fontWeight = String(Math.round(lerp(300, 100, q)));
      });
    }

    /* 1 · mosaic: tiles slam on 16ths, badges on the "and", rack focus back as the word lands */
    const mOn = t < b(2.05);
    mtiles.forEach(({ n, badge }, i) => {
      const s = spring(t, i * b(0.125), { k: 360, c: 20 });
      set(n, { s: lerp(0.35, 1, s), r: (i % 2 ? 6 : -6) * (1 - s), o: t >= i * b(0.125) && mOn ? 1 : 0 });
      const bs = spring(t, b(0.5) + i * 0.025, { k: 520, c: 22 });
      set(badge, { s: bs, o: t >= b(0.5) ? 1 : 0 });
    });
    focus(mosaic, t, [[b(0.85), 0], [b(1.1), 9]]);
    set(mosaic, { s: lerp(1, 0.9, p(t, b(0.9), 0.4)) + impulse(t, [0], { decay: 10, amp: 0.04 }), o: mOn ? lerp(1, 0.55, p(t, b(0.9), 0.3)) * (1 - p(t, b(1.8), 0.12)) : 0 });

    /* 2 · feed races by behind "200 comments." */
    const fOn = t >= b(1.85) && t < b(4.05);
    feedCols.forEach((col, c) => {
      const off = (t - b(1.85)) * (V ? 1300 : 1150) * (c % 2 ? 1.2 : 0.9);
      set(col, { y: H - off - c * 120, o: fOn ? 1 : 0 });
    });
    focus(feed, t, [[b(1.9), 10], [b(2.3), 3.5]]);

    /* 3 · macro → pull-back to the wall; 4 · it lights up; then out of focus behind the 3am stack */
    const wOn = t >= b(4) - 0.02 && t < b(10.2);
    const pull = ramp.fastSlow(clamp((t - b(4)) / 0.85));
    set(wall, { s: lerp(V ? 6.5 : 7.5, 1, pull) * lerp(1, 0.94, p(t, b(8), 0.6)), o: wOn ? 1 - p(t, b(10), 0.2) : 0 });
    focus(wall, t, [[b(4.1), 4], [b(4.6), 0], [b(7.9), 0], [b(8.4), 10]]);
    let lit = 0;
    bubbles.forEach((bb) => {
      const tl = b(6) + (bb.rank / bubbles.length) * b(1.8);
      const on = t >= tl;
      if (on) lit++;
      bb.dot.style.background = on ? "#e5484d" : "var(--line-strong)";
      const pulse = on ? Math.exp(-(t - tl) * 10) : 0;
      set(bb.n, { s: 1 + pulse * 0.12 });
    });
    counter.textContent = `×${Math.max(1, Math.round((lit / bubbles.length) * 40))}`;
    set(counter, { o: t >= b(6) && t < b(8) ? 1 : 0, s: 1 + impulse(t, [b(6), b(7)], { decay: 12, amp: 0.15 }) });

    /* 5 · notifications (sharp) over the blurred wall */
    const dOn = t >= b(8) - 0.02 && t < b(12.2);
    set(clock, { o: dOn ? 0.12 : 0 });
    notifs.forEach(({ n, t: tn }) => {
      const later = notifs.filter((m) => t >= m.t && m.t > tn).length;
      const s = spring(t, tn, { k: 420, c: 26 });
      const y0 = (V ? 520 : 300) + later * (V ? 118 : 100) * spring(t, tn, { k: 600, c: 30 });
      const missed = p(t, b(10), 0.3);
      const fall = p(t, b(11.6) - 0.05, 0.3, ease.in);
      n.style.filter = missed > 0 ? `grayscale(${missed.toFixed(2)})` : "none";
      set(n, { y: lerp(-160, y0, s) + fall * 400, s: 1 - later * 0.025, o: t >= tn && dOn ? (1 - missed * 0.5) * (1 - fall) * (later > 3 ? 0 : 1) : 0 });
    });

    /* 6 · peak: dots, tabs doubling, icons back with 99+ */
    dots.forEach(({ d, x, y, t: td }) => set(d, { x, y, s: spring(t, td, { k: 600, c: 24 }), o: t >= td && t < T.turn ? 1 : 0 }));
    const nTabs = t < b(12) ? 0 : t < b(13) ? 8 : t < b(14) ? 16 : t < b(15) ? 32 : 64;
    const tw = (W - 40) / Math.max(1, nTabs);
    tabs.forEach((tb, i) => {
      const born = i < 8 ? b(12) : i < 16 ? b(13) : i < 32 ? b(14) : b(15);
      tb.style.left = `${20 + i * tw}px`;
      tb.style.width = `${tw - 2}px`;
      set(tb, { y: (1 - spring(t, born + (i % 8) * 0.01, { k: 600, c: 30 })) * -60, o: i < nTabs ? 1 : 0 });
    });
    tiles.forEach((tl, i) => {
      const tb = b(12.5) + i * 0.03;
      const s = spring(t, tb, { k: 320, c: 20 });
      const dx = tl.x - cx;
      const dy = tl.y - cy;
      set(tl.n, { x: tl.x + dx * 1.2 * (1 - s), y: tl.y + dy * 1.2 * (1 - s), s: lerp(1.3, 0.9, s), r: -tl.r, o: t >= tb ? 1 : 0 });
    });
  }

  return { root, render, t0: 0, t1: T.turn };
}

void keyed;
