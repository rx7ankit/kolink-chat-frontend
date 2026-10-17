#!/usr/bin/env node
/**
 * Builds the film soundtrack from the source track in audio/.
 *
 *   node scripts/prepare-audio.mjs
 *
 * - Starts the track at SOURCE_IN (the first downbeat: the opening keys chord), so film t = 0 is beat 1.
 * - Trims to the film length, with a 5 ms fade-in and a linear-amplitude fade-out over the last FADE seconds.
 * - Loudness: measure (EBU R128), apply the static gain that lands -14 LUFS integrated, then a
 *   transparent look-ahead limiter at -1.5 dBFS so true peaks stay under -1 dBTP. No dynamic
 *   normalisation, so the groove never pumps.
 * Writes audio/soundtrack.wav (48 kHz stereo PCM), which the render script muxes as AAC 192k.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { FILM } from "../src/timing.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "audio", FILM.audio.file);
const out = join(root, "audio", "soundtrack.wav");
const { sourceIn, fadeOut } = FILM.audio;
const dur = FILM.duration;

const shape = [
  `atrim=start=${sourceIn}:duration=${dur}`,
  "asetpts=PTS-STARTPTS",
  "aresample=48000",
  "afade=t=in:st=0:d=0.005",
  `afade=t=out:st=${(dur - fadeOut).toFixed(3)}:d=${fadeOut}:curve=tri`,
].join(",");

function ff(args) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", maxBuffer: 1 << 28 });
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
  return r.stderr;
}

// Pass 1: measure.
const log = ff(["-i", src, "-af", `${shape},loudnorm=I=-14:TP=-1:LRA=11:print_format=json`, "-f", "null", "-"]);
const m = JSON.parse(log.slice(log.lastIndexOf("{"), log.lastIndexOf("}") + 1));
console.log(`measured: ${m.input_i} LUFS, ${m.input_tp} dBTP, LRA ${m.input_lra}`);

// Pass 2: static gain + limiter (the limiter shaves a little loudness, so nudge the gain by its loss).
let gain = -14 - Number(m.input_i);
for (let pass = 0; pass < 3; pass++) {
  const chain = `${shape},volume=${gain.toFixed(2)}dB,alimiter=limit=0.84:attack=5:release=60:level=disabled,aresample=48000`;
  ff(["-y", "-i", src, "-af", chain, "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", out]);
  const check = ff(["-i", out, "-af", "loudnorm=I=-14:TP=-1:print_format=json", "-f", "null", "-"]);
  const c = JSON.parse(check.slice(check.lastIndexOf("{"), check.lastIndexOf("}") + 1));
  console.log(`pass ${pass + 1}: gain ${gain.toFixed(2)} dB → ${c.input_i} LUFS, ${c.input_tp} dBTP`);
  const err = -14 - Number(c.input_i);
  if (Math.abs(err) < 0.15 && Number(c.input_tp) <= -1) break;
  gain += err;
}
console.log(`wrote ${out} (${dur}s from ${sourceIn}s of ${FILM.audio.file})`);
