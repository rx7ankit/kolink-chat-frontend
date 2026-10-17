# koLink Chat — product film

A 38-second, beat-synced product film for koLink Chat ("Post once. *Catch every reply.*"),
built as a deterministic HTML composition and rendered frame by frame.

| Output | Spec |
| --- | --- |
| `out/kolink-film-16x9.mp4` | 1920×1080, 60 fps, H.264 High, yuv420p (BT.709), CRF 18, AAC 192k, +faststart |
| `out/kolink-film-9x16.mp4` | 1080×1920 vertical recompose for Reels / TikTok / Shorts, same encode settings |
| `out/kolink-film-*-poster.png` / `.webp` | poster frame (10.6 s: the post live on five networks) |
| `out/contact-*.png` | contact sheet used for review |

`out/`, `.frames/` and `node_modules/` are gitignored; everything else here is source.

## Re-render

Requirements: Node 20+, pnpm, ffmpeg (with libx264), `cwebp` (for the poster), Google Chrome at
`/Applications/Google Chrome.app` (override with `CHROME_PATH=...`), and network access for Google Fonts.

```sh
cd frontend/landing/film
pnpm install
pnpm audio            # trims + loudness-normalises the soundtrack → audio/soundtrack.wav (once)
pnpm render           # 16:9 → out/kolink-film-16x9.mp4 (+ poster)
pnpm render:vertical  # 9:16 → out/kolink-film-9x16.mp4 (+ poster)
pnpm contact          # 1 frame/s contact sheet → out/contact-16x9.png
```

Useful flags for `node scripts/render.mjs`: `--format 9x16`, `--times 8.2,12.5` (stills into
`.frames/stills/`), `--contact --step 0.5`, `--from 10 --to 14` (partial), `--workers 8`, `--crf 18`,
`--poster 10.6`. A full 60 fps render takes well under a minute on an M-series Mac.

Live preview with sound: `pnpm preview`, then open `http://localhost:4173/?preview`
(space = play/pause, ←/→ = one beat; add `&format=9x16` for the vertical cut, or `?t=12.5` for a still).

## How it works

- `src/index.html` + `src/film.js` build the whole film as DOM/SVG. `window.__seek(t)` lays out the
  exact frame for time `t`; nothing reads the wall clock, so frames can be captured in any order.
  Easing ([0.22, 1, 0.36, 1] out, [0.65, 0, 0.35, 1] travel) and analytic damped springs live in
  `src/lib/anim.js`; octilinear transit routes (ported from the landing page) in `src/lib/geometry.js`.
- One scene per file in `src/scenes/`; the koLink hub (`hub.js`) is a single object that travels
  between scenes. Each scene has a 16:9 and a 9:16 layout.
- `scripts/render.mjs` serves `src/` plus the landing page's `public/media` (read-only), extracts the
  Reel's frames with ffmpeg into `.frames/reel/` (drawn into a canvas, so video playback is exact
  per frame), drives N headless Chrome workers with puppeteer-core, screenshots every frame to
  `.frames/<format>/`, and encodes with ffmpeg.
- Brand: the "Pistachio" palette, Inter Light / Instrument Serif italic / Geist Mono (Google Fonts),
  brand platform marks and the koLink mark copied from `lib/platforms.ts` and
  `components/brand/logo.tsx`; legend glyphs from `components/transit/glyph.tsx`. Photos and the
  Reel are the landing page's own stock media (`public/media/CREDITS.md`: Unsplash / Pexels licences).

## Storyboard (as built)

Music is 120 BPM, so a beat is 0.5 s (30 frames) and a bar is 2 s. Film time 0 = the track's first
downbeat (2.0 s into the source file).

| Time | Music | Shot |
| --- | --- | --- |
| 0 – 5.5 s | keys intro | Paper + hairline grid. One pill composer; the caret blinks on the beat; "Linen drop is live 🌿 Comment LINK for early access." types itself (1.0 – 3.4 s); the Reel attaches on beat 7 (3.5 s); `PUBLISH TO` Instagram, Facebook, Threads, X (52/280), LinkedIn (text only) light up on eighth notes (4.0 – 5.0 s). |
| 5.5 – 8.0 s | keys intro, build | Publish is pressed (one-frame anticipation); the bar collapses into the green POST capsule, which rides a line up into the koLink hub while the camera follows; five waiting stations appear as dotted routes; the hub ring clicks at 7.5 s. |
| 8.0 – 12 s | **drums enter at 8.0 s** | The post fans out on five lines; native posts land on sixteenth notes with springs and masked reveals: Instagram Reel (playing the linen video), Facebook Page, Threads, X, LinkedIn text-only. Counts tick up; slow push-in. |
| 12 – 16 s | groove | The hub drops into an eight-line interchange (one compass point per channel). One reply per eighth note: IG comment "link pls 🙏", Messenger "are you open Sunday?", FB comment "LINK", Gmail "Bulk order: 300 queen sets", Threads, X mention, WhatsApp, LinkedIn comment; each rides home as a hollow circle; counter IN 0 → 8. |
| 16 – 17 s | **pad + bass phrase** | "Every reply, *sorted.*" The points switch flips three times: automation ◇, AI agent ●, your team ■ ride out to their stops. |
| 17 – 20 s | | Automation (Instagram): comment "link pls" → keyword matched → public reply → DM "Thanks for commenting! Tap below and I'll send it over 👇" [Send me the link] → tap → follow check ✓ → "Here's your early-access link!" [Open link] → Delivered ✓. A periwinkle diamond hops stop to stop on the beat. Footnote: Comment → DM is Instagram-only; Facebook & Threads get keyword replies. |
| 20 – 24 s | | AI agent (Instagram + Messenger DMs only): "hii" → greeting with what it can help with → "show me prices" → catalog cards with photos and ₹ prices; Messenger "are you open Sunday?" → "We're open 10am–7pm, Monday to Saturday." with a margin note "matched: Hours" linked to the lit Hours source in the knowledge library. |
| 24 – 28 s | | Hand-off: "can I talk to a real person?" → "We'll connect someone from our team to help you out." → apricot pencil ring + Needs attention badge on the inbox row → a teammate types in the same pill input bar and replies; thread marked done. |
| 28 – 32 s | | Unified inbox: eight channel rows slide in on eighth notes; Insights: 7-day messages chart draws on the beat (total 6,348), by-channel bars grow, "Demo workspace · Illustrative numbers" stamp lands. |
| 32 – 38 s | **hats lift at 32 s**, fade 36 – 38 s | End card: "Post once." / "*Catch every reply.*" with a route line ending in a station roundel; the koLink mark draws itself; wordmark; pill "Get started — chat.getkolink.com"; the legend. Hold while the music fades. |

Product facts follow `lib/capabilities.ts`: five publish targets (no WhatsApp publishing), eight inbox
channels, Comment → DM on Instagram only, the AI agent only on Instagram and Messenger DMs and only from
the knowledge library, illustrative numbers, demo brand Northwind Studio. All people and handles are
fictional.

## Music

- **Track:** "House One"
- **Artist:** Francisco Alvear
- **Source:** Mixkit, Chillout genre listing — https://mixkit.co/free-stock-music/chillout/ (Mixkit item 662; file: https://assets.mixkit.co/music/662/662.mp3, 1:56, 44.1 kHz stereo MP3), saved as `audio/house-one-francisco-alvear-mixkit-662.mp3`. The MP3 is gitignored; on a fresh clone fetch it first:
  `curl -L -o audio/house-one-francisco-alvear-mixkit-662.mp3 https://assets.mixkit.co/music/662/662.mp3`
  (sha256 `2fb6dc4d979fa08b7ca7d8cba5486193f06bc9f8e1dbf09b96ada87183be10b0`)
- **License:** Mixkit Stock Music Free License — https://mixkit.co/license/#musicFree . Free for
  commercial and non-commercial projects, including social media videos, online marketing ads and
  websites; no attribution required. Not allowed: TV/radio broadcast, CDs/DVDs, video games, remixing
  into a music-only track, or registering it with a content-ID / rights-management service.
  (If a platform ever flags it, Mixkit asks that the claim be forwarded to team@mixkit.co.)
- **Edit:** starts at 2.000 s of the source (its first downbeat), 38 s long, 5 ms fade-in, 2 s
  linear fade-out (36 → 38 s), static gain to −14 LUFS integrated with a −1.5 dBFS look-ahead limiter
  (true peak ≤ −1 dBTP). See `scripts/prepare-audio.mjs`.
- **Beat grid:** `pnpm beats` (scripts/analyze-audio.mjs: spectral-flux onsets → autocorrelation tempo
  → comb-filter phase) measures 120.0 BPM with downbeats on even seconds of film time; `src/timing.js`
  holds the musical map that the scenes are cut to.

---

## v2 — the punchy cut

A faster, more kinetic 41.5 s cut: problem → turn → solution beats → end card, every cut and word on
the beat of a house track with a real build and drop, rendered with true motion blur.

| Output | Spec |
| --- | --- |
| `out/kolink-film-v2-16x9.mp4` | 1920×1080, 60 fps, H.264 High, yuv420p (BT.709), CRF 18, AAC 192k, +faststart, 12-sample motion blur |
| `out/kolink-film-v2-9x16.mp4` | 1080×1920 recompose (headline on top, product shot below), same encode |
| `out/kolink-film-v2-*-poster.png` / `.webp` | poster at 12.8 s ("Post once." over the five live posts; `--poster 12.8`) |
| `out/contact-v2-*.png` | review contact sheets |

```sh
pnpm fetch-audio          # downloads the Mixkit track + sound effects into audio/ (gitignored)
pnpm audio:v2             # edit + sound design + loudness → audio/soundtrack-v2.wav
pnpm render:v2            # → out/kolink-film-v2-16x9.mp4   (≈4 min on an M-series Mac)
pnpm render:v2:vertical   # → out/kolink-film-v2-9x16.mp4
pnpm contact:v2           # contact sheet (add --subframes 1 for a fast, blur-free pass)
```
Preview: `pnpm preview` → `http://localhost:4173/v2.html?preview` (`&format=9x16`, or `?t=12.5`).

### Motion blur
`scripts/render.mjs --v2` captures **12 sub-frames per output frame** spread across a 180° shutter
(half a frame, centred on the frame time) and averages them with ffmpeg
(`tmix=frames=12` + `select` every 12th) — temporal supersampling, so fast slams, card flights and
rolls smear the way a camera exposure does. During the whip pan, a velocity-scaled horizontal blur
(SVG `feGaussianBlur`, `src/v2/kit.js → whipBlur`) is layered on top so the very fast sub-frames read as
one continuous smear instead of steps. Flags: `--subframes N`, `--shutter 0.5`.

### Structure (as built) — 122 BPM, beat 0.492 s, bar 1.967 s
| Film time | Music | Shot |
| --- | --- | --- |
| 0.00 – 7.87 | intro: four-on-the-floor kicks + filter sweep | **HOOK.** A word slams in on every other kick, chaos bursts in on the off-beat: **"8 apps."** (the eight channel icons burst out, badges pile on) · **"200 comments."** (a comment feed races up) · **"the same question,"** ("price?" bubbles pile up and overflow) · **"*forty times a day.*"** (×1 → ×40) · **"3am DMs."** (03:12, notifications drop in with soft pings) · **"Missed replies."** (they grey out, unread dots spread) · **"*Missed sales.*"** (browser tabs double every beat 8 → 64, icons return with 99+, shake + scale punches build). |
| 7.87 – 9.84 | hard cut: first breakdown bar, low-passed (a breath) | **TURN.** Calm paper. "What if you posted *once*?" one word per beat. |
| 9.84 – 11.80 | riser bar | The koLink mark draws itself; the eight icons are pulled into it; it becomes the hub; the hub stretches into one pill input bar, the post types itself, **Publish** clicks on the "and" before the drop, the bar snaps into the green POST capsule. |
| 11.80 – 17.70 | **DROP** | **"Post once."** slams; the capsule bursts and five native posts fly out in 3D on sixteenth notes (Instagram Reel playing, Facebook Page, Threads, X, LinkedIn text-only) with soft pops; the headline settles top-left and the camera dollies across the posts; on the third bar the first replies pop out of every post. |
| 17.70 – 21.64 | groove | Ink-ring iris → **"Every reply."** eight lines into the hub, a hollow ring rides each one on eighth notes (IN 0 → 8) → **"*One inbox.*"** the interchange folds into the hub and one inbox unfolds out of it: eight channels, one row each, with their handler glyphs. |
| 21.64 – 25.57 | | Periwinkle **diamond wipe** out of the inbox's automation glyph → **"Comment LINK. *Get the DM.*"** (Instagram only): "link pls 🙏" matches the keyword, public reply, the diamond rides to the DM, "Thanks for commenting! Tap below and I'll send it over 👇" [Send me the link] → tap (click) → follow check ✓ → "Here's your early-access link!" [Open link] → **Delivered ✓**. Footnote: Facebook & Threads get keyword replies. |
| 25.57 – 29.51 | | **Whip pan** (whoosh) → **"An agent that knows *your shop.*"** (AI agent · Instagram + Messenger DMs, answers only from the knowledge library): "are you open Sunday?" → "We're open 10am–7pm, Monday to Saturday." *matched: Hours · from your knowledge* → "show me prices" → "Here is what is available." + three catalog cards with photos and ₹ prices fly in. |
| 29.51 – 33.44 | | Apricot **triangle wipe** → **"A human when it *matters.*"**: "can I talk to a real person?" → "We'll connect someone from our team to help you out." → pencil ring + **Needs attention** slams on the inbox row → a teammate types in the same pill bar and sends (click) → Replied · done. |
| 33.44 – 35.41 | | Ink **square wipe** → **6,348** messages · last 7 days on rolling numerals, the 7-day line draws, "Demo workspace · Illustrative numbers" stamp lands on the beat. |
| 35.41 – 41.50 | outro bar with a crash → the track's own last bar and tail | **END CARD.** "Post once." / "*Catch every reply.*" with a route line ending in a station roundel; the koLink mark draws itself + wordmark; on the final bar the **Get started — chat.getkolink.com** pill springs in; the legend; hold while the track ends (0.6 s fade at the very end). |

Honesty rules as in v1 (`lib/capabilities.ts`): five publish targets (no WhatsApp publishing), eight
inbox channels, Comment → DM on Instagram only, the AI agent only on Instagram + Messenger DMs and only
from the knowledge library, illustrative "Demo workspace" numbers, demo brand Northwind Studio, fictional
people/handles, no competitor names.

### v2 music
- **Track:** "Talent in the Air" — **Artist:** Diego Nava — Mixkit item 473 (house · driving · positive · melodic).
- **Source:** https://mixkit.co/free-stock-music/house/ (file: https://assets.mixkit.co/music/473/473.mp3, 1:54),
  saved as `audio/talent-in-the-air-diego-nava-mixkit-473.mp3` (gitignored; `pnpm fetch-audio`).
- **License:** Mixkit Stock Music Free License — https://mixkit.co/license/#musicFree (free for commercial use in
  web/social videos and ads, no attribution; not for TV/radio broadcast, CDs/DVDs, games, music-only remixes or
  content-ID registration).
- **Chosen by analysis** (I can't listen): 37 Mixkit candidates in house / deep house / electronica / EDM were
  scored with `scripts/analyze-audio.mjs` (tempo, per-bar energy, kick energy) and spectrograms; this one is
  122 BPM with a filtered kick intro, a breakdown with a rising sweep, and a full drop with a crash.
- **Edit** (`src/v2/timing.js`, `scripts/prepare-audio-v2.mjs`), cut on the source's bar lines
  (1.4754 + n × 1.9672 s) with 12 ms equal-power crossfades: bars 0–4 (intro) → bar 23 low-passed at 900 Hz (the
  breath) → bars 30–43 (riser → drop at film 11.803 s → groove) → bar 47 (crash) → bar 55 to the end (the
  track's own ending). Loudness: static gain to −14 LUFS + −1.5 dBFS look-ahead limiter (≤ −1 dBTP).

### v2 sound effects (mixed 16–24 dB under the music)
All from Mixkit, **Mixkit Sound Effects Free License** (https://mixkit.co/license/#sfxFree — commercial use in
videos, social posts and ads, no attribution; not redistributable on their own). Files are fetched to
`audio/sfx/` (gitignored); cue times live in `src/v2/timing.js → SFX`.

| Effect | Mixkit # | Source page | Used for |
| --- | --- | --- | --- |
| Fast air sweep transition | 168 | https://mixkit.co/free-sound-effects/swoosh/ | whip pan (25.57 s) |
| Fast small sweep transition | 166 | https://mixkit.co/free-sound-effects/swoosh/ | shape wipes, icons pulled into the mark |
| Interface device click | 2577 | https://mixkit.co/free-sound-effects/click/ | Publish, the DM button tap, Send |
| Explainer video pops whoosh light pop | 3005 | https://mixkit.co/free-sound-effects/pop/ | the five posts landing |
| Dry pop up notification alert | 2356 | https://mixkit.co/free-sound-effects/pop/ | the 3am notifications |

File URLs follow `https://assets.mixkit.co/active_storage/sfx/<#>/<#>-preview.mp3`.

---

## v3 — the crafted cut

Same spine, honesty, brand and music as v2 (problem hook → the turn → product beats → end card, cut to
"Talent in the Air"), with the camera language of premium launch films. The research behind it is in
[`RESEARCH.md`](RESEARCH.md): what Linear-style, Apple, Figma Config, Vercel Ship and Raycast films do,
and which of those techniques fit a calm, paper-and-transit-map brand.

| Output | Spec |
| --- | --- |
| `out/kolink-film-v3-16x9.mp4` | 1920×1080, 60 fps, H.264 High, yuv420p (BT.709), CRF 18, AAC 192k, +faststart, 12-sample motion blur |
| `out/kolink-film-v3-9x16.mp4` | 1080×1920 recompose, same encode |
| `out/kolink-film-v3-*-poster.png` / `.webp` | poster at 16.2 s (the five posts live, overhead, first replies arriving) |
| `out/contact-v3-*.png` | review contact sheets |

```sh
pnpm fetch-audio && pnpm audio:v3   # music edit + v3 sound design → audio/soundtrack-v3.wav
pnpm render:v3                      # → out/kolink-film-v3-16x9.mp4
pnpm render:v3:vertical             # → out/kolink-film-v3-9x16.mp4
```
Preview: `pnpm preview` → `http://localhost:4173/v3.html?preview`.

### Techniques used, and where
| Technique (source in RESEARCH.md) | Where |
| --- | --- |
| **Speed-of-perception words that do what they say** ("Don't Blink"), with **variable-weight type** (Inter 100–900: letters land at ~700 and relax to Light 300) | Hook 0–7.9 s: "200" counts up from 0; the letters of "replies." fall away; every word slams with a weight pulse. Also "Post once.", "LINK.", the 6,348 numerals (thin while spinning, heavy on landing). |
| **Mosaic / activation chain** (Raycast tile grids; Figma Config's shapes that set each other off) | 0–1 s: the eight channel tiles slam in as a grid. 10.1–10.8 s: the tiles knock each other into one line, which becomes the composer pill. 25.6–26.8 s: a wall of Instagram/Messenger hours questions collapses into one conversation that the agent answers once. |
| **Macro → pull back** (Dyson, Apple detail shots) | 2.0–2.9 s: one "price?" bubble pulls back to a wall of forty. 11.0–11.8 s: macro on Publish under the cursor. 24.9–25.5 s: macro on ✓ Delivered. 28.3–29.4 s: macro on ₹4,800, then pull back. |
| **Rack focus / depth of field** (simulated per layer) | 0.4 s: the tiles drop out of focus behind "8 apps.". 1–2 s: the feed races by out of focus. 7.9–9.8 s: "What if you posted *once*?" pulls into focus word by word, then everything but "once" softens. 14.8–15.7 s: "One post. *Five networks.*" sharp over blurred posts, then focus pulls to the posts. Hand-off and end card too. |
| **Cursor choreography** (Figma/Linear real-UI films) | Publish (11.56 s), "Send me the link" (24.10 s), the flagged row and Send (31.2 s, 32.2 s): eased arcs, hover → pointing hand, press and click ripple. |
| **Breaking the plane: a POV ride in z-space, with a speed ramp** ("Don't Blink"; speed-ramp guides) | 12.3–14.6 s: the camera flies through "Post once." into the tilted transit map and rides the line behind the POST capsule. The five destinations painted on the floor stream past with motion blur, the ride slows into the hub, and the camera cranes up to overhead as five posts pop up on sixteenth notes. 17.2 s: it dives back toward the floor. |
| **Exploded UI** (Meta Quest 3 "from the inside out") | 22.2–23.0 s: the Instagram post separates into Reel, header, comment and automation-reply layers with callouts while the keyword matches, then snaps back. |
| **Text becomes UI / match cuts at peak speed** (Square / motion guides) | The Publish button *is* the POST capsule (11.6 → 11.8 s). The word "inbox." grows into the inbox card (20.2 s). The legend shapes morph one into the next on the end card (37.9–39.1 s). Shape wipes in legend glyphs (ring, diamond, triangle, square) are kept from v2. |
| **Orbiting 3D map** | 17.7–20.2 s: the eight-line interchange lies on a tilted floor and the camera slowly orbits it while replies ride in. |
| **Light and material** (Apple edge light; Linear CSS grain) | A soft sheen across the "Replied · done" row (32.8 s) and the Get started pill (37.8 s). Atmospheric fade on the far floor during the ride. Static paper grain on every scene. No glow, no dark UI. |

### v3 sound
Music and edit are identical to v2 (same bar-line cuts; the drop lands at 11.803 s). The SFX cues are
re-timed to the new picture (`src/v3/timing.js → SFX`) and add one Mixkit effect:

| Effect | Mixkit # | Source page | Used for |
| --- | --- | --- | --- |
| Technology transition slide | 3120 | https://mixkit.co/free-sound-effects/transition/ | the POV ride launching (12.3 s) |

plus v2's whoosh (168, 166), click (2577), pop (3005) and notification (2356) — same licence (Mixkit Sound
Effects Free License), mixed 15–24 dB under the music.
