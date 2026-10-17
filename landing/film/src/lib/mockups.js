/**
 * Stylised native post mockups for the five publish targets. Realistic structure
 * (header, copy, media, action row) in the film's type and palette; brand marks in color.
 */
import { icon, roundel } from "./brand.js";
import { el, ic } from "./ui.js";

const TEXT = "Linen drop is live 🌿 Comment LINK for early access.";
const av = (size, radius = "50%") => `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.56)}px;border-radius:${radius}">N</span>`;

export function stationLabel(id, label, w) {
  return el(
    `<div class="station-label" style="width:${w}px">${roundel(id, 40)}<span class="mono">${label}</span><span class="live" style="margin-left:auto"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>LIVE</span></div>`,
  );
}

/** Instagram Reel, 9:16, with a <canvas> the film paints Reel frames into. */
export function igReel(w = 316) {
  const h = Math.round((w * 16) / 9);
  return el(`<div class="reel" style="width:${w}px;height:${h}px">
    <canvas width="${Math.round(w * 1.6)}" height="${Math.round(h * 1.6)}"></canvas>
    <div class="shade-t"></div><div class="shade-b"></div>
    <div class="ui" style="left:16px;top:14px;font-weight:600;font-size:20px;letter-spacing:-0.01em">Reels</div>
    <div class="ui col" style="right:12px;bottom:118px;gap:14px;align-items:center;font-size:12.5px;font-weight:500">
      <div class="col" style="align-items:center;gap:3px">${ic("heart")}<span class="cnt" data-to="1248">0</span></div>
      <div class="col" style="align-items:center;gap:3px">${ic("comment")}<span class="cnt" data-to="86">0</span></div>
      <div class="col" style="align-items:center;gap:3px">${ic("send")}<span>Share</span></div>
    </div>
    <div class="ui" style="left:14px;right:60px;bottom:16px">
      <div class="row" style="gap:8px">${av(30)}<span style="font-weight:600;font-size:14.5px">northwind.studio</span><span style="border:1px solid rgba(255,255,255,.8);border-radius:8px;padding:2px 8px;font-size:12.5px;font-weight:600">Follow</span></div>
      <div style="font-size:14px;margin-top:8px;line-height:1.35">${TEXT}</div>
      <div class="row" style="gap:6px;font-size:12px;margin-top:8px;opacity:.9"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>Northwind Studio · Original audio</div>
    </div>
  </div>`);
}

export function fbPost(w = 316, photo = "/media/post-linen-hangers.webp") {
  return el(`<div class="card post" style="width:${w}px">
    <div class="hd">${av(40)}<div class="col"><span class="nm">Northwind Studio</span><span class="meta row" style="gap:5px">Just now · <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></svg></span></div><span style="margin-left:auto;color:var(--ink-soft)">${ic("more")}</span></div>
    <div class="tx">${TEXT}</div>
    <img src="${photo}" style="width:${w}px;height:${Math.round(w * 0.92)}px;object-fit:cover" alt="">
    <div class="row meta" style="padding:10px 16px 8px;justify-content:space-between"><span>👍❤️ <span class="cnt" data-to="48">0</span></span><span><span class="cnt" data-to="12">0</span> comments</span></div>
    <div class="acts" style="border-top:1px solid var(--line);justify-content:space-between;padding:10px 18px 12px"><span>${ic("like")}Like</span><span>${ic("comment")}Comment</span><span>${ic("share")}Share</span></div>
  </div>`);
}

export function threadsPost(w = 316, photo = "/media/post-green-linen.webp") {
  return el(`<div class="card post" style="width:${w}px">
    <div class="hd">${av(36)}<span class="nm">northwind.studio</span><span class="meta">1m</span><span style="margin-left:auto;color:var(--ink-soft)">${ic("more")}</span></div>
    <div class="tx">${TEXT}</div>
    <div style="padding:0 16px"><img src="${photo}" style="width:${w - 32}px;height:${Math.round((w - 32) * 1.05)}px;object-fit:cover;border-radius:12px" alt=""></div>
    <div class="acts"><span>${ic("heart")}<span class="cnt" data-to="32">0</span></span><span>${ic("comment")}<span class="cnt" data-to="9">0</span></span><span>${ic("repost")}<span class="cnt" data-to="4">0</span></span><span>${ic("send")}</span></div>
  </div>`);
}

export function xPost(w = 316, photo = "/media/post-linen-drop.webp") {
  return el(`<div class="card post" style="width:${w}px">
    <div class="hd">${av(40)}<div class="col"><span class="nm">Northwind Studio</span><span class="meta">@northwind.studio · 1m</span></div><span style="margin-left:auto">${icon("x", 18)}</span></div>
    <div class="tx">${TEXT}</div>
    <div style="padding:0 16px"><img src="${photo}" style="width:${w - 32}px;height:${Math.round((w - 32) * 0.72)}px;object-fit:cover;object-position:50% 30%;border-radius:16px;border:1px solid var(--line)" alt=""></div>
    <div class="acts" style="justify-content:space-between"><span>${ic("comment")}<span class="cnt" data-to="7">0</span></span><span>${ic("repost")}<span class="cnt" data-to="12">0</span></span><span>${ic("heart")}<span class="cnt" data-to="64">0</span></span><span>${ic("views")}<span class="cnt" data-to="2100">0</span></span></div>
  </div>`);
}

export function linkedinPost(w = 316) {
  return el(`<div class="card post" style="width:${w}px">
    <div class="hd" style="align-items:flex-start">${av(44, "10px")}<div class="col" style="gap:1px"><span class="nm">Northwind Studio</span><span class="meta">1,204 followers</span><span class="meta row" style="gap:5px">1m · <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></svg></span></div></div>
    <div class="tx" style="padding-bottom:14px">${TEXT}</div>
    <div class="row meta" style="padding:0 16px 10px;gap:6px">👍💡 <span class="cnt" data-to="23">0</span> · <span class="cnt" data-to="4">0</span> comments</div>
    <div class="acts" style="border-top:1px solid var(--line);justify-content:space-between;padding:10px 14px 12px;font-size:13px"><span>${ic("like")}Like</span><span>${ic("comment")}Comment</span><span>${ic("repost")}Repost</span><span>${ic("send")}</span></div>
  </div>`);
}

/** Count-up for `.cnt[data-to]` children: 0 → to as q goes 0 → 1 (K-format above 999). */
export function setCounts(root, q) {
  root.querySelectorAll(".cnt").forEach((n) => {
    const to = Number(n.dataset.to);
    const v = Math.round(to * q);
    n.textContent = v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v);
  });
}
