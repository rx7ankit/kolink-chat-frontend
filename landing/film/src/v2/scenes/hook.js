/**
 * 0 – 7.87 s · HOOK / PROBLEM. Huge kinetic words slam in on the kicks (every other beat);
 * on the off-beats the chaos bursts in around them: eight app icons with badges, a comment feed
 * racing by, the same question piling up, 3am notifications, unread dots, tabs multiplying.
 * Hard cut to calm paper at 7.869 s.
 */
import { beat, T } from "../timing.js";
import { clamp, ease, impulse, kline, lerp, lettersIn, p, set, slam, spring } from "../kit.js";
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

  /* ---------- words ---------- */
  const WORDS = V
    ? [
        ["8 apps.", 230, 0.5],
        ["200|comments.", 196, 0.5],
        ["the same|question,", 168, 0.5],
        ["*forty times|a day.*", 186, 0.5],
        ["3am DMs.", 186, 0.6],
        ["Missed|replies.", 200, 0.58],
        ["*Missed|sales.*", 250, 0.52],
      ]
    : [
        ["8 apps.", 300, 0.5],
        ["200 comments.", 230, 0.5],
        ["the same question,", 172, 0.5],
        ["*forty times a day.*", 214, 0.5],
        ["3am DMs.", 280, 0.6],
        ["Missed replies.", 224, 0.58],
        ["*Missed sales.*", 276, 0.54],
      ];
  const words = WORDS.map(([text, size, fy], i) => {
    const lines = text.split("|");
    const box = el(`<div class="abs" style="left:0;width:${W}px;text-align:center;z-index:10"></div>`);
    lines.forEach((ln, j) => {
      // keep the italic span across a line break: re-open "*" on continued lines
      let s = ln;
      const open = (text.split("|").slice(0, j).join("|").match(/\*/g) || []).length % 2 === 1;
      if (open && !s.startsWith("*")) s = `*${s}`;
      if ((s.match(/\*/g) || []).length % 2 === 1) s = `${s}*`;
      box.append(kline(s, size, { cls: "free" }));
    });
    const h = lines.length * size * 1.0;
    box.style.top = `${H * fy - h / 2}px`;
    box.style.transformOrigin = "50% 50%";
    root.append(box);
    return { box, t0: beat(i * 2), t1: i === 6 ? T.turn : beat(i * 2 + 2) };
  });

  /* ---------- A: eight app tiles with badges ---------- */
  const tileSize = V ? 150 : 150;
  const TILE_POS = V
    ? [[0.2, 0.17], [0.8, 0.14], [0.15, 0.8], [0.84, 0.82], [0.5, 0.1], [0.5, 0.9], [0.13, 0.3], [0.88, 0.32]]
    : [[0.13, 0.21], [0.29, 0.8], [0.85, 0.19], [0.72, 0.83], [0.09, 0.6], [0.93, 0.58], [0.43, 0.13], [0.58, 0.9]];
  const COUNTS = ["12", "38", "7", "99+", "21", "4", "63", "15"];
  const tiles = IDS.map((id, i) => {
    const n = el(`<div class="abs" style="left:${-tileSize / 2}px;top:${-tileSize / 2}px;width:${tileSize}px;height:${tileSize}px;z-index:4">${tile(id, tileSize, 0.26)}<span class="badge-red" style="right:-16px;top:-16px">${COUNTS[i]}</span></div>`);
    n.firstElementChild.style.boxShadow = "0 24px 48px -20px rgba(38,43,38,.35)";
    root.append(n);
    return { n, badge: n.querySelector(".badge-red"), x: TILE_POS[i][0] * W, y: TILE_POS[i][1] * H, r: (rnd() - 0.5) * 24 };
  });

  /* ---------- B: comment feed racing by ---------- */
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
    ["I", "isha.m", "restock when?"],
    ["V", "vik.r", "LINK 🔗"],
  ];
  const feedCols = (V ? [0.04, 0.52] : [0.025, 0.76]).map((fx, c) => {
    const col = el(`<div class="abs col" style="left:${fx * W}px;top:0;gap:16px;z-index:3"></div>`);
    for (let i = 0; i < 14; i++) {
      const [a, h, txt] = FEED[(i + c * 5) % FEED.length];
      col.append(el(`<div class="fchip"><span class="av">${a}</span><b>${h}</b><span>${txt}</span></div>`));
    }
    root.append(col);
    return col;
  });

  /* ---------- C: the same question, piling up ---------- */
  const Q = ["price?", "price??", "how much?", "price pls 🙏", "cost?", "₹?", "price?", "how much is this", "PRICE?", "price", "rate?", "how much 🙏"];
  const qBubbles = [];
  const qn = V ? 30 : 34;
  for (let i = 0; i < qn; i++) {
    const row = Math.floor(i / (V ? 3 : 5));
    const colN = V ? 3 : 5;
    const ci = i % colN;
    const x = ((ci + 0.5) / colN) * W + (rnd() - 0.5) * (W / colN) * 0.6;
    const y = H - 110 - row * (V ? 200 : 130) + (rnd() - 0.5) * 40;
    const b = el(`<div class="abs" style="left:0;top:0;z-index:5"><div class="bub" style="font-size:${V ? 30 : 28}px;padding:14px 22px;box-shadow:0 14px 30px -16px rgba(38,43,38,.3);border:1px solid var(--line);background:#fff;white-space:nowrap">${Q[i % Q.length]}</div></div>`);
    root.append(b);
    qBubbles.push({ b, x, y, r: (rnd() - 0.5) * 8, t: beat(4.5) + i * (beat(3.5) / qn) });
  }
  const counter = el(`<div class="abs mono" style="right:${V ? 60 : 90}px;top:${V ? 180 : 90}px;font-size:${V ? 90 : 110}px;color:var(--ink);letter-spacing:0;z-index:11"></div>`);
  root.append(counter);

  /* ---------- D: 3am notifications ---------- */
  const NOTIFS = [
    ["instagram", "maya.home", "hii are you open tmrw?"],
    ["whatsapp", "+91 98•• ••• 210", "price?"],
    ["messenger", "Rohan Mehta", "still available??"],
    ["gmail", "Kavya R.", "Re: Bulk order — any update?"],
    ["x", "@meera_k", "mentioned you: queen size back?"],
    ["instagram", "Instagram", "5 new messages"],
  ];
  const clock = el(`<div class="abs mono" style="left:${V ? 60 : 90}px;top:${V ? 170 : 70}px;font-size:${V ? 120 : 150}px;color:var(--ink);opacity:.14;letter-spacing:0;z-index:2">03:12</div>`);
  root.append(clock);
  const notifs = NOTIFS.map(([id, who, msg], i) => {
    const n = el(`<div class="abs notif" style="left:${cx - 280}px;top:0;z-index:6">${tile(id, 48)}<div class="col" style="gap:3px;min-width:0"><span class="t1">${NAMES[id]} · ${who}</span><span class="t2">${msg}</span></div><span class="tm">now</span></div>`);
    root.append(n);
    return { n, t: [beat(8), beat(8.5), beat(9), beat(9.5), beat(9.75), beat(9.875)][i] };
  });

  /* ---------- E: unread dots ---------- */
  const dots = Array.from({ length: V ? 26 : 34 }, (_, i) => {
    const d = el(`<span class="reddot" style="left:0;top:0;z-index:7"></span>`);
    root.append(d);
    return { d, x: 40 + rnd() * (W - 80), y: 80 + rnd() * (H - 160), t: beat(10.5) + i * (beat(1.5) / 34) };
  });

  /* ---------- F: tabs multiplying ---------- */
  const tabBar = el(`<div class="abs" style="left:0;top:${V ? 120 : 14}px;width:${W}px;height:56px;z-index:8"></div>`);
  const tabs = Array.from({ length: 64 }, (_, i) => {
    const id = IDS[i % 8];
    const tb = el(`<div class="tab">${icon(id, 18)}<span>${NAMES[id]}</span></div>`);
    tabBar.append(tb);
    return tb;
  });
  root.append(tabBar);

  function render(t) {
    /* words: slam on even beats; letters rise; hard swap */
    words.forEach(({ box, t0, t1 }, i) => {
      const on = t >= t0 - 0.02 && t < t1;
      if (!on) {
        set(box, { o: 0 });
        return;
      }
      const s = slam(box, t, t0, { from: i === 6 ? 1.7 : 1.45, k: 460, c: 27, fade: 0.04 });
      // exits shrink a hair in the last frames before the next word lands
      const ex = p(t, t1 - 0.07, 0.07, ease.in);
      set(box, { s: lerp(i === 6 ? 1.7 : 1.45, 1, s) * (1 - 0.06 * ex) + impulse(t, [t0 + beat(1)], { decay: 12, amp: 0.02 }), o: (1 - ex) * p(t, t0, 0.04, ease.linear) });
      lettersIn(box, t, t0, { stagger: 0.012, d: 0.4, mode: "rise" });
    });

    /* A: tiles burst out with "8 apps.", badges on the off-beat, scatter away; return at the peak */
    const tA0 = beat(0);
    const tAout = beat(2) - 0.04;
    const tAback = beat(12.5);
    tiles.forEach((tl, i) => {
      const s1 = spring(t, tA0 + i * 0.035, { k: 300, c: 20 });
      const out = p(t, tAout + i * 0.012, 0.22, ease.in);
      const back = spring(t, tAback + i * 0.03, { k: 320, c: 20 });
      let x = lerp(cx, tl.x, s1);
      let y = lerp(cy, tl.y, s1);
      let sc = lerp(0.2, 1, s1);
      let o = t >= tA0 ? 1 : 0;
      if (t >= tAout) {
        const dx = tl.x - cx;
        const dy = tl.y - cy;
        x = tl.x + dx * 1.4 * out;
        y = tl.y + dy * 1.4 * out;
        o = 1 - out;
      }
      if (t >= tAback) {
        const dx = tl.x - cx;
        const dy = tl.y - cy;
        x = tl.x + dx * 1.2 * (1 - back) + (V ? 0 : (i % 2 ? 30 : -30));
        y = tl.y + dy * 1.2 * (1 - back);
        sc = lerp(1.3, 0.9, back);
        o = 1;
      }
      set(tl.n, { x, y, s: sc, r: tl.r * (t >= tAback ? -1 : 1) * Math.min(1, s1), o });
      const bt = t >= tAback ? tAback + 0.1 + i * 0.02 : beat(1) + i * 0.03;
      const bs = spring(t, bt, { k: 520, c: 22 });
      tl.badge.textContent = t >= tAback ? "99+" : COUNTS[i];
      set(tl.badge, { s: bs, o: t >= bt ? 1 : 0 });
    });

    /* B: feed races up (k2.5 → k4) */
    const fOn = t >= beat(2.5) && t < beat(4.05);
    feedCols.forEach((col, c) => {
      const off = (t - beat(2.5)) * (V ? 1500 : 1300) * (c ? 1.15 : 1);
      set(col, { x: 0, y: H - off - (c ? 200 : 0), o: fOn ? 1 : 0 });
    });

    /* C: bubbles pile up (k4.5 → k8), back for a moment at the peak */
    qBubbles.forEach(({ b, x, y, r, t: tb }, i) => {
      const s = spring(t, tb, { k: 520, c: 24 });
      const clear = p(t, beat(8) - 0.05, 0.16, ease.in);
      const peak = t >= beat(13) && i % 3 === 0;
      const ps = spring(t, beat(13) + (i % 7) * 0.03, { k: 520, c: 24 });
      const vis = (t >= tb && t < beat(8) + 0.12) || peak;
      const sc = peak ? lerp(0.5, 1, ps) : lerp(0.5, 1, s);
      set(b, { x, y: y + clear * 160, s: sc, r, o: vis ? (peak ? 1 : 1 - clear) : 0 });
    });
    const cOn = t >= beat(6) && t < beat(8);
    const nCount = Math.max(1, Math.round(lerp(1, 40, p(t, beat(6), beat(1.8), ease.out))));
    counter.textContent = `×${nCount}`;
    set(counter, { o: cOn ? 1 : 0, s: 1 + impulse(t, [beat(6), beat(7)], { decay: 12, amp: 0.15 }) });

    /* D: notifications drop into a stack (k8 → k10), grey out (k10 → k12) */
    const dOn = t >= beat(8) - 0.02 && t < beat(12.2);
    set(clock, { o: dOn ? 0.14 : 0 });
    notifs.forEach(({ n, t: tn }, i) => {
      const later = notifs.filter((m) => t >= m.t && m.t > tn).length;
      const s = spring(t, tn, { k: 420, c: 26 });
      const y0 = (V ? 300 : 40) + later * (V ? 120 : 104) * spring(t, tn + 0.0, { k: 600, c: 30 });
      const missed = p(t, beat(10), 0.3);
      const fall = p(t, beat(12) - 0.05, 0.25, ease.in);
      n.style.filter = missed > 0 ? `grayscale(${missed.toFixed(2)})` : "none";
      set(n, { x: 0, y: lerp(-160, y0, s) + fall * 300, s: 1 - later * 0.025, o: t >= tn && dOn ? (1 - missed * 0.45) * (1 - fall) * (later > 3 ? 0 : 1) : 0 });
    });

    /* E: unread dots */
    dots.forEach(({ d, x, y, t: td }) => {
      const s = spring(t, td, { k: 600, c: 24 });
      set(d, { x, y, s, o: t >= td && t < T.turn ? 1 : 0 });
    });

    /* F: tabs double on every beat of the last bar */
    const nTabs = t < beat(12) ? 0 : t < beat(13) ? 8 : t < beat(14) ? 16 : t < beat(15) ? 32 : 64;
    const tw = (W - 40) / Math.max(1, nTabs);
    tabs.forEach((tb, i) => {
      const on = i < nTabs;
      const born = i < 8 ? beat(12) : i < 16 ? beat(13) : i < 32 ? beat(14) : beat(15);
      const s = spring(t, born + (i % 8) * 0.01, { k: 600, c: 30 });
      tb.style.left = `${20 + i * tw}px`;
      tb.style.width = `${tw - 2}px`;
      set(tb, { y: (1 - s) * -60, o: on ? 1 : 0 });
    });
  }

  return { root, render, t0: 0, t1: T.turn };
}
