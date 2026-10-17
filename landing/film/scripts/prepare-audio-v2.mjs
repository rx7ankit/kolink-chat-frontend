#!/usr/bin/env node
/**
 * Builds the v2 soundtrack: an edit of the source track cut on bar lines (see src/v2/timing.js),
 * plus a few quiet sound-design cues, then loudness-matched to -14 LUFS.
 *
 *   node scripts/prepare-audio-v2.mjs [--version v3]   → audio/soundtrack-<version>.wav (48 kHz stereo)
 *
 * Joints between music segments get a 12 ms equal-power crossfade so no click is audible; each
 * segment is placed at its exact film time with adelay, so the beat grid never drifts.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const vi = process.argv.indexOf("--version");
const VER = vi > -1 ? process.argv[vi + 1] : "v2";
const { FILM, SFX } = await import(`../src/${VER}/timing.js`);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const music = join(root, "audio", FILM.audio.file);
const out = join(root, "audio", `soundtrack-${VER}.wav`);
const mixTmp = join(root, "audio", `soundtrack-${VER}.mix.wav`);
if (!existsSync(music)) {
  console.error(`missing ${music} — run: node scripts/fetch-audio.mjs`);
  process.exit(1);
}

function ff(args) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", maxBuffer: 1 << 28 });
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
  return r.stderr;
}

const XF = 0.012;
const dur = FILM.duration;
const segs = FILM.audio.segments;
const used = [...new Set(SFX.cues.map((c) => c[1]))];
const inputs = ["-i", music];
for (const key of used) inputs.push("-i", join(root, "audio", "sfx", `mixkit-${SFX.files[key].id}.mp3`));

const parts = [];
const labels = [];
parts.push(`[0:a]aresample=48000,aformat=channel_layouts=stereo,asplit=${segs.length}${segs.map((_, i) => `[m${i}]`).join("")}`);
segs.forEach(([at, s, e, filter], i) => {
  const last = i === segs.length - 1;
  const fin = i === 0 ? 0.005 : XF;
  const len = e - s + (last ? 0 : XF);
  const chain = [
    `atrim=start=${s.toFixed(5)}:duration=${len.toFixed(5)}`,
    "asetpts=PTS-STARTPTS",
    filter ?? null,
    `afade=t=in:st=0:d=${fin}:curve=qsin`,
    last ? null : `afade=t=out:st=${(len - XF).toFixed(5)}:d=${XF}:curve=qsin`,
    `adelay=${Math.round(at * 1000)}|${Math.round(at * 1000)}`,
  ].filter(Boolean);
  parts.push(`[m${i}]${chain.join(",")}[s${i}]`);
  labels.push(`[s${i}]`);
});
used.forEach((key, k) => {
  const cues = SFX.cues.filter((c) => c[1] === key);
  parts.push(`[${k + 1}:a]aresample=48000,aformat=channel_layouts=stereo,asplit=${cues.length}${cues.map((_, j) => `[x${k}_${j}]`).join("")}`);
  cues.forEach(([t, , gain], j) => {
    const start = t - SFX.files[key].peak;
    const pre = Math.max(0, -start);
    const ms = Math.round(Math.max(0, start) * 1000);
    parts.push(`[x${k}_${j}]atrim=start=${pre.toFixed(4)},asetpts=PTS-STARTPTS,volume=${gain}dB,adelay=${ms}|${ms}[y${k}_${j}]`);
    labels.push(`[y${k}_${j}]`);
  });
});
parts.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest,atrim=duration=${dur},afade=t=out:st=${(dur - FILM.audio.fadeOut).toFixed(3)}:d=${FILM.audio.fadeOut}[mix]`);

ff(["-y", ...inputs, "-filter_complex", parts.join(";"), "-map", "[mix]", "-ar", "48000", "-ac", "2", "-c:a", "pcm_f32le", mixTmp]);

// Loudness: static gain to -14 LUFS, then a look-ahead limiter so true peaks stay under -1 dBTP.
const measure = (f) => {
  const log = ff(["-i", f, "-af", "loudnorm=I=-14:TP=-1:print_format=json", "-f", "null", "-"]);
  return JSON.parse(log.slice(log.lastIndexOf("{"), log.lastIndexOf("}") + 1));
};
const m = measure(mixTmp);
console.log(`mix: ${m.input_i} LUFS, ${m.input_tp} dBTP`);
let gain = -14 - Number(m.input_i);
for (let pass = 0; pass < 4; pass++) {
  ff(["-y", "-i", mixTmp, "-af", `volume=${gain.toFixed(2)}dB,alimiter=limit=0.84:attack=5:release=60:level=disabled`, "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", out]);
  const c = measure(out);
  console.log(`pass ${pass + 1}: gain ${gain.toFixed(2)} dB → ${c.input_i} LUFS, ${c.input_tp} dBTP`);
  const err = -14 - Number(c.input_i);
  if (Math.abs(err) < 0.15 && Number(c.input_tp) <= -1) break;
  gain += err;
}
spawnSync("rm", ["-f", mixTmp]);
console.log(`wrote ${out} (${dur}s)`);
