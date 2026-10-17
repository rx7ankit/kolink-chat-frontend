/**
 * 0 – 6 s · COMPOSE. One pill input on paper; the caret blinks on the beat, the post types
 * itself, the Reel attaches, five networks light up on eighth notes, Publish is pressed and the
 * bar collapses into the green POST capsule (handed to the fan-out scene at 6.05 s).
 */
import { clamp, ease, lerp, p, set, spring } from "../lib/anim.js";
import { glyph, icon } from "../lib/brand.js";
import { $, $$, el, ic, revealWords, typeSchedule, typed, words } from "../lib/ui.js";

export const POST_TEXT = "Linen drop is live 🌿 Comment LINK for early access.";
export const TARGETS = [
  ["instagram", "Instagram", ""],
  ["facebook", "Facebook", ""],
  ["threads", "Threads", ""],
  ["x", "X", "52/280"],
  ["linkedin", "LinkedIn", "Text only"],
];

/** Where the composer sits (its centre) and how big the capsule ends up. */
export function composeGeo(V) {
  return V
    ? { cx: 540, cy: 900, w: 960, h: 300, r: 40, capW: 132, capH: 56 }
    : { cx: 960, cy: 520, w: 1400, h: 108, r: 54, capW: 132, capH: 56 };
}

export function buildCompose({ V }) {
  const G = composeGeo(V);
  const root = el(`<section class="scene"></section>`);

  const label = el(`<div class="abs row mono" style="gap:14px;font-size:${V ? 20 : 17}px;color:var(--ink)">${glyph("post", 16)}<span>${words("Compose → 5 networks")}</span></div>`);
  const composer = el(`<div class="abs composer" style="left:${G.cx - G.w / 2}px;top:${G.cy - G.h / 2}px;width:${G.w}px;height:${G.h}px;border-radius:${G.r}px"></div>`);
  const inner = el(`<div class="row" style="position:absolute;inset:0;padding:0 ${V ? 28 : 18}px 0 ${V ? 28 : 20}px;gap:${V ? 18 : 20}px;${V ? "flex-wrap:wrap;align-content:center" : ""}"></div>`);
  const avatar = el(`<span class="avatar" style="width:${V ? 64 : 68}px;height:${V ? 64 : 68}px;font-size:${V ? 36 : 38}px">N</span>`);
  const textBox = el(`<div style="flex:1;min-width:0;font-size:${V ? 40 : 34}px;font-weight:300;letter-spacing:-0.02em;line-height:1.25;white-space:${V ? "normal" : "nowrap"};${V ? "order:3;flex-basis:100%;min-height:100px" : ""}"><span class="tx"></span><span class="caret" style="height:${V ? 46 : 40}px"></span><span class="ph soft" style="position:absolute;opacity:0">Write once…</span></div>`);
  const chip = el(`<div class="chip-media" style="width:${V ? 64 : 68}px;height:${V ? 64 : 68}px"><img src="/media/reel-linen-poster.webp" alt=""><span class="play"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="#fff"/></svg></span></div>`);
  const chipName = el(`<span class="mono" style="font-size:${V ? 16 : 14}px;white-space:nowrap">linen-drop.mp4</span>`);
  const btn = el(`<span class="btn" style="height:${V ? 76 : 76}px;padding:0 ${V ? 32 : 34}px;font-size:${V ? 26 : 24}px">Publish ${icStrokeArrow()}</span>`);
  if (V) {
    const top = el(`<div class="row" style="width:100%;gap:18px"></div>`);
    top.append(avatar, el(`<span class="mono" style="font-size:16px;flex:1;color:var(--ink)">Northwind Studio</span>`), chip, chipName);
    const bot = el(`<div class="row" style="width:100%;justify-content:flex-end;order:4"></div>`);
    bot.append(btn);
    inner.append(top, textBox, bot);
  } else {
    inner.append(avatar, textBox, chip, chipName, btn);
  }
  composer.append(inner);

  const targets = el(`<div class="abs row" style="gap:12px;${V ? "flex-wrap:wrap;width:960px;justify-content:center" : ""}"></div>`);
  const tLabel = el(`<span class="mono" style="font-size:${V ? 18 : 16}px;margin-right:${V ? 0 : 10}px;${V ? "width:100%;text-align:center;margin-bottom:6px" : ""}">Publish to</span>`);
  targets.append(tLabel);
  const pills = TARGETS.map(([id, name, note]) => {
    const n = el(`<span class="target" style="${V ? "height:64px;font-size:24px" : ""}"><span class="ico" style="display:grid;place-items:center">${icon(id, V ? 28 : 26)}</span><span>${name}</span>${note ? `<span class="note">${note}</span>` : ""}<span class="tick"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span></span>`);
    targets.append(n);
    return n;
  });

  root.append(label, composer, targets);

  // Positions for label and targets (after layout).
  if (V) {
    label.style.left = `${G.cx - G.w / 2 + 8}px`;
    label.style.top = `${G.cy - G.h / 2 - 64}px`;
    targets.style.left = `${G.cx - 480}px`;
    targets.style.top = `${G.cy + G.h / 2 + 44}px`;
  } else {
    label.style.left = `${G.cx - G.w / 2 + 10}px`;
    label.style.top = `${G.cy - G.h / 2 - 56}px`;
    targets.style.left = `${G.cx - G.w / 2 + 10}px`;
    targets.style.top = `${G.cy + G.h / 2 + 36}px`;
  }

  const sched = typeSchedule(POST_TEXT, 2.35, 11);
  const tx = $(textBox, ".tx");
  const caret = $(textBox, ".caret");
  const fade = [avatar, textBox, chip, chipName, btn];
  const T_PRESS = 5.5;

  function render(t) {
    // Entrance.
    const inS = spring(t, 0.05, { k: 260, c: 24 });
    const morph = p(t, T_PRESS + 0.02, 0.5, ease.travel);
    const w = lerp(G.w, G.capW, morph);
    const h = lerp(G.h, G.capH, morph);
    composer.style.left = `${G.cx - w / 2}px`;
    composer.style.top = `${G.cy - h / 2}px`;
    composer.style.width = `${w}px`;
    composer.style.height = `${h}px`;
    composer.style.borderRadius = `${lerp(G.r, G.capH / 2, morph)}px`;
    const bgMix = p(t, T_PRESS + 0.22, 0.3, ease.out);
    composer.style.background = bgMix > 0 ? `color-mix(in oklab, var(--accent) ${(bgMix * 100).toFixed(1)}%, var(--surface))` : "var(--surface)";
    composer.style.borderColor = bgMix > 0.5 ? "var(--accent)" : "var(--line)";
    // Press anticipation on the whole bar (tiny) + button.
    const press = p(t, T_PRESS - 0.12, 0.1, ease.out) * (1 - p(t, T_PRESS, 0.08));
    set(composer, { y: (1 - inS) * 26, s: lerp(0.97, 1, inS) * (1 - 0.006 * press), o: p(t, 0.05, 0.25, ease.linear) });
    set(btn, { s: 1 - 0.07 * press });

    for (const f of fade) f.style.opacity = (1 - p(t, T_PRESS, 0.16, ease.linear)).toFixed(3);
    revealWords(label, t, 0.25, { stagger: 0.06, tOut: T_PRESS, dOut: 0.3 });
    set(label, { o: 1 - p(t, T_PRESS, 0.25, ease.in) });

    // Caret: blink on the beat until typing, solid while typing, blink again after.
    const typing = t >= 1.0 && t < 3.45;
    const beatPhase = (t % 0.5) / 0.5;
    const blinkOn = typing || beatPhase < 0.55;
    caret.style.opacity = t > 0.3 && t < T_PRESS && blinkOn ? "1" : "0";
    tx.textContent = typed(sched, t, 1.0);

    // Media chip pops on the beat at 3.5 s.
    const cs = spring(t, 3.5, { k: 420, c: 24 });
    set(chip, { s: lerp(0.5, 1, cs), o: p(t, 3.5, 0.1, ease.linear) * (1 - p(t, T_PRESS, 0.16, ease.linear)) });
    set(chipName, { o: p(t, 3.6, 0.25) * (1 - p(t, T_PRESS, 0.16, ease.linear)), x: (1 - p(t, 3.6, 0.4)) * -10 });

    // Targets row.
    const rowIn = p(t, 3.7, 0.5);
    const rowOut = p(t, T_PRESS, 0.35, ease.in);
    set(targets, { y: (1 - rowIn) * 18 + rowOut * 14, o: rowIn * (1 - rowOut) });
    pills.forEach((pill, i) => {
      const tOn = 4.0 + i * 0.25;
      const on = spring(t, tOn, { k: 520, c: 26 });
      const lit = t >= tOn;
      set(pill, { s: lit ? 1 + 0.06 * Math.sin(clamp((t - tOn) / 0.18) * Math.PI) : 1 });
      pill.style.borderColor = lit ? "var(--line-strong)" : "var(--line)";
      const ico = $(pill, ".ico");
      ico.style.filter = lit ? "none" : "grayscale(1)";
      ico.style.opacity = lit ? "1" : "0.38";
      const tick = $(pill, ".tick");
      set(tick, { s: on, o: lit ? 1 : 0 });
    });
  }

  return { root, render, t0: 0, t1: 6.08 };
}

function icStrokeArrow() {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;
}
