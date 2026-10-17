/**
 * koLink Chat — product film v2 ("punchy" cut). Same contract as v1: window.__seek(t) lays out
 * the exact frame for t seconds; nothing reads the clock. The renderer supersamples several
 * sub-frames per output frame and averages them for real motion blur.
 *   ?format=16x9 | 9x16     ?preview (plays with sound)     ?t=12.5 (still)
 */
import { BEAT, FILM, T, bar, beat } from "./timing.js";
import { clamp, ease, lerp, p, set } from "../lib/anim.js";
import { logoSvg } from "../lib/brand.js";
import { el } from "../lib/ui.js";
import { loadReel } from "../lib/reel.js";
import { coverRadius, easeWhip, impulse, shake, shapeClip, shapePath } from "./kit.js";
import { buildHook } from "./scenes/hook.js";
import { buildTurn } from "./scenes/turn.js";
import { buildPost } from "./scenes/post.js";
import { buildReply } from "./scenes/reply.js";
import { buildLink } from "./scenes/link.js";
import { buildAgent } from "./scenes/agent.js";
import { buildHuman } from "./scenes/human.js";
import { buildNumbers } from "./scenes/numbers.js";
import { buildEnd } from "./scenes/end.js";

const params = new URLSearchParams(location.search);
const FORMAT = params.get("format") === "9x16" ? "9x16" : "16x9";
const V = FORMAT === "9x16";
const W = V ? 1080 : 1920;
const H = V ? 1920 : 1080;
document.documentElement.dataset.format = FORMAT;

const stage = document.getElementById("stage");
stage.style.width = `${W}px`;
stage.style.height = `${H}px`;

const cols = V ? 6 : 12;
const grid = el(`<div class="grid-bg" style="grid-template-columns:repeat(${cols},1fr);padding:0 ${V ? 48 : 64}px">${Array.from({ length: cols }, (_, i) => `<div><span>${String(i + 1).padStart(2, "0")}</span></div>`).join("")}</div>`);
const bgLayer = el(`<div class="layer"></div>`);
bgLayer.append(grid);
stage.append(bgLayer);

const cam = el(`<div class="cam"></div>`);
stage.append(cam);

const reel = loadReel();
const ctx = { W, H, V, reel };
const scenes = [buildHook(ctx), buildTurn(ctx), buildPost(ctx), buildReply(ctx), buildLink(ctx), buildAgent(ctx), buildHuman(ctx), buildNumbers(ctx), buildEnd(ctx)];
for (const s of scenes) {
  // Opaque paper + its own grid, so shape wipes and whip pans never show the scene underneath.
  s.root.style.background = "var(--bg)";
  s.root.prepend(grid.cloneNode(true));
  cam.append(s.root);
  s.root.style.display = "none";
  s.on = false;
}

/* ---------- legend-shape wipes between scenes ---------- */
// [cut time, shape, colour, centre (fraction of frame), band (px, 0 = solid fill), incoming scene index]
const WIPES = [
  [T.reply, "circle", "var(--ink)", [0.5, 0.5], 16, 3],
  [T.link, "diamond", "var(--pop3)", V ? [0.856, 0.406] : [0.919, 0.223], 0, 4],
  [T.human, "triangle", "var(--pop1)", [0.5, 0.55], 0, 6],
  [T.numbers, "square", "var(--ink)", [0.5, 0.5], 22, 7],
];
const wipeSvg = el(`<svg class="abs" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="left:0;top:0;pointer-events:none;z-index:50"><path fill-rule="evenodd"/></svg>`);
const wipePath = wipeSvg.firstElementChild;
cam.append(wipeSvg);
function renderWipes(t) {
  let d = "";
  let fill = "none";
  for (const [tc, kind, color, [fx, fy], band, idx] of WIPES) {
    const x = fx * W;
    const y = fy * H;
    const R = coverRadius(kind, x, y, W, H);
    const scene = scenes[idx];
    const qc = easeWhip(clamp((t - (tc - 0.3)) / 0.36));
    const qr = band ? qc : easeWhip(clamp((t - (tc - 0.12)) / 0.36));
    const rc = R * qc;
    const rr = band ? Math.max(0, rc - band) : R * qr;
    // Pure per frame: every wipe sets its scene's clip on every seek (frames render out of order).
    if (t >= tc - 0.3 && t < tc + 0.3) {
      scene.root.style.clipPath = qr >= 1 && (!band || qc >= 1) ? "none" : shapeClip(kind, x, y, rr);
      if (rc > 0.5 && (band ? qc < 1 : qr < 1)) {
        d = shapePath(kind, x, y, rc) + shapePath(kind, x, y, Math.max(0.01, rr));
        fill = color;
      }
    } else {
      scene.root.style.clipPath = "none";
    }
  }
  wipePath.setAttribute("d", d || "M0 0");
  wipePath.setAttribute("fill", fill);
}

/* ---------- small brand bug during the demo ---------- */
const bug = el(`<div class="abs hud-brand" style="left:${V ? 48 : 64}px;top:${V ? 64 : 46}px;font-size:${V ? 24 : 20}px;z-index:60">${logoSvg()}<span>koLink <span style="color:var(--accent)">Chat</span></span></div>`);
stage.append(bug);

/* ---------- global camera: beat punches + build-up shake ---------- */
const hookKicks = Array.from({ length: 16 }, (_, k) => beat(k));
const slamBeats = [0, 2, 4, 6, 8, 10, 12].map(beat);
const peak8ths = [12.5, 13, 13.5, 14, 14.5, 15, 15.5].map(beat);
function camAt(t) {
  let s = 1;
  if (t < T.turn) {
    s += impulse(t, hookKicks, { decay: 14, amp: 0.012 }) + impulse(t, slamBeats, { decay: 10, amp: 0.025 }) + impulse(t, peak8ths, { decay: 12, amp: 0.02 });
  }
  s += impulse(t, [T.drop], { decay: 7, amp: 0.045 }) + impulse(t, [T.end], { decay: 8, amp: 0.035 });
  s += impulse(t, [T.inbox, T.agent + beat(0)], { decay: 9, amp: 0.012 });
  const amp = t < T.turn ? 11 * Math.pow(clamp((t - beat(11)) / (T.turn - beat(11))), 1.6) : 0;
  const sh = shake(t, amp, 7);
  return { s, x: sh.x, y: sh.y, r: sh.r };
}

let lastT = -1;
function seek(t) {
  t = clamp(t, 0, FILM.duration);
  lastT = t;
  const c = camAt(t);
  set(cam, { x: c.x, y: c.y, s: c.s, r: c.r });
  set(bgLayer, { x: c.x * 0.3, y: c.y * 0.3, s: 1 + (c.s - 1) * 0.3 });
  for (const s of scenes) {
    const on = t >= s.t0 && t < s.t1;
    if (on !== s.on) {
      s.root.style.display = on ? "" : "none";
      s.root.style.visibility = on ? "visible" : "hidden";
      s.on = on;
    }
    if (on) s.render(t);
  }
  renderWipes(t);
  set(bug, { o: 0.75 * p(t, T.reply, 0.4) * (1 - p(t, T.end - 0.3, 0.25)) });
}

async function ready() {
  const faces = ['300 64px "Inter"', '400 20px "Inter"', '500 20px "Inter"', '600 20px "Inter"', 'italic 400 64px "Instrument Serif"', '400 16px "Geist Mono"', '500 16px "Geist Mono"'];
  await Promise.all(faces.map((f) => document.fonts.load(f, "koLink Chat ₹0123456789")));
  await document.fonts.ready;
  const missing = faces.filter((f) => !document.fonts.check(f, "koLink"));
  if (missing.length) throw new Error(`fonts not loaded: ${missing.join(", ")}`);
  await Promise.all(
    [...document.images].map((img) =>
      img.complete && img.naturalWidth
        ? img.decode().catch(() => {})
        : new Promise((res, rej) => {
            img.onload = () => img.decode().then(res, res);
            img.onerror = () => rej(new Error(`image failed: ${img.src}`));
          }),
    ),
  );
  await reel.ready;
  seek(0);
  return { W, H, fps: FILM.fps, duration: FILM.duration, format: FORMAT };
}

window.__ready = ready();
window.__seek = (t) => {
  seek(t);
  return true;
};

if (params.has("preview") || params.has("t")) {
  window.__ready.then(() => {
    const fit = () => {
      const k = Math.min(innerWidth / W, innerHeight / H);
      stage.style.transformOrigin = "0 0";
      stage.style.transform = `translate(${(innerWidth - W * k) / 2}px, ${(innerHeight - H * k) / 2}px) scale(${k})`;
    };
    fit();
    addEventListener("resize", fit);
    const t0 = Number(params.get("t") ?? 0);
    seek(t0);
    if (!params.has("preview")) return;
    const audio = new Audio("/audio/soundtrack-v2.wav");
    audio.currentTime = t0;
    let playing = false;
    const loop = () => {
      if (playing) seek(audio.currentTime);
      requestAnimationFrame(loop);
    };
    loop();
    addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        playing = !playing;
        if (playing) audio.play();
        else audio.pause();
      }
      if (e.code === "ArrowRight") audio.currentTime = Math.min(FILM.duration, lastT + BEAT);
      if (e.code === "ArrowLeft") audio.currentTime = Math.max(0, lastT - BEAT);
      if (!playing) seek(audio.currentTime);
    });
  });
}

export { bar, beat, lerp, ease };
