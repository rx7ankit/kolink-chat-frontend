#!/usr/bin/env node
/**
 * Tiny static server for the composition (no deps).
 *   /            → film/src
 *   /media/...   → ../public/media (the landing page's photos and Reel, read-only)
 *   /reel/...    → film/.frames/reel (Reel frames extracted by the render script)
 *   /audio/...   → film/audio
 * Run directly (`pnpm preview`) to open http://localhost:4173/?preview in a browser.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MOUNTS = [
  ["/media/", resolve(root, "../public/media")],
  ["/reel/", join(root, ".frames/reel")],
  ["/audio/", join(root, "audio")],
  ["/", join(root, "src")],
];
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
};

export function startServer(port = 0) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    let path = decodeURIComponent(url.pathname);
    if (path === "/") path = "/index.html";
    if (path === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    const mount = MOUNTS.find(([prefix]) => path.startsWith(prefix));
    const base = mount[1];
    const file = normalize(join(base, path.slice(mount[0].length)));
    if (!file.startsWith(base) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(port, "127.0.0.1", () => ok({ server, port: server.address().port })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { port } = await startServer(Number(process.env.PORT ?? 4173));
  console.log(`film preview: http://localhost:${port}/?preview   (vertical: /?preview&format=9x16, still: /?t=12.5)`);
}
