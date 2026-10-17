/**
 * koLink Chat — product film composition.
 *
 * The whole film is a pure function of time: window.__seek(t) lays out the exact frame for
 * t seconds. Nothing reads the wall clock, so the renderer can capture frames in any order.
 *   ?format=16x9 (default, 1920×1080) | 9x16 (1080×1920)
 *   ?preview      plays it in real time with the soundtrack (space = play/pause, ←/→ = ±1 beat)
 *   ?t=12.5       opens paused at a time
 */
import { BEAT, FILM } from "./timing.js";
import { clamp, ease, lerp, p, set, spring } from "./lib/anim.js";
import { logoSvg } from "./lib/brand.js";
import { el } from "./lib/ui.js";
import { buildHub } from "./scenes/hub.js";
import { buildCompose } from "./scenes/compose.js";
import { buildFanout } from "./scenes/fanout.js";
import { buildFlood } from "./scenes/flood.js";
import { buildSort } from "./scenes/sort.js";
import { buildAutomation } from "./scenes/automation.js";
import { buildAgent } from "./scenes/agent.js";
import { buildHandoff } from "./scenes/handoff.js";
import { buildInbox } from "./scenes/inbox.js";
import { buildEnd } from "./scenes/end.js";
import { loadReel } from "./lib/reel.js";

const params = new URLSearchParams(location.search);
const FORMAT = params.get("format") === "9x16" ? "9x16" : "16x9";
const V = FORMAT === "9x16";
const W = V ? 1080 : 1920;
const H = V ? 1920 : 1080;
document.documentElement.dataset.format = FORMAT;

const stage = document.getElementById("stage");
stage.style.width = `${W}px`;
stage.style.height = `${H}px`;

/* ---------- background grid (static paper, slow parallax) ---------- */
const cols = V ? 6 : 12;
const grid = el(`<div class="grid-bg" style="grid-template-columns:repeat(${cols},1fr);padding:0 ${V ? 48 : 64}px">${Array.from({ length: cols }, (_, i) => `<div><span>${String(i + 1).padStart(2, "0")}</span></div>`).join("")}</div>`);
const bgLayer = el(`<div class="layer"></div>`);
bgLayer.append(grid);
stage.append(bgLayer);

/* ---------- camera + scenes ---------- */
const cam = el(`<div class="cam"></div>`);
stage.append(cam);

const reel = loadReel();
const ctx = { W, H, V, cam, stage, reel };

const hub = buildHub(ctx);
const scenes = [
  buildCompose(ctx),
  buildFanout(ctx, hub),
  buildFlood(ctx, hub),
  buildSort(ctx, hub),
  buildAutomation(ctx),
  buildAgent(ctx),
  buildHandoff(ctx),
  buildInbox(ctx),
  buildEnd(ctx),
];
for (const s of scenes) cam.append(s.root);
cam.append(hub.root);

/* ---------- HUD (outside the camera: it never zooms) ---------- */
const hud = el(`<div class="layer hud"></div>`);
const hudBrand = el(`<div class="abs hud-brand" style="left:${V ? 48 : 64}px;top:${V ? 64 : 46}px;font-size:${V ? 24 : 20}px">${logoSvg()}<span>koLink <span style="color:var(--accent)">Chat</span></span></div>`);
const SECTIONS = [
  [0, "01", "Compose once"],
  [8, "02", "Live on 5 networks"],
  [12, "03", "Every reply → one inbox"],
  [16, "04", "The switch sorts"],
  [17, "04", "Automation · comment → DM"],
  [20, "04", "AI agent · DMs"],
  [24, "05", "Hand-off"],
  [28, "06", "Inbox + insights"],
];
const hudLabel = el(`<div class="abs hud-label mono" style="right:${V ? 48 : 64}px;top:${V ? 68 : 49}px;width:${V ? 700 : 900}px;font-size:${V ? 18 : 16}px;height:24px;overflow:hidden"></div>`);
const labelSlots = SECTIONS.map(([, n, txt]) => {
  const s = el(`<div class="abs row" style="right:0;top:0;gap:12px;white-space:nowrap"><span class="num">${n}</span><span style="width:28px;height:1px;background:var(--line-strong);display:inline-block"></span><span>${txt}</span></div>`);
  hudLabel.append(s);
  return s;
});
hud.append(hudBrand, hudLabel);
stage.append(hud);

function renderHud(t) {
  const o = p(t, 0.2, 0.6) * (1 - p(t, 31.7, 0.4, ease.in));
  set(hudBrand, { o, y: 0 });
  hudLabel.style.opacity = o.toFixed(3);
  SECTIONS.forEach(([t0], i) => {
    const t1 = SECTIONS[i + 1]?.[0] ?? 32;
    const inP = i === 0 ? 1 : p(t, t0 + 0.14, 0.42);
    const outP = p(t, t1, 0.16, ease.in);
    const vis = t >= t0 - 0.01 && t < t1 + 0.35;
    set(labelSlots[i], { y: (1 - inP) * 24 - outP * 24, o: vis ? inP * (1 - outP) : 0 });
  });
}

/* ---------- camera: slow push-ins, reset on cuts ---------- */
// [t, scale, x, y] keys. Two keys at the same t = a cut. Eased between keys.
const CAM = V
  ? [
      [0, 1, 0, 0], [5.45, 1.05, 0, 0], [6.35, 1.15, 0, 310], [7.5, 1.2, 0, 470], [8.1, 1, 0, 0], [11.9, 1.035, 0, 0], [12.7, 1, 0, 0], [15.9, 1.035, 0, 0], [16.4, 1, 0, 0],
      [17, 1, 0, 0], [20, 1.03, 0, 0], [20, 1, 0, 0], [24, 1.03, 0, 0], [24, 1, 0, 0], [28, 1.03, 0, 0], [28, 1, 0, 0], [32, 1.025, 0, 0], [32, 1, 0, 0], [38, 1.045, 0, 0],
    ]
  : [
      [0, 1, 0, 0], [5.45, 1.045, 0, 0], [6.35, 1.2, 0, 230], [7.5, 1.24, 0, 330], [8.1, 1, 0, 0], [11.9, 1.035, 0, -8], [12.7, 1, 0, 0], [15.9, 1.035, 0, 0], [16.4, 1, 0, 0],
      [17, 1, 0, 0], [20, 1.03, -10, 0], [20, 1, 0, 0], [24, 1.03, 0, 0], [24, 1, 0, 0], [28, 1.03, 0, 0], [28, 1, 0, 0], [32, 1.025, 0, 0], [32, 1, 0, 0], [38, 1.045, 0, 0],
    ];
function camAt(t) {
  let i = 0;
  while (i < CAM.length - 1 && CAM[i + 1][0] <= t) i++;
  const a = CAM[i];
  const b = CAM[i + 1];
  if (!b || b[0] === a[0]) return { s: a[1], x: a[2], y: a[3] };
  const q = ease.cam(clamp((t - a[0]) / (b[0] - a[0])));
  return { s: lerp(a[1], b[1], q), x: lerp(a[2], b[2], q), y: lerp(a[3], b[3], q) };
}

/* ---------- seek ---------- */
let lastT = -1;
function seek(t) {
  t = clamp(t, 0, FILM.duration);
  lastT = t;
  const c = camAt(t);
  set(cam, { x: c.x, y: c.y, s: c.s });
  // Background drifts at a fraction of the camera (parallax).
  set(bgLayer, { x: c.x * 0.4, y: c.y * 0.4, s: 1 + (c.s - 1) * 0.35 });
  for (const s of scenes) {
    const on = t >= s.t0 && t < s.t1;
    if (on !== s.on) {
      s.root.style.visibility = on ? "visible" : "hidden";
      s.root.style.display = on ? "" : "none";
      s.on = on;
    }
    if (on) s.render(t);
  }
  hub.render(t);
  renderHud(t);
}
for (const s of scenes) {
  s.on = false;
  s.root.style.display = "none";
}

/* ---------- readiness: fonts, images, reel frames ---------- */
async function ready() {
  const faces = ['300 64px "Inter"', '400 20px "Inter"', '500 20px "Inter"', '600 20px "Inter"', 'italic 400 64px "Instrument Serif"', '400 16px "Geist Mono"', '500 16px "Geist Mono"'];
  await Promise.all(faces.map((f) => document.fonts.load(f, "koLink Chat ₹0123456789")));
  await document.fonts.ready;
  const missing = faces.filter((f) => !document.fonts.check(f, "koLink"));
  if (missing.length) throw new Error(`fonts not loaded: ${missing.join(", ")}`);
  const imgs = [...document.images];
  await Promise.all(imgs.map((img) => (img.complete && img.naturalWidth ? img.decode().catch(() => {}) : new Promise((res, rej) => {
    img.onload = () => img.decode().then(res, res);
    img.onerror = () => rej(new Error(`image failed: ${img.src}`));
  }))));
  await reel.ready;
  seek(0);
  return { W, H, fps: FILM.fps, duration: FILM.duration, format: FORMAT };
}

window.__ready = ready();
window.__seek = (t) => {
  seek(t);
  return true;
};
window.__beat = BEAT;

/* ---------- preview mode ---------- */
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
    const audio = new Audio("/audio/soundtrack.wav");
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
