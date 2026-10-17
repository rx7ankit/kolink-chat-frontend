#!/usr/bin/env node
/**
 * Frame-accurate renderer: headless Chrome seeks the composition to every frame time and
 * screenshots it; ffmpeg encodes the PNG sequence with the soundtrack.
 *
 *   node scripts/render.mjs --format 16x9            v1 → out/kolink-film-16x9.mp4
 *   node scripts/render.mjs --v2 --format 16x9       v2 → out/kolink-film-v2-16x9.mp4 (motion blur)
 *   node scripts/render.mjs --v3 --format 16x9       v3 → out/kolink-film-v3-16x9.mp4 (motion blur)
 *   node scripts/render.mjs [--v2] --contact [--step 1]   contact sheet → out/contact[-v2]-<format>.png
 *   node scripts/render.mjs [--v2] --times 3.5,8.2        stills → .frames/stills[-v2]/<format>/
 *   options: --fps 60  --workers 8  --from 0 --to 38  --no-encode  --poster 10.6  --crf 18
 *            --subframes N (v2 default 12)  --shutter 0.5 (fraction of a frame the "shutter" is open)
 *
 * Motion blur (v2): every output frame is the average of N sub-frames spread across the shutter
 * interval, centred on the frame time — temporal supersampling, like a real camera's exposure.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { cpus } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer-core";

import { startServer } from "./serve.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i > -1 ? args[i + 1] : d;
};
const flag = (k) => args.includes(`--${k}`);

// --v2 / --v3 pick the cut; v1 is the default.
const VER = flag("v3") ? "v3" : flag("v2") ? "v2" : "";
const V2 = VER !== ""; // v2 and v3 share the motion-blur pipeline
const { FILM } = await import(VER ? `../src/${VER}/timing.js` : "../src/timing.js");
const PAGE = VER ? `/${VER}.html` : "/";
const TAG = VER ? `${VER}-` : "";
const FORMAT = opt("format", "16x9");
const V = FORMAT === "9x16";
const W = V ? 1080 : 1920;
const H = V ? 1920 : 1080;
const FPS = Number(opt("fps", FILM.fps));
const SUB = Math.max(1, Number(opt("subframes", V2 ? 12 : 1)));
const SHUTTER = Number(opt("shutter", 0.5));
const WORKERS = Number(opt("workers", Math.max(2, Math.min(8, cpus().length - 4))));
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = join(root, "out");
mkdirSync(OUT, { recursive: true });

/** Sub-frame times for an output frame at t (centred shutter). */
const subTimes = (t) =>
  SUB === 1 ? [t] : Array.from({ length: SUB }, (_, k) => Math.min(FILM.duration, Math.max(0, t + ((k + 0.5) / SUB - 0.5) * (SHUTTER / FPS))));
const tmix = () => `tmix=frames=${SUB}:weights='${Array(SUB).fill(1).join(" ")}',select='eq(mod(n\\,${SUB})\\,${SUB - 1})'`;

/* ---------- prerequisites ---------- */
function ensureReelFrames() {
  const dir = join(root, ".frames/reel");
  if (existsSync(join(dir, "manifest.json"))) return;
  mkdirSync(dir, { recursive: true });
  const src = join(root, "../public/media/reel-linen.mp4");
  // The Reel is on screen for ~6 s at most, so only the first 7 s are needed.
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-t", "7", "-vf", "scale=432:768:flags=lanczos", "-q:v", "2", join(dir, "%04d.jpg")]);
  const count = readdirSync(dir).filter((f) => f.endsWith(".jpg")).length;
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ fps: 30, count }));
  console.log(`reel: extracted ${count} frames`);
}
function ensureSoundtrack() {
  const wav = join(root, VER ? `audio/soundtrack-${VER}.wav` : "audio/soundtrack.wav");
  if (!existsSync(wav)) {
    execFileSync("node", [join(root, "scripts/fetch-audio.mjs")], { stdio: "inherit" });
    execFileSync("node", [join(root, VER ? "scripts/prepare-audio-v2.mjs" : "scripts/prepare-audio.mjs"), ...(VER ? ["--version", VER] : [])], { stdio: "inherit" });
  }
  return wav;
}

/* ---------- browser workers ---------- */
async function openWorker(base) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--hide-scrollbars", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text", "--mute-audio", `--window-size=${W},${H}`],
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("[page]", e.message));
  page.on("console", (m) => m.type() === "error" && console.error("[console]", m.text()));
  await page.goto(`${base}${PAGE}?format=${FORMAT}`, { waitUntil: "networkidle0", timeout: 120000 });
  const info = await page.evaluate(() => window.__ready);
  return { browser, page, info };
}

async function shoot(page, t, file) {
  await page.evaluate((tt) => window.__seek(tt), t);
  await page.screenshot({ path: file, type: "png", optimizeForSpeed: true, clip: { x: 0, y: 0, width: W, height: H } });
}

/** jobs: [{ t, file }] */
async function renderJobs(jobs, dir) {
  ensureReelFrames();
  mkdirSync(dir, { recursive: true });
  const { server, port } = await startServer(0);
  const base = `http://127.0.0.1:${port}`;
  const n = Math.min(WORKERS, jobs.length);
  const workers = await Promise.all(Array.from({ length: n }, () => openWorker(base)));
  console.log(`${n} workers ready (${workers[0].info.W}×${workers[0].info.H}, fonts ok) · ${SUB} sub-frame${SUB > 1 ? "s" : ""}/frame`);
  let next = 0;
  let done = 0;
  const started = Date.now();
  await Promise.all(
    workers.map(async ({ page }) => {
      while (next < jobs.length) {
        const j = jobs[next++];
        await shoot(page, j.t, join(dir, j.file));
        done++;
        if (done % 120 === 0 || done === jobs.length) {
          const el = (Date.now() - started) / 1000;
          process.stdout.write(`\r  ${done}/${jobs.length} shots · ${(done / el).toFixed(1)}/s · eta ${Math.round(((jobs.length - done) * el) / done)}s   `);
        }
      }
    }),
  );
  process.stdout.write("\n");
  await Promise.all(workers.map((w) => w.browser.close()));
  server.close();
}

function ff(argv, quiet = false) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-v", "error", ...(quiet ? [] : ["-stats"]), ...argv], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg failed");
}

/** Average a still's sub-frames into one PNG. */
function averageStill(dir, stem, out) {
  if (SUB === 1) {
    execFileSync("cp", [join(dir, `${stem}_00.png`), out]);
    return;
  }
  ff(["-y", "-framerate", String(SUB), "-i", join(dir, `${stem}_%02d.png`), "-vf", tmix(), "-frames:v", "1", "-update", "1", out], true);
}

/* ---------- modes ---------- */
if (opt("times")) {
  const times = opt("times").split(",").map(Number);
  const dir = join(root, `.frames/stills${VER ? `-${VER}` : ""}`, FORMAT);
  const sub = join(dir, "sub");
  rmSync(sub, { recursive: true, force: true });
  const jobs = [];
  times.forEach((t, i) => subTimes(t).forEach((ts, k) => jobs.push({ t: ts, file: `s${i}_${String(k).padStart(2, "0")}.png` })));
  await renderJobs(jobs, sub);
  times.forEach((t, i) => averageStill(sub, `s${i}`, join(dir, `t_${t.toFixed(2).padStart(5, "0")}.png`)));
  rmSync(sub, { recursive: true, force: true });
  console.log(`stills → ${dir}`);
} else if (flag("contact")) {
  const step = Number(opt("step", 1));
  const times = [];
  for (let t = step / 2; t < FILM.duration; t += step) times.push(+t.toFixed(3));
  const dir = join(root, `.frames/contact${VER ? `-${VER}` : ""}`, FORMAT);
  rmSync(dir, { recursive: true, force: true });
  const jobs = [];
  times.forEach((t, i) => subTimes(t).forEach((ts, k) => jobs.push({ t: ts, file: `c_${String(i * SUB + k).padStart(6, "0")}.png` })));
  await renderJobs(jobs, dir);
  const cols = V ? 10 : 6;
  const rows = Math.ceil(times.length / cols);
  const out = join(OUT, `contact-${TAG}${FORMAT}.png`);
  // Tiles run left→right, top→bottom; tile n shows t = n × step + step / 2.
  const vf = `${SUB > 1 ? `${tmix()},` : ""}scale=${V ? 270 : 480}:-1,tile=${cols}x${rows}:padding=6:color=0x888888`;
  ff(["-y", "-framerate", String(SUB), "-i", join(dir, "c_%06d.png"), "-vf", vf, "-frames:v", "1", "-update", "1", out]);
  console.log(`contact sheet → ${out}`);
} else {
  const wav = ensureSoundtrack();
  const from = Number(opt("from", 0));
  const to = Number(opt("to", FILM.duration));
  const total = Math.round((to - from) * FPS);
  const dir = join(root, ".frames", `${TAG}${FORMAT}`);
  // --keep --from A --to B re-captures just that range into an existing sequence (frames are numbered
  // by absolute time); --encode-only re-encodes the sequence already on disk.
  if (!flag("keep") && !flag("encode-only")) rmSync(dir, { recursive: true, force: true });
  const f0 = Math.round(from * FPS);
  const jobs = [];
  for (let f = 0; f < total; f++) subTimes(from + f / FPS).forEach((ts, k) => jobs.push({ t: ts, file: `${String((f0 + f) * SUB + k).padStart(6, "0")}.png` }));
  console.log(`rendering ${TAG}${FORMAT} ${W}×${H} @ ${FPS} fps: ${total} frames × ${SUB} (${from}–${to}s)`);
  if (!flag("encode-only")) await renderJobs(jobs, dir);
  if (!flag("no-encode")) {
    const out = join(OUT, `kolink-film-${TAG}${FORMAT}.mp4`);
    const blur = SUB > 1 ? `${tmix()},setpts=N/(${FPS}*TB),` : "";
    ff([
      "-y",
      "-framerate", String(FPS * SUB),
      "-start_number", String(f0 * SUB),
      "-i", join(dir, "%06d.png"),
      "-ss", String(from),
      "-t", String(to - from),
      "-i", wav,
      "-map", "0:v", "-map", "1:a",
      "-vf", `${blur}scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709`,
      "-r", String(FPS),
      "-c:v", "libx264", "-profile:v", "high", "-level", "4.2", "-preset", "slow", "-crf", opt("crf", "18"), "-tune", "animation",
      "-g", String(FPS * 2), "-bf", "3",
      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
      "-movflags", "+faststart",
      "-shortest",
      out,
    ]);
    const mb = (statSync(out).size / 1e6).toFixed(1);
    console.log(`→ ${out} (${mb} MB)`);
    const posterT = Number(opt("poster", FILM.poster ?? (V2 ? 12.8 : 10.6)));
    const idx = Math.round(posterT * FPS);
    if (idx >= f0 && idx < f0 + total) {
      const pOut = join(OUT, `kolink-film-${TAG}${FORMAT}-poster`);
      if (SUB > 1) {
        ff(["-y", "-framerate", String(SUB), "-start_number", String(idx * SUB), "-i", join(dir, "%06d.png"), "-vf", tmix(), "-frames:v", "1", "-update", "1", `${pOut}.png`], true);
      } else {
        execFileSync("cp", [join(dir, `${String(idx * SUB).padStart(6, "0")}.png`), `${pOut}.png`]);
      }
      execFileSync("cwebp", ["-quiet", "-q", "92", `${pOut}.png`, "-o", `${pOut}.webp`]);
      console.log(`poster (${posterT}s) → ${pOut}.png / .webp`);
    }
  }
}
