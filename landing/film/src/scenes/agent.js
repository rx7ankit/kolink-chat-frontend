/**
 * 20 – 24 s · AI AGENT (Instagram + Messenger DMs only, answers only from the knowledge library).
 * Instagram: "hii" → greeting with the topics it can help with → "show me prices" → catalog cards.
 * Messenger: "are you open Sunday?" → answer from Hours, with the matched source lit in the library.
 */
import { ease, lerp, p, set, spring } from "../lib/anim.js";
import { glyph, tile } from "../lib/brand.js";
import { $, el, headline, msgIn, msgOut, popMsg, revealWords, threadCard } from "../lib/ui.js";

const CATALOG = [
  ["Linen bedding set", "₹4,800", "Queen", "/media/item-linen-stack.webp"],
  ["Relaxed linen shirt", "₹2,450", "Pre-washed", "/media/item-linen-shirt.webp"],
  ["Terracotta planter", "₹890", "S · M · L", "/media/item-planter.webp"],
];
const SOURCES = [
  ["book", "Shipping", "3–5 working days"],
  ["book", "Returns", "Free within 14 days"],
  ["file", "catalog.csv", "5 products"],
  ["book", "Hours", "Mon–Sat · 10am–7pm"],
];

export function buildAgent({ V, W, H }) {
  const root = el(`<section class="scene"></section>`);
  const hl = headline(["Answers from", "*your knowledge.*"], { size: V ? 84 : 72 });
  hl.classList.add("abs");
  const tag = el(`<div class="abs row mono" style="gap:12px;font-size:${V ? 19 : 16}px;color:var(--ink)">${glyph("agent", 16)}<span>AI agent · Instagram + Messenger DMs</span></div>`);

  /* Instagram DM */
  const ig = threadCard("instagram", "maya.home", "Instagram DM · agentic", { w: V ? 940 : 640, h: V ? 790 : 700 });
  const igb = $(ig, ".th-body");
  igb.style.gap = "10px";
  const i1 = msgIn("hii");
  const iT = el(`<div class="msg out"><div class="typing"><i></i><i></i><i></i></div></div>`);
  const i2 = msgOut(`Hi, how can I help you? I can help with:<ul><li>hours</li><li>products and prices</li><li>shipping and returns</li></ul>`, "agent");
  const i3 = msgIn("show me prices");
  const i4 = msgOut("Here is what is available.", "agent");
  const cards = el(`<div class="row" style="gap:12px;align-self:flex-end;margin-top:2px"></div>`);
  const cardEls = CATALOG.map(([name, price, note, img]) => {
    const c = el(`<div class="card" style="width:${V ? 270 : 178}px;overflow:hidden;border-radius:16px;box-shadow:none"><img src="${img}" style="width:100%;height:${V ? 150 : 118}px;object-fit:cover" alt=""><div style="padding:10px 12px 12px"><div style="font-size:${V ? 19 : 15.5}px;font-weight:500;letter-spacing:-0.01em;white-space:nowrap">${name}</div><div class="row" style="justify-content:space-between;margin-top:4px"><span style="font-size:${V ? 20 : 16}px;font-weight:600">${price}</span><span class="mono" style="font-size:11px;white-space:nowrap">${note}</span></div></div></div>`);
    cards.append(c);
    return c;
  });
  igb.append(i1, i2, i3, i4, cards);
  // Typing indicator sits where the greeting will land.
  iT.style.position = "absolute";
  iT.style.right = "22px";

  /* Messenger DM */
  const ms = threadCard("messenger", "Rohan Mehta", "Messenger · agentic", { w: V ? 940 : 980, h: V ? 300 : 320 });
  const msb = $(ms, ".th-body");
  const k1 = msgIn("are you open Sunday?");
  const k2 = msgOut("We're open 10am–7pm, Monday to Saturday.", "agent");
  const kNote = el(`<div class="note-m" style="align-self:flex-end"><span style="width:10px;height:10px;border-radius:50%;background:var(--pop2);box-shadow:inset 0 0 0 1.5px var(--ink)"></span>matched: Hours</div>`);
  msb.append(k1, k2, kNote);

  /* Knowledge library */
  const kb = el(`<div class="abs card col" style="width:${V ? 940 : 980}px;padding:18px 18px 20px;gap:12px"><div class="row" style="gap:14px"><span class="mono" style="font-size:14px;color:var(--ink)">Knowledge library</span><span class="mono" style="font-size:13px">· the agent answers only from here</span></div><div class="row chips" style="gap:12px"></div></div>`);
  const chipRow = kb.querySelector(".chips");
  const srcEls = SOURCES.map(([icn, name, sub]) => {
    const r = el(`<div class="row" style="flex:1;min-width:0;gap:${V ? 8 : 12}px;padding:12px ${V ? 10 : 14}px;border-radius:12px;border:1px solid var(--line);position:relative"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${icn === "book" ? "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" : "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4"}"/></svg><div class="col" style="gap:2px"><span style="font-size:${V ? 16 : 17}px;font-weight:500;white-space:nowrap">${name}</span><span class="soft" style="font-size:${V ? 12.5 : 14}px;white-space:nowrap">${sub}</span></div></div>`);
    chipRow.append(r);
    return r;
  });
  const hours = srcEls[3];
  const conn = el(`<svg class="abs" style="left:0;top:0;overflow:visible" width="1" height="1"><path fill="none" stroke="var(--pop2-deep)" stroke-width="2.5" stroke-linecap="round" pathLength="1"/><circle r="5" fill="var(--pop2)" stroke="var(--ink)" stroke-width="1.5"/><circle r="5" fill="var(--pop2)" stroke="var(--ink)" stroke-width="1.5"/></svg>`);
  const [connPath, c0, c1] = conn.children;
  let geo = null;
  const offsetIn = (n) => {
    let x = 0;
    let y = 0;
    for (let e = n; e && e !== root; e = e.offsetParent) {
      x += e.offsetLeft;
      y += e.offsetTop;
    }
    return { x, y, w: n.offsetWidth, h: n.offsetHeight };
  };
  const scope = el(`<div class="abs row" style="gap:14px;font-size:${V ? 20 : 18}px">${tile("instagram", 30)}<span>Instagram DMs</span>${tile("messenger", 30)}<span>Messenger DMs</span><span class="mono" style="font-size:13px;margin-left:8px">Other channels → your team</span></div>`);

  root.append(hl, tag, ig, ms, kb, scope, conn);
  igb.append(iT);
  if (V) {
    place(tag, 72, 230);
    place(hl, 72, 280);
    place(ig, 70, 500);
    place(ms, 70, 1315);
    place(kb, 70, 1645);
    scope.style.display = "none";
  } else {
    place(tag, 120, 130);
    place(hl, 120, 170);
    place(ig, 120, 330);
    place(ms, 820, 330);
    place(kb, 820, 700);
    place(scope, 820, 900);
  }

  const T = { in: 20.0, i1: 20.25, iT: 20.45, i2: 20.75, k1: 20.5, kT: 20.75, k2: 21.0, kn: 21.25, i3: 21.5, i4: 21.75, cards: 21.85, scope: 22.25 };

  function render(t) {
    const enter = p(t, T.in, 0.6, ease.out);
    const out = p(t, 23.76, 0.22, ease.in);
    set(root, { x: V ? 0 : 120 * (1 - enter) - 140 * out, o: Math.min(1, enter * 1.4) * (1 - out) });
    revealWords(hl, t, T.in + 0.1, { stagger: 0.05, tOut: 23.64, dOut: 0.24 });
    set(tag, { o: p(t, T.in, 0.4) });
    set(ig, { y: (1 - spring(t, T.in, { k: 240, c: 22 })) * 40 });
    set(ms, { y: (1 - spring(t, T.in + 0.1, { k: 240, c: 22 })) * 40 });
    set(kb, { y: (1 - spring(t, T.in + 0.2, { k: 240, c: 22 })) * 40, o: p(t, T.in + 0.2, 0.3) });
    popMsg(i1, t, T.i1);
    // typing dots between iT and i2
    const typingOn = t >= T.iT && t < T.i2;
    iT.style.top = `${i2.offsetTop + (i2.offsetHeight - 50)}px`;
    set(iT, { o: typingOn ? 1 : 0 });
    iT.querySelectorAll("i").forEach((d, j) => {
      const ph = ((t - T.iT) * 4 - j * 0.25) % 1;
      d.style.transform = `translateY(${(-5 * Math.max(0, Math.sin(ph * Math.PI * 2))).toFixed(2)}px)`;
    });
    popMsg(i2, t, T.i2, { side: "out" });
    popMsg(i3, t, T.i3);
    popMsg(i4, t, T.i4, { side: "out" });
    cardEls.forEach((c, j) => {
      const s = spring(t, T.cards + j * 0.1, { k: 300, c: 22 });
      set(c, { x: (1 - s) * 60, o: p(t, T.cards + j * 0.1, 0.15, ease.linear) });
    });
    popMsg(k1, t, T.k1);
    popMsg(k2, t, T.k2, { side: "out" });
    set(kNote, { o: p(t, T.kn, 0.3), x: (1 - p(t, T.kn, 0.4)) * 12 });
    // Library: Hours lights up as the answer lands, linked to the note by a short line.
    if (!geo) {
      const a = offsetIn(kNote);
      const b = offsetIn(hours);
      const x = b.x + b.w / 2;
      geo = { x, y0: a.y + a.h + 10, y1: b.y - 2 };
      connPath.setAttribute("d", `M${x} ${geo.y0}L${x} ${geo.y1}`);
      c0.setAttribute("cx", x);
      c0.setAttribute("cy", geo.y0);
      c1.setAttribute("cx", x);
      c1.setAttribute("cy", geo.y1);
    }
    const cq = p(t, T.kn, 0.35, ease.travel);
    connPath.style.strokeDasharray = `${cq.toFixed(4)} 2`;
    set(c0, { o: t >= T.kn ? 1 : 0 });
    set(c1, { o: t >= T.kn + 0.33 ? 1 : 0 });
    srcEls.forEach((r, j) => {
      const lit = j === 3 && t >= T.kn + 0.3;
      const pulse = lit ? Math.max(0, 1 - (t - T.kn - 0.3) / 0.35) : 0;
      r.style.background = lit ? "var(--agent-bubble)" : "var(--surface)";
      r.style.borderColor = lit ? "var(--pop2-deep)" : "var(--line)";
      set(r, { s: 1 + pulse * 0.04 });
    });
    set(scope, { o: p(t, T.scope, 0.4), y: (1 - p(t, T.scope, 0.5)) * 12 });
  }

  return { root, render, t0: 19.95, t1: 24.3 };
}

function place(n, x, y) {
  n.style.position = "absolute";
  n.style.left = `${x}px`;
  n.style.top = `${y}px`;
}
