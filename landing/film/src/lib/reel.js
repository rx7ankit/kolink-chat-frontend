/**
 * The "Linen drop" Reel (public/media/reel-linen.mp4) as pre-extracted frames.
 * scripts/render.mjs extracts them with ffmpeg into .frames/reel/ and serves them at /reel/.
 * Frames are decoded up front, so drawing one is synchronous and exact for any t.
 */
export function loadReel() {
  const frames = [];
  let fps = 30;
  const ready = (async () => {
    const res = await fetch("/reel/manifest.json");
    if (!res.ok) throw new Error("reel frames missing: run the render script once (it extracts them)");
    const m = await res.json();
    fps = m.fps;
    await Promise.all(
      Array.from({ length: m.count }, async (_, i) => {
        const img = new Image();
        img.src = `/reel/${String(i + 1).padStart(4, "0")}.jpg`;
        await img.decode();
        frames[i] = img;
      }),
    );
  })();
  return {
    ready,
    poster: "/media/reel-linen-poster.webp",
    /** Draw the frame for local time `lt` (seconds since the Reel started) into a canvas, cover-fit. */
    draw(canvas, lt) {
      if (!frames.length) return;
      const n = frames.length;
      const i = ((Math.floor(Math.max(0, lt) * fps) % n) + n) % n;
      const img = frames[i];
      const c = canvas.getContext("2d");
      const cw = canvas.width;
      const ch = canvas.height;
      const k = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * k;
      const h = img.naturalHeight * k;
      c.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    },
  };
}
