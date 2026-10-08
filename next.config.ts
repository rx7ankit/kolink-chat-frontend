import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Staging is reverse-proxied on this host; next dev blocks /_next chunks without it.
  allowedDevOrigins: ["kolinkchat-dev.kolink.tech", "43.199.33.177"],
};

export default nextConfig;
