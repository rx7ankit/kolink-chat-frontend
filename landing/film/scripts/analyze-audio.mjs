#!/usr/bin/env node
/**
 * Beat-grid analysis for the film soundtrack (no native deps).
 *
 *   node scripts/analyze-audio.mjs <file.mp3> [--json out.json] [--from 0] [--to 60]
 *
 * 1. ffmpeg decodes to mono 22.05 kHz float PCM.
 * 2. Log-magnitude spectral flux (1024-pt FFT, hop 256 ≈ 11.6 ms) → onset envelope,
 *    plus a low band (< 160 Hz, kick) flux used for downbeat phase.
 * 3. Tempo = autocorrelation peak of the onset envelope in 80–160 BPM (log-normal prior at 115).
 * 4. Beat phase = comb filter over the envelope; downbeat = the bar phase with the most kick energy.
 * Prints BPM, first beat, first downbeat and an energy profile per bar (so a musical section
 * start can be picked by eye).
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const file = args[0];
if (!file) {
  console.error("usage: analyze-audio.mjs <file> [--json out.json] [--from s] [--to s]");
  process.exit(1);
}
const opt = (k, d) => {
  const i = args.indexOf(k);
  return i > -1 ? args[i + 1] : d;
};
const SR = 22050;
const from = Number(opt("--from", 0));
const to = Number(opt("--to", 0));

const ff = ["-v", "error", "-ss", String(from), ...(to ? ["-to", String(to)] : []), "-i", file, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"];
const res = spawnSync("ffmpeg", ff, { maxBuffer: 1 << 30 });
if (res.status !== 0) {
  console.error(res.stderr.toString());
  process.exit(1);
}
const buf = res.stdout;
const pcm = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);

// ---------- FFT (radix-2, in place) ----------
const N = 1024;
const HOP = 256;
const rev = new Uint32Array(N);
for (let i = 0, bits = Math.log2(N); i < N; i++) {
  let r = 0;
  for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
  rev[i] = r;
}
const cosT = new Float64Array(N / 2);
const sinT = new Float64Array(N / 2);
for (let i = 0; i < N / 2; i++) {
  cosT[i] = Math.cos((2 * Math.PI * i) / N);
  sinT[i] = -Math.sin((2 * Math.PI * i) / N);
}
const win = new Float64Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
function fftMag(frame, out) {
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  for (let i = 0; i < N; i++) re[rev[i]] = frame[i] * win[i];
  for (let size = 2; size <= N; size <<= 1) {
    const half = size >> 1;
    const step = N / size;
    for (let i = 0; i < N; i += size) {
      for (let j = 0; j < half; j++) {
        const k = j * step;
        const tr = re[i + j + half] * cosT[k] - im[i + j + half] * sinT[k];
        const ti = re[i + j + half] * sinT[k] + im[i + j + half] * cosT[k];
        re[i + j + half] = re[i + j] - tr;
        im[i + j + half] = im[i + j] - ti;
        re[i + j] += tr;
        im[i + j] += ti;
      }
    }
  }
  for (let i = 0; i <= N / 2; i++) out[i] = Math.hypot(re[i], im[i]);
}

const frames = Math.floor((pcm.length - N) / HOP);
const fps = SR / HOP;
const onset = new Float64Array(frames);
const low = new Float64Array(frames);
const rms = new Float64Array(frames);
const lowBins = Math.ceil((160 / SR) * N);
let prev = new Float64Array(N / 2 + 1);
const mag = new Float64Array(N / 2 + 1);
for (let f = 0; f < frames; f++) {
  const frame = pcm.subarray(f * HOP, f * HOP + N);
  fftMag(frame, mag);
  let flux = 0;
  let lf = 0;
  let e = 0;
  for (let i = 1; i <= N / 2; i++) {
    const v = Math.log1p(1000 * mag[i]);
    const d = v - prev[i];
    if (d > 0) {
      flux += d;
      if (i <= lowBins) lf += d;
    }
    prev[i] = v;
  }
  for (let i = 0; i < HOP; i++) e += frame[i] * frame[i];
  onset[f] = flux;
  low[f] = lf;
  rms[f] = Math.sqrt(e / HOP);
}

// Normalise: subtract a local mean (≈ 0.5 s) and half-wave rectify.
function detrend(x, w = Math.round(fps * 0.5)) {
  const out = new Float64Array(x.length);
  let acc = 0;
  const q = [];
  for (let i = 0; i < x.length; i++) {
    q.push(x[i]);
    acc += x[i];
    if (q.length > w) acc -= q.shift();
    out[i] = Math.max(0, x[i] - acc / q.length);
  }
  return out;
}
const env = detrend(onset);
const lowEnv = detrend(low);

// ---------- Tempo ----------
const minLag = Math.floor((60 / 160) * fps);
const maxLag = Math.ceil((60 / 80) * fps);
let best = { lag: 0, score: -Infinity };
const scores = [];
for (let lag = minLag; lag <= maxLag; lag++) {
  let s = 0;
  for (let i = lag; i < env.length; i++) s += env[i] * env[i - lag];
  s /= env.length - lag;
  const bpm = (60 * fps) / lag;
  const prior = Math.exp(-0.5 * (Math.log2(bpm / 115) / 0.6) ** 2);
  scores.push({ lag, s, bpm });
  if (s * prior > best.score) best = { lag, score: s * prior };
}
// Refine with parabolic interpolation on the raw autocorrelation.
const idx = scores.findIndex((x) => x.lag === best.lag);
let lagF = best.lag;
if (idx > 0 && idx < scores.length - 1) {
  const [a, b, c] = [scores[idx - 1].s, scores[idx].s, scores[idx + 1].s];
  const den = a - 2 * b + c;
  if (den !== 0) lagF = best.lag + (0.5 * (a - c)) / den;
}
// Fine search: maximise comb energy over a long span for sub-frame period precision.
function combScore(period, phase, e) {
  let s = 0;
  let n = 0;
  for (let t = phase; t < e.length - 1; t += period) {
    const i = Math.floor(t);
    const k = t - i;
    s += e[i] * (1 - k) + e[i + 1] * k;
    n++;
  }
  return s / n;
}
let bestP = { period: lagF, phase: 0, score: -Infinity };
for (let p = lagF - 0.6; p <= lagF + 0.6; p += 0.01) {
  for (let ph = 0; ph < p; ph += 0.25) {
    const s = combScore(p, ph, env);
    if (s > bestP.score) bestP = { period: p, phase: ph, score: s };
  }
}
const period = bestP.period;
const beatSec = period / fps;
const bpm = 60 / beatSec;
// Flux frames are stamped at their window start; a log-flux attack peaks ~0.6 window in (checked
// against the hard silence→chord edge at 2.0 s of the source track).
const LATENCY = (0.6 * N) / SR;
const firstBeat = bestP.phase / fps + LATENCY + from;

// Downbeat: which of the 4 beat phases carries the most kick + overall energy.
const phaseScore = [0, 0, 0, 0];
for (let b = 0, t = bestP.phase; t < env.length - 1; b++, t += period) {
  const i = Math.round(t);
  let s = 0;
  for (let j = Math.max(0, i - 2); j <= Math.min(env.length - 1, i + 2); j++) s += lowEnv[j] * 2 + env[j];
  phaseScore[b % 4] += s;
}
const dbPhase = phaseScore.indexOf(Math.max(...phaseScore));
const firstDownbeat = firstBeat + dbPhase * beatSec;

// Energy per bar (RMS dB) to find sections.
const barSec = beatSec * 4;
const bars = [];
for (let t = firstDownbeat - from; t + barSec <= pcm.length / SR; t += barSec) {
  const a = Math.floor(t * fps);
  const b = Math.floor((t + barSec) * fps);
  let e = 0;
  let o = 0;
  let l = 0;
  for (let i = a; i < b; i++) {
    e += rms[i] * rms[i];
    o += env[i];
    l += lowEnv[i];
  }
  const n = b - a;
  bars.push({
    t: +(t + from).toFixed(3),
    db: +(10 * Math.log10(e / n + 1e-12)).toFixed(1),
    onset: +(o / n).toFixed(2),
    kick: +(l / n).toFixed(2),
  });
}

const out = {
  file,
  duration: +(pcm.length / SR + from).toFixed(3),
  bpm: +bpm.toFixed(3),
  beat: +beatSec.toFixed(5),
  firstBeat: +firstBeat.toFixed(4),
  firstDownbeat: +firstDownbeat.toFixed(4),
  phaseScore: phaseScore.map((x) => +x.toFixed(1)),
  bars,
};
console.log(`${file}\n  bpm ${out.bpm}  beat ${out.beat}s  first beat ${out.firstBeat}s  first downbeat ${out.firstDownbeat}s  dur ${out.duration}s`);
if (args.includes("--bars")) for (const b of bars) console.log(`  bar @ ${b.t.toFixed(2).padStart(7)}s  ${String(b.db).padStart(6)} dB  onset ${b.onset}  kick ${b.kick}`);
const json = opt("--json");
if (json) writeFileSync(json, JSON.stringify(out, null, 2));
