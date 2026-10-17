# koLink Chat — landing page

The marketing site for koLink Chat. It lives in its own pnpm project, separate from the
app in the parent folder: own `package.json`, own lockfile, own `pnpm-workspace.yaml`
(which makes this folder a pnpm root), and the parent's TypeScript, ESLint and Docker
builds ignore `landing/`.

Concept: **The Interchange.** The page is drawn as an honest transit map. A post leaves
the composer, publishes on the five lines that really publish, and replies come back on
all eight lines, where automations, the AI agent or your team answer them.

## Run it

```bash
cd landing
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # static export to out/
pnpm start        # serve out/ locally on :3200
pnpm typecheck
pnpm lint
```

Stack: Next.js 16 (App Router, `output: "export"`), React 19, Tailwind CSS v4, Motion,
Lenis. `pnpm build` writes plain static files to `out/`, so it can be hosted on any CDN
(Vercel with Root Directory `landing`, Cloudflare Pages, S3, …).

## Design Studio

A floating **Design Studio** pill (bottom right, or press `S`) lets you live-switch:

- 8 bright palettes (pastel, strong, neutral) and a custom accent with a contrast check
- 6 Google Fonts pairings and the emphasis style for headline words
- hero layout, headline, demo story, line style and line colors
- corners, card style, section rhythm, paper texture, grid overlay, platform icon style
- motion level (Still → Bold; the OS reduced-motion setting always wins)

Your choice is saved in the browser and applied before first paint. **Copy share link**
gives a URL like `/?look=signal.interchange.route…` that opens the page in exactly that
look, and **Config JSON** copies the full choice.

### Locking in a final look

1. Pick a look in the Studio and copy its config JSON.
2. Put those values in `defaultLook` in `lib/studio/look.ts`.
3. Remove unused faces from `lib/fonts.ts` and `lib/studio/font-pairings.ts` (each one
   only downloads when selected, but trimming keeps the CSS small).
4. Hide the Studio for launch with `NEXT_PUBLIC_STUDIO=0` at build time.

## Where things are

| Path | What |
| --- | --- |
| `lib/capabilities.ts` | What each platform really supports. Every section reads from here. Check the app/API code before changing it. |
| `lib/studio/` | Palettes, font pairings, the Look model, share links, the pre-paint boot script |
| `lib/transit/geometry.ts` | Route builders (transit 45°, right angles, patch cords) and packet lookup tables |
| `components/transit/` | Legend glyphs, transit lines, station roundels |
| `components/hero/`, `lib/hero/` | The interactive hero: composer, hub, board, routing machine, demo scripts |
| `components/sections/` | §01–§11 |
| `components/chrome/` | Nav, footer, grid overlay |
| `app/globals.css` | Tailwind tokens and Studio-driven component styles |

## Honesty rules for copy

The page only claims what the product does today (October 2026):

- The AI agent answers **Instagram and Messenger DMs** only.
- Broadcasts publish to **Instagram, Facebook Pages, Threads, X and LinkedIn** (LinkedIn is text-only).
- Comment → DM automations are **Instagram-only**; Facebook and Threads get keyword reply/delete.
- WhatsApp templates can be drafted and submitted for review, not sent.
- Numbers on the page are a demo workspace and are labelled as such.
