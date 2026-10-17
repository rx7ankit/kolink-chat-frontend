#!/usr/bin/env node
/**
 * Downloads the licensed audio sources (kept out of git) from Mixkit into audio/.
 *   node scripts/fetch-audio.mjs
 * Music: Mixkit Stock Music Free License. Sound effects: Mixkit Sound Effects Free License.
 * See README.md → Music / Sound effects for titles and licence terms.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SFX as SFX2 } from "../src/v2/timing.js";
import { SFX as SFX3 } from "../src/v3/timing.js";

const SFX = { files: { ...SFX2.files, ...SFX3.files } };

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const audio = join(root, "audio");
mkdirSync(join(audio, "sfx"), { recursive: true });

const files = [
  ["house-one-francisco-alvear-mixkit-662.mp3", "https://assets.mixkit.co/music/662/662.mp3"],
  ["talent-in-the-air-diego-nava-mixkit-473.mp3", "https://assets.mixkit.co/music/473/473.mp3"],
  ...Object.values(SFX.files).map((f) => [`sfx/mixkit-${f.id}.mp3`, `https://assets.mixkit.co/active_storage/sfx/${f.id}/${f.id}-preview.mp3`]),
];

for (const [name, url] of files) {
  const out = join(audio, name);
  if (existsSync(out)) continue;
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (kolink-film fetch-audio)" } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  console.log(`fetched ${name}`);
}
console.log("audio sources ready");
