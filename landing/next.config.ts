import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML in out/ so the landing can sit on any CDN, separate from the app.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
};

export default nextConfig;
